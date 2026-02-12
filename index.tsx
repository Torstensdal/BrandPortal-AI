import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { LanguageProvider } from './context/LanguageContext';
import * as assetStorage from './utils/assetStorage';

/**
 * AETHER BOOTSTRAP ENGINE V36 - SYSTEM RECOVERY & RENDER GUARD
 * Ensures the application mounts even if IndexedDB is slow or blocked.
 */
const startApplication = async () => {
  const container = document.getElementById('root');
  if (!container) return;

  const root = createRoot(container);

  // Render high-end system loader immediately
  root.render(
    <div style={{
      backgroundColor: '#020617',
      color: 'white',
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      textAlign: 'center'
    }}>
      <div style={{
        width: '40px',
        height: '40px',
        border: '3px solid rgba(99, 102, 241, 0.1)',
        borderTopColor: '#6366f1',
        borderRadius: '50%',
        animation: 'spin 0.6s cubic-bezier(0.4, 0, 0.2, 1) infinite',
        marginBottom: '24px'
      }}></div>
      <h2 style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '4px', textTransform: 'uppercase', color: '#f8fafc', margin: '0' }}>
          BRANDPORTAL-AI
      </h2>
      <p style={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '12px' }}>
          Initialiserer VÃ¦kstmotor...
      </p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  try {
    // Database timeout guard: if IndexedDB takes > 2.5s, we bypass and load a fresh state
    const sessionPromise = assetStorage.getLastSession();
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("DB_TIMEOUT")), 2500));
    
    await Promise.race([sessionPromise, timeout]).catch((err) => {
      console.warn("AETHER: Database load timed out or failed. App will start with default state.", err);
    });

    // Final Render of the actual application
    root.render(
      <React.StrictMode>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </React.StrictMode>
    );
  } catch (err) {
    console.error("CRITICAL BOOTSTRAP ERROR:", err);
    root.render(
      <div style={{ 
        backgroundColor: '#020617', 
        color: 'white', 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '40px',
        textAlign: 'center',
        fontFamily: 'system-ui'
      }}>
        <h1 style={{ color: '#ef4444', fontSize: '20px', fontWeight: '900', textTransform: 'uppercase' }}>Systemfejl ved opstart</h1>
        <p style={{ color: '#94a3b8', fontSize: '14px', marginTop: '12px', maxWidth: '400px', lineHeight: '1.6' }}>
            Kunne ikke etablere sikker forbindelse til motoren. Dette skyldes ofte browser-begrÃ¦nsninger i inkognito eller private vinduer.
        </p>
        <button 
            onClick={() => window.location.reload()} 
            style={{ 
                marginTop: '32px', 
                padding: '14px 28px', 
                backgroundColor: '#6366f1', 
                color: 'white', 
                border: 'none', 
                borderRadius: '12px', 
                fontWeight: 'bold', 
                cursor: 'pointer',
                textTransform: 'uppercase',
                letterSpacing: '1px'
            }}
        >
            PrÃ¸v igen
        </button>
      </div>
    );
  }
};

startApplication();
export {};