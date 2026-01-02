import { createSlice } from '@reduxjs/toolkit';
import { groceryApi } from '../storee/groceryApi';

const initialState = {
  products: [],
  selectedProduct: null,
  categories: [],
  loading: false,
  error: null,
  filters: {
    category: '',
    minPrice: null,
    maxPrice: null,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    search: '',
    page: 1,
    limit: 10
  },
  pagination: {
    total: 0,
    pages: 1,
    currentPage: 1
  }
};

// RTK Query will handle the async operations, so we don't need these thunks

const grocerySlice = createSlice({
  name: 'grocery',
  initialState,
  reducers: {
    setFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
        page: 1 // Reset to first page when filters change
      };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
    },
    setPage: (state, action) => {
      state.filters.page = action.payload;
    },
    clearSelectedProduct: (state) => {
      state.selectedProduct = null;
    },
  },
  extraReducers: (builder) => {
    // Handle the getGroceries query
    builder.addMatcher(
      groceryApi.endpoints.getGroceries.matchPending,
      (state) => {
        state.loading = true;
        state.error = null;
      }
    );
    builder.addMatcher(
      groceryApi.endpoints.getGroceries.matchFulfilled,
      (state, { payload }) => {
        state.loading = false;
        state.products = payload.products || [];
        state.pagination = {
          total: payload.total || 0,
          pages: payload.pages || 1,
          currentPage: payload.page || 1
        };
      }
    );
    builder.addMatcher(
      groceryApi.endpoints.getGroceries.matchRejected,
      (state, { error }) => {
        state.loading = false;
        state.error = error.message;
      }
    );

    // Handle the searchGroceries query
    builder.addMatcher(
      groceryApi.endpoints.searchGroceries.matchPending,
      (state) => {
        state.loading = true;
        state.error = null;
      }
    );
    builder.addMatcher(
      groceryApi.endpoints.searchGroceries.matchFulfilled,
      (state, { payload }) => {
        state.loading = false;
        state.products = payload.products || [];
        state.pagination = {
          total: payload.total || 0,
          pages: payload.pages || 1,
          currentPage: 1
        };
      }
    );
    builder.addMatcher(
      groceryApi.endpoints.searchGroceries.matchRejected,
      (state, { error }) => {
        state.loading = false;
        state.error = error.message;
      }
    );

    // Handle getGroceryById query
    builder.addMatcher(
      groceryApi.endpoints.getGroceryById.matchPending,
      (state) => {
        state.loading = true;
        state.error = null;
      }
    );
    builder.addMatcher(
      groceryApi.endpoints.getGroceryById.matchFulfilled,
      (state, { payload }) => {
        state.loading = false;
        state.selectedProduct = payload.product || null;
      }
    );
    builder.addMatcher(
      groceryApi.endpoints.getGroceryById.matchRejected,
      (state, { error }) => {
        state.loading = false;
        state.error = error.message;
      }
    );
  },
});

export const { setFilters, resetFilters, setPage, clearSelectedProduct } = grocerySlice.actions;

export default grocerySlice.reducer;
