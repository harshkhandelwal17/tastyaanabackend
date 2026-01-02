import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  Package,
  Clock,
  MapPin,
  User,
  Phone,
  DollarSign,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Navigation,
  Calendar,
  FileText,
  Loader2,
  ArrowLeft,
  Timer,
} from "lucide-react";
import axios from "axios";

const DriverOrderAccept = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [subscriptionOrders, setSubscriptionOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingOrder, setAcceptingOrder] = useState(null);
  const [activeTab, setActiveTab] = useState("normal");

  useEffect(() => {
    fetchAvailableOrders();
    // Refresh orders every 30 seconds
    const interval = setInterval(fetchAvailableOrders, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAvailableOrders = async () => {
    try {
      const token =
        localStorage.getItem("driverToken") || localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const [normalOrdersRes, subscriptionOrdersRes] = await Promise.all([
        axios.get(
          `${import.meta.env.VITE_BACKEND_URL}/drivers/available-orders`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
        axios.get(
          `${
            import.meta.env.VITE_BACKEND_URL
          }/drivers/available-subscription-orders`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        ),
      ]);

      setOrders(normalOrdersRes.data.data || []);
      setSubscriptionOrders(subscriptionOrdersRes.data.data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      if (error.response?.status === 401) {
        navigate("/login");
      } else {
        toast.error("Failed to load available orders");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptOrder = async (orderId, isSubscription = false) => {
    setAcceptingOrder(orderId);
    try {
      const token =
        localStorage.getItem("driverToken") || localStorage.getItem("token");
      const endpoint = isSubscription
        ? `${
            import.meta.env.VITE_BACKEND_URL
          }/drivers/accept-subscription-order/${orderId}`
        : `${import.meta.env.VITE_BACKEND_URL}/drivers/accept-order/${orderId}`;

      await axios.post(
        endpoint,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      toast.success("Order accepted successfully!");

      // Remove the accepted order from the list
      if (isSubscription) {
        setSubscriptionOrders((prev) =>
          prev.filter((order) => order._id !== orderId)
        );
      } else {
        setOrders((prev) => prev.filter((order) => order._id !== orderId));
      }

      // Navigate to dashboard after successful acceptance
      setTimeout(() => {
        navigate("/driver/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error accepting order:", error);
      toast.error(error.response?.data?.message || "Failed to accept order");
    } finally {
      setAcceptingOrder(null);
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const getTimeRemaining = (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const timeLeft = deadlineDate - now;
    const minutesLeft = Math.max(0, Math.ceil(timeLeft / (1000 * 60)));
    return { minutesLeft, isOverdue: timeLeft < 0 };
  };

  const NormalOrderCard = ({ order }) => {
    const timeRemaining = getTimeRemaining(order.preparationDeadline);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-gray-900">#{order.orderNumber}</h3>
              <p className="text-sm text-gray-600">
                <Calendar className="h-4 w-4 inline mr-1" />
                {formatDate(order.createdAt)} • {formatTime(order.createdAt)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-lg font-bold text-green-600">
                ₹{order.totalAmount?.toFixed(2)}
              </span>
              <p className="text-xs text-gray-500">Delivery Fee</p>
            </div>
          </div>
        </div>

        {/* Countdown Timer */}
        {timeRemaining && (
          <div
            className={`px-4 py-2 border-b ${
              timeRemaining.isOverdue
                ? "bg-red-50 border-red-200"
                : timeRemaining.minutesLeft <= 5
                ? "bg-orange-50 border-orange-200"
                : "bg-blue-50 border-blue-200"
            }`}
          >
            <div
              className={`flex items-center text-sm font-medium ${
                timeRemaining.isOverdue
                  ? "text-red-800"
                  : timeRemaining.minutesLeft <= 5
                  ? "text-orange-800"
                  : "text-blue-800"
              }`}
            >
              <Timer className="h-4 w-4 mr-1" />
              {timeRemaining.isOverdue
                ? "OVERDUE - Immediate pickup required!"
                : `${timeRemaining.minutesLeft} minutes until pickup deadline`}
            </div>
          </div>
        )}

        {/* Order Details */}
        <div className="px-4 py-3">
          {/* Customer Info */}
          <div className="flex items-center mb-3">
            <User className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-700 mr-4">
              {order.customer?.name}
            </span>
            <Phone className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-700">
              {order.customer?.phone}
            </span>
          </div>

          {/* Items */}
          <div className="bg-gray-50 rounded-lg p-3 mb-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
              <Package className="h-4 w-4 mr-1" />
              Items ({order.items?.length || 0})
            </h4>
            <div className="space-y-1">
              {order.items?.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-800">
                    {item.name} ×{item.quantity}
                  </span>
                  <span className="text-gray-600">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
              {order.items?.length > 3 && (
                <p className="text-xs text-gray-500 text-center pt-1">
                  +{order.items.length - 3} more items
                </p>
              )}
            </div>
          </div>

          {/* Delivery Address */}
          <div className="flex items-start mb-4">
            <MapPin className="h-4 w-4 text-gray-500 mr-2 mt-0.5" />
            <div className="text-sm text-gray-700">
              <p className="font-medium">Delivery Address:</p>
              <p>{order.deliveryAddress?.street}</p>
              <p>
                {order.deliveryAddress?.city}, {order.deliveryAddress?.state}{" "}
                {order.deliveryAddress?.pincode}
              </p>
            </div>
          </div>

          {/* Accept Button */}
          <button
            onClick={() => handleAcceptOrder(order._id, false)}
            disabled={acceptingOrder === order._id}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {acceptingOrder === order._id ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Accepting...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Order
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const SubscriptionOrderCard = ({ order }) => {
    const delayFlag = order.handoverFlag === "delay" ? "Delayed" : null;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-gray-900">Subscription Order</h3>
              <p className="text-sm text-purple-600 font-medium">
                ID: {order.subscriptionId}
              </p>
              <p className="text-sm text-gray-600">
                <Calendar className="h-4 w-4 inline mr-1" />
                {formatDate(order.date)} • {order.shift} shift
              </p>
            </div>
            {delayFlag && (
              <div className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">
                {delayFlag}
              </div>
            )}
          </div>
        </div>

        {/* Order Details */}
        <div className="px-4 py-3">
          {/* Plan Info */}
          <div className="bg-purple-50 rounded-lg p-3 mb-3">
            <h4 className="text-sm font-medium text-purple-800 mb-2">
              Plan Details
            </h4>
            <p className="text-sm text-purple-700">
              <strong>Plan Type:</strong> {order.planType}
            </p>
            <p className="text-sm text-purple-700">
              <strong>Today's Item:</strong>{" "}
              {order.itemForToday || order.planType}
            </p>
          </div>

          {/* Customer Info */}
          <div className="flex items-center mb-3">
            <User className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-700 mr-4">
              {order.customerInfo?.name}
            </span>
            <Phone className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm text-gray-700">
              {order.customerInfo?.phone}
            </span>
          </div>

          {/* Status and Timing */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-600">Status</p>
              <p className="text-sm font-medium capitalize">{order.status}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-2">
              <p className="text-xs text-gray-600">Prep Time</p>
              <p className="text-sm font-medium">
                {order.preparationTime || "TBD"}
              </p>
            </div>
          </div>

          {/* Delay Information */}
          {order.delayInfo && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
              <h4 className="text-sm font-medium text-red-800 mb-1 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Delay Information
              </h4>
              <p className="text-sm text-red-700">
                {order.delayInfo.delayReason}
              </p>
              {order.delayInfo.penaltyAmount > 0 && (
                <p className="text-sm text-red-700">
                  Penalty: ₹{order.delayInfo.penaltyAmount}
                </p>
              )}
            </div>
          )}

          {/* Accept Button */}
          <button
            onClick={() => handleAcceptOrder(order._id, true)}
            disabled={acceptingOrder === order._id}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {acceptingOrder === order._id ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Accepting...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Accept Tiffin Order
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading available orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => navigate("/driver/dashboard")}
                className="mr-3 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Available Orders
                </h1>
                <p className="text-sm text-gray-600">
                  Accept orders for delivery
                </p>
              </div>
            </div>
            <button
              onClick={fetchAvailableOrders}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Navigation className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="px-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab("normal")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "normal"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Normal Orders ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab("subscription")}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "subscription"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Tiffin Orders ({subscriptionOrders.length})
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4">
        {activeTab === "normal" ? (
          orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                No Normal Orders Available
              </h3>
              <p className="text-gray-600 mb-4">
                Check back later for new delivery opportunities.
              </p>
              <button
                onClick={fetchAvailableOrders}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Orders
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <NormalOrderCard key={order._id} order={order} />
              ))}
            </div>
          )
        ) : subscriptionOrders.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              No Tiffin Orders Available
            </h3>
            <p className="text-gray-600 mb-4">
              Check back later for new tiffin delivery opportunities.
            </p>
            <button
              onClick={fetchAvailableOrders}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Refresh Orders
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptionOrders.map((order) => (
              <SubscriptionOrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DriverOrderAccept;
