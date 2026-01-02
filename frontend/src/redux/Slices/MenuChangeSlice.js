import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  menuChanges: [],
  loading: false,
  error: null,
  selectedMenuChange: null,
};

const menuChangeSlice = createSlice({
  name: 'menuChange',
  initialState,
  reducers: {
    setMenuChanges(state, action) {
      state.menuChanges = action.payload;
    },
    setSelectedMenuChange(state, action) {
      state.selectedMenuChange = action.payload;
    },
    clearSelectedMenuChange(state) {
      state.selectedMenuChange = null;
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
  setMenuChanges,
  setSelectedMenuChange,
  clearSelectedMenuChange,
  setLoading,
  setError,
  clearError,
} = menuChangeSlice.actions;

export default menuChangeSlice.reducer; 