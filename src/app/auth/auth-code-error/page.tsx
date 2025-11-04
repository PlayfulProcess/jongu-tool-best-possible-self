'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-client';
import { useRouter } from 'next/navigation';

export default function AuthCodeError() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const supabase = createClient();

  // Auto-populate email from sessionStorage
  useEffect(() => {
    const storedEmail = sessionStorage.getItem('auth-email');
    if (storedEmail) {
      setEmail(storedEmail);
    }
  }, []);

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    console.log('🔢 Attempting OTP verification from error page:', {
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

      // Success! User is now logged in
      console.log('✅ OTP verification successful, redirecting to main page');
      window.location.href = '/';
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

  const handleResend = async () => {
    if (!email) {
      setMessage({
        type: 'error',
        text: 'Please enter your email address first.',
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg max-w-md w-full">
        {/* Error Icon */}
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
          Authentication Failed
        </h1>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 text-center">
          We couldn&apos;t verify your login link. This could happen if:
        </p>

        <ul className="text-sm text-gray-600 dark:text-gray-400 mb-6 space-y-1 list-disc list-inside">
          <li>The link has expired (links are valid for 1 hour)</li>
          <li>The link was already used</li>
          <li>The link was copied incorrectly</li>
        </ul>

        {/* OTP Alternative */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-900 dark:text-blue-200 mb-2">
            <strong>💡 Try using the 6-digit code instead</strong>
          </p>
          <p className="text-xs text-blue-800 dark:text-blue-300">
            Check your email for the code. If you&apos;re using corporate email (Outlook, etc.), this method works better than the magic link.
          </p>
        </div>

        <form onSubmit={handleVerifyOTP} className="space-y-4">
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
              onClick={() => router.push('/')}
              className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              ← Return home
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
            <br />
            Need help? Email <strong>pp@playfulprocess.com</strong>
          </p>
        </form>
      </div>
    </div>
  );
}
