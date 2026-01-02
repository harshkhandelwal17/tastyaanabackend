/**
 * Authentication utility functions
 */

/**
 * Get the authentication token from local storage
 * @returns {string|null} The authentication token or null if not found
 */
export const getAuthToken = () => {
  try {
    // Try to get token from local storage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    // If token exists and is not 'undefined' or 'null' as string
    if (token && token !== 'undefined' && token !== 'null') {
      return token;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Set the authentication token in storage
 * @param {string} token - The authentication token
 * @param {boolean} remember - Whether to remember the user (use localStorage)
 */
export const setAuthToken = (token, remember = true) => {
  try {
    if (remember) {
      localStorage.setItem('token', token);
      // Remove from session storage if it exists
      sessionStorage.removeItem('token');
    } else {
      sessionStorage.setItem('token', token);
      // Remove from local storage if it exists
      localStorage.removeItem('token');
    }
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
};

/**
 * Remove the authentication token from storage
 */
export const removeAuthToken = () => {
  try {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  } catch (error) {
    console.error('Error removing auth token:', error);
  }
};

/**
 * Check if user is authenticated
 * @returns {boolean} True if user is authenticated
 */
export const isAuthenticated = () => {
  return !!getAuthToken();
};

export default {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  isAuthenticated
};
