import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Calendar,
  Clock,
  DollarSign,
  Package,
  Filter,
  Search,
  RefreshCw,
  Eye,
  Edit,
  CheckCircle,
  XCircle,
  Pause,
  Play,
  User,
  Phone,
  Mail,
  MapPin,
  Utensils,
  Star,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { toast } from "react-hot-toast";
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
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}
    >
      <Icon className="w-3 h-3 mr-1" />
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

// Subscription Card Component
const SubscriptionCard = ({ subscription }) => {
  const navigate = useNavigate();

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("hi-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("hi-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount || 0);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
      {/* Card Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {subscription.subscriptionId ||
                  "SUB-" + subscription.id?.slice(-8)}
              </h3>
              <p className="text-sm text-gray-500">
                {subscription.mealPlan || "Meal Plan"}
              </p>
            </div>
          </div>
          <StatusBadge status={subscription.status || "active"} />
        </div>
      </div>

      {/* Customer Information */}
      <div className="p-6">
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Customer Details
          </h4>
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <User className="w-4 h-4 mr-2 text-gray-400" />
              <span>{subscription.customerName || "Customer Name"}</span>
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <Phone className="w-4 h-4 mr-2 text-gray-400" />
              <span>{subscription.customerPhone || "Phone Number"}</span>
            </div>
            {subscription.customerEmail && (
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                <span>{subscription.customerEmail}</span>
              </div>
            )}
          </div>
        </div>

        {/* Subscription Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-blue-600">
              {subscription.totalMeals || 0}
            </div>
            <div className="text-xs text-blue-600">Total Meals</div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-600">
              {subscription.delivered || 0}
            </div>
            <div className="text-xs text-green-600">Delivered</div>
          </div>
        </div>

        {/* Meal Progress Bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-500">
              {subscription.delivered || 0}/{subscription.totalMeals || 0}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  subscription.totalMeals > 0
                    ? ((subscription.delivered || 0) /
                        subscription.totalMeals) *
                      100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Pricing Info */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Plan Type:</span>
            <span className="font-medium text-gray-900">
              {subscription.planType || "N/A"}
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-sm text-gray-600">Base Price:</span>
            <span className="font-semibold text-green-600">
              {formatCurrency(subscription.basePrice || 0)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            onClick={() =>
              navigate(
                `/seller/subscriptions/${
                  subscription.id || subscription.subscriptionId
                }`
              )
            }
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </button>

          <div className="flex items-center space-x-2">
            <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-50 rounded-lg transition-colors">
              <Edit className="w-4 h-4 mr-1" />
              Edit
            </button>

            {subscription.status === "active" ? (
              <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 rounded-lg transition-colors">
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </button>
            ) : subscription.status === "paused" ? (
              <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors">
                <Play className="w-4 h-4 mr-1" />
                Resume
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

const Subscriptions = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("cards");

  // Fetch subscription data
  const {
    data: subscriptionData,
    isLoading,
    isError,
    refetch,
  } = useGetSubscriptionAnalyticsQuery();

  // Transform the data for display
  const subscriptions =
    subscriptionData?.data?.tiffinHistory?.reduce((acc, order) => {
      const existingSubscription = acc.find(
        (sub) => sub.subscriptionId === order.subscriptionId
      );

      if (existingSubscription) {
        // Update existing subscription stats
        existingSubscription.totalMeals += 1;
        if (order.status === "delivered") {
          existingSubscription.delivered += 1;
        }
      } else {
        // Create new subscription entry
        acc.push({
          id: order.subscriptionId,
          subscriptionId: order.subscriptionId,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          mealPlan: order.mealPlan,
          status: "active", // Default status
          totalMeals: 1,
          delivered: order.status === "delivered" ? 1 : 0,
          planType: "Daily",
          basePrice: order.basePrice,
        });
      }

      return acc;
    }, []) || [];

  // Filter subscriptions
  const filteredSubscriptions = subscriptions.filter((subscription) => {
    const matchesSearch =
      !searchTerm ||
      subscription.customerName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      subscription.subscriptionId
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || subscription.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Data
          </h3>
          <p className="text-gray-600 mb-4">
            Failed to load subscriptions. Please try again.
          </p>
          <button
            onClick={refetch}
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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => navigate("/seller/dashboard")}
                  className="inline-flex items-center text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft className="w-5 h-5 mr-1" />
                  Back
                </button>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Subscriptions
                  </h1>
                  <p className="mt-2 text-gray-600">
                    All subscription holders और उनकी details
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
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
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by customer name or subscription ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-80"
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

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-700">
                {filteredSubscriptions.length} subscriptions found
              </span>
            </div>
          </div>
        </div>

        {/* Subscription Cards Grid */}
        {filteredSubscriptions.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No subscriptions found
            </h3>
            <p className="text-gray-500">
              {searchTerm || statusFilter !== "all"
                ? "Try adjusting your search or filters."
                : "No subscriptions available yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredSubscriptions.map((subscription, index) => (
              <SubscriptionCard
                key={subscription.id || index}
                subscription={subscription}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscriptions;
