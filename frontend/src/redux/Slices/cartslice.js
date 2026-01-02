// src/store/slices/cartSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { toast } from 'react-hot-toast';
import { useCategoryTimeRestriction } from '../../hooks/useCategoryTimeRestriction';
import { checkProductAvailability } from '../../utils/availabilityUtils';

const initialState = {
  items: [],
  totalAmount: 0,
  totalItems: 0,
  selectedPlan: null,
  selectedDuration: null,
  selectedDate: null,
  selectedSlot: null,
  addOns: [],
  customizations: {},
  isOpen: false,
  loading: false,
  error: null,
  isInitialized: false
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const { checkAndNotify } = useCategoryTimeRestriction();
      const item = action.payload;
      
      // Check product availability before adding to cart
      if (item.availability) {
        const availability = checkProductAvailability(item);
        if (!availability.isAvailable) {
          toast.error(availability.message);
          return state; // Don't add to cart if not available
        }
      }
      
      // Check time restriction before adding to cart
      if (item.categoryId && !checkAndNotify(item.categoryId, item.name)) {
        return state; // Don't add to cart if not allowed
      }
      
      const existingItem = state.items.find(i => 
        (i.id === item.id || i._id === item._id || i.product?._id === item.product?._id) &&
        i.weight === item.weight
      );
      
      if (existingItem) {
        existingItem.quantity += item.quantity || 1;
      } else {
        state.items.push({
          ...item,
          quantity: item.quantity || 1
        });
      }
      
      cartSlice.caseReducers.calculateTotals(state);
      toast.success(`${item.name} added to cart!`);
    },
    
    removeFromCart: (state, action) => {
      const itemId = action.payload;
      state.items = state.items.filter(item => 
        item.id !== itemId && 
        item._id !== itemId && 
        item.product?._id !== itemId
      );
      cartSlice.caseReducers.calculateTotals(state);
    },
    
    updateCartQuantity: (state, action) => {
      const { id, quantity } = action.payload;
      const item = state.items.find(i => 
        i.id === id || i._id === id || i.product?._id === id
      );
      
      if (item) {
        item.quantity = quantity;
        if (quantity <= 0) {
          state.items = state.items.filter(i => i !== item);
        }
      }
      cartSlice.caseReducers.calculateTotals(state);
    },
    
    setCartItems: (state, action) => {
      state.items = Array.isArray(action.payload) ? action.payload : [];
      cartSlice.caseReducers.calculateTotals(state);
      state.isInitialized = true;
    },
    
    calculateTotals: (state) => {
      state.totalItems = state.items.reduce((total, item) => total + (item.quantity || 0), 0);
      state.totalAmount = state.items.reduce((total, item) => {
        const price = item.price || 0;
        const quantity = item.quantity || 0;
        return total + (price * quantity);
      }, 0);
    },
    
    clearCartLocal: (state) => {
      state.items = [];
      state.totalAmount = 0;
      state.totalItems = 0;
      state.selectedPlan = null;
      state.selectedDuration = null;
      state.addOns = [];
      state.customizations = {};
    },
    
    setSelectedPlan: (state, action) => {
      state.selectedPlan = action.payload;
    },
    
    setSelectedDuration: (state, action) => {
      state.selectedDuration = action.payload;
    },
    
    setSelectedDate: (state, action) => {
      state.selectedDate = action.payload;
    },
    
    setSelectedSlot: (state, action) => {
      state.selectedSlot = action.payload;
    },
    
    addAddOn: (state, action) => {
      const addOn = action.payload;
      const existingAddOn = state.addOns.find(a => a.name === addOn.name);
      
      if (existingAddOn) {
        existingAddOn.quantity += addOn.quantity || 1;
      } else {
        state.addOns.push({...addOn, quantity: addOn.quantity || 1});
      }
    },
    
    removeAddOn: (state, action) => {
      const addOnName = action.payload;
      state.addOns = state.addOns.filter(addOn => addOn.name !== addOnName);
    },
    
    updateCustomization: (state, action) => {
      const { key, value } = action.payload;
      state.customizations[key] = value;
    },
    
    toggleCart: (state) => {
      state.isOpen = !state.isOpen;
    },
    
    openCart: (state) => {
      state.isOpen = true;
    },
    
    closeCart: (state) => {
      state.isOpen = false;
    },
    
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    
    setError: (state, action) => {
      state.error = action.payload;
    },
    
    resetError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Cart
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.isInitialized = true;
        cartSlice.caseReducers.calculateTotals(state);
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.isInitialized = true;
      })
      
      // Sync Cart
      .addCase(syncCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(syncCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        cartSlice.caseReducers.calculateTotals(state);
      })
      .addCase(syncCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update Quantity
      .addCase(updateQuantity.fulfilled, (state, action) => {
        state.items = action.payload;
        cartSlice.caseReducers.calculateTotals(state);
      })
      .addCase(updateQuantity.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Delete Cart Item
      .addCase(deleteCartItem.fulfilled, (state, action) => {
        state.items = action.payload;
        cartSlice.caseReducers.calculateTotals(state);
      })
      .addCase(deleteCartItem.rejected, (state, action) => {
        state.error = action.payload;
      })
      
      // Clear Cart
      .addCase(clearCart.fulfilled, (state) => {
        state.items = [];
        state.totalAmount = 0;
        state.totalItems = 0;
        state.selectedPlan = null;
        state.selectedDuration = null;
        state.addOns = [];
        state.customizations = {};
      })
      .addCase(clearCart.rejected, (state, action) => {
        state.error = action.payload;
      });
  }
});

export const {
  addToCart,
  removeFromCart,
  updateCartQuantity,
  setCartItems,
  calculateTotals,
  clearCartLocal,
  setSelectedPlan,
  setSelectedDuration,
  setSelectedDate,
  setSelectedSlot,
  addAddOn,
  removeAddOn,
  updateCustomization,
  toggleCart,
  openCart,
  closeCart,
  setLoading,
  setError,
  resetError
} = cartSlice.actions;

export default cartSlice.reducer;