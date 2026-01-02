import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  useGetOrdersQuery,
  useUpdateOrderStatusMutation,
} from "../../redux/api/adminPanelApi";
import {
  FiShoppingCart,
  FiSearch,
  FiCalendar,
  FiEye,
  FiTruck,
  FiCheck,
  FiClock,
  FiX,
  FiChevronLeft,
  FiChevronRight,
  FiUser,
  FiMapPin,
  FiDollarSign,
} from "react-icons/fi";
import moment from "moment";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-32">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

const OrderCard = ({ order, onStatusUpdate }) => {
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusChange = async (status) => {
    setIsUpdating(true);
    try {
      await onStatusUpdate({ orderId: order._id, status });
    } catch (error) {
      console.error("Error updating status:", error);
    }
    setIsUpdating(false);
  };

  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    confirmed: "bg-blue-100 text-blue-800",
    preparing: "bg-orange-100 text-orange-800",
    "out-for-delivery": "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FiClock size={12} />;
      case "confirmed":
        return <FiCheck size={12} />;
      case "preparing":
        return <FiShoppingCart size={12} />;
      case "out-for-delivery":
        return <FiTruck size={12} />;
      case "delivered":
        return <FiCheck size={12} />;
      case "cancelled":
        return <FiX size={12} />;
      default:
        return <FiShoppingCart size={12} />;
    }
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      pending: "confirmed",
      confirmed: "preparing",
      preparing: "out-for-delivery",
      "out-for-delivery": "delivered",
    };
    return statusFlow[currentStatus];
  };

  const formatStatus = (status) => {
    return (
      status?.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
      "Pending"
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">
            Order #{order.orderNumber || order._id?.slice(-8)}
          </h3>
          <p className="text-sm text-gray-600 flex items-center">
            <FiUser size={14} className="mr-1" />
            {order.user?.name || "Unknown Customer"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {moment(order.createdAt).format("MMM DD, YYYY - hh:mm A")}
          </p>
        </div>
        <span
          className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            statusColors[order.status] || statusColors.pending
          }`}
        >
          {getStatusIcon(order.status)}
          <span className="ml-1">{formatStatus(order.status)}</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-600">Total Amount:</span>
          <p className="font-medium">₹{order.totalAmount || 0}</p>
        </div>
        <div>
          <span className="text-gray-600">Items:</span>
          <p className="font-medium">{order.items?.length || 0} items</p>
        </div>
        <div>
          <span className="text-gray-600">Payment:</span>
          <p className="font-medium">{order.paymentStatus || "Pending"}</p>
        </div>
        <div>
          <span className="text-gray-600">Type:</span>
          <p className="font-medium">{order.orderType || "Regular"}</p>
        </div>
      </div>

      {/* Delivery Address */}
      {order.deliveryAddress && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-start">
            <FiMapPin size={14} className="text-gray-500 mr-2 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-gray-900">Delivery Address</p>
              <p className="text-gray-600">
                {order.deliveryAddress.street}, {order.deliveryAddress.city}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Order Items Preview */}
      {order.items && order.items.length > 0 && (
        <div className="mb-4">
          <p className="text-sm font-medium text-gray-700 mb-2">Items:</p>
          <div className="space-y-1">
            {order.items.slice(0, 2).map((item, index) => (
              <div
                key={index}
                className="flex justify-between text-xs text-gray-600"
              >
                <span>
                  {item.name || item.product?.name || "Unknown Item"} x
                  {item.quantity || 1}
                </span>
                <span>₹{item.price || 0}</span>
              </div>
            ))}
            {order.items.length > 2 && (
              <p className="text-xs text-gray-500">
                +{order.items.length - 2} more items
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex space-x-2">
          {order.status !== "delivered" && order.status !== "cancelled" && (
            <>
              {getNextStatus(order.status) && (
                <button
                  onClick={() =>
                    handleStatusChange(getNextStatus(order.status))
                  }
                  disabled={isUpdating}
                  className="flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs hover:bg-blue-200 disabled:opacity-50"
                >
                  {getStatusIcon(getNextStatus(order.status))}
                  <span className="ml-1">
                    {formatStatus(getNextStatus(order.status))}
                  </span>
                </button>
              )}
              <button
                onClick={() => handleStatusChange("cancelled")}
                disabled={isUpdating}
                className="flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs hover:bg-red-200 disabled:opacity-50"
              >
                <FiX size={12} className="mr-1" />
                Cancel
              </button>
            </>
          )}
        </div>
        <Link
          to={`/admin/orders/${order._id}`}
          className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200"
        >
          <FiEye size={12} className="mr-1" />
          View Details
        </Link>
      </div>
    </div>
  );
};

const OrdersManagement = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'table'

  const { data, isLoading, error, refetch } = useGetOrdersQuery({
    page: currentPage,
    limit: 12,
    search,
    status: statusFilter,
    date: dateFilter,
  });
  console.log(data);
  const [updateOrderStatus] = useUpdateOrderStatusMutation();

  const handleStatusUpdate = async ({ orderId, status }) => {
    try {
      await updateOrderStatus({ orderId, status }).unwrap();
      refetch();
    } catch (error) {
      console.error("Failed to update order status:", error);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="text-red-600 mb-4">
          <FiShoppingCart size={48} className="mx-auto mb-2" />
          <p>Error loading orders data</p>
          <button
            onClick={refetch}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const orders = data?.data?.orders || [];
  const totalPages = data?.data?.pagination?.totalPages || 1;
  const totalOrders = data?.data?.pagination?.totalOrders || 0;
  const orderStats = data?.data?.stats || {};

  const formatStatus = (status) => {
    return (
      status?.replace(/-/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) ||
      "Pending"
    );
  };

  return (
    <div className="p-4 mt:35 md:mt-40 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
            Orders Management
          </h1>
          <p className="text-gray-600">
            Manage and track all customer orders ({totalOrders} total)
          </p>
        </div>
        <div className="flex items-center space-x-2 mt-4 md:mt-0">
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "table" : "grid")}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            {viewMode === "grid" ? "Table View" : "Grid View"}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {orderStats && Object.keys(orderStats).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-md border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Orders</p>
                <p className="text-2xl font-bold text-blue-600">
                  {orderStats.todayOrders || 0}
                </p>
              </div>
              <FiShoppingCart className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {orderStats.pending || 0}
                </p>
              </div>
              <FiClock className="text-yellow-600" size={24} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Out for Delivery</p>
                <p className="text-2xl font-bold text-purple-600">
                  {orderStats.outForDelivery || 0}
                </p>
              </div>
              <FiTruck className="text-purple-600" size={24} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-green-600">
                  {orderStats.delivered || 0}
                </p>
              </div>
              <FiCheck className="text-green-600" size={24} />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <FiSearch
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search orders, customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="out-for-delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
              setDateFilter("");
              setCurrentPage(1);
            }}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {console.log(orders)}{" "}
          {orders.map((order) => (
            <OrderCard
              key={order._id}
              order={order}
              onStatusUpdate={handleStatusUpdate}
            />
          ))}
        </div>
      ) : (
        // Table View
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        #{order.orderNumber || order._id?.slice(-8)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.items?.length || 0} items
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.user?.name || "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.user?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{order.totalAmount || 0}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.paymentStatus || "Pending"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === "delivered"
                            ? "bg-green-100 text-green-800"
                            : order.status === "out-for-delivery"
                            ? "bg-purple-100 text-purple-800"
                            : order.status === "preparing"
                            ? "bg-orange-100 text-orange-800"
                            : order.status === "confirmed"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "cancelled"
                            ? "bg-red-100 text-red-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {formatStatus(order.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {moment(order.createdAt).format("MMM DD, YYYY")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link
                        to={`/admin/orders/${order._id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between bg-white px-6 py-3 rounded-lg shadow-md">
        <div className="text-sm text-gray-700">
          Showing page {currentPage} of {totalPages}
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <FiChevronLeft size={16} className="mr-1" />
            Previous
          </button>
          <button
            onClick={() =>
              setCurrentPage(Math.min(totalPages, currentPage + 1))
            }
            disabled={currentPage === totalPages}
            className="flex items-center px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            Next
            <FiChevronRight size={16} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrdersManagement;
