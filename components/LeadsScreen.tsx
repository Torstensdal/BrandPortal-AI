

import React, { useState, useMemo } from 'react';
import { Company, Lead, LeadStatus, Partner, LeadActivity, LeadActivityType } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { InboxIcon } from './icons/InboxIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { PaperAirplaneIcon } from './icons/PaperAirplaneIcon';
import { ChatBubbleLeftIcon } from './icons/ChatBubbleLeftIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
/* Added missing ClockIcon import */
import { ClockIcon } from './icons/ClockIcon';
import { formatAiContent, stripMarkdown } from '../utils/formatters';
import { SyncIcon } from './icons/SyncIcon';

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
    const [isUpdating, setIsUpdating] = useState(false);
    if (!lead) return null;
    
    const partner = allPartners.get(lead.partnerId);
    const statuses: LeadStatus[] = ['New', 'Contacted', 'Qualified', 'Unqualified', 'Converted'];

    const handleStatusClick = async (s: LeadStatus) => {
        setIsUpdating(true);
        await onStatusChange(lead.id, s);
        setIsUpdating(false);
    };

    return (
        <div className={`fixed top-0 right-0 h-full w-full md:w-1/3 bg-[var(--bg-modal)] border-l border-[var(--border-primary)] shadow-2xl z-[70] transform transition-transform duration-300 ease-in-out ${lead ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between p-6 border-b border-[var(--border-primary)]">
                    <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Lead Detaljer</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--bg-card-hover)]"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <div className="p-8 flex-grow overflow-y-auto no-scrollbar">
                    <div className="space-y-8">
                        <div>
                            <p className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tighter leading-none mb-1">{stripMarkdown(lead.name)}</p>
                            <p className="text-brand-primary font-black uppercase text-xs tracking-widest">{lead.email}</p>
                        </div>

                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Flyt i Tragt</p>
                            <div className="flex flex-wrap gap-2 relative">
                                {isUpdating && <div className="absolute inset-0 z-10 bg-white/60 flex items-center justify-center rounded-xl"><SyncIcon className="h-5 w-5 animate-spin text-brand-primary" /></div>}
                                {statuses.map(s => (
                                    <button key={s} onClick={() => handleStatusClick(s)} className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${lead.status === s ? 'bg-brand-primary text-white shadow-xl' : 'bg-[var(--bg-input)] text-[var(--text-muted)] border border-[var(--border-primary)] hover:border-brand-primary/50'}`}>{s}</button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-[var(--bg-card-secondary)] rounded-2xl border border-[var(--border-primary)]">
                                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Partner</p>
                                <p className="text-xs font-bold text-[var(--text-secondary)]">{partner?.name || 'Direkte'}</p>
                            </div>
                            <div className="p-4 bg-[var(--bg-card-secondary)] rounded-2xl border border-[var(--border-primary)]">
                                <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Lead Score</p>
                                <p className="text-xs font-black text-brand-primary">{lead.score}</p>
                            </div>
                        </div>

                        <div className="p-6 bg-[var(--bg-input)] rounded-3xl border border-[var(--border-primary)] shadow-inner">
                            <p className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">Henvendelse</p>
                            <div className="text-sm text-[var(--text-secondary)] italic leading-relaxed" dangerouslySetInnerHTML={{ __html: formatAiContent(lead.message || 'Ingen besked vedhæftet.') }} />
                        </div>

                        <div>
                            <h4 className="font-black text-[var(--text-primary)] uppercase tracking-widest text-[10px] mb-6 flex items-center gap-2"><ClockIcon className="h-4 w-4" /> Aktivitets-log</h4>
                            <ul className="space-y-6 border-l-2 border-[var(--border-primary)] ml-3">
                                {(lead.activity || []).map(act => (
                                    <li key={act.id} className="relative pl-8">
                                        <div className="absolute -left-[17px] top-0 h-8 w-8 bg-white rounded-full border-2 border-[var(--border-primary)] flex items-center justify-center shadow-md"><ActivityIcon type={act.type} /></div>
                                        <p className="text-xs text-[var(--text-primary)] font-black uppercase tracking-tight">{act.description}</p>
                                        <p className="text-[9px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{new Date(act.timestamp).toLocaleDateString()} {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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

    const partnersById = useMemo(() => new Map((company.partners || []).map(p => [p.id, p])), [company.partners]);
    const sortedLeads = useMemo(() => (company.leads || []).sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()), [company.leads]);
    const selectedLead = useMemo(() => sortedLeads.find(l => l.id === selectedLeadId) || null, [sortedLeads, selectedLeadId]);
    
    if (company.leads?.length === 0) return <div className="text-center py-32 px-6 max-w-7xl mx-auto"><InboxIcon className="mx-auto h-16 w-16 text-[var(--text-muted)] opacity-20 mb-6" /><h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-[0.2em]">Lead Center er tomt</h3><p className="mt-2 text-sm text-[var(--text-muted)] font-medium">Vi indlæser leads så snart dine partnere eller landingssider modtager forespørgsler.</p></div>;

    return (
        <div className="p-8 max-w-7xl mx-auto theme-transition relative">
            <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter uppercase mb-2">Lead Center</h1>
            <p className="text-lg text-[var(--text-secondary)] font-medium opacity-70 mb-10">Hold styr på jeres salgsflow og partnerskabs-leads.</p>
            
            <div className="overflow-hidden shadow-2xl border border-[var(--border-primary)] rounded-[3rem] bg-[var(--bg-card)]">
                <table className="min-w-full divide-y divide-[var(--border-primary)]">
                    <thead className="bg-[var(--bg-card-secondary)]/50">
                        <tr>
                            <th className="py-6 pl-10 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Kunde</th>
                            <th className="px-6 py-6 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Partner</th>
                            <th className="px-6 py-6 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Status</th>
                            <th className="px-6 py-6 text-left text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">Score</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-primary)]">
                        {sortedLeads.map((lead) => (
                            <tr key={lead.id} onClick={() => setSelectedLeadId(lead.id)} className={`cursor-pointer transition-all duration-300 ${selectedLeadId === lead.id ? 'bg-brand-primary/[0.03]' : 'hover:bg-[var(--bg-card-hover)]'}`}>
                                <td className="py-6 pl-10"><div className="font-black text-[var(--text-primary)] uppercase tracking-tight">{stripMarkdown(lead.name)}</div><div className="text-[var(--text-muted)] text-[10px] font-black">{lead.email}</div></td>
                                <td className="px-6 py-6 text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">{partnersById.get(lead.partnerId)?.name || 'Direkte'}</td>
                                <td className="px-6 py-6"><span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${lead.status === 'Converted' ? 'bg-brand-accent-green/10 text-brand-accent-green border-brand-accent-green/30' : (lead.status === 'New' ? 'bg-brand-accent-amber/10 text-brand-accent-amber border-brand-accent-amber/30' : 'bg-brand-primary/10 text-brand-primary border-brand-primary/20')}`}>{lead.status}</span></td>
                                <td className="px-6 py-6 font-black text-brand-primary text-sm">{lead.score}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {selectedLead && <LeadDetailView lead={selectedLead} onClose={() => setSelectedLeadId(null)} allPartners={partnersById} onStatusChange={onUpdateLeadStatus} />}
        </div>
    );
};
