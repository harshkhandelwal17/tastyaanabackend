// src/store/slices/mealPlanSlice.js
import { createSlice, createSelector } from '@reduxjs/toolkit';
// import { api } from '../storee/api';

const initialState = {
  // Current view state
  selectedMealPlan: null,
  viewMode: 'grid', // 'grid' | 'list'
  
  // Filters and search
  filters: {
    tier: 'all', // 'all' | 'low' | 'basic' | 'premium'
    priceRange: { min: 0, max: 1000 },
    tags: [],
    isPopular: false,
    status: 'active'
  },
  searchTerm: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  
  // Pagination
  currentPage: 1,
  itemsPerPage: 12,
  
  // UI state
  isLoading: false,
  error: null,
  
  // Comparison feature
  compareList: [],
  maxCompareItems: 3,
  
  // Favorites
  favorites: [],
  
  // Recently viewed
  recentlyViewed: [],
  maxRecentItems: 10,
  
  // Selected add-ons for current meal plan
  selectedAddOns: {},
  
  // Customizations
  customizations: {
    dietaryPreferences: [],
    allergies: [],
    spiceLevel: 'medium'
  }
};

const mealPlanSlice = createSlice({
  name: 'mealPlan',
  initialState,
  reducers: {
    // View and navigation
    setSelectedMealPlan: (state, action) => {
      state.selectedMealPlan = action.payload;
      
      // Add to recently viewed
      if (action.payload && !state.recentlyViewed.includes(action.payload)) {
        state.recentlyViewed.unshift(action.payload);
        if (state.recentlyViewed.length > state.maxRecentItems) {
          state.recentlyViewed.pop();
        }
      }
    },
    
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },
    
    // Filters and search
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.currentPage = 1; // Reset pagination when filters change
    },
    
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.searchTerm = '';
      state.currentPage = 1;
    },
    
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
      state.currentPage = 1;
    },
    
    setSorting: (state, action) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
      state.currentPage = 1;
    },
    
    // Pagination
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    
    setItemsPerPage: (state, action) => {
      state.itemsPerPage = action.payload;
      state.currentPage = 1;
    },
    
    // Comparison
    addToCompare: (state, action) => {
      const mealPlanId = action.payload;
      if (!state.compareList.includes(mealPlanId) && state.compareList.length < state.maxCompareItems) {
        state.compareList.push(mealPlanId);
      }
    },
    
    removeFromCompare: (state, action) => {
      state.compareList = state.compareList.filter(id => id !== action.payload);
    },
    
    clearCompareList: (state) => {
      state.compareList = [];
    },
    
    // Favorites
    toggleFavorite: (state, action) => {
      const mealPlanId = action.payload;
      const index = state.favorites.indexOf(mealPlanId);
      
      if (index === -1) {
        state.favorites.push(mealPlanId);
      } else {
        state.favorites.splice(index, 1);
      }
    },
    
    setFavorites: (state, action) => {
      state.favorites = action.payload;
    },
    
    // Add-ons management
    toggleAddOn: (state, action) => {
      const { mealPlanId, addOnId } = action.payload;
      
      if (!state.selectedAddOns[mealPlanId]) {
        state.selectedAddOns[mealPlanId] = [];
      }
      
      const addOns = state.selectedAddOns[mealPlanId];
      const index = addOns.indexOf(addOnId);
      
      if (index === -1) {
        addOns.push(addOnId);
      } else {
        addOns.splice(index, 1);
      }
    },
    
    clearAddOns: (state, action) => {
      const mealPlanId = action.payload;
      state.selectedAddOns[mealPlanId] = [];
    },
    
    setSelectedAddOns: (state, action) => {
      const { mealPlanId, addOnIds } = action.payload;
      state.selectedAddOns[mealPlanId] = addOnIds;
    },
    
    // Customizations
    setCustomizations: (state, action) => {
      state.customizations = { ...state.customizations, ...action.payload };
    },
    
    resetCustomizations: (state) => {
      state.customizations = initialState.customizations;
    },
    
    // UI state
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    
    setError: (state, action) => {
      state.error = action.payload;
    },
    
    clearError: (state) => {
      state.error = null;
    }
  },
  
  extraReducers: (builder) => {
    // Handle RTK Query states
    builder
      .addMatcher(
        (action) => action.type.endsWith('/pending') && action.type.includes('getMealPlans'),
        (state) => {
          state.isLoading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith('/fulfilled') && action.type.includes('getMealPlans'),
        (state) => {
          state.isLoading = false;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith('/rejected') && action.type.includes('getMealPlans'),
        (state, action) => {
          state.isLoading = false;
          state.error = action.error?.message || 'Failed to fetch meal plans';
        }
      )
      .addMatcher(
        (action) => action.type.endsWith('/pending') && action.type.includes('getMealPlan'),
        (state) => {
          state.isLoading = true;
          state.error = null;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith('/fulfilled') && action.type.includes('getMealPlan'),
        (state) => {
          state.isLoading = false;
        }
      )
      .addMatcher(
        (action) => action.type.endsWith('/rejected') && action.type.includes('getMealPlan'),
        (state, action) => {
          state.isLoading = false;
          state.error = action.error?.message || 'Failed to fetch meal plan';
        }
      );
  }
});

// Selectors
export const selectMealPlanState = (state) => state.mealPlan;
export const selectSelectedMealPlan = (state) => state.mealPlan.selectedMealPlan;
export const selectFilters = (state) => state.mealPlan.filters;
export const selectSearchTerm = (state) => state.mealPlan.searchTerm;
export const selectCompareList = (state) => state.mealPlan.compareList;
export const selectFavorites = (state) => state.mealPlan.favorites;
export const selectSelectedAddOns = (state) => state.mealPlan.selectedAddOns;
export const selectCustomizations = (state) => state.mealPlan.customizations;

// Memoized selectors
export const selectMealPlanQuery = createSelector(
  [selectFilters, selectSearchTerm, (state) => state.mealPlan.currentPage, (state) => state.mealPlan.itemsPerPage, (state) => state.mealPlan.sortBy, (state) => state.mealPlan.sortOrder],
  (filters, searchTerm, page, limit, sortBy, sortOrder) => ({
    ...filters,
    searchTerm,
    page,
    limit,
    sortBy,
    sortOrder
  })
);

export const selectIsInCompareList = createSelector(
  [selectCompareList, (state, mealPlanId) => mealPlanId],
  (compareList, mealPlanId) => compareList.includes(mealPlanId)
);

export const selectIsFavorite = createSelector(
  [selectFavorites, (state, mealPlanId) => mealPlanId],
  (favorites, mealPlanId) => favorites.includes(mealPlanId)
);

export const selectMealPlanAddOns = createSelector(
  [selectSelectedAddOns, (state, mealPlanId) => mealPlanId],
  (selectedAddOns, mealPlanId) => selectedAddOns[mealPlanId] || []
);

export const {
  setSelectedMealPlan,
  setViewMode,
  setFilters,
  resetFilters,
  setSearchTerm,
  setSorting,
  setCurrentPage,
  setItemsPerPage,
  addToCompare,
  removeFromCompare,
  clearCompareList,
  toggleFavorite,
  setFavorites,
  toggleAddOn,
  clearAddOns,
  setSelectedAddOns,
  setCustomizations,
  resetCustomizations,
  setLoading,
  setError,
  clearError
} = mealPlanSlice.actions;

export default mealPlanSlice.reducer;

// // src/store/slices/authSlice.js
// import { createSlice } from '@reduxjs/toolkit';
// import { api } from '../api';

// const initialState = {
//   user: null,
//   token: localStorage.getItem('token'),
//   isAuthenticated: false,
//   isLoading: false,
//   error: null
// };

// const authSlice = createSlice({
//   name: 'auth',
//   initialState,
//   reducers: {
//     logout: (state) => {
//       state.user = null;
//       state.token = null;
//       state.isAuthenticated = false;
//       localStorage.removeItem('token');
//     },
//     clearError: (state) => {
//       state.error = null;
//     }
//   },
//   extraReducers: (builder) => {
//     builder
//       .addMatcher(api.endpoints.login.matchPending, (state) => {
//         state.isLoading = true;
//         state.error = null;
//       })
//       .addMatcher(api.endpoints.login.matchFulfilled, (state, action) => {
//         state.isLoading = false;
//         state.isAuthenticated = true;
//         state.user = action.payload.user;
//         state.token = action.payload.token;
//         localStorage.setItem('token', action.payload.token);
//       })
//       .addMatcher(api.endpoints.login.matchRejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.error.message;
//       })
//       .addMatcher(api.endpoints.register.matchPending, (state) => {
//         state.isLoading = true;
//         state.error = null;
//       })
//       .addMatcher(api.endpoints.register.matchFulfilled, (state, action) => {
//         state.isLoading = false;
//         state.isAuthenticated = true;
//         state.user = action.payload.user;
//         state.token = action.payload.token;
//         localStorage.setItem('token', action.payload.token);
//       })
//       .addMatcher(api.endpoints.register.matchRejected, (state, action) => {
//         state.isLoading = false;
//         state.error = action.error.message;
//       })
//       .addMatcher(api.endpoints.getProfile.matchFulfilled, (state, action) => {
//         state.user = action.payload;
//         state.isAuthenticated = true;
//       });
//   }
// });

// export const { logout, clearError } = authSlice.actions;
// export default authSlice.reducer;

// // src/store/slices/cartSlice.js
// import { createSlice } from '@reduxjs/toolkit';

// const initialState = {
//   items: [],
//   totalAmount: 0,
//   totalItems: 0,
//   isOpen: false,
//   appliedCoupon: null,
//   discount: 0
// };

// const cartSlice = createSlice({
//   name: 'cart',
//   initialState,
//   reducers: {
//     addToCart: (state, action) => {
//       const { mealPlan, plan, addOns = [], quantity = 1, customizations = {} } = action.payload;
      
//       const existingItemIndex = state.items.findIndex(
//         item => item.mealPlan._id === mealPlan._id && 
//                 item.plan.duration === plan.duration &&
//                 JSON.stringify(item.addOns) === JSON.stringify(addOns)
//       );
      
//       if (existingItemIndex >= 0) {
//         state.items[existingItemIndex].quantity += quantity;
//       } else {
//         state.items.push({
//           id: Date.now(),
//           mealPlan,
//           plan,
//           addOns,
//           customizations,
//           quantity,
//           subtotal: plan.price + addOns.reduce((sum, addon) => sum + addon.price, 0)
//         });
//       }
      
//       // Recalculate totals
//       cartSlice.caseReducers.calculateTotals(state);
//     },
    
//     removeFromCart: (state, action) => {
//       state.items = state.items.filter(item => item.id !== action.payload);
//       cartSlice.caseReducers.calculateTotals(state);
//     },
    
//     updateQuantity: (state, action) => {
//       const { id, quantity } = action.payload;
//       const item = state.items.find(item => item.id === id);
      
//       if (item) {
//         item.quantity = quantity;
//         if (quantity <= 0) {
//           state.items = state.items.filter(item => item.id !== id);
//         }
//       }
      
//       cartSlice.caseReducers.calculateTotals(state);
//     },
    
//     clearCart: (state) => {
//       state.items = [];
//       state.totalAmount = 0;
//       state.totalItems = 0;
//       state.appliedCoupon = null;
//       state.discount = 0;
//     },
    
//     toggleCart: (state) => {
//       state.isOpen = !state.isOpen;
//     },
    
//     setCartOpen: (state, action) => {
//       state.isOpen = action.payload;
//     },
    
//     applyCoupon: (state, action) => {
//       const { coupon, discountAmount } = action.payload;
//       state.appliedCoupon = coupon;
//       state.discount = discountAmount;
//       cartSlice.caseReducers.calculateTotals(state);
//     },
    
//     removeCoupon: (state) => {
//       state.appliedCoupon = null;
//       state.discount = 0;
//       cartSlice.caseReducers.calculateTotals(state);
//     },
    
//     calculateTotals: (state) => {
//       state.totalItems = state.items.reduce((total, item) => total + item.quantity, 0);
      
//       const subtotal = state.items.reduce((total, item) => {
//         return total + (item.subtotal * item.quantity);
//       }, 0);
      
//       state.totalAmount = Math.max(0, subtotal - state.discount);
//     }
//   }
// });

// export const {
//   addToCart,
//   removeFromCart,
//   updateQuantity,
//   clearCart,
//   toggleCart,
//   setCartOpen,
//   applyCoupon,
//   removeCoupon
// } = cartSlice.actions;

// export default cartSlice.reducer;

// // src/store/slices/uiSlice.js
// import { createSlice } from '@reduxjs/toolkit';

// const initialState = {
//   theme: 'light',
//   sidebarOpen: false,
//   notifications: [],
//   modals: {
//     login: false,
//     register: false,
//     mealPlanDetails: false,
//     compareModal: false,
//     filterModal: false
//   },
//   toasts: [],
//   loading: {
//     global: false,
//     mealPlans: false,
//     orders: false
//   }
// };

// const uiSlice = createSlice({
//   name: 'ui',
//   initialState,
//   reducers: {
//     setTheme: (state, action) => {
//       state.theme = action.payload;
//       localStorage.setItem('theme', action.payload);
//     },
    
//     toggleSidebar: (state) => {
//       state.sidebarOpen = !state.sidebarOpen;
//     },
    
//     setSidebarOpen: (state, action) => {
//       state.sidebarOpen = action.payload;
//     },
    
//     openModal: (state, action) => {
//       state.modals[action.payload] = true;
//     },
    
//     closeModal: (state, action) => {
//       state.modals[action.payload] = false;
//     },
    
//     closeAllModals: (state) => {
//       Object.keys(state.modals).forEach(modal => {
//         state.modals[modal] = false;
//       });
//     },
    
//     addNotification: (state, action) => {
//       state.notifications.push({
//         id: Date.now(),
//         ...action.payload,
//         timestamp: new Date().toISOString()
//       });
//     },
    
//     removeNotification: (state, action) => {
//       state.notifications = state.notifications.filter(
//         notification => notification.id !== action.payload
//       );
//     },
    
//     markNotificationRead: (state, action) => {
//       const notification = state.notifications.find(n => n.id === action.payload);
//       if (notification) {
//         notification.read = true;
//       }
//     },
    
//     clearAllNotifications: (state) => {
//       state.notifications = [];
//     },
    
//     addToast: (state, action) => {
//       state.toasts.push({
//         id: Date.now(),
//         ...action.payload,
//         timestamp: new Date().toISOString()
//       });
//     },
    
//     removeToast: (state, action) => {
//       state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
//     },
    
//     setLoading: (state, action) => {
//       const { key, isLoading } = action.payload;
//       state.loading[key] = isLoading;
//     }
//   }
// });

// export const {
//   setTheme,
//   toggleSidebar,
//   setSidebarOpen,
//   openModal,
//   closeModal,
//   closeAllModals,
//   addNotification,
//   removeNotification,
//   markNotificationRead,
//   clearAllNotifications,
//   addToast,
//   removeToast,
//   setLoading
// } = uiSlice.actions;

// export default uiSlice.reducer;

// // src/hooks/redux.js
// import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
// import type { RootState, AppDispatch } from '../store';

// export const useAppDispatch = () => useDispatch<AppDispatch>();
// export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;