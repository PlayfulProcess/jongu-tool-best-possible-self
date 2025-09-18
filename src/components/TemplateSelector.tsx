'use client';

import { useState, useEffect, useCallback } from 'react';
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

  const fetchTemplates = useCallback(async () => {
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
  }, [selectedTemplateId, onTemplateSelect]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const selectedTemplate = templates.find(t => t.uuid === selectedTemplateId);

  if (loading) {
    return (
      <div className="relative">
        <div className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">
              {selectedTemplate?.name || 'Select a template'}
            </div>
            {selectedTemplate?.description && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
        </div>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-64 overflow-y-auto">
            <div className="py-2">
              <button
                onClick={() => {
                  onCreateNew();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors border-b border-gray-100 dark:border-gray-700"
              >
                <div className="font-medium text-blue-600 dark:text-blue-400">
                  + Create New Template
                </div>
                <div className="text-sm text-blue-500 dark:text-blue-300 mt-1">
                  Design your own journaling prompt
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
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {template.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}