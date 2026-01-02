import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { logoutUser } from "../redux/authslice";
import { useOptimizedWishlist } from "../hooks/useOptimizedWishlist";
import { useOptimizedCart } from "../hooks/useOptimizedCart";
import {
  Zap,
  Menu,
  X,
  MapPin,
  ChevronDown,
  Search,
  Heart,
  ShoppingCart,
  User,
  LogOut,
  Home,
  ClipboardList,
} from "lucide-react";

const AppHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const { user: userInfo, isAuthenticated } = useSelector(
    (state) => state.auth
  );
  const { count: wishlistCount } = useOptimizedWishlist();
  const { totalQuantity: cartCount } = useOptimizedCart();

  const [isScrolled, setIsScrolled] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(
    "Vijay Nagar, Indore"
  );
  const [searchQuery, setSearchQuery] = useState("");

  const isActivePath = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery("");
  };

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser());
    } catch (_) {}
    navigate("/login");
  };

  useEffect(() => {
    const onScroll = () => setIsScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* HEADER */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all ${
          isScrolled
            ? "bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm"
            : "bg-white border-b border-slate-100"
        }`}
      >
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 py-2.5">
          {/* MOBILE LAYOUT */}
          <div className="md:hidden space-y-2">
            {/* Row 1: logo + actions */}
          {/* Row 1: logo only (no cart/profile on mobile) */}
<div className="flex items-center gap-2">
  <button
    className="p-1.5 rounded-lg hover:bg-slate-100"
    onClick={() => setShowMobileMenu(true)}
  >
    <Menu className="w-5 h-5 text-slate-700" />
  </button>
  <button
    onClick={() => navigate("/")}
    className="flex items-center gap-2"
  >
    <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md">
      <Zap className="w-5 h-5 text-white" />
    </div>
    <div className="text-left">
      <p className="font-semibold text-slate-900 text-base leading-tight">
        Tastyaana
      </p>
      <p className="text-[11px] text-slate-500">
        Everything you need, in one place
      </p>
    </div>
  </button>
</div>


            {/* Row 2: location pill */}
            <button
              onClick={() => setShowLocationModal(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200"
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              <div className="flex-1 text-left">
                <p className="text-[10px] text-slate-500">Deliver to</p>
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {selectedLocation}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* Row 3: search */}
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tiffin, food, grocery, rentals…"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>
            </form>
          </div>

          {/* DESKTOP / TABLET LAYOUT */}
          <div className="hidden md:flex items-center gap-3">
            {/* Logo */}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center shadow-md">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-slate-900 text-lg leading-tight">
                  Tastyaana
                </p>
                <p className="text-[11px] text-slate-500">
                  Trusted local services, nearby and reliable
                </p>
              </div>
            </button>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search tiffin, food, grocery, rentals, laundry…"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:bg-white focus:border-emerald-500"
                />
              </div>
            </form>

            {/* Location pill */}
            <button
              onClick={() => setShowLocationModal(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-500"
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              <div className="text-left">
                <p className="text-[10px] text-slate-500">Deliver to</p>
                <p className="text-xs font-semibold text-slate-900 truncate max-w-[160px]">
                  {selectedLocation}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* Action icons */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => navigate("/wishlist")}
                className="relative p-2 rounded-xl hover:bg-slate-100"
              >
                <Heart className="w-5 h-5 text-slate-700" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full min-w-[16px] h-[16px] flex items-center justify-center">
                    {wishlistCount}
                  </span>
                )}
              </button>

              <button
                onClick={() => navigate("/cart")}
                className="relative p-2 rounded-xl hover:bg-slate-100"
              >
                <ShoppingCart className="w-5 h-5 text-slate-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[9px] rounded-full min-w-[16px] h-[16px] flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>

              <button
                onClick={() =>
                  userInfo ? navigate("/profile") : navigate("/login")
                }
                className="p-2 rounded-xl hover:bg-slate-100"
              >
                <User className="w-5 h-5 text-slate-700" />
              </button>

              {userInfo && isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl hover:bg-slate-100"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5 text-slate-700" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* LOCATION MODAL */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-slate-900">
                Select delivery area
              </p>
              <button
                onClick={() => setShowLocationModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            <div className="space-y-2">
              {[
                { name: "Vijay Nagar", area: "Central Indore", available: true },
                { name: "Palasia", area: "Business hub", available: true },
                {
                  name: "Sapna Sangeeta",
                  area: "Entertainment zone",
                  available: true,
                },
                { name: "Rau", area: "Suburb", available: false },
              ].map((loc) => (
                <button
                  key={loc.name}
                  disabled={!loc.available}
                  onClick={() => {
                    if (!loc.available) return;
                    setSelectedLocation(`${loc.name}, Indore`);
                    setShowLocationModal(false);
                  }}
                  className={`w-full text-left px-3 py-3 rounded-xl border text-sm flex items-center justify-between ${
                    loc.available
                      ? "border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-slate-900"
                      : "border-slate-100 text-slate-400 bg-slate-50 cursor-not-allowed"
                  }`}
                >
                  <div>
                    <p className="font-semibold">{loc.name}</p>
                    <p className="text-[11px] text-slate-500">{loc.area}</p>
                  </div>
                  {!loc.available && (
                    <span className="text-[11px] text-red-500 font-medium">
                      Coming soon
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MOBILE SIDE MENU */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="flex-1 bg-black/50"
            onClick={() => setShowMobileMenu(false)}
          />
          <div className="w-72 max-w-[80%] bg-white h-full shadow-xl flex flex-col">
            <div className="bg-emerald-600 text-white px-4 py-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-lg">Tastyaana</p>
                <p className="text-[11px] text-emerald-100">
                  Trusted local services, nearby and reliable
                </p>
              </div>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-1.5 rounded-lg hover:bg-white/15"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-200 flex items-center justify-center">
                  <User className="w-6 h-6 text-slate-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {userInfo && isAuthenticated
                      ? `Hi, ${userInfo.name || "User"}`
                      : "Welcome to Tastyaana"}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {userInfo && isAuthenticated
                      ? "Manage your services & orders"
                      : "Login for better experience"}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1.5 text-sm">
              {[
                { label: "Home", icon: Home, path: "/" },
                { label: "Orders", icon: ClipboardList, path: "/orders" },
                {
                  label: "Active Subscriptions",
                  icon: Zap,
                  path: "/active-subscriptions",
                },
                { label: "Cart", icon: ShoppingCart, path: "/cart" },
                { label: "Profile", icon: User, path: "/profile" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => {
                    navigate(item.path);
                    setShowMobileMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl ${
                    isActivePath(item.path)
                      ? "bg-emerald-50 text-emerald-700"
                      : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            <div className="px-4 py-3 border-t border-slate-100 space-y-2">
              {!userInfo || !isAuthenticated ? (
                <button
                  onClick={() => {
                    navigate("/login");
                    setShowMobileMenu(false);
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold"
                >
                  Login / Register
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      navigate("/profile");
                      setShowMobileMenu(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowMobileMenu(false);
                    }}
                    className="w-full py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AppHeader;
