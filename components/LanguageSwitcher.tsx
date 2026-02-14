import React from 'react';
import { useLanguage } from '../context/LanguageContext';

type Language = 'en' | 'da' | 'de';

export const LanguageSwitcher: React.FC = () => {
    const { language, setLanguage } = useLanguage();

    const handleLanguageChange = (lang: Language) => {
        setLanguage(lang);
    };

    return (
        <div className="flex items-center space-x-2">
            <button
                onClick={() => handleLanguageChange('en')}
                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${language === 'en' ? 'bg-[var(--brand-primary)] text-white shadow-sm' : 'bg-[var(--bg-button-secondary)] text-[var(--text-tertiary)] hover:bg-[var(--bg-button-secondary-hover)]'}`}
                aria-pressed={language === 'en'}
            >
                EN
            </button>
            <button
                onClick={() => handleLanguageChange('da')}
                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${language === 'da' ? 'bg-[var(--brand-primary)] text-white shadow-sm' : 'bg-[var(--bg-button-secondary)] text-[var(--text-tertiary)] hover:bg-[var(--bg-button-secondary-hover)]'}`}
                aria-pressed={language === 'da'}
            >
                DA
            </button>
            <button
                onClick={() => handleLanguageChange('de')}
                className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${language === 'de' ? 'bg-[var(--brand-primary)] text-white shadow-sm' : 'bg-[var(--bg-button-secondary)] text-[var(--text-tertiary)] hover:bg-[var(--bg-button-secondary-hover)]'}`}
                aria-pressed={language === 'de'}
            >
                DE
            </button>
        </div>
    );
};
