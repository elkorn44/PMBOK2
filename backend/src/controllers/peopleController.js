// backend/src/controllers/peopleController.js
const { Person, sequelize } = require('../models');
const { Op } = require('sequelize');

// =====================================================
// PEOPLE CRUD
// =====================================================

// @desc    Get all people with filtering and workload info
// @route   GET /api/people?role=Manager&department=IT&is_active=true&search=john
exports.getAllPeople = async (req, res) => {
  try {
    const { role, department, is_active, search } = req.query;
    
    let whereClause = {};
    
    if (role) whereClause.role = role;
    if (department) whereClause.department = department;
    if (is_active !== undefined) {
      whereClause.is_active = is_active === 'true' || is_active === '1';
    }
    
    if (search) {
      whereClause[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const people = await Person.findAll({
      where: whereClause,
      order: [['full_name', 'ASC']]
    });
    
    // Get workload for each person (count of active actions)
    const peopleWithWorkload = await Promise.all(
      people.map(async (person) => {
        const workload = await sequelize.query(`
          SELECT 
            (SELECT COUNT(*) FROM issue_actions WHERE assigned_to = ? AND status IN ('Pending', 'In Progress')) as issue_actions,
            (SELECT COUNT(*) FROM risk_actions WHERE assigned_to = ? AND status IN ('Pending', 'In Progress')) as risk_actions,
            (SELECT COUNT(*) FROM change_actions WHERE assigned_to = ? AND status IN ('Pending', 'In Progress')) as change_actions,
            (SELECT COUNT(*) FROM escalation_actions WHERE assigned_to = ? AND status IN ('Pending', 'In Progress')) as escalation_actions,
            (SELECT COUNT(*) FROM fault_actions WHERE assigned_to = ? AND status IN ('Pending', 'In Progress')) as fault_actions,
            (SELECT COUNT(*) FROM action_log_items WHERE assigned_to = ? AND status IN ('Pending', 'In Progress')) as action_log_items
        `, {
          replacements: [person.person_id, person.person_id, person.person_id, person.person_id, person.person_id, person.person_id],
          type: sequelize.QueryTypes.SELECT
        });
        
        const totalActions = 
          parseInt(workload[0].issue_actions || 0) +
          parseInt(workload[0].risk_actions || 0) +
          parseInt(workload[0].change_actions || 0) +
          parseInt(workload[0].escalation_actions || 0) +
          parseInt(workload[0].fault_actions || 0) +
          parseInt(workload[0].action_log_items || 0);
        
        return {
          ...person.toJSON(),
          workload: {
            total_active_actions: totalActions,
            by_type: {
              issue_actions: parseInt(workload[0].issue_actions || 0),
              risk_actions: parseInt(workload[0].risk_actions || 0),
              change_actions: parseInt(workload[0].change_actions || 0),
              escalation_actions: parseInt(workload[0].escalation_actions || 0),
              fault_actions: parseInt(workload[0].fault_actions || 0),
              action_log_items: parseInt(workload[0].action_log_items || 0)
            }
          }
        };
      })
    );
    
    res.json({
      success: true,
      count: peopleWithWorkload.length,
      data: peopleWithWorkload
    });
  } catch (error) {
    console.error('Error fetching people:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching people',
      error: error.message
    });
  }
};

// @desc    Get person by ID with detailed workload
// @route   GET /api/people/:id
exports.getPersonById = async (req, res) => {
  try {
    const person = await Person.findByPk(req.params.id);
    
    if (!person) {
      return res.status(404).json({
        success: false,
        message: 'Person not found'
      });
    }
    
    // Get detailed workload with specific actions
    const issueActions = await sequelize.query(`
      SELECT 
        ia.action_id, ia.action_description, ia.status, ia.priority, ia.due_date,
        i.issue_number, i.title as issue_title, p.project_name
      FROM issue_actions ia
      INNER JOIN issues i ON ia.issue_id = i.issue_id
      INNER JOIN projects p ON i.project_id = p.project_id
      WHERE ia.assigned_to = ? AND ia.status IN ('Pending', 'In Progress')
      ORDER BY ia.due_date ASC
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.SELECT
    });
    
    const riskActions = await sequelize.query(`
      SELECT 
        ra.action_id, ra.action_description, ra.status, ra.priority, ra.due_date,
        r.risk_number, r.title as risk_title, p.project_name
      FROM risk_actions ra
      INNER JOIN risks r ON ra.risk_id = r.risk_id
      INNER JOIN projects p ON r.project_id = p.project_id
      WHERE ra.assigned_to = ? AND ra.status IN ('Pending', 'In Progress')
      ORDER BY ra.due_date ASC
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.SELECT
    });
    
    const changeActions = await sequelize.query(`
      SELECT 
        ca.action_id, ca.action_description, ca.status, ca.priority, ca.due_date,
        c.change_number, c.title as change_title, p.project_name
      FROM change_actions ca
      INNER JOIN changes c ON ca.change_id = c.change_id
      INNER JOIN projects p ON c.project_id = p.project_id
      WHERE ca.assigned_to = ? AND ca.status IN ('Pending', 'In Progress')
      ORDER BY ca.due_date ASC
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.SELECT
    });
    
    // Get items they've raised or own
    const raisedIssues = await sequelize.query(`
      SELECT COUNT(*) as count FROM issues 
      WHERE raised_by = ? AND status NOT IN ('Closed', 'Cancelled')
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.SELECT
    });
    
    const ownedRisks = await sequelize.query(`
      SELECT COUNT(*) as count FROM risks 
      WHERE owner = ? AND status NOT IN ('Closed')
    `, {
      replacements: [req.params.id],
      type: sequelize.QueryTypes.SELECT
    });
    
    res.json({
      success: true,
      data: {
        ...person.toJSON(),
        active_actions: {
          issue_actions: issueActions,
          risk_actions: riskActions,
          change_actions: changeActions,
          total: issueActions.length + riskActions.length + changeActions.length
        },
        ownership: {
          open_issues_raised: parseInt(raisedIssues[0].count),
          active_risks_owned: parseInt(ownedRisks[0].count)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching person:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching person',
      error: error.message
    });
  }
};

// @desc    Create new person
// @route   POST /api/people
exports.createPerson = async (req, res) => {
  try {
    const person = await Person.create(req.body);
    
    res.status(201).json({
      success: true,
      message: 'Person created successfully',
      data: person
    });
  } catch (error) {
    console.error('Error creating person:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => ({
          field: e.path,
          message: e.message
        }))
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating person',
      error: error.message
    });
  }
};

// @desc    Update person
// @route   PUT /api/people/:id
exports.updatePerson = async (req, res) => {
  try {
    const person = await Person.findByPk(req.params.id);
    
    if (!person) {
      return res.status(404).json({
        success: false,
        message: 'Person not found'
      });
    }
    
    await person.update(req.body);
    
    res.json({
      success: true,
      message: 'Person updated successfully',
      data: person
    });
  } catch (error) {
    console.error('Error updating person:', error);
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Username already exists'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating person',
      error: error.message
    });
  }
};

// @desc    Delete person (soft delete - set is_active = false)
// @route   DELETE /api/people/:id
exports.deletePerson = async (req, res) => {
  try {
    const person = await Person.findByPk(req.params.id);
    
    if (!person) {
      return res.status(404).json({
        success: false,
        message: 'Person not found'
      });
    }
    
    // Check if person has active actions assigned
    const activeActions = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM issue_actions WHERE assigned_to = ? AND status IN ('Pending', 'In Progress')) +
        (SELECT COUNT(*) FROM risk_actions WHERE assigned_to = ? AND status IN ('Pending', 'In Progress')) +
        (SELECT COUNT(*) FROM change_actions WHERE assigned_to = ? AND status IN ('Pending', 'In Progress')) as total
    `, {
      replacements: [req.params.id, req.params.id, req.params.id],
      type: sequelize.QueryTypes.SELECT
    });
    
    if (activeActions[0].total > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete person with ${activeActions[0].total} active actions. Reassign actions first or set inactive instead.`,
        hint: 'Use PUT /api/people/:id with is_active: false to deactivate'
      });
    }
    
    // Soft delete - just set inactive
    await person.update({ is_active: false });
    
    res.json({
      success: true,
      message: 'Person deactivated successfully',
      data: person
    });
  } catch (error) {
    console.error('Error deleting person:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting person',
      error: error.message
    });
  }
};

// =====================================================
// UTILITY ENDPOINTS
// =====================================================

// @desc    Get all unique roles
// @route   GET /api/people/meta/roles
exports.getRoles = async (req, res) => {
  try {
    const roles = await sequelize.query(`
      SELECT DISTINCT role 
      FROM people 
      WHERE role IS NOT NULL AND role != '' 
      ORDER BY role
    `, { type: sequelize.QueryTypes.SELECT });
    
    res.json({
      success: true,
      count: roles.length,
      data: roles.map(r => r.role)
    });
  } catch (error) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching roles',
      error: error.message
    });
  }
};

// @desc    Get all unique departments
// @route   GET /api/people/meta/departments
exports.getDepartments = async (req, res) => {
  try {
    const departments = await sequelize.query(`
      SELECT DISTINCT department 
      FROM people 
      WHERE department IS NOT NULL AND department != '' 
      ORDER BY department
    `, { type: sequelize.QueryTypes.SELECT });
    
    res.json({
      success: true,
      count: departments.length,
      data: departments.map(d => d.department)
    });
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching departments',
      error: error.message
    });
  }
};

// @desc    Get team workload summary
// @route   GET /api/people/workload/summary
exports.getWorkloadSummary = async (req, res) => {
  try {
    const summary = await sequelize.query(`
      SELECT 
        p.person_id,
        p.full_name,
        p.role,
        p.department,
        COUNT(DISTINCT ia.action_id) + 
        COUNT(DISTINCT ra.action_id) + 
        COUNT(DISTINCT ca.action_id) +
        COUNT(DISTINCT ea.action_id) +
        COUNT(DISTINCT fa.action_id) +
        COUNT(DISTINCT ali.action_item_id) as total_actions,
        SUM(CASE WHEN ia.priority = 'Critical' OR ra.priority = 'Critical' OR ca.priority = 'Critical' 
                 OR ea.priority = 'Critical' OR fa.priority = 'Critical' OR ali.priority = 'Critical' 
            THEN 1 ELSE 0 END) as critical_actions,
        SUM(CASE WHEN ia.due_date < CURDATE() OR ra.due_date < CURDATE() OR ca.due_date < CURDATE() 
                 OR ea.due_date < CURDATE() OR fa.due_date < CURDATE() OR ali.due_date < CURDATE()
            THEN 1 ELSE 0 END) as overdue_actions
      FROM people p
      LEFT JOIN issue_actions ia ON p.person_id = ia.assigned_to AND ia.status IN ('Pending', 'In Progress')
      LEFT JOIN risk_actions ra ON p.person_id = ra.assigned_to AND ra.status IN ('Pending', 'In Progress')
      LEFT JOIN change_actions ca ON p.person_id = ca.assigned_to AND ca.status IN ('Pending', 'In Progress')
      LEFT JOIN escalation_actions ea ON p.person_id = ea.assigned_to AND ea.status IN ('Pending', 'In Progress')
      LEFT JOIN fault_actions fa ON p.person_id = fa.assigned_to AND fa.status IN ('Pending', 'In Progress')
      LEFT JOIN action_log_items ali ON p.person_id = ali.assigned_to AND ali.status IN ('Pending', 'In Progress')
      WHERE p.is_active = TRUE
      GROUP BY p.person_id, p.full_name, p.role, p.department
      ORDER BY total_actions DESC
    `, { type: sequelize.QueryTypes.SELECT });
    
    res.json({
      success: true,
      count: summary.length,
      data: summary,
      totals: {
        total_people: summary.length,
        total_actions: summary.reduce((sum, p) => sum + parseInt(p.total_actions), 0),
        total_critical: summary.reduce((sum, p) => sum + parseInt(p.critical_actions), 0),
        total_overdue: summary.reduce((sum, p) => sum + parseInt(p.overdue_actions), 0)
      }
    });
  } catch (error) {
    console.error('Error fetching workload summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching workload summary',
      error: error.message
    });
  }
};

module.exports = exports;
