import React, { useState, useEffect } from "react";
import {
  Package,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  BarChart3,
  PieChart,
  Calendar,
  Filter,
  Download,
} from "lucide-react";

const OrderAnalytics = () => {
  const [timeframe, setTimeframe] = useState("month");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  // Mock analytics data
  useEffect(() => {
    const mockData = {
      overview: {
        totalOrders: 45678,
        completedOrders: 43234,
        cancelledOrders: 1876,
        pendingOrders: 568,
        totalRevenue: 2345678,
        avgOrderValue: 456,
        fulfillmentRate: 94.6,
      },
      dailyOrders: [
        { date: "2024-12-01", orders: 234, revenue: 123456 },
        { date: "2024-12-02", orders: 267, revenue: 145678 },
        { date: "2024-12-03", orders: 198, revenue: 98765 },
        { date: "2024-12-04", orders: 312, revenue: 167890 },
        { date: "2024-12-05", orders: 289, revenue: 156789 },
        { date: "2024-12-06", orders: 345, revenue: 178901 },
        { date: "2024-12-07", orders: 276, revenue: 134567 },
        { date: "2024-12-08", orders: 298, revenue: 159876 },
        { date: "2024-12-09", orders: 321, revenue: 172345 },
        { date: "2024-12-10", orders: 287, revenue: 149876 },
        { date: "2024-12-11", orders: 256, revenue: 142356 },
      ],
      orderStatus: [
        {
          status: "Delivered",
          count: 43234,
          percentage: 94.6,
          color: "bg-green-500",
        },
        {
          status: "Cancelled",
          count: 1876,
          percentage: 4.1,
          color: "bg-red-500",
        },
        {
          status: "Pending",
          count: 568,
          percentage: 1.2,
          color: "bg-yellow-500",
        },
        {
          status: "Processing",
          count: 89,
          percentage: 0.2,
          color: "bg-blue-500",
        },
      ],
      popularItems: [
        { name: "Premium Lunch Tiffin", orders: 5634, revenue: 253530 },
        { name: "Breakfast Combo", orders: 4567, revenue: 182680 },
        { name: "Dinner Special", orders: 3892, revenue: 194600 },
        { name: "Snack Box", orders: 3456, revenue: 103680 },
        { name: "Fresh Juice", orders: 2987, revenue: 89610 },
      ],
      deliveryMetrics: {
        avgDeliveryTime: "28 mins",
        onTimeDelivery: 89.2,
        totalDeliveries: 43234,
        deliveryAreas: [
          { area: "Bandra", orders: 8765, avgTime: 25 },
          { area: "Andheri", orders: 7654, avgTime: 32 },
          { area: "Juhu", orders: 6543, avgTime: 28 },
          { area: "Malad", orders: 5432, avgTime: 35 },
          { area: "Borivali", orders: 4321, avgTime: 42 },
        ],
      },
      hourlyDistribution: [
        { hour: "06:00", orders: 45 },
        { hour: "07:00", orders: 89 },
        { hour: "08:00", orders: 156 },
        { hour: "09:00", orders: 234 },
        { hour: "10:00", orders: 298 },
        { hour: "11:00", orders: 367 },
        { hour: "12:00", orders: 456 },
        { hour: "13:00", orders: 523 },
        { hour: "14:00", orders: 345 },
        { hour: "15:00", orders: 267 },
        { hour: "16:00", orders: 198 },
        { hour: "17:00", orders: 234 },
        { hour: "18:00", orders: 345 },
        { hour: "19:00", orders: 456 },
        { hour: "20:00", orders: 398 },
        { hour: "21:00", orders: 298 },
        { hour: "22:00", orders: 156 },
        { hour: "23:00", orders: 89 },
      ],
    };

    setTimeout(() => {
      setAnalytics(mockData);
      setLoading(false);
    }, 1000);
  }, [timeframe]);

  const StatCard = ({ icon: Icon, title, value, subtitle, change, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="ml-4 flex-1">
          <h3 className="text-sm font-medium text-gray-500">{title}</h3>
          <div className="flex items-baseline">
            <p className="text-2xl font-semibold text-gray-900">{value}</p>
            {change && (
              <span
                className={`ml-2 text-sm ${
                  change >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {change >= 0 ? "+" : ""}
                {change}%
              </span>
            )}
          </div>
          {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Order Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive order performance and delivery insights
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 mt-4 lg:mt-0">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 3 Months</option>
            <option value="year">Last Year</option>
          </select>
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Package}
          title="Total Orders"
          value={analytics.overview.totalOrders.toLocaleString()}
          change={12.5}
          color="bg-blue-600"
        />
        <StatCard
          icon={DollarSign}
          title="Total Revenue"
          value={`₹${(analytics.overview.totalRevenue / 100000).toFixed(1)}L`}
          subtitle={`Avg: ₹${analytics.overview.avgOrderValue}`}
          change={8.3}
          color="bg-green-600"
        />
        <StatCard
          icon={CheckCircle}
          title="Fulfillment Rate"
          value={`${analytics.overview.fulfillmentRate}%`}
          subtitle={`${analytics.overview.completedOrders.toLocaleString()} completed`}
          change={2.1}
          color="bg-purple-600"
        />
        <StatCard
          icon={Clock}
          title="Avg Delivery Time"
          value={analytics.deliveryMetrics.avgDeliveryTime}
          subtitle={`${analytics.deliveryMetrics.onTimeDelivery}% on time`}
          change={-3.2}
          color="bg-orange-600"
        />
      </div>

      {/* Order Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Orders Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Daily Orders Trend</h2>
            <BarChart3 className="w-5 h-5 text-gray-400" />
          </div>
          <div className="h-64 flex items-end space-x-1">
            {analytics.dailyOrders.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-600 rounded-t"
                  style={{
                    height: `${
                      (day.orders /
                        Math.max(
                          ...analytics.dailyOrders.map((d) => d.orders)
                        )) *
                      200
                    }px`,
                  }}
                  title={`${
                    day.orders
                  } orders, ₹${day.revenue.toLocaleString()}`}
                ></div>
                <div className="text-xs text-gray-600 mt-2">
                  {new Date(day.date).getDate()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Order Status Distribution</h2>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {analytics.orderStatus.map((status, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-4 h-4 rounded ${status.color}`}></div>
                  <span className="text-gray-700">{status.status}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${status.color}`}
                      style={{ width: `${status.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12">
                    {status.percentage}%
                  </span>
                  <span className="text-sm font-medium w-16 text-right">
                    {status.count.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Popular Items & Delivery Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Popular Items</h2>
          <div className="space-y-4">
            {analytics.popularItems.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-600">
                    {item.orders} orders
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    ₹{item.revenue.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">Revenue</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Areas */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Top Delivery Areas</h2>
          <div className="space-y-4">
            {analytics.deliveryMetrics.deliveryAreas.map((area, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium">{area.area}</div>
                  <div className="text-sm text-gray-600">
                    {area.orders} orders
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{area.avgTime} mins</div>
                  <div className="text-sm text-gray-600">Avg delivery</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hourly Order Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Hourly Order Distribution</h2>
          <Clock className="w-5 h-5 text-gray-400" />
        </div>
        <div className="h-48 flex items-end space-x-1">
          {analytics.hourlyDistribution.map((hour, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t"
                style={{
                  height: `${
                    (hour.orders /
                      Math.max(
                        ...analytics.hourlyDistribution.map((h) => h.orders)
                      )) *
                    160
                  }px`,
                }}
                title={`${hour.hour}: ${hour.orders} orders`}
              ></div>
              <div className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-center">
                {hour.hour}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-gray-500 text-center">
          Peak hours: 12:00-13:00 and 19:00-20:00
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <Truck className="w-8 h-8 text-blue-600 mx-auto mb-3" />
          <div className="text-2xl font-bold text-gray-900">
            {analytics.deliveryMetrics.totalDeliveries.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Total Deliveries</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-center">
          <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-3" />
          <div className="text-2xl font-bold text-gray-900">
            {analytics.deliveryMetrics.onTimeDelivery}%
          </div>
          <div className="text-sm text-gray-600">On-Time Delivery Rate</div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 text-center">
          <DollarSign className="w-8 h-8 text-purple-600 mx-auto mb-3" />
          <div className="text-2xl font-bold text-gray-900">
            ₹{analytics.overview.avgOrderValue}
          </div>
          <div className="text-sm text-gray-600">Average Order Value</div>
        </div>
      </div>
    </div>
  );
};

export default OrderAnalytics;
