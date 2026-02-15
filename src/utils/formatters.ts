export const stripHtml = (h: string) => h.replace(/<[^>]*>?/gm, '');
export const stripMarkdown = (m: string) => m.replace(/[#*^~_]/g, '').trim();