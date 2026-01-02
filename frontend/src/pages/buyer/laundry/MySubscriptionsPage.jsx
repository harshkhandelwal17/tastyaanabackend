import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Package, 
  Calendar, 
  Clock, 
  MapPin, 
  CreditCard,
  Pause,
  Play,
  X,
  Edit,
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2,
  TrendingUp,
  Bell,
  Settings,
  Activity
} from 'lucide-react';
import laundryService from '../../../services/laundryService';

export const MySubscriptionsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, active, paused, cancelled, expired

  useEffect(() => {
    loadSubscriptions();
    
    // Show success message if redirected from subscription creation
    if (location.state?.message) {
      alert(location.state.message);
      // Clear the message from state
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await laundryService.getUserSubscriptions();
      console.log('Subscriptions API Response:', response);
      
      // Backend returns: { success: true, count: X, data: [subscriptions array] }
      // Service interceptor returns response.data, so we get: { success: true, count: X, data: [subscriptions array] }
      const subs = response?.data || response?.subscriptions || [];
      
      console.log('Loaded subscriptions:', subs.length, subs);
      setSubscriptions(Array.isArray(subs) ? subs : []);
    } catch (error) {
      console.error('Error loading subscriptions:', error);
      setSubscriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (subscriptionId) => {
    if (!window.confirm('Are you sure you want to pause this subscription?')) {
      return;
    }
    
    try {
      await laundryService.pauseSubscription(subscriptionId);
      alert('Subscription paused successfully');
      loadSubscriptions();
    } catch (error) {
      console.error('Error pausing subscription:', error);
      alert('Failed to pause subscription. Please try again.');
    }
  };

  const handleResume = async (subscriptionId) => {
    try {
      await laundryService.resumeSubscription(subscriptionId);
      alert('Subscription resumed successfully');
      loadSubscriptions();
    } catch (error) {
      console.error('Error resuming subscription:', error);
      alert('Failed to resume subscription. Please try again.');
    }
  };

  const handleCancel = async (subscriptionId) => {
    if (!window.confirm('Are you sure you want to cancel this subscription? This action cannot be undone.')) {
      return;
    }
    
    try {
      await laundryService.cancelSubscription(subscriptionId);
      alert('Subscription cancelled successfully');
      loadSubscriptions();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
    }
  };

  const handleUpdatePreferences = (subscriptionId) => {
    navigate(`/laundry/subscriptions/${subscriptionId}/preferences`);
  };

  const filteredSubscriptions = subscriptions.filter(sub => {
    if (filter === 'all') return true;
    return sub.status === filter;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading subscriptions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/laundry')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to Home
          </button>
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Subscriptions</h1>
            <p className="text-gray-600">Manage your laundry subscription plans</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'active', 'paused', 'cancelled', 'expired'].map(status => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-xl font-medium transition-all capitalize ${
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

        {/* Subscriptions List */}
        {filteredSubscriptions.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <Package className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">No subscriptions found</h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all' 
                ? "You don't have any subscriptions yet. Browse plans to get started!"
                : `No ${filter} subscriptions found.`
              }
            </p>
            {filter === 'all' && (
              <button
                onClick={() => navigate('/laundry/plans')}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg transition-all"
              >
                Browse Plans
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredSubscriptions.map(subscription => (
              <div key={subscription._id} className="bg-white rounded-2xl shadow-lg p-6">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{subscription.plan?.name}</h3>
                    <p className="text-sm text-gray-600">{subscription.vendor?.name || 'Vendor'}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(subscription.status)}`}>
                    {subscription.status}
                  </span>
                </div>

                {/* Plan Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl">
                    <span className="text-gray-600 font-medium">Price</span>
                    <span className="text-xl font-bold text-gray-900">₹{subscription.plan?.price || 0}</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 p-2 bg-gray-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <div>
                        <div className="text-xs text-gray-500">Started</div>
                        <div className="font-medium">{formatDate(subscription.period?.startDate)}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-600 p-2 bg-gray-50 rounded-lg">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <div>
                        <div className="text-xs text-gray-500">Ends</div>
                        <div className="font-medium">{formatDate(subscription.period?.endDate)}</div>
                      </div>
                    </div>
                  </div>

                  {subscription.period?.nextRenewalDate && subscription.status === 'active' && (
                    <div className="flex items-center gap-2 text-sm p-2 bg-green-50 rounded-lg">
                      <Clock className="w-4 h-4 text-green-600" />
                      <div>
                        <div className="text-xs text-gray-500">Next Renewal</div>
                        <div className="font-medium text-green-700">{formatDate(subscription.period.nextRenewalDate)}</div>
                      </div>
                    </div>
                  )}

                  {/* Usage Stats */}
                  {subscription.usage?.currentMonth && subscription.status === 'active' && (
                    <div className="mt-4 p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-blue-600" />
                        Usage This Month
                      </h4>
                      <div className="space-y-3 text-sm">
                        {subscription.plan?.maxWeight && (
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-gray-600">Weight Used</span>
                              <span className="font-medium text-gray-900">
                                {subscription.usage.currentMonth.weightUsed || 0} / {subscription.plan.maxWeight} kg
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                                style={{ 
                                  width: `${Math.min(100, Math.round(((subscription.usage.currentMonth.weightUsed || 0) / subscription.plan.maxWeight) * 100))}%` 
                                }}
                              />
                            </div>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="p-2 bg-white rounded-lg">
                            <div className="text-xs text-gray-500">Pickups</div>
                            <div className="text-lg font-bold text-gray-900">{subscription.usage.currentMonth.pickupsCompleted || 0}</div>
                          </div>
                          <div className="p-2 bg-white rounded-lg">
                            <div className="text-xs text-gray-500">Items</div>
                            <div className="text-lg font-bold text-gray-900">{subscription.usage.currentMonth.itemsCleaned || 0}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Pickup Address */}
                  {subscription.preferences?.defaultPickupAddress?.street && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mt-0.5" />
                      <div>
                        <p className="font-medium">{subscription.preferences.defaultPickupAddress.street}</p>
                        <p>{subscription.preferences.defaultPickupAddress.area}, {subscription.preferences.defaultPickupAddress.city}</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-gray-200">
                  {subscription.status === 'active' && (
                    <>
                      <button
                        onClick={() => handlePause(subscription._id)}
                        className="flex-1 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-xl font-medium hover:bg-yellow-200 transition-all flex items-center justify-center gap-2"
                      >
                        <Pause className="w-4 h-4" />
                        Pause
                      </button>
                      <button
                        onClick={() => handleUpdatePreferences(subscription._id)}
                        className="flex-1 px-4 py-2 bg-blue-100 text-blue-800 rounded-xl font-medium hover:bg-blue-200 transition-all flex items-center justify-center gap-2"
                      >
                        <Settings className="w-4 h-4" />
                        Settings
                      </button>
                      <button
                        onClick={() => handleCancel(subscription._id)}
                        className="flex-1 px-4 py-2 bg-red-100 text-red-800 rounded-xl font-medium hover:bg-red-200 transition-all flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </>
                  )}
                  
                  {subscription.status === 'paused' && (
                    <>
                      <button
                        onClick={() => handleResume(subscription._id)}
                        className="flex-1 px-4 py-2 bg-green-100 text-green-800 rounded-xl font-medium hover:bg-green-200 transition-all flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        Resume
                      </button>
                      <button
                        onClick={() => handleCancel(subscription._id)}
                        className="flex-1 px-4 py-2 bg-red-100 text-red-800 rounded-xl font-medium hover:bg-red-200 transition-all flex items-center justify-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => navigate(`/laundry/subscriptions/${subscription._id}`)}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

