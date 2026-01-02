// src/pages/orders/MyOrdersPage.jsx

import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";
import {
  Package,
  Calendar,
  Truck,
  CheckCircle,
  Clock,
  MapPin,
  Eye,
  Download,
  ArrowLeft,
  X,
  Star,
  Phone,
  AlertCircle,
  ShoppingBag,
  Loader2,
  RefreshCw,
  CreditCard,
  RotateCcw,
  MessageCircle,
  Share2,
  Copy,
  FileText,
  User,
  Navigation,
  XCircle,
  Bell,
  Search,
} from "lucide-react";
import { fetchOrders } from "../../../redux/orderSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

// Memoized selector
const selectOrdersState = (state) => state?.order;

const selectOrdersData = createSelector([selectOrdersState], (ordersState) => {
  if (!ordersState) {
    return {
      items: [],
      loading: false,
      error: null,
      pagination: null,
    };
  }
  return {
    items: ordersState.items || [],
    loading: ordersState.loading || false,
    error: ordersState.error || null,
    pagination: ordersState.pagination || null,
  };
});

const MyOrdersPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items: orders, loading, error } = useSelector(selectOrdersData);
  const { user: userInfo, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const [activeTab, setActiveTab] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [dateRange, setDateRange] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch orders
  useEffect(() => {
    if (isAuthenticated && userInfo) {
      dispatch(fetchOrders()).catch((err) =>
        console.error("Failed to fetch orders:", err)
      );
    } else if (!isAuthenticated) {
      navigate("/login");
    }
  }, [dispatch, isAuthenticated, userInfo, navigate]);

  // Helpers
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "text-emerald-700 bg-emerald-50 border-emerald-200";
      case "shipped":
      case "out for delivery":
        return "text-blue-700 bg-blue-50 border-blue-200";
      case "pending":
      case "processing":
        return "text-amber-700 bg-amber-50 border-amber-200";
      case "cancelled":
      case "canceled":
        return "text-rose-700 bg-rose-50 border-rose-200";
      case "confirmed":
        return "text-emerald-700 bg-emerald-50 border-emerald-200";
      default:
        return "text-slate-700 bg-slate-50 border-slate-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return <CheckCircle className="w-4 h-4" />;
      case "shipped":
      case "out for delivery":
        return <Truck className="w-4 h-4" />;
      case "pending":
      case "processing":
        return <Clock className="w-4 h-4" />;
      case "cancelled":
      case "canceled":
        return <X className="w-4 h-4" />;
      case "confirmed":
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <Package className="w-4 h-4" />;
    }
  };

  const getDeliveryProgress = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return 20;
      case "confirmed":
        return 40;
      case "processing":
        return 60;
      case "shipped":
        return 80;
      case "out for delivery":
        return 90;
      case "delivered":
        return 100;
      case "cancelled":
      case "canceled":
        return 0;
      default:
        return 20;
    }
  };

  const getPrimaryAction = (status) => {
    const s = status?.toLowerCase();
    if (["assigned", "picked_up", "out_for_delivery", "shipped"].includes(s)) {
      return { label: "Track live", type: "track" };
    }
    if (s === "delivered") {
      return { label: "View summary", type: "details" };
    }
    return { label: "View details", type: "details" };
  };

  // Filtering + sorting
  const filteredOrders = useMemo(() => {
    return (
      orders
        ?.filter((order) => {
          if (
            activeTab !== "all" &&
            order.status?.toLowerCase() !== activeTab
          ) {
            return false;
          }

          if (searchQuery) {
            const searchLower = searchQuery.toLowerCase();
            const searchMatch =
              order.orderNumber?.toLowerCase().includes(searchLower) ||
              order._id?.toLowerCase().includes(searchLower) ||
              order.items?.some(
                (item) =>
                  item.name?.toLowerCase().includes(searchLower) ||
                  item.product?.name?.toLowerCase().includes(searchLower)
              );
            if (!searchMatch) return false;
          }

          if (dateRange !== "all") {
            const orderDate = new Date(order.createdAt);
            const now = new Date();
            const daysDiff = (now - orderDate) / (1000 * 60 * 60 * 24);

            if (dateRange === "week" && daysDiff > 7) return false;
            if (dateRange === "month" && daysDiff > 30) return false;
            if (dateRange === "3months" && daysDiff > 90) return false;
          }

          if (priceRange !== "all") {
            const amount = order.totalAmount || 0;
            if (priceRange === "low" && amount >= 500) return false;
            if (priceRange === "medium" && (amount < 500 || amount >= 1500))
              return false;
            if (priceRange === "high" && amount < 1500) return false;
          }

          return true;
        })
        ?.sort((a, b) => {
          switch (sortBy) {
            case "newest":
              return new Date(b.createdAt) - new Date(a.createdAt);
            case "oldest":
              return new Date(a.createdAt) - new Date(b.createdAt);
            case "amount_high":
              return (b.totalAmount || 0) - (a.totalAmount || 0);
            case "amount_low":
              return (a.totalAmount || 0) - (b.totalAmount || 0);
            case "status":
              return (a.status || "").localeCompare(b.status || "");
            default:
              return new Date(b.createdAt) - new Date(a.createdAt);
          }
        }) || []
    );
  }, [orders, activeTab, searchQuery, dateRange, priceRange, sortBy]);

  // Status tabs
  const statusTabs = useMemo(
    () => [
      {
        key: "all",
        label: "All",
        count: orders?.length || 0,
        icon: Package,
      },
      {
        key: "pending",
        label: "Pending",
        count:
          orders?.filter((o) => o.status?.toLowerCase() === "pending").length ||
          0,
        icon: Clock,
      },
      {
        key: "confirmed",
        label: "Confirmed",
        count:
          orders?.filter((o) => o.status?.toLowerCase() === "confirmed")
            .length || 0,
        icon: CheckCircle,
      },
      {
        key: "processing",
        label: "Processing",
        count:
          orders?.filter((o) => o.status?.toLowerCase() === "processing")
            .length || 0,
        icon: Package,
      },
      {
        key: "shipped",
        label: "Shipped",
        count:
          orders?.filter((o) => o.status?.toLowerCase() === "shipped").length ||
          0,
        icon: Truck,
      },
      {
        key: "delivered",
        label: "Delivered",
        count:
          orders?.filter((o) => o.status?.toLowerCase() === "delivered")
            .length || 0,
        icon: CheckCircle,
      },
    ],
    [orders]
  );

  // Actions
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchOrders()).unwrap();
      toast.success("Orders refreshed successfully!");
    } catch {
      toast.error("Failed to refresh orders");
    } finally {
      setIsRefreshing(false);
    }
  };

  const copyOrderId = (orderId) => {
    navigator.clipboard.writeText(orderId);
    toast.success("Order ID copied to clipboard!");
  };

  const shareOrder = (order) => {
    const shareText = `Order #${
      order.orderNumber || order._id?.slice(-8)
    } - Status: ${order.status}`;
    if (navigator.share) {
      navigator.share({
        title: "Order Details",
        text: shareText,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success("Order details copied to clipboard!");
    }
  };

  const handleTrackOrder = (order) => {
    navigate(`/track/${order._id}`, {
      state: {
        order,
        trackingNumber: order.trackingNumber,
      },
    });
  };

  const handleViewDetails = (order) => setSelectedOrder(order);

  const downloadInvoice = async () => {
    toast.info("Generating invoice...");
    setTimeout(() => {
      toast.success("Invoice downloaded successfully!");
    }, 1200);
  };

  const contactSupport = (order) => {
    const message = `Hi, I need help with my order #${
      order.orderNumber || order._id?.slice(-8)
    }`;
    toast.info("Redirecting to customer support...");
    setTimeout(() => {
      navigate("/support", { state: { orderId: order._id, message } });
    }, 600);
  };

  const reorderItems = (order) => {
    toast.success("Items added to cart!");
    navigate("/cart");
  };

  // Order Modal
  const OrderModal = ({ order, onClose }) => {
    const isCompletedOrder =
      order.status === "cancelled" || order.status === "delivered";

    return (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-100">
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50 via-emerald-50 to-blue-50 flex items-center justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-600 font-semibold">
                Order Summary
              </p>
              <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mt-1">
                #{order.orderNumber || order._id?.slice(-8)}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/70 border border-slate-200"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
            {/* Status + Date */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs sm:text-sm font-medium bg-slate-50">
                {getStatusIcon(order.status)}
                <span
                  className={`px-2 py-0.5 rounded-full border text-[11px] sm:text-xs font-semibold ${getStatusColor(
                    order?.status
                  )}`}
                >
                  {order?.status?.charAt(0).toUpperCase() +
                    order.status?.slice(1)}
                </span>
              </div>
              <div className="text-xs sm:text-sm text-slate-600 sm:text-right">
                <p>Placed on</p>
                <p className="font-medium text-slate-900">
                  {new Date(order.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* Delivered / Cancelled info */}
            {order.status?.toLowerCase() === "delivered" &&
              order.deliveredAt && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <p className="text-xs sm:text-sm font-semibold text-emerald-800">
                      Delivered successfully
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm text-emerald-700">
                    {new Date(order.deliveredAt).toLocaleString("en-IN")}
                  </p>
                </div>
              )}

            {order.status?.toLowerCase() === "cancelled" &&
              order.cancelledAt && (
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <XCircle className="w-4 h-4 text-rose-600" />
                    <p className="text-xs sm:text-sm font-semibold text-rose-800">
                      Order cancelled
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm text-rose-700">
                    {new Date(order.cancelledAt).toLocaleString("en-IN")}
                  </p>
                  {order.cancellationReason && (
                    <p className="text-[11px] sm:text-xs text-rose-700 mt-1">
                      Reason: {order.cancellationReason}
                    </p>
                  )}
                </div>
              )}

            {/* Delivery Partner */}
            {order.deliveryPartner && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="w-4 h-4 text-slate-700" />
                  <p className="text-xs sm:text-sm font-semibold text-slate-900">
                    Delivery partner
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-1 sm:gap-2 text-xs sm:text-sm text-slate-700">
                  <p>
                    <span className="font-medium">Name:</span>{" "}
                    {order.deliveryPartner.name}
                  </p>
                  <p>
                    <span className="font-medium">Phone:</span>{" "}
                    {order.deliveryPartner.phone}
                  </p>
                  {order.deliveryPartner.rating && (
                    <p>
                      <span className="font-medium">Rating:</span> ⭐{" "}
                      {order.deliveryPartner.rating}
                    </p>
                  )}
                </div>
                {!isCompletedOrder && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    <a
                      href={`tel:${order.deliveryPartner.phone}`}
                      className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-emerald-600 text-white text-xs sm:text-sm font-medium hover:bg-emerald-700"
                    >
                      <Phone className="w-3 h-3 mr-1" />
                      Call
                    </a>
                    <button
                      onClick={() => navigate(`/track-order/${order._id}`)}
                      className="inline-flex items-center justify-center px-3 py-2 rounded-lg bg-slate-900 text-white text-xs sm:text-sm font-medium hover:bg-black"
                    >
                      <Navigation className="w-3 h-3 mr-1" />
                      Track live
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Items */}
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-900 mb-2">
                Items in this order
              </h3>
              <div className="space-y-2.5">
                {order.items?.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-2.5"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">
                        {item.name || item.product?.name}
                      </p>
                      <p className="text-[11px] sm:text-xs text-slate-500">
                        Qty: {item.quantity}{" "}
                        {item.weight && `• ${item.weight}`}
                      </p>
                      {item.seller && (
                        <p className="text-[11px] sm:text-xs text-emerald-700 mt-0.5">
                          Sold by:{" "}
                          <span className="font-medium">
                            {item.seller.name || "Tastyaana Store"}
                          </span>
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs sm:text-sm font-semibold text-slate-900">
                        ₹{item.price}
                      </p>
                      {item.originalPrice &&
                        item.originalPrice > item.price && (
                          <p className="text-[11px] sm:text-xs text-slate-400 line-through">
                            ₹{item.originalPrice}
                          </p>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-blue-700" />
                <p className="text-xs sm:text-sm font-semibold text-blue-900">
                  Payment details
                </p>
              </div>
              <div className="space-y-1.5 text-xs sm:text-sm text-blue-800">
                <div className="flex justify-between gap-4">
                  <span>Method</span>
                  <span className="font-semibold">
                    {order.paymentMethod === "COD"
                      ? "Cash on Delivery"
                      : order.paymentMethod === "online"
                      ? "Online Payment"
                      : order.paymentMethod === "razorpay"
                      ? "Online Payment (Razorpay)"
                      : order.paymentMethod === "card"
                      ? "Card Payment"
                      : order.paymentMethod === "wallet"
                      ? "Wallet Payment"
                      : order.paymentMethod === "subscription"
                      ? "Subscription Payment"
                      : order.paymentMethod?.toUpperCase() || "N/A"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span>Status</span>
                  <span
                    className={`font-semibold ${
                      order.paymentStatus === "paid" ||
                      order.paymentStatus === "completed"
                        ? "text-emerald-700"
                        : order.paymentStatus === "pending"
                        ? "text-amber-700"
                        : order.paymentStatus === "failed"
                        ? "text-rose-700"
                        : order.paymentStatus === "refunded"
                        ? "text-blue-700"
                        : "text-slate-700"
                    }`}
                  >
                    {order.paymentStatus === "paid" ||
                    order.paymentStatus === "completed"
                      ? "Paid"
                      : order.paymentStatus === "pending"
                      ? "Pending"
                      : order.paymentStatus === "failed"
                      ? "Failed"
                      : order.paymentStatus === "refunded"
                      ? "Refunded"
                      : order.paymentStatus?.charAt(0).toUpperCase() +
                          order.paymentStatus?.slice(1) || "N/A"}
                  </span>
                </div>
                {order.transactionId && (
                  <div className="flex justify-between gap-4">
                    <span>Txn ID</span>
                    <span className="font-mono text-[11px] sm:text-xs break-all">
                      {order.transactionId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Summary */}
            <div className="border-t border-slate-100 pt-3 sm:pt-4 space-y-1.5 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal</span>
                <span className="font-medium">
                  ₹{order.subtotal?.toFixed(2) || "0.00"}
                </span>
              </div>

              {order?.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span>-₹{order.discountAmount.toFixed(2)}</span>
                </div>
              )}

              {order?.taxes &&
                Object.entries(order.taxes).map(([key, value]) =>
                  key !== "total" && value > 1 ? (
                    <div key={key} className="flex justify-between">
                      <span className="text-slate-600">
                        {key.replace(/([A-Z])/g, " $1")}
                      </span>
                      <span className="font-medium">₹{value.toFixed(2)}</span>
                    </div>
                  ) : null
                )}

              <div className="flex justify-between items-center pt-2 mt-1 border-t border-slate-100">
                <span className="text-sm sm:text-base font-semibold text-slate-900">
                  Total paid
                </span>
                <span className="text-lg sm:text-xl font-bold text-emerald-600">
                  ₹{order.totalAmount?.toFixed(2) || "0.00"}
                </span>
              </div>
            </div>

            {/* Address + Tracking (when active) */}
            {!isCompletedOrder && (
              <>
                {order.trackingNumber && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <Truck className="w-4 h-4 text-slate-700" />
                      <p className="text-xs sm:text-sm font-semibold text-slate-900">
                        Tracking
                      </p>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700">
                      ID: {order.trackingNumber}
                    </p>
                    <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                      ETA:{" "}
                      {order.estimatedDelivery
                        ? new Date(
                            order.estimatedDelivery
                          ).toLocaleDateString("en-IN")
                        : "Not set"}
                    </p>
                  </div>
                )}

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 sm:p-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <MapPin className="w-4 h-4 text-slate-700" />
                    <p className="text-xs sm:text-sm font-semibold text-slate-900">
                      Delivery address
                    </p>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 break-words">
                    {order?.deliveryAddress?.street ||
                      order.deliveryAddress?.line1 ||
                      ""}{" "}
                    {order?.deliveryAddress?.city &&
                      `, ${order.deliveryAddress.city}`}
                    {order?.deliveryAddress?.state &&
                      `, ${order.deliveryAddress.state}`}
                    {order?.deliveryAddress?.pincode &&
                      ` - ${order.deliveryAddress.pincode}`}
                  </p>
                </div>

                <div className="flex justify-center pt-3 sm:pt-4 border-t border-slate-100">
                  <button
                    onClick={() => navigate(`/track-order/${order._id}`)}
                    className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-slate-900 text-white text-sm sm:text-base font-semibold hover:bg-black"
                  >
                    <Navigation className="w-4 h-4 mr-2" />
                    Track order live
                  </button>
                </div>
              </>
            )}

            {/* Invoice / Support */}
            <div className="flex flex-wrap gap-2 pt-2 sm:pt-3 border-t border-dashed border-slate-200">
              <button
                onClick={downloadInvoice}
                className="inline-flex items-center px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-700 hover:bg-slate-50"
              >
                <Download className="w-4 h-4 mr-1.5" />
                Invoice
              </button>
              <button
                onClick={() => contactSupport(order)}
                className="inline-flex items-center px-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-700 hover:bg-slate-50"
              >
                <MessageCircle className="w-4 h-4 mr-1.5" />
                Support
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Stats
  const OrderStats = () => {
    const stats = useMemo(() => {
      const totalOrders = orders?.length || 0;
      const totalSpent =
        orders?.reduce((sum, order) => sum + (order.totalAmount || 0), 0) || 0;
      const deliveredOrders =
        orders?.filter((o) => o.status?.toLowerCase() === "delivered").length ||
        0;
      const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

      return { totalOrders, totalSpent, deliveredOrders, avgOrderValue };
    }, [orders]);

    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white/80 backdrop-blur border border-slate-100 rounded-2xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-semibold text-slate-900">
                {stats.totalOrders}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Total orders
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur border border-slate-100 rounded-2xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-semibold text-slate-900">
                ₹{stats.totalSpent.toFixed(0)}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Total spent
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur border border-slate-100 rounded-2xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-semibold text-slate-900">
                {stats.deliveredOrders}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Delivered
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur border border-slate-100 rounded-2xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 flex items-center justify-center">
              <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-lg sm:text-xl font-semibold text-slate-900">
                ₹{stats.avgOrderValue.toFixed(0)}
              </p>
              <p className="text-[11px] sm:text-xs text-slate-500">
                Avg. order
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loading
  if (loading && !orders?.length) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm mx-auto">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <Loader2 className="w-7 h-7 sm:w-9 sm:h-9 animate-spin text-emerald-600" />
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 mb-1">
            Fetching your orders
          </h2>
          <p className="text-sm sm:text-base text-slate-600">
            Please wait, we are loading your Tastyaana order history.
          </p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto bg-white rounded-2xl border border-rose-100 p-6 shadow-sm">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7 sm:w-9 h-9 text-rose-600" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-1">
            Something went wrong
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mb-4">{error}</p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <button
              onClick={handleRefresh}
              className="inline-flex items-center justify-center bg-emerald-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700"
            >
              <RefreshCw className="w-4 h-4 mr-1.5" />
              Try again
            </button>
            <button
              onClick={() => navigate("/products")}
              className="inline-flex items-center justify-center border border-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-50"
            >
              Continue shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sticky header */}
      <div className="bg-white/90 backdrop-blur border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 rounded-xl hover:bg-slate-100"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-600 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-600 font-semibold">
                    Tastyaana
                  </p>
                  <h1 className="text-base sm:text-xl font-semibold text-slate-900">
                    My Orders
                  </h1>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm border border-emerald-200 text-emerald-700 bg-emerald-50/60 hover:bg-emerald-50 disabled:opacity-60"
              >
                <RefreshCw
                  className={`w-4 h-4 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </button>
              <button className="relative p-1.5 rounded-xl hover:bg-slate-100">
                <Bell className="w-5 h-5 text-slate-600" />
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {/* Stats */}
        <OrderStats />

        {/* Search + filters */}
        <div className="bg-white rounded-2xl border border-slate-100 p-3 sm:p-4 shadow-sm mb-4 sm:mb-6">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by order ID, product name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-9 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-slate-100"
                >
                  <X className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="amount_high">Highest amount</option>
                <option value="amount_low">Lowest amount</option>
                <option value="status">By status</option>
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="all">All time</option>
                <option value="week">Last week</option>
                <option value="month">Last month</option>
                <option value="3months">Last 3 months</option>
              </select>

              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="px-3 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="all">All amounts</option>
                <option value="low">Under ₹500</option>
                <option value="medium">₹500 - ₹1500</option>
                <option value="high">Above ₹1500</option>
              </select>
            </div>

            {(searchQuery || dateRange !== "all" || priceRange !== "all") && (
              <div className="border-t border-slate-100 pt-2 mt-1 flex flex-wrap gap-2 items-center">
                <span className="text-xs text-slate-500 font-medium">
                  Filters:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {searchQuery && (
                    <span className="px-2 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs border border-emerald-100">
                      Search:{" "}
                      {searchQuery.length > 15
                        ? `${searchQuery.slice(0, 15)}…`
                        : searchQuery}
                    </span>
                  )}
                  {dateRange !== "all" && (
                    <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs border border-blue-100">
                      {dateRange === "week"
                        ? "Last week"
                        : dateRange === "month"
                        ? "Last month"
                        : "Last 3 months"}
                    </span>
                  )}
                  {priceRange !== "all" && (
                    <span className="px-2 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs border border-purple-100">
                      {priceRange === "low"
                        ? "Under ₹500"
                        : priceRange === "medium"
                        ? "₹500–₹1500"
                        : "Above ₹1500"}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setDateRange("all");
                      setPriceRange("all");
                    }}
                    className="text-xs text-slate-500 hover:text-slate-700 underline"
                  >
                    Clear all
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status tabs */}
        <div className="mb-4 sm:mb-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-1 shadow-sm">
            <div className="flex overflow-x-auto scrollbar-hide gap-1">
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-shrink-0 px-2.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-1.5 min-w-fit ${
                    activeTab === tab.key
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                      activeTab === tab.key
                        ? "bg-white/20"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tab.count > 99 ? "99+" : tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders list */}
        <div className="space-y-3 sm:space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 text-center shadow-sm">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                {searchQuery ? (
                  <Search className="w-7 h-7 text-slate-400" />
                ) : (
                  <Package className="w-7 h-7 text-slate-400" />
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-semibold text-slate-900 mb-1">
                {searchQuery
                  ? "No matching orders"
                  : activeTab === "all"
                  ? "No orders yet"
                  : `No ${activeTab} orders`}
              </h3>
              <p className="text-sm sm:text-base text-slate-600 mb-4 max-w-md mx-auto">
                {searchQuery
                  ? `We couldn't find any orders for "${searchQuery}". Try removing filters or searching again.`
                  : activeTab === "all"
                  ? "Place your first order and it will appear here."
                  : `You currently don't have any ${activeTab} orders.`}
              </p>
              <button
                onClick={() => navigate("/products")}
                className="inline-flex items-center justify-center px-5 sm:px-7 py-2.5 rounded-xl bg-emerald-600 text-white text-sm sm:text-base font-semibold hover:bg-emerald-700"
              >
                <ShoppingBag className="w-4 h-4 mr-2" />
                Start shopping
              </button>
            </div>
          ) : (
            filteredOrders.map((order) => {
              const primary = getPrimaryAction(order.status);
              const handlePrimary = (e) => {
                e.stopPropagation();
                if (primary.type === "track") {
                  handleTrackOrder(order);
                } else {
                  handleViewDetails(order);
                }
              };

              return (
                <div
                  key={order._id}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
                  onClick={() => handleViewDetails(order)}
                >
                  {/* Header */}
                  <div className="p-3 sm:p-4 border-b border-slate-100">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                          <Package className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm sm:text-base font-semibold text-slate-900 truncate">
                              Order #
                              {order.orderNumber || order._id?.slice(-8)}
                            </h3>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyOrderId(order.orderNumber || order._id);
                              }}
                              className="p-1 rounded-lg hover:bg-slate-100"
                            >
                              <Copy className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-slate-500">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(
                                order.createdAt
                              ).toLocaleDateString("en-IN")}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <CreditCard className="w-3 h-3" />
                              ₹{order.totalAmount?.toFixed(2) || "0.00"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {getStatusIcon(order.status)}
                          <span>
                            {order.status?.charAt(0).toUpperCase() +
                              order.status?.slice(1)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500">
                          Total:{" "}
                          <span className="font-semibold text-slate-900">
                            ₹{order.totalAmount?.toFixed(2) || "0.00"}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="px-3 sm:px-4 py-2 bg-slate-50">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-slate-500">
                        Order progress
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {getDeliveryProgress(order.status)}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-1.5 rounded-full bg-emerald-500 transition-all duration-500"
                        style={{
                          width: `${getDeliveryProgress(order.status)}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="px-3 sm:px-4 py-3 border-b border-slate-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-900">
                        Items
                      </span>
                      <span className="text-xs text-slate-500">
                        {order.items?.length || 0} items
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {order.items?.slice(0, 3).map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100"
                        >
                          <div className="w-7 h-7 rounded-md bg-slate-200 flex items-center justify-center flex-shrink-0">
                            <Package className="w-3.5 h-3.5 text-slate-500" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-slate-800 truncate max-w-[110px] sm:max-w-[150px]">
                              {item.name || item.product?.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <div className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100">
                          +{order.items.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Address */}
                  {order.deliveryAddress && (
                    <div className="px-3 sm:px-4 py-3 border-b border-slate-100">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-900 mb-0.5">
                            Delivering to
                          </p>
                          <p className="text-xs text-slate-600 break-words">
                            {order.deliveryAddress?.street ||
                              order.deliveryAddress?.line1}
                            {order.deliveryAddress?.city &&
                              `, ${order.deliveryAddress.city}`}
                            {order.deliveryAddress?.state &&
                              `, ${order.deliveryAddress.state}`}
                            {order.deliveryAddress?.pincode &&
                              ` - ${order.deliveryAddress.pincode}`}
                          </p>
                          {order.estimatedDelivery && (
                            <p className="text-[11px] text-emerald-700 mt-1 font-medium">
                              ETA:{" "}
                              {new Date(
                                order.estimatedDelivery
                              ).toLocaleDateString("en-IN")}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="p-3 sm:p-4">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                      <button
                        onClick={handlePrimary}
                        className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-black"
                      >
                        {primary.type === "track" ? (
                          <Navigation className="w-4 h-4 mr-1.5" />
                        ) : (
                          <Eye className="w-4 h-4 mr-1.5" />
                        )}
                        {primary.label}
                      </button>

                      {order.trackingNumber &&
                        primary.type !== "track" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTrackOrder(order);
                            }}
                            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl border border-emerald-600 text-emerald-700 text-sm font-semibold hover:bg-emerald-50"
                          >
                            <Truck className="w-4 h-4 mr-1.5" />
                            Track
                          </button>
                        )}

                      <div className="flex gap-2 sm:flex-none">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            shareOrder(order);
                          }}
                          className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                          title="Share order"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            contactSupport(order);
                          }}
                          className="inline-flex items-center justify-center w-10 h-10 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
                          title="Support"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-100">
                      {order.status?.toLowerCase() === "delivered" && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              reorderItems(order);
                            }}
                            className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100"
                          >
                            <RotateCcw className="w-3.5 h-3.5 mr-1" />
                            Reorder
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/review/${order._id}`);
                            }}
                            className="inline-flex items-center px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-700 text-xs font-medium hover:bg-slate-100"
                          >
                            <Star className="w-3.5 h-3.5 mr-1 text-amber-500" />
                            Rate order
                          </button>
                        </>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadInvoice(order);
                        }}
                        className="inline-flex items-center px-2.5 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-50"
                      >
                        <Download className="w-3.5 h-3.5 mr-1" />
                        Invoice
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Help section */}
        <div className="mt-8 sm:mt-10 bg-gradient-to-br from-emerald-50 via-emerald-50 to-blue-50 border border-emerald-100 rounded-2xl p-4 sm:p-6">
          <div className="text-center max-w-2xl mx-auto">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
              <MessageCircle className="w-6 h-6 text-emerald-700" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-1">
              Need help with an order?
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 mb-4">
              Our support team can help you with delivery issues, refunds, or
              anything related to your Tastyaana orders.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={() => navigate("/support")}
                className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
              >
                <Phone className="w-4 h-4 mr-1.5" />
                Contact support
              </button>
              <button
                onClick={() => navigate("/faq")}
                className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 rounded-xl border border-emerald-200 text-emerald-700 text-sm font-semibold hover:bg-emerald-50"
              >
                <FileText className="w-4 h-4 mr-1.5" />
                View FAQs
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Order modal */}
      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default MyOrdersPage;
