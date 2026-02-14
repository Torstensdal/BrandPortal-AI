
import React, { useState, useEffect } from 'react';
import { AssetMetadata } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { CameraIcon } from './icons/CameraIcon';
import { AiCreationIcon } from './icons/AiCreationIcon';
import { SyncIcon } from './icons/SyncIcon';
import { CheckIcon } from './icons/CheckIcon';
import * as assetStorage from '../utils/assetStorage';

interface PhotoStudioProps {
  mediaLibrary: AssetMetadata[];
  onEnhance: (assetId: string, prompt: string) => Promise<void>;
}

export const PhotoStudio: React.FC<PhotoStudioProps> = ({ mediaLibrary, onEnhance }) => {
  const { t } = useLanguage();
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    mediaLibrary.filter(a => a.type === 'image').forEach(async asset => {
        if (!previews[asset.id]) {
            const file = await assetStorage.getAsset(asset.id);
            if (file) setPreviews(prev => ({ ...prev, [asset.id]: URL.createObjectURL(file) }));
        }
    });
  }, [mediaLibrary]);

  const styles = [
    { label: 'Cinematisk', prompt: 'Make the lighting cinematic, high contrast, professional photography look.' },
    { label: 'Minimalistisk', prompt: 'Clean, minimalist style with soft shadows and neutral background.' },
    { label: 'Sommer-vibe', prompt: 'Bright, warm summer lighting, vibrant colors, sunny atmosphere.' },
    { label: 'Studio White', prompt: 'Professional studio photography, solid white background, clean product lighting.' },
    { label: 'Drama', prompt: 'Dark, dramatic lighting with strong shadows and highlight focus.' }
  ];

  const handleEnhance = async () => {
    if (!selectedAssetId || !prompt) return;
    setIsProcessing(true);
    try {
        await onEnhance(selectedAssetId, prompt);
        setPrompt('');
        alert("Billede transformeret og tilføjet til arkivet!");
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-in fade-in duration-700">
        <div className="lg:col-span-2 space-y-8">
            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[3rem] p-10 shadow-2xl">
                <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-8 flex items-center gap-4">
                    <CameraIcon className="h-8 w-8 text-brand-primary" />
                    Vælg Kildemateriale
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-4">
                    {mediaLibrary.filter(a => a.type === 'image').map(asset => (
                        <div 
                            key={asset.id} 
                            onClick={() => setSelectedAssetId(asset.id)}
                            className={`relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-4 transition-all ${selectedAssetId === asset.id ? 'border-brand-primary scale-105 shadow-2xl' : 'border-transparent hover:border-brand-primary/30'}`}
                        >
                            <img src={previews[asset.id]} className="w-full h-full object-cover" alt="" />
                            {selectedAssetId === asset.id && (
                                <div className="absolute inset-0 bg-brand-primary/10 flex items-center justify-center">
                                    <div className="bg-brand-primary text-white rounded-full p-1.5 shadow-xl">
                                        <CheckIcon className="h-5 w-5" />
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    {mediaLibrary.filter(a => a.type === 'image').length === 0 && (
                        <div className="col-span-full py-20 text-center border-2 border-dashed border-[var(--border-primary)] rounded-[2rem] opacity-30">
                            <p className="text-xs font-black uppercase tracking-widest">Ingen billeder fundet i arkivet</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-[3rem] p-10 shadow-2xl">
                <h3 className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-8">AI Transformation</h3>
                <div className="space-y-8">
                    <div className="space-y-4">
                        <label className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Beskriv ønsket resultat</label>
                        <textarea 
                            value={prompt}
                            onChange={e => setPrompt(e.target.value)}
                            rows={3}
                            placeholder="f.eks. Gør baggrunden sløret og tilføj varmt lys fra siden..."
                            className="w-full bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-3xl p-6 text-[var(--text-primary)] outline-none focus:border-brand-primary transition-all shadow-inner resize-none leading-relaxed"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {styles.map(style => (
                            <button 
                                key={style.label}
                                onClick={() => setPrompt(style.prompt)}
                                className="px-5 py-2.5 bg-[var(--bg-card-secondary)] border border-[var(--border-primary)] text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] rounded-xl hover:border-brand-primary hover:text-brand-primary transition-all active:scale-95"
                            >
                                {style.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        <div className="space-y-8">
            <div className="bg-gradient-to-br from-brand-primary/20 to-[var(--bg-card)] border border-brand-primary/30 p-10 rounded-[3rem] shadow-2xl flex flex-col items-center text-center">
                <div className="p-5 bg-white rounded-3xl shadow-xl mb-8">
                    <AiCreationIcon className="h-12 w-12 text-brand-primary" />
                </div>
                <h4 className="text-xl font-black text-[var(--text-primary)] uppercase tracking-tight mb-4 leading-none">Klar til fremkaldelse?</h4>
                <p className="text-sm text-[var(--text-secondary)] font-medium leading-relaxed mb-10 opacity-70">Vores AI model transformerer dit valgte billede baseret på din beskrivelse. Det tager ca. 10-15 sekunder.</p>
                <button 
                    onClick={handleEnhance}
                    disabled={isProcessing || !selectedAssetId || !prompt}
                    className="w-full py-5 bg-brand-primary text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-brand-primary/30 hover:brightness-110 disabled:opacity-30 transition-all flex items-center justify-center gap-4 active:scale-95"
                >
                    {isProcessing ? <SyncIcon className="h-5 w-5 animate-spin" /> : <CameraIcon className="h-5 w-5" />}
                    <span>{isProcessing ? "Transformerer..." : "Transformer Billede"}</span>
                </button>
            </div>

            <div className="bg-[var(--bg-card)] border border-[var(--border-primary)] p-8 rounded-[2.5rem] shadow-xl">
                <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-4">Senest valgte</h4>
                <div className="aspect-square rounded-2xl overflow-hidden bg-[var(--bg-input)] border border-[var(--border-primary)] relative shadow-inner">
                    {selectedAssetId ? (
                        <img src={previews[selectedAssetId]} className="w-full h-full object-contain" alt="" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center opacity-10">
                            <CameraIcon className="h-20 w-20" />
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
