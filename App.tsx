import React, { useState } from 'react';
import { AuthScreen } from './components/CompanyAuthScreen';
import { CalendarScreen } from './components/CalendarScreen';
import { useLanguage } from './context/LanguageContext';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeScreen, setActiveScreen] = useState<'calendar'>('calendar');
  const { t } = useLanguage();

  if (!isAuthenticated) {
    return <AuthScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>BrandPortal AI</h1>
      <nav style={{ marginBottom: '2rem' }}>
        <button onClick={() => setActiveScreen('calendar')}>
          Kalender
        </button>
      </nav>
      
      {activeScreen === 'calendar' && (
        <CalendarScreen 
          company={{ id: '1', name: 'Demo Company' }}
          token="demo"
          onUpdate={() => {}}
          onNavigateToMediaLibrary={() => {}}
        />
      )}
    </div>
  );
}

export default App;