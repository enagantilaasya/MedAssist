import { create } from 'zustand';
import api from '../services/api';

export const useAppointmentStore = create((set, get) => ({
  appointments: [],
  todayQueue: [],
  loading: false,
  error: null,

  getAppointments: async (params = {}) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/appointments/all', { params });
      set({ appointments: response.data.payload, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },

  getTodayQueue: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/appointments/queue/today');
      set({ todayQueue: response.data.payload, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message, loading: false });
    }
  },

  createAppointment: async (appointmentData) => {
    set({ loading: true });
    try {
      const response = await api.post('/appointments/add', appointmentData);
      set((state) => ({
        appointments: [response.data.payload, ...state.appointments],
        loading: false
      }));
      return { success: true, payload: response.data.payload };
    } catch (err) {
      set({ loading: false });
      return { success: false, message: err.response?.data?.message || err.message };
    }
  },

  updateAppointmentStatus: async (id, status) => {
    try {
      const response = await api.put(`/appointments/update/${id}`, { status });
      set((state) => ({
        appointments: state.appointments.map((a) => (a._id === id ? response.data.payload : a)),
        todayQueue: state.todayQueue.map((a) => (a._id === id ? response.data.payload : a))
      }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  },

  cancelAppointment: async (id, cancellationReason) => {
    try {
      const response = await api.put(`/appointments/cancel/${id}`, { cancellationReason });
      set((state) => ({
        appointments: state.appointments.map((a) => (a._id === id ? response.data.payload : a)),
        todayQueue: state.todayQueue.map((a) => (a._id === id ? response.data.payload : a))
      }));
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  }
}));
