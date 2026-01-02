import React, { useState, useEffect } from 'react';

const PaymentConfirmationPage = () => {
  // Sample order data - would typically come from props or state management
  const [orderData, setOrderData] = useState({
    orderNumber: "#TH2025-001847",
    orderDate: new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    estimatedDelivery: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }),
    customer: {
      name: "Rajesh Kumar",
      email: "rajesh.kumar@email.com",
      phone: "+91 98765 43210",
      address: {
        street: "123 MG Road, Sector 15",
        city: "Indore",
        state: "Madhya Pradesh",
        pincode: "452001"
      }
    },
    selectedPlan: {
      id: "weekly",
      name: "10 Days Plan",
      duration: "10 Days",
      price: 100,
      originalPrice: 120,
      discount: "15% off"
    },
    selectedAddOns: [
      {
        id: "lassi",
        name: "Mango Lassi",
        description: "Creamy yogurt drink with fresh mango",
        price: 3,
        quantity: 10
      },
      {
        id: "pickle",
        name: "Homemade Pickle",
        description: "Tangy and spicy traditional pickle",
        price: 2,
        quantity: 10
      }
    ],
    customizations: ["No Onions", "Less Spicy"],
    dietaryPreference: "Vegetarian",
    subscriptionType: "Subscribe & Save",
    paymentMethod: "Credit Card",
    cardLast4: "4532",
    subtotal: 150,
    discount: 30,
    deliveryFee: 0,
    tax: 12,
    total: 132
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [animatedItems, setAnimatedItems] = useState(new Set());

  // Animation effects
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedItems(new Set(['header', 'summary', 'details', 'features']));
      setShowSuccess(true);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const features = [
    {
      title: "Auto-Order",
      description: "Your order will be automatically renewed. You can cancel or edit your order until 6 AM on the day of delivery.",
      icon: "🔄"
    },
    {
      title: "Daily Customization", 
      description: "Customize your add-ons for each day after placing your order.",
      icon: "⚙️"
    },
    {
      title: "Reminders",
      description: "Get in-app and push notifications to remind you of cutoff times.",
      icon: "🔔"
    },
    {
      title: "Support",
      description: "For any issues, contact our emergency support or chat with our bot.",
      icon: "💬"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-25 to-teal-50">
      {/* Floating success particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-green-300 rounded-full animate-float"></div>
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-emerald-300 rounded-full animate-float-delayed"></div>
        <div className="absolute top-1/2 left-3/4 w-1 h-1 bg-teal-300 rounded-full animate-float"></div>
      </div>

      {/* Header */}
      <header className="bg-white/90 backdrop-blur-md shadow-lg border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🏠</span>
              <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Ghar Ka Khana
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-green-700 font-medium">Order Confirmed</span>
              <div className="w-10 h-10 bg-gradient-to-br from-green-200 to-emerald-300 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Success Animation */}
      {showSuccess && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 animate-bounce-in">
          <div className="bg-green-500 rounded-full p-8 shadow-2xl">
            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Success Header */}
        <div className={`text-center mb-12 ${
          animatedItems.has('header') ? 'animate-fade-in-up' : 'opacity-0'
        }`}>
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center shadow-xl">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-4">
            Order Confirmed!
          </h1>
          <p className="text-lg text-green-700 mb-2">Thank you for your order</p>
          <p className="text-green-600">Order {orderData.orderNumber}</p>
          <p className="text-sm text-gray-600 mt-2">Estimated delivery: {orderData.estimatedDelivery}</p>
        </div>

        {/* Order Summary */}
        <div className={`bg-white/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-xl border border-green-100 mb-8 ${
          animatedItems.has('summary') ? 'animate-fade-in-up' : 'opacity-0'
        }`} style={{ animationDelay: '200ms' }}>
          <h2 className="text-2xl font-bold text-green-800 mb-6">Order Summary</h2>
          
          {/* Selected Plan */}
          <div className="border-b border-green-100 pb-6 mb-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-green-800">{orderData.selectedPlan.name}</h3>
                <p className="text-sm text-gray-600">{orderData.subscriptionType}</p>
                <p className="text-sm text-green-600">{orderData.dietaryPreference}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center">
                  <span className="text-xl font-bold text-green-600">${orderData.selectedPlan.price}</span>
                  {orderData.selectedPlan.originalPrice && (
                    <span className="text-sm text-gray-400 line-through ml-2">${orderData.selectedPlan.originalPrice}</span>
                  )}
                </div>
                {orderData.selectedPlan.discount && (
                  <span className="text-xs text-red-600 font-medium">{orderData.selectedPlan.discount}</span>
                )}
              </div>
            </div>
            
            {/* Customizations */}
            {orderData.customizations.length > 0 && (
              <div className="bg-green-50 rounded-lg p-3">
                <p className="text-sm font-medium text-green-800 mb-1">Customizations:</p>
                <p className="text-sm text-green-700">{orderData.customizations.join(', ')}</p>
              </div>
            )}
          </div>

          {/* Add-ons */}
          {orderData.selectedAddOns.length > 0 && (
            <div className="border-b border-green-100 pb-6 mb-6">
              <h4 className="font-semibold text-green-800 mb-4">Add-ons</h4>
              {orderData.selectedAddOns.map((addOn, index) => (
                <div key={addOn.id} className="flex justify-between items-center mb-3">
                  <div>
                    <p className="font-medium text-gray-800">{addOn.name}</p>
                    <p className="text-sm text-gray-600">Qty: {addOn.quantity}</p>
                  </div>
                  <span className="font-semibold text-green-600">${addOn.price * addOn.quantity}</span>
                </div>
              ))}
            </div>
          )}

          {/* Payment Breakdown */}
          <div className="space-y-3">
            <div className="flex justify-between text-gray-700">
              <span>Subtotal</span>
              <span>${orderData.subtotal}</span>
            </div>
            {orderData.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-${orderData.discount}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-700">
              <span>Delivery Fee</span>
              <span>{orderData.deliveryFee === 0 ? 'FREE' : `$${orderData.deliveryFee}`}</span>
            </div>
            <div className="flex justify-between text-gray-700">
              <span>Tax</span>
              <span>${orderData.tax}</span>
            </div>
            <div className="border-t border-green-200 pt-3 flex justify-between text-xl font-bold text-green-800">
              <span>Total</span>
              <span>${orderData.total}</span>
            </div>
          </div>
        </div>

        {/* Customer & Delivery Details */}
        <div className={`grid md:grid-cols-2 gap-8 mb-8 ${
          animatedItems.has('details') ? 'animate-fade-in-up' : 'opacity-0'
        }`} style={{ animationDelay: '400ms' }}>
          {/* Customer Information */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-green-100">
            <h3 className="text-lg font-bold text-green-800 mb-4">Customer Information</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Name</p>
                <p className="font-medium text-gray-800">{orderData.customer.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-800">{orderData.customer.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Phone</p>
                <p className="font-medium text-gray-800">{orderData.customer.phone}</p>
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-green-100">
            <h3 className="text-lg font-bold text-green-800 mb-4">Delivery Address</h3>
            <div className="text-gray-700">
              <p className="font-medium">{orderData.customer.address.street}</p>
              <p>{orderData.customer.address.city}, {orderData.customer.address.state}</p>
              <p>{orderData.customer.address.pincode}</p>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className={`bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-green-100 mb-8 ${
          animatedItems.has('details') ? 'animate-fade-in-up' : 'opacity-0'
        }`} style={{ animationDelay: '500ms' }}>
          <h3 className="text-lg font-bold text-green-800 mb-4">Payment Method</h3>
          <div className="flex items-center">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-2 rounded-lg mr-4">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2v2h12V6H4zm0 4v4h12v-4H4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-800">{orderData.paymentMethod}</p>
              <p className="text-sm text-gray-600">**** **** **** {orderData.cardLast4}</p>
            </div>
          </div>
        </div>

        {/* Service Features */}
        <div className={`bg-white/80 backdrop-blur-sm rounded-3xl p-6 sm:p-8 shadow-xl border border-green-100 mb-8 ${
          animatedItems.has('features') ? 'animate-fade-in-up' : 'opacity-0'
        }`} style={{ animationDelay: '600ms' }}>
          <h2 className="text-2xl font-bold text-green-800 mb-8 text-center">What's Next?</h2>
          
          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="bg-green-50/80 rounded-xl p-6 hover:bg-green-100/80 transition-all duration-300 hover:scale-105"
                style={{ animationDelay: `${700 + index * 100}ms` }}
              >
                <div className="flex items-start">
                  <span className="text-3xl mr-4">{feature.icon}</span>
                  <div>
                    <h3 className="font-bold text-green-800 mb-2">{feature.title}</h3>
                    <p className="text-sm text-green-700 leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
            Track Your Order
          </button>
          <button className="bg-white border-2 border-green-300 text-green-700 hover:bg-green-50 font-semibold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
            Download Receipt
          </button>
        </div>
      </main>

      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.3);
          }
          50% {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1.1);
          }
          100% {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.8);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }

        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-15px);
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }

        .animate-bounce-in {
          animation: bounce-in 2s ease-out;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: float-delayed 4s ease-in-out infinite;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: #f0fdf4;
        }

        ::-webkit-scrollbar-thumb {
          background: #22c55e;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #16a34a;
        }

        /* Glass morphism effect */
        .backdrop-blur-sm {
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        .backdrop-blur-md {
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
      `}</style>
    </div>
  );
};

export default PaymentConfirmationPage;