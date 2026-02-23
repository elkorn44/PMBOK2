import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import apiService from '../services/api';
import { testLocale } from '../utils/testLocale';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Test locale on load
  useEffect(() => {
    testLocale();
  }, []);
  
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    console.count("FETCH TRIGGERED"); // This will show in F12 console
    try {
      setLoading(true);
      const data = await apiService.getDashboard();
      console.log('🔍 API Response:', data);
      console.log('🔍 Dashboard data:', data.dashboard);
      setStats(data.dashboard);  // Extract the 'dashboard' property from API response
      setError(null);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-800">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-gray-500">No dashboard data available</div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Project Dashboard</h1>
        <p className="mt-2 text-gray-600">Overview of all project activities</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Projects Card */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Projects</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.projects?.total_projects || 0}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <span className="font-semibold text-green-600">{stats.projects?.active || 0}</span> active
          </div>
        </div>

        {/* Issues Card */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Open Issues</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.issues?.stats?.open || 0}
              </p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <span className="font-semibold text-red-600">{stats.issues?.stats?.critical || 0}</span> critical
          </div>
        </div>

        {/* Risks Card */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Risks</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.risks?.stats?.active || 0}
              </p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            Avg score: <span className="font-semibold">{stats.risks?.stats?.avg_score || '0'}</span>
          </div>
        </div>

        {/* Changes Card */}
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Under Review</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.changes?.stats?.under_review || 0}
              </p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <span className="font-semibold">{stats.changes?.stats?.approved || 0}</span> approved
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Critical Items */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Critical Items</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.issues?.stats?.critical > 0 && (
                <div className="flex items-start gap-3">
                  <div className="bg-red-100 rounded-full p-2 mt-1">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Critical Issues</p>
                    <p className="text-sm text-gray-600">
                      {stats.issues.stats.critical} issues require immediate attention
                    </p>
                  </div>
                </div>
              )}
              
              {stats.risks?.stats?.critical > 0 && (
                <div className="flex items-start gap-3">
                  <div className="bg-orange-100 rounded-full p-2 mt-1">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">High-Priority Risks</p>
                    <p className="text-sm text-gray-600">
                      {stats.risks.stats.critical} risks with high impact
                    </p>
                  </div>
                </div>
              )}
              
              {(!stats.issues?.stats?.critical && !stats.risks?.stats?.critical) && (
                <div className="text-center py-8 text-gray-500">
                  <p>No critical items at this time</p>
                  <p className="text-sm mt-1">Great work! 🎉</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pending Approvals */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Pending Approvals</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {stats.pending_approvals?.total > 0 && (
                <div className="flex items-start gap-3">
                  <div className="bg-purple-100 rounded-full p-2 mt-1">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Pending Approvals</p>
                    <p className="text-sm text-gray-600">
                      {stats.pending_approvals.total} items awaiting review
                    </p>
                  </div>
                </div>
              )}
              
              {(!stats.pending_approvals?.total || stats.pending_approvals.total === 0) && (
                <div className="text-center py-8 text-gray-500">
                  <p>No pending approvals</p>
                  <p className="text-sm mt-1">All caught up! ✓</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Statistics</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{stats.issues?.stats?.total || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Total Issues</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{stats.risks?.stats?.total || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Total Risks</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">{stats.changes?.stats?.total || 0}</p>
            <p className="text-sm text-gray-600 mt-1">Total Changes</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-gray-900">
              {stats.metrics?.active_projects || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Active Projects</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
