import React, { useState } from 'react';
import { CheckCircle, X, Users, TrendingUp, DollarSign, Calendar, Eye, UserPlus, UserMinus, Star, Filter, Plus, Edit, Trash2, Save } from 'lucide-react';

const VendorSubscriptionDashboard = () => {
  const [activeView, setActiveView] = useState('overview');
  const [filterPlan, setFilterPlan] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubscriber, setEditingSubscriber] = useState(null);

  // Sample subscription data
  const subscriptionStats = {
    totalSubscribers: 1247,
    activeSubscribers: 1158,
    monthlyRevenue: 85640,
    growthRate: 12.5,
    newThisMonth: 89,
    cancelledThisMonth: 23
  };

  const planBreakdown = [
    { plan: 'Basic Plan', subscribers: 456, revenue: 22800, price: 50 },
    { plan: 'Premium Plan', subscribers: 578, revenue: 57800, price: 100 },
    { plan: 'Enterprise Plan', subscribers: 124, revenue: 37200, price: 300 },
    { plan: 'Free Trial', subscribers: 89, revenue: 0, price: 0 }
  ];

  const [subscribers, setSubscribers] = useState([
    { id: 1, name: 'Rajesh Kumar', email: 'rajesh@email.com', plan: 'Premium Plan', joinDate: '2024-09-10', status: 'active', avatar: 'RK' },
    { id: 2, name: 'Priya Sharma', email: 'priya@email.com', plan: 'Basic Plan', joinDate: '2024-09-09', status: 'active', avatar: 'PS' },
    { id: 3, name: 'Amit Singh', email: 'amit@email.com', plan: 'Enterprise Plan', joinDate: '2024-09-08', status: 'active', avatar: 'AS' },
    { id: 4, name: 'Sneha Patel', email: 'sneha@email.com', plan: 'Premium Plan', joinDate: '2024-09-07', status: 'pending', avatar: 'SP' },
    { id: 5, name: 'Vikram Gupta', email: 'vikram@email.com', plan: 'Basic Plan', joinDate: '2024-09-06', status: 'active', avatar: 'VG' },
    { id: 6, name: 'Anita Joshi', email: 'anita@email.com', plan: 'Premium Plan', joinDate: '2024-09-05', status: 'cancelled', avatar: 'AJ' }
  ]);

  const [newSubscriber, setNewSubscriber] = useState({
    name: '',
    email: '',
    plan: '',
    status: 'active'
  });

  const plans = ['Basic Plan', 'Premium Plan', 'Enterprise Plan', 'Free Trial'];
  const statuses = ['active', 'pending', 'cancelled'];

  const filteredSubscribers = subscribers.filter(subscriber => 
    filterPlan === 'all' || subscriber.plan === filterPlan
  );

  const generateAvatar = (name) => {
    const names = name.trim().split(' ');
    return names.length > 1 ? names[0][0] + names[1][0] : name.substring(0, 2);
  };

  const handleAddSubscriber = () => {
    if (!newSubscriber.name || !newSubscriber.email || !newSubscriber.plan) {
      alert('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newSubscriber.email)) {
      alert('Please enter a valid email address');
      return;
    }

    const subscriber = {
      id: Date.now(),
      name: newSubscriber.name.trim(),
      email: newSubscriber.email.trim().toLowerCase(),
      plan: newSubscriber.plan,
      status: newSubscriber.status,
      joinDate: new Date().toISOString().split('T')[0],
      avatar: generateAvatar(newSubscriber.name)
    };

    setSubscribers([...subscribers, subscriber]);
    setNewSubscriber({ name: '', email: '', plan: '', status: 'active' });
    setShowAddModal(false);
  };

  const handleEditSubscriber = (subscriber) => {
    setEditingSubscriber({ ...subscriber });
    setShowEditModal(true);
  };

  const handleUpdateSubscriber = () => {
    if (!editingSubscriber.name || !editingSubscriber.email || !editingSubscriber.plan) {
      alert('Please fill in all required fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(editingSubscriber.email)) {
      alert('Please enter a valid email address');
      return;
    }

    const updatedSubscriber = {
      ...editingSubscriber,
      name: editingSubscriber.name.trim(),
      email: editingSubscriber.email.trim().toLowerCase(),
      avatar: generateAvatar(editingSubscriber.name)
    };

    setSubscribers(subscribers.map(s => s.id === editingSubscriber.id ? updatedSubscriber : s));
    setShowEditModal(false);
    setEditingSubscriber(null);
  };

  const handleDeleteSubscriber = (id) => {
    if (confirm('Are you sure you want to delete this subscriber?')) {
      setSubscribers(subscribers.filter(s => s.id !== id));
    }
  };

  const resetAddForm = () => {
    setNewSubscriber({ name: '', email: '', plan: '', status: 'active' });
    setShowAddModal(false);
  };

  const resetEditForm = () => {
    setEditingSubscriber(null);
    setShowEditModal(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'pending': return 'bg-yellow-100 text-yellow-700';
      case 'cancelled': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPlanColor = (plan) => {
    switch (plan) {
      case 'Basic Plan': return 'bg-blue-100 text-blue-700';
      case 'Premium Plan': return 'bg-purple-100 text-purple-700';
      case 'Enterprise Plan': return 'bg-orange-100 text-orange-700';
      case 'Free Trial': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription Management</h1>
          <p className="text-gray-600">Track and manage your subscriber base and revenue</p>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveView('overview')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'overview' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveView('subscribers')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeView === 'subscribers' 
                ? 'bg-white text-gray-900 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Subscribers
          </button>
        </div>

        {activeView === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Subscribers</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{subscriptionStats.totalSubscribers.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600 font-medium">+{subscriptionStats.growthRate}%</span>
                  <span className="text-gray-600 ml-1">from last month</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Subscribers</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{subscriptionStats.activeSubscribers.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <span className="text-gray-600">
                    {Math.round((subscriptionStats.activeSubscribers / subscriptionStats.totalSubscribers) * 100)}% of total
                  </span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">₹{subscriptionStats.monthlyRevenue.toLocaleString()}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <DollarSign className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <UserPlus className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-green-600 font-medium">+{subscriptionStats.newThisMonth}</span>
                  <span className="text-gray-600 ml-1">new this month</span>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl border shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Churn Rate</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {Math.round((subscriptionStats.cancelledThisMonth / subscriptionStats.totalSubscribers) * 100)}%
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-full">
                    <UserMinus className="w-6 h-6 text-red-600" />
                  </div>
                </div>
                <div className="flex items-center mt-4 text-sm">
                  <span className="text-red-600 font-medium">{subscriptionStats.cancelledThisMonth}</span>
                  <span className="text-gray-600 ml-1">cancelled this month</span>
                </div>
              </div>
            </div>

            {/* Plan Breakdown */}
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Subscription Plans Breakdown</h3>
              <div className="space-y-4">
                {planBreakdown.map((plan, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`px-3 py-1 rounded-full text-sm font-medium ${getPlanColor(plan.plan)}`}>
                        {plan.plan}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{plan.subscribers} subscribers</p>
                        <p className="text-sm text-gray-600">₹{plan.price}/month each</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₹{plan.revenue.toLocaleString()}</p>
                      <p className="text-sm text-gray-600">monthly revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeView === 'subscribers' && (
          <div className="space-y-6">
            {/* Subscribers List */}
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Subscribers Management</h3>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
                >
                  <Plus size={16} />
                  Add Subscriber
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <select
                  value={filterPlan}
                  onChange={(e) => setFilterPlan(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Plans</option>
                  <option value="Basic Plan">Basic Plan</option>
                  <option value="Premium Plan">Premium Plan</option>
                  <option value="Enterprise Plan">Enterprise Plan</option>
                  <option value="Free Trial">Free Trial</option>
                </select>
              </div>

              <div className="space-y-4">
                {filteredSubscribers.map((subscriber) => (
                  <div key={subscriber.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {subscriber.avatar}
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{subscriber.name}</h4>
                        <p className="text-sm text-gray-600">{subscriber.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPlanColor(subscriber.plan)}`}>
                          {subscriber.plan}
                        </span>
                      </div>
                      
                      <div className="text-center">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(subscriber.status)}`}>
                          {subscriber.status}
                        </span>
                      </div>
                      
                      <div className="text-right min-w-24">
                        <p className="text-sm text-gray-600">Joined</p>
                        <p className="text-sm font-medium text-gray-900">{subscriber.joinDate}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => handleEditSubscriber(subscriber)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit subscriber"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteSubscriber(subscriber.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete subscriber"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Showing {filteredSubscribers.length} of {subscribers.length} subscribers
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Subscriber Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Add New Subscriber</h3>
              <button 
                onClick={resetAddForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={newSubscriber.name}
                  onChange={(e) => setNewSubscriber({...newSubscriber, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={newSubscriber.email}
                  onChange={(e) => setNewSubscriber({...newSubscriber, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription Plan *
                </label>
                <select
                  value={newSubscriber.plan}
                  onChange={(e) => setNewSubscriber({...newSubscriber, plan: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a plan</option>
                  {plans.map(plan => (
                    <option key={plan} value={plan}>{plan}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={newSubscriber.status}
                  onChange={(e) => setNewSubscriber({...newSubscriber, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={resetAddForm}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddSubscriber}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Add Subscriber
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subscriber Modal */}
      {showEditModal && editingSubscriber && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Edit Subscriber</h3>
              <button 
                onClick={resetEditForm}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={editingSubscriber.name}
                  onChange={(e) => setEditingSubscriber({...editingSubscriber, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={editingSubscriber.email}
                  onChange={(e) => setEditingSubscriber({...editingSubscriber, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription Plan *
                </label>
                <select
                  value={editingSubscriber.plan}
                  onChange={(e) => setEditingSubscriber({...editingSubscriber, plan: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a plan</option>
                  {plans.map(plan => (
                    <option key={plan} value={plan}>{plan}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={editingSubscriber.status}
                  onChange={(e) => setEditingSubscriber({...editingSubscriber, status: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={resetEditForm}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateSubscriber}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Update Subscriber
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorSubscriptionDashboard;