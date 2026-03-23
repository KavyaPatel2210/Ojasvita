import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite Configuration for Ojasvita Frontend
 * 
 * This file configures the Vite build tool for the React application.
 * 
 * Key configurations:
 * - proxy: API proxy to backend for development
 * - plugins: React plugin for JSX support
 */

export default defineConfig({
  plugins: [react()],
  server: {
    // API proxy configuration
    // This forwards /api requests to the backend server
    // allowing frontend and backend to work together during development
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    },
    // Development server port
    port: 5173,
    // Open browser automatically
    open: true,
    // Allow access from any IP (for mobile testing on same network)
    host: true,
    // HMR on all network interfaces
    hmr: {
      host: '0.0.0.0'
    }
  },

  build: {
    // Output directory for production build
    outDir: 'build',
    // Generate source maps for debugging
    sourcemap: true
  }
});
