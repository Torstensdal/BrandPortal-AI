

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
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { v4 as uuidv4 } from 'uuid';
import { useLanguage } from './context/LanguageContext';
import { fileToBase64 } from './utils/fileUtils';
import { getDomainFromUrl, generateLogoUrl } from './utils/urlUtils';
import { formatDateToYYYYMMDD, generateSchedule } from './utils/dateUtils';
import { SyncIcon } from './components/icons/SyncIcon';
import { CheckCircleIcon } from './components/icons/CheckCircleIcon';

const SYSTEM_OWNER_EMAIL = 'kajtsorensen@gmail.com';

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
  const [isExportingSource, setIsExportingSource] = useState(false);
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
  
  // Simulation & View State
  const [simulationPartnerId, setSimulationPartnerId] = useState<string | null>(null);
  const [previewPageId, setPreviewPageId] = useState<string | null>(null);

  // Derived State
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

  // Effects
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('theme', theme);
    } catch(e) {}
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isLoadingAny = isGenerating || isImporting || isEnriching || isExporting || isExportingSource || isInitializing;

  // Progress Bar Animation
  useEffect(() => {
    let interval: number | undefined;
    if (isLoadingAny) {
      if (activeProgress === 0) setActiveProgress(5);
      interval = window.setInterval(() => {
        setActiveProgress(prev => {
          if (prev >= 98) return prev;
          const jump = prev < 25 ? 5 : prev < 50 ? 2 : prev < 75 ? 1 : 0.2;
          return Math.min(98.5, prev + jump);
        });
      }, 150);
    } else {
      if (activeProgress > 0) {
        setActiveProgress(100);
        const timer = setTimeout(() => setActiveProgress(0), 400);
        return () => clearTimeout(timer);
      }
      if (interval) clearInterval(interval);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [isLoadingAny, activeProgress]);

  // Initialization
  useEffect(() => {
    const init = async () => {
        try {
            const session = await assetStorage.getLastSession();
            if (session && session.email) {
                const { user: authUser, token: authToken } = await apiClient.loginUser(session.email);
                setUser(authUser);
                setToken(authToken);
                const list = await apiClient.getCompaniesForUser(authToken);
                setAllWorkspaces(list);
                
                let target = session.companyId ? list.find(c => c.id === session.companyId) : null;
                if (target) {
                    setCompany(target);
                    if (target.language) setLanguage(target.language);
                }
            }
        } catch (e) {
            console.error("Init failed:", e);
            await assetStorage.clearLastSession();
        } finally {
            setIsInitializing(false);
        }
    };
    init();
  }, [setLanguage]);

  // Handlers
  const handleLogin = async (loggedUser: User, authToken: string) => {
    setUser(loggedUser);
    setToken(authToken);
    const list = await apiClient.getCompaniesForUser(authToken);
    setAllWorkspaces(list);
  };

  const handleSelectWorkspace = async (workspace: Company) => {
      setCompany(workspace);
      if (workspace.language) setLanguage(workspace.language);
      if (user) await assetStorage.setLastSession(user.email, workspace.id);
      setActiveState('dashboard');
  };

  const handleCreateWorkspace = async (name: string, website: string): Promise<Company> => {
      if (!token) throw new Error("No token available.");
      const newWS = await apiClient.createCompany(token, name, website);
      setAllWorkspaces(prev => [...prev, prev.find(x => x.id === newWS.id) ? prev : [...prev, newWS]] as any);
      handleSelectWorkspace(newWS);
      return newWS;
  };

  const handleLogout = async () => {
    try {
      await assetStorage.clearLastSession();
      setUser(null); 
      setToken(null); 
      setCompany(null); 
      window.location.assign('/');
    } catch (error) {
      window.location.reload();
    }
  };

  const handleUpdateCompany = async (updatedDetails: Partial<Company>) => {
    if (!company) return;
    const newCompany = { 
        ...company, 
        ...updatedDetails
    };
    setCompany(newCompany);
    setAllWorkspaces(list => list.map(ws => ws.id === company.id ? newCompany : ws));
    await apiClient.updateCompanyDetails(token || "local-sync", company.id, updatedDetails).catch(console.error);
  };

  // AI & Media Handlers
  const handleMediaUpload = async (files: File[]) => {
    if (!company) return;
    const newAssets: AssetMetadata[] = [];
    for (const file of files) {
        const id = uuidv4();
        await assetStorage.saveAsset(id, file);
        const meta: AssetMetadata = {
            id,
            fileName: file.name,
            type: file.type.startsWith('image') ? 'image' : (file.type.startsWith('video') ? 'video' : 'document'),
            tags: [],
            aiTags: [],
            tagsStatus: (file.type.startsWith('image') || file.type.startsWith('video')) ? 'pending' : 'completed'
        };
        newAssets.push(meta);
        // Start background analysis
        (async () => {
            try {
                const base64 = await fileToBase64(file);
                const aiTags = await geminiService.analyzeMediaForTags(base64, file.type, company.language || 'da');
                const updatedLibrary = (company.mediaLibrary || []).map(a => 
                    a.id === id ? { ...a, aiTags, tagsStatus: 'completed' as const } : a
                );
                handleUpdateCompany({ mediaLibrary: updatedLibrary });
                showToast(`AI analyse færdig for ${file.name}`);
            } catch (e) {}
        })();
    }
    const updatedLibrary = [...(company.mediaLibrary || []), ...newAssets];
    handleUpdateCompany({ mediaLibrary: updatedLibrary });
    showToast(`${files.length} filer uploadet til arkivet.`);
  };

  const handleGenerateIndustryPage = async (industry: string, talkingPoints: string, assetIds: string[], targetLanguage: Language) => {
    if (!company) return;
    setIsGenerating(true);
    try {
        const content = await geminiService.generateIndustryPageContent(company, industry, talkingPoints, targetLanguage);
        const bgUrl = assetIds.length > 0 ? `asset:${assetIds[0]}` : '';
        const newPage: SavedLandingPage = { id: `page-${uuidv4()}`, name: `${industry} Kampagne`, industry, content: { ...content, hero: { ...content.hero, backgroundImageUrl: bgUrl } } };
        await handleUpdateCompany({ savedLandingPages: [...(company.savedLandingPages || []), newPage] });
        showToast("AI Kampagneside genereret!");
    } finally { setIsGenerating(false); }
  };

  const handleSuccessStoryAction = async (partnerId: string, storyId: string, action: 'approve' | 'feature' | 'reject') => {
      if (!company) return;
      const updatedPartners = company.partners.map(p => {
          if (p.id === partnerId) {
              const updatedStories = (p.successStories || []).map(s => s.id === storyId ? { ...s, status: action === 'approve' ? 'approved' : (action === 'feature' ? 'featured' : 'rejected') } as SuccessStory : s);
              return { ...p, successStories: updatedStories };
          }
          return p;
      });
      await handleUpdateCompany({ partners: updatedPartners });
      showToast(`Historie blev ${action === 'approve' ? 'godkendt' : action === 'feature' ? 'fremhævet' : 'afvist'}.`);
  };

  const handleCompleteDripTask = async (taskId: string) => {
    if (!company) return;
    const tasks = [...(company.activeDripCampaigns || [])];
    const taskIdx = tasks.findIndex(t => t.id === taskId);
    if (taskIdx === -1) return;

    const task = tasks[taskIdx];
    const campaign = company.dripCampaigns?.find(c => c.id === task.campaignId);
    if (!campaign) return;

    if (task.currentStepIndex + 1 < campaign.steps.length) {
      tasks[taskIdx] = { ...task, currentStepIndex: task.currentStepIndex + 1 };
      showToast("Trin fuldført. Kontakten flyttet til næste fase.");
    } else {
      tasks[taskIdx] = { ...task, status: 'completed' };
      showToast("Kampagne fuldført for kontakten!", "info");
    }
    await handleUpdateCompany({ activeDripCampaigns: tasks });
  };

  /* Added missing handleUpdateStrategy function to handle content strategy updates */
  const handleUpdateStrategy = async (newStrategy: string) => {
    await handleUpdateCompany({ contentStrategy: newStrategy });
  };

  /* Fixed type inference for new lead activity to ensure it matches LeadActivity interface */
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

  if (isInitializing) return <div className="h-screen flex items-center justify-center bg-slate-900"><SyncIcon className="animate-spin h-12 w-12 text-indigo-500" /></div>;
  if (!user) return <AuthScreen onLogin={handleLogin} />;
  if (!company) return <WorkspaceHubScreen user={user} workspaces={allWorkspaces} onSelectWorkspace={handleSelectWorkspace} onCreateWorkspace={handleCreateWorkspace} />;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-app)] theme-transition relative">
      <SideNav activeState={activeState} onNavigate={setActiveState} company={company} currentUserRole={currentUserRole} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <HeaderNav 
          user={user} company={company} currentUserRole={currentUserRole} theme={theme} toggleTheme={toggleTheme}
          onLogout={handleLogout} onSwitchCompany={() => setCompany(null)} onExportProject={() => { setIsExporting(true); apiClient.importCompany(token!, company).then(() => setIsExporting(false)); }} 
          onImportProject={handleCreateWorkspace as any} onSaveProject={() => handleUpdateCompany({ updatedAt: new Date().toISOString() })}
          onUpdateCompany={handleUpdateCompany} onExportSourceCode={() => {}} isExporting={isExporting} 
          isExportingSource={isExportingSource} isImporting={isImporting}
        />
        <main className="flex-1 overflow-y-auto no-scrollbar relative">
          {activeProgress > 0 && <div className="absolute top-0 left-0 right-0 h-1 bg-brand-primary transition-all duration-300 z-[60]" style={{ width: `${activeProgress}%` }} />}
          
          {activeState === 'dashboard' && <DashboardScreen company={company} onNavigate={setActiveState} onUpdateCompany={handleUpdateCompany} onQuickUpload={async (file) => { await handleMediaUpload([file]); return "ok"; }} />}
          {(activeState.startsWith('onboarding_')) && (
            <OnboardingFlowScreen 
              {...{token: token!, company, activeStep: activeState, onNavigate: setActiveState, isGenerating, currentUserRole, isGeneratingImages: false, feedbackMessage: null, isEnriching}}
              onUpdateCompanyDetails={handleUpdateCompany}
              onEnrichCompany={() => { setIsEnriching(true); return apiClient.enrichFromWebsite(token!, company.website, company.language || 'da').then(d => { handleUpdateCompany(d); setIsEnriching(false); showToast("Virksomhed beriget via AI."); }); }}
              onUpdateStrategy={(s) => handleUpdateStrategy(s)}
              onGenerateStrategy={(g, d) => { setIsGenerating(true); return apiClient.generateStrategy(token!, company.id, g, d).then(s => { handleUpdateCompany({ contentStrategy: s }); setIsGenerating(false); showToast("Strategi genereret."); }); }}
              onGenerateGrowthPlan={() => { setIsGenerating(true); return apiClient.generateCompanyGrowthPlan(token!, company.id).then(p => { handleUpdateCompany({ growthPlan: p }); setIsGenerating(false); showToast("Master Vækstplan genereret."); }); }}
              onUpdateGrowthPlan={(p) => handleUpdateCompany({ growthPlan: p })}
              onSaveGrowthPlanVersion={(n) => handleUpdateCompany({ savedGrowthPlans: [...(company.savedGrowthPlans || []), { ...company.growthPlan!, name: n, id: uuidv4() }] })}
              onUploadFinancialReport={async (f) => { const id = uuidv4(); await assetStorage.saveAsset(id, f); handleUpdateCompany({ financialReportAssetId: `asset:${id}` }); }}
              onDeleteFinancialReport={async () => handleUpdateCompany({ financialReportAssetId: undefined })}
              onGenerateImagesForStrategy={async () => {}}
            />
          )}
          {activeState === 'media_library' && <MediaLibraryScreen company={company} allPartnersForSelector={company.partners} onMediaUpload={handleMediaUpload} onMediaDelete={async (id) => handleUpdateCompany({ mediaLibrary: company.mediaLibrary?.filter(a => a.id !== id) })} onMediaDeleteMultiple={async (idz) => handleUpdateCompany({ mediaLibrary: company.mediaLibrary?.filter(a => !idz.includes(a.id)) })} onGeneratePosts={async (a, pids, t, pl, w, sd, ed, st, et, cid, cn) => { setIsGenerating(true); await geminiService.generateSocialPost(t, pl[0], 'da', '', company.name); setIsGenerating(false); showToast("Opslag planlagt."); }} isGenerating={isGenerating} uploads={[]} onClearCompletedUploads={() => {}} onEditAssetImage={async () => {}} onUpdateAssetTags={(id, tags) => handleUpdateCompany({ mediaLibrary: company.mediaLibrary?.map(a => a.id === id ? { ...a, tags } : a) })} />}
          {activeState === 'partners' && <PartnerScreen company={company} token={token!} onAddPartner={(p) => handleUpdateCompany({ partners: [...(company.partners || []), p] })} onEditPartner={(p) => handleUpdateCompany({ partners: company.partners?.map(x => x.id === p.id ? p : x) })} onDeletePartners={(ids) => handleUpdateCompany({ partners: company.partners?.filter(p => !ids.includes(p.id)) })} onGrantAccessToContacts={async () => {}} onMassUpdateAll={async () => {}} onRefreshPartner={() => {}} onSimulatePartnerPortal={setSimulationPartnerId} enrichmentStatus={null} onImportPartners={async () => {}} onBulkUpdatePartners={async (ids, u) => handleUpdateCompany({ partners: company.partners?.map(p => ids.includes(p.id) ? { ...p, ...u } : p) })} />}
          {activeState === 'growth' && <GrowthScreen company={company} onUpdateStrategy={async (s) => handleUpdateCompany({ contentStrategy: s })} onToggleStrategyLock={async () => handleUpdateCompany({ isContentStrategyLocked: !company.isContentStrategyLocked })} onSaveStrategyVersion={async (n) => handleUpdateCompany({ savedContentStrategies: [...(company.savedContentStrategies || []), { id: uuidv4(), name: n, content: company.contentStrategy!, createdAt: new Date().toISOString() }] })} onRestoreStrategyVersion={async (c) => handleUpdateCompany({ contentStrategy: c })} onDeleteStrategyVersion={async (id) => handleUpdateCompany({ savedContentStrategies: company.savedContentStrategies?.filter(v => v.id !== id) })} onUpdateRoadmapProgress={(p) => handleUpdateCompany({ roadmapProgress: p })} onGenerateIndustryPage={handleGenerateIndustryPage} onEnhanceImage={async () => {}} onPreviewPage={setPreviewPageId} onSuccessStoryAction={handleSuccessStoryAction} />}
          {activeState === 'drip_campaigns' && <DripCampaignsScreen company={company} token={token!} onSaveCampaign={(c) => handleUpdateCompany({ dripCampaigns: [...(company.dripCampaigns || []).filter(x => x.id !== c.id), c] })} onDeleteCampaign={(id) => handleUpdateCompany({ dripCampaigns: company.dripCampaigns?.filter(x => x.id !== id) })} onStartCampaign={async (cid, contacts) => { const newActive = contacts.map(c => ({ id: uuidv4(), campaignId: cid, partnerId: c.partnerId, contactId: c.contactId, currentStepIndex: 0, status: 'active' as const })); await handleUpdateCompany({ activeDripCampaigns: [...(company.activeDripCampaigns || []), ...newActive] }); showToast("Aut outreach startet."); }} onCompleteTask={handleCompleteDripTask} />}
          {activeState === 'leads' && <LeadsScreen company={company} onUpdateLeadStatus={handleUpdateLeadStatus} />}
        </main>
      </div>

      {toast && (
          <div className="fixed bottom-10 right-10 z-[1000] bg-slate-900 border border-brand-primary/30 p-5 rounded-2xl shadow-2xl flex items-center gap-4 animate-in slide-in-from-right-10 duration-500">
              <div className="p-2 bg-brand-primary/10 rounded-lg text-brand-primary">
                  <CheckCircleIcon className="h-5 w-5" />
              </div>
              <span className="text-xs font-black text-white uppercase tracking-widest">{toast.message}</span>
          </div>
      )}

      {previewPageId && (
          <LandingPagePreview 
            page={company.savedLandingPages?.find(p => p.id === previewPageId)!} 
            company={company} 
            onClose={() => setPreviewPageId(null)} 
            onLeadSubmit={async (l) => { const nl = { ...l, id: uuidv4(), partnerId: '__company__', status: 'New', score: 50, submittedAt: new Date().toISOString() }; handleUpdateCompany({ leads: [...(company.leads || []), nl] }); showToast("Nyt lead modtaget!"); }} 
          />
      )}
    </div>
  );
};
