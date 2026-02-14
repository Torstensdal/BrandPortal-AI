import React, { useState, useEffect } from 'react';
import { User, Company, AppState } from './types';
import { SideNav } from './components/SideNav';
import { HeaderNav } from './components/HeaderNav';
import { WorkspaceHub } from './components/WorkspaceHub';
import { DashboardScreen } from './components/DashboardScreen';
import { PartnerScreen } from './components/PartnerScreen';
import { MediaLibraryScreen } from './components/MediaLibraryScreen';
import { SourceExportModal } from './components/SourceExportModal';
import * as apiClient from './services/apiClient';
import * as assetStorage from './utils/assetStorage';
import { LanguageProvider } from './context/LanguageContext';

export const App: React.FC = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [activeState, setActiveState] = useState<AppState>('dashboard');
  const [isSourceModalOpen, setIsSourceModalOpen] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const session = await assetStorage.getLastSession();
        const { user: u, token: t } = await apiClient.loginUser(session?.email || 'demo@brandportal-ai.com');
        setUser(u);
        const list = await apiClient.getCompaniesForUser(t);
        if (session?.companyId) setCompany(list.find(c => c.id === session.companyId) || list[0]);
        } catch (error) {
        console.error('Init failed:', error);
        setUser({ id: 'demo', name: 'Demo User', email: 'demo@brandportal-ai.com' });
      }
      setIsInitializing(false);
    };
    init();
  }, []);

  if (isInitializing) return <div>Booting...</div>;
  if (!user) return <div>Auth Required</div>;
  if (!company) return <WorkspaceHub user={user} workspaces={[]} onSelectWorkspace={setCompany} onCreateWorkspace={async (n, w) => { const res = await apiClient.createCompany('', n, w); setCompany(res); return res; }} />;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <SideNav activeState={activeState} onNavigate={setActiveState} company={company} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <HeaderNav user={user} company={company} onExportSourceCode={() => setIsSourceModalOpen(true)} onLogout={() => setUser(null)} />
        <main className="flex-1 overflow-auto">
          {activeState === 'dashboard' && <DashboardScreen company={company} onNavigate={setActiveState} />}
          {activeState === 'media_library' && <MediaLibraryScreen company={company} />}
          {activeState === 'partners' && <PartnerScreen company={company} />}
        </main>
      </div>
      <SourceExportModal isOpen={isSourceModalOpen} onClose={() => setIsSourceModalOpen(false)} company={company} onDownload={async () => {}} isGenerating={false} />
    </div>
  );
};
