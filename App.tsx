import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  User, Company, AppState, TeamMemberRole, SocialPlatform, 
  CalendarEvent, PartnerPostState, ProspectProposal, AssetMetadata, 
  Theme, Partner, Campaign, Language, PhotoStudioStyle
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

// Services & Utils
import * as apiClient from './services/apiClient';
import * as assetStorage from './utils/assetStorage';
import * as geminiService from './services/geminiService';
import JSZip from 'jszip';
import FileSaver from 'file-saver';
import { v4 as uuidv4 } from 'uuid';
import { useLanguage } from './context/LanguageContext';
import { fileToBase64 } from './utils/fileUtils';
import { getDomainFromUrl } from './utils/urlUtils';
import { formatDateToYYYYMMDD, generateSchedule } from './utils/dateUtils';
import { SyncIcon } from './components/icons/SyncIcon';

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
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem('theme') as Theme) || 'light';
    } catch(e) {
      console.warn("App: Kunne ikke tilgå localStorage for tema.");
      return 'light';
    }
  });
  
  // Simulation State
  const [simulationPartnerId, setSimulationPartnerId] = useState<string | null>(null);

  // Derived State
  const currentUserRole = useMemo((): TeamMemberRole => {
    if (!user) return 'member';
    const userEmail = (user.email || '').trim().toLowerCase();
    if (userEmail === SYSTEM_OWNER_EMAIL.toLowerCase()) return 'admin';
    if (!company || !company.members) return 'member';
    const member = company.members.find(m => m.email.trim().toLowerCase() === userEmail);
    return member?.role || 'member';
  }, [user, company]);

  const filteredPartnersList = useMemo((): Partner[] => {
    if (!company) return [];
    const companyDomain = getDomainFromUrl(company.website);
    return (company.partners || []).filter(p => {
        const pDomain = getDomainFromUrl(p.website);
        const isSelfByDomain = pDomain && pDomain === companyDomain;
        const isSelfByName = p.name.toLowerCase() === company.name.toLowerCase();
        return !isSelfByDomain && !isSelfByName;
    });
  }, [company]);

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

  // Progress Bar Animation Logic
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
      setAllWorkspaces(prev => [...prev, newWS]);
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
        ...updatedDetails, 
        dripCampaigns: updatedDetails.dripCampaigns || company.dripCampaigns || [],
        campaigns: updatedDetails.campaigns || company.campaigns || [],
        savedGrowthPlans: updatedDetails.savedGrowthPlans || company.savedGrowthPlans || [],
        savedContentStrategies: updatedDetails.savedContentStrategies || company.savedContentStrategies || []
    };
    setCompany(newCompany);
    setAllWorkspaces(list => list.map(ws => ws.id === company.id ? newCompany : ws));
    await apiClient.updateCompanyDetails(token || "local-sync", company.id, updatedDetails).catch(console.error);
  };

  const performMediaAnalysis = async (assetId: string, file: File) => {
    if (!company) return;
    if (!file.type.startsWith('image') && !file.type.startsWith('video')) return;
    try {
        const base64 = await fileToBase64(file);
        const aiTags = await geminiService.analyzeMediaForTags(base64, file.type, company.language || 'da');
        setCompany(prev => {
            if (!prev) return null;
            const updatedLibrary = (prev.mediaLibrary || []).map(a => 
                a.id === assetId ? { ...a, aiTags, tagsStatus: 'completed' as const } : a
            );
            const updates = { mediaLibrary: updatedLibrary };
            apiClient.updateCompanyDetails(token || "local-sync", prev.id, updates).catch(console.error);
            return { ...prev, ...updates };
        });
    } catch (e) {
        console.error("AI tagging failed", e);
    }
  };

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
        performMediaAnalysis(id, file);
    }
    const updatedLibrary = [...(company.mediaLibrary || []), ...newAssets];
    handleUpdateCompany({ mediaLibrary: updatedLibrary });
  };

  const handleExportProject = async () => {
      if (!company) return;
      setIsExporting(true);
      try {
          const zip = new JSZip();
          const cleanCompany = { ...company, events: company.events || [], partners: company.partners || [] };
          zip.file('company.json', JSON.stringify(cleanCompany, null, 2));
          const mediaFolder = zip.folder('media');
          const assetIds = new Set<string>();
          if (company.mediaLibrary) company.mediaLibrary.forEach(a => assetIds.add(a.id));
          if (company.brandKit?.logoAssetId) assetIds.add(company.brandKit.logoAssetId.replace('asset:', ''));
          for (const id of Array.from(assetIds)) {
              const file = await assetStorage.getAsset(id);
              if (file) mediaFolder?.file(file.name, file);
          }
          const content = await zip.generateAsync({ type: 'blob' });
          FileSaver.saveAs(content, `${company.name.replace(/\s+/g, '_')}_projekt.zip`);
      } catch (err) {
          alert("Eksport fejlede: " + err);
      } finally {
          setIsExporting(false);
      }
  };

  const handleExportSourceCode = async () => {
    setIsExportingSource(true);
    try {
      const zip = new JSZip();
      
      // Vi definerer de mest kritiske filer der udgør appens kerne.
      // I et dev-miljø som dette kan vi forsøge at fetch'e dem direkte.
      const filesToFetch = [
        'index.html', 'index.tsx', 'index.css', 'App.tsx', 'types.ts', 
        'package.json', 'tsconfig.json', 'vite.config.ts', 'metadata.json',
        'services/apiClient.ts', 'services/geminiService.ts',
        'utils/assetStorage.ts', 'utils/formatters.ts', 'utils/fileUtils.ts', 'utils/dateUtils.ts', 'utils/urlUtils.ts', 'utils/apiQueue.ts', 'utils/csvUtils.ts', 'utils/docGenerator.ts', 'utils/translations.ts',
        'context/LanguageContext.tsx', 'server/db.ts', 'data/demoData.ts'
      ];

      // Gennemgå alle filer og forsøg at hente indhold
      await Promise.all(filesToFetch.map(async (path) => {
        try {
          const response = await fetch('/' + path);
          if (response.ok) {
            const content = await response.text();
            zip.file(path, content);
          }
        } catch (e) {
          console.warn(`Kunne ikke hente ${path} til eksport.`);
        }
      }));

      // Generer en lille guide til lokal kørsel
      zip.file('LOCAL_SETUP.md', `# Lokal Setup Guide\n\n1. Udpak ZIP-filen.\n2. Kør 'npm install'.\n3. Opret en '.env' fil med din 'API_KEY'.\n4. Kør 'npm run dev'.`);

      const blob = await zip.generateAsync({ type: 'blob' });
      FileSaver.saveAs(blob, `BrandPortal_AI_Source_Code.zip`);
    } catch (error) {
      alert("Kildekode eksport fejlede: " + error);
    } finally {
      setIsExportingSource(false);
    }
  };

  const handleImportProject = async (file: File) => {
      if (!token) return;
      setIsImporting(true);
      try {
          const zip = new JSZip();
          const loadedZip = await zip.loadAsync(file);
          const jsonFile = (Object.values(loadedZip.files) as any[]).find(f => 
              f.name.toLowerCase().endsWith('company.json') && !f.name.includes('__MACOSX')
          );
          if (!jsonFile) throw new Error("Projekt-data ikke fundet.");
          const companyData = JSON.parse(await jsonFile.async("string"));
          const mediaFiles = (Object.values(loadedZip.files) as any[]).filter(f => !f.dir && !f.name.includes('__MACOSX') && f.name !== jsonFile.name);
          for (const mFile of mediaFiles) {
              const blob = await mFile.async("blob");
              const fileName = mFile.name.split('/').pop() || mFile.name;
              await assetStorage.saveAsset(fileName, new File([blob], fileName, { type: blob.type }));
          }
          const imported = await apiClient.importCompany(token, companyData);
          setAllWorkspaces(prev => [...prev.filter(ws => ws.id !== imported.id), imported]);
          handleSelectWorkspace(imported);
      } catch (err) {
          alert("Import fejlede: " + err);
      } finally {
          setIsImporting(false);
      }
  };

  const handleGeneratePosts = async (
    assets: AssetMetadata[], 
    partnerIds: string[], 
    topic: string, 
    platforms: SocialPlatform[], 
    weekdays: number[],
    startDateStr: string,
    endDateStr: string,
    startTime: string,
    endTime: string,
    campaignId?: string,
    newCampaignName?: string
  ) => {
    if (!company) return;
    setIsGenerating(true);
    try {
        let finalCampaignId = campaignId;
        if (newCampaignName) {
            const newCampaign: Campaign = {
                id: `camp-${uuidv4()}`,
                name: newCampaignName,
                goal: topic,
                startDate: startDateStr,
                endDate: endDateStr,
                themeColor: '#6366f1'
            };
            await handleUpdateCompany({ campaigns: [...(company.campaigns || []), newCampaign] });
            finalCampaignId = newCampaign.id;
        }

        const newEvents: CalendarEvent[] = [];
        const existingDates = new Set<string>((company.events || []).map(e => e.date));

        const itemsToSchedule: { asset: AssetMetadata; partnerId: string }[] = [];
        for (const asset of assets) {
            for (const pid of partnerIds) {
                itemsToSchedule.push({ asset, partnerId: pid });
            }
        }
        
        const schedule = generateSchedule(itemsToSchedule, weekdays, existingDates);

        let scheduledIndex = 0;
        for (const [date, item] of schedule.entries()) {
            if (scheduledIndex >= itemsToSchedule.length) break;

            const eventId = `evt-${uuidv4()}`;
            const postsByPartner: Record<string, PartnerPostState> = {};
            
            const partner = company.partners.find(p => p.id === item.partnerId) || (item.partnerId === '__company__' ? { name: company.name, language: company.language } : null);
            if (!partner) continue;
            
            const posts: any = {};
            for (const plat of platforms) {
                const text = await geminiService.generateSocialPost(topic, plat, partner.language || 'da', partner.name, company.name, company.description || '', item.partnerId === '__company__', item.asset.aiTags);
                posts[plat] = { text };
            }
            postsByPartner[item.partnerId] = { status: 'scheduled', posts };
            
            newEvents.push({
                id: eventId,
                date: date,
                time: startTime,
                assetId: item.asset.id,
                assetName: item.asset.fileName,
                campaignId: finalCampaignId,
                postsByPartner
            });
            scheduledIndex++;
        }
        await apiClient.handleAddEvents(token || "local-sync", company.id, newEvents);
        const updatedCompany = { ...company, events: [...(company.events || []), ...newEvents] };
        setCompany(updatedCompany);
        setAllWorkspaces(list => list.map(ws => ws.id === company.id ? updatedCompany : ws));
    } catch (e) {
        console.error(e);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleSimulatePartnerPortal = (partnerId: string) => {
      setSimulationPartnerId(partnerId);
      setActiveState('partner_portal_simulation');
  };

  const handleUpdateProgress = (progress: string[]) => {
      handleUpdateCompany({ roadmapProgress: progress });
  };

  if (isInitializing) return <div className="h-screen flex items-center justify-center bg-slate-900"><SyncIcon className="animate-spin h-12 w-12 text-indigo-500" /></div>;
  if (!user) return <AuthScreen onLogin={handleLogin} />;
  if (!company) return <WorkspaceHubScreen user={user} workspaces={allWorkspaces} onSelectWorkspace={handleSelectWorkspace} onCreateWorkspace={handleCreateWorkspace} />;

  if (activeState === 'partner_portal_simulation' && simulationPartnerId) {
    const virtualUser = { ...user, id: simulationPartnerId, partnerAccess: [{ companyId: company.id, partnerId: simulationPartnerId }] };
    return <PartnerPortalScreen user={virtualUser} token={token || ""} company={company} isSimulation={true} onExitSimulation={() => { setSimulationPartnerId(null); setActiveState('partners'); }} onCompanyDataUpdate={handleUpdateCompany} onLeadSubmit={async () => {}} onSubmitSuccessStory={async () => {}} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-app)] theme-transition">
      <SideNav activeState={activeState} onNavigate={setActiveState} company={company} currentUserRole={currentUserRole} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <HeaderNav 
          user={user} 
          company={company} 
          currentUserRole={currentUserRole}
          onLogout={handleLogout} 
          onSwitchCompany={() => setCompany(null)} 
          onExportProject={handleExportProject} 
          onImportProject={handleImportProject} 
          onSaveProject={() => handleUpdateCompany({ updatedAt: new Date().toISOString() })}
          onUpdateCompany={handleUpdateCompany}
          onExportSourceCode={handleExportSourceCode}
          isExporting={isExporting} 
          isExportingSource={isExportingSource}
          isImporting={isImporting}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        <main className="flex-1 overflow-y-auto no-scrollbar relative">
          {activeProgress > 0 && <div className="absolute top-0 left-0 right-0 h-1 bg-brand-primary transition-all duration-300 z-50 shadow-lg shadow-brand-primary/20" style={{ width: `${activeProgress}%` }} />}
          
          {activeState === 'dashboard' && <DashboardScreen company={company} onNavigate={setActiveState} onUpdateCompany={handleUpdateCompany} onQuickUpload={async (file) => { await handleMediaUpload([file]); return "ok"; }} />}
          {(activeState === 'onboarding_company_info' || activeState === 'onboarding_analysis' || activeState === 'onboarding_goals' || activeState === 'onboarding_strategy' || activeState === 'onboarding_plan') && (
            <OnboardingFlowScreen 
              {...{token: token!, company, activeStep: activeState, onNavigate: setActiveState, isGenerating, currentUserRole, isGeneratingImages: false, feedbackMessage: null, isEnriching}}
              onUpdateCompanyDetails={async (details) => {
                await handleUpdateCompany({ 
                  ...details, 
                  needsAnalysisSync: details.needsAnalysisSync ?? company.needsAnalysisSync ?? false,
                  needsStrategySync: details.needsStrategySync ?? company.needsStrategySync ?? false,
                  needsPlanSync: details.needsPlanSync ?? company.needsPlanSync ?? false
                });
              }}
              onEnrichCompany={() => { setIsEnriching(true); return apiClient.enrichFromWebsite(token!, company.website, company.language || 'da').then(d => { handleUpdateCompany(d); setIsEnriching(false); }); }}
              onUpdateStrategy={(s) => handleUpdateCompany({ contentStrategy: s })}
              onGenerateStrategy={(g, d) => { setIsGenerating(true); return apiClient.generateStrategy(token!, company.id, g, d).then(s => { handleUpdateCompany({ contentStrategy: s }); setIsGenerating(false); }); }}
              onGenerateGrowthPlan={() => { setIsGenerating(true); return apiClient.generateCompanyGrowthPlan(token!, company.id).then(p => { handleUpdateCompany({ growthPlan: p, masterPlanPdfAssetId: undefined }); setIsGenerating(false); }); }}
              onUpdateGrowthPlan={(p) => handleUpdateCompany({ growthPlan: p })}
              onSaveGrowthPlanVersion={(n) => handleUpdateCompany({ savedGrowthPlans: [...(company.savedGrowthPlans || []), { ...company.growthPlan!, name: n, id: uuidv4() }] })}
              onUploadFinancialReport={async (f) => { const id = uuidv4(); await assetStorage.saveAsset(id, f); handleUpdateCompany({ financialReportAssetId: `asset:${id}` }); }}
              onDeleteFinancialReport={async () => handleUpdateCompany({ financialReportAssetId: undefined })}
              onUploadMasterPlanPdf={async (f) => { const id = uuidv4(); await assetStorage.saveAsset(id, f); handleUpdateCompany({ masterPlanPdfAssetId: `asset:${id}`, growthPlan: undefined }); return `asset:${id}`; }}
              onGenerateImagesForStrategy={async () => {}}
            />
          )}
          {activeState === 'media_library' && <MediaLibraryScreen company={company} allPartnersForSelector={filteredPartnersList} onMediaUpload={handleMediaUpload} onMediaDelete={async (id) => handleUpdateCompany({ mediaLibrary: company.mediaLibrary?.filter(a => a.id !== id) })} onMediaDeleteMultiple={async (ids) => handleUpdateCompany({ mediaLibrary: company.mediaLibrary?.filter(a => !ids.includes(a.id)) })} onGeneratePosts={handleGeneratePosts} isGenerating={isGenerating} uploads={[]} onClearCompletedUploads={() => {}} onEditAssetImage={async () => {}} onUpdateAssetTags={() => {}} />}
          {activeState === 'calendar' && <CalendarScreen company={company} token={token!} onUpdateCompany={handleUpdateCompany} currentUser={user} onGeneratePosts={handleGeneratePosts} isGenerating={isGenerating} />}
          {activeState === 'partners' && <PartnerScreen company={company} token={token!} onAddPartner={(p) => handleUpdateCompany({ partners: [...(company.partners || []), p] })} onEditPartner={(p) => handleUpdateCompany({ partners: company.partners?.map(x => x.id === p.id ? p : x) })} onDeletePartners={(ids) => handleUpdateCompany({ partners: company.partners?.filter(p => !ids.includes(p.id)) })} onGrantAccessToContacts={async () => {}} onMassUpdateAll={async () => {}} onRefreshPartner={() => {}} onSimulatePartnerPortal={handleSimulatePartnerPortal} enrichmentStatus={null} onImportPartners={async () => {}} onBulkUpdatePartners={async (ids, u) => handleUpdateCompany({ partners: company.partners?.map(p => ids.includes(p.id) ? { ...p, ...u } : p) })} onUploadPartnerPlanPdf={async (pid, file) => { const id = uuidv4(); await assetStorage.saveAsset(id, file); handleUpdateCompany({ partners: company.partners?.map(p => p.id === pid ? { ...p, originalPlanPdfAssetId: `asset:${id}` } : p) }); return `asset:${id}`; }} />}
          {activeState === 'analytics' && <AnalyticsScreen company={company} token={token!} onUpdateCompany={handleUpdateCompany} />}
          {activeState === 'growth' && (
            <GrowthScreen 
              company={company} 
              onUpdateStrategy={async (s) => handleUpdateCompany({ contentStrategy: s })} 
              onToggleStrategyLock={async () => handleUpdateCompany({ isContentStrategyLocked: !company.isContentStrategyLocked })}
              onSaveStrategyVersion={async (name) => {
                  const versions = company.savedContentStrategies || [];
                  const newVersion = { id: uuidv4(), name, content: company.contentStrategy!, createdAt: new Date().toISOString() };
                  await handleUpdateCompany({ savedContentStrategies: [...versions, newVersion] });
              }}
              onRestoreStrategyVersion={async (content) => handleUpdateCompany({ contentStrategy: content })}
              onDeleteStrategyVersion={async (id) => {
                  const versions = company.savedContentStrategies?.filter(v => v.id !== id) || [];
                  await handleUpdateCompany({ savedContentStrategies: versions });
              }}
              onUpdateRoadmapProgress={handleUpdateProgress} 
              onGenerateIndustryPage={async () => {}} 
              onAddIndustry={() => {}} 
              onDeleteIndustry={() => {}} 
              onEnhanceImage={async () => company} 
              onAddPillarTopic={async () => null} 
              onGenerateArticle={() => {}} 
            />
          )}
          {activeState === 'users' && <UsersScreen company={company} currentUser={user} isAdmin={currentUserRole === 'admin'} onInviteUser={async () => ""} onUpdateRole={async () => {}} onSimulateRole={() => {}} />}
          {activeState === 'integrations' && <IntegrationsScreen company={company} />}
          {activeState === 'prospecting' && <ProspectingScreen company={company} partners={company.partners} onClearProposal={() => {}} onGenerateProposal={async (pid) => { setIsGenerating(true); const p = await apiClient.generateGrowthPlan(token!, company.id, pid); handleUpdateCompany({ growthPlan: p }); setIsGenerating(false); }} proposal={null} isGenerating={isGenerating} />}
          {activeState === 'drip_campaigns' && <DripCampaignsScreen company={company} token={token!} onSaveCampaign={(c) => handleUpdateCompany({ dripCampaigns: [...(company.dripCampaigns || []).filter(x => x.id !== c.id), c] })} onDeleteCampaign={(id) => handleUpdateCompany({ dripCampaigns: company.dripCampaigns?.filter(x => x.id !== id) })} onStartCampaign={async () => {}} onCompleteTask={() => {}} />}
          {activeState === 'leads' && <LeadsScreen company={company} onUpdateLeadStatus={() => {}} />}
        </main>
      </div>
    </div>
  );
};