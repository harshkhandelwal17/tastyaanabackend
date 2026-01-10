const mongoose = require("mongoose")
const Subscription = require('../models/Subscription');
const MealPlan = require('../models/MealPlan');
const User = require('../models/User');
const Order = require('../models/Order');
// const DailyMeal = require('../models/DailyMeal');
const DailyOrder = require('../models/DailyOrder');
const DailyMealDelivery = require('../models/DailyMealDelivery');
const AdminSettings = require('../models/AdminSettings');
const WalletTransaction = require('../models/WalletTransaction');
const Razorpay = require('razorpay');
const cron = require('node-cron');
const moment = require('moment-timezone');
const { createNotification } = require('../utils/notificationService');

const DailyMeal = require('../models/DailyMeal');
const MealCustomization = require('../models/MealCustomization');
// const moment = require('moment-timezone');
const ExcelJS = require('exceljs');
// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ============================================
// 1. Create Subscription
// ============================================
// ============================================
// UPDATED: subscriptionController.js
// ============================================

// Updated createSubscription method
// Fixed createSubscription method
// Fixed createSubscription method
// const createSubscription = async (req, res) => {
//   try {
//     const {
//       mealPlanId,
//       planType,
//       duration,
//       deliveryTiming,
//       selectedAddOns,
//       customizations,
//       dietaryPreference,
//       deliveryAddress,
//       startDate,
//       startShift = 'morning',
//       autoRenewal,
//       pricing // Get pricing from frontend
//     } = req.body;

//     const userId = req.user.id;

//     // Check if user already has an active subscription
//     const existingSubscription = await Subscription.findOne({
//       user: userId,
//       status: { $in: ['active', 'pending_payment'] }
//     });

//     if (existingSubscription) {
//       return res.status(400).json({
//         success: false,
//         message: 'You already have an active subscription. Please cancel or complete your existing subscription first.',
//         data: {
//           existingSubscription: {
//             id: existingSubscription._id,
//             status: existingSubscription.status,
//             startDate: existingSubscription.startDate,
//             endDate: existingSubscription.endDate
//           }
//         }
//       });
//     }

//     // Validate meal plan
//     const mealPlan = await MealPlan.findById(mealPlanId);
//     if (!mealPlan) {
//       return res.status(404).json({
//         success: false,
//         message: 'Meal plan not found'
//       });
//     }

//     // Calculate meals per day
//     const mealsPerDay = (deliveryTiming.morning.enabled ? 1 : 0) + 
//                        (deliveryTiming.evening.enabled ? 1 : 0);

//     if (mealsPerDay === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'At least one meal timing must be selected'
//       });
//     }

//     // Use pricing from frontend or calculate here
//     let finalPricing;
//     if (pricing && pricing.finalAmount) {
//       // Use pricing calculated in frontend - match backend schema
//       finalPricing = {
//         basePricePerMeal: pricing.basePricePerMeal,
//         totalDays: duration,
//         mealsPerDay,
//         totalMeals: duration * mealsPerDay,
//         totalAmount: pricing.totalAmount, // Base meal plan amount
//         addOnsPrice: pricing.addOnsPrice || 0,
//         customizationPrice: pricing.customizationPrice || 0,
//         finalAmount: pricing.finalAmount
//       };
//     } else {
//       // Fallback calculation
//       const totalAmount = mealPlan.pricing[planType] || mealPlan.pricing.oneDay;
//       const totalMeals = duration * mealsPerDay;
//       const basePricePerMeal = totalAmount / totalMeals;

//       // Calculate add-ons price for entire subscription duration
//       const addOnsPrice = selectedAddOns.reduce((sum, addOn) => {
//         return sum + (addOn.price * totalMeals); // Add-ons multiplied by total meals
//       }, 0);

//       const subtotal = totalAmount + addOnsPrice;
//       const gst = subtotal * 0.05;
//       const packagingCharges = 10 * duration;

//       finalPricing = {
//         basePricePerMeal: basePricePerMeal,
//         totalDays: duration,
//         mealsPerDay,
//         totalMeals,
//         totalAmount: totalAmount, // Base meal plan amount
//         addOnsPrice: addOnsPrice,
//         customizationPrice: 0,
//         finalAmount: subtotal + gst + packagingCharges
//       };
//     }

//     // Validate final amount
//     if (finalPricing.finalAmount < 1) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid subscription amount'
//       });
//     }

//     // Create subscription
//     const subscription = new Subscription({
//       user: userId,
//       mealPlan: mealPlanId,
//       planType,
//       duration: duration,
//       deliveryTiming,
//       pricing: finalPricing,
//       selectedAddOns,
//       customizations,
//       dietaryPreference,
//       deliveryAddress,
//       startDate: new Date(startDate),
//       startShift: startShift,
//       autoRenewal,
//       status: 'pending_payment' // Wait for payment before activating
//     });

//     await subscription.save();

//     // Create Razorpay order for the full subscription amount
//     const razorpayOrder = await razorpay.orders.create({
//       amount: Math.round(finalPricing.finalAmount * 100), // Convert to paise
//       currency: 'INR',
//       receipt: `sub_${subscription.subscriptionId}_${Date.now()}`,
//       notes: {
//         subscriptionId: subscription._id.toString(),
//         userId: userId.toString(),
//         type: 'subscription_payment',
//         mealPlanId: mealPlanId.toString(),
//         duration: duration.toString()
//       }
//     });

//     // Update subscription with Razorpay order ID
//     subscription.razorpayOrderId = razorpayOrder.id;
//     await subscription.save();

//     res.status(201).json({
//       success: true,
//       message: 'Subscription created, proceed with payment',
//       data: {
//         subscription: {
//           id: subscription._id,
//           subscriptionId: subscription.subscriptionId,
//           finalAmount: subscription.pricing.finalAmount,
//           duration: subscription.duration,
//           mealsPerDay: subscription.pricing.mealsPerDay,
//           startDate: subscription.startDate,
//           endDate: subscription.endDate,
//           status: subscription.status
//         },
//         payment: {
//           razorpayOrderId: razorpayOrder.id,
//           amount: razorpayOrder.amount,
//           currency: razorpayOrder.currency,
//           key: process.env.RAZORPAY_KEY_ID
//         }
//       }
//     });

//   } catch (error) {
//    
//     res.status(500).json({
//       success: false,
//       message: 'Failed to create subscription',
//       error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
//     });
//   }
// };
const createSubscription = async (req, res) => {
  try {
    // Destructure the payload from the request body
    const {
      mealPlanId,
      planType,
      thaliCount,
      deliverySettings,
      deliveryTiming,
      shift,
      selectedAddOns,
      customizations,
      dietaryPreference,
      deliveryAddress,
      autoRenewal,
      pricing,
      startDate,
      specialInstructions,
      preferences,
      couponCode,
      couponId,
      discount
    } = req.body;

    const userId = req.user.id;


    // **CRITICAL FIX**: Check for existing active subscription BEFORE creating new subscription
    // This prevents the duplicate key error during payment processing
    const existingActiveSubscription = await Subscription.findOne({
      user: userId,
      status: 'active'
    });

    if (existingActiveSubscription) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active subscription. Please cancel your current subscription before creating a new one.',
        code: 'DUPLICATE_ACTIVE_SUBSCRIPTION',
        existingSubscription: {
          id: existingActiveSubscription.subscriptionId,
          mealPlan: existingActiveSubscription.mealPlan,
          startDate: existingActiveSubscription.startDate,
          status: existingActiveSubscription.status
        }
      });
    }

    // Validate required fields
    if (!mealPlanId) {
      return res.status(400).json({
        success: false,
        message: 'Meal plan ID is required'
      });
    }

    if (!planType) {
      return res.status(400).json({
        success: false,
        message: 'Plan type is required'
      });
    }

    // FIXED: Handle unique index constraint by cleaning up old pending_payment subscriptions
    // Check for any existing pending_payment subscriptions that might cause unique index conflicts
    const existingPendingSubscriptions = await Subscription.find({
      user: userId,
      status: 'pending_payment'
    });


    // Clean up old pending_payment subscriptions to prevent unique index conflicts
    if (existingPendingSubscriptions.length > 0) {

      // Update all pending_payment subscriptions to cancelled status
      await Subscription.updateMany(
        {
          user: userId,
          status: 'pending_payment'
        },
        {
          $set: {
            status: 'cancelled',
            cancellationReason: 'Replaced by new subscription - auto-cancelled',
            cancelledAt: new Date()
          }
        }
      );
    }

    // CRITICAL: Check for existing subscriptions to prevent duplicates
    // Use a more strict check to prevent race conditions
    const existingSubscriptions = await Subscription.find({
      user: userId,
      status: { $in: ['active', 'pending_payment'] },
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Only check last 5 minutes
    });


    // If there are any recent subscriptions, block creation to prevent duplicates
    if (existingSubscriptions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A subscription was recently created. Please wait a moment or check your existing subscriptions.',
        error: 'RECENT_SUBSCRIPTION_EXISTS',
        data: {
          existingSubscription: {
            id: existingSubscriptions[0]._id,
            subscriptionId: existingSubscriptions[0].subscriptionId,
            status: existingSubscriptions[0].status,
            createdAt: existingSubscriptions[0].createdAt
          }
        }
      });
    }

    // Additional check: Prevent duplicate subscriptions with same meal plan and timing
    const duplicateCheck = await Subscription.findOne({
      user: userId,
      mealPlan: mealPlanId,
      planType: planType,
      status: { $in: ['active', 'pending_payment'] },
      createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) } // Check last 10 minutes
    });

    if (duplicateCheck) {

      return res.status(400).json({
        success: false,
        message: 'A subscription with this meal plan and type was recently created. Please check your existing subscriptions.',
        error: 'DUPLICATE_SUBSCRIPTION_ATTEMPT',
        data: {
          existingSubscription: {
            id: duplicateCheck._id,
            subscriptionId: duplicateCheck.subscriptionId,
            status: duplicateCheck.status,
            createdAt: duplicateCheck.createdAt
          }
        }
      });
    }

    // FIXED: Clean up old failed subscriptions before creating new ones
    // This prevents the unique index error when user tries to create subscription after failed payment
    const oldFailedSubscriptions = await Subscription.find({
      user: userId,
      status: 'pending_payment',
      createdAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) } // Older than 5 minutes
    });



    // Clean up old failed subscriptions to prevent unique index conflicts
    if (oldFailedSubscriptions.length > 0) {

      await Subscription.updateMany(
        {
          user: userId,
          status: 'pending_payment',
          createdAt: { $lt: new Date(Date.now() - 5 * 60 * 1000) }
        },
        {
          $set: {
            status: 'cancelled',
            cancellationReason: 'Payment failed - auto-cancelled after 5 minutes',
            cancelledAt: new Date()
          }
        }
      );

    }

    // Optional: Limit to prevent abuse (e.g., max 3 active subscriptions)
    const maxActiveSubscriptions = 3;
    const totalActiveSubscriptions = await Subscription.countDocuments({
      user: userId,
      status: 'active'
    });

    if (totalActiveSubscriptions >= maxActiveSubscriptions) {
      return res.status(400).json({
        success: false,
        message: `You can have maximum ${maxActiveSubscriptions} active subscriptions at a time. Please cancel some existing ones first.`,
        error: 'MAX_SUBSCRIPTIONS_REACHED',
        data: {
          activeCount: totalActiveSubscriptions,
          maxAllowed: maxActiveSubscriptions
        }
      });
    }

    // Note: Old subscriptions are kept - users can have multiple subscriptions
    // Only active and pending subscriptions block new ones

    // 2. Validate meal plan exists
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }


    // 3. Calculate duration based on planType
    let calculatedDuration;
    switch (planType) {
      case 'oneDay':
        calculatedDuration = 1;
        break;
      case 'tenDays':
        calculatedDuration = 10;
        break;
      case 'thirtyDays':
      case 'monthly':
        calculatedDuration = 30;
        break;
      default:
        calculatedDuration = pricing?.totalDays || 30;
    }

    // 4. Calculate end date
    const subscriptionStartDate = startDate ? new Date(startDate) : new Date();
    const endDate = new Date(subscriptionStartDate);
    endDate.setDate(endDate.getDate() + calculatedDuration - 1); // -1 because start date counts as day 1

    // 4.5. Validate start date - ensure it's not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison

    if (subscriptionStartDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Subscription start date cannot be in the past. Please select a future date.',
        error: 'INVALID_START_DATE'
      });
    }

    // Note: Date conflicts are allowed - users can have overlapping subscriptions
    // The maxActiveSubscriptions limit above prevents abuse

    // 5. Calculate total meals based on plan type and delivery timing
    let totalMeals = calculatedDuration;
    if (planType === 'thirtyDays' || planType === 'monthly') {
      // For 30-day plans, calculate considering Sundays (1 meal) vs weekdays (2 meals)
      const startDateObj = new Date(subscriptionStartDate);
      let sundays = 0;
      let weekdays = 0;

      for (let i = 0; i < calculatedDuration; i++) {
        const currentDate = new Date(startDateObj);
        currentDate.setDate(startDateObj.getDate() + i);
        if (currentDate.getDay() === 0) { // Sunday
          sundays++;
        } else {
          weekdays++;
        }
      }

      totalMeals = (weekdays * 2) + sundays; // 2 meals on weekdays, 1 on Sundays
    }

    // 6. Set delivery timing based on shift
    const finalDeliveryTiming = {
      morning: {
        enabled: shift === 'both' || shift === 'morning',
        time: deliveryTiming?.morning?.time || '08:00'
      },
      evening: {
        enabled: shift === 'both' || shift === 'evening',
        time: deliveryTiming?.evening?.time || '19:00'
      }
    };

    // 7. Calculate pricing
    let finalPricing;
    if (!pricing) {
      // Default pricing calculation if not provided
      const basePricePerMeal = mealPlan.price || 0;
      const totalDays = calculatedDuration;
      const mealsPerDay = 1; // Default to 1 meal per day
      const totalMeals = totalDays * mealsPerDay;
      const totalAmount = basePricePerMeal * totalMeals;

      // Apply coupon discount if provided
      let finalAmount = totalAmount;
      if (couponCode && couponId && discount && discount > 0) {
        finalAmount = Math.max(0, totalAmount - discount);
      }

      finalPricing = {
        basePricePerMeal: basePricePerMeal,
        totalDays: totalDays,
        mealsPerDay: mealsPerDay,
        totalMeals: totalMeals,
        totalAmount: totalAmount,
        couponCode: couponCode || null,
        couponId: couponId || null,
        discount: discount || 0,
        finalAmount: finalAmount
      };
    } else {
      // Use provided pricing but apply coupon if needed
      finalPricing = { ...pricing };
      if (couponCode && couponId && discount && discount > 0) {
        finalPricing.couponCode = couponCode;
        finalPricing.couponId = couponId;
        finalPricing.discount = discount;
        finalPricing.finalAmount = Math.max(0, (pricing.finalAmount || pricing.totalAmount) - discount);
      }
    }

    // 8. Create subscription data with corrected schema - USE FRONTEND DATA WHEN AVAILABLE
    const subscriptionData = {
      // Let the model generate the subscriptionId automatically
      user: userId,
      mealPlan: mealPlanId,
      defaultMeal: mealPlanId,
      planType,
      shift: shift || 'both',
      duration: calculatedDuration,
      startShift: deliverySettings?.startShift || 'morning',
      thaliCount: thaliCount || 1,

      // Use frontend data when available, fallback to calculated values
      deliverySettings: deliverySettings || {
        startDate: subscriptionStartDate,
        startShift: deliverySettings?.startShift || 'morning',
        deliveryDays: [
          { day: 'monday' }, { day: 'tuesday' }, { day: 'wednesday' },
          { day: 'thursday' }, { day: 'friday' }, { day: 'saturday' },
          { day: 'sunday' }
        ],
        firstDeliveryDate: subscriptionStartDate,
        lastDeliveryDate: endDate
      },

      deliveryTiming: deliveryTiming || finalDeliveryTiming,

      // Use frontend mealCounts if provided, otherwise calculate
      mealCounts: req.body.mealCounts || {
        totalMeals: finalPricing.totalMeals,
        mealsDelivered: 0,
        mealsSkipped: 0,
        mealsRemaining: finalPricing.totalMeals,
        regularMealsDelivered: 0,
        sundayMealsDelivered: 0
      },

      // Add the calculated pricing
      pricing: finalPricing,
      // Use frontend data for these fields
      selectedAddOns: selectedAddOns || [],
      customizations: req.body.customizations || [],
      customizationPreferences: req.body.customizationPreferences || customizations || [],
      dietaryPreference: dietaryPreference || 'vegetarian',
      deliveryAddress: deliveryAddress || {},

      // Use frontend dates if provided, otherwise calculate
      startDate: req.body.startDate ? new Date(req.body.startDate) : subscriptionStartDate,
      endDate: req.body.endDate ? new Date(req.body.endDate) : endDate,
      nextDeliveryDate: req.body.nextDeliveryDate ? new Date(req.body.nextDeliveryDate) : subscriptionStartDate,

      // Use frontend autoRenewal if provided
      autoRenewal: req.body.autoRenewal !== undefined ? {
        enabled: req.body.autoRenewal,
        renewalType: 'same_duration'
      } : {
        enabled: autoRenewal || false,
        renewalType: 'same_duration'
      },

      status: req.body.status || 'pending_payment', // Use frontend status if provided
      paymentStatus: req.body.paymentStatus || 'pending',
      isActive: req.body.isActive !== undefined ? req.body.isActive : false,

      // Use frontend values if provided
      thalisDelivered: req.body.thalisDelivered || 0,
      remainingMeals: req.body.remainingMeals || totalMeals,

      // Initialize customization tracking arrays
      customizationHistory: req.body.customizationHistory || [],
      customizedDays: req.body.customizedDays || [],
      skippedMeals: req.body.skippedMeals || [],
      dailyDeductions: req.body.dailyDeductions || [],
      thaliReplacements: req.body.thaliReplacements || [],
      mealCustomizations: req.body.mealCustomizations || [],

      // Use frontend defaultMealPreferences if provided
      defaultMealPreferences: req.body.defaultMealPreferences || {
        morning: {
          spiceLevel: preferences?.morning?.spiceLevel || 'medium',
          dietaryPreference: preferences?.morning?.dietaryPreference || dietaryPreference || 'vegetarian',
          preferences: {
            noOnion: preferences?.morning?.preferences?.noOnion || false,
            noGarlic: preferences?.morning?.preferences?.noGarlic || false,
            specialInstructions: preferences?.morning?.preferences?.specialInstructions || specialInstructions || ''
          },
          customizations: preferences?.morning?.customizations || [],
          quantity: preferences?.morning?.quantity || 1,
          timing: 'morning',
          isCustomized: false,
          lastUpdated: new Date()
        },
        evening: {
          spiceLevel: preferences?.evening?.spiceLevel || 'medium',
          dietaryPreference: preferences?.evening?.dietaryPreference || dietaryPreference || 'vegetarian',
          preferences: {
            noOnion: preferences?.evening?.preferences?.noOnion || false,
            noGarlic: preferences?.evening?.preferences?.noGarlic || false,
            specialInstructions: preferences?.evening?.preferences?.specialInstructions || specialInstructions || ''
          },
          customizations: preferences?.evening?.customizations || [],
          quantity: preferences?.evening?.quantity || 1,
          timing: 'evening',
          isCustomized: false,
          lastUpdated: new Date()
        }
      },

      // Use frontend values for these fields
      skipSettings: req.body.skipSettings || {
        maxSkipsPerMonth: 8,
        skipsUsedThisMonth: 0,
        lastSkipReset: new Date()
      },

      thaliReplacement: req.body.thaliReplacement || {
        priceDifference: 0,
        isDefault: false
      },

      metadata: req.body.metadata || {
        createdVia: "web",
        deviceInfo: "Unknown",
        promoCode: "",
        discountApplied: 0
      }
    };

    // Additional cleanup for very old failed subscriptions (older than 24 hours)
    try {
      const veryOldFailedSubscriptions = await Subscription.find({
        user: userId,
        status: 'pending_payment',
        createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Older than 24 hours
      });

      if (veryOldFailedSubscriptions.length > 0) {

        // Update old subscriptions to 'cancelled' status instead of deleting
        await Subscription.updateMany(
          {
            user: userId,
            status: 'pending_payment',
            createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
          },
          {
            $set: {
              status: 'cancelled',
              cancellationReason: 'Payment failed - auto-cancelled after 24 hours',
              cancelledAt: new Date()
            }
          }
        );

      }
    } catch (cleanupError) {
      console.warn('Warning: Failed to cleanup very old subscriptions:', cleanupError);
      // Continue with subscription creation even if cleanup fails
    }

    // CRITICAL: Clean up any duplicate subscriptions created in the last few minutes
    try {
      const recentDuplicates = await Subscription.find({
        user: userId,
        status: 'pending_payment',
        createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // Last 5 minutes
        mealPlan: mealPlanId,
        planType: planType
      }).sort({ createdAt: -1 }); // Sort by newest first

      if (recentDuplicates.length > 1) {

        // Keep the newest one, cancel the rest
        const toCancel = recentDuplicates.slice(1); // All except the first (newest)
        await Subscription.updateMany(
          { _id: { $in: toCancel.map(sub => sub._id) } },
          {
            $set: {
              status: 'cancelled',
              cancellationReason: 'Duplicate subscription - auto-cancelled',
              cancelledAt: new Date()
            }
          }
        );

      }
    } catch (duplicateCleanupError) {
      console.warn('Warning: Failed to cleanup duplicate subscriptions:', duplicateCleanupError);
      // Continue with subscription creation even if cleanup fails
    }

    const newSubscription = new Subscription(subscriptionData);

    try {
      await newSubscription.save();

    } catch (saveError) {
      console.error('❌ Error saving subscription:', saveError);

      if (saveError.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Subscription with this ID already exists. Please try again.',
          error: 'DUPLICATE_SUBSCRIPTION_ID'
        });
      }

      if (saveError.name === 'ValidationError') {
        const validationErrors = Object.values(saveError.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Subscription validation failed',
          error: 'VALIDATION_ERROR',
          details: validationErrors
        });
      }

      throw saveError; // Re-throw to be caught by outer catch block
    }

    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: Math.round((pricing?.finalAmount || 0) * 100), // Amount in paise
        currency: 'INR',
        receipt: newSubscription.subscriptionId, // Use your unique ID as the receipt
        notes: {
          subscription_id: newSubscription._id.toString(),
          user_id: userId.toString(),
          meal_plan_id: mealPlanId.toString(),
          plan_type: planType,
          duration: calculatedDuration.toString()
        }
      });


    } catch (razorpayError) {
      console.error('❌ Error creating Razorpay order:', razorpayError);

      // Delete the subscription if Razorpay order creation fails
      try {
        await Subscription.findByIdAndDelete(newSubscription._id);

      } catch (cleanupError) {
        console.error('❌ Error cleaning up subscription:', cleanupError);
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order. Please try again.',
        error: 'RAZORPAY_ORDER_CREATION_FAILED'
      });
    }

    // 9. Send the Razorpay Order ID and your Subscription ID to the frontend
    res.status(201).json({
      success: true,
      message: 'Subscription created successfully. Please complete payment.',
      data: {
        orderId: razorpayOrder.id,
        subscriptionId: newSubscription._id,
        subscriptionIdString: newSubscription.subscriptionId,
        amount: razorpayOrder.amount,
        subscription: {
          id: newSubscription._id,
          subscriptionId: newSubscription.subscriptionId,
          planType: newSubscription.planType,
          duration: newSubscription.duration,
          totalMeals: newSubscription.mealCounts.totalMeals,
          startDate: newSubscription.startDate,
          endDate: newSubscription.endDate,
          status: newSubscription.status
        }
      }
    });

  } catch (error) {
    console.error('Error creating subscription:', error);

    // Handle duplicate key errors specifically
    if (error.code === 11000) {
      console.error('❌ Duplicate key error (E11000):', error);
      console.error('❌ Duplicate key details:', error.keyValue);

      // Check what field is causing the duplicate
      if (error.keyValue && error.keyValue.subscriptionId) {
        console.log('❌ Duplicate subscriptionId detected:', error.keyValue.subscriptionId);
        return res.status(400).json({
          success: false,
          message: 'Subscription ID collision detected. Please try again.',
          error: 'DUPLICATE_SUBSCRIPTION_ID',
          details: {
            field: 'subscriptionId',
            value: error.keyValue.subscriptionId
          }
        });
      } else if (error.keyValue && (error.keyValue.user || error.keyValue.mealPlan)) {
        console.log('❌ Database constraint violation:', error.keyValue);
        return res.status(400).json({
          success: false,
          message: 'Database constraint prevents multiple subscriptions. Please contact support.',
          error: 'DATABASE_CONSTRAINT_ERROR',
          details: error.keyValue
        });
      } else {
        console.log('❌ Unknown duplicate key error:', error.keyValue);
        return res.status(400).json({
          success: false,
          message: 'Subscription creation failed due to duplicate data. Please try again.',
          error: 'DUPLICATE_SUBSCRIPTION_DATA',
          details: error.keyValue
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
// ============================================
// 2. Process Subscription Payment & Transfer to Wallet
// ============================================
const processSubscriptionPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      subscription_id // Add this to get subscription ID directly
    } = req.body;

    const userId = req.user._id;

    // Import required models
    const Coupon = require('../models/Coupon');
    const CouponUsage = require('../models/CouponUsage');

    // Verify payment signature
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // IMPORTANT: Get subscription ID from request body - this ensures we verify the correct subscription
    // Users can have multiple subscriptions, so we need the specific subscription ID, not just user ID
    // Get subscription ID - try multiple sources
    let subscriptionId = subscription_id; // Direct from request body

    if (!subscriptionId) {
      // Try to get from Razorpay order notes
      try {
        const razorpayOrder = await razorpay.orders.fetch(razorpay_order_id);
        subscriptionId = razorpayOrder.notes.subscription_id;
      } catch (razorpayError) {
        console.error('Error fetching Razorpay order:', razorpayError);
      }
    }

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'Subscription ID not found. Please provide subscription_id in request body. This is required because users can have multiple subscriptions.'
      });
    }


    // Get payment details
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const paidAmount = payment.amount / 100;

    // **CRITICAL FIX**: Check for existing active subscription BEFORE processing payment
    // This prevents the duplicate key error that occurs when trying to activate a subscription
    // when the user already has an active subscription
    const existingActiveSubscription = await Subscription.findOne({
      user: userId,
      status: 'active',
      _id: { $ne: subscriptionId } // Exclude the current subscription being processed
    });

    if (existingActiveSubscription) {
      console.log(`❌ User ${userId} already has an active subscription: ${existingActiveSubscription.subscriptionId}`);

      // Instead of failing completely, we could offer options:
      // Option 1: Return error and ask user to cancel existing subscription first
      return res.status(409).json({
        success: false,
        message: 'You already have an active subscription. Please cancel your current subscription before creating a new one.',
        code: 'DUPLICATE_ACTIVE_SUBSCRIPTION',
        existingSubscription: {
          id: existingActiveSubscription.subscriptionId,
          mealPlan: existingActiveSubscription.mealPlan,
          startDate: existingActiveSubscription.startDate,
          status: existingActiveSubscription.status
        }
      });

      // Option 2: Auto-cancel the old subscription (uncomment if preferred)
      // try {
      //   await Subscription.findByIdAndUpdate(existingActiveSubscription._id, {
      //     status: 'cancelled',
      //     isActive: false,
      //     cancelledAt: new Date(),
      //     cancellationReason: 'Replaced by new subscription'
      //   });
      //   console.log(`✅ Auto-cancelled old subscription: ${existingActiveSubscription.subscriptionId}`);
      // } catch (cancelError) {
      //   console.error('Error auto-cancelling old subscription:', cancelError);
      //   return res.status(500).json({
      //     success: false,
      //     message: 'Failed to cancel existing subscription. Please contact support.'
      //   });
      // }
    }

    // Find the existing subscription by ID - this is the key: we verify by subscription ID, not user ID
    // Use findOneAndUpdate with optimistic locking to prevent write conflicts
    // NO TRANSACTION - use atomic operations instead
    const subscription = await Subscription.findOneAndUpdate(
      {
        _id: subscriptionId,
        status: 'pending_payment' // Only update if still pending
      },
      {
        $set: {
          status: 'active',
          paymentStatus: 'paid',
          isActive: true,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          activatedAt: new Date()
        }
      },
      {
        new: true, // Return the updated document
        runValidators: false // Skip validation to avoid conflicts
      }
    );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found or already processed'
      });
    }

    // Verify the subscription belongs to the user (security check)
    if (subscription.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Subscription does not belong to this user.'
      });
    }

    // Verify payment amount matches subscription amount
    if (Math.abs(paidAmount - subscription.pricing.finalAmount) > 0.01) {
      return res.status(400).json({
        success: false,
        message: `Payment amount mismatch. Expected: ${subscription.pricing.finalAmount}, Paid: ${paidAmount}`
      });
    }

    // Calculate and set next delivery date
    const today = new Date();
    const startDate = new Date(subscription.startDate);

    let nextDeliveryDate;
    if (startDate <= today) {
      // If start date is today or in the past, start from tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      nextDeliveryDate = tomorrow;
    } else {
      // If start date is in the future, use that
      nextDeliveryDate = startDate;
    }

    // Update next delivery date separately to avoid conflicts
    await Subscription.findByIdAndUpdate(
      subscriptionId,
      { $set: { nextDeliveryDate } },
      { runValidators: false }
    );

    // Record coupon usage if coupon was applied
    if (subscription.pricing.couponCode && subscription.pricing.couponId) {
      try {


        const couponUsage = new CouponUsage({
          couponId: subscription.pricing.couponId,
          userId: userId,
          subscriptionId: subscription._id,
          usageType: 'subscription',
          discountAmount: subscription.pricing.discount || 0,
          orderTotal: subscription.pricing.totalAmount,
          couponCode: subscription.pricing.couponCode,
          referenceNumber: subscription.subscriptionId
        });

        await couponUsage.save();

        // Update coupon usage count
        await Coupon.findByIdAndUpdate(subscription.pricing.couponId, {
          $inc: { usedCount: 1 },
          $set: { lastUsedAt: new Date() }
        });


      } catch (couponError) {
        console.error('❌ Error recording coupon usage:', couponError);

        // Check if it's a duplicate key error (user already used this coupon)
        if (couponError.code === 11000) {
          console.log(`⚠️ User ${userId} has already used coupon ${subscription.pricing.couponCode} for this subscription`);
        }

        // Don't fail subscription creation if coupon tracking fails
      }
    } else {
      console.log('No coupon usage to record for this subscription');
    }

    // Create wallet transaction for subscription payment credit (if using wallet system)
    try {
      const WalletTransaction = require('../models/WalletTransaction');
      const walletTransaction = new WalletTransaction({
        user: userId,
        amount: paidAmount,
        type: 'credit',
        status: 'completed',
        method: 'razorpay',
        referenceId: razorpay_payment_id,
        note: `Subscription payment credited - ${subscription.subscriptionId}`,
        metadata: {
          subscriptionId: subscription._id,
          razorpayOrderId: razorpay_order_id,
          razorpayPaymentId: razorpay_payment_id,
          subscriptionType: 'prepaid_wallet_credit',
          duration: subscription.duration,
          totalMeals: subscription.mealCounts.totalMeals,
          paymentMethod: payment.method,
          cardType: payment.card?.type,
          bank: payment.bank
        }
      });

      await walletTransaction.save();

      // Update subscription with wallet transaction reference
      await Subscription.findByIdAndUpdate(
        subscriptionId,
        { $set: { walletTransaction: walletTransaction._id } },
        { runValidators: false }
      );
    } catch (walletError) {
      console.warn('Wallet transaction creation failed (non-blocking):', walletError);
      // Continue without wallet transaction if it fails
    }

    // Update user subscription status
    await User.findByIdAndUpdate(userId, {
      $set: {
        'subscription.isActive': true,
        'subscription.currentPlan': subscription._id
      }
    }, { runValidators: false });

    // Create notification for successful subscription activation
    try {
      await createNotification({
        userId: userId,
        title: 'Subscription Activated',
        message: `Your ${subscription.planType} subscription has been activated successfully!`,
        type: 'subscription',
        data: {
          subscriptionId: subscription._id,
          planType: subscription.planType,
          duration: subscription.duration
        }
      });
    } catch (notificationError) {
      console.warn('Notification creation failed (non-blocking):', notificationError);
    }



    res.json({
      success: true,
      message: 'Subscription payment processed successfully!',
      data: {
        subscriptionId: subscription._id,
        subscriptionIdString: subscription.subscriptionId,
        status: subscription.status,
        paymentStatus: subscription.paymentStatus,
        nextDeliveryDate: nextDeliveryDate,
        totalMeals: subscription.mealCounts.totalMeals,
        planType: subscription.planType,
        duration: subscription.duration
      }
    });

  } catch (error) {
    console.error('Error processing subscription payment:', error);

    // Check if this is a write conflict that we can retry
    if (error.code === 112 || error.codeName === 'WriteConflict') {
      console.error('Write conflict detected - this should not happen without transactions');
      return res.status(500).json({
        success: false,
        message: 'Database write conflict detected. Please try again.',
        error: 'WRITE_CONFLICT'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process subscription payment',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};
// ============================================
// 3. Daily Deduction System (Cron Job)
// ============================================
// const processDailyDeductions = async () => {
//   try {
//     console.log('🕐 Starting daily deduction process...');

//     const today = new Date();
//     today.setHours(0, 0, 0, 0); // Set to start of day for consistent comparison

//     const currentHour = new Date().getHours();

//     // Determine meal type based on time
//     let mealType;
//     if (currentHour >= 6 && currentHour < 12) {
//       mealType = 'morning';
//     } else if (currentHour >= 18 && currentHour < 24) {
//       mealType = 'evening';
//     } else {
//       console.log('⏰ Not a valid meal deduction time');
//       return;
//     }

//     console.log(`🍽️ Processing ${mealType} meal deductions for ${today.toDateString()}`);

//     // Find active subscriptions that need deduction for this meal type
//     const subscriptions = await Subscription.find({
//       status: 'active',
//       startDate: { $lte: today },
//       endDate: { $gte: today },
//       [`deliveryTiming.${mealType}.enabled`]: true
//     }).populate('user mealPlan');

//     console.log(`📋 Found ${subscriptions.length} subscriptions to process`);

//     let processed = 0;
//     let failed = 0;

//     for (const subscription of subscriptions) {
//       const session = await mongoose.startSession();
//       session.startTransaction();

//       try {
//         // Check if already deducted for this date and meal type
//         const existingDeduction = subscription.dailyDeductions.find(d => 
//           d.date.toDateString() === today.toDateString() && 
//           d.mealType === mealType &&
//           d.status === 'deducted'
//         );

//         if (existingDeduction) {
//           console.log(`⏭️ Already deducted for ${subscription.subscriptionId} - ${mealType} on ${today.toDateString()}`);
//           await session.abortTransaction();
//           continue;
//         }

//         // Check if meal is skipped
//         const isSkipped = subscription.skippedDates.some(skip =>
//           skip.date.toDateString() === today.toDateString() &&
//           skip.mealType === mealType
//         );

//         if (isSkipped) {
//           console.log(`⏭️ Meal skipped for ${subscription.subscriptionId} - ${mealType} on ${today.toDateString()}`);
//           await session.abortTransaction();
//           continue;
//         }

//         // Calculate deduction amount
//         const baseMealAmount = subscription.pricing.basePricePerMeal;

//         // Calculate add-ons amount (per meal basis)
//         const addOnsAmount = subscription.selectedAddOns.reduce((sum, addOn) => {
//           return sum + (addOn.price || 0);
//         }, 0);

//         const totalDeductionAmount = baseMealAmount + addOnsAmount;

//         // Check wallet balance
//         const user = await User.findById(subscription.user._id).session(session);
//         if (user.wallet.balance < totalDeductionAmount) {
//           console.log(`💳 Insufficient balance for ${user.email} - Required: ₹${totalDeductionAmount}, Available: ₹${user.wallet.balance}`);

//           // Create failed deduction record
//           subscription.dailyDeductions.push({
//             date: today,
//             mealType,
//             baseMealAmount,
//             addOnsAmount,
//             totalAmount: totalDeductionAmount,
//             status: 'failed',
//             reason: 'insufficient_balance'
//           });

//           // Pause subscription due to insufficient funds
//           subscription.status = 'paused';
//           subscription.pauseReason = 'insufficient_wallet_balance';
//           subscription.pausedAt = new Date();

//           await subscription.save({ session });
//           await session.commitTransaction();

//           failed++;
//           continue;
//         }

//         // Create wallet deduction transaction
//         const walletTransaction = new WalletTransaction({
//           user: subscription.user._id,
//           amount: totalDeductionAmount,
//           type: 'debit',
//           status: 'completed',
//           method: 'wallet',
//           referenceId: subscription._id.toString(),
//           note: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} meal deduction - ${subscription.subscriptionId}`,
//           metadata: {
//             subscriptionId: subscription._id,
//             mealType,
//             date: today.toISOString(),
//             baseMealAmount,
//             addOnsAmount,
//             mealPlanId: subscription.mealPlan._id,
//             addOns: subscription.selectedAddOns.map(addon => ({
//               name: addon.name,
//               price: addon.price
//             }))
//           }
//         });

//         await walletTransaction.save({ session });

//         // Add successful deduction record
//         subscription.dailyDeductions.push({
//           date: today,
//           mealType,
//           baseMealAmount,
//           addOnsAmount,
//           totalAmount: totalDeductionAmount,
//           status: 'deducted',
//           walletTransaction: walletTransaction._id,
//           processedAt: new Date()
//         });

//         await subscription.save({ session });

//         // Create order for meal delivery
//         const order = new Order({
//           orderNumber: `SUB_${subscription.subscriptionId}_${today.toISOString().split('T')[0]}_${mealType.toUpperCase()}`,
//           userId: subscription.user._id,
//           type: 'subscription',
//           subscriptionId: subscription._id,
//           items: [
//             {
//               name: `${subscription.mealPlan.title} - ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`,
//               quantity: 1,
//               price: baseMealAmount,
//               category: 'main',
//               customizations: subscription.customizations,
//               productId: subscription.mealPlan._id
//             },
//             // Add selected add-ons as separate items
//             ...subscription.selectedAddOns.map(addon => ({
//               name: addon.name,
//               quantity: 1,
//               price: addon.price,
//               category: 'addon',
//               productId: addon._id || addon.id || `addon_${addon.name.toLowerCase().replace(/\s+/g, '_')}`
//             }))
//           ],
//           deliveryAddress: subscription.deliveryAddress,
//           deliveryDate: today,
//           deliverySlot: mealType,
//           subtotal: baseMealAmount,
//           taxes: { 
//             gst: 0, 
//             deliveryCharges: 0, 
//             packagingCharges: 0 
//           },
//           totalAmount: totalDeductionAmount,
//           paymentMethod: 'wallet',
//           paymentStatus: 'paid',
//           status: 'confirmed',
//           specialInstructions: `Subscription meal - ${subscription.dietaryPreference}. Add-ons: ${subscription.selectedAddOns.map(a => a.name).join(', ')}`,
//           isAutoOrder: true,
//           isPartOfSubscription: true,
//           walletTransactionId: walletTransaction._id
//         });

//         await order.save({ session });

//         await session.commitTransaction();

//         console.log(`✅ Successfully processed deduction for ${user.email} - ₹${totalDeductionAmount} (Base: ₹${baseMealAmount}, Add-ons: ₹${addOnsAmount})`);
//         processed++;

//       } catch (error) {
//         await session.abortTransaction();
//         console.error(`❌ Error processing subscription ${subscription.subscriptionId}:`, error);
//         failed++;
//       } finally {
//         session.endSession();
//       }
//     }

//     console.log(`🎯 Daily deduction completed - Processed: ${processed}, Failed: ${failed}`);

//   } catch (error) {
//     console.error('❌ Error in daily deduction process:', error);
//   }
// };
const processDailyDeductions = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const currentHour = new Date().getHours();
    const isSunday = today.getDay() === 0; // 0 is Sunday

    // Determine meal type based on time
    let mealType;
    if (currentHour >= 6 && currentHour < 12) {
      mealType = 'morning';
    } else if (currentHour >= 18 && currentHour < 24) {
      // On Sunday, skip evening meal deduction
      if (isSunday) {
        console.log('⏰ Sunday - skipping evening meal deduction');
        return;
      }
      mealType = 'evening';
    } else {
      console.log('⏰ Not a valid meal deduction time');
      return;
    }

    console.log(`🍽️ Processing ${mealType} meal deductions for ${today.toDateString()}`);

    // Find active subscriptions
    const subscriptions = await Subscription.find({
      status: 'active',
      startDate: { $lte: today },
      endDate: { $gte: today }
    }).populate('user').populate({
      path: 'mealPlan',
      populate: {
        path: 'createdBy seller',
        select: '_id name email'
      }
    });


    let processed = 0;
    let failed = 0;

    for (const subscription of subscriptions) {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Check if already deducted for this date and meal type
        const existingDeduction = subscription.dailyDeductions.find(d =>
          d.date.toDateString() === today.toDateString() &&
          d.mealType === mealType &&
          d.status === 'deducted'
        );

        if (existingDeduction) {

          await session.abortTransaction();
          continue;
        }

        // Calculate base meal amount per meal
        let baseMealAmountPerMeal;
        const isThirtyDayPlan = subscription.planType === 'thirtyDays' || subscription.planType === 'monthly';

        if (isThirtyDayPlan) {
          // For 30-day plans, divide total amount by 56 (60 - 4 Sundays)
          baseMealAmountPerMeal = subscription.pricing.totalAmount / 56;
        } else {
          // For other plans, use simple division by total meals
          baseMealAmountPerMeal = subscription.pricing.totalAmount / subscription.pricing.totalMeals;
        }

        // Calculate add-ons amount (only for the current meal type)
        let addOnsAmount = 0;
        let instantPaymentAmount = 0;

        // Process add-ons for the current meal type
        if (subscription.deliveryTiming[mealType]?.enabled) {
          // Base add-ons (included in subscription)
          addOnsAmount = subscription.selectedAddOns
            .filter(addOn => addOn.includedInSubscription)
            .reduce((sum, addOn) => {
              if (!addOn.mealType || addOn.mealType === mealType || addOn.mealType === 'both') {
                return sum + (addOn.price || 0);
              }
              return sum;
            }, 0);

          // Additional add-ons (require instant payment)
          instantPaymentAmount = subscription.selectedAddOns
            .filter(addOn => !addOn.includedInSubscription)
            .reduce((sum, addOn) => {
              if (!addOn.mealType || addOn.mealType === mealType || addOn.mealType === 'both') {
                return sum + (addOn.price || 0);
              }
              return sum;
            }, 0);
        }

        // Calculate total deduction amount for this meal
        // Only base meal amount is deducted from wallet
        const walletDeductionAmount = baseMealAmountPerMeal + addOnsAmount;

        // Additional amount that needs instant payment
        if (instantPaymentAmount > 0) {
          // Create a payment intent for the additional amount
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(instantPaymentAmount * 100), // in paise
            currency: 'inr',
            customer: user.stripeCustomerId,
            description: `Additional charges for ${mealType} meal on ${today.toDateString()}`,
            metadata: {
              subscriptionId: subscription._id.toString(),
              date: today.toISOString(),
              mealType,
              type: 'additional_charges'
            }
          });

          // Store payment intent ID for future reference
          subscription.pendingPayments.push({
            paymentIntentId: paymentIntent.id,
            amount: instantPaymentAmount,
            status: 'requires_payment_method',
            type: 'additional_charges',
            date: today,
            mealType
          });
        }

        // Check wallet balance
        const user = await User.findById(subscription.user._id).session(session);
        if (user.wallet.balance < walletDeductionAmount) {


          // Create failed deduction record
          subscription.dailyDeductions.push({
            date: today,
            mealType,
            baseMealAmount: baseMealAmountPerMeal,
            addOnsAmount,
            totalAmount: walletDeductionAmount,
            status: 'failed',
            reason: 'insufficient_balance'
          });

          // Pause subscription
          subscription.status = 'paused';
          subscription.pauseReason = 'insufficient_wallet_balance';
          subscription.pausedAt = new Date();

          await subscription.save({ session });
          await session.commitTransaction();

          failed++;
          continue;
        }

        // Create wallet deduction transaction
        const walletTransaction = new WalletTransaction({
          user: subscription.user._id,
          amount: walletDeductionAmount,
          type: 'debit',
          status: 'completed',
          method: 'wallet',
          referenceId: subscription._id.toString(),
          note: `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} meal deduction - ${subscription.subscriptionId}`,
          metadata: {
            subscriptionId: subscription._id,
            mealType,
            date: today.toISOString(),
            baseMealAmount: baseMealAmountPerMeal,
            addOnsAmount,
            mealPlanId: subscription.mealPlan._id
          }
        });

        await walletTransaction.save({ session });

        // Add successful deduction record
        subscription.dailyDeductions.push({
          date: today,
          mealType,
          baseMealAmount: baseMealAmountPerMeal,
          addOnsAmount,
          totalAmount: walletDeductionAmount,
          status: 'deducted',
          walletTransaction: walletTransaction._id,
          processedAt: new Date()
        });

        // Update meal counts
        subscription.mealCounts.mealsDelivered += 1;
        subscription.mealCounts.mealsRemaining = Math.max(0, subscription.mealCounts.mealsRemaining - 1);

        if (mealType === 'morning') {
          subscription.mealCounts.regularMealsDelivered += 1;
        } else if (mealType === 'evening') {
          subscription.mealCounts.regularMealsDelivered += 1;
        }

        // Update next delivery date
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        subscription.nextDeliveryDate = tomorrow;

        // Check if subscription should be completed/expired - ONLY based on meals remaining
        if (subscription.mealCounts.mealsRemaining <= 0) {
          subscription.status = 'expired';
          subscription.isActive = false;
          console.log(`🏁 Subscription ${subscription.subscriptionId} completed - all meals delivered`);
        }

        await subscription.save({ session });

        // Create order for meal delivery
        const order = new Order({
          orderNumber: `SUB_${subscription.subscriptionId}_${today.toISOString().split('T')[0]}_${mealType.toUpperCase()}`,
          userId: subscription.user._id,
          type: 'subscription',
          subscriptionId: subscription._id,
          items: [
            {
              name: `${subscription.mealPlan.title} - ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}`,
              quantity: 1,
              price: baseMealAmountPerMeal,
              category: 'main',
              customizations: subscription.customizations,
              product: subscription.mealPlan._id,
              seller: subscription.mealPlan.seller || null // Use createdBy as seller from meal plan
            },
            ...subscription.selectedAddOns.map(addon => ({
              name: addon.name,
              quantity: 1,
              price: addon.price,
              category: 'addon',
              product: addon._id || addon.id || `addon_${addon.name.toLowerCase().replace(/\s+/g, '_')}`,
              seller: addon.createdBy || addon.seller || null // Use createdBy or seller from addon
            }))
          ],
          deliveryAddress: subscription.deliveryAddress,
          deliveryDate: today,
          deliverySlot: mealType,
          subtotal: baseMealAmountPerMeal,
          totalAmount: walletDeductionAmount,
          paymentMethod: 'wallet',
          paymentStatus: 'paid',
          status: 'confirmed',
          isAutoOrder: true,
          isPartOfSubscription: true,
          walletTransactionId: walletTransaction._id
        });

        await order.save({ session });

        // Create daily meal delivery record for tracking
        try {
          const dailyMealRecord = new DailyMealDelivery({
            subscription: subscription._id,
            user: subscription.user._id,
            seller: subscription.mealPlan.createdBy || subscription.mealPlan.seller,
            mealPlan: subscription.mealPlan._id,
            deliveryDate: today,
            shift: mealType,
            mealDetails: {
              thaliName: subscription.mealPlan.name || subscription.mealPlan.title,
              thaliImage: subscription.mealPlan.image,
              basePrice: baseMealAmountPerMeal,
              addOns: subscription.selectedAddOns.map(addon => ({
                name: addon.name,
                price: addon.price,
                quantity: 1
              })),
              totalPrice: walletDeductionAmount
            },
            deliveryTracking: {
              scheduledTime: mealType === 'morning' ? '08:00' : '19:00'
            },
            paymentDetails: {
              deductionId: walletTransaction._id,
              amount: walletDeductionAmount,
              paymentStatus: 'completed'
            },
            metadata: {
              orderSource: 'subscription',
              isWeekend: [0, 6].includes(today.getDay()),
              isSundayMeal: today.getDay() === 0
            }
          });

          await dailyMealRecord.save({ session });
          console.log(`📝 Created daily meal delivery record for ${subscription.subscriptionId}`);
        } catch (mealRecordError) {
          console.error(`⚠️ Failed to create daily meal record for ${subscription.subscriptionId}:`, mealRecordError);
          // Don't fail the entire transaction for this
        }

        await session.commitTransaction();

        console.log(`✅ Successfully processed deduction for ${user.email} - ₹${walletDeductionAmount}`);
        processed++;

      } catch (error) {
        await session.abortTransaction();
        console.error(`❌ Error processing subscription ${subscription.subscriptionId}:`, error);
        failed++;
      } finally {
        session.endSession();
      }
    }

    console.log(`🎯 Daily deduction completed - Processed: ${processed}, Failed: ${failed}`);

  } catch (error) {
    console.error('❌ Error in daily deduction process:', error);
  }
};

// ============================================
// 4. Cron Job Setup
// ============================================
const setupCronJobs = () => {
  // Create daily orders at 12:01 AM (just after midnight)
  cron.schedule('1 0 * * *', async () => {
    console.log('📅 Creating daily orders for today...');
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await createDailyOrdersForAllSubscriptions(tomorrow);
      console.log('✅ Daily orders created successfully');
    } catch (error) {
      console.error('❌ Error creating daily orders:', error);
    }
  }, {
    timezone: "Asia/Kolkata"
  });

  // Morning deduction at 6:00 AM
  cron.schedule('0 6 * * *', () => {
    console.log('🌅 Running morning meal deduction...');
    processDailyDeductions();
  }, {
    timezone: "Asia/Kolkata"
  });

  // Evening deduction at 6:00 PM
  cron.schedule('0 18 * * *', () => {
    console.log('🌆 Running evening meal deduction...');
    processDailyDeductions();
  }, {
    timezone: "Asia/Kolkata"
  });

  console.log('⏰ Cron jobs for subscription deductions and daily orders have been set up');
};

// ============================================
// 5. Get User Subscriptions
// ============================================
/**
 * Get subscription by subscription ID
 */
const getSubscriptionBySubscriptionId = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'Subscription ID is required'
      });
    }

    const subscription = await Subscription.findOne({
      subscriptionId: subscriptionId,
      user: req.user._id
    })
      .populate('mealPlan', 'title description')
      .populate('user', 'name email phone')
      .lean();

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Calculate progress
    const totalMeals = subscription.mealCounts?.totalMeals || 0;
    const mealsDelivered = subscription.mealCounts?.mealsDelivered || 0;
    const progress = totalMeals > 0 ? Math.round((mealsDelivered / totalMeals) * 100) : 0;

    // Format the response
    const response = {
      ...subscription,
      progress: {
        percentage: progress,
        delivered: mealsDelivered,
        remaining: totalMeals - mealsDelivered,
        total: totalMeals
      },
      // Add any additional calculated fields here
    };

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error fetching subscription by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get user subscriptions
 */
const getUserSubscriptions = async (req, res) => {
  console.log("here")
  try {
    const { status = 'active', page = 1, limit = 10 } = req.query;
    //  console.log("inside subscription controller ",req.user)
    const filter = { user: req.user._id };
    if (status !== 'all') {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const subscriptions = await Subscription.find(filter)
      .populate({
        path: 'mealPlan',
        select: 'title description tier imageUrls pricing customizationSettings seller',
        populate: {
          path: 'seller',
          select: 'name restaurantName avatar'
        }
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();
    // console.log('Found subscriptions for user:', req.user._id);
    // console.log('Subscriptions count:', subscriptions.length);
    // console.log('First subscription:', subscriptions[0]);

    // Debug: Log meal plan customization settings
    subscriptions.forEach((sub, index) => {
      // console.log(`Subscription ${index + 1} meal plan:`, sub.mealPlan?.title);
      // console.log(`Customization settings:`, sub.mealPlan?.customizationSettings);
      // console.log(`Allow customization:`, sub.mealPlan?.customizationSettings?.allowCustomization);
    });

    const total = await Subscription.countDocuments(filter);

    // Calculate remaining days and other virtual fields
    const updatedSubscriptions = subscriptions.map(sub => {
      const today = new Date();
      const startDate = new Date(sub.startDate);
      const endDate = new Date(sub.endDate);

      // Handle future subscriptions (start date is in the future)
      const isFuture = today < startDate;

      // Calculate total duration
      const totalDuration = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates

      // Calculate remaining and elapsed days
      let remaining, elapsed, progressPercentage;

      if (isFuture) {
        // For future subscriptions
        remaining = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
        elapsed = 0;
        progressPercentage = 0;
      } else {
        // For active/expired subscriptions
        remaining = Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24)));
        elapsed = Math.max(0, Math.ceil((today - startDate) / (1000 * 60 * 60 * 24)));
        progressPercentage = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
      }

      // Calculate remaining meals
      const totalMeals = sub.pricing?.totalMeals || 0;
      const remainingMeals = isFuture ? totalMeals : Math.max(0, totalMeals - (sub.mealCounts?.mealsDelivered || 0));

      return {
        ...sub,
        remainingDays: Math.max(0, remaining),
        isExpired: !isFuture && remaining <= 0,
        isFuture,
        daysCompleted: Math.max(0, elapsed),
        progressPercentage,
        dailyAmount: sub.pricing ? (sub.pricing.finalAmount / totalDuration) : 0,
        mealCounts: {
          ...sub.mealCounts,
          mealsRemaining: remainingMeals,
          totalMeals: totalMeals
        }
      };
    });

    res.status(200).json({
      success: true,
      data: {
        subscriptions: updatedSubscriptions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscriptions'
    });
  }
};

/**
 * Get user's today meal based on active subscription
 */
const getUserTodayMeal = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find user's active subscription
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeSubscription = await Subscription.findOne({
      user: userId,
      status: 'active',
      startDate: { $lte: today },
      endDate: { $gte: today }
    }).populate('mealPlan', 'tier title')
      .populate('sellerId', 'name businessName email phone');

    if (!activeSubscription) {
      return res.status(200).json({
        success: true,
        data: {
          hasMeal: false,
          message: 'No active subscription found'
        }
      });
    }

    // Get today's meal using the new method
    const todayMeal = await activeSubscription.getTodayMeal();

    // Add subscription details to the response
    const response = {
      hasMeal: todayMeal.isAvailable,
      meal: todayMeal,
      subscription: {
        id: activeSubscription._id,
        planTitle: activeSubscription.mealPlan?.title,
        tier: todayMeal.tier,
        shift: todayMeal.shift,
        seller: {
          id: activeSubscription.sellerId?._id,
          name: activeSubscription.sellerId?.name || activeSubscription.sellerId?.businessName,
          businessName: activeSubscription.sellerId?.businessName,
          phone: activeSubscription.sellerId?.phone
        }
      }
    };

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error getting user today meal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get today\'s meal',
      error: error.message
    });
  }
};

/**
 * Get today's meal for a specific subscription (user access)
 * @route GET /api/subscriptions/:subscriptionId/today-meal
 * Ensures the subscription belongs to the authenticated user
 */
const getSubscriptionTodayMealForUser = async (req, res) => {
  try {
    const { subscriptionId, id } = req.params;
    const targetId = subscriptionId || id;

    if (!targetId) {
      return res.status(400).json({
        success: false,
        message: 'Subscription ID is required'
      });
    }

    // Validate ObjectId format (if it looks like one)
    const looksLikeObjectId = typeof targetId === 'string' && targetId.length === 24;
    if (looksLikeObjectId && !mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID format'
      });
    }

    const subscription = await Subscription.findById(targetId)
      .populate('mealPlan', 'tier title')
      .populate('sellerId', 'name businessName email phone')
      .select('user mealPlan sellerId shift todayMeal');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Ensure the subscription belongs to the authenticated user
    const isOwner = String(subscription.user) === String(req.user._id);
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You do not have access to this subscription'
      });
    }

    // Get today's meal using the model method
    const todayMeal = await subscription.getTodayMeal();

    return res.status(200).json({
      success: true,
      data: {
        subscription: {
          _id: subscription._id,
          mealPlan: subscription.mealPlan,
          shift: todayMeal.shift,
          seller: subscription.sellerId ? {
            _id: subscription.sellerId._id,
            name: subscription.sellerId.name || subscription.sellerId.businessName,
            businessName: subscription.sellerId.businessName,
            email: subscription.sellerId.email,
            phone: subscription.sellerId.phone
          } : null
        },
        meal: todayMeal
      }
    });
  } catch (error) {
    console.error('Error getting subscription specific today meal:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s meal',
      error: error.message
    });
  }
};
/**
 * Update user's today meal (refresh from seller meal plan)
 */
const updateUserTodayMeal = async (req, res) => {
  try {
    const userId = req.user._id;

    // Find user's active subscription
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeSubscription = await Subscription.findOne({
      user: userId,
      status: 'active',
      startDate: { $lte: today },
      endDate: { $gte: today }
    });

    if (!activeSubscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    // Update today's meal and save to subscription
    await activeSubscription.updateTodayMeal();

    // Get the updated meal
    const todayMeal = await activeSubscription.getTodayMeal();

    res.status(200).json({
      success: true,
      message: 'Today\'s meal updated successfully',
      data: {
        hasMeal: todayMeal.isAvailable,
        meal: todayMeal
      }
    });

  } catch (error) {
    console.error('Error updating user today meal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update today\'s meal',
      error: error.message
    });
  }
};

/**
 * Pause subscription
 */
const pauseSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, reason } = req.body;

    // Validate dates
    const pauseStartDate = new Date(startDate);
    const pauseEndDate = new Date(endDate);

    if (isNaN(pauseStartDate.getTime()) || isNaN(pauseEndDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format provided'
      });
    }

    if (pauseStartDate >= pauseEndDate) {
      return res.status(400).json({
        success: false,
        message: 'Start date must be before end date'
      });
    }

    const subscription = await Subscription.findOne({
      _id: id,
      user: req.user._id
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active subscriptions can be paused'
      });
    }

    // Check if pause period overlaps with subscription period
    if (pauseStartDate < subscription.startDate || pauseEndDate > subscription.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Pause period must be within subscription period'
      });
    }

    // Use findOneAndUpdate to avoid validation issues
    const updatedSubscription = await Subscription.findOneAndUpdate(
      { _id: id, user: req.user._id },
      {
        $push: {
          pausedDates: {
            startDate: pauseStartDate,
            endDate: pauseEndDate,
            reason: reason || 'User requested pause'
          }
        },
        $set: { status: 'paused' }
      },
      { new: true, runValidators: false }
    );

    if (!updatedSubscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found or update failed'
      });
    }

    // Send notification
    try {
      console.log('Creating notification with userId:', req.user._id, 'type:', typeof req.user._id);
      await createNotification({
        userId: req.user._id,
        title: 'Subscription Paused',
        message: `Your subscription has been paused from ${pauseStartDate.toDateString()} to ${pauseEndDate.toDateString()}.`,
        type: 'subscription',
        data: { subscriptionId: updatedSubscription._id }
      });
    } catch (notificationError) {
      console.error('Notification error (non-blocking):', notificationError);
      // Don't fail the entire operation if notification fails
    }

    res.json({
      success: true,
      message: 'Subscription paused successfully',
      data: updatedSubscription
    });

  } catch (error) {
    console.error('Error pausing subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pause subscription',
      error: error.message
    });
  }
};

/**
 * Resume subscription
 */
const resumeSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findOne({
      _id: id,
      user: req.user._id
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.status !== 'paused') {
      return res.status(400).json({
        success: false,
        message: 'Only paused subscriptions can be resumed'
      });
    }

    // Use findOneAndUpdate to avoid validation issues
    const updatedSubscription = await Subscription.findOneAndUpdate(
      { _id: id, user: req.user._id },
      { $set: { status: 'active' } },
      { new: true, runValidators: false }
    );

    if (!updatedSubscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found or update failed'
      });
    }

    // Send notification
    try {
      await createNotification({
        userId: req.user._id,
        title: 'Subscription Resumed',
        message: 'Your subscription has been resumed successfully.',
        type: 'subscription',
        data: { subscriptionId: updatedSubscription._id }
      });
    } catch (notificationError) {
      console.error('Notification error (non-blocking):', notificationError);
      // Don't fail the entire operation if notification fails
    }

    res.json({
      success: true,
      message: 'Subscription resumed successfully',
      data: updatedSubscription
    });

  } catch (error) {
    console.error('Error resuming subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resume subscription'
    });
  }
};

/**
 * Cancel subscription
 */
const cancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const subscription = await Subscription.findOne({
      _id: id,
      user: req.user._id
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is already cancelled'
      });
    }

    subscription.status = 'cancelled';
    subscription.cancellationReason = reason;
    subscription.cancelledAt = new Date();
    await subscription.save();

    // Send notification
    try {
      await createNotification({
        userId: req.user._id,
        title: 'Subscription Cancelled',
        message: 'Your subscription has been cancelled successfully.',
        type: 'subscription',
        data: { subscriptionId: subscription._id }
      });
    } catch (notificationError) {
      console.error('Notification error (non-blocking):', notificationError);
      // Don't fail the entire operation if notification fails
    }

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: subscription
    });

  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
};

/**
 * Get subscription details with daily deductions
 */
const getSubscriptionDetails = async (req, res) => {
  try {
    // Support both param names: `subscriptionId` and `id`
    const { subscriptionId, id: idParam } = req.params;
    const id = subscriptionId || idParam;

    // Validate subscription ID format
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription ID format'
      });
    }

    // Use current time in Asia/Kolkata timezone for calculations
    const now = moment().tz('Asia/Kolkata');

    // Get admin settings for skip limits
    const adminSettings = await AdminSettings.getCurrentSettings();
    const maxSkipMeals = adminSettings?.maxSkipMeals || 8;
    const maxSkipDaysInAdvance = adminSettings?.maxSkipDaysInAdvance || 7;

    let subscription = await Subscription.findOne({
      _id: id,
      user: req.user._id
    }).populate('mealPlan user');

    // REMOVED: Date-based expiry check - subscriptions only expire when meals run out
    // Subscription expiry is now handled ONLY by meal count logic in the model
    // No more date-based expiration checking

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Calculate subscription metrics
    const startDate = moment(subscription.startDate);
    const endDate = moment(subscription.endDate);
    const totalDays = endDate.diff(startDate, 'days') + 1;
    const daysElapsed = now.diff(startDate, 'days') + 1;
    const daysRemaining = endDate.diff(now, 'days');

    // Calculate skip usage for current month
    const currentMonth = now.month();
    const skipsThisMonth = subscription.skippedMeals?.filter(skip => {
      return moment(skip.date).month() === currentMonth;
    }).length || 0;

    // Calculate daily deduction amount
    const dailyDeduction = subscription.pricing?.finalAmount / totalDays || 0;
    const consumedAmount = daysElapsed * dailyDeduction;
    const remainingAmount = subscription.pricing?.finalAmount - consumedAmount;

    // Get next delivery details
    const nextDeliveryShift = now.hour() < 12 ? 'morning' : 'evening';
    let nextDeliveryDate = now.clone().startOf('day');

    // If it's past the last delivery shift of the day, move to next day
    if (now.hour() >= 21) { // After 9 PM
      nextDeliveryDate.add(1, 'day');
    }

    // Get upcoming deliveries for next 7 days
    const upcomingDeliveries = [];
    for (let i = 0; i < 7; i++) {
      const deliveryDate = now.clone().add(i, 'days');
      const dayOfWeek = deliveryDate.day();

      // Skip Sundays for evening deliveries
      if (dayOfWeek === 0) {
        upcomingDeliveries.push({
          date: deliveryDate.format('YYYY-MM-DD'),
          day: deliveryDate.format('dddd'),
          shifts: ['morning']
        });
      } else {
        upcomingDeliveries.push({
          date: deliveryDate.format('YYYY-MM-DD'),
          day: deliveryDate.format('dddd'),
          shifts: ['morning', 'evening']
        });
      }
    }

    // Prepare response
    const response = {
      ...subscription.toObject(),
      summary: {
        totalDays,
        daysElapsed,
        daysRemaining,
        progressPercentage: Math.min(100, Math.round((daysElapsed / totalDays) * 100)),
        dailyDeduction: Math.round(dailyDeduction * 100) / 100,
        consumedAmount: Math.round(consumedAmount * 100) / 100,
        remainingAmount: Math.round(remainingAmount * 100) / 100
      },
      skipInfo: {
        maxSkipsPerMonth: maxSkipMeals,
        skipsUsedThisMonth: skipsThisMonth,
        skipsRemaining: Math.max(0, maxSkipMeals - skipsThisMonth),
        lastSkipReset: adminSettings?.updatedAt || new Date()
      },
      nextDelivery: {
        date: nextDeliveryDate.format('YYYY-MM-DD'),
        shift: nextDeliveryShift
      },
      upcomingDeliveries,
      limits: {
        maxSkipMeals,
        maxSkipDaysInAdvance,
        remainingSkips: Math.max(0, maxSkipMeals - skipsThisMonth)
      }
    };

    res.status(200).json({ success: true, data: response });

  } catch (error) {
    console.error('Get subscription details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription details',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: error.code || 'INTERNAL_ERROR'
    });
  }
};

/**
 * Skip a meal for a subscription with validation and refund calculation
 * Skip meal for a specific date
 */
// const skipMeal = async (req, res) => {
//   const maxRetries = 3;
//   let retryCount = 0;

//   while (retryCount < maxRetries) {
//     try {
//       const { id } = req.params;
//       const { reason , skipData } = req.body;
//       const userId = req.user.id;
//       const shift = skipData?.shift;
//       const date=skipData?.date;
//       // Get admin settings for skip limits
//       const adminSettings = await AdminSettings.getCurrentSettings();
//       const maxSkipMeals = adminSettings?.maxSkipMeals || 8;
//       const maxSkipDaysInAdvance = adminSettings?.maxSkipDaysInAdvance || 7;

//       // Find the subscription
//       const subscription = await Subscription.findOne({
//         _id: id,
//         user: userId
//       });

//       if (!subscription) {
//         return res.status(404).json({
//           success: false,
//           message: 'Subscription not found',
//           code: 'SUBSCRIPTION_NOT_FOUND'
//         });
//       }

//       // Validate subscription status
//       if (subscription.status !== 'active') {
//         return res.status(400).json({
//           success: false,
//           message: 'Only active subscriptions can skip meals',
//           code: 'SUBSCRIPTION_NOT_ACTIVE'
//         });
//       }
// console.log("date is : ", req.body);
//       // Parse and validate skip date
//       const skipDate = moment.tz(date, 'Asia/Kolkata').startOf('day');
//       const today = moment().tz('Asia/Kolkata').startOf('day');

//       // Validate date format
//       if (!skipDate.isValid()) {
//         return res.status(400).json({
//           success: false,
//           message: 'Invalid date format. Please use YYYY-MM-DD',
//           code: 'INVALID_DATE_FORMAT'
//         });
//       }

//       // Check if date is in the past
//       if (skipDate.isBefore(today)) {
//         return res.status(400).json({
//           success: false,
//           message: 'Cannot skip meals in the past',
//           code: 'PAST_DATE_NOT_ALLOWED'
//         });
//       }

//       // Check if date is too far in advance
//       const maxSkipDate = today.clone().add(maxSkipDaysInAdvance, 'days');
//       if (skipDate.isAfter(maxSkipDate)) {
//         return res.status(400).json({
//           success: false,
//           message: `Cannot skip meals more than ${maxSkipDaysInAdvance} days in advance`,
//           code: 'SKIP_DATE_TOO_FAR',
//           maxSkipDaysInAdvance
//         });
//       }

//     // VALIDATION: Check time restrictions for skip meal
//     if (shift && skipDate.isSame(today, 'day')) {
//       const now = moment().tz('Asia/Kolkata');
//       const currentHour = now.hour();
//       const currentMinute = now.minute();
//       const currentTime = currentHour * 60 + currentMinute;

//       if (shift === 'morning') {
//         // Morning shift: must be before 10 AM (600 minutes)
//         if (currentTime >= 600) {
//           return res.status(400).json({
//             success: false,
//             message: 'Morning shift meals cannot be skipped after 10:00 AM for the same day',
//             code: 'TIME_RESTRICTION_VIOLATED'
//           });
//         }
//       } else if (shift === 'evening') {
//         // Evening shift: must be before 6:30 PM (1110 minutes)
//         if (currentTime >= 1110) {
//           return res.status(400).json({
//             success: false,
//             message: 'Evening shift meals cannot be skipped after 6:30 PM for the same day',
//             code: 'TIME_RESTRICTION_VIOLATED'
//           });
//         }
//       }
//     }

//     // VALIDATION: Check if meal is already replaced for the same date and shift
//     if (shift && skipDate) {
//       // Check if there's a thali replacement for the same date and shift
//       if (subscription.thaliReplacements && subscription.thaliReplacements.length > 0) {
//         const existingReplacement = subscription.thaliReplacements.find(rep => {
//           if (!rep.date || !rep.shift) return false;
//           const repDate = moment(rep.date).tz('Asia/Kolkata').startOf('day');
//           return repDate.isSame(skipDate, 'day') && rep.shift === shift;
//         });

//         if (existingReplacement) {
//           return res.status(400).json({
//             success: false,
//             message: `Cannot skip meal for ${shift} shift on ${skipDate.format('YYYY-MM-DD')}. A thali replacement already exists for this shift.`,
//             code: 'REPLACEMENT_EXISTS_FOR_SHIFT'
//           });
//         }
//       }

//       // Check if there's a customization for the same date and shift
//       const MealCustomization = require('../models/MealCustomization');
//       const existingCustomization = await MealCustomization.findOne({
//         subscription: id,
//         date: {
//           $gte: skipDate.toDate(),
//           $lt: skipDate.clone().add(1, 'day').toDate()
//         },
//         shift: shift,
//         isActive: true
//       });

//       if (existingCustomization) {
//         return res.status(400).json({
//           success: false,
//           message: `Cannot skip meal for ${shift} shift on ${skipDate.format('YYYY-MM-DD')}. A customization already exists for this shift.`,
//           code: 'CUSTOMIZATION_EXISTS_FOR_SHIFT'
//         });
//       }
//     }

//     // Get subscription dates with fallback logic
//     const subscriptionStartDate = subscription.startDate || subscription.deliverySettings?.startDate;
//     const subscriptionEndDate = subscription.endDate || subscription.deliverySettings?.lastDeliveryDate;

//     // Debug: Log the original subscription dates
//     console.log('Skip meal - Original subscription dates:');
//     console.log('  subscription.startDate:', subscription.startDate);
//     console.log('  subscription.endDate:', subscription.endDate);
//     console.log('  subscription.deliverySettings?.startDate:', subscription.deliverySettings?.startDate);
//     console.log('  subscription.deliverySettings?.lastDeliveryDate:', subscription.deliverySettings?.lastDeliveryDate);
//     console.log('  Using subscriptionStartDate:', subscriptionStartDate);
//     console.log('  Using subscriptionEndDate:', subscriptionEndDate);

//     // Validate that subscription has valid dates
//     if (!subscriptionStartDate || !subscriptionEndDate) {
//       return res.status(400).json({
//         success: false,
//         message: 'Subscription dates are not properly configured',
//         code: 'INVALID_SUBSCRIPTION_DATES'
//       });
//     }

//     // Debug: Log the dates being compared
//     console.log('Skip meal validation - Dates being compared: shift is :',shift);
//     console.log('  skipDate:', skipDate.format('YYYY-MM-DD'));
//     console.log('  subscriptionStartDate:', moment(subscriptionStartDate).format('YYYY-MM-DD'));
//     console.log('  subscriptionEndDate:', moment(subscriptionEndDate).format('YYYY-MM-DD'));

//     // Create timezone-adjusted dates for comparison
//     const startDateForComparison = moment(subscriptionStartDate).tz('Asia/Kolkata').startOf('day');
//     const endDateForComparison = moment(subscriptionEndDate).tz('Asia/Kolkata').startOf('day');

//     console.log('  startDateForComparison (Asia/Kolkata):', startDateForComparison.format('YYYY-MM-DD'));
//     console.log('  endDateForComparison (Asia/Kolkata):', endDateForComparison.format('YYYY-MM-DD'));
//     console.log('  skipDate.isBefore(start):', skipDate.isBefore(startDateForComparison));
//     console.log('  skipDate.isAfter(end):', skipDate.isAfter(endDateForComparison));


//     if (skipDate.isBefore(startDateForComparison) || skipDate.isAfter(endDateForComparison)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Skip date must be within subscription period',
//         code: 'DATE_OUT_OF_RANGE',
//         details: {
//           skipDate: skipDate.format('YYYY-MM-DD'),
//           subscriptionStart: moment(subscriptionStartDate).format('YYYY-MM-DD'),
//           subscriptionEnd: moment(subscriptionEndDate).format('YYYY-MM-DD')
//         }
//       });
//     }

//     // Check if it's a Sunday and trying to skip evening meal (not allowed)
//     if (skipDate.day() === 0 && shift === 'evening') {
//       return res.status(400).json({
//         success: false,
//         message: 'Evening meals are not available on Sundays',
//         code: 'SUNDAY_EVENING_NOT_AVAILABLE'
//       });
//     }

//     // Check if already skipped this meal
//     const isAlreadySkipped = subscription.skippedMeals?.some(skip => 
//       moment(skip.date).isSame(skipDate, 'day') && skip.shift === shift
//     );

//     if (isAlreadySkipped) {
//       return res.status(400).json({
//         success: false,
//         message: 'This meal has already been skipped',
//         code: 'MEAL_ALREADY_SKIPPED'
//       });
//     }

//     // Check skip limits for current month
//     const currentMonth = moment().month();
//     const skipsThisMonth = subscription.skippedMeals?.filter(skip => {
//       return moment(skip.date).month() === currentMonth;
//     }).length || 0;

//     if (skipsThisMonth >= maxSkipMeals) {
//       return res.status(400).json({
//         success: false,
//         message: `You have reached the maximum of ${maxSkipMeals} skips per month`,
//         code: 'SKIP_LIMIT_REACHED',
//         maxSkipMeals
//       });
//     }

//     // Calculate refund amount based on daily deduction
//     const totalDays = moment(subscription.endDate).diff(moment(subscription.startDate), 'days') + 1;
//     const dailyDeduction = subscription.pricing.finalAmount / totalDays;
//     const refundAmount = Math.round(dailyDeduction * 100) / 100; // Round to 2 decimal places

//     // Add skip record - only include fields that match the schema
//     const skipRecord = {
//       date: skipDate.toDate(),
//       shift,
//       reason: reason || 'user_skipped', // Use valid enum value
//       description: reason || 'User requested meal skip',
//       createdAt: new Date(),
//       createdBy: userId
//     };

//     subscription.skippedMeals = subscription.skippedMeals || [];
//     subscription.skippedMeals.push(skipRecord);

//     // Add refund to user's wallet
//     if (refundAmount > 0) {
//       const user = await User.findById(userId);
//       if (!user) {
//         return res.status(404).json({
//           success: false,
//           message: 'User not found',
//           code: 'USER_NOT_FOUND'
//         });
//       }

//       // Add to wallet
//       user.wallet.balance = (user.wallet.balance || 0) + refundAmount;

//       // Create wallet transaction
//       const walletTransaction = new WalletTransaction({
//         user: userId,
//         amount: refundAmount,
//         type: 'credit',
//         status: 'completed',
//         method: 'refund',
//         referenceId: `skip_${subscription._id}_${skipDate.format('YYYYMMDD')}_${shift}`,
//         note: `Refund for skipped ${shift} meal on ${skipDate.format('YYYY-MM-DD')}`,
//         metadata: {
//           subscriptionId: subscription._id,
//           skipDate: skipDate.toDate(),
//           shift,
//           reason: reason || 'User requested'
//         }
//       });

//       await walletTransaction.save();
//       await user.save();

//       // Note: Wallet transaction ID is stored in the WalletTransaction model
//       // No need to update skipRecord with additional fields
//     }

//     await subscription.save();

//     // Send notification
//     try {
//       await createNotification({
//         userId,
//         title: 'Meal Skipped',
//         message: `Your ${shift} meal has been skipped for ${skipDate.format('MMM D, YYYY')}.`,
//         type: 'subscription',
//         data: { 
//           subscriptionId: subscription._id,
//           skipDate: skipDate.toDate(),
//           shift,
//           refundAmount
//         }
//       });
//     } catch (notificationError) {
//       console.error('Failed to send notification:', notificationError);
//       // Non-blocking error
//     }

//     res.status(200).json({
//       success: true,
//       message: 'Meal skipped successfully',
//       data: {
//         skipDate: skipDate.format('YYYY-MM-DD'),
//         shift,
//         refundAmount,
//         skipsUsedThisMonth: skipsThisMonth + 1,
//         skipsRemaining: Math.max(0, maxSkipMeals - (skipsThisMonth + 1)),
//         limits: {
//           maxSkipMeals,
//           maxSkipDaysInAdvance,
//           lastSkipReset: adminSettings?.updatedAt || new Date()
//         }
//       }
//     });

//     } catch (error) {
//       console.error(`Error skipping meal (attempt ${retryCount + 1}):`, error);

//       // Check if this is a MongoDB write conflict that we can retry
//       if (error.code === 112 || error.codeName === 'WriteConflict' || 
//           (error.message && error.message.includes('Write conflict'))) {
//         retryCount++;
//         console.log(`MongoDB write conflict detected. Retrying... (${retryCount}/${maxRetries})`);

//         if (retryCount < maxRetries) {
//           // Wait a bit before retrying (exponential backoff)
//           await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100));
//           continue; // Continue to next retry attempt
//         }
//       }

//       // If we get here, either it's not a retryable error or we've exhausted retries
//       const statusCode = error.statusCode || 500;
//       const errorMessage = error.message || 'Failed to skip meal';

//       res.status(statusCode).json({
//         success: false,
//         message: errorMessage,
//         error: process.env.NODE_ENV === 'development' ? error.message : undefined,
//         code: error.code || 'INTERNAL_ERROR'
//       });
//       return; // Exit the retry loop
//     }

//     // If we get here, the transaction was successful
//     break; // Exit the retry loop
//   } // End of while loop

// };


/**
 * Enhanced Skip meal for a subscription with support for multiple days and shifts
 */
const skipMeal = async (req, res) => {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      const { id } = req.params;
      const { reason, skipData } = req.body;
      const userId = req.user.id;

      console.log('Skip meal request:', { id, skipData, reason });

      // Get admin settings for skip limits
      const adminSettings = await AdminSettings.getCurrentSettings();
      const maxSkipMeals = adminSettings?.maxSkipMeals || 8;
      const maxSkipDaysInAdvance = adminSettings?.maxSkipDaysInAdvance || 7;

      // Find the subscription
      const subscription = await Subscription.findOne({
        _id: id,
        user: userId
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found',
          code: 'SUBSCRIPTION_NOT_FOUND'
        });
      }

      // Validate subscription status
      if (subscription.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Only active subscriptions can skip meals',
          code: 'SUBSCRIPTION_NOT_ACTIVE'
        });
      }

      // Handle both new (array) and old (single) skip data formats
      let skipDates = [];

      if (skipData && skipData.dates && Array.isArray(skipData.dates)) {
        // New format: array of {date, shift} objects
        skipDates = skipData.dates;
      } else if (skipData && skipData.date && skipData.shift) {
        // Old format: single date and shift
        skipDates = [{ date: skipData.date, shift: skipData.shift }];
      } else {
        return res.status(400).json({
          success: false,
          message: 'Invalid skip data format. Expected dates array or single date/shift.',
          code: 'INVALID_SKIP_DATA'
        });
      }

      console.log('Processed skip dates:', skipDates);

      // Validate all skip dates
      const validatedSkips = [];
      const today = moment().tz('Asia/Kolkata').startOf('day');

      for (const skipEntry of skipDates) {
        const { date, shift } = skipEntry;

        // Parse and validate skip date
        const skipDate = moment.tz(date, 'Asia/Kolkata').startOf('day');

        // Validate date format
        if (!skipDate.isValid()) {
          return res.status(400).json({
            success: false,
            message: `Invalid date format: ${date}. Please use YYYY-MM-DD`,
            code: 'INVALID_DATE_FORMAT'
          });
        }

        // Check if date is in the past
        if (skipDate.isBefore(today)) {
          return res.status(400).json({
            success: false,
            message: `Cannot skip meals for past dates: ${date}`,
            code: 'PAST_DATE_NOT_ALLOWED'
          });
        }

        // Check if date is too far in advance
        const maxSkipDate = today.clone().add(maxSkipDaysInAdvance, 'days');
        if (skipDate.isAfter(maxSkipDate)) {
          return res.status(400).json({
            success: false,
            message: `Cannot skip meals more than ${maxSkipDaysInAdvance} days in advance`,
            code: 'SKIP_DATE_TOO_FAR',
            maxSkipDaysInAdvance
          });
        }

        // Validate shift
        if (!['morning', 'evening'].includes(shift)) {
          return res.status(400).json({
            success: false,
            message: `Invalid shift: ${shift}. Must be 'morning' or 'evening'.`,
            code: 'INVALID_SHIFT'
          });
        }

        // Check if it's a Sunday and trying to skip evening meal (not allowed)
        // if (skipDate.day() === 0 && shift === 'evening') {
        //   return res.status(400).json({
        //     success: false,
        //     message: 'Evening meals are not available on Sundays',
        //     code: 'SUNDAY_EVENING_NOT_AVAILABLE'
        //   });
        // }

        // TIME RESTRICTION: Check same-day skip restrictions
        if (skipDate.isSame(today, 'day')) {
          const now = moment().tz('Asia/Kolkata');
          const currentHour = now.hour();
          const currentMinute = now.minute();
          const currentTime = currentHour * 60 + currentMinute;

          if (shift === 'morning') {
            // Morning shift: must be before 11:59 AM (719 minutes)
            if (currentTime >= 719) {
              return res.status(400).json({
                success: false,
                message: 'Morning shift meals cannot be skipped after 11:59 AM for the same day',
                code: 'TIME_RESTRICTION_VIOLATED'
              });
            }
          } else if (shift === 'evening') {
            // Evening shift: must be before 7:00 PM (1140 minutes)
            if (currentTime >= 1140) {
              return res.status(400).json({
                success: false,
                message: 'Evening shift meals cannot be skipped after 7:00 PM for the same day',
                code: 'TIME_RESTRICTION_VIOLATED'
              });
            }
          }
        }

        // Check subscription date range
        const subscriptionStartDate = subscription.startDate || subscription.deliverySettings?.startDate;
        const subscriptionEndDate = subscription.endDate || subscription.deliverySettings?.lastDeliveryDate;

        if (!subscriptionStartDate || !subscriptionEndDate) {
          return res.status(400).json({
            success: false,
            message: 'Subscription dates are not properly configured',
            code: 'INVALID_SUBSCRIPTION_DATES'
          });
        }

        const startDateForComparison = moment(subscriptionStartDate).tz('Asia/Kolkata').startOf('day');
        const endDateForComparison = moment(subscriptionEndDate).tz('Asia/Kolkata').startOf('day');

        if (skipDate.isBefore(startDateForComparison) || skipDate.isAfter(endDateForComparison)) {
          return res.status(400).json({
            success: false,
            message: 'Skip date must be within subscription period',
            code: 'DATE_OUT_OF_RANGE',
            details: {
              skipDate: skipDate.format('YYYY-MM-DD'),
              subscriptionStart: startDateForComparison.format('YYYY-MM-DD'),
              subscriptionEnd: endDateForComparison.format('YYYY-MM-DD')
            }
          });
        }

        // Check if already skipped this meal
        const isAlreadySkipped = subscription.skippedMeals?.some(skip =>
          moment(skip.date).isSame(skipDate, 'day') && skip.shift === shift
        );

        if (isAlreadySkipped) {
          return res.status(400).json({
            success: false,
            message: `Meal for ${date} ${shift} is already skipped`,
            code: 'MEAL_ALREADY_SKIPPED'
          });
        }

        // Check if meal is already replaced
        if (subscription.thaliReplacements && subscription.thaliReplacements.length > 0) {
          const existingReplacement = subscription.thaliReplacements.find(rep => {
            if (!rep.date || !rep.shift) return false;
            const repDate = moment(rep.date).tz('Asia/Kolkata').startOf('day');
            return repDate.isSame(skipDate, 'day') && rep.shift === shift;
          });

          if (existingReplacement) {
            return res.status(400).json({
              success: false,
              message: `Cannot skip meal for ${shift} shift on ${skipDate.format('YYYY-MM-DD')}. A thali replacement already exists for this shift.`,
              code: 'REPLACEMENT_EXISTS_FOR_SHIFT'
            });
          }
        }

        // Check if meal is already customized
        const MealCustomization = require('../models/MealCustomization');
        const existingCustomization = await MealCustomization.findOne({
          subscription: id,
          date: {
            $gte: skipDate.toDate(),
            $lt: skipDate.clone().add(1, 'day').toDate()
          },
          shift: shift,
          isActive: true
        });

        if (existingCustomization) {
          return res.status(400).json({
            success: false,
            message: `Cannot skip meal for ${shift} shift on ${skipDate.format('YYYY-MM-DD')}. A customization already exists for this shift.`,
            code: 'CUSTOMIZATION_EXISTS_FOR_SHIFT'
          });
        }

        validatedSkips.push({
          date: skipDate.toDate(),
          shift,
          skipDateMoment: skipDate // Keep for calculations
        });
      }

      // Check total skip limits for current month
      const currentMonth = moment().month();
      const skipsThisMonth = subscription.skippedMeals?.filter(skip => {
        return moment(skip.date).month() === currentMonth;
      }).length || 0;

      const totalNewSkips = validatedSkips.length;
      if (skipsThisMonth + totalNewSkips > maxSkipMeals) {
        return res.status(400).json({
          success: false,
          message: `Cannot skip ${totalNewSkips} meals. You have ${maxSkipMeals - skipsThisMonth} skips remaining this month.`,
          code: 'SKIP_LIMIT_REACHED',
          maxSkipMeals,
          currentSkips: skipsThisMonth,
          requestedSkips: totalNewSkips
        });
      }

      // Calculate refund amounts
      const totalDays = moment(subscription.endDate).diff(moment(subscription.startDate), 'days') + 1;
      const dailyDeduction = subscription.pricing.finalAmount / totalDays;
      const refundPerMeal = Math.round(dailyDeduction * 100) / 100;
      const totalRefund = refundPerMeal * totalNewSkips;

      // Process all skips
      subscription.skippedMeals = subscription.skippedMeals || [];
      const skipRecords = [];

      for (const validatedSkip of validatedSkips) {
        const skipRecord = {
          date: validatedSkip.date,
          shift: validatedSkip.shift,
          reason: reason || 'user_skipped',
          description: reason || 'User requested meal skip',
          createdAt: new Date(),
          createdBy: userId
        };

        subscription.skippedMeals.push(skipRecord);
        skipRecords.push(skipRecord);
      }

      // Add refund to user's wallet if applicable
      if (totalRefund > 0) {
        const user = await User.findById(userId);
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found',
            code: 'USER_NOT_FOUND'
          });
        }

        // Add to wallet
        user.wallet.balance = (user.wallet.balance || 0) + totalRefund;

        // Create wallet transaction
        const walletTransaction = new WalletTransaction({
          user: userId,
          amount: totalRefund,
          type: 'credit',
          status: 'completed',
          method: 'refund',
          referenceId: `skip_${subscription._id}_${Date.now()}`,
          note: `Refund for ${totalNewSkips} skipped meals`,
          metadata: {
            subscriptionId: subscription._id,
            skipDates: validatedSkips.map(s => ({
              date: s.date,
              shift: s.shift
            })),
            totalSkips: totalNewSkips,
            refundPerMeal: refundPerMeal,
            reason: reason || 'User requested'
          }
        });

        await walletTransaction.save();
        await user.save();
      }

      await subscription.save();

      // Send notification
      try {
        const dateRangeText = validatedSkips.length === 1
          ? `${moment(validatedSkips[0].date).format('MMM D, YYYY')} (${validatedSkips[0].shift})`
          : `${validatedSkips.length} meals from ${moment(validatedSkips[0].date).format('MMM D')} to ${moment(validatedSkips[validatedSkips.length - 1].date).format('MMM D, YYYY')}`;

        await createNotification({
          userId,
          title: 'Meals Skipped',
          message: `Successfully skipped ${dateRangeText}. Refund: ₹${totalRefund}`,
          type: 'subscription',
          data: {
            subscriptionId: subscription._id,
            skipDates: validatedSkips.map(s => s.date),
            shifts: validatedSkips.map(s => s.shift),
            totalRefund,
            totalSkips: totalNewSkips
          }
        });
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
        // Non-blocking error
      }

      res.status(200).json({
        success: true,
        message: `Successfully skipped ${totalNewSkips} meals`,
        data: {
          skippedMeals: skipRecords.map(record => ({
            date: moment(record.date).format('YYYY-MM-DD'),
            shift: record.shift,
            refundAmount: refundPerMeal
          })),
          totalSkipped: totalNewSkips,
          totalRefund: totalRefund,
          refundPerMeal: refundPerMeal,
          skipsUsedThisMonth: skipsThisMonth + totalNewSkips,
          skipsRemaining: Math.max(0, maxSkipMeals - (skipsThisMonth + totalNewSkips)),
          limits: {
            maxSkipMeals,
            maxSkipDaysInAdvance,
            lastSkipReset: adminSettings?.updatedAt || new Date()
          }
        }
      });

      // If we get here, the operation was successful
      break; // Exit the retry loop

    } catch (error) {
      console.error(`Error skipping meal (attempt ${retryCount + 1}):`, error);

      // Check if this is a MongoDB write conflict that we can retry
      if (error.code === 112 || error.codeName === 'WriteConflict' ||
        (error.message && error.message.includes('Write conflict'))) {
        retryCount++;
        console.log(`MongoDB write conflict detected. Retrying... (${retryCount}/${maxRetries})`);

        if (retryCount < maxRetries) {
          // Wait a bit before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100));
          continue; // Continue to next retry attempt
        }
      }

      // If we get here, either it's not a retryable error or we've exhausted retries
      const statusCode = error.statusCode || 500;
      const errorMessage = error.message || 'Failed to skip meal';

      res.status(statusCode).json({
        success: false,
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        code: error.code || 'INTERNAL_ERROR'
      });
      return; // Exit the retry loop
    }
  } // End of while loop
};
/**
 * Customize meal for a subscription
 */
const customizeMeal = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date,
      notes,
      spiceLevel,
      noOnion,
      noGarlic,
      specialInstructions,
      extraItems,
      mealReplacement,
      dietaryPreference,
      customizations,
      totalExtraCost,
      requiresPayment,
      paymentAmount,
      quantity,
      timing,
      mealType = 'evening', // Default to evening
      setAsDefault = false, // New field for setting default meal
      replacementScope = 'one-day', // 'one-day' or 'remaining-days'
      selectedReplacementThali // Thali replacement data
    } = req.body;

    console.log('Customization request data:', req.body);
    console.log('Replacement scope received:', replacementScope);
    console.log('Selected replacement thali:', selectedReplacementThali);
    console.log('Extra items received:', extraItems);
    console.log('Extra items length:', extraItems?.length || 0);

    const subscription = await Subscription.findOne({
      _id: id,
      user: req.user._id
    }).populate('mealPlan');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active subscriptions can be customized'
      });
    }

    // Validate and parse the date
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required for meal customization'
      });
    }

    const customizationDate = new Date(date);
    customizationDate.setHours(0, 0, 0, 0);

    // Check if the date is valid
    if (isNaN(customizationDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format provided'
      });
    }

    // Check if date is within subscription period
    if (customizationDate <= subscription.startDate || customizationDate >= subscription.endDate) {
      return res.status(400).json({
        success: false,
        message: 'Customization date must be within subscription period'
      });
    }

    // Determine if this is for morning or evening meal
    const isMorning = mealType === 'morning' || timing === 'morning';
    const mealShift = isMorning ? 'morning' : 'evening';

    // Check if user has this meal shift in their plan
    if (!subscription.mealPlan?.shifts?.includes(mealShift)) {
      return res.status(400).json({
        success: false,
        message: `You don't have ${mealShift} meals in your subscription plan`
      });
    }

    // Get or create DailyOrder for the specified date
    let dailyOrder = await DailyOrder.findOne({
      userId: req.user._id,
      subscriptionId: subscription._id,
      date: customizationDate
    });

    if (!dailyOrder) {
      // Create new DailyOrder
      dailyOrder = new DailyOrder({
        userId: req.user._id,
        subscriptionId: subscription._id,
        date: customizationDate,
        orderStatus: 'pending',
        paymentStatus: 'pending'
      });

      // Set up meal shifts based on subscription plan
      if (subscription.mealPlan.shifts.includes('morning')) {
        dailyOrder.morning = {
          mealType: 'default',
          status: 'pending'
        };
      }
      if (subscription.mealPlan.shifts.includes('evening')) {
        dailyOrder.evening = {
          mealType: 'default',
          status: 'pending'
        };
      }
    }

    // Calculate base meal price
    const baseMealPrice = subscription.mealPlan?.pricing?.oneDay || 80;
    const calculatedExtraCost = totalExtraCost || 0;

    // Smart payment logic: 
    // - For thali replacement: only pay if replacement price > base meal price
    // - For addons/extra items: always pay the full amount
    let paymentRequired = 0;

    // Calculate addon/extra items cost (always requires payment)
    const addonsAndExtrasCost = (extraItems || []).reduce((sum, item) => {
      return sum + ((item.price || 0) * (item.quantity || 1));
    }, 0);

    // Add addons cost to payment (always required)
    paymentRequired += addonsAndExtrasCost;

    // Handle thali replacement cost with scope-based pricing
    if (selectedReplacementThali && selectedReplacementThali.price) {
      const replacementPrice = selectedReplacementThali.price;
      const priceDifference = replacementPrice - baseMealPrice;

      if (replacementScope === 'one-day') {
        // One-day replacement: only pay difference if replacement > base price
        const oneDayDifference = Math.max(0, priceDifference);
        paymentRequired += oneDayDifference;
        console.log(`One-day replacement: ${selectedReplacementThali.name} - Base: ₹${baseMealPrice}, Replacement: ₹${replacementPrice}, Difference: ₹${oneDayDifference}`);
      } else if (replacementScope === 'remaining-days') {
        // Remaining-days replacement: calculate for all remaining meals
        const remainingMeals = subscription.remainingMeals || 1;
        const totalDifference = priceDifference * remainingMeals;

        if (totalDifference > 0) {
          paymentRequired += totalDifference;
        }
        // If replacement is cheaper, user gets credit (handled separately)
        console.log(`Remaining-days replacement: ${selectedReplacementThali.name} - Base: ₹${baseMealPrice}, Replacement: ₹${replacementPrice}, Per meal difference: ₹${priceDifference}, Remaining meals: ${remainingMeals}, Total: ₹${totalDifference}`);
      }
    }
    // Fallback for old mealReplacement format
    else if (mealReplacement && mealReplacement.price) {
      const replacementPriceDifference = Math.max(0, mealReplacement.price - baseMealPrice);
      paymentRequired += replacementPriceDifference;
    }

    const requiresImmediatePayment = paymentRequired > 0;

    // Prepare customization data
    const customizationData = {
      notes: notes || '',
      spiceLevel: spiceLevel || 'medium',
      preferences: {
        noOnion: noOnion || false,
        noGarlic: noGarlic || false,
        specialInstructions: specialInstructions || ''
      },
      extraItems: extraItems || [],
      mealReplacement: mealReplacement || null,
      dietaryPreference: dietaryPreference || 'vegetarian',
      customizations: customizations || [],
      quantity: quantity || 1,
      timing: timing || mealShift,
      totalExtraCost: calculatedExtraCost,
      paymentAmount: requiresImmediatePayment ? paymentRequired : 0,
      paymentStatus: requiresImmediatePayment ? 'pending' : 'paid'
    };

    console.log('Saving customization data:', customizationData);

    // Update the DailyOrder with customization
    dailyOrder[mealShift] = {
      mealType: 'customized',
      customization: customizationData,
      status: 'pending'
    };

    // Update total extra cost for the day
    dailyOrder.totalExtraCost = dailyOrder.getTotalExtraCost();
    dailyOrder.totalPaymentAmount = dailyOrder.totalExtraCost;
    dailyOrder.paymentStatus = requiresImmediatePayment ? 'pending' : 'paid';

    await dailyOrder.save();

    // If user wants to set this as default meal
    if (setAsDefault) {
      subscription.defaultMealPreferences[mealShift] = {
        spiceLevel: spiceLevel || 'medium',
        dietaryPreference: dietaryPreference || 'vegetarian',
        preferences: {
          noOnion: noOnion || false,
          noGarlic: noGarlic || false,
          specialInstructions: specialInstructions || ''
        },
        customizations: customizations || [],
        quantity: quantity || 1,
        timing: timing || mealShift
      };
      await subscription.save();
    }

    // If payment is required, return payment information
    if (requiresImmediatePayment) {
      return res.json({
        success: true,
        message: 'Customization saved. Payment required for additional charges.',
        requiresPayment: true,
        paymentAmount: paymentRequired,
        data: {
          customization: customizationData,
          dailyOrderId: dailyOrder._id,
          mealShift: mealShift
        }
      });
    }

    // Send notification for successful customization
    try {
      await createNotification({
        userId: req.user._id,
        title: 'Meal Customized',
        message: `Your ${mealShift} meal has been customized for ${customizationDate.toDateString()}.`,
        type: 'subscription',
        data: { subscriptionId: subscription._id, dailyOrderId: dailyOrder._id }
      });
    } catch (notificationError) {
      console.error('Notification error (non-blocking):', notificationError);
    }

    res.json({
      success: true,
      message: 'Meal customization saved successfully',
      requiresPayment: false,
      data: {
        customization: customizationData,
        dailyOrderId: dailyOrder._id,
        mealShift: mealShift
      }
    });

  } catch (error) {
    console.error('Customize meal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to customize meal',
      error: error.message
    });
  }
};

/**
 * Process instant payment for meal customization
 */
const processCustomizationPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentAmount, paymentMethod = 'wallet', dailyOrderId, mealShift } = req.body;

    console.log('Customization payment request:', { id, paymentAmount, paymentMethod, dailyOrderId, mealShift });

    const subscription = await Subscription.findOne({
      _id: id,
      user: req.user._id
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    if (subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active subscriptions can have payments processed'
      });
    }

    // Validate payment amount
    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment amount'
      });
    }

    // Find the DailyOrder
    const dailyOrder = await DailyOrder.findById(dailyOrderId);
    if (!dailyOrder) {
      return res.status(404).json({
        success: false,
        message: 'Daily order not found'
      });
    }

    // Verify the order belongs to the user
    if (dailyOrder.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this order'
      });
    }

    // Check if the meal shift exists and has customization
    if (!dailyOrder[mealShift] || dailyOrder[mealShift].mealType !== 'customized') {
      return res.status(404).json({
        success: false,
        message: 'Customization not found for this meal'
      });
    }

    const mealCustomization = dailyOrder[mealShift];
    if (mealCustomization.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed for this customization'
      });
    }

    // Get user for wallet operations
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Process payment based on method
    if (paymentMethod === 'wallet') {
      // Check if user has sufficient wallet balance
      if (user.wallet.balance < paymentAmount) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient wallet balance',
          data: {
            required: paymentAmount,
            available: user.wallet.balance
          }
        });
      }

      // Deduct from wallet
      user.wallet.balance -= paymentAmount;
      user.wallet.transactions.push({
        amount: paymentAmount,
        type: 'debit',
        note: `Payment for meal customization - Subscription ${subscription._id}`,
        timestamp: new Date(),
        referenceId: `CUST_${Date.now()}`
      });

      await user.save();
    } else {
      // Handle other payment methods (Razorpay, etc.)
      return res.status(400).json({
        success: false,
        message: 'Payment method not supported yet'
      });
    }

    // Update customization payment status
    mealCustomization.paymentStatus = 'paid';
    mealCustomization.paymentAmount = paymentAmount;
    dailyOrder.paymentStatus = 'paid';
    dailyOrder.totalPaymentAmount = dailyOrder.getTotalExtraCost();

    await dailyOrder.save();

    // Create notification
    try {
      await createNotification({
        userId: req.user._id,
        title: 'Customization Payment Successful',
        message: `Payment of ₹${paymentAmount} processed successfully for your ${mealShift} meal customization.`,
        type: 'payment',
        data: { subscriptionId: subscription._id, dailyOrderId: dailyOrder._id, amount: paymentAmount }
      });
    } catch (notificationError) {
      console.error('Notification error (non-blocking):', notificationError);
    }

    res.json({
      success: true,
      message: 'Payment processed successfully',
      data: {
        subscriptionId: subscription._id,
        amount: paymentAmount,
        newBalance: user.wallet.balance,
        customization: mealCustomization,
        dailyOrderId: dailyOrder._id,
        mealShift: mealShift
      }
    });

  } catch (error) {
    console.error('Customization payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment',
      error: error.message
    });
  }
};

/**
 * Create daily orders for all active subscriptions (for cron job)
 */
const createDailyOrdersForAllSubscriptions = async (date = new Date()) => {
  try {
    console.log('Creating daily orders for date:', date);

    // Set time to start of day
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Use the static method from DailyOrder model
    const createdOrders = await DailyOrder.createDailyOrders(targetDate);

    console.log(`Created ${createdOrders.length} daily orders for ${targetDate.toDateString()}`);

    return createdOrders;
  } catch (error) {
    console.error('Error creating daily orders:', error);
    throw error;
  }
};

/**
 * Clean up old failed subscriptions for a user
 */
const cleanupOldFailedSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find old failed subscriptions (older than 24 hours)
    const oldFailedSubs = await Subscription.find({
      user: userId,
      status: 'pending_payment',
      createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (oldFailedSubs.length === 0) {
      return res.json({
        success: true,
        message: 'No old failed subscriptions to cleanup',
        data: { cleanedCount: 0 }
      });
    }

    // Update old failed subscriptions to cancelled status
    const updateResult = await Subscription.updateMany(
      {
        user: userId,
        status: 'pending_payment',
        createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      {
        $set: {
          status: 'cancelled',
          cancellationReason: 'Payment failed - manually cleaned up by user',
          cancelledAt: new Date()
        }
      }
    );

    console.log(`Cleaned up ${updateResult.modifiedCount} old failed subscriptions for user ${userId}`);

    res.json({
      success: true,
      message: `Cleaned up ${updateResult.modifiedCount} old failed subscriptions`,
      data: {
        cleanedCount: updateResult.modifiedCount,
        subscriptions: oldFailedSubs.map(sub => ({
          id: sub._id,
          subscriptionId: sub.subscriptionId,
          createdAt: sub.createdAt,
          status: 'cancelled'
        }))
      }
    });

  } catch (error) {
    console.error('Error cleaning up old failed subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup old failed subscriptions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Clean up invalid customizations in subscriptions (for admin use)
 */
const cleanupInvalidCustomizations = async (req, res) => {
  try {
    const result = await Subscription.updateMany(
      { 'customizations.date': { $exists: false } },
      { $unset: { 'customizations.$[elem].date': 1 } },
      { arrayFilters: [{ 'elem.date': { $exists: false } }] }
    );

    res.json({
      success: true,
      message: 'Invalid customizations cleaned up',
      data: result
    });
  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup invalid customizations',
      error: error.message
    });
  }
};

/**
 * Manual trigger for daily deductions (for testing/admin use)
 */
const triggerManualDeduction = async (req, res) => {
  try {
    const { date } = req.body;
    const deductionDate = date ? new Date(date) : new Date();
    deductionDate.setHours(0, 0, 0, 0);

    await processDailyDeductions(deductionDate);

    res.json({
      success: true,
      message: 'Manual deduction triggered successfully',
      data: { date: deductionDate }
    });

  } catch (error) {
    console.error('Manual deduction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger manual deduction',
      error: error.message
    });
  }
};

/**
 * Test function to verify subscription creation
 */
const testSubscriptionCreation = async (req, res) => {
  try {
    console.log('=== TESTING SUBSCRIPTION CREATION ===');

    // Test data
    const testOrderData = {
      mealPlanId: req.body.mealPlanId || '507f1f77bcf86cd799439011', // Default test ID
      planType: 'monthly',
      duration: 30,
      deliverySlot: 'lunch',
      deliveryAddress: {
        street: 'Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      },
      totalAmount: 1500,
      subtotal: 1500,
      selectedAddOns: [],
      customAddOns: [],
      customizations: [],
      dietaryPreference: 'vegetarian',
      quantity: 1,
      orderId: '507f1f77bcf86cd799439012',
      promoCode: '',
      discount: 0
    };

    const testUserId = req.body.userId || req.user?._id || '507f1f77bcf86cd799439013';

    console.log('Test order data:', testOrderData);
    console.log('Test user ID:', testUserId);

    const subscription = await createSubscriptionFromOrder(testOrderData, testUserId);

    res.json({
      success: true,
      message: 'Manual deduction process triggered successfully'
    });

  } catch (error) {
    console.error('Error triggering manual deduction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger manual deduction'
    });
  }
};

/**
 * Simple test endpoint to create a basic subscription
 */
const createTestSubscription = async (req, res) => {
  try {
    console.log('=== CREATING TEST SUBSCRIPTION ===');

    // Get user ID from request
    const userId = req.user?.id || req.body.userId;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
    }

    // Create a simple test subscription
    const testSubscriptionData = {
      // Let the model generate the subscriptionId automatically
      user: userId,
      mealPlan: req.body.mealPlanId || '507f1f77bcf86cd799439011', // Default test meal plan ID
      planType: 'oneDay',
      duration: 1,
      shift: 'evening',
      startShift: 'evening',
      thaliCount: 1,
      deliverySettings: {
        startDate: new Date(),
        startShift: 'evening',
        deliveryDays: [{ day: 'monday' }],
        firstDeliveryDate: new Date(),
        lastDeliveryDate: new Date()
      },
      deliveryTiming: {
        morning: { enabled: false, time: '08:00' },
        evening: { enabled: true, time: '19:00' }
      },
      mealCounts: {
        totalMeals: 1,
        mealsDelivered: 0,
        mealsSkipped: 0,
        mealsRemaining: 1,
        regularMealsDelivered: 0,
        sundayMealsDelivered: 0
      },
      pricing: {
        basePricePerMeal: 75,
        totalDays: 1,
        mealsPerDay: 1,
        totalMeals: 1,
        totalThali: 1,
        totalAmount: 75,
        planPrice: 75,
        addOnsPrice: 0,
        customizationPrice: 0,
        finalAmount: 75
      },
      selectedAddOns: [],
      customizations: [],
      customizationPreferences: [],
      dietaryPreference: 'vegetarian',
      deliveryAddress: {
        street: 'Test Street',
        city: 'Test City',
        state: 'Test State',
        pincode: '123456'
      },
      startDate: new Date(),
      endDate: new Date(),
      nextDeliveryDate: new Date(),
      autoRenewal: { enabled: false, renewalType: 'same_duration' },
      status: 'pending_payment',
      paymentStatus: 'pending',
      isActive: false,
      customizationHistory: [],
      customizedDays: [],
      skippedMeals: [],
      dailyDeductions: [],
      thaliReplacements: [],
      mealCustomizations: [],
      defaultMealPreferences: {
        morning: {
          spiceLevel: 'medium',
          dietaryPreference: 'vegetarian',
          preferences: {
            noOnion: false,
            noGarlic: false,
            specialInstructions: ''
          },
          customizations: [],
          quantity: 1,
          timing: 'morning',
          isCustomized: false,
          lastUpdated: new Date()
        },
        evening: {
          spiceLevel: 'medium',
          dietaryPreference: 'vegetarian',
          preferences: {
            noOnion: false,
            noGarlic: false,
            specialInstructions: ''
          },
          customizations: [],
          quantity: 1,
          timing: 'evening',
          isCustomized: false,
          lastUpdated: new Date()
        }
      }
    };

    console.log('Test subscription data prepared');
    console.log('User ID:', testSubscriptionData.user);
    console.log('Meal Plan ID:', testSubscriptionData.mealPlan);
    console.log('Plan Type:', testSubscriptionData.planType);

    // Create and save the subscription
    const newSubscription = new Subscription(testSubscriptionData);
    await newSubscription.save();

    console.log('✅ Test subscription created successfully!');
    console.log('Subscription ID:', newSubscription._id);
    console.log('Subscription ID String:', newSubscription.subscriptionId);

    res.status(201).json({
      success: true,
      message: 'Test subscription created successfully',
      data: {
        subscriptionId: newSubscription._id,
        subscriptionIdString: newSubscription.subscriptionId,
        status: newSubscription.status,
        planType: newSubscription.planType,
        duration: newSubscription.duration
      }
    });

  } catch (error) {
    console.error('❌ Error creating test subscription:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate subscription ID. Please try again.',
        error: 'DUPLICATE_ID'
      });
    }

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Subscription validation failed',
        error: 'VALIDATION_ERROR',
        details: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create test subscription',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};


const checkSubscriptionEligibility = async (req, res) => {
  try {
    const userId = req.user.id;
    const now = new Date();

    // Check for existing active subscriptions that haven't expired
    const activeSubscription = await Subscription.findOne({
      user: userId,
      status: { $in: ['active', 'pending_payment'] },
      endDate: { $gt: now } // Only consider subscriptions that haven't ended yet
    }).populate('mealPlan', 'title');

    if (activeSubscription) {
      return res.status(200).json({
        success: false,
        eligible: false,
        message: 'You already have an active subscription',
        data: {
          existingSubscription: {
            id: activeSubscription._id,
            subscriptionId: activeSubscription.subscriptionId,
            status: activeSubscription.status,
            mealPlan: activeSubscription.mealPlan?.title || 'Unknown',
            startDate: activeSubscription.startDate,
            endDate: activeSubscription.endDate
          }
        }
      });
    }

    return res.status(200).json({
      success: true,
      eligible: true,
      message: 'User is eligible for subscription'
    });

  } catch (error) {
    console.error('Error checking subscription eligibility:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check eligibility'
    });
  }
};

// ============================================
// Create Subscription from Order
// ============================================
const createSubscriptionFromOrder = async (orderData, userId) => {
  try {
    console.log('Creating subscription from order data:', orderData);

    // Validate required fields
    if (!orderData.mealPlanId || !orderData.planType) {
      throw new Error('Missing required fields: mealPlanId or planType');
    }

    // Get meal plan details
    const mealPlan = await MealPlan.findById(orderData.mealPlanId);
    if (!mealPlan) {
      throw new Error('Meal plan not found');
    }

    // Map plan types to durations and pricing
    const planTypeMapping = {
      'oneDay': {
        duration: 1,
        pricingKey: 'oneDay',
        description: '1 Day Plan'
      },
      'tenDays': {
        duration: 10,
        pricingKey: 'tenDays',
        description: '10 Days Plan'
      },
      'thirtyDays': {
        duration: 30,
        pricingKey: 'thirtyDays',
        description: '30 Days Plan'
      }
    };

    const planConfig = planTypeMapping[orderData.planType];
    if (!planConfig) {
      throw new Error(`Invalid plan type: ${orderData.planType}. Must be oneDay, tenDays, or thirtyDays`);
    }

    // Calculate start date from order data or use today
    let startDate;
    if (orderData.startDate) {
      startDate = new Date(orderData.startDate);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate = new Date();
      startDate.setHours(0, 0, 0, 0); // Start from beginning of today
    }

    // Calculate end date based on plan duration
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + planConfig.duration);

    // Get pricing from meal plan
    const totalAmount = mealPlan.pricing?.[planConfig.pricingKey] || 0;
    const dailyPrice = totalAmount / planConfig.duration;

    // Determine delivery timing based on order data
    let deliveryTiming = {
      morning: { enabled: false, time: "08:00" },
      evening: { enabled: false, time: "19:00" }
    };

    // Parse delivery timing from order data
    if (orderData.deliveryTiming) {
      deliveryTiming = orderData.deliveryTiming;
    } else if (orderData.deliverySlot) {
      // Fallback: parse delivery slot
      if (orderData.deliverySlot === 'morning' || orderData.deliverySlot === 'lunch') {
        deliveryTiming.morning.enabled = true;
      } else if (orderData.deliverySlot === 'evening' || orderData.deliverySlot === 'dinner') {
        deliveryTiming.evening.enabled = true;
      }
    } else {
      // Default: enable morning delivery
      deliveryTiming.morning.enabled = true;
    }

    // Calculate meals per day
    const mealsPerDay = (deliveryTiming.morning.enabled ? 1 : 0) + (deliveryTiming.evening.enabled ? 1 : 0);
    let totalMeals = planConfig.duration * mealsPerDay;

    // Calculate total thali count with Sunday adjustments for 30-day plan
    let totalThali = totalMeals;
    if (orderData.planType === 'thirtyDays') {
      const end = new Date(startDate);
      end.setDate(startDate.getDate() + 29); // 30 days total (including start date)

      let sundays = 0;
      let weekdays = 0;
      const currentDate = new Date(startDate);

      // Count weekdays and Sundays
      while (currentDate <= end) {
        const dayOfWeek = currentDate.getDay();
        if (dayOfWeek === 0) { // Sunday
          sundays++;
        } else { // Weekday (Monday to Saturday)
          weekdays++;
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Calculate total thalis: (weekdays * 2) + (sundays * 1)
      totalThali = (weekdays * 2) + sundays;
    }

    // Process selected add-ons - convert IDs to objects
    let processedAddOns = [];
    if (orderData.selectedAddOns && Array.isArray(orderData.selectedAddOns)) {
      // If selectedAddOns is already an array of objects, use it as is
      if (orderData.selectedAddOns.length > 0 && typeof orderData.selectedAddOns[0] === 'object') {
        processedAddOns = orderData.selectedAddOns;
      } else {
        // If selectedAddOns is an array of IDs, convert to objects
        processedAddOns = orderData.selectedAddOns.map(addOnId => {
          // Find the add-on in the meal plan
          const addOn = mealPlan.addOns?.find(a =>
            a._id?.toString() === addOnId?.toString() ||
            a.id?.toString() === addOnId?.toString() ||
            a.name === addOnId
          );

          return {
            addOnId: addOn?._id || addOn?.id || null,
            name: addOn?.name || addOnId,
            price: addOn?.price || 0,
            frequency: 'daily'
          };
        });
      }
    }

    // Create subscription object
    const subscriptionData = {
      user: userId,
      mealPlan: orderData.mealPlanId,
      planType: orderData.planType,
      duration: planConfig.duration,
      startDate: startDate,
      endDate: endDate, // Will be calculated by pre-save hook
      deliverySettings: {
        startDate: startDate,
        startShift: deliveryTiming?.startShift || 'evening',
        deliveryDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
        deliveryTiming: deliveryTiming,
        timezone: 'Asia/Kolkata'
      },
      mealCounts: {
        totalMeals: totalMeals,
        delivered: 0,
        skipped: 0,
        remaining: totalMeals
      },
      pricing: {
        basePricePerMeal: dailyPrice,
        totalDays: planConfig.duration,
        mealsPerDay: mealsPerDay,
        totalMeals: totalMeals,
        totalThali: totalThali, // Total thali count with Sunday adjustments
        totalAmount: totalAmount,
        addOnsPrice: 0,
        customizationPrice: 0,
        finalAmount: orderData.totalAmount || totalAmount
      },
      selectedAddOns: processedAddOns,
      customizations: [],
      customizationPreferences: {
        dietaryPreference: orderData.dietaryPreference || 'vegetarian',
        preferences: orderData.customizations?.preferences || [],
        notes: orderData.customizations?.notes || ''
      },
      defaultMeal: orderData.mealPlanId,
      customizationHistory: [],
      permanentCustomization: {
        isActive: false,
        mealPlan: null,
        addOns: [],
        extraItems: [],
        preferences: {
          dietaryPreference: orderData.dietaryPreference || 'vegetarian',
          customOptions: [],
          spiceLevel: 'medium',
          specialInstructions: '',
          noOnion: false,
          noGarlic: false
        }
      },
      deliveryAddress: orderData.deliveryAddress,
      status: 'active',
      paymentStatus: 'paid',
      activatedAt: new Date()
    };

    // Create and save subscription
    const subscription = new Subscription(subscriptionData);
    await subscription.save();

    console.log('Subscription created successfully:', {
      subscriptionId: subscription.subscriptionId,
      planType: orderData.planType,
      duration: planConfig.duration,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      totalAmount: totalAmount,
      dailyPrice: dailyPrice
    });

    return subscription;

  } catch (error) {
    console.error('Error creating subscription from order:', error);
    throw error;
  }
};

/**
 * Get user customizations from DailyOrder
 */
const getUserCustomizations = async (req, res) => {
  try {
    const { subscriptionId, date } = req.query;
    const userId = req.user._id;

    let query = { userId: userId };

    if (subscriptionId) {
      query.subscriptionId = subscriptionId;
    }

    if (date) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      query.date = targetDate;
    }

    const dailyOrders = await DailyOrder.find(query)
      .populate('subscriptionId', 'subscriptionId mealPlan')
      .sort({ date: -1 });

    const customizations = [];
    dailyOrders.forEach(dailyOrder => {
      // Check morning meal
      if (dailyOrder.morning && dailyOrder.morning.mealType === 'customized') {
        customizations.push({
          ...dailyOrder.morning.customization.toObject(),
          date: dailyOrder.date,
          mealShift: 'morning',
          dailyOrderId: dailyOrder._id,
          orderStatus: dailyOrder.orderStatus,
          paymentStatus: dailyOrder.paymentStatus
        });
      }

      // Check evening meal
      if (dailyOrder.evening && dailyOrder.evening.mealType === 'customized') {
        customizations.push({
          ...dailyOrder.evening.customization.toObject(),
          date: dailyOrder.date,
          mealShift: 'evening',
          dailyOrderId: dailyOrder._id,
          orderStatus: dailyOrder.orderStatus,
          paymentStatus: dailyOrder.paymentStatus
        });
      }
    });

    res.json({
      success: true,
      data: customizations
    });

  } catch (error) {
    console.error('Get user customizations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user customizations',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// Replace Thali in Subscription
// ============================================
const replaceThali = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { subscriptionId } = req.params;
    const {
      mealplanId,
      thaliId,
      date,
      isDefault,
      priceDifference,
      totalPayment,
      selectedAddOns = [],
      customizationType = 'one-time' // 'one-time' or 'permanent'
    } = req.body;

    const userId = req.user.id;

    // 1. Validate subscription exists and belongs to user
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      user: userId,
      status: { $in: ['active', 'pending_payment'] }
    }).session(session);

    if (!subscription) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Active subscription not found or access denied'
      });
    }

    // VALIDATION: Check if replacement is already done for the same date and shift
    if (date && !isDefault) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      // Check existing customizations for the same date and shift
      const MealCustomization = require('../models/MealCustomization');
      const existingCustomization = await MealCustomization.findOne({
        subscription: subscriptionId,
        date: {
          $gte: targetDate,
          $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) // Next day
        },
        replacementMeal: { $exists: true, $ne: null },
        isActive: true
      }).session(session);

      if (existingCustomization) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Cannot replace thali more than once for the same date. A replacement already exists.`,
          code: 'DUPLICATE_REPLACEMENT'
        });
      }

      // Check subscription's thaliReplacements array for the same date
      if (subscription.thaliReplacements && subscription.thaliReplacements.length > 0) {
        const existingReplacement = subscription.thaliReplacements.find(rep => {
          if (!rep.date) return false;
          const repDate = new Date(rep.date);
          repDate.setHours(0, 0, 0, 0);
          return repDate.getTime() === targetDate.getTime();
        });

        if (existingReplacement) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            success: false,
            message: `Cannot replace thali more than once for the same date. A replacement already exists.`,
            code: 'DUPLICATE_REPLACEMENT'
          });
        }
      }
    }

    // VALIDATION: Check time restrictions for replacement
    if (date && !isDefault) {
      const now = new Date();
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // If replacing for today, check time restrictions
      if (targetDate.getTime() === today.getTime()) {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;

        // Get the shift from the subscription or request
        const shift = req.body.shift || subscription.shift || 'evening';

        if (shift === 'morning') {
          // Morning shift: must be before 11:59 AM (719 minutes)
          if (currentTime >= 719) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
              success: false,
              message: 'Morning shift thali replacement must be done before 11:59 AM for the same day',
              code: 'TIME_RESTRICTION_VIOLATED'
            });
          }
        } else if (shift === 'evening') {
          // Evening shift: must be before 7:00 PM (1140 minutes)
          if (currentTime >= 1140) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({
              success: false,
              message: 'Evening shift thali replacement must be done before 7:00 PM for the same day',
              code: 'TIME_RESTRICTION_VIOLATED'
            });
          }
        }
      }
    }

    // VALIDATION: Check if meal is already skipped for the same date
    if (date && !isDefault) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      // Check if there's a skipped meal for the same date
      if (subscription.skippedMeals && subscription.skippedMeals.length > 0) {
        const existingSkip = subscription.skippedMeals.find(skip => {
          if (!skip.date) return false;
          const skipDate = new Date(skip.date);
          skipDate.setHours(0, 0, 0, 0);
          return skipDate.getTime() === targetDate.getTime();
        });

        if (existingSkip) {
          await session.abortTransaction();
          session.endSession();
          return res.status(400).json({
            success: false,
            message: `Cannot replace thali for ${targetDate.toDateString()}. This meal has already been skipped.`,
            code: 'MEAL_ALREADY_SKIPPED'
          });
        }
      }
    }

    // 2. Validate thali exists and get its details
    const mealPlan = await MealPlan.findById(mealplanId).session(session);
    if (!mealPlan) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    // Find the replacement thali in the meal plan's replacements
    const thali = mealPlan.replacements.find(r => r._id.toString() === thaliId);
    if (!thali) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Thali replacement option not found in this meal plan'
      });
    }

    // Calculate base meal price from subscription
    const baseMealPrice = subscription.pricing?.basePricePerMeal || 0;
    const replacementPrice = thali.price || 0;

    // Calculate price difference based on replacement type
    let calculatedPriceDifference = 0;
    let paymentRequired = 0;
    let requiresCoverage = 0;

    if (customizationType === 'one-time') {
      // For one-time replacement, only calculate for this meal
      calculatedPriceDifference = replacementPrice - baseMealPrice;
    } else {
      // For permanent replacement, calculate for remaining meals
      const remainingMeals = subscription.remainingMeals || 1;
      calculatedPriceDifference = (replacementPrice - baseMealPrice) * remainingMeals;
    }

    // Determine payment requirements
    if (calculatedPriceDifference > 0) {
      // If replacement is more expensive, user must pay the difference
      paymentRequired = calculatedPriceDifference;
    } else if (calculatedPriceDifference < 0) {
      // If replacement is cheaper, user must cover the difference with add-ons
      requiresCoverage = Math.abs(calculatedPriceDifference);
    }

    // Check if user has added enough add-ons to cover the difference
    const addOnsTotal = selectedAddOns.reduce((sum, item) => {
      return sum + ((item.price || 0) * (item.quantity || 1));
    }, 0);

    if (requiresCoverage > 0 && addOnsTotal < requiresCoverage) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: `Please add items worth at least ₹${requiresCoverage - addOnsTotal} more to cover the replacement cost`,
        requiresAdditionalItems: true,
        requiredAmount: requiresCoverage - addOnsTotal
      });
    }

    // 3. Check if replacement is allowed (e.g., not on same day)
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (targetDate < today) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({
        success: false,
        message: 'Cannot replace thali for past dates'
      });
    }

    // 4. Handle payment if there's an additional cost
    if (paymentRequired > 0) {
      // Verify payment was made
      if (typeof totalPayment !== 'number' || totalPayment < paymentRequired) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({
          success: false,
          message: `Payment of ₹${paymentRequired} is required for this thali replacement`,
          requiredAmount: paymentRequired,
          requiresPayment: true
        });
      }

      // Process payment (in a real app, this would integrate with payment gateway)
      console.log(`Processing payment of ₹${paymentRequired} for thali replacement`);

      // Update user's wallet or record transaction
      // This is a simplified example - in a real app, you'd have proper transaction handling
      const walletTransaction = new WalletTransaction({
        user: userId,
        amount: paymentRequired,
        type: 'debit',
        description: `Thali replacement: ${thali.name} (${isDefault ? 'Default' : 'One-time'})`,
        referenceId: `thali-replace-${Date.now()}`,
        status: 'completed'
      });

      await walletTransaction.save({ session });
    }

    // 5. Store the replacement details
    const replacementDetails = {
      originalMealPlan: mealplanId,
      replacementThali: thaliId,
      basePrice: baseMealPrice,
      replacementPrice: replacementPrice,
      priceDifference: calculatedPriceDifference,
      replacedAt: new Date(),
      isDefault: isDefault,
      customizationType: customizationType,
      addOns: selectedAddOns,
      addOnsTotal: addOnsTotal
    };

    // 6. Update subscription based on replacement type
    if (isDefault) {
      // Set as default thali for all future meals
      subscription.defaultThali = thaliId;

      // Store the price difference for future reference
      subscription.thaliReplacement = {
        originalMealPlan: mealplanId,
        replacementThali: thaliId,
        priceDifference,
        appliedAt: new Date(),
        isDefault: true
      };

      // Update all future daily orders that don't have customizations
      await DailyOrder.updateMany(
        {
          subscription: subscriptionId,
          date: { $gte: targetDate },
          'customization.isCustomized': { $ne: true }
        },
        {
          $set: {
            'mealPlan': thaliId,
            'customization.mealReplacement': thaliId,
            'customization.updatedAt': new Date()
          }
        },
        { session }
      );

      await subscription.save({ session });

      await session.commitTransaction();
      session.endSession();

      // Send notification
      try {
        await createNotification({
          userId: userId,
          title: 'Default Thali Updated',
          message: `Your default thali has been updated to ${thali.name}`,
          type: 'subscription',
          data: { subscriptionId: subscription._id }
        });
      } catch (notificationError) {
        console.error('Notification error (non-blocking):', notificationError);
      }

      return res.json({
        success: true,
        message: `Successfully set ${thali.name} as default thali for all future meals`,
        data: {
          subscriptionId: subscription._id,
          thali: {
            id: thali._id,
            name: thali.name,
            price: thali.price,
            image: thali.image
          },
          isDefault: true,
          updatedAt: new Date()
        }
      });
    } else {
      // Replace thali for specific date only
      // Find or create daily order for this date
      let dailyOrder = await DailyOrder.findOne({
        subscription: subscriptionId,
        date: targetDate
      }).session(session);

      // Store the thali replacement details
      const replacementDetails = {
        originalMealPlan: mealplanId,
        replacementThali: thaliId,
        priceDifference,
        replacedAt: new Date(),
        isDefault: false
      };

      subscription.thaliReplacements = subscription.thaliReplacements || [];
      subscription.thaliReplacements.push(replacementDetails);

      if (!dailyOrder) {
        // Create a new daily order if it doesn't exist
        dailyOrder = new DailyOrder({
          subscriptionId: subscriptionId,
          userId: userId,
          date: targetDate,
          mealPlan: thaliId,
          customization: {
            isCustomized: true,
            mealReplacement: thaliId,
            updatedAt: new Date()
          },
          status: 'scheduled'
        });
      } else {
        // Update existing daily order
        dailyOrder.mealPlan = thaliId;
        dailyOrder.customization = dailyOrder.customization || {};
        dailyOrder.customization.mealReplacement = thaliId;
        dailyOrder.customization.updatedAt = new Date();
        dailyOrder.customization.isCustomized = true;
      }

      await dailyOrder.save({ session });
      await session.commitTransaction();
      session.endSession();

      // Send notification
      try {
        await createNotification({
          userId: userId,
          title: 'Thali Replaced',
          message: `Your thali has been replaced with ${thali.name} for ${targetDate.toDateString()}`,
          type: 'subscription',
          data: {
            subscriptionId: subscription._id,
            dailyOrderId: dailyOrder._id
          }
        });
      } catch (notificationError) {
        console.error('Notification error (non-blocking):', notificationError);
      }

      return res.json({
        success: true,
        message: `Successfully replaced thali with ${thali.name} for ${targetDate.toDateString()}`,
        data: {
          subscriptionId: subscription._id,
          date: targetDate,
          thali: {
            id: thali._id,
            name: thali.name,
            price: thali.price,
            image: thali.image
          },
          isDefault: false,
          updatedAt: new Date()
        }
      });
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.error('Error replacing thali:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to replace thali',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// Update Subscription with Customization
// ============================================
const updateSubscriptionWithCustomization = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const {
      customizationId,
      type,
      setAsDefault,
      preferences
    } = req.body;

    // Find subscription
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      user: req.user.id
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Update subscription with customization preferences
    if (setAsDefault && type === 'permanent') {
      // Update default preferences for permanent customizations
      subscription.defaultPreferences = {
        ...subscription.defaultPreferences,
        ...preferences
      };

      // Add to active customizations
      if (!subscription.activeCustomizations) {
        subscription.activeCustomizations = [];
      }

      subscription.activeCustomizations.push({
        customizationId,
        type,
        appliedAt: new Date(),
        preferences
      });
    } else if (type === 'temporary' || type === 'one-time') {
      // Track temporary/one-time customizations
      if (!subscription.customizationHistory) {
        subscription.customizationHistory = [];
      }

      subscription.customizationHistory.push({
        customizationId,
        type,
        appliedAt: new Date(),
        preferences
      });
    }

    // Update subscription metadata
    subscription.lastCustomizedAt = new Date();
    subscription.updatedBy = req.user.id;

    await subscription.save();

    res.json({
      success: true,
      message: 'Subscription updated with customization',
      data: {
        subscriptionId: subscription._id,
        customizationId,
        type,
        setAsDefault
      }
    });

  } catch (error) {
    console.error('Error updating subscription with customization:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription',
    });
  }
};

// ============================================
// Get Active Subscription Users
// ============================================
const getActiveUsers = async (req, res) => {
  try {
    // Find all active subscriptions - ONLY based on status and meal count
    const activeSubscriptions = await Subscription.find({
      status: 'active',
      'mealCounts.mealsRemaining': { $gt: 0 } // Only subscriptions with remaining meals
    })
      .populate('user', 'name email phone')
      .populate('mealPlan', 'name')
      .select('user mealPlan startDate endDate status mealCounts')
      .sort({ 'user.name': 1 });

    // Format the response
    const activeUsers = activeSubscriptions.map(sub => ({
      _id: sub.user._id,
      name: sub.user.name,
      email: sub.user.email,
      phone: sub.user.phone,
      mealPlan: sub.mealPlan?.name || 'N/A',
      subscriptionId: sub._id,
      startDate: sub.startDate,
      endDate: sub.endDate,
      status: sub.status
    }));

    res.json({
      success: true,
      count: activeUsers.length,
      data: activeUsers
    });
  } catch (error) {
    console.error('Error fetching active users:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================
// Cleanup Old Subscriptions
// ============================================
const cleanupOldSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;

    // Find and cancel old pending subscriptions (older than 24 hours)
    const oldPendingSubs = await Subscription.find({
      user: userId,
      status: 'pending_payment',
      createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (oldPendingSubs.length === 0) {
      return res.json({
        success: true,
        message: 'No old subscriptions to cleanup',
        data: { cleanedCount: 0 }
      });
    }

    // Cancel old pending subscriptions
    const updateResult = await Subscription.updateMany(
      {
        user: userId,
        status: 'pending_payment',
        createdAt: { $lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      {
        $set: {
          status: 'cancelled',
          cancellationReason: 'Expired pending payment',
          cancelledAt: new Date()
        }
      }
    );

    // console.log(`Cleaned up ${updateResult.modifiedCount} old pending subscriptions for user ${userId}`);

    res.json({
      success: true,
      message: `Cleaned up ${updateResult.modifiedCount} old subscriptions`,
      data: {
        cleanedCount: updateResult.modifiedCount,
        subscriptions: oldPendingSubs.map(sub => ({
          id: sub._id,
          subscriptionId: sub.subscriptionId,
          createdAt: sub.createdAt,
          status: 'cancelled'
        }))
      }
    });

  } catch (error) {
    console.error('Error cleaning up old subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup old subscriptions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ============================================
// Cleanup All Pending Payment Subscriptions (For Unique Index Issues)
// ============================================
const cleanupAllPendingPaymentSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;

    console.log('🧹 Starting cleanup of ALL pending_payment subscriptions for user:', userId);

    // Find all pending_payment subscriptions for this user
    const pendingSubscriptions = await Subscription.find({
      user: userId,
      status: 'pending_payment'
    });

    if (pendingSubscriptions.length === 0) {
      return res.json({
        success: true,
        message: 'No pending_payment subscriptions found',
        data: { cleanedCount: 0 }
      });
    }

    console.log(`Found ${pendingSubscriptions.length} pending_payment subscriptions to cleanup`);

    // Cancel all pending_payment subscriptions
    const updateResult = await Subscription.updateMany(
      {
        user: userId,
        status: 'pending_payment'
      },
      {
        $set: {
          status: 'cancelled',
          cancellationReason: 'Cleaned up to resolve unique index conflict',
          cancelledAt: new Date()
        }
      }
    );

    console.log(`✅ Cleaned up ${updateResult.modifiedCount} pending_payment subscriptions`);

    res.json({
      success: true,
      message: `Cleaned up ${updateResult.modifiedCount} pending_payment subscriptions`,
      data: {
        cleanedCount: updateResult.modifiedCount,
        subscriptions: pendingSubscriptions.map(sub => ({
          id: sub._id,
          subscriptionId: sub.subscriptionId,
          createdAt: sub.createdAt,
          status: 'cancelled'
        }))
      }
    });

  } catch (error) {
    console.error('❌ Error cleaning up pending_payment subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup pending_payment subscriptions',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

const getSkipHistory = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user.id;

    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      user: userId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Get admin settings for limits
    const adminSettings = await AdminSettings.getCurrentSettings();
    const maxSkipMeals = adminSettings?.maxSkipMeals || 8;
    const maxSkipDaysInAdvance = adminSettings?.maxSkipDaysInAdvance || 7;

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const currentMonthSkips = subscription.skippedMeals?.filter(skip => {
      const skipDate = new Date(skip.date);
      return skipDate.getMonth() === currentMonth && skipDate.getFullYear() === currentYear;
    }) || [];

    // Sort skipped meals by date (newest first)
    const sortedSkippedMeals = (subscription.skippedMeals || []).sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );

    // Calculate total refund amount
    const totalRefund = sortedSkippedMeals.reduce((total, skip) => {
      // Calculate refund amount if not stored
      if (!skip.refundAmount && subscription.pricing) {
        const totalDays = moment(subscription.endDate).diff(moment(subscription.startDate), 'days') + 1;
        const dailyDeduction = subscription.pricing.finalAmount / totalDays;
        skip.refundAmount = Math.round(dailyDeduction * 100) / 100;
      }
      return total + (skip.refundAmount || 0);
    }, 0);

    res.json({
      success: true,
      data: {
        skippedMeals: sortedSkippedMeals,
        currentMonthSkips: currentMonthSkips,
        limits: {
          maxSkipMeals: maxSkipMeals,
          maxSkipDaysInAdvance: maxSkipDaysInAdvance,
          remainingSkips: maxSkipMeals - currentMonthSkips.length,
          usedSkips: currentMonthSkips.length
        },
        statistics: {
          totalSkips: sortedSkippedMeals.length,
          totalRefund: totalRefund,
          thisMonthSkips: currentMonthSkips.length,
          remainingSkips: Math.max(0, maxSkipMeals - currentMonthSkips.length)
        }
      }
    });

  } catch (error) {
    console.error('Get skip history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get skip history',
      error: error.message
    });

  }
};
// ============================================
// Export Functions
// ============================================
module.exports = {
  getSkipHistory,
  createSubscription,
  createSubscriptionFromOrder,
  processSubscriptionPayment,
  checkSubscriptionEligibility,
  getUserSubscriptions,
  getUserTodayMeal,
  getSubscriptionTodayMealForUser,
  updateUserTodayMeal,
  getSubscriptionBySubscriptionId,
  pauseSubscription,
  resumeSubscription,
  cancelSubscription,
  getSubscriptionDetails,
  skipMeal,
  customizeMeal,
  processCustomizationPayment,
  replaceThali,
  getUserCustomizations,
  createDailyOrdersForAllSubscriptions,
  cleanupInvalidCustomizations,
  cleanupOldFailedSubscriptions,
  cleanupAllPendingPaymentSubscriptions,
  triggerManualDeduction,
  testSubscriptionCreation,
  createTestSubscription,
  processDailyDeductions,
  updateSubscriptionWithCustomization,
  getActiveUsers
};