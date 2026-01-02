import React, { useState } from "react";
import {
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Car,
  BarChart3,
  PieChart,
  Download,
} from "lucide-react";

const AdminRevenue = () => {
  const [dateRange, setDateRange] = useState("30days");
  const [selectedMetric, setSelectedMetric] = useState("revenue");

  // Mock data - replace with actual API calls
  const revenueData = {
    totalRevenue: 156750,
    totalBookings: 342,
    avgBookingValue: 458,
    totalCustomers: 267,
    growthRate: 12.5,
    previousPeriodRevenue: 139000,

    dailyRevenue: [
      { date: "2024-01-01", revenue: 4500, bookings: 12 },
      { date: "2024-01-02", revenue: 3200, bookings: 8 },
      { date: "2024-01-03", revenue: 5800, bookings: 15 },
      { date: "2024-01-04", revenue: 4100, bookings: 11 },
      { date: "2024-01-05", revenue: 6200, bookings: 17 },
      { date: "2024-01-06", revenue: 3900, bookings: 10 },
      { date: "2024-01-07", revenue: 5500, bookings: 14 },
    ],

    vehicleTypeRevenue: [
      { type: "Car", revenue: 89250, percentage: 56.9, bookings: 189 },
      { type: "Bike", revenue: 34650, percentage: 22.1, bookings: 98 },
      { type: "Auto", revenue: 23850, percentage: 15.2, bookings: 45 },
      { type: "Truck", revenue: 9000, percentage: 5.8, bookings: 10 },
    ],

    topCustomers: [
      {
        name: "Rahul Sharma",
        totalSpent: 12500,
        bookings: 15,
        lastBooking: "2024-01-05",
      },
      {
        name: "Priya Patel",
        totalSpent: 8900,
        bookings: 12,
        lastBooking: "2024-01-04",
      },
      {
        name: "Amit Singh",
        totalSpent: 7600,
        bookings: 10,
        lastBooking: "2024-01-03",
      },
      {
        name: "Sneha Gupta",
        totalSpent: 6800,
        bookings: 9,
        lastBooking: "2024-01-02",
      },
      {
        name: "Vikram Kumar",
        totalSpent: 5900,
        bookings: 8,
        lastBooking: "2024-01-01",
      },
    ],

    zoneRevenue: [
      { zone: "Zone A", revenue: 62700, percentage: 40.0, bookings: 137 },
      { zone: "Zone B", revenue: 47025, percentage: 30.0, bookings: 102 },
      { zone: "Zone C", revenue: 31350, percentage: 20.0, bookings: 68 },
      { zone: "Zone D", revenue: 15675, percentage: 10.0, bookings: 35 },
    ],

    monthlyTrend: [
      { month: "Jul", revenue: 125000, bookings: 285 },
      { month: "Aug", revenue: 138000, bookings: 310 },
      { month: "Sep", revenue: 142000, bookings: 325 },
      { month: "Oct", revenue: 151000, bookings: 340 },
      { month: "Nov", revenue: 148000, bookings: 332 },
      { month: "Dec", revenue: 156750, bookings: 342 },
    ],
  };

  const dateRanges = [
    { value: "7days", label: "Last 7 Days" },
    { value: "30days", label: "Last 30 Days" },
    { value: "3months", label: "Last 3 Months" },
    { value: "6months", label: "Last 6 Months" },
    { value: "1year", label: "Last Year" },
  ];

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getGrowthColor = (growth) => {
    return growth >= 0 ? "text-green-600" : "text-red-600";
  };

  const exportData = () => {
    // Mock export functionality
    const csvData = revenueData.dailyRevenue
      .map((item) => `${item.date},${item.revenue},${item.bookings}`)
      .join("\n");

    const blob = new Blob([`Date,Revenue,Bookings\n${csvData}`], {
      type: "text/csv",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = `revenue-report-${dateRange}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Revenue Analytics
          </h1>
          <p className="text-gray-600">
            Track revenue performance and insights
          </p>
        </div>
        <div className="flex space-x-2">
          <select
            className="px-4 py-2 border rounded-md"
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
          >
            {dateRanges.map((range) => (
              <option key={range.value} value={range.value}>
                {range.label}
              </option>
            ))}
          </select>
          <button
            onClick={exportData}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <Download size={20} />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <DollarSign className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(revenueData.totalRevenue)}
              </p>
              <p
                className={`text-sm ${getGrowthColor(revenueData.growthRate)}`}
              >
                {revenueData.growthRate > 0 ? "+" : ""}
                {revenueData.growthRate}% from last period
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Car className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Bookings
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {revenueData.totalBookings}
              </p>
              <p className="text-sm text-gray-500">Active bookings</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Avg Booking Value
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {formatCurrency(revenueData.avgBookingValue)}
              </p>
              <p className="text-sm text-gray-500">Per booking</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">
                Total Customers
              </p>
              <p className="text-2xl font-semibold text-gray-900">
                {revenueData.totalCustomers}
              </p>
              <p className="text-sm text-gray-500">Unique customers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Revenue Trend
            </h2>
            <TrendingUp className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {revenueData.monthlyTrend.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-900 w-8">
                    {item.month}
                  </span>
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-full h-2 w-24">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${(item.revenue / 160000) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(item.revenue)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.bookings} bookings
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vehicle Type Revenue */}
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Revenue by Vehicle Type
            </h2>
            <PieChart className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {revenueData.vehicleTypeRevenue.map((item, index) => {
              const colors = [
                "bg-blue-600",
                "bg-green-600",
                "bg-yellow-600",
                "bg-red-600",
              ];
              return (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${colors[index]}`} />
                    <span className="text-sm font-medium text-gray-900">
                      {item.type}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(item.revenue)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.percentage}% ({item.bookings} bookings)
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Revenue by Zone and Top Customers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Zone Revenue */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue by Zone
          </h2>
          <div className="space-y-4">
            {revenueData.zoneRevenue.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-900 w-16">
                    {item.zone}
                  </span>
                  <div className="flex-1">
                    <div className="bg-gray-200 rounded-full h-2 w-32">
                      <div
                        className="bg-purple-600 h-2 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(item.revenue)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.percentage}% ({item.bookings} bookings)
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Top Customers
          </h2>
          <div className="space-y-4">
            {revenueData.topCustomers.map((customer, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {customer.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {customer.bookings} bookings • Last:{" "}
                    {new Date(customer.lastBooking).toLocaleDateString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">
                    {formatCurrency(customer.totalSpent)}
                  </div>
                  <div className="text-xs text-gray-500">Total spent</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Daily Revenue Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            Daily Revenue Breakdown
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bookings
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Booking Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Growth
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {revenueData.dailyRevenue.map((day, index) => {
                const prevDay =
                  index > 0 ? revenueData.dailyRevenue[index - 1] : null;
                const growth = prevDay
                  ? ((day.revenue - prevDay.revenue) / prevDay.revenue) * 100
                  : 0;

                return (
                  <tr key={day.date}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {new Date(day.date).toLocaleDateString("en-IN", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(day.revenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {day.bookings}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(day.revenue / day.bookings)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {prevDay ? (
                        <span className={`text-sm ${getGrowthColor(growth)}`}>
                          {growth > 0 ? "+" : ""}
                          {growth.toFixed(1)}%
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminRevenue;
