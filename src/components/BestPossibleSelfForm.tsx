'use client';

import { useState } from 'react';
import { Timer } from './Timer';
import { AIAssistant } from './AIAssistant';
import { PrivacySettings, type DataSavingSetting } from './PrivacySettings';
import { useAuth } from './AuthProvider';
import { createClient } from '@/lib/supabase-client';

export function BestPossibleSelfForm() {
  const [content, setContent] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [dataSavingSetting, setDataSavingSetting] = useState<DataSavingSetting>('private');
  const [researchConsent, setResearchConsent] = useState<boolean>(false);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  
  const { user, signOut } = useAuth();
  const supabase = createClient();

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    // Auto-save after content changes (debounced)
    if (dataSavingSetting !== 'private') {
      setSaveStatus('saving');
      saveJournalEntry(newContent);
    }
  };

  const handleDataSavingChange = (newSetting: DataSavingSetting) => {
    setDataSavingSetting(newSetting);
    if (newSetting !== 'private' && content.trim()) {
      saveJournalEntry(content);
    }
  };

  const handleResearchConsentChange = (consent: boolean) => {
    setResearchConsent(consent);
    // Update existing entry if we have one
    if (currentEntryId && dataSavingSetting !== 'private') {
      saveJournalEntry(content);
    }
  };

  const saveJournalEntry = async (contentToSave: string) => {
    if (!user || dataSavingSetting === 'private' || !contentToSave.trim()) {
      setSaveStatus('idle');
      return;
    }

    // Determine final privacy setting (data saving + research consent)
    const finalPrivacySetting = researchConsent ? 'research_consent' : dataSavingSetting;

    try {
      if (currentEntryId) {
        // Update existing entry
        const { error } = await supabase
          .from('journal_entries')
          .update({
            content: contentToSave,
            privacy_setting: finalPrivacySetting,
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
            privacy_setting: finalPrivacySetting,
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
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* User Header */}
      <div className="flex justify-between items-center p-4 bg-gray-100 border-b">
        <div className="text-sm text-gray-600">
          Welcome, {user?.email}
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs text-gray-500">
            {saveStatus === 'saving' && '💾 Saving...'}
            {saveStatus === 'saved' && '✅ Saved'}
            {saveStatus === 'error' && '❌ Save Error'}
          </div>
          <button
            onClick={signOut}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Sign Out
          </button>
        </div>
      </div>
      
      {/* Header Section */}
      <div className="text-center py-10 px-6 border-b border-gray-200">
        <h1 className="text-4xl font-serif text-gray-800 mb-3">
          Best Possible Self
          <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded ml-3 font-sans">Beta</span>
        </h1>
        <p className="text-xl text-gray-600 italic mb-3">
          A playful process of envisioning your brightest future
        </p>
        <p className="text-sm text-gray-500">
          Based on research from{' '}
          <a href="https://ggia.berkeley.edu/practice/best_possible_self" 
             className="text-blue-600 underline">
            Berkeley&apos;s Greater Good Science Center
          </a>
        </p>
      </div>

      {/* Instructions */}
      <div className="p-6 bg-blue-50 border-l-4 border-blue-400">
        <h2 className="text-xl font-serif font-semibold text-gray-800 mb-4">How This Works</h2>
        <ul className="space-y-2 text-gray-700">
          <li><strong>15-minute writing exercise:</strong> Set aside focused time for deep reflection</li>
          <li><strong>Focus on specific life areas:</strong> Consider work, relationships, health, and personal growth</li>
          <li><strong>Be creative and detailed:</strong> Use vivid imagery and sensory details</li>
          <li><strong>Research-backed approach:</strong> Based on positive psychology research</li>
        </ul>
        
        <div className="mt-4 p-4 bg-white rounded">
          <h3 className="font-serif font-semibold text-gray-800 mb-2">Areas to Consider:</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <p><strong>Career & Work:</strong> What meaningful work are you doing? What impact are you making?</p>
            <p><strong>Relationships:</strong> How are you connecting with family, friends, and community?</p>
            <p><strong>Health & Wellness:</strong> How do you feel physically and mentally?</p>
            <p><strong>Personal Growth:</strong> What skills have you developed? What wisdom have you gained?</p>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="p-6 border-b">
        <PrivacySettings
          defaultDataSetting={dataSavingSetting}
          defaultResearchConsent={researchConsent}
          onDataSettingChange={handleDataSavingChange}
          onResearchConsentChange={handleResearchConsentChange}
        />
      </div>

      {/* Writing Section */}
      <div className="p-6">
        <h2 className="text-2xl font-serif text-gray-800 mb-6">Your Best Possible Future</h2>
        
        <Timer onTimeUpdate={setTimeSpent} />
        
        <textarea
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Imagine yourself in the future, having achieved your most important goals and living your best possible life. Write about what you see, feel, and experience. Be as specific and vivid as possible..."
          className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
        />

        <div className="mt-4 text-sm text-gray-600 mb-6">
          Time spent: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
        </div>

        <AIAssistant 
          content={content} 
          privacySetting={researchConsent ? 'research_consent' : dataSavingSetting}
          entryId={currentEntryId}
        />

        <div className="bg-gray-50 rounded-lg p-6 text-center mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">📝 Keep a Record</h3>
          <p className="text-gray-600">Print this page or copy your text to keep a record of your best possible self vision and insights.</p>
        </div>
      </div>
    </div>
  );
}