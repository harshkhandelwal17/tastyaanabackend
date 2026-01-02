import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  reviews: [],
  loading: false,
  error: null,
  selectedReview: null,
};

const reviewsSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    setReviews(state, action) {
      state.reviews = action.payload;
    },
    setSelectedReview(state, action) {
      state.selectedReview = action.payload;
    },
    clearSelectedReview(state) {
      state.selectedReview = null;
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
  setReviews,
  setSelectedReview,
  clearSelectedReview,
  setLoading,
  setError,
  clearError,
} = reviewsSlice.actions;

export default reviewsSlice.reducer; 