
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult, UserMetrics } from "../types";

// Helper: Get Client with optional key check
const getClient = async (requireUserKey = false) => {
  if (requireUserKey && (window as any).aistudio) {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      await (window as any).aistudio.openSelectKey();
    }
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Helper: Retry Wrapper for 429/403/404 errors
const executeWithRetry = async <T>(
  operation: (ai: GoogleGenAI) => Promise<T>,
  requireUserKeyInitial = false
): Promise<T> => {
  let ai = await getClient(requireUserKeyInitial);
  try {
    return await operation(ai);
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    
    // Check for 403 (Permission), 404 (Not Found - often key related), 429 (Quota)
    const isPermissionError = error.message?.includes('403') || error.status === 403 || error.message?.includes('Permission denied');
    const isNotFoundError = error.message?.includes('404') || error.status === 404 || error.message?.includes('not found') || error.message?.includes('Requested entity was not found');
    const isQuotaError = error.message?.includes('429') || error.status === 429 || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED');
    
    if ((isPermissionError || isNotFoundError || isQuotaError) && (window as any).aistudio) {
      console.log("Attempting to refresh API key due to error...");
      await (window as any).aistudio.openSelectKey();
      // Re-instantiate with new key
      ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Retry
      return await operation(ai);
    }
    throw error;
  }
};

export const analyzeImageWithGemini = async (
  base64Image: string,
  metrics: UserMetrics,
  environment: string
): Promise<AnalysisResult> => {
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      visagismo: {
        type: Type.OBJECT,
        properties: {
          cabelo: {
            type: Type.OBJECT,
            properties: {
              estilo: { type: Type.STRING },
              detalhes: { type: Type.STRING }
            }
          },
          barba_ou_make: {
            type: Type.OBJECT,
            properties: {
              estilo: { type: Type.STRING },
              detalhes: { type: Type.STRING }
            }
          }
        }
      },
      biotipo: { type: Type.STRING },
      tom_pele_detectado: { 
        type: Type.STRING, 
        enum: ['Quente', 'Frio', 'Neutro', 'Oliva'] 
      },
      analise_pele: { type: Type.STRING },
      paleta_cores: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            hex: { type: Type.STRING },
            nome: { type: Type.STRING }
          }
        }
      },
      formato_rosto_detalhado: { type: Type.STRING },
      sugestoes_roupa: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            titulo: { type: Type.STRING },
            detalhes: { type: Type.STRING },
            ocasiao: { type: Type.STRING },
            components: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  peca: { type: Type.STRING },
                  loja: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    },
    required: ["visagismo", "biotipo", "tom_pele_detectado", "analise_pele", "paleta_cores", "sugestoes_roupa", "formato_rosto_detalhado"]
  };

  return executeWithRetry(async (ai) => {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { 
            text: `Analyze this person for a complete fashion and visagism consultation.
            User Metrics: Height ${metrics.height || 'unknown'}m, Weight ${metrics.weight || 'unknown'}kg.
            Target Environment/Style: ${environment}.
            
            Provide:
            1. Visagism (Hair, Makeup/Beard suggestions).
            2. Biotype analysis.
            3. Skin Tone (Quente, Frio, Neutro, Oliva) and explanation.
            4. Seasonal Color Palette (5-6 colors).
            5. 4 distinct outfit suggestions suitable for the environment and biotype.
            6. Detailed Face Shape analysis.
            `
          }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    }
    throw new Error("Failed to analyze image");
  });
};

export const generateVisualEdit = async (
  base64Image: string,
  type: string,
  prompt: string,
  visagismDesc: string,
  context: { biotype: string; palette: string },
  refinement?: string
): Promise<string> => {
  const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, '');

  return executeWithRetry(async (ai) => {
    const fullPrompt = `Fashion Editor. 
    Task: ${prompt}. 
    Visagism details to preserve/enhance: ${visagismDesc}.
    User Biotype: ${context.biotype}.
    ${refinement ? `Refinement instructions: ${refinement}` : ''}
    Output: High quality, photorealistic image maintaining the user's face identity.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: fullPrompt }
        ]
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Failed to generate visual edit");
  });
};
