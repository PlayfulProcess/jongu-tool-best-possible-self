'use client';

import Link from 'next/link';
import { AuthForm } from '@/components/AuthForm';
import { useAuth } from '@/components/AuthProvider';
import { ProviderSignupForm } from '@/components/ProviderSignupForm';

export default function HomePage() {
  const { user, loading } = useAuth();

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">TherapyToolsHub</h1>
              <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">Beta</span>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              ) : (
                <div className="text-sm text-gray-600">
                  Sign in to get started
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Mindfulness Tools
              <span className="block text-blue-600">For Personal Growth</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Discover science-backed wellness practices and reflection tools. 
              Organize and personalize them in ways that make sense to your unique journey.
            </p>
            
            {user ? (
              <div className="flex justify-center">
                <Link 
                  href="/app"
                  className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Try Best Possible Self
                </Link>
              </div>
            ) : (
              <div className="max-w-md mx-auto">
                <AuthForm />
              </div>
            )}
          </div>
        </div>

        {/* Featured Tool Preview */}
        {user && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
            <div className="bg-white rounded-xl shadow-xl p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Tool</h2>
                <p className="text-gray-600">Try our flagship tool to see how the platform works</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Best Possible Self</h3>
                  <p className="text-gray-600 mb-6">
                    A research-backed reflection practice from Berkeley&apos;s Greater Good Science Center 
                    that helps you envision your brightest future through guided journaling.
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
                    <span className="bg-gray-100 px-3 py-1 rounded">🕐 15 minutes</span>
                    <span className="bg-gray-100 px-3 py-1 rounded">📊 Beginner</span>
                    <span className="bg-gray-100 px-3 py-1 rounded">🧠 Positive Psychology</span>
                  </div>
                  <Link 
                    href="/app"
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    Start Your Journey →
                  </Link>
                </div>
                <div className="bg-gradient-to-br from-blue-100 to-indigo-200 rounded-lg p-8 text-center">
                  <div className="text-6xl mb-4">🌟</div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">Evidence-Based</h4>
                  <p className="text-gray-600 text-sm">
                    Backed by positive psychology research and proven to increase optimism and life satisfaction.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Section */}
        <div className="bg-white py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose Our Platform?</h2>
              <p className="text-xl text-gray-600">Open source, science-backed, and built with trust</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🎯</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Personalized Organization</h3>
                <p className="text-gray-600">
                  Organize tools by your perspective: parenting role, skills, therapeutic approach, or any way that makes sense to you.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🤖</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">AI-Powered Insights</h3>
                <p className="text-gray-600">
                  Our AI learns your preferences and suggests relevant tools, creating a personalized experience.
                </p>
              </div>

              <div className="text-center">
                <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔗</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Open Source & Transparent</h3>
                <p className="text-gray-600">
                  Fully open source code you can inspect, contribute to, and trust. Built with transparency at our core.
                  <br />
                  <a href="https://github.com/PlayfulProcess/best-possible-self-app" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline text-sm">
                    View on GitHub →
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA for Creators */}
        <div className="bg-green-50 py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-green-900 mb-4">
              Share Your Wisdom
            </h2>
            <p className="text-xl text-green-700 mb-8 max-w-3xl mx-auto">
              Teachers, coaches, and wellness practitioners: collaborate with us to create transformative tools 
              that help people grow and flourish. No clinical background required.
            </p>
            <ProviderSignupForm />
          </div>
        </div>
      </main>
    </div>
  );
}