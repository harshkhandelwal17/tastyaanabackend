import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  MapPin, 
  Clock, 
  Bell, 
  CreditCard, 
  Calendar,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import laundryService from '../../../services/laundryService';

export const SubscriptionCustomizePage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { plan, vendor } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Form state
  const [formData, setFormData] = useState({
    // Pickup Address
    pickupAddress: {
      street: '',
      area: '',
      city: '',
      pincode: '',
      landmark: '',
      contactName: '',
      contactPhone: ''
    },
    // Preferences
    preferredTimeSlot: 'morning',
    preferredDeliverySpeed: 'scheduled',
    specialInstructions: '',
    // Notifications
    notifications: {
      pickup: true,
      delivery: true,
      renewalReminder: true,
      usageAlert: true
    },
    // Billing
    autoRenewal: true,
    paymentMethod: 'upi',
    // Start Date
    startDate: new Date().toISOString().split('T')[0] // Today by default
  });

  useEffect(() => {
    // Redirect if no plan data
    if (!plan || !vendor) {
      navigate('/laundry/plans');
    }
  }, [plan, vendor, navigate]);

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleNotificationToggle = (key) => {
    setFormData(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: !prev.notifications[key]
      }
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Validate pickup address
    if (!formData.pickupAddress.street.trim()) {
      newErrors.street = 'Street address is required';
    }
    if (!formData.pickupAddress.area.trim()) {
      newErrors.area = 'Area is required';
    }
    if (!formData.pickupAddress.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.pickupAddress.pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(formData.pickupAddress.pincode)) {
      newErrors.pincode = 'Pincode must be 6 digits';
    }
    if (!formData.pickupAddress.contactName.trim()) {
      newErrors.contactName = 'Contact name is required';
    }
    if (!formData.pickupAddress.contactPhone.trim()) {
      newErrors.contactPhone = 'Contact phone is required';
    } else if (!/^\d{10}$/.test(formData.pickupAddress.contactPhone)) {
      newErrors.contactPhone = 'Phone must be 10 digits';
    }

    // Validate start date
    const startDate = new Date(formData.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (startDate < today) {
      newErrors.startDate = 'Start date cannot be in the past';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      const subscriptionData = {
        vendorId: vendor._id,
        planId: plan.id || plan._id,
        startDate: formData.startDate,
        paymentMethod: formData.paymentMethod,
        preferences: {
          defaultPickupAddress: formData.pickupAddress,
          preferredTimeSlot: formData.preferredTimeSlot,
          preferredDeliverySpeed: formData.preferredDeliverySpeed,
          specialInstructions: formData.specialInstructions,
          notifications: formData.notifications
        }
      };

      console.log('Creating subscription with data:', subscriptionData);
      
      const result = await laundryService.createSubscription(subscriptionData);
      
      // Navigate to success page or subscriptions page
      navigate('/laundry/subscriptions', { 
        state: { 
          message: 'Subscription created successfully!',
          subscription: result?.data || result
        }
      });
    } catch (error) {
      console.error('Error creating subscription:', error);
      const errorMessage = error.message || error.response?.data?.message || 'Failed to create subscription. Please try again.';
      alert(`❌ Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (!plan || !vendor) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/laundry/plans')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Plans</span>
          </button>
          
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Customize Your Subscription</h1>
            <p className="text-gray-600">Set up your preferences for {plan.name}</p>
            
            {/* Plan Summary */}
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-600">{vendor.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">₹{plan.price}</p>
                  <p className="text-sm text-gray-600">/{plan.schedule?.frequencyType === 'weekly' ? 'week' : 'month'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Pickup Address Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Pickup Address</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Street Address *
                </label>
                <input
                  type="text"
                  value={formData.pickupAddress.street}
                  onChange={(e) => handleInputChange('pickupAddress.street', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.street ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="House/Flat No., Building Name"
                />
                {errors.street && (
                  <p className="mt-1 text-sm text-red-600">{errors.street}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Area/Locality *
                </label>
                <input
                  type="text"
                  value={formData.pickupAddress.area}
                  onChange={(e) => handleInputChange('pickupAddress.area', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.area ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Area or Locality"
                />
                {errors.area && (
                  <p className="mt-1 text-sm text-red-600">{errors.area}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={formData.pickupAddress.city}
                  onChange={(e) => handleInputChange('pickupAddress.city', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.city ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="City"
                />
                {errors.city && (
                  <p className="mt-1 text-sm text-red-600">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pincode *
                </label>
                <input
                  type="text"
                  value={formData.pickupAddress.pincode}
                  onChange={(e) => handleInputChange('pickupAddress.pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.pincode ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="6-digit pincode"
                  maxLength={6}
                />
                {errors.pincode && (
                  <p className="mt-1 text-sm text-red-600">{errors.pincode}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Landmark (Optional)
                </label>
                <input
                  type="text"
                  value={formData.pickupAddress.landmark}
                  onChange={(e) => handleInputChange('pickupAddress.landmark', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Nearby landmark"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Name *
                </label>
                <input
                  type="text"
                  value={formData.pickupAddress.contactName}
                  onChange={(e) => handleInputChange('pickupAddress.contactName', e.target.value)}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.contactName ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="Name for pickup"
                />
                {errors.contactName && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact Phone *
                </label>
                <input
                  type="tel"
                  value={formData.pickupAddress.contactPhone}
                  onChange={(e) => handleInputChange('pickupAddress.contactPhone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.contactPhone ? 'border-red-500' : 'border-gray-200'
                  }`}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                />
                {errors.contactPhone && (
                  <p className="mt-1 text-sm text-red-600">{errors.contactPhone}</p>
                )}
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Preferences</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Time Slot
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {['morning', 'afternoon', 'evening'].map(slot => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => handleInputChange('preferredTimeSlot', slot)}
                      className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                        formData.preferredTimeSlot === slot
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {slot.charAt(0).toUpperCase() + slot.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preferred Delivery Speed
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {['scheduled', 'quick'].map(speed => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => handleInputChange('preferredDeliverySpeed', speed)}
                      className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${
                        formData.preferredDeliverySpeed === speed
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      {speed === 'quick' ? '⚡ Quick' : '📅 Scheduled'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions (Optional)
                </label>
                <textarea
                  value={formData.specialInstructions}
                  onChange={(e) => handleInputChange('specialInstructions', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Any special instructions for pickup/delivery..."
                  maxLength={500}
                />
                <p className="mt-1 text-sm text-gray-500">{formData.specialInstructions.length}/500</p>
              </div>
            </div>
          </div>

          {/* Start Date Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Start Date</h2>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                When would you like to start? *
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full px-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.startDate ? 'border-red-500' : 'border-gray-200'
                }`}
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.startDate}
                </p>
              )}
              <p className="mt-2 text-sm text-gray-500">
                Subscription will start from the selected date. Default is today.
              </p>
            </div>
          </div>

          {/* Notifications Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
            </div>
            
            <div className="space-y-3">
              {Object.entries(formData.notifications).map(([key, value]) => (
                <label key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100">
                  <span className="text-gray-700 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleNotificationToggle(key)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      value ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        value ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </label>
              ))}
            </div>
          </div>

          {/* Billing Section */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-bold text-gray-900">Billing</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100">
                  <span className="text-gray-700">Auto-renewal</span>
                  <button
                    type="button"
                    onClick={() => handleInputChange('autoRenewal', !formData.autoRenewal)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      formData.autoRenewal ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${
                        formData.autoRenewal ? 'translate-x-6' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </label>
                <p className="mt-2 text-sm text-gray-500">
                  Automatically renew your subscription at the end of each billing period
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="upi">UPI</option>
                  <option value="wallet">Wallet</option>
                  <option value="card">Card</option>
                </select>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="sticky bottom-0 bg-white rounded-2xl shadow-xl p-6 border-t-4 border-blue-600">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Amount</p>
                <p className="text-2xl font-bold text-gray-900">₹{plan.price}</p>
                <p className="text-xs text-gray-500">/{plan.schedule?.frequencyType === 'weekly' ? 'week' : 'month'}</p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Creating Subscription...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirm & Subscribe
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

