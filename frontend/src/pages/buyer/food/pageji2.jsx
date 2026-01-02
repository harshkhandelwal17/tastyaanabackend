// src/pages/CategoryPage.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import {
  Search,
  ShoppingCart,
  ArrowLeft,
  Star,
  Clock,
  Loader2,
  Heart,
  Plus,
  Minus,
  Truck,
  Eye,
  Zap,
  MapPin,
} from "lucide-react";

import { useOptimizedWishlist } from "../../../hooks/useOptimizedWishlist";
import { useOptimizedCart } from "../../../hooks/useOptimizedCart";

/* ===========================
   CATEGORY CONFIG / THEME
   =========================== */

const CATEGORY_CONFIG = {
  grocery: {
    key: "grocery",
    icon: "🛒",
    title: "Groceries & Daily Needs",
    tagline: "Daily essentials: fresh fruits, vegetables, dairy, and more",
    gradient: "from-emerald-500 to-emerald-600",
    buttonBg: "bg-emerald-600 hover:bg-emerald-700",
  },
  foodzone: {
    key: "foodzone",
    icon: "🍽️",
    title: "Foodzone",
    tagline: "Top-rated restaurants and home-style meals, near you",
    gradient: "from-orange-500 to-orange-600",
    buttonBg: "bg-orange-600 hover:bg-orange-700",
  },
  vratmeal: {
    key: "vratmeal",
    icon: "🙏",
    title: "Vrat-Friendly Meals",
    tagline: "Fasting-friendly, clean meals you can trust",
    gradient: "from-amber-500 to-orange-500",
    buttonBg: "bg-amber-500 hover:bg-amber-600",
  },
};

const getCategoryConfig = (category) => {
  const key = (category || "").toLowerCase();
  return CATEGORY_CONFIG[key] || CATEGORY_CONFIG.grocery;
};

/* ===========================
   HELPERS
   =========================== */

// Foodzone me grocery-type items hata do
const isFoodProduct = (raw, categoryKey) => {
  if (categoryKey !== "foodzone") return true;

  const main =
    (raw.mainCategory ||
      raw.category ||
      raw.categoryName ||
      raw.type ||
      "") + "";

  const lower = main.toLowerCase();

  const banned = [
    "grocery",
    "vegetable",
    "fruit",
    "fruits",
    "veggie",
    "cleaning",
    "household",
    "staple",
    "dal",
    "atta",
    "oil",
  ];

  if (banned.some((b) => lower.includes(b))) return false;
  if (raw.isFood === false) return false;

  return true;
};

// Common normalization
const normalizeProduct = (product, categoryKey) => {
  const baseWeight = product.weightOptions?.[0];
  const price = baseWeight?.price || product.price || 0;
  const originalPrice =
    baseWeight?.originalPrice || product.originalPrice || null;

  const discount =
    originalPrice && price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : product.discount || 0;

  const subKey = (product.subCategory || product.subcategory || "all")
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-");

  const restaurantId =
    product.restaurantId ||
    product.restaurant?._id ||
    product.kitchenId ||
    product.vendorId ||
    "single-kitchen";

  const restaurantName =
    product.restaurantName ||
    product.restaurant?.name ||
    product.kitchenName ||
    product.vendorName ||
    (categoryKey === "foodzone" ? "Partner Kitchen" : undefined);

  const restaurantImage =
    product.restaurantImage ||
    product.restaurant?.image ||
    product.images?.[0]?.url ||
    product.images?.[0] ||
    product.image ||
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400";

  const isVeg =
    product.isVeg ?? product.veg ?? (product.type === "veg" ? true : false);

  const rawCuisines =
    product.cuisines ||
    product.cuisine ||
    product.tags ||
    product.categoryNames ||
    [];

  const cuisines = Array.isArray(rawCuisines)
    ? rawCuisines
    : rawCuisines.toString().split(",");

  return {
    ...product,
    id: product._id || product.id,
    name: product.name || product.title || "Product",
    image:
      product.images?.[0]?.url ||
      product.images?.[0] ||
      product.image ||
      "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400",
    rating: Number(product.rating?.average || product.rating || 4.0),
    reviews:
      product.reviewCount ||
      product.reviews ||
      Math.floor(Math.random() * 300) + 50,
    price,
    originalPrice,
    discount,
    inStock:
      product.isAvailable !== false &&
      (product.stockQty > 0 ||
        baseWeight?.stock > 0 ||
        product.inStock !== false),
    subCategoryKey: subKey,
    restaurantId,
    restaurantName,
    restaurantImage,
    isVeg,
    cuisines,
    deliveryTime: product.deliveryTime || "25–35 mins",
  };
};

/* ===========================
   COMMON DISH CARD (GRID)
   =========================== */

const DishCard = ({
  product,
  theme,
  isWishlisted,
  cartQuantity,
  onAddToCart,
  onRemoveFromCart,
  onToggleWishlist,
  onViewProduct,
  heartIconProps,
  showRestaurantName = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWeight, setSelectedWeight] = useState(
    product.weightOptions?.[0] || {
      weight: product.unit || "1 unit",
      price: product.price || 0,
    }
  );

  const displayPrice = selectedWeight.price || product.price || 0;

  const handleAdd = async () => {
    setIsLoading(true);
    try {
      await onAddToCart(product, selectedWeight);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      await onRemoveFromCart(product);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-[0_4px_12px_rgba(0,0,0,0.04)] hover:shadow-[0_6px_18px_rgba(0,0,0,0.07)] border border-gray-100 overflow-hidden group cursor-pointer transition-transform duration-200 hover:-translate-y-0.5"
      onClick={() => onViewProduct(product)}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
        {/* Discount */}
        {product.discount > 0 && (
          <div className="absolute top-2 left-2 z-10">
            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold shadow-sm">
              {product.discount}% OFF
            </span>
          </div>
        )}

        {/* Wishlist */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm transition ${
            isWishlisted
              ? "bg-red-500 text-white"
              : "bg-white/90 text-gray-600 hover:bg-red-500 hover:text-white"
          }`}
        >
          <Heart
            className={`w-4 h-4 ${
              heartIconProps?.icon || (isWishlisted ? "fill-current" : "")
            }`}
          />
        </button>

        <img
          src={product.image}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            !product.inStock ? "grayscale" : ""
          }`}
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400";
          }}
        />

        {/* Quick view */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewProduct(product);
            }}
            className="bg-white text-gray-800 text-xs px-3 py-1.5 rounded-full flex items-center gap-1 shadow"
          >
            <Eye className="w-3 h-3" />
            View item
          </button>
        </div>

        {!product.inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-gray-900 text-white text-[10px] px-3 py-1 rounded-full">
              Out of stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        <h3 className="text-[12px] sm:text-sm font-semibold text-gray-900 line-clamp-2">
          {product.name}
        </h3>

        {showRestaurantName && product.restaurantName && (
          <p className="text-[10px] text-gray-500 line-clamp-1">
            {product.restaurantName}
          </p>
        )}

        {/* Rating row */}
        <div className="flex items-center gap-1 text-[10px] text-gray-600">
          <div className="flex items-center gap-1 bg-green-700 text-white px-1.5 py-0.5 rounded">
            <Star className="w-3 h-3" />
            <span>{product.rating?.toFixed(1)}</span>
          </div>
          <span className="text-gray-400">•</span>
          <span>{product.reviews} ratings</span>
          {product.isVeg && (
            <>
              <span className="text-gray-400">•</span>
              <span className="text-[9px] px-1 py-0.5 border border-green-600 text-green-700 rounded">
                Veg
              </span>
            </>
          )}
        </div>

        {/* Weight options */}
        {product.weightOptions && product.weightOptions.length > 1 && (
          <select
            value={selectedWeight.weight}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              const w = product.weightOptions.find(
                (opt) => opt.weight === e.target.value
              );
              setSelectedWeight(w);
            }}
            className="mt-1 w-full border border-gray-200 rounded-lg text-[10px] px-2 py-1 focus:outline-none focus:border-orange-500 bg-gray-50"
          >
            {product.weightOptions.map((opt) => (
              <option key={opt.weight} value={opt.weight}>
                {opt.weight} • ₹{opt.price}
              </option>
            ))}
          </select>
        )}

        {/* Price + delivery */}
        <div className="flex items-center justify-between mt-1 text-[11px]">
          <div className="flex items-center gap-1">
            <span className="text-sm sm:text-base font-semibold text-gray-900">
              ₹{displayPrice}
            </span>
            {product.originalPrice && (
              <span className="text-[10px] text-gray-400 line-through">
                ₹{product.originalPrice}
              </span>
            )}
          </div>
          <div className="flex flex-col items-end text-[10px] text-gray-500">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {product.deliveryTime}
            </span>
            <span className="flex items-center gap-1">
              <Truck className="w-3 h-3" />
              Free delivery
            </span>
          </div>
        </div>

        {/* Add / quantity */}
        <div className="mt-2">
          {!product.inStock ? (
            <button
              disabled
              className="w-full text-[11px] py-1.5 rounded-lg bg-gray-200 text-gray-500 font-semibold"
            >
              OUT OF STOCK
            </button>
          ) : cartQuantity > 0 ? (
            <div className="flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-1.5 py-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsLoading(true);
                  onRemoveFromCart(product).finally(() =>
                    setIsLoading(false)
                  );
                }}
                disabled={isLoading}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-orange-300 bg-white"
              >
                <Minus className="w-3 h-3 text-orange-600" />
              </button>
              <span className="text-xs font-bold text-orange-700">
                {cartQuantity}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdd();
                }}
                disabled={isLoading}
                className="w-7 h-7 flex items-center justify-center rounded-md bg-orange-500"
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 text-white animate-spin" />
                ) : (
                  <Plus className="w-3 h-3 text-white" />
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAdd();
              }}
              disabled={isLoading}
              className={`w-full text-[11px] py-1.5 rounded-lg font-semibold text-white bg-gradient-to-r ${theme.gradient} flex items-center justify-center gap-1`}
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="w-3 h-3" />
                  <span>Add</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ===========================
   FOODZONE PAGE (ZOMATO STYLE)
   =========================== */

const FoodzonePage = ({
  categoryKey,
  currentConfig,
  userInfo,
  isAuthenticated,
  cartReduxItems,
  cartReduxCount,
  addToCart,
  updateCartQuantity,
  wishlistItems,
  toggleWishlist,
  getHeartIconProps,
}) => {
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("restaurants"); // restaurants | dishes
  const [minRating, setMinRating] = useState(0);
  const [vegOnly, setVegOnly] = useState(false);
  const [offersOnly, setOffersOnly] = useState(false);

  const API_BASE_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch Foodzone products
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const url = `${API_BASE_URL}/products?category=${categoryKey}`;
        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            ...(userInfo &&
              isAuthenticated && {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              }),
          },
        });

        let data = await res.json();
        let productsData =
          Array.isArray(data) ? data : data.products || data.data || [];

        if (!Array.isArray(productsData) || productsData.length === 0) {
          productsData = [
            {
              _id: "demo1",
              name: "Sample Thali",
              price: 199,
              originalPrice: 249,
              subCategory: "thali",
              rating: 4.3,
              reviews: 120,
              images: [],
              inStock: true,
              restaurantName: "Demo Kitchen",
              restaurantId: "demo-rest-1",
              isFood: true,
            },
          ];
        }

        const normalized = productsData
          .filter((p) => isFoodProduct(p, categoryKey))
          .map((p) => normalizeProduct(p, categoryKey));

        setProducts(normalized);
      } catch (err) {
        console.error("Foodzone fetch error:", err);
        toast.error("Failed to load Foodzone items");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_BASE_URL, categoryKey, isAuthenticated, userInfo]);

  // FILTERED DISHES (for dishes tab)
  const filteredDishes = useMemo(() => {
    return products.filter((p) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchRest = p.restaurantName?.toLowerCase().includes(q);
        const matchCui = p.cuisines.join(" ").toLowerCase().includes(q);
        if (!matchName && !matchRest && !matchCui) return false;
      }

      if (vegOnly && !p.isVeg) return false;
      if (offersOnly && !(p.discount && p.discount > 0)) return false;
      if (minRating > 0 && p.rating < minRating) return false;

      return true;
    });
  }, [products, searchQuery, vegOnly, offersOnly, minRating]);

  // RESTAURANT LIST (for restaurants tab)
  const restaurants = useMemo(() => {
    const map = new Map();

    filteredDishes.forEach((p) => {
      const id = p.restaurantId || "single-kitchen";
      if (!map.has(id)) {
        map.set(id, {
          id,
          name: p.restaurantName || "Partner Kitchen",
          image: p.restaurantImage || p.image,
          rating: p.rating,
          reviews: p.reviews,
          cuisines: new Set(p.cuisines || []),
          isPureVeg: p.isVeg || false,
          minPrice: p.price || 0,
          maxDiscount: p.discount || 0,
          deliveryTime: p.deliveryTime || "25–35 mins",
          itemsCount: 1,
        });
      } else {
        const r = map.get(id);
        r.rating = (r.rating + p.rating) / 2;
        r.reviews += p.reviews;
        p.cuisines?.forEach((c) => r.cuisines.add(c));
        r.isPureVeg = r.isPureVeg && p.isVeg;
        r.minPrice = Math.min(r.minPrice, p.price || r.minPrice);
        r.maxDiscount = Math.max(r.maxDiscount, p.discount || 0);
        r.itemsCount += 1;
      }
    });

    return Array.from(map.values()).map((r) => ({
      ...r,
      cuisines: Array.from(r.cuisines),
    }));
  }, [filteredDishes]);

  // Cart handlers
  const handleAddToCart = async (product, selectedWeight) => {
    const weight = selectedWeight?.weight || product?.unit || "1 unit";
    await addToCart(product.id, weight, 1);
  };

  const handleRemoveFromCart = async (product) => {
    const productId = product.id;
    const cartItem = cartReduxItems.find((item) => {
      if (
        item.product &&
        (item.product._id === productId || item.product.id === productId)
      )
        return true;
      if (item.productId === productId) return true;
      if (item.id === productId || item._id === productId) return true;
      return false;
    });

    if (cartItem) {
      const newQuantity = cartItem.quantity - 1;
      await updateCartQuantity(productId, newQuantity);
    }
  };

  const handleToggleWishlist = async (product) => {
    if (!userInfo || !isAuthenticated) {
      toast.info("Please login to manage your wishlist");
      navigate("/login");
      return;
    }
    toggleWishlist(product);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600 text-base font-medium">
            Loading Foodzone...
          </p>
        </div>
      </div>
    );
  }

  const totalDishes = filteredDishes.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow"
            : "bg-white shadow-sm"
        }`}
      >
        {/* Banner */}
        <div className={`${currentConfig.buttonBg} text-white py-1.5 px-3`}>
          <div className="flex justify-center items-center text-xs font-medium">
            <Zap className="w-3 h-3 mr-1" />
            <span>Fast delivery • Free above ₹299</span>
          </div>
        </div>

        {/* Main header */}
        <div className="px-3 sm:px-5 py-2">
          <div className="max-w-6xl mx-auto flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </button>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-r ${currentConfig.gradient}`}
              >
                <span className="text-white text-lg font-semibold">
                  {currentConfig.icon}
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1 text-[11px] text-gray-500">
                  <MapPin className="w-3 h-3" />
                  <span>Delivering near you</span>
                </div>
                <h1 className="text-sm sm:text-lg font-bold">
                  Foodzone – Order from restaurants or dishes
                </h1>
              </div>
            </div>

            {/* Search + Cart */}
            <div className="flex-1 flex items-center gap-2 ml-1">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search restaurant, dish or cuisine"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-[13px] focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
              </div>

              <button
                onClick={() => navigate("/cart")}
                className="relative p-1.5 rounded-lg hover:bg-gray-100 flex-shrink-0"
              >
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                {cartReduxCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {cartReduxCount > 9 ? "9+" : cartReduxCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="pt-24 pb-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-5">
          {/* HERO / INFO ROW */}
          <section className="mb-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="text-[11px] text-gray-500">Foodzone</p>
                <h2 className="text-base sm:text-xl font-semibold text-gray-900">
                  {restaurants.length} restaurants • {totalDishes} dishes
                </h2>
                <p className="text-[11px] sm:text-[13px] text-gray-500 mt-1">
                  Step 1: Choose a restaurant or directly pick a dish from the
                  list below.
                </p>
              </div>
              <div className="flex flex-col items-start sm:items-end text-[11px] sm:text-[12px] text-gray-600 gap-1">
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-green-600" />
                  <span>Top rated partner kitchens</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-orange-500" />
                  <span>~30–40 min average delivery</span>
                </div>
              </div>
            </div>
          </section>

          {/* TABS + CHIPS */}
          <section className="mb-3 space-y-2">
            <p className="text-[11px] text-gray-500">
              How do you want to browse?
            </p>

            {/* Tabs */}
            <div className="bg-white rounded-full p-1 flex text-[12px] shadow-sm border border-gray-100">
              <button
                onClick={() => setViewMode("restaurants")}
                className={`flex-1 py-1.5 rounded-full text-center ${
                  viewMode === "restaurants"
                    ? "bg-orange-500 text-white font-semibold shadow"
                    : "text-gray-700"
                }`}
              >
                By restaurants
              </button>
              <button
                onClick={() => setViewMode("dishes")}
                className={`flex-1 py-1.5 rounded-full text-center ${
                  viewMode === "dishes"
                    ? "bg-orange-500 text-white font-semibold shadow"
                    : "text-gray-700"
                }`}
              >
                By dishes
              </button>
            </div>

            {/* Filter chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 text-[11px]">
              <button
                onClick={() => setVegOnly((v) => !v)}
                className={`px-3 py-1 rounded-full border flex items-center gap-1 whitespace-nowrap ${
                  vegOnly
                    ? "border-green-600 text-green-700 bg-green-50"
                    : "border-gray-200 text-gray-700 bg-white"
                }`}
              >
                Pure Veg
              </button>
              <button
                onClick={() => setOffersOnly((v) => !v)}
                className={`px-3 py-1 rounded-full border flex items-center gap-1 whitespace-nowrap ${
                  offersOnly
                    ? "border-red-600 text-red-700 bg-red-50"
                    : "border-gray-200 text-gray-700 bg-white"
                }`}
              >
                Offers
              </button>
              <button
                onClick={() => setMinRating((r) => (r >= 4 ? 0 : 4))}
                className={`px-3 py-1 rounded-full border flex items-center gap-1 whitespace-nowrap ${
                  minRating >= 4
                    ? "border-yellow-500 text-yellow-700 bg-yellow-50"
                    : "border-gray-200 text-gray-700 bg-white"
                }`}
              >
                <Star className="w-3 h-3" />
                Rating 4.0+
              </button>
            </div>
          </section>

          {/* RESTAURANTS VIEW */}
          {viewMode === "restaurants" && (
            <section className="mb-6">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                Restaurants near you
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {restaurants.map((rest) => (
                  <div
                    key={rest.id}
                    onClick={() =>
                      navigate(`/foodzone/restaurant/${rest.id}`)
                    }
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition cursor-pointer overflow-hidden"
                  >
                    <div className="relative h-32 sm:h-40 bg-gray-100 overflow-hidden">
                      <img
                        src={rest.image}
                        alt={rest.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src =
                            "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400";
                        }}
                      />
                      {rest.maxDiscount > 0 && (
                        <div className="absolute bottom-2 left-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                          UP TO {rest.maxDiscount}% OFF
                        </div>
                      )}
                      {rest.isPureVeg && (
                        <div className="absolute top-2 left-2 bg-green-700 text-white text-[10px] px-2 py-0.5 rounded-full">
                          Pure Veg
                        </div>
                      )}
                    </div>

                    <div className="p-3 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">
                          {rest.name}
                        </h3>
                        <div className="flex items-center gap-1 bg-green-700 text-white text-[10px] px-1.5 py-0.5 rounded">
                          <Star className="w-3 h-3" />
                          <span>{rest.rating?.toFixed(1) || "4.0"}</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500 line-clamp-1">
                        {rest.cuisines.slice(0, 3).join(" • ") ||
                          "Home food, Indian"}
                      </p>
                      <div className="flex items-center justify-between text-[11px] text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {rest.deliveryTime}
                        </span>
                        <span>₹{rest.minPrice || 150} for one</span>
                      </div>
                      <p className="text-[10px] text-gray-400">
                        {rest.itemsCount} items available
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {restaurants.length === 0 && (
                <div className="mt-10 bg-white rounded-2xl shadow p-6 text-center">
                  <div className="text-4xl mb-3">😕</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    No restaurants found
                  </h3>
                  <p className="text-sm text-gray-600">
                    Try removing filters or change your search.
                  </p>
                </div>
              )}
            </section>
          )}

          {/* DISHES VIEW (DIRECT PRODUCTS) */}
          {viewMode === "dishes" && (
            <section className="mb-4">
              <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
                All dishes from these restaurants
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
                {filteredDishes.map((product) => {
                  const productId = product.id;

                  const isWishlisted = wishlistItems.some((item) => {
                    if (item._id && item._id === productId) return true;
                    if (item.id && item.id === productId) return true;
                    if (
                      item.product &&
                      (item.product._id === productId ||
                        item.product.id === productId)
                    )
                      return true;
                    return false;
                  });

                  const cartItem = cartReduxItems.find((item) => {
                    if (
                      item.product &&
                      (item.product._id === productId ||
                        item.product.id === productId)
                    )
                      return true;
                    if (item.productId === productId) return true;
                    if (item.id === productId || item._id === productId)
                      return true;
                    return false;
                  });

                  const cartQuantity = cartItem ? cartItem.quantity : 0;

                  return (
                    <DishCard
                      key={productId}
                      product={product}
                      theme={currentConfig}
                      isWishlisted={isWishlisted}
                      cartQuantity={cartQuantity}
                      onAddToCart={handleAddToCart}
                      onRemoveFromCart={handleRemoveFromCart}
                      onToggleWishlist={handleToggleWishlist}
                      onViewProduct={(p) =>
                        navigate(`/products/${p.id || p._id}`)
                      }
                      heartIconProps={getHeartIconProps(productId)}
                      showRestaurantName={true}
                    />
                  );
                })}
              </div>

              {filteredDishes.length === 0 && (
                <div className="mt-10 bg-white rounded-2xl shadow p-6 text-center">
                  <div className="text-4xl mb-3">🔍</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">
                    No dishes found
                  </h3>
                  <p className="text-sm text-gray-600">
                    Try changing search text or filters.
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

/* ===========================
   GENERIC CATEGORY PAGE (GROCERY / VRAT)
   =========================== */

const GenericCategoryPage = ({
  categoryKey,
  currentConfig,
  userInfo,
  isAuthenticated,
  cartReduxItems,
  cartReduxCount,
  addToCart,
  updateCartQuantity,
  wishlistItems,
  toggleWishlist,
  getHeartIconProps,
}) => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");

  const API_BASE_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const url = `${API_BASE_URL}/products?category=${categoryKey}`;
        const res = await fetch(url, {
          headers: {
            "Content-Type": "application/json",
            ...(userInfo &&
              isAuthenticated && {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              }),
          },
        });

        let data = await res.json();
        let productsData =
          Array.isArray(data) ? data : data.products || data.data || [];

        if (!Array.isArray(productsData) || productsData.length === 0) {
          productsData = [
            {
              _id: "demo1",
              name: "Sample Item",
              price: 99,
              originalPrice: 129,
              rating: 4.2,
              images: [],
              inStock: true,
            },
          ];
        }

        const normalized = productsData.map((p) =>
          normalizeProduct(p, categoryKey)
        );
        setProducts(normalized);
      } catch (err) {
        console.error("Generic category fetch error:", err);
        toast.error("Failed to load items");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [API_BASE_URL, categoryKey, isAuthenticated, userInfo]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return p.name.toLowerCase().includes(q);
    });
  }, [products, searchQuery]);

  const handleAddToCart = async (product, selectedWeight) => {
    const weight = selectedWeight?.weight || product?.unit || "1 unit";
    await addToCart(product.id, weight, 1);
  };

  const handleRemoveFromCart = async (product) => {
    const productId = product.id;
    const cartItem = cartReduxItems.find((item) => {
      if (
        item.product &&
        (item.product._id === productId || item.product.id === productId)
      )
        return true;
      if (item.productId === productId) return true;
      if (item.id === productId || item._id === productId) return true;
      return false;
    });

    if (cartItem) {
      const newQuantity = cartItem.quantity - 1;
      await updateCartQuantity(productId, newQuantity);
    }
  };

  const handleToggleWishlist = async (product) => {
    if (!userInfo || !isAuthenticated) {
      toast.info("Please login to manage your wishlist");
      navigate("/login");
      return;
    }
    toggleWishlist(product);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-500 mx-auto mb-4" />
          <p className="text-gray-600 text-base font-medium">
            Loading {categoryKey}...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* HEADER */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-md shadow"
            : "bg-white shadow-sm"
        }`}
      >
        {/* Banner */}
        <div className={`${currentConfig.buttonBg} text-white py-1.5 px-3`}>
          <div className="flex justify-center items-center text-xs font-medium">
            <Zap className="w-3 h-3 mr-1" />
            <span>Fast delivery • Free above ₹299</span>
          </div>
        </div>

        {/* Main header */}
        <div className="px-3 sm:px-5 py-2">
          <div className="max-w-6xl mx-auto flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </button>

            <div className="flex items-center gap-2 flex-shrink-0">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-r ${currentConfig.gradient}`}
              >
                <span className="text-white text-lg font-semibold">
                  {currentConfig.icon}
                </span>
              </div>
              <div>
                <p className="text-[11px] text-gray-500">Category</p>
                <h1 className="text-sm sm:text-lg font-bold capitalize">
                  {categoryKey}
                </h1>
              </div>
            </div>

            {/* Search + Cart */}
            <div className="flex-1 flex items-center gap-2 ml-1">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder={`Search in ${categoryKey}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-[13px] focus:outline-none focus:bg-white focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                onClick={() => navigate("/cart")}
                className="relative p-1.5 rounded-lg hover:bg-gray-100 flex-shrink-0"
              >
                <ShoppingCart className="w-5 h-5 text-gray-700" />
                {cartReduxCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                    {cartReduxCount > 9 ? "9+" : cartReduxCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="pt-24 pb-10">
        <div className="max-w-6xl mx-auto px-3 sm:px-5">
          <section className="mb-4">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] text-gray-500">Explore</p>
                <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                  {filteredProducts.length} items in {categoryKey}
                </h2>
              </div>
              <div className="hidden sm:flex items-center gap-1 text-[11px] text-gray-600">
                <Truck className="w-3 h-3" />
                <span>Fast delivery</span>
              </div>
            </div>
          </section>

          {/* GRID */}
          <section>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {filteredProducts.map((product) => {
                const productId = product.id;

                const isWishlisted = wishlistItems.some((item) => {
                  if (item._id && item._id === productId) return true;
                  if (item.id && item.id === productId) return true;
                  if (
                    item.product &&
                    (item.product._id === productId ||
                      item.product.id === productId)
                  )
                    return true;
                  return false;
                });

                const cartItem = cartReduxItems.find((item) => {
                  if (
                    item.product &&
                    (item.product._id === productId ||
                      item.product.id === productId)
                  )
                    return true;
                  if (item.productId === productId) return true;
                  if (item.id === productId || item._id === productId)
                    return true;
                  return false;
                });

                const cartQuantity = cartItem ? cartItem.quantity : 0;

                return (
                  <DishCard
                    key={productId}
                    product={product}
                    theme={currentConfig}
                    isWishlisted={isWishlisted}
                    cartQuantity={cartQuantity}
                    onAddToCart={handleAddToCart}
                    onRemoveFromCart={handleRemoveFromCart}
                    onToggleWishlist={handleToggleWishlist}
                    onViewProduct={(p) => navigate(`/products/${p.id}`)}
                    heartIconProps={getHeartIconProps(productId)}
                    showRestaurantName={false}
                  />
                );
              })}
            </div>

            {filteredProducts.length === 0 && (
              <div className="mt-10 bg-white rounded-2xl shadow p-6 text-center">
                <div className="text-4xl mb-3">🔍</div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  No products found
                </h3>
                <p className="text-sm text-gray-600">
                  Try changing search text.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

/* ===========================
   MAIN CATEGORY PAGE WRAPPER
   =========================== */

const CategoryPage = () => {
  const { categoryId } = useParams();
  const categoryKey = decodeURIComponent(categoryId || "grocery").toLowerCase();
  const currentConfig = getCategoryConfig(categoryKey);

  const { user: userInfo, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const {
    addToCart,
    updateCartQuantity,
    cartItems: cartReduxItems,
    totalQuantity: cartReduxCount,
  } = useOptimizedCart();

  const {
    wishlistItems,
    toggleWishlist,
    getHeartIconProps,
  } = useOptimizedWishlist();

  if (categoryKey === "foodzone") {
    return (
      <FoodzonePage
        categoryKey={categoryKey}
        currentConfig={currentConfig}
        userInfo={userInfo}
        isAuthenticated={isAuthenticated}
        cartReduxItems={cartReduxItems}
        cartReduxCount={cartReduxCount}
        addToCart={addToCart}
        updateCartQuantity={updateCartQuantity}
        wishlistItems={wishlistItems}
        toggleWishlist={toggleWishlist}
        getHeartIconProps={getHeartIconProps}
      />
    );
  }

  return (
    <GenericCategoryPage
      categoryKey={categoryKey}
      currentConfig={currentConfig}
      userInfo={userInfo}
      isAuthenticated={isAuthenticated}
      cartReduxItems={cartReduxItems}
      cartReduxCount={cartReduxCount}
      addToCart={addToCart}
      updateCartQuantity={updateCartQuantity}
      wishlistItems={wishlistItems}
      toggleWishlist={toggleWishlist}
      getHeartIconProps={getHeartIconProps}
    />
  );
};

export default CategoryPage;
