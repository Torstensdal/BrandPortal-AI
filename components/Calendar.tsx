import React, { useEffect, useState } from 'react';
import { AppCalendarEvent, Partner, Campaign, PartnerPostState, Company, SocialPlatform } from '../types';
import { getDaysInMonth, isSameDay, isToday, MonthDay, formatDateToYYYYMMDD, getWeekNumber } from '../utils/dateUtils';
import { useLanguage } from '../context/LanguageContext';
import * as assetStorage from '../utils/assetStorage';
import { PlusIcon } from './icons/PlusIcon';
import { LinkedInIcon } from './icons/LinkedInIcon';
import { FacebookIcon } from './icons/FacebookIcon';
import { InstagramIcon } from './icons/InstagramIcon';
import { TikTokIcon } from './icons/TikTokIcon';
import { XIcon } from './icons/XIcon';
import { YouTubeIcon } from './icons/YouTube';

interface CalendarProps {
  currentDate: Date;
  setCurrentDate: (date: Date) => void;
  events: AppCalendarEvent[];
  onSelectEvent: (event: AppCalendarEvent) => void;
  onDayClick: (date: Date) => void;
  activePartner: Partner | null;
  campaigns: Campaign[];
  company: Company;
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
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                muted
                playsInline
                preload="metadata"
            />
        );
    }

    return <img src={event.assetDataUrl} alt={event.assetName} className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />;
};


const Day: React.FC<{ 
    day: MonthDay; 
    events: AppCalendarEvent[]; 
    onSelectEvent: (event: AppCalendarEvent) => void; 
    onDayClick: (date: Date) => void;
    campaigns: Campaign[]; 
    activePartner: Partner | null; 
    company: Company;
    onUpdateEventDate: (eventId: string, newDate: string) => void;
}> = ({ day, events, onSelectEvent, onDayClick, campaigns, activePartner, company, onUpdateEventDate }) => {
  const dayNumber = day.date.getDate();
  const isTodayFlag = isToday(day.date);
  const [isDragOver, setIsDragOver] = useState(false);

  // DRAG LOGIC
  const handleDragStart = (e: React.DragEvent, eventId: string) => { 
    e.dataTransfer.setData('text/plain', eventId); 
    (e.currentTarget as HTMLElement).style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragEnd = (e: React.DragEvent) => { 
    (e.currentTarget as HTMLElement).style.opacity = '1'; 
  };
  
  const handleDragOver = (e: React.DragEvent) => { 
    e.preventDefault(); 
    if (day.isCurrentMonth) {
        setIsDragOver(true); 
    }
  };
  
  const handleDragLeave = () => setIsDragOver(false);
  
  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const eventId = e.dataTransfer.getData('text/plain');
      if (eventId && day.isCurrentMonth) {
          // BRUGER LOKAL DATO FOR AT UNDGÅ HOP
          onUpdateEventDate(eventId, formatDateToYYYYMMDD(day.date));
      }
  };
  
  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => day.isCurrentMonth && onDayClick(day.date)}
      className={`relative min-h-[140px] p-2 border-t border-l border-[var(--border-primary)]/50 transition-all group ${!day.isCurrentMonth ? 'bg-[var(--bg-card)]/30' : 'bg-[var(--bg-card)]/60 hover:bg-[var(--bg-card)]/80 cursor-pointer'} ${isDragOver ? 'ring-2 ring-inset ring-brand-primary bg-brand-primary/10' : ''}`}
    >
      <div className="flex justify-between items-start mb-2">
          <time
            dateTime={day.date.toISOString()}
            className={`text-xs font-black tracking-tighter ${isTodayFlag ? 'flex items-center justify-center h-6 w-6 rounded-full bg-brand-primary text-white shadow-lg shadow-brand-primary/30' : (day.isCurrentMonth ? 'text-[var(--text-secondary)]' : 'text-[var(--text-light-muted)]')}`}
          >
            {dayNumber}
          </time>
          {day.isCurrentMonth && (
              <PlusIcon className="h-4 w-4 text-[var(--text-light-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
      </div>
      <div className="space-y-2">
        {events.map(event => {
            const partnerState = activePartner ? event.postsByPartner[activePartner.id] : null;
            const statusColor = partnerState ? getStatusColor(partnerState.status) : 'bg-[var(--text-muted)]';
            const scheduledPlatforms = partnerState ? (Object.keys(partnerState.posts) as SocialPlatform[]) : [];

            return (
              <button
                key={event.id}
                draggable
                onDragStart={(e) => handleDragStart(e, event.id)}
                onDragEnd={handleDragEnd}
                onClick={(e) => { e.stopPropagation(); onSelectEvent(event); }}
                className="relative w-full aspect-square rounded-xl text-[var(--text-primary)] overflow-hidden group/event bg-[var(--bg-app)] border border-[var(--border-primary)] shadow-xl transition-all hover:scale-[1.02] hover:border-brand-primary/50 active:scale-95 cursor-grab active:cursor-grabbing"
              >
                <EventThumbnail event={event} />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-transparent-dark)] via-[var(--bg-transparent-medium)] to-transparent"></div>
                
                {/* Platform Icons Overlay */}
                <div className="absolute top-1.5 right-1.5 flex gap-1">
                    {scheduledPlatforms.slice(0, 3).map(plat => {
                        const Icon = platformIcons[plat];
                        return (
                            <div key={plat} className="p-1 bg-[var(--bg-transparent-medium)] backdrop-blur-md rounded-md border border-[var(--text-primary)]/10">
                                <Icon className="h-2.5 w-2.5 text-[var(--text-secondary)]" />
                            </div>
                        );
                    })}
                    {scheduledPlatforms.length > 3 && (
                        <div className="p-1 bg-[var(--bg-transparent-medium)] backdrop-blur-md rounded-md border border-[var(--text-primary)]/10 text-[6px] font-black">
                            +{scheduledPlatforms.length - 3}
                        </div>
                    )}
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-2 text-left">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColor}`}></div>
                  </div>
                  <p className="font-mono text-[10px] text-brand-primary font-bold pl-[11px] leading-none">{event.time}</p>
                </div>
              </button>
            )
        })}
      </div>
    </div>
  );
};


export const Calendar: React.FC<CalendarProps> = ({ currentDate, events, onSelectEvent, onDayClick, activePartner, campaigns, company, onUpdateEventDate }) => {
    const { t } = useLanguage();
    const daysInMonth = getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth());

    const weekdays = [
        t('weekday_mon'),
        t('weekday_tue'),
        t('weekday_wed'),
        t('weekday_thu'),
        t('weekday_fri'),
        t('weekday_sat'),
        t('weekday_sun'),
    ];

    return (
        <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[2.5rem] shadow-2xl overflow-hidden">
            <div className="grid grid-cols-[48px_repeat(7,1fr)] text-[10px] font-black uppercase tracking-[0.2em] text-[var(--text-muted)] bg-[var(--bg-card)]/50 border-b border-[var(--border-primary)]">
                <div className="py-4 border-r border-[var(--border-primary)]/50 text-center">Uge</div>
                {weekdays.map(day => (
                    <div key={day} className="py-4 text-center">{day}</div>
                ))}
            </div>
            <div className="grid grid-cols-[48px_repeat(7,1fr)] bg-[var(--bg-app)]/20">
                {daysInMonth.map((day, index) => {
                    const isFirstDayOfWeek = index % 7 === 0;
                    const weekNum = isFirstDayOfWeek ? getWeekNumber(day.date) : null;
                    
                    const eventsForDay = events
                        .filter(event => isSameDay(new Date(event.date + 'T00:00:00'), day.date))
                        .sort((a, b) => a.time.localeCompare(b.time));

                    return (
                        <React.Fragment key={index}>
                            {isFirstDayOfWeek && (
                                <div className="flex items-center justify-center border-t border-r border-[var(--border-primary)]/50 bg-[var(--bg-card-secondary)]/30 text-[10px] font-black text-brand-primary">
                                    {weekNum}
                                </div>
                            )}
                            <Day 
                                day={day} 
                                events={eventsForDay} 
                                onSelectEvent={onSelectEvent} 
                                onDayClick={day.isCurrentMonth ? onDayClick : () => {}}
                                campaigns={campaigns} 
                                activePartner={activePartner} 
                                company={company} 
                                onUpdateEventDate={onUpdateEventDate} 
                            />
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
};
