import React, { useState, useMemo, useEffect } from 'react';
import { SocialPostContent, PartnerPostState, SocialPlatform, Language } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { LinkedInIcon } from './icons/LinkedInIcon';
import { FacebookIcon } from './icons/FacebookIcon';
import { InstagramIcon } from './icons/InstagramIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';
import { TikTokIcon } from './icons/TikTokIcon';
import { XIcon } from './icons/XIcon';
import { YouTubeIcon } from './icons/YouTube';
import { ArrowTopRightOnSquareIcon } from './icons/ArrowTopRightOnSquareIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { ArrowUturnLeftIcon } from './icons/ArrowUturnLeftIcon';
import { ArrowUturnRightIcon } from './icons/ArrowUturnRightIcon';
import { SyncIcon } from './icons/SyncIcon';
import { stripMarkdown } from '../utils/formatters';
import { rewriteText, RewriteInstruction } from '../services/geminiService';

interface SocialPostProps {
  platform: SocialPlatform;
  content: SocialPostContent;
  onContentChange: (newText: string) => void;
  status: PartnerPostState['status'];
  isLocked: boolean;
  isConnected: boolean;
  onUpdateStatus: (newStatus: PartnerPostState['status']) => Promise<void>;
  onManualPublish?: () => void;
  onCreateStory?: () => void;
  language?: Language;
}

export const SocialPost: React.FC<SocialPostProps> = ({ platform, content, status, onContentChange, isLocked, isConnected, onUpdateStatus, onManualPublish, onCreateStory, language = 'da' }) => {
    const { t } = useLanguage();
    const [isCopied, setIsCopied] = useState(false);
    const [isRewriting, setIsRewriting] = useState(false);
    
    // Historik til undo/redo
    const [history, setHistory] = useState<string[]>([content.text]);
    const [historyIndex, setHistoryIndex] = useState(0);

    const platformConfig: Record<SocialPlatform, { icon: React.FC<any>, name: string, iconColorClass?: string }> = {
        linkedin: { icon: LinkedInIcon, name: t('platform_linkedin') },
        facebook: { icon: FacebookIcon, name: t('platform_facebook') },
        instagram: { icon: InstagramIcon, name: t('platform_instagram'), iconColorClass: 'text-brand-accent-pink' },
        tiktok: { icon: TikTokIcon, name: t('platform_tiktok'), iconColorClass: 'text-[var(--text-light-muted)]' },
        x: { icon: XIcon, name: t('platform_x') },
        youtube: { icon: YouTubeIcon, name: t('platform_youtube') },
    };

    const config = platformConfig[platform];
    const Icon = config.icon;

    const isActuallyPublished = status === 'published' || status === 'completed';
    const isScheduled = !isActuallyPublished;

    const displayValue = useMemo(() => stripMarkdown(content.text), [content.text]);

    const handleCopy = () => {
        if (!displayValue) return;
        navigator.clipboard.writeText(displayValue).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const newValue = e.target.value;
        onContentChange(newValue);
    };

    const handleRewrite = async (instruction: RewriteInstruction) => {
        if (isRewriting || isLocked || isActuallyPublished) return;
        setIsRewriting(true);
        try {
            // Fix: Explicitly cast 'language' to the 'Language' type to satisfy the rewriteText parameter requirements
            const newText = await rewriteText(content.text, instruction, language as Language, true);
            if (newText && newText !== content.text) {
                const newHistory = history.slice(0, historyIndex + 1);
                newHistory.push(newText);
                setHistory(newHistory);
                setHistoryIndex(newHistory.length - 1);
                onContentChange(newText);
            }
        } catch (error) {
            console.error("AI Rewrite failed:", error);
        } finally {
            setIsRewriting(false);
        }
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            onContentChange(history[newIndex]);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            onContentChange(history[newIndex]);
        }
    };

    return (
        <div className={`group relative bg-[var(--bg-card)]/80 rounded-2xl p-5 border transition-all duration-300 ${isActuallyPublished ? 'border-brand-accent-green/30 bg-brand-accent-green/[0.02]' : 'border-[var(--border-dark)] hover:border-brand-primary/10 shadow-lg'}`}>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-y-3">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-[var(--bg-card-hover)] rounded-lg">
                        <Icon className={`h-5 w-5 ${config.iconColorClass || 'text-[var(--text-secondary)]'}`} />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-[var(--text-primary)]">{config.name}</h4>
                </div>
                
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    {/* Undo/Redo Controls */}
                    {!isActuallyPublished && !isLocked && (
                        <div className="flex items-center gap-1 bg-[var(--bg-card-hover)] p-1 rounded-full border border-[var(--border-primary)] mr-1">
                            <button 
                                onClick={handleUndo} 
                                disabled={historyIndex === 0 || isRewriting}
                                className="p-1.5 hover:text-brand-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Fortryd"
                            >
                                <ArrowUturnLeftIcon className="h-3 w-3" />
                            </button>
                            <button 
                                onClick={handleRedo} 
                                disabled={historyIndex === history.length - 1 || isRewriting}
                                className="p-1.5 hover:text-brand-primary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title="Gentag"
                            >
                                <ArrowUturnRightIcon className="h-3 w-3" />
                            </button>
                        </div>
                    )}

                    {/* AI Quick Actions */}
                    {!isActuallyPublished && !isLocked && (
                        <div className="flex items-center gap-2 mr-2">
                            <button 
                                onClick={() => handleRewrite('improve')} 
                                disabled={isRewriting}
                                className="px-3 py-1.5 bg-white text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] rounded-full border border-[var(--border-primary)] shadow-sm hover:bg-[var(--bg-card-hover)] hover:text-brand-primary transition-all flex items-center gap-1.5 disabled:opacity-50"
                            >
                                {isRewriting ? <SyncIcon className="h-3 w-3 animate-spin" /> : <SparklesIcon className="h-3 w-3 text-brand-primary" />}
                                FORBEDR MED AI
                            </button>
                            <button 
                                onClick={() => handleRewrite('shorten')} 
                                disabled={isRewriting}
                                className="px-3 py-1.5 bg-white text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] rounded-full border border-[var(--border-primary)] shadow-sm hover:bg-[var(--bg-card-hover)] hover:text-brand-primary transition-all disabled:opacity-50"
                            >
                                KORT NED
                            </button>
                            <button 
                                onClick={() => handleRewrite('lengthen')} 
                                disabled={isRewriting}
                                className="px-3 py-1.5 bg-white text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] rounded-full border border-[var(--border-primary)] shadow-sm hover:bg-[var(--bg-card-hover)] hover:text-brand-primary transition-all disabled:opacity-50"
                            >
                                GØR LÆNGERE
                            </button>
                        </div>
                    )}

                    {isScheduled && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary bg-brand-primary/40 px-2.5 py-1 rounded-full border border-brand-primary/50 flex items-center gap-1.5">
                            <ClockIcon className="h-3 w-3" /> {t('status_scheduled')}
                        </span>
                    )}
                    {isActuallyPublished && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent-green bg-brand-accent-green/30 px-2.5 py-1 rounded-full border border-brand-accent-green/50 flex items-center gap-1.5">
                            <CheckCircleIcon className="h-3 w-3" /> {t('status_published')}
                        </span>
                    )}
                </div>
            </div>

            <div className="relative group/textarea">
                <textarea
                    value={displayValue}
                    onChange={handleChange}
                    rows={10}
                    readOnly={isLocked || isActuallyPublished || isRewriting}
                    className={`w-full p-4 text-sm text-[var(--text-secondary)] bg-[var(--bg-input)] border border-[var(--border-dark)] rounded-xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary placeholder-[var(--text-placeholder)] transition-all scrollbar-hide resize-none leading-relaxed whitespace-pre-wrap ${isActuallyPublished ? 'opacity-40 grayscale' : ''} ${isRewriting ? 'opacity-50' : ''}`}
                    placeholder="Indlæser indhold..."
                />
                
                {isRewriting && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-input)]/40 backdrop-blur-[1px] rounded-xl">
                        <SyncIcon className="h-8 w-8 animate-spin text-brand-primary" />
                    </div>
                )}
            </div>

            <div className="mt-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handleCopy}
                        className={`flex-1 inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest transition-all ${isCopied ? 'bg-brand-accent-green text-white' : 'bg-[var(--bg-card-hover)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] border border-[var(--border-primary)]'}`}
                    >
                        {isCopied ? <CheckIcon className="h-4 w-4" /> : <CopyIcon className="h-4 w-4" />}
                        <span>{t('socialPost_copyButton')}</span>
                    </button>
                </div>
                
                {onManualPublish && isScheduled && (
                    <button
                        onClick={onManualPublish}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-brand-primary py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-brand-primary/30 hover:bg-brand-primary-hover hover:scale-[1.02] transition-all active:scale-95"
                    >
                        <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                        <span>Udgiv nu</span>
                    </button>
                )}
            </div>

            {platform === 'instagram' && onCreateStory && isScheduled && (
                <button
                    onClick={onCreateStory}
                    className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-2 text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all hover:brightness-110 active:scale-95"
                >
                    <InstagramIcon className="h-4 w-4" />
                    <span>{t('create_story_button')}</span>
                </button>
            )}
        </div>
    );
};
