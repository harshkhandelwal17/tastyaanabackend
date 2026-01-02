import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
  FaSpinner,
  FaTruck,
  FaPhone,
  FaRefresh,
} from "react-icons/fa";
import { toast } from "react-hot-toast";
import { format } from "date-fns";

const DeliveryTracking = () => {
  const [searchParams] = useSearchParams();
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Get tracking parameters from URL
  const subscriptionId = searchParams.get("subscription");
  const customerPhone = searchParams.get("phone");
  const date = searchParams.get("date") || format(new Date(), "yyyy-MM-dd");
  const shift = searchParams.get("shift") || "evening";

  useEffect(() => {
    if (subscriptionId || customerPhone) {
      loadTrackingData();
    }
  }, [subscriptionId, customerPhone, date, shift]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      if (subscriptionId || customerPhone) {
        loadTrackingData(false); // Silent refresh
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, subscriptionId, customerPhone, date, shift]);

  const loadTrackingData = async (showLoading = true) => {
    if (showLoading) setLoading(true);

    try {
      const params = new URLSearchParams({
        ...(subscriptionId && { subscriptionId }),
        ...(customerPhone && { customerPhone }),
      });

      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/delivery-schedule/driver/route-progress/${date}/${shift}?${params}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setTrackingData(data.data);
      } else {
        throw new Error(data.message || "Failed to load tracking data");
      }
    } catch (error) {
      console.error("Failed to load tracking data:", error);
      if (showLoading) {
        toast.error("Failed to load delivery tracking");
      }
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const getDeliveryStatus = () => {
    if (!trackingData) return "Loading...";

    const { customerPosition, statistics } = trackingData;

    if (customerPosition === -1) {
      return "Delivery not found for today";
    }

    const completedStops = statistics.completedStops;
    const currentStop = statistics.currentStop;

    if (customerPosition <= completedStops) {
      return "✅ Your meal has been delivered!";
    }

    if (customerPosition === currentStop) {
      return "🚚 Driver is at your location now!";
    }

    const stopsAhead = customerPosition - completedStops;
    return `📍 You are stop #${customerPosition} - ${stopsAhead} deliveries ahead`;
  };

  const getProgressPercentage = () => {
    if (!trackingData || trackingData.customerPosition === -1) return 0;

    const { customerPosition, statistics } = trackingData;
    const progress = Math.min(
      (statistics.completedStops / customerPosition) * 100,
      100
    );
    return progress;
  };

  if (!subscriptionId && !customerPhone) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <FaTruck className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Track Your Delivery
          </h2>
          <p className="text-gray-600">
            Please provide your subscription ID or phone number to track your
            delivery.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Delivery Tracking
              </h1>
              <p className="text-gray-600">
                {format(new Date(date), "EEEE, MMMM d, yyyy")} •{" "}
                {shift === "morning" ? "Morning" : "Evening"} Delivery
              </p>
            </div>
            <button
              onClick={() => loadTrackingData()}
              disabled={loading}
              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <FaRefresh
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>

          {/* Auto-refresh toggle */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <span className="text-sm text-gray-700">Auto-refresh (30s)</span>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoRefresh ? "bg-blue-600" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoRefresh ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <FaSpinner className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading delivery status...</p>
          </div>
        ) : (
          <>
            {/* Delivery Status Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaTruck className="h-8 w-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {getDeliveryStatus()}
                </h2>

                {trackingData && trackingData.customerPosition > 0 && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${getProgressPercentage()}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      {Math.round(getProgressPercentage())}% complete
                    </p>
                  </div>
                )}
              </div>

              {trackingData && trackingData.statistics && (
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {trackingData.statistics.totalStops}
                    </div>
                    <div className="text-sm text-gray-600">Total Stops</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {trackingData.statistics.completedStops}
                    </div>
                    <div className="text-sm text-gray-600">Completed</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-700">
                      {trackingData.customerPosition > 0
                        ? `#${trackingData.customerPosition}`
                        : "N/A"}
                    </div>
                    <div className="text-sm text-gray-600">Your Stop</div>
                  </div>
                </div>
              )}
            </div>

            {/* Route Progress */}
            {trackingData && trackingData.routeProgress && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Route Progress
                </h3>

                <div className="space-y-3">
                  {trackingData.routeProgress.map((stop, index) => {
                    const isCustomer =
                      stop.sequencePosition === trackingData.customerPosition;
                    const isCompleted = stop.isCompleted;
                    const isCurrent =
                      !isCompleted &&
                      stop.sequencePosition ===
                        trackingData.statistics.currentStop;

                    return (
                      <div
                        key={index}
                        className={`flex items-center space-x-3 p-3 rounded-lg ${
                          isCustomer
                            ? "bg-blue-50 border-2 border-blue-200"
                            : "bg-gray-50"
                        }`}
                      >
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              isCompleted
                                ? "bg-green-500"
                                : isCurrent
                                ? "bg-blue-500 animate-pulse"
                                : "bg-gray-300"
                            }`}
                          >
                            {isCompleted ? (
                              <FaCheckCircle className="h-4 w-4 text-white" />
                            ) : (
                              <span className="text-xs font-bold text-white">
                                {stop.sequencePosition}
                              </span>
                            )}
                          </div>
                          {index < trackingData.routeProgress.length - 1 && (
                            <div className="w-0.5 h-6 bg-gray-300 mt-1" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div>
                              <p
                                className={`font-medium ${
                                  isCustomer
                                    ? "text-blue-900"
                                    : isCompleted
                                    ? "text-green-800"
                                    : "text-gray-900"
                                }`}
                              >
                                Stop #{stop.sequencePosition}
                                {isCustomer && (
                                  <span className="ml-2 text-sm bg-blue-600 text-white px-2 py-1 rounded-full">
                                    Your Delivery
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-gray-600">
                                {isCustomer ? "Your location" : "Delivery stop"}
                              </p>
                            </div>

                            <div className="text-right">
                              {isCompleted ? (
                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                  Delivered
                                </span>
                              ) : isCurrent ? (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                  In Progress
                                </span>
                              ) : (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  Pending
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {trackingData.routeProgress.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FaMapMarkerAlt className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No route information available for today</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Support Contact */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need help?{" "}
            <a
              href="tel:+919876543210"
              className="text-blue-600 hover:underline font-medium"
            >
              <FaPhone className="inline h-3 w-3 mr-1" />
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DeliveryTracking;
