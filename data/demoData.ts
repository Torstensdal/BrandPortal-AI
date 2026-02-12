import { Company, ProspectProposal, Language, Lead, DripCampaign } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { stripMarkdown } from '../utils/formatters';

export const get21StepTemplate = () => [
    {
        id: "step-1",
        title: "01. Virksomhedsoverblik",
        body: `Beskriv her jeres vision og mission. Dette afsnit skal give læseren en hurtig forståelse for, hvem I er som virksomhed, og hvilken værdi I skaber i markedet.`
    },
    {
        id: "step-2",
        title: "02. Værditilbud",
        body: `Hvad er det unikke ved jeres løsning? Beskriv hvordan I adskiller jer fra konkurrenterne, og hvorfor kunderne bør vælge netop jer.`
    },
    {
        id: "step-kpi",
        title: "03. Målbare Succeskriterier",
        body: `### Ambitioner for vækst
Her defineres de primære mål for det kommende år.
**Nuværende status:** Startpunkt
**Målsætning:** Ønsket resultat

### Markedsposition
Hvordan ønsker I at blive opfattet af kunderne?
**Fokus:** Brancher og segmenter.`
    },
    {
        id: "step-plan",
        title: "04. Eksekveringsplan",
        body: `### De første 30 dage
1. Etablering af den fælles forståelsesramme.
2. Identifikation af de første indsatsområder.

### De første 90 dage
1. Udrulning af markedsføringsinitiativer.
2. Evaluering af den indledende indsats.`
    },
    {
        id: "step-swot",
        title: "05. Styrker & Muligheder",
        body: `**Styrker:** Hvad er jeres fundamentale fordele?
**Svagheder:** Hvor er der plads til forbedring?
**Muligheder:** Hvilke tendenser i markedet kan I udnytte?
**Udfordringer:** Hvad skal I være opmærksomme på udefra?`
    }
].map(s => ({
    id: s.id,
    title: stripMarkdown(s.title),
    body: s.body
}));

export const getPartnerPlanTemplate = (lang: Language, partnerName: string) => {
    const isDa = lang === 'da';
    const isDe = lang === 'de';
    return [
        { id: "p1", title: isDa ? "Fælles Vision" : isDe ? "Gemeinsame Vision" : "Shared Vision", body: "" },
        { id: "p2", title: isDa ? "Målsætninger for samarbejdet" : isDe ? "Zusammenarbeitsziele" : "Collaboration Goals", body: "" },
        { id: "p3", title: isDa ? "Indholdsplan" : isDe ? "Inhaltsplan" : "Content Plan", body: "" },
        { id: "p4", title: isDa ? "Næste skridt" : isDe ? "Nächste Schritte" : "Next Steps", body: "" }
    ].map(s => ({ id: s.id, title: stripMarkdown(s.title), body: s.body }));
};

export const MASTER_GROWTH_PLAN: ProspectProposal = {
    id: 'master-plan-core',
    name: "STRATEGISK VÆKSTPLAN",
    prospectId: 'company-primary-root',
    language: 'da',
    prospectName: "Eksempel Virksomhed",
    prospectWebsite: "eksempel.dk",
    companyName: "BrandPortal-AI",
    brandColors: { primary: '#6366f1', secondary: '#0f172a' },
    introduction: { title: "Resumé", executiveSummary: "Denne plan beskriver vejen mod vækst gennem strategiske partnerskaber og målrettet kommunikation." },
    platformOverview: { title: "Vækstmotor", items: [] },
    analysis: { title: "Situationsanalyse", toneOfVoice: { description: "Professionel og tillidsskabende.", dos: [], donts: [] } },
    strategy: { pillars: [] },
    customSections: get21StepTemplate()
};

export const demoCompany: Company = {
    id: 'company-primary-root',
    name: "BrandPortal-AI",
    website: "brandportal-ai.com",
    language: 'da',
    description: `BrandPortal-AI hjælper virksomheder med at optimere deres vækst gennem intelligente strategier og automatiseret brand-styring.`,
    industry: "Rådgivning & Software",
    targetAudience: `Mellemstore B2B virksomheder.`,
    valueProposition: `Vi gør komplekse vækstprocesser enkle.`,
    brandVoice: {
        toneOfVoice: "Professionel og hjælpsom.",
        dos: ["Vær klar", "Tal om resultater"],
        donts: ["Brug ikke kodesprog"],
        examples: `Eksempel: "Vi gør jeres hverdag lettere."`
    },
    partners: [],
    leads: [],
    dripCampaigns: [],
    activeDripCampaigns: [],
    savedGrowthPlans: [MASTER_GROWTH_PLAN],
    growthPlan: MASTER_GROWTH_PLAN,
    mediaLibrary: [],
    brandKit: { primaryColor: '#6366f1', secondaryColor: '#0f172a', typography: 'Inter', brandStory: "Vi tror på vækst som en katalysator for menneskelig udvikling." }
};