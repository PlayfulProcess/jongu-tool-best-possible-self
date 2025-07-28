'use client';

import { useState, useEffect, useCallback } from 'react';
import { ToolCard } from './ToolCard';

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

interface ToolGridProps {
  selectedCategory: string;
  sortBy: string;
  searchQuery?: string;
  onToolRate?: (toolId: string, rating: number, review?: string) => void;
}

export function ToolGrid({ selectedCategory, sortBy, searchQuery = '', onToolRate }: ToolGridProps) {
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTools = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory);
      }
      params.append('sort', sortBy);
      
      // Add cache-busting parameter for force refresh
      if (forceRefresh) {
        params.append('_t', Date.now().toString());
      }
      
      const response = await fetch(`/api/community/tools?${params}`, {
        cache: forceRefresh ? 'no-cache' : 'default'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch tools');
      }
      
      const data = await response.json();
      setTools(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching tools:', err);
      setError('Failed to load tools. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, sortBy]);

  // Filter tools based on search query
  const filteredTools = tools.filter(tool => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase().trim();
    
    // Check if searching for "jongu" specifically for our tools
    if (query === 'jongu' || query === 'jongu tools') {
      return tool.creator_name.toLowerCase().includes('jongu');
    }
    
    // General search across title, creator name, and description
    return (
      tool.title.toLowerCase().includes(query) ||
      tool.creator_name.toLowerCase().includes(query) ||
      tool.description.toLowerCase().includes(query) ||
      tool.category.toLowerCase().includes(query)
    );
  });

  useEffect(() => {
    fetchTools();
  }, [selectedCategory, sortBy, fetchTools]);

  const handleToolRate = async (toolId: string, rating: number, review?: string) => {
    try {
      const response = await fetch(`/api/community/tools/${toolId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, review_text: review })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle duplicate rating case
        if (response.status === 409) {
          alert('ℹ️ ' + errorData.error);
          return; // Don't refresh if it's a duplicate rating
        }
        
        throw new Error(errorData.error || 'Failed to submit rating');
      }

      // Small delay to ensure database update is complete, then refresh
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchTools(true);
      
      if (onToolRate) {
        onToolRate(toolId, rating, review);
      }
      
      // Show success message
      alert('✅ Rating submitted successfully!');
    } catch (err) {
      console.error('Error submitting rating:', err);
      alert('❌ Failed to submit rating. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
            <div className="aspect-[4/3] bg-gray-200"></div>
            <div className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">⚠️ {error}</div>
        <button
          onClick={fetchTools}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (filteredTools.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No tools found</h3>
        <p className="text-gray-600">
          {searchQuery.trim() 
            ? `No tools match "${searchQuery}". Try a different search term or clear the search.`
            : selectedCategory === 'all' 
              ? 'No tools are available yet. Be the first to share one!' 
              : 'No tools found in this category. Try a different category or browse all tools.'}
        </p>
        {searchQuery.trim() && (
          <p className="text-sm text-blue-600 mt-2">
            💡 Try searching "Jongu" to see our privacy-first tools!
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {searchQuery.trim() && (
        <div className="col-span-full mb-4 text-center">
          <p className="text-sm text-gray-600">
            Showing {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''} 
            {searchQuery.toLowerCase().includes('jongu') ? ' from Jongu (privacy-first tools)' : ` matching "${searchQuery}"`}
          </p>
        </div>
      )}
      {filteredTools.map((tool) => (
        <ToolCard 
          key={tool.id} 
          tool={tool} 
          onRate={handleToolRate}
        />
      ))}
    </div>
  );
}