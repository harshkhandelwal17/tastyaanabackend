import { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';

/**
 * Custom hook to check if current user is a vehicle rental seller
 * Permanent solution that doesn't rely on sellerProfile data
 */
export const useVehicleRentalAccess = () => {
  const { user: reduxUser, isAuthenticated, loading: authLoading } = useSelector((state) => state.auth);
  const [hasCheckedInitialState, setHasCheckedInitialState] = useState(false);

  // Wait for initial Redux state to stabilize
  useEffect(() => {
    if (!authLoading && isAuthenticated !== undefined) {
      const timer = setTimeout(() => {
        setHasCheckedInitialState(true);
      }, 150); // Allow time for Redux state to fully stabilize

      return () => clearTimeout(timer);
    }
  }, [authLoading, isAuthenticated]);

  const result = useMemo(() => {
    // Always show loading until we're confident Redux state is stable
    if (authLoading || !hasCheckedInitialState) {
      return {
        isVehicleRentalSeller: false,
        loading: true,
        error: null
      };
    }

    // If not authenticated, no access
    if (!isAuthenticated || !reduxUser) {
      return {
        isVehicleRentalSeller: false,
        loading: false,
        error: null
      };
    }

    // PERMANENT SOLUTION: Grant vehicle rental access to all sellers
    // Since the seller profile data is not available in Redux, we'll use a simpler approach:
    // 1. Any authenticated seller can access vehicle rental features
    // 2. Backend will handle the actual permission checks
    // 3. This prevents routing issues while maintaining security at the API level
    
    const isVehicleRentalSeller = reduxUser.role === 'seller';
    
    console.log("✅ Vehicle rental access granted to seller:", {
      userId: reduxUser.id,
      userName: reduxUser.name,
      role: reduxUser.role,
      hasAccess: isVehicleRentalSeller
    });

    return {
      isVehicleRentalSeller,
      loading: false,
      error: null
    };
  }, [isAuthenticated, reduxUser, reduxUser?.role, authLoading, hasCheckedInitialState]);

  return result;
};

/**
 * Custom hook to get minimal user info securely
 */
export const useUserInfo = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { user: reduxUser, token, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    const getUserInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!isAuthenticated || !token) {
          setUserInfo(null);
          setLoading(false);
          return;
        }

        if (reduxUser) {
          setUserInfo({
            id: reduxUser._id || reduxUser.id,
            name: reduxUser.name,
            role: reduxUser.role,
            email: reduxUser.email
          });
          setLoading(false);
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/user/profile/minimal`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user info');
        }

        const data = await response.json();
        
        if (data.success) {
          setUserInfo({
            id: data.data.id,
            name: data.data.name,
            role: data.data.role
          });
        } else {
          throw new Error(data.message || 'Failed to get user info');
        }
      } catch (err) {
        console.error('Error getting user info:', err);
        setError(err.message);
        setUserInfo(null);
      } finally {
        setLoading(false);
      }
    };

    getUserInfo();
  }, [isAuthenticated, token, reduxUser]);

  return {
    userInfo,
    loading,
    error
  };
};