'use client';

import React from 'react';

interface DonateButtonProps {
  className?: string;
  text?: string;
  compact?: boolean;
}

export function CalmDonateButton({ className = '', text = 'Donate', compact = false }: DonateButtonProps) {
  const handleDonate = () => {
    window.open('https://buy.stripe.com/fZu9AS2IZdeS58tfoa9ws00', '_blank', 'noopener,noreferrer');
  };

  if (compact) {
    return (
      <button
        onClick={handleDonate}
        className={`inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-2 rounded-full font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 ${className}`}
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
        {text}
      </button>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center ${className}`}>
      <div className="w-16 h-16 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-3xl">💝</span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Support the Commons</h3>
      <p className="text-sm text-gray-600 mb-4">
        Help keep this platform free and accessible for everyone. Your donation supports development and maintenance.
      </p>
      <button
        onClick={handleDonate}
        className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200"
      >
        <span className="inline-flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          Donate Now
        </span>
      </button>
      <p className="text-xs text-gray-500 mt-3">
        100% donation-based • No ads • No tracking
      </p>
    </div>
  );
}