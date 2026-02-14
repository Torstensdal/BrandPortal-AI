import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
const c = document.getElementById('root');
if(c) createRoot(c).render(<App />);