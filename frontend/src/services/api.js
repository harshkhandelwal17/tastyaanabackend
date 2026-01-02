import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/laundry';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login if unauthorized
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error.message);
  }
);

// ==================== VENDOR APIs ====================

export const vendorAPI = {
  // Get all vendors
  getAll: (params = {}) => api.get('/vendors', { params }),

  // Get single vendor
  getById: (id) => api.get(`/vendors/${id}`),

  // Get nearby vendors
  getNearby: (params) => api.get('/vendors/nearby', { params }),

  // Get vendor plans
  getPlans: (vendorId) => api.get(`/vendors/${vendorId}/plans`),

  // Check availability
  checkAvailability: (data) => api.post('/vendors/check-availability', data),
};

// ==================== ORDER APIs ====================

export const orderAPI = {
  // Create order
  create: (data) => api.post('/orders', data),

  // Get user orders
  getAll: (params = {}) => api.get('/orders', { params }),

  // Get single order
  getById: (id) => api.get(`/orders/${id}`),

  // Track order
  track: (id) => api.get(`/orders/${id}/track`),

  // Cancel order
  cancel: (id, data) => api.post(`/orders/${id}/cancel`, data),

  // Submit feedback
  submitFeedback: (id, data) => api.post(`/orders/${id}/feedback`, data),

  // Calculate price
  calculatePrice: (data) => api.post('/calculate-price', data),
};

// ==================== SUBSCRIPTION APIs ====================

export const subscriptionAPI = {
  // Create subscription
  create: (data) => api.post('/subscriptions', data),

  // Get user subscriptions
  getAll: (params = {}) => api.get('/subscriptions', { params }),

  // Get single subscription
  getById: (id) => api.get(`/subscriptions/${id}`),

  // Update preferences
  updatePreferences: (id, data) => api.patch(`/subscriptions/${id}/preferences`, data),

  // Pause subscription
  pause: (id, data) => api.post(`/subscriptions/${id}/pause`, data),

  // Resume subscription
  resume: (id) => api.post(`/subscriptions/${id}/resume`),

  // Cancel subscription
  cancel: (id, data) => api.post(`/subscriptions/${id}/cancel`, data),

  // Toggle auto-renewal
  toggleAutoRenewal: (id) => api.patch(`/subscriptions/${id}/auto-renewal`),
};

export default api;