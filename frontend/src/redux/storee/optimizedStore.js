import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { optimizedApi } from './optimizedApi';

// Import slices
import authReducer from '../authslice';
import cartReducer from '../cartSlice';
import wishlistReducer from '../wishlistSlice';
import orderReducer from '../orderSlice';
import productReducer from '../productsSlice';
import notificationReducer from '../notificationslice';
import uiReducer from '../uiSlice';

// Optimized store configuration
export const optimizedStore = configureStore({
  reducer: {
    // API reducer
    [optimizedApi.reducerPath]: optimizedApi.reducer,
    
    // Feature reducers
    auth: authReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    order: orderReducer,
    product: productReducer,
    notification: notificationReducer,
    ui: uiReducer,
  },
  
  // Enhanced middleware configuration
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Optimize serializable check for better performance
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          optimizedApi.util.getRunningQueriesThunk.fulfilled,
          optimizedApi.util.getRunningMutationsThunk.fulfilled,
        ],
        ignoredPaths: [
          'optimizedApi',
          'persist',
        ],
      },
      // Optimize immutable check for better performance
      immutableCheck: {
        ignoredPaths: [
          'optimizedApi',
          'persist',
        ],
      },
    }).concat(optimizedApi.middleware),
  
  // Enhanced dev tools configuration
  devTools: import.meta.env.MODE !== 'production',
  
  // Preloaded state for better initial load performance
  preloadedState: {
    // Preload common data from localStorage if available
    cart: {
      items: JSON.parse(localStorage.getItem('cart') || '[]'),
      loading: false,
      error: null,
    },
    wishlist: {
      items: JSON.parse(localStorage.getItem('wishlist') || '[]'),
      loading: false,
      error: null,
    },
    auth: {
      token: localStorage.getItem('token') || null,
      user: JSON.parse(localStorage.getItem('user') || 'null'),
      isAuthenticated: !!localStorage.getItem('token'),
    },
  },
});

// Setup listeners for RTK Query
setupListeners(optimizedStore.dispatch);

// Enhanced store with performance optimizations
export const enhancedStore = {
  ...optimizedStore,
  
  // Custom dispatch with performance monitoring
  dispatch: (action) => {
    const startTime = performance.now();
    const result = optimizedStore.dispatch(action);
    const endTime = performance.now();
    
    // Log slow actions in development
    if (import.meta.env.MODE === 'development' && (endTime - startTime) > 16) {
      console.warn(`Slow action: ${action.type} took ${(endTime - startTime).toFixed(2)}ms`);
    }
    
    return result;
  },
  
  // Custom getState with memoization
  getState: () => {
    return optimizedStore.getState();
  },
  
  // Custom subscribe with performance optimization
  subscribe: (listener) => {
    let lastState = optimizedStore.getState();
    
    return optimizedStore.subscribe(() => {
      const currentState = optimizedStore.getState();
      
      // Only call listener if state actually changed
      if (currentState !== lastState) {
        lastState = currentState;
        listener();
      }
    });
  },
};

// Performance monitoring middleware
export const performanceMiddleware = (store) => (next) => (action) => {
  const startTime = performance.now();
  const result = next(action);
  const endTime = performance.now();
  
  // Track action performance
  if (import.meta.env.MODE === 'development') {
    const actionTime = endTime - startTime;
    
    // Log slow actions
    if (actionTime > 16) {
      console.warn(`Slow action: ${action.type} took ${actionTime.toFixed(2)}ms`);
    }
    
    // Track action frequency
    if (!window.actionPerformance) {
      window.actionPerformance = {};
    }
    
    if (!window.actionPerformance[action.type]) {
      window.actionPerformance[action.type] = {
        count: 0,
        totalTime: 0,
        avgTime: 0,
      };
    }
    
    const perf = window.actionPerformance[action.type];
    perf.count++;
    perf.totalTime += actionTime;
    perf.avgTime = perf.totalTime / perf.count;
  }
  
  return result;
};

// Cache management utilities
export const cacheUtils = {
  // Clear all API cache
  clearApiCache: () => {
    optimizedStore.dispatch(optimizedApi.util.resetApiState());
  },
  
  // Clear specific cache tags
  clearCacheByTag: (tag) => {
    optimizedStore.dispatch(optimizedApi.util.invalidateTags([tag]));
  },
  
  // Prefetch data for better UX
  prefetchData: (endpoint, params) => {
    optimizedStore.dispatch(optimizedApi.util.prefetch(endpoint, params));
  },
  
  // Get cache status
  getCacheStatus: () => {
    const state = optimizedStore.getState();
    return state[optimizedApi.reducerPath];
  },
};

// Store persistence utilities
export const persistenceUtils = {
  // Save state to localStorage
  saveState: (state) => {
    try {
      const serializedState = JSON.stringify(state);
      localStorage.setItem('reduxState', serializedState);
    } catch (error) {
      console.error('Failed to save state to localStorage:', error);
    }
  },
  
  // Load state from localStorage
  loadState: () => {
    try {
      const serializedState = localStorage.getItem('reduxState');
      if (serializedState === null) {
        return undefined;
      }
      return JSON.parse(serializedState);
    } catch (error) {
      console.error('Failed to load state from localStorage:', error);
      return undefined;
    }
  },
  
  // Clear persisted state
  clearState: () => {
    try {
      localStorage.removeItem('reduxState');
    } catch (error) {
      console.error('Failed to clear state from localStorage:', error);
    }
  },
};

// Auto-save state to localStorage
let saveTimeout;
optimizedStore.subscribe(() => {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    const state = optimizedStore.getState();
    persistenceUtils.saveState({
      cart: state.cart,
      wishlist: state.wishlist,
      auth: state.auth,
      ui: state.ui,
    });
  }, 1000); // Debounce saves
});

// Export store
export default enhancedStore; 