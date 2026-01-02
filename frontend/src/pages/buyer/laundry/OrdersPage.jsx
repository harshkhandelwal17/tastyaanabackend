
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Zap, 
  Search, 
  Star, 
  MapPin, 
  Clock, 
  Package, 
  Users, 
  ChevronRight,
  Plus,
  Minus,
  CheckCircle2,
  Phone,
  AlertCircle,
  Loader2,
  TrendingUp,
  Award,
  Truck,
  ArrowLeft,
  Sparkles,
  Check,
  ArrowRight
} from 'lucide-react';
import laundryService from '../../../services/laundryService';
import {OrderCard }  from '../../../components/laundry/OrderCard'

export const OrdersPage = ({ onBack, onOrderClick }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 50,
        page: 1
      };
      if (filter !== 'all') params.status = filter;
      
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
      
      console.log('User orders loaded:', ordersList.length);
      setOrders(ordersList);
    } catch (error) {
      console.error('Error loading orders:', error);
      console.error('Error details:', error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load orders. Please try again.';
      alert(errorMessage);
      setOrders([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const filterOptions = [
    { value: 'all', label: 'All Orders' },
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'processing', label: 'Processing' },
    { value: 'delivered', label: 'Delivered' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 p-4">
      <div className="max-w-md lg:max-w-7xl mx-auto">
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 font-semibold text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>

        <div className="mb-6">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
          <p className="text-gray-600 text-sm lg:text-base">Track and manage your laundry orders</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-md p-4 mb-6 border border-gray-200">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {filterOptions.map(option => (
              <button
                key={option.value}
                onClick={() => setFilter(option.value)}
                className={`px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition-all text-sm active:scale-95 ${
                  filter === option.value
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-2xl shadow-md border border-gray-200">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-600 font-medium">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-md border border-gray-200">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No orders found</h3>
            <p className="text-gray-500 text-sm">Start by placing your first order!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {orders.map(order => (
              <OrderCard 
                key={order._id} 
                order={order} 
                onClick={(order) => {
                  if (onOrderClick) {
                    onOrderClick(order);
                  } else {
                    window.location.href = `/laundry/orders/${order._id}`;
                  }
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
