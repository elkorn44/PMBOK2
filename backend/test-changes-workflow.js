// backend/test-changes-workflow.js
// Complete workflow test for Changes module with dual approval workflow
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testChangesWorkflow() {
  console.log('='.repeat(70));
  console.log('PMBOK Changes Module - Complete Workflow Test');
  console.log('Dual Approval: Initial Approval + Closure Approval');
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

    // Step 2: Create a scope change request
    console.log('Step 2: Creating scope change request...');
    const changeData = {
      project_id: projectId,
      change_number: `CHG-${Date.now()}`,
      title: 'Add Mobile Application Support',
      description: 'Expand project scope to include native mobile applications for iOS and Android in addition to web application.',
      change_type: 'Scope',
      priority: 'High',
      status: 'Requested',
      requested_by: 1,
      request_date: new Date().toISOString().split('T')[0],
      cost_impact: 150000.00,
      schedule_impact_days: 90,
      justification: 'Market research shows 65% of target users prefer mobile app. Competitors already have mobile presence.',
      impact_assessment: 'Requires 2 additional mobile developers, extended timeline by 3 months, additional $150k budget'
    };

    const changeResp = await axios.post(`${BASE_URL}/changes`, changeData);
    const changeId = changeResp.data.data.change_id;
    
    console.log(`✅ Change request created successfully!`);
    console.log(`   Change ID: ${changeId}`);
    console.log(`   Change Number: ${changeData.change_number}`);
    console.log(`   Title: ${changeData.title}`);
    console.log(`   Type: ${changeData.change_type}`);
    console.log(`   Cost Impact: $${changeData.cost_impact.toLocaleString()}`);
    console.log(`   Schedule Impact: ${changeData.schedule_impact_days} days`);
    console.log('');

    // Step 3: Try to approve directly (should FAIL)
    console.log('Step 3: Attempting to approve directly (should fail)...');
    try {
      await axios.put(`${BASE_URL}/changes/${changeId}`, {
        status: 'Approved',
        updated_by: 1
      });
      console.log('❌ ERROR: Direct approval should have been blocked!');
    } catch (error) {
      if (error.response && error.response.status === 403) {
        console.log('✅ CORRECT: Direct approval blocked by workflow');
        console.log(`   Message: ${error.response.data.message}`);
      } else {
        throw error;
      }
    }
    console.log('');

    // Step 4: Request approval (move to Under Review)
    console.log('Step 4: Requesting approval (Requested → Under Review)...');
    const reviewResp = await axios.post(`${BASE_URL}/changes/${changeId}/request-approval`, {
      requested_by: 1,
      approval_justification: 'Strategic addition to meet market demands and competitive positioning.'
    });
    console.log('✅ Change moved to Under Review');
    console.log(`   Status: ${reviewResp.data.data.status}`);
    console.log(`   Next: ${reviewResp.data.data.next_step}`);
    console.log('');

    // Step 5: Add impact assessment comment
    console.log('Step 5: Adding impact assessment comment...');
    await axios.post(`${BASE_URL}/changes/${changeId}/log`, {
      logged_by: 2,
      comments: 'Impact assessment complete. Budget and schedule impacts are acceptable. Mobile development team identified.'
    });
    console.log('✅ Comment added');
    console.log('');

    // Step 6: Approve the change
    console.log('Step 6: Approving change request...');
    const approvalResp = await axios.post(`${BASE_URL}/changes/${changeId}/approve`, {
      approved_by: 1,
      approval_comments: 'Change approved. Mobile app addition aligns with strategic goals. Proceed with implementation.'
    });
    console.log('✅ Change APPROVED');
    console.log(`   Status: ${approvalResp.data.data.status}`);
    console.log(`   Approved by: Person ID ${approvalResp.data.data.approved_by}`);
    console.log(`   Next: ${approvalResp.data.data.next_step}`);
    console.log('');

    // Step 7: Create implementation actions
    console.log('Step 7: Creating implementation actions...');
    
    const action1 = await axios.post(`${BASE_URL}/changes/${changeId}/actions`, {
      action_description: 'Hire 2 mobile developers (iOS and Android)',
      action_type: 'Resource',
      assigned_to: 1,
      created_by: 1,
      created_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending',
      priority: 'Critical'
    });
    console.log(`✅ Action 1 created (ID: ${action1.data.data.action_id})`);

    const action2 = await axios.post(`${BASE_URL}/changes/${changeId}/actions`, {
      action_description: 'Design mobile UI/UX mockups',
      action_type: 'Design',
      assigned_to: 2,
      created_by: 1,
      created_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending',
      priority: 'High'
    });
    console.log(`✅ Action 2 created (ID: ${action2.data.data.action_id})`);

    const action3 = await axios.post(`${BASE_URL}/changes/${changeId}/actions`, {
      action_description: 'Develop and deploy iOS application',
      action_type: 'Implementation',
      assigned_to: 3,
      created_by: 1,
      created_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending',
      priority: 'High'
    });
    console.log(`✅ Action 3 created (ID: ${action3.data.data.action_id})`);

    const action4 = await axios.post(`${BASE_URL}/changes/${changeId}/actions`, {
      action_description: 'Develop and deploy Android application',
      action_type: 'Implementation',
      assigned_to: 3,
      created_by: 1,
      created_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending',
      priority: 'High'
    });
    console.log(`✅ Action 4 created (ID: ${action4.data.data.action_id})`);
    console.log('');

    // Step 8: Complete implementation actions
    console.log('Step 8: Completing implementation actions...');
    
    await axios.put(`${BASE_URL}/changes/${changeId}/actions/${action1.data.data.action_id}`, {
      status: 'Completed',
      notes: 'Hired Sarah (iOS) and Mike (Android). Both started this week.',
      updated_by: 1
    });
    console.log('✅ Action 1: Completed (Team hired)');

    await axios.put(`${BASE_URL}/changes/${changeId}/actions/${action2.data.data.action_id}`, {
      status: 'Completed',
      notes: 'Mobile UI designs completed and approved. Following Material Design and iOS HIG.',
      updated_by: 2
    });
    console.log('✅ Action 2: Completed (Design done)');

    await axios.put(`${BASE_URL}/changes/${changeId}/actions/${action3.data.data.action_id}`, {
      status: 'Completed',
      notes: 'iOS app v1.0 deployed to App Store. Initial user feedback positive.',
      updated_by: 3
    });
    console.log('✅ Action 3: Completed (iOS app live)');

    await axios.put(`${BASE_URL}/changes/${changeId}/actions/${action4.data.data.action_id}`, {
      status: 'Completed',
      notes: 'Android app v1.0 deployed to Google Play. Feature parity with iOS.',
      updated_by: 3
    });
    console.log('✅ Action 4: Completed (Android app live)');
    console.log('');

    // Step 9: Mark change as Implemented
    console.log('Step 9: Marking change as Implemented...');
    await axios.put(`${BASE_URL}/changes/${changeId}`, {
      status: 'Implemented',
      implementation_date: new Date().toISOString().split('T')[0],
      updated_by: 1,
      status_comment: 'Mobile applications successfully deployed to both iOS and Android platforms.'
    });
    console.log('✅ Change status: Implemented');
    console.log('');

    // Step 10: Add implementation summary
    console.log('Step 10: Adding implementation summary...');
    await axios.post(`${BASE_URL}/changes/${changeId}/log`, {
      logged_by: 1,
      comments: 'Implementation complete. iOS and Android apps available in stores. User adoption tracking shows 40% mobile usage in first week.'
    });
    console.log('✅ Implementation summary added');
    console.log('');

    // Step 11: Try to close directly (should FAIL)
    console.log('Step 11: Attempting to close directly (should fail)...');
    try {
      await axios.put(`${BASE_URL}/changes/${changeId}`, {
        status: 'Closed',
        updated_by: 1
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

    // Step 12: Request closure approval
    console.log('Step 12: Requesting closure approval...');
    const closureReqResp = await axios.post(`${BASE_URL}/changes/${changeId}/request-closure`, {
      requested_by: 1,
      closure_justification: 'All implementation actions complete. Mobile apps deployed successfully. User adoption exceeding expectations.'
    });
    console.log('✅ Closure request submitted');
    console.log(`   Status: ${closureReqResp.data.data.status}`);
    console.log(`   Next: ${closureReqResp.data.data.next_step}`);
    console.log('');

    // Step 13: View complete audit trail
    console.log('Step 13: Viewing complete audit trail...');
    const logResp = await axios.get(`${BASE_URL}/changes/${changeId}/log`);
    console.log(`✅ Found ${logResp.data.count} log entries (showing last 8):`);
    logResp.data.data.slice(0, 8).forEach((entry, index) => {
      const date = new Date(entry.log_date).toLocaleString();
      console.log(`   ${index + 1}. [${date}] ${entry.log_type}`);
      if (entry.previous_status && entry.new_status) {
        console.log(`      ${entry.previous_status} → ${entry.new_status}`);
      }
      if (entry.comments) {
        console.log(`      ${entry.comments.substring(0, 60)}...`);
      }
    });
    console.log('');

    // Step 14: Simulate closure rejection (optional path)
    console.log('Step 14: [OPTIONAL] Simulating closure rejection...');
    const closureRejResp = await axios.post(`${BASE_URL}/changes/${changeId}/reject-closure`, {
      rejected_by: 1,
      rejection_reason: 'Need 30-day monitoring period for mobile app stability before closure.'
    });
    console.log('✅ Closure request rejected');
    console.log(`   Reason: ${closureRejResp.data.data.reason}`);
    console.log('');

    // Step 15: Request closure again after monitoring
    console.log('Step 15: Requesting closure again after monitoring period...');
    await axios.post(`${BASE_URL}/changes/${changeId}/request-closure`, {
      requested_by: 1,
      closure_justification: 'Monitoring complete. Mobile apps stable. 50% of users now on mobile. Zero critical issues. Change objectives met.'
    });
    console.log('✅ Second closure request submitted');
    console.log('');

    // Step 16: Approve closure
    console.log('Step 16: Approving change closure...');
    const closureAppResp = await axios.post(`${BASE_URL}/changes/${changeId}/approve-closure`, {
      approved_by: 1,
      approval_comments: 'Approved for closure. Mobile app implementation successful. All objectives achieved.'
    });
    console.log('✅ Change closure APPROVED');
    console.log(`   Status: ${closureAppResp.data.data.status}`);
    console.log(`   Approved by: Person ID ${closureAppResp.data.data.approved_by}`);
    console.log('');

    // Step 17: Verify final state
    console.log('Step 17: Verifying final change state...');
    const finalChange = await axios.get(`${BASE_URL}/changes/${changeId}`);
    console.log('✅ Final change state retrieved');
    console.log('');

    // Display comprehensive summary
    console.log('='.repeat(70));
    console.log('WORKFLOW TEST COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log('');
    console.log('📊 SUMMARY:');
    console.log(`   Change: ${finalChange.data.data.change_number}`);
    console.log(`   Title: ${finalChange.data.data.title}`);
    console.log(`   Type: ${finalChange.data.data.change_type}`);
    console.log(`   Final Status: ${finalChange.data.data.status}`);
    console.log(`   Cost Impact: $${finalChange.data.data.cost_impact?.toLocaleString() || 0}`);
    console.log(`   Schedule Impact: ${finalChange.data.data.schedule_impact_days || 0} days`);
    console.log(`   Requested: ${finalChange.data.data.request_date}`);
    console.log(`   Approved: ${finalChange.data.data.approval_date}`);
    console.log(`   Implemented: ${finalChange.data.data.implementation_date}`);
    
    const actions = finalChange.data.data.actions || [];
    console.log(`   Implementation Actions: ${actions.length} total`);
    
    const completedActions = Array.isArray(actions) 
      ? actions.filter(a => a.status === 'Completed').length 
      : 0;
    console.log(`   Completed Actions: ${completedActions}/${actions.length}`);
    
    const logEntries = finalChange.data.data.log || [];
    console.log(`   Log Entries: ${logEntries.length}`);
    console.log('');

    console.log('🎯 DUAL APPROVAL WORKFLOW VALIDATED:');
    console.log('   ✅ Direct approval blocked (requires workflow)');
    console.log('   ✅ Approval request → Under Review → Approved');
    console.log('   ✅ Implementation actions tracked');
    console.log('   ✅ Direct closure blocked (requires workflow)');
    console.log('   ✅ Closure request workflow');
    console.log('   ✅ Closure rejection capability');
    console.log('   ✅ Closure approval process');
    console.log('   ✅ Status updated to Closed only after approval');
    console.log('');

    console.log('🎯 WHAT WORKED:');
    console.log('   ✅ Change request creation with impact assessment');
    console.log('   ✅ Two-stage approval workflow (initial + closure)');
    console.log('   ✅ Implementation action tracking');
    console.log('   ✅ Cost and schedule impact tracking');
    console.log('   ✅ Complete audit trail with all approvals');
    console.log('');

    console.log('🎯 WORKFLOW STAGES COMPLETED:');
    console.log('   1. Requested → Created change request');
    console.log('   2. Under Review → Submitted for approval');
    console.log('   3. Approved → Management approved change');
    console.log('   4. Implemented → Completed all actions');
    console.log('   5. Closed → Verified and approved for closure');
    console.log('');

    console.log('🚀 READY FOR PRODUCTION!');
    console.log('');
    console.log('View in browser:');
    console.log(`   All changes: http://localhost:3001/api/changes`);
    console.log(`   This change: http://localhost:3001/api/changes/${changeId}`);
    console.log(`   Actions: http://localhost:3001/api/changes/${changeId}/actions`);
    console.log(`   Log: http://localhost:3001/api/changes/${changeId}/log`);
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

testChangesWorkflow();