'use client';

import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';

interface HeaderProps {
  showAuthModal?: () => void;
}

export function Header({ showAuthModal }: HeaderProps) {
  const { user, signOut } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <div className="flex items-center space-x-2">
                <img 
                  src="/Jongulogo.png" 
                  alt="Jongu" 
                  className="h-12 w-auto"
                />
                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-medium">BETA</span>
              </div>
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              <button 
                onClick={() => {
                  // Scroll to search bar area
                  const searchSection = document.querySelector('.search-container');
                  if (searchSection) {
                    searchSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="text-gray-600 hover:text-gray-900 font-medium cursor-pointer"
              >
                Browse Tools
              </button>
              
              <Link
                href="/#community-tools"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Share Tool
              </Link>

              <Link
                href="/tools/best-possible-self"
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Try Tool
              </Link>
              
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
              <button
                onClick={showAuthModal}
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}