// backend/src/controllers/dashboardController.js
const { sequelize } = require('../models');
const { QueryTypes } = sequelize;

// =====================================================
// MAIN DASHBOARD
// =====================================================

// @desc    Get comprehensive dashboard overview
// @route   GET /api/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const { project_id } = req.query;
    
    // Build WHERE clause for project filtering
    const projectFilter = project_id ? `AND project_id = ${project_id}` : '';
    
    // =================================================
    // 1. PROJECT OVERVIEW
    // =================================================
    
    const projectStats = await sequelize.query(`
      SELECT 
        COUNT(*) as total_projects,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN status = 'Planning' THEN 1 ELSE 0 END) as planning,
        SUM(CASE WHEN status = 'On Hold' THEN 1 ELSE 0 END) as on_hold,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed
      FROM projects
      ${project_id ? `WHERE project_id = ${project_id}` : ''}
    `, { type: QueryTypes.SELECT });
    
    // =================================================
    // 2. ISSUES SUMMARY
    // =================================================
    
    const issueStats = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status IN ('Open', 'In Progress') THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN priority = 'Critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN priority = 'High' THEN 1 ELSE 0 END) as high,
        SUM(CASE WHEN target_resolution_date < CURDATE() AND status NOT IN ('Resolved', 'Closed') THEN 1 ELSE 0 END) as overdue
      FROM issues
      WHERE 1=1 ${projectFilter}
    `, { type: QueryTypes.SELECT });
    
    // Get critical issues list
    const criticalIssues = await sequelize.query(`
      SELECT 
        i.issue_id,
        i.issue_number,
        i.title,
        i.priority,
        i.status,
        i.raised_date,
        i.target_resolution_date,
        DATEDIFF(CURDATE(), i.raised_date) as days_open,
        p.project_name,
        assignee.full_name as assigned_to_name
      FROM issues i
      LEFT JOIN projects p ON i.project_id = p.project_id
      LEFT JOIN people assignee ON i.assigned_to = assignee.person_id
      WHERE i.priority = 'Critical' 
        AND i.status NOT IN ('Resolved', 'Closed', 'Cancelled')
        ${project_id ? `AND i.project_id = ${project_id}` : ''}
      ORDER BY i.raised_date ASC
      LIMIT 10
    `, { type: QueryTypes.SELECT });
    
    // =================================================
    // 3. RISKS SUMMARY
    // =================================================
    
    const riskStats = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status NOT IN ('Closed') THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN risk_score >= 16 THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN risk_score >= 12 AND risk_score < 16 THEN 1 ELSE 0 END) as high,
        AVG(risk_score) as avg_score,
        MAX(risk_score) as max_score
      FROM risks
      WHERE 1=1 ${projectFilter}
    `, { type: QueryTypes.SELECT });
    
    // Get high-severity risks
    const highRisks = await sequelize.query(`
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
      WHERE r.risk_score >= 12 
        AND r.status NOT IN ('Closed')
        ${project_id ? `AND r.project_id = ${project_id}` : ''}
      ORDER BY r.risk_score DESC
      LIMIT 10
    `, { type: QueryTypes.SELECT });
    
    // =================================================
    // 4. CHANGES SUMMARY
    // =================================================
    
    const changeStats = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Requested' THEN 1 ELSE 0 END) as requested,
        SUM(CASE WHEN status = 'Under Review' THEN 1 ELSE 0 END) as under_review,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
        SUM(CASE WHEN status = 'Implemented' THEN 1 ELSE 0 END) as implemented,
        SUM(cost_impact) as total_cost_impact,
        SUM(schedule_impact_days) as total_schedule_impact
      FROM changes
      WHERE 1=1 ${projectFilter}
    `, { type: QueryTypes.SELECT });
    
    // =================================================
    // 5. ESCALATIONS SUMMARY
    // =================================================
    
    const escalationStats = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status NOT IN ('Closed') THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN severity = 'Critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'High' THEN 1 ELSE 0 END) as high
      FROM escalations
      WHERE 1=1 ${projectFilter}
    `, { type: QueryTypes.SELECT });
    
    // Get active escalations
    const activeEscalations = await sequelize.query(`
      SELECT 
        e.escalation_id,
        e.escalation_number,
        e.title,
        e.severity,
        e.status,
        e.raised_date,
        DATEDIFF(CURDATE(), e.raised_date) as days_open,
        p.project_name,
        escalated.full_name as escalated_to_name
      FROM escalations e
      LEFT JOIN projects p ON e.project_id = p.project_id
      LEFT JOIN people escalated ON e.escalated_to = escalated.person_id
      WHERE e.status NOT IN ('Closed')
        ${project_id ? `AND e.project_id = ${project_id}` : ''}
      ORDER BY 
        CASE e.severity 
          WHEN 'Critical' THEN 1
          WHEN 'High' THEN 2
          WHEN 'Medium' THEN 3
          ELSE 4
        END,
        e.raised_date ASC
      LIMIT 10
    `, { type: QueryTypes.SELECT });
    
    // =================================================
    // 6. FAULTS SUMMARY
    // =================================================
    
    const faultStats = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status NOT IN ('Closed') THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN severity = 'Blocking' THEN 1 ELSE 0 END) as blocking,
        SUM(CASE WHEN severity = 'Critical' THEN 1 ELSE 0 END) as critical,
        SUM(CASE WHEN severity = 'Major' THEN 1 ELSE 0 END) as major
      FROM faults
      WHERE 1=1 ${projectFilter}
    `, { type: QueryTypes.SELECT });
    
    // Get blocking/critical faults
    const criticalFaults = await sequelize.query(`
      SELECT 
        f.fault_id,
        f.fault_number,
        f.title,
        f.severity,
        f.status,
        f.reported_date,
        DATEDIFF(CURDATE(), f.reported_date) as days_open,
        p.project_name,
        assignee.full_name as assigned_to_name
      FROM faults f
      LEFT JOIN projects p ON f.project_id = p.project_id
      LEFT JOIN people assignee ON f.assigned_to = assignee.person_id
      WHERE f.severity IN ('Blocking', 'Critical')
        AND f.status NOT IN ('Closed')
        ${project_id ? `AND f.project_id = ${project_id}` : ''}
      ORDER BY 
        CASE f.severity 
          WHEN 'Blocking' THEN 1
          WHEN 'Critical' THEN 2
          ELSE 3
        END,
        f.reported_date ASC
      LIMIT 10
    `, { type: QueryTypes.SELECT });
    
    // =================================================
    // 7. PENDING APPROVALS
    // =================================================
    
    // Risk closure requests
    const riskClosureRequests = await sequelize.query(`
      SELECT 
        r.risk_id,
        r.risk_number,
        r.title,
        r.risk_score,
        r.status,
        p.project_name,
        owner.full_name as owner_name,
        rl.log_date as requested_date,
        DATEDIFF(CURDATE(), rl.log_date) as days_pending
      FROM risks r
      INNER JOIN risk_log rl ON r.risk_id = rl.risk_id
      LEFT JOIN projects p ON r.project_id = p.project_id
      LEFT JOIN people owner ON r.owner = owner.person_id
      WHERE rl.log_type = 'Closure Request'
        AND r.status = 'Mitigated'
        AND NOT EXISTS (
          SELECT 1 FROM risk_log rl2 
          WHERE rl2.risk_id = r.risk_id 
          AND rl2.log_type IN ('Closure Approved', 'Closure Rejected')
          AND rl2.log_date > rl.log_date
        )
        ${project_id ? `AND r.project_id = ${project_id}` : ''}
      ORDER BY rl.log_date ASC
    `, { type: QueryTypes.SELECT });
    
    // Change approval requests
    const changeApprovalRequests = await sequelize.query(`
      SELECT 
        c.change_id,
        c.change_number,
        c.title,
        c.change_type,
        c.priority,
        c.cost_impact,
        c.schedule_impact_days,
        c.request_date,
        DATEDIFF(CURDATE(), c.request_date) as days_pending,
        p.project_name,
        requester.full_name as requested_by_name
      FROM changes c
      LEFT JOIN projects p ON c.project_id = p.project_id
      LEFT JOIN people requester ON c.requested_by = requester.person_id
      WHERE c.status = 'Under Review'
        ${project_id ? `AND c.project_id = ${project_id}` : ''}
      ORDER BY c.request_date ASC
    `, { type: QueryTypes.SELECT });
    
    // Change closure requests
    const changeClosureRequests = await sequelize.query(`
      SELECT 
        c.change_id,
        c.change_number,
        c.title,
        c.implementation_date,
        p.project_name,
        cl.log_date as requested_date,
        DATEDIFF(CURDATE(), cl.log_date) as days_pending
      FROM changes c
      INNER JOIN change_log cl ON c.change_id = cl.change_id
      LEFT JOIN projects p ON c.project_id = p.project_id
      WHERE cl.log_type = 'Closure Request'
        AND c.status = 'Implemented'
        AND NOT EXISTS (
          SELECT 1 FROM change_log cl2
          WHERE cl2.change_id = c.change_id
          AND cl2.log_type IN ('Closure Approved', 'Closure Rejected')
          AND cl2.log_date > cl.log_date
        )
        ${project_id ? `AND c.project_id = ${project_id}` : ''}
      ORDER BY cl.log_date ASC
    `, { type: QueryTypes.SELECT });
    
    // =================================================
    // 8. OVERDUE ACTIONS (Across all modules)
    // =================================================
    
    const overdueActions = await sequelize.query(`
      SELECT 
        'Issue' as source_type,
        i.issue_number as source_number,
        i.title as source_title,
        ia.action_id,
        ia.action_description,
        ia.status,
        ia.priority,
        ia.due_date,
        DATEDIFF(CURDATE(), ia.due_date) as days_overdue,
        p.project_name,
        assignee.full_name as assigned_to_name
      FROM issue_actions ia
      INNER JOIN issues i ON ia.issue_id = i.issue_id
      LEFT JOIN projects p ON i.project_id = p.project_id
      LEFT JOIN people assignee ON ia.assigned_to = assignee.person_id
      WHERE ia.due_date < CURDATE()
        AND ia.status IN ('Pending', 'In Progress')
        ${project_id ? `AND i.project_id = ${project_id}` : ''}
      
      UNION ALL
      
      SELECT 
        'Risk' as source_type,
        r.risk_number as source_number,
        r.title as source_title,
        ra.action_id,
        ra.action_description,
        ra.status,
        ra.priority,
        ra.due_date,
        DATEDIFF(CURDATE(), ra.due_date) as days_overdue,
        p.project_name,
        assignee.full_name as assigned_to_name
      FROM risk_actions ra
      INNER JOIN risks r ON ra.risk_id = r.risk_id
      LEFT JOIN projects p ON r.project_id = p.project_id
      LEFT JOIN people assignee ON ra.assigned_to = assignee.person_id
      WHERE ra.due_date < CURDATE()
        AND ra.status IN ('Pending', 'In Progress')
        ${project_id ? `AND r.project_id = ${project_id}` : ''}
      
      UNION ALL
      
      SELECT 
        'Change' as source_type,
        c.change_number as source_number,
        c.title as source_title,
        ca.action_id,
        ca.action_description,
        ca.status,
        ca.priority,
        ca.due_date,
        DATEDIFF(CURDATE(), ca.due_date) as days_overdue,
        p.project_name,
        assignee.full_name as assigned_to_name
      FROM change_actions ca
      INNER JOIN changes c ON ca.change_id = c.change_id
      LEFT JOIN projects p ON c.project_id = p.project_id
      LEFT JOIN people assignee ON ca.assigned_to = assignee.person_id
      WHERE ca.due_date < CURDATE()
        AND ca.status IN ('Pending', 'In Progress')
        ${project_id ? `AND c.project_id = ${project_id}` : ''}
      
      ORDER BY days_overdue DESC, priority DESC
      LIMIT 20
    `, { type: QueryTypes.SELECT });
    
    // =================================================
    // 9. TEAM WORKLOAD (Top 5 busiest)
    // =================================================
    
    const teamWorkload = await sequelize.query(`
      SELECT 
        p.person_id,
        p.full_name,
        p.role,
        p.department,
        COUNT(DISTINCT ia.action_id) + 
        COUNT(DISTINCT ra.action_id) + 
        COUNT(DISTINCT ca.action_id) +
        COUNT(DISTINCT ea.action_id) +
        COUNT(DISTINCT fa.action_id) as total_actions,
        SUM(CASE WHEN ia.priority = 'Critical' OR ra.priority = 'Critical' OR ca.priority = 'Critical' 
                 OR ea.priority = 'Critical' OR fa.priority = 'Critical' 
            THEN 1 ELSE 0 END) as critical_actions,
        SUM(CASE WHEN ia.due_date < CURDATE() OR ra.due_date < CURDATE() OR ca.due_date < CURDATE() 
                 OR ea.due_date < CURDATE() OR fa.due_date < CURDATE()
            THEN 1 ELSE 0 END) as overdue_actions
      FROM people p
      LEFT JOIN issue_actions ia ON p.person_id = ia.assigned_to AND ia.status IN ('Pending', 'In Progress')
      LEFT JOIN risk_actions ra ON p.person_id = ra.assigned_to AND ra.status IN ('Pending', 'In Progress')
      LEFT JOIN change_actions ca ON p.person_id = ca.assigned_to AND ca.status IN ('Pending', 'In Progress')
      LEFT JOIN escalation_actions ea ON p.person_id = ea.assigned_to AND ea.status IN ('Pending', 'In Progress')
      LEFT JOIN fault_actions fa ON p.person_id = fa.assigned_to AND fa.status IN ('Pending', 'In Progress')
      WHERE p.is_active = TRUE
      GROUP BY p.person_id, p.full_name, p.role, p.department
      HAVING total_actions > 0
      ORDER BY total_actions DESC
      LIMIT 5
    `, { type: QueryTypes.SELECT });
    
    // =================================================
    // 10. KEY METRICS
    // =================================================
    
    const totalApprovals = riskClosureRequests.length + 
                           changeApprovalRequests.length + 
                           changeClosureRequests.length;
    
    const totalOverdue = parseInt(issueStats[0].overdue || 0) + overdueActions.length;
    
    const criticalItems = parseInt(issueStats[0].critical || 0) + 
                         parseInt(riskStats[0].critical || 0) + 
                         parseInt(escalationStats[0].critical || 0) +
                         parseInt(faultStats[0].blocking || 0);
    
    // =================================================
    // RESPONSE
    // =================================================
    
    res.json({
      success: true,
      dashboard: {
        generated_at: new Date().toISOString(),
        project_filter: project_id ? `Project ID: ${project_id}` : 'All Projects',
        
        // High-level metrics
        metrics: {
          total_projects: parseInt(projectStats[0].total_projects || 0),
          active_projects: parseInt(projectStats[0].active || 0),
          pending_approvals: totalApprovals,
          critical_items: criticalItems,
          total_overdue: totalOverdue
        },
        
        // Detailed breakdowns
        projects: projectStats[0],
        
        issues: {
          stats: issueStats[0],
          critical_list: criticalIssues
        },
        
        risks: {
          stats: {
            ...riskStats[0],
            avg_score: parseFloat(riskStats[0].avg_score || 0).toFixed(2)
          },
          high_risk_list: highRisks
        },
        
        changes: {
          stats: {
            ...changeStats[0],
            total_cost_impact: parseFloat(changeStats[0].total_cost_impact || 0),
            total_schedule_impact: parseInt(changeStats[0].total_schedule_impact || 0)
          }
        },
        
        escalations: {
          stats: escalationStats[0],
          active_list: activeEscalations
        },
        
        faults: {
          stats: faultStats[0],
          critical_list: criticalFaults
        },
        
        pending_approvals: {
          total: totalApprovals,
          risk_closures: {
            count: riskClosureRequests.length,
            items: riskClosureRequests
          },
          change_approvals: {
            count: changeApprovalRequests.length,
            items: changeApprovalRequests
          },
          change_closures: {
            count: changeClosureRequests.length,
            items: changeClosureRequests
          }
        },
        
        overdue_actions: {
          count: overdueActions.length,
          items: overdueActions
        },
        
        team_workload: {
          top_5: teamWorkload
        }
      }
    });
    
  } catch (error) {
    console.error('Error generating dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating dashboard',
      error: error.message
    });
  }
};

// =====================================================
// QUICK STATS (Lightweight version)
// =====================================================

// @desc    Get quick statistics (lightweight for frequent polling)
// @route   GET /api/dashboard/quick-stats
exports.getQuickStats = async (req, res) => {
  try {
    const { project_id } = req.query;
    const projectFilter = project_id ? `AND project_id = ${project_id}` : '';
    
    // Get counts only (fast query)
    const stats = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM issues WHERE status NOT IN ('Closed', 'Cancelled') ${projectFilter}) as open_issues,
        (SELECT COUNT(*) FROM issues WHERE priority = 'Critical' AND status NOT IN ('Closed', 'Cancelled') ${projectFilter}) as critical_issues,
        (SELECT COUNT(*) FROM risks WHERE status NOT IN ('Closed') ${projectFilter}) as active_risks,
        (SELECT COUNT(*) FROM risks WHERE risk_score >= 16 AND status NOT IN ('Closed') ${projectFilter}) as critical_risks,
        (SELECT COUNT(*) FROM changes WHERE status = 'Under Review' ${projectFilter}) as pending_change_approvals,
        (SELECT COUNT(*) FROM escalations WHERE status NOT IN ('Closed') ${projectFilter}) as active_escalations,
        (SELECT COUNT(*) FROM faults WHERE severity IN ('Blocking', 'Critical') AND status NOT IN ('Closed') ${projectFilter}) as critical_faults
    `, { type: QueryTypes.SELECT });
    
    res.json({
      success: true,
      stats: stats[0],
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error getting quick stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting quick stats',
      error: error.message
    });
  }
};

module.exports = exports;
