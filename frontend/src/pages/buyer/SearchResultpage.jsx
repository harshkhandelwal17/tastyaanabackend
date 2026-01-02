import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Star,
  ShoppingCart,
  Heart,
  Eye,
  CheckCircle,
  X,
  TrendingUp,
  AlertCircle,
  SlidersHorizontal,
  Grid3X3,
  List,
  Zap,
  Clock,
  Plus,
  Minus,
  ArrowLeft,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Menu,
  User,
  Home,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  addToWishlistAPI,
  removeFromWishlistAPI,
  fetchWishlist,
} from "../../redux/wishlistSlice";
import {
  addToCartAPI,
  removeFromCartAPI,
  fetchCart,
} from "../../redux/cartSlice";
import {
  searchProducts,
  fetchProducts,
  fetchCategories,
  setCategory,
  setPriceRange,
  setSortBy,
  setSearchQuery,
  applyFilters,
  clearFilters,
  selectProducts,
  selectLoading,
  selectSearchLoading,
  selectCategories,
  selectFilters,
  selectError,
  selectSearchError,
  selectPagination,
} from "../../redux/productsSlice";
import { toast } from "react-hot-toast";

// Popular search suggestions
const popularSearches = [
  "Gujiya",
  "Kaju Katli",
  "Rasgulla",
  "Gulab Jamun",
  "Laddu",
  "Jalebi",
  "Barfi",
  "Halwa",
];

// Breadcrumb Component
const Breadcrumb = ({ items = [] }) => {
  const navigate = useNavigate();

  return (
    <nav className="mb-4">
      <ol className="flex items-center space-x-2 text-sm text-gray-600">
        <li>
          <button
            onClick={() => navigate("/")}
            className="hover:text-emerald-600 transition-colors flex items-center gap-1"
          >
            <Home className="w-4 h-4" />
            Home
          </button>
        </li>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <li>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </li>
            <li>
              {item.href ? (
                <button
                  onClick={() => navigate(item.href)}
                  className="hover:text-emerald-600 transition-colors"
                >
                  {item.label}
                </button>
              ) : (
                <span className="text-gray-800 font-medium">{item.label}</span>
              )}
            </li>
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
};

// Improved Product Card Component
const ProductCard = ({ product, index = 0 }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const wishlistState = useSelector((state) => state.wishlist || {});
  const wishlist = wishlistState.items || [];
  const cartReduxItems = useSelector((state) => state.cart?.items || []);
  const authUser = useSelector((state) => state.auth?.user);

  const [selectedWeight, setSelectedWeight] = useState(
    product.weightOptions?.[0] || { weight: "500g", price: product.price || 0 }
  );
  const [addedToCart, setAddedToCart] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isInWishlist = wishlist?.items?.some(
    (item) => item._id === product._id
  );

  // Find cart item for this product
  const cartItem = cartReduxItems.find((item) => {
    if (item.id === product._id || item._id === product._id) return true;
    if (
      item.product &&
      (item.product._id === product._id || item.product.id === product._id)
    )
      return true;
    if (item.productId === product._id) return true;
    return false;
  });
  const cartQuantity = cartItem ? cartItem.quantity : 0;

  const handleAddToCart = async () => {
    if (!authUser) {
      toast.info("Please login to add items to cart");
      navigate("/login");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        productId: product._id,
        payload: { weight: selectedWeight.weight },
        quantity: 1,
      };
      await dispatch(addToCartAPI(payload)).unwrap();
      setAddedToCart(true);
      toast.success("Added to cart!");
      setTimeout(() => setAddedToCart(false), 1500);
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error("Failed to add to cart");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromCart = async () => {
    if (!authUser) {
      toast.info("Please login to manage cart");
      return;
    }

    setIsLoading(true);
    try {
      await dispatch(removeFromCartAPI({ _id: product._id })).unwrap();
      toast.success("Removed from cart!");
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast.error("Failed to remove from cart");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToWishlist = async () => {
    if (!authUser) {
      toast.info("Please login to add items to wishlist");
      navigate("/login");
      return;
    }

    setIsLoading(true);
    try {
      if (isInWishlist) {
        await dispatch(removeFromWishlistAPI(product._id)).unwrap();
        toast.success("Removed from wishlist!");
      } else {
        await dispatch(addToWishlistAPI({ _id: product._id })).unwrap();
        toast.success("Added to wishlist!");
      }
    } catch (error) {
      console.error("Wishlist error:", error);
      toast.error("Wishlist action failed");
    } finally {
      setIsLoading(false);
    }
  };

  const productImage =
    product.images?.[0]?.url ||
    product.images?.[0] ||
    product.image ||
    "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400";

  const displayPrice = selectedWeight.price || product.price || 0;

  return (
    <div
      className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden group"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {/* Product Tags */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {product.tag && (
            <span
              className={`px-2 py-1 rounded-md text-xs font-semibold text-white ${
                product.tag === "Popular"
                  ? "bg-emerald-500"
                  : product.tag === "Premium"
                  ? "bg-purple-500"
                  : product.tag === "Bestseller"
                  ? "bg-orange-500"
                  : "bg-blue-500"
              }`}
            >
              {product.tag}
            </span>
          )}
          {product.discount > 0 && (
            <span className="bg-red-500 text-white px-2 py-1 rounded-md text-xs font-semibold">
              {product.discount}% OFF
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={handleAddToWishlist}
          disabled={isLoading}
          className={`absolute top-2 right-2 p-2 rounded-full backdrop-blur-sm transition-all duration-300 z-10 ${
            isInWishlist
              ? "bg-red-500 text-white"
              : "bg-white/90 text-gray-600 hover:bg-red-500 hover:text-white"
          } ${isLoading ? "opacity-50" : ""}`}
        >
          <Heart className={`w-4 h-4 ${isInWishlist ? "fill-current" : ""}`} />
        </button>

        {/* Product Image */}
        <img
          src={productImage}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400";
          }}
        />

        {/* Quick View Button */}
        <button
          onClick={() => navigate(`/products/${product._id}`)}
          className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm text-gray-800 px-3 py-1.5 rounded-full font-medium text-xs transition-all duration-300 opacity-0 group-hover:opacity-100 hover:bg-white flex items-center gap-1"
        >
          <Eye className="w-3 h-3" />
          Quick View
        </button>
      </div>

      {/* Product Details */}
      <div className="p-3">
        {/* Brand */}
        <p className="text-xs font-semibold text-emerald-600 mb-1 uppercase tracking-wide">
          {product.brand || "Local Store"}
        </p>

        {/* Product Name */}
        <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2 leading-tight min-h-[2rem]">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.floor(product.ratings?.average || 0)
                    ? "text-yellow-500 fill-current"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-600 font-medium">
            {product.ratings?.average || 0} ({product.ratings?.count || 0})
          </span>
        </div>

        {/* Weight Options */}
        {product.weightOptions && product.weightOptions.length > 1 && (
          <div className="mb-2">
            <select
              value={selectedWeight.weight}
              onChange={(e) => {
                const weight = product.weightOptions.find(
                  (w) => w.weight === e.target.value
                );
                setSelectedWeight(weight);
              }}
              className="w-full p-2 border border-gray-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-gray-50"
            >
              {product.weightOptions.map((option) => (
                <option key={option.weight} value={option.weight}>
                  {option.weight} - ₹{option.price}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Price and Delivery */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-1">
              <span className="text-base font-bold text-gray-900">
                ₹{displayPrice}
              </span>
              {product.originalPrice && (
                <span className="text-xs text-gray-500 line-through">
                  ₹{product.originalPrice}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600">
              <Clock className="w-3 h-3" />
              <span>{product.deliveryTime || "30 mins"}</span>
            </div>
          </div>
        </div>

        {/* Add to Cart Button */}
        {cartQuantity > 0 ? (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-1.5">
            <button
              onClick={handleRemoveFromCart}
              disabled={isLoading}
              className={`w-7 h-7 bg-white rounded-md flex items-center justify-center border border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50 transition-all ${
                isLoading ? "opacity-50" : ""
              }`}
            >
              <Minus className="w-3 h-3 text-emerald-600" />
            </button>
            <span className="font-bold text-emerald-700 px-2 text-sm">
              {cartQuantity}
            </span>
            <button
              onClick={handleAddToCart}
              disabled={isLoading}
              className={`w-7 h-7 bg-emerald-500 hover:bg-emerald-600 rounded-md flex items-center justify-center transition-all ${
                isLoading ? "opacity-50" : ""
              }`}
            >
              <Plus className="w-3 h-3 text-white" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={addedToCart || !product.stock || isLoading}
            className={`w-full py-2.5 rounded-lg font-semibold text-xs transition-all duration-300 flex items-center justify-center gap-1 ${
              addedToCart
                ? "bg-green-500 text-white"
                : !product.stock
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : isLoading
                ? "bg-gray-400 text-white cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700"
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : addedToCart ? (
              <>
                <CheckCircle className="w-3 h-3" />
                Added!
              </>
            ) : !product.stock ? (
              "Out of Stock"
            ) : (
              <>
                <ShoppingCart className="w-3 h-3" />
                ADD TO CART
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

// Main Search Results Page Component
const SearchResultsPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  // Redux state
  const products = useSelector(selectProducts);
  const loading = useSelector(selectLoading);
  const searchLoading = useSelector(selectSearchLoading);
  const categories = useSelector(selectCategories);
  const filters = useSelector(selectFilters);
  const error = useSelector(selectError);
  const searchError = useSelector(selectSearchError);
  const pagination = useSelector(selectPagination);
  const cartReduxCount = useSelector((state) => state.cart?.totalQuantity || 0);

  // Local state
  const [query, setQuery] = useState(initialQuery);
  const [localFilters, setLocalFilters] = useState({
    category: "",
    minPrice: "",
    maxPrice: "",
    sortBy: "relevance",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  // Initialize data on component mount
  useEffect(() => {
    dispatch(fetchWishlist());
    dispatch(fetchCart());
    dispatch(fetchCategories());
  }, [dispatch]);

  // Handle URL parameter changes
  useEffect(() => {
    const queryFromUrl = searchParams.get("q") || "";
    if (queryFromUrl && queryFromUrl !== query) {
      setQuery(queryFromUrl);
      performSearch(queryFromUrl);
    }
  }, [searchParams]);

  // If there's an initial query, search immediately
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    }
  }, [initialQuery]);

  // Perform search function
  const performSearch = async (searchQuery) => {
    if (!searchQuery.trim()) {
      return;
    }

    setHasSearched(true);

    try {
      // Prepare search filters
      const searchFilters = {
        category: localFilters.category || undefined,
        minPrice: localFilters.minPrice || undefined,
        maxPrice: localFilters.maxPrice || undefined,
        sortBy:
          localFilters.sortBy === "relevance" ? undefined : localFilters.sortBy,
      };

      // Remove undefined values
      Object.keys(searchFilters).forEach((key) => {
        if (searchFilters[key] === undefined || searchFilters[key] === "") {
          delete searchFilters[key];
        }
      });

      // Dispatch search action
      await dispatch(
        searchProducts({
          query: searchQuery,
          filters: searchFilters,
        })
      ).unwrap();
    } catch (err) {
      console.error("Search failed:", err);
      toast.error("Search failed. Please try again.");
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleFilterChange = (filterType, value) => {
    setLocalFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  const applySearchFilters = () => {
    if (query) {
      performSearch(query);
    }
    setShowFilters(false);
  };

  const clearSearchFilters = () => {
    setLocalFilters({
      category: "",
      minPrice: "",
      maxPrice: "",
      sortBy: "relevance",
    });
    if (query) {
      performSearch(query);
    }
  };

  const isLoading = loading || searchLoading;
  const currentError = error || searchError;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        {/* Top promotional bar */}
        <div className="bg-emerald-600 text-white py-2 px-4">
          <div className="flex justify-center items-center text-xs font-medium">
            <Zap className="w-4 h-4 mr-2" />
            <span>Free delivery in 30 minutes • Order above ₹299</span>
          </div>
        </div>

        {/* Main header */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-3">
            {/* Back + Menu buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>

            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-800">Tastyaana</h1>
              </div>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search for sweets..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white text-sm transition-all"
                />
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <button className="hidden sm:block p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <User className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => navigate("/cart")}
                className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ShoppingCart className="w-5 h-5 text-gray-600" />
                {cartReduxCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
                    {cartReduxCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-4">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[{ label: `Search Results for "${initialQuery || query}"` }]}
        />

        {/* Error Display */}
        {currentError && (
          <div className="mb-4">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
              <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
              <span className="text-sm">Error: {currentError}</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-gray-600 text-sm">Searching for products...</p>
          </div>
        )}

        {/* No Results */}
        {hasSearched &&
          !isLoading &&
          products.length === 0 &&
          !currentError && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                No Results Found
              </h2>
              <p className="text-gray-600 mb-6 text-sm">
                We couldn't find any products matching "{query}".
              </p>

              <div className="mb-6">
                <h3 className="text-base font-semibold text-gray-800 mb-3">
                  Popular Searches:
                </h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {popularSearches.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(suggestion);
                        performSearch(suggestion);
                      }}
                      className="bg-white text-gray-700 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-emerald-50 hover:text-emerald-700 transition-colors border border-gray-200"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => navigate("/products")}
                className="bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
              >
                Browse All Products
              </button>
            </div>
          )}

        {/* Search Results */}
        {hasSearched && !isLoading && products.length > 0 && (
          <>
            {/* Results Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 mb-1">
                  Search Results for "{initialQuery || query}"
                </h1>
                <p className="text-gray-600 text-sm">
                  {pagination.totalProducts || products.length} products found
                </p>
              </div>

              <div className="flex items-center gap-3">
                {/* Sort Dropdown */}
                <select
                  value={localFilters.sortBy}
                  onChange={(e) => {
                    handleFilterChange("sortBy", e.target.value);
                    applySearchFilters();
                  }}
                  className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="relevance">Relevance</option>
                  <option value="price">Price: Low to High</option>
                  <option value="-price">Price: High to Low</option>
                  <option value="-rating">Highest Rated</option>
                  <option value="-createdAt">Newest First</option>
                  <option value="-soldCount">Best Selling</option>
                </select>

                {/* Filters Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden bg-white border border-gray-200 px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-colors text-sm"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              {/* Filters Sidebar */}
              <div
                className={`${
                  showFilters ? "block" : "hidden lg:block"
                } w-full lg:w-64 flex-shrink-0`}
              >
                <div className="bg-white rounded-lg border border-gray-200 p-4 sticky top-32">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-gray-800">Filters</h3>
                    <button
                      onClick={clearSearchFilters}
                      className="text-emerald-600 text-sm hover:underline"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Category Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Category
                      </label>
                      <select
                        value={localFilters.category}
                        onChange={(e) =>
                          handleFilterChange("category", e.target.value)
                        }
                        className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="">All Categories</option>
                        {categories.map((category) => (
                          <option
                            key={category._id || category}
                            value={category.name || category}
                          >
                            {category.name || category}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Price Range Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Price Range
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          placeholder="Min ₹"
                          value={localFilters.minPrice}
                          onChange={(e) =>
                            handleFilterChange("minPrice", e.target.value)
                          }
                          className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                        <input
                          type="number"
                          placeholder="Max ₹"
                          value={localFilters.maxPrice}
                          onChange={(e) =>
                            handleFilterChange("maxPrice", e.target.value)
                          }
                          className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Quick Price Filters */}
                    <div>
                      <label className="block text-sm font-medium text-gray-800 mb-2">
                        Quick Filters
                      </label>
                      <div className="space-y-1">
                        {[
                          { label: "Under ₹200", min: "", max: "200" },
                          { label: "₹200 - ₹500", min: "200", max: "500" },
                          { label: "₹500 - ₹1000", min: "500", max: "1000" },
                          { label: "Above ₹1000", min: "1000", max: "" },
                        ].map((range, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              handleFilterChange("minPrice", range.min);
                              handleFilterChange("maxPrice", range.max);
                            }}
                            className="w-full text-left p-2 rounded-lg hover:bg-emerald-50 hover:text-emerald-700 transition-colors border border-gray-200 hover:border-emerald-300 text-sm"
                          >
                            {range.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Apply Filters Button */}
                    <button
                      onClick={applySearchFilters}
                      className="w-full bg-emerald-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:bg-emerald-700 transition-colors text-sm"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Results Grid */}
              <div className="flex-1">
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                  {products?.map((product, index) => (
                    <ProductCard
                      key={product._id}
                      product={product}
                      index={index}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="mt-6 flex justify-center">
                    <div className="flex items-center gap-2">
                      <button
                        disabled={!pagination.hasPrev}
                        className="px-3 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-50 hover:border-emerald-300 transition-colors text-sm"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="flex items-center gap-1">
                        {[...Array(Math.min(5, pagination.totalPages))].map(
                          (_, i) => {
                            const pageNum = i + 1;
                            const isActive = pageNum === pagination.currentPage;
                            return (
                              <button
                                key={i}
                                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                                  isActive
                                    ? "bg-emerald-600 text-white"
                                    : "bg-white border border-gray-200 text-gray-700 hover:bg-emerald-50 hover:border-emerald-300"
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          }
                        )}
                      </div>
                      <button
                        disabled={!pagination.hasNext}
                        className="px-3 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-50 hover:border-emerald-300 transition-colors text-sm"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* Search Tips - Show when no search has been performed */}
        {!hasSearched && !query && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-xl border border-gray-200 p-6 text-center">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-emerald-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                Find Your Perfect Sweet
              </h2>
              <p className="text-gray-600 mb-6">
                Search through our collection of traditional Indian sweets
              </p>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Popular Searches:
                </h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {popularSearches.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuery(suggestion);
                        performSearch(suggestion);
                      }}
                      className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium hover:bg-emerald-100 transition-colors border border-emerald-200"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
          <div className="bg-white w-72 h-full shadow-xl overflow-y-auto">
            {/* Header */}
            <div className="p-4 bg-emerald-600 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold">Tastyaana</h2>
                  <p className="text-emerald-100 text-sm">Fast & Fresh</p>
                </div>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-4 space-y-1">
              {[
                { text: "Home", path: "/" },
                { text: "All Products", path: "/products" },
                { text: "Categories", path: "/categories" },
                { text: "My Orders", path: "/orders" },
                { text: "Wishlist", path: "/wishlist" },
                { text: "Cart", path: "/cart" },
                { text: "Profile", path: "/profile" },
                { text: "Support", path: "/support" },
              ].map(({ text, path }) => (
                <button
                  key={text}
                  onClick={() => {
                    navigate(path);
                    setShowMobileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-lg transition-all hover:bg-gray-50 text-gray-700 text-left"
                >
                  <span className="font-medium">{text}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart Button (Mobile) */}
      {cartReduxCount > 0 && (
        <button
          onClick={() => navigate("/cart")}
          className="fixed bottom-4 right-4 lg:hidden bg-emerald-500 text-white p-3 rounded-xl shadow-lg hover:bg-emerald-600 transition-all z-40"
        >
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            <div className="text-left">
              <p className="text-xs font-medium">Cart</p>
              <p className="text-sm font-bold">{cartReduxCount}</p>
            </div>
          </div>
        </button>
      )}

      {/* Custom Styles */}
      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Smooth transitions */
        * {
          transition-property: color, background-color, border-color, transform,
            box-shadow;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }

        /* Custom animations */
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.4s ease-out forwards;
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .grid-cols-2 > * {
            min-height: 280px;
          }
        }
      `}</style>
    </div>
  );
};

export default SearchResultsPage;
