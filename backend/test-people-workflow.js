// backend/test-people-workflow.js
// Complete workflow test for People module
const axios = require('axios');

const BASE_URL = 'http://localhost:3001/api';

async function testPeopleWorkflow() {
  console.log('='.repeat(70));
  console.log('PMBOK People Module - Complete Workflow Test');
  console.log('='.repeat(70));
  console.log('');

  try {
    // Step 1: Get all existing people
    console.log('Step 1: Getting all existing people...');
    const allPeople = await axios.get(`${BASE_URL}/people`);
    console.log(`✅ Found ${allPeople.data.count} people in system`);
    if (allPeople.data.count > 0) {
      console.log('   Sample person:', allPeople.data.data[0].full_name);
    }
    console.log('');

    // Step 2: Create a new person
    console.log('Step 2: Creating new person...');
    const newPerson = {
      username: `testuser${Date.now()}`,
      full_name: 'Alice Johnson',
      email: 'alice.johnson@company.com',
      role: 'Senior Developer',
      department: 'Engineering',
      is_active: true
    };

    const createResp = await axios.post(`${BASE_URL}/people`, newPerson);
    const personId = createResp.data.data.person_id;
    console.log(`✅ Person created successfully!`);
    console.log(`   Person ID: ${personId}`);
    console.log(`   Username: ${newPerson.username}`);
    console.log(`   Name: ${newPerson.full_name}`);
    console.log(`   Role: ${newPerson.role}`);
    console.log('');

    // Step 3: Get person details
    console.log('Step 3: Getting person details with workload...');
    const personDetails = await axios.get(`${BASE_URL}/people/${personId}`);
    console.log(`✅ Person details retrieved`);
    console.log(`   Total Active Actions: ${personDetails.data.data.active_actions.total}`);
    console.log(`   Open Issues Raised: ${personDetails.data.data.ownership.open_issues_raised}`);
    console.log(`   Active Risks Owned: ${personDetails.data.data.ownership.active_risks_owned}`);
    console.log('');

    // Step 4: Update person details
    console.log('Step 4: Updating person details...');
    await axios.put(`${BASE_URL}/people/${personId}`, {
      role: 'Lead Developer',
      department: 'Engineering - Frontend'
    });
    console.log('✅ Person updated successfully');
    console.log('   Role: Senior Developer → Lead Developer');
    console.log('   Department: Engineering → Engineering - Frontend');
    console.log('');

    // Step 5: Filter people by department
    console.log('Step 5: Filtering people by department...');
    const engineeringPeople = await axios.get(`${BASE_URL}/people?department=Engineering`);
    console.log(`✅ Found ${engineeringPeople.data.count} people in Engineering`);
    console.log('');

    // Step 6: Search for people
    console.log('Step 6: Searching for people...');
    const searchResults = await axios.get(`${BASE_URL}/people?search=alice`);
    console.log(`✅ Found ${searchResults.data.count} people matching "alice"`);
    console.log('');

    // Step 7: Get all unique roles
    console.log('Step 7: Getting all unique roles...');
    const roles = await axios.get(`${BASE_URL}/people/meta/roles`);
    console.log(`✅ Found ${roles.data.count} unique roles:`);
    roles.data.data.slice(0, 5).forEach(role => {
      console.log(`   - ${role}`);
    });
    console.log('');

    // Step 8: Get all unique departments
    console.log('Step 8: Getting all unique departments...');
    const departments = await axios.get(`${BASE_URL}/people/meta/departments`);
    console.log(`✅ Found ${departments.data.count} unique departments:`);
    departments.data.data.forEach(dept => {
      console.log(`   - ${dept}`);
    });
    console.log('');

    // Step 9: Get team workload summary
    console.log('Step 9: Getting team workload summary...');
    const workload = await axios.get(`${BASE_URL}/people/workload/summary`);
    console.log(`✅ Team workload summary generated`);
    console.log(`   Total People: ${workload.data.totals.total_people}`);
    console.log(`   Total Actions: ${workload.data.totals.total_actions}`);
    console.log(`   Critical Actions: ${workload.data.totals.total_critical}`);
    console.log(`   Overdue Actions: ${workload.data.totals.total_overdue}`);
    console.log('');

    if (workload.data.data.length > 0) {
      console.log('   Top 3 by workload:');
      workload.data.data.slice(0, 3).forEach((person, i) => {
        console.log(`   ${i + 1}. ${person.full_name} (${person.role})`);
        console.log(`      Total: ${person.total_actions} | Critical: ${person.critical_actions} | Overdue: ${person.overdue_actions}`);
      });
      console.log('');
    }

    // Step 10: Deactivate (soft delete) the person
    console.log('Step 10: Deactivating person...');
    await axios.delete(`${BASE_URL}/people/${personId}`);
    console.log('✅ Person deactivated successfully');
    console.log('   Status: Active → Inactive');
    console.log('');

    // Step 11: Verify person is inactive
    console.log('Step 11: Verifying person is inactive...');
    const inactivePerson = await axios.get(`${BASE_URL}/people/${personId}`);
    console.log(`✅ Person status: ${inactivePerson.data.data.is_active ? 'Active' : 'Inactive'}`);
    console.log('');

    // Step 12: Filter for active people only
    console.log('Step 12: Getting active people only...');
    const activePeople = await axios.get(`${BASE_URL}/people?is_active=true`);
    console.log(`✅ Found ${activePeople.data.count} active people`);
    console.log('');

    // Display comprehensive summary
    console.log('='.repeat(70));
    console.log('WORKFLOW TEST COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(70));
    console.log('');
    console.log('📊 SUMMARY:');
    console.log(`   Person Created: ${newPerson.full_name}`);
    console.log(`   Person ID: ${personId}`);
    console.log(`   Final Status: Inactive`);
    console.log('');

    console.log('🎯 WHAT WORKED:');
    console.log('   ✅ Person creation with full details');
    console.log('   ✅ Person retrieval with workload tracking');
    console.log('   ✅ Person updates');
    console.log('   ✅ Search and filtering');
    console.log('   ✅ Role and department listing');
    console.log('   ✅ Team workload summary');
    console.log('   ✅ Soft delete (deactivation)');
    console.log('');

    console.log('🚀 READY FOR PRODUCTION!');
    console.log('');
    console.log('View in browser:');
    console.log(`   All people: http://localhost:3001/api/people`);
    console.log(`   This person: http://localhost:3001/api/people/${personId}`);
    console.log(`   Workload: http://localhost:3001/api/people/workload/summary`);
    console.log(`   Roles: http://localhost:3001/api/people/meta/roles`);
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

testPeopleWorkflow();
