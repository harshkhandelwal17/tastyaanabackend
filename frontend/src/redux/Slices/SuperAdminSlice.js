import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  superAdminData: {},
  loading: false,
  error: null,
};

const superAdminSlice = createSlice({
  name: 'superAdmin',
  initialState,
  reducers: {
    setSuperAdminData(state, action) {
      state.superAdminData = action.payload;
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
    clearSuperAdminData(state) {
      state.superAdminData = {};
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setSuperAdminData,
  setLoading,
  setError,
  clearError,
  clearSuperAdminData,
} = superAdminSlice.actions;

export default superAdminSlice.reducer; 