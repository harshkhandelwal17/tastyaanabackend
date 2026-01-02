import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, 
  RefreshCw, 
  Loader2, 
  DollarSign,
  Package,
  Weight,
  AlertCircle,
  CheckCircle2,
  Store
} from 'lucide-react';
import laundryService from '../../../services/laundryService';

export default function PricingManager() {
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pricingModel, setPricingModel] = useState('per_piece');
  const [pricing, setPricing] = useState({}); // Scheduled service pricing
  const [quickPricing, setQuickPricing] = useState({}); // Quick service pricing
  const [weightBasedPricing, setWeightBasedPricing] = useState({});
  const [quickWeightBasedPricing, setQuickWeightBasedPricing] = useState({});
  const [charges, setCharges] = useState({
    quick: { pickup: 50, delivery: 50, surcharge: 20, freeDeliveryAbove: 1000 },
    scheduled: { pickup: 30, delivery: 30, surcharge: 0, freeDeliveryAbove: 500 },
    subscription: { pickup: 0, delivery: 0, surcharge: 0, freeDeliveryAbove: 0 }
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [vendorNotFound, setVendorNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('scheduled'); // 'scheduled' or 'quick'

  useEffect(() => {
    loadVendorData();
  }, []);

  const loadVendorData = async () => {
    try {
      setLoading(true);
      const response = await laundryService.getMyVendor();
      const vendorData = response?.data;
      
      if (vendorData) {
        setVendor(vendorData);
        setPricingModel(vendorData.pricingConfig?.model || 'per_piece');
        setPricing(vendorData.pricing || {});
        setQuickPricing(vendorData.quickPricing || {});
        setWeightBasedPricing(vendorData.pricingConfig?.weightBasedPricing || {});
        setQuickWeightBasedPricing(vendorData.quickWeightBasedPricing || {});
        setCharges(vendorData.charges || {
          quick: { pickup: 50, delivery: 50, surcharge: 20, freeDeliveryAbove: 1000 },
          scheduled: { pickup: 30, delivery: 30, surcharge: 0, freeDeliveryAbove: 500 },
          subscription: { pickup: 0, delivery: 0, surcharge: 0, freeDeliveryAbove: 0 }
        });
      } else {
        setVendorNotFound(true);
      }
    } catch (error) {
      // Handle 404 or "not found" errors gracefully
      if (error.isNotFound || error.status === 404 || error.message?.includes('not found') || error.response?.status === 404) {
        setVendorNotFound(true);
      } else {
        console.error('Error loading vendor:', error);
        setMessage({ type: 'error', text: error.message || 'Failed to load vendor data' });
      }
    } finally {
      setLoading(false);
    }
  };

  const savePricing = async () => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      if (!vendor?._id) {
        throw new Error('Vendor profile not found');
      }

      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const apiURL = baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`;
      
      // Clean pricing objects before sending - convert undefined/null to 0, remove empty values
      const cleanPricingObject = (obj) => {
        if (!obj || typeof obj !== 'object') return {};
        const cleaned = {};
        Object.keys(obj).forEach(itemType => {
          const itemPricing = obj[itemType];
          // Skip if itemType value is undefined or null
          if (itemPricing === undefined || itemPricing === null) return;
          
          // If it's an object (service types), clean it
          if (itemPricing && typeof itemPricing === 'object' && !Array.isArray(itemPricing)) {
            const cleanedItemPricing = {};
            let hasValidServices = false;
            
            Object.keys(itemPricing).forEach(serviceType => {
              const servicePrice = itemPricing[serviceType];
              // Convert undefined/null to 0, keep valid values
              if (servicePrice === undefined || servicePrice === null || servicePrice === '') {
                cleanedItemPricing[serviceType] = 0;
                hasValidServices = true;
              } else {
                cleanedItemPricing[serviceType] = servicePrice;
                hasValidServices = true;
              }
            });
            
            // Only add item type if it has at least one service type
            if (hasValidServices && Object.keys(cleanedItemPricing).length > 0) {
              cleaned[itemType] = cleanedItemPricing;
            }
          }
        });
        return cleaned;
      };

      const cleanedPricing = cleanPricingObject(pricing);
      const cleanedQuickPricing = cleanPricingObject(quickPricing);
      const cleanedQuickWeightBasedPricing = cleanPricingObject(quickWeightBasedPricing);
      const cleanedWeightBasedPricing = cleanPricingObject(weightBasedPricing);

      // Build request body - only include fields that have values
      const requestBody = {
        pricingConfig: {
          model: pricingModel,
          weightBasedPricing: cleanedWeightBasedPricing
        },
        pricing: cleanedPricing, // Scheduled service pricing
        charges
      };

      // Only include quickPricing if it has actual values (not empty object)
      if (cleanedQuickPricing && Object.keys(cleanedQuickPricing).length > 0) {
        requestBody.quickPricing = cleanedQuickPricing;
      }

      // Only include quickWeightBasedPricing if it has actual values
      if (cleanedQuickWeightBasedPricing && Object.keys(cleanedQuickWeightBasedPricing).length > 0) {
        requestBody.quickWeightBasedPricing = cleanedQuickWeightBasedPricing;
      }

      console.log('📤 Sending pricing update:', JSON.stringify(requestBody, null, 2));

      const response = await fetch(`${apiURL}/laundry/vendors/me/pricing`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Pricing updated successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        loadVendorData(); // Reload to get updated data
      } else {
        console.error('Pricing update failed:', data);
        console.error('Response status:', response.status);
        console.error('Response data:', JSON.stringify(data, null, 2));
        
        // Extract detailed error messages
        let errorMessage = data.message || 'Failed to update pricing';
        
        // If there are validation errors, show them
        if (data.errors && typeof data.errors === 'object') {
          const validationErrors = Object.entries(data.errors)
            .map(([field, message]) => `${field}: ${message}`)
            .join(', ');
          errorMessage = `Validation errors: ${validationErrors}`;
        } else if (data.error) {
          errorMessage = data.error;
        }
        
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error saving pricing:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.status
      });
      
      let errorMessage = error.message || 'Failed to save pricing';
      if (error.message?.includes('Vendor not found')) {
        errorMessage = 'Vendor profile not found. Please create a vendor profile first.';
      }
      
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setSaving(false);
    }
  };

  const updatePricing = (itemType, serviceType, value) => {
    // Validate and sanitize value
    const numValue = value ? Math.max(0, Math.min(10000, parseFloat(value) || 0)) : 0;
    
    // Update based on active tab (scheduled or quick)
    if (activeTab === 'quick') {
      setQuickPricing(prev => ({
        ...prev,
        [itemType]: {
          ...prev[itemType],
          [serviceType]: numValue
        }
      }));
    } else {
      setPricing(prev => ({
        ...prev,
        [itemType]: {
          ...prev[itemType],
          [serviceType]: numValue
        }
      }));
    }
  };

  const updateWeightPricing = (serviceType, value) => {
    // Validate and sanitize value
    const numValue = value ? Math.max(0, Math.min(1000, parseFloat(value) || 0)) : 0;
    
    // Update based on active tab
    if (activeTab === 'quick') {
      setQuickWeightBasedPricing(prev => ({
        ...prev,
        [serviceType]: numValue
      }));
    } else {
      setWeightBasedPricing(prev => ({
        ...prev,
        [serviceType]: numValue
      }));
    }
  };

  const getCurrentPricing = () => {
    return activeTab === 'quick' ? quickPricing : pricing;
  };

  const getCurrentWeightPricing = () => {
    return activeTab === 'quick' ? quickWeightBasedPricing : weightBasedPricing;
  };

  const updateCharges = (serviceType, field, value) => {
    let numValue = parseFloat(value) || 0;
    
    // Validate based on field type
    if (field === 'surcharge') {
      numValue = Math.max(0, Math.min(100, numValue)); // Surcharge is percentage (0-100)
    } else {
      numValue = Math.max(0, Math.min(10000, numValue)); // Other charges max 10000
    }
    
    setCharges(prev => ({
      ...prev,
      [serviceType]: {
        ...prev[serviceType],
        [field]: numValue
      }
    }));
  };

  const itemTypes = [
    { id: 'shirt', label: 'Shirt', category: 'topwear' },
    { id: 'tshirt', label: 'T-Shirt', category: 'topwear' },
    { id: 'sweater', label: 'Sweater', category: 'topwear' },
    { id: 'jacket', label: 'Jacket', category: 'topwear' },
    { id: 'jeans', label: 'Jeans', category: 'bottomwear' },
    { id: 'trousers', label: 'Trousers', category: 'bottomwear' },
    { id: 'shorts', label: 'Shorts', category: 'bottomwear' },
    { id: 'bedsheet', label: 'Bedsheet', category: 'home_textiles' },
    { id: 'blanket', label: 'Blanket', category: 'home_textiles' },
    { id: 'curtain', label: 'Curtain', category: 'home_textiles' },
    { id: 'towel', label: 'Towel', category: 'others' },
    { id: 'saree', label: 'Saree', category: 'others' },
    { id: 'suit', label: 'Suit', category: 'others' },
    { id: 'shoe', label: 'Shoe', category: 'others' }
  ];

  const serviceTypes = [
    { id: 'wash_fold', label: 'Wash & Fold' },
    { id: 'wash_iron', label: 'Wash & Iron' },
    { id: 'dry_clean', label: 'Dry Clean' },
    { id: 'iron_only', label: 'Iron Only' },
    { id: 'shoe_cleaning', label: 'Shoe Cleaning' }
  ];

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
            You need to create a vendor profile first to manage pricing.
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
          <h1 className="text-3xl font-bold text-gray-900">Pricing Manager</h1>
          <p className="text-gray-600 mt-1">Configure pricing for all services and items</p>
        </div>
        <button
          onClick={savePricing}
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

      {/* Pricing Model Selection */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-2">Pricing Model</h2>
        <p className="text-sm text-gray-600 mb-4">
          Select how you want to charge customers. You can use per-piece pricing, weight-based pricing, or both (hybrid).
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => setPricingModel('per_piece')}
            className={`p-5 rounded-xl border-2 transition-all text-left ${
              pricingModel === 'per_piece'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Package className="w-8 h-8 mb-2" />
            <div className="font-semibold">Per-Piece Pricing</div>
            <div className="text-sm text-gray-600 mt-1">Price per item</div>
          </button>
          <button
            onClick={() => setPricingModel('weight_based')}
            className={`p-5 rounded-xl border-2 transition-all text-left ${
              pricingModel === 'weight_based'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <Weight className="w-8 h-8 mb-2" />
            <div className="font-semibold">Weight-Based Pricing</div>
            <div className="text-sm text-gray-600 mt-1">Price per kg</div>
          </button>
          <button
            onClick={() => setPricingModel('hybrid')}
            className={`p-5 rounded-xl border-2 transition-all text-left ${
              pricingModel === 'hybrid'
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <DollarSign className="w-8 h-8 mb-2" />
            <div className="font-semibold">Hybrid Model</div>
            <div className="text-sm text-gray-600 mt-1">Both pricing types</div>
          </button>
        </div>
      </div>

      {/* Service Type Tabs (Scheduled vs Quick) */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('scheduled')}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'scheduled'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Scheduled Service Pricing
          </button>
          <button
            onClick={() => setActiveTab('quick')}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'quick'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Quick Service Pricing
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          {activeTab === 'quick' 
            ? 'Set higher pricing for quick/express service. If not set, will use scheduled pricing with surcharge.'
            : 'Standard pricing for scheduled service orders.'}
        </p>
      </div>

      {/* Per-Piece Pricing Table */}
      {(pricingModel === 'per_piece' || pricingModel === 'hybrid') && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Per-Piece Pricing (₹ per item) - {activeTab === 'quick' ? 'Quick Service' : 'Scheduled Service'}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Item</th>
                  {serviceTypes.map(st => (
                    <th key={st.id} className="text-center py-3 px-4 font-semibold text-gray-700">
                      {st.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {itemTypes.map(item => {
                  const currentPricing = getCurrentPricing();
                  return (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-3 px-4 font-medium text-gray-900">{item.label}</td>
                      {serviceTypes.map(st => (
                        <td key={st.id} className="py-3 px-4">
                          <input
                            type="number"
                            value={currentPricing[item.id]?.[st.id] || ''}
                            onChange={(e) => updatePricing(item.id, st.id, e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-center"
                            placeholder={activeTab === 'quick' ? 'Use scheduled' : '0'}
                            min="0"
                            step="1"
                          />
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Weight-Based Pricing */}
      {(pricingModel === 'weight_based' || pricingModel === 'hybrid') && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Weight-Based Pricing (₹ per kg) - {activeTab === 'quick' ? 'Quick Service' : 'Scheduled Service'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {serviceTypes.map(st => {
              const currentWeightPricing = getCurrentWeightPricing();
              return (
                <div key={st.id} className="border border-gray-200 rounded-lg p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {st.label}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={currentWeightPricing[st.id] || ''}
                      onChange={(e) => updateWeightPricing(st.id, e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder={activeTab === 'quick' ? 'Use scheduled' : '0'}
                      min="0"
                      step="1"
                    />
                    <span className="absolute right-3 top-2 text-gray-500">₹/kg</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Service Charges */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Service Charges</h2>
        <div className="space-y-6">
          {['quick', 'scheduled', 'subscription'].map(serviceType => (
            <div key={serviceType} className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-4 capitalize">{serviceType} Service</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pickup Charge (₹)
                  </label>
                  <input
                    type="number"
                    value={charges[serviceType]?.pickup || 0}
                    onChange={(e) => updateCharges(serviceType, 'pickup', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Delivery Charge (₹)
                  </label>
                  <input
                    type="number"
                    value={charges[serviceType]?.delivery || 0}
                    onChange={(e) => updateCharges(serviceType, 'delivery', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Surcharge (%)
                  </label>
                  <input
                    type="number"
                    value={charges[serviceType]?.surcharge || 0}
                    onChange={(e) => updateCharges(serviceType, 'surcharge', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Free Delivery Above (₹)
                  </label>
                  <input
                    type="number"
                    value={charges[serviceType]?.freeDeliveryAbove || 0}
                    onChange={(e) => updateCharges(serviceType, 'freeDeliveryAbove', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="0"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}