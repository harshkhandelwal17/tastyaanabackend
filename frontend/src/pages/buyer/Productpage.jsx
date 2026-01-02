import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCart, addToCartAPI } from "../../redux/cartSlice";
import {
  fetchWishlist,
  addToWishlistAPI,
  removeFromWishlistAPI,
} from "../../redux/wishlistSlice";
import { useOptimizedWishlist } from "../../hooks/useOptimizedWishlist";
import { useOptimizedCart } from "../../hooks/useOptimizedCart";
import ProductCard from "../../components/buyer/ProductCart";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter,
  Grid,
  List,
  Search,
  SlidersHorizontal,
  X,
  ChevronDown,
  Menu,
  Check,
  Star,
  Heart,
  ShoppingCart,
  Plus,
  Minus,
  Clock,
  MapPin,
  Zap,
  ArrowRight,
  Grid3X3,
  User,
  Flame,
  TrendingUp,
  Award,
  Eye,
} from "lucide-react";
import {
  fetchProducts,
  selectError,
  selectLoading,
  selectProducts,
} from "../../redux/productsSlice";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

const ProductsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux state
  const products = useSelector(selectProducts);
  const cart = useSelector((state) => state.cart.items || []);
  const wishlist = useSelector((state) => state.wishlist.items || []);
  const loading = useSelector(selectLoading);
  const error = useSelector(selectError);
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
    count: wishlistCount,
    checkWishlistStatus,
    toggleWishlist,
    getHeartIconProps,
  } = useOptimizedWishlist();

  // State management
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [collegeName, setCollegeName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [filters, setFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    sortBy: "newest",
    inStock: false,
    featured: false,
  });

  // Dynamic categories from products with fallback
  const getProductCategories = () => {
    try {
      if (!Array.isArray(products) || products.length === 0) {
        // Fallback categories if no products
        return [
          { value: "", label: "All Categories" },
          { value: "Sweet", label: "Sweets" },
          { value: "Savory", label: "Savory" },
          { value: "Traditional", label: "Traditional" },
          { value: "Premium", label: "Premium" },
        ];
      }

      const uniqueCategories = [
        ...new Set(
          products
            .map((product) => product?.category)
            .filter(
              (category) =>
                category &&
                typeof category === "string" &&
                category.trim() !== ""
            )
        ),
      ];

      if (uniqueCategories.length === 0) {
        // If no valid categories found, return fallback
        return [
          { value: "", label: "All Categories" },
          { value: "General", label: "General" },
        ];
      }

      return [
        { value: "", label: "All Categories" },
        ...uniqueCategories.map((category) => {
          const categoryStr = String(category).trim();
          return {
            value: category,
            label: categoryStr.charAt(0).toUpperCase() + categoryStr.slice(1),
          };
        }),
      ];
    } catch (error) {
      console.error("Error generating categories:", error);
      // Return fallback categories on error
      return [
        { value: "", label: "All Categories" },
        { value: "Sweet", label: "Sweets" },
        { value: "Savory", label: "Savory" },
        { value: "Traditional", label: "Traditional" },
        { value: "Premium", label: "Premium" },
      ];
    }
  };

  const categories = getProductCategories();

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "popular", label: "Most Popular" },
    { value: "rating", label: "Highest Rated" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name", label: "Name A-Z" },
  ];

  // Effects
  useEffect(() => {
    // Fetch products with better parameters
    dispatch(
      fetchProducts({
        limit: 50,
        sortBy: "createdAt",
        sortOrder: "desc",
        status: "active",
      })
    );

    // Only fetch cart and wishlist if user is authenticated
    if (isAuthenticated && userInfo) {
      dispatch(fetchCart());
      dispatch(fetchWishlist());
    }
  }, [dispatch, isAuthenticated, userInfo]);

  // Debug products structure
  useEffect(() => {
    if (products && products.length > 0) {
      console.log("Products sample for debugging:", products.slice(0, 2));
      console.log(
        "Categories found:",
        products.map((p) => p?.category).filter(Boolean)
      );
    }
  }, [products]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Optimized add to cart function
  const handleAddToCart = async (productId) => {
    const product = products.find(
      (p) => p.id === productId || p._id === productId
    );

    if (!product) {
      toast.error("Product not found");
      return;
    }

    // Check if this is a college-branded product
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

  // Using optimized wishlist hook - no need for separate toggleWishlist function

  // Filter and sort products
  const getFilteredAndSortedProducts = () => {
    let filtered = [...products];

    // Search filter - using debounced search term
    if (debouncedSearchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.name
            ?.toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          product.description
            ?.toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase()) ||
          product.tags?.some((tag) =>
            tag.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          )
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter((product) => {
        const productCategory = product?.category;
        return (
          productCategory &&
          String(productCategory).trim() === String(filters.category).trim()
        );
      });
    }

    // Price range filter - Handle both weightOptions and direct price
    if (filters.minPrice) {
      filtered = filtered.filter((product) => {
        if (product.weightOptions && product.weightOptions.length > 0) {
          const minProductPrice = Math.min(
            ...product.weightOptions.map((option) => option.price)
          );
          return minProductPrice >= parseFloat(filters.minPrice);
        } else {
          return (product.price || 0) >= parseFloat(filters.minPrice);
        }
      });
    }

    if (filters.maxPrice) {
      filtered = filtered.filter((product) => {
        if (product.weightOptions && product.weightOptions.length > 0) {
          const maxProductPrice = Math.max(
            ...product.weightOptions.map((option) => option.price)
          );
          return maxProductPrice <= parseFloat(filters.maxPrice);
        } else {
          return (product.price || 0) <= parseFloat(filters.maxPrice);
        }
      });
    }

    // Stock filter - Better stock checking logic
    if (filters.inStock) {
      filtered = filtered.filter((product) => {
        const stockQty =
          product.stockQty ||
          product.weightOptions?.[0]?.stock ||
          product.stock ||
          product.quantity ||
          (product.isAvailable !== false ? 100 : 0);
        return stockQty > 0 && product.isAvailable !== false;
      });
    }

    // Featured filter
    if (filters.featured) {
      filtered = filtered.filter((product) => product.featured);
    }

    // Sorting
    switch (filters.sortBy) {
      case "newest":
        filtered.sort(
          (a, b) =>
            new Date(b.createdAt || b.updatedAt || new Date()) -
            new Date(a.createdAt || a.updatedAt || new Date())
        );
        break;
      case "popular":
        filtered.sort(
          (a, b) =>
            (b.soldCount || b.orders || 0) - (a.soldCount || a.orders || 0)
        );
        break;
      case "rating":
        filtered.sort((a, b) => {
          const aRating = a.rating?.average || a.rating || 0;
          const bRating = b.rating?.average || b.rating || 0;
          return bRating - aRating;
        });
        break;
      case "price-low":
        filtered.sort((a, b) => {
          const aPrice =
            a.weightOptions && a.weightOptions.length > 0
              ? Math.min(...a.weightOptions.map((opt) => opt.price))
              : a.price || 0;
          const bPrice =
            b.weightOptions && b.weightOptions.length > 0
              ? Math.min(...b.weightOptions.map((opt) => opt.price))
              : b.price || 0;
          return aPrice - bPrice;
        });
        break;
      case "price-high":
        filtered.sort((a, b) => {
          const aPrice =
            a.weightOptions && a.weightOptions.length > 0
              ? Math.max(...a.weightOptions.map((opt) => opt.price))
              : a.price || 0;
          const bPrice =
            b.weightOptions && b.weightOptions.length > 0
              ? Math.max(...b.weightOptions.map((opt) => opt.price))
              : b.price || 0;
          return bPrice - aPrice;
        });
        break;
      case "name":
        filtered.sort((a, b) => {
          const aName = String(a?.name || "").trim();
          const bName = String(b?.name || "").trim();
          return aName.localeCompare(bName);
        });
        break;
      default:
        break;
    }

    return filtered;
  };

  const filteredProducts = getFilteredAndSortedProducts();

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      category: "",
      minPrice: "",
      maxPrice: "",
      sortBy: "newest",
      inStock: false,
      featured: false,
    });
    setSearchTerm("");
    setDebouncedSearchTerm("");
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    if (searchTerm.trim()) {
      // Search is handled by the filter function
    }
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

        // Force refresh cart data to ensure UI updates
        setTimeout(() => {
          if (userInfo && userInfo.id) {
            dispatch(fetchCart(userInfo.id));
          }
        }, 100);
      } else {
        throw new Error(result.payload || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Failed to add college item to cart:", error);
      toast.error("Failed to add to cart. Please try again.");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header placeholder */}
        <div className="bg-white shadow-lg">
          <div className="px-4 py-6">
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-4"></div>
            <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-emerald-700 font-medium text-lg">
              Loading products...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Unable to Load Products
          </h2>
          <p className="text-gray-600 mb-6">
            {error ||
              "Something went wrong while loading products. Please check your internet connection and try again."}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                dispatch(
                  fetchProducts({
                    limit: 50,
                    sortBy: "createdAt",
                    sortOrder: "desc",
                    status: "active",
                  })
                );
              }}
              className="w-full bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors font-medium"
            >
              Retry Loading
            </button>
            <button
              onClick={() => navigate("/")}
              className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition-colors font-medium"
            >
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!products || products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-lg sticky top-0 z-40">
          <div className="px-4 py-4">
            <h1 className="text-2xl font-bold text-gray-800 mb-3">Products</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </header>

        <div className="flex items-center justify-center py-20">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">🛍️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              No Products Available
            </h2>
            <p className="text-gray-600 mb-6">
              We're currently updating our inventory. Please check back later
              for our amazing products, or try refreshing the page.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  dispatch(
                    fetchProducts({
                      limit: 50,
                      sortBy: "createdAt",
                      sortOrder: "desc",
                      status: "active",
                    })
                  );
                }}
                className="w-full bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors font-medium"
              >
                Refresh Products
              </button>
              <button
                onClick={() => navigate("/")}
                className="w-full bg-gray-200 text-gray-700 px-6 py-3 rounded-xl hover:bg-gray-300 transition-colors font-medium"
              >
                Go to Homepage
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isScrolled ? "bg-white shadow-xl" : "bg-white shadow-lg"
        }`}
      >
        {/* Top Promotional Bar - Matching homepage design */}
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
          {/* Desktop Header */}
          <div className="hidden lg:flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Tastyaana</h1>
                <p className="text-xs text-emerald-600 font-medium">
                  Fast & Fresh
                </p>
              </div>
            </div>

            {/* Desktop Search */}
            <form onSubmit={handleSearch} className="relative flex-1 max-w-2xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for products, brands, and more..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-500 focus:bg-white transition-all duration-300"
              />
            </form>

            {/* Desktop Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/wishlist")}
                className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Heart className="w-5 h-5 text-gray-600" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => navigate("/cart")}
                className="relative p-2.5 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                {cartReduxCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold">
                    {cartReduxCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="lg:hidden">
            <div className="flex items-center gap-3 mb-3">
              <button
                onClick={() => navigate("/")}
                className="p-2 hover:bg-gray-100 rounded-xl"
              >
                <ArrowRight className="w-5 h-5 rotate-180 text-gray-600" />
              </button>
              <h1 className="text-xl font-bold text-gray-800 flex-1">
                Products
              </h1>
              <button
                onClick={() => navigate("/wishlist")}
                className="relative p-2 hover:bg-gray-100 rounded-xl"
              >
                <Heart className="w-5 h-5 text-gray-600" />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {wishlistCount > 9 ? "9+" : wishlistCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => navigate("/cart")}
                className="relative p-2 hover:bg-gray-100 rounded-xl"
              >
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                {cartReduxCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {cartReduxCount}
                  </span>
                )}
              </button>
            </div>

            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none bg-white text-sm"
              />
            </form>

            {/* Mobile Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowMobileFilters(true)}
                  className="flex items-center space-x-1 px-3 py-2 bg-white border-2 border-gray-200 rounded-xl text-sm hover:border-emerald-300 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filters</span>
                  {Object.values(filters).some(
                    (value) => value && value !== "newest"
                  ) && (
                    <span className="bg-emerald-600 text-white text-xs px-1.5 py-0.5 rounded-full">
                      •
                    </span>
                  )}
                </button>

                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="px-3 py-2 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none bg-white text-sm"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-1 bg-white border-2 border-gray-200 rounded-xl p-0.5">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === "grid"
                      ? "bg-emerald-500 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewMode === "list"
                      ? "bg-emerald-500 text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-56 lg:pt-32 pb-8">
        <div className="px-3 sm:px-4 lg:px-6">
          {/* Desktop Filters */}
          <div className="hidden lg:block mb-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 px-4 py-2 bg-white border-2 border-gray-200 rounded-xl hover:border-emerald-300 transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Filters</span>
                  {Object.values(filters).some(
                    (value) => value && value !== "newest"
                  ) && (
                    <span className="bg-emerald-600 text-white text-xs px-2 py-1 rounded-full">
                      Active
                    </span>
                  )}
                </button>

                {(Object.values(filters).some(
                  (value) => value && value !== "newest"
                ) ||
                  debouncedSearchTerm) && (
                  <button
                    onClick={clearFilters}
                    className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <X className="w-4 h-4" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 bg-white border-2 border-gray-200 rounded-xl p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === "grid"
                        ? "bg-emerald-500 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === "list"
                        ? "bg-emerald-500 text-white"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:outline-none bg-white"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Desktop Filter Panel */}
            <AnimatePresence>
              {showFilters && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white border-2 border-gray-200 rounded-xl p-6 mb-6 shadow-lg"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Category
                      </label>
                      <select
                        value={filters.category}
                        onChange={(e) =>
                          handleFilterChange("category", e.target.value)
                        }
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                      >
                        {categories.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Min Price
                      </label>
                      <input
                        type="number"
                        value={filters.minPrice}
                        onChange={(e) =>
                          handleFilterChange("minPrice", e.target.value)
                        }
                        placeholder="₹0"
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Max Price
                      </label>
                      <input
                        type="number"
                        value={filters.maxPrice}
                        onChange={(e) =>
                          handleFilterChange("maxPrice", e.target.value)
                        }
                        placeholder="₹9999"
                        className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Availability
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.inStock}
                          onChange={(e) =>
                            handleFilterChange("inStock", e.target.checked)
                          }
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          In Stock Only
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Special
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filters.featured}
                          onChange={(e) =>
                            handleFilterChange("featured", e.target.checked)
                          }
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Featured Only
                        </span>
                      </label>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Results Summary */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-gray-700 text-sm sm:text-base">
                Showing {filteredProducts.length} of {products.length} products
              </p>
              {debouncedSearchTerm && (
                <p className="text-emerald-600 text-sm mt-1">
                  for "<strong>{debouncedSearchTerm}</strong>"
                </p>
              )}
            </div>
          </div>

          {/* Products Display */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-6">🔍</div>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                No products found
              </h3>
              <p className="text-gray-600 text-lg mb-8">
                We couldn't find any products matching your criteria.
              </p>
              <button
                onClick={clearFilters}
                className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors font-medium"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <motion.div
              layout
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 lg:gap-4"
                  : "space-y-4"
              }
            >
              <AnimatePresence>
                {filteredProducts.map((product, index) => (
                  <motion.div
                    key={product._id || product.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() =>
                      navigate(`/products/${product.id || product._id}`)
                    }
                    className={`bg-white rounded-xl cursor-pointer hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group ${
                      viewMode === "list" ? "flex" : "hover:-translate-y-1"
                    }`}
                  >
                    {viewMode === "grid" ? (
                      // Grid View - Complete Card Structure (matching homepage design)
                      <div className="flex flex-col h-full">
                        {/* Image Section */}
                        <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                          {/* Enhanced Tags */}
                          <div className="absolute top-2 left-2 z-10 space-y-1">
                            {product.featured && (
                              <span className="bg-emerald-500 text-white text-xs px-2 py-1 rounded-md font-bold shadow-lg border border-emerald-400">
                                ⭐ Featured
                              </span>
                            )}
                            {product.discount > 0 && (
                              <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-md font-bold shadow-lg border border-red-400">
                                {product.discount}% OFF
                              </span>
                            )}
                            {product.badge && (
                              <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-md font-bold shadow-lg border border-purple-400">
                                {product.badge}
                              </span>
                            )}
                            {(() => {
                              // Better stock checking logic
                              const stockQty =
                                product.stockQty ||
                                product.weightOptions?.[0]?.stock ||
                                product.stock ||
                                product.quantity ||
                                (product.isAvailable !== false ? 100 : 0); // Default to 100 if available, 0 if not

                              if (stockQty <= 5 && stockQty > 0) {
                                return (
                                  <span className="bg-yellow-500 text-white text-xs px-2 py-1 rounded-md font-bold shadow-lg border border-yellow-400">
                                    ⚠️ Low Stock
                                  </span>
                                );
                              } else if (stockQty === 0) {
                                return (
                                  <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-md font-bold shadow-lg border border-gray-400">
                                    ❌ Out of Stock
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </div>

                          {/* Enhanced Wishlist Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWishlist(product);
                            }}
                            className="absolute top-2 right-2 z-10 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center hover:bg-white transition-all shadow-lg hover:scale-110 border border-gray-200"
                          >
                            <Heart
                              className={`w-4 h-4 ${
                                getHeartIconProps(product._id || product.id)
                                  .icon
                              }`}
                            />
                          </button>

                          {/* Product Image */}
                          <img
                            src={
                              product.images?.[0]?.url ||
                              product.images?.[0] ||
                              product.image ||
                              "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=300&h=300&fit=crop&crop=center"
                            }
                            alt={
                              product.name || product.title || "Product Image"
                            }
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              if (e.target.src.includes("unsplash")) {
                                e.target.src =
                                  "https://via.placeholder.com/300x300/f3f4f6/6b7280?text=Product";
                              }
                            }}
                            loading="lazy"
                          />
                        </div>

                        {/* Product Details Section */}
                        <div className="p-3 flex-1 flex flex-col">
                          {/* Enhanced Brand */}
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-emerald-600 font-semibold uppercase tracking-wide truncate">
                              {product.brand || "Tastyaana"}
                            </p>
                            {product.isOrganic && (
                              <span className="text-xs text-green-600 font-bold">
                                🌿
                              </span>
                            )}
                          </div>

                          {/* Enhanced Product Name */}
                          <h3 className="font-bold text-sm text-gray-800 mb-2 line-clamp-2 leading-tight min-h-[2.5rem] hover:text-emerald-600 transition-colors">
                            {product.name || product.title}
                          </h3>

                          {/* Rating & Unit */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                              <Star className="w-3 h-3 fill-current text-emerald-500" />
                              <span className="text-xs font-semibold text-emerald-700">
                                {product.rating?.average ||
                                  product.rating ||
                                  4.0}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {product.weightOptions?.[0]?.weight ||
                                product.unit ||
                                "1kg"}
                            </span>
                          </div>

                          {/* Enhanced Price */}
                          {(product.weightOptions?.[0]?.price ||
                            product.price ||
                            0) > 0 ? (
                            <div className="flex items-center gap-2 mb-3">
                              <span className="font-bold text-base text-emerald-600">
                                ₹
                                {(
                                  product.weightOptions?.[0]?.price ||
                                  product.price ||
                                  0
                                ).toLocaleString("en-IN")}
                              </span>
                              {product.weightOptions?.[0]?.originalPrice &&
                                product.weightOptions[0].originalPrice >
                                  (product.weightOptions[0].price || 0) &&
                                (() => {
                                  const calculatedDiscount = Math.round(
                                    ((product.weightOptions[0].originalPrice -
                                      product.weightOptions[0].price) /
                                      product.weightOptions[0].originalPrice) *
                                      100
                                  );
                                  return calculatedDiscount > 0 ? (
                                    <>
                                      <span className="text-xs text-gray-400 line-through">
                                        ₹
                                        {product.weightOptions[0].originalPrice.toLocaleString(
                                          "en-IN"
                                        )}
                                      </span>
                                      <span className="text-xs text-emerald-600 font-semibold bg-emerald-100 px-1 py-0.5 rounded">
                                        {calculatedDiscount}% off
                                      </span>
                                    </>
                                  ) : null;
                                })()}
                            </div>
                          ) : (
                            <div className="mb-3">
                              <span className="text-sm text-gray-500 font-medium">
                                Price on request
                              </span>
                            </div>
                          )}

                          {/* Enhanced Add to Cart Button */}
                          {(() => {
                            const productId = product.id || product._id;
                            const cartItem = cartReduxItems?.find((item) => {
                              if (
                                item.id === productId ||
                                item._id === productId
                              )
                                return true;
                              if (
                                item.product &&
                                (item.product._id === productId ||
                                  item.product.id === productId)
                              )
                                return true;
                              if (item.productId === productId) return true;
                              return false;
                            });

                            const itemQuantity = cartItem
                              ? cartItem.quantity
                              : 0;

                            // Better stock checking logic - same as above
                            const stockQty =
                              product.stockQty ||
                              product.weightOptions?.[0]?.stock ||
                              product.stock ||
                              product.quantity ||
                              (product.isAvailable !== false ? 100 : 0);

                            const isOutOfStock =
                              stockQty === 0 || product.isAvailable === false;

                            return itemQuantity > 0 ? (
                              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-1.5 mb-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newQuantity = itemQuantity - 1;
                                    updateCartQuantity(productId, newQuantity);
                                  }}
                                  className="w-7 h-7 bg-white rounded-lg flex items-center justify-center border border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50 transition-all shadow-sm"
                                >
                                  <Minus className="w-3 h-3 text-emerald-600 font-bold" />
                                </button>
                                <span className="font-bold text-emerald-700 text-sm px-3 py-1 bg-white rounded border border-emerald-200">
                                  {itemQuantity}
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(productId);
                                  }}
                                  disabled={isOutOfStock}
                                  className="w-7 h-7 bg-emerald-500 hover:bg-emerald-600 rounded-lg flex items-center justify-center transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <Plus className="w-3 h-3 text-white font-bold" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToCart(productId);
                                }}
                                disabled={isOutOfStock}
                                className={`w-full py-2.5 rounded-lg font-bold text-xs transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 mb-2 ${
                                  isOutOfStock
                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                    : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white border-2 border-emerald-500 hover:border-emerald-600"
                                }`}
                              >
                                {isOutOfStock
                                  ? "❌ OUT OF STOCK"
                                  : "🛒 ADD TO CART"}
                              </button>
                            );
                          })()}

                          {/* Enhanced Delivery Info */}
                          <div className="flex items-center justify-center gap-1 text-xs text-emerald-600 bg-emerald-50 py-1 px-2 rounded-lg border border-emerald-200">
                            <Clock className="w-3 h-3" />
                            <span className="font-semibold">
                              {product.deliveryTime || "15 mins"} delivery
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // List View - Horizontal Card
                      <>
                        <div className="relative w-32 h-32 flex-shrink-0 bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
                          {/* Wishlist Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWishlist(product);
                            }}
                            className="absolute top-2 right-2 z-10 w-7 h-7 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white transition-all shadow-sm"
                          >
                            <Heart
                              className={`w-3.5 h-3.5 ${
                                getHeartIconProps(product._id || product.id)
                                  .icon
                              }`}
                            />
                          </button>

                          <img
                            src={
                              product.images?.[0]?.url ||
                              product.images?.[0] ||
                              product.image ||
                              "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=300&h=300&fit=crop&crop=center"
                            }
                            alt={
                              product.name || product.title || "Product Image"
                            }
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.target.src =
                                "https://via.placeholder.com/128x128/f3f4f6/6b7280?text=No+Image";
                            }}
                            loading="lazy"
                          />
                        </div>

                        <div className="flex-1 p-4 flex flex-col">
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <p className="text-xs text-emerald-600 font-semibold mb-1 uppercase tracking-wide">
                                  {product.brand || "Local Store"}
                                </p>
                                <h3 className="font-bold text-base text-gray-800 mb-1 line-clamp-2">
                                  {product.name || product.title}
                                </h3>
                              </div>
                              {(product.featured || product.discount > 0) && (
                                <div className="flex flex-col gap-1 ml-2">
                                  {product.featured && (
                                    <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-md font-bold">
                                      Featured
                                    </span>
                                  )}
                                  {product.discount > 0 && (
                                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-md font-bold">
                                      {product.discount}% OFF
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>

                            <div className="flex items-center gap-4 mb-3">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current text-emerald-500" />
                                <span className="text-sm font-semibold text-gray-700">
                                  {product.rating?.average ||
                                    product.rating ||
                                    4.0}
                                </span>
                                <span className="text-sm text-gray-500">
                                  ({product.reviewCount || product.reviews || 0}
                                  )
                                </span>
                              </div>
                              <span className="text-sm text-gray-500">
                                {product.weightOptions?.[0]?.weight ||
                                  product.unit ||
                                  "1kg"}
                              </span>
                            </div>

                            {(product.weightOptions?.[0]?.price ||
                              product.price ||
                              0) > 0 ? (
                              <div className="flex items-center gap-2 mb-3">
                                <span className="font-bold text-lg text-gray-800">
                                  ₹
                                  {(
                                    product.weightOptions?.[0]?.price ||
                                    product.price ||
                                    0
                                  ).toLocaleString("en-IN")}
                                </span>
                                {product.weightOptions?.[0]?.originalPrice &&
                                  product.weightOptions[0].originalPrice >
                                    (product.weightOptions[0].price || 0) &&
                                  (() => {
                                    const calculatedDiscount = Math.round(
                                      ((product.weightOptions[0].originalPrice -
                                        product.weightOptions[0].price) /
                                        product.weightOptions[0]
                                          .originalPrice) *
                                        100
                                    );
                                    return calculatedDiscount > 0 ? (
                                      <>
                                        <span className="text-sm text-gray-400 line-through">
                                          ₹
                                          {product.weightOptions[0].originalPrice.toLocaleString(
                                            "en-IN"
                                          )}
                                        </span>
                                        <span className="text-sm text-emerald-600 font-semibold">
                                          {calculatedDiscount}% off
                                        </span>
                                      </>
                                    ) : null;
                                  })()}
                              </div>
                            ) : (
                              <div className="mb-3">
                                <span className="text-sm text-gray-500 font-medium">
                                  Price on request
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span>{product.deliveryTime || "15 mins"}</span>
                            </div>

                            {(() => {
                              const productId = product.id || product._id;
                              const cartItem = cartReduxItems?.find((item) => {
                                if (
                                  item.id === productId ||
                                  item._id === productId
                                )
                                  return true;
                                if (
                                  item.product &&
                                  (item.product._id === productId ||
                                    item.product.id === productId)
                                )
                                  return true;
                                if (item.productId === productId) return true;
                                return false;
                              });

                              const itemQuantity = cartItem
                                ? cartItem.quantity
                                : 0;

                              return itemQuantity > 0 ? (
                                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const newQuantity = itemQuantity - 1;
                                      updateCartQuantity(
                                        productId,
                                        newQuantity
                                      );
                                    }}
                                    className="w-8 h-8 bg-white rounded-md flex items-center justify-center border border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50 transition-all"
                                  >
                                    <Minus className="w-4 h-4 text-emerald-600 font-bold" />
                                  </button>
                                  <span className="font-bold text-emerald-700 text-base px-3">
                                    {itemQuantity}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleAddToCart(productId);
                                    }}
                                    className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 rounded-md flex items-center justify-center transition-all"
                                  >
                                    <Plus className="w-4 h-4 text-white font-bold" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(productId);
                                  }}
                                  disabled={(product.stockQty || 0) === 0}
                                  className={`px-6 py-2 rounded-lg font-bold text-sm transition-all duration-300 shadow-sm hover:shadow-md ${
                                    (product.stockQty || 0) === 0
                                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                      : "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white"
                                  }`}
                                >
                                  {(product.stockQty || 0) === 0
                                    ? "OUT OF STOCK"
                                    : "ADD TO CART"}
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>

      {/* Mobile Filter Modal */}
      <AnimatePresence>
        {showMobileFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
            onClick={() => setShowMobileFilters(false)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-emerald-600 text-white">
                  <h2 className="text-lg font-semibold">Filters</h2>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="p-2 hover:bg-white/20 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Filter Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      Category
                    </label>
                    <select
                      value={filters.category}
                      onChange={(e) =>
                        handleFilterChange("category", e.target.value)
                      }
                      className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                    >
                      {categories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price Range */}
                  <div>
                    <label className="block text-sm font-medium text-gray-800 mb-3">
                      Price Range
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="number"
                        value={filters.minPrice}
                        onChange={(e) =>
                          handleFilterChange("minPrice", e.target.value)
                        }
                        placeholder="Min ₹"
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                      />
                      <input
                        type="number"
                        value={filters.maxPrice}
                        onChange={(e) =>
                          handleFilterChange("maxPrice", e.target.value)
                        }
                        placeholder="Max ₹"
                        className="px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className="space-y-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.inStock}
                        onChange={(e) =>
                          handleFilterChange("inStock", e.target.checked)
                        }
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        In Stock Only
                      </span>
                    </label>

                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={filters.featured}
                        onChange={(e) =>
                          handleFilterChange("featured", e.target.checked)
                        }
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        Featured Only
                      </span>
                    </label>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t p-4 space-y-3">
                  <button
                    onClick={clearFilters}
                    className="w-full py-2 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    Clear All Filters
                  </button>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="w-full py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Cart Button (Mobile) */}
      {cartReduxCount > 0 && (
        <button
          onClick={() => navigate("/cart")}
          className="fixed bottom-6 right-4 lg:hidden bg-emerald-500 text-white p-3 sm:p-4 rounded-2xl shadow-2xl hover:bg-emerald-600 transition-all z-40 animate-bounce"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
            <div className="text-left">
              <p className="text-xs font-medium">View Cart</p>
              <p className="text-sm font-bold">{cartReduxCount} items</p>
            </div>
          </div>
        </button>
      )}

      {/* College Name Modal */}
      {showCollegeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border border-gray-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                College Information Required
              </h3>
              <button
                onClick={() => {
                  setShowCollegeModal(false);
                  setCollegeName("");
                  setSelectedProduct(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <p className="text-gray-600 mb-6 leading-relaxed">
              This is a college-branded item. Please enter your college name to
              proceed:
            </p>
            <input
              type="text"
              placeholder="Enter your college name"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 mb-6 focus:outline-none focus:border-emerald-500 transition-colors"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCollegeModal(false);
                  setCollegeName("");
                  setSelectedProduct(null);
                }}
                className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCollegeSubmit}
                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-semibold"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Styles */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .scrollbar-hide {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        @keyframes bounce {
          0%,
          100% {
            transform: translateY(-25%);
            animation-timing-function: cubic-bezier(0.8, 0, 1, 1);
          }
          50% {
            transform: translateY(0);
            animation-timing-function: cubic-bezier(0, 0, 0.2, 1);
          }
        }
        .animate-bounce {
          animation: bounce 1s infinite;
        }

        /* Smooth transitions for all interactive elements */
        * {
          transition-property: color, background-color, border-color, transform,
            box-shadow;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }

        /* Enhanced hover effects */
        .group:hover .group-hover\\:scale-105 {
          transform: scale(1.05);
        }

        .group:hover .group-hover\\:-translate-y-1 {
          transform: translateY(-0.25rem);
        }
      `}</style>
    </div>
  );
};

export default ProductsPage;
