'use client'

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

declare global {
  interface Window {
    autoSaveTimeout: NodeJS.Timeout;
    savePendingChatMessages?: (userId: string, entryId: string, researchConsent: boolean) => Promise<void>;
  }
}
import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase-client';
import { Timer } from '@/components/Timer';
import { AIAssistant } from '@/components/AIAssistant';
import { PrivacySettings, type DataSavingSetting } from '@/components/PrivacySettings';

interface JournalEntry {
  id: string
  title: string | null
  content: string
  is_public: boolean
  research_consent: boolean
  created_at: string
  updated_at: string
}

const MAX_CHAT_EXCHANGES = 15; // Limit to prevent token overuse

export default function BestPossibleSelfPage() {
  const { user, loading, signOut } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [entriesLoading, setEntriesLoading] = useState(true);
  
  // Current session state
  const [content, setContent] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [dataSavingSetting, setDataSavingSetting] = useState<DataSavingSetting>('private');
  const [researchConsent, setResearchConsent] = useState<boolean>(false);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [chatExchangeCount, setChatExchangeCount] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [clearAIChat, setClearAIChat] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const supabase = createClient();

  const loadEntries = useCallback(async () => {
    if (!user) return;
    
    try {
      setEntriesLoading(true);
      const { data, error } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('document_type', 'tool_session')
        .eq('tool_slug', 'best-possible-self')
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Database error:', error);
        throw error;
      }

      // Transform the data to match the expected JournalEntry format
      const transformedEntries = (data || []).map(doc => ({
        id: doc.id,
        title: doc.document_data?.title || null,
        content: doc.document_data?.content || '',
        is_public: doc.is_public || false,
        research_consent: doc.document_data?.research_consent || false,
        created_at: doc.created_at,
        updated_at: doc.updated_at || doc.created_at
      }));

      setEntries(transformedEntries);
    } catch (err) {
      console.error('Error loading entries:', err);
      // Set empty array on error to avoid crashes
      setEntries([]);
    } finally {
      setEntriesLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (user) {
      loadEntries();
      
      // Check if there's saved state to restore
      const savedState = localStorage.getItem('journalState');
      if (savedState) {
        try {
          const state = JSON.parse(savedState);
          // Only restore if saved within last 30 minutes
          if (Date.now() - state.timestamp < 30 * 60 * 1000) {
            setContent(state.content || '');
            setTimeSpent(state.timeSpent || 0);
            setDataSavingSetting(state.dataSavingSetting || 'private');
            setResearchConsent(state.researchConsent || false);
            setHasUnsavedChanges(!!state.content);
          }
          localStorage.removeItem('journalState');
        } catch (error) {
          console.error('Error restoring journal state:', error);
          localStorage.removeItem('journalState');
        }
      }
    }
  }, [user, loadEntries]);

  const handleEntryClick = (entry: JournalEntry) => {
    if (hasUnsavedChanges) {
      const confirmed = confirm(
        'You have unsaved changes that will be lost.\n\n' +
        'Click OK to continue loading the selected entry, or Cancel to stay and save your work first.'
      );
      if (!confirmed) return;
    }

    setSelectedEntry(entry);
    setContent(entry.content);
    setCurrentEntryId(entry.id);
    setDataSavingSetting('save_private');
    setResearchConsent(entry.research_consent);
    setHasUnsavedChanges(false);
    setChatExchangeCount(0); // Reset chat count when switching entries
  };

  const handleNewEntry = () => {
    const hasContent = content.trim().length > 0;
    
    if (hasContent || hasUnsavedChanges) {
      const confirmed = confirm(
        'Starting a new entry will clear your current work and chat history.\n\n' +
        'Click OK to continue, or Cancel to stay and save your work first.'
      );
      if (!confirmed) return;
    }

    setSelectedEntry(null);
    setContent('');
    setCurrentEntryId(null);
    setDataSavingSetting('private');
    setResearchConsent(false);
    setHasUnsavedChanges(false);
    setChatExchangeCount(0);
    setTimeSpent(0);
    setClearAIChat(true);
    // Reset the clearAIChat flag after a short delay
    setTimeout(() => setClearAIChat(false), 100);
  };

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(true);
    
    // Debounced auto-save - only save after user stops typing for 2 seconds
    if (dataSavingSetting !== 'private' && currentEntryId) {
      clearTimeout(window.autoSaveTimeout);
      window.autoSaveTimeout = setTimeout(() => {
        setSaveStatus('saving');
        saveJournalEntry(newContent);
      }, 2000);
    }
  };

  const handleManualSave = () => {
    if (!user) {
      // Save current state to localStorage before showing auth modal
      const stateToSave = {
        content,
        timeSpent,
        dataSavingSetting,
        researchConsent,
        timestamp: Date.now()
      };
      localStorage.setItem('journalState', JSON.stringify(stateToSave));
      window.location.href = '/auth';
      return;
    }
    
    if (!content.trim()) {
      return; // Nothing to save
    }
    
    if (dataSavingSetting === 'private') {
      // Prompt user to switch to save mode
      const confirmed = confirm(
        'You are currently in "Do not save" mode. 🔒\n\n' +
        'Would you like to switch to "Save mode"?\n\n' +
        'Click OK to switch to save mode, or Cancel to stay in private mode.'
      );
      
      if (confirmed) {
        // Switch to save mode
        setDataSavingSetting('save_private');
        
        // Show confirmation that they can now save
        setTimeout(() => {
          alert(
            'Switched to Save mode! 📝✅\n\n' +
            'You can now save your entry when ready by clicking the Save button again.'
          );
        }, 100);
      }
      return;
    }
    
    // User is already in save mode, proceed with saving
    setSaveStatus('saving');
    saveJournalEntry(content);
    
    // Show update confirmation
    if (currentEntryId) {
      setTimeout(() => {
        alert(
          'Entry updated! 📝\n\n' +
          'The sidebar preview may take a moment to refresh. ' +
          'Refreshing the page will show updated previews but may lose unsaved work.'
        );
      }, 1000);
    }
  };

  const handleDataSavingChange = (newSetting: DataSavingSetting) => {
    if (!user && newSetting !== 'private') {
      // Save current state to localStorage before showing auth modal
      const stateToSave = {
        content,
        timeSpent,
        dataSavingSetting: newSetting,
        researchConsent,
        timestamp: Date.now()
      };
      localStorage.setItem('journalState', JSON.stringify(stateToSave));
      window.location.href = '/auth';
      return;
    }
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

    const isPublic = false;
    const hasResearchConsent = researchConsent;

    try {
      if (currentEntryId) {
        // Update existing entry
        const { error } = await supabase
          .from('user_documents')
          .update({
            document_data: {
              title: 'Best Possible Self - ' + new Date().toLocaleDateString(),
              content: contentToSave,
              research_consent: hasResearchConsent,
              tool_name: 'Best Possible Self',
              session_data: {
                time_spent: timeSpent,
                word_count: contentToSave.split(' ').length
              }
            },
            is_public: isPublic,
            updated_at: new Date().toISOString()
          })
          .eq('id', currentEntryId);

        if (error) throw error;
      } else {
        // Create new entry
        const { data, error } = await supabase
          .from('user_documents')
          .insert({
            user_id: user.id,
            document_type: 'tool_session',
            tool_slug: 'best-possible-self',
            is_public: isPublic,
            document_data: {
              title: 'Best Possible Self - ' + new Date().toLocaleDateString(),
              content: contentToSave,
              research_consent: hasResearchConsent,
              tool_name: 'Best Possible Self',
              session_data: {
                time_spent: timeSpent,
                word_count: contentToSave.split(' ').length
              }
            }
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          const newEntryId = data.id;
          setCurrentEntryId(newEntryId);
          
          // Save any pending chat messages now that we have an entry ID
          if (typeof window !== 'undefined' && window.savePendingChatMessages && user) {
            window.savePendingChatMessages(user.id, newEntryId, researchConsent);
          }
          
          // Refresh entries list to show new entry
          loadEntries();
        }
      }

      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      // Auto-refresh entries to show updated content
      loadEntries();
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving journal entry:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const onChatMessage = () => {
    setChatExchangeCount(prev => prev + 1);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </main>
    );
  }


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Focus Mode - Full screen writing
  if (isFocusMode) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        {/* Focus Mode Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">Focus Mode</div>
          <button
            onClick={() => setIsFocusMode(false)}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Exit Focus
          </button>
        </div>

        {/* Full Screen Textarea */}
        <div className="flex-1 flex justify-center">
          <div className="w-full max-w-4xl px-8 py-12">
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Imagine yourself in the future, having achieved your most important goals and living your best possible life. Write about what you see, feel, and experience. Be as specific and vivid as possible..."
              className="w-full h-full resize-none border-none outline-none text-gray-900 placeholder-gray-400 bg-transparent"
              style={{ 
                fontSize: '20px', 
                lineHeight: '1.8',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
              autoFocus
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Image 
            src="/Jongulogo.png" 
            alt="Jongu" 
            width={80}
            height={80}
            className="h-20 w-auto"
          />
          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-medium">BETA</span>
          <div className="hidden sm:block text-sm text-gray-600">/ Best Possible Self Tool</div>
        </div>
        <div className="flex items-center space-x-3">
          <a
            href="https://wellness.jongu.org"
            className="px-3 py-2 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors font-medium flex items-center gap-1"
          >
            ← Back to Wellness
          </a>
          
          {user ? (
            <button
              onClick={signOut}
              className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium"
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={() => window.location.href = '/auth'}
              className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium"
            >
              Sign In
            </button>
          )}
          
          <a
            href="https://github.com/PlayfulProcess/jongu-tool-best-possible-self"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1 font-medium"
            title="View source code on GitHub"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
          
          <a
            href="https://jongu.org"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1 font-medium"
          >
            🏠 Home
          </a>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Mobile menu overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      
      {/* Sidebar */}
      <div className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        fixed lg:relative lg:translate-x-0
        w-80 bg-white border-r border-gray-200 flex flex-col
        transition-transform duration-300 ease-in-out
        z-50 lg:z-auto
        h-full lg:h-auto
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-lg font-semibold text-gray-900">Best Possible Self</h1>
            <div className="flex items-center gap-2">
              {/* Close button for mobile */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 text-gray-400 hover:text-gray-600"
                aria-label="Close sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="mb-4">
            <a 
              href="https://ggia.berkeley.edu/practice/best_possible_self" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              📚 Based on research from UC Berkeley&apos;s Greater Good Science Center
            </a>
          </div>
          {/* Save Status */}
          <div className="text-xs text-gray-500 mb-3 text-center">
            {saveStatus === 'saving' && '💾 Saving...'}
            {saveStatus === 'saved' && '✅ Saved'}
            {saveStatus === 'error' && '❌ Save Error'}
            {hasUnsavedChanges && saveStatus === 'idle' && user && '⚠️ Unsaved changes'}
            {hasUnsavedChanges && !user && '📝 Writing in session mode'}
          </div>
          {user ? (
            <button
              onClick={handleNewEntry}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              ✍️ New Entry
            </button>
          ) : null}
        </div>

        {/* Entries List */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            {user ? (
              <>
                <div className="flex justify-between items-center mb-3">
                  <h2 className="text-sm font-medium text-gray-700">
                    Your Entries ({entries.length})
                  </h2>
                </div>
                <div className="text-xs text-gray-500 mb-3 p-2 bg-gray-50 rounded">
                  💡 Entry previews update after page refresh
                </div>
                
                {entriesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500">Loading entries...</p>
                  </div>
                ) : entries.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">No saved entries yet</p>
                    <p className="text-xs text-gray-400 mt-1">Start writing and save to see entries here</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {entries.map((entry) => (
                      <div
                        key={entry.id}
                        onClick={() => handleEntryClick(entry)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                          selectedEntry?.id === entry.id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900 truncate mb-1">
                          {entry.title || 'Untitled Entry'}
                        </div>
                        <div className="text-xs text-gray-500 mb-2">
                          {formatDate(entry.created_at)}
                        </div>
                        <div className="text-xs text-gray-600 line-clamp-2">
                          {entry.content.substring(0, 100)}...
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Try the Tool</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Experience the Best Possible Self exercise without signing up. 
                  Your work will be preserved in this session.
                </p>
                <p className="text-xs text-gray-500">
                  Sign in to save your entries permanently and access them across devices.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile menu button - only visible on mobile */}
        <div className="lg:hidden bg-white border-b border-gray-200 p-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
            aria-label="Open sidebar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            {/* Privacy Settings */}
            <div className="mb-6">
              <PrivacySettings
                defaultDataSetting={dataSavingSetting}
                defaultResearchConsent={researchConsent}
                onDataSettingChange={handleDataSavingChange}
                onResearchConsentChange={handleResearchConsentChange}
              />
            </div>

            {/* Instructions - Now bigger and below privacy */}
            <div className="mb-8 p-6 bg-blue-50 border-l-4 border-blue-400 rounded-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4">How This Works</h2>
              <p className="text-base text-gray-700 mb-4 leading-relaxed">
                Imagine yourself in the future, having achieved your most important goals. 
                Write about what you see, feel, and experience in specific life areas. 
                Be as detailed and vivid as possible - this exercise is most effective when you really 
                immerse yourself in the vision of your future self.
              </p>
              <div className="text-sm text-gray-700 mb-4">
                <strong>Key areas to explore:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Career & professional achievements</li>
                  <li>Relationships & social connections</li>
                  <li>Health & physical wellness</li>
                  <li>Personal growth & learning</li>
                  <li>Hobbies & creative pursuits</li>
                  <li>Financial security & freedom</li>
                </ul>
              </div>
              <div className="text-sm text-amber-700 bg-amber-50 p-3 rounded border border-amber-200 lg:hidden">
                💡 <strong>Best experience:</strong> For deeper reflection and longer writing sessions, we recommend using a desktop or laptop computer.
              </div>
            </div>

            {/* Writing Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="mb-4">
                <Timer onTimeUpdate={setTimeSpent} />
              </div>
              
              <textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder="Imagine yourself in the future, having achieved your most important goals and living your best possible life. Write about what you see, feel, and experience. Be as specific and vivid as possible..."
                className="w-full h-64 p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
              />

              <div className="mt-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">
                    Time spent: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
                  </div>
                  <button
                    onClick={() => setIsFocusMode(true)}
                    className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                  >
                    🎯 Focus Mode
                  </button>
                </div>
                <button
                  onClick={handleManualSave}
                  disabled={!content.trim() || saveStatus === 'saving'}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saveStatus === 'saving' ? '💾 Saving...' : 
                   currentEntryId ? '💾 Update' : '💾 Save'}
                </button>
              </div>
            </div>

            {/* AI Assistant */}
            <div className="mt-6">
              {chatExchangeCount >= MAX_CHAT_EXCHANGES ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                  <div className="text-amber-800 font-medium mb-2">
                    Chat Session Limit Reached
                  </div>
                  <div className="text-sm text-amber-700 mb-4">
                    You&apos;ve reached the {MAX_CHAT_EXCHANGES} message limit for this session to manage token usage.
                    Save your work and start a new entry to continue chatting with the AI.
                  </div>
                  <button
                    onClick={handleNewEntry}
                    className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors"
                  >
                    Start New Session
                  </button>
                </div>
              ) : (
                <div>
                  <AIAssistant 
                    key={`chat-${currentEntryId || 'new'}`}
                    content={content} 
                    dataSavingSetting={dataSavingSetting}
                    researchConsent={researchConsent}
                    entryId={currentEntryId}
                    onMessage={onChatMessage}
                    clearChat={clearAIChat}
                  />
                  {chatExchangeCount > MAX_CHAT_EXCHANGES - 5 && (
                    <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                      ⚠️ Chat limit approaching: {chatExchangeCount}/{MAX_CHAT_EXCHANGES} messages used
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Auth now redirects to /auth page */}
    </div>
  );
}