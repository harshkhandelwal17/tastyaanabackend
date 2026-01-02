import React, { useState, useMemo } from 'react';
import { 
  useGetSellerAnalyticsQuery, 
  useGetOrderAnalyticsQuery, 
  useGetSubscriptionAnalyticsQuery,
  useGetFinancialSummaryQuery 
} from '../../redux/api/sellerAnalyticsApi';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  BarElement,
  ArcElement
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package, 
  Calendar,
  PieChart,
  BarChart3,
  Filter,
  Download,
  RefreshCw
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  BarElement,
  ArcElement
);

const SellerAnalyticsDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [dateRange, setDateRange] = useState({ startDate: '', endDate: '' });

  // API queries
  const { 
    data: analyticsData, 
    isLoading: analyticsLoading, 
    refetch: refetchAnalytics 
  } = useGetSellerAnalyticsQuery({ 
    period: selectedPeriod,
    ...dateRange 
  });

  const { 
    data: orderAnalytics, 
    isLoading: orderLoading 
  } = useGetOrderAnalyticsQuery({ period: selectedPeriod });

  const { 
    data: subscriptionAnalytics, 
    isLoading: subscriptionLoading 
  } = useGetSubscriptionAnalyticsQuery();

  const { 
    data: financialSummary, 
    isLoading: financialLoading 
  } = useGetFinancialSummaryQuery(dateRange);

  const analytics = analyticsData?.data || {};
  const orders = orderAnalytics?.data || {};
  const subscriptions = subscriptionAnalytics?.data || {};
  const financial = financialSummary?.data || {};
console.log("analytics in the seller side :  ",orders);
  // Chart configurations
  const revenueChartData = useMemo(() => ({
    labels: analytics.dailyRevenueTrend?.map(item => 
      new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ) || [],
    datasets: [
      {
        label: 'Daily Revenue',
        data: analytics.dailyRevenueTrend?.map(item => item.revenue) || [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  }), [analytics.dailyRevenueTrend]);

  const categoryChartData = useMemo(() => ({
    labels: analytics.categoryWiseSales?.map(item => item._id || 'Other') || [],
    datasets: [
      {
        data: analytics.categoryWiseSales?.map(item => item.totalRevenue) || [],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF',
          '#FF9F40',
          '#FF6384',
          '#C9CBCF'
        ],
        borderWidth: 2,
        borderColor: '#fff'
      }
    ]
  }), [analytics.categoryWiseSales]);

  const orderStatusChartData = useMemo(() => ({
    labels: orders.orderStatusBreakdown?.map(item => item._id) || [],
    datasets: [
      {
        label: 'Orders',
        data: orders.orderStatusBreakdown?.map(item => item.count) || [],
        backgroundColor: [
          '#10B981',
          '#F59E0B',
          '#EF4444',
          '#8B5CF6',
          '#06B6D4'
        ],
      }
    ]
  }), [orders.orderStatusBreakdown]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-IN').format(num || 0);
  };

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'blue' }) => {
    const colorClasses = {
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      green: 'bg-green-50 text-green-600 border-green-200',
      yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      red: 'bg-red-50 text-red-600 border-red-200'
    };

    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <div className="flex items-center mt-2">
                {trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                )}
                <span className={`text-sm ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    );
  };

  const ChartCard = ({ title, children, className = "" }) => (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );

  if (analyticsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Analytics Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {analytics.sellerInfo?.name}
              </p>
            </div>
            
            {/* Period Selector */}
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="custom">Custom Range</option>
              </select>
              
              <button
                onClick={() => refetchAnalytics()}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>

          {/* Custom Date Range */}
          {selectedPeriod === 'custom' && (
            <div className="mt-4 flex flex-col sm:flex-row gap-4">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <StatCard
            title="Today's Revenue"
            value={formatCurrency(analytics.todayRevenue)}
            icon={DollarSign}
            color="green"
          />
          <StatCard
            title="Today's Orders"
            value={formatNumber(analytics.todayOrders)}
            icon={ShoppingCart}
            color="blue"
          />
          <StatCard
            title="All Time Revenue"
            value={formatCurrency(analytics.allTimeRevenue)}
            icon={TrendingUp}
            color="purple"
          />
          <StatCard
            title="Active Subscriptions"
            value={formatNumber(analytics.activeSubscriptions)}
            icon={Users}
            color="yellow"
          />
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Breakdown</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Gross Revenue</span>
                <span className="font-semibold text-lg">{formatCurrency(analytics.grossRevenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Admin Commission ({analytics.commissionRate}%)</span>
                <span className="font-semibold text-lg text-red-600">
                  -{formatCurrency(analytics.adminCommission)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Net Revenue</span>
                <span className="font-semibold text-lg text-green-600">
                  {formatCurrency(analytics.netRevenue)}
                </span>
              </div>
              <hr className="my-3" />
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Advance Amount</span>
                <span className="font-semibold text-lg">
                  {formatCurrency(analytics.advanceAmount)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Remaining Payout</span>
                <span className="font-semibold text-xl text-blue-600">
                  {formatCurrency(analytics.remainingPayout)}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Metrics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Subscriptions</span>
                <span className="font-semibold text-lg">{formatNumber(analytics.totalSubscriptions)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Subscriptions</span>
                <span className="font-semibold text-lg text-green-600">
                  {formatNumber(analytics.activeSubscriptions)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Thalis Delivered</span>
                <span className="font-semibold text-lg">{formatNumber(analytics.totalThalisDelivered)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Monthly Thalis</span>
                <span className="font-semibold text-lg">{formatNumber(analytics.monthlyThalis)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Monthly Subscriptions</span>
                <span className="font-semibold text-lg text-blue-600">
                  {formatNumber(analytics.monthlySubscriptions)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Revenue Trend Chart */}
          <ChartCard title="Revenue Trend (Last 30 Days)">
            <div className="h-64 sm:h-80">
              <Line
                data={revenueChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return '₹' + value.toLocaleString();
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </ChartCard>

          {/* Category Wise Sales */}
          <ChartCard title="Category-wise Sales">
            <div className="h-64 sm:h-80">
              <Doughnut
                data={categoryChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                    tooltip: {
                      callbacks: {
                        label: function(context) {
                          return context.label + ': ₹' + context.parsed.toLocaleString();
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </ChartCard>
        </div>

        {/* Order Status and Payment Methods */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Order Status Breakdown */}
          <ChartCard title="Order Status Breakdown">
            <div className="h-64 sm:h-80">
              <Bar
                data={orderStatusChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                    }
                  }
                }}
              />
            </div>
          </ChartCard>

          {/* Revenue by Product Type */}
          <ChartCard title="Revenue by Product Type">
            <div className="space-y-3">
              {analytics.revenueByType?.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium capitalize">{item._id || 'Other'}</span>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(item.revenue)}</div>
                    <div className="text-sm text-gray-600">{formatNumber(item.orders)} orders</div>
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>

        {/* Category Performance Table */}
        <ChartCard title="Category Performance" className="mb-6 sm:mb-8">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.categoryWiseSales?.map((category, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {category._id || 'Other'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(category.totalRevenue)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(category.totalQuantity)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(category.orderCount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default SellerAnalyticsDashboard;
