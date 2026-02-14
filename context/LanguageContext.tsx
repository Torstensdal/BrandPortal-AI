import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { translations } from '../utils/translations';
import { Language } from '../types';

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('da');
  const t = useCallback((key: string, replacements?: any) => {
    const langDict = translations[language] || translations['da'];
    let translation = langDict[key] || key;
    if (replacements) {
      Object.keys(replacements).forEach(k => translation = translation.replace(`{${k}}`, replacements[k]));
    }
    return translation;
  }, [language]);

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};