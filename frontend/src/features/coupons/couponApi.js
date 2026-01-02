import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const couponApi = createApi({
  reducerPath: 'couponApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/coupons`,
    prepareHeaders: (headers, { getState }) => {
      const token = getState().auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Coupons', 'CouponUsages'],
  endpoints: (builder) => ({
    // Get all coupons
    getCoupons: builder.query({
      query: ({ page = 1, limit = 10, search = '' }) => ({
        url: '/',
        params: { page, limit, search },
      }),
      providesTags: ['Coupons'],
    }),

    // Get single coupon
    getCoupon: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Coupons', id }],
    }),

    // Create coupon
    createCoupon: builder.mutation({
      query: (couponData) => ({
        url: '/',
        method: 'POST',
        body: couponData,
      }),
      invalidatesTags: ['Coupons'],
    }),

    // Update coupon
    updateCoupon: builder.mutation({
      query: ({ id, ...updates }) => ({
        url: `/${id}`,
        method: 'PUT',
        body: updates,
      }),
      invalidatesTags: (result, error, { id }) => [
        { type: 'Coupons', id },
        'Coupons',
      ],
    }),

    // Delete coupon
    deleteCoupon: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Coupons'],
    }),

    // Get coupon usages
    getCouponUsages: builder.query({
      query: ({ couponId, page = 1, limit = 10 }) => ({
        url: `/${couponId}/usages`,
        params: { page, limit },
      }),
      providesTags: (result, error, { couponId }) => [
        { type: 'CouponUsages', id: couponId },
      ],
    }),
  }),
});

export const {
  useGetCouponsQuery,
  useGetCouponQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
  useGetCouponUsagesQuery,
} = couponApi;
