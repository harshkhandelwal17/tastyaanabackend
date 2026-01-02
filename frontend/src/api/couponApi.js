import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';
console.log("backend url is: ",import.meta.env.VITE_BACKEND_URL)
// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Coupon API functions
export const couponApi = {
  // Validate coupon code
  validateCoupon: async (data) => {
    const response = await api.post('/coupons/validate', data);
    return response;
  },

  // Get available coupons for user
  getAvailableCoupons: async (orderAmount = 0, orderType = 'product') => {
    const response = await api.get(`/coupons/available?orderAmount=${orderAmount}&orderType=${orderType}`);
    return response;
  },

  // Get user's coupon usage history
  getUserCouponHistory: async (page = 1, limit = 10) => {
    const response = await api.get(`/coupons/history?page=${page}&limit=${limit}`);
    return response;
  },

  // Admin: Create coupon
  createCoupon: async (data) => {
    const response = await api.post('/coupons', data);
    return response;
  },

  // Admin: Get all coupons
  getAllCoupons: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(`/coupons?${queryParams}`);
    return response;
  },

  // Admin: Get coupon by ID
  getCouponById: async (id) => {
    const response = await api.get(`/coupons/${id}`);
    return response;
  },

  // Admin: Update coupon
  updateCoupon: async (id, data) => {
    const response = await api.put(`/coupons/${id}`, data);
    return response;
  },

  // Admin: Delete coupon
  deleteCoupon: async (id) => {
    const response = await api.delete(`/coupons/${id}`);
    return response;
  },

  // Get enhanced usage statistics for a coupon
  getEnhancedUsageStatistics: async (id) => {
    const response = await api.get(`/coupons/${id}/enhanced-stats`);
    return response;
  },

  // Admin: Get coupon usage history
  getCouponUsageHistory: async (id, params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    const response = await api.get(`/coupons/${id}/usages?${queryParams}`);
    return response;
  },
};

// Export individual functions for convenience
export const validateCoupon = couponApi.validateCoupon;
export const getAvailableCoupons = couponApi.getAvailableCoupons;
export const getUserCouponHistory = couponApi.getUserCouponHistory;
export const createCoupon = couponApi.createCoupon;
export const getAllCoupons = couponApi.getAllCoupons;
export const getCouponById = couponApi.getCouponById;
export const updateCoupon = couponApi.updateCoupon;
export const deleteCoupon = couponApi.deleteCoupon;
export const getEnhancedUsageStatistics = couponApi.getEnhancedUsageStatistics;
export const getCouponUsageHistory = couponApi.getCouponUsageHistory;

export default couponApi;
