import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, 
  Loader2, 
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle2,
  Plus,
  X,
  Store
} from 'lucide-react';
import laundryService from '../../../services/laundryService';

export default function ScheduledServiceSettings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [vendorNotFound, setVendorNotFound] = useState(false);
  const [config, setConfig] = useState({
    enabled: true,
    advanceBookingDays: 7,
    timeSlots: [
      { timeSlot: 'morning', available: true, maxCapacity: 10 },
      { timeSlot: 'afternoon', available: true, maxCapacity: 10 },
      { timeSlot: 'evening', available: true, maxCapacity: 10 }
    ]
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
      
      if (vendor && vendor.scheduledServiceConfig) {
        setConfig({
          enabled: vendor.scheduledServiceConfig.enabled !== false,
          advanceBookingDays: vendor.scheduledServiceConfig.advanceBookingDays || 7,
          timeSlots: vendor.scheduledServiceConfig.timeSlots || [
            { timeSlot: 'morning', available: true, maxCapacity: 10 },
            { timeSlot: 'afternoon', available: true, maxCapacity: 10 },
            { timeSlot: 'evening', available: true, maxCapacity: 10 }
          ]
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
      
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const apiURL = baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`;
      
      const response = await fetch(`${apiURL}/laundry/vendors/me/scheduled-service`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Scheduled service settings saved successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        loadConfig(); // Reload to get updated data
      } else {
        throw new Error(data.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const updateTimeSlot = (index, field, value) => {
    setConfig(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.map((slot, idx) => 
        idx === index ? { ...slot, [field]: field === 'available' ? value : parseFloat(value) || 0 } : slot
      )
    }));
  };

  const addTimeSlot = () => {
    setConfig(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, { timeSlot: 'morning', available: true, maxCapacity: 10 }]
    }));
  };

  const removeTimeSlot = (index) => {
    setConfig(prev => ({
      ...prev,
      timeSlots: prev.timeSlots.filter((_, idx) => idx !== index)
    }));
  };

  const timeSlotLabels = {
    morning: 'Morning (9 AM - 12 PM)',
    afternoon: 'Afternoon (12 PM - 4 PM)',
    evening: 'Evening (4 PM - 7 PM)'
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
          <h1 className="text-3xl font-bold text-gray-900">Scheduled Service Settings</h1>
          <p className="text-gray-600 mt-1">Configure scheduled service availability and time slots</p>
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
            <div className={`p-3 rounded-xl ${config.enabled ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <Calendar className={`w-6 h-6 ${config.enabled ? 'text-blue-600' : 'text-gray-400'}`} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Enable Scheduled Service</h2>
              <p className="text-gray-600 text-sm">Allow customers to book scheduled pickup and delivery</p>
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
          {/* Advance Booking */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Booking Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Advance Booking Days
                </label>
                <input
                  type="number"
                  value={config.advanceBookingDays}
                  onChange={(e) => setConfig({...config, advanceBookingDays: parseFloat(e.target.value) || 0})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                  max="30"
                />
                <p className="text-xs text-gray-500 mt-1">How many days in advance customers can book</p>
              </div>
            </div>
          </div>

          {/* Time Slots */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Time Slots Configuration</h2>
              <button
                onClick={addTimeSlot}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Slot
              </button>
            </div>
            
            <div className="space-y-4">
              {config.timeSlots.map((slot, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Slot
                      </label>
                      <select
                        value={slot.timeSlot}
                        onChange={(e) => updateTimeSlot(index, 'timeSlot', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="morning">Morning (9 AM - 12 PM)</option>
                        <option value="afternoon">Afternoon (12 PM - 4 PM)</option>
                        <option value="evening">Evening (4 PM - 7 PM)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Available
                      </label>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={slot.available}
                          onChange={(e) => updateTimeSlot(index, 'available', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Capacity
                      </label>
                      <input
                        type="number"
                        value={slot.maxCapacity}
                        onChange={(e) => updateTimeSlot(index, 'maxCapacity', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        min="1"
                      />
                      <p className="text-xs text-gray-500 mt-1">Max orders per slot</p>
                    </div>

                    <div className="flex items-end">
                      {config.timeSlots.length > 1 && (
                        <button
                          onClick={() => removeTimeSlot(index)}
                          className="w-full px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 flex items-center justify-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

