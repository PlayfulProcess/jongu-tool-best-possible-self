'use client';

interface StatsDisplayProps {
  totalTools: number;
  averageRating: number;
}

export function StatsDisplay({ totalTools, averageRating }: StatsDisplayProps) {
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
      <div className="grid grid-cols-2 gap-6 text-center">
        <div>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {totalTools}
          </div>
          <div className="text-sm text-gray-600">
            Community Tools Available
          </div>
        </div>
        
        <div>
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