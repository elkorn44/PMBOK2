import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Plus, Search, X, Eye, Edit, Trash2, Check, XCircle } from 'lucide-react';
import apiService from '../services/api';
import { useProject } from '../context/ProjectContext';
import { formatDate, formatDateTime, getTodayForInput } from '../utils/dateFormat';

// CAUTION: Always use (val === "" ? null : val) for dates to avoid SQL 500 errors.

function Faults() {
  const { selectedProject, getSelectedProjectName } = useProject();
  
  const [faults, setFaults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [people, setPeople] = useState([]);
  const [projects, setProjects] = useState([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [faultTypeFilter, setFaultTypeFilter] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedFault, setSelectedFault] = useState(null);

  // Fetch people
  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const response = await apiService.getPeople();
        setPeople(response.data || []);
      } catch (err) {
        console.error('Error fetching people:', err);
      }
    };
    fetchPeople();
  }, []);

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await apiService.getProjects();
        setProjects(response.data || []);
      } catch (err) {
        console.error('Error fetching projects:', err);
      }
    };
    fetchProjects();
  }, []);

  // Fetch faults
  const fetchFaults = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter) filters.status = statusFilter;
      if (severityFilter) filters.severity = severityFilter;
      if (faultTypeFilter) filters.fault_type = faultTypeFilter;
      if (selectedProject) filters.project_id = selectedProject;
      
      const response = await apiService.getFaults(filters);
      let faultsArray = [];
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        faultsArray = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        faultsArray = response.data;
      } else if (Array.isArray(response)) {
        faultsArray = response;
      }
      
      setFaults(faultsArray);
      setError(null);
    } catch (err) {
      console.error('Error fetching faults:', err);
      setError('Failed to load faults');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, severityFilter, faultTypeFilter, selectedProject]);

  useEffect(() => {
    fetchFaults();
  }, [fetchFaults]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchFaults();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchFaults]);

  // View fault details
  const viewFaultDetails = async (faultId) => {
    try {
      const response = await apiService.getFaultById(faultId);
      setSelectedFault(response.data);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Error loading fault details:', err);
      alert('Failed to load fault details');
    }
  };

  // Update fault status
  const updateFaultStatus = async (faultId, newStatus) => {
    try {
      await apiService.updateFault(faultId, { 
        status: newStatus,
        updated_by: 1 
      });
      await viewFaultDetails(faultId);
      await fetchFaults();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  // Delete fault
  const deleteFault = async (faultId) => {
    if (!window.confirm('Are you sure you want to delete this fault? This will also delete all associated actions and log entries.')) {
      return;
    }
    
    try {
      await apiService.deleteFault(faultId);
      setShowDetailModal(false);
      setSelectedFault(null);
      await fetchFaults();
      alert('Fault deleted successfully');
    } catch (err) {
      console.error('Error deleting fault:', err);
      alert('Failed to delete fault');
    }
  };

  const getSeverityColor = (severity) => {
    const colors = {
      'Minor': 'bg-blue-100 text-blue-800 border-blue-200',
      'Major': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Critical': 'bg-red-100 text-red-800 border-red-200',
      'Blocking': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusColor = (status) => {
    const colors = {
      'Reported': 'bg-blue-100 text-blue-800 border-blue-200',
      'Investigating': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'In Progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Resolved': 'bg-green-100 text-green-800 border-green-200',
      'Closed': 'bg-gray-100 text-gray-800 border-gray-200',
      'Deferred': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fault Management</h1>
          <p className="mt-2 text-gray-600">Track and manage system faults</p>
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
          Create Fault
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
          <span className="text-red-800">{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search faults..."
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
            <option value="Reported">Reported</option>
            <option value="Investigating">Investigating</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
            <option value="Deferred">Deferred</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Severities</option>
            <option value="Minor">Minor</option>
            <option value="Major">Major</option>
            <option value="Critical">Critical</option>
            <option value="Blocking">Blocking</option>
          </select>

          <select
            value={faultTypeFilter}
            onChange={(e) => setFaultTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Fault Types</option>
            <option value="Hardware">Hardware</option>
            <option value="Software">Software</option>
            <option value="Network">Network</option>
            <option value="Configuration">Configuration</option>
            <option value="Process">Process</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{faults.length}</p>
          <p className="text-sm text-gray-600">Total Faults</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-red-600">
            {faults.filter(f => f.severity === 'Critical' || f.severity === 'Blocking').length}
          </p>
          <p className="text-sm text-gray-600">Critical/Blocking</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {faults.filter(f => f.status === 'Reported').length}
          </p>
          <p className="text-sm text-gray-600">Reported</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {faults.filter(f => f.status === 'In Progress' || f.status === 'Investigating').length}
          </p>
          <p className="text-sm text-gray-600">In Progress</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {faults.filter(f => f.status === 'Resolved').length}
          </p>
          <p className="text-sm text-gray-600">Resolved</p>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="text-gray-600 mt-4">Loading faults...</p>
        </div>
      )}

      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fault</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Severity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reported</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {faults.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || statusFilter || severityFilter || faultTypeFilter || selectedProject
                      ? 'No faults match your filters'
                      : 'No faults found. Create your first fault!'}
                  </td>
                </tr>
              ) : (
                faults.map((fault) => (
                  <tr key={fault.fault_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => viewFaultDetails(fault.fault_id)}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{fault.title}</div>
                      <div className="text-sm text-gray-500">{fault.fault_number}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getSeverityColor(fault.severity)}`}>
                        {fault.severity}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(fault.status)}`}>
                        {fault.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(fault.reported_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewFaultDetails(fault.fault_id);
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

      <CreateFaultModal
        show={showCreateModal}
        people={people}
        projects={projects}
        selectedProject={selectedProject}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchFaults();
        }}
      />

      {showDetailModal && selectedFault && (
        <FaultDetailModal
          fault={selectedFault}
          people={people}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedFault(null);
          }}
          onStatusUpdate={updateFaultStatus}
          onDelete={deleteFault}
          onEdit={() => {
            setShowDetailModal(false);
            setShowEditModal(true);
          }}
          onRefresh={() => viewFaultDetails(selectedFault.fault_id)}
        />
      )}

      {showEditModal && selectedFault && (
        <EditFaultModal
          show={showEditModal}
          fault={selectedFault}
          people={people}
          projects={projects}
          onClose={() => {
            setShowEditModal(false);
            setSelectedFault(null);
          }}
          onSuccess={async () => {
            setShowEditModal(false);
            await viewFaultDetails(selectedFault.fault_id);
            await fetchFaults();
            setShowDetailModal(true);
          }}
        />
      )}
    </div>
  );
}

// Create Fault Modal
function CreateFaultModal({ show, people, projects, selectedProject, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    fault_number: `FLT-${Date.now()}`,
    title: '',
    description: '',
    severity: 'Major',
    status: 'Reported',
    fault_type: '',
    assigned_to: '',
    reported_by: '',
    reported_date: getTodayForInput(),
    target_fix_date: null,
    root_cause: '',
    resolution: '',
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
      await apiService.createFault({
        ...formData,
        reported_by: formData.reported_by ? parseInt(formData.reported_by) : null,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
        project_id: formData.project_id ? parseInt(formData.project_id) : null,
      });
      onSuccess();
      setFormData({
        fault_number: `FLT-${Date.now()}`,
        title: '',
        description: '',
        severity: 'Major',
        status: 'Reported',
        fault_type: '',
        assigned_to: '',
        reported_by: '',
        reported_date: getTodayForInput(),
        target_fix_date: null,
        root_cause: '',
        resolution: '',
        project_id: selectedProject || (projects.length === 1 ? projects[0].project_id : '')
      });
    } catch (err) {
      console.error('Error creating fault:', err);
      alert('Failed to create fault: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Create New Fault</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fault Number</label>
            <input type="text" value={formData.fault_number} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50" readOnly />
          </div>

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity *</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                required
              >
                <option value="Minor">Minor</option>
                <option value="Major">Major</option>
                <option value="Critical">Critical</option>
                <option value="Blocking">Blocking</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fault Type</label>
              <input
                type="text"
                value={formData.fault_type}
                onChange={(e) => setFormData({ ...formData, fault_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="e.g., Hardware, Software, Network"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reported By *</label>
              <select
                value={formData.reported_by}
                onChange={(e) => setFormData({ ...formData, reported_by: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Reported Date *</label>
              <input
                type="date"
                value={formData.reported_date || ''} 
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ 
                    ...formData, 
                    // If cleared, snap back to today's date string
                    reported_date: val === "" ? getTodayForInput() : val 
                  });
                }}
                className="..."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="">Not assigned</option>
                {people.map(person => (
                  <option key={person.person_id} value={person.person_id}>{person.full_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Fix Date</label>
              <input
                type="date"
                // 1. The Safety Valve for the Display: if null, show empty string
                value={formData.target_fix_date || ''} 
                onChange={(e) => {
                  const val = e.target.value;
                  // 2. The Safety Valve for the Database: if empty, send null
                  setFormData({ 
                    ...formData, 
                    target_fix_date: val === "" ? null : val 
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>


          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Root Cause</label>
            <textarea
              value={formData.root_cause}
              onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              rows="2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
            <textarea
              value={formData.resolution}
              onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              rows="2"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
              {loading ? 'Creating...' : 'Create Fault'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Fault Detail Modal with Actions CRUD
function FaultDetailModal({ fault, people, onClose, onStatusUpdate, onDelete, onEdit, onRefresh }) {
  const [actions, setActions] = useState([]);
  const [log, setLog] = useState([]);
  const [loadingActions, setLoadingActions] = useState(false);
  const [loadingLog, setLoadingLog] = useState(false);
  
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

  // Fetch actions
  const fetchActions = async () => {
    try {
      setLoadingActions(true);
      const response = await apiService.getFaultActions(fault.fault_id);
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
      const response = await apiService.getFaultLog(fault.fault_id);
      setLog(response.data || []);
    } catch (err) {
      console.error('Error fetching log:', err);
    } finally {
      setLoadingLog(false);
    }
  };

  useEffect(() => {
    fetchActions();
    fetchLog();
  }, [fault.fault_id]);

  // Get person name
  const getPersonName = (personId) => {
    if (!personId) return 'Not assigned';
    const person = people.find(p => p.person_id === personId);
    return person ? person.full_name : 'Unknown';
  };

  // Reset action form
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

  // Add action
  const handleAddAction = async (e) => {
    e.preventDefault();
    try {
      await apiService.createFaultAction(fault.fault_id, {
        ...actionFormData,
        assigned_to: actionFormData.assigned_to ? parseInt(actionFormData.assigned_to) : null,
        created_by: actionFormData.created_by ? parseInt(actionFormData.created_by) : null
      });
      await fetchActions();
      await fetchLog();
      resetActionForm();
    } catch (err) {
      console.error('Error adding action:', err);
      alert('Failed to add action');
    }
  };

  // Start editing action
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

  // Save edited action
  const handleSaveAction = async (actionId) => {
    try {
      await apiService.updateFaultAction(fault.fault_id, actionId, {
        ...actionFormData,
        assigned_to: actionFormData.assigned_to ? parseInt(actionFormData.assigned_to) : null
      });
      await fetchActions();
      await fetchLog();
      resetActionForm();
    } catch (err) {
      console.error('Error updating action:', err);
      alert('Failed to update action');
    }
  };

  // Delete action
  const handleDeleteAction = async (actionId) => {
    if (!window.confirm('Are you sure you want to delete this action?')) {
      return;
    }
    
    try {
      await apiService.deleteFaultAction(fault.fault_id, actionId);
      await fetchActions();
      await fetchLog();
    } catch (err) {
      console.error('Error deleting action:', err);
      alert('Failed to delete action');
    }
  };

  // Get action status color
  const getActionStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-gray-100 text-gray-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Get priority color
  const getPriorityColor = (priority) => {
    const colors = {
      'Low': 'bg-gray-100 text-gray-800',
      'Medium': 'bg-yellow-100 text-yellow-800',
      'High': 'bg-orange-100 text-orange-800',
      'Critical': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Fault Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Fault Header */}
          <div className="border-b pb-4">
            <h3 className="text-2xl font-bold text-gray-900">{fault.title}</h3>
            <p className="text-gray-500 mt-1">{fault.fault_number}</p>
          </div>

          {/* Key Info */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Severity</p>
              <p className="text-lg font-semibold text-gray-900">{fault.severity}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Status</p>
              <select
                value={fault.status}
                onChange={(e) => onStatusUpdate(fault.fault_id, e.target.value)}
                className="mt-1 text-sm font-semibold px-2 py-1 border border-gray-300 rounded bg-white"
              >
                <option value="Reported">Reported</option>
                <option value="Investigating">Investigating</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                <option value="Deferred">Deferred</option>
              </select>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Fault Type</p>
              <p className="text-lg font-semibold text-gray-900">{fault.fault_type || 'Not specified'}</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <p className="mt-1 text-gray-900">{fault.description || 'No description provided'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Reported By</label>
                <p className="mt-1 text-gray-900">{getPersonName(fault.reported_by)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Reported Date</label>
                <p className="mt-1 text-gray-900">{formatDate(fault.reported_date)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Assigned To</label>
                <p className="mt-1 text-gray-900">{getPersonName(fault.assigned_to)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Target Fix Date</label>
                <p className="mt-1 text-gray-900">{fault.target_fix_date ? formatDate(fault.target_fix_date) : 'Not set'}</p>
              </div>
            </div>

            {fault.actual_fix_date && (
              <div>
                <label className="text-sm font-medium text-gray-700">Actual Fix Date</label>
                <p className="mt-1 text-gray-900">{formatDate(fault.actual_fix_date)}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700">Root Cause</label>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{fault.root_cause || 'Not identified'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Resolution</label>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{fault.resolution || 'No resolution provided'}</p>
            </div>
          </div>

          {/* FAULT ACTIONS SECTION - NEW! */}
          <div className="border-t pt-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Fault Actions</h4>
              {!showAddAction && !editingActionId && (
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
              <form onSubmit={handleAddAction} className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
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
                        placeholder="e.g., Technical Fix, Investigation"
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
              <p className="text-center text-gray-500 py-4">No actions yet. Add an action to get started.</p>
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

          {/* AUDIT TRAIL SECTION - READ ONLY */}
          <div className="border-t pt-6">
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

          {/* FOOTER BUTTONS */}
          <div className="flex justify-between gap-3 pt-6 border-t">
            <button
              onClick={() => onDelete(fault.fault_id)}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete Fault
            </button>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={onEdit}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Edit Fault
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit Fault Modal
function EditFaultModal({ show, fault, people, projects, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'Major',
    status: 'Reported',
    fault_type: '',
    assigned_to: '',
    reported_by: '',
    reported_date: getTodayForInput(),
    target_fix_date: null,
    actual_fix_date: null,
    root_cause: '',
    resolution: '',
    project_id: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (fault) {
      setFormData({
        title: fault.title || '',
        description: fault.description || '',
        severity: fault.severity || 'Major',
        status: fault.status || 'Reported',
        fault_type: fault.fault_type || '',
        assigned_to: fault.assigned_to || '',
        reported_by: fault.reported_by || '',
        reported_date: fault.reported_date || '',
        target_fix_date: fault.target_fix_date || null,
        actual_fix_date: fault.actual_fix_date || null,
        root_cause: fault.root_cause || '',
        resolution: fault.resolution || '',
        project_id: fault.project_id || ''
      });
    }
  }, [fault]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await apiService.updateFault(fault.fault_id, {
        ...formData,
        reported_by: formData.reported_by ? parseInt(formData.reported_by) : null,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
        project_id: formData.project_id ? parseInt(formData.project_id) : undefined,
        updated_by: 1
      });
      onSuccess();
    } catch (err) {
      console.error('Error updating fault:', err);
      alert('Failed to update fault: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!show || !fault) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[95vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-bold text-gray-900">Edit Fault</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {projects.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
              <select
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select project...</option>
                {projects.map(project => (
                  <option key={project.project_id} value={project.project_id}>{project.project_name}</option>
                ))}
              </select>
            </div>
          )}

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="Minor">Minor</option>
                <option value="Major">Major</option>
                <option value="Critical">Critical</option>
                <option value="Blocking">Blocking</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="Reported">Reported</option>
                <option value="Investigating">Investigating</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                <option value="Deferred">Deferred</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fault Type</label>
            <input
              type="text"
              value={formData.fault_type}
              onChange={(e) => setFormData({ ...formData, fault_type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reported By</label>
              <select
                value={formData.reported_by}
                onChange={(e) => setFormData({ ...formData, reported_by: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select person...</option>
                {people.map(person => (
                  <option key={person.person_id} value={person.person_id}>{person.full_name}</option>
                ))}
              </select>
            </div>
            
            
            

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Reported Date</label>
               <input
                type="date"
                value={formData.reported_date || ''} 
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ 
                    ...formData, 
                    // If cleared, snap back to today's date string
                    reported_date: val === "" ? getTodayForInput() : val 
                  });
                }}
                className="..."
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="">Not assigned</option>
                {people.map(person => (
                  <option key={person.person_id} value={person.person_id}>{person.full_name}</option>
                ))}
              </select>
            </div>
           
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Fix Date</label>
              <input
                type="date"
                // Use an empty string for the value if it's null, so the input doesn't crash
                value={formData.target_fix_date || ''} 
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({ 
                    ...formData, 
                    // If the user cleared the date, set it to null instead of ""
                    target_fix_date: val === "" ? null : val 
                  });
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
                    
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Actual Fix Date</label>
            <input
              type="date"
              // We use || '' to ensure the input component doesn't get 'null', 
              // which would make it an "uncontrolled" component in React.
              value={formData.actual_fix_date || ''} 
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ 
                  ...formData, 
                  // Logic: If user clears the box, send null to the DB. 
                  // Otherwise, send the date string (YYYY-MM-DD).
                  actual_fix_date: val === "" ? null : val 
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Root Cause</label>
            <textarea
              value={formData.root_cause}
              onChange={(e) => setFormData({ ...formData, root_cause: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              rows="2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Resolution</label>
            <textarea
              value={formData.resolution}
              onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              rows="2"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Faults;
