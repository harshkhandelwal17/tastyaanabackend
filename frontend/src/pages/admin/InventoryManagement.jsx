import React, { useState } from "react";
import {
  useGetInventoryQuery,
  useUpdateInventoryMutation,
  useBulkUpdateInventoryMutation,
} from "../../redux/api/adminPanelApi";
import {
  FiPackage,
  FiSearch,
  FiFilter,
  FiEdit3,
  FiSave,
  FiX,
  FiPlus,
  FiMinus,
  FiAlertTriangle,
  FiTrendingUp,
  FiTrendingDown,
  FiBarChart3,
  FiDownload,
  FiUpload,
} from "react-icons/fi";
import moment from "moment";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-32">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const StockLevelIndicator = ({ current, minimum = 10, maximum = 100 }) => {
  let status = "normal";
  let color = "bg-green-500";

  if (current === 0) {
    status = "out";
    color = "bg-red-500";
  } else if (current <= minimum) {
    status = "low";
    color = "bg-yellow-500";
  } else if (current >= maximum) {
    status = "high";
    color = "bg-blue-500";
  }

  const percentage = Math.min((current / maximum) * 100, 100);

  return (
    <div className="flex items-center space-x-2">
      <div className="w-20 bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <span
        className={`text-xs font-medium ${
          status === "out"
            ? "text-red-600"
            : status === "low"
            ? "text-yellow-600"
            : status === "high"
            ? "text-blue-600"
            : "text-green-600"
        }`}
      >
        {current}/{maximum}
      </span>
    </div>
  );
};

const InventoryRow = ({ item, onUpdate, isUpdating }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [stockValue, setStockValue] = useState(item.currentStock);

  const handleSave = async () => {
    try {
      await onUpdate(item._id, { currentStock: stockValue });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update stock:", error);
      setStockValue(item.currentStock); // Reset on error
    }
  };

  const handleCancel = () => {
    setStockValue(item.currentStock);
    setIsEditing(false);
  };

  const getStockStatus = () => {
    if (item.currentStock === 0)
      return { text: "Out of Stock", color: "text-red-600 bg-red-50" };
    if (item.currentStock <= item.minimumStock)
      return { text: "Low Stock", color: "text-yellow-600 bg-yellow-50" };
    if (item.currentStock >= item.maximumStock)
      return { text: "Overstocked", color: "text-blue-600 bg-blue-50" };
    return { text: "In Stock", color: "text-green-600 bg-green-50" };
  };

  const stockStatus = getStockStatus();

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50">
      {/* Product Info */}
      <td className="py-4 px-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
            {item.product?.image ? (
              <img
                src={item.product.image}
                alt={item.product.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <FiPackage className="w-5 h-5 text-gray-500" />
            )}
          </div>
          <div>
            <div className="font-medium text-gray-900">
              {item.product?.name || item.productName}
            </div>
            <div className="text-sm text-gray-500">SKU: {item.sku}</div>
          </div>
        </div>
      </td>

      {/* Category */}
      <td className="py-4 px-4">
        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
          {item.product?.category || item.category}
        </span>
      </td>

      {/* Current Stock */}
      <td className="py-4 px-4">
        {isEditing ? (
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={stockValue}
              onChange={(e) => setStockValue(parseInt(e.target.value) || 0)}
              className="w-20 px-2 py-1 border border-gray-300 rounded text-center"
              min="0"
            />
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="p-1 text-green-600 hover:bg-green-50 rounded"
            >
              <FiSave className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              className="p-1 text-gray-600 hover:bg-gray-50 rounded"
            >
              <FiX className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <span className="font-medium">{item.currentStock}</span>
            <button
              onClick={() => setIsEditing(true)}
              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            >
              <FiEdit3 className="w-4 h-4" />
            </button>
          </div>
        )}
      </td>

      {/* Stock Level */}
      <td className="py-4 px-4">
        <StockLevelIndicator
          current={item.currentStock}
          minimum={item.minimumStock}
          maximum={item.maximumStock}
        />
      </td>

      {/* Status */}
      <td className="py-4 px-4">
        <span className={`px-2 py-1 rounded-full text-xs ${stockStatus.color}`}>
          {stockStatus.text}
        </span>
      </td>

      {/* Last Updated */}
      <td className="py-4 px-4 text-sm text-gray-500">
        {moment(item.lastUpdated || item.updatedAt).format("MMM DD, YYYY")}
      </td>

      {/* Value */}
      <td className="py-4 px-4 font-medium">
        ₹
        {(
          (item.currentStock || 0) *
          (item.product?.price || item.unitPrice || 0)
        ).toLocaleString()}
      </td>
    </tr>
  );
};

const InventoryManagement = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");

  const {
    data: inventoryData,
    isLoading,
    error,
    refetch,
  } = useGetInventoryQuery({
    search: searchTerm,
    status: statusFilter !== "all" ? statusFilter : undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
    sortBy,
    sortOrder,
  });

  const [updateInventory, { isLoading: isUpdating }] =
    useUpdateInventoryMutation();
  const [bulkUpdateInventory] = useBulkUpdateInventoryMutation();

  const inventoryItems = inventoryData?.data?.items || [];
  const stats = inventoryData?.data?.stats || {};

  const handleStockUpdate = async (itemId, updateData) => {
    try {
      await updateInventory({ id: itemId, ...updateData }).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to update inventory:", error);
    }
  };

  const handleBulkExport = () => {
    // Export inventory data as CSV
    const csvData = inventoryItems.map((item) => ({
      SKU: item.sku,
      Name: item.product?.name || item.productName,
      Category: item.product?.category || item.category,
      CurrentStock: item.currentStock,
      MinimumStock: item.minimumStock,
      MaximumStock: item.maximumStock,
      UnitPrice: item.product?.price || item.unitPrice,
      TotalValue:
        item.currentStock * (item.product?.price || item.unitPrice || 0),
      LastUpdated: moment(item.lastUpdated || item.updatedAt).format(
        "YYYY-MM-DD"
      ),
    }));

    const csvString = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-${moment().format("YYYY-MM-DD")}.csv`;
    a.click();
  };

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch =
      (item.product?.name || item.productName || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (item.sku || "").toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = true;
    if (statusFilter === "low") {
      matchesStatus = item.currentStock <= item.minimumStock;
    } else if (statusFilter === "out") {
      matchesStatus = item.currentStock === 0;
    } else if (statusFilter === "overstocked") {
      matchesStatus = item.currentStock >= item.maximumStock;
    }

    const matchesCategory =
      categoryFilter === "all" ||
      (item.product?.category || item.category) === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = [
    ...new Set(
      inventoryItems
        .map((item) => item.product?.category || item.category)
        .filter(Boolean)
    ),
  ];

  if (isLoading) {
    return (
      <div className="p-4 lg:p-6">
        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">
            Inventory Management
          </h1>
          <p className="text-gray-600 mt-1">
            Monitor and manage your product inventory
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
            Error Loading Inventory
          </h2>
          <p className="text-red-600 mb-4">
            {error?.data?.message ||
              "Failed to load inventory. Please try again."}
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
            Inventory Management
          </h1>
          <p className="text-gray-600 mt-1">
            {inventoryItems.length} items • {filteredItems.length} showing
          </p>
        </div>
        <div className="flex space-x-3 mt-4 lg:mt-0">
          <button
            onClick={handleBulkExport}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <FiDownload className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <FiUpload className="w-4 h-4" />
            <span>Import</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <FiPackage className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Items</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalItems || inventoryItems.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <FiAlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Low Stock</h3>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.lowStockItems ||
                  inventoryItems.filter(
                    (item) => item.currentStock <= item.minimumStock
                  ).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <FiTrendingDown className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">
                Out of Stock
              </h3>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.outOfStockItems ||
                  inventoryItems.filter((item) => item.currentStock === 0)
                    .length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <FiTrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-sm font-medium text-gray-500">Total Value</h3>
              <p className="text-2xl font-semibold text-gray-900">
                ₹
                {(
                  stats.totalValue ||
                  inventoryItems.reduce(
                    (sum, item) =>
                      sum +
                      item.currentStock *
                        (item.product?.price || item.unitPrice || 0),
                    0
                  )
                ).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search products or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="low">Low Stock</option>
            <option value="out">Out of Stock</option>
            <option value="overstocked">Overstocked</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split("-");
              setSortBy(field);
              setSortOrder(order);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
            <option value="stock-asc">Stock (Low to High)</option>
            <option value="stock-desc">Stock (High to Low)</option>
            <option value="value-desc">Value (High to Low)</option>
          </select>
        </div>
      </div>

      {/* Inventory Table */}
      {filteredItems.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Stock
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Level
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Updated
                  </th>
                  <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <InventoryRow
                    key={item._id}
                    item={item}
                    onUpdate={handleStockUpdate}
                    isUpdating={isUpdating}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <FiBarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No inventory items found
          </h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
              ? "Try adjusting your search or filters."
              : "Your inventory appears to be empty."}
          </p>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;
