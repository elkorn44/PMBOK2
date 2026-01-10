// backend/src/routes/changes.js
const express = require('express');
const router = express.Router();
const {
  getAllChanges,
  getChangeById,
  createChange,
  updateChange,
  deleteChange,
  requestChangeApproval,
  approveChange,
  rejectChange,
  requestChangeClosure,
  approveChangeClosure,
  rejectChangeClosure,
  getChangeActions,
  createChangeAction,
  updateChangeAction,
  deleteChangeAction,
  getChangeLog,
  addChangeLogEntry
} = require('../controllers/changesController');

// =====================================================
// CHANGES CRUD
// =====================================================

// @route   GET /api/changes
// @desc    Get all changes (with filtering)
router.get('/', getAllChanges);

// @route   GET /api/changes/:id
// @desc    Get change by ID (includes actions and log)
router.get('/:id', getChangeById);

// @route   POST /api/changes
// @desc    Create new change request
router.post('/', createChange);

// @route   PUT /api/changes/:id
// @desc    Update change
router.put('/:id', updateChange);

// @route   DELETE /api/changes/:id
// @desc    Delete change
router.delete('/:id', deleteChange);

// =====================================================
// APPROVAL WORKFLOW (Changes require approval)
// =====================================================

// @route   POST /api/changes/:id/request-approval
// @desc    Request approval for change
router.post('/:id/request-approval', requestChangeApproval);

// @route   POST /api/changes/:id/approve
// @desc    Approve change request
router.post('/:id/approve', approveChange);

// @route   POST /api/changes/:id/reject
// @desc    Reject change request
router.post('/:id/reject', rejectChange);

// =====================================================
// CLOSURE APPROVAL (After implementation)
// =====================================================

// @route   POST /api/changes/:id/request-closure
// @desc    Request approval to close implemented change
router.post('/:id/request-closure', requestChangeClosure);

// @route   POST /api/changes/:id/approve-closure
// @desc    Approve change closure
router.post('/:id/approve-closure', approveChangeClosure);

// @route   POST /api/changes/:id/reject-closure
// @desc    Reject change closure request
router.post('/:id/reject-closure', rejectChangeClosure);

// =====================================================
// CHANGE ACTIONS (Implementation Steps)
// =====================================================

// @route   GET /api/changes/:id/actions
// @desc    Get all implementation actions for a change
router.get('/:id/actions', getChangeActions);

// @route   POST /api/changes/:id/actions
// @desc    Create implementation action
router.post('/:id/actions', createChangeAction);

// @route   PUT /api/changes/:id/actions/:actionId
// @desc    Update action
router.put('/:id/actions/:actionId', updateChangeAction);

// @route   DELETE /api/changes/:id/actions/:actionId
// @desc    Delete action
router.delete('/:id/actions/:actionId', deleteChangeAction);

// =====================================================
// CHANGE LOG (Audit Trail)
// =====================================================

// @route   GET /api/changes/:id/log
// @desc    Get change history/audit trail
router.get('/:id/log', getChangeLog);

// @route   POST /api/changes/:id/log
// @desc    Add log entry (manual comment)
router.post('/:id/log', addChangeLogEntry);

module.exports = router;