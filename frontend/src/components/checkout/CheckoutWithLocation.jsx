import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  CreditCard, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Navigation,
  Edit3
} from 'lucide-react';
import LocationService from '../delivery/LocationService';
import toast from 'react-hot-toast';

const CheckoutWithLocation = ({ onOrderPlace, orderData }) => {
  const { user } = useSelector(state => state.auth);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [deliveryAddress, setDeliveryAddress] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    coordinates: null
  });
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('razorpay');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Handle location update from LocationService
  const handleLocationUpdate = (locationData) => {
    setCurrentLocation(locationData);
    
    if (useCurrentLocation && locationData.address) {
      const address = typeof locationData.address === 'string' 
        ? { formatted: locationData.address }
        : locationData.address;
      
      // Parse full address string for better details
      const fullAddress = address.formatted || locationData.address;
      const addressParts = fullAddress ? fullAddress.split(',').map(part => part.trim()) : [];
      
      setDeliveryAddress(prev => ({
        ...prev,
        street: fullAddress || address.street || '',
        city: address.city || (addressParts.length > 2 ? addressParts[addressParts.length - 3] : ''),
        state: address.state || (addressParts.length > 1 ? addressParts[addressParts.length - 2] : ''),
        zipCode: address.zipCode || address.pincode || extractPincode(fullAddress) || '',
        country: address.country || 'India',
        coordinates: locationData.coordinates
      }));
    }
  };

  // Helper function to extract pincode from address string
  const extractPincode = (addressString) => {
    if (!addressString) return '';
    const pincodeMatch = addressString.match(/\b\d{6}\b/);
    return pincodeMatch ? pincodeMatch[0] : '';
  };

  // Toggle current location usage
  const handleUseCurrentLocation = (use) => {
    setUseCurrentLocation(use);
    if (use && currentLocation) {
      handleLocationUpdate(currentLocation);
    } else if (!use) {
      setDeliveryAddress(prev => ({
        ...prev,
        coordinates: null
      }));
    }
  };

  // Convert address to coordinates using Google Geocoding API
  const convertAddressToCoordinates = async (fullAddress) => {
    try {
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (!apiKey) return null;

      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results[0]) {
        const location = data.results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng
        };
      }
    } catch (error) {
      console.error('Error converting address to coordinates:', error);
    }
    return null;
  };

  // Handle address input changes
  const handleAddressChange = async (field, value) => {
    setDeliveryAddress(prev => ({
      ...prev,
      [field]: value
    }));

    // If user is manually entering address and completes street, city, state - convert to coordinates
    if (!useCurrentLocation && (field === 'street' || field === 'city' || field === 'state')) {
      const updatedAddress = { ...deliveryAddress, [field]: value };
      
      if (updatedAddress.street && updatedAddress.city && updatedAddress.state) {
        const fullAddress = `${updatedAddress.street}, ${updatedAddress.city}, ${updatedAddress.state}, ${updatedAddress.country}`;
        
        // Debounce the conversion
        setTimeout(async () => {
          const coordinates = await convertAddressToCoordinates(fullAddress);
          if (coordinates) {
            setDeliveryAddress(prev => ({
              ...prev,
              coordinates
            }));
          }
        }, 1000);
      }
    }
  };

  // Validate address
  const validateAddress = () => {
    const required = ['name', 'phone', 'street', 'city', 'state'];
    const missing = required.filter(field => !deliveryAddress[field]?.trim());
    
    if (missing.length > 0) {
      toast.error(`Please fill in: ${missing.join(', ')}`, { duration: 2000 });
      return false;
    }
    
    if (deliveryAddress.phone.length < 10) {
      toast.error('Please enter a valid phone number', { duration: 2000 });
      return false;
    }
    
    return true;
  };

  // Handle order placement
  const handlePlaceOrder = async () => {
    if (!validateAddress()) return;
    
    setIsPlacingOrder(true);
    
    try {
      const orderPayload = {
        ...orderData,
        deliveryAddress,
        paymentMethod,
        specialInstructions,
        useCurrentLocation,
        customerLocation: currentLocation?.coordinates
      };
      
      await onOrderPlace(orderPayload);
      toast.success('Order placed successfully!', { duration: 2000 });
    } catch (error) {
      console.error('Order placement error:', error);
      toast.error('Failed to place order. Please try again.', { duration: 2000 });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Checkout</h1>
        <p className="text-gray-600">Complete your order with delivery tracking</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Address & Location */}
        <div className="space-y-6">
          {/* Location Service */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <Navigation className="h-5 w-5 mr-2 text-blue-600" />
              Current Location
            </h2>
            
            <LocationService
              onLocationUpdate={handleLocationUpdate}
              showCurrentLocation={true}
            />
            
            {currentLocation && (
              <div className="mt-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={useCurrentLocation}
                    onChange={(e) => handleUseCurrentLocation(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    Use current location for delivery
                  </span>
                </label>
              </div>
            )}
          </motion.div>

          {/* Delivery Address */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <MapPin className="h-5 w-5 mr-2 text-red-600" />
              Delivery Address
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={deliveryAddress.name}
                  onChange={(e) => handleAddressChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your full name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={deliveryAddress.phone}
                  onChange={(e) => handleAddressChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter phone number"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={deliveryAddress.street}
                  onChange={(e) => handleAddressChange('street', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="House/Flat No, Street Name"
                  disabled={useCurrentLocation}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  value={deliveryAddress.city}
                  onChange={(e) => handleAddressChange('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="City"
                  disabled={useCurrentLocation}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State *
                </label>
                <input
                  type="text"
                  value={deliveryAddress.state}
                  onChange={(e) => handleAddressChange('state', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="State"
                  disabled={useCurrentLocation}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  value={deliveryAddress.zipCode}
                  onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="ZIP Code"
                  disabled={useCurrentLocation}
                />
              </div>
            </div>
          </motion.div>

          {/* Special Instructions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <Edit3 className="h-4 w-4 mr-2" />
              Special Instructions
            </h3>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="3"
              placeholder="Any special delivery instructions..."
            />
          </motion.div>
        </div>

        {/* Right Column - Order Summary & Payment */}
        <div className="space-y-6">
          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
            
            {orderData?.items?.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <img
                    src={item.image || '/placeholder-product.jpg'}
                    alt={item.name}
                    className="w-12 h-12 rounded-lg object-cover mr-3"
                  />
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="font-semibold">₹{item.price * item.quantity}</p>
              </div>
            ))}
            
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>Total</span>
                <span>₹{orderData?.total || 0}</span>
              </div>
            </div>
          </motion.div>

          {/* Payment Method */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border p-6"
          >
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-green-600" />
              Payment Method
            </h2>
            
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="razorpay"
                  checked={paymentMethod === 'razorpay'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <p className="font-medium">Online Payment</p>
                  <p className="text-sm text-gray-500">Pay securely with Razorpay</p>
                </div>
              </label>
              
              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <div>
                  <p className="font-medium">Cash on Delivery</p>
                  <p className="text-sm text-gray-500">Pay when your order arrives</p>
                </div>
              </label>
            </div>
          </motion.div>

          {/* Place Order Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handlePlaceOrder}
            disabled={isPlacingOrder}
            className={`
              w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200
              ${isPlacingOrder 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl'
              }
            `}
          >
            {isPlacingOrder ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Placing Order...</span>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="h-5 w-5" />
                <span>Place Order & Track Delivery</span>
              </div>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutWithLocation;
