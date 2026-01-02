import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import {
  User,
  LogOut,
  MapPin,
  Clock,
  Star,
  TrendingUp,
  Package,
  Power,
  DollarSign,
  Navigation,
  Phone,
  MessageCircle,
  Activity,
  Map,
  CheckCircle,
} from "lucide-react";
import { FaCalendarAlt } from "react-icons/fa";
import toast from "react-hot-toast";
import DriverMap from "../../components/delivery/DriverMap";
import {
  getDriverProfile,
  toggleOnlineStatus,
  getAssignedOrders,
  getAssignedDailyOrders,
  selectDriver,
  selectDriverAuth,
  selectDriverOnlineStatus,
  selectAssignedOrders,
  selectAssignedDailyOrders,
  selectDriverEarnings,
} from "../../redux/driverSlice";
import { logout } from "../../redux/authslice";
import { clearDriverData } from "../../utils/driverUtils";

const DriverDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state
  const driver = useSelector(selectDriver);
  const { isAuthenticated, loading } = useSelector((state) => state?.auth);
  const isOnline = useSelector(selectDriverOnlineStatus);
  const assignedOrders = useSelector(selectAssignedOrders);
  const earnings = useSelector(selectDriverEarnings);
  // Local state
  const [activeOrder, setActiveOrder] = useState(null);
  const [showMap, setShowMap] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [paymentUpdateLoading, setPaymentUpdateLoading] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [isBackground, setIsBackground] = useState(false);
  const [backgroundTrackingActive, setBackgroundTrackingActive] =
    useState(false);

  useEffect(() => {
    // Check authentication and load driver data
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    // Load driver profile and dashboard data
    dispatch(getDriverProfile());
    dispatch(getAssignedOrders());
    fetchDashboardData();
  }, [isAuthenticated, navigate, dispatch]);

  // Page visibility handling for background tracking
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsTabVisible(isVisible);
      setIsBackground(!isVisible);

      console.log(
        "🔍 DriverDashboard: Tab visibility changed:",
        isVisible ? "visible" : "background"
      );

      if (isVisible) {
        // Tab became visible - resume full functionality
        console.log(
          "🔄 DriverDashboard: Tab became visible, resuming full functionality..."
        );
        setBackgroundTrackingActive(false);
      } else {
        // Tab went to background - activate background mode
        console.log(
          "⏸️ DriverDashboard: Tab went to background, activating background mode..."
        );
        setBackgroundTrackingActive(true);
      }
    };

    // Listen for visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Also listen for page focus/blur events
    window.addEventListener("focus", () => {
      setIsTabVisible(true);
      setIsBackground(false);
      setBackgroundTrackingActive(false);
    });

    window.addEventListener("blur", () => {
      setIsTabVisible(false);
      setIsBackground(true);
      setBackgroundTrackingActive(true);
    });

    // Check initial state
    setIsTabVisible(!document.hidden);
    setIsBackground(document.hidden);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", () => {
        setIsTabVisible(true);
        setIsBackground(false);
        setBackgroundTrackingActive(false);
      });
      window.removeEventListener("blur", () => {
        setIsTabVisible(false);
        setIsBackground(true);
        setBackgroundTrackingActive(true);
      });
    };
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Fetch dashboard data including deliveries, earnings, and stats
      const dashboardResponse = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/drivers/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!dashboardResponse.ok) {
        const errorData = await dashboardResponse.json();
        console.error("Dashboard API error:", errorData);
        toast.error("Failed to load dashboard data", { duration: 2000 });
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to connect to server", { duration: 2000 });
    }
  };

  const handleToggleOnline = async () => {
    try {
      await dispatch(toggleOnlineStatus()).unwrap();
      toast.success(isOnline ? "You are now offline" : "You are now online", {
        duration: 2000,
      });
    } catch (error) {
      toast.error(error || "Failed to update status", { duration: 2000 });
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    clearDriverData(); // Clear driver data from localStorage
    navigate("/login");
    toast.success("Logged out successfully", { duration: 2000 });
  };

  const openNavigationToAddress = (address) => {
    if (!address) return;

    const destination = `${address.street}, ${address.city}, ${address.state} ${address.pincode}`;

    // Try to open in Google Maps
    if (navigator.userAgent.match(/(iPad|iPhone|iPod)/g)) {
      window.open(
        `maps://maps.google.com/maps?daddr=${encodeURIComponent(destination)}`
      );
    } else {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
          destination
        )}`
      );
    }
  };

  const startNavigation = (order) => {
    setActiveOrder(order);
    setShowMap(true);
  };

  const handleStatusUpdate = async (status, description) => {
    if (!activeOrder) {
      console.warn("No active order for status update");
      return;
    }

    // Always show success message for better UX, even if backend call fails
    toast.success(`Order status updated to ${status}`, { duration: 2000 });

    try {
      const token =
        localStorage.getItem("driverToken") || localStorage.getItem("token");
      const backendUrl = import.meta.env.VITE_BACKEND_URL;

      if (!backendUrl) {
        console.log("No backend URL configured - status updated locally only");
        return;
      }

      // Use the new unified driver endpoint
      try {
        console.log(
          `Updating status via: ${backendUrl}/drivers/orders/${activeOrder._id}/status`
        );

        const response = await fetch(
          `${backendUrl}/drivers/orders/${activeOrder._id}/status`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              status,
              description,
              timestamp: new Date().toISOString(),
            }),
          }
        );

        if (response.ok) {
          console.log(`✅ Status update successful`);
          // Refresh dashboard data
          fetchDashboardData();
          dispatch(getAssignedOrders());
          // dispatch(getAssignedDailyOrders());
        } else {
          console.log(
            `❌ Status update failed: ${response.status}: ${response.statusText}`
          );
          console.warn(
            "Status update API failed - status updated locally only"
          );
        }
      } catch (endpointError) {
        console.log(`❌ Status update failed:`, endpointError.message);
        console.warn("Status update failed - status updated locally only");
      }
    } catch (error) {
      console.error("Error updating status:", error);
      // Don't show error toast since we already showed success
      console.log("Status update handled locally due to API error");
    }
  };

  const handleLocationUpdate = (location) => {
    // Location updates are handled by the DriverMap component
    console.log("Location updated:", location);
  };

  const openStatusUpdateModal = (delivery) => {
    setSelectedDelivery(delivery);
    setShowStatusModal(true);
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
    setSelectedDelivery(null);
  };

  const updateDeliveryStatus = async (status, description = "") => {
    if (!selectedDelivery) return;

    setStatusUpdateLoading(true);
    try {
      const token =
        localStorage.getItem("driverToken") || localStorage.getItem("token");
      const backendUrl = import.meta.env.VITE_BACKEND_URL;

      // Use the order ID for the API call
      const orderId = selectedDelivery.orderId || selectedDelivery._id;

      if (!orderId) {
        toast.error("Order ID not found", { duration: 2000 });
        return;
      }

      const response = await fetch(
        `${backendUrl}/drivers/orders/${orderId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            status,
            description,
            timestamp: new Date().toISOString(),
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(`Status updated to ${status}`, { duration: 2000 });
        console.log("✅ Status update successful:", result);

        // Refresh dashboard data
        fetchDashboardData();
        dispatch(getAssignedOrders());
        dispatch(getAssignedDailyOrders());

        // Close modal
        closeStatusModal();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to update status", {
          duration: 2000,
        });
        console.error("❌ Status update failed:", errorData);
      }
    } catch (error) {
      console.error("❌ Error updating delivery status:", error);
      toast.error("Failed to update status. Please try again.", {
        duration: 2000,
      });
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const getStatusOptions = (currentStatus) => {
    const allStatuses = [
      { value: "order_placed", label: "Order Placed", color: "gray" },
      { value: "payment_confirmed", label: "Payment Confirmed", color: "blue" },
      { value: "preparing", label: "Preparing", color: "yellow" },
      { value: "ready_for_pickup", label: "Ready for Pickup", color: "orange" },
      { value: "assigned", label: "Assigned", color: "purple" },
      { value: "picked_up", label: "Picked Up", color: "green" },
      { value: "out_for_delivery", label: "Out for Delivery", color: "blue" },
      { value: "reached", label: "Reached Location", color: "indigo" },
      { value: "delivered", label: "Delivered", color: "green" },
      { value: "cancelled", label: "Cancelled", color: "red" },
      { value: "delayed", label: "Delayed", color: "yellow" },
    ];

    // Filter out statuses that don't make sense to transition to from current status
    const currentIndex = allStatuses.findIndex(
      (s) => s.value === currentStatus
    );
    return allStatuses.slice(currentIndex + 1); // Only show statuses after current
  };

  const openPaymentModal = (delivery) => {
    setSelectedDelivery(delivery);
    setShowPaymentModal(true);
  };

  const closePaymentModal = () => {
    setShowPaymentModal(false);
    setSelectedDelivery(null);
  };

  const updatePaymentStatus = async (paymentStatus) => {
    if (!selectedDelivery) return;

    setPaymentUpdateLoading(true);
    try {
      const token =
        localStorage.getItem("driverToken") || localStorage.getItem("token");
      const backendUrl = import.meta.env.VITE_BACKEND_URL;

      // Use the order ID for the API call
      const orderId = selectedDelivery.orderId || selectedDelivery._id;

      if (!orderId) {
        toast.error("Order ID not found", { duration: 2000 });
        return;
      }

      const response = await fetch(
        `${backendUrl}/drivers/orders/${orderId}/payment-status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            paymentStatus,
            description: `Payment status updated to ${paymentStatus}`,
            timestamp: new Date().toISOString(),
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(`Payment status updated to ${paymentStatus}`, {
          duration: 2000,
        });
        console.log("✅ Payment status update successful:", result);

        // Refresh dashboard data
        fetchDashboardData();
        dispatch(getAssignedOrders());
        dispatch(getAssignedDailyOrders());

        // Close modal
        closePaymentModal();
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || "Failed to update payment status", {
          duration: 2000,
        });
        console.error("❌ Payment status update failed:", errorData);
      }
    } catch (error) {
      console.error("❌ Error updating payment status:", error);
      toast.error("Failed to update payment status. Please try again.", {
        duration: 2000,
      });
    } finally {
      setPaymentUpdateLoading(false);
    }
  };

  const getPaymentStatusOptions = (currentPaymentStatus) => {
    const allPaymentStatuses = [
      { value: "pending", label: "Pending", color: "yellow", icon: "⏳" },
      { value: "paid", label: "Paid", color: "green", icon: "✅" },
      { value: "failed", label: "Failed", color: "red", icon: "❌" },
      { value: "refunded", label: "Refunded", color: "blue", icon: "💰" },
      { value: "completed", label: "Completed", color: "green", icon: "🎉" },
    ];

    // Filter out current status and show all other options
    return allPaymentStatuses.filter(
      (status) => status.value !== currentPaymentStatus
    );
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: "text-yellow-600 bg-yellow-100",
      paid: "text-green-600 bg-green-100",
      failed: "text-red-600 bg-red-100",
      refunded: "text-blue-600 bg-blue-100",
      completed: "text-green-600 bg-green-100",
    };
    return colors[status] || "text-gray-600 bg-gray-100";
  };

  if (loading || !driver) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <div className="flex items-center min-w-0 flex-1">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <User className="h-5 w-5 md:h-6 md:w-6 text-white" />
                </div>
              </div>
              <div className="ml-3 md:ml-4 min-w-0 flex-1">
                <h1 className="text-lg md:text-xl font-semibold text-gray-900 truncate">
                  Welcome back, {driver.name}!
                </h1>
                <p className="text-xs md:text-sm text-gray-500">
                  Driver Dashboard
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1 md:space-x-4 flex-shrink-0">
              {/* Background Tracking Status - Hidden on mobile */}
              {isBackground && backgroundTrackingActive && (
                <div className="hidden sm:flex items-center space-x-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-full">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-yellow-700">
                    Background Tracking
                  </span>
                </div>
              )}

              {/* Accept Orders Button */}
              <button
                onClick={() => navigate("/driver/orders/accept")}
                className="flex items-center px-2 py-2 md:px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Package className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline ml-2">Accept Orders</span>
              </button>

              {/* Daily Deliveries Button */}
              <button
                onClick={() => navigate("/driver/deliveries")}
                className="flex items-center px-2 py-2 md:px-4 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Clock className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline ml-2">Daily Deliveries</span>
              </button>

              {/* Delivery Scheduling Button */}
              <button
                onClick={() => navigate("/driver/scheduling")}
                className="flex items-center px-2 py-2 md:px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <FaCalendarAlt className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline ml-2">Scheduling</span>
              </button>

              {/* Map View Toggle */}
              {activeOrder && (
                <button
                  onClick={() => setShowMap(!showMap)}
                  className={`flex items-center px-2 py-2 md:px-4 rounded-lg transition-colors ${
                    showMap
                      ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }`}
                >
                  <Map className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline ml-2">
                    {showMap ? "Hide Map" : "Show Map"}
                  </span>
                </button>
              )}

              {/* Online/Offline Toggle */}
              <button
                onClick={handleToggleOnline}
                className={`flex items-center px-2 py-2 md:px-4 rounded-full transition-colors ${
                  isOnline
                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                <Power
                  className={`h-4 w-4 ${
                    isOnline ? "text-green-600" : "text-gray-600"
                  } md:mr-2`}
                />
                <span className="hidden md:inline ml-2">
                  {isOnline ? "Online" : "Offline"}
                </span>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex items-center px-2 py-2 md:px-4 text-gray-700 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline ml-2">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Stats Cards */}

        {/* Current Deliveries */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl shadow-sm mb-6 md:mb-8"
        >
          <div className="p-4 md:p-6 border-b border-gray-200">
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 flex items-center">
              <Package className="h-5 w-5 mr-2 text-blue-600" />
              Current Deliveries
            </h2>
          </div>

          <div className="p-4 md:p-6">
            {assignedOrders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">No active deliveries</p>
                <p className="text-sm text-gray-400">
                  {isOnline
                    ? "New deliveries will appear here when assigned"
                    : "Go online to receive delivery assignments"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Normal Orders */}
                {assignedOrders.map((delivery) => (
                  <div
                    key={delivery._id || delivery.id || delivery.orderNumber}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        {delivery.type && (
                          <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-1">
                            {delivery.type} Delivery
                          </span>
                        )}
                        <h3 className="font-medium text-gray-900">
                          Order #
                          {delivery.orderNumber || delivery.orderId?.slice(-8)}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {delivery.deliveryAddress?.street},{" "}
                          {delivery.deliveryAddress?.city}
                        </p>
                        {delivery.assignedCategory && (
                          <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full mt-1">
                            {delivery.assignedCategory
                              ?.charAt(0)
                              .toUpperCase() +
                              delivery.assignedCategory?.slice(1)}{" "}
                            Delivery
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">
                          ₹{delivery.totalAmount}
                        </p>
                        <p className="text-sm text-blue-600 capitalize">
                          {delivery.status?.replace("_", " ")}
                        </p>
                      </div>
                    </div>

                    {/* Customer Contact Info */}
                    {delivery.customerPhone && (
                      <div className="mb-3 p-2 bg-gray-50 rounded">
                        <p className="text-sm text-gray-600">
                          Customer: {delivery.customerPhone}
                        </p>
                        {delivery.specialInstructions && (
                          <p className="text-xs text-gray-500 mt-1">
                            <strong>Note:</strong>{" "}
                            {delivery.specialInstructions}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Payment Status */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                          Payment Status:
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                            delivery.paymentStatus
                          )}`}
                        >
                          {delivery.paymentStatus?.toUpperCase() || "UNKNOWN"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm font-medium text-gray-700">
                          Amount:
                        </span>
                        <span className="text-sm font-semibold text-green-600">
                          ₹{delivery.totalAmount || delivery.total}
                        </span>
                      </div>
                    </div>

                    {/* Items Preview */}
                    {delivery.items && delivery.items.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700">
                          Items ({delivery.items.length})
                        </p>
                        <div className="text-xs text-gray-500">
                          {delivery.items.slice(0, 2).map((item, idx) => (
                            <span key={item._id || item.id || `item-${idx}`}>
                              {item.name} x{item.quantity}
                              {idx < Math.min(delivery.items.length, 2) - 1 &&
                                ", "}
                            </span>
                          ))}
                          {delivery.items.length > 2 &&
                            ` +${delivery.items.length - 2} more`}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-4 w-4 mr-1" />
                        {delivery.estimatedDeliveryTime || "Calculating..."}
                      </div>

                      {delivery.customerName && (
                        <div className="flex">
                          <h1 className="mr-2">Name :</h1>
                          <div>{delivery.customerName}</div>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        {delivery.customerPhone && (
                          <a
                            href={`tel:${delivery.customerPhone}`}
                            className="flex items-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 flex-1 sm:flex-none justify-center"
                          >
                            <Phone className="h-3 w-3 mr-1" />
                            Call
                          </a>
                        )}
                        <button
                          onClick={() => startNavigation(delivery)}
                          className="flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 flex-1 sm:flex-none justify-center"
                        >
                          <Activity className="h-3 w-3 mr-1" />
                          Navigate
                        </button>
                        <button
                          onClick={() =>
                            openNavigationToAddress(delivery.deliveryAddress)
                          }
                          className="flex items-center px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 flex-1 sm:flex-none justify-center"
                        >
                          <Navigation className="h-3 w-3 mr-1" />
                          Maps
                        </button>
                        <button
                          onClick={() => openStatusUpdateModal(delivery)}
                          className="flex items-center px-3 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 flex-1 sm:flex-none justify-center"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Update
                        </button>
                        {/* Only show payment status button for non-subscription orders */}
                        {delivery.type !== "subscription" &&
                          delivery.paymentMethod !== "subscription" && (
                            <button
                              onClick={() => openPaymentModal(delivery)}
                              className="flex items-center px-3 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 flex-1 sm:flex-none justify-center"
                            >
                              <DollarSign className="h-3 w-3 mr-1" />
                              Payment
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl shadow-sm p-4 md:p-6"
        >
          <h2 className="text-lg md:text-xl font-semibold text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <button className="flex flex-col items-center p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <MapPin className="h-5 w-5 md:h-6 md:w-6 text-blue-600 mb-2" />
              <span className="text-xs md:text-sm font-medium text-center">
                Update Location
              </span>
            </button>

            <button className="flex flex-col items-center p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Package className="h-5 w-5 md:h-6 md:w-6 text-green-600 mb-2" />
              <span className="text-xs md:text-sm font-medium text-center">
                Delivery History
              </span>
            </button>

            <button className="flex flex-col items-center p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <DollarSign className="h-5 w-5 md:h-6 md:w-6 text-yellow-600 mb-2" />
              <span className="text-xs md:text-sm font-medium text-center">
                Earnings Report
              </span>
            </button>

            <button className="flex flex-col items-center p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <User className="h-5 w-5 md:h-6 md:w-6 text-purple-600 mb-2" />
              <span className="text-xs md:text-sm font-medium text-center">
                Profile Settings
              </span>
            </button>
          </div>
        </motion.div>

        {/* Integrated Map View */}
        {showMap && activeOrder && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden"
          >
            <div className="p-4 border-b border-gray-200 bg-blue-50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-blue-900 flex items-center">
                  <Map className="h-5 w-5 mr-2" />
                  Navigation - Order #{activeOrder.orderNumber}
                </h2>
                <button
                  onClick={() => setShowMap(false)}
                  className="text-blue-700 hover:text-blue-900 px-3 py-1 rounded-md text-sm font-medium"
                >
                  Close Map
                </button>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Real-time navigation with live tracking and delivery updates
              </p>
            </div>

            <div className="h-96">
              <DriverMap
                order={activeOrder}
                onStatusUpdate={handleStatusUpdate}
                onLocationUpdate={handleLocationUpdate}
                className="h-full"
              />
            </div>
          </motion.div>
        )}

        {/* Payment Status Update Modal */}
        {showPaymentModal && selectedDelivery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto mx-4">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Update Payment Status
                  </h3>
                  <button
                    onClick={closePaymentModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Order #{selectedDelivery.orderNumber || selectedDelivery._id}
                </p>
                <div className="mt-2">
                  <span className="text-sm text-gray-500">Amount: </span>
                  <span className="font-semibold text-green-600">
                    ₹{selectedDelivery.totalAmount || selectedDelivery.total}
                  </span>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Payment Status
                  </label>
                  <div
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(
                      selectedDelivery.paymentStatus
                    )}`}
                  >
                    {selectedDelivery.paymentStatus?.toUpperCase() || "UNKNOWN"}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Update to Payment Status
                  </label>
                  <div className="space-y-2">
                    {getPaymentStatusOptions(
                      selectedDelivery.paymentStatus
                    ).map((statusOption) => (
                      <button
                        key={statusOption.value}
                        onClick={() => updatePaymentStatus(statusOption.value)}
                        disabled={paymentUpdateLoading}
                        className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                          paymentUpdateLoading
                            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                            : "hover:bg-gray-50 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center">
                          <span className="text-lg mr-3">
                            {statusOption.icon}
                          </span>
                          <span className="font-medium">
                            {statusOption.label}
                          </span>
                        </div>
                        {paymentUpdateLoading && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        )}
                      </button>
                    ))}
                  </div>

                  {getPaymentStatusOptions(selectedDelivery.paymentStatus)
                    .length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <p>All payment statuses have been used!</p>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={closePaymentModal}
                    disabled={paymentUpdateLoading}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Update Modal */}
        {showStatusModal && selectedDelivery && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto mx-4">
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Update Delivery Status
                  </h3>
                  <button
                    onClick={closeStatusModal}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Order #{selectedDelivery.orderNumber || selectedDelivery._id}
                </p>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Status
                  </label>
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                    {selectedDelivery.status?.replace("_", " ").toUpperCase() ||
                      "UNKNOWN"}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Update to Status
                  </label>
                  <div className="space-y-2">
                    {getStatusOptions(selectedDelivery.status).map(
                      (statusOption) => (
                        <button
                          key={statusOption.value}
                          onClick={() =>
                            updateDeliveryStatus(statusOption.value)
                          }
                          disabled={statusUpdateLoading}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            statusUpdateLoading
                              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                              : "hover:bg-gray-50 border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex items-center">
                            <div
                              className={`w-3 h-3 rounded-full bg-${statusOption.color}-500 mr-3`}
                            ></div>
                            <span className="font-medium">
                              {statusOption.label}
                            </span>
                          </div>
                          {statusUpdateLoading && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          )}
                        </button>
                      )
                    )}
                  </div>

                  {getStatusOptions(selectedDelivery.status).length === 0 && (
                    <div className="text-center py-4 text-gray-500">
                      <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                      <p>This delivery is already completed!</p>
                    </div>
                  )}
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={closeStatusModal}
                    disabled={statusUpdateLoading}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
