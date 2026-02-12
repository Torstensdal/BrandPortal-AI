import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || ''),
  },
  server: {
    port: 5173,
    strictPort: true,
    // Binding to 0.0.0.0 ensures the server is reachable via localhost, 127.0.0.1, and IPv6 loopback.
    host: '0.0.0.0',
    fs: {
      strict: false 
    },
    cors: true
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'uuid', 'jszip', 'file-saver']
  }
});