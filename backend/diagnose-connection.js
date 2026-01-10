// backend/diagnose-connection.js
// Run this to diagnose database connection issues
// Usage: node diagnose-connection.js

require('dotenv').config();
const net = require('net');

console.log('='.repeat(70));
console.log('DATABASE CONNECTION DIAGNOSTICS');
console.log('='.repeat(70));
console.log('');

// Step 1: Check .env file is loaded
console.log('Step 1: Checking Environment Variables');
console.log('-'.repeat(70));

const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
let envOk = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (!value || value.includes('xxx') || value.includes('your_')) {
    console.log(`❌ ${varName}: NOT SET or using default placeholder`);
    envOk = false;
  } else {
    // Mask password
    const displayValue = varName === 'DB_PASSWORD' ? '********' : value;
    console.log(`✅ ${varName}: ${displayValue}`);
  }
});

console.log('');

if (!envOk) {
  console.log('⚠️  ACTION REQUIRED:');
  console.log('   1. Open backend\\.env in Phoenix');
  console.log('   2. Replace placeholder values with your actual QNAP details');
  console.log('   3. Save the file');
  console.log('   4. Run this script again');
  console.log('');
  process.exit(1);
}

// Step 2: Test network connectivity to QNAP
console.log('Step 2: Testing Network Connection to QNAP');
console.log('-'.repeat(70));

const host = process.env.DB_HOST;
const port = parseInt(process.env.DB_PORT) || 3306;

console.log(`Testing connection to ${host}:${port}...`);

const socket = net.createConnection({ host, port, timeout: 5000 });

socket.on('connect', async () => {
  console.log(`✅ Network connection successful! QNAP is reachable on port ${port}`);
  socket.destroy();
  
  console.log('');
  
  // Step 3: Test MariaDB/MySQL connection
  console.log('Step 3: Testing MariaDB Database Connection');
  console.log('-'.repeat(70));
  
  try {
    const { Sequelize } = require('sequelize');
    
    const sequelize = new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mariadb',
        logging: false,
        dialectOptions: {
          connectTimeout: 10000
        }
      }
    );
    
    await sequelize.authenticate();
    console.log('✅ MariaDB authentication successful!');
    console.log(`✅ Connected to database: ${process.env.DB_NAME}`);
    
    console.log('');
    
    // Step 4: Test database structure
    console.log('Step 4: Verifying Database Tables');
    console.log('-'.repeat(70));
    
    const [tables] = await sequelize.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = '${process.env.DB_NAME}'
      ORDER BY TABLE_NAME
    `);
    
    if (tables.length === 0) {
      console.log('⚠️  No tables found in database');
      console.log('   Make sure you ran the SQL schema script on your QNAP');
    } else {
      console.log(`✅ Found ${tables.length} tables:`);
      tables.forEach(table => {
        console.log(`   - ${table.TABLE_NAME}`);
      });
    }
    
    console.log('');
    console.log('='.repeat(70));
    console.log('🎉 ALL CHECKS PASSED! Your database connection is working!');
    console.log('='.repeat(70));
    console.log('');
    console.log('You can now start your server with: npm run dev');
    console.log('');
    
    await sequelize.close();
    process.exit(0);
    
  } catch (error) {
    console.log('❌ MariaDB connection FAILED');
    console.log('');
    console.log('Error Details:');
    console.log('-'.repeat(70));
    console.log(error.message);
    console.log('');
    
    // Provide specific guidance based on error type
    if (error.message.includes('Access denied')) {
      console.log('🔍 DIAGNOSIS: Wrong username or password');
      console.log('');
      console.log('ACTION REQUIRED:');
      console.log('   1. Log into your QNAP');
      console.log('   2. Open MariaDB/MySQL management (phpMyAdmin or similar)');
      console.log('   3. Verify the username and password');
      console.log('   4. Update your .env file with correct credentials');
      console.log('');
      console.log('   Or create a new user:');
      console.log('   CREATE USER \'your_user\'@\'%\' IDENTIFIED BY \'your_password\';');
      console.log('   GRANT ALL PRIVILEGES ON pmbok_pm.* TO \'your_user\'@\'%\';');
      console.log('   FLUSH PRIVILEGES;');
    } else if (error.message.includes('Unknown database')) {
      console.log('🔍 DIAGNOSIS: Database does not exist');
      console.log('');
      console.log('ACTION REQUIRED:');
      console.log('   1. Log into your QNAP MariaDB');
      console.log('   2. Run the SQL schema script to create the database');
      console.log('   3. Or manually create it: CREATE DATABASE pmbok_pm;');
    } else if (error.message.includes('connect ETIMEDOUT') || error.message.includes('ECONNREFUSED')) {
      console.log('🔍 DIAGNOSIS: Cannot reach MariaDB service');
      console.log('');
      console.log('ACTION REQUIRED:');
      console.log('   1. Verify MariaDB is running on QNAP');
      console.log('   2. Check QNAP firewall allows port 3306');
      console.log('   3. Verify MariaDB allows remote connections');
    }
    
    console.log('');
    process.exit(1);
  }
});

socket.on('timeout', () => {
  console.log('❌ Connection timeout - Cannot reach QNAP');
  console.log('');
  console.log('🔍 DIAGNOSIS: Network connectivity issue');
  console.log('');
  console.log('ACTION REQUIRED:');
  console.log('   1. Verify QNAP IP address in .env is correct');
  console.log('   2. Ping your QNAP: ping ' + host);
  console.log('   3. Check if QNAP is powered on and connected to network');
  console.log('   4. Try accessing QNAP web interface from browser');
  console.log('');
  socket.destroy();
  process.exit(1);
});

socket.on('error', (err) => {
  console.log('❌ Network connection failed');
  console.log('');
  console.log('Error:', err.message);
  console.log('');
  
  if (err.code === 'ENOTFOUND') {
    console.log('🔍 DIAGNOSIS: Cannot resolve hostname');
    console.log('');
    console.log('ACTION REQUIRED:');
    console.log('   1. Check DB_HOST in .env file');
    console.log('   2. Use IP address instead of hostname (e.g., 192.168.1.100)');
    console.log('   3. Verify QNAP is on the same network');
  } else if (err.code === 'ECONNREFUSED') {
    console.log('🔍 DIAGNOSIS: QNAP is reachable but port 3306 is closed');
    console.log('');
    console.log('ACTION REQUIRED:');
    console.log('   1. Check if MariaDB/MySQL service is running on QNAP');
    console.log('   2. Verify MariaDB is configured to listen on port 3306');
    console.log('   3. Check QNAP firewall settings');
  }
  
  console.log('');
  process.exit(1);
});

console.log('');