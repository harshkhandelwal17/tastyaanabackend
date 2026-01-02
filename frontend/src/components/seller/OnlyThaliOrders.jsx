import { useState, useEffect, useCallback } from "react";

import { useSelector } from "react-redux";
import {
  Search,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Truck,
  CheckCircle,
  MoreVertical,
  Calendar,
  Package,
  PackageCheck,
  XCircle,
  ArrowRight,
  Filter as FilterIcon,
  Eye,
  FileText,
  RefreshCw,
  ShoppingCart,
  Bell,
  Menu,
  DollarSign,
  MapPin,
  Phone,
  Download,
} from "lucide-react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import {
  useGetThaliOrdersQuery,
  useUpdateOrderStatusMutation,
  useMarkOrderAsViewedMutation,
} from "../../redux/storee/api";
import { toast } from "react-hot-toast";
import useSellerOrdersSocket from "../../hooks/useSellerOrdersSocket";
import "../../styles/seller-orders.css";

const ITEMS_PER_PAGE = 20;
const STATUS_FILTERS = [
  {
    value: "all",
    label: "All Orders",
    count: 0,
    color: "bg-slate-100 text-slate-800",
  },
  {
    value: "pending",
    label: "Pending",
    count: 0,
    color: "bg-yellow-100 text-yellow-800",
  },
  {
    value: "confirmed",
    label: "Confirmed",
    count: 0,
    color: "bg-blue-100 text-blue-800",
  },
  {
    value: "preparing",
    label: "Preparing",
    count: 0,
    color: "bg-orange-100 text-orange-800",
  },
  {
    value: "ready",
    label: "Ready",
    count: 0,
    color: "bg-purple-100 text-purple-800",
  },
  {
    value: "out-for-delivery",
    label: "Out for Delivery",
    count: 0,
    color: "bg-indigo-100 text-indigo-800",
  },
  {
    value: "delivered",
    label: "Delivered",
    count: 0,
    color: "bg-green-100 text-green-800",
  },
  {
    value: "cancelled",
    label: "Cancelled",
    count: 0,
    color: "bg-red-100 text-red-800",
  },
];

// Thali filtering is now handled by the backend

const StatusBadge = ({ status }) => {
  const statusConfig = {
    pending: {
      bg: "bg-yellow-100 hover:bg-yellow-200",
      text: "text-yellow-800",
      icon: <Clock size={14} className="mr-1" />,
      label: "Pending",
    },
    confirmed: {
      bg: "bg-green-100 hover:bg-green-200",
      text: "text-green-800",
      icon: <CheckCircle size={14} className="mr-1" />,
      label: "Confirmed",
    },
    preparing: {
      bg: "bg-blue-100 hover:bg-blue-200",
      text: "text-blue-800",
      icon: <Package size={14} className="mr-1" />,
      label: "Preparing",
    },
    ready: {
      bg: "bg-purple-100 hover:bg-purple-200",
      text: "text-purple-800",
      icon: <PackageCheck size={14} className="mr-1" />,
      label: "Ready",
    },
    "out-for-delivery": {
      bg: "bg-indigo-100 hover:bg-indigo-200",
      text: "text-indigo-800",
      icon: <Truck size={14} className="mr-1" />,
      label: "Out for Delivery",
    },
    delivered: {
      bg: "bg-green-100 hover:bg-green-200",
      text: "text-green-800",
      icon: <CheckCircle size={14} className="mr-1" />,
      label: "Delivered",
    },
    cancelled: {
      bg: "bg-red-100 hover:bg-red-200",
      text: "text-red-800",
      icon: <XCircle size={14} className="mr-1" />,
      label: "Cancelled",
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-full ${config.bg} ${config.text} transition-colors`}
    >
      {config.icon} {config.label}
    </span>
  );
};

const CountdownTimer = ({ countdownInfo }) => {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    if (!countdownInfo) return;

    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, [countdownInfo]);

  if (!countdownInfo) return null;

  const now = currentTime;
  const deadline = new Date(countdownInfo.preparationDeadline);
  const timeLeft = deadline - now;
  const minutesLeft = Math.max(0, Math.ceil(timeLeft / (1000 * 60)));
  const isOverdue = timeLeft < 0;
  const isUrgent = minutesLeft <= 5 && !isOverdue;

  if (isOverdue) {
    return (
      <div className="bg-red-100 border border-red-300 rounded-lg p-2 mb-2">
        <div className="flex items-center text-red-800">
          <AlertCircle className="h-4 w-4 mr-1" />
          <span className="text-xs font-bold">
            OVERDUE by {Math.floor((now - deadline) / (1000 * 60))} min
          </span>
        </div>
        {countdownInfo.penaltyAmount > 0 && (
          <div className="text-xs text-red-600 mt-1">
            Penalty: ₹{countdownInfo.penaltyAmount}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`border rounded-lg p-2 mb-2 ${
        isUrgent
          ? "bg-orange-100 border-orange-300"
          : "bg-blue-100 border-blue-300"
      }`}
    >
      <div
        className={`flex items-center ${
          isUrgent ? "text-orange-800" : "text-blue-800"
        }`}
      >
        <Clock className="h-4 w-4 mr-1" />
        <span className="text-xs font-bold">
          {minutesLeft}min {Math.floor((timeLeft % (1000 * 60)) / 1000)}sec left
        </span>
      </div>
      <div className="text-xs mt-1 text-gray-600">
        Deadline:{" "}
        {deadline.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
    </div>
  );
};

const MobileThaliOrderCard = ({
  order,
  onStatusUpdate,
  // onViewDetails,
  // onViewInvoice,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [isViewed, setIsViewed] = useState(false);
  const [updateOrderStatus] = useUpdateOrderStatusMutation();
  const [markOrderAsViewed] = useMarkOrderAsViewedMutation();

  const { user: authUser } = useSelector((state) => state.auth);

  const getAvailableStatusOptions = (currentStatus) => {
    const statusFlow = {
      assigned: [
        { value: "confirmed", label: "✅ Confirm Order" },
        { value: "cancelled", label: "❌ Cancel Order" },
      ],
      pending: [
        { value: "confirmed", label: "✅ Confirm Order" },
        { value: "cancelled", label: "❌ Cancel Order" },
      ],
      confirmed: [
        { value: "preparing", label: "👨‍🍳 Start Preparing" },
        { value: "cancelled", label: "❌ Cancel Order" },
      ],
      preparing: [
        { value: "ready", label: "🎯 Mark as Ready" },
        { value: "cancelled", label: "❌ Cancel Order" },
      ],
      ready: [
        { value: "out-for-delivery", label: "🚚 Out for Delivery" },
        { value: "delivered", label: "✅ Mark as Delivered" },
        { value: "cancelled", label: "❌ Cancel Order" },
      ],
      ready_for_pickup: [
        { value: "delivered", label: "✅ Mark as Delivered" },
        { value: "cancelled", label: "❌ Cancel Order" },
      ],
      "out-for-delivery": [],
      delivered: [],
      cancelled: [],
    };
    return statusFlow[currentStatus] || [];
  };

  const statusOptions = getAvailableStatusOptions(order.status);

  const handleStatusUpdate = async (newStatus) => {
    if (!order._id) {
      toast.error("Invalid order ID");
      return;
    }
    try {
      setIsUpdating(true);

      if (order.isSubscriptionOrder || order.type === "gkk") {
        const response = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/seller/orders/${
            order._id
          }/status`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
            body: JSON.stringify({
              status: newStatus,
              notes: `Status updated to ${newStatus} by seller`,
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update subscription order status");
        }

        if (newStatus === "delivered") {
          toast.success(
            "🎉 Tiffin delivered! Meal count updated in subscription.",
            {
              position: "top-center",
              autoClose: 3000,
              hideProgressBar: true,
              style: {
                fontSize: "14px",
                padding: "8px 12px",
              },
            }
          );
        } else {
          toast.success(`Tiffin status updated to ${newStatus}`, {
            position: "top-center",
            autoClose: 1500,
            hideProgressBar: true,
            style: {
              fontSize: "14px",
              padding: "8px 12px",
            },
          });
        }
      } else {
        await updateOrderStatus({
          orderId: order._id,
          status: newStatus,
        }).unwrap();

        toast.success(`Status updated to ${newStatus}`, {
          position: "top-center",
          autoClose: 1500,
          hideProgressBar: true,
          style: {
            fontSize: "14px",
            padding: "8px 12px",
          },
        });
      }

      setShowStatusDropdown(false);

      try {
        await markOrderAsViewed(order._id);
        console.log("Order marked as viewed in backend");
      } catch (error) {
        console.error("Failed to mark order as viewed:", error);
      }

      if (onStatusUpdate) onStatusUpdate();
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast.error(
        error.data?.message || error.message || "Failed to update status",
        {
          position: "top-center",
          autoClose: 2000,
          hideProgressBar: true,
          style: {
            fontSize: "14px",
            padding: "8px 12px",
          },
        }
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const markAsViewed = () => {
    if (!isViewed) {
      setIsViewed(true);
    }
  };

  const formatDate = (dateString) => {
    const date = parseISO(dateString);
    return {
      relative: formatDistanceToNow(date, { addSuffix: true }),
      full: format(date, "dd MMM yyyy, hh:mm aa"),
      time: format(date, "hh:mm aa"),
    };
  };

  const isNewOrder = () => {
    const orderDate = parseISO(order.createdAt);
    const now = new Date();
    const diffInMinutes = (now - orderDate) / (1000 * 60);
    const hasBeenViewedByCurrentSeller = order.viewedBySellers?.includes(
      authUser?.id
    );
    return diffInMinutes < 60 && !hasBeenViewedByCurrentSeller;
  };

  // Items are already filtered to thali items by the backend
  const thaliItems = order.items || [];

  const getItemsText = (items) => {
    if (!items || items.length === 0) return "0 items";
    const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
    return `${totalQty} thali${totalQty > 1 ? "s" : ""}`;
  };

  // Total amount is already calculated for thali items only by the backend
  const thaliTotalAmount = order.totalAmount || 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-3 hover:shadow-md transition-all duration-200">
      {/* Header with Order ID and Status */}
      <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-yellow-50 border-b border-slate-100">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-slate-900 text-base">
                #{order.orderNumber}
              </h3>
              {isNewOrder() && (
                <span className="inline-flex px-2 py-1 text-xs rounded-full font-bold bg-red-100 text-red-800 animate-pulse">
                  ✨ NEW
                </span>
              )}
              <span className="inline-flex px-2 py-1 text-xs rounded-full font-medium bg-orange-100 text-orange-800">
                🍛 THALI ONLY
              </span>
              {order.type && (
                <span
                  className={`inline-flex px-2 py-1 text-xs rounded-full font-medium ${
                    order.type === "gkk"
                      ? "bg-green-100 text-green-800"
                      : order.type === "addon"
                      ? "bg-purple-100 text-purple-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {order.type === "gkk" ? "TIFFIN" : order.type?.toUpperCase()}
                </span>
              )}
              {order.isSubscriptionOrder && (
                <span className="inline-flex px-2 py-1 text-xs rounded-full font-medium bg-orange-100 text-orange-800">
                  SUBSCRIPTION
                </span>
              )}
            </div>
            <p
              className="text-sm text-slate-600 mt-1"
              title={formatDate(order.createdAt).full}
            >
              <Clock className="h-3.5 w-3.5 inline mr-1" />
              {formatDate(order.createdAt).relative}
            </p>
            <p className="text-xs text-slate-500">
              📅 {formatDate(order.createdAt).full}
            </p>
          </div>
          <StatusBadge status={order.status} />
        </div>
      </div>

      {/* Order Details */}
      <div className="px-4 py-3">
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center text-sm text-slate-700">
            <Package className="h-4 w-4 mr-2 text-slate-500" />
            <span className="font-medium">{getItemsText(thaliItems)}</span>
          </div>
          <div className="flex items-center text-sm text-slate-700">
            <span className="ml-auto font-bold text-green-600">
              ₹{thaliTotalAmount?.toFixed(2) || "0.00"}
            </span>
          </div>
        </div>

        {/* Subscription Order Details */}
        {(order.isSubscriptionOrder || order.type === "gkk") && (
          <div className="bg-green-50 rounded-lg p-3 mb-3 border border-green-200">
            <h4 className="text-sm font-medium text-green-800 mb-2 flex items-center">
              <Package className="h-4 w-4 mr-1" />
              Subscription Details
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-green-700">Subscription ID:</span>
                <span className="font-medium text-green-900">
                  {order.subscriptionId || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Plan Type:</span>
                <span className="font-medium text-green-900">
                  {order.planType || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-700">Shift:</span>
                <span className="font-medium text-green-900 capitalize">
                  {order.shift || order.deliverySlot || "N/A"}
                </span>
              </div>
              {order.preparationTime && (
                <div className="flex justify-between">
                  <span className="text-green-700">Prep Time:</span>
                  <span className="font-medium text-green-900">
                    {order.preparationTime}
                  </span>
                </div>
              )}
            </div>
            {order.handoverFlag && (
              <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-xs">
                <span className="text-red-800 font-bold">
                  ⚠️ {order.handoverFlag.toUpperCase()}
                </span>
                {order.delayInfo?.delayReason && (
                  <p className="text-red-700 mt-1">
                    {order.delayInfo.delayReason}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Thali Items Preview */}
        {thaliItems.length > 0 && (
          <div className="bg-orange-50 rounded-lg p-3 mb-3 border border-orange-200">
            <h4 className="text-sm font-medium text-orange-800 mb-2 flex items-center">
              🍛 Thali Items:
            </h4>
            <div className="space-y-2">
              {thaliItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center text-sm"
                >
                  <div className="flex-1">
                    <span className="text-slate-800">{item.name}</span>
                    <span className="text-slate-500 ml-2">
                      ×{item.quantity}
                    </span>
                  </div>
                  <span className="font-medium text-slate-700">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Countdown Timer for Active Orders */}
        {order.countdownInfo &&
          ["pending", "confirmed", "preparing", "ready"].includes(
            order.status
          ) && <CountdownTimer countdownInfo={order.countdownInfo} />}

        {/* Payment Status */}
        <div className="flex items-center justify-between text-sm mb-3">
          <span className="text-slate-600">Payment:</span>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              order.paymentStatus === "paid"
                ? "bg-green-100 text-green-800"
                : "bg-yellow-100 text-yellow-800"
            }`}
          >
            {order.paymentStatus || "pending"}
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100">
        <div className="flex space-x-2">
          {/* Status Update Dropdown */}
          {statusOptions.length > 0 && (
            <div className="relative flex-1">
              <button
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                disabled={isUpdating}
                className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  <>
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Update Status
                  </>
                )}
              </button>

              {showStatusDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowStatusDropdown(false)}
                  />
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg border border-slate-200 z-20 py-1">
                    {statusOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleStatusUpdate(option.value)}
                        className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 flex items-center"
                      >
                        <span className="mr-2">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* View Details Button */}
          {/* <button
            onClick={() => {
              markAsViewed();
              onViewDetails(order._id);
            }}
            className="flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Eye className="h-4 w-4 mr-1" />
            View
          </button> */}

          {/* Invoice Button */}
          {/* <button
            onClick={() => onViewInvoice(order._id)}
            className="flex items-center justify-center px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <FileText className="h-4 w-4 mr-1" />
            Invoice
          </button> */}
        </div>
      </div>
    </div>
  );
};

const OnlyThaliOrders = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("today");
  const [showFilters, setShowFilters] = useState(false);
  const [orderFilters, setOrderFilters] = useState({
    status: "all",
    type: "all",
    customized: "all",
    search: "",
    college: "all",
  });
  const { user: authUser } = useSelector((state) => state.auth);

  const handleFilterChange = (filterName, value) => {
    setOrderFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
    setCurrentPage(1);
  };

  const handleViewDetails = (orderId) => {
    window.location.href = `/seller/orders/${orderId}`;
  };

  const handleViewInvoice = (orderId) => {
    const apiUrl =
      import.meta.env.VITE_BACKEND_URL ||
      import.meta.env.REACT_APP_API_URL ||
      "http://localhost:5000";
    const invoiceUrl = `${apiUrl}/api/seller/orders/${orderId}/invoice`;

    if (!orderId) {
      toast.error("Order ID not found", {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
      });
      return;
    }

    window.open(invoiceUrl, "_blank");
  };

  // Fetch thali orders with RTK Query

  const {
    data: ordersData,
    isLoading,
    isError,
    error,
    refetch,
  } = useGetThaliOrdersQuery(
    {
      page: currentPage,
      limit: ITEMS_PER_PAGE,
      search: orderFilters.search || searchTerm,
      status: statusFilter === "all" ? "all" : statusFilter,
      date: dateFilter,
      type: orderFilters.type,
      customized: orderFilters.customized,
      college: orderFilters.college,
    },
    {
      skip: !authUser?.id,
      refetchOnMountOrArgChange: true,
    }
  );

  // Orders are already filtered by the backend, no need for frontend filtering

  const loadOrders = useCallback(() => {
    refetch();
  }, [refetch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      refetch();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, dateFilter, orderFilters, refetch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      refetch();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm, statusFilter, dateFilter]);

  const handleStatusUpdate = () => {
    refetch();
  };

  const handleOrderStatusUpdate = async (orderId, newStatus) => {
    if (!orderId) {
      toast.error("Invalid order ID");
      return;
    }
    try {
      await updateOrderStatusMutation({
        orderId: orderId,
        status: newStatus,
      }).unwrap();
      toast.success(`Order status updated to ${newStatus}`);
      refetch();
    } catch (error) {
      console.error("Failed to update order status:", error);
      toast.error(error.data?.message || "Failed to update status", {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: true,
        style: {
          fontSize: "14px",
          padding: "8px 12px",
        },
      });
    }
  };

  const [updateOrderStatusMutation] = useUpdateOrderStatusMutation();

  // Socket connection for real-time updates
  const { socket, isConnected } = useSellerOrdersSocket(
    (data) => {
      console.log("📦 Order updated via socket:", data);
      refetch();
    },
    (data) => {
      console.log("🆕 New order received via socket:", data);
      // Show notification for all orders since this component only handles thali orders
      toast.success(`🍛 New Thali order #${data.orderNumber}`, {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: true,
        style: {
          fontSize: "14px",
          padding: "8px 12px",
        },
      });
      refetch();
    }
  );

  // Orders are already filtered and paginated by the backend
  const orders = ordersData?.data?.orders || [];
  const totalCount = ordersData?.data?.pagination?.total || 0;
  const totalPages = ordersData?.data?.pagination?.totalPages || 0;

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Error loading orders
        </h2>
        <p className="text-slate-600 text-center mb-4">
          {error?.data?.message || "Failed to load orders. Please try again."}
        </p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen mt-2">
      {/* Mobile-First Header - Fixed at top */}
      <div className="sticky top-0 z-20 bg-white shadow-sm border-b border-slate-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center">
                🍛 Orders
              </h1>
              <p className="text-sm text-slate-600">your orders</p>
            </div>
            <div className="flex items-center space-x-2">
              {/* Real-time connection status */}
              <div
                className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  isConnected
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mr-1 ${
                    isConnected ? "bg-green-500 animate-pulse" : "bg-red-500"
                  }`}
                />
                {isConnected ? "Live" : "Offline"}
              </div>

              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  showFilters
                    ? "text-orange-600 bg-orange-50"
                    : "text-slate-600 bg-slate-100 hover:bg-slate-200"
                }`}
              >
                <FilterIcon className="h-4 w-4 mr-1" />
                Filters
              </button>
              <button
                onClick={loadOrders}
                className="flex items-center px-3 py-2 text-sm font-medium text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>
            </div>
          </div>

          {/* Quick Status Filter Tabs */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {STATUS_FILTERS.slice(0, 4).map((filter) => {
              const count =
                filter.value === "all"
                  ? orders.length
                  : orders.filter((order) => order.status === filter.value)
                      .length;
              return (
                <button
                  key={filter.value}
                  onClick={() => {
                    setStatusFilter(filter.value);
                    setOrderFilters((prev) => ({
                      ...prev,
                      status: filter.value,
                    }));
                  }}
                  className={`flex-shrink-0 px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                    statusFilter === filter.value ||
                    orderFilters.status === filter.value
                      ? "bg-orange-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {filter.label} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Collapsible Filters */}
      {showFilters && (
        <div className="bg-white border-b border-slate-200 px-4 py-3">
          {/* Search Bar */}
          <div className="relative mb-3">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search  orders by number, customer..."
              value={orderFilters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
              className="pl-10 w-full px-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Filter Grid */}
          <div className="grid grid-cols-1 gap-3">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="px-4 pt-4 pb-20">
        {/* Mobile Orders List */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-orange-600 mx-auto mb-2" />
              <p className="text-sm text-slate-600">Loading orders...</p>
            </div>
          </div>
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 m-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Error loading orders
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {error?.data?.message ||
                    "Failed to load orders. Please try again."}
                </p>
              </div>
            </div>
            <button
              onClick={refetch}
              className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="text-6xl mb-4">🍛</div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              No orders found
            </h3>
            <p className="text-slate-600 mb-6 max-w-sm mx-auto">
              {orderFilters.search ||
              statusFilter !== "all" ||
              dateFilter !== "today"
                ? "No orders match your current filters."
                : "You haven't received any orders today yet."}
            </p>
            <button
              onClick={() => {
                setOrderFilters({
                  status: "all",
                  type: "all",
                  customized: "all",
                  search: "",
                  college: "all",
                });
                setStatusFilter("all");
                setDateFilter("today");
              }}
              className="px-4 py-2 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors inline-flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            {/* Orders Count */}
            <div className="px-1 mb-4">
              <p className="text-sm text-slate-600">
                Showing {orders.length} of {totalCount} orders
              </p>
            </div>

            {/* Orders Cards */}
            <div className="space-y-3">
              {orders.map((order) => (
                <MobileThaliOrderCard
                  key={order._id}
                  order={order}
                  onStatusUpdate={handleStatusUpdate}
                  // onViewDetails={handleViewDetails}
                  // onViewInvoice={handleViewInvoice}
                />
              ))}
            </div>

            {/* Mobile Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-slate-600">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="text-sm text-slate-600">
                    {Math.min(
                      (currentPage - 1) * ITEMS_PER_PAGE + 1,
                      totalCount
                    )}{" "}
                    -{Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of{" "}
                    {totalCount}
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  <div className="flex items-center space-x-1">
                    {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage <= 2) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 1) {
                        pageNum = totalPages - 2 + i;
                      } else {
                        pageNum = currentPage - 1 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-10 h-10 rounded-lg text-sm font-medium ${
                            currentPage === pageNum
                              ? "bg-orange-600 text-white"
                              : "border border-slate-300 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OnlyThaliOrders;
