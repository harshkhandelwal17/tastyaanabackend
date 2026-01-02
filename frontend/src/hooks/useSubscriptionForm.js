import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Schema for subscription form validation
const subscriptionSchema = yup.object().shape({
  mealPlanId: yup.string().required('Meal plan is required'),
  planType: yup.string().required('Plan type is required'),
  duration: yup
    .number()
    .when('planType', {
      is: 'custom',
      then: yup.number().required('Duration is required').min(1, 'Minimum 1 day').max(365, 'Maximum 365 days'),
      otherwise: yup.number().notRequired(),
    }),
  deliveryTiming: yup.object().shape({
    morning: yup.object().shape({
      enabled: yup.boolean(),
      time: yup
        .string()
        .when('morning.enabled', {
          is: true,
          then: yup.string().required('Morning delivery time is required').matches(
            /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
            'Invalid time format (HH:MM)'
          ),
        }),
    }),
    evening: yup.object().shape({
      enabled: yup.boolean(),
      time: yup
        .string()
        .when('evening.enabled', {
          is: true,
          then: yup.string().required('Evening delivery time is required').matches(
            /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
            'Invalid time format (HH:MM)'
          ),
        }),
    }),
  }).test(
    'at-least-one-meal',
    'At least one meal time must be selected',
    (value) => value.morning.enabled || value.evening.enabled
  ),
  selectedAddOns: yup.array().of(
    yup.object().shape({
      id: yup.string().required('Add-on ID is required'),
      name: yup.string().required('Add-on name is required'),
      price: yup.number().required('Add-on price is required').min(0, 'Price cannot be negative'),
      quantity: yup.number().required('Quantity is required').min(1, 'Minimum quantity is 1'),
    })
  ),
  dietaryPreference: yup.string().required('Dietary preference is required'),
  deliveryAddress: yup.object().shape({
    street: yup.string().required('Street address is required'),
    city: yup.string().required('City is required'),
    state: yup.string().required('State is required'),
    pincode: yup.string().required('Pincode is required').matches(/^[1-9][0-9]{5}$/, 'Invalid Indian pincode'),
    landmark: yup.string(),
    instructions: yup.string(),
  }),
  startDate: yup.date().required('Start date is required').min(new Date(), 'Start date cannot be in the past'),
  autoRenewal: yup.boolean().default(true),
});

// Schema for pause subscription form validation
const pauseSubscriptionSchema = yup.object().shape({
  startDate: yup.date().required('Start date is required').min(new Date(), 'Start date cannot be in the past'),
  endDate: yup
    .date()
    .required('End date is required')
    .min(
      yup.ref('startDate'),
      'End date must be after start date'
    )
    .test(
      'max-duration',
      'Pause duration cannot exceed 30 days',
      function(endDate) {
        const { startDate } = this.parent;
        if (!startDate || !endDate) return true;
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
      }
    ),
  reason: yup.string().max(500, 'Reason must be less than 500 characters'),
});

// Schema for skip delivery form validation
const skipDeliverySchema = yup.object().shape({
  date: yup.date().required('Date is required').min(new Date(), 'Date cannot be in the past'),
  shift: yup.string().required('Shift is required').oneOf(['morning', 'evening'], 'Invalid shift'),
  reason: yup.string().required('Reason is required').max(500, 'Reason must be less than 500 characters'),
});

// Schema for meal customization form validation
const mealCustomizationSchema = yup.object().shape({
  date: yup.date().required('Date is required'),
  shift: yup.string().required('Shift is required').oneOf(['morning', 'evening'], 'Invalid shift'),
  type: yup.string().required('Customization type is required').oneOf(['permanent', 'temporary', 'one-time'], 'Invalid type'),
  baseMeal: yup.string().required('Base meal is required'),
  replacementMeal: yup.string().when('type', {
    is: (type) => type !== 'remove',
    then: yup.string().required('Replacement meal is required'),
  }),
  addOns: yup.array().of(
    yup.object().shape({
      id: yup.string().required('Add-on ID is required'),
      name: yup.string().required('Add-on name is required'),
      price: yup.number().required('Add-on price is required').min(0, 'Price cannot be negative'),
      quantity: yup.number().required('Quantity is required').min(1, 'Minimum quantity is 1'),
    })
  ),
  preferences: yup.object().shape({
    spiceLevel: yup.string().oneOf(['mild', 'medium', 'spicy'], 'Invalid spice level'),
    oilFree: yup.boolean(),
    lessSalt: yup.boolean(),
    noOnionNoGarlic: yup.boolean(),
  }),
  notes: yup.string().max(500, 'Notes must be less than 500 characters'),
});

/**
 * Custom hook for handling subscription forms
 * @param {string} formType - Type of form ('subscription', 'pause', 'skip', 'customize')
 * @param {Object} defaultValues - Default form values
 * @returns {Object} Form methods and state
 */
const useSubscriptionForm = (formType, defaultValues = {}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Determine which schema to use based on form type
  const getSchema = () => {
    switch (formType) {
      case 'pause':
        return pauseSubscriptionSchema;
      case 'skip':
        return skipDeliverySchema;
      case 'customize':
        return mealCustomizationSchema;
      case 'subscription':
      default:
        return subscriptionSchema;
    }
  };

  // Initialize form with react-hook-form
  const methods = useForm({
    resolver: yupResolver(getSchema()),
    defaultValues,
    mode: 'onChange',
  });

  // Reset form when defaultValues change
  useEffect(() => {
    methods.reset(defaultValues);
  }, [defaultValues, methods]);

  // Handle form submission
  const handleSubmit = async (onSubmit) => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      await methods.handleSubmit(onSubmit)();
    } catch (error) {
      console.error('Form submission error:', error);
      setSubmitError(error.message || 'An error occurred while submitting the form');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    methods.reset(defaultValues);
    setSubmitError(null);
  };

  return {
    ...methods,
    isSubmitting,
    submitError,
    handleSubmit: (onSubmit) => (e) => {
      e?.preventDefault();
      handleSubmit(onSubmit);
    },
    resetForm,
    setError: methods.setError,
    clearError: () => setSubmitError(null),
  };
};

export default useSubscriptionForm;
