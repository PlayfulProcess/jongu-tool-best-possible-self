'use client'

import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    autoSaveTimeout: NodeJS.Timeout;
    savePendingChatMessages?: (userId: string, entryId: string, researchConsent: boolean) => Promise<void>;
  }
}

import { useAuth } from '@/components/AuthProvider';
import { createClient } from '@/lib/supabase-client';
import { AIAssistant } from '@/components/AIAssistant';
import { DualAuth } from '@/components/DualAuth';
import { QuestionInput, HexagramDisplay, ReadingInterpretation, CoinCastingAnimation } from '@/components/iching';
import { castHexagram, reconstructReading } from '@/lib/iching';
import { HexagramReading, IChingDocumentData } from '@/types/iching.types';
import { buildIChingSystemPrompt, buildInitialGreeting, buildPreCastPrompt } from '@/lib/iching-ai-prompt';

interface IChingEntry {
  id: string;
  question: string;
  primaryHexagram: number;
  transformedHexagram: number | null;
  changingLines: number[];
  journalContent: string;
  created_at: string;
  updated_at: string;
}

const MAX_CONTENT_LENGTH = 100000;

export default function IChingReaderPage() {
  const { user, status, signOut } = useAuth();
  const [entries, setEntries] = useState<IChingEntry[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<IChingEntry | null>(null);
  const [entriesLoading, setEntriesLoading] = useState(true);

  // App state - simplified: just tracking if we're casting
  const [isCasting, setIsCasting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [currentReading, setCurrentReading] = useState<HexagramReading | null>(null);
  const [journalContent, setJournalContent] = useState('');
  const [researchConsent, setResearchConsent] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([]);
  const [clearAIChat, setClearAIChat] = useState(false);
  const [aiSystemPrompt, setAiSystemPrompt] = useState<string>('');

  const supabase = createClient();

  // Load user's past readings
  const loadEntries = useCallback(async () => {
    if (!user) return;

    try {
      setEntriesLoading(true);
      const { data, error } = await supabase
        .from('user_documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('document_type', 'iching_reading')
        .eq('tool_slug', 'iching-reader')
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const transformedEntries: IChingEntry[] = (data || []).map((doc) => ({
        id: doc.id,
        question: doc.document_data?.question || '',
        primaryHexagram: doc.document_data?.reading?.primaryHexagram || 1,
        transformedHexagram: doc.document_data?.reading?.transformedHexagram || null,
        changingLines: doc.document_data?.reading?.changingLines || [],
        journalContent: doc.document_data?.journalContent || '',
        created_at: doc.created_at,
        updated_at: doc.updated_at || doc.created_at,
      }));

      setEntries(transformedEntries);
    } catch (err) {
      console.error('Error loading entries:', err);
      setEntries([]);
    } finally {
      setEntriesLoading(false);
    }
  }, [user, supabase]);

  useEffect(() => {
    if (user) {
      loadEntries();
    }
  }, [user, loadEntries]);

  // Update AI system prompt when reading or question changes
  useEffect(() => {
    if (currentReading) {
      const prompt = buildIChingSystemPrompt(currentReading, journalContent);
      setAiSystemPrompt(prompt);
    } else {
      // Pre-cast: AI can help refine the question
      const prompt = buildPreCastPrompt(currentQuestion, journalContent);
      setAiSystemPrompt(prompt);
    }
  }, [currentReading, journalContent, currentQuestion]);

  // Cast a new hexagram
  const handleCastHexagram = async (question: string) => {
    setCurrentQuestion(question);
    setIsCasting(true);

    try {
      const reading = await castHexagram(question);
      setCurrentReading(reading);

      // Add initial AI greeting
      const greeting = buildInitialGreeting(reading);
      setChatMessages(prev => [...prev, { role: 'assistant', content: greeting }]);

      // Animation will call onComplete when done
    } catch (error) {
      console.error('Error casting hexagram:', error);
      setIsCasting(false);
    }
  };

  // Called when coin animation completes
  const handleCastingComplete = () => {
    setIsCasting(false);
  };

  // Load a past reading
  const handleEntryClick = async (entry: IChingEntry) => {
    if (hasUnsavedChanges) {
      const confirmed = confirm('You have unsaved changes. Continue anyway?');
      if (!confirmed) return;
    }

    try {
      // Get full document data
      const { data, error } = await supabase
        .from('user_documents')
        .select('*')
        .eq('id', entry.id)
        .single();

      if (error) throw error;

      const docData = data.document_data as IChingDocumentData;

      // Reconstruct the reading
      const reading = await reconstructReading(
        docData.question,
        docData.reading.lines,
        docData.reading.primaryHexagram,
        docData.reading.transformedHexagram,
        docData.reading.changingLines,
        new Date(docData.reading.castTimestamp)
      );

      setSelectedEntry(entry);
      setCurrentReading(reading);
      setCurrentQuestion(docData.question);
      setJournalContent(docData.journalContent || '');
      setCurrentEntryId(entry.id);
      setResearchConsent(docData.research_consent);
      setHasUnsavedChanges(false);
      setIsCasting(false);
      setChatMessages([]);

      // Add greeting for loaded reading
      const greeting = buildInitialGreeting(reading);
      setChatMessages([{ role: 'assistant', content: greeting }]);
    } catch (error) {
      console.error('Error loading entry:', error);
    }
  };

  // Start a new reading
  const handleNewReading = () => {
    if (hasUnsavedChanges) {
      const confirmed = confirm('Start a new reading? Unsaved changes will be lost.');
      if (!confirmed) return;
    }

    setSelectedEntry(null);
    setCurrentReading(null);
    setCurrentQuestion('');
    setJournalContent('');
    setCurrentEntryId(null);
    setResearchConsent(false);
    setHasUnsavedChanges(false);
    setIsCasting(false);
    setChatMessages([]);
    setClearAIChat(true);
    setTimeout(() => setClearAIChat(false), 100);
  };

  // Save reading
  const handleSave = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (!currentReading) return;

    setSaveStatus('saving');

    try {
      const documentData: IChingDocumentData = {
        title: `I Ching Reading - ${new Date().toLocaleDateString()}`,
        question: currentReading.question,
        reading: {
          lines: currentReading.lines.map(l => ({
            position: l.position,
            value: l.toss.sum,
            type: l.type,
            isChanging: l.isChanging,
          })),
          primaryHexagram: currentReading.primaryHexagram.number,
          transformedHexagram: currentReading.transformedHexagram?.number || null,
          changingLines: currentReading.changingLines,
          castTimestamp: currentReading.timestamp.toISOString(),
        },
        journalContent,
        tool_name: 'I Ching Reader',
        research_consent: researchConsent,
      };

      if (currentEntryId) {
        // Update existing
        const { error } = await supabase
          .from('user_documents')
          .update({
            document_data: documentData,
            is_public: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentEntryId);

        if (error) throw error;
      } else {
        // Create new
        const { data, error } = await supabase
          .from('user_documents')
          .insert({
            user_id: user.id,
            document_type: 'iching_reading',
            tool_slug: 'iching-reader',
            is_public: false,
            document_data: documentData,
          })
          .select()
          .single();

        if (error) throw error;
        if (data) {
          setCurrentEntryId(data.id);
          if (window.savePendingChatMessages) {
            window.savePendingChatMessages(user.id, data.id, researchConsent);
          }
        }
      }

      setSaveStatus('saved');
      setHasUnsavedChanges(false);
      loadEntries();
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Error saving:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleJournalChange = (value: string) => {
    if (value.length > MAX_CONTENT_LENGTH) return;
    setJournalContent(value);
    setHasUnsavedChanges(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <span className="text-3xl">☰</span>
            <h1 className="text-xl font-serif text-gray-900 dark:text-white">
              I Ching Reader
              <span className="text-amber-600 dark:text-amber-400 ml-2">易經</span>
            </h1>
          </div>
          <nav className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {user.email}
                </span>
                <button
                  onClick={() => signOut()}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                Sign In
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Sidebar - Past Readings */}
        {user && (
          <aside className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0 fixed md:relative z-20
            w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
            h-[calc(100vh-60px)] overflow-y-auto transition-transform
          `}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={handleNewReading}
                className="w-full py-2 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <span>☰</span> New Reading
              </button>
            </div>

            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">
                Past Readings
              </h3>

              {entriesLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600 mx-auto"></div>
                </div>
              ) : entries.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                  No readings yet. Ask your first question!
                </p>
              ) : (
                <div className="space-y-2">
                  {entries.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => handleEntryClick(entry)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedEntry?.id === entry.id
                          ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700'
                          : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                      } border border-transparent`}
                    >
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        #{entry.primaryHexagram}
                        {entry.transformedHexagram && ` → #${entry.transformedHexagram}`}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                        {entry.question}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {formatDate(entry.created_at)}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </aside>
        )}

        {/* Mobile sidebar toggle */}
        {user && (
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="md:hidden fixed bottom-4 left-4 z-30 p-3 bg-amber-600 text-white rounded-full shadow-lg"
          >
            {sidebarOpen ? '✕' : '☰'}
          </button>
        )}

        {/* Main Area - Always shows full flow */}
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Left: Reading Flow */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Section 1: Question Input */}
              <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="font-serif text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="text-2xl">1</span>
                    <span>Ask Your Question</span>
                  </h2>
                </div>
                <div className="p-4">
                  {currentReading ? (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Your Question</p>
                        <p className="text-gray-900 dark:text-white font-medium">
                          &ldquo;{currentReading.question}&rdquo;
                        </p>
                      </div>
                      <button
                        onClick={handleNewReading}
                        className="text-sm text-amber-600 hover:text-amber-700 whitespace-nowrap"
                      >
                        New Reading
                      </button>
                    </div>
                  ) : (
                    <QuestionInput onCast={handleCastHexagram} disabled={isCasting} />
                  )}
                </div>
              </section>

              {/* Section 2: Hexagram Display */}
              <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="font-serif text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="text-2xl">2</span>
                    <span>Your Hexagram</span>
                  </h2>
                </div>
                <div className="p-6">
                  {isCasting && currentReading ? (
                    <CoinCastingAnimation
                      lines={currentReading.lines}
                      onComplete={handleCastingComplete}
                      isAnimating={true}
                    />
                  ) : currentReading ? (
                    <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-8">
                      <HexagramDisplay
                        lines={currentReading.lines}
                        hexagram={currentReading.primaryHexagram}
                        label="Primary Hexagram"
                      />

                      {currentReading.transformedHexagram && (
                        <>
                          <div className="flex items-center text-3xl text-amber-500">→</div>
                          <HexagramDisplay
                            lines={currentReading.lines.map(l => ({
                              ...l,
                              type: l.isChanging ? (l.type === 'yin' ? 'yang' : 'yin') : l.type,
                              isChanging: false,
                              symbol: l.isChanging ? (l.type === 'yin' ? '———' : '— —') : l.symbol,
                            }))}
                            hexagram={currentReading.transformedHexagram}
                            showChanging={false}
                            label="Transformed Hexagram"
                          />
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-6xl mb-4 opacity-30">☰</div>
                      <p className="text-gray-500 dark:text-gray-400">
                        Your hexagram will appear here after you cast
                      </p>
                      <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                        Take time to reflect on your question first
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Section 3: Interpretation (only shown after casting) */}
              {currentReading && !isCasting && (
                <section>
                  <ReadingInterpretation reading={currentReading} />
                </section>
              )}

              {/* Section 4: Journal - Always visible */}
              <section className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="font-serif text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="text-2xl">{currentReading ? '4' : '3'}</span>
                    <span>Your Reflection</span>
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {currentReading
                      ? 'Write about how this reading relates to your question...'
                      : 'Reflect on your situation before casting, or take notes...'}
                  </p>
                </div>
                <div className="p-4">
                  <textarea
                    value={journalContent}
                    onChange={(e) => handleJournalChange(e.target.value)}
                    placeholder={
                      currentReading
                        ? 'What thoughts or insights does this reading bring to mind?'
                        : 'What is on your mind? What brought you here today?'
                    }
                    className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg
                               bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                               placeholder-gray-400 dark:placeholder-gray-500
                               focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                  />
                  {currentReading && (
                    <div className="flex items-center justify-between mt-3">
                      <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <input
                          type="checkbox"
                          checked={researchConsent}
                          onChange={(e) => setResearchConsent(e.target.checked)}
                          className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                        />
                        Allow anonymous research use
                      </label>
                      <button
                        onClick={handleSave}
                        disabled={saveStatus === 'saving'}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400
                                   text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        {saveStatus === 'saving' && (
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                        )}
                        {saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error' : 'Save Reading'}
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>

          {/* Right: AI Assistant - Always visible */}
          <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 flex flex-col min-h-[400px] lg:min-h-0">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="font-medium text-gray-900 dark:text-white">
                {currentReading ? 'Oracle Assistant' : 'Preparation Guide'}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {currentReading
                  ? 'Ask about your reading'
                  : 'Chat to refine your question'}
              </p>
            </div>
            <div className="flex-1 min-h-0">
              <AIAssistant
                content={journalContent}
                entryId={currentEntryId}
                researchConsent={researchConsent}
                clearChat={clearAIChat}
                onMessage={() => {}}
                initialMessages={chatMessages}
                customSystemPrompt={aiSystemPrompt}
                toolSlug="iching-reader"
              />
            </div>
          </div>
        </main>
      </div>

      {/* Auth Modal */}
      {showAuthModal && (
        <DualAuth isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      )}
    </div>
  );
}
