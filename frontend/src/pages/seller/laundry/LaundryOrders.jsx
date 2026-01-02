import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Package,
  RefreshCw,
  Eye,
  Edit,
  Store
} from 'lucide-react';
import laundryService from '../../../services/laundryService';

export default function LaundryOrders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [vendorNotFound, setVendorNotFound] = useState(false);
  const [filters, setFilters] = useState({
    status: 'all',
    deliverySpeed: 'all',
    search: ''
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => {
    loadOrders();
  }, [filters]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      
      // First check if vendor profile exists
      try {
        const vendorResponse = await laundryService.getMyVendor();
        if (!vendorResponse?.data) {
          setVendorNotFound(true);
          setLoading(false);
          return;
        }
        setVendorNotFound(false);
      } catch (error) {
        // Handle 404 or "not found" errors gracefully
        if (error.isNotFound || error.status === 404 || error.message?.includes('not found') || error.response?.status === 404) {
          setVendorNotFound(true);
          setLoading(false);
          return;
        }
        // For other errors, log but don't show vendor not found
        console.error('Error checking vendor profile:', error);
      }
      
      const params = {
        limit: 100, // Get more orders
        page: 1
      };
      if (filters.status !== 'all') params.status = filters.status;
      
      // For vendor, the backend should automatically detect vendor role
      const response = await laundryService.getUserOrders(params);
      
      // Handle different response structures
      let ordersList = [];
      if (Array.isArray(response)) {
        ordersList = response;
      } else if (response?.data) {
        ordersList = Array.isArray(response.data) ? response.data : [];
      } else if (response?.orders) {
        ordersList = Array.isArray(response.orders) ? response.orders : [];
      }
      
      console.log('Orders loaded:', ordersList.length);
      
      // Filter by delivery speed
      if (filters.deliverySpeed !== 'all') {
        ordersList = ordersList.filter(o => o.deliverySpeed === filters.deliverySpeed);
      }
      
      // Filter by search
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        ordersList = ordersList.filter(o => 
          o.orderNumber?.toLowerCase().includes(searchLower) ||
          o.user?.name?.toLowerCase().includes(searchLower) ||
          o.user?.email?.toLowerCase().includes(searchLower)
        );
      }
      
      setOrders(ordersList);
    } catch (error) {
      console.error('Error loading orders:', error);
      console.error('Error details:', error.response?.data || error.message);
      
      // Handle authentication errors
      if (error.isAuthError || error.message?.includes('token') || error.message?.includes('Access denied')) {
        alert('Please log in again to view orders.');
        // Optionally redirect to login
        // window.location.href = '/login';
      } else {
        // Show user-friendly error
        const errorMessage = error.message || 'Failed to load orders. Please check your connection and try again.';
        alert(errorMessage);
      }
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, status, note) => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const apiURL = baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`;
      
      const response = await fetch(`${apiURL}/laundry/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status, note })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        alert('Order status updated successfully');
        loadOrders();
        setShowStatusModal(false);
        setSelectedOrder(null);
        setNewStatus('');
        setStatusNote('');
      } else {
        throw new Error(data.message || 'Failed to update status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert(error.message || 'Failed to update order status');
    }
  };

  const handleStatusUpdate = () => {
    if (!selectedOrder || !newStatus) return;
    updateOrderStatus(selectedOrder._id, newStatus, statusNote);
  };

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      picked_up: 'bg-blue-100 text-blue-800 border-blue-300',
      processing: 'bg-purple-100 text-purple-800 border-purple-300',
      quality_check: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      ready: 'bg-green-100 text-green-800 border-green-300',
      out_for_delivery: 'bg-teal-100 text-teal-800 border-teal-300',
      delivered: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      cancelled: 'bg-red-100 text-red-800 border-red-300'
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const getStatusIcon = (status) => {
    if (status === 'delivered') return <CheckCircle2 className="w-5 h-5" />;
    if (status === 'cancelled') return <XCircle className="w-5 h-5" />;
    return <Clock className="w-5 h-5" />;
  };

  const statusOptions = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'picked_up', label: 'Picked Up' },
    { value: 'processing', label: 'Processing' },
    { value: 'quality_check', label: 'Quality Check' },
    { value: 'ready', label: 'Ready' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (vendorNotFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Vendor Profile Not Found</h2>
          <p className="text-gray-600 mb-6">You need to create a vendor profile first to view orders.</p>
          <button
            onClick={() => navigate('/seller/laundry/create-profile')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create Vendor Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laundry Orders</h1>
          <p className="text-gray-600 mt-1">Manage and track all laundry orders</p>
        </div>
        <button
          onClick={loadOrders}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search orders..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            {statusOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          <select
            value={filters.deliverySpeed}
            onChange={(e) => setFilters({...filters, deliverySpeed: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Service Types</option>
            <option value="quick">Quick Service</option>
            <option value="scheduled">Scheduled Service</option>
            <option value="subscription">Subscription</option>
          </select>

          <div className="text-sm text-gray-600 flex items-center">
            Total: <span className="font-bold ml-2">{orders.length} orders</span>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No orders found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Order #</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Customer</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Service</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Items</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-4 px-6 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6">
                      <span className="font-medium text-gray-900">{order.orderNumber}</span>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {order.user?.name || 'N/A'}
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        order.deliverySpeed === 'quick' 
                          ? 'bg-yellow-100 text-yellow-800' 
                          : order.deliverySpeed === 'subscription'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {order.deliverySpeed || 'scheduled'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-gray-600">
                      {order.totalItems} items
                    </td>
                    <td className="py-4 px-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)} flex items-center gap-1 w-fit`}>
                        {getStatusIcon(order.status)}
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-gray-900">
                      ₹{order.pricing?.total?.toLocaleString() || 0}
                    </td>
                    <td className="py-4 px-6 text-gray-600 text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedOrder(order);
                            setNewStatus(order.status);
                            setShowStatusModal(true);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Update Status"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => navigate(`/seller/laundry/orders/${order._id}`)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="View Details"
                        >
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

      {/* Status Update Modal */}
      {showStatusModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Update Order Status</h2>
            <p className="text-gray-600 mb-4">Order: {selectedOrder.orderNumber}</p>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {statusOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (Optional)
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add a note about this status update..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleStatusUpdate}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Update Status
              </button>
              <button
                onClick={() => {
                  setShowStatusModal(false);
                  setSelectedOrder(null);
                  setNewStatus('');
                  setStatusNote('');
                }}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}