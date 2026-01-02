import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Check, Package, Calendar, CheckCircle2, Zap, Loader2, AlertCircle, Gift, Sparkles } from 'lucide-react';
import { ItemSelector } from '../../../components/laundry/ItemSelector';
import SchedulePickup from '../../../components/laundry/SchedulePickup';
import { OrderSummary } from '../../../components/laundry/OrderSummary';
import laundryService from '../../../services/laundryService';

export const SubscriptionOrderPage = () => {
  const { subscriptionId } = useParams();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [step, setStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSubscriptionData();
  }, [subscriptionId]);

  const loadSubscriptionData = async () => {
    try {
      setLoadingData(true);
      const subResponse = await laundryService.getSubscription(subscriptionId);
      const sub = subResponse?.data || subResponse;
      setSubscription(sub);
      
      // Load vendor details
      if (sub?.vendor?._id) {
        const vendorResponse = await laundryService.getVendor(sub.vendor._id);
        setVendor(vendorResponse?.data || vendorResponse);
      } else if (sub?.vendor) {
        setVendor(sub.vendor);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      setError('Failed to load subscription. Please try again.');
    } finally {
      setLoadingData(false);
    }
  };

  const selectedItemsRef = useRef(selectedItems);
  useEffect(() => {
    selectedItemsRef.current = selectedItems;
  }, [selectedItems]);

  const pricingTimeoutRef = useRef(null);
  
  useEffect(() => {
    if (pricingTimeoutRef.current) {
      clearTimeout(pricingTimeoutRef.current);
    }
    
    if (selectedItems.length > 0 && vendor?._id && subscription) {
      pricingTimeoutRef.current = setTimeout(async () => {
        try {
          setError(null);
          const data = await laundryService.calculatePrice(
            vendor._id, 
            selectedItemsRef.current, 
            'subscription',
            subscriptionId
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
    
    return () => {
      if (pricingTimeoutRef.current) {
        clearTimeout(pricingTimeoutRef.current);
      }
    };
  }, [selectedItems.length, vendor?._id, subscriptionId]);

  const handleCreateOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!vendor?._id) {
        throw new Error('Vendor information is missing. Please refresh the page.');
      }

      if (!subscription) {
        throw new Error('Subscription information is missing. Please refresh the page.');
      }

      if (subscription.status !== 'active') {
        throw new Error('Your subscription is not active. Please activate it first.');
      }

      if (!selectedItems || selectedItems.length === 0) {
        throw new Error('Please select at least one item.');
      }

      // Validate items
      for (const item of selectedItems) {
        if (!item.type || !item.serviceType) {
          throw new Error('Each item must have type and service type.');
        }
        if (!item.quantity || item.quantity < 1) {
          throw new Error('Each item must have quantity of at least 1.');
        }
        if (item.pricingModel === 'weight_based' && (!item.weight || item.weight < 0.1)) {
          throw new Error('Weight-based items must have weight of at least 0.1 kg.');
        }
      }

      // Validate schedule for subscription orders
      if (!schedule?.pickupDate && !schedule?.date) {
        throw new Error('Please select a pickup date.');
      }

      const pickupDate = schedule?.pickupDate || schedule?.date;
      const pickupDateObj = new Date(pickupDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (pickupDateObj < today) {
        throw new Error('Pickup date cannot be in the past.');
      }

      if (!schedule?.address) {
        throw new Error('Please provide pickup address.');
      }

      // Use subscription preferences if schedule address not provided
      const pickupAddress = schedule.address || subscription.preferences?.defaultPickupAddress;
      if (!pickupAddress?.street || !pickupAddress?.pincode) {
        throw new Error('Please provide complete pickup address.');
      }

      const orderData = {
        vendorId: vendor._id,
        items: selectedItems,
        schedule: {
          pickupDate: pickupDate,
          pickupTime: schedule?.pickupTime || schedule?.timeSlot || subscription.preferences?.preferredTimeSlot || 'morning',
          address: pickupAddress
        },
        payment: {
          method: 'subscription',
          status: 'pending'
        },
        deliverySpeed: 'subscription',
        subscriptionId: subscriptionId,
        specialInstructions: schedule?.specialInstructions || subscription.preferences?.specialInstructions || ''
      };

      console.log('Creating subscription order:', orderData);
      
      const result = await laundryService.createOrder(orderData);
      const order = result?.data || result;
      
      // Navigate to order success/tracking
      navigate(`/laundry/orders/${order._id || order.orderNumber}`, {
        state: { 
          message: 'Subscription order created successfully!',
          order: order
        }
      });
    } catch (error) {
      console.error('Error creating order:', error);
      setError(error.message || 'Failed to create order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (error && !subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/laundry/subscriptions')} 
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
          >
            Back to Subscriptions
          </button>
        </div>
      </div>
    );
  }

  if (!subscription || !vendor) {
    return null;
  }

  if (subscription.status !== 'active') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Not Active</h2>
          <p className="text-gray-600 mb-6">Your subscription is currently {subscription.status}. Please activate it to place orders.</p>
          <button 
            onClick={() => navigate('/laundry/subscriptions')} 
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
          >
            Manage Subscription
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="max-w-md lg:max-w-6xl mx-auto p-4 lg:p-6">
        {/* Header with Subscription Info */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/laundry/subscriptions/${subscriptionId}`)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to Subscription
          </button>
          
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl shadow-lg p-6 text-white mb-4">
            <div className="flex items-center gap-3 mb-2">
              <Gift className="w-8 h-8" />
              <div>
                <h1 className="text-2xl font-bold">Subscription Order</h1>
                <p className="text-purple-100">{subscription.plan?.name} - {vendor?.name}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-purple-200">Monthly Price</p>
                <p className="text-xl font-bold">₹{subscription.plan?.price}</p>
              </div>
              <div>
                <p className="text-purple-200">Usage This Month</p>
                <p className="text-xl font-bold">
                  {subscription.usage?.currentMonth?.pickupsCompleted || 0} pickups
                </p>
              </div>
            </div>
          </div>

          {/* Subscription Benefits Banner */}
          <div className="bg-white rounded-xl shadow-md p-4 mb-6 border-l-4 border-purple-500">
            <div className="flex items-start gap-3">
              <Sparkles className="w-6 h-6 text-purple-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">Subscription Benefits</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  {subscription.plan?.features?.unlimitedPickups && (
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Unlimited pickups
                    </li>
                  )}
                  {subscription.plan?.features?.priority && (
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      Priority service
                    </li>
                  )}
                  {subscription.plan?.features?.quickServiceDiscount > 0 && (
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      {subscription.plan.features.quickServiceDiscount}% discount on quick services
                    </li>
                  )}
                  {subscription.plan?.maxWeight && (
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      {subscription.plan.maxWeight} kg per month included
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 rounded-xl">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-red-800 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full font-bold ${
                  step >= stepNum 
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {step > stepNum ? <Check className="w-6 h-6" /> : stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step > stepNum ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-600">
            <span>Select Items</span>
            <span>Schedule</span>
            <span>Confirm</span>
          </div>
        </div>

        {/* Step Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {step === 1 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Select Items</h2>
                <ItemSelector
                  vendor={vendor}
                  selectedItems={selectedItems}
                  onItemsChange={setSelectedItems}
                  deliverySpeed="subscription"
                />
                {selectedItems.length > 0 && (
                  <button
                    onClick={() => setStep(2)}
                    className="mt-6 w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
                  >
                    Continue to Schedule
                  </button>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Schedule Pickup</h2>
                <SchedulePickup
                  onSubmit={(scheduleData) => {
                    setSchedule(scheduleData);
                    setStep(3);
                  }}
                  deliverySpeed="subscription"
                  defaultAddress={subscription.preferences?.defaultPickupAddress}
                  defaultTimeSlot={subscription.preferences?.preferredTimeSlot}
                />
                <button
                  onClick={() => setStep(1)}
                  className="mt-4 w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all"
                >
                  Back to Items
                </button>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Review & Confirm</h2>
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span className="font-semibold text-green-900">Subscription Order</span>
                    </div>
                    <p className="text-sm text-green-700">
                      This order will be charged to your subscription. No additional payment required.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => setStep(2)}
                      className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-all"
                    >
                      Back to Schedule
                    </button>
                    <button
                      onClick={handleCreateOrder}
                      disabled={loading}
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Creating Order...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          Confirm Subscription Order
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          {pricing && (
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-4">
                <OrderSummary
                  vendor={vendor}
                  items={selectedItems}
                  pricing={pricing}
                  deliverySpeed="subscription"
                  subscription={subscription}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

