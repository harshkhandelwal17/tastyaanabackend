import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  Package,
  AlertCircle,
  Clock,
  Eye,
  Star,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Bell,
  CheckCircle,
  XCircle,
  Truck,
  Calendar,
} from 'lucide-react';
import SellerLayout from '../../components/seller/SellerLayout';

const NewSellerDashboard = () => {
  const [dashboardData, setDashboardData] = useState({
    revenue: {
      today: 12500,
      yesterday: 11200,
      change: 11.6,
      trend: 'up'
    },
    orders: {
      today: 24,
      yesterday: 18,
      change: 33.3,
      trend: 'up'
    },
    customers: {
      total: 342,
      new: 8,
      change: 2.4,
      trend: 'up'
    },
    products: {
      total: 45,
      lowStock: 3,
      outOfStock: 1
    }
  });
  
  const [recentOrders, setRecentOrders] = useState([
    { id: 'ORD-001', customer: 'John Doe', items: 3, total: 450, status: 'pending', time: '2 mins ago' },
    { id: 'ORD-002', customer: 'Jane Smith', items: 1, total: 200, status: 'confirmed', time: '5 mins ago' },
    { id: 'ORD-003', customer: 'Mike Johnson', items: 2, total: 350, status: 'preparing', time: '12 mins ago' },
    { id: 'ORD-004', customer: 'Sarah Wilson', items: 4, total: 680, status: 'ready', time: '18 mins ago' },
  ]);

  const [recentActivity, setRecentActivity] = useState([
    { type: 'order', description: 'New order received from John Doe', time: '2 minutes ago', icon: ShoppingCart },
    { type: 'stock', description: 'Low stock alert for Biriyani', time: '15 minutes ago', icon: AlertCircle },
    { type: 'review', description: 'New 5-star review received', time: '1 hour ago', icon: Star },
    { type: 'payment', description: 'Payment received for order #ORD-002', time: '2 hours ago', icon: DollarSign },
  ]);

  const [loading, setLoading] = useState(false);

  const refreshData = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'preparing': return 'bg-orange-100 text-orange-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <SellerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-600">
              Welcome back! Here's what's happening with your store today.
            </p>
          </div>
          <button
            onClick={refreshData}
            disabled={loading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <RefreshCw className={`-ml-0.5 mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Today's Revenue"
            value={`₹${dashboardData.revenue.today.toLocaleString()}`}
            change={dashboardData.revenue.change}
            trend={dashboardData.revenue.trend}
            icon={DollarSign}
            iconColor="text-green-600 bg-green-100"
          />
          <MetricCard
            title="Orders Today"
            value={dashboardData.orders.today}
            change={dashboardData.orders.change}
            trend={dashboardData.orders.trend}
            icon={ShoppingCart}
            iconColor="text-blue-600 bg-blue-100"
          />
          <MetricCard
            title="Total Customers"
            value={dashboardData.customers.total}
            change={dashboardData.customers.change}
            trend={dashboardData.customers.trend}
            icon={Users}
            iconColor="text-purple-600 bg-purple-100"
            subtitle={`${dashboardData.customers.new} new today`}
          />
          <MetricCard
            title="Products"
            value={dashboardData.products.total}
            icon={Package}
            iconColor="text-orange-600 bg-orange-100"
            subtitle={`${dashboardData.products.lowStock} low stock`}
            alert={dashboardData.products.outOfStock > 0}
          />
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Orders</h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">Latest orders from your customers</p>
                  </div>
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-500">
                    View all
                  </button>
                </div>
              </div>
              <div className="overflow-hidden">
                <div className="divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center min-w-0 flex-1">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <ShoppingCart className="h-5 w-5 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4 min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {order.id}
                              </p>
                              <div className="ml-2 flex-shrink-0">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                  {order.status}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center text-sm text-gray-500 space-x-4">
                              <span>{order.customer}</span>
                              <span>•</span>
                              <span>{order.items} items</span>
                              <span>•</span>
                              <span>₹{order.total}</span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-2 flex-shrink-0 text-right">
                          <p className="text-xs text-gray-500">{order.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Activity</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Latest updates and notifications</p>
            </div>
            <div className="px-4 py-5 sm:px-6">
              <div className="flow-root">
                <ul className="-mb-8">
                  {recentActivity.map((activity, index) => (
                    <li key={index}>
                      <div className="relative pb-8">
                        {index !== recentActivity.length - 1 && (
                          <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                        )}
                        <div className="relative flex space-x-3">
                          <div>
                            <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center ring-8 ring-white">
                              <activity.icon className="h-4 w-4 text-blue-600" />
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <div>
                              <p className="text-sm text-gray-900">{activity.description}</p>
                              <p className="mt-0.5 text-xs text-gray-500">{activity.time}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Quick Actions</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Common tasks and shortcuts</p>
          </div>
          <div className="px-4 py-5 sm:px-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <QuickActionCard
                title="Add Product"
                description="Add a new product to your store"
                icon={Package}
                href="/seller/products/new"
              />
              <QuickActionCard
                title="View Orders"
                description="Manage and track your orders"
                icon={ShoppingCart}
                href="/seller/orders"
              />
              <QuickActionCard
                title="Create Meal Plan"
                description="Design new meal plans"
                icon={Calendar}
                href="/seller/meal-plans/new"
              />
              <QuickActionCard
                title="Analytics"
                description="View detailed analytics"
                icon={Activity}
                href="/seller/analytics"
              />
            </div>
          </div>
        </div>
      </div>
    </SellerLayout>
  );
};

const MetricCard = ({ title, value, change, trend, icon: Icon, iconColor, subtitle, alert }) => (
  <div className="bg-white overflow-hidden shadow rounded-lg">
    <div className="p-5">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`rounded-md p-3 ${iconColor}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        <div className="ml-5 w-0 flex-1">
          <dl>
            <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
            <dd className="flex items-baseline">
              <div className="text-2xl font-semibold text-gray-900">{value}</div>
              {change && (
                <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                  trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {trend === 'up' ? (
                    <ArrowUpRight className="self-center flex-shrink-0 h-4 w-4" />
                  ) : (
                    <ArrowDownRight className="self-center flex-shrink-0 h-4 w-4" />
                  )}
                  <span className="ml-1">{change}%</span>
                </div>
              )}
            </dd>
            {subtitle && (
              <dd className="text-sm text-gray-500 mt-1">{subtitle}</dd>
            )}
            {alert && (
              <dd className="text-sm text-red-600 mt-1 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                Needs attention
              </dd>
            )}
          </dl>
        </div>
      </div>
    </div>
  </div>
);

const QuickActionCard = ({ title, description, icon: Icon, href }) => (
  <a
    href={href}
    className="relative group bg-white p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all duration-200 hover:border-blue-300"
  >
    <div>
      <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-600 ring-4 ring-white">
        <Icon className="h-6 w-6" />
      </span>
    </div>
    <div className="mt-4">
      <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600">
        <span className="absolute inset-0" aria-hidden="true" />
        {title}
      </h3>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
    </div>
  </a>
);

export default NewSellerDashboard;