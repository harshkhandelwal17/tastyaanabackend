import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, Edit, Eye, Ban, Check, X, Star, Trash2, Clock, 
  MapPin, Phone, Mail, Store, DollarSign, FileText, Calendar, Settings, 
  ChevronRight, Menu, ArrowLeft, Users, TrendingUp, Shield, Package, 
  Download, AlertCircle, CheckCircle, Upload, ChevronDown, ChevronUp
} from 'lucide-react';
import ProductManagement from './VendorProducts';
import Subscription from './Subscription';
import VendorSubscriptionDashboard from './VendorSubscription';

const VendorManagement = () => {
  const [vendors, setVendors] = useState([]);
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddVendor, setShowAddVendor] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [vendorSubscriptions, setVendorSubscriptions] = useState({});
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [newVendorData, setNewVendorData] = useState({
    name: '', email: '', phone: '', category: '', storeName: '', storeDescription: '', storeAddress: ''
  });
  
  const [paymentForm, setPaymentForm] = useState({
    amount: '', type: 'payment', description: '', referenceId: ''
  });

  // Sample vendor data
  const sampleVendors = [
    {
      id: 1,
      name: 'Rajesh Kumar',
      email: 'rajesh@freshveggies.com',
      phone: '+91 9876543210',
      status: 'active',
      rating: 4.8,
      category: 'Vegetables & Fruits',
      joinDate: '2024-01-15',
      totalOrders: 1240,
      revenue: 185000,
      reviews: [
        { id: 101, user: 'John Doe', comment: 'Great service!', date: '2023-01-15' },
        { id: 102, user: 'Jane Smith', comment: 'Fast delivery and good quality.', date: '2023-02-20' }
      ],
      sellerProfile: {
        storeName: 'Fresh Veggie Corner',
        storeDescription: 'Premium quality fresh vegetables and organic fruits sourced directly from farms.',
        storeAddress: '123, Green Market, Near City Mall, Indore, MP 452001',
        storeStatus: 'open',
        statusReason: '',
        lastStatusUpdate: '2024-09-09',
        operatingHours: {
          monday: { open: '08:00', close: '22:00', isOpen: true },
          tuesday: { open: '08:00', close: '22:00', isOpen: true },
          wednesday: { open: '08:00', close: '22:00', isOpen: true },
          thursday: { open: '08:00', close: '22:00', isOpen: true },
          friday: { open: '08:00', close: '22:00', isOpen: true },
          saturday: { open: '08:00', close: '23:00', isOpen: true },
          sunday: { open: '09:00', close: '21:00', isOpen: true }
        },
        deliverySettings: {
          minOrderValue: 150,
          deliveryCharges: 25,
          deliveryAreas: ['452001', '452002', '452003', '452004'],
          freeDeliveryAbove: 500
        },
        ratings: { average: 4.8, count: 324 },
        isVerified: true,
        verificationDocuments: {
          businessLicense: 'BL123456789',
          panCard: 'ABCDE1234F',
          aadharCard: '1234-5678-9012',
          fssaiLicense: 'FSSAI123456'
        },
        payments: {
          advancePayment: 15000,
          receivedPayment: 45000,
          pendingAmount: 9000,
          totalCommission: 11000,
          totalEarnings: 185000,
          totalReceivedPayment: 185000,
          paymentHistory: [
            {
              id: 1,
              amount: 15000,
              type: 'advance',
              description: 'Initial advance payment for setup',
              timestamp: '2024-09-01',
              referenceId: 'REF001',
              status: 'completed'
            }
          ]
        },
        sundayAvailability: { morning: true, evening: true }
      }
    },
    {
      id: 2,
      name: 'Priya Sharma',
      email: 'priya@spiceworld.com',
      phone: '+91 9876543211',
      status: 'inactive',
      rating: 4.2,
      category: 'Spices & Masalas',
      joinDate: '2024-02-20',
      totalOrders: 680,
      revenue: 95000,
      reviews: [
        { id: 101, user: 'Alice Johnson', comment: 'Authentic spices!', date: '2023-03-10' }
      ],
      sellerProfile: {
        storeName: 'Authentic Spice World',
        storeDescription: 'Traditional Indian spices, premium masalas, and authentic regional flavors.',
        storeAddress: '456, Spice Market Road, Old City, Indore, MP 452002',
        storeStatus: 'temporarily_closed',
        statusReason: 'Store renovation and inventory update in progress',
        lastStatusUpdate: '2024-09-05',
        operatingHours: {
          monday: { open: '09:00', close: '20:00', isOpen: true },
          tuesday: { open: '09:00', close: '20:00', isOpen: true },
          wednesday: { open: '09:00', close: '20:00', isOpen: true },
          thursday: { open: '09:00', close: '20:00', isOpen: true },
          friday: { open: '09:00', close: '20:00', isOpen: true },
          saturday: { open: '09:00', close: '21:00', isOpen: true },
          sunday: { open: '10:00', close: '18:00', isOpen: false }
        },
        deliverySettings: {
          minOrderValue: 200,
          deliveryCharges: 30,
          deliveryAreas: ['452002', '452005', '452006'],
          freeDeliveryAbove: 800
        },
        ratings: { average: 4.2, count: 156 },
        isVerified: false,
        verificationDocuments: {
          businessLicense: '',
          panCard: 'XYZAB5678C',
          aadharCard: '9876-5432-1098',
          fssaiLicense: ''
        },
        payments: {
          advancePayment: 8000,
          receivedPayment: 18000,
          totalEarnings: 95000,
          totalCommission: 11000,
          pendingAmount: 9000,
          totalReceivedPayment: 95000,
          paymentHistory: [
            {
              id: 2,
              amount: 8000,
              type: 'advance',
              description: 'Initial setup advance',
              timestamp: '2024-08-15',
              referenceId: 'REF003',
              status: 'completed'
            }
          ]
        },
        sundayAvailability: { morning: false, evening: false }
      }
    }
  ];

  const categories = ['All Categories', 'Vegetables & Fruits', 'Spices & Masalas', 'Meat & Poultry', 'Bakery & Sweets', 'Dairy Products', 'Beverages'];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Eye },
    { id: 'store', label: 'Store', icon: Store },
    { id: 'hours', label: 'Hours', icon: Clock },
    { id: 'delivery', label: 'Delivery', icon: MapPin },
    { id: 'payments', label: 'Payments', icon: DollarSign },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'subscription', label: 'Subscription', icon: Settings },
    { id: 'products', label: 'Products', icon: Package }
  ];

  useEffect(() => {
    setVendors(sampleVendors);
    setFilteredVendors(sampleVendors);
  }, []);

  useEffect(() => {
    let filtered = vendors;
    
    if (searchTerm) {
      filtered = filtered.filter(vendor => 
        vendor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.sellerProfile.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(vendor => vendor.status === filterStatus);
    }
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(vendor => vendor.category === filterCategory);
    }
    
    setFilteredVendors(filtered);
  }, [searchTerm, filterStatus, filterCategory, vendors]);

  const handleStatusChange = (vendorId, newStatus) => {
    setVendors(prev => prev.map(vendor => 
      vendor.id === vendorId ? { ...vendor, status: newStatus } : vendor
    ));
  };

  const handleEditVendor = (vendor) => {
    setSelectedVendor(vendor);
    setEditData({ ...vendor });
    setEditMode(true);
    setShowProfile(true);
  };

  const handleSaveEdit = () => {
    setVendors(prev => prev.map(vendor => 
      vendor.id === editData.id ? editData : vendor
    ));
    setEditMode(false);
    setSelectedVendor(editData);
  };

  const handleInputChange = (path, value) => {
    const keys = path.split('.');
    const newData = { ...editData };
    let current = newData;
    
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {};
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setEditData(newData);
  };

  const handleAddVendor = () => {
    if (!newVendorData.name || !newVendorData.email || !newVendorData.phone) {
      return;
    }

    const newVendor = {
      id: vendors.length + 1,
      name: newVendorData.name,
      email: newVendorData.email,
      phone: newVendorData.phone,
      status: 'pending',
      rating: 0,
      category: newVendorData.category || 'Vegetables & Fruits',
      joinDate: new Date().toISOString().split('T')[0],
      totalOrders: 0,
      revenue: 0,
      reviews: [],
      sellerProfile: {
        storeName: newVendorData.storeName || newVendorData.name + "'s Store",
        storeDescription: newVendorData.storeDescription || 'New vendor store',
        storeAddress: newVendorData.storeAddress || '',
        storeStatus: 'closed',
        statusReason: 'Pending setup and verification',
        lastStatusUpdate: new Date().toISOString().split('T')[0],
        operatingHours: Object.fromEntries(
          ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            .map(day => [day, { open: '09:00', close: '18:00', isOpen: false }])
        ),
        deliverySettings: {
          minOrderValue: 100, deliveryCharges: 30, deliveryAreas: [], freeDeliveryAbove: 500
        },
        ratings: { average: 0, count: 0 },
        isVerified: false,
        verificationDocuments: { businessLicense: '', panCard: '', aadharCard: '', fssaiLicense: '' },
        payments: {
          advancePayment: 0, receivedPayment: 0, totalReceivedPayment: 0, 
          totalEarnings: 0, totalCommission: 0, pendingAmount: 0, paymentHistory: []
        },
        sundayAvailability: { morning: false, evening: false }
      }
    };

    setVendors(prev => [...prev, newVendor]);
    setNewVendorData({ name: '', email: '', phone: '', category: '', storeName: '', storeDescription: '', storeAddress: '' });
    setShowAddVendor(false);
  };

  const handleAddPayment = () => {
    if (!paymentForm.amount || !paymentForm.description) {
      alert('Please fill all required fields');
      return;
    }

    const newPayment = {
      id: Date.now(),
      amount: parseFloat(paymentForm.amount),
      type: paymentForm.type,
      description: paymentForm.description,
      timestamp: new Date().toISOString(),
      referenceId: paymentForm.referenceId || `PAY-${Date.now()}`,
      status: 'completed'
    };

    const updatedVendor = {
      ...selectedVendor,
      sellerProfile: {
        ...selectedVendor.sellerProfile,
        payments: {
          ...selectedVendor.sellerProfile.payments,
          paymentHistory: [newPayment, ...selectedVendor.sellerProfile.payments.paymentHistory],
          totalEarnings: paymentForm.type === 'payment' ? 
            selectedVendor.sellerProfile.payments.totalEarnings + parseFloat(paymentForm.amount) :
            selectedVendor.sellerProfile.payments.totalEarnings
        }
      }
    };

    setSelectedVendor(updatedVendor);
    setEditData(updatedVendor);
    setShowPaymentForm(false);
    setPaymentForm({ amount: '', type: 'payment', description: '', referenceId: '' });
  };

  const handleVerifyVendor = () => {
    const updatedVendor = {
      ...selectedVendor,
      sellerProfile: { ...selectedVendor.sellerProfile, isVerified: true },
      status: 'active'
    };
    setSelectedVendor(updatedVendor);
    setEditData(updatedVendor);
  };

  const handleDocumentUpload = (docType) => {
    setUploadingDoc(docType);
    setTimeout(() => {
      const docNumber = `DOC-${Date.now()}`;
      handleInputChange(`sellerProfile.verificationDocuments.${docType}`, docNumber);
      setUploadingDoc(null);
    }, 1500);
  };

  const renderStars = (rating) => {
    return Array(5).fill(0).map((_, i) => (
      <Star 
        key={i} 
        size={14} 
        className={i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'} 
      />
    ));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'inactive': return 'bg-red-50 text-red-700 border-red-200';
      case 'pending': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStoreStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'closed': return 'bg-red-50 text-red-700 border-red-200';
      case 'temporarily_closed': return 'bg-amber-50 text-amber-700 border-amber-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  // Add Vendor Modal Component
  const AddVendorModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white p-6 border-b rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Add New Vendor</h2>
            <button
              onClick={() => setShowAddVendor(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vendor Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={newVendorData.name}
                onChange={(e) => setNewVendorData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter vendor name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={newVendorData.email}
                onChange={(e) => setNewVendorData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email address"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={newVendorData.phone}
                onChange={(e) => setNewVendorData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+91 XXXXXXXXXX"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={newVendorData.category}
                onChange={(e) => setNewVendorData(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="">Select Category</option>
                {categories.slice(1).map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={newVendorData.storeName}
              onChange={(e) => setNewVendorData(prev => ({ ...prev, storeName: e.target.value }))}
              placeholder="Enter store name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Store Description</label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              rows="3"
              value={newVendorData.storeDescription}
              onChange={(e) => setNewVendorData(prev => ({ ...prev, storeDescription: e.target.value }))}
              placeholder="Brief description of the store"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Store Address</label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              rows="2"
              value={newVendorData.storeAddress}
              onChange={(e) => setNewVendorData(prev => ({ ...prev, storeAddress: e.target.value }))}
              placeholder="Enter complete store address"
            />
          </div>
        </div>
        
        <div className="sticky bottom-0 bg-gray-50 p-6 border-t rounded-b-2xl">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowAddVendor(false)}
              className="flex-1 px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleAddVendor}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              disabled={!newVendorData.name || !newVendorData.email || !newVendorData.phone}
            >
              Add Vendor
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Payment Modal Component
  const PaymentModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Add Payment</h3>
          <button 
            onClick={() => setShowPaymentForm(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount (₹)</label>
            <input
              type="number"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
              placeholder="Enter amount"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Type</label>
            <select
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={paymentForm.type}
              onChange={(e) => setPaymentForm({...paymentForm, type: e.target.value})}
            >
              <option value="payment">Payment</option>
              <option value="advance">Advance</option>
              <option value="deduction">Deduction</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              rows="3"
              value={paymentForm.description}
              onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})}
              placeholder="Enter payment description"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reference ID (Optional)</label>
            <input
              type="text"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              value={paymentForm.referenceId}
              onChange={(e) => setPaymentForm({...paymentForm, referenceId: e.target.value})}
              placeholder="Auto-generated if empty"
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button 
            onClick={() => setShowPaymentForm(false)}
            className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleAddPayment}
            className="flex-1 py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Add Payment
          </button>
        </div>
      </div>
    </div>
  );

  // Vendor Profile Component
  const VendorProfile = () => (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowProfile(false)}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft size={20} />
              <span className="font-medium">Back</span>
            </button>
            <div className="flex items-center gap-2">
              {editMode ? (
                <>
                  <button
                    onClick={handleSaveEdit}
                    className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setEditData({});
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => handleEditVendor(selectedVendor)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                  <Edit size={16} />
                  Edit
                </button>
              )}
            </div>
          </div>
          
          {/* Vendor Header Info */}
          <div className="mt-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
                {selectedVendor.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-bold text-gray-900 truncate">{selectedVendor.sellerProfile.storeName}</h1>
                <p className="text-gray-600 text-sm">{selectedVendor.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-1">
                    {renderStars(selectedVendor.rating)}
                    <span className="text-sm font-medium text-gray-700 ml-1">{selectedVendor.rating}</span>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedVendor.status)}`}>
                    {selectedVendor.status.toUpperCase()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="px-4">
          <div className="flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <IconComponent size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl p-4 border shadow-sm">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <Package size={18} />
                  <span className="text-xs font-medium uppercase tracking-wide">Orders</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{selectedVendor.totalOrders.toLocaleString()}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border shadow-sm">
                <div className="flex items-center gap-2 text-emerald-600 mb-2">
                  <TrendingUp size={18} />
                  <span className="text-xs font-medium uppercase tracking-wide">Revenue</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">₹{(selectedVendor.revenue / 1000).toFixed(0)}k</p>
              </div>
              <div className="bg-white rounded-xl p-4 border shadow-sm">
                <div className="flex items-center gap-2 text-yellow-600 mb-2">
                  <Star size={18} />
                  <span className="text-xs font-medium uppercase tracking-wide">Rating</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">{selectedVendor.rating}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border shadow-sm">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <Shield size={18} />
                  <span className="text-xs font-medium uppercase tracking-wide">Status</span>
                </div>
                <p className="text-sm font-semibold text-gray-900">{selectedVendor.sellerProfile.isVerified ? 'Verified' : 'Pending'}</p>
              </div>
            </div>

            {/* Store Information */}
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Information</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900 mt-1">{selectedVendor.sellerProfile.storeDescription}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Address</label>
                  <p className="text-gray-900 mt-1 flex items-start gap-2">
                    <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    {selectedVendor.sellerProfile.storeAddress}
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Category</label>
                    <p className="text-gray-900 mt-1">{selectedVendor.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Join Date</label>
                    <p className="text-gray-900 mt-1">{new Date(selectedVendor.joinDate).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-gray-400" />
                  <span className="text-gray-900">{selectedVendor.phone}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Mail size={16} className="text-gray-400" />
                  <span className="text-gray-900">{selectedVendor.email}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleStatusChange(selectedVendor.id, selectedVendor.status === 'active' ? 'inactive' : 'active')}
                className={`w-full p-4 rounded-xl font-medium transition-colors border ${
                  selectedVendor.status === 'active' 
                    ? 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200' 
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200'
                }`}
              >
                {selectedVendor.status === 'active' ? 'Deactivate Vendor' : 'Activate Vendor'}
              </button>
              <button 
                onClick={() => setActiveTab('products')}
                className="w-full p-4 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-medium border border-blue-200"
              >
                View Products
              </button>
            </div>
          </div>
        )}

        {activeTab === 'store' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Store Details</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Store Name</label>
                  {editMode ? (
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={editData.sellerProfile?.storeName || ''}
                      onChange={(e) => handleInputChange('sellerProfile.storeName', e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900 p-3 bg-gray-50 rounded-lg">{selectedVendor.sellerProfile.storeName}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  {editMode ? (
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      rows="4"
                      value={editData.sellerProfile?.storeDescription || ''}
                      onChange={(e) => handleInputChange('sellerProfile.storeDescription', e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900 p-3 bg-gray-50 rounded-lg">{selectedVendor.sellerProfile.storeDescription}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                  {editMode ? (
                    <textarea
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      rows="3"
                      value={editData.sellerProfile?.storeAddress || ''}
                      onChange={(e) => handleInputChange('sellerProfile.storeAddress', e.target.value)}
                    />
                  ) : (
                    <p className="text-gray-900 p-3 bg-gray-50 rounded-lg flex items-start gap-2">
                      <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      {selectedVendor.sellerProfile.storeAddress}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Store Status</label>
                    {editMode ? (
                      <select
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={editData.sellerProfile?.storeStatus || ''}
                        onChange={(e) => handleInputChange('sellerProfile.storeStatus', e.target.value)}
                      >
                        <option value="open">Open</option>
                        <option value="closed">Closed</option>
                        <option value="temporarily_closed">Temporarily Closed</option>
                      </select>
                    ) : (
                      <span className={`inline-flex px-3 py-2 text-sm font-medium rounded-lg border ${getStoreStatusColor(selectedVendor.sellerProfile.storeStatus)}`}>
                        {selectedVendor.sellerProfile.storeStatus.replace('_', ' ').toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Verification</label>
                    <span className={`inline-flex px-3 py-2 text-sm font-medium rounded-lg border ${selectedVendor.sellerProfile.isVerified ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                      {selectedVendor.sellerProfile.isVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                </div>

                {editMode && selectedVendor.sellerProfile.storeStatus === 'temporarily_closed' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status Reason</label>
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      value={editData.sellerProfile?.statusReason || ''}
                      onChange={(e) => handleInputChange('sellerProfile.statusReason', e.target.value)}
                      placeholder="Reason for temporary closure"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'hours' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Operating Hours</h3>
              <div className="space-y-4">
                {Object.entries(selectedVendor.sellerProfile.operatingHours).map(([day, hours]) => (
                  <div key={day} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="font-medium capitalize text-gray-900">{day}</div>
                      {editMode && (
                        <label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={editData.sellerProfile?.operatingHours?.[day]?.isOpen || false}
                            onChange={(e) => handleInputChange(`sellerProfile.operatingHours.${day}.isOpen`, e.target.checked)}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-600">Open</span>
                        </label>
                      )}
                    </div>
                    
                    {editMode ? (
                      <div className="flex items-center gap-3">
                        <input
                          type="time"
                          value={editData.sellerProfile?.operatingHours?.[day]?.open || ''}
                          onChange={(e) => handleInputChange(`sellerProfile.operatingHours.${day}.open`, e.target.value)}
                          className="flex-1 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          disabled={!editData.sellerProfile?.operatingHours?.[day]?.isOpen}
                        />
                        <span className="text-gray-400">to</span>
                        <input
                          type="time"
                          value={editData.sellerProfile?.operatingHours?.[day]?.close || ''}
                          onChange={(e) => handleInputChange(`sellerProfile.operatingHours.${day}.close`, e.target.value)}
                          className="flex-1 p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          disabled={!editData.sellerProfile?.operatingHours?.[day]?.isOpen}
                        />
                      </div>
                    ) : (
                      <div className="text-gray-600">
                        {hours.isOpen ? (
                          <span className="flex items-center gap-2">
                            <Clock size={16} className="text-green-500" />
                            {hours.open} - {hours.close}
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-red-600">
                            <X size={16} />
                            Closed
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Sunday Availability */}
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Sunday Availability</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${selectedVendor.sellerProfile.sundayAvailability.morning ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="font-medium text-gray-900">Morning Shift</span>
                  </div>
                  {editMode ? (
                    <input
                      type="checkbox"
                      checked={editData.sellerProfile?.sundayAvailability?.morning || false}
                      onChange={(e) => handleInputChange('sellerProfile.sundayAvailability.morning', e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  ) : (
                    <span className={`text-sm font-medium ${selectedVendor.sellerProfile.sundayAvailability.morning ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedVendor.sellerProfile.sundayAvailability.morning ? 'Available' : 'Not Available'}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${selectedVendor.sellerProfile.sundayAvailability.evening ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="font-medium text-gray-900">Evening Shift</span>
                  </div>
                  {editMode ? (
                    <input
                      type="checkbox"
                      checked={editData.sellerProfile?.sundayAvailability?.evening || false}
                      onChange={(e) => handleInputChange('sellerProfile.sundayAvailability.evening', e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  ) : (
                    <span className={`text-sm font-medium ${selectedVendor.sellerProfile.sundayAvailability.evening ? 'text-green-600' : 'text-red-600'}`}>
                      {selectedVendor.sellerProfile.sundayAvailability.evening ? 'Available' : 'Not Available'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'delivery' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Delivery Settings</h3>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Order Value</label>
                    {editMode ? (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          value={editData.sellerProfile?.deliverySettings?.minOrderValue || ''}
                          onChange={(e) => handleInputChange('sellerProfile.deliverySettings.minOrderValue', parseInt(e.target.value))}
                        />
                      </div>
                    ) : (
                      <p className="text-xl font-semibold text-gray-900 p-3 bg-gray-50 rounded-lg">₹{selectedVendor.sellerProfile.deliverySettings.minOrderValue}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Charges</label>
                    {editMode ? (
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                        <input
                          type="number"
                          className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                          value={editData.sellerProfile?.deliverySettings?.deliveryCharges || ''}
                          onChange={(e) => handleInputChange('sellerProfile.deliverySettings.deliveryCharges', parseInt(e.target.value))}
                        />
                      </div>
                    ) : (
                      <p className="text-xl font-semibold text-gray-900 p-3 bg-gray-50 rounded-lg">₹{selectedVendor.sellerProfile.deliverySettings.deliveryCharges}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Free Delivery Above</label>
                  {editMode ? (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">₹</span>
                      <input
                        type="number"
                        className="w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        value={editData.sellerProfile?.deliverySettings?.freeDeliveryAbove || ''}
                        onChange={(e) => handleInputChange('sellerProfile.deliverySettings.freeDeliveryAbove', parseInt(e.target.value))}
                      />
                    </div>
                  ) : (
                    <p className="text-xl font-semibold text-green-600 p-3 bg-green-50 rounded-lg border border-green-200">₹{selectedVendor.sellerProfile.deliverySettings.freeDeliveryAbove}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Areas (Pincodes)</label>
                  {editMode ? (
                    <input
                      type="text"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="Enter pincodes separated by commas (e.g., 452001, 452002)"
                      value={editData.sellerProfile?.deliverySettings?.deliveryAreas?.join(', ') || ''}
                      onChange={(e) => handleInputChange('sellerProfile.deliverySettings.deliveryAreas', e.target.value.split(', ').filter(area => area.trim()))}
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {selectedVendor.sellerProfile.deliverySettings.deliveryAreas.map((area, index) => (
                        <span key={index} className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium border border-blue-200">
                          {area}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-6">
            {/* Payment Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 border shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Earnings</p>
                    <p className="text-2xl font-bold text-green-600">₹{selectedVendor.sellerProfile.payments.totalEarnings.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <DollarSign size={24} className="text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pending Amount</p>
                    <p className="text-2xl font-bold text-orange-600">₹{selectedVendor.sellerProfile.payments.pendingAmount.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock size={24} className="text-orange-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Commission</p>
                    <p className="text-2xl font-bold text-blue-600">₹{selectedVendor.sellerProfile.payments.totalCommission.toLocaleString()}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText size={24} className="text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Actions */}
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowPaymentForm(true)}
                  className="flex items-center justify-center gap-2 p-4 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors font-medium border border-green-200"
                >
                  <Plus size={18} />
                  Add Payment
                </button>
                <button 
                  onClick={() => {
                    const reportData = {
                      vendorName: selectedVendor.name,
                      totalEarnings: selectedVendor.sellerProfile.payments.totalEarnings,
                      pendingAmount: selectedVendor.sellerProfile.payments.pendingAmount,
                      totalCommission: selectedVendor.sellerProfile.payments.totalCommission,
                      paymentHistory: selectedVendor.sellerProfile.payments.paymentHistory
                    };
                    
                    const dataStr = JSON.stringify(reportData, null, 2);
                    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                    const exportFileDefaultName = `payment-report-${selectedVendor.name}-${new Date().toISOString().split('T')[0]}.json`;
                    
                    const linkElement = document.createElement('a');
                    linkElement.setAttribute('href', dataUri);
                    linkElement.setAttribute('download', exportFileDefaultName);
                    linkElement.click();
                  }}
                  className="flex items-center justify-center gap-2 p-4 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors font-medium border border-blue-200"
                >
                  <Download size={18} />
                  Generate Report
                </button>
              </div>
            </div>

            {/* Payment History */}
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Payment History</h3>
              {selectedVendor.sellerProfile.payments.paymentHistory.length > 0 ? (
                <div className="space-y-4">
                  {selectedVendor.sellerProfile.payments.paymentHistory.map((payment, index) => (
                    <div key={payment.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            payment.type === 'advance' ? 'bg-blue-100 text-blue-600' :
                            payment.type === 'payment' ? 'bg-green-100 text-green-600' :
                            'bg-red-100 text-red-600'
                          }`}>
                            <DollarSign size={18} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">₹{payment.amount.toLocaleString()}</p>
                            <p className="text-sm text-gray-600">{payment.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                            payment.type === 'advance' ? 'bg-blue-100 text-blue-700' :
                            payment.type === 'payment' ? 'bg-green-100 text-green-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {payment.type.toUpperCase()}
                          </span>
                          <p className="text-sm text-gray-500 mt-1">{payment.status}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>{new Date(payment.timestamp).toLocaleDateString('en-IN')}</span>
                        <span>Ref: {payment.referenceId}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <DollarSign size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No payment history available</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="space-y-6">
            {/* Documents Section */}
            <div className="bg-white rounded-xl p-6 border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Verification Documents</h3>
              <div className="space-y-6">
                {[
                  { key: 'businessLicense', label: 'Business License', required: true },
                  { key: 'panCard', label: 'PAN Card', required: true },
                  { key: 'aadharCard', label: 'Aadhar Card', required: true },
                  { key: 'fssaiLicense', label: 'FSSAI License', required: false }
                ].map((doc) => (
                  <div key={doc.key} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{doc.label}</span>
                        {doc.required && <span className="text-red-500 text-sm">*</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedVendor.sellerProfile.verificationDocuments[doc.key] ? (
                          <CheckCircle size={20} className="text-green-500" />
                        ) : (
                          <AlertCircle size={20} className="text-red-500" />
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        {editMode ? (
                          <input
                            type="text"
                            className="w-full p-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            value={editData.sellerProfile?.verificationDocuments?.[doc.key] || ''}
                            onChange={(e) => handleInputChange(`sellerProfile.verificationDocuments.${doc.key}`, e.target.value)}
                            placeholder="Enter document number"
                          />
                        ) : (
                          <span className="text-gray-600 text-sm">
                            {selectedVendor.sellerProfile.verificationDocuments[doc.key] || 'Not provided'}
                          </span>
                        )}
                      </div>
                      
                      {editMode && (
                        <button
                          onClick={() => handleDocumentUpload(doc.key)}
                          disabled={uploadingDoc === doc.key}
                          className="ml-3 flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {uploadingDoc === doc.key ? (
                            <>
                              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload size={14} />
                              Upload
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Verification Actions */}
              {!selectedVendor.sellerProfile.isVerified && (
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle size={20} className="text-amber-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="text-amber-900 font-medium">Verification Required</h4>
                      <p className="text-amber-700 text-sm mt-1">
                        This vendor needs to be verified before they can start selling on the platform.
                      </p>
                      <button
                        onClick={handleVerifyVendor}
                        className="mt-3 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                      >
                        Verify Vendor
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'subscription' && (
          // <div className="space-y-6">
          //   <div className="bg-white rounded-xl p-6 border shadow-sm">
          //     <h3 className="text-lg font-semibold text-gray-900 mb-6">Subscription Management</h3>
              
          //     {/* Current Subscription Status */}
          //     <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 mb-6">
          //       <div className="flex items-center justify-between">
          //         <div>
          //           <h4 className="text-xl font-bold text-gray-900">Premium Plan</h4>
          //           <p className="text-gray-600 mt-1">Access to all premium features</p>
          //           <div className="flex items-center gap-4 mt-3">
          //             <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">Active</span>
          //             <span className="text-gray-600 text-sm">Expires: Dec 31, 2024</span>
          //           </div>
          //         </div>
          //         <div className="text-right">
          //           <p className="text-3xl font-bold text-blue-600">₹999</p>
          //           <p className="text-gray-600 text-sm">per month</p>
          //         </div>
          //       </div>
          //     </div>

          //     {/* Subscription Features */}
          //     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          //       {[
          //         { icon: CheckCircle, label: 'Unlimited Product Listings', active: true },
          //         { icon: CheckCircle, label: 'Priority Customer Support', active: true },
          //         { icon: CheckCircle, label: 'Advanced Analytics', active: true },
          //         { icon: CheckCircle, label: 'Promotional Tools', active: true },
          //         { icon: X, label: 'Featured Store Placement', active: false },
          //         { icon: X, label: 'Bulk Import Tools', active: false }
          //       ].map((feature, index) => {
          //         const IconComponent = feature.icon;
          //         return (
          //           <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
          //             <IconComponent 
          //               size={18} 
          //               className={feature.active ? 'text-green-500' : 'text-gray-400'} 
          //             />
          //             <span className={`text-sm ${feature.active ? 'text-gray-900' : 'text-gray-500'}`}>
          //               {feature.label}
          //             </span>
          //           </div>
          //         );
          //       })}
          //     </div>

          //     {/* Subscription Actions */}
          //     <div className="flex flex-col sm:flex-row gap-3">
          //       <button className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
          //         Upgrade Plan
          //       </button>
          //       <button className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium">
          //         View Billing History
          //       </button>
          //     </div>
          //   </div>
          // </div>
          <VendorSubscriptionDashboard/>
        )}

        {activeTab === 'products' && (
          <ProductManagement/>
        )}
      </div>

      {showPaymentForm && <PaymentModal />}
    </div>
  );

  // Main Vendors List View
  if (showProfile) {
    return <VendorProfile />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Vendor Management</h1>
              <p className="text-gray-600 mt-1">Manage and monitor all vendor accounts</p>
            </div>
            <button
              onClick={() => setShowAddVendor(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2 w-fit"
            >
              <Plus size={18} />
              Add Vendor
            </button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Vendors</p>
                  <p className="text-2xl font-bold">{vendors.length}</p>
                </div>
                <Users size={24} className="text-blue-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Active Vendors</p>
                  <p className="text-2xl font-bold">{vendors.filter(v => v.status === 'active').length}</p>
                </div>
                <CheckCircle size={24} className="text-green-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100 text-sm">Pending Approval</p>
                  <p className="text-2xl font-bold">{vendors.filter(v => v.status === 'pending').length}</p>
                </div>
                <Clock size={24} className="text-amber-200" />
              </div>
            </div>
            
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold">₹{Math.round(vendors.reduce((sum, v) => sum + v.revenue, 0) / 1000)}k</p>
                </div>
                <TrendingUp size={24} className="text-purple-200" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b">
        <div className="px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search vendors by name, store, or email..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </select>
              <ChevronDown size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-3 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="Vegetables & Fruits">Vegetables & Fruits</option>
                <option value="Spices & Masalas">Spices & Masalas</option>
                <option value="Meat & Poultry">Meat & Poultry</option>
                <option value="Bakery & Sweets">Bakery & Sweets</option>
                <option value="Dairy Products">Dairy Products</option>
                <option value="Beverages">Beverages</option>
              </select>
              <ChevronDown size={20} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredVendors.map((vendor) => (
            <div key={vendor.id} className="bg-white rounded-xl border shadow-sm hover:shadow-md transition-all duration-200">
              <div className="p-6">
                {/* Vendor Header */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                    {vendor.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate">{vendor.sellerProfile.storeName}</h3>
                    <p className="text-gray-600 text-sm">{vendor.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1">
                        {renderStars(vendor.rating)}
                        <span className="text-sm font-medium text-gray-700 ml-1">{vendor.rating}</span>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(vendor.status)}`}>
                        {vendor.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Vendor Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone size={14} />
                    <span>{vendor.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail size={14} />
                    <span className="truncate">{vendor.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Store size={14} />
                    <span>{vendor.category}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Calendar size={14} />
                    <span>Joined {new Date(vendor.joinDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-xl font-bold text-blue-600">{vendor.totalOrders}</p>
                    <p className="text-xs text-blue-700 font-medium">Orders</p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-xl font-bold text-green-600">₹{(vendor.revenue / 1000).toFixed(0)}k</p>
                    <p className="text-xs text-green-700 font-medium">Revenue</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedVendor(vendor);
                      setShowProfile(true);
                    }}
                    className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm flex items-center justify-center gap-2"
                  >
                    <Eye size={14} />
                    View Details
                  </button>
                  <button
                    onClick={() => handleEditVendor(vendor)}
                    className="bg-gray-100 text-gray-600 p-2 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Edit size={14} />
                  </button>
                  <button
                    onClick={() => handleStatusChange(vendor.id, vendor.status === 'active' ? 'inactive' : 'active')}
                    className={`p-2 rounded-lg transition-colors ${
                      vendor.status === 'active' 
                        ? 'bg-red-100 text-red-600 hover:bg-red-200' 
                        : 'bg-green-100 text-green-600 hover:bg-green-200'
                    }`}
                  >
                    {vendor.status === 'active' ? <Ban size={14} /> : <Check size={14} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredVendors.length === 0 && (
          <div className="text-center py-12">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No vendors found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
          </div>
        )}
      </div>

      {showAddVendor && <AddVendorModal />}
    </div>
  );
};

export default VendorManagement;