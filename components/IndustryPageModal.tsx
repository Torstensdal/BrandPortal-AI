
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AssetMetadata, Language } from '../types';
import { XMarkIcon } from './icons/XMarkIcon';
import { BuildingStorefrontIcon } from './icons/BuildingStorefrontIcon';
import { SyncIcon } from './icons/SyncIcon';
import { CheckIcon } from './icons/CheckIcon';
import * as assetStorage from '../utils/assetStorage';

interface IndustryPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (industry: string, talkingPoints: string, assetIds: string[], targetLanguage: Language) => Promise<void>;
  mediaLibrary: AssetMetadata[];
  language: Language;
}

export const IndustryPageModal: React.FC<IndustryPageModalProps> = ({ isOpen, onClose, onGenerate, mediaLibrary, language }) => {
  const { t } = useLanguage();
  const [industry, setIndustry] = useState('');
  const [talkingPoints, setTalkingPoints] = useState('');
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
        // Hent previews for alle billeder
        mediaLibrary.filter(a => a.type === 'image').forEach(async asset => {
            const file = await assetStorage.getAsset(asset.id);
            if (file) {
                setPreviews(prev => ({ ...prev, [asset.id]: URL.createObjectURL(file) }));
            }
        });
    }
  }, [isOpen, mediaLibrary]);

  if (!isOpen) return null;

  const handleToggleAsset = (id: string) => {
    setSelectedAssetIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!industry || !talkingPoints) return;
    setIsGenerating(true);
    try {
        await onGenerate(industry, talkingPoints, Array.from(selectedAssetIds), language);
        onClose();
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--bg-transparent-dark)] backdrop-blur-md flex justify-center items-center p-4" onClick={onClose}>
      <div className="relative w-full max-w-2xl bg-[var(--bg-modal)] rounded-[2.5rem] shadow-2xl border border-[var(--border-primary)] flex flex-col max-h-[90vh] overflow-hidden theme-transition" onClick={e => e.stopPropagation()}>
        <div className="p-8 border-b border-[var(--border-primary)] flex justify-between items-center bg-[var(--bg-card-secondary)]/30 shrink-0">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-brand-primary/10 rounded-xl text-brand-primary">
                    <BuildingStorefrontIcon className="h-6 w-6" />
                </div>
                <div>
                    <h3 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight">Branche-wizard</h3>
                    <p className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mt-1">Generer kampagneside med AI</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"><XMarkIcon className="h-6 w-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-grow overflow-y-auto p-8 space-y-8 no-scrollbar">
            <div className="space-y-4">
                <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Vælg Branche</label>
                <input 
                    type="text" 
                    value={industry}
                    onChange={e => setIndustry(e.target.value)}
                    placeholder="f.eks. Industrielt Design, Fashion, Tech..."
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-2xl p-4 text-[var(--text-primary)] font-bold outline-none focus:border-brand-primary transition-all shadow-inner"
                    required
                />
            </div>

            <div className="space-y-4">
                <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Vigtige Budskaber / Kampagne-fokus</label>
                <textarea 
                    value={talkingPoints}
                    onChange={e => setTalkingPoints(e.target.value)}
                    rows={4}
                    placeholder="Hvad er det vigtigste vi skal fortælle kunden i denne branche?"
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-2xl p-4 text-[var(--text-primary)] outline-none focus:border-brand-primary transition-all shadow-inner resize-none leading-relaxed"
                    required
                />
            </div>

            <div className="space-y-4">
                <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Vælg Visuelle Aktiver</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 bg-[var(--bg-input)] p-4 rounded-3xl border border-[var(--border-primary)] shadow-inner">
                    {mediaLibrary.filter(a => a.type === 'image').map(asset => (
                        <div 
                            key={asset.id} 
                            onClick={() => handleToggleAsset(asset.id)}
                            className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${selectedAssetIds.has(asset.id) ? 'border-brand-primary ring-2 ring-brand-primary/20' : 'border-transparent hover:border-brand-primary/30'}`}
                        >
                            <img src={previews[asset.id]} className="w-full h-full object-cover" alt="" />
                            {selectedAssetIds.has(asset.id) && (
                                <div className="absolute inset-0 bg-brand-primary/20 flex items-center justify-center">
                                    <div className="bg-brand-primary text-white rounded-full p-1 shadow-lg">
                                        <CheckIcon className="h-4 w-4" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {mediaLibrary.filter(a => a.type === 'image').length === 0 && (
                        <p className="col-span-full py-6 text-center text-[10px] font-black text-[var(--text-muted)] uppercase">Ingen billeder i arkivet</p>
                    )}
                </div>
            </div>
        </form>

        <div className="p-6 border-t border-[var(--border-primary)] bg-[var(--bg-card-secondary)]/50 flex justify-end gap-3 shrink-0">
            <button type="button" onClick={onClose} className="px-8 py-4 bg-[var(--bg-app)] text-[var(--text-muted)] text-[10px] font-black uppercase tracking-widest rounded-xl hover:text-[var(--text-primary)] transition-all">Annuller</button>
            <button 
                type="submit" 
                onClick={handleSubmit}
                disabled={isGenerating || !industry || !talkingPoints}
                className="px-12 py-4 bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-xl hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-3"
            >
                {isGenerating ? <SyncIcon className="h-4 w-4 animate-spin" /> : null}
                <span>{isGenerating ? "AI Genererer..." : "Start Generering"}</span>
            </button>
        </div>
      </div>
    </div>
  );
};
