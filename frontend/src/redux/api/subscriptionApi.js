import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const subscriptionApi = createApi({
  reducerPath: 'subscriptionApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: '/api',
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token || localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Subscription', 'Customization'],
  endpoints: (builder) => ({
    // Fetch plan details (with add-ons, extras, replacements)
    getPlanDetails: builder.query({
      query: (planId) => `/meal-plan/${planId}`,
      providesTags: ['Plan'], 
    }),
    
    // Get replaceable thalis for a plan
    getReplaceableThalis: builder.query({
      query: (planId) => `/meal-plan/${planId}/replaceable-thalis`,
      providesTags: ['ReplaceableThalis'],
    }),
    // Create a new subscription
    createSubscription: builder.mutation({
      query: (body) => ({
        url: '/subscriptions',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Subscription', 'User'],
    }),
    // Get all subscriptions for user
    getUserSubscriptions: builder.query({
      query: () => '/subscriptions/user',
      providesTags: ['Subscription'],
    }),
    // Get details of a specific subscription (with today’s meal, etc.)
    getSubscriptionDetails: builder.query({
      query: (subscriptionId) => `/subscriptions/${subscriptionId}`,
      providesTags: (result, error, id) => [{ type: 'Subscription', id }],
    }),
    // Customize meal for a subscription
    customizeMeal: builder.mutation({
      query: ({ subscriptionId, customizationData }) => ({
        url: `/customizations`,
        method: 'POST',
        body: { subscriptionId, ...customizationData },
      }),
      invalidatesTags: ['Subscription'],
    }),
    // Skip meal for a subscription
    skipMeal: builder.mutation({
      query: ({ subscriptionId, ...skipData }) => ({
        url: `/subscriptions/${subscriptionId}/skip-meal`,
        method: 'POST',
        body: skipData,
      }),
      invalidatesTags: ['Subscription'],
    }),
    // Process payment for extra charges
    processCustomizationPayment: builder.mutation({
      query: ({ subscriptionId, paymentData }) => ({
        url: `/subscriptions/${subscriptionId}/customization-payment`,
        method: 'POST',
        body: paymentData,
      }),
      invalidatesTags: ['Subscription'],
    }),
    
    // Replace thali for a subscription
    replaceThali: builder.mutation({
      query: ({ subscriptionId, replacementData }) => ({
        url: `/subscriptions/${subscriptionId}/replace-thali`,
        method: 'POST',
        body: replacementData,
      }),
      invalidatesTags: ['Subscription'],
    }),
    
    // Cancel a subscription
    cancelSubscription: builder.mutation({
      query: (subscriptionId) => ({
        url: `/subscriptions/${subscriptionId}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, subscriptionId) => [
        { type: 'Subscription', id: subscriptionId },
      ],
    }),
    // Pause a subscription
    pauseSubscription: builder.mutation({
      query: (subscriptionId) => ({
        url: `/subscriptions/${subscriptionId}/pause`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, subscriptionId) => [
        { type: 'Subscription', id: subscriptionId },
      ],
    }),
    // Resume a subscription
    resumeSubscription: builder.mutation({
      query: (subscriptionId) => ({
        url: `/subscriptions/${subscriptionId}/resume`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, subscriptionId) => [
        { type: 'Subscription', id: subscriptionId },
      ],
    }),
    
    // New customization endpoints
    createCustomization: builder.mutation({
      query: (customizationData) => ({
        url: '/customizations',
        method: 'POST',
        body: customizationData,
      }),
      invalidatesTags: ['Customization', 'Subscription'],
    }),
    
    getCustomizations: builder.query({
      query: (subscriptionId) => `/customizations/subscriptions/${subscriptionId}/customizations`,
      providesTags: ['Customization'],
    }),
    
    createCustomizationPayment: builder.mutation({
      query: (customizationId) => ({
        url: `/customizations/${customizationId}/payment`,
        method: 'POST',
      }),
      invalidatesTags: ['Customization'],
    }),
    
    verifyCustomizationPayment: builder.mutation({
      query: ({ customizationId, paymentData }) => ({
        url: `/customizations/${customizationId}/verify-payment`,
        method: 'POST',
        body: paymentData,
      }),
      invalidatesTags: ['Customization', 'Subscription'],
    }),
  }),
});

export const {
  useGetPlanDetailsQuery,
  useGetReplaceableThalisQuery,
  useCreateSubscriptionMutation,
  useGetUserSubscriptionsQuery,
  useGetSubscriptionDetailsQuery,
  useCustomizeMealMutation,
  useSkipMealMutation,
  useProcessCustomizationPaymentMutation,
  useReplaceThaliMutation,
  useCancelSubscriptionMutation,
  usePauseSubscriptionMutation,
  useResumeSubscriptionMutation,
  useCreateCustomizationMutation,
  useGetCustomizationsQuery,
  useCreateCustomizationPaymentMutation,
  useVerifyCustomizationPaymentMutation,
} = subscriptionApi;

// Add default export to ensure proper module loading
export default subscriptionApi;
