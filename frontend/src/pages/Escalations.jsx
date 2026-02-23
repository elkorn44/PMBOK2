import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, X, Eye, Edit, Trash2, Check, AlertTriangle } from 'lucide-react';
import apiService from '../services/api';
import { useProject } from '../context/ProjectContext';
import { formatDate, formatDateTime, getTodayForInput } from '../utils/dateFormat';

function Escalations() {
  const { selectedProject, getSelectedProjectName } = useProject();
  
  const [escalations, setEscalations] = useState([]);
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
  const [severityFilter, setSeverityFilter] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedEscalation, setSelectedEscalation] = useState(null);

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

  // Fetch escalations
  const fetchEscalations = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter) filters.status = statusFilter;
      if (severityFilter) filters.severity = severityFilter;
      if (selectedProject) filters.project_id = selectedProject;
      
      const response = await apiService.getEscalations(filters);
      setEscalations(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching escalations:', err);
      setError('Failed to load escalations');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, severityFilter, selectedProject]);

  useEffect(() => {
    fetchEscalations();
  }, [fetchEscalations]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchEscalations();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchEscalations]);

  // View escalation details
  const viewEscalationDetails = async (escalationId) => {
    try {
      const response = await apiService.getEscalationById(escalationId);
      setSelectedEscalation(response.data);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Error loading escalation details:', err);
      alert('Failed to load escalation details');
    }
  };

  // Delete escalation
  const deleteEscalation = async (escalationId) => {
    if (!window.confirm('Are you sure you want to delete this escalation? This will also delete all associated actions and log entries.')) {
      return;
    }
    
    try {
      await apiService.deleteEscalation(escalationId);
      setShowDetailModal(false);
      setSelectedEscalation(null);
      await fetchEscalations();
      alert('Escalation deleted successfully');
    } catch (err) {
      console.error('Error deleting escalation:', err);
      alert('Failed to delete escalation');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'Low': 'bg-gray-100 text-gray-800 border-gray-200',
      'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'High': 'bg-orange-100 text-orange-800 border-orange-200',
      'Critical': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Raised': 'bg-red-100 text-red-800 border-red-200',
      'Under Review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Resolved': 'bg-green-100 text-green-800 border-green-200',
      'Closed': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Escalation Management</h1>
          <p className="mt-2 text-gray-600">Track and manage project escalations</p>
          {selectedProject && (
            <p className="text-sm text-gray-600 mt-1">
              Project: <span className="font-semibold text-gray-900">{getSelectedProjectName()}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
        >
          <Plus className="w-5 h-5" />
          Create Escalation
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
                placeholder="Search escalations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Statuses</option>
            <option value="Raised">Raised</option>
            <option value="Under Review">Under Review</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Severities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{escalations.length}</p>
          <p className="text-sm text-gray-600">Total</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-red-600">
            {escalations.filter(e => e.status === 'Raised').length}
          </p>
          <p className="text-sm text-gray-600">Raised</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {escalations.filter(e => e.status === 'Under Review').length}
          </p>
          <p className="text-sm text-gray-600">Under Review</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {escalations.filter(e => e.status === 'Resolved').length}
          </p>
          <p className="text-sm text-gray-600">Resolved</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-600">
            {escalations.filter(e => e.status === 'Closed').length}
          </p>
          <p className="text-sm text-gray-600">Closed</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="text-gray-600 mt-4">Loading escalations...</p>
        </div>
      )}

      {/* Escalations Table */}
      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Escalation</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Raised</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {escalations.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || statusFilter || severityFilter || selectedProject
                      ? 'No escalations match your filters'
                      : 'No escalations found. Create your first escalation!'}
                  </td>
                </tr>
              ) : (
                escalations.map((escalation) => (
                  <tr key={escalation.escalation_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => viewEscalationDetails(escalation.escalation_id)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{escalation.title}</div>
                          <div className="text-sm text-gray-500">{escalation.escalation_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{escalation.escalation_type || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getSeverityColor(escalation.severity)}`}>
                        {escalation.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(escalation.status)}`}>
                        {escalation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(escalation.raised_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewEscalationDetails(escalation.escalation_id);
                        }}
                        className="text-red-600 hover:text-red-900"
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
      <CreateEscalationModal
        show={showCreateModal}
        people={people}
        projects={projects}
        selectedProject={selectedProject}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchEscalations();
        }}
      />

      {showDetailModal && selectedEscalation && (
        <EscalationDetailModal
          escalation={selectedEscalation}
          people={people}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedEscalation(null);
          }}
          onDelete={deleteEscalation}
          onRefresh={() => viewEscalationDetails(selectedEscalation.escalation_id)}
        />
      )}
    </div>
  );
}

// Create Escalation Modal - ALL FIELDS INCLUDED
function CreateEscalationModal({ show, people, projects, selectedProject, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    escalation_number: `ESC-${Date.now()}`,
    title: '',
    description: '',
    severity: 'Medium',
    status: 'Raised',
    escalation_type: '',
    raised_by: '',
    escalated_to: '',
    raised_date: getTodayForInput(), // Mandatory default
    target_response_date: '',
    actual_response_date: '',
    resolution_summary: '',
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
      // Date handling: empty strings → null, raised_date → today
      const payload = {
        ...formData,
        raised_by: formData.raised_by ? parseInt(formData.raised_by) : null,
        escalated_to: formData.escalated_to ? parseInt(formData.escalated_to) : null,
        project_id: formData.project_id ? parseInt(formData.project_id) : null,
        raised_date: formData.raised_date || getTodayForInput(), // Ensure mandatory default
        target_response_date: formData.target_response_date || null,
        actual_response_date: formData.actual_response_date || null
      };
      
      await apiService.createEscalation(payload);
      onSuccess();
      
      // Reset form
      setFormData({
        escalation_number: `ESC-${Date.now()}`,
        title: '',
        description: '',
        severity: 'Medium',
        status: 'Raised',
        escalation_type: '',
        raised_by: '',
        escalated_to: '',
        raised_date: getTodayForInput(),
        target_response_date: '',
        actual_response_date: '',
        resolution_summary: '',
        project_id: selectedProject || (projects.length === 1 ? projects[0].project_id : '')
      });
    } catch (err) {
      console.error('Error creating escalation:', err);
      alert('Failed to create escalation: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Create Escalation</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Escalation Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Escalation Number</label>
            <input
              type="text"
              value={formData.escalation_number}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              rows="3"
            />
          </div>

          {/* Escalation Type & Severity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Escalation Type</label>
              <input
                type="text"
                value={formData.escalation_type}
                onChange={(e) => setFormData({ ...formData, escalation_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="e.g., Resource, Budget, Schedule"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity *</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                required
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Raised By & Escalated To */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Raised By *</label>
              <select
                value={formData.raised_by}
                onChange={(e) => setFormData({ ...formData, raised_by: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                required
              >
                <option value="">Select person...</option>
                {people.map(person => (
                  <option key={person.person_id} value={person.person_id}>{person.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Escalated To</label>
              <select
                value={formData.escalated_to}
                onChange={(e) => setFormData({ ...formData, escalated_to: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select person...</option>
                {people.map(person => (
                  <option key={person.person_id} value={person.person_id}>{person.full_name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Raised Date *</label>
              <input
                type="date"
                value={formData.raised_date}
                onChange={(e) => setFormData({ ...formData, raised_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Response Date</label>
              <input
                type="date"
                value={formData.target_response_date}
                onChange={(e) => setFormData({ ...formData, target_response_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          {/* Resolution Summary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Summary</label>
            <textarea
              value={formData.resolution_summary}
              onChange={(e) => setFormData({ ...formData, resolution_summary: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              rows="3"
              placeholder="Document resolution details..."
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
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Escalation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Escalation Detail Modal with Actions & Audit Trail
function EscalationDetailModal({ escalation, people, onClose, onDelete, onRefresh }) {
  const [editMode, setEditMode] = useState(false);
  const [actions, setActions] = useState([]);
  const [log, setLog] = useState([]);
  const [loadingActions, setLoadingActions] = useState(false);
  const [loadingLog, setLoadingLog] = useState(false);
  
  // Edit form state (ALL FIELDS)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'Medium',
    status: 'Raised',
    escalation_type: '',
    raised_by: '',
    escalated_to: '',
    raised_date: '',
    target_response_date: '',
    actual_response_date: '',
    resolution_summary: '',
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

  // Initialize form data from escalation
  useEffect(() => {
    if (escalation) {
      setFormData({
        title: escalation.title || '',
        description: escalation.description || '',
        severity: escalation.severity || 'Medium',
        status: escalation.status || 'Raised',
        escalation_type: escalation.escalation_type || '',
        raised_by: escalation.raised_by || '',
        escalated_to: escalation.escalated_to || '',
        raised_date: escalation.raised_date || '',
        target_response_date: escalation.target_response_date || '',
        actual_response_date: escalation.actual_response_date || '',
        resolution_summary: escalation.resolution_summary || '',
        project_id: escalation.project_id || ''
      });
    }
  }, [escalation]);

  // Fetch actions
  const fetchActions = async () => {
    try {
      setLoadingActions(true);
      const response = await apiService.getEscalationActions(escalation.escalation_id);
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
      const response = await apiService.getEscalationLog(escalation.escalation_id);
      setLog(response.data || []);
    } catch (err) {
      console.error('Error fetching log:', err);
    } finally {
      setLoadingLog(false);
    }
  };

  useEffect(() => {
    if (escalation) {
      fetchActions();
      fetchLog();
    }
  }, [escalation]);

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
      // Date handling: empty strings → null, raised_date → today
      const payload = {
        ...formData,
        raised_by: formData.raised_by ? parseInt(formData.raised_by) : null,
        escalated_to: formData.escalated_to ? parseInt(formData.escalated_to) : null,
        project_id: formData.project_id ? parseInt(formData.project_id) : null,
        raised_date: formData.raised_date || getTodayForInput(),
        target_response_date: formData.target_response_date || null,
        actual_response_date: formData.actual_response_date || null
      };
      
      await apiService.updateEscalation(escalation.escalation_id, payload);
      setEditMode(false);
      await onRefresh();
      alert('Escalation updated successfully');
    } catch (err) {
      console.error('Error updating escalation:', err);
      alert('Failed to update escalation: ' + (err.response?.data?.message || err.message));
    }
  };

  // Quick status update
  const handleQuickStatusUpdate = async (newStatus) => {
    try {
      await apiService.updateEscalation(escalation.escalation_id, {
        status: newStatus,
        status_comment: `Status changed to ${newStatus}`
      });
      await onRefresh();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
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
      await apiService.createEscalationAction(escalation.escalation_id, {
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
      await apiService.updateEscalationAction(escalation.escalation_id, actionId, {
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
      await apiService.deleteEscalationAction(escalation.escalation_id, actionId);
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

  const getSeverityColor = (severity) => {
    const colors = {
      'Low': 'bg-gray-100 text-gray-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-orange-100 text-orange-800',
      'Critical': 'bg-red-100 text-red-800'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Raised': 'bg-red-100 text-red-800',
      'Under Review': 'bg-yellow-100 text-yellow-800',
      'Resolved': 'bg-green-100 text-green-800',
      'Closed': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Sticky Header with Icons - justify-between */}
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Escalation Details</h2>
          <div className="flex items-center gap-2">
            {/* Remote Submit - Checkmark Icon */}
            {editMode && (
              <button
                type="submit"
                form="editEscalationForm"
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
                title="Edit Escalation"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
            {/* Delete Icon */}
            <button
              onClick={() => onDelete(escalation.escalation_id)}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
              title="Delete Escalation"
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
        <form id="editEscalationForm" onSubmit={handleEditSubmit} className="p-6 space-y-6">
          {/* Header Info */}
          <div className="border-b pb-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-600 mt-1" />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">{escalation.title}</h3>
                <p className="text-gray-500 mt-1">{escalation.escalation_number}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(escalation.status)}`}>
                {escalation.status}
              </span>
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getSeverityColor(escalation.severity)}`}>
                {escalation.severity}
              </span>
            </div>
          </div>

          {/* Quick Status Update (when not editing) */}
          {!editMode && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Status Update</h4>
              <div className="flex flex-wrap gap-2">
                {['Raised', 'Under Review', 'Resolved', 'Closed'].map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleQuickStatusUpdate(status)}
                    disabled={escalation.status === status}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                      ${escalation.status === status 
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Escalation Details - ALL FIELDS */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Escalation Details</h4>
            
            {editMode ? (
              <>
                {/* Editable Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    rows="3"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Escalation Type</label>
                    <input
                      type="text"
                      value={formData.escalation_type}
                      onChange={(e) => setFormData({ ...formData, escalation_type: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Raised By</label>
                    <select
                      value={formData.raised_by}
                      onChange={(e) => setFormData({ ...formData, raised_by: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select person...</option>
                      {people.map(person => (
                        <option key={person.person_id} value={person.person_id}>{person.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Escalated To</label>
                    <select
                      value={formData.escalated_to}
                      onChange={(e) => setFormData({ ...formData, escalated_to: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select person...</option>
                      {people.map(person => (
                        <option key={person.person_id} value={person.person_id}>{person.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Raised Date</label>
                    <input
                      type="date"
                      value={formData.raised_date}
                      onChange={(e) => setFormData({ ...formData, raised_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Target Response Date</label>
                    <input
                      type="date"
                      value={formData.target_response_date}
                      onChange={(e) => setFormData({ ...formData, target_response_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Actual Response Date</label>
                    <input
                      type="date"
                      value={formData.actual_response_date}
                      onChange={(e) => setFormData({ ...formData, actual_response_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Resolution Summary</label>
                  <textarea
                    value={formData.resolution_summary}
                    onChange={(e) => setFormData({ ...formData, resolution_summary: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    rows="3"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Read-only Display - ALL FIELDS */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Escalation Type</label>
                    <p className="mt-1 text-gray-900">{escalation.escalation_type || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Raised By</label>
                    <p className="mt-1 text-gray-900">{getPersonName(escalation.raised_by)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Escalated To</label>
                    <p className="mt-1 text-gray-900">{getPersonName(escalation.escalated_to)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Raised Date</label>
                    <p className="mt-1 text-gray-900">{formatDate(escalation.raised_date)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {escalation.target_response_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Target Response Date</label>
                      <p className="mt-1 text-gray-900">{formatDate(escalation.target_response_date)}</p>
                    </div>
                  )}
                  {escalation.actual_response_date && (
                    <div>
                      <label className="text-sm font-medium text-gray-700">Actual Response Date</label>
                      <p className="mt-1 text-gray-900">{formatDate(escalation.actual_response_date)}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{escalation.description || 'No description'}</p>
                </div>

                {escalation.resolution_summary && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Resolution Summary</label>
                    <p className="mt-1 text-gray-900 whitespace-pre-wrap">{escalation.resolution_summary}</p>
                  </div>
                )}
              </>
            )}
          </div>
        </form>

        {/* ESCALATION ACTIONS SECTION */}
        <div className="border-t pt-6 px-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Escalation Actions</h4>
            {!showAddAction && !editingActionId && !editMode && (
              <button
                onClick={() => setShowAddAction(true)}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Action
              </button>
            )}
          </div>

          {/* Add Action Form */}
          {showAddAction && (
            <form onSubmit={handleAddAction} className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h5 className="font-semibold text-gray-900 mb-3">New Action</h5>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action Description *</label>
                  <textarea
                    value={actionFormData.action_description}
                    onChange={(e) => setActionFormData({ ...actionFormData, action_description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                      placeholder="e.g., Investigation, Communication"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                    <select
                      value={actionFormData.assigned_to}
                      onChange={(e) => setActionFormData({ ...actionFormData, assigned_to: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={actionFormData.priority}
                      onChange={(e) => setActionFormData({ ...actionFormData, priority: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
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
                    className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                          <select
                            value={actionFormData.assigned_to}
                            onChange={(e) => setActionFormData({ ...actionFormData, assigned_to: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                          <select
                            value={actionFormData.priority}
                            onChange={(e) => setActionFormData({ ...actionFormData, priority: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
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
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
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
        <div className="border-t pt-6 px-6 pb-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Audit Trail</h4>
          
          {loadingLog ? (
            <p className="text-center text-gray-500 py-4">Loading audit trail...</p>
          ) : log.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No activity recorded yet.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {log.map((entry) => (
                <div key={entry.log_id} className="border-l-4 border-red-400 bg-gray-50 p-3 rounded">
                  <div className="flex items-start gap-2 text-sm">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 text-gray-600 mb-1">
                        <span className="font-medium">{getPersonName(entry.logged_by)}</span>
                        <span>•</span>
                        <span>{formatDateTime(entry.log_date)}</span>
                        {entry.log_type && (
                          <>
                            <span>•</span>
                            <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded text-xs font-medium">
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

export default Escalations;
