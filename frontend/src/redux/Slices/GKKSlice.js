import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tiffinLogs: [],
  loading: false,
  error: null,
  selectedTiffin: null,
};

const gkkSlice = createSlice({
  name: 'gkk',
  initialState,
  reducers: {
    setTiffinLogs(state, action) {
      state.tiffinLogs = action.payload;
    },
    setSelectedTiffin(state, action) {
      state.selectedTiffin = action.payload;
    },
    clearSelectedTiffin(state) {
      state.selectedTiffin = null;
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
  setTiffinLogs,
  setSelectedTiffin,
  clearSelectedTiffin,
  setLoading,
  setError,
  clearError,
} = gkkSlice.actions;

export default gkkSlice.reducer; 