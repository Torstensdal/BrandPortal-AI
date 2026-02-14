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
    host: 'localhost',
    hmr: {
      overlay: false // VIGTIGT: Deaktiverer overlay der får din browser til at hænge ved fejl
    }
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json']
  }
});