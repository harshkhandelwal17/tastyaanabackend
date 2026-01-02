// src/hooks/useCart.js
import { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchCart, 
  setCartItems, 
  clearCart as clearCartAction,
  syncCart 
} from '../redux/cartSlice';
import { 
  saveCartToStorage, 
  loadCartFromStorage, 
  clearCartFromStorage,
  cleanCartItems,
  mergeCartItems
} from '../utils/cartUtils';

/**
 * Custom hook for cart management with localStorage persistence
 * @returns {Object} Cart state and methods
 */
export const useCart = () => {
  const dispatch = useDispatch();
  
  // Get cart state from Redux
  const { 
    items: cartItems, 
    loading, 
    error, 
    isInitialized,
    totalAmount,
    totalItems 
  } = useSelector(state => state.cart);
  
  // Get user authentication state
  const user = useSelector(state => state.auth?.user);

  /**
   * Initialize cart from localStorage and/or backend
   */
  const initializeCart = useCallback(async () => {
    try {
      // If already initialized and has items, no need to reload
      if (isInitialized && cartItems.length > 0) {
        return;
      }

      // First, try to load from localStorage
      const localCart = loadCartFromStorage();
      const cleanedLocalCart = cleanCartItems(localCart);

      if (cleanedLocalCart.length > 0 && !isInitialized) {
        // Set items from localStorage immediately for better UX
        dispatch(setCartItems(cleanedLocalCart));
      }

      // If user is logged in, try to fetch from backend
      if (user) {
        try {
          const backendCartAction = await dispatch(fetchCart());
          
          if (backendCartAction.type === fetchCart.fulfilled.type) {
            const backendCart = backendCartAction.payload || [];
            
            // If we have both local and backend cart, merge them
            if (cleanedLocalCart.length > 0 && backendCart.length > 0) {
              const mergedCart = mergeCartItems(cleanedLocalCart, backendCart);
              dispatch(setCartItems(mergedCart));
              saveCartToStorage(mergedCart);
              
              // Optionally sync merged cart back to backend
              dispatch(syncCart(mergedCart));
            } else if (backendCart.length > 0) {
              // Use backend cart if no local cart
              saveCartToStorage(backendCart);
            } else if (cleanedLocalCart.length > 0) {
              // Sync local cart to backend if no backend cart
              dispatch(syncCart(cleanedLocalCart));
            }
          }
        } catch (backendError) {
          console.error('Error fetching cart from backend:', backendError);
          // Continue with local cart even if backend fails
        }
      }
    } catch (error) {
      console.error('Error initializing cart:', error);
    }
  }, [dispatch, user, isInitialized, cartItems.length]);

  /**
   * Save cart to localStorage whenever cart changes
   */
  useEffect(() => {
    if (isInitialized) {
      saveCartToStorage(cartItems);
    }
  }, [cartItems, isInitialized]);

  /**
   * Clear cart completely (Redux + localStorage + backend)
   */
  const clearCart = useCallback(async () => {
    try {
      // Clear from Redux
      await dispatch(clearCartAction()).unwrap();
      
      // Clear from localStorage
      clearCartFromStorage();
      
      console.log('✅ Cart cleared completely');
    } catch (error) {
      console.error('❌ Error clearing cart:', error);
      // Still clear localStorage even if backend fails
      clearCartFromStorage();
      throw error;
    }
  }, [dispatch]);

  /**
   * Add item to cart with persistence
   */
  const addToCart = useCallback(async (item) => {
    try {
      // Validate item before adding
      if (!item || typeof item !== 'object') {
        throw new Error('Invalid item data');
      }

      // Add item to Redux cart (this will trigger localStorage save via useEffect)
      dispatch(addToCart(item));
      
      // If user is logged in, sync to backend
      if (user) {
        dispatch(syncCart([...cartItems, item]));
      }
      
      return true;
    } catch (error) {
      console.error('Error adding item to cart:', error);
      throw error;
    }
  }, [dispatch, user, cartItems]);

  /**
   * Get cart summary
   */
  const getCartSummary = useCallback(() => {
    const subtotal = cartItems.reduce((total, item) => 
      total + (item.price || 0) * (item.quantity || 0), 0
    );
    const shipping = subtotal > 500 ? 0 : 50;
    const tax = Math.round(subtotal * 0.05 * 100) / 100;
    const total = Math.round((subtotal + shipping + tax) * 100) / 100;
    const itemCount = cartItems.reduce((count, item) => 
      count + (item.quantity || 0), 0
    );

    return {
      subtotal,
      shipping,
      tax,
      total,
      itemCount,
      items: cartItems
    };
  }, [cartItems]);

  /**
   * Get cart summary with charges (for checkout)
   */
  const getCartSummaryWithCharges = useCallback(async (charges = []) => {
    const subtotal = cartItems.reduce((total, item) => 
      total + (item.price || 0) * (item.quantity || 0), 0
    );
    const shipping = subtotal > 500 ? 0 : 50;
    
    // Calculate charges
    const chargesTotal = charges.reduce((total, charge) => {
      return total + (charge.calculatedAmount || 0);
    }, 0);
    
    const total = Math.round((subtotal + shipping + chargesTotal) * 100) / 100;
    const itemCount = cartItems.reduce((count, item) => 
      count + (item.quantity || 0), 0
    );

    return {
      subtotal,
      shipping,
      charges: chargesTotal,
      total,
      itemCount,
      items: cartItems,
      chargesBreakdown: charges
    };
  }, [cartItems]);

  /**
   * Check if cart is empty
   */
  const isEmpty = cartItems.length === 0;

  /**
   * Get cart item by ID
   */
  const getCartItem = useCallback((itemId) => {
    return cartItems.find(item => 
      item.id === itemId || 
      item._id === itemId || 
      item.product?._id === itemId
    );
  }, [cartItems]);

  /**
   * Check if item exists in cart
   */
  const hasItem = useCallback((itemId) => {
    return !!getCartItem(itemId);
  }, [getCartItem]);

  return {
    // State
    cartItems,
    loading,
    error,
    isInitialized,
    totalAmount,
    totalItems,
    isEmpty,
    
    // Methods
    initializeCart,
    clearCart,
    addToCart,
    getCartSummary,
    getCartSummaryWithCharges,
    getCartItem,
    hasItem,
    
    // Utils
    saveToStorage: () => saveCartToStorage(cartItems),
    loadFromStorage: loadCartFromStorage,
    clearFromStorage: clearCartFromStorage
  };
};

export default useCart;