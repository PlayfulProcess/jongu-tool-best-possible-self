'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

interface HeaderProps {
  showSubmitModal?: () => void;
}

export function Header({ showSubmitModal }: HeaderProps) {
  const { user, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🌱</span>
              <span className="text-xl font-bold text-gray-900">Jongu Tool Garden</span>
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              <Link 
                href="/#community-tools" 
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Browse Tools
              </Link>
              
              {/* Categories Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="text-gray-600 hover:text-gray-900 font-medium flex items-center space-x-1"
                >
                  <span>Categories</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <Link 
                      href="/#community-tools?category=mindfulness"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      🧘 Mindfulness & Creativity
                    </Link>
                    <Link 
                      href="/#community-tools?category=distress-tolerance"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      🛡️ Distress Tolerance
                    </Link>
                    <Link 
                      href="/#community-tools?category=emotion-regulation"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      ❤️ Emotion Regulation
                    </Link>
                    <Link 
                      href="/#community-tools?category=interpersonal-effectiveness"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      🤝 Interpersonal Effectiveness
                    </Link>
                  </div>
                )}
              </div>
              
              {showSubmitModal && (
                <button
                  onClick={showSubmitModal}
                  className="text-green-600 hover:text-green-700 font-medium"
                >
                  Share a Tool
                </button>
              )}
              
              <Link 
                href="/#about" 
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                About
              </Link>
            </nav>
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-600">Welcome, {user.email}</span>
                <button
                  onClick={signOut}
                  className="text-sm text-gray-600 hover:text-gray-800 underline"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                href="/tools/best-possible-self"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Try Our Tools
              </Link>
            )}
          </div>
        </div>
      </div>
      
      {/* Close dropdown when clicking outside */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </header>
  );
}