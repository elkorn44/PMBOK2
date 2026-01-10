// backend/src/routes/dashboard.js
const express = require('express');
const router = express.Router();
const {
  getDashboard,
  getQuickStats
} = require('../controllers/dashboardController');

// =====================================================
// DASHBOARD ROUTES
// =====================================================

// @route   GET /api/dashboard
// @desc    Get comprehensive dashboard overview
// @query   ?project_id=1 (optional - filter by project)
// @return  Complete dashboard with all modules aggregated
router.get('/', getDashboard);

// @route   GET /api/dashboard/quick-stats
// @desc    Get quick statistics (lightweight for frequent polling)
// @query   ?project_id=1 (optional - filter by project)
// @return  Count-only statistics (fast response)
router.get('/quick-stats', getQuickStats);

module.exports = router;
