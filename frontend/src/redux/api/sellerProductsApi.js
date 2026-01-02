import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api';

export const sellerProductsApi = createApi({
  reducerPath: 'sellerProductsApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_BASE_URL}/seller/products`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['SellerProduct'],
  endpoints: (builder) => ({
    // Get all seller's products with pagination and filters
    getSellerProducts: builder.query({
      query: ({ page = 1, limit = 10, status, category, search }) => ({
        url: '/',
        params: { page, limit, status, category, search },
      }),
      providesTags: (result = [], error, arg) => [
        'SellerProduct',
        ...result.docs?.map(({ _id }) => ({ type: 'SellerProduct', id: _id })) || [],
      ],
    }),

    // Get single product by ID
    getSellerProductById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'SellerProduct', id }],
    }),

    // Create a new product
    createProduct: builder.mutation({
      query: (productData) => ({
        url: '/',
        method: 'POST',
        body: productData,
      }),
      invalidatesTags: ['SellerProduct'],
    }),

    // Update a product
    updateProduct: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/${id}`,
        method: 'PATCH',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'SellerProduct', id },
        'SellerProduct',
      ],
    }),

    // Delete a product
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SellerProduct'],
    }),

    // Update product status (active/inactive)
    updateProductStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'SellerProduct', id },
        'SellerProduct',
      ],
    }),

    // Bulk update product prices
    bulkUpdatePrices: builder.mutation({
      query: (updates) => ({
        url: '/bulk-update/prices',
        method: 'PATCH',
        body: { updates },
      }),
      invalidatesTags: ['SellerProduct'],
    }),

    // Bulk update product stock
    bulkUpdateStock: builder.mutation({
      query: (updates) => ({
        url: '/bulk-update/stock',
        method: 'PATCH',
        body: { updates },
      }),
      invalidatesTags: ['SellerProduct'],
    }),

    // Upload product images
    uploadProductImages: builder.mutation({
      query: (formData) => ({
        url: '/upload/images',
        method: 'POST',
        body: formData,
      }),
    }),
  }),
});

export const {
  useGetSellerProductsQuery,
  useGetSellerProductByIdQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUpdateProductStatusMutation,
  useBulkUpdatePricesMutation,
  useBulkUpdateStockMutation,
  useUploadProductImagesMutation,
} = sellerProductsApi;
