'use client';

import { useState, useEffect, useRef } from 'react';
import { Transition } from '@headlessui/react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  id: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('You are a helpful AI assistant.');
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [streamingMessage, setStreamingMessage] = useState('');

  // Load messages from localStorage on component mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (error) {
        console.error('Error parsing saved messages:', error);
      }
    }

    const savedSystemPrompt = localStorage.getItem('systemPrompt');
    if (savedSystemPrompt) {
      setSystemPrompt(savedSystemPrompt);
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('chatMessages', JSON.stringify(messages));
    }
  }, [messages]);

  // Save system prompt to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('systemPrompt', systemPrompt);
  }, [systemPrompt]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingMessage]);

  const generateMessageId = () => {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      id: generateMessageId(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingMessage('');

    try {
      // Use streaming API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          message: userMessage.content,
          systemPrompt: systemPrompt,
          stream: true 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      let accumulatedResponse = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // Convert the Uint8Array to a string
        const chunk = new TextDecoder().decode(value);
        accumulatedResponse += chunk;
        setStreamingMessage(accumulatedResponse);
      }

      // Add the complete message to the chat history
      const assistantMessage: Message = {
        role: 'assistant',
        content: accumulatedResponse,
        id: generateMessageId(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setStreamingMessage('');
    } catch (error) {
      console.error('Error:', error);
      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: 'Sorry, there was an error processing your request.',
          id: generateMessageId(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('chatMessages');
  };

  const toggleSystemPrompt = () => {
    setShowSystemPrompt(!showSystemPrompt);
  };

  return (
    <div className="flex flex-col h-[80vh] max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Chat Session</h2>
        <div className="flex gap-2">
          <button
            onClick={toggleSystemPrompt}
            className="px-3 py-1 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 text-sm transition-colors duration-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
          >
            {showSystemPrompt ? 'Hide System Prompt' : 'Edit System Prompt'}
          </button>
          <button
            onClick={clearChat}
            className="px-3 py-1 bg-red-500 text-white rounded-lg hover:bg-red-600 text-sm transition-colors duration-200"
          >
            Clear Chat
          </button>
        </div>
      </div>

      <Transition
        show={showSystemPrompt}
        enter="transition-opacity duration-300"
        enterFrom="opacity-0"
        enterTo="opacity-100"
        leave="transition-opacity duration-300"
        leaveFrom="opacity-100"
        leaveTo="opacity-0"
      >
        <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200 dark:bg-yellow-900/30 dark:border-yellow-800">
          <label className="block text-sm font-medium mb-2">System Prompt:</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:bg-gray-800 dark:border-gray-700"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
            This prompt sets the behavior of the AI assistant.
          </p>
        </div>
      </Transition>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-2">
        {messages.length === 0 && !streamingMessage && (
          <div className="text-center text-gray-500 mt-10 dark:text-gray-400">
            <p>No messages yet. Start a conversation!</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-4 rounded-lg message-enter ${
              message.role === 'user'
                ? 'bg-blue-100 ml-auto max-w-[80%] dark:bg-blue-900/50'
                : 'bg-gray-100 mr-auto max-w-[80%] dark:bg-gray-700/50'
            } transition-all duration-300 ease-in-out`}
          >
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {streamingMessage && (
          <div className="bg-gray-100 p-4 rounded-lg mr-auto max-w-[80%] animate-pulse dark:bg-gray-700/50 message-enter">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{streamingMessage}</ReactMarkdown>
            </div>
          </div>
        )}
        {isLoading && !streamingMessage && (
          <div className="bg-gray-100 p-4 rounded-lg mr-auto max-w-[80%] dark:bg-gray-700/50 message-enter">
            <div className="flex space-x-2 justify-center items-center h-5">
              <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce"></div>
              <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="h-2 w-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-blue-300 transition-colors duration-200"
        >
          Send
        </button>
      </form>
    </div>
  );
} 