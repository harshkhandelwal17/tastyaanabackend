import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Normalize base URL
const rawBaseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const trimmedBaseUrl = typeof rawBaseUrl === 'string' ? rawBaseUrl.replace(/\/$/, '') : '';
const normalizedBaseUrl = trimmedBaseUrl.endsWith('/api') ? trimmedBaseUrl : `${trimmedBaseUrl}/api`;

const baseQuery = fetchBaseQuery({
    baseUrl: `${normalizedBaseUrl}/seller/vehicles`,
    prepareHeaders: (headers, { getState }) => {
        // Get token from auth state or localStorage
        const token = getState()?.auth?.token || localStorage.getItem('token');

        if (token) {
            headers.set('authorization', `Bearer ${token}`);
        }
        headers.set('Content-Type', 'application/json');
        return headers;
    },
});

export const sellerVehicleSliceApi = createApi({
    reducerPath: 'sellerVehicleSliceApi',
    baseQuery,
    tagTypes: ['SellerBooking', 'SellerVehicle', 'SellerProfile'],
    endpoints: (builder) => ({

        // Get Seller Profile
        getSellerProfile: builder.query({
            query: () => '/profile',
            providesTags: ['SellerProfile'],
        }),

        // Get Seller Bookings
        getSellerBookings: builder.query({
            query: (params = {}) => {
                const searchParams = new URLSearchParams();
                if (params.page) searchParams.append('page', params.page);
                if (params.limit) searchParams.append('limit', params.limit);
                if (params.status) searchParams.append('status', params.status);
                if (params.search) searchParams.append('search', params.search);
                if (params.dateFrom) searchParams.append('dateFrom', params.dateFrom);
                if (params.dateTo) searchParams.append('dateTo', params.dateTo);
                if (params.sortBy) searchParams.append('sortBy', params.sortBy);
                if (params.sortOrder) searchParams.append('sortOrder', params.sortOrder);

                return `/bookings?${searchParams.toString()}`;
            },
            providesTags: ['SellerBooking'],
        }),

        // Get Booking Details
        getBookingDetails: builder.query({
            query: (bookingId) => `/bookings/${bookingId}`,
            providesTags: (result, error, bookingId) => [{ type: 'SellerBooking', id: bookingId }],
        }),

        // Update Booking Status (Handover Logic)
        updateBookingStatus: builder.mutation({
            query: ({ bookingId, ...data }) => ({
                url: `/bookings/${bookingId}/status`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { bookingId }) => [
                { type: 'SellerBooking', id: bookingId },
                { type: 'SellerBooking', id: 'LIST' }
            ],
        }),

        // Update Booking Details (Edit)
        updateBookingDetails: builder.mutation({
            query: ({ bookingId, ...data }) => ({
                url: `/bookings/${bookingId}`,
                method: 'PUT',
                body: data,
            }),
            invalidatesTags: (result, error, { bookingId }) => [
                { type: 'SellerBooking', id: bookingId }
            ],
        }),

        // Recalculate Bill on Drop
        recalculateBillOnDrop: builder.mutation({
            query: ({ bookingId, actualEndTime, actualKmReading }) => ({
                url: `/bookings/${bookingId}/recalculate-on-drop`,
                method: 'POST',
                body: { actualEndTime, actualKmReading },
            }),
            invalidatesTags: (result, error, { bookingId }) => [
                { type: 'SellerBooking', id: bookingId }
            ],
        }),

        // Verify OTP
        verifyBookingOtp: builder.mutation({
            query: ({ bookingId, otp }) => ({
                url: `/bookings/${bookingId}/verify-otp`,
                method: 'POST',
                body: { otp },
            }),
        }),

    }),
});

export const {
    useGetSellerProfileQuery,
    useGetSellerBookingsQuery,
    useGetBookingDetailsQuery,
    useUpdateBookingStatusMutation,
    useUpdateBookingDetailsMutation,
    useVerifyBookingOtpMutation,
    useRecalculateBillOnDropMutation,
} = sellerVehicleSliceApi;
