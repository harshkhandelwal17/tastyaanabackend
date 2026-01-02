import React, { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  Filter,
  CheckCircle,
  XCircle,
  Package,
  Truck,
  User,
  Phone,
  MapPin,
  Search,
  RefreshCw,
  Eye,
  Edit3,
  MoreVertical,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
// Status options for filter dropdown
const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "out_for_delivery", label: "Out for Delivery" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

// DeliveryCard component moved outside of DailyMealDelivery
const DeliveryCard = ({ delivery, shift: deliveryShift, onStatusUpdate }) => {
  // Get auth user from Redux
  const authUser = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // The delivery object now contains subscription data directly
  const {
    _id: deliveryId,
    subscriptionId,
    user = {},
    mealPlan = {},
    deliveryDate,
    shift = deliveryShift || "lunch",
    status = "pending",
    thaliCount = 1,
    customizations = [],
    notes,
    deliveredAt,
    updatedAt,
    pricing = {},
  } = delivery;

  // Format delivery date
  const formattedDate = deliveryDate
    ? new Date(deliveryDate).toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "Not scheduled";

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "out_for_delivery":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Format delivered time if available
  const formatDeliveredTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return `at ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  return (
    <div
      className={`bg-white rounded-lg shadow-sm border ${
        status === "delivered" ? "border-green-200" : "border-gray-200"
      } overflow-hidden`}
    >
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-medium text-gray-900">
            {user?.name || "Customer"}
          </h3>
          <div className="flex flex-col items-end">
            <span
              className={`px-2 py-1 text-xs rounded-full ${getStatusColor(
                status
              )} font-medium`}
            >
              {status === "delivered"
                ? "✓ Delivered"
                : status.replace(/_/g, " ")}
            </span>
            {status === "delivered" && deliveredAt && (
              <span className="text-xs text-gray-500 mt-1">
                {formatDeliveredTime(deliveredAt)}
              </span>
            )}
          </div>
        </div>

        <div className="text-sm text-gray-600 mb-2">
          <p className="font-medium">{mealPlan?.name || "Regular Meal"}</p>
          <p className="flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
            {formattedDate} • {shift}
          </p>
          <p className="flex items-center">
            <Package className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
            {thaliCount} Thali{thaliCount > 1 ? "s" : ""}
          </p>
        </div>

        {customizations?.length > 0 && (
          <div className="mt-2 text-sm">
            <p className="font-medium text-gray-700 flex items-center">
              <span>Customizations:</span>
            </p>
            <ul className="list-disc pl-5 mt-1">
              {customizations.map((item, index) => (
                <li key={index} className="text-gray-600">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}

        {status !== "delivered" && (
          <div className="mt-4 pt-3 border-t border-gray-100">
            <div className="flex space-x-2">
              <button
                onClick={() =>
                  onStatusUpdate({ ...delivery, status: "out_for_delivery" })
                }
                className="flex-1 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-100 transition-colors flex items-center justify-center"
              >
                <Truck className="w-3.5 h-3.5 mr-1.5" />
                Out for Delivery
              </button>
              <button
                onClick={() =>
                  onStatusUpdate({ ...delivery, status: "delivered" })
                }
                className="flex-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-md text-sm font-medium hover:bg-green-100 transition-colors flex items-center justify-center"
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                Mark Delivered
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const DailyMealDelivery = () => {
  const [deliveries, setDeliveries] = useState({ morning: [], evening: [] });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    date: new Date().toISOString().split("T")[0],
    shift: "",
    status: "",
    userId: "",
    search: "",
  });
  const [stats, setStats] = useState({});
  const [selectedDeliveries, setSelectedDeliveries] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [pagination, setPagination] = useState({});
  const authUser = useSelector((state) => state.auth.user);
  // Get seller ID from auth context or localStorage
  const sellerId = authUser?.id || authUser?._id; // Adjust based on your auth implementation
  console.log("sellerid is ", sellerId);
  useEffect(() => {
    fetchDeliveries();
    fetchStats();
  }, [filters]);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);

      // Build query parameters
      const params = new URLSearchParams();
      if (filters.date) params.append("date", filters.date);
      if (filters.shift) params.append("shift", filters.shift);
      if (filters.status) params.append("status", filters.status);
      if (pagination.page) params.append("page", pagination.page);
      params.append("limit", 10);

      console.log(
        "🔍 Fetching subscription deliveries with params:",
        Object.fromEntries(params)
      );

      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required. Please log in.");
        return;
      }

      // Fetch upcoming deliveries from the subscription endpoint
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/subscriptions/upcoming-deliveries?${params}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          timeout: 10000, // 10 second timeout
        }
      );

      console.log("📦 Subscription Deliveries Response:", response.data);

      // Transform the response to match the expected format
      const processedDeliveries = response.data.data
        .map((delivery) => ({
          ...delivery,
          _id:
            delivery._id ||
            `${delivery.subscriptionId}-${delivery.deliveryDate}-${delivery.shift}`,
          deliveryDate: delivery.deliveryDate,
          shift: delivery.shift,
          status: delivery.status || "pending",
          thaliCount: delivery.thaliCount || 1,
          customizations: delivery.customizations || [],
          isActive: delivery.isActive !== false, // default to true if not set
          user: delivery.user || {},
          mealPlan: delivery.mealPlan || {},
        }))
        .filter((delivery) => {
          // Apply filters that weren't handled by the API
          if (filters.userId && delivery.user?._id !== filters.userId)
            return false;
          return true;
        });

      // Group deliveries by shift
      const groupedDeliveries = { morning: [], evening: [] };
      processedDeliveries.forEach((delivery) => {
        if (delivery?.shift === "morning") {
          groupedDeliveries.morning.push(delivery);
        } else if (delivery?.shift === "evening") {
          groupedDeliveries.evening.push(delivery);
        }
      });

      setDeliveries(groupedDeliveries);

      // Update pagination
      setPagination({
        page: response.data.page || 1,
        totalPages: response.data.pages || 1,
        totalCount: response.data.count || processedDeliveries.length,
      });

      // Calculate stats
      const stats = {
        total: processedDeliveries?.length,
        delivered: processedDeliveries?.filter((d) => d?.status === "delivered")
          ?.length,
        pending: processedDeliveries?.filter((d) => d?.status === "pending")
          ?.length,
        outForDelivery: processedDeliveries?.filter(
          (d) => d?.status === "out_for_delivery"
        )?.length,
        preparing: processedDeliveries?.filter((d) => d?.status === "preparing")
          ?.length,
      };
      setStats(stats);
    } catch (error) {
      console.error("Error fetching subscription deliveries:", {
        name: error.name,
        message: error.message,
        response: error.response
          ? {
              status: error.response.status,
              statusText: error.response.statusText,
              data: error.response.data,
            }
          : "No response",
        request: error.request
          ? "Request was made but no response received"
          : "No request was made",
      });

      if (error.response) {
        if (error.response.status === 401) {
          toast.error("Session expired. Please log in again.");
        } else if (error.response.status === 404) {
          toast.error("No deliveries found for the selected criteria");
        } else {
          toast.error(
            error.response.data?.message || "Failed to fetch deliveries"
          );
        }
      } else if (error.request) {
        console.error("No response received from server");
        toast.error(
          "Unable to connect to server. Please check your connection."
        );
      } else {
        console.error("Error details:", error);
        toast.error("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeliverySelect = (deliveryId) => {
    setSelectedDeliveries((prevSelected) => {
      // Toggle selection - remove if exists, add if not
      const newSelection = prevSelected.includes(deliveryId)
        ? prevSelected.filter((id) => id !== deliveryId)
        : [...prevSelected, deliveryId];

      // Show bulk actions if any items are selected
      setShowBulkActions(newSelection.length > 0);
      return newSelection;
    });
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(
        `${
          import.meta.env.VITE_BACKEND_URL
        }/daily-meal-delivery/seller/${sellerId}/stats`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleStatusUpdate = async (delivery) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication required. Please log in.");
        return;
      }

      // Format the date to YYYY-MM-DD if it's not already in that format
      const formattedDate = new Date(delivery.deliveryDate)
        .toISOString()
        .split("T")[0];

      const response = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/subscriptions/${
          delivery.subscriptionId
        }/delivery-tracking/status`,
        {
          status: delivery.status.toLowerCase(),
          date: formattedDate,
          shift: delivery.shift.toLowerCase(),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        toast.success(`Delivery status updated to ${delivery.status}`);
        fetchDeliveries();
      }
    } catch (error) {
      console.error("Error updating delivery status:", {
        error: error.response?.data || error.message,
        delivery,
      });
      toast.error(
        error.response?.data?.message || "Failed to update delivery status"
      );
    }
  };

  const bulkUpdateStatus = async (status) => {
    if (selectedDeliveries.length === 0) {
      toast.error("Please select deliveries to update");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");

      // Process each delivery update individually since they might belong to different subscriptions
      const updatePromises = selectedDeliveries.map((deliveryId) => {
        // Format: `${subscription._id}-${tracking.date}-${tracking.shift}`
        const [subscriptionId, date, shift] = deliveryId.split("-");

        if (!subscriptionId || !date || !shift) {
          console.error("Invalid delivery ID format:", deliveryId);
          return Promise.resolve();
        }

        return axios
          .put(
            `${
              import.meta.env.VITE_BACKEND_URL
            }/subscriptions/${subscriptionId}/delivery-tracking/status`,
            {
              date: new Date(date),
              shift,
              status,
              deliveredBy: authUser._id,
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          )
          .catch((error) => {
            console.error(`Failed to update delivery ${deliveryId}:`, error);
            return {
              error: true,
              message: error.response?.data?.message || "Update failed",
            };
          });
      });

      // Wait for all updates to complete
      const results = await Promise.allSettled(updatePromises);

      // Count successful and failed updates
      const successfulUpdates = results.filter(
        (r) => r.status === "fulfilled" && !r.value.error
      ).length;
      const failedUpdates = results.length - successfulUpdates;

      if (successfulUpdates > 0) {
        toast.success(`Successfully updated ${successfulUpdates} deliveries`);
      }

      if (failedUpdates > 0) {
        toast.error(`Failed to update ${failedUpdates} deliveries`);
      }

      setSelectedDeliveries([]);
      setShowBulkActions(false);
      fetchDeliveries();
    } catch (error) {
      console.error("Error in bulk update process:", error);
      toast.error("An error occurred while processing bulk updates");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusConfig = statusOptions.find((opt) => opt.value === status);
    return statusConfig ? statusConfig.color : "gray";
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="w-4 h-4" />;
      case "not_delivered":
        return <XCircle className="w-4 h-4" />;
      case "preparing":
        return <Package className="w-4 h-4" />;
      case "out_for_delivery":
        return <Truck className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">
          Daily Meal Deliveries
        </h2>
        <div className="flex items-center space-x-2">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => setShowBulkActions(true)}
          >
            Bulk Update
          </button>
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={fetchDeliveries}
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deliveries.morning.length > 0 && (
              <div className="col-span-full">
                <h2 className="text-lg font-semibold mb-4">
                  Morning Deliveries
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deliveries.morning.map((delivery) => (
                    <DeliveryCard
                      key={delivery._id}
                      delivery={delivery}
                      shift="morning"
                      onStatusUpdate={handleStatusUpdate}
                    />
                  ))}
                </div>
              </div>
            )}

            {deliveries.evening.length > 0 && (
              <div className="col-span-full mt-8">
                <h2 className="text-lg font-semibold mb-4">
                  Evening Deliveries
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {deliveries.evening.map((delivery) => (
                    <DeliveryCard
                      key={delivery._id}
                      delivery={delivery}
                      shift="evening"
                      onStatusUpdate={handleStatusUpdate}
                    />
                  ))}
                </div>
              </div>
            )}

            {deliveries.morning.length === 0 &&
              deliveries.evening.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <p className="text-gray-500">
                    No deliveries found for the selected filters.
                  </p>
                </div>
              )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">
                Total Deliveries
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalDeliveries || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Delivered</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.deliveredCount || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.pendingCount || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Truck className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Delivery Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.deliveryRate || 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, date: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Shift
            </label>
            <select
              value={filters.shift}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, shift: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Both Shifts</option>
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, status: e.target.value }))
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search User
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, phone..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={fetchDeliveries}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyMealDelivery;
