import { NextResponse } from 'next/server';

/**
 * Configuración de la URL de Ollama
 * La URL se puede configurar a través de variables de entorno
 */
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

/**
 * Endpoint para obtener la lista de modelos disponibles en Ollama
 * 
 * Realiza una solicitud a la API de Ollama para obtener los modelos instalados
 * y devuelve un array con los nombres de los modelos
 * 
 * @returns Respuesta JSON con la lista de modelos disponibles
 */
export async function GET() {
  try {
    // Solicitud a la API de Ollama para obtener la lista de modelos
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extraemos solo los nombres de los modelos del objeto de respuesta
    const models = data.models ? data.models.map((model: any) => model.name) : [];
    
    return NextResponse.json({ models });
  } catch (error) {
    console.error('Error fetching models:', error);
    // En caso de error, devolvemos un array vacío para evitar errores en el cliente
    return NextResponse.json(
      { error: 'Failed to fetch models', models: [] },
      { status: 500 }
    );
  }
} 