import { NextResponse } from 'next/server';

// Update this to match your Ollama URL
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.MODEL_NAME || 'llama3.2';

export async function POST(req: Request) {
  try {
    const { message, systemPrompt, stream, model } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Use the provided model or fall back to the default
    const modelToUse = model || DEFAULT_MODEL;

    // If streaming is requested, handle it differently
    if (stream) {
      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            const response = await fetch(`${OLLAMA_URL}/api/generate`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: modelToUse,
                prompt: message,
                system: systemPrompt || '',
                stream: true,
              }),
            });

            if (!response.ok) {
              throw new Error(`Ollama API error: ${response.statusText}`);
            }

            if (!response.body) {
              throw new Error('Response body is null');
            }

            const reader = response.body.getReader();
            let fullResponse = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              // Convert the Uint8Array to a string
              const chunk = new TextDecoder().decode(value);
              
              try {
                // Ollama sends each chunk as a JSON object
                const lines = chunk.split('\n').filter(line => line.trim());
                
                for (const line of lines) {
                  const parsedChunk = JSON.parse(line);
                  if (parsedChunk.response) {
                    fullResponse += parsedChunk.response;
                    controller.enqueue(encoder.encode(parsedChunk.response));
                  }
                }
              } catch (e) {
                console.error('Error parsing chunk:', e);
              }
            }

            controller.close();
          } catch (error) {
            console.error('Streaming error:', error);
            controller.error(error);
          }
        }
      });

      return new Response(customReadable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Non-streaming response
      const response = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelToUse,
          prompt: message,
          system: systemPrompt || '',
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return NextResponse.json({ response: data.response });
    }
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 