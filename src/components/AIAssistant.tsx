'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { createClient } from '@/lib/supabase-client';
import type { DataSavingSetting } from './PrivacySettings';
import ReactMarkdown from 'react-markdown';

interface AIAssistantProps {
  content: string;
  dataSavingSetting?: DataSavingSetting;
  researchConsent?: boolean;
  entryId?: string | null;
  onMessage?: () => void;
  clearChat?: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
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
  const [previousEntryId, setPreviousEntryId] = useState<string | null>(null);
  
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
      
      // Update previousEntryId tracking
      setPreviousEntryId(entryId || null);
      
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
        console.log('Querying database for entryId:', entryId);
        const { data: chatMessages, error: chatError } = await supabase
          .from('user_documents')
          .select('document_data, created_at')
          .eq('user_id', user.id)
          .eq('document_type', 'interaction')
          .eq('tool_slug', 'best-possible-self')
          .eq('document_data->>interaction_type', 'chat_message')
          .eq('document_data->>target_id', entryId)
          .order('created_at', { ascending: true });

        console.log('Database query result:', chatMessages?.length || 0, 'messages, error:', chatError);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, entryId, supabase]);

  // Auto-save messages to sessionStorage for persistence
  useEffect(() => {
    if (messages.length > 0 && user) {
      const sessionKey = entryId ? `chat_messages_${entryId}` : `chat_messages_new_${user.id}`;
      sessionStorage.setItem(sessionKey, JSON.stringify(messages));
    }
  }, [messages, entryId, user]);

  const saveChatMessage = async (message: string, role: 'user' | 'assistant') => {
    if (!user || dataSavingSetting === 'private') return;

    try {
      await supabase.from('user_documents').insert({
        user_id: user.id,
        document_type: 'interaction',
        tool_slug: 'best-possible-self',
        is_public: false,
        document_data: {
          target_type: 'tool_session',
          target_id: entryId || 'new_session',
          interaction_type: 'chat_message',
          message,
          role,
          research_consent: researchConsent
        }
      });
    } catch (error) {
      console.error('Error saving chat message:', error);
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
        <div className="mt-4 border border-gray-200 rounded-lg bg-white shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-800">AI Assistant</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {!messagesLoaded ? (
              <div className="text-center text-gray-500 text-sm">
                Loading conversation...
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center space-y-3">
                <div className="text-gray-500 text-sm">
                  Ask me anything about your Best Possible Self exercise!
                </div>
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border">
                  ⚠️ <strong>Privacy Note:</strong> When you use the AI assistant, both your messages AND your journal content are sent to OpenAI to generate responses. OpenAI processes this data but does not store it for training their models.
                </div>
              </div>
            ) : null}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[80%] p-3 rounded-lg text-gray-900 ${
                  message.role === 'user'
                    ? 'ml-auto bg-blue-100'
                    : 'bg-gray-100'
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
              <div className="bg-gray-100 p-3 rounded-lg max-w-[80%]">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t bg-gray-50">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Ask for help..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 placeholder-gray-500"
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