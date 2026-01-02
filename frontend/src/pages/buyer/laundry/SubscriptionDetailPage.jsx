import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  CreditCard,
  Package,
  TrendingUp,
  BarChart3,
  Settings,
  Edit,
  Pause,
  Play,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  Bell,
  DollarSign,
  Activity,
  Truck,
  RefreshCw
} from 'lucide-react';
import laundryService from '../../../services/laundryService';

export const SubscriptionDetailPage = () => {
  const { subscriptionId } = useParams();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // overview, usage, payments, settings

  useEffect(() => {
    loadSubscription();
  }, [subscriptionId]);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await laundryService.getSubscription(subscriptionId);
      setSubscription(response?.data || response);
    } catch (error) {
      console.error('Error loading subscription:', error);
      setError(error.message || 'Failed to load subscription');
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async () => {
    if (!window.confirm('Are you sure you want to pause this subscription?')) {
      return;
    }
    
    try {
      await laundryService.pauseSubscription(subscriptionId);
      alert('Subscription paused successfully');
      loadSubscription();
    } catch (error) {
      console.error('Error pausing subscription:', error);
      alert('Failed to pause subscription. Please try again.');
    }
  };

  const handleResume = async () => {
    try {
      await laundryService.resumeSubscription(subscriptionId);
      alert('Subscription resumed successfully');
      loadSubscription();
    } catch (error) {
      console.error('Error resuming subscription:', error);
      alert('Failed to resume subscription. Please try again.');
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this subscription? This action cannot be undone.')) {
      return;
    }
    
    try {
      await laundryService.cancelSubscription(subscriptionId);
      alert('Subscription cancelled successfully');
      navigate('/laundry/subscriptions');
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert('Failed to cancel subscription. Please try again.');
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

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
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

  const calculateDaysRemaining = () => {
    if (!subscription?.period?.endDate) return 0;
    const end = new Date(subscription.period.endDate);
    const now = new Date();
    const diff = end - now;
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const getUsagePercentage = (used, total) => {
    if (!total || total === 0) return 0;
    return Math.min(100, Math.round((used / total) * 100));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The subscription you are looking for does not exist.'}</p>
          <button 
            onClick={() => navigate('/laundry/subscriptions')} 
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
          >
            Back to Subscriptions
          </button>
        </div>
      </div>
    );
  }

  const usage = subscription.usage?.currentMonth || {};
  const daysRemaining = calculateDaysRemaining();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/laundry/subscriptions')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Subscriptions</span>
          </button>
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{subscription.plan?.name}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(subscription.status)}`}>
                    {subscription.status}
                  </span>
                </div>
                <p className="text-gray-600">{subscription.vendor?.name || 'Vendor'}</p>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                {subscription.status === 'active' && (
                  <>
                    <button
                      onClick={() => navigate(`/laundry/subscriptions/${subscriptionId}/order`)}
                      className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      <Package className="w-4 h-4" />
                      Create Order
                    </button>
                    <button
                      onClick={handlePause}
                      className="px-4 py-2 bg-yellow-100 text-yellow-800 rounded-xl font-medium hover:bg-yellow-200 transition-all flex items-center gap-2"
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </button>
                    <button
                      onClick={() => navigate(`/laundry/subscriptions/${subscriptionId}/preferences`)}
                      className="px-4 py-2 bg-blue-100 text-blue-800 rounded-xl font-medium hover:bg-blue-200 transition-all flex items-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-red-100 text-red-800 rounded-xl font-medium hover:bg-red-200 transition-all flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </>
                )}
                {subscription.status === 'paused' && (
                  <>
                    <button
                      onClick={handleResume}
                      className="px-4 py-2 bg-green-100 text-green-800 rounded-xl font-medium hover:bg-green-200 transition-all flex items-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Resume
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 bg-red-100 text-red-800 rounded-xl font-medium hover:bg-red-200 transition-all flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'overview', label: 'Overview', icon: Package },
              { id: 'usage', label: 'Usage', icon: BarChart3 },
              { id: 'payments', label: 'Payments', icon: CreditCard },
              { id: 'settings', label: 'Settings', icon: Settings }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Plan Details */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Plan Details</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">Price</span>
                      <span className="text-2xl font-bold text-gray-900">₹{subscription.plan?.price}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-xl">
                        <div className="flex items-center gap-2 text-blue-600 mb-2">
                          <Calendar className="w-5 h-5" />
                          <span className="text-sm font-medium">Start Date</span>
                        </div>
                        <p className="text-gray-900 font-semibold">{formatDate(subscription.period?.startDate)}</p>
                      </div>
                      
                      <div className="p-4 bg-purple-50 rounded-xl">
                        <div className="flex items-center gap-2 text-purple-600 mb-2">
                          <Calendar className="w-5 h-5" />
                          <span className="text-sm font-medium">End Date</span>
                        </div>
                        <p className="text-gray-900 font-semibold">{formatDate(subscription.period?.endDate)}</p>
                      </div>
                    </div>

                    {subscription.period?.nextRenewalDate && (
                      <div className="p-4 bg-green-50 rounded-xl">
                        <div className="flex items-center gap-2 text-green-600 mb-2">
                          <RefreshCw className="w-5 h-5" />
                          <span className="text-sm font-medium">Next Renewal</span>
                        </div>
                        <p className="text-gray-900 font-semibold">{formatDate(subscription.period.nextRenewalDate)}</p>
                        <p className="text-sm text-gray-600 mt-1">{daysRemaining} days remaining</p>
                      </div>
                    )}

                    {subscription.plan?.maxWeight && (
                      <div className="p-4 bg-orange-50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-orange-600">Monthly Weight Limit</span>
                          <span className="text-sm text-gray-600">{subscription.plan.maxWeight} kg</span>
                        </div>
                      </div>
                    )}

                    {/* Plan Features */}
                    {subscription.plan?.features && (
                      <div className="mt-4">
                        <h3 className="font-semibold text-gray-900 mb-3">Plan Features</h3>
                        <div className="grid grid-cols-2 gap-2">
                          {subscription.plan.features.unlimitedPickups && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Unlimited Pickups
                            </div>
                          )}
                          {subscription.plan.features.priority && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              Priority Service
                            </div>
                          )}
                          {subscription.plan.features.vipSupport && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              VIP Support
                            </div>
                          )}
                          {subscription.plan.features.freeDryClean > 0 && (
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              {subscription.plan.features.freeDryClean} Free Dry Clean
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Pickup Address */}
                {subscription.preferences?.defaultPickupAddress?.street && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Pickup Address</h2>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-blue-600 mt-1" />
                      <div className="text-gray-700">
                        <p className="font-medium">{subscription.preferences.defaultPickupAddress.street}</p>
                        <p>{subscription.preferences.defaultPickupAddress.area}</p>
                        <p>{subscription.preferences.defaultPickupAddress.city} - {subscription.preferences.defaultPickupAddress.pincode}</p>
                        {subscription.preferences.defaultPickupAddress.landmark && (
                          <p className="text-sm text-gray-500 mt-1">Landmark: {subscription.preferences.defaultPickupAddress.landmark}</p>
                        )}
                        <p className="text-sm text-gray-500 mt-2">
                          Contact: {subscription.preferences.defaultPickupAddress.contactName} - {subscription.preferences.defaultPickupAddress.contactPhone}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h2>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Pickups</span>
                        <span>{usage.pickupsCompleted || 0}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Items Cleaned</span>
                        <span>{usage.itemsCleaned || 0}</span>
                      </div>
                    </div>
                    {subscription.plan?.maxWeight && (
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Weight Used</span>
                          <span>{usage.weightUsed || 0} / {subscription.plan.maxWeight} kg</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${getUsagePercentage(usage.weightUsed || 0, subscription.plan.maxWeight)}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Billing Info */}
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Billing</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Method</span>
                      <span className="font-medium">{subscription.billing?.paymentMethod?.toUpperCase() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Auto-renewal</span>
                      <span className={`font-medium ${subscription.billing?.autoRenewal ? 'text-green-600' : 'text-gray-600'}`}>
                        {subscription.billing?.autoRenewal ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                    {subscription.billing?.nextPayment && (
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex justify-between mb-1">
                          <span className="text-gray-600">Next Payment</span>
                          <span className="font-bold text-gray-900">₹{subscription.billing.nextPayment.amount}</span>
                        </div>
                        <p className="text-sm text-gray-500">{formatDate(subscription.billing.nextPayment.dueDate)}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Usage Tab */}
          {activeTab === 'usage' && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Usage Statistics</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="text-sm text-blue-600 mb-1">Pickups Completed</div>
                  <div className="text-2xl font-bold text-gray-900">{usage.pickupsCompleted || 0}</div>
                </div>
                <div className="p-4 bg-green-50 rounded-xl">
                  <div className="text-sm text-green-600 mb-1">Items Cleaned</div>
                  <div className="text-2xl font-bold text-gray-900">{usage.itemsCleaned || 0}</div>
                </div>
                {subscription.plan?.maxWeight && (
                  <div className="p-4 bg-orange-50 rounded-xl">
                    <div className="text-sm text-orange-600 mb-1">Weight Used</div>
                    <div className="text-2xl font-bold text-gray-900">{usage.weightUsed || 0} kg</div>
                    <div className="text-xs text-gray-500 mt-1">of {subscription.plan.maxWeight} kg</div>
                  </div>
                )}
                <div className="p-4 bg-purple-50 rounded-xl">
                  <div className="text-sm text-purple-600 mb-1">Quick Services</div>
                  <div className="text-2xl font-bold text-gray-900">{usage.quickServicesUsed || 0}</div>
                  {subscription.plan?.features?.quickServiceQuota > 0 && (
                    <div className="text-xs text-gray-500 mt-1">of {subscription.plan.features.quickServiceQuota}</div>
                  )}
                </div>
              </div>

              {/* Usage Progress Bars */}
              {subscription.plan?.maxWeight && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Weight Usage</span>
                    <span>{usage.weightUsed || 0} / {subscription.plan.maxWeight} kg ({getUsagePercentage(usage.weightUsed || 0, subscription.plan.maxWeight)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-4 rounded-full transition-all"
                      style={{ width: `${getUsagePercentage(usage.weightUsed || 0, subscription.plan.maxWeight)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Recent Orders */}
              {usage.orders && usage.orders.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Recent Orders</h3>
                  <div className="space-y-2">
                    {usage.orders.slice(0, 5).map((order, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium text-gray-900">{order.orderNumber || 'N/A'}</p>
                          <p className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payments Tab */}
          {activeTab === 'payments' && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Payment History</h2>
              
              {subscription.billing?.lastPayment && (
                <div className="mb-6 p-4 bg-gray-50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-900">Last Payment</span>
                    <span className="text-2xl font-bold text-gray-900">₹{subscription.billing.lastPayment.amount}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{formatDate(subscription.billing.lastPayment.date)}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      subscription.billing.lastPayment.status === 'success' ? 'bg-green-100 text-green-800' :
                      subscription.billing.lastPayment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {subscription.billing.lastPayment.status}
                    </span>
                  </div>
                </div>
              )}

              {subscription.billing?.nextPayment && (
                <div className="p-4 bg-blue-50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-900">Next Payment</span>
                    <span className="text-2xl font-bold text-blue-600">₹{subscription.billing.nextPayment.amount}</span>
                  </div>
                  <p className="text-sm text-gray-600">Due on {formatDate(subscription.billing.nextPayment.dueDate)}</p>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Subscription Settings</h2>
              
              <div className="space-y-6">
                {/* Preferences */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Preferences</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-700">Preferred Time Slot</span>
                      <span className="font-medium">{subscription.preferences?.preferredTimeSlot || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-700">Delivery Speed</span>
                      <span className="font-medium capitalize">{subscription.preferences?.preferredDeliverySpeed || 'Not set'}</span>
                    </div>
                    {subscription.preferences?.specialInstructions && (
                      <div className="p-3 bg-gray-50 rounded-xl">
                        <span className="text-gray-700 block mb-1">Special Instructions</span>
                        <p className="text-sm text-gray-600">{subscription.preferences.specialInstructions}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Notifications */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Notifications</h3>
                  <div className="space-y-2">
                    {subscription.preferences?.notifications && Object.entries(subscription.preferences.notifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                        <span className="text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {value ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Billing Settings */}
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Billing Settings</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-700">Auto-renewal</span>
                      <button
                        onClick={async () => {
                          try {
                            await laundryService.toggleAutoRenewal(subscriptionId);
                            loadSubscription();
                          } catch (error) {
                            alert('Failed to update auto-renewal');
                          }
                        }}
                        className={`px-4 py-2 rounded-xl font-medium transition-all ${
                          subscription.billing?.autoRenewal
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {subscription.billing?.autoRenewal ? 'Enabled' : 'Disabled'}
                      </button>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <span className="text-gray-700">Payment Method</span>
                      <span className="font-medium uppercase">{subscription.billing?.paymentMethod || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

