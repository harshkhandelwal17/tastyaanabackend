import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

const NotificationSender = () => {
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notificationData, setNotificationData] = useState({
    title: '',
    body: '',
    redirectUrl: '/',
    requireInteraction: false,
    actions: []
  });

  // Fetch all users
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    }
  };

  const handleUserSelect = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(user => user._id));
    }
  };

  const handleSendNotification = async () => {
    if (!notificationData.title || !notificationData.body) {
      toast.error('Please fill in title and body');
      return;
    }

    if (selectedUsers.length === 0) {
      toast.error('Please select at least one user');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: notificationData.title,
          body: notificationData.body,
          type: 'admin',
          targetType: 'specific',
          targetUsers: selectedUsers,
          redirectUrl: notificationData.redirectUrl,
          requireInteraction: notificationData.requireInteraction,
          actions: notificationData.actions
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(`Notification sent to ${result.results.sent} users!`);
        
        // Reset form
        setNotificationData({
          title: '',
          body: '',
          redirectUrl: '/',
          requireInteraction: false,
          actions: []
        });
        setSelectedUsers([]);
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">📤 Send Notification to Specific Users</h2>
      
      {/* Notification Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Notification Details */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">📝 Notification Details</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={notificationData.title}
              onChange={(e) => setNotificationData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Enter notification title..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <textarea
              value={notificationData.body}
              onChange={(e) => setNotificationData(prev => ({ ...prev, body: e.target.value }))}
              placeholder="Enter notification message..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Redirect URL
            </label>
            <select
              value={notificationData.redirectUrl}
              onChange={(e) => setNotificationData(prev => ({ ...prev, redirectUrl: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="/">🏠 Homepage</option>
              <option value="/profile">👤 Profile</option>
              <option value="/orders">📦 Orders</option>
              <option value="/cart">🛒 Cart</option>
              <option value="/notifications">🔔 Notifications</option>
              <option value="/offers">🎁 Offers</option>
              <option value="/support">💬 Support</option>
              <option value="/settings">⚙️ Settings</option>
              <option value="custom">🔗 Custom URL</option>
            </select>
          </div>

          {notificationData.redirectUrl === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Custom URL
              </label>
              <input
                type="text"
                value={notificationData.customUrl || ''}
                onChange={(e) => setNotificationData(prev => ({ ...prev, customUrl: e.target.value, redirectUrl: e.target.value }))}
                placeholder="Enter custom URL (e.g., /special-page)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div className="flex items-center">
            <input
              type="checkbox"
              id="requireInteraction"
              checked={notificationData.requireInteraction}
              onChange={(e) => setNotificationData(prev => ({ ...prev, requireInteraction: e.target.checked }))}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="requireInteraction" className="ml-2 block text-sm text-gray-700">
              Require user interaction (notification stays until clicked)
            </label>
          </div>
        </div>

        {/* Right Column - User Selection */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-700">👥 Select Users</h3>
            <button
              onClick={handleSelectAll}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <div className="space-y-2">
              {users.map(user => (
                <div key={user._id} className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded">
                  <input
                    type="checkbox"
                    id={user._id}
                    checked={selectedUsers.includes(user._id)}
                    onChange={() => handleUserSelect(user._id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div className="flex-1">
                    <label htmlFor={user._id} className="text-sm font-medium text-gray-700 cursor-pointer">
                      {user.name}
                    </label>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <div className="flex items-center space-x-2 text-xs text-gray-400">
                      <span>📱 {user.pushSubscriptions?.length || 0} subscriptions</span>
                      <span>•</span>
                      <span>👤 {user.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">📊 Selection Summary</h4>
            <p className="text-sm text-blue-700">
              Selected: <span className="font-semibold">{selectedUsers.length}</span> users
            </p>
            <p className="text-sm text-blue-700">
              Total users: <span className="font-semibold">{users.length}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Send Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSendNotification}
          disabled={loading || !notificationData.title || !notificationData.body || selectedUsers.length === 0}
          className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Sending...</span>
            </>
          ) : (
            <>
              <span>📤</span>
              <span>Send Notification</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default NotificationSender;
