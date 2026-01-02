import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import GroceryNav from "../components/grocery/GroceryNav";
import { FaSearch, FaTimes, FaShoppingCart, FaSpinner } from "react-icons/fa";
import { useSearchGroceryProductsQuery, useGetGroceryProductsByCategoryQuery } from "../redux/storee/api";
import GroceryProductCard from "../components/grocery/GroceryProductCard";
import { useDebounce } from "../hooks/useDebounce";

const GroceryProductsPage = () => {
  const { categoryId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  const [filters, setFilters] = useState({
    category: categoryId || '',
    search: searchParams.get('search') || '',
    page: parseInt(searchParams.get('page') || '1', 10),
    limit: 12
  });

  // Initialize search query from URL params
  useEffect(() => {
    const search = searchParams.get('search');
    const page = searchParams.get('page');
    
    setFilters(prev => ({
      ...prev,
      search: search || '',
      page: page ? parseInt(page, 10) : 1
    }));
  }, [searchParams]);

  // Fetch products based on filters
  const { data: searchResults, isLoading: isSearching, error: searchError } = 
    useSearchGroceryProductsQuery(filters.search, { skip: !filters.search });
    
  const { data: categoryResults, isLoading: isLoadingCategory, error: categoryError } = 
    useGetGroceryProductsByCategoryQuery(filters.category || 'all', { skip: !!filters.search });

  // Determine which data to use based on whether we're searching or not
  const products = filters.search 
    ? searchResults?.products || [] 
    : categoryResults?.products || [];
    
  const pagination = filters.search
    ? searchResults?.pagination || { currentPage: 1, pages: 1, total: 0 }
    : categoryResults?.pagination || { currentPage: 1, pages: 1, total: 0 };

  const isLoading = isSearching || isLoadingCategory;
  const error = searchError || categoryError;

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.search) params.set('search', filters.search);
    if (filters.category) params.set('category', filters.category);
    if (filters.page > 1) params.set('page', filters.page);
    
    navigate(`?${params.toString()}`, { replace: true });
  }, [filters, navigate]);

  // Handle search input changes
  const debouncedSearch = useDebounce((value) => {
    setFilters(prev => ({
      ...prev,
      search: value,
      page: 1 // Reset to first page on new search
    }));
  }, 500);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedSearch(value);
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset to first page when filters change
    }));
  };

  const handleCategoryChange = (category) => {
    handleFilterChange({ category });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setFilters(prev => ({
        ...prev,
        search: searchQuery,
        page: 1
      }));
    } else {
      setFilters(prev => ({
        ...prev,
        search: "",
        page: 1
      }));
    }
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setFilters(prev => ({
      ...prev,
      search: "",
      page: 1
    }));
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setFilters({
      category: "",
      search: "",
      page: 1,
      limit: 12
    });
    navigate("/grocery", { replace: true });
  };

  // Check if any filters are active
  const hasActiveFilters =
    filters.category ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.sortBy !== "createdAt" ||
    filters.sortOrder !== "desc" ||
    filters.search;

  if (error) {
    return (
      <div className="container mx-auto my-5 p-4">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4">
          <h3 className="font-bold">Error loading products</h3>
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto my-5 p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {filters.search
            ? `Search Results for "${filters.search}"`
            : filters.category && filters.category !== 'all'
            ? `${filters.category} Products`
            : "All Grocery Products"}
        </h1>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {pagination?.total || 0} {pagination?.total === 1 ? "item" : "items"} found
          </span>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-1/4">
          <GroceryNav />

          {/* Price Filter */}
          <div className="bg-white rounded-lg shadow p-4 mb-4">
            <h6 className="font-medium mb-3">Price Range</h6>
            <div className="flex items-center gap-2 mb-3">
              <input
                type="number"
                name="minPrice"
                placeholder="Min"
                value={filters.minPrice || ""}
                onChange={handleFilterChange}
                min="0"
                className="w-full p-2 border rounded text-sm"
              />
              <span>-</span>
              <input
                type="number"
                name="maxPrice"
                placeholder="Max"
                value={filters.maxPrice || ""}
                onChange={handleFilterChange}
                min={filters.minPrice || "0"}
                className="w-full p-2 border rounded text-sm"
              />
            </div>
            <button
              className="w-full p-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50 transition-colors text-sm"
              onClick={() => {
                if (filters.minPrice || filters.maxPrice) {
                  handleFilterChange({
                    minPrice: filters.minPrice,
                    maxPrice: filters.maxPrice,
                    page: 1,
                  });
                }
              }}
            >
              Apply Price
            </button>
          </div>

          {/* Active Filters */}
          {hasActiveFilters && (
            <div className="bg-white rounded-lg shadow p-4 mb-4">
              <div className="flex justify-between items-center mb-2">
                <h6 className="font-medium">Active Filters</h6>
                <button
                  className="text-blue-500 hover:text-blue-700 text-sm"
                  onClick={handleClearFilters}
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {filters.category && (
                  <span className="inline-flex items-center bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-sm">
                    {filters.category}
                    <button
                      className="ml-1 text-gray-500 hover:text-gray-700"
                      onClick={() => handleFilterChange({ category: "" })}
                    >
                      <FaTimes size={10} />
                    </button>
                  </span>
                )}
                {(filters.minPrice || filters.maxPrice) && (
                  <span className="inline-flex items-center bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-sm">
                    ${filters.minPrice || "0"} - ${filters.maxPrice || "∞"}
                    <button
                      className="ml-1 text-gray-500 hover:text-gray-700"
                      onClick={() =>
                        handleFilterChange({ minPrice: "", maxPrice: "" })
                      }
                    >
                      <FaTimes size={10} />
                    </button>
                  </span>
                )}
                {filters.search && (
                  <span className="inline-flex items-center bg-gray-100 text-gray-800 rounded-full px-3 py-1 text-sm">
                    Search: {filters.search}
                    <button
                      className="ml-1 text-gray-500 hover:text-gray-700"
                      onClick={() => handleFilterChange({ search: "" })}
                    >
                      <FaTimes size={10} />
                    </button>
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="w-full lg:w-3/4">
          {/* Search and Sort Bar */}
          <div className="bg-white rounded-lg shadow p-3 mb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <form
                onSubmit={handleSearch}
                className="w-full sm:flex-1 sm:max-w-md"
              >
                <div className="relative">
                  <input
                    type="search"
                    name="search"
                    placeholder="Search groceries..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="w-full p-2 pl-3 pr-10 border rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-0 top-0 h-full px-3 border-l border-gray-300 bg-gray-50 rounded-r hover:bg-gray-100"
                  >
                    <FaSearch />
                  </button>
                </div>
              </form>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-gray-500 whitespace-nowrap">
                  Sort by:
                </span>
                <select
                  name="sortBy"
                  value={filters.sortBy}
                  onChange={handleFilterChange}
                  className="p-2 border rounded text-sm"
                >
                  <option value="createdAt">Newest</option>
                  <option value="price">Price</option>
                  <option value="title">Name</option>
                  <option value="ratings.average">Rating</option>
                </select>

                <select
                  name="sortOrder"
                  value={filters.sortOrder}
                  onChange={handleFilterChange}
                  className="p-2 border rounded text-sm"
                >
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <FaSpinner className="animate-spin text-green-500 text-4xl" />
            </div>
          ) : (
            <>
              {/* Products Grid */}
              {products.length === 0 ? (
                <div className="bg-white rounded-lg shadow text-center p-8 my-4">
                  <h5 className="text-lg font-medium">No products found</h5>
                  <p className="text-gray-500 mt-2">
                    We couldn't find any products matching your criteria.
                  </p>
                  <button
                    className="mt-4 px-4 py-2 border border-blue-500 text-blue-500 rounded hover:bg-blue-50 transition-colors"
                    onClick={handleClearFilters}
                  >
                    Clear all filters
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {products.map((product) => (
                      <GroceryProductCard key={product._id} product={product} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {pagination.pages > 1 && (
                    <div className="flex justify-center mt-8">
                      <nav className="flex items-center gap-1">
                        {/* Previous Page */}
                        <button
                          className={`px-3 py-1 border rounded ${
                            pagination.currentPage === 1
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-gray-100"
                          }`}
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          disabled={pagination.currentPage === 1}
                          aria-label="Previous"
                        >
                          &laquo;
                        </button>

                        {/* Page Numbers */}
                        {(() => {
                          const pages = [];
                          const totalPages = pagination.pages;
                          const currentPage = pagination.currentPage;
                          
                          // Always show first page
                          pages.push(
                            <button
                              key={1}
                              onClick={() => handlePageChange(1)}
                              className={`px-3 py-1 border rounded ${
                                currentPage === 1
                                  ? "bg-blue-500 text-white border-blue-500"
                                  : "hover:bg-gray-100"
                              }`}
                            >
                              1
                            </button>
                          );

                          // Show ellipsis if needed
                          if (currentPage > 3) {
                            pages.push(
                              <span key="start-ellipsis" className="px-2">
                                ...
                              </span>
                            );
                          }

                          // Show pages around current page
                          for (
                            let i = Math.max(2, currentPage - 1);
                            i <= Math.min(totalPages - 1, currentPage + 1);
                            i++
                          ) {
                            pages.push(
                              <button
                                key={i}
                                onClick={() => handlePageChange(i)}
                                className={`px-3 py-1 border rounded ${
                                  currentPage === i
                                    ? "bg-blue-500 text-white border-blue-500"
                                    : "hover:bg-gray-100"
                                }`}
                              >
                                {i}
                              </button>
                            );
                          }

                          // Show ellipsis if needed
                          if (currentPage < totalPages - 2) {
                            pages.push(
                              <span key="end-ellipsis" className="px-2">
                                ...
                              </span>
                            );
                          }

                          // Always show last page if there is more than one page
                          if (totalPages > 1) {
                            pages.push(
                              <button
                                key={totalPages}
                                onClick={() => handlePageChange(totalPages)}
                                className={`px-3 py-1 border rounded ${
                                  currentPage === totalPages
                                    ? "bg-blue-500 text-white border-blue-500"
                                    : "hover:bg-gray-100"
                                }`}
                              >
                                {totalPages}
                              </button>
                            );
                          }

                          return pages;
                        })()}

                        {/* Next Page */}
                        <button
                          className={`px-3 py-1 border rounded ${
                            pagination.currentPage === pagination.pages
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-gray-100"
                          }`}
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          disabled={pagination.currentPage === pagination.pages}
                          aria-label="Next"
                        >
                          &raquo;
                        </button>
                      </nav>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroceryProductsPage;
