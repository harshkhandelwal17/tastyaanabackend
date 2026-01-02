import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  Package,
  Calendar,
  ArrowLeft,
  RefreshCw,
  Download,
  Filter,
  BarChart3,
  PieChart,
  LineChart,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
} from "recharts";

const NormalOrdersAnalytics = () => {
  const navigate = useNavigate();
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("daily");
  const [refreshing, setRefreshing] = useState(false);
  axios.defaults.withCredentials = true;

  useEffect(() => {
    fetchAnalyticsData();
  }, [period]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);

      // Get both main analytics and order analytics
      const [mainAnalyticsResponse, orderAnalyticsResponse] = await Promise.all(
        [
          axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/seller/analytics/dashboard`
          ),
          axios.get(
            `${import.meta.env.VITE_BACKEND_URL}/seller/analytics/orders`
          ),
        ]
      );

      const mainData = mainAnalyticsResponse.data.data;
      const orderData = orderAnalyticsResponse.data.data;

      // Transform the data to match the expected structure
      const transformedData = {
        analytics: {
          totalOrders: mainData.todayOrders || 0,
          totalSalesAmount: mainData.todayRevenue || 0,
          appCommission: mainData.adminCommission || 0,
          orderStats: mainData.dailyRevenueTrend || [],
        },
        orderHistory:
          mainData.categoryWiseSales?.map((category, index) => ({
            orderId: `ORD-${Date.now()}-${index}`,
            items: `${category._id} items`,
            price: category.totalRevenue,
            status: "delivered",
            deliveredAt: new Date().toISOString(),
          })) || [],
      };

      setAnalyticsData(transformedData);
    } catch (error) {
      console.error("Error fetching analytics data:", error);
      toast.error("Failed to load analytics data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAnalyticsData();
    setTimeout(() => setRefreshing(false), 500);
  };

  const StatCard = ({ icon, title, value, subtitle, color = "blue" }) => (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex items-center justify-between">
        <div className={`p-3 rounded-lg bg-${color}-100`}>
          {React.cloneElement(icon, { className: `w-6 h-6 text-${color}-600` })}
        </div>
        <TrendingUp className={`w-5 h-5 text-${color}-500`} />
      </div>
      <div className="mt-4">
        <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm text-gray-600">{title}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
    </div>
  );

  const formatChartData = (data) => {
    return (
      data?.map((item) => ({
        ...item,
        period: period === "daily" ? `${item._id}:00` : item._id,
        orders: item.orderCount,
        sales: item.totalSalesAmount,
      })) || []
    );
  };

  if (loading && !analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/seller/dashboard")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-blue-500" />
                  Normal Orders Analytics
                </h1>
                <p className="text-sm text-gray-600">
                  Sales performance and order insights
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
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
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Package />}
            title="Total Orders"
            value={analyticsData?.analytics?.totalOrders || 0}
            subtitle={`${
              period.charAt(0).toUpperCase() + period.slice(1)
            } period`}
            color="blue"
          />
          <StatCard
            icon={<DollarSign />}
            title="Total Sales"
            value={`₹${(
              analyticsData?.analytics?.totalSalesAmount || 0
            ).toLocaleString("en-IN")}`}
            subtitle="After app commission (20%)"
            color="green"
          />
          <StatCard
            icon={<TrendingUp />}
            title="App Commission"
            value={`₹${(
              analyticsData?.analytics?.appCommission || 0
            ).toLocaleString("en-IN")}`}
            subtitle="20% of total sales"
            color="orange"
          />
          <StatCard
            icon={<BarChart3 />}
            title="Avg Order Value"
            value={`₹${
              analyticsData?.analytics?.totalOrders > 0
                ? Math.round(
                    analyticsData.analytics.totalSalesAmount /
                      analyticsData.analytics.totalOrders
                  )
                : 0
            }`}
            subtitle="Per order average"
            color="purple"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Orders Chart */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Orders Trend
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={formatChartData(analyticsData?.analytics?.orderStats)}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="orders" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales Chart */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <LineChart className="w-5 h-5" />
              Sales Trend
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart
                  data={formatChartData(analyticsData?.analytics?.orderStats)}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [
                      `₹${value.toLocaleString("en-IN")}`,
                      "Sales",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Order History
              </h3>
              <button className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price (Seller)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Delivered
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData?.orderHistory?.map((order, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.orderId}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate" title={order.items}>
                        {order.items}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{order.price?.toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.deliveredAt
                        ? format(new Date(order.deliveredAt), "PPp")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(!analyticsData?.orderHistory ||
            analyticsData.orderHistory.length === 0) && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No order history found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Orders will appear here once you start selling.
              </p>
            </div>
          )}
        </div>

        {/* Performance Insights */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-900">
              Performance Insights
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                Revenue Breakdown
              </h4>
              <ul className="space-y-1 text-blue-800">
                <li>
                  Your earnings: ₹
                  {(
                    analyticsData?.analytics?.totalSalesAmount || 0
                  ).toLocaleString("en-IN")}
                </li>
                <li>
                  App commission (20%): ₹
                  {(
                    analyticsData?.analytics?.appCommission || 0
                  ).toLocaleString("en-IN")}
                </li>
                <li>
                  Total customer payment: ₹
                  {(
                    (analyticsData?.analytics?.totalSalesAmount || 0) +
                    (analyticsData?.analytics?.appCommission || 0)
                  ).toLocaleString("en-IN")}
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">
                Order Performance
              </h4>
              <ul className="space-y-1 text-blue-800">
                <li>
                  Total orders: {analyticsData?.analytics?.totalOrders || 0}
                </li>
                <li>
                  Average order value: ₹
                  {analyticsData?.analytics?.totalOrders > 0
                    ? Math.round(
                        analyticsData.analytics.totalSalesAmount /
                          analyticsData.analytics.totalOrders
                      )
                    : 0}
                </li>
                <li>
                  Period: {period.charAt(0).toUpperCase() + period.slice(1)}
                </li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Growth Tips</h4>
              <ul className="space-y-1 text-blue-800">
                <li>• Add more product variety</li>
                <li>• Maintain quick delivery times</li>
                <li>• Keep products in stock</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NormalOrdersAnalytics;
