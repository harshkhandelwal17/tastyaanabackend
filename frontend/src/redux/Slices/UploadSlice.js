import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  files: [],
  loading: false,
  error: null,
};

const uploadSlice = createSlice({
  name: 'upload',
  initialState,
  reducers: {
    setFiles(state, action) {
      state.files = action.payload;
    },
    addFile(state, action) {
      state.files.push(action.payload);
    },
    removeFile(state, action) {
      state.files = state.files.filter(file => file.id !== action.payload);
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
  setFiles,
  addFile,
  removeFile,
  setLoading,
  setError,
  clearError,
} = uploadSlice.actions;

export default uploadSlice.reducer; 