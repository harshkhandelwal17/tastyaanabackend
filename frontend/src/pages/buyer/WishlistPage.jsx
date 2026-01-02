import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { useOptimizedWishlist } from "../../hooks/useOptimizedWishlist";
import {
  Heart,
  ShoppingCart,
  X,
  ChevronRight,
  Star,
  Eye,
  Plus,
  Minus,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Grid3X3,
  List,
  Zap,
  Clock,
  User,
  Menu,
  MapPin,
  Filter,
  Search,
  Home,
  Package,
  TrendingUp,
  Flame,
  Timer,
  Shield,
  Award,
} from "lucide-react";
import {
  fetchWishlist,
  addToWishlistAPI,
  removeFromWishlistAPI,
} from "../../redux/wishlistSlice";
import { addToCartAPI, fetchCart } from "../../redux/cartSlice";

// Animation variants for framer-motion
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.05,
      duration: 0.3,
    },
  }),
  exit: { opacity: 0, x: -50, transition: { duration: 0.2 } },
};

// Enhanced Wishlist Item Component
const WishlistItem = ({
  wishlistItem,
  selectedWeight,
  onWeightChange = () => {},
  onAddToCart = () => {},
  onRemove = () => {},
  onNavigateToProduct = () => {},
  index = 0,
}) => {
  const authUser = useSelector((state) => state.auth?.user);
  const cartItems = useSelector((state) => state.cart?.items || []);
  const [addedToCart, setAddedToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const navigate = useNavigate();
  const product = wishlistItem.product || wishlistItem;

  // Check if product is in cart
  const cartItem = cartItems.find((item) => {
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
      toast("Please login to add items to cart", { duration: 2000 });
      navigate("/login");
      return;
    }

    setIsAddingToCart(true);
    try {
      const weight = selectedWeight || product.weightOptions?.[0];
      onAddToCart(product, weight?.weight, quantity);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (error) {
      console.error("Error adding to cart:", error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleRemove = async () => {
    setIsRemoving(true);
    try {
      onRemove(product._id);
    } catch (error) {
      console.error("Error removing from wishlist:", error);
    } finally {
      setIsRemoving(false);
    }
  };

  const handleNavigateToProduct = () => {
    navigate(`/products/${product._id}`);
    onNavigateToProduct(product._id);
  };

  const getStockQuantity = () => {
    if (selectedWeight && selectedWeight.stock !== undefined) {
      return selectedWeight.stock;
    }
    if (product.stockQty !== undefined) {
      return product.stockQty;
    }
    if (product.stock !== undefined) {
      return product.stock;
    }
    return 0;
  };

  const stockQty = getStockQuantity();

  const getImageUrl = () => {
    if (product.images && product.images.length > 0) {
      if (typeof product.images[0] === "string") {
        return product.images[0];
      }
      if (product.images[0].url) {
        return product.images[0].url;
      }
    }
    return "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=500";
  };

  const selectedPrice =
    selectedWeight?.price ||
    product.weightOptions?.[0]?.price ||
    product.price ||
    0;
  const selectedWeightValue =
    selectedWeight?.weight || product.weightOptions?.[0]?.weight || "unit";
  const discount = selectedWeight?.discount || product.discount || 0;
  const originalPrice =
    selectedWeight?.originalPrice || product.originalPrice || selectedPrice;

  const inStock = stockQty > 0;

  return (
    <motion.div
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group"
      variants={itemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      custom={index % 10}
      layout
    >
      {/* Product Image with improved styling */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100">
        <img
          src={getImageUrl()}
          alt={product.name || product.title}
          className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
          onClick={handleNavigateToProduct}
        />

        {/* Enhanced remove button */}
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className="absolute top-2 right-2 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-sm hover:bg-red-50 text-red-500 transition-all duration-300 z-10"
          aria-label="Remove from wishlist"
        >
          {isRemoving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <X className="w-4 h-4" />
          )}
        </button>

        {/* Enhanced discount badge */}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
            {discount}% OFF
          </span>
        )}

        {/* Stock status overlay */}
        {stockQty === 0 && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
            <span className="bg-red-500 text-white px-3 py-1 rounded-md text-sm font-medium">
              Out of Stock
            </span>
          </div>
        )}

        {/* Quick view button */}
        <button
          onClick={handleNavigateToProduct}
          className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-white/95 backdrop-blur-sm text-gray-800 px-3 py-1.5 rounded-full font-medium text-xs transition-all duration-300 opacity-0 group-hover:opacity-100 hover:bg-white flex items-center gap-1"
        >
          <Eye className="w-3 h-3" />
          Quick View
        </button>
      </div>

      {/* Enhanced Product Info */}
      <div className="p-3">
        {/* Brand */}
        <p className="text-xs font-semibold text-emerald-600 mb-1 uppercase tracking-wide">
          {product.brand || "Local Store"}
        </p>

        {/* Product Name */}
        <h3
          className="font-bold text-sm text-gray-900 line-clamp-2 leading-tight cursor-pointer hover:text-emerald-600 transition-colors mb-2 min-h-[2rem]"
          onClick={handleNavigateToProduct}
        >
          {product.name || product.title}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i <
                  Math.floor(product.ratings?.average || product.rating || 0)
                    ? "text-yellow-500 fill-current"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span className="text-xs text-gray-600 font-medium">
            {(product?.ratings?.average || product?.rating || 0).toFixed(1)} (
            {product.ratings?.count || product?.reviews || 0})
          </span>
        </div>

        {/* Weight Options */}
        {product.weightOptions && product.weightOptions.length > 1 && (
          <div className="mb-2">
            <select
              value={selectedWeightValue}
              onChange={(e) => {
                const weight = product.weightOptions.find(
                  (w) => w.weight === e.target.value
                );
                onWeightChange(product._id, weight);
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

        {/* Enhanced Price Section */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-1">
              <span className="text-base font-bold text-gray-900">
                ₹{selectedPrice.toFixed(2)}
              </span>
              {discount > 0 && (
                <span className="text-xs text-gray-500 line-through">
                  ₹{originalPrice.toFixed(2)}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600">
              <Clock className="w-3 h-3" />
              <span>{product.deliveryTime || "30 mins"}</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 text-right">
            <div>per {selectedWeightValue}</div>
            {inStock && (
              <div className="text-emerald-600 font-medium">In Stock</div>
            )}
          </div>
        </div>

        {/* Enhanced Add to Cart Button */}
        {cartQuantity > 0 ? (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg p-1.5 mb-2">
            <button
              onClick={() => onRemove(product._id)} // This should handle cart removal
              disabled={isAddingToCart}
              className={`w-7 h-7 bg-white rounded-md flex items-center justify-center border border-emerald-300 hover:border-emerald-400 hover:bg-emerald-50 transition-all ${
                isAddingToCart ? "opacity-50" : ""
              }`}
            >
              <Minus className="w-3 h-3 text-emerald-600 font-bold" />
            </button>
            <span className="font-bold text-emerald-700 px-2 text-sm">
              {cartQuantity}
            </span>
            <button
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className={`w-7 h-7 bg-emerald-500 hover:bg-emerald-600 rounded-md flex items-center justify-center transition-all ${
                isAddingToCart ? "opacity-50" : ""
              }`}
            >
              <Plus className="w-3 h-3 text-white font-bold" />
            </button>
          </div>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={!inStock || isAddingToCart}
            className={`w-full py-2.5 rounded-lg font-semibold text-xs transition-all duration-300 flex items-center justify-center gap-1 mb-2 ${
              !inStock
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : isAddingToCart
                ? "bg-gray-400 text-white cursor-not-allowed"
                : addedToCart
                ? "bg-green-500 text-white"
                : "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white hover:from-emerald-600 hover:to-emerald-700"
            }`}
          >
            {isAddingToCart ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : addedToCart ? (
              <>
                <CheckCircle className="w-3 h-3" />
                Added!
              </>
            ) : !inStock ? (
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
    </motion.div>
  );
};

// Main Wishlist Page Component
const WishlistPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: wishlist, loading } = useSelector((state) => state.wishlist);
  const authUser = useSelector((state) => state.auth?.user);
  const cartReduxCount = useSelector((state) => state.cart?.totalQuantity || 0);

  // Handle the nested structure where wishlist.items is the array
  const wishlistItems = wishlist?.items || wishlist || [];

  // Local state
  const [selectedWeights, setSelectedWeights] = useState({});
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    if (authUser) {
      dispatch(fetchWishlist());
      dispatch(fetchCart());
    }
  }, [dispatch, authUser]);

  // Update selected weights when wishlist items change
  useEffect(() => {
    if (
      wishlistItems &&
      Array.isArray(wishlistItems) &&
      wishlistItems.length > 0
    ) {
      const newWeights = {};
      let hasChanges = false;

      wishlistItems.forEach((item) => {
        const product = item.product || item;
        const productId = product._id;

        if (product.weightOptions?.length > 0) {
          const currentWeight = selectedWeights[productId];
          const defaultWeight = product.weightOptions[0];

          if (
            !currentWeight ||
            !product.weightOptions.some(
              (w) =>
                w.weight === currentWeight.weight &&
                w.unit === currentWeight.unit
            )
          ) {
            newWeights[productId] = defaultWeight;
            hasChanges = true;
          } else {
            newWeights[productId] = currentWeight;
          }
        }
      });

      if (
        hasChanges ||
        Object.keys(selectedWeights).length !== Object.keys(newWeights).length
      ) {
        setSelectedWeights((prev) =>
          JSON.stringify(prev) !== JSON.stringify(newWeights)
            ? newWeights
            : prev
        );
      }
    } else if (
      wishlistItems?.length === 0 &&
      Object.keys(selectedWeights).length > 0
    ) {
      setSelectedWeights({});
    }
  }, [wishlistItems]);

  const handleWeightChange = (productId, weight) => {
    setSelectedWeights((prev) => ({
      ...prev,
      [productId]: weight,
    }));
  };

  const handleAddToCart = async (product, weight, quantity) => {
    if (!authUser) {
      toast("Please login to add items to cart", { duration: 2000 });
      navigate("/login");
      return;
    }
    try {
      const payload = {
        productId: product._id,
        payload: { weight },
        quantity: quantity || 1,
      };
      await dispatch(addToCartAPI(payload)).unwrap();
      toast.success("Added to cart!", { duration: 2000 });
    } catch (err) {
      console.error("Add to cart error:", err);
      toast.error("Failed to add to cart", { duration: 2000 });
    }
  };

  const handleRemoveFromWishlist = async (wishlistItemId) => {
    try {
      const itemToRemove = wishlistItems.find(
        (item) =>
          item?._id === wishlistItemId || item?.product?._id === wishlistItemId
      );
      if (!itemToRemove) {
        console.warn("Item not found in wishlist:", wishlistItemId);
        return;
      }

      try {
        dispatch(removeFromWishlistAPI(wishlistItemId)).unwrap();

        // dispatch({
        //   type: "wishlist/removeItem",
        //   payload: wishlistItemId,
        // });

        setSelectedWeights((prev) => {
          const newWeights = { ...prev };
          const productId = itemToRemove.product?._id || itemToRemove._id;
          if (productId && newWeights[productId]) {
            delete newWeights[productId];
          }
          return newWeights;
        });
        dispatch(fetchWishlist());

        toast.success("Removed from wishlist!", { duration: 2000 });
      } catch (err) {
        dispatch(fetchWishlist());
        console.error("Remove from wishlist error:", err.message);
        toast.error("Failed to remove from wishlist", { duration: 2000 });
      }
    } catch (err) {
      console.error("Error in handleRemoveFromWishlist:", err);
      toast.error("An error occurred while removing the item", {
        duration: 2000,
      });
    }
  };
  const { removeFromWishlist } = useOptimizedWishlist();
  const handleNavigateToProduct = (productId) => {
    navigate(`/products/${productId}`);
  };

  // Sort wishlist items
  const sortedWishlistItems = React.useMemo(() => {
    if (!wishlistItems) return [];

    const items = [...wishlistItems];

    switch (sortBy) {
      case "price-low":
        return items.sort((a, b) => {
          const priceA = (a.product || a).price || 0;
          const priceB = (b.product || b).price || 0;
          return priceA - priceB;
        });
      case "price-high":
        return items.sort((a, b) => {
          const priceA = (a.product || a).price || 0;
          const priceB = (b.product || b).price || 0;
          return priceB - priceA;
        });
      case "name":
        return items.sort((a, b) => {
          const nameA = (a.product || a).name || "";
          const nameB = (b.product || b).name || "";
          return nameA.localeCompare(nameB);
        });
      case "newest":
      default:
        return items.reverse();
    }
  }, [wishlistItems, sortBy]);

  // Filter available and unavailable items
  const availableItems = sortedWishlistItems.filter((item) => {
    const product = item.product || item;
    const selectedWeight = selectedWeights[product._id];
    if (selectedWeight && selectedWeight.stock !== undefined) {
      return selectedWeight.stock > 0;
    }
    return (product.stockQty || product.stock || 0) > 0;
  });

  const unavailableItems = sortedWishlistItems.filter((item) => {
    const product = item.product || item;
    const selectedWeight = selectedWeights[product._id];
    if (selectedWeight && selectedWeight.stock !== undefined) {
      return selectedWeight.stock === 0;
    }
    return (product.stockQty || product.stock || 0) === 0;
  });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Skeleton */}
        <div className="bg-white shadow-sm">
          <div className="bg-emerald-600 py-2">
            <div className="h-4 bg-emerald-700 rounded w-64 mx-auto"></div>
          </div>
          <div className="px-4 py-4">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gray-200 rounded"></div>
              <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 h-10 bg-gray-100 rounded-lg"></div>
              <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-600 text-sm">Loading your wishlist...</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty wishlist state
  if (
    !wishlistItems ||
    !Array.isArray(wishlistItems) ||
    wishlistItems.length === 0
  ) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Enhanced Header */}
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
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>

              <button
                className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">T</span>
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-bold text-gray-800">
                    My Wishlist
                  </h1>
                </div>
              </div>

              <div className="flex-1"></div>

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
        </header>

        {/* Empty state content */}
        <div className="flex flex-col items-center justify-center p-4 text-center min-h-[calc(100vh-120px)]">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">
                Your wishlist is empty
              </h1>
              <p className="text-gray-600 mb-6 text-sm">
                Save your favorite items here to buy them later. Start exploring
                our amazing collection!
              </p>

              {/* Feature highlights */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="text-center">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-1">
                    <Timer className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-xs text-gray-600">Fast Delivery</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-1">
                    <Shield className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-xs text-gray-600">Quality Products</p>
                </div>
                <div className="text-center">
                  <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mx-auto mb-1">
                    <Award className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-xs text-gray-600">Best Prices</p>
                </div>
              </div>

              <button
                onClick={() => navigate("/products")}
                className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-3 px-6 rounded-lg font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-sm"
              >
                Start Shopping
              </button>

              <button
                onClick={() => navigate("/")}
                className="w-full mt-3 text-gray-600 py-2 px-6 rounded-lg font-medium hover:bg-gray-50 transition-all text-sm"
              >
                Go to Home
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
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>

            <button
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-800">My Wishlist</h1>
                <p className="text-xs text-emerald-600">Save your favorites</p>
              </div>
            </div>

            <div className="flex-1"></div>

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
      </header>

      {/* Main Content */}
      <main className="px-4 py-4">
        {/* Breadcrumb */}
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
            <li>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </li>
            <li>
              <span className="text-gray-800 font-medium">My Wishlist</span>
            </li>
          </ol>
        </nav>

        {/* Enhanced Summary Bar */}
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-6 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Heart className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">
                  {wishlistItems.length}{" "}
                  {wishlistItems.length === 1 ? "Item" : "Items"} Saved
                </h2>
                <p className="text-sm text-gray-600">
                  {availableItems.length} available • {unavailableItems.length}{" "}
                  out of stock
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="newest">Newest First</option>
                <option value="name">Name A-Z</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>

              {/* View Mode Toggle */}

              <button
                onClick={() => navigate("/products")}
                className="flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 px-3 py-2 rounded-lg border border-emerald-200 hover:border-emerald-300 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add More
              </button>
            </div>
          </div>
        </div>

        {/* Available Items */}
        {availableItems.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Available Items ({availableItems.length})
                </h3>
                <p className="text-sm text-gray-600">Ready for delivery</p>
              </div>
            </div>

            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4"
                  : "space-y-4"
              }
            >
              <AnimatePresence>
                {availableItems.map((item, index) => (
                  <WishlistItem
                    key={item._id || index}
                    wishlistItem={item}
                    selectedWeight={
                      selectedWeights[item.product?._id || item._id]
                    }
                    onWeightChange={handleWeightChange}
                    onAddToCart={handleAddToCart}
                    onRemove={handleRemoveFromWishlist}
                    onNavigateToProduct={handleNavigateToProduct}
                    index={index}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Unavailable Items */}
        {unavailableItems.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Currently Unavailable ({unavailableItems.length})
                </h3>
                <p className="text-sm text-gray-600">
                  We'll notify you when back in stock
                </p>
              </div>
            </div>

            <div
              className={
                viewMode === "grid"
                  ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 lg:gap-4"
                  : "space-y-4"
              }
            >
              <AnimatePresence>
                {unavailableItems.map((item, index) => (
                  <WishlistItem
                    key={item._id || index}
                    wishlistItem={item}
                    selectedWeight={
                      selectedWeights[item.product?._id || item._id]
                    }
                    onWeightChange={handleWeightChange}
                    onAddToCart={handleAddToCart}
                    onRemove={handleRemoveFromWishlist}
                    onNavigateToProduct={handleNavigateToProduct}
                    index={index + availableItems.length}
                  />
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Recommendations Section */}
      </main>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden">
          <div className="bg-white w-80 h-full shadow-xl overflow-y-auto">
            {/* Header */}
            <div className="p-6 bg-emerald-600 text-white">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold">Tastyaana</h2>
                  <p className="text-emerald-100 text-sm">
                    Fast & Fresh delivery
                  </p>
                </div>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* User Profile Section */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {authUser
                      ? `Welcome, ${authUser.name || "User"}!`
                      : "Welcome!"}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {authUser
                      ? "Manage your wishlist"
                      : "Sign in for better experience"}
                  </p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="p-4 space-y-2">
              {[
                { text: "Home", path: "/" },
                { text: "All Products", path: "/products" },
                { text: "My Orders", path: "/orders" },
                { text: "My Wishlist", path: "/wishlist", active: true },
                { text: "My Cart", path: "/cart" },
                { text: "Profile", path: "/profile" },
                { text: "Support", path: "/support" },
              ].map(({ text, path, active }) => (
                <button
                  key={text}
                  onClick={() => {
                    navigate(path);
                    setShowMobileMenu(false);
                  }}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                    active
                      ? "bg-emerald-50 text-emerald-700 border-2 border-emerald-200"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <span className="font-medium">{text}</span>
                  {active && (
                    <div className="ml-auto w-2 h-2 bg-emerald-500 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom CTA for mobile */}
      {availableItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg sm:hidden z-30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Available Items</p>
              <p className="font-bold text-gray-900">
                {availableItems.length} items ready
              </p>
            </div>
            <button
              onClick={async () => {
                // Add all available items to cart
                for (const item of availableItems) {
                  const product = item.product || item;
                  const weight =
                    selectedWeights[product._id] || product.weightOptions?.[0];
                  await handleAddToCart(product, weight?.weight, 1);
                }
              }}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-emerald-600 hover:to-emerald-700 transition-all flex items-center gap-2"
              disabled={availableItems.length === 0}
            >
              <ShoppingCart className="w-5 h-5" />
              Add All to Cart
            </button>
          </div>
        </div>
      )}

      {/* Floating Cart Button (Mobile) */}
      {cartReduxCount > 0 && !availableItems.length && (
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

        /* Smooth transitions for all interactive elements */
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

        /* Enhanced hover effects */
        .group:hover .group-hover\\:scale-105 {
          transform: scale(1.05);
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .grid-cols-2 > * {
            min-height: 320px;
          }
        }

        /* Scrollbar styling */
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }

        .overflow-y-auto::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }

        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
      `}</style>
    </div>
  );
};

export default WishlistPage;
