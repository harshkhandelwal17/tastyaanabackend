import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Normalize base URL and ensure it ends with "/api"
const rawBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const trimmed = typeof rawBase === 'string' ? rawBase.replace(/\/$/, '') : '';
const normalized = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;

const baseQuery = fetchBaseQuery({
  baseUrl: normalized,
  prepareHeaders: (headers, { getState }) => {
    const token = getState()?.auth?.token || localStorage.getItem('token');
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  }
});

export const groceryApi = createApi({
  reducerPath: 'groceryApi',
  baseQuery,
  tagTypes: ['Grocery'],
  endpoints: (builder) => ({
    // Get all groceries with optional filters
    getGroceries: builder.query({
      query: (params = {}) => ({
        url: '/groceries',
        params: {
          ...params,
          ...(params.search && { search: params.search }),
          ...(params.category && { category: params.category }),
          ...(params.minPrice && { minPrice: params.minPrice }),
          ...(params.maxPrice && { maxPrice: params.maxPrice }),
          ...(params.sortBy && { sortBy: params.sortBy }),
          ...(params.sortOrder && { sortOrder: params.sortOrder }),
        },
      }),
      providesTags: (result = [], error, arg) => [
        'Grocery',
        ...result.map(({ _id }) => ({ type: 'Grocery', id: _id })),
      ],
    }),

    // Get grocery by ID
    getGroceryById: builder.query({
      query: (id) => `/groceries/${id}`,
      providesTags: (result, error, id) => [{ type: 'Grocery', id }],
    }),

    // Get groceries by category
    getGroceriesByCategory: builder.query({
      query: (category) => ({
        url: `/groceries/category/${category}`,
      }),
      providesTags: (result = [], error, category) => [
        { type: 'Grocery', id: `CATEGORY_${category}` },
        ...result.map(({ _id }) => ({ type: 'Grocery', id: _id })),
      ],
    }),

    // Search groceries
    searchGroceries: builder.query({
      query: (query) => ({
        url: `/groceries/search/${encodeURIComponent(query)}`,
      }),
      providesTags: (result = [], error, query) => [
        { type: 'Grocery', id: `SEARCH_${query}` },
        ...result.map(({ _id }) => ({ type: 'Grocery', id: _id })),
      ],
    }),

    // Admin: Add new grocery
    addGrocery: builder.mutation({
      query: (newGrocery) => ({
        url: '/groceries',
        method: 'POST',
        body: newGrocery,
      }),
      invalidatesTags: ['Grocery'],
    }),

    // Admin: Update grocery
    updateGrocery: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/groceries/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Grocery', id },
        'Grocery',
      ],
    }),

    // Admin: Delete grocery
    deleteGrocery: builder.mutation({
      query: (id) => ({
        url: `/groceries/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [
        { type: 'Grocery', id },
        'Grocery',
      ],
    }),
  }),
});

// Export the API instance and all hooks
export const {
  useGetGroceriesQuery,
  useLazyGetGroceriesQuery,
  useGetGroceryByIdQuery,
  useLazyGetGroceryByIdQuery,
  useSearchGroceriesQuery,
  useLazySearchGroceriesQuery,
  useAddGroceryMutation,
  useUpdateGroceryMutation,
  useDeleteGroceryMutation
} = groceryApi;

export default groceryApi;
