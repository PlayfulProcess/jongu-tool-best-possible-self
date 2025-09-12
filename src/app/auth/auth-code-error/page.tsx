'use client'

import { useRouter } from 'next/navigation'

export default function AuthCodeError() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Authentication Error
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          There was an error processing your authentication request. This could be because the link expired or was already used.
        </p>

        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Return Home
        </button>

        <button
          onClick={() => router.push('/')}
          className="block mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
        >
          Continue without signing in
        </button>
      </div>
    </div>
  )
}
