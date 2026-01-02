import api from './api';

/**
 * Get user's active subscriptions
 * @returns {Promise<Array>} List of user's subscriptions
 */
export const getMySubscriptions = async () => {
  try {
    const response = await api.get('/api/subscriptions/me');
    return response.data;
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    throw error;
  }
};

/**
 * Get subscription by ID
 * @param {string} subscriptionId - Subscription ID
 * @returns {Promise<Object>} Subscription details
 */
export const getSubscription = async (subscriptionId) => {
  try {
    const response = await api.get(`/api/subscriptions/${subscriptionId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    throw error;
  }
};

/**
 * Replace thali in subscription
 * @param {string} subscriptionId - Subscription ID
 * @param {Object} data - Replacement data
 * @param {string} data.newThaliId - New thali ID
 * @param {string} [data.paymentIntentId] - Stripe payment intent ID (if payment required)
 * @param {number} [data.additionalAmount] - Additional amount paid (if any)
 * @returns {Promise<Object>} Updated subscription
 */
export const replaceThali = async (subscriptionId, data) => {
  try {
    const response = await api.patch(
      `/api/subscriptions/${subscriptionId}/replace-thali`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error replacing thali:', error);
    throw error;
  }
};

/**
 * Add custom add-ons to subscription
 * @param {string} subscriptionId - Subscription ID
 * @param {Object} data - Add-on data
 * @param {Array<Object>} data.addOns - List of add-ons to add
 * @param {string} [data.paymentIntentId] - Stripe payment intent ID (if payment required)
 * @returns {Promise<Object>} Updated subscription
 */
export const addCustomAddOns = async (subscriptionId, data) => {
  try {
    const response = await api.post(
      `/api/subscriptions/${subscriptionId}/add-ons`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error adding custom add-ons:', error);
    throw error;
  }
};

/**
 * Update subscription customizations
 * @param {string} subscriptionId - Subscription ID
 * @param {Object} data - Customization data
 * @param {Object} data.customizations - Customization preferences
 * @param {string} [data.paymentIntentId] - Stripe payment intent ID (if payment required)
 * @param {number} [data.additionalAmount] - Additional amount paid (if any)
 * @returns {Promise<Object>} Updated subscription
 */
export const updateCustomizations = async (subscriptionId, data) => {
  try {
    const response = await api.patch(
      `/api/customizations/subscriptions/${subscriptionId}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error updating customizations:', error);
    throw error;
  }
};

/**
 * Create a payment intent for subscription modifications
 * @param {Object} data - Payment intent data
 * @param {string} data.subscriptionId - Subscription ID
 * @param {number} data.amount - Amount in smallest currency unit (paise for INR)
 * @param {string} data.currency - Currency code (e.g., 'inr')
 * @param {Object} data.metadata - Additional metadata
 * @returns {Promise<Object>} Payment intent details
 */
export const createPaymentIntent = async (data) => {
  try {
    const response = await api.post(
      '/api/subscriptions/create-payment-intent',
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

/**
 * Get available thali replacements for a subscription
 * @param {string} subscriptionId - Subscription ID
 * @returns {Promise<Array>} List of available thali replacements
 */
export const getAvailableReplacements = async (subscriptionId) => {
  try {
    const response = await api.get(
      `/api/subscriptions/${subscriptionId}/available-replacements`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching available replacements:', error);
    throw error;
  }
};

/**
 * Get available add-ons for a subscription
 * @param {string} subscriptionId - Subscription ID
 * @returns {Promise<Array>} List of available add-ons
 */
export const getAvailableAddOns = async (subscriptionId) => {
  try {
    const response = await api.get(
      `/api/subscriptions/${subscriptionId}/available-addons`
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching available add-ons:', error);
    throw error;
  }
};

/**
 * Skip a meal in the subscription
 * @param {string} subscriptionId - Subscription ID
 * @param {Object} data - Skip meal data
 * @param {string} data.date - Date to skip (YYYY-MM-DD)
 * @param {string} data.mealType - 'morning' or 'evening'
 * @returns {Promise<Object>} Updated subscription
 */
export const skipMeal = async (subscriptionId, data) => {
  try {
    const response = await api.post(
      `/api/subscriptions/${subscriptionId}/skip-meal`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error skipping meal:', error);
    throw error;
  }
};

/**
 * Pause subscription
 * @param {string} subscriptionId - Subscription ID
 * @param {Object} data - Pause data
 * @param {string} data.startDate - Pause start date (YYYY-MM-DD)
 * @param {string} data.endDate - Pause end date (YYYY-MM-DD)
 * @param {string} data.reason - Reason for pausing
 * @returns {Promise<Object>} Updated subscription
 */
export const pauseSubscription = async (subscriptionId, data) => {
  try {
    const response = await api.post(
      `/api/subscriptions/${subscriptionId}/pause`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error pausing subscription:', error);
    throw error;
  }
};

/**
 * Resume subscription
 * @param {string} subscriptionId - Subscription ID
 * @returns {Promise<Object>} Updated subscription
 */
export const resumeSubscription = async (subscriptionId) => {
  try {
    const response = await api.post(
      `/api/subscriptions/${subscriptionId}/resume`
    );
    return response.data;
  } catch (error) {
    console.error('Error resuming subscription:', error);
    throw error;
  }
};

/**
 * Cancel subscription
 * @param {string} subscriptionId - Subscription ID
 * @param {Object} data - Cancellation data
 * @param {string} data.reason - Reason for cancellation
 * @returns {Promise<Object>} Cancellation confirmation
 */
export const cancelSubscription = async (subscriptionId, data) => {
  try {
    const response = await api.post(
      `/api/subscriptions/${subscriptionId}/cancel`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
};
