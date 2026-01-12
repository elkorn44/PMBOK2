// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { ProjectProvider, useProject } from './context/ProjectContext';

// Import pages
import Dashboard from './pages/Dashboard';
import Issues from './pages/Issues';
import Risks from './pages/Risks';

// Navigation component with project selector
function Navigation() {
  const location = useLocation();
  const { selectedProject, selectProject, projects, loading, getSelectedProjectName } = useProject();
  
  const isActive = (path) => location.pathname === path;
  
  const linkClass = (path) => {
    return isActive(path)
      ? "border-orange-500 text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
      : "border-transparent text-gray-500 hover:border-orange-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium";
  };
  
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-orange-600">📊 PMBOK PM</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link to="/dashboard" className={linkClass('/dashboard')}>
                Dashboard
              </Link>
              <Link to="/issues" className={linkClass('/issues')}>
                Issues
              </Link>
              <Link to="/risks" className={linkClass('/risks')}>
                Risks
              </Link>
            </div>
          </div>
          
          {/* Project Selector */}
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Project:</span>
              {loading ? (
                <span className="text-sm text-gray-500">Loading...</span>
              ) : (
                <select
                  value={selectedProject || ''}
                  onChange={(e) => selectProject(e.target.value)}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                >
                  <option value="">All Projects</option>
                  {projects.map((project) => (
                    <option key={project.project_id} value={project.project_id}>
                      {project.project_name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
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
          <Route path="/issues" element={<Issues />} />
          <Route path="/risks" element={<Risks />} />
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
