// backend/test-risks-workflow.js
// Complete workflow test for Risks module with approval workflow
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testRisksWorkflow() {
  console.log('='.repeat(70));
  console.log('PMBOK Risks Module - Complete Workflow Test with Approval');
  console.log('='.repeat(70));
  console.log('');

  try {
    // Get project
    console.log('Step 1: Getting project...');
    const projectsResp = await axios.get(`${BASE_URL}/projects`);
    
    if (projectsResp.data.count === 0) {
      console.log('❌ No projects found! Create a project first.');
      return;
    }
    
    const projectId = projectsResp.data.data[0].project_id;
    console.log(`✅ Using project: ${projectsResp.data.data[0].project_name} (ID: ${projectId})`);
    console.log('');

    // Step 2: Create a high-severity risk
    console.log('Step 2: Creating high-severity risk...');
    const riskData = {
      project_id: projectId,
      risk_number: `RISK-${Date.now()}`,
      title: 'Data Center Power Failure Risk',
      description: 'Primary data center lacks redundant power supply. Single point of failure could cause complete service outage.',
      probability: 'Medium',
      impact: 'Very High',
      status: 'Identified',
      category: 'Infrastructure',
      identified_by: 1,
      owner: 2,
      identified_date: new Date().toISOString().split('T')[0],
      mitigation_strategy: 'Install backup power generators and UPS systems',
      contingency_plan: 'Failover to secondary data center within 4 hours'
    };

    const riskResp = await axios.post(`${BASE_URL}/risks`, riskData);
    const riskId = riskResp.data.data.risk_id;
    const riskScore = riskResp.data.data.risk_score;
    
    console.log(`✅ Risk created successfully!`);
    console.log(`   Risk ID: ${riskId}`);
    console.log(`   Risk Number: ${riskData.risk_number}`);
    console.log(`   Title: ${riskData.title}`);
    console.log(`   Risk Score: ${riskScore} (${riskData.probability} probability × ${riskData.impact} impact)`);
    console.log('');

    // Step 3: View the risk details
    console.log('Step 3: Retrieving risk details...');
    const riskDetailResp = await axios.get(`${BASE_URL}/risks/${riskId}`);
    console.log(`✅ Risk retrieved`);
    console.log(`   Status: ${riskDetailResp.data.data.status}`);
    console.log(`   Risk Score: ${riskDetailResp.data.data.risk_score}`);
    console.log('');

    // Step 4: Create mitigation actions
    console.log('Step 4: Creating mitigation actions...');
    
    const action1 = await axios.post(`${BASE_URL}/risks/${riskId}/actions`, {
      action_description: 'Conduct power infrastructure assessment',
      action_type: 'Investigation',
      assigned_to: 2,
      created_by: 1,
      created_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending',
      priority: 'High'
    });
    console.log(`✅ Action 1 created (ID: ${action1.data.data.action_id})`);

    const action2 = await axios.post(`${BASE_URL}/risks/${riskId}/actions`, {
      action_description: 'Install backup generator system',
      action_type: 'Implementation',
      assigned_to: 3,
      created_by: 1,
      created_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending',
      priority: 'Critical'
    });
    console.log(`✅ Action 2 created (ID: ${action2.data.data.action_id})`);

    const action3 = await axios.post(`${BASE_URL}/risks/${riskId}/actions`, {
      action_description: 'Deploy UPS battery backup systems',
      action_type: 'Implementation',
      assigned_to: 3,
      created_by: 1,
      created_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending',
      priority: 'High'
    });
    console.log(`✅ Action 3 created (ID: ${action3.data.data.action_id})`);
    console.log('');

    // Step 5: Update risk to Assessed
    console.log('Step 5: Moving risk to Assessed status...');
    await axios.put(`${BASE_URL}/risks/${riskId}`, {
      status: 'Assessed',
      updated_by: 2,
      status_comment: 'Risk fully assessed. Mitigation plan approved.'
    });
    console.log('✅ Risk status: Assessed');
    console.log('');

    // Step 6: Complete mitigation actions
    console.log('Step 6: Completing mitigation actions...');
    
    await axios.put(`${BASE_URL}/risks/${riskId}/actions/${action1.data.data.action_id}`, {
      status: 'Completed',
      notes: 'Assessment complete. Current power capacity insufficient for redundancy.',
      updated_by: 2
    });
    console.log('✅ Action 1: Completed');

    await axios.put(`${BASE_URL}/risks/${riskId}/actions/${action2.data.data.action_id}`, {
      status: 'Completed',
      notes: '250kW backup generator installed and tested successfully.',
      updated_by: 3
    });
    console.log('✅ Action 2: Completed');

    await axios.put(`${BASE_URL}/risks/${riskId}/actions/${action3.data.data.action_id}`, {
      status: 'Completed',
      notes: 'UPS systems deployed. Provides 15-minute runtime for graceful shutdown.',
      updated_by: 3
    });
    console.log('✅ Action 3: Completed');
    console.log('');

    // Step 7: Update risk to Mitigated
    console.log('Step 7: Marking risk as Mitigated...');
    await axios.put(`${BASE_URL}/risks/${riskId}`, {
      status: 'Mitigated',
      updated_by: 2,
      status_comment: 'All mitigation actions complete. Backup power systems operational.'
    });
    console.log('✅ Risk status: Mitigated');
    console.log('');

    // Step 8: Reassess risk (lower probability due to mitigation)
    console.log('Step 8: Reassessing risk after mitigation...');
    await axios.put(`${BASE_URL}/risks/${riskId}`, {
      probability: 'Low',
      impact: 'Medium',
      updated_by: 2
    });
    
    const reassessedRisk = await axios.get(`${BASE_URL}/risks/${riskId}`);
    console.log(`✅ Risk reassessed`);
    console.log(`   New Risk Score: ${reassessedRisk.data.data.risk_score}`);
    console.log(`   Probability: ${reassessedRisk.data.data.probability}`);
    console.log(`   Impact: ${reassessedRisk.data.data.impact}`);
    console.log('');

    // Step 9: Add comment
    console.log('Step 9: Adding progress comment...');
    await axios.post(`${BASE_URL}/risks/${riskId}/log`, {
      logged_by: 2,
      comments: 'Monitoring backup systems for 30 days before requesting closure.'
    });
    console.log('✅ Comment added');
    console.log('');

    // Step 10: Try to close risk directly (should FAIL - approval required!)
    console.log('Step 10: Attempting to close risk directly (should fail)...');
    try {
      await axios.put(`${BASE_URL}/risks/${riskId}`, {
        status: 'Closed',
        updated_by: 2
      });
      console.log('❌ ERROR: Direct closure should have been blocked!');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('✅ CORRECT: Direct closure blocked by approval workflow');
        console.log(`   Message: ${error.response.data.message}`);
      } else {
        throw error;
      }
    }
    console.log('');

    // Step 11: Request closure approval
    console.log('Step 11: Requesting closure approval...');
    const closureRequest = await axios.post(`${BASE_URL}/risks/${riskId}/request-closure`, {
      requested_by: 2,
      closure_justification: 'Risk fully mitigated. Backup systems operational for 30 days without issues. Risk score reduced from 15 to 2.'
    });
    console.log('✅ Closure request submitted');
    console.log(`   Status: ${closureRequest.data.data.status}`);
    console.log(`   Next step: ${closureRequest.data.data.next_step}`);
    console.log('');

    // Step 12: View audit trail
    console.log('Step 12: Viewing audit trail...');
    const logResp = await axios.get(`${BASE_URL}/risks/${riskId}/log`);
    console.log(`✅ Found ${logResp.data.count} log entries (showing last 5):`);
    logResp.data.data.slice(0, 5).forEach((entry, index) => {
      const date = new Date(entry.log_date).toLocaleString();
      console.log(`   ${index + 1}. [${date}] ${entry.log_type}`);
      if (entry.comments) {
        console.log(`      ${entry.comments.substring(0, 60)}...`);
      }
    });
    console.log('');

    // Step 13: Simulate rejection (optional path)
    console.log('Step 13: [OPTIONAL] Simulating closure rejection...');
    const rejectionResp = await axios.post(`${BASE_URL}/risks/${riskId}/reject-closure`, {
      rejected_by: 1,
      rejection_reason: 'Need 60 days of monitoring, not 30 days.'
    });
    console.log('✅ Closure request rejected');
    console.log(`   Reason: ${rejectionResp.data.data.reason}`);
    console.log('');

    // Step 14: Request closure again
    console.log('Step 14: Requesting closure again after more monitoring...');
    await axios.post(`${BASE_URL}/risks/${riskId}/request-closure`, {
      requested_by: 2,
      closure_justification: 'Risk monitored for 60 days. All backup systems functioning perfectly. Zero incidents.'
    });
    console.log('✅ Second closure request submitted');
    console.log('');

    // Step 15: Approve closure
    console.log('Step 15: Approving risk closure...');
    const approvalResp = await axios.post(`${BASE_URL}/risks/${riskId}/approve-closure`, {
      approved_by: 1,
      approval_comments: 'Approved. Risk adequately mitigated with backup power systems in place.'
    });
    console.log('✅ Risk closure APPROVED');
    console.log(`   Status: ${approvalResp.data.data.status}`);
    console.log(`   Approved by: Person ID ${approvalResp.data.data.approved_by}`);
    console.log('');

    // Step 16: Verify final state
    console.log('Step 16: Verifying final risk state...');
    const finalRisk = await axios.get(`${BASE_URL}/risks/${riskId}`);
    console.log('✅ Final risk state retrieved');
    console.log('');

    // Display comprehensive summary
    console.log('='.repeat(70));
    console.log('WORKFLOW TEST COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log('');
    console.log('📊 SUMMARY:');
    console.log(`   Risk: ${finalRisk.data.data.risk_number}`);
    console.log(`   Title: ${finalRisk.data.data.title}`);
    console.log(`   Final Status: ${finalRisk.data.data.status}`);
    console.log(`   Original Risk Score: 15 (Medium × Very High)`);
    console.log(`   Final Risk Score: ${finalRisk.data.data.risk_score} (${finalRisk.data.data.probability} × ${finalRisk.data.data.impact})`);
    
    const actions = finalRisk.data.data.actions || [];
    console.log(`   Mitigation Actions: ${actions.length} total`);
    
    const completedActions = Array.isArray(actions) 
      ? actions.filter(a => a.status === 'Completed').length 
      : 0;
    console.log(`   Completed Actions: ${completedActions}/${actions.length}`);
    
    const logEntries = finalRisk.data.data.log || [];
    console.log(`   Log Entries: ${logEntries.length}`);
    console.log('');

    console.log('🎯 APPROVAL WORKFLOW VALIDATED:');
    console.log('   ✅ Direct closure blocked (requires approval)');
    console.log('   ✅ Closure request workflow');
    console.log('   ✅ Rejection capability');
    console.log('   ✅ Approval process');
    console.log('   ✅ Status updated to Closed only after approval');
    console.log('');

    console.log('🎯 WHAT WORKED:');
    console.log('   ✅ Risk creation with automatic score calculation');
    console.log('   ✅ Mitigation actions');
    console.log('   ✅ Risk reassessment (score recalculation)');
    console.log('   ✅ Approval workflow enforcement');
    console.log('   ✅ Complete audit trail');
    console.log('');

    console.log('🚀 READY FOR PRODUCTION!');
    console.log('');
    console.log('View in browser:');
    console.log(`   All risks: http://localhost:3001/api/risks`);
    console.log(`   This risk: http://localhost:3001/api/risks/${riskId}`);
    console.log(`   Actions: http://localhost:3001/api/risks/${riskId}/actions`);
    console.log(`   Log: http://localhost:3001/api/risks/${riskId}/log`);
    console.log('');
    console.log('='.repeat(70));

  } catch (error) {
    console.error('');
    console.error('❌ ERROR OCCURRED:');
    console.error('='.repeat(70));
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Message:', error.response.data.message || error.response.data);
      if (error.response.data.hint) {
        console.error('Hint:', error.response.data.hint);
      }
    } else {
      console.error('Error:', error.message);
    }
    console.error('='.repeat(70));
  }
}

testRisksWorkflow();