

import { GoogleGenAI, Type } from "@google/genai";
import { Language, Company, LandingPageContent } from "../types";
import { addApiTask } from "../utils/apiQueue";
import { stripHtml, addMarkdownFormatting } from "../utils/formatters";

export type RewriteInstruction = 'improve' | 'shorten' | 'lengthen' | 'social_clean';

const performAiCall = async (modelName: string, contents: any, config?: any) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: contents,
            config: config
        });
        
        if (!response || !response.text) {
            throw new Error("AI returnerede intet indhold.");
        }
        
        return response;
    } catch (error: any) {
        const errorMsg = error?.message || "";
        if (errorMsg.includes('429') || errorMsg.includes('limit')) {
            console.error("Rate limit ramt.");
        }
        throw error;
    }
};

export const rewriteText = async (
  originalText: string,
  instruction: RewriteInstruction,
  language: Language,
  isSocial: boolean = false
): Promise<string> => {
  const langName = language === 'da' ? 'Danish' : (language === 'de' ? 'German' : 'English');
  let task = '';

  switch (instruction) {
    case 'improve': task = 'Rewrite to be professional and clear.'; break;
    case 'shorten': task = 'Make this text concise.'; break;
    case 'lengthen': task = 'Expand with more relevant detail.'; break;
    default: task = 'Improve flow and grammar.';
  }

  const prompt = `
    Role: Content Strategist.
    Task: ${task}
    Target Language: ${langName}.
    Formatting: ${isSocial ? 'Plain text with emojis, no markdown.' : 'Standard Markdown.'}
    Text: "${originalText}"
  `;

  return addApiTask(async () => {
    try {
      const response = await performAiCall('gemini-3-flash-preview', prompt, { temperature: 0.3 });
      return isSocial ? stripHtml(response.text) : response.text;
    } catch (error) {
      console.error('Rewrite failed:', error);
      return originalText;
    }
  });
};

export const generateContentStrategy = async (
  company: Company,
  goals: string,
  duration: string,
  language: Language
): Promise<string> => {
    const langName = language === 'da' ? 'Danish' : (language === 'de' ? 'German' : 'English');
    const prompt = `
        Role: Strategic Marketing Director.
        Task: Create a content strategy for ${company.name} (${duration}).
        Context: ${company.description}
        Goals: ${goals}
        Industry: ${company.industry}
        Response Language: ${langName}.
        Format: Use Markdown headers and bullet points.
    `;

    return addApiTask(async () => {
        try {
            const response = await performAiCall('gemini-3-pro-preview', prompt, { temperature: 0.4 });
            return addMarkdownFormatting(response.text);
        } catch (error) {
            console.error('Strategy generation failed:', error);
            throw error;
        }
    });
};

export const generateIndustryPageContent = async (
    company: Company,
    industry: string,
    talkingPoints: string,
    language: Language
): Promise<LandingPageContent> => {
    const langName = language === 'da' ? 'Dansk' : (language === 'de' ? 'Tysk' : 'Engelsk');
    const prompt = `
        Rolle: Ekspert i Conversion Rate Optimization (CRO).
        Opgave: Generer indhold til en B2B landingsside for virksomheden ${company.name}.
        Målbranche: ${industry}.
        Vigtige budskaber: ${talkingPoints}.
        Sprog: ${langName}.

        Returner et JSON objekt med følgende struktur:
        {
          "hero": { "title": "Fangende overskrift", "subtitle": "Beskrivende underoverskrift", "ctaButton": "Primær knap tekst", "secondaryButton": "Sekundær knap tekst" },
          "about": { "title": "Hvorfor vælge os til denne branche", "text": "Uddybende tekst om ekspertise" }
        }
    `;

    return addApiTask(async () => {
        const response = await performAiCall('gemini-3-flash-preview', prompt, { 
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    hero: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            subtitle: { type: Type.STRING },
                            ctaButton: { type: Type.STRING },
                            secondaryButton: { type: Type.STRING }
                        },
                        required: ['title', 'subtitle', 'ctaButton', 'secondaryButton']
                    },
                    about: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            text: { type: Type.STRING }
                        },
                        required: ['title', 'text']
                    }
                },
                required: ['hero', 'about']
            }
        });
        return JSON.parse(response.text);
    });
};

export const generateSocialPost = async (
  topic: string,
  platform: string,
  language: string,
  partnerName: string,
  companyName: string = '',
  companyDna: string = '',
  isCompanySelf: boolean = false,
  visualTags: string[] = []
): Promise<string> => {
  const langName = language === 'da' ? 'Danish' : (language === 'de' ? 'German' : 'English');
  const visualContext = visualTags.length > 0 ? `The post features: ${visualTags.join(', ')}.` : '';
  
  const prompt = `
    Role: Social Media Manager.
    Platform: ${platform}.
    Topic: "${topic}".
    ${visualContext}
    Language: ${langName}.
    ${isCompanySelf ? `Brand: ${companyName}. DNA: ${companyDna}` : `Partner: ${partnerName}. Collaboration with ${companyName}.`}
    Rules: High engagement hook, value-driven body, clear CTA. No markdown tags like # or **. Plain text ONLY.
  `;

  return addApiTask(async () => {
    try {
      const response = await performAiCall('gemini-3-flash-preview', prompt, { temperature: 0.7 });
      return response.text.trim();
    } catch (error) {
      console.error('Post generation failed:', error);
      return '';
    }
  });
};

export const analyzeMediaForTags = async (
    imageBase64: string,
    mimeType: string,
    language: string
): Promise<string[]> => {
    const langName = language === 'da' ? 'Danish' : (language === 'de' ? 'German' : 'English');
    const prompt = `Analyze image. Identify 5-8 primary subjects. Output as comma-separated tags in ${langName}.`;

    return addApiTask(async () => {
        try {
            // Fix: Changed contents from array to object with parts and corrected mimeType typo from imageBase64 to mimeType
            const response = await performAiCall('gemini-3-flash-preview', {
                parts: [
                    { inlineData: { data: imageBase64, mimeType: mimeType } },
                    { text: prompt }
                ]
            }, { temperature: 0.1 });
            return response.text.split(',').map(t => t.trim()).filter(t => t.length > 0);
        } catch (error) {
            console.error('Analysis failed:', error);
            return [];
        }
    });
};

export const editImage = async (
    imageBase64: string,
    mimeType: string,
    prompt: string
): Promise<string> => {
    return addApiTask(async () => {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { data: imageBase64, mimeType: mimeType } },
                    { text: `Apply this professional edit: ${prompt}. Ensure commercial quality suitable for a SaaS brand portal. Do not add text to the image.` }
                ],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return part.inlineData.data;
        }
        throw new Error("Ingen billeddata returneret.");
    });
};
