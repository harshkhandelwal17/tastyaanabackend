//     //redux store rtk query setup // store/index.js
// import { configureStore } from '@reduxjs/toolkit';
// import { setupListeners } from '@reduxjs/toolkit/query';
// import { sellerApi } from './api/sellerApi';
// import { authApi } from './api/authApi';
// import authSlice from './slices/authSlice';
// import notificationSlice from './slices/notificationSlice';
// import uiSlice from './slices/uiSlice';

// export const store = configureStore({
//   reducer: {
//     auth: authSlice,
//     notifications: notificationSlice,
//     ui: uiSlice,
//     [sellerApi.reducerPath]: sellerApi.reducer,
//     [authApi.reducerPath]: authApi.reducer,
//   },
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware({
//       serializableCheck: {
//         ignoredActions: [
//           'persist/PERSIST',
//           'persist/REHYDRATE',
//           'persist/REGISTER',
//         ],
//       },
//     })
//       .concat(sellerApi.middleware)
//       .concat(authApi.middleware),
// });

// setupListeners(store.dispatch);

// export type RootState = ReturnType<typeof store.getState>;
// export type AppDispatch = typeof store.dispatch;

// // // store/slices/authSlice.js
// // import { createSlice } from '@reduxjs/toolkit';

// // const initialState = {
// //   user: null,
// //   token: localStorage.getItem('token'),
// //   isAuthenticated: false,
// //   isLoading: false,
// //   error: null,
// // };

// // const authSlice = createSlice({
// //   name: 'auth',
// //   initialState,
// //   reducers: {
// //     setCredentials: (state, action) => {
// //       const { user, token } = action.payload;
// //       state.user = user;
// //       state.token = token;
// //       state.isAuthenticated = true;
// //       state.error = null;
// //       localStorage.setItem('token', token);
// //     },
// //     logout: (state) => {
// //       state.user = null;
// //       state.token = null;
// //       state.isAuthenticated = false;
// //       state.error = null;
// //       localStorage.removeItem('token');
// //     },
// //     setLoading: (state, action) => {
// //       state.isLoading = action.payload;
// //     },
// //     setError: (state, action) => {
// //       state.error = action.payload;
// //       state.isLoading = false;
// //     },
// //     clearError: (state) => {
// //       state.error = null;
// //     },
// //   },
// // });

// // export const { setCredentials, logout, setLoading, setError, clearError } = authSlice.actions;
// // export default authSlice.reducer;

// // store/slices/notificationSlice.js
// import { createSlice } from '@reduxjs/toolkit';

// const initialState = {
//   notifications: [],
//   unreadCount: 0,
//   realTimeNotifications: [],
//   isConnected: false,
// };

// const notificationSlice = createSlice({
//   name: 'notifications',
//   initialState,
//   reducers: {
//     addRealTimeNotification: (state, action) => {
//       state.realTimeNotifications.unshift(action.payload);
//       state.unreadCount += 1;
//       // Keep only last 5 real-time notifications
//       if (state.realTimeNotifications.length > 5) {
//         state.realTimeNotifications = state.realTimeNotifications.slice(0, 5);
//       }
//     },
//     removeRealTimeNotification: (state, action) => {
//       state.realTimeNotifications = state.realTimeNotifications.filter(
//         (notification) => notification.id !== action.payload
//       );
//     },
//     markNotificationAsRead: (state, action) => {
//       const notification = state.notifications.find(n => n._id === action.payload);
//       if (notification && !notification.isRead) {
//         notification.isRead = true;
//         state.unreadCount = Math.max(0, state.unreadCount - 1);
//       }
//     },
//     setConnectionStatus: (state, action) => {
//       state.isConnected = action.payload;
//     },
//     setUnreadCount: (state, action) => {
//       state.unreadCount = action.payload;
//     },
//     clearAllRealTimeNotifications: (state) => {
//       state.realTimeNotifications = [];
//     },
//   },
// });

// export const {
//   addRealTimeNotification,
//   removeRealTimeNotification,
//   markNotificationAsRead,
//   setConnectionStatus,
//   setUnreadCount,
//   clearAllRealTimeNotifications,
// } = notificationSlice.actions;

// export default notificationSlice.reducer;

// // store/slices/uiSlice.js
// import { createSlice } from '@reduxjs/toolkit';

// const initialState = {
//   sidebarOpen: false,
//   currentPage: 'dashboard',
//   theme: 'light',
//   loading: {},
//   modals: {
//     productForm: false,
//     orderDetails: false,
//     confirmDialog: false,
//   },
//   selectedItems: {
//     products: [],
//     orders: [],
//   },
//   filters: {
//     products: {
//       status: 'all',
//       category: '',
//       search: '',
//       sortBy: 'createdAt',
//       sortOrder: 'desc',
//     },
//     orders: {
//       status: 'all',
//       dateRange: '30d',
//       search: '',
//     },
//   },
//   pagination: {
//     products: { page: 1, limit: 20 },
//     orders: { page: 1, limit: 20 },
//     notifications: { page: 1, limit: 20 },
//   },
// };

// const uiSlice = createSlice({
//   name: 'ui',
//   initialState,
//   reducers: {
//     setSidebarOpen: (state, action) => {
//       state.sidebarOpen = action.payload;
//     },
//     setCurrentPage: (state, action) => {
//       state.currentPage = action.payload;
//       state.sidebarOpen = false; // Close sidebar on mobile when navigating
//     },
//     setTheme: (state, action) => {
//       state.theme = action.payload;
//       localStorage.setItem('theme', action.payload);
//     },
//     setLoading: (state, action) => {
//       const { key, value } = action.payload;
//       state.loading[key] = value;
//     },
//     toggleModal: (state, action) => {
//       const { modal, isOpen } = action.payload;
//       state.modals[modal] = isOpen;
//     },
//     setSelectedItems: (state, action) => {
//       const { type, items } = action.payload;
//       state.selectedItems[type] = items;
//     },
//     updateFilter: (state, action) => {
//       const { type, filter, value } = action.payload;
//       state.filters[type][filter] = value;
//       // Reset pagination when filters change
//       state.pagination[type].page = 1;
//     },
//     setPagination: (state, action) => {
//       const { type, page, limit } = action.payload;
//       if (page !== undefined) state.pagination[type].page = page;
//       if (limit !== undefined) state.pagination[type].limit = limit;
//     },
//     resetFilters: (state, action) => {
//       const type = action.payload;
//       state.filters[type] = initialState.filters[type];
//       state.pagination[type].page = 1;
//     },
//   },
// });

// export const {
//   setSidebarOpen,
//   setCurrentPage,
//   setTheme,
//   setLoading,
//   toggleModal,
//   setSelectedItems,
//   updateFilter,
//   setPagination,
//   resetFilters,
// } = uiSlice.actions;

// export default uiSlice.reducer;

// // store/api/baseApi.js
// import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// const baseQuery = fetchBaseQuery({
//   baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
//   prepareHeaders: (headers, { getState }) => {
//     const token = getState().auth.token;
//     if (token) {
//       headers.set('authorization', `Bearer ${token}`);
//     }
//     headers.set('content-type', 'application/json');
//     return headers;
//   },
// });

// const baseQueryWithReauth = async (args, api, extraOptions) => {
//   let result = await baseQuery(args, api, extraOptions);

//   if (result.error && result.error.status === 401) {
//     // Token expired, redirect to login
//     api.dispatch({ type: 'auth/logout' });
//     window.location.href = '/login';
//   }

//   return result;
// };

// export const baseApi = createApi({
//   reducerPath: 'api',
//   baseQuery: baseQueryWithReauth,
//   tagTypes: [
//     'User',
//     'Product',
//     'Order',
//     'Notification',
//     'Analytics',
//     'Return',
//     'Promotion',
//     'Dashboard'
//   ],
//   endpoints: () => ({}),
// });

// // store/api/authApi.js
// import { baseApi } from './baseApi';

// export const authApi = baseApi.injectEndpoints({
//   endpoints: (builder) => ({
//     login: builder.mutation({
//       query: (credentials) => ({
//         url: '/auth/login',
//         method: 'POST',
//         body: credentials,
//       }),
//       invalidatesTags: ['User'],
//     }),
//     register: builder.mutation({
//       query: (userData) => ({
//         url: '/auth/register',
//         method: 'POST',
//         body: userData,
//       }),
//     }),
//     getCurrentUser: builder.query({
//       query: () => '/auth/me',
//       providesTags: ['User'],
//     }),
//     refreshToken: builder.mutation({
//       query: () => ({
//         url: '/auth/refresh',
//         method: 'POST',
//       }),
//     }),
//   }),
// });

// export const {
//   useLoginMutation,
//   useRegisterMutation,
//   useGetCurrentUserQuery,
//   useRefreshTokenMutation,
// } = authApi;

// // store/api/sellerApi.js
// import { baseApi } from './baseApi';

// export const sellerApi = baseApi.injectEndpoints({
//   endpoints: (builder) => ({
//     // Dashboard
//     getDashboard: builder.query({
//       query: () => '/seller/dashboard',
//       providesTags: ['Dashboard'],
//     }),

//     // Products
//     getProducts: builder.query({
//       query: (params) => ({
//         url: '/seller/products',
//         params,
//       }),
//       providesTags: (result) =>
//         result
//           ? [
//               ...result.products.map(({ _id }) => ({ type: 'Product', id: _id })),
//               { type: 'Product', id: 'LIST' },
//             ]
//           : [{ type: 'Product', id: 'LIST' }],
//     }),

//     getProduct: builder.query({
//       query: (id) => `/seller/products/${id}`,
//       providesTags: (result, error, id) => [{ type: 'Product', id }],
//     }),

//     createProduct: builder.mutation({
//       query: (product) => ({
//         url: '/seller/products',
//         method: 'POST',
//         body: product,
//       }),
//       invalidatesTags: [{ type: 'Product', id: 'LIST' }, 'Dashboard'],
//     }),

//     updateProduct: builder.mutation({
//       query: ({ id, ...product }) => ({
//         url: `/seller/products/${id}`,
//         method: 'PUT',
//         body: product,
//       }),
//       invalidatesTags: (result, error, { id }) => [
//         { type: 'Product', id },
//         { type: 'Product', id: 'LIST' },
//         'Dashboard',
//       ],
//     }),

//     deleteProduct: builder.mutation({
//       query: (id) => ({
//         url: `/seller/products/${id}`,
//         method: 'DELETE',
//       }),
//       invalidatesTags: [{ type: 'Product', id: 'LIST' }, 'Dashboard'],
//     }),

//     uploadProductImages: builder.mutation({
//       query: (formData) => ({
//         url: '/upload/product-images',
//         method: 'POST',
//         body: formData,
//       }),
//     }),

//     // Orders
//     getOrders: builder.query({
//       query: (params) => ({
//         url: '/seller/orders',
//         params,
//       }),
//       providesTags: (result) =>
//         result
//           ? [
//               ...result.orders.map(({ _id }) => ({ type: 'Order', id: _id })),
//               { type: 'Order', id: 'LIST' },
//             ]
//           : [{ type: 'Order', id: 'LIST' }],
//     }),

//     updateOrderStatus: builder.mutation({
//       query: ({ orderId, itemId, ...status }) => ({
//         url: `/seller/orders/${orderId}/items/${itemId}/status`,
//         method: 'PUT',
//         body: status,
//       }),
//       invalidatesTags: (result, error, { orderId }) => [
//         { type: 'Order', id: orderId },
//         { type: 'Order', id: 'LIST' },
//         'Dashboard',
//       ],
//     }),

//     // Returns
//     getReturns: builder.query({
//       query: (params) => ({
//         url: '/seller/returns',
//         params,
//       }),
//       providesTags: (result) =>
//         result
//           ? [
//               ...result.returns.map(({ _id }) => ({ type: 'Return', id: _id })),
//               { type: 'Return', id: 'LIST' },
//             ]
//           : [{ type: 'Return', id: 'LIST' }],
//     }),

//     updateReturnStatus: builder.mutation({
//       query: ({ id, ...status }) => ({
//         url: `/seller/returns/${id}/status`,
//         method: 'PUT',
//         body: status,
//       }),
//       invalidatesTags: (result, error, { id }) => [
//         { type: 'Return', id },
//         { type: 'Return', id: 'LIST' },
//       ],
//     }),

//     // Analytics
//     getAnalytics: builder.query({
//       query: (params) => ({
//         url: '/seller/analytics',
//         params,
//       }),
//       providesTags: ['Analytics'],
//     }),

//     // Notifications
//     getNotifications: builder.query({
//       query: (params) => ({
//         url: '/seller/notifications',
//         params,
//       }),
//       providesTags: (result) =>
//         result
//           ? [
//               ...result.notifications.map(({ _id }) => ({ type: 'Notification', id: _id })),
//               { type: 'Notification', id: 'LIST' },
//             ]
//           : [{ type: 'Notification', id: 'LIST' }],
//     }),

//     markNotificationAsRead: builder.mutation({
//       query: (id) => ({
//         url: `/seller/notifications/${id}/read`,
//         method: 'PUT',
//       }),
//       invalidatesTags: (result, error, id) => [
//         { type: 'Notification', id },
//         { type: 'Notification', id: 'LIST' },
//       ],
//     }),

//     // Promotions
//     getPromotions: builder.query({
//       query: (params) => ({
//         url: '/seller/promotions',
//         params,
//       }),
//       providesTags: (result) =>
//         result
//           ? [
//               ...result.promotions.map(({ _id }) => ({ type: 'Promotion', id: _id })),
//               { type: 'Promotion', id: 'LIST' },
//             ]
//           : [{ type: 'Promotion', id: 'LIST' }],
//     }),

//     createPromotion: builder.mutation({
//       query: (promotion) => ({
//         url: '/seller/promotions',
//         method: 'POST',
//         body: promotion,
//       }),
//       invalidatesTags: [{ type: 'Promotion', id: 'LIST' }],
//     }),

//     // Profile
//     getProfile: builder.query({
//       query: () => '/seller/profile',
//       providesTags: ['User'],
//     }),

//     updateProfile: builder.mutation({
//       query: (profile) => ({
//         url: '/seller/profile',
//         method: 'PUT',
//         body: profile,
//       }),
//       invalidatesTags: ['User'],
//     }),
//   }),
// });

// export const {
//   // Dashboard
//   useGetDashboardQuery,

//   // Products
//   useGetProductsQuery,
//   useGetProductQuery,
//   useCreateProductMutation,
//   useUpdateProductMutation,
//   useDeleteProductMutation,
//   useUploadProductImagesMutation,

//   // Orders
//   useGetOrdersQuery,
//   useUpdateOrderStatusMutation,

//   // Returns
//   useGetReturnsQuery,
//   useUpdateReturnStatusMutation,

//   // Analytics
//   useGetAnalyticsQuery,

//   // Notifications
//   useGetNotificationsQuery,
//   useMarkNotificationAsReadMutation,

//   // Promotions
//   useGetPromotionsQuery,
//   useCreatePromotionMutation,

//   // Profile
//   useGetProfileQuery,
//   useUpdateProfileMutation,
// } = sellerApi;
