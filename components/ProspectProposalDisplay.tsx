import React, { useState } from 'react';
import { ProspectProposal, Partner, KPI } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { generateProposalDoc } from '../utils/docGenerator';
import { stripMarkdown } from '../utils/formatters';
import { EditableField } from './EditableField';
import { GeminiEditorModal } from './GeminiEditorModal';
import { PartnerLogo } from './PartnerLogo';
import { v4 as uuidv4 } from 'uuid';
import FileSaver from 'file-saver';
import { PrinterIcon } from './icons/PrinterIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { BuildingStorefrontIcon } from './icons/BuildingStorefrontIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { LockOpenIcon } from './icons/LockOpenIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { SyncIcon } from './icons/SyncIcon';
import { PageBreakIcon } from './icons/PageBreakIcon';
import { ArchiveBoxIcon } from './icons/ArchiveBoxIcon';
import { XMarkIcon } from './icons/XMarkIcon';

export const ProspectProposalDisplay: React.FC<{ 
    proposal: ProspectProposal; 
    onGenerateAnother: () => void;
    onUpdateGrowthPlan?: (proposal: ProspectProposal) => void;
    onSaveGrowthPlanVersion?: (name: string) => void;
    isInternalPlan: boolean;
    partner?: Partner; 
}> = ({ proposal, onGenerateAnother, onUpdateGrowthPlan, onSaveGrowthPlanVersion, isInternalPlan, partner }) => {
    const { t } = useLanguage();
    const [activeSectionId, setActiveSectionId] = useState<string>('cover');
    const [isNamingVersion, setIsNamingVersion] = useState(false);
    const [versionName, setVersionName] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [aiRewriteText, setAiRewriteText] = useState<{ text: string; sectionId: string } | null>(null);

    const handleUpdateKPI = (index: number, updates: Partial<KPI>) => {
        if (!onUpdateGrowthPlan) return;
        const currentKpis = [...(proposal.businessPairs?.kpis || [])];
        currentKpis[index] = { ...currentKpis[index], ...updates };
        onUpdateGrowthPlan({ ...proposal, businessPairs: { ...proposal.businessPairs, kpis: currentKpis } });
    };

    const handleExportWord = async () => {
        setIsExporting(true);
        try {
            const blob = await generateProposalDoc(proposal);
            FileSaver.saveAs(blob, `${proposal.name.replace(/\s+/g, '_')}.docx`);
        } finally { setIsExporting(false); }
    };

    const sections = proposal.customSections || [];

    return (
        <div className="flex h-screen bg-[var(--bg-app)] overflow-hidden theme-transition">
            <aside className="no-print w-80 bg-[var(--bg-sidebar)] border-r border-[var(--border-primary)] flex flex-col shrink-0 overflow-y-auto no-scrollbar shadow-xl">
                <div className="p-8 border-b border-[var(--border-primary)] bg-[var(--bg-card-secondary)]/50">
                    <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-8">Dokument Oversigt</h3>
                    <div className="space-y-2">
                        <button onClick={() => { setActiveSectionId('cover'); document.getElementById('section-cover')?.scrollIntoView({ behavior: 'smooth' }); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSectionId === 'cover' ? 'bg-brand-primary text-white shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'}`}>
                            <BuildingStorefrontIcon className="h-5 w-5" /> Forside
                        </button>
                        <div className="mt-8 pt-8 border-t border-[var(--border-primary)]/50 space-y-1">
                            {sections.map((s, idx) => (
                                <button key={s.id} onClick={() => { setActiveSectionId(s.id); document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: 'smooth' }); }} className={`w-full flex items-center justify-between gap-4 px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all text-left ${activeSectionId === s.id ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30' : 'text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]'}`}>
                                    <span className="truncate">{(idx + 1).toString().padStart(2, '0')}. {stripMarkdown(s.title)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="p-8 mt-auto">
                    <button onClick={() => setIsNamingVersion(true)} className="w-full py-5 bg-brand-primary/5 text-brand-primary text-[10px] font-black uppercase tracking-widest rounded-2xl border border-brand-primary/20 flex items-center justify-center gap-3 transition-all hover:bg-brand-primary hover:text-white">
                        <ArchiveBoxIcon className="h-5 w-5" /> Gem Version
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 relative">
                <header className="no-print bg-[var(--bg-header)]/90 backdrop-blur-xl border-b border-[var(--border-primary)] p-6 flex justify-between items-center z-40 sticky top-0 shrink-0">
                    <div className="flex items-center gap-6">
                        {!isInternalPlan && <button onClick={onGenerateAnother} className="text-[10px] font-black uppercase text-[var(--text-muted)] hover:text-brand-primary flex items-center gap-2 transition-colors"><ArrowLeftIcon className="h-4 w-4" /> Tilbage</button>}
                        <h1 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest truncate max-w-sm">{stripMarkdown(proposal.name)}</h1>
                    </div>
                    <button onClick={handleExportWord} disabled={isExporting} className="px-8 py-3.5 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-3 hover:brightness-110 shadow-xl transition-all disabled:opacity-50">
                        {isExporting ? <SyncIcon className="h-4 w-4 animate-spin" /> : <PrinterIcon className="h-4 w-4" />}
                        <span>Eksport til Word</span>
                    </button>
                </header>

                <main className="flex-1 overflow-y-auto bg-[var(--bg-app)] p-12 sm:p-24 lg:p-32 scroll-smooth no-scrollbar">
                    <div className="max-w-[210mm] mx-auto bg-white min-h-[297mm] shadow-[0_50px_150px_rgba(0,0,0,0.1)] text-slate-900 rounded-sm overflow-hidden animate-in fade-in zoom-in-95 duration-700">
                        <div id="section-cover" className="bg-[#0B1D39] text-white flex flex-col items-center justify-center p-24 text-center relative" style={{ minHeight: '297mm' }}>
                            <div className="h-48 w-48 bg-white/5 rounded-[3rem] p-10 shadow-2xl mb-24 border border-white/10 backdrop-blur-3xl flex items-center justify-center">
                                <PartnerLogo partnerName={proposal.prospectName} logoUrl={proposal.prospectLogoUrl || partner?.logoUrl} className="h-full w-full" />
                            </div>
                            <h1 className="text-7xl font-black uppercase tracking-tighter leading-[0.85] mb-12 font-montserrat text-white">{stripMarkdown(proposal.name)}</h1>
                            <div className="h-1.5 w-32 bg-brand-primary mx-auto mb-12 rounded-full"></div>
                            <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.6em] mb-4">Udarbejdet for</p>
                            <p className="text-white text-4xl font-black uppercase tracking-widest font-montserrat">{stripMarkdown(proposal.prospectName)}</p>
                        </div>

                        <div className="p-24 space-y-12">
                            {proposal.businessPairs?.kpis && proposal.businessPairs.kpis.length > 0 && (
                                <div className="mb-32 border-b border-slate-100 pb-16">
                                    <h2 className="text-4xl font-black text-[#0B1D39] font-montserrat tracking-tighter uppercase mb-12">Strategiske Nøgletal</h2>
                                    <div className="grid grid-cols-1 gap-6">
                                        {proposal.businessPairs.kpis.map((kpi, idx) => (
                                            <div key={idx} className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-8 group">
                                                <div className="flex-1">
                                                    <EditableField tag="h4" initialValue={kpi.name} onSave={(val) => handleUpdateKPI(idx, { name: val })} className="text-lg font-black text-[#0B1D39] uppercase tracking-tight mb-1" />
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Målepunkt</p>
                                                </div>
                                                <div className="flex gap-12 text-center">
                                                    <div><EditableField tag="p" initialValue={kpi.baseline || "-"} onSave={(val) => handleUpdateKPI(idx, { baseline: val })} className="text-2xl font-black text-slate-400" /><p className="text-[9px] font-black text-slate-400 uppercase">Baseline</p></div>
                                                    <div><EditableField tag="p" initialValue={kpi.target} onSave={(val) => handleUpdateKPI(idx, { target: val })} className="text-2xl font-black text-brand-primary" /><p className="text-[9px] font-black text-brand-primary uppercase">Target</p></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {sections.map((section, idx) => (
                                <div key={section.id} id={`section-${section.id}`} className="group relative my-48 break-inside-avoid scroll-mt-40">
                                    <h2 className="text-5xl font-black text-[#0B1D39] font-montserrat tracking-tighter uppercase leading-tight border-b-4 border-[#0B1D39]/10 pb-6 mb-12">
                                        <EditableField tag="span" initialValue={stripMarkdown(section.title)} onSave={(val) => onUpdateGrowthPlan?.({ ...proposal, customSections: sections.map(s => s.id === section.id ? { ...s, title: val } : s) })} />
                                    </h2>
                                    <div className="px-4">
                                        <EditableField tag="div" initialValue={section.body} onSave={(val) => onUpdateGrowthPlan?.({ ...proposal, customSections: sections.map(s => s.id === section.id ? { ...s, body: val } : s) })} multiline={true} className="prose prose-slate max-w-none text-lg leading-relaxed" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </main>
            </div>
            {isNamingVersion && (
                <div className="fixed inset-0 z-[10000] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-8">
                    <div className="w-full max-w-lg bg-slate-900 border border-indigo-500/30 rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-500">
                        <div className="flex justify-between items-center mb-10"><h3 className="text-2xl font-black text-white uppercase tracking-tight">Navngiv Version</h3><button onClick={() => setIsNamingVersion(false)} className="p-2 text-slate-500 hover:text-white transition-colors"><XMarkIcon className="h-6 w-6" /></button></div>
                        <div className="space-y-6">
                            <input autoFocus type="text" value={versionName} onChange={(e) => setVersionName(e.target.value)} placeholder="f.eks. Strategi Revideret Q3" className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-6 py-4 text-white focus:border-brand-primary outline-none transition-all font-mono" />
                            <button onClick={() => { onSaveGrowthPlanVersion?.(versionName); setIsNamingVersion(false); }} className="w-full py-5 bg-brand-primary text-white font-black uppercase tracking-widest rounded-xl hover:brightness-110 shadow-xl transition-all">Gem Version Nu</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
