import React, { createContext, useContext, useState } from 'react';
const LanguageContext = createContext<any>(null);
export const LanguageProvider = ({ children }: any) => {
    const [language, setLanguage] = useState('da');
    const t = (key: string) => key;
    return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>;
};
export const useLanguage = () => useContext(LanguageContext);