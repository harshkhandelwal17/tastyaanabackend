import React, { useState } from "react";
import { Outlet, NavLink, useLocation, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Car,
  Calendar,
  BarChart3,
  Settings,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  Home,
  CheckCircle,
  XCircle,
  CreditCard,
  MapPin,
  Tag,
  DollarSign,
  FileText,
  Eye,
  Wrench,
} from "lucide-react";
import { useUserInfo } from "../hooks/useUserAccess";

const SellerLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Use Redux state and secure hooks instead of localStorage
  const {
    token,
    isAuthenticated,
    user: reduxUser,
  } = useSelector((state) => state.auth);
  const { userInfo, loading: userLoading, error: userError } = useUserInfo();

  console.log("🏗️ SellerLayout rendering:", {
    userLoading,
    userInfo,
    isAuthenticated,
    reduxUser: reduxUser ? { id: reduxUser.id, role: reduxUser.role } : null,
  });

  // Show loading while checking authentication
  if (userLoading) {
    console.log("🔄 SellerLayout: Loading user info...");
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading user info...</p>
        </div>
      </div>
    );
  }

  // Check authentication - prefer Redux user over userInfo to avoid race conditions
  const currentUser = reduxUser || userInfo;
  if (!token || !isAuthenticated || !currentUser) {
    console.log("❌ SellerLayout: Not authenticated, redirecting to login");
    return <Navigate to="/auth/login" replace />;
  }

  // Check if user is seller - use Redux user if available, fallback to userInfo
  if (currentUser.role !== "seller") {
    console.log("❌ SellerLayout: User is not a seller, redirecting to login");
    return <Navigate to="/auth/login" replace />;
  }

  console.log(
    "✅ SellerLayout: Rendering layout for seller:",
    currentUser.name
  );
  // Note: Access control for vehicle rental is handled by VehicleRentalProtectedRoute wrapper

  const navigation = [
    {
      name: "Dashboard",
      href: "/seller/vehicles/dashboard",
      icon: Home,
      current: location.pathname === "/seller/vehicles/dashboard",
    },
    {
      name: "Available Vehicles",
      href: "/seller/vehicles/available-vehicles",
      icon: CheckCircle,
      current: location.pathname === "/seller/vehicles/available-vehicles",
    },
    {
      name: "Booked Vehicles",
      href: "/seller/vehicles/booked-vehicles",
      icon: XCircle,
      current: location.pathname === "/seller/vehicles/booked-vehicles",
    },
    {
      name: "Vehicle Management",
      href: "/seller/vehicles/manage",
      icon: Car,
      current: location.pathname === "/seller/vehicles/manage",
    },
    {
      name: "Booking Management",
      href: "/seller/vehicles/bookings",
      icon: Calendar,
      current: location.pathname === "/seller/vehicles/bookings",
    },
    {
      name: "Offline Booking",
      href: "/seller/vehicles/offline-booking",
      icon: User,
      current: location.pathname === "/seller/vehicles/offline-booking",
    },
    {
      name: "Billing History",
      href: "/seller/vehicles/billing",
      icon: CreditCard,
      current: location.pathname === "/seller/vehicles/billing",
    },
    {
      name: "Centers",
      href: "/seller/vehicles/centers",
      icon: MapPin,
      current: location.pathname === "/seller/vehicles/centers",
    },
    {
      name: "Discount Coupons",
      href: "/seller/vehicles/coupons",
      icon: Tag,
      current: location.pathname === "/seller/vehicles/coupons",
    },
    {
      name: "Revenue",
      href: "/seller/vehicles/revenue",
      icon: DollarSign,
      current: location.pathname === "/seller/vehicles/revenue",
    },
    {
      name: "Daily Hisaab",
      href: "/seller/vehicles/daily-hisaab",
      icon: FileText,
      current: location.pathname === "/seller/vehicles/daily-hisaab",
    },
    {
      name: "Daily Hisaab View",
      href: "/seller/vehicles/daily-hisaab-view",
      icon: Eye,
      current: location.pathname === "/seller/vehicles/daily-hisaab-view",
    },
    {
      name: "Maintenance History",
      href: "/seller/vehicles/maintenance",
      icon: Wrench,
      current: location.pathname === "/seller/vehicles/maintenance",
    },
    {
      name: "Analytics",
      href: "/seller/vehicles/analytics",
      icon: BarChart3,
      current: location.pathname === "/seller/vehicles/analytics",
    },
    {
      name: "Settings",
      href: "/seller/vehicles/settings",
      icon: Settings,
      current: location.pathname === "/seller/vehicles/settings",
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Clear any sensitive cached data
    sessionStorage.clear();
    window.location.href = "/auth/login";
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <div className={`lg:hidden ${sidebarOpen ? "block" : "hidden"}`}>
        <div className="fixed inset-0 flex z-40">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <Car className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-semibold text-gray-900">
                  Vehicle Rental
                </span>
              </div>

              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                      item.current
                        ? "bg-blue-100 text-blue-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={`mr-4 flex-shrink-0 h-6 w-6 ${
                        item.current
                          ? "text-blue-500"
                          : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    />
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">
                    {userInfo?.name || "Seller"}
                  </p>
                  <p className="text-xs text-gray-500">Vehicle Seller</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <Car className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-semibold text-gray-900">
                  Vehicle Rental
                </span>
              </div>

              <nav className="mt-5 flex-1 px-2 space-y-1">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                      item.current
                        ? "bg-blue-100 text-blue-900"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <item.icon
                      className={`mr-3 flex-shrink-0 h-6 w-6 ${
                        item.current
                          ? "text-blue-500"
                          : "text-gray-400 group-hover:text-gray-500"
                      }`}
                    />
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center w-full">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-700">
                    {userInfo?.name || "Seller"}
                  </p>
                  <p className="text-xs text-gray-500">Vehicle Seller</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top navigation */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between bg-white border-b border-gray-200 px-4 py-1.5">
            <button
              className="text-gray-500 hover:text-gray-600"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex items-center space-x-4">
              <button className="text-gray-400 hover:text-gray-600">
                <Bell className="h-6 w-6" />
              </button>
              <button
                onClick={handleLogout}
                className="text-gray-400 hover:text-gray-600"
              >
                <LogOut className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default SellerLayout;
