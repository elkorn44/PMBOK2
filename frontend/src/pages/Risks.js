import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Plus, Search, X, Eye, Edit, Trash2, CheckCircle, Clock } from 'lucide-react';
import apiService from '../services/api';
import { useProject } from '../context/ProjectContext';
import { formatDate, formatDateTime, getTodayForInput, getFutureDateForInput } from '../utils/dateFormat';

function Risks() {
  // Get selected project from context
  const { selectedProject, getSelectedProjectName } = useProject();
  
  const [risks, setRisks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [people, setPeople] = useState([]);
  const [projects, setProjects] = useState([]);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [probabilityFilter, setProbabilityFilter] = useState('');
  
  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddActionModal, setShowAddActionModal] = useState(false);
  const [showEditActionModal, setShowEditActionModal] = useState(false);
  const [showClosureRequestModal, setShowClosureRequestModal] = useState(false);
  const [selectedRisk, setSelectedRisk] = useState(null);
  const [selectedAction, setSelectedAction] = useState(null);

  // Debug: Track closure modal state
  useEffect(() => {
    console.log('🎭 Modal States:', {
      showClosureRequestModal,
      hasSelectedRisk: !!selectedRisk,
      selectedRiskTitle: selectedRisk?.title
    });
  }, [showClosureRequestModal, selectedRisk]);

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

  // Fetch risks with filters
  const fetchRisks = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching risks for project:', selectedProject || 'All');
      
      const filters = {};
      if (searchTerm) filters.search = searchTerm;
      if (statusFilter) filters.status = statusFilter;
      if (probabilityFilter) filters.probability = probabilityFilter;
      if (selectedProject) filters.project_id = selectedProject;
      
      const response = await apiService.getRisks(filters);
      
      // Handle different response structures
      let risksArray = [];
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        risksArray = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        risksArray = response.data;
      } else if (Array.isArray(response)) {
        risksArray = response;
      }
      
      console.log('✅ Loaded', risksArray.length, 'risks');
      setRisks(risksArray);
      setError(null);
    } catch (err) {
      console.error('Error fetching risks:', err);
      setError('Failed to load risks');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, probabilityFilter, selectedProject]);

  useEffect(() => {
    fetchRisks();
  }, [fetchRisks]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchRisks();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, fetchRisks]);

  // View risk details
  const viewRiskDetails = async (riskId) => {
    try {
      const response = await apiService.getRiskById(riskId);
      setSelectedRisk(response.data);
      setShowDetailModal(true);
    } catch (err) {
      console.error('Error loading risk details:', err);
      alert('Failed to load risk details');
    }
  };

  // Update risk status (with closure workflow check)
  const updateRiskStatus = async (riskId, newStatus) => {
    try {
      console.log('🔄 Status change requested:', newStatus);
      console.log('🔍 Current selectedRisk before:', selectedRisk ? selectedRisk.title : 'NULL');
      
      // Check if trying to close
      if (newStatus === 'Closed') {
        console.log('🔒 Closure requested - checking if risk is mitigated...');
        
        // Get current risk to check if it's mitigated
        const response = await apiService.getRiskById(riskId);
        const currentRisk = response.data;
        
        console.log('📊 Current risk status:', currentRisk.status);
        console.log('📊 Risk data from API:', currentRisk.title, currentRisk.risk_id);
        
        if (currentRisk.status !== 'Mitigated') {
          alert('Risk must be in "Mitigated" status before requesting closure.\n\nCurrent status: ' + currentRisk.status);
          return;
        }
        
        console.log('✅ Risk is mitigated - showing closure request modal');
        console.log('📝 About to set states...');
        console.log('   Setting selectedRisk to:', currentRisk.title);
        console.log('   Setting showClosureRequestModal to: true');
        
        // Set both states together
        setSelectedRisk(currentRisk);
        setShowClosureRequestModal(true);
        
        console.log('✅ States have been set (React will batch update)');
        
        // DO NOT close detail modal - keep it open underneath
        return;
      }
      
      console.log('✅ Normal status update to:', newStatus);
      
      // Normal status update
      await apiService.updateRisk(riskId, { 
        status: newStatus,
        updated_by: 1 
      });
      
      // Only refresh the current risk details, not the full list
      await viewRiskDetails(riskId);
      // Don't call fetchRisks here - reduces API calls
    } catch (err) {
      console.error('❌ Error updating status:', err);
      alert('Failed to update status: ' + (err.response?.data?.message || err.message));
    }
  };

  // Delete risk
  const deleteRisk = async (riskId) => {
    if (!window.confirm('Are you sure you want to delete this risk? This will also delete all associated actions. This action cannot be undone.')) {
      return;
    }
    
    try {
      await apiService.deleteRisk(riskId);
      setShowDetailModal(false);
      setSelectedRisk(null);
      await fetchRisks();
      alert('Risk deleted successfully');
    } catch (err) {
      console.error('Error deleting risk:', err);
      alert('Failed to delete risk');
    }
  };

  // Calculate risk score
  const calculateRiskScore = (probability, impact) => {
    const probValues = { 'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5 };
    const impactValues = { 'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5 };
    return (probValues[probability] || 0) * (impactValues[impact] || 0);
  };

  // Get risk score color
  const getRiskScoreColor = (score) => {
    if (score >= 16) return 'bg-red-100 text-red-800 border-red-200';
    if (score >= 12) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (score >= 6) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      Identified: 'bg-blue-100 text-blue-800 border-blue-200',
      Assessed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      Mitigated: 'bg-green-100 text-green-800 border-green-200',
      Closed: 'bg-gray-100 text-gray-800 border-gray-200',
      Occurred: 'bg-red-100 text-red-800 border-red-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Risk Management</h1>
          <p className="mt-2 text-gray-600">Track and manage project risks</p>
          {selectedProject && (
            <p className="text-sm text-gray-600 mt-1">
              Project: <span className="font-semibold text-gray-900">{getSelectedProjectName()}</span>
            </p>
          )}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
        >
          <Plus className="w-5 h-5" />
          Create Risk
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
                placeholder="Search risks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Statuses</option>
            <option value="Identified">Identified</option>
            <option value="Assessed">Assessed</option>
            <option value="Mitigated">Mitigated</option>
            <option value="Closed">Closed</option>
            <option value="Occurred">Occurred</option>
          </select>

          <select
            value={probabilityFilter}
            onChange={(e) => setProbabilityFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
          >
            <option value="">All Probabilities</option>
            <option value="Very Low">Very Low</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Very High">Very High</option>
          </select>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-gray-900">{risks.length}</p>
          <p className="text-sm text-gray-600">Total Risks</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-red-600">
            {risks.filter(r => calculateRiskScore(r.probability, r.impact) >= 16).length}
          </p>
          <p className="text-sm text-gray-600">Critical</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">
            {risks.filter(r => {
              const score = calculateRiskScore(r.probability, r.impact);
              return score >= 12 && score < 16;
            }).length}
          </p>
          <p className="text-sm text-gray-600">High</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">
            {risks.filter(r => r.status === 'Identified').length}
          </p>
          <p className="text-sm text-gray-600">Identified</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4 text-center">
          <p className="text-2xl font-bold text-green-600">
            {risks.filter(r => r.status === 'Mitigated').length}
          </p>
          <p className="text-sm text-gray-600">Mitigated</p>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <p className="text-gray-600 mt-4">Loading risks...</p>
        </div>
      )}

      {/* Risks Table */}
      {!loading && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Risk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Probability
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Impact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
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
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    {searchTerm || statusFilter || probabilityFilter || selectedProject
                      ? 'No risks match your filters'
                      : 'No risks found. Create your first risk!'}
                  </td>
                </tr>
              ) : (
                risks.map((risk) => {
                  const score = calculateRiskScore(risk.probability, risk.impact);
                  return (
                    <tr key={risk.risk_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{risk.title}</div>
                        <div className="text-sm text-gray-500">{risk.risk_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {risk.probability}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {risk.impact}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRiskScoreColor(score)}`}>
                          {score}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getStatusColor(risk.status)}`}>
                          {risk.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => viewRiskDetails(risk.risk_id)}
                          className="text-orange-600 hover:text-orange-900"
                          title="View Details"
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

      {/* Modals */}
      <CreateRiskModal
        show={showCreateModal}
        people={people}
        projects={projects}
        selectedProject={selectedProject}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          fetchRisks();
        }}
      />

      {showDetailModal && selectedRisk && (
        <RiskDetailModal
          risk={selectedRisk}
          people={people}
          onClose={() => {
            console.log('🚪 Closing detail modal');
            setShowDetailModal(false);
            setSelectedRisk(null);
          }}
          onStatusUpdate={updateRiskStatus}
          onRequestClosure={() => {
            console.log('🔒 onRequestClosure called - opening closure modal');
            console.log('   Current risk:', selectedRisk.title);
            console.log('   Current status:', selectedRisk.status);
            setShowClosureRequestModal(true);
          }}
          onDelete={deleteRisk}
          onEdit={() => {
            setShowDetailModal(false);
            setShowEditModal(true);
          }}
          onAddAction={() => {
            setShowDetailModal(false);
            setShowAddActionModal(true);
          }}
          onEditAction={(action) => {
            setSelectedAction(action);
            setShowDetailModal(false);
            setShowEditActionModal(true);
          }}
          onRefresh={() => viewRiskDetails(selectedRisk.risk_id)}
        />
      )}

      {showEditModal && selectedRisk && (
        <EditRiskModal
          show={showEditModal}
          risk={selectedRisk}
          people={people}
          projects={projects}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRisk(null);
          }}
          onSuccess={async () => {
            setShowEditModal(false);
            await viewRiskDetails(selectedRisk.risk_id);
            await fetchRisks();
            setShowDetailModal(true);
          }}
        />
      )}

      {showAddActionModal && selectedRisk && (
        <AddActionModal
          show={showAddActionModal}
          riskId={selectedRisk.risk_id}
          people={people}
          onClose={() => {
            setShowAddActionModal(false);
          }}
          onSuccess={async () => {
            setShowAddActionModal(false);
            await viewRiskDetails(selectedRisk.risk_id);
            setShowDetailModal(true);
          }}
        />
      )}

      {showEditActionModal && selectedRisk && selectedAction && (
        <EditActionModal
          show={showEditActionModal}
          riskId={selectedRisk.risk_id}
          action={selectedAction}
          people={people}
          onClose={() => {
            setShowEditActionModal(false);
            setSelectedAction(null);
          }}
          onSuccess={async () => {
            setShowEditActionModal(false);
            setSelectedAction(null);
            await viewRiskDetails(selectedRisk.risk_id);
            setShowDetailModal(true);
          }}
        />
      )}

      {showClosureRequestModal && selectedRisk && (
        <RequestClosureModal
          risk={selectedRisk}
          onClose={() => {
            console.log('🚪 Closing closure request modal (user cancelled)');
            setShowClosureRequestModal(false);
            setShowDetailModal(false);
            setSelectedRisk(null);
          }}
          onSuccess={async () => {
            console.log('✅ Closure request successful');
            setShowClosureRequestModal(false);
            setShowDetailModal(false);
            setSelectedRisk(null);
            await fetchRisks();
          }}
        />
      )}
    </div>
  );
}

// Create Risk Modal Component
function CreateRiskModal({ show, people, projects, selectedProject, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    risk_number: `RSK-${Date.now()}`,
    title: '',
    description: '',
    category: '',
    probability: 'Medium',
    impact: 'Medium',
    status: 'Identified',
    identified_by: '',
    owner: '',
    identified_date: getTodayForInput(),
    review_date: '',
    mitigation_strategy: '',
    contingency_plan: '',
    project_id: selectedProject || ''
  });
  const [loading, setLoading] = useState(false);

  // Update project_id when selectedProject changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      project_id: selectedProject || prev.project_id
    }));
  }, [selectedProject]);

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
      await apiService.createRisk({
        ...formData,
        identified_by: formData.identified_by ? parseInt(formData.identified_by) : null,
        owner: formData.owner ? parseInt(formData.owner) : null,
        project_id: formData.project_id ? parseInt(formData.project_id) : null,
      });
      onSuccess();
      // Reset form
      setFormData({
        risk_number: `RSK-${Date.now()}`,
        title: '',
        description: '',
        category: '',
        probability: 'Medium',
        impact: 'Medium',
        status: 'Identified',
        identified_by: '',
        owner: '',
        identified_date: getTodayForInput(),
        review_date: '',
        mitigation_strategy: '',
        contingency_plan: '',
        project_id: selectedProject || (projects.length === 1 ? projects[0].project_id : '')
      });
    } catch (err) {
      console.error('Error creating risk:', err);
      alert('Failed to create risk');
    } finally {
      setLoading(false);
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Create New Risk</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Risk Number</label>
            <input
              type="text"
              value={formData.risk_number}
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., Technical, Financial, Schedule"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Probability *</label>
              <select
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                required
              >
                <option value="Very Low">Very Low</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Very High">Very High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Impact *</label>
              <select
                value={formData.impact}
                onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                required
              >
                <option value="Very Low">Very Low</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Very High">Very High</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Identified By *</label>
              <select
                value={formData.identified_by}
                onChange={(e) => setFormData({ ...formData, identified_by: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
              <select
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Identified Date *</label>
              <input
                type="date"
                value={formData.identified_date}
                onChange={(e) => setFormData({ ...formData, identified_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Review Date</label>
              <input
                type="date"
                value={formData.review_date}
                onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mitigation Strategy</label>
            <textarea
              value={formData.mitigation_strategy}
              onChange={(e) => setFormData({ ...formData, mitigation_strategy: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              rows="3"
              placeholder="Describe how to prevent or reduce this risk..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contingency Plan</label>
            <textarea
              value={formData.contingency_plan}
              onChange={(e) => setFormData({ ...formData, contingency_plan: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              rows="3"
              placeholder="Describe what to do if this risk occurs..."
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
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Risk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Risk Detail Modal Component
function RiskDetailModal({ risk, people, onClose, onStatusUpdate, onRequestClosure, onDelete, onEdit, onAddAction, onEditAction, onRefresh }) {
  const [actions, setActions] = useState([]);
  const [loadingActions, setLoadingActions] = useState(false);
  const [log, setLog] = useState([]);
  const [loadingLog, setLoadingLog] = useState(false);
  const [newLogEntry, setNewLogEntry] = useState('');
  const [addingLog, setAddingLog] = useState(false);

  // Calculate risk score
  const calculateScore = () => {
    const probValues = { 'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5 };
    const impactValues = { 'Very Low': 1, 'Low': 2, 'Medium': 3, 'High': 4, 'Very High': 5 };
    return (probValues[risk.probability] || 0) * (impactValues[risk.impact] || 0);
  };

  const score = calculateScore();

  // Fetch actions
  useEffect(() => {
    const fetchActions = async () => {
      try {
        setLoadingActions(true);
        const response = await apiService.getRiskActions(risk.risk_id);
        setActions(response.data || []);
      } catch (err) {
        console.error('Error fetching actions:', err);
      } finally {
        setLoadingActions(false);
      }
    };
    fetchActions();
  }, [risk.risk_id]);

  // Fetch log entries
  useEffect(() => {
    const fetchLog = async () => {
      try {
        setLoadingLog(true);
        const response = await apiService.getRiskLog(risk.risk_id);
        setLog(response.data || []);
      } catch (err) {
        console.error('Error fetching log:', err);
      } finally {
        setLoadingLog(false);
      }
    };
    fetchLog();
  }, [risk.risk_id]);

  // Update action status
  const updateActionStatus = async (actionId, newStatus) => {
    try {
      await apiService.updateRiskAction(risk.risk_id, actionId, {
        status: newStatus,
        updated_by: 1
      });
      onRefresh();
    } catch (err) {
      console.error('Error updating action status:', err);
      alert('Failed to update action status');
    }
  };

  // Delete action
  const deleteAction = async (actionId) => {
    if (!window.confirm('Are you sure you want to delete this action?')) {
      return;
    }
    
    try {
      await apiService.deleteRiskAction(risk.risk_id, actionId);
      onRefresh();
      alert('Action deleted successfully');
    } catch (err) {
      console.error('Error deleting action:', err);
      alert('Failed to delete action');
    }
  };

  // Add log entry
  const addLogEntry = async (e) => {
    e.preventDefault();
    if (!newLogEntry.trim()) return;
    
    setAddingLog(true);
    try {
      await apiService.addRiskLogEntry(risk.risk_id, {
        logged_by: 1,
        comments: newLogEntry
      });
      
      // Refresh log
      const response = await apiService.getRiskLog(risk.risk_id);
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

  const getRiskScoreColor = (score) => {
    if (score >= 16) return 'text-red-600';
    if (score >= 12) return 'text-orange-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Risk Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Header Section */}
          <div className="border-b pb-4">
            <h3 className="text-2xl font-bold text-gray-900">{risk.title}</h3>
            <p className="text-gray-500 mt-1">{risk.risk_number}</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Probability</p>
              <p className="text-lg font-semibold text-gray-900">{risk.probability}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Impact</p>
              <p className="text-lg font-semibold text-gray-900">{risk.impact}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Risk Score</p>
              <p className={`text-2xl font-bold ${getRiskScoreColor(score)}`}>{score}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Status</p>
              <select
                value={risk.status}
                onChange={(e) => {
                  const newStatus = e.target.value;
                  console.log('📝 Status dropdown changed to:', newStatus);
                  
                  // Special handling for closure
                  if (newStatus === 'Closed') {
                    console.log('🛑 User selected Closed - checking requirements...');
                    
                    // Reset dropdown immediately (don't let it change visually)
                    e.target.value = risk.status;
                    
                    // Check if risk is mitigated
                    if (risk.status !== 'Mitigated') {
                      alert('Risk must be in "Mitigated" status before requesting closure.\n\nCurrent status: ' + risk.status);
                      return;
                    }
                    
                    console.log('✅ Risk is mitigated - calling onRequestClosure');
                    // Call the dedicated closure handler (doesn't trigger status update)
                    onRequestClosure();
                    return;
                  }
                  
                  // Normal status change
                  console.log('✅ Normal status change to:', newStatus);
                  onStatusUpdate(risk.risk_id, newStatus);
                }}
                className="mt-1 text-sm font-semibold px-2 py-1 border border-gray-300 rounded bg-white"
              >
                <option value="Identified">Identified</option>
                <option value="Assessed">Assessed</option>
                <option value="Mitigated">Mitigated</option>
                <option value="Closed">Closed</option>
                <option value="Occurred">Occurred</option>
              </select>
            </div>
          </div>

          {/* Details Section */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <p className="mt-1 text-gray-900">{risk.description || 'No description provided'}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Category</label>
                <p className="mt-1 text-gray-900">{risk.category || 'Not specified'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Identified Date</label>
                <p className="mt-1 text-gray-900">{formatDate(risk.identified_date)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Review Date</label>
                <p className="mt-1 text-gray-900">{risk.review_date ? formatDate(risk.review_date) : 'Not set'}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Created</label>
                <p className="mt-1 text-gray-900">{formatDateTime(risk.created_at)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Identified By</label>
                <p className="mt-1 text-gray-900">{getPersonName(risk.identified_by)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Owner</label>
                <p className="mt-1 text-gray-900">{risk.owner ? getPersonName(risk.owner) : 'Unassigned'}</p>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Mitigation Strategy</label>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{risk.mitigation_strategy || 'No mitigation strategy defined'}</p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Contingency Plan</label>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{risk.contingency_plan || 'No contingency plan defined'}</p>
            </div>
          </div>

          {/* Actions Section */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-lg font-semibold text-gray-900">Actions</h4>
              <button
                onClick={onAddAction}
                className="text-sm px-3 py-1 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                <Plus className="w-4 h-4 inline mr-1" />
                Add Action
              </button>
            </div>

            {loadingActions ? (
              <p className="text-center text-gray-500 py-4">Loading actions...</p>
            ) : actions.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No actions yet. Add one to track mitigation efforts.</p>
            ) : (
              <div className="space-y-3">
                {actions.map((action) => (
                  <div key={action.action_id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{action.action_description}</p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Type:</span>{' '}
                            <span className="text-gray-900">{action.action_type || 'Not specified'}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Priority:</span>{' '}
                            <span className="text-gray-900">{action.priority}</span>
                          </div>
                          <div>
                            <span className="text-gray-600">Assigned To:</span>{' '}
                            <span className="text-gray-900">
                              {action.assigned_to ? getPersonName(action.assigned_to) : 'Unassigned'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Due Date:</span>{' '}
                            <span className="text-gray-900">{formatDate(action.due_date)}</span>
                          </div>
                        </div>
                        {action.notes && (
                          <p className="mt-2 text-sm text-gray-600">{action.notes}</p>
                        )}
                      </div>
                      <div className="ml-4 flex flex-col gap-2">
                        <select
                          value={action.status}
                          onChange={(e) => updateActionStatus(action.action_id, e.target.value)}
                          className="text-xs px-2 py-1 border border-gray-300 rounded"
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                        <button
                          onClick={() => onEditAction(action)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteAction(action.action_id)}
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={addingLog || !newLogEntry.trim()}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
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
                  <div key={entry.log_id} className="border-l-4 border-orange-400 bg-gray-50 p-3 rounded">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          <span className="font-medium">{getPersonName(entry.logged_by)}</span>
                          <span>•</span>
                          <span>{formatDateTime(entry.log_date)}</span>
                          {entry.log_type && entry.log_type !== 'Comment' && (
                            <>
                              <span>•</span>
                              <span className="text-orange-600 font-medium">{entry.log_type}</span>
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
              onClick={() => onDelete(risk.risk_id)}
              className="px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 inline mr-2" />
              Delete Risk
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
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                <Edit className="w-4 h-4 inline mr-2" />
                Edit Risk
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit Risk Modal Component
function EditRiskModal({ show, risk, people, projects, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    probability: 'Medium',
    impact: 'Medium',
    status: 'Identified',
    identified_by: '',
    owner: '',
    identified_date: '',
    review_date: '',
    mitigation_strategy: '',
    contingency_plan: '',
    project_id: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (risk) {
      setFormData({
        title: risk.title || '',
        description: risk.description || '',
        category: risk.category || '',
        probability: risk.probability || 'Medium',
        impact: risk.impact || 'Medium',
        status: risk.status || 'Identified',
        identified_by: risk.identified_by || '',
        owner: risk.owner || '',
        identified_date: risk.identified_date || '',
        review_date: risk.review_date || '',
        mitigation_strategy: risk.mitigation_strategy || '',
        contingency_plan: risk.contingency_plan || '',
        project_id: risk.project_id || ''
      });
    }
  }, [risk]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if trying to set status to Closed
    if (formData.status === 'Closed' && risk.status !== 'Closed') {
      alert('Cannot directly close a risk. Please use the status dropdown in the detail view to request closure.');
      return;
    }
    
    setLoading(true);
    
    try {
      await apiService.updateRisk(risk.risk_id, {
        ...formData,
        identified_by: formData.identified_by ? parseInt(formData.identified_by) : null,
        owner: formData.owner ? parseInt(formData.owner) : null,
        project_id: formData.project_id ? parseInt(formData.project_id) : undefined,
        updated_by: 1
      });
      onSuccess();
    } catch (err) {
      console.error('Error updating risk:', err);
      alert('Failed to update risk: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!show || !risk) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Edit Risk</h2>
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Probability</label>
              <select
                value={formData.probability}
                onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                value={formData.impact}
                onChange={(e) => setFormData({ ...formData, impact: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="Very Low">Very Low</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Very High">Very High</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status 
              {formData.status === 'Closed' && <span className="text-xs text-gray-500 ml-2">(Use detail view to request closure)</span>}
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="Identified">Identified</option>
              <option value="Assessed">Assessed</option>
              <option value="Mitigated">Mitigated</option>
              {risk.status === 'Closed' && <option value="Closed">Closed</option>}
              <option value="Occurred">Occurred</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Identified By</label>
              <select
                value={formData.identified_by}
                onChange={(e) => setFormData({ ...formData, identified_by: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
              <select
                value={formData.owner}
                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Identified Date</label>
              <input
                type="date"
                value={formData.identified_date}
                onChange={(e) => setFormData({ ...formData, identified_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Review Date</label>
              <input
                type="date"
                value={formData.review_date}
                onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mitigation Strategy</label>
            <textarea
              value={formData.mitigation_strategy}
              onChange={(e) => setFormData({ ...formData, mitigation_strategy: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              rows="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contingency Plan</label>
            <textarea
              value={formData.contingency_plan}
              onChange={(e) => setFormData({ ...formData, contingency_plan: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
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
function AddActionModal({ show, riskId, people, onClose, onSuccess }) {
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
      await apiService.createRiskAction(riskId, {
        ...formData,
        assigned_to: formData.assigned_to ? parseInt(formData.assigned_to) : null,
        created_by: 1,
        created_date: getTodayForInput(),
        status: 'Pending'
      });
      onSuccess();
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., Mitigation, Monitoring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Action'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit Action Modal Component (NEW!)
function EditActionModal({ show, riskId, action, people, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    action_description: '',
    action_type: '',
    priority: 'Medium',
    assigned_to: '',
    due_date: '',
    notes: '',
    status: 'Pending'
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (action) {
      setFormData({
        action_description: action.action_description || '',
        action_type: action.action_type || '',
        priority: action.priority || 'Medium',
        assigned_to: action.assigned_to || '',
        due_date: action.due_date || '',
        notes: action.notes || '',
        status: action.status || 'Pending'
      });
    }
  }, [action]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await apiService.updateRiskAction(riskId, action.action_id, {
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
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                placeholder="e.g., Mitigation, Monitoring"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Critical">Critical</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Due Date *</label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
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
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Request Closure Modal Component (NEW!)
function RequestClosureModal({ risk, onClose, onSuccess }) {
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('🔔 RequestClosureModal rendered!');
    console.log('   Risk:', risk ? risk.title : 'NO RISK');
    console.log('   Risk ID:', risk ? risk.risk_id : 'NO RISK');
    
    return () => {
      console.log('🔔 RequestClosureModal unmounted');
    };
  }, [risk]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      console.log('📤 Submitting closure request for risk:', risk.risk_id);
      await apiService.requestRiskClosure(risk.risk_id, {
        requested_by: 1,
        closure_justification: justification
      });
      alert('Closure request submitted successfully. An administrator will review and approve or reject the request.');
      onSuccess();
    } catch (err) {
      console.error('❌ Error requesting closure:', err);
      alert('Failed to request closure: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  if (!risk) {
    console.log('⚠️ RequestClosureModal: No risk provided!');
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-orange-50">
          <div>
            <h2 className="text-xl font-bold text-gray-900">🔒 Request Risk Closure</h2>
            <p className="text-sm text-gray-600 mt-1">Risk: {risk.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
              <div>
                <h3 className="font-medium text-blue-900">Approval Required</h3>
                <p className="text-sm text-blue-800 mt-1">
                  Risks cannot be closed directly. Your closure request will be logged and an administrator 
                  will review it for approval.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Closure Justification * 
              <span className="text-xs text-gray-500 ml-2">Explain why this risk should be closed</span>
            </label>
            <textarea
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              rows="4"
              required
              placeholder="Example: Risk fully mitigated. Backup systems operational for 60 days without issues. Risk score reduced from 15 to 2."
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
              disabled={loading || !justification.trim()}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Submit Closure Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Risks;
