import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Search,
  ShoppingCart,
  ChevronRight,
  Star,
  Home,
  User,
  Truck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { addToCartAPI } from "../../redux/cartSlice";
import {
  addToWishlistAPI,
  removeFromWishlistAPI,
} from "../../redux/wishlistSlice";
import GroceryCard from "../../components/buyer/GroceryCard";
import { toast } from "react-hot-toast";
import { useGetGroceryProductsQuery } from "../../redux/storee/api";
import { useGetGroceryCategoriesQuery } from "../../redux/storee/api";
import { Skeleton } from "@mui/material";

const GroceryHomePage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux selectors
  const { items: wishlistItems = [] } = useSelector(
    (state) => state.wishlist || {}
  );
  const authUser = useSelector((state) => state.auth?.user);
  const [quantity, setQuantity] = useState(1);
  const [selectedWeight, setSelectedWeight] = useState(null);

  // Handle add to cart
  const handleAddToCart = async (payload) => {
    if (!authUser) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }
    if (!payload) {
      toast.error("Please select a product ");
      return;
    }

    try {
      // const payload = {
      //   productId: product._id,
      //   payload: {
      //     weight: selectedWeight.weight,
      //     price: selectedWeight.price,
      //     unit: selectedWeight.unit || 'g'
      //   },
      //   quantity: quantity
      // };

      // console.log("Adding to cart payload:", payload);
      dispatch(addToCartAPI(payload));
      toast.success("Product added to cart successfully!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error(error?.message || "Failed to add product to cart");
    }
  };

  // Local state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  console.log("Selected Category:", selectedCategory);
  // RTK Query hooks
  const {
    data: groceriesResponse,
    isLoading: isLoadingGroceries,
    error: groceriesError,
    refetch: refetchGroceries,
  } = useGetGroceryProductsQuery({
    category: selectedCategory === "all" ? undefined : selectedCategory,
    search: searchTerm || undefined,
    limit: 50,
  });

  const { data: categoriesResponse, isLoading: isLoadingCategories } =
    useGetGroceryCategoriesQuery();

  // Process data from API responses
  const allProducts = groceriesResponse?.products || [];
  const displayCategories = categoriesResponse || [];
  console.log("displayCategories", displayCategories, categoriesResponse);
  // Track loading state
  const isLoading = isLoadingGroceries || isLoadingCategories;

  // Get one product per category for the featured section
  const getOneProductPerCategory = (products) => {
    const categoryMap = new Map();
    // console.log("All products:", products);
    products?.forEach((product) => {
      if (
        product.category &&
        product.category._id &&
        !categoryMap.has(product.category._id)
      ) {
        categoryMap.set(product.category._id, product);
      }
    });

    return Array.from(categoryMap.values());
  };

  const oneProductPerCategory = getOneProductPerCategory(allProducts);

  // Fallback categories if API doesn't return any
  const fallbackCategories = [
    { _id: "all", name: "All Items", icon: "🛒", color: "bg-gray-100" },
    {
      _id: "vegetables",
      name: "Fresh Vegetables",
      icon: "🥬",
      color: "bg-green-100",
    },
    { _id: "fruits", name: "Fresh Fruits", icon: "🍎", color: "bg-red-100" },
    { _id: "dairy", name: "Dairy Products", icon: "🥛", color: "bg-blue-100" },
    {
      _id: "pulses",
      name: "Pulses & Grains",
      icon: "🫘",
      color: "bg-yellow-100",
    },
    {
      _id: "spices",
      name: "Spices & Masalas",
      icon: "🌶️",
      color: "bg-orange-100",
    },
  ];

  // Use API categories if available, otherwise use fallback
  const categories =
    displayCategories.length > 0
      ? [
          { _id: "all", name: "All Items", icon: "🛒", color: "bg-gray-100" },
          ...displayCategories,
        ]
      : fallbackCategories;

  // Filter products by selected category
  const filteredProducts =
    selectedCategory === "all"
      ? allProducts
      : allProducts.filter(
          (product) => product.category?._id === selectedCategory
        );

  // Handle category selection
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    // Scroll to products section
    const productsSection = document.getElementById("products-section");
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    refetchGroceries();
  };

  // Handle add to cart
  // const handleAddToCart = async (product, selectedWeight, quantity = 1) => {
  //   if (!authUser) {
  //     toast.info("Please login to add items to cart");
  //     navigate("/login");
  //     return;
  //   }

  //   try {
  //     const cartItem = {
  //       productId: product._id,
  //       name: product.name,
  //       price: selectedWeight?.price || product.price,
  //       originalPrice:
  //         selectedWeight?.originalPrice ||
  //         product.originalPrice ||
  //         product.price * 1.25,
  //       weight: selectedWeight?.weight || "1 unit",
  //       quantity: quantity,
  //       category: product.category?.name || "grocery",
  //       image:
  //         product.images?.[0]?.url ||
  //         product.image ||
  //         "/images/placeholder-product.png",
  //       description: product.description,
  //       weightOptions: product.weightOptions || [],
  //     };

  //     await dispatch(addToCartAPI(cartItem));
  //     toast.success("Added to cart successfully!");
  //   } catch (error) {
  //     console.error("Error adding to cart:", error);
  //     toast.error(error?.message || "Failed to add to cart");
  //   }
  // };

  // Handle wishlist toggle
  const handleWishlistToggle = async (product) => {
    if (!authUser) {
      toast.info("Please login to manage wishlist");
      return;
    }

    const isInWishlist = (productId) => {
      return wishlistItems?.items?.some(
        (item) => item.product?._id === productId || item._id === productId
      );
    };

    console.log("Toggling wishlist for product:", wishlistItems);
    try {
      if (isInWishlist(product._id)) {
        await dispatch(removeFromWishlistAPI(product._id)).unwrap();
        toast.success(`${product.name} removed from wishlist`);
      } else {
        await dispatch(addToWishlistAPI(product)).unwrap();
        toast.success(`${product.name} added to wishlist`);
      }
    } catch (error) {
      console.error("Error toggling wishlist:", error);
      toast.error(error?.message || "Failed to update wishlist");
    }
  };

  // Handle remove from wishlist
  const handleRemoveFromWishlist = async (productId) => {
    if (!authUser) return;

    try {
      dispatch(removeFromWishlistAPI(productId));
      toast.success("Removed from wishlist");
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      toast.error(error?.message || "Failed to remove from wishlist");
    }
  };

  // Determine which products to display based on search and category
  const displayProducts =
    searchTerm && searchTerm.length >= 2
      ? filteredProducts
      : selectedCategory === "all"
      ? oneProductPerCategory
      : filteredProducts;

  // Loading skeleton for product cards
  const renderLoadingSkeleton = (count = 6) => (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm p-3">
          <Skeleton variant="rectangular" className="w-full h-32 mb-2" />
          <Skeleton variant="text" className="w-3/4" />
          <Skeleton variant="text" className="w-1/2" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">Groceries</h1>
            <button
              onClick={() => navigate("/cart")}
              className="p-2 text-gray-600 hover:text-gray-900 relative"
            >
              <ShoppingCart className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search for groceries..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button
              type="submit"
              className="absolute inset-y-0 right-0 px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Search
            </button>
          </form>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-3">Categories</h2>
          <div className="flex space-x-3 overflow-x-auto pb-2 -mx-2 px-2">
            {console.log(categories)}
            {categories?.map((category) => (
              <button
                key={category._id}
                onClick={() => handleCategorySelect(category._id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium ${
                  selectedCategory === category._id
                    ? "bg-blue-600 text-white"
                    : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {/* {category.icon && <span className="mr-2">{category.icon}</span>} */}
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Products */}
        {!searchTerm && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">
                Shop by Category
              </h2>
              <button
                onClick={() => navigate("/grocery")}
                className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
              >
                View All <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>

            {isLoading ? (
              renderLoadingSkeleton(5)
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {oneProductPerCategory.slice(0, 5).map((product, index) => (
                  <GroceryCard
                    key={product._id || index}
                    product={product}
                    index={index}
                    onAddToCart={handleAddToCart}
                    onAddToWishlist={handleWishlistToggle}
                    onRemoveFromWishlist={handleRemoveFromWishlist}
                    isInWishlist={wishlistItems?.items?.some(
                      (item) =>
                        item.product?._id === product._id ||
                        item._id === product._id
                    )}
                    onNavigateToProduct={() =>
                      navigate(`/grocery/${product._id}`)
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Results or All Products */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            {searchTerm ? "Search Results" : "All Products"}
          </h2>

          {isLoading ? (
            renderLoadingSkeleton()
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {displayProducts.map((product, index) => (
                <GroceryCard
                  key={product._id || index}
                  product={product}
                  index={index}
                  onAddToCart={handleAddToCart}
                  onAddToWishlist={handleWishlistToggle}
                  onRemoveFromWishlist={handleRemoveFromWishlist}
                  isInWishlist={wishlistItems?.items?.some(
                    (item) =>
                      item.product?._id === product._id ||
                      item._id === product._id
                  )}
                  onNavigateToProduct={() =>
                    navigate(`/grocery/${product._id}`)
                  }
                />
              ))}
            </div>
          )}

          {!isLoading && displayProducts.length === 0 && (
            <div className="text-center py-10">
              <p className="text-gray-500">
                {searchTerm
                  ? `No products found for "${searchTerm}"`
                  : "No products available in this category"}
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-4 text-sm text-green-600 hover:text-green-700"
                >
                  Clear search and show all products
                </button>
              )}
            </div>
          )}
        </div>

        {/* Banner */}
        <div className="px-6 mb-6">
          <div className="bg-green-500 text-white rounded-xl p-6 relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-2">Fresh & Healthy</h2>
              <p className="mb-4 opacity-90">
                Get up to 30% off on your first order
              </p>
              <button className="bg-white text-green-600 px-4 py-2 rounded-lg font-medium">
                Shop Now
              </button>
            </div>
            <div className="absolute right-0 bottom-0 opacity-20 text-9xl">
              🥬
            </div>
          </div>
        </div>

        {/* Delivery Time */}
        <div className="px-6 mb-6">
          <div className="bg-gray-100 rounded-lg p-4 flex items-center">
            <div className="bg-white p-2 rounded-full mr-3">
              <Truck className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Delivery in</p>
              <p className="font-medium">30-45 min</p>
            </div>
            <button className="ml-auto text-green-600 font-medium">
              Change
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
export default GroceryHomePage;
