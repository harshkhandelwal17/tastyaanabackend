/**
 * Custom hook for checking and monitoring product availability
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  checkProductAvailability, 
  checkAvailabilityWarning,
  getCurrentTime,
  getCurrentDay 
} from '../utils/availabilityUtils';

/**
 * Hook for managing product availability
 * @param {Object} product - Product object with availability data
 * @param {Object} options - Configuration options
 * @returns {Object} Availability state and methods
 */
export const useProductAvailability = (product, options = {}) => {
  const {
    enableRealTimeUpdates = true,
    warningMinutes = 30,
    updateInterval = 60000 // 1 minute
  } = options;

  const [availability, setAvailability] = useState({
    isAvailable: true,
    message: 'Product is available',
    nextAvailable: null
  });

  const [warning, setWarning] = useState({
    showWarning: false,
    message: '',
    minutesLeft: 0
  });

  const [currentTime, setCurrentTime] = useState(getCurrentTime());
  const [currentDay, setCurrentDay] = useState(getCurrentDay());

  /**
   * Update availability status
   */
  const updateAvailability = useCallback(() => {
    if (!product) return;

    const newAvailability = checkProductAvailability(product);
    const newWarning = checkAvailabilityWarning(product, warningMinutes);

    setAvailability(newAvailability);
    setWarning(newWarning);
    setCurrentTime(getCurrentTime());
    setCurrentDay(getCurrentDay());
  }, [product, warningMinutes]);

  /**
   * Check if item can be added to cart
   */
  const canAddToCart = useCallback(() => {
    return availability.isAvailable;
  }, [availability.isAvailable]);

  /**
   * Get cart action message
   */
  const getCartActionMessage = useCallback(() => {
    if (availability.isAvailable) {
      return warning.showWarning ? warning.message : 'Add to Cart';
    }
    return availability.message;
  }, [availability, warning]);

  /**
   * Get availability status for display
   */
  const getAvailabilityStatus = useCallback(() => {
    if (availability.isAvailable) {
      if (warning.showWarning) {
        return {
          status: 'warning',
          message: warning.message,
          color: 'orange'
        };
      }
      return {
        status: 'available',
        message: 'Available Now',
        color: 'green'
      };
    }
    
    return {
      status: 'unavailable',
      message: availability.message,
      color: 'red'
    };
  }, [availability, warning]);

  // Update availability on mount and when product changes
  useEffect(() => {
    updateAvailability();
  }, [updateAvailability]);

  // Set up real-time updates
  useEffect(() => {
    if (!enableRealTimeUpdates) return;

    const interval = setInterval(updateAvailability, updateInterval);
    return () => clearInterval(interval);
  }, [enableRealTimeUpdates, updateInterval, updateAvailability]);

  // Listen for visibility change to update immediately when user returns
  useEffect(() => {
    if (!enableRealTimeUpdates) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        updateAvailability();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enableRealTimeUpdates, updateAvailability]);

  return {
    // State
    isAvailable: availability.isAvailable,
    message: availability.message,
    nextAvailable: availability.nextAvailable,
    warning,
    currentTime,
    currentDay,

    // Methods
    canAddToCart,
    getCartActionMessage,
    getAvailabilityStatus,
    updateAvailability,

    // Full availability object
    availability
  };
};

/**
 * Simplified hook for just checking if product is available
 * @param {Object} product - Product object
 * @returns {boolean} Whether product is currently available
 */
export const useIsProductAvailable = (product) => {
  const { isAvailable } = useProductAvailability(product, {
    enableRealTimeUpdates: false
  });
  return isAvailable;
};

export default useProductAvailability;