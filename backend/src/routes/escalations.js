// backend/src/routes/escalations.js
const express = require('express');
const router = express.Router();
const {
  getAllEscalations,
  getEscalationById,
  createEscalation,
  updateEscalation,
  deleteEscalation,
  getEscalationActions,
  createEscalationAction,
  updateEscalationAction,
  deleteEscalationAction,
  getEscalationLog,
  addEscalationLogEntry
} = require('../controllers/escalationsController');

// =====================================================
// ESCALATIONS CRUD
// =====================================================

// @route   GET /api/escalations
// @desc    Get all escalations (with filtering)
router.get('/', getAllEscalations);

// @route   GET /api/escalations/:id
// @desc    Get escalation by ID (includes actions and log)
router.get('/:id', getEscalationById);

// @route   POST /api/escalations
// @desc    Create new escalation
router.post('/', createEscalation);

// @route   PUT /api/escalations/:id
// @desc    Update escalation
router.put('/:id', updateEscalation);

// @route   DELETE /api/escalations/:id
// @desc    Delete escalation
router.delete('/:id', deleteEscalation);

// =====================================================
// ESCALATION ACTIONS (Nested)
// =====================================================

// @route   GET /api/escalations/:id/actions
// @desc    Get all actions for an escalation
router.get('/:id/actions', getEscalationActions);

// @route   POST /api/escalations/:id/actions
// @desc    Create action for an escalation
router.post('/:id/actions', createEscalationAction);

// @route   PUT /api/escalations/:id/actions/:actionId
// @desc    Update action
router.put('/:id/actions/:actionId', updateEscalationAction);

// @route   DELETE /api/escalations/:id/actions/:actionId
// @desc    Delete action
router.delete('/:id/actions/:actionId', deleteEscalationAction);

// =====================================================
// ESCALATION LOG (Audit Trail)
// =====================================================

// @route   GET /api/escalations/:id/log
// @desc    Get escalation history/audit trail
router.get('/:id/log', getEscalationLog);

// @route   POST /api/escalations/:id/log
// @desc    Add log entry (manual comment)
router.post('/:id/log', addEscalationLogEntry);

module.exports = router;