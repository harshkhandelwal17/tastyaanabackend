import { baseApi } from './baseApi';

export const sellerAnalyticsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Main analytics dashboard
    getSellerAnalytics: builder.query({
      query: (params = {}) => ({
        url: '/seller/analytics/dashboard',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Detailed order analytics
    getOrderAnalytics: builder.query({
      query: (params = {}) => ({
        url: '/seller/analytics/orders',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Subscription analytics
    getSubscriptionAnalytics: builder.query({
      query: (params = {}) => ({
        url: '/seller/analytics/subscriptions',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Financial summary
    getFinancialSummary: builder.query({
      query: (params = {}) => ({
        url: '/seller/analytics/financial',
        params,
      }),
      providesTags: ['Analytics'],
    }),
  }),
});

export const {
  useGetSellerAnalyticsQuery,
  useGetOrderAnalyticsQuery,
  useGetSubscriptionAnalyticsQuery,
  useGetFinancialSummaryQuery,
} = sellerAnalyticsApi;
