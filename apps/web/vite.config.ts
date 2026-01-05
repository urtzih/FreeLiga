/**
 * FreeSQuash League - Vite Configuration
 * 
 * @author Urtzi Diaz Arberas
 * @copyright © 2024-2026 Urtzi Diaz Arberas. All rights reserved.
 * @license Proprietary - All intellectual property rights belong to Urtzi Diaz Arberas
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
import pkg from './package.json';

export default defineConfig({
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['logo.jpg', 'euskadiLogo.png'],
            manifest: {
                name: 'FreeSquash League',
                short_name: 'FreeSquash',
                description: 'Gestión de la liga de squash en Vitoria-Gasteiz',
                theme_color: '#2563eb',
                background_color: '#ffffff',
                display: 'standalone',
                start_url: '/',
                icons: [
                    {
                        src: '/logo.jpg',
                        sizes: '512x512',
                        type: 'image/jpeg',
                        purpose: 'any maskable'
                    }
                ]
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,jpg,svg}'],
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/.*\.vercel\.app\/api\/.*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 * 24 // 24 horas
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    }
                ]
            }
        })
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
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version)
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    react: ['react', 'react-dom', 'react-router-dom'],
                    vendor_chart: ['chart.js', 'react-chartjs-2'],
                    tanstack: ['@tanstack/react-query', '@tanstack/react-table']
                }
            }
        }
    }
});
