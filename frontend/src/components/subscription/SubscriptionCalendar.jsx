import React, { useState, useMemo, useEffect } from "react";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaTimesCircle,
  FaExchangeAlt,
  FaCog,
  FaUtensils,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaSun,
  FaMoon,
  FaPlay,
  FaStop,
  FaInfo,
  FaMapMarkerAlt,
} from "react-icons/fa";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  isFuture,
  isPast,
  parseISO,
} from "date-fns";

const SubscriptionCalendar = ({
  subscription,
  onDateClick,
  className = "",
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showMealDetails, setShowMealDetails] = useState(false);

  // Generate calendar days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return days;
  }, [currentMonth]);

  // Get subscription delivery schedule

  // Select the appropriate subscription (handle both single object and array)
  const selectedSubscription = useMemo(() => {
    if (!subscription) return null;

    // If subscription is an array, find the latest active subscription
    if (Array.isArray(subscription)) {
      const activeSubscriptions = subscription.filter(
        (sub) => sub.status === "active" || sub.status === "paused"
      );

      if (activeSubscriptions.length === 0) {
        // If no active subscriptions, return the most recent one
        const mostRecent = subscription.sort(
          (a, b) =>
            new Date(b.createdAt || b.startDate) -
            new Date(a.createdAt || a.startDate)
        )[0];
        return mostRecent;
      }

      // Return the most recent active subscription
      const mostRecentActive = activeSubscriptions.sort(
        (a, b) =>
          new Date(b.createdAt || b.startDate) -
          new Date(a.createdAt || a.startDate)
      )[0];
      return mostRecentActive;
    }

    // If subscription is a single object, return it
    return subscription;
  }, [subscription]);

  const deliverySchedule = useMemo(() => {
    if (!selectedSubscription || !selectedSubscription.deliveryTracking) {
      return new Map();
    }

    const schedule = new Map();

    selectedSubscription.deliveryTracking.forEach((delivery) => {
      const deliveryDate = new Date(delivery.date);
      const dateKey = format(deliveryDate, "yyyy-MM-dd");

      if (!schedule.has(dateKey)) {
        schedule.set(dateKey, []);
      }
      schedule.get(dateKey).push(delivery);
    });

    return schedule;
  }, [selectedSubscription]);
  // Get subscription period info
  const subscriptionInfo = useMemo(() => {
    if (!selectedSubscription) return null;
    return {
      startDate: selectedSubscription.startDate
        ? new Date(selectedSubscription.startDate)
        : null,
      endDate: selectedSubscription.endDate
        ? new Date(selectedSubscription.endDate)
        : null,
      status: selectedSubscription.status,
      planName:
        selectedSubscription.mealPlan?.name || selectedSubscription.planType,
      shift: selectedSubscription.shift,
      totalDays: selectedSubscription.deliveryTracking?.length || 0,
      deliveredCount:
        selectedSubscription.deliveryTracking?.filter(
          (d) => d.status === "delivered"
        ).length || 0,
      skippedCount:
        selectedSubscription.deliveryTracking?.filter(
          (d) => d.status === "skipped"
        ).length || 0,
      replacedCount:
        selectedSubscription.deliveryTracking?.filter(
          (d) => d.status === "replaced"
        ).length || 0,
    };
  }, [selectedSubscription]);

  // Get day status and details
  const getDayInfo = (date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    const deliveries = deliverySchedule.get(dateKey) || [];

    if (deliveries.length === 0) {
      // Check if date is within subscription period
      if (subscriptionInfo?.startDate && subscriptionInfo?.endDate) {
        if (
          date >= subscriptionInfo.startDate &&
          date <= subscriptionInfo.endDate
        ) {
          return { type: "no-delivery", deliveries: [], label: "No delivery" };
        }
      }
      return { type: "outside", deliveries: [], label: "Outside subscription" };
    }

    // Determine overall day status
    const hasDelivered = deliveries.some((d) => d.status === "delivered");
    const hasSkipped = deliveries.some((d) => d.status === "skipped");
    const hasReplaced = deliveries.some((d) => d.status === "replaced");
    const hasPending = deliveries.some(
      (d) =>
        d.status === "pending" ||
        (!d.status && !hasDelivered && !hasSkipped && !hasReplaced)
    );

    if (hasDelivered && !hasPending) {
      return { type: "delivered", deliveries, label: "Delivered" };
    } else if (hasSkipped && !hasPending) {
      return { type: "skipped", deliveries, label: "Skipped" };
    } else if (hasReplaced) {
      return { type: "replaced", deliveries, label: "Replaced" };
    } else if (hasPending) {
      return { type: "pending", deliveries, label: "Scheduled" };
    }

    return { type: "scheduled", deliveries, label: "Scheduled" };
  };

  // Get shift indicators for the date
  const getShiftIndicators = (deliveries) => {
    const shifts = {
      morning: { hasDelivery: false, status: null },
      evening: { hasDelivery: false, status: null },
    };

    deliveries.forEach((delivery) => {
      if (delivery.shift === "morning") {
        shifts.morning.hasDelivery = true;
        shifts.morning.status = delivery.status || "pending";
      } else if (delivery.shift === "evening") {
        shifts.evening.hasDelivery = true;
        shifts.evening.status = delivery.status || "pending";
      }
    });

    return shifts;
  };

  // Get shift dot color based on status
  const getShiftDotColor = (status) => {
    switch (status) {
      case "delivered":
        return "bg-green-500";
      case "skipped":
        return "bg-red-500";
      case "replaced":
        return "bg-blue-500";
      case "pending":
      default:
        return "bg-yellow-500";
    }
  };

  // Get day CSS classes
  const getDayClasses = (date, dayInfo) => {
    const baseClasses =
      "relative h-12 w-full flex flex-col items-center justify-center text-sm font-medium transition-all duration-200 cursor-pointer";

    if (!isSameMonth(date, currentMonth)) {
      return `${baseClasses} text-gray-400 bg-gray-50`;
    }

    if (isToday(date)) {
      return `${baseClasses} ring-2 ring-blue-500 bg-blue-50 text-blue-700 font-bold`;
    }

    switch (dayInfo.type) {
      case "delivered":
        return `${baseClasses} bg-green-100 text-green-800 hover:bg-green-200`;
      case "skipped":
        return `${baseClasses} bg-red-100 text-red-800 hover:bg-red-200`;
      case "replaced":
        return `${baseClasses} bg-blue-100 text-blue-800 hover:bg-blue-200`;
      case "pending":
      case "scheduled":
        return `${baseClasses} bg-yellow-100 text-yellow-800 hover:bg-yellow-200`;
      case "no-delivery":
        return `${baseClasses} bg-gray-100 text-gray-600 hover:bg-gray-200`;
      default:
        return `${baseClasses} text-gray-500 hover:bg-gray-100`;
    }
  };

  // Get day icon
  const getDayIcon = (dayInfo) => {
    switch (dayInfo.type) {
      case "delivered":
        return <FaCheckCircle className="h-3 w-3 text-green-600" />;
      case "skipped":
        return <FaTimesCircle className="h-3 w-3 text-red-600" />;
      case "replaced":
        return <FaExchangeAlt className="h-3 w-3 text-blue-600" />;
      case "pending":
      case "scheduled":
        return <FaClock className="h-3 w-3 text-yellow-600" />;
      default:
        return null;
    }
  };

  // Handle date click
  const handleDateClick = (date, dayInfo) => {
    setSelectedDate(date);
    if (dayInfo.deliveries.length > 0) {
      setShowMealDetails(true);
    }
    onDateClick?.(date, dayInfo);
  };

  // Navigate months
  const prevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const nextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));

  if (!subscription) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center py-8">
          <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Subscription Found
          </h3>
          <p className="text-gray-600">
            Please select a subscription to view the calendar.
          </p>
        </div>
      </div>
    );
  }

  if (!selectedSubscription) {
    return (
      <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
        <div className="text-center py-8">
          <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Active Subscription Found
          </h3>
          <p className="text-gray-600">
            No active or recent subscriptions available to display.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <FaChevronLeft className="h-4 w-4" />
          </button>

          <h2 className="text-xl font-semibold">
            {format(currentMonth, "MMMM yyyy")}
          </h2>

          <button
            onClick={nextMonth}
            className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
          >
            <FaChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Subscription Summary */}
        {subscriptionInfo && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="text-blue-100">Plan</div>
              <div className="font-medium truncate">
                {subscriptionInfo.planName}
              </div>
            </div>
            <div className="text-center">
              <div className="text-blue-100">Status</div>
              <div className="font-medium capitalize">
                {subscriptionInfo.status}
              </div>
            </div>
            <div className="text-center">
              <div className="text-blue-100">Delivered</div>
              <div className="font-medium">
                {subscriptionInfo.deliveredCount}/{subscriptionInfo.totalDays}
              </div>
            </div>
            <div className="text-center">
              <div className="text-blue-100">Shift</div>
              <div className="font-medium capitalize">
                {subscriptionInfo.shift}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Week days header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="h-8 flex items-center justify-center text-xs font-medium text-gray-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((date, index) => {
            const dayInfo = getDayInfo(date);
            const shiftIndicators = getShiftIndicators(dayInfo.deliveries);
            return (
              <div key={index} className="relative">
                <button
                  onClick={() => handleDateClick(date, dayInfo)}
                  className={getDayClasses(date, dayInfo)}
                >
                  <span className="text-xs">{format(date, "d")}</span>
                  {getDayIcon(dayInfo)}

                  {/* Shift indicators with color-coded dots */}
                  {(shiftIndicators.morning.hasDelivery ||
                    shiftIndicators.evening.hasDelivery) && (
                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 flex space-x-1">
                      {/* Morning indicator */}
                      {shiftIndicators.morning.hasDelivery && (
                        <div
                          className={`w-2 h-2 rounded-full ${getShiftDotColor(
                            shiftIndicators.morning.status
                          )}`}
                          title={`Morning: ${shiftIndicators.morning.status}`}
                        />
                      )}
                      {/* Evening indicator */}
                      {shiftIndicators.evening.hasDelivery && (
                        <div
                          className={`w-2 h-2 rounded-full ${getShiftDotColor(
                            shiftIndicators.evening.status
                          )}`}
                          title={`Evening: ${shiftIndicators.evening.status}`}
                        />
                      )}
                    </div>
                  )}

                  {/* Multiple deliveries indicator (keep existing) */}
                  {dayInfo.deliveries.length > 1 && (
                    <div className="absolute -top-1 -right-1">
                      <span className="inline-flex items-center justify-center h-4 w-4 text-xs bg-purple-500 text-white rounded-full">
                        {dayInfo.deliveries.length}
                      </span>
                    </div>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Legend</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-4">
            <div className="flex items-center">
              <FaCheckCircle className="h-3 w-3 text-green-600 mr-2" />
              <span>Delivered</span>
            </div>
            <div className="flex items-center">
              <FaClock className="h-3 w-3 text-yellow-600 mr-2" />
              <span>Scheduled</span>
            </div>
            <div className="flex items-center">
              <FaTimesCircle className="h-3 w-3 text-red-600 mr-2" />
              <span>Skipped</span>
            </div>
            <div className="flex items-center">
              <FaExchangeAlt className="h-3 w-3 text-blue-600 mr-2" />
              <span>Replaced</span>
            </div>
          </div>

          {/* Shift Indicators Legend */}
          <h5 className="text-xs font-medium text-gray-800 mb-2">
            Shift Indicators (dots)
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
              <span>Delivered</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
              <span>Pending</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
              <span>Skipped</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div>
              <span>Replaced</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Each dot represents a shift - left dot for morning, right dot for
            evening
          </p>
        </div>

        {/* Subscription Period Info */}
        {subscriptionInfo && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Subscription Period
            </h4>
            <div className="text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span className="flex items-center">
                  <FaPlay className="h-3 w-3 text-green-600 mr-1" />
                  Start:{" "}
                  {subscriptionInfo.startDate
                    ? format(subscriptionInfo.startDate, "MMM d, yyyy")
                    : "N/A"}
                </span>
                <span className="flex items-center">
                  <FaStop className="h-3 w-3 text-red-600 mr-1" />
                  End:{" "}
                  {subscriptionInfo.endDate
                    ? format(subscriptionInfo.endDate, "MMM d, yyyy")
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Meal Details Modal */}
      {showMealDetails && selectedDate && (
        <MealDetailsModal
          date={selectedDate}
          deliveries={getDayInfo(selectedDate).deliveries}
          onClose={() => {
            setShowMealDetails(false);
            setSelectedDate(null);
          }}
        />
      )}
    </div>
  );
};

// Meal Details Modal Component
const MealDetailsModal = ({ date, deliveries, onClose }) => {
  // Debug logging for modal data
  console.log("📋 MealDetailsModal data:", {
    date,
    deliveries,
    deliveriesCount: deliveries?.length,
    firstDelivery: deliveries?.[0],
  });

  if (!deliveries || deliveries.length === 0) {
    console.warn("⚠️ No deliveries provided to modal");
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        ></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Modal Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-white">Meal Details</h3>
                <p className="text-blue-100 text-sm">
                  {(() => {
                    try {
                      return format(date, "EEEE, MMMM d, yyyy");
                    } catch (error) {
                      console.error(
                        "❌ Error formatting modal date:",
                        error,
                        date
                      );
                      return date?.toString() || "Invalid date";
                    }
                  })()}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <FaTimesCircle className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Modal Content */}
          <div className="max-h-96 overflow-y-auto p-6">
            <div className="space-y-4">
              {deliveries.map((delivery, index) => (
                <MealDeliveryCard key={index} delivery={delivery} />
              ))}
            </div>
          </div>

          {/* Modal Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Individual Meal Delivery Card
const MealDeliveryCard = ({ delivery }) => {
  // Debug logging for delivery card data
  console.log("🍽️ MealDeliveryCard delivery:", delivery);

  // Safety check - ensure delivery object exists and has required fields
  if (!delivery || (!delivery.date && !delivery.shift)) {
    console.warn("⚠️ Invalid delivery data in MealDeliveryCard:", delivery);
    return (
      <div className="border rounded-lg p-4 bg-gray-50 border-gray-200">
        <div className="text-sm text-gray-500">Invalid delivery data</div>
      </div>
    );
  }

  // Unified status detection - handle both old (deliveryStatus) and new (status) field names
  const getDeliveryStatus = () => {
    return (
      delivery.status ||
      delivery.deliveryStatus ||
      (delivery.isSkipped
        ? "skipped"
        : delivery.isReplaced
        ? "replaced"
        : delivery.isCustomized
        ? "customized"
        : "pending")
    );
  };

  const getStatusIcon = () => {
    const status = getDeliveryStatus();
    if (status === "delivered") {
      return <FaCheckCircle className="h-5 w-5 text-green-500" />;
    }
    if (status === "skipped" || delivery.isSkipped) {
      return <FaTimesCircle className="h-5 w-5 text-red-500" />;
    }
    if (status === "replaced" || delivery.isReplaced) {
      return <FaExchangeAlt className="h-5 w-5 text-blue-500" />;
    }
    if (status === "customized" || delivery.isCustomized) {
      return <FaCog className="h-5 w-5 text-purple-500" />;
    }
    return <FaClock className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusColor = () => {
    const status = getDeliveryStatus();
    if (status === "delivered") return "bg-green-50 border-green-200";
    if (status === "skipped" || delivery.isSkipped)
      return "bg-red-50 border-red-200";
    if (status === "replaced" || delivery.isReplaced)
      return "bg-blue-50 border-blue-200";
    if (status === "customized" || delivery.isCustomized)
      return "bg-purple-50 border-purple-200";
    return "bg-yellow-50 border-yellow-200";
  };

  const getShiftIcon = () => {
    const shift = delivery.shift || "morning"; // Default to morning if no shift specified
    return shift === "morning" ? (
      <FaSun className="h-4 w-4 text-yellow-500" />
    ) : (
      <FaMoon className="h-4 w-4 text-blue-500" />
    );
  };

  return (
    <div className={`border rounded-lg p-4 ${getStatusColor()}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {getShiftIcon()}
          <span className="font-medium capitalize">
            {delivery.shift || "morning"} Meal
          </span>
        </div>
        <div className="flex items-center space-x-1">
          {getStatusIcon()}
          <span className="text-sm font-medium">
            {(() => {
              const status = getDeliveryStatus();
              return status === "delivered"
                ? "Delivered"
                : status === "skipped" || delivery.isSkipped
                ? "Skipped"
                : status === "replaced" || delivery.isReplaced
                ? "Replaced"
                : status === "customized" || delivery.isCustomized
                ? "Customized"
                : "Scheduled";
            })()}
          </span>
        </div>
      </div>

      {/* Meal Info */}
      <div className="space-y-2">
        <div>
          <span className="text-sm font-medium text-gray-700">Meal: </span>
          <span className="text-sm text-gray-900">
            {/* Show display meal name from backend or fall back to meal plan name */}
            {delivery.displayMealName ||
              (delivery.isReplaced &&
                delivery.replacementDetails?.replacementThali?.name) ||
              (delivery.isCustomized &&
                delivery.customizationDetails?.replacementMeal?.name) ||
              delivery.mealPlan?.name ||
              (delivery.status === "skipped"
                ? "Skipped Meal"
                : "Scheduled Meal")}
          </span>
        </div>

        {/* Show customization details if meal is customized and payment completed */}
        {delivery.isCustomized && delivery.customizationDetails && (
          <div className="bg-purple-100 rounded p-2 mt-2">
            <span className="text-sm font-medium text-purple-800">
              Customized Meal
            </span>
            {delivery.customizationDetails.paymentStatus === "paid" && (
              <div className="text-xs text-purple-700 mt-1">
                {delivery.customizationDetails.addons?.length > 0 && (
                  <div>
                    Addons:{" "}
                    {delivery.customizationDetails.addons
                      .map((addon) => addon.item?.name)
                      .join(", ")}
                  </div>
                )}
                {delivery.customizationDetails.extraItems?.length > 0 && (
                  <div>
                    Extra Items:{" "}
                    {delivery.customizationDetails.extraItems
                      .map((item) => item.item?.name)
                      .join(", ")}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {delivery.deliveryTime && (
          <div>
            <span className="text-sm font-medium text-gray-700">Time: </span>
            <span className="text-sm text-gray-900">
              {delivery.deliveryTime}
            </span>
          </div>
        )}

        {delivery.deliveredAt && (
          <div>
            <span className="text-sm font-medium text-gray-700">
              Delivered at:{" "}
            </span>
            <span className="text-sm text-gray-900">
              {(() => {
                try {
                  return format(
                    new Date(delivery.deliveredAt),
                    "MMM d, yyyy h:mm a"
                  );
                } catch (error) {
                  console.error(
                    "❌ Error formatting delivery date:",
                    error,
                    delivery.deliveredAt
                  );
                  return delivery.deliveredAt; // Fallback to raw date string
                }
              })()}
            </span>
          </div>
        )}

        {delivery.isReplaced && delivery.replacementDetails && (
          <div className="bg-blue-100 rounded p-2 mt-2">
            <span className="text-sm font-medium text-blue-800">
              Meal Replaced
            </span>
            <div className="text-xs text-blue-700 mt-1">
              {delivery.replacementDetails.priceDifference > 0 && (
                <div>
                  Price Difference: ₹
                  {delivery.replacementDetails.priceDifference}
                </div>
              )}
              {delivery.replacementDetails.paymentStatus && (
                <div>Payment: {delivery.replacementDetails.paymentStatus}</div>
              )}
            </div>
          </div>
        )}

        {delivery.isSkipped && delivery.skipReason && (
          <div className="bg-red-100 rounded p-2 mt-2">
            <span className="text-sm font-medium text-red-800">
              Skip Reason:{" "}
            </span>
            <span className="text-sm text-red-700">{delivery.skipReason}</span>
          </div>
        )}

        {delivery.deliveryNotes && (
          <div className="bg-gray-100 rounded p-2 mt-2">
            <span className="text-sm font-medium text-gray-800">
              Delivery Notes:{" "}
            </span>
            <span className="text-sm text-gray-700">
              {delivery.deliveryNotes}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionCalendar;
