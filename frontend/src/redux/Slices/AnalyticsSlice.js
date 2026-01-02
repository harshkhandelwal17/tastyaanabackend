import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  analytics: {},
  loading: false,
  error: null,
};

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState,
  reducers: {
    setAnalytics(state, action) {
      state.analytics = action.payload;
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
    clearAnalytics(state) {
      state.analytics = {};
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setAnalytics,
  setLoading,
  setError,
  clearError,
  clearAnalytics,
} = analyticsSlice.actions;

export default analyticsSlice.reducer; 