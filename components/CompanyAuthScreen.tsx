
import React, { useState } from 'react';
import { User } from '../types';
import { useLanguage } from '../context/LanguageContext';
import * as apiClient from '../services/apiClient';
import { BrandPortalLogo } from './BrandPortalLogo';
import { SyncIcon } from './icons/SyncIcon';
import { KeyIcon } from './icons/KeyIcon';
import { RocketLaunchIcon } from './icons/RocketLaunchIcon';

interface AuthScreenProps {
  onLogin: (user: User, token: string, inviteToken?: string) => void;
  onQuickStart: () => Promise<void>;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin, onQuickStart }) => {
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [showInviteField, setShowInviteField] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    
    if (!cleanEmail && !inviteToken) {
      setError("Indtast venligst en email.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      let effectiveEmail = cleanEmail;
      const { user, token } = await apiClient.loginUser(effectiveEmail);
      onLogin(user, token, inviteToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Der opstod en fejl ved login.');
      setIsLoading(false);
    }
  };

  const handleQuickEntry = async () => {
    setIsLoading(true);
    setError(null);
    try {
        await onQuickStart();
    } catch (err) {
        setError("Kunne ikke starte demo-tilstand.");
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] flex items-center justify-center p-4 selection:bg-indigo-500/30">
      <div className="w-full max-w-md bg-[#0F172A] rounded-[3rem] shadow-2xl border border-slate-800 p-10 relative overflow-hidden">
        
        {/* Dekorative baggrunds-elementer */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-teal-600/10 rounded-full blur-3xl"></div>

        <div className="flex flex-col items-center mb-10 relative z-10">
            <div className="h-20 w-20 bg-[#1E293B] text-white rounded-3xl flex items-center justify-center shadow-2xl border border-slate-700 mb-6 animate-in zoom-in duration-1000">
                <BrandPortalLogo className="h-12 w-12 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-1">BrandPortal-AI</h1>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">ENTERPRISE VÆKSTPORTAL</span>
        </div>

        <div className="space-y-6 relative z-10">
            <button 
                onClick={handleQuickEntry}
                disabled={isLoading}
                className="w-full py-5 px-6 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
            >
                {isLoading ? <SyncIcon className="h-5 w-5 animate-spin" /> : <RocketLaunchIcon className="h-5 w-5 group-hover:rotate-12 transition-transform" />}
                <span>UDFORSK DEMO NU</span>
            </button>

            <div className="flex items-center gap-4 py-2">
                <div className="h-px flex-grow bg-slate-800"></div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">ELLER LOG IND</span>
                <div className="h-px flex-grow bg-slate-800"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {!showInviteField ? (
                    <div>
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Din Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-[#1E293B] border border-slate-700 rounded-2xl py-4 px-6 text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-all shadow-inner"
                            placeholder="navn@virksomhed.dk"
                        />
                    </div>
                ) : (
                    <div>
                        <label className="block text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 ml-1">Invitationskode</label>
                        <input
                            type="text"
                            value={inviteToken}
                            onChange={(e) => setInviteToken(e.target.value)}
                            className="w-full bg-[#1E293B] border border-indigo-500/30 rounded-2xl py-4 px-6 text-indigo-100 placeholder-indigo-900/50 outline-none focus:border-indigo-500 transition-all font-mono text-xs"
                            placeholder="Indtast kode..."
                        />
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 bg-slate-800 text-slate-300 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-700 hover:text-white transition-all border border-slate-700 active:scale-95"
                >
                    {isLoading ? <SyncIcon className="h-4 w-4 animate-spin mx-auto" /> : "LOG IND"}
                </button>
            </form>

            <div className="text-center">
                <button 
                    onClick={() => { setShowInviteField(!showInviteField); setError(null); }}
                    className="text-[10px] font-black text-slate-600 hover:text-indigo-400 transition-colors inline-flex items-center gap-2"
                >
                    <KeyIcon className="h-3.5 w-3.5" />
                    {showInviteField ? "Tilbage til login" : "Har du en invitationskode?"}
                </button>
            </div>
        </div>

        {error && (
            <div className="mt-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl animate-in shake duration-500">
                <p className="text-xs text-red-400 text-center font-bold">{error}</p>
            </div>
        )}
        
        <div className="mt-12 pt-8 border-t border-slate-800/50 text-center opacity-30">
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.3em]">Enterprise BrandPortal © 2026</p>
        </div>
      </div>
    </div>
  );
};
