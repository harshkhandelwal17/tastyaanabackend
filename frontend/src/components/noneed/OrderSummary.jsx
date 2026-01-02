import React from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Package,
  CreditCard,
  User,
  Phone,
  Edit3,
} from "lucide-react";

const OrderSummary = ({
  orderData,
  editable = false,
  onEdit = () => {},
  className = "",
}) => {
  if (!orderData) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div
      className={`bg-white border border-gray-200 rounded-2xl p-6 shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Order Summary</h3>
        {editable && (
          <button
            onClick={onEdit}
            className="text-emerald-600 hover:text-emerald-700 text-sm font-medium flex items-center gap-2"
          >
            <Edit3 className="w-4 h-4" />
            Edit
          </button>
        )}
      </div>

      {/* Order ID (if available) */}
      {orderData.id && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-emerald-700">
              Order ID
            </span>
            <span className="font-bold text-emerald-900">{orderData.id}</span>
          </div>
        </div>
      )}

      {/* Service Details */}
      <div className="space-y-4 mb-6">
        <div className="flex items-start gap-3">
          <Package className="w-5 h-5 text-gray-400 mt-0.5" />
          <div>
            <h4 className="font-semibold text-gray-900">Service</h4>
            <p className="text-gray-600 capitalize">
              {orderData.service?.replace("-", " ")}
            </p>
          </div>
        </div>

        {/* Pickup Details */}
        {(orderData.pickupDate || orderData.pickupTime) && (
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Pickup</h4>
              <div className="text-gray-600">
                {orderData.pickupDate && (
                  <p>{formatDate(orderData.pickupDate)}</p>
                )}
                {orderData.pickupTime && <p>{orderData.pickupTime}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Delivery Details */}
        {(orderData.deliveryDate || orderData.deliveryTime) && (
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Delivery</h4>
              <div className="text-gray-600">
                {orderData.deliveryDate && (
                  <p>{formatDate(orderData.deliveryDate)}</p>
                )}
                {orderData.deliveryTime && <p>{orderData.deliveryTime}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Address */}
        {orderData.address && (
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Address</h4>
              <div className="text-gray-600">
                <p>{orderData.address.street}</p>
                <p>
                  {orderData.address.city}, {orderData.address.pincode}
                </p>
                {orderData.address.landmark && (
                  <p className="text-sm">Near: {orderData.address.landmark}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Payment Method */}
        {orderData.paymentMethod && (
          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-gray-400 mt-0.5" />
            <div>
              <h4 className="font-semibold text-gray-900">Payment</h4>
              <p className="text-gray-600 capitalize">
                {orderData.paymentMethod}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Items Breakdown */}
      {orderData.items && Object.keys(orderData.items).length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">Items</h4>
          <div className="space-y-2">
            {Object.entries(orderData.items).map(([item, quantity]) => {
              if (quantity > 0) {
                return (
                  <div key={item} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item}</span>
                    <span className="font-medium">× {quantity}</span>
                  </div>
                );
              }
              return null;
            })}
          </div>
        </div>
      )}

      {/* Special Instructions */}
      {orderData.specialInstructions && (
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
          <h4 className="font-semibold text-gray-900 mb-2">
            Special Instructions
          </h4>
          <p className="text-gray-600 text-sm">
            {orderData.specialInstructions}
          </p>
        </div>
      )}

      {/* Total Amount */}
      {orderData.total && (
        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-semibold text-gray-900">
              Total Amount
            </span>
            <span className="text-2xl font-bold text-emerald-600">
              ₹{orderData.total}
            </span>
          </div>

          {/* Tax breakdown (if available) */}
          {orderData.subtotal && (
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{orderData.subtotal}</span>
              </div>
              {orderData.tax && (
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>₹{orderData.tax}</span>
                </div>
              )}
              {orderData.deliveryCharge && (
                <div className="flex justify-between">
                  <span>Delivery Charge</span>
                  <span>₹{orderData.deliveryCharge}</span>
                </div>
              )}
              {orderData.discount && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span>-₹{orderData.discount}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Status (if available) */}
      {orderData.status && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Status</span>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                orderData.status === "confirmed"
                  ? "bg-blue-100 text-blue-800"
                  : orderData.status === "picked-up"
                  ? "bg-yellow-100 text-yellow-800"
                  : orderData.status === "washing"
                  ? "bg-purple-100 text-purple-800"
                  : orderData.status === "ready"
                  ? "bg-green-100 text-green-800"
                  : orderData.status === "delivered"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {orderData.status.replace("-", " ")}
            </span>
          </div>
        </div>
      )}

      {/* Created Date (if available) */}
      {orderData.createdAt && (
        <div className="mt-2 text-xs text-gray-500">
          Placed on {formatDate(orderData.createdAt)}
        </div>
      )}
    </div>
  );
};

export default OrderSummary;
