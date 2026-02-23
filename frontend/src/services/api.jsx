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
// Get all people with optional filters
export const getPeople = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const query = params.toString() ? `?${params}` : '';
  return fetchAPI(`/people${query}`);
};

// Get person by ID (includes workload and ownership data)
export const getPersonById = async (id) => {
  return fetchAPI(`/people/${id}`);
};

// Create new person
export const createPerson = async (data) => {
  return fetchAPI('/people', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

// Update person
export const updatePerson = async (id, data) => {
  return fetchAPI(`/people/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

// Delete person (actually deactivates - sets is_active = false)
export const deletePerson = async (id) => {
  return fetchAPI(`/people/${id}`, {
    method: 'DELETE',
  });
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

// Fault Actions - NEW!
export const getFaultActions = async (faultId) => {
  return fetchAPI(`/faults/${faultId}/actions`);
};

export const createFaultAction = async (faultId, data) => {
  return fetchAPI(`/faults/${faultId}/actions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateFaultAction = async (faultId, actionId, data) => {
  return fetchAPI(`/faults/${faultId}/actions/${actionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteFaultAction = async (faultId, actionId) => {
  return fetchAPI(`/faults/${faultId}/actions/${actionId}`, {
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

// CHANGES CRUD
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

// CHANGE ACTIONS
export const getChangeActions = async (changeId) => {
  return fetchAPI(`/changes/${changeId}/actions`);
};

export const createChangeAction = async (changeId, data) => {
  return fetchAPI(`/changes/${changeId}/actions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateChangeAction = async (changeId, actionId, data) => {
  return fetchAPI(`/changes/${changeId}/actions/${actionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteChangeAction = async (changeId, actionId) => {
  return fetchAPI(`/changes/${changeId}/actions/${actionId}`, {
    method: 'DELETE',
  });
};

// CHANGE LOG
export const getChangeLog = async (changeId) => {
  return fetchAPI(`/changes/${changeId}/log`);
};

// WORKFLOW ENDPOINTS
export const requestApproval = async (changeId, data) => {
  return fetchAPI(`/changes/${changeId}/request-approval`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const approveChange = async (changeId, data) => {
  return fetchAPI(`/changes/${changeId}/approve`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const rejectChange = async (changeId, data) => {
  return fetchAPI(`/changes/${changeId}/reject`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const requestClosure = async (changeId, data) => {
  return fetchAPI(`/changes/${changeId}/request-closure`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const approveClosure = async (changeId, data) => {
  return fetchAPI(`/changes/${changeId}/approve-closure`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const rejectClosure = async (changeId, data) => {
  return fetchAPI(`/changes/${changeId}/reject-closure`, {
    method: 'POST',
    body: JSON.stringify(data),
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

export const updateEscalation = async (id, data) => {
  return fetchAPI(`/escalations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteEscalation = async (id) => {
  return fetchAPI(`/escalations/${id}`, {
    method: 'DELETE',
  });
};

// Escalation Actions
export const getEscalationActions = async (escalationId) => {
  return fetchAPI(`/escalations/${escalationId}/actions`);
};

export const createEscalationAction = async (escalationId, data) => {
  return fetchAPI(`/escalations/${escalationId}/actions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateEscalationAction = async (escalationId, actionId, data) => {
  return fetchAPI(`/escalations/${escalationId}/actions/${actionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteEscalationAction = async (escalationId, actionId) => {
  return fetchAPI(`/escalations/${escalationId}/actions/${actionId}`, {
    method: 'DELETE',
  });
};

// Escalation Log
export const getEscalationLog = async (escalationId) => {
  return fetchAPI(`/escalations/${escalationId}/log`);
};

export const addEscalationLogEntry = async (escalationId, data) => {
  return fetchAPI(`/escalations/${escalationId}/log`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};
// =====================================================
// ACTION LOGS API METHODS
// =====================================================

// ACTION LOG HEADERS (Main logs)
export const getActionLogs = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const query = params.toString() ? `?${params}` : '';
  return fetchAPI(`/action-logs${query}`);
};

export const getActionLogById = async (id) => {
  return fetchAPI(`/action-logs/${id}`);
};

export const createActionLog = async (data) => {
  return fetchAPI('/action-logs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateActionLog = async (id, data) => {
  return fetchAPI(`/action-logs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteActionLog = async (id) => {
  return fetchAPI(`/action-logs/${id}`, {
    method: 'DELETE',
  });
};

// ACTION LOG ITEMS (Individual actions)
export const getActionLogItems = async (logId) => {
  return fetchAPI(`/action-logs/${logId}/items`);
};

export const createActionLogItem = async (logId, data) => {
  return fetchAPI(`/action-logs/${logId}/items`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateActionLogItem = async (logId, itemId, data) => {
  return fetchAPI(`/action-logs/${logId}/items/${itemId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteActionLogItem = async (logId, itemId) => {
  return fetchAPI(`/action-logs/${logId}/items/${itemId}`, {
    method: 'DELETE',
  });
};

// ACTION ITEM REQUIREMENTS (Checklist for each item)
export const getActionItemRequirements = async (logId, itemId) => {
  return fetchAPI(`/action-logs/${logId}/items/${itemId}/requirements`);
};

export const createActionItemRequirement = async (logId, itemId, data) => {
  return fetchAPI(`/action-logs/${logId}/items/${itemId}/requirements`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateActionItemRequirement = async (logId, itemId, reqId, data) => {
  return fetchAPI(`/action-logs/${logId}/items/${itemId}/requirements/${reqId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

export const deleteActionItemRequirement = async (logId, itemId, reqId) => {
  return fetchAPI(`/action-logs/${logId}/items/${itemId}/requirements/${reqId}`, {
    method: 'DELETE',
  });
};

// REPORTS
export const getExecutiveSummary = async () => {
  return fetchAPI('/reports/executive-summary');
};

export const getProjectSummaryReport = async (projectId) => {
  return fetchAPI(`/reports/project-summary/${projectId}`);
};

export const getRiskHeatMap = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const query = params.toString() ? `?${params}` : '';
  return fetchAPI(`/reports/risk-heatmap${query}`);
};

export const getIssueAgingReport = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const query = params.toString() ? `?${params}` : '';
  return fetchAPI(`/reports/issue-aging${query}`);
};

export const getChangeImpactAnalysis = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const query = params.toString() ? `?${params}` : '';
  return fetchAPI(`/reports/change-impact${query}`);
};

export const getProjectHealthReport = async (projectId) => {
  return fetchAPI(`/reports/project-health/${projectId}`);
};

export const getActionItemsReport = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const query = params.toString() ? `?${params}` : '';
  return fetchAPI(`/reports/action-items${query}`);
};

export const getPendingApprovalsReport = async () => {
  return fetchAPI('/reports/pending-approvals');
};

export const getTeamWorkloadReport = async () => {
  return fetchAPI('/reports/team-workload');
};

export const getTrendAnalysis = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const query = params.toString() ? `?${params}` : '';
  return fetchAPI(`/reports/trend-analysis${query}`);
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
  createPerson,
  updatePerson,
  deletePerson,
  
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
  
  // Faults - UPDATED WITH ACTIONS!
  getFaults,
  getFaultById,
  createFault,
  updateFault,
  deleteFault,
  getFaultActions,        // NEW!
  createFaultAction,      // NEW!
  updateFaultAction,      // NEW!
  deleteFaultAction,      // NEW!
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
  getChangeActions,
  createChangeAction,
  updateChangeAction,
  deleteChangeAction,
  getChangeLog,
  requestApproval,
  approveChange,
  rejectChange,
  requestClosure,
  approveClosure,
  rejectClosure,
  
  // Escalations
  getEscalations,
  getEscalationById,
  createEscalation,
  updateEscalation,      
  deleteEscalation,
  getEscalationActions,
  createEscalationAction,
  updateEscalationAction,
  deleteEscalationAction,
  getEscalationLog,
  addEscalationLogEntry,
  
  // Reports
  getExecutiveSummary,
  getProjectSummaryReport,
  getRiskHeatMap,
  getIssueAgingReport,
  getChangeImpactAnalysis,
  getProjectHealthReport,
  getActionItemsReport,
  getPendingApprovalsReport,
  getTeamWorkloadReport,
  getTrendAnalysis,
  
  // Action Logs
  getActionLogs,
  getActionLogById,
  createActionLog,
  updateActionLog,
  deleteActionLog,
  getActionLogItems,
  createActionLogItem,
  updateActionLogItem,
  deleteActionLogItem,
  getActionItemRequirements,
  createActionItemRequirement,
  updateActionItemRequirement,
  deleteActionItemRequirement,
};

export default apiService;
