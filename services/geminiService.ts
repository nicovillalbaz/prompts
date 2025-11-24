import { GoogleGenAI, Type, Schema } from "@google/genai";
import { PromptRequest, PromptSections } from "../types";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

// Define the schema for structured output
const promptSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    instruction: { type: Type.STRING, description: "La acción específica que debe realizar la IA." },
    context: { type: Type.STRING, description: "El papel o rol que debe adoptar la IA." },
    targetAudience: { type: Type.STRING, description: "A quién va dirigido el resultado final." },
    valueProposition: { type: Type.STRING, description: "Qué hace especial al producto o idea." },
    personality: { type: Type.STRING, description: "El tono y estilo de la comunicación." },
    additionalData: { type: Type.STRING, description: "Cualquier otra información o restricción." },
    outputFormat: { type: Type.STRING, description: "Cómo quieres que la IA te entregue la respuesta." },
  },
  required: ["instruction", "context", "targetAudience", "valueProposition", "personality", "additionalData", "outputFormat"],
};

export const generateOptimizedPrompt = async (request: PromptRequest): Promise<PromptSections> => {
  if (!apiKey) {
    throw new Error("API Key not found in environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `
    Actúa como un Ingeniero de Prompts experto. 
    Tu objetivo es tomar una idea básica de un usuario y transformarla en un prompt altamente estructurado y profesional.
    
    El usuario te dará:
    1. Una idea base.
    2. Un objetivo principal (ej. ${request.objective}).
    3. Un nivel de detalle deseado (ej. ${request.detailLevel}).

    Debes reescribir la idea expandiéndola en las siguientes secciones en formato JSON estricto:
    - instruction: Define claramente la tarea.
    - context: Define el rol experto.
    - targetAudience: Define quién leerá esto.
    - valueProposition: Por qué esto es útil o único.
    - personality: El tono de voz (basado en el objetivo).
    - additionalData: Restricciones o datos extra inferidos.
    - outputFormat: Sugiere un formato ideal (Markdown, Lista, Código, etc.).
    
    El idioma de salida debe ser ESPAÑOL.
  `;

  const userPrompt = `
    Idea Base: "${request.basePrompt}"
    Objetivo Principal: ${request.objective}
    Nivel de Detalle: ${request.detailLevel}
    
    Genera la estructura completa del prompt optimizado.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: promptSchema,
        temperature: 0.7,
      },
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response generated from Gemini.");
    }

    const data = JSON.parse(text) as PromptSections;
    // Add the detail level explicitly back to the object for the UI state
    data.detailLevel = request.detailLevel;
    
    return data;

  } catch (error) {
    console.error("Error generating prompt:", error);
    throw error;
  }
};