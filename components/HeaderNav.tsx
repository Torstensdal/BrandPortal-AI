import React, { useState, useRef, useEffect } from 'react';
import { User, Company, TeamMemberRole, Theme } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserCircleIcon } from './icons/UserCircleIcon';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { PartnerLogo } from './PartnerLogo';
import { SyncIcon } from './icons/SyncIcon';
import { DownloadIcon } from './icons/DownloadIcon';
import { UploadIcon } from './icons/UploadIcon';
import { CodeBracketIcon } from './icons/CodeBracketIcon';

export const HeaderNav = ({ user, company, onLogout, onExportSourceCode, theme, toggleTheme }: any) => {
  const { t } = useLanguage();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  return (
    <header className="bg-white border-b p-4 flex justify-between items-center z-50">
      <div className="flex items-center gap-3">
        <PartnerLogo website={company.website} partnerName={company.name} className="h-8 w-8 rounded-md" />
        <span className="font-bold text-slate-800">{company.name}</span>
      </div>
      <div className="flex items-center gap-4">
        <LanguageSwitcher />
        <div className="relative" ref={menuRef}>
          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <UserCircleIcon className="h-7 w-7 rounded-full text-slate-400" />
            <span className="hidden sm:inline">{user?.email}</span>
            <ChevronDownIcon className="h-4 w-4" />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-2xl overflow-hidden">
               <button onClick={onExportSourceCode} className="w-full text-left px-4 py-3 text-sm font-bold text-indigo-600 hover:bg-indigo-50 flex items-center gap-3">
                  <CodeBracketIcon className="h-4 w-4" />
                  Download Kildekode
               </button>
               <button onClick={onLogout} className="w-full text-left px-4 py-3 text-sm font-bold text-red-600 hover:bg-red-50 border-t">Log ud</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};