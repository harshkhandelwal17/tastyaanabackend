import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  FiUsers,
  FiDollarSign,
  FiCalendar,
  FiTrendingUp,
  FiMapPin,
  FiSettings,
  //   FiBarChart3,
  FiActivity,
  //   FiClock,
} from "react-icons/fi";
import { FaCar } from "react-icons/fa";

const VehicleAdminDashboard = () => {
  const navigate = useNavigate();

  // Mock data - replace with actual API calls
  const [dashboardData, setDashboardData] = useState({
    totalVehicles: 0,
    availableVehicles: 0,
    bookedVehicles: 0,
    totalBookings: 0,
    todayRevenue: 0,
    totalRevenue: 0,
    activeUsers: 0,
    maintenanceVehicles: 0,
  });

  const [recentBookings, setRecentBookings] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);

  // Dashboard stats cards
  const statsCards = [
    {
      title: "Total Vehicles",
      value: dashboardData.totalVehicles,
      icon: FaCar,
      color: "bg-blue-500",
      textColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Available Vehicles",
      value: dashboardData.availableVehicles,
      icon: FiActivity,
      color: "bg-green-500",
      textColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Booked Vehicles",
      value: dashboardData.bookedVehicles,
      icon: FiCalendar,
      color: "bg-orange-500",
      textColor: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Today's Revenue",
      value: `₹${dashboardData.todayRevenue.toLocaleString()}`,
      icon: FiDollarSign,
      color: "bg-purple-500",
      textColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  // Quick action cards
  const quickActions = [
    {
      title: "Add Vehicle",
      description: "Add new vehicle to fleet",
      icon: FaCar,
      color: "bg-blue-500",
      action: () => navigate("/admin/vehicles/add"),
    },
    {
      title: "View Bookings",
      description: "Manage vehicle bookings",
      icon: FiCalendar,
      color: "bg-green-500",
      action: () => navigate("/admin/vehicle-bookings"),
    },
    {
      title: "Billing History",
      description: "View revenue & payments",
      icon: FiDollarSign,
      color: "bg-purple-500",
      action: () => navigate("/admin/vehicle-billing"),
    },
    {
      title: "Vehicle Maintenance",
      description: "Manage vehicle maintenance",
      icon: FiSettings,
      color: "bg-orange-500",
      action: () => navigate("/admin/vehicle-maintenance"),
    },
  ];

  useEffect(() => {
    // Load dashboard data
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Mock API call - replace with actual API
      setDashboardData({
        totalVehicles: 24,
        availableVehicles: 18,
        bookedVehicles: 6,
        totalBookings: 156,
        todayRevenue: 12500,
        totalRevenue: 245000,
        activeUsers: 89,
        maintenanceVehicles: 2,
      });

      setRecentBookings([
        {
          id: "BK001",
          customerName: "John Doe",
          vehicle: "Honda Activa",
          duration: "12 hours",
          amount: 480,
          status: "confirmed",
          time: "2 hours ago",
        },
        {
          id: "BK002",
          customerName: "Jane Smith",
          vehicle: "Bajaj Pulsar",
          duration: "24 hours",
          amount: 800,
          status: "ongoing",
          time: "5 hours ago",
        },
      ]);

      setRecentActivities([
        {
          id: 1,
          type: "booking",
          message: "New booking received for Honda Activa",
          time: "10 minutes ago",
          icon: FiCalendar,
        },
        {
          id: 2,
          type: "vehicle",
          message: "Vehicle maintenance completed for TVS Jupiter",
          time: "1 hour ago",
          icon: FiSettings,
        },
        {
          id: 3,
          type: "payment",
          message: "Payment of ₹1,200 received",
          time: "2 hours ago",
          icon: FiDollarSign,
        },
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Failed to load dashboard data");
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "text-green-600 bg-green-50";
      case "ongoing":
        return "text-blue-600 bg-blue-50";
      case "completed":
        return "text-gray-600 bg-gray-50";
      case "cancelled":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Vehicle Rental Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening with your vehicle rental
            business.
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            onClick={() => navigate("/admin/vehicles/add")}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <FaCar className="w-4 h-4" />
            <span>Add Vehicle</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center">
              <div className={`${card.bgColor} p-3 rounded-lg`}>
                <card.icon className={`w-6 h-6 ${card.textColor}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg p-6 shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.action}
              className="p-4 border rounded-lg hover:shadow-md transition-all text-left group"
            >
              <div
                className={`${action.color} p-2 rounded-lg w-fit mb-3 group-hover:scale-110 transition-transform`}
              >
                <action.icon className="w-5 h-5 text-white" />
              </div>
              <h3 className="font-medium text-gray-900 mb-1">{action.title}</h3>
              <p className="text-sm text-gray-600">{action.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Recent Bookings
            </h2>
            <button
              onClick={() => navigate("/admin/vehicle-bookings")}
              className="text-blue-600 text-sm hover:text-blue-700"
            >
              View All
            </button>
          </div>
          <div className="space-y-4">
            {recentBookings.map((booking) => (
              <div
                key={booking.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {booking.customerName}
                  </p>
                  <p className="text-sm text-gray-600">
                    {booking.vehicle} • {booking.duration}
                  </p>
                  <p className="text-xs text-gray-500">{booking.time}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">₹{booking.amount}</p>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                      booking.status
                    )}`}
                  >
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Activities
          </h2>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className="bg-blue-50 p-2 rounded-lg">
                  <activity.icon className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleAdminDashboard;
