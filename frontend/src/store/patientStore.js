import { create } from 'zustand';
import api from '../services/api';

export const usePatientStore = create((set) => ({
  patients: [],
  currentPatient: null,
  timeline: null,
  loading: false,
  error: null,

  getPatients: async (search = '') => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/patients/all${search ? `?search=${search}` : ''}`);
      set({ patients: response.data.payload, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },

  getPatientById: async (id) => {
    set({ loading: true });
    try {
      const response = await api.get(`/patients/${id}`);
      set({ currentPatient: response.data.payload, loading: false });
      return response.data.payload;
    } catch (err) {
      set({ error: err.response?.data?.message, loading: false });
      return null;
    }
  },

  getPatientTimeline: async (patientId) => {
    set({ loading: true });
    try {
      const url = patientId ? `/medical/timeline/${patientId}` : `/medical/timeline`;
      const response = await api.get(url);
      set({ timeline: response.data, loading: false });
      return response.data;
    } catch (err) {
      set({ error: err.response?.data?.message, loading: false });
      return null;
    }
  },

  registerPatient: async (patientData) => {
    set({ loading: true });
    try {
      const response = await api.post('/patients/register', patientData);
      set((state) => ({
        patients: [response.data.payload, ...state.patients],
        loading: false
      }));
      return { success: true, payload: response.data.payload };
    } catch (err) {
      set({ loading: false });
      return { success: false, message: err.response?.data?.message || err.message };
    }
  }
}));
