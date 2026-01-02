import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  FiSearch,
  FiMic,
  FiFilter,
  FiGrid,
  FiList,
  FiMapPin,
  FiStar,
  FiClock,
  FiPhone,
  FiMail,
} from "react-icons/fi";
import {
  useGetVehiclesQuery,
  useGetVehicleShopsQuery,
  useGetVehicleTypesQuery,
  useGetFilterOptionsQuery,
  formatVehicleForDisplay,
  formatShopForDisplay,
  processVoiceCommand,
} from "../../api/vehiclePublicApi";
import VehicleCard from "../../components/vehicleRental/VehicleCard";
import ShopCard from "../../components/vehicleRental/ShopCard";
import FilterBottomSheet from "../../components/vehicleRental/FilterBottomSheet";
import VoiceSearchModal from "../../components/vehicleRental/VoiceSearchModalNew";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const VehiclesPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State management
  const [viewMode, setViewMode] = useState("shop"); // 'shop' or 'type'
  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [layoutView, setLayoutView] = useState("grid"); // 'grid' or 'list'

  // Get initial filters from URL params
  const getFiltersFromParams = () => {
    const filters = {};
    for (const [key, value] of searchParams.entries()) {
      filters[key] = value;
    }
    return filters;
  };

  const [activeFilters, setActiveFilters] = useState(getFiltersFromParams());

  // API calls
  const { data: filterOptions } = useGetFilterOptionsQuery();
  const { data: shopsData, isLoading: shopsLoading } =
    useGetVehicleShopsQuery(activeFilters);
  const { data: typesData, isLoading: typesLoading } =
    useGetVehicleTypesQuery(activeFilters);

  const vehicleFilters = {
    ...activeFilters,
    ...(selectedShop && { sellerId: selectedShop }),
    ...(selectedType && { type: selectedType }),
    ...(searchQuery && { search: searchQuery }),
    page: currentPage,
    limit: 12,
  };

  const {
    data: vehiclesData,
    isLoading: vehiclesLoading,
    refetch: refetchVehicles,
  } = useGetVehiclesQuery(vehicleFilters);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    setSearchParams(params);
  }, [activeFilters, setSearchParams]);

  // Voice search handler
  const handleVoiceResult = (transcript) => {
    const voiceFilters = processVoiceCommand(transcript);
    setActiveFilters((prev) => ({ ...prev, ...voiceFilters }));
    setSearchQuery(transcript);
    setShowVoiceSearch(false);
  };

  // Search handler
  const handleSearch = (e) => {
    e.preventDefault();
    setActiveFilters((prev) => ({ ...prev, search: searchQuery }));
    setCurrentPage(1);
  };

  // Filter handler
  const handleFiltersApply = (newFilters) => {
    setActiveFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
    setShowFilters(false);
  };

  // Clear filters
  const clearFilters = () => {
    setActiveFilters({});
    setSearchQuery("");
    setSelectedShop(null);
    setSelectedType(null);
    setCurrentPage(1);
  };

  // Navigation handlers
  const handleVehicleClick = (vehicleId) => {
    navigate(`/vehicle/${vehicleId}`);
  };

  const handleShopClick = (shopId) => {
    navigate(`/shop/${shopId}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (shopsLoading && typesLoading && vehiclesLoading) {
    return <LoadingSpinner />;
  }

  const shops = shopsData?.data || [];
  const types = typesData?.data || [];
  const vehicles = vehiclesData?.data || [];
  const pagination = vehiclesData?.pagination;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Find Your Ride</h1>
            <div className="flex items-center space-x-2">
              <button
                onClick={() =>
                  setLayoutView(layoutView === "grid" ? "list" : "grid")
                }
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              >
                {layoutView === "grid" ? (
                  <FiList size={20} />
                ) : (
                  <FiGrid size={20} />
                )}
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mb-4">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search vehicles, brands, or locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-2">
                <button
                  type="button"
                  onClick={() => setShowVoiceSearch(true)}
                  className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                >
                  <FiMic size={18} />
                </button>
                <button
                  type="submit"
                  className="px-4 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                >
                  Search
                </button>
              </div>
            </div>
          </form>

          {/* Category Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => {
                    setViewMode("shop");
                    setSelectedType(null);
                  }}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === "shop"
                      ? "bg-white text-green-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  By Shop
                </button>
                <button
                  onClick={() => {
                    setViewMode("type");
                    setSelectedShop(null);
                  }}
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === "type"
                      ? "bg-white text-green-600 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  By Vehicle Type
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowFilters(true)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiFilter size={18} />
              <span>Filters</span>
              {Object.keys(activeFilters).length > 0 && (
                <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {Object.keys(activeFilters).length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Horizontal Slider on Mobile, Fixed Sidebar on Desktop */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-4 sticky top-24">
              <h3 className="font-semibold text-gray-900 mb-4">
                {viewMode === "shop" ? "Shops" : "Vehicle Types"}
              </h3>

              <div className="space-y-2">
                {viewMode === "shop" ? (
                  <>
                    <button
                      onClick={() => setSelectedShop(null)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        !selectedShop
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      All Shops ({shops.length})
                    </button>
                    {shops.map((shop) => (
                      <button
                        key={shop._id}
                        onClick={() => setSelectedShop(shop._id)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedShop === shop._id
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          {shop.shopLogo ? (
                            <img
                              src={shop.shopLogo}
                              alt={shop.shopName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                              <span className="text-green-600 font-medium text-xs">
                                {shop.shopName?.charAt(0) || "S"}
                              </span>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {shop.shopName}
                            </p>
                            <p className="text-xs text-gray-500">
                              {shop.vehicleCount} vehicles
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setSelectedType(null)}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                        !selectedType
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      All Types
                    </button>
                    {types.map((type) => (
                      <button
                        key={type.type}
                        onClick={() => setSelectedType(type.type)}
                        className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                          selectedType === type.type
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{type.icon}</span>
                          <div>
                            <p className="font-medium capitalize">
                              {type.type.replace("-", " ")}
                            </p>
                            <p className="text-xs text-gray-500">
                              {type.count} vehicles
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {/* Active Filters */}
            {Object.keys(activeFilters).length > 0 && (
              <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">Active Filters</h4>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    Clear All
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(activeFilters).map(([key, value]) => (
                    <span
                      key={key}
                      className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                    >
                      {key}: {value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Results Count and Sorting */}
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">
                {pagination ? (
                  <>
                    Showing {(pagination.currentPage - 1) * 12 + 1}-
                    {Math.min(
                      pagination.currentPage * 12,
                      pagination.totalItems
                    )}{" "}
                    of {pagination.totalItems} vehicles
                  </>
                ) : (
                  "Loading..."
                )}
              </p>
            </div>

            {/* Vehicle Grid/List */}
            {vehiclesLoading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner />
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🚗</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No vehicles found
                </h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your search criteria or filters
                </p>
                <button
                  onClick={clearFilters}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div
                  className={
                    layoutView === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                      : "space-y-4"
                  }
                >
                  {vehicles.map((vehicle, index) => {
                    const formattedVehicle = formatVehicleForDisplay(vehicle);
                    return (
                      <VehicleCard
                        key={`${vehicle._id}-${index}`}
                        vehicle={formattedVehicle}
                        onClick={() => handleVehicleClick(vehicle._id)}
                        onShopClick={() =>
                          handleShopClick(vehicle.sellerId?._id)
                        }
                        layout={layoutView}
                      />
                    );
                  })}
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex justify-center mt-8">
                    <div className="flex space-x-2">
                      <button
                        onClick={() =>
                          setCurrentPage((prev) => Math.max(prev - 1, 1))
                        }
                        disabled={!pagination.hasPrev}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>

                      <span className="px-4 py-2 text-sm text-gray-600">
                        Page {pagination.currentPage} of {pagination.totalPages}
                      </span>

                      <button
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                        disabled={!pagination.hasNext}
                        className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Filter Bottom Sheet */}
      {showFilters && (
        <FilterBottomSheet
          filterOptions={filterOptions?.data}
          activeFilters={activeFilters}
          onApply={handleFiltersApply}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Voice Search Modal */}
      {showVoiceSearch && (
        <VoiceSearchModal
          onResult={handleVoiceResult}
          onClose={() => setShowVoiceSearch(false)}
        />
      )}
    </div>
  );
};

export default VehiclesPage;
