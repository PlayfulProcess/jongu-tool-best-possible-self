'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CreditPackageCard from '@/components/CreditPackageCard';
import { CreditPackageId } from '@/lib/stripe';

export default function CreditsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [balance, setBalance] = useState<{
    credits_usd: number;
    bonus_credits: number;
    total_credits: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');

  // Check for success/cancel parameters
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setSuccess(true);
      // Refresh balance after successful payment
      fetchBalance();
    }
    if (searchParams.get('canceled') === 'true') {
      setError('Payment was canceled. Feel free to try again!');
    }
  }, [searchParams]);

  const fetchBalance = async () => {
    try {
      const response = await fetch('/api/credits/balance');
      if (response.ok) {
        const data = await response.json();
        setBalance(data);
      }
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, []);

  const handlePurchase = async (packageId: CreditPackageId) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/credits/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setLoading(false);
    }
  };

  const handleCustomPurchase = async () => {
    const amount = parseFloat(customAmount);

    if (isNaN(amount) || amount < 5) {
      setError('Please enter an amount of at least $5');
      return;
    }

    if (amount > 1000) {
      setError('Maximum custom amount is $1000. Please contact support for larger purchases.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/credits/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customAmount: amount }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'Failed to start checkout');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Purchase AI Credits
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Continue using the AI assistant by purchasing credits. Each credit equals one AI message.
          </p>
        </div>

        {/* Current Balance */}
        {balance && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 mb-8 max-w-md mx-auto shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
              Current Balance
            </h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Regular Credits:</span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  ${balance.credits_usd.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Bonus Credits:</span>
                <span className="font-semibold text-green-600 dark:text-green-400">
                  ${balance.bonus_credits.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-base pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Total:</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  ${balance.total_credits.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 pt-2">
                ({Math.floor(balance.total_credits / 0.01)} messages remaining)
              </p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-8 max-w-md mx-auto">
            <p className="text-green-800 dark:text-green-200 text-center font-semibold">
              Payment successful! Your credits have been added to your account.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-8 max-w-md mx-auto">
            <p className="text-red-800 dark:text-red-200 text-center">{error}</p>
          </div>
        )}

        {/* Custom Amount Section - Featured */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-xl shadow-lg border-2 border-blue-200 dark:border-blue-900 p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Purchase Any Amount
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                Choose exactly how much you need (minimum $5, maximum $1000)
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300 font-bold text-lg">
                    $
                  </span>
                  <input
                    type="number"
                    min="5"
                    max="1000"
                    step="1"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full pl-10 pr-4 py-4 text-lg border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    disabled={loading}
                  />
                </div>
                {customAmount && parseFloat(customAmount) >= 5 && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 font-semibold">
                    ≈ {Math.floor(parseFloat(customAmount) * 100)} AI messages
                  </p>
                )}
              </div>
              <button
                onClick={handleCustomPurchase}
                disabled={loading || !customAmount || parseFloat(customAmount) < 5}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
              >
                Purchase Now
              </button>
            </div>
          </div>
        </div>

        {/* Credit Packages - De-emphasized */}
        <div className="max-w-4xl mx-auto mb-12">
          <h3 className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wide">
            Or choose a package
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 opacity-75">
            <CreditPackageCard
              packageId="small"
              onSelect={handlePurchase}
              loading={loading}
            />
            <CreditPackageCard
              packageId="medium"
              onSelect={handlePurchase}
              loading={loading}
            />
            <CreditPackageCard
              packageId="large"
              onSelect={handlePurchase}
              loading={loading}
            />
          </div>
        </div>

        {/* Info Section */}
        <div className="max-w-3xl mx-auto bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            How Credits Work
          </h3>
          <ul className="space-y-2 text-blue-800 dark:text-blue-200">
            <li>• Each AI message costs $0.01 (1 credit)</li>
            <li>• Bonus credits are used first, then regular credits</li>
            <li>• Credits never expire</li>
            <li>• Secure payment processing via Stripe</li>
            <li>• Get 10 free messages daily without credits</li>
          </ul>
        </div>

        {/* Back Button */}
        <div className="text-center mt-8">
          <button
            onClick={() => router.push('/')}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            ← Back to Journal
          </button>
        </div>
      </div>
    </div>
  );
}
