import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { addToCart as addToCartAction } from "../../redux/Slices/cartslice";
import {
  addToWishlistAPI as addToWishlistAction,
  removeFromWishlistAPI as removeFromWishlistAction,
} from "../../redux/wishlistSlice";
import {
  useGetGroceryProductsByCategoryQuery,
  useGetGroceryCategoriesQuery,
  useSearchGroceryProductsQuery,
} from "../../redux/storee/api";
import {
  Search,
  ShoppingBag,
  Heart,
  ChevronRight,
  ChevronLeft,
  Star,
  Filter,
  Grid3X3,
  List,
  SlidersHorizontal,
  Loader2,
  ShoppingCart,
  Plus,
  Minus,
  ArrowLeft,
  Package,
  Clock,
  Award,
  X,
  Menu,
} from "lucide-react";

// Responsive Product Card Component
const ResponsiveProductCard = ({
  product,
  viewMode,
  onAddToCart,
  onToggleWishlist,
  isInWishlist,
  isInCart,
}) => {
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState(
    product.weightOptions?.[0] || null
  );

  const handleProductClick = (e) => {
    // Prevent navigation if clicking on buttons or links
    if (e.target.closest("button, a")) {
      return;
    }
    navigate(`/products/${product._id}`);
  };

  const handleQuantityChange = (change) => {
    setQuantity((prev) => Math.max(1, prev + change));
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    onAddToCart({
      ...product,
      quantity,
      selectedWeight: selectedWeight?.weight || product.weight || "1kg",
      selectedPrice: selectedWeight?.price || product.price,
    });
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    onToggleWishlist(product);
  };

  if (viewMode === "list") {
    return (
      <div
        className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex cursor-pointer"
        onClick={handleProductClick}
      >
        <div className="w-24 sm:w-32 md:w-40 flex-shrink-0">
          <img
            src={product.images?.[0]?.url || "https://via.placeholder.com/300"}
            alt={product.name || product.title}
            className="w-full h-20 sm:h-24 md:h-32 object-cover"
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/300";
            }}
          />
        </div>
        <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between">
          <div>
            <h3 className="text-sm sm:text-base font-medium text-gray-900 line-clamp-1 mb-1">
              {product.name || product.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 mb-2">
              {product.description?.substring(0, 80)}...
            </p>

            {/* Rating */}
            <div className="flex items-center mb-2">
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 sm:h-4 sm:w-4 ${
                      star <=
                      Math.round(
                        product.rating || product.ratings?.average || 4
                      )
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
                <span className="ml-1 text-xs text-gray-500">
                  ({product.numReviews || product.ratings?.count || 0})
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <span className="text-base sm:text-lg font-bold text-gray-900">
                ₹{selectedWeight?.price || product.price}
              </span>
              {(selectedWeight?.originalPrice || product.originalPrice) && (
                <span className="ml-2 text-xs sm:text-sm text-gray-500 line-through">
                  ₹{selectedWeight?.originalPrice || product.originalPrice}
                </span>
              )}
            </div>

            <div className="flex items-center space-x-1 sm:space-x-2">
              <button
                onClick={handleWishlistClick}
                className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <Heart
                  className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    isInWishlist ? "fill-current text-red-500" : ""
                  }`}
                />
              </button>
              <button
                onClick={handleAddToCart}
                className="px-2 py-1 sm:px-3 sm:py-1.5 bg-emerald-600 text-white text-xs sm:text-sm font-medium rounded hover:bg-emerald-700 flex items-center space-x-1 transition-colors"
              >
                <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid view (mobile-optimized card similar to reference image)
  return (
    <div
      className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 group cursor-pointer"
      onClick={handleProductClick}
    >
      {/* Discount Badge */}
      {(() => {
        const discount = Math.round(
          selectedWeight?.discount || product.discount || 0
        );
        return discount > 0 ? (
          <div className="absolute top-2 left-2 z-10">
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
              {discount}% OFF
            </span>
          </div>
        ) : null;
      })()}

      {/* Wishlist Button */}
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={handleWishlistClick}
          className="p-1.5 bg-white/80 backdrop-blur-sm rounded-full text-gray-400 hover:text-red-500 transition-colors shadow-sm"
        >
          <Heart
            className={`h-4 w-4 ${
              isInWishlist ? "fill-current text-red-500" : ""
            }`}
          />
        </button>
      </div>

      {/* Product Image */}
      <div className="relative">
        <img
          src={product.images?.[0]?.url || "https://via.placeholder.com/300"}
          alt={product.name || product.title}
          className="w-full h-32 sm:h-36 md:h-40 object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.src = "https://via.placeholder.com/300";
          }}
        />
      </div>

      <div className="p-3 sm:p-4">
        {/* Product Info */}
        <div className="mb-3">
          <h3 className="text-sm sm:text-base font-medium text-gray-900 line-clamp-2 mb-1 group-hover:text-emerald-600 transition-colors">
            {product.name || product.title}
          </h3>

          {/* Weight Options */}
          {product.weightOptions && product.weightOptions.length > 0 && (
            <div className="mb-2">
              <select
                value={selectedWeight?.weight || ""}
                onChange={(e) => {
                  const option = product.weightOptions.find(
                    (opt) => opt.weight === e.target.value
                  );
                  setSelectedWeight(option);
                }}
                className="text-xs border border-gray-200 rounded px-2 py-1 w-full focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {product.weightOptions.map((option, index) => (
                  <option key={index} value={option.weight}>
                    {option.weight}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Rating */}
          <div className="flex items-center mb-2">
            <div className="flex items-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-3 w-3 ${
                    star <=
                    Math.round(product.rating || product.ratings?.average || 4)
                      ? "text-yellow-400 fill-current"
                      : "text-gray-300"
                  }`}
                />
              ))}
              <span className="ml-1 text-xs text-gray-500">
                ({product.numReviews || product.ratings?.count || 0})
              </span>
            </div>
          </div>

          {/* Price */}
          <div className="mb-3">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-gray-900">
                ₹{selectedWeight?.price || product.price}
              </span>
              {(selectedWeight?.originalPrice || product.originalPrice) && (
                <span className="text-sm text-gray-500 line-through">
                  ₹{selectedWeight?.originalPrice || product.originalPrice}
                </span>
              )}
            </div>
            {(selectedWeight?.originalPrice || product.originalPrice) && (
              <p className="text-xs text-green-600 font-medium">
                Save ₹
                {(selectedWeight?.originalPrice || product.originalPrice) -
                  (selectedWeight?.price || product.price)}
              </p>
            )}
          </div>
        </div>

        {/* Quantity and Add to Cart */}
        <div className="space-y-2">
          {/* Quantity Selector */}
          <div className="flex items-center justify-between border border-gray-200 rounded-lg p-1">
            <button
              onClick={() => handleQuantityChange(-1)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4 text-gray-600" />
            </button>
            <span className="font-medium text-sm px-3">{quantity}</span>
            <button
              onClick={() => handleQuantityChange(1)}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
            >
              <Plus className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            className="w-full bg-emerald-600 text-white py-2 px-4 rounded-lg font-medium text-sm hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-2"
          >
            <ShoppingCart className="h-4 w-4" />
            <span>ADD</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const EnhancedGroceriesPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [activeCategory, setActiveCategory] = useState(categoryId || "all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("popularity");
  const [sortOrder, setSortOrder] = useState("desc");
  const [viewMode, setViewMode] = useState("grid");
  const [showFilters, setShowFilters] = useState(false);
  const [showMobileCategories, setShowMobileCategories] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Get current user from Redux
  const { userInfo } = useSelector((state) => state.auth);
  const { items: cartItems } = useSelector((state) => state.cart);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  // Fetch categories and products
  const { data: categories = [], isLoading: categoriesLoading } =
    useGetGroceryCategoriesQuery();
  const { data: categoryProducts = [], isLoading: productsLoading } =
    useGetGroceryProductsByCategoryQuery(activeCategory);
  const { data: searchResults, isLoading: searchLoading } =
    useSearchGroceryProductsQuery(
      { query: searchTerm },
      { skip: searchTerm.length < 3 }
    );

  // Get current category data with fallback
  const getCurrentCategoryData = () => {
    const currentCat = categories.find((cat) => cat.slug === activeCategory);

    const categoryMap = {
      vegetables: {
        name: "Fresh Vegetables",
        icon: "🥦",
        gradient: "from-green-500 to-emerald-600",
        bgGradient: "from-green-50 to-emerald-50",
        textColor: "text-green-600",
        description: "Fresh and organic vegetables from local farms",
      },
      grocery: {
        name: "Daily Grocery",
        icon: "🛒",
        gradient: "from-blue-500 to-cyan-600",
        bgGradient: "from-blue-50 to-cyan-50",
        textColor: "text-blue-600",
        description: "All your daily grocery needs in one place",
      },
      sweets: {
        name: "Sweets & Desserts",
        icon: "🍬",
        gradient: "from-pink-500 to-rose-600",
        bgGradient: "from-pink-50 to-rose-50",
        textColor: "text-pink-600",
        description: "Delicious sweets and desserts for every occasion",
      },
      fruits: {
        name: "Fresh Fruits",
        icon: "🍎",
        gradient: "from-red-500 to-orange-600",
        bgGradient: "from-red-50 to-orange-50",
        textColor: "text-red-600",
        description: "Seasonal and exotic fruits at your doorstep",
      },
      dairy: {
        name: "Dairy & Eggs",
        icon: "🥛",
        gradient: "from-amber-400 to-yellow-500",
        bgGradient: "from-amber-50 to-yellow-50",
        textColor: "text-amber-600",
        description: "Fresh dairy products and farm eggs",
      },
    };

    return (
      categoryMap[activeCategory] || {
        name: currentCat?.name || "Groceries",
        icon: "🛍️",
        gradient: "from-emerald-500 to-teal-600",
        bgGradient: "from-emerald-50 to-teal-50",
        textColor: "text-emerald-600",
        description: "All your shopping needs in one place",
      }
    );
  };

  const categoryData = getCurrentCategoryData();

  // Get current products based on search or category
  const getCurrentProducts = () => {
    if (searchTerm && searchTerm.length >= 3 && searchResults) {
      return searchResults || [];
    }
    return Array.isArray(categoryProducts.products)
      ? categoryProducts.products
      : [];
  };

  // Sort products
  const getSortedProducts = () => {
    const productsToSort = getCurrentProducts();

    if (!Array.isArray(productsToSort)) {
      return [];
    }

    return [...productsToSort].sort((a, b) => {
      if (sortBy === "name") {
        return sortOrder === "asc"
          ? (a.name || a.title || "").localeCompare(b.name || b.title || "")
          : (b.name || b.title || "").localeCompare(a.name || a.title || "");
      } else if (sortBy === "price") {
        const priceA = parseFloat(a.price) || 0;
        const priceB = parseFloat(b.price) || 0;
        return sortOrder === "asc" ? priceA - priceB : priceB - priceA;
      } else if (sortBy === "popularity") {
        const ratingA = a.rating || a.ratings?.average || 0;
        const ratingB = b.rating || b.ratings?.average || 0;
        return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA;
      }
      return 0;
    });
  };

  const sortedProducts = getSortedProducts();
  const isLoading = productsLoading || searchLoading;

  // Handle add to cart
  const handleAddToCart = (productData) => {
    if (!userInfo) {
      navigate("/login");
      return;
    }
    dispatch(addToCartAction(productData));
    toast.success(`${productData.name || productData.title} added to cart`);
  };

  // Handle wishlist toggle
  const toggleWishlist = (product) => {
    if (!userInfo) {
      navigate("/login");
      return;
    }

    const isInWishlist = wishlistItems.some((item) => item._id === product._id);

    if (isInWishlist) {
      dispatch(removeFromWishlistAction(product._id));
      toast.info(`${product.name || product.title} removed from wishlist`);
    } else {
      dispatch(addToWishlistAction(product));
      toast.success(`${product.name || product.title} added to wishlist`);
    }
  };

  // Check if product is in wishlist
  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => item._id === productId);
  };

  // Check if product is in cart
  const isInCart = (productId) => {
    return cartItems.some((item) => item._id === productId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Category Header */}
      <div className="lg:hidden bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button onClick={() => navigate("/")} className="p-1">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                {categoryData.name}
              </h1>
              <p className="text-sm text-gray-500">
                {sortedProducts.length} items
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowMobileCategories(!showMobileCategories)}
              className="p-2 text-gray-600"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Categories Dropdown */}
        {showMobileCategories && (
          <div className="border-t border-gray-200 bg-white">
            <div className="max-h-60 overflow-y-auto">
              {categories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => {
                    setActiveCategory(category.slug);
                    setShowMobileCategories(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm font-medium border-b border-gray-100 ${
                    activeCategory === category.slug
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Desktop Category Hero Banner */}
      {categoryData && (
        <div
          className={`hidden lg:block bg-gradient-to-r ${categoryData.gradient} text-white relative overflow-hidden`}
        >
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 relative z-10">
            {/* Breadcrumb */}
            <nav className="flex items-center space-x-2 text-sm mb-4 lg:mb-6 text-white/80">
              <button
                onClick={() => navigate("/")}
                className="hover:text-white cursor-pointer font-medium flex items-center space-x-1 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Home</span>
              </button>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white font-semibold capitalize">
                {categoryData.name}
              </span>
            </nav>

            {/* Category Hero */}
            <div className="flex items-center gap-8">
              <div className="text-6xl lg:text-8xl">{categoryData.icon}</div>
              <div className="flex-1">
                <h1 className="text-4xl md:text-5xl font-bold mb-4 capitalize">
                  {categoryData.name}
                </h1>
                <p className="text-lg text-white/90 mb-6 max-w-2xl">
                  {categoryData.description}
                </p>
                <div className="flex gap-3 text-sm">
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center space-x-2">
                    <Package className="w-4 h-4" />
                    <span>{sortedProducts.length} Products</span>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Fast Delivery</span>
                  </div>
                  <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-xl flex items-center space-x-2">
                    <Award className="w-4 h-4" />
                    <span>Quality Assured</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        {/* Mobile Search and Filter Bar */}
        <div className="lg:hidden mb-4">
          <div className="flex items-center space-x-2 mb-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 border border-gray-300 rounded-lg"
            >
              <Filter className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Mobile Filters */}
          {showFilters && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">View</span>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded ${
                      viewMode === "grid"
                        ? "bg-emerald-100 text-emerald-700"
                        : "text-gray-400"
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded ${
                      viewMode === "list"
                        ? "bg-emerald-100 text-emerald-700"
                        : "text-gray-400"
                    }`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <select
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="popularity">Popularity</option>
                  <option value="price">Price</option>
                  <option value="name">Name</option>
                </select>

                <select
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(e.target.value)}
                >
                  <option value="desc">High to Low</option>
                  <option value="asc">Low to High</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Toolbar */}
        <div className="hidden lg:flex lg:justify-between lg:items-center mb-6 gap-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-md ${
                viewMode === "grid"
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-gray-400 hover:bg-gray-100"
              }`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-md ${
                viewMode === "list"
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-gray-400 hover:bg-gray-100"
              }`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search products..."
                className="block w-64 pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="block w-40 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="popularity">Popularity</option>
              <option value="price">Price</option>
              <option value="name">Name</option>
            </select>

            <select
              className="block w-32 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-emerald-500 focus:border-emerald-500"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">High to Low</option>
              <option value="asc">Low to High</option>
            </select>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Desktop Categories Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-4 sticky top-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Categories
              </h3>
              <nav className="space-y-1">
                {categories.map((category) => (
                  <button
                    key={category._id}
                    onClick={() => setActiveCategory(category.slug)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      activeCategory === category.slug
                        ? "bg-emerald-50 text-emerald-700"
                        : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </nav>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin h-8 w-8 text-emerald-500" />
                <span className="ml-2 text-gray-600">Loading products...</span>
              </div>
            ) : sortedProducts.length > 0 ? (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6"
                    : "space-y-3 sm:space-y-4"
                }
              >
                {sortedProducts.map((product) => (
                  <ResponsiveProductCard
                    key={product._id}
                    product={product}
                    viewMode={viewMode}
                    onAddToCart={handleAddToCart}
                    onToggleWishlist={toggleWishlist}
                    isInWishlist={isInWishlist(product._id)}
                    isInCart={isInCart(product._id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No products found
                </h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm
                    ? `No results for "${searchTerm}". Try adjusting your search.`
                    : "Try adjusting your filters to find what you're looking for."}
                </p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm("")}
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Clear search
                  </button>
                )}
              </div>
            )}

            {/* Load More Button for Mobile */}
            {sortedProducts.length > 0 && (
              <div className="lg:hidden text-center mt-6">
                <button className="w-full bg-white border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors">
                  Load More Products
                </button>
              </div>
            )}
          </main>
        </div>

        {/* Mobile Features Bar */}
        <div className="lg:hidden mt-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Why Shop With Us?
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mb-1">
                <Package className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-xs text-gray-600 font-medium">
                Fresh Products
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mb-1">
                <Clock className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-xs text-gray-600 font-medium">
                Fast Delivery
              </span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center mb-1">
                <Award className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-xs text-gray-600 font-medium">
                Best Quality
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons for Mobile */}
      <div className="lg:hidden fixed bottom-4 right-4 flex flex-col space-y-2 z-50">
        {/* Cart Button */}
        <button
          onClick={() => navigate("/cart")}
          className="bg-emerald-600 text-white p-3 rounded-full shadow-lg hover:bg-emerald-700 transition-colors relative"
        >
          <ShoppingBag className="w-6 h-6" />
          {cartItems.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {cartItems.length}
            </span>
          )}
        </button>

        {/* Wishlist Button */}
        <button
          onClick={() => navigate("/wishlist")}
          className="bg-red-500 text-white p-3 rounded-full shadow-lg hover:bg-red-600 transition-colors relative"
        >
          <Heart className="w-6 h-6" />
          {wishlistItems.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {wishlistItems.length}
            </span>
          )}
        </button>
      </div>

      {/* Mobile Bottom Navigation Spacer */}
      <div className="lg:hidden h-20"></div>
    </div>
  );
};

export default EnhancedGroceriesPage;
