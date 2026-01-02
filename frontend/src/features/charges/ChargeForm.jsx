import { useEffect } from 'react';
import { useForm } from 'react-hook-form';

// Custom validation function
const validateFormData = (data) => {
  const errors = {};
  
  if (!data.name || data.name.trim() === '') {
    errors.name = 'Name is required';
  }
  
  if (!data.chargeType) {
    errors.chargeType = 'Type is required';
  }
  
  if (data.value === undefined || data.value === null || data.value === '') {
    errors.value = 'Value is required';
  } else if (isNaN(Number(data.value))) {
    errors.value = 'Value must be a number';
  } else if (Number(data.value) < 0) {
    errors.value = 'Value must be a positive number';
  }
  
  if (!data.chargeValueType) {
    errors.chargeValueType = 'Value type is required';
  }
  
  return {
    values: data,
    errors
  };
};

// Charge types that will be used in the form
const CHARGE_TYPES = [
  { value: 'delivery', label: 'Delivery Fee' },
  { value: 'packing', label: 'Packing Charge' },
  { value: 'service', label: 'Service Charge' },
  { value: 'tax', label: 'Tax' },
  { value: 'handling', label: 'Handling Fee' },
  { value: 'discount', label: 'Discount' },
  { value: 'other', label: 'Other' },
];

const ChargeForm = ({ 
  initialData, 
  onSubmit, 
  isLoading, 
  isEditing = false,
  error = null 
}) => {
  const {
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    register,
    setError,
    clearErrors
  } = useForm({
    defaultValues: initialData || {
      name: '',
      chargeType: '',
      chargeValueType: 'fixed',
      value: '',
      description: '',
      isActive: true,
      isDefault: false,
      minOrderValue: '',
      maxDiscount: ''
    }
  });

  const chargeValueType = watch('chargeValueType');
  const isDefault = watch('isDefault');

  // Handle form submission
  const handleFormSubmit = (data) => {
    // Run custom validation
    const { values, errors } = validateFormData(data);
    
    // If there are validation errors, set them in the form
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) => {
        setError(field, { type: 'manual', message });
      });
      return;
    }
    
    // Clear any previous errors
    clearErrors();
    
    // Convert empty strings to undefined for optional number fields
    const formattedData = {
      ...values,
      minOrderValue: values.minOrderValue || undefined,
      maxDiscount: values.maxDiscount || undefined,
    };
    
    onSubmit(formattedData);
  };

  // Set default charge type if not set
  useEffect(() => {
    if (!initialData?.chargeType && CHARGE_TYPES.length > 0) {
      setValue('chargeType', CHARGE_TYPES[0].value, { shouldValidate: true });
    }
  }, [initialData, setValue, CHARGE_TYPES]);

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error.message || 'An error occurred. Please try again.'}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Charge Name *
            </label>
            <input
              type="text"
              id="name"
              placeholder="e.g. Delivery Fee, Service Charge"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm font-medium text-red-600 mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Charge Type */}
          <div className="space-y-2">
            <label htmlFor="chargeType" className="block text-sm font-medium text-gray-700">
              Charge Type *
            </label>
            <select
              id="chargeType"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('chargeType')}
              disabled={isLoading}
            >
              <option value="">Select a charge type</option>
              {CHARGE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.chargeType && (
              <p className="text-sm font-medium text-red-600 mt-1">
                {errors.chargeType.message}
              </p>
            )}
          </div>

          {/* Value Type */}
          <div className="space-y-2">
            <label htmlFor="chargeValueType" className="block text-sm font-medium text-gray-700">
              Value Type *
            </label>
            <select
              id="chargeValueType"
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('chargeValueType')}
              disabled={isLoading}
            >
              <option value="">Select value type</option>
              <option value="fixed">Fixed Amount</option>
              <option value="percentage">Percentage</option>
            </select>
            {errors.chargeValueType && (
              <p className="text-sm font-medium text-red-600 mt-1">
                {errors.chargeValueType.message}
              </p>
            )}
          </div>

          {/* Value */}
          <div className="space-y-2">
            <label htmlFor="value" className="block text-sm font-medium text-gray-700">
              {watch('chargeValueType') === 'percentage' ? 'Percentage' : 'Amount'} *
            </label>
            <div className="relative">
              {watch('chargeValueType') === 'percentage' ? (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              ) : (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
              )}
              <input
                id="value"
                type="number"
                min="0"
                step={watch('chargeValueType') === 'percentage' ? '0.01' : '0.01'}
                placeholder={watch('chargeValueType') === 'percentage' ? '0.00' : '0.00'}
                className="flex h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
                {...register('value')}
              />
            </div>
            {errors.value && (
              <p className="text-sm font-medium text-red-600 mt-1">
                {errors.value.message}
              </p>
            )}
            {watch('chargeValueType') === 'percentage' && (
              <p className="text-xs text-gray-500">
                Enter a value between 0 and 100
              </p>
            )}
          </div>

          {/* Minimum Order Value */}
          <div className="space-y-2">
            <label htmlFor="minOrderValue" className="block text-sm font-medium text-gray-700">
              Minimum Order Value (Optional)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                id="minOrderValue"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="flex h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isLoading}
                {...register('minOrderValue')}
              />
            </div>
            <p className="text-xs text-gray-500">
              Minimum order amount for this charge to apply
            </p>
          </div>

          {/* Max Discount (for percentage only) */}
          {watch('chargeValueType') === 'percentage' && (
            <div className="space-y-2">
              <label htmlFor="maxDiscount" className="block text-sm font-medium text-gray-700">
                Maximum Discount (Optional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                  id="maxDiscount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="flex h-10 w-full rounded-md border border-input bg-background pl-8 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading}
                  {...register('maxDiscount')}
                />
              </div>
              <p className="text-xs text-gray-500">
                Maximum discount amount (for percentage-based discounts)
              </p>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2 md:col-span-2">
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description (Optional)
            </label>
            <textarea
              id="description"
              placeholder="Enter a description for this charge"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isLoading}
              {...register('description')}
            />
            <p className="text-xs text-gray-500">
              A brief description of what this charge is for
            </p>
          </div>

          {/* Toggle Switches */}
          <div className="space-y-4 md:col-span-2 pt-2">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                disabled={isLoading}
                {...register('isActive')}
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Active
              </label>
              {errors.isActive && (
                <p className="text-sm font-medium text-red-600">
                  {errors.isActive.message}
                </p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isDefault"
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                disabled={isLoading || watch('isDefault')}
                {...register('isDefault', {
                  onChange: (e) => {
                    if (e.target.checked) {
                      setValue('isDefault', true);
                    } else {
                      setValue('isDefault', false);
                    }
                  }
                })}
              />
              <label htmlFor="isDefault" className="text-sm font-medium text-gray-700">
                Set as default
              </label>
              {errors.isDefault && (
                <p className="text-sm font-medium text-red-600">
                  {errors.isDefault.message}
                </p>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Default charges are automatically applied to all orders
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t md:col-span-2">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
              onClick={() => window.history.back()}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </span>
              ) : isEditing ? (
                'Update Charge'
              ) : (
                'Create Charge'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChargeForm;
