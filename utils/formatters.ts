export const stripHtml = (h: string) => h?.replace(/<[^>]*>?/gm, '') || '';
export const stripMarkdown = (t: string) => t?.replace(/[#*_~]/g, '') || '';
export const formatAiContent = (t: string) => t;
export const addMarkdownFormatting = (t: string) => t;