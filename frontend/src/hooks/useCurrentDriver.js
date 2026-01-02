import { useSelector } from 'react-redux';
import { getCurrentDriverId, getCurrentDriverData } from '../utils/driverUtils';

/**
 * Custom hook to get current driver information
 * @returns {object} Object containing driver ID, driver data, and authentication status
 */
export const useCurrentDriver = () => {
  const user = useSelector((state) => state.auth.user);
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  // Get driver ID from multiple sources
  const driverId = getCurrentDriverId();
  const driverData = getCurrentDriverData();
  
  return {
    driverId,
    driverData,
    user, // From Redux state
    isAuthenticated,
    isDriver: !!driverId || !!driverData || (user && user.role === 'delivery')
  };
};

export default useCurrentDriver;
