import React, { useState, useEffect, useRef } from 'react';
import { 
  TrendingUp, AlertCircle, AlertTriangle, GitBranch, ListChecks, 
  Users, BarChart3, Clock, CheckCircle, XCircle, FileText,
  Download, RefreshCw, Calendar
} from 'lucide-react';
import apiService from '../services/api';
import { useProject } from '../context/ProjectContext';
import { formatDate } from '../utils/dateFormat';
import { formatCurrency } from '../utils/numberFormat';

function Reports() {
  const { selectedProject, getSelectedProjectName } = useProject();
  
  const [activeTab, setActiveTab] = useState('executive');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Report data
  const [executiveSummary, setExecutiveSummary] = useState(null);
  const [riskHeatMap, setRiskHeatMap] = useState(null);
  const [issueAgingReport, setIssueAgingReport] = useState(null);
  const [changeImpactAnalysis, setChangeImpactAnalysis] = useState(null);
  const [projectHealthReport, setProjectHealthReport] = useState(null);
  const [actionItemsReport, setActionItemsReport] = useState(null);
  const [pendingApprovalsReport, setPendingApprovalsReport] = useState(null);
  const [teamWorkloadReport, setTeamWorkloadReport] = useState(null);

  // Fetch report data based on active tab
  const fetchReportData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      switch(activeTab) {
        case 'executive':
          const execResp = await apiService.getExecutiveSummary();
          setExecutiveSummary(execResp.data);
          break;
        case 'risk-heatmap':
          const heatMapResp = await apiService.getRiskHeatMap(selectedProject ? { project_id: selectedProject } : {});
          setRiskHeatMap(heatMapResp.data);
          break;
        case 'issue-aging':
          const agingResp = await apiService.getIssueAgingReport(selectedProject ? { project_id: selectedProject } : {});
          setIssueAgingReport(agingResp.data);
          break;
        case 'change-impact':
          const changeResp = await apiService.getChangeImpactAnalysis(selectedProject ? { project_id: selectedProject } : {});
          setChangeImpactAnalysis(changeResp.data);
          break;
        case 'project-health':
          if (selectedProject) {
            const healthResp = await apiService.getProjectHealthReport(selectedProject);
            setProjectHealthReport(healthResp.data);
          }
          break;
        case 'action-items':
          const actionResp = await apiService.getActionItemsReport(selectedProject ? { project_id: selectedProject } : {});
          setActionItemsReport(actionResp.data);
          break;
        case 'pending-approvals':
          const approvalsResp = await apiService.getPendingApprovalsReport();
          setPendingApprovalsReport(approvalsResp.data);
          break;
        case 'team-workload':
          const workloadResp = await apiService.getTeamWorkloadReport();
          setTeamWorkloadReport(workloadResp.data);
          break;
        default:
          break;
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [activeTab, selectedProject]);

  const tabs = [
    { id: 'executive', label: 'Executive Summary', icon: TrendingUp },
    { id: 'risk-heatmap', label: 'Risk Heat Map', icon: AlertTriangle },
    { id: 'issue-aging', label: 'Issue Aging', icon: Clock },
    { id: 'change-impact', label: 'Change Impact', icon: GitBranch },
    { id: 'project-health', label: 'Project Health', icon: BarChart3, requiresProject: true },
    { id: 'action-items', label: 'Action Items', icon: ListChecks },
    { id: 'pending-approvals', label: 'Pending Approvals', icon: CheckCircle },
    { id: 'team-workload', label: 'Team Workload', icon: Users }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="mt-2 text-gray-600">Comprehensive project insights and analytics</p>
          {selectedProject && (
            <p className="text-sm text-gray-600 mt-1">
              Project: <span className="font-semibold text-gray-900">{getSelectedProjectName()}</span>
            </p>
          )}
        </div>
        <button
          onClick={fetchReportData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <RefreshCw className="w-5 h-5" />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isDisabled = tab.requiresProject && !selectedProject;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => !isDisabled && setActiveTab(tab.id)}
                  disabled={isDisabled}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : isDisabled
                      ? 'border-transparent text-gray-400 cursor-not-allowed'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Report Content */}
        <div className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="text-gray-600 mt-4">Loading report data...</p>
            </div>
          ) : (
            <>
              {activeTab === 'executive' && <ExecutiveSummaryReport data={executiveSummary} />}
              {activeTab === 'risk-heatmap' && <RiskHeatMapReport data={riskHeatMap} />}
              {activeTab === 'issue-aging' && <IssueAgingReport data={issueAgingReport} />}
              {activeTab === 'change-impact' && <ChangeImpactAnalysisReport data={changeImpactAnalysis} />}
              {activeTab === 'project-health' && <ProjectHealthReport data={projectHealthReport} />}
              {activeTab === 'action-items' && <ActionItemsReport data={actionItemsReport} />}
              {activeTab === 'pending-approvals' && <PendingApprovalsReport data={pendingApprovalsReport} />}
              {activeTab === 'team-workload' && <TeamWorkloadReport data={teamWorkloadReport} />}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Executive Summary Report
function ExecutiveSummaryReport({ data }) {
  if (!data) return <p className="text-gray-500">No data available</p>;

  const { projects, issues, risks, changes, approvals } = data;

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Projects */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <FileText className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-900">{projects?.total_projects || 0}</span>
          </div>
          <p className="mt-2 text-sm font-medium text-blue-900">Total Projects</p>
          <p className="text-xs text-blue-700 mt-1">
            {projects?.active_projects || 0} active, {projects?.on_hold_projects || 0} on hold
          </p>
        </div>

        {/* Issues */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <AlertCircle className="w-8 h-8 text-orange-600" />
            <span className="text-2xl font-bold text-orange-900">{issues?.total_issues || 0}</span>
          </div>
          <p className="mt-2 text-sm font-medium text-orange-900">Total Issues</p>
          <p className="text-xs text-orange-700 mt-1">
            {issues?.open_issues || 0} open, {issues?.critical_issues || 0} critical
          </p>
        </div>

        {/* Risks */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <span className="text-2xl font-bold text-red-900">{risks?.total_risks || 0}</span>
          </div>
          <p className="mt-2 text-sm font-medium text-red-900">Total Risks</p>
          <p className="text-xs text-red-700 mt-1">
            {risks?.active_risks || 0} active, {risks?.critical_risks || 0} critical
          </p>
        </div>

        {/* Changes */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <GitBranch className="w-8 h-8 text-purple-600" />
            <span className="text-2xl font-bold text-purple-900">{changes?.total_changes || 0}</span>
          </div>
          <p className="mt-2 text-sm font-medium text-purple-900">Total Changes</p>
          <p className="text-xs text-purple-700 mt-1">
            {changes?.pending_approval || 0} pending approval
          </p>
        </div>
      </div>

      {/* Critical Alerts */}
      {(issues?.overdue_issues > 0 || issues?.critical_issues > 0 || risks?.critical_risks > 0) && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-red-900 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Critical Alerts
          </h3>
          <div className="space-y-2">
            {issues?.overdue_issues > 0 && (
              <div className="flex items-center gap-2 text-red-800">
                <Clock className="w-4 h-4" />
                <span>{issues.overdue_issues} overdue issues requiring attention</span>
              </div>
            )}
            {issues?.critical_issues > 0 && (
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-4 h-4" />
                <span>{issues.critical_issues} critical issues open</span>
              </div>
            )}
            {risks?.critical_risks > 0 && (
              <div className="flex items-center gap-2 text-red-800">
                <AlertTriangle className="w-4 h-4" />
                <span>{risks.critical_risks} high-risk items (score ≥ 16)</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Pending Approvals */}
      {approvals && (approvals.risk_closures > 0 || approvals.change_approvals > 0 || approvals.change_closures > 0) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-900 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Pending Approvals
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {approvals.risk_closures > 0 && (
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-900">{approvals.risk_closures}</p>
                <p className="text-sm text-yellow-700">Risk Closures</p>
              </div>
            )}
            {approvals.change_approvals > 0 && (
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-900">{approvals.change_approvals}</p>
                <p className="text-sm text-yellow-700">Change Approvals</p>
              </div>
            )}
            {approvals.change_closures > 0 && (
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-900">{approvals.change_closures}</p>
                <p className="text-sm text-yellow-700">Change Closures</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Financial Impact */}
      {changes && (changes.total_cost_impact > 0 || changes.total_schedule_impact > 0) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Change Impact Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-blue-700">Total Cost Impact</p>
              <p className="text-2xl font-bold text-blue-900">{formatCurrency(changes.total_cost_impact || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-blue-700">Total Schedule Impact</p>
              <p className="text-2xl font-bold text-blue-900">{changes.total_schedule_impact || 0} days</p>
            </div>
          </div>
        </div>
      )}

      {/* Risk Score */}
      {risks && risks.avg_risk_score && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Risk Score</h3>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-gray-900">{risks.avg_risk_score}</div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                  style={{ width: `${(risks.avg_risk_score / 25) * 100}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-600 mt-1">Scale: 1 (Low) to 25 (Critical)</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Risk Heat Map Report
function RiskHeatMapReport({ data }) {
  if (!data || !data.matrix) return <p className="text-gray-500">No risk data available</p>;

  const { matrix, risks_by_quadrant } = data;

  const getHeatColor = (count) => {
    if (count === 0) return 'bg-gray-100 text-gray-400';
    if (count <= 2) return 'bg-green-100 text-green-800 border-green-300';
    if (count <= 5) return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    if (count <= 10) return 'bg-orange-100 text-orange-800 border-orange-300';
    return 'bg-red-100 text-red-800 border-red-300';
  };

  const probabilityLabels = ['Very High (5)', 'High (4)', 'Medium (3)', 'Low (2)', 'Very Low (1)'];
  const impactLabels = ['Very Low (1)', 'Low (2)', 'Medium (3)', 'High (4)', 'Very High (5)'];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Heat Map Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 border border-gray-300 bg-gray-100 text-sm font-medium">
                  Probability ↓ / Impact →
                </th>
                {impactLabels.map((label, idx) => (
                  <th key={idx} className="p-2 border border-gray-300 bg-gray-100 text-sm font-medium">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {probabilityLabels.map((probLabel, probIdx) => {
                const prob = 5 - probIdx; // Reverse for display
                return (
                  <tr key={prob}>
                    <td className="p-2 border border-gray-300 bg-gray-100 text-sm font-medium">
                      {probLabel}
                    </td>
                    {impactLabels.map((_, impactIdx) => {
                      const impact = impactIdx + 1;
                      const cellData = matrix?.[prob]?.[impact] || { count: 0, score: prob * impact };
                      return (
                        <td 
                          key={impact}
                          className={`p-4 border border-gray-300 text-center ${getHeatColor(cellData.count)}`}
                        >
                          <div className="text-2xl font-bold">{cellData.count}</div>
                          <div className="text-xs mt-1">Score: {cellData.score}</div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quadrant Summary */}
      {risks_by_quadrant && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900">Low Risk</h4>
            <p className="text-2xl font-bold text-green-700 mt-2">{risks_by_quadrant.low || 0}</p>
            <p className="text-xs text-green-600 mt-1">Score: 1-6</p>
          </div>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900">Medium Risk</h4>
            <p className="text-2xl font-bold text-yellow-700 mt-2">{risks_by_quadrant.medium || 0}</p>
            <p className="text-xs text-yellow-600 mt-1">Score: 7-15</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-900">High Risk</h4>
            <p className="text-2xl font-bold text-orange-700 mt-2">{risks_by_quadrant.high || 0}</p>
            <p className="text-xs text-orange-600 mt-1">Score: 16-20</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900">Critical Risk</h4>
            <p className="text-2xl font-bold text-red-700 mt-2">{risks_by_quadrant.critical || 0}</p>
            <p className="text-xs text-red-600 mt-1">Score: 21-25</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Issue Aging Report
function IssueAgingReport({ data }) {
  if (!data || !data.aging_buckets) return <p className="text-gray-500">No issue data available</p>;

  const { aging_buckets, by_priority, summary } = data;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">Total Open Issues</p>
          <p className="text-2xl font-bold text-blue-900">{summary?.total_open || 0}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">Average Age</p>
          <p className="text-2xl font-bold text-yellow-900">{summary?.avg_age || 0} days</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-700">Oldest Issue</p>
          <p className="text-2xl font-bold text-orange-900">{summary?.oldest_age || 0} days</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">Over 30 Days</p>
          <p className="text-2xl font-bold text-red-900">{aging_buckets?.['30+'] || 0}</p>
        </div>
      </div>

      {/* Aging Buckets Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-4">Issues by Age</h4>
        <div className="space-y-3">
          {Object.entries(aging_buckets || {}).map(([bucket, count]) => {
            const maxCount = Math.max(...Object.values(aging_buckets));
            const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
            
            return (
              <div key={bucket}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium text-gray-700">{bucket} days</span>
                  <span className="text-gray-600">{count} issues</span>
                </div>
                <div className="h-8 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 flex items-center justify-end pr-2 text-white text-sm font-medium"
                    style={{ width: `${percentage}%` }}
                  >
                    {count > 0 && percentage > 10 && count}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* By Priority */}
      {by_priority && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-4">Issues by Priority</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(by_priority).map(([priority, count]) => {
              const colors = {
                'Critical': 'bg-red-50 border-red-200 text-red-900',
                'High': 'bg-orange-50 border-orange-200 text-orange-900',
                'Medium': 'bg-yellow-50 border-yellow-200 text-yellow-900',
                'Low': 'bg-gray-50 border-gray-200 text-gray-900'
              };
              
              return (
                <div key={priority} className={`border rounded-lg p-3 ${colors[priority] || 'bg-gray-50'}`}>
                  <p className="text-sm font-medium">{priority}</p>
                  <p className="text-2xl font-bold mt-1">{count}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Change Impact Analysis Report
function ChangeImpactAnalysisReport({ data }) {
  if (!data || !data.changes) return <p className="text-gray-500">No change data available</p>;

  const { changes, by_type, summary } = data;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">Total Changes</p>
          <p className="text-2xl font-bold text-blue-900">{summary?.total || 0}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">Approved</p>
          <p className="text-2xl font-bold text-green-900">{summary?.approved || 0}</p>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-sm text-purple-700">Total Cost Impact</p>
          <p className="text-2xl font-bold text-purple-900">{formatCurrency(summary?.total_cost || 0)}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-700">Schedule Impact</p>
          <p className="text-2xl font-bold text-orange-900">{summary?.total_days || 0} days</p>
        </div>
      </div>

      {/* Changes by Type */}
      {by_type && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-4">Changes by Type</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(by_type).map(([type, count]) => (
              <div key={type} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-700">{type || 'Unspecified'}</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{count}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Changes */}
      {changes && changes.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <h4 className="font-semibold text-gray-900 p-4 border-b">Recent Changes</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost Impact</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Schedule Impact</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {changes.slice(0, 10).map((change, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 text-sm text-gray-900">{change.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{change.change_type}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        change.status === 'Approved' ? 'bg-green-100 text-green-800' :
                        change.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {change.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(change.cost_impact || 0)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{change.schedule_impact_days || 0} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Project Health Report
function ProjectHealthReport({ data }) {
  if (!data) return <p className="text-gray-500">No project data available. Please select a project.</p>;

  const { project, health_score, issues, risks, changes, action_items } = data;

  const getHealthColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-6">
        <h2 className="text-2xl font-bold">{project?.project_name}</h2>
        <p className="text-blue-100 mt-1">{project?.project_code}</p>
        <div className="mt-4 flex items-center gap-4">
          <div>
            <p className="text-sm text-blue-100">Status</p>
            <p className="text-lg font-semibold">{project?.status}</p>
          </div>
          <div>
            <p className="text-sm text-blue-100">Health Score</p>
            <p className={`text-3xl font-bold ${getHealthColor(health_score)}`}>{health_score}%</p>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-600 mb-2">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">Issues</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{issues?.total || 0}</p>
          <p className="text-xs text-gray-600 mt-1">{issues?.open || 0} open</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm font-medium">Risks</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{risks?.total || 0}</p>
          <p className="text-xs text-gray-600 mt-1">{risks?.active || 0} active</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <GitBranch className="w-5 h-5" />
            <p className="text-sm font-medium">Changes</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{changes?.total || 0}</p>
          <p className="text-xs text-gray-600 mt-1">{changes?.pending || 0} pending</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <ListChecks className="w-5 h-5" />
            <p className="text-sm font-medium">Action Items</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{action_items?.total || 0}</p>
          <p className="text-xs text-gray-600 mt-1">{action_items?.overdue || 0} overdue</p>
        </div>
      </div>

      {/* Health Indicators */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h4 className="font-semibold text-gray-900 mb-4">Health Indicators</h4>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Issue Resolution Rate</span>
              <span>{issues?.resolution_rate || 0}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500" style={{ width: `${issues?.resolution_rate || 0}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Risk Mitigation Progress</span>
              <span>{risks?.mitigation_rate || 0}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500" style={{ width: `${risks?.mitigation_rate || 0}%` }}></div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Action Item Completion</span>
              <span>{action_items?.completion_rate || 0}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500" style={{ width: `${action_items?.completion_rate || 0}%` }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Action Items Report
function ActionItemsReport({ data }) {
  if (!data) return <p className="text-gray-500">No action item data available</p>;

  const { summary, by_status, by_priority, overdue_items, upcoming_items } = data;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">Total Items</p>
          <p className="text-2xl font-bold text-blue-900">{summary?.total || 0}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">Pending</p>
          <p className="text-2xl font-bold text-yellow-900">{by_status?.Pending || 0}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">In Progress</p>
          <p className="text-2xl font-bold text-blue-900">{by_status?.['In Progress'] || 0}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-700">Completed</p>
          <p className="text-2xl font-bold text-green-900">{by_status?.Completed || 0}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">Overdue</p>
          <p className="text-2xl font-bold text-red-900">{summary?.overdue || 0}</p>
        </div>
      </div>

      {/* By Priority */}
      {by_priority && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-4">Items by Priority</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(by_priority).map(([priority, count]) => {
              const colors = {
                'Critical': 'bg-red-50 border-red-200 text-red-900',
                'High': 'bg-orange-50 border-orange-200 text-orange-900',
                'Medium': 'bg-yellow-50 border-yellow-200 text-yellow-900',
                'Low': 'bg-gray-50 border-gray-200 text-gray-900'
              };
              return (
                <div key={priority} className={`border rounded-lg p-3 ${colors[priority]}`}>
                  <p className="text-sm font-medium">{priority}</p>
                  <p className="text-2xl font-bold mt-1">{count}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Overdue Items */}
      {overdue_items && overdue_items.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg overflow-hidden">
          <h4 className="font-semibold text-red-900 p-4 border-b border-red-200">Overdue Items</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-red-200">
              <thead className="bg-red-100">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-red-900 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-red-900 uppercase">Assigned To</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-red-900 uppercase">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-red-900 uppercase">Days Overdue</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-red-900 uppercase">Priority</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-red-200">
                {overdue_items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.action_description}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.assigned_to_name || 'Unassigned'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatDate(item.due_date)}</td>
                    <td className="px-4 py-3 text-sm font-bold text-red-600">{item.days_overdue}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                        item.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upcoming Items */}
      {upcoming_items && upcoming_items.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <h4 className="font-semibold text-gray-900 p-4 border-b">Upcoming Items (Next 7 Days)</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned To</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {upcoming_items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.action_description}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.assigned_to_name || 'Unassigned'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatDate(item.due_date)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        item.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                        item.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                        item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Pending Approvals Report
function PendingApprovalsReport({ data }) {
  if (!data) return <p className="text-gray-500">No approval data available</p>;

  const { risk_closures, change_approvals, change_closures } = data;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-600 mb-2">
            <AlertTriangle className="w-5 h-5" />
            <p className="text-sm font-medium">Risk Closures</p>
          </div>
          <p className="text-2xl font-bold text-red-900">{risk_closures?.length || 0}</p>
          <p className="text-xs text-red-700 mt-1">Pending approval</p>
        </div>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-purple-600 mb-2">
            <GitBranch className="w-5 h-5" />
            <p className="text-sm font-medium">Change Requests</p>
          </div>
          <p className="text-2xl font-bold text-purple-900">{change_approvals?.length || 0}</p>
          <p className="text-xs text-purple-700 mt-1">Under review</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-blue-600 mb-2">
            <CheckCircle className="w-5 h-5" />
            <p className="text-sm font-medium">Change Closures</p>
          </div>
          <p className="text-2xl font-bold text-blue-900">{change_closures?.length || 0}</p>
          <p className="text-xs text-blue-700 mt-1">Awaiting closure</p>
        </div>
      </div>

      {/* Risk Closures */}
      {risk_closures && risk_closures.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <h4 className="font-semibold text-gray-900 p-4 border-b">Risk Closure Requests</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {risk_closures.map((risk, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 text-sm text-gray-900">{risk.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{risk.project_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatDate(risk.closure_requested_date)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${
                        risk.risk_score >= 16 ? 'bg-red-100 text-red-800' :
                        risk.risk_score >= 8 ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {risk.risk_score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Change Approvals */}
      {change_approvals && change_approvals.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <h4 className="font-semibold text-gray-900 p-4 border-b">Change Approval Requests</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost Impact</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {change_approvals.map((change, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3 text-sm text-gray-900">{change.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{change.project_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{change.change_type}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatCurrency(change.cost_impact || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Team Workload Report
function TeamWorkloadReport({ data }) {
  if (!data || !data.team_members) return <p className="text-gray-500">No team workload data available</p>;

  const { team_members, summary } = data;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">Team Members</p>
          <p className="text-2xl font-bold text-blue-900">{summary?.total_members || 0}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-700">Total Assignments</p>
          <p className="text-2xl font-bold text-orange-900">{summary?.total_assignments || 0}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-700">Avg per Member</p>
          <p className="text-2xl font-bold text-yellow-900">{summary?.avg_per_member || 0}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-700">Overloaded</p>
          <p className="text-2xl font-bold text-red-900">{summary?.overloaded || 0}</p>
        </div>
      </div>

      {/* Team Member Workload */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <h4 className="font-semibold text-gray-900 p-4 border-b">Team Member Workload</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Team Member</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issues</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risks</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Workload</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {team_members.map((member, idx) => {
                const total = (member.issues || 0) + (member.risks || 0) + (member.actions || 0);
                const isOverloaded = total > 10;
                
                return (
                  <tr key={idx} className={isOverloaded ? 'bg-red-50' : ''}>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{member.full_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{member.issues || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{member.risks || 0}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{member.actions || 0}</td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{total}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${isOverloaded ? 'bg-red-500' : total > 5 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${Math.min((total / 15) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <span className={`text-xs font-medium ${
                          isOverloaded ? 'text-red-600' : total > 5 ? 'text-yellow-600' : 'text-green-600'
                        }`}>
                          {isOverloaded ? 'High' : total > 5 ? 'Medium' : 'Low'}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Reports;
