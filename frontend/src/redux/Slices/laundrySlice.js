// src/redux/Slices/laundrySlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Booking state
  currentBooking: {
    step: 1,
    service: '',
    items: {},
    pickupDate: '',
    pickupTime: '',
    deliveryDate: '',
    deliveryTime: '',
    address: {
      street: '',
      city: 'Indore',
      pincode: '',
      landmark: ''
    },
    paymentMethod: 'online',
    specialInstructions: '',
    total: 0
  },
  
  // UI state
  ui: {
    bookingLoading: false,
    trackingOrderId: '',
    selectedPlan: '',
    billingCycle: 'monthly',
    showLocationModal: false,
    mobileMenuOpen: false
  },
  
  // Cart-like functionality for laundry items
  laundryCart: {
    items: {},
    total: 0,
    itemCount: 0
  },
  
  // User preferences
  preferences: {
    defaultAddress: null,
    preferredPickupTime: '',
    preferredDeliveryTime: '',
    savedAddresses: []
  }
};

const laundrySlice = createSlice({
  name: 'laundry',
  initialState,
  reducers: {
    // Booking actions
    setBookingStep: (state, action) => {
      state.currentBooking.step = action.payload;
    },
    
    setBookingService: (state, action) => {
      state.currentBooking.service = action.payload;
      // Reset items when service changes
      state.currentBooking.items = {};
      state.currentBooking.total = 0;
    },
    
    setBookingItems: (state, action) => {
      state.currentBooking.items = action.payload;
    },
    
    updateBookingItem: (state, action) => {
      const { itemName, quantity } = action.payload;
      if (quantity <= 0) {
        delete state.currentBooking.items[itemName];
      } else {
        state.currentBooking.items[itemName] = quantity;
      }
    },
    
    setBookingSchedule: (state, action) => {
      const { pickupDate, pickupTime, deliveryDate, deliveryTime } = action.payload;
      state.currentBooking.pickupDate = pickupDate || state.currentBooking.pickupDate;
      state.currentBooking.pickupTime = pickupTime || state.currentBooking.pickupTime;
      state.currentBooking.deliveryDate = deliveryDate || state.currentBooking.deliveryDate;
      state.currentBooking.deliveryTime = deliveryTime || state.currentBooking.deliveryTime;
    },
    
    setBookingAddress: (state, action) => {
      state.currentBooking.address = { ...state.currentBooking.address, ...action.payload };
    },
    
    setBookingPayment: (state, action) => {
      state.currentBooking.paymentMethod = action.payload;
    },
    
    setSpecialInstructions: (state, action) => {
      state.currentBooking.specialInstructions = action.payload;
    },
    
    setBookingTotal: (state, action) => {
      state.currentBooking.total = action.payload;
    },
    
    resetBooking: (state) => {
      state.currentBooking = { ...initialState.currentBooking };
    },
    
    // UI actions
    setBookingLoading: (state, action) => {
      state.ui.bookingLoading = action.payload;
    },
    
    setTrackingOrderId: (state, action) => {
      state.ui.trackingOrderId = action.payload;
    },
    
    setSelectedPlan: (state, action) => {
      state.ui.selectedPlan = action.payload;
    },
    
    setBillingCycle: (state, action) => {
      state.ui.billingCycle = action.payload;
    },
    
    setShowLocationModal: (state, action) => {
      state.ui.showLocationModal = action.payload;
    },
    
    setMobileMenuOpen: (state, action) => {
      state.ui.mobileMenuOpen = action.payload;
    },
    
    // Laundry cart actions
    addToLaundryCart: (state, action) => {
      const { itemName, quantity, price } = action.payload;
      state.laundryCart.items[itemName] = {
        quantity: (state.laundryCart.items[itemName]?.quantity || 0) + quantity,
        price
      };
      
      // Recalculate totals
      state.laundryCart.total = Object.values(state.laundryCart.items).reduce(
        (total, item) => total + (item.quantity * item.price), 0
      );
      state.laundryCart.itemCount = Object.values(state.laundryCart.items).reduce(
        (count, item) => count + item.quantity, 0
      );
    },
    
    removeFromLaundryCart: (state, action) => {
      const itemName = action.payload;
      delete state.laundryCart.items[itemName];
      
      // Recalculate totals
      state.laundryCart.total = Object.values(state.laundryCart.items).reduce(
        (total, item) => total + (item.quantity * item.price), 0
      );
      state.laundryCart.itemCount = Object.values(state.laundryCart.items).reduce(
        (count, item) => count + item.quantity, 0
      );
    },
    
    updateLaundryCartItem: (state, action) => {
      const { itemName, quantity } = action.payload;
      if (quantity <= 0) {
        delete state.laundryCart.items[itemName];
      } else {
        state.laundryCart.items[itemName].quantity = quantity;
      }
      
      // Recalculate totals
      state.laundryCart.total = Object.values(state.laundryCart.items).reduce(
        (total, item) => total + (item.quantity * item.price), 0
      );
      state.laundryCart.itemCount = Object.values(state.laundryCart.items).reduce(
        (count, item) => count + item.quantity, 0
      );
    },
    
    clearLaundryCart: (state) => {
      state.laundryCart = { ...initialState.laundryCart };
    },
    
    // Preferences actions
    setDefaultAddress: (state, action) => {
      state.preferences.defaultAddress = action.payload;
    },
    
    addSavedAddress: (state, action) => {
      const address = action.payload;
      const existingIndex = state.preferences.savedAddresses.findIndex(
        addr => addr.id === address.id
      );
      
      if (existingIndex >= 0) {
        state.preferences.savedAddresses[existingIndex] = address;
      } else {
        state.preferences.savedAddresses.push(address);
      }
    },
    
    removeSavedAddress: (state, action) => {
      const addressId = action.payload;
      state.preferences.savedAddresses = state.preferences.savedAddresses.filter(
        addr => addr.id !== addressId
      );
    },
    
    setPreferredTimes: (state, action) => {
      const { pickupTime, deliveryTime } = action.payload;
      if (pickupTime) state.preferences.preferredPickupTime = pickupTime;
      if (deliveryTime) state.preferences.preferredDeliveryTime = deliveryTime;
    }
  }
});

// Export actions
export const {
  // Booking actions
  setBookingStep,
  setBookingService,
  setBookingItems,
  updateBookingItem,
  setBookingSchedule,
  setBookingAddress,
  setBookingPayment,
  setSpecialInstructions,
  setBookingTotal,
  resetBooking,
  
  // UI actions
  setBookingLoading,
  setTrackingOrderId,
  setSelectedPlan,
  setBillingCycle,
  setShowLocationModal,
  setMobileMenuOpen,
  
  // Laundry cart actions
  addToLaundryCart,
  removeFromLaundryCart,
  updateLaundryCartItem,
  clearLaundryCart,
  
  // Preferences actions
  setDefaultAddress,
  addSavedAddress,
  removeSavedAddress,
  setPreferredTimes
} = laundrySlice.actions;

// Selectors
export const selectCurrentBooking = (state) => state.laundry.currentBooking;
export const selectBookingStep = (state) => state.laundry.currentBooking.step;
export const selectBookingService = (state) => state.laundry.currentBooking.service;
export const selectBookingItems = (state) => state.laundry.currentBooking.items;
export const selectBookingTotal = (state) => state.laundry.currentBooking.total;
export const selectBookingAddress = (state) => state.laundry.currentBooking.address;

export const selectLaundryUI = (state) => state.laundry.ui;
export const selectBookingLoading = (state) => state.laundry.ui.bookingLoading;
export const selectTrackingOrderId = (state) => state.laundry.ui.trackingOrderId;
export const selectSelectedPlan = (state) => state.laundry.ui.selectedPlan;
export const selectBillingCycle = (state) => state.laundry.ui.billingCycle;

export const selectLaundryCart = (state) => state.laundry.laundryCart;
export const selectLaundryCartItems = (state) => state.laundry.laundryCart.items;
export const selectLaundryCartTotal = (state) => state.laundry.laundryCart.total;
export const selectLaundryCartItemCount = (state) => state.laundry.laundryCart.itemCount;

export const selectLaundryPreferences = (state) => state.laundry.preferences;
export const selectDefaultAddress = (state) => state.laundry.preferences.defaultAddress;
export const selectSavedAddresses = (state) => state.laundry.preferences.savedAddresses;

// Export reducer
export default laundrySlice.reducer;
