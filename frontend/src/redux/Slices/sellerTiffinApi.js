import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const sellerTiffinApi = createApi({
  reducerPath: 'sellerTiffinApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/seller/tiffin`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['SellerDashboard', 'TiffinList', 'Penalties', 'Analytics'],
  endpoints: (builder) => ({
    // Dashboard endpoints
    getSellerDashboard: builder.query({
      query: () => '/dashboard',
      providesTags: ['SellerDashboard'],
    }),

    // Main seller dashboard (real data)
    getMainSellerDashboard: builder.query({
      query: () => ({
        url: '/dashboard',
        baseUrl: '/api/seller', // Override baseUrl for this endpoint
      }),
      providesTags: ['SellerDashboard'],
    }),

    // Tiffin management endpoints
    getTodayTiffinList: builder.query({
      query: (shift) => `/today/${shift}`,
      providesTags: (result, error, shift) => [
        { type: 'TiffinList', id: shift },
        'TiffinList',
      ],
    }),

    updateTiffinStatus: builder.mutation({
      query: ({ orderId, status, notes }) => ({
        url: `/${orderId}/status`,
        method: 'PUT',
        body: { status, notes },
      }),
      invalidatesTags: (result, error, { orderId }) => [
        'TiffinList',
        'SellerDashboard',
        { type: 'TiffinList', id: 'morning' },
        { type: 'TiffinList', id: 'evening' },
      ],
    }),

    bulkAssignTiffins: builder.mutation({
      query: ({ shift, driverId }) => ({
        url: `/bulk-assign/${shift}`,
        method: 'POST',
        body: { driverId },
      }),
      invalidatesTags: (result, error, { shift }) => [
        'TiffinList',
        'SellerDashboard',
        { type: 'TiffinList', id: shift },
      ],
    }),

    getAvailableDrivers: builder.query({
      query: () => '/available-drivers',
    }),

    // Penalty endpoints
    getPenalties: builder.query({
      query: ({ page = 1, limit = 20 } = {}) => ({
        url: '/penalties',
        params: { page, limit },
      }),
      providesTags: ['Penalties'],
    }),

    // Normal order status update
    updateNormalOrderStatus: builder.mutation({
      query: ({ orderId, status, notes }) => ({
        url: `/normal-order/${orderId}/status`,
        method: 'PUT',
        body: { status, notes },
      }),
      invalidatesTags: ['SellerDashboard', 'Penalties'],
    }),

    // Analytics endpoints
    getNormalOrdersAnalytics: builder.query({
      query: ({ period = 'daily' } = {}) => ({
        url: '/analytics/normal-orders',
        params: { period },
      }),
      providesTags: (result, error, { period }) => [
        { type: 'Analytics', id: `normal-${period}` },
        'Analytics',
      ],
    }),

    getSubscriptionAnalytics: builder.query({
      query: ({ period = 'daily', startDate, endDate } = {}) => ({
        url: '/analytics/subscriptions',
        params: { period, startDate, endDate },
      }),
      providesTags: (result, error, { period, startDate, endDate }) => [
        { type: 'Analytics', id: `subscriptions-${period}-${startDate}-${endDate}` },
        'Analytics',
      ],
    }),
  }),
});

export const {
  // Dashboard
  useGetSellerDashboardQuery,
  useGetMainSellerDashboardQuery,

  // Tiffin management
  useGetTodayTiffinListQuery,
  useUpdateTiffinStatusMutation,
  useBulkAssignTiffinsMutation,
  useGetAvailableDriversQuery,

  // Penalties
  useGetPenaltiesQuery,

  // Orders
  useUpdateNormalOrderStatusMutation,

  // Analytics
  useGetNormalOrdersAnalyticsQuery,
  useGetSubscriptionAnalyticsQuery,
} = sellerTiffinApi;