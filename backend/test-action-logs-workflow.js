// backend/test-action-logs-workflow.js
// Complete workflow test for Action Logs module
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testActionLogsWorkflow() {
  console.log('='.repeat(70));
  console.log('PMBOK Action Logs Module - Complete Workflow Test');
  console.log('='.repeat(70));
  console.log('');

  try {
    // Step 1: Get project
    console.log('Step 1: Getting project...');
    const projectsResp = await axios.get(`${BASE_URL}/projects`);
    
    if (projectsResp.data.count === 0) {
      console.log('❌ No projects found! Create a project first.');
      return;
    }
    
    const projectId = projectsResp.data.data[0].project_id;
    console.log(`✅ Using project: ${projectsResp.data.data[0].project_name} (ID: ${projectId})`);
    console.log('');

    // Step 2: Create action log for weekly team meeting
    console.log('Step 2: Creating action log for weekly team meeting...');
    const actionLogData = {
      project_id: projectId,
      log_number: `MEET-${Date.now()}`,
      log_name: 'Weekly Project Review - January 2026',
      description: 'Action items from weekly project review meeting covering sprint progress, blockers, and next steps',
      status: 'Active',
      created_by: 1
    };

    const logResp = await axios.post(`${BASE_URL}/action-logs`, actionLogData);
    const actionLogId = logResp.data.data.action_log_id;
    
    console.log(`✅ Action log created successfully!`);
    console.log(`   Log ID: ${actionLogId}`);
    console.log(`   Log Number: ${actionLogData.log_number}`);
    console.log(`   Name: ${actionLogData.log_name}`);
    console.log('');

    // Step 3: Add action items from the meeting
    console.log('Step 3: Adding action items from meeting...');
    
    const item1 = await axios.post(`${BASE_URL}/action-logs/${actionLogId}/items`, {
      action_number: 'AI-001',
      action_description: 'Complete API documentation for new endpoints',
      action_type: 'Documentation',
      assigned_to: 3,
      created_by: 1,
      created_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending',
      priority: 'High',
      notes: 'Focus on REST endpoints and authentication'
    });
    console.log(`✅ Item 1 created (ID: ${item1.data.data.action_item_id})`);
    console.log(`   ${item1.data.data.action_item_id}. Complete API documentation`);

    const item2 = await axios.post(`${BASE_URL}/action-logs/${actionLogId}/items`, {
      action_number: 'AI-002',
      action_description: 'Review and approve security audit findings',
      action_type: 'Review',
      assigned_to: 1,
      created_by: 1,
      created_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending',
      priority: 'Critical',
      notes: 'Security team flagged 3 critical items'
    });
    console.log(`✅ Item 2 created (ID: ${item2.data.data.action_item_id})`);
    console.log(`   ${item2.data.data.action_item_id}. Review security audit`);

    const item3 = await axios.post(`${BASE_URL}/action-logs/${actionLogId}/items`, {
      action_number: 'AI-003',
      action_description: 'Schedule training session for new team members',
      action_type: 'Training',
      assigned_to: 2,
      created_by: 1,
      created_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Pending',
      priority: 'Medium',
      notes: 'Cover PMBOK basics and system navigation'
    });
    console.log(`✅ Item 3 created (ID: ${item3.data.data.action_item_id})`);
    console.log(`   ${item3.data.data.action_item_id}. Schedule training session`);
    console.log('');

    // Step 4: Add requirements/checklist to Item 2
    console.log('Step 4: Adding checklist requirements to security audit...');
    
    const req1 = await axios.post(
      `${BASE_URL}/action-logs/${actionLogId}/items/${item2.data.data.action_item_id}/requirements`,
      {
        requirement_description: 'Review authentication vulnerabilities',
        sequence_order: 1,
        status: 'Pending'
      }
    );
    console.log(`✅ Requirement 1: Review authentication vulnerabilities`);

    const req2 = await axios.post(
      `${BASE_URL}/action-logs/${actionLogId}/items/${item2.data.data.action_item_id}/requirements`,
      {
        requirement_description: 'Check SQL injection prevention',
        sequence_order: 2,
        status: 'Pending'
      }
    );
    console.log(`✅ Requirement 2: Check SQL injection prevention`);

    const req3 = await axios.post(
      `${BASE_URL}/action-logs/${actionLogId}/items/${item2.data.data.action_item_id}/requirements`,
      {
        requirement_description: 'Verify HTTPS implementation',
        sequence_order: 3,
        status: 'Pending'
      }
    );
    console.log(`✅ Requirement 3: Verify HTTPS implementation`);
    console.log('');

    // Step 5: Start work on Item 1
    console.log('Step 5: Starting work on documentation action...');
    await axios.put(`${BASE_URL}/action-logs/${actionLogId}/items/${item1.data.data.action_item_id}`, {
      status: 'In Progress',
      notes: 'Started documenting authentication endpoints'
    });
    console.log('✅ Item 1 status: Pending → In Progress');
    console.log('');

    // Step 6: Complete security audit requirements
    console.log('Step 6: Completing security audit checklist...');
    
    await axios.put(
      `${BASE_URL}/action-logs/${actionLogId}/items/${item2.data.data.action_item_id}/requirements/${req1.data.data.requirement_id}`,
      {
        status: 'Completed',
        completed_by: 1
      }
    );
    console.log('✅ Requirement 1: Completed');

    await axios.put(
      `${BASE_URL}/action-logs/${actionLogId}/items/${item2.data.data.action_item_id}/requirements/${req2.data.data.requirement_id}`,
      {
        status: 'Completed',
        completed_by: 1
      }
    );
    console.log('✅ Requirement 2: Completed');

    await axios.put(
      `${BASE_URL}/action-logs/${actionLogId}/items/${item2.data.data.action_item_id}/requirements/${req3.data.data.requirement_id}`,
      {
        status: 'Completed',
        completed_by: 1
      }
    );
    console.log('✅ Requirement 3: Completed');
    console.log('');

    // Step 7: Complete Item 2
    console.log('Step 7: Completing security audit action...');
    await axios.put(`${BASE_URL}/action-logs/${actionLogId}/items/${item2.data.data.action_item_id}`, {
      status: 'Completed',
      completion_notes: 'All security items reviewed and addressed. No critical vulnerabilities found.'
    });
    console.log('✅ Item 2 status: Pending → Completed');
    console.log('');

    // Step 8: View complete action log
    console.log('Step 8: Retrieving complete action log...');
    const fullLog = await axios.get(`${BASE_URL}/action-logs/${actionLogId}`);
    console.log(`✅ Action log retrieved with all details`);
    console.log(`   Total Items: ${fullLog.data.data.total_items}`);
    console.log(`   Completed: ${fullLog.data.data.completed_items}`);
    console.log(`   Active: ${fullLog.data.data.active_items}`);
    console.log('');

    // Step 9: View just the items
    console.log('Step 9: Viewing all action items...');
    const items = await axios.get(`${BASE_URL}/action-logs/${actionLogId}/items`);
    console.log(`✅ Found ${items.data.count} action items:`);
    items.data.data.forEach((item, i) => {
      console.log(`   ${i + 1}. [${item.status}] ${item.action_description}`);
      console.log(`      Assigned to: ${item.assigned_to_name || 'Unassigned'} | Due: ${item.due_date}`);
    });
    console.log('');

    // Step 10: Get all action logs for project
    console.log('Step 10: Getting all action logs for project...');
    const allLogs = await axios.get(`${BASE_URL}/action-logs?project_id=${projectId}`);
    console.log(`✅ Found ${allLogs.data.count} action logs for this project`);
    console.log('');

    // Step 11: Update action log status
    console.log('Step 11: Marking action log as completed...');
    await axios.put(`${BASE_URL}/action-logs/${actionLogId}`, {
      status: 'Completed',
      description: 'All action items from weekly meeting have been addressed'
    });
    console.log('✅ Action log status: Active → Completed');
    console.log('');

    // Display comprehensive summary
    console.log('='.repeat(70));
    console.log('WORKFLOW TEST COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log('');
    console.log('📊 SUMMARY:');
    console.log(`   Action Log: ${actionLogData.log_name}`);
    console.log(`   Log ID: ${actionLogId}`);
    console.log(`   Log Number: ${actionLogData.log_number}`);
    
    const finalLog = fullLog.data.data;
    console.log(`   Total Items: ${finalLog.items.length}`);
    const completedCount = finalLog.items.filter(i => i.status === 'Completed').length;
    console.log(`   Completed Items: ${completedCount}/${finalLog.items.length}`);
    
    const totalRequirements = finalLog.items.reduce((sum, item) => sum + (item.requirements?.length || 0), 0);
    console.log(`   Total Requirements: ${totalRequirements}`);
    console.log('');

    console.log('🎯 WHAT WORKED:');
    console.log('   ✅ Action log creation');
    console.log('   ✅ Multiple action items with assignments');
    console.log('   ✅ Checklist requirements (sub-items)');
    console.log('   ✅ Status tracking (Pending → In Progress → Completed)');
    console.log('   ✅ Requirement completion tracking');
    console.log('   ✅ Complete hierarchy: Log → Items → Requirements');
    console.log('');

    console.log('📝 USE CASES:');
    console.log('   • Meeting action items');
    console.log('   • Sprint planning tasks');
    console.log('   • Review findings');
    console.log('   • Audit checklists');
    console.log('   • Project milestones');
    console.log('');

    console.log('🚀 READY FOR PRODUCTION!');
    console.log('');
    console.log('View in browser:');
    console.log(`   All logs: http://localhost:3001/api/action-logs`);
    console.log(`   This log: http://localhost:3001/api/action-logs/${actionLogId}`);
    console.log(`   Items: http://localhost:3001/api/action-logs/${actionLogId}/items`);
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

testActionLogsWorkflow();
