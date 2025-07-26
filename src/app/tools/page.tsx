'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

export default function ToolsPage() {
  const { user, signOut } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Please sign in to browse tools</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-800 underline">
            Go to homepage
          </Link>
        </div>
      </div>
    );
  }

  const tools = [
    {
      id: 'best-possible-self',
      title: 'Best Possible Self',
      description: 'A research-backed journaling exercise to envision your brightest future',
      category: 'Positive Psychology',
      duration: '15 minutes',
      difficulty: 'Beginner',
      href: '/app',
      featured: true,
      provider: 'Berkeley Greater Good Science Center'
    },
    {
      id: 'gratitude-journal',
      title: 'Gratitude Journal',
      description: 'Daily practice of reflecting on things you&apos;re grateful for',
      category: 'Mindfulness',
      duration: '5-10 minutes',
      difficulty: 'Beginner',
      href: '#',
      comingSoon: true,
      provider: 'Mindfulness Research Group'
    },
    {
      id: 'cognitive-reframing',
      title: 'Cognitive Reframing Worksheet',
      description: 'Challenge and reframe negative thought patterns',
      category: 'CBT',
      duration: '20 minutes',
      difficulty: 'Intermediate',
      href: '#',
      comingSoon: true,
      provider: 'CBT Institute'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">
                TherapyToolsHub
              </Link>
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">Beta</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              <button
                onClick={signOut}
                className="text-sm text-gray-600 hover:text-gray-800 underline"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Therapeutic Tools for Personal Growth
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover evidence-based tools and exercises created by mental health professionals. 
            Organize them your way with AI-powered categorization.
          </p>
        </div>

        {/* Filter and Search (Future) */}
        <div className="mb-8 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-400">
          <h3 className="font-semibold text-blue-900 mb-2">🎯 Coming Soon: AI-Powered Organization</h3>
          <p className="text-blue-700 text-sm">
            Soon you&apos;ll be able to categorize tools by your personal lens: parenting role, skill development, 
            therapeutic approach, or any way that makes sense to you. Our AI will learn your preferences.
          </p>
        </div>

        {/* Featured Tool */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Tool</h2>
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg p-8 text-white">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">Best Possible Self</h3>
                <p className="text-blue-100 mb-4">
                  Research-backed exercise from Berkeley&apos;s Greater Good Science Center
                </p>
                <div className="flex items-center space-x-4 text-sm text-blue-100 mb-6">
                  <span>🕐 15 minutes</span>
                  <span>📊 Beginner</span>
                  <span>🧠 Positive Psychology</span>
                </div>
                <Link 
                  href="/app"
                  className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                >
                  Try This Tool →
                </Link>
              </div>
              <div className="text-right text-blue-100">
                <div className="text-sm">Created by</div>
                <div className="font-semibold">Berkeley GGSC</div>
              </div>
            </div>
          </div>
        </section>

        {/* All Tools */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">All Tools</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool) => (
              <div 
                key={tool.id} 
                className={`bg-white rounded-lg shadow-md p-6 border ${
                  tool.comingSoon ? 'opacity-60' : 'hover:shadow-lg transition-shadow'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">{tool.title}</h3>
                  {tool.comingSoon && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                      Coming Soon
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 text-sm mb-4">{tool.description}</p>
                
                <div className="flex items-center space-x-3 text-xs text-gray-500 mb-4">
                  <span className="bg-gray-100 px-2 py-1 rounded">{tool.category}</span>
                  <span>{tool.duration}</span>
                  <span>{tool.difficulty}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    by {tool.provider}
                  </div>
                  {!tool.comingSoon ? (
                    <Link 
                      href={tool.href}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Use Tool →
                    </Link>
                  ) : (
                    <span className="text-gray-400 text-sm">Notify Me</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action for Therapists */}
        <section className="mt-16 bg-green-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-green-900 mb-4">
            Are You a Mental Health Professional?
          </h2>
          <p className="text-green-700 mb-6">
            Share your therapeutic tools with the world. Join our platform to upload exercises, 
            assessments, and interventions. Help make mental health resources more accessible.
          </p>
          <button 
            className="bg-green-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-green-700 transition-colors"
            onClick={() => alert('Therapist portal coming soon! Email us at therapists@therapytoolshub.com')}
          >
            Join as a Provider
          </button>
        </section>
      </main>
    </div>
  );
}