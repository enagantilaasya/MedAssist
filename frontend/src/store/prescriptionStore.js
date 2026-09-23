import { create } from 'zustand';
import api from '../services/api';

export const usePrescriptionStore = create((set) => ({
  prescriptions: [],
  loading: false,
  error: null,

  getPrescriptions: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/prescriptions/all');
      set({ prescriptions: response.data.payload, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message, loading: false });
    }
  },

  createPrescription: async (data) => {
    set({ loading: true });
    try {
      const response = await api.post('/prescriptions/add', data);
      set((state) => ({
        prescriptions: [response.data.payload, ...state.prescriptions],
        loading: false
      }));
      return { success: true, payload: response.data.payload };
    } catch (err) {
      set({ loading: false });
      return { success: false, message: err.response?.data?.message };
    }
  },

  explainPrescriptionAI: async (id) => {
    try {
      const response = await api.post(`/prescriptions/explain/${id}`);
      return { success: true, payload: response.data.payload };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  }
}));
