/**
 * FreeSQuash League - Web Application
 * 
 * @author Urtzi Diaz Arberas
 * @copyright © 2024-2026 Urtzi Diaz Arberas. All rights reserved.
 * @license Proprietary - All intellectual property rights belong to Urtzi Diaz Arberas
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import './index.css';

// Register service worker for push notifications
if ('serviceWorker' in navigator) {
    navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
            console.log('✅ Service Worker registered:', registration);
        })
        .catch((error) => {
            console.warn('⚠️ Service Worker registration failed:', error);
        });
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: true,
            retry: 1,
            staleTime: 0,
            gcTime: 0,
        },
    },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <ToastProvider>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </ToastProvider>
        </QueryClientProvider>
    </React.StrictMode>
);
