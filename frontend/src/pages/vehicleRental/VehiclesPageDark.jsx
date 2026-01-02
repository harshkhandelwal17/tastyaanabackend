import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { FiSearch, FiMic, FiArrowLeft, FiChevronRight } from "react-icons/fi";
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
import DarkFilterBottomSheet from "../../components/vehicleRental/DarkFilterBottomSheet";
import VoiceSearchModal from "../../components/vehicleRental/VoiceSearchModal";
import LoadingSpinner from "../../components/common/LoadingSpinner";

const VehiclesPageDark = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State management
  const [viewMode, setViewMode] = useState("vehicle"); // 'shop' or 'vehicle'
  const [selectedShop, setSelectedShop] = useState(null);
  const [selectedType, setSelectedType] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showVoiceSearch, setShowVoiceSearch] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // Get initial filters from URL params
  const getFiltersFromParams = () => {
    const filters = {};
    for (const [key, value] of searchParams.entries()) {
      filters[key] = value;
    }
    return filters;
  };

  const [activeFilters, setActiveFilters] = useState(getFiltersFromParams());
  const [filters, setFilters] = useState({
    vehicleTypes: [],
    priceRange: null,
    location: "",
    duration: null,
    availableOnly: false,
    rating: null,
  });

  // API calls
  const { data: vehicleTypes, isLoading: typesLoading } =
    useGetVehicleTypesQuery();

  const { data: shops, isLoading: shopsLoading } = useGetVehicleShopsQuery();

  const { data: filterOptions, isLoading: filterOptionsLoading } =
    useGetFilterOptionsQuery();

  // Build query for vehicles
  const vehicleFilters = {
    ...activeFilters,
    page: currentPage,
    limit: 10,
    shopId: selectedShop,
    type: selectedType !== "all" ? selectedType : null,
  };

  const {
    data: vehiclesResponse,
    isLoading: vehiclesLoading,
    error: vehiclesError,
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

  // Modern filter handler
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setActiveFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  // Clear filters
  const clearFilters = () => {
    setActiveFilters({});
    setSearchQuery("");
    setSelectedShop(null);
    setSelectedType("all");
    setCurrentPage(1);
  };

  // Quick category data - exactly matching screenshot
  const quickCategories = [
    { id: "all", name: "All Bikes", icon: "🏍️" },
    { id: "bike", name: "City Bikes", icon: "🚴" },
    { id: "scooter", name: "Scooters", icon: "🛵" },
    { id: "car", name: "Cars", icon: "🚗" },
    { id: "electric", name: "Electric", icon: "⚡" },
  ];

  // Format data for display
  const vehicles = vehiclesResponse?.data?.map(formatVehicleForDisplay) || [];
  const formattedShops = shops?.data?.map(formatShopForDisplay) || [];

  // Mock data to match screenshot design
  const mockShops = [
    {
      id: 1,
      name: "City Rentals",
      description: "Premium bikes and scooters",
      rating: 4.5,
      status: "Open Now",
    },
    {
      id: 2,
      name: "GreenMove",
      description: "Eco-friendly electric scooters and bikes",
      rating: 4.7,
      status: "Open Now",
    },
  ];

  const mockVehicles = [
    {
      id: 1,
      name: "Royal Enfield Classic",
      rating: 4.8,
      type: "City Rentals",
      price: "$12",
      priceUnit: "per hour",
      image: "/api/placeholder/400/250",
      isAvailable: true,
      fuel: "Petrol",
      features: ["500cc"],
    },
    {
      id: 2,
      name: "Ather 450X",
      rating: 4.5,
      type: "GreenMove",
      price: "$8",
      priceUnit: "per hour", 
      image: "/api/placeholder/400/250",
      isAvailable: false,
      fuel: "Electric",
      features: ["Electric"],
    },
  ];

  const isLoading = typesLoading || shopsLoading || vehiclesLoading;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header with back button and title */}
      <div className="bg-gray-800 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <FiArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-white">Rent a Ride</h1>
          </div>
        </div>

        {/* View Mode Toggle - exactly like screenshot */}
        <div className="flex items-center mt-4 bg-gray-700 rounded-lg p-1">
          <button
            onClick={() => setViewMode("shop")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all flex-1 justify-center ${
              viewMode === "shop"
                ? "bg-white text-gray-900"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <div className="w-4 h-4 bg-gray-400 rounded-sm flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-sm"></div>
            </div>
            <span>By Shop</span>
          </button>
          <button
            onClick={() => setViewMode("vehicle")}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all flex-1 justify-center ${
              viewMode === "vehicle"
                ? "bg-white text-gray-900"
                : "text-gray-300 hover:text-white"
            }`}
          >
            <div className="w-4 h-4 bg-gray-400 rounded-sm flex items-center justify-center">
              <div className="w-2 h-2 bg-white rounded-sm"></div>
            </div>
            <span>By Vehicle</span>
          </button>
        </div>
      </div>

      {/* Quick Select Section */}
      <div className="px-4 py-4 bg-gray-800">
        <h2 className="text-sm font-medium text-white mb-3">Quick Select</h2>
        <div className="flex space-x-3 overflow-x-auto">
          {quickCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => {
                setSelectedType(category.id);
                if (category.id !== "all") {
                  setActiveFilters((prev) => ({
                    ...prev,
                    type: category.id,
                  }));
                } else {
                  const { type, ...rest } = activeFilters;
                  setActiveFilters(rest);
                }
              }}
              className={`flex-shrink-0 flex flex-col items-center p-3 rounded-xl transition-all min-w-[80px] ${
                selectedType === category.id
                  ? "bg-green-600 text-white"
                  : "bg-gray-700 text-gray-300 hover:bg-gray-600"
              }`}
            >
              <span className="text-2xl mb-1">{category.icon}</span>
              <span className="text-xs font-medium text-center leading-tight">
                {category.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-4">
        {/* Featured Shops Section */}
        {viewMode === "shop" && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Featured Shops
              </h2>
              <button className="text-green-400 text-sm font-medium hover:text-green-300">
                View All
              </button>
            </div>
            
            <div className="space-y-3">
              {mockShops.map((shop) => (
                <div key={shop.id} className="bg-gray-800 rounded-2xl p-4 border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center">
                          <span className="text-sm">🏪</span>
                        </div>
                        <div>
                          <h3 className="font-medium text-white">{shop.name}</h3>
                          <p className="text-xs text-gray-400">{shop.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3 text-sm">
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-400">★</span>
                          <span className="text-white">{shop.rating}</span>
                        </div>
                        <span className="text-gray-500">•</span>
                        <span className="text-green-400">{shop.status}</span>
                      </div>
                    </div>
                    <FiChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Vehicles Section */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Available Vehicles
          </h2>

          <div className="space-y-4">
            {mockVehicles.map((vehicle) => (
              <div
                key={vehicle.id}
                className="bg-gray-800 rounded-2xl overflow-hidden border border-gray-700"
              >
                <div className="relative">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="w-full h-48 object-cover"
                  />
                  {/* Availability Badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        vehicle.isAvailable
                          ? "bg-green-600 text-white"
                          : "bg-red-600 text-white"
                      }`}
                    >
                      {vehicle.isAvailable
                        ? "Available Now"
                        : "Not Available"}
                    </span>
                  </div>
                  {/* Price Badge */}
                  <div className="absolute top-3 right-3 bg-black/60 px-3 py-1 rounded-lg">
                    <span className="text-white font-semibold">
                      {vehicle.price}
                    </span>
                    <span className="text-gray-300 text-xs ml-1">
                      {vehicle.priceUnit}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="font-semibold text-white text-lg mb-1">
                    {vehicle.name}
                  </h3>

                  <div className="flex items-center space-x-3 text-sm text-gray-400 mb-4">
                    <div className="flex items-center space-x-1">
                      <span className="text-yellow-400">★</span>
                      <span className="text-white">{vehicle.rating}</span>
                    </div>
                    <span>•</span>
                    <span className="text-gray-300">{vehicle.type}</span>
                    <span>•</span>
                    <span className="text-green-400">{vehicle.fuel}</span>
                  </div>

                  <button
                    className={`w-full py-3 rounded-2xl font-medium transition-colors ${
                      vehicle.isAvailable
                        ? "bg-red-600 hover:bg-red-700 text-white"
                        : "bg-gray-700 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    {vehicle.isAvailable ? "Booked" : "Not Available"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Search Bar - like screenshot */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-4 py-4">
        <div className="relative">
          <input
            type="text"
            placeholder="Search rides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 border border-gray-600 rounded-2xl px-4 py-3 pl-12 pr-16 text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
          />
          <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-2">
            <button
              onClick={() => setShowVoiceSearch(true)}
              className="p-2 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors"
            >
              <FiMic className="w-4 h-4 text-gray-300" />
            </button>
            <button
              onClick={() => setShowFilters(true)}
              className="w-10 h-10 bg-green-600 hover:bg-green-700 rounded-2xl flex items-center justify-center transition-colors"
            >
              <span className="text-white text-lg">+</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Bottom Sheet */}
      <DarkFilterBottomSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

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

export default VehiclesPageDark;
    setActiveFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
    setShowFilters(false);
  };

  // Modern filter handler
  const handleFiltersChange = (newFilters) => {
    setFilters(newFilters);
    setActiveFilters((prev) => ({ ...prev, ...newFilters }));
    setCurrentPage(1);
  };

  // Clear filters
  const clearFilters = () => {
    setActiveFilters({});
    setSearchQuery("");
    setSelectedShop(null);
    setSelectedType("all");
    setCurrentPage(1);
  };

  // Quick category data
  const quickCategories = [
    { id: "all", name: "All Bikes", icon: "🏍️" },
    { id: "bike", name: "City Bikes", icon: "🚴" },
    { id: "car", name: "Cars", icon: "🚗" },
    { id: "scooter", name: "Scooters", icon: "🛵" },
    { id: "electric", name: "Electric", icon: "⚡" },
  ];

  // Format data for display
  const vehicles = vehiclesResponse?.data?.map(formatVehicleForDisplay) || [];
  //   console.log(shops);
  const formattedShops = shops?.data?.map(formatShopForDisplay) || [];

  const isLoading = typesLoading || shopsLoading || vehiclesLoading;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <FiArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold text-white">Rent a Ride</h1>
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center space-x-1 mt-4 bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode("shop")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === "shop"
                  ? "bg-green-600 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              <span className="w-4 h-4 bg-gray-400 rounded-sm"></span>
              <span>By Shop</span>
            </button>
            <button
              onClick={() => setViewMode("vehicle")}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                viewMode === "vehicle"
                  ? "bg-green-600 text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              <span className="w-4 h-4 bg-gray-400 rounded-sm"></span>
              <span>By Vehicle</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Category Section */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            Quick Select
          </h2>
          <div className="flex space-x-4 overflow-x-auto pb-2">
            {quickCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedType(category.id);
                  if (category.id !== "all") {
                    setActiveFilters((prev) => ({
                      ...prev,
                      type: category.id,
                    }));
                  } else {
                    const { type, ...rest } = activeFilters;
                    setActiveFilters(rest);
                  }
                }}
                className={`flex-shrink-0 flex flex-col items-center p-4 rounded-xl transition-all min-w-[100px] ${
                  selectedType === category.id
                    ? "bg-green-600 border-2 border-green-400"
                    : "bg-gray-700 border-2 border-gray-600 hover:border-gray-500"
                }`}
              >
                <span className="text-2xl mb-2">{category.icon}</span>
                <span className="text-xs font-medium text-center">
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Featured Shops Section */}
        {viewMode === "shop" && formattedShops.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                Featured Shops
              </h2>
              <button className="text-green-400 text-sm font-medium hover:text-green-300">
                View All
              </button>
            </div>

            <div className="space-y-4">
              {formattedShops.slice(0, 2).map((shop) => (
                <div
                  key={shop.id}
                  className="bg-gray-800 rounded-xl p-4 border border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-white text-lg">
                        {shop.name}
                      </h3>
                      <p className="text-gray-400 text-sm">
                        {shop.description}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <div className="flex items-center space-x-1">
                          <span className="text-yellow-400">★</span>
                          <span className="text-sm text-gray-300">
                            {shop.rating}
                          </span>
                        </div>
                        <span className="text-gray-500">•</span>
                        <span className="text-green-400 text-sm">Open Now</span>
                      </div>
                    </div>
                    <FiChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Vehicles Section */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            Available Vehicles
          </h2>

          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner />
            </div>
          ) : vehiclesError ? (
            <div className="text-center py-12">
              <p className="text-red-400 mb-4">Error loading vehicles</p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Retry
              </button>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 mb-4">No vehicles found</p>
              <button
                onClick={clearFilters}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {vehicles.map((vehicle) => (
                <div
                  key={vehicle.id}
                  className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700"
                >
                  <div className="relative">
                    <img
                      src={vehicle.images?.[0] || "/api/placeholder/300/200"}
                      alt={vehicle.name}
                      className="w-full h-48 object-cover"
                    />
                    {/* Availability Badge */}
                    <div className="absolute top-3 left-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          vehicle.isAvailable
                            ? "bg-green-600 text-white"
                            : "bg-red-600 text-white"
                        }`}
                      >
                        {vehicle.isAvailable
                          ? "Available Now"
                          : "Not Available"}
                      </span>
                    </div>
                    {/* Price Badge */}
                    <div className="absolute top-3 right-3 bg-black/70 px-3 py-1 rounded-lg">
                      <span className="text-white font-semibold">
                        ${vehicle.pricePerHour || vehicle.price}
                      </span>
                      <span className="text-gray-300 text-sm ml-1">
                        per hour
                      </span>
                    </div>
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-white text-lg mb-1">
                      {vehicle.name}
                    </h3>

                    <div className="flex items-center space-x-4 text-sm text-gray-400 mb-3">
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-400">★</span>
                        <span>{vehicle.rating || "4.8"}</span>
                      </div>
                      <span>•</span>
                      <span>{vehicle.type || "GreenMove"}</span>
                      <span>•</span>
                      <span className="text-green-400">
                        {vehicle.features?.includes("electric")
                          ? "Electric"
                          : "Petrol"}
                      </span>
                    </div>

                    <button
                      className={`w-full py-3 rounded-xl font-medium transition-colors ${
                        vehicle.isAvailable
                          ? "bg-red-600 hover:bg-red-700 text-white"
                          : "bg-gray-700 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      {vehicle.isAvailable ? "Booked" : "Not Available"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search Button (Fixed) */}
      <div className="fixed bottom-6 right-6">
        <button
          onClick={() => setShowFilters(true)}
          className="w-14 h-14 bg-green-600 hover:bg-green-700 rounded-full flex items-center justify-center shadow-lg transition-colors"
        >
          <FiSearch className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Filter Bottom Sheet */}
      <DarkFilterBottomSheet
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

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

export default VehiclesPageDark;
