
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Eye, 
  Edit3, 
  Calendar, 
  User, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  Package,
  DollarSign,
  Star,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Download
} from 'lucide-react';

const OrdersManagement = () => {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    paymentStatus: 'all',
    type: 'all',
    dateRange: 'all',
    search: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showFilters, setShowFilters] = useState(false);

  // Mock data based on your schema
  const mockOrders = [
    {
      _id: '1',
      orderNumber: 'GKK000001',
      userId: { _id: 'u1', name: 'John Doe', phone: '9876543210' },
      restaurantId: { _id: 'r1', name: 'Spice Palace' },
      type: 'gkk',
      items: [
        {
          name: 'Butter Chicken',
          quantity: 2,
          price: 299,
          category: 'Main Course',
          customizations: ['Extra Spicy', 'No Onion']
        },
        {
          name: 'Naan',
          quantity: 4,
          price: 40,
          category: 'Bread'
        }
      ],
      status: 'confirmed',
      paymentStatus: 'paid',
      paymentMethod: 'razorpay',
      totalAmount: 678,
      subtotal: 598,
      discountAmount: 0,
      taxes: { gst: 60, deliveryCharges: 20, packagingCharges: 0 },
      deliveryAddress: {
        street: '123 MG Road',
        city: 'Indore',
        state: 'MP',
        pincode: '452001'
      },
      deliveryDate: new Date('2025-09-10'),
      deliverySlot: 'lunch',
      createdAt: new Date('2025-09-09T10:30:00'),
      preparationDeadline: new Date('2025-09-09T11:00:00'),
      isDelayed: false,
      rating: { overall: 4, food: 4, delivery: 5, comment: 'Great food!' }
    },
    {
      _id: '2',
      orderNumber: 'ORD000002',
      userId: { _id: 'u2', name: 'Jane Smith', phone: '9876543211' },
      restaurantId: { _id: 'r2', name: 'Pizza Corner' },
      type: 'custom',
      items: [
        {
          name: 'Margherita Pizza',
          quantity: 1,
          price: 450,
          category: 'Pizza'
        }
      ],
      status: 'out-for-delivery',
      paymentStatus: 'paid',
      paymentMethod: 'wallet',
      totalAmount: 495,
      subtotal: 450,
      discountAmount: 0,
      taxes: { gst: 45, deliveryCharges: 0, packagingCharges: 0 },
      deliveryAddress: {
        street: '456 Vijay Nagar',
        city: 'Indore',
        state: 'MP',
        pincode: '452010'
      },
      deliveryPartner: { _id: 'dp1', name: 'Rahul Kumar', phone: '9876543212' },
      deliveryDate: new Date('2025-09-09'),
      deliverySlot: 'dinner',
      createdAt: new Date('2025-09-09T18:15:00'),
      isDelayed: false
    },
    {
      _id: '3',
      orderNumber: 'GKK000003',
      userId: { _id: 'u3', name: 'Mike Johnson', phone: '9876543213' },
      restaurantId: { _id: 'r1', name: 'Spice Palace' },
      type: 'gkk',
      items: [
        {
          name: 'Dal Tadka',
          quantity: 1,
          price: 149,
          category: 'Dal'
        }
      ],
      status: 'cancelled',
      paymentStatus: 'refunded',
      paymentMethod: 'razorpay',
      totalAmount: 169,
      subtotal: 149,
      discountAmount: 0,
      taxes: { gst: 15, deliveryCharges: 5, packagingCharges: 0 },
      deliveryAddress: {
        street: '789 Palasia',
        city: 'Indore',
        state: 'MP',
        pincode: '452001'
      },
      createdAt: new Date('2025-09-08T14:20:00'),
      cancelledAt: new Date('2025-09-08T14:45:00'),
      cancellationReason: 'User requested cancellation'
    }
  ];

  useEffect(() => {
    // Simulate API call
    setOrders(mockOrders);
    setFilteredOrders(mockOrders);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filters, orders]);

  const applyFilters = () => {
    let filtered = orders;

    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    if (filters.paymentStatus !== 'all') {
      filtered = filtered.filter(order => order.paymentStatus === filters.paymentStatus);
    }

    if (filters.type !== 'all') {
      filtered = filtered.filter(order => order.type === filters.type);
    }

    if (filters.search) {
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.userId.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.restaurantId?.name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.dateRange !== 'all') {
      const today = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(order => new Date(order.createdAt) >= filterDate);
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          filtered = filtered.filter(order => new Date(order.createdAt) >= filterDate);
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(order => new Date(order.createdAt) >= filterDate);
          break;
      }
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'pending': { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
      'confirmed': { color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
      'preparing': { color: 'bg-orange-100 text-orange-800', icon: Package },
      'ready': { color: 'bg-purple-100 text-purple-800', icon: Package },
      'assigned': { color: 'bg-teal-100 text-teal-800', icon: User },
      'out-for-delivery': { color: 'bg-indigo-100 text-indigo-800', icon: Truck },
      'delivered': { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      'cancelled': { color: 'bg-red-100 text-red-800', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig['pending'];
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
      </span>
    );
  };

  const getPaymentStatusBadge = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'paid': 'bg-green-100 text-green-800',
      'failed': 'bg-red-100 text-red-800',
      'refunded': 'bg-gray-100 text-gray-800',
      'completed': 'bg-green-100 text-green-800'
    };

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status] || colors['pending']}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPreviousStatusOptions = (currentStatus) => {
    const statusFlow = {
      'confirmed': [{ value: 'pending', label: 'Pending' }],
      'preparing': [
        { value: 'pending', label: 'Pending' },
        { value: 'confirmed', label: 'Confirmed' }
      ],
      'ready': [
        { value: 'confirmed', label: 'Confirmed' },
        { value: 'preparing', label: 'Preparing' }
      ],
      'assigned': [
        { value: 'ready', label: 'Ready' },
        { value: 'preparing', label: 'Preparing' }
      ],
      'out-for-delivery': [
        { value: 'assigned', label: 'Assigned' },
        { value: 'ready', label: 'Ready' }
      ]
    };

    return statusFlow[currentStatus] || [];
  };

  const handleStatusChange = (orderId, newStatus) => {
    setOrders(prevOrders => 
      prevOrders.map(order => 
        order._id === orderId 
          ? { ...order, status: newStatus }
          : order
      )
    );

    if (selectedOrder && selectedOrder._id === orderId) {
      setSelectedOrder(prev => ({ ...prev, status: newStatus }));
    }
  };

  const assignDeliveryPartner = (orderId, partnerId) => {
    const partners = {
      'dp1': { _id: 'dp1', name: 'Rahul Kumar', phone: '9876543212' },
      'dp2': { _id: 'dp2', name: 'Amit Singh', phone: '9876543213' },
      'dp3': { _id: 'dp3', name: 'Priya Sharma', phone: '9876543214' }
    };

    setOrders(prevOrders => 
      prevOrders.map(order => 
        order._id === orderId 
          ? { 
              ...order, 
              status: 'assigned',
              deliveryPartner: partners[partnerId]
            }
          : order
      )
    );

    if (selectedOrder && selectedOrder._id === orderId) {
      setSelectedOrder(prev => ({ 
        ...prev, 
        status: 'assigned',
        deliveryPartner: partners[partnerId]
      }));
    }
  };

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Orders Management</h1>
              <p className="mt-2 text-gray-600">Manage and track all restaurant orders</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <button className="inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                <Download className="w-4 h-4 mr-2" />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by order ID, customer, or restaurant..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {showFilters ? <ChevronDown className="w-4 h-4 ml-2" /> : <ChevronRight className="w-4 h-4 ml-2" />}
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="preparing">Preparing</option>
                  <option value="ready">Ready</option>
                  <option value="assigned">Assigned</option>
                  <option value="out-for-delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Status</label>
                <select
                  value={filters.paymentStatus}
                  onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Payments</option>
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Types</option>
                  <option value="gkk">GKK</option>
                  <option value="custom">Custom</option>
                  <option value="addon">Add-on</option>
                  <option value="sunday-special">Sunday Special</option>
                  <option value="product">Product</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Orders ({filteredOrders.length})
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Restaurant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
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
                {paginatedOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.type.toUpperCase()} • {order.items.length} items
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-orange-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {order.userId.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.userId.phone}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {order.restaurantId?.name || 'Direct Order'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.status)}
                      {order.isDelayed && (
                        <div className="mt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Delayed
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        {getPaymentStatusBadge(order.paymentStatus)}
                        <div className="text-xs text-gray-500 mt-1">
                          {order.paymentMethod}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        ₹{order.totalAmount}
                      </div>
                      <div className="text-xs text-gray-500">
                        Subtotal: ₹{order.subtotal}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-IN')}
                      <br />
                      {new Date(order.createdAt).toLocaleTimeString('en-IN', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderDetail(true);
                        }}
                        className="text-orange-600 hover:text-orange-900 mr-3"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredOrders.length)} of {filteredOrders.length} results
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 border rounded-md ${
                        currentPage === page
                          ? 'bg-orange-600 text-white border-orange-600'
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order Detail Modal */}
        {showOrderDetail && selectedOrder && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 p-4">
            <div className="relative top-4 lg:top-20 mx-auto p-0 border w-full max-w-6xl shadow-lg rounded-md bg-white min-h-0 max-h-full overflow-hidden">
              <div className="sticky top-0 bg-white border-b px-4 lg:px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl lg:text-2xl font-bold text-gray-900">
                  Order Details - {selectedOrder.orderNumber}
                </h3>
                <button
                  onClick={() => setShowOrderDetail(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="p-4 lg:p-6 overflow-y-auto max-h-[calc(100vh-8rem)]">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6">
                  {/* Left Column */}
                  <div className="space-y-4 lg:space-y-6">
                    {/* Order Info */}
                    <div className="bg-gray-50 p-3 lg:p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Order Information</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex flex-col sm:flex-row sm:justify-between">
                          <span className="text-gray-600 font-medium">Order Number:</span>
                          <span className="font-semibold">{selectedOrder.orderNumber}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between">
                          <span className="text-gray-600 font-medium">Type:</span>
                          <span className="font-semibold">{selectedOrder.type.toUpperCase()}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
                          <span className="text-gray-600 font-medium">Status:</span>
                          <div className="mt-1 sm:mt-0">
                            {getStatusBadge(selectedOrder.status)}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center">
                          <span className="text-gray-600 font-medium">Payment:</span>
                          <div className="mt-1 sm:mt-0">
                            {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                          </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between">
                          <span className="text-gray-600 font-medium">Date:</span>
                          <span className="font-semibold text-xs sm:text-sm">
                            {new Date(selectedOrder.createdAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>


                    {/* Customer Info */}
                    <div className="bg-gray-50 p-3 lg:p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Customer Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex flex-col sm:flex-row sm:justify-between">
                          <span className="text-gray-600 font-medium">Name:</span>
                          <span className="font-semibold">{selectedOrder.userId.name}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:justify-between">
                          <span className="text-gray-600 font-medium">Phone:</span>
                          <a href={`tel:${selectedOrder.userId.phone}`} className="font-semibold text-orange-600 hover:text-orange-800">
                            {selectedOrder.userId.phone}
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="bg-gray-50 p-3 lg:p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        Delivery Address
                      </h4>
                      <div className="text-sm text-gray-700 space-y-1">
                        <div>{selectedOrder.deliveryAddress.street}</div>
                        <div>{selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state}</div>
                        <div>PIN: {selectedOrder.deliveryAddress.pincode}</div>
                      </div>
                      {selectedOrder.deliverySlot && (
                        <div className="mt-3 flex flex-col sm:flex-row sm:justify-between text-sm">
                          <span className="text-gray-600 font-medium">Delivery Slot:</span>
                          <span className="font-semibold capitalize">{selectedOrder.deliverySlot}</span>
                        </div>
                      )}
                    </div>

                    {/* Delivery Partner */}
                    {selectedOrder.deliveryPartner && (
                      <div className="bg-gray-50 p-3 lg:p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <Truck className="w-4 h-4 mr-2" />
                          Delivery Partner
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex flex-col sm:flex-row sm:justify-between">
                            <span className="text-gray-600 font-medium">Name:</span>
                            <span className="font-semibold">{selectedOrder.deliveryPartner.name}</span>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between">
                            <span className="text-gray-600 font-medium">Phone:</span>
                            <a href={`tel:${selectedOrder.deliveryPartner.phone}`} className="font-semibold text-orange-600 hover:text-orange-800">
                              {selectedOrder.deliveryPartner.phone}
                            </a>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status Change - Mobile Priority */}
                    <div className="xl:hidden bg-white border-2 border-orange-200 p-3 lg:p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <Edit3 className="w-4 h-4 mr-2" />
                        Quick Actions
                      </h4>
                      <div className="space-y-3">
                        {/* Status Change Dropdown */}
                        {!['delivered', 'cancelled'].includes(selectedOrder.status) && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Change Status
                            </label>
                            <select
                              value={selectedOrder.status}
                              onChange={(e) => handleStatusChange(selectedOrder._id, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="preparing">Preparing</option>
                              <option value="ready">Ready</option>
                              <option value="assigned">Assigned</option>
                              <option value="out-for-delivery">Out for Delivery</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        )}

                        {/* Quick Action Buttons */}
                        {!['delivered', 'cancelled'].includes(selectedOrder.status) && (
                          <div className="grid grid-cols-2 gap-2">
                            {selectedOrder.status === 'pending' && (
                              <button
                                onClick={() => handleStatusChange(selectedOrder._id, 'confirmed')}
                                className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                              >
                                Confirm
                              </button>
                            )}
                            {selectedOrder.status === 'confirmed' && (
                              <button
                                onClick={() => handleStatusChange(selectedOrder._id, 'preparing')}
                                className="px-3 py-2 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition-colors"
                              >
                                Start Preparing
                              </button>
                            )}
                            {selectedOrder.status === 'preparing' && (
                              <button
                                onClick={() => handleStatusChange(selectedOrder._id, 'ready')}
                                className="px-3 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
                              >
                                Mark Ready
                              </button>
                            )}
                            {selectedOrder.status === 'ready' && (
                              <button
                                onClick={() => handleStatusChange(selectedOrder._id, 'out-for-delivery')}
                                className="px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
                              >
                                Out for Delivery
                              </button>
                            )}
                            {selectedOrder.status === 'out-for-delivery' && (
                              <button
                                onClick={() => handleStatusChange(selectedOrder._id, 'delivered')}
                                className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                              >
                                Mark Delivered
                              </button>
                            )}
                            <button
                              onClick={() => handleStatusChange(selectedOrder._id, 'cancelled')}
                              className="px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        )}

                        {/* Assign Delivery Partner */}
                        {['ready', 'confirmed'].includes(selectedOrder.status) && !selectedOrder.deliveryPartner && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Assign Delivery Partner
                            </label>
                            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                              <select className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm">
                                <option value="">Select Partner</option>
                                <option value="dp1">Rahul Kumar - 9876543212</option>
                                <option value="dp2">Amit Singh - 9876543213</option>
                                <option value="dp3">Priya Sharma - 9876543214</option>
                              </select>
                              <button
                                onClick={() => assignDeliveryPartner(selectedOrder._id, 'dp1')}
                                className="px-4 py-2 bg-teal-600 text-white text-sm rounded-md hover:bg-teal-700 transition-colors whitespace-nowrap"
                              >
                                Assign
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-4 lg:space-y-6">
                    {/* Items */}
                    <div className="bg-gray-50 p-3 lg:p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Order Items</h4>
                      <div className="space-y-3">
                        {selectedOrder.items.map((item, index) => (
                          <div key={index} className="flex justify-between items-start border-b border-gray-200 pb-2 last:border-b-0">
                            <div className="flex-1 pr-4">
                              <div className="font-medium text-sm">{item.name}</div>
                              <div className="text-xs text-gray-500">{item.category}</div>
                              {item.customizations && item.customizations.length > 0 && (
                                <div className="text-xs text-orange-600 mt-1">
                                  {item.customizations.join(', ')}
                                </div>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <div className="text-sm font-medium">₹{item.price} × {item.quantity}</div>
                              <div className="text-xs text-gray-500">₹{item.price * item.quantity}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-gray-50 p-3 lg:p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                        <DollarSign className="w-4 h-4 mr-2" />
                        Payment Summary
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Subtotal:</span>
                          <span>₹{selectedOrder.subtotal}</span>
                        </div>
                        {selectedOrder.discountAmount > 0 && (
                          <div className="flex justify-between text-green-600">
                            <span>Discount:</span>
                            <span>-₹{selectedOrder.discountAmount}</span>
                          </div>
                        )}
                        {selectedOrder.taxes.gst > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">GST:</span>
                            <span>₹{selectedOrder.taxes.gst}</span>
                          </div>
                        )}
                        {selectedOrder.taxes.deliveryCharges > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Delivery Charges:</span>
                            <span>₹{selectedOrder.taxes.deliveryCharges}</span>
                          </div>
                        )}
                        {selectedOrder.taxes.packagingCharges > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Packaging Charges:</span>
                            <span>₹{selectedOrder.taxes.packagingCharges}</span>
                          </div>
                        )}
                        <div className="border-t border-gray-300 pt-2 flex justify-between font-semibold">
                          <span>Total Amount:</span>
                          <span>₹{selectedOrder.totalAmount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Payment Method:</span>
                          <span className="font-medium capitalize">{selectedOrder.paymentMethod}</span>
                        </div>
                      </div>
                    </div>

                    {/* Rating */}
                    {selectedOrder.rating && (
                      <div className="bg-gray-50 p-3 lg:p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                          <Star className="w-4 h-4 mr-2" />
                          Customer Rating
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                            <span className="text-gray-600 font-medium">Food:</span>
                            <div className="flex items-center mt-1 sm:mt-0">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-4 h-4 ${i < selectedOrder.rating.food ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                />
                              ))}
                              <span className="ml-2">{selectedOrder.rating.food}/5</span>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                            <span className="text-gray-600 font-medium">Delivery:</span>
                            <div className="flex items-center mt-1 sm:mt-0">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-4 h-4 ${i < selectedOrder.rating.delivery ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                />
                              ))}
                              <span className="ml-2">{selectedOrder.rating.delivery}/5</span>
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                            <span className="text-gray-600 font-medium">Overall:</span>
                            <div className="flex items-center mt-1 sm:mt-0">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`w-4 h-4 ${i < selectedOrder.rating.overall ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                                />
                              ))}
                              <span className="ml-2">{selectedOrder.rating.overall}/5</span>
                            </div>
                          </div>
                          {selectedOrder.rating.comment && (
                            <div className="mt-3">
                              <span className="text-gray-600 font-medium">Comment:</span>
                              <p className="mt-1 text-gray-700 italic">"{selectedOrder.rating.comment}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Status Actions - Desktop */}
                    <div className="hidden xl:block bg-white border border-gray-200 p-3 lg:p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-900 mb-3">Order Actions</h4>
                      <div className="space-y-3">
                        {/* Status Change */}
                        {!['delivered', 'cancelled'].includes(selectedOrder.status) && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Change Status
                            </label>
                            <select
                              value={selectedOrder.status}
                              onChange={(e) => handleStatusChange(selectedOrder._id, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                            >
                              <option value="pending">Pending</option>
                              <option value="confirmed">Confirmed</option>
                              <option value="preparing">Preparing</option>
                              <option value="ready">Ready</option>
                              <option value="assigned">Assigned</option>
                              <option value="out-for-delivery">Out for Delivery</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </div>
                        )}

                        {/* Quick Action Buttons */}
                        {!['delivered', 'cancelled'].includes(selectedOrder.status) && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Quick Actions
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {selectedOrder.status === 'pending' && (
                                <button
                                  onClick={() => handleStatusChange(selectedOrder._id, 'confirmed')}
                                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                                >
                                  Confirm
                                </button>
                              )}
                              {selectedOrder.status === 'confirmed' && (
                                <button
                                  onClick={() => handleStatusChange(selectedOrder._id, 'preparing')}
                                  className="px-3 py-1 bg-orange-600 text-white text-sm rounded-md hover:bg-orange-700 transition-colors"
                                >
                                  Start Preparing
                                </button>
                              )}
                              {selectedOrder.status === 'preparing' && (
                                <button
                                  onClick={() => handleStatusChange(selectedOrder._id, 'ready')}
                                  className="px-3 py-1 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
                                >
                                  Mark Ready
                                </button>
                              )}
                              {selectedOrder.status === 'ready' && (
                                <button
                                  onClick={() => handleStatusChange(selectedOrder._id, 'out-for-delivery')}
                                  className="px-3 py-1 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
                                >
                                  Out for Delivery
                                </button>
                              )}
                              {selectedOrder.status === 'out-for-delivery' && (
                                <button
                                  onClick={() => handleStatusChange(selectedOrder._id, 'delivered')}
                                  className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                                >
                                  Mark Delivered
                                </button>
                              )}
                              <button
                                onClick={() => handleStatusChange(selectedOrder._id, 'cancelled')}
                                className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Assign Delivery Partner */}
                        {['ready', 'confirmed'].includes(selectedOrder.status) && !selectedOrder.deliveryPartner && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Assign Delivery Partner
                            </label>
                            <div className="flex space-x-2">
                              <select className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm">
                                <option value="">Select Partner</option>
                                <option value="dp1">Rahul Kumar - 9876543212</option>
                                <option value="dp2">Amit Singh - 9876543213</option>
                                <option value="dp3">Priya Sharma - 9876543214</option>
                              </select>
                              <button
                                onClick={() => assignDeliveryPartner(selectedOrder._id, 'dp1')}
                                className="px-4 py-2 bg-teal-600 text-white text-sm rounded-md hover:bg-teal-700 transition-colors"
                              >
                                Assign
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Timer Display */}
                        {selectedOrder.preparationDeadline && !['delivered', 'cancelled'].includes(selectedOrder.status) && (
                          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md">
                            <div className="flex items-center">
                              <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                              <div>
                                <div className="text-sm font-medium text-yellow-800">
                                  Preparation Timer
                                </div>
                                <div className="text-xs text-yellow-700">
                                  Deadline: {new Date(selectedOrder.preparationDeadline).toLocaleTimeString('en-IN')}
                                </div>
                                {selectedOrder.isDelayed && (
                                  <div className="text-xs text-red-600 font-medium mt-1">
                                    ⚠️ Order is delayed
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Cancel Reason */}
                {selectedOrder.status === 'cancelled' && selectedOrder.cancellationReason && (
                  <div className="mt-4 lg:mt-6 bg-red-50 border border-red-200 p-3 lg:p-4 rounded-lg">
                    <h4 className="font-semibold text-red-900 mb-2 flex items-center">
                      <XCircle className="w-4 h-4 mr-2" />
                      Cancellation Details
                    </h4>
                    <p className="text-sm text-red-700">
                      <strong>Reason:</strong> {selectedOrder.cancellationReason}
                    </p>
                    <p className="text-sm text-red-700 mt-1">
                      <strong>Cancelled At:</strong> {new Date(selectedOrder.cancelledAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                )}
              </div>

              {/* Fixed Footer */}
              <div className="sticky bottom-0 bg-white border-t px-4 lg:px-6 py-3 flex justify-end">
                <button
                  onClick={() => setShowOrderDetail(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

              {/* Close Button */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowOrderDetail(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
       

  );
};

export default OrdersManagement;