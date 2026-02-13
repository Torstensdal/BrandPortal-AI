import React from 'react';
import { useLanguage } from '../context/LanguageContext';

export const Footer: React.FC = () => {
  const { t } = useLanguage();
  const currentYear = 2026;

  return (
    <footer className="w-full py-4 px-4 sm:px-6 lg:px-8 mt-auto flex-shrink-0">
      <div className="container mx-auto text-center">
        <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em]">
          BrandPortal-AI SaaS Platform © {currentYear}
        </p>
      </div>
    </footer>
  );
};
