import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
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
  ArrowRight,
  Loader2,
  CheckCircle,
  Home,
  ChevronLeft,
  Trash2,
  Heart as HeartIcon,
} from "lucide-react";
import {
  fetchWishlist,
  removeFromWishlist as removeFromWishlistAction,
  removeFromWishlistAPI,
} from "../../redux/wishlistSlice";
import { addToCartAPI } from "../../redux/cartSlice";

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

// Wishlist Item Component
const WishlistItem = ({
  wishlistItem,
  onAddToCart = () => {},
  onRemove = () => {},
  onNavigateToProduct = () => {},
  index = 0,
}) => {
  const authUser = useSelector((state) => state.auth?.user);
  const navigate = useNavigate();
  const [selectedWeight, setSelectedWeight] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const product = wishlistItem.product || wishlistItem;
  const weightOptions = product.weightOptions || [];
  const selectedWeightData = weightOptions[selectedWeight] || {};
  const inStock = product.stock > 0;
  const hasWeightOptions = weightOptions.length > 0;

  const handleAddToCart = async () => {
    if (!authUser) {
      toast.info("Please login to add items to cart");
      navigate("/login");
      return;
    }

    try {
      setIsAddingToCart(true);
      await onAddToCart({
        ...product,
        selectedWeight: selectedWeightData.weight,
        selectedPrice: selectedWeightData.price || product.price,
        quantity,
      });
      toast.success("Added to cart successfully!");
    } catch (error) {
      toast.error("Failed to add to cart. Please try again.");
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleRemove = async () => {
    try {
      setIsRemoving(true);
      await onRemove(product._id);
      toast.success("Removed from wishlist");
    } catch (error) {
      toast.error("Failed to remove from wishlist");
      setIsRemoving(false);
    }
  };

  const incrementQuantity = () => {
    if (quantity < 10) {
      setQuantity((prev) => prev + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
    }
  };

  return (
    <motion.div
      className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow duration-200"
      variants={itemVariants}
      custom={index}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
    >
      <div className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Product Image */}
          <div
            className="relative w-full sm:w-24 h-32 sm:h-24 rounded-lg overflow-hidden bg-gray-50 flex-shrink-0 cursor-pointer"
            onClick={() => onNavigateToProduct(product._id)}
          >
            <img
              src={product.images?.[0] || "/placeholder-product.jpg"}
              alt={product.name}
              className="w-full h-full object-cover"
            />
            {product.discount > 0 && (
              <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
                -{product.discount}%
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex-1 flex flex-col">
            <div className="flex justify-between items-start">
              <h3
                className="font-medium text-gray-900 line-clamp-2 cursor-pointer hover:text-primary-600"
                onClick={() => onNavigateToProduct(product._id)}
              >
                {product.name}
              </h3>
              <button
                onClick={handleRemove}
                disabled={isRemoving}
                className="text-gray-400 hover:text-red-500 transition-colors p-1 -mt-1 -mr-1"
                aria-label="Remove from wishlist"
              >
                {isRemoving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <X className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Rating */}
            <div className="flex items-center mt-1">
              <div className="flex text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-3 h-3 sm:w-4 sm:h-4 ${
                      star <= (product.rating || 0) ? "fill-current" : ""
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-500 ml-1">
                ({product.reviewCount || 0})
              </span>
            </div>

            {/* Price */}
            <div className="mt-1">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-gray-900">
                  $
                  {selectedWeightData.price
                    ? selectedWeightData.price.toFixed(2)
                    : product.price?.toFixed(2) || "0.00"}
                </span>
                {product.originalPrice &&
                  product.originalPrice >
                    (selectedWeightData.price || product.price) && (
                    <span className="text-sm text-gray-500 line-through">
                      ${product.originalPrice.toFixed(2)}
                    </span>
                  )}
              </div>
              {product.discount > 0 && (
                <span className="text-xs text-red-600 font-medium">
                  {product.discount}% OFF
                </span>
              )}
            </div>

            {/* Weight Options */}
            {hasWeightOptions && (
              <div className="mt-2">
                <label className="text-xs font-medium text-gray-700 mb-1 block">
                  Weight:
                </label>
                <div className="flex flex-wrap gap-2">
                  {weightOptions.map((option, idx) => (
                    <button
                      key={idx}
                      className={`text-xs px-2 py-1 rounded border ${
                        selectedWeight === idx
                          ? "bg-primary-100 border-primary-500 text-primary-700"
                          : "border-gray-300 text-gray-700 hover:border-primary-300"
                      }`}
                      onClick={() => setSelectedWeight(idx)}
                    >
                      {option.weight}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center border border-gray-200 rounded-md">
                <button
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  className="px-2 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-8 text-center text-sm">{quantity}</span>
                <button
                  onClick={incrementQuantity}
                  disabled={quantity >= 10}
                  className="px-2 py-1 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>

              {/* Add to Cart Button */}
              <button
                onClick={handleAddToCart}
                disabled={!inStock || isAddingToCart}
                className={`flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium text-white ${
                  inStock
                    ? "bg-primary-600 hover:bg-primary-700"
                    : "bg-gray-300 cursor-not-allowed"
                }`}
              >
                {isAddingToCart ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Adding...
                  </>
                ) : inStock ? (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-1.5" />
                    Add to Cart
                  </>
                ) : (
                  "Out of Stock"
                )}
              </button>
            </div>

            {/* Stock Status */}
            {!inStock && (
              <div className="mt-2 flex items-center text-red-600 text-xs">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-1.5"></div>
                <span>Out of Stock</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Main Wishlist Page Component
const WishlistPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: wishlist, loading } = useSelector((state) => state.wishlist);
  const authUser = useSelector((state) => state.auth?.user);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  // Fetch wishlist on component mount and when auth state changes
  useEffect(() => {
    if (authUser) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, authUser]);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle add to cart
  const handleAddToCart = async (product) => {
    try {
      await dispatch(
        addToCartAPI({
          productId: product._id,
          quantity: product.quantity || 1,
          weight: product.selectedWeight,
          price: product.selectedPrice || product.price,
        })
      ).unwrap();
      toast.success(`${product.name} added to cart`);
    } catch (error) {
      toast.error(error.message || "Failed to add item to cart");
    }
  };

  // Handle remove from wishlist
  const handleRemoveFromWishlist = async (productId) => {
    try {
      await dispatch(removeFromWishlistAPI(productId)).unwrap();
    } catch (error) {
      throw new Error("Failed to remove from wishlist");
    }
  };

  // Handle navigation to product detail
  const handleNavigateToProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  // Calculate total price of wishlist items
  const calculateTotal = () => {
    return wishlist.reduce((total, item) => {
      const product = item.product || item;
      return total + (product.price || 0);
    }, 0);
  };

  // Handle add all to cart
  const handleAddAllToCart = async () => {
    if (!authUser) {
      toast.info("Please login to add items to cart");
      navigate("/login");
      return;
    }

    try {
      const addToCartPromises = wishlist.map((item) => {
        const product = item.product || item;
        return dispatch(
          addToCartAPI({
            productId: product._id,
            quantity: 1,
            price: product.price,
          })
        );
      });

      await Promise.all(addToCartPromises);
      toast.success("All items added to cart!");
    } catch (error) {
      toast.error("Failed to add some items to cart");
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your wishlist...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (wishlist.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Heart className="w-12 h-12 text-gray-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Your wishlist is empty
          </h2>
          <p className="text-gray-600 mb-8">
            You haven't added any products to your wishlist yet.
          </p>
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <Home className="w-5 h-5 mr-2" />
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24 sm:pb-0">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Wishlist</h1>
              <p className="mt-1 text-sm text-gray-500">
                {wishlist.length} {wishlist.length === 1 ? "item" : "items"} in
                wishlist
              </p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          <AnimatePresence>
            {wishlist.map((item, index) => (
              <WishlistItem
                key={item._id || index}
                wishlistItem={item}
                index={index}
                onAddToCart={handleAddToCart}
                onRemove={handleRemoveFromWishlist}
                onNavigateToProduct={handleNavigateToProduct}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      {isMobileView && wishlist.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg p-4 z-10">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-lg font-bold text-gray-900">
                ${calculateTotal().toFixed(2)}
              </p>
            </div>
            <button
              onClick={handleAddAllToCart}
              className="flex-1 ml-4 bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-md flex items-center justify-center"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add All to Cart
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobileView && wishlist.length > 0 && (
        <div className="hidden md:block fixed right-0 top-0 h-full w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Wishlist Summary
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-gray-600">Items ({wishlist.length})</span>
              <span className="font-medium">
                ${calculateTotal().toFixed(2)}
              </span>
            </div>
            <button
              onClick={handleAddAllToCart}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2.5 px-4 rounded-md flex items-center justify-center mt-4"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              Add All to Cart (${calculateTotal().toFixed(2)})
            </button>
            <button
              onClick={() => navigate("/cart")}
              className="w-full bg-white border border-primary-600 text-primary-600 hover:bg-primary-50 font-medium py-2.5 px-4 rounded-md flex items-center justify-center"
            >
              View Cart
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
