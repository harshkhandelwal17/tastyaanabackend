import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useOrderNotifications } from "../../hooks/useNotificationActions";
import {
  CheckCircle,
  Package,
  Truck,
  Calendar,
  MapPin,
  Download,
  Mail,
  Share2,
  ArrowLeft,
  Star,
} from "lucide-react";

const OrderSuccessPage = () => {
  const dispatch = useDispatch();
  const [showConfetti, setShowConfetti] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  
  // Notification system
  const { sendOrderConfirmation } = useOrderNotifications();

  // Mock order data
  const orderData = {
    orderNumber: "ORD-2025-004",
    orderDate: new Date().toLocaleDateString(),
    estimatedDelivery: new Date(
      Date.now() + 5 * 24 * 60 * 60 * 1000
    ).toLocaleDateString(),
    total: 359.97,
    paymentMethod: "**** 4532",
    email: "customer@example.com",
    shippingAddress: {
      name: "John Doe",
      street: "123 Main Street",
      city: "New York",
      state: "NY",
      zip: "10001",
    },
    items: [
      {
        id: 1,
        name: "Wireless Bluetooth Headphones",
        image:
          "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=150",
        price: 199.99,
        quantity: 1,
      },
      {
        id: 2,
        name: "Smartphone Case",
        image:
          "https://images.unsplash.com/photo-1601972602288-f5fa5a066b5a?w=150",
        price: 29.99,
        quantity: 2,
      },
      {
        id: 3,
        name: "Wireless Charging Pad",
        image:
          "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=150",
        price: 49.99,
        quantity: 2,
      },
    ],
  };

  const orderSteps = [
    { label: "Order Confirmed", icon: CheckCircle, completed: true },
    { label: "Processing", icon: Package, completed: false },
    { label: "Shipped", icon: Truck, completed: false },
    { label: "Delivered", icon: CheckCircle, completed: false },
  ];

  useEffect(() => {
    setTimeout(() => setShowConfetti(false), 3000);
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % 4);
    }, 2000);
    
    // Send order confirmation notification
    sendOrderConfirmation({
      id: orderData.orderNumber,
      orderNumber: orderData.orderNumber,
      totalAmount: orderData.total,
      estimatedDelivery: orderData.estimatedDelivery,
      items: orderData.items,
      customerName: orderData.shippingAddress.name
    });
    
    return () => clearInterval(interval);
  }, []);

  // const ConfettiAnimation = () => (
  //   <div className="fixed inset-0 pointer-events-none z-50">
  //     {[...Array(50)].map((_, i) => (
  //       <div
  //         key={i}
  //         className="absolute animate-bounce"
  //         style={{
  //           left: `${Math.random() * 100}%`,
  //           top: `${Math.random() * 100}%`,
  //           animationDelay: `${Math.random() * 2}s`,
  //           animationDuration: `${2 + Math.random() * 2}s`,
  //         }}
  //       >
  //         <div
  //           className={`w-2 h-2 rounded-full ${
  //             [
  //               "bg-blue-500",
  //               "bg-green-500",
  //               "bg-yellow-500",
  //               "bg-red-500",
  //               "bg-purple-500",
  //             ][Math.floor(Math.random() * 5)]
  //           }`}
  //         ></div>
  //       </div>
  //     ))}
  //   </div>
  // );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50 font-['Plus_Jakarta_Sans']">
      {/* {showConfetti && <ConfettiAnimation />} */}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Order Confirmed!
          </h1>
          <p className="text-xl text-gray-600 mb-4">
            Thank you for your purchase
          </p>
          <div className="bg-white rounded-lg p-4 inline-block shadow-sm">
            <p className="text-sm text-gray-600">Order Number</p>
            <p className="text-2xl font-bold text-blue-600">
              {orderData.orderNumber}
            </p>
          </div>
        </div>

        {/* Order Progress */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-6">Order Status</h2>
          <div className="flex items-center justify-between">
            {orderSteps.map((step, index) => {
              const Icon = step.icon;
              const isActive = index === 0;
              const isCurrent = index === currentStep;

              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                      isActive
                        ? "bg-green-500 text-white"
                        : isCurrent
                        ? "bg-blue-500 text-white animate-pulse"
                        : "bg-gray-200 text-gray-400"
                    }`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive
                        ? "text-green-600"
                        : isCurrent
                        ? "text-blue-600"
                        : "text-gray-400"
                    }`}
                  >
                    {step.label}
                  </span>
                  {index < orderSteps.length - 1 && (
                    <div
                      className={`absolute h-1 w-24 mt-6 ${
                        isActive ? "bg-green-500" : "bg-gray-200"
                      }`}
                      style={{
                        left: `${(index + 1) * 25}%`,
                        transform: "translateX(-50%)",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-semibold mb-6">Order Details</h2>

            {/* Order Items */}
            <div className="space-y-4 mb-6">
              {orderData.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
                >
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-gray-600">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <span>Subtotal:</span>
                <span>${orderData.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Shipping:</span>
                <span className="text-green-600">FREE</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Tax:</span>
                <span>$0.00</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span className="text-blue-600">
                  ${orderData.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Delivery & Payment Info */}
          <div className="space-y-6">
            {/* Delivery Information */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Truck className="w-5 h-5 text-blue-600" />
                <h2 className="text-xl font-semibold">Delivery Information</h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    Estimated Delivery:
                  </span>
                  <span className="font-medium">
                    {orderData.estimatedDelivery}
                  </span>
                </div>

                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm text-gray-600">Shipping Address:</p>
                    <div className="font-medium">
                      <p>{orderData.shippingAddress.name}</p>
                      <p>{orderData.shippingAddress.street}</p>
                      <p>
                        {orderData.shippingAddress.city},{" "}
                        {orderData.shippingAddress.state}{" "}
                        {orderData.shippingAddress.zip}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold mb-4">
                Payment Information
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Method:</span>
                  <span className="font-medium">
                    Card ending in {orderData.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Date:</span>
                  <span className="font-medium">{orderData.orderDate}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 space-y-4">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              <Package className="w-4 h-4" />
              <span>Track Order</span>
            </button>

            <button className="flex items-center justify-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
              <Download className="w-4 h-4" />
              <span>Download Receipt</span>
            </button>

            <button className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors">
              <Share2 className="w-4 h-4" />
              <span>Share Order</span>
            </button>

            <button className="flex items-center justify-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span>Continue Shopping</span>
            </button>
          </div>
        </div>

        {/* Email Confirmation Notice */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <div>
              <p className="font-medium text-blue-900">
                Confirmation Email Sent
              </p>
              <p className="text-sm text-blue-700">
                We've sent a confirmation email to{" "}
                <strong>{orderData.email}</strong> with your order details and
                tracking information.
              </p>
            </div>
          </div>
        </div>

        {/* Review Prompt */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            Love our products?
          </h3>
          <p className="text-yellow-700 mb-4">
            Share your experience and help other customers make informed
            decisions.
          </p>
          <button className="bg-yellow-500 text-white px-6 py-2 rounded-lg hover:bg-yellow-600 transition-colors">
            Write a Review
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccessPage;
