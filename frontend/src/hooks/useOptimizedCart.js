import { useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addToCartAPI, removeFromCartAPI, updateQuantityAPI, deleteCartItem } from '../redux/cartSlice';
import { toast } from 'react-hot-toast';
import { checkProductAvailability } from '../utils/availabilityUtils';

export const useOptimizedCart = () => {
  const dispatch = useDispatch();
  const { items: cartItems, totalQuantity, loading } = useSelector((state) => state.cart);
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  // Prevent multiple rapid clicks
  const isProcessingRef = useRef(false);
  const lastClickTimeRef = useRef(0);
  
  const addToCart = useCallback(async (productId, weight = '1kg', quantity = 1, product = null) => {
    // Prevent multiple rapid clicks
    const now = Date.now();
    if (now - lastClickTimeRef.current < 500) {
      console.log('Click ignored - too fast');
      return;
    }
    lastClickTimeRef.current = now;
    
    if (isProcessingRef.current) {
      console.log('Already processing cart operation');
      return;
    }
    
    if (!user || !isAuthenticated) {
      toast("Please login to add items to cart", { duration: 2000 });
      return;
    }
    
    // Check product availability if product object is provided
    if (product && product.availability) {
      const availability = checkProductAvailability(product);
      if (!availability.isAvailable) {
        toast.error(availability.message, { duration: 4000 });
        return;
      }
    }
    
    isProcessingRef.current = true;
    
    try {
      const payload = {
        productId,
        payload: { weight },
        quantity,
      };
      
      const result = await dispatch(addToCartAPI(payload)).unwrap();
      
      if (result) {
        toast.success("Added to cart!", { duration: 2000 });
      }
    } catch (error) {
      console.error("Failed to add to cart:", error);
      
      // Handle availability-specific errors
      let errorMessage = '';
      if (error.message && error.message.includes('currently not available')) {
        errorMessage = error.message;
      } else if (error.response?.data?.message && error.response.data.message.includes('currently not available')) {
        errorMessage = error.response.data.message;
      } else if (typeof error === 'string' && error.includes('currently not available')) {
        errorMessage = error;
      }
      
      if (errorMessage) {
        toast.error(errorMessage, { duration: 4000 });
      } else {
        toast.error("Failed to add to cart. Please try again.", { duration: 2000 });
      }
    } finally {
      isProcessingRef.current = false;
    }
  }, [dispatch, user, isAuthenticated]);
  
  const removeFromCart = useCallback(async (productId) => {
    if (isProcessingRef.current) {
      console.log('Already processing cart operation');
      return;
    }
    
    if (!user || !isAuthenticated) {
      toast("Please login to manage cart", { duration: 2000 });
      return;
    }
    
    isProcessingRef.current = true;
    
    try {
      await dispatch(removeFromCartAPI({ _id: productId })).unwrap();
      toast.success("Removed from cart!", { duration: 2000 });
    } catch (error) {
      console.error('Error removing from cart:', error);
      toast.error('Failed to remove from cart. Please try again.', { duration: 2000 });
    } finally {
      isProcessingRef.current = false;
    }
  }, [dispatch, user, isAuthenticated]);

  const updateCartQuantity = useCallback(async (productId, newQuantity) => {
    if (isProcessingRef.current) {
      console.log('Already processing cart operation');
      return;
    }
    
    if (!user || !isAuthenticated) {
      toast("Please login to manage cart", { duration: 2000 });
      return;
    }
    
    isProcessingRef.current = true;
    
    try {
      console.log('updateCartQuantity called with:', { productId, newQuantity });
      console.log('Current cartItems:', cartItems);
      
      // Find the cart item ID for this product
      const cartItem = cartItems.find(item => {
        if (item.id === productId || item._id === productId)
          return true;
        if (
          item.product &&
          (item.product._id === productId ||
            item.product.id === productId)
        )
          return true;
        if (item.productId === productId) return true;
        return false;
      });

      console.log('Found cartItem in hook:', cartItem);

      if (!cartItem) {
        toast.error("Item not found in cart", { duration: 2000 });
        return;
      }

      const itemId = cartItem._id || cartItem.id;
      console.log('Using itemId:', itemId);
      
      // If quantity is 0 or less, remove the item instead of updating
      if (newQuantity <= 0) {
        console.log('Removing item with quantity <= 0');
        await dispatch(deleteCartItem(itemId)).unwrap();
        toast.success("Item removed from cart!", { duration: 2000 });
      } else {
        console.log('Updating quantity to:', newQuantity);
        const result = await dispatch(updateQuantityAPI({ itemId, quantity: newQuantity })).unwrap();
        toast.success("Cart updated!", { duration: 2000 });
      }
    } catch (error) {
      console.error('Error updating cart quantity:', error);
      toast.error('Failed to update cart. Please try again.', { duration: 2000 });
    } finally {
      isProcessingRef.current = false;
    }
  }, [dispatch, user, isAuthenticated, cartItems]);
  
  const isInCart = useCallback((productId) => {
    return cartItems.some(item => {
      if (item.id === productId || item._id === productId)
        return true;
      if (
        item.product &&
        (item.product._id === productId ||
          item.product.id === productId)
      )
        return true;
      if (item.productId === productId) return true;
      return false;
    });
  }, [cartItems]);
  
  const getCartQuantity = useCallback((productId) => {
    const item = cartItems.find(item => {
      if (item.id === productId || item._id === productId)
        return true;
      if (
        item.product &&
        (item.product._id === productId ||
          item.product.id === productId)
      )
        return true;
      if (item.productId === productId) return true;
      return false;
    });
    return item ? item.quantity : 0;
  }, [cartItems]);
  
  return {
    addToCart,
    removeFromCart,
    updateCartQuantity,
    isInCart,
    getCartQuantity,
    cartItems,
    totalQuantity,
    loading,
    isProcessing: isProcessingRef.current
  };
};
