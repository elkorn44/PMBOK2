import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, X, Eye, Edit, Trash2, Check, ListChecks, CheckSquare } from 'lucide-react';
import apiService from '../services/api';
import { useProject } from '../context/ProjectContext';
import { formatDate, formatDateTime, getTodayForInput } from '../utils/dateFormat';

function ActionLogs() {
  const { selectedProject, getSelectedProjectName } = useProject();
  
  const [actionLogs, setActionLogs] = useState([]);
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
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

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

  // Fetch action logs
  const fetchActionLogs = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter) filters.status = statusFilter;
      if (selectedProject) filters.project_id = selectedProject;
      
      const response = await apiService.getActionLogs(filters);
      setActionLogs(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching action logs:', err);
      setError('Failed to load action logs');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, selectedProject]);

  useEffect(() => {
    fetchActionLogs();
  }, [fetchActionLogs]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchActionLogs();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchActionLogs]);

  // View log details
  const viewLogDetails = async (logId) => {
    try {
      const response = await apiService.getActionLogById(logId);
      setSelectedLog(response.data);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Error loading action log details:', err);
      alert('Failed to load action log details');
    }
  };

  // Delete log
  const deleteLog = async (logId) => {
    if (!window.confirm('Are you sure you want to delete this action log? This will also delete all associated items and requirements.')) {
      return;
    }
    
    try {
      await apiService.deleteActionLog(logId);
      setShowDetailModal(false);
      setSelectedLog(null);
      await fetchActionLogs();
      alert('Action log deleted successfully');
    } catch (err) {
      console.error('Error deleting action log:', err);
      alert('Failed to delete action log');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Active': 'bg-blue-100 text-blue-800 border-blue-200',
      'Completed': 'bg-green-100 text-green-800 border-green-200',
      'Archived': 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Action Logs</h1>
          <p className="mt-2 text-gray-600">Track action items from meetings and reviews</p>
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
          Create Action Log
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
                placeholder="Search action logs..."
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
            <option value="Active">Active</option>
            <option value="Completed">Completed</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{actionLogs.length}</p>
          <p className="text-sm text-gray-600">Total Logs</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {actionLogs.filter(log => log.status === 'Active').length}
          </p>
          <p className="text-sm text-gray-600">Active</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {actionLogs.filter(log => log.status === 'Completed').length}
          </p>
          <p className="text-sm text-gray-600">Completed</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">
            {actionLogs.reduce((sum, log) => sum + (parseInt(log.active_items) || 0), 0)}
          </p>
          <p className="text-sm text-gray-600">Active Items</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Loading action logs...</p>
        </div>
      )}

      {/* Action Logs Table */}
      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Log</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {actionLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || statusFilter || selectedProject
                      ? 'No action logs match your filters'
                      : 'No action logs found. Create your first action log!'}
                  </td>
                </tr>
              ) : (
                actionLogs.map((log) => (
                  <tr key={log.action_log_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => viewLogDetails(log.action_log_id)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <ListChecks className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{log.log_name}</div>
                          <div className="text-sm text-gray-500">{log.log_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {log.total_items || 0} items
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm text-gray-900">
                          {log.completed_items || 0} / {log.total_items || 0}
                        </div>
                        {log.total_items > 0 && (
                          <div className="ml-3 w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${((log.completed_items || 0) / (log.total_items || 1)) * 100}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(log.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewLogDetails(log.action_log_id);
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
      <CreateActionLogModal
        show={showCreateModal}
        people={people}
        projects={projects}
        selectedProject={selectedProject}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchActionLogs();
        }}
      />

      {showDetailModal && selectedLog && (
        <ActionLogDetailModal
          log={selectedLog}
          people={people}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedLog(null);
          }}
          onDelete={deleteLog}
          onRefresh={() => viewLogDetails(selectedLog.action_log_id)}
        />
      )}
    </div>
  );
}

// Create Action Log Modal - ALL FIELDS
function CreateActionLogModal({ show, people, projects, selectedProject, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    log_number: `LOG-${Date.now()}`,
    log_name: '',
    description: '',
    status: 'Active',
    created_by: '',
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
      const payload = {
        ...formData,
        created_by: formData.created_by ? parseInt(formData.created_by) : null,
        project_id: formData.project_id ? parseInt(formData.project_id) : null
      };
      
      await apiService.createActionLog(payload);
      onSuccess();
      
      // Reset form
      setFormData({
        log_number: `LOG-${Date.now()}`,
        log_name: '',
        description: '',
        status: 'Active',
        created_by: '',
        project_id: selectedProject || (projects.length === 1 ? projects[0].project_id : '')
      });
    } catch (err) {
      console.error('Error creating action log:', err);
      alert('Failed to create action log: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Create Action Log</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Log Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Log Number</label>
            <input
              type="text"
              value={formData.log_number}
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

          {/* Log Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Log Name *</label>
            <input
              type="text"
              value={formData.log_name}
              onChange={(e) => setFormData({ ...formData, log_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Weekly Sprint Review - January 2026"
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
              placeholder="Brief description of this action log..."
            />
          </div>

          {/* Status & Created By */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Archived">Archived</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
              <select
                value={formData.created_by}
                onChange={(e) => setFormData({ ...formData, created_by: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select person...</option>
                {people.map(person => (
                  <option key={person.person_id} value={person.person_id}>{person.full_name}</option>
                ))}
              </select>
            </div>
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
              {loading ? 'Creating...' : 'Create Action Log'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Action Log Detail Modal - Complete with Items and Requirements
function ActionLogDetailModal({ log, people, onClose, onDelete, onRefresh }) {
  const [editMode, setEditMode] = useState(false);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(false);
  
  // Edit form state (ALL FIELDS)
  const [formData, setFormData] = useState({
    log_name: '',
    description: '',
    status: 'Active',
    created_by: ''
  });

  // Add/Edit item state (ALL 14 FIELDS)
  const [showAddItem, setShowAddItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState(null);
  const [itemFormData, setItemFormData] = useState({
    action_number: '',
    action_description: '',
    action_type: '',
    assigned_to: '',
    created_by: '',
    created_date: getTodayForInput(),
    due_date: '',
    completed_date: '',
    status: 'Pending',
    priority: 'Medium',
    notes: '',
    completion_notes: ''
  });

  // Requirements state
  const [showRequirements, setShowRequirements] = useState({});
  const [requirements, setRequirements] = useState({});
  const [showAddRequirement, setShowAddRequirement] = useState({});
  const [requirementFormData, setRequirementFormData] = useState({});

  // Initialize form data from log
  useEffect(() => {
    if (log) {
      setFormData({
        log_name: log.log_name || '',
        description: log.description || '',
        status: log.status || 'Active',
        created_by: log.created_by || ''
      });
    }
  }, [log]);

  // Fetch items
  const fetchItems = async () => {
    try {
      setLoadingItems(true);
      const response = await apiService.getActionLogItems(log.action_log_id);
      setItems(response.data || []);
    } catch (err) {
      console.error('Error fetching items:', err);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (log) {
      fetchItems();
    }
  }, [log]);

  // Fetch requirements for an item
  const fetchRequirements = async (itemId) => {
    try {
      const response = await apiService.getActionItemRequirements(log.action_log_id, itemId);
      setRequirements(prev => ({
        ...prev,
        [itemId]: response.data || []
      }));
    } catch (err) {
      console.error('Error fetching requirements:', err);
    }
  };

  // Toggle requirements view
  const toggleRequirements = (itemId) => {
    setShowRequirements(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
    
    if (!showRequirements[itemId] && !requirements[itemId]) {
      fetchRequirements(itemId);
    }
  };

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
      const payload = {
        ...formData,
        created_by: formData.created_by ? parseInt(formData.created_by) : null
      };
      
      await apiService.updateActionLog(log.action_log_id, payload);
      setEditMode(false);
      await onRefresh();
      alert('Action log updated successfully');
    } catch (err) {
      console.error('Error updating action log:', err);
      alert('Failed to update action log: ' + (err.response?.data?.message || err.message));
    }
  };

  // Quick status update
  const handleQuickStatusUpdate = async (newStatus) => {
    try {
      await apiService.updateActionLog(log.action_log_id, {
        status: newStatus
      });
      await onRefresh();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  // Item handlers
  const resetItemForm = () => {
    setItemFormData({
      action_number: '',
      action_description: '',
      action_type: '',
      assigned_to: '',
      created_by: '',
      created_date: getTodayForInput(),
      due_date: '',
      completed_date: '',
      status: 'Pending',
      priority: 'Medium',
      notes: '',
      completion_notes: ''
    });
    setShowAddItem(false);
    setEditingItemId(null);
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    try {
      // Date handling: empty → null, created_date → today
      const payload = {
        ...itemFormData,
        assigned_to: itemFormData.assigned_to ? parseInt(itemFormData.assigned_to) : null,
        created_by: itemFormData.created_by ? parseInt(itemFormData.created_by) : null,
        created_date: itemFormData.created_date || getTodayForInput(),
        due_date: itemFormData.due_date || null,
        completed_date: itemFormData.completed_date || null
      };
      
      await apiService.createActionLogItem(log.action_log_id, payload);
      await fetchItems();
      await onRefresh();
      resetItemForm();
    } catch (err) {
      console.error('Error adding item:', err);
      alert('Failed to add item');
    }
  };

  const startEditItem = (item) => {
    setEditingItemId(item.action_item_id);
    setItemFormData({
      action_number: item.action_number || '',
      action_description: item.action_description || '',
      action_type: item.action_type || '',
      assigned_to: item.assigned_to || '',
      created_by: item.created_by || '',
      created_date: item.created_date || getTodayForInput(),
      due_date: item.due_date || '',
      completed_date: item.completed_date || '',
      status: item.status || 'Pending',
      priority: item.priority || 'Medium',
      notes: item.notes || '',
      completion_notes: item.completion_notes || ''
    });
    setShowAddItem(false);
  };

  const handleSaveItem = async (itemId) => {
    try {
      // Date handling: empty → null, created_date → today
      const payload = {
        ...itemFormData,
        assigned_to: itemFormData.assigned_to ? parseInt(itemFormData.assigned_to) : null,
        created_by: itemFormData.created_by ? parseInt(itemFormData.created_by) : null,
        created_date: itemFormData.created_date || getTodayForInput(),
        due_date: itemFormData.due_date || null,
        completed_date: itemFormData.completed_date || null
      };
      
      await apiService.updateActionLogItem(log.action_log_id, itemId, payload);
      await fetchItems();
      await onRefresh();
      resetItemForm();
    } catch (err) {
      console.error('Error updating item:', err);
      alert('Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this action item?')) {
      return;
    }
    
    try {
      await apiService.deleteActionLogItem(log.action_log_id, itemId);
      await fetchItems();
      await onRefresh();
    } catch (err) {
      console.error('Error deleting item:', err);
      alert('Failed to delete item');
    }
  };

  // Requirement handlers
  const startAddRequirement = (itemId) => {
    setShowAddRequirement(prev => ({ ...prev, [itemId]: true }));
    setRequirementFormData(prev => ({
      ...prev,
      [itemId]: {
        requirement_description: '',
        sequence_order: '',
        status: 'Pending',
        completed_by: '',
        completed_date: '',
        notes: ''
      }
    }));
  };

  const handleAddRequirement = async (itemId) => {
    try {
      const formData = requirementFormData[itemId];
      const payload = {
        ...formData,
        completed_by: formData.completed_by ? parseInt(formData.completed_by) : null,
        completed_date: formData.completed_date || null,
        sequence_order: formData.sequence_order ? parseInt(formData.sequence_order) : null
      };
      
      await apiService.createActionItemRequirement(log.action_log_id, itemId, payload);
      await fetchRequirements(itemId);
      setShowAddRequirement(prev => ({ ...prev, [itemId]: false }));
    } catch (err) {
      console.error('Error adding requirement:', err);
      alert('Failed to add requirement');
    }
  };

  const handleToggleRequirement = async (itemId, reqId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
      await apiService.updateActionItemRequirement(log.action_log_id, itemId, reqId, {
        status: newStatus,
        completed_date: newStatus === 'Completed' ? getTodayForInput() : null
      });
      await fetchRequirements(itemId);
    } catch (err) {
      console.error('Error toggling requirement:', err);
      alert('Failed to update requirement');
    }
  };

  const handleDeleteRequirement = async (itemId, reqId) => {
    if (!window.confirm('Are you sure you want to delete this requirement?')) {
      return;
    }
    
    try {
      await apiService.deleteActionItemRequirement(log.action_log_id, itemId, reqId);
      await fetchRequirements(itemId);
    } catch (err) {
      console.error('Error deleting requirement:', err);
      alert('Failed to delete requirement');
    }
  };

  const getItemStatusColor = (status) => {
    const colors = {
      'Pending': 'bg-gray-100 text-gray-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'Cancelled': 'bg-red-100 text-red-800',
      'On Hold': 'bg-yellow-100 text-yellow-800'
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
      'Active': 'bg-blue-100 text-blue-800',
      'Completed': 'bg-green-100 text-green-800',
      'Archived': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        {/* Sticky Header with Icons - justify-between */}
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Action Log Details</h2>
          <div className="flex items-center gap-2">
            {/* Remote Submit - Checkmark Icon */}
            {editMode && (
              <button
                type="submit"
                form="editLogForm"
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
                title="Edit Log"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
            {/* Delete Icon */}
            <button
              onClick={() => onDelete(log.action_log_id)}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
              title="Delete Log"
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
        <form id="editLogForm" onSubmit={handleEditSubmit} className="p-6 space-y-6">
          {/* Header Info */}
          <div className="border-b pb-4">
            <div className="flex items-start gap-3">
              <ListChecks className="w-6 h-6 text-blue-600 mt-1" />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">{log.log_name}</h3>
                <p className="text-gray-500 mt-1">{log.log_number}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(log.status)}`}>
                {log.status}
              </span>
            </div>
          </div>

          {/* Quick Status Update (when not editing) */}
          {!editMode && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Quick Status Update</h4>
              <div className="flex flex-wrap gap-2">
                {['Active', 'Completed', 'Archived'].map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handleQuickStatusUpdate(status)}
                    disabled={log.status === status}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors
                      ${log.status === status 
                        ? 'bg-gray-300 text-gray-600 cursor-not-allowed' 
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Log Details - ALL FIELDS */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Log Details</h4>
            
            {editMode ? (
              <>
                {/* Editable Fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Log Name *</label>
                  <input
                    type="text"
                    value={formData.log_name}
                    onChange={(e) => setFormData({ ...formData, log_name: e.target.value })}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                    <select
                      value={formData.created_by}
                      onChange={(e) => setFormData({ ...formData, created_by: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select person...</option>
                      {people.map(person => (
                        <option key={person.person_id} value={person.person_id}>{person.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Read-only Display */}
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{log.description || 'No description'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created By</label>
                    <p className="mt-1 text-gray-900">{getPersonName(log.created_by)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created</label>
                    <p className="mt-1 text-gray-900">{formatDateTime(log.created_at)}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </form>

        {/* ACTION ITEMS SECTION */}
        <div className="border-t pt-6 px-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-semibold text-gray-900">Action Items</h4>
            {!showAddItem && !editingItemId && !editMode && (
              <button
                onClick={() => setShowAddItem(true)}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>
            )}
          </div>

          {/* Add Item Form - Compact */}
          {showAddItem && (
            <form onSubmit={handleAddItem} className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 space-y-3">
              <h5 className="font-semibold text-gray-900 mb-2">New Action Item</h5>
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                  <textarea
                    value={itemFormData.action_description}
                    onChange={(e) => setItemFormData({ ...itemFormData, action_description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows="2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Action Number</label>
                  <input
                    type="text"
                    value={itemFormData.action_number}
                    onChange={(e) => setItemFormData({ ...itemFormData, action_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="AI-001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <input
                    type="text"
                    value={itemFormData.action_type}
                    onChange={(e) => setItemFormData({ ...itemFormData, action_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="e.g., Documentation"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                  <select
                    value={itemFormData.assigned_to}
                    onChange={(e) => setItemFormData({ ...itemFormData, assigned_to: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Not assigned</option>
                    {people.map(person => (
                      <option key={person.person_id} value={person.person_id}>{person.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                  <select
                    value={itemFormData.created_by}
                    onChange={(e) => setItemFormData({ ...itemFormData, created_by: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">Select person...</option>
                    {people.map(person => (
                      <option key={person.person_id} value={person.person_id}>{person.full_name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created Date *</label>
                  <input
                    type="date"
                    value={itemFormData.created_date}
                    onChange={(e) => setItemFormData({ ...itemFormData, created_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={itemFormData.due_date}
                    onChange={(e) => setItemFormData({ ...itemFormData, due_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completed Date</label>
                  <input
                    type="date"
                    value={itemFormData.completed_date}
                    onChange={(e) => setItemFormData({ ...itemFormData, completed_date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={itemFormData.status}
                    onChange={(e) => setItemFormData({ ...itemFormData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="Pending">Pending</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={itemFormData.priority}
                    onChange={(e) => setItemFormData({ ...itemFormData, priority: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={itemFormData.notes}
                    onChange={(e) => setItemFormData({ ...itemFormData, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows="2"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Completion Notes</label>
                  <textarea
                    value={itemFormData.completion_notes}
                    onChange={(e) => setItemFormData({ ...itemFormData, completion_notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    rows="2"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={resetItemForm}
                  className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  Add Item
                </button>
              </div>
            </form>
          )}

          {/* Items List */}
          {loadingItems ? (
            <p className="text-center text-gray-500 py-4">Loading items...</p>
          ) : items.length === 0 ? (
            <p className="text-center text-gray-500 py-4">No action items yet.</p>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.action_item_id} className="border border-gray-200 rounded-lg p-4">
                  {editingItemId === item.action_item_id ? (
                    // Edit mode - Same form as add (compact)
                    <form onSubmit={(e) => { e.preventDefault(); handleSaveItem(item.action_item_id); }} className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                          <textarea
                            value={itemFormData.action_description}
                            onChange={(e) => setItemFormData({ ...itemFormData, action_description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                            rows="2"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Action Number</label>
                          <input
                            type="text"
                            value={itemFormData.action_number}
                            onChange={(e) => setItemFormData({ ...itemFormData, action_number: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                          <input
                            type="text"
                            value={itemFormData.action_type}
                            onChange={(e) => setItemFormData({ ...itemFormData, action_type: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
                          <select
                            value={itemFormData.assigned_to}
                            onChange={(e) => setItemFormData({ ...itemFormData, assigned_to: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="">Not assigned</option>
                            {people.map(person => (
                              <option key={person.person_id} value={person.person_id}>{person.full_name}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                          <input
                            type="date"
                            value={itemFormData.due_date}
                            onChange={(e) => setItemFormData({ ...itemFormData, due_date: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                          <select
                            value={itemFormData.status}
                            onChange={(e) => setItemFormData({ ...itemFormData, status: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                            <option value="On Hold">On Hold</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                          <select
                            value={itemFormData.priority}
                            onChange={(e) => setItemFormData({ ...itemFormData, priority: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-2 border-t">
                        <button
                          type="button"
                          onClick={resetItemForm}
                          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center gap-1"
                        >
                          <Check className="w-4 h-4" />
                          Save
                        </button>
                      </div>
                    </form>
                  ) : (
                    // View mode - Compact display
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            {item.action_number && (
                              <span className="text-xs font-mono text-gray-500">{item.action_number}</span>
                            )}
                            <p className="font-medium text-gray-900">{item.action_description}</p>
                          </div>
                          {item.action_type && (
                            <p className="text-sm text-gray-600 mt-1">Type: {item.action_type}</p>
                          )}
                        </div>
                        <div className="flex gap-2 ml-4">
                          <button
                            onClick={() => startEditItem(item)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                            title="Edit Item"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item.action_item_id)}
                            className="p-1 text-red-600 hover:text-red-800"
                            title="Delete Item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => toggleRequirements(item.action_item_id)}
                            className="p-1 text-purple-600 hover:text-purple-800"
                            title="Requirements"
                          >
                            <CheckSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs mt-2">
                        <div>
                          <span className="text-gray-600">Assigned:</span>
                          <p className="font-medium text-gray-900">{getPersonName(item.assigned_to)}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Due:</span>
                          <p className="font-medium text-gray-900">{item.due_date ? formatDate(item.due_date) : 'No due date'}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Status:</span>
                          <p><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getItemStatusColor(item.status)}`}>
                            {item.status}
                          </span></p>
                        </div>
                        <div>
                          <span className="text-gray-600">Priority:</span>
                          <p><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                            {item.priority}
                          </span></p>
                        </div>
                      </div>

                      {item.notes && (
                        <div className="mt-2 text-sm pt-2 border-t">
                          <span className="text-gray-600">Notes:</span>
                          <p className="text-gray-900 mt-1">{item.notes}</p>
                        </div>
                      )}

                      {/* Requirements (Checklist) */}
                      {showRequirements[item.action_item_id] && (
                        <div className="mt-3 bg-purple-50 border border-purple-200 rounded p-3">
                          <div className="flex justify-between items-center mb-2">
                            <h6 className="text-sm font-semibold text-gray-900">Requirements Checklist</h6>
                            {!showAddRequirement[item.action_item_id] && (
                              <button
                                onClick={() => startAddRequirement(item.action_item_id)}
                                className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                              >
                                + Add Requirement
                              </button>
                            )}
                          </div>

                          {/* Add Requirement Form */}
                          {showAddRequirement[item.action_item_id] && (
                            <div className="mb-3 bg-white rounded p-2 space-y-2">
                              <input
                                type="text"
                                value={requirementFormData[item.action_item_id]?.requirement_description || ''}
                                onChange={(e) => setRequirementFormData(prev => ({
                                  ...prev,
                                  [item.action_item_id]: {
                                    ...(prev[item.action_item_id] || {}),
                                    requirement_description: e.target.value
                                  }
                                }))}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                placeholder="Requirement description..."
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => setShowAddRequirement(prev => ({ ...prev, [item.action_item_id]: false }))}
                                  className="text-xs px-2 py-1 border border-gray-300 rounded hover:bg-gray-50"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleAddRequirement(item.action_item_id)}
                                  className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                                >
                                  Add
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Requirements List */}
                          {!requirements[item.action_item_id] || requirements[item.action_item_id].length === 0 ? (
                            <p className="text-xs text-gray-500 text-center py-2">No requirements yet</p>
                          ) : (
                            <div className="space-y-1">
                              {requirements[item.action_item_id]
                                .sort((a, b) => (a.sequence_order || 999) - (b.sequence_order || 999))
                                .map((req) => (
                                  <div key={req.requirement_id} className="flex items-start gap-2 bg-white rounded px-2 py-1">
                                    <input
                                      type="checkbox"
                                      checked={req.status === 'Completed'}
                                      onChange={() => handleToggleRequirement(item.action_item_id, req.requirement_id, req.status)}
                                      className="mt-1"
                                    />
                                    <div className="flex-1">
                                      <p className={`text-sm ${req.status === 'Completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                        {req.sequence_order && <span className="text-xs text-gray-400 mr-1">{req.sequence_order}.</span>}
                                        {req.requirement_description}
                                      </p>
                                      {req.completed_date && (
                                        <p className="text-xs text-gray-500">
                                          Completed: {formatDate(req.completed_date)}
                                        </p>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => handleDeleteRequirement(item.action_item_id, req.requirement_id)}
                                      className="text-red-500 hover:text-red-700"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ActionLogs;
