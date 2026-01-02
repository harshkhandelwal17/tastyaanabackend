import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Clock, 
  Package,
  Activity,
  TrendingUp,
  BarChart3,
  Truck,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  PhoneCall
} from 'lucide-react';
import laundryService from '../../../services/laundryService';

export default function VendorSubscriptionDetail() {
  const { subscriptionId } = useParams();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadSubscription();
  }, [subscriptionId]);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await laundryService.getVendorSubscription(subscriptionId);
      setSubscription(response?.data || response);
    } catch (error) {
      console.error('Error loading subscription:', error);
      setError(error.message || 'Failed to load subscription');
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

  const getUsagePercentage = (used, total) => {
    if (!total || total === 0) return 0;
    return Math.min(100, Math.round((used / total) * 100));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Subscription Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'The subscription you are looking for does not exist.'}</p>
          <button 
            onClick={() => navigate('/seller/laundry/subscriptions')} 
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all"
          >
            Back to Subscriptions
          </button>
        </div>
      </div>
    );
  }

  const usage = subscription.usage?.currentMonth || {};

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            to="/seller/laundry/subscriptions"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Subscriptions</span>
          </Link>
          
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{subscription.user?.name || 'Customer'}</h1>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${getStatusColor(subscription.status)}`}>
                    {subscription.status}
                  </span>
                </div>
                <p className="text-gray-600">{subscription.plan?.name}</p>
              </div>
              
              <div className="flex gap-2">
                {subscription.user?.phone && (
                  <a
                    href={`tel:${subscription.user.phone}`}
                    className="px-4 py-2 bg-green-100 text-green-800 rounded-xl font-medium hover:bg-green-200 transition-all flex items-center gap-2"
                  >
                    <PhoneCall className="w-4 h-4" />
                    Call
                  </a>
                )}
                {subscription.user?.email && (
                  <a
                    href={`mailto:${subscription.user.email}`}
                    className="px-4 py-2 bg-blue-100 text-blue-800 rounded-xl font-medium hover:bg-blue-200 transition-all flex items-center gap-2"
                  >
                    <Mail className="w-4 h-4" />
                    Email
                  </a>
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
              { id: 'customer', label: 'Customer Info', icon: User },
              { id: 'usage', label: 'Usage', icon: BarChart3 },
              { id: 'orders', label: 'Orders', icon: Truck }
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
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Plan Details</h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                      <span className="text-gray-600">Monthly Price</span>
                      <span className="text-2xl font-bold text-gray-900">₹{subscription.plan?.price || 0}</span>
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
                          <Clock className="w-5 h-5" />
                          <span className="text-sm font-medium">Next Renewal</span>
                        </div>
                        <p className="text-gray-900 font-semibold">{formatDate(subscription.period.nextRenewalDate)}</p>
                      </div>
                    )}

                    {subscription.plan?.maxWeight && (
                      <div className="p-4 bg-orange-50 rounded-xl">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-orange-600">Monthly Weight Limit</span>
                          <span className="text-sm text-gray-600">{subscription.plan.maxWeight} kg</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full transition-all"
                            style={{ width: `${getUsagePercentage(usage.weightUsed || 0, subscription.plan.maxWeight)}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {usage.weightUsed || 0} / {subscription.plan.maxWeight} kg used
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4">Usage This Month</h2>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Pickups</span>
                        <span className="font-bold">{usage.pickupsCompleted || 0}</span>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>Items Cleaned</span>
                        <span className="font-bold">{usage.itemsCleaned || 0}</span>
                      </div>
                    </div>
                    {subscription.plan?.maxWeight && (
                      <div>
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Weight Used</span>
                          <span className="font-bold">
                            {usage.weightUsed || 0} / {subscription.plan.maxWeight} kg
                          </span>
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
              </div>
            </div>
          )}

          {/* Customer Info Tab */}
          {activeTab === 'customer' && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Customer Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-lg font-semibold text-gray-900">{subscription.user?.name || 'N/A'}</p>
                  </div>
                  
                  {subscription.user?.email && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        Email
                      </label>
                      <p className="text-lg text-gray-900">{subscription.user.email}</p>
                    </div>
                  )}
                  
                  {subscription.user?.phone && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        Phone
                      </label>
                      <p className="text-lg text-gray-900">{subscription.user.phone}</p>
                    </div>
                  )}
                </div>

                {/* Pickup Address */}
                {subscription.preferences?.defaultPickupAddress?.street && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4" />
                      Pickup Address
                    </label>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="font-medium text-gray-900">{subscription.preferences.defaultPickupAddress.street}</p>
                      <p className="text-gray-600">{subscription.preferences.defaultPickupAddress.area}</p>
                      <p className="text-gray-600">
                        {subscription.preferences.defaultPickupAddress.city} - {subscription.preferences.defaultPickupAddress.pincode}
                      </p>
                      {subscription.preferences.defaultPickupAddress.landmark && (
                        <p className="text-sm text-gray-500 mt-2">
                          Landmark: {subscription.preferences.defaultPickupAddress.landmark}
                        </p>
                      )}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <p className="text-sm text-gray-600">
                          Contact: {subscription.preferences.defaultPickupAddress.contactName}
                        </p>
                        <p className="text-sm text-gray-600">
                          Phone: {subscription.preferences.defaultPickupAddress.contactPhone}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Preferences */}
                <div className="md:col-span-2">
                  <h3 className="font-semibold text-gray-900 mb-3">Preferences</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500">Preferred Time Slot</p>
                      <p className="font-medium text-gray-900 capitalize">
                        {subscription.preferences?.preferredTimeSlot || 'Not set'}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-500">Delivery Speed</p>
                      <p className="font-medium text-gray-900 capitalize">
                        {subscription.preferences?.preferredDeliverySpeed || 'Not set'}
                      </p>
                    </div>
                    {subscription.preferences?.specialInstructions && (
                      <div className="md:col-span-2 p-3 bg-gray-50 rounded-xl">
                        <p className="text-sm text-gray-500">Special Instructions</p>
                        <p className="text-gray-900">{subscription.preferences.specialInstructions}</p>
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
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Subscription Orders</h2>
              
              {usage.orders && usage.orders.length > 0 ? (
                <div className="space-y-4">
                  {usage.orders.map((order, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">Order #{order.orderNumber || 'N/A'}</p>
                          <p className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Speed: {order.deliverySpeed || 'N/A'}</span>
                        {order.pricing?.total && (
                          <span>Amount: ₹{order.pricing.total}</span>
                        )}
                      </div>
                      <button
                        onClick={() => navigate(`/seller/laundry/orders/${order._id}`)}
                        className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        View Order Details →
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No orders found for this subscription yet.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

