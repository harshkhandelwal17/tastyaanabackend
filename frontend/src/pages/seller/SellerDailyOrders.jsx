import React, { useState, useEffect } from "react";
import {
  Calendar,
  Users,
  Package,
  Clock,
  Sun,
  Moon,
  RefreshCw,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  AlertCircle,
  Truck,
  MapPin,
  Phone,
  ChevronDown,
  ChevronRight,
  Edit3,
  X,
  Utensils,
} from "lucide-react";

const SellerDailyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedShift, setSelectedShift] = useState("all"); // 'all', 'morning', 'evening'
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    morning: 0,
    evening: 0,
    delivered: 0,
    pending: 0,
    cancelled: 0,
  });

  const API_BASE_URL = `${import.meta.env.VITE_BACKEND_URL}`;
  const authToken =
    localStorage.getItem("authToken") || localStorage.getItem("token");

  useEffect(() => {
    loadDailyOrders();
  }, [selectedDate, selectedShift]);

  const loadDailyOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams({
        date: selectedDate,
        ...(selectedShift !== "all" && { shift: selectedShift }),
      });

      const response = await fetch(
        `${API_BASE_URL}/seller/meal-edit/daily-orders?${params}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }

      const data = await response.json();

      if (data.success) {
        setOrders(data.data || []); // Backend returns data directly, not data.orders
        calculateStats(data.data || []);
      } else {
        throw new Error(data.message || "Failed to load orders");
      }
    } catch (error) {
      console.error("Error loading daily orders:", error);
      setError("Failed to load daily orders: " + error.message);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (ordersList) => {
    const newStats = {
      total: ordersList.length,
      morning: ordersList.filter((order) => order.shift === "morning").length,
      evening: ordersList.filter((order) => order.shift === "evening").length,
      delivered: ordersList.filter((order) => order.status === "delivered")
        .length,
      pending: ordersList.filter((order) =>
        [
          "pending",
          "assigned",
          "confirmed",
          "preparing",
          "ready",
          "out_for_delivery",
        ].includes(order.status)
      ).length,
      cancelled: ordersList.filter((order) => order.status === "cancelled")
        .length,
      skipped: ordersList.filter((order) => order.status === "skipped").length,
      customized: ordersList.filter(
        (order) => order.mealStatus === "customized"
      ).length,
      standard: ordersList.filter((order) => order.mealStatus === "standard")
        .length,
    };
    setStats(newStats);
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.user?.phone?.includes(searchTerm) ||
      order.address?.street?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
      case "failed":
        return "bg-red-100 text-red-800";
      case "skipped":
        return "bg-gray-100 text-gray-800";
      case "confirmed":
      case "pending":
      case "assigned":
        return "bg-blue-100 text-blue-800";
      case "preparing":
        return "bg-yellow-100 text-yellow-800";
      case "ready":
        return "bg-purple-100 text-purple-800";
      case "out_for_delivery":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getShiftIcon = (shift) => {
    return shift === "morning" ? (
      <Sun className="h-4 w-4 text-yellow-500" />
    ) : (
      <Moon className="h-4 w-4 text-blue-500" />
    );
  };

  const getMealStatusInfo = (mealStatus) => {
    switch (mealStatus) {
      case "customized":
        return {
          color: "bg-purple-100 text-purple-800",
          icon: <Edit3 className="h-3 w-3" />,
          label: "Customized",
        };
      case "skipped":
        return {
          color: "bg-gray-100 text-gray-800",
          icon: <X className="h-3 w-3" />,
          label: "Skipped",
        };
      default:
        return {
          color: "bg-blue-100 text-blue-800",
          icon: <Utensils className="h-3 w-3" />,
          label: "Standard",
        };
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const exportOrders = async () => {
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        ...(selectedShift !== "all" && { shift: selectedShift }),
        format: "csv",
      });

      const response = await fetch(
        `${API_BASE_URL}/seller/meal-edit/daily-orders/export?${params}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `daily-orders-${selectedDate}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error("Error exporting orders:", error);
      setError("Failed to export orders");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="h-7 w-7 text-blue-500" />
                Daily Orders
              </h1>
              <p className="text-gray-600 mt-1">
                View and manage today's subscription orders
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={exportOrders}
                disabled={loading || orders.length === 0}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Export CSV
              </button>

              <button
                onClick={loadDailyOrders}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Morning</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.morning}
                </p>
              </div>
              <Sun className="h-8 w-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Evening</p>
                <p className="text-2xl font-bold text-blue-600">
                  {stats.evening}
                </p>
              </div>
              <Moon className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.delivered}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-orange-600">
                  {stats.pending}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Skipped</p>
                <p className="text-2xl font-bold text-gray-600">
                  {stats.skipped}
                </p>
              </div>
              <X className="h-8 w-8 text-gray-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Customized</p>
                <p className="text-2xl font-bold text-purple-600">
                  {stats.customized}
                </p>
              </div>
              <Edit3 className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">
                  {stats.cancelled}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Shift
              </label>
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Shifts</option>
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready">Ready</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="delivered">Delivered</option>
                <option value="skipped">Skipped</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        {/* Orders List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Orders for{" "}
              {new Date(selectedDate).toLocaleDateString("en-IN", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}{" "}
              ({filteredOrders.length})
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Loading orders...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-4" />
              <p>No orders found for the selected criteria</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <div key={order._id} className="p-4">
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() =>
                      setExpandedOrder(
                        expandedOrder === order._id ? null : order._id
                      )
                    }
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getShiftIcon(order.shift)}
                        <span className="font-medium text-gray-900">
                          {order.user?.name || "N/A"}
                        </span>
                      </div>

                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status.replace("_", " ").toUpperCase()}
                      </span>

                      {order.mealStatus && order.mealStatus !== "standard" && (
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full flex items-center gap-1 ${
                            getMealStatusInfo(order.mealStatus).color
                          }`}
                        >
                          {getMealStatusInfo(order.mealStatus).icon}
                          {getMealStatusInfo(order.mealStatus).label}
                        </span>
                      )}

                      <span className="text-sm text-gray-600">
                        {order.mealPlan?.name || "N/A"}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500">
                        {formatTime(order.deliveryTime || order.createdAt)}
                      </span>
                      {expandedOrder === order._id ? (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {expandedOrder === order._id && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Customer Details */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">
                            Customer Details
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-gray-400" />
                              {order.user?.name || "N/A"}
                            </p>
                            {order.user?.phone && (
                              <p className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-400" />
                                {order.user.phone}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Address */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">
                            Delivery Address
                          </h4>
                          <div className="text-sm text-gray-600">
                            <p className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                              <span>
                                {order.address?.street || "N/A"}
                                <br />
                                {order.address?.city &&
                                  `${order.address.city}, `}
                                {order.address?.pincode}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Order Details */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2">
                            Order Details
                          </h4>
                          <div className="space-y-1 text-sm">
                            <p>Plan: {order.mealPlan?.name || "N/A"}</p>
                            <p>Tier: {order.mealPlan?.tier || "N/A"}</p>
                            <p>Shift: {order.shift}</p>
                            {order.specialInstructions && (
                              <p>Instructions: {order.specialInstructions}</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Meal Status Details */}
                      {(order.mealStatus === "customized" ||
                        order.mealStatus === "skipped") && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                            {order.mealStatus === "customized" ? (
                              <>
                                <Edit3 className="h-4 w-4 text-purple-500" />
                                Customized Meal
                              </>
                            ) : (
                              <>
                                <X className="h-4 w-4 text-gray-500" />
                                Skipped Meal
                              </>
                            )}
                          </h4>

                          {order.mealStatus === "skipped" &&
                            order.skipReason && (
                              <p className="text-sm text-gray-600 mb-2">
                                <strong>Reason:</strong> {order.skipReason}
                              </p>
                            )}

                          {order.mealStatus === "customized" &&
                            order.mealInfo?.items && (
                              <div className="text-sm text-gray-600">
                                <p className="font-medium mb-2">
                                  Custom Items:
                                </p>
                                <ul className="list-disc list-inside space-y-1">
                                  {order.mealInfo.items.map((item, index) => (
                                    <li key={index}>
                                      {item.name} - {item.quantity} {item.unit}
                                    </li>
                                  ))}
                                </ul>
                                {order.mealInfo.isAvailable === false && (
                                  <p className="text-red-600 mt-2 font-medium">
                                    ⚠️ Meal marked as not available
                                  </p>
                                )}
                              </div>
                            )}
                        </div>
                      )}

                      {/* Delivery Tracking */}
                      {order.deliveryTracking && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                            <Truck className="h-4 w-4" />
                            Delivery Tracking
                          </h4>
                          <div className="text-sm text-gray-600">
                            <p>
                              Driver:{" "}
                              {order.deliveryTracking.driverName ||
                                "Not assigned"}
                            </p>
                            {order.deliveryTracking.estimatedDeliveryTime && (
                              <p>
                                ETA:{" "}
                                {formatTime(
                                  order.deliveryTracking.estimatedDeliveryTime
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerDailyOrders;
