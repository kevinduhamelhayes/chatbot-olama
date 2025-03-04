# Chatbot with Ollama

A modern, responsive chatbot application built with Next.js that connects to Ollama running on your Windows machine.

![Chatbot with Ollama](/public/captura1.png)

Una interfaz moderna y elegante para interactuar con modelos de lenguaje locales a través de Ollama.

![Chat Interface](/public/captura2.png)

## Features

- 💬 Real-time chat interface with streaming responses
- 🎨 Modern UI with animations and transitions
- 🌓 Dark mode support
- 📝 Markdown rendering for code blocks and formatting
- 💾 Message persistence using localStorage
- 🧠 System prompt customization
- 🔄 Chat history management

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or newer)
- [Ollama](https://ollama.ai/) running on your Windows machine
- A model downloaded in Ollama (e.g., llama2, mistral, etc.)

## Setup Instructions

### 1. Install Ollama on Windows

1. Download and install Ollama from [https://ollama.ai/download](https://ollama.ai/download)
2. Open Ollama and pull a model:
   ```
   ollama pull llama2
   ```
   (You can replace llama2 with any other model you prefer)

3. Make sure Ollama is running on your Windows machine

### 2. Find your Windows IP address

1. Open Command Prompt on Windows
2. Run `ipconfig`
3. Look for your IPv4 Address (e.g., 192.168.1.X)

### 3. Configure the Chatbot

1. Open the `.env.local` file in the project root
2. Update the `OLLAMA_URL` with your Windows IP:
   ```
   OLLAMA_URL=http://YOUR_WINDOWS_IP:11434
   ```
3. Update the `MODEL_NAME` if you're using a different model:
   ```
   MODEL_NAME=llama2
   ```

### 4. Install Dependencies and Run the Application

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Deployment

### Building for Production

```bash
npm run build
npm start
```

### Docker Deployment

You can also deploy the application using Docker:

```bash
# Build the Docker image
docker build -t chatbot-ollama .

# Run the container
docker run -p 3000:3000 -e OLLAMA_URL=http://YOUR_WINDOWS_IP:11434 -e MODEL_NAME=llama2 chatbot-ollama
```

## Customization

### Changing the Model

1. Update the `MODEL_NAME` in your `.env.local` file
2. Make sure you've pulled the model in Ollama:
   ```
   ollama pull MODEL_NAME
   ```

### System Prompt

You can customize the system prompt directly in the UI by clicking the "Edit System Prompt" button.

## Troubleshooting

### Connection Issues

- Make sure Ollama is running on your Windows machine
- Verify that your Windows firewall allows connections to port 11434
- Check that the IP address in `.env.local` is correct
- Ensure your Windows and development machines are on the same network

### Model Issues

- If you get errors about the model not being found, make sure you've pulled it in Ollama
- Some models may require more memory than others

## License

MIT

## Acknowledgements

- [Next.js](https://nextjs.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Ollama](https://ollama.ai/)
- [React Markdown](https://github.com/remarkjs/react-markdown)
- [Headless UI](https://headlessui.com/)