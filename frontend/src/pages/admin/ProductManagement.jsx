import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  useGetProductsQuery,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useCreateProductMutation,
} from "../../redux/api/adminPanelApi";
import {
  FiPackage,
  FiSearch,
  FiFilter,
  FiEye,
  FiEdit3,
  FiTrash2,
  FiPlus,
  FiMoreVertical,
  FiDollarSign,
  FiImage,
  FiChevronLeft,
  FiChevronRight,
  FiStar,
} from "react-icons/fi";
import moment from "moment";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-32">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const ProductCard = ({ product, onEdit, onDelete }) => {
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setIsDeleting(true);
      try {
        await onDelete(product._id);
      } catch (error) {
        console.error("Error deleting product:", error);
      }
      setIsDeleting(false);
    }
  };

  const getStockStatus = (stock) => {
    if (stock === 0)
      return { color: "bg-red-100 text-red-800", text: "Out of Stock" };
    if (stock < 10)
      return { color: "bg-yellow-100 text-yellow-800", text: "Low Stock" };
    return { color: "bg-green-100 text-green-800", text: "In Stock" };
  };

  const stockStatus = getStockStatus(product.stock || 0);

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 overflow-hidden">
      {/* Product Image */}
      <div className="relative h-48 bg-gray-200">
        {product.images && product.images.length > 0 ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <FiImage className="w-12 h-12 text-gray-400" />
          </div>
        )}
        <div
          className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs ${stockStatus.color}`}
        >
          {stockStatus.text}
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2">
            {product.name}
          </h3>
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-1 rounded-md hover:bg-gray-100"
            >
              <FiMoreVertical className="w-4 h-4" />
            </button>
            {showActions && (
              <div className="absolute right-0 mt-1 w-48 bg-white border rounded-md shadow-lg z-10">
                <Link
                  to={`/admin/products/${product._id}`}
                  className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-50"
                >
                  <FiEye className="w-4 h-4" />
                  <span>View Details</span>
                </Link>
                <button
                  onClick={() => onEdit(product)}
                  className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-gray-50"
                >
                  <FiEdit3 className="w-4 h-4" />
                  <span>Edit Product</span>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-red-50 text-red-600"
                >
                  <FiTrash2 className="w-4 h-4" />
                  <span>{isDeleting ? "Deleting..." : "Delete"}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-green-600">
              ₹{product.price}
            </span>
            <div className="flex items-center space-x-1">
              <FiStar className="w-4 h-4 text-yellow-500" />
              <span className="text-sm text-gray-600">
                {product.rating || "4.5"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>Stock: {product.stock || 0}</span>
            <span>Category: {product.category}</span>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>SKU: {product.sku || "N/A"}</span>
            <span>
              Added: {moment(product.createdAt).format("MMM DD, YYYY")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const {
    data: productsData,
    isLoading,
    error,
    refetch,
  } = useGetProductsQuery({
    page: currentPage,
    limit: 12,
    search: searchTerm,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    status: statusFilter !== "all" ? statusFilter : undefined,
  });

  const [updateProduct] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [createProduct] = useCreateProductMutation();

  const products = productsData?.data?.products || [];
  const totalProducts = productsData?.data?.totalProducts || 0;
  const totalPages = Math.ceil(totalProducts / 12);

  const categories = [
    "all",
    "Tiffin",
    "Grocery",
    "Sweets",
    "Beverages",
    "Snacks",
    "Others",
  ];

  const handleEdit = (product) => {
    // Implement edit functionality
    console.log("Edit product:", product);
  };

  const handleDelete = async (productId) => {
    try {
      await deleteProduct(productId).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to delete product:", error);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && product.isActive) ||
      (statusFilter === "inactive" && !product.isActive);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Product Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your product inventory and listings
          </p>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 lg:p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-red-800 mb-2">
            Error Loading Products
          </h2>
          <p className="text-red-600 mb-4">
            {error?.data?.message ||
              "Failed to load products. Please try again."}
          </p>
          <button
            onClick={() => refetch()}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Product Management
          </h1>
          <p className="text-gray-600 mt-1">
            {totalProducts} products • {filteredProducts.length} showing
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="mt-4 lg:mt-0 flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === "all" ? "All Categories" : category}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Filter Button */}
          <button className="flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-200">
            <FiFilter className="w-4 h-4" />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="flex items-center space-x-1 px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="flex items-center space-x-1 px-3 py-2 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span>Next</span>
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <FiPackage className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No products found
          </h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || categoryFilter !== "all" || statusFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Get started by adding your first product."}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Add Product
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
