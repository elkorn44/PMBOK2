import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CheckCircle, XCircle, X, Eye, AlertTriangle, Calendar, User, FileText, ListChecks } from 'lucide-react';
import apiService from '../services/api';
import { useProject } from '../context/ProjectContext';
import { formatDate, formatDateTime } from '../utils/dateFormat';

function RiskApprovals() {
  const { selectedProject, getSelectedProjectName } = useProject();
  
  const [pendingRisks, setPendingRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Performance: useRef latch
  const fetchedData = useRef(false);
  
  // Modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [riskDetails, setRiskDetails] = useState(null);

  // Fetch pending risk closures
  const fetchPendingRisks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getPendingApprovalsReport();
      
      // Filter by project if selected
      let risks = response.data?.risk_closures || [];
      if (selectedProject && risks.length > 0) {
        // Get project name to filter
        const projectName = getSelectedProjectName();
        risks = risks.filter(r => r.project_name === projectName);
      }
      
      setPendingRisks(risks);
      setError(null);
    } catch (err) {
      console.error('Error fetching pending risks:', err);
      setError('Failed to load pending risk closures');
    } finally {
      setLoading(false);
    }
  }, [selectedProject, getSelectedProjectName]);

  // Initial fetch with race condition guard
  useEffect(() => {
    if (fetchedData.current) return;
    fetchPendingRisks();
    fetchedData.current = true;
  }, []);

  // Refetch when project changes
  useEffect(() => {
    if (fetchedData.current) {
      fetchPendingRisks();
    }
  }, [selectedProject]);

  // View risk for approval
  const viewRiskForApproval = async (risk) => {
    try {
      // Get full risk details
      const response = await apiService.getRiskById(risk.risk_id);
      setRiskDetails(response.data);
      setSelectedRisk(risk);
      setShowReviewModal(true);
    } catch (err) {
      console.error('Error loading risk details:', err);
      alert('Failed to load risk details');
    }
  };

  const getRiskScoreColor = (score) => {
    if (score >= 20) return 'text-red-600 bg-red-100 border-red-200';
    if (score >= 15) return 'text-orange-600 bg-orange-100 border-orange-200';
    if (score >= 10) return 'text-yellow-600 bg-yellow-100 border-yellow-200';
    return 'text-green-600 bg-green-100 border-green-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Risk Closure Approvals</h1>
          <p className="mt-2 text-gray-600">Review and approve risk closure requests</p>
          {selectedProject && (
            <p className="text-sm text-gray-600 mt-1">
              Project: <span className="font-semibold text-gray-900">{getSelectedProjectName()}</span>
            </p>
          )}
        </div>
        <button
          onClick={fetchPendingRisks}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <FileText className="w-5 h-5" />
          Refresh
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
          <span className="text-red-800">{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-yellow-900">{pendingRisks.length}</p>
          <p className="text-sm text-yellow-700 mt-1">Pending Closure Requests</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-red-900">
            {pendingRisks.filter(r => r.risk_score >= 16).length}
          </p>
          <p className="text-sm text-red-700 mt-1">High/Critical Risks</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
          <p className="text-3xl font-bold text-blue-900">
            {pendingRisks.filter(r => {
              const daysSince = Math.floor((Date.now() - new Date(r.requested_date)) / (1000 * 60 * 60 * 24));
              return daysSince > 7;
            }).length}
          </p>
          <p className="text-sm text-blue-700 mt-1">Waiting Over 7 Days</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Loading pending closures...</p>
        </div>
      )}

      {/* Pending Risks Table */}
      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Owner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Risk Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pendingRisks.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    {selectedProject
                      ? 'No pending risk closures for this project'
                      : 'No pending risk closures found. All clear!'}
                  </td>
                </tr>
              ) : (
                pendingRisks.map((risk) => {
                  const daysSince = Math.floor((Date.now() - new Date(risk.requested_date)) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <tr 
                      key={risk.risk_id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => viewRiskForApproval(risk)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">{risk.title}</div>
                            <div className="text-sm text-gray-500">{risk.risk_number}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {risk.project_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {risk.owner_name || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${getRiskScoreColor(risk.risk_score)}`}>
                          {risk.risk_score}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-900">{formatDate(risk.requested_date)}</span>
                        </div>
                        <div className={`text-xs mt-1 ${daysSince > 7 ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                          {daysSince} days ago
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            viewRiskForApproval(risk);
                          }}
                          className="text-blue-600 hover:text-blue-900"
                          title="Review"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedRisk && riskDetails && (
        <RiskReviewModal
          risk={selectedRisk}
          riskDetails={riskDetails}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedRisk(null);
            setRiskDetails(null);
          }}
          onApproved={() => {
            setShowReviewModal(false);
            setSelectedRisk(null);
            setRiskDetails(null);
            fetchPendingRisks();
          }}
          onRejected={() => {
            setShowReviewModal(false);
            setSelectedRisk(null);
            setRiskDetails(null);
            fetchPendingRisks();
          }}
        />
      )}
    </div>
  );
}

// Risk Review Modal with Full Details and Approval Actions
function RiskReviewModal({ risk, riskDetails, onClose, onApproved, onRejected }) {
  const [decision, setDecision] = useState(''); // 'approve' or 'reject'
  const [comments, setComments] = useState('');
  const [approvedBy, setApprovedBy] = useState('1'); // Default person ID
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!decision) {
      alert('Please select Approve or Reject');
      return;
    }

    if (!comments.trim()) {
      alert('Please provide comments for your decision');
      return;
    }

    setSubmitting(true);

    try {
      if (decision === 'approve') {
        await apiService.approveRiskClosure(risk.risk_id, {
          approved_by: parseInt(approvedBy),
          approval_comments: comments
        });
        alert('Risk closure APPROVED successfully');
        onApproved();
      } else {
        await apiService.rejectRiskClosure(risk.risk_id, {
          rejected_by: parseInt(approvedBy),
          rejection_reason: comments
        });
        alert('Risk closure REJECTED');
        onRejected();
      }
    } catch (err) {
      console.error('Error processing approval:', err);
      alert('Failed to process approval: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const getRiskScoreColor = (score) => {
    if (score >= 20) return 'bg-red-100 text-red-800';
    if (score >= 15) return 'bg-orange-100 text-orange-800';
    if (score >= 10) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getProbabilityValue = (prob) => {
    const map = { 'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5 };
    return map[prob] || 0;
  };

  const getImpactValue = (impact) => {
    const map = { 'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5 };
    return map[impact] || 0;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Sticky Header with Icons - justify-between */}
        <form id="approvalForm" onSubmit={handleSubmit}>
          <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Review Risk Closure Request</h2>
            <div className="flex items-center gap-2">
              {/* Approve Button (Green Check) */}
              {decision === 'approve' && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg disabled:opacity-50"
                  title="Approve Closure"
                >
                  <CheckCircle className="w-5 h-5" />
                </button>
              )}
              {/* Reject Button (Red X) */}
              {decision === 'reject' && (
                <button
                  type="submit"
                  disabled={submitting}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg disabled:opacity-50"
                  title="Reject Closure"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              )}
              {/* Close Icon */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Risk Header */}
            <div className="border-b pb-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-red-600 mt-1" />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900">{riskDetails.title}</h3>
                  <p className="text-gray-500 mt-1">{riskDetails.risk_number}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getRiskScoreColor(riskDetails.risk_score)}`}>
                  Score: {riskDetails.risk_score}
                </span>
                <span className="px-3 py-1 text-sm font-semibold rounded-full bg-yellow-100 text-yellow-800">
                  {riskDetails.status}
                </span>
              </div>
            </div>

            {/* Closure Request Info */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-lg font-semibold text-yellow-900 mb-3">📋 Closure Request</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-yellow-700">Requested:</span>
                  <span className="text-yellow-900 font-medium">{formatDate(risk.requested_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-700">Days Pending:</span>
                  <span className="text-yellow-900 font-medium">
                    {Math.floor((Date.now() - new Date(risk.requested_date)) / (1000 * 60 * 60 * 24))} days
                  </span>
                </div>
                {risk.justification && (
                  <div className="mt-3 pt-3 border-t border-yellow-300">
                    <p className="text-yellow-700 font-medium mb-1">Justification:</p>
                    <p className="text-yellow-900 whitespace-pre-wrap">{risk.justification}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Risk Details in Two Columns */}
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{riskDetails.description || 'No description'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Category</label>
                  <p className="mt-1 text-gray-900">{riskDetails.category || 'Not specified'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Probability</label>
                    <p className="mt-1 text-gray-900">{riskDetails.probability} ({getProbabilityValue(riskDetails.probability)})</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Impact</label>
                    <p className="mt-1 text-gray-900">{riskDetails.impact} ({getImpactValue(riskDetails.impact)})</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Identified Date</label>
                  <p className="mt-1 text-gray-900">{formatDate(riskDetails.identified_date)}</p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Mitigation Strategy</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{riskDetails.mitigation_strategy || 'None specified'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Contingency Plan</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{riskDetails.contingency_plan || 'None specified'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Owner</label>
                    <p className="mt-1 text-gray-900">{risk.owner_name || 'Unassigned'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Risk Score</label>
                    <p className="mt-1 text-gray-900 font-bold">
                      {riskDetails.risk_score} ({getProbabilityValue(riskDetails.probability)} × {getImpactValue(riskDetails.impact)})
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            {riskDetails.actions && riskDetails.actions.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <ListChecks className="w-5 h-5" />
                  Mitigation Actions ({riskDetails.actions.length})
                </h4>
                <div className="space-y-2">
                  {riskDetails.actions.map((action, idx) => (
                    <div key={idx} className={`border rounded-lg p-3 ${
                      action.status === 'Completed' ? 'bg-green-50 border-green-200' :
                      action.status === 'In Progress' ? 'bg-blue-50 border-blue-200' :
                      'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{action.action_description}</p>
                          <div className="flex gap-4 mt-1 text-xs text-gray-600">
                            <span>Type: {action.action_type}</span>
                            <span>Priority: {action.priority}</span>
                            {action.due_date && <span>Due: {formatDate(action.due_date)}</span>}
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          action.status === 'Completed' ? 'bg-green-100 text-green-800' :
                          action.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {action.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Approval Decision Section */}
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Your Decision</h4>
              
              {/* Decision Buttons */}
              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => setDecision('approve')}
                  className={`flex-1 py-3 px-4 border-2 rounded-lg font-medium transition-colors ${
                    decision === 'approve'
                      ? 'bg-green-50 border-green-500 text-green-900'
                      : 'border-gray-300 text-gray-700 hover:border-green-300'
                  }`}
                >
                  <CheckCircle className="w-5 h-5 inline mr-2" />
                  Approve Closure
                </button>
                <button
                  type="button"
                  onClick={() => setDecision('reject')}
                  className={`flex-1 py-3 px-4 border-2 rounded-lg font-medium transition-colors ${
                    decision === 'reject'
                      ? 'bg-red-50 border-red-500 text-red-900'
                      : 'border-gray-300 text-gray-700 hover:border-red-300'
                  }`}
                >
                  <XCircle className="w-5 h-5 inline mr-2" />
                  Reject Closure
                </button>
              </div>

              {/* Reviewer */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reviewed By (Person ID) *
                </label>
                <input
                  type="number"
                  value={approvedBy}
                  onChange={(e) => setApprovedBy(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Comments */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {decision === 'approve' ? 'Approval Comments *' : decision === 'reject' ? 'Rejection Reason *' : 'Comments *'}
                </label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows="4"
                  placeholder={
                    decision === 'approve' 
                      ? 'Provide rationale for approval...'
                      : decision === 'reject'
                      ? 'Explain why the closure is being rejected...'
                      : 'Select a decision first...'
                  }
                  required
                />
              </div>

              {/* Submit Button (Alternative to Header Icon) */}
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !decision}
                  className={`px-6 py-2 rounded-lg font-medium disabled:opacity-50 ${
                    decision === 'approve'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : decision === 'reject'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {submitting ? 'Processing...' : decision === 'approve' ? 'Approve Closure' : decision === 'reject' ? 'Reject Closure' : 'Select Decision'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RiskApprovals;
