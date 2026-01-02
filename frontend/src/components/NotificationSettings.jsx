import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  BellOff, 
  Settings, 
  CheckCircle, 
  AlertCircle,
  Smartphone,
  Mail,
  MessageSquare
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { toast } from 'react-hot-toast';

const NotificationSettings = () => {
  const {
    isSupported,
    permission,
    subscription,
    isLoading,
    requestPermission,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification
  } = useNotifications();

  const [settings, setSettings] = useState({
    orderUpdates: true,
    promotions: true,
    priceDrops: true,
    newProducts: true,
    cartReminders: true,
    general: true,
    email: true,
    sms: false
  });

  const [isSaving, setIsSaving] = useState(false);

  // Load user settings
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api'}/notifications/user/notification-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || settings);
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const handleSettingChange = (setting) => {
    setSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api'}/notifications/user/notification-settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ settings })
      });

      if (response.ok) {
        toast.success('Notification settings saved!');
      } else {
        throw new Error('Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast.error('Failed to save notification settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePermissionRequest = async () => {
    const granted = await requestPermission();
    if (granted) {
      await subscribeToPush();
    }
  };

  const handleUnsubscribe = async () => {
    await unsubscribeFromPush();
  };

  const handleTestNotification = async () => {
    await sendTestNotification();
  };

  const getPermissionStatus = () => {
    if (!isSupported) return { status: 'unsupported', message: 'Notifications not supported' };
    if (permission === 'granted') return { status: 'granted', message: 'Notifications enabled' };
    if (permission === 'denied') return { status: 'denied', message: 'Notifications blocked' };
    return { status: 'default', message: 'Notifications not requested' };
  };

  const permissionStatus = getPermissionStatus();

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-white" />
            <h1 className="text-xl font-semibold text-white">Notification Settings</h1>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Permission Status */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {permissionStatus.status === 'granted' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : permissionStatus.status === 'denied' ? (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                ) : (
                  <BellOff className="w-5 h-5 text-gray-500" />
                )}
                <div>
                  <p className="font-medium text-gray-900">Push Notifications</p>
                  <p className="text-sm text-gray-600">{permissionStatus.message}</p>
                </div>
              </div>
              
              {permissionStatus.status === 'granted' ? (
                <button
                  onClick={handleUnsubscribe}
                  disabled={isLoading}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 disabled:opacity-50 text-sm"
                >
                  {isLoading ? 'Disabling...' : 'Disable'}
                </button>
              ) : (
                <button
                  onClick={handlePermissionRequest}
                  disabled={isLoading || !isSupported}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 text-sm"
                >
                  {isLoading ? 'Enabling...' : 'Enable'}
                </button>
              )}
            </div>
          </div>

          {/* Test Notification */}
          {permissionStatus.status === 'granted' && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="font-medium text-gray-900">Test Notifications</p>
                    <p className="text-sm text-gray-600">Send a test notification to verify everything is working</p>
                  </div>
                </div>
                <button
                  onClick={handleTestNotification}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 text-sm"
                >
                  Send Test
                </button>
              </div>
            </div>
          )}

          {/* Notification Types */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Notification Types</h3>
            
            <div className="space-y-3">
              {[
                { key: 'orderUpdates', label: 'Order Updates', description: 'Order confirmations, shipping updates, delivery notifications' },
                { key: 'promotions', label: 'Promotions & Offers', description: 'Special deals, discounts, and promotional offers' },
                { key: 'priceDrops', label: 'Price Drops', description: 'Notifications when items in your wishlist go on sale' },
                { key: 'newProducts', label: 'New Products', description: 'Alerts about new products in categories you follow' },
                { key: 'cartReminders', label: 'Cart Reminders', description: 'Reminders about items left in your cart' },
                { key: 'general', label: 'General Updates', description: 'App updates, maintenance notifications, and general news' }
              ].map(({ key, label, description }) => (
                <div key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        id={key}
                        checked={settings[key]}
                        onChange={() => handleSettingChange(key)}
                        className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                      />
                      <label htmlFor={key} className="font-medium text-gray-900 cursor-pointer">
                        {label}
                      </label>
                    </div>
                    <p className="text-sm text-gray-600 ml-7">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Communication Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Communication Preferences</h3>
            
            <div className="space-y-3">
              {[
                { key: 'email', label: 'Email Notifications', description: 'Receive notifications via email', icon: Mail },
                { key: 'sms', label: 'SMS Notifications', description: 'Receive notifications via text message', icon: Smartphone }
              ].map(({ key, label, description, icon: Icon }) => (
                <div key={key} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5 text-gray-500" />
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          id={key}
                          checked={settings[key]}
                          onChange={() => handleSettingChange(key)}
                          className="w-4 h-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                        />
                        <label htmlFor={key} className="font-medium text-gray-900 cursor-pointer">
                          {label}
                        </label>
                      </div>
                      <p className="text-sm text-gray-600 ml-7">{description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4 border-t">
            <button
              onClick={saveSettings}
              disabled={isSaving}
              className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center space-x-2"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Settings className="w-4 h-4" />
              )}
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
