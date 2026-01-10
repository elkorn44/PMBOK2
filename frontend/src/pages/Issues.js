import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Plus, Search, X, Eye, Edit, CheckCircle, Trash2 } from 'lucide-react';
import apiService from '../services/apiService';
import { formatDate, formatDateTime, getTodayForInput, getFutureDateForInput } from '../utils/dateFormat';

function Issues() {
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [people, setPeople] = useState([]);
  const [projects, setProjects] = useState([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddActionModal, setShowAddActionModal] = useState(false);
  const [showEditActionModal, setShowEditActionModal] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);

  // Fetch people
  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const response = await apiService.getPeople({ is_active: true });
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

  // Fetch issues with filters
  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter) filters.status = statusFilter;
      if (priorityFilter) filters.priority = priorityFilter;
      
      const response = await apiService.getIssues(filters);
      setIssues(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching issues:', err);
      setError('Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, priorityFilter]);

  useEffect(() => {
    fetchIssues();
  }, [fetchIssues]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchIssues();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchIssues]);

  // View issue details
  const viewIssueDetails = async (issueId) => {
    try {
      const response = await apiService.getIssueById(issueId);
      setSelectedIssue(response.data);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Error loading issue details:', err);
      alert('Failed to load issue details');
    }
  };

  // Update issue status (quick action)
  const updateIssueStatus = async (issueId, newStatus) => {
    try {
      await apiService.updateIssue(issueId, { 
        status: newStatus,
        updated_by: 1 
      });
      
      // Refresh both detail view and list
      await viewIssueDetails(issueId);
      await fetchIssues();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  // Delete issue
  const deleteIssue = async (issueId) => {
    if (!window.confirm('Are you sure you want to delete this issue? This will also delete all associated actions and log entries. This action cannot be undone.')) {
      return;
    }
    
    try {
      await apiService.deleteIssue(issueId);
      setShowDetailModal(false);
      setSelectedIssue(null);
      await fetchIssues();
      alert('Issue deleted successfully');
    } catch (err) {
      console.error('Error deleting issue:', err);
      alert('Failed to delete issue');
    }
  };

  // Update action status (quick action)
  const updateActionStatus = async (issueId, actionId, newStatus) => {
    try {
      await apiService.updateIssueAction(issueId, actionId, {
        status: newStatus,
        updated_by: 1
      });
      
      // Refresh detail view
      await viewIssueDetails(issueId);
    } catch (err) {
      console.error('Error updating action status:', err);
      alert('Failed to update action status');
    }
  };

  // Delete action
  const deleteAction = async (issueId, actionId) => {
    if (!window.confirm('Are you sure you want to delete this action? This action cannot be undone.')) {
      return;
    }
    
    try {
      await apiService.deleteIssueAction(issueId, actionId);
      await viewIssueDetails(issueId);
      alert('Action deleted successfully');
    } catch (err) {
      console.error('Error deleting action:', err);
      alert('Failed to delete action');
    }
  };

  // Get priority badge color
  const getPriorityColor = (priority) => {
    const colors = {
      Critical: 'bg-red-100 text-red-800 border-red-200',
      High: 'bg-orange-100 text-orange-800 border-orange-200',
      Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Low: 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      Open: 'bg-blue-100 text-blue-800 border-blue-200',
      'In Progress': 'bg-purple-100 text-purple-800 border-purple-200',
      Resolved: 'bg-green-100 text-green-800 border-green-200',
      Closed: 'bg-gray-100 text-gray-800 border-gray-200',
      Cancelled: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Issues</h1>
          <p className="mt-2 text-gray-600">Track and manage project issues</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Create Issue
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Active Filters */}
        {(searchTerm || statusFilter || priorityFilter) && (
          <div className="flex gap-2 mt-4">
            <span className="text-sm text-gray-600">Active filters:</span>
            {searchTerm && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2">
                Search: {searchTerm}
                <X className="w-4 h-4 cursor-pointer" onClick={() => setSearchTerm('')} />
              </span>
            )}
            {statusFilter && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2">
                Status: {statusFilter}
                <X className="w-4 h-4 cursor-pointer" onClick={() => setStatusFilter('')} />
              </span>
            )}
            {priorityFilter && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2">
                Priority: {priorityFilter}
                <X className="w-4 h-4 cursor-pointer" onClick={() => setPriorityFilter('')} />
              </span>
            )}
          </div>
        )}
      </div>

      {/* Issues Table */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="text-gray-500">Loading issues...</div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        </div>
      ) : issues.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Issues Found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || statusFilter || priorityFilter
              ? 'No issues match your current filters.'
              : 'Get started by creating your first issue.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create First Issue
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Issue #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Raised Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {issues.map((issue) => (
                <tr key={issue.issue_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {issue.issue_number}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {issue.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(issue.priority)}`}>
                      {issue.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(issue.status)}`}>
                      {issue.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(issue.raised_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => viewIssueDetails(issue.issue_id)}
                      className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Issue Modal */}
      <CreateIssueModal
        show={showCreateModal}
        people={people}
        projects={projects}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchIssues();
        }}
      />

      {/* Issue Detail Modal */}
      <IssueDetailModal
        show={showDetailModal}
        issue={selectedIssue}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedIssue(null);
        }}
        onEdit={() => {
          setShowDetailModal(false);
          setShowEditModal(true);
        }}
        onDelete={() => deleteIssue(selectedIssue.issue_id)}
        onStatusChange={updateIssueStatus}
        onAddAction={() => setShowAddActionModal(true)}
        onEditAction={(action) => {
          setSelectedAction(action);
          setShowEditActionModal(true);
        }}
        onDeleteAction={deleteAction}
        onActionStatusChange={updateActionStatus}
      />

      {/* Edit Issue Modal */}
      <EditIssueModal
        show={showEditModal}
        issue={selectedIssue}
        people={people}
        projects={projects}
        onClose={() => setShowEditModal(false)}
        onSuccess={async () => {
          setShowEditModal(false);
          await viewIssueDetails(selectedIssue.issue_id);
          await fetchIssues();
        }}
      />

      {/* Add Action Modal */}
      <AddActionModal
        show={showAddActionModal}
        issueId={selectedIssue?.issue_id}
        people={people}
        onClose={() => setShowAddActionModal(false)}
        onSuccess={async () => {
          setShowAddActionModal(false);
          await viewIssueDetails(selectedIssue.issue_id);
        }}
      />

      {/* Edit Action Modal */}
      <EditActionModal
        show={showEditActionModal}
        issueId={selectedIssue?.issue_id}
        action={selectedAction}
        people={people}
        onClose={() => {
          setShowEditActionModal(false);
          setSelectedAction(null);
        }}
        onSuccess={async () => {
          setShowEditActionModal(false);
          setSelectedAction(null);
          await viewIssueDetails(selectedIssue.issue_id);
        }}
      />
    </div>
  );
}

// Create Issue Modal Component
function CreateIssueModal({ show, people, projects, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    issue_number: `ISS-${Date.now()}`,
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Open',
    category: '',
    raised_by: '',
    assigned_to: '',
    raised_date: getTodayForInput(),
    project_id: ''
  });
  const [loading, setLoading] = useState(false);

  // Set default project if only one exists
  useEffect(() => {
    if (projects.length === 1 && !formData.project_id) {
      setFormData(prev => ({ ...prev, project_id: projects[0].project_id }));
    }
  }, [projects, formData.project_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await apiService.createIssue({
        ...formData,
        raised_by: formData.raised_by ? parseInt(formData.raised_by) : null,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
        project_id: formData.project_id ? parseInt(formData.project_id) : 1
      });
      onSuccess();
      // Reset form
      setFormData({
        issue_number: `ISS-${Date.now()}`,
        title: '',
        description: '',
        priority: 'Medium',
        status: 'Open',
        category: '',
        raised_by: '',
        assigned_to: '',
        raised_date: getTodayForInput(),
        project_id: projects.length === 1 ? projects[0].project_id : ''
      });
    } catch (err) {
      console.error('Error creating issue:', err);
      alert('Failed to create issue');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Create New Issue</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Issue Number</label>
            <input
              type="text"
              value={formData.issue_number}
              onChange={(e) => setFormData({ ...formData, issue_number: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              readOnly
            />
          </div>

          {projects.length > 1 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project *</label>
              <select
                value={formData.project_id}
                onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="4"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Performance, Security, UI"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Raised By *</label>
              <select
                value={formData.raised_by}
                onChange={(e) => setFormData({ ...formData, raised_by: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Unassigned</option>
                {people.map(person => (
                  <option key={person.person_id} value={person.person_id}>
                    {person.full_name}
                  </option>
                ))}
              </select>
            </div>
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Issue Detail Modal Component
function IssueDetailModal({ show, issue, onClose, onEdit, onDelete, onStatusChange, onAddAction, onEditAction, onDeleteAction, onActionStatusChange }) {
  if (!show || !issue) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{issue.issue_number}</h2>
            <p className="text-gray-600">{issue.title}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onEdit}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
              title="Edit Issue"
            >
              <Edit className="w-5 h-5" />
            </button>
            <button
              onClick={onDelete}
              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
              title="Delete Issue"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Quick Status Update */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Status Update</label>
            <div className="flex gap-2">
              {['Open', 'In Progress', 'Resolved', 'Closed'].map((status) => (
                <button
                  key={status}
                  onClick={() => onStatusChange(issue.issue_id, status)}
                  className={`px-4 py-2 rounded-lg border text-sm font-medium ${
                    issue.status === status
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Issue Info */}
          <div className="grid grid-cols-2 gap-4">
            <InfoField label="Status" value={issue.status} />
            <InfoField label="Priority" value={issue.priority} />
            <InfoField label="Category" value={issue.category} />
            <InfoField label="Raised By" value={issue.raiser?.full_name || 'Unknown'} />
            <InfoField label="Assigned To" value={issue.assignee?.full_name || 'Unassigned'} />
            <InfoField label="Raised Date" value={formatDate(issue.raised_date)} />
            <InfoField label="Target Resolution" value={formatDate(issue.target_resolution_date)} />
            <InfoField label="Actual Resolution" value={formatDate(issue.actual_resolution_date)} />
          </div>

          {/* Description */}
          {issue.description && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{issue.description}</p>
            </div>
          )}

          {/* Impact */}
          {issue.impact && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Impact</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{issue.impact}</p>
            </div>
          )}

          {/* Actions */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Actions ({issue.actions?.length || 0})</h3>
              <button
                onClick={onAddAction}
                className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Action
              </button>
            </div>
            
            {issue.actions && issue.actions.length > 0 ? (
              <div className="space-y-3">
                {issue.actions.map((action) => (
                  <div key={action.action_id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{action.action_description}</p>
                        <div className="flex gap-4 mt-2 text-sm text-gray-600">
                          <span>Status: <span className="font-medium">{action.status}</span></span>
                          {action.due_date && <span>Due: {formatDate(action.due_date)}</span>}
                          {action.assigned_to_name && <span>Assigned to: {action.assigned_to_name}</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        {action.status === 'Pending' && (
                          <button
                            onClick={() => onActionStatusChange(issue.issue_id, action.action_id, 'In Progress')}
                            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                          >
                            Start
                          </button>
                        )}
                        {action.status === 'In Progress' && (
                          <button
                            onClick={() => onActionStatusChange(issue.issue_id, action.action_id, 'Completed')}
                            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            Complete
                          </button>
                        )}
                        <button
                          onClick={() => onEditAction(action)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="Edit Action"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteAction(issue.issue_id, action.action_id)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded"
                          title="Delete Action"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {action.notes && (
                      <p className="text-sm text-gray-600 mt-2">{action.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No actions yet</p>
            )}
          </div>

          {/* Activity Log */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Activity Log</h3>
            {issue.log && issue.log.length > 0 ? (
              <div className="space-y-2">
                {issue.log.map((entry, index) => (
                  <div key={index} className="text-sm border-l-2 border-gray-300 pl-4 py-2">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-gray-900">{entry.log_type}</span>
                      <span className="text-gray-500">{formatDateTime(entry.log_date)}</span>
                    </div>
                    {entry.comments && (
                      <p className="text-gray-600 mt-1">{entry.comments}</p>
                    )}
                    {entry.logged_by_name && (
                      <p className="text-gray-500 text-xs mt-1">by {entry.logged_by_name}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No activity yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit Issue Modal Component
function EditIssueModal({ show, issue, people, projects, onClose, onSuccess }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (issue) {
      setFormData({
        title: issue.title || '',
        description: issue.description || '',
        priority: issue.priority || 'Medium',
        status: issue.status || 'Open',
        category: issue.category || '',
        assigned_to: issue.assigned_to || '',
        target_resolution_date: issue.target_resolution_date || '',
        impact: issue.impact || '',
        project_id: issue.project_id || ''
      });
    }
  }, [issue]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await apiService.updateIssue(issue.issue_id, {
        ...formData,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
        project_id: formData.project_id ? parseInt(formData.project_id) : undefined,
        updated_by: 1
      });
      onSuccess();
    } catch (err) {
      console.error('Error updating issue:', err);
      alert('Failed to update issue');
    } finally {
      setLoading(false);
    }
  };

  if (!show || !issue) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Edit Issue</h2>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="4"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Performance, Security, UI"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Unassigned</option>
              {people.map(person => (
                <option key={person.person_id} value={person.person_id}>
                  {person.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Target Resolution Date</label>
            <input
              type="date"
              value={formData.target_resolution_date}
              onChange={(e) => setFormData({ ...formData, target_resolution_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Impact</label>
            <textarea
              value={formData.impact}
              onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add Action Modal Component
function AddActionModal({ show, issueId, people, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    action_description: '',
    action_type: '',
    priority: 'Medium',
    assigned_to: '',
    due_date: getFutureDateForInput(7),
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await apiService.createIssueAction(issueId, {
        ...formData,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
        created_by: 1,
        created_date: getTodayForInput(),
        status: 'Pending'
      });
      onSuccess();
      // Reset form
      setFormData({
        action_description: '',
        action_type: '',
        priority: 'Medium',
        assigned_to: '',
        due_date: getFutureDateForInput(7),
        notes: ''
      });
    } catch (err) {
      console.error('Error creating action:', err);
      alert('Failed to create action');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Add Action</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action Description *</label>
            <textarea
              value={formData.action_description}
              onChange={(e) => setFormData({ ...formData, action_description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Type</label>
              <input
                type="text"
                value={formData.action_type}
                onChange={(e) => setFormData({ ...formData, action_type: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Investigation, Fix, Review"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Unassigned</option>
              {people.map(person => (
                <option key={person.person_id} value={person.person_id}>
                  {person.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Action'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Action Modal Component
function EditActionModal({ show, issueId, action, people, onClose, onSuccess }) {
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (action) {
      setFormData({
        action_description: action.action_description || '',
        status: action.status || 'Pending',
        assigned_to: action.assigned_to || '',
        due_date: action.due_date || '',
        notes: action.notes || ''
      });
    }
  }, [action]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await apiService.updateIssueAction(issueId, action.action_id, {
        ...formData,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
        updated_by: 1
      });
      onSuccess();
    } catch (err) {
      console.error('Error updating action:', err);
      alert('Failed to update action');
    } finally {
      setLoading(false);
    }
  };

  if (!show || !action) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Edit Action</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Action Description *</label>
            <textarea
              value={formData.action_description}
              onChange={(e) => setFormData({ ...formData, action_description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="3"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
            <select
              value={formData.assigned_to}
              onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Unassigned</option>
              {people.map(person => (
                <option key={person.person_id} value={person.person_id}>
                  {person.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Info Field Component
function InfoField({ label, value }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-500">{label}</label>
      <p className="text-gray-900 mt-1">{value || 'Not set'}</p>
    </div>
  );
}

export default Issues;
