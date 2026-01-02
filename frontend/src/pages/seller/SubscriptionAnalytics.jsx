import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  Clock,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Filter,
  Search,
  RefreshCw,
  Download,
  Eye,
  Edit,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Utensils,
  Coffee,
  Moon,
  Sun,
  Star,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  SkipForward,
  Plus,
  Minus,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  Gift,
  Zap,
  Shield,
  Truck,
  MapPin,
  Phone,
  Mail,
  User,
  Hash,
  CreditCard,
  Receipt,
  FileText,
  Settings,
  Bell,
  Heart,
  Share2,
  Copy,
  ExternalLink,
  ArrowRight,
  ArrowLeft,
  Home,
  Grid,
  List,
  SortAsc,
  SortDesc,
} from "lucide-react";
import { toast } from "react-hot-toast";
import {
  useGetSellerSubscriptionsQuery,
  useGetSellerSubscriptionStatsQuery,
  useUpdateSellerSubscriptionMutation,
} from "../../features/api/sellerApi";
import { useGetSubscriptionAnalyticsQuery } from "../../redux/Slices/sellerTiffinApi";

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
      icon: Award,
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
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Stats Card Component
const StatsCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  trend,
  trendValue,
}) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        {trend && (
          <div className="flex items-center mt-2">
            {trend === "up" ? (
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
            )}
            <span
              className={`text-xs font-medium ${
                trend === "up" ? "text-green-600" : "text-red-600"
              }`}
            >
              {trendValue}
            </span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-full ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

// Subscription Card Component
const SubscriptionCard = ({
  subscription,
  onViewDetails,
  onEdit,
  onPause,
  onResume,
  onCancel,
}) => {
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  const getMealProgress = () => {
    const total = subscription.mealCounts?.totalMeals || 0;
    const delivered = subscription.mealCounts?.mealsDelivered || 0;
    const remaining = subscription.mealCounts?.mealsRemaining || 0;
    const progress = total > 0 ? (delivered / total) * 100 : 0;

    return { total, delivered, remaining, progress };
  };

  const mealProgress = getMealProgress();

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Hash className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {subscription.subscriptionId}
              </p>
              <p className="text-sm text-gray-500">
                {subscription.mealPlan?.name || "N/A"}
              </p>
            </div>
          </div>
          <StatusBadge status={subscription.status} />
        </div>
      </div>

      {/* Basic Info */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Customer</p>
            <p className="font-medium text-gray-900">
              {subscription.user?.name || "N/A"}
            </p>
            <p className="text-sm text-gray-500">
              {subscription.user?.phone || subscription.user?.email || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Plan Type</p>
            <p className="font-medium text-gray-900">{subscription.planType}</p>
            <p className="text-sm text-gray-500">
              {subscription.duration} days
            </p>
          </div>
        </div>

        {/* Meal Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Meal Progress</p>
            <p className="text-sm text-gray-500">
              {mealProgress.delivered}/{mealProgress.total}
            </p>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${mealProgress.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Delivered: {mealProgress.delivered}</span>
            <span>Remaining: {mealProgress.remaining}</span>
          </div>
        </div>

        {/* Pricing Info */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total Amount:</span>
            <span className="font-semibold text-gray-900">
              {formatCurrency(subscription.pricing?.finalAmount)}
            </span>
          </div>
          {subscription.pricing?.addOnsPrice > 0 && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-gray-600">Add-ons:</span>
              <span className="text-sm text-gray-700">
                {formatCurrency(subscription.pricing.addOnsPrice)}
              </span>
            </div>
          )}
          {subscription.pricing?.customizationPrice > 0 && (
            <div className="flex items-center justify-between mt-1">
              <span className="text-sm text-gray-600">Customizations:</span>
              <span className="text-sm text-gray-700">
                {formatCurrency(subscription.pricing.customizationPrice)}
              </span>
            </div>
          )}
        </div>

        {/* Expandable Details */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center text-sm text-blue-600 hover:text-blue-700 py-2"
        >
          {expanded ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              Show Less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              Show Details
            </>
          )}
        </button>

        {expanded && (
          <div className="border-t border-gray-100 pt-4 space-y-4">
            {/* Delivery Settings */}
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Delivery Settings
              </h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Start Date</p>
                  <p className="font-medium">
                    {formatDate(subscription.deliverySettings?.startDate)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Shift</p>
                  <p className="font-medium capitalize">
                    {subscription.startShift || "morning"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Delivery Days</p>
                  <p className="font-medium">
                    {subscription.deliverySettings?.deliveryDays?.length || 0}{" "}
                    days
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Next Delivery</p>
                  <p className="font-medium">
                    {formatDate(subscription.nextDeliveryDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* Add-ons */}
            {subscription.selectedAddOns?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Add-ons
                </h4>
                <div className="space-y-2">
                  {subscription.selectedAddOns.map((addon, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-gray-600">{addon.name}</span>
                      <span className="font-medium">
                        {formatCurrency(addon.price)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Customizations */}
            {subscription.mealCustomizations?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">
                  Recent Customizations
                </h4>
                <div className="space-y-2">
                  {subscription.mealCustomizations
                    .slice(0, 3)
                    .map((custom, index) => (
                      <div key={index} className="text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">
                            {formatDate(custom.date)}
                          </span>
                          <span className="font-medium">
                            {formatCurrency(custom.extraCost)}
                          </span>
                        </div>
                        {custom.specialInstructions && (
                          <p className="text-xs text-gray-500 mt-1">
                            {custom.specialInstructions}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="border-t border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              onClick={() => onViewDetails(subscription._id)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4 mr-1" />
              View
            </button>
            <button
              onClick={() => onEdit(subscription._id)}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </button>
          </div>
          <div className="flex space-x-2">
            {subscription.status === "active" && (
              <button
                onClick={() => onPause(subscription._id)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors"
              >
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </button>
            )}
            {subscription.status === "paused" && (
              <button
                onClick={() => onResume(subscription._id)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Play className="w-4 h-4 mr-1" />
                Resume
              </button>
            )}
            {subscription.status !== "cancelled" && (
              <button
                onClick={() => onCancel(subscription._id)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
              >
                <XCircle className="w-4 h-4 mr-1" />
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Analytics Chart Component
const AnalyticsChart = ({ data, title, type = "bar" }) => {
  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">
                  {item.label}
                </span>
                <span className="text-sm text-gray-500">{item.value}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SubscriptionAnalytics = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyPeriod, setHistoryPeriod] = useState("daily");
  const [selectedDateRange, setSelectedDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });

  // RTK Query hooks
  const {
    data: subscriptionsData,
    isLoading: isLoadingSubscriptions,
    isError: isSubscriptionsError,
    refetch: refetchSubscriptions,
  } = useGetSellerSubscriptionsQuery({
    page: 1,
    limit: 100,
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: searchTerm || undefined,
    sortBy,
    sortOrder,
  });

  const {
    data: statsData,
    isLoading: isLoadingStats,
    isError: isStatsError,
    refetch: refetchStats,
  } = useGetSellerSubscriptionStatsQuery();

  const {
    data: subscriptionAnalyticsData,
    isLoading: isLoadingAnalytics,
    isError: isAnalyticsError,
    refetch: refetchAnalytics,
  } = useGetSubscriptionAnalyticsQuery({
    period: historyPeriod,
    startDate: selectedDateRange.from,
    endDate: selectedDateRange.to,
  });

  const [updateSellerSubscription] = useUpdateSellerSubscriptionMutation();

  const subscriptions = subscriptionsData?.subscriptions || [];
  const stats = statsData?.data || {
    total: 0,
    active: 0,
    paused: 0,
    cancelled: 0,
  };

  const loading = isLoadingSubscriptions || isLoadingStats;

  // Calculate analytics data
  const analyticsData = {
    planDistribution: [
      {
        label: "Special Dining Thali",
        value: subscriptions.filter((s) =>
          s.mealPlan?.name?.includes("Special")
        ).length,
      },
      {
        label: "Everyman Thali",
        value: subscriptions.filter((s) =>
          s.mealPlan?.name?.includes("Everyman")
        ).length,
      },
      {
        label: "Other Plans",
        value: subscriptions.filter(
          (s) =>
            !s.mealPlan?.name?.includes("Special") &&
            !s.mealPlan?.name?.includes("Everyman")
        ).length,
      },
    ],
    statusDistribution: [
      { label: "Active", value: stats.active },
      { label: "Paused", value: stats.paused },
      { label: "Cancelled", value: stats.cancelled },
    ],
    mealProgress: [
      {
        label: "Delivered",
        value: subscriptions.reduce(
          (sum, s) => sum + (s.mealCounts?.mealsDelivered || 0),
          0
        ),
      },
      {
        label: "Remaining",
        value: subscriptions.reduce(
          (sum, s) => sum + (s.mealCounts?.mealsRemaining || 0),
          0
        ),
      },
      {
        label: "Skipped",
        value: subscriptions.reduce(
          (sum, s) => sum + (s.mealCounts?.mealsSkipped || 0),
          0
        ),
      },
    ],
  };

  // Calculate revenue metrics
  const revenueMetrics = {
    totalRevenue: subscriptions.reduce(
      (sum, s) => sum + (s.pricing?.finalAmount || 0),
      0
    ),
    addOnsRevenue: subscriptions.reduce(
      (sum, s) => sum + (s.pricing?.addOnsPrice || 0),
      0
    ),
    customizationRevenue: subscriptions.reduce(
      (sum, s) => sum + (s.pricing?.customizationPrice || 0),
      0
    ),
    avgSubscriptionValue:
      subscriptions.length > 0
        ? subscriptions.reduce(
            (sum, s) => sum + (s.pricing?.finalAmount || 0),
            0
          ) / subscriptions.length
        : 0,
  };

  const handleViewDetails = (subscriptionId) => {
    navigate(`/seller/subscriptions/${subscriptionId}`);
  };

  const handleEdit = (subscriptionId) => {
    navigate(`/seller/subscriptions/${subscriptionId}/edit`);
  };

  const handlePauseSubscription = async (subscriptionId) => {
    if (window.confirm("Are you sure you want to pause this subscription?")) {
      try {
        await updateSellerSubscription({
          subscriptionId,
          status: "paused",
          pauseUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        }).unwrap();
        toast.success("Subscription paused successfully");
        refetchSubscriptions();
      } catch (error) {
        console.error("Error pausing subscription:", error);
        toast.error(error.data?.message || "Failed to pause subscription");
      }
    }
  };

  const handleResumeSubscription = async (subscriptionId) => {
    try {
      await updateSellerSubscription({
        subscriptionId,
        status: "active",
      }).unwrap();
      toast.success("Subscription resumed successfully");
      refetchSubscriptions();
    } catch (error) {
      console.error("Error resuming subscription:", error);
      toast.error(error.data?.message || "Failed to resume subscription");
    }
  };

  const handleCancelSubscription = async (subscriptionId) => {
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
        refetchSubscriptions();
      } catch (error) {
        console.error("Error cancelling subscription:", error);
        toast.error("Failed to cancel subscription");
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Loading subscription analytics...
          </p>
        </div>
      </div>
    );
  }

  if (isSubscriptionsError || isStatsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Data
          </h3>
          <p className="text-gray-600 mb-4">
            Failed to load subscription analytics. Please try again.
          </p>
          <button
            onClick={() => {
              refetchSubscriptions();
              refetchStats();
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Subscription Analytics
                </h1>
                <p className="mt-2 text-gray-600">
                  Comprehensive overview of all meal subscriptions and analytics
                </p>
              </div>
              <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                <button
                  onClick={() => setShowHistoryModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white shadow-sm text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Daily Tiffin History
                </button>
                <button
                  onClick={() => {
                    refetchSubscriptions();
                    refetchStats();
                    refetchAnalytics();
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </button>
                <button className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Total Subscriptions"
            value={stats.total}
            subtitle="All time"
            icon={Users}
            color="bg-blue-500"
            trend="up"
            trendValue="+12%"
          />
          <StatsCard
            title="Active Subscriptions"
            value={stats.active}
            subtitle="Currently active"
            icon={Activity}
            color="bg-green-500"
            trend="up"
            trendValue="+8%"
          />
          <StatsCard
            title="Total Revenue"
            value={formatCurrency(revenueMetrics.totalRevenue)}
            subtitle="From subscriptions"
            icon={DollarSign}
            color="bg-purple-500"
            trend="up"
            trendValue="+15%"
          />
          <StatsCard
            title="Avg Subscription Value"
            value={formatCurrency(revenueMetrics.avgSubscriptionValue)}
            subtitle="Per subscription"
            icon={Target}
            color="bg-orange-500"
            trend="up"
            trendValue="+5%"
          />
        </div>

        {/* Revenue Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Revenue Breakdown
              </h3>
              <Gift className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Base Revenue</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(
                    revenueMetrics.totalRevenue -
                      revenueMetrics.addOnsRevenue -
                      revenueMetrics.customizationRevenue
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Add-ons Revenue</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(revenueMetrics.addOnsRevenue)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Customizations</span>
                <span className="font-semibold text-gray-900">
                  {formatCurrency(revenueMetrics.customizationRevenue)}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">
                    Total Revenue
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(revenueMetrics.totalRevenue)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <AnalyticsChart
              data={analyticsData.planDistribution}
              title="Subscription Plan Distribution"
            />
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search subscriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div className="flex items-center space-x-3">
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md ${
                    viewMode === "grid" ? "bg-white shadow-sm" : "text-gray-500"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md ${
                    viewMode === "list" ? "bg-white shadow-sm" : "text-gray-500"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-");
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="pricing.finalAmount-desc">Highest Amount</option>
                <option value="pricing.finalAmount-asc">Lowest Amount</option>
                <option value="mealCounts.mealsDelivered-desc">
                  Most Delivered
                </option>
                <option value="mealCounts.mealsRemaining-asc">
                  Least Remaining
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Subscriptions Grid/List */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Subscriptions ({subscriptions.length})
            </h2>
            <p className="text-sm text-gray-500">
              Showing {subscriptions.length} of {subscriptions.length}{" "}
              subscriptions
            </p>
          </div>

          {subscriptions.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No subscriptions found
              </h3>
              <p className="text-gray-500">
                No subscriptions match your current filters.
              </p>
            </div>
          ) : (
            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  : "space-y-4"
              }
            >
              {subscriptions.map((subscription) => (
                <SubscriptionCard
                  key={subscription._id}
                  subscription={subscription}
                  onViewDetails={handleViewDetails}
                  onEdit={handleEdit}
                  onPause={handlePauseSubscription}
                  onResume={handleResumeSubscription}
                  onCancel={handleCancelSubscription}
                />
              ))}
            </div>
          )}
        </div>

        {/* Additional Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnalyticsChart
            data={analyticsData.statusDistribution}
            title="Subscription Status Distribution"
          />
          <AnalyticsChart
            data={analyticsData.mealProgress}
            title="Meal Delivery Progress"
          />
        </div>

        {/* History Modal */}
        {showHistoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden mx-4">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    Daily Tiffin History
                  </h2>
                  <button
                    onClick={() => setShowHistoryModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>
                <p className="text-gray-600 mt-2">
                  हर दिन कितने tiffin गए हैं और किस customer को deliver हुए हैं
                  - complete tracking
                </p>
              </div>

              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                  <div className="flex items-center space-x-4">
                    <select
                      value={historyPeriod}
                      onChange={(e) => setHistoryPeriod(e.target.value)}
                      className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="daily">Daily View</option>
                      <option value="weekly">Weekly View</option>
                      <option value="monthly">Monthly View</option>
                    </select>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">
                        From:
                      </label>
                      <input
                        type="date"
                        value={selectedDateRange.from}
                        onChange={(e) =>
                          setSelectedDateRange((prev) => ({
                            ...prev,
                            from: e.target.value,
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-sm font-medium text-gray-700">
                        To:
                      </label>
                      <input
                        type="date"
                        value={selectedDateRange.to}
                        onChange={(e) =>
                          setSelectedDateRange((prev) => ({
                            ...prev,
                            to: e.target.value,
                          }))
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <button
                      onClick={refetchAnalytics}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-auto max-h-[60vh]">
                {subscriptionAnalyticsData?.success ? (
                  <HistoryTable
                    data={subscriptionAnalyticsData.data}
                    period={historyPeriod}
                    dateRange={selectedDateRange}
                  />
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Loading History...
                    </h3>
                    <p className="text-gray-500">
                      {isLoadingAnalytics
                        ? "Fetching tiffin history..."
                        : "No history data available."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// History Table Component
const HistoryTable = ({ data, period, dateRange }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Use real data from backend
  const historyData = data?.tiffinHistory || [];

  // Filter data based on date range if provided
  const filteredData = historyData.filter((item) => {
    const itemDate = new Date(item.date);
    const fromDate = new Date(dateRange.from);
    const toDate = new Date(dateRange.to);
    return itemDate >= fromDate && itemDate <= toDate;
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Subscription ID
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Customer
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Meal Plan
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Shift
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Base Price
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Driver
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredData.length === 0 ? (
            <tr>
              <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                No tiffin history found for the selected period
              </td>
            </tr>
          ) : (
            filteredData.map((item, index) => (
              <tr key={item.id || index} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatDate(item.date)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.subscriptionId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {item.customerName}
                  </div>
                  <div className="text-sm text-gray-500">
                    {item.customerPhone}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.mealPlan}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.shift === "morning"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {item.shift === "morning" ? (
                      <Sun className="w-3 h-3 mr-1" />
                    ) : (
                      <Moon className="w-3 h-3 mr-1" />
                    )}
                    {item.shift.charAt(0).toUpperCase() + item.shift.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                  {formatCurrency(item.basePrice)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.driverName ? (
                    <div className="text-sm text-gray-900">
                      {item.driverName}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">Not assigned</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default SubscriptionAnalytics;
