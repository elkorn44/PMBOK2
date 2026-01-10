// backend/src/routes/action-logs.js
const express = require('express');
const router = express.Router();
const {
  getAllActionLogs,
  getActionLogById,
  createActionLog,
  updateActionLog,
  deleteActionLog,
  getActionLogItems,
  createActionLogItem,
  updateActionLogItem,
  deleteActionLogItem,
  getActionRequirements,
  createActionRequirement,
  updateActionRequirement,
  deleteActionRequirement
} = require('../controllers/actionLogsController');

// =====================================================
// ACTION LOG HEADERS CRUD
// =====================================================

// @route   GET /api/action-logs
// @desc    Get all action logs (with filtering)
// @query   ?project_id=1&status=Active&search=meeting
router.get('/', getAllActionLogs);

// @route   GET /api/action-logs/:id
// @desc    Get action log by ID (includes all items and requirements)
router.get('/:id', getActionLogById);

// @route   POST /api/action-logs
// @desc    Create new action log
router.post('/', createActionLog);

// @route   PUT /api/action-logs/:id
// @desc    Update action log
router.put('/:id', updateActionLog);

// @route   DELETE /api/action-logs/:id
// @desc    Delete action log
router.delete('/:id', deleteActionLog);

// =====================================================
// ACTION LOG ITEMS (Nested)
// =====================================================

// @route   GET /api/action-logs/:id/items
// @desc    Get all items for an action log
router.get('/:id/items', getActionLogItems);

// @route   POST /api/action-logs/:id/items
// @desc    Create action item
router.post('/:id/items', createActionLogItem);

// @route   PUT /api/action-logs/:id/items/:itemId
// @desc    Update action item
router.put('/:id/items/:itemId', updateActionLogItem);

// @route   DELETE /api/action-logs/:id/items/:itemId
// @desc    Delete action item
router.delete('/:id/items/:itemId', deleteActionLogItem);

// =====================================================
// ACTION REQUIREMENTS (Sub-items/Checklist)
// =====================================================

// @route   GET /api/action-logs/:id/items/:itemId/requirements
// @desc    Get requirements for an action item
router.get('/:id/items/:itemId/requirements', getActionRequirements);

// @route   POST /api/action-logs/:id/items/:itemId/requirements
// @desc    Create requirement
router.post('/:id/items/:itemId/requirements', createActionRequirement);

// @route   PUT /api/action-logs/:id/items/:itemId/requirements/:reqId
// @desc    Update requirement
router.put('/:id/items/:itemId/requirements/:reqId', updateActionRequirement);

// @route   DELETE /api/action-logs/:id/items/:itemId/requirements/:reqId
// @desc    Delete requirement
router.delete('/:id/items/:itemId/requirements/:reqId', deleteActionRequirement);

module.exports = router;
