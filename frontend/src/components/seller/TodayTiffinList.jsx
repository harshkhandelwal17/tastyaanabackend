import React, { useState, useEffect } from "react";
import {
  ChefHat,
  Clock,
  User,
  Phone,
  AlertTriangle,
  CheckCircle,
  Package,
  ArrowLeft,
  RefreshCw,
  Filter,
  Search,
  MapPin,
  Truck,
  History,
  XCircle,
  X,
  AlertCircle,
  // AlertCircle,
  IndianRupee,
  UtensilsCrossed,
} from "lucide-react";
import { useSelector } from "react-redux";
import { useParams, Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";
import {
  useGetTodayTiffinListQuery,
  useUpdateTiffinStatusMutation,
  useBulkAssignTiffinsMutation,
  useGetAvailableDriversQuery,
} from "../../redux/Slices/sellerTiffinApi";

const TodayTiffinList = () => {
  const { shift } = useParams();
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [tiffinHistory, setTiffinHistory] = useState([]);
  // const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState("");
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  // History filter states
  const [historyStartDate, setHistoryStartDate] = useState("");
  const [historyEndDate, setHistoryEndDate] = useState("");
  const [historyShift, setHistoryShift] = useState("all");
  const [historyStatus, setHistoryStatus] = useState("all");
  axios.defaults.withCredentials = true;
  const { token } = useSelector((state) => state.auth);
  // Use Redux RTK Query
  const {
    data: tiffinData,
    isLoading: loading,
    error,
    refetch,
  } = useGetTodayTiffinListQuery(shift, {
    skip: !shift || !["morning", "evening"].includes(shift),
  });
  // if(!loading){
  //   console.log("tiffin data",tiffinData)
  // }
  const [updateTiffinStatus] = useUpdateTiffinStatusMutation();
  const [bulkAssignTiffins] = useBulkAssignTiffinsMutation();
  // const { data: driversData } = useGetAvailableDriversQuery();

  const handleShowHistory = () => {
    setShowHistoryDialog(true);
    if (tiffinHistory.length === 0) {
      fetchTiffinHistory();
    }
  };

  const handleApplyHistoryFilters = () => {
    fetchTiffinHistory({
      startDate: historyStartDate,
      endDate: historyEndDate,
      shift: historyShift,
      status: historyStatus,
    });
  };

  const handleClearHistoryFilters = () => {
    setHistoryStartDate("");
    setHistoryEndDate("");
    setHistoryShift("all");
    setHistoryStatus("all");
    fetchTiffinHistory({
      startDate: "",
      endDate: "",
      shift: "all",
      status: "all",
    });
  };

  const setDatePreset = (preset) => {
    const today = new Date();
    const formatDate = (date) => date.toISOString().split("T")[0];

    switch (preset) {
      case "today":
        setHistoryStartDate(formatDate(today));
        setHistoryEndDate(formatDate(today));
        break;
      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        setHistoryStartDate(formatDate(yesterday));
        setHistoryEndDate(formatDate(yesterday));
        break;
      case "last7days":
        const last7Days = new Date(today);
        last7Days.setDate(last7Days.getDate() - 7);
        setHistoryStartDate(formatDate(last7Days));
        setHistoryEndDate(formatDate(today));
        break;
      case "last30days":
        const last30Days = new Date(today);
        last30Days.setDate(last30Days.getDate() - 30);
        setHistoryStartDate(formatDate(last30Days));
        setHistoryEndDate(formatDate(today));
        break;
      case "thisMonth":
        const firstDayOfMonth = new Date(
          today.getFullYear(),
          today.getMonth(),
          1
        );
        setHistoryStartDate(formatDate(firstDayOfMonth));
        setHistoryEndDate(formatDate(today));
        break;
      default:
        break;
    }
  };

  const fetchTiffinHistory = async (customFilters = {}) => {
    try {
      setHistoryLoading(true);

      // Build query parameters
      const params = new URLSearchParams();

      // Use custom filters if provided, otherwise use state
      const startDate = customFilters.startDate || historyStartDate;
      const endDate = customFilters.endDate || historyEndDate;
      const shift = customFilters.shift || historyShift;
      const status = customFilters.status || historyStatus;

      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);
      if (shift && shift !== "all") params.append("shift", shift);
      if (status && status !== "all") params.append("status", status);

      const url = `${import.meta.env.VITE_BACKEND_URL}/seller/tiffin/history${
        params.toString() ? "?" + params.toString() : ""
      }`;
      const response = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      setTiffinHistory(response.data.data || []);
    } catch (error) {
      console.error("Error fetching tiffin history:", error);
      toast.error("Failed to load tiffin history");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (shift && !["morning", "evening"].includes(shift)) {
      toast.error("Invalid shift parameter");
      navigate("/seller/dashboard");
    }
  }, [shift, navigate]);

  const handleUpdateTiffinStatus = async (orderId, status, notes = "") => {
    try {
      setUpdating(orderId);
      await updateTiffinStatus({ orderId, status, notes }).unwrap();
      toast.success("Tiffin status updated successfully");
    } catch (error) {
      console.error("Error updating tiffin status:", error);
      toast.error("Failed to update tiffin status");
    } finally {
      setUpdating(null);
    }
  };

  const handleBulkAssign = async () => {
    if (!selectedDriver) {
      toast.error("Please select a driver");
      return;
    }

    try {
      const result = await bulkAssignTiffins({
        shift,
        driverId: selectedDriver,
      }).unwrap();

      toast.success(result.message);
      // setShowBulkAssignModal(false);
      setSelectedDriver("");
    } catch (error) {
      console.error("Error bulk assigning tiffins:", error);
      toast.error(error?.data?.message || "Failed to assign tiffins");
    }
  };

  // Define filteredOrders first
  const filteredOrders =
    tiffinData?.data?.orders?.filter((order) => {
      const matchesFilter = filter === "all" || order.status === filter;
      const matchesSearch =
        !searchTerm ||
        order.subscriptionId
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        order.customerInfo?.name
          ?.toLowerCase()
          .includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
    }) || [];

  const readyOrdersCount = filteredOrders.filter(
    (order) => order.status === "ready_for_pickup" && !order.assignedDriver
  ).length;

  const getStatusColor = (status, isDelayed = false) => {
    if (isDelayed) {
      return "bg-red-100 text-red-800 border border-red-300";
    }
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      preparing: "bg-orange-100 text-orange-800",
      ready_for_pickup: "bg-green-100 text-green-800",
      assigned: "bg-purple-100 text-purple-800",
      picked_up: "bg-indigo-100 text-indigo-800",
      delivered: "bg-emerald-100 text-emerald-800",
      not_prepared: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };
  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-4 h-4" />,
      confirmed: <CheckCircle className="w-4 h-4" />,
      preparing: <ChefHat className="w-4 h-4" />,
      ready_for_pickup: <Package className="w-4 h-4" />,
      assigned: <User className="w-4 h-4" />,
      picked_up: <Truck className="w-4 h-4" />,
      delivered: <CheckCircle className="w-4 h-4" />,
      not_prepared: <XCircle className="w-4 h-4" />,
    };
    return icons[status] || <Clock className="w-4 h-4" />;
  };

  const StatusButton = ({ order, status, label, variant = "primary" }) => {
    const variants = {
      primary: "bg-blue-600 hover:bg-blue-700 text-white",
      success: "bg-green-600 hover:bg-green-700 text-white",
      warning: "bg-orange-600 hover:bg-orange-700 text-white",
      danger: "bg-red-600 hover:bg-red-700 text-white",
    };

    return (
      <button
        onClick={() => handleUpdateTiffinStatus(order.id, status)}
        disabled={updating === order.id}
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${variants[variant]} disabled:opacity-50`}
      >
        {updating === order.id ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          label
        )}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading tiffin list...</p>
        </div>
      </div>
    );
  }
  const HistoryDialog = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <History className="w-5 h-5" />
            Tiffin Delivery History
          </h2>
          <button
            onClick={() => setShowHistoryDialog(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Section */}
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          {/* Date Presets */}
          {/* <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">Quick Date Presets:</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setDatePreset('today')}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => setDatePreset('yesterday')}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
              >
                Yesterday
              </button>
              <button
                onClick={() => setDatePreset('last7days')}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
              >
                Last 7 Days
              </button>
              <button
                onClick={() => setDatePreset('last30days')}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setDatePreset('thisMonth')}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
              >
                This Month
              </button>
            </div>
          </div> */}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <input
                type="date"
                value={historyStartDate}
                onChange={(e) => setHistoryStartDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={historyEndDate}
                onChange={(e) => setHistoryEndDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Shift
              </label>
              <select
                value={historyShift}
                onChange={(e) => setHistoryShift(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">Both Shifts</option>
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={historyStatus}
                onChange={(e) => setHistoryStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="ready_for_pickup">Ready for Pickup</option>
                <option value="assigned">Assigned</option>
                <option value="picked_up">Picked Up</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleApplyHistoryFilters}
              disabled={historyLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Apply Filters
            </button>
            <button
              onClick={handleClearHistoryFilters}
              disabled={historyLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
            >
              <XCircle className="w-4 h-4" />
              Clear Filters
            </button>
            <div className="ml-auto text-xs text-gray-500">
              {tiffinHistory.length} records found
            </div>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {historyLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-orange-600" />
              <span className="ml-2 text-gray-600">Loading history...</span>
            </div>
          ) : tiffinHistory.length > 0 ? (
            <div className="space-y-4">
              {tiffinHistory.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600" />
                      <span className="font-medium text-gray-900">
                        {item.subscriptionId || item._id}
                      </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {item.shift} shift
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.status === "delivered" ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <Clock className="w-4 h-4 text-orange-600" />
                      )}
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          item.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : "bg-orange-100 text-orange-800"
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Date:</span>
                      <div className="font-medium">
                        {new Date(item.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Plan:</span>
                      <div className="font-medium">
                        {item.planType || "Standard"}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        Base Price:
                      </span>
                      <div className="font-medium text-green-600">
                        ₹{item.basePrice || 0}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                    <div>
                      <span className="text-gray-500">Prep Time:</span>
                      <div className="font-medium">
                        {item.preparationTime
                          ? new Date(item.preparationTime).toLocaleTimeString()
                          : "Not set"}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">Delivered:</span>
                      <div className="font-medium">
                        {item.deliveredAt
                          ? new Date(item.deliveredAt).toLocaleTimeString()
                          : "Pending"}
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500 flex items-center gap-1">
                        <User className="w-3 h-3" />
                        Driver:
                      </span>
                      <div className="font-medium">
                        {item.driver ? (
                          <div>
                            <div className="text-gray-900 flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {item.driver.name}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {item.driver.phone}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not assigned</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Items Section */}
                  {item.items && item.items.length > 0 && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <div className="text-xs font-medium text-blue-900 mb-2 flex items-center gap-1">
                        <UtensilsCrossed className="w-3 h-3" />
                        Items:
                      </div>
                      <div className="text-xs text-blue-800">
                        {Array.isArray(item.items) ? (
                          item.items.map((itemDetail, idx) => (
                            <div key={idx} className="mb-1">
                              {typeof itemDetail === "string"
                                ? itemDetail
                                : itemDetail.name || itemDetail}
                            </div>
                          ))
                        ) : (
                          <div>{item.items}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pricing Summary */}
                  {/* {(item.basePrice > 0 || item.totalExtraCost > 0) && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                      <div className="text-xs font-medium text-green-900 mb-2 flex items-center gap-1">
                        <IndianRupee className="w-3 h-3" />
                        Pricing Summary:
                      </div>
                      <div className="text-xs text-green-800 space-y-1">
                        <div className="flex justify-between">
                          <span>Base Price:</span>
                          <span>₹{item.basePrice || 0}</span>
                        </div>
                        {item.totalExtraCost > 0 && (
                          <div className="flex justify-between">
                            <span>Extra Cost:</span>
                            <span>₹{item.totalExtraCost}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-medium border-t border-green-300 pt-1">
                          <span>Total Amount:</span>
                          <span>₹{item.totalPaymentAmount || item.basePrice || 0}</span>
                        </div>
                      </div>
                    </div>
                  )} */}

                  {item.isDelayed && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600" />
                      <span className="text-xs text-red-700">
                        Delayed delivery • Penalty: ₹{item.basePrice || 0}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <History className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No history found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Tiffin delivery history will appear here once orders are
                processed.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={() => setShowHistoryDialog(false)}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Close
          </button>
          <button
            onClick={fetchTiffinHistory}
            disabled={historyLoading}
            className="px-4 py-2 bg-orange-600 text-white hover:bg-orange-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 inline mr-2 ${
                historyLoading ? "animate-spin" : ""
              }`}
            />
            Refresh
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between py-3 sm:py-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <div className="min-w-0 flex-1">
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center gap-2 truncate">
                  <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
                  <span className="truncate">
                    {shift.charAt(0).toUpperCase() + shift.slice(1)} Tiffins
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {tiffinData?.date} • {filteredOrders.length} of{" "}
                  {tiffinData?.count || 0} orders
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
              <button
                onClick={handleShowHistory}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm"
              >
                <History className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">History</span>
              </button>
              <button
                onClick={refetch}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs sm:text-sm"
              >
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-6">
        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="flex items-center gap-2 flex-shrink-0">
                <Filter className="w-4 h-4 text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-0 flex-1 sm:flex-initial"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready_for_pickup">Ready for Pickup</option>
                  <option value="assigned">Assigned</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search by subscription ID or customer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-2 sm:px-3 py-1.5 sm:py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-w-0"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tiffin Orders - Mobile Cards / Desktop Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          {/* Mobile Cards View */}
          <div className="sm:hidden">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`p-3 border-b border-gray-200 last:border-b-0 ${
                  order.handoverFlag === "delay" || order.delayInfo
                    ? "bg-red-50 border-l-4 border-red-400"
                    : ""
                }`}
              >
                {/* Header with subscription ID and status */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 text-sm truncate">
                      {order.subscriptionId}
                    </h3>
                    {order.handoverFlag === "delay" && (
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    )}
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      order.status,
                      order.handoverFlag === "delay" || order.delayInfo
                    )}`}
                  >
                    {getStatusIcon(order.status)}
                    <span className="ml-1">
                      {order.status.replace("_", " ").toUpperCase()}
                    </span>
                  </span>
                </div>

                {/* Details */}
                <div className="grid grid-cols-2 gap-2 mb-2 text-xs">
                  <div>
                    <span className="text-gray-500">Price:</span>
                    <div className="font-medium">₹{order.basePrice}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Prep Time:</span>
                    <div
                      className="font-medium text-xs truncate"
                      title={order.preparationTime}
                    >
                      {order.preparationTime}
                    </div>
                  </div>
                </div>

                {/* Items */}
                <div className="mb-2">
                  <span className="text-gray-500 text-xs">Items:</span>
                  <div className="text-xs text-gray-700 line-clamp-2">
                    {Array.isArray(order.itemForToday)
                      ? order.itemForToday.map((item, index) => (
                          <span key={index}>
                            {typeof item === "string"
                              ? item
                              : item.name || item}
                            {index < order.itemForToday.length - 1 && ", "}
                          </span>
                        ))
                      : order.itemForToday}
                  </div>
                </div>

                {/* Driver info */}
                {order.assignedDriver ? (
                  <div className="mb-2 text-xs">
                    <span className="text-gray-500">Driver:</span>
                    <div className="flex items-center gap-1 mt-1">
                      <User className="w-3 h-3 text-gray-400" />
                      <span className="font-medium truncate">
                        {order.assignedDriver.name}
                      </span>
                      <Phone className="w-3 h-3 text-gray-400 ml-2" />
                      <span className="truncate">
                        {order.assignedDriver.phone}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="mb-2 text-xs text-gray-500">
                    Driver: Not assigned
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-1">
                  {order.status === "pending" && (
                    <StatusButton
                      order={order}
                      status="confirmed"
                      label="Confirm"
                      variant="primary"
                    />
                  )}
                  {order.status === "confirmed" && (
                    <StatusButton
                      order={order}
                      status="preparing"
                      label="Start Prep"
                      variant="warning"
                    />
                  )}
                  {order.status === "preparing" && (
                    <>
                      <StatusButton
                        order={order}
                        status="ready_for_pickup"
                        label="Ready"
                        variant="success"
                      />
                      <StatusButton
                        order={order}
                        status="not_prepared"
                        label="Not Ready"
                        variant="danger"
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Plan Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item for Today
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preparation Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Driver
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className={`hover:bg-gray-50 ${
                      order.handoverFlag === "delay" || order.delayInfo
                        ? "bg-red-50 border-l-4 border-red-400"
                        : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {order.subscriptionId}
                        </div>

                        {order.handoverFlag === "delay" && (
                          <AlertTriangle className="w-4 h-4 text-red-500 ml-2" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-24">₹{order.basePrice}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs">
                        {Array.isArray(order.itemForToday) ? (
                          order.itemForToday.map((item, index) => (
                            <div key={index} className="mb-1 text-gray-700">
                              {typeof item === "string"
                                ? item
                                : item.name || item}
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-700">
                            {order.itemForToday}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-900">
                        <Clock className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span
                          className="max-w-32 truncate"
                          title={order.preparationTime}
                        >
                          {order.preparationTime}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          order.status,
                          order.handoverFlag === "delay" || order.delayInfo
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        <span className="ml-1">
                          {order.status.replace("_", " ").toUpperCase()}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {order.deliveryParnter ? (
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1 flex-shrink-0" />
                          <div className="min-w-0">
                            <div
                              className="truncate max-w-24"
                              title={order.deliveryParnter.name}
                            >
                              {order.deliveryParnter.name}
                            </div>
                            <div className="text-xs text-gray-500 flex items-center">
                              <Phone className="w-3 h-3 mr-1 flex-shrink-0" />
                              <span
                                className="truncate max-w-20"
                                title={order.deliveryParnter.phone}
                              >
                                {order.deliveryParnter.phone}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">Not assigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex flex-wrap gap-2">
                        {order.status === "pending" && (
                          <StatusButton
                            order={order}
                            status="confirmed"
                            label="Confirm"
                            variant="primary"
                          />
                        )}
                        {order.status === "confirmed" && (
                          <StatusButton
                            order={order}
                            status="preparing"
                            label="Start Prep"
                            variant="warning"
                          />
                        )}
                        {order.status === "preparing" && (
                          <>
                            <StatusButton
                              order={order}
                              status="ready_for_pickup"
                              label="Ready"
                              variant="success"
                            />
                            <StatusButton
                              order={order}
                              status="not_prepared"
                              label="Not Ready"
                              variant="danger"
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-8 sm:py-12 px-4">
            <ChefHat className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No tiffin orders found
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
              {tiffinData?.count === 0
                ? `No tiffin orders for ${shift} shift today.`
                : "Try adjusting your filters to see more orders."}
            </p>
          </div>
        )}

        {/* Delay Information */}
        {filteredOrders.some((order) => order.delayInfo) && (
          <div className="mt-4 sm:mt-6 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600" />
              <h4 className="font-semibold text-red-900 text-sm sm:text-base">
                Delayed Orders Alert
              </h4>
            </div>
            <p className="text-red-800 text-xs sm:text-sm mb-3">
              Some orders have exceeded their preparation time. Please check the
              penalty section for details.
            </p>
            <Link
              to="/seller/penalties"
              className="inline-flex items-center gap-1 text-red-700 hover:text-red-900 font-medium text-xs sm:text-sm"
            >
              View Penalties <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4" />
            </Link>
          </div>
        )}

        {/* Bulk Assignment Modal */}
        {/* {showBulkAssignModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <h3 className="text-lg font-semibold mb-4">
                Bulk Assign Ready Tiffins
              </h3>
              
              <p className="text-gray-600 mb-4">
                Assign {readyOrdersCount} ready tiffin orders to a single driver for the {shift} shift.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Driver
                </label>
                <select
                  value={selectedDriver}
                  onChange={(e) => setSelectedDriver(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select a driver...</option>
                  {driversData?.data?.map(driver => (
                    <option key={driver.id} value={driver.id}>
                      {driver.name} - {driver.phone} ({driver.vehicle?.type || 'N/A'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowBulkAssignModal(false);
                    setSelectedDriver('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkAssign}
                  disabled={!selectedDriver}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign Orders
                </button>
              </div>
            </div>
          </div>
        )} */}

        {/* History Dialog */}
        {showHistoryDialog && <HistoryDialog />}
      </div>
    </div>
  );
};

export default TodayTiffinList;
