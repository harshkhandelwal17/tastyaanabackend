// src/store/slices/uiSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Loading states
  isLoading: false,
  pageLoading: false,
  
  // Modal states
  isLoginModalOpen: false,
  isRegisterModalOpen: false,
  isAddressModalOpen: false,
  isReviewModalOpen: false,
  
  // Notification states
  notifications: [],
  unreadCount: 0,
  
  // Theme and preferences
  theme: 'light',
  language: 'en',
  
  // Search and filters
  searchQuery: '',
  activeFilters: {},
  
  // Mobile responsive states
  isMobileMenuOpen: false,
  isSidebarOpen: false,
  
  // Toast notifications
  toasts: [],
  
  // Error states
  error: null,
  errorCode: null
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    // Loading actions
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    
    setPageLoading: (state, action) => {
      state.pageLoading = action.payload;
    },
    
    // Modal actions
    openLoginModal: (state) => {
      state.isLoginModalOpen = true;
      state.isRegisterModalOpen = false;
    },
    
    closeLoginModal: (state) => {
      state.isLoginModalOpen = false;
    },
    
    openRegisterModal: (state) => {
      state.isRegisterModalOpen = true;
      state.isLoginModalOpen = false;
    },
    
    closeRegisterModal: (state) => {
      state.isRegisterModalOpen = false;
    },
    
    openAddressModal: (state) => {
      state.isAddressModalOpen = true;
    },
    
    closeAddressModal: (state) => {
      state.isAddressModalOpen = false;
    },
    
    openReviewModal: (state) => {
      state.isReviewModalOpen = true;
    },
    
    closeReviewModal: (state) => {
      state.isReviewModalOpen = false;
    },
    
    // Notification actions
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount += 1;
      }
    },
    
    markNotificationRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.read) {
        notification.read = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    
    markAllNotificationsRead: (state) => {
      state.notifications.forEach(n => n.read = true);
      state.unreadCount = 0;
    },
    
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
    
    // Theme actions
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem('theme', action.payload);
    },
    
    setLanguage: (state, action) => {
      state.language = action.payload;
      localStorage.setItem('language', action.payload);
    },
    
    // Search and filter actions
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    
    setActiveFilters: (state, action) => {
      state.activeFilters = action.payload;
    },
    
    updateFilter: (state, action) => {
      const { key, value } = action.payload;
      if (value === null || value === undefined || value === '') {
        delete state.activeFilters[key];
      } else {
        state.activeFilters[key] = value;
      }
    },
    
    clearFilters: (state) => {
      state.activeFilters = {};
    },
    
    // Mobile actions
    toggleMobileMenu: (state) => {
      state.isMobileMenuOpen = !state.isMobileMenuOpen;
    },
    
    closeMobileMenu: (state) => {
      state.isMobileMenuOpen = false;
    },
    
    toggleSidebar: (state) => {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    
    closeSidebar: (state) => {
      state.isSidebarOpen = false;
    },
    
    // Toast actions
    addToast: (state, action) => {
      const toast = {
        id: Date.now() + Math.random(),
        timestamp: Date.now(),
        ...action.payload
      };
      state.toasts.push(toast);
    },
    
    removeToast: (state, action) => {
      state.toasts = state.toasts.filter(toast => toast.id !== action.payload);
    },
    
    clearToasts: (state) => {
      state.toasts = [];
    },
    
    // Error actions
    setError: (state, action) => {
      state.error = action.payload.message;
      state.errorCode = action.payload.code;
    },
    
    clearError: (state) => {
      state.error = null;
      state.errorCode = null;
    }
  }
});

export const {
  // Loading
  setLoading,
  setPageLoading,
  
  // Modals
  openLoginModal,
  closeLoginModal,
  openRegisterModal,
  closeRegisterModal,
  openAddressModal,
  closeAddressModal,
  openReviewModal,
  closeReviewModal,
  
  // Notifications
  addNotification,
  markNotificationRead,
  markAllNotificationsRead,
  clearNotifications,
  
  // Theme
  setTheme,
  setLanguage,
  
  // Search & Filters
  setSearchQuery,
  setActiveFilters,
  updateFilter,
  clearFilters,
  
  // Mobile
  toggleMobileMenu,
  closeMobileMenu,
  toggleSidebar,
  closeSidebar,
  
  // Toasts
  addToast,
  removeToast,
  clearToasts,
  
  // Error
  setError,
  clearError
} = uiSlice.actions;

export default uiSlice.reducer;