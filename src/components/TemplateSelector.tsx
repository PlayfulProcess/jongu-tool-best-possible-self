'use client';

import { useState, useEffect } from 'react';
import { Database } from '@/types/database.types';

type JournalTemplate = Database['public']['Tables']['journal_templates']['Row'];

interface TemplateSelectorProps {
  selectedTemplateId?: string;
  onTemplateSelect: (template: JournalTemplate) => void;
  onCreateNew: () => void;
}

export function TemplateSelector({ selectedTemplateId, onTemplateSelect, onCreateNew }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<JournalTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();

      if (data.templates) {
        setTemplates(data.templates);

        // Select default template if none selected
        if (!selectedTemplateId && data.templates.length > 0) {
          const defaultTemplate = data.templates.find((t: JournalTemplate) =>
            t.uuid === '00000000-0000-0000-0000-000000000001'
          ) || data.templates[0];
          onTemplateSelect(defaultTemplate);
        }
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectedTemplate = templates.find(t => t.uuid === selectedTemplateId);

  if (loading) {
    return (
      <div className="relative">
        <div className="px-4 py-2 border rounded-lg bg-gray-50 dark:bg-gray-800 animate-pulse">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-between"
      >
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {selectedTemplate?.name || 'Select a template'}
          </div>
          {selectedTemplate?.description && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {selectedTemplate.description}
            </div>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 mt-2 w-full bg-white dark:bg-gray-800 border rounded-lg shadow-lg max-h-96 overflow-y-auto">
            <button
              onClick={() => {
                onCreateNew();
                setIsOpen(false);
              }}
              className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b dark:border-gray-700"
            >
              <div className="flex items-center gap-2">
                <span className="text-blue-600 dark:text-blue-400">➕</span>
                <div>
                  <div className="font-medium text-blue-600 dark:text-blue-400">
                    Create New Template
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Design your own journaling prompt
                  </div>
                </div>
              </div>
            </button>

            {templates.map((template) => (
              <button
                key={template.uuid}
                onClick={() => {
                  onTemplateSelect(template);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                  template.uuid === selectedTemplateId ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {template.name}
                </div>
                {template.description && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {template.description}
                  </div>
                )}
                {template.user_id === null && (
                  <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                    📚 Default Template
                  </div>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}