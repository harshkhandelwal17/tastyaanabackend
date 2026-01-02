import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  dashboard: {},
  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setDashboard(state, action) {
      state.dashboard = action.payload;
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
    clearDashboard(state) {
      state.dashboard = {};
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setDashboard,
  setLoading,
  setError,
  clearError,
  clearDashboard,
} = adminSlice.actions;

export default adminSlice.reducer; 