
import React, { useState, useEffect, useMemo } from 'react';
import { User, Company, Partner, AppCalendarEvent, PortalTab, SuccessStory, Lead } from '../types';
import { useLanguage } from '../context/LanguageContext';
import * as apiClient from '../services/apiClient';
import { Calendar } from './Calendar';
import { CalendarIcon } from './icons/CalendarIcon';
import { LightBulbIcon } from './icons/LightBulbIcon';
import { IdeaBoxScreen } from './IdeaBoxScreen';
import { InboxIcon } from './icons/InboxIcon';
import { MegaphoneIcon } from './icons/MegaphoneIcon';
import { TrophyIcon } from './icons/TrophyIcon';
import { SyncIcon } from './icons/SyncIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { stripMarkdown, formatAiContent } from '../utils/formatters';
import { DocumentIcon } from './icons/DocumentIcon';
import { ArrowTopRightOnSquareIcon } from './icons/ArrowTopRightOnSquareIcon';
import * as assetStorage from '../utils/assetStorage';

interface PartnerPortalScreenProps {
  user: User;
  token: string;
  company?: Company;
  onCompanyDataUpdate: (company: Company) => void;
  onLeadSubmit: (leadData: Omit<Lead, 'id' | 'status' | 'score' | 'activity'>) => Promise<void>;
  onSubmitSuccessStory: (storyData: Omit<SuccessStory, 'id' | 'status' | 'submittedAt'>) => Promise<void>;
  isSimulation?: boolean;
  onExitSimulation?: () => void;
}

const PartnerSuccessScreen: React.FC<{ partner: Partner, onSubmit: (s: any) => Promise<void> }> = ({ partner, onSubmit }) => {
    const { t } = useLanguage();
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSumbit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await onSubmit({ projectName: name, description: desc });
            setName(''); setDesc('');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto animate-in fade-in duration-700">
            <div className="bg-[var(--bg-card)] border border-[var(--border-dark)] p-10 rounded-[3rem] shadow-2xl">
                <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-2">Del en succes</h3>
                <p className="text-sm text-[var(--text-secondary)] mb-8 opacity-70">Har vi opnået noget stort sammen? Del din historie her, så vi kan fejre resultaterne.</p>
                <form onSubmit={handleSumbit} className="space-y-6">
                    <div>
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1 ml-1">Projekt Navn</label>
                        <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-[var(--bg-input)] border border-[var(--border-dark)] rounded-2xl p-4 font-bold" placeholder="F.eks. Sommer-kampagne 2026" required />
                    </div>
                    <div>
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1 ml-1">Beskrivelse & Resultat</label>
                        <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={4} className="w-full bg-[var(--bg-input)] border border-[var(--border-dark)] rounded-2xl p-4" placeholder="Hvad skete der? Hvor mange leads fik vi?" required />
                    </div>
                    <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-brand-primary text-white font-black uppercase tracking-widest rounded-2xl hover:brightness-110 shadow-xl transition-all flex items-center justify-center gap-3">
                        {isSubmitting ? <SyncIcon className="h-5 w-5 animate-spin" /> : <TrophyIcon className="h-5 w-5" />}
                        Indsend til godkendelse
                    </button>
                </form>
            </div>
            
            <div className="space-y-6">
                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Tidligere historier</h3>
                <div className="space-y-4">
                    {(partner.successStories || []).map(s => (
                        <div key={s.id} className="p-6 bg-[var(--bg-card)] border border-[var(--border-dark)] rounded-[2rem] shadow-lg relative group">
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-bold text-brand-primary">{s.projectName}</h4>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${s.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>{s.status}</span>
                            </div>
                            <p className="text-sm text-[var(--text-secondary)] italic leading-relaxed">"{s.description}"</p>
                        </div>
                    ))}
                    {(partner.successStories || []).length === 0 && <p className="text-center py-20 text-[var(--text-muted)] font-bold opacity-40">Ingen historier indsendt endnu.</p>}
                </div>
            </div>
        </div>
    );
};

const PartnerLeadsScreen: React.FC<{ leads: Lead[] }> = ({ leads }) => {
    const { t } = useLanguage();
    if (leads.length === 0) {
        return <div className="text-center py-20 border-2 border-dashed border-[var(--border-dark)] rounded-3xl"><p className="text-[var(--text-muted)] font-bold uppercase tracking-widest">{t('leads_noLeads')}</p></div>;
    }
    return (
        <div className="overflow-hidden bg-[var(--bg-card)] border border-[var(--border-dark)] rounded-2xl shadow-xl animate-in fade-in duration-700">
            <table className="min-w-full divide-y divide-[var(--border-dark)]">
                <thead className="bg-[var(--bg-card-hover)]/50">
                    <tr>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Lead</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Status</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Score</th>
                        <th scope="col" className="px-6 py-4 text-left text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Dato</th>
                    </tr>
                </thead>
                 <tbody className="divide-y divide-[var(--border-dark)]">
                    {leads.map(lead => (
                        <tr key={lead.id} className="hover:bg-[var(--bg-card-hover)]/30 transition-colors">
                            <td className="whitespace-nowrap px-6 py-5 text-sm">
                                <div className="font-bold text-[var(--text-secondary)]">{stripMarkdown(lead.name)}</div>
                                <div className="text-[var(--text-muted)] text-xs">{lead.email}</div>
                            </td>
                            <td className="whitespace-nowrap px-6 py-5 text-sm">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[var(--bg-card-hover)] text-[var(--text-secondary)] border border-[var(--border-primary)]">
                                    {lead.status}
                                </span>
                            </td>
                            <td className="whitespace-nowrap px-6 py-5 text-sm font-black text-brand-primary">{lead.score}</td>
                            <td className="whitespace-nowrap px-6 py-5 text-sm text-[var(--text-muted)] font-medium">{new Date(lead.submittedAt).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const PartnerGuidelinesScreen: React.FC<{ company: Company }> = ({ company }) => {
    const { t } = useLanguage();
    return (
        <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
            <div className="bg-[var(--bg-card)] border border-[var(--border-dark)] rounded-[2.5rem] p-10 shadow-2xl">
                <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tighter mb-6 flex items-center gap-3">
                    <SparklesIcon className="h-7 w-7 text-brand-primary" />
                    {t('partnerPortal_guidelines_toneOfVoice')}
                </h3>
                <p className="text-lg text-[var(--text-secondary)] leading-relaxed italic mb-10">"{stripMarkdown(company.brandVoice?.toneOfVoice || "Professionel og tillidsskabende.")}"</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-brand-accent-green/10 border border-brand-accent-green/20 rounded-3xl p-6">
                        <h4 className="text-xs font-black text-brand-accent-green uppercase tracking-widest mb-4 flex items-center gap-2">
                            <CheckCircleIcon className="h-4 w-4" /> {t('partnerPortal_guidelines_dos')}
                        </h4>
                        <ul className="space-y-3">
                            {(company.brandVoice?.dos || []).map((doItem, i) => (
                                <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                                    <span className="text-brand-accent-green font-black">•</span>
                                    {stripMarkdown(doItem)}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-brand-accent-red/10 border border-brand-accent-red/20 rounded-3xl p-6">
                        <h4 className="text-xs font-black text-brand-accent-red uppercase tracking-widest mb-4 flex items-center gap-2">
                            <XMarkIcon className="h-4 w-4" /> {t('partnerPortal_guidelines_donts')}
                        </h4>
                        <ul className="space-y-3">
                            {(company.brandVoice?.donts || []).map((dontItem, i) => (
                                <li key={i} className="text-sm text-[var(--text-secondary)] flex items-start gap-2">
                                    <span className="text-brand-accent-red font-black">•</span>
                                    {stripMarkdown(dontItem)}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const PartnerPortalScreen: React.FC<PartnerPortalScreenProps> = (props) => {
    const { user, token, company: companyProp, isSimulation, onExitSimulation, onSubmitSuccessStory } = props;
    const { t, language: currentLang, setLanguage } = useLanguage();
    const [localCompany, setLocalCompany] = useState<Company | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<PortalTab | 'original_plan'>('calendar');
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isPdfLoading, setIsPdfLoading] = useState(false);

    const partnerAccess = user.partnerAccess?.[0];
    const company = isSimulation ? companyProp : localCompany;
    const partner = useMemo(() => company?.partners?.find(p => p.id === (isSimulation ? props.user.id : partnerAccess?.partnerId)), [company, partnerAccess, isSimulation]);

    useEffect(() => {
        let currentUrl: string | null = null;
        if (partner?.originalPlanPdfAssetId && activeTab === 'original_plan') {
            setIsPdfLoading(true);
            const assetId = partner.originalPlanPdfAssetId.replace('asset:', '');
            assetStorage.getAsset(assetId).then(file => {
                if (file) {
                    const blob = new Blob([file], { type: 'application/pdf' });
                    currentUrl = URL.createObjectURL(blob);
                    setPdfUrl(currentUrl);
                }
            }).catch(err => {
                console.error("PDF Load Error:", err);
            }).finally(() => {
                setIsPdfLoading(false);
            });
        }
        return () => { 
            if(currentUrl) URL.revokeObjectURL(currentUrl);
            setPdfUrl(null);
        };
    }, [partner?.originalPlanPdfAssetId, activeTab]);

    useEffect(() => {
        const targetLang = isSimulation ? companyProp?.language : partner?.language;
        if (targetLang && targetLang !== currentLang) {
            setLanguage(targetLang as any);
        }
    }, [partner?.language, companyProp?.language, currentLang, setLanguage, isSimulation]);

    useEffect(() => {
        if (!isSimulation && partnerAccess) {
            setIsLoading(true);
            apiClient.getCompany(token, partnerAccess.companyId)
                .then(setLocalCompany)
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, [isSimulation, partnerAccess, token]);

    const TABS: { id: PortalTab | 'original_plan', labelKey: string, icon: React.FC<any>, visible?: boolean }[] = [
        { id: 'calendar', labelKey: 'partnerPortal_tab_calendar', icon: CalendarIcon },
        { id: 'original_plan', labelKey: 'partnerPortal_tab_original_plan', icon: DocumentIcon, visible: !!partner?.originalPlanPdfAssetId },
        { id: 'initiatives', labelKey: 'partnerPortal_tab_initiatives', icon: MegaphoneIcon },
        { id: 'leads', labelKey: 'partnerPortal_tab_leads', icon: InboxIcon },
        { id: 'guidelines', labelKey: 'partnerPortal_tab_guidelines', icon: BookOpenIcon },
        { id: 'idea_box', labelKey: 'partnerPortal_tab_ideaBox', icon: LightBulbIcon },
        { id: 'success_stories', labelKey: 'partnerPortal_tab_success_stories', icon: TrophyIcon },
    ];

    if (isLoading) return <div className="flex h-screen items-center justify-center bg-[var(--bg-app)]"><SyncIcon className="h-12 w-12 text-brand-primary animate-spin" /></div>;
    if (!company || !partner) return <div className="p-20 text-center text-[var(--text-muted)]">{t('partnerPortal_no_data')}</div>;
    
    return (
        <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-secondary)]">
            {isSimulation && (
                <div className="no-print bg-gradient-to-r from-brand-accent-amber to-brand-accent-amber/90 text-white px-6 py-2 flex items-center justify-between shadow-2xl relative z-50">
                    <div className="flex items-center gap-3">
                        <span className="animate-pulse flex h-3 w-3 rounded-full bg-white"></span>
                        <span className="text-xs font-black uppercase tracking-widest">{t('partnerPortal_preview_banner', { name: stripMarkdown(partner.name) })}</span>
                    </div>
                    <button onClick={onExitSimulation} className="px-4 py-1.5 bg-white text-brand-accent-amber text-xs font-black uppercase tracking-widest rounded-lg shadow-xl">{t('return_to_admin')}</button>
                </div>
            )}

            <header className="bg-[var(--bg-sidebar)] border-b border-[var(--border-dark)] p-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase">{t('partnerPortal_title')}</h1>
                        </div>
                        <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-xs opacity-60">{t('partnerPortal_hub_description', { partnerName: stripMarkdown(partner.name), companyName: stripMarkdown(company.name) })}</p>
                    </div>
                    <nav className="flex items-center gap-2 bg-[var(--bg-input)] p-1 rounded-2xl border border-[var(--border-dark)] flex-wrap shadow-inner">
                        {TABS.filter(t => t.visible !== false).map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-brand-primary text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                            >
                                <tab.icon className="h-4 w-4"/>
                                <span className="hidden lg:inline">{t(tab.labelKey)}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </header>

            <main className="py-12 px-6 sm:px-8 max-w-7xl mx-auto">
                {activeTab === 'calendar' && <Calendar currentDate={new Date()} setCurrentDate={() => {}} events={company.events?.filter(e => e.postsByPartner?.[partner.id]) || []} onSelectEvent={() => {}} onDayClick={() => {}} activePartner={partner} campaigns={[]} company={company} onUpdateEventDate={() => {}} />}
                {activeTab === 'guidelines' && <PartnerGuidelinesScreen company={company} />}
                {activeTab === 'leads' && <PartnerLeadsScreen leads={company.leads?.filter(l => l.partnerId === partner.id) || []} />}
                {activeTab === 'idea_box' && <IdeaBoxScreen company={company} partner={partner} onSubmitIdea={async (ideaData) => {
                    await apiClient.submitPartnerIdea(token, company.id, partner.id, ideaData);
                    const updatedCompany = await apiClient.getCompany(token, company.id);
                    props.onCompanyDataUpdate(updatedCompany);
                }} />}
                {activeTab === 'success_stories' && <PartnerSuccessScreen partner={partner} onSubmit={onSubmitSuccessStory} />}
                
                {activeTab === 'original_plan' && (
                    <div className="max-w-[210mm] mx-auto bg-[var(--bg-card)] rounded-[2.5rem] shadow-2xl overflow-hidden h-[80vh] border border-[var(--border-dark)] flex flex-col animate-in fade-in duration-700">
                        {isPdfLoading ? (
                            <div className="flex-1 flex flex-col items-center justify-center bg-[var(--bg-card)]/90 text-[var(--text-tertiary)] gap-4">
                                <SyncIcon className="h-10 w-10 text-brand-primary animate-spin" />
                                <span className="text-xs font-black uppercase tracking-widest">{t('partnerPortal_loading_pdf')}</span>
                            </div>
                        ) : pdfUrl ? (
                            <>
                                <div className="no-print p-4 bg-[var(--bg-card)]/90 border-b border-[var(--border-dark)] flex justify-between items-center">
                                    <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{t('partnerPortal_tab_original_plan')}</span>
                                    <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-brand-primary-hover transition-all">
                                        <ArrowTopRightOnSquareIcon className="h-4 w-4" /> {t('partnerPortal_open_new_window')}
                                    </a>
                                </div>
                                <object data={pdfUrl} type="application/pdf" className="w-full flex-1">
                                    <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-[var(--bg-card)]/90">
                                        <DocumentIcon className="h-20 w-20 text-[var(--text-light-muted)] opacity-50 mb-6" />
                                        <h3 className="text-[var(--text-primary)] font-black uppercase mb-2">Visning ikke understøttet</h3>
                                        <a href={pdfUrl} download="samarbejdsplan.pdf" className="px-8 py-3 bg-[var(--bg-card-hover)] text-[var(--text-primary)] font-black uppercase tracking-widest rounded-xl hover:bg-[var(--bg-button-secondary-hover)] transition-all">Download PDF</a>
                                    </div>
                                </object>
                            </>
                        ) : (
                            <div className="flex-1 flex items-center justify-center bg-[var(--bg-card)]/90">
                                <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest">{t('partnerPortal_no_data')}</p>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};
