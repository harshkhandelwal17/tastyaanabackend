// src/redux/api/laundryApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Base query configuration matching the existing pattern
const rawBaseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const trimmedBaseUrl = typeof rawBaseUrl === 'string' ? rawBaseUrl.replace(/\/$/, '') : '';
const normalizedBaseUrl = trimmedBaseUrl.endsWith('/api') ? trimmedBaseUrl : `${trimmedBaseUrl}/api`;

const baseQuery = fetchBaseQuery({
  baseUrl: `${normalizedBaseUrl}/laundry`,
  prepareHeaders: (headers, { getState }) => {
    const token = getState()?.auth?.token || localStorage.getItem('token');
    console.log('Laundry API Token:', token ? 'Present' : 'Not found');
    
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

// Custom base query with retry logic
const baseQueryWithRetry = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  // If the first request fails, retry once
  if (result.error && (result.error.status === 'FETCH_ERROR' || result.error.status === 'TIMEOUT_ERROR')) {
    console.log('🔄 Laundry API: First request failed, retrying...', result.error);
    
    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Retry the request
    result = await baseQuery(args, api, extraOptions);
    
    if (result.error) {
      console.log('❌ Laundry API: Retry also failed:', result.error);
    } else {
      console.log('✅ Laundry API: Retry successful');
    }
  }
  
  return result;
};

export const laundryApi = createApi({
  reducerPath: 'laundryApi',
  baseQuery: baseQueryWithRetry,
  tagTypes: ['LaundryOrder', 'LaundrySubscription', 'LaundryService', 'LaundryPlan'],
  
  endpoints: (builder) => ({
    // Public endpoints
    // Note: Services come from vendors, not a static list
    // This endpoint may not exist - use vendor-specific services instead
    getServices: builder.query({
      query: () => '/services',
      providesTags: ['LaundryService'],
      transformResponse: (response) => response.services || [],
      // No fallback data - all data must come from backend
      async queryFn(arg, queryApi, extraOptions, baseQuery) {
        const result = await baseQuery('/services');
        
        // If API call fails, return empty array
        if (result.error) {
          console.warn('⚠️ Laundry services endpoint not available. Use vendor-specific services instead.');
          return { data: [] };
        }
        
        // Return data from backend
        return { data: result.data?.services || [] };
      },
    }),

    // Note: Plans come from vendors, not a static list
    // Use vendor-specific plans instead
    getPlans: builder.query({
      query: () => '/plans',
      providesTags: ['LaundryPlan'],
      transformResponse: (response) => response.plans || [],
      // No fallback data - all data must come from backend
      async queryFn(arg, queryApi, extraOptions, baseQuery) {
        const result = await baseQuery('/plans');
        
        // If API call fails, return empty array
        if (result.error) {
          console.warn('⚠️ Laundry plans endpoint not available. Use vendor-specific plans instead.');
          return { data: [] };
        }
        
        // Return data from backend
        return { data: result.data?.plans || [] };
      },
    }),

    // Order tracking (public endpoint)
    trackOrder: builder.query({
      query: (orderId) => `/orders/${orderId}/track`,
      providesTags: (result, error, orderId) => [{ type: 'LaundryOrder', id: orderId }],
      transformResponse: (response) => response.data || null,
    }),

    // Protected endpoints - Orders
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: '/orders',
        method: 'POST',
        body: orderData,
      }),
      invalidatesTags: ['LaundryOrder'],
      transformResponse: (response) => response,
      transformErrorResponse: (response) => ({
        status: response.status,
        message: response.data?.message || 'Failed to create order',
      }),
    }),

    getUserOrders: builder.query({
      query: ({ page = 1, limit = 20, status } = {}) => ({
        url: '/orders',
        params: { page, limit, ...(status && { status }) },
      }),
      providesTags: ['LaundryOrder'],
      transformResponse: (response) => ({
        orders: response.orders || [],
        total: response.total || 0,
        page: response.page || 1,
        totalPages: response.totalPages || 1,
      }),
    }),

    getOrderDetails: builder.query({
      query: (orderId) => `/orders/${orderId}`,
      providesTags: (result, error, orderId) => [{ type: 'LaundryOrder', id: orderId }],
      transformResponse: (response) => response.data || null,
    }),

    // Subscriptions
    createSubscription: builder.mutation({
      query: (subscriptionData) => ({
        url: '/subscription',
        method: 'POST',
        body: subscriptionData,
      }),
      invalidatesTags: ['LaundrySubscription'],
      transformResponse: (response) => response,
      transformErrorResponse: (response) => ({
        status: response.status,
        message: response.data?.message || 'Failed to create subscription',
      }),
    }),

    getUserSubscriptions: builder.query({
      query: () => '/subscriptions',
      providesTags: ['LaundrySubscription'],
      transformResponse: (response) => response.subscriptions || [],
    }),

    // Admin endpoints
    getAdminOrders: builder.query({
      query: ({ status, page = 1, limit = 20 } = {}) => ({
        url: '/admin/orders',
        params: { ...(status && { status }), page, limit },
      }),
      providesTags: ['LaundryOrder'],
      transformResponse: (response) => ({
        orders: response.orders || [],
        total: response.total || 0,
        page: response.page || 1,
        totalPages: response.totalPages || 1,
      }),
    }),

    updateOrderStatus: builder.mutation({
      query: ({ orderId, status, stage }) => ({
        url: `/orders/${orderId}/status`,
        method: 'PATCH',
        body: { status, stage },
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'LaundryOrder', id: orderId },
        'LaundryOrder',
      ],
      transformResponse: (response) => response,
    }),

    getLaundryAnalytics: builder.query({
      query: () => '/admin/analytics',
      providesTags: ['LaundryOrder', 'LaundrySubscription'],
      transformResponse: (response) => response.analytics || {},
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  // Services and Plans
  useGetServicesQuery,
  useGetPlansQuery,
  
  // Order Management
  useCreateOrderMutation,
  useGetUserOrdersQuery,
  useGetOrderDetailsQuery,
  useTrackOrderQuery,
  
  // Subscriptions
  useCreateSubscriptionMutation,
  useGetUserSubscriptionsQuery,
  
  // Admin endpoints
  useGetAdminOrdersQuery,
  useUpdateOrderStatusMutation,
  useGetLaundryAnalyticsQuery,
  
  // Utility
  util: { getRunningQueriesThunk },
} = laundryApi;

// Export the reducer and middleware
export default laundryApi;
