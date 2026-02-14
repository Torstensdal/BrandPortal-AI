import { GoogleGenAI } from "@google/genai";
export const rewriteText = async (text: string, instruction: string, language: string) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Rewrite this: "${text}"`
    });
    return response.text;
};
export const analyzeMediaForTags = async (base64: string, mime: string) => ["AI", "Media"];