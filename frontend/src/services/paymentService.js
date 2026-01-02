import api from './api';

/**
 * Create a payment intent for a subscription modification
 * @param {string} subscriptionId - The subscription ID
 * @param {number} amount - Amount in the smallest currency unit (paise for INR)
 * @param {string} currency - Currency code (default: 'inr')
 * @param {Object} metadata - Additional metadata for the payment intent
 * @returns {Promise<Object>} Payment intent details
 */
export const createPaymentIntent = async (subscriptionId, amount, currency = 'inr', metadata = {}) => {
  try {
    const response = await api.post('/api/payments/create-payment-intent', {
      subscriptionId,
      amount,
      currency,
      metadata: {
        type: 'subscription_modification',
        ...metadata
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
};

/**
 * Confirm a payment intent
 * @param {string} paymentIntentId - The payment intent ID
 * @param {Object} paymentMethod - Payment method details
 * @returns {Promise<Object>} Confirmation result
 */
export const confirmPaymentIntent = async (paymentIntentId, paymentMethod) => {
  try {
    const response = await api.post('/api/payments/confirm-payment-intent', {
      paymentIntentId,
      paymentMethod
    });
    return response.data;
  } catch (error) {
    console.error('Error confirming payment intent:', error);
    throw error;
  }
};

/**
 * Get payment methods for the current user
 * @returns {Promise<Array>} List of payment methods
 */
export const getPaymentMethods = async () => {
  try {
    const response = await api.get('/api/payments/methods');
    return response.data;
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    throw error;
  }
};

/**
 * Add a payment method
 * @param {Object} paymentMethod - Payment method details
 * @returns {Promise<Object>} Added payment method
 */
export const addPaymentMethod = async (paymentMethod) => {
  try {
    const response = await api.post('/api/payments/methods', { paymentMethod });
    return response.data;
  } catch (error) {
    console.error('Error adding payment method:', error);
    throw error;
  }
};

/**
 * Remove a payment method
 * @param {string} paymentMethodId - The payment method ID to remove
 * @returns {Promise<Object>} Removal result
 */
export const removePaymentMethod = async (paymentMethodId) => {
  try {
    const response = await api.delete(`/api/payments/methods/${paymentMethodId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing payment method:', error);
    throw error;
  }
};

/**
 * Get payment history for the current user
 * @param {Object} options - Query options (limit, starting_after, etc.)
 * @returns {Promise<Array>} List of payment intents
 */
export const getPaymentHistory = async (options = {}) => {
  try {
    const response = await api.get('/api/payments/history', { params: options });
    return response.data;
  } catch (error) {
    console.error('Error fetching payment history:', error);
    throw error;
  }
};

/**
 * Handle subscription payment for additional charges
 * @param {string} subscriptionId - The subscription ID
 * @param {number} amount - Amount in the smallest currency unit
 * @param {string} description - Description of the charge
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Payment result
 */
export const paySubscriptionCharge = async (subscriptionId, amount, description, metadata = {}) => {
  try {
    const response = await api.post('/api/subscriptions/pay-charge', {
      subscriptionId,
      amount,
      description,
      metadata
    });
    return response.data;
  } catch (error) {
    console.error('Error processing subscription payment:', error);
    throw error;
  }
};

/**
 * Get payment details for a specific subscription
 * @param {string} subscriptionId - The subscription ID
 * @returns {Promise<Object>} Payment details including upcoming payment info
 */
export const getSubscriptionPaymentDetails = async (subscriptionId) => {
  try {
    const response = await api.get(`/api/subscriptions/${subscriptionId}/payment-details`);
    return response.data;
  } catch (error) {
    console.error('Error fetching subscription payment details:', error);
    throw error;
  }
};
