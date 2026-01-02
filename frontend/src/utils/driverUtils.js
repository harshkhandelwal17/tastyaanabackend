// Utility functions for driver ID management
import { useSelector } from 'react-redux';
/**
 * Get the current driver ID from localStorage or Redux state
 * @returns {string|null} The current driver ID or null if not found
 */
export const getCurrentDriverId = () => {
  try {
    // Get from regular auth token (unified login system)

     const { user: userInfo, isAuthenticated } = useSelector(
        (state) => state.auth
      );
    const userData = userInfo;
    if (userData) {
      if (userData.id && userData.role === 'delivery') {
        return userData.id;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting current driver ID:', error);
    return null;
  }
};

/**
 * Get the current driver data from localStorage
 * @returns {object|null} The current driver data or null if not found
 */
export const getCurrentDriverData = () => {
  try {
    const userData = localStorage.getItem('user');
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role === 'delivery') {
        return parsed;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting current driver data:', error);
    return null;
  }
};

/**
 * Check if the current user is a driver
 * @returns {boolean} True if the current user is a driver
 */
export const isCurrentUserDriver = () => {
  const driverData = getCurrentDriverData();
  return driverData !== null;
};

/**
 * Store driver data in localStorage (for unified login system)
 * @param {object} userData - The user data to store
 */
export const storeDriverData = (userData) => {
  try {
    // In unified system, user data is already stored by loginUser action
    // This function is kept for compatibility but doesn't need to do anything
    console.log('Driver data stored via unified login system:', userData);
  } catch (error) {
    console.error('Error storing driver data:', error);
  }
};

/**
 * Clear driver data from localStorage
 */
export const clearDriverData = () => {
  try {
    // In unified system, clear the regular user data
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  } catch (error) {
    console.error('Error clearing driver data:', error);
  }
};
