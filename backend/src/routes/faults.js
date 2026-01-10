// backend/src/routes/faults.js
const express = require('express');
const router = express.Router();
const {
  getAllFaults,
  getFaultById,
  createFault,
  updateFault,
  deleteFault,
  getFaultActions,
  createFaultAction,
  updateFaultAction,
  deleteFaultAction,
  getFaultLog,
  addFaultLogEntry
} = require('../controllers/faultsController');

// =====================================================
// FAULTS CRUD
// =====================================================

// @route   GET /api/faults
// @desc    Get all faults (with filtering)
router.get('/', getAllFaults);

// @route   GET /api/faults/:id
// @desc    Get fault by ID (includes actions and log)
router.get('/:id', getFaultById);

// @route   POST /api/faults
// @desc    Create new fault
router.post('/', createFault);

// @route   PUT /api/faults/:id
// @desc    Update fault
router.put('/:id', updateFault);

// @route   DELETE /api/faults/:id
// @desc    Delete fault
router.delete('/:id', deleteFault);

// =====================================================
// FAULT ACTIONS (Nested)
// =====================================================

// @route   GET /api/faults/:id/actions
// @desc    Get all actions for a fault
router.get('/:id/actions', getFaultActions);

// @route   POST /api/faults/:id/actions
// @desc    Create action for a fault
router.post('/:id/actions', createFaultAction);

// @route   PUT /api/faults/:id/actions/:actionId
// @desc    Update action
router.put('/:id/actions/:actionId', updateFaultAction);

// @route   DELETE /api/faults/:id/actions/:actionId
// @desc    Delete action
router.delete('/:id/actions/:actionId', deleteFaultAction);

// =====================================================
// FAULT LOG (Audit Trail)
// =====================================================

// @route   GET /api/faults/:id/log
// @desc    Get fault history/audit trail
router.get('/:id/log', getFaultLog);

// @route   POST /api/faults/:id/log
// @desc    Add log entry (manual comment)
router.post('/:id/log', addFaultLogEntry);

module.exports = router;