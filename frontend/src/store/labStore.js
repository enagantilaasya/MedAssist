import { create } from 'zustand';
import api from '../services/api';

export const useLabStore = create((set) => ({
  orders: [],
  results: [],
  loading: false,
  error: null,

  getLabOrders: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/lab/orders');
      set({ orders: response.data.payload, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message, loading: false });
    }
  },

  getLabResults: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/lab/results');
      set({ results: response.data.payload, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message, loading: false });
    }
  },

  createLabOrder: async (orderData) => {
    try {
      const response = await api.post('/lab/order', orderData);
      set((state) => ({
        orders: [response.data.payload, ...state.orders]
      }));
      return { success: true, payload: response.data.payload };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  },

  updateSampleStatus: async (id, status, sampleBarcode) => {
    try {
      const response = await api.put(`/lab/sample-status/${id}`, { status, sampleBarcode });
      set((state) => ({
        orders: state.orders.map((o) => (o._id === id ? response.data.payload : o))
      }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  },

  enterLabResult: async (resultData) => {
    try {
      const response = await api.post('/lab/result', resultData);
      set((state) => ({
        results: [response.data.payload, ...state.results]
      }));
      return { success: true, payload: response.data.payload };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  },

  verifyLabResult: async (id) => {
    try {
      const response = await api.put(`/lab/verify/${id}`);
      set((state) => ({
        results: state.results.map((r) => (r._id === id ? response.data.payload : r))
      }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  }
}));
