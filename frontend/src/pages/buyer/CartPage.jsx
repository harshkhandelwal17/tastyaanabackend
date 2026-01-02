import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  fetchCart,
  syncCart,
  deleteCartItem,
  clearCart,
  updateQuantity,
  clearError,
} from "../../redux/cartSlice";
import { ShoppingCart, Minus, Plus, Trash2, ArrowLeft } from "lucide-react";
import { toast } from "react-hot-toast";

// Cart Page Component
const CartPage = ({ setCurrentPage }) => {
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth?.user);
  const dispatch = useDispatch();
  const { items: cart, loading, error } = useSelector((state) => state.cart);

  useEffect(() => {
    if (!authUser) {
      toast.info("Please login to view your cart");
      navigate("/login");
      return;
    }

    // Clear any previous errors before fetching cart
    dispatch(clearError());
    dispatch(fetchCart()).catch((error) => {
      // Don't show availability errors on cart page
      if (
        error?.message &&
        !error.message.includes("currently not available")
      ) {
        console.error("Cart fetch error:", error);
      }
    });
  }, [dispatch, authUser, navigate]);

  // Robust state handling
  if (loading)
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8 sm:py-12 md:py-16">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading cart...</p>
          </div>
        </div>
      </div>
    );

  if (error && !error.includes("currently not available"))
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8 sm:py-12 md:py-16 text-red-600">
            <p className="text-sm sm:text-base">Error: {error}</p>
            <button
              onClick={() => dispatch(fetchCart())}
              className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm sm:text-base"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );

  if (!cart)
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8 sm:py-12 md:py-16">
            <div className="animate-spin rounded-full h-8 w-8 sm:h-12 sm:w-12 border-b-2 border-orange-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading cart...</p>
          </div>
        </div>
      </div>
    );

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-8 sm:py-12 md:py-16">
            <ShoppingCart className="w-12 h-12 sm:w-16 sm:h-16 md:w-24 md:h-24 text-gray-300 mx-auto mb-4 sm:mb-6" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">
              Your Cart is Empty
            </h1>
            <p className="text-gray-600 mb-4 sm:mb-6 md:mb-8 text-sm sm:text-base">
              Add some delicious sweets to get started!
            </p>
            <button
              onClick={() => setCurrentPage("products")}
              className="bg-orange-600 text-white px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors text-sm sm:text-base"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const shipping = subtotal > 500 ? 0 : 50;
  const total = subtotal + shipping;

  const handleUpdateQuantity = async (productId, weight, quantity) => {
    try {
      await dispatch(updateQuantity({ productId, weight, quantity })).unwrap();
      toast.success("Quantity updated");
    } catch {
      toast.error("Failed to update quantity");
    }
  };

  const handleRemove = async (productId) => {
    try {
      await dispatch(deleteCartItem({ productId })).unwrap();
      toast.success("Item removed from cart");
    } catch {
      toast.error("Failed to remove item");
    }
  };

  // Group cart items by category
  const groupByCategory = (items) => {
    const groups = {};
    items.forEach((item) => {
      const cat =
        item.category || (item.product && item.product.category) || "other";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    });
    return groups;
  };

  const groupedCart = groupByCategory(cart);
  const categoryLabels = {
    main: "Meal Plans",
    sweet: "Sweets",
    fastfood: "Fast Food",
    beverage: "Beverages",
    tiffin: "Tiffin",
    vegetable: "Vegetables",
    addon: "Add-ons",
    product: "Products",
    other: "Other",
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 md:py-8">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header - Enhanced responsive */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 md:mb-8 space-y-2 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigate(-1)}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
              Your Carts
            </h1>
          </div>
          <button
            onClick={() => dispatch(clearCart())}
            className="text-red-600 hover:underline text-sm sm:text-base self-start sm:self-auto px-2 py-1 hover:bg-red-50 rounded transition-colors"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {/* Cart Items - Enhanced responsive */}
          <div className="lg:col-span-2">
            {/* Page Label */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-800">
                    Shopping Cart
                  </h2>
                  <p className="text-sm text-gray-600">
                    Review your items before checkout
                  </p>
                </div>
                <span className="bg-orange-100 text-orange-600 text-xs px-2 py-1 rounded-full ml-auto">
                  {cart.length} items
                </span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {Object.entries(groupedCart).map(([cat, items]) => (
                <div key={cat} className="mb-4 sm:mb-6">
                  <h2 className="text-base sm:text-lg font-bold text-gray-700 px-3 sm:px-4 pt-3 sm:pt-4 pb-2 border-b border-gray-100">
                    {categoryLabels[cat] || cat}
                  </h2>
                  {items.map(
                    (item, index) => (
                      console.log("itemsss ", item),
                      (
                        <div
                          key={
                            item._id || item.product?._id || item.name + index
                          }
                          className={`p-3 sm:p-4 md:p-6 ${
                            index !== 0 ? "border-t border-gray-100" : ""
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                            {/* Product Image and Info - Enhanced responsive */}
                            <div className="flex items-center space-x-3 sm:space-x-4 flex-1">
                              <img
                                src={
                                  item?.images?.[0]?.url ||
                                  item.image ||
                                  item.product?.images?.[0]?.url ||
                                  "/api/placeholder/100/100"
                                }
                                alt={item.name || item.product?.name}
                                className="w-12 h-12 sm:w-16 sm:h-16 md:w-20 md:h-20 object-cover rounded-md flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 truncate">
                                  {item.name || item.product?.name}
                                </h3>
                                {item.weight && (
                                  <p className="text-gray-600 text-xs sm:text-sm md:text-base">
                                    Weight: {item.weight}
                                  </p>
                                )}
                                {item.customizations &&
                                  item.customizations.length > 0 && (
                                    <p className="text-xs text-purple-700">
                                      Custom: {item.customizations.join(", ")}
                                    </p>
                                  )}
                                <p className="text-orange-600 font-bold text-sm sm:text-base">
                                  ₹{item.price}
                                </p>
                              </div>
                            </div>

                            {/* Quantity Controls and Price - Enhanced responsive */}
                            <div className="flex items-center justify-between sm:justify-end sm:space-x-4">
                              {/* Quantity Controls - Enhanced responsive */}
                              <div className="flex items-center space-x-2 sm:space-x-3">
                                <button
                                  onClick={() =>
                                    handleUpdateQuantity(
                                      item.product?._id || item._id,
                                      item.weight,
                                      Math.max(1, item.quantity - 1)
                                    )
                                  }
                                  disabled={item.quantity <= 1}
                                  className={`w-6 h-6 sm:w-8 sm:h-8 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 transition-colors ${
                                    item.quantity <= 1
                                      ? "opacity-50 cursor-not-allowed"
                                      : ""
                                  }`}
                                >
                                  <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>
                                <span className="text-sm sm:text-base md:text-lg font-semibold w-6 sm:w-8 text-center">
                                  {item.quantity}
                                </span>
                                <button
                                  onClick={() =>
                                    handleUpdateQuantity(
                                      item.product?._id || item._id,
                                      item.weight,
                                      item.quantity + 1
                                    )
                                  }
                                  className="w-6 h-6 sm:w-8 sm:h-8 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50 transition-colors"
                                >
                                  <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                </button>
                              </div>

                              {/* Price and Remove - Enhanced responsive */}
                              <div className="text-right flex items-center space-x-2 sm:space-x-3">
                                <div>
                                  <p className="text-sm sm:text-base md:text-lg font-bold text-gray-800">
                                    ₹{item.price * item.quantity}
                                  </p>
                                </div>
                                <button
                                  onClick={() =>
                                    handleRemove(item.product?._id || item._id)
                                  }
                                  className="text-red-600 hover:text-red-800 p-1 hover:bg-red-50 rounded transition-colors"
                                >
                                  <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary - Enhanced responsive */}
          <div>
            <div className="bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-6 sticky top-4">
              {/* Checkout Section Label */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-sm">₹</span>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg md:text-xl font-bold text-gray-800">
                    Order Summary
                  </h2>
                  <p className="text-xs text-gray-600">Ready to checkout</p>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4 md:mb-6">
                <div className="flex justify-between text-xs sm:text-sm md:text-base">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-xs sm:text-sm md:text-base">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-semibold">
                    {shipping === 0 ? "Free" : `₹${shipping}`}
                  </span>
                </div>
                {subtotal < 500 && (
                  <p className="text-xs sm:text-sm text-green-600 bg-green-50 p-2 rounded">
                    Add ₹{(500 - subtotal).toFixed(2)} more for free shipping!
                  </p>
                )}
                <hr className="my-2 sm:my-3" />
                <div className="flex justify-between text-sm sm:text-base md:text-lg font-bold">
                  <span>Total</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <button
                  onClick={() => setCurrentPage("checkout")}
                  className="w-full bg-orange-600 text-white py-2 sm:py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors text-sm sm:text-base"
                >
                  Proceed to Checkout
                </button>

                <button
                  onClick={() => setCurrentPage("products")}
                  className="w-full border border-gray-300 text-gray-700 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Continue Shopping
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
