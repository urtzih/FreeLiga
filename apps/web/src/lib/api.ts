import axios from 'axios';

// Build base URL from env (Vercel) or fallback to relative for local dev
const envBase = import.meta.env.VITE_API_URL as string | undefined;
const normalizedBase = envBase ? envBase.replace(/\/$/, '') : '';
const baseURL = normalizedBase ? `${normalizedBase}/api` : '/api';

const api = axios.create({
    baseURL,
});

// Debug helper: expone la base del API en producción para verificar Vercel env
try {
    (globalThis as any).__API_BASE__ = baseURL;
    (globalThis as any).__VITE_ENV__ = import.meta.env.VITE_API_URL;
} catch { }

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
        const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                               error.config?.url?.includes('/auth/register');
        
        // Limpiar sesión y redirigir al login en estos casos:
        // 1. Error 401 (no autorizado)
        // 2. Usuario no encontrado (después de recrear la BD)
        const shouldLogout = 
            (error.response?.status === 401 && !isAuthEndpoint) ||
            (error.response?.status === 404 && error.response?.data?.message?.includes('User not found'));

        if (shouldLogout) {
            console.warn('Sesión inválida detectada, limpiando y redirigiendo al login');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            
            // Evitar redirección infinita si ya estamos en login
            if (!window.location.pathname.includes('/login')) {
                window.location.href = '/login';
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;
