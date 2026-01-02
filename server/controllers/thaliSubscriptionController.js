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
      startShift, // 'morning' or 'evening'
      deliveryAddress,
      selectedAddOns = [],
      customizations = [],
      dietaryPreference = 'veg',
      autoRenewal = false
    } = req.body;

    const userId = req.user.id;

    // Check for existing active subscription
    const existingSubscription = await Subscription.findOne({
      user: userId,
      status: { $in: ['active', 'pending'] },
      'mealCounts.mealsRemaining': { $gt: 0 }
    });

    if (existingSubscription) {
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

    // If starting on Sunday evening, move to Monday morning
    if (startDateObj.day() === 0 && startShift === 'evening') {
      startDateObj.add(1, 'day').hour(0).minute(0).second(0);
      startShift = 'morning';
    }

    // Calculate delivery schedule
    const deliverySchedule = generateDeliverySchedule(startDateObj.toDate(), startShift);
    
    // Calculate total amount
    const baseAmount = TOTAL_THALIS * BASE_PRICE_PER_THALI;
    
    // Calculate add-ons (applied to all thalis)
    const addOnsTotal = selectedAddOns.reduce((sum, addOn) => {
      return sum + (addOn.price * TOTAL_THALIS);
    }, 0);
    
    const subtotal = baseAmount + addOnsTotal;
    const gst = subtotal * 0.05; // 5% GST
    const finalAmount = subtotal + gst;

    // Create subscription
    const subscription = new Subscription({
      user: userId,
      mealPlan: mealPlanId,
      planType: 'fiftySixThali',
      duration: calculateDurationInDays(deliverySchedule),
      deliverySettings: {
        startDate: startDateObj.toDate(),
        startShift,
        deliveryDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        timezone: 'Asia/Kolkata'
      },
      mealCounts: {
        totalMeals: TOTAL_THALIS,
        delivered: 0,
        skipped: 0,
        remaining: TOTAL_THALIS
      },
      pricing: {
        basePricePerMeal: BASE_PRICE_PER_THALI,
        totalDays: calculateDurationInDays(deliverySchedule),
        mealsPerDay: 2, // Will vary based on day
        totalMeals: TOTAL_THALIS,
        totalAmount: baseAmount,
        addOnsPrice: addOnsTotal,
        gst: gst,
        finalAmount: finalAmount,
        currency: 'INR'
      },
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
        type: 'fifty_six_thali_subscription',
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
          totalThalis: TOTAL_THALIS,
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
    
    // REMOVED: Meal count deduction - now handled ONLY in updateDynamicDeliveryStatus function
    // Skip tracking maintained for scheduling/display purposes only
    
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
      message: 'Meal skipped successfully - meal counts managed centrally',
      data: {
        skippedMeal: {
          date: skipDate.toDate(),
          shift,
          reason: reason || 'User requested'
        },
        note: 'Meal counts updated only when delivery status changes'
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
