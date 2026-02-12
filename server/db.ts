
import { Company, User, Partner, ProspectProposal, PartnerIdea, SuccessStory, CalendarEvent } from '../types';
import { demoCompany, get21StepTemplate, getPartnerPlanTemplate } from '../data/demoData';
import { v4 as uuidv4 } from 'uuid';
import * as assetStorage from '../utils/assetStorage';
import { stripMarkdown, deepSanitize } from '../utils/formatters';

const LIST_KEY = 'growth_hub_stable_v1_production'; 

const LEGACY_KEYS = [
    'growth_hub_companies_id_list_v21_final_rev8_clean_ui',
    'growth_hub_companies_id_list_v21_final_rev7',
    'growth_hub_companies_id_list_v20',
    'brand_portal_companies_id_list'
];

let companies: Company[] | null = null;
let users: User[] = [];

const ensureInitialized = async () => {
    if (companies !== null) return;
    try {
        let idList = await assetStorage.loadAppState<string[]>(LIST_KEY);
        
        if (!idList || idList.length === 0) {
            for (const legacyKey of LEGACY_KEYS) {
                const legacyList = await assetStorage.loadAppState<string[]>(legacyKey);
                if (legacyList && legacyList.length > 0) {
                    idList = legacyList;
                    await assetStorage.saveAppState(LIST_KEY, idList);
                    break;
                }
            }
        }

        if (idList && idList.length > 0) {
            const loaded = await Promise.all(idList.map(async id => {
                const meta = await assetStorage.loadAppState<any>(`company_meta_${id}`);
                return meta ? { ...meta, id } : null;
            }));
            companies = loaded.filter((c): c is Company => c !== null);
        }
        
        // Hvis der ingen virksomheder findes, så opret med det nye DNA fra demoCompany
        if (!companies || companies.length === 0) {
            const initialCompany = JSON.parse(JSON.stringify({
                ...demoCompany,
                id: `project-${uuidv4().substring(0,8)}`,
                updatedAt: new Date().toISOString()
            }));
            companies = [initialCompany];
            await assetStorage.saveAppState(LIST_KEY, [initialCompany.id]);
            await assetStorage.saveAppState(`company_meta_${initialCompany.id}`, initialCompany);
        }
    } catch (e) { 
        console.error("Database boot failed", e);
        companies = companies || []; 
    }
};

export const loginUser = async (email: string): Promise<{ user: User, token: string }> => {
    let user = users.find(u => u.email === email);
    if (!user) { user = { id: `user-${Date.now()}`, email }; users.push(user); }
    await ensureInitialized();
    return { user, token: `mock-token-${email}` };
};

export const registerUser = async (email: string): Promise<User> => {
    let user = users.find(u => u.email === email);
    if (!user) { user = { id: `user-${Date.now()}`, email }; users.push(user); }
    return user;
};

export const getCompaniesForUser = async (token: string): Promise<Company[]> => {
    await ensureInitialized();
    return companies || [];
};

export const getCompany = async (companyId: string): Promise<Company> => {
    await ensureInitialized();
    const c = companies?.find(x => x.id === companyId);
    if (!c) throw new Error("Company not found");
    return c;
};

export const updateCompany = async (id: string, details: Partial<Company>): Promise<Company> => {
    await ensureInitialized();
    const index = companies?.findIndex(c => c.id === id) ?? -1;
    if (index === -1) throw new Error("Company not found");
    
    const existing = companies![index];
    const sanitizedDetails = deepSanitize(details);
    
    let updatedData = { ...existing, ...sanitizedDetails };
    
    companies![index] = updatedData;
    await assetStorage.saveAppState(`company_meta_${id}`, updatedData);
    return updatedData;
};

export const createCompany = async (token: string, name: string, website: string): Promise<Company> => {
    await ensureInitialized();
    const newId = `project-${uuidv4().substring(0,8)}`;
    const newCompany: Company = {
        id: newId,
        name: name || website.split('.')[0],
        website,
        partners: [],
        updatedAt: new Date().toISOString()
    };
    companies!.push(newCompany);
    await assetStorage.saveAppState(LIST_KEY, companies!.map(c => c.id));
    await assetStorage.saveAppState(`company_meta_${newId}`, newCompany);
    return newCompany;
};

export const importCompany = async (token: string, companyData: Company): Promise<Company> => {
    await ensureInitialized();
    
    const existingIndex = companies?.findIndex(c => c.id === companyData.id) ?? -1;
    const existing = existingIndex > -1 ? companies![existingIndex] : null;

    const mergedSaved = [
        ...(companyData.savedGrowthPlans || []),
        ...(existing?.savedGrowthPlans || [])
    ].filter((p, i, self) => self.findIndex(t => t.id === p.id) === i);

    const sanitized = deepSanitize(companyData);
    const migratedData: Company = {
        ...sanitized,
        id: companyData.id || `project-${uuidv4().substring(0,8)}`,
        savedGrowthPlans: mergedSaved,
        updatedAt: new Date().toISOString()
    };

    if (existingIndex > -1) companies![existingIndex] = migratedData;
    else companies!.push(migratedData);
    
    await assetStorage.saveAppState(LIST_KEY, companies!.map(c => c.id));
    await assetStorage.saveAppState(`company_meta_${migratedData.id}`, migratedData);
    return migratedData;
};

export const addPartner = async (companyId: string, partner: Partner): Promise<Company> => {
    const company = await getCompany(companyId);
    company.partners = [...(company.partners || []), partner];
    return await updateCompany(companyId, { partners: company.partners });
};

export const updatePartner = async (companyId: string, partner: Partner): Promise<Company> => {
    const company = await getCompany(companyId);
    company.partners = (company.partners || []).map(p => p.id === partner.id ? partner : p);
    return await updateCompany(companyId, { partners: company.partners });
};

export const deletePartners = async (companyId: string, partnerIds: string[]): Promise<Company> => {
    const company = await getCompany(companyId);
    company.partners = (company.partners || []).filter(p => !partnerIds.includes(p.id));
    return await updateCompany(companyId, { partners: company.partners });
};

export const bulkUpdatePartners = async (companyId: string, partnerIds: string[], updates: Partial<Partner>): Promise<Company> => {
    const company = await getCompany(companyId);
    company.partners = (company.partners || []).map(p => partnerIds.includes(p.id) ? { ...p, ...updates } : p);
    return await updateCompany(companyId, { partners: company.partners });
};

export const addPartnerIdea = async (companyId: string, idea: PartnerIdea): Promise<Company> => {
    const company = await getCompany(companyId);
    company.ideas = [...(company.ideas || []), idea];
    return await updateCompany(companyId, { ideas: company.ideas });
};

export const addPartnerProposal = async (companyId: string, partnerId: string, proposal: ProspectProposal): Promise<Company> => {
    const company = await getCompany(companyId);
    if (companyId === partnerId) {
        company.savedGrowthPlans = [...(company.savedGrowthPlans || []), proposal];
        return await updateCompany(companyId, { savedGrowthPlans: company.savedGrowthPlans });
    } else {
        company.partners = (company.partners || []).map(p => {
            if (p.id === partnerId) return { ...p, savedProposals: [...(p.savedProposals || []), proposal] };
            return p;
        });
        return await updateCompany(companyId, { partners: company.partners });
    }
};

export const deletePartnerProposal = async (companyId: string, partnerId: string, proposalId: string): Promise<Company> => {
    const company = await getCompany(companyId);
    if (partnerId === 'any' || partnerId === companyId) {
        company.savedGrowthPlans = (company.savedGrowthPlans || []).filter(p => p.id !== proposalId);
        company.partners = (company.partners || []).map(p => ({
            ...p,
            savedProposals: (p.savedProposals || []).filter(pr => pr.id !== proposalId)
        }));
    } else {
        company.partners = (company.partners || []).map(p => {
            if (p.id === partnerId) return { ...p, savedProposals: (p.savedProposals || []).filter(pr => pr.id !== proposalId) };
            return p;
        });
    }
    return await updateCompany(companyId, { savedGrowthPlans: company.savedGrowthPlans, partners: company.partners });
};

export const updateEvent = async (token: string, companyId: string, eventId: string, updates: any, partnerId: string): Promise<Company> => {
    const company = await getCompany(companyId);
    company.events = (company.events || []).map(e => {
        if (e.id === eventId) {
            const postsByPartner = { ...(e.postsByPartner || {}) };
            postsByPartner[partnerId] = { ...(postsByPartner[partnerId] || { status: 'draft', posts: {} }), ...updates };
            const newEvent = { ...e, postsByPartner };
            if (updates.time) newEvent.time = updates.time;
            if (updates.date) newEvent.date = updates.date;
            if (updates.campaignId !== undefined) newEvent.campaignId = updates.campaignId;
            return newEvent;
        }
        return e;
    });
    return await updateCompany(companyId, { events: company.events });
};

export const addEvents = async (token: string, companyId: string, newEvents: CalendarEvent[]): Promise<Company> => {
    const company = await getCompany(companyId);
    company.events = [...(company.events || []), ...newEvents];
    return await updateCompany(companyId, { events: company.events });
};

export const generateMockProposal = async (companyId: string, partnerId: string): Promise<ProspectProposal> => {
    await ensureInitialized();
    const c = await getCompany(companyId);
    const isMaster = companyId === partnerId || partnerId === 'company-primary-root' || partnerId === c.id;
    let partnerObj = c.partners.find(p => p.id === partnerId);
    let prospectName = isMaster ? c.name : (partnerObj?.name || "Partner");
    let lang = isMaster ? (c.language || 'da') : (partnerObj?.language || 'da');

    if (isMaster) {
        return {
            id: `plan-${uuidv4().substring(0,8)}`,
            name: `MASTER VÆKSTSTRATEGI 2026: ${stripMarkdown(c.name)}`,
            prospectId: companyId,
            language: lang as any,
            prospectName: c.name,
            prospectWebsite: c.website,
            companyName: c.name,
            brandColors: { primary: '#29A39C', secondary: '#0B1D39' },
            introduction: { title: "Ledelsesresumé", executiveSummary: "Strategisk Retning: Fra Nicheproducent til Global Markedsleder" },
            platformOverview: { title: "Vækstmotor", items: [] },
            analysis: { title: "Forretningsanalyse", toneOfVoice: { description: "Faktabaseret rådgivning.", dos: [], donts: [] } },
            strategy: { pillars: [] },
            businessPairs: {kpis:[], swot:{strengths:[], weaknesses:[], opportunities:[], threats:[]}}, // Initialize businessPairs
            customSections: get21StepTemplate()
        };
    }

    const detailedSections = getPartnerPlanTemplate(lang as any, prospectName);
    
    return {
        id: `plan-${uuidv4().substring(0,8)}`,
        name: (lang === 'de' ? `STRATEGISCHE ZUSAMMENARBEIT: ` : `SAMARBEJDSPLAN: `) + stripMarkdown(prospectName),
        prospectId: partnerId,
        language: lang as any,
        prospectName: prospectName,
        prospectWebsite: partnerObj?.website || c.website,
        companyName: c.name,
        brandColors: { primary: '#29A39C', secondary: '#0B1D39' },
        introduction: { title: "Vision", executiveSummary: "Marketing-as-a-Service (MaaS) – jeres nye vækstmotor." },
        platformOverview: { title: "Strategie", items: [] },
        analysis: { title: "Analyse", toneOfVoice: { description: "Professional", dos: [], donts: [] } },
        strategy: { pillars: [] },
        businessPairs: {kpis:[], swot:{strengths:[], weaknesses:[], opportunities:[], threats:[]}}, // Initialize businessPairs
        customSections: detailedSections
    };
};
