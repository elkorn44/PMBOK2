// backend/src/routes/reports.js
const express = require('express');
const router = express.Router();
const {
  getProjectHealthReport,
  getRiskHeatMap,
  getIssueAgingReport,
  getChangeImpactAnalysis,
  getActionItemsReport,
  getPendingApprovalsReport,
  getProjectSummaryReport,
  getTeamWorkloadReport,
  getExecutiveSummary,
  getTrendAnalysis
} = require('../controllers/reportsController');

// =====================================================
// EXECUTIVE REPORTS
// =====================================================

// @route   GET /api/reports/executive-summary
// @desc    High-level executive summary across all projects
router.get('/executive-summary', getExecutiveSummary);

// @route   GET /api/reports/project-summary/:projectId
// @desc    Comprehensive project summary report
router.get('/project-summary/:projectId', getProjectSummaryReport);

// =====================================================
// ANALYTICAL REPORTS
// =====================================================

// @route   GET /api/reports/risk-heat-map
// @desc    Risk heat map data (probability vs impact matrix)
router.get('/risk-heat-map', getRiskHeatMap);

// @route   GET /api/reports/issue-aging
// @desc    Issue aging analysis (how long issues have been open)
router.get('/issue-aging', getIssueAgingReport);

// @route   GET /api/reports/change-impact
// @desc    Change impact analysis (cost and schedule)
router.get('/change-impact', getChangeImpactAnalysis);

// @route   GET /api/reports/project-health/:projectId
// @desc    Project health dashboard data
router.get('/project-health/:projectId', getProjectHealthReport);

// =====================================================
// OPERATIONAL REPORTS
// =====================================================

// @route   GET /api/reports/action-items
// @desc    Action items report (overdue, due soon, by person)
router.get('/action-items', getActionItemsReport);

// @route   GET /api/reports/pending-approvals
// @desc    All items awaiting approval (risks, changes)
router.get('/pending-approvals', getPendingApprovalsReport);

// @route   GET /api/reports/team-workload
// @desc    Team workload analysis (actions by person)
router.get('/team-workload', getTeamWorkloadReport);

// =====================================================
// TREND ANALYSIS
// =====================================================

// @route   GET /api/reports/trends
// @desc    Trend analysis over time (issues, risks, changes)
router.get('/trends', getTrendAnalysis);

module.exports = router;