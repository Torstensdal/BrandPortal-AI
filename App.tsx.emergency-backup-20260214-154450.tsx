
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  User, Company, AppState, TeamMemberRole, SocialPlatform, 
  CalendarEvent, PartnerPostState, ProspectProposal, AssetMetadata, 
  Theme, Partner, Campaign, Language, PhotoStudioStyle, SavedLandingPage,
  Lead, SuccessStory, LeadStatus, LeadActivity
} from './types';

// Screens & Components
import { AuthScreen } from './components/CompanyAuthScreen';
import { WorkspaceHubScreen } from './components/WorkspaceHubScreen';
import { SideNav } from './components/SideNav';
import { HeaderNav } from './components/HeaderNav';
import { OnboardingFlowScreen } from './components/OnboardingFlowScreen';
import { MediaLibraryScreen } from './components/MediaLibraryScreen';
import { CalendarScreen } from './components/CalendarScreen';
import { PartnerScreen } from './components/PartnerScreen';
import { AnalyticsScreen } from './components/AnalyticsScreen';
import { GrowthScreen } from './components/GrowthScreen';
import { UsersScreen } from './components/UsersScreen';
import { DashboardScreen } from './components/DashboardScreen';
import { DripCampaignsScreen } from './components/DripCampaignsScreen';
import { LeadsScreen } from './components/LeadsScreen';
import { IntegrationsScreen } from './components/IntegrationsScreen';
import { PartnerPortalScreen } from './components/PartnerPortalScreen';
import { ProspectingScreen } from './components/ProspectingScreen';
import { LandingPagePreview } from './components/LandingPagePreview';

// Services & Utils
import * as apiClient from './services/apiClient';
import * as assetStorage from './utils/assetStorage';
import * as geminiService from './services/geminiService';
import { v4 as uuidv4 } from 'uuid';
import { useLanguage } from './context/LanguageContext';
import { fileToBase64 } from './utils/fileUtils';
import { SyncIcon } from './components/icons/SyncIcon';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';

const SYSTEM_OWNER_EMAIL = 'kajtsorensen@gmail.com';
const AUTO_DEMO_EMAIL = 'demo-user@brandportal-ai.com';

export const App: React.FC = () => {
  const { t, setLanguage, language } = useLanguage();
  
  // Auth & Session State
  const [isInitializing, setIsInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  
  // Workspace State
  const [allWorkspaces, setAllWorkspaces] = useState<Company[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [activeState, setActiveState] = useState<AppState>('dashboard');
  
  // UI & Processing State
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [activeProgress, setActiveProgress] = useState(0);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('theme') as Theme) || 'light';
    } catch(e) {
      return 'light';
    }
  });
  
  const [simulationPartnerId, setSimulationPartnerId] = useState<string | null>(null);
  const [previewPageId, setPreviewPageId] = useState<string | null>(null);

  const currentUserRole = useMemo((): TeamMemberRole => {
    if (!user) return 'member';
    const userEmail = (user.email || '').trim().toLowerCase();
    if (userEmail === SYSTEM_OWNER_EMAIL.toLowerCase()) return 'admin';
    if (!company || !company.members) return 'member';
    const member = company.members.find(m => m.email.trim().toLowerCase() === userEmail);
    return member?.role || 'member';
  }, [user, company]);

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch(e) {}
  }, [theme]);

  const isLoadingAny = isGenerating || isImporting || isEnriching || isExporting || isInitializing;

  // AUTO-ENTRY LOGIK: Her sker magien der fjerner login-skærmen
  useEffect(() => {
    const forceEntry = async () => {
        try {
            const session = await assetStorage.getLastSession();
            let emailToUse = session?.email || AUTO_DEMO_EMAIL;
            
            // 1. Log ind (Auto eller gemt)
            const { user: authUser, token: authToken } = await apiClient.loginUser(emailToUse);
            setUser(authUser);
            setToken(authToken);
            
            // 2. Hent projekter
            const list = await apiClient.getCompaniesForUser(authToken);
            setAllWorkspaces(list);
            
            // 3. Vælg projekt eller opret et nyt lynhurtigt
            let target = session?.companyId ? list.find(c => c.id === session.companyId) : (list.length > 0 ? list[0] : null);
            
            if (!target) {
                // Ingen projekter fundet? Opret et automatisk så brugeren ikke ser hub'en
                target = await apiClient.createCompany(authToken, "Demo Projekt", "demo-site.dk");
                setAllWorkspaces([target]);
            }
            
            setCompany(target);
            if (target.language) setLanguage(target.language);
            await assetStorage.setLastSession(authUser.email, target.id);
            
        } catch (e) {
            console.error("Auto-entry failed:", e);
        } finally {
            setIsInitializing(false);
        }
    };
    forceEntry();
  }, [setLanguage]);

  const handleUpdateCompany = async (updatedDetails: Partial<Company>) => {
    if (!company) return;
    const newCompany = { ...company, ...updatedDetails };
    setCompany(newCompany);
    setAllWorkspaces(list => list.map(ws => ws.id === company.id ? newCompany : ws));
    await apiClient.updateCompanyDetails(token || "demo-token", company.id, updatedDetails).catch(console.error);
  };

  const handleUpdateLeadStatus = async (leadId: string, newStatus: LeadStatus) => {
    if (!company) return;
    const updatedLeads: Lead[] = (company.leads || []).map(l => {
        if (l.id === leadId) {
            const newActivity: LeadActivity = {
                id: uuidv4(),
                type: 'status_change',
                description: `Status ændret til ${newStatus}`,
                timestamp: new Date().toISOString()
            };
            return { ...l, status: newStatus, activity: [...(l.activity || []), newActivity] };
        }
        return l;
    });
    await handleUpdateCompany({ leads: updatedLeads });
    showToast(`Lead status opdateret til ${newStatus}`);
  };

  const handleMediaUpload = async (files: File[]) => {
    if (!company) return;
    const newAssets: AssetMetadata[] = [];
    for (const file of files) {
        const id = uuidv4();
        await assetStorage.saveAsset(id, file);
        const meta: AssetMetadata = {
            id, fileName: file.name, type: file.type.startsWith('image') ? 'image' : (file.type.startsWith('video') ? 'video' : 'document'),
            tags: [], aiTags: [], tagsStatus: 'pending'
        };
        newAssets.push(meta);
        (async () => {
            try {
                const base64 = await fileToBase64(file);
                const aiTags = await geminiService.analyzeMediaForTags(base64, file.type, company.language || 'da');
                const updatedLibrary = (company.mediaLibrary || []).map(a => a.id === id ? { ...a, aiTags, tagsStatus: 'completed' as const } : a);
                handleUpdateCompany({ mediaLibrary: updatedLibrary });
            } catch (e) {}
        })();
    }
    await handleUpdateCompany({ mediaLibrary: [...(company.mediaLibrary || []), ...newAssets] });
    showToast("Filer uploadet.");
  };

  if (isInitializing) {
      return (
          <div className="h-screen flex flex-col items-center justify-center bg-[#020617] text-white">
              <SyncIcon className="animate-spin h-12 w-12 text-indigo-500 mb-6" />
              <h2 className="text-sm font-black uppercase tracking-[0.3em] animate-pulse">Initialiserer Engine...</h2>
          </div>
      );
  }

  // Hvis alt andet fejler, så vis Hub'en, men normalt vil useEffect ovenfor fange det
  if (!company) return <WorkspaceHubScreen user={user!} workspaces={allWorkspaces} onSelectWorkspace={setCompany} onCreateWorkspace={async (n, w) => { const res = await apiClient.createCompany(token!, n, w); setCompany(res); return res; }} />;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-app)] theme-transition relative">
      <SideNav activeState={activeState} onNavigate={setActiveState} company={company} currentUserRole={currentUserRole} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <HeaderNav 
          user={user} company={company} currentUserRole={currentUserRole} theme={theme} toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          onLogout={() => { assetStorage.clearLastSession(); window.location.reload(); }} onSwitchCompany={() => setCompany(null)} onExportProject={() => {}} 
          onImportProject={() => {}} onSaveProject={() => handleUpdateCompany({ updatedAt: new Date().toISOString() })}
          onUpdateCompany={handleUpdateCompany} onExportSourceCode={() => {}} isExporting={isExporting} 
        />
        <main className="flex-1 overflow-y-auto no-scrollbar relative">
          {activeState === 'dashboard' && <DashboardScreen company={company} onNavigate={setActiveState} onUpdateCompany={handleUpdateCompany} onQuickUpload={async (file) => { await handleMediaUpload([file]); return "ok"; }} />}
          {(activeState.startsWith('onboarding_')) && (
            <OnboardingFlowScreen 
              {...{token: token!, company, activeStep: activeState, onNavigate: setActiveState, isGenerating, currentUserRole, isGeneratingImages: false, feedbackMessage: null, isEnriching: false}}
              onUpdateCompanyDetails={handleUpdateCompany}
              onEnrichCompany={async () => {}}
              onUpdateStrategy={async (s) => handleUpdateCompany({ contentStrategy: s })}
              onGenerateStrategy={async () => {}}
              onGenerateGrowthPlan={async () => {}}
              onUpdateGrowthPlan={(p) => handleUpdateCompany({ growthPlan: p })}
              onSaveGrowthPlanVersion={(n) => handleUpdateCompany({ savedGrowthPlans: [...(company.savedGrowthPlans || []), { ...company.growthPlan!, name: n, id: uuidv4() }] })}
              onUploadFinancialReport={async () => {}}
              onDeleteFinancialReport={async () => {}}
              onGenerateImagesForStrategy={async () => {}}
            />
          )}
          {activeState === 'media_library' && <MediaLibraryScreen company={company} allPartnersForSelector={company.partners} onMediaUpload={handleMediaUpload} onMediaDelete={async (id) => handleUpdateCompany({ mediaLibrary: company.mediaLibrary?.filter(a => a.id !== id) })} onMediaDeleteMultiple={async (idz) => handleUpdateCompany({ mediaLibrary: company.mediaLibrary?.filter(a => !idz.includes(a.id)) })} onGeneratePosts={async () => {}} isGenerating={isGenerating} uploads={[]} onClearCompletedUploads={() => {}} onEditAssetImage={async () => {}} onUpdateAssetTags={(id, tags) => handleUpdateCompany({ mediaLibrary: company.mediaLibrary?.map(a => a.id === id ? { ...a, tags } : a) })} />}
          {activeState === 'partners' && <PartnerScreen company={company} token={token!} onAddPartner={(p) => handleUpdateCompany({ partners: [...(company.partners || []), p] })} onEditPartner={(p) => handleUpdateCompany({ partners: company.partners?.map(x => x.id === p.id ? p : x) })} onDeletePartners={(ids) => handleUpdateCompany({ partners: company.partners?.filter(p => !ids.includes(p.id)) })} onGrantAccessToContacts={async () => {}} onMassUpdateAll={async () => {}} onRefreshPartner={() => {}} onSimulatePartnerPortal={setSimulationPartnerId} enrichmentStatus={null} onImportPartners={async () => {}} onBulkUpdatePartners={async (ids, u) => handleUpdateCompany({ partners: company.partners?.map(p => ids.includes(p.id) ? { ...p, ...u } : p) })} />}
          {activeState === 'growth' && <GrowthScreen company={company} onUpdateStrategy={async (s) => handleUpdateCompany({ contentStrategy: s })} onToggleStrategyLock={async () => handleUpdateCompany({ isContentStrategyLocked: !company.isContentStrategyLocked })} onSaveStrategyVersion={async (n) => handleUpdateCompany({ savedContentStrategies: [...(company.savedContentStrategies || []), { id: uuidv4(), name: n, content: company.contentStrategy!, createdAt: new Date().toISOString() }] })} onRestoreStrategyVersion={async (c) => handleUpdateCompany({ contentStrategy: c })} onDeleteStrategyVersion={async (id) => handleUpdateCompany({ savedContentStrategies: company.savedContentStrategies?.filter(v => v.id !== id) })} onUpdateRoadmapProgress={(p) => handleUpdateCompany({ roadmapProgress: p })} onGenerateIndustryPage={async () => {}} onEnhanceImage={async () => {}} onPreviewPage={setPreviewPageId} />}
          {activeState === 'leads' && <LeadsScreen company={company} onUpdateLeadStatus={handleUpdateLeadStatus} />}
          {activeState === 'analytics' && <AnalyticsScreen company={company} token={token!} onUpdateCompany={handleUpdateCompany} />}
        </main>
      </div>

      {toast && (
          <div className="fixed bottom-10 right-10 z-[1000] bg-slate-900 border border-brand-primary/30 p-5 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-10 duration-500">
              <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary"><CheckCircleIcon className="h-5 w-5" /></div>
              <span className="text-xs font-black text-white uppercase tracking-widest">{toast.message}</span>
          </div>
      )}
    </div>
  );
};
