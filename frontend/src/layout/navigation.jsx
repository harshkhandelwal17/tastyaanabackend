import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../redux/authslice";
import {
  Home,
  ShoppingCart,
  User,
  Package,
  Settings,
  LogOut,
  Bell,
  Search,
} from "lucide-react";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
    navigate("/");
  };

  const publicLinks = [
    { to: "/", label: "Home", icon: Home },
    { to: "/about", label: "About", icon: null },
    { to: "/contact", label: "Contact", icon: null },
  ];

  const buyerLinks = [
    { to: "/buyer/orders", label: "My Orders", icon: Package },
    { to: "/buyer/cart", label: "Cart", icon: ShoppingCart },
    { to: "/buyer/wishlist", label: "Wishlist", icon: null },
    { to: "/buyer/profile", label: "Profile", icon: User },
  ];

  const isActiveLink = (path) => {
    // For home page, match exactly
    if (path === "/") {
      return location.pathname === path;
    }
    // For other routes, check if the current path starts with the link path
    // This handles nested routes like /grocery/category
    return (
      location.pathname.startsWith(path) ||
      (path !== "/" && location.pathname.includes(path))
    );
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold text-blue-600">
              TechStore
            </Link>
          </div>

          {/* Public Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {publicLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActiveLink(link.to)
                      ? "text-blue-600 bg-blue-50"
                      : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                  }`}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Buyer Links */}
                {user?.role === "buyer" && (
                  <div className="hidden md:flex items-center space-x-4">
                    {buyerLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.to}
                          to={link.to}
                          className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActiveLink(link.to)
                              ? "text-blue-600 bg-blue-50"
                              : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                          }`}
                        >
                          {Icon && <Icon className="w-4 h-4" />}
                          <span>{link.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {/* Admin/Seller Dashboard Link */}
                {(user?.role === "admin" || user?.role === "seller") && (
                  <Link
                    to={
                      user?.role === "admin"
                        ? "/admin"
                        : user?.sellerProfile?.sellerType?.includes(
                            "vehiclerental"
                          ) ||
                          user?.sellerProfile?.vehicleRentalService?.isEnabled
                        ? "/seller/vehicles"
                        : "/seller"
                    }
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Dashboard
                  </Link>
                )}

                {/* User Info & Logout */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700">
                    Welcome, {user?.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
