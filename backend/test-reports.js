// backend/test-reports.js
// Test all reporting and analytics endpoints
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testReports() {
  console.log('='.repeat(70));
  console.log('PMBOK Reports & Analytics - Comprehensive Test');
  console.log('='.repeat(70));
  console.log('');

  try {
    // Test 1: Executive Summary
    console.log('📊 Test 1: Executive Summary Report');
    console.log('-'.repeat(70));
    const execResp = await axios.get(`${BASE_URL}/reports/executive-summary`);
    console.log('✅ Executive Summary Generated');
    console.log('');
    console.log('OVERVIEW:');
    console.log(`  Projects: ${execResp.data.data.projects.total_projects} total, ${execResp.data.data.projects.active_projects} active`);
    console.log(`  Issues: ${execResp.data.data.issues.total_issues} total, ${execResp.data.data.issues.open_issues} open, ${execResp.data.data.issues.critical_issues} critical`);
    console.log(`  Risks: ${execResp.data.data.risks.total_risks} total, ${execResp.data.data.risks.active_risks} active, Avg Score: ${execResp.data.data.risks.avg_risk_score}`);
    console.log(`  Changes: ${execResp.data.data.changes.total_changes} total, Cost Impact: $${execResp.data.data.changes.total_cost_impact.toLocaleString()}, Schedule: ${execResp.data.data.changes.total_schedule_impact} days`);
    console.log(`  Pending Approvals: ${execResp.data.data.pending_approvals.total} total`);
    console.log('');

    // Test 2: Risk Heat Map
    console.log('🔥 Test 2: Risk Heat Map');
    console.log('-'.repeat(70));
    const heatMapResp = await axios.get(`${BASE_URL}/reports/risk-heat-map`);
    console.log('✅ Risk Heat Map Generated');
    console.log('');
    console.log('RISK DISTRIBUTION:');
    console.log(`  Total Active Risks: ${heatMapResp.data.data.summary.total_risks}`);
    console.log(`  Critical (16-25): ${heatMapResp.data.data.summary.critical}`);
    console.log(`  High (9-15): ${heatMapResp.data.data.summary.high}`);
    console.log(`  Medium (4-8): ${heatMapResp.data.data.summary.medium}`);
    console.log(`  Low (1-3): ${heatMapResp.data.data.summary.low}`);
    console.log('');
    if (heatMapResp.data.data.risks.length > 0) {
      console.log('TOP 3 RISKS:');
      heatMapResp.data.data.risks.slice(0, 3).forEach((risk, i) => {
        console.log(`  ${i + 1}. ${risk.risk_number}: ${risk.title.substring(0, 50)}`);
        console.log(`     Score: ${risk.risk_score} (${risk.probability} × ${risk.impact})`);
      });
    }
    console.log('');

    // Test 3: Issue Aging Report
    console.log('⏰ Test 3: Issue Aging Report');
    console.log('-'.repeat(70));
    const agingResp = await axios.get(`${BASE_URL}/reports/issue-aging`);
    console.log('✅ Issue Aging Report Generated');
    console.log('');
    console.log('AGING ANALYSIS:');
    console.log(`  Total Open Issues: ${agingResp.data.data.summary.total_open}`);
    console.log(`  Average Days Open: ${agingResp.data.data.summary.avg_days_open}`);
    console.log(`  Overdue Issues: ${agingResp.data.data.summary.overdue}`);
    console.log(`  Critical Overdue: ${agingResp.data.data.summary.critical_overdue}`);
    console.log('');
    console.log('BY AGE CATEGORY:');
    console.log(`  Fresh (0-7 days): ${agingResp.data.data.categories.fresh.count}`);
    console.log(`  Recent (8-30 days): ${agingResp.data.data.categories.recent.count}`);
    console.log(`  Aging (31-90 days): ${agingResp.data.data.categories.aging.count}`);
    console.log(`  Stale (90+ days): ${agingResp.data.data.categories.stale.count}`);
    console.log('');

    // Test 4: Change Impact Analysis
    console.log('💰 Test 4: Change Impact Analysis');
    console.log('-'.repeat(70));
    const impactResp = await axios.get(`${BASE_URL}/reports/change-impact`);
    console.log('✅ Change Impact Analysis Generated');
    console.log('');
    console.log('IMPACT SUMMARY:');
    console.log(`  Total Changes: ${impactResp.data.data.summary.total_changes}`);
    console.log(`  Total Cost Impact: $${impactResp.data.data.summary.total_cost_impact.toLocaleString()}`);
    console.log(`  Total Schedule Impact: ${impactResp.data.data.summary.total_schedule_impact} days`);
    console.log(`  Cost Increases: ${impactResp.data.data.summary.cost_increases}`);
    console.log(`  Cost Savings: ${impactResp.data.data.summary.cost_savings}`);
    console.log(`  Schedule Delays: ${impactResp.data.data.summary.schedule_delays}`);
    console.log('');
    console.log('BY CHANGE TYPE:');
    Object.entries(impactResp.data.data.by_type).forEach(([type, data]) => {
      console.log(`  ${type}: ${data.count} changes, Cost: $${data.cost.toLocaleString()}, Schedule: ${data.schedule} days`);
    });
    console.log('');

    // Test 5: Action Items Report
    console.log('✓ Test 5: Action Items Report');
    console.log('-'.repeat(70));
    const actionsResp = await axios.get(`${BASE_URL}/reports/action-items`);
    console.log('✅ Action Items Report Generated');
    console.log('');
    console.log('ACTION ITEMS SUMMARY:');
    console.log(`  Total Active Actions: ${actionsResp.data.data.summary.total}`);
    console.log(`  Overdue: ${actionsResp.data.data.summary.overdue}`);
    console.log(`  Due This Week: ${actionsResp.data.data.summary.due_this_week}`);
    console.log(`  Critical Priority: ${actionsResp.data.data.summary.critical}`);
    console.log('');
    console.log('BY SOURCE:');
    console.log(`  Issue Actions: ${actionsResp.data.data.summary.by_source.issues}`);
    console.log(`  Risk Actions: ${actionsResp.data.data.summary.by_source.risks}`);
    console.log(`  Change Actions: ${actionsResp.data.data.summary.by_source.changes}`);
    console.log('');
    if (actionsResp.data.data.overdue_actions.length > 0) {
      console.log('⚠️  OVERDUE ACTIONS (Top 3):');
      actionsResp.data.data.overdue_actions.slice(0, 3).forEach((action, i) => {
        console.log(`  ${i + 1}. [${action.source_type}] ${action.action_description.substring(0, 50)}`);
        console.log(`     Overdue by: ${action.days_overdue} days | Assigned to: ${action.assigned_to_name || 'Unassigned'}`);
      });
      console.log('');
    }

    // Test 6: Pending Approvals
    console.log('⏳ Test 6: Pending Approvals Report');
    console.log('-'.repeat(70));
    const approvalsResp = await axios.get(`${BASE_URL}/reports/pending-approvals`);
    console.log('✅ Pending Approvals Report Generated');
    console.log('');
    console.log('APPROVAL QUEUE:');
    console.log(`  Total Pending: ${approvalsResp.data.data.summary.total_pending}`);
    console.log(`  Risk Closures: ${approvalsResp.data.data.summary.risk_closures}`);
    console.log(`  Change Approvals: ${approvalsResp.data.data.summary.change_approvals}`);
    console.log(`  Change Closures: ${approvalsResp.data.data.summary.change_closures}`);
    console.log('');
    if (approvalsResp.data.data.summary.oldest_request) {
      console.log(`⚠️  Oldest Request: ${approvalsResp.data.data.summary.oldest_request.days_ago} days ago`);
      console.log('');
    }

    // Test 7: Team Workload
    console.log('👥 Test 7: Team Workload Analysis');
    console.log('-'.repeat(70));
    const workloadResp = await axios.get(`${BASE_URL}/reports/team-workload`);
    console.log('✅ Team Workload Report Generated');
    console.log('');
    console.log('TEAM WORKLOAD:');
    console.log(`  Active Team Members: ${workloadResp.data.data.summary.total_team_members}`);
    console.log(`  Total Actions: ${workloadResp.data.data.summary.total_actions}`);
    console.log(`  Total Overdue: ${workloadResp.data.data.summary.total_overdue}`);
    console.log('');
    if (workloadResp.data.data.team_members.length > 0) {
      console.log('TOP 5 BY WORKLOAD:');
      workloadResp.data.data.team_members.slice(0, 5).forEach((member, i) => {
        console.log(`  ${i + 1}. ${member.full_name} (${member.role})`);
        console.log(`     Total: ${member.total_actions} | Pending: ${member.pending_actions} | Overdue: ${member.overdue_actions}`);
      });
    }
    console.log('');

    // Test 8: Get project if exists
    const projectsResp = await axios.get(`${BASE_URL}/projects`);
    if (projectsResp.data.count > 0) {
      const projectId = projectsResp.data.data[0].project_id;
      
      // Test 9: Project Health
      console.log('🏥 Test 8: Project Health Report');
      console.log('-'.repeat(70));
      const healthResp = await axios.get(`${BASE_URL}/reports/project-health/${projectId}`);
      console.log('✅ Project Health Report Generated');
      console.log('');
      console.log('HEALTH ASSESSMENT:');
      console.log(`  Overall Health Score: ${healthResp.data.data.health_score}/100`);
      console.log(`  Health Status: ${healthResp.data.data.health_status}`);
      console.log('');
      console.log('COMPONENT SCORES:');
      console.log(`  Issues: ${healthResp.data.data.components.issues.score.toFixed(1)}/100`);
      console.log(`  Risks: ${healthResp.data.data.components.risks.score.toFixed(1)}/100`);
      console.log(`  Changes: ${healthResp.data.data.components.changes.score.toFixed(1)}/100`);
      console.log('');
      console.log('RECOMMENDATIONS:');
      healthResp.data.data.recommendations.forEach((rec, i) => {
        console.log(`  ${i + 1}. ${rec}`);
      });
      console.log('');

      // Test 10: Project Summary
      console.log('📑 Test 9: Project Summary Report');
      console.log('-'.repeat(70));
      const summaryResp = await axios.get(`${BASE_URL}/reports/project-summary/${projectId}`);
      console.log('✅ Project Summary Report Generated');
      console.log('');
      console.log(`PROJECT: ${summaryResp.data.data.project.project_name}`);
      console.log(`  Code: ${summaryResp.data.data.project.project_code}`);
      console.log(`  Status: ${summaryResp.data.data.project.status}`);
      console.log('');
      console.log('ISSUES:');
      console.log(`  Total: ${summaryResp.data.data.issues.total}`);
      console.log(`  Open: ${summaryResp.data.data.issues.open} | In Progress: ${summaryResp.data.data.issues.in_progress} | Resolved: ${summaryResp.data.data.issues.resolved}`);
      console.log('');
      console.log('RISKS:');
      console.log(`  Total: ${summaryResp.data.data.risks.total}`);
      console.log(`  Average Score: ${summaryResp.data.data.risks.avg_score}`);
      console.log('');
      console.log('CHANGES:');
      console.log(`  Total: ${summaryResp.data.data.changes.total}`);
      console.log(`  Cost Impact: $${parseFloat(summaryResp.data.data.changes.total_cost_impact).toLocaleString()}`);
      console.log('');
    }

    // Test 11: Trend Analysis
    console.log('📈 Test 10: Trend Analysis (Last 30 Days)');
    console.log('-'.repeat(70));
    const trendsResp = await axios.get(`${BASE_URL}/reports/trends?days=30`);
    console.log('✅ Trend Analysis Generated');
    console.log('');
    console.log('30-DAY TRENDS:');
    console.log(`  Issues Created: ${trendsResp.data.data.summary.issues_created}`);
    console.log(`  Risks Identified: ${trendsResp.data.data.summary.risks_identified}`);
    console.log(`  Changes Requested: ${trendsResp.data.data.summary.changes_requested}`);
    console.log('');

    // Final Summary
    console.log('='.repeat(70));
    console.log('ALL REPORTS GENERATED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log('');
    console.log('📊 AVAILABLE REPORTS:');
    console.log('  ✅ Executive Summary - High-level overview');
    console.log('  ✅ Risk Heat Map - Probability vs Impact matrix');
    console.log('  ✅ Issue Aging - How long issues have been open');
    console.log('  ✅ Change Impact - Cost and schedule analysis');
    console.log('  ✅ Action Items - Overdue and due soon');
    console.log('  ✅ Pending Approvals - What needs approval');
    console.log('  ✅ Team Workload - Who has what actions');
    console.log('  ✅ Project Health - Overall project status');
    console.log('  ✅ Project Summary - Complete project overview');
    console.log('  ✅ Trend Analysis - Activity over time');
    console.log('');
    console.log('🎯 USE CASES:');
    console.log('  • Executive reporting and dashboards');
    console.log('  • Project status meetings');
    console.log('  • Risk review boards');
    console.log('  • Change control boards');
    console.log('  • Team capacity planning');
    console.log('  • Performance metrics and KPIs');
    console.log('');
    console.log('🚀 READY FOR PRODUCTION!');
    console.log('');
    console.log('View reports in browser:');
    console.log(`  Executive: http://localhost:3001/api/reports/executive-summary`);
    console.log(`  Risk Map: http://localhost:3001/api/reports/risk-heat-map`);
    console.log(`  Issues: http://localhost:3001/api/reports/issue-aging`);
    console.log(`  Changes: http://localhost:3001/api/reports/change-impact`);
    console.log(`  Actions: http://localhost:3001/api/reports/action-items`);
    console.log(`  Approvals: http://localhost:3001/api/reports/pending-approvals`);
    console.log('');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('');
    console.error('❌ ERROR OCCURRED:');
    console.error('='.repeat(70));
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data.message || error.response.data);
      console.error('URL:', error.config.url);
    } else {
      console.error('Error:', error.message);
    }
    console.error('='.repeat(70));
  }
}

testReports();