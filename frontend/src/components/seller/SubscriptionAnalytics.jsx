import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  ArrowLeft,
  RefreshCw,
  Download,
  ChefHat,
  PauseCircle,
  PlayCircle,
  Activity,
  BarChart3,
  History,
  X,
  Clock,
  Package,
  CheckCircle,
  AlertCircle,
  User,
  Phone,
  IndianRupee,
  UtensilsCrossed,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { useSelector } from "react-redux";
const SubscriptionAnalytics = () => {
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [subscriptionList, setSubscriptionList] = useState([]);
  const [tiffinHistory, setTiffinHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  axios.defaults.withCredentials = true;
  useEffect(() => {
    fetchAnalyticsData();
  }, []);
  const { token, isAuthenticated } = useSelector((state) => state.auth);
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Get subscription analytics and subscription list
      const [subscriptionResponse, dailyOrdersResponse] = await Promise.all([
        axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/seller/tiffin/analytics/subscriptions`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        ),
        axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/seller/tiffin/subscriptions`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        ),
      ]);

      const subscriptionData = subscriptionResponse.data.data?.analytics;
      const subscriptions = dailyOrdersResponse.data.data?.subscriptions || [];
      console.log("subscriptions data", subscriptionData);
      setAnalyticsData(subscriptionData);
      setSubscriptionList(subscriptions);
    } catch (error) {
      console.error("Error fetching subscription analytics:", error);
      toast.error("Failed to load subscription analytics");
    } finally {
      setLoading(false);
    }
  };

  const fetchTiffinHistory = async () => {
    try {
      setHistoryLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/seller/tiffin/history`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setTiffinHistory(response.data.data || []);
    } catch (error) {
      console.error("Error fetching tiffin history:", error);
      toast.error("Failed to load tiffin history");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleShowHistory = () => {
    setShowHistoryDialog(true);
    if (tiffinHistory.length === 0) {
      fetchTiffinHistory();
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const StatCard = ({ icon, title, value, subtitle, color = "blue" }) => (
    <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <div className={`p-2 sm:p-3 rounded-lg bg-${color}-100`}>
          {React.cloneElement(icon, {
            className: `w-5 h-5 sm:w-6 sm:h-6 text-${color}-600`,
          })}
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-500 hidden sm:block">
            Tiffin Service
          </div>
        </div>
      </div>
      <div className="mt-3 sm:mt-4">
        <h3 className="text-lg sm:text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-xs sm:text-sm text-gray-600">{title}</p>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1 hidden sm:block">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );

  const SubscriptionCard = ({ subscription }) => {
    const navigate = useNavigate();

    const handleEditClick = (e) => {
      e.stopPropagation();
      navigate(`/subscriptions/${subscription._id}`);
    };

    const getStatusColor = (status) => {
      switch (status?.toLowerCase()) {
        case "active":
          return "text-green-600 bg-green-100";
        case "paused":
          return "text-yellow-600 bg-yellow-100";
        case "expired":
          return "text-red-600 bg-red-100";
        case "cancelled":
          return "text-gray-600 bg-gray-100";
        default:
          return "text-blue-600 bg-blue-100";
      }
    };

    const totalMeals =
      subscription.mealCounts?.totalMeals || subscription.totalMeals || 0;
    const delivered =
      subscription.mealCounts?.mealsDelivered || subscription.delivered || 0;
    const remaining =
      subscription.mealCounts?.mealsRemaining || subscription.remaining || 0;

    return (
      <div className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row items-start justify-between mb-3 gap-2 sm:gap-0">
          <div className="flex-1 min-w-0">
            <div className="text-xs sm:text-sm font-medium text-gray-900 mb-1 truncate">
              {subscription.subscriptionId || subscription._id}
            </div>
            <div className="text-xs sm:text-sm font-medium text-gray-900 mb-1 truncate">
              {subscription.mealPlan.title}
            </div>
            <div className="text-xs text-gray-500">
              {subscription.planType} • {subscription.shift} shift
            </div>
            <div
              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getStatusColor(
                subscription.status
              )}`}
            >
              {subscription.status || "Active"}
              <button
                onClick={handleEditClick}
                className="ml-2 px-2 py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 transition-colors"
                title="Edit Subscription"
              >
                Edit
              </button>
            </div>
          </div>
          <div className="flex flex-col items-center text-center sm:ml-2">
            <ChefHat className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
            <div className="flex flex-col text-center">
              <span className="text-xs text-gray-500">Per tiffin</span>
              <div className="text-xs sm:text-sm font-medium">
                ₹{subscription.pricing.sellerBasePrice}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3">
          <div className="text-center">
            <div className="text-sm sm:text-lg font-bold text-blue-600">
              {totalMeals}
            </div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div className="text-center">
            <div className="text-sm sm:text-lg font-bold text-green-600">
              {delivered}
            </div>
            <div className="text-xs text-gray-500">Delivered</div>
          </div>
          <div className="text-center">
            <div className="text-sm sm:text-lg font-bold text-orange-600">
              {remaining}
            </div>
            <div className="text-xs text-gray-500">Remaining</div>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full"
            style={{
              width: `${totalMeals > 0 ? (delivered / totalMeals) * 100 : 0}%`,
            }}
          ></div>
        </div>
        <div className="text-xs text-gray-500 mt-1 text-center">
          {totalMeals > 0 ? Math.round((delivered / totalMeals) * 100) : 0}%
          Complete
        </div>

        {subscription.deliverySettings && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between gap-1 sm:gap-0">
              <div className="text-xs text-gray-500">
                Started:{" "}
                {new Date(
                  subscription.deliverySettings.startDate
                ).toLocaleDateString()}
              </div>
              {subscription.deliverySettings.endDate && (
                <div className="text-xs text-gray-500">
                  Ends:{" "}
                  {new Date(
                    subscription.deliverySettings.endDate
                  ).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  // History Dialog Component
  const HistoryDialog = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] sm:max-h-[85vh] overflow-hidden">
        <div className="flex items-center justify-between p-3 sm:p-6 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center gap-2">
            <History className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Tiffin Delivery History</span>
            <span className="sm:hidden">History</span>
          </h2>
          <button
            onClick={() => setShowHistoryDialog(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        <div className="p-3 sm:p-6 overflow-y-auto max-h-[70vh] sm:max-h-[60vh]">
          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-orange-600" />
              <span className="ml-2 text-gray-600">Loading history...</span>
            </div>
          ) : tiffinHistory.length > 0 ? (
            <div className="space-y-3 sm:space-y-4">
              {tiffinHistory.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-3 sm:p-4 border border-gray-200"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2 sm:gap-0">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <Package className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="font-medium text-gray-900 text-xs sm:text-sm truncate">
                        {item.subscriptionId || item._id}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full whitespace-nowrap">
                        {item.shift} shift
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === "delivered" ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-orange-600" />
                      )}
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          item.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 text-xs sm:text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <div className="font-medium">
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Plan:</span>
                      <div className="font-medium">
                        {item.planType || "Standard"}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        Base Price:
                      </span>
                      <div className="font-medium text-green-600">
                        ₹{item.basePrice || 0}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3 text-xs sm:text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Prep Time:</span>
                      <div className="font-medium">
                        {item.preparationTime
                          ? new Date(item.preparationTime).toLocaleTimeString()
                          : "Not set"}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Delivered:</span>
                      <div className="font-medium">
                        {item.deliveredAt
                          ? new Date(item.deliveredAt).toLocaleTimeString()
                          : "Pending"}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Driver:
                      </span>
                      <div className="font-medium">
                        {item.driver ? (
                          <div>
                            <div className="text-gray-900 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {item.driver.name}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {item.driver.phone}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items Section */}
                  {item.items && item.items.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="text-xs font-medium text-blue-900 mb-2 flex items-center gap-1">
                        <UtensilsCrossed className="w-3 h-3" />
                        Items:
                      </div>
                      <div className="text-xs text-blue-800">
                        {Array.isArray(item.items) ? (
                          item.items.map((itemDetail, idx) => (
                            <div key={idx} className="mb-1">
                              {typeof itemDetail === "string"
                                ? itemDetail
                                : itemDetail.name || itemDetail}
                            </div>
                          ))
                        ) : (
                          <div>{item.items}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pricing Summary */}
                  {/* {(item.basePrice > 0 || item.totalExtraCost > 0) && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                      <div className="text-xs font-medium text-green-900 mb-2 flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        Pricing Summary:
                      </div>
                      <div className="text-xs text-green-800 space-y-1">
                        <div className="flex justify-between">
                          <span>Base Price:</span>
                          <span>₹{item.basePrice || 0}</span>
                        </div>
                        {item.totalExtraCost > 0 && (
                          <div className="flex justify-between">
                            <span>Extra Cost:</span>
                            <span>₹{item.totalExtraCost}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-medium border-t border-green-300 pt-1">
                          <span>Total Amount:</span>
                          <span>₹{item.totalPaymentAmount || item.basePrice || 0}</span>
                        </div>
                      </div>
                    </div>
                  )} */}

                  {item.isDelayed && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-xs text-red-700">
                        Delayed delivery • Penalty: ₹{item.penaltyAmount || 0}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <History className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No history found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Tiffin delivery history will appear here once orders are
                processed.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 p-3 sm:p-6 border-t border-gray-200">
          <button
            onClick={() => setShowHistoryDialog(false)}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm"
          >
            Close
          </button>
          <button
            onClick={fetchTiffinHistory}
            disabled={historyLoading}
            className="px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50 text-sm"
          >
            <RefreshCw
              className={`w-4 h-4 inline mr-2 ${
                historyLoading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );

  // Prepare data for pie chart
  const pieChartData = [
    {
      name: "Active",
      value: analyticsData?.totalSubscriptions || 0,
      color: "#10b981",
    },
    {
      name: "Paused",
      value: analyticsData?.pausedSubscriptions || 0,
      color: "#f59e0b",
    },
    {
      name: "Expired",
      value: analyticsData?.expiredSubscriptions || 0,
      color: "#ef4444",
    },
  ].filter((item) => item.value > 0);

  if (loading && !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-orange-600" />
          <p className="text-gray-600">Loading subscription analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-2 sm:gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
                  <span className="hidden xs:inline">
                    Subscription Analytics
                  </span>
                  <span className="xs:hidden">Analytics</span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  <span className="hidden sm:inline">
                    Tiffin subscription performance and insights
                  </span>
                  <span className="sm:hidden">
                    Tiffin subscription insights
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={handleShowHistory}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex-1 sm:flex-none justify-center"
              >
                <History className="w-4 h-4" />
                <span className="hidden xs:inline">History</span>
              </button>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm flex-1 sm:flex-none justify-center"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                <span className="hidden xs:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <StatCard
            icon={<Users />}
            title="Total Subscriptions"
            value={analyticsData?.totalSubscriptions || 0}
            subtitle="All time subscriptions"
            color="blue"
          />
          <StatCard
            icon={<PlayCircle />}
            title="Active Subscriptions"
            value={analyticsData?.activeSubscriptions || 0}
            subtitle="Currently active"
            color="green"
          />
          <StatCard
            icon={<PauseCircle />}
            title="Paused Subscriptions"
            value={analyticsData?.pausedSubscriptions || 0}
            subtitle="Temporarily paused"
            color="yellow"
          />
          <StatCard
            icon={<IndianRupee />}
            title="Total Revenue"
            value={(
              (analyticsData?.totalRevenue || 0) +
              (analyticsData?.appCommission || 0)
            ).toLocaleString("en-IN")}
            subtitle=""
            color="purple"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Subscription Status Distribution */}

          {/* Revenue Breakdown */}

          <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
              Revenue Breakdown
            </h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg border-2 border-gray-200 mb-3 sm:mb-4 gap-2 sm:gap-0">
              <div>
                <div className="text-xs sm:text-sm font-medium text-gray-900">
                  Total Customer Payment
                </div>
                <div className="text-xs text-gray-600">
                  Complete subscription value
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold text-gray-900">
                ₹
                {(
                  (analyticsData?.totalRevenue || 0) +
                  (analyticsData?.appCommission || 0)
                ).toLocaleString("en-IN")}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-orange-50 rounded-lg mb-3 sm:mb-4 gap-2 sm:gap-0">
              <div className="flex-1">
                <div className="text-xs sm:text-sm font-medium text-orange-900">
                  App Commission
                </div>
                <div className="text-xs text-orange-600">
                  {analyticsData?.commissionRate || 20}% of subscription amount
                  (
                  {analyticsData?.totalSubscriptions < 10
                    ? "<10 subscriptions"
                    : "≥10 subscriptions"}
                  )
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold text-orange-600">
                ₹{(analyticsData?.appCommission || 0).toLocaleString("en-IN")}
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-green-50 rounded-lg gap-2 sm:gap-0">
                <div>
                  <div className="text-xs sm:text-sm font-medium text-green-900">
                    Your Total Earnings
                  </div>
                  <div className="text-xs text-green-600">
                    80% of subscription amount (what you should get)
                  </div>
                </div>
                <div className="text-lg sm:text-xl font-bold text-green-600">
                  ₹{(analyticsData?.totalRevenue || 0).toLocaleString("en-IN")}
                </div>
              </div>
            </div>
          </div>
          <div className=" bg-white rounded-lg shadow-sm border p-3 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
              Amount Collected Breakdown
            </h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-blue-50 rounded-lg mb-3 sm:mb-4 gap-2 sm:gap-0">
              <div>
                <div className="text-xs sm:text-sm font-medium text-blue-900">
                  Advance Payment
                </div>
                <div className="text-xs text-blue-600">
                  Amount app paid in advance to seller
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold text-blue-600">
                ₹{(analyticsData?.advancePayment || 0).toLocaleString("en-IN")}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-purple-50 rounded-lg mb-3 sm:mb-4 gap-2 sm:gap-0">
              <div>
                <div className="text-xs sm:text-sm font-medium text-purple-900">
                  Received Amount
                </div>
                <div className="text-xs text-purple-600">
                  Amount app has actually paid to you
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold text-purple-600">
                ₹
                {(analyticsData?.totalReceivedPayment || 0).toLocaleString(
                  "en-IN"
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 sm:p-4 bg-amber-50 rounded-lg border-2 border-amber-200 gap-2 sm:gap-0">
              <div className="flex-1">
                <div className="text-xs sm:text-sm font-medium text-amber-900">
                  Remaining Amount
                </div>
                <div className="text-xs text-amber-600">
                  Total - (Advance + Received)
                </div>
              </div>
              <div className="text-lg sm:text-xl font-bold text-amber-600">
                ₹
                {(
                  (analyticsData?.totalRevenue || 0) -
                  ((analyticsData?.advancePayment || 0) +
                    (analyticsData?.receivedPayment || 0))
                ).toLocaleString("en-IN")}
              </div>
            </div>
          </div>
        </div>

        {/* Subscription List */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-3 sm:p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
                Subscription Details
              </h3>
            </div>
          </div>

          <div className="p-3 sm:p-6">
            {subscriptionList && subscriptionList.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {subscriptionList.map((subscription, index) => (
                  <SubscriptionCard
                    key={subscription._id || index}
                    subscription={subscription}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <ChefHat className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No subscriptions found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Tiffin subscriptions will appear here once customers subscribe
                  to your meal plans.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Performance Insights */}
        <div className="mt-6 sm:mt-8 bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-6">
          <div className="flex items-center gap-2 mb-3 sm:mb-4">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
            <h3 className="text-base sm:text-lg font-semibold text-orange-900">
              Subscription Insights
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
            <div className="bg-white rounded-lg p-3 sm:p-4">
              <h4 className="font-medium text-orange-900 mb-2">
                Revenue Model
              </h4>
              <ul className="space-y-1 text-orange-800">
                <li>• Monthly recurring revenue</li>
                <li>• 20% app commission on all subscriptions</li>
                <li>• Direct payment to your account</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4">
              <h4 className="font-medium text-orange-900 mb-2">
                Subscription Health
              </h4>
              <ul className="space-y-1 text-orange-800">
                <li>
                  Active: {analyticsData?.activeSubscriptions || 0}{" "}
                  subscriptions
                </li>
                <li>
                  Paused: {analyticsData?.pausedSubscriptions || 0}{" "}
                  subscriptions
                </li>
                <li>
                  Total Revenue: ₹
                  {(analyticsData?.totalRevenue || 0).toLocaleString("en-IN")}
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
              <h4 className="font-medium text-orange-900 mb-2">Growth Tips</h4>
              <ul className="space-y-1 text-orange-800">
                <li>• Maintain food quality consistently</li>
                <li>• Offer flexible meal plans</li>
                <li>• Respond to customer feedback quickly</li>
              </ul>
            </div>
          </div>
        </div>

        {/* History Dialog */}
        {showHistoryDialog && <HistoryDialog />}
      </div>
    </div>
  );
};

export default SubscriptionAnalytics;
