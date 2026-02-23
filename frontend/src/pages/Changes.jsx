import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, X, Eye, Edit, Trash2, Check, Clock, CheckCircle, XCircle, FileText, AlertCircle } from 'lucide-react';
import apiService from '../services/api';
import { useProject } from '../context/ProjectContext';
import { formatDate, formatDateTime, getTodayForInput } from '../utils/dateFormat';

function Changes() {
  const { selectedProject, getSelectedProjectName } = useProject();
  
  const [changes, setChanges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [people, setPeople] = useState([]);
  const [projects, setProjects] = useState([]);
  
  // Performance: useRef latches to prevent duplicate fetches
  const fetchedPeople = useRef(false);
  const fetchedProjects = useRef(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedChange, setSelectedChange] = useState(null);

  // Fetch people with race condition guard
  useEffect(() => {
    if (fetchedPeople.current) return;
    
    const fetchPeople = async () => {
      try {
        const response = await apiService.getPeople();
        setPeople(response.data || []);
        fetchedPeople.current = true;
      } catch (err) {
        console.error('Error fetching people:', err);
      }
    };
    fetchPeople();
  }, []);

  // Fetch projects with race condition guard
  useEffect(() => {
    if (fetchedProjects.current) return;
    
    const fetchProjects = async () => {
      try {
        const response = await apiService.getProjects();
        setProjects(response.data || []);
        fetchedProjects.current = true;
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
    };
    fetchProjects();
  }, []);

  // Fetch changes
  const fetchChanges = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter) filters.status = statusFilter;
      if (typeFilter) filters.change_type = typeFilter;
      if (priorityFilter) filters.priority = priorityFilter;
      if (selectedProject) filters.project_id = selectedProject;
      
      const response = await apiService.getChanges(filters);
      setChanges(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching changes:', err);
      setError('Failed to load changes');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, typeFilter, priorityFilter, selectedProject]);

  useEffect(() => {
    fetchChanges();
  }, [fetchChanges]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchChanges();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchChanges]);

  // View change details
  const viewChangeDetails = async (changeId) => {
    try {
      const response = await apiService.getChangeById(changeId);
      setSelectedChange(response.data);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Error loading change details:', err);
      alert('Failed to load change details');
    }
  };

  // Delete change
  const deleteChange = async (changeId) => {
    if (!window.confirm('Are you sure you want to delete this change? This will also delete all associated actions and log entries.')) {
      return;
    }
    
    try {
      await apiService.deleteChange(changeId);
      setShowDetailModal(false);
      setSelectedChange(null);
      await fetchChanges();
      alert('Change deleted successfully');
    } catch (err) {
      console.error('Error deleting change:', err);
      alert('Failed to delete change');
    }
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'bg-gray-100 text-gray-800 border-gray-200',
      'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'High': 'bg-orange-100 text-orange-800 border-orange-200',
      'Critical': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Requested': 'bg-blue-100 text-blue-800 border-blue-200',
      'Under Review': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Approved': 'bg-green-100 text-green-800 border-green-200',
      'Rejected': 'bg-red-100 text-red-800 border-red-200',
      'Implemented': 'bg-purple-100 text-purple-800 border-purple-200',
      'Closed': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Change Management</h1>
          <p className="mt-2 text-gray-600">Track and manage project changes with dual approval workflow</p>
          {selectedProject && (
            <p className="text-sm text-gray-600 mt-1">
              Project: <span className="font-semibold text-gray-900">{getSelectedProjectName()}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Create Change
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search changes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="Requested">Requested</option>
            <option value="Under Review">Under Review</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Implemented">Implemented</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="Scope">Scope</option>
            <option value="Schedule">Schedule</option>
            <option value="Cost">Cost</option>
            <option value="Quality">Quality</option>
            <option value="Resource">Resource</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{changes.length}</p>
          <p className="text-sm text-gray-600">Total</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {changes.filter(c => c.status === 'Requested').length}
          </p>
          <p className="text-sm text-gray-600">Requested</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">
            {changes.filter(c => c.status === 'Under Review').length}
          </p>
          <p className="text-sm text-gray-600">Under Review</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {changes.filter(c => c.status === 'Approved').length}
          </p>
          <p className="text-sm text-gray-600">Approved</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-purple-600">
            {changes.filter(c => c.status === 'Implemented').length}
          </p>
          <p className="text-sm text-gray-600">Implemented</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-600">
            {changes.filter(c => c.status === 'Closed').length}
          </p>
          <p className="text-sm text-gray-600">Closed</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Loading changes...</p>
        </div>
      )}

      {/* Changes Table */}
      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Change</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {changes.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || statusFilter || typeFilter || priorityFilter || selectedProject
                      ? 'No changes match your filters'
                      : 'No changes found. Create your first change request!'}
                  </td>
                </tr>
              ) : (
                changes.map((change) => (
                  <tr key={change.change_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => viewChangeDetails(change.change_id)}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{change.title}</div>
                      <div className="text-sm text-gray-500">{change.change_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{change.change_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getPriorityColor(change.priority)}`}>
                        {change.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(change.status)}`}>
                        {change.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(change.request_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewChangeDetails(change.change_id);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="View Details"
                      >
                        <Eye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modals */}
      <CreateChangeModal
        show={showCreateModal}
        people={people}
        projects={projects}
        selectedProject={selectedProject}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchChanges();
        }}
      />

      {showDetailModal && selectedChange && (
        <ChangeDetailModal
          change={selectedChange}
          people={people}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedChange(null);
          }}
          onDelete={deleteChange}
          onRefresh={() => viewChangeDetails(selectedChange.change_id)}
        />
      )}
    </div>
  );
}

// Create Change Modal - ALL FIELDS INCLUDED
function CreateChangeModal({ show, people, projects, selectedProject, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    change_number: `CHG-${Date.now()}`,
    title: '',
    description: '',
    change_type: 'Other',
    priority: 'Medium',
    status: 'Requested',
    requested_by: '',
    request_date: getTodayForInput(), // Mandatory default
    cost_impact: '',
    schedule_impact_days: '',
    justification: '',
    impact_assessment: '',
    project_id: selectedProject || ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      project_id: selectedProject || prev.project_id
    }));
  }, [selectedProject]);

  useEffect(() => {
    if (projects.length === 1 && !formData.project_id) {
      setFormData(prev => ({ ...prev, project_id: projects[0].project_id }));
    }
  }, [projects, formData.project_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Date handling: empty strings → null
      const payload = {
        ...formData,
        requested_by: formData.requested_by ? parseInt(formData.requested_by) : null,
        project_id: formData.project_id ? parseInt(formData.project_id) : null,
        cost_impact: formData.cost_impact ? parseFloat(formData.cost_impact) : null,
        schedule_impact_days: formData.schedule_impact_days ? parseInt(formData.schedule_impact_days) : null,
        request_date: formData.request_date || getTodayForInput() // Ensure mandatory default
      };
      
      await apiService.createChange(payload);
      onSuccess();
      
      // Reset form
      setFormData({
        change_number: `CHG-${Date.now()}`,
        title: '',
        description: '',
        change_type: 'Other',
        priority: 'Medium',
        status: 'Requested',
        requested_by: '',
        request_date: getTodayForInput(),
        cost_impact: '',
        schedule_impact_days: '',
        justification: '',
        impact_assessment: '',
        project_id: selectedProject || (projects.length === 1 ? projects[0].project_id : '')
      });
    } catch (err) {
      console.error('Error creating change:', err);
      alert('Failed to create change: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Create Change Request</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Change Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Change Number</label>
            <input
              type="text"
              value={formData.change_number}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              readOnly
            />
          </div>

          {/* Project */}
          {projects.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
              <select
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="" disabled>Select project...</option>
                {projects.map(project => (
                  <option key={project.project_id} value={project.project_id}>{project.project_name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
            />
          </div>

          {/* Change Type & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Change Type *</label>
              <select
                value={formData.change_type}
                onChange={(e) => setFormData({ ...formData, change_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Scope">Scope</option>
                <option value="Schedule">Schedule</option>
                <option value="Cost">Cost</option>
                <option value="Quality">Quality</option>
                <option value="Resource">Resource</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority *</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Requested By & Request Date */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Requested By *</label>
              <select
                value={formData.requested_by}
                onChange={(e) => setFormData({ ...formData, requested_by: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select person...</option>
                {people.map(person => (
                  <option key={person.person_id} value={person.person_id}>{person.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Request Date *</label>
              <input
                type="date"
                value={formData.request_date}
                onChange={(e) => setFormData({ ...formData, request_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Cost Impact & Schedule Impact */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost Impact ($)</label>
              <input
                type="number"
                step="0.01"
                value={formData.cost_impact}
                onChange={(e) => setFormData({ ...formData, cost_impact: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Impact (days)</label>
              <input
                type="number"
                value={formData.schedule_impact_days}
                onChange={(e) => setFormData({ ...formData, schedule_impact_days: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0"
              />
            </div>
          </div>

          {/* Justification */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Justification</label>
            <textarea
              value={formData.justification}
              onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Explain why this change is needed..."
            />
          </div>

          {/* Impact Assessment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Impact Assessment</label>
            <textarea
              value={formData.impact_assessment}
              onChange={(e) => setFormData({ ...formData, impact_assessment: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Describe the impact on project scope, schedule, cost, resources..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Change Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Change Detail Modal with Workflow & Actions
function ChangeDetailModal({ change, people, onClose, onDelete, onRefresh }) {
  const [editMode, setEditMode] = useState(false);
  const [actions, setActions] = useState([]);
  const [log, setLog] = useState([]);
  const [loadingActions, setLoadingActions] = useState(false);
  const [loadingLog, setLoadingLog] = useState(false);
  
  // Edit form state (ALL FIELDS)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    change_type: 'Other',
    priority: 'Medium',
    requested_by: '',
    request_date: '',
    cost_impact: '',
    schedule_impact_days: '',
    justification: '',
    impact_assessment: '',
    implementation_date: '',
    project_id: ''
  });

  // Add/Edit action state
  const [showAddAction, setShowAddAction] = useState(false);
  const [editingActionId, setEditingActionId] = useState(null);
  const [actionFormData, setActionFormData] = useState({
    action_description: '',
    action_type: '',
    assigned_to: '',
    created_by: 1,
    created_date: getTodayForInput(),
    due_date: '',
    status: 'Pending',
    priority: 'Medium',
    notes: ''
  });

  // Initialize form data from change
  useEffect(() => {
    if (change) {
      setFormData({
        title: change.title || '',
        description: change.description || '',
        change_type: change.change_type || 'Other',
        priority: change.priority || 'Medium',
        requested_by: change.requested_by || '',
        request_date: change.request_date || '',
        cost_impact: change.cost_impact || '',
        schedule_impact_days: change.schedule_impact_days || '',
        justification: change.justification || '',
        impact_assessment: change.impact_assessment || '',
        implementation_date: change.implementation_date || '',
        project_id: change.project_id || ''
      });
    }
  }, [change]);

  // Fetch actions
  const fetchActions = async () => {
    try {
      setLoadingActions(true);
      const response = await apiService.getChangeActions(change.change_id);
      setActions(response.data || []);
    } catch (err) {
      console.error('Error fetching actions:', err);
    } finally {
      setLoadingActions(false);
    }
  };

  // Fetch log
  const fetchLog = async () => {
    try {
      setLoadingLog(true);
      const response = await apiService.getChangeLog(change.change_id);
      setLog(response.data || []);
    } catch (err) {
      console.error('Error fetching log:', err);
    } finally {
      setLoadingLog(false);
    }
  };

  useEffect(() => {
    if (change) {
      fetchActions();
      fetchLog();
    }
  }, [change]);

  // Get person name
  const getPersonName = (personId) => {
    if (!personId) return 'Not assigned';
    const person = people.find(p => p.person_id === personId);
    return person ? person.full_name : 'Unknown';
  };

  // Handle edit form submit (Remote Submit)
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Date handling: empty strings → null
      const payload = {
        ...formData,
        requested_by: formData.requested_by ? parseInt(formData.requested_by) : null,
        project_id: formData.project_id ? parseInt(formData.project_id) : null,
        cost_impact: formData.cost_impact ? parseFloat(formData.cost_impact) : null,
        schedule_impact_days: formData.schedule_impact_days ? parseInt(formData.schedule_impact_days) : null,
        request_date: formData.request_date || null,
        implementation_date: formData.implementation_date || null
      };
      
      await apiService.updateChange(change.change_id, payload);
      setEditMode(false);
      await onRefresh();
      alert('Change updated successfully');
    } catch (err) {
      console.error('Error updating change:', err);
      alert('Failed to update change: ' + (err.response?.data?.message || err.message));
    }
  };

  // Workflow actions
  const handleRequestApproval = async () => {
    if (!window.confirm('Request approval for this change? This will move it to Under Review status.')) {
      return;
    }
    
    const justification = prompt('Enter approval justification:');
    if (!justification) return;
    
    try {
      await apiService.requestApproval(change.change_id, {
        requested_by: 1,
        approval_justification: justification
      });
      await onRefresh();
      alert('Change moved to Under Review');
    } catch (err) {
      console.error('Error requesting approval:', err);
      alert('Failed to request approval: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleApprove = async () => {
    if (!window.confirm('Approve this change? This will move it to Approved status.')) {
      return;
    }
    
    const comments = prompt('Enter approval comments:');
    if (!comments) return;
    
    try {
      await apiService.approveChange(change.change_id, {
        approved_by: 1,
        approval_comments: comments
      });
      await onRefresh();
      alert('Change approved');
    } catch (err) {
      console.error('Error approving change:', err);
      alert('Failed to approve change: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleReject = async () => {
    if (!window.confirm('Reject this change?')) {
      return;
    }
    
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    try {
      await apiService.rejectChange(change.change_id, {
        rejected_by: 1,
        rejection_reason: reason
      });
      await onRefresh();
      alert('Change rejected');
    } catch (err) {
      console.error('Error rejecting change:', err);
      alert('Failed to reject change: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleMarkImplemented = async () => {
    if (!window.confirm('Mark this change as Implemented?')) {
      return;
    }
    
    const comment = prompt('Enter implementation summary:');
    
    try {
      await apiService.updateChange(change.change_id, {
        status: 'Implemented',
        implementation_date: getTodayForInput(),
        status_comment: comment || 'Change implementation complete'
      });
      await onRefresh();
      alert('Change marked as Implemented');
    } catch (err) {
      console.error('Error marking as implemented:', err);
      alert('Failed to mark as implemented: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRequestClosure = async () => {
    if (!window.confirm('Request closure for this change?')) {
      return;
    }
    
    const justification = prompt('Enter closure justification:');
    if (!justification) return;
    
    try {
      await apiService.requestClosure(change.change_id, {
        requested_by: 1,
        closure_justification: justification
      });
      await onRefresh();
      alert('Closure request submitted');
    } catch (err) {
      console.error('Error requesting closure:', err);
      alert('Failed to request closure: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleApproveClosure = async () => {
    if (!window.confirm('Approve closure for this change? This will close it permanently.')) {
      return;
    }
    
    const comments = prompt('Enter closure approval comments:');
    if (!comments) return;
    
    try {
      await apiService.approveClosure(change.change_id, {
        approved_by: 1,
        approval_comments: comments
      });
      await onRefresh();
      alert('Change closed');
    } catch (err) {
      console.error('Error approving closure:', err);
      alert('Failed to approve closure: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleRejectClosure = async () => {
    if (!window.confirm('Reject closure request?')) {
      return;
    }
    
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    
    try {
      await apiService.rejectClosure(change.change_id, {
        rejected_by: 1,
        rejection_reason: reason
      });
      await onRefresh();
      alert('Closure request rejected');
    } catch (err) {
      console.error('Error rejecting closure:', err);
      alert('Failed to reject closure: ' + (err.response?.data?.message || err.message));
    }
  };

  // Action handlers
  const resetActionForm = () => {
    setActionFormData({
      action_description: '',
      action_type: '',
      assigned_to: '',
      created_by: 1,
      created_date: getTodayForInput(),
      due_date: '',
      status: 'Pending',
      priority: 'Medium',
      notes: ''
    });
    setShowAddAction(false);
    setEditingActionId(null);
  };

  const handleAddAction = async (e) => {
    e.preventDefault();
    try {
      await apiService.createChangeAction(change.change_id, {
        ...actionFormData,
        assigned_to: actionFormData.assigned_to ? parseInt(actionFormData.assigned_to) : null,
        due_date: actionFormData.due_date || null
      });
      await fetchActions();
      await fetchLog();
      resetActionForm();
    } catch (err) {
      console.error('Error adding action:', err);
      alert('Failed to add action');
    }
  };

  const startEditAction = (action) => {
    setEditingActionId(action.action_id);
    setActionFormData({
      action_description: action.action_description || '',
      action_type: action.action_type || '',
      assigned_to: action.assigned_to || '',
      created_by: action.created_by || 1,
      created_date: action.created_date || getTodayForInput(),
      due_date: action.due_date || '',
      status: action.status || 'Pending',
      priority: action.priority || 'Medium',
      notes: action.notes || ''
    });
    setShowAddAction(false);
  };

  const handleSaveAction = async (actionId) => {
    try {
      await apiService.updateChangeAction(change.change_id, actionId, {
        ...actionFormData,
        assigned_to: actionFormData.assigned_to ? parseInt(actionFormData.assigned_to) : null,
        due_date: actionFormData.due_date || null
      });
      await fetchActions();
      await fetchLog();
      resetActionForm();
    } catch (err) {
      console.error('Error updating action:', err);
      alert('Failed to update action');
    }
  };

  const handleDeleteAction = async (actionId) => {
    if (!window.confirm('Are you sure you want to delete this action?')) {
      return;
    }
    
    try {
      await apiService.deleteChangeAction(change.change_id, actionId);
      await fetchActions();
      await fetchLog();
    } catch (err) {
      console.error('Error deleting action:', err);
      alert('Failed to delete action');
    }
  };

  const getActionStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-gray-100 text-gray-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'bg-gray-100 text-gray-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-orange-100 text-orange-800',
      'Critical': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Requested': 'bg-blue-100 text-blue-800',
      'Under Review': 'bg-indigo-100 text-indigo-800',
      'Approved': 'bg-green-100 text-green-800',
      'Rejected': 'bg-red-100 text-red-800',
      'Implemented': 'bg-purple-100 text-purple-800',
      'Closed': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Sticky Header with Icons - justify-between */}
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Change Details</h2>
          <div className="flex items-center gap-2">
            {/* Remote Submit - Checkmark Icon */}
            {editMode && (
              <button
                type="submit"
                form="editChangeForm"
                className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg"
                title="Save Changes"
              >
                <Check className="w-5 h-5" />
              </button>
            )}
            {/* Edit Icon */}
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg"
                title="Edit Change"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
            {/* Delete Icon */}
            <button
              onClick={() => onDelete(change.change_id)}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
              title="Delete Change"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            {/* Close Icon */}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form wraps editable content for remote submit */}
        <form id="editChangeForm" onSubmit={handleEditSubmit} className="p-6 space-y-6">
          {/* Header Info */}
          <div className="border-b pb-4">
            <h3 className="text-2xl font-bold text-gray-900">{change.title}</h3>
            <p className="text-gray-500 mt-1">{change.change_number}</p>
            <div className="flex gap-2 mt-2">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(change.status)}`}>
                {change.status}
              </span>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getPriorityColor(change.priority)}`}>
                {change.priority}
              </span>
            </div>
          </div>

          {/* Change Details - ALL FIELDS */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Change Details</h4>
            
            {editMode ? (
              <>
                {/* Editable Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Change Type</label>
                    <select
                      value={formData.change_type}
                      onChange={(e) => setFormData({ ...formData, change_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Scope">Scope</option>
                      <option value="Schedule">Schedule</option>
                      <option value="Cost">Cost</option>
                      <option value="Quality">Quality</option>
                      <option value="Resource">Resource</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={formData.priority}
                      onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Requested By</label>
                    <select
                      value={formData.requested_by}
                      onChange={(e) => setFormData({ ...formData, requested_by: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select person...</option>
                      {people.map(person => (
                        <option key={person.person_id} value={person.person_id}>{person.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Request Date</label>
                    <input
                      type="date"
                      value={formData.request_date}
                      onChange={(e) => setFormData({ ...formData, request_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost Impact ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.cost_impact}
                      onChange={(e) => setFormData({ ...formData, cost_impact: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Impact (days)</label>
                    <input
                      type="number"
                      value={formData.schedule_impact_days}
                      onChange={(e) => setFormData({ ...formData, schedule_impact_days: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Justification</label>
                  <textarea
                    value={formData.justification}
                    onChange={(e) => setFormData({ ...formData, justification: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Impact Assessment</label>
                  <textarea
                    value={formData.impact_assessment}
                    onChange={(e) => setFormData({ ...formData, impact_assessment: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="3"
                  />
                </div>

                {change.status === 'Approved' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Implementation Date</label>
                    <input
                      type="date"
                      value={formData.implementation_date}
                      onChange={(e) => setFormData({ ...formData, implementation_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Read-only Display - ALL FIELDS */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Change Type</label>
                    <p className="mt-1 text-gray-900">{change.change_type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Requested By</label>
                    <p className="mt-1 text-gray-900">{getPersonName(change.requested_by)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Request Date</label>
                    <p className="mt-1 text-gray-900">{formatDate(change.request_date)}</p>
                  </div>
                  {change.approval_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Approval Date</label>
                      <p className="mt-1 text-gray-900">{formatDate(change.approval_date)}</p>
                    </div>
                  )}
                  {change.implementation_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Implementation Date</label>
                      <p className="mt-1 text-gray-900">{formatDate(change.implementation_date)}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{change.description || 'No description'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Cost Impact</label>
                    <p className="mt-1 text-gray-900">
                      {change.cost_impact ? `$${parseFloat(change.cost_impact).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : 'None'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Schedule Impact</label>
                    <p className="mt-1 text-gray-900">
                      {change.schedule_impact_days ? `${change.schedule_impact_days} days` : 'None'}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Justification</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{change.justification || 'Not provided'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Impact Assessment</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{change.impact_assessment || 'Not provided'}</p>
                </div>

                {change.approved_by && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Approved By</label>
                    <p className="mt-1 text-gray-900">{getPersonName(change.approved_by)}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Workflow Buttons - State Machine */}
          {!editMode && (
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Workflow Actions</h4>
              <div className="flex flex-wrap gap-3">
                {change.status === 'Requested' && (
                  <button
                    onClick={handleRequestApproval}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    <Clock className="w-4 h-4" />
                    Request Approval
                  </button>
                )}

                {change.status === 'Under Review' && (
                  <>
                    <button
                      onClick={handleApprove}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve
                    </button>
                    <button
                      onClick={handleReject}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </>
                )}

                {change.status === 'Approved' && (
                  <button
                    onClick={handleMarkImplemented}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Mark as Implemented
                  </button>
                )}

                {change.status === 'Implemented' && (
                  <>
                    <button
                      onClick={handleRequestClosure}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <FileText className="w-4 h-4" />
                      Request Closure
                    </button>
                    <button
                      onClick={handleApproveClosure}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve Closure
                    </button>
                    <button
                      onClick={handleRejectClosure}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Closure
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </form>

        {/* CHANGE ACTIONS SECTION */}
        <div className="border-t pt-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Change Actions</h4>
            {!showAddAction && !editingActionId && !editMode && (
              <button
                onClick={() => setShowAddAction(true)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Action
              </button>
            )}
          </div>

          {/* Add Action Form */}
          {showAddAction && (
            <form onSubmit={handleAddAction} className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h5 className="font-semibold text-gray-900 mb-3">New Action</h5>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action Description *</label>
                  <textarea
                    value={actionFormData.action_description}
                    onChange={(e) => setActionFormData({ ...actionFormData, action_description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="2"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                    <input
                      type="text"
                      value={actionFormData.action_type}
                      onChange={(e) => setActionFormData({ ...actionFormData, action_type: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Design, Development, Testing"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                    <select
                      value={actionFormData.assigned_to}
                      onChange={(e) => setActionFormData({ ...actionFormData, assigned_to: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Not assigned</option>
                      {people.map(person => (
                        <option key={person.person_id} value={person.person_id}>{person.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={actionFormData.due_date}
                      onChange={(e) => setActionFormData({ ...actionFormData, due_date: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={actionFormData.priority}
                      onChange={(e) => setActionFormData({ ...actionFormData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={actionFormData.status}
                    onChange={(e) => setActionFormData({ ...actionFormData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={actionFormData.notes}
                    onChange={(e) => setActionFormData({ ...actionFormData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows="2"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetActionForm}
                    className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    Add Action
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Actions List */}
          {loadingActions ? (
            <p className="text-center text-gray-500 py-4">Loading actions...</p>
          ) : actions.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No actions yet.</p>
          ) : (
            <div className="space-y-3">
              {actions.map((action) => (
                <div key={action.action_id} className="border border-gray-200 rounded-lg p-4 hover:border-gray-300">
                  {editingActionId === action.action_id ? (
                    // Edit mode
                    <form onSubmit={(e) => { e.preventDefault(); handleSaveAction(action.action_id); }} className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Action Description *</label>
                        <textarea
                          value={actionFormData.action_description}
                          onChange={(e) => setActionFormData({ ...actionFormData, action_description: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          rows="2"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
                          <input
                            type="text"
                            value={actionFormData.action_type}
                            onChange={(e) => setActionFormData({ ...actionFormData, action_type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                          <select
                            value={actionFormData.assigned_to}
                            onChange={(e) => setActionFormData({ ...actionFormData, assigned_to: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Not assigned</option>
                            {people.map(person => (
                              <option key={person.person_id} value={person.person_id}>{person.full_name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                          <input
                            type="date"
                            value={actionFormData.due_date}
                            onChange={(e) => setActionFormData({ ...actionFormData, due_date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                          <select
                            value={actionFormData.priority}
                            onChange={(e) => setActionFormData({ ...actionFormData, priority: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                        <select
                          value={actionFormData.status}
                          onChange={(e) => setActionFormData({ ...actionFormData, status: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                        <textarea
                          value={actionFormData.notes}
                          onChange={(e) => setActionFormData({ ...actionFormData, notes: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          rows="2"
                        />
                      </div>

                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={resetActionForm}
                          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                        >
                          <Check className="w-4 h-4 inline mr-1" />
                          Save
                        </button>
                      </div>
                    </form>
                  ) : (
                    // View mode
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{action.action_description}</p>
                          {action.action_type && (
                            <p className="text-sm text-gray-600 mt-1">Type: {action.action_type}</p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => startEditAction(action)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Edit Action"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAction(action.action_id)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Delete Action"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span className="text-gray-600">Assigned:</span>
                          <p className="font-medium text-gray-900">{getPersonName(action.assigned_to)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Due:</span>
                          <p className="font-medium text-gray-900">{action.due_date ? formatDate(action.due_date) : 'No due date'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <p><span className={`px-2 py-1 rounded-full text-xs font-medium ${getActionStatusColor(action.status)}`}>
                            {action.status}
                          </span></p>
                        </div>
                        <div>
                          <span className="text-gray-600">Priority:</span>
                          <p><span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(action.priority)}`}>
                            {action.priority}
                          </span></p>
                        </div>
                      </div>

                      {action.notes && (
                        <div className="mt-3 pt-3 border-t">
                          <span className="text-sm text-gray-600">Notes:</span>
                          <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{action.notes}</p>
                        </div>
                      )}

                      {action.completed_date && (
                        <div className="mt-2 text-sm text-gray-600">
                          Completed: {formatDate(action.completed_date)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AUDIT TRAIL - READ ONLY */}
        <div className="border-t pt-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Audit Trail</h4>
          
          {loadingLog ? (
            <p className="text-center text-gray-500 py-4">Loading audit trail...</p>
          ) : log.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No activity recorded yet.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {log.map((entry) => (
                <div key={entry.log_id} className="border-l-4 border-blue-400 bg-gray-50 p-3 rounded">
                  <div className="flex items-start gap-2 text-sm">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <span className="font-medium">{getPersonName(entry.logged_by)}</span>
                        <span>•</span>
                        <span>{formatDateTime(entry.log_date)}</span>
                        {entry.log_type && (
                          <>
                            <span>•</span>
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                              {entry.log_type}
                            </span>
                          </>
                        )}
                      </div>
                      
                      {entry.log_type === 'Status Change' && entry.previous_status && entry.new_status && (
                        <p className="text-gray-900">
                          Status changed from <span className="font-semibold">{entry.previous_status}</span> to <span className="font-semibold">{entry.new_status}</span>
                        </p>
                      )}
                      
                      {entry.comments && (
                        <p className="text-gray-900 whitespace-pre-wrap">{entry.comments}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Changes;
