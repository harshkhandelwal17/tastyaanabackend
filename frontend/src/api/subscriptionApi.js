import axios from 'axios';
import { getAuthToken } from './auth';

const API_BASE_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:5000/api';
 
// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor to add auth token 
// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response;
      
      if (status === 401) {
        // Handle unauthorized (token expired, etc.)
        // You might want to redirect to login or refresh token here
        console.error('Authentication error:', data.message || 'Unauthorized');
      } else if (status === 403) {
        console.error('Forbidden:', data.message || 'Access denied');
      } else if (status === 404) {
        console.error('Not found:', data.message || 'Resource not found');
      } else if (status >= 500) {
        console.error('Server error:', data.message || 'Something went wrong');
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Subscription API methods
 */
const subscriptionApi = {
  /**
   * Create a new subscription
   * @param {Object} subscriptionData - Subscription data
   * @returns {Promise<Object>} Created subscription
   */
  createSubscription: async (subscriptionData) => {
    try {
      const response = await api.post('/v2/subscriptions', subscriptionData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get active subscription for current user
   * @returns {Promise<Object>} Active subscription
   */
  getActiveSubscription: async () => {
    try {
      const response = await api.get('/v2/subscriptions/active');
      return response.data;
    } catch (error) {
      // If no active subscription found, return null instead of throwing
      if (error.response?.status === 404) {
        return { data: null };
      }
      throw error.response?.data || error;
    }
  },

  /**
   * Get subscription by ID
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Subscription details
   */
  getSubscription: async (subscriptionId) => {
    try {
      const response = await api.get(`/v2/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated subscription
   */
  updateSubscription: async (subscriptionId, updateData) => {
    try {
      const response = await api.put(`/v2/subscriptions/${subscriptionId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Cancel subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} cancelData - Cancellation data (reason, refundAmount, etc.)
   * @returns {Promise<Object>} Cancellation result
   */
  cancelSubscription: async (subscriptionId, cancelData = {}) => {
    try {
      const response = await api.delete(`/v2/subscriptions/${subscriptionId}`, { data: cancelData });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Pause subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} pauseData - Pause data (startDate, endDate, reason)
   * @returns {Promise<Object>} Pause result
   */
  pauseSubscription: async (subscriptionId, pauseData) => {
    try {
      const response = await api.post(`/v2/subscriptions/${subscriptionId}/pause`, pauseData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Resume subscription
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Resume result
   */
  resumeSubscription: async (subscriptionId) => {
    try {
      const response = await api.post(`/v2/subscriptions/${subscriptionId}/resume`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get subscription calendar events
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} params - Query params (startDate, endDate)
   * @returns {Promise<Array>} Array of calendar events
   */
  getCalendarEvents: async (subscriptionId, params = {}) => {
    try {
      const response = await api.get(`/v2/subscriptions/${subscriptionId}/calendar`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get subscription delivery history
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} params - Query params (page, limit, status, dateFrom, dateTo)
   * @returns {Promise<Object>} Paginated delivery history
   */
  getDeliveryHistory: async (subscriptionId, params = {}) => {
    try {
      const response = await api.get(`/v2/subscriptions/${subscriptionId}/deliveries`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Skip a delivery
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} skipData - Skip data (date, shift, reason)
   * @returns {Promise<Object>} Skip result
   */
  skipDelivery: async (subscriptionId, skipData) => {
    try {
      const response = await api.post(`/v2/subscriptions/${subscriptionId}/skip`, skipData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Customize a meal
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} customizationData - Customization data
   * @returns {Promise<Object>} Customization result
   */
  customizeMeal: async (subscriptionId, customizationData) => {
    try {
      const response = await api.post(`/customizations`, {
        subscriptionId,
        ...customizationData,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get meal customization options
   * @returns {Promise<Object>} Available customization options
   */
  getCustomizationOptions: async () => {
    try {
      const response = await api.get('/v2/meal-options/customizations');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get available meal plans
   * @returns {Promise<Array>} List of available meal plans
   */
  getMealPlans: async () => {
    try {
      const response = await api.get('/v2/meal-options/plans');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get available add-ons
   * @returns {Promise<Array>} List of available add-ons
   */
  getAddOns: async () => {
    try {
      const response = await api.get('/v2/subscriptions/add-ons');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get all subscriptions for the current seller
   * @param {Object} params - Query parameters (page, limit, status, search, sort)
   * @returns {Promise<Object>} Paginated list of subscriptions
   */
  getSellerSubscriptions: async (params = {}) => {
    try {
      const response = await api.get('/v2/seller/subscriptions', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get subscription statistics for the seller dashboard
   * @returns {Promise<Object>} Subscription statistics
   */
  getSellerSubscriptionStats: async () => {
    try {
      const response = await api.get('/v2/seller/subscriptions/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get subscription by ID (seller view)
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} Subscription details
   */
  getSellerSubscription: async (subscriptionId) => {
    try {
      const response = await api.get(`/v2/seller/subscriptions/${subscriptionId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Update subscription (seller action)
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated subscription
   */
  updateSellerSubscription: async (subscriptionId, updateData) => {
    try {
      const response = await api.put(`/v2/seller/subscriptions/${subscriptionId}`, updateData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get upcoming deliveries for seller
   * @param {Object} params - Query parameters (date, status, limit)
   * @returns {Promise<Array>} List of upcoming deliveries
   */
  getUpcomingDeliveries: async (params = {}) => {
    try {
      const response = await api.get('/v2/seller/deliveries/upcoming', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  /**
   * Get subscription delivery history for seller
   * @param {Object} params - Query parameters (page, limit, status, dateFrom, dateTo)
   * @returns {Promise<Object>} Paginated delivery history
   */
  getSellerDeliveryHistory: async (params = {}) => {
    try {
      const response = await api.get('/v2/seller/deliveries/history', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default subscriptionApi;
