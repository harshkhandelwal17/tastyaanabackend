import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { responsivePatterns, touchSizes, deviceUtils } from '../../utils/responsive';
import { useProductAvailability } from '../../hooks/useProductAvailability';
import { 
  Clock, Star, Heart, Plus, Minus, ShoppingCart,
  Timer, Package, Award, AlertCircle
} from 'lucide-react';

const ProductCard = ({ 
  product, 
  onAddToCart = () => {}, 
  onAddToWishlist = () => {}, 
  isWishlistItem = false,
  showAddButton = true,
  className = "",
  size = "medium" // small, medium, large
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [quantity, setQuantity] = useState(0);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Check product availability
  const { 
    isAvailable, 
    canAddToCart, 
    getCartActionMessage, 
    getAvailabilityStatus,
    warning 
  } = useProductAvailability(product);

  const handleProductClick = () => {
    if (product.id || product._id) {
      navigate(`/products/${product.id || product._id}`);
    }
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!canAddToCart()) {
      return; // Don't add to cart if not available
    }
    if (quantity === 0) {
      setQuantity(1);
    }
    onAddToCart(product, quantity || 1);
  };

  const handleQuantityChange = (action) => {
    if (action === 'increase') {
      setQuantity(prev => prev + 1);
    } else if (action === 'decrease' && quantity > 0) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    onAddToWishlist(product);
  };

  // Size variants
  const sizeClasses = {
    small: {
      container: "p-3",
      image: "text-3xl",
      title: "text-xs font-semibold",
      price: "text-sm font-bold",
      button: "py-2 text-xs"
    },
    medium: {
      container: "p-4",
      image: "text-4xl sm:text-5xl",
      title: "text-sm font-bold",
      price: "text-base font-bold",
      button: "py-2.5 text-sm"
    },
    large: {
      container: "p-6",
      image: "text-6xl",
      title: "text-base font-bold",
      price: "text-lg font-bold",
      button: "py-3 text-base"
    }
  };

  const currentSize = sizeClasses[size] || sizeClasses.medium;

  const isStoreClosed = product.storeStatus === 'closed' || product.storeStatus === 'temporarily_closed';
  const storeStatusText = product.storeStatus === 'temporarily_closed' ? 'Temporarily Closed' : 'Closed Today';
  
  // Combined availability status
  const isProductUnavailable = isStoreClosed || !isAvailable;
  const availabilityStatus = getAvailabilityStatus();

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all relative group ${currentSize.container} ${className} ${
        isProductUnavailable ? 'opacity-70' : 'cursor-pointer'
      }`}
      onMouseEnter={() => !isProductUnavailable && setIsHovered(true)}
      onMouseLeave={() => !isProductUnavailable && setIsHovered(false)}
      onClick={!isProductUnavailable ? handleProductClick : undefined}
    >
      {/* Product Tag */}
      {product.tag && (
        <div className={`absolute top-2 left-2 text-xs px-2 py-1 rounded-full font-bold ${
          product.tag === 'Fresh' ? 'bg-green-100 text-green-700' :
          product.tag === 'Bestseller' ? 'bg-orange-100 text-orange-700' :
          product.tag === 'Organic' ? 'bg-emerald-100 text-emerald-700' :
          product.tag === 'Popular' ? 'bg-purple-100 text-purple-700' :
          'bg-gray-100 text-gray-700'
        }`}>
          {product.tag}
        </div>
      )}

      {/* Store Status Badge */}
      {isStoreClosed && (
        <div className="absolute top-2 right-2 bg-amber-500 text-white text-xs px-2 py-1 rounded-full font-bold z-10">
          {storeStatusText}
        </div>
      )}

      {/* Availability Status Badge */}
      {!isStoreClosed && availabilityStatus.status !== 'available' && (
        <div className={`absolute top-2 right-2 text-white text-xs px-2 py-1 rounded-full font-bold z-10 ${
          availabilityStatus.status === 'warning' ? 'bg-orange-500' : 'bg-red-500'
        }`}>
          {availabilityStatus.status === 'warning' ? 'Ending Soon' : 'Not Available'}
        </div>
      )}

      {/* Discount Badge */}
      {!isStoreClosed && product.discount > 0 && (
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-bold">
          {typeof product.discount === 'string' ? product.discount : `${product.discount}% OFF`}
        </div>
      )}

      {/* Wishlist Button */}
      <button
        onClick={handleWishlistClick}
        className={`absolute top-2 right-2 p-2 rounded-full transition-all ${
          product.discount ? 'top-8' : 'top-2'
        } ${isWishlistItem ? 'bg-red-500 text-white' : 'bg-white/80 hover:bg-red-500 hover:text-white'}`}
      >
        <Heart className="w-4 h-4" fill={isWishlistItem ? 'currentColor' : 'none'} />
      </button>
      
      {/* Product Image */}
      <div className="text-center mb-3 mt-6">
        {product.imageUrl ? (
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-20 sm:h-24 object-contain mx-auto transition-transform duration-300 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          <div className={`transition-transform duration-300 ${
            isHovered ? 'scale-110' : ''
          } ${currentSize.image}`}>
            {product.image || '🛍️'}
          </div>
        )}
      </div>
      
      {/* Product Info */}
      <div>
        <h3 className={`text-gray-800 mb-1 leading-tight line-clamp-2 ${currentSize.title}`}>
          {product.name}
        </h3>
        
        {product.brand && (
          <p className="text-xs text-gray-500 mb-2">{product.brand} • {product.unit}</p>
        )}
        
        {/* Rating & Reviews */}
        {product.rating && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
              <span className="text-xs text-gray-600">
                {product.rating || '4.5'}
              </span>
            </div>
            {showAddButton && (
              <button
                onClick={canAddToCart() ? handleAddToCart : undefined}
                disabled={isProductUnavailable}
                className={`flex items-center justify-center rounded-full transition-colors ${currentSize.button} px-4 ${
                  isProductUnavailable 
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                    : 'bg-emerald-500 text-white hover:bg-emerald-600 cursor-pointer'
                }`}
                title={!canAddToCart() ? getCartActionMessage() : ''}
              >
                <ShoppingCart className="w-4 h-4 mr-1" />
                {quantity > 0 ? (
                  <span className="ml-1">{quantity}</span>
                ) : (
                  <span className="ml-1">Add</span>
                )}
              </button>
            )}
          </div>
        )}
        
        {/* Price */}
        {product.price > 0 && (
          <div className="flex items-center gap-2 mb-3">
            <span className={`text-gray-800 ${currentSize.price}`}>
              {product.price}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                {product.originalPrice}
              </span>
            )}
          </div>
        )}
        {product.price === 0 && (
          <div className="mb-3">
            <span className="text-sm text-gray-500 font-medium">
              Price on request
            </span>
          </div>
        )}
        
        {/* Delivery Time */}
        {product.deliveryTime && (
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold">
              <Clock className="w-3 h-3" />
              {product.deliveryTime}
            </div>
            {product.inStock && (
              <span className="text-xs text-green-600 font-semibold">In Stock</span>
            )}
          </div>
        )}

        {/* Availability Status */}
        {!isStoreClosed && (
          <div className="flex items-center gap-1 mb-3">
            {availabilityStatus.status === 'available' ? (
              <div className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Available Now
              </div>
            ) : availabilityStatus.status === 'warning' ? (
              <div className="flex items-center gap-1 text-xs text-orange-600 font-semibold">
                <AlertCircle className="w-3 h-3" />
                Ending Soon
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-red-600 font-semibold">
                <AlertCircle className="w-3 h-3" />
                Not Available
              </div>
            )}
          </div>
        )}
        
        {/* Add Button */}
        {showAddButton && (
          <div>
            {quantity === 0 ? (
              <button 
                onClick={handleAddToCart}
                disabled={isProductUnavailable}
                className={`w-full rounded-xl font-bold transition-all ${currentSize.button} ${
                  isProductUnavailable
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : isHovered
                    ? 'bg-emerald-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-emerald-500 hover:text-white'
                }`}
                title={!canAddToCart() ? getCartActionMessage() : ''}
              >
                {isProductUnavailable ? (
                  'Not Available'
                ) : isHovered ? (
                  <span className="flex items-center justify-center gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Add to Cart
                  </span>
                ) : (
                  'ADD'
                )}
              </button>
            ) : (
              <div className="flex items-center justify-between bg-emerald-500 rounded-xl p-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuantityChange('decrease');
                  }}
                  className="p-2 text-white hover:bg-emerald-600 rounded-lg transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-white font-bold px-2">{quantity}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuantityChange('increase');
                  }}
                  className="p-2 text-white hover:bg-emerald-600 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductCard;