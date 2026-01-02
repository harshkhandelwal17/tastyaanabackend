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
  ChefHat,
  Calendar,
  Users,
  Package,
} from "lucide-react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { addToCartAPI } from "../../redux/cartSlice";
import {
  addItem as addWishlistItem,
  removeItem as removeWishlistItem,
  addToWishlistAPI,
  removeFromWishlistAPI,
  fetchWishlist,
} from "../../redux/wishlistSlice";
import ProductReviewsSystem from "../../components/buyer/productReviewSystem";

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");
  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
};

// Breadcrumb Component
const Breadcrumb = ({ items = [] }) => {
  const navigate = useNavigate();

  return (
    <nav className="mb-4 md:mb-8 font-['Plus_Jakarta_Sans']">
      <ol className="flex space-x-2 text-xs md:text-sm text-gray-600">
        <li>
          <button
            onClick={() => navigate("/")}
            className="hover:text-orange-600 flex items-center transition-colors"
          >
            Home
          </button>
        </li>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <li>/</li>
            <li>
              {item.href ? (
                <button
                  onClick={() => navigate(item.href)}
                  className="hover:text-orange-600 transition-colors"
                >
                  {item.label}
                </button>
              ) : (
                <span className="text-gray-800">{item.label}</span>
              )}
            </li>
          </React.Fragment>
        ))}
      </ol>
    </nav>
  );
};

// Sweet Badge Component
const SweetBadge = ({ type }) => {
  const badgeConfig = {
    "Premium Royal": {
      icon: <Award className="w-3 h-3 md:w-4 md:h-4" />,
      color: "bg-purple-100 text-purple-800",
    },
    "Master Crafted": {
      icon: <ChefHat className="w-3 h-3 md:w-4 md:h-4" />,
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
      icon: <Calendar className="w-3 h-3 md:w-4 md:h-4" />,
      color: "bg-red-100 text-red-800",
    },
    Traditional: {
      icon: <Users className="w-3 h-3 md:w-4 md:h-4" />,
      color: "bg-amber-100 text-amber-800",
    },
  };

  const config = badgeConfig[type] || {
    icon: <Package className="w-3 h-3 md:w-4 md:h-4" />,
    color: "bg-gray-100 text-gray-800",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
    >
      {config.icon}
      {type}
    </span>
  );
};

// Nutrition Info Component for Sweets
const SweetNutritionInfo = ({ nutrition }) => {
  if (!nutrition) return null;

  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 md:p-6 rounded-xl border border-orange-100">
      <h3 className="text-lg font-semibold text-orange-900 mb-4 flex items-center gap-2">
        <Leaf className="w-5 h-5" />
        Nutritional Information
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-700">
            {nutrition.calories}
          </div>
          <div className="text-sm text-orange-600">Calories</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-700">
            {nutrition.sugar}g
          </div>
          <div className="text-sm text-orange-600">Sugar</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-700">
            {nutrition.fat}g
          </div>
          <div className="text-sm text-orange-600">Fat</div>
        </div>
      </div>
    </div>
  );
};

const SweetsDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state
  const { user } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  // Component state
  const [product, setProduct] = useState(null);
  const [selectedWeight, setSelectedWeight] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("description");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [isInWishlist, setIsInWishlist] = useState(false);

  // Fetch product data
  const fetchProduct = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/products/${id}`);
      const productData = response.data;

      setProduct(productData);
      if (productData.weightOptions && productData.weightOptions.length > 0) {
        setSelectedWeight(productData.weightOptions[0]);
      }
      setError(null);
    } catch (err) {
      console.error("Error fetching product:", err);
      setError("Failed to load product details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch reviews
  const fetchReviews = useCallback(async () => {
    try {
      const response = await axios.get(`/api/reviews/product/${id}`);
      setReviews(response.data || []);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  }, [id]);

  // Fetch related products
  const fetchRelatedProducts = useCallback(async () => {
    try {
      if (product?.category) {
        const response = await axios.get(
          `/api/products/category/${product.category}?limit=4`
        );
        const filtered = response.data.filter((p) => p._id !== id);
        setRelatedProducts(filtered.slice(0, 3));
      }
    } catch (err) {
      console.error("Error fetching related products:", err);
    }
  }, [id, product?.category]);

  // Check if product is in wishlist
  useEffect(() => {
    if (user) {
      dispatch(fetchWishlist());
    }
  }, [dispatch, user]);

  useEffect(() => {
    setIsInWishlist(wishlistItems.some((item) => item.product._id === id));
  }, [wishlistItems, id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  useEffect(() => {
    if (product) {
      fetchReviews();
      fetchRelatedProducts();
    }
  }, [product, fetchReviews, fetchRelatedProducts]);

  // Handle add to cart
  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }

    if (!selectedWeight) {
      toast.error("Please select a weight option");
      return;
    }

    try {
      await dispatch(
        addToCartAPI({
          productId: product._id,
          quantity,
          weight: selectedWeight.weight,
          price: selectedWeight.price,
        })
      ).unwrap();

      toast.success(`${product.name} added to cart!`);
    } catch (error) {
      toast.error(error.message || "Failed to add to cart");
    }
  };

  // Handle wishlist toggle
  const handleToggleWishlist = async () => {
    if (!user) {
      toast.error("Please login to manage wishlist");
      navigate("/login");
      return;
    }

    try {
      if (isInWishlist) {
        await dispatch(removeFromWishlistAPI(product._id)).unwrap();
        toast.success("Removed from wishlist");
      } else {
        await dispatch(addToWishlistAPI(product._id)).unwrap();
        toast.success("Added to wishlist");
      }
    } catch (error) {
      toast.error(error.message || "Failed to update wishlist");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-orange-700">Loading sweet details...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🍯</div>
          <h2 className="text-2xl font-bold text-orange-900 mb-2">
            Sweet Not Found
          </h2>
          <p className="text-orange-700 mb-4">
            {error || "This sweet doesn't exist"}
          </p>
          <button
            onClick={() => navigate("/products")}
            className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Browse Other Sweets
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50 font-['Plus_Jakarta_Sans']">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-orange-700 hover:text-orange-900 mb-4 md:mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Sweets
        </button>

        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Sweets", href: "/products" },
            { label: product.name },
          ]}
        />

        {/* Main Product Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 mb-12">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden group">
              {/* Badges */}
              <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                {product.isNew && (
                  <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    New
                  </span>
                )}
                {product.isBestseller && (
                  <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    Bestseller
                  </span>
                )}
                {product.isOrganic && (
                  <span className="bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                    <Leaf className="w-3 h-3" />
                    Organic
                  </span>
                )}
              </div>

              {/* Wishlist Button */}
              <button
                onClick={handleToggleWishlist}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-all duration-200"
              >
                <Heart
                  className={`w-5 h-5 transition-colors ${
                    isInWishlist ? "text-red-500 fill-current" : "text-gray-600"
                  }`}
                />
              </button>

              <img
                src={
                  product.images?.[selectedImageIndex]?.url ||
                  "/api/placeholder/600/600"
                }
                alt={product.images?.[selectedImageIndex]?.alt || product.name}
                className="w-full h-96 md:h-[500px] object-cover group-hover:scale-105 transition-transform duration-300"
              />
            </div>

            {/* Thumbnail Images */}
            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index
                        ? "border-orange-500 shadow-lg"
                        : "border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    <img
                      src={image.url || "/api/placeholder/80/80"}
                      alt={image.alt || `${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Product Name and Badge */}
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold text-orange-900">
                  {product.name}
                </h1>
                {product.badge && <SweetBadge type={product.badge} />}
              </div>
              <p className="text-orange-700 text-lg">
                {product.shortDescription}
              </p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < Math.floor(product.rating?.average || 0)
                        ? "text-yellow-400 fill-current"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-orange-800 font-medium">
                {product.rating?.average?.toFixed(1) || "0.0"}
              </span>
              <span className="text-orange-600">
                ({product.rating?.count || 0} reviews)
              </span>
            </div>

            {/* Weight Options */}
            {product.weightOptions && product.weightOptions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-orange-900 mb-3">
                  Choose Weight
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {product.weightOptions.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedWeight(option)}
                      className={`p-3 rounded-lg border-2 transition-all text-left ${
                        selectedWeight?.weight === option.weight
                          ? "border-orange-500 bg-orange-50"
                          : "border-gray-200 hover:border-orange-300"
                      }`}
                    >
                      <div className="font-medium text-orange-900">
                        {option.weight}
                      </div>
                      <div className="text-sm text-orange-700">
                        ₹{option.price}
                      </div>
                      {option.discount > 0 && (
                        <div className="text-xs text-gray-500 line-through">
                          ₹{option.originalPrice}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price */}
            {selectedWeight && (
              <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100">
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-orange-900">
                    ₹{selectedWeight.price}
                  </div>
                  {selectedWeight.discount > 0 && (
                    <>
                      <div className="text-xl text-gray-500 line-through">
                        ₹{selectedWeight.originalPrice}
                      </div>
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                        {selectedWeight.discount}% OFF
                      </div>
                    </>
                  )}
                </div>
                <div className="text-sm text-orange-600 mt-1">
                  Price for {selectedWeight.weight}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div>
              <h3 className="text-lg font-semibold text-orange-900 mb-3">
                Quantity
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-orange-200 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 hover:bg-orange-50 transition-colors"
                  >
                    <Minus className="w-4 h-4 text-orange-700" />
                  </button>
                  <span className="px-4 py-2 font-medium text-orange-900">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 hover:bg-orange-50 transition-colors"
                  >
                    <Plus className="w-4 h-4 text-orange-700" />
                  </button>
                </div>
                {selectedWeight && (
                  <div className="text-orange-700">
                    Total: ₹{(selectedWeight.price * quantity).toLocaleString()}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleAddToCart}
                disabled={!selectedWeight}
                className="flex-1 bg-orange-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Add to Cart
              </button>
              <button
                onClick={handleToggleWishlist}
                className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  isInWishlist
                    ? "bg-red-100 text-red-700 hover:bg-red-200"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <Heart
                  className={`w-5 h-5 ${isInWishlist ? "fill-current" : ""}`}
                />
                {isInWishlist ? "Saved" : "Save"}
              </button>
            </div>

            {/* Delivery Info */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-orange-100">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Truck className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-medium text-orange-900">
                      Free Delivery
                    </div>
                    <div className="text-sm text-orange-600">Above ₹500</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-medium text-orange-900">
                      Fresh Daily
                    </div>
                    <div className="text-sm text-orange-600">Made fresh</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="font-medium text-orange-900">
                      Quality Assured
                    </div>
                    <div className="text-sm text-orange-600">
                      Premium ingredients
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Information Tabs */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-12">
          {/* Tab Headers */}
          <div className="border-b border-gray-200">
            <div className="flex overflow-x-auto">
              {[
                { id: "description", label: "Description" },
                { id: "ingredients", label: "Ingredients" },
                { id: "nutrition", label: "Nutrition" },
                { id: "storage", label: "Storage" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? "text-orange-600 border-b-2 border-orange-600"
                      : "text-gray-600 hover:text-orange-600"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-6 md:p-8">
            {activeTab === "description" && (
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed text-lg">
                  {product.description}
                </p>
                {product.manufacturer && (
                  <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-semibold text-orange-900 mb-2">
                      Made by
                    </h4>
                    <p className="text-orange-700">
                      {product.manufacturer.name}
                    </p>
                    {product.manufacturer.address && (
                      <p className="text-sm text-orange-600">
                        {product.manufacturer.address}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === "ingredients" && (
              <div>
                <h3 className="text-xl font-semibold text-orange-900 mb-4">
                  Ingredients
                </h3>
                {product.ingredients && product.ingredients.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {product.ingredients.map((ingredient, index) => (
                      <div
                        key={index}
                        className="bg-orange-50 px-3 py-2 rounded-lg text-orange-800"
                      >
                        {ingredient}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">
                    Ingredient information not available.
                  </p>
                )}

                {product.allergens && product.allergens.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-red-900 mb-2">
                      Allergen Information
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {product.allergens.map((allergen, index) => (
                        <span
                          key={index}
                          className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm"
                        >
                          {allergen}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === "nutrition" && (
              <div>
                <SweetNutritionInfo nutrition={product.nutritionInfo} />
              </div>
            )}

            {activeTab === "storage" && (
              <div>
                <h3 className="text-xl font-semibold text-orange-900 mb-4">
                  Storage Instructions
                </h3>
                <div className="space-y-4">
                  {product.storageInstructions && (
                    <p className="text-gray-700 leading-relaxed">
                      {product.storageInstructions}
                    </p>
                  )}
                  {product.shelfLife && (
                    <div className="bg-amber-50 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-amber-600" />
                        <span className="font-semibold text-amber-900">
                          Shelf Life
                        </span>
                      </div>
                      <p className="text-amber-800">
                        {product.shelfLife} days from manufacture
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mb-12">
          <ProductReviewsSystem
            productId={id}
            reviews={reviews}
            onReviewAdded={fetchReviews}
          />
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <h2 className="text-2xl font-bold text-orange-900 mb-6">
              You Might Also Like
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <div
                  key={relatedProduct._id}
                  className="group cursor-pointer"
                  onClick={() => navigate(`/sweets/${relatedProduct._id}`)}
                >
                  <div className="bg-gray-50 rounded-xl overflow-hidden mb-4 group-hover:shadow-lg transition-shadow">
                    <img
                      src={
                        relatedProduct.images?.[0]?.url ||
                        "/api/placeholder/300/200"
                      }
                      alt={relatedProduct.name}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h3 className="font-semibold text-orange-900 mb-2 group-hover:text-orange-700 transition-colors">
                    {relatedProduct.name}
                  </h3>
                  <p className="text-orange-600 text-sm mb-2">
                    {relatedProduct.shortDescription}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-bold text-orange-900">
                      ₹{relatedProduct.weightOptions?.[0]?.price || "N/A"}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">
                        {relatedProduct.rating?.average?.toFixed(1) || "0.0"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SweetsDetailPage;
