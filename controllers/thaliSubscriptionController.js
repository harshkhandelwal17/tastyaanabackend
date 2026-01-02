const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const MealPlan = require('../models/MealPlan');
const User = require('../models/User');
const WalletTransaction = require('../models/WalletTransaction');
const Razorpay = require('razorpay');
const moment = require('moment-timezone');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Constants
const BASE_PRICE_PER_THALI = 75; // Base price per thali
const TOTAL_THALIS = 56; // Total thalis in the plan
const DAYS_IN_WEEK = 7;
const MEALS_PER_DAY = 2; // Morning and evening
const SUNDAY_MEALS = 1; // Only lunch on Sunday

/**
 * Create a new 56-thali subscription
 */
const createThaliSubscription = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      mealPlanId,
      startDate,
      startShift, // 'morning' or 'evening' or 'both'
      deliveryAddress,
      selectedAddOns = [],
      customizations = [],
      dietaryPreference = 'veg',
      autoRenewal = false,
      deliverySettings, // Now contains deliveryPreferences
      packaging,
      pricing,
      duration,
      mealCounts
    } = req.body;

    const userId = req.user.id;

    // Check for existing active subscription
    // (Optional: You might want to allow concurrent subscriptions if they are different plans, but keeping safety check for now)
    const existingSubscription = await Subscription.findOne({
      user: userId,
      status: { $in: ['active', 'pending'] },
      'mealCounts.mealsRemaining': { $gt: 0 }
    });

    if (existingSubscription) {
      // Allow if it's a different plan or explicit override? For now strict check.
      // Commenting out strict check if user wants to buy multiple? 
      // Returning error for now as per original code.
      return res.status(400).json({
        success: false,
        message: 'You already have an active subscription',
        data: {
          existingSubscription: {
            id: existingSubscription._id,
            status: existingSubscription.status,
            mealsRemaining: existingSubscription.mealCounts.mealsRemaining
          }
        }
      });
    }

    // Validate meal plan
    const mealPlan = await MealPlan.findById(mealPlanId);
    if (!mealPlan) {
      return res.status(404).json({
        success: false,
        message: 'Meal plan not found'
      });
    }

    // Parse start date
    const startDateObj = moment.tz(startDate, 'Asia/Kolkata').startOf('day');
    const today = moment().tz('Asia/Kolkata').startOf('day');

    // If start date is in the past, set to today
    if (startDateObj.isBefore(today)) {
      startDateObj.set(today);
    }

    // Calculate delivery schedule - Dynamic Logic
    const mealsPerDay = pricing?.mealsPerDay || (startShift === 'both' ? 2 : 1);
    const totalMealsToDeliver = mealCounts?.totalMeals || (duration * mealsPerDay);

    const deliverySchedule = generateDynamicDeliverySchedule(startDateObj.toDate(), startShift, duration, totalMealsToDeliver);

    // Use pricing from frontend (should ideally validate with DB, but trusting payload for this step as per instruction)
    const finalAmount = pricing?.finalAmount || 0;

    // Create subscription
    const subscription = new Subscription({
      user: userId,
      mealPlan: mealPlanId,
      planType: req.body.planType || 'custom',
      duration: duration || calculateDurationInDays(deliverySchedule),
      deliverySettings: {
        startDate: startDateObj.toDate(),
        startShift,
        deliveryDays: deliverySettings?.deliveryDays || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        timezone: 'Asia/Kolkata',
        deliveryPreferences: deliverySettings?.deliveryPreferences // SAVE THE RULES
      },
      mealCounts: {
        totalMeals: totalMealsToDeliver,
        delivered: 0,
        skipped: 0,
        mealsRemaining: totalMealsToDeliver
      },
      pricing: {
        basePricePerMeal: pricing?.basePricePerMeal || 0,
        totalDays: duration,
        mealsPerDay: mealsPerDay,
        totalMeals: totalMealsToDeliver,
        totalAmount: pricing?.totalAmount || 0,
        addOnsPrice: pricing?.addOnsPrice || 0, // Need to calculate if notsent
        gst: pricing?.gst || 0, // Need to calc
        finalAmount: finalAmount,
        currency: 'INR',
        discount: pricing?.discount || 0,
        couponCode: pricing?.couponCode
      },
      packaging: packaging, // SAVE PACKAGING
      selectedAddOns,
      customizations: [],
      customizationPreferences: {
        dietaryPreference: dietaryPreference || 'vegetarian',
        preferences: [],
        notes: ''
      },
      defaultMeal: mealPlanId,
      customizationHistory: [],
      permanentCustomization: {
        isActive: false,
        mealPlan: null,
        addOns: [],
        extraItems: [],
        preferences: {
          dietaryPreference: dietaryPreference || 'vegetarian',
          customOptions: [],
          spiceLevel: 'medium',
          specialInstructions: '',
          noOnion: false,
          noGarlic: false
        }
      },
      deliveryAddress,
      autoRenewal,
      status: 'pending_payment',
      deliverySchedule // Store the full delivery schedule
    });

    await subscription.save({ session });

    // Create Razorpay order
    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(finalAmount * 100), // Convert to paise
      currency: 'INR',
      receipt: `sub_${subscription._id.toString().slice(-12)}`,
      notes: {
        subscriptionId: subscription._id.toString(),
        type: 'subscription',
        userId: userId.toString(),
        mealPlanId: mealPlanId.toString()
      }
    });

    // Update subscription with Razorpay order ID
    subscription.razorpayOrderId = razorpayOrder.id;
    await subscription.save({ session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Subscription created. Please proceed with payment.',
      data: {
        subscription: {
          id: subscription._id,
          status: subscription.status,
          totalAmount: finalAmount,
          subscriptionId: subscription.subscriptionId,
          subscriptionIdString: subscription.subscriptionId, // Frontend expects this in ConfirmOrderPage
          totalThalis: totalMealsToDeliver,
          startDate: subscription.deliverySettings.startDate,
          endDate: subscription.deliverySettings.lastDeliveryDate
        },
        payment: {
          orderId: razorpayOrder.id,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          key: process.env.RAZORPAY_KEY_ID
        }
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error creating thali subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create subscription',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  } finally {
    session.endSession();
  }
};

/**
 * Generate a dynamic delivery schedule
 */
const generateDynamicDeliverySchedule = (startDate, startShift, durationInDays, totalMeals) => {
  const schedule = [];
  let currentDate = moment(startDate).tz('Asia/Kolkata');
  let mealsRemaining = totalMeals;
  let daysCounted = 0;

  // Safety limit to prevent infinite loops if logic is off
  const MAX_DAYS = durationInDays + 5;

  while (mealsRemaining > 0 && daysCounted < MAX_DAYS) {
    const dayOfWeek = currentDate.day(); // 0 = Sunday
    const isSunday = dayOfWeek === 0;

    // Morning Shift
    if (mealsRemaining > 0) {
      const isStartDay = daysCounted === 0;
      const skipMorning = isStartDay && startShift === 'evening';

      if (!skipMorning) {
        // Check if Sunday (usually lunch only, but let's assume valid unless explicitly excluded logic exists. 
        // Original logic strictly allowed simplified Sunday Lunch.)
        // For dynamic plans, if 'startShift' is 'both', we generally deliver both unless it's Sunday?
        // Let's stick to original Sunday logic: Only Lunch on Sunday.

        // If it's Sunday, we deliver Morning (Lunch) OK.
        schedule.push({
          date: currentDate.toDate(),
          shift: 'morning',
          isSunday: isSunday,
          thaliNumber: totalMeals - mealsRemaining + 1,
          isSpecial: isSunday
        });
        mealsRemaining--;
      }
    }

    // Evening Shift
    if (mealsRemaining > 0) {
      // No Dinner on Sundays per original logic
      if (!isSunday) {
        // If it's start day, we deliver evening regardless of startShift 'morning' (since 'morning' implies full day from morning)
        // If startShift was evening, we already skipped morning above.
        schedule.push({
          date: currentDate.toDate(),
          shift: 'evening',
          isSunday: isSunday,
          thaliNumber: totalMeals - mealsRemaining + 1
        });
        mealsRemaining--;
      }
    }

    currentDate.add(1, 'day');
    daysCounted++;
  }

  return schedule;
};

/**
 * Generate delivery schedule for 56 thalis
 */
const generateDeliverySchedule = (startDate, startShift) => {
  const schedule = [];
  let currentDate = moment(startDate).tz('Asia/Kolkata');
  let thalisRemaining = TOTAL_THALIS;
  let isFirstDay = true;

  while (thalisRemaining > 0) {
    const dayOfWeek = currentDate.day(); // 0 = Sunday, 1 = Monday, etc.
    const isSunday = dayOfWeek === 0;

    // For the first day, handle the starting shift
    if (isFirstDay) {
      if (startShift === 'morning') {
        // Add both meals for the day if not Sunday
        if (!isSunday) {
          schedule.push({
            date: currentDate.toDate(),
            shift: 'morning',
            isSunday: false,
            thaliNumber: TOTAL_THALIS - thalisRemaining + 1
          });
          thalisRemaining--;

          if (thalisRemaining > 0) {
            schedule.push({
              date: currentDate.toDate(),
              shift: 'evening',
              isSunday: false,
              thaliNumber: TOTAL_THALIS - thalisRemaining + 1
            });
            thalisRemaining--;
          }
        } else {
          // Sunday - only one meal
          schedule.push({
            date: currentDate.toDate(),
            shift: 'morning',
            isSunday: true,
            thaliNumber: TOTAL_THALIS - thalisRemaining + 1,
            isSpecial: true
          });
          thalisRemaining--;
        }
      } else {
        // Starting from evening - only add evening meal
        if (!isSunday) {
          schedule.push({
            date: currentDate.toDate(),
            shift: 'evening',
            isSunday: false,
            thaliNumber: TOTAL_THALIS - thalisRemaining + 1
          });
          thalisRemaining--;
        }
        // If it's Sunday evening, we skip to next day
      }

      isFirstDay = false;
    } else {
      // Regular day processing
      if (isSunday) {
        // Sunday - only lunch
        schedule.push({
          date: currentDate.toDate(),
          shift: 'morning',
          isSunday: true,
          thaliNumber: TOTAL_THALIS - thalisRemaining + 1,
          isSpecial: true
        });
        thalisRemaining--;
      } else {
        // Weekday - both meals
        schedule.push({
          date: currentDate.toDate(),
          shift: 'morning',
          isSunday: false,
          thaliNumber: TOTAL_THALIS - thalisRemaining + 1
        });
        thalisRemaining--;

        if (thalisRemaining > 0) {
          schedule.push({
            date: currentDate.toDate(),
            shift: 'evening',
            isSunday: false,
            thaliNumber: TOTAL_THALIS - thalisRemaining + 1
          });
          thalisRemaining--;
        }
      }
    }

    // Move to next day
    currentDate = currentDate.add(1, 'day').startOf('day');
  }

  return schedule;
};

/**
 * Calculate duration in days based on delivery schedule
 */
const calculateDurationInDays = (deliverySchedule) => {
  if (!deliverySchedule || deliverySchedule.length === 0) return 0;

  const firstDate = moment(deliverySchedule[0].date).startOf('day');
  const lastDate = moment(deliverySchedule[deliverySchedule.length - 1].date).startOf('day');

  return lastDate.diff(firstDate, 'days') + 1; // +1 to include both start and end dates
};

/**
 * Get subscription details
 */
const getSubscriptionDetails = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const userId = req.user.id;

    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      user: userId
    }).populate('mealPlan');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Calculate progress
    const progress = {
      total: subscription.mealCounts.totalMeals,
      delivered: subscription.mealCounts.mealsDelivered,
      remaining: subscription.mealCounts.mealsRemaining,
      skipped: subscription.mealCounts.mealsSkipped,
      percentage: Math.round((subscription.mealCounts.mealsDelivered / subscription.mealCounts.totalMeals) * 100)
    };

    // Get upcoming deliveries (next 7 days)
    const today = moment().tz('Asia/Kolkata').startOf('day');
    const upcomingDeliveries = subscription.deliverySchedule
      .filter(delivery => moment(delivery.date).isSameOrAfter(today))
      .slice(0, 7); // Next 7 days

    res.status(200).json({
      success: true,
      data: {
        subscription: {
          id: subscription._id,
          status: subscription.status,
          planType: subscription.planType,
          startDate: subscription.deliverySettings.startDate,
          endDate: subscription.deliverySettings.lastDeliveryDate,
          progress,
          pricing: subscription.pricing,
          mealPlan: subscription.mealPlan,
          deliveryAddress: subscription.deliveryAddress,
          customizations: subscription.customizations,
          selectedAddOns: subscription.selectedAddOns,
          upcomingDeliveries
        }
      }
    });

  } catch (error) {
    console.error('Error getting subscription details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription details',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Skip a meal
 */
const skipMeal = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { subscriptionId } = req.params;
    const { date, shift, reason } = req.body;
    const userId = req.user.id;

    // Find subscription
    const subscription = await Subscription.findOne({
      _id: subscriptionId,
      user: userId,
      status: 'active'
    }).session(session);

    if (!subscription) {
      await session.abortTransaction();
      return res.status(404).json({
        success: false,
        message: 'Active subscription not found'
      });
    }

    // Check if meal can be skipped
    const skipDate = moment.tz(date, 'Asia/Kolkata').startOf('day');
    const today = moment().tz('Asia/Kolkata').startOf('day');

    // Can't skip past meals or more than 2 days in advance
    if (skipDate.isBefore(today) || skipDate.diff(today, 'days') > 2) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'Meals can only be skipped up to 2 days in advance'
      });
    }

    // Find the delivery in schedule
    const deliveryIndex = subscription.deliverySchedule.findIndex(delivery =>
      moment(delivery.date).isSame(skipDate, 'day') &&
      delivery.shift === shift &&
      !delivery.isSkipped
    );

    if (deliveryIndex === -1) {
      await session.abortTransaction();
      return res.status(400).json({
        success: false,
        message: 'No delivery found for the specified date and shift'
      });
    }

    // Mark as skipped
    subscription.deliverySchedule[deliveryIndex].isSkipped = true;
    subscription.deliverySchedule[deliveryIndex].skipReason = reason || 'User requested';
    subscription.deliverySchedule[deliveryIndex].skippedAt = new Date();

    // Update meal counts
    subscription.mealCounts.mealsSkipped++;
    subscription.mealCounts.mealsRemaining--;

    // Add to skipped meals history
    subscription.skippedMeals.push({
      date: skipDate.toDate(),
      shift,
      reason: reason || 'User requested',
      isSunday: subscription.deliverySchedule[deliveryIndex].isSunday,
      creditIssued: false,
      createdAt: new Date()
    });

    await subscription.save({ session });
    await session.commitTransaction();

    res.status(200).json({
      success: true,
      message: 'Meal skipped successfully',
      data: {
        skippedMeal: {
          date: skipDate.toDate(),
          shift,
          reason: reason || 'User requested'
        },
        remainingMeals: subscription.mealCounts.mealsRemaining
      }
    });

  } catch (error) {
    await session.abortTransaction();
    console.error('Error skipping meal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to skip meal',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  } finally {
    session.endSession();
  }
};

/**
 * Get delivery schedule
 */
const getDeliverySchedule = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { startDate, endDate } = req.query;
    const userId = req.user.id;

    // Find subscription
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

    // Filter delivery schedule by date range if provided
    let deliveries = [...subscription.deliverySchedule];

    if (startDate) {
      const start = moment(startDate).startOf('day');
      deliveries = deliveries.filter(d => moment(d.date).isSameOrAfter(start));
    }

    if (endDate) {
      const end = moment(endDate).endOf('day');
      deliveries = deliveries.filter(d => moment(d.date).isSameOrBefore(end));
    }

    // Group by date for better frontend display
    const scheduleByDate = deliveries.reduce((acc, delivery) => {
      const dateKey = moment(delivery.date).format('YYYY-MM-DD');
      if (!acc[dateKey]) {
        acc[dateKey] = {
          date: delivery.date,
          day: moment(delivery.date).format('dddd'),
          isSunday: moment(delivery.date).day() === 0,
          deliveries: []
        };
      }

      acc[dateKey].deliveries.push({
        shift: delivery.shift,
        isSkipped: delivery.isSkipped || false,
        skipReason: delivery.skipReason,
        thaliNumber: delivery.thaliNumber,
        isSpecial: delivery.isSpecial || false
      });

      return acc;
    }, {});

    // Convert to array and sort by date
    const result = Object.values(scheduleByDate).sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    res.status(200).json({
      success: true,
      data: {
        subscriptionId: subscription._id,
        totalMeals: subscription.mealCounts.totalMeals,
        mealsDelivered: subscription.mealCounts.mealsDelivered,
        mealsRemaining: subscription.mealCounts.mealsRemaining,
        schedule: result
      }
    });

  } catch (error) {
    console.error('Error getting delivery schedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get delivery schedule',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  createThaliSubscription,
  getSubscriptionDetails,
  skipMeal,
  getDeliverySchedule
};
