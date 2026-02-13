
import React, { useState, useMemo } from 'react';
import { Company, Lead, LeadStatus, Partner, LeadActivity, LeadActivityType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { InboxIcon } from './icons/InboxIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { ChatBubbleLeftIcon } from './icons/ChatBubbleLeftIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { formatAiContent, stripMarkdown } from '../utils/formatters';

interface LeadsScreenProps {
  company: Company;
  onUpdateLeadStatus: (leadId: string, newStatus: LeadStatus) => void;
}

const ActivityIcon: React.FC<{ type: LeadActivityType }> = ({ type }) => {
  const iconMap: Record<string, React.FC<any>> = {
    form_submission: InboxIcon,
    email_open: PaperAirplaneIcon,
    email_click: PaperAirplaneIcon,
    page_revisit: InboxIcon,
    status_change: CheckCircleIcon,
  };
  const Icon = iconMap[type] || ChatBubbleLeftIcon;
  return <Icon className="h-5 w-5 text-brand-primary" />;
};

const LeadDetailView: React.FC<{ lead: Lead | null; onClose: () => void; allPartners: Map<string, Partner>; onStatusChange: (id: string, s: LeadStatus) => void }> = ({ lead, onClose, allPartners, onStatusChange }) => {
    const { t } = useLanguage();
    if (!lead) return null;
    
    const partner = allPartners.get(lead.partnerId);
    const statuses: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted'];

    return (
        <div className={`absolute top-0 right-0 h-full w-full md:w-1/3 bg-[var(--bg-modal)] border-l border-[var(--border-primary)] shadow-2xl z-30 transform transition-transform duration-300 ease-in-out ${lead ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-4 border-b border-[var(--border-primary)] flex-shrink-0">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Lead Detaljer</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--bg-card-hover)]">
                        <XMarkIcon className="h-5 w-5 text-[var(--text-muted)]" />
                    </button>
                </div>
                <div className="p-6 flex-grow overflow-y-auto">
                    <div className="space-y-6">
                        <div>
                            <p className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">{stripMarkdown(lead.name)}</p>
                            <p className="text-sm text-brand-primary font-bold">{lead.email}</p>
                            {lead.company && <p className="text-sm text-[var(--text-secondary)]">{lead.company}</p>}
                        </div>

                        <div className="space-y-3">
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Opdater Status</p>
                            <div className="flex flex-wrap gap-2">
                                {statuses.map(s => (
                                    <button 
                                        key={s} 
                                        onClick={() => onStatusChange(lead.id, s)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${lead.status === s ? 'bg-brand-primary text-white shadow-lg' : 'bg-[var(--bg-input)] text-[var(--text-muted)] hover:text-brand-primary border border-[var(--border-primary)]'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="p-4 bg-[var(--bg-card-secondary)] rounded-2xl border border-[var(--border-primary)]">
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Partner</p>
                            <p className="text-sm font-bold text-[var(--text-secondary)]">{partner?.name || lead.partnerId}</p>
                        </div>
                        <div className="p-4 bg-[var(--bg-card-secondary)] rounded-2xl border border-[var(--border-primary)]">
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Besked</p>
                            <div className="text-sm text-[var(--text-secondary)] italic" dangerouslySetInnerHTML={{ __html: formatAiContent(lead.message) }} />
                        </div>
                        <div>
                            <h4 className="font-black text-[var(--text-primary)] uppercase tracking-widest text-xs mb-4">Aktivitets-log</h4>
                            <ul className="space-y-6 border-l-2 border-[var(--border-primary)] ml-3">
                                {(lead.activity || []).map(act => (
                                    <li key={act.id} className="relative pl-8">
                                        <div className="absolute -left-[17px] top-0 h-8 w-8 bg-[var(--bg-card)] rounded-full border-2 border-[var(--border-primary)] flex items-center justify-center shadow-lg">
                                            <ActivityIcon type={act.type} />
                                        </div>
                                        <p className="text-sm text-[var(--text-primary)] font-bold">{act.description}</p>
                                        <p className="text-xs text-[var(--text-muted)] font-medium">{new Date(act.timestamp).toLocaleString()}</p>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


export const LeadsScreen: React.FC<LeadsScreenProps> = ({ company, onUpdateLeadStatus }) => {
    const { t } = useLanguage();
    const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

    const partnersById = useMemo(() =>
        new Map((company.partners || []).map(p => [p.id, p])),
        [company.partners]
    );

    const sortedLeads = useMemo(() =>
        (company.leads || []).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),
        [company.leads]
    );

    const selectedLead = useMemo(() => sortedLeads.find(l => l.id === selectedLeadId) || null, [sortedLeads, selectedLeadId]);
    
    if (!company.leads || company.leads.length === 0) {
        return (
            <div className="text-center py-20 px-6 max-w-7xl mx-auto my-8">
                <InboxIcon className="mx-auto h-16 w-16 text-[var(--text-muted)] opacity-30" />
                <h3 className="mt-4 text-xl font-black text-[var(--text-primary)] uppercase">{t('leads_noLeads')}</h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{t('leads_noLeads')}</p>
            </div>
        );
    }

    return (
        <div className="py-8 relative overflow-hidden h-[calc(100vh-4rem)] theme-transition">
            <div className={`h-full max-w-7xl mx-auto transition-all duration-300 ease-in-out ${selectedLead ? 'md:pr-[33.33%]' : 'pr-0'}`}>
                <div className="px-4 sm:px-6 lg:px-8 h-full flex flex-col">
                    <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter uppercase">Lead Center</h1>
                    <p className="mt-1 text-lg text-[var(--text-secondary)] font-medium">Følg op på dine potentielle kunder.</p>
                    
                    <div className="mt-8 flex flex-col flex-grow overflow-hidden">
                        <div className="overflow-x-auto shadow-2xl border border-[var(--border-primary)] rounded-[2.5rem] bg-[var(--bg-card)]">
                            <table className="min-w-full divide-y divide-[var(--border-primary)]">
                                <thead className="bg-[var(--bg-card-secondary)]">
                                    <tr>
                                        <th className="py-5 pl-8 pr-3 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Kunde</th>
                                        <th className="px-3 py-5 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Partner</th>
                                        <th className="px-3 py-5 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Status</th>
                                        <th className="px-3 py-5 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">Score</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border-primary)]">
                                    {sortedLeads.map((lead) => (
                                        <tr key={lead.id} onClick={() => setSelectedLeadId(lead.id)} className={`cursor-pointer transition-all ${selectedLeadId === lead.id ? 'bg-brand-primary/5' : 'hover:bg-[var(--bg-card-hover)]'}`}>
                                            <td className="whitespace-nowrap py-5 pl-8 pr-3">
                                                <div className="font-bold text-[var(--text-primary)]">{stripMarkdown(lead.name)}</div>
                                                <div className="text-[var(--text-muted)] text-xs font-medium">{lead.email}</div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-5 text-sm text-[var(--text-secondary)] font-medium">
                                                {partnersById.get(lead.partnerId)?.name || lead.partnerId}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-5">
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${lead.status === 'Converted' ? 'bg-brand-accent-green/20 text-brand-accent-green border-brand-accent-green/30' : (lead.status === 'New' ? 'bg-brand-accent-amber/20 text-brand-accent-amber border-brand-accent-amber/30' : 'bg-brand-primary/10 text-brand-primary border-brand-primary/20')}`}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-5 font-black text-brand-primary">{lead.score}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <LeadDetailView lead={selectedLead} onClose={() => setSelectedLeadId(null)} allPartners={partnersById} onStatusChange={onUpdateLeadStatus} />
        </div>
    );
};
