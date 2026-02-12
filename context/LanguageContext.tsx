import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { translations } from '../utils/translations';
import { Language } from '../types';

export type { Language };

interface LanguageContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const getSafeStorage = (key: string, fallback: string): string => {
  try {
    const item = localStorage.getItem(key);
    return item ?? fallback;
  } catch (e) {
    console.warn(`LocalStorage read failed for key: ${key}. Using fallback.`);
    return fallback;
  }
};

const setSafeStorage = (key: string, value: string): void => {
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`LocalStorage write failed for key: ${key}.`);
  }
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = getSafeStorage('app_language', 'da');
    return (saved as Language) || 'da';
  });

  const updateLanguage = (newLang: Language) => {
    setLanguage(newLang);
    setSafeStorage('app_language', newLang);
  };

  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
    if (!key) return '';

    const cleanKey = key.trim();
    const langCode = (language.split('-')[0] as Language) || 'da';
    
    const langDict = translations[langCode] || translations['da'];
    let translation = langDict[cleanKey];

    if (!translation && langCode !== 'da') {
      translation = translations['da'][cleanKey];
    }

    if (!translation) {
      return cleanKey.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()).trim();
    }

    if (replacements) {
      Object.keys(replacements).forEach(placeholder => {
        const value = String(replacements[placeholder]);
        translation = translation!.split(`{${placeholder}}`).join(value);
      });
    }

    return translation!;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: updateLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
