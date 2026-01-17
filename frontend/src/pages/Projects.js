import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, X, Eye, Edit, Trash2, Check, Building2, Calendar, User } from 'lucide-react';
import apiService from '../services/api';
import { formatDate, formatDateTime, getTodayForInput } from '../utils/dateFormat';

function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Performance: useRef latch to prevent duplicate fetches
  const fetchedProjects = useRef(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);

  // Fetch projects
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter) filters.status = statusFilter;
      
      const response = await apiService.getProjects(filters);
      setProjects(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  // Initial fetch with race condition guard
  useEffect(() => {
    if (fetchedProjects.current) return;
    fetchProjects();
    fetchedProjects.current = true;
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined && fetchedProjects.current) {
        fetchProjects();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchProjects]);

  // Status filter (immediate)
  useEffect(() => {
    if (fetchedProjects.current) {
      fetchProjects();
    }
  }, [statusFilter]);

  // View project details
  const viewProjectDetails = async (projectId) => {
    try {
      const response = await apiService.getProjectById(projectId);
      setSelectedProject(response.data);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Error loading project details:', err);
      alert('Failed to load project details');
    }
  };

  // Delete project with validation
  const deleteProject = async (projectId) => {
    try {
      // Check if it's the only project
      if (projects.length === 1) {
        alert('Cannot delete the only project in the system. At least one project must exist.');
        return;
      }

      // Get project details to check for attached records
      const response = await apiService.getProjectById(projectId);
      const project = response.data;

      // Count attached records
      const attachedCounts = {
        issues: project.issues?.length || 0,
        risks: project.risks?.length || 0,
        changes: project.changes?.length || 0,
        escalations: project.escalations?.length || 0,
        faults: project.faults?.length || 0
      };

      const totalAttached = Object.values(attachedCounts).reduce((sum, count) => sum + count, 0);

      // Build warning message
      let warningMessage = `Are you sure you want to delete project "${project.project_name}"?`;
      
      if (totalAttached > 0) {
        warningMessage += '\n\n⚠️ WARNING: This will also delete all attached records:\n';
        if (attachedCounts.issues > 0) warningMessage += `\n• ${attachedCounts.issues} Issues`;
        if (attachedCounts.risks > 0) warningMessage += `\n• ${attachedCounts.risks} Risks`;
        if (attachedCounts.changes > 0) warningMessage += `\n• ${attachedCounts.changes} Changes`;
        if (attachedCounts.escalations > 0) warningMessage += `\n• ${attachedCounts.escalations} Escalations`;
        if (attachedCounts.faults > 0) warningMessage += `\n• ${attachedCounts.faults} Faults`;
        warningMessage += '\n\nThis action cannot be undone!';
      }

      if (!window.confirm(warningMessage)) {
        return;
      }

      await apiService.deleteProject(projectId);
      setShowDetailModal(false);
      setSelectedProject(null);
      await fetchProjects();
      alert('Project deleted successfully');
    } catch (err) {
      console.error('Error deleting project:', err);
      alert('Failed to delete project: ' + (err.response?.data?.message || err.message));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Planning': 'bg-blue-100 text-blue-800 border-blue-200',
      'Active': 'bg-green-100 text-green-800 border-green-200',
      'On Hold': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Completed': 'bg-gray-100 text-gray-800 border-gray-200',
      'Cancelled': 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
          <p className="mt-2 text-gray-600">Manage your project portfolio</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Create Project
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
                placeholder="Search projects..."
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
            <option value="Planning">Planning</option>
            <option value="Active">Active</option>
            <option value="On Hold">On Hold</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
          <p className="text-sm text-gray-600">Total Projects</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {projects.filter(p => p.status === 'Planning').length}
          </p>
          <p className="text-sm text-gray-600">Planning</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {projects.filter(p => p.status === 'Active').length}
          </p>
          <p className="text-sm text-gray-600">Active</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-yellow-600">
            {projects.filter(p => p.status === 'On Hold').length}
          </p>
          <p className="text-sm text-gray-600">On Hold</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-600">
            {projects.filter(p => p.status === 'Completed').length}
          </p>
          <p className="text-sm text-gray-600">Completed</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Loading projects...</p>
        </div>
      )}

      {/* Projects Table */}
      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Manager</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || statusFilter
                      ? 'No projects match your filters'
                      : 'No projects found. Create your first project!'}
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.project_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => viewProjectDetails(project.project_id)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{project.project_name}</div>
                          <div className="text-sm text-gray-500">{project.project_code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(project.status)}`}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {project.project_manager || 'Not assigned'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {project.client_name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1 text-xs">
                        <Calendar className="w-3 h-3" />
                        {project.start_date ? formatDate(project.start_date) : 'Not set'}
                        {project.end_date && ` - ${formatDate(project.end_date)}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewProjectDetails(project.project_id);
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
      <CreateProjectModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchProjects();
        }}
      />

      {showDetailModal && selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedProject(null);
          }}
          onDelete={deleteProject}
          onRefresh={() => viewProjectDetails(selectedProject.project_id)}
        />
      )}
    </div>
  );
}

// Create Project Modal - ALL FIELDS
function CreateProjectModal({ show, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    project_code: '',
    project_name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'Planning',
    project_manager: '',
    client_name: '',
    created_by: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Date handling: empty → null
      const payload = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };
      
      await apiService.createProject(payload);
      onSuccess();
      
      // Reset form
      setFormData({
        project_code: '',
        project_name: '',
        description: '',
        start_date: '',
        end_date: '',
        status: 'Planning',
        project_manager: '',
        client_name: '',
        created_by: ''
      });
    } catch (err) {
      console.error('Error creating project:', err);
      alert('Failed to create project: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Create Project</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Project Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Code *</label>
            <input
              type="text"
              value={formData.project_code}
              onChange={(e) => setFormData({ ...formData, project_code: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., PROJ-001"
              required
            />
          </div>

          {/* Project Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
            <input
              type="text"
              value={formData.project_name}
              onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Website Redesign Project"
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
              placeholder="Project description..."
            />
          </div>

          {/* Dates & Status */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Project Manager & Client */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Project Manager</label>
              <input
                type="text"
                value={formData.project_manager}
                onChange={(e) => setFormData({ ...formData, project_manager: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Manager name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
              <input
                type="text"
                value={formData.client_name}
                onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Client or organization"
              />
            </div>
          </div>

          {/* Created By */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
            <input
              type="text"
              value={formData.created_by}
              onChange={(e) => setFormData({ ...formData, created_by: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Your name"
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
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Project Detail Modal with Sticky Header and Remote Submit
function ProjectDetailModal({ project, onClose, onDelete, onRefresh }) {
  const [editMode, setEditMode] = useState(false);
  
  // Edit form state (ALL FIELDS)
  const [formData, setFormData] = useState({
    project_code: '',
    project_name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'Planning',
    project_manager: '',
    client_name: '',
    created_by: ''
  });

  // Initialize form data from project
  useEffect(() => {
    if (project) {
      setFormData({
        project_code: project.project_code || '',
        project_name: project.project_name || '',
        description: project.description || '',
        start_date: project.start_date || '',
        end_date: project.end_date || '',
        status: project.status || 'Planning',
        project_manager: project.project_manager || '',
        client_name: project.client_name || '',
        created_by: project.created_by || ''
      });
    }
  }, [project]);

  // Handle edit form submit (Remote Submit)
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Date handling: empty → null
      const payload = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      };
      
      await apiService.updateProject(project.project_id, payload);
      setEditMode(false);
      await onRefresh();
      alert('Project updated successfully');
    } catch (err) {
      console.error('Error updating project:', err);
      alert('Failed to update project: ' + (err.response?.data?.message || err.message));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'Planning': 'bg-blue-100 text-blue-800',
      'Active': 'bg-green-100 text-green-800',
      'On Hold': 'bg-yellow-100 text-yellow-800',
      'Completed': 'bg-gray-100 text-gray-800',
      'Cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Sticky Header with Icons - justify-between */}
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Project Details</h2>
          <div className="flex items-center gap-2">
            {/* Remote Submit - Checkmark Icon */}
            {editMode && (
              <button
                type="submit"
                form="editProjectForm"
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
                title="Edit Project"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
            {/* Delete Icon */}
            <button
              onClick={() => onDelete(project.project_id)}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
              title="Delete Project"
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
        <form id="editProjectForm" onSubmit={handleEditSubmit} className="p-6 space-y-6">
          {/* Header Info */}
          <div className="border-b pb-4">
            <div className="flex items-start gap-3">
              <Building2 className="w-6 h-6 text-blue-600 mt-1" />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">{project.project_name}</h3>
                <p className="text-gray-500 mt-1">{project.project_code}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(project.status)}`}>
                {project.status}
              </span>
            </div>
          </div>

          {/* Project Details - ALL FIELDS */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Project Information</h4>
            
            {editMode ? (
              <>
                {/* Editable Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Code *</label>
                    <input
                      type="text"
                      value={formData.project_code}
                      onChange={(e) => setFormData({ ...formData, project_code: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Name *</label>
                    <input
                      type="text"
                      value={formData.project_name}
                      onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
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

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Planning">Planning</option>
                      <option value="Active">Active</option>
                      <option value="On Hold">On Hold</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project Manager</label>
                    <input
                      type="text"
                      value={formData.project_manager}
                      onChange={(e) => setFormData({ ...formData, project_manager: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client Name</label>
                    <input
                      type="text"
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Created By</label>
                  <input
                    type="text"
                    value={formData.created_by}
                    onChange={(e) => setFormData({ ...formData, created_by: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            ) : (
              <>
                {/* Read-only Display */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Project Code</label>
                    <p className="mt-1 text-gray-900">{project.project_code}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Project Name</label>
                    <p className="mt-1 text-gray-900">{project.project_name}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="mt-1 text-gray-900 whitespace-pre-wrap">{project.description || 'No description'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Start Date</label>
                    <p className="mt-1 text-gray-900">{project.start_date ? formatDate(project.start_date) : 'Not set'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">End Date</label>
                    <p className="mt-1 text-gray-900">{project.end_date ? formatDate(project.end_date) : 'Not set'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Project Manager</label>
                    <p className="mt-1 text-gray-900">{project.project_manager || 'Not assigned'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Client Name</label>
                    <p className="mt-1 text-gray-900">{project.client_name || 'N/A'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created By</label>
                    <p className="mt-1 text-gray-900">{project.created_by || 'Unknown'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Created At</label>
                    <p className="mt-1 text-gray-900">{formatDateTime(project.created_at)}</p>
                  </div>
                </div>

                {project.updated_at && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Last Updated</label>
                    <p className="mt-1 text-gray-900">{formatDateTime(project.updated_at)}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Attached Records Summary (Read-only) */}
          {!editMode && (
            <div className="border-t pt-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Attached Records</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-orange-900">{project.issues?.length || 0}</p>
                  <p className="text-xs text-orange-700">Issues</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-900">{project.risks?.length || 0}</p>
                  <p className="text-xs text-red-700">Risks</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-purple-900">{project.changes?.length || 0}</p>
                  <p className="text-xs text-purple-700">Changes</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-yellow-900">{project.escalations?.length || 0}</p>
                  <p className="text-xs text-yellow-700">Escalations</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-900">{project.faults?.length || 0}</p>
                  <p className="text-xs text-blue-700">Faults</p>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default Projects;
