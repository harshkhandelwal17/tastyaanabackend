import React, { useState, useEffect } from "react";
import {
  Clock,
  Truck,
  MapPin,
  CheckCircle,
  Package,
  Navigation,
} from "lucide-react";

const DriverRouteTracking = ({
  routeData,
  compact = false,
  className = "",
  subscriptionId = null,
}) => {
  const [customerStop, setCustomerStop] = useState(null);

  // Find the customer's stop in the route
  useEffect(() => {
    if (routeData && routeData.stops && subscriptionId) {
      const stop = routeData.stops.find(
        (stop) => stop.subscriptionId === subscriptionId
      );
      setCustomerStop(stop);
    }
  }, [routeData, subscriptionId]);

  const getStatusColor = (status) => {
    const colors = {
      pending: "text-gray-600 bg-gray-100",
      delivered: "text-green-600 bg-green-100",
      in_progress: "text-blue-600 bg-blue-100",
      failed: "text-red-600 bg-red-100",
    };
    return colors[status] || "text-gray-600 bg-gray-100";
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: Clock,
      delivered: CheckCircle,
      in_progress: Truck,
      failed: Package,
    };
    return icons[status] || Clock;
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

  const calculateDeliveriesAhead = () => {
    if (!customerStop) return 0;

    const completedBeforeCustomer = routeData.stops.filter(
      (stop) =>
        stop.sequenceNumber < customerStop.sequenceNumber &&
        stop.status === "delivered"
    ).length;

    return Math.max(
      0,
      customerStop.sequenceNumber - 1 - completedBeforeCustomer
    );
  };

  const getCustomerPositionMessage = () => {
    if (!customerStop) return "Position not found";

    const deliveriesAhead = calculateDeliveriesAhead();

    if (customerStop.status === "delivered") {
      return "Your delivery has been completed!";
    }

    if (deliveriesAhead === 0) {
      return "You are next in line for delivery!";
    }

    return `You are stop #${customerStop.sequenceNumber} - ${deliveriesAhead} deliveries ahead of you`;
  };

  const renderTimelineVisualization = () => {
    if (!routeData?.stops) return null;

    const sortedStops = [...routeData.stops].sort(
      (a, b) => a.sequenceNumber - b.sequenceNumber
    );
    const currentStopIndex = routeData.currentStopIndex || 0;

    return (
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Navigation className="w-5 h-5 mr-2 text-blue-600" />
          Delivery Route Progress
        </h3>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          {/* Timeline */}
          <div className="space-y-4">
            {sortedStops.map((stop, index) => {
              const isCustomerStop = stop.subscriptionId === subscriptionId;
              const isCompleted = stop.status === "delivered";
              const isCurrentStop = index === currentStopIndex && !isCompleted;
              const isPending = stop.status === "pending" && !isCurrentStop;

              return (
                <div
                  key={stop._id}
                  className="grid grid-cols-[auto_1fr] gap-x-4"
                >
                  {/* Timeline Icon */}
                  <div className="flex flex-col items-center">
                    {/* Stop Icon */}
                    <div
                      className={`flex w-6 h-6 items-center justify-center rounded-full text-white text-sm font-bold ${
                        isCompleted
                          ? "bg-green-500"
                          : isCurrentStop && isCustomerStop
                          ? "bg-blue-500 ring-4 ring-blue-200"
                          : isCurrentStop
                          ? "bg-blue-500"
                          : "border-2 border-gray-300 bg-transparent text-gray-500"
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : isCurrentStop ? (
                        <Truck className="w-4 h-4" />
                      ) : (
                        <span className="text-xs">{stop.sequenceNumber}</span>
                      )}
                    </div>

                    {/* Timeline Line */}
                    {index < sortedStops.length - 1 && (
                      <div
                        className={`w-0.5 h-8 mt-1 ${
                          isCompleted ? "bg-green-500" : "bg-gray-300"
                        }`}
                      />
                    )}
                  </div>

                  {/* Stop Content */}
                  <div
                    className={`flex-1 pb-4 ${
                      isCustomerStop ? "rounded-xl bg-blue-50 p-4 -mt-2" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className={`text-sm font-medium ${
                            isCustomerStop ? "text-blue-600" : "text-gray-500"
                          }`}
                        >
                          Stop {stop.sequenceNumber}
                          {isCustomerStop && " (Your Delivery)"}
                        </p>

                        <p
                          className={`text-base font-semibold ${
                            isCustomerStop ? "text-blue-600" : "text-gray-900"
                          }`}
                        >
                          {isCompleted
                            ? "Delivered"
                            : isCurrentStop && isCustomerStop
                            ? "Driver is here now"
                            : isCurrentStop
                            ? "In Progress"
                            : "Pending"}
                        </p>

                        <p
                          className={`text-sm ${
                            isCustomerStop ? "text-blue-500" : "text-gray-600"
                          }`}
                        >
                          {stop.address?.area ||
                            stop.address?.city ||
                            "Delivery Area"}
                          {isCustomerStop && isCurrentStop && (
                            <span className="block font-medium">
                              Your stop is next!
                            </span>
                          )}
                        </p>

                        {stop.estimatedArrival && !isCompleted && (
                          <p className="text-xs text-gray-500 mt-1">
                            ETA: {formatTime(stop.estimatedArrival)}
                          </p>
                        )}
                      </div>

                      {/* Status Badge */}
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          isCompleted
                            ? "bg-green-100 text-green-800"
                            : isCurrentStop
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {isCompleted
                          ? "● Completed"
                          : isCurrentStop
                          ? "● In Progress"
                          : "○ Pending"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status Legend */}
          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <h4 className="mb-3 text-sm font-semibold text-gray-900">
              Status Legend
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-800">
                    Delivered
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  Package has been delivered
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <Truck className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-800">
                    In Progress
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  Driver is currently at this stop
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-gray-400 rounded-full bg-transparent"></div>
                  <span className="text-sm font-medium text-gray-800">
                    Pending
                  </span>
                </div>
                <span className="text-sm text-gray-600">
                  Driver has not reached this stop yet
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderProgressBar = () => {
    const progressPercentage = Math.round(
      (routeData.completedStops / routeData.totalStops) * 100
    );

    return (
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Route Progress</span>
          <span>{progressPercentage}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
    );
  };

  const renderStatsCards = () => {
    const deliveriesAhead = calculateDeliveriesAhead();

    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <div className="text-lg font-bold text-blue-600">
            {customerStop?.sequenceNumber || "N/A"}
          </div>
          <div className="text-xs text-blue-600">Your Position</div>
        </div>
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-lg font-bold text-orange-600">
            {deliveriesAhead}
          </div>
          <div className="text-xs text-orange-600">Ahead of You</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-lg font-bold text-green-600">
            {routeData.completedStops}
          </div>
          <div className="text-xs text-green-600">Completed</div>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <div className="text-lg font-bold text-purple-600">
            {routeData.totalStops}
          </div>
          <div className="text-xs text-purple-600">Total Stops</div>
        </div>
      </div>
    );
  };

  const renderRouteStatus = () => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      active: "bg-green-100 text-green-800",
      completed: "bg-blue-100 text-blue-800",
      paused: "bg-red-100 text-red-800",
    };

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">Route Status</h3>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              statusColors[routeData.routeStatus] || statusColors.pending
            }`}
          >
            {routeData.routeStatus?.replace("_", " ").toUpperCase() ||
              "PENDING"}
          </span>
        </div>

        <div className="mt-2 text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-blue-800 font-medium text-sm">
            {getCustomerPositionMessage()}
          </p>
        </div>
      </div>
    );
  };

  const renderUpcomingStops = () => {
    if (!customerStop) return null;

    const upcomingStops = routeData.stops
      .filter(
        (stop) =>
          stop.status === "pending" &&
          stop.sequenceNumber < customerStop.sequenceNumber
      )
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
      .slice(0, 3);

    if (upcomingStops.length === 0) return null;

    return (
      <div className="mb-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
          <Clock className="w-4 h-4 mr-1" />
          Upcoming Stops
        </h4>
        <div className="space-y-2">
          {upcomingStops.map((stop) => (
            <div
              key={stop._id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <div className="flex items-center">
                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center mr-2">
                  <span className="text-orange-600 font-semibold text-xs">
                    {stop.sequenceNumber}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-900">
                    {stop.address?.area || "Delivery Area"}
                  </p>
                  <p className="text-xs text-gray-600">
                    Est: {formatTime(stop.estimatedArrival)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderRouteInfo = () => {
    return (
      <div className="space-y-3 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Service Area:</span>
          <span className="font-medium">{routeData.serviceArea}</span>
        </div>
        <div className="flex justify-between">
          <span>Shift:</span>
          <span className="font-medium capitalize">{routeData.shift}</span>
        </div>
        <div className="flex justify-between">
          <span>Estimated Duration:</span>
          <span className="font-medium">{routeData.estimatedDuration}</span>
        </div>
        {customerStop?.estimatedArrival && (
          <div className="flex justify-between">
            <span>Your ETA:</span>
            <span className="font-medium">
              {formatTime(customerStop.estimatedArrival)}
            </span>
          </div>
        )}
      </div>
    );
  };

  if (!routeData) {
    return (
      <div className={`text-center p-6 ${className}`}>
        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <Package className="w-6 h-6 text-gray-400" />
        </div>
        <h4 className="text-gray-800 font-medium mb-1">No Route Data</h4>
        <p className="text-gray-500 text-sm">
          No delivery route found for today.
        </p>
      </div>
    );
  }

  // Compact mode for embedded usage
  if (compact) {
    return (
      <div className={`bg-white p-4 ${className}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900 flex items-center">
            <Navigation className="w-4 h-4 mr-2 text-blue-600" />
            Delivery Tracking
          </h3>
          <span className="text-xs text-gray-500">
            {new Date(routeData.date).toLocaleDateString()}
          </span>
        </div>

        {renderTimelineVisualization()}
        {renderProgressBar()}
        {renderRouteStatus()}
        {renderStatsCards()}
        {renderRouteInfo()}
      </div>
    );
  }

  // Full mode for standalone usage
  return (
    <div
      className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 flex items-center">
            <Truck className="w-6 h-6 mr-3 text-blue-600" />
            Delivery Route Tracking
          </h2>
          <span className="text-sm text-gray-500">
            {new Date(routeData.date).toLocaleDateString("en-IN")} •{" "}
            {routeData.shift}
          </span>
        </div>

        {renderTimelineVisualization()}
        {renderProgressBar()}
        {renderRouteStatus()}
        {renderStatsCards()}

        <div className="border-t pt-4 mt-4">{renderRouteInfo()}</div>
      </div>
    </div>
  );
};

export default DriverRouteTracking;
