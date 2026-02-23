// frontend/src/components/Navigation.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, AlertCircle, AlertTriangle, GitBranch, Zap, Bug } from 'lucide-react';

function Navigation() {
  const location = useLocation();
  
  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/issues', label: 'Issues', icon: AlertCircle },
    { path: '/risks', label: 'Risks', icon: AlertTriangle },
    // Add more when ready:
    { path: '/changes', label: 'Changes', icon: GitBranch },
    { path: '/escalations', label: 'Escalations', icon: Zap },    
    { path: '/faults', label: 'Faults', icon: Bug },
  ];
  
  const isActive = (path) => location.pathname === path;
  
  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            {/* Logo/Brand */}
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                PMBOK <span className="text-orange-600">PM</span>
              </h1>
            </div>
            
            {/* Navigation Links */}
            <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium transition-colors ${
                      active
                        ? 'border-orange-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className={`mr-2 h-4 w-4 ${active ? 'text-orange-600' : ''}`} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
          
          {/* Right side - User/Settings (placeholder) */}
          <div className="flex items-center">
            <div className="text-sm text-gray-600">
              Project Management System
            </div>
          </div>
        </div>
        
        {/* Mobile menu (simple version) */}
        <div className="sm:hidden pb-3 pt-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                  active
                    ? 'bg-orange-50 text-orange-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="mr-3 h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
