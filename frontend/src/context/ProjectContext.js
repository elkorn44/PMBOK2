// frontend/src/context/ProjectContext.js
// Global project context for filtering all data by selected project

import React, { createContext, useState, useContext, useEffect } from 'react';

const ProjectContext = createContext();

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within ProjectProvider');
  }
  return context;
};

export const ProjectProvider = ({ children }) => {
  // Get initial project from localStorage or default to null (All Projects)
  const [selectedProject, setSelectedProject] = useState(() => {
    const saved = localStorage.getItem('selectedProjectId');
    return saved ? parseInt(saved) : null;
  });

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load projects from API
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        // You'll need to add this endpoint if it doesn't exist
        const response = await fetch('http://localhost:3001/api/projects');
        const data = await response.json();
        
        // Handle different response structures
        const projectsArray = data.data?.data || data.data || data || [];
        setProjects(projectsArray);
        
        // If there's only one project, auto-select it
        if (projectsArray.length === 1 && !selectedProject) {
          setSelectedProject(projectsArray[0].project_id);
        }
      } catch (error) {
        console.error('Failed to load projects:', error);
        setProjects([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Save to localStorage whenever selection changes
  useEffect(() => {
    if (selectedProject) {
      localStorage.setItem('selectedProjectId', selectedProject.toString());
    } else {
      localStorage.removeItem('selectedProjectId');
    }
  }, [selectedProject]);

  const selectProject = (projectId) => {
    setSelectedProject(projectId ? parseInt(projectId) : null);
  };

  const getSelectedProjectName = () => {
    if (!selectedProject) return 'All Projects';
    const project = projects.find(p => p.project_id === selectedProject);
    return project ? project.project_name : 'Unknown Project';
  };

  const value = {
    selectedProject,
    selectProject,
    projects,
    loading,
    getSelectedProjectName,
  };

  return (
    <ProjectContext.Provider value={value}>
      {children}
    </ProjectContext.Provider>
  );
};

export default ProjectContext;
