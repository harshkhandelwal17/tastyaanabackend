import React, { useState } from "react";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaImage,
  FaSpinner,
  FaSearch,
  FaFilter,
  FaList,
  FaSort,
  FaChevronDown,
  FaChevronUp,
  FaTimes,
  FaInfoCircle,
} from "react-icons/fa";
import { FaGuitar } from "react-icons/fa6";

import { HiDotsVertical } from "react-icons/hi";
import AddGadgetModal from "./components/AddGadgetModal";
import {
  useGetSellerProductsQuery,
  useDeleteProductMutation,
} from "../../redux/api/sellerProductApi";
import { toast } from "react-toastify";

const formatPrice = (v) => `₹${(v || 0).toFixed(2)}`;

const GadgetManagement = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedCard, setExpandedCard] = useState(null);

  const {
    data: response,
    isLoading,
    error,
    refetch,
  } = useGetSellerProductsQuery({
    page,
    limit: 20,
    search,
    category: "gadgets",
    sortBy,
    sortOrder,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const [deleteProduct, { isLoading: isDeleting }] = useDeleteProductMutation();

  const products = response?.data || [];
  const pagination = response?.pagination || {};

  const handleEdit = (product) => {
    setEditingProduct(product);
    setShowAddModal(true);
  };

  const handleDelete = async (productId, productTitle) => {
    if (window.confirm(`Are you sure you want to delete "${productTitle}"?`)) {
      try {
        await deleteProduct(productId).unwrap();
        toast.success("Product deleted successfully");
        refetch();
      } catch (error) {
        toast.error(error?.data?.message || "Failed to delete product");
      }
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingProduct(null);
  };

  const handleProductSaved = () => {
    handleCloseModal();
    refetch();
    toast.success(
      editingProduct
        ? "Product updated successfully"
        : "Product added successfully"
    );
  };

  // Mobile Action Menu Component
  const MobileActionMenu = ({ product, onEdit, onDelete, onView }) => {
    const [showMenu, setShowMenu] = useState(false);

    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <HiDotsVertical className="text-gray-500" />
        </button>

        {showMenu && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowMenu(false)}
            />
            <div className="absolute right-0 top-10 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[150px]">
              <button
                onClick={() => {
                  onView();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <FaEye className="text-blue-500" />
                View Product
              </button>
              <button
                onClick={() => {
                  onEdit();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <FaEdit className="text-amber-500" />
                Edit Product
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setShowMenu(false);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
              >
                <FaTrash className="text-red-500" />
                Delete Product
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  // Mobile Product Card Component
  const MobileProductCard = ({ product }) => {
    const primaryImage =
      (product.images || []).find((img) => img.isPrimary) ||
      (product.images || [])[0];

    const isExpanded = expandedCard === product._id;

    return (
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-4">
          <div className="flex items-start gap-3">
            {/* Product Image */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {primaryImage?.url ? (
                <img
                  src={primaryImage.url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <FaImage className="text-lg" />
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base line-clamp-2">
                    {product.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 line-clamp-1 mt-1">
                    {product.shortDescription || product.description}
                  </p>
                </div>

                <MobileActionMenu
                  product={product}
                  onView={() =>
                    window.open(`/products/${product._id}`, "_blank")
                  }
                  onEdit={() => handleEdit(product)}
                  onDelete={() => handleDelete(product._id, product.title)}
                />
              </div>

              {/* Price and Status Row */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-sm sm:text-base">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice &&
                    product.originalPrice !== product.price && (
                      <span className="text-xs text-gray-500 line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                </div>

                <span
                  className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    product.isActive
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {product.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Expandable Details */}
              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Stock:</span>
                    <span
                      className={
                        product.stock > 0 ? "text-green-600" : "text-red-600"
                      }
                    >
                      {product.stock || 0} units
                    </span>
                  </div>
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {product.tags.slice(0, 3).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {product.tags.length > 3 && (
                        <span className="text-xs text-gray-500">
                          +{product.tags.length - 3} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Expand/Collapse Button */}
              <button
                onClick={() => setExpandedCard(isExpanded ? null : product._id)}
                className="w-full mt-3 py-2 text-xs text-blue-600 hover:text-blue-800 transition-colors flex items-center justify-center gap-1"
              >
                {isExpanded ? (
                  <>
                    <span>Show Less</span>
                    <FaChevronUp className="text-xs" />
                  </>
                ) : (
                  <>
                    <span>Show More</span>
                    <FaChevronDown className="text-xs" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="px-4 py-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <FaSpinner className="animate-spin text-3xl text-amber-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading your gadgets...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        {/* Mobile-First Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                Gadget Management
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Manage your gadget inventory
              </p>
            </div>

            <button
              onClick={() => setShowAddModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center px-4 py-3 sm:py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium shadow-lg"
            >
              <FaPlus className="mr-2" />
              Add New Gadget
            </button>
          </div>
        </div>

        {/* Enhanced Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FaSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search gadgets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Filter and View Controls */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center px-3 py-2 border rounded-lg text-sm transition-colors ${
                  showFilters
                    ? "bg-amber-50 border-amber-200 text-amber-700"
                    : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <FaFilter className="mr-2" />
                Filters
              </button>

              {/* Status Filter - Always Visible on Mobile */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* View Mode Toggle - Hidden on small mobile */}
            <div className="hidden sm:flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "grid"
                    ? "bg-white text-amber-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FaGuitar />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === "list"
                    ? "bg-white text-amber-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <FaList />
              </button>
            </div>
          </div>

          {/* Collapsible Filters */}
          {showFilters && (
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-gray-900">Filters & Sorting</h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="createdAt">Date Created</option>
                    <option value="title">Product Name</option>
                    <option value="price">Price</option>
                    <option value="stock">Stock</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order
                  </label>
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Stats Cards - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total Products</div>
                <div className="text-2xl font-bold text-gray-900">
                  {pagination.total || 0}
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaImage className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Active Products</div>
                <div className="text-2xl font-bold text-green-600">
                  {products.filter((p) => p.isActive).length}
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FaInfoCircle className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Out of Stock</div>
                <div className="text-2xl font-bold text-red-600">
                  {products.filter((p) => p.stock <= 0).length}
                </div>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <FaInfoCircle className="text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Products Display */}
        {products.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaImage className="text-2xl text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No gadgets found
              </h3>
              <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                {search
                  ? `No gadgets match "${search}". Try adjusting your search terms.`
                  : "Get started by adding your first gadget product to your store."}
              </p>
              {!search && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center px-6 py-3 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
                >
                  <FaPlus className="mr-2" />
                  Add Your First Gadget
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Mobile: Always use card view, Desktop: Respect view mode */}
            <div className="lg:hidden space-y-4">
              {products.map((product) => (
                <MobileProductCard key={product._id} product={product} />
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden lg:block">
              {viewMode === "list" ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Product
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Price
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stock
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {products.map((product) => {
                          const primaryImage =
                            (product.images || []).find(
                              (img) => img.isPrimary
                            ) || (product.images || [])[0];

                          return (
                            <tr
                              key={product._id}
                              className="hover:bg-gray-50 transition-colors"
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <div className="h-16 w-16 rounded-lg overflow-hidden bg-gray-100 mr-4 flex-shrink-0">
                                    {primaryImage?.url ? (
                                      <img
                                        src={primaryImage.url}
                                        alt={product.title}
                                        className="h-full w-full object-cover"
                                      />
                                    ) : (
                                      <div className="h-full w-full flex items-center justify-center text-gray-400">
                                        <FaImage />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                                      {product.title}
                                    </div>
                                    <div className="text-sm text-gray-500 max-w-xs truncate">
                                      {product.shortDescription ||
                                        product.description}
                                    </div>
                                    <div className="text-xs text-gray-400">
                                      {(product.tags || [])
                                        .slice(0, 3)
                                        .join(", ")}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {formatPrice(product.price)}
                                </div>
                                {product.originalPrice &&
                                  product.originalPrice !== product.price && (
                                    <div className="text-xs text-gray-500 line-through">
                                      {formatPrice(product.originalPrice)}
                                    </div>
                                  )}
                              </td>
                              <td className="px-6 py-4">
                                <div
                                  className={`text-sm font-medium ${
                                    product.stock > 0
                                      ? "text-green-600"
                                      : "text-red-600"
                                  }`}
                                >
                                  {product.stock || 0}
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                                    product.isActive
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {product.isActive ? "Active" : "Inactive"}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() =>
                                      window.open(
                                        `/products/${product._id}`,
                                        "_blank"
                                      )
                                    }
                                    className="text-blue-600 hover:text-blue-800 transition-colors"
                                    title="View Product"
                                  >
                                    <FaEye className="text-lg" />
                                  </button>
                                  <button
                                    onClick={() => handleEdit(product)}
                                    className="text-amber-600 hover:text-amber-800 transition-colors"
                                    title="Edit Product"
                                  >
                                    <FaEdit className="text-lg" />
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleDelete(product._id, product.title)
                                    }
                                    disabled={isDeleting}
                                    className="text-red-600 hover:text-red-800 transition-colors disabled:opacity-50"
                                    title="Delete Product"
                                  >
                                    <FaTrash className="text-lg" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <MobileProductCard key={product._id} product={product} />
                  ))}
                </div>
              )}
            </div>

            {/* Enhanced Pagination - Mobile Optimized */}
            {pagination.totalPages > 1 && (
              <div className="mt-8 bg-white border border-gray-200 rounded-xl px-4 py-4">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-gray-600 text-center sm:text-left">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                    {Math.min(
                      pagination.page * pagination.limit,
                      pagination.total
                    )}{" "}
                    of {pagination.total} results
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPage(page - 1)}
                      disabled={!pagination.hasPrev}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Previous
                    </button>

                    <div className="flex items-center gap-1">
                      {/* Page Numbers - Limited on Mobile */}
                      {Array.from(
                        { length: Math.min(5, pagination.totalPages) },
                        (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else {
                            const start = Math.max(1, pagination.page - 2);
                            pageNum = start + i;
                          }

                          if (pageNum > pagination.totalPages) return null;

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setPage(pageNum)}
                              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                                pageNum === pagination.page
                                  ? "bg-amber-600 text-white"
                                  : "border border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        }
                      )}
                    </div>

                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={!pagination.hasNext}
                      className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <AddGadgetModal
          product={editingProduct}
          onClose={handleCloseModal}
          onSave={handleProductSaved}
        />
      )}
    </div>
  );
};

export default GadgetManagement;
