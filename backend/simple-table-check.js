// backend/simple-table-check.js
require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkTables() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Checking required tables...\n');
    
    // Check issue_actions
    const [actions] = await connection.query(
      "SHOW TABLES LIKE 'issue_actions'"
    );
    
    if (actions.length === 0) {
      console.log('❌ issue_actions table MISSING');
      console.log('   This table is required for the Issues module');
    } else {
      console.log('✅ issue_actions table exists');
    }
    
    // Check issue_log
    const [logs] = await connection.query(
      "SHOW TABLES LIKE 'issue_log'"
    );
    
    if (logs.length === 0) {
      console.log('❌ issue_log table MISSING');
      console.log('   This table is required for the Issues module');
    } else {
      console.log('✅ issue_log table exists');
    }
    
    console.log('');
    
    // Check the created issue
    const [issues] = await connection.query(
      'SELECT issue_id, issue_number, title, status FROM issues WHERE issue_id = 1'
    );
    
    if (issues.length > 0) {
      console.log('✅ Issue #1 found:');
      console.log(`   ${issues[0].issue_number}: ${issues[0].title}`);
      console.log(`   Status: ${issues[0].status}`);
      console.log('');
    } else {
      console.log('⚠️  Issue #1 not found');
      console.log('');
    }
    
    // Try to get actions for issue 1
    console.log('Checking for actions on issue #1...');
    const [issueActions] = await connection.query(
      'SELECT COUNT(*) as count FROM issue_actions WHERE issue_id = 1'
    );
    console.log(`   Found ${issueActions[0].count} actions`);
    
    // Try to get log entries for issue 1
    console.log('Checking for log entries on issue #1...');
    const [issueLogs] = await connection.query(
      'SELECT COUNT(*) as count FROM issue_log WHERE issue_id = 1'
    );
    console.log(`   Found ${issueLogs[0].count} log entries`);
    console.log('');
    
    console.log('='.repeat(60));
    console.log('DIAGNOSIS COMPLETE');
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    if (error.message.includes("doesn't exist")) {
      console.log('');
      console.log('SOLUTION: Tables are missing from your database.');
      console.log('Your schema file should have created these tables.');
      console.log('');
      console.log('Check in phpMyAdmin if these tables exist:');
      console.log('  - issue_actions');
      console.log('  - issue_log');
      console.log('  - risk_actions');
      console.log('  - risk_log');
      console.log('  (and similar for changes, escalations, faults)');
    }
  } finally {
    await connection.end();
  }
}

checkTables();