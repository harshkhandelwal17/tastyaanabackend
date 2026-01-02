import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  useGetUserSubscriptionsQuery,
  usePauseSubscriptionMutation,
  useResumeSubscriptionMutation,
  useCancelSubscriptionMutation,
  useSkipMealMutation
} from '../../redux/storee/api';
import {
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  Play,
  Pause,
  X,
  SkipForward,
  Edit3,
  Eye,
  Filter,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock as ClockIcon,
  Package,
  Users,
  DollarSign,
  TrendingUp,
  CalendarDays,
  Utensils,
  Coffee,
  Moon,
  Sun,
  Star,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Download,
  Share2,
  Settings,
  Bell,
  Heart,
  Zap,
  Shield,
  Truck,
  Gift,
  Award
} from 'lucide-react';
import toast from 'react-hot-toast';

const MySubscriptionsPage = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  
  // State for filters and UI
  const [filters, setFilters] = useState({
    status: 'all',
    planType: 'all',
    dateRange: 'all'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedSubscription, setExpandedSubscription] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  // RTK Query hooks
  const { 
    data: subscriptionsData, 
    isLoading, 
    error, 
    refetch 
  } = useGetUserSubscriptionsQuery(undefined, {
    skip: !isAuthenticated
  });

  // Debug authentication and API call
  console.log('User authenticated:', isAuthenticated);
  console.log('User ID:', user?._id);
  console.log('API Loading:', isLoading);
  console.log('API Error:', error);

  const [pauseSubscription, { isLoading: isPausing }] = usePauseSubscriptionMutation();
  const [resumeSubscription, { isLoading: isResuming }] = useResumeSubscriptionMutation();
  const [cancelSubscription, { isLoading: isCancelling }] = useCancelSubscriptionMutation();
  const [skipMeal, { isLoading: isSkipping }] = useSkipMealMutation();

  const subscriptions = subscriptionsData?.data?.subscriptions || subscriptionsData?.subscriptions || [];
  
  // Debug logging
  console.log('Subscriptions Data:', subscriptionsData);
  console.log('Subscriptions Array:', subscriptions);

  // Filter and sort subscriptions
  const filteredSubscriptions = subscriptions
    .filter(subscription => {
      // Status filter
      if (filters.status !== 'all' && subscription.status !== filters.status) {
        return false;
      }
      
      // Plan type filter
      if (filters.planType !== 'all' && subscription.planType !== filters.planType) {
        return false;
      }
      
      // Search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          subscription.subscriptionNumber?.toLowerCase().includes(searchLower) ||
          subscription.mealPlan?.name?.toLowerCase().includes(searchLower) ||
          subscription.mealPlan?.title?.toLowerCase().includes(searchLower)
        );
      }
      
      return true;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'startDate':
          aValue = new Date(a.startDate);
          bValue = new Date(b.startDate);
          break;
        case 'endDate':
          aValue = new Date(a.endDate);
          bValue = new Date(b.endDate);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'planType':
          aValue = a.planType;
          bValue = b.planType;
          break;
        case 'totalAmount':
          aValue = a.pricing?.finalAmount || 0;
          bValue = b.pricing?.finalAmount || 0;
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  // Handle subscription actions
  const handlePauseSubscription = async (subscriptionId) => {
    try {
      await pauseSubscription(subscriptionId).unwrap();
      toast.success('Subscription paused successfully', { duration: 2000 });
      refetch();
    } catch (error) {
      toast.error(error.data?.message || 'Failed to pause subscription', { duration: 2000 });
    }
  };

  const handleResumeSubscription = async (subscriptionId) => {
    try {
      await resumeSubscription(subscriptionId).unwrap();
      toast.success('Subscription resumed successfully', { duration: 2000 });
      refetch();
    } catch (error) {
      toast.error(error.data?.message || 'Failed to resume subscription', { duration: 2000 });
    }
  };

  const handleCancelSubscription = async (subscriptionId) => {
    if (window.confirm('Are you sure you want to cancel this subscription? This action cannot be undone.')) {
      try {
        await cancelSubscription(subscriptionId).unwrap();
        toast.success('Subscription cancelled successfully', { duration: 2000 });
        refetch();
      } catch (error) {
        toast.error(error.data?.message || 'Failed to cancel subscription', { duration: 2000 });
      }
    }
  };

  const handleSkipMeal = async (subscriptionId, mealDate) => {
    try {
      await skipMeal({ subscriptionId, mealDate }).unwrap();
      toast.success('Meal skipped successfully', { duration: 2000 });
      refetch();
    } catch (error) {
      toast.error(error.data?.message || 'Failed to skip meal', { duration: 2000 });
    }
  };

  // Get status badge styling
  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
      paused: { color: 'bg-yellow-100 text-yellow-800', icon: Pause },
      cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle },
      pending: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      expired: { color: 'bg-gray-100 text-gray-800', icon: XCircle }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  // Get plan type display
  const getPlanTypeDisplay = (planType) => {
    const planTypes = {
      oneDay: '1 Day',
      tenDays: '10 Days',
      thirtyDays: '30 Days',
      monthly: '30 Days', // monthly is also 30 days
      custom: 'Custom'
    };
    console.log('Plan type mapping:', planType, '->', planTypes[planType] || planType);
    return planTypes[planType] || planType;
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate actual duration in days
  const calculateActualDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  // Get delivery timing display
  const getDeliveryTimingDisplay = (deliveryTiming) => {
    const timings = [];
    if (deliveryTiming?.morning?.enabled) {
      timings.push(`Morning (${deliveryTiming.morning.time})`);
    }
    if (deliveryTiming?.evening?.enabled) {
      timings.push(`Evening (${deliveryTiming.evening.time})`);
    }
    return timings.join(', ') || 'Not specified';
  };

  // Calculate subscription stats
  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'active').length,
    paused: subscriptions.filter(s => s.status === 'paused').length,
    cancelled: subscriptions.filter(s => s.status === 'cancelled').length,
    totalSpent: subscriptions.reduce((sum, s) => sum + (s.pricing?.finalAmount || 0), 0)
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-3">Authentication Required</h2>
          <p className="text-gray-600 mb-6">Please sign in to view and manage your meal subscriptions</p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/ghar/ka/khana')}
              className="w-full bg-white text-emerald-600 px-6 py-3 rounded-lg border border-emerald-600 hover:bg-emerald-50 transition-colors font-medium"
            >
              Browse Meal Plans
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="sticky top-0 bg-white shadow-sm z-50 md:hidden">
        <div className="px-4 py-3 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors mr-3"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-gray-800">My Subscriptions</h1>
            <div className="text-emerald-600 text-sm font-medium">
              {stats.active} Active • {stats.total} Total
            </div>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        {/* Desktop Header */}
        <div className="mb-6 hidden md:block">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">My Subscriptions</h1>
              <p className="text-gray-600 mt-1">Manage and track all your meal plan subscriptions</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/ghar/ka/khana')}
                className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
              >
                <Package className="w-4 h-4 mr-2" />
                New Subscription
              </button>
              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 lg:gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Total</p>
                  <p className="text-lg lg:text-xl font-bold text-gray-900">{stats.total}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Active</p>
                  <p className="text-lg lg:text-xl font-bold text-emerald-600">{stats.active}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <Pause className="w-5 h-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Paused</p>
                  <p className="text-lg lg:text-xl font-bold text-yellow-600">{stats.paused}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Cancelled</p>
                  <p className="text-lg lg:text-xl font-bold text-red-600">{stats.cancelled}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow col-span-2 md:col-span-1">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-xs font-medium text-gray-600">Total Spent</p>
                  <p className="text-lg lg:text-xl font-bold text-green-600">{formatCurrency(stats.totalSpent)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search subscriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                style={{ fontSize: '16px' }} // Prevents zoom on iOS
              />
            </div>

            <div className="flex items-center space-x-2">
              {/* Filter Toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
                {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
              </button>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
              >
                <option value="createdAt">Created Date</option>
                <option value="startDate">Start Date</option>
                <option value="endDate">End Date</option>
                <option value="status">Status</option>
                <option value="planType">Plan Type</option>
                <option value="totalAmount">Amount</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="pending">Pending</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plan Type</label>
                  <select
                    value={filters.planType}
                    onChange={(e) => setFilters(prev => ({ ...prev, planType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  >
                    <option value="all">All Plans</option>
                    <option value="oneDay">1 Day</option>
                    <option value="tenDays">10 Days</option>
                    <option value="thirtyDays">30 Days</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
                  >
                    <option value="all">All Time</option>
                    <option value="last7days">Last 7 Days</option>
                    <option value="last30days">Last 30 Days</option>
                    <option value="last3months">Last 3 Months</option>
                    <option value="last6months">Last 6 Months</option>
                    <option value="last1year">Last 1 Year</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-600">Loading your subscriptions...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-4" />
            <p className="text-red-600 mb-4">Failed to load subscriptions</p>
            <button
              onClick={() => refetch()}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Subscriptions List */}
        {!isLoading && !error && (
          <div className="space-y-4">
            {filteredSubscriptions.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No Subscriptions Found</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchTerm || filters.status !== 'all' || filters.planType !== 'all' 
                    ? 'Try adjusting your search or filters to find what you\'re looking for'
                    : 'Start your healthy meal journey with our delicious subscription plans'
                  }
                </p>
                {!searchTerm && filters.status === 'all' && filters.planType === 'all' && (
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate('/ghar/ka/khana')}
                      className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                    >
                      Browse Meal Plans
                    </button>
                    <p className="text-sm text-gray-500">Discover fresh, home-style meals delivered to your door</p>
                  </div>
                )}
              </div>
            ) : (
              filteredSubscriptions.map((subscription) => (
                <div
                  key={subscription._id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Subscription Header */}
                  <div className="p-4 md:p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {subscription.mealPlan?.name || subscription.mealPlan?.title || 'Meal Plan'}
                          </h3>
                          {getStatusBadge(subscription.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center bg-gray-50 rounded-lg p-2">
                            <Calendar className="w-4 h-4 mr-2 text-emerald-600" />
                            <div>
                              <p className="text-xs text-gray-500">Started</p>
                              <p className="font-medium text-gray-900">{formatDate(subscription.startDate)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center bg-gray-50 rounded-lg p-2">
                            <Clock className="w-4 h-4 mr-2 text-blue-600" />
                            <div>
                              <p className="text-xs text-gray-500">Plan Duration</p>
                              <p className="font-medium text-gray-900">
                                {getPlanTypeDisplay(subscription.planType)}
                                <span className="text-xs text-gray-500 ml-1">
                                  ({calculateActualDuration(subscription.startDate, subscription.endDate)} days)
                                </span>
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center bg-gray-50 rounded-lg p-2">
                            <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                            <div>
                              <p className="text-xs text-gray-500">Total Amount</p>
                              <p className="font-bold text-gray-900">{formatCurrency(subscription.pricing?.finalAmount || 0)}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center bg-gray-50 rounded-lg p-2">
                            <Package className="w-4 h-4 mr-2 text-purple-600" />
                            <div>
                              <p className="text-xs text-gray-500">Order ID</p>
                              <p className="font-medium text-gray-900">#{subscription.subscriptionNumber}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {/* Quick Actions for Active/Paused */}
                        {subscription.status === 'active' && (
                          <button
                            onClick={() => handlePauseSubscription(subscription._id)}
                            disabled={isPausing}
                            className="flex items-center px-3 py-1.5 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors text-sm font-medium"
                          >
                            <Pause className="w-3 h-3 mr-1" />
                            Pause
                          </button>
                        )}
                        
                        {subscription.status === 'paused' && (
                          <button
                            onClick={() => handleResumeSubscription(subscription._id)}
                            disabled={isResuming}
                            className="flex items-center px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-lg hover:bg-emerald-200 transition-colors text-sm font-medium"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Resume
                          </button>
                        )}
                        
                        <button
                          onClick={() => setExpandedSubscription(
                            expandedSubscription === subscription._id ? null : subscription._id
                          )}
                          className="p-2 text-gray-400 hover:text-gray-600 transition-colors hover:bg-gray-100 rounded-lg"
                        >
                          {expandedSubscription === subscription._id ? (
                            <ChevronUp className="w-5 h-5" />
                          ) : (
                            <ChevronDown className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedSubscription === subscription._id && (
                    <div className="border-t border-gray-200 p-4 md:p-6 bg-gray-50">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left Column - Details */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Subscription Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Status:</span>
                                <span className="font-medium">{subscription.status}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Start Date:</span>
                                <span>{formatDate(subscription.startDate)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">End Date:</span>
                                <span>{formatDate(subscription.endDate)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Auto Renewal:</span>
                                <span>{subscription.autoRenewal ? 'Yes' : 'No'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Meals Per Day:</span>
                                <span>{subscription.pricing?.mealsPerDay || 1}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Total Meals:</span>
                                <span>{subscription.pricing?.totalMeals || 0}</span>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Delivery Information</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-start">
                                <MapPin className="w-4 h-4 mr-2 mt-0.5 text-gray-400" />
                                <div>
                                  <p className="font-medium">{subscription.deliveryAddress?.name}</p>
                                  <p className="text-gray-600">
                                    {subscription.deliveryAddress?.street}, {subscription.deliveryAddress?.city}
                                  </p>
                                  <p className="text-gray-600">
                                    {subscription.deliveryAddress?.state} - {subscription.deliveryAddress?.pincode}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-2 text-gray-400" />
                                <span>{getDeliveryTimingDisplay(subscription.deliveryTiming)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right Column - Pricing & Actions */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Pricing Breakdown</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Base Price:</span>
                                <span>{formatCurrency(subscription.pricing?.totalAmount || 0)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Add-ons:</span>
                                <span>{formatCurrency(subscription.pricing?.addOnsPrice || 0)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Customizations:</span>
                                <span>{formatCurrency(subscription.pricing?.customizationPrice || 0)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Packaging:</span>
                                <span>{formatCurrency(subscription.pricing?.packagingCharges || 0)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">GST:</span>
                                <span>{formatCurrency(subscription.pricing?.gst || 0)}</span>
                              </div>
                              <div className="border-t pt-2 flex justify-between font-semibold">
                                <span>Total:</span>
                                <span>{formatCurrency(subscription.pricing?.finalAmount || 0)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-3">Quick Actions</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              <button
                                onClick={() => navigate(`/subscription/${subscription._id}`)}
                                className="flex items-center justify-center px-4 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </button>
                              
                              <button
                                onClick={() => navigate(`/subscription/${subscription._id}`)}
                                className="flex items-center justify-center px-4 py-2.5 bg-blue-100 text-blue-800 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium"
                              >
                                <Settings className="w-4 h-4 mr-2" />
                                Manage
                              </button>
                              
                              {['active', 'paused'].includes(subscription.status) && (
                                <button
                                  onClick={() => handleCancelSubscription(subscription._id)}
                                  disabled={isCancelling}
                                  className="flex items-center justify-center px-4 py-2.5 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Cancel
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
        
        {/* Mobile Bottom Padding */}
        <div className="h-20 md:hidden"></div>
      </div>
      
      {/* Mobile Quick Add Button */}
      <div className="fixed bottom-4 right-4 md:hidden z-50">
        <button
          onClick={() => navigate('/ghar/ka/khana')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-105"
        >
          <Package className="w-6 h-6" />
        </button>
      </div>
      
      <style jsx>{`
        /* Mobile responsive improvements */
        @media (max-width: 768px) {
          .grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          
          .text-lg {
            font-size: 1rem;
          }
          
          .text-xl {
            font-size: 1.125rem;
          }
          
          .p-6 {
            padding: 1rem;
          }
          
          .gap-4 {
            gap: 0.75rem;
          }
        }
        
        @media (max-width: 640px) {
          .text-2xl {
            font-size: 1.25rem;
          }
          
          .text-3xl {
            font-size: 1.5rem;
          }
          
          /* Better touch targets */
          button {
            min-height: 44px;
            min-width: 44px;
          }
          
          input[type="text"],
          select {
            min-height: 44px;
            font-size: 16px !important; /* Prevents zoom on iOS */
          }
        }
        
        /* Smooth transitions */
        .transition-all {
          transition-property: all;
          transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
          transition-duration: 150ms;
        }
        
        .hover\\:scale-105:hover {
          transform: scale(1.05);
        }
        
        /* Focus states for accessibility */
        button:focus,
        input:focus,
        select:focus {
          outline: 2px solid #10b981;
          outline-offset: 2px;
        }
        
        /* Loading animation */
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default MySubscriptionsPage; 