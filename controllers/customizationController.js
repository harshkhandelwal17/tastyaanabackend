const MealCustomization = require('../models/MealCustomization');
const Subscription = require('../models/Subscription');
const MealPlan = require('../models/MealPlan');
const ExtraItem = require('../models/ExtraItem');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Razorpay = require('razorpay');
const ReplaceableItems = require('../models/replaceableItems');
// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

/**
 * Helper function to validate payment states for customizations
 * @param {Object} customization - The customization object
 * @returns {Object} - Validation result with isValid and message
 */
const validateCustomizationPaymentState = (customization) => {
  const payableAmount = customization.totalpayablePrice || 0;
  const paymentStatus = customization.paymentStatus || 'pending';

  // Invalid state: payable amount ≤ 0 but payment is pending
  // This means no payment is needed but status shows pending - inconsistent state
  if (payableAmount <= 0 && paymentStatus === 'pending') {
    return {
      isValid: false,
      message: `Invalid payment state: payable amount is ₹${payableAmount.toFixed(2)} but payment status is '${paymentStatus}'. No payment needed but status is pending.`,
      code: 'INVALID_PAYMENT_STATE_ZERO_PENDING',
      payableAmount,
      paymentStatus
    };
  }

  // Valid states:
  // 1. payableAmount > 0 && paymentStatus === 'pending' (customer needs to pay - VALID)
  // 2. paymentStatus === 'completed' (regardless of amount - payment resolved)
  // 3. payableAmount ≤ 0 && paymentStatus === 'completed' (no payment needed and status is correct)
  return {
    isValid: true,
    message: 'Payment state is valid',
    payableAmount,
    paymentStatus
  };
};

/**
 * Helper function to find conflicting customizations for the same date/shift
 * @param {String} subscriptionId - Subscription ID
 * @param {Date} date - Target date
 * @param {String} shift - Target shift
 * @param {String} excludeCustomizationId - Customization ID to exclude from search
 * @returns {Array} - Array of conflicting customizations
 */
const findConflictingCustomizations = async (subscriptionId, date, shift, excludeCustomizationId = null) => {
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  const query = {
    subscription: subscriptionId,
    date: {
      $gte: targetDate,
      $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
    },
    shift: shift,
    paymentStatus: 'pending'
  };

  if (excludeCustomizationId) {
    query._id = { $ne: excludeCustomizationId };
  }

  return await MealCustomization.find(query);
};

/**
 * @desc    Create a new meal customization
 * @route   POST /api/customizations/create
 * @access  Private
 */
exports.createCustomization = async (req, res) => {
  try {

    console.log("creating.... the subscription ..")
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      subscriptionId,
      type,
      date,
      shift,
      dates,
      replacementMeal,
      dietaryPreference,
      spiceLevel,
      preferences,
      addons,
      extraItems,
      notes
    } = req.body;

    console.log("🔍 createCustomization - Request body:", JSON.stringify(req.body, null, 2));
    console.log("🔍 createCustomization - Extracted values:", {
      subscriptionId,
      type,
      date,
      dateType: typeof date,
      shift,
      shiftType: typeof shift,
      dates,
      datesType: typeof dates
    });
    console.log("dates forthe suctomization is : ", dates, "date is : ", date)
    // Verify subscription exists and belongs to user
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      user: req.user.id
    }).populate('mealPlan');

    if (!subscription) {
      console.log('Subscription not found')
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // VALIDATION 1: Check if subscription is active
    if (subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Only active subscriptions can be customized',
        code: 'SUBSCRIPTION_NOT_ACTIVE'
      });
    }

    // VALIDATION 2: Check if user's per-meal price is at least ₹60
    const basePricePerMeal = subscription.pricing?.basePricePerMeal || 0;
    // if (basePricePerMeal < 60) {
    //   return res.status(400).json({
    //     success: false,
    //     message: `Customization is only available for meal plans with per-meal price ≥ ₹60. Your current plan is ₹${basePricePerMeal.toFixed(2)}/meal.`,
    //     code: 'INSUFFICIENT_MEAL_PRICE',
    //     currentPrice: basePricePerMeal,
    //     requiredPrice: 60
    //   });
    // }

    // VALIDATION 3: Check if meal plan is selected
    if (!subscription.mealPlan) {
      return res.status(400).json({
        success: false,
        message: 'Please select a meal plan before customizing your meals',
        code: 'NO_MEAL_PLAN_SELECTED'
      });
    }

    // VALIDATION 4: Check if customization shift matches subscription's allowed shifts
    if (shift) {
      let allowedShifts = [];

      if (subscription.shift) {
        // Handle subscription shift values
        if (subscription.shift === 'both') {
          allowedShifts = ['morning', 'evening'];
        } else if (subscription.shift === 'morning' || subscription.shift === 'evening') {
          allowedShifts = [subscription.shift];
        } else {
          // Fallback for unknown shift values
          allowedShifts = ['morning', 'evening'];
        }
      } else if (subscription.deliveryTiming) {
        // Multiple shifts based on deliveryTiming
        if (subscription.deliveryTiming.morning?.enabled) {
          allowedShifts.push('morning');
        }
        if (subscription.deliveryTiming.evening?.enabled) {
          allowedShifts.push('evening');
        }
      } else {
        // Fallback to mealPlan shifts or default both
        allowedShifts = subscription.mealPlan?.shifts || ['morning', 'evening'];
      }

      if (!allowedShifts.includes(shift)) {
        return res.status(400).json({
          success: false,
          message: `Cannot customize ${shift} shift. Your subscription only supports: ${allowedShifts.join(', ')} shift(s).`,
          code: 'INVALID_SHIFT_FOR_SUBSCRIPTION',
          allowedShifts,
          requestedShift: shift
        });
      }
    }

    // VALIDATION 5: Check if dates array contains valid shifts for subscription
    if (dates && dates.length > 0) {
      let allowedShifts = [];

      if (subscription.shift) {
        // Handle subscription shift values
        if (subscription.shift === 'both') {
          allowedShifts = ['morning', 'evening'];
        } else if (subscription.shift === 'morning' || subscription.shift === 'evening') {
          allowedShifts = [subscription.shift];
        } else {
          // Fallback for unknown shift values
          allowedShifts = ['morning', 'evening'];
        }
      } else if (subscription.deliveryTiming) {
        if (subscription.deliveryTiming.morning?.enabled) {
          allowedShifts.push('morning');
        }
        if (subscription.deliveryTiming.evening?.enabled) {
          allowedShifts.push('evening');
        }
      } else {
        allowedShifts = subscription.mealPlan?.shifts || ['morning', 'evening'];
      }

      const invalidDates = dates.filter(dateObj =>
        dateObj.shift && !allowedShifts.includes(dateObj.shift)
      );

      if (invalidDates.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Some dates contain invalid shifts. Your subscription only supports: ${allowedShifts.join(', ')} shift(s).`,
          code: 'INVALID_SHIFTS_IN_DATES',
          allowedShifts,
          invalidDates: invalidDates.map(d => ({ date: d.date, shift: d.shift }))
        });
      }
    }

    // VALIDATION: Check if replacement is already done for the same date and shift
    if (replacementMeal && date && shift) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0); // Set to start of day for comparison

      // Check existing customizations for the same date and shift with the SAME replacement meal
      const existingCustomization = await MealCustomization.findOne({
        subscription: subscriptionId,
        date: {
          $gte: targetDate,
          $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000) // Next day
        },
        shift: shift,
        replacementMeal: replacementMeal, // Same replacement meal
        isActive: true,
        status: { $in: ['pending', 'confirmed'] } // Only active statuses
      });

      if (existingCustomization) {
        // Check if the existing customization has a valid payment state
        const existingValidation = validateCustomizationPaymentState(existingCustomization);

        console.log(`🔍 Found existing customization ${existingCustomization._id} with payment state:`, existingValidation);

        // RELAXED VALIDATION: Only block if the existing customization has COMPLETED payment
        // Allow multiple pending customizations regardless of amount
        if (existingCustomization.paymentStatus === 'completed') {
          return res.status(400).json({
            success: false,
            message: `This thali replacement (${replacementMeal}) is already scheduled and paid for ${shift} shift on ${targetDate.toDateString()}. Please choose a different meal.`,
            code: 'DUPLICATE_PAID_REPLACEMENT',
            existingCustomizationId: existingCustomization._id,
            existingPaymentState: {
              payableAmount: existingValidation.payableAmount,
              paymentStatus: existingValidation.paymentStatus,
              isValid: existingValidation.isValid
            }
          });
        } else {
          // Existing customization is pending - allow new customization
          console.log(`✅ Existing customization ${existingCustomization._id} is pending payment (${existingCustomization.paymentStatus}). Allowing new customization.`);
        }
      }

      // Check subscription's thaliReplacements array for the same date, shift, AND replacement meal
      if (subscription.thaliReplacements && subscription.thaliReplacements.length > 0) {
        const existingReplacement = subscription.thaliReplacements.find(rep => {
          if (!rep.date || !rep.replacementThali) return false;
          const repDate = new Date(rep.date);
          repDate.setHours(0, 0, 0, 0);
          return (
            repDate.getTime() === targetDate.getTime() &&
            rep.shift === shift &&
            rep.replacementThali.toString() === replacementMeal.toString()
          );
        });

        if (existingReplacement) {
          // For thaliReplacements, we need to check if there's a corresponding paid customization
          const correspondingCustomization = await MealCustomization.findOne({
            subscription: subscriptionId,
            date: {
              $gte: targetDate,
              $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
            },
            shift: shift,
            replacementMeal: replacementMeal,
            paymentStatus: 'completed'
          });

          // Only block if there's a paid customization corresponding to this thali replacement
          if (correspondingCustomization) {
            return res.status(400).json({
              success: false,
              message: `This thali replacement is already scheduled and paid for ${shift} shift on ${targetDate.toDateString()}. Please choose a different meal.`,
              code: 'DUPLICATE_PAID_THALI_REPLACEMENT',
              existingReplacement: {
                date: existingReplacement.date,
                shift: existingReplacement.shift,
                replacementThali: existingReplacement.replacementThali
              }
            });
          } else {
            console.log(`✅ Found thali replacement but no corresponding paid customization. Allowing new customization.`);
          }
        }
      }
    }

    // VALIDATION 6: Check time restrictions for customization
    if (date && shift) {
      const now = new Date();
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Cannot customize for past dates
      if (targetDate.getTime() < today.getTime()) {
        return res.status(400).json({
          success: false,
          message: 'Cannot customize meals for past dates',
          code: 'PAST_DATE_NOT_ALLOWED'
        });
      }

      // If customizing for today, check time restrictions
      if (targetDate.getTime() === today.getTime()) {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;

        if (shift === 'morning') {
          // Morning shift: must be before 11:59 AM (719 minutes)
          if (currentTime >= 719) {
            return res.status(400).json({
              success: false,
              message: 'Morning shift customization must be done before 11:59 AM for the same day',
              code: 'TIME_LIMIT_EXCEEDED',
              cutoffTime: '11:59 AM'
            });
          }
        } else if (shift === 'evening') {
          // Evening shift: must be before 7:00 PM (1140 minutes)
          if (currentTime >= 1140) {
            return res.status(400).json({
              success: false,
              message: 'Evening shift customization must be done before 7:00 PM for the same day',
              code: 'TIME_LIMIT_EXCEEDED',
              cutoffTime: '7:00 PM'
            });
          }
        }
      }

      // Cannot customize too far in advance (max 7 days ahead)
      const maxAdvanceDays = 7;
      const maxDate = new Date(today);
      maxDate.setDate(maxDate.getDate() + maxAdvanceDays);

      if (targetDate.getTime() > maxDate.getTime()) {
        return res.status(400).json({
          success: false,
          message: `Customization can only be done up to ${maxAdvanceDays} days in advance`,
          code: 'TOO_FAR_IN_ADVANCE',
          maxAdvanceDays
        });
      }
    }

    // VALIDATION: Check if meal is already skipped for the same date and shift
    if (date && shift) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      // Check if there's a skipped meal for the same date and shift
      if (subscription.skippedMeals && subscription.skippedMeals.length > 0) {
        const existingSkip = subscription.skippedMeals.find(skip => {
          if (!skip.date || !skip.shift) return false;
          const skipDate = new Date(skip.date);
          skipDate.setHours(0, 0, 0, 0);
          return skipDate.getTime() === targetDate.getTime() && skip.shift === shift;
        });

        if (existingSkip) {
          return res.status(400).json({
            success: false,
            message: `Cannot customize meal for ${shift} shift on ${targetDate.toDateString()}. This meal has already been skipped.`,
            code: 'MEAL_ALREADY_SKIPPED'
          });
        }
      }
    }

    // VALIDATION 5: Price difference warning for replacement meals
    if (replacementMeal) {
      const replacementMealDoc = await ReplaceableItems.findById(replacementMeal).lean();
      if (replacementMealDoc) {
        const basePrice = subscription.pricing?.basePricePerMeal || 75;
        const replacementPrice = replacementMealDoc.price || 0;

        // If replacement is significantly cheaper, warn user (unless explicitly confirmed)
        const priceDifference = basePrice - replacementPrice;
        if (priceDifference > 20 && !req.body.confirmPriceDifference) {
          return res.status(400).json({
            success: false,
            message: `The replacement meal (₹${replacementPrice}) is ₹${priceDifference.toFixed(2)} cheaper than your base meal (₹${basePrice}). You will not receive a refund for the price difference.`,
            code: 'PRICE_DIFFERENCE_WARNING',
            requireConfirmation: true,
            priceDifference: priceDifference,
            basePrice: basePrice,
            replacementPrice: replacementPrice
          });
        }

        // If replacement is more expensive, ensure user has sufficient balance or will pay extra
        if (replacementPrice > basePrice) {
          const extraAmount = replacementPrice - basePrice;
          // This will be handled in payment calculation, but inform user
          console.log(`User will pay extra ₹${extraAmount.toFixed(2)} for replacement meal`);
        }
      }
    }

    // VALIDATION 6: Check subscription date validity
    const targetDate = new Date(date);
    const subscriptionStart = new Date(subscription.startDate);
    const subscriptionEnd = new Date(subscription.endDate);

    // FIXED: Allow customization after end date as long as subscription is active (meal count based)
    if (targetDate < subscriptionStart) {
      return res.status(400).json({
        success: false,
        message: `Customization date must be after your subscription start date (${subscriptionStart.toDateString()})`,
        code: 'DATE_OUTSIDE_SUBSCRIPTION_PERIOD'
      });
    }

    // VALIDATION 7: Ensure shift is valid
    if (!['morning', 'evening'].includes(shift)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid shift. Must be either "morning" or "evening"',
        code: 'INVALID_SHIFT'
      });
    }

    // VALIDATION 8: Check delivery settings
    if (subscription.deliveryPreferences) {
      const deliveryDays = subscription.deliveryPreferences.deliveryDays || [];
      const targetDay = targetDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

      // Only validate if specific delivery days are configured
      if (deliveryDays.length > 0 && !deliveryDays.includes(targetDay)) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return res.status(400).json({
          success: false,
          message: `Delivery is not available on ${dayNames[targetDay]}s according to your delivery preferences`,
          code: 'DELIVERY_NOT_AVAILABLE'
        });
      }
    }

    // VALIDATION 9: Rate limiting - prevent too many customizations in short time
    const recentCustomizations = await MealCustomization.countDocuments({
      subscription: subscriptionId,
      createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) } // Last 5 minutes
    });

    if (recentCustomizations >= 5) {
      return res.status(429).json({
        success: false,
        message: 'Too many customization requests. Please wait a few minutes before trying again.',
        code: 'RATE_LIMIT_EXCEEDED'
      });
    }

    // VALIDATION 10: Validate addons and extra items limits
    if (addons && addons.length > 0) {
      // Limit maximum addons per meal
      if (addons.length > 10) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 10 addons allowed per meal customization',
          code: 'TOO_MANY_ADDONS'
        });
      }

      // Validate addon quantities
      for (const addon of addons) {
        if (addon.quantity && (addon.quantity < 1 || addon.quantity > 5)) {
          return res.status(400).json({
            success: false,
            message: 'Addon quantity must be between 1 and 5',
            code: 'INVALID_ADDON_QUANTITY'
          });
        }
      }
    }

    if (extraItems && extraItems.length > 0) {
      // Limit maximum extra items per meal
      if (extraItems.length > 5) {
        return res.status(400).json({
          success: false,
          message: 'Maximum 5 extra items allowed per meal customization',
          code: 'TOO_MANY_EXTRA_ITEMS'
        });
      }

      // Validate extra item quantities and total value
      let totalExtraItemValue = 0;
      for (const item of extraItems) {
        if (item.quantity && (item.quantity < 1 || item.quantity > 3)) {
          return res.status(400).json({
            success: false,
            message: 'Extra item quantity must be between 1 and 3',
            code: 'INVALID_EXTRA_ITEM_QUANTITY'
          });
        }
        totalExtraItemValue += (item.price * (item.quantity || 1));
      }

      // Limit total extra items value to prevent abuse
      if (totalExtraItemValue > 500) {
        return res.status(400).json({
          success: false,
          message: 'Total value of extra items cannot exceed ₹500 per meal',
          code: 'EXTRA_ITEMS_VALUE_EXCEEDED',
          maxValue: 500,
          currentValue: totalExtraItemValue
        });
      }
    }

    // Calculate pricing
    const basePrice = subscription.pricing?.basePricePerMeal || 75;
    const addonPrice = addons?.reduce((sum, addon) => sum + (addon.price * (addon.quantity || 1)), 0) || 0;

    // Calculate extra items price by fetching from database
    let extraItemPrice = 0;
    if (extraItems && extraItems.length > 0) {
      for (const extraItemData of extraItems) {
        const extraItemDoc = await ExtraItem.findById(extraItemData.item);
        if (extraItemDoc) {
          extraItemPrice += (extraItemDoc.price * (extraItemData.quantity || 1));
        }
      }
    }

    // Calculate replacement price if replacing thali
    let replacementPrice = 0;
    let totalPayablePrice = 0;

    if (replacementMeal) {
      // First check if the MealPlan exists at all
      console.log('Looking for MealPlan with ID:', replacementMeal.toString());

      // Get replacement meal price from the database or request
      const replacementMealDoc = await ReplaceableItems.findById(replacementMeal).lean();
      console.log('MealPlan found:', !!replacementMealDoc);

      if (!replacementMealDoc) {
        console.log('MealPlan not found, checking all MealPlans...');
        const allMealPlans = await MealPlan.find({}).select('_id title pricing').lean();
        console.log('Available MealPlans:', allMealPlans.map(mp => ({ id: mp._id.toString(), title: mp.title, hasPricing: !!mp.pricing })));
      }

      // Extract price from pricing array (use first pricing tier or find matching one)
      let replacementMealPrice = 0;
      if (replacementMealDoc?.price && replacementMealDoc.price > 0) {
        // Use the first pricing tier for now, or you can add logic to match specific tier
        replacementMealPrice = replacementMealDoc?.price || 0;
        console.log('Pricing array found:', replacementMealDoc.price);
      } else if (replacementMealDoc) {
        console.log('MealPlan found but no pricing array:', replacementMealDoc);
      }

      // Debug logging
      console.log('Pricing Debug: ', {
        basePrice,
        replacementMealPrice,
        addonPrice,
        extraItemPrice,
        extraItemsCount: extraItems?.length || 0,
        replacementMeal: replacementMeal.toString(),
        replacementMealDoc: replacementMealDoc
      });

      // Calculate replacement price difference (replacementMealPrice - basePrice)
      // If replacement is cheaper, customer gets credit (negative value)
      // If replacement is more expensive, customer pays difference (positive value)
      replacementPrice = replacementMealPrice - basePrice;

      // Total payable is addons + extra items + replacement price difference
      totalPayablePrice = addonPrice + extraItemPrice + replacementPrice;

      console.log('Final Calculation:', {
        replacementPrice,
        totalPayablePrice,
        calculation: `${addonPrice} + ${extraItemPrice} + ${replacementPrice} = ${totalPayablePrice}`
      });
    } else {
      // If not replacing, full base price + addons + extra items
      totalPayablePrice = basePrice + addonPrice + extraItemPrice;
    }

    // VALIDATION: Payment and amount validation for same-day customizations
    if (date && shift) {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if this is for today
      if (targetDate.getTime() === today.getTime()) {
        // Check for existing pending customizations for the same date and shift
        const existingCustomizations = await findConflictingCustomizations(
          subscriptionId,
          targetDate,
          shift
        );

        if (existingCustomizations && existingCustomizations.length > 0) {
          for (const existingCustomization of existingCustomizations) {
            const validation = validateCustomizationPaymentState(existingCustomization);

            console.log(`🔍 Payment validation for existing customization ${existingCustomization._id}:`, validation);

            // RESTRICT: If existing customization has invalid payment state
            if (!validation.isValid) {
              console.log(`❌ Blocking new customization due to invalid existing payment state`);
              return res.status(400).json({
                success: false,
                message: `Cannot customize for this time slot. ${validation.message}`,
                code: validation.code,
                existingCustomization: {
                  id: existingCustomization._id,
                  payableAmount: validation.payableAmount,
                  paymentStatus: validation.paymentStatus,
                  createdAt: existingCustomization.createdAt
                }
              });
            }

            // ALLOW: If existing customization has valid payment state
            console.log(`✅ Existing pending customization found with valid payment state. Allowing new customization.`);
          }
        }

        // Additional validation: Don't allow creating customization with invalid payment state
        const currentCustomizationValidation = validateCustomizationPaymentState({
          totalpayablePrice: totalPayablePrice,
          paymentStatus: totalPayablePrice <= 0 ? 'paid' : 'pending' // Set status based on amount
        });

        console.log(`🔍 Payment validation for new customization:`, currentCustomizationValidation);

        if (!currentCustomizationValidation.isValid) {
          console.log(`❌ Blocking new customization due to invalid payment state`);
          return res.status(400).json({
            success: false,
            message: `Cannot create customization. ${currentCustomizationValidation.message}`,
            code: currentCustomizationValidation.code,
            breakdown: {
              basePrice,
              addonPrice,
              extraItemPrice,
              replacementPrice,
              totalPayablePrice
            }
          });
        }

        console.log(`✅ New customization has valid payment state, proceeding...`);
      }
    }

    // VALIDATION ONLY CHECK
    if (req.body.validateOnly) {
      return res.status(200).json({
        success: true,
        message: 'Validation successful',
        validationPassed: true
      });
    }

    // Create customization
    const customization = new MealCustomization({
      user: req.user.id,
      subscription: subscriptionId,
      type,
      date: date ? new Date(date) : null,
      shift,
      dates: dates?.map(d => ({
        date: new Date(d.date),
        shift: d.shift
      })),
      baseMeal: subscription.defaultMeal,
      replacementMeal,
      dietaryPreference: dietaryPreference || 'vegetarian',
      spiceLevel: spiceLevel || 'medium',
      preferences: preferences || {},
      addons: addons || [],
      extraItems: extraItems || [],
      basePrice,
      addonPrice,
      extraItemPrice,
      replacementPrice,
      totalPrice: basePrice + addonPrice + extraItemPrice, // Total before any replacements
      totalpayablePrice: totalPayablePrice, // Final amount to be paid after replacement adjustments
      paymentStatus: totalPayablePrice <= 0 ? 'paid' : 'pending', // Auto-complete if no payment needed
      notes,
      createdBy: req.user.id,
      updatedBy: req.user.id
    });

    await customization.save();

    // Debug: Log the date being passed
    const dateToPass = date || dates?.[0]?.date;
    const shiftToPass = shift || dates?.[0]?.shift;

    console.log('Debug - Date being passed to addCustomization:', {
      date: dateToPass,
      dateType: typeof dateToPass,
      shift: shiftToPass,
      shiftType: typeof shiftToPass
    });

    // Validate date format
    if (dateToPass) {
      const parsedDate = new Date(dateToPass);
      if (isNaN(parsedDate.getTime())) {
        throw new Error(`Invalid date format: ${dateToPass}`);
      }
      console.log('Debug - Parsed date:', parsedDate);
    }

    // Add to subscription's customization tracking (this should NOT trigger save)
    try {
      await subscription.addCustomization({
        date: dateToPass ? new Date(dateToPass) : null,
        shift: shiftToPass,
        type,
        customizationId: customization.customizationId
      });
    } catch (addCustomizationError) {
      console.error('⚠️ Error adding customization to subscription:', addCustomizationError);
      // This error is not critical - the customization was already created successfully
      // We can continue without this tracking
    }

    // If this is a thali replacement, also update the subscription's thaliReplacements array
    if (replacementMeal && dateToPass) {
      try {
        // Get the replacement meal details for better tracking
        const replacementMealDoc = await ReplaceableItems.findById(replacementMeal).lean();

        // Create replacement details object
        const replacementDetails = {
          originalMealPlan: subscription.defaultMeal,
          replacementThali: replacementMeal,
          priceDifference: replacementPrice,
          replacedAt: new Date(),
          isDefault: false,
          customizationType: type || 'one-time',
          addOns: addons || [],
          addOnsTotal: addonPrice,
          customizationId: customization._id,
          date: dateToPass ? new Date(dateToPass) : null,
          shift: shiftToPass
        };

        // Update the subscription using findOneAndUpdate to avoid validation issues with existing data
        const updateResult = await Subscription.findOneAndUpdate(
          { _id: subscription._id },
          {
            $push: { thaliReplacements: replacementDetails },
            ...(type === 'permanent' && {
              $set: {
                thaliReplacement: {
                  originalMealPlan: subscription.defaultMeal,
                  replacementThali: replacementMeal,
                  priceDifference: replacementPrice,
                  appliedAt: new Date(),
                  isDefault: true
                }
              }
            })
          },
          { new: true, runValidators: false, strict: false } // Skip validation and allow non-schema fields
        );

        if (!updateResult) {
          throw new Error('Failed to update subscription with thali replacement');
        }

        console.log('✅ Thali replacement added to subscription:', {
          subscriptionId: subscription._id,
          replacementDetails,
          totalReplacements: subscription.thaliReplacements.length
        });
      } catch (replacementError) {
        console.error('⚠️ Error updating subscription thaliReplacements:', replacementError);
        // Don't fail the entire request, just log the error
      }
    }

    res.status(201).json({
      success: true,
      data: customization
    });
  } catch (err) {
    console.error('❌ Error in createCustomization:', err);

    // Add specific debugging for validation errors
    if (err.name === 'ValidationError') {
      console.error('🔍 Validation Error Details:', {
        message: err.message,
        errors: err.errors ? Object.keys(err.errors) : 'No specific errors',
        fullError: err
      });
    }

    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Create Razorpay order for customization payment
 * @route   POST /api/customizations/:id/payment
 * @access  Private
 */
exports.createCustomizationPayment = async (req, res) => {
  try {
    const { id } = req.params;

    // Find customization
    const customization = await MealCustomization.findOne({
      _id: id,
      user: req.user.id
    });

    if (!customization) {
      return res.status(404).json({
        success: false,
        message: 'Customization not found'
      });
    }

    if (customization.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Customization is already paid for'
      });
    }

    // Check if payment is required
    if (customization.totalpayablePrice <= 0) {
      // No payment required - mark as paid automatically
      customization.paymentStatus = 'paid';
      customization.razorpayOrderId = 'NO_PAYMENT_REQUIRED';
      customization.razorpayPaymentId = 'AUTO_APPROVED';
      await customization.save();

      return res.json({
        success: true,
        message: 'No payment required - customization approved automatically',
        data: {
          customizationId: customization._id,
          amount: 0,
          paymentStatus: 'paid',
          autoApproved: true
        }
      });
    }

    // Create Razorpay order using totalpayablePrice which includes replacement adjustments
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(customization.totalpayablePrice * 100), // Convert to paise
      currency: 'INR',
      receipt: `C${customization.customizationId.slice(-8)}${Date.now().toString().slice(-8)}`,
      notes: {
        customizationId: customization._id.toString(),
        subscriptionId: customization.subscription.toString(),
        userId: req.user.id.toString(),
        type: 'customization_payment'
      }
    });

    // Update customization with Razorpay order ID
    customization.razorpayOrderId = razorpayOrder.id;
    await customization.save();

    // Debug logging
    console.log('Razorpay Key ID:', process.env.RAZORPAY_KEY_ID);
    console.log('Payment response data:', {
      customizationId: customization._id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      orderId: razorpayOrder.id,
      key: process.env.RAZORPAY_KEY_ID
    });

    res.json({
      success: true,
      message: 'Payment order created successfully',
      data: {
        customizationId: customization._id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        orderId: razorpayOrder.id,
        key: process.env.RAZORPAY_KEY_ID
      }
    });

  } catch (error) {
    console.error('Error creating customization payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
};

/**
 * @desc    Verify customization payment
 * @route   POST /api/customizations/:id/verify-payment
 * @access  Private
 */
exports.verifyCustomizationPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

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

    // Find customization
    const customization = await MealCustomization.findOne({
      _id: id,
      user: req.user.id
    });

    if (!customization) {
      return res.status(404).json({
        success: false,
        message: 'Customization not found'
      });
    }

    // Update payment status
    customization.paymentStatus = 'paid';
    customization.razorpayPaymentId = razorpay_payment_id;
    await customization.save();

    res.json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        customizationId: customization._id,
        paymentStatus: customization.paymentStatus
      }
    });

  } catch (error) {
    console.error('Error verifying customization payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: error.message
    });
  }
};

/**
 * @desc    Get customizations for a subscription
 * @route   GET /api/subscriptions/:subscriptionId/customizations
 * @access  Private
 */
exports.getSubscriptionCustomizations = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const customizations = await MealCustomization.find({
      subscription: subscriptionId,
      user: req.user.id,
      isActive: true
    }).populate('replacementMeal', 'name title description price') // Populate replacement meal details
      .populate('baseMeal', 'name title description price');

    res.json({
      success: true,
      data: customizations
    });
  } catch (error) {
    console.error('Error fetching customizations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customizations',
      error: error.message
    });
  }
};

/**
 * @desc    Get customizations for a specific date range
 * @route   GET /api/customizations/calendar
 * @access  Private
 */
exports.getCalendarCustomizations = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        error: 'Start date and end date are required'
      });
    }

    // Find all active subscriptions for the user
    const subscriptions = await Subscription.find({
      user: req.user.id,
      status: 'active',
      isActive: true
    });

    if (subscriptions.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }

    const subscriptionIds = subscriptions.map(sub => sub._id);

    // Find customizations for these subscriptions in the date range
    const customizations = await MealCustomization.find({
      subscription: { $in: subscriptionIds },
      isActive: true,
      $or: [
        // One-time customizations in date range
        {
          date: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        },
        // Date-range customizations that overlap with the requested range
        {
          'dates.date': {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        },
        // Permanent customizations that are active during the range
        {
          type: 'permanent',
          $or: [
            { startsAt: { $lte: new Date(endDate) } },
            { startsAt: { $exists: false } }
          ],
          $or: [
            { endsAt: { $gte: new Date(startDate) } },
            { endsAt: { $exists: false } }
          ]
        }
      ]
    })
      .populate('baseMeal replacementMeal', 'name description price image')
      .populate('subscription', 'name')
      .sort({ date: 1, 'dates.date': 1 });

    // Format for fullCalendar
    const events = [];

    customizations.forEach(customization => {
      if (customization.date) {
        // One-time customization
        events.push({
          id: customization._id,
          title: customization.replacementMeal?.name || 'Custom Meal',
          start: new Date(customization.date).toISOString(),
          allDay: true,
          extendedProps: {
            type: 'one-time',
            shift: customization.shift,
            customization: customization.toObject()
          }
        });
      } else if (customization.dates && customization.dates.length > 0) {
        // Date-range customizations
        customization.dates.forEach(dateItem => {
          events.push({
            id: `${customization._id}_${dateItem.date.toISOString()}`,
            title: customization.replacementMeal?.name || 'Custom Meal',
            start: new Date(dateItem.date).toISOString(),
            allDay: true,
            extendedProps: {
              type: 'date-range',
              shift: dateItem.shift,
              customization: customization.toObject()
            }
          });
        });
      } else if (customization.type === 'permanent') {
        // Permanent customizations - create events for each day in the range
        const start = new Date(Math.max(
          new Date(startDate),
          customization.startsAt ? new Date(customization.startsAt) : new Date(0)
        ));

        const end = new Date(Math.min(
          new Date(endDate),
          customization.endsAt ? new Date(customization.endsAt) : new Date(8640000000000000)
        ));

        // Add events for each day in range
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          events.push({
            id: `${customization._id}_${d.toISOString()}`,
            title: customization.replacementMeal?.name || 'Custom Meal',
            start: new Date(d).toISOString(),
            allDay: true,
            extendedProps: {
              type: 'permanent',
              shift: customization.shift,
              customization: customization.toObject()
            },
            backgroundColor: '#4caf50',
            borderColor: '#4caf50'
          });
        }
      }
    });

    res.json({
      success: true,
      data: events
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Update a customization
 * @route   PUT /api/customizations/:id
 * @access  Private
 */
exports.updateCustomization = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const {
      status,
      reasonForRejection,
      ...updateData
    } = req.body;

    // Find customization
    const customization = await MealCustomization.findOne({
      _id: id,
      user: req.user.id
    });

    if (!customization) {
      return res.status(404).json({ msg: 'Customization not found' });
    }

    // Only allow certain fields to be updated
    const allowedUpdates = [
      'dietaryPreference',
      'spiceLevel',
      'preferences',
      'addons',
      'extraItems',
      'notes',
      'status',
      'reasonForRejection',
      'type',
      'setAsDefault'
    ];

    // Update fields
    Object.keys(updateData).forEach(key => {
      if (allowedUpdates.includes(key)) {
        customization[key] = updateData[key];
      }
    });

    // VALIDATION: Check time restrictions for updates (same as creation)
    if (customization.date && customization.shift) {
      const now = new Date();
      const targetDate = new Date(customization.date);
      targetDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // If updating for today, check time restrictions
      if (targetDate.getTime() === today.getTime()) {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTime = currentHour * 60 + currentMinute;

        if (customization.shift === 'morning') {
          // Morning shift: must be before 11:59 AM (719 minutes)
          if (currentTime >= 719) {
            return res.status(400).json({
              success: false,
              message: 'Morning shift customization cannot be updated after 11:59 AM for the same day'
            });
          }
        } else if (customization.shift === 'evening') {
          // Evening shift: must be updated before 7:00 PM (1140 minutes)
          if (currentTime >= 1140) {
            return res.status(400).json({
              success: false,
              message: 'Evening shift customization cannot be updated after 7:00 PM for the same day'
            });
          }
        }
      }
    }

    // VALIDATION: Check if meal is already skipped for the same date and shift
    if (customization.date && customization.shift) {
      const targetDate = new Date(customization.date);
      targetDate.setHours(0, 0, 0, 0);

      // Get the subscription to check skipped meals
      const subscription = await Subscription.findById(customization.subscription);
      if (subscription && subscription.skippedMeals && subscription.skippedMeals.length > 0) {
        const existingSkip = subscription.skippedMeals.find(skip => {
          if (!skip.date || !skip.shift) return false;
          const skipDate = new Date(skip.date);
          skipDate.setHours(0, 0, 0, 0);
          return skipDate.getTime() === targetDate.getTime() && skip.shift === customization.shift;
        });

        if (existingSkip) {
          return res.status(400).json({
            success: false,
            message: `Cannot update customization for ${customization.shift} shift on ${targetDate.toDateString()}. This meal has already been skipped.`,
            code: 'MEAL_ALREADY_SKIPPED'
          });
        }
      }
    }

    // Handle status update
    if (status && ['confirmed', 'rejected', 'cancelled'].includes(status)) {
      customization.status = status;

      if (status === 'rejected' && reasonForRejection) {
        customization.reasonForRejection = reasonForRejection;
      }
    }

    // Recalculate pricing if needed
    if (updateData.addons || updateData.extraItems) {
      const addonPrice = (customization.addons || []).reduce(
        (sum, addon) => sum + (addon.price * (addon.quantity || 1)), 0
      );
      const extraItemPrice = (customization.extraItems || []).reduce(
        (sum, item) => sum + (item.price * (item.quantity || 1)), 0
      );

      customization.addonPrice = addonPrice;
      customization.extraItemPrice = extraItemPrice;
      customization.totalPrice = customization.basePrice + addonPrice + extraItemPrice;

      // Update total payable price as well
      customization.totalpayablePrice = customization.totalPrice + (customization.replacementPrice || 0);
    }

    // VALIDATION: Payment validation for same-day updates
    if (customization.date && customization.shift) {
      const targetDate = new Date(customization.date);
      targetDate.setHours(0, 0, 0, 0);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if this is for today
      if (targetDate.getTime() === today.getTime()) {
        // Validate current customization's payment state after potential updates
        const currentValidation = validateCustomizationPaymentState(customization);

        if (!currentValidation.isValid) {
          return res.status(400).json({
            success: false,
            message: `Cannot update customization. ${currentValidation.message}`,
            code: currentValidation.code,
            currentPayableAmount: currentValidation.payableAmount,
            paymentStatus: currentValidation.paymentStatus
          });
        }

        // Check for other conflicting customizations for the same time slot
        const conflictingCustomizations = await findConflictingCustomizations(
          customization.subscription,
          targetDate,
          customization.shift,
          customization._id
        );

        if (conflictingCustomizations && conflictingCustomizations.length > 0) {
          for (const conflicting of conflictingCustomizations) {
            const conflictingValidation = validateCustomizationPaymentState(conflicting);

            // RESTRICT: If other customization has invalid payment state
            if (!conflictingValidation.isValid) {
              return res.status(400).json({
                success: false,
                message: `Cannot update customization for this time slot. ${conflictingValidation.message}`,
                code: 'CONFLICTING_INVALID_PAYMENT_STATE',
                conflictingCustomization: {
                  id: conflicting._id,
                  payableAmount: conflictingValidation.payableAmount,
                  paymentStatus: conflictingValidation.paymentStatus
                }
              });
            }
          }
        }
      }
    }

    customization.updatedBy = req.user.id;
    await customization.save();

    // If this was a permanent customization, update the subscription
    if (customization.type === 'permanent' && customization.status === 'confirmed') {
      const subscription = await Subscription.findById(customization.subscription);
      if (subscription) {
        await subscription.addCustomization(customization);
      }
    }

    // If this customization involves a thali replacement, update the subscription's thaliReplacements
    if (customization.replacementMeal && customization.status === 'confirmed') {
      try {
        const subscription = await Subscription.findById(customization.subscription);
        if (subscription) {
          // Check if this replacement is already in the thaliReplacements array
          const existingReplacementIndex = subscription.thaliReplacements?.findIndex(
            rep => rep.customizationId?.toString() === customization._id.toString()
          );

          if (existingReplacementIndex === -1 || existingReplacementIndex === undefined) {
            // Add new replacement if it doesn't exist
            const replacementDetails = {
              originalMealPlan: customization.baseMeal,
              replacementThali: customization.replacementMeal,
              priceDifference: customization.replacementPrice || 0,
              replacedAt: new Date(),
              isDefault: false,
              customizationType: customization.type || 'one-time',
              addOns: customization.addons || [],
              addOnsTotal: customization.addonPrice || 0,
              customizationId: customization._id,
              date: customization.date,
              shift: customization.shift
            };

            // Update the subscription using findOneAndUpdate to avoid validation issues
            await Subscription.findOneAndUpdate(
              { _id: subscription._id },
              {
                $push: { thaliReplacements: replacementDetails },
                ...(customization.type === 'permanent' && {
                  $set: {
                    thaliReplacement: {
                      originalMealPlan: customization.baseMeal,
                      replacementThali: customization.replacementMeal,
                      priceDifference: customization.replacementPrice || 0,
                      appliedAt: new Date(),
                      isDefault: true
                    }
                  }
                })
              },
              { new: true, runValidators: false } // Skip validation to avoid issues with existing checkpoints
            );

            console.log('✅ Thali replacement updated in subscription:', {
              subscriptionId: subscription._id,
              replacementDetails,
              totalReplacements: subscription.thaliReplacements.length
            });
          }
        }
      } catch (replacementError) {
        console.error('⚠️ Error updating subscription thaliReplacements during update:', replacementError);
        // Don't fail the entire request, just log the error
      }
    }

    // TODO: Update any affected daily orders

    res.json({
      success: true,
      data: customization
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Delete a customization
 * @route   DELETE /api/customizations/:id
 * @access  Private
 */
exports.deleteCustomization = async (req, res) => {
  try {
    const { id } = req.params;

    // Find customization
    const customization = await MealCustomization.findOne({
      _id: id,
      user: req.user.id
    });

    if (!customization) {
      return res.status(404).json({ msg: 'Customization not found' });
    }

    // Mark as inactive instead of deleting
    customization.isActive = false;
    customization.updatedBy = req.user.id;
    await customization.save();

    // Remove from subscription if it was a permanent customization
    if (customization.type === 'permanent') {
      const subscription = await Subscription.findById(customization.subscription);
      if (subscription) {
        await subscription.removeCustomization(customization._id);
      }
    }

    // TODO: Update any affected daily orders

    res.json({
      success: true,
      data: {}
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      error: 'Server error'
    });
  }
};

/**
 * @desc    Get user's customization history with replacement details
 * @route   GET /api/customizations/history
 * @access  Private
 */
exports.getUserCustomizationHistory = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, paymentStatus } = req.query;

    // Build query
    const query = {
      user: req.user.id,
      isActive: true
    };

    if (status) {
      query.status = status;
    }

    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Get customizations with populated data
    const customizations = await MealCustomization.find(query)
      .populate('baseMeal', 'name description price image')
      .populate('replacementMeal', 'name description price image')
      .populate('subscription', 'subscriptionId name')
      .populate('addons.item', 'name price')
      .populate('extraItems.item', 'name price')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    // Get total count
    const total = await MealCustomization.countDocuments(query);

    // Format response with detailed replacement information
    const formattedCustomizations = customizations.map(customization => ({
      id: customization._id,
      customizationId: customization.customizationId,
      type: customization.type,
      date: customization.date,
      shift: customization.shift,
      dates: customization.dates,

      // Meal replacement details
      originalMeal: {
        id: customization.baseMeal?._id,
        name: customization.baseMeal?.name,
        price: customization.basePrice
      },
      replacementMeal: customization.replacementMeal ? {
        id: customization.replacementMeal._id,
        name: customization.replacementMeal.name,
        description: customization.replacementMeal.description,
        price: customization.replacementMeal.price,
        image: customization.replacementMeal.image
      } : null,

      // Pricing breakdown
      pricing: {
        basePrice: customization.basePrice,
        replacementPrice: customization.replacementPrice,
        addonPrice: customization.addonPrice,
        extraItemPrice: customization.extraItemPrice,
        totalPrice: customization.totalPrice,
        totalPayablePrice: customization.totalpayablePrice,
        priceDifference: customization.replacementMeal ?
          (customization.replacementMeal.price - customization.basePrice) : 0
      },

      // Add-ons and extras
      addons: customization.addons,
      extraItems: customization.extraItems,

      // Payment information
      payment: {
        status: customization.paymentStatus,
        razorpayOrderId: customization.razorpayOrderId,
        razorpayPaymentId: customization.razorpayPaymentId,
        amountPaid: customization.paymentStatus === 'paid' ? customization.totalpayablePrice : 0
      },

      // Status and metadata
      status: customization.status,
      subscription: customization.subscription,
      preferences: customization.preferences,
      notes: customization.notes,
      createdAt: customization.createdAt,
      updatedAt: customization.updatedAt
    }));

    res.json({
      success: true,
      data: {
        customizations: formattedCustomizations,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching customization history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch customization history',
      error: error.message
    });
  }
};

/**
 * @desc    Sync existing customizations with subscription's thaliReplacements
 * @route   POST /api/customizations/sync-thali-replacements
 * @access  Private
 */
exports.syncThaliReplacements = async (req, res) => {
  try {
    const { subscriptionId } = req.body;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'Subscription ID is required'
      });
    }

    // Find the subscription
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

    // Find all customizations for this subscription that have replacement meals
    const customizations = await MealCustomization.find({
      subscription: subscriptionId,
      replacementMeal: { $exists: true, $ne: null },
      isActive: true
    });

    let syncedCount = 0;
    let errors = [];

    // Initialize thaliReplacements array if it doesn't exist
    if (!subscription.thaliReplacements) {
      subscription.thaliReplacements = [];
    }

    for (const customization of customizations) {
      try {
        // Check if this replacement is already in the thaliReplacements array
        const existingReplacementIndex = subscription.thaliReplacements.findIndex(
          rep => rep.customizationId?.toString() === customization._id.toString()
        );

        if (existingReplacementIndex === -1) {
          // Add new replacement
          const replacementDetails = {
            originalMealPlan: customization.baseMeal,
            replacementThali: customization.replacementMeal,
            priceDifference: customization.replacementPrice || 0,
            replacedAt: customization.createdAt || new Date(),
            isDefault: false,
            customizationType: customization.type || 'one-time',
            addOns: customization.addons || [],
            addOnsTotal: customization.addonPrice || 0,
            customizationId: customization._id,
            date: customization.date,
            shift: customization.shift
          };

          subscription.thaliReplacements.push(replacementDetails);
          syncedCount++;

          // If this is a permanent customization, also update the default thaliReplacement
          if (customization.type === 'permanent') {
            subscription.thaliReplacement = {
              originalMealPlan: customization.baseMeal,
              replacementThali: customization.replacementMeal,
              priceDifference: customization.replacementPrice || 0,
              appliedAt: customization.createdAt || new Date(),
              isDefault: true
            };
          }
        }
      } catch (error) {
        errors.push(`Customization ${customization._id}: ${error.message}`);
      }
    }

    // Save the updated subscription using findOneAndUpdate to avoid validation issues
    if (syncedCount > 0) {
      await Subscription.findOneAndUpdate(
        { _id: subscription._id },
        {
          $set: {
            thaliReplacements: subscription.thaliReplacements,
            ...(subscription.thaliReplacement && { thaliReplacement: subscription.thaliReplacement })
          }
        },
        { new: true, runValidators: false } // Skip validation to avoid issues with existing checkpoints
      );
    }

    res.json({
      success: true,
      message: `Synced ${syncedCount} thali replacements`,
      data: {
        subscriptionId: subscription._id,
        syncedCount,
        totalReplacements: subscription.thaliReplacements.length,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('Error syncing thali replacements:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync thali replacements',
      error: error.message
    });
  }
};

/**
 * @desc    Check for invalid payment states in customizations
 * @route   GET /api/customizations/check-payment-states
 * @access  Private
 */
exports.checkInvalidPaymentStates = async (req, res) => {
  try {
    const { subscriptionId } = req.query;

    const query = {
      paymentStatus: 'pending'
    };

    // If subscriptionId is provided, filter by it
    if (subscriptionId) {
      query.subscription = subscriptionId;

      // Verify subscription belongs to user
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
    } else {
      // If no specific subscription, only check user's customizations
      const userSubscriptions = await Subscription.find({ user: req.user.id }).select('_id');
      query.subscription = { $in: userSubscriptions.map(s => s._id) };
    }

    const pendingCustomizations = await MealCustomization.find(query)
      .populate('subscription', 'subscriptionId planType')
      .sort({ createdAt: -1 });

    const invalidStates = [];
    const validStates = [];

    for (const customization of pendingCustomizations) {
      const validation = validateCustomizationPaymentState(customization);

      if (!validation.isValid) {
        invalidStates.push({
          customizationId: customization._id,
          subscriptionId: customization.subscription._id,
          subscriptionCode: customization.subscription.subscriptionId,
          date: customization.date,
          shift: customization.shift,
          payableAmount: validation.payableAmount,
          paymentStatus: validation.paymentStatus,
          message: validation.message,
          createdAt: customization.createdAt
        });
      } else {
        validStates.push({
          customizationId: customization._id,
          payableAmount: validation.payableAmount,
          paymentStatus: validation.paymentStatus
        });
      }
    }

    res.json({
      success: true,
      data: {
        summary: {
          totalPending: pendingCustomizations.length,
          invalidStates: invalidStates.length,
          validStates: validStates.length
        },
        invalidStates: invalidStates,
        validStatesCount: validStates.length
      }
    });
  } catch (error) {
    console.error('Error checking payment states:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * @desc    Clean up invalid payment state customizations
 * @route   POST /api/customizations/cleanup-invalid-payments
 * @access  Private
 */
exports.cleanupInvalidPaymentStates = async (req, res) => {
  try {
    const { subscriptionId, dryRun = true } = req.body;

    const query = {
      paymentStatus: 'pending'
    };

    // If subscriptionId is provided, filter by it
    if (subscriptionId) {
      query.subscription = subscriptionId;

      // Verify subscription belongs to user
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
    } else {
      // If no specific subscription, only check user's customizations
      const userSubscriptions = await Subscription.find({ user: req.user.id }).select('_id');
      query.subscription = { $in: userSubscriptions.map(s => s._id) };
    }

    const pendingCustomizations = await MealCustomization.find(query)
      .populate('subscription', 'subscriptionId planType')
      .sort({ createdAt: -1 });

    const invalidCustomizations = [];
    const actions = [];

    for (const customization of pendingCustomizations) {
      const validation = validateCustomizationPaymentState(customization);

      if (!validation.isValid) {
        invalidCustomizations.push({
          customizationId: customization._id,
          subscriptionId: customization.subscription._id,
          date: customization.date,
          shift: customization.shift,
          payableAmount: validation.payableAmount,
          paymentStatus: validation.paymentStatus,
          message: validation.message,
          createdAt: customization.createdAt
        });

        // If not dry run, update the payment status to 'completed' for zero-amount customizations
        if (!dryRun && validation.payableAmount <= 0) {
          await MealCustomization.findByIdAndUpdate(
            customization._id,
            {
              paymentStatus: 'completed',
              paymentCompletedAt: new Date(),
              notes: `${customization.notes || ''} [Auto-resolved: Zero-amount customization payment status updated]`.trim()
            },
            { runValidators: false }
          );

          actions.push({
            customizationId: customization._id,
            action: 'updated_payment_status_to_completed',
            reason: 'Zero or negative payable amount with pending status'
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        summary: {
          totalPending: pendingCustomizations.length,
          invalidStates: invalidCustomizations.length,
          actionsPerformed: actions.length,
          dryRun
        },
        invalidCustomizations,
        actions: dryRun ? [] : actions,
        message: dryRun
          ? 'Dry run completed. Set dryRun: false to perform actual cleanup.'
          : `Cleanup completed. ${actions.length} customizations updated.`
      }
    });
  } catch (error) {
    console.error('Error cleaning up payment states:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
