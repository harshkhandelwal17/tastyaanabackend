// src/redux/api/vehicleApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Normalize base URL and ensure it ends with "/api"
const rawBaseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const trimmedBaseUrl = typeof rawBaseUrl === 'string' ? rawBaseUrl.replace(/\/$/, '') : '';
const normalizedBaseUrl = trimmedBaseUrl.endsWith('/api') ? trimmedBaseUrl : `${trimmedBaseUrl}/api`;
console.log("🚗 Vehicle API Base URL:", normalizedBaseUrl);
const baseQuery = fetchBaseQuery({
  baseUrl: normalizedBaseUrl,
  prepareHeaders: (headers, { getState, endpoint }) => {
    // Get token from auth state
    const token = getState()?.auth?.token || localStorage.getItem('token');

    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }

    // Set JSON content type for all endpoints EXCEPT upload
    // For file uploads, we let the browser set the Content-Type with boundary
    if (endpoint !== 'uploadImage' && endpoint !== 'uploadBookingDocuments') {
      headers.set('Content-Type', 'application/json');
    }
    return headers;
  },
});

// Custom base query with retry logic
const baseQueryWithRetry = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // If the first request fails, retry once
  if (result.error && (result.error.status === 'FETCH_ERROR' || result.error.status === 'TIMEOUT_ERROR')) {
    console.log('🔄 Vehicle API request failed, retrying...', result.error);

    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Retry the request
    result = await baseQuery(args, api, extraOptions);

    if (result.error) {
      console.log('❌ Vehicle API retry also failed:', result.error);
    } else {
      console.log('✅ Vehicle API retry successful');
    }
  }

  return result;
};

export const vehicleApi = createApi({
  reducerPath: 'vehicleApi',
  baseQuery: baseQueryWithRetry,
  tagTypes: [
    'Vehicle',
    'VehicleBooking',
    'Zone',
    'Availability',
    'UserBookings',
    'BookingHistory'
  ],
  endpoints: (builder) => ({

    // ===== PUBLIC VEHICLE ENDPOINTS =====

    /**
     * Get public vehicles list with filtering and pagination
     */
    getPublicVehicles: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams({
          page: params.page || 1,
          limit: params.limit || 12,
          sortBy: params.sortBy || 'createdAt',
          sortOrder: params.sortOrder || 'desc',
          status: 'active',
          availability: 'available',
          ...(params.category && { category: params.category }),
          ...(params.type && { type: params.type }),
          ...(params.zoneCode && { zoneCode: params.zoneCode }),
          ...(params.search && { search: params.search }),
        });

        return `/vehicles/public?${searchParams}`;
      },
      providesTags: (result) => [
        { type: 'Vehicle', id: 'PUBLIC_LIST' },
        ...(result?.data || []).map(vehicle => ({ type: 'Vehicle', id: vehicle._id }))
      ],
    }),

    /**
     * Get single vehicle details (public)
     */
    getPublicVehicleById: builder.query({
      query: (vehicleId) => `/vehicles/public/${vehicleId}`,
      providesTags: (result, error, vehicleId) => [
        { type: 'Vehicle', id: vehicleId },
        { type: 'Vehicle', id: 'DETAIL' }
      ],
    }),

    /**
     * Check vehicle availability
     */
    checkVehicleAvailability: builder.mutation({
      query: (data) => ({
        url: '/vehicles/check-availability',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { vehicleId }) => [
        { type: 'Availability', id: vehicleId }
      ],
    }),

    // ===== ZONES ENDPOINTS =====

    /**
     * Get public zones list
     */
    getPublicZones: builder.query({
      query: () => '/zones/public',
      providesTags: [{ type: 'Zone', id: 'PUBLIC_LIST' }],
    }),

    // ===== VEHICLE BOOKING ENDPOINTS =====

    /**
     * Create a new vehicle booking
     */
    createVehicleBooking: builder.mutation({
      query: (bookingData) => ({
        url: '/vehicles/bookings',
        method: 'POST',
        body: bookingData,
      }),
      invalidatesTags: [
        { type: 'VehicleBooking', id: 'LIST' },
        { type: 'UserBookings', id: 'LIST' },
        { type: 'Vehicle', id: 'PUBLIC_LIST' }
      ],
    }),

    /**
     * Get user's vehicle bookings
     */
    getUserVehicleBookings: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams({
          page: params.page || 1,
          limit: params.limit || 10,
          ...(params.status && { status: params.status }),
          ...(params.sortBy && { sortBy: params.sortBy }),
        });

        const url = `/vehicles/bookings/my-bookings?${searchParams}`;
        console.log("🚗 getUserVehicleBookings API URL:", url);
        console.log("🚗 Base URL:", normalizedBaseUrl);
        console.log("🚗 Full URL will be:", `${normalizedBaseUrl}${url}`);
        return url;
      },
      providesTags: [{ type: 'UserBookings', id: 'LIST' }],
    }),

    /**
     * Get single booking details
     */
    getVehicleBookingById: builder.query({
      query: (bookingId) => `/vehicles/bookings/${bookingId}`,
      providesTags: (result, error, bookingId) => [
        { type: 'VehicleBooking', id: bookingId }
      ],
    }),

    /**
     * Update booking status
     */
    updateVehicleBookingStatus: builder.mutation({
      query: ({ bookingId, status, notes }) => ({
        url: `/vehicles/bookings/${bookingId}/status`,
        method: 'PUT',
        body: { status, notes },
      }),
      invalidatesTags: (result, error, { bookingId }) => [
        { type: 'VehicleBooking', id: bookingId },
        { type: 'UserBookings', id: 'LIST' },
      ],
    }),

    // ===== PAYMENT ENDPOINTS =====

    /**
     * Create Razorpay payment order
     */
    createVehiclePaymentOrder: builder.mutation({
      query: (orderData) => ({
        url: '/vehicles/bookings/payment/create-order',
        method: 'POST',
        body: orderData,
      }),
    }),

    /**
     * Verify Razorpay payment
     */
    verifyVehiclePayment: builder.mutation({
      query: (paymentData) => ({
        url: '/vehicles/bookings/payment/verify',
        method: 'POST',
        body: paymentData,
      }),
      invalidatesTags: (result, error, { bookingId }) => [
        { type: 'VehicleBooking', id: bookingId },
        { type: 'UserBookings', id: 'LIST' },
      ],
    }),

    /**
     * Process refund
     */
    processVehicleRefund: builder.mutation({
      query: ({ bookingId, refundData }) => ({
        url: `/vehicles/bookings/${bookingId}/refund`,
        method: 'POST',
        body: refundData,
      }),
      invalidatesTags: (result, error, { bookingId }) => [
        { type: 'VehicleBooking', id: bookingId },
        { type: 'UserBookings', id: 'LIST' },
      ],
    }),

    // ===== ADMIN VEHICLE ENDPOINTS (for authenticated users) =====

    /**
     * Get all vehicles (admin/seller view)
     */
    getVehicles: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams({
          page: params.page || 1,
          limit: params.limit || 10,
          ...(params.sellerId && { sellerId: params.sellerId }),
          ...(params.status && { status: params.status }),
          ...(params.category && { category: params.category }),
          ...(params.search && { search: params.search }),
        });

        return `/vehicles?${searchParams}`;
      },
      providesTags: [{ type: 'Vehicle', id: 'ADMIN_LIST' }],
    }),

    /**
     * Get vehicle by ID (admin/seller view)
     */
    getVehicleById: builder.query({
      query: (vehicleId) => `/vehicles/${vehicleId}`,
      providesTags: (result, error, vehicleId) => [
        { type: 'Vehicle', id: vehicleId }
      ],
    }),

    /**
     * Create new vehicle
     */
    createVehicle: builder.mutation({
      query: (vehicleData) => ({
        url: '/vehicles',
        method: 'POST',
        body: vehicleData,
      }),
      invalidatesTags: [
        { type: 'Vehicle', id: 'ADMIN_LIST' },
        { type: 'Vehicle', id: 'PUBLIC_LIST' }
      ],
    }),

    /**
     * Update vehicle
     */
    updateVehicle: builder.mutation({
      query: ({ vehicleId, vehicleData }) => ({
        url: `/vehicles/${vehicleId}`,
        method: 'PUT',
        body: vehicleData,
      }),
      invalidatesTags: (result, error, { vehicleId }) => [
        { type: 'Vehicle', id: vehicleId },
        { type: 'Vehicle', id: 'ADMIN_LIST' },
        { type: 'Vehicle', id: 'PUBLIC_LIST' }
      ],
    }),

    /**
     * Delete vehicle
     */
    deleteVehicle: builder.mutation({
      query: (vehicleId) => ({
        url: `/vehicles/${vehicleId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        { type: 'Vehicle', id: 'ADMIN_LIST' },
        { type: 'Vehicle', id: 'PUBLIC_LIST' }
      ],
    }),

    /**
     * Get vehicle analytics
     */
    getVehicleAnalytics: builder.query({
      query: (vehicleId) => `/vehicles/${vehicleId}/analytics`,
      providesTags: (result, error, vehicleId) => [
        { type: 'Vehicle', id: `${vehicleId}_ANALYTICS` }
      ],
    }),

    /**
     * Get all bookings (admin view)
     */
    getAllVehicleBookings: builder.query({
      query: (params = {}) => {
        const searchParams = new URLSearchParams({
          page: params.page || 1,
          limit: params.limit || 10,
          ...(params.status && { status: params.status }),
          ...(params.vehicleId && { vehicleId: params.vehicleId }),
          ...(params.sortBy && { sortBy: params.sortBy }),
        });

        return `/vehicles/bookings/all?${searchParams}`;
      },
      providesTags: [{ type: 'VehicleBooking', id: 'ADMIN_LIST' }],
    }),

    // ===== UPLOAD ENDPOINTS =====

    /**
     * Upload an image
     */
    uploadImage: builder.mutation({
      query: (formData) => ({
        url: '/upload/image',
        method: 'POST',
        body: formData,
      }),
    }),

    /**
     * Upload booking documents
     */
    uploadBookingDocuments: builder.mutation({
      query: (formData) => ({
        url: '/vehicles/bookings/documents/upload',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: (result, error, { bookingId }) => [
        { type: 'VehicleBooking', id: bookingId }
      ],
    }),

    // ===== EXTENSION ENDPOINTS =====

    /**
     * Request extension (User requests more time)
     */
    requestExtension: builder.mutation({
      query: ({ bookingId, newEndDateTime }) => ({
        url: `/vehicles/bookings/${bookingId}/request-extension`,
        method: 'POST',
        body: { newEndDateTime },
      }),
      invalidatesTags: (result, error, { bookingId }) => [
        { type: 'VehicleBooking', id: bookingId }
      ],
    }),

    /**
     * Respond to extension (Seller approves/rejects)
     */
    respondToExtension: builder.mutation({
      query: ({ bookingId, requestId, action, rejectionReason }) => ({
        url: `/vehicles/bookings/${bookingId}/respond-extension`,
        method: 'POST',
        body: { requestId, action, rejectionReason },
      }),
      invalidatesTags: (result, error, { bookingId }) => [
        { type: 'VehicleBooking', id: bookingId }
      ],
    }),

    /**
     * Verify extension payment
     */
    verifyExtensionPayment: builder.mutation({
      query: ({ bookingId, requestId, razorpay_order_id, razorpay_payment_id, razorpay_signature }) => ({
        url: `/vehicles/bookings/${bookingId}/verify-extension-payment`,
        method: 'POST',
        body: { requestId, razorpay_order_id, razorpay_payment_id, razorpay_signature },
      }),
      invalidatesTags: (result, error, { bookingId }) => [
        { type: 'VehicleBooking', id: bookingId },
        { type: 'UserBookings', id: 'LIST' }
      ],
    }),

    /**
     * Recalculate bill on drop
     */
    recalculateBillOnDrop: builder.mutation({
      query: ({ bookingId, actualEndTime, actualKmReading }) => ({
        url: `/vehicles/bookings/${bookingId}/recalculate-on-drop`,
        method: 'POST',
        body: { actualEndTime, actualKmReading },
      }),
      invalidatesTags: (result, error, { bookingId }) => [
        { type: 'VehicleBooking', id: bookingId }
      ],
    }),

    /**
     * Get pending extensions for seller
     */
    getPendingExtensions: builder.query({
      query: () => '/vehicles/extensions/pending',
      providesTags: [{ type: 'VehicleBooking', id: 'EXTENSIONS' }],
    }),

    /**
     * Approve or deny booking
     */
    approveBooking: builder.mutation({
      query: ({ bookingId, action, reason }) => ({
        url: `/vehicles/bookings/${bookingId}/approval`,
        method: 'PUT',
        body: { action, reason },
      }),
      invalidatesTags: (result, error, { bookingId }) => [
        { type: 'VehicleBooking', id: bookingId },
        { type: 'VehicleBooking', id: 'LIST' }
      ],
    }),

  }),
});

// Export hooks for usage in functional components
export const {
  // Public vehicle queries
  useGetPublicVehiclesQuery,
  useGetPublicVehicleByIdQuery,
  useCheckVehicleAvailabilityMutation,

  // Zones queries
  useGetPublicZonesQuery,

  // Booking mutations and queries
  useCreateVehicleBookingMutation,
  useGetUserVehicleBookingsQuery,
  useGetVehicleBookingByIdQuery,
  useUpdateVehicleBookingStatusMutation,

  // Payment mutations
  useCreateVehiclePaymentOrderMutation,
  useVerifyVehiclePaymentMutation,
  useProcessVehicleRefundMutation,

  // Admin/Seller queries and mutations
  useGetVehiclesQuery,
  useGetVehicleByIdQuery,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
  useGetVehicleAnalyticsQuery,
  useGetAllVehicleBookingsQuery,

  // Lazy queries for conditional loading
  useLazyGetPublicVehiclesQuery,
  useLazyGetPublicVehicleByIdQuery,
  useLazyGetUserVehicleBookingsQuery,

  // Upload
  useUploadImageMutation,
  useUploadBookingDocumentsMutation,

  // Extension hooks
  useRequestExtensionMutation,
  useRespondToExtensionMutation,
  useVerifyExtensionPaymentMutation,
  useRecalculateBillOnDropMutation,
  useGetPendingExtensionsQuery,

  // Approval hooks
  useApproveBookingMutation,
} = vehicleApi;