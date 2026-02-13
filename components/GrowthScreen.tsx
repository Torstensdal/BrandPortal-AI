
import React, { useState, useMemo, useEffect } from 'react';
import {
  Company, Language, PhotoStudioStyle, BrandKit, JobListing,
  StrategicInitiative, Persona, InteractiveTool, LaunchpadAction, TeamMemberRole,
  Solution, SuccessStory, IndustryPage, SavedLandingPage, AssetMetadata
} from '../types';
import { useLanguage } from '../context/LanguageContext';
import { formatAiContent, stripMarkdown } from '../utils/formatters';
import { ContentStrategyDisplay } from './ContentStrategyDisplay';
import { SaaSRoadmap } from './SaaSRoadmap';
import { IndustryPageModal } from './IndustryPageModal';
import { PhotoStudio } from './PhotoStudio';
import * as assetStorage from '../utils/assetStorage';

// Icons
import { BuildingStorefrontIcon } from './icons/BuildingStorefrontIcon';
import { BrainIcon } from './icons/BrainIcon';
import { TrophyIcon } from './icons/TrophyIcon';
import { MapIcon } from './icons/MapIcon';
import { CameraIcon } from './icons/CameraIcon';
import { DocumentIcon } from './icons/DocumentIcon';
import { PartnerLogo } from './PartnerLogo';
import { PlusIcon } from './icons/PlusIcon';
import { EyeIcon } from './icons/EyeIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { StarIcon } from './icons/StarIcon';

interface GrowthScreenProps {
  company: Company;
  onGenerateIndustryPage: (industry: string, talkingPoints: string, assetIds: string[], targetLanguage: Language) => Promise<void>;
  onEnhanceImage: (assetId: string, prompt: string) => Promise<void>;
  onUpdateStrategy: (newStrategy: string) => Promise<void>;
  onToggleStrategyLock: () => Promise<void>;
  onSaveStrategyVersion: (name: string) => Promise<void>;
  onRestoreStrategyVersion: (content: string) => Promise<void>;
  onDeleteStrategyVersion: (id: string) => Promise<void>;
  onUpdateRoadmapProgress: (updatedRoadmapProgress: string[]) => void;
  onPreviewPage: (id: string) => void;
  onSuccessStoryAction?: (partnerId: string, storyId: string, action: 'approve' | 'feature' | 'reject') => Promise<void>;
}

const PagePreviewCard: React.FC<{ page: SavedLandingPage; company: Company; onPreview: () => void }> = ({ page, company, onPreview }) => {
    const [heroUrl, setHeroUrl] = useState<string | null>(null);

    useEffect(() => {
        const bg = page.content?.hero?.backgroundImageUrl;
        if (bg?.startsWith('asset:')) {
            const assetId = bg.replace('asset:', '');
            assetStorage.getAsset(assetId).then(file => {
                if (file) setHeroUrl(URL.createObjectURL(file));
            });
        } else if (bg) {
            setHeroUrl(bg);
        }
    }, [page.content?.hero?.backgroundImageUrl]);

    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[2.5rem] shadow-2xl flex flex-col group hover:border-brand-primary/50 transition-all overflow-hidden">
            <div className="relative aspect-video bg-[var(--bg-card-secondary)] overflow-hidden border-b border-[var(--border-primary)]">
                {heroUrl ? (
                    <img src={heroUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700" alt="" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center opacity-20">
                        <DocumentIcon className="h-12 w-12" />
                    </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-card)] via-transparent to-transparent opacity-60"></div>
                <div className="absolute bottom-4 left-4 flex items-center gap-2">
                    <PartnerLogo logoUrl={company.brandKit?.logoAssetId} partnerName={company.name} className="h-8 w-8 rounded-lg shadow-2xl border border-white/10" />
                </div>
            </div>
            <div className="p-8 flex flex-col flex-1">
                <div className="mb-6 flex-grow">
                    <h4 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-2 truncate group-hover:text-brand-primary transition-colors">
                        {stripMarkdown(page.name)}
                    </h4>
                    <span className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest bg-[var(--bg-card-secondary)] px-2 py-0.5 rounded-full border border-[var(--border-primary)]">
                        {stripMarkdown(page.industry)}
                    </span>
                </div>
                <button onClick={onPreview} className="w-full py-4 bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-primary hover:text-white transition-all shadow-xl active:scale-95">
                    Se Side
                </button>
            </div>
        </div>
    );
};

const SuccessStoriesManager: React.FC<{ company: Company, onAction?: any }> = ({ company, onAction }) => {
    const { t } = useLanguage();
    const allStories = useMemo(() => {
        const stories: (SuccessStory & { partnerId: string, partnerName: string; partnerLogo?: string })[] = [];
        company.partners.forEach((p: any) => {
            if (p.successStories) {
                p.successStories.forEach((s: any) => {
                    stories.push({ ...s, partnerId: p.id, partnerName: p.name, partnerLogo: p.logoUrl });
                });
            }
        });
        return stories.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
    }, [company.partners]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {allStories.length > 0 ? allStories.map(story => (
                <div key={story.id} className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-8 rounded-[3rem] shadow-2xl group hover:border-brand-primary/30 transition-all flex flex-col">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-4">
                            <PartnerLogo logoUrl={story.partnerLogo} partnerName={story.partnerName} className="h-10 w-10 rounded-xl" />
                            <div>
                                <h4 className="font-black text-xl text-[var(--text-primary)] uppercase tracking-tight leading-none mb-2">{stripMarkdown(story.projectName)}</h4>
                                <p className="text-xs text-brand-primary font-black uppercase tracking-widest">{stripMarkdown(story.partnerName)}</p>
                            </div>
                        </div>
                        <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest ${story.status === 'approved' || story.status === 'featured' ? 'bg-brand-accent-green/20 text-brand-accent-green border border-brand-accent-green/30' : (story.status === 'new' ? 'bg-brand-accent-amber/20 text-brand-accent-amber border border-brand-accent-amber/30' : 'bg-[var(--bg-card-secondary)] text-[var(--text-muted)]')}`}>
                            {story.status}
                        </span>
                    </div>
                    <div className="text-sm text-[var(--text-secondary)] leading-relaxed italic mb-8 border-l-4 border-[var(--border-primary)] pl-6 py-2 flex-grow">
                        "{stripMarkdown(story.description)}"
                    </div>
                    
                    {onAction && story.status === 'new' && (
                        <div className="flex gap-2 pt-6 border-t border-[var(--border-primary)]/50">
                            <button onClick={() => onAction(story.partnerId, story.id, 'approve')} className="flex-1 py-3 bg-brand-accent-green text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:brightness-110 flex items-center justify-center gap-2"><CheckCircleIcon className="h-4 w-4" /> Godkend</button>
                            <button onClick={() => onAction(story.partnerId, story.id, 'reject')} className="px-4 py-3 bg-[var(--bg-app)] text-brand-accent-red text-[10px] font-black uppercase rounded-xl hover:bg-brand-accent-red hover:text-white transition-all"><XMarkIcon className="h-4 w-4" /></button>
                        </div>
                    )}
                    {onAction && story.status === 'approved' && (
                        <button onClick={() => onAction(story.partnerId, story.id, 'feature')} className="w-full py-3 bg-brand-accent-purple text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:brightness-110 flex items-center justify-center gap-2"><StarIcon className="h-4 w-4" /> Fremhæv i Portal</button>
                    )}
                </div>
            )) : (
                <div className="col-span-full text-center py-32 border-2 border-dashed border-[var(--border-primary)] rounded-[3rem] bg-[var(--bg-card)]/40">
                    <TrophyIcon className="h-16 w-16 text-[var(--text-muted)] mx-auto mb-6 opacity-20"/>
                    <p className="text-[var(--text-muted)] font-black uppercase tracking-[0.3em]">{t('growth_no_success_stories')}</p>
                </div>
            )}
        </div>
    );
};

export const GrowthScreen: React.FC<GrowthScreenProps> = (props) => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState<'industry' | 'strategy' | 'photostudio' | 'success' | 'roadmap'>('industry');
    const [isPageModalOpen, setIsPageModalOpen] = useState(false);

    return (
        <div className="py-12 max-w-7xl mx-auto px-6 sm:px-8 theme-transition">
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-black text-[var(--text-primary)] tracking-tighter uppercase mb-4">{stripMarkdown(t('growth_title'))}</h1>
                <p className="text-[var(--text-secondary)] max-w-2xl mx-auto text-lg font-medium leading-relaxed opacity-70">{stripMarkdown(t('growth_subtitle'))}</p>
            </div>

            <nav className="flex justify-center items-center gap-2 bg-[var(--bg-card)] p-1.5 rounded-[2rem] border border-[var(--border-primary)] mb-16 max-w-4xl mx-auto shadow-2xl overflow-x-auto no-scrollbar">
                {[
                    { id: 'industry', icon: BuildingStorefrontIcon, label: t('growth_tab_industry') },
                    { id: 'photostudio', icon: CameraIcon, label: 'Photo Studio' },
                    { id: 'strategy', icon: BrainIcon, label: t('growth_tab_strategy') },
                    { id: 'success', icon: TrophyIcon, label: t('growth_tab_success') },
                    { id: 'roadmap', icon: MapIcon, label: t('growth_tab_roadmap') }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex-shrink-0 flex items-center justify-center gap-3 py-4 px-6 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-brand-primary text-white shadow-xl' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}
                    >
                        <tab.icon className="h-4 w-4"/>
                        <span className="whitespace-nowrap">{stripMarkdown(tab.label)}</span>
                    </button>
                ))}
            </nav>

            <div className="animate-in fade-in duration-700">
                {activeTab === 'industry' && (
                    <div className="space-y-12">
                        <div className="flex justify-between items-end border-b border-[var(--border-primary)] pb-6">
                            <div>
                                <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight">Branche-sider</h3>
                                <p className="text-xs text-[var(--text-muted)] font-bold uppercase tracking-widest mt-1">Generer niche-specifikke kampagnesider</p>
                            </div>
                            <button onClick={() => setIsPageModalOpen(true)} className="px-8 py-3.5 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:brightness-110 shadow-xl shadow-brand-primary/20 transition-all flex items-center gap-2">
                                <PlusIcon className="h-4 w-4" /> Generer Ny Side
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {(props.company.savedLandingPages || []).map(page => (
                                <PagePreviewCard key={page.id} page={page} company={props.company} onPreview={() => props.onPreviewPage(page.id)} />
                            ))}
                            {(props.company.savedLandingPages || []).length === 0 && (
                                <div className="col-span-full text-center py-24 border-2 border-dashed border-[var(--border-primary)] rounded-[3rem] bg-[var(--bg-card)]/40">
                                    <p className="text-[var(--text-muted)] font-black uppercase tracking-[0.3em]">{t('growth_no_landing_pages')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === 'photostudio' && <PhotoStudio mediaLibrary={props.company.mediaLibrary || []} onEnhance={props.onEnhanceImage} />}
                {activeTab === 'strategy' && (
                    <div className="max-w-4xl mx-auto">
                        <ContentStrategyDisplay 
                            strategy={props.company.contentStrategy || ''} 
                            isLocked={props.company.isContentStrategyLocked || false}
                            onSave={props.onUpdateStrategy} 
                            onToggleLock={props.onToggleStrategyLock}
                            onSaveVersion={props.onSaveStrategyVersion}
                            versions={props.company.savedContentStrategies}
                            onRestoreVersion={props.onRestoreStrategyVersion}
                            onDeleteVersion={props.onDeleteStrategyVersion}
                            isAdmin={true} 
                        />
                    </div>
                )}
                {activeTab === 'success' && <SuccessStoriesManager company={props.company} onAction={props.onSuccessStoryAction} />}
                {activeTab === 'roadmap' && <SaaSRoadmap company={props.company} onUpdateProgress={props.onUpdateRoadmapProgress} />}
            </div>

            <IndustryPageModal 
                isOpen={isPageModalOpen} 
                onClose={() => setIsPageModalOpen(false)} 
                onGenerate={props.onGenerateIndustryPage} 
                mediaLibrary={props.company.mediaLibrary || []}
                language={props.company.language || 'da'}
            />
        </div>
    );
};
