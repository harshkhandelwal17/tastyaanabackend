import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  useGetSubscriptionsQuery,
  useUpdateSubscriptionStatusMutation,
  useGetMealPlansQuery,
} from "../../redux/api/adminPanelApi";
import {
  FiCalendar,
  FiUsers,
  FiDollarSign,
  FiTruck,
  FiSearch,
  FiEye,
  FiMoreVertical,
  FiPlay,
  FiPause,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiPackage,
} from "react-icons/fi";
import moment from "moment";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-32">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const SubscriptionCard = ({ subscription, onStatusUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (status) => {
    setIsUpdating(true);
    try {
      await onStatusUpdate({ subscriptionId: subscription._id, status });
    } catch (error) {
      console.error("Error updating status:", error);
    }
    setIsUpdating(false);
  };

  const statusColors = {
    active: "bg-green-100 text-green-800",
    paused: "bg-yellow-100 text-yellow-800",
    cancelled: "bg-red-100 text-red-800",
    expired: "bg-gray-100 text-gray-800",
    completed: "bg-blue-100 text-blue-800",
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "active":
        return <FiPlay size={12} />;
      case "paused":
        return <FiPause size={12} />;
      case "cancelled":
      case "expired":
        return <FiX size={12} />;
      default:
        return <FiCalendar size={12} />;
    }
  };

  // Calculate progress based on meal counts
  const totalMeals = subscription.mealCounts?.totalMeals || 0;
  const mealsDelivered = subscription.mealCounts?.mealsDelivered || 0;
  const mealsSkipped = subscription.mealCounts?.mealsSkipped || 0;
  const mealsRemaining = subscription.mealCounts?.mealsRemaining || 0;
  const progressPercentage =
    totalMeals > 0 ? ((mealsDelivered + mealsSkipped) / totalMeals) * 100 : 0;

  // Calculate subscription days
  const startDate = moment(subscription.startDate);
  const endDate = moment(subscription.endDate);
  const currentDate = moment();
  const totalDays = endDate.diff(startDate, "days") + 1;
  const daysElapsed = Math.min(
    currentDate.diff(startDate, "days") + 1,
    totalDays
  );
  const daysRemaining = Math.max(endDate.diff(currentDate, "days"), 0);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-1">
            {subscription.mealPlan?.title || "Unknown Plan"}
          </h3>
          <p className="text-sm text-gray-600">
            {subscription.user?.name || "Unknown User"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {subscription.user?.email}
          </p>
          <p className="text-xs text-blue-600 font-medium mt-1">
            ID: {subscription.subscriptionId || subscription._id}
          </p>
        </div>
        <span
          className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            statusColors[subscription.status] || statusColors.active
          }`}
        >
          {getStatusIcon(subscription.status)}
          <span className="ml-1">{subscription.status || "active"}</span>
        </span>
      </div>

      {/* Key Metrics - Meal Count Focus */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="text-xs text-blue-600 font-medium">
            Meals Remaining
          </div>
          <div className="text-lg font-bold text-blue-800">
            {mealsRemaining}
          </div>
          <div className="text-xs text-blue-600">of {totalMeals} total</div>
        </div>
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="text-xs text-green-600 font-medium">Delivered</div>
          <div className="text-lg font-bold text-green-800">
            {mealsDelivered}
          </div>
          <div className="text-xs text-green-600">
            {mealsSkipped > 0 && `${mealsSkipped} skipped`}
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-600">Start Date:</span>
          <p className="font-medium">
            {moment(subscription.startDate).format("MMM DD, YYYY")}
          </p>
        </div>
        <div>
          <span className="text-gray-600">End Date:</span>
          <p className="font-medium">
            {moment(subscription.endDate).format("MMM DD, YYYY")}
          </p>
        </div>
        <div>
          <span className="text-gray-600">Shift:</span>
          <p className="font-medium capitalize">
            {subscription.shift || "N/A"}
          </p>
        </div>
        <div>
          <span className="text-gray-600">Plan Type:</span>
          <p className="font-medium">{subscription.planType || "N/A"}</p>
        </div>
        <div>
          <span className="text-gray-600">Total Amount:</span>
          <p className="font-medium">
            ₹
            {subscription.pricing?.totalAmount || subscription.totalAmount || 0}
          </p>
        </div>
        <div>
          <span className="text-gray-600">Days Remaining:</span>
          <p className="font-medium">
            {subscription.status === "active" ? daysRemaining : "N/A"} days
          </p>
        </div>
      </div>

      {/* Meal Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-600 mb-2">
          <span>Meal Progress</span>
          <span>{Math.round(progressPercentage)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="relative h-3 rounded-full overflow-hidden">
            <div
              className="bg-green-500 h-full transition-all duration-300"
              style={{
                width: `${Math.min(progressPercentage, 100)}%`,
              }}
            ></div>
            {mealsSkipped > 0 && (
              <div
                className="bg-yellow-400 h-full absolute top-0"
                style={{
                  width: `${Math.min((mealsSkipped / totalMeals) * 100, 100)}%`,
                  left: `${Math.min(
                    (mealsDelivered / totalMeals) * 100,
                    100
                  )}%`,
                }}
              ></div>
            )}
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Delivered: {mealsDelivered}</span>
          {mealsSkipped > 0 && <span>Skipped: {mealsSkipped}</span>}
          <span>Remaining: {mealsRemaining}</span>
        </div>
      </div>

      {/* Expiry Warning */}
      {subscription.status === "active" &&
        mealsRemaining <= 5 &&
        mealsRemaining > 0 && (
          <div className="mb-4 p-2 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center text-orange-800">
              <FiCalendar size={14} className="mr-2" />
              <span className="text-xs font-medium">
                ⚠️ Only {mealsRemaining} meals remaining
              </span>
            </div>
          </div>
        )}

      {/* Expired Notice */}
      {mealsRemaining <= 0 && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center text-red-800">
            <FiX size={14} className="mr-2" />
            <span className="text-xs font-medium">
              All meals completed - Subscription should be expired
            </span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {subscription.status === "active" && (
            <button
              onClick={() => handleStatusChange("paused")}
              disabled={isUpdating}
              className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-700 rounded-lg text-xs hover:bg-yellow-200 disabled:opacity-50"
            >
              <FiPause size={12} className="mr-1" />
              Pause
            </button>
          )}
          {subscription.status === "paused" && (
            <button
              onClick={() => handleStatusChange("active")}
              disabled={isUpdating}
              className="flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-lg text-xs hover:bg-green-200 disabled:opacity-50"
            >
              <FiPlay size={12} className="mr-1" />
              Resume
            </button>
          )}
          {subscription.status !== "cancelled" &&
            subscription.status !== "expired" && (
              <button
                onClick={() => handleStatusChange("cancelled")}
                disabled={isUpdating}
                className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs hover:bg-red-200 disabled:opacity-50"
              >
                <FiX size={12} className="mr-1" />
                Cancel
              </button>
            )}
        </div>
        <Link
          to={`/admin/subscriptions/${subscription._id}`}
          className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200"
        >
          <FiEye size={12} className="mr-1" />
          Details
        </Link>
      </div>
    </div>
  );
};

const MealPlanCard = ({ mealPlan }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{mealPlan.name}</h3>
        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
          {mealPlan.subscriberCount || 0} subscribers
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Duration:</span>
          <p className="font-medium">{mealPlan.duration || "N/A"} days</p>
        </div>
        <div>
          <span className="text-gray-600">Price:</span>
          <p className="font-medium">₹{mealPlan.price || 0}</p>
        </div>
        <div>
          <span className="text-gray-600">Category:</span>
          <p className="font-medium">{mealPlan.category || "General"}</p>
        </div>
        <div>
          <span className="text-gray-600">Active:</span>
          <p className="font-medium">{mealPlan.activeSubscriptions || 0}</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-600 mb-1">
          <span>Revenue</span>
          <span>₹{mealPlan.subscriberCount * mealPlan.price || 0}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full"
            style={{
              width: `${Math.min(
                (mealPlan.subscriberCount / 100) * 100,
                100
              )}%`,
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

const SubscriptionsManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [activeTab, setActiveTab] = useState("subscriptions"); // 'subscriptions' or 'mealplans'

  const {
    data: subscriptionsData,
    isLoading: subscriptionsLoading,
    error: subscriptionsError,
    refetch: refetchSubscriptions,
  } = useGetSubscriptionsQuery({
    page: currentPage,
    limit: 50,
    search,
    status: statusFilter,
  });
  const { data: mealPlansData, isLoading: mealPlansLoading } =
    useGetMealPlansQuery();
  console.log(mealPlansData);

  const [updateSubscriptionStatus] = useUpdateSubscriptionStatusMutation();

  const handleStatusUpdate = async ({ subscriptionId, status }) => {
    try {
      await updateSubscriptionStatus({ subscriptionId, status }).unwrap();
      refetchSubscriptions();
    } catch (error) {
      console.error("Failed to update subscription status:", error);
    }
  };

  if (subscriptionsLoading && activeTab === "subscriptions") {
    return <LoadingSpinner />;
  }

  if (mealPlansLoading && activeTab === "mealplans") {
    return <LoadingSpinner />;
  }

  if (subscriptionsError && activeTab === "subscriptions") {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-4">
          <FiCalendar size={48} className="mx-auto mb-2" />
          <p>Error loading subscriptions data</p>
          <button
            onClick={refetchSubscriptions}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const subscriptions = subscriptionsData?.data?.subscriptions || [];
  const totalPages = subscriptionsData?.pagination?.totalPages || 1;
  const totalSubscriptions =
    subscriptionsData?.data?.pagination?.totalSubscriptions || 0;
  const mealPlans = mealPlansData?.data?.mealPlans || [];

  // Calculate summary statistics
  const summaryStats = subscriptions.reduce(
    (acc, sub) => {
      acc.totalRevenue += sub.pricing?.totalAmount || sub.totalAmount || 0;
      acc.totalMeals += sub.mealCounts?.totalMeals || 0;
      acc.mealsDelivered += sub.mealCounts?.mealsDelivered || 0;
      acc.mealsRemaining += sub.mealCounts?.mealsRemaining || 0;
      acc.mealsSkipped += sub.mealCounts?.mealsSkipped || 0;

      // Count by status
      acc.statusCounts[sub.status] = (acc.statusCounts[sub.status] || 0) + 1;

      // Count subscriptions about to expire (5 or fewer meals remaining)
      if (
        sub.status === "active" &&
        (sub.mealCounts?.mealsRemaining || 0) <= 5 &&
        (sub.mealCounts?.mealsRemaining || 0) > 0
      ) {
        acc.aboutToExpire++;
      }

      return acc;
    },
    {
      totalRevenue: 0,
      totalMeals: 0,
      mealsDelivered: 0,
      mealsRemaining: 0,
      mealsSkipped: 0,
      statusCounts: {},
      aboutToExpire: 0,
    }
  );

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Subscription Management
          </h1>
          <p className="text-gray-600">
            {activeTab === "subscriptions"
              ? `Manage all user subscriptions (${totalSubscriptions} total) - Meal count-based expiry system`
              : `Meal plan analytics and performance`}
          </p>
          {activeTab === "subscriptions" && summaryStats.aboutToExpire > 0 && (
            <div className="mt-2 inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-lg text-sm">
              <FiCalendar className="mr-1" size={14} />
              {summaryStats.aboutToExpire} subscription(s) expiring soon
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("subscriptions")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "subscriptions"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FiCalendar className="inline mr-2" size={16} />
              Subscriptions
            </button>
            <button
              onClick={() => setActiveTab("mealplans")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "mealplans"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <FiPackage className="inline mr-2" size={16} />
              Meal Plans
            </button>
          </nav>
        </div>
      </div>

      {activeTab === "subscriptions" ? (
        <>
          {/* Summary Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg shadow-md p-4 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Total Revenue
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    ₹{summaryStats.totalRevenue.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <FiDollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Meals Remaining
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {summaryStats.mealsRemaining.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    of {summaryStats.totalMeals.toLocaleString()} total
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full">
                  <FiPackage className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Delivered</p>
                  <p className="text-2xl font-bold text-green-600">
                    {summaryStats.mealsDelivered.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {summaryStats.mealsSkipped > 0 &&
                      `${summaryStats.mealsSkipped} skipped`}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-full">
                  <FiTruck className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-4 border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">
                    Expiring Soon
                  </p>
                  <p className="text-2xl font-bold text-orange-600">
                    {summaryStats.aboutToExpire}
                  </p>
                  <p className="text-xs text-gray-500">≤5 meals remaining</p>
                </div>
                <div className="p-3 bg-orange-100 rounded-full">
                  <FiCalendar className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Status Overview */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Status Overview
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(summaryStats.statusCounts).map(
                ([status, count]) => (
                  <div key={status} className="text-center">
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        status === "active"
                          ? "bg-green-100 text-green-800"
                          : status === "paused"
                          ? "bg-yellow-100 text-yellow-800"
                          : status === "cancelled"
                          ? "bg-red-100 text-red-800"
                          : status === "expired"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      <span className="capitalize">{status}</span>
                      <span className="ml-2 bg-white bg-opacity-60 rounded-full px-2 py-1 text-xs">
                        {count}
                      </span>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <FiSearch
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Search by user name, email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
              <button
                onClick={() => {
                  setSearch("");
                  setStatusFilter("all");
                  setCurrentPage(1);
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Subscriptions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {subscriptions.map((subscription) => (
              <SubscriptionCard
                key={subscription._id}
                subscription={subscription}
                onStatusUpdate={handleStatusUpdate}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between bg-white px-6 py-3 rounded-lg shadow-md">
            <div className="text-sm text-gray-700">
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                <FiChevronLeft size={16} className="mr-1" />
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Next
                <FiChevronRight size={16} className="ml-1" />
              </button>
            </div>
          </div>
        </>
      ) : (
        /* Meal Plans View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mealPlans.map((mealPlan) => (
            <MealPlanCard key={mealPlan._id} mealPlan={mealPlan} />
          ))}
        </div>
      )}
    </div>
  );
};

export default SubscriptionsManagement;
