import { GoogleGenAI, Type } from "@google/genai";
import { Language } from "../translations";

// Safe access to process.env
const getApiKey = () => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env.API_KEY;
    }
  } catch (e) {
    // Ignore error if process is not defined
  }
  return null;
};

const getClient = () => {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
};

export const getDailyVerse = async (language: Language = 'en'): Promise<{ text: string; reference: string } | null> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    // Fail silently/gracefully if no key is present, preventing crashes
    return null;
  }

  const ai = getClient();
  if (!ai) {
    console.warn("No API Key found, skipping AI verse generation.");
    return null;
  }

  const langPrompt = language === 'mizo' ? 'Mizo (Lusei)' : 'English';
  
  try {
    const response = await ai.models.generateContent({
      // FIX: Updated model to 'gemini-3-flash-preview' for basic text tasks as per coding guidelines.
      model: 'gemini-3-flash-preview',
      contents: `Generate a single, uplifting Bible verse for the day in ${langPrompt}. Return JSON with "text" and "reference" fields.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { type: Type.STRING },
            reference: { type: Type.STRING }
          },
          required: ['text', 'reference']
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return null;
    return JSON.parse(jsonText);
  } catch (error) {
    console.error("Error fetching verse:", error);
    return null;
  }
};
