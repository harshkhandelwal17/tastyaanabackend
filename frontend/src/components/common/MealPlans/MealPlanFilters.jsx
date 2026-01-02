import React from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  selectFilters,
  selectSearchTerm,
  setFilters,
  setSearchTerm,
  resetFilters,
  setSorting,
} from "../../storee/Slices/mealPlanSlice";
import { Search, Filter, X } from "lucide-react";

const MealPlanFilters = () => {
  const dispatch = useDispatch();
  const filters = useSelector(selectFilters);
  const searchTerm = useSelector(selectSearchTerm);

  const handleFilterChange = (key, value) => {
    dispatch(setFilters({ [key]: value }));
  };

  const handleSearchChange = (e) => {
    dispatch(setSearchTerm(e.target.value));
  };

  const handleSortChange = (e) => {
    const [sortBy, sortOrder] = e.target.value.split("-");
    dispatch(setSorting({ sortBy, sortOrder }));
  };

  const handleResetFilters = () => {
    dispatch(resetFilters());
  };

  const hasActiveFilters =
    filters.tier !== "all" ||
    filters.isPopular ||
    filters.tags.length > 0 ||
    searchTerm;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search meal plans..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Tier Filter */}
        <div className="min-w-[150px]">
          <select
            value={filters.tier}
            onChange={(e) => handleFilterChange("tier", e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="all">All Tiers</option>
            <option value="low">Low Tier</option>
            <option value="basic">Basic Tier</option>
            <option value="premium">Premium Tier</option>
          </select>
        </div>

        {/* Price Range */}
        <div className="min-w-[200px]">
          <div className="flex items-center space-x-2">
            <input
              type="number"
              placeholder="Min"
              value={filters.priceRange.min}
              onChange={(e) =>
                handleFilterChange("priceRange", {
                  ...filters.priceRange,
                  min: Number(e.target.value),
                })
              }
              className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <span className="text-gray-500">-</span>
            <input
              type="number"
              placeholder="Max"
              value={filters.priceRange.max}
              onChange={(e) =>
                handleFilterChange("priceRange", {
                  ...filters.priceRange,
                  max: Number(e.target.value),
                })
              }
              className="w-20 px-2 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
        </div>

        {/* Popular Filter */}
        <div className="flex items-center">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.isPopular}
              onChange={(e) =>
                handleFilterChange("isPopular", e.target.checked)
              }
              className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-sm text-gray-700">Popular Only</span>
          </label>
        </div>

        {/* Sort */}
        <div className="min-w-[150px]">
          <select
            onChange={handleSortChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="pricing.oneDay-asc">Price: Low to High</option>
            <option value="pricing.oneDay-desc">Price: High to Low</option>
            <option value="ratings.average-desc">Highest Rated</option>
            <option value="title-asc">Name: A to Z</option>
            <option value="title-desc">Name: Z to A</option>
          </select>
        </div>

        {/* Reset Filters */}
        {hasActiveFilters && (
          <button
            onClick={handleResetFilters}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <X className="w-4 h-4" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {searchTerm && (
            <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-sm flex items-center">
              Search: "{searchTerm}"
              <button
                onClick={() => dispatch(setSearchTerm(""))}
                className="ml-2 hover:text-amber-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.tier !== "all" && (
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm flex items-center capitalize">
              {filters.tier} Tier
              <button
                onClick={() => handleFilterChange("tier", "all")}
                className="ml-2 hover:text-blue-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.isPopular && (
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-sm flex items-center">
              Popular Only
              <button
                onClick={() => handleFilterChange("isPopular", false)}
                className="ml-2 hover:text-orange-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default MealPlanFilters;
