/**
 * FreeSquash League - Vite Configuration
 *
 * @author Urtzi Diaz Arberas
 * @copyright (c) 2024-2026 Urtzi Diaz Arberas. All rights reserved.
 * @license Proprietary - All intellectual property rights belong to Urtzi Diaz Arberas
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.jpg', 'euskadiLogo.png'],
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg}'],
        navigateFallback: '/index.html',
      },
      manifest: {
        name: 'FreeLiga',
        short_name: 'FreeLiga',
        description: 'Liga de squash con grupos, rankings y gestion de partidos.',
        start_url: '/',
        scope: '/',
        id: '/',
        lang: 'es-ES',
        display: 'standalone',
        theme_color: '#111827',
        background_color: '#ffffff',
        icons: [
          {
            src: '/euskadiLogo.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/logo.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 4173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          vendor_chart: ['chart.js', 'react-chartjs-2'],
          tanstack: ['@tanstack/react-query', '@tanstack/react-table'],
        },
      },
    },
  },
});
