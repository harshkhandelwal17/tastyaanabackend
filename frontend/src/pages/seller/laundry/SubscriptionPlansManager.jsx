import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Save, 
  Loader2, 
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Package,
  Trash2,
  Edit,
  Store,
  Calendar,
  Clock,
  RefreshCw
} from 'lucide-react';
import laundryService from '../../../services/laundryService';

export default function SubscriptionPlansManager() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState([]);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [vendorNotFound, setVendorNotFound] = useState(false);

  const [newPlan, setNewPlan] = useState({
    id: '',
    name: '',
    price: 0,
    maxWeight: null,
    schedule: {
      frequencyType: 'weekly', // 'weekly' or 'monthly'
      pickupsPerPeriod: 2, // e.g., 2 per week, 4 per month
      pickupDays: [], // [0, 2, 4] for Sunday, Tuesday, Thursday
      pickupTimeSlots: ['morning', 'afternoon'],
      returnSchedule: {
        type: 'next_day', // 'same_day', 'next_day', 'after_days'
        days: 1
      }
    },
    features: {
      unlimitedPickups: false,
      services: [],
      freeDryClean: 0,
      freeExpressService: 0,
      quickServiceQuota: 0,
      quickServiceDiscount: 0,
      shoeCleaningFree: 0,
      turnaroundTime: '48 hours',
      priority: false,
      vipSupport: false
    },
    isActive: true
  });

  const daysOfWeek = [
    { value: 0, label: 'Sunday', short: 'Sun' },
    { value: 1, label: 'Monday', short: 'Mon' },
    { value: 2, label: 'Tuesday', short: 'Tue' },
    { value: 3, label: 'Wednesday', short: 'Wed' },
    { value: 4, label: 'Thursday', short: 'Thu' },
    { value: 5, label: 'Friday', short: 'Fri' },
    { value: 6, label: 'Saturday', short: 'Sat' }
  ];

  const timeSlots = [
    { value: 'morning', label: 'Morning (9 AM - 12 PM)' },
    { value: 'afternoon', label: 'Afternoon (12 PM - 4 PM)' },
    { value: 'evening', label: 'Evening (4 PM - 7 PM)' }
  ];

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const response = await laundryService.getMyVendor();
      const vendor = response?.data;
      
      if (vendor) {
        // Ensure all plans have schedule structure
        const plansWithSchedule = (vendor.subscriptionPlans || []).map(plan => ({
          ...plan,
          schedule: plan.schedule || {
            frequencyType: 'weekly',
            pickupsPerPeriod: 2,
            pickupDays: [],
            pickupTimeSlots: ['morning', 'afternoon'],
            returnSchedule: {
              type: 'next_day',
              days: 1
            }
          }
        }));
        setPlans(plansWithSchedule);
        setVendorNotFound(false);
      } else {
        setVendorNotFound(true);
      }
    } catch (error) {
      if (error.isNotFound || error.status === 404 || error.message?.includes('not found') || error.response?.status === 404) {
        setVendorNotFound(true);
      } else {
        console.error('Error loading plans:', error);
        setMessage({ type: 'error', text: error.message || 'Failed to load plans' });
      }
    } finally {
      setLoading(false);
    }
  };

  const savePlan = async (plan) => {
    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      // Validate schedule
      if (plan.schedule.frequencyType === 'weekly' && plan.schedule.pickupDays.length === 0) {
        throw new Error('Please select at least one pickup day for weekly schedule');
      }
      
      if (plan.schedule.pickupTimeSlots.length === 0) {
        throw new Error('Please select at least one time slot');
      }
      
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const apiURL = baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`;
      
      const response = await fetch(`${apiURL}/laundry/vendors/me/plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(plan)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Plan saved successfully!' });
        setTimeout(() => {
          setMessage({ type: '', text: '' });
          setShowAddPlan(false);
          setEditingPlan(null);
          loadPlans();
        }, 2000);
      } else {
        throw new Error(data.message || 'Failed to save plan');
      }
    } catch (error) {
      console.error('Error saving plan:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save plan' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddPlan = () => {
    setNewPlan({
      name: '',
      price: 0,
      maxWeight: null,
      schedule: {
        frequencyType: 'weekly',
        pickupsPerPeriod: 2,
        pickupDays: [],
        pickupTimeSlots: ['morning', 'afternoon'],
        returnSchedule: {
          type: 'next_day',
          days: 1
        }
      },
      features: {
        unlimitedPickups: false,
        services: [],
        freeDryClean: 0,
        freeExpressService: 0,
        quickServiceQuota: 0,
        quickServiceDiscount: 0,
        shoeCleaningFree: 0,
        turnaroundTime: '48 hours',
        priority: false,
        vipSupport: false
      },
      isActive: true
    });
    setShowAddPlan(true);
    setEditingPlan(null);
  };

  const handleEditPlan = (plan) => {
    setNewPlan({ 
      ...plan, 
      planId: plan.id,
      schedule: plan.schedule || {
        frequencyType: 'weekly',
        pickupsPerPeriod: 2,
        pickupDays: [],
        pickupTimeSlots: ['morning', 'afternoon'],
        returnSchedule: {
          type: 'next_day',
          days: 1
        }
      }
    });
    setEditingPlan(plan.id);
    setShowAddPlan(true);
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    
    try {
      const token = localStorage.getItem('token') || localStorage.getItem('authToken');
      const baseURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const apiURL = baseURL.endsWith('/api') ? baseURL : `${baseURL}/api`;
      
      const response = await fetch(`${apiURL}/laundry/vendors/me/plans/${planId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Plan deleted successfully!' });
        setTimeout(() => {
          setMessage({ type: '', text: '' });
          loadPlans();
        }, 2000);
      } else {
        throw new Error(data.message || 'Failed to delete plan');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to delete plan' });
    }
  };

  const togglePickupDay = (dayValue) => {
    const currentDays = newPlan.schedule.pickupDays || [];
    if (currentDays.includes(dayValue)) {
      setNewPlan({
        ...newPlan,
        schedule: {
          ...newPlan.schedule,
          pickupDays: currentDays.filter(d => d !== dayValue)
        }
      });
    } else {
      setNewPlan({
        ...newPlan,
        schedule: {
          ...newPlan.schedule,
          pickupDays: [...currentDays, dayValue]
        }
      });
    }
  };

  const toggleTimeSlot = (slot) => {
    const currentSlots = newPlan.schedule.pickupTimeSlots || [];
    if (currentSlots.includes(slot)) {
      setNewPlan({
        ...newPlan,
        schedule: {
          ...newPlan.schedule,
          pickupTimeSlots: currentSlots.filter(s => s !== slot)
        }
      });
    } else {
      setNewPlan({
        ...newPlan,
        schedule: {
          ...newPlan.schedule,
          pickupTimeSlots: [...currentSlots, slot]
        }
      });
    }
  };

  const availableServices = ['wash_fold', 'wash_iron', 'dry_clean', 'iron_only', 'shoe_cleaning'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
      </div>
    );
  }

  if (vendorNotFound) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full bg-white rounded-3xl shadow-xl p-8 border-2 border-gray-100">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="h-10 w-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Vendor Profile Not Found</h2>
          <p className="text-gray-600 mb-6">You need to create a vendor profile first.</p>
          <button
            onClick={() => navigate('/seller/laundry/create-profile')}
            className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:shadow-xl transition-all font-bold"
          >
            Create Vendor Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 p-4 lg:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2">Subscription Plans</h1>
            <p className="text-gray-600 text-base lg:text-lg">Create and manage subscription plans with custom schedules</p>
          </div>
          <button
            onClick={handleAddPlan}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:shadow-xl transition-all flex items-center gap-2 font-bold"
          >
            <Plus className="w-5 h-5" />
            Add New Plan
          </button>
        </div>

        {message.text && (
          <div className={`p-4 rounded-2xl flex items-center gap-3 shadow-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border-2 border-green-200' : 'bg-red-50 text-red-800 border-2 border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <AlertCircle className="w-6 h-6" />
            )}
            <span className="font-semibold">{message.text}</span>
          </div>
        )}

        {/* Plans List */}
        {plans.length === 0 && !showAddPlan ? (
          <div className="bg-white rounded-3xl shadow-xl p-12 text-center border-2 border-gray-100">
            <Package className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No Plans Yet</h3>
            <p className="text-gray-600 mb-8 text-lg">Create your first subscription plan to get started</p>
            <button
              onClick={handleAddPlan}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:shadow-xl transition-all font-bold"
            >
              Create Plan
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map(plan => {
              const schedule = plan.schedule || {};
              const frequencyLabel = schedule.frequencyType === 'weekly' 
                ? `${schedule.pickupsPerPeriod || 2} times/week`
                : `${schedule.pickupsPerPeriod || 4} times/month`;
              
              return (
                <div key={plan.id} className="bg-white rounded-3xl shadow-xl p-6 border-2 border-gray-100 hover:shadow-2xl transition-all">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-extrabold text-gray-900">{plan.name}</h3>
                    <span className={`px-4 py-2 rounded-xl text-xs font-bold ${
                      plan.isActive ? 'bg-green-100 text-green-800 border-2 border-green-300' : 'bg-gray-100 text-gray-800 border-2 border-gray-300'
                    }`}>
                      {plan.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  <div className="mb-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
                    <div className="text-3xl font-extrabold text-blue-600 mb-1">₹{plan.price}</div>
                    <div className="text-sm text-gray-600 font-semibold">per {schedule.frequencyType === 'weekly' ? 'week' : 'month'}</div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="font-semibold text-gray-700">{frequencyLabel}</span>
                    </div>
                    
                    {schedule.pickupDays && schedule.pickupDays.length > 0 && (
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold">Pickup Days: </span>
                        {schedule.pickupDays.map(day => daysOfWeek.find(d => d.value === day)?.short).join(', ')}
                      </div>
                    )}
                    
                    {schedule.returnSchedule && (
                      <div className="text-sm text-gray-600">
                        <span className="font-semibold">Return: </span>
                        {schedule.returnSchedule.type === 'same_day' ? 'Same Day' :
                         schedule.returnSchedule.type === 'next_day' ? 'Next Day' :
                         `After ${schedule.returnSchedule.days} Days`}
                      </div>
                    )}
                  </div>

                  {plan.maxWeight && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="text-sm text-gray-600 font-semibold">
                        Max Weight: <span className="text-gray-900">{plan.maxWeight} kg/{schedule.frequencyType === 'weekly' ? 'week' : 'month'}</span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mt-6">
                    <button
                      onClick={() => handleEditPlan(plan)}
                      className="flex-1 px-4 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 flex items-center justify-center gap-2 font-bold transition-all"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan.id)}
                      className="px-4 py-3 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add/Edit Plan Modal */}
        {showAddPlan && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl p-6 lg:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-gray-100">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-extrabold text-gray-900">
                  {editingPlan ? 'Edit Plan' : 'Add New Plan'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddPlan(false);
                    setEditingPlan(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-base font-bold text-gray-900 mb-2">
                      Plan Name *
                    </label>
                    <input
                      type="text"
                      value={newPlan.name}
                      onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                      className="w-full px-5 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-base font-medium"
                      placeholder="e.g., Basic Plan"
                    />
                  </div>
                  <div>
                    <label className="block text-base font-bold text-gray-900 mb-2">
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      value={newPlan.price}
                      onChange={(e) => setNewPlan({...newPlan, price: parseFloat(e.target.value) || 0})}
                      className="w-full px-5 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-base font-medium"
                      min="0"
                      placeholder="0"
                    />
                    <p className="text-xs text-gray-500 mt-1">Per {newPlan.schedule.frequencyType === 'weekly' ? 'week' : 'month'}</p>
                  </div>
                </div>

                {/* Schedule Configuration */}
                <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200">
                  <h3 className="text-xl font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                    <Calendar className="w-6 h-6 text-blue-600" />
                    Schedule Configuration
                  </h3>

                  {/* Frequency Type */}
                  <div className="mb-5">
                    <label className="block text-base font-bold text-gray-900 mb-3">
                      Frequency Type *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setNewPlan({
                          ...newPlan,
                          schedule: {
                            ...newPlan.schedule,
                            frequencyType: 'weekly',
                            pickupDays: []
                          }
                        })}
                        className={`p-4 rounded-2xl border-2 font-bold transition-all ${
                          newPlan.schedule.frequencyType === 'weekly'
                            ? 'border-blue-500 bg-blue-100 text-blue-900 shadow-lg'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Weekly
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPlan({
                          ...newPlan,
                          schedule: {
                            ...newPlan.schedule,
                            frequencyType: 'monthly',
                            pickupDays: []
                          }
                        })}
                        className={`p-4 rounded-2xl border-2 font-bold transition-all ${
                          newPlan.schedule.frequencyType === 'monthly'
                            ? 'border-blue-500 bg-blue-100 text-blue-900 shadow-lg'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Monthly
                      </button>
                    </div>
                  </div>

                  {/* Pickups Per Period */}
                  <div className="mb-5">
                    <label className="block text-base font-bold text-gray-900 mb-2">
                      Pickups Per {newPlan.schedule.frequencyType === 'weekly' ? 'Week' : 'Month'} *
                    </label>
                    <input
                      type="number"
                      value={newPlan.schedule.pickupsPerPeriod}
                      onChange={(e) => setNewPlan({
                        ...newPlan,
                        schedule: {
                          ...newPlan.schedule,
                          pickupsPerPeriod: parseInt(e.target.value) || 1
                        }
                      })}
                      className="w-full px-5 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-base font-medium"
                      min="1"
                      max={newPlan.schedule.frequencyType === 'weekly' ? '7' : '31'}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      How many times will you pick up laundry per {newPlan.schedule.frequencyType === 'weekly' ? 'week' : 'month'}?
                    </p>
                  </div>

                  {/* Pickup Days (only for weekly) */}
                  {newPlan.schedule.frequencyType === 'weekly' && (
                    <div className="mb-5">
                      <label className="block text-base font-bold text-gray-900 mb-3">
                        Pickup Days * (Select {newPlan.schedule.pickupsPerPeriod} days)
                      </label>
                      <div className="grid grid-cols-7 gap-2">
                        {daysOfWeek.map(day => (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => togglePickupDay(day.value)}
                            className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${
                              newPlan.schedule.pickupDays?.includes(day.value)
                                ? 'border-blue-500 bg-blue-100 text-blue-900 shadow-lg'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            {day.short}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Time Slots */}
                  <div className="mb-5">
                    <label className="block text-base font-bold text-gray-900 mb-3">
                      Pickup Time Slots *
                    </label>
                    <div className="space-y-2">
                      {timeSlots.map(slot => (
                        <label key={slot.value} className="flex items-center gap-3 p-3 bg-white rounded-xl border-2 border-gray-200 hover:border-blue-300 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newPlan.schedule.pickupTimeSlots?.includes(slot.value)}
                            onChange={() => toggleTimeSlot(slot.value)}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-semibold text-gray-700">{slot.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Return Schedule */}
                  <div>
                    <label className="block text-base font-bold text-gray-900 mb-3">
                      Return Schedule *
                    </label>
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      <button
                        type="button"
                        onClick={() => setNewPlan({
                          ...newPlan,
                          schedule: {
                            ...newPlan.schedule,
                            returnSchedule: { type: 'same_day', days: 0 }
                          }
                        })}
                        className={`p-4 rounded-xl border-2 font-bold transition-all ${
                          newPlan.schedule.returnSchedule?.type === 'same_day'
                            ? 'border-blue-500 bg-blue-100 text-blue-900 shadow-lg'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Same Day
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPlan({
                          ...newPlan,
                          schedule: {
                            ...newPlan.schedule,
                            returnSchedule: { type: 'next_day', days: 1 }
                          }
                        })}
                        className={`p-4 rounded-xl border-2 font-bold transition-all ${
                          newPlan.schedule.returnSchedule?.type === 'next_day'
                            ? 'border-blue-500 bg-blue-100 text-blue-900 shadow-lg'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        Next Day
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewPlan({
                          ...newPlan,
                          schedule: {
                            ...newPlan.schedule,
                            returnSchedule: { type: 'after_days', days: newPlan.schedule.returnSchedule?.days || 2 }
                          }
                        })}
                        className={`p-4 rounded-xl border-2 font-bold transition-all ${
                          newPlan.schedule.returnSchedule?.type === 'after_days'
                            ? 'border-blue-500 bg-blue-100 text-blue-900 shadow-lg'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        After Days
                      </button>
                    </div>
                    {newPlan.schedule.returnSchedule?.type === 'after_days' && (
                      <input
                        type="number"
                        value={newPlan.schedule.returnSchedule.days}
                        onChange={(e) => setNewPlan({
                          ...newPlan,
                          schedule: {
                            ...newPlan.schedule,
                            returnSchedule: {
                              type: 'after_days',
                              days: parseInt(e.target.value) || 2
                            }
                          }
                        })}
                        className="w-full px-5 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-base font-medium"
                        min="1"
                        max="7"
                        placeholder="Number of days"
                      />
                    )}
                  </div>
                </div>

                {/* Max Weight */}
                <div>
                  <label className="block text-base font-bold text-gray-900 mb-2">
                    Max Weight (kg) - Leave empty for unlimited
                  </label>
                  <input
                    type="number"
                    value={newPlan.maxWeight || ''}
                    onChange={(e) => setNewPlan({...newPlan, maxWeight: e.target.value ? parseFloat(e.target.value) : null})}
                    className="w-full px-5 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-base font-medium"
                    min="0"
                    placeholder="Unlimited"
                  />
                  <p className="text-xs text-gray-500 mt-1">Per {newPlan.schedule.frequencyType === 'weekly' ? 'week' : 'month'}</p>
                </div>

                {/* Services */}
                <div>
                  <label className="block text-base font-bold text-gray-900 mb-3">
                    Included Services
                  </label>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                    {availableServices.map(service => (
                      <label key={service} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border-2 border-gray-200 hover:border-blue-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newPlan.features.services.includes(service)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewPlan({
                                ...newPlan,
                                features: {
                                  ...newPlan.features,
                                  services: [...newPlan.features.services, service]
                                }
                              });
                            } else {
                              setNewPlan({
                                ...newPlan,
                                features: {
                                  ...newPlan.features,
                                  services: newPlan.features.services.filter(s => s !== service)
                                }
                              });
                            }
                          }}
                          className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-semibold text-gray-700 capitalize">{service.replace('_', ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Additional Features */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-base font-bold text-gray-900 mb-2">
                      Free Dry Clean Items
                    </label>
                    <input
                      type="number"
                      value={newPlan.features.freeDryClean}
                      onChange={(e) => setNewPlan({
                        ...newPlan,
                        features: {...newPlan.features, freeDryClean: parseFloat(e.target.value) || 0}
                      })}
                      className="w-full px-5 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-base font-medium"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-base font-bold text-gray-900 mb-2">
                      Quick Service Quota
                    </label>
                    <input
                      type="number"
                      value={newPlan.features.quickServiceQuota}
                      onChange={(e) => setNewPlan({
                        ...newPlan,
                        features: {...newPlan.features, quickServiceQuota: parseFloat(e.target.value) || 0}
                      })}
                      className="w-full px-5 py-3 border-2 border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-base font-medium"
                      min="0"
                    />
                  </div>
                </div>

                {/* Checkboxes */}
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border-2 border-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPlan.features.priority}
                      onChange={(e) => setNewPlan({
                        ...newPlan,
                        features: {...newPlan.features, priority: e.target.checked}
                      })}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">Priority Service</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border-2 border-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPlan.isActive}
                      onChange={(e) => setNewPlan({...newPlan, isActive: e.target.checked})}
                      className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">Active</span>
                  </label>
                </div>
              </div>

              <div className="flex gap-4 mt-8">
                <button
                  onClick={() => {
                    const planToSave = { ...newPlan };
                    if (editingPlan) {
                      planToSave.planId = editingPlan;
                    }
                    savePlan(planToSave);
                  }}
                  disabled={saving || !newPlan.name || !newPlan.price}
                  className="flex-1 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-2xl hover:shadow-xl disabled:opacity-50 flex items-center justify-center gap-2 font-bold transition-all"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  Save Plan
                </button>
                <button
                  onClick={() => {
                    setShowAddPlan(false);
                    setEditingPlan(null);
                  }}
                  className="flex-1 px-8 py-4 bg-gray-200 text-gray-700 rounded-2xl hover:bg-gray-300 font-bold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
