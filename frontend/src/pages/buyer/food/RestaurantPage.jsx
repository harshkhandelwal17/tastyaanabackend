// src/pages/RestaurantPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  ArrowLeft,
  Star,
  Clock,
  MapPin,
  Loader2,
  Search,
  ShoppingCart,
  Heart,
} from "lucide-react";
import { toast } from "react-hot-toast";

import { useOptimizedCart } from "../../../hooks/useOptimizedCart";
import { useOptimizedWishlist } from "../../../hooks/useOptimizedWishlist";

/* ===========================
   ZOMATO-LIKE DISH CARD
   =========================== */

const DishCard = ({
  product,
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-transform hover:-translate-y-0.5 p-3 flex gap-3">
      {/* Image */}
      <button
        onClick={onViewProduct}
        className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50"
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400";
          }}
        />
        {product.discount > 0 && (
          <span className="absolute bottom-1 left-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-semibold">
            {product.discount}% OFF
          </span>
        )}
      </button>

      {/* Right content */}
      <div className="flex-1 flex flex-col justify-between gap-1">
        {/* Top: name + wishlist + rating */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-[13px] sm:text-sm font-semibold text-gray-900 line-clamp-2">
              {product.name}
            </h3>

            {product.isVeg && (
              <span className="inline-flex items-center mt-0.5 text-[10px] px-1.5 py-0.5 border border-green-600 text-green-700 rounded">
                Veg
              </span>
            )}

            {product.restaurantName && (
              <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">
                {product.restaurantName}
              </p>
            )}
          </div>

          <div className="flex flex-col items-end gap-1">
            <button
              onClick={onToggleWishlist}
              className={`w-7 h-7 rounded-full flex items-center justify-center border transition ${
                isWishlisted
                  ? "border-red-500 bg-red-50 text-red-600"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-red-50 hover:border-red-300 hover:text-red-500"
              }`}
            >
              <Heart
                className={`w-3.5 h-3.5 ${
                  heartIconProps?.icon || (isWishlisted ? "fill-current" : "")
                }`}
              />
            </button>
            <div className="flex items-center gap-1 bg-green-700 text-white text-[11px] px-1.5 py-0.5 rounded">
              <Star className="w-3 h-3" />
              <span>{Number(product.rating || 4).toFixed(1)}</span>
            </div>
          </div>
        </div>

        {/* Price + time */}
        <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-1">
          <span className="font-semibold text-gray-900 text-[13px]">
            ₹{displayPrice}
            {product.originalPrice &&
              product.originalPrice > displayPrice && (
                <span className="ml-1 text-[10px] text-gray-400 line-through">
                  ₹{product.originalPrice}
                </span>
              )}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {product.deliveryTime || "25–35 mins"}
          </span>
        </div>

        {/* Weight options */}
        {product.weightOptions?.length > 0 && (
          <select
            className="w-full mt-1.5 p-1.5 text-[11px] border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-orange-500"
            value={selectedWeight.weight}
            onChange={(e) => {
              const w = product.weightOptions.find(
                (x) => x.weight === e.target.value
              );
              setSelectedWeight(
                w || { weight: e.target.value, price: product.price || 0 }
              );
            }}
          >
            {product.weightOptions.map((w) => (
              <option key={w.weight} value={w.weight}>
                {w.weight} • ₹{w.price}
              </option>
            ))}
          </select>
        )}

        {/* Bottom: buttons */}
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={onViewProduct}
            className="text-[11px] px-3 py-1.5 rounded-full border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            View details
          </button>

          {cartQuantity > 0 ? (
            <div className="flex items-center gap-2">
              <button
                onClick={handleRemove}
                disabled={isLoading}
                className="w-8 h-8 rounded-full border border-orange-300 text-orange-600 text-lg flex items-center justify-center bg-white"
              >
                –
              </button>
              <span className="text-sm font-semibold text-gray-900">
                {cartQuantity}
              </span>
              <button
                onClick={handleAdd}
                disabled={isLoading || product.inStock === false}
                className="w-8 h-8 rounded-full bg-orange-600 text-white text-lg flex items-center justify-center disabled:opacity-60"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              disabled={isLoading || product.inStock === false}
              className="px-4 py-1.5 rounded-full bg-orange-600 text-white text-[12px] font-semibold disabled:opacity-60"
            >
              Add
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ===========================
   HELPERS
   =========================== */

// Ensure only food items (avoid grocery mixes)
const isFoodProduct = (raw) => {
  const main = (
    raw.mainCategory || raw.category || raw.categoryName || raw.type || ""
  )
    .toString()
    .toLowerCase();

  const banned = [
    "grocery",
    "vegetable",
    "fruit",
    "fruits",
    "veggie",
    "cleaning",
    "household",
    "staple",
    "dal",
    "atta",
    "oil",
  ];

  if (banned.some((b) => main.includes(b))) return false;
  if (raw.isFood === false) return false;
  return true;
};

/* ===========================
   MAIN RESTAURANT PAGE
   =========================== */

const RestaurantPage = () => {
  const { restaurantId } = useParams();
  const navigate = useNavigate();

  const { user: userInfo, isAuthenticated } = useSelector(
    (state) => state.auth
  );

  const {
    addToCart,
    updateCartQuantity,
    cartItems: cartReduxItems,
    totalQuantity: cartReduxCount,
  } = useOptimizedCart();

  const {
    wishlistItems,
    toggleWishlist,
    getHeartIconProps,
  } = useOptimizedWishlist();

  const [restaurant, setRestaurant] = useState(null);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchDish, setSearchDish] = useState("");
  const [vegOnly, setVegOnly] = useState(false);

  const API_BASE_URL =
    import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api";

  useEffect(() => {
    const fetchRestaurantData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${API_BASE_URL}/products?category=foodzone&restaurantId=${restaurantId}`
        );
        let data = await res.json();
        let productsData =
          Array.isArray(data) ? data : data.products || data.data || [];

        if (!productsData.length) {
          productsData = [
            {
              _id: "demo-food-1",
              name: "Sample Thali",
              price: 199,
              rating: 4.3,
              reviews: 112,
              images: [],
              inStock: true,
              restaurantName: "Demo Restaurant",
            },
          ];
        }

        const filtered = productsData.filter((p) => isFoodProduct(p));

        const processed = filtered.map((p) => {
          const baseWeight = p.weightOptions?.[0];
          const price = baseWeight?.price || p.price || 0;
          const originalPrice =
            baseWeight?.originalPrice || p.originalPrice || null;

          const discount =
            originalPrice && price
              ? Math.round(((originalPrice - price) / originalPrice) * 100)
              : p.discount || 0;

          const isVeg =
            p.isVeg ?? p.veg ?? (p.type === "veg" ? true : false);

          const rawCuisines =
            p.cuisines || p.cuisine || p.tags || p.categoryNames || [];

          const cuisines = Array.isArray(rawCuisines)
            ? rawCuisines
            : rawCuisines.toString().split(",");

          return {
            ...p,
            id: p._id || p.id,
            name: p.name || p.title || "Dish",
            image:
              p.images?.[0]?.url ||
              p.images?.[0] ||
              p.image ||
              "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400",
            rating: Number(p.rating?.average || p.rating || 4.0),
            reviews:
              p.reviewCount ||
              p.reviews ||
              Math.floor(Math.random() * 300) + 20,
            price,
            originalPrice,
            discount,
            inStock:
              p.isAvailable !== false &&
              (p.stockQty > 0 ||
                baseWeight?.stock > 0 ||
                p.inStock !== false),
            isVeg,
            restaurantName:
              p.restaurantName || p.restaurant?.name || "Restaurant",
            deliveryTime: p.deliveryTime || "25–35 mins",
            cuisines,
            location: p.location || "Nearby area",
          };
        });

        setDishes(processed);

        const first = processed[0];
        setRestaurant({
          id: restaurantId,
          name:
            first.restaurantName ||
            first.restaurant?.name ||
            "Restaurant",
          image:
            first.restaurantImage ||
            first.image ||
            "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400",
          rating: first.rating,
          reviews: first.reviews,
          deliveryTime: first.deliveryTime,
          location: first.location || "Nearby area",
          isPureVeg: processed.length
            ? processed.every((d) => d.isVeg)
            : false,
          cuisines: first.cuisines?.length
            ? first.cuisines
            : ["Indian", "Home Food"],
        });
      } catch (err) {
        console.error("Restaurant fetch error", err);
        toast.error("Failed to load restaurant");
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurantData();
  }, [restaurantId, API_BASE_URL]);

  const filteredDishes = useMemo(() => {
    return dishes.filter((dish) => {
      if (
        searchDish &&
        !dish.name.toLowerCase().includes(searchDish.toLowerCase())
      )
        return false;
      if (vegOnly && !dish.isVeg) return false;
      return true;
    });
  }, [dishes, searchDish, vegOnly]);

  // Cart handlers
  const handleAddToCart = async (product, selectedWeight) => {
    const weight = selectedWeight?.weight || product?.unit || "1 unit";
    await addToCart(product._id || product.id, weight, 1);
  };

  const handleRemoveFromCart = async (product) => {
    const productId = product.id || product._id;
    const cartItem = cartReduxItems.find((item) => {
      if (
        item.product &&
        (item.product._id === productId || item.product.id === productId)
      )
        return true;
      if (item.productId === productId) return true;
      if (item.id === productId || item._id === productId) return true;
      return false;
    });

    if (cartItem) {
      const newQuantity = cartItem.quantity - 1;
      await updateCartQuantity(productId, newQuantity);
    }
  };

  const handleToggleWishlist = async (product) => {
    if (!userInfo || !isAuthenticated) {
      toast.info("Please login to manage your wishlist");
      navigate("/login");
      return;
    }
    toggleWishlist(product);
  };

  if (loading || !restaurant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto mb-3" />
          <p className="text-gray-600 text-sm font-medium">
            Loading restaurant...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md shadow-sm">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2 flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-lg hover:bg-gray-100 flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-base font-semibold text-gray-900 truncate">
              {restaurant.name}
            </h1>
            <p className="text-[11px] text-gray-500 truncate">
              {restaurant.cuisines?.join(" • ")}
            </p>
          </div>
          <button
            onClick={() => navigate("/cart")}
            className="relative p-1.5 rounded-lg hover:bg-gray-100 flex-shrink-0"
          >
            <ShoppingCart className="w-5 h-5 text-gray-700" />
            {cartReduxCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                {cartReduxCount > 9 ? "9+" : cartReduxCount}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="pt-16 sm:pt-20">
        <div className="max-w-4xl mx-auto px-3 sm:px-4">
          {/* HERO */}
          <section className="mb-4">
            <div className="rounded-3xl overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.12)] bg-gray-900 relative">
              <div className="h-40 sm:h-52 w-full overflow-hidden">
                <img
                  src={restaurant.image}
                  alt={restaurant.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src =
                      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400";
                  }}
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4 text-white space-y-1">
                <h2 className="text-lg sm:text-2xl font-semibold">
                  {restaurant.name}
                </h2>
                <p className="text-[11px] sm:text-[13px] text-gray-100">
                  {restaurant.cuisines?.join(" • ")}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] sm:text-[12px] mt-1">
                  <span className="flex items-center gap-1 bg-green-700 px-2 py-0.5 rounded-full">
                    <Star className="w-3 h-3" />
                    <span>{restaurant.rating?.toFixed(1)}</span>
                    <span className="text-gray-100/80">
                      ({restaurant.reviews}+ ratings)
                    </span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {restaurant.deliveryTime}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {restaurant.location}
                  </span>
                  {restaurant.isPureVeg && (
                    <span className="px-2 py-0.5 rounded-full border border-green-300 text-green-100 text-[10px]">
                      Pure veg restaurant
                    </span>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* FILTER BAR */}
          <section className="mb-4">
            <div className="bg-white rounded-2xl border border-gray-100 px-3 py-2.5 flex flex-col sm:flex-row sm:items-center gap-2 shadow-sm">
              <div className="flex-1">
                <p className="text-[11px] text-gray-500 mb-1">
                  Search within this restaurant
                </p>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Type dish name..."
                    value={searchDish}
                    onChange={(e) => setSearchDish(e.target.value)}
                    className="w-full pl-8 pr-2 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs sm:text-[13px] focus:outline-none focus:bg-white focus:border-orange-500"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between sm:justify-end gap-2">
                <button
                  onClick={() => setVegOnly((v) => !v)}
                  className={`px-3 py-1.5 rounded-full text-[11px] border min-w-[80px] flex justify-center ${
                    vegOnly
                      ? "border-green-600 text-green-700 bg-green-50"
                      : "border-gray-200 text-gray-600 bg-white"
                  }`}
                >
                  Veg only
                </button>
                <span className="hidden sm:inline-block text-[11px] text-gray-500">
                  {filteredDishes.length} dishes
                </span>
              </div>
            </div>
          </section>

          {/* MENU SECTION */}
          <section>
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">
              Menu
            </h3>

            <div className="space-y-3">
              {filteredDishes.map((dish) => {
                const productId = dish.id || dish._id;

                const isWishlisted = wishlistItems.some((item) => {
                  if (item._id && item._id === productId) return true;
                  if (item.id && item.id === productId) return true;
                  if (
                    item.product &&
                    (item.product._id === productId ||
                      item.product.id === productId)
                  )
                    return true;
                  return false;
                });

                const cartItem = cartReduxItems.find((item) => {
                  if (
                    item.product &&
                    (item.product._id === productId ||
                      item.product.id === productId)
                  )
                    return true;
                  if (item.productId === productId) return true;
                  if (item.id === productId || item._id === productId)
                    return true;
                  return false;
                });

                const cartQuantity = cartItem ? cartItem.quantity : 0;

                return (
                  <DishCard
                    key={productId}
                    product={dish}
                    isWishlisted={isWishlisted}
                    cartQuantity={cartQuantity}
                    onAddToCart={handleAddToCart}
                    onRemoveFromCart={handleRemoveFromCart}
                    onToggleWishlist={() => handleToggleWishlist(dish)}
                    onViewProduct={() =>
                      navigate(`/products/${dish.id || dish._id}`)
                    }
                    heartIconProps={getHeartIconProps(productId)}
                  />
                );
              })}
            </div>

            {filteredDishes.length === 0 && (
              <div className="mt-10 bg-white rounded-2xl shadow p-6 text-center">
                <div className="text-4xl mb-3">😕</div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  No dishes found
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  Try removing filters or search again.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default RestaurantPage;
