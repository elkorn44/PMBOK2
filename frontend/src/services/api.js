// frontend/src/services/api.js
import axios from 'axios';

// Base URL for your backend API
const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API Service Object
const apiService = {
  // =====================================================
  // DASHBOARD
  // =====================================================
  getDashboard: (projectId = null) => {
    const url = projectId ? `/dashboard?project_id=${projectId}` : '/dashboard';
    return api.get(url);
  },

  getQuickStats: (projectId = null) => {
    const url = projectId ? `/dashboard/quick-stats?project_id=${projectId}` : '/dashboard/quick-stats';
    return api.get(url);
  },

  // =====================================================
  // PROJECTS
  // =====================================================
  getProjects: () => api.get('/projects'),
  getProject: (id) => api.get(`/projects/${id}`),
  createProject: (data) => api.post('/projects', data),
  updateProject: (id, data) => api.put(`/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/projects/${id}`),

  // =====================================================
  // ISSUES
  // =====================================================
  getIssues: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return api.get(`/issues?${params}`);
  },
  getIssue: (id) => api.get(`/issues/${id}`),
  createIssue: (data) => api.post('/issues', data),
  updateIssue: (id, data) => api.put(`/issues/${id}`, data),
  deleteIssue: (id) => api.delete(`/issues/${id}`),
  getIssueActions: (id) => api.get(`/issues/${id}/actions`),
  createIssueAction: (id, data) => api.post(`/issues/${id}/actions`, data),
  updateIssueAction: (issueId, actionId, data) => api.put(`/issues/${issueId}/actions/${actionId}`, data),
  getIssueLog: (id) => api.get(`/issues/${id}/log`),
  addIssueLog: (id, data) => api.post(`/issues/${id}/log`, data),

  // =====================================================
  // RISKS
  // =====================================================
  getRisks: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return api.get(`/risks?${params}`);
  },
  getRisk: (id) => api.get(`/risks/${id}`),
  createRisk: (data) => api.post('/risks', data),
  updateRisk: (id, data) => api.put(`/risks/${id}`, data),
  deleteRisk: (id) => api.delete(`/risks/${id}`),
  requestRiskClosure: (id, data) => api.post(`/risks/${id}/request-closure`, data),
  approveRiskClosure: (id, data) => api.post(`/risks/${id}/approve-closure`, data),
  rejectRiskClosure: (id, data) => api.post(`/risks/${id}/reject-closure`, data),
  getRiskActions: (id) => api.get(`/risks/${id}/actions`),
  createRiskAction: (id, data) => api.post(`/risks/${id}/actions`, data),
  getRiskLog: (id) => api.get(`/risks/${id}/log`),

  // =====================================================
  // CHANGES
  // =====================================================
  getChanges: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return api.get(`/changes?${params}`);
  },
  getChange: (id) => api.get(`/changes/${id}`),
  createChange: (data) => api.post('/changes', data),
  updateChange: (id, data) => api.put(`/changes/${id}`, data),
  deleteChange: (id) => api.delete(`/changes/${id}`),
  requestChangeApproval: (id, data) => api.post(`/changes/${id}/request-approval`, data),
  approveChange: (id, data) => api.post(`/changes/${id}/approve`, data),
  rejectChange: (id, data) => api.post(`/changes/${id}/reject`, data),
  requestChangeClosure: (id, data) => api.post(`/changes/${id}/request-closure`, data),
  approveChangeClosure: (id, data) => api.post(`/changes/${id}/approve-closure`, data),
  getChangeActions: (id) => api.get(`/changes/${id}/actions`),
  getChangeLog: (id) => api.get(`/changes/${id}/log`),

  // =====================================================
  // ESCALATIONS
  // =====================================================
  getEscalations: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return api.get(`/escalations?${params}`);
  },
  getEscalation: (id) => api.get(`/escalations/${id}`),
  createEscalation: (data) => api.post('/escalations', data),
  updateEscalation: (id, data) => api.put(`/escalations/${id}`, data),

  // =====================================================
  // FAULTS
  // =====================================================
  getFaults: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return api.get(`/faults?${params}`);
  },
  getFault: (id) => api.get(`/faults/${id}`),
  createFault: (data) => api.post('/faults', data),
  updateFault: (id, data) => api.put(`/faults/${id}`, data),

  // =====================================================
  // REPORTS
  // =====================================================
  getExecutiveSummary: () => api.get('/reports/executive-summary'),
  getRiskHeatMap: (projectId = null) => {
    const url = projectId ? `/reports/risk-heat-map?project_id=${projectId}` : '/reports/risk-heat-map';
    return api.get(url);
  },
  getIssueAging: (projectId = null) => {
    const url = projectId ? `/reports/issue-aging?project_id=${projectId}` : '/reports/issue-aging';
    return api.get(url);
  },
  getChangeImpact: (projectId = null) => {
    const url = projectId ? `/reports/change-impact?project_id=${projectId}` : '/reports/change-impact';
    return api.get(url);
  },
  getActionItems: (filters = {}) => {
    const params = new URLSearchParams(filters);
    return api.get(`/reports/action-items?${params}`);
  },
  getPendingApprovals: () => api.get('/reports/pending-approvals'),
  getTeamWorkload: () => api.get('/reports/team-workload'),
  getProjectHealth: (projectId) => api.get(`/reports/project-health/${projectId}`),
};

export default apiService;