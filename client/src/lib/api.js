import axios from 'axios';

// In dev, default to same-origin `/api` so Vite can proxy to Express (vite.config.js).
// In production, set VITE_API_URL to your API root, e.g. https://api.example.com/api
const baseURL =
  import.meta.env.VITE_API_URL?.trim() ||
  (import.meta.env.DEV ? '/api' : 'http://localhost:3000/api');

const api = axios.create({
  baseURL,
  timeout: 10000,
});

// Attach JWT on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('orbit_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-redirect on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('orbit_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
