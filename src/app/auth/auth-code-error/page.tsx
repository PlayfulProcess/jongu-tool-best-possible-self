export default function AuthError() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Authentication Error</h1>
        <p className="text-gray-600 mb-6">
          There was an error processing your authentication request. 
          This could be because the link expired or was already used.
        </p>
        <a
          href="/auth"
          className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </a>
      </div>
    </div>
  )
}