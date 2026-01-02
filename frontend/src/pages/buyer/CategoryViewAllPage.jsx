import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  useGetCategoriesQuery,
  useGetFeaturedCategoriesQuery,
  useGetPopularCategoriesQuery,
  useUpdateCategoryStatsMutation,
} from "../storee/api";
import {
  selectCategoryQuery,
  selectViewMode,
  selectCompactMode,
  selectFavorites,
  selectHasActiveFilters,
  setViewMode,
  setCompactMode,
  setFilters,
  resetFilters,
  setSearch,
  setSorting,
  setCurrentPage,
  toggleFavorite,
  toggleNutritionFocus,
  toggleTag,
  setPriceRange,
} from "../storee/Slices/categorySlice";
import {
  Grid3X3,
  List,
  Search,
  Filter,
  Star,
  Heart,
  Eye,
  TrendingUp,
  Clock,
  DollarSign,
  Users,
  ChefHat,
  Leaf,
  Zap,
  Award,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  Sparkles,
  MapPin,
  Timer,
} from "lucide-react";

const CategoryViewAllPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state
  const query = useSelector(selectCategoryQuery);
  const viewMode = useSelector(selectViewMode);
  const compactMode = useSelector(selectCompactMode);
  const favorites = useSelector(selectFavorites);
  const hasActiveFilters = useSelector(selectHasActiveFilters);
  const { filters, currentPage, itemsPerPage } = useSelector(
    (state) => state.category
  );

  // Local state
  const [showFilters, setShowFilters] = useState(false);
  const [animatedItems, setAnimatedItems] = useState(new Set());
  const [searchFocused, setSearchFocused] = useState(false);

  // RTK Query hooks
  const {
    data: categoriesData,
    isLoading,
    isError,
  } = useGetCategoriesQuery(query);
  const { data: featuredCategories } = useGetFeaturedCategoriesQuery(6);
  const { data: popularCategories } = useGetPopularCategoriesQuery(8);
  const [updateCategoryStats] = useUpdateCategoryStatsMutation();

  // Animation effects
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedItems(
        new Set(["header", "featured", "filters", "categories"])
      );
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Nutrition focus options
  const nutritionOptions = [
    {
      id: "high-protein",
      label: "High Protein",
      icon: "💪",
      color: "from-red-400 to-pink-500",
    },
    {
      id: "low-carb",
      label: "Low Carb",
      icon: "🥗",
      color: "from-green-400 to-emerald-500",
    },
    {
      id: "vegan",
      label: "Vegan",
      icon: "🌱",
      color: "from-lime-400 to-green-500",
    },
    {
      id: "gluten-free",
      label: "Gluten Free",
      icon: "🌾",
      color: "from-yellow-400 to-orange-500",
    },
    {
      id: "keto",
      label: "Keto",
      icon: "🥑",
      color: "from-purple-400 to-indigo-500",
    },
    {
      id: "balanced",
      label: "Balanced",
      icon: "⚖️",
      color: "from-blue-400 to-cyan-500",
    },
  ];

  // Sort options
  const sortOptions = [
    { value: "sortOrder-asc", label: "Default Order" },
    { value: "name-asc", label: "Name A-Z" },
    { value: "name-desc", label: "Name Z-A" },
    { value: "mealCount-desc", label: "Most Meals" },
    { value: "popularityScore-desc", label: "Most Popular" },
    { value: "averageRating-desc", label: "Highest Rated" },
    { value: "createdAt-desc", label: "Newest First" },
    { value: "createdAt-asc", label: "Oldest First" },
  ];

  // Handlers
  const handleCategoryClick = async (category) => {
    // Track view
    try {
      await updateCategoryStats({ id: category._id, action: "view" });
    } catch (error) {
      console.log("Failed to update stats:", error);
    }

    navigate(`/categories/${category.slug || category._id}`);
  };

  const handleFavoriteToggle = (e, categoryId) => {
    e.stopPropagation();
    dispatch(toggleFavorite(categoryId));
  };

  const handleSearchChange = (e) => {
    dispatch(setSearch(e.target.value));
  };

  const handleSortChange = (e) => {
    const [sortBy, sortOrder] = e.target.value.split("-");
    dispatch(setSorting({ sortBy, sortOrder }));
  };

  const handleFilterReset = () => {
    dispatch(resetFilters());
  };

  const handlePageChange = (page) => {
    dispatch(setCurrentPage(page));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Render category card
  const renderCategoryCard = (category, featured = false) => {
    const isFavorite = favorites.includes(category._id);

    return (
      <div
        key={category._id}
        onClick={() => handleCategoryClick(category)}
        className={`group relative cursor-pointer transition-all duration-500 hover:scale-105 ${
          compactMode ? "h-32" : featured ? "h-64" : "h-48"
        } ${
          animatedItems.has("categories") ? "animate-fade-in-up" : "opacity-0"
        }`}
        style={{ animationDelay: `${Math.random() * 300}ms` }}
      >
        <div
          className={`h-full rounded-3xl overflow-hidden shadow-xl relative ${
            category.gradient?.from && category.gradient?.to
              ? `bg-gradient-to-br from-[${category.gradient.from}] to-[${category.gradient.to}]`
              : "bg-gradient-to-br from-purple-400 to-pink-500"
          } group-hover:shadow-2xl transition-all duration-500`}
        >
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 w-20 h-20 rounded-full bg-white/20"></div>
            <div className="absolute bottom-4 left-4 w-12 h-12 rounded-full bg-white/10"></div>
            <div className="absolute top-1/2 left-1/2 w-16 h-16 rounded-full bg-white/5"></div>
          </div>

          {/* Content */}
          <div className="relative h-full p-6 flex flex-col justify-between text-white">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {category.icon && (
                  <span className="text-3xl">{category.icon}</span>
                )}
                {featured && (
                  <div className="bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full text-xs font-bold flex items-center">
                    <Star className="w-3 h-3 mr-1" />
                    Featured
                  </div>
                )}
              </div>

              <button
                onClick={(e) => handleFavoriteToggle(e, category._id)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-300"
              >
                <Heart
                  className={`w-5 h-5 ${
                    isFavorite ? "fill-current text-red-300" : ""
                  }`}
                />
              </button>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col justify-center">
              <h3
                className={`font-bold text-white mb-2 ${
                  compactMode ? "text-lg" : featured ? "text-2xl" : "text-xl"
                }`}
              >
                {category.name}
              </h3>

              {!compactMode && category.description && (
                <p className="text-white/80 text-sm line-clamp-2 mb-3">
                  {category.description}
                </p>
              )}

              {/* Nutrition Focus Tags */}
              {!compactMode && category.nutritionFocus?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {category.nutritionFocus.slice(0, 2).map((focus) => {
                    const option = nutritionOptions.find(
                      (opt) => opt.id === focus
                    );
                    return (
                      <span
                        key={focus}
                        className="bg-white/20 text-white px-2 py-1 rounded-full text-xs"
                      >
                        {option?.icon} {option?.label}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Stats Footer */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  <ChefHat className="w-4 h-4 mr-1" />
                  <span>{category.mealCount || 0}</span>
                </div>
                {category.averageRating > 0 && (
                  <div className="flex items-center">
                    <Star className="w-4 h-4 mr-1 fill-current text-yellow-300" />
                    <span>{category.averageRating.toFixed(1)}</span>
                  </div>
                )}
              </div>

              {category.priceRange && (
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  <span>
                    ${category.priceRange.min}-${category.priceRange.max}
                  </span>
                </div>
              )}
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              <div className="text-center">
                <div className="bg-white/90 text-gray-800 px-4 py-2 rounded-full font-medium">
                  Explore {category.name}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-100 via-purple-50 to-pink-100 flex items-center justify-center">
        <div className="text-center p-8 bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-6"></div>
          <p className="text-purple-700 text-lg font-medium">
            Loading categories...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-100 via-purple-50 to-pink-100 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-r from-purple-300/20 to-pink-300/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-gradient-to-r from-blue-300/20 to-cyan-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-3/4 w-32 h-32 bg-gradient-to-r from-yellow-300/20 to-orange-300/20 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Section */}
        <div
          className={`text-center mb-12 ${
            animatedItems.has("header") ? "animate-fade-in-up" : "opacity-0"
          }`}
        >
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
            🍽️ Explore Our Categories
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Discover a world of flavors and cuisines crafted just for you. From
            comfort food to gourmet experiences.
          </p>
        </div>

        {/* Featured Categories */}
        {featuredCategories?.length > 0 && (
          <div
            className={`mb-16 ${
              animatedItems.has("featured") ? "animate-fade-in-up" : "opacity-0"
            }`}
            style={{ animationDelay: "200ms" }}
          >
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-3xl font-bold text-purple-800 flex items-center">
                <Sparkles className="w-8 h-8 mr-3 text-yellow-500" />
                Featured Categories
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCategories.map((category) =>
                renderCategoryCard(category, true)
              )}
            </div>
          </div>
        )}

        {/* Search and Filters Bar */}
        <div
          className={`mb-8 ${
            animatedItems.has("filters") ? "animate-fade-in-up" : "opacity-0"
          }`}
          style={{ animationDelay: "400ms" }}
        >
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl p-6 shadow-xl border border-white/40">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search */}
              <div className="flex-1 relative">
                <div
                  className={`relative transition-all duration-300 ${
                    searchFocused ? "scale-105" : ""
                  }`}
                >
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={filters.search}
                    onChange={handleSearchChange}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    className="w-full pl-12 pr-4 py-3 bg-white/80 border border-purple-200 rounded-2xl focus:ring-4 focus:ring-purple-200 focus:border-purple-400 transition-all duration-300"
                  />
                </div>
              </div>

              {/* View Controls */}
              <div className="flex items-center space-x-3">
                {/* View Mode Toggle */}
                <div className="flex bg-purple-100 rounded-2xl p-1">
                  <button
                    onClick={() => dispatch(setViewMode("grid"))}
                    className={`p-3 rounded-xl transition-all duration-300 ${
                      viewMode === "grid"
                        ? "bg-white shadow-lg text-purple-600"
                        : "text-purple-400 hover:text-purple-600"
                    }`}
                  >
                    <Grid3X3 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => dispatch(setViewMode("list"))}
                    className={`p-3 rounded-xl transition-all duration-300 ${
                      viewMode === "list"
                        ? "bg-white shadow-lg text-purple-600"
                        : "text-purple-400 hover:text-purple-600"
                    }`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>

                {/* Compact Mode Toggle */}
                <button
                  onClick={() => dispatch(setCompactMode(!compactMode))}
                  className={`p-3 rounded-2xl transition-all duration-300 ${
                    compactMode
                      ? "bg-purple-500 text-white shadow-lg"
                      : "bg-purple-100 text-purple-600 hover:bg-purple-200"
                  }`}
                >
                  <SlidersHorizontal className="w-5 h-5" />
                </button>

                {/* Filters Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`p-3 rounded-2xl transition-all duration-300 flex items-center space-x-2 ${
                    showFilters || hasActiveFilters
                      ? "bg-purple-500 text-white shadow-lg"
                      : "bg-purple-100 text-purple-600 hover:bg-purple-200"
                  }`}
                >
                  <Filter className="w-5 h-5" />
                  {hasActiveFilters && (
                    <span className="bg-white text-purple-500 rounded-full w-2 h-2"></span>
                  )}
                </button>

                {/* Sort Dropdown */}
                <select
                  value={`${query.sortBy}-${query.sortOrder}`}
                  onChange={handleSortChange}
                  className="p-3 bg-purple-100 text-purple-600 rounded-2xl border-none focus:ring-4 focus:ring-purple-200 transition-all duration-300"
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-6 pt-6 border-t border-purple-200 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Nutrition Focus */}
                  <div>
                    <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
                      <Leaf className="w-5 h-5 mr-2" />
                      Nutrition Focus
                    </h4>
                    <div className="space-y-2">
                      {nutritionOptions.map((option) => (
                        <label
                          key={option.id}
                          className="flex items-center cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={filters.nutritionFocus.includes(option.id)}
                            onChange={() =>
                              dispatch(toggleNutritionFocus(option.id))
                            }
                            className="sr-only"
                          />
                          <div
                            className={`flex items-center px-3 py-2 rounded-xl transition-all duration-300 ${
                              filters.nutritionFocus.includes(option.id)
                                ? `bg-gradient-to-r ${option.color} text-white shadow-lg`
                                : "bg-white/60 text-gray-700 hover:bg-white/80"
                            }`}
                          >
                            <span className="mr-2">{option.icon}</span>
                            <span className="text-sm font-medium">
                              {option.label}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2" />
                      Price Range
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3">
                        <input
                          type="number"
                          placeholder="Min"
                          value={filters.priceRange.min}
                          onChange={(e) =>
                            dispatch(
                              setPriceRange({
                                ...filters.priceRange,
                                min: parseInt(e.target.value) || 0,
                              })
                            )
                          }
                          className="w-full px-3 py-2 bg-white/80 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-300"
                        />
                        <span className="text-purple-600">-</span>
                        <input
                          type="number"
                          placeholder="Max"
                          value={filters.priceRange.max}
                          onChange={(e) =>
                            dispatch(
                              setPriceRange({
                                ...filters.priceRange,
                                max: parseInt(e.target.value) || 1000,
                              })
                            )
                          }
                          className="w-full px-3 py-2 bg-white/80 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Filters */}
                  <div>
                    <h4 className="font-semibold text-purple-800 mb-3 flex items-center">
                      <Zap className="w-5 h-5 mr-2" />
                      Quick Filters
                    </h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => dispatch(setFilters({ featured: true }))}
                        className={`w-full text-left px-3 py-2 rounded-xl transition-all duration-300 ${
                          filters.featured
                            ? "bg-gradient-to-r from-yellow-400 to-orange-400 text-white shadow-lg"
                            : "bg-white/60 text-gray-700 hover:bg-white/80"
                        }`}
                      >
                        ⭐ Featured Only
                      </button>
                      <button
                        onClick={() => dispatch(setFilters({ parent: null }))}
                        className={`w-full text-left px-3 py-2 rounded-xl transition-all duration-300 ${
                          filters.parent === null
                            ? "bg-gradient-to-r from-blue-400 to-cyan-400 text-white shadow-lg"
                            : "bg-white/60 text-gray-700 hover:bg-white/80"
                        }`}
                      >
                        📁 Main Categories
                      </button>
                    </div>
                  </div>
                </div>

                {/* Reset Filters */}
                {hasActiveFilters && (
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={handleFilterReset}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-300"
                    >
                      <X className="w-4 h-4" />
                      <span>Reset Filters</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Popular Categories Quick Access */}
        {popularCategories?.length > 0 && !filters.search && (
          <div className="mb-12">
            <h3 className="text-2xl font-bold text-purple-800 mb-6 flex items-center">
              <TrendingUp className="w-6 h-6 mr-3 text-green-500" />
              Trending Now
            </h3>
            <div className="flex flex-wrap gap-3">
              {popularCategories.slice(0, 6).map((category) => (
                <button
                  key={category._id}
                  onClick={() => handleCategoryClick(category)}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/70 hover:bg-white/90 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 border border-white/40"
                >
                  {category.icon && <span>{category.icon}</span>}
                  <span className="font-medium text-purple-800">
                    {category.name}
                  </span>
                  <span className="bg-purple-100 text-purple-600 px-2 py-1 rounded-full text-xs">
                    {category.mealCount}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Categories Grid */}
        <div
          className={`${
            animatedItems.has("categories") ? "animate-fade-in-up" : "opacity-0"
          }`}
          style={{ animationDelay: "600ms" }}
        >
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-purple-800">
              All Categories ({categoriesData?.total || 0})
            </h2>

            {/* Results per page */}
            <select
              value={itemsPerPage}
              onChange={(e) =>
                dispatch(setItemsPerPage(parseInt(e.target.value)))
              }
              className="px-4 py-2 bg-white/70 border border-purple-200 rounded-xl focus:ring-2 focus:ring-purple-300"
            >
              <option value={12}>12 per page</option>
              <option value={24}>24 per page</option>
              <option value={48}>48 per page</option>
            </select>
          </div>

          {categoriesData?.data?.length > 0 ? (
            <>
              <div
                className={`grid gap-6 ${
                  viewMode === "grid"
                    ? compactMode
                      ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
                      : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    : "grid-cols-1 md:grid-cols-2"
                }`}
              >
                {categoriesData.data.map((category) =>
                  renderCategoryCard(category)
                )}
              </div>

              {/* Pagination */}
              {categoriesData?.pagination?.totalPages > 1 && (
                <div className="mt-12 flex justify-center">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-4 py-2 bg-white/70 text-purple-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-all duration-300"
                    >
                      Previous
                    </button>

                    {[
                      ...Array(
                        Math.min(5, categoriesData.pagination.totalPages)
                      ),
                    ].map((_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2 rounded-xl transition-all duration-300 ${
                            currentPage === page
                              ? "bg-purple-500 text-white shadow-lg"
                              : "bg-white/70 text-purple-600 hover:bg-white/90"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={
                        currentPage === categoriesData.pagination.totalPages
                      }
                      className="px-4 py-2 bg-white/70 text-purple-600 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-all duration-300"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-bold text-purple-800 mb-2">
                No categories found
              </h3>
              <p className="text-gray-600 mb-6">
                Try adjusting your filters or search terms
              </p>
              {hasActiveFilters && (
                <button
                  onClick={handleFilterReset}
                  className="bg-purple-500 text-white px-6 py-3 rounded-xl hover:bg-purple-600 transition-all duration-300"
                >
                  Reset Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stats Section */}
        {categoriesData?.stats && (
          <div className="mt-16 bg-white/70 backdrop-blur-lg rounded-3xl p-8 shadow-xl border border-white/40">
            <h3 className="text-2xl font-bold text-purple-800 mb-6 text-center">
              Platform Statistics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">
                  {categoriesData.stats.totalCategories || 0}
                </div>
                <div className="text-gray-600">Total Categories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {categoriesData.stats.totalMeals || 0}
                </div>
                <div className="text-gray-600">Total Meals</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {categoriesData.stats.averageRating || 0}
                </div>
                <div className="text-gray-600">Average Rating</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">
                  {categoriesData.stats.activeCategories || 0}
                </div>
                <div className="text-gray-600">Active Categories</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Custom Styles */}
      <style jsx>{`
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out forwards;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }

        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: linear-gradient(45deg, #f3e8ff, #fdf2f8);
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(45deg, #a855f7, #ec4899);
          border-radius: 4px;
        }

        /* Glass morphism enhancement */
        .backdrop-blur-lg {
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
        }

        /* Mobile responsiveness */
        @media (max-width: 768px) {
          .text-4xl {
            font-size: 2rem;
          }

          .text-5xl {
            font-size: 2.5rem;
          }

          .text-6xl {
            font-size: 3rem;
          }
        }

        /* Reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in-up,
          .animate-fade-in {
            animation: none;
          }

          .transition-all {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};

export default CategoryViewAllPage;
