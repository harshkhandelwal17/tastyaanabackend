// src/pages/MealPlansPage.js
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Filter,
  Grid,
  List,
  Star,
  Clock,
  Users,
  ChefHat,
  Heart,
  ShoppingCart,
  Search,
  SlidersHorizontal,
  Zap,
  Award,
  CheckCircle,
  ArrowUpDown,
  X,
  Menu,
} from "lucide-react";

// Redux API hooks
import {
  useGetMealPlanssQuery,
  useCreateSubscriptionMutation,
} from "../../redux/storee/api";

// Components
import LoadingSpinner from "../../components/common/LoadingSpinner";
import Button from "../../components/common/Button";
import { toast } from "react-hot-toast";

export default function MealPlansPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Redux state
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  // Local state
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState({});
  const [sortBy, setSortBy] = useState("isPopular");
  const [sortOrder, setSortOrder] = useState("desc");

  // Get filters from URL params
  const tier = searchParams.get("tier") || "";
  const minPrice = searchParams.get("minPrice") || "";
  const maxPrice = searchParams.get("maxPrice") || "";
  const search = searchParams.get("search") || "";

  // API call with filters
  const {
    data: mealPlansData,
    isLoading,
    error,
    refetch,
  } = useGetMealPlanssQuery({
    tier: tier || undefined,
    search: search || undefined,
    sortBy,
    sortOrder,
    limit: 20,
    page: 1,
  });

  const [createSubscription, { isLoading: subscriptionLoading }] =
    useCreateSubscriptionMutation();

  // Filter options
  const tierOptions = [
    { value: "", label: "All Plans" },
    { value: "low", label: "Low Cost (Budget)" },
    { value: "basic", label: "Basic (Popular)" },
    { value: "premium", label: "Premium (Deluxe)" },
  ];

  const sortOptions = [
    { value: "isPopular", label: "Most Popular" },
    { value: "pricing.oneDay", label: "Price: Low to High" },
    { value: "ratings.average", label: "Highest Rated" },
    { value: "createdAt", label: "Newest First" },
  ];

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (tier) params.set("tier", tier);
    if (search) params.set("search", search);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);

    setSearchParams(params);
  }, [tier, search, minPrice, maxPrice, setSearchParams]);

  // Handle search
  const handleSearch = (query) => {
    const params = new URLSearchParams(searchParams);
    if (query && query.trim()) {
      params.set("search", query.trim());
    } else {
      params.delete("search");
    }
    setSearchParams(params);
  };

  // Handle filter changes
  const handleFilterChange = (filterKey, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(filterKey, value);
    } else {
      params.delete(filterKey);
    }
    setSearchParams(params);
  };

  // Handle sort change
  const handleSortChange = (newSortBy) => {
    if (newSortBy === sortBy) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("desc");
    }
  };

  // Handle subscription creation
  const handleSubscribe = async (plan, duration = 30) => {
    if (!isAuthenticated) {
      toast.info("Please login to Subscribe");
      navigate("/login");
      return;
    }

    try {
      navigate(`/thali-detail/${plan._id}`);
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  // Get tier color and styling
  const getTierStyling = (tier) => {
    switch (tier) {
      case "low":
        return {
          badge: "bg-green-100 text-green-800 border-green-200",
          card: "border-green-200 hover:border-green-300",
          button: "bg-green-600 hover:bg-green-700",
        };
      case "basic":
        return {
          badge: "bg-blue-100 text-blue-800 border-blue-200",
          card: "border-blue-200 hover:border-blue-300",
          button: "bg-blue-600 hover:bg-blue-700",
        };
      case "premium":
        return {
          badge: "bg-purple-100 text-purple-800 border-purple-200",
          card: "border-purple-200 hover:border-purple-300",
          button: "bg-purple-600 hover:bg-purple-700",
        };
      default:
        return {
          badge: "bg-gray-100 text-gray-800 border-gray-200",
          card: "border-gray-200 hover:border-gray-300",
          button: "bg-orange-600 hover:bg-orange-700",
        };
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 font-['Plus_Jakarta_Sans']">
      {/* Mobile Filter Overlay */}
      {showFilters && (
        <div
          className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setShowFilters(false)}
        >
          <div
            className="fixed inset-y-0 left-0 w-full max-w-sm bg-white shadow-2xl overflow-y-auto z-[101]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              {/* Mobile Filter Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">Filters</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Filter Content */}
              <div className="space-y-6">
                {/* Plan Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Plan Type
                  </label>
                  <div className="space-y-3">
                    {tierOptions.map((option) => (
                      <label key={option.value} className="flex items-center">
                        <input
                          type="radio"
                          name="tier"
                          value={option.value}
                          checked={tier === option.value}
                          onChange={(e) =>
                            handleFilterChange("tier", e.target.value)
                          }
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Daily Price Range
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Min ₹"
                      value={minPrice}
                      onChange={(e) =>
                        handleFilterChange("minPrice", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      placeholder="Max ₹"
                      value={maxPrice}
                      onChange={(e) =>
                        handleFilterChange("maxPrice", e.target.value)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Features */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Dietary Preferences
                  </label>
                  <div className="space-y-3">
                    {[
                      { key: "vegetarian", label: "Vegetarian" },
                      { key: "vegan", label: "Vegan" },
                      { key: "highProtein", label: "High Protein" },
                      { key: "lowCalorie", label: "Low Calorie" },
                      { key: "glutenFree", label: "Gluten Free" },
                      { key: "keto", label: "Keto Friendly" },
                    ].map((feature) => (
                      <label key={feature.key} className="flex items-center">
                        <input
                          type="checkbox"
                          value={feature.key}
                          onChange={(e) => {
                            // Handle dietary preference filter
                            const params = new URLSearchParams(searchParams);
                            if (e.target.checked) {
                              params.append("dietary", feature.key);
                            } else {
                              const values = params
                                .getAll("dietary")
                                .filter((v) => v !== feature.key);
                              params.delete("dietary");
                              values.forEach((v) =>
                                params.append("dietary", v)
                              );
                            }
                            setSearchParams(params);
                          }}
                          className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        />
                        <span className="ml-3 text-sm text-gray-700">
                          {feature.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Clear Filters Button */}
                <button
                  onClick={handleClearFilters}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Meal Plans
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Choose from our carefully crafted meal plans designed for every
            budget and lifestyle
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-4 lg:gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            {/* Mobile filter toggle */}
            <div className="lg:hidden mb-6">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-between w-full p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <Filter className="h-5 w-5 text-orange-600" />
                  <span className="font-medium text-gray-900">Filters</span>
                  {(tier || minPrice || maxPrice) && (
                    <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded-full text-xs font-medium">
                      Active
                    </span>
                  )}
                </div>
                <SlidersHorizontal className="h-5 w-5 text-gray-400" />
              </button>
            </div>

            {/* Desktop Filter panel */}
            <div className="hidden lg:block bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                {(tier || minPrice || maxPrice) && (
                  <button
                    onClick={handleClearFilters}
                    className="text-sm text-orange-600 hover:text-orange-700"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Plan Type Filter */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Plan Type
                </label>
                <div className="space-y-3">
                  {tierOptions.map((option) => (
                    <label key={option.value} className="flex items-center">
                      <input
                        type="radio"
                        name="tier"
                        value={option.value}
                        checked={tier === option.value}
                        onChange={(e) =>
                          handleFilterChange("tier", e.target.value)
                        }
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Daily Price Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="number"
                    placeholder="Min ₹"
                    value={minPrice}
                    onChange={(e) =>
                      handleFilterChange("minPrice", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    placeholder="Max ₹"
                    value={maxPrice}
                    onChange={(e) =>
                      handleFilterChange("maxPrice", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Dietary Preferences
                </label>
                <div className="space-y-3">
                  {[
                    { key: "vegetarian", label: "Vegetarian" },
                    { key: "vegan", label: "Vegan" },
                    { key: "highProtein", label: "High Protein" },
                    { key: "lowCalorie", label: "Low Calorie" },
                    { key: "glutenFree", label: "Gluten Free" },
                    { key: "keto", label: "Keto Friendly" },
                  ].map((feature) => (
                    <label key={feature.key} className="flex items-center">
                      <input
                        type="checkbox"
                        value={feature.key}
                        onChange={(e) => {
                          // Handle dietary preference filter
                          const params = new URLSearchParams(searchParams);
                          if (e.target.checked) {
                            params.append("dietary", feature.key);
                          } else {
                            const values = params
                              .getAll("dietary")
                              .filter((v) => v !== feature.key);
                            params.delete("dietary");
                            values.forEach((v) => params.append("dietary", v));
                          }
                          setSearchParams(params);
                        }}
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                      />
                      <span className="ml-3 text-sm text-gray-700">
                        {feature.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 p-4 sm:p-6 mb-6 shadow-xl">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search meal plans by name, cuisine, or ingredients..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                />
              </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl border border-white/20 p-4 sm:p-6 mb-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                {/* Results count and sort */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <span className="text-sm sm:text-base text-gray-600 font-medium">
                    {isLoading
                      ? "Loading..."
                      : `${
                          mealPlansData?.data?.pagination?.total || 0
                        } plans found`}
                  </span>

                  <select
                    value={`${sortBy}-${sortOrder}`}
                    onChange={(e) => {
                      const [newSortBy, newSortOrder] =
                        e.target.value.split("-");
                      setSortBy(newSortBy);
                      setSortOrder(newSortOrder);
                    }}
                    className="text-sm sm:text-base border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
                  >
                    <option value="isPopular-desc">Most Popular</option>
                    <option value="pricing.oneDay-asc">
                      Price: Low to High
                    </option>
                    <option value="pricing.oneDay-desc">
                      Price: High to Low
                    </option>
                    <option value="ratings.average-desc">Highest Rated</option>
                    <option value="createdAt-desc">Newest First</option>
                  </select>
                </div>

                {/* View mode toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === "grid"
                        ? "bg-white shadow-sm"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-md transition-all ${
                      viewMode === "list"
                        ? "bg-white shadow-sm"
                        : "hover:bg-gray-200"
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="large" text="Loading meal plans..." />
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                <p className="text-red-600 mb-4">
                  Failed to load meal plans. Please try again later.
                </p>
                <button
                  onClick={() => refetch()}
                  className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            )}

            {/* Meal Plans Grid/List */}
            {!isLoading && !error && mealPlansData?.data?.mealPlans && (
              <div
                className={
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"
                    : "space-y-4 sm:space-y-6"
                }
              >
                {mealPlansData.data.mealPlans.map((plan) => {
                  const styling = getTierStyling(plan.tier);
                  const currentDuration = selectedDuration[plan._id] || 1;

                  return (
                    <div
                      key={plan._id}
                      className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border-2 transition-all hover:shadow-xl ${
                        styling.card
                      } ${
                        viewMode === "list" ? "flex flex-col sm:flex-row" : ""
                      }`}
                    >
                      {/* Image */}
                      <div
                        className={`relative ${
                          viewMode === "list"
                            ? "w-full sm:w-48 flex-shrink-0"
                            : "h-48 sm:h-56"
                        } overflow-hidden ${
                          viewMode === "grid"
                            ? "rounded-t-2xl"
                            : "rounded-t-2xl sm:rounded-l-2xl sm:rounded-t-none"
                        }`}
                      >
                        <img
                          src={
                            plan.imageUrls?.[0] || "/api/placeholder/400/300"
                          }
                          alt={plan.title}
                          className="w-full h-full object-cover"
                        />

                        {/* Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium border ${styling.badge}`}
                          >
                            {plan.tier.charAt(0).toUpperCase() +
                              plan.tier.slice(1)}
                          </span>
                          {plan.isPopular && (
                            <span className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center">
                              <Zap className="h-3 w-3 mr-1" />
                              Popular
                            </span>
                          )}
                        </div>

                        {/* Rating */}
                        {(plan?.ratings?.average > 0 ||
                          plan?.recentReviews?.average > 0) && (
                          <div className="absolute top-3 right-3 bg-white bg-opacity-90 backdrop-blur-sm rounded-full px-2 py-1 flex items-center">
                            <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                            <span className="text-sm font-medium">
                              {(
                                plan?.ratings?.average ||
                                plan?.recentReviews?.average ||
                                0
                              ).toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 sm:p-6 flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                            {plan?.title}
                          </h3>
                        </div>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                          {plan?.description}
                        </p>

                        {/* Features */}
                        {(plan?.features?.length > 0 ||
                          plan?.tags?.length > 0 ||
                          plan?.specialFeatures?.length > 0) && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {(() => {
                              // Combine features from different possible sources
                              const allFeatures = [
                                ...(plan?.features || []),
                                ...(plan?.tags || []),
                                ...(plan?.specialFeatures || []),
                              ].filter(Boolean);

                              return allFeatures
                                .slice(0, 3)
                                .map((feature, idx) => (
                                  <span
                                    key={idx}
                                    className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
                                  >
                                    {typeof feature === "string"
                                      ? feature
                                      : feature.name || feature.text || feature}
                                  </span>
                                ));
                            })()}
                            {(() => {
                              const totalFeatures =
                                (plan?.features?.length || 0) +
                                (plan?.tags?.length || 0) +
                                (plan?.specialFeatures?.length || 0);
                              return (
                                totalFeatures > 3 && (
                                  <span className="text-gray-500 text-xs">
                                    +{totalFeatures - 3} more
                                  </span>
                                )
                              );
                            })()}
                          </div>
                        )}

                        {/* Nutritional Info */}
                        {plan?.nutritionalInfo && (
                          <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 rounded-lg text-center">
                            <div>
                              <p className="text-xs text-gray-500">Calories</p>
                              <p className="font-semibold text-gray-900">
                                {plan?.nutritionalInfo?.calories || "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Protein</p>
                              <p className="font-semibold text-gray-900">
                                {plan?.nutritionalInfo?.protein
                                  ? `${plan.nutritionalInfo.protein}g`
                                  : "N/A"}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Prep Time</p>
                              <p className="font-semibold text-gray-900 flex items-center justify-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {plan?.preparationTime ||
                                  plan?.timingConfig?.preparationTime ||
                                  "30m"}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Pricing */}
                        <div className="mb-4">
                          {/* Duration selector */}
                          <div className="grid grid-cols-3 gap-1 mb-3 p-1 bg-gray-100 rounded-lg">
                            {plan?.pricing && Array.isArray(plan.pricing)
                              ? // If pricing is an array (new structure)
                                plan.pricing
                                  .slice(0, 3)
                                  .map((pricingOption, index) => (
                                    <button
                                      key={pricingOption.days || index}
                                      onClick={() =>
                                        setSelectedDuration((prev) => ({
                                          ...prev,
                                          [plan._id]: pricingOption.days,
                                        }))
                                      }
                                      className={`p-2 rounded-md text-xs font-medium transition-colors ${
                                        currentDuration === pricingOption.days
                                          ? "bg-white shadow-sm text-gray-900"
                                          : "text-gray-600 hover:text-gray-900"
                                      }`}
                                    >
                                      <div>
                                        {pricingOption.days} Day
                                        {pricingOption.days > 1 ? "s" : ""}
                                      </div>
                                      <div className="font-bold">
                                        ₹{pricingOption.price}
                                      </div>
                                      {pricingOption.savings && (
                                        <div className="text-green-600">
                                          {pricingOption.savings}% off
                                        </div>
                                      )}
                                    </button>
                                  ))
                              : // Fallback to old structure
                                [
                                  {
                                    days: 1,
                                    label: "1 Day",
                                    price:
                                      plan.pricing?.oneDay ||
                                      plan.pricing?.price ||
                                      0,
                                  },
                                  {
                                    days: 10,
                                    label: "10 Days",
                                    price: plan.pricing?.tenDays || 0,
                                  },
                                  {
                                    days: 30,
                                    label: "30 Days",
                                    price: plan.pricing?.thirtyDays || 0,
                                  },
                                ]
                                  .filter((option) => option.price > 0)
                                  .map(({ days, label, price }) => (
                                    <button
                                      key={days}
                                      onClick={() =>
                                        setSelectedDuration((prev) => ({
                                          ...prev,
                                          [plan._id]: days,
                                        }))
                                      }
                                      className={`p-2 rounded-md text-xs font-medium transition-colors ${
                                        currentDuration === days
                                          ? "bg-white shadow-sm text-gray-900"
                                          : "text-gray-600 hover:text-gray-900"
                                      }`}
                                    >
                                      <div>{label}</div>
                                      <div className="font-bold">₹{price}</div>
                                      {days > 1 &&
                                        plan.pricing?.discountPercentage?.[
                                          days === 10 ? "tenDays" : "thirtyDays"
                                        ] && (
                                          <div className="text-green-600">
                                            {
                                              plan.pricing.discountPercentage[
                                                days === 10
                                                  ? "tenDays"
                                                  : "thirtyDays"
                                              ]
                                            }
                                            % off
                                          </div>
                                        )}
                                    </button>
                                  ))}
                          </div>

                          {/* Current price display */}
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-xl sm:text-2xl font-bold text-gray-900">
                                ₹
                                {(() => {
                                  if (Array.isArray(plan.pricing)) {
                                    const selectedPricing = plan.pricing.find(
                                      (p) => p.days === currentDuration
                                    );
                                    return selectedPricing?.price || 0;
                                  } else {
                                    // Old structure fallback
                                    return currentDuration === 1
                                      ? plan.pricing?.oneDay ||
                                          plan.pricing?.price ||
                                          0
                                      : currentDuration === 10
                                      ? plan.pricing?.tenDays || 0
                                      : plan.pricing?.thirtyDays || 0;
                                  }
                                })()}
                              </span>
                              <span className="text-gray-500 ml-1 text-sm">
                                {currentDuration === 1
                                  ? "/day"
                                  : `/${currentDuration} days`}
                              </span>
                            </div>

                            {currentDuration > 1 && (
                              <div className="text-right">
                                <div className="text-sm text-gray-500">
                                  ₹
                                  {(() => {
                                    let totalPrice;
                                    if (Array.isArray(plan.pricing)) {
                                      const selectedPricing = plan.pricing.find(
                                        (p) => p.days === currentDuration
                                      );
                                      totalPrice = selectedPricing?.price || 0;
                                    } else {
                                      totalPrice =
                                        currentDuration === 10
                                          ? plan.pricing?.tenDays || 0
                                          : plan.pricing?.thirtyDays || 0;
                                    }
                                    return Math.round(
                                      totalPrice / currentDuration
                                    );
                                  })()}
                                  /day
                                </div>
                                {(() => {
                                  let discount;
                                  if (Array.isArray(plan.pricing)) {
                                    const selectedPricing = plan.pricing.find(
                                      (p) => p.days === currentDuration
                                    );
                                    discount = selectedPricing?.savings;
                                  } else {
                                    discount =
                                      plan.pricing?.discountPercentage?.[
                                        currentDuration === 10
                                          ? "tenDays"
                                          : "thirtyDays"
                                      ];
                                  }
                                  return discount ? (
                                    <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                                      Save {discount}%
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Link
                            to={`/thali-detail/${plan._id}`}
                            className="flex-1"
                          >
                            <Button
                              variant="outline"
                              className="w-full text-sm"
                            >
                              View Details
                            </Button>
                          </Link>

                          <Button
                            onClick={() =>
                              handleSubscribe(plan, currentDuration)
                            }
                            loading={subscriptionLoading}
                            className={`text-sm ${styling.button}`}
                          >
                            Subscribe
                          </Button>
                        </div>

                        {/* Quick info */}
                        <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {plan?.maxDailyOrders &&
                            plan?.currentOrders !== undefined
                              ? `${
                                  plan.maxDailyOrders - plan.currentOrders
                                } slots left`
                              : plan?.availability?.slotsAvailable !== undefined
                              ? `${plan.availability.slotsAvailable} slots left`
                              : "Available"}
                          </div>
                          <div className="flex items-center">
                            <ChefHat className="h-3 w-3 mr-1" />
                            {plan?.freshness ||
                              plan?.deliveryInfo?.freshness ||
                              "Fresh daily"}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty State */}
            {!isLoading &&
              !error &&
              mealPlansData?.data?.mealPlans?.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <ChefHat className="h-12 w-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No meal plans found
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Try adjusting your filters or search terms to find more meal
                    plans.
                  </p>
                  <Button onClick={handleClearFilters} variant="outline">
                    Clear Filters
                  </Button>
                </div>
              )}

            {/* Pagination */}
            {mealPlansData?.data?.pagination?.totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Page {mealPlansData.data.pagination.currentPage} of{" "}
                    {mealPlansData.data.pagination.totalPages}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
