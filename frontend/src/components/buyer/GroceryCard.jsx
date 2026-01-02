import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { toast } from "react-hot-toast";
import {
  FaShoppingCart,
  FaHeart,
  FaStar,
  FaRegStar,
  FaStarHalfAlt,
  FaChevronDown,
} from "react-icons/fa";
// import { addToCartAPI } from "../../redux/cartSlice";
import ProductQuickView from "./ProductQuickView";

const GroceryCard = ({
  product,
  index,
  addToCart,
  onAddToCart,
  onAddToWishlist,
  onRemoveFromWishlist,
  isInWishlist,
}) => {
  const [selectedWeight, setSelectedWeight] = useState(
    product.weightOptions?.length > 0
      ? product.weightOptions[0]
      : {
          weight: "500g",
          price: product.price,
          originalPrice: product.price * 1.25,
          discount: 0,
        }
  );

  // Generate weight options if not provided
  const weightOptions =
    product.weightOptions?.length > 0
      ? product.weightOptions
      : [
          {
            weight: "500g",
            price: product.price,
            originalPrice: product.price * 1.25,
            discount: 0,
          },
          {
            weight: "1kg",
            price: product.price * 1.8,
            originalPrice: product.price * 2,
            discount: 10,
          },
          {
            weight: "2kg",
            price: product.price * 3.5,
            originalPrice: product.price * 4,
            discount: 15,
          },
        ];

  const [quantity, setQuantity] = useState(1);
  const [showQuickView, setShowQuickView] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authUser = useSelector((state) => state.auth?.user);

  // Calculate average rating and review count
  const averageRating = product.ratings?.average || 0;
  const reviewCount = product.ratings?.count || 0;
  const mainImage =
    product.images?.[0]?.url ||
    product.image ||
    "/images/placeholder-product.png";
  const inStock = product.inStock !== false && product.stockQuantity !== 0;

  // Toggle wishlist
  const toggleWishlist = (e) => {
    e.stopPropagation();
    if (!authUser) {
      toast.info("Please login to add items to wishlist");
      navigate("/login");
      return;
    }
    if (isInWishlist) {
      dispatch(onRemoveFromWishlist(product._id));
      toast.success("Removed from wishlist");
    } else {
      onAddToWishlist({
        ...product,
        price: selectedWeight.price,
        weight: selectedWeight.weight,
      });

      // toast.success("Added to wishlist");
    }
  };

  // Handle add to cart
  const handleAddToCartt = (e) => {
    e.stopPropagation();
    if (!authUser) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }
    if (!product) {
      toast.error("Please select a product and weight");
      return;
    }

    try {
      const payload = {
        productId: product._id,
        payload: {
          weight: selectedWeight.weight,
          price: selectedWeight.price,
          unit: selectedWeight.unit || "g",
        },
        quantity: quantity,
      };

      // console.log("Adding ", payload);
      onAddToCart(payload);
      // toast.success("Product added to cart successfully!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error(error?.message || "Failed to add product to cart");
    }
  };

  return (
    <div
      className="relative flex flex-col h-full bg-white rounded-lg border border-gray-100 hover:shadow-sm transition-all duration-150 overflow-hidden group w-full"
      onClick={() => navigate(`/products/${product._id}`)}
    >
      {/* Image Container */}
      <div className="relative pt-[100%] bg-gray-50">
        {/* Badge */}
        {product.badge && (
          <span className="absolute top-0.5 left-0.5 z-10 px-1 py-0.5 rounded-full text-[8px] font-bold bg-red-500 text-white">
            {product.badge}
          </span>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleWishlist(e);
          }}
          className={`absolute top-1 right-1 z-10 p-0.5 rounded-full transition-colors duration-150  place-items-center  ${
            isInWishlist ? "text-red-500" : "text-gray-400 hover:text-red-500"
          } bg-white/80 hover:bg-white`}
          title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
        >
          <FaHeart className="w-5 h-5 sm:w-3 sm:h-3" />
        </button>
        {/* Product Image */}
        <div className="absolute inset-0 p-1">
          <img
            src={mainImage}
            alt={product.name}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/images/placeholder-product.png";
            }}
          />
        </div>
      </div>

      {/* Product Info */}
      <div className="p-1.5 flex flex-col h-full">
        {/* Stock Status */}
        <div className="flex justify-between items-center mb-0.5">
          <span
            className={`text-[8px] font-medium ${
              !inStock ? "text-red-600" : "text-green-600"
            }`}
          >
            {inStock ? "In Stock" : "Out"}
          </span>

          {/* Rating */}
          {averageRating > 0 && (
            <div className="flex items-center bg-yellow-50 px-1 rounded">
              <FaStar className="text-yellow-400 text-[8px] mr-0.5" />
              <span className="text-[8px] text-gray-700">
                {averageRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Product Name */}
        <h3 className="text-[10px] font-medium text-gray-800 line-clamp-2 h-7 leading-tight mb-0.5">
          {product.name}
        </h3>

        {/* Price */}
        <div className="mb-0.5">
          <div className="flex items-baseline gap-0.5">
            <span className="text-[11px] font-bold text-gray-900">
              ₹{selectedWeight.price.toFixed(0)}
            </span>
            {selectedWeight.originalPrice > selectedWeight.price && (
              <span className="text-[8px] text-green-600">
                {Math.round(
                  (1 - selectedWeight.price / selectedWeight.originalPrice) *
                    100
                )}
                %
              </span>
            )}
          </div>
          {selectedWeight.originalPrice > selectedWeight.price && (
            <span className="text-[8px] text-gray-500 line-through">
              ₹{selectedWeight.originalPrice.toFixed(0)}
            </span>
          )}
        </div>

        {/* Weight Selector */}
        <div className="relative mb-0.5">
          <select
            value={selectedWeight.weight}
            onChange={(e) => {
              const weight = weightOptions.find(
                (w) => w.weight === e.target.value
              );
              if (weight) setSelectedWeight(weight);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-[8px] border border-gray-300 rounded px-1 py-0.5 appearance-none pr-4 bg-white"
          >
            {weightOptions.map((option) => (
              <option key={option.weight} value={option.weight}>
                {option.weight}
              </option>
            ))}
          </select>
          <div className="absolute right-0.5 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <FaChevronDown className="text-gray-500 text-[8px]" />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-auto pt-1">
          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCartt}
            disabled={!inStock}
            className={`w-full py-1 text-[10px] font-medium rounded-md flex items-center justify-center space-x-1 ${
              inStock
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
          >
            <FaShoppingCart className="text-[8px]" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Quick View Modal */}
      <ProductQuickView
        isOpen={showQuickView}
        onClose={() => setShowQuickView(false)}
        productId={product._id}
      />
    </div>
  );
};

export default GroceryCard;
