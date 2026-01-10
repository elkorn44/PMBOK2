// backend/src/routes/risks.js
const express = require('express');
const router = express.Router();
const {
  getAllRisks,
  getRiskById,
  createRisk,
  updateRisk,
  deleteRisk,
  requestRiskClosure,
  approveRiskClosure,
  rejectRiskClosure,
  getRiskActions,
  createRiskAction,
  updateRiskAction,
  deleteRiskAction,
  getRiskLog,
  addRiskLogEntry
} = require('../controllers/risksController');

// =====================================================
// RISKS CRUD
// =====================================================

// @route   GET /api/risks
// @desc    Get all risks (with filtering)
router.get('/', getAllRisks);

// @route   GET /api/risks/:id
// @desc    Get risk by ID (includes actions and log)
router.get('/:id', getRiskById);

// @route   POST /api/risks
// @desc    Create new risk
router.post('/', createRisk);

// @route   PUT /api/risks/:id
// @desc    Update risk
router.put('/:id', updateRisk);

// @route   DELETE /api/risks/:id
// @desc    Delete risk
router.delete('/:id', deleteRisk);

// =====================================================
// APPROVAL WORKFLOW (Risks require approval to close)
// =====================================================

// @route   POST /api/risks/:id/request-closure
// @desc    Request approval to close a risk
router.post('/:id/request-closure', requestRiskClosure);

// @route   POST /api/risks/:id/approve-closure
// @desc    Approve risk closure (requires approval authority)
router.post('/:id/approve-closure', approveRiskClosure);

// @route   POST /api/risks/:id/reject-closure
// @desc    Reject risk closure request
router.post('/:id/reject-closure', rejectRiskClosure);

// =====================================================
// RISK ACTIONS (Mitigation Strategies)
// =====================================================

// @route   GET /api/risks/:id/actions
// @desc    Get all mitigation actions for a risk
router.get('/:id/actions', getRiskActions);

// @route   POST /api/risks/:id/actions
// @desc    Create mitigation action for a risk
router.post('/:id/actions', createRiskAction);

// @route   PUT /api/risks/:id/actions/:actionId
// @desc    Update mitigation action
router.put('/:id/actions/:actionId', updateRiskAction);

// @route   DELETE /api/risks/:id/actions/:actionId
// @desc    Delete mitigation action
router.delete('/:id/actions/:actionId', deleteRiskAction);

// =====================================================
// RISK LOG (Audit Trail)
// =====================================================

// @route   GET /api/risks/:id/log
// @desc    Get risk history/audit trail
router.get('/:id/log', getRiskLog);

// @route   POST /api/risks/:id/log
// @desc    Add log entry (manual comment)
router.post('/:id/log', addRiskLogEntry);

module.exports = router;