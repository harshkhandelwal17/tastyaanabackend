import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Enhanced base query with better error handling and caching
// Normalize base URL and ensure it ends with "/api"
const rawBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const trimmed = typeof rawBase === 'string' ? rawBase.replace(/\/$/, '') : '';
const normalized = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;

const baseQuery = fetchBaseQuery({
  baseUrl: normalized,
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
  // Add timeout for better UX
  timeout: 10000,
});

// Enhanced base query with retry logic and better error handling
const baseQueryWithRetry = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  // Retry logic for network errors
  if (result.error && result.error.status === 'FETCH_ERROR') {
    console.warn('Network error, retrying...');
    result = await baseQuery(args, api, extraOptions);
  }
  
  return result;
};

// Optimized API configuration
export const optimizedApi = createApi({
  reducerPath: 'optimizedApi',
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
    'Homepage',
    'Product',
    'Cart',
    'Wishlist'
  ],
  // Enhanced caching configuration
  keepUnusedDataFor: 5 * 60, // 5 minutes
  endpoints: (builder) => ({
    // Optimized Homepage endpoints with better caching
    getHomepageData: builder.query({
      query: () => '/homepage',
      providesTags: ['Homepage'],
      // Cache for 10 minutes
      keepUnusedDataFor: 10 * 60,
      // Transform response for better performance
      transformResponse: (response) => {
        return {
          ...response,
          data: {
            ...response.data,
            // Pre-process data to avoid repeated calculations
            processedAt: Date.now()
          }
        };
      },
    }),

    getHomepageHeroSlides: builder.query({
      query: () => '/homepage/hero-slides',
      providesTags: ['Homepage'],
      keepUnusedDataFor: 15 * 60, // 15 minutes for hero slides
    }),

    getHomepageFeaturedProducts: builder.query({
      query: (params) => ({
        url: '/homepage/featured-products',
        params
      }),
      providesTags: ['Homepage', 'Product'],
      keepUnusedDataFor: 10 * 60,
    }),

    getHomepageMealPlans: builder.query({
      query: (params) => ({
        url: '/homepage/meal-plans',
        params
      }),
      providesTags: ['Homepage', 'MealPlan'],
      keepUnusedDataFor: 10 * 60,
    }),

    getHomepageCategories: builder.query({
      query: (params) => ({
        url: '/homepage/categories',
        params
      }),
      providesTags: ['Homepage', 'Category'],
      keepUnusedDataFor: 30 * 60, // 30 minutes for categories
    }),

    getHomepageTodaysSpecial: builder.query({
      query: () => '/homepage/todays-special',
      providesTags: ['Homepage', 'DailyMeal'],
      keepUnusedDataFor: 5 * 60, // 5 minutes for daily specials
    }),

    getHomepageStats: builder.query({
      query: () => '/homepage/stats',
      providesTags: ['Homepage'],
      keepUnusedDataFor: 60 * 60, // 1 hour for stats
    }),

    getHomepageTestimonials: builder.query({
      query: (params) => ({
        url: '/homepage/testimonials',
        params
      }),
      providesTags: ['Homepage'],
      keepUnusedDataFor: 60 * 60, // 1 hour for testimonials
    }),

    // Optimized User endpoints
    getProfile: builder.query({
      query: () => '/auth/profile',
      providesTags: ['User'],
      keepUnusedDataFor: 5 * 60,
    }),

    // Optimized Subscription endpoints
    getUserSubscriptions: builder.query({
      query: (params) => ({
        url: '/subscriptions',
        params
      }),
      providesTags: ['Subscription'],
      keepUnusedDataFor: 2 * 60, // 2 minutes for subscriptions
    }),

    // Optimized Cart endpoints
    getCart: builder.query({
      query: () => '/cart',
      providesTags: ['Cart'],
      keepUnusedDataFor: 1 * 60, // 1 minute for cart
    }),

    // Optimized Wishlist endpoints
    getWishlist: builder.query({
      query: () => '/wishlist',
      providesTags: ['Wishlist'],
      keepUnusedDataFor: 5 * 60,
    }),

    // Optimized Product endpoints
    getProducts: builder.query({
      query: (params) => ({
        url: '/products',
        params
      }),
      providesTags: ['Product'],
      keepUnusedDataFor: 10 * 60,
      // Transform response for better performance
      transformResponse: (response) => {
        return {
          ...response,
          data: response.data.map(product => ({
            ...product,
            // Pre-calculate derived values
            isDiscounted: product.originalPrice > product.price,
            discountPercentage: product.originalPrice > product.price 
              ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
              : 0
          }))
        };
      },
    }),

    // Mutations with optimistic updates
    addToCart: builder.mutation({
      query: (productData) => ({
        url: '/cart/add',
        method: 'POST',
        body: productData
      }),
      invalidatesTags: ['Cart'],
      // Optimistic update
      async onQueryStarted(productData, { dispatch, queryFulfilled, getState }) {
        const patchResult = dispatch(
          optimizedApi.util.updateQueryData('getCart', undefined, (draft) => {
            if (draft?.data?.items) {
              const existingItem = draft.data.items.find(item => item.product._id === productData.productId);
              if (existingItem) {
                existingItem.quantity += productData.quantity;
              } else {
                draft.data.items.push({
                  product: { _id: productData.productId },
                  quantity: productData.quantity,
                  price: productData.price
                });
              }
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    addToWishlist: builder.mutation({
      query: (productData) => ({
        url: '/wishlist/add',
        method: 'POST',
        body: productData
      }),
      invalidatesTags: ['Wishlist'],
      // Optimistic update
      async onQueryStarted(productData, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          optimizedApi.util.updateQueryData('getWishlist', undefined, (draft) => {
            if (draft?.data?.items) {
              draft.data.items.push({
                product: { _id: productData.productId },
                addedAt: new Date().toISOString()
              });
            }
          })
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    // Optimized Order endpoints
    createOrder: builder.mutation({
      query: (orderData) => ({
        url: '/orders',
        method: 'POST',
        body: orderData
      }),
      invalidatesTags: ['Order', 'Cart', 'Subscription'],
    }),

    // Optimized Subscription mutations
    pauseSubscription: builder.mutation({
      query: ({ id, ...pauseData }) => ({
        url: `/subscriptions/${id}/pause`,
        method: 'PUT',
        body: pauseData
      }),
      invalidatesTags: ['Subscription'],
    }),

    resumeSubscription: builder.mutation({
      query: (id) => ({
        url: `/subscriptions/${id}/resume`,
        method: 'PUT'
      }),
      invalidatesTags: ['Subscription'],
    }),

    cancelSubscription: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/subscriptions/${id}/cancel`,
        method: 'PUT',
        body: { reason }
      }),
      invalidatesTags: ['Subscription'],
    }),

    skipMeal: builder.mutation({
      query: ({ id, ...skipData }) => ({
        url: `/subscriptions/${id}/skip-meal`,
        method: 'POST',
        body: skipData
      }),
      invalidatesTags: ['Subscription'],
    }),

    customizeMeal: builder.mutation({
      query: ({ id, ...customizeData }) => ({
        url: `/customizations`,
        method: 'POST',
        body: { subscriptionId: id, ...customizeData }
      }),
      invalidatesTags: ['Subscription'],
    }),

    // Payment endpoints
    createPaymentOrder: builder.mutation({
      query: (paymentData) => ({
        url: '/payments/create-order',
        method: 'POST',
        body: paymentData
      }),
    }),

    verifyPayment: builder.mutation({
      query: (verificationData) => ({
        url: '/payments/verify',
        method: 'POST',
        body: verificationData
      }),
      invalidatesTags: ['Order', 'User'],
    }),
  }),
});

// Export hooks
export const {
  // Homepage queries
  useGetHomepageDataQuery,
  useGetHomepageHeroSlidesQuery,
  useGetHomepageFeaturedProductsQuery,
  useGetHomepageMealPlansQuery,
  useGetHomepageCategoriesQuery,
  useGetHomepageTodaysSpecialQuery,
  useGetHomepageStatsQuery,
  useGetHomepageTestimonialsQuery,
  
  // User queries
  useGetProfileQuery,
  
  // Subscription queries
  useGetUserSubscriptionsQuery,
  
  // Cart queries
  useGetCartQuery,
  
  // Wishlist queries
  useGetWishlistQuery,
  
  // Product queries
  useGetProductsQuery,
  
  // Mutations
  useAddToCartMutation,
  useAddToWishlistMutation,
  useCreateOrderMutation,
  usePauseSubscriptionMutation,
  useResumeSubscriptionMutation,
  useCancelSubscriptionMutation,
  useSkipMealMutation,
  useCustomizeMealMutation,
  useCreatePaymentOrderMutation,
  useVerifyPaymentMutation,
} = optimizedApi; 