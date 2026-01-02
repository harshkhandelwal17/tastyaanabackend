import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { validateThaliReplacement, validateThaliUpgrade } from '../../utils/subscriptionValidations';
import SubscriptionPaymentFlow from './SubscriptionPaymentFlow';

const ThaliReplacementModal = ({
  isOpen,
  onClose,
  currentThali,
  availableReplacements = [],
  subscription,
  onConfirmReplacement
}) => {
  const [selectedThali, setSelectedThali] = useState(null);
  const [validation, setValidation] = useState({ isValid: false });
  const [showPayment, setShowPayment] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (selectedThali) {
      const validation = validateThaliReplacement(
        currentThali,
        selectedThali,
        availableReplacements
      );
      
      if (validation.isValid) {
        const upgradeValidation = validateThaliUpgrade(
          currentThali,
          selectedThali,
          subscription
        );
        
        setValidation({
          ...validation,
          ...upgradeValidation
        });
      } else {
        setValidation(validation);
      }
    }
  }, [selectedThali, currentThali, availableReplacements, subscription]);

  const handleConfirm = async () => {
    if (!validation.isValid) return;
    
    if (validation.requiresPayment) {
      setShowPayment(true);
      return;
    }
    
    await handleReplacement();
  };

  const handlePaymentSuccess = async (paymentIntent) => {
    try {
      await handleReplacement(paymentIntent.id);
    } catch (error) {
      console.error('Error completing replacement after payment:', error);
    }
  };

  const handleReplacement = async (paymentIntentId) => {
    setIsLoading(true);
    try {
      await onConfirmReplacement({
        newThaliId: selectedThali._id || selectedThali.id,
        paymentIntentId,
        additionalAmount: validation.amount || 0
      });
      onClose();
    } catch (error) {
      console.error('Error replacing thali:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Replace Your Thali</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {!showPayment ? (
            <>
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Select a new thali to replace your current one. Additional charges may apply.
                </p>
                
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {availableReplacements.map((thali) => (
                    <div 
                      key={thali._id || thali.id}
                      onClick={() => setSelectedThali(thali)}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        (selectedThali?._id === thali._id || selectedThali?.id === thali.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-gray-900">{thali.name}</h4>
                          <p className="text-sm text-gray-600">{thali.description}</p>
                        </div>
                        <span className="font-medium">₹{thali.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {!validation.isValid && selectedThali && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                  <p className="text-yellow-700 text-sm">{validation.error}</p>
                </div>
              )}

              {validation.isValid && validation.requiresPayment && (
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
                  <p className="text-blue-700 text-sm">
                    {validation.description}
                  </p>
                </div>
              )}

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={!validation.isValid || isLoading}
                  className={`px-4 py-2 rounded-md text-white ${
                    validation.requiresPayment 
                      ? 'bg-blue-600 hover:bg-blue-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  } disabled:opacity-50`}
                >
                  {isLoading ? 'Processing...' : 
                   validation.requiresPayment ? 'Continue to Payment' : 'Confirm Replacement'}
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Complete Your Payment</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please complete the payment to confirm your thali replacement.
              </p>
              
              <SubscriptionPaymentFlow
                subscription={subscription}
                additionalItems={[{
                  id: 'thali-upgrade',
                  name: `Upgrade to ${selectedThali?.name}`,
                  price: validation.amount,
                  type: 'thali_upgrade'
                }]}
                onSuccess={handlePaymentSuccess}
                onError={(error) => {
                  console.error('Payment error:', error);
                  setShowPayment(false);
                }}
              />
              
              <button
                type="button"
                onClick={() => setShowPayment(false)}
                className="mt-4 text-sm text-blue-600 hover:text-blue-800"
              >
                ← Back to selection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ThaliReplacementModal;
