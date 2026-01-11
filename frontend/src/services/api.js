// frontend/src/services/apiService.js
// Centralized API service for all backend communication

const API_BASE_URL = 'http://localhost:3001/api';

// Helper function for fetch requests
const fetchAPI = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API Error [${endpoint}]:`, error);
    throw error;
  }
};

// =====================================================
// DASHBOARD
// =====================================================

export const getDashboard = async () => {
  return fetchAPI('/dashboard');
};

// =====================================================
// PROJECTS
// =====================================================

export const getProjects = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const query = params.toString() ? `?${params}` : '';
  return fetchAPI(`/projects${query}`);
};

export const getProjectById = async (id) => {
  return fetchAPI(`/projects/${id}`);
};

export const createProject = async (data) => {
  return fetchAPI('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateProject = async (id, data) => {
  return fetchAPI(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteProject = async (id) => {
  return fetchAPI(`/projects/${id}`, {
    method: 'DELETE',
  });
};

// =====================================================
// PEOPLE
// =====================================================

export const getPeople = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const query = params.toString() ? `?${params}` : '';
  return fetchAPI(`/people${query}`);
};

export const getPersonById = async (id) => {
  return fetchAPI(`/people/${id}`);
};

// =====================================================
// ISSUES
// =====================================================

export const getIssues = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const query = params.toString() ? `?${params}` : '';
  return fetchAPI(`/issues${query}`);
};

export const getIssueById = async (id) => {
  return fetchAPI(`/issues/${id}`);
};

export const createIssue = async (data) => {
  return fetchAPI('/issues', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateIssue = async (id, data) => {
  return fetchAPI(`/issues/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteIssue = async (id) => {
  return fetchAPI(`/issues/${id}`, {
    method: 'DELETE',
  });
};

// Issue Actions
export const getIssueActions = async (issueId) => {
  return fetchAPI(`/issues/${issueId}/actions`);
};

export const createIssueAction = async (issueId, data) => {
  return fetchAPI(`/issues/${issueId}/actions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateIssueAction = async (issueId, actionId, data) => {
  return fetchAPI(`/issues/${issueId}/actions/${actionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteIssueAction = async (issueId, actionId) => {
  return fetchAPI(`/issues/${issueId}/actions/${actionId}`, {
    method: 'DELETE',
  });
};

// Issue Log
export const getIssueLog = async (issueId) => {
  return fetchAPI(`/issues/${issueId}/log`);
};

export const addIssueLogEntry = async (issueId, data) => {
  return fetchAPI(`/issues/${issueId}/log`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// =====================================================
// FAULTS
// =====================================================

export const getFaults = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const query = params.toString() ? `?${params}` : '';
  return fetchAPI(`/faults${query}`);
};

export const getFaultById = async (id) => {
  return fetchAPI(`/faults/${id}`);
};

export const createFault = async (data) => {
  return fetchAPI('/faults', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateFault = async (id, data) => {
  return fetchAPI(`/faults/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteFault = async (id) => {
  return fetchAPI(`/faults/${id}`, {
    method: 'DELETE',
  });
};

// Fault Log/Audit Trail
export const getFaultLog = async (faultId) => {
  return fetchAPI(`/faults/${faultId}/log`);
};

export const addFaultLogEntry = async (faultId, data) => {
  return fetchAPI(`/faults/${faultId}/log`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// =====================================================
// RISKS
// =====================================================

export const getRisks = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const query = params.toString() ? `?${params}` : '';
  return fetchAPI(`/risks${query}`);
};

export const getRiskById = async (id) => {
  return fetchAPI(`/risks/${id}`);
};

export const createRisk = async (data) => {
  return fetchAPI('/risks', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateRisk = async (id, data) => {
  return fetchAPI(`/risks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteRisk = async (id) => {
  return fetchAPI(`/risks/${id}`, {
    method: 'DELETE',
  });
};

// Risk Actions
export const getRiskActions = async (riskId) => {
  return fetchAPI(`/risks/${riskId}/actions`);
};

export const createRiskAction = async (riskId, data) => {
  return fetchAPI(`/risks/${riskId}/actions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateRiskAction = async (riskId, actionId, data) => {
  return fetchAPI(`/risks/${riskId}/actions/${actionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteRiskAction = async (riskId, actionId) => {
  return fetchAPI(`/risks/${riskId}/actions/${actionId}`, {
    method: 'DELETE',
  });
};

// Risk Log/Audit Trail
export const getRiskLog = async (riskId) => {
  return fetchAPI(`/risks/${riskId}/log`);
};

export const addRiskLogEntry = async (riskId, data) => {
  return fetchAPI(`/risks/${riskId}/log`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Risk Closure Workflow
export const requestRiskClosure = async (riskId, data) => {
  return fetchAPI(`/risks/${riskId}/request-closure`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const approveRiskClosure = async (riskId, data) => {
  return fetchAPI(`/risks/${riskId}/approve-closure`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const rejectRiskClosure = async (riskId, data) => {
  return fetchAPI(`/risks/${riskId}/reject-closure`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// =====================================================
// CHANGES
// =====================================================

export const getChanges = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const query = params.toString() ? `?${params}` : '';
  return fetchAPI(`/changes${query}`);
};

export const getChangeById = async (id) => {
  return fetchAPI(`/changes/${id}`);
};

export const createChange = async (data) => {
  return fetchAPI('/changes', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateChange = async (id, data) => {
  return fetchAPI(`/changes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteChange = async (id) => {
  return fetchAPI(`/changes/${id}`, {
    method: 'DELETE',
  });
};

// =====================================================
// ESCALATIONS
// =====================================================

export const getEscalations = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const query = params.toString() ? `?${params}` : '';
  return fetchAPI(`/escalations${query}`);
};

export const getEscalationById = async (id) => {
  return fetchAPI(`/escalations/${id}`);
};

export const createEscalation = async (data) => {
  return fetchAPI('/escalations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// =====================================================
// FAULTS
// =====================================================

export const getFaults = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const query = params.toString() ? `?${params}` : '';
  return fetchAPI(`/faults${query}`);
};

export const getFaultById = async (id) => {
  return fetchAPI(`/faults/${id}`);
};

export const createFault = async (data) => {
  return fetchAPI('/faults', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// =====================================================
// REPORTS
// =====================================================

export const getExecutiveSummary = async () => {
  return fetchAPI('/reports/executive-summary');
};

export const getRiskHeatMap = async (projectId = null) => {
  const query = projectId ? `?project_id=${projectId}` : '';
  return fetchAPI(`/reports/risk-heat-map${query}`);
};

export const getIssueAgingReport = async (projectId = null) => {
  const query = projectId ? `?project_id=${projectId}` : '';
  return fetchAPI(`/reports/issue-aging${query}`);
};

// =====================================================
// DEFAULT EXPORT
// =====================================================

const apiService = {
  // Dashboard
  getDashboard,
  
  // Projects
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  
  // People
  getPeople,
  getPersonById,
  
  // Issues
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
  getIssueActions,
  createIssueAction,
  updateIssueAction,
  deleteIssueAction,
  getIssueLog,
  addIssueLogEntry,
  
  // Faults
  getFaults,
  getFaultById,
  createFault,
  updateFault,
  deleteFault,
  getFaultLog,
  addFaultLogEntry,
  
  // Risks
  getRisks,
  getRiskById,
  createRisk,
  updateRisk,
  deleteRisk,
  getRiskActions,
  createRiskAction,
  updateRiskAction,
  deleteRiskAction,
  getRiskLog,
  addRiskLogEntry,
  requestRiskClosure,
  approveRiskClosure,
  rejectRiskClosure,
  
  // Changes
  getChanges,
  getChangeById,
  createChange,
  updateChange,
  deleteChange,
  
  // Escalations
  getEscalations,
  getEscalationById,
  createEscalation,
  
  // Faults
  getFaults,
  getFaultById,
  createFault,
  
  // Reports
  getExecutiveSummary,
  getRiskHeatMap,
  getIssueAgingReport,
};

export default apiService;
