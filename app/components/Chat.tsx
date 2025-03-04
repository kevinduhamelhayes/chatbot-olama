'use client';

import { useState, useEffect, useRef } from 'react';
import { Transition } from '@headlessui/react';
import ReactMarkdown from 'react-markdown';
import { FiSend, FiTrash2, FiSettings, FiCopy, FiDownload, FiMoon, FiSun } from 'react-icons/fi';
import { FaRobot, FaUser } from 'react-icons/fa';
import { useTheme } from './ThemeProvider';

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
  const { theme, setTheme } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [modelName, setModelName] = useState('llama3.2');
  const [availableModels, setAvailableModels] = useState<string[]>([]);

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

    // Fetch available models
    fetchModels();
  }, []);

  // Fetch available models from Ollama
  const fetchModels = async () => {
    try {
      const response = await fetch('/api/models');
      if (response.ok) {
        const data = await response.json();
        setAvailableModels(data.models || []);
        
        // Set current model from env or first available
        const envModel = process.env.NEXT_PUBLIC_MODEL_NAME;
        if (envModel) {
          setModelName(envModel);
        } else if (data.models && data.models.length > 0) {
          setModelName(data.models[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

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
          model: modelName,
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
          content: 'Lo siento, hubo un error al procesar tu solicitud. Por favor, intenta de nuevo.',
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

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        alert('Texto copiado al portapapeles');
      },
      (err) => {
        console.error('Error al copiar: ', err);
      }
    );
  };

  const downloadChat = () => {
    const chatText = messages
      .map((msg) => `${msg.role === 'user' ? 'Usuario' : 'Asistente'}: ${msg.content}`)
      .join('\n\n');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-[60vh] max-w-3xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold gradient-text">Chat con {modelName}</h2>
        <div className="flex gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            {theme === 'light' ? <FiMoon /> : <FiSun />}
          </button>
          <button
            onClick={toggleSystemPrompt}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Configuración"
            title="Configuración"
          >
            <FiSettings />
          </button>
          <button
            onClick={downloadChat}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Descargar chat"
            title="Descargar chat"
          >
            <FiDownload />
          </button>
          <button
            onClick={clearChat}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-red-500"
            aria-label="Limpiar chat"
            title="Limpiar chat"
          >
            <FiTrash2 />
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
        <div className="mb-4 p-4 card bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
          <div className="mb-3">
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Modelo:</label>
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
            >
              {availableModels.length > 0 ? (
                availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))
              ) : (
                <option value={modelName}>{modelName}</option>
              )}
            </select>
          </div>
          
          <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">Instrucciones del sistema:</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            className="w-full p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-gray-300 dark:border-gray-700"
            rows={3}
          />
          <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
            Este prompt define el comportamiento del asistente AI.
          </p>
        </div>
      </Transition>

      <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-2">
        {messages.length === 0 && !streamingMessage && (
          <div className="text-center text-gray-500 mt-10 dark:text-gray-400">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center">
                <FaRobot className="text-white text-3xl" />
              </div>
            </div>
            <p className="text-lg">¡Hola! Soy tu asistente AI.</p>
            <p className="text-sm mt-2">Hazme cualquier pregunta para comenzar una conversación.</p>
          </div>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-4 rounded-lg message-enter ${
              message.role === 'user'
                ? 'bg-primary/10 ml-auto max-w-[80%] dark:bg-primary/20'
                : 'card mr-auto max-w-[80%]'
            } transition-all duration-300 ease-in-out`}
          >
            <div className="flex items-center gap-2 mb-2">
              {message.role === 'user' ? (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                  <FaUser className="text-white text-xs" />
                </div>
              ) : (
                <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center">
                  <FaRobot className="text-white text-xs" />
                </div>
              )}
              <span className="text-xs font-medium">
                {message.role === 'user' ? 'Tú' : 'Asistente'}
              </span>
              {message.role === 'assistant' && (
                <button
                  onClick={() => copyToClipboard(message.content)}
                  className="ml-auto text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                  aria-label="Copiar mensaje"
                  title="Copiar mensaje"
                >
                  <FiCopy size={14} />
                </button>
              )}
            </div>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {streamingMessage && (
          <div className="card p-4 rounded-lg mr-auto max-w-[80%] message-enter">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center">
                <FaRobot className="text-white text-xs" />
              </div>
              <span className="text-xs font-medium">Asistente</span>
            </div>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>{streamingMessage}</ReactMarkdown>
            </div>
          </div>
        )}
        {isLoading && !streamingMessage && (
          <div className="card p-4 rounded-lg mr-auto max-w-[80%] message-enter">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-full gradient-bg flex items-center justify-center">
                <FaRobot className="text-white text-xs" />
              </div>
              <span className="text-xs font-medium">Asistente</span>
            </div>
            <div className="flex space-x-2 justify-center items-center h-5">
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce"></div>
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Escribe tu mensaje..."
          className="flex-1 p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:border-gray-700 dark:text-white"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="btn btn-primary p-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Enviar mensaje"
          title="Enviar mensaje"
        >
          <FiSend />
        </button>
      </form>
    </div>
  );
} 