import React, { useState } from 'react';
import { User } from '../types';
import { useLanguage } from '../context/LanguageContext';
import * as apiClient from '../services/apiClient';
import { BrandPortalLogo } from './BrandPortalLogo';
import { SyncIcon } from './icons/SyncIcon';
import { KeyIcon } from './icons/KeyIcon';

interface AuthScreenProps {
  onLogin: (user: User, token: string, inviteToken?: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
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
      setError(t('validation_invalidEmail') || "Indtast venligst en email.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      let effectiveEmail = cleanEmail;
      if (inviteToken && !effectiveEmail) {
          try {
              const decoded = JSON.parse(atob(inviteToken));
              effectiveEmail = decoded.email;
          } catch (e) {
              setError("Ugyldig invitationskode.");
              setIsLoading(false);
              return;
          }
      }

      const { user, token } = await apiClient.loginUser(effectiveEmail);
      onLogin(user, token, inviteToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Der opstod en fejl ved login.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--bg-app)] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--bg-modal)] rounded-[3rem] shadow-2xl border border-[var(--border-primary)] p-10 theme-transition">
        <div className="flex flex-col items-center mb-10">
            <div className="flex flex-col items-center gap-3 mb-4 text-center">
                <div className="h-20 w-20 bg-[#0B1D39] text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-brand-primary/20 mb-4 animate-in zoom-in duration-1000">
                    <BrandPortalLogo className="h-14 w-14" />
                </div>
                <span className="text-3xl font-black text-[var(--text-primary)] tracking-tighter uppercase">BrandPortal-AI</span>
                <span className="text-[10px] font-black text-brand-primary uppercase tracking-[0.4em] -mt-2">
                    {t('auth_portalTitle') || "VÆKSTPORTAL"}
                </span>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            {!showInviteField ? (
                <div className="relative">
                    <label htmlFor="email" className="block text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2 ml-1">
                        {t('auth_yourEmail') || "DIN EMAIL"}
                    </label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full rounded-2xl border-[var(--border-primary)] bg-[var(--bg-input)] shadow-inner focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-[var(--text-primary)] text-lg py-4 px-6 placeholder-[var(--text-placeholder)] transition-all outline-none"
                        placeholder="navn@virksomhed.dk"
                        required={!inviteToken}
                    />
                </div>
            ) : (
                <div className="relative animate-in slide-in-from-top-2 duration-300">
                    <label htmlFor="inviteToken" className="block text-brand-primary uppercase tracking-[0.2em] mb-2 ml-1">
                        {t('invitation_tokenLabel') || "INVITATIONSKODE"}
                    </label>
                    <textarea
                        id="inviteToken"
                        value={inviteToken}
                        onChange={(e) => setInviteToken(e.target.value)}
                        className="block w-full rounded-2xl border-brand-primary/50 bg-[var(--bg-input)] shadow-inner focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 text-brand-primary/70 text-xs font-mono py-4 px-6 placeholder-[var(--text-placeholder)] transition-all outline-none resize-none"
                        placeholder={t('auth_enterToken') || "Indtast kode her..."}
                        rows={4}
                        required
                    />
                </div>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-5 px-4 border border-transparent rounded-2xl shadow-xl text-lg font-black text-white bg-brand-primary hover:brightness-110 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[var(--bg-app)] focus:ring-brand-primary disabled:bg-[var(--bg-card-hover)] disabled:text-[var(--text-light-muted)] disabled:cursor-not-allowed transition-all uppercase tracking-widest"
            >
                {isLoading ? <SyncIcon className="h-7 w-7 animate-spin" /> : (showInviteField ? (t('auth_joinButton') || "DELTAG") : (t('auth_loginButton') || "LOG IND"))}
            </button>

            <div className="text-center">
                <button 
                    type="button"
                    onClick={() => { setShowInviteField(!showInviteField); setError(null); }}
                    className="text-[10px] font-black text-[var(--text-muted)] hover:text-brand-primary transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                    <KeyIcon className="h-3 w-3" />
                    {showInviteField ? "Gå tilbage til login" : (t('auth_hasInviteToken') || "Har du en invitationskode?")}
                </button>
            </div>
        </form>

        {error && (
            <div className="mt-8 p-4 bg-brand-accent-red/30 border border-brand-accent-red/50 rounded-2xl">
                <p className="text-sm text-brand-accent-red text-center font-semibold">{error}</p>
            </div>
        )}
        
        <div className="mt-12 pt-8 border-t border-[var(--border-primary)]/50 text-center">
            <p className="text-[10px] text-[var(--text-light-muted)] uppercase font-black tracking-[0.3em]">
                Enterprise BrandPortal © 2026
            </p>
        </div>
      </div>
    </div>
  );
};
