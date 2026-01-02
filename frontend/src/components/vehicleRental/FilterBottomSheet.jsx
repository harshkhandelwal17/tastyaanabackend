import React, { useState, useEffect } from "react";
import { FiX, FiCheck } from "react-icons/fi";

const FilterBottomSheet = ({
  filterOptions,
  activeFilters,
  onApply,
  onClose,
}) => {
  const [localFilters, setLocalFilters] = useState(activeFilters || {});
  const [priceRange, setPriceRange] = useState({
    min: localFilters.minPrice || 0,
    max: localFilters.maxPrice || 1000,
  });

  useEffect(() => {
    setLocalFilters(activeFilters || {});
    setPriceRange({
      min: activeFilters?.minPrice || 0,
      max: activeFilters?.maxPrice || 1000,
    });
  }, [activeFilters]);

  const handleFilterChange = (key, value) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handlePriceChange = (type, value) => {
    setPriceRange((prev) => ({
      ...prev,
      [type]: parseInt(value),
    }));
  };

  const handleApply = () => {
    const finalFilters = {
      ...localFilters,
      minPrice: priceRange.min > 0 ? priceRange.min : undefined,
      maxPrice: priceRange.max < 1000 ? priceRange.max : undefined,
    };

    // Remove undefined values
    Object.keys(finalFilters).forEach(
      (key) => finalFilters[key] === undefined && delete finalFilters[key]
    );

    onApply(finalFilters);
  };

  const clearAllFilters = () => {
    setLocalFilters({});
    setPriceRange({ min: 0, max: 1000 });
  };

  if (!filterOptions) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">
            Filter Options
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FiX size={20} />
          </button>
        </div>

        <div className="p-4 space-y-6">
          {/* Vehicle Type */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Vehicle Type</h4>
            <div className="grid grid-cols-2 gap-2">
              {filterOptions.vehicleTypes?.map((type) => (
                <button
                  key={type.value}
                  onClick={() =>
                    handleFilterChange(
                      "type",
                      localFilters.type === type.value ? undefined : type.value
                    )
                  }
                  className={`flex items-center space-x-2 p-3 rounded-lg border text-left transition-colors ${
                    localFilters.type === type.value
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-xl">{type.icon}</span>
                  <span className="text-sm font-medium">{type.label}</span>
                  {localFilters.type === type.value && (
                    <FiCheck size={16} className="ml-auto text-green-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Fuel Type */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Fuel Type</h4>
            <div className="grid grid-cols-2 gap-2">
              {filterOptions.fuelTypes?.map((fuel) => (
                <button
                  key={fuel.value}
                  onClick={() =>
                    handleFilterChange(
                      "fuelType",
                      localFilters.fuelType === fuel.value
                        ? undefined
                        : fuel.value
                    )
                  }
                  className={`flex items-center space-x-2 p-3 rounded-lg border text-left transition-colors ${
                    localFilters.fuelType === fuel.value
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-xl">{fuel.icon}</span>
                  <span className="text-sm font-medium">{fuel.label}</span>
                  {localFilters.fuelType === fuel.value && (
                    <FiCheck size={16} className="ml-auto text-green-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Zone */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Delivery Zone</h4>
            <div className="space-y-2">
              {filterOptions.zones?.slice(0, 5).map((zone) => (
                <button
                  key={zone.code}
                  onClick={() =>
                    handleFilterChange(
                      "zoneCode",
                      localFilters.zoneCode === zone.code
                        ? undefined
                        : zone.code
                    )
                  }
                  className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                    localFilters.zoneCode === zone.code
                      ? "border-green-500 bg-green-50 text-green-700"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <div>
                    <p className="font-medium">{zone.name}</p>
                    <p className="text-sm text-gray-500">
                      {zone.count} vehicles
                    </p>
                  </div>
                  {localFilters.zoneCode === zone.code && (
                    <FiCheck size={16} className="text-green-600" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              Price Range (per hour)
            </h4>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">
                    Min Price
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={filterOptions.priceRange?.maxHourlyRate || 1000}
                    step="50"
                    value={priceRange.min}
                    onChange={(e) => handlePriceChange("min", e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    ₹{priceRange.min}
                  </p>
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-600 mb-1">
                    Max Price
                  </label>
                  <input
                    type="range"
                    min={priceRange.min}
                    max={filterOptions.priceRange?.maxHourlyRate || 1000}
                    step="50"
                    value={priceRange.max}
                    onChange={(e) => handlePriceChange("max", e.target.value)}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    ₹{priceRange.max}
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-600">
                  Selected range: ₹{priceRange.min} - ₹{priceRange.max} per hour
                </p>
              </div>
            </div>
          </div>

          {/* Brand */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Brand</h4>
            <select
              value={localFilters.brand || ""}
              onChange={(e) =>
                handleFilterChange("brand", e.target.value || undefined)
              }
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Brands</option>
              {filterOptions.brands?.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>
          </div>

          {/* Availability */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Availability</h4>
            <div className="space-y-2">
              <button
                onClick={() =>
                  handleFilterChange(
                    "availability",
                    localFilters.availability === "available"
                      ? undefined
                      : "available"
                  )
                }
                className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                  localFilters.availability === "available"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span className="text-lg">✅</span>
                  <span className="font-medium">Available Now</span>
                </div>
                {localFilters.availability === "available" && (
                  <FiCheck size={16} className="text-green-600" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t p-4 flex space-x-3">
          <button
            onClick={clearAllFilters}
            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterBottomSheet;
