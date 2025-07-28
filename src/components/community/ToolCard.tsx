'use client';

import { useState } from 'react';

interface Tool {
  id: string;
  title: string;
  claude_url: string;
  category: string;
  description: string;
  creator_name: string;
  creator_link?: string;
  creator_background?: string;
  thumbnail_url?: string;
  avg_rating: number;
  total_ratings: number;
  view_count: number;
  click_count: number;
}

interface ToolCardProps {
  tool: Tool;
  onRate?: (toolId: string, rating: number, review?: string) => void;
}

const categoryEmojis = {
  'mindfulness': '🧘',
  'distress-tolerance': '🛡️',
  'emotion-regulation': '❤️',
  'interpersonal-effectiveness': '🤝'
};

const categoryNames = {
  'mindfulness': 'Mindfulness & Creativity',
  'distress-tolerance': 'Distress Tolerance',
  'emotion-regulation': 'Emotion Regulation',
  'interpersonal-effectiveness': 'Interpersonal Effectiveness'
};

export function ToolCard({ tool, onRate }: ToolCardProps) {
  const [showRating, setShowRating] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [review, setReview] = useState('');

  const handleToolClick = async () => {
    // Track click for analytics
    try {
      await fetch('/api/community/tools/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ toolId: tool.id })
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
    
    // Open tool in new tab
    window.open(tool.claude_url, '_blank');
  };

  const handleSubmitRating = () => {
    if (selectedRating > 0 && onRate) {
      onRate(tool.id, selectedRating, review);
      setShowRating(false);
      setSelectedRating(0);
      setReview('');
    }
  };

  const renderStars = (rating: number, interactive = false, size = 'w-4 h-4') => {
    return (
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={interactive ? () => setSelectedRating(star) : undefined}
            className={`${size} ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'} transition-transform`}
            disabled={!interactive}
          >
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
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
      {/* Image Container - SoundStrue inspired */}
      <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
        {tool.thumbnail_url ? (
          <img 
            src={tool.thumbnail_url} 
            alt={tool.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100 flex items-center justify-center relative overflow-hidden">
            {/* Subtle pattern background */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-2 left-2 w-8 h-8 bg-white rounded-full"></div>
              <div className="absolute top-8 right-4 w-4 h-4 bg-white rounded-full"></div>
              <div className="absolute bottom-4 left-6 w-6 h-6 bg-white rounded-full"></div>
              <div className="absolute bottom-2 right-2 w-3 h-3 bg-white rounded-full"></div>
            </div>
            <span className="text-5xl drop-shadow-lg relative z-10">{categoryEmojis[tool.category as keyof typeof categoryEmojis] || '🔧'}</span>
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium text-gray-700">
            {categoryEmojis[tool.category as keyof typeof categoryEmojis]} {categoryNames[tool.category as keyof typeof categoryNames]}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Title and Rating */}
        <div className="mb-3">
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
            {tool.title}
          </h3>
          <div className="flex items-center space-x-2">
            {renderStars(tool.avg_rating)}
            <span className="text-sm text-gray-600">
              {tool.avg_rating.toFixed(1)} ({tool.total_ratings} reviews)
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {tool.description}
        </p>

        {/* Creator Info */}
        <div className="mb-4 pb-4 border-b border-gray-100">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {tool.creator_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {tool.creator_link ? (
                  <a 
                    href={tool.creator_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 underline"
                  >
                    {tool.creator_name}
                  </a>
                ) : (
                  tool.creator_name
                )}
              </p>
              {tool.creator_background && (
                <p className="text-xs text-gray-500 line-clamp-2">
                  {tool.creator_background}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleToolClick}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Try This Tool →
          </button>
          
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowRating(!showRating)}
              className="text-sm text-gray-600 hover:text-gray-800 underline"
            >
              Rate & Review
            </button>
            <div className="text-xs text-gray-500">
              {tool.view_count} views • {tool.click_count} tries
            </div>
          </div>
        </div>

        {/* Rating Modal */}
        {showRating && (
          <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Rate this tool</h4>
            
            <div className="mb-3">
              <label className="block text-xs text-gray-600 mb-2">Your rating</label>
              {renderStars(selectedRating, true, 'w-6 h-6')}
            </div>
            
            <div className="mb-4">
              <label className="block text-xs text-gray-600 mb-2">Review (optional)</label>
              <textarea
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="Share your experience..."
                className="w-full p-2 text-sm text-gray-900 border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handleSubmitRating}
                disabled={selectedRating === 0}
                className="flex-1 bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Submit Rating
              </button>
              <button
                onClick={() => setShowRating(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-3 rounded text-sm hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}