import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import {toast} from 'react-hot-toast';
import { checkProductAvailability as checkAvailability } from '../utils/availabilityUtils';
// Normalize base URL and ensure "/api" suffix
const rawBase = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const trimmedBase = typeof rawBase === 'string' ? rawBase.replace(/\/$/, '') : '';
const baseApi = trimmedBase.endsWith('/api') ? trimmedBase : `${trimmedBase}/api`;
const API_URL = `${baseApi}/cart`;

// Async Thunks

// Fetch Cart
export const fetchCart = createAsyncThunk('cart/fetchCart', async (userId) => {
  const res = await axios.get(`${API_URL}`, {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    withCredentials: true // if your API uses cookies (optional)
  });
  console.log("Fetched cart:", res.data);
  return res.data;
});

// Save/Sync Cart
export const syncCart = createAsyncThunk('cart/syncCart', async (cartData) => {
  const res = await axios.post(`${API_URL}/add`, cartData,{
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`,
      'Content-Type': 'application/json'
    },
    withCredentials: true // if your API uses cookies (optional)
  });
  return res.data;
});

export const deleteCartItem = createAsyncThunk(
  'cart/deleteItem',
  async (itemId, thunkAPI) => {
    console.log("Deleting item with ID:", itemId);
    
    const state = thunkAPI.getState(); // ✅ Access Redux state
    const userId = state.auth?.user?.id;
    
    console.log("User ID:", userId);

    if (!userId) {
      return thunkAPI.rejectWithValue("User not authenticated");
    }

    await axios.delete(`${API_URL}/${userId}/item/${itemId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    });

    return itemId;
  }
);

// Helper function to validate product availability
const validateProductAvailability = (product) => {
  // If product has availability settings, check them
  if (product.availability) {
    const availability = checkAvailability(product);
    if (!availability.isAvailable) {
      const error = new Error(availability.message);
      error.isAvailabilityRestriction = true;
      throw error;
    }
  }
  return true;
};

// Add to Cart API with optimistic updates
export const addToCartAPI = createAsyncThunk(
  'cart/addToCartAPI',
  async (item, { rejectWithValue, dispatch, getState }) => {
    try {
      console.log("Adding item to cart:", item);
      
      // Check product availability if it exists
      if (item.product?.availability || item.availability) {
        validateProductAvailability(item.product || item);
      }
      
      // Get current state to check if item already exists
      const state = getState();
      const existingItem = state.cart.items.find(cartItem => {
        if (cartItem.id === item.productId || cartItem._id === item.productId)
          return true;
        if (
          cartItem.product &&
          (cartItem.product._id === item.productId ||
            cartItem.product.id === item.productId)
        )
          return true;
        if (cartItem.productId === item.productId) return true;
        return false;
      });
      
      let optimisticItem;
      
      if (existingItem) {
        // Item exists - update quantity optimistically
        optimisticItem = {
          ...existingItem,
          quantity: existingItem.quantity + (item.quantity || 1)
        };
        dispatch(updateItemOptimistically(optimisticItem));
      } else {
        // New item - add optimistically
        optimisticItem = {
          _id: `temp_${Date.now()}`,
          product: { _id: item.productId },
          weight: item.payload?.weight || '1kg',
          quantity: item.quantity || 1,
          price: 0, // Will be updated from server response
          originalPrice: 0
        };
        dispatch(addItemOptimistically(optimisticItem));
      }
      
      const res = await axios.post(`${API_URL}/add`, item,{
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      return res.data;
    } catch (error) {
      // Revert optimistic update on error
      dispatch(revertOptimisticUpdate(item.productId));
      
      // Show toast for time restriction errors
      if (error.isTimeRestriction) {
        toast.error(error.message, { duration: 5000 });
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message, { duration: 3000 });
      } else {
        toast.error(error.message || 'Failed to add item to cart', { duration: 3000 });
      }
      
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);



// Remove from Cart API
export const removeFromCartAPI = createAsyncThunk(
  'cart/removeFromCartAPI',
  async ({ _id }, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const userId = state.auth?.user?.id;
      
      if (!userId) {
        return rejectWithValue("User not authenticated");
      }

      // Find the cart item to get its ID
      const cartItem = state.cart.items.find(item => {
        if (item.id === _id || item._id === _id)
          return true;
        if (
          item.product &&
          (item.product._id === _id ||
            item.product.id === _id)
        )
          return true;
        if (item.productId === _id) return true;
        return false;
      });

      if (!cartItem) {
        return rejectWithValue("Item not found in cart");
      }

      await axios.delete(
        `${API_URL}/${userId}/item/${cartItem._id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );

      return _id;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Simple Update Quantity API
export const updateQuantityAPI = createAsyncThunk(
  'cart/updateQuantityAPI',
  async ({ itemId, quantity }, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const userId = state.auth?.user?.id;
      
      if (!userId) {
        return rejectWithValue("User not authenticated");
      }

      const res = await axios.put(`${API_URL}/${userId}/item/${itemId}/quantity`, 
        { quantity },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        }
      );
      
      // Handle different response structures
      if (res.data?.cart) {
        return res.data.cart;
      } else if (res.data?.items) {
        return { items: res.data.items };
      } else if (res.data) {
        return res.data;
      }
      
      return { items: [] };
    } catch (error) {
      console.error('Update quantity error:', error);
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Clear Cart API
export const clearCart = createAsyncThunk(
  'cart/clearCart',
  async (_, { rejectWithValue, getState }) => {
    try {
      const state = getState();
      const userId = state.auth?.user?.id;
      
      if (!userId) {
        return rejectWithValue("User not authenticated");
      }

      // Try different possible endpoints
      try {
        await axios.delete(`${API_URL}/${userId}/clear`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        });
      } catch (clearError) {
        // If the first endpoint fails, try the alternative
        await axios.delete(`${API_URL}/clear`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          },
          withCredentials: true
        });
      }
      
      return { items: [], totalQuantity: 0, totalAmount: 0 };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const initialState = {
  items: [],
  totalQuantity: 0,
  totalAmount: 0,
  loading: false,
  error: null
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
   addItem: (state, action) => {
    const newItem = action.payload;
    // Use both _id and weight to create a unique identifier for different weight options
    const uniqueId = `${newItem._id || newItem.id}-${newItem.weight || 'default'}`;
    const existingItem = state.items.find(item => 
      `${item._id || item.id}-${item.weight || 'default'}` === uniqueId
    );
    
    if (existingItem) {
      existingItem.quantity += newItem.quantity || 1;
    } else {
      state.items.push({
        ...newItem,
        id: newItem._id || newItem.id, // Ensure id is set
        uniqueId: uniqueId, // Add unique identifier
        quantity: newItem.quantity || 1,
      });
    }
    updateTotals(state);
  },
   removeItem: (state, action) => {
    state.items = state.items.filter(item => (item.id || item._id) !== action.payload);
    updateTotals(state);
  },
  updateQuantity: (state, action) => {
    const { id, quantity } = action.payload;
    const item = state.items.find(item => (item.id || item._id) === id);
    if (item) {
      if (quantity <= 0) {
        state.items = state.items.filter(item => (item.id || item._id) !== id);
      } else {
        item.quantity = quantity;
      }
    }
    updateTotals(state);
  },
    clearCartLocal: (state) => {
      state.items = [];
      state.totalQuantity = 0;
      state.totalAmount = 0;
    },
    setCartItems: (state, action) => {
  state.items = Array.isArray(action.payload) ? action.payload : [];
  updateTotals(state);
},
    // Optimistic update reducers
    addItemOptimistically: (state, action) => {
      const newItem = action.payload;
      const existingItem = state.items.find(item => {
        const newItemId = newItem.product?._id || newItem.product?.id || newItem.productId;
        if (item.id === newItemId || item._id === newItemId)
          return true;
        if (
          item.product &&
          (item.product._id === newItemId ||
            item.product.id === newItemId)
        )
          return true;
        if (item.productId === newItemId) return true;
        return false;
      });
      
      if (existingItem) {
        existingItem.quantity += newItem.quantity || 1;
      } else {
        state.items.push(newItem);
      }
      updateTotals(state);
    },
    updateItemOptimistically: (state, action) => {
      const updatedItem = action.payload;
      const updatedItemId = updatedItem.product?._id || updatedItem.product?.id || updatedItem.productId || updatedItem._id;
      const index = state.items.findIndex(item => {
        if (item.id === updatedItemId || item._id === updatedItemId)
          return true;
        if (
          item.product &&
          (item.product._id === updatedItemId ||
            item.product.id === updatedItemId)
        )
          return true;
        if (item.productId === updatedItemId) return true;
        return false;
      });
      
      if (index !== -1) {
        state.items[index] = updatedItem;
      }
      updateTotals(state);
    },
    revertOptimisticUpdate: (state, action) => {
      const productId = action.payload;
      // Remove any temporary items for this product
      state.items = state.items.filter(item => {
        if (!item._id?.startsWith('temp_')) return true;
        
        if (item.id === productId || item._id === productId)
          return false;
        if (
          item.product &&
          (item.product._id === productId ||
            item.product.id === productId)
        )
          return false;
        if (item.productId === productId) return false;
        return true;
      });
      updateTotals(state);
    },
    clearError: (state) => {
      state.error = null;
    }

  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = Array.isArray(action.payload.cart.items) ? action.payload.cart.items : [];
        updateTotals(state);
      })      
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        // Don't set availability errors as cart errors
        const errorMessage = action.error.message;
        if (errorMessage && !errorMessage.includes('currently not available')) {
          state.error = errorMessage;
        }
      })

      // Sync Cart
      .addCase(syncCart.fulfilled, (state, action) => {
        // Optional: Update local state after successful sync
      })

      // Delete Item
      .addCase(deleteCartItem.fulfilled, (state, action) => {
        // Remove the item by its ID (could be item.id, item._id, or item.product._id)
        state.items = state.items.filter(item => 
          item.id !== action.payload && 
          item._id !== action.payload && 
          item.product?._id !== action.payload
        );
        updateTotals(state);
      })

      // Add to Cart API
      .addCase(addToCartAPI.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCartAPI.fulfilled, (state, action) => {
        state.loading = false;
        // Update with server response data
        if (action.payload?.items) {
          state.items = Array.isArray(action.payload.items) ? action.payload.items : [];
        } else if (action.payload?.cart?.items) {
          state.items = Array.isArray(action.payload.cart.items) ? action.payload.cart.items : [];
        } else if (Array.isArray(action.payload)) {
          state.items = action.payload;
        }
        updateTotals(state);
      })      
      .addCase(addToCartAPI.rejected, (state, action) => {
        state.loading = false;
        // Don't persist availability errors in cart state
        const errorMessage = action.payload?.message || action.payload;
        if (errorMessage && !errorMessage.includes('currently not available')) {
          state.error = errorMessage;
        }
        // Remove any temporary items on error
        state.items = state.items.filter(item => !item._id?.startsWith('temp_'));
        updateTotals(state);
      })



      // Remove from Cart API
      .addCase(removeFromCartAPI.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeFromCartAPI.fulfilled, (state, action) => {
        state.loading = false;
        state.items = state.items.filter(item => 
          item.product?._id !== action.payload && item.product !== action.payload
        );
        updateTotals(state);
      })
      .addCase(removeFromCartAPI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Handle updateQuantityAPI
      .addCase(updateQuantityAPI.pending, (state) => {
        // Don't set global loading for quantity updates
        state.error = null;
      })
      .addCase(updateQuantityAPI.fulfilled, (state, action) => {
        // Handle different response structures
        if (action.payload?.items) {
          state.items = Array.isArray(action.payload.items) ? action.payload.items : [];
        } else if (action.payload?.cart?.items) {
          state.items = Array.isArray(action.payload.cart.items) ? action.payload.cart.items : [];
        } else if (Array.isArray(action.payload)) {
          state.items = action.payload;
        }
        updateTotals(state);
      })
      .addCase(updateQuantityAPI.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Clear Cart
      .addCase(clearCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCart.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
        state.totalQuantity = 0;
        state.totalAmount = 0;
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

function updateTotals(state) {
  state.totalQuantity = state.items.reduce((total, item) => total + item.quantity, 0);
  state.totalAmount = state.items.reduce((total, item) => total + (item.price * item.quantity), 0);
}

export const { 
  addItem, 
  removeItem, 
  updateQuantity, 
  clearCartLocal, 
  setCartItems,
  addItemOptimistically,
  updateItemOptimistically,
  revertOptimisticUpdate,
  clearError
} = cartSlice.actions;
export default cartSlice.reducer;
