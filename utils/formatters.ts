
/**
 * Fjerner alle HTML tags og dekoder entities. 
 */
export const stripHtml = (html: string | undefined | null): string => {
    if (!html) return '';
    let clean = html.replace(/<[^>]*>?/gm, '');
    const doc = new DOMParser().parseFromString(clean, 'text/html');
    return doc.body.textContent || clean;
};

/**
 * Konverterer tekst fra BLOKBOGSTAVER til normal dansk retskrivning.
 * Håndterer danske specialkarakterer korrekt.
 */
const toSentenceCase = (text: string): string => {
    if (!text) return '';
    
    // Tjek om teksten primært er store bogstaver
    const uppercaseCount = (text.match(/[A-ZÆØÅ]/g) || []).length;
    const totalChars = (text.match(/[a-zA-ZæøåÆØÅ]/g) || []).length;
    
    if (totalChars > 0 && uppercaseCount / totalChars > 0.6) {
        // Konverter hele molevitten til lowercase og fix så starte på sætninger
        return text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (match) => match.toUpperCase());
    }
    return text;
};

/**
 * Professionel tekstredigering:
 * Renser for tegn, fixer struktur og indsprøjter overskrifter.
 */
export const addMarkdownFormatting = (text: string): string => {
    if (!text) return '';
    
    // 1. Grundlæggende rensning
    let clean = stripHtml(text).trim();
    
    // Fjern alle markdown-tegn (##, **, __ osv.) for at starte fra "clean sheet"
    clean = clean.replace(/[#*_~`]/g, '');
    
    // Fjern punktummer der står alene eller før overskriftsagtige linjer
    clean = clean.replace(/^\s*\.\s*/gm, '');
    
    // Fix dobbelte mellemrum
    clean = clean.replace(/ {2,}/g, ' ');

    // 2. Sentence Case konvertering
    clean = toSentenceCase(clean);
    
    // 3. Opdeling i sætninger for strukturering
    const sentences = clean.split(/([.!?]\s+)/).filter(Boolean);
    if (sentences.length < 3) return clean;

    let formatted: string[] = [];
    const headers = [
        "Strategisk Fundament",
        "Kerneydelser & Kompetencer",
        "Markedspositionering",
        "Vision & Målsætning"
    ];
    
    let headerIdx = 0;
    let sentenceGroup: string[] = [];
    
    for (let i = 0; i < sentences.length; i++) {
        sentenceGroup.push(sentences[i]);
        
        // Når vi har ca 3-4 sætninger, laver vi en sektion
        if (sentences[i].match(/[.!?]\s*$/) && (sentenceGroup.length >= 4 || i === sentences.length - 1)) {
            if (headerIdx < headers.length) {
                formatted.push(`## ${headers[headerIdx]}`);
                headerIdx++;
            }
            formatted.push(sentenceGroup.join('').trim());
            sentenceGroup = [];
        }
    }
    
    return formatted.join('\n\n').trim();
};

/**
 * Omdanner renset tekst/markdown til præsentabel HTML.
 */
export const formatAiContent = (text: string | undefined | null): string => {
    if (!text) return '';
    
    let processed = text.trim();

    // Overskrifter - helt rene uden symboler
    processed = processed.replace(/^##\s+(.*$)/gim, '<h2 class="text-xl font-bold mt-10 mb-4 text-[#0B1D39] border-b border-slate-100 pb-3">$1</h2>');
    processed = processed.replace(/^###\s+(.*$)/gim, '<h3 class="text-base font-bold mt-6 mb-2 text-brand-primary uppercase tracking-widest">$1</h3>');
    
    // Lister
    processed = processed.replace(/^\s*[-*+•]\s+(.*)$/gim, '<div class="flex items-start gap-3 mb-2 pl-2"><div class="h-1.5 w-1.5 rounded-full bg-brand-primary mt-2 shrink-0"></div><span class="text-slate-600 text-sm">$1</span></div>');
    
    // Brødtekst (Afsnit)
    const blocks = processed.split(/\n\n+/);
    return blocks.map(block => {
        const t = block.trim();
        if (!t) return '';
        if (t.startsWith('<h') || t.startsWith('<div')) return t;
        return `<p class="mb-6 text-base leading-relaxed text-slate-700">${t}</p>`;
    }).filter(p => p).join('\n');
};

/**
 * Fjerner Markdown-støj og HTML-tags, men bevarer indholdet som ren tekst.
 */
export const stripMarkdown = (text: string | undefined | null): string => {
    if (!text) return '';
    let clean = stripHtml(text);
    return clean.replace(/[#*^~`_]/g, '').trim(); 
};

/**
 * CRYPTO LAYER: Forsegler data med Master Key.
 */
export const sealData = (data: string, key: string): string => {
    if (!key) return data;
    const b64 = btoa(unescape(encodeURIComponent(data)));
    return b64.split('').map((char, i) => 
        String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
    ).join('');
};

export const unsealData = (sealed: string, key: string): string | null => {
    if (!key) return sealed;
    try {
        const unxor = sealed.split('').map((char, i) => 
            String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length))
        ).join('');
        return decodeURIComponent(escape(atob(unxor)));
    } catch (e) {
        return null;
    }
};

/**
 * GLOBAL VASKEMASKINE
 */
export const deepSanitize = (obj: any, keyName: string = ''): any => {
    if (obj === null || obj === undefined) return obj;
    const k = keyName.toLowerCase();

    const isTechnicalOrAssetRef = 
        k.includes('id') || k.includes('url') || k.includes('uri') || k.includes('website') || 
        k.includes('email') || k.includes('filename') || k.includes('asset') || 
        k.includes('sealkey') || k.includes('issealed') || 
        (typeof obj === 'string' && obj.startsWith('asset:'));

    const isMarkdownRichContent = [
        'contentstrategy', 'description', 'summary', 'brandstory', 'valueproposition', 
        'goals', 'body', 'examples', 'executivesummary', 'personastrategy', 'text' 
    ].some(field => k.includes(field));

    if (typeof obj === 'string') {
        if (isTechnicalOrAssetRef) {
            return obj;
        }
        
        if (isMarkdownRichContent) {
            return obj; 
        }
        
        return stripMarkdown(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(item => deepSanitize(item, keyName));
    }
    
    if (typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
            sanitized[key] = deepSanitize(obj[key], key);
        }
        return sanitized;
    }

    return obj;
};
