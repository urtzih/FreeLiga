import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import pkg from './package.json';

export default defineConfig({
    plugins: [react()],
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
