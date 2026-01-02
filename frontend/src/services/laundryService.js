// src/services/laundryService.js
import axios from 'axios';

const backendBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const normalized = typeof backendBase === 'string' ? backendBase.replace(/\/$/, '') : '';
const apiRoot = normalized.endsWith('/api') ? normalized : `${normalized}/api`;
const API_BASE_URL = `${apiRoot}/laundry`;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  // Try multiple token keys for compatibility
  const token = localStorage.getItem('token') || localStorage.getItem('authToken');
  if (token) {
    // Set Authorization header (Express reads this as lowercase 'authorization')
    config.headers.Authorization = `Bearer ${token}`;
    config.headers.authorization = `Bearer ${token}`; // lowercase for compatibility
    // Removed console.log to prevent spam - token is being added correctly
  } else {
    // Only warn if not a vendor profile check (expected to fail without token in some cases)
    if (!config.url?.includes('/vendors/me') && !config.url?.includes('/vendors')) {
      // Only warn for protected routes
      if (config.method !== 'get' || config.url?.includes('/orders') || config.url?.includes('/subscriptions')) {
        console.warn('⚠️ No token found in localStorage for laundry service');
      }
    }
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => {
    // Axios response structure: response.data contains the actual data
    // Backend returns: { success: true, data: [...], orders: [...] }
    // So we return response.data which contains { success, data, orders }
    return response.data;
  },
  (error) => {
    // Handle 404 errors (vendor not found) - don't log as error, it's expected
    if (error.response?.status === 404) {
      const message = error.response?.data?.message || 'Resource not found';
      const notFoundError = new Error(message);
      notFoundError.isNotFound = true;
      notFoundError.status = 404;
      // Attach response data for components to check
      notFoundError.response = error.response;
      // Suppress console error for expected 404s (vendor profile not found)
      // Browser network tab will still show it, but that's normal
      throw notFoundError;
    }
    
    // Log other errors (only in development or for non-404 errors)
    if (import.meta.env.DEV || error.response?.status !== 404) {
      console.error('Laundry API Error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        error: error.response?.data?.error
      });
    }
    
    // If it's an auth error, provide helpful message
    if (error.response?.status === 401 || error.response?.status === 403) {
      const message = error.response?.data?.message || 'Authentication failed. Please log in again.';
      const authError = new Error(message);
      authError.isAuthError = true;
      throw authError;
    }
    
    // Extract detailed error message
    let message = error.response?.data?.message || error.message || 'Something went wrong';
    
    // If there's a detailed error field, include it
    if (error.response?.data?.error) {
      message = `${message}: ${error.response.data.error}`;
    }
    
    // Handle validation errors
    if (error.response?.data?.errors) {
      const validationErrors = Object.values(error.response.data.errors).map(e => e.message || e).join(', ');
      message = `${message}: ${validationErrors}`;
    }
    
    throw new Error(message);
  }
);

const laundryService = {
  // ==================== VENDORS ====================
  async getVendors(params = {}) {
    return await api.get('/vendors', { params });
  },

  async getVendor(id) {
    return await api.get(`/vendors/${id}`);
  },

  async getVendorPlans(vendorId) {
    return await api.get(`/vendors/${vendorId}/plans`);
  },

  // Get current user's vendor profile
  // Note: Returns 404 if vendor profile doesn't exist (expected behavior)
  async getMyVendor() {
    try {
      return await api.get('/vendors/me');
    } catch (error) {
      // Re-throw the error so components can handle it
      // 404 is expected when vendor profile doesn't exist
      throw error;
    }
  },

  // Create vendor profile
  async createVendor(vendorData) {
    return await api.post('/vendors', vendorData);
  },

  async checkAvailability(data) {
    return await api.post('/vendors/check-availability', data);
  },

  async getNearbyVendors(params) {
    return await api.get('/vendors/nearby', { params });
  },

  // ==================== ORDERS ====================
  async calculatePrice(vendorId, items, deliverySpeed = 'scheduled', subscriptionId = null) {
    return await api.post('/calculate-price', { 
      vendorId, 
      items, 
      deliverySpeed,
      subscriptionId 
    });
  },

  async createOrder(orderData) {
    // Ensure deliverySpeed is included
    if (!orderData.deliverySpeed) {
      orderData.deliverySpeed = 'scheduled';
    }
    return await api.post('/orders', orderData);
  },

  async getUserOrders(params = {}) {
    try {
      const response = await api.get('/orders', { params });
      return response;
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Return empty array on error instead of throwing
      return { data: [], orders: [] };
    }
  },

  async getOrder(orderId) {
    return await api.get(`/orders/${orderId}`);
  },

  async trackOrder(orderId) {
    return await api.get(`/orders/${orderId}/track`);
  },

  async cancelOrder(orderId, reason) {
    return await api.post(`/orders/${orderId}/cancel`, { reason });
  },

  async submitFeedback(orderId, feedback) {
    return await api.post(`/orders/${orderId}/feedback`, feedback);
  },

  // ==================== SUBSCRIPTIONS ====================
  async createSubscription(subscriptionData) {
    return await api.post('/subscriptions', subscriptionData);
  },

  async getUserSubscriptions(params = {}) {
    return await api.get('/subscriptions', { params });
  },

  async getSubscription(subscriptionId) {
    return await api.get(`/subscriptions/${subscriptionId}`);
  },

  async updatePreferences(subscriptionId, preferences) {
    return await api.patch(`/subscriptions/${subscriptionId}/preferences`, preferences);
  },

  async pauseSubscription(subscriptionId, data) {
    return await api.post(`/subscriptions/${subscriptionId}/pause`, data);
  },

  async resumeSubscription(subscriptionId) {
    return await api.post(`/subscriptions/${subscriptionId}/resume`);
  },

  async cancelSubscription(subscriptionId, reason) {
    return await api.post(`/subscriptions/${subscriptionId}/cancel`, { reason });
  },

  async toggleAutoRenewal(subscriptionId) {
    return await api.patch(`/subscriptions/${subscriptionId}/auto-renewal`);
  },

  // ==================== VENDOR SUBSCRIPTION METHODS ====================
  async getVendorSubscriptions(params = {}) {
    return await api.get('/vendors/me/subscriptions', { params });
  },

  async getVendorSubscription(subscriptionId) {
    return await api.get(`/vendors/me/subscriptions/${subscriptionId}`);
  },
};

export default laundryService;