
import { Company, PartnerIdea, ProspectProposal, SuccessStory, User, CalendarEvent, PartnerPostState, SocialPlatform, Partner, Contact, Lead, DripCampaign, ActiveDripCampaign, TeamMemberRole } from '../types';
import { v4 as uuidv4 } from 'uuid';
import * as db from '../server/db';
import { GoogleGenAI, Type } from "@google/genai";
import { addApiTask } from "../utils/apiQueue";
import { get21StepTemplate, getPartnerPlanTemplate } from '../data/demoData';
import { stripHtml } from "../utils/formatters";
import * as geminiService from './geminiService';

const cleanJsonResponse = (text: string) => {
    return text.replace(/```json\n?/, '').replace(/\n?```/, '').trim();
};

export const loginUser = async (email: string): Promise<{ user: User, token: string }> => {
    return db.loginUser(email);
};

export const registerUser = async (email: string): Promise<User> => {
    return db.registerUser(email);
};

export const getCompaniesForUser = async (token: string): Promise<Company[]> => {
    return db.getCompaniesForUser(token);
};

// Fixed: Added token parameter to getCompany for consistency with the rest of the API client functions
export const getCompany = async (token: string, companyId: string): Promise<Company> => {
    return db.getCompany(companyId);
};

export const createCompany = async (token: string, name: string, website: string): Promise<Company> => {
    return db.createCompany(token, name, website);
};

export const importCompany = async (token: string, companyData: Company): Promise<Company> => {
    return db.importCompany(token, companyData);
};

export const updateCompanyDetails = async (token: string, companyId: string, details: Partial<Company>): Promise<Company> => {
    return db.updateCompany(companyId, details);
};

export const addPartner = async (token: string, companyId: string, partner: Partner): Promise<Company> => {
    return db.addPartner(companyId, partner);
};

export const updatePartner = async (token: string, companyId: string, partner: Partner): Promise<Company> => {
    return db.updatePartner(companyId, partner);
};

export const deletePartners = async (token: string, companyId: string, partnerIds: string[]): Promise<Company> => {
    return db.deletePartners(companyId, partnerIds);
};

export const bulkUpdatePartners = async (token: string, companyId: string, partnerIds: string[], updates: Partial<Partner>): Promise<Company> => {
    return db.bulkUpdatePartners(companyId, partnerIds, updates);
};

export const submitPartnerIdea = async (token: string, companyId: string, partnerId: string, ideaData: Pick<PartnerIdea, 'title' | 'description' | 'link'>): Promise<Company> => {
    const idea: PartnerIdea = {
        id: `idea-${uuidv4()}`,
        partnerId,
        ...ideaData,
        submittedBy: 'partner',
        timestamp: new Date().toISOString(),
        status: 'new'
    };
    return await db.addPartnerIdea(companyId, idea);
};

export const savePartnerProposal = async (token: string, companyId: string, partnerId: string, proposal: ProspectProposal): Promise<Company> => {
    return await db.addPartnerProposal(companyId, partnerId, proposal);
};

export const deletePartnerProposal = async (token: string, companyId: string, partnerId: string, proposalId: string): Promise<Company> => {
    return await db.deletePartnerProposal(companyId, partnerId, proposalId);
};

/**
 * GENERER INDHOLDSSTRATEGI VIA AI
 */
export const generateStrategy = async (token: string, companyId: string, goals: string, duration: string): Promise<string> => {
    const company = await db.getCompany(companyId);
    return geminiService.generateContentStrategy(company, goals, duration, company.language || 'da');
};

/**
 * GENERER DETALJERET PARTNERPLAN (8 TRIN) VIA AI
 */
export const generateGrowthPlan = async (token: string, companyId: string, partnerId: string): Promise<ProspectProposal> => {
    const company = await db.getCompany(companyId);
    const partner = company.partners.find(p => p.id === partnerId);
    if (!partner) throw new Error("Partner not found");

    const lang = partner.language || 'da';
    const template = getPartnerPlanTemplate(lang as any, partner.name);

    return addApiTask(async () => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const prompt = `Role: Strategic Manager. Create detailed 8-step Strategy for: ${partner.name}. STRUCTURE: ${template.map(s => s.title).join('\n')}`;
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: prompt,
                config: { 
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: { id: { type: Type.STRING }, title: { type: Type.STRING }, body: { type: Type.STRING } },
                            required: ['id', 'title', 'body']
                        }
                    }
                }
            });
            const aiSections = JSON.parse(cleanJsonResponse(response.text || '[]'));
            return {
                id: `partner-plan-${uuidv4()}`,
                name: aiSections[0]?.title.toUpperCase() || 'STRATEGISK PLAN',
                prospectId: partnerId,
                language: lang as any,
                prospectName: partner.name,
                prospectWebsite: partner.website,
                prospectLogoUrl: partner.logoUrl,
                companyName: company.name,
                brandColors: { primary: '#29A39C', secondary: '#0B1D39' },
                introduction: { title: "Vision", executiveSummary: aiSections[0]?.body.substring(0, 150) + "..." },
                platformOverview: { title: "Strategie", items: [] },
                analysis: { title: "Analyse", toneOfVoice: { description: "Professional", dos: [], donts: [] } },
                strategy: { pillars: [] },
                businessPairs: {kpis:[], swot:{strengths:[], weaknesses:[], opportunities:[], threats:[]}},
                customSections: aiSections
            };
        } catch (e) {
            return db.generateMockProposal(companyId, partnerId);
        }
    });
};

export const generateCompanyGrowthPlan = async (token: string, companyId: string): Promise<ProspectProposal> => {
    const company = await db.getCompany(companyId);
    const templateSections = get21StepTemplate();
    return {
        id: `master-plan-${uuidv4()}`,
        name: `MASTER VÆKSTSTRATEGI 2026-2027: ${company.name}`,
        prospectId: companyId,
        language: 'da',
        prospectName: company.name,
        prospectWebsite: company.website,
        prospectLogoUrl: company.brandKit?.logoAssetId,
        companyName: company.name,
        brandColors: { primary: '#29A39C', secondary: '#0B1D39' },
        introduction: { title: "Ledelsesresumé", executiveSummary: "Strategisk Retning" },
        platformOverview: { title: "Vækstmotor", items: [] },
        analysis: { title: "Forretningsanalyse", toneOfVoice: { description: "Professional.", dos: [], donts: [] } },
        strategy: { pillars: [] },
        businessPairs: {kpis:[], swot:{strengths:[], weaknesses:[], opportunities:[], threats:[]}},
        customSections: templateSections
    };
};

export const updateEvent = async (token: string, companyId: string, eventId: string, updates: any, partnerId: string): Promise<Company> => {
    return db.updateEvent(token, companyId, eventId, updates, partnerId);
};

export const handleAddEvents = async (token: string, companyId: string, events: CalendarEvent[]): Promise<Company> => {
    return db.addEvents(token, companyId, events);
};

/**
 * FORBEDRET BERIGELSE: Henter data direkte fra hjemmesiden via Google Search og AI-analyse.
 */
export const enrichFromWebsite = async (token: string, website: string, language: string): Promise<Partial<Partner>> => {
    let fullUrl = website.trim();
    if (!/^https?:\/\//i.test(fullUrl)) fullUrl = 'https://' + fullUrl;
    const langName = language === 'da' ? 'Dansk' : (language === 'de' ? 'Tysk' : 'Engelsk');

    return addApiTask(async () => {
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            const prompt = `
                Udfør en professionel virksomhedsanalyse af ${fullUrl}.
                Besøg og analyser hjemmesiden for at finde følgende information:
                1. Virksomhedens præcise navn.
                2. En omfattende beskrivelse af deres forretningsmodel og kerneydelser (minimum 3 afsnit).
                3. Den primære branche.
                4. Den specifikke målgruppe (B2B, B2C, segmenter).
                5. Deres vigtigste værditilbud (Unique Value Propositions).
                6. Analyser deres 'Tone of Voice' og kommunikationsstil.
                
                Svar på ${langName}. Alt indhold skal være faktuelt baseret på den information der findes på hjemmesiden.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: { 
                    tools: [{ googleSearch: {} }],
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            industry: { type: Type.STRING },
                            description: { type: Type.STRING },
                            targetAudience: { type: Type.STRING },
                            valueProposition: { type: Type.STRING },
                            brandVoice: {
                                type: Type.OBJECT,
                                properties: {
                                    toneOfVoice: { type: Type.STRING },
                                    dos: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    donts: { type: Type.ARRAY, items: { type: Type.STRING } }
                                },
                                required: ['toneOfVoice', 'dos', 'donts']
                            }
                        },
                        required: ['name', 'industry', 'description', 'targetAudience', 'valueProposition', 'brandVoice']
                    }
                }
            });

            const data = JSON.parse(cleanJsonResponse(response.text || '{}'));
            
            return {
                name: data.name || website.split('.')[0],
                website: fullUrl,
                language: language as any,
                industry: data.industry,
                description: data.description,
                targetAudience: data.targetAudience,
                valueProposition: data.valueProposition,
                brandVoice: data.brandVoice,
                status: 'completed'
            };
        } catch (e) {
            console.error("Enrichment error:", e);
            return { 
                name: website.split('.')[0], 
                website: fullUrl, 
                language: language as any, 
                status: 'completed' 
            };
        }
    });
};

export const getDripCampaignTasks = async (token: string, companyId: string): Promise<ActiveDripCampaign[]> => [];
export const generatePersonalizedDripMessage = async (token: string, contact: Contact, partner: Partner, template: string): Promise<string> => `Hi ${contact.name}, ${template}`;
