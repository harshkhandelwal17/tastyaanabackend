import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Package, 
  TrendingUp, 
  Clock, 
  Users, 
  DollarSign, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Store
} from 'lucide-react';
import laundryService from '../../../services/laundryService';

export default function LaundryVendorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    processingOrders: 0,
    completedOrders: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    activeSubscriptions: 0,
    avgRating: 0
  });
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [vendorNotFound, setVendorNotFound] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
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
      
      // Load vendor orders
      const ordersResponse = await laundryService.getUserOrders({ limit: 100 });
      
      // Handle different response structures
      let orders = [];
      if (Array.isArray(ordersResponse)) {
        orders = ordersResponse;
      } else if (ordersResponse?.data) {
        orders = Array.isArray(ordersResponse.data) ? ordersResponse.data : [];
      } else if (ordersResponse?.orders) {
        orders = Array.isArray(ordersResponse.orders) ? ordersResponse.orders : [];
      }
      
      console.log('Dashboard orders loaded:', orders.length);
      
      // Calculate stats
      const totalOrders = orders.length;
      const pendingOrders = orders.filter(o => o.status === 'scheduled').length;
      const processingOrders = orders.filter(o => ['picked_up', 'processing', 'quality_check'].includes(o.status)).length;
      const completedOrders = orders.filter(o => o.status === 'delivered').length;
      
      const todayRevenue = orders
        .filter(o => {
          const orderDate = new Date(o.createdAt);
          const today = new Date();
          return orderDate.toDateString() === today.toDateString() && o.status === 'delivered';
        })
        .reduce((sum, o) => sum + (o.pricing?.total || 0), 0);

      const monthlyRevenue = orders
        .filter(o => {
          const orderDate = new Date(o.createdAt);
          const now = new Date();
          return orderDate.getMonth() === now.getMonth() && 
                 orderDate.getFullYear() === now.getFullYear() &&
                 o.status === 'delivered';
        })
        .reduce((sum, o) => sum + (o.pricing?.total || 0), 0);

      setStats({
        totalOrders,
        pendingOrders,
        processingOrders,
        completedOrders,
        todayRevenue,
        monthlyRevenue,
        activeSubscriptions: 0, // TODO: Load from subscriptions
        avgRating: 4.5 // TODO: Calculate from feedback
      });

      setRecentOrders(orders.slice(0, 5));
    } catch (error) {
      console.error('Error loading dashboard:', error);
      console.error('Error details:', error.response?.data || error.message);
      // Set default stats on error
      setStats({
        totalOrders: 0,
        pendingOrders: 0,
        processingOrders: 0,
        completedOrders: 0,
        todayRevenue: 0,
        monthlyRevenue: 0,
        activeSubscriptions: 0,
        avgRating: 0
      });
      setRecentOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      icon: Package,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: Clock,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Processing',
      value: stats.processingOrders,
      icon: Loader2,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Completed',
      value: stats.completedOrders,
      icon: CheckCircle2,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Today Revenue',
      value: `₹${stats.todayRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Monthly Revenue',
      value: `₹${stats.monthlyRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'from-indigo-500 to-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Active Subscriptions',
      value: stats.activeSubscriptions,
      icon: Users,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'bg-pink-50'
    },
    {
      title: 'Avg Rating',
      value: stats.avgRating.toFixed(1),
      icon: AlertCircle,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const getStatusColor = (status) => {
    const colors = {
      scheduled: 'bg-yellow-100 text-yellow-800',
      picked_up: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      quality_check: 'bg-indigo-100 text-indigo-800',
      ready: 'bg-green-100 text-green-800',
      out_for_delivery: 'bg-teal-100 text-teal-800',
      delivered: 'bg-emerald-100 text-emerald-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

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
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Vendor Profile Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            You need to create a vendor profile to start managing your laundry business. 
            This will allow you to set up pricing, services, and receive orders.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate('/seller/laundry/create-profile')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create Vendor Profile
            </button>
            <button
              onClick={() => navigate('/seller')}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Laundry Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your laundry business</p>
        </div>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Loader2 className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              className={`${stat.bgColor} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} bg-opacity-20`}>
                  <Icon className={`w-6 h-6 text-gradient-to-r ${stat.color}`} />
                </div>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">{stat.title}</h3>
              <p className={`text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                {stat.value}
              </p>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link
          to="/seller/laundry/orders"
          className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Manage Orders</h3>
              <p className="text-sm text-gray-600 mt-1">View and update orders</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>

        <Link
          to="/seller/laundry/pricing"
          className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Pricing Manager</h3>
              <p className="text-sm text-gray-600 mt-1">Update item pricing</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>

        <Link
          to="/seller/laundry/quick"
          className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Quick Service</h3>
              <p className="text-sm text-gray-600 mt-1">Configure quick service</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>

        <Link
          to="/seller/laundry/scheduled"
          className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Scheduled Service</h3>
              <p className="text-sm text-gray-600 mt-1">Configure scheduled service</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>

        <Link
          to="/seller/laundry/services"
          className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Services Manager</h3>
              <p className="text-sm text-gray-600 mt-1">Manage services</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>

        <Link
          to="/seller/laundry/plans"
          className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Subscription Plans</h3>
              <p className="text-sm text-gray-600 mt-1">Manage plans</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>

        <Link
          to="/seller/laundry/subscriptions"
          className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border-2 border-transparent hover:border-blue-500"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">My Subscribers</h3>
              <p className="text-sm text-gray-600 mt-1">View and manage subscribers ({stats.activeSubscriptions || 0})</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Recent Orders</h2>
          <Link
            to="/seller/laundry/orders"
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
          >
            View All
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No orders yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Order #</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Items</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order._id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900">{order.orderNumber}</span>
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {order.user?.name || 'N/A'}
                    </td>
                    <td className="py-4 px-4 text-gray-600">
                      {order.totalItems} items
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-semibold text-gray-900">
                      ₹{order.pricing?.total?.toLocaleString() || 0}
                    </td>
                    <td className="py-4 px-4 text-gray-600 text-sm">
                      {new Date(order.createdAt).toLocaleDateString()}
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
}