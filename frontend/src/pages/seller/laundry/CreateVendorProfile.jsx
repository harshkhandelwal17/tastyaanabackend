import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Store, 
  MapPin, 
  Phone, 
  Mail, 
  Save, 
  Loader2, 
  AlertCircle,
  CheckCircle2,
  Package,
  DollarSign
} from 'lucide-react';
import laundryService from '../../../services/laundryService';

export default function CreateVendorProfile() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    // Check if token exists on mount
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    setHasToken(!!token);
    
    if (!token) {
      setMessage({ 
        type: 'error', 
        text: 'Please log in to create a vendor profile. Redirecting to login...' 
      });
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    }
  }, [navigate]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    phone: '',
    email: '',
    address: {
      street: '',
      area: '',
      city: '',
      state: '',
      pincode: ''
    },
    serviceAreas: [],
    services: ['wash_fold', 'wash_iron'],
    pricingConfig: {
      model: 'per_piece',
      minWeight: 1
    }
  });

  const availableServices = [
    { id: 'wash_fold', label: 'Wash & Fold' },
    { id: 'wash_iron', label: 'Wash & Iron' },
    { id: 'dry_clean', label: 'Dry Cleaning' },
    { id: 'iron_only', label: 'Iron Only' },
    { id: 'express', label: 'Express Service' },
    { id: 'premium', label: 'Premium Service' },
    { id: 'shoe_cleaning', label: 'Shoe Cleaning' },
    { id: 'folding_only', label: 'Folding Only' }
  ];

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleServiceToggle = (serviceId) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceId)
        ? prev.services.filter(s => s !== serviceId)
        : [...prev.services, serviceId]
    }));
  };

  const handleServiceAreaAdd = () => {
    const pincode = formData.address.pincode;
    if (pincode && !formData.serviceAreas.includes(pincode)) {
      setFormData(prev => ({
        ...prev,
        serviceAreas: [...prev.serviceAreas, pincode]
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Check for token first
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Please log in to create a vendor profile');
      }

      // Comprehensive validation
      if (!formData.name.trim()) {
        throw new Error('Vendor name is required');
      }
      if (formData.name.trim().length < 3) {
        throw new Error('Vendor name must be at least 3 characters');
      }
      if (formData.name.trim().length > 100) {
        throw new Error('Vendor name cannot exceed 100 characters');
      }

      if (!formData.description.trim()) {
        throw new Error('Description is required');
      }
      if (formData.description.trim().length < 10) {
        throw new Error('Description must be at least 10 characters');
      }
      if (formData.description.trim().length > 500) {
        throw new Error('Description cannot exceed 500 characters');
      }

      if (!formData.phone.trim()) {
        throw new Error('Phone number is required');
      }
      if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
        throw new Error('Phone number must be a valid 10-digit Indian mobile number starting with 6-9');
      }

      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
        throw new Error('Please enter a valid email address');
      }

      if (!formData.address.street.trim()) {
        throw new Error('Street address is required');
      }
      if (formData.address.street.trim().length < 5) {
        throw new Error('Street address must be at least 5 characters');
      }

      if (!formData.address.city.trim()) {
        throw new Error('City is required');
      }
      if (formData.address.city.trim().length < 2) {
        throw new Error('City name must be at least 2 characters');
      }

      if (!formData.address.state.trim()) {
        throw new Error('State is required');
      }
      if (formData.address.state.trim().length < 2) {
        throw new Error('State name must be at least 2 characters');
      }

      if (!formData.address.pincode.trim()) {
        throw new Error('Pincode is required');
      }
      if (!/^[0-9]{6}$/.test(formData.address.pincode.trim())) {
        throw new Error('Pincode must be exactly 6 digits');
      }

      if (formData.services.length === 0) {
        throw new Error('Please select at least one service');
      }

      // Add pincode to service areas if not already added
      if (formData.address.pincode && !formData.serviceAreas.includes(formData.address.pincode)) {
        formData.serviceAreas.push(formData.address.pincode);
      }

      // Prepare data for API - ensure all required fields are present
      const vendorData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined, // Optional field
        address: {
          street: formData.address.street.trim(),
          area: formData.address.area.trim(),
          city: formData.address.city.trim(),
          state: formData.address.state.trim(),
          pincode: formData.address.pincode.trim()
        },
        services: formData.services,
        serviceAreas: formData.serviceAreas.length > 0 ? formData.serviceAreas : [formData.address.pincode.trim()],
        pricingConfig: formData.pricingConfig || {
          model: 'per_piece',
          minWeight: 1
        }
      };

      console.log('Sending vendor data:', vendorData);

      const response = await laundryService.createVendor(vendorData);
      
      if (response.success) {
        setMessage({ type: 'success', text: 'Vendor profile created successfully! Redirecting...' });
        setTimeout(() => {
          navigate('/seller/laundry/dashboard');
        }, 2000);
      } else {
        throw new Error(response.message || 'Failed to create vendor profile');
      }
    } catch (error) {
      console.error('Error creating vendor:', error);
      console.error('Error details:', error.response || error);
      
      let errorMessage = error.message || 'Failed to create vendor profile';
      
      // Handle authentication errors
      if (error.message?.includes('token') || error.message?.includes('Access denied') || error.message?.includes('Unauthorized')) {
        errorMessage = 'Authentication failed. Please log in again.';
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      }
      
      // Show more detailed error if available
      if (error.response?.data?.errors) {
        const validationErrors = Object.values(error.response.data.errors).join(', ');
        errorMessage = `${errorMessage}: ${validationErrors}`;
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Create Vendor Profile</h1>
        <p className="text-gray-600 mt-1">Set up your laundry service vendor profile to start receiving orders</p>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Store className="w-5 h-5" />
            Basic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vendor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Clean Laundry Services"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  formData.phone && !/^[6-9]\d{9}$/.test(formData.phone)
                    ? 'border-red-300 focus:border-red-500'
                    : 'border-gray-300'
                }`}
                placeholder="10-digit mobile number"
                maxLength={10}
                required
              />
              {formData.phone && !/^[6-9]\d{9}$/.test(formData.phone) && (
                <p className="text-xs text-red-600 mt-1">Enter valid 10-digit mobile number starting with 6-9</p>
              )}
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="vendor@example.com"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your laundry services..."
                required
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Address
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address.street}
                onChange={(e) => handleInputChange('address.street', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Street address"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Area/Locality
              </label>
              <input
                type="text"
                value={formData.address.area}
                onChange={(e) => handleInputChange('address.area', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Area"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address.city}
                onChange={(e) => handleInputChange('address.city', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="City"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.address.state}
                onChange={(e) => handleInputChange('address.state', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="State"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pincode <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.address.pincode}
                  onChange={(e) => handleInputChange('address.pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className={`flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    formData.address.pincode && !/^[0-9]{6}$/.test(formData.address.pincode)
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="6-digit pincode"
                  maxLength={6}
                  required
                />
                {formData.address.pincode && !/^[0-9]{6}$/.test(formData.address.pincode) && (
                  <p className="text-xs text-red-600 mt-1 absolute">Pincode must be exactly 6 digits</p>
                )}
                <button
                  type="button"
                  onClick={handleServiceAreaAdd}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                >
                  Add to Service Areas
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5" />
            Services Offered <span className="text-red-500">*</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {availableServices.map(service => (
              <button
                key={service.id}
                type="button"
                onClick={() => handleServiceToggle(service.id)}
                className={`p-3 rounded-lg border-2 transition-all text-left ${
                  formData.services.includes(service.id)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {service.label}
              </button>
            ))}
          </div>
        </div>

        {/* Service Areas */}
        {formData.serviceAreas.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Service Areas (Pincodes)</h2>
            <div className="flex flex-wrap gap-2">
              {formData.serviceAreas.map((pincode, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                >
                  {pincode}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/seller/laundry/dashboard')}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Create Profile
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

