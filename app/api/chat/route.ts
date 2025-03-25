import { NextResponse } from 'next/server';

/**
 * Configuración de la URL de Ollama y modelo predeterminado
 * La URL se puede configurar a través de variables de entorno
 */
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.MODEL_NAME || 'llama3.2';

/**
 * Manejador de solicitudes POST para la API de chat
 * 
 * Recibe un mensaje del usuario y lo envía a Ollama para generar una respuesta
 * Soporta streaming de respuestas para una mejor experiencia de usuario
 * 
 * @param req Objeto de solicitud con el mensaje del usuario, prompt del sistema y configuración
 * @returns Respuesta de la API, ya sea en streaming o completa
 */
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

    // Si se solicita streaming, manejamos la respuesta de forma diferente
    if (stream) {
      const encoder = new TextEncoder();
      const customReadable = new ReadableStream({
        async start(controller) {
          try {
            // Llamada a la API de Ollama con streaming activado
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

            /**
             * Procesamiento del streaming de la respuesta de Ollama
             * Leemos cada fragmento y lo enviamos al cliente a medida que llega
             */
            const reader = response.body.getReader();
            let fullResponse = '';

            while (true) {
              const { done, value } = await reader.read();
              if (done) break;

              // Convertimos Uint8Array a string
              const chunk = new TextDecoder().decode(value);
              
              try {
                // Ollama envía cada fragmento como un objeto JSON separado por nuevas líneas
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

      // Devolvemos un stream al cliente para mostrar la respuesta en tiempo real
      return new Response(customReadable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // Respuesta no streaming - esperamos la respuesta completa de Ollama
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