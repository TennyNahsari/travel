import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth service
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};

// QRIS service
export const qrisService = {
  getQris: async () => {
    const response = await api.get('/qris');
    return response.data;
  },

  updateQris: async (data) => {
    const response = await api.post('/qris', data);
    return response.data;
  },

  deleteQris: async () => {
    const response = await api.delete('/qris');
    return response.data;
  }
};

// Helper for resolving backend image URLs
export const getImageUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const serverBase = apiBase.replace(/\/api\/?$/, '');
  return `${serverBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

export default api;

