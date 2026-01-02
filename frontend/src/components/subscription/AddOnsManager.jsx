import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Plus, Minus, Check, Loader2 } from 'lucide-react';
import SubscriptionPaymentFlow from './SubscriptionPaymentFlow';
import { validateAddOn } from '../../utils/subscriptionValidations';
import { LoadingWrapper, Shimmer } from '../common/LoadingWrapper';
import ErrorMessage from './ErrorMessage';

// Skeleton loader for add-on cards
const AddOnSkeleton = ({ count = 3 }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="border border-gray-200 rounded-lg p-4">
        <Shimmer height="20px" width="75%" className="mb-2" />
        <Shimmer height="16px" width="50%" className="mb-3" />
        <div className="flex items-center justify-between mt-4">
          <Shimmer height="24px" width="30%" />
          <Shimmer height="36px" width="100px" rounded="full" />
        </div>
      </div>
    ))}
  </div>
);

const AddOnsManager = ({
  subscription,
  availableAddOns = [],
  onAddOnsUpdate,
  className = '',
  isLoading: externalLoading = false,
  error: externalError = null,
  onError = null,
  onSuccess = null,
  onCancel = null
}) => {
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [selectedAddOnsForPayment, setSelectedAddOnsForPayment] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const isLoading = useMemo(() => externalLoading || isProcessing, [externalLoading, isProcessing]);

  // Initialize selected add-ons from subscription
  useEffect(() => {
    try {
      if (subscription?.addOns?.length) {
        setSelectedAddOns([...subscription.addOns]);
      }
    } catch (err) {
      console.error('Error initializing add-ons:', err);
      setError('Failed to load your subscription details. Please try refreshing the page.');
    }
  }, [subscription]);

  // Check if an add-on is already selected
  const isAddOnSelected = (addOnId) => {
    return selectedAddOns.some(addOn => addOn._id === addOnId || addOn.id === addOnId);
  };

  // Get the quantity of a selected add-on
  const getAddOnQuantity = (addOnId) => {
    const addOn = selectedAddOns.find(a => a._id === addOnId || a.id === addOnId);
    return addOn?.quantity || 0;
  };

  // Handle adding/removing an add-on
  const toggleAddOn = (addOn) => {
    setSelectedAddOns(prev => {
      const isSelected = prev.some(a => a._id === addOn._id || a.id === addOn.id);
      
      if (isSelected) {
        // Remove add-on
        return prev.filter(a => a._id !== addOn._id && a.id !== addOn.id);
      } else {
        // Add add-on with default quantity of 1
        return [...prev, { ...addOn, quantity: 1 }];
      }
    });
  };

  // Handle quantity change for an add-on
  const updateAddOnQuantity = (addOnId, newQuantity) => {
    if (newQuantity < 0) return;
    
    setSelectedAddOns(prev => {
      const addOnIndex = prev.findIndex(a => a._id === addOnId || a.id === addOnId);
      
      if (addOnIndex === -1) return prev;
      
      const updatedAddOns = [...prev];
      const updatedAddOn = { ...updatedAddOns[addOnIndex] };
      
      if (newQuantity === 0) {
        // Remove if quantity is 0
        updatedAddOns.splice(addOnIndex, 1);
      } else {
        // Update quantity
        updatedAddOn.quantity = newQuantity;
        updatedAddOns[addOnIndex] = updatedAddOn;
      }
      
      return updatedAddOns;
    });
  };

  // Calculate total additional amount for add-ons that require payment
  const calculateAdditionalAmount = useCallback(() => {
    if (!subscription) return 0;
    
    return selectedAddOns.reduce((total, addOn) => {
      // Skip add-ons that are already included in the subscription
      if (addOn.includedInSubscription) return total;
      
      // Validate the add-on to check if it requires payment
      const validation = validateAddOn(addOn, subscription.addOns || [], subscription);
      
      if (validation.requiresPayment) {
        // For quantity-based add-ons, multiply by quantity
        const quantity = addOn.quantity || 1;
        return total + (validation.amount * quantity);
      }
      
      return total;
    }, 0);
  }, [selectedAddOns, subscription]);

  // Handle save button click with improved error handling
  const handleSave = async () => {
    if (!subscription) {
      setError('No active subscription found');
      return;
    }
    
    if (isLoading) return; // Prevent multiple clicks
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Validate selected add-ons
      if (!selectedAddOns || !Array.isArray(selectedAddOns)) {
        throw new Error('Invalid selection. Please try again.');
      }
      
      // Filter add-ons that require payment
      const addOnsRequiringPayment = selectedAddOns.filter(addOn => {
        if (!addOn) return false;
        if (addOn.includedInSubscription) return false;
        
        try {
          const validation = validateAddOn(addOn, subscription.addOns || [], subscription);
          return validation.requiresPayment && (validation.amount || 0) > 0;
        } catch (err) {
          console.error('Error validating add-on:', addOn, err);
          return false;
        }
      });
      
      const additionalAmount = calculateAdditionalAmount();
      
      if (isNaN(additionalAmount)) {
        throw new Error('Invalid amount calculation. Please try again.');
      }
      
      if (addOnsRequiringPayment.length > 0 && additionalAmount > 0) {
        // Show payment flow for add-ons that require payment
        setSelectedAddOnsForPayment(addOnsRequiringPayment);
        setPaymentAmount(additionalAmount);
        return;
      }
      
      // No payment required, update subscription directly
      if (typeof onAddOnsUpdate === 'function') {
        await onAddOnsUpdate(selectedAddOns);
      }
      
      // Call success callback if provided
      if (typeof onSuccess === 'function') {
        onSuccess({ addOns: selectedAddOns });
      }
      
      return;
    } catch (err) {
      console.error('Error in handleSave:', err);
      const errorMessage = err?.message || 'Failed to update add-ons. Please try again later.';
      setError(errorMessage);
      
      // If there's an error handler from parent, call it
      if (typeof onError === 'function') {
        onError(err);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  // Check if there are any changes to save
  const hasChanges = useCallback(() => {
    if (!subscription?.addOns) return selectedAddOns.length > 0;
    if (selectedAddOns.length !== subscription.addOns.length) return true;
    
    // Check if any add-on quantities have changed
    for (const addOn of selectedAddOns) {
      const existingAddOn = subscription.addOns.find(a => a.addOnId === addOn.addOnId);
      if (!existingAddOn || existingAddOn.quantity !== addOn.quantity) {
        return true;
      }
    }
    
    return false;
  }, [subscription, selectedAddOns]);
  // Show loading state using LoadingWrapper
  if (isLoading && !showPayment) {
    return (
      <div className={`space-y-4 ${className}`}>
        <h2 className="text-lg font-medium text-gray-900">Loading add-ons...</h2>
        <AddOnSkeleton count={4} />
      </div>
    );
  }

  // Handle payment flow for add-ons that require payment
  const handleAddOnsPayment = async () => {
    try {
      if (addOnsRequiringPayment.length > 0 && additionalAmount > 0) {
        setSelectedAddOnsForPayment(addOnsRequiringPayment);
        setPaymentAmount(additionalAmount);
        setShowPayment(true);
        return true;
      }
      
      // No payment required, update subscription directly
      if (typeof onAddOnsUpdate === 'function') {
        await onAddOnsUpdate(selectedAddOns);
      }
      
      // Call success callback if provided
      if (typeof onSuccess === 'function') {
        onSuccess({ addOns: selectedAddOns });
      }
      
      return false;
    } catch (err) {
      console.error('Error in handleAddOnsPayment:', err);
      const errorMessage = err?.message || 'Failed to process add-ons. Please try again.';
      setError(errorMessage);
      
      // If there's an error handler from parent, call it
      if (typeof onError === 'function') {
        onError(err);
      }
      return false;
    } finally {
      setIsProcessing(false);
    }
  };
  // Handle successful payment with improved error handling
  const handlePaymentSuccess = useCallback(async (paymentIntent) => {
    if (!paymentIntent?.id) {
      setError('Invalid payment confirmation. Please contact support.');
      return;
    }
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // If we have a custom onAddOnsUpdate handler, use it
      if (typeof onAddOnsUpdate === 'function') {
        await onAddOnsUpdate(selectedAddOns, paymentIntent.id);
      }
      
      setShowPayment(false);
      
      // Call success callback if provided
      if (typeof onSuccess === 'function') {
        onSuccess({
          addOns: selectedAddOns,
          paymentIntentId: paymentIntent.id,
          amount: paymentAmount
        });
      }
      
      // If no success callback but we have onAddOnsUpdate, refresh the data
      if (typeof onSuccess !== 'function' && typeof onAddOnsUpdate === 'function') {
        onAddOnsUpdate();
      }
    } catch (err) {
      console.error('Error in handlePaymentSuccess:', err);
      setError(err.message || 'Failed to update your subscription after payment. Please contact support.');
      
      // If there's an error handler from parent, call it
      if (typeof onError === 'function') {
        onError(err);
      }
    } finally {
      setIsProcessing(false);
    }
  }, [onAddOnsUpdate, onSuccess, onError, selectedAddOns, paymentAmount]);

  // Handle payment cancellation with improved messaging
  const handlePaymentCancel = useCallback(() => {
    setShowPayment(false);
    setError('Payment was cancelled. Your subscription has not been updated.');
    setIsProcessing(false);
    
    // If there's a cancellation handler from parent, call it
    if (typeof onCancel === 'function') {
      onCancel();
    }
  }, [onCancel]);

  // Check if there are any changes to save


// Show loading state using LoadingWrapper
if (isLoading && !showPayment) {
return (
  <div className={`space-y-4 ${className}`}>
    <h2 className="text-lg font-medium text-gray-900">Loading add-ons...</h2>
    <AddOnSkeleton count={4} />
  </div>
);
}

// Show payment flow if needed
if (showPayment) {
return (
  <div className={className}>
    <LoadingWrapper
      isLoading={isProcessing}
      loadingComponent={
        <div className="p-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Processing your payment...</p>
        </div>
      }
      error={error}
      errorComponent={
        <div className="p-6">
          <ErrorMessage 
            error={error}
            onRetry={handleSave}
            type="error"
            className="mb-4"
            retryText="Try Again"
            dismissText="Cancel"
            onDismiss={handlePaymentCancel}
          />
        </div>
      }
    >
      <div 
        className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
        role="dialog"
        aria-labelledby="payment-dialog-title"
        aria-describedby="payment-dialog-description"
      >
        <h3 
          id="payment-dialog-title"
          className="text-lg font-medium mb-4"
        >
          Complete Your Purchase
        </h3>
        
        <div id="payment-dialog-description" className="sr-only">
          Complete your payment to update your subscription add-ons
        </div>
        
        <div className="space-y-4 mb-6">
          <h4 className="font-medium">Order Summary</h4>
          
          {selectedAddOnsForPayment?.map((addOn) => (
            <div key={addOn?._id || addOn?.id} className="flex justify-between items-center">
              <div>
                <h4 className="font-medium">{addOn?.name}</h4>
                {addOn?.description && (
                  <p className="text-sm text-gray-500">{addOn.description}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-medium">
                  ₹{((addOn?.price || 0) * (addOn?.quantity || 1)).toFixed(2)}
                </p>
                {(addOn?.quantity || 0) > 1 && (
                  <p className="text-xs text-gray-500">
                    {addOn.quantity} × ₹{(addOn?.price || 0).toFixed(2)} each
                  </p>
                )}
              </div>
            </div>
          ))}
          
          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between font-medium">
              <span>Total</span>
              <span>₹{(paymentAmount || 0).toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <SubscriptionPaymentFlow
          amount={paymentAmount}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
          onError={(err) => {
            setError(err?.message || 'Payment failed. Please try again.');
            setIsProcessing(false);
          }}
          metadata={{
            type: 'subscription_addons',
            subscriptionId: subscription?._id,
            addOns: selectedAddOnsForPayment?.map(a => ({
              id: a?._id || a?.id,
              name: a?.name,
              quantity: a?.quantity || 1,
              price: a?.price
            })) || []
          }}
        />
        
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handlePaymentCancel}
            className="text-sm font-medium text-gray-600 hover:text-gray-800 focus:outline-none"
            disabled={isProcessing}
          >
            Cancel
          </button>
        </div>
      </div>
    </LoadingWrapper>
  </div>
);
}

// Calculate price for an add-on (considering quantity)
const calculateAddOnPrice = (addOn) => {
  if (!addOn) return 0;
  if (addOn.includedInSubscription) return 0;
  
  const validation = validateAddOn(addOn, subscription?.addOns || [], subscription);
  if (!validation?.requiresPayment) return 0;
  
  return (validation.amount || 0) * (addOn.quantity || 1);
};

  // Get add-on status (included, free, paid)
  const getAddOnStatus = (addOn) => {
    if (addOn.includedInSubscription) {
      return { type: 'included', text: 'Included in your plan' };
    }
    
    const validation = validateAddOn(addOn, subscription?.addOns || [], subscription);
    
    if (validation.requiresPayment && validation.amount > 0) {
      return { 
        type: 'paid', 
        text: `₹${validation.amount.toFixed(2)} per ${addOn.unit || 'item'}` 
      };
    }
    
    return { type: 'free', text: 'Free' };
  };

  // Handle external errors
  useEffect(() => {
    if (externalError) {
      setError(externalError);
    }
  }, [externalError]);

  return (
    <div className={`space-y-6 ${className}`} aria-live="polite">
      {/* Show external retry error */}
      {externalError && onError && (
        <ErrorMessage 
          error={externalError} 
          onRetry={onError}
        />
      )}
      
      {/* Show internal errors */}
      {error && !externalError && (
        <ErrorMessage 
          error={error} 
          onRetry={handleSave}
        />
      )}
      
      <div className="space-y-4" role="region" aria-label="Available add-ons">
        <h2 className="text-lg font-medium text-gray-900" id="add-ons-heading">Available Add-ons</h2>
        
        {availableAddOns.length === 0 ? (
          <p className="text-gray-500 text-sm" aria-live="polite">
            No add-ons available for your subscription at this time.
          </p>
        ) : (
          <div 
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
            role="list"
            aria-labelledby="add-ons-heading"
          >
            {availableAddOns.map((addOn) => {
              const isSelected = isAddOnSelected(addOn._id || addOn.id);
              const quantity = getAddOnQuantity(addOn._id || addOn.id);
              const status = getAddOnStatus(addOn);
              const price = calculateAddOnPrice(addOn);
              
              return (
                <div 
                  key={addOn._id || addOn.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                  role="listitem"
                  aria-labelledby={`addon-${addOn._id || addOn.id}-name`}
                  aria-describedby={`addon-${addOn._id || addOn.id}-desc`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h4 
                          id={`addon-${addOn._id || addOn.id}-name`}
                          className="font-medium text-gray-900"
                        >
                          {addOn.name}
                        </h4>
                        {status.type === 'included' && (
                          <span 
                            className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"
                            aria-label="Included in your plan"
                          >
                            Included
                          </span>
                        )}
                      </div>
                      <p 
                        id={`addon-${addOn._id || addOn.id}-desc`}
                        className="text-sm text-gray-500 mt-1"
                      >
                        {addOn.description}
                      </p>
                      <p className="text-sm mt-2">
                        <span 
                          className={`${
                            status.type === 'paid' ? 'text-blue-600 font-medium' : 'text-gray-600'
                          }`}
                          aria-label={`Price: ${status.text}`}
                        >
                          {status.text}
                        </span>
                      </p>
                    </div>
                    
                    <div className="ml-4">
                      {addOn.allowQuantity ? (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateAddOnQuantity(addOn._id || addOn.id, Math.max(0, quantity - 1));
                            }}
                            className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                            aria-label={`Decrease quantity of ${addOn.name}`}
                            disabled={isLoading}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span 
                            className="w-8 text-center"
                            aria-live="polite"
                            aria-atomic="true"
                          >
                            {quantity}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateAddOnQuantity(addOn._id || addOn.id, quantity + 1);
                            }}
                            className="p-1 text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                            aria-label={`Increase quantity of ${addOn.name}`}
                            disabled={isLoading}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => toggleAddOn(addOn)}
                          className={`p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                            isSelected 
                              ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' 
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                          aria-pressed={isSelected}
                          aria-label={`${isSelected ? 'Remove' : 'Add'} ${addOn.name} ${isSelected ? 'from' : 'to'} your subscription`}
                          disabled={isLoading}
                        >
                          {isSelected ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Plus className="h-4 w-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {price > 0 && isSelected && (
                    <div 
                      className="mt-2 text-sm text-blue-600"
                      aria-live="polite"
                    >
                      + ₹{price.toFixed(2)} {addOn.allowQuantity && `(₹${(price / quantity).toFixed(2)} × ${quantity})`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={!hasChanges || isLoading}
          className={`px-4 py-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            hasChanges 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-gray-300 cursor-not-allowed'
          }`}
          aria-busy={isLoading}
          aria-disabled={!hasChanges || isLoading}
        >
          {isLoading ? (
            <span className="flex items-center">
              <Loader2 className="animate-spin h-4 w-4 mr-2" />
              Saving...
            </span>
          ) : (
            'Save Changes'
          )}
        </button>
      </div>
      
      <div className="text-xs text-gray-500 mt-2">
        <p>• Included add-ons are part of your subscription and won't incur additional charges.</p>
        <p>• Additional charges will be applied to your payment method immediately.</p>
        <p>• Daily deductions for base meals and included add-ons will be made from your wallet balance.</p>
      </div>
    </div>
  );
};

export default AddOnsManager;
