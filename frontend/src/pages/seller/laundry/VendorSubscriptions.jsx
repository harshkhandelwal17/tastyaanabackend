import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Users, 
  Package, 
  Calendar, 
  Clock, 
  MapPin,
  Phone,
  Mail,
  TrendingUp,
  Activity,
  Filter,
  Search,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Pause,
  Play
} from 'lucide-react';
import laundryService from '../../../services/laundryService';

export default function VendorSubscriptions() {
  const navigate = useNavigate();
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    paused: 0,
    cancelled: 0,
    expired: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [vendorNotFound, setVendorNotFound] = useState(false);

  useEffect(() => {
    loadSubscriptions();
  }, [filter]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      
      // Check vendor profile first
      try {
        const vendorCheck = await laundryService.getMyVendor();
        if (!vendorCheck?.data) {
          setVendorNotFound(true);
          setLoading(false);
          return;
        }
        setVendorNotFound(false);
      } catch (error) {
        if (error.isNotFound || error.status === 404) {
          setVendorNotFound(true);
          setLoading(false);
          return;
        }
      }

      const response = await laundryService.getVendorSubscriptions({ status: filter === 'all' ? undefined : filter });
      console.log('Vendor subscriptions response:', response);
      
      const subs = response?.data || [];
      const subscriptionStats = response?.stats || {};
      
      setSubscriptions(Array.isArray(subs) ? subs : []);
      setStats(subscriptionStats);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'expired':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        sub.user?.name?.toLowerCase().includes(searchLower) ||
        sub.user?.email?.toLowerCase().includes(searchLower) ||
        sub.user?.phone?.includes(searchTerm) ||
        sub.plan?.name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  if (vendorNotFound) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Vendor Profile Not Found</h2>
          <p className="text-gray-600 mb-6">Please create a vendor profile first to manage subscriptions.</p>
          <Link
            to="/seller/laundry/create-profile"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
          >
            Create Vendor Profile
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Subscribers</h1>
          <p className="text-gray-600">Manage all your subscription customers</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Paused</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.paused}</p>
              </div>
              <Pause className="w-8 h-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Cancelled</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Monthly Revenue</p>
                <p className="text-2xl font-bold text-purple-600">₹{stats.totalRevenue || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-md p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, phone, or plan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              {['all', 'active', 'paused', 'cancelled', 'expired'].map(status => (
                <button
                  key={status}
                  onClick={() => setFilter(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all capitalize ${
                    filter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Subscriptions List */}
        {filteredSubscriptions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <Users className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No Subscriptions Found</h3>
            <p className="text-gray-500">
              {searchTerm 
                ? 'No subscriptions match your search criteria.'
                : 'You don\'t have any subscriptions yet. Share your subscription plans to get customers!'
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredSubscriptions.map(subscription => (
              <div key={subscription._id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{subscription.user?.name || 'Customer'}</h3>
                    <p className="text-sm text-gray-600">{subscription.plan?.name}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(subscription.status)}`}>
                    {subscription.status}
                  </span>
                </div>

                {/* Customer Contact */}
                <div className="space-y-2 mb-4">
                  {subscription.user?.email && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      <span>{subscription.user.email}</span>
                    </div>
                  )}
                  {subscription.user?.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{subscription.user.phone}</span>
                    </div>
                  )}
                </div>

                {/* Plan Details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Price</p>
                    <p className="text-lg font-bold text-gray-900">₹{subscription.plan?.price || 0}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Started</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(subscription.period?.startDate)}</p>
                  </div>
                </div>

                {/* Pickup Address */}
                {subscription.preferences?.defaultPickupAddress?.street && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 h-4 text-blue-600 mt-0.5" />
                      <div className="text-sm text-gray-700">
                        <p className="font-medium">{subscription.preferences.defaultPickupAddress.street}</p>
                        <p className="text-xs text-gray-600">
                          {subscription.preferences.defaultPickupAddress.area}, {subscription.preferences.defaultPickupAddress.city}
                        </p>
                        <p className="text-xs text-gray-600">
                          Contact: {subscription.preferences.defaultPickupAddress.contactName} - {subscription.preferences.defaultPickupAddress.contactPhone}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Usage Stats */}
                {subscription.usage?.currentMonth && subscription.status === 'active' && (
                  <div className="mb-4 p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-semibold text-gray-900">This Month</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Pickups</p>
                        <p className="font-bold text-gray-900">{subscription.usage.currentMonth.pickupsCompleted || 0}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Items</p>
                        <p className="font-bold text-gray-900">{subscription.usage.currentMonth.itemsCleaned || 0}</p>
                      </div>
                      {subscription.plan?.maxWeight && (
                        <div>
                          <p className="text-gray-500">Weight</p>
                          <p className="font-bold text-gray-900">
                            {subscription.usage.currentMonth.weightUsed || 0}/{subscription.plan.maxWeight}kg
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Dates */}
                <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Ends: {formatDate(subscription.period?.endDate)}</span>
                  </div>
                  {subscription.period?.nextRenewalDate && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Renewal: {formatDate(subscription.period.nextRenewalDate)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <button
                  onClick={() => navigate(`/seller/laundry/subscriptions/${subscription._id}`)}
                  className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Eye className="w-4 h-4" />
                  View Details & Manage
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

