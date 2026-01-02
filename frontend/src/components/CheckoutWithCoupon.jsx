import React, { useState, useEffect } from 'react';
import CouponInput from './CouponInput';

const CheckoutWithCoupon = ({ cartItems, onOrderCreate }) => {
  const [orderAmount, setOrderAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [finalAmount, setFinalAmount] = useState(0);

  // Calculate order amount from cart items
  useEffect(() => {
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    setOrderAmount(total);
    setFinalAmount(total);
  }, [cartItems]);

  // Update final amount when coupon is applied
  useEffect(() => {
    if (appliedCoupon) {
      setFinalAmount(orderAmount - appliedCoupon.discount);
    } else {
      setFinalAmount(orderAmount);
    }
  }, [appliedCoupon, orderAmount]);

  const handleCouponApplied = (couponData) => {
    setAppliedCoupon(couponData);
  };

  const handleCouponRemoved = () => {
    setAppliedCoupon(null);
  };

  const handlePlaceOrder = () => {
    const orderData = {
      items: cartItems,
      subtotal: orderAmount,
      discountAmount: appliedCoupon ? appliedCoupon.discount : 0,
      totalAmount: finalAmount,
      couponCode: appliedCoupon ? appliedCoupon.coupon.code : null,
      couponId: appliedCoupon ? appliedCoupon.coupon.id : null
    };

    onOrderCreate(orderData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h2>
          
          <div className="space-y-3">
            {cartItems.map((item, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-800">{item.name}</p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium text-gray-800">₹{item.price * item.quantity}</p>
              </div>
            ))}
          </div>
          
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal:</span>
              <span>₹{orderAmount}</span>
            </div>
            
            {appliedCoupon && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({appliedCoupon.coupon.code}):</span>
                <span>-₹{appliedCoupon.discount}</span>
              </div>
            )}
            
            <div className="flex justify-between text-lg font-semibold text-gray-800 border-t border-gray-200 pt-2">
              <span>Total:</span>
              <span>₹{finalAmount}</span>
            </div>
          </div>
        </div>

        {/* Coupon and Payment */}
        <div className="space-y-6">
          {/* Coupon Input */}
          <CouponInput
            onCouponApplied={handleCouponApplied}
            onCouponRemoved={handleCouponRemoved}
            orderAmount={orderAmount}
          />

          {/* Payment Method Selection */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment Method</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="radio" name="payment" value="cod" defaultChecked className="mr-2" />
                <span>Cash on Delivery</span>
              </label>
              <label className="flex items-center">
                <input type="radio" name="payment" value="online" className="mr-2" />
                <span>Online Payment</span>
              </label>
            </div>
          </div>

          {/* Place Order Button */}
          <button
            onClick={handlePlaceOrder}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 font-semibold"
          >
            Place Order - ₹{finalAmount}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CheckoutWithCoupon;
