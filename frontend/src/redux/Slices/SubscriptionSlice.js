import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  subscriptions: [],
  loading: false,
  error: null,
  selectedSubscription: null,
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setSubscriptions(state, action) {
      state.subscriptions = action.payload;
    },
    setSelectedSubscription(state, action) {
      state.selectedSubscription = action.payload;
    },
    clearSelectedSubscription(state) {
      state.selectedSubscription = null;
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
  setSubscriptions,
  setSelectedSubscription,
  clearSelectedSubscription,
  setLoading,
  setError,
  clearError,
} = subscriptionSlice.actions;

export default subscriptionSlice.reducer; 