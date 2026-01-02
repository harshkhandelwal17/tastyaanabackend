import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  profile: null,
  preferences: {},
  wallet: {
    balance: 0,
    transactions: []
  },
  loading: false,
  error: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setProfile(state, action) {
      state.profile = action.payload;
    },
    setPreferences(state, action) {
      state.preferences = action.payload;
    },
    setWallet(state, action) {
      state.wallet = action.payload;
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
    clearUser(state) {
      state.profile = null;
      state.preferences = {};
      state.wallet = { balance: 0, transactions: [] };
      state.loading = false;
      state.error = null;
    },
  },
});

export const {
  setProfile,
  setPreferences,
  setWallet,
  setLoading,
  setError,
  clearError,
  clearUser,
} = userSlice.actions;

export default userSlice.reducer; 