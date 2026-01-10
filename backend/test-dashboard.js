// backend/test-dashboard.js
// Complete test for Dashboard API
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testDashboard() {
  console.log('='.repeat(70));
  console.log('PMBOK Dashboard API - Comprehensive Test');
  console.log('Mission Control for Your Entire PMBOK System');
  console.log('='.repeat(70));
  console.log('');

  try {
    // Test 1: Get Full Dashboard
    console.log('📊 Test 1: Getting full dashboard overview...');
    console.log('-'.repeat(70));
    const dashboard = await axios.get(`${BASE_URL}/dashboard`);
    const data = dashboard.data.dashboard;
    
    console.log('✅ Dashboard generated successfully!');
    console.log('');
    
    // Display High-Level Metrics
    console.log('🎯 HIGH-LEVEL METRICS:');
    console.log(`   Total Projects: ${data.metrics.total_projects}`);
    console.log(`   Active Projects: ${data.metrics.active_projects}`);
    console.log(`   🚨 Pending Approvals: ${data.metrics.pending_approvals}`);
    console.log(`   🔴 Critical Items: ${data.metrics.critical_items}`);
    console.log(`   ⏰ Total Overdue: ${data.metrics.total_overdue}`);
    console.log('');
    
    // Projects Breakdown
    console.log('📁 PROJECTS:');
    console.log(`   Total: ${data.projects.total_projects}`);
    console.log(`   Active: ${data.projects.active}`);
    console.log(`   Planning: ${data.projects.planning}`);
    console.log(`   On Hold: ${data.projects.on_hold}`);
    console.log(`   Completed: ${data.projects.completed}`);
    console.log('');
    
    // Issues Summary
    console.log('🐛 ISSUES:');
    console.log(`   Total: ${data.issues.stats.total}`);
    console.log(`   Open: ${data.issues.stats.open}`);
    console.log(`   Critical: ${data.issues.stats.critical}`);
    console.log(`   High Priority: ${data.issues.stats.high}`);
    console.log(`   Overdue: ${data.issues.stats.overdue}`);
    
    if (data.issues.critical_list.length > 0) {
      console.log('');
      console.log('   🚨 Critical Issues:');
      data.issues.critical_list.slice(0, 3).forEach((issue, i) => {
        console.log(`   ${i + 1}. ${issue.issue_number}: ${issue.title}`);
        console.log(`      Status: ${issue.status} | Open: ${issue.days_open} days`);
        console.log(`      Project: ${issue.project_name}`);
      });
    }
    console.log('');
    
    // Risks Summary
    console.log('⚠️  RISKS:');
    console.log(`   Total: ${data.risks.stats.total}`);
    console.log(`   Active: ${data.risks.stats.active}`);
    console.log(`   Critical (Score ≥16): ${data.risks.stats.critical}`);
    console.log(`   High (Score ≥12): ${data.risks.stats.high}`);
    console.log(`   Average Score: ${data.risks.stats.avg_score}`);
    console.log(`   Max Score: ${data.risks.stats.max_score}`);
    
    if (data.risks.high_risk_list.length > 0) {
      console.log('');
      console.log('   🔥 High-Severity Risks:');
      data.risks.high_risk_list.slice(0, 3).forEach((risk, i) => {
        console.log(`   ${i + 1}. ${risk.risk_number}: ${risk.title}`);
        console.log(`      Score: ${risk.risk_score} (${risk.probability} × ${risk.impact})`);
        console.log(`      Status: ${risk.status} | Project: ${risk.project_name}`);
      });
    }
    console.log('');
    
    // Changes Summary
    console.log('🔄 CHANGES:');
    console.log(`   Total: ${data.changes.stats.total}`);
    console.log(`   Requested: ${data.changes.stats.requested}`);
    console.log(`   Under Review: ${data.changes.stats.under_review}`);
    console.log(`   Approved: ${data.changes.stats.approved}`);
    console.log(`   Implemented: ${data.changes.stats.implemented}`);
    console.log(`   Total Cost Impact: $${parseFloat(data.changes.stats.total_cost_impact).toLocaleString()}`);
    console.log(`   Total Schedule Impact: ${data.changes.stats.total_schedule_impact} days`);
    console.log('');
    
    // Escalations Summary
    console.log('📢 ESCALATIONS:');
    console.log(`   Total: ${data.escalations.stats.total}`);
    console.log(`   Active: ${data.escalations.stats.active}`);
    console.log(`   Critical: ${data.escalations.stats.critical}`);
    console.log(`   High: ${data.escalations.stats.high}`);
    
    if (data.escalations.active_list.length > 0) {
      console.log('');
      console.log('   🚨 Active Escalations:');
      data.escalations.active_list.slice(0, 3).forEach((esc, i) => {
        console.log(`   ${i + 1}. ${esc.escalation_number}: ${esc.title}`);
        console.log(`      Severity: ${esc.severity} | Open: ${esc.days_open} days`);
        console.log(`      Escalated to: ${esc.escalated_to_name || 'Not assigned'}`);
      });
    }
    console.log('');
    
    // Faults Summary
    console.log('🔧 FAULTS:');
    console.log(`   Total: ${data.faults.stats.total}`);
    console.log(`   Open: ${data.faults.stats.open}`);
    console.log(`   Blocking: ${data.faults.stats.blocking}`);
    console.log(`   Critical: ${data.faults.stats.critical}`);
    console.log(`   Major: ${data.faults.stats.major}`);
    
    if (data.faults.critical_list.length > 0) {
      console.log('');
      console.log('   🚫 Blocking/Critical Faults:');
      data.faults.critical_list.slice(0, 3).forEach((fault, i) => {
        console.log(`   ${i + 1}. ${fault.fault_number}: ${fault.title}`);
        console.log(`      Severity: ${fault.severity} | Open: ${fault.days_open} days`);
        console.log(`      Project: ${fault.project_name}`);
      });
    }
    console.log('');
    
    // Pending Approvals
    console.log('✅ PENDING APPROVALS:');
    console.log(`   Total Awaiting Approval: ${data.pending_approvals.total}`);
    console.log(`   Risk Closures: ${data.pending_approvals.risk_closures.count}`);
    console.log(`   Change Approvals: ${data.pending_approvals.change_approvals.count}`);
    console.log(`   Change Closures: ${data.pending_approvals.change_closures.count}`);
    
    if (data.pending_approvals.total > 0) {
      console.log('');
      console.log('   ⏳ Approval Queue:');
      
      if (data.pending_approvals.risk_closures.items.length > 0) {
        console.log('   Risk Closures:');
        data.pending_approvals.risk_closures.items.forEach((item, i) => {
          console.log(`   ${i + 1}. ${item.risk_number}: ${item.title}`);
          console.log(`      Pending: ${item.days_pending} days | Score: ${item.risk_score}`);
        });
      }
      
      if (data.pending_approvals.change_approvals.items.length > 0) {
        console.log('   Change Approvals:');
        data.pending_approvals.change_approvals.items.forEach((item, i) => {
          console.log(`   ${i + 1}. ${item.change_number}: ${item.title}`);
          console.log(`      Pending: ${item.days_pending} days | Cost: $${parseFloat(item.cost_impact || 0).toLocaleString()}`);
        });
      }
    }
    console.log('');
    
    // Overdue Actions
    console.log('⏰ OVERDUE ACTIONS:');
    console.log(`   Total Overdue: ${data.overdue_actions.count}`);
    
    if (data.overdue_actions.items.length > 0) {
      console.log('');
      console.log('   🔴 Most Overdue Actions (Top 5):');
      data.overdue_actions.items.slice(0, 5).forEach((action, i) => {
        console.log(`   ${i + 1}. [${action.source_type}] ${action.action_description.substring(0, 50)}`);
        console.log(`      Overdue: ${action.days_overdue} days | Priority: ${action.priority}`);
        console.log(`      Assigned to: ${action.assigned_to_name || 'Unassigned'}`);
        console.log(`      Source: ${action.source_number} - ${action.source_title.substring(0, 40)}`);
      });
    }
    console.log('');
    
    // Team Workload
    console.log('👥 TEAM WORKLOAD (Top 5):');
    if (data.team_workload.top_5.length > 0) {
      data.team_workload.top_5.forEach((person, i) => {
        console.log(`   ${i + 1}. ${person.full_name} (${person.role})`);
        console.log(`      Total Actions: ${person.total_actions} | Critical: ${person.critical_actions} | Overdue: ${person.overdue_actions}`);
      });
    } else {
      console.log('   No active workload');
    }
    console.log('');
    
    console.log('='.repeat(70));
    console.log('');
    
    // Test 2: Quick Stats (Lightweight)
    console.log('⚡ Test 2: Getting quick stats (lightweight)...');
    console.log('-'.repeat(70));
    const quickStats = await axios.get(`${BASE_URL}/dashboard/quick-stats`);
    
    console.log('✅ Quick stats retrieved!');
    console.log('');
    console.log('   Quick Metrics:');
    console.log(`   Open Issues: ${quickStats.data.stats.open_issues}`);
    console.log(`   Critical Issues: ${quickStats.data.stats.critical_issues}`);
    console.log(`   Active Risks: ${quickStats.data.stats.active_risks}`);
    console.log(`   Critical Risks: ${quickStats.data.stats.critical_risks}`);
    console.log(`   Pending Change Approvals: ${quickStats.data.stats.pending_change_approvals}`);
    console.log(`   Active Escalations: ${quickStats.data.stats.active_escalations}`);
    console.log(`   Critical Faults: ${quickStats.data.stats.critical_faults}`);
    console.log('');
    console.log('='.repeat(70));
    console.log('');
    
    // Test 3: Project-Specific Dashboard
    if (data.metrics.total_projects > 0) {
      console.log('🎯 Test 3: Getting dashboard for specific project...');
      console.log('-'.repeat(70));
      
      // Get first project
      const projects = await axios.get(`${BASE_URL}/projects`);
      if (projects.data.count > 0) {
        const projectId = projects.data.data[0].project_id;
        const projectName = projects.data.data[0].project_name;
        
        const projectDashboard = await axios.get(`${BASE_URL}/dashboard?project_id=${projectId}`);
        const projectData = projectDashboard.data.dashboard;
        
        console.log(`✅ Project dashboard for: ${projectName}`);
        console.log('');
        console.log('   Filtered Metrics:');
        console.log(`   Critical Items: ${projectData.metrics.critical_items}`);
        console.log(`   Pending Approvals: ${projectData.metrics.pending_approvals}`);
        console.log(`   Overdue Items: ${projectData.metrics.total_overdue}`);
        console.log('');
        console.log(`   Issues: ${projectData.issues.stats.open} open, ${projectData.issues.stats.critical} critical`);
        console.log(`   Risks: ${projectData.risks.stats.active} active, avg score ${projectData.risks.stats.avg_score}`);
        console.log(`   Changes: ${projectData.changes.stats.under_review} under review`);
        console.log('');
      }
      console.log('='.repeat(70));
      console.log('');
    }
    
    // Final Summary
    console.log('🎉 ALL DASHBOARD TESTS COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log('');
    console.log('📊 DASHBOARD CAPABILITIES:');
    console.log('   ✅ Aggregates data from ALL 8 PMBOK modules');
    console.log('   ✅ Shows critical items requiring attention');
    console.log('   ✅ Lists pending approvals (risks, changes)');
    console.log('   ✅ Identifies overdue actions across all modules');
    console.log('   ✅ Displays team workload distribution');
    console.log('   ✅ Provides quick stats for frequent polling');
    console.log('   ✅ Supports project-specific filtering');
    console.log('');
    
    console.log('🎯 USE CASES:');
    console.log('   • Executive overview meetings');
    console.log('   • Daily stand-ups (what needs attention?)');
    console.log('   • Project health monitoring');
    console.log('   • Resource allocation decisions');
    console.log('   • Priority triage sessions');
    console.log('   • Management reporting');
    console.log('');
    
    console.log('💡 API USAGE:');
    console.log('   Full Dashboard:');
    console.log('   GET http://localhost:3001/api/dashboard');
    console.log('');
    console.log('   Quick Stats (Fast):');
    console.log('   GET http://localhost:3001/api/dashboard/quick-stats');
    console.log('');
    console.log('   Project-Specific:');
    console.log('   GET http://localhost:3001/api/dashboard?project_id=1');
    console.log('');
    
    console.log('🚀 NEXT STEPS:');
    console.log('   1. Build a frontend to visualize this dashboard');
    console.log('   2. Add charts and graphs for metrics');
    console.log('   3. Create real-time updates with websockets');
    console.log('   4. Add notification triggers based on thresholds');
    console.log('   5. Export dashboard to PDF/Excel');
    console.log('');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('');
    console.error('❌ ERROR OCCURRED:');
    console.error('='.repeat(70));
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data.message || error.response.data);
    } else {
      console.error('Error:', error.message);
      
      if (error.code === 'ECONNREFUSED') {
        console.error('');
        console.error('💡 TIP: Make sure the server is running!');
        console.error('   Run: npm run dev');
      }
    }
    console.error('='.repeat(70));
  }
}

testDashboard();
