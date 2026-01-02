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
  Filter,
  Search,
  X,
  Star,
  Phone,
  AlertCircle,
  ShoppingBag,
  Loader2,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  CreditCard,
  RotateCcw,
  MessageCircle,
  Share2,
  Copy,
  ExternalLink,
  FileText,
  User,
  Mail,
  Globe,
  Zap,
  Gift,
  Tag,
  TrendingUp,
  Award,
  Shield,
  Timer,
  Home,
  Plus,
  Minus,
  Heart,
  ShoppingCart,
  Bell,
  Settings,
  Navigation,
  XCircle,
} from "lucide-react";
import { fetchOrders } from "../../redux/orderSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

// Create memoized selectors
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

  // Redux state
  const { items: orders, loading, error } = useSelector(selectOrdersData);
  const { user: userInfo, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  // Local state
  const [activeTab, setActiveTab] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("newest");
  const [dateRange, setDateRange] = useState("all");
  const [priceRange, setPriceRange] = useState("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [trackingData, setTrackingData] = useState({});
  const [showTrackingMap, setShowTrackingMap] = useState({});

  // Fetch orders on component mount
  useEffect(() => {
    if (isAuthenticated && userInfo) {
      dispatch(fetchOrders())
        .unwrap()
        .then((data) => {
          console.log("Orders fetched successfully:", data);
        })
        .catch((error) => {
          console.error("Failed to fetch orders:", error);
        });
    } else if (!isAuthenticated) {
      // Redirect to login if not authenticated
      navigate("/login");
    }
  }, [dispatch, isAuthenticated, userInfo, navigate]);

  // Fetch tracking data for an order
  const fetchTrackingData = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/delivery-tracking/${orderId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTrackingData((prev) => ({
          ...prev,
          [orderId]: data,
        }));
      }
    } catch (error) {
      console.error("Error fetching tracking data:", error);
    }
  };

  // Toggle tracking map display
  const toggleTrackingMap = (orderId) => {
    setShowTrackingMap((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));

    // Fetch tracking data if not already loaded
    if (!trackingData[orderId]) {
      fetchTrackingData(orderId);
    }
  };

  // Helper functions
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return "text-green-700 bg-green-50 border-green-200";
      case "shipped":
      case "out for delivery":
        return "text-blue-700 bg-blue-50 border-blue-200";
      case "pending":
      case "processing":
        return "text-orange-700 bg-orange-50 border-orange-200";
      case "cancelled":
      case "canceled":
        return "text-red-700 bg-red-50 border-red-200";
      case "confirmed":
        return "text-emerald-700 bg-emerald-50 border-emerald-200";
      default:
        return "text-gray-700 bg-gray-50 border-gray-200";
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

  // Enhanced filtering and sorting
  const filteredOrders = useMemo(() => {
    return (
      orders
        ?.filter((order) => {
          // Filter by status
          if (
            activeTab !== "all" &&
            order.status?.toLowerCase() !== activeTab
          ) {
            return false;
          }

          // Filter by search query
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

          // Filter by date range
          if (dateRange !== "all") {
            const orderDate = new Date(order.createdAt);
            const now = new Date();
            const daysDiff = (now - orderDate) / (1000 * 60 * 60 * 24);

            switch (dateRange) {
              case "week":
                if (daysDiff > 7) return false;
                break;
              case "month":
                if (daysDiff > 30) return false;
                break;
              case "3months":
                if (daysDiff > 90) return false;
                break;
            }
          }

          // Filter by price range
          if (priceRange !== "all") {
            const amount = order.totalAmount || 0;
            switch (priceRange) {
              case "low":
                if (amount >= 500) return false;
                break;
              case "medium":
                if (amount < 500 || amount >= 1500) return false;
                break;
              case "high":
                if (amount < 1500) return false;
                break;
            }
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

  // Status tabs with dynamic counts
  const statusTabs = useMemo(
    () => [
      {
        key: "all",
        label: "All Orders",
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

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await dispatch(fetchOrders()).unwrap();
      toast.success("Orders refreshed successfully!");
    } catch (error) {
      toast.error("Failed to refresh orders");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle copy order ID
  const copyOrderId = (orderId) => {
    navigator.clipboard.writeText(orderId);
    toast.success("Order ID copied to clipboard!");
  };

  // Handle share order
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

  // Handle track order - Navigate to /track with order ID
  const handleTrackOrder = (order) => {
    navigate(`/track/${order._id}`, {
      state: {
        order: order,
        trackingNumber: order.trackingNumber,
      },
    });
  };

  // Handle view details - Show modal
  const handleViewDetails = (order) => {
    setSelectedOrder(order);
  };

  // Download invoice functionality
  const downloadInvoice = async (order) => {
    try {
      // In a real app, this would call an API to generate/download invoice
      toast.info("Generating invoice...");

      // Simulate download delay
      setTimeout(() => {
        toast.success("Invoice downloaded successfully!");
      }, 2000);
    } catch (error) {
      toast.error("Failed to download invoice");
    }
  };

  // Contact support functionality
  const contactSupport = (order) => {
    const message = `Hi, I need help with my order #${
      order.orderNumber || order._id?.slice(-8)
    }`;
    // In a real app, this might open a chat widget or navigate to support page
    toast.info("Redirecting to customer support...");
    setTimeout(() => {
      navigate("/support", { state: { orderId: order._id, message } });
    }, 1000);
  };

  // Reorder functionality
  const reorderItems = (order) => {
    // Add items to cart and navigate to cart
    toast.success("Items added to cart!");
    navigate("/cart");
  };

  // Order Modal Component
  const OrderModal = ({ order, onClose }) => {
    // Check if order is cancelled or delivered
    const isCompletedOrder =
      order.status === "cancelled" || order.status === "delivered";

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Order Details</h2>
              <p className="text-gray-600">
                Order #{order.orderNumber || order._id}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Order Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(order.status)}
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                    order?.status
                  )}`}
                >
                  {order?.status?.charAt(0).toUpperCase() +
                    order.status.slice(1)}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Order Date</p>
                <p className="font-medium">
                  {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Delivery Time for Delivered Orders */}
            {order.status === "delivered" && order.deliveredAt && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Delivered On</span>
                </div>
                <p className="text-sm text-gray-700">
                  {new Date(order.deliveredAt).toLocaleDateString()} at{" "}
                  {new Date(order.deliveredAt).toLocaleTimeString()}
                </p>
              </div>
            )}

            {/* Cancellation Info for Cancelled Orders */}
            {order.status === "cancelled" && order.cancelledAt && (
              <div className="bg-red-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium">Cancelled On</span>
                </div>
                <p className="text-sm text-gray-700">
                  {new Date(order.cancelledAt).toLocaleDateString()} at{" "}
                  {new Date(order.cancelledAt).toLocaleTimeString()}
                </p>
                {order.cancellationReason && (
                  <p className="text-sm text-gray-600 mt-1">
                    Reason: {order.cancellationReason}
                  </p>
                )}
              </div>
            )}

            {/* Delivery Partner Info - Only for completed orders */}
            {isCompletedOrder && order.deliveryPartner && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-3">
                  <User className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Assigned Delivery Partner</span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Name:</span>{" "}
                    {order.deliveryPartner.name}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Phone:</span>{" "}
                    {order.deliveryPartner.phone}
                  </p>
                  {order.deliveryPartner.rating && (
                    <p className="text-sm">
                      <span className="font-medium">Rating:</span> ⭐{" "}
                      {order.deliveryPartner.rating}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Items Ordered */}
            <div>
              <h3 className="font-semibold mb-3">Items Ordered</h3>
              <div className="space-y-3">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-4 p-3 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      <p className="text-gray-600">
                        Weight: {item.weight || "N/A"}
                      </p>
                      <p className="text-gray-600">Quantity: {item.quantity}</p>
                      {/* Seller Information */}
                      {item.seller && (
                        <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-blue-700 font-medium flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              Sold by: {item.seller.name || "Tastyaana Store"}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{item.price}</p>
                      {item.originalPrice &&
                        item.originalPrice > item.price && (
                          <p className="text-sm text-gray-500 line-through">
                            ₹{item.originalPrice}
                          </p>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Information */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                <span className="font-medium">Payment Information</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Method:</span>
                  <span
                    className={`font-medium ${
                      order.paymentMethod === "COD"
                        ? "text-orange-600"
                        : "text-green-600"
                    }`}
                  >
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
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment Status:</span>
                  <span
                    className={`font-medium ${
                      order.paymentStatus === "paid" ||
                      order.paymentStatus === "completed"
                        ? "text-green-600"
                        : order.paymentStatus === "pending"
                        ? "text-orange-600"
                        : order.paymentStatus === "failed"
                        ? "text-red-600"
                        : order.paymentStatus === "refunded"
                        ? "text-blue-600"
                        : "text-gray-600"
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
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-mono text-xs text-gray-700">
                      {order.transactionId}
                    </span>
                  </div>
                )}
                {order.paidAt && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Paid On:</span>
                    <span className="text-gray-700">
                      {new Date(order.paidAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>₹{order.subtotal?.toFixed(2) || "0.00"}</span>
              </div>
              {order?.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount:</span>
                  <span>-₹{order?.discountAmount?.toFixed(2)}</span>
                </div>
              )}

              {/* All Charges from taxes object */}
              {order?.taxes?.gst > 0 && (
                <div className="flex justify-between text-sm">
                  <span>GST:</span>
                  <span>₹{order?.taxes?.gst?.toFixed(2)}</span>
                </div>
              )}
              {order?.taxes?.deliveryCharges > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Delivery Charges data:</span>
                  <span>₹{order?.taxes?.deliveryCharges?.toFixed(2)}</span>
                </div>
              )}
              {order?.taxes?.packagingCharges > 0 && (
                <div className="flex justify-between text-sm">
                  <span>Packaging Charges:</span>
                  <span>₹{order?.taxes?.packagingCharges?.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-lg font-semibold">Total</span>
                <span className="text-xl font-bold text-blue-600">
                  ₹{order?.totalAmount?.toFixed(2) || "0.00"}
                </span>
              </div>
            </div>

            {/* Show tracking button only for non-completed orders */}
            {!isCompletedOrder && (
              <>
                {/* Delivery Boy Info for active orders */}
                {order.deliveryPartner && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-3">
                      <User className="w-5 h-5 text-green-600" />
                      <span className="font-medium">Delivery Partner</span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Name:</span>{" "}
                        {order.deliveryPartner.name}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Phone:</span>{" "}
                        {order.deliveryPartner.phone}
                      </p>
                      <div className="flex space-x-2 mt-3">
                        <a
                          href={`tel:${order.deliveryPartner.phone}`}
                          className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                        >
                          <Phone className="w-3 w-3 mr-1" />
                          Call
                        </a>
                        <button
                          onClick={() => navigate(`/track-order/${order._id}`)}
                          className="flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                        >
                          <Navigation className="w-3 h-3 mr-1" />
                          Track Live
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tracking Info */}
                {order.trackingNumber && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <Truck className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">Tracking Information</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Tracking Number: {order.trackingNumber}
                    </p>
                    <p className="text-sm text-gray-600">
                      Estimated Delivery:{" "}
                      {order.estimatedDelivery
                        ? new Date(order.estimatedDelivery).toLocaleDateString()
                        : "Not set"}
                    </p>
                  </div>
                )}

                {/* Delivery Partner Information */}
                {trackingData[order._id]?.driver && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-green-800 flex items-center">
                        <Truck className="h-5 w-5 mr-2" />
                        Delivery Partner
                      </h3>
                      {trackingData[order._id].driver.phone && (
                        <a
                          href={`tel:${trackingData[order._id].driver.phone}`}
                          className="flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                        >
                          <Phone className="h-3 w-3 mr-1" />
                          Call Driver
                        </a>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-green-700">
                          <strong>Name:</strong>{" "}
                          {trackingData[order._id].driver.name}
                        </p>
                        <p className="text-green-700">
                          <strong>Rating:</strong> ⭐{" "}
                          {trackingData[order._id].driver.rating}
                        </p>
                      </div>
                      <div>
                        <p className="text-green-700">
                          <strong>Vehicle:</strong>{" "}
                          {trackingData[order._id].driver.vehicle?.type}{" "}
                          {trackingData[order._id].driver.vehicle?.number}
                        </p>
                        <p className="text-green-700">
                          <strong>Deliveries:</strong>{" "}
                          {trackingData[order._id].driver.deliveries}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Shipping Address */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <span className="font-medium">Shipping Address</span>
                  </div>
                  <p className="text-gray-700">
                    {order?.deliveryAddress?.street ||
                      order.deliveryAddress?.line1 ||
                      ""}{" "}
                    {order?.deliveryAddress?.city},{" "}
                    {order?.deliveryAddress?.state},{" "}
                    {order?.deliveryAddress?.pincode}
                  </p>
                </div>

                {/* Tracking Button */}
                <div className="flex justify-center pt-4 border-t">
                  <button
                    onClick={() => navigate(`/track-order/${order._id}`)}
                    className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Track Order Live
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Order Statistics Component
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 xs:gap-3 sm:gap-4 mb-4 xs:mb-6">
        <div className="bg-white p-3 xs:p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 xs:gap-3">
            <div className="w-8 h-8 xs:w-10 xs:h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <Package className="w-4 h-4 xs:w-5 xs:h-5 text-emerald-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {stats.totalOrders}
              </p>
              <p className="text-xs xs:text-sm text-gray-600">Total Orders</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 xs:p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 xs:gap-3">
            <div className="w-8 h-8 xs:w-10 xs:h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4 xs:w-5 xs:h-5 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 truncate">
                ₹{stats.totalSpent.toFixed(0)}
              </p>
              <p className="text-xs xs:text-sm text-gray-600">Total Spent</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 xs:p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 xs:gap-3">
            <div className="w-8 h-8 xs:w-10 xs:h-10 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 xs:w-5 xs:h-5 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 truncate">
                {stats.deliveredOrders}
              </p>
              <p className="text-xs xs:text-sm text-gray-600">Delivered</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 xs:p-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 xs:gap-3">
            <div className="w-8 h-8 xs:w-10 xs:h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 xs:w-5 xs:h-5 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900 truncate">
                ₹{stats.avgOrderValue.toFixed(0)}
              </p>
              <p className="text-xs xs:text-sm text-gray-600">Avg Order</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading && !orders?.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm mx-auto">
          <div className="w-16 h-16 xs:w-20 xs:h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 xs:mb-6">
            <Loader2 className="w-8 h-8 xs:w-10 xs:h-10 animate-spin text-emerald-600" />
          </div>
          <h2 className="text-xl xs:text-2xl font-bold text-gray-900 mb-2">
            Loading Your Orders
          </h2>
          <p className="text-sm xs:text-base text-gray-600 max-w-md">
            Please wait while we fetch your order history. This won't take long.
          </p>
          <div className="mt-4 xs:mt-6 flex items-center justify-center gap-2 text-sm text-gray-500">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 xs:w-20 xs:h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 xs:mb-6">
            <AlertCircle className="w-8 h-8 xs:w-10 xs:h-10 text-red-600" />
          </div>
          <h2 className="text-xl xs:text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-sm xs:text-base text-gray-600 mb-4 xs:mb-6">
            {error}
          </p>
          <div className="flex flex-col xs:flex-row gap-3 justify-center">
            <button
              onClick={handleRefresh}
              className="bg-emerald-600 text-white px-4 xs:px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 min-h-[44px] text-sm xs:text-base"
            >
              <RefreshCw className="w-4 h-4 xs:w-5 xs:h-5" />
              Try Again
            </button>
            <button
              onClick={() => navigate("/products")}
              className="border border-gray-300 text-gray-700 px-4 xs:px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors min-h-[44px] text-sm xs:text-base"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 py-3 xs:py-4 lg:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 xs:gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 xs:p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 xs:w-6 xs:h-6 text-gray-600" />
              </button>
              <div className="flex items-center gap-2 xs:gap-3">
                <div className="w-10 h-10 xs:w-12 xs:h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl xs:text-2xl">
                    T
                  </span>
                </div>
                <div className="min-w-0">
                  <h1 className="text-lg xs:text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                    My Orders
                  </h1>
                  <p className="text-xs xs:text-sm text-gray-600 hidden xs:block">
                    Track and manage your orders
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 xs:gap-2">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-1.5 xs:p-2 lg:px-4 lg:py-2 hover:bg-emerald-50 text-emerald-600 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 min-w-0"
              >
                <RefreshCw
                  className={`w-4 h-4 xs:w-5 xs:h-5 ${
                    isRefreshing ? "animate-spin" : ""
                  }`}
                />
                <span className="hidden lg:inline text-sm font-medium">
                  Refresh
                </span>
              </button>

              <button
                onClick={() => navigate("/notifications")}
                className="p-1.5 xs:p-2 hover:bg-gray-100 rounded-xl transition-colors relative"
              >
                <Bell className="w-4 h-4 xs:w-5 xs:h-5 text-gray-600" />
                <span className="absolute -top-0.5 -right-0.5 xs:-top-1 xs:-right-1 w-2.5 h-2.5 xs:w-3 xs:h-3 bg-red-500 rounded-full"></span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 xs:px-4 py-4 xs:py-6">
        {/* Order Statistics */}
        <OrderStats />

        {/* Enhanced Search and Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 xs:p-4 lg:p-6 mb-4 xs:mb-6 shadow-sm">
          <div className="flex flex-col gap-3 xs:gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 xs:w-5 xs:h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 xs:pl-10 pr-4 py-2.5 xs:py-3 text-sm xs:text-base border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-3 h-3 xs:w-4 xs:h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-3 gap-2 xs:gap-3">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount_high">Highest Amount</option>
                <option value="amount_low">Lowest Amount</option>
                <option value="status">By Status</option>
              </select>

              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium"
              >
                <option value="all">All Time</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="3months">Last 3 Months</option>
              </select>

              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="px-3 xs:px-4 py-2.5 xs:py-3 text-sm xs:text-base border border-gray-300 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-medium xs:col-span-2 lg:col-span-1"
              >
                <option value="all">All Amounts</option>
                <option value="low">Under ₹500</option>
                <option value="medium">₹500 - ₹1500</option>
                <option value="high">Above ₹1500</option>
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(searchQuery || dateRange !== "all" || priceRange !== "all") && (
            <div className="flex flex-col xs:flex-row xs:items-center gap-2 mt-3 xs:mt-4 pt-3 xs:pt-4 border-t border-gray-100">
              <span className="text-xs xs:text-sm font-medium text-gray-600">
                Active filters:
              </span>
              <div className="flex flex-wrap items-center gap-1.5 xs:gap-2">
                {searchQuery && (
                  <span className="bg-emerald-50 text-emerald-700 px-2 xs:px-3 py-1 rounded-lg text-xs xs:text-sm border border-emerald-200">
                    Search: "
                    {searchQuery.length > 15
                      ? searchQuery.slice(0, 15) + "..."
                      : searchQuery}
                    "
                  </span>
                )}
                {dateRange !== "all" && (
                  <span className="bg-blue-50 text-blue-700 px-2 xs:px-3 py-1 rounded-lg text-xs xs:text-sm border border-blue-200">
                    {dateRange === "week"
                      ? "Last Week"
                      : dateRange === "month"
                      ? "Last Month"
                      : "Last 3 Months"}
                  </span>
                )}
                {priceRange !== "all" && (
                  <span className="bg-purple-50 text-purple-700 px-2 xs:px-3 py-1 rounded-lg text-xs xs:text-sm border border-purple-200">
                    {priceRange === "low"
                      ? "Under ₹500"
                      : priceRange === "medium"
                      ? "₹500-₹1500"
                      : "Above ₹1500"}
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setDateRange("all");
                    setPriceRange("all");
                  }}
                  className="text-xs xs:text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  Clear all
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Status Tabs */}
        <div className="mb-4 xs:mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
            <div className="flex overflow-x-auto scrollbar-hide gap-0.5 xs:gap-1">
              {statusTabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-shrink-0 px-2 xs:px-3 sm:px-4 py-2.5 xs:py-3 rounded-lg font-semibold text-xs xs:text-sm transition-all flex items-center gap-1.5 xs:gap-2 min-w-fit ${
                    activeTab === tab.key
                      ? "bg-emerald-600 text-white shadow-lg"
                      : "text-gray-600 hover:text-emerald-600 hover:bg-emerald-50"
                  }`}
                >
                  <tab.icon className="w-3 h-3 xs:w-4 xs:h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                  <span
                    className={`px-1.5 xs:px-2 py-0.5 rounded-full text-xs font-bold ${
                      activeTab === tab.key
                        ? "bg-white/20 text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {tab.count > 99 ? "99+" : tab.count}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="space-y-3 xs:space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 xs:py-16 bg-white rounded-xl border border-gray-200 shadow-sm mx-3 xs:mx-0">
              <div className="w-20 h-20 xs:w-24 xs:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 xs:mb-6">
                {searchQuery ? (
                  <Search className="w-10 h-10 xs:w-12 xs:h-12 text-gray-400" />
                ) : (
                  <Package className="w-10 h-10 xs:w-12 xs:h-12 text-gray-400" />
                )}
              </div>
              <h3 className="text-xl xs:text-2xl font-bold text-gray-900 mb-2 xs:mb-3 px-4">
                {searchQuery
                  ? "No matching orders found"
                  : activeTab === "all"
                  ? "No orders yet"
                  : `No ${activeTab} orders`}
              </h3>
              <p className="text-sm xs:text-base text-gray-600 mb-6 xs:mb-8 max-w-md mx-auto px-4">
                {searchQuery
                  ? `We couldn't find any orders matching "${searchQuery}". Try adjusting your search or filters.`
                  : activeTab === "all"
                  ? "You haven't placed any orders yet. Start shopping to see your orders here."
                  : `You don't have any ${activeTab} orders at the moment.`}
              </p>
              <div className="flex flex-col xs:flex-row gap-3 justify-center px-4">
                <button
                  onClick={() => navigate("/products")}
                  className="bg-emerald-600 text-white px-6 xs:px-8 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 min-h-[44px] text-sm xs:text-base"
                >
                  <ShoppingBag className="w-4 h-4 xs:w-5 xs:h-5" />
                  Start Shopping
                </button>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setDateRange("all");
                      setPriceRange("all");
                    }}
                    className="border border-gray-300 text-gray-700 px-6 xs:px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors min-h-[44px] text-sm xs:text-base"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <div
                key={order._id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group"
              >
                {/* Order Header */}
                <div className="p-3 xs:p-4 sm:p-6 border-b border-gray-100">
                  <div className="flex flex-col gap-3 xs:gap-4">
                    <div className="flex items-start gap-3 xs:gap-4">
                      <div className="w-10 h-10 xs:w-12 xs:h-12 sm:w-14 sm:h-14 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Package className="w-5 h-5 xs:w-6 xs:h-6 sm:w-7 sm:h-7 text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 xs:gap-3 mb-1 xs:mb-2">
                          <h3 className="font-bold text-sm xs:text-base sm:text-lg text-gray-900 truncate">
                            Order #{order.orderNumber || order._id?.slice(-8)}
                          </h3>
                          <button
                            onClick={() =>
                              copyOrderId(order.orderNumber || order._id)
                            }
                            className="p-1 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                          >
                            <Copy className="w-3 h-3 xs:w-4 xs:h-4 text-gray-400" />
                          </button>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 xs:gap-4 text-xs xs:text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <CreditCard className="w-3 h-3 xs:w-4 xs:h-4" />
                            <span>
                              ₹{order.totalAmount?.toFixed(2) || "0.00"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {new Date(order.createdAt).toLocaleDateString(
                                "en-IN"
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
                      {/* Status Badge */}
                      <div
                        className={`flex items-center gap-1.5 xs:gap-2 px-3 xs:px-4 py-1.5 xs:py-2 rounded-full border ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusIcon(order.status)}
                        <span className="font-semibold text-xs xs:text-sm">
                          {order.status?.charAt(0).toUpperCase() +
                            order.status?.slice(1)}
                        </span>
                      </div>

                      {/* Order Total */}
                      <div className="text-left xs:text-right">
                        <p className="text-lg xs:text-xl sm:text-2xl font-bold text-gray-900">
                          ₹{order.totalAmount?.toFixed(2) || "0.00"}
                        </p>
                        <p className="text-xs xs:text-sm text-gray-500">
                          Total Amount
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="px-3 xs:px-4 sm:px-6 py-2.5 xs:py-3 bg-gray-50">
                  <div className="flex items-center justify-between mb-1.5 xs:mb-2">
                    <span className="text-xs xs:text-sm font-medium text-gray-700">
                      Order Progress
                    </span>
                    <span className="text-xs xs:text-sm text-gray-500">
                      {getDeliveryProgress(order.status)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 xs:h-2">
                    <div
                      className="bg-emerald-500 h-1.5 xs:h-2 rounded-full transition-all duration-500"
                      style={{ width: `${getDeliveryProgress(order.status)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Order Items Preview */}
                <div className="px-3 xs:px-4 sm:px-6 py-3 xs:py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between mb-2 xs:mb-3">
                    <h4 className="font-semibold text-sm xs:text-base text-gray-900">
                      Order Items
                    </h4>
                    <span className="text-xs xs:text-sm text-gray-500">
                      {order.items?.length || 0} items
                    </span>
                  </div>
                  <div className="flex items-center gap-2 xs:gap-3 flex-wrap">
                    {order.items?.slice(0, 3).map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1.5 xs:gap-2 bg-gray-50 px-2 xs:px-3 py-1.5 xs:py-2 rounded-lg"
                      >
                        <div className="w-6 h-6 xs:w-8 xs:h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-3 h-3 xs:w-4 xs:h-4 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs xs:text-sm font-medium text-gray-800 truncate max-w-[80px] xs:max-w-[120px]">
                            {item.name || item.product?.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            Qty: {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <div className="bg-emerald-50 text-emerald-700 px-2 xs:px-3 py-1.5 xs:py-2 rounded-lg text-xs xs:text-sm font-medium border border-emerald-200">
                        +{order.items.length - 3} more
                      </div>
                    )}
                  </div>
                </div>

                {/* Delivery Information */}
                {order.deliveryAddress && (
                  <div className="px-3 xs:px-4 sm:px-6 py-3 xs:py-4 border-b border-gray-100">
                    <div className="flex items-start gap-2 xs:gap-3">
                      <MapPin className="w-4 h-4 xs:w-5 xs:h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm xs:text-base text-gray-900 mb-1">
                          Delivery Address
                        </p>
                        <p className="text-xs xs:text-sm text-gray-600 break-words">
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
                          <p className="text-xs xs:text-sm text-emerald-600 font-medium mt-1">
                            Expected:{" "}
                            {new Date(
                              order.estimatedDelivery
                            ).toLocaleDateString("en-IN")}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="p-3 xs:p-4 sm:p-6">
                  <div className="flex flex-col xs:flex-row gap-2 xs:gap-3">
                    {/* Primary Actions */}
                    <button
                      onClick={() => handleViewDetails(order)}
                      className="flex-1 bg-emerald-600 text-white py-2.5 xs:py-3 px-4 xs:px-6 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1.5 xs:gap-2 group min-h-[44px]"
                    >
                      <Eye className="w-4 h-4 xs:w-5 xs:h-5 group-hover:scale-110 transition-transform" />
                      <span className="text-sm xs:text-base">View Details</span>
                    </button>

                    {order.trackingNumber && (
                      <button
                        onClick={() => handleTrackOrder(order)}
                        className="flex-1 border-2 border-emerald-600 text-emerald-600 py-2.5 xs:py-3 px-4 xs:px-6 rounded-xl font-semibold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-1.5 xs:gap-2 group min-h-[44px]"
                      >
                        <Truck className="w-4 h-4 xs:w-5 xs:h-5 group-hover:scale-110 transition-transform" />
                        <span className="text-sm xs:text-base">Track</span>
                      </button>
                    )}

                    {/* Secondary Actions */}
                    <div className="flex gap-2 xs:flex-shrink-0">
                      <button
                        onClick={() => shareOrder(order)}
                        className="px-3 xs:px-4 py-2.5 xs:py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
                        title="Share Order"
                      >
                        <Share2 className="w-4 h-4 xs:w-5 xs:h-5" />
                      </button>

                      <button
                        onClick={() => contactSupport(order)}
                        className="px-3 xs:px-4 py-2.5 xs:py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center min-w-[44px] min-h-[44px]"
                        title="Contact Support"
                      >
                        <MessageCircle className="w-4 h-4 xs:w-5 xs:h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-1.5 xs:gap-2 mt-2 xs:mt-3 pt-2 xs:pt-3 border-t border-gray-100">
                    {order.status?.toLowerCase() === "delivered" && (
                      <button
                        onClick={() => reorderItems(order)}
                        className="text-xs xs:text-sm text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1 px-2 xs:px-3 py-1 hover:bg-emerald-50 rounded-lg transition-colors min-h-[32px]"
                      >
                        <RotateCcw className="w-3 h-3 xs:w-4 xs:h-4" />
                        <span>Reorder</span>
                      </button>
                    )}

                    {order.status?.toLowerCase() === "delivered" && (
                      <button
                        onClick={() => navigate(`/review/${order._id}`)}
                        className="text-xs xs:text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 px-2 xs:px-3 py-1 hover:bg-blue-50 rounded-lg transition-colors min-h-[32px]"
                      >
                        <Star className="w-3 h-3 xs:w-4 xs:h-4" />
                        <span>Review</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Load More Button */}
        {filteredOrders.length > 0 &&
          orders?.length > filteredOrders.length && (
            <div className="text-center mt-6 xs:mt-8">
              <button
                onClick={handleRefresh}
                className="bg-white border border-gray-300 text-gray-700 px-6 xs:px-8 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center gap-2 mx-auto min-h-[44px] text-sm xs:text-base"
              >
                <RefreshCw className="w-4 h-4 xs:w-5 xs:h-5" />
                Load More Orders
              </button>
            </div>
          )}

        {/* Help Section */}
        <div className="mt-8 xs:mt-12 bg-gradient-to-br from-emerald-50 to-blue-50 rounded-2xl p-4 xs:p-6 lg:p-8 border border-emerald-100 mx-3 xs:mx-0">
          <div className="text-center">
            <div className="w-12 h-12 xs:w-16 xs:h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3 xs:mb-4">
              <MessageCircle className="w-6 h-6 xs:w-8 xs:h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg xs:text-xl font-bold text-gray-900 mb-2 px-4">
              Need Help with Your Orders?
            </h3>
            <p className="text-sm xs:text-base text-gray-600 mb-4 xs:mb-6 max-w-2xl mx-auto px-4">
              Our customer support team is here to help you with any questions
              about your orders, delivery, or returns. Get in touch and we'll
              resolve your concerns quickly.
            </p>
            <div className="flex flex-col xs:flex-row gap-3 justify-center px-4">
              <button
                onClick={() => navigate("/support")}
                className="bg-emerald-600 text-white px-4 xs:px-6 py-3 rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 min-h-[44px] text-sm xs:text-base"
              >
                <Phone className="w-4 h-4 xs:w-5 xs:h-5" />
                Contact Support
              </button>
              <button
                onClick={() => navigate("/faq")}
                className="border border-emerald-600 text-emerald-600 px-4 xs:px-6 py-3 rounded-xl font-semibold hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 min-h-[44px] text-sm xs:text-base"
              >
                <FileText className="w-4 h-4 xs:w-5 xs:h-5" />
                View FAQs
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {selectedOrder && (
        <OrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        @keyframes bounce {
          0%,
          100% {
            transform: translateY(-25%);
          }
          50% {
            transform: translateY(0);
          }
        }

        .animate-bounce {
          animation: bounce 1s infinite;
        }

        /* Smooth transitions */
        * {
          transition-property: color, background-color, border-color, transform,
            box-shadow, opacity;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }

        /* Hover effects */
        .group:hover .group-hover\:scale-110 {
          transform: scale(1.1);
        }

        /* Custom animations for loading dots */
        .animate-bounce:nth-child(2) {
          animation-delay: 0.1s;
        }
        .animate-bounce:nth-child(3) {
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
};

export default MyOrdersPage;
