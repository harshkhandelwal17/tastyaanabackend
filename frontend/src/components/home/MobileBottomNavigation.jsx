// src/components/home/MobileBottomNavigation.jsx

import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Home,
  ChefHat,
  Utensils,
  User,
  ShoppingCart,
} from "lucide-react";

const navItems = [
  { icon: Home, text: "Home", path: "/" },
  { icon: Utensils, text: "Tiffin", path: "/ghar/ka/khana" }, // Tiffin Service
  { icon: ChefHat, text: "FoodZone", path: "/foodzone" }, // Food Zone
  { icon: User, text: "Profile", path: "/profile" },
  { icon: ShoppingCart, text: "Cart", path: "/cart" },
];

const MobileBottomNavigation = ({ cartCount }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActivePath = (path) => {
    // Exact match for most, but /foodzone can start with it
    if (path === "/") {
        return location.pathname === path;
    }
    // Specific match for Tiffin and FoodZone
    if (path === "/ghar/ka/khana") {
        return location.pathname === path;
    }
    if (path === "/foodzone") {
        // You'll need to update categoryclick to navigate to /foodzone
        return location.pathname === path; 
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl xl:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <button
            key={item.text}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center justify-center p-1 w-full h-full transition-all ${
              isActivePath(item.path)
                ? "text-emerald-600 font-bold"
                : "text-gray-500 hover:text-emerald-500"
            }`}
          >
            <div className="relative">
              {React.createElement(item.icon, {
                className: "w-5 h-5",
              })}
              {item.text === "Cart" && cartCount > 0 && (
                <span className="absolute -top-1.5 -right-3 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center font-bold">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] mt-0.5">{item.text}</span>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default MobileBottomNavigation;