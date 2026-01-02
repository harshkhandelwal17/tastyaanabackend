// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { useDispatch, useSelector } from "react-redux";
// import { toast } from "react-toastify";
// import ApiService from "../../services/apiService";
// import ModernHeader from "../../components/common/ModernHeader";
// import ProductCard from "../../components/common/ProductCard";
// import {
//   Search, Filter, SlidersHorizontal, Grid3X3, List, 
//   ChevronDown, ArrowLeft, Loader2, Package, Star,
//   Clock, TrendingUp, Zap, Tag, Award, Sparkles,
//   ChevronUp, Users, Flame, Gift, Home, Eye, Share2
// } from "lucide-react";

// const CategoryPage = () => {
//   const { categoryId } = useParams();
//   const navigate = useNavigate();
//   const dispatch = useDispatch();

//   // Get cart and wishlist from Redux store
//   const { items: cartItems } = useSelector((state) => state.cart || { items: [] });
//   const { items: wishlistItems } = useSelector((state) => state.wishlist || { items: [] });
//   const { user: authUser } = useSelector((state) => state.auth || {});

//   // Component states
//   const [currentCategory, setCurrentCategory] = useState(categoryId || "groceries");
//   const [searchQuery, setSearchQuery] = useState("");
//   const [showLocationModal, setShowLocationModal] = useState(false);
//   const [selectedLocation, setSelectedLocation] = useState('Vijay Nagar, Indore');
//   const [showMobileMenu, setShowMobileMenu] = useState(false);
//   const [isScrolled, setIsScrolled] = useState(false);

//   // Filter and sort states
//   const [selectedFilters, setSelectedFilters] = useState({
//     priceRange: [0, 1000],
//     brands: [],
//     rating: 0,
//     discount: 0,
//     availability: "all",
//   });
//   const [sortBy, setSortBy] = useState("popularity");
//   const [viewMode, setViewMode] = useState("grid");
//   const [showFilters, setShowFilters] = useState(false);

//   // API Data States
//   const [products, setProducts] = useState([]);
//   const [category, setCategory] = useState(null);
//   const [categories, setCategories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [loadingMore, setLoadingMore] = useState(false);
//   const [error, setError] = useState(null);
//   const [pagination, setPagination] = useState({
//     page: 1,
//     limit: 20,
//     total: 0,
//     hasMore: true,
//   });

//   // Category-specific data and styling
//   const categoryData = {
//     'groceries': {
//       icon: "🛒",
//       color: "emerald",
//       description: "Fresh groceries and daily essentials delivered fast",
//       gradient: "from-emerald-500 to-teal-600",
//       bgGradient: "from-emerald-50 to-teal-50",
//       textColor: "text-emerald-600",
//       borderColor: "border-emerald-200",
//     },
//     'medicines': {
//       icon: "💊",
//       color: "red",
//       description: "Healthcare products and medicines",
//       gradient: "from-red-500 to-pink-600",
//       bgGradient: "from-red-50 to-pink-50",
//       textColor: "text-red-600",
//       borderColor: "border-red-200",
//     },
//     'electronics': {
//       icon: "📱",
//       color: "blue",
//       description: "Latest electronics and smart gadgets",
//       gradient: "from-blue-500 to-indigo-600",
//       bgGradient: "from-blue-50 to-indigo-50",
//       textColor: "text-blue-600",
//       borderColor: "border-blue-200",
//     },
//     'books': {
//       icon: "📚",
//       color: "indigo",
//       description: "Books, notebooks and office supplies",
//       gradient: "from-indigo-500 to-blue-600",
//       bgGradient: "from-indigo-50 to-blue-50",
//       textColor: "text-indigo-600",
//       borderColor: "border-indigo-200",
//     }
//   };

//   // Get current category data
//   const getCurrentCategoryData = () => {
//     const categoryKey = currentCategory.toLowerCase();
//     return categoryData[categoryKey] || categoryData['groceries'];
//   };

//   // Handle scroll effect
//   useEffect(() => {
//     const handleScroll = () => {
//       setIsScrolled(window.scrollY > 10);
//     };
//     window.addEventListener('scroll', handleScroll);
//     return () => window.removeEventListener('scroll', handleScroll);
//   }, []);

//   // Fetch category data
//   useEffect(() => {
//     const fetchCategoryData = async () => {
//       try {
//         setLoading(true);
//         setError(null);

//         const params = {
//           page: pagination.page,
//           limit: pagination.limit,
//           search: searchQuery,
//           sortBy: sortBy,
//         };

//         // Add filters to params
//         if (selectedFilters.priceRange[0] > 0) params.minPrice = selectedFilters.priceRange[0];
//         if (selectedFilters.priceRange[1] < 1000) params.maxPrice = selectedFilters.priceRange[1];
//         if (selectedFilters.rating > 0) params.rating = selectedFilters.rating;
//         if (selectedFilters.availability !== 'all') params.inStock = selectedFilters.availability === 'inStock';

//         const result = await ApiService.getCategoryProducts(currentCategory, params);
        
//         if (result.success) {
//           if (pagination.page === 1) {
//             setProducts(result.data.products || []);
//           } else {
//             setProducts(prev => [...prev, ...(result.data.products || [])]);
//           }
//           setCategory(result.data.category);
//           setPagination(prev => ({
//             ...prev,
//             total: result.pagination.total || 0,
//             hasMore: result.pagination.hasMore || false
//           }));
//         } else {
//           setError(result.error);
//           toast.error(result.error);
//         }
//       } catch (err) {
//         console.error('Error fetching category data:', err);
//         setError('Failed to load category data');
//         toast.error('Failed to load category data');
//       } finally {
//         setLoading(false);
//         setLoadingMore(false);
//       }
//     };

//     fetchCategoryData();
//   }, [currentCategory, pagination.page, searchQuery, sortBy, selectedFilters]);

//   // Load more products
//   const handleLoadMore = () => {
//     if (!loadingMore && pagination.hasMore) {
//       setLoadingMore(true);
//       setPagination(prev => ({ ...prev, page: prev.page + 1 }));
//     }
//   };

//   // Handle add to cart
//   const handleAddToCart = (product, quantity = 1) => {
//     // Implement cart logic here
//     console.log('Add to cart:', product, quantity);
//     toast.success(`Added ${product.name} to cart`);
//   };

//   // Handle add to wishlist
//   const handleAddToWishlist = (product) => {
//     // Implement wishlist logic here
//     console.log('Add to wishlist:', product);
//     toast.success(`Added ${product.name} to wishlist`);
//   };

//   const currentCategoryData = getCurrentCategoryData();

//   if (loading && pagination.page === 1) {
//     return (
//       <div className="min-h-screen bg-gray-50">
//         <ModernHeader 
//           searchQuery={searchQuery}
//           setSearchQuery={setSearchQuery}
//           cartCount={cartItems.length}
//           showLocationModal={showLocationModal}
//           setShowLocationModal={setShowLocationModal}
//           selectedLocation={selectedLocation}
//           setSelectedLocation={setSelectedLocation}
//           showMobileMenu={showMobileMenu}
//           setShowMobileMenu={setShowMobileMenu}
//           isScrolled={isScrolled}
//         />
        
//         <div className="pt-40 flex items-center justify-center min-h-[60vh]">
//           <div className="text-center">
//             <Loader2 className="w-12 h-12 animate-spin text-blue-500 mx-auto mb-4" />
//             <p className="text-gray-600">Loading category...</p>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <ModernHeader 
//         searchQuery={searchQuery}
//         setSearchQuery={setSearchQuery}
//         cartCount={cartItems.length}
//         showLocationModal={showLocationModal}
//         setShowLocationModal={setShowLocationModal}
//         selectedLocation={selectedLocation}
//         setSelectedLocation={setSelectedLocation}
//         showMobileMenu={showMobileMenu}
//         setShowMobileMenu={setShowMobileMenu}
//         isScrolled={isScrolled}
//       />

//       {/* Main Content */}
//       <main className="pt-40">
//         {/* Category Hero Section */}
//         <section className={`bg-gradient-to-r ${currentCategoryData.gradient} text-white py-12 px-4 mb-8`}>
//           <div className="max-w-7xl mx-auto">
//             <div className="flex items-center gap-4 mb-6">
//               <button 
//                 onClick={() => navigate('/')}
//                 className="p-2 hover:bg-white/10 rounded-lg transition-colors"
//               >
//                 <ArrowLeft className="w-6 h-6" />
//               </button>
//               <div className="text-6xl">{currentCategoryData.icon}</div>
//               <div>
//                 <h1 className="text-3xl md:text-4xl font-bold capitalize mb-2">
//                   {currentCategory} {category?.name && `- ${category.name}`}
//                 </h1>
//                 <p className="text-lg text-white/90 max-w-2xl">
//                   {currentCategoryData.description}
//                 </p>
//               </div>
//             </div>
            
//             {/* Quick Stats */}
//             <div className="flex items-center gap-6 text-sm">
//               <div className="flex items-center gap-2">
//                 <Package className="w-4 h-4" />
//                 <span>{pagination.total || 0} Products</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Clock className="w-4 h-4" />
//                 <span>Fast Delivery</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <Award className="w-4 h-4" />
//                 <span>Quality Assured</span>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* Filters & Sort Bar */}
//         <section className="px-4 mb-6">
//           <div className="max-w-7xl mx-auto">
//             <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-200">
//               <div className="flex items-center justify-between gap-4">
//                 {/* View Mode & Filters */}
//                 <div className="flex items-center gap-4">
//                   <button
//                     onClick={() => setShowFilters(!showFilters)}
//                     className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
//                   >
//                     <Filter className="w-4 h-4" />
//                     <span className="hidden sm:inline">Filters</span>
//                     <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
//                   </button>

//                   <div className="flex items-center gap-2">
//                     <button
//                       onClick={() => setViewMode('grid')}
//                       className={`p-2 rounded-lg transition-colors ${
//                         viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
//                       }`}
//                     >
//                       <Grid3X3 className="w-4 h-4" />
//                     </button>
//                     <button
//                       onClick={() => setViewMode('list')}
//                       className={`p-2 rounded-lg transition-colors ${
//                         viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-100 hover:bg-gray-200'
//                       }`}
//                     >
//                       <List className="w-4 h-4" />
//                     </button>
//                   </div>
//                 </div>

//                 {/* Sort Options */}
//                 <div className="flex items-center gap-4">
//                   <span className="text-sm text-gray-600 hidden sm:inline">Sort by:</span>
//                   <select
//                     value={sortBy}
//                     onChange={(e) => setSortBy(e.target.value)}
//                     className="px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
//                   >
//                     <option value="popularity">Popularity</option>
//                     <option value="price-low-high">Price: Low to High</option>
//                     <option value="price-high-low">Price: High to Low</option>
//                     <option value="rating">Customer Rating</option>
//                     <option value="newest">Newest First</option>
//                     <option value="discount">Discount</option>
//                   </select>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* Products Grid */}
//         <section className="px-4 mb-8">
//           <div className="max-w-7xl mx-auto">
//             {error ? (
//               <div className="text-center py-12">
//                 <div className="text-red-500 mb-4">
//                   <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
//                   <p className="text-lg font-semibold">Failed to load products</p>
//                   <p className="text-sm text-gray-600">{error}</p>
//                 </div>
//                 <button
//                   onClick={() => window.location.reload()}
//                   className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
//                 >
//                   Try Again
//                 </button>
//               </div>
//             ) : products.length === 0 ? (
//               <div className="text-center py-12">
//                 <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
//                 <p className="text-lg font-semibold text-gray-800">No products found</p>
//                 <p className="text-sm text-gray-600 mb-4">Try adjusting your filters or search terms</p>
//                 <button
//                   onClick={() => {
//                     setSearchQuery('');
//                     setSelectedFilters({
//                       priceRange: [0, 1000],
//                       brands: [],
//                       rating: 0,
//                       discount: 0,
//                       availability: "all",
//                     });
//                   }}
//                   className="px-6 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors"
//                 >
//                   Clear Filters
//                 </button>
//               </div>
//             ) : (
//               <>
//                 <div className={`grid gap-4 ${
//                   viewMode === 'grid' 
//                     ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6' 
//                     : 'grid-cols-1'
//                 }`}>
//                   {products.map((product) => (
//                     <ProductCard
//                       key={product.id || product._id}
//                       product={product}
//                       size={viewMode === 'grid' ? 'medium' : 'large'}
//                       onAddToCart={handleAddToCart}
//                       onAddToWishlist={handleAddToWishlist}
//                       isWishlistItem={wishlistItems.some(item => 
//                         (item.id || item._id) === (product.id || product._id)
//                       )}
//                       showAddButton={true}
//                       className={viewMode === 'list' ? 'flex-row' : ''}
//                     />
//                   ))}
//                 </div>

//                 {/* Load More Button */}
//                 {pagination.hasMore && (
//                   <div className="text-center mt-8">
//                     <button
//                       onClick={handleLoadMore}
//                       disabled={loadingMore}
//                       className="px-8 py-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
//                     >
//                       {loadingMore ? (
//                         <>
//                           <Loader2 className="w-4 h-4 animate-spin" />
//                           Loading...
//                         </>
//                       ) : (
//                         <>
//                           <Package className="w-4 h-4" />
//                           Load More Products
//                         </>
//                       )}
//                     </button>
//                   </div>
//                 )}
//               </>
//             )}
//           </div>
//         </section>
//       </main>
//     </div>
//   );
// };

// export default CategoryPage;