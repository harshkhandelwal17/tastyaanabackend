import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, 
  Loader2, 
  Zap,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Store
} from 'lucide-react';
import laundryService from '../../../services/laundryService';

export default function QuickServiceSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendorNotFound, setVendorNotFound] = useState(false);
  const [config, setConfig] = useState({
    enabled: false,
    minOrderValue: 200,
    maxWeight: 10,
    operatingHours: {
      start: '09:00',
      end: '19:00'
    },
    availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
    turnaroundTime: {
      min: 4,
      max: 8
    }
  });
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await laundryService.getMyVendor();
      const vendor = response?.data;
      
      if (vendor && vendor.quickServiceConfig) {
        setConfig({
          enabled: vendor.quickServiceConfig.enabled || false,
          minOrderValue: vendor.quickServiceConfig.minOrderValue || 200,
          maxWeight: vendor.quickServiceConfig.maxWeight || 10,
          operatingHours: vendor.quickServiceConfig.operatingHours || {
            start: '09:00',
            end: '19:00'
          },
          availableDays: vendor.quickServiceConfig.availableDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
          turnaroundTime: vendor.quickServiceConfig.turnaroundTime || {
            min: 4,
            max: 8
          }
        });
      } else {
        setVendorNotFound(true);
      }
    } catch (error) {
      // Handle 404 or "not found" errors gracefully
      if (error.isNotFound || error.status === 404 || error.message?.includes('not found') || error.response?.status === 404) {
        setVendorNotFound(true);
      } else {
        console.error('Error loading config:', error);
        setMessage({ type: 'error', text: error.message || 'Failed to load settings' });
      }
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      // Check if vendor exists before saving
      try {
        const vendorCheck = await laundryService.getMyVendor();
        if (!vendorCheck?.data) {
          setVendorNotFound(true);
          setMessage({ type: 'error', text: 'Vendor profile not found. Please create a vendor profile first.' });
          return;
        }
      } catch (checkError) {
        if (checkError.isNotFound || checkError.status === 404) {
          setVendorNotFound(true);
          setMessage({ type: 'error', text: 'Vendor profile not found. Please create a vendor profile first.' });
          return;
        }
      }
      
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        setMessage({ type: 'error', text: 'Authentication required. Please login again.' });
        return;
      }
      
      const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const apiURL = baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`;
      
      const response = await fetch(`${apiURL}/laundry/vendors/me/quick-service`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Quick service settings saved successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        loadConfig(); // Reload to get updated data
      } else {
        // Handle specific error cases
        if (response.status === 404 || data.message?.includes('not found')) {
          setVendorNotFound(true);
          setMessage({ type: 'error', text: 'Vendor profile not found. Please create a vendor profile first.' });
        } else if (response.status === 401 || response.status === 403) {
          setMessage({ type: 'error', text: 'Authentication failed. Please login again.' });
        } else {
          throw new Error(data.message || data.error || 'Failed to save settings');
        }
      }
    } catch (error) {
      console.error('Error saving config:', error);
      if (error.message?.includes('not found') || error.isNotFound) {
        setVendorNotFound(true);
        setMessage({ type: 'error', text: 'Vendor profile not found. Please create a vendor profile first.' });
      } else {
        setMessage({ type: 'error', text: error.message || 'Failed to save settings' });
      }
    } finally {
      setSaving(false);
    }
  };

  const days = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' }
  ];

  const toggleDay = (dayId) => {
    setConfig(prev => ({
      ...prev,
      availableDays: prev.availableDays.includes(dayId)
        ? prev.availableDays.filter(d => d !== dayId)
        : [...prev.availableDays, dayId]
    }));
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (vendorNotFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Vendor Profile Not Found</h2>
          <p className="text-gray-600 mb-6">You need to create a vendor profile first.</p>
          <button
            onClick={() => navigate('/seller/laundry/create-profile')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create Vendor Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quick Service Settings</h1>
          <p className="text-gray-600 mt-1">Configure quick service availability and settings</p>
        </div>
        <button
          onClick={saveConfig}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Settings
        </button>
      </div>

      {message.text && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Enable/Disable */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-xl ${config.enabled ? 'bg-yellow-100' : 'bg-gray-100'}`}>
              <Zap className={`w-6 h-6 ${config.enabled ? 'text-yellow-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Enable Quick Service</h2>
              <p className="text-gray-600 text-sm">Allow customers to book quick pickup and delivery</p>
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({...config, enabled: e.target.checked})}
              className="sr-only peer"
            />
            <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>
      </div>

      {config.enabled && (
        <>
          {/* Order Requirements */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Order Requirements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Order Value (₹)
                </label>
                <input
                  type="number"
                  value={config.minOrderValue}
                  onChange={(e) => setConfig({...config, minOrderValue: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum order value for quick service</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Weight (kg)
                </label>
                <input
                  type="number"
                  value={config.maxWeight}
                  onChange={(e) => setConfig({...config, maxWeight: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum weight accepted for quick service</p>
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Operating Hours
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={config.operatingHours.start}
                  onChange={(e) => setConfig({
                    ...config,
                    operatingHours: {...config.operatingHours, start: e.target.value}
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={config.operatingHours.end}
                  onChange={(e) => setConfig({
                    ...config,
                    operatingHours: {...config.operatingHours, end: e.target.value}
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Available Days */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Available Days
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {days.map(day => (
                <button
                  key={day.id}
                  onClick={() => toggleDay(day.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    config.availableDays.includes(day.id)
                      ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-gray-200 hover:border-gray-300 text-gray-600'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Turnaround Time */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Turnaround Time</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Hours
                </label>
                <input
                  type="number"
                  value={config.turnaroundTime.min}
                  onChange={(e) => setConfig({
                    ...config,
                    turnaroundTime: {...config.turnaroundTime, min: parseFloat(e.target.value) || 0}
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">Minimum hours for quick service delivery</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Hours
                </label>
                <input
                  type="number"
                  value={config.turnaroundTime.max}
                  onChange={(e) => setConfig({
                    ...config,
                    turnaroundTime: {...config.turnaroundTime, max: parseFloat(e.target.value) || 0}
                  })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
                <p className="text-xs text-gray-500 mt-1">Maximum hours for quick service delivery</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}