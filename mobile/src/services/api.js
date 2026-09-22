import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Default API URL based on platform (10.0.2.2 for Android Emulator, localhost for iOS/Web)
const DEFAULT_BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:7000/api' : 'http://localhost:7000/api';

let currentApiUrl = DEFAULT_BASE_URL;

const api = axios.create({
  baseURL: currentApiUrl,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Request interceptor to attach JWT Token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('user_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error('Error reading token from AsyncStorage:', err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const setCustomApiUrl = (url) => {
  currentApiUrl = url;
  api.defaults.baseURL = url;
};

export const getApiUrl = () => api.defaults.baseURL;

// Auth Service
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data?.token) {
      await AsyncStorage.setItem('user_token', response.data.token);
      await AsyncStorage.setItem('user_data', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  logout: async () => {
    await AsyncStorage.removeItem('user_token');
    await AsyncStorage.removeItem('user_data');
  },

  getCurrentUser: async () => {
    try {
      const userStr = await AsyncStorage.getItem('user_data');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  getToken: async () => {
    return await AsyncStorage.getItem('user_token');
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  }
};

// Schedule Service
export const scheduleService = {
  getAvailableSchedules: async (params = {}) => {
    // API endpoint for public booking ticket search
    const response = await api.get('/bookings/schedules/available', { params });
    return response.data;
  },

  getSchedules: async (params = {}) => {
    // API endpoint for dashboard schedules
    const response = await api.get('/schedules', { params });
    return response.data;
  },

  getScheduleById: async (id) => {
    const response = await api.get(`/schedules/${id}`);
    return response.data;
  },

  getAvailableRoutes: async () => {
    const response = await api.get('/schedules/dropdown/routes');
    return response.data;
  },

  getAvailableVehicles: async () => {
    const response = await api.get('/schedules/dropdown/vehicles');
    return response.data;
  },

  getAvailableDrivers: async () => {
    const response = await api.get('/schedules/dropdown/drivers');
    return response.data;
  },

  createSchedule: async (data) => {
    const response = await api.post('/schedules', data);
    return response.data;
  },

  updateSchedule: async (id, data) => {
    const response = await api.put(`/schedules/${id}`, data);
    return response.data;
  },

  updateScheduleStatus: async (id, status) => {
    const response = await api.put(`/schedules/${id}/status`, { status });
    return response.data;
  },

  deleteSchedule: async (id) => {
    const response = await api.delete(`/schedules/${id}`);
    return response.data;
  }
};

// Booking Service
export const bookingService = {
  createBooking: async (bookingData) => {
    const token = await AsyncStorage.getItem('user_token');
    const endpoint = token ? '/bookings' : '/bookings/public';
    const response = await api.post(endpoint, bookingData);
    return response.data;
  },

  getBookings: async (params = {}) => {
    const response = await api.get('/bookings', { params });
    return response.data;
  },

  getBookingById: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  getAvailableSeats: async (scheduleId) => {
    const response = await api.get(`/bookings/schedules/${scheduleId}/seats`);
    return response.data;
  },

  updateBookingStatus: async (id, status) => {
    const response = await api.put(`/bookings/${id}`, { status });
    return response.data;
  },

  cancelBooking: async (id) => {
    const response = await api.delete(`/bookings/${id}/cancel`);
    return response.data;
  },

  deleteBooking: async (id) => {
    const response = await api.delete(`/bookings/${id}`);
    return response.data;
  }
};

// City & Dropdown Service
export const cityService = {
  getCities: async () => {
    const response = await api.get('/cities');
    return response.data;
  }
};

// QRIS Service
export const qrisService = {
  getQris: async () => {
    const response = await api.get('/qris');
    return response.data;
  }
};

// Master Data Service (Cities, Routes, Vehicles, Drivers, Seat Templates)
export const masterService = {
  // Cities
  getCities: async () => {
    const response = await api.get('/cities');
    return response.data;
  },
  createCity: async (data) => {
    const response = await api.post('/cities', data);
    return response.data;
  },
  updateCity: async (id, data) => {
    const response = await api.put(`/cities/${id}`, data);
    return response.data;
  },
  deleteCity: async (id) => {
    const response = await api.delete(`/cities/${id}`);
    return response.data;
  },

  // Routes
  getRoutes: async () => {
    const response = await api.get('/routes');
    return response.data;
  },
  createRoute: async (data) => {
    const response = await api.post('/routes', data);
    return response.data;
  },
  updateRoute: async (id, data) => {
    const response = await api.put(`/routes/${id}`, data);
    return response.data;
  },
  deleteRoute: async (id) => {
    const response = await api.delete(`/routes/${id}`);
    return response.data;
  },

  // Vehicles / Armada
  getVehicles: async () => {
    const response = await api.get('/vehicles');
    return response.data;
  },
  createVehicle: async (data) => {
    const response = await api.post('/vehicles', data);
    return response.data;
  },
  updateVehicle: async (id, data) => {
    const response = await api.put(`/vehicles/${id}`, data);
    return response.data;
  },
  deleteVehicle: async (id) => {
    const response = await api.delete(`/vehicles/${id}`);
    return response.data;
  },

  // Drivers
  getDrivers: async () => {
    const response = await api.get('/drivers');
    return response.data;
  },
  getAvailableDriverUsers: async () => {
    const response = await api.get('/drivers/users/available');
    return response.data;
  },
  createDriver: async (data) => {
    const response = await api.post('/drivers', data);
    return response.data;
  },
  updateDriver: async (id, data) => {
    const response = await api.put(`/drivers/${id}`, data);
    return response.data;
  },
  deleteDriver: async (id) => {
    const response = await api.delete(`/drivers/${id}`);
    return response.data;
  },

  // Seat Templates
  getSeatTemplates: async () => {
    const response = await api.get('/seat-templates');
    return response.data;
  }
};

// Dashboard Stats Service
export const dashboardService = {
  getStats: async (params = {}) => {
    const response = await api.get('/laporan/overview', { params });
    return response.data;
  }
};

// Charter Service
export const charterService = {
  getCharters: async (params = {}) => {
    const response = await api.get('/charters', { params });
    return response.data;
  },

  getCharterByCode: async (code) => {
    const response = await api.get(`/charters/${code}`);
    return response.data;
  },

  checkAvailability: async (params = {}) => {
    const response = await api.get('/charters/check-availability', { params });
    return response.data;
  },

  createCharter: async (data) => {
    const token = await AsyncStorage.getItem('user_token');
    const endpoint = token ? '/charters' : '/charters/public';
    const response = await api.post(endpoint, data);
    return response.data;
  },

  updateCharterStatus: async (id, status, paymentNotes) => {
    const response = await api.put(`/charters/${id}/status`, { status, paymentNotes });
    return response.data;
  },

  deleteCharter: async (id) => {
    const response = await api.delete(`/charters/${id}`);
    return response.data;
  }
};

// Package Service
export const packageService = {
  getPackages: async (params = {}) => {
    const response = await api.get('/packages', { params });
    return response.data;
  },

  getPackageByCode: async (code) => {
    const response = await api.get(`/packages/${code}`);
    return response.data;
  },

  checkAvailability: async (params = {}) => {
    const response = await api.get('/packages/check-availability', { params });
    return response.data;
  },

  createPackage: async (data) => {
    const token = await AsyncStorage.getItem('user_token');
    const endpoint = token ? '/packages' : '/packages/public';
    const response = await api.post(endpoint, data);
    return response.data;
  },

  updatePackageStatus: async (id, status, paymentNotes) => {
    const response = await api.put(`/packages/${id}/status`, { status, paymentNotes });
    return response.data;
  },

  deletePackage: async (id) => {
    const response = await api.delete(`/packages/${id}`);
    return response.data;
  }
};

// Payment Service
export const paymentService = {
  getPayments: async (params = {}) => {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  getPaymentStats: async (params = {}) => {
    const response = await api.get('/payments/stats', { params });
    return response.data;
  },

  deletePayment: async (type, id) => {
    const response = await api.delete(`/payments/${type}/${id}`);
    return response.data;
  }
};

// Check-In Service
export const checkInService = {
  getSchedules: async (params = {}) => {
    const response = await api.get('/checkin/schedules', { params });
    return response.data;
  },

  getScheduleBookings: async (scheduleId, params = {}) => {
    const response = await api.get(`/checkin/schedules/${scheduleId}/bookings`, { params });
    return response.data;
  },

  checkInBooking: async (bookingId) => {
    const response = await api.post(`/checkin/bookings/${bookingId}/checkin`);
    return response.data;
  },

  undoCheckIn: async (bookingId) => {
    const response = await api.post(`/checkin/bookings/${bookingId}/undo`);
    return response.data;
  },

  bulkCheckIn: async (scheduleId) => {
    const response = await api.post(`/checkin/schedules/${scheduleId}/bulk-checkin`);
    return response.data;
  }
};

// Report Service
export const reportService = {
  getOverview: async (params = {}) => {
    const response = await api.get('/laporan/overview', { params });
    return response.data;
  },

  getSales: async (params = {}) => {
    const response = await api.get('/laporan/sales', { params: { ...params, groupBy: 'day' } });
    return response.data;
  },

  getRouteRevenue: async (params = {}) => {
    const response = await api.get('/laporan/route-revenue', { params });
    return response.data;
  },

  getVehicleUtilization: async (params = {}) => {
    const response = await api.get('/laporan/vehicle-utilization', { params });
    return response.data;
  },

  getDriverPerformance: async (params = {}) => {
    const response = await api.get('/laporan/driver-performance', { params });
    return response.data;
  },

  getTopCustomers: async (params = {}) => {
    const response = await api.get('/laporan/top-customers', { params: { ...params, limit: 10 } });
    return response.data;
  }
};

// User Management Service
export const userService = {
  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  getUserStats: async () => {
    const response = await api.get('/users/stats');
    return response.data;
  },

  createUser: async (data) => {
    const response = await api.post('/users', data);
    return response.data;
  },

  updateUser: async (id, data) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};

// Helper to resolve backend upload URLs
export const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const base = api.defaults.baseURL.replace(/\/api$/, '');
  return `${base}${path.startsWith('/') ? '' : '/'}${path}`;
};

export default api;
