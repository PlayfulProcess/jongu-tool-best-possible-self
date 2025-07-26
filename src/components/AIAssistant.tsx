'use client';

import { useState } from 'react';
import { useAuth } from './AuthProvider';
import { createClient } from '@/lib/supabase-client';
import type { DataSavingSetting } from './PrivacySettings';

interface AIAssistantProps {
  content: string;
  dataSavingSetting?: DataSavingSetting;
  researchConsent?: boolean;
  entryId?: string | null;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIAssistant({ content, dataSavingSetting = 'private', researchConsent = false, entryId }: AIAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { user } = useAuth();
  const supabase = createClient();

  const saveChatMessage = async (message: string, role: 'user' | 'assistant') => {
    if (!user || dataSavingSetting === 'private') return;

    try {
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        journal_entry_id: entryId,
        message,
        role,
        is_public: false, // We removed public blog option
        research_consent: researchConsent
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
            {messages.length === 0 && (
              <div className="text-center space-y-3">
                <div className="text-gray-500 text-sm">
                  Ask me anything about your Best Possible Self exercise!
                </div>
                <div className="text-xs text-amber-600 bg-amber-50 p-2 rounded border">
                  ⚠️ <strong>Privacy Note:</strong> When you use the AI assistant, both your messages AND your journal content are sent to OpenAI to generate responses. OpenAI processes this data but does not store it for training their models.
                </div>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`max-w-[80%] p-3 rounded-lg whitespace-pre-wrap text-gray-900 ${
                  message.role === 'user'
                    ? 'ml-auto bg-blue-100'
                    : 'bg-gray-100'
                }`}
              >
                {message.content}
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