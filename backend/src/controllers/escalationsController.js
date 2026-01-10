// backend/src/controllers/escalationsController.js
const { Escalation, Person, Project, sequelize } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all escalations with filtering
// @route   GET /api/escalations
exports.getAllEscalations = async (req, res) => {
  try {
    const { project_id, status, severity, escalated_to, search } = req.query;
    
    let whereClause = {};
    
    if (project_id) whereClause.project_id = project_id;
    if (status) whereClause.status = status;
    if (severity) whereClause.severity = severity;
    if (escalated_to) whereClause.escalated_to = escalated_to;
    
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { escalation_number: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const escalations = await Escalation.findAll({
      where: whereClause,
      include: [
        { 
          association: 'project', 
          attributes: ['project_id', 'project_code', 'project_name'] 
        },
        { 
          association: 'escalatee', 
          attributes: ['person_id', 'full_name', 'email'] 
        },
        { 
          association: 'raiser', 
          attributes: ['person_id', 'full_name', 'email'] 
        }
      ],
      order: [['raised_date', 'DESC']]
    });
    
    res.json({
      success: true,
      count: escalations.length,
      data: escalations
    });
  } catch (error) {
    console.error('Error fetching escalations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching escalations',
      error: error.message
    });
  }
};

// @desc    Get escalation by ID with full details
// @route   GET /api/escalations/:id
exports.getEscalationById = async (req, res) => {
  try {
    const escalation = await Escalation.findByPk(req.params.id, {
      include: [
        { 
          association: 'project', 
          attributes: ['project_id', 'project_code', 'project_name'] 
        },
        { 
          association: 'escalatee', 
          attributes: ['person_id', 'full_name', 'email', 'department'] 
        },
        { 
          association: 'raiser', 
          attributes: ['person_id', 'full_name', 'email', 'department'] 
        }
      ]
    });
    
    if (!escalation) {
      return res.status(404).json({
        success: false,
        message: 'Escalation not found'
      });
    }
    
    // Get actions
    const actions = await sequelize.query(`
      SELECT 
        ea.*,
        assignee.full_name as assigned_to_name,
        creator.full_name as created_by_name
      FROM escalation_actions ea
      LEFT JOIN people assignee ON ea.assigned_to = assignee.person_id
      LEFT JOIN people creator ON ea.created_by = creator.person_id
      WHERE ea.escalation_id = ?
      ORDER BY ea.created_date DESC
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.SELECT
    });
    
    // Get log entries
    const logEntries = await sequelize.query(`
      SELECT 
        el.*,
        p.full_name as logged_by_name
      FROM escalation_log el
      LEFT JOIN people p ON el.logged_by = p.person_id
      WHERE el.escalation_id = ?
      ORDER BY el.log_date DESC
      LIMIT 20
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({
      success: true,
      data: {
        ...escalation.toJSON(),
        actions: actions || [],
        log: logEntries || []
      }
    });
  } catch (error) {
    console.error('Error fetching escalation:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching escalation',
      error: error.message
    });
  }
};

// @desc    Create new escalation
// @route   POST /api/escalations
exports.createEscalation = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const escalation = await Escalation.create(req.body, { transaction });
    
    // Create initial log entry
    await sequelize.query(`
      INSERT INTO escalation_log (escalation_id, logged_by, log_type, new_status, comments)
      VALUES (?, ?, 'Created', ?, 'Escalation raised')
    `, {
      replacements: [
        escalation.escalation_id, 
        req.body.raised_by || null, 
        escalation.status
      ],
      transaction
    });
    
    await transaction.commit();
    
    res.status(201).json({
      success: true,
      message: 'Escalation created successfully',
      data: escalation
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating escalation:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Escalation number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating escalation',
      error: error.message
    });
  }
};

// @desc    Update escalation
// @route   PUT /api/escalations/:id
exports.updateEscalation = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const escalation = await Escalation.findByPk(req.params.id, { transaction });
    
    if (!escalation) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Escalation not found'
      });
    }
    
    const oldStatus = escalation.status;
    
    await escalation.update(req.body, { transaction });
    
    // Track status changes
    if (req.body.status && req.body.status !== oldStatus) {
      await sequelize.query(`
        INSERT INTO escalation_log (escalation_id, logged_by, log_type, previous_status, new_status, comments)
        VALUES (?, ?, 'Status Change', ?, ?, ?)
      `, {
        replacements: [
          escalation.escalation_id,
          req.body.updated_by || null,
          oldStatus,
          req.body.status,
          req.body.status_comment || `Status changed from ${oldStatus} to ${req.body.status}`
        ],
        transaction
      });
    }
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Escalation updated successfully',
      data: escalation
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating escalation:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating escalation',
      error: error.message
    });
  }
};

// @desc    Delete escalation
// @route   DELETE /api/escalations/:id
exports.deleteEscalation = async (req, res) => {
  try {
    const escalation = await Escalation.findByPk(req.params.id);
    
    if (!escalation) {
      return res.status(404).json({
        success: false,
        message: 'Escalation not found'
      });
    }
    
    await escalation.destroy();
    
    res.json({
      success: true,
      message: 'Escalation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting escalation:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting escalation',
      error: error.message
    });
  }
};

// =====================================================
// ESCALATION ACTIONS
// =====================================================

exports.getEscalationActions = async (req, res) => {
  try {
    const actions = await sequelize.query(`
      SELECT 
        ea.*,
        assignee.full_name as assigned_to_name,
        creator.full_name as created_by_name
      FROM escalation_actions ea
      LEFT JOIN people assignee ON ea.assigned_to = assignee.person_id
      LEFT JOIN people creator ON ea.created_by = creator.person_id
      WHERE ea.escalation_id = ?
      ORDER BY ea.status, ea.due_date ASC
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({
      success: true,
      count: actions.length,
      data: actions
    });
  } catch (error) {
    console.error('Error fetching escalation actions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching escalation actions',
      error: error.message
    });
  }
};

exports.createEscalationAction = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const escalation = await Escalation.findByPk(req.params.id);
    if (!escalation) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Escalation not found'
      });
    }
    
    const [result] = await sequelize.query(`
      INSERT INTO escalation_actions 
        (escalation_id, action_description, action_type, assigned_to, created_by, 
         created_date, due_date, status, priority, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, {
      replacements: [
        req.params.id,
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
      transaction,
      type: sequelize.QueryTypes.INSERT
    });
    
    const actionId = result.insertId || result;
    
    await sequelize.query(`
      INSERT INTO escalation_log (escalation_id, logged_by, log_type, comments)
      VALUES (?, ?, 'Comment', ?)
    `, {
      replacements: [
        req.params.id,
        req.body.created_by || null,
        `Action created: ${req.body.action_description.substring(0, 100)}`
      ],
      transaction
    });
    
    await transaction.commit();
    
    res.status(201).json({
      success: true,
      message: 'Action created successfully',
      data: { action_id: actionId }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating escalation action:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating escalation action',
      error: error.message
    });
  }
};

exports.updateEscalationAction = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const updates = [];
    const values = [];
    
    if (req.body.action_description) {
      updates.push('action_description = ?');
      values.push(req.body.action_description);
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
    if (req.body.notes !== undefined) {
      updates.push('notes = ?');
      values.push(req.body.notes);
    }
    
    if (updates.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    values.push(req.params.actionId);
    values.push(req.params.id);
    
    await sequelize.query(`
      UPDATE escalation_actions 
      SET ${updates.join(', ')}
      WHERE action_id = ? AND escalation_id = ?
    `, {
      replacements: values,
      transaction
    });
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Action updated successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating escalation action:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating escalation action',
      error: error.message
    });
  }
};

exports.deleteEscalationAction = async (req, res) => {
  try {
    const [result] = await sequelize.query(`
      DELETE FROM escalation_actions 
      WHERE action_id = ? AND escalation_id = ?
    `, {
      replacements: [req.params.actionId, req.params.id]
    });
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Action not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Action deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting escalation action:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting escalation action',
      error: error.message
    });
  }
};

// =====================================================
// ESCALATION LOG
// =====================================================

exports.getEscalationLog = async (req, res) => {
  try {
    const logEntries = await sequelize.query(`
      SELECT 
        el.*,
        p.full_name as logged_by_name
      FROM escalation_log el
      LEFT JOIN people p ON el.logged_by = p.person_id
      WHERE el.escalation_id = ?
      ORDER BY el.log_date DESC
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({
      success: true,
      count: logEntries.length,
      data: logEntries
    });
  } catch (error) {
    console.error('Error fetching escalation log:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching escalation log',
      error: error.message
    });
  }
};

exports.addEscalationLogEntry = async (req, res) => {
  try {
    await sequelize.query(`
      INSERT INTO escalation_log (escalation_id, logged_by, log_type, comments)
      VALUES (?, ?, 'Comment', ?)
    `, {
      replacements: [
        req.params.id,
        req.body.logged_by || null,
        req.body.comments
      ]
    });
    
    res.status(201).json({
      success: true,
      message: 'Log entry added successfully'
    });
  } catch (error) {
    console.error('Error adding log entry:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding log entry',
      error: error.message
    });
  }
};