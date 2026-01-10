// backend/src/controllers/faultsController.js
const { Fault, Person, Project, sequelize } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all faults with filtering
// @route   GET /api/faults
exports.getAllFaults = async (req, res) => {
  try {
    const { project_id, status, severity, assigned_to, fault_type, search } = req.query;
    
    let whereClause = {};
    
    if (project_id) whereClause.project_id = project_id;
    if (status) whereClause.status = status;
    if (severity) whereClause.severity = severity;
    if (assigned_to) whereClause.assigned_to = assigned_to;
    if (fault_type) whereClause.fault_type = fault_type;
    
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { fault_number: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const faults = await Fault.findAll({
      where: whereClause,
      include: [
        { 
          association: 'project', 
          attributes: ['project_id', 'project_code', 'project_name'] 
        },
        { 
          association: 'assignee', 
          attributes: ['person_id', 'full_name', 'email'] 
        },
        { 
          association: 'reporter', 
          attributes: ['person_id', 'full_name', 'email'] 
        }
      ],
      order: [['reported_date', 'DESC']]
    });
    
    res.json({
      success: true,
      count: faults.length,
      data: faults
    });
  } catch (error) {
    console.error('Error fetching faults:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching faults',
      error: error.message
    });
  }
};

// @desc    Get fault by ID with full details
// @route   GET /api/faults/:id
exports.getFaultById = async (req, res) => {
  try {
    const fault = await Fault.findByPk(req.params.id, {
      include: [
        { 
          association: 'project', 
          attributes: ['project_id', 'project_code', 'project_name'] 
        },
        { 
          association: 'assignee', 
          attributes: ['person_id', 'full_name', 'email', 'department'] 
        },
        { 
          association: 'reporter', 
          attributes: ['person_id', 'full_name', 'email', 'department'] 
        }
      ]
    });
    
    if (!fault) {
      return res.status(404).json({
        success: false,
        message: 'Fault not found'
      });
    }
    
    // Get actions
    const actions = await sequelize.query(`
      SELECT 
        fa.*,
        assignee.full_name as assigned_to_name,
        creator.full_name as created_by_name
      FROM fault_actions fa
      LEFT JOIN people assignee ON fa.assigned_to = assignee.person_id
      LEFT JOIN people creator ON fa.created_by = creator.person_id
      WHERE fa.fault_id = ?
      ORDER BY fa.created_date DESC
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.SELECT
    });
    
    // Get log entries
    const logEntries = await sequelize.query(`
      SELECT 
        fl.*,
        p.full_name as logged_by_name
      FROM fault_log fl
      LEFT JOIN people p ON fl.logged_by = p.person_id
      WHERE fl.fault_id = ?
      ORDER BY fl.log_date DESC
      LIMIT 20
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({
      success: true,
      data: {
        ...fault.toJSON(),
        actions: actions || [],
        log: logEntries || []
      }
    });
  } catch (error) {
    console.error('Error fetching fault:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fault',
      error: error.message
    });
  }
};

// @desc    Create new fault
// @route   POST /api/faults
exports.createFault = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const fault = await Fault.create(req.body, { transaction });
    
    // Create initial log entry
    await sequelize.query(`
      INSERT INTO fault_log (fault_id, logged_by, log_type, new_status, comments)
      VALUES (?, ?, 'Created', ?, 'Fault reported')
    `, {
      replacements: [
        fault.fault_id, 
        req.body.reported_by || null, 
        fault.status
      ],
      transaction
    });
    
    await transaction.commit();
    
    res.status(201).json({
      success: true,
      message: 'Fault created successfully',
      data: fault
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating fault:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Fault number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating fault',
      error: error.message
    });
  }
};

// @desc    Update fault
// @route   PUT /api/faults/:id
exports.updateFault = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const fault = await Fault.findByPk(req.params.id, { transaction });
    
    if (!fault) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Fault not found'
      });
    }
    
    const oldStatus = fault.status;
    const oldSeverity = fault.severity;
    
    await fault.update(req.body, { transaction });
    
    // Track status changes
    if (req.body.status && req.body.status !== oldStatus) {
      await sequelize.query(`
        INSERT INTO fault_log (fault_id, logged_by, log_type, previous_status, new_status, comments)
        VALUES (?, ?, 'Status Change', ?, ?, ?)
      `, {
        replacements: [
          fault.fault_id,
          req.body.updated_by || null,
          oldStatus,
          req.body.status,
          req.body.status_comment || `Status changed from ${oldStatus} to ${req.body.status}`
        ],
        transaction
      });
    }
    
    // Track severity changes
    if (req.body.severity && req.body.severity !== oldSeverity) {
      await sequelize.query(`
        INSERT INTO fault_log (fault_id, logged_by, log_type, comments)
        VALUES (?, ?, 'Updated', ?)
      `, {
        replacements: [
          fault.fault_id,
          req.body.updated_by || null,
          `Severity changed from ${oldSeverity} to ${req.body.severity}`
        ],
        transaction
      });
    }
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Fault updated successfully',
      data: fault
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating fault:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating fault',
      error: error.message
    });
  }
};

// @desc    Delete fault
// @route   DELETE /api/faults/:id
exports.deleteFault = async (req, res) => {
  try {
    const fault = await Fault.findByPk(req.params.id);
    
    if (!fault) {
      return res.status(404).json({
        success: false,
        message: 'Fault not found'
      });
    }
    
    await fault.destroy();
    
    res.json({
      success: true,
      message: 'Fault deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting fault:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting fault',
      error: error.message
    });
  }
};

// =====================================================
// FAULT ACTIONS
// =====================================================

exports.getFaultActions = async (req, res) => {
  try {
    const actions = await sequelize.query(`
      SELECT 
        fa.*,
        assignee.full_name as assigned_to_name,
        creator.full_name as created_by_name
      FROM fault_actions fa
      LEFT JOIN people assignee ON fa.assigned_to = assignee.person_id
      LEFT JOIN people creator ON fa.created_by = creator.person_id
      WHERE fa.fault_id = ?
      ORDER BY fa.status, fa.due_date ASC
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
    console.error('Error fetching fault actions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fault actions',
      error: error.message
    });
  }
};

exports.createFaultAction = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const fault = await Fault.findByPk(req.params.id);
    if (!fault) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Fault not found'
      });
    }
    
    const [result] = await sequelize.query(`
      INSERT INTO fault_actions 
        (fault_id, action_description, action_type, assigned_to, created_by, 
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
      INSERT INTO fault_log (fault_id, logged_by, log_type, comments)
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
    console.error('Error creating fault action:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating fault action',
      error: error.message
    });
  }
};

exports.updateFaultAction = async (req, res) => {
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
      UPDATE fault_actions 
      SET ${updates.join(', ')}
      WHERE action_id = ? AND fault_id = ?
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
    console.error('Error updating fault action:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating fault action',
      error: error.message
    });
  }
};

exports.deleteFaultAction = async (req, res) => {
  try {
    const [result] = await sequelize.query(`
      DELETE FROM fault_actions 
      WHERE action_id = ? AND fault_id = ?
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
    console.error('Error deleting fault action:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting fault action',
      error: error.message
    });
  }
};

// =====================================================
// FAULT LOG
// =====================================================

exports.getFaultLog = async (req, res) => {
  try {
    const logEntries = await sequelize.query(`
      SELECT 
        fl.*,
        p.full_name as logged_by_name
      FROM fault_log fl
      LEFT JOIN people p ON fl.logged_by = p.person_id
      WHERE fl.fault_id = ?
      ORDER BY fl.log_date DESC
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
    console.error('Error fetching fault log:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching fault log',
      error: error.message
    });
  }
};

exports.addFaultLogEntry = async (req, res) => {
  try {
    await sequelize.query(`
      INSERT INTO fault_log (fault_id, logged_by, log_type, comments)
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