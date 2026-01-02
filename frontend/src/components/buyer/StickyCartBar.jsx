// src/components/cart/StickyCartBar.jsx
import React, { useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const StickyCartBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalQuantity, totalAmount } = useSelector((state) => state.cart);
  const { items: orders } = useSelector((state) => state.order || {});
  const authUser = useSelector((state) => state.auth?.user);

  // Hide on non-shopping and auth-related routes
  const hideOnPaths = [
    "/cart",
    "/checkout",
    "/orders",
    "/login",
    "/register",
    "/signup",
    "/auth",
    "/forgot",
    "/reset",
    "/verify",
  ];
  const shouldHideForRoute = hideOnPaths.some((p) =>
    location.pathname.startsWith(p)
  );

  const hasActiveOrder = useMemo(() => {
    if (!orders || !orders.length) return false;
    const inProgress = orders.filter((o) => {
      const s = o.status?.toLowerCase();
      return s && !["delivered", "cancelled", "canceled"].includes(s);
    });
    return inProgress.length > 0;
  }, [orders]);

  // Hide when not authenticated or route is excluded, or no items/in-progress order
  if (
    !authUser ||
    shouldHideForRoute ||
    hasActiveOrder ||
    !totalQuantity ||
    totalQuantity <= 0
  ) {
    return null;
  }

  const itemLabel = totalQuantity === 1 ? "item" : "items";

  return (
    <div
      className="lg:hidden fixed inset-x-0 z-40 pointer-events-none"
      style={{
        bottom:
          "calc(var(--bottom-nav-height, 0px) + env(safe-area-inset-bottom) + 28px)",
      }}
    >
      <div className="flex justify-center pointer-events-auto">
        <button
          onClick={() => navigate("/cart")}
          className="
            w-full
            max-w-[160px]
            inline-flex items-center gap-2
            rounded-full
            bg-emerald-600
            text-white
            px-3.5 py-2
            shadow-[0_10px_28px_rgba(5,150,105,0.55)]
            backdrop-blur-md
            active:scale-[0.98]
            transition
          "
        >
          {/* Left: icon + count */}
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center text-base">
              🛒
            </div>
          </div>

          {/* Right: text block */}
          <div className="flex flex-col items-start leading-tight -ml-1">
            <span className="text-[10px] uppercase tracking-wide text-emerald-100 font-medium">
              View cart
            </span>
            <span className="text-[12px] font-semibold">
              {totalQuantity} {itemLabel}
              {typeof totalAmount === "number" && totalAmount > 0 && (
                <> · ₹{Math.round(totalAmount)}</>
              )}
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default StickyCartBar;