// backend/src/routes/people.js
const express = require('express');
const router = express.Router();
const {
  getAllPeople,
  getPersonById,
  createPerson,
  updatePerson,
  deletePerson,
  getRoles,
  getDepartments,
  getWorkloadSummary
} = require('../controllers/peopleController');

// @route   GET /api/people
// @desc    Get all people (with optional filters)
router.get('/', getAllPeople);

// @route   GET /api/people/roles
// @desc    Get all unique roles
router.get('/roles', getRoles);

// @route   GET /api/people/departments
// @desc    Get all unique departments
router.get('/departments', getDepartments);

// @route   GET /api/people/workload
// @desc    Get workload summary for all people
router.get('/workload', getWorkloadSummary);

// @route   GET /api/people/:id
// @desc    Get person by ID
router.get('/:id', getPersonById);

// @route   POST /api/people
// @desc    Create new person
router.post('/', createPerson);

// @route   PUT /api/people/:id
// @desc    Update person
router.put('/:id', updatePerson);

// @route   DELETE /api/people/:id
// @desc    Delete person
router.delete('/:id', deletePerson);

module.exports = router;
