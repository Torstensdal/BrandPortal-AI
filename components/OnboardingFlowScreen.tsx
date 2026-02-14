
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Company, AppState, TeamMemberRole, ProspectProposal } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { CheckIcon } from './icons/CheckIcon';
import { CompanyDetailsScreen } from './CompanyDetailsScreen';
import { ArrowRightIcon } from './icons/ArrowRightIcon';
import { SyncIcon } from './icons/SyncIcon';
import { AiCreationIcon } from './icons/AiCreationIcon';
import { ProspectProposalDisplay } from './ProspectProposalDisplay';
import { formatAiContent, stripMarkdown, stripHtml, addMarkdownFormatting } from '../utils/formatters';
import { DocumentChartBarIcon } from './icons/DocumentChartBarIcon';
import { TrashIcon } from './icons/TrashIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { ConfirmationModal } from './ConfirmationModal';
import { FlagIcon } from './icons/FlagIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { GlobeAltIcon } from './icons/GlobeAltIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { TrophyIcon } from './icons/TrophyIcon';
import { ArrowUturnLeftIcon } from './icons/ArrowUturnLeftIcon';
import { DocumentPlusIcon } from './icons/DocumentPlusIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { ArrowTopRightOnSquareIcon } from './icons/ArrowTopRightOnSquareIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';
import { BuildingStorefrontIcon } from './icons/BuildingStorefrontIcon';
import { DocumentMagnifyingGlassIcon } from './icons/DocumentMagnifyingGlassIcon';
import { PartnerLogo } from './PartnerLogo';
import * as assetStorage from '../utils/assetStorage';
import { getPdfPreview } from '../utils/fileUtils';
import { ContentStrategyDisplay } from './ContentStrategyDisplay';
import { v4 as uuidv4 } from 'uuid';
import { ArchiveBoxIcon } from './icons/ArchiveBoxIcon';

interface OnboardingFlowScreenProps {
    token: string;
    company: Company;
    activeStep: AppState;
    onNavigate: (state: AppState) => void;
    onGenerateStrategy: (suggestions: string, duration: string) => Promise<void>;
    onUpdateStrategy: (newStrategy: string) => Promise<void>;
    isGenerating: boolean;
    currentUserRole?: TeamMemberRole;
    onGenerateImagesForStrategy: () => Promise<void>;
    isGeneratingImages: boolean;
    feedbackMessage: { type: 'success' | 'error', message: string } | null;
    onGenerateGrowthPlan: () => Promise<void>;
    onUpdateGrowthPlan: (proposal: ProspectProposal) => void;
    onSaveGrowthPlanVersion: (name: string) => void;
    onUpdateCompanyDetails: (details: Partial<Company>) => Promise<void>;
    onEnrichCompany: () => Promise<void>;
    isEnriching: boolean;
    onUploadFinancialReport: (file: File) => Promise<void>;
    onDeleteFinancialReport: () => Promise<void>;
    onDeleteMultipleGrowthPlanVersions?: (ids: string[]) => Promise<void>;
    onUploadMasterPlanPdf?: (file: File) => Promise<string>;
}

const PlanThumbnail: React.FC<{ plan: ProspectProposal }> = ({ plan }) => {
    return (
        <div className="w-full h-full bg-white p-6 flex flex-col gap-2 overflow-hidden shadow-inner rotate-1 group-hover:rotate-0 transition-transform">
            <div className="h-3 w-3/4 bg-slate-200 rounded"></div>
            <div className="h-1.5 w-full bg-slate-100 rounded"></div>
            <div className="h-1.5 w-full bg-slate-100 rounded"></div>
            <div className="h-1.5 w-5/6 bg-slate-100 rounded"></div>
            <div className="mt-4 flex flex-col gap-1.5 opacity-30">
                <div className="h-2 w-1/2 bg-slate-200 rounded"></div>
                <div className="h-1.5 w-full bg-slate-100 rounded"></div>
                <div className="h-1.5 w-full bg-slate-100 rounded"></div>
            </div>
            <div className="mt-auto flex justify-between items-end border-t border-slate-50 pt-2">
                <div className="h-4 w-4 bg-indigo-50 rounded-sm"></div>
                <div className="h-2 w-10 bg-slate-50 rounded"></div>
            </div>
        </div>
    );
};

const onboardingSteps: { state: AppState, labelKey: string }[] = [
    { state: 'onboarding_company_info', labelKey: 'nav_onboarding_info' },
    { state: 'onboarding_analysis', labelKey: 'nav_onboarding_analysis' },
    { state: 'onboarding_goals', labelKey: 'nav_onboarding_goals' },
    { state: 'onboarding_strategy', labelKey: 'nav_onboarding_strategy' },
    { state: 'onboarding_plan', labelKey: 'nav_onboarding_plan' },
];

export const OnboardingFlowScreen: React.FC<OnboardingFlowScreenProps> = (props) => {
    const { activeStep, company, onNavigate } = props;
    const { t } = useLanguage();
    const [showArchive, setShowArchive] = useState(false);
    const [selectedMasterIds, setSelectedMasterIds] = useState<Set<string>>(new Set());
    const [isDeletingBulk, setIsDeletingBulk] = useState(false);
    
    const [localGoals, setLocalGoals] = useState(() => stripHtml(company.goals || ''));
    const [selectedGoalKeys, setSelectedGoalKeys] = useState<Set<string>>(new Set());

    const predefinedGoals = [
        { id: 'financial', title: t('goal_financial_title'), desc: t('goal_financial_desc'), icon: ChartBarIcon },
        { id: 'market', title: t('goal_market_title'), desc: t('goal_market_desc'), icon: GlobeAltIcon },
        { id: 'esg', title: t('goal_esg_title'), desc: t('goal_esg_desc'), icon: SparklesIcon },
        { id: 'brand', title: t('goal_brand_title'), desc: t('goal_brand_desc'), icon: TrophyIcon },
    ];

    useEffect(() => {
        if (company.goals) {
            setLocalGoals(stripHtml(company.goals));
        }
    }, [company.goals]);

    const handleToggleGoal = (goalId: string) => {
        setSelectedGoalKeys(prev => {
            const newSet = new Set(prev);
            if (newSet.has(goalId)) newSet.delete(goalId);
            else newSet.add(goalId);
            return newSet;
        });
    };

    const handleSaveGoals = async () => {
        const cleanedRawText = localGoals.replace(/^Primære fokusområder:.*?\n\nUddybning:\n/s, '');
        const selectedTitles = predefinedGoals
            .filter(g => selectedGoalKeys.has(g.id))
            .map(g => g.title)
            .join(', ');
        
        const combinedGoals = selectedTitles 
            ? `Primære fokusområder: ${selectedTitles}.\n\nUddybning:\n${cleanedRawText}`
            : cleanedRawText;

        // Hierarkisk logik: Ændring af mål medfører behov for synkronisering downstream
        await props.onUpdateCompanyDetails({ 
            goals: combinedGoals,
            needsStrategySync: true,
            needsPlanSync: true
        });
        onNavigate('onboarding_strategy');
    };

    const toggleMasterSelection = (planId: string) => {
        const newSet = new Set(selectedMasterIds);
        if (newSet.has(planId)) newSet.delete(planId);
        else newSet.add(planId);
        return newSet;
    };

    const handleBulkDeleteMaster = async () => {
        if (props.onDeleteMultipleGrowthPlanVersions) {
            await props.onDeleteMultipleGrowthPlanVersions(Array.from(selectedMasterIds));
        }
        setSelectedMasterIds(new Set());
        setIsDeletingBulk(false);
    };

    const normalizedActiveStep = activeStep === 'company_details' ? 'onboarding_company_info' : activeStep;
    const activeIndex = onboardingSteps.findIndex(step => step.state === normalizedActiveStep);

    const currentSections = company.growthPlan?.customSections || [];
    const sectionCount = currentSections.length;
    const isAmputated = sectionCount > 0 && sectionCount < 21;

    // Strategisk Advarsel Logik - Kun vist hvis flagene er sat OG der rent faktisk er indhold der kan være forældet
    const showDnaWarning = company.needsAnalysisSync && company.description && activeStep === 'onboarding_analysis';
    const showGoalSyncWarning = company.needsStrategySync && company.contentStrategy && activeStep === 'onboarding_strategy';
    const showPlanSyncWarning = company.needsPlanSync && (sectionCount > 0 || company.masterPlanPdfAssetId) && activeStep === 'onboarding_plan';

    const renderStepContent = () => {
        if (activeStep === 'onboarding_company_info' || activeStep === 'company_details') {
            return (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <CompanyDetailsScreen 
                        {...props} 
                        onUpdateCompanyDetails={(details) => props.onUpdateCompanyDetails({ 
                            ...details, 
                            lastDnaChange: new Date().toISOString(),
                            needsAnalysisSync: true,
                            needsStrategySync: true,
                            needsPlanSync: true
                        })}
                    />
                    <div className="mt-12 flex justify-between items-center px-4 max-w-7xl mx-auto">
                        <button onClick={() => onNavigate('dashboard')} className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-brand-primary transition-colors flex items-center gap-2">
                            <ArrowUturnLeftIcon className="h-4 w-4" /> GÅ TILBAGE
                        </button>
                        <button 
                            onClick={() => onNavigate('onboarding_analysis')} 
                            style={{ backgroundColor: 'var(--brand-primary)' }} 
                            className="inline-flex items-center gap-4 px-12 py-5 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:brightness-110 shadow-2xl shadow-brand-primary/20 transition-all active:scale-95"
                        >
                            VIDERE TIL MARKEDSSITUATION <ArrowRightIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            );
        }
        switch (activeStep) {
            case 'onboarding_analysis': 
                return (
                    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 theme-transition">
                        {showDnaWarning && (
                            <div className="mb-10 p-6 bg-[#FFF9F0] border border-[#FFE7C4] rounded-full flex items-center justify-between gap-6 shadow-sm animate-in slide-in-from-top-4 duration-500 px-10">
                                <div className="flex items-center gap-5 text-brand-accent-amber">
                                    <div className="p-3 bg-[#FFE7C4]/30 rounded-2xl shadow-sm">
                                        <ExclamationTriangleIcon className="h-7 w-7 text-[#D97706]" />
                                    </div>
                                    <div>
                                        <h4 className="text-[13px] font-black uppercase tracking-tight text-[#0B1D39]">Analyse Forældet</h4>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#D97706] opacity-80">Profil & DNA er ændret. Gennemgå markedssituationen for at sikre overensstemmelse.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => props.onUpdateCompanyDetails({ needsAnalysisSync: false })}
                                    className="px-10 py-3.5 bg-[#D97706] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-brand-accent-amber/30 hover:brightness-110 transition-all border border-[#D97706]/20 active:scale-95"
                                >
                                    Bekræft Analyse
                                </button>
                            </div>
                        )}
                        <div className="mb-10">
                            <h2 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tighter mb-1">{t('nav_onboarding_analysis')}</h2>
                            <p className="text-[var(--text-muted)] font-bold text-xs uppercase tracking-widest opacity-60">Strategisk Situationsanalyse</p>
                        </div>
                        
                        <div className="bg-white rounded-[2.5rem] border border-[var(--border-primary)] shadow-2xl overflow-hidden">
                            <div className="flex flex-col">
                                <div className="bg-slate-50/50 border-b border-slate-100 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="flex-shrink-0">
                                            <PartnerLogo 
                                                logoUrl={company.brandKit?.logoAssetId}
                                                partnerName={company.name}
                                                website={company.website}
                                                className="h-20 w-20 rounded-[1.5rem] shadow-2xl border border-white p-3 bg-white"
                                            />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black text-[#0B1D39] uppercase tracking-tight leading-none mb-2">{stripMarkdown(company.name)}</h3>
                                            <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em] mt-1">Virksomhedsanalyse</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 px-6 py-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                                        <GlobeAltIcon className="h-4 w-4 text-brand-primary" />
                                        <div>
                                            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">{t('companyDetails_industryLabel')}</p>
                                            <p className="text-xs font-black text-[#0B1D39] uppercase tracking-tight">{company.industry || "Ikke defineret"}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-10 md:p-14 md:pt-10 relative bg-white">
                                    <div className="absolute left-10 md:left-12 top-10 bottom-10 w-0.5 bg-brand-primary/5 rounded-full hidden md:block"></div>
                                    
                                    <div className="md:pl-12">
                                        <article className="prose prose-slate max-w-none">
                                            <div 
                                                className="ai-rendered-content"
                                                dangerouslySetInnerHTML={{ 
                                                    __html: formatAiContent(addMarkdownFormatting(company.description || '')) 
                                                }} 
                                            />
                                        </article>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-12 flex justify-between items-center px-4">
                            <button onClick={() => onNavigate('onboarding_company_info')} className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-brand-primary transition-colors flex items-center gap-2">
                                <ArrowUturnLeftIcon className="h-4 w-4" /> GÅ TILBAGE
                            </button>
                            <button 
                                onClick={() => onNavigate('onboarding_goals')} 
                                style={{ backgroundColor: 'var(--brand-primary)' }} 
                                className="inline-flex items-center gap-4 px-12 py-5 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:brightness-110 shadow-2xl shadow-brand-primary/20 transition-all active:scale-95"
                            >
                                VIDERE TIL MÅLSÆTNINGER <ArrowRightIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                );
            case 'onboarding_goals':
                return (
                    <div className="max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 theme-transition">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-3 bg-brand-primary/20 rounded-2xl text-brand-primary"><FlagIcon className="h-7 w-7" /></div>
                            <h2 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tight">{t('onboarding_goals_title')}</h2>
                        </div>
                        <p className="text-[var(--text-secondary)] mb-10">{t('onboarding_goals_subtitle')}</p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                            {predefinedGoals.map(goal => {
                                const isSelected = selectedGoalKeys.has(goal.id);
                                return (
                                    <button
                                        key={goal.id}
                                        onClick={() => handleToggleGoal(goal.id)}
                                        style={isSelected ? { backgroundColor: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' } : {}}
                                        className={`p-6 rounded-[2rem] border-2 text-left transition-all duration-300 group ${isSelected ? 'shadow-xl shadow-indigo-600/30 scale-[1.02]' : 'bg-[var(--bg-card)] border-[var(--border-primary)] hover:border-brand-primary/30'}`}
                                    >
                                        <div className={`p-3 rounded-xl mb-4 w-fit transition-colors ${isSelected ? 'bg-white/20 text-white' : 'bg-[var(--bg-card-secondary)] text-brand-primary group-hover:text-brand-primary'}`}>
                                            <goal.icon className="h-6 w-6" />
                                        </div>
                                        <h4 className={`font-black uppercase tracking-tight mb-1 ${isSelected ? 'text-white' : 'text-[var(--text-primary)]'}`}>{goal.title}</h4>
                                        <p className={`text-[10px] font-bold leading-relaxed ${isSelected ? 'text-indigo-100' : 'text-[var(--text-muted)]'}`}>{goal.desc}</p>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="p-10 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[3rem] shadow-2xl space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-brand-primary uppercase tracking-widest mb-2 ml-1">Uddybning af jeres KPI'er</label>
                                <textarea 
                                    value={stripHtml(localGoals)} 
                                    onChange={(e) => setLocalGoals(e.target.value)}
                                    rows={8}
                                    className="w-full bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-3xl p-6 text-[var(--text-primary)] text-lg placeholder-[var(--text-muted)] outline-none focus:border-brand-primary transition-all shadow-inner leading-relaxed"
                                    placeholder="Beskriv jeres specifikke succeskriterier..."
                                />
                            </div>
                        </div>
                        
                        <div className="mt-12 flex justify-between items-center px-4">
                            <button onClick={() => onNavigate('onboarding_analysis')} className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-brand-primary transition-colors flex items-center gap-2">
                                <ArrowUturnLeftIcon className="h-4 w-4" /> GÅ TILBAGE
                            </button>
                            <button 
                                onClick={handleSaveGoals}
                                style={{ backgroundColor: 'var(--brand-primary)' }}
                                className="inline-flex items-center gap-4 px-12 py-5 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:brightness-110 shadow-2xl shadow-brand-primary/20 transition-all active:scale-95"
                            >
                                VIDERE TIL INDHOLDSSTRATEGI <ArrowRightIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                );
            case 'onboarding_strategy': 
                return (
                    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 theme-transition">
                        {showGoalSyncWarning && (
                            <div className="mb-10 p-6 bg-[#F0F2FF] border border-[#D1D8FF] rounded-full flex items-center justify-between gap-6 shadow-sm animate-in zoom-in-95 px-10">
                                <div className="flex items-center gap-5">
                                    <div className="p-3 bg-white rounded-full shadow-sm text-brand-primary">
                                        <SyncIcon className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h4 className="text-[13px] font-black uppercase tracking-tight text-[#0B1D39]">Opdateret Målsætning registreret</h4>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-brand-primary opacity-80">Vi anbefaler at regenerere strategien for at sikre alignment.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        props.onGenerateStrategy(company.goals || '', '6 måneder');
                                        props.onUpdateCompanyDetails({ needsStrategySync: false });
                                    }}
                                    className="px-10 py-3.5 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-brand-primary/30 hover:brightness-110 transition-all active:scale-95"
                                >
                                    Opdater Strategi Nu
                                </button>
                            </div>
                        )}
                        <h2 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-8">{t('nav_onboarding_strategy')}</h2>
                        {company.contentStrategy ? (
                            <div className="space-y-10">
                                <ContentStrategyDisplay
                                    strategy={company.contentStrategy}
                                    isLocked={company.isContentStrategyLocked || false}
                                    onSave={async (newS) => {
                                        await props.onUpdateStrategy(newS);
                                        // Ved manuel gemning nulstilles sync behov for strategi, men planen skal nu også synces
                                        await props.onUpdateCompanyDetails({ 
                                            needsStrategySync: false,
                                            needsPlanSync: true 
                                        });
                                    }}
                                    onToggleLock={() => props.onUpdateCompanyDetails({ isContentStrategyLocked: !company.isContentStrategyLocked })}
                                    onSaveVersion={async (name) => {
                                        const versions = company.savedContentStrategies || [];
                                        const newVersion = { id: uuidv4(), name, content: company.contentStrategy!, createdAt: new Date().toISOString() };
                                        await props.onUpdateCompanyDetails({ savedContentStrategies: [...versions, newVersion] });
                                    }}
                                    versions={company.savedContentStrategies}
                                    onRestoreVersion={async (content) => {
                                        await props.onUpdateStrategy(content);
                                    }}
                                    onDeleteVersion={async (id) => {
                                        const versions = company.savedContentStrategies?.filter(v => v.id !== id) || [];
                                        await props.onUpdateCompanyDetails({ savedContentStrategies: versions });
                                    }}
                                    isAdmin={props.currentUserRole === 'admin'}
                                />
                                <div className="mt-12 flex justify-between items-center px-4">
                                    <button onClick={() => onNavigate('onboarding_goals')} className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-brand-primary transition-colors flex items-center gap-2">
                                        <ArrowUturnLeftIcon className="h-4 w-4" /> GÅ TILBAGE
                                    </button>
                                    <div className="flex gap-4">
                                        <button 
                                            onClick={() => {
                                                props.onGenerateStrategy(company.goals || '', '6 måneder');
                                                props.onUpdateCompanyDetails({ needsStrategySync: false });
                                            }} 
                                            disabled={props.isGenerating || company.isContentStrategyLocked}
                                            className="px-8 py-4 bg-[var(--bg-app)] text-[var(--text-secondary)] font-black uppercase tracking-widest rounded-2xl hover:bg-[var(--bg-card-hover)] border border-[var(--border-primary)] transition-all flex items-center gap-3 disabled:opacity-50"
                                        >
                                            <SyncIcon className={`h-4 w-4 ${props.isGenerating ? 'animate-spin' : ''}`} /> 
                                            <span>{props.isGenerating ? t('status_processing') : t('strategy_regenerate_button')}</span>
                                        </button>
                                        <button 
                                            onClick={() => onNavigate('onboarding_plan')} 
                                            style={{ backgroundColor: 'var(--brand-primary)' }} 
                                            className="inline-flex items-center gap-4 px-12 py-5 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:brightness-110 shadow-2xl shadow-brand-primary/20 transition-all active:scale-95"
                                        >
                                            VIDERE TIL MASTER VÆKSTPLAN <ArrowRightIcon className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-20 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[3rem] shadow-2xl text-center">
                                <AiCreationIcon className="h-16 w-16 text-brand-primary mx-auto mb-6 opacity-40" />
                                <p className="text-[var(--text-secondary)] mb-10 max-w-md mx-auto">Vi er klar til at generere din indholdsstrategi baseret på dine mål.</p>
                                <button 
                                    onClick={() => {
                                        props.onGenerateStrategy(company.goals || '', '6 måneder');
                                        props.onUpdateCompanyDetails({ needsStrategySync: false });
                                    }} 
                                    disabled={props.isGenerating}
                                    style={{ backgroundColor: 'var(--brand-primary)' }}
                                    className="px-12 py-5 text-white font-black uppercase tracking-widest rounded-2xl hover:brightness-110 shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 mx-auto"
                                >
                                    {props.isGenerating ? <SyncIcon className="h-5 w-5 animate-spin" /> : null}
                                    <span>{props.isGenerating ? t('status_processing') : t('strategy_generate_button')}</span>
                                </button>
                                <div className="mt-12 flex justify-start items-center px-10">
                                    <button onClick={() => onNavigate('onboarding_goals')} className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-brand-primary transition-colors flex items-center gap-2">
                                        <ArrowUturnLeftIcon className="h-4 w-4" /> GÅ TILBAGE
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                );
            case 'onboarding_plan': 
                if (showArchive) {
                    const saved = company.savedGrowthPlans || [];
                    return (
                        <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in duration-500 theme-transition">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h2 className="text-3xl font-black text-[var(--text-primary)] uppercase tracking-tight">{t('companyDetails_masterPlan_title')} Arkiv</h2>
                                    <p className="text-[var(--text-muted)] text-xs font-black uppercase tracking-widest mt-1">Tidligere gemte versioner</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    {selectedMasterIds.size > 0 && (
                                        <button 
                                            onClick={() => setIsDeletingBulk(true)}
                                            className="px-6 py-2.5 bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
                                        >
                                            <TrashIcon className="h-4 w-4" /> Slet valgte ({selectedMasterIds.size})
                                        </button>
                                    )}
                                    <button onClick={() => setShowArchive(false)} className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:text-brand-primary-hover transition-colors">← Tilbage til plan</button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {saved.map(plan => {
                                    const isSelected = selectedMasterIds.has(plan.id);
                                    return (
                                        <div 
                                            key={plan.id} 
                                            onClick={() => toggleMasterSelection(plan.id)}
                                            className={`relative bg-[var(--bg-card)] border overflow-hidden rounded-[2.5rem] shadow-2xl flex flex-col cursor-pointer transition-all ${isSelected ? 'border-brand-accent-teal bg-brand-accent-teal/5' : 'border-[var(--border-primary)] hover:border-brand-accent-teal/30'}`}
                                        >
                                            <div className="aspect-[4/3] bg-[var(--bg-card-secondary)] border-b border-[var(--border-primary)] relative overflow-hidden group">
                                                <PlanThumbnail plan={plan} />
                                                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card-secondary)] via-transparent to-transparent opacity-40"></div>
                                                <div className={`absolute top-6 left-6 h-6 w-6 rounded-lg border-2 transition-all flex items-center justify-center z-10 ${isSelected ? 'bg-brand-accent-teal border-brand-accent-teal text-white' : 'border-[var(--border-primary)] bg-[var(--bg-card-secondary)]'}`}>
                                                    {isSelected && <CheckIcon className="h-4 w-4" />}
                                                </div>
                                            </div>
                                            
                                            <div className="p-8 flex flex-col flex-1">
                                                <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-8 line-clamp-2">{stripMarkdown(plan.name)}</h3>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); props.onUpdateGrowthPlan(plan); setShowArchive(false); }}
                                                    style={{ color: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' }}
                                                    className="w-full py-4 bg-brand-primary/10 border text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-primary hover:text-white transition-all shadow-xl mt-auto"
                                                >
                                                    Gendan denne version
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <ConfirmationModal isOpen={isDeletingBulk} onClose={() => setIsDeletingBulk(false)} onConfirm={handleBulkDeleteMaster} title="Slet versioner?" message="Denne handling kan ikke fortrydes." confirmButtonText="Slet alt" variant="danger" />
                        </div>
                    );
                }

                if (sectionCount === 0 && !company.masterPlanPdfAssetId) {
                    return (
                        <div className="max-w-3xl mx-auto space-y-12 theme-transition">
                            <div className="text-center py-20 bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[3rem] shadow-2xl">
                                <DocumentChartBarIcon className="h-20 w-20 text-brand-primary mx-auto mb-6 opacity-40" />
                                <h2 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-2">{t('companyDetails_masterPlan_title')}</h2>
                                <p className="text-[var(--text-secondary)] max-w-md mx-auto mb-10">
                                    Generer den komplette 21-trins forretningsplan, eller upload jeres egen originale PDF.
                                </p>
                                <div className="flex flex-col sm:flex-row justify-center gap-4 px-10">
                                    <button 
                                        onClick={() => {
                                            props.onGenerateGrowthPlan();
                                            props.onUpdateCompanyDetails({ needsPlanSync: false });
                                        }} 
                                        disabled={props.isGenerating}
                                        style={{ backgroundColor: 'var(--brand-primary)' }}
                                        className="flex-1 inline-flex items-center justify-center gap-3 px-8 py-5 text-white font-black uppercase tracking-widest rounded-2xl hover:brightness-110 shadow-xl transition-all disabled:opacity-50"
                                    >
                                        {props.isGenerating ? <SyncIcon className="h-4 w-4 animate-spin" /> : <AiCreationIcon className="h-4 w-4" />}
                                        <span>{props.isGenerating ? t('status_processing') : t('onboarding_generate_masterplan_button')}</span>
                                    </button>
                                    
                                    <button 
                                        onClick={() => { if(props.onUploadMasterPlanPdf) { const input = document.createElement('input'); input.type = 'file'; input.accept = 'application/pdf'; input.onchange = (e) => { const file = (e.target as HTMLInputElement).files?.[0]; if(file) props.onUploadMasterPlanPdf!(file); }; input.click(); } }}
                                        style={{ color: 'var(--text-secondary)', borderColor: 'var(--border-primary)' }}
                                        className="flex-1 inline-flex items-center justify-center gap-3 px-8 py-5 bg-[var(--bg-app)] border text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-[var(--bg-card-hover)] shadow-xl"
                                    >
                                        <DocumentPlusIcon className="h-5 w-5" />
                                        <span>{t('doc_upload_pdf')}</span>
                                    </button>
                                </div>
                                <div className="mt-12 flex justify-start items-center px-10">
                                    <button onClick={() => onNavigate('onboarding_strategy')} className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-brand-primary transition-colors flex items-center gap-2">
                                        <ArrowUturnLeftIcon className="h-4 w-4" /> GÅ TILBAGE
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                }
                
                const effectiveProposal = company.growthPlan || ({
                    id: 'master-plan-placeholder',
                    name: `Master Plan: ${company.name}`,
                    prospectId: company.id,
                    language: company.language || 'da',
                    prospectName: company.name,
                    prospectWebsite: company.website,
                    companyName: company.name,
                    brandColors: { primary: '#6366f1', secondary: '#0f172a' },
                    introduction: { title: "Strategisk Dokumentation", executiveSummary: "Dette dokument er uploadet manuelt som en PDF masterplan." },
                    platformOverview: { title: "", items: [] },
                    analysis: { title: "", icp: { focus: [], decisionMakers: [] }, toneOfVoice: { description: "", dos: [], donts: [] } },
                    strategy: { pillars: [] },
                    customSections: []
                } as ProspectProposal);

                const virtualCompanyPartner = {
                    ...company,
                    originalPlanPdfAssetId: company.masterPlanPdfAssetId
                } as any;

                return (
                    <div className="-mx-8 sm:-mx-6 lg:-mx-8">
                        {showPlanSyncWarning && (
                            <div className="max-w-4xl mx-auto mb-10 p-6 bg-[#FFF9F0] border border-[#FFE7C4] rounded-full flex items-center justify-between gap-6 shadow-sm animate-in slide-in-from-top-4 duration-500 px-10">
                                <div className="flex items-center gap-5 text-brand-accent-amber">
                                    <div className="p-3 bg-[#FFE7C4]/30 rounded-2xl shadow-sm">
                                        <ExclamationTriangleIcon className="h-7 w-7 text-[#D97706]" />
                                    </div>
                                    <div>
                                        <h4 className="text-[13px] font-black uppercase tracking-tight text-[#0B1D39]">Master Vækstplan Forældet</h4>
                                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#D97706] opacity-80">Overordnede målsætninger eller strategi er ændret. Vi anbefaler en ny generering.</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        props.onGenerateGrowthPlan();
                                        props.onUpdateCompanyDetails({ needsPlanSync: false });
                                    }}
                                    className="px-10 py-3.5 bg-[#D97706] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-brand-accent-amber/30 hover:brightness-110 transition-all border border-[#D97706]/20 active:scale-95"
                                >
                                    Opdater Masterplan
                                </button>
                            </div>
                        )}
                        {isAmputated && (
                            <div className="max-w-4xl mx-auto mb-8 bg-brand-accent-amber/10 border border-brand-accent-amber/30 p-6 rounded-[2rem] flex items-center justify-between animate-in slide-in-from-top duration-500 shadow-xl">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-brand-accent-amber/20 rounded-2xl"><ExclamationTriangleIcon className="h-6 w-6 text-brand-accent-amber" /></div>
                                    <div>
                                        <p className="text-xs font-black text-brand-accent-amber uppercase tracking-widest">{t('doc_upgrade_alert_status')}</p>
                                        <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">{t('doc_upgrade_alert', { count: sectionCount })}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { if(window.confirm("Vil du opgradere til den fulde 21-trins plan?")) props.onGenerateGrowthPlan(); }}
                                    style={{ backgroundColor: 'var(--brand-accent-amber)' }}
                                    className="px-8 py-3 text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl hover:brightness-110 transition-all border border-brand-accent-amber/20"
                                >
                                    {t('doc_upgrade_button')}
                                </button>
                            </div>
                        )}

                        <ProspectProposalDisplay 
                            key={effectiveProposal.id}
                            proposal={effectiveProposal} 
                            onGenerateAnother={() => {}}
                            onUpdateGrowthPlan={props.onUpdateGrowthPlan} 
                            onSaveGrowthPlanVersion={props.onSaveGrowthPlanVersion} 
                            isInternalPlan={true} 
                            onFinishOnboarding={() => onNavigate('dashboard')} 
                            onResetToTemplate={() => { if(window.confirm("Er du sikker? Dette vil overskrive din nuværende plan.")) props.onGenerateGrowthPlan(); }}
                            onShowArchive={() => setShowArchive(true)}
                            archiveCount={(company.savedGrowthPlans || []).length}
                            partner={virtualCompanyPartner}
                            onUploadOriginalPdf={props.onUploadMasterPlanPdf}
                        />

                        <div className="mt-12 flex justify-between items-center px-4 max-w-4xl mx-auto pb-12">
                            <button onClick={() => onNavigate('onboarding_strategy')} className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-brand-primary transition-colors flex items-center gap-2">
                                <ArrowUturnLeftIcon className="h-4 w-4" /> GÅ TILBAGE
                            </button>
                            <button 
                                onClick={() => onNavigate('dashboard')} 
                                style={{ backgroundColor: 'var(--brand-primary)' }} 
                                className="inline-flex items-center gap-4 px-12 py-5 text-white font-black uppercase tracking-[0.2em] text-xs rounded-2xl hover:brightness-110 shadow-2xl shadow-brand-primary/20 transition-all active:scale-95"
                            >
                                GÅ TIL OVERBLIK <ArrowRightIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                );
            default: return <div className="text-center py-20 text-[var(--text-muted)] font-black uppercase tracking-widest">{t('status_processing')}</div>;
        }
    };

    return (
        <div className="max-w-7xl mx-auto my-8 px-4 sm:px-6 lg:px-8 pb-32">
            <nav aria-label="Progress" className="mb-20 no-print flex justify-center">
                <ol role="list" className="flex items-center">
                    {onboardingSteps.map((step, stepIdx) => (
                        <li key={step.labelKey} className={`relative min-w-[160px] text-center ${stepIdx !== onboardingSteps.length - 1 ? 'mr-4 sm:mr-8' : ''}`}>
                            {stepIdx < activeIndex ? (
                                <>
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="h-0.5 w-full" style={{ backgroundColor: 'var(--brand-primary)' }} />
                                    </div>
                                    <button
                                        onClick={() => onNavigate(step.state)}
                                        style={{ backgroundColor: 'var(--brand-primary)' }}
                                        className="relative flex h-8 w-8 items-center justify-center rounded-full hover:brightness-110 transition-all shadow-lg"
                                    >
                                        <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                                    </button>
                                </>
                            ) : stepIdx === activeIndex ? (
                                <>
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="h-0.5 w-full bg-[var(--border-primary)]" />
                                    </div>
                                    <button 
                                        onClick={() => onNavigate(step.state)}
                                        className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-xl hover:brightness-110 transition-all"
                                        style={{ borderColor: 'var(--brand-primary)', backgroundColor: 'var(--brand-primary)' }}
                                    >
                                        <span className="h-2.5 w-2.5 rounded-full bg-white animate-pulse" />
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                        <div className="h-0.5 w-full bg-[var(--border-primary)]" />
                                    </div >
                                    <button 
                                        onClick={() => onNavigate(step.state)}
                                        className="group relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-[var(--border-primary)] bg-[var(--bg-card)] hover:border-brand-primary/50 transition-all"
                                    >
                                        <span className="h-2.5 w-2.5 rounded-full bg-transparent" />
                                    </button>
                                </>
                            )}
                            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-max text-center">
                                <button 
                                    onClick={() => onNavigate(step.state)}
                                    className={`text-[9px] font-black uppercase tracking-widest transition-colors ${stepIdx <= activeIndex ? 'text-brand-primary' : 'text-[var(--text-muted)] hover:text-brand-primary'}`} 
                                    style={stepIdx <= activeIndex ? { color: 'var(--brand-primary)' } : {}}
                                >
                                    {stripMarkdown(t(step.labelKey))}
                                </button>
                            </div>
                        </li>
                    ))}
                </ol>
            </nav>
            {renderStepContent()}
        </div>
    );
};
