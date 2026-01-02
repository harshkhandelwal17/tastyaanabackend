import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const baseQuery = fetchBaseQuery({
  baseUrl: `${import.meta.env.VITE_BACKEND_URL}/admin-panel`,
  prepareHeaders: (headers, { getState }) => {
    // Get auth token from your existing auth state
    const token = getState()?.auth?.user?.token || 
                  getState()?.user?.token || 
                  localStorage.getItem('token') ||
                  localStorage.getItem('authToken')
    
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    } else {
      console.warn('No authentication token found. Admin API calls may fail.');
    }
    return headers
  },
})

// Base query with error handling and reauth logic
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  if (result.error) {
    console.error('Admin API Error:', {
      status: result.error.status,
      data: result.error.data,
      endpoint: args
    });
    
    // Handle authentication errors
    if (result.error.status === 401) {
      console.warn('Authentication failed. Token may be expired or invalid.');
      // You could dispatch logout action here if needed
      // api.dispatch(logout());
    }
    
    // Handle authorization errors
    if (result.error.status === 403) {
      console.warn('Access denied. User may not have admin privileges.');
    }
  }
  
  return result;
}

export const adminPanelApi = createApi({
  reducerPath: 'adminPanelApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Dashboard', 'User', 'Subscription', 'Order', 'Analytics', 'MealPlan'],
  endpoints: (builder) => ({
    // Dashboard endpoints
    getDashboard: builder.query({
      query: () => '/dashboard',
      providesTags: ['Dashboard'],
    }),
    
    // User management endpoints
    getUsers: builder.query({
      query: ({ page = 1, limit = 10, search = '', status = 'all' } = {}) =>
        `/users?page=${page}&limit=${limit}&search=${search}&status=${status}`,
      providesTags: ['User'],
    }),
    getUserById: builder.query({
      query: (userId) => `/users/${userId}`,
      providesTags: ['User'],
    }),
    getUserStats: builder.query({
      query: (userId) => `/users/${userId}/stats`,
      providesTags: ['User'],
    }),
    updateUserStatus: builder.mutation({
      query: ({ userId, status }) => ({
        url: `/users/${userId}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation({
      query: ({ userId, ...userData }) => ({
        url: `/users/${userId}`,
        method: 'PUT',
        body: userData,
      }),
      invalidatesTags: ['User'],
    }),
    
    // Subscription management endpoints
    getSubscriptions: builder.query({
      query: ({ page = 1, limit = 50, status = 'all', search = '' } = {}) =>
        `/subscriptions?page=${page}&limit=${limit}&status=${status}&search=${search}`,
      providesTags: ['Subscription'],
    }),
    getSubscriptionById: builder.query({
      query: (subscriptionId) => `/subscriptions/${subscriptionId}`,
      providesTags: ['Subscription'],
    }),
    updateSubscriptionStatus: builder.mutation({
      query: ({ subscriptionId, status }) => ({
        url: `/subscriptions/${subscriptionId}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['Subscription'],
    }),
    
    // Order management endpoints
    getOrders: builder.query({
      query: ({ page = 1, limit = 10, status = 'all', search = '', date = '' } = {}) =>
        `/orders?page=${page}&limit=${limit}&status=${status}&search=${search}&date=${date}`,
      providesTags: ['Order'],
    }),
    getOrderById: builder.query({
      query: (orderId) => `/orders/${orderId}`,
      providesTags: ['Order'],
    }),
    updateOrderStatus: builder.mutation({
      query: ({ orderId, status }) => ({
        url: `/orders/${orderId}/status`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['Order'],
    }),
    
    // Analytics endpoints
    getAnalytics: builder.query({
      query: ({ timeframe = '30d' } = {}) => `/analytics?timeframe=${timeframe}`,
      providesTags: ['Analytics'],
    }),
    getRevenueAnalytics: builder.query({
      query: ({ timeframe = '30d' } = {}) => `/analytics/revenue?timeframe=${timeframe}`,
      providesTags: ['Analytics'],
    }),
    
    // Meal plan endpoints
    getMealPlans: builder.query({
      query: () => '/mealplans',
      providesTags: ['MealPlan'],
    }),
    getMealPlanAnalytics: builder.query({
      query: (mealPlanId) => `/mealplans/${mealPlanId}/analytics`,
      providesTags: ['MealPlan'],
    }),
  }),
})

export const {
  useGetDashboardQuery,
  useGetUsersQuery,
  useGetUserByIdQuery,
  useGetUserStatsQuery,
  useUpdateUserStatusMutation,
  useUpdateUserMutation,
  useGetSubscriptionsQuery,
  useGetSubscriptionByIdQuery,
  useUpdateSubscriptionStatusMutation,
  useGetOrdersQuery,
  useGetOrderByIdQuery,
  useUpdateOrderStatusMutation,
  useGetAnalyticsQuery,
  useGetRevenueAnalyticsQuery,
  useGetMealPlansQuery,
  useGetMealPlanAnalyticsQuery,
} = adminPanelApi