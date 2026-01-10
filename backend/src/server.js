// backend/src/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// =====================================================
// MIDDLEWARE
// =====================================================

// Security
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Request logging (development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// =====================================================
// DATABASE CONNECTION
// =====================================================

const db = require('./config/database');

// =====================================================
// ROUTES
// =====================================================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: 'Connected',
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api/projects', require('./routes/projects'));
app.use('/api/issues', require('./routes/issues'));
app.use('/api/risks', require('./routes/risks'));
app.use('/api/changes', require('./routes/changes'));
app.use('/api/escalations', require('./routes/escalations'));
app.use('/api/faults', require('./routes/faults'));
app.use('/api/action-logs', require('./routes/action-logs'));
app.use('/api/people', require('./routes/people'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/dashboard', require('./routes/dashboard'));

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'PMBOK Project Management API',
    version: '1.0.0',
    endpoints: {
      projects: '/api/projects',
      issues: '/api/issues',
      risks: '/api/risks',
      changes: '/api/changes',
      escalations: '/api/escalations',
      faults: '/api/faults',
      actionLogs: '/api/action-logs',
      people: '/api/people',
      dashboard: '/api/dashboard'
    }
  });
});

// =====================================================
// ERROR HANDLING
// =====================================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// =====================================================
// START SERVER
// =====================================================

app.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 PMBOK Project Management API Server');
  console.log('='.repeat(60));
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`📊 Database: ${process.env.DB_NAME}`);
  console.log('='.repeat(60));
  console.log('Available endpoints:');
  console.log(`  GET  http://localhost:${PORT}/health`);
  console.log(`  GET  http://localhost:${PORT}/api`);
  console.log(`  GET  http://localhost:${PORT}/api/projects`);
  console.log('='.repeat(60));
});

module.exports = app;