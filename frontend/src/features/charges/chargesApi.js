import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const chargesApi = createApi({
  reducerPath: 'chargesApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/charges`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Charges'],
  endpoints: (builder) => ({
    // Get all charges
    getCharges: builder.query({
      query: () => ({
        url: '/',
        method: 'GET',
      }),
      transformResponse: (response) => response.data,
      providesTags: ['Charges'],
    }),
    
    // Get charge by ID
    getCharge: builder.query({
      query: (id) => ({
        url: `/${id}`,
        method: 'GET',
      }),
      transformResponse: (response) => response.data,
      providesTags: (result, error, id) => [{ type: 'Charges', id }],
    }),
    
    // Create new charge
    createCharge: builder.mutation({
      query: (chargeData) => ({
        url: '/',
        method: 'POST',
        body: chargeData,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['Charges'],
    }),
    
    // Update charge
    updateCharge: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: updates,
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: (result, error, { id }) => [
        'Charges',
        { type: 'Charges', id },
      ],
    }),
    
    // Delete charge
    deleteCharge: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      transformResponse: (response) => response.data,
      invalidatesTags: ['Charges'],
    }),
    
    // Get charge form data (categories, charge types, etc.)
    getChargeFormData: builder.query({
      query: () => ({
        url: '/form-data',
        method: 'GET',
      }),
      transformResponse: (response) => response.data,
    }),
    
    // Get applicable charges for an order
    getApplicableCharges: builder.query({
      query: (orderData) => ({
        url: '/applicable',
        method: 'POST',
        body: orderData,
      }),
      transformResponse: (response) => response.applicableCharges,
    }),
  }),
});

export const {
  useGetChargesQuery,
  useGetChargeQuery,
  useCreateChargeMutation,
  useUpdateChargeMutation,
  useDeleteChargeMutation,
  useGetChargeFormDataQuery,
  useGetApplicableChargesQuery,
} = chargesApi;
