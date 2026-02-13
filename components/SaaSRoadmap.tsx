
import React, { useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Company } from '../types';
import { ServerIcon } from './icons/ServerIcon';
import { CreditCardIcon } from './icons/CreditCardIcon';
import { RocketLaunchIcon } from './icons/RocketLaunchIcon';
import { GlobeAltIcon } from './icons/GlobeAltIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { ShieldCheckIcon } from './icons/ShieldCheckIcon';
import { stripMarkdown } from '../utils/formatters';

interface SaaSRoadmapProps {
    company: Company;
    onUpdateProgress: (updatedRoadmapProgress: string[]) => void;
}

interface MilestoneProps {
    weeks: string;
    title: string;
    description: string;
    items: { id: string; text: string }[];
    icon: React.FC<any>;
    isActive?: boolean;
    completedItems: Set<string>;
    onToggleItem: (id: string) => void;
}

const MilestoneCard: React.FC<MilestoneProps> = ({ weeks, title, description, items, icon: Icon, isActive, completedItems, onToggleItem }) => {
    const { t } = useLanguage();
    
    const progress = useMemo(() => {
        const completed = items.filter(i => completedItems.has(i.id)).length;
        return items.length > 0 ? Math.round((completed / items.length) * 100) : 0;
    }, [items, completedItems]);

    const isAllDone = progress === 100;

    return (
        <div className={`relative p-8 rounded-[2.5rem] border transition-all duration-500 flex flex-col h-full theme-transition ${isActive ? 'bg-brand-primary/5 border-brand-primary shadow-2xl shadow-brand-primary/10 scale-[1.02] z-10' : 'bg-[var(--bg-card)] border-[var(--border-primary)] opacity-80 hover:opacity-100 hover:scale-[1.01]'}`}>
            <div className="flex justify-between items-start mb-8">
                <div className={`p-4 rounded-2xl ${isAllDone ? 'bg-brand-accent-green text-white shadow-lg' : (isActive ? 'bg-brand-primary text-white shadow-lg' : 'bg-[var(--bg-card-secondary)] text-[var(--text-muted)] border border-[var(--border-primary)]')}`}>
                    <Icon className="h-7 w-7" />
                </div>
                <div className="text-right flex flex-col items-end">
                    <span className="text-[10px] font-black text-[var(--text-muted)] whitespace-nowrap uppercase tracking-[0.2em]">{stripMarkdown(weeks)}</span>
                    <span className={`mt-2 text-[10px] font-black px-3 py-1 rounded-full border ${isAllDone ? 'bg-brand-accent-green/10 text-brand-accent-green border-brand-accent-green/20' : (progress > 0 ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' : 'bg-[var(--bg-card-secondary)] text-[var(--text-muted)] border border-[var(--border-primary)]')}`}>
                        {t(isAllDone ? 'roadmap_status_completed' : (progress > 0 ? 'roadmap_status_in_progress' : 'roadmap_status_planned'))}
                    </span>
                </div>
            </div>
            
            <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-3">{stripMarkdown(title)}</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-8 leading-relaxed line-clamp-2 font-medium">{stripMarkdown(description)}</p>
            
            <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Progress</span>
                    <span className="text-[10px] font-black text-brand-primary">{progress}%</span>
                </div>
                <div className="w-full bg-[var(--bg-input)] h-1.5 rounded-full overflow-hidden border border-[var(--border-primary)]">
                    <div 
                        className={`h-full transition-all duration-1000 ${isAllDone ? 'bg-brand-accent-green' : 'bg-brand-primary'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            <div className="space-y-3 flex-grow">
                {items.map(item => (
                    <button
                        key={item.id}
                        onClick={() => onToggleItem(item.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-card-hover)] transition-all group/item text-left"
                    >
                        <div className={`h-5 w-5 rounded border flex-shrink-0 flex items-center justify-center transition-all ${completedItems.has(item.id) ? 'bg-brand-accent-green border-brand-accent-green text-white' : 'border-[var(--border-primary)] bg-[var(--bg-app)]'}`}>
                            {completedItems.has(item.id) && <CheckCircleIcon className="h-4 w-4" />}
                        </div>
                        <span className={`text-xs font-bold transition-colors ${completedItems.has(item.id) ? 'text-[var(--text-muted)] line-through' : 'text-[var(--text-secondary)] group-hover/item:text-[var(--text-primary)]'}`}>
                            {stripMarkdown(item.text)}
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export const SaaSRoadmap: React.FC<SaaSRoadmapProps> = ({ company, onUpdateProgress }) => {
    const { t } = useLanguage();
    const completedItems = useMemo(() => new Set(company.roadmapProgress || []), [company.roadmapProgress]);

    const milestones = [
        {
            id: 'phase1',
            weeks: t('roadmap_timeline_weeks', { start: 1, end: 4 }),
            title: t('roadmap_phase1_title'),
            description: t('roadmap_phase1_desc'),
            icon: ServerIcon,
            items: [
                { id: 'p1_1', text: t('roadmap_phase1_item1') },
                { id: 'p1_2', text: t('roadmap_phase1_item2') },
                { id: 'p1_3', text: t('roadmap_phase1_item3') },
                { id: 'p1_4', text: t('roadmap_phase1_item4') },
            ],
        },
        {
            id: 'phase2',
            weeks: t('roadmap_timeline_weeks', { start: 5, end: 12 }),
            title: t('roadmap_phase2_title'),
            description: t('roadmap_phase2_desc'),
            icon: CreditCardIcon,
            items: [
                { id: 'p2_1', text: t('roadmap_phase2_item1') },
                { id: 'p2_2', text: t('roadmap_phase2_item2') },
                { id: 'p2_3', text: t('roadmap_phase2_item3') },
                { id: 'p2_4', text: t('roadmap_phase2_item4') },
            ],
        },
        {
            id: 'phase3',
            weeks: t('roadmap_timeline_weeks', { start: 13, end: 24 }),
            title: t('roadmap_phase3_title'),
            description: t('roadmap_phase3_desc'),
            icon: RocketLaunchIcon,
            items: [
                { id: 'p3_1', text: t('roadmap_phase3_item1') },
                { id: 'p3_2', text: t('roadmap_phase3_item2') },
                { id: 'p3_3', text: t('roadmap_phase3_item3') },
                { id: 'p3_4', text: t('roadmap_phase3_item4') },
            ],
        },
        {
            id: 'phase4',
            weeks: t('roadmap_timeline_weeks', { start: 25, end: 48 }),
            title: t('roadmap_phase4_title'),
            description: t('roadmap_phase4_desc'),
            icon: GlobeAltIcon,
            items: [
                { id: 'p4_1', text: t('roadmap_phase4_item1') },
                { id: 'p4_2', text: t('roadmap_phase4_item2') },
                { id: 'p4_3', text: t('roadmap_phase4_item3') },
                { id: 'p4_4', text: t('roadmap_phase4_item4') },
            ],
        },
    ];

    const handleToggleItem = (itemId: string) => {
        const newCompletedItems = new Set(completedItems);
        if (newCompletedItems.has(itemId)) {
            newCompletedItems.delete(itemId);
        } else {
            newCompletedItems.add(itemId);
        }
        onUpdateProgress(Array.from(newCompletedItems));
    };

    return (
        <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {milestones.map((milestone) => (
                    <MilestoneCard
                        key={milestone.id}
                        weeks={milestone.weeks}
                        title={milestone.title}
                        description={milestone.description}
                        items={milestone.items}
                        icon={milestone.icon}
                        isActive={milestone.id === 'phase1'}
                        completedItems={completedItems}
                        onToggleItem={handleToggleItem}
                    />
                ))}
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[3rem] p-10 shadow-2xl mt-16 text-center">
                <ShieldCheckIcon className="h-16 w-16 text-brand-primary mx-auto mb-6 opacity-40" />
                <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-2">{t('roadmap_tech_title')}</h3>
                <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto leading-relaxed">{t('roadmap_tech_desc')}</p>
            </div>
        </div>
    );
};
