import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  sellerData: {},
  loading: false,
  error: null,
};

const sellerSlice = createSlice({
  name: 'seller',
  initialState,
  reducers: {
    setSellerData(state, action) {
      state.sellerData = action.payload;
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
    clearSellerData(state) {
      state.sellerData = {};
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setSellerData,
  setLoading,
  setError,
  clearError,
  clearSellerData,
} = sellerSlice.actions;

export default sellerSlice.reducer; 