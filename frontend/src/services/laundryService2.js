// src/services/laundryService.js
// Complete API service for laundry vendor panel

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/laundry';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('authToken') || localStorage.getItem('token');
};

// Helper function to make authenticated requests
const fetchWithAuth = async (url, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

// Vendor API endpoints
const vendorAPI = {
  // Get current logged-in vendor (auto-load)
  getMine: async () => {
    return fetchWithAuth(`${API_BASE_URL}/vendors/me`);
  },

  // Get all vendors (with filters)
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    
    if (filters.pincode) params.append('pincode', filters.pincode);
    if (filters.services) params.append('services', filters.services);
    if (filters.rating) params.append('rating', filters.rating);
    if (filters.deliverySpeed) params.append('deliverySpeed', filters.deliverySpeed);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);

    const queryString = params.toString();
    const url = queryString ? `${API_BASE_URL}/vendors?${queryString}` : `${API_BASE_URL}/vendors`;
    
    return fetchWithAuth(url);
  },

  // Get single vendor by ID or slug
  getOne: async (id) => {
    return fetchWithAuth(`${API_BASE_URL}/vendors/${id}`);
  },

  // Get vendor pricing
  getPricing: async (id, deliverySpeed = 'scheduled') => {
    return fetchWithAuth(`${API_BASE_URL}/vendors/${id}/pricing?deliverySpeed=${deliverySpeed}`);
  },

  // Get vendor subscription plans
  getPlans: async (id) => {
    return fetchWithAuth(`${API_BASE_URL}/vendors/${id}/plans`);
  },

  // Update vendor profile (PATCH)
  updateProfile: async (id, profileData) => {
    return fetchWithAuth(`${API_BASE_URL}/vendors/${id}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
  },

  // Update vendor services (PATCH)
  updateServices: async (id, services) => {
    return fetchWithAuth(`${API_BASE_URL}/vendors/${id}/services`, {
      method: 'PATCH',
      body: JSON.stringify({ services }),
    });
  },

  // Update vendor pricing (PATCH)
  updatePricing: async (id, pricing) => {
    return fetchWithAuth(`${API_BASE_URL}/vendors/${id}/pricing`, {
      method: 'PATCH',
      body: JSON.stringify({ pricing }),
    });
  },

  // Update vendor weight-based pricing (PATCH)
  updateWeightPricing: async (id, weightPricing) => {
    return fetchWithAuth(`${API_BASE_URL}/vendors/${id}/weight-pricing`, {
      method: 'PATCH',
      body: JSON.stringify({ weightPricing }),
    });
  },

  // Create vendor (Admin only)
  create: async (vendorData) => {
    return fetchWithAuth(`${API_BASE_URL}/vendors`, {
      method: 'POST',
      body: JSON.stringify(vendorData),
    });
  },

  // Update vendor (Admin only - full update)
  update: async (id, vendorData) => {
    return fetchWithAuth(`${API_BASE_URL}/vendors/${id}`, {
      method: 'PUT',
      body: JSON.stringify(vendorData),
    });
  },

  // Delete vendor (soft delete)
  delete: async (id) => {
    return fetchWithAuth(`${API_BASE_URL}/vendors/${id}`, {
      method: 'DELETE',
    });
  },

  // Get nearby vendors (geolocation)
  getNearby: async (latitude, longitude, radius = 10, deliverySpeed = null) => {
    const params = new URLSearchParams({
      latitude,
      longitude,
      radius,
    });
    
    if (deliverySpeed) params.append('deliverySpeed', deliverySpeed);

    return fetchWithAuth(`${API_BASE_URL}/vendors/nearby?${params.toString()}`);
  },

  // Check quick service availability
  checkQuickAvailability: async (pincode, requestedTime = null) => {
    return fetchWithAuth(`${API_BASE_URL}/vendors/check-quick-availability`, {
      method: 'POST',
      body: JSON.stringify({ pincode, requestedTime }),
    });
  },

  // Check scheduled service availability
  checkScheduledAvailability: async (pincode, date, timeSlot) => {
    return fetchWithAuth(`${API_BASE_URL}/vendors/check-scheduled-availability`, {
      method: 'POST',
      body: JSON.stringify({ pincode, date, timeSlot }),
    });
  },
};

// Order API endpoints
const orderAPI = {
  // Get current vendor's orders (NEEDS BACKEND IMPLEMENTATION)
  getMyOrders: async (status = null) => {
    let url = `${API_BASE_URL}/orders/vendor/me`;
    if (status) url += `?status=${status}`;
    
    return fetchWithAuth(url);
  },

  // Get user's orders
  getUserOrders: async () => {
    return fetchWithAuth(`${API_BASE_URL}/orders`);
  },

  // Get single order
  getOne: async (id) => {
    return fetchWithAuth(`${API_BASE_URL}/orders/${id}`);
  },

  // Create new order
  create: async (orderData) => {
    return fetchWithAuth(`${API_BASE_URL}/orders`, {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  // Update order status (Vendor/Admin only)
  updateStatus: async (id, status, note = '') => {
    return fetchWithAuth(`${API_BASE_URL}/orders/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, note }),
    });
  },

  // Cancel order
  cancel: async (id, reason = '') => {
    return fetchWithAuth(`${API_BASE_URL}/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Submit feedback
  submitFeedback: async (id, feedback) => {
    return fetchWithAuth(`${API_BASE_URL}/orders/${id}/feedback`, {
      method: 'POST',
      body: JSON.stringify(feedback),
    });
  },

  // Track order
  track: async (id) => {
    return fetchWithAuth(`${API_BASE_URL}/orders/${id}/track`);
  },
};

// Subscription API endpoints
const subscriptionAPI = {
  // Get user's subscriptions
  getUserSubscriptions: async () => {
    return fetchWithAuth(`${API_BASE_URL}/subscriptions`);
  },

  // Get single subscription
  getOne: async (id) => {
    return fetchWithAuth(`${API_BASE_URL}/subscriptions/${id}`);
  },

  // Create new subscription
  create: async (subscriptionData) => {
    return fetchWithAuth(`${API_BASE_URL}/subscriptions`, {
      method: 'POST',
      body: JSON.stringify(subscriptionData),
    });
  },

  // Get subscription usage
  getUsage: async (id) => {
    return fetchWithAuth(`${API_BASE_URL}/subscriptions/${id}/usage`);
  },

  // Update preferences
  updatePreferences: async (id, preferences) => {
    return fetchWithAuth(`${API_BASE_URL}/subscriptions/${id}/preferences`, {
      method: 'PATCH',
      body: JSON.stringify(preferences),
    });
  },

  // Pause subscription
  pause: async (id) => {
    return fetchWithAuth(`${API_BASE_URL}/subscriptions/${id}/pause`, {
      method: 'POST',
    });
  },

  // Resume subscription
  resume: async (id) => {
    return fetchWithAuth(`${API_BASE_URL}/subscriptions/${id}/resume`, {
      method: 'POST',
    });
  },

  // Cancel subscription
  cancel: async (id, reason = '') => {
    return fetchWithAuth(`${API_BASE_URL}/subscriptions/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  // Toggle auto-renewal
  toggleAutoRenewal: async (id, autoRenewal) => {
    return fetchWithAuth(`${API_BASE_URL}/subscriptions/${id}/auto-renewal`, {
      method: 'PATCH',
      body: JSON.stringify({ autoRenewal }),
    });
  },
};

// Basic/General API endpoints
const basicAPI = {
  // Get available services
  getServices: async () => {
    return fetchWithAuth(`${API_BASE_URL}/services`);
  },

  // Get subscription plans
  getPlans: async () => {
    return fetchWithAuth(`${API_BASE_URL}/plans`);
  },

  // Calculate price
  calculatePrice: async (calculationData) => {
    return fetchWithAuth(`${API_BASE_URL}/calculate-price`, {
      method: 'POST',
      body: JSON.stringify(calculationData),
    });
  },
};

// Export combined API object
const api = {
  vendors: vendorAPI,
  orders: orderAPI,
  subscriptions: subscriptionAPI,
  basic: basicAPI,
};

export default api;