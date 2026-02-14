import React, { useState, useRef, useEffect } from 'react';
import { Partner } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { ChevronDownIcon } from './icons/ChevronDownIcon';
import { PartnerLogo } from './PartnerLogo';

interface PartnerSelectorProps {
  partners: Partner[];
  activePartner: Partner;
  onSelectPartner: (partnerId: string) => void;
}

const PartnerOption: React.FC<{ partner: Partner; onSelect: () => void }> = ({ partner, onSelect }) => {
  return (
    <button
      onClick={onSelect}
      className="w-full text-left flex items-center gap-3 p-2 rounded-md hover:bg-[var(--bg-card-hover)] transition-colors"
    >
      <PartnerLogo
        logoUrl={partner.logoUrl}
        partnerName={partner.name}
        website={partner.website}
        className="h-6 w-6 rounded-full"
        fallbackClassName="bg-[var(--text-light-muted)]"
      />
      <span className="text-sm font-medium text-[var(--text-secondary)] truncate">{partner.name}</span>
    </button>
  );
};

export const PartnerSelector: React.FC<PartnerSelectorProps> = ({ partners, activePartner, onSelectPartner }) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-56" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 rounded-md px-3 py-2 transition-colors bg-[var(--bg-button-secondary)]/50 text-[var(--text-secondary)] hover:bg-[var(--bg-button-secondary)]"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <PartnerLogo
            logoUrl={activePartner?.logoUrl}
            partnerName={activePartner.name}
            website={activePartner.website}
            className="h-6 w-6 rounded-full"
            fallbackClassName="bg-[var(--text-light-muted)]"
          />
          <span className="font-semibold text-sm truncate">{activePartner.name}</span>
        </div>
        <ChevronDownIcon className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-full origin-top-right rounded-md bg-[var(--bg-card-hover)] shadow-lg ring-1 ring-black ring-opacity-5 z-20 border border-[var(--border-primary)] p-2">
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {partners.map(partner => (
              <PartnerOption
                key={partner.id}
                partner={partner}
                onSelect={() => {
                  onSelectPartner(partner.id);
                  setIsOpen(false);
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
