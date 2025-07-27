'use client';

interface CategoryStats {
  [key: string]: number;
}

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categoryStats: CategoryStats;
}

const categories = [
  { key: 'all', name: 'All Tools', emoji: '🌟' },
  { key: 'mindfulness', name: 'Mindfulness & Creativity', emoji: '🧘' },
  { key: 'distress-tolerance', name: 'Distress Tolerance', emoji: '🛡️' },
  { key: 'emotion-regulation', name: 'Emotion Regulation', emoji: '❤️' },
  { key: 'interpersonal-effectiveness', name: 'Interpersonal Effectiveness', emoji: '🤝' }
];

export function CategoryFilter({ selectedCategory, onCategoryChange, categoryStats }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-8">
      {categories.map((category) => {
        const count = category.key === 'all' 
          ? Object.values(categoryStats).reduce((sum, count) => sum + count, 0)
          : categoryStats[category.key] || 0;
        
        const isSelected = selectedCategory === category.key;
        
        return (
          <button
            key={category.key}
            onClick={() => onCategoryChange(category.key)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-200 ${
              isSelected
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-blue-500 hover:text-blue-600'
            }`}
          >
            <span className="text-lg">{category.emoji}</span>
            <span className="font-medium">{category.name}</span>
            <span className={`text-sm px-2 py-0.5 rounded-full ${
              isSelected
                ? 'bg-white/20 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}>
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}