
export const getDomainFromUrl = (url: string): string | null => {
  if (!url) return null;
  try {
    let cleanUrl = url.trim();
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }
    const urlObj = new URL(cleanUrl);
    return urlObj.hostname.replace(/^www\./, '');
  } catch (error) {
    console.warn('Could not parse domain from URL:', error);
    return url.replace(/https?:\/\//i, '').split('/')[0].replace(/^www\./, '').split(':')[0];
  }
};

export const getCleanAppUrl = (): string => {
  try {
    const protocol = window.location.protocol;
    const host = window.location.host;
    const origin = protocol + '//' + host;
    return origin;
  } catch (e) {
    return 'https://' + window.location.host;
  }
};

export const generateLogoUrl = (website: string): string | undefined => {
  const domain = getDomainFromUrl(website);
  return domain ? 'https://logo.clearbit.com/' + domain : undefined;
};