/**
 * Centralized Axios instance for Sentinel AI backend (port 4005).
 *
 * Usage:
 *   import api from '../utils/api';
 *   const res = await api.get('/api/alerts');
 *   const res = await api.post('/api/alerts/123/notes', { note });
 *
 * The baseURL is read from the VITE_API_URL env variable (set in .env).
 * Falls back to http://localhost:4005 for local development.
 *
 * The Authorization header is injected automatically on every request
 * from the JWT stored in localStorage — no need to set it manually.
 */
import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4005',
});

// ── Request interceptor ────────────────────────────────────────────────────
// Attach the JWT from localStorage to every outgoing request automatically.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response interceptor ───────────────────────────────────────────────────
// Redirect to login on 401 Unauthorized (expired or invalid token).
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired — clear session and redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        }
        return Promise.reject(error);
    }
);

export default api;
