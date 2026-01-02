import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import subscriptionApi from '../api/subscriptionApi';

// Create context
const SubscriptionContext = createContext();

// Custom hook to use subscription context
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

// Provider component
export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load subscription data
  const loadSubscription = useCallback(async () => {
    try {
      setLoading(true);
      const response = await subscriptionApi.getActiveSubscription();
      setSubscription(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      if (err.response?.status !== 404) {
        console.error('Error loading subscription:', err);
        setError(err.message || 'Failed to load subscription');
      }
      setSubscription(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Load subscription on mount
  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  // Create a new subscription
  const createSubscription = async (subscriptionData) => {
    try {
      setLoading(true);
      const response = await subscriptionApi.createSubscription(subscriptionData);
      await loadSubscription();
      return response;
    } catch (err) {
      console.error('Error creating subscription:', err);
      setError(err.message || 'Failed to create subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update subscription
  const updateSubscription = async (subscriptionId, updateData) => {
    try {
      setLoading(true);
      const response = await subscriptionApi.updateSubscription(subscriptionId, updateData);
      await loadSubscription();
      return response;
    } catch (err) {
      console.error('Error updating subscription:', err);
      setError(err.message || 'Failed to update subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Cancel subscription
  const cancelSubscription = async (subscriptionId, cancelData = {}) => {
    try {
      setLoading(true);
      const response = await subscriptionApi.cancelSubscription(subscriptionId, cancelData);
      await loadSubscription();
      return response;
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setError(err.message || 'Failed to cancel subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Pause subscription
  const pauseSubscription = async (subscriptionId, pauseData) => {
    try {
      setLoading(true);
      const response = await subscriptionApi.pauseSubscription(subscriptionId, pauseData);
      await loadSubscription();
      return response;
    } catch (err) {
      console.error('Error pausing subscription:', err);
      setError(err.message || 'Failed to pause subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Resume subscription
  const resumeSubscription = async (subscriptionId) => {
    try {
      setLoading(true);
      const response = await subscriptionApi.resumeSubscription(subscriptionId);
      await loadSubscription();
      return response;
    } catch (err) {
      console.error('Error resuming subscription:', err);
      setError(err.message || 'Failed to resume subscription');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Skip a delivery
  const skipDelivery = async (subscriptionId, skipData) => {
    try {
      setLoading(true);
      const response = await subscriptionApi.skipDelivery(subscriptionId, skipData);
      await loadSubscription();
      return response;
    } catch (err) {
      console.error('Error skipping delivery:', err);
      setError(err.message || 'Failed to skip delivery');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Customize a meal
  const customizeMeal = async (subscriptionId, customizationData) => {
    try {
      setLoading(true);
      const response = await subscriptionApi.customizeMeal(subscriptionId, customizationData);
      await loadSubscription();
      return response;
    } catch (err) {
      console.error('Error customizing meal:', err);
      setError(err.message || 'Failed to customize meal');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get calendar events
  const getCalendarEvents = async (subscriptionId, params = {}) => {
    try {
      return await subscriptionApi.getCalendarEvents(subscriptionId, params);
    } catch (err) {
      console.error('Error fetching calendar events:', err);
      setError(err.message || 'Failed to fetch calendar events');
      throw err;
    }
  };

  // Get delivery history
  const getDeliveryHistory = async (subscriptionId, params = {}) => {
    try {
      return await subscriptionApi.getDeliveryHistory(subscriptionId, params);
    } catch (err) {
      console.error('Error fetching delivery history:', err);
      setError(err.message || 'Failed to fetch delivery history');
      throw err;
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Context value
  const value = {
    subscription,
    loading,
    error,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    pauseSubscription,
    resumeSubscription,
    skipDelivery,
    customizeMeal,
    getCalendarEvents,
    getDeliveryHistory,
    refreshSubscription: loadSubscription,
    clearError,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

SubscriptionProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default SubscriptionContext;
