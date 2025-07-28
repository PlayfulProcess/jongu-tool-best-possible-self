'use client';

import { useState, useEffect } from 'react';
import { createAdminClient } from '@/lib/supabase-admin';

interface Submission {
  id: string;
  title: string;
  claude_url: string;
  category: string;
  description: string;
  creator_name: string;
  creator_link?: string;
  creator_background?: string;
  thumbnail_url?: string;
  submitter_ip?: string;
  reviewed: boolean;
  approved: boolean;
  created_at: string;
}

interface Tool {
  id: string;
  title: string;
  category: string;
  creator_name: string;
  avg_rating: number;
  total_ratings: number;
  view_count: number;
  click_count: number;
  approved: boolean;
  created_at: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeTab, setActiveTab] = useState('submissions');
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalSubmissions: 0,
    pendingSubmissions: 0,
    totalTools: 0,
    totalCollaborations: 0
  });

  // Check authentication
  const handleAuth = async () => {
    if (!password) {
      setAuthError('Please enter password');
      return;
    }

    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        setIsAuthenticated(true);
        setAuthError('');
        loadData();
      } else {
        setAuthError('Invalid password');
      }
    } catch (error) {
      setAuthError('Authentication failed');
    }
  };

  // Load all data
  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadSubmissions(),
        loadTools(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    try {
      const response = await fetch('/api/admin/submissions');
      const data = await response.json();
      setSubmissions(data);
    } catch (error) {
      console.error('Error loading submissions:', error);
    }
  };

  const loadTools = async () => {
    try {
      const response = await fetch('/api/admin/tools');
      const data = await response.json();
      setTools(data);
    } catch (error) {
      console.error('Error loading tools:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Approve submission
  const approveSubmission = async (submissionId: string) => {
    try {
      const response = await fetch('/api/admin/submissions/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId })
      });

      if (response.ok) {
        await loadData(); // Refresh data
        alert('Submission approved successfully!');
      } else {
        alert('Failed to approve submission');
      }
    } catch (error) {
      console.error('Error approving submission:', error);
      alert('Error approving submission');
    }
  };

  // Reject submission
  const rejectSubmission = async (submissionId: string) => {
    try {
      const response = await fetch('/api/admin/submissions/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId })
      });

      if (response.ok) {
        await loadData(); // Refresh data
        alert('Submission rejected');
      } else {
        alert('Failed to reject submission');
      }
    } catch (error) {
      console.error('Error rejecting submission:', error);
      alert('Error rejecting submission');
    }
  };

  // Toggle tool approval
  const toggleToolApproval = async (toolId: string, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/admin/tools/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId, approved: !currentStatus })
      });

      if (response.ok) {
        await loadTools();
        alert(`Tool ${!currentStatus ? 'approved' : 'hidden'} successfully!`);
      } else {
        alert('Failed to update tool status');
      }
    } catch (error) {
      console.error('Error updating tool status:', error);
      alert('Error updating tool status');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6">Admin Access</h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAuth()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter admin password"
              />
            </div>
            {authError && (
              <p className="text-red-600 text-sm">{authError}</p>
            )}
            <button
              onClick={handleAuth}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Access Admin Panel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">Jongu Admin Panel</h1>
            <button
              onClick={() => setIsAuthenticated(false)}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Tools</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.totalTools}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Pending Submissions</h3>
            <p className="text-2xl font-bold text-orange-600">{stats.pendingSubmissions}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Total Submissions</h3>
            <p className="text-2xl font-bold text-green-600">{stats.totalSubmissions}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Collaborations</h3>
            <p className="text-2xl font-bold text-purple-600">{stats.totalCollaborations}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('submissions')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'submissions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Pending Submissions ({stats.pendingSubmissions})
              </button>
              <button
                onClick={() => setActiveTab('tools')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tools'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                All Tools ({stats.totalTools})
              </button>
            </nav>
          </div>

          <div className="p-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading...</p>
              </div>
            ) : (
              <>
                {/* Submissions Tab */}
                {activeTab === 'submissions' && (
                  <div className="space-y-6">
                    {submissions.filter(s => !s.reviewed).length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No pending submissions</p>
                    ) : (
                      submissions
                        .filter(s => !s.reviewed)
                        .map((submission) => (
                          <div key={submission.id} className="border border-gray-200 rounded-lg p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex-1">
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                  {submission.title}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                                  <div>
                                    <strong>Category:</strong> {submission.category}
                                  </div>
                                  <div>
                                    <strong>Creator:</strong> {submission.creator_name}
                                  </div>
                                  <div>
                                    <strong>URL:</strong> 
                                    <a href={submission.claude_url} target="_blank" rel="noopener noreferrer" 
                                       className="text-blue-600 hover:text-blue-800 ml-1">
                                      {submission.claude_url}
                                    </a>
                                  </div>
                                  <div>
                                    <strong>Submitted:</strong> {new Date(submission.created_at).toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="mt-4">
                                  <strong className="text-sm text-gray-600">Description:</strong>
                                  <p className="text-gray-700 mt-1">{submission.description}</p>
                                </div>
                                {submission.creator_background && (
                                  <div className="mt-4">
                                    <strong className="text-sm text-gray-600">Creator Background:</strong>
                                    <p className="text-gray-700 mt-1">{submission.creator_background}</p>
                                  </div>
                                )}
                              </div>
                              {submission.thumbnail_url && (
                                <div className="ml-6">
                                  <img 
                                    src={submission.thumbnail_url} 
                                    alt={submission.title}
                                    className="w-24 h-24 object-cover rounded-lg"
                                  />
                                </div>
                              )}
                            </div>
                            <div className="flex space-x-4 pt-4 border-t border-gray-200">
                              <button
                                onClick={() => approveSubmission(submission.id)}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                              >
                                ✓ Approve
                              </button>
                              <button
                                onClick={() => rejectSubmission(submission.id)}
                                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                              >
                                ✗ Reject
                              </button>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                )}

                {/* Tools Tab */}
                {activeTab === 'tools' && (
                  <div className="space-y-4">
                    {tools.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No tools found</p>
                    ) : (
                      tools.map((tool) => (
                        <div key={tool.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-center">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900">{tool.title}</h3>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mt-2">
                                <div><strong>Category:</strong> {tool.category}</div>
                                <div><strong>Creator:</strong> {tool.creator_name}</div>
                                <div><strong>Rating:</strong> {tool.avg_rating?.toFixed(1) || 'N/A'} ({tool.total_ratings} votes)</div>
                                <div><strong>Views:</strong> {tool.view_count} | <strong>Clicks:</strong> {tool.click_count}</div>
                              </div>
                              <div className="text-sm text-gray-500 mt-1">
                                Created: {new Date(tool.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                tool.approved 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {tool.approved ? 'Approved' : 'Hidden'}
                              </span>
                              <button
                                onClick={() => toggleToolApproval(tool.id, tool.approved)}
                                className={`px-3 py-1 rounded text-sm font-medium ${
                                  tool.approved
                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                    : 'bg-green-600 text-white hover:bg-green-700'
                                }`}
                              >
                                {tool.approved ? 'Hide' : 'Show'}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}