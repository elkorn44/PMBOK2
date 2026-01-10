// backend/diagnose-issue-error.js
// Check what tables exist and why issue retrieval fails
require('dotenv').config();
const { sequelize } = require('./src/models');

async function diagnose() {
  try {
    console.log('Checking database tables...\n');
    
    // Check if issue_actions table exists
    const [tables] = await sequelize.query(`
      SHOW TABLES LIKE 'issue_actions'
    `);
    
    if (tables.length === 0) {
      console.log('❌ issue_actions table does NOT exist!');
      console.log('');
      console.log('This table is needed for the Issues module to work properly.');
      console.log('');
      console.log('SOLUTION: The table exists in your SQL schema but may not be created yet.');
      console.log('Check in phpMyAdmin if the issue_actions table exists.');
      console.log('');
    } else {
      console.log('✅ issue_actions table exists');
    }
    
    // Check if issue_log table exists
    const [logTables] = await sequelize.query(`
      SHOW TABLES LIKE 'issue_log'
    `);
    
    if (logTables.length === 0) {
      console.log('❌ issue_log table does NOT exist!');
      console.log('');
    } else {
      console.log('✅ issue_log table exists');
    }
    
    console.log('');
    
    // Check if the issue was created
    const [issues] = await sequelize.query(`
      SELECT * FROM issues WHERE issue_id = 1
    `);
    
    if (issues.length > 0) {
      console.log('✅ Issue #1 exists in database:');
      console.log(`   Issue Number: ${issues[0].issue_number}`);
      console.log(`   Title: ${issues[0].title}`);
      console.log(`   Status: ${issues[0].status}`);
      console.log('');
    }
    
    // Try the problematic query
    console.log('Testing the actions query...');
    try {
      const [actions] = await sequelize.query(`
        SELECT 
          ia.*,
          assignee.full_name as assigned_to_name,
          creator.full_name as created_by_name
        FROM issue_actions ia
        LEFT JOIN people assignee ON ia.assigned_to = assignee.person_id
        LEFT JOIN people creator ON ia.created_by = creator.person_id
        WHERE ia.issue_id = ?
        ORDER BY ia.created_date DESC
      `, {
        replacements: [1]
      });
      console.log(`✅ Actions query works (found ${actions.length} actions)`);
    } catch (error) {
      console.log('❌ Actions query failed:');
      console.log('   Error:', error.message);
      console.log('');
    }
    
    // Try the log query
    console.log('Testing the log query...');
    try {
      const [logEntries] = await sequelize.query(`
        SELECT 
          il.*,
          p.full_name as logged_by_name
        FROM issue_log il
        LEFT JOIN people p ON il.logged_by = p.person_id
        WHERE il.issue_id = ?
        ORDER BY il.log_date DESC
        LIMIT 20
      `, {
        replacements: [1]
      });
      console.log(`✅ Log query works (found ${logEntries.length} entries)`);
    } catch (error) {
      console.log('❌ Log query failed:');
      console.log('   Error:', error.message);
      console.log('');
    }
    
    await sequelize.close();
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

diagnose();