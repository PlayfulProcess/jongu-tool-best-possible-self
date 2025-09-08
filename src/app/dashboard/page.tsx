'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to channels dashboard based on environment
    const currentDomain = window.location.host;
    if (currentDomain.includes('dev-journal.recursive.eco')) {
      window.location.href = 'https://dev-channels.recursive.eco/';
    } else {
      window.location.href = 'https://channels.recursive.eco/';
    }
  }, [router]);
  
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}