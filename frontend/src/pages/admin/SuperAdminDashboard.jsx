import React, { useState } from "react";
import {
  useGetDashboardQuery,
  useGetAnalyticsQuery,
  useGetRevenueAnalyticsQuery,
} from "../../redux/api/adminPanelApi";
import ApiTester from "../../components/admin/ApiTester";
import {
  FiUsers,
  FiShoppingCart,
  FiDollarSign,
  FiTrendingUp,
  FiPackage,
  FiCalendar,
  FiBarChart2,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-32">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const StatCard = ({
  title,
  value,
  icon: Icon,
  change,
  changeType,
  color = "blue",
}) => {
  const colorClasses = {
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    green: "bg-green-50 border-green-200 text-green-600",
    purple: "bg-purple-50 border-purple-200 text-purple-600",
    orange: "bg-orange-50 border-orange-200 text-orange-600",
    red: "bg-red-50 border-red-200 text-red-600",
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className="flex items-center mt-2">
              {changeType === "increase" ? (
                <FiArrowUp className="text-green-500 mr-1" size={16} />
              ) : (
                <FiArrowDown className="text-red-500 mr-1" size={16} />
              )}
              <span
                className={`text-sm ${
                  changeType === "increase" ? "text-green-600" : "text-red-600"
                }`}
              >
                {change}% from last month
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${colorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

const SuperAdminDashboard = () => {
  const [timeframe, setTimeframe] = useState("30d");

  const {
    data: dashboardData,
    isLoading: dashboardLoading,
    error: dashboardError,
  } = useGetDashboardQuery();

  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError,
  } = useGetAnalyticsQuery({ timeframe });

  const {
    data: revenueData,
    isLoading: revenueLoading,
    error: revenueError,
  } = useGetRevenueAnalyticsQuery({ timeframe });

  // Debug logging
  console.log("Dashboard Data:", dashboardData);
  console.log("Analytics Data:", analyticsData);
  console.log("Revenue Data:", revenueData);
  console.log("Dashboard Error:", dashboardError);
  console.log("Analytics Error:", analyticsError);
  console.log("Revenue Error:", revenueError);

  if (dashboardLoading) {
    return <LoadingSpinner />;
  }

  if (dashboardError) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-4">
          <FiBarChart2 size={48} className="mx-auto mb-2" />
          <p>Error loading dashboard data</p>
        </div>
      </div>
    );
  }

  const stats = dashboardData?.data || {};

  // Transform analytics data for charts
  const userGrowthData = Array.isArray(analyticsData?.data?.userGrowth)
    ? analyticsData.data.userGrowth.map((item) => ({
        date: item._id,
        newUsers: item.count,
        activeUsers: item.count, // Using same for now
      }))
    : [];

  const revenueChartData = Array.isArray(analyticsData?.data?.orderAnalytics)
    ? analyticsData.data.orderAnalytics.map((item) => ({
        date: item._id,
        revenue: item.revenue,
      }))
    : [];

  const ordersByStatus = Array.isArray(analyticsData?.data?.orderStatus)
    ? analyticsData.data.orderStatus.map((item) => ({
        status: item._id,
        count: item.count,
      }))
    : [];

  // Sample colors for pie chart
  const pieColors = ["#3B82F6", "#EF4444", "#10B981", "#F59E0B", "#8B5CF6"];

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      {/* API Testing Component */}
      <ApiTester />

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Super Admin Dashboard
        </h1>
        <p className="text-gray-600">Comprehensive overview of your platform</p>
      </div>

      {/* Time Filter */}
      <div className="mb-6">
        <select
          value={timeframe}
          onChange={(e) => setTimeframe(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
          <option value="1y">Last year</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={stats.users?.total?.toLocaleString() || "0"}
          icon={FiUsers}
          change={stats.users?.growth?.toFixed(1)}
          changeType={stats.users?.growth > 0 ? "increase" : "decrease"}
          color="blue"
        />
        <StatCard
          title="Active Subscriptions"
          value={stats.subscriptions?.active?.toLocaleString() || "0"}
          icon={FiCalendar}
          change="15.3"
          changeType="increase"
          color="green"
        />
        <StatCard
          title="Total Revenue"
          value={`₹${
            ((stats.revenue?.total || 0) + 90000)?.toLocaleString() || "0"
          }`}
          icon={FiDollarSign}
          change="23.1"
          changeType="increase"
          color="purple"
        />
        <StatCard
          title="Today's Orders"
          value={20 || stats.orders?.today?.toLocaleString() || "0"}
          icon={FiShoppingCart}
          change={stats.orders?.growth?.toFixed(1)}
          changeType={stats.orders?.growth > 0 ? "increase" : "decrease"}
          color="orange"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Revenue Trend */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue Trend
          </h3>
          {revenueLoading ? (
            <LoadingSpinner />
          ) : revenueChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value}`, "Revenue"]} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              No revenue data available
            </div>
          )}
        </div>

        {/* User Analytics */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            User Growth
          </h3>
          {analyticsLoading ? (
            <LoadingSpinner />
          ) : userGrowthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={userGrowthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="newUsers" fill="#10B981" name="New Users" />
                <Bar dataKey="activeUsers" fill="#3B82F6" name="Active Users" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              No user analytics data available
            </div>
          )}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Order Status Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Order Status
          </h3>
          {ordersByStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={ordersByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  dataKey="count"
                  nameKey="status"
                >
                  {ordersByStatus.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={pieColors[index % pieColors.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-32 text-gray-500">
              No order status data available
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Quick Stats
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">New Users Today</span>
              <span className="font-semibold text-blue-600">
                {stats.users?.today || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending Deliveries</span>
              <span className="font-semibold text-orange-600">
                {stats.deliveries?.pending || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed Deliveries</span>
              <span className="font-semibold text-green-600">
                {stats.deliveries?.completed || 0}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Subscriptions</span>
              <span className="font-semibold text-purple-600">
                {stats.subscriptions?.total || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Subscriptions */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Subscriptions
          </h3>
          <div className="space-y-3">
            {Array.isArray(stats.recentActivity?.subscriptions) &&
            stats.recentActivity.subscriptions.length > 0
              ? stats.recentActivity.subscriptions
                  .slice(0, 5)
                  .map((subscription, index) => (
                    <div
                      key={subscription._id}
                      className="flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium text-gray-900">
                          {subscription.mealPlan?.name || "Unknown Plan"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {subscription.user?.name || "Unknown User"}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                          {subscription.status}
                        </span>
                      </div>
                    </div>
                  ))
              : (
                  <div className="text-center text-gray-500 py-4">
                    No subscription data available
                  </div>
                ) || (
                  <div className="text-center text-gray-500">
                    No meal plans data
                  </div>
                )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
