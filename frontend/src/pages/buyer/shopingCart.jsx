import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCart,
  updateQuantityAPI,
  deleteCartItem,
  clearCart,
} from "../../redux/cartSlice";
import { toast } from "react-hot-toast";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Package,
  CheckCircle,
  Truck,
  Clock,
  Star,
  Shield,
  Tag,
  MapPin,
  Phone,
  AlertCircle,
  CreditCard,
  Loader2,
} from "lucide-react";
import { useCharges } from "../../hooks/useCharges";

/* ---------------------- Cart Item ---------------------- */

const CartItem = ({
  item,
  onUpdateQuantity = () => {},
  onRemove = () => {},
  onNavigateToProduct = () => {},
  isRemoving = false,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const itemId = item.id || item._id;
  const product = item.product || item;

  const imageSrc =
    Array.isArray(product.images)
      ? product.images[0]?.url || product.images[0]
      : product.images ||
        "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=300&h=300&fit=crop&crop=center";

  const originalPricePerUnit =
    item.originalPrice ??
    product?.weightOptions?.[0]?.originalPrice ??
    item.price ??
    product?.weightOptions?.[0]?.price ??
    0;

  const pricePerUnit =
    item.price ?? product?.weightOptions?.[0]?.price ?? originalPricePerUnit;

  const linePrice = pricePerUnit * item.quantity;
  const lineOriginalPrice = originalPricePerUnit * item.quantity;
  const hasDiscount = lineOriginalPrice > linePrice;
  const discountPercent = hasDiscount
    ? Math.round(((lineOriginalPrice - linePrice) / lineOriginalPrice) * 100)
    : 0;

  const handleDecrease = async () => {
    if (item.quantity <= 1 || isUpdating) return;
    setIsUpdating(true);
    try {
      await onUpdateQuantity(itemId, item.quantity - 1);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleIncrease = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await onUpdateQuantity(itemId, item.quantity + 1);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    if (isUpdating) return;
    try {
      await onRemove(itemId);
    } catch (error) {
      console.error("Failed to remove item:", error);
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-200 ${
        isRemoving ? "opacity-40 scale-[0.98]" : "hover:shadow-md"
      }`}
    >
      <div className="p-3 sm:p-4">
        <div className="flex gap-3">
          {/* Product Image */}
          <button
            type="button"
            className="relative group cursor-pointer flex-shrink-0"
            onClick={() => onNavigateToProduct(product._id || itemId)}
          >
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-50 rounded-xl overflow-hidden">
              <img
                src={imageSrc}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  e.target.src =
                    "https://via.placeholder.com/80x80/f3f4f6/6b7280?text=Item";
                }}
              />
            </div>

            {hasDiscount && (
              <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 text-[10px] text-white px-1.5 py-0.5 rounded-full font-semibold shadow-sm">
                {discountPercent}% OFF
              </span>
            )}
          </button>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Title + remove */}
            <div className="flex items-start justify-between gap-2 mb-1">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.12em] text-emerald-600 font-semibold">
                  {product.brand || "Tastyaana Store"}
                </p>
                <button
                  type="button"
                  onClick={() => onNavigateToProduct(product._id || itemId)}
                  className="text-sm sm:text-base font-semibold text-slate-900 text-left hover:text-emerald-600 line-clamp-2"
                >
                  {product.name}
                </button>
              </div>
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mb-2">
              {item.weight && (
                <span className="inline-flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {item.weight}
                </span>
              )}
              {product.rating && (
                <span className="inline-flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  {product.rating}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {item.deliveryTime || "15 min"}
              </span>
            </div>

            {/* Price + quantity */}
            <div className="flex items-center justify-between gap-3">
              {/* Prices */}
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base sm:text-lg font-bold text-slate-900">
                    ₹{linePrice.toLocaleString()}
                  </span>
                  {hasDiscount && (
                    <span className="text-[11px] text-slate-400 line-through">
                      ₹{lineOriginalPrice.toLocaleString()}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-slate-500">
                  ₹{pricePerUnit.toLocaleString()} each
                </span>
                {hasDiscount && (
                  <span className="text-[11px] text-emerald-600 font-semibold">
                    You save ₹
                    {(lineOriginalPrice - linePrice).toLocaleString()}
                  </span>
                )}
              </div>

              {/* Quantity controls */}
              <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={handleDecrease}
                  disabled={item.quantity <= 1 || isUpdating}
                  className="w-8 h-8 flex items-center justify-center hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isUpdating ? (
                    <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                  ) : (
                    <Minus className="w-3 h-3 text-slate-700" />
                  )}
                </button>
                <span className="w-8 text-center text-sm font-semibold text-slate-900">
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={handleIncrease}
                  disabled={
                    isUpdating ||
                    (product.stockQty && item.quantity >= product.stockQty)
                  }
                  className="w-8 h-8 flex items-center justify-center hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isUpdating ? (
                    <Loader2 className="w-3 h-3 animate-spin text-slate-400" />
                  ) : (
                    <Plus className="w-3 h-3 text-slate-700" />
                  )}
                </button>
              </div>
            </div>

            {/* Stock */}
            {product.stockQty !== undefined && (
              <div className="mt-2">
                {product.stockQty > 0 ? (
                  <div className="flex items-center text-[11px] text-emerald-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5" />
                    In stock ({product.stockQty} left)
                  </div>
                ) : (
                  <div className="flex items-center text-[11px] text-rose-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5" />
                    Out of stock
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ---------------------- Empty Cart ---------------------- */

const EmptyCart = ({ onContinueShopping }) => (
  <div className="min-h-screen bg-slate-50 flex flex-col">
    {/* Header */}
    <div className="bg-white border-b border-slate-200 py-3 sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-4 flex items-center gap-3">
        <button
          onClick={() => window.history.back()}
          className="p-2 rounded-xl hover:bg-slate-100"
        >
          <ArrowLeft className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
            <ShoppingCart className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-600 font-semibold">
              Tastyaana
            </p>
            <h1 className="text-base font-semibold text-slate-900">
              Your cart
            </h1>
          </div>
        </div>
      </div>
    </div>

    {/* Body */}
    <div className="flex-1 flex items-center justify-center px-4 py-6">
      <div className="text-center max-w-sm mx-auto">
        <div className="w-24 h-24 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-12 h-12 text-emerald-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-1">
          Your cart is empty
        </h2>
        <p className="text-sm text-slate-500 mb-5">
          Add some tasty items and we&apos;ll keep them ready here.
        </p>

        <button
          onClick={onContinueShopping}
          className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shadow-sm mb-5"
        >
          Start shopping
        </button>

        <div className="grid grid-cols-3 gap-3 text-[11px] text-slate-600">
          <div className="flex flex-col items-center gap-1">
            <Truck className="w-4 h-4 text-emerald-600" />
            <span>Fast delivery</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Shield className="w-4 h-4 text-blue-600" />
            <span>Secure payments</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>7-day support</span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ---------------------- Main Cart Page ---------------------- */

// Delivery charges are derived from useCharges; avoid hardcoded thresholds

const CartPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const {
    charges,
    loading: chargesLoading,
    error: chargesError,
    getApplicableCharges,
    getChargesBreakdown,
  } = useCharges();

  const { items: cart, loading, error } = useSelector((state) => state.cart);
  const { user: authUser } = useSelector((state) => state.auth);

  const [removingItems, setRemovingItems] = useState(new Set());
  const [isClearingCart, setIsClearingCart] = useState(false);

  // Load cart on mount
  useEffect(() => {
    if (authUser) {
      dispatch(fetchCart());
    } else {
      toast.info("Please login to view your cart");
      navigate("/login");
    }
  }, [dispatch, authUser, navigate]);

  // Totals (memoized)
  const { subtotal, originalTotal, totalSavings, shipping, total } = useMemo(() => {
    if (!cart || cart.length === 0) {
      return {
        subtotal: 0,
        originalTotal: 0,
        totalSavings: 0,
        shipping: 0,
        total: 0,
      };
    }

    let sub = 0;
    let orig = 0;

    cart.forEach((item) => {
      const product = item.product || item;

      const origPerUnit =
        item.originalPrice ??
        product?.weightOptions?.[0]?.originalPrice ??
        item.price ??
        product?.weightOptions?.[0]?.price ??
        0;

      const pricePerUnit =
        item.price ?? product?.weightOptions?.[0]?.price ?? origPerUnit;

      sub += pricePerUnit * item.quantity;
      orig += origPerUnit * item.quantity;
    });

    const savings = orig - sub;

    let delivery = 0;
    let chargesTotal = 0;
    if (charges && charges.length > 0) {
      const breakdown = getChargesBreakdown(charges);
      delivery = breakdown.deliveryCharges || 0;
      chargesTotal = breakdown.total || delivery;
    }

    return {
      subtotal: sub,
      originalTotal: orig,
      totalSavings: savings > 0 ? savings : 0,
      shipping: delivery,
      total: sub + chargesTotal,
    };
  }, [cart, charges, getChargesBreakdown]);

  // Fetch applicable charges whenever cart or subtotal changes
  useEffect(() => {
    if (cart && cart.length > 0) {
      getApplicableCharges(cart, subtotal);
    }
  }, [cart, subtotal, getApplicableCharges]);

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      await handleRemoveItem(itemId);
      return;
    }
    try {
      await dispatch(
        updateQuantityAPI({
          itemId,
          quantity: newQuantity,
        })
      ).unwrap();
    } catch (err) {
      console.error("Failed to update cart:", err);
      toast.error(
        err?.message || "Failed to update cart. Please try again."
      );
    }
  };

  const handleRemoveItem = async (itemId) => {
    setRemovingItems((prev) => new Set(prev).add(itemId));
    try {
      await dispatch(deleteCartItem(itemId)).unwrap();
      toast.success("Item removed from cart");
    } catch (err) {
      console.error("Failed to remove item:", err);
      toast.error(err?.message || "Failed to remove item");
    } finally {
      setRemovingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm("Clear entire cart?")) return;
    setIsClearingCart(true);
    try {
      const loadingToast = toast.loading("Clearing your cart...");
      await dispatch(clearCart()).unwrap();
      toast.dismiss(loadingToast);
      toast.success("Cart cleared");
    } catch (err) {
      console.error("Failed to clear cart:", err);
      toast.error(err?.message || "Failed to clear cart");
    } finally {
      setIsClearingCart(false);
    }
  };

  const handleNavigateToProduct = (productId) => {
    navigate(`/products/${productId}`);
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  /* ----------- Loading / Error / Empty States ----------- */

  if (loading && (!cart || cart.length === 0)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Loading your cart
          </h2>
          <p className="text-sm text-slate-500">Please wait a moment…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-rose-100 p-6 max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-3">
            <AlertCircle className="w-6 h-6 text-rose-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Something went wrong
          </h2>
          <p className="text-sm text-slate-600 mb-4">
            {typeof error === "string"
              ? error
              : error?.message || "Failed to load your cart."}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (!cart || cart.length === 0) {
    return (
      <EmptyCart onContinueShopping={() => handleNavigate("/products")} />
    );
  }

  const canCheckout = total > 0;

  /* ---------------------- Main Layout ---------------------- */

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNavigate("/")}
              className="p-2 rounded-xl hover:bg-slate-100"
            >
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center">
                <ShoppingCart className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-emerald-600 font-semibold">
                  Tastyaana
                </p>
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-lg font-semibold text-slate-900">
                    Your cart
                  </h1>
                  {totalSavings > 0 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold">
                      You&apos;re saving ₹{totalSavings.toLocaleString()}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  {cart.length} {cart.length === 1 ? "item" : "items"} •{" "}
                  {shipping > 0
                    ? `Delivery ₹${shipping.toLocaleString()}`
                    : "Free delivery"}
                </p>
              </div>
            </div>
          </div>

          {cart.length > 0 && (
            <button
              onClick={handleClearCart}
              disabled={isClearingCart}
              className="text-xs font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isClearingCart ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Clearing…
                </span>
              ) : (
                "Clear cart"
              )}
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 pb-24 lg:pb-6">
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
            {/* Items */}
            <section className="lg:col-span-2 space-y-3">
              {cart.map((item) => (
                <CartItem
                  key={item.id || item._id}
                  item={item}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemove={handleRemoveItem}
                  onNavigateToProduct={handleNavigateToProduct}
                  isRemoving={removingItems.has(item.id || item._id)}
                />
              ))}
            </section>

            {/* Summary (desktop sticky) */}
            <aside className="hidden lg:block lg:sticky lg:top-24 h-fit">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center">
                      <Package className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-slate-900">
                        Order summary
                      </h2>
                      <p className="text-[11px] text-emerald-700">
                        {cart.length} item
                        {cart.length > 1 ? "s" : ""} in your cart
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <div className="flex justify-between text-sm text-slate-700">
                    <span>Items total</span>
                    <span className="font-medium">
                      ₹{subtotal.toLocaleString()}
                    </span>
                  </div>

                  {totalSavings > 0 && (
                    <div className="flex justify-between text-sm text-emerald-700">
                      <span className="inline-flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Savings
                      </span>
                      <span className="font-semibold">
                        -₹{totalSavings.toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-sm text-slate-700">
                    <span className="inline-flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      Delivery
                    </span>
                    <span className="font-medium">
                      {shipping === 0 ? (
                        <span className="text-emerald-600">Free</span>
                      ) : (
                        <>₹{shipping.toLocaleString()}</>
                      )}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    Taxes are included in the item price.
                  </p>

                  <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900">
                      To pay
                    </span>
                    <span className="text-lg font-bold text-slate-900">
                      ₹{total.toLocaleString()}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      canCheckout
                        ? handleNavigate("/checkout")
                        : toast.error("Cart is empty")
                    }
                    disabled={!canCheckout}
                    className="w-full mt-2 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Proceed to checkout
                  </button>

                  <button
                    onClick={() => handleNavigate("/products")}
                    className="w-full mt-2 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-slate-50 text-slate-800 text-sm font-semibold hover:bg-slate-100"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add more items
                  </button>

                  {/* Trust badges */}
                  <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-100">
                    <div className="text-center">
                      <div className="w-7 h-7 rounded-xl bg-emerald-50 flex items-center justify-center mx-auto mb-1">
                        <Shield className="w-3.5 h-3.5 text-emerald-700" />
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium">
                        Secure
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-7 h-7 rounded-xl bg-blue-50 flex items-center justify-center mx-auto mb-1">
                        <Truck className="w-3.5 h-3.5 text-blue-600" />
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium">
                        Fast
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-7 h-7 rounded-xl bg-amber-50 flex items-center justify-center mx-auto mb-1">
                        <Phone className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <p className="text-[11px] text-slate-600 font-medium">
                        Support
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* Mobile bottom bar */}
      <div className="lg:hidden fixed inset-x-0 z-30 bg-white border-t border-slate-200 fixed-above-bottom-nav">
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-slate-500">To pay</p>
            <p className="text-base font-semibold text-slate-900">
              ₹{total.toLocaleString()}
            </p>
            {shipping === 0 ? (
              <p className="text-[11px] text-emerald-600">
                Free delivery applied
              </p>
            ) : (
              <p className="text-[11px] text-slate-500">
                Delivery ₹{shipping.toLocaleString()}
              </p>
            )}
          </div>
          <button
            onClick={() =>
              canCheckout
                ? handleNavigate("/checkout")
                : toast.error("Cart is empty")
            }
            disabled={!canCheckout}
            className="flex-1 inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <CreditCard className="w-4 h-4 mr-1.5" />
            Checkout
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
