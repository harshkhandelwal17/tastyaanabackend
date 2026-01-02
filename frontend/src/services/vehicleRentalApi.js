import axios from 'axios';

// Base URL configuration - align with seller vehicle API
const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

// Create axios instance for vehicle rental operations
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests - align with seller vehicle API token key
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Create a wrapper service that uses the correct base URL
const apiService = {
  request: async (endpoint, options = {}) => {
    try {
      const response = await apiClient({
        url: endpoint,
        method: options.method || 'GET',
        data: options.body ? JSON.parse(options.body) : undefined,
        ...options
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};
// import apiClient from '../redux/api/apiClient';

const vehicleRentalAPI = {
  // Dashboard & Statistics
  getDashboardStats: async () => {
    try {
      const response = await apiService.request('/seller/vehicle-rental/stats');
      return response;
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return { data: {} };
    }
  },

  // Vehicle Management
  getVehicles: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiService.request(`/seller/vehicle-rental/vehicles?${queryString}`);
      return response;
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      return { data: [] };
    }
  },

  getVehicle: async (vehicleId) => {
    try {
      const response = await apiService.request(`/seller/vehicle-rental/vehicles/${vehicleId}`);
      return response;
    } catch (error) {
      console.error('Error fetching vehicle:', error);
      throw error;
    }
  },

  createVehicle: async (vehicleData) => {
    try {
      const response = await apiService.request('/seller/vehicle-rental/vehicles', {
        method: 'POST',
        body: JSON.stringify(vehicleData),
      });
      return response;
    } catch (error) {
      console.error('Error creating vehicle:', error);
      throw error;
    }
  },

  updateVehicle: async (vehicleId, vehicleData) => {
    try {
      const response = await apiService.request(`/seller/vehicle-rental/vehicles/${vehicleId}`, {
        method: 'PUT',
        body: JSON.stringify(vehicleData),
      });
      return response;
    } catch (error) {
      console.error('Error updating vehicle:', error);
      throw error;
    }
  },

  deleteVehicle: async (vehicleId) => {
    try {
      const response = await apiService.request(`/seller/vehicle-rental/vehicles/${vehicleId}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      throw error;
    }
  },

  updateVehicleStatus: async (vehicleId, status) => {
    try {
      const response = await apiService.request(`/seller/vehicle-rental/vehicles/${vehicleId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      return response;
    } catch (error) {
      console.error('Error updating vehicle status:', error);
      throw error;
    }
  },

  // Zone Management - Updated to use seller vehicle routes
  getZones: async () => {
    try {
      const response = await apiClient.get('/seller/vehicles/zones');
      return response.data;
    } catch (error) {
      console.error('Error fetching zones:', error);
      return { data: [] };
    }
  },

  createZone: async (zoneData) => {
    try {
      const response = await apiClient.post('/seller/vehicles/zones', { serviceZones: [zoneData] });
      return response.data;
    } catch (error) {
      console.error('Error creating zone:', error);
      throw error;
    }
  },

  updateZone: async (zoneId, zoneData) => {
    try {
      const response = await apiClient.put(`/seller/vehicles/zones/${zoneId}`, zoneData);
      return response.data;
    } catch (error) {
      console.error('Error updating zone:', error);
      throw error;
    }
  },

  deleteZone: async (zoneId) => {
    try {
      const response = await apiClient.delete(`/seller/vehicles/zones/${zoneId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting zone:', error);
      throw error;
    }
  },

  // Worker Management
  getWorkers: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiService.request(`/seller/vehicle-rental/workers?${queryString}`);
      return response;
    } catch (error) {
      console.error('Error fetching workers:', error);
      return { data: [] };
    }
  },

  getWorker: async (workerId) => {
    try {
      const response = await apiService.request(`/seller/vehicle-rental/workers/${workerId}`);
      return response;
    } catch (error) {
      console.error('Error fetching worker:', error);
      throw error;
    }
  },

  createWorker: async (workerData) => {
    try {
      const response = await apiService.request('/seller/vehicle-rental/workers', {
        method: 'POST',
        body: JSON.stringify(workerData),
      });
      return response;
    } catch (error) {
      console.error('Error creating worker:', error);
      throw error;
    }
  },

  updateWorker: async (workerId, workerData) => {
    try {
      const response = await apiService.request(`/seller/vehicle-rental/workers/${workerId}`, {
        method: 'PUT',
        body: JSON.stringify(workerData),
      });
      return response;
    } catch (error) {
      console.error('Error updating worker:', error);
      throw error;
    }
  },

  deleteWorker: async (workerId) => {
    try {
      const response = await apiService.request(`/seller/vehicle-rental/workers/${workerId}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error('Error deleting worker:', error);
      throw error;
    }
  },

  assignWorkerToZone: async (workerId, zoneId) => {
    try {
      const response = await apiService.request(`/seller/vehicle-rental/workers/${workerId}/assign-zone`, {
        method: 'POST',
        body: JSON.stringify({ zoneId }),
      });
      return response;
    } catch (error) {
      console.error('Error assigning worker to zone:', error);
      throw error;
    }
  },

  removeWorkerFromZone: async (workerId, zoneId) => {
    try {
      const response = await apiService.request(`/seller/vehicle-rental/workers/${workerId}/remove-zone`, {
        method: 'POST',
        body: JSON.stringify({ zoneId }),
      });
      return response;
    } catch (error) {
      console.error('Error removing worker from zone:', error);
      throw error;
    }
  },

  // Booking Management
  getBookings: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiService.request(`/seller/vehicle-rental/bookings?${queryString}`);
      return response;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return { data: [] };
    }
  },

  getBooking: async (bookingId) => {
    try {
      const response = await apiService.request(`/seller/vehicle-rental/bookings/${bookingId}`);
      return response;
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }
  },

  createBooking: async (bookingData) => {
    try {
      const response = await apiService.request('/seller/vehicle-rental/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });
      return response;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  updateBooking: async (bookingId, bookingData) => {
    try {
      const response = await apiService.request(`/seller/vehicle-rental/bookings/${bookingId}`, {
        method: 'PUT',
        body: JSON.stringify(bookingData),
      });
      return response;
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  },

  updateBookingStatus: async (bookingId, status, notes = '') => {
    try {
      const response = await apiService.request(`/seller/vehicle-rental/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, notes }),
      });
      return response;
    } catch (error) {
      console.error('Error updating booking status:', error);
      throw error;
    }
  },

  cancelBooking: async (bookingId, reason = '') => {
    try {
      const response = await apiService.request(`/seller/vehicle-rental/bookings/${bookingId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
      return response;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  },

  // Accessories Management
  getAccessories: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiService.request(`/seller/vehicle-rental/accessories?${queryString}`);
      return response;
    } catch (error) {
      console.error('Error fetching accessories:', error);
      return { data: [] };
    }
  },

  getAccessory: async (accessoryId) => {
    try {
      const response = await apiService.request(`/seller/vehicle-rental/accessories/${accessoryId}`);
      return response;
    } catch (error) {
      console.error('Error fetching accessory:', error);
      throw error;
    }
  },

  createAccessory: async (accessoryData) => {
    try {
      const response = await apiService.request('/seller/vehicle-rental/accessories', {
        method: 'POST',
        body: JSON.stringify(accessoryData),
      });
      return response;
    } catch (error) {
      console.error('Error creating accessory:', error);
      throw error;
    }
  },

  updateAccessory: async (accessoryId, accessoryData) => {
    try {
      const response = await apiService.request(`/seller/vehicle-rental/accessories/${accessoryId}`, {
        method: 'PUT',
        body: JSON.stringify(accessoryData),
      });
      return response;
    } catch (error) {
      console.error('Error updating accessory:', error);
      throw error;
    }
  },

  deleteAccessory: async (accessoryId) => {
    try {
      const response = await apiService.request(`/seller/vehicle-rental/accessories/${accessoryId}`, {
        method: 'DELETE',
      });
      return response;
    } catch (error) {
      console.error('Error deleting accessory:', error);
      throw error;
    }
  },

  updateAccessoryStock: async (accessoryId, quantity, operation = 'add') => {
    try {
      const response = await apiService.request(`/seller/vehicle-rental/accessories/${accessoryId}/stock`, {
        method: 'PUT',
        body: JSON.stringify({ quantity, operation }),
      });
      return response;
    } catch (error) {
      console.error('Error updating accessory stock:', error);
      throw error;
    }
  },

  // Reports and Analytics
  getRevenueSummary: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiService.request(`/seller/vehicle-rental/reports/revenue?${queryString}`);
      return response;
    } catch (error) {
      console.error('Error fetching revenue summary:', error);
      return { data: {} };
    }
  },

  getBookingSummary: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiService.request(`/seller/vehicle-rental/reports/bookings?${queryString}`);
      return response;
    } catch (error) {
      console.error('Error fetching booking summary:', error);
      return { data: {} };
    }
  },

  getVehicleUtilization: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiService.request(`/seller/vehicle-rental/reports/utilization?${queryString}`);
      return response;
    } catch (error) {
      console.error('Error fetching vehicle utilization:', error);
      return { data: [] };
    }
  },

  exportBookings: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${process.env.REACT_APP_API_URL}/seller/vehicle-rental/export/bookings?${queryString}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Export failed');
      }
      
      // Handle file download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings-export-${new Date().getTime()}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return { success: true };
    } catch (error) {
      console.error('Error exporting bookings:', error);
      throw error;
    }
  },

  // Maintenance Management
  getMaintenanceRecords: async (vehicleId) => {
    try {
      const response = await apiService.request(`/seller/vehicle-rental/vehicles/${vehicleId}/maintenance`);
      return response;
    } catch (error) {
      console.error('Error fetching maintenance records:', error);
      return { data: [] };
    }
  },

  createMaintenanceRecord: async (vehicleId, maintenanceData) => {
    try {
      const response = await apiService.request(`/seller/vehicle-rental/vehicles/${vehicleId}/maintenance`, {
        method: 'POST',
        body: JSON.stringify(maintenanceData),
      });
      return response;
    } catch (error) {
      console.error('Error creating maintenance record:', error);
      throw error;
    }
  },

  updateMaintenanceRecord: async (vehicleId, maintenanceId, maintenanceData) => {
    try {
      const response = await apiService.request(`/seller/vehicle-rental/vehicles/${vehicleId}/maintenance/${maintenanceId}`, {
        method: 'PUT',
        body: JSON.stringify(maintenanceData),
      });
      return response;
    } catch (error) {
      console.error('Error updating maintenance record:', error);
      throw error;
    }
  },

  // Availability Management
  checkVehicleAvailability: async (vehicleId, startDate, endDate) => {
    try {
      const response = await apiService.request(`/seller/vehicle-rental/vehicles/${vehicleId}/availability`, {
        method: 'POST',
        body: JSON.stringify({ startDate, endDate }),
      });
      return response;
    } catch (error) {
      console.error('Error checking vehicle availability:', error);
      throw error;
    }
  },

  getAvailableVehicles: async (startDate, endDate, zoneId = null) => {
    try {
      const params = { startDate, endDate };
      if (zoneId) params.zoneId = zoneId;
      
      const queryString = new URLSearchParams(params).toString();
      const response = await apiService.request(`/seller/vehicle-rental/vehicles/available?${queryString}`);
      return response;
    } catch (error) {
      console.error('Error fetching available vehicles:', error);
      return { data: [] };
    }
  },

  // ===== Seller Booking Management =====
  
  // Create offline booking (seller-side)
  createOfflineBooking: async (bookingData) => {
    try {
      const response = await apiClient.post('/seller/bookings/create-offline', bookingData);
      return response.data;
    } catch (error) {
      console.error('Error creating offline booking:', error);
      throw error;
    }
  },

  // Get available vehicles for booking time slot
  getAvailableVehiclesForBooking: async (startDateTime, endDateTime, zoneId = null) => {
    try {
      const params = { startDateTime, endDateTime };
      if (zoneId) params.zoneId = zoneId;
      
      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient.get(`/seller/vehicles/available?${queryString}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching available vehicles for booking:', error);
      return { data: [] };
    }
  },

  // Get seller's bookings with filters
  getSellerBookings: async (filters = {}) => {
    try {
      const queryString = new URLSearchParams(filters).toString();
      const response = await apiService.request(`/seller/bookings?${queryString}`);
      return response;
    } catch (error) {
      console.error('Error fetching seller bookings:', error);
      return { data: [] };
    }
  },

  // Update cash payment for a booking
  updateCashPayment: async (bookingId, cashData) => {
    try {
      const response = await apiService.request(`/seller/bookings/${bookingId}/cash-payment`, {
        method: 'PUT',
        body: JSON.stringify(cashData),
      });
      return response;
    } catch (error) {
      console.error('Error updating cash payment:', error);
      throw error;
    }
  },

  // ===== Cash Flow Management =====
  
  // Get cash flow summary
  getCashFlowSummary: async (startDate = null, endDate = null, zoneId = null) => {
    try {
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (zoneId) params.zoneId = zoneId;
      
      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient.get(`/seller/bookings/cash-flow-summary?${queryString}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching cash flow summary:', error);
      return { data: {} };
    }
  },

  // Get daily cash flow report
  getDailyCashReport: async (date = null) => {
    try {
      const params = {};
      if (date) params.date = date;
      
      const queryString = new URLSearchParams(params).toString();
      const response = await apiService.request(`/seller/cash-flow/daily-report?${queryString}`);
      return response;
    } catch (error) {
      console.error('Error fetching daily cash report:', error);
      return { data: [] };
    }
  },

  // Mark cash as handed over to admin
  markCashHandover: async (bookingIds, handoverReceiptNo) => {
    try {
      const response = await apiService.request('/seller/cash-flow/handover', {
        method: 'POST',
        body: JSON.stringify({ bookingIds, handoverReceiptNo }),
      });
      return response;
    } catch (error) {
      console.error('Error marking cash handover:', error);
      throw error;
    }
  }
};

export { vehicleRentalAPI };