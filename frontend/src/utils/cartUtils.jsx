// src/utils/cartUtils.js
export const CART_STORAGE_KEY = 'checkoutCart';

/**
 * Save cart items to localStorage
 * @param {Array} cartItems - Array of cart items
 */
export const saveCartToStorage = (cartItems) => {
  try {
    if (Array.isArray(cartItems) && cartItems.length > 0) {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
      console.log('✅ Cart saved to localStorage');
    } else if (cartItems.length === 0) {
      // Remove from localStorage if cart is empty
      localStorage.removeItem(CART_STORAGE_KEY);
      console.log('✅ Empty cart removed from localStorage');
    }
  } catch (error) {
    console.error('❌ Error saving cart to localStorage:', error);
  }
};

/**
 * Load cart items from localStorage
 * @returns {Array} Array of cart items or empty array
 */
export const loadCartFromStorage = () => {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      if (Array.isArray(parsedCart)) {
        console.log('✅ Cart loaded from localStorage:', parsedCart.length, 'items');
        return parsedCart;
      }
    }
  } catch (error) {
    console.error('❌ Error loading cart from localStorage:', error);
    // Clear corrupted data
    localStorage.removeItem(CART_STORAGE_KEY);
  }
  return [];
};

/**
 * Clear cart from localStorage
 */
export const clearCartFromStorage = () => {
  try {
    localStorage.removeItem(CART_STORAGE_KEY);
    console.log('✅ Cart cleared from localStorage');
  } catch (error) {
    console.error('❌ Error clearing cart from localStorage:', error);
  }
};

/**
 * Check if cart exists in localStorage
 * @returns {boolean} True if cart exists
 */
export const hasCartInStorage = () => {
  try {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    return savedCart !== null && savedCart !== undefined;
  } catch (error) {
    console.error('❌ Error checking cart in localStorage:', error);
    return false;
  }
};

/**
 * Get cart item count from localStorage
 * @returns {number} Number of items in cart
 */
export const getCartItemCountFromStorage = () => {
  try {
    const cartItems = loadCartFromStorage();
    return cartItems.reduce((count, item) => count + (item.quantity || 0), 0);
  } catch (error) {
    console.error('❌ Error getting cart count from localStorage:', error);
    return 0;
  }
};

/**
 * Merge cart items (useful when syncing with backend)
 * @param {Array} localCart - Local cart items
 * @param {Array} backendCart - Backend cart items
 * @returns {Array} Merged cart items
 */
export const mergeCartItems = (localCart, backendCart) => {
  try {
    const merged = [...backendCart];
    
    localCart.forEach(localItem => {
      const existingItem = merged.find(item => 
        (item.id === localItem.id || 
         item._id === localItem._id || 
         item.product?._id === localItem.product?._id) &&
        item.weight === localItem.weight
      );
      
      if (existingItem) {
        // Update quantity to the higher value
        existingItem.quantity = Math.max(existingItem.quantity || 0, localItem.quantity || 0);
      } else {
        // Add new item from local cart
        merged.push(localItem);
      }
    });
    
    console.log('✅ Cart items merged successfully');
    return merged;
  } catch (error) {
    console.error('❌ Error merging cart items:', error);
    return backendCart || localCart || [];
  }
};

/**
 * Validate cart item structure
 * @param {Object} item - Cart item to validate
 * @returns {boolean} True if item is valid
 */
export const isValidCartItem = (item) => {
  return (
    item &&
    typeof item === 'object' &&
    (item.id || item._id || item.product?._id) &&
    typeof item.price === 'number' &&
    item.price >= 0 &&
    typeof item.quantity === 'number' &&
    item.quantity > 0 &&
    (item.name || item.title || item.product?.name)
  );
};

/**
 * Clean invalid items from cart
 * @param {Array} cartItems - Array of cart items
 * @returns {Array} Cleaned cart items
 */
export const cleanCartItems = (cartItems) => {
  try {
    if (!Array.isArray(cartItems)) return [];
    
    const cleanedItems = cartItems.filter(isValidCartItem);
    
    if (cleanedItems.length !== cartItems.length) {
      console.warn(`⚠️ Removed ${cartItems.length - cleanedItems.length} invalid cart items`);
    }
    
    return cleanedItems;
  } catch (error) {
    console.error('❌ Error cleaning cart items:', error);
    return [];
  }
};