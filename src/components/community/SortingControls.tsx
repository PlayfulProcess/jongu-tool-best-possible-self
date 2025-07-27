'use client';

interface SortingControlsProps {
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const sortOptions = [
  { key: 'rating', name: 'By Rating', icon: '⭐' },
  { key: 'newest', name: 'Newest', icon: '🕒' },
  { key: 'popular', name: 'Popular', icon: '🔥' }
];

export function SortingControls({ sortBy, onSortChange }: SortingControlsProps) {
  return (
    <div className="flex items-center space-x-2">
      <span className="text-sm text-gray-600 font-medium">Sort by:</span>
      <div className="flex space-x-1">
        {sortOptions.map((option) => {
          const isSelected = sortBy === option.key;
          
          return (
            <button
              key={option.key}
              onClick={() => onSortChange(option.key)}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isSelected
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <span>{option.icon}</span>
              <span>{option.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}