import React, { useState } from "react";
import {
  Home,
  ChefHat,
  AlertTriangle,
  Package,
  BarChart3,
  Menu,
  X,
  Bell,
  User,
  Calendar,
  Package2Icon,
  PlusCircle,
} from "lucide-react";
import { NavLink, Link, useLocation, Navigate } from "react-router-dom";
import { useVehicleRentalAccess } from "../../hooks/useUserAccess";

const SellerMobileLayout = ({ children }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Use secure hook to check vehicle rental access
  const { isVehicleRentalSeller, loading } = useVehicleRentalAccess();

  // Show loading while checking
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
      </div>
    );
  }

  // Redirect vehicle rental sellers to vehicle routes
  if (isVehicleRentalSeller) {
    return <Navigate to="/seller/vehicles" replace />;
  }

  const navigationItems = [
    { name: "Profile", href: "/seller/", icon: User },
    {
      name: "Morning Tiffins",
      href: "/seller/tiffin/today/morning",
      icon: ChefHat,
    },
    {
      name: "Evening Tiffins",
      href: "/seller/tiffin/today/evening",
      icon: ChefHat,
    },
    // { name: 'Orders', href: '/seller/orders', icon: Package },
    // { name: 'Products', href: '/seller/products', icon: Package },
    { name: "orders", href: "/seller/orders", icon: Package2Icon },
    {
      name: "Analytics",
      href: "/seller/analytics/subscriptions",
      icon: BarChart3,
    },
    { name: "Daily Meals", href: "/seller/daily-meals", icon: Calendar },
    { name: "Penalties", href: "/seller/penalties", icon: AlertTriangle },
  ];

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="flex items-center justify-between px-2 sm:px-4 py-2 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 sm:p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 flex-shrink-0"
            >
              <Menu className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <h1 className="text-sm sm:text-lg font-semibold text-gray-900 truncate">
              Tastyaana Seller
            </h1>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button className="p-1.5 sm:p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
            <button className="p-1.5 sm:p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100">
              <NavLink to="/seller">
                <User className="h-4 w-4 sm:h-5 sm:w-5" />
              </NavLink>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          {/* Background overlay */}
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Sidebar panel */}
          <div className="relative flex flex-col w-64 sm:max-w-xs bg-white h-full shadow-xl">
            {/* Close button */}
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Sidebar content */}
            <div className="flex-1 pt-4 sm:pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-3 sm:px-4 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                  Seller Panel
                </h2>
              </div>
              <nav className="mt-3 sm:mt-5 px-2 space-y-1">
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`${
                        isActive(item.href)
                          ? "bg-orange-100 text-orange-600"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                      } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col min-h-0 border-r border-gray-200 bg-white">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-white border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">
              Tastyaana Seller
            </h1>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive(item.href)
                        ? "bg-orange-100 text-orange-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    } group flex items-center px-3 py-2 text-sm font-medium rounded-md`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <main className="flex-1">{children}</main>
      </div>

      {/* Mobile Bottom Navigation (Alternative) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
        <div className="grid grid-cols-5 gap-0.5 sm:gap-1 p-1.5 sm:p-2">
          {navigationItems.slice(0, 5).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex flex-col items-center justify-center py-1.5 sm:py-2 px-0.5 sm:px-1 rounded-md transition-colors ${
                  isActive(item.href)
                    ? "text-orange-600 bg-orange-50"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 mb-0.5 sm:mb-1 flex-shrink-0" />
                <span className="text-[10px] sm:text-xs font-medium truncate max-w-full leading-tight">
                  {item.name.split(" ")[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom padding for mobile navigation */}
      <div className="lg:hidden h-16"></div>
    </div>
  );
};

export default SellerMobileLayout;
