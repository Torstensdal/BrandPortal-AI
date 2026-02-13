import React, { useMemo, useState, useEffect } from 'react';
/* Added Campaign to imports */
import { Company, Partner, User, AppCalendarEvent, PartnerPostState, SocialPlatform, Comment, AssetMetadata, CalendarEvent, Campaign } from '../types';
import { Calendar } from './Calendar';
import { WeekView } from './WeekView';
import { generateLogoUrl } from '../utils/urlUtils';
import * as apiClient from '../services/apiClient';
import * as assetStorage from '../utils/assetStorage';
import { DayDetailModal } from './DayDetailModal';
import { ManualPublishModal } from './ManualPublishModal';
import { CreateStoryModal } from './CreateStoryModal';
import { generateSocialPost } from '../services/geminiService';
import { PartnerSelector } from './PartnerSelector';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';
import { ChevronRightIcon } from './icons/ChevronRightIcon';
import { useLanguage } from '../context/LanguageContext';
import { PlusIcon } from './icons/PlusIcon';
import { XMarkIcon } from './icons/XMarkIcon';
import { ListBulletIcon } from './icons/ListBulletIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { v4 as uuidv4 } from 'uuid';
import { getWeekStart, isDateInWeek, formatDateToYYYYMMDD } from '../utils/dateUtils';
import { DayActionModal } from './DayActionModal';
import { MediaPickerModal } from './MediaPickerModal';
import { GeneratePostsModal } from './GeneratePostsModal';

interface CalendarScreenProps {
    company: Company;
    token: string;
    onUpdateCompany: (company: Company) => void;
    currentUser: User;
    onGeneratePosts: (assets: any[], partnerIds: string[], topic: string, platforms: SocialPlatform[], weekdays: number[], startDate: string, endDate: string, startTime: string, endTime: string, campaignId?: string, newCampaignName?: string) => Promise<void>;
    isGenerating: boolean;
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({ company, token, onUpdateCompany, currentUser, onGeneratePosts, isGenerating }) => {
    const { t, setLanguage } = useLanguage();
    const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
    const [hydratedEvents, setHydratedEvents] = useState<AppCalendarEvent[]>([]);
    
    // Brug ID-baseret state for at sikre reaktivitet i modalen
    const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
    
    const [manualPublishContext, setManualPublishContext] = useState<any>(null);
    const [createStoryContext, setCreateStoryContext] = useState<any>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [activePartnerId, setActivePartnerId] = useState<string>('__company__');
    
    // New flow states for adding posts to specific dates
    const [actionDate, setActionDate] = useState<string | null>(null);
    const [preselectedCampaignId, setPreselectedCampaignId] = useState<string | undefined>();
    const [isDayActionModalOpen, setIsDayActionModalOpen] = useState(false);
    const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
    const [selectedMediaForGen, setSelectedMediaForGen] = useState<AssetMetadata[]>([]);
    const [isGenModalOpen, setIsGenModalOpen] = useState(false);

    const selectedEvent = useMemo(() => 
        hydratedEvents.find(e => e.id === selectedEventId) || null
    , [hydratedEvents, selectedEventId]);

    const companyAsPartner: Partner = useMemo(() => ({
        id: '__company__',
        name: company.name,
        website: company.website,
        language: company.language || 'da',
        logoUrl: company.brandKit?.logoAssetId || generateLogoUrl(company.website),
        status: 'completed',
        description: company.description,
         industry: company.industry,
        targetAudience: company.targetAudience,
        brandVoice: company.brandVoice,
        socials: company.socials,
        contacts: [],
        connections: company.connections,
        isLocked: company.isLocked
    }), [company]);

    // Filtrer partnere så vi kun har de rigtige partnere (uden virksomheden selv)
    const actualPartners = useMemo(() => {
        const cName = (company.name || '').trim().toLowerCase();
        const cWeb = (company.website || '').trim().toLowerCase();
        
        return (company.partners || []).filter(p => {
            const pName = (p.name || '').trim().toLowerCase();
            const pWeb = (p.website || '').trim().toLowerCase();
            return pName !== cName && pWeb !== cWeb;
        });
    }, [company.partners, company.name, company.website]);

    // Samlet liste til navigationen (inkl. virksomheden selv)
    const allPartners = useMemo(() => [companyAsPartner, ...actualPartners], [companyAsPartner, actualPartners]);

    const activePartner = useMemo(() => 
        allPartners.find(p => p.id === activePartnerId) || companyAsPartner
    , [allPartners, activePartnerId]);

    useEffect(() => {
        let isCancelled = false;
        const objectUrls: string[] = [];

        const hydrate = async () => {
            if (!company.events) {
                setHydratedEvents([]);
                return;
            }

            const promises = company.events.map(async (event) => {
                const assetMeta = company.mediaLibrary?.find(a => a.id === event.assetId);
                let assetDataUrl = '';
                if (assetMeta) {
                    try {
                        const file = await assetStorage.getAsset(assetMeta.id);
                        if (file && !isCancelled) {
                            const url = URL.createObjectURL(file);
                            objectUrls.push(url);
                            assetDataUrl = url;
                        }
                    } catch (e) {
                        console.error('Failed to load asset for calendar', e);
                    }
                }
                return { 
                    ...event, 
                    assetDataUrl, 
                    assetType: assetMeta?.type || 'image' 
                } as AppCalendarEvent;
            });

            const results = await Promise.all(promises);
            if (!isCancelled) {
                setHydratedEvents(results);
            }
        };

        hydrate();

        return () => {
            isCancelled = true;
            objectUrls.forEach(URL.revokeObjectURL);
        };
    }, [company.events, company.mediaLibrary]);

    const weekEvents = useMemo(() => {
        const weekStart = getWeekStart(currentDate);
        return hydratedEvents.filter(e => isDateInWeek(new Date(e.date + 'T00:00:00'), weekStart));
    }, [hydratedEvents, currentDate]);

    const handleSaveEvent = async (eventId: string, partnerId: string, updates: Partial<PartnerPostState & { time: string; date: string; campaignId: string | undefined; newCampaignName?: string }>): Promise<string | undefined> => {
        let finalCampaignId = updates.campaignId;
        
        // Hvis der oprettes en ny kampagne herfra
        if (updates.newCampaignName) {
            const newCampaign: Campaign = {
                id: `camp-${uuidv4()}`,
                name: updates.newCampaignName,
                goal: 'Opslag skabt fra kalender detaljer',
                startDate: updates.date || formatDateToYYYYMMDD(new Date()),
                endDate: updates.date || formatDateToYYYYMMDD(new Date()),
                themeColor: '#6366f1'
            };
            const updatedCampaigns = [...(company.campaigns || []), newCampaign];
            await onUpdateCompany({ ...company, campaigns: updatedCampaigns });
            finalCampaignId = newCampaign.id;
        }

        const updatedCompany = await apiClient.updateEvent(token, company.id, eventId, { ...updates, campaignId: finalCampaignId }, partnerId);
        onUpdateCompany(updatedCompany);
        
        return finalCampaignId;
    };

    const handleDuplicateEvent = async (newEvent: CalendarEvent) => {
        const updatedEvents = [...(company.events || []), newEvent];
        onUpdateCompany({ ...company, events: updatedEvents });
        setSelectedEventId(null);
    };

    const handleMarkAsPublished = async (eventId: string, platform: SocialPlatform) => {
        await handleSaveEvent(eventId, activePartnerId, { status: 'published' } as any);
    };

    const handleAddComment = async (eventId: string, partnerId: string, comment: Comment) => {
         const event = company.events?.find(e => e.id === eventId);
         if (!event) return;
         const currentComments = event.postsByPartner[partnerId]?.comments || [];
         await handleSaveEvent(eventId, partnerId, { comments: [...currentComments, comment] } as any);
    };

    const handleNext = () => {
        setCurrentDate(prev => {
            const d = new Date(prev);
            if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
            else d.setDate(d.getDate() + 7);
            return d;
        });
    };

    const handlePrev = () => {
        setCurrentDate(prev => {
            const d = new Date(prev);
            if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
            else d.setDate(d.getDate() - 7);
            return d;
        });
    };

    const handleGenerateFromDayDetail = async (eventId: string) => {
        const event = hydratedEvents.find(e => e.id === eventId);
        if (!event) return;
        
        const assetMeta = company.mediaLibrary?.find(a => a.id === event.assetId);
        if (!assetMeta) return;

        setSelectedMediaForGen([assetMeta]);
        setActionDate(event.date);
        setPreselectedCampaignId(event.campaignId);
        setIsGenModalOpen(true);
        setSelectedEventId(null); 
    };

    const handleUpdateEventDate = (eventId: string, date: string) => {
        const updatedEvents = company.events!.map(e => e.id === eventId ? { ...e, date } : e);
        onUpdateCompany({ ...company, events: updatedEvents });
    };

    return (
        <div className="p-8 max-w-7xl mx-auto theme-transition">
            <div className="flex flex-col lg:flex-row justify-between items-end mb-8 gap-6">
                <div>
                    <h2 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter uppercase mb-1">
                        {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                    </h2>
                    <p className="text-[var(--text-muted)] text-sm font-bold uppercase tracking-widest">Administrer dine planlagte opslag</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-4">
                    <div className="bg-[var(--bg-card-hover)]/50 p-1 rounded-xl border border-[var(--border-dark)] flex shadow-inner">
                        <button 
                            onClick={() => setViewMode('month')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'month' ? 'bg-brand-primary text-white shadow-lg' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}
                        >
                            <CalendarIcon className="h-4 w-4" /> {t('calendar_month_view')}
                        </button>
                        <button 
                            onClick={() => setViewMode('week')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${viewMode === 'week' ? 'bg-brand-primary text-white shadow-lg' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}
                        >
                            <ListBulletIcon className="h-4 w-4" /> {t('calendar_list_view')}
                        </button>
                    </div>

                    <div className="h-10 border-l border-[var(--border-dark)]"></div>

                    <div className="flex items-center bg-[var(--bg-card-hover)]/50 rounded-xl p-1 border border-[var(--border-dark)] shadow-inner">
                        <button onClick={handlePrev} className="p-2 hover:bg-[var(--bg-card-hover)] rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                            <ChevronLeftIcon className="h-5 w-5" />
                        </button>
                        <button onClick={handleNext} className="p-2 hover:bg-[var(--bg-card-hover)] rounded-lg text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors">
                            <ChevronRightIcon className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="h-10 border-l border-[var(--border-dark)]"></div>

                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest whitespace-nowrap">{t('calendar_viewingFor')}</span>
                        <PartnerSelector 
                            partners={allPartners} 
                            activePartner={activePartner} 
                            onSelectPartner={setActivePartnerId} 
                        />
                    </div>
                </div>
            </div>

            {viewMode === 'month' ? (
                <Calendar
                    currentDate={currentDate}
                    setCurrentDate={setCurrentDate}
                    events={hydratedEvents}
                    onSelectEvent={(e) => setSelectedEventId(e.id)}
                    onDayClick={(d) => {
                        setActionDate(formatDateToYYYYMMDD(d));
                        setPreselectedCampaignId(undefined);
                        setIsDayActionModalOpen(true);
                    }}
                    activePartner={activePartner}
                    campaigns={company.campaigns || []}
                    company={company}
                    onUpdateEventDate={handleUpdateEventDate}
                />
            ) : (
                <WeekView 
                    events={weekEvents}
                    activePartner={activePartner}
                    company={company}
                    currentDate={currentDate}
                    onSelectEvent={(e) => setSelectedEventId(e.id)}
                    onDayClick={(d) => {
                        setActionDate(formatDateToYYYYMMDD(d));
                        setPreselectedCampaignId(undefined);
                        setIsDayActionModalOpen(true);
                    }}
                    onUpdateEventDate={handleUpdateEventDate}
                />
            )}
            
            {selectedEvent && (
                <DayDetailModal
                    event={selectedEvent}
                    activePartner={activePartner}
                    company={company}
                    currentUser={currentUser}
                    onClose={() => setSelectedEventId(null)}
                    onSave={handleSaveEvent}
                    onDuplicate={handleDuplicateEvent}
                    onGenerate={(eid) => handleGenerateFromDayDetail(eid)}
                    onAddComment={handleAddComment}
                    onApplyContentIdea={() => {}}
                    onDeleteEvent={(eid) => {
                        const newEvents = company.events?.filter(e => e.id !== eid) || [];
                        onUpdateCompany({ ...company, events: newEvents });
                    }}
                    onOpenManualPublish={(e, p, plat) => setManualPublishContext({ event: e, partner: p, platform: plat })}
                    onOpenCreateStory={(e) => setCreateStoryContext({ event: e })}
                    currentUserRole="admin"
                />
            )}

            <DayActionModal 
                isOpen={isDayActionModalOpen}
                date={actionDate || ''}
                onClose={() => { setIsDayActionModalOpen(false); setActionDate(null); }}
                onInitiateGenerate={() => { setIsMediaPickerOpen(true); setIsDayActionModalOpen(false); }}
            />

            <MediaPickerModal 
                isOpen={isMediaPickerOpen}
                onClose={() => { setIsMediaPickerOpen(false); setActionDate(null); }}
                assets={(company.mediaLibrary || []).filter(a => a.type === 'image' || a.type === 'video')}
                onConfirm={(assets) => { 
                    setSelectedMediaForGen(assets); 
                    setIsGenModalOpen(true); 
                    setIsMediaPickerOpen(false); 
                }}
            />

            <GeneratePostsModal 
                isOpen={isGenModalOpen}
                onClose={() => { setIsGenModalOpen(false); setActionDate(null); setPreselectedCampaignId(undefined); }}
                partners={actualPartners}
                campaigns={company.campaigns || []}
                companyName={company.name}
                companyLogo={company.brandKit?.logoAssetId}
                onSubmit={(pids, topic, plats, weekdays, sDate, eDate, sTime, eTime, campId, campName) => {
                    setIsGenModalOpen(false);
                    setActionDate(null);
                    setPreselectedCampaignId(undefined);
                    onGeneratePosts(selectedMediaForGen, pids, topic, plats, weekdays, sDate, eDate, sTime, eTime, campId, campName);
                }}
                isGenerating={isGenerating}
                selectedAssetCount={selectedMediaForGen.length}
                targetDate={actionDate || undefined}
                initialCampaignId={preselectedCampaignId}
            />

            <ManualPublishModal
                isOpen={!!manualPublishContext}
                onClose={() => setManualPublishContext(null)}
                context={manualPublishContext}
                onMarkAsPublished={handleMarkAsPublished}
            />
            
            <CreateStoryModal
                isOpen={!!createStoryContext}
                onClose={() => setCreateStoryContext(null)}
                context={createStoryContext}
            />
        </div>
    );
};
