import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, useStripe, useElements } from '@stripe/react-stripe-js';
import { toast } from 'react-hot-toast';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY);

const CheckoutForm = ({ 
  subscription, 
  onSuccess, 
  onError,
  additionalItems = []
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientSecret, setClientSecret] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    // Create PaymentIntent as soon as the component mounts
    const createPaymentIntent = async () => {
      try {
        const response = await fetch('/api/subscriptions/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            subscriptionId: subscription._id,
            amount: calculateTotal(),
            currency: 'inr',
            metadata: {
              type: 'subscription_extra',
              items: additionalItems.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                type: item.type
              }))
            }
          })
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        setClientSecret(data.clientSecret);
      } catch (err) {
        setError(err.message);
        onError(err);
      }
    };

    createPaymentIntent();
  }, [subscription, additionalItems]);

  const calculateTotal = () => {
    return additionalItems.reduce((total, item) => total + (item.price || 0), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    setError(null);

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/subscription/success`,
          receipt_email: subscription.user.email,
        },
        redirect: 'if_required'
      });

      if (stripeError) throw stripeError;
      
      if (paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent);
      }
    } catch (err) {
      console.error('Payment error:', err);
      setError(err.message);
      onError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}
      
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="font-medium text-gray-900 mb-3">Order Summary</h3>
        
        {/* Base Subscription */}
        <div className="flex justify-between py-2 border-b">
          <span>Base Subscription</span>
          <span>₹{subscription.pricing.totalAmount.toFixed(2)}</span>
        </div>
        
        {/* Additional Items */}
        {additionalItems.map((item, index) => (
          <div key={index} className="flex justify-between py-2 text-sm text-gray-600">
            <span>+ {item.name}</span>
            <span>₹{item.price.toFixed(2)}</span>
          </div>
        ))}
        
        {/* Total */}
        <div className="flex justify-between font-medium mt-4 pt-2 border-t">
          <span>Total</span>
          <span>₹{(subscription.pricing.totalAmount + calculateTotal()).toFixed(2)}</span>
        </div>
      </div>
      
      {/* Payment Element */}
      <div className="border border-gray-200 rounded-lg p-4">
        <Elements stripe={stripe} options={{ clientSecret }}>
          <PaymentElement />
        </Elements>
      </div>
      
      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-blue-300 transition-colors"
      >
        {isProcessing ? 'Processing...' : `Pay ₹${calculateTotal().toFixed(2)} Now`}
      </button>
      
      <div className="text-xs text-gray-500 text-center">
        Your subscription will be activated after payment confirmation.
        Daily deductions will be made from your wallet balance.
      </div>
    </form>
  );
};

const PaymentElement = () => {
  const stripe = useStripe();
  const elements = useElements();
  
  // This is a simplified version. In a real app, you'd implement the full PaymentElement
  return (
    <div className="space-y-4">
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center">
          <input
            type="radio"
            id="card"
            name="payment"
            className="h-4 w-4 text-blue-600"
            defaultChecked
          />
          <label htmlFor="card" className="ml-2 block text-sm font-medium text-gray-700">
            Credit or Debit Card
          </label>
        </div>
        <div className="mt-2 pl-6">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Card number"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="MM/YY"
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="CVC"
                className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
        <input
          type="radio"
          id="wallet"
          name="payment"
          className="h-4 w-4 text-blue-600"
          disabled
        />
        <label htmlFor="wallet" className="ml-2 block text-sm font-medium text-gray-400">
          Wallet (for daily deductions only)
        </label>
      </div>
    </div>
  );
};

const SubscriptionPaymentFlow = (props) => {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  );
};

export default SubscriptionPaymentFlow;
