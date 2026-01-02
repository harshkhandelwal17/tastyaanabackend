import React, { useState, useEffect } from "react";
import {
  Clock,
  MapPin,
  Truck,
  CheckCircle,
  Package,
  Navigation,
} from "lucide-react";
import api from "../api/api";

const CustomerDeliveryTracking = ({ deliveryId, onClose }) => {
  const [trackingData, setTrackingData] = useState(null);
  const [routeUpdates, setRouteUpdates] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Fetch initial tracking data
  useEffect(() => {
    if (deliveryId) {
      fetchTrackingData();
      startAutoRefresh();
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [deliveryId]);

  const fetchTrackingData = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/delivery-schedule/customer/tracking/${deliveryId}`
      );
      if (response.data.success) {
        setTrackingData(response.data.data);
      } else {
        setError("Failed to load tracking data");
      }
    } catch (error) {
      console.error("Error fetching tracking data:", error);
      setError("Error loading tracking information");
    } finally {
      setLoading(false);
    }
  };

  const fetchRouteUpdates = async () => {
    try {
      const response = await api.get(
        `/delivery-schedule/customer/route-updates/${deliveryId}`
      );
      if (response.data.success) {
        setRouteUpdates(response.data.data);

        // Update tracking data with latest position info
        if (trackingData) {
          setTrackingData((prev) => ({
            ...prev,
            routeInfo: {
              ...prev.routeInfo,
              progressPercentage: response.data.data.progressPercentage,
              positionMessage: response.data.data.positionMessage,
              deliveriesAhead: response.data.data.deliveriesAhead,
            },
            deliveryPosition: {
              ...prev.deliveryPosition,
              status: response.data.data.currentStatus,
              estimatedTime: response.data.data.estimatedArrival,
            },
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching route updates:", error);
    }
  };

  const startAutoRefresh = () => {
    // Refresh route updates every 30 seconds
    const interval = setInterval(() => {
      fetchRouteUpdates();
    }, 30000);
    setRefreshInterval(interval);
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      assigned: "bg-blue-100 text-blue-800",
      out_for_delivery: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
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

  const renderProgressBar = () => {
    if (!trackingData?.routeInfo) return null;

    const { progressPercentage, deliveriesAhead } = trackingData.routeInfo;
    const { deliveryNumber, sequencePosition, totalStops } =
      trackingData.deliveryPosition || {};

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Navigation className="w-5 h-5 mr-2 text-blue-600" />
            Route Progress
          </h3>
          {deliveryNumber && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              {deliveryNumber}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Route Progress</span>
            <span>{progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Position Information */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {sequencePosition || "N/A"}
            </div>
            <div className="text-sm text-gray-600">Your Position</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {deliveriesAhead || 0}
            </div>
            <div className="text-sm text-gray-600">Ahead of You</div>
          </div>
        </div>

        {/* Position Message */}
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-blue-800 font-medium">
            {trackingData.routeInfo.positionMessage}
          </p>
        </div>
      </div>
    );
  };

  const renderUpcomingStops = () => {
    if (!routeUpdates?.upcomingStops?.length) return null;

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-orange-600" />
          Upcoming Stops
        </h3>

        <div className="space-y-3">
          {routeUpdates.upcomingStops.map((stop, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-orange-600 font-semibold text-sm">
                    {stop.deliveryNumber?.replace("#", "")}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {stop.address?.area || "Delivery Address"}
                  </p>
                  <p className="text-xs text-gray-600">
                    Est: {formatTime(stop.estimatedTime)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDeliveryTimeline = () => {
    if (!trackingData?.timeline) return null;

    const timelineEvents = [
      {
        key: "scheduled",
        label: "Order Scheduled",
        time: trackingData.timeline.scheduled,
        completed: true,
      },
      {
        key: "assigned",
        label: "Driver Assigned",
        time: trackingData.timeline.assigned,
        completed: !!trackingData.timeline.assigned,
      },
      {
        key: "sequenced",
        label: "Route Planned",
        time: trackingData.timeline.sequenced,
        completed: !!trackingData.timeline.sequenced,
      },
      {
        key: "out_for_delivery",
        label: "Out for Delivery",
        time:
          trackingData.routeInfo?.routeStatus === "in_progress"
            ? new Date()
            : null,
        completed:
          trackingData.routeInfo?.routeStatus === "in_progress" ||
          trackingData.status === "delivered",
      },
      {
        key: "delivered",
        label: "Delivered",
        time: trackingData.timeline.delivered,
        completed: trackingData.status === "delivered",
      },
    ];

    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Package className="w-5 h-5 mr-2 text-green-600" />
          Delivery Timeline
        </h3>

        <div className="space-y-4">
          {timelineEvents.map((event, index) => (
            <div key={event.key} className="flex items-center">
              <div
                className={`w-4 h-4 rounded-full mr-4 ${
                  event.completed ? "bg-green-500" : "bg-gray-300"
                }`}
              >
                {event.completed && (
                  <CheckCircle className="w-4 h-4 text-white" />
                )}
              </div>

              <div className="flex-1">
                <p
                  className={`font-medium ${
                    event.completed ? "text-gray-900" : "text-gray-500"
                  }`}
                >
                  {event.label}
                </p>
                {event.time && (
                  <p className="text-sm text-gray-600">
                    {formatTime(event.time)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3" />
            <span>Loading tracking information...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg max-w-md">
          <div className="text-red-600 text-center">
            <Package className="w-12 h-12 mx-auto mb-3" />
            <p className="font-medium">{error}</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!trackingData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-100 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-white p-6 border-b border-gray-200 sticky top-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center">
                <Truck className="w-6 h-6 mr-3 text-blue-600" />
                Delivery Tracking
              </h2>
              <p className="text-gray-600 mt-1">
                {trackingData.shift} delivery •{" "}
                {new Date(trackingData.orderDate).toLocaleDateString("en-IN")}
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                  trackingData.status
                )}`}
              >
                {trackingData.status.replace("_", " ").toUpperCase()}
              </span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ×
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Driver Info */}
          {trackingData.routeInfo?.driverInfo && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Truck className="w-5 h-5 mr-2 text-blue-600" />
                Your Driver
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium text-gray-900">
                    {trackingData.routeInfo.driverInfo.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-medium text-gray-900">
                    {trackingData.routeInfo.driverInfo.phone}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Vehicle</p>
                  <p className="font-medium text-gray-900">
                    {trackingData.routeInfo.driverInfo.vehicle || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Route Progress */}
          {renderProgressBar()}

          {/* Upcoming Stops */}
          {renderUpcomingStops()}

          {/* Delivery Timeline */}
          {renderDeliveryTimeline()}

          {/* Delivery Details */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2 text-green-600" />
              Order Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Items ({trackingData.deliveryDetails.items?.length || 0})
                </p>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {trackingData.deliveryDetails.items?.map((item, index) => (
                    <div key={index} className="text-sm">
                      <span className="font-medium">{item.quantity}x</span>{" "}
                      {item.name}
                    </div>
                  )) || "No items listed"}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">Delivery Address</p>
                <div className="text-sm text-gray-900">
                  <p>{trackingData.customerInfo.address?.street}</p>
                  <p>{trackingData.customerInfo.address?.area}</p>
                  <p>
                    {trackingData.customerInfo.address?.city} -{" "}
                    {trackingData.customerInfo.address?.pincode}
                  </p>
                </div>
              </div>
            </div>

            {trackingData.deliveryDetails.specialInstructions && (
              <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">
                  Special Instructions
                </p>
                <p className="text-sm text-yellow-800">
                  {trackingData.deliveryDetails.specialInstructions}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Auto-refresh indicator */}
        <div className="bg-white border-t border-gray-200 px-6 py-3 text-center">
          <p className="text-xs text-gray-500">
            Auto-refreshing every 30 seconds • Last updated:{" "}
            {new Date().toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CustomerDeliveryTracking;
