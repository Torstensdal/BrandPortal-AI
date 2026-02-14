
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ProspectProposal, Partner, KPI } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { generateProposalDoc } from '../utils/docGenerator';
import { stripMarkdown } from '../utils/formatters';
import { EditableField } from './EditableField';
import { GeminiEditorModal } from './GeminiEditorModal';
import { PartnerLogo } from './PartnerLogo';
import { v4 as uuidv4 } from 'uuid';
import FileSaver from 'file-saver';
import { exportPdf } from '../utils/fileUtils';

// Icons
import { PrinterIcon } from './icons/PrinterIcon';
import { ArrowLeftIcon } from './icons/ArrowLeftIcon';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { BuildingStorefrontIcon } from './icons/BuildingStorefrontIcon';
import { LockClosedIcon } from './icons/LockClosedIcon';
import { LockOpenIcon } from './icons/LockOpenIcon';
import { TrashIcon } from './icons/TrashIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { SyncIcon } from './icons/SyncIcon';
import { ArrowUpIcon } from './icons/ArrowUpIcon';
import { ArrowDownIcon } from './icons/ArrowDownIcon';
import { PageBreakIcon } from './icons/PageBreakIcon';
import { ArchiveBoxIcon } from './icons/ArchiveBoxIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { DocumentPlusIcon } from './icons/DocumentPlusIcon';
import { DocumentArrowDownIcon } from './icons/DocumentArrowDownIcon';

interface SectionProps {
    id: string;
    title: string;
    body: string;
    sectionNumber: number;
    isLocked: boolean;
    hasPageBreak: boolean;
    onUpdate: (updates: { title?: string; body?: string }) => void;
    onToggleLock: () => void;
    onTogglePageBreak: () => void;
    onDelete: () => void;
    onAiRewrite: (text: string) => void;
    onMoveUp?: () => void;
    onMoveDown?: () => void;
    isFirst: boolean;
    isLast: boolean;
}

const ProposalSection: React.FC<SectionProps> = ({ 
    id, title, body, sectionNumber, isLocked, hasPageBreak, onUpdate, onToggleLock, onTogglePageBreak, onDelete, onAiRewrite, onMoveUp, onMoveDown, isFirst, isLast
}) => {
    const { t } = useLanguage();
    return (
        <div className={`relative ${hasPageBreak ? 'print-break-before' : ''}`}>
            {hasPageBreak && (
                <div className="no-print w-full flex items-center gap-6 my-24 opacity-30 select-none">
                    <div className="h-px flex-grow border-t border-slate-400 border-dashed"></div>
                    <span className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400 flex items-center gap-4">
                        <PageBreakIcon className="h-4 w-4" /> SIDESKIFT
                    </span>
                    <div className="h-px flex-grow border-t border-slate-400 border-dashed"></div>
                </div>
            )}

            <section id={`section-${id}`} className="group relative my-48 first:mt-0 section-container break-inside-avoid scroll-mt-40">
                <div className="section-number-bg transition-colors duration-300 pointer-events-none">{sectionNumber.toString().padStart(2, '0')}</div>

                <div className="no-print absolute -left-20 top-0 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-4 group-hover:translate-x-0 z-20">
                    <button onClick={onToggleLock} className={`p-3 rounded-xl border shadow-xl transition-all ${isLocked ? 'bg-brand-accent-amber text-white' : 'bg-white text-slate-400 hover:text-slate-600'}`}>
                        {isLocked ? <LockClosedIcon className="h-5 w-5" /> : <LockOpenIcon className="h-5 w-5" />}
                    </button>
                    {!isLocked && (
                        <>
                            <button onClick={onTogglePageBreak} className={`p-3 rounded-xl border shadow-xl transition-all ${hasPageBreak ? 'bg-brand-primary text-white' : 'bg-white text-slate-400'}`}>
                                <PageBreakIcon className="h-5 w-5" />
                            </button>
                            <button onClick={() => onAiRewrite(body)} className="p-3 bg-white border text-purple-600 rounded-xl shadow-xl"><SparklesIcon className="h-5 w-5" /></button>
                            <button onClick={onDelete} className="p-3 bg-white border text-red-500 rounded-xl shadow-xl"><TrashIcon className="h-4 w-4" /></button>
                        </>
                    )}
                </div>

                <div className="flex flex-col mb-12 relative z-10">
                    <EditableField
                        tag="h2"
                        initialValue={stripMarkdown(title)}
                        onSave={(val) => onUpdate({ title: val })}
                        isEditing={!isLocked}
                        className="text-5xl font-black text-[#0B1D39] font-montserrat tracking-tighter uppercase leading-tight border-b-4 border-[#0B1D39]/10 pb-6"
                    />
                </div>

                <div className="section-content relative z-10 px-4">
                    <EditableField 
                        tag="div"
                        initialValue={body}
                        onSave={(newBody) => onUpdate({ body: newBody })}
                        isEditing={!isLocked}
                        multiline={true}
                        className={`prose prose-slate max-w-none ai-rendered-content text-lg leading-relaxed ${isLocked ? 'opacity-80' : ''}`}
                    />
                </div>
            </section>
        </div>
    );
};

export const ProspectProposalDisplay: React.FC<{ 
    proposal: ProspectProposal; 
    onGenerateAnother: () => void;
    onUpdateGrowthPlan?: (proposal: ProspectProposal) => void;
    onSaveGrowthPlanVersion?: (name: string) => void | Promise<void>;
    isInternalPlan: boolean;
    partner?: Partner; 
    onFinishOnboarding?: () => void;
    onResetToTemplate?: () => void;
    onShowArchive?: () => void;
    archiveCount?: number;
    onUploadOriginalPdf?: (file: File) => Promise<string | void>;
}> = ({ 
    proposal, 
    onGenerateAnother, 
    onUpdateGrowthPlan, 
    onSaveGrowthPlanVersion, 
    isInternalPlan, 
    partner,
    onFinishOnboarding,
    onResetToTemplate,
    onShowArchive,
    archiveCount,
    onUploadOriginalPdf
}) => {
    const { t } = useLanguage();
    const [activeSectionId, setActiveSectionId] = useState<string>('cover');
    const [isNamingVersion, setIsNamingVersion] = useState(false);
    const [versionName, setVersionName] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [isPdfExporting, setIsPdfExporting] = useState(false);
    const [aiRewriteText, setAiRewriteText] = useState<{ text: string; sectionId: string } | null>(null);
    const documentRef = useRef<HTMLDivElement>(null);

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
        } finally {
            setIsExporting(false);
        }
    };

    const handleExportPdf = async () => {
        if (!documentRef.current) return;
        setIsPdfExporting(true);
        try {
            await exportPdf(documentRef.current, `${proposal.name.replace(/\s+/g, '_')}.pdf`);
        } finally {
            setIsPdfExporting(false);
        }
    };

    const sections = proposal.customSections || [];

    return (
        <div className="flex h-screen bg-[var(--bg-app)] overflow-hidden theme-transition">
            {/* SIDEBAR NAVIGATION */}
            <aside className="no-print w-80 bg-[var(--bg-sidebar)] border-r border-[var(--border-primary)] flex flex-col shrink-0 overflow-y-auto no-scrollbar shadow-xl">
                <div className="p-8 border-b border-[var(--border-primary)] bg-[var(--bg-card-secondary)]/50">
                    <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-8">Dokument Oversigt</h3>
                    <div className="space-y-2">
                        <button 
                            onClick={() => { setActiveSectionId('cover'); document.getElementById('section-cover')?.scrollIntoView({ behavior: 'smooth' }); }} 
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSectionId === 'cover' ? 'bg-brand-primary text-white shadow-lg' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]'}`}
                        >
                            <BuildingStorefrontIcon className="h-5 w-5" /> Forside
                        </button>
                        
                        <div className="mt-8 pt-8 border-t border-[var(--border-primary)]/50 space-y-1">
                            {sections.map((s, idx) => (
                                <button 
                                    key={s.id} 
                                    onClick={() => { setActiveSectionId(s.id); document.getElementById(`section-${s.id}`)?.scrollIntoView({ behavior: 'smooth' }); }} 
                                    className={`w-full flex items-center justify-between gap-4 px-5 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all text-left ${activeSectionId === s.id ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/30' : 'text-[var(--text-muted)] hover:bg-[var(--bg-card-hover)]'}`}
                                >
                                    <span className="truncate">{(idx + 1).toString().padStart(2, '0')}. {stripMarkdown(s.title)}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="p-8 mt-auto space-y-3">
                    <button onClick={() => setIsNamingVersion(true)} className="w-full py-5 bg-brand-primary/5 text-brand-primary text-[10px] font-black uppercase tracking-widest rounded-2xl border border-brand-primary/20 flex items-center justify-center gap-3 transition-all hover:bg-brand-primary hover:text-white">
                        <ArchiveBoxIcon className="h-5 w-5" /> Gem Version
                    </button>
                    {onShowArchive && (
                        <button onClick={onShowArchive} className="w-full py-4 bg-[var(--bg-app)] text-[var(--text-secondary)] text-[10px] font-black uppercase tracking-widest rounded-2xl border border-[var(--border-primary)] flex items-center justify-center gap-3 transition-all hover:bg-[var(--bg-card-hover)]">
                            Se Arkiv ({archiveCount || 0})
                        </button>
                    )}
                    {onResetToTemplate && (
                        <button onClick={onResetToTemplate} className="w-full py-3 text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest hover:text-brand-accent-red transition-colors">
                            Nulstil til Skabelon
                        </button>
                    )}
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 relative">
                {/* TOOLBAR */}
                <header className="no-print bg-[var(--bg-header)]/90 backdrop-blur-xl border-b border-[var(--border-primary)] p-6 flex justify-between items-center z-40 sticky top-0 shrink-0">
                    <div className="flex items-center gap-6">
                        {!isInternalPlan && <button onClick={onGenerateAnother} className="text-[10px] font-black uppercase text-[var(--text-muted)] hover:text-brand-primary flex items-center gap-2 transition-colors"><ArrowLeftIcon className="h-4 w-4" /> Tilbage</button>}
                        <h1 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest truncate max-w-sm">{stripMarkdown(proposal.name)}</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleExportPdf} 
                            disabled={isPdfExporting}
                            className="px-6 py-3.5 bg-brand-accent-purple text-white text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-3 hover:brightness-110 shadow-xl transition-all disabled:opacity-50"
                        >
                            {isPdfExporting ? <SyncIcon className="h-4 w-4 animate-spin" /> : <DocumentArrowDownIcon className="h-4 w-4" />}
                            <span>{isPdfExporting ? t('export_generating_pdf') : t('export_pdf_button')}</span>
                        </button>
                        <button 
                            onClick={handleExportWord} 
                            disabled={isExporting}
                            className="px-6 py-3.5 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-3 hover:brightness-110 shadow-xl transition-all disabled:opacity-50"
                        >
                            {isExporting ? <SyncIcon className="h-4 w-4 animate-spin" /> : <PrinterIcon className="h-4 w-4" />}
                            <span>Word</span>
                        </button>
                        {onFinishOnboarding && (
                            <button 
                                onClick={onFinishOnboarding}
                                className="px-8 py-3.5 bg-brand-accent-green text-white text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center gap-3 hover:brightness-110 shadow-xl transition-all active:scale-95"
                            >
                                <span>Færdig</span>
                                <ArrowRightIcon className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto bg-[var(--bg-app)] p-12 sm:p-24 lg:p-32 scroll-smooth no-scrollbar">
                    <div ref={documentRef} className="max-w-[210mm] mx-auto bg-white min-h-[297mm] shadow-[0_50px_150px_rgba(0,0,0,0.1)] text-slate-900 rounded-sm overflow-hidden animate-in fade-in zoom-in-95 duration-700">
                        
                        {/* FORSIDE */}
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
                            {/* KPI SEKTION */}
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
                                                    <div>
                                                        <EditableField tag="p" initialValue={kpi.baseline || "-"} onSave={(val) => handleUpdateKPI(idx, { baseline: val })} className="text-2xl font-black text-slate-400" />
                                                        <p className="text-[9px] font-black text-slate-400 uppercase">Baseline</p>
                                                    </div>
                                                    <div>
                                                        <EditableField tag="p" initialValue={kpi.target} onSave={(val) => handleUpdateKPI(idx, { target: val })} className="text-2xl font-black text-brand-primary" />
                                                        <p className="text-[9px] font-black text-brand-primary uppercase">Target</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* DYNAMISKE SEKTIONER */}
                            {sections.map((section, idx) => (
                                <ProposalSection 
                                    key={section.id} 
                                    id={section.id}
                                    title={section.title} 
                                    body={section.body}
                                    sectionNumber={idx + 1}
                                    isLocked={proposal.lockedSections?.includes(section.id) || false}
                                    hasPageBreak={proposal.pageBreaks?.includes(section.id) || false}
                                    onUpdate={(updates) => {
                                        if (!onUpdateGrowthPlan) return;
                                        const newSections = sections.map(s => s.id === section.id ? { ...s, ...updates } : s);
                                        onUpdateGrowthPlan({ ...proposal, customSections: newSections });
                                    }}
                                    onToggleLock={() => {
                                        if (!onUpdateGrowthPlan) return;
                                        const current = proposal.lockedSections || [];
                                        const next = current.includes(section.id) ? current.filter(x => x !== section.id) : [...current, section.id];
                                        onUpdateGrowthPlan({ ...proposal, lockedSections: next });
                                    }}
                                    onTogglePageBreak={() => {
                                        if (!onUpdateGrowthPlan) return;
                                        const current = proposal.pageBreaks || [];
                                        const next = current.includes(section.id) ? current.filter(x => x !== section.id) : [...current, section.id];
                                        onUpdateGrowthPlan({ ...proposal, pageBreaks: next });
                                    }}
                                    onDelete={() => {
                                        if (!onUpdateGrowthPlan) return;
                                        onUpdateGrowthPlan({ ...proposal, customSections: sections.filter(s => s.id !== section.id) });
                                    }}
                                    onAiRewrite={(text) => setAiRewriteText({ text, sectionId: section.id })}
                                    isFirst={idx === 0}
                                    isLast={idx === sections.length - 1}
                                />
                            ))}
                        </div>
                    </div>
                </main>
            </div>

            {isNamingVersion && (
                <div className="fixed inset-0 z-[10000] bg-slate-950/90 backdrop-blur-2xl flex items-center justify-center p-8">
                    <div className="w-full max-w-lg bg-slate-900 border border-indigo-500/30 rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95 duration-500">
                        <div className="flex justify-between items-center mb-10">
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight">Navngiv Version</h3>
                            <button onClick={() => setIsNamingVersion(false)} className="p-2 text-slate-500 hover:text-white transition-colors"><XMarkIcon className="h-6 w-6" /></button>
                        </div>
                        <div className="space-y-6">
                            <input 
                                autoFocus
                                type="text" 
                                value={versionName}
                                onChange={(e) => setVersionName(e.target.value)}
                                placeholder="f.eks. Strategi Revideret Q3"
                                className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-6 py-4 text-white focus:border-brand-primary outline-none transition-all font-mono"
                            />
                            <button 
                                onClick={async () => { 
                                    if (onSaveGrowthPlanVersion) {
                                        await onSaveGrowthPlanVersion(versionName);
                                    }
                                    setIsNamingVersion(false); 
                                }}
                                className="w-full py-5 bg-brand-primary text-white font-black uppercase tracking-widest rounded-xl hover:brightness-110 shadow-xl transition-all"
                            >
                                Gem Version Nu
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <GeminiEditorModal 
                isOpen={!!aiRewriteText} 
                onClose={() => setAiRewriteText(null)} 
                originalText={aiRewriteText?.text || ''} 
                onApply={(newText) => { 
                    if (aiRewriteText && onUpdateGrowthPlan) { 
                        const newSections = sections.map(s => s.id === aiRewriteText.sectionId ? { ...s, body: newText } : s);
                        onUpdateGrowthPlan({ ...proposal, customSections: newSections });
                        setAiRewriteText(null); 
                    } 
                }} 
                language={proposal.language} 
            />
        </div>
    );
};
