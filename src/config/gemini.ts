import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export function getGeminiModel(modelId: string) {
  return genAI.getGenerativeModel({ model: modelId });
}

export const GEMINI_MODELS: Record<string, { name: string; description: string; rpm: number }> = {
  'gemini-3.1-flash-lite-preview': { name: 'Gemini 3.1 Flash Lite', description: 'Ultima generazione, preview',            rpm: 15 },
  'gemini-2.0-flash':              { name: 'Gemini 2.0 Flash',      description: 'Veloce, qualità alta',                    rpm: 15 },
  'gemini-2.0-flash-lite':         { name: 'Gemini 2.0 Flash Lite', description: 'Leggerissimo, ideale per testi brevi',    rpm: 30 },
};

export default genAI;
