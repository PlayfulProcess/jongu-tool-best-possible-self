'use client'

import { BestPossibleSelfForm } from '@/components/BestPossibleSelfForm';
import { AuthForm } from '@/components/AuthForm';
import { useAuth } from '@/components/AuthProvider';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-50 py-8">
        <AuthForm />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <BestPossibleSelfForm />
    </main>
  );
}