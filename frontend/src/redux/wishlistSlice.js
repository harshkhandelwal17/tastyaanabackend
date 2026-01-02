// store/slices/wishlistSlice.js
import { ProductFilled } from '@ant-design/icons';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Normalize base URL and ensure "/api" suffix
const rawBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const trimmed = typeof rawBase === 'string' ? rawBase.replace(/\/$/, '') : '';
const baseUrl = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
const API_URL = `${baseUrl}/wishlist`;

// -------------------
// Async Thunks (APIs)
// -------------------

// GET all wishlist items - OPTIMIZED with caching
export const fetchWishlist = createAsyncThunk(
  'wishlist/fetchWishlist', 
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState();
      const lastFetch = state.wishlist.lastFetch;
      const now = Date.now();
      
      // Cache for 30 seconds to prevent excessive API calls
      if (lastFetch && (now - lastFetch) < 30000) {
        console.log('Using cached wishlist data');
        return state.wishlist.items;
      }

      const response = await axios.get(API_URL, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      console.log('Fetched wishlist data:', response.data);
      return response.data;
    } catch (error) {
      console.error('Fetch wishlist error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch wishlist');
    }
  }
);

// POST - Add to wishlist - OPTIMIZED to update state directly
export const addToWishlistAPI = createAsyncThunk(
  'wishlist/addToWishlistAPI', 
  async (item, { getState, rejectWithValue }) => {
    try {
      const productId = item._id || item.id;
      const state = getState();   
            
      const response = await axios.post(API_URL, item, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Add to wishlist response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Add to wishlist error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to add to wishlist');
    }
  }
);

// DELETE - Remove from wishlist - OPTIMIZED to update state directly
export const removeFromWishlistAPI = createAsyncThunk(
  'wishlist/removeFromWishlistAPI', 
  async (payload, { getState, rejectWithValue }) => {
    try {
      const itemId = payload?._id || payload?.id || payload;
      console.log('Removing from wishlist - ID:', itemId);
      
      // const state = getState();
      
      // Check if item exists in wishlist
      // const itemExists = state.wishlist.items.some(wishlistItem => {
      //   const wishlistItemId = wishlistItem._id || wishlistItem.id || wishlistItem.product?._id || wishlistItem.product?.id;
      //   return wishlistItemId === itemId;
      // });
      
      // if (!itemExists) {
      //   console.log('Item not in wishlist, skipping API call');
      //   return { success: true, alreadyRemoved: true };
      // }
      
      const response = await axios.delete(`${API_URL}/${itemId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      console.log('Remove wishlist API response:', response.data);
      return { removedId: itemId, response: response.data };
    } catch (error) {
      console.error('Remove from wishlist error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from wishlist');
    }
  }
);

// PUT - Update wishlist item (optional)
export const updateWishlistItemAPI = createAsyncThunk(
  'wishlist/updateWishlistItemAPI', 
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, data, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update wishlist item');
    }
  }
);

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: {
    items: [],
    loading: false,
    error: null,
    lastFetch: null, // Add timestamp for caching
    count: 0, // Add explicit count
  },
  reducers: {
    clearWishlist: (state) => {
      state.items = [];
      state.count = 0;
      state.lastFetch = null;
    },
    addItem: (state, action) => {
      console.log("Adding item to wishlist:", action.payload);
      const exists = state.items.find(item => {
        const itemId = item._id || item.id || item.product?._id || item.product?.id;
        const payloadId = action.payload._id || action.payload.id || action.payload.product?._id || action.payload.product?.id;
        return itemId === payloadId;
      });
      if (!exists) {
        state.items.push(action.payload);
        state.count = state.items.length;
      }
    },
    removeItem: (state, action) => {
      const itemId = action.payload._id || action.payload.id || action.payload.product?._id || action.payload.product?.id;
      state.items = state.items.filter(item => {
        const currentItemId = item._id || item.id || item.product?._id || item.product?.id;
        return currentItemId !== itemId;
      });
      state.count = state.items.length;
    },
    // Add optimistic update for better UX
    optimisticAddToWishlist: (state, action) => {
      const product = action.payload;
      const productId = product._id || product.id;
      
      const exists = state.items.some(item => {
        const itemId = item._id || item.id || item.product?._id || item.product?.id;
        return itemId === productId;
      });
      
      if (!exists) {
        state.items.push(product);
        state.count = state.items.length;
        
      }
    },
    optimisticRemoveFromWishlist: (state, action) => {
      const productId = action.payload._id || action.payload.id;
      state.items = state.items.filter(item => {
        const itemId = item._id || item.id || item.product?._id || item.product?.id;
        return itemId !== productId;
      });
      state.count = state.items.length;
    },
  },
  extraReducers: (builder) => {
    builder
      // GET
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        // Handle different response structures
        let items = [];
        if (Array.isArray(action.payload)) {
          items = action.payload;
        } else if (action.payload?.items && Array.isArray(action.payload.items)) {
          items = action.payload.items;
        } else if (action.payload?.wishlist && Array.isArray(action.payload.wishlist)) {
          items = action.payload.wishlist;
        }
        
        state.items = items;
        state.count = items.length;
        state.loading = false;
        state.lastFetch = Date.now();
        console.log('Wishlist updated:', { items: items.length, count: state.count });
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch wishlist';
        console.error('Fetch wishlist failed:', action.payload);
      })

      // POST
      .addCase(addToWishlistAPI.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToWishlistAPI.fulfilled, (state, action) => {
        state.loading = false;
        
        // If already exists, don't update
        if (action.payload?.alreadyExists) {
          return;
        }
        
        // Update state with new wishlist data
        let items = [];
        if (action.payload?.wishlist) {
          items = Array.isArray(action.payload.wishlist) ? action.payload.wishlist : [];
        } else if (action.payload?.items) {
          items = Array.isArray(action.payload.items) ? action.payload.items : [];
        } else if (Array.isArray(action.payload)) {
          items = action.payload;
        } else if (action.payload?.success) {
          // If API returns success but no data, keep current state
          return;
        }
        
        if (items.length > 0) {
          state.items = items;
          state.count = items.length;
        }
      })
      .addCase(addToWishlistAPI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to add to wishlist';
        console.error('Add to wishlist failed:', action.payload);
      })

      // DELETE
      .addCase(removeFromWishlistAPI.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromWishlistAPI.fulfilled, (state, action) => {
        state.loading = false;
        
        // If already removed, don't update
        if (action.payload?.alreadyRemoved) {
          return;
        }
        
        console.log('Remove fulfilled - payload:', action.payload);
        console.log('Current state items:', state.items);
        
        const removedId = action.payload.removedId;
        
        // Handle different state structures
        if (Array.isArray(state.items)) {
          // If state.items is directly an array
          state.items = state.items.filter(item => {
            const itemId = item._id || item.id || item.product?._id || item.product?.id || item.productId;
            return itemId !== removedId;
          });
        } else if (state.items?.items && Array.isArray(state.items.items)) {
          // If state.items.items is an array (nested structure)
          state.items.items = state.items.items.filter(item => {
            const itemId = item._id || item.id || item.product?._id || item.product?.id || item.productId;
            return itemId !== removedId;
          });
        }
        
        state.count = state.items.length;
        console.log('Updated state items after removal:', state.items);
      })
      .addCase(removeFromWishlistAPI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to remove from wishlist';
        console.error('Remove from wishlist failed:', action.payload);
      })

      // PUT
      .addCase(updateWishlistItemAPI.fulfilled, (state, action) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export const { 
  addItem, 
  removeItem, 
  clearWishlist, 
  optimisticAddToWishlist, 
  optimisticRemoveFromWishlist 
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
