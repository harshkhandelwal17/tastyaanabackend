// redux/walletSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import  api  from '../api/apiClient'; // Adjust import path

// Async thunk to fetch wallet balance
export const fetchWalletBalance = createAsyncThunk(
  'wallet/fetchBalance',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/wallet/balance');
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch wallet balance'
      );
    }
  }
);

// Async thunk to add money to wallet
export const addMoneyToWallet = createAsyncThunk(
  'wallet/addMoney',
  async ({ amount }, { rejectWithValue }) => {
    try {
      const response = await api.post('/wallet/add-money', { amount });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to add money to wallet'
      );
    }
  }
);

// Async thunk to verify wallet top-up
export const verifyWalletTopup = createAsyncThunk(
  'wallet/verifyTopup',
  async (paymentData, { rejectWithValue, dispatch }) => {
    try {
      const response = await api.post('/wallet/verify-topup', paymentData);
      // Refresh wallet balance after successful top-up
      dispatch(fetchWalletBalance());
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to verify payment'
      );
    }
  }
);

const walletSlice = createSlice({
  name: 'wallet',
  initialState: {
    balance: 0,
    loyaltyPoints: 0,
    lastUpdated: null,
    loading: false,
    error: null,
    transactions: [],
    isVisible: false // Controls wallet visibility in navbar
  },
  reducers: {
    // Action to update wallet balance directly (for subscription payments)
    updateBalance: (state, action) => {
      const { amount, type = 'credit' } = action.payload;
      if (type === 'credit') {
        state.balance += amount;
      } else {
        state.balance -= amount;
      }
      state.lastUpdated = new Date().toISOString();
      state.isVisible = true; // Show wallet in navbar after first transaction
    },
    
    // Action to show wallet in navbar
    showWallet: (state) => {
      state.isVisible = true;
    },
    
    // Action to hide wallet in navbar
    hideWallet: (state) => {
      state.isVisible = false;
    },
    
    // Action to clear wallet error
    clearError: (state) => {
      state.error = null;
    },
    
    // Action to reset wallet state on logout
    resetWallet: (state) => {
      state.balance = 0;
      state.loyaltyPoints = 0;
      state.lastUpdated = null;
      state.transactions = [];
      state.isVisible = false;
      state.error = null;
      state.loading = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch wallet balance
      .addCase(fetchWalletBalance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWalletBalance.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload.balance || 0;
        state.loyaltyPoints = action.payload.loyaltyPoints || 0;
        state.lastUpdated = action.payload.lastUpdated;
        state.isVisible = true; // Show wallet if user has balance
        state.error = null;
      })
      .addCase(fetchWalletBalance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Add money to wallet
      .addCase(addMoneyToWallet.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMoneyToWallet.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(addMoneyToWallet.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Verify wallet top-up
      .addCase(verifyWalletTopup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyWalletTopup.fulfilled, (state, action) => {
        state.loading = false;
        state.balance = action.payload.newBalance || state.balance;
        state.isVisible = true;
        state.error = null;
      })
      .addCase(verifyWalletTopup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { 
  updateBalance, 
  showWallet, 
  hideWallet, 
  clearError, 
  resetWallet 
} = walletSlice.actions;

export default walletSlice.reducer;