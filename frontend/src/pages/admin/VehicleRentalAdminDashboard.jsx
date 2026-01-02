import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import {
  FiTruck,
  FiCalendar,
  FiDollarSign,
  FiUsers,
  FiTrendingUp,
  FiSettings,
  FiRefreshCw,
  FiPlusCircle,
  FiBarChart,
  FiMapPin,
  FiClock,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import { FiAlertTriangle } from "react-icons/fi";

const VehicleRentalAdminDashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("month"); // week, month, year
  const [recentBookings, setRecentBookings] = useState([]);
  const [vehicleAlerts, setVehicleAlerts] = useState([]);

  // Fetch dashboard analytics
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const endDate = new Date();
      let startDate = new Date();

      switch (timeRange) {
        case "week":
          startDate.setDate(endDate.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case "year":
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(endDate.getMonth() - 1);
      }

      // Fetch multiple data in parallel
      const [vehiclesRes, bookingsRes, analyticsRes] = await Promise.all([
        axios.get("/api/vehicles?status=active&limit=100"),
        axios.get(
          "/api/vehicles/bookings/all?limit=5&sortBy=bookingDate&sortOrder=desc"
        ),
        // You can add analytics endpoint later
        Promise.resolve({ data: { success: true, data: {} } }),
      ]);

      if (vehiclesRes.data.success && bookingsRes.data.success) {
        const vehicles = vehiclesRes.data.data;
        const bookings = bookingsRes.data.data;

        // Calculate statistics
        const totalVehicles = vehicles.length;
        const availableVehicles = vehicles.filter(
          (v) => v.availability === "available"
        ).length;
        const bookedVehicles = vehicles.filter(
          (v) => v.availability === "not-available"
        ).length;
        const maintenanceVehicles = vehicles.filter(
          (v) => v.status === "in-maintenance"
        ).length;

        const totalBookings = bookings.length;
        const todayBookings = bookings.filter(
          (b) =>
            new Date(b.bookingDate).toDateString() === new Date().toDateString()
        ).length;

        const totalRevenue = bookings
          .filter((b) => b.paymentStatus === "paid")
          .reduce((sum, b) => sum + (b.billing?.totalBill || 0), 0);

        const pendingPayments = bookings
          .filter((b) => ["unpaid", "partially-paid"].includes(b.paymentStatus))
          .reduce(
            (sum, b) => sum + (b.billing?.totalBill || 0) - (b.paidAmount || 0),
            0
          );

        // Vehicle category distribution
        const categoryStats = vehicles.reduce((acc, vehicle) => {
          acc[vehicle.category] = (acc[vehicle.category] || 0) + 1;
          return acc;
        }, {});

        // Check for maintenance alerts
        const alerts = vehicles.filter(
          (v) => v.needsMaintenanceSoon && v.needsMaintenanceSoon()
        );

        setDashboardData({
          totalVehicles,
          availableVehicles,
          bookedVehicles,
          maintenanceVehicles,
          totalBookings,
          todayBookings,
          totalRevenue,
          pendingPayments,
          categoryStats,
          utilizationRate:
            totalVehicles > 0
              ? ((bookedVehicles / totalVehicles) * 100).toFixed(1)
              : 0,
        });

        setRecentBookings(bookings);
        setVehicleAlerts(alerts);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  // Stats cards configuration
  const getStatsCards = () => [
    {
      title: "Total Vehicles",
      value: dashboardData?.totalVehicles || 0,
      icon: FiTruck,
      color: "indigo",
      change: "+12%",
      onClick: () => navigate("/admin/vehicles"),
    },
    {
      title: "Available Now",
      value: dashboardData?.availableVehicles || 0,
      icon: FiCheckCircle,
      color: "green",
      subtitle: `${dashboardData?.utilizationRate || 0}% utilized`,
      onClick: () => navigate("/admin/vehicles?availability=available"),
    },
    {
      title: "Active Bookings",
      value: dashboardData?.bookedVehicles || 0,
      icon: FiCalendar,
      color: "blue",
      subtitle: `${dashboardData?.todayBookings || 0} today`,
      onClick: () => navigate("/admin/bookings"),
    },
    {
      title: "Revenue",
      value: `₹${(dashboardData?.totalRevenue || 0).toLocaleString()}`,
      icon: FiDollarSign,
      color: "yellow",
      subtitle: `₹${(
        dashboardData?.pendingPayments || 0
      ).toLocaleString()} pending`,
      onClick: () => navigate("/admin/revenue"),
    },
  ];

  // Get status badge for bookings
  const getBookingStatusBadge = (status) => {
    const statusConfig = {
      confirmed: { bg: "bg-blue-100", text: "text-blue-800" },
      ongoing: { bg: "bg-green-100", text: "text-green-800" },
      completed: { bg: "bg-green-100", text: "text-green-800" },
      cancelled: { bg: "bg-red-100", text: "text-red-800" },
      pending: { bg: "bg-yellow-100", text: "text-yellow-800" },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span
        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Vehicle Rental Dashboard
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Monitor and manage your vehicle rental operations
              </p>
            </div>

            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              {/* Time Range Selector */}
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
              >
                <option value="week">Last 7 days</option>
                <option value="month">Last 30 days</option>
                <option value="year">Last year</option>
              </select>

              {/* Quick Actions */}
              <button
                onClick={() => navigate("/admin/vehicles/add")}
                className="flex items-center space-x-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                <FiPlusCircle className="w-4 h-4" />
                <span>Add Vehicle</span>
              </button>

              <button
                onClick={fetchDashboardData}
                className="p-2 text-gray-600 hover:text-gray-800"
              >
                <FiRefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {getStatsCards().map((card, index) => {
            const Icon = card.icon;
            return (
              <div
                key={index}
                onClick={card.onClick}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{card.title}</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {card.value}
                    </p>
                    {card.subtitle && (
                      <p className="text-sm text-gray-500 mt-1">
                        {card.subtitle}
                      </p>
                    )}
                  </div>
                  <div className={`p-3 rounded-full bg-${card.color}-100`}>
                    <Icon className={`w-6 h-6 text-${card.color}-600`} />
                  </div>
                </div>
                {card.change && (
                  <div className="mt-4 text-sm text-green-600">
                    {card.change} from last period
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Bookings */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Recent Bookings
                </h2>
                <button
                  onClick={() => navigate("/admin/bookings")}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  View All
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {recentBookings.length > 0 ? (
                recentBookings.map((booking) => (
                  <div key={booking._id} className="p-6 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          🚗
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">
                            {booking.vehicleId?.name || "Unknown Vehicle"}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {booking.customerDetails?.name} •{" "}
                            {booking.bookingId}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(
                              booking.startDateTime
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="mb-1">
                          {getBookingStatusBadge(booking.bookingStatus)}
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          ₹{booking.billing?.totalBill || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No recent bookings
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Vehicle Category Distribution */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Fleet Distribution
              </h3>
              <div className="space-y-3">
                {dashboardData?.categoryStats &&
                  Object.entries(dashboardData.categoryStats).map(
                    ([category, count]) => {
                      const percentage = (
                        (count / dashboardData.totalVehicles) *
                        100
                      ).toFixed(1);
                      return (
                        <div
                          key={category}
                          className="flex items-center justify-between"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                            <span className="text-sm text-gray-600 capitalize">
                              {category}s
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-gray-900">
                              {count}
                            </span>
                            <span className="text-xs text-gray-500 ml-1">
                              ({percentage}%)
                            </span>
                          </div>
                        </div>
                      );
                    }
                  )}
              </div>
            </div>

            {/* Maintenance Alerts */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Maintenance Alerts
              </h3>
              {vehicleAlerts.length > 0 ? (
                <div className="space-y-3">
                  {vehicleAlerts.slice(0, 3).map((vehicle) => (
                    <div
                      key={vehicle._id}
                      className="flex items-center space-x-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
                    >
                      <FiAlertTriangle className="w-4 h-4 text-yellow-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-800">
                          {vehicle.name}
                        </p>
                        <p className="text-xs text-yellow-600">
                          Maintenance due soon
                        </p>
                      </div>
                    </div>
                  ))}
                  {vehicleAlerts.length > 3 && (
                    <button
                      onClick={() =>
                        navigate("/admin/vehicles?filter=maintenance")
                      }
                      className="text-xs text-yellow-600 hover:text-yellow-800"
                    >
                      View {vehicleAlerts.length - 3} more alerts
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-4">
                  <FiCheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm">All vehicles up to date!</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => navigate("/admin/bookings/create")}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg"
                >
                  <FiPlusCircle className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium">
                    Create Manual Booking
                  </span>
                </button>
                <button
                  onClick={() => navigate("/admin/vehicles")}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg"
                >
                  <FiSettings className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium">Manage Vehicles</span>
                </button>
                <button
                  onClick={() => navigate("/admin/reports")}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg"
                >
                  <FiBarChart className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium">View Reports</span>
                </button>
                <button
                  onClick={() => navigate("/admin/zones")}
                  className="w-full flex items-center space-x-3 p-3 text-left hover:bg-gray-50 rounded-lg"
                >
                  <FiMapPin className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium">Manage Zones</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleRentalAdminDashboard;
