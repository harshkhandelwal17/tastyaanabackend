// src/pages/ProductCard.jsx
import React, { useState } from "react";
import {
  ShoppingCart,
  Heart,
  Star,
  Clock,
  Truck,
  Plus,
  Minus,
  Loader2,
  Eye,
} from "lucide-react";

const ProductCard = ({
  product,
  currentData,
  isWishlisted,
  cartQuantity,
  onAddToCart,
  onRemoveFromCart,
  onToggleWishlist,
  onViewProduct,
  heartIconProps,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const [selectedWeight, setSelectedWeight] = useState(
    product.weightOptions?.[0] || {
      weight: product.unit || "1 unit",
      price: product.price || 0,
    }
  );

  const productImage =
    product.images?.[0]?.url ||
    product.images?.[0] ||
    product.image ||
    "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400";

  const displayPrice = selectedWeight.price || product.price || 0;

  const handleAdd = async () => {
    setIsLoading(true);
    try {
      await onAddToCart(product, selectedWeight);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async () => {
    setIsLoading(true);
    try {
      await onRemoveFromCart(product);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-100 overflow-hidden group cursor-pointer"
      onClick={() => onViewProduct(product)}
    >
      {/* Image */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        {/* Tag / discount */}
        {(product.tag || product.discount > 0) && (
          <div className="absolute top-2 left-2 space-y-1 z-10">
            {product.tag && (
              <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                {product.tag}
              </span>
            )}
            {product.discount > 0 && (
              <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">
                {product.discount}% OFF
              </span>
            )}
          </div>
        )}

        {/* Wishlist */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleWishlist(product);
          }}
          className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-sm ${
            isWishlisted ? "bg-red-500 text-white" : "bg-white/90 text-gray-600"
          }`}
        >
          <Heart
            className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`}
          />
        </button>

        {/* Image */}
        <img
          src={productImage}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            !product.inStock ? "grayscale" : ""
          }`}
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=400";
          }}
        />

        {/* Quick view overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewProduct(product);
            }}
            className="bg-white text-gray-800 text-xs px-3 py-1.5 rounded-full flex items-center gap-1 shadow"
          >
            <Eye className="w-3 h-3" />
            View
          </button>
        </div>

        {/* Out of stock overlay */}
        {!product.inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-gray-900 text-white text-[10px] px-3 py-1 rounded-full">
              Out of stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-2 sm:p-3">
        {/* Name */}
        <h3 className="text-[11px] sm:text-sm font-semibold text-gray-900 line-clamp-2 min-h-[2.2rem]">
          {product.name}
        </h3>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-600">
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3 h-3 ${
                  i < Math.round(product.rating || 0)
                    ? "text-yellow-500 fill-current"
                    : "text-gray-300"
                }`}
              />
            ))}
          </div>
          <span>{product.rating?.toFixed(1)}</span>
          <span className="text-gray-400">•</span>
          <span>{product.reviews} ratings</span>
        </div>

        {/* Weight selector */}
        {product.weightOptions && product.weightOptions.length > 1 && (
          <select
            value={selectedWeight.weight}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              const w = product.weightOptions.find(
                (opt) => opt.weight === e.target.value
              );
              setSelectedWeight(w);
            }}
            className="mt-1.5 w-full border border-gray-200 rounded-lg text-[10px] px-2 py-1 focus:outline-none focus:border-emerald-500"
          >
            {product.weightOptions.map((opt) => (
              <option key={opt.weight} value={opt.weight}>
                {opt.weight} • ₹{opt.price}
              </option>
            ))}
          </select>
        )}

        {/* Price */}
        <div className="flex items-center gap-1 mt-1.5">
          <span className="text-sm sm:text-base font-bold text-gray-900">
            ₹{displayPrice}
          </span>
          {product.originalPrice && (
            <span className="text-[10px] text-gray-400 line-through">
              ₹{product.originalPrice}
            </span>
          )}
        </div>

        {/* Delivery (optional small row) */}
        <div className="flex items-center justify-between mt-1 text-[10px] text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {product.deliveryTime || "30 mins"}
          </span>
          <span className="flex items-center gap-1">
            <Truck className="w-3 h-3" />
            Free delivery
          </span>
        </div>

        {/* Add / quantity */}
        <div className="mt-2">
          {!product.inStock ? (
            <button
              disabled
              className="w-full text-[11px] py-1.5 rounded-lg bg-gray-200 text-gray-500 font-semibold"
            >
              OUT OF STOCK
            </button>
          ) : cartQuantity > 0 ? (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-1.5 py-1.5">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove();
                }}
                disabled={isLoading}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-emerald-300 bg-white"
              >
                <Minus className="w-3 h-3 text-emerald-600" />
              </button>
              <span className="text-xs font-bold text-emerald-700">
                {cartQuantity}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAdd();
                }}
                disabled={isLoading}
                className="w-7 h-7 flex items-center justify-center rounded-md bg-emerald-500"
              >
                {isLoading ? (
                  <Loader2 className="w-3 h-3 text-white animate-spin" />
                ) : (
                  <Plus className="w-3 h-3 text-white" />
                )}
              </button>
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAdd();
              }}
              disabled={isLoading}
              className={`w-full text-[11px] py-1.5 rounded-lg font-semibold text-white bg-gradient-to-r ${currentData.gradient} flex items-center justify-center gap-1`}
            >
              {isLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <>
                  <ShoppingCart className="w-3 h-3" />
                  <span>Add</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
