import { GoogleGenAI } from "@google/genai";
export const performAiCall = async (model: string, prompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({ model, contents: { parts: [{ text: prompt }] } });
  return response.text;
};