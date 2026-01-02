import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, 
  Loader2, 
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Store
} from 'lucide-react';
import laundryService from '../../../services/laundryService';

export default function ServicesManager() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [services, setServices] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [vendorNotFound, setVendorNotFound] = useState(false);

  const availableServices = [
    { id: 'wash_fold', label: 'Wash & Fold', description: 'Regular washing and folding' },
    { id: 'wash_iron', label: 'Wash & Iron', description: 'Washing with ironing' },
    { id: 'dry_clean', label: 'Dry Cleaning', description: 'Professional dry cleaning' },
    { id: 'iron_only', label: 'Iron Only', description: 'Ironing service only' },
    { id: 'express', label: 'Express Service', description: 'Fast turnaround service' },
    { id: 'premium', label: 'Premium Service', description: 'Premium care service' },
    { id: 'shoe_cleaning', label: 'Shoe Cleaning', description: 'Shoe cleaning and polishing' },
    { id: 'folding_only', label: 'Folding Only', description: 'Folding service only' }
  ];

  const availableSpecializations = [
    'delicate_fabrics',
    'wedding_attire',
    'leather',
    'silk',
    'wool',
    'denim',
    'formal_wear',
    'sports_wear'
  ];

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const response = await laundryService.getMyVendor();
      const vendor = response?.data;
      
      if (vendor) {
        setServices(vendor.services || []);
        setSpecializations(vendor.specializations || []);
        setVendorNotFound(false);
      } else {
        setVendorNotFound(true);
      }
    } catch (error) {
      // Handle 404 or "not found" errors gracefully
      if (error.isNotFound || error.status === 404 || error.message?.includes('not found') || error.response?.status === 404) {
        setVendorNotFound(true);
      } else {
        console.error('Error loading services:', error);
        setMessage({ type: 'error', text: error.message || 'Failed to load services' });
      }
    } finally {
      setLoading(false);
    }
  };

  const saveServices = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const apiURL = baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`;
      
      const response = await fetch(`${apiURL}/laundry/vendors/me/services`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          services,
          specializations
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Services updated successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        loadServices(); // Reload to get updated data
      } else {
        throw new Error(data.message || 'Failed to save services');
      }
    } catch (error) {
      console.error('Error saving services:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save services' });
    } finally {
      setSaving(false);
    }
  };

  const toggleService = (serviceId) => {
    setServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(s => s !== serviceId)
        : [...prev, serviceId]
    );
  };

  const toggleSpecialization = (spec) => {
    setSpecializations(prev => 
      prev.includes(spec)
        ? prev.filter(s => s !== spec)
        : [...prev, spec]
    );
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
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            Vendor Profile Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            You need to create a vendor profile first to manage services.
          </p>
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
          <h1 className="text-3xl font-bold text-gray-900">Services Manager</h1>
          <p className="text-gray-600 mt-1">Manage services and specializations you offer</p>
        </div>
        <button
          onClick={saveServices}
          disabled={saving}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Save Changes
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

      {/* Services */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Available Services</h2>
        <p className="text-gray-600 mb-6">Select the services you want to offer to customers</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableServices.map(service => {
            const isSelected = services.includes(service.id);
            return (
              <button
                key={service.id}
                onClick={() => toggleService(service.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className={`font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-900'}`}>
                    {service.label}
                  </h3>
                  {isSelected && (
                    <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-600">{service.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Specializations */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Specializations</h2>
        <p className="text-gray-600 mb-6">Select your areas of expertise</p>
        <div className="flex flex-wrap gap-3">
          {availableSpecializations.map(spec => {
            const isSelected = specializations.includes(spec);
            return (
              <button
                key={spec}
                onClick={() => toggleSpecialization(spec)}
                className={`px-4 py-2 rounded-lg border-2 transition-all capitalize ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                    : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }`}
              >
                {spec.replace('_', ' ')}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

