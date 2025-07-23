'use client';

import { useState } from 'react';

export function BestPossibleSelfForm() {
  const [content, setContent] = useState('');

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header Section */}
      <div className="text-center py-10 px-6 border-b border-gray-200">
        <h1 className="text-4xl font-serif text-gray-800 mb-3">
          Best Possible Self
        </h1>
        <p className="text-xl text-gray-600 italic mb-3">
          A playful process of envisioning your brightest future
        </p>
        <p className="text-sm text-gray-500">
          Based on research from{' '}
          <a href="https://ggia.berkeley.edu/practice/best_possible_self" 
             className="text-blue-600 underline">
            Berkeley's Greater Good Science Center
          </a>
        </p>
      </div>

      {/* Instructions */}
      <div className="p-6 bg-blue-50 border-l-4 border-blue-400">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">How This Works</h2>
        <ul className="space-y-2 text-gray-700">
          <li><strong>15-minute writing exercise:</strong> Set aside focused time for deep reflection</li>
          <li><strong>Focus on specific life areas:</strong> Consider work, relationships, health, and personal growth</li>
          <li><strong>Be creative and detailed:</strong> Use vivid imagery and sensory details</li>
          <li><strong>Research-backed approach:</strong> Based on positive psychology research</li>
        </ul>
        
        <div className="mt-4 p-4 bg-white rounded border">
          <h3 className="font-semibold text-gray-800 mb-2">Areas to Consider:</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p><strong>Career & Work:</strong> What meaningful work are you doing? What impact are you making?</p>
            <p><strong>Relationships:</strong> How are you connecting with family, friends, and community?</p>
            <p><strong>Health & Wellness:</strong> How do you feel physically and mentally?</p>
            <p><strong>Personal Growth:</strong> What skills have you developed? What wisdom have you gained?</p>
          </div>
        </div>
      </div>

      {/* Writing Section */}
      <div className="p-6">
        <h2 className="text-2xl font-serif text-gray-800 mb-6">Your Best Possible Future</h2>
        
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Imagine yourself in the future, having achieved your most important goals and living your best possible life. Write about what you see, feel, and experience. Be as specific and vivid as possible..."
          className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="bg-gray-50 rounded-lg p-6 text-center mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">📝 Keep a Record</h3>
          <p className="text-gray-600">Print this page or copy your text to keep a record of your best possible self vision and insights.</p>
        </div>
      </div>
    </div>
  );
}