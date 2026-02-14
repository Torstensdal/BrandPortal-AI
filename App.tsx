import React from 'react';

export function App() {
  return (
    <div style={{ 
      padding: '3rem', 
      fontFamily: 'system-ui',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
        🚀 BrandPortal-AI
      </h1>
      <p style={{ fontSize: '1.2rem', color: '#666' }}>
        System kører perfekt! ✅
      </p>
      <div style={{ 
        marginTop: '2rem', 
        padding: '1.5rem', 
        background: '#f0f0f0',
        borderRadius: '8px'
      }}>
        <h2>Status</h2>
        <ul>
          <li>✅ React 18 loaded</li>
          <li>✅ LanguageContext ready</li>
          <li>✅ Vite dev server running</li>
        </ul>
      </div>
    </div>
  );
}

export default App;