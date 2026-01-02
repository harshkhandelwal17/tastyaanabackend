import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Check, Package, Calendar, CheckCircle2, Zap, Loader2, AlertCircle } from 'lucide-react';
import { ItemSelector } from '../../../components/laundry/ItemSelector';
import SchedulePickup from '../../../components/laundry/SchedulePickup';
import { OrderSummary } from '../../../components/laundry/OrderSummary';
import laundryService from '../../../services/laundryService';

export const BookingPage = ({ vendor, onBack, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  // Initialize delivery speed based on vendor availability
  const getInitialDeliverySpeed = () => {
    if (vendor?.scheduledServiceConfig?.enabled !== false) {
      return 'scheduled';
    }
    if (vendor?.quickServiceConfig?.enabled) {
      return 'quick';
    }
    return 'scheduled'; // fallback
  };
  
  const [deliverySpeed, setDeliverySpeed] = useState(getInitialDeliverySpeed());
  
  // Update delivery speed if vendor changes or if current selection becomes unavailable
  useEffect(() => {
    if (vendor) {
      if (deliverySpeed === 'quick' && !vendor?.quickServiceConfig?.enabled) {
        setDeliverySpeed('scheduled');
      }
      if (deliverySpeed === 'scheduled' && vendor?.scheduledServiceConfig?.enabled === false) {
        if (vendor?.quickServiceConfig?.enabled) {
          setDeliverySpeed('quick');
        }
      }
    }
  }, [vendor, deliverySpeed]);
  const [error, setError] = useState(null);

  // Use ref to track selectedItems to avoid dependency issues
  const selectedItemsRef = useRef(selectedItems);
  useEffect(() => {
    selectedItemsRef.current = selectedItems;
  }, [selectedItems]);

  // Debounce pricing calculation
  const pricingTimeoutRef = useRef(null);
  
  useEffect(() => {
    // Clear previous timeout
    if (pricingTimeoutRef.current) {
      clearTimeout(pricingTimeoutRef.current);
    }
    
    // Only calculate if we have items
    if (selectedItems.length > 0 && vendor?._id) {
      // Debounce the calculation to avoid too many API calls
      pricingTimeoutRef.current = setTimeout(async () => {
        try {
          setError(null);
          const data = await laundryService.calculatePrice(
            vendor._id, 
            selectedItemsRef.current, 
            deliverySpeed
          );
          setPricing(data?.data || data);
        } catch (error) {
          console.error('Error calculating price:', error);
          setError(error.message || 'Failed to calculate pricing. Please try again.');
          setPricing(null);
        }
      }, 500);
    } else {
      setPricing(null);
    }
    
    // Cleanup
    return () => {
      if (pricingTimeoutRef.current) {
        clearTimeout(pricingTimeoutRef.current);
      }
    };
  }, [selectedItems.length, deliverySpeed, vendor?._id]); // Use length instead of array

  // Remove the useEffect that updates selectedItems - it causes infinite loops
  // Price updates are handled by calculatePricing which gets fresh data from API

  const handleCreateOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Comprehensive validation
      if (!vendor?._id) {
        throw new Error('Vendor information is missing. Please refresh the page.');
      }

      if (!vendor?.isActive) {
        throw new Error('This vendor is currently inactive. Please choose another vendor.');
      }

      if (selectedItems.length === 0) {
        throw new Error('Please select at least one item to place an order.');
      }

      // Validate each selected item
      for (const item of selectedItems) {
        if (!item.type || !item.serviceType) {
          throw new Error('Some items are missing required information. Please refresh and try again.');
        }

        if (!item.quantity || item.quantity < 1) {
          throw new Error(`Invalid quantity for ${item.type}. Quantity must be at least 1.`);
        }

        if (item.quantity > 100) {
          throw new Error(`Quantity for ${item.type} cannot exceed 100.`);
        }

        // Validate weight-based items
        if (item.pricingModel === 'weight_based') {
          if (!item.weight || item.weight < 0.1) {
            throw new Error(`Please enter weight for ${item.type} (minimum 0.1 kg).`);
          }
          if (item.weight > 50) {
            throw new Error(`Weight for ${item.type} cannot exceed 50 kg.`);
          }
        }

        // Validate total price
        if (!item.totalPrice || item.totalPrice <= 0) {
          throw new Error(`Invalid price for ${item.type}. Please refresh and try again.`);
        }

        // Check if service is available for vendor
        if (!vendor.services || !vendor.services.includes(item.serviceType)) {
          throw new Error(`Service "${item.serviceType}" is not available for this vendor.`);
        }
      }
      
      // Validate service availability
      if (deliverySpeed === 'quick' && !vendor?.quickServiceConfig?.enabled) {
        throw new Error('Quick service is not available for this vendor. Please select scheduled service.');
      }
      
      if (deliverySpeed === 'scheduled' && vendor?.scheduledServiceConfig?.enabled === false) {
        throw new Error('Scheduled service is not available for this vendor.');
      }

      if (!deliverySpeed || !['quick', 'scheduled', 'subscription'].includes(deliverySpeed)) {
        throw new Error('Please select a valid delivery speed.');
      }
      
      // Validate schedule
      if (deliverySpeed !== 'quick' && !schedule?.pickupDate && !schedule?.date) {
        throw new Error('Please select a pickup date for scheduled service.');
      }

      if (!schedule?.address) {
        throw new Error('Please provide pickup address details.');
      }

      // Validate address fields
      if (!schedule.address.street || schedule.address.street.trim().length < 5) {
        throw new Error('Please enter a valid street address (minimum 5 characters).');
      }

      if (!schedule.address.pincode || !/^[0-9]{6}$/.test(schedule.address.pincode)) {
        throw new Error('Please enter a valid 6-digit pincode.');
      }

      if (!schedule.address.contactName || schedule.address.contactName.trim().length < 2) {
        throw new Error('Please enter contact name (minimum 2 characters).');
      }

      if (!schedule.address.contactPhone || !/^[6-9]\d{9}$/.test(schedule.address.contactPhone)) {
        throw new Error('Please enter a valid 10-digit Indian mobile number.');
      }

      // Validate pickup date is not in past (for scheduled service)
      if (deliverySpeed !== 'quick' && schedule?.pickupDate) {
        const pickupDate = new Date(schedule.pickupDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (pickupDate < today) {
          throw new Error('Pickup date cannot be in the past. Please select today or a future date.');
        }
      }
      
      // Auto-set pickup date for quick service to today
      const pickupDate = deliverySpeed === 'quick' 
        ? new Date().toISOString().split('T')[0]
        : (schedule?.pickupDate || schedule?.date);
      
      const orderData = {
        vendorId: vendor._id,
        items: selectedItems,
        pickup: {
          date: pickupDate,
          timeSlot: deliverySpeed === 'quick' ? 'immediate' : (schedule?.pickupTime || schedule?.timeSlot),
          address: schedule?.address
        },
        delivery: {
          date: schedule?.deliveryDate,
          timeSlot: schedule?.deliveryTime || schedule?.deliveryTimeSlot,
          address: schedule?.deliveryAddress || schedule?.address
        },
        payment: {
          method: 'upi', // Valid values: 'cash', 'wallet', 'upi', 'card', 'subscription'
          status: 'pending'
        },
        specialInstructions: schedule?.specialInstructions || '',
        deliverySpeed,
        subscriptionId: null // Can be added later
      };
      
      const result = await laundryService.createOrder(orderData);
      const order = result?.data || result;
      
      // Show success message
      if (onSuccess) {
        onSuccess(order);
      } else {
        alert(`Order created successfully! Order ID: ${order.orderNumber || order._id}`);
      }
    } catch (error) {
      console.error('Error creating order:', error);
      const errorMessage = error.message || 'Failed to create order. Please try again.';
      setError(errorMessage);
      // Also show alert for immediate feedback
      setTimeout(() => {
        alert(errorMessage);
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  if (!vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Loading vendor information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 pb-20">
      <div className="max-w-md lg:max-w-6xl mx-auto px-4 lg:px-6">
        {/* Error Message */}
        {error && (
          <div className="mx-4 mt-4 bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}
        
        {/* Progress Steps */}
        <div className="bg-white lg:mx-0 mx-4 mt-4 rounded-3xl shadow-lg p-6 lg:p-8 mb-6 border border-gray-100">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[
              { num: 1, label: 'Select Items', icon: Package },
              { num: 2, label: 'Schedule', icon: Calendar },
              { num: 3, label: 'Confirm', icon: CheckCircle2 }
            ].map((s, idx) => (
              <React.Fragment key={s.num}>
                <div className="flex flex-col items-center flex-1">
                  <div className={`relative w-14 h-14 lg:w-16 lg:h-16 rounded-2xl flex items-center justify-center font-bold text-base transition-all duration-300 ${
                    step >= s.num 
                      ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white shadow-xl scale-110 ring-4 ring-blue-100' 
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step > s.num ? <Check className="w-7 h-7 lg:w-8 lg:h-8" /> : <s.icon className="w-7 h-7 lg:w-8 lg:h-8" />}
                  </div>
                  <span className={`mt-3 text-xs lg:text-sm font-bold ${step >= s.num ? 'text-blue-600' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {idx < 2 && (
                  <div className={`flex-1 h-1.5 rounded-full mx-3 lg:mx-4 transition-all duration-300 ${
                    step > s.num ? 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Service Type Selection */}
        <div className="bg-white lg:mx-0 mx-4 rounded-3xl shadow-lg p-5 lg:p-6 mb-6 border border-gray-100">
          <h3 className="text-lg lg:text-xl font-extrabold text-gray-900 mb-4">Choose Service Type</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
            {/* Scheduled Service */}
            {vendor?.scheduledServiceConfig?.enabled !== false && (
              <button
                onClick={() => setDeliverySpeed('scheduled')}
                className={`p-5 lg:p-6 rounded-2xl border-2 text-left transition-all duration-300 active:scale-[0.98] ${
                  deliverySpeed === 'scheduled' 
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg ring-2 ring-blue-200' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                  deliverySpeed === 'scheduled' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Calendar className={`w-6 h-6 ${deliverySpeed === 'scheduled' ? 'text-blue-600' : 'text-gray-400'}`} />
                </div>
                <div className={`font-extrabold text-base lg:text-lg mb-1.5 ${deliverySpeed === 'scheduled' ? 'text-blue-900' : 'text-gray-700'}`}>
                  Scheduled Service
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">Pickup in 1-2 days • Standard pricing</p>
              </button>
            )}

            {/* Quick Service */}
            {vendor?.quickServiceConfig?.enabled && (
              <button
                onClick={() => setDeliverySpeed('quick')}
                className={`p-5 lg:p-6 rounded-2xl border-2 text-left transition-all duration-300 active:scale-[0.98] ${
                  deliverySpeed === 'quick' 
                    ? 'border-orange-500 bg-gradient-to-br from-orange-50 to-yellow-50 shadow-lg ring-2 ring-orange-200' 
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-3 ${
                  deliverySpeed === 'quick' ? 'bg-orange-100' : 'bg-gray-100'
                }`}>
                  <Zap className={`w-6 h-6 ${deliverySpeed === 'quick' ? 'text-orange-600' : 'text-gray-400'}`} />
                </div>
                <div className={`font-extrabold text-base lg:text-lg mb-1.5 ${deliverySpeed === 'quick' ? 'text-orange-900' : 'text-gray-700'}`}>
                  Quick Service
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">Pickup today • Express delivery</p>
              </button>
            )}
          </div>
        </div>

        {/* Step Content */}
        <div className="lg:px-0 px-4 space-y-4">
          <div className="lg:grid lg:grid-cols-3 lg:gap-6">
            <div className="lg:col-span-2">
            {step === 1 && (
              <ItemSelector 
                selectedItems={selectedItems}
                onItemsChange={setSelectedItems}
                vendor={vendor}
                deliverySpeed={deliverySpeed}
              />
            )}

            {step === 2 && (
              <SchedulePickup
                deliverySpeed={deliverySpeed}
                onSchedule={(data) => {
                  setSchedule(data);
                  setStep(3);
                }}
              />
            )}

            {step === 3 && (
              <div className="bg-white rounded-2xl shadow-md overflow-hidden max-w-2xl lg:mx-auto">
                <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900">Confirm Order</h2>
                </div>
                
                <div className="p-5 lg:p-6 space-y-4">
                  {/* Vendor Info */}
                  <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="text-4xl">{vendor?.logo || '🧺'}</div>
                    <div>
                      <div className="font-bold text-base text-gray-900">{vendor?.name}</div>
                      <div className="text-sm text-gray-600">{vendor?.address?.area || vendor?.address?.city}</div>
                    </div>
                  </div>

                  {/* Schedule Info */}
                  {schedule && (
                    <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <h4 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-blue-600" />
                        Pickup Details
                      </h4>
                      <div className="space-y-2 text-sm text-gray-700">
                        <p><span className="font-semibold">Date:</span> {schedule.pickupDate ? new Date(schedule.pickupDate).toLocaleDateString('en-IN') : 'Today'}</p>
                        <p><span className="font-semibold">Time:</span> {schedule.timeSlot || 'Not set'}</p>
                        <p><span className="font-semibold">Address:</span> {schedule.address?.street}, {schedule.address?.area}</p>
                        <p><span className="font-semibold">Contact:</span> {schedule.address?.contactName} - {schedule.address?.contactPhone}</p>
                      </div>
                    </div>
                  )}

                  {/* Items List */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                    <h4 className="font-bold text-sm text-gray-900 mb-3 flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      Items ({selectedItems.length})
                    </h4>
                    <div className="space-y-2">
                      {selectedItems.map(item => (
                        <div key={item.itemKey} className="flex justify-between items-center p-2 bg-white rounded-lg">
                          <span className="text-sm text-gray-700 capitalize">{item.quantity}x {item.type.replace('_', ' ')}</span>
                          <span className="font-bold text-sm text-gray-900">₹{item.totalPrice?.toFixed(0) || 0}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pricing Summary */}
                  {pricing && (
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-700">
                          <span>Subtotal</span>
                          <span className="font-semibold">₹{pricing.subtotal?.toFixed(0) || 0}</span>
                        </div>
                        {pricing.pickupCharges > 0 && (
                          <div className="flex justify-between text-gray-700">
                            <span>Pickup</span>
                            <span className="font-semibold">₹{pricing.pickupCharges}</span>
                          </div>
                        )}
                        {pricing.deliveryCharges > 0 && (
                          <div className="flex justify-between text-gray-700">
                            <span>Delivery</span>
                            <span className="font-semibold">₹{pricing.deliveryCharges}</span>
                          </div>
                        )}
                        <div className="border-t-2 border-blue-300 pt-2 mt-2 flex justify-between font-bold text-base text-gray-900">
                          <span>Total</span>
                          <span className="text-blue-600">₹{pricing.total?.toFixed(0) || 0}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setStep(2)}
                      className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-xl font-semibold text-sm hover:bg-gray-200 active:scale-98 transition-all"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleCreateOrder}
                      disabled={loading}
                      className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-xl font-bold text-base shadow-lg active:scale-98 transition-all disabled:bg-gray-300 flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Creating...</span>
                        </>
                      ) : (
                        'Place Order'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            </div>
            
            {/* Order Summary - Sidebar on desktop, fixed bottom on mobile */}
            {selectedItems.length > 0 && (
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-4 fixed bottom-0 left-0 right-0 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 shadow-2xl lg:shadow-md z-50 lg:z-auto">
                  <div className="max-w-md lg:max-w-none mx-auto">
                    <OrderSummary
                      vendor={vendor}
                      items={selectedItems}
                      pricing={pricing}
                      onBack={step > 1 ? () => setStep(step - 1) : onBack}
                      onNext={step < 2 && selectedItems.length > 0 ? () => setStep(step + 1) : null}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

