import axios from 'axios';

// In production (Vercel) or when specified, use the live Render API
const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // If running in production (e.g. Vercel deployment), point to live Render backend
  if (import.meta.env.PROD) {
    return 'https://medassist-zfqv.onrender.com/api';
  }
  // In local Vite dev server, proxy via /api or Render fallback
  return '/api';
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If token invalid or forbidden, handle status
    if (error.response?.status === 401) {
      // localStorage.removeItem('token');
    }
    return Promise.reject(error);
  }
);

export default api;
