'use client';

import { HeartIcon } from '@heroicons/react/24/outline';

interface DonateButtonProps {
  stripeLink: string;
  buttonText?: string;
  className?: string;
}

export default function DonateButton({ 
  stripeLink, 
  buttonText = "Support This Channel",
  className = "" 
}: DonateButtonProps) {
  return (
    <a 
      href={stripeLink}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 ${className}`}
    >
      <HeartIcon className="h-5 w-5" />
      {buttonText}
    </a>
  );
}