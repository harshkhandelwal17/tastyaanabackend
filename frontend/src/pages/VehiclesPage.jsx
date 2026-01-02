import React, {
  useState,
  useEffect,
  useMemo,
  Suspense,
  useCallback,
  useRef,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

// Lazy load components
const VehicleCard = React.lazy(() =>
  import("../components/vehicle/VehicleCard")
);
const ShopCard = React.lazy(() => import("../components/vehicle/ShopCard"));

// Regular components (lightweight, no need to lazy load)
import VoiceSearchBar from "../components/vehicle/VoiceSearchBar";
import CategoryToggle from "../components/vehicle/CategoryToggle";
import HorizontalCategorySlider from "../components/vehicle/HorizontalCategorySlider";
import FilterDrawer from "../components/vehicle/FilterDrawer";

// Utilities
import { deduplicateById, safeKey } from "../utils/keyUtils";

// Redux
import {
  setViewMode,
  setSelectedCategory,
  setSearchQuery,
  setFilters,
  toggleFilterDrawer,
  setFilterDrawerOpen,
  applyVoiceFilters,
  selectViewMode,
  selectSelectedCategory,
  selectSearchQuery,
  selectFilters,
  selectIsFilterDrawerOpen,
} from "../redux/Slices/rentARideSlice";

// API
import {
  useGetVehiclesQuery,
  useGetVehicleShopsQuery,
  useGetVehicleTypesQuery,
  useGetFilterOptionsQuery,
  formatVehicleForDisplay,
  formatShopForDisplay,
} from "../api/vehiclePublicApi";

const VehiclesPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Local state for pagination and lazy loading
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [allVehicles, setAllVehicles] = useState([]);
  const [allShops, setAllShops] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Ref for intersection observer
  const loadMoreRef = useRef(null);

  // Redux state
  const viewMode = useSelector(selectViewMode);
  const selectedCategory = useSelector(selectSelectedCategory);
  const searchQuery = useSelector(selectSearchQuery);
  const filters = useSelector(selectFilters);
  const isFilterDrawerOpen = useSelector(selectIsFilterDrawerOpen);

  // Reset to 'all' category on mount if not already set
  useEffect(() => {
    if (selectedCategory !== "all") {
      console.log("Component mounted, resetting category to all");
      dispatch(setSelectedCategory("all"));
    }
    // Reset pagination when component mounts
    setPage(1);
    setAllVehicles([]);
    setAllShops([]);
    setHasNextPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
    setAllVehicles([]);
    setHasNextPage(true);
  }, [searchQuery, filters, viewMode, selectedCategory]);

  // Build query parameters
  const queryParams = useMemo(() => {
    const params = {};

    // Add pagination
    params.page = page;
    params.limit = 12; // Load 12 items per page

    // Add search query if present
    if (searchQuery && searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    // Add filters, but skip 'all' values and empty arrays
    if (filters.fuelType && filters.fuelType.length > 0) {
      params.fuelType = filters.fuelType;
    }
    if (filters.zone && filters.zone.length > 0) {
      params.zone = filters.zone;
    }
    if (filters.brand && filters.brand.length > 0) {
      params.brand = filters.brand;
    }
    if (filters.seatingCapacity) {
      params.seatingCapacity = filters.seatingCapacity;
    }

    // Only add availability if it's not 'all'
    if (filters.availability && filters.availability !== "all") {
      params.availability = filters.availability;
    }

    // Add price range if it's meaningful (not default)
    if (
      filters.priceRange &&
      (filters.priceRange.min > 0 || filters.priceRange.max < 10000)
    ) {
      params.minPrice = filters.priceRange.min;
      params.maxPrice = filters.priceRange.max;
    }

    // Add category-specific filters
    if (viewMode === "byShop" && selectedCategory !== "all") {
      params.sellerId = selectedCategory;
    } else if (viewMode === "byVehicleType" && selectedCategory !== "all") {
      params.type = selectedCategory;
    }

    console.log("Query params being sent:", params);
    return params;
  }, [searchQuery, filters, viewMode, selectedCategory, page]);

  // API queries with skip for pagination
  const {
    data: vehiclesData,
    isLoading: vehiclesLoading,
    isFetching: vehiclesFetching,
    error: vehiclesError,
  } = useGetVehiclesQuery(queryParams, {
    skip: !hasNextPage && page > 1, // Skip if no more pages
  });
  const {
    data: shopsData,
    isLoading: shopsLoading,
    error: shopsError,
  } = useGetVehicleShopsQuery();
  const { data: typesData, isLoading: typesLoading } =
    useGetVehicleTypesQuery();
  const { data: filterOptionsData } = useGetFilterOptionsQuery();

  // Handle vehicle data loading and pagination
  useEffect(() => {
    if (vehiclesData?.data) {
      const newVehicles = vehiclesData.data.map(formatVehicleForDisplay);

      if (page === 1) {
        // First page or filter change - replace all data with deduplication
        const uniqueVehicles = deduplicateById(newVehicles, "id");
        setAllVehicles(uniqueVehicles);
      } else {
        // Subsequent pages - append data with deduplication
        setAllVehicles((prev) => {
          const combined = [...prev, ...newVehicles];
          return deduplicateById(combined, "id");
        });
      }

      // Check if there are more pages using API response
      setHasNextPage(
        vehiclesData.pagination?.hasNext ??
          vehiclesData.pagination?.hasNextPage ??
          newVehicles.length === queryParams.limit
      );

      setIsLoadingMore(false);
    }
  }, [vehiclesData, page, queryParams.limit]);

  // Handle shop data loading
  useEffect(() => {
    if (shopsData?.shops) {
      setAllShops(shopsData.shops.map(formatShopForDisplay));
    }
  }, [shopsData]);

  console.log("=== API Response ===");
  console.log("vehiclesData:", vehiclesData);
  console.log("allVehicles length:", allVehicles.length);
  console.log("hasNextPage:", hasNextPage);

  // Intersection Observer for infinite scroll with debouncing
  useEffect(() => {
    let timeoutId;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (
          first.isIntersecting &&
          hasNextPage &&
          !isLoadingMore &&
          !vehiclesFetching
        ) {
          // Debounce the pagination request to prevent multiple rapid calls
          clearTimeout(timeoutId);
          timeoutId = setTimeout(() => {
            setIsLoadingMore(true);
            setPage((prev) => prev + 1);
          }, 300); // 300ms debounce
        }
      },
      {
        threshold: 0.1,
        rootMargin: "100px", // Start loading 100px before element is visible
      }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      clearTimeout(timeoutId);
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, [hasNextPage, isLoadingMore, vehiclesFetching]);

  // Build categories based on view mode
  const categories = useMemo(() => {
    const baseCategories = [
      { id: "all", name: "All", emoji: "🏪", count: null },
    ];

    if (viewMode === "byShop") {
      if (allShops.length > 0) {
        return [
          ...baseCategories,
          ...allShops.map((shop) => ({
            id: shop.id,
            name: shop.shopName,
            icon: shop.shopLogo || shop.profileImage,
            count: shop.vehicleCount,
          })),
        ];
      }
    } else if (viewMode === "byVehicleType") {
      const vehicleTypes = [
        { id: "bike", name: "Bike", emoji: "🏍️" },
        { id: "car", name: "Car", emoji: "🚗" },
        { id: "scooter", name: "Scooty", emoji: "🛵" },
        { id: "ev-bike", name: "EV Bike", emoji: "⚡🏍️" },
        { id: "ev-car", name: "EV Car", emoji: "⚡🚗" },
        { id: "ev-scooter", name: "EV Scooty", emoji: "⚡🛵" },
      ];

      // Add counts from API if available
      if (typesData?.types) {
        return [
          ...baseCategories,
          ...vehicleTypes.map((type) => {
            const apiType = typesData.types.find((t) => t.type === type.id);
            return {
              ...type,
              count: apiType?.count,
            };
          }),
        ];
      }

      return [...baseCategories, ...vehicleTypes];
    }

    return baseCategories;
  }, [viewMode, allShops, typesData]);

  // Handlers
  const handleViewModeToggle = (mode) => {
    dispatch(setViewMode(mode));
  };

  const handleCategorySelect = (categoryId) => {
    dispatch(setSelectedCategory(categoryId));
  };

  const handleSearchChange = (query) => {
    dispatch(setSearchQuery(query));
  };

  const handleVoiceSearch = (transcript, voiceFilters) => {
    dispatch(setSearchQuery(transcript));
    if (voiceFilters && Object.keys(voiceFilters).length > 0) {
      dispatch(applyVoiceFilters(voiceFilters));
    }
  };

  const handleFilterClick = () => {
    dispatch(toggleFilterDrawer());
  };

  const handleApplyFilters = (newFilters) => {
    dispatch(setFilters(newFilters));
  };

  const handleCloseFilterDrawer = () => {
    dispatch(setFilterDrawerOpen(false));
  };

  // Determine what to display in vertical list
  const displayItems = useMemo(() => {
    console.log("View mode:", viewMode);
    console.log("Selected category:", selectedCategory);
    console.log("Total vehicles:", allVehicles.length);

    if (viewMode === "byShop" && selectedCategory !== "all") {
      // Show vehicles from selected shop
      const filtered = allVehicles.filter(
        (v) => v.shop?.id === selectedCategory
      );
      console.log("Filtered by shop:", filtered.length);
      return filtered;
    }
    console.log("Returning all vehicles:", allVehicles.length);
    return allVehicles;
  }, [viewMode, selectedCategory, allVehicles]);

  const isInitialLoading = vehiclesLoading || shopsLoading || typesLoading;

  // Error boundary for lazy loaded components
  const LazyErrorBoundary = ({ children, fallback }) => {
    try {
      return children;
    } catch (error) {
      console.error("Error in lazy component:", error);
      return fallback || <ComponentFallback />;
    }
  };

  // Improved loading skeleton with shimmer effect
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
      {Array.from({ length: 8 }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse"
        >
          <div className="aspect-video bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg mb-3 animate-shimmer bg-[length:200%_100%]"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded mb-2 animate-shimmer bg-[length:200%_100%]"></div>
          <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4 mb-2 animate-shimmer bg-[length:200%_100%]"></div>
          <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/2 animate-shimmer bg-[length:200%_100%]"></div>
        </div>
      ))}
    </div>
  );

  // Lazy load fallback component
  const ComponentFallback = () => (
    <div className="flex items-center justify-center p-4">
      <Loader2 className="w-6 h-6 animate-spin text-green-500" />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4 flex items-center gap-2 sm:gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
          </button>
          <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
            Rent a Ride
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Search Bar */}
        <VoiceSearchBar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          onVoiceSearch={handleVoiceSearch}
          onFilterClick={handleFilterClick}
        />

        {/* Category Toggle */}
        <div className="flex justify-center">
          <CategoryToggle viewMode={viewMode} onToggle={handleViewModeToggle} />
        </div>

        {/* Horizontal Category Slider */}
        <HorizontalCategorySlider
          categories={categories}
          selectedCategory={selectedCategory}
          onCategorySelect={handleCategorySelect}
        />

        {/* Vertical List */}
        <div className="space-y-4">
          {isInitialLoading ? (
            // Initial Loading State
            <LoadingSkeleton />
          ) : vehiclesError || shopsError ? (
            // Error State
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                Failed to load vehicles
              </h3>
              <p className="text-gray-500 mb-4">
                Please check your internet connection and try again
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                Retry
              </button>
            </motion.div>
          ) : displayItems.length === 0 && !hasNextPage ? (
            // Empty State
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-12"
            >
              <div className="text-6xl mb-4">🚗</div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                No vehicles found
              </h3>
              <p className="text-gray-500">
                Try adjusting your filters or search query
              </p>
            </motion.div>
          ) : (
            <>
              {(() => {
                console.log(
                  "About to render. View mode:",
                  viewMode,
                  "Selected category:",
                  selectedCategory
                );
                console.log("Display items count:", displayItems.length);

                if (viewMode === "byShop" && selectedCategory === "all") {
                  console.log("Rendering shops, count:", allShops.length);
                  return (
                    // Show shops when in shop mode and "All" is selected
                    <div className="space-y-3">
                      {allShops.map((shop, index) => (
                        <motion.div
                          key={safeKey(shop, index, "shop")}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <LazyErrorBoundary>
                            <Suspense fallback={<ComponentFallback />}>
                              <ShopCard shop={shop} />
                            </Suspense>
                          </LazyErrorBoundary>
                        </motion.div>
                      ))}
                    </div>
                  );
                }

                console.log("Rendering vehicles, count:", displayItems.length);
                return (
                  // Show vehicles with lazy loading and virtualization
                  <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 lg:gap-6">
                    {displayItems.map((vehicle, index) => (
                      <motion.div
                        key={safeKey(vehicle, index, "vehicle")}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.01 }} // Faster animation for many items
                        className="will-change-transform" // Optimize for animations
                      >
                        <LazyErrorBoundary>
                          <Suspense fallback={<ComponentFallback />}>
                            <VehicleCard vehicle={vehicle} />
                          </Suspense>
                        </LazyErrorBoundary>
                      </motion.div>
                    ))}
                  </div>
                );
              })()}

              {/* Infinite scroll trigger and load more indicator */}
              {hasNextPage && (
                <div
                  ref={loadMoreRef}
                  className="flex justify-center items-center py-8"
                >
                  {(isLoadingMore || vehiclesFetching) && (
                    <div className="flex items-center gap-2 text-green-600">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Loading more vehicles...</span>
                    </div>
                  )}
                </div>
              )}

              {/* End of results indicator */}
              {!hasNextPage && displayItems.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-gray-600 text-sm font-medium">
                      All vehicles loaded ({displayItems.length})
                    </p>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Filter Drawer */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={handleCloseFilterDrawer}
        filters={filters}
        onApplyFilters={handleApplyFilters}
        availableFilters={filterOptionsData || {}}
      />
    </div>
  );
};

export default VehiclesPage;
