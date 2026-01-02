import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  DollarSign,
  Package,
  Eye,
  Edit,
  ChevronDown,
  ChevronUp,
  Utensils,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  RefreshCw,
  Download,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Phone,
  Mail,
  User,
  Hash,
  CreditCard,
  Receipt,
  MapPin,
  Truck,
  Circle,
  CircleCheck,
  CircleX,
  CirclePause,
  CirclePlay,
  SkipForward,
  Info,
  Plus,
  Minus,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  useGetSellerSubscriptionQuery,
  useUpdateSellerSubscriptionMutation,
} from "../../features/api/sellerApi";

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusConfig = {
    active: {
      color: "bg-green-100 text-green-800 border-green-200",
      icon: CheckCircle,
    },
    paused: {
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      icon: Pause,
    },
    cancelled: {
      color: "bg-red-100 text-red-800 border-red-200",
      icon: XCircle,
    },
    completed: {
      color: "bg-blue-100 text-blue-800 border-blue-200",
      icon: CheckCircle,
    },
    pending: {
      color: "bg-gray-100 text-gray-800 border-gray-200",
      icon: Clock,
    },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.color}`}
    >
      <Icon className="w-4 h-4 mr-2" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, subtitle, icon: Icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

// Meal Status Icon Component
const MealStatusIcon = ({ status }) => {
  const statusConfig = {
    delivered: {
      icon: CircleCheck,
      color: "text-green-500",
      bg: "bg-green-100",
    },
    pending: { icon: Circle, color: "text-gray-400", bg: "bg-gray-100" },
    preparing: { icon: Info, color: "text-blue-500", bg: "bg-blue-100" },
    out_for_delivery: {
      icon: Truck,
      color: "text-orange-500",
      bg: "bg-orange-100",
    },
    skipped: {
      icon: SkipForward,
      color: "text-yellow-500",
      bg: "bg-yellow-100",
    },
    cancelled: { icon: CircleX, color: "text-red-500", bg: "bg-red-100" },
  };

  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;

  return (
    <div
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${config.bg}`}
    >
      <Icon className={`w-4 h-4 ${config.color}`} />
    </div>
  );
};

const SubscriptionDetails = () => {
  const { subscriptionId } = useParams();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState(
    new Set(["overview"])
  );

  const {
    data: subscriptionData,
    isLoading,
    isError,
    refetch,
  } = useGetSellerSubscriptionQuery(subscriptionId);

  const [updateSellerSubscription] = useUpdateSellerSubscriptionMutation();

  const subscription = subscriptionData?.data;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  const toggleSection = (section) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handlePauseSubscription = async () => {
    if (window.confirm("Are you sure you want to pause this subscription?")) {
      try {
        await updateSellerSubscription({
          subscriptionId,
          status: "paused",
          pauseUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }).unwrap();
        toast.success("Subscription paused successfully");
        refetch();
      } catch (error) {
        console.error("Error pausing subscription:", error);
        toast.error(error.data?.message || "Failed to pause subscription");
      }
    }
  };

  const handleResumeSubscription = async () => {
    try {
      await updateSellerSubscription({
        subscriptionId,
        status: "active",
      }).unwrap();
      toast.success("Subscription resumed successfully");
      refetch();
    } catch (error) {
      console.error("Error resuming subscription:", error);
      toast.error(error.data?.message || "Failed to resume subscription");
    }
  };

  const handleCancelSubscription = async () => {
    if (
      window.confirm(
        "Are you sure you want to cancel this subscription? This action cannot be undone."
      )
    ) {
      try {
        await updateSellerSubscription({
          subscriptionId,
          status: "cancelled",
          reason: "Cancelled by seller",
        });
        toast.success("Subscription cancelled successfully");
        refetch();
      } catch (error) {
        console.error("Error cancelling subscription:", error);
        toast.error("Failed to cancel subscription");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (isError || !subscription) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Subscription Not Found
          </h3>
          <p className="text-gray-600 mb-4">
            The subscription you're looking for doesn't exist.
          </p>
          <button
            onClick={() => navigate("/seller/subscriptions")}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Subscriptions
          </button>
        </div>
      </div>
    );
  }

  const mealProgress = {
    total: subscription.mealCounts?.totalMeals || 0,
    delivered: subscription.mealCounts?.mealsDelivered || 0,
    remaining: subscription.mealCounts?.mealsRemaining || 0,
    skipped: subscription.mealCounts?.mealsSkipped || 0,
    progress:
      subscription.mealCounts?.totalMeals > 0
        ? (subscription.mealCounts.mealsDelivered /
            subscription.mealCounts.totalMeals) *
          100
        : 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate("/seller/subscriptions")}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    Subscription Details
                  </h1>
                  <p className="text-gray-600">
                    ID: {subscription.subscriptionId}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <StatusBadge status={subscription.status} />
                <button
                  onClick={refetch}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() =>
                  navigate(`/seller/subscriptions/${subscriptionId}/edit`)
                }
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Subscription
              </button>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                <Download className="w-4 h-4 mr-2" />
                Export Details
              </button>
            </div>
            <div className="flex items-center space-x-2">
              {subscription.status === "active" && (
                <button
                  onClick={handlePauseSubscription}
                  className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </button>
              )}
              {subscription.status === "paused" && (
                <button
                  onClick={handleResumeSubscription}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </button>
              )}
              {subscription.status !== "cancelled" && (
                <button
                  onClick={handleCancelSubscription}
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Customer & Plan Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Customer & Plan Information
                </h2>
                <button
                  onClick={() => toggleSection("customer")}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  {expandedSections.has("customer") ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>

              {expandedSections.has("customer") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                      Customer Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {subscription.user?.name || "N/A"}
                          </p>
                          <p className="text-sm text-gray-500">Customer Name</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {subscription.user?.phone || "N/A"}
                          </p>
                          <p className="text-sm text-gray-500">Phone Number</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {subscription.user?.email || "N/A"}
                          </p>
                          <p className="text-sm text-gray-500">Email Address</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-3">
                      Plan Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <Package className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {subscription.mealPlan?.name || "N/A"}
                          </p>
                          <p className="text-sm text-gray-500">Meal Plan</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {subscription.planType}
                          </p>
                          <p className="text-sm text-gray-500">Plan Type</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Clock className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {subscription.duration} days
                          </p>
                          <p className="text-sm text-gray-500">Duration</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Meal Progress */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Meal Progress
                </h2>
                <button
                  onClick={() => toggleSection("progress")}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  {expandedSections.has("progress") ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
              </div>

              {expandedSections.has("progress") && (
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">
                        Overall Progress
                      </span>
                      <span className="text-sm text-gray-500">
                        {mealProgress.delivered}/{mealProgress.total} meals
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${mealProgress.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {mealProgress.delivered}
                      </p>
                      <p className="text-sm text-gray-500">Delivered</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {mealProgress.remaining}
                      </p>
                      <p className="text-sm text-gray-500">Remaining</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">
                        {mealProgress.skipped}
                      </p>
                      <p className="text-sm text-gray-500">Skipped</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Customizations History */}
            {subscription.mealCustomizations &&
              subscription.mealCustomizations.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                      Recent Customizations
                    </h2>
                    <button
                      onClick={() => toggleSection("customizations")}
                      className="p-2 hover:bg-gray-100 rounded-lg"
                    >
                      {expandedSections.has("customizations") ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {expandedSections.has("customizations") && (
                    <div className="space-y-4">
                      {subscription.mealCustomizations
                        .slice(0, 5)
                        .map((custom, index) => (
                          <div
                            key={index}
                            className="border border-gray-200 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-3">
                                <MealStatusIcon status={custom.status} />
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {formatDate(custom.date)}
                                  </p>
                                  <p className="text-sm text-gray-500 capitalize">
                                    {custom.shift} shift
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-gray-900">
                                  {formatCurrency(custom.extraCost)}
                                </p>
                                <p className="text-xs text-gray-500">
                                  extra cost
                                </p>
                              </div>
                            </div>

                            {custom.specialInstructions && (
                              <div className="mb-3">
                                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                  <strong>Instructions:</strong>{" "}
                                  {custom.specialInstructions}
                                </p>
                              </div>
                            )}

                            {custom.addons && custom.addons.length > 0 && (
                              <div className="mb-3">
                                <p className="text-sm font-medium text-gray-700 mb-1">
                                  Add-ons:
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {custom.addons.map((addon, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800"
                                    >
                                      {addon.name} (+₹{addon.price})
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Revenue Breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Revenue Breakdown
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    Base Subscription
                  </span>
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(subscription.pricing?.totalAmount || 0)}
                  </span>
                </div>

                {subscription.pricing?.addOnsPrice > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Add-ons</span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(subscription.pricing.addOnsPrice)}
                    </span>
                  </div>
                )}

                {subscription.pricing?.customizationPrice > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Customizations
                    </span>
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(subscription.pricing.customizationPrice)}
                    </span>
                  </div>
                )}

                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">
                      Total Amount
                    </span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(subscription.pricing?.finalAmount || 0)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Add-ons */}
            {subscription.selectedAddOns &&
              subscription.selectedAddOns.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Selected Add-ons
                  </h3>
                  <div className="space-y-3">
                    {subscription.selectedAddOns.map((addon, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Plus className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {addon.name}
                            </p>
                            <p className="text-sm text-gray-500">
                              {addon.description || "Daily add-on"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">
                            {formatCurrency(addon.price)}
                          </p>
                          <p className="text-xs text-gray-500">per meal</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Delivery Settings */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Delivery Settings
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(subscription.deliverySettings?.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Delivery Shift</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {subscription.startShift || "morning"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Delivery Days</p>
                  <p className="font-medium text-gray-900">
                    {subscription.deliverySettings?.deliveryDays?.length || 0}{" "}
                    days per week
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Next Delivery</p>
                  <p className="font-medium text-gray-900">
                    {formatDate(subscription.nextDeliveryDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Subscription Timeline */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Subscription Timeline
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Subscription Created
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(subscription.createdAt)}
                    </p>
                  </div>
                </div>
                {subscription.activatedAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Activated
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(subscription.activatedAt)}
                      </p>
                    </div>
                  </div>
                )}
                {subscription.pausedAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Paused
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(subscription.pausedAt)}
                      </p>
                    </div>
                  </div>
                )}
                {subscription.cancelledAt && (
                  <div className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Cancelled
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(subscription.cancelledAt)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionDetails;
