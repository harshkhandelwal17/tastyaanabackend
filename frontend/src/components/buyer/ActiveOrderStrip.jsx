// src/components/orders/ActiveOrderStrip.jsx
import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { createSelector } from "@reduxjs/toolkit";
import { useNavigate } from "react-router-dom";
import {
  Clock,
  Truck,
  CheckCircle,
  X,
  Navigation,
  ChevronRight,
} from "lucide-react";
import { fetchOrders, applyOrderUpdate } from "../../redux/orderSlice";
import { useOrderSocket } from "../../hooks/useOrderSocket";

// --- Selectors ---
const selectOrderState = (state) => state?.order || {};

const selectOrdersSummary = createSelector([selectOrderState], (orderState) => ({
  items: orderState.items || [],
  loading: orderState.loading || false,
  error: orderState.error || null,
}));

// Normalize status value coming from server (underscores/hyphens -> spaces)
const normalizeStatus = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[_-]/g, " ")
    .trim();

// Map server-side statuses to progress values
const getDeliveryProgress = (status) => {
  const key = normalizeStatus(status);
  switch (key) {
    case "pending":
    case "order placed":
      return 20;
    case "confirmed":
    case "payment confirmed":
      return 30;
    case "preparing":
    case "processing":
      return 50;
    case "ready":
    case "ready for pickup":
      return 70;
    case "assigned":
      return 75;
    case "picked up":
      return 85;
    case "out for delivery":
      return 90;
    case "reached":
      return 95;
    case "delivered":
      return 100;
    case "cancelled":
    case "canceled":
      return 0;
    default:
      return 20;
  }
};

const STATUS_LABELS = {
  pending: "Order placed",
  "order placed": "Order placed",
  confirmed: "Confirmed",
  "payment confirmed": "Payment confirmed",
  preparing: "Being prepared",
  processing: "Being prepared",
  ready: "Ready for pickup",
  "ready for pickup": "Ready for pickup",
  assigned: "Driver assigned",
  "picked up": "Picked up",
  "out for delivery": "On the way",
  reached: "Nearby",
  delivered: "Delivered",
  cancelled: "Cancelled",
  canceled: "Cancelled",
};

const ActiveOrderStrip = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { items: orders, loading } = useSelector(selectOrdersSummary);
  const { isAuthenticated, user } = useSelector((state) => state.auth || {});

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!orders || (orders.length === 0 && !loading)) {
      dispatch(fetchOrders()).catch(() => {});
    }
  }, [isAuthenticated, orders?.length, loading, dispatch]);

  // Wire socket for real-time order updates
  const { orderUpdates, clearOrderUpdates } = useOrderSocket(
    user?.id || user?._id,
    user?.role || "user"
  );

  useEffect(() => {
    if (!orderUpdates || orderUpdates.length === 0) return;
    orderUpdates.forEach((upd) => {
      try {
        dispatch(applyOrderUpdate(upd));
      } catch (_) {}
    });
    clearOrderUpdates();
  }, [orderUpdates, dispatch, clearOrderUpdates]);

  const activeOrder = useMemo(() => {
    if (!orders || orders.length === 0) return null;

    const inProgress = orders.filter((o) => {
      const s = o.status?.toLowerCase();
      return s && !["delivered", "cancelled", "canceled"].includes(s);
    });

    if (inProgress.length === 0) return null;

    return inProgress.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    )[0];
  }, [orders]);

  if (!isAuthenticated) return null;
  if (!activeOrder) return null;

  const status = activeOrder.status || "pending";
  const statusKey = normalizeStatus(status);
  const progress = getDeliveryProgress(status);
  const statusLabel = STATUS_LABELS[statusKey] || "In progress";

  let etaText = "Tracking live";
  if (activeOrder.etaMinutes) {
    etaText = `${activeOrder.etaMinutes} min${
      activeOrder.etaMinutes > 1 ? "s" : ""
    }`;
  } else if (activeOrder.estimatedDelivery) {
    try {
      const eta = new Date(activeOrder.estimatedDelivery).toLocaleTimeString(
        "en-IN",
        { hour: "2-digit", minute: "2-digit" }
      );
      etaText = `By ${eta}`;
    } catch {
      etaText = "On the way";
    }
  }

  const handleClick = () => {
    navigate(`/track-order/${activeOrder._id}`);
  };

  const Icon =
    statusKey === "out for delivery" ||
    statusKey === "assigned" ||
    statusKey === "picked up" ||
    statusKey === "reached"
      ? Truck
      : statusKey === "delivered"
      ? CheckCircle
      : statusKey === "cancelled" || statusKey === "canceled"
      ? X
      : Clock;

  return (
    <div
      className="
        md:hidden 
        fixed inset-x-0 
        z-40 
        pointer-events-none
      "
      // cart bar ke upar 64px extra space
      style={{
        bottom:
          "calc(var(--bottom-nav-height, 0px) + env(safe-area-inset-bottom) + 10px)",
      }}
    >
      <div className="mx-auto max-w-md px-3 pointer-events-auto">
        <button
          onClick={handleClick}
          className="
            w-full 
            bg-white 
            border border-slate-200 
            rounded-2xl 
            shadow-[0_8px_24px_rgba(15,23,42,0.15)]
            flex items-center gap-3
            px-3 py-2.5
            active:scale-[0.99]
          "
        >
          {/* LEFT: Icon */}
          <div className="flex flex-col items-center justify-center">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
              <Icon className="w-4 h-4 text-emerald-600" />
            </div>
            <span className="mt-0.5 text-[10px] font-semibold text-emerald-600">
              {progress}%
            </span>
          </div>

          {/* MIDDLE: Text + progress */}
          <div className="flex-1 text-left min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p className="text-[11px] font-semibold text-slate-900 truncate">
                Active order · {statusLabel}
              </p>
              <span className="text-[10px] text-slate-500 flex-shrink-0">
                ₹{activeOrder.totalAmount?.toFixed(0) || "0"}
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              ETA:{" "}
              <span className="font-medium text-emerald-600">{etaText}</span>
            </p>

            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div
                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* RIGHT: CTA */}
          <div className="flex flex-col items-end justify-center gap-1 ml-1">
            <span className="text-[10px] text-slate-500">Track order</span>
            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-50">
              <Navigation className="w-3 h-3 text-emerald-600" />
              <span className="text-[10px] font-semibold text-emerald-700">
                Open
              </span>
              <ChevronRight className="w-3 h-3 text-emerald-600" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default ActiveOrderStrip;
