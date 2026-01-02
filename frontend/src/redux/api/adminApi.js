import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

const baseQuery = fetchBaseQuery({
  baseUrl: `${import.meta.env.VITE_BACKEND_URL}/admin`,
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
    }
    
    // Handle authorization errors
    if (result.error.status === 403) {
      console.warn('Access denied. User may not have admin privileges.');
    }
  }
  
  return result;
}

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Centers', 'Zone', 'Seller', 'Vehicle'],
  endpoints: (builder) => ({
    // Centers endpoints
    getCenters: builder.query({
      query: ({ page = 1, limit = 20, search = '', status = 'all' } = {}) =>
        `/centers?page=${page}&limit=${limit}&search=${search}&status=${status}`,
      providesTags: ['Centers'],
    }),
    getCenterById: builder.query({
      query: (centerId) => `/centers/${centerId}`,
      providesTags: ['Centers'],
    }),
  }),
})

export const {
  useGetCentersQuery,
  useGetCenterByIdQuery,
} = adminApi