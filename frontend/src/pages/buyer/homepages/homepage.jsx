import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";

import AppHeader from "../../../layout/AppHeader";
import InitialLoader from "../../../components/common/InitialLoader";
import InstallPWA from "../../../components/InstallPWA";

import { useNotifications } from "../../../contexts/NotificationContext";
import { useGetHomepageHeroSlidesQuery } from "../../../redux/storee/optimizedApi";
import { addToCartAPI, fetchCart } from "../../../redux/cartSlice";
import { useOptimizedWishlist } from "../../../hooks/useOptimizedWishlist";
import { useOptimizedCart } from "../../../hooks/useOptimizedCart";
import { useApiCache } from "../../../hook/useOptimizedState";
import ActiveOrderStrip from "../../../components/buyer/ActiveOrderStrip";
import NewYearCelebration from "../../../components/NewYearCelebration";

import {
  Clock,
  Store,
  Heart,
  ChevronRight,
  Headphones,
  Award,
} from "lucide-react";

const LIVE_SERVICE_CATEGORIES = ["food", "foodzone"];

const HomePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user: userInfo, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const { isSupported, permission, requestPermission, subscribeToPush } =
    useNotifications();

  const {
    wishlistItems,
    count: wishlistCount,
    toggleWishlist,
    getHeartIconProps,
  } = useOptimizedWishlist();

  const {
    addToCart,
    updateCartQuantity,
    cartItems: cartReduxItems,
    totalQuantity: cartReduxCount,
  } = useOptimizedCart();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [featuredProducts, setFeaturedProducts] = useState([]);

  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [collegeName, setCollegeName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [currentBanner, setCurrentBanner] = useState(0);

  const API_BASE_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

  // Lightweight API cache to reduce redundant loaders on repeat visits
  const apiCache = useApiCache("homepage", 5 * 60 * 1000); // 5 minutes
  const cachedHomepage = apiCache.getCachedData("homepageData");

  const { data: heroSlidesData } = useGetHomepageHeroSlidesQuery(undefined, {
    pollingInterval: 30000,
    refetchOnMountOrArgument: true,
  });

  const heroSlides = heroSlidesData?.data || [];

  const defaultBanners = [
    {
      id: 1,
      title: "One app for tiffin, food, grocery, rentals, rides & more.",
      subtitle:
        "Daily meals, last-minute cravings, room shifting, cleaning, medicines – sab kuch ek hi jagah se.",
      image:
        "https://images.unsplash.com/photo-1614693801805-5319103bdeb9?w=900&auto=format&fit=crop&q=80",
    },
  ];

  const displayBanners = useMemo(
    () =>
      heroSlides.length > 0
        ? heroSlides.map((slide) => ({
            id: slide._id,
            title: slide.title,
            subtitle: slide.subtitle,
            image: slide.imagebg,
          }))
        : defaultBanners,
    [heroSlides]
  );

  // ALL CATEGORIES (LIVE + COMING SOON)
  const mainCategories = [
    {
      id: 1,
      name: "Tiffin (Ghar ka Khana)",
      subtitle: "Monthly home-style meals",
      image:
        "https://res.cloudinary.com/dcha7gy9o/image/upload/v1755760216/WhatsApp_Image_2025-08-21_at_09.57.05_ce6ff9f1_n2rohq.jpg",
      status: "LIVE",
      statusColor: "bg-emerald-500",
      available: true,
      category: "food",
    },
    {
      id: 2,
      name: "Food Delivery",
      subtitle: "One-time food orders",
      image:
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&h=300&fit=crop&crop=center",
      status: "LIVE",
      statusColor: "bg-emerald-500",
      available: true,
      category: "foodzone",
    },
    {
      id: 3,
      name: "Grocery & Essentials",
      subtitle: "Daily home needs",
      image:
        "https://res.cloudinary.com/dcha7gy9o/image/upload/v1762422302/Grocary_ob0arc.png",
      status: "COMING SOON",
      statusColor: "bg-amber-500",
      available: false,
      category: "grocery",
    },
    {
      id: 4,
      name: "Vegetables & Fruits",
      subtitle: "Fresh & seasonal",
      image:
        "https://images.unsplash.com/photo-1590779033100-9f60a05a013d?w=300&h=300&fit=crop&crop=center",
      status: "COMING SOON",
      statusColor: "bg-amber-500",
      available: false,
      category: "vegetables",
    },
    {
      id: 5,
      name: "Laundry",
      subtitle: "Pickup & delivery",
      image:
        "https://res.cloudinary.com/dcha7gy9o/image/upload/v1758719534/laundryicon_vblsic.png",
      status: "COMING SOON",
      statusColor: "bg-amber-500",
      available: false,
      category: "comingsoon",
    },
    {
      id: 6,
      name: "Rental Properties",
      subtitle: "Rooms / PG / Flats",
      image:
        "https://res.cloudinary.com/dcha7gy9o/image/upload/v1758719534/rentalicon_izrpig.png",
      status: "COMING SOON",
      statusColor: "bg-amber-500",
      available: false,
      category: "comingsoon",
    },
    {
      id: 7,
      name: "Cab & Rides",
      subtitle: "Bike / Cab on demand",
      image:
        "https://res.cloudinary.com/dcha7gy9o/image/upload/v1758719534/caricon_t9efxl.png",
      status: "COMING SOON",
      statusColor: "bg-amber-500",
      available: false,
      category: "comingsoon",
    },
    {
      id: 8,
      name: "Medicine & Health",
      subtitle: "Reminders & refills",
      image:
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=300&h=300&fit=crop&crop=center",
      status: "COMING SOON",
      statusColor: "bg-amber-500",
      available: false,
      category: "comingsoon",
    },
  ];

  const handleCategoryClick = (category) => {
    if (!category.available) {
      toast.success(`${category.name} is coming soon on Tastyaana 🚀`, {
        position: "top-center",
      });
      return;
    }

    if (category.category === "food") {
      navigate("/ghar/ka/khana");
      return;
    }
    if (category.category === "foodzone") {
      navigate("/category1/foodzone");
      return;
    }

    navigate(`/category1/${category.category}`);
  };

  const handleAddToCart = async (productId) => {
    const product = featuredProducts.find(
      (p) => p.id === productId || p._id === productId
    );

    if (!product) {
      toast.error("Product not found");
      return;
    }

    const isCollegeBranded =
      product?.title?.toLowerCase().includes("college") ||
      product?.name?.toLowerCase().includes("college") ||
      product?.tags?.some((tag) => tag.toLowerCase().includes("college"));

    if (isCollegeBranded) {
      setSelectedProduct(product);
      setShowCollegeModal(true);
      return;
    }

    const weight =
      product?.weightOptions?.[0]?.weight || product?.unit || "1kg";
    await addToCart(product?._id || productId, weight, 1);
  };

  const handleCollegeSubmit = async () => {
    if (!collegeName.trim()) {
      toast.error("Please enter your college name");
      return;
    }

    try {
      const payload = {
        productId: selectedProduct?._id || selectedProduct?.id,
        payload: {
          weight: selectedProduct?.weightOptions?.[0]?.weight || "1kg",
          collegeName: collegeName.trim(),
        },
        quantity: 1,
      };

      const result = await dispatch(addToCartAPI(payload));

      if (result.type.includes("fulfilled")) {
        toast.success("Added to cart!");
        setShowCollegeModal(false);
        setCollegeName("");
        setSelectedProduct(null);
        if (userInfo?.id) dispatch(fetchCart(userInfo.id));
      } else {
        throw new Error(result.payload || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Failed to add college item to cart:", error);
      toast.error("Failed to add to cart. Please try again.");
    }
  };

  // Effects
  useEffect(() => {
    if (userInfo && isAuthenticated) {
      dispatch(fetchCart(userInfo.id));
    }
  }, [userInfo, isAuthenticated, dispatch]);

  useEffect(() => {
    const fetchHomepageData = async () => {
      try {
        // Avoid full-screen loader if we already have recent cached data
        if (!cachedHomepage) {
          setLoading(true);
        }
        const res = await fetch(`${API_BASE_URL}/homepage`);
        if (!res.ok) throw new Error("Homepage fetch failed");
        const data = await res.json();
        if (!data.success || !data.data)
          throw new Error("Invalid homepage data");

        const processed = (data.data.featuredProducts || []).map((p) => {
          const price =
            p.weightOptions?.[0]?.price !== undefined
              ? p.weightOptions[0].price
              : p.price || 0;
          const originalPrice =
            p.weightOptions?.[0]?.originalPrice !== undefined
              ? p.weightOptions[0].originalPrice
              : p.originalPrice || null;

          const discount =
            originalPrice && price
              ? Math.round(((originalPrice - price) / originalPrice) * 100)
              : 0;

          return {
            ...p,
            image:
              p.images?.[0]?.url ||
              p.images?.[0] ||
              p.image ||
              "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=300&h=300&fit=crop&crop=center",
            rating: p.rating?.average || p.rating || 4.2,
            brand: p.brand || "Local Vendor",
            price,
            originalPrice,
            unit: p.weightOptions?.[0]?.weight || p.unit || "1 unit",
            deliveryTime: p.deliveryTime || "15–20 mins",
            discount,
          };
        });

        setFeaturedProducts(processed.slice(0, 8));
        // Store the full response for reuse on next navigation
        apiCache.setCachedData("homepageData", data);
        setError(null);
      } catch (err) {
        console.error(err);
        setError("Some products couldn't load.");
        setFeaturedProducts([]);
      } finally {
        setLoading(false);
      }
    };

    // If cached, hydrate UI immediately and refetch in background
    if (cachedHomepage?.data?.featuredProducts?.length) {
      try {
        const processed = (cachedHomepage.data.featuredProducts || []).map(
          (p) => {
            const price =
              p.weightOptions?.[0]?.price !== undefined
                ? p.weightOptions[0].price
                : p.price || 0;
            const originalPrice =
              p.weightOptions?.[0]?.originalPrice !== undefined
                ? p.weightOptions[0].originalPrice
                : p.originalPrice || null;

            const discount =
              originalPrice && price
                ? Math.round(((originalPrice - price) / originalPrice) * 100)
                : 0;

            return {
              ...p,
              image:
                p.images?.[0]?.url ||
                p.images?.[0] ||
                p.image ||
                "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=300&h=300&fit=crop&crop=center",
              rating: p.rating?.average || p.rating || 4.2,
              brand: p.brand || "Local Vendor",
              price,
              originalPrice,
              unit: p.weightOptions?.[0]?.weight || p.unit || "1 unit",
              deliveryTime: p.deliveryTime || "15–20 mins",
              discount,
            };
          }
        );
        setFeaturedProducts(processed.slice(0, 8));
        setLoading(false);
      } catch (e) {
        // If cache hydration fails, fall back to fetch
        console.warn("Cache hydration failed, refetching...", e);
      }
    }

    fetchHomepageData();
  }, [API_BASE_URL]);

  useEffect(() => {
    if (!displayBanners.length) return;
    const timer = setInterval(
      () => setCurrentBanner((prev) => (prev + 1) % displayBanners.length),
      8000
    );
    return () => clearInterval(timer);
  }, [displayBanners.length]);

  // Show full-screen loader only when no cached data exists
  if (loading && !cachedHomepage) return <InitialLoader />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AppHeader />
      <InstallPWA />

      <main className="flex-1 pt-28 pb-20 md:pb-24">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 space-y-5">
          {/* Notification permission */}
          {isSupported && permission === "default" && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-xs font-semibold text-slate-900">
                    Enable reminders for all your services
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Tiffin timings, food orders & future services updates.
                  </p>
                </div>
              </div>
              <button
                onClick={async () => {
                  const granted = await requestPermission();
                  if (granted) await subscribeToPush();
                }}
                className="text-[11px] font-semibold text-blue-600"
              >
                Enable
              </button>
            </div>
          )}
          {/* HERO – Image first, Blinkit style */}
          {/* HERO – ultra compact, chip-style buttons */}
          <section className="space-y-3">
            {/* Top compact hero card */}

            {/* Small horizontal promo banners – like Blinkit cards */}
            {displayBanners.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                {displayBanners.map((banner) => (
                  <div
                    key={banner.id}
                    className="min-w-[180px] max-w-[220px] h-24 rounded-2xl overflow-hidden relative bg-slate-200 flex-shrink-0"
                  >
                    <img
                      src={banner.image}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                    <div className="absolute bottom-2 left-2 right-2 space-y-0.5">
                      <p className="text-[10px] text-emerald-100 font-semibold line-clamp-1">
                        {banner.subtitle || "Local services on Tastyaana"}
                      </p>
                      <p className="text-[11px] text-white font-semibold line-clamp-2">
                        {banner.title}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
          <NewYearCelebration />
          {/* SERVICES GRID */}
          <section id="services-section" className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  All service categories
                </p>
                <p className="text-[11px] text-slate-500">
                  Tiffin & food abhi LIVE • Baaki categories app ke design me
                  add ho chuke hain
                </p>
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {mainCategories.map((cat) => {
                const isLive = LIVE_SERVICE_CATEGORIES.includes(cat.category);
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat)}
                    className={`group rounded-2xl overflow-hidden border bg-white flex flex-col ${
                      isLive
                        ? "border-slate-200 hover:border-emerald-300 hover:shadow-sm"
                        : "border-dashed border-slate-200 opacity-90"
                    }`}
                  >
                    <div className="relative aspect-square bg-slate-100 overflow-hidden">
                      <img
                        src={cat.image}
                        alt={cat.name}
                        className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
                          !isLive ? "grayscale-[25%]" : ""
                        }`}
                      />
                      <span
                        className={`absolute top-1 left-1 text-[9px] text-white px-1.5 py-0.5 rounded-md font-semibold ${cat.statusColor}`}
                      >
                        {cat.status}
                      </span>
                    </div>
                    <div className="px-1.5 py-1.5 text-center">
                      <p className="text-[11px] font-semibold text-slate-900 line-clamp-2 leading-tight">
                        {cat.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {cat.subtitle}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
          {/* QUICK ACTIONS */}
          <section className="space-y-2">
            <p className="text-sm font-semibold text-slate-900">
              Quick actions
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => navigate("/ghar/ka/khana")}
                className="rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-left flex flex-col justify-between"
              >
                <p className="text-[11px] text-emerald-600 font-semibold">
                  Manage tiffin
                </p>
                <p className="text-xs text-slate-800 font-semibold">
                  View / start plans
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Subscription-based daily meals.
                </p>
              </button>
              <button
                onClick={() => navigate("/category1/foodzone")}
                className="rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-left"
              >
                <p className="text-[11px] text-emerald-600 font-semibold">
                  Order food
                </p>
                <p className="text-xs text-slate-800 font-semibold">
                  One-time cravings
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Restaurant & home chefs.
                </p>
              </button>
              <button
                onClick={() => navigate("/orders")}
                className="rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-left"
              >
                <p className="text-[11px] text-emerald-600 font-semibold">
                  Track orders
                </p>
                <p className="text-xs text-slate-800 font-semibold">
                  All services
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Past + current orders in one list.
                </p>
              </button>
              <button
                onClick={() => navigate("/support")}
                className="rounded-xl bg-white border border-slate-200 px-3 py-2.5 text-left"
              >
                <p className="text-[11px] text-emerald-600 font-semibold">
                  Help & support
                </p>
                <p className="text-xs text-slate-800 font-semibold">
                  Chat / call
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Tiffin, food ya future services – sab ka support.
                </p>
              </button>
            </div>
          </section>
          {/* RECOMMENDED PRODUCTS */}
          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Recommended products
                </p>
                <p className="text-[11px] text-slate-500">
                  Mostly used for meals & daily use
                </p>
              </div>
              <button
                onClick={() => navigate("/products")}
                className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600"
              >
                <Store className="w-3 h-3" />
                See all
              </button>
            </div>

            {error && (
              <p className="text-[11px] text-amber-600 mb-1">{error}</p>
            )}

            {featuredProducts.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-3 text-center">
                <p className="text-xs text-slate-700">
                  Products will start appearing here as you add more items to
                  your catalog.
                </p>
              </div>
            ) : (
              <>
                {/* Mobile horizontal scroll */}
                <div className="block md:hidden">
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {featuredProducts.map((product) => {
                      const productId = product.id || product._id;
                      const cartItem = cartReduxItems.find((item) => {
                        if (item.id === productId || item._id === productId)
                          return true;
                        if (item.product && item.product._id === productId)
                          return true;
                        if (item.productId === productId) return true;
                        return false;
                      });
                      const qty = cartItem ? cartItem.quantity : 0;

                      return (
                        <div
                          key={productId}
                          onClick={() => navigate(`/products/${productId}`)}
                          className="min-w-[150px] max-w-[160px] bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col"
                        >
                          <div className="relative aspect-[4/3] bg-slate-50">
                            {product.discount > 0 && (
                              <span className="absolute top-1.5 left-1.5 bg-red-500 text-[9px] text-white px-1.5 py-0.5 rounded-md font-semibold">
                                {product.discount}% OFF
                              </span>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleWishlist(product);
                              }}
                              className="absolute top-1.5 right-1.5 bg-white/90 rounded-lg w-6 h-6 flex items-center justify-center shadow-sm"
                            >
                              <Heart
                                className={`w-3 h-3 ${
                                  getHeartIconProps(productId).icon
                                }`}
                              />
                            </button>
                            <img
                              src={product.image}
                              alt={product.name || product.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="px-2 py-2 flex flex-col flex-1">
                            <p className="text-[9px] text-emerald-600 font-semibold uppercase tracking-wide mb-0.5">
                              {product.brand}
                            </p>
                            <p className="text-[11px] font-semibold text-slate-900 line-clamp-2 flex-1">
                              {product.name || product.title}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {product.unit || "1 unit"}
                            </p>
                            <div className="flex items-baseline gap-1 mt-1">
                              <span className="text-sm font-semibold text-slate-900">
                                ₹{product.price}
                              </span>
                              {product.originalPrice && (
                                <span className="text-[10px] text-slate-400 line-through">
                                  ₹{product.originalPrice}
                                </span>
                              )}
                            </div>
                            {qty > 0 ? (
                              <div className="mt-1 flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-1.5 py-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateCartQuantity(productId, qty - 1);
                                  }}
                                  className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-emerald-600 text-sm"
                                >
                                  -
                                </button>
                                <span className="text-[11px] font-semibold text-emerald-700">
                                  {qty}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(productId);
                                  }}
                                  className="w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center text-white text-sm"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(productId);
                                }}
                                className="mt-1 w-full py-1.5 text-[11px] font-semibold rounded-lg bg-emerald-500 text-white"
                              >
                                ADD
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Desktop grid */}
                <div className="hidden md:grid grid-cols-3 lg:grid-cols-4 gap-3">
                  {featuredProducts.map((product) => {
                    const productId = product.id || product._id;
                    const cartItem = cartReduxItems.find((item) => {
                      if (item.id === productId || item._id === productId)
                        return true;
                      if (item.product && item.product._id === productId)
                        return true;
                      if (item.productId === productId) return true;
                      return false;
                    });
                    const qty = cartItem ? cartItem.quantity : 0;

                    return (
                      <div
                        key={productId}
                        onClick={() => navigate(`/products/${productId}`)}
                        className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer flex flex-col"
                      >
                        <div className="relative aspect-[4/3] bg-slate-50">
                          {product.discount > 0 && (
                            <span className="absolute top-2 left-2 bg-red-500 text-[10px] text-white px-1.5 py-0.5 rounded-md font-semibold">
                              {product.discount}% OFF
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWishlist(product);
                            }}
                            className="absolute top-2 right-2 bg-white/90 rounded-lg w-7 h-7 flex items-center justify-center shadow-sm"
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${
                                getHeartIconProps(productId).icon
                              }`}
                            />
                          </button>
                          <img
                            src={product.image}
                            alt={product.name || product.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="px-3 pt-2 pb-3 flex flex-col flex-1">
                          <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide mb-0.5">
                            {product.brand}
                          </p>
                          <p className="text-xs font-semibold text-slate-900 line-clamp-2 flex-1">
                            {product.name || product.title}
                          </p>
                          <div className="flex items-center justify-between mt-1 mb-1">
                            <span className="text-[11px] text-slate-500">
                              {product.unit || "1 unit"}
                            </span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {product.deliveryTime}
                            </span>
                          </div>
                          <div className="flex items-end gap-1 mb-1.5">
                            <span className="text-sm font-semibold text-slate-900">
                              ₹{product.price}
                            </span>
                            {product.originalPrice && (
                              <span className="text-[11px] text-slate-400 line-through">
                                ₹{product.originalPrice}
                              </span>
                            )}
                          </div>
                          {qty > 0 ? (
                            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1.5">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateCartQuantity(productId, qty - 1);
                                }}
                                className="w-6 h-6 bg-white rounded-md flex items-center justify-center text-emerald-600 text-sm"
                              >
                                -
                              </button>
                              <span className="text-xs font-semibold text-emerald-700">
                                {qty}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(productId);
                                }}
                                className="w-6 h-6 bg-emerald-500 rounded-md flex items-center justify-center text-white text-sm"
                              >
                                +
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(productId);
                              }}
                              className="w-full mt-0.5 py-1.5 text-xs font-semibold rounded-lg bg-emerald-500 text-white"
                            >
                              ADD
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </section>
          {/* WHY SECTION */}
          <section className="mb-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5">
              <div className="text-center mb-4">
                <p className="text-sm font-semibold text-slate-900">
                  Why Our Approach Works
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Simple, local, and reliable — designed for everyday needs. No
                  juggling multiple apps or patterns.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-1.5">
                    <Clock className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-xs font-semibold text-slate-900">
                    Everyday-first focus
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    We prioritize daily essentials — tiffin and food come first.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-1.5">
                    <Award className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-xs font-semibold text-slate-900">
                    Grow local businesses
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Each category is powered by local stores and home kitchens.
                    We help them go digital and thrive.
                  </p>
                </div>
                <div className="flex flex-col items-center text-center">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-1.5">
                    <Headphones className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-xs font-semibold text-slate-900">
                    Consistent, simple UI
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Tiffin, laundry, or rooms — the same predictable patterns so
                    you never feel lost.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <ActiveOrderStrip />

      {/* COLLEGE MODAL */}
      {showCollegeModal && (
        <div className="fixed inset-0 bg-black/55 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm">
            <p className="text-sm font-semibold text-slate-900 mb-2">
              College information required
            </p>
            <p className="text-xs text-slate-500 mb-3">
              This is a college-branded item. Please enter your college name to
              continue.
            </p>
            <input
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              placeholder="Enter college name"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm mb-4 outline-none focus:border-emerald-500"
            />
            <div className="flex justify-end gap-2 text-sm">
              <button
                onClick={() => {
                  setShowCollegeModal(false);
                  setSelectedProduct(null);
                  setCollegeName("");
                }}
                className="px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleCollegeSubmit}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold"
              >
                Add to cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
