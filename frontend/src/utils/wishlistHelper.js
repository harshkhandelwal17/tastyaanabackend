// Wishlist utility functions

/**
 * Check if a product is in the wishlist - OPTIMIZED VERSION
 * @param {Object} wishlistItems - The wishlist items from Redux state
 * @param {string} productId - The product ID to check
 * @returns {boolean} - Whether the product is in wishlist
 */
export const isProductInWishlist = (wishlistItems, productId) => {
  // Early return if no wishlist items
  if (!wishlistItems || !productId) return false;
  
  // Handle different wishlist structures
  const items = Array.isArray(wishlistItems) ? wishlistItems : 
                Array.isArray(wishlistItems?.items) ? wishlistItems.items : [];
  
  if (items.length === 0) return false;
  
  // Use Set for O(1) lookup instead of O(n) array search
  const wishlistIds = new Set();
  
  items.forEach(item => {
    const id = item._id || item.id || item.product?._id || item.product?.id || item.productId;
    if (id) wishlistIds.add(id);
  });
  
  return wishlistIds.has(productId);
};

/**
 * Ultra-fast wishlist check using pre-computed Set
 * @param {Set} idSet - Pre-computed Set of wishlist IDs
 * @param {string} productId - The product ID to check
 * @returns {boolean} - Whether the product is in wishlist
 */
export const isProductInWishlistFast = (idSet, productId) => {
  if (!idSet || !productId) return false;
  return idSet.has(productId);
};

/**
 * Get optimized wishlist state with pre-computed data structures
 * @param {Array} wishlistItems - Raw wishlist items
 * @returns {Object} - Optimized state with items, idSet, and count
 */
export const getOptimizedWishlistState = (wishlistItems) => {
  const startTime = performance.now();
  
  // Handle different wishlist structures
  const items = Array.isArray(wishlistItems) ? wishlistItems : 
                Array.isArray(wishlistItems?.items) ? wishlistItems.items : [];
  
  // Create Set for O(1) lookups
  const idSet = new Set();
  items.forEach(item => {
    const id = item._id || item.id || item.product?._id || item.product?.id || item.productId;
    if (id) idSet.add(id);
  });
  
  const endTime = performance.now();
  console.log(`Wishlist optimization took ${(endTime - startTime).toFixed(2)}ms for ${items.length} items`);
  
  return {
    items,
    idSet,
    count: items.length
  };
};

/**
 * Get heart icon classes for consistent styling
 * @param {boolean} isInWishlist - Whether the product is in wishlist
 * @param {boolean} isLoading - Whether the operation is loading
 * @returns {Object} - Object with icon and button classes
 */
export const getHeartIconClasses = (isInWishlist, isLoading = false) => {
  if (isLoading) {
    return {
      icon: "text-gray-400 animate-pulse",
      button: "cursor-not-allowed opacity-50"
    };
  }
  
  if (isInWishlist) {
    return {
      icon: "text-red-500 fill-current hover:text-red-600",
      button: "hover:bg-red-50"
    };
  }
  
  return {
    icon: "text-gray-600 hover:text-red-500",
    button: "hover:bg-gray-50"
  };
};

/**
 * Debug wishlist state for troubleshooting
 * @param {Array} wishlistItems - Wishlist items to debug
 * @param {string} productId - Product ID to check
 * @param {string} context - Context for debugging
 * @returns {boolean} - Whether product is in wishlist
 */
export const debugWishlist = (wishlistItems, productId, context = 'Unknown') => {
  console.log(`[${context}] Debugging wishlist:`, {
    productId,
    wishlistItems: wishlistItems?.length || 0,
    structure: Array.isArray(wishlistItems) ? 'Array' : 'Object',
    items: wishlistItems?.items?.length || 'N/A'
  });
  
  const result = isProductInWishlist(wishlistItems, productId);
  console.log(`[${context}] Product ${productId} in wishlist:`, result);
  
  return result;
};

/**
 * Force refresh wishlist data
 * @param {Function} dispatch - Redux dispatch function
 * @param {Function} fetchWishlist - Fetch wishlist action
 */
export const forceRefreshWishlist = (dispatch, fetchWishlist) => {
  console.log('Force refreshing wishlist...');
    dispatch(fetchWishlist());
};

/**
 * Performance monitoring for wishlist operations
 * @param {string} operation - Operation name
 * @param {Function} fn - Function to monitor
 * @returns {any} - Result of the function
 */
export const monitorWishlistPerformance = (operation, fn) => {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  
  console.log(`Wishlist ${operation} took ${(endTime - startTime).toFixed(2)}ms`);
  return result;
};
