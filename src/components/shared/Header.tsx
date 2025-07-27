'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

interface HeaderProps {
  showSubmitModal?: () => void;
}

export function Header({ showSubmitModal }: HeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl">🌱</span>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold text-gray-900">Jongu</span>
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-medium">BETA</span>
              </div>
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              <Link 
                href="/#community-tools" 
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Browse Tools
              </Link>
              
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
              <div className="flex items-center space-x-4">
                <Link
                  href="/tools/best-possible-self"
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  Try Tool
                </Link>
                <button
                  className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}