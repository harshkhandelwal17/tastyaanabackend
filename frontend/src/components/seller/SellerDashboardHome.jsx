import React, { useState, useEffect } from "react";
import {
  Clock,
  Package,
  AlertTriangle,
  TrendingUp,
  Users,
  ChefHat,
  Calendar,
  RefreshCw,
  ExternalLink,
  Bell,
  DollarSign,
  Truck,
  Utensils,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  useGetSellerDashboardQuery,
  useGetMainSellerDashboardQuery,
} from "../../redux/Slices/sellerTiffinApi";

const SellerDashboardHome = () => {
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // Use Redux RTK Query for both tiffin and main dashboard data
  const {
    data: tiffinData,
    isLoading: tiffinLoading,
    error: tiffinError,
    refetch: refetchTiffin,
  } = useGetSellerDashboardQuery();

  const {
    data: mainDashboardData,
    isLoading: mainLoading,
    error: mainError,
    refetch: refetchMain,
  } = useGetMainSellerDashboardQuery();

  // Combine loading states
  const loading = tiffinLoading || mainLoading;
  const error = tiffinError || mainError;

  useEffect(() => {
    // Update time every second
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refetchTiffin(), refetchMain()]);
    } catch (error) {
      console.error("Error refreshing dashboard:", error);
      toast.error("Failed to refresh dashboard");
    }
    setTimeout(() => setRefreshing(false), 500);
  };

  const StatCard = ({
    icon,
    title,
    value,
    link,
    color = "blue",
    subtitle = "",
  }) => (
    <div className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-lg bg-${color}-100`}>
          {React.cloneElement(icon, { className: `w-6 h-6 text-${color}-600` })}
        </div>
        {link && (
          <Link
            to={link}
            className={`text-sm font-medium text-${color}-600 hover:text-${color}-800 flex items-center gap-1`}
          >
            View <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm text-gray-600">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  const TiffinShiftCard = ({ shift, count, isCurrentShift }) => (
    <Link
      to={`/seller/tiffin/today/${shift}`}
      className={`block bg-white rounded-lg shadow-sm border p-4 hover:shadow-md transition-all ${
        isCurrentShift ? "ring-2 ring-orange-200 bg-orange-50" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h4
            className={`font-semibold ${
              isCurrentShift ? "text-orange-900" : "text-gray-900"
            }`}
          >
            {shift.charAt(0).toUpperCase() + shift.slice(1)} Tiffins
          </h4>
          <p
            className={`text-sm ${
              isCurrentShift ? "text-orange-600" : "text-gray-600"
            }`}
          >
            {isCurrentShift && <span className="mr-2">🔥 Current Shift</span>}
            {count} orders
          </p>
        </div>
        <div
          className={`p-2 rounded-lg ${
            isCurrentShift ? "bg-orange-200" : "bg-gray-100"
          }`}
        >
          <ChefHat
            className={`w-5 h-5 ${
              isCurrentShift ? "text-orange-600" : "text-gray-600"
            }`}
          />
        </div>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Seller Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                {currentDateTime.toLocaleDateString("en-IN", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                {" • "}
                {currentDateTime.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Good{" "}
            {new Date().getHours() < 12
              ? "morning"
              : new Date().getHours() < 17
              ? "afternoon"
              : "evening"}
            !
          </h2>
          <p className="text-gray-600">
            Here's your business overview for today
          </p>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<Package />}
            title="Today Orders"
            value={mainDashboardData?.data?.today?.orders || 0}
            subtitle={`Revenue: ₹${
              mainDashboardData?.data?.today?.revenue || 0
            }`}
            link="/seller/orders"
            color="blue"
          />

          <StatCard
            icon={<ChefHat />}
            title="Total Tiffins"
            value={tiffinData?.tiffinCounts?.total || 0}
            subtitle="Morning + Evening"
            color="green"
          />

          <StatCard
            icon={<DollarSign />}
            title="Today Revenue"
            value={`₹${mainDashboardData?.data?.today?.revenue || 0}`}
            subtitle={`Net: ₹${
              mainDashboardData?.data?.today?.netRevenue || 0
            }`}
            link="/seller/analytics"
            color="green"
          />

          <StatCard
            icon={<TrendingUp />}
            title="Live Orders"
            value={mainDashboardData?.data?.liveOrders?.count || 0}
            subtitle="In progress"
            link="/seller/orders"
            color="purple"
          />
        </div>

        {/* Tiffin Management Section */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ChefHat className="w-5 h-5" />
                Today's Tiffin Management
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                Current:{" "}
                {tiffinData?.currentShift === "morning"
                  ? "Morning"
                  : "Evening"}{" "}
                Shift
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TiffinShiftCard
                shift="morning"
                count={tiffinData?.tiffinCounts?.morning || 0}
                isCurrentShift={tiffinData?.currentShift === "morning"}
              />
              <TiffinShiftCard
                shift="evening"
                count={tiffinData?.tiffinCounts?.evening || 0}
                isCurrentShift={tiffinData?.currentShift === "evening"}
              />
            </div>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Penalty/Flag Section */}
          <Link
            to="/seller/penalties"
            className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">
                Penalty/Flag Section
              </h4>
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-600">
              {tiffinData?.penalties?.delayedOrders || 0}
            </p>
            <p className="text-sm text-gray-600">Delayed orders</p>
            <p className="text-xs text-red-500 mt-1">
              Total penalty: ₹{tiffinData?.penalties?.totalPenaltyAmount || 0}
            </p>
          </Link>

          {/* Products Management */}
          <Link
            to="/seller/products"
            className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Products</h4>
              <Package className="w-5 h-5 text-blue-500" />
            </div>
            <p className="text-sm text-gray-600">Manage your products</p>
            <p className="text-xs text-blue-500 mt-2">
              Add, Edit, View, Update
            </p>
          </Link>

          {/* Analytics */}
          <Link
            to="/seller/analytics"
            className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Analytics</h4>
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <p className="text-sm text-gray-600">
              Order & Subscription Analytics
            </p>
            <p className="text-xs text-green-500 mt-2">
              Daily, Weekly, Monthly
            </p>
          </Link>

          {/* Meal Edit Management */}
          <Link
            to="/seller/meal-edit"
            className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Meal Management</h4>
              <Utensils className="w-5 h-5 text-orange-500" />
            </div>
            <p className="text-sm text-gray-600">
              Manage meal plans & subscriptions
            </p>
            <p className="text-xs text-orange-500 mt-2">
              Edit meals, Tier management, No meal today
            </p>
          </Link>

          {/* Daily Orders */}
          <Link
            to="/seller/meal-edit/daily-orders"
            className="bg-white rounded-lg shadow-sm border p-4 sm:p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900">Daily Orders</h4>
              <Truck className="w-5 h-5 text-purple-500" />
            </div>
            <p className="text-sm text-gray-600">
              Track delivery status & meal customizations
            </p>
            <p className="text-xs text-purple-500 mt-2">
              View skipped, customized & standard meals
            </p>
          </Link>
        </div>

        {/* Current Shift Highlight */}
        {tiffinData?.currentShift && (
          <div className="mt-6 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-5 h-5 text-orange-600" />
              <h4 className="font-semibold text-orange-900">
                Current Shift Alert
              </h4>
            </div>
            <p className="text-orange-800">
              You're currently in the <strong>{tiffinData.currentShift}</strong>{" "}
              shift.
              {tiffinData.currentShift === "morning"
                ? " Morning tiffins should be ready for pickup by 8:00 AM."
                : " Evening tiffins should be ready for pickup by 7:00 PM."}
            </p>
            <Link
              to={`/seller/tiffin/today/${tiffinData.currentShift}`}
              className="inline-flex items-center gap-1 mt-2 text-orange-700 hover:text-orange-900 font-medium"
            >
              View {tiffinData.currentShift} tiffins{" "}
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Real Data Debug Info */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">
              🔍 Debug Info (Development Only)
            </h4>
            <div className="text-sm text-blue-800">
              <p>
                <strong>Main Dashboard Data:</strong>{" "}
                {mainDashboardData ? "✅ Loaded" : "❌ Not loaded"}
              </p>
              {mainDashboardData?.data && (
                <>
                  <p>
                    <strong>Today Orders:</strong>{" "}
                    {mainDashboardData.data.today?.orders}
                  </p>
                  <p>
                    <strong>Today Revenue:</strong> ₹
                    {mainDashboardData.data.today?.revenue}
                  </p>
                  <p>
                    <strong>Live Orders:</strong>{" "}
                    {mainDashboardData.data.liveOrders?.count}
                  </p>
                </>
              )}
              <p className="mt-2">
                <strong>Tiffin Data:</strong>{" "}
                {tiffinData ? "✅ Loaded" : "❌ Not loaded"}
              </p>
              {tiffinData && (
                <>
                  <p>
                    <strong>Morning Tiffins:</strong>{" "}
                    {tiffinData.tiffinCounts?.morning || 0}
                  </p>
                  <p>
                    <strong>Evening Tiffins:</strong>{" "}
                    {tiffinData.tiffinCounts?.evening || 0}
                  </p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboardHome;
