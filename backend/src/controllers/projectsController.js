// backend/src/controllers/projectsController.js
const { Project, Issue, Risk, Change, Escalation, Fault } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all projects
// @route   GET /api/projects
exports.getAllProjects = async (req, res) => {
  try {
    const { status, search } = req.query;
    
    let whereClause = {};
    
    if (status) {
      whereClause.status = status;
    }
    
    if (search) {
      whereClause[Op.or] = [
        { project_name: { [Op.like]: `%${search}%` } },
        { project_code: { [Op.like]: `%${search}%` } },
        { client_name: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const projects = await Project.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      count: projects.length,
      data: projects
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching projects',
      error: error.message
    });
  }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id, {
      include: [
        { association: 'issues', attributes: ['issue_id', 'issue_number', 'title', 'status', 'priority'] },
        { association: 'risks', attributes: ['risk_id', 'risk_number', 'title', 'status', 'risk_score'] },
        { association: 'changes', attributes: ['change_id', 'change_number', 'title', 'status', 'priority'] },
        { association: 'escalations', attributes: ['escalation_id', 'escalation_number', 'title', 'status'] },
        { association: 'faults', attributes: ['fault_id', 'fault_number', 'title', 'status', 'severity'] }
      ]
    });
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    res.json({
      success: true,
      data: project
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project',
      error: error.message
    });
  }
};

// @desc    Get project summary with counts
// @route   GET /api/projects/:id/summary
exports.getProjectSummary = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    // Get counts for each category
    const [
      openIssues,
      activeRisks,
      pendingChanges,
      openFaults,
      activeEscalations
    ] = await Promise.all([
      Issue.count({
        where: {
          project_id: req.params.id,
          status: { [Op.notIn]: ['Closed', 'Cancelled'] }
        }
      }),
      Risk.count({
        where: {
          project_id: req.params.id,
          status: { [Op.notIn]: ['Closed'] }
        }
      }),
      Change.count({
        where: {
          project_id: req.params.id,
          status: { [Op.notIn]: ['Implemented', 'Closed', 'Rejected'] }
        }
      }),
      Fault.count({
        where: {
          project_id: req.params.id,
          status: { [Op.notIn]: ['Closed'] }
        }
      }),
      Escalation.count({
        where: {
          project_id: req.params.id,
          status: { [Op.notIn]: ['Closed'] }
        }
      })
    ]);
    
    res.json({
      success: true,
      data: {
        project,
        summary: {
          openIssues,
          activeRisks,
          pendingChanges,
          openFaults,
          activeEscalations
        }
      }
    });
  } catch (error) {
    console.error('Error fetching project summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project summary',
      error: error.message
    });
  }
};

// @desc    Create new project
// @route   POST /api/projects
exports.createProject = async (req, res) => {
  try {
    const project = await Project.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: project
    });
  } catch (error) {
    console.error('Error creating project:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Project code already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating project',
      error: error.message
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    await project.update(req.body);
    
    res.json({
      success: true,
      message: 'Project updated successfully',
      data: project
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating project',
      error: error.message
    });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findByPk(req.params.id);
    
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }
    
    await project.destroy();
    
    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting project',
      error: error.message
    });
  }
};