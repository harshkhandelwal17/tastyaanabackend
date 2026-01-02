import React, { useState, useEffect } from "react";
import { Package, Clock, MapPin, Eye, Truck, CheckCircle } from "lucide-react";
import CustomerDeliveryTracking from "../components/CustomerDeliveryTracking";
import api from "../api/api";

const CustomerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);

  useEffect(() => {
    fetchCustomerOrders();
  }, []);

  const fetchCustomerOrders = async () => {
    try {
      setLoading(true);
      // This would be your API endpoint to get customer's subscription/orders
      const response = await api.get("/subscriptions/my-subscriptions");
      if (response.data.success) {
        // Filter subscriptions that have delivery tracking
        const ordersWithDeliveries = response.data.data
          .filter(
            (sub) => sub.deliveryTracking && sub.deliveryTracking.length > 0
          )
          .map((sub) => ({
            ...sub,
            deliveries: sub.deliveryTracking.map((delivery) => ({
              ...delivery,
              subscriptionId: sub._id,
              items: sub.items,
              totalAmount: sub.totalAmount,
            })),
          }));

        setOrders(ordersWithDeliveries);
      } else {
        setError("Failed to load orders");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("Error loading orders");
    } finally {
      setLoading(false);
    }
  };

  const openTrackingModal = (delivery) => {
    setSelectedDelivery(delivery);
    setShowTrackingModal(true);
  };

  const closeTrackingModal = () => {
    setShowTrackingModal(false);
    setSelectedDelivery(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
      assigned: "bg-blue-100 text-blue-800 border-blue-200",
      out_for_delivery: "bg-purple-100 text-purple-800 border-purple-200",
      delivered: "bg-green-100 text-green-800 border-green-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      assigned: Truck,
      out_for_delivery: MapPin,
      delivered: CheckCircle,
      cancelled: Package,
    };
    return icons[status] || Package;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (dateString) => {
    if (!dateString) return "Not set";
    const date = new Date(dateString);
    return date.toLocaleString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "short",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading your orders...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-red-600 text-lg">{error}</p>
            <button
              onClick={fetchCustomerOrders}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Package className="w-8 h-8 mr-3 text-blue-600" />
            My Orders & Deliveries
          </h1>
          <p className="text-gray-600 mt-2">
            Track your orders and delivery status in real-time
          </p>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-xl text-gray-600 mb-2">
              No orders with deliveries found
            </p>
            <p className="text-gray-500">
              Your delivery trackable orders will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Order Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Subscription Order
                      </h3>
                      <p className="text-sm text-gray-600">
                        {order.items?.length || 0} items • ₹{order.totalAmount}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Order Date</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Deliveries */}
                <div className="p-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">
                    Deliveries ({order.deliveries.length})
                  </h4>

                  <div className="space-y-4">
                    {order.deliveries.map((delivery) => {
                      const StatusIcon = getStatusIcon(delivery.status);

                      return (
                        <div
                          key={delivery._id}
                          className="border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div
                                className={`p-3 rounded-full ${getStatusColor(
                                  delivery.status
                                )
                                  .replace("text-", "text-")
                                  .replace("bg-", "bg-")}`}
                              >
                                <StatusIcon className="w-5 h-5" />
                              </div>

                              <div>
                                <div className="flex items-center space-x-3">
                                  <h5 className="font-medium text-gray-900">
                                    {delivery.shift} Delivery
                                  </h5>
                                  <span
                                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                                      delivery.status
                                    )}`}
                                  >
                                    {delivery.status
                                      .replace("_", " ")
                                      .toUpperCase()}
                                  </span>
                                </div>

                                <p className="text-sm text-gray-600 mt-1">
                                  Date: {formatDate(delivery.date)}
                                </p>

                                {delivery.estimatedArrival && (
                                  <p className="text-sm text-gray-600">
                                    Estimated:{" "}
                                    {formatTime(delivery.estimatedArrival)}
                                  </p>
                                )}

                                {delivery.deliveredAt && (
                                  <p className="text-sm text-green-600">
                                    Delivered:{" "}
                                    {formatTime(delivery.deliveredAt)}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center space-x-2">
                              {/* Route Position Badge */}
                              {delivery.sequencePosition && (
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                  Stop #{delivery.sequencePosition}
                                </span>
                              )}

                              {/* Track Delivery Button */}
                              <button
                                onClick={() => openTrackingModal(delivery)}
                                className="flex items-center space-x-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                                <span>Track</span>
                              </button>
                            </div>
                          </div>

                          {/* Delivery Progress Summary */}
                          {delivery.routeId && delivery.sequencePosition && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-blue-800">
                                  Your position in delivery route
                                </span>
                                <span className="font-medium text-blue-900">
                                  Stop #{delivery.sequencePosition}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Driver Info */}
                          {delivery.driver && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <div className="flex items-center text-sm text-gray-600">
                                <Truck className="w-4 h-4 mr-2" />
                                <span>
                                  Driver: {delivery.driver.name || "Assigned"}
                                </span>
                                {delivery.driver.phone && (
                                  <span className="ml-3">
                                    • {delivery.driver.phone}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tracking Modal */}
      {showTrackingModal && selectedDelivery && (
        <CustomerDeliveryTracking
          deliveryId={selectedDelivery._id}
          onClose={closeTrackingModal}
        />
      )}
    </div>
  );
};

export default CustomerOrders;
