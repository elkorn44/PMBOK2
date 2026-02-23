import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, X, Eye, Edit, Trash2, Check, User, Mail, Briefcase } from 'lucide-react';
import apiService from '../services/api';
import { formatDateTime } from '../utils/dateFormat';

function People() {
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Performance: useRef latch to prevent duplicate fetches
  const fetchedPeople = useRef(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('true'); // Default to active only
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPerson, setSelectedPerson] = useState(null);

  // Get unique roles and departments for filters
  const uniqueRoles = [...new Set(people.map(p => p.role).filter(Boolean))];
  const uniqueDepartments = [...new Set(people.map(p => p.department).filter(Boolean))];

  // Fetch people
  const fetchPeople = useCallback(async () => {
    try {
      setLoading(true);
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (roleFilter) filters.role = roleFilter;
      if (departmentFilter) filters.department = departmentFilter;
      if (activeFilter !== '') filters.is_active = activeFilter;
      
      const response = await apiService.getPeople(filters);
      setPeople(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching people:', err);
      setError('Failed to load people');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, roleFilter, departmentFilter, activeFilter]);

  // Initial fetch with race condition guard
  useEffect(() => {
    if (fetchedPeople.current) return;
    fetchPeople();
    fetchedPeople.current = true;
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined && fetchedPeople.current) {
        fetchPeople();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchPeople]);

  // Filters (immediate)
  useEffect(() => {
    if (fetchedPeople.current) {
      fetchPeople();
    }
  }, [roleFilter, departmentFilter, activeFilter]);

  // View person details
  const viewPersonDetails = async (personId) => {
    try {
      const response = await apiService.getPersonById(personId);
      setSelectedPerson(response.data);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Error loading person details:', err);
      alert('Failed to load person details');
    }
  };

  // Delete person - STRICT: Cannot delete if ANY attachments exist
  const deletePerson = async (personId) => {
    try {
      const person = selectedPerson;
      
      // Check for ANY attachments
      const activeActionsCount = person.active_actions?.total || 0;
      const openIssues = person.ownership?.open_issues_raised || 0;
      const activeRisks = person.ownership?.active_risks_owned || 0;
      
      const totalAttachments = activeActionsCount + openIssues + activeRisks;
      
      // STRICT: Prevent deletion if ANY attachments exist
      if (totalAttachments > 0) {
        let errorMessage = `❌ CANNOT DEACTIVATE: "${person.full_name}" has attached records:\n\n`;
        if (activeActionsCount > 0) errorMessage += `• ${activeActionsCount} active action(s) assigned\n`;
        if (openIssues > 0) errorMessage += `• ${openIssues} open issue(s) raised\n`;
        if (activeRisks > 0) errorMessage += `• ${activeRisks} active risk(s) owned\n`;
        errorMessage += '\n⚠️ You must reassign ALL work items before deactivating this person.';
        errorMessage += '\n\nPeople with active work cannot be deactivated.';
        
        alert(errorMessage);
        return;
      }
      
      // No attachments - safe to deactivate
      const confirmMessage = `Are you sure you want to deactivate "${person.full_name}"?\n\nThe person will be set to INACTIVE (not deleted).\nThey can be reactivated later if needed.`;
      
      if (!window.confirm(confirmMessage)) {
        return;
      }

      await apiService.deletePerson(personId);
      setShowDetailModal(false);
      setSelectedPerson(null);
      await fetchPeople();
      alert('Person deactivated successfully');
    } catch (err) {
      console.error('Error deleting person:', err);
      const errorMsg = err.response?.data?.message || err.message;
      alert('Failed to deactivate person: ' + errorMsg);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">People</h1>
          <p className="mt-2 text-gray-600">Manage team members and users</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add Person
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search people..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Roles</option>
            {uniqueRoles.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>

          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {uniqueDepartments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={activeFilter}
            onChange={(e) => setActiveFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="true">Active Only</option>
            <option value="false">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{people.length}</p>
          <p className="text-sm text-gray-600">Total People</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {people.filter(p => p.is_active).length}
          </p>
          <p className="text-sm text-gray-600">Active</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-red-600">
            {people.filter(p => !p.is_active).length}
          </p>
          <p className="text-sm text-gray-600">Inactive</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {people.reduce((sum, p) => sum + (p.workload?.total_active_actions || 0), 0)}
          </p>
          <p className="text-sm text-gray-600">Active Actions</p>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Loading people...</p>
        </div>
      )}

      {/* People Table */}
      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Person</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Workload</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {people.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || roleFilter || departmentFilter || activeFilter
                      ? 'No people match your filters'
                      : 'No people found. Add your first person!'}
                  </td>
                </tr>
              ) : (
                people.map((person) => (
                  <tr 
                    key={person.person_id} 
                    className={`hover:bg-gray-50 cursor-pointer ${!person.is_active ? 'bg-gray-100 text-gray-500' : ''}`}
                    onClick={() => viewPersonDetails(person.person_id)}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">{person.full_name}</div>
                          <div className="text-sm text-gray-500">@{person.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        {person.email && <Mail className="w-3 h-3 text-gray-400" />}
                        {person.email || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {person.role || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {person.department || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        person.is_active 
                          ? 'bg-green-100 text-green-800 border border-green-200' 
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {person.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {person.workload?.total_active_actions || 0}
                        </span>
                        {person.workload?.total_active_actions > 10 && (
                          <span className="text-xs text-red-600 font-medium">High</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          viewPersonDetails(person.person_id);
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
      <CreatePersonModal
        show={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchPeople();
        }}
      />

      {showDetailModal && selectedPerson && (
        <PersonDetailModal
          person={selectedPerson}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedPerson(null);
          }}
          onDelete={deletePerson}
          onRefresh={() => viewPersonDetails(selectedPerson.person_id)}
        />
      )}
    </div>
  );
}

// Create Person Modal - ALL FIELDS
function CreatePersonModal({ show, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    role: '',
    department: '',
    is_active: true
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await apiService.createPerson(formData);
      onSuccess();
      
      // Reset form
      setFormData({
        username: '',
        full_name: '',
        email: '',
        role: '',
        department: '',
        is_active: true
      });
    } catch (err) {
      console.error('Error creating person:', err);
      alert('Failed to create person: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Add Person</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., jsmith"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Unique username for login</p>
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., John Smith"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., john.smith@company.com"
            />
          </div>

          {/* Role & Department */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input
                type="text"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Project Manager"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Engineering"
              />
            </div>
          </div>

          {/* Is Active */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">Inactive users cannot be assigned new work</p>
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
              {loading ? 'Adding...' : 'Add Person'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Person Detail Modal with Sticky Header and Remote Submit
function PersonDetailModal({ person, onClose, onDelete, onRefresh }) {
  const [editMode, setEditMode] = useState(false);
  
  // Edit form state (ALL FIELDS)
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    email: '',
    role: '',
    department: '',
    is_active: true
  });

  // Initialize form data from person
  useEffect(() => {
    if (person) {
      setFormData({
        username: person.username || '',
        full_name: person.full_name || '',
        email: person.email || '',
        role: person.role || '',
        department: person.department || '',
        is_active: person.is_active !== undefined ? person.is_active : true
      });
    }
  }, [person]);

  // Handle edit form submit (Remote Submit)
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await apiService.updatePerson(person.person_id, formData);
      setEditMode(false);
      await onRefresh();
      alert('Person updated successfully');
    } catch (err) {
      console.error('Error updating person:', err);
      alert('Failed to update person: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] overflow-y-auto">
        {/* Sticky Header with Icons - justify-between */}
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Person Details</h2>
          <div className="flex items-center gap-2">
            {/* Remote Submit - Checkmark Icon */}
            {editMode && (
              <button
                type="submit"
                form="editPersonForm"
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
                title="Edit Person"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
            {/* Delete Icon */}
            <button
              onClick={() => onDelete(person.person_id)}
              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg"
              title="Deactivate Person"
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
        <form id="editPersonForm" onSubmit={handleEditSubmit} className="p-6 space-y-6">
          {/* Header Info */}
          <div className="border-b pb-4">
            <div className="flex items-start gap-3">
              <User className="w-6 h-6 text-blue-600 mt-1" />
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">{person.full_name}</h3>
                <p className="text-gray-500 mt-1">@{person.username}</p>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <span className={`px-3 py-1 text-sm font-semibold rounded-full ${
                person.is_active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {person.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>

          {/* Person Details - ALL FIELDS */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Personal Information</h4>
            
            {editMode ? (
              <>
                {/* Editable Fields */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <input
                      type="text"
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Active</span>
                  </label>
                </div>
              </>
            ) : (
              <>
                {/* Read-only Display */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Username</label>
                    <p className="mt-1 text-gray-900">@{person.username}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Full Name</label>
                    <p className="mt-1 text-gray-900">{person.full_name}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-gray-900">{person.email || 'Not provided'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Role</label>
                    <p className="mt-1 text-gray-900">{person.role || 'Not specified'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Department</label>
                    <p className="mt-1 text-gray-900">{person.department || 'Not specified'}</p>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Created</label>
                  <p className="mt-1 text-gray-900">{formatDateTime(person.created_at)}</p>
                </div>
              </>
            )}
          </div>

          {/* Workload & Ownership (Read-only) */}
          {!editMode && person.active_actions && (
            <div className="border-t pt-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">Active Workload</h4>
              
              {/* Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-900">{person.active_actions.total || 0}</p>
                  <p className="text-xs text-blue-700">Total Active Actions</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-orange-900">{person.ownership?.open_issues_raised || 0}</p>
                  <p className="text-xs text-orange-700">Open Issues Raised</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-red-900">{person.ownership?.active_risks_owned || 0}</p>
                  <p className="text-xs text-red-700">Active Risks Owned</p>
                </div>
                <div className={`border rounded-lg p-3 text-center ${
                  person.active_actions.total > 10 
                    ? 'bg-red-50 border-red-200' 
                    : person.active_actions.total > 5 
                    ? 'bg-yellow-50 border-yellow-200' 
                    : 'bg-green-50 border-green-200'
                }`}>
                  <p className={`text-2xl font-bold ${
                    person.active_actions.total > 10 
                      ? 'text-red-900' 
                      : person.active_actions.total > 5 
                      ? 'text-yellow-900' 
                      : 'text-green-900'
                  }`}>
                    {person.active_actions.total > 10 ? 'High' : person.active_actions.total > 5 ? 'Med' : 'Low'}
                  </p>
                  <p className="text-xs text-gray-700">Load Level</p>
                </div>
              </div>

              {/* Active Actions Details */}
              {person.active_actions.total > 0 && (
                <div className="space-y-3">
                  {/* Issue Actions */}
                  {person.active_actions.issue_actions?.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">
                        Issue Actions ({person.active_actions.issue_actions.length})
                      </h5>
                      <div className="space-y-2">
                        {person.active_actions.issue_actions.slice(0, 3).map((action, idx) => (
                          <div key={idx} className="bg-orange-50 border border-orange-200 rounded p-2 text-sm">
                            <p className="font-medium text-gray-900">{action.action_description}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {action.issue_number} - {action.issue_title} ({action.project_name})
                            </p>
                          </div>
                        ))}
                        {person.active_actions.issue_actions.length > 3 && (
                          <p className="text-xs text-gray-500 pl-2">
                            +{person.active_actions.issue_actions.length - 3} more...
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Risk Actions */}
                  {person.active_actions.risk_actions?.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">
                        Risk Actions ({person.active_actions.risk_actions.length})
                      </h5>
                      <div className="space-y-2">
                        {person.active_actions.risk_actions.slice(0, 3).map((action, idx) => (
                          <div key={idx} className="bg-red-50 border border-red-200 rounded p-2 text-sm">
                            <p className="font-medium text-gray-900">{action.action_description}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {action.risk_number} - {action.risk_title} ({action.project_name})
                            </p>
                          </div>
                        ))}
                        {person.active_actions.risk_actions.length > 3 && (
                          <p className="text-xs text-gray-500 pl-2">
                            +{person.active_actions.risk_actions.length - 3} more...
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Change Actions */}
                  {person.active_actions.change_actions?.length > 0 && (
                    <div>
                      <h5 className="text-sm font-semibold text-gray-900 mb-2">
                        Change Actions ({person.active_actions.change_actions.length})
                      </h5>
                      <div className="space-y-2">
                        {person.active_actions.change_actions.slice(0, 3).map((action, idx) => (
                          <div key={idx} className="bg-purple-50 border border-purple-200 rounded p-2 text-sm">
                            <p className="font-medium text-gray-900">{action.action_description}</p>
                            <p className="text-xs text-gray-600 mt-1">
                              {action.change_number} - {action.change_title} ({action.project_name})
                            </p>
                          </div>
                        ))}
                        {person.active_actions.change_actions.length > 3 && (
                          <p className="text-xs text-gray-500 pl-2">
                            +{person.active_actions.change_actions.length - 3} more...
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {person.active_actions.total === 0 && person.ownership?.open_issues_raised === 0 && person.ownership?.active_risks_owned === 0 && (
                <p className="text-sm text-gray-500 text-center py-4">No active work items</p>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default People;
