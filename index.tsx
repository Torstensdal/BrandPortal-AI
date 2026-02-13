import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { LanguageProvider } from './context/LanguageContext';
import * as assetStorage from './utils/assetStorage';

/**
 * BRANDPORTAL BOOTSTRAP ENGINE V39 - SMOOTH ENTRY
 */
const startApplication = async () => {
  const container = document.getElementById('root');
  if (!container) return;

  const root = createRoot(container);

  // 1. Vis en mere elegant system-loader i stedet for bare en sort skærm
  root.render(
    <div style={{
      backgroundColor: '#0f172a', // En dyb navy i stedet for sort
      backgroundImage: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)',
      color: 'white',
      height: '100vh',
      width: '100vw',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Inter", system-ui, sans-serif',
      transition: 'opacity 0.5s ease-in-out'
    }}>
      <div style={{
        position: 'relative',
        width: '60px',
        height: '60px',
        marginBottom: '32px'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          border: '2px solid rgba(99, 102, 241, 0.1)',
          borderRadius: '16px',
          transform: 'rotate(45deg)'
        }}></div>
        <div style={{
          position: 'absolute',
          inset: 0,
          border: '2px solid #6366f1',
          borderTopColor: 'transparent',
          borderRadius: '16px',
          animation: 'spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite',
          transform: 'rotate(45deg)'
        }}></div>
      </div>
      
      <div style={{ textAlign: 'center', animation: 'fadeIn 1s ease-out' }}>
        <h2 style={{ 
          fontSize: '10px', 
          fontWeight: '900', 
          letterSpacing: '5px', 
          textTransform: 'uppercase', 
          color: '#f8fafc', 
          margin: '0',
          opacity: 0.9
        }}>
            BRANDPORTAL-AI
        </h2>
        <p style={{ 
          fontSize: '8px', 
          fontWeight: 'bold', 
          color: '#64748b', 
          textTransform: 'uppercase', 
          letterSpacing: '2px', 
          marginTop: '16px' 
        }}>
            Initialiserer Engine...
        </p>
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(45deg); } to { transform: rotate(405deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );

  try {
    // Database check (med timeout)
    const sessionPromise = assetStorage.getLastSession();
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("STORAGE_TIMEOUT")), 1200));
    
    await Promise.race([sessionPromise, timeout]).catch(e => {
        console.warn("Storage ready - proceeding:", e.message);
    });

    // Endelig rendering af selve applikationen
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
      <div style={{ backgroundColor: '#0f172a', color: 'white', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <div style={{ padding: '40px', background: '#1e293b', borderRadius: '32px', border: '1px solid #334155', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <h1 style={{ color: '#ef4444', fontSize: '18px', fontWeight: '900', textTransform: 'uppercase', letterSpacing: '2px' }}>System Fejl</h1>
            <p style={{ color: '#94a3b8', marginTop: '12px', fontSize: '14px' }}>Motoren kunne ikke starte korrekt.</p>
            <button onClick={() => window.location.reload()} style={{ marginTop: '24px', padding: '12px 32px', background: '#6366f1', borderRadius: '12px', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>PRØV IGEN</button>
          </div>
      </div>
    );
  }
};

startApplication();
export {};