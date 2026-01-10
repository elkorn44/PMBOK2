// backend/src/controllers/risksController.js
const { Risk, Person, Project, sequelize } = require('../models');
const { Op } = require('sequelize');

// Risk scoring matrix
const PROBABILITY_SCORES = {
  'Very Low': 1,
  'Low': 2,
  'Medium': 3,
  'High': 4,
  'Very High': 5
};

const IMPACT_SCORES = {
  'Very Low': 1,
  'Low': 2,
  'Medium': 3,
  'High': 4,
  'Very High': 5
};

// Calculate risk score (probability × impact)
function calculateRiskScore(probability, impact) {
  return PROBABILITY_SCORES[probability] * IMPACT_SCORES[impact];
}

// =====================================================
// RISKS CRUD
// =====================================================

// @desc    Get all risks with filtering
// @route   GET /api/risks?project_id=1&status=Identified&risk_score_min=12
exports.getAllRisks = async (req, res) => {
  try {
    const { project_id, status, risk_score_min, risk_score_max, owner, search } = req.query;
    
    let whereClause = {};
    
    if (project_id) whereClause.project_id = project_id;
    if (status) whereClause.status = status;
    if (owner) whereClause.owner = owner;
    
    if (risk_score_min || risk_score_max) {
      whereClause.risk_score = {};
      if (risk_score_min) whereClause.risk_score[Op.gte] = risk_score_min;
      if (risk_score_max) whereClause.risk_score[Op.lte] = risk_score_max;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${search}%` } },
        { risk_number: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const risks = await Risk.findAll({
      where: whereClause,
      include: [
        { 
          association: 'project', 
          attributes: ['project_id', 'project_code', 'project_name'] 
        },
        { 
          association: 'riskOwner', 
          attributes: ['person_id', 'full_name', 'email'] 
        },
        { 
          association: 'identifier', 
          attributes: ['person_id', 'full_name', 'email'] 
        }
      ],
      order: [['risk_score', 'DESC'], ['identified_date', 'DESC']]
    });
    
    res.json({
      success: true,
      count: risks.length,
      data: risks
    });
  } catch (error) {
    console.error('Error fetching risks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching risks',
      error: error.message
    });
  }
};

// @desc    Get risk by ID with full details
// @route   GET /api/risks/:id
exports.getRiskById = async (req, res) => {
  try {
    const risk = await Risk.findByPk(req.params.id, {
      include: [
        { 
          association: 'project', 
          attributes: ['project_id', 'project_code', 'project_name'] 
        },
        { 
          association: 'riskOwner', 
          attributes: ['person_id', 'full_name', 'email', 'department'] 
        },
        { 
          association: 'identifier', 
          attributes: ['person_id', 'full_name', 'email', 'department'] 
        }
      ]
    });
    
    if (!risk) {
      return res.status(404).json({
        success: false,
        message: 'Risk not found'
      });
    }
    
    // Get mitigation actions
    const actions = await sequelize.query(`
      SELECT 
        ra.*,
        assignee.full_name as assigned_to_name,
        creator.full_name as created_by_name
      FROM risk_actions ra
      LEFT JOIN people assignee ON ra.assigned_to = assignee.person_id
      LEFT JOIN people creator ON ra.created_by = creator.person_id
      WHERE ra.risk_id = ?
      ORDER BY ra.created_date DESC
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.SELECT
    });
    
    // Get log entries
    const logEntries = await sequelize.query(`
      SELECT 
        rl.*,
        p.full_name as logged_by_name
      FROM risk_log rl
      LEFT JOIN people p ON rl.logged_by = p.person_id
      WHERE rl.risk_id = ?
      ORDER BY rl.log_date DESC
      LIMIT 20
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({
      success: true,
      data: {
        ...risk.toJSON(),
        actions: actions || [],
        log: logEntries || []
      }
    });
  } catch (error) {
    console.error('Error fetching risk:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching risk',
      error: error.message
    });
  }
};

// @desc    Create new risk
// @route   POST /api/risks
exports.createRisk = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Calculate risk score
    const riskScore = calculateRiskScore(
      req.body.probability || 'Medium',
      req.body.impact || 'Medium'
    );
    
    const risk = await Risk.create({
      ...req.body,
      risk_score: riskScore
    }, { transaction });
    
    // Create initial log entry
    await sequelize.query(`
      INSERT INTO risk_log (risk_id, logged_by, log_type, new_status, comments)
      VALUES (?, ?, 'Created', ?, ?)
    `, {
      replacements: [
        risk.risk_id, 
        req.body.identified_by || null, 
        risk.status,
        `Risk identified with score ${riskScore} (${req.body.probability} probability, ${req.body.impact} impact)`
      ],
      transaction
    });
    
    await transaction.commit();
    
    res.status(201).json({
      success: true,
      message: 'Risk created successfully',
      data: risk
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating risk:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Risk number already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating risk',
      error: error.message
    });
  }
};

// @desc    Update risk
// @route   PUT /api/risks/:id
exports.updateRisk = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const risk = await Risk.findByPk(req.params.id, { transaction });
    
    if (!risk) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Risk not found'
      });
    }
    
    // APPROVAL WORKFLOW CHECK: Prevent direct closure without approval
    if (req.body.status === 'Closed' && risk.status !== 'Closed') {
      await transaction.rollback();
      return res.status(403).json({
        success: false,
        message: 'Cannot close risk directly. Use the closure approval workflow: POST /api/risks/:id/request-closure'
      });
    }
    
    const oldStatus = risk.status;
    const oldProbability = risk.probability;
    const oldImpact = risk.impact;
    const oldRiskScore = risk.risk_score;
    
    // Recalculate risk score if probability or impact changed
    if (req.body.probability || req.body.impact) {
      const newProbability = req.body.probability || risk.probability;
      const newImpact = req.body.impact || risk.impact;
      req.body.risk_score = calculateRiskScore(newProbability, newImpact);
    }
    
    await risk.update(req.body, { transaction });
    
    // Track status changes
    if (req.body.status && req.body.status !== oldStatus) {
      await sequelize.query(`
        INSERT INTO risk_log (risk_id, logged_by, log_type, previous_status, new_status, comments)
        VALUES (?, ?, 'Status Change', ?, ?, ?)
      `, {
        replacements: [
          risk.risk_id,
          req.body.updated_by || null,
          oldStatus,
          req.body.status,
          req.body.status_comment || `Status changed from ${oldStatus} to ${req.body.status}`
        ],
        transaction
      });
    }
    
    // Track risk assessment changes
    if (req.body.probability || req.body.impact) {
      const scoreChanged = risk.risk_score !== oldRiskScore;
      await sequelize.query(`
        INSERT INTO risk_log (risk_id, logged_by, log_type, comments)
        VALUES (?, ?, 'Assessment', ?)
      `, {
        replacements: [
          risk.risk_id,
          req.body.updated_by || null,
          `Risk reassessed: ${oldProbability}/${oldImpact} (score: ${oldRiskScore}) → ${risk.probability}/${risk.impact} (score: ${risk.risk_score})${scoreChanged ? ' - Risk score changed!' : ''}`
        ],
        transaction
      });
      
      // TODO: Send notification if risk score increased significantly
    }
    
    // Track ownership changes
    if (req.body.owner && req.body.owner !== risk.owner) {
      await sequelize.query(`
        INSERT INTO risk_log (risk_id, logged_by, log_type, comments)
        VALUES (?, ?, 'Updated', 'Risk owner changed')
      `, {
        replacements: [risk.risk_id, req.body.updated_by || null],
        transaction
      });
      
      // TODO: Send notification to new owner
    }
    
    await transaction.commit();
    
    res.json({
      success: true,
      message: 'Risk updated successfully',
      data: risk
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating risk:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating risk',
      error: error.message
    });
  }
};

// @desc    Delete risk
// @route   DELETE /api/risks/:id
exports.deleteRisk = async (req, res) => {
  try {
    const risk = await Risk.findByPk(req.params.id);
    
    if (!risk) {
      return res.status(404).json({
        success: false,
        message: 'Risk not found'
      });
    }
    
    await risk.destroy();
    
    res.json({
      success: true,
      message: 'Risk deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting risk:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting risk',
      error: error.message
    });
  }
};

// =====================================================
// APPROVAL WORKFLOW FOR RISK CLOSURE
// =====================================================

// @desc    Request approval to close a risk
// @route   POST /api/risks/:id/request-closure
exports.requestRiskClosure = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const risk = await Risk.findByPk(req.params.id, { transaction });
    
    if (!risk) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Risk not found'
      });
    }
    
    // Can only request closure if risk is Mitigated
    if (risk.status !== 'Mitigated') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: `Risk must be in 'Mitigated' status to request closure. Current status: ${risk.status}`,
        hint: 'Update risk status to Mitigated first'
      });
    }
    
    // Create a closure request flag in the log
    await sequelize.query(`
      INSERT INTO risk_log (risk_id, logged_by, log_type, comments)
      VALUES (?, ?, 'Closure Request', ?)
    `, {
      replacements: [
        risk.risk_id,
        req.body.requested_by || null,
        req.body.closure_justification || 'Closure requested - risk has been mitigated'
      ],
      transaction
    });
    
    await transaction.commit();
    
    // TODO: Send notification to approvers
    
    res.json({
      success: true,
      message: 'Risk closure requested successfully',
      data: {
        risk_id: risk.risk_id,
        risk_number: risk.risk_number,
        status: 'Awaiting closure approval',
        next_step: `Use POST /api/risks/${risk.risk_id}/approve-closure to approve`
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error requesting risk closure:', error);
    res.status(500).json({
      success: false,
      message: 'Error requesting risk closure',
      error: error.message
    });
  }
};

// @desc    Approve risk closure (requires approval authority)
// @route   POST /api/risks/:id/approve-closure
exports.approveRiskClosure = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const risk = await Risk.findByPk(req.params.id, { transaction });
    
    if (!risk) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Risk not found'
      });
    }
    
    // Check if there's a closure request
    const [closureRequest] = await sequelize.query(`
      SELECT * FROM risk_log 
      WHERE risk_id = ? AND log_type = 'Closure Request'
      ORDER BY log_date DESC
      LIMIT 1
    `, {
      replacements: [risk.risk_id],
      type: sequelize.QueryTypes.SELECT,
      transaction
    });
    
    if (!closureRequest) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'No closure request found. Use POST /api/risks/:id/request-closure first'
      });
    }
    
    const oldStatus = risk.status;
    
    // Approve and close the risk
    await risk.update({ status: 'Closed' }, { transaction });
    
    // Log the approval
    await sequelize.query(`
      INSERT INTO risk_log (risk_id, logged_by, log_type, previous_status, new_status, comments)
      VALUES (?, ?, 'Closure Approved', ?, 'Closed', ?)
    `, {
      replacements: [
        risk.risk_id,
        req.body.approved_by || null,
        oldStatus,
        req.body.approval_comments || 'Risk closure approved'
      ],
      transaction
    });
    
    await transaction.commit();
    
    // TODO: Send notification to risk owner and requester
    
    res.json({
      success: true,
      message: 'Risk closure approved successfully',
      data: {
        risk_id: risk.risk_id,
        risk_number: risk.risk_number,
        status: 'Closed',
        approved_by: req.body.approved_by
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error approving risk closure:', error);
    res.status(500).json({
      success: false,
      message: 'Error approving risk closure',
      error: error.message
    });
  }
};

// @desc    Reject risk closure request
// @route   POST /api/risks/:id/reject-closure
exports.rejectRiskClosure = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const risk = await Risk.findByPk(req.params.id, { transaction });
    
    if (!risk) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Risk not found'
      });
    }
    
    // Log the rejection
    await sequelize.query(`
      INSERT INTO risk_log (risk_id, logged_by, log_type, comments)
      VALUES (?, ?, 'Closure Rejected', ?)
    `, {
      replacements: [
        risk.risk_id,
        req.body.rejected_by || null,
        req.body.rejection_reason || 'Risk closure request rejected'
      ],
      transaction
    });
    
    await transaction.commit();
    
    // TODO: Send notification to requester
    
    res.json({
      success: true,
      message: 'Risk closure request rejected',
      data: {
        risk_id: risk.risk_id,
        risk_number: risk.risk_number,
        reason: req.body.rejection_reason
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error rejecting risk closure:', error);
    res.status(500).json({
      success: false,
      message: 'Error rejecting risk closure',
      error: error.message
    });
  }
};

// =====================================================
// RISK ACTIONS (Mitigation Strategies)
// =====================================================

// @desc    Get all mitigation actions for a risk
// @route   GET /api/risks/:id/actions
exports.getRiskActions = async (req, res) => {
  try {
    const actions = await sequelize.query(`
      SELECT 
        ra.*,
        assignee.full_name as assigned_to_name,
        assignee.email as assigned_to_email,
        creator.full_name as created_by_name
      FROM risk_actions ra
      LEFT JOIN people assignee ON ra.assigned_to = assignee.person_id
      LEFT JOIN people creator ON ra.created_by = creator.person_id
      WHERE ra.risk_id = ?
      ORDER BY 
        CASE ra.status 
          WHEN 'Pending' THEN 1
          WHEN 'In Progress' THEN 2
          WHEN 'Completed' THEN 3
          WHEN 'Cancelled' THEN 4
        END,
        ra.due_date ASC
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
    console.error('Error fetching risk actions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching risk actions',
      error: error.message
    });
  }
};

// @desc    Create mitigation action for a risk
// @route   POST /api/risks/:id/actions
exports.createRiskAction = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const risk = await Risk.findByPk(req.params.id);
    if (!risk) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Risk not found'
      });
    }
    
    const [result] = await sequelize.query(`
      INSERT INTO risk_actions 
        (risk_id, action_description, action_type, assigned_to, created_by, 
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
    
    // Log the action creation
    await sequelize.query(`
      INSERT INTO risk_log (risk_id, logged_by, log_type, comments)
      VALUES (?, ?, 'Mitigation', ?)
    `, {
      replacements: [
        req.params.id,
        req.body.created_by || null,
        `Mitigation action created: ${req.body.action_description.substring(0, 100)}`
      ],
      transaction
    });
    
    await transaction.commit();
    
    res.status(201).json({
      success: true,
      message: 'Mitigation action created successfully',
      data: { action_id: actionId }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating risk action:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating risk action',
      error: error.message
    });
  }
};

// @desc    Update risk action
// @route   PUT /api/risks/:id/actions/:actionId
exports.updateRiskAction = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const currentAction = await sequelize.query(`
      SELECT status FROM risk_actions WHERE action_id = ? AND risk_id = ?
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
      UPDATE risk_actions 
      SET ${updates.join(', ')}
      WHERE action_id = ? AND risk_id = ?
    `, {
      replacements: values,
      transaction
    });
    
    if (req.body.status && req.body.status !== oldStatus) {
      await sequelize.query(`
        INSERT INTO risk_log (risk_id, logged_by, log_type, comments)
        VALUES (?, ?, 'Mitigation', ?)
      `, {
        replacements: [
          req.params.id,
          req.body.updated_by || null,
          `Mitigation action status: ${oldStatus} → ${req.body.status}`
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
    console.error('Error updating risk action:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating risk action',
      error: error.message
    });
  }
};

// @desc    Delete risk action
// @route   DELETE /api/risks/:id/actions/:actionId
exports.deleteRiskAction = async (req, res) => {
  try {
    const [result] = await sequelize.query(`
      DELETE FROM risk_actions 
      WHERE action_id = ? AND risk_id = ?
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
    console.error('Error deleting risk action:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting risk action',
      error: error.message
    });
  }
};

// =====================================================
// RISK LOG (Audit Trail)
// =====================================================

// @desc    Get risk log/history
// @route   GET /api/risks/:id/log
exports.getRiskLog = async (req, res) => {
  try {
    const logEntries = await sequelize.query(`
      SELECT 
        rl.*,
        p.full_name as logged_by_name
      FROM risk_log rl
      LEFT JOIN people p ON rl.logged_by = p.person_id
      WHERE rl.risk_id = ?
      ORDER BY rl.log_date DESC
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
    console.error('Error fetching risk log:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching risk log',
      error: error.message
    });
  }
};

// @desc    Add manual log entry (comment)
// @route   POST /api/risks/:id/log
exports.addRiskLogEntry = async (req, res) => {
  try {
    await sequelize.query(`
      INSERT INTO risk_log (risk_id, logged_by, log_type, comments)
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