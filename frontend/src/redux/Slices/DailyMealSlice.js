import { createSlice } from '@reduxjs/toolkit';
// Optionally import RTK Query hooks if you want to connect to api.js
// import { api } from '../store/api';

const initialState = {
  meals: [],
  loading: false,
  error: null,
  selectedDate: null,
  selectedMeal: null,
};

const dailyMealSlice = createSlice({
  name: 'dailyMeals',
  initialState,
  reducers: {
    setSelectedDate(state, action) {
      state.selectedDate = action.payload;
    },
    setSelectedMeal(state, action) {
      state.selectedMeal = action.payload;
    },
    clearSelectedMeal(state) {
      state.selectedMeal = null;
    },
    setMeals(state, action) {
      state.meals = action.payload;
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
  setSelectedDate,
  setSelectedMeal,
  clearSelectedMeal,
  setMeals,
  setLoading,
  setError,
  clearError,
} = dailyMealSlice.actions;

export default dailyMealSlice.reducer; 