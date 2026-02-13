
import React, { useMemo } from 'react';
import { AppCalendarEvent, Partner, Company, PartnerPostState, SocialPlatform } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { getWeekStart, formatDateToYYYYMMDD, isToday, getWeekNumber } from '../utils/dateUtils';
import { LinkedInIcon } from './icons/LinkedInIcon';
import { FacebookIcon } from './icons/FacebookIcon';
import { InstagramIcon } from './icons/InstagramIcon';
import { TikTokIcon } from './icons/TikTokIcon';
import { XIcon } from './icons/XIcon';
import { YouTubeIcon } from './icons/YouTubeIcon';
import { PlusIcon } from './icons/PlusIcon';
import { stripMarkdown } from '../utils/formatters';

interface WeekViewProps {
  events: AppCalendarEvent[];
  activePartner: Partner;
  company: Company;
  currentDate: Date;
  onSelectEvent: (event: AppCalendarEvent) => void;
  onDayClick: (date: Date) => void;
  onUpdateEventDate: (eventId: string, newDate: string) => void;
}

const platformIcons: Record<SocialPlatform, React.FC<any>> = {
    linkedin: LinkedInIcon,
    facebook: FacebookIcon,
    instagram: InstagramIcon,
    tiktok: TikTokIcon,
    x: XIcon,
    youtube: YouTubeIcon,
};

const getStatusColor = (status: PartnerPostState['status']): string => {
    switch (status) {
        case 'processing':
        case 'scheduled':
            return 'bg-brand-accent-blue shadow-[0_0_8px_rgba(59,130,246,0.5)]';
        case 'completed':
        case 'published':
            return 'bg-brand-accent-green shadow-[0_0_8px_rgba(34,197,94,0.6)]';
        case 'pending':
        case 'awaiting_approval':
        case 'changes_requested':
            return 'bg-brand-accent-yellow';
        case 'error':
            return 'bg-brand-accent-red';
        case 'draft':
        default:
            return 'bg-[var(--text-muted)]';
    }
};

const EventThumbnail: React.FC<{ event: AppCalendarEvent }> = ({ event }) => {
    if (!event.assetDataUrl) {
        return <div className="absolute inset-0 w-full h-full bg-[var(--bg-card-hover)]/50" />;
    }

    if (event.assetType === 'video') {
        return (
            <video 
                src={event.assetDataUrl} 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover/event:scale-110"
                muted
                playsInline
                preload="metadata"
            />
        );
    }

    return <img src={event.assetDataUrl} alt={event.assetName} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover/event:scale-110" />;
};

export const WeekView: React.FC<WeekViewProps> = ({ events, activePartner, company, currentDate, onSelectEvent, onDayClick, onUpdateEventDate }) => {
  const { t } = useLanguage();

  const weekDates = useMemo(() => {
    const start = getWeekStart(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        return d;
    });
  }, [currentDate]);

  const currentWeekNum = useMemo(() => getWeekNumber(weekDates[0]), [weekDates]);

  const weekdays = [
      t('weekday_mon'),
      t('weekday_tue'),
      t('weekday_wed'),
      t('weekday_thu'),
      t('weekday_fri'),
      t('weekday_sat'),
      t('weekday_sun'),
  ];

  const handleDragStart = (e: React.DragEvent, eventId: string) => { 
    e.dataTransfer.setData('text/plain', eventId); 
    (e.currentTarget as HTMLElement).style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragEnd = (e: React.DragEvent) => { 
    (e.currentTarget as HTMLElement).style.opacity = '1'; 
  };

  const handleDrop = (e: React.DragEvent, date: Date) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('text/plain');
    if (eventId) {
        onUpdateEventDate(eventId, formatDateToYYYYMMDD(date));
    }
  };

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[2.5rem] shadow-2xl overflow-hidden animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-8 py-4 bg-brand-primary/5 border-b border-[var(--border-primary)]">
          <h4 className="text-sm font-black text-brand-primary uppercase tracking-[0.3em]">Uge {currentWeekNum}</h4>
      </div>
      <div className="grid grid-cols-7 border-b border-[var(--border-primary)] bg-[var(--bg-card)]/50">
        {weekdays.map((day, idx) => {
            const date = weekDates[idx];
            const isTodayFlag = isToday(date);
            return (
                <div key={day} className="py-6 flex flex-col items-center justify-center border-l first:border-l-0 border-[var(--border-primary)]/50 relative group/header">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] mb-2">{day}</span>
                    <div className={`h-10 w-10 flex items-center justify-center rounded-full text-lg font-black tracking-tighter transition-all ${isTodayFlag ? 'bg-brand-primary text-white shadow-xl scale-110' : 'text-[var(--text-primary)]'}`}>
                        {date.getDate()}
                    </div>
                    <button 
                        onClick={() => onDayClick(date)}
                        className="absolute right-2 top-2 p-1.5 text-brand-primary opacity-0 group-hover/header:opacity-100 transition-all hover:scale-110"
                    >
                        <PlusIcon className="h-4 w-4" />
                    </button>
                </div>
            );
        })}
      </div>
      
      <div className="grid grid-cols-7 bg-[var(--bg-app)]/10">
        {weekDates.map((date, idx) => {
            const dateStr = formatDateToYYYYMMDD(date);
            const dayEvents = events
                .filter(e => e.date === dateStr)
                .sort((a, b) => a.time.localeCompare(b.time));
            const isTodayFlag = isToday(date);

            return (
                <div 
                    key={idx} 
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleDrop(e, date)}
                    onClick={(e) => {
                        if (e.target === e.currentTarget) onDayClick(date);
                    }}
                    className={`relative p-4 border-l first:border-l-0 border-[var(--border-primary)]/30 space-y-4 transition-colors flex flex-col cursor-pointer group/col ${isTodayFlag ? 'bg-brand-primary/[0.03]' : ''}`}
                >
                    {dayEvents.length > 0 ? (
                        dayEvents.map(event => {
                            const partnerState = event.postsByPartner[activePartner.id];
                            if (!partnerState) return null;

                            const statusColor = getStatusColor(partnerState.status);
                            const scheduledPlatforms = Object.keys(partnerState.posts) as SocialPlatform[];

                            return (
                                <button
                                    key={event.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, event.id)}
                                    onDragEnd={handleDragEnd}
                                    onClick={(e) => { e.stopPropagation(); onSelectEvent(event); }}
                                    className="relative w-full rounded-2xl overflow-hidden group/event bg-[var(--bg-card)] border border-[var(--border-primary)] shadow-lg transition-all hover:scale-[1.03] hover:border-brand-primary/50 hover:shadow-2xl active:scale-95 cursor-grab active:cursor-grabbing text-left shrink-0"
                                >
                                    <div className="aspect-[4/5] relative overflow-hidden">
                                        <EventThumbnail event={event} />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-transparent-dark)] via-transparent to-transparent"></div>
                                        
                                        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                                            {scheduledPlatforms.slice(0, 3).map(plat => {
                                                const Icon = platformIcons[plat];
                                                return (
                                                    <div key={plat} className="p-1.5 bg-white/10 backdrop-blur-xl rounded-lg border border-white/20 shadow-lg">
                                                        <Icon className="h-3 w-3 text-white" />
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="absolute bottom-3 left-3 right-3">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusColor}`}></div>
                                                <span className="text-[9px] font-black text-white/90 uppercase tracking-widest truncate">{stripMarkdown(event.assetName)}</span>
                                            </div>
                                            <p className="font-mono text-xs text-brand-primary font-black ml-[14px] leading-none bg-white/90 w-fit px-1.5 py-0.5 rounded shadow-sm">{event.time}</p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    ) : (
                        <div className="flex-grow flex flex-col items-center justify-center py-10 px-2 text-center opacity-0 group-hover/col:opacity-30 transition-opacity select-none pointer-events-none">
                            <PlusIcon className="h-8 w-8 text-brand-primary mb-2" />
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] leading-tight">
                                Planlæg indhold
                            </p>
                        </div>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
};
