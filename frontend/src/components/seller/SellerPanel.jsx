import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import ThaliOverview from "../../pages/seller/ThaliOverview";
import {
  BarChart3,
  Package,
  ShoppingCart,
  TrendingUp,
  Bell,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  Users,
  Star,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Truck,
  Home,
  Settings,
  LogOut,
  Menu,
  X,
  RefreshCw,
  ArrowUp,
  ArrowDown,
  ChefHat,
} from "lucide-react";

// Redux imports
import {
  useGetDashboardQuery,
  useGetProductsQuery,
  useGetOrdersQuery,
  useGetAnalyticsQuery,
  useGetNotificationsQuery,
  useUpdateOrderStatusMutation,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} from "../storee/api/sellerApi";

import {
  setSidebarOpen,
  setCurrentPage,
  updateFilter,
  setPagination,
  setLoading,
  toggleModal,
} from "../storee/Slices/uiSlice";

import {
  addRealTimeNotification,
  removeRealTimeNotification,
  setConnectionStatus,
} from "../storee/Slices/notificationSlice";

import { logout } from "../../redux/authslice";

// Socket.io for real-time features
import { io } from "socket.io-client";

// Hooks
const useAppDispatch = () => useDispatch();
const useAppSelector = (selector) => useSelector(selector);

// Socket instance
let socket = null;

// Currency formatter
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
};

// Custom hook for socket connection
const useSocket = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  useEffect(() => {
    if (user && !socket) {
      socket = io(process.env.VITE_BACKEND_URL || "http://localhost:5000");

      socket.on("connect", () => {
        dispatch(setConnectionStatus(true));
        socket.emit("join", { userId: user.id, role: user.role });
      });

      socket.on("disconnect", () => {
        dispatch(setConnectionStatus(false));
      });

      socket.on("orderNotification", (data) => {
        dispatch(
          addRealTimeNotification({
            id: Date.now(),
            title: "New Order",
            message: `Order #${data.order.orderNumber} received`,
            timestamp: new Date(),
            type: "order",
          })
        );

        // Show browser notification
        if (Notification.permission === "granted") {
          new Notification("New Order", {
            body: `Order #${data.order.orderNumber} received`,
            icon: "/favicon.ico",
          });
        }
      });

      socket.on("orderStatusUpdate", (data) => {
        dispatch(
          addRealTimeNotification({
            id: Date.now(),
            title: "Order Status Updated",
            message: `Order #${data.orderNumber} status: ${data.status}`,
            timestamp: new Date(),
            type: "order",
          })
        );
      });
    }

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [user, dispatch]);

  return socket;
};

// Dashboard Component
const Dashboard = () => {
  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
  } = useGetDashboardQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">Failed to load dashboard data</p>
        <button
          onClick={refetch}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Today's Revenue
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboardData?.today?.revenue || 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500">12.5%</span>
            <span className="text-gray-500 ml-1">vs yesterday</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Today's Orders
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.today?.orders || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500">8.2%</span>
            <span className="text-gray-500 ml-1">vs yesterday</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Total Products
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.products?.total || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <span className="text-gray-500">
              {dashboardData?.products?.active || 0} active
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Low Stock Items
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {dashboardData?.products?.lowStock || 0}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <span className="text-red-500">Needs attention</span>
          </div>
        </div>
      </div>

      {/* Recent Orders & Notifications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Orders
            </h3>
            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
              View All
            </button>
          </div>
          <div className="space-y-4">
            {dashboardData?.recentOrders?.map((order) => {
              // Debug: Log order data to see college information
              console.log("Order data:", {
                orderNumber: order.orderNumber,
                items: order.items.map((item) => ({
                  name: item.name || item.product?.title,
                  isCollegeBranded: item.isCollegeBranded,
                  collegeName: item.collegeName,
                })),
              });

              return (
                <div
                  key={order._id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      #{order.orderNumber}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.customer.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.items[0]?.product?.title} ×{" "}
                      {order.items[0]?.quantity}
                    </p>
                    {/* College Information */}
                    {order.items[0]?.isCollegeBranded &&
                      order.items[0]?.collegeName && (
                        <div className="mt-1 p-1 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-xs text-blue-800 font-bold flex items-center">
                            <span className="mr-1">🎓</span>
                            College: {order.items[0].collegeName}
                          </p>
                        </div>
                      )}
                    {/* Debug: Always show college info if present */}
                    {(order.items[0]?.isCollegeBranded ||
                      order.items[0]?.collegeName) && (
                      <p className="text-xs text-red-600 font-medium">
                        DEBUG: isCollegeBranded=
                        {order.items[0]?.isCollegeBranded}, collegeName=
                        {order.items[0]?.collegeName}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {formatCurrency(order.items[0]?.price || 0)}
                    </p>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pending
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications
            </h3>
            <Bell className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            {dashboardData?.notifications?.map((notification) => (
              <div
                key={notification._id}
                className="flex items-start space-x-3"
              >
                <div className="p-2 bg-blue-100 rounded-full">
                  <Bell className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <p className="text-sm text-gray-600">
                    {notification.message}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Products Component with Redux
const Products = () => {
  const dispatch = useAppDispatch();
  const { filters, pagination } = useAppSelector((state) => state.ui);
  const productFilters = filters.products;
  const productPagination = pagination.products;

  const {
    data: productsData,
    isLoading,
    error,
    refetch,
  } = useGetProductsQuery({
    page: productPagination.page,
    limit: productPagination.limit,
    status: productFilters.status !== "all" ? productFilters.status : undefined,
    search: productFilters.search || undefined,
  });

  const [deleteProduct] = useDeleteProductMutation();

  const handleFilterChange = (filter, value) => {
    dispatch(updateFilter({ type: "products", filter, value }));
  };

  const handlePageChange = (page) => {
    dispatch(setPagination({ type: "products", page }));
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct(productId).unwrap();
      } catch (error) {
        console.error("Failed to delete product:", error);
      }
    }
  };

  const getStockStatus = (stock) => {
    if (stock === 0)
      return { text: "Out of Stock", class: "bg-red-100 text-red-800" };
    if (stock <= 10)
      return { text: "Low Stock", class: "bg-yellow-100 text-yellow-800" };
    return { text: "In Stock", class: "bg-green-100 text-green-800" };
  };

  const filteredProducts = productsData?.products || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <button
          onClick={() =>
            dispatch(toggleModal({ modal: "productForm", isOpen: true }))
          }
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={productFilters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={productFilters.status}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Products</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="low-stock">Low Stock</option>
            </select>
            <button
              onClick={refetch}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Failed to load products</p>
            <button
              onClick={refetch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => {
                  const stockStatus = getStockStatus(product.stock);
                  return (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 bg-gray-200 rounded-lg mr-4"></div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {product.title}
                            </div>
                            <div className="text-sm text-gray-500">
                              SKU: {product._id.slice(-6)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {product.category?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${stockStatus.class}`}
                        >
                          {product.stock} units
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            product.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {product.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {productsData && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange(productPagination.page - 1)}
                disabled={productPagination.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange(productPagination.page + 1)}
                disabled={productPagination.page >= productsData.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page{" "}
                  <span className="font-medium">{productPagination.page}</span>{" "}
                  of{" "}
                  <span className="font-medium">{productsData.totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange(productPagination.page - 1)}
                    disabled={productPagination.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange(productPagination.page + 1)}
                    disabled={productPagination.page >= productsData.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Orders Component with Redux
const Orders = () => {
  const dispatch = useAppDispatch();
  const { filters, pagination } = useAppSelector((state) => state.ui);
  const orderFilters = filters.orders;
  const orderPagination = pagination.orders;

  const {
    data: ordersData,
    isLoading,
    error,
    refetch,
  } = useGetOrdersQuery({
    page: orderPagination.page,
    limit: orderPagination.limit,
    status: orderFilters.status !== "all" ? orderFilters.status : undefined,
  });

  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  const handleFilterChange = (filter, value) => {
    dispatch(updateFilter({ type: "orders", filter, value }));
  };

  const handlePageChange = (page) => {
    dispatch(setPagination({ type: "orders", page }));
  };

  const handleUpdateOrderStatus = async (orderId, itemId, newStatus) => {
    try {
      await updateOrderStatus({
        orderId,
        itemId,
        status: newStatus,
        trackingNumber:
          newStatus === "shipped" ? "TRK" + Date.now() : undefined,
      }).unwrap();
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-blue-100 text-blue-800",
      processing: "bg-purple-100 text-purple-800",
      shipped: "bg-green-100 text-green-800",
      delivered: "bg-emerald-100 text-emerald-800",
      cancelled: "bg-red-100 text-red-800",
      returned: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  const filteredOrders = ordersData?.orders || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        <div className="flex items-center space-x-4">
          <select
            value={orderFilters.status}
            onChange={(e) => handleFilterChange("status", e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Orders</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={refetch}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600 mb-4">Failed to load orders</p>
            <button
              onClick={refetch}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.customer?.[0]?.name || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.customer?.[0]?.email || "N/A"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.items?.product?.[0]?.title || "N/A"}
                        </div>
                        <div className="text-sm text-gray-500">
                          Qty: {order.items?.quantity || 0}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(order.items?.price || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          order.items?.status
                        )}`}
                      >
                        {order.items?.status || "pending"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {order.items?.status === "pending" && (
                          <button
                            onClick={() =>
                              handleUpdateOrderStatus(
                                order._id,
                                order.items._id,
                                "confirmed"
                              )
                            }
                            className="inline-flex items-center px-2 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Confirm
                          </button>
                        )}
                        {order.items?.status === "confirmed" && (
                          <button
                            onClick={() =>
                              handleUpdateOrderStatus(
                                order._id,
                                order.items._id,
                                "shipped"
                              )
                            }
                            className="inline-flex items-center px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                          >
                            <Truck className="w-3 h-3 mr-1" />
                            Ship
                          </button>
                        )}
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Analytics Component with Redux
const Analytics = () => {
  const dispatch = useAppDispatch();
  const [period, setPeriod] = React.useState("7d");

  const {
    data: analyticsData,
    isLoading,
    error,
    refetch,
  } = useGetAnalyticsQuery({ period });

  const mockChartData = [
    { date: "2024-01-01", revenue: 25000, orders: 12 },
    { date: "2024-01-02", revenue: 32000, orders: 18 },
    { date: "2024-01-03", revenue: 28000, orders: 15 },
    { date: "2024-01-04", revenue: 35000, orders: 22 },
    { date: "2024-01-05", revenue: 29000, orders: 16 },
    { date: "2024-01-06", revenue: 41000, orders: 25 },
    { date: "2024-01-07", revenue: 38000, orders: 21 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <div className="flex items-center space-x-4">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button
            onClick={refetch}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(231000)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500">15.3%</span>
            <span className="text-gray-500 ml-1">vs last period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">129</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500">8.1%</span>
            <span className="text-gray-500 ml-1">vs last period</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                Avg. Order Value
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(1791)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="flex items-center mt-2 text-sm">
            <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-green-500">6.7%</span>
            <span className="text-gray-500 ml-1">vs last period</span>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Revenue Trend
          </h3>
          <div className="h-64 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Chart visualization would go here</p>
              <p className="text-sm">
                Mock data:{" "}
                {mockChartData
                  .reduce((sum, item) => sum + item.revenue, 0)
                  .toLocaleString()}{" "}
                total revenue
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Products
          </h3>
          <div className="space-y-4">
            {[
              { name: "Wireless Headphones", sales: 45, revenue: 112500 },
              { name: "Smartphone Case", sales: 32, revenue: 25600 },
              { name: "Wireless Mouse", sales: 28, revenue: 33600 },
              { name: "USB Cable", sales: 24, revenue: 12000 },
              { name: "Phone Charger", sales: 19, revenue: 19000 },
            ].map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.sales} sales</p>
                </div>
                <p className="font-medium text-gray-900">
                  {formatCurrency(product.revenue)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App Component with Redux
const SellerPanelApp = () => {
  const dispatch = useAppDispatch();
  const { currentPage, sidebarOpen } = useAppSelector((state) => state.ui);
  const { realTimeNotifications } = useAppSelector(
    (state) => state.notifications
  );
  const { user } = useAppSelector((state) => state.auth);

  // Initialize socket connection
  useSocket();

  // Request notification permission on mount
  useEffect(() => {
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const menuItems = [
    { id: "dashboard", name: "Dashboard", icon: Home },
    { id: "products", name: "Products", icon: Package },
    { id: "orders", name: "Orders", icon: ShoppingCart },
    { id: "thali-overview", name: "Thali Overview", icon: ChefHat },
    { id: "analytics", name: "Analytics", icon: BarChart3 },
    { id: "settings", name: "Settings", icon: Settings },
  ];

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "products":
        return <Products />;
      case "orders":
        return <Orders />;
      case "thali-overview":
        return <ThaliOverview />;
      case "analytics":
        return <Analytics />;
      case "settings":
        return <div>Settings Component</div>;
      default:
        return <Dashboard />;
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    // Redirect will be handled by auth state change
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black bg-opacity-50"
          onClick={() => dispatch(setSidebarOpen(false))}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:shadow-none`}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h1 className="text-xl font-bold text-gray-900">Seller Panel</h1>
          <button
            onClick={() => dispatch(setSidebarOpen(false))}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="mt-4 px-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <button
                    onClick={() => dispatch(setCurrentPage(item.id))}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                      currentPage === item.id
                        ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => dispatch(setSidebarOpen(true))}
              className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button className="p-2 rounded-full hover:bg-gray-100 relative">
                  <Bell className="w-5 h-5 text-gray-600" />
                  {realTimeNotifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {realTimeNotifications.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Profile */}
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.name?.charAt(0) || "U"}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {user?.name || "User"}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">{renderPage()}</main>
      </div>

      {/* Live notification toast */}
      {realTimeNotifications.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-white rounded-lg shadow-lg border p-4 max-w-sm">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-green-100 rounded-full">
                <Bell className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">
                  {realTimeNotifications[0]?.title}
                </p>
                <p className="text-sm text-gray-600">
                  {realTimeNotifications[0]?.message}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(
                    realTimeNotifications[0]?.timestamp
                  ).toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() =>
                  dispatch(
                    removeRealTimeNotification(realTimeNotifications[0]?.id)
                  )
                }
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerPanelApp;
