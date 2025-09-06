'use client';

import { createClient } from '@/lib/supabase-client';
import { useEffect, useState } from 'react';

interface ImprovedAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

type AuthMode = 'password' | 'magic-link' | 'reset-password';
type AuthView = 'sign-in' | 'sign-up';

export function ImprovedAuthModal({ 
  isOpen, 
  onClose, 
  title = "Welcome to Best Possible Self Tool", 
  subtitle = "Choose your preferred sign-in method" 
}: ImprovedAuthModalProps) {
  const supabase = createClient();
  const [authMode, setAuthMode] = useState<AuthMode>('magic-link');
  const [authView, setAuthView] = useState<AuthView>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Close modal on successful auth
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        onClose();
        setEmail('');
        setPassword('');
        setMessage(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (authView === 'sign-up') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: (() => {
              const currentDomain = window.location.host;
              if (currentDomain.includes('localhost')) {
                return `${window.location.protocol}//${window.location.host}/auth/callback`;
              } else if (currentDomain.includes('journal.recursive.eco')) {
                return 'https://journal.recursive.eco/auth/callback';
              } else if (currentDomain.includes('channels.recursive.eco')) {
                return 'https://channels.recursive.eco/auth/callback';
              } else if (currentDomain.includes('recursive.eco')) {
                return 'https://www.recursive.eco/auth/callback';
              } else {
                return `${window.location.protocol}//${window.location.host}/auth/callback`;
              }
            })()
          }
        });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Check your email to confirm your account!' });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      }
    } catch (error) {
      setMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Use proper magic link method that works for both existing and new users
      // Smart domain-aware redirect logic
      const currentDomain = window.location.host;
      let redirectUrl;
      
      if (currentDomain.includes('localhost')) {
        // Development - use localhost
        redirectUrl = `${window.location.protocol}//${window.location.host}/auth/callback`;
      } else if (currentDomain.includes('journal.recursive.eco')) {
        // New recursive.eco journal domain (Best Possible Self tool)
        redirectUrl = 'https://journal.recursive.eco/auth/callback';
      } else if (currentDomain.includes('channels.recursive.eco')) {
        // New recursive.eco channels domain
        redirectUrl = 'https://channels.recursive.eco/auth/callback';
      } else if (currentDomain.includes('recursive.eco')) {
        // Main recursive.eco domain
        redirectUrl = 'https://www.recursive.eco/auth/callback';
      } else if (currentDomain.includes('bps-preview')) {
        // BPS Preview deployment (no production BPS domain exists)
        redirectUrl = 'https://bps-preview.jongu.org/auth/callback';
      } else if (currentDomain.includes('wellness-tool')) {
        // Wellness Tool (more specific match first)
        redirectUrl = 'https://wellness-tool.jongu.org/auth/callback';
      } else if (currentDomain.includes('wellness-preview')) {
        // Wellness Preview deployment  
        redirectUrl = 'https://wellness-preview.jongu.org/auth/callback';
      } else if (currentDomain.includes('wellness')) {
        // Wellness Channel (fallback for wellness)
        redirectUrl = 'https://wellness.jongu.org/auth/callback';
      } else {
        // Fallback - use current domain
        redirectUrl = `${window.location.protocol}//${window.location.host}/auth/callback`;
      }
        
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: redirectUrl
        }
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Magic link sent! Check your email.' });
    } catch (error) {
      setMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: (() => {
          const currentDomain = window.location.host;
          if (currentDomain.includes('localhost')) {
            return `${window.location.protocol}//${window.location.host}/auth/callback?type=recovery`;
          } else if (currentDomain.includes('journal.recursive.eco')) {
            return 'https://journal.recursive.eco/auth/callback?type=recovery';
          } else if (currentDomain.includes('channels.recursive.eco')) {
            return 'https://channels.recursive.eco/auth/callback?type=recovery';
          } else if (currentDomain.includes('recursive.eco')) {
            return 'https://www.recursive.eco/auth/callback?type=recovery';
          } else {
            return `${window.location.protocol}//${window.location.host}/auth/callback?type=recovery`;
          }
        })()
      });
      if (error) throw error;
      setMessage({ type: 'success', text: 'Password reset link sent! Check your email.' });
    } catch (error) {
      setMessage({ type: 'error', text: (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold"
          aria-label="Close"
        >
          ×
        </button>

        {/* Content */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
          <p className="text-gray-600 text-sm">{subtitle}</p>
          
          {/* Privacy Notice */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              🔒 <strong>Privacy First:</strong> Your account works across all Jongu tools, but each tool requires separate sign-in. 
              We use only essential session cookies that expire when you close your browser. No tracking, no cross-site data sharing.
            </p>
            <p className="text-xs text-blue-800 mt-2">
              ✨ <strong>Recommended:</strong> For a better experience with fewer bugs, we recommend using magic links (no passwords needed). 
              Just make sure to open the email link in the same browser where you requested it.
            </p>
          </div>
        </div>

        {/* Auth Mode Selector */}
        {authMode !== 'reset-password' && (
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setAuthMode('password')}
                className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                  authMode === 'password' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🔑 Email & Password
              </button>
              <button
                onClick={() => setAuthMode('magic-link')}
                className={`py-3 px-4 rounded-lg font-medium transition-colors ${
                  authMode === 'magic-link' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ✨ Magic Link
              </button>
            </div>
          </div>
        )}

        {/* Message Display */}
        {message && (
          <div className={`mb-4 p-3 rounded-lg ${
            message.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800' 
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <p className="text-sm">{message.text}</p>
          </div>
        )}

        {/* Password Auth Form */}
        {authMode === 'password' && (
          <form onSubmit={handlePasswordAuth} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="you@example.com"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : (authView === 'sign-in' ? 'Sign In' : 'Sign Up')}
            </button>

            <div className="flex justify-between items-center text-sm">
              <button
                type="button"
                onClick={() => setAuthView(authView === 'sign-in' ? 'sign-up' : 'sign-in')}
                className="text-blue-600 hover:text-blue-700"
              >
                {authView === 'sign-in' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>
            </div>

            <button
              type="button"
              onClick={() => setAuthMode('magic-link')}
              className="w-full text-sm text-gray-600 hover:text-gray-800"
            >
              Forgot your password? Use magic link instead
            </button>
          </form>
        )}

        {/* Magic Link Form */}
        {authMode === 'magic-link' && (
          <form onSubmit={handleMagicLinkLogin} className="space-y-4">
            <div>
              <label htmlFor="magic-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="magic-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>

            <p className="text-sm text-gray-600 text-center">
              {`We'll send you a secure link to sign in instantly without a password.`}
            </p>
          </form>
        )}

        {/* Password Reset Form */}
        {authMode === 'reset-password' && (
          <form onSubmit={handlePasswordResetRequest} className="space-y-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Reset Your Password</h3>
              <p className="text-sm text-gray-600 mt-1">
                {`Enter your email and we'll send you a link to reset your password.`}
              </p>
            </div>

            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                placeholder="you@example.com"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('password');
                setMessage(null);
              }}
              className="w-full text-sm text-gray-600 hover:text-gray-800"
            >
              ← Back to sign in
            </button>
          </form>
        )}
      </div>
    </div>
  );
}