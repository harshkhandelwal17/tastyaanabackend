import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const sellerProductApi = createApi({
  reducerPath: 'sellerProductApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/seller/gadgets`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['SellerProduct', 'Category'],
  endpoints: (builder) => ({
    getSellerProducts: builder.query({
      query: ({ page = 1, limit = 20, search, category } = {}) => {
        const params = new URLSearchParams();
        params.append('page', page);
        params.append('limit', limit);
        if (search) params.append('search', search);
        if (category) params.append('category', category);
        return `products?${params.toString()}`;
      },
      providesTags: ['SellerProduct'],
    }),
    createProduct: builder.mutation({
      query: (productData) => ({
        url: 'products',
        method: 'POST',
        body: productData,
      }),
      invalidatesTags: ['SellerProduct'],
    }),
    updateProduct: builder.mutation({
      query: ({ id, ...productData }) => ({
        url: `products/${id}`,
        method: 'PUT',
        body: productData,
      }),
      invalidatesTags: ['SellerProduct'],
    }),
    deleteProduct: builder.mutation({
      query: (id) => ({
        url: `products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SellerProduct'],
    }),
    uploadProductImages: builder.mutation({
      query: (formData) => ({
        url: 'products/upload-images',
        method: 'POST',
        body: formData,
      }),
    }),
    uploadProductVideos: builder.mutation({
      query: (formData) => ({
        url: 'products/upload-videos',
        method: 'POST',
        body: formData,
      }),
    }),
    getCategories: builder.query({
      query: () => 'categories',
      providesTags: ['Category'],
    }),
  }),
});

export const {
  useGetSellerProductsQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUploadProductImagesMutation,
  useUploadProductVideosMutation,
  useGetCategoriesQuery,
} = sellerProductApi;