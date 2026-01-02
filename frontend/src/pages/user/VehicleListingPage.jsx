import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  useGetPublicVehiclesQuery,
  useGetPublicZonesQuery,
} from "../../redux/api/vehicleApi";
import {
  FiSearch,
  FiFilter,
  FiMapPin,
  FiClock,
  FiStar,
  FiUsers,
  FiSettings,
  FiTruck,
  FiRefreshCw,
} from "react-icons/fi";
import { FaGasPump } from "react-icons/fa";
import VoiceSearchBar from "../../components/vehicle/VoiceSearchBar";

const VehicleListingPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState({
    category: searchParams.get("category") || "",
    type: searchParams.get("type") || "",
    zoneCode: searchParams.get("zone") || "",
    search: searchParams.get("search") || "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [currentPage, setCurrentPage] = useState(1);

  // RTK Query hooks
  const {
    data: vehiclesData,
    isLoading: vehiclesLoading,
    error: vehiclesError,
    refetch: refetchVehicles,
  } = useGetPublicVehiclesQuery({
    ...filters,
    sortBy,
    page: currentPage,
    limit: 12,
  });

  const {
    data: zonesData,
    isLoading: zonesLoading,
    error: zonesError,
  } = useGetPublicZonesQuery();

  // Extract data from RTK Query responses
  const vehicles = vehiclesData?.data || [];
  const pagination = vehiclesData?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  };
  const zones = zonesData?.data || [];

  // Loading state
  const loading = vehiclesLoading || zonesLoading;

  // Vehicle categories with icons
  const categories = [
    { value: "bike", label: "Bikes", icon: "🏍️" },
    { value: "scooty", label: "Scooters", icon: "🛵" },
    { value: "car", label: "Cars", icon: "🚗" },
    { value: "truck", label: "Trucks", icon: "🚛" },
    { value: "bus", label: "Buses", icon: "🚌" },
  ];

  const fuelTypes = [
    { value: "EV", label: "Electric" },
    { value: "Petrol", label: "Petrol" },
    { value: "Diesel", label: "Diesel" },
    { value: "CNG", label: "CNG" },
  ];

  // Handle error states
  useEffect(() => {
    if (vehiclesError) {
      console.error("Error fetching vehicles:", vehiclesError);
      toast.error("Failed to load vehicles");
    }
    if (zonesError) {
      console.error("Error fetching zones:", zonesError);
      toast.error("Failed to load zones");
    }
  }, [vehiclesError, zonesError]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change

    // Update URL params
    const newSearchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) newSearchParams.set(k, v);
    });
    setSearchParams(newSearchParams);
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      category: "",
      type: "",
      zoneCode: "",
      search: "",
    });
    setCurrentPage(1);
    setSearchParams({});
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle refresh
  const handleRefresh = () => {
    refetchVehicles();
  };

  // Handle voice search
  const handleVoiceSearch = (transcript, voiceFilters) => {
    console.log("Voice search transcript:", transcript);
    console.log("Voice search filters:", voiceFilters);

    // Set search query from transcript
    if (transcript) {
      handleFilterChange("search", transcript);
    }

    // Apply any voice-detected filters
    if (voiceFilters && Object.keys(voiceFilters).length > 0) {
      const newFilters = { ...filters, ...voiceFilters };
      setFilters(newFilters);
      setCurrentPage(1);

      // Update URL params
      const newSearchParams = new URLSearchParams();
      Object.entries(newFilters).forEach(([k, v]) => {
        if (v) newSearchParams.set(k, v);
      });
      setSearchParams(newSearchParams);
    }
  };

  // Handle search change
  const handleSearchChange = (query) => {
    handleFilterChange("search", query);
  };

  // Handle filter click (for voice search bar)
  const handleFilterClick = () => {
    setShowFilters(!showFilters);
  };

  // Handle filter changes
  //   const handleFilterChange = (key, value) => {
  //     const newFilters = { ...filters, [key]: value };
  //     setFilters(newFilters);

  //     // Update URL params
  //     const newSearchParams = new URLSearchParams();
  //     Object.entries(newFilters).forEach(([k, v]) => {
  //       if (v) newSearchParams.set(k, v);
  //     });
  //     setSearchParams(newSearchParams);
  //   };

  //   // Clear filters
  //   const clearFilters = () => {
  //     setFilters({
  //       category: "",
  //       type: "",
  //       zoneCode: "",
  //       search: "",
  //     });
  //     setSearchParams({});
  //   };

  // Handle vehicle booking
  const handleBookVehicle = (vehicle) => {
    navigate(`/vehicles/${vehicle._id}/book`, {
      state: { vehicle },
    });
  };

  // Vehicle Card Component
  const VehicleCard = ({ vehicle }) => (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Vehicle Image */}
      <div className="relative h-48 bg-gray-200">
        {vehicle.vehicleImages && vehicle.vehicleImages.length > 0 ? (
          <img
            src={vehicle.vehicleImages[0]}
            alt={vehicle.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            {categories.find((c) => c.value === vehicle.category)?.icon || "🚗"}
          </div>
        )}

        {/* Badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`px-2 py-1 rounded-full text-xs font-semibold ${
              vehicle.type === "EV"
                ? "bg-green-100 text-green-800"
                : "bg-blue-100 text-blue-800"
            }`}
          >
            {vehicle.type}
          </span>
        </div>

        {/* Rating */}
        {vehicle.analytics?.averageRating > 0 && (
          <div className="absolute top-3 right-3 bg-white rounded-full px-2 py-1 flex items-center space-x-1">
            <FiStar className="w-3 h-3 text-yellow-500 fill-current" />
            <span className="text-xs font-semibold">
              {vehicle.analytics.averageRating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-gray-900 truncate">
            {vehicle.name}
          </h3>
          <span className="text-sm text-gray-500">{vehicle.companyName}</span>
        </div>

        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
          <div className="flex items-center space-x-1">
            <FiMapPin className="w-4 h-4" />
            <span>{vehicle.zoneCenterName}</span>
          </div>
          <div className="flex items-center space-x-1">
            <FaGasPump className="w-4 h-4" />
            <span>{vehicle.mileage} km/l</span>
          </div>
        </div>

        {/* Features */}
        <div className="flex flex-wrap gap-1 mb-3">
          {vehicle.vehicleFeatures?.slice(0, 3).map((feature, index) => (
            <span
              key={index}
              className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
            >
              {feature}
            </span>
          ))}
          {vehicle.vehicleFeatures?.length > 3 && (
            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
              +{vehicle.vehicleFeatures.length - 3} more
            </span>
          )}
        </div>

        {/* Pricing */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <div className="text-lg font-bold text-indigo-600">
              ₹{vehicle.rate12hr?.ratePerHour || 0}/hr
            </div>
            <div className="text-xs text-gray-500">
              {vehicle.rate12hr?.kmLimit || 0} km included
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600">Deposit</div>
            <div className="text-sm font-semibold">
              ₹{vehicle.depositAmount}
            </div>
          </div>
          {/* Vehicle Info */}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {console.log("Rendering vehicle image for:", vehicle._id)}
          <button
            onClick={() => navigate(`/vehicles/${vehicle._id}`)}
            className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            View Details
          </button>
          <button
            onClick={() => handleBookVehicle(vehicle)}
            className="flex-1 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Vehicle Rental
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Choose from our wide range of vehicles for your journey
              </p>
            </div>

            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              {/* Voice Search Bar */}
              <VoiceSearchBar
                searchQuery={filters.search}
                onSearchChange={handleSearchChange}
                onVoiceSearch={handleVoiceSearch}
                onFilterClick={handleFilterClick}
                className="w-64"
              />
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={filters.category}
                    onChange={(e) =>
                      handleFilterChange("category", e.target.value)
                    }
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fuel Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fuel Type
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={filters.type}
                    onChange={(e) => handleFilterChange("type", e.target.value)}
                  >
                    <option value="">All Types</option>
                    {fuelTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Zone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pickup Location
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={filters.zoneCode}
                    onChange={(e) =>
                      handleFilterChange("zoneCode", e.target.value)
                    }
                  >
                    <option value="">All Locations</option>
                    {zones.map((zone) => (
                      <option key={zone.code} value={zone.code}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="createdAt">Newest</option>
                    <option value="rate12hr.ratePerHour">
                      Price: Low to High
                    </option>
                    <option value="-rate12hr.ratePerHour">
                      Price: High to Low
                    </option>
                    <option value="-analytics.averageRating">
                      Highest Rated
                    </option>
                    <option value="name">Name A-Z</option>
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              <div className="mt-4 flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  {pagination.totalItems} vehicles found
                </span>
                <button
                  onClick={clearFilters}
                  className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-xl shadow-lg animate-pulse"
              >
                <div className="h-48 bg-gray-200 rounded-t-xl"></div>
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="flex space-x-2 mb-4">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="h-8 bg-gray-200 rounded flex-1"></div>
                    <div className="h-8 bg-gray-200 rounded flex-1"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : vehicles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vehicles.map((vehicle, index) => (
              <VehicleCard key={`${vehicle._id}-${index}`} vehicle={vehicle} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <FiTruck className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No vehicles found
            </h3>
            <p className="text-gray-500 mb-6">
              Try adjusting your filters to see more vehicles
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center space-x-2 bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={!pagination.hasPrev}
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {[...Array(Math.min(5, pagination.totalPages))].map(
                (_, index) => {
                  const pageNum =
                    Math.max(1, pagination.currentPage - 2) + index;
                  if (pageNum <= pagination.totalPages) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-2 rounded-lg ${
                          pageNum === pagination.currentPage
                            ? "bg-indigo-600 text-white"
                            : "border border-gray-300 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  }
                  return null;
                }
              )}

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={!pagination.hasNext}
                className="px-3 py-2 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VehicleListingPage;
