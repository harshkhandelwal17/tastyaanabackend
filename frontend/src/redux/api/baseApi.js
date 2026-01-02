
// store/api/baseApi.js
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api',
  prepareHeaders: (headers, { getState }) => {
    const token = getState().auth.token;
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('content-type', 'application/json');
    return headers;
  },
});

const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error && result.error.status === 401) {
    // Token expired, redirect to login
    api.dispatch({ type: 'auth/logout' });
    window.location.href = '/login';
  }
  
  return result;
};

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Product', 
    'Order', 
    'Notification', 
    'Analytics', 
    'Return', 
    'Promotion',
    'Dashboard',
    'HeroSlides'
  ],
  endpoints: (builder) => ({
    // Hero Section Endpoints
    getHeroSlides: builder.query({
      query: () => '/homepage/hero-slides',
      providesTags: ['HeroSlides'],
    }),
  }),
});



// store/api/authApi.js
// import { baseApi } from './baseApi';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['User'],
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    getCurrentUser: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    refreshToken: builder.mutation({
      query: () => ({
        url: '/auth/refresh',
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetCurrentUserQuery,
  useRefreshTokenMutation,
} = authApi;

// store/api/sellerApi.js
// import { baseApi } from './baseApi';

export const sellerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Dashboard
    getDashboard: builder.query({
      query: () => '/seller/dashboard',
      providesTags: ['Dashboard'],
    }),

    // Products
    getProducts: builder.query({
      query: (params) => ({
        url: '/seller/products',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.products.map(({ _id }) => ({ type: 'Product', id: _id })),
              { type: 'Product', id: 'LIST' },
            ]
          : [{ type: 'Product', id: 'LIST' }],
    }),

    getProduct: builder.query({
      query: (id) => `/seller/products/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),

    createProduct: builder.mutation({
      query: (product) => ({
        url: '/seller/products',
        method: 'POST',
        body: product,
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }, 'Dashboard'],
    }),

    updateProduct: builder.mutation({
      query: ({ id, ...product }) => ({
        url: `/seller/products/${id}`,
        method: 'PUT',
        body: product,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Product', id },
        { type: 'Product', id: 'LIST' },
        'Dashboard',
      ],
    }),

    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/seller/products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }, 'Dashboard'],
    }),

    uploadProductImages: builder.mutation({
      query: (formData) => ({
        url: '/upload/product-images',
        method: 'POST',
        body: formData,
      }),
    }),

    // Orders
    getOrders: builder.query({
      query: (params) => ({
        url: '/seller/orders',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.orders.map(({ _id }) => ({ type: 'Order', id: _id })),
              { type: 'Order', id: 'LIST' },
            ]
          : [{ type: 'Order', id: 'LIST' }],
    }),

    updateOrderStatus: builder.mutation({
      query: ({ orderId, itemId, ...status }) => ({
        url: `/seller/orders/${orderId}/items/${itemId}/status`,
        method: 'PUT',
        body: status,
      }),
      invalidatesTags: (result, error, { orderId }) => [
        { type: 'Order', id: orderId },
        { type: 'Order', id: 'LIST' },
        'Dashboard',
      ],
    }),

    // Returns
    getReturns: builder.query({
      query: (params) => ({
        url: '/seller/returns',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.returns.map(({ _id }) => ({ type: 'Return', id: _id })),
              { type: 'Return', id: 'LIST' },
            ]
          : [{ type: 'Return', id: 'LIST' }],
    }),

    updateReturnStatus: builder.mutation({
      query: ({ id, ...status }) => ({
        url: `/seller/returns/${id}/status`,
        method: 'PUT',
        body: status,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Return', id },
        { type: 'Return', id: 'LIST' },
      ],
    }),

    // Analytics
    getAnalytics: builder.query({
      query: (params) => ({
        url: '/seller/analytics',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    // Notifications
    getNotifications: builder.query({
      query: (params) => ({
        url: '/seller/notifications',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.notifications.map(({ _id }) => ({ type: 'Notification', id: _id })),
              { type: 'Notification', id: 'LIST' },
            ]
          : [{ type: 'Notification', id: 'LIST' }],
    }),

    markNotificationAsRead: builder.mutation({
      query: (id) => ({
        url: `/seller/notifications/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Notification', id },
        { type: 'Notification', id: 'LIST' },
      ],
    }),

    // Promotions
    getPromotions: builder.query({
      query: (params) => ({
        url: '/seller/promotions',
        params,
      }),
      providesTags: (result) =>
        result
          ? [
              ...result.promotions.map(({ _id }) => ({ type: 'Promotion', id: _id })),
              { type: 'Promotion', id: 'LIST' },
            ]
          : [{ type: 'Promotion', id: 'LIST' }],
    }),

    createPromotion: builder.mutation({
      query: (promotion) => ({
        url: '/seller/promotions',
        method: 'POST',
        body: promotion,
      }),
      invalidatesTags: [{ type: 'Promotion', id: 'LIST' }],
    }),

    // Profile
    getProfile: builder.query({
      query: () => '/seller/profile',
      providesTags: ['User'],
    }),

    updateProfile: builder.mutation({
      query: (profile) => ({
        url: '/seller/profile',
        method: 'PUT',
        body: profile,
      }),
      invalidatesTags: ['User'],
    }),
  }),
});

export const {
  // Dashboard
  useGetDashboardQuery,
  
  // Products
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUploadProductImagesMutation,
  
  // Orders
  useGetOrdersQuery,
  useUpdateOrderStatusMutation,
  
  // Returns
  useGetReturnsQuery,
  useUpdateReturnStatusMutation,
  
  // Analytics
  useGetAnalyticsQuery,
  
  // Notifications
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  
  // Promotions
  useGetPromotionsQuery,
  useCreatePromotionMutation,
  
  // Profile
  useGetProfileQuery,
  useUpdateProfileMutation,
} = sellerApi;