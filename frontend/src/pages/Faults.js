import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Plus, Search, X, Eye, Edit, Trash2 } from 'lucide-react';
import apiService from '../services/api';
import { useProject } from '../context/ProjectContext';
import { formatDate, formatDateTime, getTodayForInput } from '../utils/dateFormat';

function Faults() {
  // Get selected project from context
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

  // Fetch faults with filters
  const fetchFaults = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching faults for project:', selectedProject || 'All');
      
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter) filters.status = statusFilter;
      if (severityFilter) filters.severity = severityFilter;
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
      
      console.log('✅ Loaded', faultsArray.length, 'faults');
      setFaults(faultsArray);
      setError(null);
    } catch (err) {
      console.error('Error fetching faults:', err);
      setError('Failed to load faults');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, severityFilter, selectedProject]);

  useEffect(() => {
    fetchFaults();
  }, [fetchFaults]);

  // Debounced search
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
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  // Delete fault
  const deleteFault = async (faultId) => {
    if (!window.confirm('Are you sure you want to delete this fault? This action cannot be undone.')) {
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

  // Get severity color
  const getSeverityColor = (severity) => {
    const colors = {
      'Very Low': 'bg-gray-100 text-gray-800 border-gray-200',
      'Low': 'bg-blue-100 text-blue-800 border-blue-200',
      'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'High': 'bg-orange-100 text-orange-800 border-orange-200',
      'Critical': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[severity] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Get status color
  const getStatusColor = (status) => {
    const colors = {
      'Open': 'bg-blue-100 text-blue-800 border-blue-200',
      'In Progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Resolved': 'bg-green-100 text-green-800 border-green-200',
      'Closed': 'bg-gray-100 text-gray-800 border-gray-200',
      'Reopened': 'bg-orange-100 text-orange-800 border-orange-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Error Display */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex justify-between items-center">
          <span className="text-red-800">{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {/* Filters Bar */}
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
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
            <option value="Reopened">Reopened</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
          >
            <option value="">All Severities</option>
            <option value="Very Low">Very Low</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Critical">Critical</option>
          </select>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{faults.length}</p>
          <p className="text-sm text-gray-600">Total Faults</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-red-600">
            {faults.filter(f => f.severity === 'Critical').length}
          </p>
          <p className="text-sm text-gray-600">Critical</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {faults.filter(f => f.status === 'Open').length}
          </p>
          <p className="text-sm text-gray-600">Open</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {faults.filter(f => f.status === 'In Progress').length}
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

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="text-gray-600 mt-4">Loading faults...</p>
        </div>
      )}

      {/* Faults Table */}
      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fault
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Severity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Identified
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {faults.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || statusFilter || severityFilter || selectedProject
                      ? 'No faults match your filters'
                      : 'No faults found. Create your first fault!'}
                  </td>
                </tr>
              ) : (
                faults.map((fault) => (
                  <tr key={fault.fault_id} className="hover:bg-gray-50">
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
                      {formatDate(fault.identified_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => viewFaultDetails(fault.fault_id)}
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

// Create Fault Modal Component
function CreateFaultModal({ show, people, projects, selectedProject, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    fault_number: `FLT-${Date.now()}`,
    title: '',
    description: '',
    severity: 'Medium',
    status: 'Open',
    category: '',
    identified_by: '',
    identified_date: getTodayForInput(),
    root_cause: '',
    corrective_action: '',
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
        identified_by: formData.identified_by ? parseInt(formData.identified_by) : null,
        project_id: formData.project_id ? parseInt(formData.project_id) : null,
      });
      onSuccess();
      setFormData({
        fault_number: `FLT-${Date.now()}`,
        title: '',
        description: '',
        severity: 'Medium',
        status: 'Open',
        category: '',
        identified_by: '',
        identified_date: getTodayForInput(),
        root_cause: '',
        corrective_action: '',
        project_id: selectedProject || (projects.length === 1 ? projects[0].project_id : '')
      });
    } catch (err) {
      console.error('Error creating fault:', err);
      alert('Failed to create fault');
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
            <input
              type="text"
              value={formData.fault_number}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              readOnly
            />
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
                <option value="">Select project...</option>
                {projects.map(project => (
                  <option key={project.project_id} value={project.project_id}>
                    {project.project_name}
                  </option>
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
                <option value="Very Low">Very Low</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                placeholder="e.g., Hardware, Software, Network"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Identified By *</label>
              <select
                value={formData.identified_by}
                onChange={(e) => setFormData({ ...formData, identified_by: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                required
              >
                <option value="">Select person...</option>
                {people.map(person => (
                  <option key={person.person_id} value={person.person_id}>
                    {person.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Identified Date *</label>
              <input
                type="date"
                value={formData.identified_date}
                onChange={(e) => setFormData({ ...formData, identified_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                required
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
              placeholder="Describe the root cause of the fault..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Corrective Action</label>
            <textarea
              value={formData.corrective_action}
              onChange={(e) => setFormData({ ...formData, corrective_action: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              rows="2"
              placeholder="Describe the corrective action taken..."
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

// Fault Detail Modal Component
function FaultDetailModal({ fault, people, onClose, onStatusUpdate, onDelete, onEdit, onRefresh }) {
  const [log, setLog] = useState([]);
  const [loadingLog, setLoadingLog] = useState(false);
  const [newLogEntry, setNewLogEntry] = useState('');
  const [addingLog, setAddingLog] = useState(false);

  // Fetch log entries
  useEffect(() => {
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
    fetchLog();
  }, [fault.fault_id]);

  // Add log entry
  const addLogEntry = async (e) => {
    e.preventDefault();
    if (!newLogEntry.trim()) return;
    
    setAddingLog(true);
    try {
      await apiService.addFaultLogEntry(fault.fault_id, {
        logged_by: 1,
        comments: newLogEntry
      });
      
      const response = await apiService.getFaultLog(fault.fault_id);
      setLog(response.data || []);
      setNewLogEntry('');
    } catch (err) {
      console.error('Error adding log entry:', err);
      alert('Failed to add log entry');
    } finally {
      setAddingLog(false);
    }
  };

  // Get person name
  const getPersonName = (personId) => {
    const person = people.find(p => p.person_id === personId);
    return person ? person.full_name : 'Unknown';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Fault Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header Section */}
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
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                <option value="Reopened">Reopened</option>
              </select>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Category</p>
              <p className="text-lg font-semibold text-gray-900">{fault.category || 'Not specified'}</p>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <p className="mt-1 text-gray-900">{fault.description || 'No description provided'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Identified By</label>
                <p className="mt-1 text-gray-900">{getPersonName(fault.identified_by)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Identified Date</label>
                <p className="mt-1 text-gray-900">{formatDate(fault.identified_date)}</p>
              </div>
            </div>

            {(fault.resolved_by || fault.resolved_date) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Resolved By</label>
                  <p className="mt-1 text-gray-900">{fault.resolved_by ? getPersonName(fault.resolved_by) : 'Not resolved'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Resolved Date</label>
                  <p className="mt-1 text-gray-900">{fault.resolved_date ? formatDate(fault.resolved_date) : 'N/A'}</p>
                </div>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-700">Root Cause</label>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{fault.root_cause || 'Not identified'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Corrective Action</label>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{fault.corrective_action || 'No action taken'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
              <div>
                <label className="font-medium">Created:</label>
                <span className="ml-2">{formatDateTime(fault.created_at)}</span>
              </div>
              {fault.updated_at && (
                <div>
                  <label className="font-medium">Updated:</label>
                  <span className="ml-2">{formatDateTime(fault.updated_at)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Activity Log Section */}
          <div className="border-t pt-4">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Activity Log</h4>
            
            {/* Add Log Entry Form */}
            <form onSubmit={addLogEntry} className="mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLogEntry}
                  onChange={(e) => setNewLogEntry(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={addingLog || !newLogEntry.trim()}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {addingLog ? 'Adding...' : 'Add'}
                </button>
              </div>
            </form>

            {/* Log Entries */}
            {loadingLog ? (
              <p className="text-center text-gray-500 py-4">Loading activity log...</p>
            ) : log.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No activity yet.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {log.map((entry) => (
                  <div key={entry.log_id} className="border-l-4 border-red-400 bg-gray-50 p-3 rounded">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <span className="font-medium">{getPersonName(entry.logged_by)}</span>
                          <span>•</span>
                          <span>{formatDateTime(entry.log_date)}</span>
                          {entry.log_type && entry.log_type !== 'Comment' && (
                            <>
                              <span>•</span>
                              <span className="text-red-600 font-medium">{entry.log_type}</span>
                            </>
                          )}
                        </div>
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

          {/* Action Buttons */}
          <div className="flex justify-between gap-3 pt-4 border-t">
            <button
              onClick={() => onDelete(fault.fault_id)}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 inline mr-2" />
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
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                <Edit className="w-4 h-4 inline mr-2" />
                Edit Fault
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit Fault Modal Component
function EditFaultModal({ show, fault, people, projects, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'Medium',
    status: 'Open',
    category: '',
    identified_by: '',
    identified_date: '',
    resolved_by: '',
    resolved_date: '',
    root_cause: '',
    corrective_action: '',
    project_id: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (fault) {
      setFormData({
        title: fault.title || '',
        description: fault.description || '',
        severity: fault.severity || 'Medium',
        status: fault.status || 'Open',
        category: fault.category || '',
        identified_by: fault.identified_by || '',
        identified_date: fault.identified_date || '',
        resolved_by: fault.resolved_by || '',
        resolved_date: fault.resolved_date || '',
        root_cause: fault.root_cause || '',
        corrective_action: fault.corrective_action || '',
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
        identified_by: formData.identified_by ? parseInt(formData.identified_by) : null,
        resolved_by: formData.resolved_by ? parseInt(formData.resolved_by) : null,
        project_id: formData.project_id ? parseInt(formData.project_id) : undefined,
        updated_by: 1
      });
      onSuccess();
    } catch (err) {
      console.error('Error updating fault:', err);
      alert('Failed to update fault');
    } finally {
      setLoading(false);
    }
  };

  if (!show || !fault) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
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
                  <option key={project.project_id} value={project.project_id}>
                    {project.project_name}
                  </option>
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
                <option value="Very Low">Very Low</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
                <option value="Reopened">Reopened</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Identified By</label>
              <select
                value={formData.identified_by}
                onChange={(e) => setFormData({ ...formData, identified_by: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="">Select person...</option>
                {people.map(person => (
                  <option key={person.person_id} value={person.person_id}>
                    {person.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Identified Date</label>
              <input
                type="date"
                value={formData.identified_date}
                onChange={(e) => setFormData({ ...formData, identified_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resolved By</label>
              <select
                value={formData.resolved_by}
                onChange={(e) => setFormData({ ...formData, resolved_by: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              >
                <option value="">Not resolved</option>
                {people.map(person => (
                  <option key={person.person_id} value={person.person_id}>
                    {person.full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Resolved Date</label>
              <input
                type="date"
                value={formData.resolved_date}
                onChange={(e) => setFormData({ ...formData, resolved_date: e.target.value })}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Corrective Action</label>
            <textarea
              value={formData.corrective_action}
              onChange={(e) => setFormData({ ...formData, corrective_action: e.target.value })}
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
