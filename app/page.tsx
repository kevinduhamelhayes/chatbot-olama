import Chat from './components/Chat';
import { FaRobot, FaGithub } from 'react-icons/fa';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full gradient-bg flex items-center justify-center shadow-lg">
              <FaRobot className="text-white text-3xl" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-2 gradient-text">
            Chatbot with Ollama
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Una interfaz moderna y elegante para interactuar con modelos de lenguaje locales a través de Ollama
          </p>
          <div className="flex justify-center mt-4 space-x-4">
            <a 
              href="https://github.com/kevinduhamelhayes/chatbot-olama" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <FaGithub className="text-xl" />
              <span>GitHub</span>
            </a>
          </div>
        </header>
        <div className="card p-2 transition-all duration-300 hover:shadow-xl">
          <Chat />
        </div>
        <footer className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} - Construido con Next.js y Ollama</p>
          <p className="mt-1">Diseñado por Kevin Duhamel Hayes</p>
        </footer>
      </div>
    </main>
  );
}
