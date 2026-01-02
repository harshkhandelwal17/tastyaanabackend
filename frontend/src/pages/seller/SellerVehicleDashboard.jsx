import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Car,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Eye,
  Edit,
  Plus,
  RefreshCw,
  Filter,
  Search,
  ArrowUpIcon,
  ArrowDownIcon,
  Activity,
  Clock,
  CheckCircle,
} from "lucide-react";
import {
  getSellerDashboard,
  formatVehicleForDisplay,
  formatBookingForDisplay,
  getStatusBadgeColor,
} from "../../api/sellerVehicleApi";

const SellerVehicleDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await getSellerDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      toast.error(error.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
    toast.success("Dashboard refreshed!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const { overview, recentBookings, vehicleStats } = dashboardData || {};

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Car className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Vehicle Rental Dashboard
                </h1>
                <p className="text-sm text-gray-500">
                  Manage your vehicle rental business
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Car className="w-8 h-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Vehicles
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {overview?.totalVehicles || 0}
                </p>
                <p className="text-sm text-green-600">
                  {overview?.activeVehicles || 0} active
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Bookings
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {overview?.totalBookings || 0}
                </p>
                <p className="text-sm text-blue-600">
                  {overview?.activeBookings || 0} active
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="w-8 h-8 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Revenue
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  ₹{(overview?.totalRevenue || 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">All time</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Monthly Revenue
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  ₹{(overview?.monthlyRevenue || 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">This month</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Bookings */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Recent Bookings
                </h3>
                <span className="text-sm text-gray-500">
                  {recentBookings?.length || 0} bookings
                </span>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {recentBookings?.length > 0 ? (
                recentBookings.map((booking) => {
                  const formattedBooking = formatBookingForDisplay(booking);
                  return (
                    <div
                      key={booking._id}
                      className="px-6 py-4 hover:bg-gray-50"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-3">
                            <div className="flex-shrink-0">
                              {formattedBooking.vehicle.images?.[0] ? (
                                <img
                                  src={formattedBooking.vehicle.images[0]}
                                  alt={`${formattedBooking.vehicle.brand} ${formattedBooking.vehicle.model}`}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <Car className="w-10 h-10 text-gray-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {formattedBooking.vehicle.brand}{" "}
                                {formattedBooking.vehicle.model}
                              </p>
                              <p className="text-sm text-gray-500 truncate">
                                {formattedBooking.customer.name} •{" "}
                                {formattedBooking.bookingId}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                              formattedBooking.status
                            )}`}
                          >
                            {formattedBooking.status}
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            ₹{formattedBooking.totalAmount?.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-6 py-12 text-center">
                  <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No bookings yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start by adding your vehicles to get bookings.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Vehicle Performance */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Vehicle Performance
                </h3>
                <span className="text-sm text-gray-500">
                  {vehicleStats?.length || 0} vehicles
                </span>
              </div>
            </div>

            <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
              {vehicleStats?.length > 0 ? (
                vehicleStats.map((stat) => (
                  <div key={stat.vehicle._id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {stat.vehicle.images?.[0] ? (
                            <img
                              src={stat.vehicle.images[0]}
                              alt={`${stat.vehicle.brand} ${stat.vehicle.model}`}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <Car className="w-10 h-10 text-gray-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {stat.vehicle.brand} {stat.vehicle.model}
                          </p>
                          <div className="flex items-center space-x-4 text-xs text-gray-500">
                            <span>{stat.totalBookings} bookings</span>
                            <span>₹{stat.revenue?.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(
                            stat.vehicle.status
                          )}`}
                        >
                          {stat.vehicle.status}
                        </span>
                      </div>
                    </div>

                    {/* Utilization bar */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Utilization</span>
                        <span>{Math.round(stat.utilization)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            stat.utilization >= 70
                              ? "bg-green-600"
                              : stat.utilization >= 40
                              ? "bg-yellow-600"
                              : "bg-red-600"
                          }`}
                          style={{
                            width: `${Math.min(stat.utilization, 100)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center">
                  <Car className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">
                    No vehicles yet
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Add your first vehicle to start tracking performance.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="flex items-center justify-center px-4 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <Plus className="w-5 h-5 mr-2" />
                Add New Vehicle
              </button>

              <button className="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <Calendar className="w-5 h-5 mr-2" />
                View All Bookings
              </button>

              <button className="flex items-center justify-center px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                <TrendingUp className="w-5 h-5 mr-2" />
                View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerVehicleDashboard;
