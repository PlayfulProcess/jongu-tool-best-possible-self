'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';

type AuthMode = 'email' | 'verify';

interface DualAuthProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DualAuth({ isOpen, onClose }: DualAuthProps) {
  const [mode, setMode] = useState<AuthMode>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const supabase = createClient();

  // Auto-close modal on successful auth
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        onClose();
        setEmail('');
        setOtp('');
        setMode('email');
        setMessage(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth, onClose]);

  // Escape key handler
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

  // Step 1: Send OTP code via email
  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Store email in sessionStorage for error page fallback
      sessionStorage.setItem('auth-email', email);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: `Check your email! We sent a 6-digit code to ${email}`,
      });
      setMode('verify');
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to send email. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP code
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    console.log('🔢 Attempting OTP verification:', {
      email,
      otpLength: otp.length,
      otpValue: otp,
    });

    try {
      const { error, data } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      console.log('🔢 OTP verification response:', {
        success: !error,
        error: error?.message,
        hasSession: !!data?.session,
        hasUser: !!data?.user,
      });

      if (error) throw error;

      // Success! Modal will auto-close via onAuthStateChange listener
      console.log('✅ OTP verification successful');
    } catch (error: unknown) {
      console.error('❌ OTP verification failed:', error);
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Invalid code. Please check and try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Resend code
  const handleResend = async () => {
    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      setMessage({
        type: 'success',
        text: 'New code sent! Check your email.',
      });
    } catch (error: unknown) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to resend. Please wait 60 seconds.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg max-w-md w-full shadow-xl">
        {/* Step 1: Enter Email */}
        {mode === 'email' && (
          <>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Sign In</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enter your email to receive a 6-digit verification code
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4 text-xs text-left space-y-1">
              <p className="text-blue-900 dark:text-blue-200">
                <strong>📧 How it works:</strong>
              </p>
              <p className="text-blue-800 dark:text-blue-300">
                1. Enter your email address
              </p>
              <p className="text-blue-800 dark:text-blue-300">
                2. Check your email for a 6-digit code
              </p>
              <p className="text-blue-800 dark:text-blue-300">
                3. Enter the code to sign in
              </p>
              <p className="text-blue-800 dark:text-blue-300 mt-2">
                • Check your <strong>Spam folder</strong> if you don&apos;t see it
              </p>
              <p className="text-blue-800 dark:text-blue-300">
                • Need help? Email <strong>pp@playfulprocess.com</strong>
              </p>
            </div>

            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={loading}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
              </div>

              {message && (
                <div
                  className={`p-3 rounded-lg text-sm ${
                    message.type === 'success'
                      ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700'
                      : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700'
                  }`}
                >
                  {message.text}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Sending...' : 'Send Verification Code'}
              </button>
            </form>

            <button
              onClick={onClose}
              className="mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 w-full"
            >
              Continue without signing in
            </button>
          </>
        )}

        {/* Step 2: Verify OTP */}
        {mode === 'verify' && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Check Your Email</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                We sent a 6-digit code to <strong className="text-gray-900 dark:text-gray-100">{email}</strong>
              </p>
              <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  📧 Enter the 6-digit code from your email below
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-300 mt-2">
                  Don't see it? Check your spam folder
                </p>
              </div>
            </div>

            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Enter 6-digit code
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="123456"
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 placeholder-gray-500 dark:placeholder-gray-400"
                maxLength={6}
                pattern="\d{6}"
              />
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700'
                    : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700'
                }`}
              >
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <div className="flex justify-between text-sm">
              <button
                type="button"
                onClick={() => {
                  setMode('email');
                  setOtp('');
                  setMessage(null);
                }}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                ← Change email
              </button>
              <button
                type="button"
                onClick={handleResend}
                disabled={loading}
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 disabled:opacity-50"
              >
                Resend code
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Code expires in 1 hour • Can request new code after 60 seconds
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
