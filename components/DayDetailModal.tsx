import React, { useState, useEffect, useMemo } from 'react';
import { AppCalendarEvent, Partner, Company, SocialPosts, PartnerPostState, Comment, User, SocialPlatform, Campaign, TeamMemberRole, CalendarEvent } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { XMarkIcon } from './icons/XMarkIcon';
import { SocialPost } from './SocialPost';
import { ClockIcon } from './icons/ClockIcon';
import { AiCreationIcon } from './icons/AiCreationIcon';
import { SyncIcon } from './icons/SyncIcon';
import { PartnerInfo } from './PartnerInfo';
import { TrashIcon } from './icons/TrashIcon';
import { ConfirmationModal } from './ConfirmationModal';
import { PublishIcon } from './icons/PublishIcon';
import { InstagramIcon } from './icons/InstagramAIcon';
import { EditIcon } from './icons/EditIcon';
import { PlusIcon } from './icons/PlusIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { FlagIcon } from './icons/FlagIcon';
import { CheckIcon } from './icons/CheckIcon';
import { DocumentDuplicateIcon } from './icons/DocumentDuplicateIcon';
import { v4 as uuidv4 } from 'uuid';

interface DayDetailModalProps {
  event: AppCalendarEvent;
  activePartner: Partner;
  company: Company;
  currentUser: User;
  onClose: () => void;
  onSave: (eventId: string, partnerId: string, updates: Partial<PartnerPostState & { time: string; date: string; campaignId: string | undefined; newCampaignName?: string }>) => Promise<string | undefined>;
  onDuplicate?: (newEvent: CalendarEvent) => Promise<void>;
  onGenerate: (eventId: string, partnerId: string) => Promise<void>;
  onAddComment: (eventId: string, partnerId: string, comment: Comment) => void;
  onApplyContentIdea: (eventId: string, partnerId: string, posts: SocialPosts) => void;
  onSuggestPostTime?: (partnerId: string) => Promise<any | null>;
  onDeleteEvent: (eventId: string) => void;
  onOpenManualPublish: (event: AppCalendarEvent, partner: Partner, platform: SocialPlatform) => void;
  onOpenCreateStory: (event: AppCalendarEvent) => void;
  currentUserRole?: TeamMemberRole;
  isGenerating?: boolean;
}

export const DayDetailModal: React.FC<DayDetailModalProps> = (props) => {
  const { event, activePartner, company, currentUser, onClose, onSave, onDuplicate, onGenerate, onAddComment, onApplyContentIdea, onSuggestPostTime, onDeleteEvent, onOpenManualPublish, onOpenCreateStory, currentUserRole, isGenerating } = props;
  const { t } = useLanguage();

  const [localEvent, setLocalEvent] = useState<AppCalendarEvent>(() => {
      const initializedEvent = JSON.parse(JSON.stringify(event));
      if (!initializedEvent.postsByPartner) initializedEvent.postsByPartner = {};
      if (!initializedEvent.postsByPartner[activePartner.id]) {
          initializedEvent.postsByPartner[activePartner.id] = { status: 'draft', posts: {} };
      }
      return initializedEvent;
  });

  const [campaignSelection, setCampaignSelection] = useState<string>(event.campaignId || 'none');
  const [newCampaignName, setNewCampaignName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Synkroniser kampagnevalg når begivenheden ændrer sig
  useEffect(() => {
    if (event.campaignId) {
        setCampaignSelection(event.campaignId);
    } else {
        setCampaignSelection('none');
    }
  }, [event.campaignId]);

  useEffect(() => {
    setLocalEvent(prev => {
        if (prev.id !== event.id) {
             const initializedEvent = JSON.parse(JSON.stringify(event));
             if (!initializedEvent.postsByPartner) initializedEvent.postsByPartner = {};
             if (!initializedEvent.postsByPartner[activePartner.id]) {
                 initializedEvent.postsByPartner[activePartner.id] = { status: 'draft', posts: {} };
             }
             return initializedEvent;
        }
        
        const prevPosts = JSON.stringify(prev.postsByPartner?.[activePartner.id]?.posts);
        const newPosts = JSON.stringify(event.postsByPartner?.[activePartner.id]?.posts);
        const prevStatus = prev.postsByPartner?.[activePartner.id]?.status;
        const newStatus = event.postsByPartner?.[activePartner.id]?.status;
        
        if (prevPosts !== newPosts || prevStatus !== newStatus || prev.campaignId !== event.campaignId) {
             const updatedEvent = JSON.parse(JSON.stringify(event));
             if (!updatedEvent.postsByPartner) updatedEvent.postsByPartner = {};
             if (!updatedEvent.postsByPartner[activePartner.id]) {
                 updatedEvent.postsByPartner[activePartner.id] = { status: 'draft', posts: {} };
             }
             return updatedEvent;
        }

        return prev;
    });
  }, [event, activePartner.id]);

  const partnerState = localEvent.postsByPartner ? localEvent.postsByPartner[activePartner.id] : undefined;
  const isAdmin = currentUserRole === 'admin';
  const isPartnerUser = !!(currentUser.partnerAccess && currentUser.partnerAccess.length > 0);

  const isLocked = useMemo(() => {
    if (activePartner.isLocked) return true;
    if (isPartnerUser) {
        return partnerState?.status !== 'draft' && partnerState?.status !== 'scheduled';
    }
    return false;
  }, [partnerState?.status, isPartnerUser, activePartner.isLocked]);
  
  if (!partnerState) return null; 

  const handlePostContentChange = (platform: SocialPlatform, newText: string) => {
    setLocalEvent(prev => {
      const newPostsByPartner = { ...prev.postsByPartner };
      const newPartnerState = { ...newPostsByPartner[activePartner.id] };
      const newPosts = { ...newPartnerState.posts };
      newPosts[platform] = { ...(newPosts[platform] || {}), text: newText };
      newPartnerState.posts = newPosts;
      newPostsByPartner[activePartner.id] = newPartnerState;
      return { ...prev, postsByPartner: newPostsByPartner };
    });
  };
  
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalEvent(prev => ({...prev, time: e.target.value}));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalEvent(prev => ({...prev, date: e.target.value}));
  };
  
  const handleCampaignSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCampaignSelection(e.target.value);
  };
  
  const handlePersistChanges = async () => {
    setIsSaving(true);
    setShowSaved(false);
    try {
        const campaignIdInput = campaignSelection === 'new' || campaignSelection === 'none' ? undefined : campaignSelection;
        const updates = {
            posts: localEvent.postsByPartner[activePartner.id].posts,
            time: localEvent.time,
            date: localEvent.date,
            campaignId: campaignIdInput,
            newCampaignName: campaignSelection === 'new' ? newCampaignName : undefined
        };
        const finalCampaignId = await onSave(localEvent.id, activePartner.id, updates);
        
        // Vigtigt: Opdater det lokale kampagnevalg med det nye ID med det samme for at undgå det "tomme felt"
        if (finalCampaignId) {
            setCampaignSelection(finalCampaignId);
        }
        
        setNewCampaignName('');
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 3000);
    } catch (e) {
        console.error("Failed to save changes:", e);
        alert("Failed to save changes. Please try again.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleDuplicateClick = async () => {
      if (!onDuplicate) return;
      setIsSaving(true);
      try {
          const campaignIdInput = campaignSelection === 'new' || campaignSelection === 'none' ? undefined : campaignSelection;
          const newEvent: CalendarEvent = {
              ...localEvent,
              id: `evt-${uuidv4()}`,
              campaignId: campaignIdInput,
              // postsByPartner data er allerede opdateret i localEvent fra input-felterne
          };
          await onDuplicate(newEvent);
      } catch (e) {
          console.error("Duplicate failed:", e);
      } finally {
          setIsSaving(false);
      }
  };

  const handleGenerateClick = async () => {
      await onGenerate(localEvent.id, activePartner.id);
  };

  const handleSocialPostStatusUpdate = async (newStatus: PartnerPostState['status']) => {
    const updates = {
      posts: localEvent.postsByPartner[activePartner.id].posts,
      status: newStatus,
    };
    await onSave(localEvent.id, activePartner.id, updates);
  };

  const handleDelete = () => {
    onDeleteEvent(event.id);
    onClose();
  };

  const isConnected = (platform: SocialPlatform): boolean => {
    const isCompanyView = activePartner.id === '__company__';
    const connections = isCompanyView ? company.connections : activePartner.connections;
    return !!connections?.some(c => c.platform === platform);
  };
  
  const handleManualPublish = (platform: SocialPlatform) => {
      onOpenManualPublish(localEvent, activePartner, platform);
  };

  const availablePlatforms: SocialPlatform[] = ['linkedin', 'facebook', 'instagram', 'tiktok', 'x', 'youtube'];
  const existingPlatforms = (Object.keys(partnerState.posts) as SocialPlatform[]).sort(
      (a, b) => availablePlatforms.indexOf(a) - availablePlatforms.indexOf(b)
  );
  const missingPlatforms = availablePlatforms.filter(p => !existingPlatforms.includes(p));

  const handleAddPlatform = (platform: SocialPlatform) => {
      handleAddPlatformToState(platform);
  };

  const handleAddPlatformToState = (platform: SocialPlatform) => {
    handlePostContentChange(platform, '');
  };

  return (
    <>
    <div className="fixed inset-0 z-40 bg-[var(--bg-transparent-dark)] backdrop-blur-sm overflow-y-auto flex justify-center py-12 sm:py-24 px-4" onClick={onClose} aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="relative w-full max-w-6xl max-h-fit flex flex-col md:flex-row theme-transition shadow-[0_0_100px_rgba(0,0,0,0.3)] rounded-[2.5rem] overflow-hidden my-auto" onClick={e => e.stopPropagation()}>
        <div className="bg-[var(--bg-card-hover)] w-full md:w-1/3 flex flex-col border border-r-0 border-[var(--border-primary)]">
           <div className="p-4 border-b border-[var(--border-primary)] flex-shrink-0">
               <h3 className="text-xl font-bold text-[var(--text-primary)] truncate capitalize">{new Date(localEvent.date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h3>
           </div>
           <div className="p-4 overflow-y-auto space-y-4 no-scrollbar">
             <div className="aspect-square bg-[var(--bg-card)]/50 rounded-lg overflow-hidden border border-[var(--border-primary)] flex items-center justify-center">
                {localEvent.assetDataUrl ? (
                    localEvent.assetType === 'video' ? (
                        <video src={localEvent.assetDataUrl} className="w-full h-full object-contain" controls />
                    ) : (
                        <img src={localEvent.assetDataUrl} alt={localEvent.assetName} className="w-full h-full object-contain" />
                    )
                ) : <p className="text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest">{t('mediaDetail_not_available')}</p>}
             </div>
             <PartnerInfo partner={activePartner} />
           </div>
           {isAdmin && (
            <div className="p-4 border-t border-[var(--border-primary)] mt-auto">
                <button 
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-brand-accent-red/70 bg-brand-accent-red/30 rounded-lg hover:bg-brand-accent-red/50 transition-all"
                >
                  <TrashIcon className="h-4 w-4" />
                  {t('modal_deleteButton')}
                </button>
            </div>
           )}
        </div>
        <div className="bg-[var(--bg-modal)] w-full md:w-2/3 flex flex-col border border-[var(--border-primary)] relative">
          <button 
            type="button" 
            onClick={onClose} 
            className="absolute top-4 right-4 z-50 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded-full hover:bg-[var(--bg-card-hover)]" 
            aria-label={t('modal_closeAria')}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>

          <div className="flex flex-col p-6 sm:p-8 border-b border-[var(--border-primary)] flex-shrink-0 gap-6">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6 lg:gap-4">
                <div className="flex flex-col gap-4 w-full lg:flex-1">
                    {/* Dato Felt */}
                    <div className="flex items-center gap-4">
                        <span className="text-[11px] font-black uppercase tracking-widest text-brand-primary min-w-[80px]">DATO:</span>
                        <div className="flex-grow">
                            <input 
                                type="date" 
                                value={localEvent.date} 
                                onChange={handleDateChange} 
                                readOnly={isLocked} 
                                className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-primary)] rounded-xl text-xs font-bold px-4 py-2.5 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all shadow-sm" 
                            />
                        </div>
                    </div>
                    
                    {/* Tid Felt */}
                    <div className="flex items-center gap-4">
                        <span className="text-[11px] font-black uppercase tracking-widest text-brand-primary min-w-[80px]">TID:</span>
                        <div className="flex-grow">
                            <input 
                                type="time" 
                                value={localEvent.time} 
                                onChange={handleTimeChange} 
                                readOnly={isLocked} 
                                className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-primary)] rounded-xl text-xs font-bold px-4 py-2.5 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all shadow-sm" 
                            />
                        </div>
                    </div>

                    {/* Kampagne Felt */}
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-4">
                            <span className="text-[11px] font-black uppercase tracking-widest text-brand-primary min-w-[80px]">KAMPAGNE:</span>
                            <div className="flex-grow relative">
                                <select 
                                    value={campaignSelection} 
                                    onChange={handleCampaignSelectionChange} 
                                    disabled={isLocked}
                                    className="w-full bg-[var(--bg-card-hover)] border border-[var(--border-primary)] rounded-xl text-xs font-bold px-4 py-2.5 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all appearance-none shadow-sm"
                                >
                                    <option value="none">{t('modal_noCampaign')}</option>
                                    {(company.campaigns || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    <option value="new">+ Opret ny kampagne...</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-brand-primary">
                                    <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"/></svg>
                                </div>
                            </div>
                        </div>
                        {campaignSelection === 'new' && (
                            <div className="pl-[84px] animate-in slide-in-from-top-2 duration-300">
                                <input 
                                    type="text"
                                    value={newCampaignName}
                                    onChange={(e) => setNewCampaignName(e.target.value)}
                                    placeholder="Navngiv ny kampagne..."
                                    className="w-full bg-[var(--bg-input)] border border-brand-primary/30 rounded-xl px-4 py-2 text-xs font-bold text-[var(--text-primary)] focus:border-brand-primary outline-none shadow-inner"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Handlingsknapper (højre-justeret) */}
                <div className="flex flex-wrap lg:flex-nowrap items-center justify-center lg:justify-end gap-2.5 shrink-0 w-full lg:w-auto">
                    <button 
                        onClick={handleGenerateClick} 
                        disabled={isGenerating || isLocked}
                        className="flex-1 lg:flex-none px-4 py-3.5 bg-[#f1f1ff] text-brand-primary font-black uppercase tracking-widest rounded-2xl hover:bg-brand-primary hover:text-white text-[9px] shadow-sm disabled:opacity-30 transition-all flex items-center justify-center gap-2 active:scale-95 border border-brand-primary/10 whitespace-nowrap"
                    >
                        {isGenerating ? <SyncIcon className="h-4 w-4 animate-spin" /> : <AiCreationIcon className="h-4 w-4" />}
                        <span>{isGenerating ? t('status_processing') : t('dayDetail_generate_suggestions')}</span>
                    </button>
                    {onDuplicate && (
                        <button 
                            onClick={handleDuplicateClick} 
                            disabled={isSaving || isLocked}
                            className="flex-1 lg:flex-none px-4 py-3.5 bg-[var(--bg-app)] text-[var(--text-secondary)] font-black uppercase tracking-widest rounded-2xl hover:bg-brand-primary hover:text-white text-[9px] shadow-sm disabled:opacity-30 transition-all flex items-center justify-center gap-2 active:scale-95 border border-[var(--border-primary)] whitespace-nowrap"
                        >
                            <DocumentDuplicateIcon className="h-4 w-4" />
                            <span>{t('dayDetail_duplicate')}</span>
                        </button>
                    )}
                    <button 
                        onClick={handlePersistChanges} 
                        disabled={isSaving || isLocked || (campaignSelection === 'new' && !newCampaignName.trim())} 
                        className={`flex-1 lg:flex-none px-6 py-3.5 font-black uppercase tracking-widest rounded-2xl text-[9px] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 relative disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap ${showSaved ? 'bg-brand-accent-green text-white shadow-brand-accent-green/20' : 'bg-brand-primary text-white shadow-brand-primary/30 hover:brightness-110'}`}
                    >
                        {isSaving ? (
                            <SyncIcon className="h-4 w-4 animate-spin" />
                        ) : showSaved ? (
                            <CheckIcon className="h-4 w-4" />
                        ) : null}
                        <span>{isSaving ? t('status_processing') : (showSaved ? 'GEMT' : t('modal_updateButton'))}</span>
                    </button>
                </div>
            </div>
          </div>
          <div className="flex-grow overflow-y-auto p-8 grid grid-cols-1 gap-6 no-scrollbar bg-[var(--bg-app)]/30">
              <div className="space-y-6">
                 {existingPlatforms.map(platform => {
                   const isPlatformConnected = isConnected(platform);
                   return (
                     <div key={platform} className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <SocialPost
                            platform={platform}
                            content={partnerState.posts[platform]!}
                            status={partnerState.status}
                            onContentChange={(newText) => handlePostContentChange(platform, newText)}
                            isLocked={isLocked}
                            isConnected={isPlatformConnected}
                            onUpdateStatus={(newStatus) => handleSocialPostStatusUpdate(newStatus)}
                            onManualPublish={() => handleManualPublish(platform)}
                            onCreateStory={platform === 'instagram' ? () => onOpenCreateStory(localEvent) : undefined}
                            language={activePartner.language}
                        />
                     </div>
                   );
                 })}
                 
                 {!isLocked && missingPlatforms.length > 0 && (
                     <div className="mt-8 pt-8 border-t border-[var(--border-primary)]">
                         <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-4 flex items-center gap-2">
                             <PlusIcon className="h-4 w-4 text-brand-primary" /> {t('mediaDetail_addChannel')}
                         </h4>
                         <div className="flex flex-wrap gap-2">
                             {missingPlatforms.map(platform => (
                                 <button
                                     key={platform}
                                     onClick={() => handleAddPlatform(platform)}
                                     className="px-4 py-2.5 rounded-xl bg-[var(--bg-card)] border border-[var(--border-primary)] text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] hover:border-brand-primary/50 hover:text-brand-primary transition-all shadow-sm active:scale-95"
                                 >
                                     + {t(`platform_${platform}`)}
                                 </button>
                             ))}
                         </div>
                     </div>
                 )}
              </div>
          </div>
        </div>
      </div>
    <ConfirmationModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => setIsDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
        title={t('confirmation_deleteEventTitle')}
        message={t('confirmation_deleteEventMessage')}
        confirmButtonText={t('modal_deleteButton')}
        variant="danger"
      />`n    </>`n  );`n};
};
