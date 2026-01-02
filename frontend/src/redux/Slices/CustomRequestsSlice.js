import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  requests: [],
  loading: false,
  error: null,
  selectedRequest: null,
};

const customRequestsSlice = createSlice({
  name: 'customRequests',
  initialState,
  reducers: {
    setRequests(state, action) {
      state.requests = action.payload;
    },
    setSelectedRequest(state, action) {
      state.selectedRequest = action.payload;
    },
    clearSelectedRequest(state) {
      state.selectedRequest = null;
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
    clearError(state) {
      state.error = null;
    },
  },
});

export const {
  setRequests,
  setSelectedRequest,
  clearSelectedRequest,
  setLoading,
  setError,
  clearError,
} = customRequestsSlice.actions;

export default customRequestsSlice.reducer; 