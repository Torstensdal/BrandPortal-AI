
import React, { useState } from 'react';
import { SavedLandingPage, Company } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { SyncIcon } from './icons/SyncIcon';
import { PartnerLogo } from './PartnerLogo';
import { stripMarkdown } from '../utils/formatters';

interface LandingPagePreviewProps {
  page: SavedLandingPage;
  company: Company;
  onClose: () => void;
  onLeadSubmit: (leadData: any) => Promise<void>;
}

export const LandingPagePreview: React.FC<LandingPagePreviewProps> = ({ page, company, onClose, onLeadSubmit }) => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const heroBg = page.content.hero.backgroundImageUrl;
  const isHeroAsset = heroBg?.startsWith('asset:');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
        await onLeadSubmit(formData);
        setFormData({ name: '', email: '', message: '' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[1000] bg-white text-slate-900 overflow-y-auto no-scrollbar font-sans selection:bg-brand-primary/20">
      <header className="fixed top-0 left-0 right-0 z-[1001] bg-white/80 backdrop-blur-xl border-b border-slate-100 p-4">
          <div className="max-w-7xl mx-auto flex justify-between items-center px-4">
              <div className="flex items-center gap-4">
                  <PartnerLogo logoUrl={company.brandKit?.logoAssetId} partnerName={company.name} className="h-10 w-10 rounded-xl shadow-lg" />
                  <span className="font-black text-xl uppercase tracking-tighter text-[#0B1D39]">{stripMarkdown(company.name)}</span>
              </div>
              <div className="flex items-center gap-6">
                   <div className="hidden md:flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
                       <span className="hover:text-brand-primary cursor-pointer transition-colors">Produkter</span>
                       <span className="hover:text-brand-primary cursor-pointer transition-colors">Om os</span>
                       <span className="hover:text-brand-primary cursor-pointer transition-colors">Kontakt</span>
                   </div>
                   <button onClick={onClose} className="p-3 bg-slate-900 text-white rounded-full hover:bg-brand-primary transition-all shadow-xl active:scale-95"><XMarkIcon className="h-6 w-6"/></button>
              </div>
          </div>
      </header>

      <section className="relative min-h-[90vh] flex items-center pt-24 overflow-hidden">
          <div className="absolute inset-0 z-0">
             {heroBg && (
                 <img 
                    src={heroBg.startsWith('asset:') ? '' : heroBg} // Vi skal egentlig bruge en hook her til assets
                    className="w-full h-full object-cover opacity-10 blur-xl" 
                    alt="" 
                 />
             )}
             <div className="absolute inset-0 bg-gradient-to-b from-white via-white/80 to-indigo-50/30"></div>
          </div>

          <div className="relative z-10 max-w-7xl mx-auto px-8 w-full">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                  <div className="space-y-10 animate-in slide-in-from-left duration-1000">
                      <span className="inline-flex px-6 py-2 bg-brand-primary/10 text-brand-primary rounded-full text-[10px] font-black uppercase tracking-[0.3em] border border-brand-primary/20">{stripMarkdown(page.industry)}</span>
                      <h1 className="text-6xl md:text-8xl font-black text-[#0B1D39] tracking-tighter leading-[0.9] uppercase">{stripMarkdown(page.content.hero.title)}</h1>
                      <p className="text-xl md:text-2xl text-slate-500 font-medium leading-relaxed max-w-lg">{stripMarkdown(page.content.hero.subtitle)}</p>
                      <div className="flex gap-4">
                          <button className="px-10 py-5 bg-[#0B1D39] text-white font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-brand-primary transition-all shadow-2xl active:scale-95">{stripMarkdown(page.content.hero.ctaButton)}</button>
                          <button className="px-10 py-5 bg-white border border-slate-200 text-[#0B1D39] font-black uppercase tracking-widest text-xs rounded-2xl hover:bg-slate-50 transition-all shadow-xl active:scale-95">{stripMarkdown(page.content.hero.secondaryButton)}</button>
                      </div>
                  </div>

                  <div className="bg-white border border-slate-100 p-12 rounded-[4rem] shadow-[0_50px_100px_rgba(0,0,0,0.08)] space-y-8 animate-in zoom-in duration-1000">
                      <h3 className="text-2xl font-black text-[#0B1D39] uppercase tracking-tight">Lad os tale om jeres behov</h3>
                      <form onSubmit={handleSubmit} className="space-y-6">
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Navn</label>
                              <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-slate-900 outline-none focus:ring-2 focus:ring-brand-primary/20" required />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Email</label>
                              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-slate-900 outline-none focus:ring-2 focus:ring-brand-primary/20" required />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-slate-400 ml-1">Besked</label>
                              <textarea value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} rows={3} className="w-full bg-slate-50 border-0 rounded-2xl p-4 text-slate-900 outline-none focus:ring-2 focus:ring-brand-primary/20 resize-none" />
                          </div>
                          <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-brand-primary text-white font-black uppercase tracking-widest rounded-2xl hover:brightness-110 shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-95">
                                {isSubmitting ? <SyncIcon className="h-5 w-5 animate-spin" /> : null}
                                {isSubmitting ? 'Sender...' : 'Indsend Forespørgsel'}
                          </button>
                      </form>
                  </div>
              </div>
          </div>
      </section>

      <section className="py-32 bg-slate-900 text-white relative overflow-hidden">
          <div className="max-w-4xl mx-auto px-8 relative z-10 text-center">
              <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-10">{stripMarkdown(page.content.about.title)}</h2>
              <p className="text-xl md:text-2xl text-slate-400 leading-relaxed font-medium italic opacity-80">"{stripMarkdown(page.content.about.text)}"</p>
              <div className="mt-20 flex justify-center">
                  <div className="h-1 w-24 bg-brand-primary rounded-full"></div>
              </div>
          </div>
      </section>

      <footer className="py-20 bg-white border-t border-slate-100 text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-300">© 2026 {stripMarkdown(company.name)} Enterprise Portal</p>
      </footer>
    </div>
  );
};
