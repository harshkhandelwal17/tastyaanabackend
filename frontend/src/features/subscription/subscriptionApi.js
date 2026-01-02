import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const subscriptionApi = createApi({
  reducerPath: 'subscriptionApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/admin/subscriptions`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      console.log("logging token : ", token);
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Subscription'],
  endpoints: (builder) => ({
    // Get all subscriptions with filtering and pagination
    getSubscriptions: builder.query({
      query: ({ page = 1, limit = 10, status, search } = {}) => {
        const params = new URLSearchParams();
        if (page) params.append('page', page);
        if (limit) params.append('limit', limit);
        if (status) params.append('status', status);
        if (search) params.append('search', search);
        
        return { url: `?${params.toString()}` };
      },
      providesTags: (result = []) => [
        'Subscription',
        // ...result.map(({ _id }) => ({ type: 'Subscription', id: _id })),
      ],
    }),

    // Get single subscription by ID
    getSubscription: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Subscription', id }],
    }),

    // Create new subscription
    createSubscription: builder.mutation({
      query: (subscriptionData) => ({
        url: '/',
        method: 'POST',
        body: subscriptionData,
      }),
      invalidatesTags: ['Subscription'],
    }),

    // Update subscription
    updateSubscription: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Subscription', id }],
    }),

    // Delete subscription
    deleteSubscription: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Subscription', id }],
    }),

    // Pause subscription
    pauseSubscription: builder.mutation({
      query: ({ id, startDate, endDate, reason }) => ({
        url: `/${id}/pause`,
        method: 'POST',
        body: { startDate, endDate, reason },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Subscription', id }],
    }),

    // Resume subscription
    resumeSubscription: builder.mutation({
      query: (id) => ({
        url: `/${id}/resume`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Subscription', id }],
    }),

    // Get subscription statistics
    getSubscriptionStats: builder.query({
      query: () => '/stats/overview',
      providesTags: ['Subscription'],
    }),
  }),
});

export const {
  useGetSubscriptionsQuery,
  useGetSubscriptionQuery,
  useCreateSubscriptionMutation,
  useUpdateSubscriptionMutation,
  useDeleteSubscriptionMutation,
  usePauseSubscriptionMutation,
  useResumeSubscriptionMutation,
  useGetSubscriptionStatsQuery,
} = subscriptionApi;

export default subscriptionApi;
