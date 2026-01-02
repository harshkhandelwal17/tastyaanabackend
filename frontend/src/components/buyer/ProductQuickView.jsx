import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShoppingCart,
  Heart,
  Star,
  Plus,
  Minus,
  Truck,
  Shield,
  Clock,
  Check,
  Leaf,
  Award,
  Gift,
  MapPin,
  CheckCircle,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addToCartAPI } from "../../redux/cartSlice";
import {
  addToWishlistAPI,
  removeFromWishlistAPI,
} from "../../redux/wishlistSlice";
import { toast } from "react-hot-toast";
import axios from "axios";

const Badge = ({ type }) => {
  const badgeConfig = {
    "Premium Royal": {
      icon: <Award className="w-3 h-3 md:w-4 md:h-4" />,
      color: "bg-purple-100 text-purple-800",
    },
    "Master Crafted": {
      icon: <Award className="w-3 h-3 md:w-4 md:h-4" />,
      color: "bg-blue-100 text-blue-800",
    },
    "Gift Special": {
      icon: <Gift className="w-3 h-3 md:w-4 md:h-4" />,
      color: "bg-pink-100 text-pink-800",
    },
    "Regional Special": {
      icon: <MapPin className="w-3 h-3 md:w-4 md:h-4" />,
      color: "bg-green-100 text-green-800",
    },
    "Festival Special": {
      icon: <Gift className="w-3 h-3 md:w-4 md:h-4" />,
      color: "bg-red-100 text-red-800",
    },
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-medium ${
        badgeConfig[type]?.color || "bg-gray-100 text-gray-800"
      }`}
    >
      {badgeConfig[type]?.icon}
      <span className="ml-1">{type}</span>
    </span>
  );
};

const ProductQuickView = ({ isOpen, onClose, productId }) => {
  const dispatch = useDispatch();
  const wishlist = useSelector((state) => state.wishlist.items);
  const authUser = useSelector((state) => state.auth?.user);

  const [product, setProduct] = useState(null);
  const [selectedWeight, setSelectedWeight] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  useEffect(() => {
    if (isOpen && productId) {
      fetchProduct();
    }
    return () => {
      // Reset state when modal closes
      setProduct(null);
      setSelectedWeight(null);
      setQuantity(1);
      setSelectedImageIndex(0);
      setLoading(true);
      setError(null);
      setAddedToCart(false);
    };
  }, [isOpen, productId]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/products/${productId}`);
      setProduct(response.data.product);

      // Set default weight option
      if (response.data.product.weightOptions?.length > 0) {
        setSelectedWeight(response.data.product.weightOptions[0]);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch product");
      toast.error("Failed to load product details");
    } finally {
      setLoading(false);
    }
  };

  // Check if product is in wishlist
  const isInWishlist = wishlist?.items?.some(
    (item) => item._id === product?._id || item.id === product?._id
  );

  const handleAddToCart = async () => {
    if (!authUser) {
      toast.error("Please login to add items to cart");
      onClose();
      return;
    }
    if (!product || !selectedWeight) return;
    try {
      const payload = {
        productId: product._id,
        payload: { weight: selectedWeight.weight },
        quantity,
      };
      dispatch(addToCartAPI(payload));
      setAddedToCart(true);
      toast.success("Product added to cart successfully!");
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (error) {
      toast.error("Failed to add product to cart");
    }
  };

  const handleToggleWishlist = async () => {
    try {
      if (!authUser) {
        toast.info("Please login to add items to wishlist");
        onClose();
        return;
      }
      if (isInWishlist) {
        dispatch(removeFromWishlistAPI(product._id));
        toast.success("Removed from wishlist!");
      } else {
        dispatch(addToWishlistAPI({ _id: product._id }));
        toast.success("Added to wishlist!");
      }
    } catch {
      toast.error("Wishlist action failed");
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={onClose}
              aria-hidden="true"
            ></div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="inline-block w-full max-w-4xl overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle"
            >
              <div className="absolute top-0 right-0 pt-4 pr-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-400 bg-white rounded-md hover:text-gray-500 focus:outline-none"
                >
                  <span className="sr-only">Close</span>
                  <X className="w-6 h-6" />
                </button>
              </div>

              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
                </div>
              ) : error ? (
                <div className="p-6 text-center">
                  <div className="text-red-500 mb-4">{error}</div>
                  <button
                    onClick={onClose}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : product ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                  {/* Product Images */}
                  <div>
                    <div className="mb-4 relative">
                      <img
                        src={
                          product.images[selectedImageIndex]?.url ||
                          (
                            product.images.find((img) => img.isPrimary) ||
                            product.images[0]
                          )?.url
                        }
                        alt={
                          product.images[selectedImageIndex]?.alt ||
                          product.name
                        }
                        className="w-full h-64 object-cover rounded-lg shadow-md"
                      />
                      {/* Badge */}
                      {product.badge && (
                        <div className="absolute top-2 left-2">
                          <Badge type={product.badge} />
                        </div>
                      )}
                      {/* Flags */}
                      <div className="absolute top-2 right-2 flex flex-col space-y-1">
                        {product.isNew && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                            New
                          </span>
                        )}
                        {product.isBestseller && (
                          <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-medium">
                            Bestseller
                          </span>
                        )}
                        {product.isOrganic && (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full text-xs font-medium flex items-center">
                            <Leaf className="w-3 h-3 mr-1" /> Organic
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Image thumbnails */}
                    {product.images.length > 1 && (
                      <div className="flex space-x-2 overflow-x-auto pb-2">
                        {product.images.map((image, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImageIndex(index)}
                            className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all duration-300 ${
                              selectedImageIndex === index
                                ? "border-orange-600 shadow-lg scale-105"
                                : "border-gray-300 hover:border-orange-300"
                            }`}
                          >
                            <img
                              src={image.url}
                              alt={image.alt || `${product.name} ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div>
                    <div className="mb-4">
                      <h1 className="text-xl font-bold text-gray-800 mb-2">
                        {product.name}
                      </h1>
                      {product.shortDescription && (
                        <p className="text-gray-600 mb-4 text-sm">
                          {product.shortDescription}
                        </p>
                      )}

                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < Math.floor(product.ratings.average)
                                  ? "text-yellow-400 fill-current"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-gray-600 text-sm">
                          {product.ratings.average.toFixed(1)} (
                          {product.ratings.count} ratings)
                        </span>
                      </div>

                      {/* Weight Options */}
                      {product.weightOptions &&
                        product.weightOptions.length > 0 && (
                          <div className="mb-4">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">
                              Weight Options
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {product.weightOptions.map((option, index) => (
                                <button
                                  key={index}
                                  onClick={() => setSelectedWeight(option)}
                                  className={`px-3 py-1 border rounded-full text-sm transition-colors ${
                                    selectedWeight?.weight === option.weight
                                      ? "border-orange-600 bg-orange-50 text-orange-600"
                                      : "border-gray-300 text-gray-700 hover:border-orange-300"
                                  }`}
                                >
                                  {option.weight}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Price */}
                      <div className="mb-4">
                        {selectedWeight && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xl font-bold text-gray-900">
                              ₹{selectedWeight.price}
                            </span>
                            {selectedWeight.originalPrice >
                              selectedWeight.price && (
                              <span className="text-sm text-gray-500 line-through">
                                ₹{selectedWeight.originalPrice}
                              </span>
                            )}
                            {selectedWeight.originalPrice >
                              selectedWeight.price && (
                              <span className="text-sm font-medium text-green-600">
                                {Math.round(
                                  ((selectedWeight.originalPrice -
                                    selectedWeight.price) /
                                    selectedWeight.originalPrice) *
                                    100
                                )}
                                % off
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quantity */}
                      <div className="mb-6">
                        <h3 className="text-sm font-medium text-gray-700 mb-2">
                          Quantity
                        </h3>
                        <div className="flex items-center border border-gray-300 rounded-lg w-max">
                          <button
                            onClick={() =>
                              setQuantity(Math.max(1, quantity - 1))
                            }
                            className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                            disabled={quantity <= 1}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 py-1 text-gray-800 font-medium">
                            {quantity}
                          </span>
                          <button
                            onClick={() => setQuantity(quantity + 1)}
                            className="px-3 py-1 text-gray-600 hover:bg-gray-100"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Features */}
                      <div className="flex items-center gap-4 mb-6 text-xs text-gray-600">
                        <div className="flex items-center">
                          <Truck className="w-3 h-3 mr-1" />
                          <span>Free Delivery</span>
                        </div>
                        <div className="flex items-center">
                          <Shield className="w-3 h-3 mr-1" />
                          <span>Quality Assured</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddToCart}
                          disabled={!product.inStock}
                          className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-all duration-300 ${
                            addedToCart
                              ? "bg-green-600 text-white"
                              : !product.inStock
                              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                              : "bg-green-500 text-white hover:bg-green-600 hover:shadow-lg"
                          }`}
                        >
                          {addedToCart ? (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Added
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-4 h-4" />
                              Add to Cart
                            </>
                          )}
                        </button>

                        <button
                          onClick={handleToggleWishlist}
                          className={`p-2 border rounded-lg transition-colors ${
                            isInWishlist
                              ? "border-red-300 bg-red-50 text-red-600"
                              : "border-gray-300 hover:bg-gray-50 text-gray-600"
                          }`}
                        >
                          <Heart
                            className={`w-5 h-5 ${
                              isInWishlist ? "fill-current" : ""
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center">
                  <div className="text-gray-500 mb-4">
                    Product information not available
                  </div>
                  <button
                    onClick={onClose}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ProductQuickView;
