'use client';

import { useState } from 'react';
import { Timer } from './Timer';
import { AIAssistant } from './AIAssistant';
type DataSavingSetting = 'private' | 'save_private';
import { useAuth } from './AuthProvider';
import { createClient } from '@/lib/supabase-client';

export function BestPossibleSelfForm() {
  const [content, setContent] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [dataSavingSetting] = useState<DataSavingSetting>('private');
  const [researchConsent] = useState<boolean>(false);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  const { user, signOut } = useAuth();
  const supabase = createClient();

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    // Only auto-save if user has explicitly saved before
    if (dataSavingSetting !== 'private' && currentEntryId) {
      setSaveStatus('saving');
      saveJournalEntry(newContent);
    }
  };

  const handleManualSave = () => {
    if (dataSavingSetting !== 'private' && content.trim()) {
      setSaveStatus('saving');
      saveJournalEntry(content);
    }
  };


  const saveJournalEntry = async (contentToSave: string) => {
    if (!user || dataSavingSetting === 'private' || !contentToSave.trim()) {
      setSaveStatus('idle');
      return;
    }

    // Determine data flags based on settings
    const isPublic = false; // We removed public blog option
    const hasResearchConsent = researchConsent;

    try {
      if (currentEntryId) {
        // Update existing entry
        const { error } = await supabase
          .from('journal_entries')
          .update({
            content: contentToSave,
            is_public: isPublic,
            research_consent: hasResearchConsent,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentEntryId);

        if (error) throw error;
      } else {
        // Create new entry
        const { data, error } = await supabase
          .from('journal_entries')
          .insert({
            user_id: user.id,
            content: contentToSave,
            is_public: isPublic,
            research_consent: hasResearchConsent,
            title: 'Best Possible Self - ' + new Date().toLocaleDateString()
          })
          .select()
          .single();

        if (error) throw error;
        if (data) setCurrentEntryId(data.id);
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving journal entry:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* User Header */}
      <div className="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-900/20 border-b border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Welcome, {user?.email}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {saveStatus === 'saving' && '💾 Saving...'}
            {saveStatus === 'saved' && '✅ Saved'}
            {saveStatus === 'error' && '❌ Save Error'}
          </div>
          <button
            onClick={signOut}
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
          >
            Sign Out
          </button>
        </div>
      </div>
      
      {/* Header Section */}
      <div className="text-center py-10 px-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-4xl font-serif text-gray-800 dark:text-gray-200 mb-3">
          Best Possible Self
          <span className="text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 px-2 py-1 rounded ml-3 font-sans">Beta</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 italic mb-3">
          A playful process of envisioning your brightest future
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Based on research from{' '}
          <a href="https://ggia.berkeley.edu/practice/best_possible_self" 
             className="text-blue-600 dark:text-blue-400 underline">
            Berkeley&apos;s Greater Good Science Center
          </a>
        </p>
      </div>

      {/* Instructions */}
      <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400">
        <h2 className="text-xl font-serif font-semibold text-gray-800 dark:text-gray-200 mb-4">How This Works</h2>
        <ul className="space-y-2 text-gray-700 dark:text-gray-300">
          <li><strong>15-minute writing exercise:</strong> Set aside focused time for deep reflection</li>
          <li><strong>Focus on specific life areas:</strong> Consider work, relationships, health, and personal growth</li>
          <li><strong>Be creative and detailed:</strong> Use vivid imagery and sensory details</li>
          <li><strong>Research-backed approach:</strong> Based on positive psychology research</li>
        </ul>
        
        <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded">
          <h3 className="font-serif font-semibold text-gray-800 dark:text-gray-200 mb-2">Areas to Consider:</h3>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <p><strong>Career & Work:</strong> What meaningful work are you doing? What impact are you making?</p>
            <p><strong>Relationships:</strong> How are you connecting with family, friends, and community?</p>
            <p><strong>Health & Wellness:</strong> How do you feel physically and mentally?</p>
            <p><strong>Personal Growth:</strong> What skills have you developed? What wisdom have you gained?</p>
          </div>
        </div>
      </div>

      {/* Writing Section */}
      <div className="p-6">
        <h2 className="text-2xl font-serif text-gray-800 dark:text-gray-200 mb-6">Your Best Possible Future</h2>
        
        <Timer onTimeUpdate={setTimeSpent} />
        
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Imagine yourself in the future, having achieved your most important goals and living your best possible life. Write about what you see, feel, and experience. Be as specific and vivid as possible..."
          className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800"
        />

        <div className="mt-4 flex justify-between items-center mb-6">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Time spent: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
          </div>
          {dataSavingSetting !== 'private' && (
            <button
              onClick={handleManualSave}
              disabled={!content.trim() || saveStatus === 'saving'}
              className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saveStatus === 'saving' ? '💾 Saving...' : 
               currentEntryId ? '💾 Update' : '💾 Save'}
            </button>
          )}
        </div>

        <AIAssistant 
          content={content} 
          researchConsent={researchConsent}
          entryId={currentEntryId}
        />

        <div className="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-6 text-center mt-6">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">📝 Keep a Record</h3>
          {dataSavingSetting === 'private' ? (
            <p className="text-gray-600 dark:text-gray-400">
              Since you&apos;re using private mode, remember to save your writing in a safe place. 
              It might be helpful to go back and read it every now and then. Sometimes we see that we are closer than we realize to our best possible self, 
              or at least it reminds us to keep moving in the direction we feel is right under so many life distractions.
            </p>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">
              Your writing has been saved securely. You can return anytime to continue reflecting on your best possible self.
              You can also delete any saved entries at any time from the &quot;My Entries&quot; section.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}