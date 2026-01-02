import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import axios from "axios";

const DeliveryProgressTracking = ({
  deliveryData,
  compact = false,
  className = "",
}) => {
  const { subscriptionId, date, shift } = useParams();
  const [progressData, setProgressData] = useState(deliveryData || null);
  const [loading, setLoading] = useState(!deliveryData);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  // Determine if we're in standalone mode (using URL params) or embedded mode (using props)
  const isStandalone = !deliveryData && (subscriptionId || date || shift);

  useEffect(() => {
    if (deliveryData) {
      setProgressData(deliveryData);
      setLoading(false);
    } else if (isStandalone) {
      fetchDeliveryProgress();
    }

    if (isStandalone) {
      setupSocketConnection();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [subscriptionId, date, shift, deliveryData]);

  const fetchDeliveryProgress = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `/api/user/delivery-progress/${subscriptionId}/${date}/${shift}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      setProgressData(response.data.data);
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to fetch delivery progress"
      );
    } finally {
      setLoading(false);
    }
  };

  const setupSocketConnection = () => {
    const token = localStorage.getItem("token");
    const newSocket = io(
      process.env.REACT_APP_SOCKET_URL || "http://localhost:5000",
      {
        auth: { token },
      }
    );

    newSocket.on("delivery-progress-update", (data) => {
      setProgressData((prev) => ({
        ...prev,
        progress: {
          ...prev.progress,
          ...data,
        },
      }));
    });

    newSocket.on("delivery-started", (data) => {
      setProgressData((prev) => ({
        ...prev,
        deliveryStarted: true,
        driver: { ...prev.driver, ...data },
      }));
    });

    setSocket(newSocket);
  };

  const renderRouteVisualization = () => {
    if (!progressData?.routeVisualization) return null;

    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <svg
            className="w-5 h-5 mr-2 text-blue-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
          Delivery Route Progress
        </h3>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="space-y-3">
            {progressData.routeVisualization.map((stop, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-4 h-4 rounded-full border-2 ${
                      stop.status === "completed"
                        ? "bg-green-500 border-green-500"
                        : stop.status === "current"
                        ? "bg-blue-500 border-blue-500 animate-pulse"
                        : "bg-gray-200 border-gray-300"
                    }`}
                  >
                    {stop.status === "completed" && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  {index < progressData.routeVisualization.length - 1 && (
                    <div className="w-0.5 h-8 bg-gray-300 mt-1"></div>
                  )}
                </div>

                <div className="flex-1">
                  <div
                    className={`font-medium ${
                      stop.isUserStop
                        ? "text-blue-600 font-bold"
                        : "text-gray-700"
                    }`}
                  >
                    Stop {stop.stopNumber}
                    {stop.isUserStop && " (Your Delivery)"}
                  </div>

                  <div className="text-sm text-gray-500">
                    {stop.status === "completed" && "Delivered"}
                    {stop.status === "current" && "Driver is here now"}
                    {stop.status === "pending" &&
                      stop.isUserStop &&
                      `ETA: ${progressData.progress.eta}`}
                    {stop.status === "pending" && !stop.isUserStop && "Pending"}
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`text-xs px-2 py-1 rounded-full ${
                      stop.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : stop.status === "current"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {stop.status === "completed" && "● Completed"}
                    {stop.status === "current" && "● In Progress"}
                    {stop.status === "pending" && "○ Pending"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderProgressBar = () => {
    if (!progressData?.progress) return null;

    const { progressPercentage, completedStops, totalStops } =
      progressData.progress;

    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <svg
            className="w-5 h-5 mr-2 text-green-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          Your Delivery Progress
        </h3>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{progressPercentage}% Completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-blue-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-blue-600">
                {completedStops}
              </div>
              <div className="text-xs text-blue-600">Stops Completed</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-purple-600">
                {totalStops}
              </div>
              <div className="text-xs text-purple-600">Total Stops</div>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-orange-600">
                {progressData.progress.yourStopNumber}
              </div>
              <div className="text-xs text-orange-600">Your Stop Number</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-lg font-bold text-green-600">
                {progressData.progress.eta}
              </div>
              <div className="text-xs text-green-600">ETA</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDriverInfo = () => {
    if (!progressData?.driver) return null;

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <svg
            className="w-5 h-5 mr-2 text-blue-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
          Delivery Partner
        </h3>

        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-blue-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <div className="flex-1">
            <div className="font-semibold text-gray-800">
              {progressData.driver.name}
            </div>
            <div className="text-sm text-gray-500">
              {progressData.driver.phone}
            </div>
            <div className="flex items-center mt-1">
              <span className="text-yellow-500">★</span>
              <span className="text-sm text-gray-600 ml-1">
                {progressData.driver.rating}
              </span>
              {progressData.driver.vehicle && (
                <span className="text-sm text-gray-500 ml-3">
                  {progressData.driver.vehicle.type} -{" "}
                  {progressData.driver.vehicle.number}
                </span>
              )}
            </div>
          </div>

          <div className="text-right">
            <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              On Route
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div
        className={
          compact
            ? "flex items-center justify-center p-6"
            : "min-h-screen flex items-center justify-center"
        }
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={
          compact
            ? "text-center p-6"
            : "min-h-screen flex items-center justify-center"
        }
      >
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-2">Error</div>
          <div className="text-gray-600">{error}</div>
          {isStandalone && (
            <button
              onClick={fetchDeliveryProgress}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!progressData) {
    return (
      <div
        className={
          compact
            ? "text-center p-6"
            : "min-h-screen flex items-center justify-center"
        }
      >
        <div className="text-center text-gray-500">
          <div className="text-lg font-semibold mb-2">No delivery found</div>
          <div className="text-sm">No delivery scheduled for today</div>
        </div>
      </div>
    );
  }

  // Compact mode for embedded usage
  if (compact) {
    return (
      <div className={`bg-white p-4 ${className}`}>
        {/* Compact Driver Info */}
        {progressData?.driver && (
          <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-sm text-gray-800">
                  {progressData.driver.name}
                </div>
                <div className="text-xs text-gray-500">
                  {progressData.driver.phone}
                </div>
              </div>
            </div>
            <div className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1"></div>
              On Route
            </div>
          </div>
        )}

        {/* Compact Progress Bar */}
        {progressData?.progress && (
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Delivery Progress
              </span>
              <span className="text-sm text-gray-500">
                {Math.round(progressData.progress.percentage)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressData.progress.percentage}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>
                {progressData.progress.currentStop}/
                {progressData.progress.totalStops} stops
              </span>
              <span>ETA: {progressData.progress.eta}</span>
            </div>
          </div>
        )}

        {/* Compact Route Visualization - Show only user's delivery and nearby stops */}
        {progressData?.routeVisualization && (
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Your Delivery Status
            </div>
            {progressData.routeVisualization
              .filter((stop, index) => {
                // Show user's stop and 1 stop before/after for context
                const userStopIndex = progressData.routeVisualization.findIndex(
                  (s) => s.isUserStop
                );
                return (
                  Math.abs(index - userStopIndex) <= 1 ||
                  stop.isUserStop ||
                  stop.status === "current"
                );
              })
              .map((stop, index, filteredStops) => (
                <div
                  key={index}
                  className="flex items-center space-x-3 text-sm"
                >
                  <div
                    className={`w-3 h-3 rounded-full border-2 flex items-center justify-center ${
                      stop.status === "completed"
                        ? "bg-green-500 border-green-500"
                        : stop.status === "current"
                        ? "bg-blue-500 border-blue-500 animate-pulse"
                        : "bg-gray-200 border-gray-300"
                    }`}
                  >
                    {stop.status === "completed" && (
                      <svg
                        className="w-2 h-2 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    )}
                  </div>
                  <div
                    className={`flex-1 ${
                      stop.isUserStop
                        ? "font-semibold text-blue-600"
                        : "text-gray-600"
                    }`}
                  >
                    {stop.isUserStop
                      ? "Your Delivery"
                      : `Stop ${stop.stopNumber}`}
                  </div>
                  <div
                    className={`text-xs px-2 py-1 rounded-full ${
                      stop.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : stop.status === "current"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {stop.status === "completed" && "Delivered"}
                    {stop.status === "current" && "In Progress"}
                    {stop.status === "pending" &&
                      (stop.isUserStop
                        ? `ETA: ${progressData.progress.eta}`
                        : "Pending")}
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Estimated delivery time for compact mode */}
        {progressData?.estimatedDeliveryTime && (
          <div className="mt-4 bg-blue-50 rounded-lg p-3 text-center">
            <div className="text-xs text-blue-600 font-medium">
              Estimated Delivery Time
            </div>
            <div className="text-sm font-semibold text-blue-800 mt-1">
              {new Date(progressData.estimatedDeliveryTime).toLocaleTimeString(
                [],
                {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                }
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Full mode for standalone usage
  return (
    <div className="min-h-screen bg-gray-50 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Track Your Delivery
          </h1>
          <p className="text-gray-600 mt-2">
            Real-time delivery progress for your {shift} meal
          </p>
        </div>

        {renderDriverInfo()}
        {renderProgressBar()}
        {renderRouteVisualization()}

        {/* Estimated delivery time */}
        {progressData?.estimatedDeliveryTime && (
          <div className="mt-6 bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-sm text-blue-600 font-medium">
              Estimated Delivery Time
            </div>
            <div className="text-lg font-semibold text-blue-800 mt-1">
              {new Date(progressData.estimatedDeliveryTime).toLocaleTimeString(
                [],
                {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                }
              )}
            </div>
          </div>
        )}

        {/* Refresh button */}
        <div className="mt-8 text-center">
          <button
            onClick={fetchDeliveryProgress}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh Progress
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeliveryProgressTracking;
