import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { FaSave, FaTimes } from 'react-icons/fa';

const SubscriptionForm = ({ 
  initialData = {}, 
  onSubmit, 
  onCancel,
  isSubmitting = false,
  error = null
}) => {
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm({
    defaultValues: {
      user: initialData.user || '',
      sellerId: initialData.sellerId || '',
      mealPlan: initialData.mealPlan || '',
      planType: initialData.planType || 'monthly',
      shift: initialData.shift || 'both',
      thaliCount: initialData.thaliCount || 1,
      isActive: initialData.isActive ?? true,
      ...initialData.deliverySettings,
    },
  });

  const [startDate, setStartDate] = useState(initialData.deliverySettings?.startDate ? new Date(initialData.deliverySettings.startDate) : new Date());
  const [deliveryDays, setDeliveryDays] = useState(initialData.deliverySettings?.deliveryDays || [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday'
  ]);

  const daysOfWeek = [
    { value: 'sunday', label: 'Sunday' },
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
  ];

  const handleDayToggle = (day) => {
    setDeliveryDays(prev => 
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const onSubmitForm = (data) => {
    onSubmit({
      ...data,
      deliverySettings: {
        ...data.deliverySettings,
        startDate,
        deliveryDays,
        startShift: data.shift === 'both' ? 'morning' : data.shift,
      },
    });
  };

  // Watch for shift changes to update form fields
  const selectedShift = watch('shift');

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          {initialData._id ? 'Edit Subscription' : 'Create New Subscription'}
        </h3>
      </div>
      
      <div className="p-6">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="user" className="block text-sm font-medium text-gray-700 mb-1">
                User <span className="text-red-500">*</span>
              </label>
              <input
                id="user"
                type="text"
                className={`w-full px-3 py-2 border ${
                  errors.user ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                {...register('user', { required: 'User is required' })}
              />
              {errors.user && (
                <p className="mt-1 text-sm text-red-600">{errors.user.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="sellerId" className="block text-sm font-medium text-gray-700 mb-1">
                Seller <span className="text-red-500">*</span>
              </label>
              <input
                id="sellerId"
                type="text"
                className={`w-full px-3 py-2 border ${
                  errors.sellerId ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                {...register('sellerId', { required: 'Seller is required' })}
              />
              {errors.sellerId && (
                <p className="mt-1 text-sm text-red-600">{errors.sellerId.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="mealPlan" className="block text-sm font-medium text-gray-700 mb-1">
                Meal Plan <span className="text-red-500">*</span>
              </label>
              <select
                id="mealPlan"
                className={`w-full px-3 py-2 border ${
                  errors.mealPlan ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                {...register('mealPlan', { required: 'Meal plan is required' })}
              >
                <option value="">Select a meal plan</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="non-vegetarian">Non-Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="keto">Keto</option>
              </select>
              {errors.mealPlan && (
                <p className="mt-1 text-sm text-red-600">{errors.mealPlan.message}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="planType" className="block text-sm font-medium text-gray-700 mb-1">
                Plan Type <span className="text-red-500">*</span>
              </label>
              <select
                id="planType"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                {...register('planType', { required: 'Plan type is required' })}
              >
                <option value="oneDay">One Day</option>
                <option value="tenDays">Ten Days</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="shift" className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Shift <span className="text-red-500">*</span>
              </label>
              <select
                id="shift"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                {...register('shift', { required: 'Shift is required' })}
              >
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
                <option value="both">Both</option>
              </select>
            </div>
            
            <div>
              <label htmlFor="thaliCount" className="block text-sm font-medium text-gray-700 mb-1">
                Number of Thalis <span className="text-red-500">*</span>
              </label>
              <input
                id="thaliCount"
                type="number"
                min="1"
                className={`w-full px-3 py-2 border ${
                  errors.thaliCount ? 'border-red-500' : 'border-gray-300'
                } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
                {...register('thaliCount', { 
                  required: 'Number of thalis is required',
                  min: { value: 1, message: 'At least 1 thali is required' }
                })}
              />
              {errors.thaliCount && (
                <p className="mt-1 text-sm text-red-600">{errors.thaliCount.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date
              </label>
              <DatePicker
                selected={startDate}
                onChange={(date) => setStartDate(date)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                minDate={new Date()}
                dateFormat="MMMM d, yyyy"
              />
            </div>
            
            <div className="flex items-end">
              <label className="inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  id="isActive"
                  className="sr-only peer"
                  {...register('isActive')}
                />
                <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                <span className="ms-3 text-sm font-medium text-gray-700">Active Subscription</span>
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Delivery Days
            </label>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => handleDayToggle(day.value)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md ${
                    deliveryDays.includes(day.value)
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <FaTimes className="mr-2 h-4 w-4" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="mr-2 h-4 w-4" />
                  Save Subscription
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubscriptionForm;
