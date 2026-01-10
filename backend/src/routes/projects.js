// backend/src/routes/projects.js
const express = require('express');
const router = express.Router();
const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  getProjectSummary
} = require('../controllers/projectsController');

// @route   GET /api/projects
// @desc    Get all projects
// @access  Public
router.get('/', getAllProjects);

// @route   GET /api/projects/:id
// @desc    Get project by ID
// @access  Public
router.get('/:id', getProjectById);

// @route   GET /api/projects/:id/summary
// @desc    Get project summary with counts
// @access  Public
router.get('/:id/summary', getProjectSummary);

// @route   POST /api/projects
// @desc    Create new project
// @access  Public
router.post('/', createProject);

// @route   PUT /api/projects/:id
// @desc    Update project
// @access  Public
router.put('/:id', updateProject);

// @route   DELETE /api/projects/:id
// @desc    Delete project
// @access  Public
router.delete('/:id', deleteProject);

module.exports = router;