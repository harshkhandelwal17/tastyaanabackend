import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { getAuthToken } from '../../../src/api/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create base query with auth headers
const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers) => {
    const token = getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

export const sellerApi = createApi({
  reducerPath: 'sellerApi',
  baseQuery,
  tagTypes: ['SellerSubscriptions', 'SellerSubscriptionStats'],
  endpoints: (builder) => ({
    // Get seller's subscriptions with pagination
    getSellerSubscriptions: builder.query({
      query: ({ page = 1, limit = 100, status, search, sortBy, sortOrder = 'desc' }) => ({
        url: '/v2/seller/subscriptions',
        params: { page, limit, status, search, sortBy, sort: sortOrder },
      }),
      providesTags: (result = [], error, arg) => [
        'SellerSubscriptions',
        ...(result?.data?.map(({ _id }) => ({ type: 'SellerSubscriptions', id: _id })) || []),
      ],
      transformResponse: (response) => ({
        subscriptions: response.data,
        total: response.total,
        page: response.page,
        pages: response.pages,
      }),
    }),

    // Get seller subscription statistics
    getSellerSubscriptionStats: builder.query({
      query: () => '/v2/seller/subscriptions/stats',
      providesTags: ['SellerSubscriptionStats'],
      transformResponse: (response) => ({
        total: response.data?.total || 0,
        active: response.data?.active || 0,
        paused: response.data?.paused || 0,
        cancelled: response.data?.cancelled || 0,
      }),
    }),

    // Get subscription by ID (seller view)
    getSellerSubscription: builder.query({
      query: (subscriptionId) => ({
        url: `/v2/seller/subscriptions/${subscriptionId}`,
      }),
      providesTags: (result, error, id) => [{ type: 'SellerSubscriptions', id }],
    }),

    // Update subscription (seller action)
    updateSellerSubscription: builder.mutation({
      query: ({ subscriptionId, ...updates }) => ({
        url: `/v2/seller/subscriptions/${subscriptionId}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (result, error, { subscriptionId }) => [
        { type: 'SellerSubscriptions', id: subscriptionId },
        'SellerSubscriptionStats',
      ],
    }),

    // Get upcoming deliveries
    getUpcomingDeliveries: builder.query({
      query: ({ days = 7 } = {}) => ({
        url: '/v2/seller/subscriptions/deliveries/upcoming',
        params: { days },
      }),
      providesTags: ['UpcomingDeliveries'],
    }),

    // Get delivery history
    getDeliveryHistory: builder.query({
      query: ({ page = 1, limit = 10, startDate, endDate } = {}) => ({
        url: '/v2/seller/subscriptions/deliveries/history',
        params: { page, limit, startDate, endDate },
      }),
      providesTags: ['DeliveryHistory'],
      transformResponse: (response) => ({
        deliveries: response.data,
        total: response.total,
        page: response.page,
        pages: response.pages,
      }),
    }),
  }),
});

export const {
  useGetSellerSubscriptionsQuery,
  useGetSellerSubscriptionStatsQuery,
  useGetSellerSubscriptionQuery,
  useUpdateSellerSubscriptionMutation,
  useGetUpcomingDeliveriesQuery,
  useGetDeliveryHistoryQuery,
} = sellerApi;
