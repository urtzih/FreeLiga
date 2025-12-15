import axios from 'axios';

// Build base URL from env (Vercel) or fallback to relative for local dev
const envBase = (import.meta as any)?.env?.VITE_API_URL as string | undefined;
const normalizedBase = envBase ? envBase.replace(/\/$/, '') : '';
const baseURL = normalizedBase ? `${normalizedBase}/api` : '/api';

const api = axios.create({
    baseURL,
});

// Debug helper: expone la base del API en producción para verificar Vercel env
try {
    (globalThis as any).__API_BASE__ = baseURL;
} catch {}

// Add JWT token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 errors (redirect to login)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
