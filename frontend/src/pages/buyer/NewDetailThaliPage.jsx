import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import {
  ArrowLeft,
  Heart,
  Star,
  Plus,
  Minus,
  ShoppingCart,
  Clock,
  Users,
  Award,
  Truck,
  Shield,
  Share2,
  Eye,
  Package,
  Leaf,
  ChefHat,
  Utensils,
  Calendar,
  Info,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import axios from 'axios';

// Redux imports
import { addToCartAPI, removeFromCartAPI, fetchCart } from '../../redux/cartSlice';
import { addToWishlistAPI, removeFromWishlistAPI, fetchWishlist } from '../../redux/wishlistSlice';
import { useGetMealPlanByIdQuery } from '../../redux/storee/api';

const NewDetailThaliPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state
  const { isAuthenticated, user } = useSelector((state) => state.auth);
  const { items: cartReduxItems } = useSelector((state) => state.cart);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  // Local state
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWeight, setSelectedWeight] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState('details');
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [itemType, setItemType] = useState(null); // 'product' or 'meal-plan'

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // Try to fetch as meal plan first, then as product
  const { data: mealPlanData, isLoading: mealPlanLoading, error: mealPlanError } = useGetMealPlanByIdQuery(id);

  // Fetch item data
  const fetchItemData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // If meal plan API returned data, use that
      if (mealPlanData && !mealPlanError) {
        setItem(mealPlanData.data.mealPlan);
        setItemType('meal-plan');
        setLoading(false);
        return;
      }

      // Otherwise, try to fetch as product
      const response = await axios.get(`${BACKEND_URL}/products/${id}`);
      setItem(response.data.product);
      setItemType('product');
      
      if (response.data.product.weightOptions?.length > 0) {
        setSelectedWeight(response.data.product.weightOptions[0]);
      }
    } catch (err) {
      console.error('Error fetching item:', err);
      setError(err.response?.data?.message || 'Failed to fetch item details');
    } finally {
      setLoading(false);
    }
  }, [id, mealPlanData, mealPlanError, BACKEND_URL]);

  useEffect(() => {
    fetchItemData();
    dispatch(fetchWishlist());
    dispatch(fetchCart());
  }, [fetchItemData, dispatch]);

  // Check if item is in wishlist
  const isInWishlist = wishlistItems?.items?.some(
    (wishItem) => wishItem._id === item?._id || wishItem.id === item?._id
  );

  // Check cart quantity
  const cartItem = cartReduxItems.find(cartItem => {
    if (cartItem.product && (cartItem.product._id === item?._id || cartItem.product.id === item?._id)) return true;
    if (cartItem.productId === item?._id) return true;
    return false;
  });
  const cartQuantity = cartItem ? cartItem.quantity : 0;

  // Handlers
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast("Please login to add items to cart", { duration: 2000 });
      navigate("/login");
      return;
    }

    if (!item) return;

    try {
      let payload;

      if (itemType === 'product') {
        if (!selectedWeight) {
          toast.error("Please select a weight option", { duration: 2000 });
          return;
        }
        payload = {
          productId: item._id,
          payload: { weight: selectedWeight.weight },
          quantity,
        };
      } else {
        // For meal plans - show subscription message
        toast("Meal plan subscriptions coming soon! Individual thali orders available in Daily Orders section.", { duration: 2000 });
        return;
      }

      const result = await dispatch(addToCartAPI(payload));
      
      if (result.type.includes('fulfilled')) {
        toast.success("Added to cart!", { duration: 2000 });
        dispatch(fetchCart());
      } else {
        throw new Error(result.payload || 'Failed to add to cart');
      }
    } catch (error) {
      console.error("Add to cart error:", error);
      toast.error("Failed to add to cart", { duration: 2000 });
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast("Please login to manage your wishlist", { duration: 2000 });
      navigate("/login");
      return;
    }

    try {
      if (isInWishlist) {
        await dispatch(removeFromWishlistAPI(item._id));
        toast.success("Removed from wishlist!", { duration: 2000 });
      } else {
        await dispatch(addToWishlistAPI({ _id: item._id }));
        toast.success("Added to wishlist!", { duration: 2000 });
      }
      dispatch(fetchWishlist());
    } catch (error) {
      console.error("Wishlist error:", error);
      toast.error("Wishlist action failed", { duration: 2000 });
    }
  };

  // Loading state
  if (loading || mealPlanLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading details...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Item Not Found</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/ghar/ka/khana')}
              className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 transition-colors"
            >
              Browse All Items
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Item not found</p>
        </div>
      </div>
    );
  }

  const images = item.images || item.imageUrls || [];
  const currentImage = images[selectedImageIndex]?.url || images[selectedImageIndex] || 
                      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {item.title || item.name}
              </h1>
              <p className="text-sm text-gray-600">
                {itemType === 'product' ? 'Daily Thali' : 'Meal Plan'}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <button
                onClick={handleToggleWishlist}
                className={`p-2 rounded-xl transition-colors ${
                  isInWishlist 
                    ? 'bg-red-100 text-red-600' 
                    : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-600'
                }`}
              >
                <Heart className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`} />
              </button>
              <button className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-2xl overflow-hidden shadow-lg">
              <img
                src={currentImage}
                alt={item.title || item.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=800';
                }}
              />
            </div>
            
            {images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index 
                        ? 'border-emerald-500 ring-2 ring-emerald-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={img.url || img}
                      alt={`${item.title || item.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Title and Rating */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {item.title || item.name}
              </h1>
              <p className="text-gray-600 text-lg leading-relaxed">
                {item.description}
              </p>
              
              {/* Rating */}
              {(item.rating > 0 || item.ratings?.average > 0) && (
                <div className="flex items-center gap-2 mt-4">
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 text-yellow-500 fill-current" />
                    <span className="font-semibold text-gray-900">
                      {item.rating || item.ratings?.average?.toFixed(1)}
                    </span>
                  </div>
                  <span className="text-gray-500">
                    ({item.reviewCount || item.ratings?.count || 0} reviews)
                  </span>
                </div>
              )}
            </div>

            {/* Pricing */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Pricing</h3>
              
              {itemType === 'product' ? (
                <div>
                  {/* Weight Options */}
                  {item.weightOptions?.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Choose Size
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {item.weightOptions.map((option, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedWeight(option)}
                            className={`p-3 rounded-lg border-2 transition-all text-left ${
                              selectedWeight?.weight === option.weight
                                ? 'border-emerald-500 bg-emerald-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="font-semibold">{option.weight}</div>
                            <div className="text-emerald-600 font-bold">₹{option.price}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="text-3xl font-bold text-gray-900">
                    ₹{selectedWeight?.price || item.price}
                  </div>
                  {item.originalPrice && item.originalPrice > (selectedWeight?.price || item.price) && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg text-gray-500 line-through">
                        ₹{item.originalPrice}
                      </span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-semibold">
                        Save ₹{item.originalPrice - (selectedWeight?.price || item.price)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600">1 Day</div>
                      <div className="text-xl font-bold text-gray-900">₹{item.pricing?.oneDay}</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                      <div className="text-sm text-blue-600 font-medium">10 Days</div>
                      <div className="text-xl font-bold text-blue-700">₹{item.pricing?.tenDays}</div>
                      {item.pricing?.discountPercentage?.tenDays > 0 && (
                        <div className="text-xs text-green-600 font-semibold">
                          -{item.pricing.discountPercentage.tenDays}% OFF
                        </div>
                      )}
                    </div>
                    <div className="text-center p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200">
                      <div className="text-sm text-emerald-600 font-medium">30 Days</div>
                      <div className="text-xl font-bold text-emerald-700">₹{item.pricing?.thirtyDays}</div>
                      {item.pricing?.discountPercentage?.thirtyDays > 0 && (
                        <div className="text-xs text-green-600 font-semibold">
                          -{item.pricing.discountPercentage.thirtyDays}% OFF
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quantity and Add to Cart */}
            {itemType === 'product' && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 space-y-4">
                {/* Quantity Selector */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center font-semibold text-lg">{quantity}</span>
                    <button
                      onClick={() => setQuantity(quantity + 1)}
                      className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Add to Cart Button */}
                {cartQuantity > 0 ? (
                  <div className="flex items-center justify-between bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                    <span className="font-semibold text-emerald-700">In Cart: {cartQuantity}</span>
                    <button
                      onClick={handleAddToCart}
                      className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
                    >
                      Add More
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    className="w-full bg-gradient-to-r from-emerald-600 to-emerald-700 text-white py-4 rounded-lg hover:from-emerald-700 hover:to-emerald-800 transition-all font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </button>
                )}
              </div>
            )}

            {/* Meal Plan Subscription Info */}
            {itemType === 'meal-plan' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                <div className="flex items-start gap-3">
                  <Info className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-800 mb-2">Subscription Coming Soon!</h4>
                    <p className="text-amber-700 text-sm leading-relaxed">
                      Meal plan subscriptions are being developed. For now, you can order individual thali from our Daily Orders section.
                    </p>
                    <button
                      onClick={() => navigate('/ghar/ka/khana')}
                      className="mt-3 bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors text-sm font-medium"
                    >
                      Browse Daily Orders
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Features */}
            {(item.features || item.includes) && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {itemType === 'product' ? 'Features' : 'What\'s Included'}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(item.features || item.includes || []).map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600" />
                      <span className="text-gray-700 text-sm">
                        {typeof feature === 'string' ? feature : feature.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Nutritional Info */}
            {item.nutritionalInfo && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Nutritional Information</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {Object.entries(item.nutritionalInfo).map(([key, value]) => (
                    <div key={key} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm text-gray-600 capitalize">{key}</div>
                      <div className="font-semibold text-gray-900">{value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Delivery Info */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  <span className="text-gray-700">Free delivery within city limits</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-emerald-600" />
                  <span className="text-gray-700">
                    {itemType === 'product' ? 'Same day delivery available' : 'Daily delivery during subscription'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-emerald-600" />
                  <span className="text-gray-700">Fresh preparation guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewDetailThaliPage;