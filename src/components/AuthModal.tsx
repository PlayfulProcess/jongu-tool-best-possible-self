'use client';

import { createClient } from '@/lib/supabase-client';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { useEffect, useState } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
}

export function AuthModal({ isOpen, onClose, title = "Welcome to Best Possible Self", subtitle = "Sign in to save your work and access it anywhere" }: AuthModalProps) {
  const supabase = createClient();
  const [showGitHubWarning, setShowGitHubWarning] = useState(false);
  const [showAuthForm, setShowAuthForm] = useState(true);

  // Close modal on successful auth
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        onClose();
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

  const handleGitHubAuth = async () => {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: typeof window !== 'undefined' ? 
            `${window.location.protocol}//${window.location.host}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`
            : undefined
        }
      });
    } catch (error) {
      console.error('Error with GitHub auth:', error);
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

        {(showGitHubWarning && false) ? (
          /* GitHub Warning - Hidden with GitHub auth */
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-red-600 mb-2">⚠️ Warning</h2>
              <p className="text-gray-700 text-sm mb-4">
                Signing in with GitHub will clear any unsaved work in your current session. 
                Make sure you&apos;ve saved everything important before continuing.
              </p>
              <p className="text-gray-600 text-sm">
                If you have unsaved journal content or AI chat history, consider using email/password signup instead to preserve your work.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setShowGitHubWarning(false);
                  handleGitHubAuth();
                }}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Continue with GitHub (I understand I&apos;ll lose my work)
              </button>
              <button
                onClick={() => {
                  setShowGitHubWarning(false);
                  setShowAuthForm(true);
                }}
                className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors font-medium"
              >
                Cancel - Use Email Instead
              </button>
            </div>
          </div>
        ) : (
          /* Regular Auth Form */
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
              <p className="text-gray-600 text-sm">{subtitle}</p>
            </div>

            {/* GitHub Auth - Hidden for now, uncomment to re-enable */}
            {false && (
              <>
                {/* Custom GitHub Button */}
                <button
                  onClick={() => setShowGitHubWarning(true)}
                  className="w-full mb-4 bg-gray-900 text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.530.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                  <span>Continue with GitHub</span>
                </button>

                <div className="relative mb-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or continue with</span>
                  </div>
                </div>
              </>
            )}

            {/* Email/Password Auth Form */}
            <Auth
              supabaseClient={supabase}
              appearance={{ 
                theme: ThemeSupa,
                style: {
                  button: {
                    background: '#000000',
                    borderColor: '#000000',
                    color: '#ffffff',
                  },
                  anchor: {
                    color: '#000000',
                  },
                  label: {
                    color: '#000000',
                  },
                  message: {
                    color: '#000000',
                  },
                }
              }}
              providers={[]}
              redirectTo={typeof window !== 'undefined' ? 
                `${window.location.protocol}//${window.location.host}/auth/callback?next=${encodeURIComponent(window.location.pathname)}`
                : undefined}
              onlyThirdPartyProviders={false}
              showLinks={true}
              view="sign_in"
            />
          </div>
        )}
      </div>
    </div>
  );
}