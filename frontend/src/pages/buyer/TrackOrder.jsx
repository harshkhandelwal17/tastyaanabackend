// src/pages/orders/TrackOrder.jsx

import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  MapPin,
  Phone,
  ArrowLeft,
  Clock,
  User,
  Navigation,
  Truck,
  CheckCircle,
  Wifi,
  WifiOff,
  Activity,
  Star,
  XCircle,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";
import ZomatoStyleTrackingMap from "../../components/delivery/ZomatoStyleTrackingMap";
import MobileTrackingView from "../../components/delivery/MobileTrackingView";
import useRealTimeTracking from "../../hooks/useRealTimeTracking";
import useOrderSocket from "../../hooks/useOrderSocket";
import RealTimeOrderNotification from "../../components/common/RealTimeOrderNotification";

const TrackOrder = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [forceMobile, setForceMobile] = useState(false);

  // Get user from Redux
  const user = useSelector((state) => state.auth.user);

  // Order socket
  const {
    isConnected: orderSocketConnected,
    orderUpdates,
    driverAssignments,
    clearOrderUpdates,
    clearDriverAssignments,
  } = useOrderSocket(user?._id, user?.role);

  // Real-time tracking
  const {
    driverLocation,
    status: trackingStatus,
    timeline,
    driver,
    estimatedTime,
    connectionStatus,
    isConnected,
    isDelivered,
    isReached,
    statusInfo,
    progressPercentage,
  } = useRealTimeTracking(orderId);

  // Fetch order details + responsive check
  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const token = localStorage.getItem("token");
        const base =
          import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
        const url = base.endsWith("/api")
          ? `${base}/orders/details/${orderId}`
          : `${base}/api/orders/details/${orderId}`;

        const response = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setOrder(data.order || data);
        } else {
          toast.error("Order not found", { duration: 2000 });
          navigate("/orders");
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        toast.error("Failed to load order details", { duration: 2000 });
        navigate("/orders");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    const urlParams = new URLSearchParams(window.location.search);
    const mobileParam = urlParams.get("mobile");
    if (mobileParam === "true") setForceMobile(true);

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, [orderId, navigate]);

  // Order updates -> update local state
  useEffect(() => {
    if (!order || orderUpdates.length === 0) return;
    const latestUpdate = orderUpdates[orderUpdates.length - 1];
    if (latestUpdate.orderId === orderId) {
      setOrder((prev) => ({
        ...prev,
        status: latestUpdate.status,
        deliveryPartner: latestUpdate.deliveryPartner || prev?.deliveryPartner,
      }));
      toast(`Order status updated: ${latestUpdate.status}`, {
        duration: 2000,
      });
    }
  }, [orderUpdates, orderId, order]);

  // Driver assignment updates
  useEffect(() => {
    if (!order || driverAssignments.length === 0) return;
    const latestAssignment = driverAssignments[driverAssignments.length - 1];
    if (latestAssignment.orderId === orderId) {
      setOrder((prev) => ({
        ...prev,
        deliveryPartner: latestAssignment.driver,
        status: "assigned",
      }));
      toast.success("Driver assigned to your order!", { duration: 2000 });
    }
  }, [driverAssignments, orderId, order]);

  const callDriver = () => {
    const phone = driver?.phone || order?.deliveryPartner?.phone;
    if (phone) window.open(`tel:${phone}`);
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-sm">
            Loading your order details...
          </p>
        </div>
      </div>
    );
  }

  // No order
  if (!order) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 mb-4 text-sm">Order not found</p>
          <button
            onClick={() => navigate("/orders")}
            className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-semibold"
          >
            Back to My Orders
          </button>
        </div>
      </div>
    );
  }

  // Already completed
  if (order.status === "cancelled" || order.status === "delivered") {
    const isDeliveredStatus = order.status === "delivered";
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-slate-100 p-6 sm:p-8 shadow-sm text-center max-w-md">
          <div className="mb-4">
            {isDeliveredStatus ? (
              <CheckCircle className="w-14 h-14 text-emerald-500 mx-auto mb-2" />
            ) : (
              <XCircle className="w-14 h-14 text-rose-500 mx-auto mb-2" />
            )}
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-1">
            Order {isDeliveredStatus ? "Delivered" : "Cancelled"}
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            This order has been{" "}
            {isDeliveredStatus ? "delivered" : "cancelled"}. You can view full
            details from your orders page.
          </p>
          <button
            onClick={() => navigate("/orders")}
            className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-semibold"
          >
            Back to My Orders
          </button>
        </div>
      </div>
    );
  }

  // Mobile view
  if (isMobile || forceMobile) {
    return (
      <MobileTrackingView
        order={order}
        orderId={orderId}
        driverLocation={driverLocation}
        driver={driver || order.deliveryPartner}
        estimatedTime={estimatedTime}
        status={trackingStatus}
        timeline={timeline}
        isConnected={isConnected}
        statusInfo={statusInfo}
      />
    );
  }

  // Desktop view
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Real-time Notifications */}
      <RealTimeOrderNotification
        orderUpdates={orderUpdates}
        newOrders={[]}
        driverAssignments={driverAssignments}
        userRole={user?.role}
        onClearNotifications={() => {
          clearOrderUpdates();
          clearDriverAssignments();
        }}
      />

      {/* Header */}
      <div className="bg-white/90 backdrop-blur border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/orders")}
                className="p-1.5 rounded-xl hover:bg-slate-100"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-600 font-semibold">
                  Tastyaana
                </p>
                <h1 className="text-base sm:text-lg font-semibold text-slate-900">
                  Tracking Order #{order.orderNumber || orderId.slice(-8)}
                </h1>
                <p className="text-[11px] text-slate-500">
                  {trackingStatus
                    ? trackingStatus.replaceAll("_", " ")
                    : order.status}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {estimatedTime && (
                <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-medium">
                  ETA: {estimatedTime}
                </div>
              )}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200">
                {isConnected ? (
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <WifiOff className="w-3.5 h-3.5 text-rose-600" />
                )}
                <span
                  className={`text-[11px] font-semibold ${
                    isConnected ? "text-emerald-700" : "text-rose-700"
                  }`}
                >
                  {connectionStatus === "connected"
                    ? "Live tracking"
                    : "Offline"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Map and status */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-100">
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 font-medium">
                      Delivery status
                    </p>
                    <p className="text-sm sm:text-base font-semibold text-slate-900 flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-emerald-600" />
                      {statusInfo?.text || "On the way"}
                    </p>
                    {estimatedTime && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Estimated arrival:{" "}
                        <span className="font-medium text-slate-800">
                          {estimatedTime}
                        </span>
                      </p>
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col items-end text-xs text-slate-500">
                    <span>Placed on</span>
                    <span className="font-medium text-slate-800">
                      {new Date(order.createdAt).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {progressPercentage > 0 && (
                  <div className="mt-3">
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {Math.round(progressPercentage)}% completed
                    </p>
                  </div>
                )}
              </div>

              <div className="h-96">
                <ZomatoStyleTrackingMap
                  orderId={orderId}
                  deliveryAddress={order?.deliveryAddress}
                  driverLocation={driverLocation}
                  driver={driver || order.deliveryPartner}
                  estimatedTime={estimatedTime}
                  status={trackingStatus}
                  isConnected={isConnected}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-600" />
                Delivery timeline
              </h3>
              <div className="space-y-4">
                {timeline && timeline.length > 0 ? (
                  timeline.map((item, index) => (
                    <div key={index} className="flex items-start">
                      <div
                        className={`w-5 h-5 rounded-full mt-0.5 mr-3 flex items-center justify-center ${
                          item.completed ? "bg-emerald-600" : "bg-slate-300"
                        }`}
                      >
                        {item.completed && (
                          <CheckCircle className="w-3 h-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-xs font-medium ${
                            item.completed
                              ? "text-slate-900"
                              : "text-slate-500"
                          }`}
                        >
                          {item.description ||
                            item.status?.replaceAll("_", " ")}
                        </p>
                        {item.timestamp && (
                          <p className="text-[11px] text-slate-500 mt-1">
                            {new Date(item.timestamp).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 text-emerald-600 mr-2" />
                      <span>Order placed</span>
                    </div>
                    <div className="flex items-center">
                      <CheckCircle
                        className={`w-4 h-4 mr-2 ${
                          [
                            "confirmed",
                            "preparing",
                            "ready",
                            "assigned",
                            "picked_up",
                            "out_for_delivery",
                            "reached",
                            "delivered",
                          ].includes(trackingStatus)
                            ? "text-emerald-600"
                            : "text-slate-300"
                        }`}
                      />
                      <span>Order confirmed</span>
                    </div>
                    <div className="flex items-center">
                      <Truck
                        className={`w-4 h-4 mr-2 ${
                          [
                            "assigned",
                            "picked_up",
                            "out_for_delivery",
                            "reached",
                            "delivered",
                          ].includes(trackingStatus)
                            ? "text-blue-600"
                            : "text-slate-300"
                        }`}
                      />
                      <span
                        className={`${
                          [
                            "assigned",
                            "picked_up",
                            "out_for_delivery",
                            "reached",
                            "delivered",
                          ].includes(trackingStatus)
                            ? "text-blue-700 font-medium"
                            : "text-slate-500"
                        }`}
                      >
                        {isDelivered
                          ? "Delivered"
                          : isReached
                          ? "Driver reached"
                          : "Out for delivery"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Delivery Partner */}
            {(driver || order.deliveryPartner) && (
              <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  Delivery partner
                </h3>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-11 h-11 bg-emerald-50 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-emerald-700" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900">
                      {driver?.name || order.deliveryPartner?.name}
                    </p>
                    <p className="text-xs text-slate-600">
                      {driver?.phone || order.deliveryPartner?.phone}
                    </p>
                    {(driver?.rating || order.deliveryPartner?.rating) && (
                      <div className="flex items-center mt-1">
                        <Star className="w-4 h-4 text-amber-500 mr-1" />
                        <span className="text-xs text-slate-600">
                          {(driver?.rating || order.deliveryPartner?.rating)}/5
                        </span>
                      </div>
                    )}
                  </div>
                  {driverLocation && (
                    <div className="text-right">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse mx-auto"></div>
                      <p className="text-[10px] text-slate-500 mt-1">Live</p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {(driver?.phone || order.deliveryPartner?.phone) && (
                    <button
                      onClick={callDriver}
                      className="flex items-center justify-center w-full px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-semibold"
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Call driver
                    </button>
                  )}

                  {order?.deliveryAddress && (
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                        `${order.deliveryAddress.street || ""}, ${
                          order.deliveryAddress.city || ""
                        }`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-full px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-black text-sm font-semibold"
                    >
                      <Navigation className="w-4 h-4 mr-2" />
                      Open in Maps
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Address */}
            <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Delivery address
              </h3>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-slate-400 mt-1" />
                <div className="text-xs text-slate-700 space-y-0.5">
                  <p>{order.deliveryAddress?.street}</p>
                  <p>
                    {order.deliveryAddress?.city},{" "}
                    {order.deliveryAddress?.state}
                  </p>
                  <p>{order.deliveryAddress?.pincode}</p>
                </div>
              </div>
            </div>

            {/* Items + Total */}
            <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                Order items
              </h3>
              <div className="space-y-3 text-xs">
                {order.items?.map((item, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-slate-700">
                      {item.name || item.product?.name} × {item.quantity}
                    </span>
                    <span className="text-slate-900 font-medium">
                      ₹{(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}

                {/* Subtotal */}
                <div className="border-t border-slate-100 pt-2 mt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-600">Subtotal</span>
                    <span className="font-medium text-slate-900">
                      ₹
                      {(
                        order.items?.reduce(
                          (sum, item) => sum + item.price * item.quantity,
                          0
                        ) || 0
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Taxes & charges */}
                {order?.taxes &&
                  Object.entries(order.taxes).map(([key, value]) =>
                    key !== "total" && value > 1 ? (
                      <div
                        key={key}
                        className="flex justify-between text-xs text-slate-700"
                      >
                        <span>{key.replace(/([A-Z])/g, " $1")}</span>
                        <span className="font-medium">
                          ₹{value.toFixed(2)}
                        </span>
                      </div>
                    ) : null
                  )}

                <div className="border-t border-slate-100 pt-2 mt-1 flex justify-between text-xs font-semibold">
                  <span className="text-slate-900">Total</span>
                  <span className="text-emerald-600 text-sm">
                    ₹{order.totalAmount?.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment info */}
            <div className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Payment details
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Method</span>
                  <span
                    className={`font-medium ${
                      order.paymentMethod === "COD"
                        ? "text-amber-700"
                        : "text-emerald-700"
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

                <div className="flex justify-between">
                  <span className="text-slate-600">Status</span>
                  <span
                    className={`font-medium ${
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
                  <div className="flex justify-between">
                    <span className="text-slate-600">Transaction ID</span>
                    <span className="font-mono text-[11px] text-slate-800 max-w-[140px] text-right break-all">
                      {order.transactionId}
                    </span>
                  </div>
                )}

                {order.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Paid on</span>
                    <span className="text-slate-800 font-medium">
                      {new Date(order.paidAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                )}

                {order.paymentDetails?.bank && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Bank</span>
                    <span className="text-slate-800">
                      {order.paymentDetails.bank}
                    </span>
                  </div>
                )}

                {order.paymentDetails?.cardId && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Card</span>
                    <span className="font-mono text-[11px] text-slate-800">
                      **** **** ****{" "}
                      {order.paymentDetails.cardId.slice(-4)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackOrder;
