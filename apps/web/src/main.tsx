/**
 * FreeSquash Liga - Web Application
 *
 * @author Urtzi Diaz Arberas
 * @copyright (c) 2024-2026 Urtzi Diaz Arberas. All rights reserved.
 * @license Proprietary - All intellectual property rights belong to Urtzi Diaz Arberas
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { LanguageProvider } from './contexts/LanguageContext';
import './index.css';

if ('serviceWorker' in navigator) {
    if (import.meta.env.DEV) {
        // In dev+tunnel, dev SW script is ESM and must be registered as module.
        navigator.serviceWorker
            .register('/dev-sw.js?dev-sw', { scope: '/', type: 'module' })
            .catch(() => navigator.serviceWorker.register('/sw.js', { scope: '/' }))
            .catch((error) => {
                console.warn('[PushDebug] initial SW registration failed', error);
            });
    } else {
        registerSW({ immediate: true });
    }
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000,
            gcTime: 60 * 60 * 1000,
        },
    },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <LanguageProvider>
                <ToastProvider>
                    <AuthProvider>
                        <App />
                    </AuthProvider>
                </ToastProvider>
            </LanguageProvider>
        </QueryClientProvider>
    </React.StrictMode>
);
