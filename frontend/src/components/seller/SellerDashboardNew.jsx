import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Store,
  Package,
  ShoppingCart,
  BarChart3,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Eye,
  Plus,
  Edit,
  Trash2,
  Settings,
  Bell,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Filter,
  Search,
  MoreHorizontal
} from 'lucide-react';
import {
  useGetSellerProfileQuery,
  useGetSellerDashboardQuery,
  useGetSellerProductsQuery,
  useGetSellerOrdersQuery
} from '../../redux/storee/api';

const DashboardCard = ({ title, value, change, changeType, icon: Icon, color, onClick }) => (
  <div 
    className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all duration-200 ${onClick ? 'hover:bg-gray-50' : ''}`}
    onClick={onClick}
  >
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {change && (
          <div className={`flex items-center mt-2 text-sm ${
            changeType === 'positive' ? 'text-green-600' : 'text-red-600'
          }`}>
            {changeType === 'positive' ? 
              <ArrowUpRight size={16} className="mr-1" /> : 
              <ArrowDownRight size={16} className="mr-1" />
            }
            <span>{change}</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
    </div>
  </div>
);

const QuickActionCard = ({ title, description, icon: Icon, color, onClick }) => (
  <div 
    className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:shadow-md transition-all duration-200 hover:bg-gray-50"
    onClick={onClick}
  >
    <div className="flex items-center">
      <div className={`p-3 rounded-lg ${color} mr-4`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>
      </div>
      <ChevronRight size={20} className="text-gray-400" />
    </div>
  </div>
);

const OrderItem = ({ order }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-3 last:mb-0">
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <p className="font-semibold text-gray-900">Order #{order.orderNumber}</p>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
          order.status === 'preparing' ? 'bg-blue-100 text-blue-800' :
          order.status === 'ready' ? 'bg-green-100 text-green-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </span>
      </div>
      <p className="text-sm text-gray-600">{order.items?.length || 0} items • ₹{order.total}</p>
      <p className="text-xs text-gray-500 mt-1">{order.customerName}</p>
    </div>
  </div>
);

const SellerDashboardNew = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch data
  const { data: profileData, isLoading: profileLoading } = useGetSellerProfileQuery();
  const { data: dashboardData, isLoading: dashboardLoading, refetch: refetchDashboard } = useGetSellerDashboardQuery();
  const { data: productsData, isLoading: productsLoading } = useGetSellerProductsQuery({ limit: 5 });
  const { data: ordersData, isLoading: ordersLoading } = useGetSellerOrdersQuery({ limit: 5, status: 'pending' });

  const isLoading = profileLoading || dashboardLoading || productsLoading || ordersLoading;
  const profile = profileData?.data || {};
  const dashboard = dashboardData?.data || {};
  const products = productsData?.data?.products || [];
  const orders = ordersData?.data?.orders || [];

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refetchDashboard();
    } finally {
      setTimeout(() => setRefreshing(false), 1000);
    }
  };

  const quickActions = [
    {
      title: 'Manage Products',
      description: 'Add, edit, or delete your products',
      icon: Package,
      color: 'bg-blue-500',
      onClick: () => navigate('/seller/products')
    },
    {
      title: 'View Analytics',
      description: 'Check your sales and performance',
      icon: BarChart3,
      color: 'bg-green-500',
      onClick: () => navigate('/seller/analytics')
    },
    {
      title: 'Subscriptions',
      description: 'Manage meal subscriptions',
      icon: Users,
      color: 'bg-purple-500',
      onClick: () => navigate('/seller/subscriptions')
    },
    {
      title: 'Store Settings',
      description: 'Update your store information',
      icon: Settings,
      color: 'bg-gray-500',
      onClick: () => navigate('/seller/settings')
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20 lg:pb-8">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-600">Welcome back, {profile.businessName || user?.name}</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={() => navigate('/seller/notifications')}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors relative"
              >
                <Bell size={20} />
                {dashboard.unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {dashboard.unreadNotifications}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Store Status */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg mr-3 ${profile.storeStatus === 'open' ? 'bg-green-500' : 'bg-red-500'}`}>
                <Store size={20} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">Store Status</p>
                <p className={`text-sm ${profile.storeStatus === 'open' ? 'text-green-600' : 'text-red-600'}`}>
                  {profile.storeStatus === 'open' ? 'Open for Orders' : 'Closed'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/seller/settings')}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Manage
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard
            title="Today's Sales"
            value={`₹${dashboard.todaySales || 0}`}
            change="+12%"
            changeType="positive"
            icon={DollarSign}
            color="bg-green-500"
            onClick={() => navigate('/seller/analytics')}
          />
          <DashboardCard
            title="Total Orders"
            value={dashboard.totalOrders || 0}
            change="+8%"
            changeType="positive"
            icon={ShoppingCart}
            color="bg-blue-500"
            onClick={() => navigate('/seller/orders')}
          />
          <DashboardCard
            title="Products"
            value={dashboard.totalProducts || products.length}
            icon={Package}
            color="bg-purple-500"
            onClick={() => navigate('/seller/products')}
          />
          <DashboardCard
            title="Subscriptions"
            value={dashboard.activeSubscriptions || 0}
            icon={Users}
            color="bg-orange-500"
            onClick={() => navigate('/seller/subscriptions')}
          />
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {quickActions.map((action, index) => (
              <QuickActionCard key={index} {...action} />
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
            <button
              onClick={() => navigate('/seller/orders')}
              className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center"
            >
              View All <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            {orders.length > 0 ? (
              orders.map((order, index) => (
                <OrderItem key={order._id || index} order={order} />
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No recent orders</p>
                <p className="text-sm">Orders will appear here once customers start ordering</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Your Products</h2>
            <button
              onClick={() => navigate('/seller/products')}
              className="text-green-600 hover:text-green-700 font-medium text-sm flex items-center"
            >
              Manage All <ChevronRight size={16} className="ml-1" />
            </button>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            {products.length > 0 ? (
              <div className="space-y-3">
                {products.slice(0, 5).map((product, index) => (
                  <div key={product._id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <img
                        src={product.images?.[0] || '/api/placeholder/60/60'}
                        alt={product.name}
                        className="w-12 h-12 rounded-lg object-cover mr-3"
                      />
                      <div>
                        <p className="font-semibold text-gray-900">{product.name}</p>
                        <p className="text-sm text-gray-600">₹{product.price}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {product.isAvailable ? 'Available' : 'Out of Stock'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Package size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No products added yet</p>
                <button
                  onClick={() => navigate('/seller/products')}
                  className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Add Your First Product
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerDashboardNew;

