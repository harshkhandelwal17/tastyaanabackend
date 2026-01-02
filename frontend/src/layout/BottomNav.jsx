import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOptimizedCart } from "../hooks/useOptimizedCart";
import { Home, ClipboardList, ShoppingCart, Zap, User } from "lucide-react";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { totalQuantity: cartCount } = useOptimizedCart();

  // Scroll-aware hide/show state
  const [hidden, setHidden] = useState(false);
  const lastYRef = useRef(window.scrollY || 0);
  const tickingRef = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      const currentY = window.scrollY || 0;
      if (!tickingRef.current) {
        window.requestAnimationFrame(() => {
          const delta = currentY - lastYRef.current;
          const threshold = 8; // small movement to trigger
          const minYToHide = 24; // don't hide near top

          // Hide on scroll down beyond threshold; show on slight scroll up
          if (currentY > minYToHide && delta > threshold) {
            setHidden(true);
          } else if (delta < -threshold) {
            setHidden(false);
          }

          lastYRef.current = currentY;
          tickingRef.current = false;
        });
        tickingRef.current = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sync CSS variable so other fixed bars can shift dynamically
  useEffect(() => {
    const root = document.documentElement;
    const navHeight = hidden ? "0px" : "56px"; // must match h-14
    root.style.setProperty("--bottom-nav-height", navHeight);
    return () => {
      root.style.setProperty("--bottom-nav-height", "56px");
    };
  }, [hidden]);

  const isActivePath = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] md:hidden h-14 transition-transform duration-300 ease-out ${hidden ? "translate-y-full" : "translate-y-0"}`}
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-6xl mx-auto h-full flex items-center justify-around">
        <button
          onClick={() => navigate("/")}
          className={`flex flex-col items-center gap-0.5 flex-1 ${
            isActivePath("/") ? "text-emerald-600" : "text-slate-500"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Home</span>
        </button>

        <button
          onClick={() => navigate("/orders")}
          className={`flex flex-col items-center gap-0.5 flex-1 ${
            isActivePath("/orders") ? "text-emerald-600" : "text-slate-500"
          }`}
        >
          <ClipboardList className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Orders</span>
        </button>

        <button
          onClick={() => navigate("/cart")}
          className={`relative flex flex-col items-center gap-0.5 flex-1 ${
            isActivePath("/cart") ? "text-emerald-600" : "text-slate-500"
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] rounded-full min-w-[16px] h-[16px] flex items-center justify-center">
              {cartCount}
            </span>
          )}
          <span className="text-[10px] font-semibold">Cart</span>
        </button>

        <button
          onClick={() => navigate("/active-subscriptions")}
          className={`flex flex-col items-center gap-0.5 flex-1 ${
            isActivePath("/active-subscriptions")
              ? "text-emerald-600"
              : "text-slate-500"
          }`}
        >
          <Zap className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Active</span>
        </button>

        <button
          onClick={() => navigate("/profile")}
          className={`flex flex-col items-center gap-0.5 flex-1 ${
            isActivePath("/profile") ? "text-emerald-600" : "text-slate-500"
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-semibold">Profile</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;
