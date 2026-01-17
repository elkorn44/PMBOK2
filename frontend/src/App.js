// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { ProjectProvider, useProject } from './context/ProjectContext';

// Import pages
import Dashboard from './pages/Dashboard';
import Issues from './pages/Issues';
import Risks from './pages/Risks';
import Faults from './pages/Faults';
import Changes from './pages/Changes';
import Escalations from './pages/Escalations';
import ActionLogs from './pages/ActionLogs';
import Projects from './pages/Projects';
import People from './pages/People';
import Reports from './pages/Reports';

// Navigation component with project selector
function Navigation() {
  const location = useLocation();
  const { selectedProject, selectProject, projects, loading, getSelectedProjectName } = useProject();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  
  const isActive = (path) => location.pathname === path;
  
  const linkClass = (path) => {
    return isActive(path)
      ? "border-orange-500 text-gray-900 inline-flex items-center px-3 py-1 border-b-2 text-sm font-medium flex-shrink-0"
      : "border-transparent text-gray-500 hover:border-orange-300 hover:text-gray-700 inline-flex items-center px-3 py-1 border-b-2 text-sm font-medium flex-shrink-0";
  };
  
  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };
  
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          {/* Left side - Logo and Desktop Nav */}
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-orange-600">📊 PMBOK PM</span>
            </div>
            
            {/* Desktop Navigation - Show at lg: (1024px+) */}
            <div className="hidden lg:ml-6 lg:flex lg:flex-col lg:gap-1">
              {/* First Row - Main Modules */}
              <div className="flex space-x-4">
                <Link to="/dashboard" className={linkClass('/dashboard')} onClick={handleLinkClick}>
                  <span className="whitespace-nowrap">Dashboard</span>
                </Link>
                <Link to="/issues" className={linkClass('/issues')} onClick={handleLinkClick}>
                  <span className="whitespace-nowrap">Issues</span>
                </Link>
                <Link to="/risks" className={linkClass('/risks')} onClick={handleLinkClick}>
                  <span className="whitespace-nowrap">Risks</span>
                </Link>
                <Link to="/faults" className={linkClass('/faults')} onClick={handleLinkClick}>
                  <span className="whitespace-nowrap">Faults</span>
                </Link>
                <Link to="/changes" className={linkClass('/changes')} onClick={handleLinkClick}>
                  <span className="whitespace-nowrap">Changes</span>
                </Link>
                <Link to="/escalations" className={linkClass('/escalations')} onClick={handleLinkClick}>
                  <span className="whitespace-nowrap">Escalations</span>
                </Link>
                <Link to="/action-logs" className={linkClass('/action-logs')} onClick={handleLinkClick}>
                  <span className="whitespace-nowrap">Action Logs</span>
                </Link>
              </div>
              {/* Second Row - Admin/Config */}
              <div className="flex space-x-4 -mt-1">
                <Link to="/projects" className={linkClass('/projects')} onClick={handleLinkClick}>
                  <span className="whitespace-nowrap">Projects</span>
                </Link>
                <Link to="/people" className={linkClass('/people')} onClick={handleLinkClick}>
                  <span className="whitespace-nowrap">People</span>
                </Link>
                <Link to="/reports" className={linkClass('/reports')} onClick={handleLinkClick}>
                  <span className="whitespace-nowrap">Reports</span>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Right side - Project Selector and Hamburger */}
          <div className="flex items-center gap-4">
            {/* Project Selector - FIXED */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Project:</span>
              {loading ? (
                <span className="text-sm text-gray-500">Loading...</span>
              ) : (
                <select
                  value={selectedProject || (projects.length > 0 ? projects[0].project_id : '')}
                  onChange={(e) => selectProject(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                >
                  {projects.length === 0 ? (
                    <option value="">No Projects Available</option>
                  ) : (
                    projects.map((project) => (
                      <option key={project.project_id} value={project.project_id}>
                        {project.project_name}
                      </option>
                    ))
                  )}
                </select>
              )}
            </div>
            
            {/* Hamburger Menu Button - Show below lg: */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <span className="text-2xl">✕</span>
              ) : (
                <span className="text-2xl">☰</span>
              )}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu - Slide down */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-3 pt-2 space-y-1">
            <Link 
              to="/dashboard" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/dashboard') 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={handleLinkClick}
            >
              Dashboard
            </Link>
            <Link 
              to="/projects" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/projects') 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={handleLinkClick}
            >
              Projects
            </Link>
            <Link 
              to="/people" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/people') 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={handleLinkClick}
            >
              People
            </Link>
            <Link 
              to="/issues" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/issues') 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={handleLinkClick}
            >
              Issues
            </Link>
            <Link 
              to="/risks" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/risks') 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={handleLinkClick}
            >
              Risks
            </Link>
            <Link 
              to="/faults" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/faults') 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={handleLinkClick}
            >
              Faults
            </Link>
            <Link 
              to="/changes" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/changes') 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={handleLinkClick}
            >
              Changes
            </Link>
            <Link 
              to="/escalations" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/escalations') 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={handleLinkClick}
            >
              Escalations
            </Link>
            <Link 
              to="/action-logs" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/action-logs') 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={handleLinkClick}
            >
              Action Logs
            </Link>
            <Link 
              to="/reports" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/reports') 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
              onClick={handleLinkClick}
            >
              Reports
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

function AppContent() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Navigation />
      
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/people" element={<People />} />
          <Route path="/issues" element={<Issues />} />
          <Route path="/risks" element={<Risks />} />
          <Route path="/changes" element={<Changes />} /> 
          <Route path="/escalations" element={<Escalations />} />
          <Route path="/action-logs" element={<ActionLogs />} />
          <Route path="/faults" element={<Faults />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <ProjectProvider>
        <AppContent />
      </ProjectProvider>
    </Router>
  );
}

export default App;
