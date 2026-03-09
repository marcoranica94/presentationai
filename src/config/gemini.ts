import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '');

export function getGeminiModel(modelId: string) {
  return genAI.getGenerativeModel({ model: modelId });
}

export const GEMINI_MODELS: Record<string, { name: string; description: string; rpm: number }> = {
  'gemini-2.0-flash':      { name: 'Gemini 2.0 Flash',      description: 'Più veloce, qualità alta',             rpm: 15 },
  'gemini-2.0-flash-lite': { name: 'Gemini 2.0 Flash Lite', description: 'Leggerissimo, ideale per testi brevi', rpm: 30 },
  'gemini-1.5-flash':      { name: 'Gemini 1.5 Flash',      description: 'Stabile, ottimo bilanciamento',        rpm: 15 },
  'gemini-1.5-flash-8b':   { name: 'Gemini 1.5 Flash 8B',   description: 'Ultra-veloce, testi semplici',         rpm: 15 },
};

export default genAI;
