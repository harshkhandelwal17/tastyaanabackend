import { useState, useCallback } from 'react';
import { 
  getMySubscriptions,
  getSubscription,
  replaceThali,
  addCustomAddOns,
  updateCustomizations,
  createPaymentIntent,
  getAvailableReplacements,
  getAvailableAddOns,
  skipMeal,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription
} from '../services/subscriptionService';
import { validateAddOn, validateCustomization } from '../utils/subscriptionValidations';

const useSubscription = () => {
  const [subscription, setSubscription] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [availableReplacements, setAvailableReplacements] = useState([]);
  const [availableAddOns, setAvailableAddOns] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user's subscriptions
  const fetchMySubscriptions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMySubscriptions();
      setSubscriptions(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch subscriptions');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch a single subscription by ID
  const fetchSubscription = useCallback(async (subscriptionId) => {
    if (!subscriptionId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await getSubscription(subscriptionId);
      setSubscription(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch subscription');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch available thali replacements for a subscription
  const fetchAvailableReplacements = useCallback(async (subscriptionId) => {
    if (!subscriptionId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAvailableReplacements(subscriptionId);
      setAvailableReplacements(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch available replacements');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch available add-ons for a subscription
  const fetchAvailableAddOns = useCallback(async (subscriptionId) => {
    if (!subscriptionId) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAvailableAddOns(subscriptionId);
      setAvailableAddOns(data);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch available add-ons');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle thali replacement
  const handleReplaceThali = useCallback(async (subscriptionId, newThaliId, paymentIntentId = null, additionalAmount = 0) => {
    if (!subscriptionId || !newThaliId) {
      throw new Error('Subscription ID and new thali ID are required');
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await replaceThali(subscriptionId, {
        newThaliId,
        paymentIntentId,
        additionalAmount
      });
      
      // Update local state
      setSubscription(prev => ({
        ...prev,
        ...data,
        thali: data.thali || prev.thali
      }));
      
      return data;
    } catch (err) {
      setError(err.message || 'Failed to replace thali');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle adding custom add-ons
  const handleAddCustomAddOns = useCallback(async (subscriptionId, addOns, paymentIntentId = null) => {
    if (!subscriptionId || !addOns?.length) {
      throw new Error('Subscription ID and at least one add-on are required');
    }
    
    setIsLoading(true);
    setError(null);
    try {
      // Validate add-ons
      const validatedAddOns = addOns.map(addOn => {
        const validation = validateAddOn(addOn, subscription.currentAddOns || [], subscription);
        if (!validation.isValid) {
          throw new Error(validation.error || 'Invalid add-on');
        }
        return {
          ...addOn,
          requiresPayment: validation.requiresPayment,
          additionalAmount: validation.amount || 0
        };
      });
      
      const data = await addCustomAddOns(subscriptionId, {
        addOns: validatedAddOns,
        paymentIntentId
      });
      
      // Update local state
      setSubscription(prev => ({
        ...prev,
        ...data,
        addOns: [...(prev.addOns || []), ...validatedAddOns]
      }));
      
      return data;
    } catch (err) {
      setError(err.message || 'Failed to add custom add-ons');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [subscription]);

  // Handle updating customizations
  const handleUpdateCustomizations = useCallback(async (subscriptionId, customizations, paymentIntentId = null, additionalAmount = 0) => {
    if (!subscriptionId || !customizations) {
      throw new Error('Subscription ID and customizations are required');
    }
    
    setIsLoading(true);
    setError(null);
    try {
      // Validate customizations
      const validation = validateCustomization(customizations, subscription);
      if (!validation.isValid) {
        throw new Error(validation.error || 'Invalid customization');
      }
      
      const data = await updateCustomizations(subscriptionId, {
        customizations,
        paymentIntentId,
        additionalAmount: validation.requiresPayment ? validation.amount : 0
      });
      
      // Update local state
      setSubscription(prev => ({
        ...prev,
        ...data,
        customizations: {
          ...prev.customizations,
          ...customizations
        }
      }));
      
      return data;
    } catch (err) {
      setError(err.message || 'Failed to update customizations');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [subscription]);

  // Handle skipping a meal
  const handleSkipMeal = useCallback(async (subscriptionId, date, mealType) => {
    if (!subscriptionId || !date || !mealType) {
      throw new Error('Subscription ID, date, and meal type are required');
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await skipMeal(subscriptionId, { date, mealType });
      
      // Update local state
      setSubscription(prev => ({
        ...prev,
        ...data,
        skippedMeals: [...(prev.skippedMeals || []), { date, mealType }]
      }));
      
      return data;
    } catch (err) {
      setError(err.message || 'Failed to skip meal');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle pausing subscription
  const handlePauseSubscription = useCallback(async (subscriptionId, startDate, endDate, reason) => {
    if (!subscriptionId || !startDate || !endDate) {
      throw new Error('Subscription ID, start date, and end date are required');
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await pauseSubscription(subscriptionId, {
        startDate,
        endDate,
        reason: reason || 'Paused by user'
      });
      
      // Update local state
      setSubscription(prev => ({
        ...prev,
        ...data,
        status: 'paused',
        pauseDetails: {
          startDate,
          endDate,
          reason: reason || 'Paused by user'
        }
      }));
      
      return data;
    } catch (err) {
      setError(err.message || 'Failed to pause subscription');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle resuming subscription
  const handleResumeSubscription = useCallback(async (subscriptionId) => {
    if (!subscriptionId) {
      throw new Error('Subscription ID is required');
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await resumeSubscription(subscriptionId);
      
      // Update local state
      setSubscription(prev => ({
        ...prev,
        ...data,
        status: 'active',
        pauseDetails: null
      }));
      
      return data;
    } catch (err) {
      setError(err.message || 'Failed to resume subscription');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle canceling subscription
  const handleCancelSubscription = useCallback(async (subscriptionId, reason) => {
    if (!subscriptionId) {
      throw new Error('Subscription ID is required');
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await cancelSubscription(subscriptionId, {
        reason: reason || 'Cancelled by user'
      });
      
      // Update local state
      setSubscription(prev => ({
        ...prev,
        ...data,
        status: 'cancelled',
        cancellationDetails: {
          cancelledAt: new Date().toISOString(),
          reason: reason || 'Cancelled by user'
        }
      }));
      
      return data;
    } catch (err) {
      setError(err.message || 'Failed to cancel subscription');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create payment intent for subscription modifications
  const createSubscriptionPaymentIntent = useCallback(async (subscriptionId, amount, currency = 'inr', metadata = {}) => {
    if (!subscriptionId || !amount) {
      throw new Error('Subscription ID and amount are required');
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const data = await createPaymentIntent({
        subscriptionId,
        amount: Math.round(amount * 100), // Convert to paise
        currency,
        metadata: {
          type: 'subscription_modification',
          ...metadata
        }
      });
      
      return data;
    } catch (err) {
      setError(err.message || 'Failed to create payment intent');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    // State
    subscription,
    subscriptions,
    availableReplacements,
    availableAddOns,
    isLoading,
    error,
    
    // Actions
    fetchMySubscriptions,
    fetchSubscription,
    fetchAvailableReplacements,
    fetchAvailableAddOns,
    handleReplaceThali,
    handleAddCustomAddOns,
    handleUpdateCustomizations,
    handleSkipMeal,
    handlePauseSubscription,
    handleResumeSubscription,
    handleCancelSubscription,
    createSubscriptionPaymentIntent
  };
};

export default useSubscription;
