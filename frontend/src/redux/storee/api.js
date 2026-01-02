// src/store/api.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Normalize base URL and ensure it ends with "/api"
const rawBaseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const trimmedBaseUrl = typeof rawBaseUrl === 'string' ? rawBaseUrl.replace(/\/$/, '') : '';
const normalizedBaseUrl = trimmedBaseUrl.endsWith('/api') ? trimmedBaseUrl : `${trimmedBaseUrl}/api`;

// Custom base query with retry logic for mobile
const baseQueryWithRetry = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  // If the first request fails, retry once
  if (result.error && (result.error.status === 'FETCH_ERROR' || result.error.status === 'TIMEOUT_ERROR')) {
    console.log('🔄 First request failed, retrying...', result.error);
    
    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Retry the request
    result = await baseQuery(args, api, extraOptions);
    
    if (result.error) {
      console.log('❌ Retry also failed:', result.error);
    } else {
      console.log('✅ Retry successful');
    }
  }
  
  return result;
};

const baseQuery = fetchBaseQuery({
  baseUrl: normalizedBaseUrl,
  prepareHeaders: (headers, { getState }) => {
    // Try to get token from Redux state first
    const state = getState();
    let token = state?.auth?.token;
    
    // Fallback to localStorage if not in Redux state
    if (!token) {
      token = localStorage.getItem('token');
    }
    
    console.log('Token for API:', token ? 'Present' : 'Not found');
    
    if (token) {
      // Set both lowercase and capitalized versions for compatibility
      headers.set('authorization', `Bearer ${token}`);
      headers.set('Authorization', `Bearer ${token}`);
    } else {
      console.warn('⚠️ No token found in localStorage or Redux state');
    }
    
    headers.set('Content-Type', 'application/json');
    // Add mobile-specific headers
    headers.set('Accept', 'application/json');
    headers.set('Cache-Control', 'no-cache');
    return headers;
  },
  // Add timeout and retry configuration for mobile
  timeout: 30000, // 30 seconds timeout
});

// Create the API slice
export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithRetry,
  tagTypes: [
    'User', 
    'MealPlan',
    'Subscription',
    'Order', 
    'DailyMeal', 
    'CustomRequest', 
    'Bid', 
    'Review', 
    'Notification',
    'Category', 
    'Product', 
    'Seller',
    'SellerOrder', 
    'SellerProduct', 
    'SellerDashboard', 
    'AddOn', 
    'Wallet',
    'WalletTransactions', 
    'Homepage', 
    'Grocery', 
    'Featured', 
    'Popular', 
    'Search', 
    'Customization',
    'Hisaab', 
    'Sellers', 
    'SubscriptionUsers',
    'DailyMeals',
    'UserMeals',
    'DeliverySlot',
    'DriverDelivery',
    'Delivery',
    'DriverStats',
    'DeliveryRoute',
    'UserSubscription',
    'SubscriptionDetail'
  ],
  endpoints: (builder) => ({
    // Sellers endpoints
    getSellers: builder.query({
      query: () => '/users/sellers',
      providesTags: ['Sellers'],
    }),
    
    // Subscription users endpoints
    getSubscriptionUsers: builder.query({
      query: () => {
        const token = localStorage.getItem('token');
        console.log('Auth token:', token); // Debug log
        return {
          url: '/subscriptions/active-users',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        };
      },
      providesTags: ['SubscriptionUsers'],
    }),
      // Seller endpoints
      getSellers: builder.query({
        query: () => '/users/sellers',
        providesTags: ['Seller']
      }),
      getTodaysHisaab: builder.query({
        query: ({ date, sellerId } = {}) => ({
          url: '/hisaab/today',
          params: { date, sellerId }
        }),
        providesTags: ['Hisaab'],
      }),
    
      getHisaabByDateRange: builder.query({
        query: ({ startDate, endDate }) => ({
          url: '/hisaab/range',
          params: { startDate, endDate },
        }),
        providesTags: ['Hisaab'],
      }),

      createOrUpdateHisaab: builder.mutation({
        query: (data) => ({
          url: '/hisaab/today',
          method: 'POST',
          body: data,
        }),
        invalidatesTags: ['Hisaab'],
      }),
    
      addHisaabProduct: builder.mutation({
        query: (productData) => ({
          url: '/hisaab/today/products',
          method: 'POST',
          body: productData,
        }),
        invalidatesTags: ['Hisaab'],
      }),
    
      updateHisaabProduct: builder.mutation({
        query: ({ id, ...updates }) => ({
          url: `/hisaab/today/products/${id}`,
          method: 'PATCH',
          body: updates,
        }),
        invalidatesTags: ['Hisaab'],
      }),
    
      deleteHisaabProduct: builder.mutation({
        query: (id) => ({
          url: `/hisaab/today/products/${id}`,
          method: 'DELETE',
        }),
        invalidatesTags: ['Hisaab'],
      }),
    
      getHisaabHistory: builder.query({
        query: ({ startDate, endDate }) => ({
          url: '/hisaab/history',
          params: {
            startDate: typeof startDate === 'string' ? startDate : startDate?.toISOString(),
            endDate: typeof endDate === 'string' ? endDate : endDate?.toISOString()
          },
        }),
        providesTags: ['Hisaab'],
      }),
    
      getHisaabByDate: builder.query({
        query: (date) => `/hisaab/${date.toISOString().split('T')[0]}`,
        providesTags: ['Hisaab'],
      }),

      // Menu Change endpoints
      getMenuChangeOptions: builder.query({
        query: (params) => ({
          url: '/menu-change/options',
          params
        })
      }),
    
      requestMenuChange: builder.mutation({
        query: (changeData) => ({
          url: '/menu-change/request',
          method: 'POST',
          body: changeData
        }),
        invalidatesTags: ['Order', 'Subscription']
      }),
    
      processMenuChangePayment: builder.mutation({
        query: ({ id, ...paymentData }) => ({
          url: `/menu-change/${id}/payment`,
          method: 'POST',
          body: paymentData
        }),
        invalidatesTags: ['Order', 'User']
      }),
    
      getUserMenuChanges: builder.query({
        query: (params) => ({
          url: '/menu-change/history',
          params
        })
      }),
    
      cancelMenuChange: builder.mutation({
        query: (id) => ({
          url: `/menu-change/${id}`,
          method: 'DELETE'
        }),
        invalidatesTags: ['Order', 'User']
      }),

      // Auth endpoints
      register: builder.mutation({
        query: (userData) => ({
          url: '/auth/register',
          method: 'POST',
          body: userData
        }),
        invalidatesTags: ['User']
      }),
    
      login: builder.mutation({
        query: (credentials) => ({
          url: '/auth/login',
          method: 'POST',
          body: credentials
        }),
        invalidatesTags: ['User']
      }),
    
      getProfile: builder.query({
        query: () => '/auth/profile',
        providesTags: ['User']
      }),
    
      getUser: builder.query({
        query: (userId) => `/users/profile`,
        providesTags: (result, error, userId) => [{ type: 'User', id: userId }]
      }),

      googleAuth: builder.mutation({
        query: ({ token, role = 'buyer' }) => ({
          url: '/auth/google',
          method: 'POST',
          body: { token, role }
        }),
        invalidatesTags: ['User']
      }),

      unlinkGoogle: builder.mutation({
        query: () => ({
          url: '/auth/google/unlink',
          method: 'DELETE'
        }),
        invalidatesTags: ['User']
      }),

      setPassword: builder.mutation({
        query: (password) => ({
          url: '/auth/set-password',
          method: 'POST',
          body: { password }
        }),
        invalidatesTags: ['User']
      }),

      checkAuthStatus: builder.query({
        query: () => '/auth/profile',
        providesTags: ['User']
      }),
    
      // Meal Plans endpoints
      getMealPlanss: builder.query({
        query: (params) => ({
          url: '/meal-plan',
          params
        }),
        providesTags: ['MealPlan'],
        // Add mobile-specific configurations
        keepUnusedDataFor: 300, // Keep data for 5 minutes
        // Add error handling
        async onQueryStarted(arg, { queryFulfilled }) {
          try {
            await queryFulfilled;
            console.log('✅ Meal plans query successful');
          } catch (error) {
            console.error('❌ Meal plans query failed:', error);
          }
        }
      }),
    
      getMealPlan: builder.query({
        query: (id) => `/meal-plan/${id}`,
        providesTags: (result, error, id) => [{ type: 'MealPlan', id }]
      }),
      getReplaceableThalis: builder.query({
        query: (planId) => `/meal-plan/${planId}/replaceable-thalis`,
        providesTags: ['ReplaceableThalis'],
      }),
      getMealPlanAddOns: builder.query({
        query: (mealPlanId) => `/meal-plan/${mealPlanId}/add-ons`,
        providesTags: (result, error, mealPlanId) => [{ type: 'AddOn', id: mealPlanId }],
        transformResponse: (response) => response.data || []
      }),

      getMealPlanExtraItems: builder.query({
        query: (mealPlanId) => `/meal-plan/${mealPlanId}/extra-items`,
        providesTags: (result, error, mealPlanId) => [{ type: 'MealPlan', id: mealPlanId }],
        transformResponse: (response) => response.data?.extraItems || []
      }),

      getMealPlanReplacements: builder.query({
        query: (mealPlanId) => `/mealplans/${mealPlanId}/replacements`,
        providesTags: (result, error, mealPlanId) => [{ type: 'MealPlan', id: mealPlanId }],
        transformResponse: (response) => response.data?.replacements || []
      }),

      getSkipMealLimit: builder.query({
        query: () => `/mealplans/settings/skip-meal-limit`,
        transformResponse: (response) => response.data?.skipMealLimit ?? 4
      }),

      getMealPlanRatings: builder.query({
        query: ({ mealPlanId, page = 1, limit = 10 }) => ({
          url: `/meal-plan/${mealPlanId}/ratings`,
          params: { page, limit }
        }),
        providesTags: (result, error, { mealPlanId }) => [{ type: 'Review', id: mealPlanId }],
        transformResponse: (response) => ({
          ratings: response.data || [],
          pagination: response.pagination || {},
          average: response.average || 0,
          total: response.total || 0
        })
      }),
    
      // Wallet Management Endpoints
      createWallet: builder.mutation({
        query: () => ({
          url: '/wallet/create',
          method: 'POST',
        }),
        invalidatesTags: ['Wallet'],
      }),
      getSkipHistory: builder.query({
        query: (subscriptionId) => ({
          url: `/subscriptions/${subscriptionId}/skip-history`,
          method: 'GET',
        }),
        providesTags: ['Subscription', 'SkipHistory'],
      }),
      getWalletBalance: builder.query({
        query: () => '/wallet/balance',
        providesTags: ['Wallet'],
      }),

      addMoneyToWallet: builder.mutation({
        query: (data) => ({
          url: '/wallet/add-money',
          method: 'POST',
          body: data,
        }),
        invalidatesTags: ['Wallet'],
      }),

      deductFromWallet: builder.mutation({
        query: (data) => ({
          url: '/wallet/deduct',
          method: 'POST',
          body: data,
        }),
        invalidatesTags: ['Wallet'],
      }),

      getWalletTransactions: builder.query({
        query: (params) => ({
          url: '/wallet/transactions',
          params,
        }),
        providesTags: ['WalletTransactions'],
      }),

      addToWallet: builder.mutation({
        query: (walletData) => ({
          url: '/users/wallet/add',
          method: 'POST',
          body: walletData
        }),
        invalidatesTags: ['User', 'Wallet']
      }),

      // Subscriptions endpoints
      getSubscriptionUsers: builder.query({
        query: (params) => ({
          url: '/subscriptions/users',
          params
        }),
        providesTags: ['Subscription']
      }),
      verifySubscriptionPayment: builder.mutation({
        query: (verificationData) => ({
          url: '/subscriptions/verify-payment',
          method: 'POST',
          body: verificationData,
        }),
        invalidatesTags: ['Subscription', 'User'],
      }),
      getUserSubscriptions: builder.query({
        query: () => '/subscriptions/user',
        providesTags: ['Subscription'],
      }),
      getSubscriptionDetails: builder.query({
        query: (subscriptionId) => `/subscriptions/${subscriptionId}`,
        providesTags: (result, error, id) => [{ type: 'Subscription', id }],
      }),
      customizeMeal: builder.mutation({
        query: ({ subscriptionId, customizationData }) => ({
          url: `/customizations`,
          method: 'POST',
          body: { subscriptionId, ...customizationData },
        }),
        invalidatesTags: ['Subscription'],
      }),
      skipMeal: builder.mutation({
        query: ({ subscriptionId, skipData, reason }) => ({
          url: `/subscriptions/${subscriptionId}/skip-meal`,
          method: 'POST',
          body: { skipData, reason },
        }),
        invalidatesTags: ['Subscription'],
        async onQueryStarted(
          { subscriptionId, skipData, reason },
          { dispatch, queryFulfilled, getState }
        ) {
          // Optimistic update for instant calendar reflection
          const patchedSubscription = dispatch(
            api.util.updateQueryData(
              'getSubscriptionDetails',
              subscriptionId,
              (draft) => {
                if (draft && draft.data) {
                  // Handle both single date and multiple dates format
                  let skipDates = [];
                  
                  if (skipData && skipData.dates && Array.isArray(skipData.dates)) {
                    skipDates = skipData.dates;
                  } else if (skipData && skipData.date && skipData.shift) {
                    skipDates = [{ date: skipData.date, shift: skipData.shift }];
                  }

                  // Initialize deliveryTracking if it doesn't exist
                  if (!draft.data.deliveryTracking) {
                    draft.data.deliveryTracking = [];
                  }

                  // Add skipped meals to delivery tracking for instant display
                  skipDates.forEach((skipEntry) => {
                    const { date, shift } = skipEntry;
                    const skipDate = new Date(date);
                    
                    // Check if entry already exists
                    const existingIndex = draft.data.deliveryTracking.findIndex(
                      (delivery) => 
                        new Date(delivery.date).toDateString() === skipDate.toDateString() &&
                        delivery.shift === shift
                    );

                    if (existingIndex !== -1) {
                      // Update existing entry
                      draft.data.deliveryTracking[existingIndex].status = 'skipped';
                      draft.data.deliveryTracking[existingIndex].isSkipped = true;
                      draft.data.deliveryTracking[existingIndex].skipReason = reason;
                      draft.data.deliveryTracking[existingIndex].skippedAt = new Date().toISOString();
                    } else {
                      // Add new entry for the skipped meal
                      draft.data.deliveryTracking.push({
                        date: skipDate.toISOString(),
                        shift: shift,
                        status: 'skipped',
                        isSkipped: true,
                        skipReason: reason,
                        skippedAt: new Date().toISOString()
                      });
                    }
                  });

                  // Initialize skippedMeals array if it doesn't exist
                  if (!draft.data.skippedMeals) {
                    draft.data.skippedMeals = [];
                  }

                  // Add to skippedMeals array for consistency
                  skipDates.forEach((skipEntry) => {
                    draft.data.skippedMeals.push({
                      date: new Date(skipEntry.date).toISOString(),
                      shift: skipEntry.shift,
                      reason: reason,
                      skippedAt: new Date().toISOString()
                    });
                  });
                }
              }
            )
          );

          // Also update the user subscriptions query if it exists in cache
          dispatch(
            api.util.updateQueryData('getUserSubscriptions', undefined, (draft) => {
              if (draft && draft.data) {
                const subscription = draft.data.find(sub => sub._id === subscriptionId);
                if (subscription) {
                  // Handle both single date and multiple dates format
                  let skipDates = [];
                  if (skipData && skipData.dates && Array.isArray(skipData.dates)) {
                    skipDates = skipData.dates;
                  } else if (skipData && skipData.date && skipData.shift) {
                    skipDates = [{ date: skipData.date, shift: skipData.shift }];
                  }

                  // Initialize deliveryTracking array if it doesn't exist (needed for calendar)
                  if (!subscription.deliveryTracking) {
                    subscription.deliveryTracking = [];
                  }

                  // Add skipped meals to delivery tracking for calendar display
                  skipDates.forEach((skipEntry) => {
                    const { date, shift } = skipEntry;
                    const skipDate = new Date(date);
                    
                    // Check if entry already exists
                    const existingIndex = subscription.deliveryTracking.findIndex(
                      (delivery) => 
                        new Date(delivery.date).toDateString() === skipDate.toDateString() &&
                        delivery.shift === shift
                    );

                    if (existingIndex !== -1) {
                      // Update existing entry
                      subscription.deliveryTracking[existingIndex].status = 'skipped';
                      subscription.deliveryTracking[existingIndex].isSkipped = true;
                      subscription.deliveryTracking[existingIndex].skipReason = reason;
                      subscription.deliveryTracking[existingIndex].skippedAt = new Date().toISOString();
                    } else {
                      // Add new entry for the skipped meal
                      subscription.deliveryTracking.push({
                        date: skipDate.toISOString(),
                        shift: shift,
                        status: 'skipped',
                        isSkipped: true,
                        skipReason: reason,
                        skippedAt: new Date().toISOString()
                      });
                    }
                  });

                  // Update the skippedMeals array for consistency
                  if (!subscription.skippedMeals) {
                    subscription.skippedMeals = [];
                  }

                  skipDates.forEach((skipEntry) => {
                    subscription.skippedMeals.push({
                      date: new Date(skipEntry.date).toISOString(),
                      shift: skipEntry.shift,
                      reason: reason,
                      skippedAt: new Date().toISOString()
                    });
                  });
                }
              }
            })
          );

          try {
            await queryFulfilled;
            console.log('✅ Skip meal completed successfully');
          } catch (error) {
            console.error('❌ Skip meal failed, reverting optimistic update:', error);
            // Revert optimistic update on error
            patchedSubscription.undo();
            
            // Also revert the user subscriptions update
            dispatch(
              api.util.updateQueryData('getUserSubscriptions', undefined, (draft) => {
                if (draft && draft.data) {
                  const subscription = draft.data.find(sub => sub._id === subscriptionId);
                  if (subscription && subscription.skippedMeals) {
                    // Remove the optimistically added skip entries
                    let skipDates = [];
                    if (skipData && skipData.dates && Array.isArray(skipData.dates)) {
                      skipDates = skipData.dates;
                    } else if (skipData && skipData.date && skipData.shift) {
                      skipDates = [{ date: skipData.date, shift: skipData.shift }];
                    }

                    skipDates.forEach((skipEntry) => {
                      const skipDate = new Date(skipEntry.date).toISOString();
                      subscription.skippedMeals = subscription.skippedMeals.filter(
                        skip => !(skip.date === skipDate && skip.shift === skipEntry.shift)
                      );
                    });
                  }
                }
              })
            );
          }
        }
      }),
      processCustomizationPayment: builder.mutation({
        query: ({ subscriptionId, paymentData }) => ({
          url: `/subscriptions/${subscriptionId}/customization-payment`,
          method: 'POST',
          body: paymentData,
        }),
        invalidatesTags: ['Subscription'],
      }),
      replaceThali: builder.mutation({
        query: ({ subscriptionId, replacementData }) => ({
          url: `/subscriptions/${subscriptionId}/replace-thali`,
          method: 'POST',
          body: replacementData,
        }),
        invalidatesTags: ['Subscription'],
      }),
      cancelSubscription: builder.mutation({
        query: (subscriptionId) => ({
          url: `/subscriptions/${subscriptionId}/cancel`,
          method: 'POST',
        }),
        invalidatesTags: (result, error, subscriptionId) => [
          { type: 'Subscription', id: subscriptionId },
        ],
      }),
      pauseSubscription: builder.mutation({
        query: (subscriptionId) => ({
          url: `/subscriptions/${subscriptionId}/pause`,
          method: 'POST',
        }),
        invalidatesTags: (result, error, subscriptionId) => [
          { type: 'Subscription', id: subscriptionId },
        ],
      }),
      resumeSubscription: builder.mutation({
        query: (subscriptionId) => ({
          url: `/subscriptions/${subscriptionId}/resume`,
          method: 'POST',
        }),
        invalidatesTags: (result, error, subscriptionId) => [
          { type: 'Subscription', id: subscriptionId },
        ],
      }),
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
    
      // Orders endpoints
      createOrder: builder.mutation({
        query: (orderData) => ({
          url: '/orders/create',
          method: 'POST',
          body: orderData,
        }),
        invalidatesTags: ['Order', 'Subscription'],
      }),
      
      // Subscription endpoints
      createSubscription: builder.mutation({
        query: (subscriptionData) => ({
          url: '/subscriptions',
          method: 'POST',
          body: subscriptionData,
        }),
        invalidatesTags: ['Subscription'],
      }),
      
      // Payment endpoints
      createPaymentOrder: builder.mutation({
        query: (paymentData) => ({
          url: '/payments/create-order',
          method: 'POST',
          body: paymentData,
        }),
      }),
      
      verifyPayment: builder.mutation({
        query: (verificationData) => ({
          url: '/payments/verify',
          method: 'POST',
          body: verificationData,
        }),
      }),
      
      // Wallet endpoints
      getWalletBalance: builder.query({
        query: () => '/wallet/balance',
        providesTags: ['Wallet'],
      }),
    
      getUserOrders: builder.query({
        query: (params) => ({
          url: '/orders',
          params
        }),
        providesTags: ['Order']
      }),
    
      cancelOrder: builder.mutation({
        query: ({ id, reason }) => ({
          url: `/orders/${id}/cancel`,
          method: 'PUT',
          body: { reason }
        }),
        invalidatesTags: ['Order', 'User']
      }),
    
      trackOrder: builder.query({
        query: (id) => `/orders/${id}/track`,
        providesTags: (result, error, id) => [{ type: 'Order', id }]
      }),
    
      // Daily Meals endpoints
      getTodaysMeal: builder.query({
        query: () => '/dailymeals/today',
        providesTags: ['DailyMeal']
      }),
    
      getDailyMeal: builder.query({
        query: (date) => `/dailymeals/date/${date}`,
        providesTags: (result, error, date) => [{ type: 'DailyMeal', id: date }]
      }),
    
      getWeeklyMenu: builder.query({
        query: (params) => ({
          url: '/dailymeals/weekly',
          params
        }),
        providesTags: ['DailyMeal']
      }),
    
      // Custom Requests endpoints
      createCustomRequest: builder.mutation({
        query: (requestData) => ({
          url: '/custom-requests',
          method: 'POST',
          body: requestData
        }),
        invalidatesTags: ['CustomRequest']
      }),
    
      getUserCustomRequests: builder.query({
        query: (params) => ({
          url: '/custom-requests',
          params
        }),
        providesTags: ['CustomRequest']
      }),
      replaceThali: builder.mutation({
        query: ({ subscriptionId, ...body }) => ({
          url: `/subscriptions/${subscriptionId}/replace-thali`,
          method: 'POST',
          body,
        }),
        invalidatesTags: (result, error, { subscriptionId }) => [
          { type: 'Subscription', id: subscriptionId },
          'ReplaceableThalis',
        ],
      }),
      getActiveRequests: builder.query({
        query: (params) => ({
          url: '/custom-requests/active',
          params
        }),
        providesTags: ['CustomRequest']
      }),
    
      // Restaurant Bids endpoints
      createBid: builder.mutation({
        query: (bidData) => ({
          url: '/restaurant-bids',
          method: 'POST',
          body: bidData
        }),
        invalidatesTags: ['Bid', 'CustomRequest']
      }),
    
      getRequestBids: builder.query({
        query: (requestId) => `/restaurant-bids/request/${requestId}`,
        providesTags: (result, error, requestId) => [{ type: 'Bid', id: requestId }]
      }),
    
      acceptBid: builder.mutation({
        query: (id) => ({
          url: `/restaurant-bids/${id}/accept`,
          method: 'PUT'
        }),
        invalidatesTags: ['Bid', 'CustomRequest', 'Order']
      }),
    
      // Reviews endpoints
      createReview: builder.mutation({
        query: (reviewData) => ({
          url: '/reviews',
          method: 'POST',
          body: reviewData
        }),
        invalidatesTags: ['Review', 'MealPlan']
      }),
    
      getPlanReviews: builder.query({
        query: ({ planId, ...params }) => ({
          url: `/reviews/plan/${planId}`,
          params
        }),
        providesTags: (result, error, { planId }) => [{ type: 'Review', id: planId }]
      }),
    
      // User endpoints
      updateProfile: builder.mutation({
        query: (profileData) => ({
          url: '/users/profile',
          method: 'PUT',
          body: profileData
        }),
        invalidatesTags: ['User']
      }),
    
      updatePreferences: builder.mutation({
        query: (preferences) => ({
          url: '/users/preferences',
          method: 'PUT',
          body: preferences
        }),
        invalidatesTags: ['User']
      }),
    
      updateAddress: builder.mutation({
        query: (address) => ({
          url: '/users/address',
          method: 'PUT',
          body: address
        }),
        invalidatesTags: ['User']
      }),
    
      getUserStats: builder.query({
        query: () => '/users/stats',
        providesTags: ['User']
      }),
    
      // Payment endpoints
      createPaymentOrder: builder.mutation({
        query: (paymentData) => ({
          url: '/payments/create-order',
          method: 'POST',
          body: paymentData,
        }),
      }),
    
      verifyPayment: builder.mutation({
        query: (verificationData) => ({
          url: '/payments/verify',
          method: 'POST',
          body: verificationData,
        }),
        invalidatesTags: ['Wallet', 'Order'],
      }),
    
      getPaymentHistory: builder.query({
        query: (params) => ({
          url: '/payments/history',
          params
        })
      }),

      // Category endpoints
      getCategories: builder.query({
        query: () => '/category',
        providesTags: ['Category']
      }),

      getCategoryById: builder.query({
        query: (id) => `/category/${id}`,
        providesTags: (result, error, id) => [{ type: 'Category', id }]
      }),
getOrderById: builder.query({
      query: (orderId) => `/seller/orders/${orderId}`,
      providesTags: (result, error, id) => [{ type: 'SellerOrder', id }]
    }),
      createCategory: builder.mutation({
        query: (categoryData) => ({
          url: '/category',
          method: 'POST',
          body: categoryData
        }),
        invalidatesTags: ['Category']
      }),

      updateCategory: builder.mutation({
        query: ({ id, ...data }) => ({
          url: `/category/${id}`,
          method: 'PUT',
          body: data
        }),
        invalidatesTags: (result, error, { id }) => [{ type: 'Category', id }]
      }),

      deleteCategory: builder.mutation({
        query: (id) => ({
          url: `/category/${id}`,
          method: 'DELETE'
        }),
        invalidatesTags: (result, error, id) => [{ type: 'Category', id }]
      }),

      // Homepage endpoints
      getHomepageData: builder.query({
        query: () => '/homepage',
        providesTags: ['Homepage']
      }),

      getHomepageFeaturedProducts: builder.query({
        query: (params) => ({
          url: '/homepage/featured-products',
          params
        }),
        providesTags: ['Homepage', 'Product']
      }),

      getHomepageMealPlans: builder.query({
        query: () => '/homepage/meal-plans',
        providesTags: ['Homepage', 'MealPlan']
      }),

      getHomepageCategories: builder.query({
        query: () => '/homepage/categories',
        providesTags: ['Homepage', 'Category']
      }),

      getHomepageTodaysSpecial: builder.query({
        query: () => '/homepage/todays-special',
        providesTags: ['Homepage', 'DailyMeal']
      }),

      getHomepageStats: builder.query({
        query: () => '/homepage/stats',
        providesTags: ['Homepage']
      }),

      getHomepageTestimonials: builder.query({
        query: () => '/homepage/testimonials',
        providesTags: ['Homepage']
      }),

      getHomepageHeroSlides: builder.query({
        query: () => '/homepage/hero-slides',
        providesTags: ['Homepage']
      }),

      // Grocery endpoints
      getGroceryProducts: builder.query({
        query: (params) => ({
          url: '/products',
          params: {
            category: 'grocery',
            ...params
          }
        }),
        providesTags: ['Product', 'Grocery']
      }),

      getGroceryCategories: builder.query({
        query: () => '/products/categories',
        providesTags: ['Category', 'Grocery']
      }),

      getGroceryProductsByCategory: builder.query({
        query: (categoryId) => ({
          url: '/products',
          params: {
            category: categoryId,
            limit: 50
          }
        }),
        providesTags: (result, error, categoryId) => [
          { type: 'Product', id: categoryId },
          'Grocery'
        ]
      }),

      getFeaturedGroceryProducts: builder.query({
        query: (params = {}) => ({
          url: '/products',
          params: {
            category: 'grocery',
            featured: true,
            limit: 10,
            ...params
          }
        }),
        providesTags: ['Product', 'Grocery', 'Featured']
      }),

      getPopularGroceryProducts: builder.query({
        query: (params = {}) => ({
          url: '/products',
          params: {
            category: 'grocery',
            sortBy: 'popularity',
            limit: 8,
            ...params
          }
        }),
        providesTags: ['Product', 'Grocery', 'Popular']
      }),

      searchGroceryProducts: builder.query({
        query: (searchTerm) => ({
          url: '/products/search',
          params: {
            q: searchTerm,
            category: 'grocery'
          }
        }),
        providesTags: ['Product', 'Grocery', 'Search']
      }),

      // Seller endpoints
      getSellers: builder.query({
        query: () => '/users/sellers',
        providesTags: ['Sellers']
      }),
    
      getSellerProfile: builder.query({
        query: () => '/seller/profile',
        providesTags: ['Seller']
      }),
    
      updateSellerProfile: builder.mutation({
        query: (profileData) => ({
          url: '/seller/profile',
          method: 'PUT',
          body: profileData
        }),
        invalidatesTags: ['Seller']
      }),

      updateSellerPassword: builder.mutation({
        query: (passwordData) => ({
          url: '/seller/update-password',
          method: 'PUT',
          body: passwordData
        }),
        invalidatesTags: ['Seller']
      }),

      uploadSellerAvatar: builder.mutation({
        query: (file) => {
          const formData = new FormData();
          formData.append('avatar', file);
        
          return {
            url: '/seller/upload-avatar',
            method: 'POST',
            body: formData,
            // Don't set Content-Type header - let the browser set it with the correct boundary
            headers: {},
          };
        },
        invalidatesTags: ['Seller']
      }),

      getSellerDashboard: builder.query({
        query: () => '/seller/dashboard',
        providesTags: ['SellerDashboard']
      }),

      getSellerOrders: builder.query({
        query: (params) => ({
          url: '/seller/orders',
          params
        }),
        providesTags: ['SellerOrder']
      }),

      getThaliOrders: builder.query({
        query: (params) => ({
          url: '/seller/thali-orders',
          params
        }),
        providesTags: ['ThaliOrder']
      }),

      updateOrderStatus: builder.mutation({
        query: ({ orderId, status }) => ({
          url: `/seller/orders/${orderId}/status`,
          method: 'PUT',
          body: { status }
        }),
        invalidatesTags: ['SellerOrder', 'Order']
      }),

      markOrderAsViewed: builder.mutation({
        query: (orderId) => ({
          url: `/seller/orders/${orderId}/mark-viewed`,
          method: 'PUT'
        }),
        invalidatesTags: ['SellerOrder']
      }),

      getSellerAnalytics: builder.query({
        query: () => '/seller/analytics',
        providesTags: ['SellerDashboard']
      }),
    
      getSubscriptionUsers: builder.query({
        query: () => {
          const token = localStorage.getItem('token');
          console.log('Auth token:', token); // Debug log
          return {
            url: '/subscriptions/active-users',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include', // Include cookies if using session-based auth
          };
        },
        providesTags: ['SubscriptionUsers']
      }),

      // Meal Availability endpoints
      getMealAvailability: builder.query({
        query: () => '/seller/meal-edit/availability',
        providesTags: ['MealAvailability']
      }),

      updateMealAvailability: builder.mutation({
        query: (availabilityData) => ({
          url: '/seller/meal-edit/availability',
          method: 'PUT',
          body: availabilityData
        }),
        invalidatesTags: ['MealAvailability', 'Seller']
      }),
      
      // Delivery Slot endpoints
      getAvailableDeliverySlots: builder.query({
        query: (params) => ({
          url: '/delivery-slots/available',
          params: {
            date: params?.date,
            timezone: params?.timezone || 'Asia/Kolkata'
          }
        }),
        providesTags: ['DeliverySlot']
      }),

      validateDeliverySlot: builder.mutation({
        query: (slotData) => ({
          url: '/delivery-slots/validate',
          method: 'POST',
          body: {
            date: slotData.date,
            slot: slotData.slot,
            timezone: slotData.timezone || 'Asia/Kolkata'
          }
        })
      }),

      getAlternativeSlots: builder.query({
        query: (params) => ({
          url: '/delivery-slots/alternatives',
          params: {
            date: params.date,
            timezone: params.timezone || 'Asia/Kolkata',
            currentSlot: params.currentSlot
          }
        }),
        providesTags: ['DeliverySlot']
      }),

      // Get daily subscription meals with filtering
      getDailySubscriptionMeals: builder.query({
        query: (params = {}) => ({
          url: '/admin/daily-subscription-meals',
          method: 'GET',
          params: {
            date: params.date,
            shift: params.shift,
            status: params.status,
            planId: params.planId,
            search: params.search,
            page: params.page || 1,
            limit: params.limit || 50,
          },
        }),
        providesTags: ['DailyMeals', 'Subscription'],
      }),
    
      // Update daily meal status
      updateDailyMealStatus: builder.mutation({
        query: ({ mealId, status, date, notes }) => ({
          url: `/admin/daily-meals/${mealId}/status`,
          method: 'PATCH',
          body: { status, date, notes },
        }),
        invalidatesTags: ['DailyMeals'],
      }),
    
      // Export daily meals data
      exportDailyMeals: builder.query({
        query: (params = {}) => ({
          url: '/admin/daily-meals/export',
          method: 'GET',
          params: {
            date: params.date,
            shift: params.shift,
            status: params.status,
            planId: params.planId,
            format: params.format || 'excel',
          },
          responseHandler: (response) => response.blob(),
        }),
      }),
    
      // Get meal plans for filter dropdown
      getMealPlans: builder.query({
        query: () => ({
          url: '/admin/meal-plans',
          method: 'GET',
        }),
        providesTags: ['MealPlan'],
      }),
    
      // Get daily meal statistics
      getDailyMealStats: builder.query({
        query: (date) => ({
          url: `/admin/daily-meals/stats`,
          method: 'GET',
          params: { date },
        }),
        providesTags: ['DailyMeals'],
      }),
  
      // Get user's daily meals
      getUserDailyMeals: builder.query({
        query: ({ userId, date }) => ({
          url: `/admin/users/${userId}/daily-meals`,
          method: 'GET',
          params: { date }
        }),
        providesTags: (result, error, { userId, date }) => [
          { type: 'UserMeals', id: `${userId}-${date}` }
        ],
      }),

      // ===== ADMIN DELIVERY MANAGEMENT ENDPOINTS =====
      
      // Get admin daily deliveries with filtering
      getAdminDailyDeliveries: builder.query({
        query: (params = {}) => ({
          url: '/admin/deliveries',
          method: 'GET',
          params: {
            date: params.date,
            shift: params.shift,
            zone: params.zone,
            driverId: params.driverId,
            sellerId: params.sellerId,
            status: params.status,
            mealPlan: params.mealPlan,
            priceMin: params.priceMin,
            priceMax: params.priceMax,
            search: params.search,
            page: params.page || 1,
            limit: params.limit || 50,
          },
        }),
        providesTags: ['AdminDelivery', 'Delivery'],
      }),

      // Get admin delivery statistics
      getAdminDeliveryStats: builder.query({
        query: (params = {}) => ({
          url: '/admin/deliveries/stats',
          method: 'GET',
          params: {
            date: params.date,
            zone: params.zone,
            driverId: params.driverId,
            sellerId: params.sellerId,
          },
        }),
        providesTags: ['AdminDelivery'],
      }),

      // Get admin delivery filter options
      getAdminDeliveryFilters: builder.query({
        query: () => ({
          url: '/admin/deliveries/filters',
          method: 'GET',
        }),
        providesTags: ['AdminDelivery'],
      }),

      // Get specific delivery details for admin
      getAdminDeliveryDetails: builder.query({
        query: (deliveryId) => ({
          url: `/admin/deliveries/${deliveryId}`,
          method: 'GET',
        }),
        providesTags: (result, error, deliveryId) => [
          { type: 'AdminDelivery', id: deliveryId }
        ],
      }),

      // Admin skip meal
      adminSkipMeal: builder.mutation({
        query: ({ subscriptionId, dates, reason, shift = 'both' }) => ({
          url: `/admin/deliveries/subscriptions/${subscriptionId}/skip`,
          method: 'POST',
          body: { dates, reason, shift },
        }),
        invalidatesTags: ['AdminDelivery', 'Delivery', 'DailyMeals'],
      }),

      // Admin customize meal
      adminCustomizeMeal: builder.mutation({
        query: ({ deliveryId, customizations, notes, notifyUser = true }) => ({
          url: `/admin/deliveries/${deliveryId}/customize`,
          method: 'POST',
          body: { customizations, notes, notifyUser },
        }),
        invalidatesTags: ['AdminDelivery', 'Delivery', 'DailyMeals'],
      }),

      // Admin update delivery status
      adminUpdateDeliveryStatus: builder.mutation({
        query: ({ deliveryId, status, notes, notifyUser = true }) => ({
          url: `/admin/deliveries/${deliveryId}/status`,
          method: 'PUT',
          body: { status, notes, notifyUser },
        }),
        invalidatesTags: ['AdminDelivery', 'Delivery', 'DailyMeals'],
      }),

      // Admin bulk update delivery status
      adminBulkUpdateDeliveryStatus: builder.mutation({
        query: ({ deliveryIds, status, notes, notifyUsers = true }) => ({
          url: '/admin/deliveries/bulk/status',
          method: 'PUT',
          body: { deliveryIds, status, notes, notifyUsers },
        }),
        invalidatesTags: ['AdminDelivery', 'Delivery', 'DailyMeals'],
      }),

      // Admin bulk skip meals
      adminBulkSkipMeals: builder.mutation({
        query: ({ deliveryIds, reason, notifyUsers = true }) => ({
          url: '/admin/deliveries/bulk/skip',
          method: 'POST',
          body: { deliveryIds, reason, notifyUsers },
        }),
        invalidatesTags: ['AdminDelivery', 'Delivery', 'DailyMeals'],
      }),

      // ===== DRIVER ENDPOINTS =====
      
      // Get delivery list for driver
      getDriverDeliveryList: builder.query({
        query: (params = {}) => ({
          url: '/drivers/delivery/deliveries',
          method: 'GET',
          params: {
            driverId: params.driverId,
            date: params.date,
            shift: params.shift,
            status: params.status
          },
        }),
        providesTags: ['DriverDelivery', 'Delivery'],
      }),

      // Get all daily deliveries for driver dashboard (similar to admin)
      getDriverDailyDeliveries: builder.query({
        query: (params = {}) => ({
          url: '/drivers/daily-deliveries',
          method: 'GET',
          params: {
            date: params.date,
            shift: params.shift,
            status: params.status,
            search: params.search,
            page: params.page || 1,
            limit: params.limit || 50,
          },
        }),
        providesTags: ['DriverDelivery', 'Delivery'],
      }),

      // Update single delivery status
      updateDeliveryStatus: builder.mutation({
        query: ({ deliveryId, status, notes, deliveredAt, driverId }) => ({
          url: `/drivers/delivery/${deliveryId}/status`,
          method: 'PUT',
          body: { status, notes, deliveredAt, driverId },
        }),
        invalidatesTags: ['DriverDelivery', 'Delivery', 'DailyMeals'],
      }),

      // Bulk update delivery status
      bulkUpdateDeliveryStatus: builder.mutation({
        query: ({ deliveryIds, status, notes, deliveredAt, driverId }) => ({
          url: '/drivers/delivery/deliveries/bulk-status',
          method: 'PUT',
          body: { deliveryIds, status, notes, deliveredAt, driverId },
        }),
        invalidatesTags: ['DriverDelivery', 'Delivery', 'DailyMeals'],
      }),

      // Get driver statistics
      getDriverStats: builder.query({
        query: (params = {}) => ({
          url: '/driver/stats',
          method: 'GET',
          params: {
            driverId: params.driverId,
            startDate: params.startDate,
            endDate: params.endDate
          },
        }),
        providesTags: ['DriverStats'],
      }),

      // Get optimized delivery route
      getOptimizedRoute: builder.query({
        query: (params = {}) => ({
          url: '/driver/route',
          method: 'GET',
          params: {
            driverId: params.driverId,
            date: params.date,
            shift: params.shift
          },
        }),
        providesTags: ['DeliveryRoute'],
      }),

      // ===== USER SUBSCRIPTION ENDPOINTS =====
      
      // Get user's subscriptions
      getUserSubscriptions: builder.query({
        query: (userId) => ({
          url: `/subscriptions/user/${userId}`,
          method: 'GET',
        }),
        providesTags: ['UserSubscription'],
      }),

      // Get subscription detail with delivery tracking
      getSubscriptionDetail: builder.query({
        query: (subscriptionId) => ({
          url: `/subscriptions/${subscriptionId}/detail`,
          method: 'GET',
        }),
        providesTags: (result, error, subscriptionId) => [
          { type: 'SubscriptionDetail', id: subscriptionId }
        ],
      }),
  })
});

// Export hooks for usage in functional components
export const {
  
  // Sellers hooks
  // useGetSellersQuery,
  // useGetSubscriptionUsersQuery,
  
  // Hisaab hooks
  // useGetTodaysHisaabQuery,
  // useGetHisaabByDateRangeQuery,
  
  // Menu Change hooks
  useGetMenuChangeOptionsQuery,

  useRequestMenuChangeMutation,
  useProcessMenuChangePaymentMutation,
  useGetUserMenuChangesQuery,
  useCancelMenuChangeMutation,



  // Auth hooks
  useRegisterMutation,
  useLoginMutation,
  useGetProfileQuery,
  useGetUserQuery,
  useGoogleAuthMutation,
  useUnlinkGoogleMutation,
  useSetPasswordMutation,
  useCheckAuthStatusQuery,
  
  // Meal Plans hooks
  useGetMealPlanQuery,
  useGetMealPlanAddOnsQuery,
  useGetMealPlanRatingsQuery,
  useGetMealPlanExtraItemsQuery,
  useGetMealPlanReplacementsQuery,
  useGetReplaceableThalisQuery,
  useGetSkipMealLimitQuery,

  // Wallet hooks
  useCreateWalletMutation,
  useGetWalletBalanceQuery,
  useAddMoneyToWalletMutation,
  useDeductFromWalletMutation,
  useGetWalletTransactionsQuery,
  useAddToWalletMutation,

  // Subscriptions hooks
  // useGetSubscriptionUsersQuery,
  useGetSkipHistoryQuery,
  useCreateSubscriptionMutation,
  useVerifySubscriptionPaymentMutation,
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
  
  // Orders hooks
  useCreateOrderMutation,
  useGetUserOrdersQuery,
  useCancelOrderMutation,
  useTrackOrderQuery,
  
  // Daily Meals hooks
  useGetTodaysMealQuery,
  useGetDailyMealQuery,
  useGetWeeklyMenuQuery,
  
  // Custom Requests hooks
  useCreateCustomRequestMutation,
  useGetUserCustomRequestsQuery,
  useGetActiveRequestsQuery,
  
  // Bids hooks
  useCreateBidMutation,
  useGetRequestBidsQuery,
  useAcceptBidMutation,
  
  // Reviews hooks
  useCreateReviewMutation,
  useGetPlanReviewsQuery,
  
  // User hooks
  useUpdateProfileMutation,
  useUpdatePreferencesMutation,
  useUpdateAddressMutation,
  useGetUserStatsQuery,
  // useGetSellersQuery,
  // useGetSubscriptionUsersQuery,
  
  // Payments hooks
  useCreatePaymentOrderMutation,
  useVerifyPaymentMutation,
  useGetPaymentHistoryQuery,

  // Category hooks
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,

  // Homepage hooks
  useGetHomepageDataQuery,
  useGetHomepageFeaturedProductsQuery,
  useGetHomepageMealPlansQuery,
  useGetHomepageCategoriesQuery,
  useGetHomepageTodaysSpecialQuery,
  useGetHomepageStatsQuery,
  useGetHomepageTestimonialsQuery,
  useGetHomepageHeroSlidesQuery,

  // Grocery hooks
  useGetGroceryProductsQuery,
  useGetGroceryCategoriesQuery,
  useGetGroceryProductsByCategoryQuery,
  useGetFeaturedGroceryProductsQuery,
  useGetPopularGroceryProductsQuery,
  useSearchGroceryProductsQuery,

  // Seller hook
  useGetSellersQuery,
  useUpdateSellerProfileMutation,
  useGetSellerProfileQuery,
  useUpdateSellerPasswordMutation,
  useUploadSellerAvatarMutation,
  useGetSellerDashboardQuery,
  useGetSellerOrdersQuery,
  useGetThaliOrdersQuery,
  useUpdateOrderStatusMutation,
  useMarkOrderAsViewedMutation,
  useGetOrderByIdQuery,
  useGetSellerProductsQuery,
  useCreateSellerProductMutation,
  useUpdateSellerProductMutation,
  useUpdateProductStatusMutation,
  useDeleteSellerProductMutation,
  useDeleteProductMutation,
  useToggleStoreStatusMutation,
  useGetSellerAnalyticsQuery,
  useGetSubscriptionUsersQuery,
  useGetMealAvailabilityQuery,
  useUpdateMealAvailabilityMutation,
  
  // Hisaab hooks
  useGetTodaysHisaabQuery,
  useCreateOrUpdateHisaabMutation,
  useAddHisaabProductMutation,
  useUpdateHisaabProductMutation,
  useDeleteHisaabProductMutation,
  useGetHisaabHistoryQuery,
  useGetHisaabByDateQuery,
  useGetHisaabByDateRangeQuery,
  
  // Delivery Slot hooks
  useGetAvailableDeliverySlotsQuery,
  useValidateDeliverySlotMutation,
  useGetAlternativeSlotsQuery,

  // Daily Subscription Meals hooks
  useGetDailySubscriptionMealsQuery,
  useUpdateDailyMealStatusMutation,
  useExportDailyMealsQuery,
  useGetMealPlansQuery,
  useGetMealPlanssQuery,
  useGetDailyMealStatsQuery,
  useGetUserDailyMealsQuery,

  // Admin Delivery Management hooks
  useGetAdminDailyDeliveriesQuery,
  useGetAdminDeliveryStatsQuery,
  useGetAdminDeliveryFiltersQuery,
  useGetAdminDeliveryDetailsQuery,
  useAdminSkipMealMutation,
  useAdminCustomizeMealMutation,
  useAdminUpdateDeliveryStatusMutation,
  useAdminBulkUpdateDeliveryStatusMutation,
  useAdminBulkSkipMealsMutation,

  // Driver hooks
  useGetDriverDeliveryListQuery,
  useGetDriverDailyDeliveriesQuery,
  useUpdateDeliveryStatusMutation,
  useBulkUpdateDeliveryStatusMutation,
  useGetDriverStatsQuery,
  useGetOptimizedRouteQuery,

  // User subscription hooks
  // useGetUserSubscriptionsQuery,
  useGetSubscriptionDetailQuery,
} = api;

// Export the API slice

// export { api };
