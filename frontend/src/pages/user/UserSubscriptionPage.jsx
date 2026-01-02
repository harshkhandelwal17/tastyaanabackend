import React, { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  useGetUserSubscriptionsQuery,
  useGetSubscriptionDetailQuery,
} from "../../redux/storee/api";
import {
  FaCalendarAlt,
  FaUtensils,
  FaClock,
  FaMapMarkerAlt,
  FaPlay,
  FaStop,
  FaExchangeAlt,
  FaTimesCircle,
  FaCheckCircle,
  FaSpinner,
  FaExclamationTriangle,
  FaChevronDown,
  FaChevronUp,
  FaInfo,
} from "react-icons/fa";
import SubscriptionCalendar from "../../components/subscription/SubscriptionCalendar";
import NoMealTodayAlert from "../../components/subscription/NoMealTodayAlert";
import { format, parseISO } from "date-fns";

const UserSubscriptionPage = () => {
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(null);
  const [expandedSubscription, setExpandedSubscription] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // Get current user
  const { user } = useSelector((state) => state.auth);

  // Get user's subscriptions
  const {
    data: subscriptionsData,
    isLoading: isLoadingSubscriptions,
    error: subscriptionsError,
  } = useGetUserSubscriptionsQuery(user?._id, {
    skip: !user?._id,
  });

  // Get detailed subscription data for calendar
  const { data: subscriptionDetailData, isLoading: isLoadingDetail } =
    useGetSubscriptionDetailQuery(selectedSubscriptionId, {
      skip: !selectedSubscriptionId,
    });

  const subscriptions = subscriptionsData?.data || [];
  const selectedSubscription = subscriptionDetailData?.data;

  // Calculate subscription statistics
  const subscriptionStats = useMemo(() => {
    if (!subscriptions.length)
      return { total: 0, active: 0, paused: 0, completed: 0 };

    return subscriptions.reduce(
      (acc, sub) => {
        acc.total++;
        if (sub.status === "active") acc.active++;
        else if (sub.status === "paused") acc.paused++;
        else if (sub.status === "completed") acc.completed++;
        return acc;
      },
      { total: 0, active: 0, paused: 0, completed: 0 }
    );
  }, [subscriptions]);

  // Handle subscription selection
  const handleSubscriptionSelect = (subscriptionId) => {
    setSelectedSubscriptionId(subscriptionId);
    setExpandedSubscription(
      expandedSubscription === subscriptionId ? null : subscriptionId
    );
  };

  // Handle calendar date click
  const handleDateClick = (date, dayInfo) => {
    setSelectedDate({ date, dayInfo });
  };

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "paused":
        return "bg-yellow-100 text-yellow-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <FaPlay className="h-4 w-4" />;
      case "paused":
        return <FaClock className="h-4 w-4" />;
      case "completed":
        return <FaCheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <FaTimesCircle className="h-4 w-4" />;
      default:
        return <FaInfo className="h-4 w-4" />;
    }
  };

  if (isLoadingSubscriptions) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your subscriptions...</p>
        </div>
      </div>
    );
  }

  if (subscriptionsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaExclamationTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Subscriptions
          </h3>
          <p className="text-gray-600">
            {subscriptionsError?.message || "Failed to load subscriptions"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                  <FaCalendarAlt className="mr-3 text-blue-600" />
                  My Subscriptions
                </h1>
                <p className="text-gray-600 mt-1">
                  Manage and track your meal subscription deliveries
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* No Meal Today Alert */}
        <NoMealTodayAlert userId={user?._id} />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaUtensils className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <div className="text-lg font-bold text-gray-900">
                  {subscriptionStats.total}
                </div>
                <div className="text-sm text-gray-600">Total</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FaPlay className="h-5 w-5 text-green-600" />
              </div>
              <div className="ml-3">
                <div className="text-lg font-bold text-gray-900">
                  {subscriptionStats.active}
                </div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FaClock className="h-5 w-5 text-yellow-600" />
              </div>
              <div className="ml-3">
                <div className="text-lg font-bold text-gray-900">
                  {subscriptionStats.paused}
                </div>
                <div className="text-sm text-gray-600">Paused</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaCheckCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <div className="text-lg font-bold text-gray-900">
                  {subscriptionStats.completed}
                </div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Subscriptions List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Your Subscriptions
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Click on a subscription to view its calendar
                </p>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {subscriptions.length === 0 ? (
                  <div className="p-6 text-center">
                    <FaUtensils className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">
                      No Subscriptions Found
                    </h4>
                    <p className="text-gray-600">
                      You don't have any active subscriptions yet.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {subscriptions.map((subscription) => (
                      <SubscriptionListItem
                        key={subscription._id}
                        subscription={subscription}
                        isSelected={selectedSubscriptionId === subscription._id}
                        isExpanded={expandedSubscription === subscription._id}
                        onSelect={() =>
                          handleSubscriptionSelect(subscription._id)
                        }
                        getStatusColor={getStatusColor}
                        getStatusIcon={getStatusIcon}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Calendar View */}
          <div className="lg:col-span-2">
            {isLoadingDetail ? (
              <div className="bg-white rounded-lg shadow p-8">
                <div className="flex items-center justify-center">
                  <FaSpinner className="animate-spin h-8 w-8 text-blue-600 mr-3" />
                  <span className="text-lg text-gray-600">
                    Loading subscription details...
                  </span>
                </div>
              </div>
            ) : selectedSubscription ? (
              <SubscriptionCalendar
                subscription={selectedSubscription}
                onDateClick={handleDateClick}
                className="h-fit"
              />
            ) : (
              <div className="bg-white rounded-lg shadow p-8">
                <div className="text-center">
                  <FaCalendarAlt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Select a Subscription
                  </h3>
                  <p className="text-gray-600">
                    Choose a subscription from the list to view its delivery
                    calendar
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Selected Date Info */}
        {selectedDate && (
          <div className="mt-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Selected Date: {format(selectedDate.date, "EEEE, MMMM d, yyyy")}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">
                    Day Status:
                  </h4>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedDate.dayInfo.type === "delivered"
                        ? "bg-green-100 text-green-800"
                        : selectedDate.dayInfo.type === "skipped"
                        ? "bg-red-100 text-red-800"
                        : selectedDate.dayInfo.type === "replaced"
                        ? "bg-blue-100 text-blue-800"
                        : selectedDate.dayInfo.type === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {selectedDate.dayInfo.label}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-800 mb-2">
                    Deliveries:
                  </h4>
                  <span className="text-gray-600">
                    {selectedDate.dayInfo.deliveries.length} meal(s) scheduled
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Individual Subscription List Item
const SubscriptionListItem = ({
  subscription,
  isSelected,
  isExpanded,
  onSelect,
  getStatusColor,
  getStatusIcon,
}) => {
  return (
    <div
      className={`p-4 cursor-pointer transition-colors ${
        isSelected ? "bg-blue-50" : "hover:bg-gray-50"
      }`}
    >
      <div onClick={onSelect}>
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <FaUtensils className="h-5 w-5 text-gray-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-900 truncate">
                  {subscription.mealPlan?.name || subscription.planType}
                </h4>
                <p className="text-xs text-gray-600">
                  ID: {subscription.subscriptionId}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                subscription.status
              )}`}
            >
              {getStatusIcon(subscription.status)}
              <span className="ml-1 capitalize">{subscription.status}</span>
            </span>
            {isSelected ? (
              <FaChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <FaChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
              <div>
                <span className="font-medium">Shift:</span>
                <span className="ml-1 capitalize">{subscription.shift}</span>
              </div>
              <div>
                <span className="font-medium">Plan:</span>
                <span className="ml-1">{subscription.planType}</span>
              </div>
              <div>
                <span className="font-medium">Start:</span>
                <span className="ml-1">
                  {subscription.startDate
                    ? format(parseISO(subscription.startDate), "MMM d, yyyy")
                    : "N/A"}
                </span>
              </div>
              <div>
                <span className="font-medium">End:</span>
                <span className="ml-1">
                  {subscription.endDate
                    ? format(parseISO(subscription.endDate), "MMM d, yyyy")
                    : "N/A"}
                </span>
              </div>
            </div>

            {subscription.deliveryAddress && (
              <div className="mt-2">
                <div className="flex items-start text-xs text-gray-600">
                  <FaMapMarkerAlt className="h-3 w-3 mr-1 mt-0.5" />
                  <span>
                    {subscription.deliveryAddress.street},{" "}
                    {subscription.deliveryAddress.city}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserSubscriptionPage;
