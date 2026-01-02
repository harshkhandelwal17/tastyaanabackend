/**
 * Validates if a thali replacement is allowed
 * @param {Object} currentThali - Currently selected thali
 * @param {Object} replacement - Replacement thali
 * @param {Array} allowedReplacements - List of allowed replacement thalis
 * @returns {Object} { isValid: boolean, error: string }
 */
export const validateThaliReplacement = (currentThali, replacement, allowedReplacements = []) => {
  // Check if replacement is in allowed list
  const isAllowed = allowedReplacements.some(
    item => item._id === replacement._id || item.id === replacement.id
  );

  if (!isAllowed) {
    return {
      isValid: false,
      error: 'This thali cannot be replaced with the selected option.'
    };
  }

  // Check if replacement is the same as current thali
  if (currentThali._id === replacement._id || currentThali.id === replacement.id) {
    return {
      isValid: false,
      error: 'Cannot replace with the same thali.'
    };
  }

  return { isValid: true };
};

/**
 * Validates if an add-on can be added to the subscription
 * @param {Object} addOn - Add-on to be added
 * @param {Array} currentAddOns - Current add-ons in subscription
 * @param {Object} subscription - Current subscription details
 * @returns {Object} { isValid: boolean, error: string, requiresPayment: boolean, amount: number }
 */
export const validateAddOn = (addOn, currentAddOns = [], subscription) => {
  // Check if add-on is already in the subscription
  const alreadyAdded = currentAddOns.some(
    item => (item._id === addOn._id || item.id === addOn.id) && item.includedInSubscription
  );

  if (alreadyAdded) {
    return {
      isValid: false,
      error: 'This add-on is already included in your subscription.'
    };
  }

  // Check if add-on is included in subscription
  if (addOn.includedInSubscription) {
    return {
      isValid: true,
      requiresPayment: false,
      amount: 0
    };
  }

  // Calculate additional cost for this add-on
  const basePrice = addOn.price || 0;
  let totalTiffins = subscription.pricing.totalThali || 56; // Default to 56 for 30-day plan
  
  // If it's a one-time add-on, don't multiply by total tiffins
  const isOneTime = addOn.type === 'one-time';
  const amount = isOneTime ? basePrice : basePrice * totalTiffins;

  return {
    isValid: true,
    requiresPayment: true,
    amount,
    description: isOneTime 
      ? `One-time charge: ₹${amount.toFixed(2)}`
      : `Recurring charge: ₹${amount.toFixed(2)} (₹${basePrice.toFixed(2)} × ${totalTiffins} tiffins)`
  };
};

/**
 * Validates a customization request
 * @param {Object} customization - Customization details
 * @param {Object} subscription - Current subscription
 * @returns {Object} { isValid: boolean, error: string, requiresPayment: boolean, amount: number }
 */
export const validateCustomization = (customization, subscription) => {
  // Check if customization is allowed for this subscription
  if (!subscription.mealPlan.allowCustomization) {
    return {
      isValid: false,
      error: 'Customization is not allowed for this meal plan.'
    };
  }

  // Calculate additional cost for customization
  const basePrice = customization.price || 0;
  const totalTiffins = subscription.pricing.totalThali || 56;
  const amount = basePrice * totalTiffins;

  return {
    isValid: true,
    requiresPayment: basePrice > 0,
    amount: basePrice > 0 ? amount : 0,
    description: basePrice > 0 
      ? `Customization charge: ₹${amount.toFixed(2)} (₹${basePrice.toFixed(2)} × ${totalTiffins} tiffins)`
      : 'No additional charge for this customization'
  };
};

/**
 * Validates if a thali can be replaced and calculates any additional cost
 * @param {Object} currentThali - Current thali
 * @param {Object} newThali - New thali to replace with
 * @param {Object} subscription - Current subscription
 * @returns {Object} { isValid: boolean, error: string, requiresPayment: boolean, amount: number }
 */
export const validateThaliUpgrade = (currentThali, newThali, subscription) => {
  if (!currentThali || !newThali) {
    return {
      isValid: false,
      error: 'Invalid thali selection.'
    };
  }

  // Check if it's the same thali
  if (currentThali._id === newThali._id || currentThali.id === newThali.id) {
    return {
      isValid: false,
      error: 'This is already your current thali.'
    };
  }

  // Calculate price difference
  const currentPrice = currentThali.price || 0;
  const newPrice = newThali.price || 0;
  const priceDifference = newPrice - currentPrice;

  if (priceDifference <= 0) {
    // Downgrade or same price - no payment required
    return {
      isValid: true,
      requiresPayment: false,
      amount: 0,
      description: 'No additional charge for this change.'
    };
  }

  // Calculate total additional cost for the subscription
  const totalTiffins = subscription.pricing.totalThali || 56;
  const totalAdditional = priceDifference * totalTiffins;

  return {
    isValid: true,
    requiresPayment: true,
    amount: totalAdditional,
    description: `Additional charge: ₹${totalAdditional.toFixed(2)} (₹${priceDifference.toFixed(2)} × ${totalTiffins} tiffins)`
  };
};
