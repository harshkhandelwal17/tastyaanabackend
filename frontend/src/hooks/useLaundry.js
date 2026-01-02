// // src/hooks/useLaundry.js
// import { useDispatch, useSelector } from 'react-redux';
// import { 
//   useGetServicesQuery,
//   useGetPlansQuery,
//   useCreateOrderMutation,
//   useGetUserOrdersQuery,
//   useTrackOrderQuery,
//   useCreateSubscriptionMutation,
//   useGetUserSubscriptionsQuery
// } from '../redux/api/laundryApi';
// import {
//   setBookingStep,
//   setBookingService,
//   updateBookingItem,
//   setBookingSchedule,
//   setBookingAddress,
//   setBookingPayment,
//   setSpecialInstructions,
//   setBookingTotal,
//   resetBooking,
//   setBookingLoading,
//   setSelectedPlan,
//   setBillingCycle,
//   selectCurrentBooking,
//   selectBookingStep,
//   selectBookingService,
//   selectBookingItems,
//   selectBookingTotal,
//   selectLaundryUI,
//   selectSelectedPlan,
//   selectBillingCycle
// } from '../redux/Slices/laundrySlice';

// // Custom hook for laundry services
// export const useLaundryServices = () => {
//   const { data: services, isLoading, error, refetch } = useGetServicesQuery();
  
//   return {
//     services: services || [],
//     loading: isLoading,
//     error,
//     refetchServices: refetch
//   };
// };

// // Custom hook for laundry plans
// export const useLaundryPlans = () => {
//   const { data: plans, isLoading, error, refetch } = useGetPlansQuery();
  
//   return {
//     plans: plans || [],
//     loading: isLoading,
//     error,
//     refetchPlans: refetch
//   };
// };

// // Custom hook for order management
// export const useLaundryOrders = () => {
//   const [createOrder, { isLoading: isCreating }] = useCreateOrderMutation();
//   const { data: ordersData, isLoading: isFetching, refetch } = useGetUserOrdersQuery();
  
//   const handleCreateOrder = async (orderData) => {
//     try {
//       const result = await createOrder(orderData).unwrap();
//       return { success: true, data: result };
//     } catch (error) {
//       return { success: false, error: error.message || 'Failed to create order' };
//     }
//   };
  
//   return {
//     orders: ordersData?.orders || [],
//     totalOrders: ordersData?.total || 0,
//     currentPage: ordersData?.page || 1,
//     totalPages: ordersData?.totalPages || 1,
//     loading: isFetching,
//     creating: isCreating,
//     createOrder: handleCreateOrder,
//     refetchOrders: refetch
//   };
// };

// // Custom hook for order tracking
// export const useOrderTracking = (orderId) => {
//   const { data: order, isLoading, error, refetch } = useTrackOrderQuery(orderId, {
//     skip: !orderId,
//     pollingInterval: 30000, // Poll every 30 seconds for real-time updates
//   });
  
//   return {
//     order,
//     loading: isLoading,
//     error,
//     refetchOrder: refetch,
//     stopPolling: () => refetch.abort?.()
//   };
// };

// // Custom hook for subscriptions
// export const useLaundrySubscriptions = () => {
//   const [createSubscription, { isLoading: isCreating }] = useCreateSubscriptionMutation();
//   const { data: subscriptions, isLoading: isFetching, refetch } = useGetUserSubscriptionsQuery();
  
//   const handleCreateSubscription = async (subscriptionData) => {
//     try {
//       const result = await createSubscription(subscriptionData).unwrap();
//       return { success: true, data: result };
//     } catch (error) {
//       return { success: false, error: error.message || 'Failed to create subscription' };
//     }
//   };
  
//   return {
//     subscriptions: subscriptions || [],
//     loading: isFetching,
//     creating: isCreating,
//     createSubscription: handleCreateSubscription,
//     refetchSubscriptions: refetch
//   };
// };

// // Custom hook for booking state management
// export const useBookingState = (services = []) => {
//   const dispatch = useDispatch();
//   const currentBooking = useSelector(selectCurrentBooking);
//   const currentStep = useSelector(selectBookingStep);
//   const selectedService = useSelector(selectBookingService);
//   const bookingItems = useSelector(selectBookingItems);
//   const bookingTotal = useSelector(selectBookingTotal);
//   const ui = useSelector(selectLaundryUI);
  
//   // Helper function to calculate total based on service and items
//   const calculateTotalWithParams = (service, items, services) => {
//     if (!service || !services || services.length === 0) return 0;
    
//     const serviceData = services.find(s => s.id === service);
//     if (!serviceData) return 0;
    
//     let total = 0;
//     Object.entries(items || {}).forEach(([itemName, quantity]) => {
//       if (quantity > 0) {
//         const item = serviceData.items?.find(i => i.name === itemName);
//         if (item) {
//           total += item.price * quantity;
//         }
//       }
//     });
    
//     return total;
//   };

//   // Helper function to calculate total using current state
//   const calculateTotal = () => {
//     return calculateTotalWithParams(selectedService, bookingItems, services);
//   };
  
//   return {
//     // State
//     currentBooking,
//     currentStep,
//     selectedService,
//     bookingItems,
//     bookingTotal,
//     ui,
    
//     // Actions
//     setStep: (step) => dispatch(setBookingStep(step)),
//     setService: (service) => dispatch(setBookingService(service)),
//     updateItem: (itemName, quantity) => dispatch(updateBookingItem({ itemName, quantity })),
//     setSchedule: (scheduleData) => dispatch(setBookingSchedule(scheduleData)),
//     setAddress: (addressData) => dispatch(setBookingAddress(addressData)),
//     setPayment: (paymentMethod) => dispatch(setBookingPayment(paymentMethod)),
//     setInstructions: (instructions) => dispatch(setSpecialInstructions(instructions)),
//     setTotal: (total) => dispatch(setBookingTotal(total)),
//     resetBooking: () => dispatch(resetBooking()),
//     setLoading: (loading) => dispatch(setBookingLoading(loading)),
    
//     // Helpers
//     calculateTotal,
//     calculateTotalWithParams,
    
//     // Navigation helpers
//     nextStep: () => dispatch(setBookingStep(Math.min(currentStep + 1, 4))),
//     prevStep: () => dispatch(setBookingStep(Math.max(currentStep - 1, 1))),
//     goToStep: (step) => dispatch(setBookingStep(step)),
//   };
// };

// // Custom hook for plans state management
// export const usePlansState = () => {
//   const dispatch = useDispatch();
//   const selectedPlan = useSelector(selectSelectedPlan);
//   const billingCycle = useSelector(selectBillingCycle);
  
//   return {
//     selectedPlan,
//     billingCycle,
//     setSelectedPlan: (planId) => dispatch(setSelectedPlan(planId)),
//     setBillingCycle: (cycle) => dispatch(setBillingCycle(cycle)),
//   };
// };

// // Custom hook for comprehensive laundry state
// export const useLaundry = () => {
//   const services = useLaundryServices();
//   const plans = useLaundryPlans();
//   const orders = useLaundryOrders();
//   const subscriptions = useLaundrySubscriptions();
//   const booking = useBookingState();
//   const plansState = usePlansState();
  
//   return {
//     services,
//     plans,
//     orders,
//     subscriptions,
//     booking,
//     plansState,
//   };
// };

// export default useLaundry;
// hooks/useLaundry.js
import { useState, useEffect, useCallback } from 'react';
import laundryService from '../services/laundryService';

/**
 * Compatibility hook: services catalog for booking flow
 * Services come from vendors - no static data
 */
export const useLaundryServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Services should come from vendors, not static data
    // This hook is kept for compatibility but should not be used
    // Use vendor-specific services instead
    setServices([]);
    setLoading(false);
    setError('Services must be loaded from vendors. Use vendor-specific service data.');
  }, []);

  return { services, loading, error, refetchServices: () => {} };
};

/**
 * Compatibility hook: booking state management used by LaundryBooking.jsx
 * Manages local booking state and helpers without Redux.
 */
export const useBookingState = (services = []) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingItems, setBookingItems] = useState({});
  const [uiLoading, setUiLoading] = useState(false);

  const [currentBooking, setCurrentBooking] = useState({
    schedule: {
      pickupDate: '',
      pickupTime: '',
      deliveryDate: '',
      deliveryTime: '',
    },
    address: {
      street: '',
      city: 'Indore',
      pincode: '',
      landmark: '',
    },
    payment: {
      method: 'online',
    },
    specialInstructions: '',
    total: 0,
  });

  // Keep total in sync when items or service change
  const calculateTotalWithParams = useCallback((serviceId, itemsObj, allServices) => {
    if (!serviceId || !allServices || allServices.length === 0) return 0;
    const serviceData = allServices.find((s) => s.id === serviceId);
    if (!serviceData) return 0;

    let total = 0;
    Object.entries(itemsObj || {}).forEach(([itemName, quantity]) => {
      if (quantity > 0) {
        const item = serviceData.items?.find((i) => i.name === itemName);
        if (item) total += item.price * quantity;
      }
    });
    return total;
  }, []);

  const calculateTotal = useCallback(() => {
    return calculateTotalWithParams(selectedService, bookingItems, services);
  }, [selectedService, bookingItems, services, calculateTotalWithParams]);

  useEffect(() => {
    const newTotal = calculateTotal();
    setCurrentBooking((prev) => ({ ...prev, total: newTotal }));
  }, [calculateTotal]);

  // Actions
  const setStep = (step) => setCurrentStep(step);
  const setService = (serviceId) => setSelectedService(serviceId);
  const updateItem = ({ itemName, quantity }) =>
    setBookingItems((prev) => ({ ...prev, [itemName]: Math.max(0, quantity) }));
  const setSchedule = (scheduleData) =>
    setCurrentBooking((prev) => ({ ...prev, schedule: { ...prev.schedule, ...scheduleData } }));
  const setAddress = (addressData) =>
    setCurrentBooking((prev) => ({ ...prev, address: { ...prev.address, ...addressData } }));
  const setPayment = (paymentMethod) =>
    setCurrentBooking((prev) => ({ ...prev, payment: { ...prev.payment, method: paymentMethod } }));
  const setInstructions = (instructions) =>
    setCurrentBooking((prev) => ({ ...prev, specialInstructions: instructions }));
  const setTotal = (total) => setCurrentBooking((prev) => ({ ...prev, total }));
  const resetBooking = () => {
    setCurrentStep(1);
    setSelectedService(null);
    setBookingItems({});
    setUiLoading(false);
    setCurrentBooking({
      schedule: { pickupDate: '', pickupTime: '', deliveryDate: '', deliveryTime: '' },
      address: { street: '', city: 'Indore', pincode: '', landmark: '' },
      payment: { method: 'online' },
      specialInstructions: '',
      total: 0,
    });
  };

  return {
    // State
    currentBooking,
    currentStep,
    selectedService,
    bookingItems,
    bookingTotal: currentBooking.total,
    ui: { loading: uiLoading },

    // Actions
    setStep,
    setService,
    updateItem: (payload) => updateItem(payload),
    setSchedule,
    setAddress,
    setPayment,
    setInstructions,
    setTotal,
    resetBooking,
    setLoading: (loading) => setUiLoading(loading),

    // Helpers
    calculateTotal,
    calculateTotalWithParams,

    // Navigation helpers
    nextStep: () => setCurrentStep((s) => Math.min(s + 1, 4)),
    prevStep: () => setCurrentStep((s) => Math.max(s - 1, 1)),
    goToStep: (step) => setCurrentStep(step),
  };
};

/**
 * Compatibility hook: expose createOrder as useLaundryOrders
 */
export const useLaundryOrders = () => {
  const { createOrder } = useCreateOrder();

  const handleCreateOrder = async (orderData) => {
    try {
      const result = await createOrder(orderData);
      return { success: true, data: result };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to create order' };
    }
  };

  return { createOrder: handleCreateOrder };
};

/**
 * Custom hook for vendor management
 */
export const useVendors = (filters = {}) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchVendors = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await laundryService.getVendors(filters);
      setVendors(response?.data || response || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  return { vendors, loading, error, refetch: fetchVendors };
};

/**
 * Custom hook for single vendor
 */
export const useVendor = (vendorId) => {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!vendorId) return;

    const fetchVendor = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await laundryService.getVendor(vendorId);
        setVendor(response?.data || response || null);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchVendor();
  }, [vendorId]);

  return { vendor, loading, error };
};

/**
 * Custom hook for order management
 */
export const useOrders = (params = {}) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0
  });

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await laundryService.getUserOrders(params);
      setOrders(response?.data || []);
      setPagination({
        page: response?.page || 1,
        total: response?.total || 0,
        pages: response?.pages || 0
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, pagination, refetch: fetchOrders };
};

/**
 * Custom hook for order tracking
 */
export const useOrderTracking = (orderId) => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchOrder = useCallback(async () => {
    if (!orderId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await laundryService.trackOrder(orderId);
      setOrder(response?.data || response || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();

    // Poll every 30 seconds for updates
    const interval = setInterval(fetchOrder, 30000);

    return () => clearInterval(interval);
  }, [fetchOrder]);

  return { order, loading, error, refetch: fetchOrder };
};

/**
 * Custom hook for subscription management
 */
export const useSubscriptions = (status = null) => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = status ? { status } : {};
      const response = await laundryService.getUserSubscriptions(params);
      setSubscriptions(response?.subscriptions || response?.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  return { subscriptions, loading, error, refetch: fetchSubscriptions };
};

/**
 * Custom hook for single subscription
 */
export const useSubscription = (subscriptionId) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSubscription = useCallback(async () => {
    if (!subscriptionId) return;

    setLoading(true);
    setError(null);

    try {
      const response = await laundryService.getSubscription(subscriptionId);
      setSubscription(response?.data || response || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [subscriptionId]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  return { subscription, loading, error, refetch: fetchSubscription };
};

/**
 * Custom hook for price calculation
 */
export const usePriceCalculation = () => {
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const calculatePrice = useCallback(async (vendorId, items) => {
    if (!vendorId || !items || items.length === 0) {
      setPricing(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await laundryService.calculatePrice(vendorId, items);
      setPricing(response?.data || response || null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { pricing, loading, error, calculatePrice };
};

/**
 * Custom hook for order creation
 */
export const useCreateOrder = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);

  const createOrder = useCallback(async (orderData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await laundryService.createOrder(orderData);
      setOrder(response?.data || response || null);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setOrder(null);
    setError(null);
  }, []);

  return { order, loading, error, createOrder, reset };
};

/**
 * Custom hook for subscription creation
 */
export const useCreateSubscription = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subscription, setSubscription] = useState(null);

  const createSubscription = useCallback(async (subscriptionData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await laundryService.createSubscription(subscriptionData);
      setSubscription(response?.data || response || null);
      return response;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSubscription(null);
    setError(null);
  }, []);

  return { subscription, loading, error, createSubscription, reset };
};

/**
 * Custom hook for nearby vendors with geolocation
 */
export const useNearbyVendors = (radius = 10) => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);

  const fetchNearbyVendors = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Get user location via browser
      const userLocation = await new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          return reject(new Error('Geolocation is not supported'));
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
          (err) => reject(new Error(err.message || 'Failed to get location'))
        );
      });
      setLocation(userLocation);

      // Fetch nearby vendors
      const response = await laundryService.getNearbyVendors({
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        radius
      });

      setVendors(response?.data || response || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [radius]);

  useEffect(() => {
    fetchNearbyVendors();
  }, [fetchNearbyVendors]);

  return { vendors, location, loading, error, refetch: fetchNearbyVendors };
};

/**
 * Custom hook for managing cart/selected items
 */
export const useCart = (vendor) => {
  const [items, setItems] = useState([]);

  const addItem = useCallback((item, serviceType) => {
    const itemKey = `${item.id}_${serviceType}`;
    const existing = items.find(i => i.itemKey === itemKey);

    if (existing) {
      setItems(items.map(i =>
        i.itemKey === itemKey
          ? { ...i, quantity: i.quantity + 1, totalPrice: i.pricePerItem * (i.quantity + 1) }
          : i
      ));
    } else {
      const price = vendor?.pricing?.[item.id]?.[serviceType] || 0;
      setItems([...items, {
        itemKey,
        category: item.category,
        type: item.id,
        label: item.label,
        serviceType,
        quantity: 1,
        pricePerItem: price,
        totalPrice: price
      }]);
    }
  }, [items, vendor]);

  const updateQuantity = useCallback((itemKey, quantity) => {
    if (quantity <= 0) {
      setItems(items.filter(i => i.itemKey !== itemKey));
    } else {
      setItems(items.map(i =>
        i.itemKey === itemKey
          ? { ...i, quantity, totalPrice: i.pricePerItem * quantity }
          : i
      ));
    }
  }, [items]);

  const removeItem = useCallback((itemKey) => {
    setItems(items.filter(i => i.itemKey !== itemKey));
  }, [items]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const total = items.reduce((sum, item) => sum + item.totalPrice, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    items,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    total,
    itemCount
  };
};

// Export all hooks
export default {
  useLaundryServices,
  useBookingState,
  useLaundryOrders,
  useVendors,
  useVendor,
  useOrders,
  useOrderTracking,
  useSubscriptions,
  useSubscription,
  usePriceCalculation,
  useCreateOrder,
  useCreateSubscription,
  useNearbyVendors,
  useCart
};