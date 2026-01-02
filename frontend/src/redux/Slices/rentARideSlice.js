import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // View mode: 'byShop' or 'byVehicleType'
  viewMode: 'byVehicleType',

  // Selected category (shop ID or vehicle type)
  selectedCategory: 'all',

  // Search query
  searchQuery: '',

  // Voice search state
  isListening: false,
  voiceTranscript: '',

  // Filters
  filters: {
    fuelType: [],
    zone: [],
    priceRange: { min: 0, max: 10000 },
    availability: null, // Changed from 'all' to null
    brand: [],
    seatingCapacity: null,
  },

  // Filter drawer state
  isFilterDrawerOpen: false,

  // Sorting
  sortBy: 'name', // 'name', 'price', 'rating'
  sortOrder: 'asc', // 'asc', 'desc'
};

const rentARideSlice = createSlice({
  name: 'rentARide',
  initialState,
  reducers: {
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
      state.selectedCategory = 'all'; // Reset category when switching view mode
    },

    setSelectedCategory: (state, action) => {
      state.selectedCategory = action.payload;
    },

    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },

    setIsListening: (state, action) => {
      state.isListening = action.payload;
    },

    setVoiceTranscript: (state, action) => {
      state.voiceTranscript = action.payload;
    },

    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },

    resetFilters: (state) => {
      state.filters = initialState.filters;
    },

    toggleFilterDrawer: (state) => {
      state.isFilterDrawerOpen = !state.isFilterDrawerOpen;
    },

    setFilterDrawerOpen: (state, action) => {
      state.isFilterDrawerOpen = action.payload;
    },

    setSorting: (state, action) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },

    applyVoiceFilters: (state, action) => {
      // Apply filters from voice command
      const voiceFilters = action.payload;
      state.filters = { ...state.filters, ...voiceFilters };
      state.searchQuery = voiceFilters.searchQuery || state.searchQuery;
    },

    resetAll: (state) => {
      return initialState;
    },
  },
});

export const {
  setViewMode,
  setSelectedCategory,
  setSearchQuery,
  setIsListening,
  setVoiceTranscript,
  setFilters,
  resetFilters,
  toggleFilterDrawer,
  setFilterDrawerOpen,
  setSorting,
  applyVoiceFilters,
  resetAll,
} = rentARideSlice.actions;

export default rentARideSlice.reducer;

// Selectors
export const selectViewMode = (state) => state.rentARide.viewMode;
export const selectSelectedCategory = (state) => state.rentARide.selectedCategory;
export const selectSearchQuery = (state) => state.rentARide.searchQuery;
export const selectIsListening = (state) => state.rentARide.isListening;
export const selectVoiceTranscript = (state) => state.rentARide.voiceTranscript;
export const selectFilters = (state) => state.rentARide.filters;
export const selectIsFilterDrawerOpen = (state) => state.rentARide.isFilterDrawerOpen;
export const selectSorting = (state) => ({
  sortBy: state.rentARide.sortBy,
  sortOrder: state.rentARide.sortOrder,
});
