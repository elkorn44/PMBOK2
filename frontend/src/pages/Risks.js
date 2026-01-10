// frontend/src/pages/Risks.js
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Search, Filter, Edit, Trash2, Eye, X, Save } from 'lucide-react';
import apiService from '../services/api';

function Risks() {
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [editMode, setEditMode] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    severity: '',
    project_id: ''
  });

  // Form data for create/edit
  const [formData, setFormData] = useState({
    project_id: 1, // Default to first project
    risk_number: '',
    title: '',
    description: '',
    probability: 'Medium',
    impact: 'Medium',
    status: 'Identified',
    category: '',
    identified_by: 1,
    owner: 1,
    identified_date: new Date().toISOString().split('T')[0],
    mitigation_strategy: '',
    contingency_plan: ''
  });

  useEffect(() => {
    fetchRisks();
  }, [filters]);

  const fetchRisks = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.project_id) params.append('project_id', filters.project_id);
      
      const response = await apiService.getRisks(params.toString());
      setRisks(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching risks:', err);
      setError('Failed to load risks');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRisk = async (e) => {
    e.preventDefault();
    try {
      // Generate risk number if not provided
      const riskData = {
        ...formData,
        risk_number: formData.risk_number || `RISK-${Date.now()}`
      };
      
      await apiService.createRisk(riskData);
      setShowCreateModal(false);
      resetForm();
      fetchRisks();
    } catch (err) {
      console.error('Error creating risk:', err);
      alert('Failed to create risk: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleUpdateRisk = async (e) => {
    e.preventDefault();
    try {
      await apiService.updateRisk(selectedRisk.risk_id, formData);
      setShowDetailsModal(false);
      setEditMode(false);
      resetForm();
      fetchRisks();
    } catch (err) {
      console.error('Error updating risk:', err);
      alert('Failed to update risk: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteRisk = async (riskId) => {
    if (!window.confirm('Are you sure you want to delete this risk?')) return;
    
    try {
      await apiService.deleteRisk(riskId);
      setShowDetailsModal(false);
      fetchRisks();
    } catch (err) {
      console.error('Error deleting risk:', err);
      alert('Failed to delete risk');
    }
  };

  const viewRiskDetails = async (risk) => {
    try {
      const response = await apiService.getRiskById(risk.risk_id);
      setSelectedRisk(response.data);
      setShowDetailsModal(true);
    } catch (err) {
      console.error('Error fetching risk details:', err);
      alert('Failed to load risk details');
    }
  };

  const startEdit = () => {
    setFormData({
      project_id: selectedRisk.project_id,
      risk_number: selectedRisk.risk_number,
      title: selectedRisk.title,
      description: selectedRisk.description || '',
      probability: selectedRisk.probability,
      impact: selectedRisk.impact,
      status: selectedRisk.status,
      category: selectedRisk.category || '',
      identified_by: selectedRisk.identified_by,
      owner: selectedRisk.owner,
      identified_date: selectedRisk.identified_date,
      mitigation_strategy: selectedRisk.mitigation_strategy || '',
      contingency_plan: selectedRisk.contingency_plan || ''
    });
    setEditMode(true);
  };

  const resetForm = () => {
    setFormData({
      project_id: 1,
      risk_number: '',
      title: '',
      description: '',
      probability: 'Medium',
      impact: 'Medium',
      status: 'Identified',
      category: '',
      identified_by: 1,
      owner: 1,
      identified_date: new Date().toISOString().split('T')[0],
      mitigation_strategy: '',
      contingency_plan: ''
    });
  };

  const getRiskScoreColor = (score) => {
    if (score >= 16) return 'text-red-600 bg-red-100';
    if (score >= 12) return 'text-orange-600 bg-orange-100';
    if (score >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Identified': 'bg-gray-100 text-gray-800',
      'Assessed': 'bg-blue-100 text-blue-800',
      'Mitigated': 'bg-green-100 text-green-800',
      'Closed': 'bg-slate-100 text-slate-600',
      'Occurred': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading && risks.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading risks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="text-orange-600" />
              Risk Management
            </h1>
            <p className="text-gray-600 mt-1">Identify, assess, and mitigate project risks</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Risk
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search risks..."
                className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">All Statuses</option>
              <option value="Identified">Identified</option>
              <option value="Assessed">Assessed</option>
              <option value="Mitigated">Mitigated</option>
              <option value="Closed">Closed</option>
              <option value="Occurred">Occurred</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Risk Score</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={filters.severity}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
            >
              <option value="">All Levels</option>
              <option value="critical">Critical (16-25)</option>
              <option value="high">High (12-15)</option>
              <option value="medium">Medium (6-11)</option>
              <option value="low">Low (1-5)</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => setFilters({ search: '', status: '', severity: '', project_id: '' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{risks.length}</p>
          <p className="text-sm text-gray-600">Total Risks</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-red-600">
            {risks.filter(r => r.risk_score >= 16).length}
          </p>
          <p className="text-sm text-gray-600">Critical</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">
            {risks.filter(r => r.risk_score >= 12 && r.risk_score < 16).length}
          </p>
          <p className="text-sm text-gray-600">High</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {risks.filter(r => r.status === 'Mitigated').length}
          </p>
          <p className="text-sm text-gray-600">Mitigated</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-600">
            {risks.filter(r => r.status === 'Closed').length}
          </p>
          <p className="text-sm text-gray-600">Closed</p>
        </div>
      </div>

      {/* Risks Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Title
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Risk Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Probability
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Impact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {risks.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-12 text-center">
                  <AlertTriangle className="mx-auto h-12 w-12 text-gray-400" />
                  <p className="mt-2 text-gray-500">No risks found</p>
                  <p className="text-sm text-gray-400">Create your first risk to get started</p>
                </td>
              </tr>
            ) : (
              risks.map((risk) => (
                <tr key={risk.risk_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">{risk.risk_number}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{risk.title}</div>
                    {risk.category && (
                      <div className="text-sm text-gray-500">{risk.category}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 inline-flex text-sm font-semibold rounded-full ${getRiskScoreColor(risk.risk_score)}`}>
                      {risk.risk_score}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {risk.probability}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {risk.impact}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(risk.status)}`}>
                      {risk.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => viewRiskDetails(risk)}
                      className="text-orange-600 hover:text-orange-900 mr-3"
                      title="View Details"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Risk Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Create New Risk</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleCreateRisk} className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Risk Number
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={formData.risk_number}
                      onChange={(e) => setFormData({ ...formData, risk_number: e.target.value })}
                      placeholder="Auto-generated if empty"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      placeholder="e.g., Technical, Budget, Schedule"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Brief description of the risk"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detailed description of the risk..."
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Probability <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={formData.probability}
                      onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                    >
                      <option value="Very Low">Very Low</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Very High">Very High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Impact <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={formData.impact}
                      onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                    >
                      <option value="Very Low">Very Low</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Very High">Very High</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="Identified">Identified</option>
                      <option value="Assessed">Assessed</option>
                      <option value="Mitigated">Mitigated</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mitigation Strategy
                  </label>
                  <textarea
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={formData.mitigation_strategy}
                    onChange={(e) => setFormData({ ...formData, mitigation_strategy: e.target.value })}
                    placeholder="How will this risk be prevented or reduced?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contingency Plan
                  </label>
                  <textarea
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={formData.contingency_plan}
                    onChange={(e) => setFormData({ ...formData, contingency_plan: e.target.value })}
                    placeholder="What will be done if this risk occurs?"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Identified Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    value={formData.identified_date}
                    onChange={(e) => setFormData({ ...formData, identified_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Create Risk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View/Edit Risk Details Modal */}
      {showDetailsModal && selectedRisk && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedRisk.risk_number}</h2>
                  <p className="text-gray-600 mt-1">{selectedRisk.title}</p>
                </div>
                <div className="flex gap-2">
                  {!editMode && (
                    <>
                      <button
                        onClick={startEdit}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRisk(selectedRisk.risk_id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => {
                      setShowDetailsModal(false);
                      setEditMode(false);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {editMode ? (
              <form onSubmit={handleUpdateRisk} className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <input
                      type="text"
                      required
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      rows="3"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Probability</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        value={formData.probability}
                        onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                      >
                        <option value="Very Low">Very Low</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Very High">Very High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Impact</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        value={formData.impact}
                        onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                      >
                        <option value="Very Low">Very Low</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Very High">Very High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="Identified">Identified</option>
                        <option value="Assessed">Assessed</option>
                        <option value="Mitigated">Mitigated</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Mitigation Strategy</label>
                    <textarea
                      rows="3"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={formData.mitigation_strategy}
                      onChange={(e) => setFormData({ ...formData, mitigation_strategy: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Contingency Plan</label>
                    <textarea
                      rows="3"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                      value={formData.contingency_plan}
                      onChange={(e) => setFormData({ ...formData, contingency_plan: e.target.value })}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setEditMode(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
              </form>
            ) : (
              <div className="p-6 space-y-6">
                {/* Risk Score Card */}
                <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Risk Score</p>
                      <p className={`text-4xl font-bold mt-2 ${getRiskScoreColor(selectedRisk.risk_score).split(' ')[0]}`}>
                        {selectedRisk.risk_score}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {selectedRisk.probability} probability × {selectedRisk.impact} impact
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`px-4 py-2 inline-flex text-sm font-semibold rounded-full ${getStatusColor(selectedRisk.status)}`}>
                        {selectedRisk.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Description</h3>
                    <p className="text-gray-900">{selectedRisk.description || 'No description provided'}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Category</h3>
                    <p className="text-gray-900">{selectedRisk.category || 'Not specified'}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Mitigation Strategy</h3>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {selectedRisk.mitigation_strategy || 'No mitigation strategy defined'}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Contingency Plan</h3>
                  <p className="text-gray-900 whitespace-pre-wrap">
                    {selectedRisk.contingency_plan || 'No contingency plan defined'}
                  </p>
                </div>

                {/* Actions */}
                {selectedRisk.actions && selectedRisk.actions.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Mitigation Actions</h3>
                    <div className="space-y-2">
                      {selectedRisk.actions.map((action) => (
                        <div key={action.action_id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{action.action_description}</p>
                              {action.assigned_to_name && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Assigned to: {action.assigned_to_name}
                                </p>
                              )}
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              action.status === 'Completed' ? 'bg-green-100 text-green-800' :
                              action.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {action.status}
                            </span>
                          </div>
                          {action.due_date && (
                            <p className="text-sm text-gray-500 mt-2">
                              Due: {new Date(action.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Activity Log */}
                {selectedRisk.log && selectedRisk.log.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Activity Log</h3>
                    <div className="space-y-3">
                      {selectedRisk.log.slice(0, 5).map((entry) => (
                        <div key={entry.log_id} className="border-l-2 border-gray-300 pl-4">
                          <p className="text-sm font-medium text-gray-900">{entry.log_type}</p>
                          <p className="text-sm text-gray-600">{entry.comments}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(entry.log_date).toLocaleString()} by {entry.logged_by_name || 'System'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default Risks;
