import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { validateCoupon, getAvailableCoupons } from "../api/couponApi";
import { toast } from "react-hot-toast";

const CouponInput = ({
  onCouponApplied,
  onCouponRemoved,
  orderAmount = 0,
  orderType = "product",
  orderItems = [],
  disabled = false,
}) => {
  const [couponCode, setCouponCode] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [showAvailableCoupons, setShowAvailableCoupons] = useState(false);
  const [error, setError] = useState("");

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError("Please enter a coupon code");
      return;
    }

    if (!user) {
      setError("Please login to use coupons");
      return;
    }

    setIsValidating(true);
    setError(""); // Clear previous errors

    try {
      const response = await validateCoupon({
        code: couponCode.trim(),
        orderAmount: orderAmount,
        orderType: orderType,
        orderItems: orderItems,
      });

      if (response.data.success) {
        setAppliedCoupon(response.data.data);
        onCouponApplied && onCouponApplied(response.data.data);
        toast.success("Coupon applied successfully!");
        setCouponCode("");
        setError(""); // Clear any previous errors
      } else {
        setError(response.data.message || "Invalid coupon code");
        toast.error(response.data.message || "Invalid coupon code");
      }
    } catch (error) {
      console.error("Error applying coupon:", error);
      const errorMessage =
        error.response?.data?.message || "Error applying coupon";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setError(""); // Clear any errors when removing coupon
    onCouponRemoved && onCouponRemoved();
    toast.success("Coupon removed");
  };

  const loadAvailableCoupons = async () => {
    if (!user) return;

    try {
      const response = await getAvailableCoupons(orderAmount, orderType);
      if (response.data.success) {
        setAvailableCoupons(response.data.data);
        setShowAvailableCoupons(true);
      }
    } catch (error) {
      console.error("Error loading available coupons:", error);
    }
  };

  const applyAvailableCoupon = async (coupon) => {
    setCouponCode(coupon.code);
    setError(""); // Clear any previous errors
    await handleApplyCoupon();
    setShowAvailableCoupons(false);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">Apply Coupon</h3>
        {/* {!appliedCoupon && (
          <button
            onClick={loadAvailableCoupons}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            disabled={disabled}
          >
            View Available Coupons
          </button>
        )} */}
      </div>

      {appliedCoupon ? (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-800 font-medium">
                Coupon Applied: {appliedCoupon.coupon.code}
              </p>
              <p className="text-sm text-green-600">
                You saved ₹{appliedCoupon.discount}
              </p>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-red-600 hover:text-red-800 font-medium"
              disabled={disabled}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                setError(""); // Clear error when user types
              }}
              placeholder="Enter coupon code"
              className={`flex-1 px-1 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-1 ${
                error ? "border-red-300 bg-red-50" : "border-gray-300"
              }`}
              disabled={disabled || isValidating}
              maxLength={20}
            />
            <button
              onClick={handleApplyCoupon}
              disabled={disabled || isValidating || !couponCode.trim()}
              className="px-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isValidating ? "Applying..." : "Apply"}
            </button>
          </div>

          {/* Error Message Display */}
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 flex items-center">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                {error}
              </p>
            </div>
          )}

          {showAvailableCoupons && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Available Coupons:
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {availableCoupons.length > 0 ? (
                  availableCoupons.map((coupon) => (
                    <div
                      key={coupon.id}
                      className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">
                          {coupon.code}
                        </p>
                        <p className="text-sm text-gray-600">
                          {coupon.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          Min order: ₹{coupon.minOrderAmount} |
                          {coupon.discountType === "percentage"
                            ? ` ${coupon.discountValue}% off`
                            : ` ₹${coupon.discountValue} off`}
                        </p>
                      </div>
                      <button
                        onClick={() => applyAvailableCoupon(coupon)}
                        disabled={disabled || !coupon.valid}
                        className="ml-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        {coupon.valid ? "Apply" : "Not Valid"}
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">
                    No coupons available for this order
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CouponInput;
