'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
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
import { DualAuth } from '@/components/DualAuth';
import { TemplateSelector } from '@/components/TemplateSelector';
import { TemplateCreator } from '@/components/TemplateCreator';
import { IChingOracle } from '@/components/IChingOracle';
import { TarotOracle } from '@/components/TarotOracle';
import { Database } from '@/types/database.types';
import { HexagramReading } from '@/types/iching.types';
import { TarotReading } from '@/types/tarot.types';

type JournalTemplate = Database['public']['Tables']['journal_templates']['Row'];

// Simplified: no more complex data saving settings

interface JournalEntry {
  id: string
  title: string | null
  content: string
  is_public: boolean
  research_consent: boolean
  created_at: string
  updated_at: string
  template_snapshot?: {
    id: string
    name: string
    description?: string
    ui_prompt: string
    is_system: boolean
    is_private: boolean
  } | null
  template_id?: string | null
  iching_readings?: HexagramReading[] | null  // Array of readings for multiple casts per session
  tarot_readings?: TarotReading[] | null  // Array of Tarot readings
  // Note: chat_messages are stored separately in user_documents with document_type='interaction'
}

const MAX_CHAT_EXCHANGES = 15; // Limit to prevent token overuse
const MAX_CONTENT_LENGTH = 100000; // Maximum characters per journal entry

// Component to render formatted text with paragraphs and hyperlinks
function FormattedText({ text }: { text: string }) {
  const paragraphs = text.split('\n\n').filter(p => p.trim());

  const renderTextWithLinks = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, index) => (
        <p key={index} className="text-base text-gray-700 dark:text-gray-300 leading-relaxed">
          {renderTextWithLinks(paragraph)}
        </p>
      ))}
    </div>
  );
}

export default function BestPossibleSelfPage() {
  const { user, status, signOut } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [entriesLoading, setEntriesLoading] = useState(true);

  // Current session state
  const [content, setContent] = useState('');
  const [timeSpent, setTimeSpent] = useState(0);
  const [researchConsent, setResearchConsent] = useState<boolean>(false);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [chatExchangeCount, setChatExchangeCount] = useState(0);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [clearAIChat, setClearAIChat] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);

  // Oracle state - arrays to support multiple readings per session
  const [ichingReadings, setIchingReadings] = useState<HexagramReading[]>([]);
  const [tarotReadings, setTarotReadings] = useState<TarotReading[]>([]);

  // Template state
  const [selectedTemplate, setSelectedTemplate] = useState<JournalTemplate | null>(null);
  const [showTemplateCreator, setShowTemplateCreator] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilterTemplate, setSelectedFilterTemplate] = useState<string>('all');
  
  const supabase = createClient();

  // Ref to track if this is the initial load (to prevent auto-save on mount)
  const isInitialLoad = useRef(true);
  const previousReadingsLength = useRef(0);
  const previousTarotReadingsLength = useRef(0);
  const previousMessagesLength = useRef(0);
  const contentRef = useRef(content); // Track content without causing re-renders

  // Keep contentRef in sync
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Auto-save when oracle readings or chat messages change (after initial load)
  useEffect(() => {
    // Skip initial load and when not logged in
    if (isInitialLoad.current || !user) {
      // After first render, start tracking
      if (isInitialLoad.current) {
        previousReadingsLength.current = ichingReadings.length;
        previousTarotReadingsLength.current = tarotReadings.length;
        previousMessagesLength.current = chatMessages.length;
        isInitialLoad.current = false;
      }
      return;
    }

    // Check if readings were added (not just loaded)
    const ichingAdded = ichingReadings.length > previousReadingsLength.current;
    const tarotAdded = tarotReadings.length > previousTarotReadingsLength.current;
    const messagesAdded = chatMessages.length > previousMessagesLength.current;

    // Update previous lengths
    previousReadingsLength.current = ichingReadings.length;
    previousTarotReadingsLength.current = tarotReadings.length;
    previousMessagesLength.current = chatMessages.length;

    // Trigger auto-save if something was added
    if (ichingAdded || tarotAdded || messagesAdded) {
      // Short delay to ensure state is fully updated
      const saveTimeout = setTimeout(() => {
        const currentContent = contentRef.current;
        if (currentContent.trim() || ichingReadings.length > 0 || tarotReadings.length > 0) {
          setSaveStatus('saving');
          saveJournalEntry(currentContent);
        }
      }, 500);

      return () => clearTimeout(saveTimeout);
    }
  }, [ichingReadings.length, tarotReadings.length, chatMessages.length, user]); // Removed content dependency

  // Reset initial load flag when switching entries
  useEffect(() => {
    isInitialLoad.current = true;
    previousReadingsLength.current = ichingReadings.length;
    previousTarotReadingsLength.current = tarotReadings.length;
    previousMessagesLength.current = chatMessages.length;
  }, [currentEntryId]);

  // Simple filtering logic
  const filteredEntries = entries.filter(entry => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesContent = entry.content.toLowerCase().includes(searchLower);
      const matchesTemplate = entry.template_snapshot?.name?.toLowerCase().includes(searchLower) || false;
      if (!matchesContent && !matchesTemplate) return false;
    }

    // Template filter
    if (selectedFilterTemplate !== 'all') {
      const entryTemplateId = entry.template_snapshot?.id || entry.template_id;
      if (entryTemplateId !== selectedFilterTemplate) return false;
    }

    return true;
  });

  // Get unique templates from entries for filter dropdown
  const templateOptions = entries.reduce((acc, entry) => {
    if (entry.template_snapshot) {
      const templateId = entry.template_snapshot.id;
      const templateName = entry.template_snapshot.name;
      if (!acc.find(t => t.id === templateId)) {
        acc.push({ id: templateId, name: templateName });
      }
    }
    return acc;
  }, [] as { id: string; name: string }[]);


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
      const transformedEntries = (data || []).map((doc) => ({
        id: doc.id,
        title: doc.document_data?.title || null,
        content: doc.document_data?.content || '',
        is_public: doc.is_public || false,
        research_consent: doc.document_data?.research_consent || false,
        created_at: doc.created_at,
        updated_at: doc.updated_at || doc.created_at,
        // Add template info for display
        template_snapshot: doc.document_data?.template_snapshot || null,
        template_id: doc.document_data?.template_id || null,
        // Load I Ching readings - handle migration from old single reading to new array format
        iching_readings: doc.document_data?.iching_readings ||
          (doc.document_data?.iching_reading ? [doc.document_data.iching_reading] : null),
        // Load Tarot readings
        tarot_readings: doc.document_data?.tarot_readings || null
        // Note: chat_messages are loaded separately by AIAssistant from interaction records
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
            setResearchConsent(state.researchConsent || false);
            setChatMessages(state.chatMessages || []);
            setHasUnsavedChanges(!!state.content);
            // Don't remove localStorage immediately - keep it until user saves or session ends
          } else {
            // Only remove if expired
            localStorage.removeItem('journalState');
          }
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
    setResearchConsent(entry.research_consent);
    setHasUnsavedChanges(false);

    // Load oracle readings if present
    setIchingReadings(entry.iching_readings || []);
    setTarotReadings(entry.tarot_readings || []);

    // Note: Chat messages are loaded by AIAssistant from interaction records
    // Reset exchange count - AIAssistant will update when it loads messages
    setChatExchangeCount(0);
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
    setResearchConsent(false);
    setHasUnsavedChanges(false);
    setChatExchangeCount(0);
    setTimeSpent(0);
    setChatMessages([]);
    setIchingReadings([]); // Clear oracle readings
    setTarotReadings([]);
    setClearAIChat(true);
    // Reset the clearAIChat flag after a short delay
    setTimeout(() => setClearAIChat(false), 100);
  };

  const handleContentChange = (newContent: string) => {
    // Enforce character limit
    if (newContent.length > MAX_CONTENT_LENGTH) {
      return; // Don't update if over limit
    }

    setContent(newContent);
    setHasUnsavedChanges(true);

    // Debounced auto-save - only save after user stops typing for 2 seconds
    if (currentEntryId) {
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
        researchConsent,
        chatMessages,
        timestamp: Date.now()
      };
      localStorage.setItem('journalState', JSON.stringify(stateToSave));
      setShowAuthModal(true);
      return;
    }
    
    if (!content.trim() && ichingReadings.length === 0 && tarotReadings.length === 0) {
      return; // Nothing to save
    }

    // Proceed with saving
    setSaveStatus('saving');
    saveJournalEntry(content);
  };


  const saveJournalEntry = async (contentToSave: string) => {
    if (!user || (!contentToSave.trim() && ichingReadings.length === 0 && tarotReadings.length === 0)) {
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
              title: (selectedTemplate?.name || 'Best Possible Self') + ' - ' + new Date().toLocaleDateString(),
              content: contentToSave,
              research_consent: hasResearchConsent,
              tool_name: selectedTemplate?.name || 'Best Possible Self',
              template_id: selectedTemplate?.uuid,
              template_snapshot: selectedTemplate ? {
                id: selectedTemplate.uuid,
                name: selectedTemplate.name,
                description: selectedTemplate.description,
                ui_prompt: selectedTemplate.ui_prompt,
                is_system: selectedTemplate.is_system,
                is_private: selectedTemplate.is_private
              } : null,
              session_data: {
                time_spent: timeSpent,
                word_count: contentToSave.split(' ').length
              },
              // Save oracle readings arrays
              iching_readings: ichingReadings.length > 0 ? ichingReadings : null,
              tarot_readings: tarotReadings.length > 0 ? tarotReadings : null
              // Note: chat messages are saved separately by AIAssistant to interaction records
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
              title: (selectedTemplate?.name || 'Best Possible Self') + ' - ' + new Date().toLocaleDateString(),
              content: contentToSave,
              research_consent: hasResearchConsent,
              tool_name: selectedTemplate?.name || 'Best Possible Self',
              template_id: selectedTemplate?.uuid,
              template_snapshot: selectedTemplate ? {
                id: selectedTemplate.uuid,
                name: selectedTemplate.name,
                description: selectedTemplate.description,
                ui_prompt: selectedTemplate.ui_prompt,
                is_system: selectedTemplate.is_system,
                is_private: selectedTemplate.is_private
              } : null,
              session_data: {
                time_spent: timeSpent,
                word_count: contentToSave.split(' ').length
              },
              // Save oracle readings arrays
              iching_readings: ichingReadings.length > 0 ? ichingReadings : null,
              tarot_readings: tarotReadings.length > 0 ? tarotReadings : null
              // Note: chat messages are saved separately by AIAssistant to interaction records
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
      // Clear localStorage since content was successfully saved
      localStorage.removeItem('journalState');
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

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
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
      <div className="min-h-screen bg-white dark:bg-gray-800 flex flex-col">
        {/* Focus Mode Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">Focus Mode</div>
            <div className={`text-sm ${
              content.length >= MAX_CONTENT_LENGTH
                ? 'text-red-600 dark:text-red-400 font-semibold'
                : content.length >= MAX_CONTENT_LENGTH * 0.9
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-gray-500 dark:text-gray-400'
            }`}>
              {content.length.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()}
            </div>
          </div>
          <button
            onClick={() => setIsFocusMode(false)}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
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
              placeholder={selectedTemplate?.description || "Write about your thoughts and reflections..."}
              className="w-full h-full resize-none border-none outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 bg-transparent"
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <a href="https://www.recursive.eco" className="flex items-center">
              <Image 
                src="/recursive-logo-1756153260128.png" 
                alt="Recursive.eco" 
                width={60}
                height={60}
                className="h-12 w-auto"
                style={{ transform: 'rotate(200deg)' }}
              />
            </a>
          </div>
          <nav className="flex items-center space-x-6">
            <a
              href="https://channels.recursive.eco/"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center gap-1"
            >
              ← Back to Channels
            </a>
            
            {user ? (
              <>
                <a
                  href="/account"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Account Settings
                </a>
                <button
                  onClick={signOut}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              >
                Sign In
              </button>
            )}
            
            <a
              href="https://github.com/PlayfulProcess/jongu-tool-best-possible-self"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors flex items-center gap-1"
              title="View source code on GitHub"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              GitHub
            </a>
          </nav>
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
        w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col
        transition-transform duration-300 ease-in-out
        z-50 lg:z-auto
        h-full lg:h-auto
      `}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              {/* Close button for mobile */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Close sidebar"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          {/* Save Status */}
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 text-center">
            {saveStatus === 'saving' && '💾 Saving...'}
            {saveStatus === 'saved' && '✅ Saved'}
            {saveStatus === 'error' && '❌ Save Error'}
            {hasUnsavedChanges && saveStatus === 'idle' && user && '⚠️ Unsaved changes'}
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
                  <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Your Entries ({filteredEntries.length})
                  </h2>
                </div>

                {/* Simple Filter UI */}
                <div className="space-y-2 mb-4">
                  <input
                    type="text"
                    placeholder="Search entries... (real-time)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault(); // Prevent form submission, search is already working
                      }
                    }}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  />

                  <select
                    value={selectedFilterTemplate}
                    onChange={(e) => setSelectedFilterTemplate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="all">All Templates</option>
                    {templateOptions.map(template => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 p-2 bg-gray-50 dark:bg-gray-900/20 rounded">
                  Showing {filteredEntries.length} of {entries.length} entries
                </div>
                
                {entriesLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading entries...</p>
                  </div>
                ) : entries.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No saved entries yet</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Start writing and save to see entries here</p>
                  </div>
                ) : filteredEntries.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 dark:text-gray-400">No entries match your filters</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try changing your search or template filter</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredEntries.map((entry) => (
                      <div
                        key={entry.id}
                        onClick={() => handleEntryClick(entry)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors border ${
                          selectedEntry?.id === entry.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate mb-1">
                          {entry.title || 'Untitled Entry'}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {formatDate(entry.created_at)}
                        </div>
                        {entry.template_snapshot && (
                          <div className="text-xs text-blue-600 dark:text-blue-400 mb-2 font-medium">
                            📝 {entry.template_snapshot.name}
                          </div>
                        )}
                        <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
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
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Try the Tool</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Experience this tool without signing up.
                  Your work will be preserved in this session.
                </p>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700 text-center">
                  📝 Sign in to save your entries permanently, access them across devices, and use the AI assistant!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile menu button - only visible on mobile */}
        <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
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
            {/* Template Selector */}
            <div className="mb-6">
              <TemplateSelector
                selectedTemplateId={selectedTemplate?.uuid}
                onTemplateSelect={(template) => {
                  setSelectedTemplate(template);
                }}
                onCreateNew={() => setShowTemplateCreator(true)}
              />
            </div>

            {/* Saved Entry Template Info */}
            {selectedEntry && selectedEntry.template_snapshot && (
              <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">
                      📝 Viewing saved entry
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      <strong>Template used:</strong> {selectedEntry.template_snapshot.name}
                    </p>
                    {selectedEntry.template_snapshot.description && (
                      <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                        {selectedEntry.template_snapshot.description}
                      </p>
                    )}
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                      <strong>Original prompt:</strong> {selectedEntry.template_snapshot.ui_prompt.substring(0, 150)}...
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedEntry(null);
                      setContent('');
                      setCurrentEntryId(null);
                    }}
                    className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200"
                    title="Start new entry"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 rounded-lg">
              <div className="mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
                  {selectedTemplate?.name || 'How This Works'}
                </h2>
              </div>
              <div className="mb-4">
                <FormattedText
                  text={selectedTemplate?.ui_prompt || selectedTemplate?.description ||
                    "Imagine yourself in the future, having achieved your most important goals. Write about what you see, feel, and experience in specific life areas. Be as detailed and vivid as possible - this exercise is most effective when you really immerse yourself in the vision of your future self."}
                />
              </div>

              <div className="text-sm text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 p-3 rounded border border-amber-200 dark:border-amber-700 lg:hidden">
                💡 <strong>Best experience:</strong> For deeper reflection and longer writing sessions, we recommend using a desktop or laptop computer.
              </div>
            </div>

            {/* Writing Section */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="mb-4">
                <Timer onTimeUpdate={setTimeSpent} />
              </div>
              
              <textarea
                value={content}
                onChange={(e) => handleContentChange(e.target.value)}
                placeholder={selectedTemplate?.description || "Write about your thoughts and reflections..."}
                className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800"
              />

              {/* Character Counter */}
              <div className="mt-2 text-sm text-right">
                <span className={`${
                  content.length >= MAX_CONTENT_LENGTH
                    ? 'text-red-600 dark:text-red-400 font-semibold'
                    : content.length >= MAX_CONTENT_LENGTH * 0.9
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {content.length.toLocaleString()} / {MAX_CONTENT_LENGTH.toLocaleString()} characters
                </span>
                {content.length >= MAX_CONTENT_LENGTH && (
                  <span className="ml-2 text-red-600 dark:text-red-400">
                    (Limit reached)
                  </span>
                )}
              </div>

              <div className="mt-4 flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Time spent: {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, '0')}
                  </div>
                  <button
                    onClick={() => setIsFocusMode(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    🎯 Focus Mode
                  </button>
                </div>
                <button
                  onClick={handleManualSave}
                  disabled={(!content.trim() && ichingReadings.length === 0 && tarotReadings.length === 0) || saveStatus === 'saving'}
                  className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saveStatus === 'saving' ? '💾 Saving...' :
                   currentEntryId ? '💾 Update' : '💾 Save'}
                </button>
              </div>
            </div>

            {/* Oracle Tools */}
            <div className="mt-6 space-y-4">
              <IChingOracle
                readings={ichingReadings}
                onReadingComplete={(reading) => setIchingReadings(prev => [...prev, reading])}
                onReadingClear={() => setIchingReadings([])}
              />
              <TarotOracle
                readings={tarotReadings}
                onReadingComplete={(reading) => setTarotReadings(prev => [...prev, reading])}
                onReadingClear={() => setTarotReadings([])}
              />
            </div>

            {/* AI Assistant */}
            <div className="mt-6">
              {chatExchangeCount >= MAX_CHAT_EXCHANGES ? (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4 text-center">
                  <div className="text-amber-800 dark:text-amber-200 font-medium mb-2">
                    Chat Session Limit Reached
                  </div>
                  <div className="text-sm text-amber-700 dark:text-amber-300 mb-4">
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
                    researchConsent={researchConsent}
                    entryId={currentEntryId}
                    onMessage={onChatMessage}
                    clearChat={clearAIChat}
                    initialMessages={chatMessages}
                    onMessagesChange={setChatMessages}
                    ichingReadings={ichingReadings}
                    tarotReadings={tarotReadings}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Auth Modal */}
      <DualAuth
        isOpen={showAuthModal}
        onClose={() => {
          setShowAuthModal(false);
          // Don't clear localStorage - let user continue with unsaved content
        }}
      />

      {/* Template Creator Modal */}
      <TemplateCreator
        isOpen={showTemplateCreator}
        onClose={() => setShowTemplateCreator(false)}
        onTemplateCreated={() => {
          // Refresh template selector by triggering re-fetch
          window.location.reload();
        }}
      />
    </div>
  );
}
