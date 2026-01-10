// backend/src/controllers/issuesController.js
const { Issue, Person, Project, sequelize } = require('../models');
const { Op } = require('sequelize');

// =====================================================
// ISSUES CRUD
// =====================================================

// @desc    Get all issues with filtering
// @route   GET /api/issues?project_id=1&status=Open&priority=High&assigned_to=2
exports.getAllIssues = async (req, res) => {
  try {
    const { project_id, status, priority, assigned_to, search } = req.query;
    
    let whereClause = {};
    
    if (project_id) whereClause.project_id = project_id;
    if (status) whereClause.status = status;
    if (priority) whereClause.priority = priority;
    if (assigned_to) whereClause.assigned_to = assigned_to;
    
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { issue_number: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const issues = await Issue.findAll({
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
          association: 'raiser', 
          attributes: ['person_id', 'full_name', 'email'] 
        }
      ],
      order: [['raised_date', 'DESC']]
    });
    
    res.json({
      success: true,
      count: issues.length,
      data: issues
    });
  } catch (error) {
    console.error('Error fetching issues:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching issues',
      error: error.message
    });
  }
};

// @desc    Get issue by ID with full details
// @route   GET /api/issues/:id
exports.getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findByPk(req.params.id, {
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
          association: 'raiser', 
          attributes: ['person_id', 'full_name', 'email', 'department'] 
        }
      ]
    });
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    // Get actions for this issue
    const actions = await sequelize.query(`
      SELECT 
        ia.*,
        assignee.full_name as assigned_to_name,
        creator.full_name as created_by_name
      FROM issue_actions ia
      LEFT JOIN people assignee ON ia.assigned_to = assignee.person_id
      LEFT JOIN people creator ON ia.created_by = creator.person_id
      WHERE ia.issue_id = ?
      ORDER BY ia.created_date DESC
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.SELECT
    });
    
    // Get log entries
    const logEntries = await sequelize.query(`
      SELECT 
        il.*,
        p.full_name as logged_by_name
      FROM issue_log il
      LEFT JOIN people p ON il.logged_by = p.person_id
      WHERE il.issue_id = ?
      ORDER BY il.log_date DESC
      LIMIT 20
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({
      success: true,
      data: {
        ...issue.toJSON(),
        actions: actions || [],
        log: logEntries || []
      }
    });
  } catch (error) {
    console.error('Error fetching issue:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching issue',
      error: error.message
    });
  }
};

// @desc    Create new issue
// @route   POST /api/issues
exports.createIssue = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const issue = await Issue.create(req.body, { transaction });
    
    // Create initial log entry
    await sequelize.query(`
      INSERT INTO issue_log (issue_id, logged_by, log_type, new_status, comments)
      VALUES (?, ?, 'Created', ?, 'Issue created')
    `, {
      replacements: [issue.issue_id, req.body.raised_by || null, issue.status],
      transaction
    });
    
    await transaction.commit();
    
    res.status(201).json({
      success: true,
      message: 'Issue created successfully',
      data: issue
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating issue:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Issue number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating issue',
      error: error.message
    });
  }
};

// @desc    Update issue
// @route   PUT /api/issues/:id
exports.updateIssue = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const issue = await Issue.findByPk(req.params.id, { transaction });
    
    if (!issue) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    const oldStatus = issue.status;
    const oldAssignee = issue.assigned_to;
    
    await issue.update(req.body, { transaction });
    
    // Track status changes
    if (req.body.status && req.body.status !== oldStatus) {
      await sequelize.query(`
        INSERT INTO issue_log (issue_id, logged_by, log_type, previous_status, new_status, comments)
        VALUES (?, ?, 'Status Change', ?, ?, ?)
      `, {
        replacements: [
          issue.issue_id, 
          req.body.updated_by || null,
          oldStatus,
          req.body.status,
          req.body.status_comment || `Status changed from ${oldStatus} to ${req.body.status}`
        ],
        transaction
      });
      
      // TODO: Send notification when status changes
    }
    
    // Track assignment changes
    if (req.body.assigned_to && req.body.assigned_to !== oldAssignee) {
      await sequelize.query(`
        INSERT INTO issue_log (issue_id, logged_by, log_type, comments)
        VALUES (?, ?, 'Assigned', ?)
      `, {
        replacements: [
          issue.issue_id,
          req.body.updated_by || null,
          `Issue assigned to person ID: ${req.body.assigned_to}`
        ],
        transaction
      });
      
      // TODO: Send notification to assignee
    }
    
    // General update log
    if (!req.body.status && !req.body.assigned_to) {
      await sequelize.query(`
        INSERT INTO issue_log (issue_id, logged_by, log_type, comments)
        VALUES (?, ?, 'Updated', 'Issue details updated')
      `, {
        replacements: [issue.issue_id, req.body.updated_by || null],
        transaction
      });
    }
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Issue updated successfully',
      data: issue
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating issue:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating issue',
      error: error.message
    });
  }
};

// @desc    Delete issue
// @route   DELETE /api/issues/:id
exports.deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findByPk(req.params.id);
    
    if (!issue) {
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    await issue.destroy();
    
    res.json({
      success: true,
      message: 'Issue deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting issue:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting issue',
      error: error.message
    });
  }
};

// =====================================================
// ISSUE ACTIONS (Nested under Issues)
// =====================================================

// @desc    Get all actions for an issue
// @route   GET /api/issues/:id/actions
exports.getIssueActions = async (req, res) => {
  try {
    const actions = await sequelize.query(`
      SELECT 
        ia.*,
        assignee.full_name as assigned_to_name,
        assignee.email as assigned_to_email,
        creator.full_name as created_by_name
      FROM issue_actions ia
      LEFT JOIN people assignee ON ia.assigned_to = assignee.person_id
      LEFT JOIN people creator ON ia.created_by = creator.person_id
      WHERE ia.issue_id = ?
      ORDER BY 
        CASE ia.status 
          WHEN 'Pending' THEN 1
          WHEN 'In Progress' THEN 2
          WHEN 'Completed' THEN 3
          WHEN 'Cancelled' THEN 4
        END,
        ia.due_date ASC
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
    console.error('Error fetching issue actions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching issue actions',
      error: error.message
    });
  }
};

// @desc    Create action for an issue
// @route   POST /api/issues/:id/actions
exports.createIssueAction = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Verify issue exists
    const issue = await Issue.findByPk(req.params.id);
    if (!issue) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Issue not found'
      });
    }
    
    const [result] = await sequelize.query(`
      INSERT INTO issue_actions 
        (issue_id, action_description, action_type, assigned_to, created_by, 
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
    
    // Get the insertId - mysql2 returns it as result.insertId or result[0]
    const actionId = result.insertId || result;
    
    // Log the action creation
    await sequelize.query(`
      INSERT INTO issue_log (issue_id, logged_by, log_type, comments)
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
    
    // TODO: Send notification to assigned person
    
    res.status(201).json({
      success: true,
      message: 'Action created successfully',
      data: { action_id: actionId }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating issue action:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating issue action',
      error: error.message
    });
  }
};

// @desc    Update issue action
// @route   PUT /api/issues/:id/actions/:actionId
exports.updateIssueAction = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Get current action to check status change
    const currentAction = await sequelize.query(`
      SELECT status FROM issue_actions WHERE action_id = ? AND issue_id = ?
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
    
    // Build UPDATE query dynamically based on provided fields
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
      
      // If marked as completed, set completed_date
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
      UPDATE issue_actions 
      SET ${updates.join(', ')}
      WHERE action_id = ? AND issue_id = ?
    `, {
      replacements: values,
      transaction
    });
    
    // Log status change
    if (req.body.status && req.body.status !== oldStatus) {
      await sequelize.query(`
        INSERT INTO issue_log (issue_id, logged_by, log_type, comments)
        VALUES (?, ?, 'Comment', ?)
      `, {
        replacements: [
          req.params.id,
          req.body.updated_by || null,
          `Action status changed from ${oldStatus} to ${req.body.status}`
        ],
        transaction
      });
      
      // TODO: Send notification on completion
    }
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Action updated successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating issue action:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating issue action',
      error: error.message
    });
  }
};

// @desc    Delete issue action
// @route   DELETE /api/issues/:id/actions/:actionId
exports.deleteIssueAction = async (req, res) => {
  try {
    const [result] = await sequelize.query(`
      DELETE FROM issue_actions 
      WHERE action_id = ? AND issue_id = ?
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
    console.error('Error deleting issue action:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting issue action',
      error: error.message
    });
  }
};

// =====================================================
// ISSUE LOG (Audit Trail)
// =====================================================

// @desc    Get issue log/history
// @route   GET /api/issues/:id/log
exports.getIssueLog = async (req, res) => {
  try {
    const logEntries = await sequelize.query(`
      SELECT 
        il.*,
        p.full_name as logged_by_name
      FROM issue_log il
      LEFT JOIN people p ON il.logged_by = p.person_id
      WHERE il.issue_id = ?
      ORDER BY il.log_date DESC
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
    console.error('Error fetching issue log:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching issue log',
      error: error.message
    });
  }
};

// @desc    Add manual log entry (comment)
// @route   POST /api/issues/:id/log
exports.addIssueLogEntry = async (req, res) => {
  try {
    await sequelize.query(`
      INSERT INTO issue_log (issue_id, logged_by, log_type, comments)
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