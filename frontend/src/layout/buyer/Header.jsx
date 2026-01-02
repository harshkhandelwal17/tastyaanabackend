import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
// import { logoutUser } from "../../redux/authslice";
import image1 from "../../assets/image1.png";
import logo from "../../assets/logo.png";
import AboutUsTextIcon from "./AboutUsTextIcon";
import {
  Search,
  ShoppingCart,
  User,
  UsersRound,
  ChevronDown,
  Menu,
  X,
  Heart,
  Bell,
  MapPin,
  Star,
  Sun,
  Moon,
  Gift,
  Cookie,
  ChefHat,
  Home,
  Package,
  Settings,
  LogOut,
  Phone,
  Info,
  Utensils,
  Sparkles,
  Calendar,
  Zap,
} from "lucide-react";
import { logoutUser, addNotification } from "../../redux/authslice";
import { persistor } from "../../redux/store";
import { useLocation } from "react-router-dom";
import BottomNavBar from "../../components/seller/BottomNavBar";
const Header = ({ onNavigate = () => {}, currentPath = "/", children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items);
  const cartItemCount = cartItems.reduce(
    (total, item) => total + (item.quantity || 1),
    0
  );
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const wishlistCount = Array.isArray(wishlistItems?.items)
    ? wishlistItems.items.length
    : 0;

  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(
    "Vijay Nagar, Indore"
  );
  const location = useLocation();

  // Check for placeholder phone number and add notification
  useEffect(() => {
    if (user && user.phone === "0000000000" && user.googleLinked) {
      // Check if notification already exists
      const phoneNotificationExists = user.notifications?.some(
        (notification) => notification.type === "phone_reminder"
      );

      if (!phoneNotificationExists) {
        dispatch(
          addNotification({
            message:
              "Please update your phone number in your profile for better order delivery and support.",
            type: "phone_reminder",
            priority: "high",
          })
        );
      }
    }
  }, [user, dispatch]);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery("");
    }
  };

  const handleLogout = () => {
    dispatch(logoutUser()).then(() => {
      persistor.purge();
    });
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  const isActivePath = (path) => {
    // For home page, match exactly
    if (path === "/") {
      return location.pathname === path;
    }
    // For cart, match exactly
    if (path === "/cart") {
      return location.pathname === path;
    }
    // For ghar/ka/khana, match exactly
    if (path === "/ghar/ka/khana") {
      return location.pathname === path;
    }
    // For other routes, check if the current path starts with the link path
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Modern Header - Based on Homepage Design */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-white shadow-xl" : "bg-white shadow-lg"
        }`}
      >
        {/* Top Promotional Bar */}
        <div className="bg-emerald-600 text-white py-2 px-4">
          <div className="flex justify-center items-center text-xs sm:text-sm font-medium">
            <Zap className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5" />
            <span className="text-center">
              Free delivery in 10 minutes • Order above ₹199 • Best prices
              guaranteed
            </span>
          </div>
        </div>

        {/* Main Header */}
        <div className="px-3 sm:px-4 lg:px-6 py-3 lg:py-4">
          <div className="flex items-center gap-3 lg:gap-6">
            {/* Mobile Menu + Logo */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                className="xl:hidden p-2 hover:bg-gray-100 rounded-xl transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <div
                className="flex items-center gap-2 sm:gap-3"
                onClick={() => navigate("/")}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg cursor-pointer">
                  <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <div className="cursor-pointer">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800">
                    Tastyaana
                  </h1>
                  <p className="hidden sm:block text-xs text-emerald-600 font-medium">
                    Fast & Fresh
                  </p>
                </div>
              </div>
            </div>

            {/* Desktop Location Button */}
            <button
              onClick={() => setShowLocationModal(true)}
              className="hidden xl:flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-emerald-300 min-w-[220px] transition-all duration-300"
            >
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-left flex-1">
                <p className="text-xs text-emerald-600 font-semibold">
                  Delivery in 10 mins
                </p>
                <p className="text-sm font-bold text-gray-800 truncate">
                  {selectedLocation.split(",")[0]}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="relative flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for products, brands, and more..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 sm:pl-12 pr-16 sm:pr-16 py-3 sm:py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white text-sm sm:text-base transition-all duration-300 hover:border-gray-300"
                />
              </div>
            </form>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* User Button */}
              <button
                onClick={() =>
                  user ? navigate("/profile") : navigate("/login")
                }
                className="p-2 sm:p-2.5 hover:bg-gray-100 rounded-xl transition-colors hidden sm:block"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>

              {/* Wishlist Button - Now visible on all screen sizes */}
              <button
                onClick={() => navigate("/wishlist")}
                className="relative p-2 sm:p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Heart className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </button>

              {/* Cart Button */}
              <button
                onClick={() => navigate("/cart")}
                className="relative p-2 sm:p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-bold">
                    {cartItemCount}
                  </span>
                )}
              </button>
              {/* ABout Us Button */}
            </div>
          </div>

          {/* Mobile Location */}
          <button
            onClick={() => setShowLocationModal(true)}
            className="xl:hidden flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-emerald-300 w-full mt-3 transition-all duration-300"
          >
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-xs text-emerald-600 font-semibold">
                Delivery in 10 mins
              </p>
              <p className="text-sm font-bold text-gray-800">
                {selectedLocation}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Desktop Navigation Bar */}
        <div className="hidden xl:block border-t border-gray-100">
          <div className="px-3 sm:px-4 lg:px-6 py-2">
            <nav className="flex items-center justify-center gap-8">
              <button
                onClick={() => navigate("/")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActivePath("/")
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "text-gray-600 hover:text-emerald-600 hover:bg-gray-50"
                }`}
              >
                <Home className="w-4 h-4" />
                Home
              </button>

              <button
                onClick={() => navigate("/groceries")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActivePath("/groceries")
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "text-gray-600 hover:text-emerald-600 hover:bg-gray-50"
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                Groceries
              </button>

              <button
                onClick={() => navigate("/laundry")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActivePath("/laundry")
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "text-gray-600 hover:text-emerald-600 hover:bg-gray-50"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                Laundry
                <span className="bg-emerald-600 text-white text-xs px-2 py-1 rounded-full font-bold">
                  NEW
                </span>
              </button>

              <button
                onClick={() => navigate("/products")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActivePath("/products")
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "text-gray-600 hover:text-emerald-600 hover:bg-gray-50"
                }`}
              >
                <Package className="w-4 h-4" />
                Products
              </button>

              <button
                onClick={() => navigate("/ghar/ka/khana")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActivePath("/ghar/ka/khana")
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "text-gray-600 hover:text-emerald-600 hover:bg-gray-50"
                }`}
              >
                <ChefHat className="w-4 h-4" />
                Meals
              </button>

              <button
                onClick={() => navigate("/about")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActivePath("/about")
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "text-gray-600 hover:text-emerald-600 hover:bg-gray-50"
                }`}
              >
                <Info className="w-4 h-4" />
                About
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">
                Select Location
              </h3>
              <button
                onClick={() => setShowLocationModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                "Vijay Nagar, Indore",
                "Rajwada, Indore",
                "Sarafa Bazaar, Indore",
                "Palasia, Indore",
              ].map((location) => (
                <button
                  key={location}
                  onClick={() => {
                    setSelectedLocation(location);
                    setShowLocationModal(false);
                  }}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                    selectedLocation === location
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-gray-200 hover:border-emerald-300"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <MapPin
                      className={`w-4 h-4 ${
                        selectedLocation === location
                          ? "text-emerald-600"
                          : "text-gray-400"
                      }`}
                    />
                    <span className="font-medium">{location}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="xl:hidden fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="fixed inset-y-0 right-0 w-4/5 max-w-sm bg-white shadow-xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-emerald-600">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <Zap className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="text-lg font-bold text-white">Tastyaana</h2>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Mobile Menu Content */}
            <div className="p-4">
              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  onClick={() => {
                    navigate("/wishlist");
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex flex-col items-center p-3 bg-red-50 rounded-xl border border-red-200"
                >
                  <Heart className="w-6 h-6 text-red-500 mb-1" />
                  <span className="text-sm font-medium text-red-700">
                    Wishlist
                  </span>
                  {wishlistCount > 0 && (
                    <span className="text-xs bg-red-500 text-white rounded-full px-2 py-0.5 mt-1">
                      {wishlistCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => {
                    navigate("/cart");
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex flex-col items-center p-3 bg-emerald-50 rounded-xl border border-emerald-200"
                >
                  <ShoppingCart className="w-6 h-6 text-emerald-500 mb-1" />
                  <span className="text-sm font-medium text-emerald-700">
                    Cart
                  </span>
                  {cartItemCount > 0 && (
                    <span className="text-xs bg-emerald-500 text-white rounded-full px-2 py-0.5 mt-1">
                      {cartItemCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => navigate("/cart")}
                  className="relative p-2 sm:p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <UsersRound className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-2" aria-label="Mobile navigation">
                <button
                  onClick={() => {
                    navigate("/");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100"
                >
                  <Home className="w-5 h-5 text-gray-500" />
                  <span>Home</span>
                </button>
                <button
                  onClick={() => {
                    navigate("/groceries");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100"
                >
                  <ShoppingCart className="w-5 h-5 text-gray-500" />
                  <span>Groceries</span>
                </button>
                <button
                  onClick={() => {
                    navigate("/laundry");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100"
                >
                  <Sparkles className="w-5 h-5 text-gray-500" />
                  <span>Laundry</span>
                </button>
                <button
                  onClick={() => {
                    navigate("/bhandara");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100"
                >
                  <Utensils className="w-5 h-5 text-gray-500" />
                  <span>Bhandara</span>
                </button>
                <button
                  onClick={() => {
                    user.role === "seller"
                      ? navigate("/seller/editbulkprice")
                      : navigate("/products");
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100"
                >
                  <Package className="w-5 h-5 text-gray-500" />
                  <span>Products</span>
                </button>

                {/* User Section */}
                {user ? (
                  <div className="space-y-2 mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-medium text-gray-500 mb-3 px-3">
                      My Account
                    </h3>
                    <button
                      onClick={() => {
                        user.role === "seller"
                          ? navigate("/seller/profile")
                          : navigate("/profile");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100"
                    >
                      <User className="w-5 h-5 text-gray-500" />
                      My Profile
                    </button>
                    <button
                      onClick={() => {
                        user.role === "seller"
                          ? navigate("/seller/orders")
                          : navigate("/orders");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100"
                    >
                      <Package className="w-5 h-5 text-gray-500" />
                      My Orders
                    </button>
                    <button
                      onClick={() => {
                        navigate("/bhandara/my-bhandaras");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 rounded-lg font-medium text-gray-700 hover:bg-gray-100"
                    >
                      <Utensils className="w-5 h-5 text-gray-500" />
                      My Bhandaras
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 p-3 rounded-lg font-medium text-red-600 hover:bg-red-50 mt-4"
                    >
                      <LogOut className="w-5 h-5" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => {
                        navigate("/login");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full bg-emerald-600 text-white p-3 rounded-lg font-medium mb-3"
                    >
                      Sign In
                    </button>
                    <button
                      onClick={() => {
                        navigate("/register");
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full border border-emerald-600 text-emerald-600 p-3 rounded-lg font-medium"
                    >
                      Create Account
                    </button>
                  </div>
                )}
              </nav>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
