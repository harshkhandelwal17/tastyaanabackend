import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  bids: [],
  loading: false,
  error: null,
  selectedBid: null,
};

const bidsSlice = createSlice({
  name: 'bids',
  initialState,
  reducers: {
    setBids(state, action) {
      state.bids = action.payload;
    },
    setSelectedBid(state, action) {
      state.selectedBid = action.payload;
    },
    clearSelectedBid(state) {
      state.selectedBid = null;
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
  setBids,
  setSelectedBid,
  clearSelectedBid,
  setLoading,
  setError,
  clearError,
} = bidsSlice.actions;

export default bidsSlice.reducer; 