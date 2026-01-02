import axios from 'axios';

// Base URL configuration
const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

// Create axios instance for seller vehicle operations
const sellerVehicleAPI = axios.create({
  baseURL: `${BASE_URL}/seller/vehicles`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
sellerVehicleAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== DASHBOARD APIs =====

// Get seller dashboard data
export const getSellerDashboard = async () => {
  try {
    const response = await sellerVehicleAPI.get('/dashboard');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch dashboard data' };
  }
};

// Get seller profile
export const getSellerProfile = async () => {
  try {
    const response = await sellerVehicleAPI.get('/profile');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch seller profile' };
  }
};

// ===== VEHICLE MANAGEMENT APIs =====

// Get seller's vehicles
export const getSellerVehicles = async (params = {}) => {
  try {
    const response = await sellerVehicleAPI.get('/', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch vehicles' };
  }
};

// Create new vehicle
export const createVehicle = async (formData) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    const response = await sellerVehicleAPI.post('/', formData, config);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create vehicle' };
  }
};

// Update vehicle
export const updateVehicle = async (vehicleId, formData) => {
  try {
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };
    const response = await sellerVehicleAPI.put(`/${vehicleId}`, formData, config);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update vehicle' };
  }
};

// Delete vehicle
export const deleteVehicle = async (vehicleId) => {
  try {
    const response = await sellerVehicleAPI.delete(`/${vehicleId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete vehicle' };
  }
};

// Toggle vehicle availability
export const toggleVehicleAvailability = async (vehicleId) => {
  try {
    const response = await sellerVehicleAPI.patch(`/${vehicleId}/toggle-availability`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to toggle vehicle availability' };
  }
};

// ===== BOOKING MANAGEMENT APIs =====

// Get seller's bookings
export const getSellerBookings = async (params = {}) => {
  try {
    const response = await sellerVehicleAPI.get('/bookings', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch bookings' };
  }
};

// Get booking details
export const getBookingDetails = async (bookingId) => {
  try {
    const response = await sellerVehicleAPI.get(`/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch booking details' };
  }
};

// Update booking status
export const updateBookingStatus = async (bookingId, statusData) => {
  try {
    const response = await sellerVehicleAPI.put(`/bookings/${bookingId}/status`, statusData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update booking status' };
  }
};

// Respond to extension request
export const respondToExtension = async (bookingId, data) => {
  try {
    const response = await sellerVehicleAPI.post(`/bookings/${bookingId}/respond-extension`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to respond to extension' };
  }
};

// Create extension (seller-initiated)
export const createExtension = async (bookingId, data) => {
  try {
    const response = await sellerVehicleAPI.post(`/bookings/${bookingId}/create-extension`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create extension' };
  }
};

// Verify Customer OTP
export const verifyBookingOtp = async (bookingId, otp) => {
  try {
    // In a real app, this would verify with backend
    // Simulating API call
    console.log(`Verifying OTP ${otp} for booking ${bookingId}`);
    return { success: true, message: "Identity Verified" };
    // const response = await sellerVehicleAPI.post(`/bookings/${bookingId}/verify-otp`, { otp });
    // return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'OTP Verification Failed' };
  }
};

// Process Vehicle Handover (Pickup/Dropoff)
export const processHandover = async (bookingId, type, data) => {
  try {
    // type: 'pickup' | 'dropoff'
    console.log(`Processing ${type} for booking ${bookingId}`, data);

    // Map to status update
    const status = type === 'pickup' ? 'ongoing' : 'completed';
    const response = await updateBookingStatus(bookingId, {
      status,
      ...data
    });
    return response;
  } catch (error) {
    throw error.response?.data || { message: `Failed to process ${type}` };
  }
};

// ===== UTILITY FUNCTIONS =====

// Format vehicle data for display
export const formatVehicleForDisplay = (vehicle) => {
  if (!vehicle) return null;

  return {
    id: vehicle._id,
    brand: vehicle.companyName, // Changed from brand to companyName
    model: vehicle.name, // Vehicle name contains the full model info
    year: vehicle.modelYear, // Changed from year to modelYear
    category: vehicle.category,
    registrationNumber: vehicle.vehicleNo, // Changed from registrationNumber to vehicleNo
    images: vehicle.vehicleImages || [], // Changed from images to vehicleImages
    status: vehicle.status,
    availability: vehicle.availability,
    pricing: {
      daily: vehicle.rate24hr?.ratePerHour, // Using 24hr rate as daily
      hourly: vehicle.rate12hr?.ratePerHour, // Using 12hr rate as hourly
      deposit: vehicle.depositAmount
    },
    features: vehicle.vehicleFeatures || [], // Changed from features to vehicleFeatures
    location: {
      city: vehicle.zoneCenterName, // Using zone center name as location
      address: vehicle.zoneCenterAddress,
      coordinates: vehicle.locationGeo?.coordinates
    },
    seller: vehicle.sellerId, // Seller information
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
    analytics: vehicle.analytics // Vehicle performance data
  };
};

// Format booking data for display
export const formatBookingForDisplay = (booking) => {
  if (!booking) return null;
  
  // Debug pickup location data
  console.log('🔍 Booking pickup location debug:', {
    pickupLocation: booking.pickupLocation,
    pickupLocationType: typeof booking.pickupLocation,
    centerName: booking.centerName,
    zone: booking.zone
  });

  return {
    id: booking._id,
    bookingId: booking.bookingId,
    customer: {
      name: booking.userId?.name, // Changed from customer to userId
      phone: booking.userId?.phone,
      email: booking.userId?.email
    },
    vehicle: {
      brand: booking.vehicleId?.companyName, // Changed vehicle to vehicleId and updated field names
      model: booking.vehicleId?.name,
      registrationNumber: booking.vehicleId?.vehicleNo,
      images: booking.vehicleId?.vehicleImages || []
    },
    startDate: booking.startDateTime, // Changed from startDate to startDateTime
    endDate: booking.endDateTime, // Changed from endDate to endDateTime
    pickupLocation: booking.pickupLocation?.address || 
                   (typeof booking.pickupLocation === 'string' ? booking.pickupLocation : 
                    booking.centerName || booking.zone || 'Pickup location not specified'),
    dropoffLocation: booking.dropLocation?.address || 
                    (typeof booking.dropLocation === 'string' ? booking.dropLocation :
                     booking.centerName || booking.zone || 'Drop location not specified'), // Changed to dropLocation
    totalAmount: booking.billing?.totalBill || booking.totalAmount, // Use billing.totalBill from model
    paidAmount: booking.paidAmount || 0, // Add paid amount tracking
    status: booking.bookingStatus || booking.status, // Use bookingStatus from model
    paymentStatus: booking.paymentStatus,
    payments: booking.payments || [], // Add payments array for tracking
    billing: booking.billing, // Include full billing object
    bookingDate: booking.bookingDate,
    notes: booking.notes,
    documents : booking.documents || [], // Added documents array
    zone: booking.zone, // Added zone information
    centerName: booking.centerName, // Added center name
    verificationCodes: booking.verificationCodes, // Added verification codes for OTP status
    statusHistory: booking.statusHistory // Added status history for tracking
  };
};

// ===== ZONE MANAGEMENT APIs =====

// Get seller's service zones
export const getSellerZones = async () => {
  try {
    const response = await sellerVehicleAPI.get('/zones');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch zones' };
  }
};

// Update seller's service zones
export const updateSellerZones = async (serviceZones) => {
  try {
    const response = await sellerVehicleAPI.post('/zones', { serviceZones });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update zones' };
  }
};

// Update specific zone
export const updateZone = async (zoneId, zoneData) => {
  try {
    const response = await sellerVehicleAPI.put(`/zones/${zoneId}`, zoneData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update zone' };
  }
};

// Delete specific zone
export const deleteZone = async (zoneId) => {
  try {
    const response = await sellerVehicleAPI.delete(`/zones/${zoneId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete zone' };
  }
};

// Get status badge color
export const getStatusBadgeColor = (status) => {
  const statusColors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    paid: 'bg-green-100 text-green-800',
    unpaid: 'bg-red-100 text-red-800',
    partial: 'bg-yellow-100 text-yellow-800'
  };

  return statusColors[status] || 'bg-gray-100 text-gray-800';
};

export default sellerVehicleAPI;