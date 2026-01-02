import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  Package,
  TrendingUp,
  Users,
  DollarSign,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useGetDailyOrdersQuery } from "../../redux/api/adminPanelApi";

const DailyOrders = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [statusFilter, setStatusFilter] = useState("all");
  const [mealTypeFilter, setMealTypeFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 20;

  // RTK Query hook for daily orders
  const {
    data: ordersData,
    isLoading,
    error,
    refetch,
  } = useGetDailyOrdersQuery({
    date: selectedDate,
    status: statusFilter !== "all" ? statusFilter : undefined,
    mealType: mealTypeFilter !== "all" ? mealTypeFilter : undefined,
    page: currentPage,
    limit: ordersPerPage,
  });

  // Sample data structure
  const sampleData = {
    summary: {
      totalOrders: 156,
      completedOrders: 134,
      pendingOrders: 18,
      cancelledOrders: 4,
      totalRevenue: 8450.5,
      averageOrderValue: 54.17,
    },
    orders: [
      {
        id: "ORD-001",
        customerName: "John Doe",
        customerPhone: "+91 9876543210",
        mealType: "lunch",
        items: ["Dal Rice", "Sabzi", "Roti"],
        quantity: 2,
        amount: 120.0,
        status: "completed",
        orderTime: "12:30 PM",
        deliveryTime: "01:15 PM",
        address: "123 MG Road, Bangalore",
        paymentMethod: "online",
      },
      {
        id: "ORD-002",
        customerName: "Jane Smith",
        customerPhone: "+91 9876543211",
        mealType: "dinner",
        items: ["Paneer Curry", "Naan", "Rice"],
        quantity: 1,
        amount: 85.0,
        status: "pending",
        orderTime: "07:45 PM",
        deliveryTime: "08:30 PM",
        address: "456 Brigade Road, Bangalore",
        paymentMethod: "cod",
      },
    ],
    pagination: {
      totalPages: 8,
      currentPage: 1,
      hasNext: true,
      hasPrev: false,
    },
  };

  const data = ordersData || sampleData;

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      case "preparing":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "cancelled":
        return <XCircle className="w-4 h-4" />;
      case "preparing":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getMealTypeColor = (mealType) => {
    switch (mealType) {
      case "breakfast":
        return "bg-orange-100 text-orange-800";
      case "lunch":
        return "bg-green-100 text-green-800";
      case "dinner":
        return "bg-purple-100 text-purple-800";
      case "snacks":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const StatCard = ({ title, value, icon: Icon, color = "blue" }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-lg bg-${color}-50`}>
          <Icon className={`w-6 h-6 text-${color}-600`} />
        </div>
      </div>
    </div>
  );

  const OrderCard = ({ order }) => (
    <div className="bg-white rounded-lg border shadow-sm p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <h3 className="font-semibold text-gray-900">
              {order.customerName}
            </h3>
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                order.status
              )}`}
            >
              {getStatusIcon(order.status)}
              <span className="ml-1 capitalize">{order.status}</span>
            </span>
          </div>
          <p className="text-sm text-gray-600">Order ID: {order.id}</p>
          <p className="text-sm text-gray-600">{order.customerPhone}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
            ₹{order.amount.toFixed(2)}
          </p>
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getMealTypeColor(
              order.mealType
            )}`}
          >
            {order.mealType}
          </span>
        </div>
      </div>

      <div className="mb-3">
        <p className="text-sm text-gray-700 font-medium mb-1">Items:</p>
        <p className="text-sm text-gray-600">
          {order.items.join(", ")} (Qty: {order.quantity})
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
        <div>
          <p className="text-gray-500">Order Time</p>
          <p className="text-gray-900 font-medium">{order.orderTime}</p>
        </div>
        <div>
          <p className="text-gray-500">Delivery Time</p>
          <p className="text-gray-900 font-medium">{order.deliveryTime}</p>
        </div>
      </div>

      <div className="border-t pt-3">
        <p className="text-sm text-gray-500 mb-1">Delivery Address</p>
        <p className="text-sm text-gray-700">{order.address}</p>
        <div className="flex items-center justify-between mt-2">
          <span
            className={`px-2 py-1 rounded text-xs font-medium ${
              order.paymentMethod === "online"
                ? "bg-green-100 text-green-800"
                : "bg-orange-100 text-orange-800"
            }`}
          >
            {order.paymentMethod === "online"
              ? "Paid Online"
              : "Cash on Delivery"}
          </span>
          <button className="text-blue-600 hover:text-blue-800 p-1 rounded">
            <Eye className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  const filteredOrders =
    data.orders?.filter(
      (order) =>
        order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.customerPhone.includes(searchQuery)
    ) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-500 mb-4">Failed to load daily orders</p>
          <button
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Daily Orders</h1>
            <p className="text-gray-600 mt-1">
              Manage and track today's meal orders
            </p>
          </div>
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
        <StatCard
          title="Total Orders"
          value={data.summary.totalOrders}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Completed"
          value={data.summary.completedOrders}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="Pending"
          value={data.summary.pendingOrders}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Cancelled"
          value={data.summary.cancelledOrders}
          icon={XCircle}
          color="red"
        />
        <StatCard
          title="Revenue"
          value={`₹${data.summary.totalRevenue.toFixed(0)}`}
          icon={DollarSign}
          color="green"
        />
        <StatCard
          title="Avg Order"
          value={`₹${data.summary.averageOrderValue.toFixed(0)}`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="preparing">Preparing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={mealTypeFilter}
            onChange={(e) => setMealTypeFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Meal Types</option>
            <option value="breakfast">Breakfast</option>
            <option value="lunch">Lunch</option>
            <option value="dinner">Dinner</option>
            <option value="snacks">Snacks</option>
          </select>

          <button className="flex items-center justify-center space-x-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4" />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Orders Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {filteredOrders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </div>

      {/* Pagination */}
      {data.pagination && (
        <div className="flex items-center justify-between bg-white rounded-lg border shadow-sm p-4">
          <div className="text-sm text-gray-600">
            Showing {(currentPage - 1) * ordersPerPage + 1} to{" "}
            {Math.min(currentPage * ordersPerPage, data.summary.totalOrders)} of{" "}
            {data.summary.totalOrders} orders
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={!data.pagination.hasPrev}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm bg-blue-600 text-white rounded">
              {currentPage}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={!data.pagination.hasNext}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyOrders;
