'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';

interface TemplateCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateCreated: () => void;
}

export function TemplateCreator({ isOpen, onClose, onTemplateCreated }: TemplateCreatorProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');


  const [formData, setFormData] = useState({
    name: '',
    description: '',
    ui_prompt: '',
    ai_prompt: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError('You must be logged in to create templates');
      return;
    }

    if (!formData.name || !formData.ui_prompt) {
      setError('Template name and prompt are required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await fetch('/api/templates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create template');
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        ui_prompt: '',
        ai_prompt: ''
      });

      onTemplateCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create template');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Create New Journal Template
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!user ? (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Please sign in to create custom templates
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Template Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Gratitude Journal, Problem-Solving, Daily Reflection"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600"
                  maxLength={100}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of what this template helps with"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600"
                  maxLength={200}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Journal Prompt *
                </label>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  This is what users will see as the placeholder text in their journal
                </div>
                <textarea
                  value={formData.ui_prompt}
                  onChange={(e) => setFormData({ ...formData, ui_prompt: e.target.value })}
                  placeholder="Write the prompt that will guide users in their journaling..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 h-32 resize-none"
                  maxLength={1000}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI Assistant Prompt (Optional)
                </label>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Customize how the AI assistant responds to entries using this template
                </div>
                <textarea
                  value={formData.ai_prompt}
                  onChange={(e) => setFormData({ ...formData, ai_prompt: e.target.value })}
                  placeholder="e.g., You are a supportive coach helping users explore gratitude. Ask thoughtful questions..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 h-32 resize-none"
                  maxLength={1000}
                />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  💡 In Phase 1, all templates are public and can be used by anyone. Private templates coming soon!
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !user}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Creating...' : 'Create Template'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}