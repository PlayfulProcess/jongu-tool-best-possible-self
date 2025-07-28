'use client';

interface StatsDisplayProps {
  totalTools: number;
  averageRating: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function StatsDisplay({ totalTools, averageRating, searchQuery, onSearchChange }: StatsDisplayProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <div key={star} className="w-4 h-4">
            <svg
              fill={star <= rating ? '#facc15' : 'none'}
              stroke={star <= rating ? '#facc15' : '#d1d5db'}
              strokeWidth={1}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
              />
            </svg>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {/* Search Bar */}
        <div className="search-container">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <span className="text-xl">🔍</span>
              <input
                type="text"
                placeholder="Search tools or 'Jongu' for privacy-first tools..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 text-sm"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {totalTools}
          </div>
          <div className="text-sm text-gray-600">
            Community Tools Available
          </div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-2">
            <span className="text-3xl font-bold text-green-600">
              {averageRating.toFixed(1)}
            </span>
            <div className="mt-1">
              {renderStars(averageRating)}
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Average Community Rating
          </div>
        </div>
      </div>
    </div>
  );
}