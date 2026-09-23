import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  loading: true,
  error: null,

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null, loading: false });
      return;
    }
    try {
      const response = await api.get('/auth/profile');
      if (response.data.success) {
        set({ user: response.data.user, loading: false, error: null });
      }
    } catch (err) {
      localStorage.removeItem('token');
      set({ user: null, token: null, loading: false });
    }
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      set({ user, token, loading: false, error: null });
      return { success: true, user };
    } catch (err) {
      const message = err.response?.data?.message || 'Login failed';
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  demoLogin: async (role) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/demo-login', { role });
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      set({ user, token, loading: false, error: null });
      return { success: true, user };
    } catch (err) {
      const message = err.response?.data?.message || 'Demo login failed';
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  register: async (userData) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/register', userData);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      set({ user, token, loading: false, error: null });
      return { success: true, user };
    } catch (err) {
      const message = err.response?.data?.message || 'Registration failed';
      set({ error: message, loading: false });
      return { success: false, message };
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      // ignore
    }
    localStorage.removeItem('token');
    set({ user: null, token: null });
  }
}));
