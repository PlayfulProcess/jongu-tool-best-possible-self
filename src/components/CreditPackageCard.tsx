'use client';

import { CREDIT_PACKAGES } from '@/lib/stripe';

interface CreditPackageCardProps {
  packageId: keyof typeof CREDIT_PACKAGES;
  onSelect: (packageId: keyof typeof CREDIT_PACKAGES) => void;
  loading?: boolean;
}

export default function CreditPackageCard({ packageId, onSelect, loading }: CreditPackageCardProps) {
  const pkg = CREDIT_PACKAGES[packageId];

  return (
    <div
      className={`relative p-6 rounded-lg border-2 transition-all ${
        pkg.popular
          ? 'border-blue-500 shadow-lg scale-105'
          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600'
      } bg-white dark:bg-gray-800`}
    >
      {pkg.popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
          Most Popular
        </div>
      )}

      <div className="text-center mb-4">
        <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
          {pkg.label}
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          {pkg.description}
        </p>
      </div>

      <div className="space-y-2 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Base Credits:</span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {pkg.credits.toLocaleString()}
          </span>
        </div>
        {pkg.bonus > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Bonus:</span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              +{pkg.bonus.toLocaleString()}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm pt-2 border-t border-gray-200 dark:border-gray-700">
          <span className="font-semibold text-gray-700 dark:text-gray-300">Total:</span>
          <span className="font-bold text-gray-900 dark:text-white">
            {pkg.totalCredits.toLocaleString()} messages
          </span>
        </div>
      </div>

      {pkg.savings && (
        <div className="mb-4 text-center">
          <span className="inline-block bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-sm font-semibold">
            {pkg.savings}
          </span>
        </div>
      )}

      <button
        onClick={() => onSelect(packageId)}
        disabled={loading}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-all ${
          pkg.popular
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        {loading ? 'Processing...' : 'Buy Now'}
      </button>

      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-3">
        ${(pkg.amount / pkg.totalCredits).toFixed(4)} per message
      </p>
    </div>
  );
}
