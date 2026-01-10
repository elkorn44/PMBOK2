// backend/src/controllers/actionLogsController.js
const { sequelize } = require('../models');
const { Op } = require('sequelize');

// =====================================================
// ACTION LOG HEADERS (Top-level action logs)
// =====================================================

// @desc    Get all action logs with filtering
// @route   GET /api/action-logs?project_id=1&status=Active&search=meeting
exports.getAllActionLogs = async (req, res) => {
  try {
    const { project_id, status, search } = req.query;
    
    let whereClause = "WHERE 1=1";
    let replacements = [];
    
    if (project_id) {
      whereClause += " AND alh.project_id = ?";
      replacements.push(project_id);
    }
    
    if (status) {
      whereClause += " AND alh.status = ?";
      replacements.push(status);
    }
    
    if (search) {
      whereClause += " AND (alh.log_name LIKE ? OR alh.log_number LIKE ? OR alh.description LIKE ?)";
      const searchTerm = `%${search}%`;
      replacements.push(searchTerm, searchTerm, searchTerm);
    }
    
    const actionLogs = await sequelize.query(`
      SELECT 
        alh.*,
        p.project_name,
        p.project_code,
        creator.full_name as created_by_name,
        COUNT(DISTINCT ali.action_item_id) as total_items,
        SUM(CASE WHEN ali.status = 'Completed' THEN 1 ELSE 0 END) as completed_items,
        SUM(CASE WHEN ali.status IN ('Pending', 'In Progress', 'On Hold') THEN 1 ELSE 0 END) as active_items
      FROM action_log_headers alh
      LEFT JOIN projects p ON alh.project_id = p.project_id
      LEFT JOIN people creator ON alh.created_by = creator.person_id
      LEFT JOIN action_log_items ali ON alh.action_log_id = ali.action_log_id
      ${whereClause}
      GROUP BY alh.action_log_id
      ORDER BY alh.created_at DESC
    `, {
      replacements,
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({
      success: true,
      count: actionLogs.length,
      data: actionLogs
    });
  } catch (error) {
    console.error('Error fetching action logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching action logs',
      error: error.message
    });
  }
};

// @desc    Get action log by ID with all items
// @route   GET /api/action-logs/:id
exports.getActionLogById = async (req, res) => {
  try {
    const actionLog = await sequelize.query(`
      SELECT 
        alh.*,
        p.project_name,
        p.project_code,
        creator.full_name as created_by_name
      FROM action_log_headers alh
      LEFT JOIN projects p ON alh.project_id = p.project_id
      LEFT JOIN people creator ON alh.created_by = creator.person_id
      WHERE alh.action_log_id = ?
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.SELECT
    });
    
    if (!actionLog || actionLog.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Action log not found'
      });
    }
    
    // Get all items for this log
    const items = await sequelize.query(`
      SELECT 
        ali.*,
        assignee.full_name as assigned_to_name,
        creator.full_name as created_by_name
      FROM action_log_items ali
      LEFT JOIN people assignee ON ali.assigned_to = assignee.person_id
      LEFT JOIN people creator ON ali.created_by = creator.person_id
      WHERE ali.action_log_id = ?
      ORDER BY 
        CASE ali.status 
          WHEN 'Pending' THEN 1
          WHEN 'In Progress' THEN 2
          WHEN 'On Hold' THEN 3
          WHEN 'Completed' THEN 4
          WHEN 'Cancelled' THEN 5
        END,
        ali.due_date ASC
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.SELECT
    });
    
    // Get requirements for each item
    const itemsWithRequirements = await Promise.all(
      items.map(async (item) => {
        const requirements = await sequelize.query(`
          SELECT 
            ar.*,
            completer.full_name as completed_by_name
          FROM action_requirements ar
          LEFT JOIN people completer ON ar.completed_by = completer.person_id
          WHERE ar.action_item_id = ?
          ORDER BY ar.sequence_order ASC
        `, {
          replacements: [item.action_item_id],
          type: sequelize.QueryTypes.SELECT
        });
        
        return {
          ...item,
          requirements: requirements || []
        };
      })
    );
    
    res.json({
      success: true,
      data: {
        ...actionLog[0],
        items: itemsWithRequirements
      }
    });
  } catch (error) {
    console.error('Error fetching action log:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching action log',
      error: error.message
    });
  }
};

// @desc    Create new action log
// @route   POST /api/action-logs
exports.createActionLog = async (req, res) => {
  try {
    const [result] = await sequelize.query(`
      INSERT INTO action_log_headers (project_id, log_number, log_name, description, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `, {
      replacements: [
        req.body.project_id,
        req.body.log_number,
        req.body.log_name,
        req.body.description || null,
        req.body.status || 'Active',
        req.body.created_by || null
      ],
      type: sequelize.QueryTypes.INSERT
    });
    
    const actionLogId = result;
    
    res.status(201).json({
      success: true,
      message: 'Action log created successfully',
      data: { action_log_id: actionLogId }
    });
  } catch (error) {
    console.error('Error creating action log:', error);
    
    if (error.original && error.original.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Action log number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating action log',
      error: error.message
    });
  }
};

// @desc    Update action log
// @route   PUT /api/action-logs/:id
exports.updateActionLog = async (req, res) => {
  try {
    const updates = [];
    const values = [];
    
    if (req.body.log_name) {
      updates.push('log_name = ?');
      values.push(req.body.log_name);
    }
    if (req.body.description !== undefined) {
      updates.push('description = ?');
      values.push(req.body.description);
    }
    if (req.body.status) {
      updates.push('status = ?');
      values.push(req.body.status);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    values.push(req.params.id);
    
    await sequelize.query(`
      UPDATE action_log_headers 
      SET ${updates.join(', ')}
      WHERE action_log_id = ?
    `, { replacements: values });
    
    res.json({
      success: true,
      message: 'Action log updated successfully'
    });
  } catch (error) {
    console.error('Error updating action log:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating action log',
      error: error.message
    });
  }
};

// @desc    Delete action log
// @route   DELETE /api/action-logs/:id
exports.deleteActionLog = async (req, res) => {
  try {
    const [result] = await sequelize.query(`
      DELETE FROM action_log_headers WHERE action_log_id = ?
    `, { replacements: [req.params.id] });
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Action log not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Action log deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting action log:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting action log',
      error: error.message
    });
  }
};

// =====================================================
// ACTION LOG ITEMS
// =====================================================

// @desc    Get all items for an action log
// @route   GET /api/action-logs/:id/items
exports.getActionLogItems = async (req, res) => {
  try {
    const items = await sequelize.query(`
      SELECT 
        ali.*,
        assignee.full_name as assigned_to_name,
        assignee.email as assigned_to_email,
        creator.full_name as created_by_name
      FROM action_log_items ali
      LEFT JOIN people assignee ON ali.assigned_to = assignee.person_id
      LEFT JOIN people creator ON ali.created_by = creator.person_id
      WHERE ali.action_log_id = ?
      ORDER BY 
        CASE ali.status 
          WHEN 'Pending' THEN 1
          WHEN 'In Progress' THEN 2
          WHEN 'On Hold' THEN 3
          WHEN 'Completed' THEN 4
          WHEN 'Cancelled' THEN 5
        END,
        ali.due_date ASC
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    console.error('Error fetching action log items:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching action log items',
      error: error.message
    });
  }
};

// @desc    Create action log item
// @route   POST /api/action-logs/:id/items
exports.createActionLogItem = async (req, res) => {
  try {
    const [result] = await sequelize.query(`
      INSERT INTO action_log_items 
        (action_log_id, action_number, action_description, action_type, 
         assigned_to, created_by, created_date, due_date, status, priority, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, {
      replacements: [
        req.params.id,
        req.body.action_number || null,
        req.body.action_description,
        req.body.action_type || null,
        req.body.assigned_to || null,
        req.body.created_by || null,
        req.body.created_date || new Date().toISOString().split('T')[0],
        req.body.due_date || null,
        req.body.status || 'Pending',
        req.body.priority || 'Medium',
        req.body.notes || null
      ],
      type: sequelize.QueryTypes.INSERT
    });
    
    const actionItemId = result;
    
    res.status(201).json({
      success: true,
      message: 'Action item created successfully',
      data: { action_item_id: actionItemId }
    });
  } catch (error) {
    console.error('Error creating action log item:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating action log item',
      error: error.message
    });
  }
};

// @desc    Update action log item
// @route   PUT /api/action-logs/:id/items/:itemId
exports.updateActionLogItem = async (req, res) => {
  try {
    const updates = [];
    const values = [];
    
    if (req.body.action_number !== undefined) {
      updates.push('action_number = ?');
      values.push(req.body.action_number);
    }
    if (req.body.action_description) {
      updates.push('action_description = ?');
      values.push(req.body.action_description);
    }
    if (req.body.action_type !== undefined) {
      updates.push('action_type = ?');
      values.push(req.body.action_type);
    }
    if (req.body.assigned_to !== undefined) {
      updates.push('assigned_to = ?');
      values.push(req.body.assigned_to);
    }
    if (req.body.due_date !== undefined) {
      updates.push('due_date = ?');
      values.push(req.body.due_date);
    }
    if (req.body.status) {
      updates.push('status = ?');
      values.push(req.body.status);
      
      if (req.body.status === 'Completed') {
        updates.push('completed_date = ?');
        values.push(new Date().toISOString().split('T')[0]);
      }
    }
    if (req.body.priority) {
      updates.push('priority = ?');
      values.push(req.body.priority);
    }
    if (req.body.notes !== undefined) {
      updates.push('notes = ?');
      values.push(req.body.notes);
    }
    if (req.body.completion_notes !== undefined) {
      updates.push('completion_notes = ?');
      values.push(req.body.completion_notes);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    values.push(req.params.itemId);
    values.push(req.params.id);
    
    await sequelize.query(`
      UPDATE action_log_items 
      SET ${updates.join(', ')}
      WHERE action_item_id = ? AND action_log_id = ?
    `, { replacements: values });
    
    res.json({
      success: true,
      message: 'Action item updated successfully'
    });
  } catch (error) {
    console.error('Error updating action log item:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating action log item',
      error: error.message
    });
  }
};

// @desc    Delete action log item
// @route   DELETE /api/action-logs/:id/items/:itemId
exports.deleteActionLogItem = async (req, res) => {
  try {
    const [result] = await sequelize.query(`
      DELETE FROM action_log_items 
      WHERE action_item_id = ? AND action_log_id = ?
    `, {
      replacements: [req.params.itemId, req.params.id]
    });
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Action item not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Action item deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting action log item:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting action log item',
      error: error.message
    });
  }
};

// =====================================================
// ACTION REQUIREMENTS (Sub-items/Checklist)
// =====================================================

// @desc    Get requirements for an action item
// @route   GET /api/action-logs/:id/items/:itemId/requirements
exports.getActionRequirements = async (req, res) => {
  try {
    const requirements = await sequelize.query(`
      SELECT 
        ar.*,
        completer.full_name as completed_by_name
      FROM action_requirements ar
      LEFT JOIN people completer ON ar.completed_by = completer.person_id
      WHERE ar.action_item_id = ?
      ORDER BY ar.sequence_order ASC
    `, {
      replacements: [req.params.itemId],
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({
      success: true,
      count: requirements.length,
      data: requirements
    });
  } catch (error) {
    console.error('Error fetching action requirements:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching action requirements',
      error: error.message
    });
  }
};

// @desc    Create action requirement
// @route   POST /api/action-logs/:id/items/:itemId/requirements
exports.createActionRequirement = async (req, res) => {
  try {
    const [result] = await sequelize.query(`
      INSERT INTO action_requirements 
        (action_item_id, requirement_description, sequence_order, status, notes)
      VALUES (?, ?, ?, ?, ?)
    `, {
      replacements: [
        req.params.itemId,
        req.body.requirement_description,
        req.body.sequence_order || null,
        req.body.status || 'Pending',
        req.body.notes || null
      ],
      type: sequelize.QueryTypes.INSERT
    });
    
    const requirementId = result;
    
    res.status(201).json({
      success: true,
      message: 'Requirement created successfully',
      data: { requirement_id: requirementId }
    });
  } catch (error) {
    console.error('Error creating action requirement:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating action requirement',
      error: error.message
    });
  }
};

// @desc    Update action requirement
// @route   PUT /api/action-logs/:id/items/:itemId/requirements/:reqId
exports.updateActionRequirement = async (req, res) => {
  try {
    const updates = [];
    const values = [];
    
    if (req.body.requirement_description) {
      updates.push('requirement_description = ?');
      values.push(req.body.requirement_description);
    }
    if (req.body.sequence_order !== undefined) {
      updates.push('sequence_order = ?');
      values.push(req.body.sequence_order);
    }
    if (req.body.status) {
      updates.push('status = ?');
      values.push(req.body.status);
      
      if (req.body.status === 'Completed') {
        updates.push('completed_by = ?');
        updates.push('completed_date = ?');
        values.push(req.body.completed_by || null);
        values.push(new Date().toISOString().split('T')[0]);
      }
    }
    if (req.body.notes !== undefined) {
      updates.push('notes = ?');
      values.push(req.body.notes);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    values.push(req.params.reqId);
    values.push(req.params.itemId);
    
    await sequelize.query(`
      UPDATE action_requirements 
      SET ${updates.join(', ')}
      WHERE requirement_id = ? AND action_item_id = ?
    `, { replacements: values });
    
    res.json({
      success: true,
      message: 'Requirement updated successfully'
    });
  } catch (error) {
    console.error('Error updating action requirement:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating action requirement',
      error: error.message
    });
  }
};

// @desc    Delete action requirement
// @route   DELETE /api/action-logs/:id/items/:itemId/requirements/:reqId
exports.deleteActionRequirement = async (req, res) => {
  try {
    const [result] = await sequelize.query(`
      DELETE FROM action_requirements 
      WHERE requirement_id = ? AND action_item_id = ?
    `, {
      replacements: [req.params.reqId, req.params.itemId]
    });
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Requirement not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Requirement deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting action requirement:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting action requirement',
      error: error.message
    });
  }
};

module.exports = exports;
