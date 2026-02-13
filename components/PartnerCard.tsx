import React, { useState, useEffect } from 'react';
import { Partner } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { TrashIcon } from './icons/TrashIcon';
import { SyncIcon } from './icons/SyncIcon';
import { EditIcon } from './icons/EditIcon';
import { WebsiteIcon } from './icons/WebsiteIcon';
import { UsersIcon } from './icons/UsersIcon';
import { LinkedInIcon } from './icons/LinkedInIcon';
import { FacebookIcon } from './icons/FacebookIcon';
import { InstagramIcon } from './icons/InstagramIcon';
import { EmailLIcon } from './icons/Email';
import { LanguageIcon } from './icons/Language';
import { XIcon } from './icons/XIcon';
import { KeyIcon } from './icons/KeyIcon';
import { AiCreationIcon } from './icons/AiCreationIcon';
import { TikTokIcon } from './icons/TikTokIcon';
import { PartnerLogo } from './PartnerLogo';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { YouTubeIcon } from './icons/YouTube';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { LockOpenIcon } from './icons/LockOpenIcon';
import { EyeIcon } from './icons/EyeIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { DocumentPlusIcon } from './icons/DocumentPlusIcon';
import * as assetStorage from '../utils/assetStorage';
import { stripMarkdown, formatAiContent } from '../utils/formatters';


interface PartnerCardProps {
  partner: Partner;
  isSelected: boolean;
  onToggleSelect: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onRefresh: () => void;
  isAdmin: boolean;
  onSimulatePortal: () => void;
  onToggleLock?: (isLocked: boolean) => void;
}

const getStatusColorClasses = (status: Partner['status']): { border: string; bg: string; text: string; } => {
    switch (status) {
        case 'completed': return { border: 'border-brand-accent-green', bg: 'bg-brand-accent-green/20', text: 'text-brand-accent-green' };
        case 'processing': return { border: 'border-brand-primary', bg: 'bg-brand-primary/20', text: 'text-brand-primary' };
        case 'error': return { border: 'border-brand-accent-red', bg: 'bg-brand-accent-red/20', text: 'text-brand-accent-red' };
        case 'pending':
        default: return { border: 'border-brand-accent-amber', bg: 'bg-brand-accent-amber/20', text: 'text-brand-accent-amber' };
    }
};

const StatusIndicator: React.FC<{ status: Partner['status'] }> = ({ status }) => {
  const { t } = useLanguage();
  const { bg, text } = getStatusColorClasses(status);
  const baseClasses = "text-xs font-medium px-2.5 py-1 rounded-full";
  const isProcessing = status === 'processing';
  return <span className={`${baseClasses} ${bg} ${text} ${isProcessing ? 'animate-pulse' : ''}`}>{t(`status_${status}`)}</span>;
};

export const PartnerCard: React.FC<PartnerCardProps> = ({ partner, isSelected, onToggleSelect, onDelete, onEdit, onRefresh, isAdmin, onSimulatePortal, onToggleLock }) => {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  useEffect(() => {
    let currentUrl: string | null = null;
    if (partner.originalPlanPdfAssetId) {
        const assetId = partner.originalPlanPdfAssetId.replace('asset:', '');
        assetStorage.getAsset(assetId).then(file => {
            if (file) {
                currentUrl = URL.createObjectURL(file);
                setPdfUrl(currentUrl);
            }
        });
    }
    return () => { 
        if(currentUrl) URL.revokeObjectURL(currentUrl);
        setPdfUrl(null);
    };
  }, [partner.originalPlanPdfAssetId]);

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.tagName.toLowerCase() === 'input') {
      return;
    }
    setIsExpanded(!isExpanded);
  };

  const hasDetails = partner.status === 'completed';
  const { border: statusBorderClass } = getStatusColorClasses(partner.status);
  const websiteUrl = partner.website && !/^https?:\/\//i.test(partner.website) ? `https://${partner.website}` : partner.website;

 return (
    <div className={`rounded-xl transition-all duration-300 border-l-4 ${statusBorderClass} ${isSelected ? 'ring-2 ring-brand-primary bg-[var(--bg-card-hover)] shadow-lg' : 'bg-[var(--bg-card)] border-[var(--border-primary)] hover:border-brand-primary/50'} ${partner.isLocked ? 'opacity-70' : ''} shadow-md overflow-hidden`}>
      <div className={`p-4 ${hasDetails ? 'cursor-pointer' : ''}`} onClick={handleCardClick}>
        <div className="flex items-start gap-4">
          <input
            type="checkbox"
            className="h-5 w-5 rounded border-[var(--border-primary)] bg-[var(--bg-input)] text-brand-primary focus:ring-brand-primary mt-1 flex-shrink-0"
            checked={isSelected}
            onChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
          />
          <div className="flex-grow min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <PartnerLogo
                    logoUrl={partner.logoUrl}
                    partnerName={partner.name}
                    website={partner.website}
                    className="h-8 w-8 rounded-full border border-[var(--border-primary)]"
                    fallbackClassName="bg-[var(--bg-card-secondary)]"
                />
                <span className="font-bold text-[var(--text-primary)] truncate">{stripMarkdown(partner.name)}</span>
                {partner.isLocked && (
                    <span className="flex items-center gap-1 text-[10px] font-black uppercase text-brand-accent-amber bg-brand-accent-amber/10 px-2 py-0.5 rounded-full border border-brand-accent-amber/30 shrink-0">
                        <LockClosedIcon className="h-3 w-3" /> {t('status_locked')}
                    </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                 {partner.originalPlanPdfAssetId && (
                     <button 
                        onClick={(e) => { e.stopPropagation(); if(pdfUrl) window.open(pdfUrl, '_blank'); }} 
                        className="p-1.5 bg-brand-primary/10 text-brand-primary rounded-lg hover:bg-brand-primary hover:text-white transition-all"
                        title={t('doc_structure_see_pdf')}
                     >
                        <DocumentIcon className="h-4 w-4" />
                     </button>
                 )}
                 <button 
                    onClick={(e) => { e.stopPropagation(); onSimulatePortal(); }} 
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg bg-brand-primary text-white shadow-lg shadow-brand-primary/20 hover:brightness-110 hover:scale-105 transition-all"
                 >
                    <EyeIcon className="h-3.5 w-3.5" />
                    <span>Portal</span>
                 </button>
                 <StatusIndicator status={partner.status} />
                 
                {onToggleLock && isAdmin && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); onToggleLock(!partner.isLocked); }} 
                        className={`p-1.5 rounded-full ${partner.isLocked ? 'text-brand-accent-amber bg-brand-accent-amber/10' : 'text-[var(--text-muted)] hover:text-brand-primary hover:bg-[var(--bg-card-hover)]'}`}
                    >
                        {partner.isLocked ? <LockClosedIcon className="h-4 w-4" /> : <LockOpenIcon className="h-4 w-4" />}
                    </button>
                )}
                <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 text-[var(--text-muted)] hover:text-brand-primary hover:bg-[var(--bg-card-hover)] rounded-full" title={t('campaigns_edit_button')}><EditIcon className="h-4 w-4" /></button>
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    disabled={!isAdmin}
                    className="p-1.5 text-[var(--text-muted)] hover:text-brand-accent-red hover:bg-brand-accent-red/10 rounded-full disabled:opacity-50"
                    title={t('campaigns_delete_button')}
                >
                    <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expandable Details Section */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${isExpanded && hasDetails ? 'max-h-[1000px]' : 'max-h-0'}`}>
          <div className="border-t border-[var(--border-primary)] mx-4 opacity-50" />
          <div className="px-4 pb-4 pt-3">
              <div className="pl-10 space-y-4">
                  
                  {partner.description && (
                      <div 
                        className="text-sm text-[var(--text-secondary)] leading-relaxed ai-safe-html-description max-w-3xl" 
                        dangerouslySetInnerHTML={{ __html: formatAiContent(partner.description) }} 
                      />
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                      <div className="md:col-span-3 space-y-4">
                          {partner.brandVoice && (
                              <div>
                                  <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-1.5 mb-2">
                                      <AiCreationIcon className="h-4 w-4" /> {t('companyDetails_brandVoice_title')}
                                  </h4>
                                  <div className="space-y-3 text-sm p-5 bg-[var(--bg-card-secondary)] rounded-2xl border border-[var(--border-primary)] shadow-inner">
                                    {partner.brandVoice.toneOfVoice && (
                                        <p><strong className="text-[var(--text-primary)] font-bold">{t('editPartnerModal_toneOfVoiceLabel')}:</strong> <span className="text-[var(--text-secondary)]">{stripMarkdown(partner.brandVoice.toneOfVoice)}</span></p>
                                    )}
                                  </div>
                              </div>
                          )}
                          {(partner.website || (partner.socials && Object.values(partner.socials).some(s => s))) && (
                              <div>
                                  <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">{t('partner_online_section')}</h4>
                                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                                      {websiteUrl && <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-brand-primary transition-colors" title={t('partnerInfo_website')}><WebsiteIcon className="h-5 w-5"/></a>}
                                      {partner.socials?.linkedin && <a href={partner.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-brand-primary transition-colors" title={t('platform_linkedin')}><LinkedInIcon className="h-5 w-5"/></a>}
                                      {partner.socials?.instagram && <a href={partner.socials.instagram} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-brand-primary transition-colors" title={t('platform_instagram')}><InstagramIcon className="h-5 w-5"/></a>}
                                  </div>
                              </div>
                          )}
                      </div>
                      <div className="md:col-span-2">
                          <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] flex items-center gap-1.5 mb-2">
                            <UsersIcon className="h-4 w-4" /> {t('partner_keyContacts')}
                          </h4>
                          <ul className="space-y-3">
                            {(partner.contacts && partner.contacts.length > 0) ? partner.contacts.slice(0, 2).map(contact => (
                                <li key={contact.id} className="p-4 bg-[var(--bg-card-secondary)] rounded-2xl border border-[var(--border-primary)] shadow-inner">
                                    <div className="flex justify-between items-center">
                                      <p className="font-bold text-[var(--text-primary)] text-sm">{stripMarkdown(contact.name)}</p>
                                      {contact.hasAccess && <span className="flex items-center gap-1 text-[9px] font-black uppercase text-brand-accent-teal bg-brand-accent-teal/10 px-2 py-0.5 rounded-full border border-brand-accent-teal/30 shrink-0">
                                          <KeyIcon className="h-2.5 w-2.5"/> {t('partner_accessGranted')}
                                      </span>}
                                    </div>
                                    <p className="text-[var(--text-muted)] text-xs mt-0.5">{stripMarkdown(contact.role)}</p>
                                </li>
                            )) : <p className="text-xs text-[var(--text-muted)]">{t('partnerInfo_noContacts')}</p>}
                          </ul>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};
