 // backend/src/controllers/changesController.js
const { Change, Person, Project, sequelize } = require('../models');
const { Op } = require('sequelize');

// =====================================================
// CHANGES CRUD
// =====================================================

// @desc    Get all changes with filtering
// @route   GET /api/changes?project_id=1&status=Approved&change_type=Scope
exports.getAllChanges = async (req, res) => {
  try {
    const { project_id, status, change_type, priority, requested_by, search } = req.query;
    
    let whereClause = {};
    
    if (project_id) whereClause.project_id = project_id;
    if (status) whereClause.status = status;
    if (change_type) whereClause.change_type = change_type;
    if (priority) whereClause.priority = priority;
    if (requested_by) whereClause.requested_by = requested_by;
    
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { change_number: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const changes = await Change.findAll({
      where: whereClause,
      include: [
        { 
          association: 'project', 
          attributes: ['project_id', 'project_code', 'project_name'] 
        },
        { 
          association: 'requester', 
          attributes: ['person_id', 'full_name', 'email'] 
        },
        { 
          association: 'approver', 
          attributes: ['person_id', 'full_name', 'email'] 
        }
      ],
      order: [['request_date', 'DESC']]
    });
    
    res.json({
      success: true,
      count: changes.length,
      data: changes
    });
  } catch (error) {
    console.error('Error fetching changes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching changes',
      error: error.message
    });
  }
};

// @desc    Get change by ID with full details
// @route   GET /api/changes/:id
exports.getChangeById = async (req, res) => {
  try {
    const change = await Change.findByPk(req.params.id, {
      include: [
        { 
          association: 'project', 
          attributes: ['project_id', 'project_code', 'project_name'] 
        },
        { 
          association: 'requester', 
          attributes: ['person_id', 'full_name', 'email', 'department'] 
        },
        { 
          association: 'approver', 
          attributes: ['person_id', 'full_name', 'email', 'department'] 
        }
      ]
    });
    
    if (!change) {
      return res.status(404).json({
        success: false,
        message: 'Change not found'
      });
    }
    
    // Get implementation actions
    const actions = await sequelize.query(`
      SELECT 
        ca.*,
        assignee.full_name as assigned_to_name,
        creator.full_name as created_by_name
      FROM change_actions ca
      LEFT JOIN people assignee ON ca.assigned_to = assignee.person_id
      LEFT JOIN people creator ON ca.created_by = creator.person_id
      WHERE ca.change_id = ?
      ORDER BY ca.created_date DESC
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.SELECT
    });
    
    // Get log entries
    const logEntries = await sequelize.query(`
      SELECT 
        cl.*,
        p.full_name as logged_by_name
      FROM change_log cl
      LEFT JOIN people p ON cl.logged_by = p.person_id
      WHERE cl.change_id = ?
      ORDER BY cl.log_date DESC
      LIMIT 20
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({
      success: true,
      data: {
        ...change.toJSON(),
        actions: actions || [],
        log: logEntries || []
      }
    });
  } catch (error) {
    console.error('Error fetching change:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching change',
      error: error.message
    });
  }
};

// @desc    Create new change request
// @route   POST /api/changes
exports.createChange = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const change = await Change.create(req.body, { transaction });
    
    // Create initial log entry
    await sequelize.query(`
      INSERT INTO change_log (change_id, logged_by, log_type, new_status, comments)
      VALUES (?, ?, 'Created', ?, ?)
    `, {
      replacements: [
        change.change_id, 
        req.body.requested_by || null, 
        change.status,
        `Change request created: ${change.change_type} - ${change.title}`
      ],
      transaction
    });
    
    await transaction.commit();
    
    res.status(201).json({
      success: true,
      message: 'Change request created successfully',
      data: change
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating change:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Change number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating change',
      error: error.message
    });
  }
};

// @desc    Update change
// @route   PUT /api/changes/:id
exports.updateChange = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const change = await Change.findByPk(req.params.id, { transaction });
    
    if (!change) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Change not found'
      });
    }
    
    // APPROVAL WORKFLOW CHECKS
    
    // Prevent direct approval without workflow
    if (req.body.status === 'Approved' && change.status !== 'Approved') {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Cannot approve change directly. Use: POST /api/changes/:id/approve'
      });
    }
    
    // Prevent direct rejection without workflow
    if (req.body.status === 'Rejected' && change.status !== 'Rejected') {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Cannot reject change directly. Use: POST /api/changes/:id/reject'
      });
    }
    
    // Prevent direct closure without approval
    if (req.body.status === 'Closed' && change.status !== 'Closed') {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Cannot close change directly. Use: POST /api/changes/:id/request-closure'
      });
    }
    
    const oldStatus = change.status;
    
    await change.update(req.body, { transaction });
    
    // Track status changes
    if (req.body.status && req.body.status !== oldStatus) {
      await sequelize.query(`
        INSERT INTO change_log (change_id, logged_by, log_type, previous_status, new_status, comments)
        VALUES (?, ?, 'Status Change', ?, ?, ?)
      `, {
        replacements: [
          change.change_id,
          req.body.updated_by || null,
          oldStatus,
          req.body.status,
          req.body.status_comment || `Status changed from ${oldStatus} to ${req.body.status}`
        ],
        transaction
      });
    }
    
    // Track impact changes
    if (req.body.cost_impact || req.body.schedule_impact_days) {
      const impactMsg = [];
      if (req.body.cost_impact) impactMsg.push(`Cost: $${req.body.cost_impact}`);
      if (req.body.schedule_impact_days) impactMsg.push(`Schedule: ${req.body.schedule_impact_days} days`);
      
      await sequelize.query(`
        INSERT INTO change_log (change_id, logged_by, log_type, comments)
        VALUES (?, ?, 'Updated', ?)
      `, {
        replacements: [
          change.change_id,
          req.body.updated_by || null,
          `Impact updated: ${impactMsg.join(', ')}`
        ],
        transaction
      });
    }
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Change updated successfully',
      data: change
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating change:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating change',
      error: error.message
    });
  }
};

// @desc    Delete change
// @route   DELETE /api/changes/:id
exports.deleteChange = async (req, res) => {
  try {
    const change = await Change.findByPk(req.params.id);
    
    if (!change) {
      return res.status(404).json({
        success: false,
        message: 'Change not found'
      });
    }
    
    await change.destroy();
    
    res.json({
      success: true,
      message: 'Change deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting change:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting change',
      error: error.message
    });
  }
};

// =====================================================
// APPROVAL WORKFLOW - INITIAL APPROVAL
// =====================================================

// @desc    Request approval for change
// @route   POST /api/changes/:id/request-approval
exports.requestChangeApproval = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const change = await Change.findByPk(req.params.id, { transaction });
    
    if (!change) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Change not found'
      });
    }
    
    // Can only request approval if in Requested status
    if (change.status !== 'Requested') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Change must be in 'Requested' status. Current status: ${change.status}`
      });
    }
    
    // Update to Under Review
    await change.update({ status: 'Under Review' }, { transaction });
    
    // Log the approval request
    await sequelize.query(`
      INSERT INTO change_log (change_id, logged_by, log_type, previous_status, new_status, comments)
      VALUES (?, ?, 'Review', 'Requested', 'Under Review', ?)
    `, {
      replacements: [
        change.change_id,
        req.body.requested_by || null,
        req.body.approval_justification || 'Change approval requested'
      ],
      transaction
    });
    
    await transaction.commit();
    
    // TODO: Send notification to approvers
    
    res.json({
      success: true,
      message: 'Change approval requested successfully',
      data: {
        change_id: change.change_id,
        change_number: change.change_number,
        status: 'Under Review',
        next_step: `Use POST /api/changes/${change.change_id}/approve or /reject`
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error requesting change approval:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting change approval',
      error: error.message
    });
  }
};

// @desc    Approve change request
// @route   POST /api/changes/:id/approve
exports.approveChange = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const change = await Change.findByPk(req.params.id, { transaction });
    
    if (!change) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Change not found'
      });
    }
    
    // Must be Under Review to approve
    if (change.status !== 'Under Review') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Change must be 'Under Review'. Current status: ${change.status}`,
        hint: 'Use POST /api/changes/:id/request-approval first'
      });
    }
    
    const oldStatus = change.status;
    
    // Approve the change
    await change.update({
      status: 'Approved',
      approved_by: req.body.approved_by || null,
      approval_date: new Date().toISOString().split('T')[0]
    }, { transaction });
    
    // Log the approval
    await sequelize.query(`
      INSERT INTO change_log (change_id, logged_by, log_type, previous_status, new_status, comments)
      VALUES (?, ?, 'Approval', ?, 'Approved', ?)
    `, {
      replacements: [
        change.change_id,
        req.body.approved_by || null,
        oldStatus,
        req.body.approval_comments || 'Change request approved'
      ],
      transaction
    });
    
    await transaction.commit();
    
    // TODO: Send notification to requester
    
    res.json({
      success: true,
      message: 'Change approved successfully',
      data: {
        change_id: change.change_id,
        change_number: change.change_number,
        status: 'Approved',
        approved_by: req.body.approved_by,
        next_step: 'Implement the change, then use POST /api/changes/:id/request-closure'
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error approving change:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving change',
      error: error.message
    });
  }
};

// @desc    Reject change request
// @route   POST /api/changes/:id/reject
exports.rejectChange = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const change = await Change.findByPk(req.params.id, { transaction });
    
    if (!change) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Change not found'
      });
    }
    
    const oldStatus = change.status;
    
    // Reject the change
    await change.update({ status: 'Rejected' }, { transaction });
    
    // Log the rejection
    await sequelize.query(`
      INSERT INTO change_log (change_id, logged_by, log_type, previous_status, new_status, comments)
      VALUES (?, ?, 'Review', ?, 'Rejected', ?)
    `, {
      replacements: [
        change.change_id,
        req.body.rejected_by || null,
        oldStatus,
        req.body.rejection_reason || 'Change request rejected'
      ],
      transaction
    });
    
    await transaction.commit();
    
    // TODO: Send notification to requester
    
    res.json({
      success: true,
      message: 'Change rejected',
      data: {
        change_id: change.change_id,
        change_number: change.change_number,
        status: 'Rejected',
        reason: req.body.rejection_reason
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error rejecting change:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting change',
      error: error.message
    });
  }
};

// =====================================================
// CLOSURE APPROVAL WORKFLOW (After Implementation)
// =====================================================

// @desc    Request closure approval (after implementation)
// @route   POST /api/changes/:id/request-closure
exports.requestChangeClosure = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const change = await Change.findByPk(req.params.id, { transaction });
    
    if (!change) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Change not found'
      });
    }
    
    // Can only request closure if Implemented
    if (change.status !== 'Implemented') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Change must be 'Implemented' to request closure. Current status: ${change.status}`,
        hint: 'Update status to Implemented first'
      });
    }
    
    // Log the closure request
    await sequelize.query(`
      INSERT INTO change_log (change_id, logged_by, log_type, comments)
      VALUES (?, ?, 'Closure Request', ?)
    `, {
      replacements: [
        change.change_id,
        req.body.requested_by || null,
        req.body.closure_justification || 'Closure requested - change has been implemented'
      ],
      transaction
    });
    
    await transaction.commit();
    
    // TODO: Send notification to approvers
    
    res.json({
      success: true,
      message: 'Change closure requested successfully',
      data: {
        change_id: change.change_id,
        change_number: change.change_number,
        status: 'Awaiting closure approval',
        next_step: `Use POST /api/changes/${change.change_id}/approve-closure to approve`
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error requesting change closure:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting change closure',
      error: error.message
    });
  }
};

// @desc    Approve change closure
// @route   POST /api/changes/:id/approve-closure
exports.approveChangeClosure = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const change = await Change.findByPk(req.params.id, { transaction });
    
    if (!change) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Change not found'
      });
    }
    
    // Check if there's a closure request
    const closureRequest = await sequelize.query(`
      SELECT * FROM change_log 
      WHERE change_id = ? AND log_type = 'Closure Request'
      ORDER BY log_date DESC
      LIMIT 1
    `, {
      replacements: [change.change_id],
      type: sequelize.QueryTypes.SELECT,
      transaction
    });
    
    if (!closureRequest || closureRequest.length === 0) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No closure request found. Use POST /api/changes/:id/request-closure first'
      });
    }
    
    const oldStatus = change.status;
    
    // Approve and close
    await change.update({ status: 'Closed' }, { transaction });
    
    // Log the approval
    await sequelize.query(`
      INSERT INTO change_log (change_id, logged_by, log_type, previous_status, new_status, comments)
      VALUES (?, ?, 'Closure Approved', ?, 'Closed', ?)
    `, {
      replacements: [
        change.change_id,
        req.body.approved_by || null,
        oldStatus,
        req.body.approval_comments || 'Change closure approved'
      ],
      transaction
    });
    
    await transaction.commit();
    
    // TODO: Send notification
    
    res.json({
      success: true,
      message: 'Change closure approved successfully',
      data: {
        change_id: change.change_id,
        change_number: change.change_number,
        status: 'Closed',
        approved_by: req.body.approved_by
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error approving change closure:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving change closure',
      error: error.message
    });
  }
};

// @desc    Reject change closure request
// @route   POST /api/changes/:id/reject-closure
exports.rejectChangeClosure = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const change = await Change.findByPk(req.params.id, { transaction });
    
    if (!change) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Change not found'
      });
    }
    
    // Log the rejection
    await sequelize.query(`
      INSERT INTO change_log (change_id, logged_by, log_type, comments)
      VALUES (?, ?, 'Closure Rejected', ?)
    `, {
      replacements: [
        change.change_id,
        req.body.rejected_by || null,
        req.body.rejection_reason || 'Change closure request rejected'
      ],
      transaction
    });
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Change closure request rejected',
      data: {
        change_id: change.change_id,
        change_number: change.change_number,
        reason: req.body.rejection_reason
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error rejecting change closure:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting change closure',
      error: error.message
    });
  }
};

// =====================================================
// CHANGE ACTIONS (Implementation Steps)
// =====================================================

// @desc    Get all implementation actions
// @route   GET /api/changes/:id/actions
exports.getChangeActions = async (req, res) => {
  try {
    const actions = await sequelize.query(`
      SELECT 
        ca.*,
        assignee.full_name as assigned_to_name,
        assignee.email as assigned_to_email,
        creator.full_name as created_by_name
      FROM change_actions ca
      LEFT JOIN people assignee ON ca.assigned_to = assignee.person_id
      LEFT JOIN people creator ON ca.created_by = creator.person_id
      WHERE ca.change_id = ?
      ORDER BY 
        CASE ca.status 
          WHEN 'Pending' THEN 1
          WHEN 'In Progress' THEN 2
          WHEN 'Completed' THEN 3
          WHEN 'Cancelled' THEN 4
        END,
        ca.due_date ASC
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
    console.error('Error fetching change actions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching change actions',
      error: error.message
    });
  }
};

// @desc    Create implementation action
// @route   POST /api/changes/:id/actions
exports.createChangeAction = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const change = await Change.findByPk(req.params.id);
    if (!change) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Change not found'
      });
    }
    
    const [result] = await sequelize.query(`
      INSERT INTO change_actions 
        (change_id, action_description, action_type, assigned_to, created_by, 
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
    
    // Log action creation
    await sequelize.query(`
      INSERT INTO change_log (change_id, logged_by, log_type, comments)
      VALUES (?, ?, 'Implementation', ?)
    `, {
      replacements: [
        req.params.id,
        req.body.created_by || null,
        `Implementation action created: ${req.body.action_description.substring(0, 100)}`
      ],
      transaction
    });
    
    await transaction.commit();
    
    res.status(201).json({
      success: true,
      message: 'Implementation action created successfully',
      data: { action_id: actionId }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating change action:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating change action',
      error: error.message
    });
  }
};

// @desc    Update change action
// @route   PUT /api/changes/:id/actions/:actionId
exports.updateChangeAction = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const currentAction = await sequelize.query(`
      SELECT status FROM change_actions WHERE action_id = ? AND change_id = ?
    `, {
      replacements: [req.params.actionId, req.params.id],
      type: sequelize.QueryTypes.SELECT,
      transaction
    });
    
    if (!currentAction || currentAction.length === 0) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Action not found'
      });
    }
    
    const oldStatus = currentAction[0].status;
    
    const updates = [];
    const values = [];
    
    if (req.body.action_description) {
      updates.push('action_description = ?');
      values.push(req.body.action_description);
    }
    if (req.body.action_type) {
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
      UPDATE change_actions 
      SET ${updates.join(', ')}
      WHERE action_id = ? AND change_id = ?
    `, {
      replacements: values,
      transaction
    });
    
    if (req.body.status && req.body.status !== oldStatus) {
      await sequelize.query(`
        INSERT INTO change_log (change_id, logged_by, log_type, comments)
        VALUES (?, ?, 'Implementation', ?)
      `, {
        replacements: [
          req.params.id,
          req.body.updated_by || null,
          `Implementation action status: ${oldStatus} → ${req.body.status}`
        ],
        transaction
      });
    }
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Action updated successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating change action:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating change action',
      error: error.message
    });
  }
};

// @desc    Delete change action
// @route   DELETE /api/changes/:id/actions/:actionId
exports.deleteChangeAction = async (req, res) => {
  try {
    const [result] = await sequelize.query(`
      DELETE FROM change_actions 
      WHERE action_id = ? AND change_id = ?
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
    console.error('Error deleting change action:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting change action',
      error: error.message
    });
  }
};

// =====================================================
// CHANGE LOG (Audit Trail)
// =====================================================

// @desc    Get change log/history
// @route   GET /api/changes/:id/log
exports.getChangeLog = async (req, res) => {
  try {
    const logEntries = await sequelize.query(`
      SELECT 
        cl.*,
        p.full_name as logged_by_name
      FROM change_log cl
      LEFT JOIN people p ON cl.logged_by = p.person_id
      WHERE cl.change_id = ?
      ORDER BY cl.log_date DESC
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
    console.error('Error fetching change log:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching change log',
      error: error.message
    });
  }
};

// @desc    Add manual log entry (comment)
// @route   POST /api/changes/:id/log
exports.addChangeLogEntry = async (req, res) => {
  try {
    await sequelize.query(`
      INSERT INTO change_log (change_id, logged_by, log_type, comments)
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