import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Search,
  ShoppingCart,
  MapPin,
  Check,
  ChevronRight,
  Menu,
  Star,
  Clock,
  Shield,
} from "lucide-react";
import { addToCartAPI } from "../../redux/cartSlice";
import {
  addToWishlistAPI,
  removeFromWishlistAPI,
} from "../../redux/wishlistSlice";
import GroceryCard from "../../components/buyer/GroceryCard";
import { toast } from "react-hot-toast";
import {
  useGetGroceryProductsByCategoryQuery,
  useGetGroceryCategoriesQuery,
  useSearchGroceryProductsQuery,
} from "../../redux/storee/api";

function GroceryCategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux selectors
  const { items: wishlistItems } = useSelector((state) => state.wishlist);
  const { items: cartItems } = useSelector((state) => state.cart);
  const authUser = useSelector((state) => state.auth?.user);

  // Local state
  const [activeCategory, setActiveCategory] = useState(
    categoryId || "vegetables"
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  // RTK Query hooks
  const {
    data: categoryProducts = [],
    isLoading: productsLoading,
    error: productsError,
  } = useGetGroceryProductsByCategoryQuery(activeCategory, {
    skip: !activeCategory,
  });
  console.log(categoryProducts);
  const { data: categories = [], isLoading: categoriesLoading } =
    useGetGroceryCategoriesQuery();

  const { data: searchResults = [], isLoading: searchLoading } =
    useSearchGroceryProductsQuery(searchTerm, {
      skip: !searchTerm || searchTerm.length < 2,
    });

  // Update active category when URL param changes
  useEffect(() => {
    if (categoryId) {
      setActiveCategory(categoryId);
    }
  }, [categoryId]);

  // Auto-open sidebar on component mount for mobile only
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        // md breakpoint
        // Short delay to allow the animation to be visible
        const timer = setTimeout(() => {
          setSidebarOpen(true);
        }, 300);

        return () => clearTimeout(timer);
      } else {
        setSidebarOpen(false); // No need for mobile sidebar on larger screens
      }
    };

    handleResize(); // Run on mount

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fallback categories if API doesn't return any
  const fallbackCategories = [
    {
      id: "vegetables",
      name: "Fresh Vegetables",
      icon: "🥬",
      color: "bg-green-100",
    },
    { id: "fruits", name: "Fresh Fruits", icon: "🍎", color: "bg-red-100" },
    { id: "dairy", name: "Dairy Products", icon: "🥛", color: "bg-blue-100" },
  ];

  const mockProducts = [
    // Vegetables
    {
      id: 1,
      name: "Onion 1kg (Pyaz)",
      description: "1 kg",
      price: 33,
      originalPrice: 40,
      discount: "20% OFF",
      image: "🧅",
      category: "vegetables",
      available: true,
    },
    {
      id: 2,
      name: "Cauliflower (Phool Gobhi)",
      description: "1 piece (400 g - 600 g)",
      price: 32,
      originalPrice: 43,
      discount: "25% OFF",
      image: "🥦",
      category: "vegetables",
      available: true,
    },
    {
      id: 3,
      name: "Desi Tomato (Tamatar)",
      description: "500 g",
      price: 28,
      originalPrice: 35,
      discount: "20% OFF",
      image: "🍅",
      category: "vegetables",
      available: true,
    },
    {
      id: 4,
      name: "Carrot (Gajar)",
      description: "500 g",
      price: 25,
      originalPrice: 33,
      discount: "25% OFF",
      image: "🥕",
      category: "vegetables",
      available: true,
    },

    // Fruits
    {
      id: 5,
      name: "Apple (Seb)",
      description: "4 pcs (500-700 g)",
      price: 120,
      originalPrice: 150,
      discount: "20% OFF",
      image: "🍎",
      category: "fruits",
      available: true,
    },
    {
      id: 6,
      name: "Banana (Kela)",
      description: "6 pcs (500-700 g)",
      price: 40,
      originalPrice: 50,
      discount: "20% OFF",
      image: "🍌",
      category: "fruits",
      available: true,
    },
    {
      id: 7,
      name: "Orange (Santra)",
      description: "4 pcs (600-800 g)",
      price: 90,
      originalPrice: 110,
      discount: "18% OFF",
      image: "🍊",
      category: "fruits",
      available: true,
    },
    {
      id: 8,
      name: "Watermelon (Tarbuj)",
      description: "1 pc (2-3 kg)",
      price: 70,
      originalPrice: 90,
      discount: "22% OFF",
      image: "🍉",
      category: "fruits",
      available: true,
    },

    // Dairy
    {
      id: 9,
      name: "Milk",
      description: "500 ml",
      price: 25,
      originalPrice: 30,
      discount: "16% OFF",
      image: "🥛",
      category: "dairy",
      available: true,
    },
    {
      id: 10,
      name: "Yogurt (Dahi)",
      description: "400 g",
      price: 35,
      originalPrice: 40,
      discount: "12% OFF",
      image: "🍶",
      category: "dairy",
      available: true,
    },
    {
      id: 11,
      name: "Cheese Slices",
      description: "10 pcs (200 g)",
      price: 120,
      originalPrice: 140,
      discount: "14% OFF",
      image: "🧀",
      category: "dairy",
      available: true,
    },
    {
      id: 12,
      name: "Butter",
      description: "100 g",
      price: 50,
      originalPrice: 60,
      discount: "16% OFF",
      image: "🧈",
      category: "dairy",
      available: true,
    },
  ];

  const getCategoryTitle = () => {
    switch (activeCategory) {
      case "vegetables":
        return "Vegetables";
      case "fruits":
        return "Fruits";
      case "dairy":
        return "Dairy Products";
      default:
        return "";
    }
  };

  // Change category and update URL
  const changeCategory = (categoryId) => {
    setActiveCategory(categoryId);
    navigate(`/category/${categoryId}`);
    setSidebarOpen(false); // Close sidebar after selection
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Use API data or fallback to mock data
  const displayCategories =
    categories.length > 0 ? categories : fallbackCategories;

  // Filter and sort products
  const allProducts = Array.isArray(
    searchTerm.length >= 2 ? searchResults : categoryProducts?.products
  )
    ? searchTerm.length >= 2
      ? searchResults
      : categoryProducts?.products
    : [];
  console.log("All products:", allProducts);
  const filteredProducts = allProducts.filter((product) => {
    if (!product) return false;
    const searchLower = searchTerm.toLowerCase();
    return (
      (product.name && product.name.toLowerCase().includes(searchLower)) ||
      (product.description &&
        product.description.toLowerCase().includes(searchLower))
    );
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "name") {
      return sortOrder === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    } else if (sortBy === "price") {
      return sortOrder === "asc" ? a.price - b.price : b.price - a.price;
    } else if (sortBy === "rating") {
      return sortOrder === "asc"
        ? (a.ratings?.average || 0) - (b.ratings?.average || 0)
        : (b.ratings?.average || 0) - (a.ratings?.average || 0);
    }
    return 0;
  });

  // Cart and wishlist handlers
  const handleAddToCart = (product) => {
    if (!authUser) {
      toast.info("Please login to add items to cart");
      navigate("/login");
      return;
    }

    const cartItem = {
      productId: product._id || product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      weight: product.weight || "500g",
      quantity: 1,
      category: "grocery",
      image: product.images?.[0]?.url || product.image,
      description: product.description,
    };

    dispatch(addToCartAPI(cartItem));
    toast.success("Added to cart successfully!");
  };

  const handleAddToWishlist = (product) => {
    if (!authUser) {
      toast.info("Please login to add items to wishlist");
      navigate("/login");
      return;
    }
    dispatch(addToWishlistAPI(product));
    toast.success("Added to wishlist!");
  };

  const handleRemoveFromWishlist = (productId) => {
    dispatch(removeFromWishlistAPI(productId));
    toast.success("Removed from wishlist");
  };

  const isInWishlist = (productId) => {
    return wishlistItems?.items?.some(
      (item) => item._id === productId || item.id === productId
    );
  };

  return (
    <div className="min-h-screen bg-white font-['Plus_Jakarta_Sans',sans-serif] flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4 flex items-center">
        <button className="mr-3" onClick={() => navigate("/groceries")}>
          <ChevronRight className="h-6 w-6 text-gray-600 rotate-180" />
        </button>
        <h1 className="text-xl font-medium">
          {getCategoryTitle()} ({sortedProducts.length})
        </h1>
        <div className="ml-auto flex items-center">
          <Search className="h-5 w-5 text-gray-600 mr-4" />
          <button className="md:hidden" onClick={toggleSidebar}>
            <Menu className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Mobile Sidebar with animation - Only for small screens */}
        <div
          className={`md:hidden fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-20 transform transition-transform duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ top: "61px" }} // Adjust based on header height
        >
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-bold text-lg">Categories</h2>
          </div>
          {displayCategories.map((category) => (
            <div
              key={category.id || category._id}
              onClick={() => changeCategory(category.id || category.slug)}
              className={`flex items-center px-6 py-3 cursor-pointer ${
                activeCategory === (category.id || category.slug)
                  ? "bg-green-50 border-l-4 border-green-500"
                  : "hover:bg-gray-50"
              }`}
            >
              <span className="text-xl mr-3">{category.icon || "🛒"}</span>
              <span
                className={`${
                  activeCategory === (category.id || category.slug)
                    ? "font-medium"
                    : ""
                }`}
              >
                {category.name}
              </span>
            </div>
          ))}
        </div>

        {/* Desktop Sidebar - Fixed for medium screens and above */}
        <div className="hidden md:block w-64 bg-white border-r border-gray-200 flex-shrink-0">
          <div className="p-4 border-b border-gray-200">
            <h2 className="font-bold text-lg">Categories</h2>
          </div>
          {displayCategories.map((category) => (
            <div
              key={category.id || category._id}
              onClick={() => changeCategory(category.id || category.slug)}
              className={`flex items-center px-6 py-3 cursor-pointer ${
                activeCategory === (category.id || category.slug)
                  ? "bg-green-50 border-l-4 border-green-500"
                  : "hover:bg-gray-50"
              }`}
            >
              <span className="text-xl mr-3">{category.icon || "🛒"}</span>
              <span
                className={`${
                  activeCategory === (category.id || category.slug)
                    ? "font-medium"
                    : ""
                }`}
              >
                {category.name}
              </span>
            </div>
          ))}
        </div>

        {/* Main Content Area - With padding for desktop sidebar */}
        <div className="md:ml-64 flex-1 overflow-auto">
          {/* Search and Filter Section */}
          <div className="p-4 md:p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>

              {/* Sort Options */}
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="name">Sort by Name</option>
                  <option value="price">Sort by Price</option>
                  <option value="rating">Sort by Rating</option>
                </select>

                <button
                  onClick={() =>
                    setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                  }
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  {sortOrder === "asc" ? "↑" : "↓"}
                </button>
              </div>
            </div>
          </div>

          {/* Banner */}
          <div className="bg-green-100 m-6 p-6 rounded-lg">
            <div className="flex items-center mb-3">
              <div className="text-green-600 mr-2">🌱</div>
              <h2 className="text-lg font-medium text-green-800">
                Say yes to fresh!
              </h2>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2">
                  <MapPin className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-center">
                  <div className="text-green-800 font-medium">No-Hassle</div>
                  <div className="text-green-600 text-sm">Returns</div>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-center">
                  <div className="text-green-800 font-medium">Farm</div>
                  <div className="text-green-600 text-sm">Fresh</div>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-2">
                  <ShoppingCart className="h-6 w-6 text-green-600" />
                </div>
                <div className="text-center">
                  <div className="text-green-800 font-medium">Quality</div>
                  <div className="text-green-600 text-sm">Checked</div>
                </div>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="px-4 md:px-6 pb-16">
            {productsLoading || searchLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                <span className="ml-2 text-gray-600">
                  {searchLoading
                    ? "Searching products..."
                    : "Loading products..."}
                </span>
              </div>
            ) : productsError ? (
              <div className="text-center py-8 text-red-600">
                Error loading products. Please try again.
              </div>
            ) : sortedProducts.length === 0 ? (
              <div className="text-center py-8 text-gray-600">
                {searchTerm
                  ? "No products found matching your search."
                  : "No products found in this category."}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
                {sortedProducts.map((product) => (
                  <GroceryCard
                    key={product._id || product.id}
                    product={product}
                    addToCart={handleAddToCart}
                    addToWishlist={handleAddToWishlist}
                    removeFromWishlist={handleRemoveFromWishlist}
                    isInWishlist={isInWishlist(product._id || product.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay for sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-10"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
}

export default GroceryCategoryPage;
