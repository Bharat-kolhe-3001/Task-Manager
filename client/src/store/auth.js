import { create } from 'zustand';
import api from '../lib/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('orbit_token') || null,
  isAuthenticated: !!localStorage.getItem('orbit_token'),
  loading: true,

  setAuth: (user, token) => {
    localStorage.setItem('orbit_token', token);
    set({ user, token, isAuthenticated: true, loading: false });
  },

  logout: () => {
    localStorage.removeItem('orbit_token');
    set({ user: null, token: null, isAuthenticated: false, loading: false });
    window.location.href = '/login';
  },

  checkAuth: async () => {
    const token = localStorage.getItem('orbit_token');
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const { data } = await api.get('/auth/me');
      set({ user: data.user, isAuthenticated: true, loading: false });
    } catch {
      localStorage.removeItem('orbit_token');
      set({ user: null, token: null, isAuthenticated: false, loading: false });
    }
  },
}));
