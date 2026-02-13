import React, { useState } from 'react';
import { Partner } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { InformationCircleIcon } from './icons/InformationCircleIcon';
import { UsersIcon } from './icons/UsersIcon';
import { WebsiteIcon } from './icons/WebsiteIcon';
import { AiCreationIcon } from './icons/AiCreationIcon';
import { LinkedInIcon } from './icons/LinkedInIcon';
import { FacebookIcon } from './icons/FacebookIcon';
import { InstagramIcon } from './icons/InstagramIcon';
import { EmailIcon } from './icons/EmailIcon';
import { KeyIcon } from './icons/KeyIcon';
import { stripMarkdown, formatAiContent } from '../utils/formatters';

type Tab = 'about' | 'contacts';

export const PartnerInfo: React.FC<{ partner: Partner }> = ({ partner }) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<Tab>('about');

    // Tjek om vi ser på virksomheden selv eller en partner
    const isSelf = partner.id === '__company__';
    const prefix = isSelf ? 'companyInfo' : 'partnerInfo';

    const tabs: { id: Tab, labelKey: string, icon: React.FC<any> }[] = [
        { id: 'about', labelKey: `${prefix}_about`, icon: InformationCircleIcon },
        { id: 'contacts', labelKey: `${prefix}_contacts`, icon: UsersIcon },
    ];

    const tabButtonClasses = (tabId: Tab) => `
        flex items-center gap-2 whitespace-nowrap py-3 px-1 border-b-2 font-black uppercase text-[10px] tracking-widest transition-all
        ${activeTab === tabId
            ? 'border-brand-primary text-brand-primary'
            : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
        }
    `;
    
    const websiteUrl = partner.website && !/^https?:\/\//i.test(partner.website) ? `https://${partner.website}` : partner.website;

    return (
        <div className="border border-[var(--border-primary)]/80 bg-[var(--bg-card)]/40 rounded-3xl overflow-hidden shadow-inner theme-transition">
            <div className="px-6 border-b border-[var(--border-primary)] bg-[var(--bg-card-secondary)]/30">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={tabButtonClasses(tab.id)}
                        >
                            <tab.icon className="h-4 w-4" />
                            {t(tab.labelKey)}
                        </button>
                    ))}
                </nav>
            </div>
            <div className="p-6 text-sm max-h-[300px] overflow-y-auto no-scrollbar">
                {activeTab === 'about' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        {partner.description ? (
                            <div 
                                className="text-[var(--text-secondary)] leading-relaxed ai-safe-html-description text-sm" 
                                dangerouslySetInnerHTML={{ __html: formatAiContent(partner.description) }} 
                            />
                        ) : (
                            <p className="text-[var(--text-muted)] italic font-medium">{t(`${prefix}_noDescription`)}</p>
                        )}
                        
                        {partner.brandVoice?.toneOfVoice && (
                            <div className="flex items-start gap-3 text-[var(--text-secondary)] border-t border-[var(--border-primary)] pt-4 mt-4">
                                <AiCreationIcon className="h-4 w-4 text-brand-primary mt-0.5 flex-shrink-0"/>
                                <div>
                                    <strong className="text-[var(--text-primary)] text-[10px] font-black uppercase tracking-widest">{t('editPartnerModal_toneOfVoiceLabel')}:</strong>
                                    <p className="mt-1 text-[var(--text-secondary)] italic">"{stripMarkdown(partner.brandVoice.toneOfVoice)}"</p>
                                </div>
                            </div>
                        )}
                        <div className="flex items-center gap-4 pt-4 border-t border-[var(--border-primary)] flex-wrap">
                            {websiteUrl && <a href={websiteUrl} target="_blank" rel="noopener noreferrer" title={partner.website} className="flex items-center gap-1.5 text-brand-primary hover:underline font-bold text-xs"><WebsiteIcon className="h-4 w-4" /> {t(`${prefix}_website`)}</a>}
                            <div className="flex gap-3">
                                {partner.socials?.linkedin && <a href={partner.socials.linkedin} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-brand-primary transition-colors" title={t('platform_linkedin')}><LinkedInIcon className="h-5 w-5" /></a>}
                                {partner.socials?.facebook && <a href={partner.socials.facebook} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-brand-primary transition-colors" title={t('platform_facebook')}><FacebookIcon className="h-5 w-5" /></a>}
                                {partner.socials?.instagram && <a href={partner.socials.instagram} target="_blank" rel="noopener noreferrer" className="text-[var(--text-muted)] hover:text-brand-primary transition-colors" title={t('platform_instagram')}><InstagramIcon className="h-5 w-5" /></a>}
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'contacts' && (
                    <ul className="space-y-3 animate-in fade-in duration-300">
                        {(partner.contacts && partner.contacts.length > 0) ? partner.contacts.map(contact => (
                            <li key={contact.id} className="p-4 bg-[var(--bg-input)]/50 rounded-2xl border border-[var(--border-primary)] group">
                                <div className="flex justify-between items-center mb-1">
                                    <p className="font-black text-[var(--text-primary)] uppercase tracking-tight text-xs">{stripMarkdown(contact.name)}</p>
                                    {contact.hasAccess && <span className="flex items-center gap-1 text-[8px] font-black uppercase text-brand-accent-teal bg-brand-accent-teal/10 px-2 py-0.5 rounded-full border border-brand-accent-teal/30"><KeyIcon className="h-2.5 w-2.5"/> {t('partner_accessGranted')}</span>}
                                </div>
                                <p className="text-[var(--text-muted)] text-[10px] font-bold uppercase tracking-widest">{stripMarkdown(contact.role)}</p>
                                <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[var(--border-primary)]/50">
                                    {contact.email && <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-[var(--text-tertiary)] hover:text-brand-primary text-[10px] font-black uppercase tracking-widest transition-colors" title={contact.email}><EmailIcon className="h-3 w-3" /> Email</a>}
                                    {contact.linkedin && <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[var(--text-tertiary)] hover:text-brand-primary text-[10px] font-black uppercase tracking-widest transition-colors" title="LinkedIn Profile"><LinkedInIcon className="h-3 w-3" /> LinkedIn</a>}
                                </div>
                            </li>
                        )) : <p className="text-[var(--text-muted)] text-center text-[10px] font-black uppercase tracking-[0.2em] py-8 border-2 border-dashed border-[var(--border-primary)] rounded-2xl">{t(`${prefix}_noContacts`)}</p>}
                    </ul>
                )}
            </div>
        </div>
    );
};