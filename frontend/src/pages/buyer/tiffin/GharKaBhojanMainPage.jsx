import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Search,
  Star,
  MapPin,
  ChevronRight,
  X,
  Menu,
  Plus,
  Minus,
  Clock,
  Truck,
  Shield,
  Filter,
  Users,
  Utensils, // Used for daily Tiffin
  CalendarCheck, // Used for Plans
} from "lucide-react";
import axios from "axios";

import { useOptimizedWishlist } from "../../../hooks/useOptimizedWishlist";
import { useOptimizedCart } from "../../../hooks/useOptimizedCart";

// ----------------------------------------------------------------------
// REFACTORED COMPONENT (LOGIC FIXED + UI POLISHED)
// ----------------------------------------------------------------------

const GharKaBhojanMainPage = () => {
  const navigate = useNavigate();

  // Redux state & hooks (keeping existing logic)
  const { isAuthenticated } = useSelector((state) => state.auth);
  const { addToCart, updateCartQuantity, cartItems: cartReduxItems, totalQuantity: cartReduxCount } = useOptimizedCart();
  const { wishlistItems, toggleWishlist, getHeartIconProps } = useOptimizedWishlist();

  // UI state
  const [isScrolled, setIsScrolled] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [sortBy, setSortBy] = useState("rating"); // rating | price_low | price_high | name

  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [activeVendorTab, setActiveVendorTab] = useState("daily"); // "daily" | "subscription"
  const [viewMode, setViewMode] = useState("daily"); // "daily" | "subscription"

  // Data state (keeping existing logic)
  const [thaliProducts, setThaliProducts] = useState([]);
  const [thaliLoading, setThaliLoading] = useState(false);
  const [, setThaliError] = useState(null);

  const [mealPlansData, setMealPlansData] = useState(null);
  const [mealPlansLoading, setMealPlansLoading] = useState(false);
  const [mealPlansError, setMealPlansError] = useState(null);

  // Normalize backend base URL (keeping existing logic)
  const rawBackendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";
  const BACKEND_URL = useMemo(() => {
    const sanitized = String(rawBackendUrl || "").trim().replace(/^['"]|['"]$/g, "");
    return sanitized.replace(/\/$/, "");
  }, [rawBackendUrl]);

  // API Calls (keeping existing logic as it's functional)
  const fetchThaliProducts = useCallback(async () => {
    setThaliLoading(true);
    setThaliError(null);
    try {
      const apiAttempts = [
        `${BACKEND_URL}/products?category=Thali Specials&limit=100`,
        `${BACKEND_URL}/products?category=thali&limit=100`,
        `${BACKEND_URL}/products?search=thali&limit=100`,
        `${BACKEND_URL}/products?limit=100`,
      ];

      let foundProducts = [];

      for (const apiUrl of apiAttempts) {
        try {
          const response = await axios.get(apiUrl);
          const allProducts = response.data.products || response.data.data?.products || [];

          const thaliProducts = allProducts.filter((product) => {
            const categoryName = product.category?.name || "";
            if (categoryName.toLowerCase().includes("thali")) return true;

            const title = (product.title || product.name || "").toLowerCase();
            if (title.includes("thali") || title.includes("meal") || title.includes("combo")) return true;

            const description = (product.description || "").toLowerCase();
            if (description.includes("thali") || description.includes("meal")) return true;

            if (product.tags && Array.isArray(product.tags)) {
              const hasThaliTag = product.tags.some((tag) =>
                tag.toLowerCase().match(/thali|meal|food|combo|lunch|dinner/)
              );
              if (hasThaliTag) return true;
            }

            return false;
          });

          if (thaliProducts.length > 0) {
            foundProducts = thaliProducts;
            break;
          }
        } catch {
          continue;
        }
      }

      if (foundProducts.length > 0) {
        setThaliProducts(foundProducts);
      } else {
        setThaliError(
          "No thali products found in your database. Please add some products with 'thali' category or tags."
        );
        setThaliProducts([]);
      }
    } catch (error) {
      setThaliError(
        error.response?.data?.message ||
        "Failed to fetch thali products from database"
      );
      setThaliProducts([]);
    } finally {
      setThaliLoading(false);
    }
  }, [BACKEND_URL]);

  const fetchMealPlans = useCallback(async () => {
    setMealPlansLoading(true);
    setMealPlansError(null);
    try {
      const response = await axios.get(`${BACKEND_URL}/meal-plan`, {
        params: {
          limit: 50,
          status: "active",
          sortBy: "isPopular",
          sortOrder: "desc",
        },
      });
      setMealPlansData(response.data);
    } catch (error) {
      console.error("Error fetching meal plans:", error);
      setMealPlansError(error);
    } finally {
      setMealPlansLoading(false);
    }
  }, [BACKEND_URL]);


  // Effects (keeping existing logic)
  useEffect(() => {
    fetchThaliProducts();
    fetchMealPlans();
  }, [fetchThaliProducts, fetchMealPlans]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handlers (keeping existing logic as it's functional)
  const handleAddToCart = useCallback(
    async (item) => {
      if (!isAuthenticated) {
        toast.info("Please login to add items to cart");
        navigate("/login");
        return;
      }

      try {
        const defaultWeight = item.weightOptions?.[0]?.weight || "1 plate";
        await addToCart(item._id, defaultWeight, 1);
        toast.success(`Added 1 x ${item.title || item.name} to cart`);
      } catch (error) {
        console.error("Add to cart error:", error);
        toast.error("Failed to add to cart");
      }
    },
    [isAuthenticated, addToCart, navigate]
  );

  const handleRemoveFromCart = useCallback(
    async (product) => {
      if (!isAuthenticated) {
        toast.info("Please login to manage cart");
        return;
      }

      try {
        const id = product._id || product.id;

        const cartItem = cartReduxItems.find((item) => {
          if (
            item.product &&
            (item.product._id === id || item.product.id === id)
          )
            return true;
          if (item.productId === id) return true;
          if (item.id === id || item._id === id) return true;
          return false;
        });

        if (cartItem) {
          const newQuantity = cartItem.quantity - 1;
          await updateCartQuantity(id, newQuantity);
          toast.success(`Removed 1 x ${product.title || product.name} from cart`);
        } else {
          toast.error("Item not found in cart");
        }
      } catch (error) {
        console.error("Error removing from cart:", error);
        toast.error("Failed to remove from cart");
      }
    },
    [isAuthenticated, updateCartQuantity, cartReduxItems]
  );

  const handleToggleWishlist = useCallback(
    async (productOrPlan) => {
      if (!isAuthenticated) {
        toast.info("Please login to manage your wishlist");
        navigate("/login");
        return;
      }

      await toggleWishlist(productOrPlan);
    },
    [isAuthenticated, toggleWishlist, navigate]
  );

  const handleSearch = (e) => {
    e?.preventDefault();
  };
  
  const handleApplyMobileFilters = () => {
    setShowMobileFilter(false);
  };
  
  const handleResetMobileFilters = () => {
    setVegOnly(false);
    setSortBy("rating");
    setShowMobileFilter(false);
  };

  // Vendor build (products + plans) (keeping existing logic as it's functional)
  const vendors = useMemo(() => {
    const vendorMap = {};

    const ensureVendor = (id, baseData = {}) => {
      if (!vendorMap[id]) {
        vendorMap[id] = {
          id,
          name:
            baseData.name ||
            baseData.vendorName ||
            baseData.kitchenName ||
            "Home Kitchen",
          area: baseData.area || baseData.location || "",
          isPureVeg: false,
          dailyThalis: [],
          subscriptionPlans: [],
          ratingSum: 0,
          ratingCount: 0,
          minDailyPrice: null,
          minPlanPrice: null,
          thumbnail:
            baseData.thumbnail ||
            "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400",
        };
      }
      return vendorMap[id];
    };

    // From products (daily thali)
    thaliProducts?.forEach((p) => {
      const vendorId =
        p.vendor?._id || p.seller?._id || p.kitchenId || p.kitchen_id || p.brand || "default";

      const vendorName =
        p.vendor?.name || p.seller?.name || p.kitchenName || p.kitchen_name || p.brand || "Home Kitchen";

      const area = p.vendor?.area || p.seller?.area || p.location || p.city || "";

      const thumbnail = p.images?.[0]?.url || p.images?.[0] || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400";

      const v = ensureVendor(vendorId, {
        name: vendorName,
        area,
        thumbnail,
      });

      v.dailyThalis.push(p);

      const price = p.weightOptions?.[0]?.price ?? p.price ?? 0;

      if (v.minDailyPrice === null || price < v.minDailyPrice) {
        v.minDailyPrice = price;
      }

      const ratingValue = p.rating || 0;
      const reviewCount = p.reviewCount || 1;

      if (ratingValue > 0) {
        v.ratingSum += ratingValue * reviewCount;
        v.ratingCount += reviewCount;
      }

      const isVeg = p.isPureVeg || p.tags?.some((t) => t.toLowerCase().includes("veg"));
      if (isVeg) v.isPureVeg = true;
    });

    // From meal plans (subscriptions)
    const allPlans = mealPlansData?.data?.mealPlans || [];
    allPlans.forEach((plan) => {
      const vendorId =
        plan.vendor?._id || plan.kitchenId || plan.kitchen_id || plan.vendorId || "default-plan";

      const vendorName =
        plan.vendor?.name || plan.kitchenName || plan.vendorName || "Home Kitchen";

      const area = plan.vendor?.area || plan.location || "";

      const thumbnail = plan.imageUrls?.[0] || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400";

      const v = ensureVendor(vendorId, {
        name: vendorName,
        area,
        thumbnail,
      });

      v.subscriptionPlans.push(plan);

      const perDay =
        plan.pricing?.oneDay ??
        (plan.pricing?.[1]?.price / plan.pricing?.[1]?.totalthali || null);

      if (perDay) {
        if (v.minPlanPrice === null || perDay < v.minPlanPrice) {
          v.minPlanPrice = perDay;
        }
      }

      const planRating = plan.recentReviews?.average || 0;
      const planReviewCount = plan.recentReviews?.count || 1;

      if (planRating > 0) {
        v.ratingSum += planRating * planReviewCount;
        v.ratingCount += planReviewCount;
      }

      if (plan.isPureVeg) v.isPureVeg = true;
    });

    // Merge vendors by normalized name + area to avoid duplicates
    const normalize = (s) => (s || "").trim().toLowerCase();
    const vendorArray = Object.values(vendorMap);
    const grouped = {};

    vendorArray.forEach((v) => {
      const key = `${normalize(v.name)}|${normalize(v.area)}`;
      if (!grouped[key]) {
        grouped[key] = {
          // Use key as id to keep selection stable across merged entries
          id: key,
          name: v.name,
          area: v.area,
          thumbnail: v.thumbnail,
          dailyThalis: [],
          subscriptionPlans: [],
          minDailyPrice: null,
          minPlanPrice: null,
          ratingSum: 0,
          ratingCount: 0,
          isPureVeg: false,
        };
      }

      const g = grouped[key];
      if (Array.isArray(v.dailyThalis)) g.dailyThalis.push(...v.dailyThalis);
      if (Array.isArray(v.subscriptionPlans)) g.subscriptionPlans.push(...v.subscriptionPlans);

      if (typeof v.minDailyPrice === 'number') {
        g.minDailyPrice = g.minDailyPrice === null ? v.minDailyPrice : Math.min(g.minDailyPrice, v.minDailyPrice);
      }
      if (typeof v.minPlanPrice === 'number') {
        g.minPlanPrice = g.minPlanPrice === null ? v.minPlanPrice : Math.min(g.minPlanPrice, v.minPlanPrice);
      }

      g.ratingSum += v.ratingSum || 0;
      g.ratingCount += v.ratingCount || 0;
      if (v.isPureVeg) g.isPureVeg = true;
      // Prefer first non-empty thumbnail
      if (!g.thumbnail && v.thumbnail) g.thumbnail = v.thumbnail;
    });

    let vendorList = Object.values(grouped).map((v) => {
      const averageRating = v.ratingCount > 0 ? v.ratingSum / v.ratingCount : 4.2;
      const earliestDailyPrice = v.minDailyPrice ?? Infinity;
      const earliestPlanPrice = v.minPlanPrice ?? Infinity;
      const earliestPrice = Math.min(earliestDailyPrice, earliestPlanPrice);
      return {
        ...v,
        rating: parseFloat(averageRating.toFixed(1)),
        earliestPrice: earliestPrice === Infinity ? 0 : earliestPrice,
      };
    });

    // Filtering logic
    if (vegOnly) {
      vendorList = vendorList.filter((v) => v.isPureVeg);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      vendorList = vendorList.filter((v) => {
        return (
          v.name.toLowerCase().includes(q) ||
          (v.area || "").toLowerCase().includes(q)
        );
      });
    }

    // Filter by view mode
    if (viewMode === "daily") {
      vendorList = vendorList.filter((v) => v.dailyThalis.length > 0);
    } else if (viewMode === "subscription") {
      vendorList = vendorList.filter((v) => v.subscriptionPlans.length > 0);
    }

    // Sorting logic
    vendorList.sort((a, b) => {
      switch (sortBy) {
        case "price_low":
          // Prioritize non-zero prices
          if (a.earliestPrice === 0 && b.earliestPrice !== 0) return 1;
          if (b.earliestPrice === 0 && a.earliestPrice !== 0) return -1;
          return a.earliestPrice - b.earliestPrice;
        case "price_high":
          return b.earliestPrice - a.earliestPrice;
        case "name":
          return a.name.localeCompare(b.name);
        default:
          return b.rating - a.rating; // Default to rating
      }
    });

    return vendorList;
  }, [thaliProducts, mealPlansData, vegOnly, searchQuery, sortBy, viewMode]);

  // Aggregate selected vendor by name to merge dailyThalis and subscriptionPlans
  const selectedVendor = useMemo(() => {
    if (!selectedVendorId) return null;
    const primary = vendors.find((v) => v.id === selectedVendorId);
    if (!primary) return null;

    const normalize = (name) => (name || "").trim().toLowerCase();
    const key = normalize(primary.name);

    // Merge entries that share the same vendor name (handles vendorId vs kitchenId mismatches)
    const group = vendors.filter((v) => normalize(v.name) === key);

    const merged = {
      ...primary,
      dailyThalis: [],
      subscriptionPlans: [],
    };

    group.forEach((v) => {
      if (Array.isArray(v.dailyThalis)) merged.dailyThalis.push(...v.dailyThalis);
      if (Array.isArray(v.subscriptionPlans)) merged.subscriptionPlans.push(...v.subscriptionPlans);
    });

    // De-duplicate by id
    const uniqById = (arr, getId) => {
      const seen = new Set();
      return arr.filter((item) => {
        const id = getId(item);
        if (!id) return true;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      });
    };

    merged.dailyThalis = uniqById(merged.dailyThalis, (p) => p?._id || p?.id);
    merged.subscriptionPlans = uniqById(merged.subscriptionPlans, (p) => p?._id || p?.id);

    return merged;
  }, [vendors, selectedVendorId]);
  
  const inVendorDetail = !!selectedVendor;

  // ----------------------------------------------------------------------
  // REUSABLE COMPONENTS (Polished for Best UI)
  // ----------------------------------------------------------------------

  const ProductCard = ({ product }) => {
    const cartItem = cartReduxItems.find((item) => {
      const id = product._id;
      if (item.product && (item.product._id === id || item.product.id === id)) return true;
      if (item.productId === id) return true;
      if (item.id === id || item._id === id) return false; // Should not happen for products
      return false;
    });

    const cartQuantity = cartItem ? cartItem.quantity : 0;
    const defaultWeight = product.weightOptions?.[0];
    const imageSrc =
      product.images?.[0]?.url ||
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400";
    const isWishlisted = getHeartIconProps(product._id).icon.includes("fill");

    return (
      <div
        className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-xl flex flex-col cursor-pointer"
        onClick={() => navigate(`/products/${product._id}`)}
      >
        <div className="relative bg-slate-50 aspect-[4/3] overflow-hidden">
          <img
            src={imageSrc}
            alt={product.title || product.name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400"; }}
          />
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleWishlist(product);
            }}
            className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center bg-white/90 backdrop-blur-sm shadow-md transition-colors border border-slate-100"
          >
            <Heart
              className={`w-4 h-4 transition-colors ${isWishlisted ? 'text-red-500 fill-red-500' : 'text-slate-500'}`}
            />
          </button>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <h4 className="font-extrabold text-slate-900 text-base line-clamp-2 mb-1">
            {product.title || product.name}
          </h4>

          {/* Rating/Delivery */}
          <div className="flex items-center justify-between gap-2 mb-2">
            {product.rating > 0 ? (
                <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                    <span className="text-sm font-bold text-slate-700">
                        {product.rating.toFixed(1)} <span className="text-slate-400 font-medium text-xs">({product.reviewCount || 0})</span>
                    </span>
                </div>
            ) : (
                <span className="text-sm text-slate-500">New Item!</span>
            )}
            <span className="text-sm text-slate-500 flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full">
                <Clock className="w-3.5 h-3.5" /> 
                {product.deliveryTime || "40 min"}
            </span>
          </div>

          {/* Price & Weight */}
          <div className="flex items-center justify-between mt-auto mb-3 border-t pt-3">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-extrabold text-emerald-600">
                ₹{defaultWeight?.price || product.price}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-slate-400 line-through font-medium">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>
            <span className="text-sm font-medium text-slate-500">
              {defaultWeight?.weight || "1 serving"}
            </span>
          </div>

          {/* Add / Qty Control */}
          <div>
            {cartQuantity > 0 ? (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-300 rounded-xl p-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFromCart(product);
                  }}
                  className="w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:bg-emerald-100 shadow-sm transition-colors"
                >
                  <Minus className="w-4 h-4 text-emerald-600" />
                </button>
                <span className="font-bold text-emerald-700 text-base min-w-[20px] text-center">
                  {cartQuantity}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToCart(product);
                  }}
                  className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-700 shadow-sm transition-colors"
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToCart(product);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white text-base font-bold transition-colors shadow-md"
              >
                Add to Cart
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  const PlanCard = ({ plan }) => {
    const planId = plan._id || plan.id;
    const perDay =
      plan.pricing?.oneDay ??
      (plan.pricing?.[1]?.price / plan.pricing?.[1]?.totalthali || 0);

    const mainImage = plan.imageUrls?.[0] || "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400";
    const features = plan.features || [];
    const rating = plan.recentReviews?.average || null;

    const isWishlisted = wishlistItems?.some((item) => {
      const id = planId;
      if (item?._id === id || item?.id === id) return true;
      if (item?.product && (item.product._id === id || item.product.id === id)) return true;
      return false;
    });

    return (
      <div
        className="bg-white rounded-xl shadow-lg border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-emerald-300 cursor-pointer flex flex-col sm:flex-row"
        onClick={() => navigate(`/thali-detail/${planId}`)}
      >
        <div className="relative bg-slate-50 w-full sm:w-1/3 aspect-[4/3] sm:aspect-auto sm:h-auto overflow-hidden flex-shrink-0">
          <img
            src={mainImage}
            alt={plan.title}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400"; }}
          />

          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {plan.isPopular && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-500 text-white shadow-md">
                ⭐ POPULAR
              </span>
            )}
          </div>

          <div className="absolute top-3 right-3 flex flex-col items-end gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggleWishlist(plan);
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm shadow-md transition ${
                isWishlisted
                  ? "bg-red-500 text-white"
                  : "bg-white/90 text-slate-600 hover:bg-red-500 hover:text-white"
              } border border-slate-100`}
            >
              <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-red-500' : ''}`} />
            </button>
            {rating && (
              <div className="px-3 py-1 rounded-full bg-black/60 backdrop-blur-sm text-sm text-white flex items-center gap-1 font-bold">
                <Star className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>{rating.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-extrabold text-lg text-slate-900 line-clamp-2 mb-1">
            {plan.title}
          </h3>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-2 text-sm text-slate-600 font-medium">
            <span className="flex items-center gap-1">
              <Utensils className="w-4 h-4 text-emerald-600" />
              {plan.mealsPerDay || "2 meals"} / day
            </span>
            {plan.durationInDays && (
              <span className="flex items-center gap-1">
                <CalendarCheck className="w-4 h-4 text-emerald-600" />
                {plan.durationInDays} days minimum
              </span>
            )}
          </div>

          {/* Features */}
          {features.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {features.slice(0, 3).map((f, idx) => (
                <span
                  key={idx}
                  className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 font-medium"
                >
                  {f}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between mt-auto border-t pt-3">
            <div>
              <p className="text-xs text-slate-500 mb-0.5 font-medium">
                Average price per day
              </p>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-extrabold text-emerald-600">
                  ₹{perDay.toFixed(0) || 65}
                </span>
                <span className="text-sm text-slate-500 font-medium">/ day</span>
              </div>
            </div>
            
            {/* Action Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/thali-detail/${planId}`);
              }}
              className="py-2.5 px-6 rounded-xl bg-slate-900 text-white text-base font-bold hover:bg-slate-800 transition-colors flex items-center gap-1 shadow-lg"
            >
              View Plan
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Refactored Vendor List Item (Best UI for Restaurant/Kitchen Listing)
  const VendorListItem = ({ v }) => {
    const onlyDaily = v.dailyThalis.length > 0 && v.subscriptionPlans.length === 0;
    const onlyPlans = v.subscriptionPlans.length > 0 && v.dailyThalis.length === 0;
    const both = v.dailyThalis.length > 0 && v.subscriptionPlans.length > 0;

    const showPrice = v.earliestPrice;

    const isCurrentlySelected = v.id === selectedVendorId;

    // FIX: Determine which tab to open based on availability, prioritizing viewMode if possible
    const determineInitialTab = () => {
        if (v.dailyThalis.length > 0 && viewMode === 'daily') return 'daily';
        if (v.subscriptionPlans.length > 0 && viewMode === 'subscription') return 'subscription';
        if (v.dailyThalis.length > 0) return 'daily';
        if (v.subscriptionPlans.length > 0) return 'subscription';
        return 'daily'; // Default fallback
    };


    return (
      <button
        key={v.id}
        onClick={() => {
          setSelectedVendorId(v.id);
          setActiveVendorTab(determineInitialTab()); // Use the corrected logic here
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        className={`w-full bg-white rounded-xl shadow-lg border transition-all flex gap-4 p-4 items-center group ${
          isCurrentlySelected 
            ? "border-emerald-500 ring-4 ring-emerald-100" 
            : "border-slate-200 hover:border-slate-300 hover:shadow-xl"
        }`}
      >
        {/* left: image */}
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100 shadow-md">
          <img
            src={v.thumbnail}
            alt={v.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400"; }}
          />
          {v.isPureVeg && (
            <span className="absolute bottom-1 right-1 bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow">
              Veg
            </span>
          )}
        </div>

        {/* right: info */}
        <div className="flex-1 min-w-0 flex flex-col text-left h-full justify-between">
          <div>
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 truncate pr-4">
                {v.name}
              </h3>
              {v.rating > 0 && (
                <div className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1 rounded-full flex-shrink-0 shadow-md">
                  <Star className="w-4 h-4 fill-white" />
                  <span className="text-sm font-bold">
                    {v.rating.toFixed(1)}
                  </span>
                </div>
              )}
            </div>

            {v.area && (
              <p className="text-sm text-slate-500 flex items-center gap-1 mb-2 truncate font-medium">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span className="truncate">{v.area}</span>
              </p>
            )}

            <p className="text-base text-slate-700 mt-2 font-bold">
              Starting from <span className="text-emerald-600">₹{showPrice}</span>
              {viewMode === "daily" ? ' / plate' : ' / day'}
            </p>
          </div>

          <div className="mt-3 flex items-center justify-between border-t pt-3">
            <div className="flex flex-wrap gap-2">
                {v.dailyThalis.length > 0 && (
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                        <Utensils className="w-3 h-3" />
                        Daily Tiffin
                    </span>
                )}
                {v.subscriptionPlans.length > 0 && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                        <CalendarCheck className="w-3 h-3" />
                        Subscription Plans
                    </span>
                )}
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 flex-shrink-0 group-hover:text-emerald-600 transition-colors" />
          </div>
        </div>
      </button>
    );
  };
  
  const VendorList = () => {
    if (thaliLoading || mealPlansLoading) {
      return (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-4 flex gap-4 animate-pulse border border-slate-100 shadow-lg"
            >
              <div className="w-32 h-32 bg-slate-200 rounded-lg" />
              <div className="flex-1 space-y-3 py-1">
                <div className="h-5 bg-slate-200 rounded w-3/4" />
                <div className="h-3 bg-slate-200 rounded w-1/3" />
                <div className="h-4 bg-slate-200 rounded w-2/3" />
                <div className="h-3 bg-slate-200 rounded w-1/4 mt-4" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (!vendors.length) {
      return (
        <div className="text-center py-16 bg-white rounded-xl shadow-lg border border-slate-200">
          <div className="text-5xl mb-3">😔</div>
          <h3 className="text-xl font-extrabold text-slate-900 mb-2">
            No Home Kitchens Found
          </h3>
          <p className="text-sm text-slate-500 px-4">
            Try adjusting your filters, searching a different area, or switching the view mode.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {vendors.map((v) => (
          <VendorListItem key={v.id} v={v} />
        ))}
      </div>
    );
  };

  const VendorDetail = () => {
    if (!selectedVendor) return null;

    const dailyList = selectedVendor.dailyThalis || [];
    const plansList = selectedVendor.subscriptionPlans || [];

    return (
      <div className="space-y-6">
        {/* Vendor Header Card (Banner Style) */}
        <div className="bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200">
          <div className="relative h-40 sm:h-56 bg-slate-100">
            <img
              src={selectedVendor.thumbnail}
              alt={selectedVendor.name}
              className="w-full h-full object-cover opacity-90"
              onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400"; }}
            />
            
            {/* Back Button */}
            <button
              onClick={() => { setSelectedVendorId(null); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className="absolute top-4 left-4 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors shadow-lg z-10"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            {/* Rating Overlay */}
            {selectedVendor.rating > 0 && (
              <div className="absolute bottom-4 right-4 bg-white text-emerald-600 text-base font-bold px-4 py-2 rounded-xl flex items-center gap-1 shadow-lg">
                <Star className="w-4 h-4 fill-emerald-500 text-emerald-500" />
                <span>{selectedVendor.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <div className="p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 mb-1">
              <h2 className="font-extrabold text-2xl sm:text-3xl text-slate-900">
                {selectedVendor.name}
              </h2>
              {selectedVendor.isPureVeg && (
                <span className="text-sm bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full font-bold flex items-center gap-1 flex-shrink-0">
                  <Shield className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                  Pure Veg
                </span>
              )}
            </div>
            {selectedVendor.area && (
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>Serving in: {selectedVendor.area}</span>
              </p>
            )}
          </div>
        </div>

        {/* Tabs for Daily / Plans */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-2 flex gap-2 sticky top-[95px] z-20">
          <button
            onClick={() => setActiveVendorTab("daily")}
            disabled={!dailyList.length}
            className={`flex-1 py-2.5 rounded-lg text-base font-bold transition-colors ${
              activeVendorTab === "daily"
                ? "bg-emerald-600 text-white shadow-md"
                : dailyList.length 
                  ? "text-slate-700 hover:bg-slate-50"
                  : "text-slate-400 cursor-not-allowed bg-slate-100"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
                <Utensils className="w-4 h-4" />
                Daily Tiffin ({dailyList.length})
            </span>
          </button>
          <button
            onClick={() => setActiveVendorTab("subscription")}
            disabled={!plansList.length}
            className={`flex-1 py-2.5 rounded-lg text-base font-bold transition-colors ${
              activeVendorTab === "subscription"
                ? "bg-emerald-600 text-white shadow-md"
                : plansList.length
                  ? "text-slate-700 hover:bg-slate-50"
                  : "text-slate-400 cursor-not-allowed bg-slate-100"
            }`}
          >
            <span className="flex items-center justify-center gap-2">
                <CalendarCheck className="w-4 h-4" />
                Subscription Plans ({plansList.length})
            </span>
          </button>
        </div>

        {/* Content based on Active Tab */}
        {activeVendorTab === "daily" ? (
          dailyList.length ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {dailyList.map((p) => (
                <ProductCard key={p._id} product={p} />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-base text-slate-600 shadow-md">
              <div className="text-5xl mb-3">🍜</div>
              <p className="font-semibold">
                Daily Tiffin is currently **unavailable** from **{selectedVendor.name}**.
              </p>
              {plansList.length > 0 && (
                <button 
                  onClick={() => setActiveVendorTab("subscription")}
                  className="mt-4 block mx-auto text-emerald-600 font-bold hover:text-emerald-700 underline"
                >
                  Click here to view their Subscription Plans
                </button>
              )}
            </div>
          )
        ) : plansList.length ? (
          <div className="grid grid-cols-1 gap-4">
            {plansList.map((plan) => (
              <PlanCard key={plan._id || plan.id} plan={plan} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-base text-slate-600 shadow-md">
            <div className="text-5xl mb-3">📆</div>
            <p className="font-semibold">
                Subscription Plans are currently **unavailable** from **{selectedVendor.name}**.
            </p>
            {dailyList.length > 0 && (
              <button
                onClick={() => setActiveVendorTab("daily")}
                className="mt-4 block mx-auto text-emerald-600 font-bold hover:text-emerald-700 underline"
              >
                Click here to view their Daily Tiffin options
              </button>
            )}
          </div>
        )}
      </div>
    );
  };
  
  // ----------------------------------------------------------------------
  // MAIN JSX STRUCTURE
  // ----------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header (Polished) */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? "bg-white/95 backdrop-blur-md shadow-lg" : "bg-white"
        } border-b border-slate-100`}
      >
        <div className="max-w-6xl mx-auto px-4 lg:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left: Back/Logo/Title */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
                <div>
                  <h1 className="text-xl font-extrabold text-slate-900">
                    Ghar Ka Khana
                  </h1>
                  <p className="hidden sm:block text-xs text-slate-500 leading-none">
                    Freshly Cooked Tiffin & Simple Plans
                  </p>
                </div>
              </div>
            </div>

            {/* Center: Search (Desktop only) */}
            <form
              onSubmit={handleSearch}
              className="hidden md:block flex-1 max-w-lg mx-8"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search kitchens, tiffins, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm font-medium shadow-inner"
                />
              </div>
            </form>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setVegOnly((prev) => !prev)}
                className={`hidden md:inline-flex items-center px-3 py-2 rounded-xl text-sm font-bold border transition-colors ${
                  vegOnly
                    ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full mr-1.5 ${
                    vegOnly ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                />
                Veg Only
              </button>

              <button
                onClick={() => navigate("/wishlist")}
                className="relative p-2.5 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Heart className="w-5 h-5 text-slate-600" />
                {wishlistItems?.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                    {wishlistItems.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => navigate("/cart")}
                className="relative p-2.5 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-slate-600" />
                {cartReduxCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                    {cartReduxCount}
                  </span>
                )}
              </button>
              
              <button
                onClick={() => setShowMobileMenu(true)}
                className="md:hidden p-2.5 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Menu className="w-5 h-5 text-slate-600" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search/Filter Bar (Second Header Row) */}
        <div className="md:hidden px-4 pb-3 pt-1 border-t border-slate-100">
          <div className="flex gap-2">
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search kitchens, tiffins, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-sm shadow-inner"
                />
              </div>
            </form>
            <button
              onClick={() => setShowMobileFilter(true)}
              className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center shadow-sm"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="pt-[115px] md:pt-[90px] pb-12">
        <section className="max-w-6xl mx-auto px-4 lg:px-6 space-y-6">
          {/* Main Filter / View Mode Bar (Desktop/Tablet) */}
          <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-md hidden sm:flex items-center justify-between gap-4">
            {/* View Mode Toggle */}
            <div className="bg-slate-100 rounded-lg p-1 flex gap-1 flex-1 max-w-sm">
              <button
                onClick={() => { setViewMode("daily"); setSelectedVendorId(null); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                  viewMode === "daily"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-700 hover:bg-white"
                }`}
              >
                Daily Tiffin
              </button>
              <button
                onClick={() => { setViewMode("subscription"); setSelectedVendorId(null); }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                  viewMode === "subscription"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-700 hover:bg-white"
                }`}
              >
                Subscription Plans
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-sm font-semibold bg-white focus:ring-1 focus:ring-emerald-500"
              >
                <option value="rating">Best Rated</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
            
            {/* Results Count */}
            <span className="text-sm font-bold text-slate-700 ml-auto flex-shrink-0">
               {vendors.length} Kitchens Found
            </span>
          </div>

          {/* Simple Visual Strip (Polished) */}
          {!inVendorDetail && (
            <div className="flex gap-4 overflow-x-auto pb-1 hide-scrollbar">
              <div className="min-w-[250px] h-32 rounded-xl overflow-hidden bg-emerald-600 flex-shrink-0 shadow-lg p-4 flex flex-col justify-end text-white">
                <CalendarCheck className="w-6 h-6 mb-1" />
                <p className="text-lg font-extrabold leading-none">Monthly Plans</p>
                <p className="text-xs font-medium opacity-80">Start from ₹65/day</p>
              </div>
              <div className="min-w-[250px] h-32 rounded-xl overflow-hidden bg-white flex-shrink-0 shadow-lg p-4 flex flex-col justify-end border border-slate-200">
                <Utensils className="w-6 h-6 mb-1 text-slate-800" />
                <p className="text-lg font-extrabold leading-none text-slate-800">Daily Tiffins</p>
                <p className="text-xs font-medium text-slate-500">Order anytime, quick delivery</p>
              </div>
              <div className="min-w-[250px] h-32 rounded-xl overflow-hidden bg-amber-500 flex-shrink-0 shadow-lg p-4 flex flex-col justify-end text-white">
                <Shield className="w-6 h-6 mb-1 fill-white" />
                <p className="text-lg font-extrabold leading-none">100% Pure Veg</p>
                <p className="text-xs font-medium opacity-80">Trusted Home Kitchens</p>
              </div>
            </div>
          )}

          {/* Vendor list vs detail */}
          {!inVendorDetail ? <VendorList /> : <VendorDetail />}
        </section>
      </main>

      {/* Mobile Menu (Modal) - Keeping clean previous design */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black/50 z-50 md:hidden animate-fade-in">
          <div className="bg-white w-full max-w-xs h-full ml-auto shadow-2xl overflow-y-auto animate-slide-in-right">
            <div className="p-4 bg-emerald-600 text-white flex items-center justify-between sticky top-0 z-10">
              <h2 className="text-lg font-bold">Navigation</h2>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2 hover:bg-white/20 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Summary */}
            {cartReduxCount > 0 && (
              <div className="p-4 bg-emerald-50 border-b border-emerald-100">
                <button
                  onClick={() => { navigate("/cart"); setShowMobileMenu(false); }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 shadow-md"
                >
                  <ShoppingCart className="w-4 h-4" />
                  View Cart <span className="text-xs ml-1">({cartReduxCount} items)</span>
                </button>
              </div>
            )}

            {/* Links */}
            <div className="p-4 space-y-1">
              {[
                { label: "Home", path: "/" },
                { label: "My Orders", path: "/orders" },
                { label: "Wishlist", path: "/wishlist" },
                { label: "Profile", path: "/profile" },
                { label: "Support", path: "/support" },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => { navigate(item.path); setShowMobileMenu(false); }}
                  className="w-full flex items-center justify-between p-3 rounded-lg text-base text-slate-800 font-medium hover:bg-slate-50 transition-colors"
                >
                  <span>{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Filter Modal - Keeping clean previous design */}
      {showMobileFilter && (
        <div className="fixed inset-0 bg-black/50 z-50 sm:hidden animate-fade-in">
          <div className="bg-white w-full h-1/2 mt-auto rounded-t-2xl shadow-2xl overflow-y-auto animate-slide-in-up">
            <div className="p-4 border-b flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-slate-900">Filters & Sort</h2>
              <button onClick={() => setShowMobileFilter(false)} className="p-2 rounded-full hover:bg-slate-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-6">
              {/* View Mode */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">View Mode</h3>
                <div className="bg-slate-100 rounded-xl p-1 flex gap-1">
                  <button
                    onClick={() => setViewMode("daily")}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                      viewMode === "daily" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-700"
                    }`}
                  >
                    Daily Tiffin
                  </button>
                  <button
                    onClick={() => setViewMode("subscription")}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                      viewMode === "subscription" ? "bg-emerald-600 text-white shadow-sm" : "text-slate-700"
                    }`}
                  >
                    Plans
                  </button>
                </div>
              </div>

              {/* Veg Only */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Dietary Preference</h3>
                <button
                  onClick={() => setVegOnly((prev) => !prev)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl text-sm font-bold border transition-colors ${
                    vegOnly
                      ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                      : "border-slate-300 text-slate-800 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Pure Vegetarian Only
                  </span>
                  <span className={`w-4 h-4 rounded-full border-2 transition-all ${vegOnly ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300'}`}></span>
                </button>
              </div>

              {/* Sort By */}
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-3 border border-slate-300 rounded-xl text-sm font-medium bg-white focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="rating">Best Rated</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 flex gap-3 border-t sticky bottom-0 bg-white shadow-top">
              <button
                onClick={handleResetMobileFilters}
                className="flex-1 py-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Reset
              </button>
              <button
                onClick={handleApplyMobileFilters}
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white text-sm font-bold transition-colors shadow-md"
              >
                Apply Filters ({vendors.length} Results)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tailwind and Custom CSS */}
      <style>{`
        .line-clamp-1 { display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .animate-slide-in-right { animation: slideInRight 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-slide-in-up { animation: slideInUp 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes slideInUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .shadow-top { box-shadow: 0 -4px 6px -1px rgba(0, 0, 0, 0.05), 0 -2px 4px -2px rgba(0, 0, 0, 0.05); }
      `}</style>
    </div>
  );
};

export default GharKaBhojanMainPage;
