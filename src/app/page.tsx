'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import { AuthModal } from '@/components/modals/AuthModal';
import { SubmitToolModal } from '@/components/modals/SubmitToolModal';
import { CollaborationModal } from '@/components/modals/CollaborationModal';
import { NewsletterModal } from '@/components/modals/NewsletterModal';
import { ToolGrid } from '@/components/community/ToolGrid';
import { CategoryFilter } from '@/components/community/CategoryFilter';
import { SortingControls } from '@/components/community/SortingControls';
import { StatsDisplay } from '@/components/community/StatsDisplay';
import { useAuth } from '@/components/AuthProvider';

export default function HomePage() {
  const { loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showCollabModal, setShowCollabModal] = useState(false);
  const [showNewsletterModal, setShowNewsletterModal] = useState(false);
  
  // Community tools state
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('rating');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryStats, setCategoryStats] = useState({});
  const [totalTools, setTotalTools] = useState(0);
  const [averageRating, setAverageRating] = useState(0);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/community/tools');
      const tools = await response.json();
      
      // Calculate stats
      const stats: {[key: string]: number} = {};
      let totalRating = 0;
      let ratedToolsCount = 0;

      tools.forEach((tool: { category: string; total_ratings: number; avg_rating: number }) => {
        stats[tool.category] = (stats[tool.category] || 0) + 1;
        if (tool.total_ratings > 0) {
          totalRating += tool.avg_rating;
          ratedToolsCount++;
        }
      });

      setCategoryStats(stats);
      setTotalTools(tools.length);
      setAverageRating(ratedToolsCount > 0 ? totalRating / ratedToolsCount : 0);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <Header 
        showAuthModal={() => setShowAuthModal(true)}
      />

      {/* Section 1: BPS Hero */}
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Jongu, Interactive Tools
              <span className="block text-blue-600">for a Better Life</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Discover science-backed wellness practices and reflection tools. 
              Keep a record of your progress, use AI help for deeper insights, and connect with the amazing people who created these tools.
            </p>
            <div className="text-sm text-gray-500 mb-8">
              🔓 <a href="https://github.com/PlayfulProcess/best-possible-self-app" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Open source</a> - Building gateways, not gatekeepers
            </div>
          </div>
        </div>

        {/* Featured Tool Preview */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
          <div className="bg-white rounded-xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Tool</h2>
              <p className="text-gray-600">Try our flagship tool to see how the platform works</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Best Possible Self</h3>
                <p className="text-gray-600 mb-6">
                  A research-backed reflection practice from <a 
                    href="https://ggia.berkeley.edu/practice/best_possible_self" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >Berkeley&apos;s Greater Good Science Center</a> that helps you envision your brightest future through guided journaling.
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-6">
                  <span className="bg-gray-100 px-3 py-1 rounded">🕐 15 minutes</span>
                  <span className="bg-gray-100 px-3 py-1 rounded">📊 Beginner</span>
                  <span className="bg-gray-100 px-3 py-1 rounded">🧠 Positive Psychology</span>
                </div>
                <Link 
                  href="/tools/best-possible-self"
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
      </section>

      {/* Section 2: Community Wellness Tool Garden */}
      <section 
        id="community-tools" 
        className="py-20 bg-white"
        onClick={(e) => {
          // Clear search if clicking outside search-related elements
          if (!e.target.closest('.search-container') && 
              !e.target.closest('.jongu-search-button') && 
              searchQuery.trim()) {
            setSearchQuery('');
          }
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">
              Community Wellness Tool Garden
            </h2>
            
            {/* Two-box layout for Community Tools vs Jongu Tools */}
            <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto mb-8">
              {/* Community Tools Box */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                <h3 className="text-xl font-semibold text-green-900 mb-3">🌍 Community Tools</h3>
                <p className="text-gray-700 mb-4">
                  Discover wellness tools. Journaling apps, creativity prompts, relationship boosters, and therapeutic exercises. Created by the community for the community.
                </p>
                <button
                  onClick={() => setShowSubmitModal(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  🔗 Share Any Tool
                </button>
              </div>

              {/* Jongu Tools Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <h3 className="text-xl font-semibold text-blue-900 mb-3">🛡️ Jongu Tools: Premium Experience</h3>
                <p className="text-gray-700 mb-4">
                  Our self-hosted tools are flexible enough so that everyone can make good use of them. Choose privacy mode or save versions. Use AI or leave it alone.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => {
                      setSearchQuery('jongu');
                      // Scroll to tools section
                      const toolsSection = document.querySelector('.tools-section');
                      if (toolsSection) {
                        toolsSection.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="jongu-search-button inline-flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <img 
                      src="/Jongulogo.png" 
                      alt="Jongu" 
                      className="h-4 w-auto filter brightness-0 invert"
                    />
                    <span>View Jongu Tools</span>
                  </button>
                  <button
                    onClick={() => setShowCollabModal(true)}
                    className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    🤝 Suggest New Jongu Tool
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Stats Display with Search */}
          <StatsDisplay 
            totalTools={totalTools} 
            averageRating={averageRating}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Controls */}
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-8 space-y-4 lg:space-y-0">
            <CategoryFilter
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              categoryStats={categoryStats}
            />
            <SortingControls
              sortBy={sortBy}
              onSortChange={setSortBy}
            />
          </div>

          {/* Tools Grid */}
          <div className="tools-section">
            <ToolGrid
              selectedCategory={selectedCategory}
              sortBy={sortBy}
              searchQuery={searchQuery}
              onToolRate={fetchStats}
            />
          </div>

        </div>
      </section>

      {/* Section 3: About This Platform */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">About This Platform</h2>
          <div className="prose prose-lg mx-auto text-gray-600">
            <p className="mb-6">
              This platform was inspired by Dialectical Behavior Therapy (DBT) skills, but we&apos;ve added our own 
              PlayfulProcess touch to make wellness more accessible and creative.
            </p>
            <p className="mb-6">
              We believe in building gateways, not gatekeepers. Founded by PlayfulProcess, this community-driven 
              platform welcomes tools that help people grow, heal, and connect—whether through creative approaches to healing, 
              creative expression, or innovative approaches to wellness.
            </p>
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 text-left rounded-lg">
              <h3 className="text-xl font-semibold text-blue-900 mb-4">Our Philosophy</h3>
              <ul className="list-disc list-inside space-y-2 text-blue-800">
                <li>Open source and transparent development</li>
                <li>Community-driven content creation</li>
                <li>Evidence-based but accessible tools</li>
                <li>Creative approaches to healing</li>
                <li>Building bridges between helpers and seekers</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="/Jongulogo.png" 
                alt="Jongu" 
                className="h-32 w-auto filter brightness-0 invert"
              />
            </div>
            <p className="text-gray-400 mb-6">Community-powered open source wellness tool garden. Building gateways, not gatekeepers</p>
            
            
            <div className="bg-amber-800 text-amber-200 p-4 rounded-lg mb-6">
              <div className="text-lg font-semibold mb-2">🚧 Beta Version</div>
              <div className="text-sm">
                We're constantly improving and adding new features. Your feedback helps us grow!
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-6">
              <Link href="/contact" className="text-gray-400 hover:text-white">
                Contact Us
              </Link>
              <a href="https://github.com/PlayfulProcess" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white">
                GitHub
              </a>
              <button 
                onClick={() => setShowNewsletterModal(true)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                📧 Newsletter
              </button>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-800 text-gray-500 text-sm">
              © 2025 Jongu. Community-powered open source wellness tool garden.
            </div>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
      
      <SubmitToolModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
      />
      
      <CollaborationModal
        isOpen={showCollabModal}
        onClose={() => setShowCollabModal(false)}
      />

      <NewsletterModal
        isOpen={showNewsletterModal}
        onClose={() => setShowNewsletterModal(false)}
      />
    </div>
  );
}