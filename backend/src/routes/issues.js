// backend/src/routes/issues.js
const express = require('express');
const router = express.Router();
const {
  getAllIssues,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
  getIssueActions,
  createIssueAction,
  updateIssueAction,
  deleteIssueAction,
  getIssueLog,
  addIssueLogEntry
} = require('../controllers/issuesController');

// =====================================================
// ISSUES CRUD
// =====================================================

// @route   GET /api/issues
// @desc    Get all issues (with filtering)
router.get('/', getAllIssues);

// @route   GET /api/issues/:id
// @desc    Get issue by ID (includes actions and log)
router.get('/:id', getIssueById);

// @route   POST /api/issues
// @desc    Create new issue
router.post('/', createIssue);

// @route   PUT /api/issues/:id
// @desc    Update issue
router.put('/:id', updateIssue);

// @route   DELETE /api/issues/:id
// @desc    Delete issue
router.delete('/:id', deleteIssue);

// =====================================================
// ISSUE ACTIONS (Nested)
// =====================================================

// @route   GET /api/issues/:id/actions
// @desc    Get all actions for an issue
router.get('/:id/actions', getIssueActions);

// @route   POST /api/issues/:id/actions
// @desc    Create action for an issue
router.post('/:id/actions', createIssueAction);

// @route   PUT /api/issues/:id/actions/:actionId
// @desc    Update action
router.put('/:id/actions/:actionId', updateIssueAction);

// @route   DELETE /api/issues/:id/actions/:actionId
// @desc    Delete action
router.delete('/:id/actions/:actionId', deleteIssueAction);

// =====================================================
// ISSUE LOG (Audit Trail)
// =====================================================

// @route   GET /api/issues/:id/log
// @desc    Get issue history/audit trail
router.get('/:id/log', getIssueLog);

// @route   POST /api/issues/:id/log
// @desc    Add log entry (manual comment)
router.post('/:id/log', addIssueLogEntry);

module.exports = router;