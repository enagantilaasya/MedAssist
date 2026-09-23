import { create } from 'zustand';
import api from '../services/api';

export const useInvoiceStore = create((set) => ({
  invoices: [],
  loading: false,
  error: null,

  getInvoices: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/invoices/all');
      set({ invoices: response.data.payload, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message, loading: false });
    }
  },

  createInvoice: async (invoiceData) => {
    try {
      const response = await api.post('/invoices/add', invoiceData);
      set((state) => ({
        invoices: [response.data.payload, ...state.invoices]
      }));
      return { success: true, payload: response.data.payload };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  },

  payInvoice: async (id, paymentData) => {
    try {
      const response = await api.post(`/invoices/pay/${id}`, paymentData);
      set((state) => ({
        invoices: state.invoices.map((inv) => (inv._id === id ? response.data.payload : inv))
      }));
      return { success: true, payload: response.data.payload };
    } catch (err) {
      return { success: false, message: err.response?.data?.message };
    }
  }
}));
