import React, { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart,
  Heart,
  Star,
  Plus,
  Minus,
  ArrowLeft,
  Truck,
  Shield,
  Clock,
  Check,
  Leaf,
  Award,
  Gift,
  MapPin,
  Share2,
  Zap,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Play,
  Video,
} from "lucide-react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { addToCartAPI } from "../../redux/cartSlice";
import {
  addToWishlistAPI,
  removeFromWishlistAPI,
  fetchWishlist,
} from "../../redux/wishlistSlice";
import { useOptimizedCart } from "../../hooks/useOptimizedCart";
import ProductReviewsSystem from "../../components/buyer/productReviewSystem";
import { useOptimizedWishlist } from "../../hooks/useOptimizedWishlist";

// Simple Badge Component
const Badge = ({ type }) => {
  const badgeConfig = {
    "Premium Royal": { color: "bg-purple-500 text-white" },
    "Master Crafted": { color: "bg-blue-500 text-white" },
    "Gift Special": { color: "bg-pink-500 text-white" },
    "Regional Special": { color: "bg-emerald-500 text-white" },
    "Festival Special": { color: "bg-red-500 text-white" },
  };

  return (
    <span
      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold shadow-lg ${
        badgeConfig[type]?.color || "bg-gray-500 text-white"
      }`}
    >
      {type}
    </span>
  );
};

const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const wishlist = useSelector((state) => state.wishlist.items);
  const { toggleWishlist, getHeartIconProps } = useOptimizedWishlist();
  const [product, setProduct] = useState(null);
  const [selectedWeight, setSelectedWeight] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [activeMediaType, setActiveMediaType] = useState("images"); // "images" or "videos"
  const [activeTab, setActiveTab] = useState("description");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [collegeName, setCollegeName] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [isImageZoomed, setIsImageZoomed] = useState(false);

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
  const authUser = useSelector((state) => state.auth?.user);

  // Cart state
  const { totalQuantity: cartCount } = useOptimizedCart();

  // Fetch product data
  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/products/${productId}`);
      setProduct(response.data.product);

      if (response.data.product.weightOptions?.length > 0) {
        setSelectedWeight(response.data.product.weightOptions[0]);
      }

      const relatedResponse = await axios.get(`${BACKEND_URL}/products`);
      setRelatedProducts(relatedResponse.data.products.slice(0, 4));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch product");
      toast.error("Failed to load product details", { duration: 2000 });
    } finally {
      setLoading(false);
    }
  }, [productId, BACKEND_URL]);

  useEffect(() => {
    fetchProduct();
    dispatch(fetchWishlist());
  }, [fetchProduct, dispatch]);

  const isInWishlist = wishlist?.items?.some(
    (item) => item._id === product?._id || item.id === product?._id
  );

  const handleAddToCart = async () => {
    if (!authUser) {
      toast("Please login to add items to cart", { duration: 2000 });
      navigate("/login");
      return;
    }
    if (!product || !selectedWeight) return;

    // Check time restrictions if they exist
    if (product.timeRestrictions) {
      const now = new Date();
      const currentHours = now.getHours();
      const currentMinutes = now.getMinutes();
      const currentTotalMinutes = currentHours * 60 + currentMinutes;

      const [startHours, startMinutes] = product.timeRestrictions.start
        .split(":")
        .map(Number);
      const [endHours, endMinutes] = product.timeRestrictions.end
        .split(":")
        .map(Number);

      const startTotalMinutes = startHours * 60 + startMinutes;
      const endTotalMinutes = endHours * 60 + endMinutes;

      const isAllowed =
        currentTotalMinutes >= startTotalMinutes &&
        currentTotalMinutes <= endTotalMinutes;

      if (!isAllowed) {
        toast.error(
          `This product can only be ordered between ${product.timeRestrictions.start} and ${product.timeRestrictions.end}`,
          { duration: 5000 }
        );
        return;
      }
    }

    const isCollegeBranded =
      product?.title?.toLowerCase().includes("college") ||
      product?.name?.toLowerCase().includes("college") ||
      product?.tags?.some((tag) => tag.toLowerCase().includes("college"));

    if (isCollegeBranded) {
      setShowCollegeModal(true);
      return;
    }

    try {
      const payload = {
        productId: product._id,
        payload: {
          weight: selectedWeight.weight,
          timeRestrictions: product.timeRestrictions, // Include time restrictions in payload
        },
        quantity,
      };
      dispatch(addToCartAPI(payload));
      toast.success("Product added to cart successfully!", { duration: 2000 });
    } catch (error) {
      // Error toast will be shown by the cart slice
    }
  };

  const handleCollegeSubmit = async () => {
    if (!collegeName.trim()) {
      toast("Please enter your college name", { duration: 2000 });
      return;
    }

    try {
      const payload = {
        productId: product._id,
        payload: {
          weight: selectedWeight.weight,
          collegeName: collegeName.trim(),
        },
        quantity,
      };
      dispatch(addToCartAPI(payload));
      toast.success("Product added to cart successfully!", { duration: 2000 });
      setShowCollegeModal(false);
      setCollegeName("");
    } catch (error) {
      toast.error("Failed to add product to cart", { duration: 2000 });
    }
  };

  // const handleToggleWishlist = async () => {
  //   try {
  //     if (!authUser) {
  //       toast("Please login to add items to wishlist", { duration: 2000 });
  //       navigate("/login");
  //       return;
  //     }
  //     if (isInWishlist) {
  //       dispatch(removeFromWishlistAPI(product._id));
  //       toast.success("Removed from wishlist!", { duration: 2000 });
  //     } else {
  //       dispatch(addToWishlistAPI({ _id: product._id }));
  //       toast.success("Added to wishlist!", { duration: 2000 });
  //     }
  //   } catch {
  //     toast.error("Wishlist action failed", { duration: 2000 });
  //   }
  // };

  const nextImage = () => {
    if (product?.images?.length > 1) {
      setSelectedImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product?.images?.length > 1) {
      setSelectedImageIndex(
        (prev) => (prev - 1 + product.images.length) % product.images.length
      );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl shadow-lg text-center max-w-md w-full">
          <div className="text-red-500 mb-4 font-semibold">{error}</div>
          <button
            onClick={() => navigate(-1)}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl hover:bg-emerald-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const totalPrice = selectedWeight ? selectedWeight.price * quantity : 0;
  const discountPrice = selectedWeight
    ? selectedWeight.originalPrice * quantity
    : 0;
  const discountPercentage = selectedWeight
    ? Math.round(
        ((selectedWeight.originalPrice - selectedWeight.price) /
          selectedWeight.originalPrice) *
          100
      )
    : 0;

  const primaryImage =
    product.images.find((img) => img.isPrimary) || product.images[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-600 rounded-xl flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg font-bold text-gray-800">Tastyaana</h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowImageModal(true)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <Eye className="w-5 h-5 text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="pt-4 pb-20 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Product Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-8 mb-8">
            {/* Enhanced Images Section */}
            <div className="lg:col-span-2 space-y-4">
              {/* Main Image/Video Container */}
              <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden group">
                <div className="relative aspect-square lg:aspect-[3/4] overflow-hidden">
                  {activeMediaType === "images" ? (
                    <img
                      src={
                        product.images[selectedImageIndex]?.url ||
                        primaryImage.url
                      }
                      alt={
                        product.images[selectedImageIndex]?.alt || product.name
                      }
                      className={`w-full h-full object-cover transition-all duration-500 cursor-zoom-in ${
                        isImageZoomed
                          ? "scale-150"
                          : "scale-100 group-hover:scale-105"
                      }`}
                      onClick={() => setIsImageZoomed(!isImageZoomed)}
                    />
                  ) : activeMediaType === "videos" &&
                    product.videos &&
                    product.videos.length > 0 ? (
                    <div className="relative w-full h-full">
                      <video
                        src={product.videos[selectedVideoIndex]?.url}
                        className="w-full h-full object-cover cursor-pointer"
                        controls
                        preload="metadata"
                        onClick={() => setShowVideoModal(true)}
                      />
                      <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
                        Video {selectedVideoIndex + 1} / {product.videos.length}
                      </div>
                    </div>
                  ) : (
                    <img
                      src={
                        product.images[selectedImageIndex]?.url ||
                        primaryImage.url
                      }
                      alt={
                        product.images[selectedImageIndex]?.alt || product.name
                      }
                      className={`w-full h-full object-cover transition-all duration-500 cursor-zoom-in ${
                        isImageZoomed
                          ? "scale-150"
                          : "scale-100 group-hover:scale-105"
                      }`}
                      onClick={() => setIsImageZoomed(!isImageZoomed)}
                    />
                  )}

                  {/* Media Navigation Arrows */}
                  {((activeMediaType === "images" &&
                    product.images.length > 1) ||
                    (activeMediaType === "videos" &&
                      product.videos &&
                      product.videos.length > 1)) && (
                    <>
                      <button
                        onClick={
                          activeMediaType === "images"
                            ? prevImage
                            : () =>
                                setSelectedVideoIndex((prev) =>
                                  prev === 0
                                    ? product.videos.length - 1
                                    : prev - 1
                                )
                        }
                        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110"
                      >
                        <ChevronLeft className="w-6 h-6 text-gray-700" />
                      </button>
                      <button
                        onClick={
                          activeMediaType === "images"
                            ? nextImage
                            : () =>
                                setSelectedVideoIndex(
                                  (prev) => (prev + 1) % product.videos.length
                                )
                        }
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110"
                      >
                        <ChevronRight className="w-6 h-6 text-gray-700" />
                      </button>
                    </>
                  )}

                  {/* Zoom/Fullscreen Indicator */}
                  <div className="absolute bottom-4 left-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    {activeMediaType === "images" ? (
                      <>
                        <ZoomIn className="w-3 h-3" />
                        Click to zoom
                      </>
                    ) : (
                      <>
                        <Eye className="w-3 h-3" />
                        Click to view fullscreen
                      </>
                    )}
                  </div>

                  {/* Image Counter */}
                  {product.images.length > 1 && (
                    <div className="absolute bottom-4 right-4 bg-black/60 text-white px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm">
                      {selectedImageIndex + 1} / {product.images.length}
                    </div>
                  )}

                  {/* Enhanced Badges */}
                  <div className="absolute top-6 left-6 space-y-2">
                    {product.badge && <Badge type={product.badge} />}
                    {product.isNew && (
                      <span className="block bg-emerald-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                        New Arrival
                      </span>
                    )}
                    {product.isBestseller && (
                      <span className="block bg-orange-500 text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-lg">
                        Bestseller
                      </span>
                    )}
                    {product.isOrganic && (
                      <span className="bg-green-500 text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                        <Leaf className="w-3 h-3" /> Organic
                      </span>
                    )}
                  </div>

                  {/* Enhanced Wishlist Button */}
                  <button
                    onClick={() => {
                      toggleWishlist(product);
                    }}
                    className={`absolute top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all transform hover:scale-110 ${
                      isInWishlist
                        ? "bg-red-500 text-white"
                        : "bg-white/90 backdrop-blur-sm text-gray-600 hover:text-red-500 hover:bg-white"
                    }`}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        getHeartIconProps(product._id || product.id).icon
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Enhanced Thumbnail Gallery - Images */}
              {activeMediaType === "images" && product.images.length > 1 && (
                <div className="grid grid-cols-4 lg:grid-cols-3 gap-3 pb-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImageIndex(index)}
                      className={`aspect-square rounded-xl overflow-hidden border-3 transition-all hover:scale-105 ${
                        selectedImageIndex === index
                          ? "border-emerald-500 shadow-lg scale-105"
                          : "border-gray-200 hover:border-emerald-300"
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

              {/* Media Type Selector */}
              {product.videos && product.videos.length > 0 && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setActiveMediaType("images")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeMediaType === "images"
                        ? "bg-emerald-500 text-white shadow-lg"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    Photos ({product.images?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveMediaType("videos")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeMediaType === "videos"
                        ? "bg-emerald-500 text-white shadow-lg"
                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    Videos ({product.videos?.length || 0})
                  </button>
                </div>
              )}

              {/* Video Thumbnails Gallery */}
              {activeMediaType === "videos" &&
                product.videos &&
                product.videos.length > 0 && (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 pb-2">
                    {product.videos.map((video, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          setSelectedVideoIndex(index);
                          setShowVideoModal(true);
                        }}
                        className={`aspect-video rounded-xl overflow-hidden border-3 transition-all hover:scale-105 relative group ${
                          selectedVideoIndex === index
                            ? "border-emerald-500 shadow-lg scale-105"
                            : "border-gray-200 hover:border-emerald-300"
                        }`}
                      >
                        <video
                          src={video.url}
                          className="w-full h-full object-cover"
                          preload="metadata"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center group-hover:bg-opacity-50 transition-all">
                          <Play className="w-8 h-8 text-white" fill="white" />
                        </div>
                        <div className="absolute bottom-2 left-2">
                          <span className="bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                            Video {index + 1}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

              {/* Additional Product Info for Large Screens */}
              <div className="hidden lg:block bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
                <h3 className="font-bold text-gray-800 mb-4">
                  Product Highlights
                </h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-gray-600 text-sm">
                      Fresh & high quality ingredients
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-gray-600 text-sm">
                      Traditional authentic taste
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-gray-600 text-sm">
                      Hygienically prepared
                    </span>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <span className="text-gray-600 text-sm">
                      Same day delivery available
                    </span>
                  </li>
                </ul>
              </div>

              {/* Delivery Info for Large Screens */}
              <div className="hidden lg:block bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-emerald-800">
                      Fast Delivery
                    </h4>
                    <p className="text-emerald-600 text-sm">
                      Get it delivered quickly
                    </p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-emerald-700">Standard delivery:</span>
                    <span className="font-semibold text-emerald-800">
                      2-4 hours
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-700">Express delivery:</span>
                    <span className="font-semibold text-emerald-800">
                      30-60 mins
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-emerald-700">
                      Free delivery above:
                    </span>
                    <span className="font-semibold text-emerald-800">₹500</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Product Info */}
            <div className="lg:col-span-3 space-y-6">
              {/* Title & Brand */}
              <div>
                <p className="text-emerald-600 font-semibold text-sm uppercase tracking-wide mb-2">
                  {product.brand || "Tastyaana"}
                </p>
                <h1 className="text-xl lg:text-2xl font-bold text-gray-800 mb-3 leading-tight">
                  {product.name}
                </h1>
                {product.shortDescription && (
                  <p className="text-gray-600 leading-relaxed">
                    {product.shortDescription}
                  </p>
                )}
              </div>

              {/* Enhanced Rating */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                    <Star className="w-4 h-4 text-emerald-600 fill-current" />
                    <span className="font-bold text-emerald-700">
                      {product?.ratings?.average?.toFixed(1)}
                    </span>
                    <span className="font-bold text-emerald-700">
                      {product?.ratings?.average?.toFixed(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-800 font-semibold">
                      ({product?.ratings?.count} reviews)
                    </p>
                    <p className="text-gray-500 text-xs">Verified purchases</p>
                  </div>
                </div>
              </div>

              {/* Enhanced Tags */}
              {product.tags?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-xl font-medium transition-colors cursor-default"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Enhanced Weight Selection */}
              <div>
                <label className="block text-base font-bold text-gray-800 mb-3">
                  Choose Size:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {product.weightOptions.map((option) => (
                    <button
                      key={option.weight}
                      onClick={() => setSelectedWeight(option)}
                      disabled={option.stock <= 0}
                      className={`relative p-4 border-2 rounded-xl text-center transition-all hover:shadow-lg ${
                        selectedWeight?.weight === option.weight
                          ? "border-emerald-500 bg-emerald-50 shadow-lg scale-105"
                          : "border-gray-200 hover:border-emerald-300 bg-white"
                      } ${
                        option.stock <= 0 ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {option.discount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold shadow-lg">
                          {option.discount.toFixed(2)}% OFF
                        </span>
                      )}
                      <div className="font-bold text-gray-800 mb-2">
                        {option.weight}
                      </div>
                      <div className="text-emerald-600 font-bold text-lg">
                        ₹{option.price}
                      </div>
                      {option.discount > 0 && (
                        <div className="text-gray-500 line-through text-sm mt-1">
                          ₹{option.originalPrice}
                        </div>
                      )}
                      {option.stock <= 0 ? (
                        <div className="text-red-500 text-xs mt-2 font-semibold">
                          Out of Stock
                        </div>
                      ) : (
                        <div className="text-gray-500 text-xs mt-2">
                          {option.stock} left
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enhanced Quantity */}
              <div>
                <label className="block text-base font-bold text-gray-800 mb-3">
                  Quantity:
                </label>
                <div className="flex items-center gap-6">
                  <div className="flex items-center border-2 border-gray-200 rounded-xl bg-white">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-3 hover:bg-gray-50 transition-colors rounded-l-xl"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="text-lg font-bold px-6 py-3 border-x border-gray-200">
                      {quantity}
                    </span>
                    <button
                      onClick={() => {
                        if (!selectedWeight) return;
                        setQuantity(
                          Math.min(selectedWeight.stock, quantity + 1)
                        );
                      }}
                      disabled={
                        !selectedWeight || quantity >= selectedWeight.stock
                      }
                      className="p-3 hover:bg-gray-50 transition-colors disabled:opacity-50 rounded-r-xl"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  {selectedWeight && (
                    <div className="text-gray-600">
                      <span className="font-semibold">
                        {selectedWeight.stock}
                      </span>{" "}
                      available
                    </div>
                  )}
                </div>
              </div>

              {/* Enhanced Price & Add to Cart */}
              <div className="space-y-6 bg-white p-6 rounded-2xl border border-gray-200 shadow-lg">
                <div className="flex items-baseline gap-4 flex-wrap">
                  <span className="text-2xl font-bold text-emerald-600">
                    ₹{totalPrice.toFixed(2)}
                  </span>
                  {discountPercentage > 0 && (
                    <>
                      <span className="text-lg text-gray-500 line-through">
                        ₹{discountPrice.toFixed(2)}
                      </span>
                      <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm font-bold">
                        Save {discountPercentage}% (₹
                        {(discountPrice - totalPrice).toFixed(2)})
                      </span>
                    </>
                  )}
                </div>

                <button
                  onClick={handleAddToCart}
                  disabled={!selectedWeight || selectedWeight.stock <= 0}
                  className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transform hover:scale-[1.02]"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add to Cart
                </button>
              </div>

              {/* Enhanced Features */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <Truck className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-800">
                    {totalPrice > 500 ? "Free" : "Fast"} Delivery
                  </p>
                  {/* <p className="text-xs text-gray-500 mt-1">
                    {totalPrice > 500 ? "No charges" : "₹20 charges"}
                  </p> */}
                </div>
                <div className="text-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <Shield className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-800">
                    Quality Assured
                  </p>
                  <p className="text-xs text-gray-500 mt-1">100% authentic</p>
                </div>
                <div className="text-center p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                  <Clock className="w-5 h-5 text-emerald-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-800">
                    Fast Delivery
                  </p>
                  {/* <p className="text-xs text-gray-500 mt-1">Same day fresh</p> */}
                </div>
              </div>

              {/* Enhanced Stock Status */}
              {selectedWeight && (
                <div
                  className={`p-4 rounded-xl border-2 ${
                    selectedWeight.stock > 0
                      ? "bg-emerald-50 border-emerald-200"
                      : "bg-red-50 border-red-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 rounded-full ${
                        selectedWeight.stock > 0
                          ? "bg-emerald-500 animate-pulse"
                          : "bg-red-500"
                      }`}
                    ></div>
                    <span
                      className={`font-semibold ${
                        selectedWeight.stock > 0
                          ? "text-emerald-700"
                          : "text-red-700"
                      }`}
                    >
                      {selectedWeight.stock > 0
                        ? `In Stock (${selectedWeight.stock} units available)`
                        : "Out of Stock - Will restock soon"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Product Details Tabs */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-8">
            <div className="border-b border-gray-200">
              <nav className="flex">
                {[
                  { id: "description", label: "Description" },
                  {
                    id: "reviews",
                    label: `Reviews (${product?.ratings?.count || 0})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex-1 py-4 px-6 font-semibold transition-all ${
                      activeTab === tab.id
                        ? "text-emerald-600 border-b-4 border-emerald-600 bg-emerald-50"
                        : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === "description" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-4">
                      Product Description
                    </h3>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {product.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-2xl">
                      <h4 className="font-bold text-gray-800 mb-3">
                        Product Details
                      </h4>
                      <ul className="space-y-3">
                        <li className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">
                            Category: {product.category?.name || "Indian Sweet"}
                          </span>
                        </li>
                        {product.subcategory && (
                          <li className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600">
                              Subcategory: {product.subcategory}
                            </span>
                          </li>
                        )}
                        <li className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">
                            Brand: {product.brand || "Tastyaana"}
                          </span>
                        </li>
                        {/* <li className="flex items-start gap-3">
                          <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-600">
                            Shelf Life: {product.shelfLife || "7 days"}
                          </span>
                        </li> */}
                      </ul>
                    </div>
                    {/* <div className="bg-gray-50 p-4 rounded-2xl">
                      <h4 className="font-bold text-gray-800 mb-3">
                        Key Features
                      </h4>
                      <ul className="space-y-3">
                        {[
                          "Fresh ingredients",
                          "Traditional recipe",
                          "Hygienically prepared",
                          "No artificial preservatives",
                        ].map((feature, index) => (
                          <li key={index} className="flex items-start gap-3">
                            <Check className="w-5 h-5 text-emerald-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-600">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div> */}
                  </div>
                </div>
              )}

              {activeTab === "reviews" && (
                <ProductReviewsSystem
                  productId={product._id}
                  productName={product.name}
                  onReviewSubmitted={fetchProduct}
                />
              )}
            </div>
          </div>

          {/* Enhanced Related Products */}
          {relatedProducts.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-800 mb-6">
                You May Also Like
              </h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {relatedProducts.map((relatedProduct) => (
                  <div
                    key={relatedProduct._id}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all cursor-pointer group transform hover:-translate-y-1"
                    onClick={() => navigate(`/products/${relatedProduct._id}`)}
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={
                          relatedProduct.images.find((img) => img.isPrimary)
                            ?.url || relatedProduct.images[0]?.url
                        }
                        alt={relatedProduct.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      {relatedProduct.badge && (
                        <div className="absolute top-3 left-3">
                          <Badge type={relatedProduct.badge} />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors"></div>
                    </div>
                    <div className="p-4">
                      <h4 className="font-bold text-gray-800 mb-3 text-sm line-clamp-2 leading-tight">
                        {relatedProduct.name}
                      </h4>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded-lg">
                          <Star className="w-3 h-3 text-emerald-600 fill-current" />
                          <span className="text-xs font-bold text-emerald-700">
                            {relatedProduct?.ratings?.average?.toFixed(1)}
                          </span>
                        </div>
                        <span className="text-xs text-gray-500">
                          ({relatedProduct?.ratings?.count})
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-emerald-600 font-bold">
                          ₹{relatedProduct.weightOptions[0].price}
                        </span>
                        {relatedProduct.weightOptions[0].discount > 0 && (
                          <span className="text-gray-500 line-through text-sm">
                            ₹{relatedProduct.weightOptions[0].originalPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Enhanced Full Screen Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-6xl w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 z-10 w-12 h-12 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Image Navigation */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Main Image */}
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src={
                  product.images[selectedImageIndex]?.url || primaryImage.url
                }
                alt={product.images[selectedImageIndex]?.alt || product.name}
                className="max-w-full max-h-full object-contain rounded-2xl"
              />

              {/* Image Info */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
                {selectedImageIndex + 1} / {product.images.length}
              </div>
            </div>

            {/* Thumbnail Strip */}
            {product.images.length > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 bg-black/60 backdrop-blur-sm p-3 rounded-2xl">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? "border-white scale-110"
                        : "border-white/30 hover:border-white/60"
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
        </div>
      )}

      {/* Enhanced Full Screen Video Modal */}
      {showVideoModal && product.videos && product.videos.length > 0 && (
        <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-6xl w-full h-full flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={() => setShowVideoModal(false)}
              className="absolute top-4 right-4 z-10 w-12 h-12 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Video Navigation */}
            {product.videos.length > 1 && (
              <>
                <button
                  onClick={() =>
                    setSelectedVideoIndex((prev) =>
                      prev === 0 ? product.videos.length - 1 : prev - 1
                    )
                  }
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() =>
                    setSelectedVideoIndex(
                      (prev) => (prev + 1) % product.videos.length
                    )
                  }
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 rounded-full flex items-center justify-center transition-all"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Main Video */}
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                src={product.videos[selectedVideoIndex]?.url}
                className="max-w-full max-h-full object-contain rounded-2xl"
                controls
                autoPlay
                preload="metadata"
              />

              {/* Video Info */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm backdrop-blur-sm">
                Video {selectedVideoIndex + 1} / {product.videos.length}
              </div>
            </div>

            {/* Video Thumbnail Strip */}
            {product.videos.length > 1 && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-2 bg-black/40 p-2 rounded-xl backdrop-blur-sm">
                {product.videos.map((video, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedVideoIndex(index)}
                    className={`relative aspect-video w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedVideoIndex === index
                        ? "border-white"
                        : "border-white/30 hover:border-white/60"
                    }`}
                  >
                    <video
                      src={video.url}
                      className="w-full h-full object-cover"
                      preload="metadata"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                      <Play className="w-3 h-3 text-white" fill="white" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* College Modal */}
      {showCollegeModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800">
                College Information
              </h3>
              <button
                onClick={() => {
                  setShowCollegeModal(false);
                  setCollegeName("");
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

      {/* Enhanced Mobile Bottom Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-40 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="text-lg font-bold text-emerald-600">
              ₹{totalPrice.toFixed(2)}
            </div>
            {discountPercentage > 0 && (
              <div className="text-sm text-gray-500 line-through">
                ₹{discountPrice.toFixed(2)}
              </div>
            )}
          </div>
          <button
            onClick={() => {
              toggleWishlist(product);
            }}
            className={`p-3 rounded-xl border-2 transition-all ${
              isInWishlist
                ? "border-red-500 bg-red-500 text-white"
                : "border-gray-200 text-gray-600 hover:border-red-500 hover:text-red-500"
            }`}
          >
            <Heart
              className={`w-3.5 h-3.5 ${
                getHeartIconProps(product._id || product.id).icon
              }`}
            />
          </button>
          <button
            onClick={handleAddToCart}
            disabled={!selectedWeight || selectedWeight.stock <= 0}
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg"
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>
        </div>
      </div>

      <style jsx>{`
        .animate-slide-in-left {
          animation: slideInLeft 0.6s ease-out;
        }

        .animate-slide-in-right {
          animation: slideInRight 0.6s ease-out;
        }

        .animate-fade-in {
          animation: fadeIn 0.8s ease-out;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .cursor-zoom-in {
          cursor: zoom-in;
        }

        .border-3 {
          border-width: 3px;
        }

        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Enhanced hover effects */
        .group:hover .group-hover\:scale-110 {
          transform: scale(1.1);
        }

        .group:hover .group-hover\:opacity-100 {
          opacity: 1;
        }

        /* Smooth transitions for all elements */
        * {
          transition-property: transform, opacity, background-color,
            border-color, color, box-shadow;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 300ms;
        }
      `}</style>

      {/* Floating Cart Button (Mobile) */}
      {cartCount > 0 && (
        <button
          onClick={() => navigate("/cart")}
          className="fixed bottom-15 xs:bottom-6 right-2 xs:right-4 xl:hidden bg-emerald-500 text-white p-2 xs:p-3 sm:p-4 rounded-xl xs:rounded-2xl shadow-2xl hover:bg-emerald-600 transition-all z-40 animate-bounce"
        >
          <div className="flex items-center gap-1.5 xs:gap-2 sm:gap-3">
            <ShoppingCart className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6" />
            <div className="text-left hidden xs:block">
              <p className="text-xs font-medium">View Cart</p>
              <p className="text-sm font-bold">{cartCount} items</p>
            </div>
            <div className="text-center xs:hidden">
              <p className="text-xs font-bold">{cartCount}</p>
            </div>
          </div>
        </button>
      )}
    </div>
  );
};

export default ProductDetailPage;
