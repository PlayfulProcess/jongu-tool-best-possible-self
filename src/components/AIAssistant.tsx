'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { createClient } from '@/lib/supabase-client';
import ReactMarkdown from 'react-markdown';

interface AIAssistantProps {
  content: string;
  researchConsent?: boolean;
  entryId?: string | null;
  onMessage?: () => void;
  clearChat?: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// Extend window interface for global functions
declare global {
  interface Window {
    debugChat?: (userId?: string, entryId?: string) => Promise<void>;
    savePendingChatMessages?: (userId: string, entryId: string, researchConsent: boolean) => Promise<void>;
  }
}

// Global functions for debugging and managing chat messages
if (typeof window !== 'undefined') {
  // Debug function - can be called from browser console as window.debugChat()
  window.debugChat = async (userId?: string, entryId?: string) => {
    const { createClient } = await import('@/lib/supabase-client');
    const supabase = createClient();
    
    console.log('🔍 Chat Debug - UserId:', userId, 'EntryId:', entryId);
    
    // Get all chat messages for user
    const { data: allChats, error: allError } = await supabase
      .from('user_documents')
      .select('*')
      .eq('document_type', 'interaction')
      .eq('tool_slug', 'best-possible-self')
      .eq('document_data->>interaction_type', 'chat_message')
      .order('created_at', { ascending: true });
    
    console.log('📊 All chat messages:', allChats?.length, 'Error:', allError);
    if (allChats) {
      const byTargetId = allChats.reduce((acc: Record<string, number>, msg: { document_data?: { target_id?: string } }) => {
        const targetId = msg.document_data?.target_id || 'unknown';
        acc[targetId] = (acc[targetId] || 0) + 1;
        return acc;
      }, {});
      console.log('📊 Messages by target_id:', byTargetId);
    }
    
    // Get all tool sessions for comparison
    const { data: sessions, error: sessionsError } = await supabase
      .from('user_documents')
      .select('*')
      .eq('document_type', 'tool_session')
      .eq('tool_slug', 'best-possible-self')
      .order('created_at', { ascending: true });
    
    console.log('📝 All tool sessions:', sessions?.length, 'Error:', sessionsError);
    if (sessions) {
      console.log('📝 Session IDs:', sessions.map((s: { id: string }) => s.id));
    }
  };
  
  // Function to save pending chat messages when entry gets an ID
  window.savePendingChatMessages = async (userId: string, newEntryId: string, researchConsent: boolean) => {
    const { createClient } = await import('@/lib/supabase-client');
    const supabase = createClient();
    
    // Get messages from sessionStorage
    const sessionKey = `chat_messages_new_${userId}`;
    const savedMessages = sessionStorage.getItem(sessionKey);
    
    if (!savedMessages) {
      console.log('💾 No pending messages to save');
      return;
    }
    
    let messages;
    try {
      messages = JSON.parse(savedMessages);
    } catch {
      console.log('💾 Invalid messages format in sessionStorage');
      return;
    }
    
    if (!messages || messages.length === 0) {
      console.log('💾 No messages to save');
      return;
    }
    
    console.log('💾 Saving', messages.length, 'pending chat messages for entryId:', newEntryId);
    
    try {
      // Save all messages to database with the new entryId
      const messagesToSave = messages.map((msg: { content: string; role: string }) => ({
        user_id: userId,
        document_type: 'interaction' as const,
        tool_slug: 'best-possible-self',
        is_public: false,
        document_data: {
          target_type: 'tool_session',
          target_id: newEntryId,
          interaction_type: 'chat_message',
          message: msg.content,
          role: msg.role,
          research_consent: researchConsent
        }
      }));
      
      const { error } = await supabase.from('user_documents').insert(messagesToSave);
      
      if (error) {
        console.error('💾 Error saving pending chat messages:', error);
      } else {
        console.log('💾 Successfully saved', messagesToSave.length, 'pending chat messages');
        // Clear the sessionStorage since messages are now in database
        sessionStorage.removeItem(sessionKey);
      }
    } catch (error) {
      console.error('💾 Error saving pending messages:', error);
    }
  };
}

export function AIAssistant({ content, dataSavingSetting = 'private', researchConsent = false, entryId, onMessage, clearChat = false }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(() => {
    // Initialize isOpen state from sessionStorage
    if (typeof window !== 'undefined') {
      const savedIsOpen = sessionStorage.getItem('ai_chat_isOpen');
      return savedIsOpen === 'true';
    }
    return false;
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messagesLoaded, setMessagesLoaded] = useState(false);
  
  const { user } = useAuth();
  const supabase = createClient();

  // Persist isOpen state to sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ai_chat_isOpen', isOpen.toString());
    }
  }, [isOpen]);

  // Clear chat when clearChat prop is true
  useEffect(() => {
    if (clearChat) {
      setMessages([]);
      setIsOpen(false); // Also close the chat when clearing
      // Clear sessionStorage for new entries
      if (user) {
        const sessionKey = `chat_messages_new_${user.id}`;
        sessionStorage.removeItem(sessionKey);
      }
      // Clear the isOpen state from sessionStorage too
      sessionStorage.removeItem('ai_chat_isOpen');
    }
  }, [clearChat, user]);

  // Load existing chat messages when component mounts or entryId changes
  useEffect(() => {
    const loadMessages = async () => {
      console.log('Loading messages for entryId:', entryId, 'user:', user?.id);
      
      
      // Always start fresh - clear messages when loading
      setMessages([]);
      setMessagesLoaded(false);

      if (!user || !entryId) {
        // For new entries or anonymous users, try to load from sessionStorage first
        const sessionKey = `chat_messages_new_${user?.id || 'anonymous'}`;
        const savedMessages = sessionStorage.getItem(sessionKey);
        if (savedMessages) {
          try {
            const parsedMessages = JSON.parse(savedMessages);
            console.log('Loaded from sessionStorage:', parsedMessages.length, 'messages');
            setMessages(parsedMessages);
          } catch {
            setMessages([]);
          }
        } else {
          setMessages([]);
        }
        setMessagesLoaded(true);
        return;
      }

      try {
        // First try to load from database
        console.log('🔍 Querying database for entryId:', entryId, 'user:', user.id);
        
        // First, let's see what's in the database for this user
        const { data: allUserMessages } = await supabase
          .from('user_documents')
          .select('document_data, created_at')
          .eq('user_id', user.id)
          .eq('document_type', 'interaction')
          .eq('tool_slug', 'best-possible-self')
          .eq('document_data->>interaction_type', 'chat_message')
          .order('created_at', { ascending: true });
          
        console.log('📋 All chat messages for user:', allUserMessages?.length || 0);
        if (allUserMessages && allUserMessages.length > 0) {
          const targetIds = allUserMessages.map(msg => msg.document_data?.target_id).filter((v, i, a) => a.indexOf(v) === i);
          console.log('🎯 Available target_ids:', targetIds);
        }
        
        // Now query for the specific entry
        const { data: chatMessages, error: chatError } = await supabase
          .from('user_documents')
          .select('document_data, created_at')
          .eq('user_id', user.id)
          .eq('document_type', 'interaction')
          .eq('tool_slug', 'best-possible-self')
          .eq('document_data->>interaction_type', 'chat_message')
          .eq('document_data->>target_id', entryId)
          .order('created_at', { ascending: true });

        console.log('📊 Database query result for entryId', entryId, ':', chatMessages?.length || 0, 'messages, error:', chatError);

        if (!chatError && chatMessages && chatMessages.length > 0) {
          // Transform database messages to our Message format
          const transformedMessages = chatMessages.map(msg => ({
            role: msg.document_data?.role as 'user' | 'assistant',
            content: msg.document_data?.message || ''
          })).filter(msg => msg.role && msg.content);
          
          console.log('Setting messages from database:', transformedMessages.length, 'messages');
          setMessages(transformedMessages);
        } else {
          // Fallback to sessionStorage if no database messages
          const sessionKey = `chat_messages_${entryId}`;
          const savedMessages = sessionStorage.getItem(sessionKey);
          if (savedMessages) {
            try {
              setMessages(JSON.parse(savedMessages));
            } catch {
              setMessages([]);
            }
          } else {
            setMessages([]);
          }
        }
      } catch (error) {
        console.error('Error loading messages:', error);
        // Fallback to sessionStorage on error
        const sessionKey = `chat_messages_${entryId}`;
        const savedMessages = sessionStorage.getItem(sessionKey);
        if (savedMessages) {
          try {
            setMessages(JSON.parse(savedMessages));
          } catch {
            setMessages([]);
          }
        } else {
          setMessages([]);
        }
      } finally {
        setMessagesLoaded(true);
      }
    };

    loadMessages();
  }, [user, entryId, supabase]);

  // Auto-save messages to sessionStorage for persistence
  useEffect(() => {
    if (messages.length > 0 && user) {
      const sessionKey = entryId ? `chat_messages_${entryId}` : `chat_messages_new_${user.id}`;
      sessionStorage.setItem(sessionKey, JSON.stringify(messages));
    }
  }, [messages, entryId, user]);

  const saveChatMessage = async (message: string, role: 'user' | 'assistant') => {
    if (!user || dataSavingSetting === 'private') {
      console.log('💾 Not saving chat message - user:', !!user, 'dataSetting:', dataSavingSetting);
      return;
    }

    // Don't save to database if we don't have an entryId yet
    // Messages will be saved to sessionStorage and can be saved to database later when entry is saved
    if (!entryId) {
      console.log('💾 Skipping database save - no entryId yet, messages in sessionStorage only');
      return;
    }

    console.log('💾 Saving chat message - entryId:', entryId, 'role:', role, 'message length:', message.length);
    
    try {
      const insertData = {
        user_id: user.id,
        document_type: 'interaction',
        tool_slug: 'best-possible-self',
        is_public: false,
        document_data: {
          target_type: 'tool_session',
          target_id: entryId,
          interaction_type: 'chat_message',
          message,
          role,
          research_consent: researchConsent
        }
      };
      
      console.log('💾 Insert data:', JSON.stringify(insertData, null, 2));
      
      const result = await supabase.from('user_documents').insert(insertData);
      
      if (result.error) {
        console.error('💾 Database insert error:', result.error);
      } else {
        console.log('💾 Successfully saved chat message to database');
      }
    } catch (error) {
      console.error('💾 Error saving chat message:', error);
    }
  };


  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Notify parent component about message exchange
    onMessage?.();

    // Save user message
    await saveChatMessage(input, 'user');

    try {
      console.log('Sending request to AI API:', { message: input, content: content });
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          content: content
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Response data:', data);
      
      if (data.error) {
        throw new Error(data.error);
      }

      const aiMessage: Message = {
        role: 'assistant',
        content: data.response || 'I apologize, but I couldn\'t generate a response. Please try again.'
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Save assistant message
      await saveChatMessage(aiMessage.content, 'assistant');
      
      setIsLoading(false);

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please check your internet connection and try again.`
      }]);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        🤖 AI Help {isOpen ? '▼' : '▶'}
      </button>

      {isOpen && (
        <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
            <h3 className="font-semibold text-gray-800 dark:text-gray-200">AI Assistant</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {!messagesLoaded ? (
              <div className="text-center text-gray-500 dark:text-gray-400 text-sm">
                Loading conversation...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center space-y-3">
                <div className="text-gray-500 dark:text-gray-400 text-sm">
                  Ask me anything about your Best Possible Self exercise!
                </div>
                <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-200 dark:border-amber-700">
                  ⚠️ <strong>Note:</strong> When you use the AI assistant, both your messages AND your journal content are sent to OpenAI to generate responses.
                </div>
              </div>
            ) : null}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[80%] p-3 rounded-lg text-gray-900 dark:text-gray-100 ${
                  message.role === 'user'
                    ? 'ml-auto bg-blue-100 dark:bg-blue-900/20'
                    : 'bg-gray-100 dark:bg-gray-700'
                }`}
              >
                {message.role === 'user' ? (
                  <div className="whitespace-pre-wrap">{message.content}</div>
                ) : (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg max-w-[80%]">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-500 dark:bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask for help..."
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 bg-white dark:bg-gray-800"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 