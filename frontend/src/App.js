// frontend/src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navigation from './components/Navigation';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import Issues from './pages/Issues';
import Risks from './pages/Risks';
import Changes from './pages/Changes';
import Escalations from './pages/Escalations';
import Faults from './pages/Faults';
import People from './pages/People';
import ActionLogs from './pages/ActionLogs';
import Reports from './pages/Reports';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        {/* Top Navigation Bar */}
        <Navigation />
        
        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Routes>
            {/* Dashboard - Home Page */}
            <Route path="/" element={<Dashboard />} />
            
            {/* Main Module Pages */}
            <Route path="/projects" element={<Projects />} />
            <Route path="/issues" element={<Issues />} />
            <Route path="/risks" element={<Risks />} />
            <Route path="/changes" element={<Changes />} />
            <Route path="/escalations" element={<Escalations />} />
            <Route path="/faults" element={<Faults />} />
            <Route path="/people" element={<People />} />
            <Route path="/action-logs" element={<ActionLogs />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;