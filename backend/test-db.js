require('dotenv').config();
const sequelize = require('./src/config/database');

async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ SUCCESS! Database connected');
    console.log('Database:', process.env.DB_NAME);
    console.log('Host:', process.env.DB_HOST);
    
    // Test a simple query
    const [results] = await sequelize.query('SELECT COUNT(*) as count FROM projects');
    console.log('Projects in database:', results[0].count);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ FAILED! Could not connect to database');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testConnection();