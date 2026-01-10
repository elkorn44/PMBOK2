// backend/src/controllers/reportsController.js
const { sequelize } = require('../models');
const { QueryTypes } = sequelize;

// =====================================================
// EXECUTIVE REPORTS
// =====================================================

// @desc    Executive summary across all projects
// @route   GET /api/reports/executive-summary
exports.getExecutiveSummary = async (req, res) => {
  try {
    // Get overall counts
    const projectStats = await sequelize.query(`
      SELECT 
        COUNT(*) as total_projects,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active_projects,
        SUM(CASE WHEN status = 'On Hold' THEN 1 ELSE 0 END) as on_hold_projects,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_projects
      FROM projects
    `, { type: QueryTypes.SELECT });

    const issueStats = await sequelize.query(`
      SELECT 
        COUNT(*) as total_issues,
        SUM(CASE WHEN status IN ('Open', 'In Progress') THEN 1 ELSE 0 END) as open_issues,
        SUM(CASE WHEN priority = 'Critical' THEN 1 ELSE 0 END) as critical_issues,
        SUM(CASE WHEN target_resolution_date < CURDATE() AND status NOT IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) as overdue_issues
      FROM issues
    `, { type: QueryTypes.SELECT });

    const riskStats = await sequelize.query(`
      SELECT 
        COUNT(*) as total_risks,
        SUM(CASE WHEN status NOT IN ('Closed') THEN 1 ELSE 0 END) as active_risks,
        SUM(CASE WHEN risk_score >= 16 THEN 1 ELSE 0 END) as critical_risks,
        AVG(risk_score) as avg_risk_score
      FROM risks
      WHERE status NOT IN ('Closed')
    `, { type: QueryTypes.SELECT });

    const changeStats = await sequelize.query(`
      SELECT 
        COUNT(*) as total_changes,
        SUM(CASE WHEN status = 'Under Review' THEN 1 ELSE 0 END) as pending_approval,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved_not_implemented,
        SUM(cost_impact) as total_cost_impact,
        SUM(schedule_impact_days) as total_schedule_impact
      FROM changes
      WHERE status NOT IN ('Closed', 'Rejected')
    `, { type: QueryTypes.SELECT });

    // Get pending approvals
    const riskClosureRequests = await sequelize.query(`
      SELECT COUNT(DISTINCT r.risk_id) as count
      FROM risks r
      INNER JOIN risk_log rl ON r.risk_id = rl.risk_id
      WHERE rl.log_type = 'Closure Request'
      AND r.status = 'Mitigated'
      AND NOT EXISTS (
        SELECT 1 FROM risk_log rl2 
        WHERE rl2.risk_id = r.risk_id 
        AND rl2.log_type IN ('Closure Approved', 'Closure Rejected')
        AND rl2.log_date > rl.log_date
      )
    `, { type: QueryTypes.SELECT });

    const changeApprovalRequests = await sequelize.query(`
      SELECT COUNT(*) as count
      FROM changes
      WHERE status = 'Under Review'
    `, { type: QueryTypes.SELECT });

    const changeClosureRequests = await sequelize.query(`
      SELECT COUNT(DISTINCT c.change_id) as count
      FROM changes c
      INNER JOIN change_log cl ON c.change_id = cl.change_id
      WHERE cl.log_type = 'Closure Request'
      AND c.status = 'Implemented'
      AND NOT EXISTS (
        SELECT 1 FROM change_log cl2
        WHERE cl2.change_id = c.change_id
        AND cl2.log_type IN ('Closure Approved', 'Closure Rejected')
        AND cl2.log_date > cl.log_date
      )
    `, { type: QueryTypes.SELECT });

    res.json({
      success: true,
      data: {
        projects: projectStats[0],
        issues: issueStats[0],
        risks: {
          ...riskStats[0],
          avg_risk_score: parseFloat(riskStats[0].avg_risk_score || 0).toFixed(2)
        },
        changes: {
          ...changeStats[0],
          total_cost_impact: parseFloat(changeStats[0].total_cost_impact || 0),
          total_schedule_impact: parseInt(changeStats[0].total_schedule_impact || 0)
        },
        pending_approvals: {
          risk_closures: parseInt(riskClosureRequests[0].count),
          change_approvals: parseInt(changeApprovalRequests[0].count),
          change_closures: parseInt(changeClosureRequests[0].count),
          total: parseInt(riskClosureRequests[0].count) + 
                 parseInt(changeApprovalRequests[0].count) + 
                 parseInt(changeClosureRequests[0].count)
        },
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating executive summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating executive summary',
      error: error.message
    });
  }
};

// @desc    Comprehensive project summary
// @route   GET /api/reports/project-summary/:projectId
exports.getProjectSummaryReport = async (req, res) => {
  try {
    const projectId = req.params.projectId;

    // Get project details
    const project = await sequelize.query(`
      SELECT * FROM projects WHERE project_id = ?
    `, {
      replacements: [projectId],
      type: QueryTypes.SELECT
    });

    if (!project || project.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Issue statistics
    const issueStats = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
        SUM(CASE WHEN priority = 'Critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN priority = 'High' THEN 1 ELSE 0 END) as high
      FROM issues WHERE project_id = ?
    `, {
      replacements: [projectId],
      type: QueryTypes.SELECT
    });

    // Risk statistics
    const riskStats = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Identified' THEN 1 ELSE 0 END) as identified,
        SUM(CASE WHEN status = 'Assessed' THEN 1 ELSE 0 END) as assessed,
        SUM(CASE WHEN status = 'Mitigated' THEN 1 ELSE 0 END) as mitigated,
        SUM(CASE WHEN risk_score >= 16 THEN 1 ELSE 0 END) as critical,
        AVG(risk_score) as avg_score,
        MAX(risk_score) as max_score
      FROM risks WHERE project_id = ?
    `, {
      replacements: [projectId],
      type: QueryTypes.SELECT
    });

    // Change statistics
    const changeStats = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Requested' THEN 1 ELSE 0 END) as requested,
        SUM(CASE WHEN status = 'Under Review' THEN 1 ELSE 0 END) as under_review,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'Implemented' THEN 1 ELSE 0 END) as implemented,
        SUM(cost_impact) as total_cost_impact,
        SUM(schedule_impact_days) as total_schedule_impact
      FROM changes WHERE project_id = ?
    `, {
      replacements: [projectId],
      type: QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        project: project[0],
        issues: issueStats[0],
        risks: {
          ...riskStats[0],
          avg_score: parseFloat(riskStats[0].avg_score || 0).toFixed(2)
        },
        changes: {
          ...changeStats[0],
          total_cost_impact: parseFloat(changeStats[0].total_cost_impact || 0),
          total_schedule_impact: parseInt(changeStats[0].total_schedule_impact || 0)
        },
        generated_at: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error generating project summary:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating project summary',
      error: error.message
    });
  }
};

// =====================================================
// ANALYTICAL REPORTS
// =====================================================

// @desc    Risk heat map data
// @route   GET /api/reports/risk-heat-map
exports.getRiskHeatMap = async (req, res) => {
  try {
    const { project_id } = req.query;
    
    let whereClause = "WHERE r.status NOT IN ('Closed')";
    let replacements = [];
    
    if (project_id) {
      whereClause += " AND r.project_id = ?";
      replacements.push(project_id);
    }

    const heatMapData = await sequelize.query(`
      SELECT 
        r.risk_id,
        r.risk_number,
        r.title,
        r.probability,
        r.impact,
        r.risk_score,
        r.status,
        p.project_name,
        owner.full_name as owner_name
      FROM risks r
      LEFT JOIN projects p ON r.project_id = p.project_id
      LEFT JOIN people owner ON r.owner = owner.person_id
      ${whereClause}
      ORDER BY r.risk_score DESC
    `, {
      replacements,
      type: QueryTypes.SELECT
    });

    // Group by probability and impact for matrix
    const matrix = {
      'Very High': { 'Very Low': [], 'Low': [], 'Medium': [], 'High': [], 'Very High': [] },
      'High': { 'Very Low': [], 'Low': [], 'Medium': [], 'High': [], 'Very High': [] },
      'Medium': { 'Very Low': [], 'Low': [], 'Medium': [], 'High': [], 'Very High': [] },
      'Low': { 'Very Low': [], 'Low': [], 'Medium': [], 'High': [], 'Very High': [] },
      'Very Low': { 'Very Low': [], 'Low': [], 'Medium': [], 'High': [], 'Very High': [] }
    };

    heatMapData.forEach(risk => {
      if (matrix[risk.probability] && matrix[risk.probability][risk.impact]) {
        matrix[risk.probability][risk.impact].push({
          risk_id: risk.risk_id,
          risk_number: risk.risk_number,
          title: risk.title,
          score: risk.risk_score
        });
      }
    });

    res.json({
      success: true,
      data: {
        matrix,
        risks: heatMapData,
        summary: {
          total_risks: heatMapData.length,
          critical: heatMapData.filter(r => r.risk_score >= 16).length,
          high: heatMapData.filter(r => r.risk_score >= 9 && r.risk_score < 16).length,
          medium: heatMapData.filter(r => r.risk_score >= 4 && r.risk_score < 9).length,
          low: heatMapData.filter(r => r.risk_score < 4).length
        }
      }
    });
  } catch (error) {
    console.error('Error generating risk heat map:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating risk heat map',
      error: error.message
    });
  }
};

// @desc    Issue aging report
// @route   GET /api/reports/issue-aging
exports.getIssueAgingReport = async (req, res) => {
  try {
    const { project_id } = req.query;
    
    let whereClause = "WHERE i.status NOT IN ('Closed', 'Cancelled')";
    let replacements = [];
    
    if (project_id) {
      whereClause += " AND i.project_id = ?";
      replacements.push(project_id);
    }

    const agingData = await sequelize.query(`
      SELECT 
        i.issue_id,
        i.issue_number,
        i.title,
        i.priority,
        i.status,
        i.raised_date,
        DATEDIFF(CURDATE(), i.raised_date) as days_open,
        i.target_resolution_date,
        CASE 
          WHEN i.target_resolution_date < CURDATE() THEN DATEDIFF(CURDATE(), i.target_resolution_date)
          ELSE 0
        END as days_overdue,
        p.project_name,
        assignee.full_name as assigned_to_name
      FROM issues i
      LEFT JOIN projects p ON i.project_id = p.project_id
      LEFT JOIN people assignee ON i.assigned_to = assignee.person_id
      ${whereClause}
      ORDER BY days_open DESC
    `, {
      replacements,
      type: QueryTypes.SELECT
    });

    // Categorize by age
    const categories = {
      fresh: agingData.filter(i => i.days_open <= 7),
      recent: agingData.filter(i => i.days_open > 7 && i.days_open <= 30),
      aging: agingData.filter(i => i.days_open > 30 && i.days_open <= 90),
      stale: agingData.filter(i => i.days_open > 90)
    };

    res.json({
      success: true,
      data: {
        issues: agingData,
        categories: {
          fresh: { count: categories.fresh.length, label: '0-7 days' },
          recent: { count: categories.recent.length, label: '8-30 days' },
          aging: { count: categories.aging.length, label: '31-90 days' },
          stale: { count: categories.stale.length, label: '90+ days' }
        },
        summary: {
          total_open: agingData.length,
          avg_days_open: agingData.length > 0 
            ? (agingData.reduce((sum, i) => sum + i.days_open, 0) / agingData.length).toFixed(1)
            : 0,
          overdue: agingData.filter(i => i.days_overdue > 0).length,
          critical_overdue: agingData.filter(i => i.priority === 'Critical' && i.days_overdue > 0).length
        }
      }
    });
  } catch (error) {
    console.error('Error generating issue aging report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating issue aging report',
      error: error.message
    });
  }
};

// @desc    Change impact analysis
// @route   GET /api/reports/change-impact
exports.getChangeImpactAnalysis = async (req, res) => {
  try {
    const { project_id } = req.query;
    
    let whereClause = "WHERE 1=1";
    let replacements = [];
    
    if (project_id) {
      whereClause += " AND c.project_id = ?";
      replacements.push(project_id);
    }

    const impactData = await sequelize.query(`
      SELECT 
        c.change_id,
        c.change_number,
        c.title,
        c.change_type,
        c.status,
        c.cost_impact,
        c.schedule_impact_days,
        c.request_date,
        c.approval_date,
        c.implementation_date,
        p.project_name,
        requester.full_name as requested_by_name
      FROM changes c
      LEFT JOIN projects p ON c.project_id = p.project_id
      LEFT JOIN people requester ON c.requested_by = requester.person_id
      ${whereClause}
      ORDER BY ABS(c.cost_impact) DESC
    `, {
      replacements,
      type: QueryTypes.SELECT
    });

    // Calculate totals by status
    const byStatus = {
      requested: { count: 0, cost: 0, schedule: 0 },
      approved: { count: 0, cost: 0, schedule: 0 },
      implemented: { count: 0, cost: 0, schedule: 0 },
      rejected: { count: 0, cost: 0, schedule: 0 }
    };

    impactData.forEach(change => {
      const status = change.status.toLowerCase().replace(' ', '_');
      if (byStatus[status]) {
        byStatus[status].count++;
        byStatus[status].cost += parseFloat(change.cost_impact || 0);
        byStatus[status].schedule += parseInt(change.schedule_impact_days || 0);
      }
    });

    // Group by change type
    const byType = {};
    impactData.forEach(change => {
      if (!byType[change.change_type]) {
        byType[change.change_type] = { count: 0, cost: 0, schedule: 0, changes: [] };
      }
      byType[change.change_type].count++;
      byType[change.change_type].cost += parseFloat(change.cost_impact || 0);
      byType[change.change_type].schedule += parseInt(change.schedule_impact_days || 0);
      byType[change.change_type].changes.push({
        change_number: change.change_number,
        title: change.title,
        cost_impact: change.cost_impact,
        schedule_impact: change.schedule_impact_days
      });
    });

    const totalCost = impactData.reduce((sum, c) => sum + parseFloat(c.cost_impact || 0), 0);
    const totalSchedule = impactData.reduce((sum, c) => sum + parseInt(c.schedule_impact_days || 0), 0);

    res.json({
      success: true,
      data: {
        changes: impactData,
        by_status: byStatus,
        by_type: byType,
        summary: {
          total_changes: impactData.length,
          total_cost_impact: totalCost,
          total_schedule_impact: totalSchedule,
          approved_not_implemented: impactData.filter(c => c.status === 'Approved').length,
          cost_increases: impactData.filter(c => c.cost_impact > 0).length,
          cost_savings: impactData.filter(c => c.cost_impact < 0).length,
          schedule_delays: impactData.filter(c => c.schedule_impact_days > 0).length,
          schedule_accelerations: impactData.filter(c => c.schedule_impact_days < 0).length
        }
      }
    });
  } catch (error) {
    console.error('Error generating change impact analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating change impact analysis',
      error: error.message
    });
  }
};

// @desc    Project health dashboard
// @route   GET /api/reports/project-health/:projectId
exports.getProjectHealthReport = async (req, res) => {
  try {
    const projectId = req.params.projectId;

    // Overall health score calculation
    const issueScore = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN priority = 'Critical' THEN 4 WHEN priority = 'High' THEN 3 WHEN priority = 'Medium' THEN 2 ELSE 1 END) as weighted_sum
      FROM issues 
      WHERE project_id = ? AND status NOT IN ('Closed', 'Cancelled')
    `, {
      replacements: [projectId],
      type: QueryTypes.SELECT
    });

    const riskScore = await sequelize.query(`
      SELECT AVG(risk_score) as avg_score, MAX(risk_score) as max_score
      FROM risks
      WHERE project_id = ? AND status NOT IN ('Closed')
    `, {
      replacements: [projectId],
      type: QueryTypes.SELECT
    });

    const changeScore = await sequelize.query(`
      SELECT COUNT(*) as pending_changes
      FROM changes
      WHERE project_id = ? AND status IN ('Requested', 'Under Review', 'Approved')
    `, {
      replacements: [projectId],
      type: QueryTypes.SELECT
    });

    // Calculate health score (0-100, higher is better)
    const issueWeight = Math.max(0, 100 - (issueScore[0].total * 5));
    const riskWeight = Math.max(0, 100 - (parseFloat(riskScore[0].avg_score || 0) * 4));
    const changeWeight = Math.max(0, 100 - (changeScore[0].pending_changes * 3));
    
    const overallHealth = ((issueWeight + riskWeight + changeWeight) / 3).toFixed(1);

    let healthStatus = 'Good';
    if (overallHealth < 50) healthStatus = 'Critical';
    else if (overallHealth < 70) healthStatus = 'At Risk';
    else if (overallHealth < 85) healthStatus = 'Caution';

    res.json({
      success: true,
      data: {
        health_score: parseFloat(overallHealth),
        health_status: healthStatus,
        components: {
          issues: {
            score: issueWeight,
            total_open: issueScore[0].total,
            weighted_sum: issueScore[0].weighted_sum
          },
          risks: {
            score: riskWeight,
            avg_risk_score: parseFloat(riskScore[0].avg_score || 0).toFixed(2),
            max_risk_score: riskScore[0].max_score || 0
          },
          changes: {
            score: changeWeight,
            pending: changeScore[0].pending_changes
          }
        },
        recommendations: getHealthRecommendations(overallHealth, issueScore[0], riskScore[0], changeScore[0])
      }
    });
  } catch (error) {
    console.error('Error generating project health report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating project health report',
      error: error.message
    });
  }
};

// Helper function for health recommendations
function getHealthRecommendations(healthScore, issueData, riskData, changeData) {
  const recommendations = [];
  
  if (healthScore < 70) {
    recommendations.push('URGENT: Project health is below acceptable levels. Immediate action required.');
  }
  
  if (issueData.total > 10) {
    recommendations.push(`High number of open issues (${issueData.total}). Focus on resolution and closure.`);
  }
  
  if (parseFloat(riskData.avg_score) > 10) {
    recommendations.push('Average risk score is high. Prioritize risk mitigation activities.');
  }
  
  if (riskData.max_score >= 20) {
    recommendations.push('Critical risk detected! Immediate mitigation required.');
  }
  
  if (changeData.pending_changes > 5) {
    recommendations.push(`${changeData.pending_changes} pending changes. Review change control process efficiency.`);
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Project health is good. Continue monitoring key metrics.');
  }
  
  return recommendations;
}

// =====================================================
// OPERATIONAL REPORTS
// =====================================================

// @desc    Action items report
// @route   GET /api/reports/action-items
exports.getActionItemsReport = async (req, res) => {
  try {
    const { project_id, assigned_to } = req.query;

    // Get actions from all sources
    const issueActions = await sequelize.query(`
      SELECT 
        ia.action_id,
        'Issue' as source_type,
        i.issue_number as source_number,
        i.title as source_title,
        ia.action_description,
        ia.status,
        ia.priority,
        ia.due_date,
        ia.created_date,
        DATEDIFF(CURDATE(), ia.due_date) as days_overdue,
        p.full_name as assigned_to_name,
        proj.project_name
      FROM issue_actions ia
      INNER JOIN issues i ON ia.issue_id = i.issue_id
      INNER JOIN projects proj ON i.project_id = proj.project_id
      LEFT JOIN people p ON ia.assigned_to = p.person_id
      WHERE ia.status IN ('Pending', 'In Progress')
      ${project_id ? 'AND i.project_id = ?' : ''}
      ${assigned_to ? 'AND ia.assigned_to = ?' : ''}
    `, {
      replacements: [project_id, assigned_to].filter(Boolean),
      type: QueryTypes.SELECT
    });

    const riskActions = await sequelize.query(`
      SELECT 
        ra.action_id,
        'Risk' as source_type,
        r.risk_number as source_number,
        r.title as source_title,
        ra.action_description,
        ra.status,
        ra.priority,
        ra.due_date,
        ra.created_date,
        DATEDIFF(CURDATE(), ra.due_date) as days_overdue,
        p.full_name as assigned_to_name,
        proj.project_name
      FROM risk_actions ra
      INNER JOIN risks r ON ra.risk_id = r.risk_id
      INNER JOIN projects proj ON r.project_id = proj.project_id
      LEFT JOIN people p ON ra.assigned_to = p.person_id
      WHERE ra.status IN ('Pending', 'In Progress')
      ${project_id ? 'AND r.project_id = ?' : ''}
      ${assigned_to ? 'AND ra.assigned_to = ?' : ''}
    `, {
      replacements: [project_id, assigned_to].filter(Boolean),
      type: QueryTypes.SELECT
    });

    const changeActions = await sequelize.query(`
      SELECT 
        ca.action_id,
        'Change' as source_type,
        c.change_number as source_number,
        c.title as source_title,
        ca.action_description,
        ca.status,
        ca.priority,
        ca.due_date,
        ca.created_date,
        DATEDIFF(CURDATE(), ca.due_date) as days_overdue,
        p.full_name as assigned_to_name,
        proj.project_name
      FROM change_actions ca
      INNER JOIN changes c ON ca.change_id = c.change_id
      INNER JOIN projects proj ON c.project_id = proj.project_id
      LEFT JOIN people p ON ca.assigned_to = p.person_id
      WHERE ca.status IN ('Pending', 'In Progress')
      ${project_id ? 'AND c.project_id = ?' : ''}
      ${assigned_to ? 'AND ca.assigned_to = ?' : ''}
    `, {
      replacements: [project_id, assigned_to].filter(Boolean),
      type: QueryTypes.SELECT
    });

    const allActions = [...issueActions, ...riskActions, ...changeActions];
    
    // Categorize
    const overdue = allActions.filter(a => a.due_date && a.days_overdue > 0);
    const dueSoon = allActions.filter(a => a.due_date && a.days_overdue <= 0 && a.days_overdue >= -7);
    const critical = allActions.filter(a => a.priority === 'Critical');

    res.json({
      success: true,
      data: {
        all_actions: allActions,
        summary: {
          total: allActions.length,
          overdue: overdue.length,
          due_this_week: dueSoon.length,
          critical: critical.length,
          by_status: {
            pending: allActions.filter(a => a.status === 'Pending').length,
            in_progress: allActions.filter(a => a.status === 'In Progress').length
          },
          by_source: {
            issues: issueActions.length,
            risks: riskActions.length,
            changes: changeActions.length
          }
        },
        overdue_actions: overdue,
        due_soon_actions: dueSoon,
        critical_actions: critical
      }
    });
  } catch (error) {
    console.error('Error generating action items report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating action items report',
      error: error.message
    });
  }
};

// @desc    Pending approvals report
// @route   GET /api/reports/pending-approvals
exports.getPendingApprovalsReport = async (req, res) => {
  try {
    // Risk closure requests
    const riskClosures = await sequelize.query(`
      SELECT 
        r.risk_id,
        r.risk_number,
        r.title,
        r.status,
        r.risk_score,
        proj.project_name,
        owner.full_name as owner_name,
        rl.log_date as requested_date,
        rl.comments as justification
      FROM risks r
      INNER JOIN risk_log rl ON r.risk_id = rl.risk_id
      INNER JOIN projects proj ON r.project_id = proj.project_id
      LEFT JOIN people owner ON r.owner = owner.person_id
      WHERE rl.log_type = 'Closure Request'
      AND r.status = 'Mitigated'
      AND NOT EXISTS (
        SELECT 1 FROM risk_log rl2 
        WHERE rl2.risk_id = r.risk_id 
        AND rl2.log_type IN ('Closure Approved', 'Closure Rejected')
        AND rl2.log_date > rl.log_date
      )
      ORDER BY rl.log_date ASC
    `, { type: QueryTypes.SELECT });

    // Change approvals
    const changeApprovals = await sequelize.query(`
      SELECT 
        c.change_id,
        c.change_number,
        c.title,
        c.change_type,
        c.cost_impact,
        c.schedule_impact_days,
        c.request_date,
        proj.project_name,
        requester.full_name as requested_by_name,
        c.justification
      FROM changes c
      INNER JOIN projects proj ON c.project_id = proj.project_id
      LEFT JOIN people requester ON c.requested_by = requester.person_id
      WHERE c.status = 'Under Review'
      ORDER BY c.request_date ASC
    `, { type: QueryTypes.SELECT });

    // Change closure requests
    const changeClosures = await sequelize.query(`
      SELECT 
        c.change_id,
        c.change_number,
        c.title,
        c.implementation_date,
        proj.project_name,
        cl.log_date as requested_date,
        cl.comments as justification
      FROM changes c
      INNER JOIN change_log cl ON c.change_id = cl.change_id
      INNER JOIN projects proj ON c.project_id = proj.project_id
      WHERE cl.log_type = 'Closure Request'
      AND c.status = 'Implemented'
      AND NOT EXISTS (
        SELECT 1 FROM change_log cl2
        WHERE cl2.change_id = c.change_id
        AND cl2.log_type IN ('Closure Approved', 'Closure Rejected')
        AND cl2.log_date > cl.log_date
      )
      ORDER BY cl.log_date ASC
    `, { type: QueryTypes.SELECT });

    res.json({
      success: true,
      data: {
        risk_closures: riskClosures,
        change_approvals: changeApprovals,
        change_closures: changeClosures,
        summary: {
          total_pending: riskClosures.length + changeApprovals.length + changeClosures.length,
          risk_closures: riskClosures.length,
          change_approvals: changeApprovals.length,
          change_closures: changeClosures.length,
          oldest_request: getOldestRequest(riskClosures, changeApprovals, changeClosures)
        }
      }
    });
  } catch (error) {
    console.error('Error generating pending approvals report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating pending approvals report',
      error: error.message
    });
  }
};

function getOldestRequest(risks, changeApprovals, changeClosures) {
  const allDates = [
    ...risks.map(r => r.requested_date),
    ...changeApprovals.map(c => c.request_date),
    ...changeClosures.map(c => c.requested_date)
  ].filter(Boolean);
  
  if (allDates.length === 0) return null;
  
  const oldest = new Date(Math.min(...allDates.map(d => new Date(d))));
  const daysAgo = Math.floor((new Date() - oldest) / (1000 * 60 * 60 * 24));
  
  return {
    date: oldest.toISOString().split('T')[0],
    days_ago: daysAgo
  };
}

// @desc    Team workload analysis
// @route   GET /api/reports/team-workload
exports.getTeamWorkloadReport = async (req, res) => {
  try {
    const workload = await sequelize.query(`
      SELECT 
        p.person_id,
        p.full_name,
        p.role,
        p.department,
        COUNT(DISTINCT ia.action_id) as issue_actions,
        COUNT(DISTINCT ra.action_id) as risk_actions,
        COUNT(DISTINCT ca.action_id) as change_actions,
        COUNT(DISTINCT ia.action_id) + COUNT(DISTINCT ra.action_id) + COUNT(DISTINCT ca.action_id) as total_actions,
        SUM(CASE WHEN ia.status = 'Pending' THEN 1 ELSE 0 END) +
        SUM(CASE WHEN ra.status = 'Pending' THEN 1 ELSE 0 END) +
        SUM(CASE WHEN ca.status = 'Pending' THEN 1 ELSE 0 END) as pending_actions,
        SUM(CASE WHEN ia.due_date < CURDATE() AND ia.status IN ('Pending', 'In Progress') THEN 1 ELSE 0 END) +
        SUM(CASE WHEN ra.due_date < CURDATE() AND ra.status IN ('Pending', 'In Progress') THEN 1 ELSE 0 END) +
        SUM(CASE WHEN ca.due_date < CURDATE() AND ca.status IN ('Pending', 'In Progress') THEN 1 ELSE 0 END) as overdue_actions
      FROM people p
      LEFT JOIN issue_actions ia ON p.person_id = ia.assigned_to AND ia.status IN ('Pending', 'In Progress')
      LEFT JOIN risk_actions ra ON p.person_id = ra.assigned_to AND ra.status IN ('Pending', 'In Progress')
      LEFT JOIN change_actions ca ON p.person_id = ca.assigned_to AND ca.status IN ('Pending', 'In Progress')
      WHERE p.is_active = TRUE
      GROUP BY p.person_id, p.full_name, p.role, p.department
      HAVING total_actions > 0
      ORDER BY total_actions DESC
    `, { type: QueryTypes.SELECT });

    res.json({
      success: true,
      data: {
        team_members: workload,
        summary: {
          total_team_members: workload.length,
          total_actions: workload.reduce((sum, m) => sum + parseInt(m.total_actions), 0),
          total_overdue: workload.reduce((sum, m) => sum + parseInt(m.overdue_actions), 0),
          most_loaded: workload[0] || null,
          members_with_overdue: workload.filter(m => m.overdue_actions > 0).length
        }
      }
    });
  } catch (error) {
    console.error('Error generating team workload report:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating team workload report',
      error: error.message
    });
  }
};

// =====================================================
// TREND ANALYSIS
// =====================================================

// @desc    Trend analysis over time
// @route   GET /api/reports/trends
exports.getTrendAnalysis = async (req, res) => {
  try {
    const { project_id, days = 30 } = req.query;
    
    let projectFilter = project_id ? `AND project_id = ${project_id}` : '';

    // Issues created over time
    const issueTrend = await sequelize.query(`
      SELECT 
        DATE(raised_date) as date,
        COUNT(*) as count,
        SUM(CASE WHEN priority = 'Critical' THEN 1 ELSE 0 END) as critical_count
      FROM issues
      WHERE raised_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ${projectFilter}
      GROUP BY DATE(raised_date)
      ORDER BY date ASC
    `, {
      replacements: [days],
      type: QueryTypes.SELECT
    });

    // Risks identified over time
    const riskTrend = await sequelize.query(`
      SELECT 
        DATE(identified_date) as date,
        COUNT(*) as count,
        AVG(risk_score) as avg_score
      FROM risks
      WHERE identified_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ${projectFilter}
      GROUP BY DATE(identified_date)
      ORDER BY date ASC
    `, {
      replacements: [days],
      type: QueryTypes.SELECT
    });

    // Changes requested over time
    const changeTrend = await sequelize.query(`
      SELECT 
        DATE(request_date) as date,
        COUNT(*) as count,
        SUM(cost_impact) as total_cost_impact
      FROM changes
      WHERE request_date >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
      ${projectFilter}
      GROUP BY DATE(request_date)
      ORDER BY date ASC
    `, {
      replacements: [days],
      type: QueryTypes.SELECT
    });

    res.json({
      success: true,
      data: {
        period_days: parseInt(days),
        issues: issueTrend,
        risks: riskTrend,
        changes: changeTrend,
        summary: {
          issues_created: issueTrend.reduce((sum, d) => sum + parseInt(d.count), 0),
          risks_identified: riskTrend.reduce((sum, d) => sum + parseInt(d.count), 0),
          changes_requested: changeTrend.reduce((sum, d) => sum + parseInt(d.count), 0)
        }
      }
    });
  } catch (error) {
    console.error('Error generating trend analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating trend analysis',
      error: error.message
    });
  }
};

module.exports = exports;