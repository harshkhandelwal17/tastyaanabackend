import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Store, Loader2 } from 'lucide-react';
import laundryService from '../../services/laundryService';

/**
 * Component that checks if vendor profile exists
 * Shows create profile option if not found
 */
export default function VendorProfileGuard({ children }) {
  const [hasVendor, setHasVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkVendorProfile();
  }, []);

  const checkVendorProfile = async () => {
    try {
      const response = await laundryService.getMyVendor();
      if (response?.data) {
        setHasVendor(true);
      } else {
        setHasVendor(false);
      }
    } catch (error) {
      // If 404, vendor doesn't exist
      if (error.message?.includes('not found') || error.response?.status === 404) {
        setHasVendor(false);
      } else {
        console.error('Error checking vendor profile:', error);
        setHasVendor(false);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!hasVendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Vendor Profile Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            You need to create a vendor profile to manage your laundry services. 
            This will allow you to set up pricing, services, and receive orders.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/seller/laundry/create-profile')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create Vendor Profile
            </button>
            <button
              onClick={() => navigate('/seller')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

