import { GoogleGenAI, Type, Schema } from "@google/genai";

// Helper to get the correct client instance
const getClient = async (requireUserKey = false) => {
  if (requireUserKey && (window as any).aistudio) {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await (window as any).aistudio.openSelectKey();
    }
  }
  return new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY }); });
};

// Wrapper to handle API errors, specifically permissions (403), not found (404), and quota (429)
// by prompting for a new key and retrying.
const executeWithRetry = async <T>(
  operation: (ai: GoogleGenAI) => Promise<T>,
  requireUserKeyInitial = false
): Promise<T> => {
  let ai = await getClient(requireUserKeyInitial);
  try {
    return await operation(ai);
  } catch (error: any) {
    // Check for 403 Permission Denied or 404 Not Found (often key/project related)
    const isPermissionError = error.message?.includes('403') || error.status === 403 || error.message?.includes('Permission denied') || error.message?.includes('PERMISSION_DENIED');
    const isNotFoundError = error.message?.includes('not found') || error.status === 404 || error.message?.includes('Requested entity was not found');
    const isQuotaError = error.message?.includes('429') || error.status === 429 || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED');
    
    if ((isPermissionError || isNotFoundError || isQuotaError) && (window as any).aistudio) {
      // Prompt user to select a key
      await (window as any).aistudio.openSelectKey();
      // Re-instantiate client with the new key (injected into env)
      ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Retry the operation
      return await operation(ai);
    }
    throw error;
  }
};

export interface AnalysisResult {
  skinTone: string;
  faceShape: string;
  season: string;
  contrast: 'Baixo' | 'Médio' | 'Alto';
  traits: string[];
}

export interface LayoutResult {
  conceptName: string;
  spatialStrategy: string;
  zones: Array<{
    name: string;
    description: string;
    items: string[];
    placement: string;
  }>;
  lightingTips: string;
}

// Feature: Analyze Images (Gemini 3 Pro + Thinking)
export const analyzeUserImage = async (base64Image: string): Promise<AnalysisResult> => {
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      skinTone: { type: Type.STRING, description: "Skin undertone (Cool, Warm, Neutral)" },
      faceShape: { type: Type.STRING, description: "Face shape (Oval, Round, Square, Heart, etc)" },
      season: { 
        type: Type.STRING, 
        enum: ['Inverno Brilhante', 'Verão Suave', 'Outono Profundo', 'Primavera Clara'],
        description: "Seasonal Color Analysis"
      },
      contrast: { type: Type.STRING, enum: ['Baixo', 'Médio', 'Alto'] },
      traits: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 key facial features" }
    },
    required: ["skinTone", "faceShape", "season", "contrast", "traits"]
  };

  return executeWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: "Analyze this person's features for a fashion consultation. Determine face shape, skin tone, contrast level, and seasonal color palette." }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema,
        thinkingConfig: { thinkingBudget: 32768 }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    }
    throw new Error("Failed to analyze image");
  }, false);
};

// Feature: Generate Images (Gemini 3 Pro Image)
export const generateFashionLook = async (
  description: string, 
  imageSize: '1K' | '2K' | '4K' = '1K'
): Promise<string> => {
  return executeWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: `Professional fashion photography, full body shot. ${description}. High fashion, photorealistic, 8k.` }]
      },
      config: {
        imageConfig: {
          imageSize: imageSize,
          aspectRatio: "3:4"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated");
  }, true); // Require user key initially for Pro Image model
};

// Feature: Text-based Image Editing (Gemini 2.5 Flash Image - Nano Banana)
export const editFashionLook = async (base64Image: string, prompt: string): Promise<string> => {
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

  return executeWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Nano Banana
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: cleanBase64 } },
          { text: prompt }
        ]
      }
      // Note: responseMimeType is NOT supported for nano banana series
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Failed to edit image");
  }, false);
};

// Feature: Interior Layout Generator (Gemini 2.5 Flash)
export const generateLayoutSuggestion = async (
  roomType: string,
  width: number,
  length: number,
  preferences: string[]
): Promise<LayoutResult> => {
  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      conceptName: { type: Type.STRING },
      spatialStrategy: { type: Type.STRING, description: "How the preferences guided the layout choice" },
      zones: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            items: { type: Type.ARRAY, items: { type: Type.STRING } },
            placement: { type: Type.STRING, description: "Where in the room (e.g., Near window, North wall)" }
          }
        }
      },
      lightingTips: { type: Type.STRING }
    },
    required: ["conceptName", "spatialStrategy", "zones", "lightingTips"]
  };

  return executeWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [{ 
          text: `Act as a world-class Interior Architect. Design an optimal layout for a ${roomType} (${width}m x ${length}m).
          
          CLIENT PREFERENCES:
          ${preferences.length > 0 ? preferences.map(p => `- ${p}`).join('\n') : '- Optimize for functionality and flow.'}
          
          DESIGN RULES:
          1. Respect the dimensions strictly.
          2. Prioritize the client preferences above standard conventions if necessary.
          3. If "Home Office" is requested, define a specific zone with desk placement.
          4. For "Natural Light", prioritize furniture orientation towards potential window locations.
          
          Provide a structured JSON response.` 
        }]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as LayoutResult;
    }
    throw new Error("Failed to generate layout");
  }, false);
};
