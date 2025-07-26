'use client'

import { useState } from 'react';
import { BestPossibleSelfForm } from '@/components/BestPossibleSelfForm';
import { JournalDashboard } from '@/components/JournalDashboard';
import { AuthForm } from '@/components/AuthForm';
import { useAuth } from '@/components/AuthProvider';

export default function AppPage() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'form' | 'dashboard'>('form');

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <AuthForm />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      {/* Navigation */}
      <div className="max-w-4xl mx-auto mb-6 px-6">
        <div className="flex space-x-4 border-b">
          <button
            onClick={() => setCurrentView('form')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              currentView === 'form'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            ✍️ New Entry
          </button>
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              currentView === 'dashboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            📚 My Entries
          </button>
        </div>
      </div>

      {/* Content */}
      {currentView === 'form' ? (
        <BestPossibleSelfForm />
      ) : (
        <JournalDashboard />
      )}
    </main>
  );
}