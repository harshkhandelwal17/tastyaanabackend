import React, { useState, useEffect } from "react";
import {
  Send,
  Users,
  Globe,
  Bell,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Target,
  MessageSquare,
} from "lucide-react";
import { toast } from "react-hot-toast";

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    type: "general",
    targetType: "all", // all, specific, segment
    targetUsers: [],
    targetSegment: "all",
    scheduled: false,
    scheduledTime: "",
    requireInteraction: false,
    actions: [],
    redirectUrl: "/",
  });

  const notificationTypes = [
    { value: "general", label: "General", icon: "📢" },
    { value: "order_confirmed", label: "Order Confirmed", icon: "✅" },
    { value: "order_shipped", label: "Order Shipped", icon: "🚚" },
    { value: "order_delivered", label: "Order Delivered", icon: "📦" },
    { value: "promotion", label: "Promotion", icon: "🎉" },
    { value: "cart_reminder", label: "Cart Reminder", icon: "🛒" },
    { value: "new_product", label: "New Product", icon: "🆕" },
    { value: "price_drop", label: "Price Drop", icon: "💰" },
    { value: "restock", label: "Restock Alert", icon: "📦" },
  ];

  const targetSegments = [
    { value: "all", label: "All Users" },
    { value: "active", label: "Active Users" },
    { value: "inactive", label: "Inactive Users" },
    { value: "premium", label: "Premium Users" },
    { value: "new", label: "New Users" },
    { value: "cart_abandoned", label: "Cart Abandoned" },
  ];

  // Load notification history and users
  useEffect(() => {
    loadNotifications();
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      if (!token) {
        toast.error("You are not authenticated!");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api"}/admin/users`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        console.error("Failed to fetch users");
      }
    } catch (error) {
      console.error("Error loading users:", error);
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

  const loadNotifications = async () => {
    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");
      if (!token) {
        toast.error("You are not authenticated!");
        return;
      }
      console.log("token is ", token);
      if (!token) {
        toast.error("You are not authenticated!");
        return;
      }
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/notifications`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      setNotifications(data.notifications || []);
    } catch (error) {
      console.error("Error loading notifications:", error);
      toast.error("Failed to load notifications");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const addAction = () => {
    setFormData((prev) => ({
      ...prev,
      actions: [...prev.actions, { action: "", title: "" }],
    }));
  };

  const removeAction = (index) => {
    setFormData((prev) => ({
      ...prev,
      actions: prev.actions.filter((_, i) => i !== index),
    }));
  };

  const updateAction = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      actions: prev.actions.map((action, i) =>
        i === index ? { ...action, [field]: value } : action
      ),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const token =
        localStorage.getItem("token") || localStorage.getItem("authToken");
      if (!token) {
        toast.error("You are not authenticated!");
        return;
      }
      console.log("token is ", token);
      if (!token) {
        toast.error("You are not authenticated!");
        return;
      }

      // Update formData with selected users
      const submitData = {
        ...formData,
        targetUsers: formData.targetType === 'specific' ? selectedUsers : formData.targetUsers,
      };

      const response = await fetch(
        `${
          import.meta.env.VITE_BACKEND_URL || "http://localhost:5000/api"
        }/notifications/send`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(submitData),
        }
      );

      if (response.ok) {
        toast.success("Notification sent successfully!");
        setShowForm(false);
        setFormData({
          title: "",
          body: "",
          type: "general",
          targetType: "all",
          targetUsers: [],
          targetSegment: "all",
          scheduled: false,
          scheduledTime: "",
          requireInteraction: false,
          actions: [],
        });
        loadNotifications();
      } else {
        throw new Error("Failed to send notification");
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "scheduled":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTypeIcon = (type) => {
    const notificationType = notificationTypes.find((nt) => nt.value === type);
    return notificationType ? notificationType.icon : "📢";
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Notification Management
        </h1>
        <button
          onClick={() => setShowForm(true)}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center space-x-2"
        >
          <Send className="w-4 h-4" />
          <span>Send Notification</span>
        </button>
      </div>

      {/* Notification Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">Send Notification</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Notification title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {notificationTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.icon} {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message *
                </label>
                <textarea
                  name="body"
                  value={formData.body}
                  onChange={handleInputChange}
                  required
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="Notification message"
                />
              </div>

              {/* Target Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Audience *
                </label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="targetType"
                        value="all"
                        checked={formData.targetType === "all"}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <Globe className="w-4 h-4 mr-1" />
                      All Users
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="targetType"
                        value="segment"
                        checked={formData.targetType === "segment"}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <Target className="w-4 h-4 mr-1" />
                      User Segment
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="targetType"
                        value="specific"
                        checked={formData.targetType === "specific"}
                        onChange={handleInputChange}
                        className="mr-2"
                      />
                      <Users className="w-4 h-4 mr-1" />
                      Specific Users
                    </label>
                  </div>

                  {formData.targetType === "segment" && (
                    <select
                      name="targetSegment"
                      value={formData.targetSegment}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    >
                      {targetSegments.map((segment) => (
                        <option key={segment.value} value={segment.value}>
                          {segment.label}
                        </option>
                      ))}
                    </select>
                  )}

                  {formData.targetType === "specific" && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-medium text-gray-700">Select Users</h4>
                        <button
                          type="button"
                          onClick={handleSelectAll}
                          className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                          {selectedUsers.length === users.length ? 'Deselect All' : 'Select All'}
                        </button>
                      </div>
                      
                      <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto border">
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
                                  <span>📱 {user.subscriptionCount || 0} subscriptions</span>
                                  <span>•</span>
                                  <span>👤 {user.role}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-2 bg-blue-50 rounded-lg p-3">
                        <p className="text-sm text-blue-700">
                          Selected: <span className="font-semibold">{selectedUsers.length}</span> users
                        </p>
                        <p className="text-sm text-blue-700">
                          Total users: <span className="font-semibold">{users.length}</span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Redirect URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Redirect URL
                </label>
                <select
                  name="redirectUrl"
                  value={formData.redirectUrl}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="/">🏠 Homepage</option>
                  <option value="/profile">👤 Profile</option>
                  <option value="/orders">📦 Orders</option>
                  <option value="/cart">🛒 Cart</option>
                  <option value="/notifications">🔔 Notifications</option>
                  <option value="/offers">🎁 Offers</option>
                  <option value="/support">💬 Support</option>
                  <option value="/settings">⚙️ Settings</option>
                </select>
              </div>

              {/* Scheduling */}
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="scheduled"
                    checked={formData.scheduled}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Schedule for later
                </label>

                {formData.scheduled && (
                  <input
                    type="datetime-local"
                    name="scheduledTime"
                    value={formData.scheduledTime}
                    onChange={handleInputChange}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                )}
              </div>

              {/* Options */}
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="requireInteraction"
                    checked={formData.requireInteraction}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  Require user interaction
                </label>
              </div>

              {/* Action Buttons */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Action Buttons
                  </label>
                  <button
                    type="button"
                    onClick={addAction}
                    className="text-emerald-600 hover:text-emerald-700 text-sm"
                  >
                    + Add Action
                  </button>
                </div>

                {formData.actions.map((action, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="text"
                      placeholder="Action ID"
                      value={action.action}
                      onChange={(e) =>
                        updateAction(index, "action", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <input
                      type="text"
                      placeholder="Button Text"
                      value={action.title}
                      onChange={(e) =>
                        updateAction(index, "title", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => removeAction(index)}
                      className="text-red-600 hover:text-red-700 px-2"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center space-x-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span>{isLoading ? "Sending..." : "Send Notification"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notification History */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Notification History
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Recipients
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {notifications.map((notification, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-2xl">
                      {getTypeIcon(notification.type)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {notification.body}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {notification.targetType === "all"
                      ? "All Users"
                      : notification.targetType === "segment"
                      ? notification.targetSegment
                      : `${notification.targetUsers?.length || 0} Users`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(notification.status)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">
                        {notification.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(notification.sentAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {notification.recipientCount || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
