
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Company, AppState, TeamMemberRole, AssetMetadata, Lead } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { UsersIcon } from './icons/UsersIcon';
import { PhotoIcon } from './icons/PhotoIcon';
import { ChartBarIcon } from './icons/ChartBarIcon';
import { BriefcaseIcon } from './icons/BriefcaseIcon';
import { SyncIcon } from './icons/SyncIcon';
import { UploadIcon } from './icons/UploadIcon';
import { RocketLaunchIcon } from './icons/RocketLaunchIcon';
import { InboxIcon } from './icons/InboxIcon';
import { ClockIcon } from './icons/ClockIcon';
import { CheckCircleIcon } from './icons/CheckCircleIcon';
import * as assetStorage from '../utils/assetStorage';
import { getPdfPreview } from '../utils/fileUtils';
import { stripMarkdown } from '../utils/formatters';

interface DashboardScreenProps {
  company: Company;
  onNavigate: (state: AppState) => void;
  onUpdateCompany?: (details: Partial<Company>) => Promise<void>;
  currentUserRole?: TeamMemberRole;
  onQuickUpload?: (file: File) => Promise<string>;
}

const MediaPreview: React.FC<{ asset: AssetMetadata }> = ({ asset }) => {
    const [url, setUrl] = useState<string | null>(null);
    const [isPdfProcessing, setIsPdfProcessing] = useState(false);

    useEffect(() => {
        let objectUrl: string | null = null;
        const load = async () => {
            try {
                const file = await assetStorage.getAsset(asset.id);
                if (file) {
                    const isPdf = file.type === 'application/pdf' || asset.fileName.toLowerCase().endsWith('.pdf');
                    if (isPdf) {
                        setIsPdfProcessing(true);
                        const pdfPreview = await getPdfPreview(file);
                        if (pdfPreview) {
                            setUrl(pdfPreview);
                            setIsPdfProcessing(false);
                            return;
                        }
                        setIsPdfProcessing(false);
                    }
                    objectUrl = URL.createObjectURL(file);
                    setUrl(objectUrl);
                }
            } catch (e) {
                console.error("Dashboard preview load failed", e);
                setIsPdfProcessing(false);
            }
        };
        load();
        return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
    }, [asset.id, asset.fileName]);

    if (isPdfProcessing) return <div className="aspect-square bg-[var(--bg-input)] rounded-xl flex items-center justify-center"><SyncIcon className="h-5 w-5 text-brand-primary animate-spin" /></div>;
    if (!url) return <div className="aspect-square bg-[var(--bg-input)] animate-pulse rounded-xl border border-[var(--border-primary)]" />;
    return <img src={url} className="aspect-square object-cover rounded-xl border border-[var(--border-primary)] shadow-sm group-hover:scale-105 transition-transform duration-500" alt="" />;
};

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ company, onNavigate, onUpdateCompany, currentUserRole, onQuickUpload }) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const partnersCount = company.partners?.length || 0;
  const mediaCount = company.mediaLibrary?.length || 0;
  const recentMedia = (company.mediaLibrary || []).slice(-5).reverse();
  const reachDisplay = company.analyticsSummary?.totalReach ? company.analyticsSummary.totalReach.toLocaleString() : "-";

  // Aktivitets-log beregning
  const activities = useMemo(() => {
      const list: { id: string, type: 'lead' | 'partner' | 'media', text: string, time: string, color: string, icon: React.FC<any> }[] = [];
      
      // Leads
      (company.leads || []).slice(-3).forEach(l => {
          list.push({ id: l.id, type: 'lead', text: `Nyt Lead: ${stripMarkdown(l.name)}`, time: l.submittedAt, color: 'text-brand-accent-teal', icon: InboxIcon });
      });

      // Partnere
      (company.partners || []).slice(-2).forEach(p => {
          list.push({ id: p.id, type: 'partner', text: `Partner tilføjet: ${stripMarkdown(p.name)}`, time: new Date().toISOString(), color: 'text-brand-primary', icon: UsersIcon });
      });

      // Medier
      (company.mediaLibrary || []).slice(-3).forEach(m => {
          list.push({ id: m.id, type: 'media', text: `Fil uploadet: ${stripMarkdown(m.fileName)}`, time: new Date().toISOString(), color: 'text-brand-accent-purple', icon: PhotoIcon });
      });

      return list.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 6);
  }, [company.leads, company.partners, company.mediaLibrary]);

  const handleQuickUploadClick = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !onQuickUpload) return;
      setIsUploading(true);
      try { await onQuickUpload(file); } finally { setIsUploading(false); }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-700">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-1">
              <h1 className="text-4xl font-black text-[var(--text-primary)] tracking-tighter uppercase">{t('dashboard_welcome')} {stripMarkdown(company.name)}</h1>
              <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-[10px]">{t('dashboard_subtitle')}</p>
          </div>
          <div className="flex gap-3">
              <button 
                onClick={() => onNavigate('onboarding_plan')}
                className="px-6 py-3 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl hover:brightness-110 transition-all flex items-center gap-3"
              >
                  <RocketLaunchIcon className="h-4 w-4" />
                  Gå til Master Vækstplan
              </button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-8 rounded-[2.5rem] shadow-xl flex items-center gap-6 group hover:border-brand-primary/30 transition-all cursor-pointer" onClick={() => onNavigate('partners')}>
              <div className="p-4 bg-brand-primary/10 rounded-2xl text-brand-primary group-hover:bg-brand-primary group-hover:text-white transition-all shadow-inner">
                  <UsersIcon className="h-8 w-8" />
              </div>
              <div>
                  <p className="text-3xl font-black text-[var(--text-primary)] leading-none mb-1">{partnersCount}</p>
                  <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{t('dashboard_kpi_partners')}</p>
              </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-8 rounded-[2.5rem] shadow-xl flex items-center gap-6 group hover:border-brand-accent-teal/30 transition-all cursor-pointer" onClick={() => onNavigate('media_library')}>
              <div className="p-4 bg-brand-accent-teal/10 rounded-2xl text-brand-accent-teal group-hover:bg-brand-accent-teal group-hover:text-white transition-all shadow-inner">
                  <PhotoIcon className="h-8 w-8" />
              </div>
              <div>
                  <p className="text-3xl font-black text-[var(--text-primary)] leading-none mb-1">{mediaCount}</p>
                  <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{t('dashboard_kpi_media')}</p>
              </div>
          </div>

          <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-8 rounded-[2.5rem] shadow-xl flex items-center gap-6 group hover:border-brand-accent-purple/30 transition-all cursor-pointer" onClick={() => onNavigate('analytics')}>
              <div className="p-4 bg-brand-accent-purple/10 rounded-2xl text-brand-accent-purple group-hover:bg-brand-accent-purple group-hover:text-white transition-all shadow-inner">
                  <ChartBarIcon className="h-8 w-8" />
              </div>
              <div>
                  <p className="text-3xl font-black text-[var(--text-primary)] leading-none mb-1">{reachDisplay}</p>
                  <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest">{t('dashboard_kpi_reach')}</p>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
              {/* Aktivitets Feed */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[3rem] p-10 shadow-xl flex flex-col">
                  <div className="flex justify-between items-center mb-8">
                      <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Live Aktivitet</h3>
                      <span className="flex h-2 w-2 rounded-full bg-brand-accent-green animate-ping"></span>
                  </div>
                  <div className="space-y-4">
                      {activities.length > 0 ? activities.map(act => (
                          <div key={act.id} className="flex items-center justify-between p-4 bg-[var(--bg-input)] rounded-2xl border border-[var(--border-primary)] hover:border-brand-primary/20 transition-all group">
                              <div className="flex items-center gap-4">
                                  <div className={`p-2 rounded-xl bg-white shadow-sm ${act.color}`}>
                                      <act.icon className="h-4 w-4" />
                                  </div>
                                  <p className="text-sm font-bold text-[var(--text-secondary)]">{act.text}</p>
                              </div>
                              <span className="text-[9px] font-black uppercase text-[var(--text-muted)]">Lige nu</span>
                          </div>
                      )) : (
                          <p className="text-center py-10 text-[var(--text-muted)] font-bold italic">Ingen aktivitet endnu.</p>
                      )}
                  </div>
              </div>

              {/* Hurtig Medie Oversigt */}
              <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[3rem] p-10 shadow-xl flex flex-col">
                <div className="flex justify-between items-end mb-10">
                    <div>
                        <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">{t('dashboard_recent_media')}</h3>
                    </div>
                    <button onClick={() => onNavigate('media_library')} className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:text-[var(--text-primary)] transition-colors">{t('dashboard_view_all_media')}</button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                    {recentMedia.length > 0 ? recentMedia.map(asset => (
                        <div key={asset.id} className="group cursor-pointer overflow-hidden rounded-xl" onClick={() => onNavigate('media_library')}>
                            <MediaPreview asset={asset} />
                        </div>
                    )) : (
                        <div className="col-span-full py-10 text-center border-2 border-dashed border-[var(--border-primary)] rounded-3xl opacity-30">
                            <p className="text-xs font-black uppercase tracking-widest">Tomt arkiv</p>
                        </div>
                    )}
                </div>
              </div>
          </div>

          <div className="space-y-6">
              <div className="bg-gradient-to-br from-brand-primary/10 to-[var(--bg-card)] border border-brand-primary/20 p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                      <BriefcaseIcon className="h-20 w-20 text-[var(--text-primary)]" />
                  </div>
                  <h3 className="text-lg font-black text-[var(--text-primary)] uppercase tracking-tight mb-2 relative z-10">{t('dashboard_quick_upload_title')}</h3>
                  <p className="text-xs text-[var(--text-secondary)] font-medium leading-relaxed mb-8 relative z-10">{t('dashboard_quick_upload_desc')}</p>
                  
                  <input type="file" ref={fileInputRef} onChange={handleQuickUploadClick} accept="application/pdf" className="hidden" />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="w-full py-4 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:brightness-110 shadow-xl transition-all relative z-10 flex items-center justify-center gap-3"
                  >
                      {isUploading ? <SyncIcon className="h-4 w-4 animate-spin" /> : <UploadIcon className="h-4 w-4" />}
                      <span>{isUploading ? t('status_processing') : t('dashboard_quick_upload_btn')}</span>
                  </button>
              </div>

              <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-8 rounded-[2.5rem] shadow-xl">
                  <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-6">Status på fundament</h3>
                  <div className="space-y-4">
                      {[
                          { state: 'onboarding_strategy', label: t('nav_onboarding_strategy'), status: company.contentStrategy ? t('status_completed') : t('status_pending'), color: company.contentStrategy ? 'text-brand-accent-green' : 'text-brand-accent-amber' },
                          { state: 'partners', label: t('nav_sales_partners'), status: partnersCount > 0 ? t('status_completed') : t('status_pending'), color: partnersCount > 0 ? 'text-brand-primary' : 'text-[var(--text-muted)]' },
                          { state: 'onboarding_plan', label: t('nav_onboarding_plan'), status: company.growthPlan ? t('status_completed') : t('status_pending'), color: company.growthPlan ? 'text-brand-accent-green' : 'text-[var(--text-muted)]' }
                      ].map(item => (
                          <button 
                            key={item.state} 
                            onClick={() => onNavigate(item.state as any)}
                            className="w-full flex items-center justify-between p-4 bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-2xl hover:border-brand-primary/50 transition-all group"
                          >
                              <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-tight">{item.label}</span>
                              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-white/10 ${item.color}`}>{item.status}</span>
                          </button>
                      ))}
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};
