import { useMemo, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  addToWishlistAPI, 
  removeFromWishlistAPI, 
  fetchWishlist,
  optimisticAddToWishlist,
  optimisticRemoveFromWishlist
} from '../redux/wishlistSlice';
import { 
  isProductInWishlist, 
  getOptimizedWishlistState,
  isProductInWishlistFast,
  getHeartIconClasses,
  forceRefreshWishlist 
} from '../utils/wishlistHelper';
import toast from 'react-hot-toast';

/**
 * Optimized wishlist hook that reduces re-renders and improves performance
 */
export const useOptimizedWishlist = () => {
  const dispatch = useDispatch();
  const { items: wishlistItems, loading, error, count } = useSelector((state) => state.wishlist);
  const { user: authUser } = useSelector((state) => state.auth);

  // Memoize optimized wishlist state to prevent unnecessary recalculations
  const optimizedState = useMemo(() => {
    return getOptimizedWishlistState(wishlistItems);
  }, [wishlistItems]);

  // Memoized function to check if product is in wishlist
  const checkWishlistStatus = useCallback((productId) => {
    if (!productId) return false;
    return isProductInWishlistFast(optimizedState.idSet, productId);
  }, [optimizedState.idSet]);

  // Optimized toggle wishlist function with optimistic updates
  const toggleWishlist = useCallback(async (product) => {
    if (!authUser) {
      toast("Please login to use wishlist", { duration: 2000 });
      return;
    }

    const productId = product._id || product.id;
    if (!productId) {
      toast.error("Invalid product", { duration: 2000 });
      return;
    }

    const isInWishlist = checkWishlistStatus(productId);
    console.log("isInWishlist",isInWishlist)

    try {
      if (isInWishlist) {
        // Optimistic update - remove immediately
        dispatch(optimisticRemoveFromWishlist(product));
        
        // Then make API call
        await dispatch(removeFromWishlistAPI(productId)).unwrap();
        toast.success("Removed from wishlist!", { duration: 2000 });
      } else {
        // Optimistic update - add immediately
        dispatch(optimisticAddToWishlist(product));
        
        // Then make API call
        await dispatch(addToWishlistAPI({ _id: productId,isInWishlist })).unwrap();
        toast.success("Added to wishlist!", { duration: 2000 });
      }
    } catch (error) {
      console.error("Wishlist operation failed:", error);
      toast.error("Wishlist operation failed. Please try again.", { duration: 2000 });
      
      // Revert optimistic update on error
      if (isInWishlist) {
        dispatch(optimisticAddToWishlist(product));
      } else {
        dispatch(optimisticRemoveFromWishlist(product));
      }
    }
  }, [authUser, checkWishlistStatus, dispatch]);

  // Optimized add to wishlist function
  const addToWishlist = useCallback(async (product) => {
    if (!authUser) {
      toast("Please login to use wishlist", { duration: 2000 });
      return;
    }

    const productId = product._id || product.id;
    if (!productId) {
      toast.error("Invalid product", { duration: 2000 });
      return;
    }

    if (checkWishlistStatus(productId)) {
      toast("Product is already in wishlist", { duration: 2000 });
      return;
    }

    try {
      // Optimistic update
      dispatch(optimisticAddToWishlist(product));
      
      await dispatch(addToWishlistAPI({ _id: productId })).unwrap();
      toast.success("Added to wishlist!", { duration: 2000 });
    } catch (error) {
      console.error("Failed to add to wishlist:", error);
      toast.error("Failed to add to wishlist. Please try again.", { duration: 2000 });
      
      // Revert optimistic update on error
      dispatch(optimisticRemoveFromWishlist(product));
    }
  }, [authUser, checkWishlistStatus, dispatch]);

  // Optimized remove from wishlist function
  const removeFromWishlist = useCallback(async (product) => {
    const productId = product._id || product.id;
    if (!productId) {
      toast.error("Invalid product", { duration: 2000 });
      return;
    }

    if (!checkWishlistStatus(productId)) {
      toast("Product is not in wishlist", { duration: 2000 });
      return;
    }

    try {
      // Optimistic update
      dispatch(optimisticRemoveFromWishlist(product));
      
      await dispatch(removeFromWishlistAPI(productId)).unwrap();
      toast.success("Removed from wishlist!", { duration: 2000 });
    } catch (error) {
      console.error("Failed to remove from wishlist:", error);
      toast.error("Failed to remove from wishlist. Please try again.", { duration: 2000 });
      
      // Revert optimistic update on error
      dispatch(optimisticAddToWishlist(product));
    }
  }, [checkWishlistStatus, dispatch]);

  // Get heart icon classes for consistent styling
  const getHeartIconProps = useCallback((productId, isLoading = false) => {
    const isInWishlist = checkWishlistStatus(productId);
    return getHeartIconClasses(isInWishlist, isLoading);
  }, [checkWishlistStatus]);

  // Refresh wishlist data
  const refreshWishlist = useCallback(() => {
    if (authUser) {
      dispatch(fetchWishlist());
    }
  }, [authUser, dispatch]);

  // Auto-fetch wishlist when user is authenticated (only once on mount)
  useEffect(() => {
    if (authUser && !wishlistItems) {
      console.log('Auto-fetching wishlist for authenticated user');
      dispatch(fetchWishlist());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authUser, dispatch]); // Removed wishlistItems to prevent infinite loop

  return {
    // State
    wishlistItems: optimizedState.items,
    loading,
    error,
    count, // Use the explicit count from Redux state
    
    // Functions
    checkWishlistStatus,
    toggleWishlist,
    addToWishlist,
    removeFromWishlist,
    getHeartIconProps,
    refreshWishlist,
    
    // Optimized state
    optimizedState
  };
};
