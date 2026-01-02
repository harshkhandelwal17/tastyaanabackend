import React, { useState } from "react";
import {
  FaShoppingCart,
  FaHeart,
  FaStar,
  FaRegStar,
  FaStarHalfAlt,
  FaInfoCircle,
  FaWeightHanging,
  FaLeaf,
  FaChevronDown,
} from "react-icons/fa";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { addToCartAPI } from "../../redux/cartSlice";
import {
  addToWishlistAPI,
  removeFromWishlistAPI,
} from "../../redux/wishlistSlice";

const GroceryProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { items: wishlistItems } = useSelector((state) => state.wishlist);

  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [showCollegeModal, setShowCollegeModal] = useState(false);
  const [collegeName, setCollegeName] = useState('');

  const {
    _id,
    name,
    price,
    images,
    ratings,
    discount,
    unit,
    stock,
    isOrganic,
    isPerishable,
    brand,
    tags = [],
  } = product;

  // Check if product is in wishlist on component mount
  React.useEffect(() => {
    const inWishlist = wishlistItems.some((item) => item._id === _id);
    setIsWishlisted(inWishlist);
  }, [wishlistItems, _id]);

  const averageRating = ratings?.average || 0;
  const reviewCount = ratings?.count || 0;
  const mainImage = images?.[0] || "/images/placeholder-product.png";

  // Calculate discount price if available
  const discountedPrice = discount
    ? (price - (price * discount) / 100).toFixed(2)
    : null;

  // Handle quantity changes
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0 && value <= 10) {
      setQuantity(value);
    }
  };

  // Weight options
  const weightOptions = [
    { value: '500g', price: price, discount: 0 },
    { value: '1kg', price: price * 1.8, discount: 10 },
    { value: '2kg', price: price * 3.5, discount: 15 },
  ];

  const [selectedWeight, setSelectedWeight] = useState(weightOptions[0]);

  // Handle add to cart
  const handleAddToCart = async () => {
    try {
      await dispatch(
        addToCartAPI({
          ...product,
          id: _id,
          _id,
          quantity,
          price: selectedWeight.price,
          weight: selectedWeight.value,
          originalPrice: price,
          discount: selectedWeight.discount,
        })
      ).unwrap();
      // Show success message or update UI
    } catch (error) {
      console.error('Failed to add to cart:', error);
    }
  };

  // Toggle wishlist
  const toggleWishlist = () => {
    if (isWishlisted) {
      dispatch(removeFromWishlistAPI(_id));
    } else {
      dispatch(addToWishlistAPI(product));
    }
    setIsWishlisted(!isWishlisted);
  };

  // Render star ratings
  const renderStars = () => {
    const stars = [];
    const fullStars = Math.floor(averageRating);
    const hasHalfStar = averageRating % 1 >= 0.5;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="text-yellow-400" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="text-yellow-400" />);
      } else {
        stars.push(<FaRegStar key={i} className="text-yellow-400" />);
      }
    }

    return (
      <div className="flex items-center">
        <div className="mr-1">{stars}</div>
        <span className="text-gray-500 text-xs">({reviewCount})</span>
      </div>
    );
  };

  return (
    <div className="relative flex flex-col h-full bg-white rounded-lg border border-gray-200 hover:shadow-md transition-all duration-200 overflow-hidden group">
      {/* Image Container */}
      <div className="relative pt-[100%] bg-white">
        {/* Discount Badge */}
        {discount > 0 && (
          <span className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full z-10">
            {discount}% OFF
          </span>
        )}

        {/* Product Image */}
        <Link to={`/grocery/${_id}`} className="block absolute inset-0">
          <img
            src={mainImage}
            alt={name}
            className="w-full h-full object-contain p-2"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/images/placeholder-product.png";
            }}
          />
        </Link>

        {/* Quick Actions */}
        <div className="absolute bottom-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={toggleWishlist}
            className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md text-red-500 hover:bg-red-50"
            title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
          >
            <FaHeart className={isWishlisted ? "fill-current" : "fill-none stroke-current stroke-2"} />
          </button>
          <button
            onClick={handleAddToCart}
            className="w-8 h-8 flex items-center justify-center bg-white rounded-full shadow-md text-blue-600 hover:bg-blue-50"
            title="Add to Cart"
          >
            <FaShoppingCart />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-3 flex flex-col h-full">
        {/* Product Name */}
        <Link
          to={`/grocery/${_id}`}
          className="text-sm font-medium text-gray-800 mb-1 line-clamp-2 hover:text-blue-600 h-10 overflow-hidden"
          title={name}
        >
          {name}
        </Link>

        {/* Weight Selector */}
        <div className="relative mb-2">
          <select
            value={selectedWeight.value}
            onChange={(e) => {
              const weight = weightOptions.find(w => w.value === e.target.value);
              setSelectedWeight(weight || weightOptions[0]);
            }}
            className="w-full text-xs border border-gray-300 rounded px-2 py-1.5 appearance-none pr-6 bg-white"
          >
            {weightOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value}
              </option>
            ))}
          </select>
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <FaChevronDown className="text-gray-500 text-xs" />
          </div>
        </div>

        {/* Price */}
        <div className="mb-2">
          <div className="flex items-baseline gap-1">
            <span className="text-base font-bold text-gray-900">
              ₹{selectedWeight.price.toFixed(2)}
            </span>
            {selectedWeight.discount > 0 && (
              <span className="text-xs text-green-600 ml-1">
                {selectedWeight.discount}% OFF
              </span>
            )}
          </div>
          {selectedWeight.discount > 0 && (
            <span className="text-xs text-gray-500 line-through">
              ₹{price.toFixed(2)}
            </span>
          )}
        </div>

        {/* Rating */}
        <div className="mt-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex text-yellow-400 text-xs">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>
                    {i < Math.floor(averageRating) ? (
                      <FaStar className="fill-current" />
                    ) : i === Math.floor(averageRating) && averageRating % 1 >= 0.5 ? (
                      <FaStarHalfAlt className="fill-current" />
                    ) : (
                      <FaRegStar className="fill-current" />
                    )}
                  </span>
                ))}
                <span className="text-gray-500 text-xs ml-1">({reviewCount})</span>
              </div>
            </div>
            <span className={`text-xs ${stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {stock > 0 ? 'In Stock' : 'Out of Stock'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroceryProductCard;
