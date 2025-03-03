import Chat from './components/Chat';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            Chatbot with Ollama
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Powered by local LLMs running on your Windows machine
          </p>
        </header>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-2 transition-all duration-300 hover:shadow-xl">
          <Chat />
        </div>
        <footer className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} - Built with Next.js and Ollama</p>
        </footer>
      </div>
    </main>
  );
}
