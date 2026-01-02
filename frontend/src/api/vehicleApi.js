import axios from 'axios';

// Base URL configuration
const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

// Create axios instance with default config
const vehicleAPI = axios.create({
  baseURL: `${BASE_URL}/vehicles`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
vehicleAPI.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ===== BOOKING APIs =====

// Get all bookings with filters
export const getBookings = async (params = {}) => {
  try {
    const response = await vehicleAPI.get('/bookings/all', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch bookings' };
  }
};

// Get single booking details
export const getBookingById = async (bookingId) => {
  try {
    const response = await vehicleAPI.get(`/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch booking details' };
  }
};

// ===== REFUND APIs =====

// Get all refunds with filters
export const getAllRefunds = async (params = {}) => {
  try {
    const response = await vehicleAPI.get('/refunds', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch refunds' };
  }
};

// Process a new refund
export const processRefund = async (bookingId, refundData) => {
  try {
    const response = await vehicleAPI.post(`/bookings/${bookingId}/refund`, refundData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to process refund' };
  }
};

// Get refund details by ID
export const getRefundById = async (refundId) => {
  try {
    const response = await vehicleAPI.get(`/refunds/${refundId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch refund details' };
  }
};

// Update refund status
export const updateRefundStatus = async (refundId, statusData) => {
  try {
    const response = await vehicleAPI.put(`/refunds/${refundId}/status`, statusData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update refund status' };
  }
};

// Get refund statistics
export const getRefundStats = async (params = {}) => {
  try {
    const response = await vehicleAPI.get('/refunds/stats', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch refund statistics' };
  }
};

// ===== BILLING APIs =====

// Add extra charges to booking
export const addExtraCharges = async (bookingId, chargesData) => {
  try {
    const response = await vehicleAPI.post(`/bookings/${bookingId}/extra-charges`, chargesData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to add extra charges' };
  }
};

// Record offline collection
export const recordOfflineCollection = async (bookingId, collectionData) => {
  try {
    const response = await vehicleAPI.post(`/bookings/${bookingId}/offline-collection`, collectionData);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to record offline collection' };
  }
};

// ===== UTILITY FUNCTIONS =====

// Format booking data for frontend display
export const formatBookingForDisplay = (booking) => {
  if (!booking) return null;

  return {
    id: booking._id,
    _id: booking._id,
    bookingId: booking.bookingId,
    customer: {
      name: booking.customerDetails?.name || 'N/A',
      phone: booking.customerDetails?.phone || 'N/A',
      email: booking.customerDetails?.email || 'N/A'
    },
    vehicle: {
      name: booking.vehicleId?.name || 'Unknown Vehicle',
      vehicleNo: booking.vehicleId?.vehicleNumber || 'N/A'
    },
    startDate: booking.startDateTime,
    endDate: booking.endDateTime,
    duration: calculateDuration(booking.startDateTime, booking.endDateTime),
    baseAmount: booking.billing?.baseAmount || 0,
    extraCharges: formatExtraCharges(booking),
    discount: booking.billing?.discount?.amount || 0,
    totalAmount: booking.billing?.totalBill || 0,
    paidAmount: booking.paidAmount || 0,
    pendingAmount: Math.max(0, (booking.billing?.totalBill || 0) - (booking.paidAmount || 0)),
    paymentStatus: booking.paymentStatus,
    billingStatus: getBillingStatus(booking),
    status: booking.bookingStatus,
    paymentMethod: getPaymentMethod(booking),
    transactionId: getLatestTransactionId(booking),
    createdAt: booking.bookingDate || booking.createdAt,
    refunds: [], // Will be populated by separate refund API calls
    offlineCollections: getOfflineCollections(booking)
  };
};

// Helper function to calculate duration
const calculateDuration = (startDate, endDate) => {
  if (!startDate || !endDate) return 'N/A';
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
  
  if (diffDays >= 1) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  } else {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  }
};

// Helper function to format extra charges
const formatExtraCharges = (booking) => {
  const charges = [];
  const billing = booking.billing || {};
  
  if (billing.extraKmCharge > 0) charges.push({ description: 'Extra KM charge', amount: billing.extraKmCharge });
  if (billing.extraHourCharge > 0) charges.push({ description: 'Extra hour charge', amount: billing.extraHourCharge });
  if (billing.fuelCharges > 0) charges.push({ description: 'Fuel charges', amount: billing.fuelCharges });
  if (billing.damageCharges > 0) charges.push({ description: 'Damage charges', amount: billing.damageCharges });
  if (billing.cleaningCharges > 0) charges.push({ description: 'Cleaning charges', amount: billing.cleaningCharges });
  if (billing.tollCharges > 0) charges.push({ description: 'Toll charges', amount: billing.tollCharges });
  if (billing.lateFees > 0) charges.push({ description: 'Late fees', amount: billing.lateFees });
  
  return charges;
};

// Helper function to get billing status
const getBillingStatus = (booking) => {
  const totalBill = booking.billing?.totalBill || 0;
  const paidAmount = booking.paidAmount || 0;
  
  if (paidAmount >= totalBill) return 'paid';
  if (paidAmount > 0) return 'partial';
  return 'pending';
};

// Helper function to get payment method
const getPaymentMethod = (booking) => {
  const payments = booking.payments || [];
  if (payments.length === 0) return 'unknown';
  
  const latestPayment = payments[payments.length - 1];
  return latestPayment.paymentMethod?.toLowerCase() || 'unknown';
};

// Helper function to get latest transaction ID
const getLatestTransactionId = (booking) => {
  const payments = booking.payments || [];
  if (payments.length === 0) return null;
  
  const latestPayment = payments[payments.length - 1];
  return latestPayment.paymentReference?.transactionId || 
         latestPayment.paymentReference?.razorpayPaymentId || 
         null;
};

// Helper function to get offline collections
const getOfflineCollections = (booking) => {
  const payments = booking.payments || [];
  return payments
    .filter(payment => payment.paymentMethod === 'Manual' || payment.paymentType === 'Cash')
    .map(payment => ({
      description: `${payment.paymentType} payment`,
      amount: payment.amount,
      collectedBy: payment.collectedBy?.name || 'Staff',
      date: payment.paymentDate
    }));
};

// Format refund data for frontend display
export const formatRefundForDisplay = (refund) => {
  if (!refund) return null;

  return {
    id: refund._id,
    refundId: refund.refundId,
    amount: refund.finalRefundAmount,
    reason: refund.reason,
    status: refund.status,
    processedAt: refund.processedAt,
    completedAt: refund.completedAt,
    estimatedCompletionDate: refund.estimatedCompletionDate,
    estimatedDays: refund.estimatedDays,
    refundMethod: refund.refundMethod,
    actualCompletionDate: refund.completedAt
  };
};

export default vehicleAPI;