import React from "react";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/Slices/cartslice";
import { useCategoryTimeRestriction } from "../hooks/useCategoryTimeRestriction";
import { Heart } from "lucide-react";
import { useOptimizedWishlist } from "../hooks/useOptimizedWishlist";
const ProductCard = ({ product }) => {
  const dispatch = useDispatch();
  const { checkAndNotify } = useCategoryTimeRestriction();
  const { toggleWishlist, getHeartIconProps } = useOptimizedWishlist();

  const productId = product?._id || product?.id;

  const handleAddToCart = () => {
    // Check time restriction before adding to cart
    if (
      product.categoryId &&
      !checkAndNotify(product.categoryId, product.name)
    ) {
      return; // Don't proceed if not allowed
    }

    dispatch(
      addToCart({
        ...product,
        quantity: 1, // Default quantity
      })
    );
  };

  return (
    <div className="product-card">
      <div className="relative">
        {/* Wishlist Heart */}
        {productId && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(product);
            }}
            className={`absolute top-2 right-2 p-2 rounded-full bg-white/90 shadow ${getHeartIconProps(productId).button}`}
            aria-label="Toggle wishlist"
          >
            <Heart className={`w-5 h-5 ${getHeartIconProps(productId).icon}`} />
          </button>
        )}

        <img src={product.image} alt={product.name} />
      </div>
      <h3>{product.name}</h3>
      <p>{product.description}</p>
      <div className="price">₹{product.price}</div>
      <button onClick={handleAddToCart} className="add-to-cart-btn">
        Add to Cart
      </button>
    </div>
  );
};

export default ProductCard;
