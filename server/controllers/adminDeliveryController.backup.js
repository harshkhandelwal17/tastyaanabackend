const Subscription = require('../models/Subscription');
const DriverRoute = require('../models/DriverRoute');
const User = require('../models/User');
const MealPlan = require('../models/MealPlan');
const MealCustomization = require('../models/MealCustomization');
const ReplaceableItem = require('../models/replaceableItems');
const DailyMealDelivery = require('../models/DailyMealDelivery');
const moment = require('moment-timezone');
const mongoose = require('mongoose');

/**
 * Generate a driver-friendly summary of meal customizations
 * @param {Object} customization - The customization object
 * @param {Object} replacementMeal - The replacement meal details
 * @returns {String} Human-readable customization summary
 */
function generateCustomizationSummary(customization, replacementMeal) {
  const summaryParts = [];
  
  // Replacement meal
  if (replacementMeal) {
    summaryParts.push(`🔄 Meal changed to: ${replacementMeal.name}`);
  }
  
  // Dietary preferences
  if (customization.dietaryPreference && customization.dietaryPreference !== 'regular') {
    summaryParts.push(`🥗 Diet: ${customization.dietaryPreference}`);
  }
  
  // Spice level
  if (customization.spiceLevel && customization.spiceLevel !== 'medium') {
    summaryParts.push(`🌶️ Spice: ${customization.spiceLevel}`);
  }
  
  // Preferences
  const prefs = customization.preferences;
  if (prefs) {
    const prefStrings = [];
    if (prefs.noOnion) prefStrings.push('No Onion');
    if (prefs.noGarlic) prefStrings.push('No Garlic');
    if (prefs.noDairy) prefStrings.push('No Dairy');
    if (prefs.noNuts) prefStrings.push('No Nuts');
    if (prefStrings.length > 0) {
      summaryParts.push(`⚠️ Avoid: ${prefStrings.join(', ')}`);
    }
    if (prefs.specialInstructions) {
      summaryParts.push(`📝 Special: ${prefs.specialInstructions}`);
    }
  }
  
  // Add-ons
  if (customization.addons && customization.addons.length > 0) {
    const addonNames = customization.addons.map(addon => 
      `${addon.name || addon.item?.name} (x${addon.quantity})`
    ).join(', ');
    summaryParts.push(`➕ Addons: ${addonNames}`);
  }
  
  // Extra items
  if (customization.extraItems && customization.extraItems.length > 0) {
    const extraNames = customization.extraItems.map(extra => 
      `${extra.name || extra.item?.name} (x${extra.quantity})`
    ).join(', ');
    summaryParts.push(`🍽️ Extra: ${extraNames}`);
  }
  
  // Price adjustment info
  if (customization.totalpayablePrice > 0) {
    summaryParts.push(`💰 Extra charge: ₹${customization.totalpayablePrice}`);
  } else if (customization.totalpayablePrice < 0) {
    summaryParts.push(`💸 Discount: ₹${Math.abs(customization.totalpayablePrice)}`);
  }
  
  return summaryParts.length > 0 ? summaryParts.join(' | ') : 'Customized meal';
}

/**
 * Get Indian timezone date
 */
const getIndianDate = (date = null) => {
  const targetDate = date ? new Date(date) : new Date();
  return moment(targetDate).tz('Asia/Kolkata').format('YYYY-MM-DD');
};

/**
 * Parse a date string and create a proper Indian timezone date at midnight
 */
const parseIndianDate = (dateString) => {
  // Parse the date string (YYYY-MM-DD format)
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Create date at midnight IST (Indian Standard Time)
  // For 2025-11-28, we want 2025-11-28 00:00:00 IST
  // Which is 2025-11-27 18:30:00 UTC (IST is UTC+5:30, so subtract 5.5 hours)
  
  // Create UTC date for the given date at 18:30:00 (which is midnight IST)
  const utcDate = new Date(Date.UTC(year, month - 1, day - 1, 18, 30, 0, 0));
  
  return utcDate;
};

/**
 * @desc    Get all daily deliveries across zones with advanced filtering (similar to driver API)
 * @route   GET /api/admin/deliveries  
 * @access  Private (Admin only)
 */
exports.getAdminDailyDeliveries = async (req, res) => {
  try {
    const {
      date = getIndianDate(),
      shift = 'both',
      status = 'all',
      zone = 'all',
      driverId = 'all',
      sellerId = 'all',
      mealPlan = 'all',
      priceMin,
      priceMax,
      search = '',
      page = 1,
      limit = 50
    } = req.query;

    console.log('🔍 Admin Daily Deliveries Request:', {
      date, shift, status, zone, driverId, sellerId, mealPlan, search
    });

    // Check and update expired subscriptions (based on meals remaining = 0)
    const { updateExpiredSubscriptions } = require('../utils/subscriptionExpiry');
    try {
      await updateExpiredSubscriptions();
    } catch (error) {
      console.error('⚠️ Subscription expiry check failed:', error);
    }

    // Build match conditions for subscriptions
    const matchConditions = {
      status: 'active',
      'mealCounts.mealsRemaining': { $gt: 0 }
    };

    // Add zone filtering
    if (zone && zone !== 'all') {
      if (shift === 'morning') {
        matchConditions.morningZone = new mongoose.Types.ObjectId(zone);
      } else if (shift === 'evening') {
        matchConditions.eveningZone = new mongoose.Types.ObjectId(zone);
      } else {
        // For 'both' shift, include subscriptions where either morning or evening zone matches
        matchConditions.$or = [
          { morningZone: new mongoose.Types.ObjectId(zone) },
          { eveningZone: new mongoose.Types.ObjectId(zone) }
        ];
      }
    }

    // Add seller filtering
    if (sellerId && sellerId !== 'all') {
      matchConditions.sellerId = new mongoose.Types.ObjectId(sellerId);
    }

    // Add meal plan filtering
    if (mealPlan && mealPlan !== 'all') {
      matchConditions.mealPlan = new mongoose.Types.ObjectId(mealPlan);
    }

    // Build user search conditions
    let userMatchConditions = {};
    if (search) {
      userMatchConditions = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      };
    }

    // Get active subscriptions with filtering
    const subscriptions = await Subscription.aggregate([
      { $match: matchConditions },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user',
          pipeline: search ? [{ $match: userMatchConditions }] : []
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'mealplans',
          localField: 'mealPlan',
          foreignField: '_id',
          as: 'mealPlan'
        }
      },
      { $unwind: '$mealPlan' },
      {
        $lookup: {
          from: 'users',
          localField: 'mealPlan.seller',
          foreignField: '_id',
          as: 'seller'
        }
      },
      { $unwind: { path: '$seller', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'deliveryzones',
          localField: 'morningZone',
          foreignField: '_id',
          as: 'morningZoneDetails'
        }
      },
      {
        $lookup: {
          from: 'deliveryzones',
          localField: 'eveningZone',
          foreignField: '_id',
          as: 'eveningZoneDetails'
        }
      },
      { $unwind: { path: '$morningZoneDetails', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$eveningZoneDetails', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          seller: {
            $ifNull: [
              '$seller',
              {
                _id: null,
                name: 'Unknown Seller',
                businessName: 'Unknown Business',
                phone: ''
              }
            ]
          }
        }
      }
    ]);

    console.log(`Found ${subscriptions.length} active subscriptions for processing`);

    // Process deliveries similar to driver API
    const deliveries = [];
    const selectedDate = parseIndianDate(date);
    console.log('Selected date (Indian timezone):', selectedDate);
    
    let trackingCreated = 0;
    let trackingFound = 0;

    for (const subscription of subscriptions) {
      // Get subscription shifts
      let subscriptionShifts = [];
      
      if (subscription.shift) {
        if (subscription.shift === 'both') {
          subscriptionShifts = ['morning', 'evening'];
        } else if (['morning', 'evening'].includes(subscription.shift)) {
          subscriptionShifts = [subscription.shift];
        } else {
          subscriptionShifts = ['evening'];
        }
      } else if (subscription.deliveryTiming) {
        if (subscription.deliveryTiming.morning?.enabled) {
          subscriptionShifts.push('morning');
        }
        if (subscription.deliveryTiming.evening?.enabled) {
          subscriptionShifts.push('evening');
        }
      } else {
        subscriptionShifts = subscription.mealPlan?.shifts || ['evening'];
      }

      for (const mealShift of subscriptionShifts) {
        // Skip if filtering by specific shift
        if (shift !== 'both' && shift !== mealShift) continue;

        // Zone validation for this specific shift
        const shiftZone = mealShift === 'morning' ? subscription.morningZoneDetails : subscription.eveningZoneDetails;

        // Check for existing delivery tracking for this date and shift
        let existingDelivery = subscription.deliveryTracking?.find(track => {
          // Convert stored date to Indian timezone for comparison
          const trackDate = new Date(track.date);
          const indianTrackDate = new Date(trackDate.getTime() + (5.5 * 60 * 60 * 1000));
          const trackDateStr = indianTrackDate.toISOString().split('T')[0];
          
          // Compare with the input date
          const dateMatches = trackDateStr === date;
          const shiftMatches = track.shift === mealShift;
          
          return dateMatches && shiftMatches;
        });

        // Create delivery tracking if it doesn't exist
        if (!existingDelivery) {
          // Generate unique delivery number
          const deliveryNo = `DEL${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
          
          // Create new delivery tracking entry
          const newTracking = {
            date: new Date(selectedDate),
            shift: mealShift,
            status: 'pending',
            driver: null, // Admin view - driver not assigned yet
            deliveryNo: deliveryNo,
            zone: shiftZone?._id,
            isActive: true,
            checkpoints: [{
              type: 'created',
              timestamp: new Date(),
              notes: `Admin view - delivery tracking created`
            }],
            ETA: {
              estimated: new Date(selectedDate.getTime() + (mealShift === 'morning' ? 4 * 60 * 60 * 1000 : 8 * 60 * 60 * 1000))
            },
            thaliCount: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          };

          // Add to subscription and save
          try {
            const updatedSubscription = await Subscription.findByIdAndUpdate(
              subscription._id,
              { $push: { deliveryTracking: newTracking } },
              { new: true }
            );
            
            // Find the newly created delivery tracking entry
            existingDelivery = updatedSubscription.deliveryTracking.find(track => {
              const trackDate = new Date(track.date);
              trackDate.setHours(0, 0, 0, 0);
              return trackDate.getTime() === selectedDate.getTime() && 
                     track.shift === mealShift && 
                     track.deliveryNo === deliveryNo;
            });
            
            trackingCreated++;
          } catch (error) {
            console.error(`❌ Failed to create delivery tracking for ${subscription.subscriptionId}:`, error.message);
            continue;
          }
        } else {
          trackingFound++;
        }

        // Check if meal is skipped
        const isSkipped = subscription.skippedMeals?.some(skip => {
          const skipDate = new Date(skip.date);
          return skipDate.toDateString() === selectedDate.toDateString() && skip.shift === mealShift;
        });

        // Check for meal replacement
        const replacement = subscription.thaliReplacements?.find(rep => {
          const repDate = new Date(rep.date);
          const dateMatches = repDate.toDateString() === selectedDate.toDateString();
          const shiftMatches = rep.shift === mealShift;
          const paymentValidated = rep.priceDifference <= 0 || rep.paymentStatus === 'paid' || rep.paymentStatus === 'not_required';
          return dateMatches && shiftMatches && paymentValidated;
        });

        // Check for meal customizations
        let customizationDetails = null;
        try {
          const customization = await MealCustomization.findOne({
            subscription: subscription._id,
            date: {
              $gte: selectedDate,
              $lt: new Date(selectedDate.getTime() + 24 * 60 * 60 * 1000)
            },
            shift: mealShift,
            isActive: true
          })
          .populate('baseMeal')
          .populate('addons.item')
          .populate('extraItems.item');

          if (customization) {
            const paymentValid = customization && (
              customization.paymentStatus === 'paid' || 
              customization.paymentStatus === 'confirmed' ||
              (customization.totalpayablePrice <= 0) ||
              customization.paymentStatus === 'not_required'
            );

            if (paymentValid) {
              let replacementMealDetails = null;
              if (customization.replacementMeal) {
                try {
                  replacementMealDetails = await ReplaceableItem.findById(customization.replacementMeal);
                } catch (error) {
                  console.error('Error fetching replacement meal details:', error);
                }
              }

              customizationDetails = {
                customizationId: customization._id,
                type: customization.type,
                baseMeal: customization.baseMeal,
                replacementMeal: replacementMealDetails,
                dietaryPreference: customization.dietaryPreference,
                spiceLevel: customization.spiceLevel,
                preferences: customization.preferences,
                addons: customization.addons,
                extraItems: customization.extraItems,
                totalPrice: customization.totalPrice,
                totalpayablePrice: customization.totalpayablePrice,
                paymentStatus: customization.paymentStatus,
                customizationSummary: generateCustomizationSummary(customization, replacementMealDetails)
              };
            }
          }
        } catch (error) {
          console.error('Error fetching customization details:', error);
        }
        
        // Safety check: if no delivery tracking found, skip this delivery
        if (!existingDelivery || !existingDelivery._id) {
          console.error(`❌ No valid delivery tracking found for subscription ${subscription._id} - ${mealShift} shift on ${date}`);
          continue;
        }

        // Determine delivery status and details
        let actualStatus = existingDelivery.status || 'pending';
        let actualMealPlan = subscription.mealPlan;
        let displayMealName = subscription.mealPlan?.name;
        let skipReason = null;
        let replacementDetails = null;
        let isCustomized = !!(customizationDetails && customizationDetails.paymentStatus === 'paid');

        if (existingDelivery && existingDelivery.status === 'delivered') {
          actualStatus = 'delivered';
        } else if (isSkipped) {
          actualStatus = 'skipped';
          const skipInfo = subscription.skippedMeals.find(skip => {
            const skipDate = new Date(skip.date);
            return skipDate.toDateString() === selectedDate.toDateString() && skip.shift === mealShift;
          });
          skipReason = skipInfo?.reason || 'user_skipped';
        } else if (replacement) {
          actualStatus = 'replaced';
          if (replacement.replacementThali) {
            try {
              const replacementMeal = await MealPlan.findById(replacement.replacementThali);
              if (replacementMeal) {
                actualMealPlan = replacementMeal;
                displayMealName = `${replacementMeal.name} (Replacement for ${subscription.mealPlan?.name})`;
              }
            } catch (error) {
              console.error('Error fetching replacement meal details:', error);
            }
          }
          replacementDetails = {
            originalMealPlan: replacement.originalMealPlan,
            replacementThali: replacement.replacementThali,
            priceDifference: replacement.priceDifference,
            paymentStatus: replacement.paymentStatus
          };
        } else if (isCustomized && customizationDetails?.replacementMeal) {
          actualStatus = 'customized';
          actualMealPlan = customizationDetails.replacementMeal;
          displayMealName = `${customizationDetails.replacementMeal.name} | ${customizationDetails.customizationSummary}`;
        } else if (isCustomized) {
          actualStatus = 'customized';
          displayMealName = `${subscription.mealPlan?.name} | ${customizationDetails.customizationSummary}`;
        }

        // Get assigned driver info
        let assignedDriver = null;
        if (existingDelivery.driver || existingDelivery.assignedDriver) {
          try {
            assignedDriver = await User.findById(existingDelivery.driver || existingDelivery.assignedDriver).select('name phone');
          } catch (error) {
            console.error('Error fetching driver details:', error);
          }
        }

        // Create delivery record with all details
        const delivery = {
          _id: existingDelivery._id,
          subscriptionId: subscription._id,
          deliveryNo: existingDelivery.deliveryNo,
          subscriptionNumber: subscription.subscriptionId,
          user: {
            _id: subscription.user._id,
            name: subscription.user.name,
            phone: subscription.user.phone,
            email: subscription.user.email
          },
          mealPlan: actualMealPlan,
          displayMealName: displayMealName,
          price: actualMealPlan?.price || 0,
          seller: {
            _id: subscription.seller._id,
            name: subscription.seller.name,
            businessName: subscription.seller.businessName,
            phone: subscription.seller.phone
          },
          address: subscription.deliveryAddress,
          date: new Date(date),
          shift: mealShift,
          zone: shiftZone,
          status: actualStatus,
          isSkipped: isSkipped,
          isReplaced: !!replacement,
          isCustomized: isCustomized,
          skipReason: skipReason,
          replacementDetails: replacementDetails,
          customizationDetails: customizationDetails,
          deliveredAt: existingDelivery?.deliveredAt,
          deliveredBy: existingDelivery?.deliveredBy,
          driver: assignedDriver,
          deliveryNotes: existingDelivery?.notes,
          checkpoints: existingDelivery?.checkpoints || [],
          ETA: existingDelivery?.ETA,
          canComplete: !isSkipped && actualStatus !== 'delivered',
          createdAt: existingDelivery?.createdAt || subscription.createdAt,
          updatedAt: existingDelivery?.updatedAt || new Date()
        };

        // Apply status filter
        if (status !== 'all') {
          switch(status) {
            case 'pending':
              if (!['pending', 'customized'].includes(delivery.status)) continue;
              break;
            case 'delivered':
              if (delivery.status !== 'delivered') continue;
              break;
            case 'skipped':
              if (!delivery.isSkipped) continue;
              break;
            case 'replaced':
              if (!delivery.isReplaced) continue;
              break;
            case 'customized':
              if (!delivery.isCustomized) continue;
              break;
            case 'cancelled':
              if (delivery.status !== 'cancelled') continue;
              break;
            default:
              continue;
          }
        }

        // Apply driver filter
        if (driverId && driverId !== 'all') {
          if (!existingDelivery.driver || existingDelivery.driver.toString() !== driverId) {
            continue;
          }
        }

        // Apply price range filter
        if (priceMin || priceMax) {
          const mealPrice = delivery.price;
          if (priceMin && mealPrice < parseFloat(priceMin)) continue;
          if (priceMax && mealPrice > parseFloat(priceMax)) continue;
        }

        deliveries.push(delivery);
      }
    }

    console.log(`📊 Delivery tracking summary: ${trackingCreated} created, ${trackingFound} found existing`);
    console.log(`📦 Generated ${deliveries.length} admin deliveries for ${date}`);

    // Apply pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedDeliveries = deliveries.slice(skip, skip + parseInt(limit));

    // Calculate statistics
    const stats = {
      total: deliveries.length,
      pending: deliveries.filter(d => ['pending', 'customized', 'replaced'].includes(d.status)).length,
      delivered: deliveries.filter(d => d.status === 'delivered').length,
      skipped: deliveries.filter(d => d.isSkipped).length,
      replaced: deliveries.filter(d => d.isReplaced).length,
      customized: deliveries.filter(d => d.isCustomized).length,
      cancelled: deliveries.filter(d => d.status === 'cancelled').length,
      morning: deliveries.filter(d => d.shift === 'morning').length,
      evening: deliveries.filter(d => d.shift === 'evening').length,
      successRate: deliveries.length > 0 ? 
        Math.round((deliveries.filter(d => d.status === 'delivered').length / deliveries.length) * 100) : 0,
      trackingCreated,
      trackingFound
    };

    res.status(200).json({
      success: true,
      data: paginatedDeliveries,
      stats,
      meta: {
        date,
        shift,
        status,
        zone,
        driverId,
        sellerId,
        mealPlan,
        search,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: deliveries.length,
          pages: Math.ceil(deliveries.length / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching admin daily deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily deliveries',
      error: error.message
    });
  }
};

/**
 * @desc    Admin skip meal for user
 * @route   POST /api/admin/daily-deliveries/:subscriptionId/skip
 * @access  Private (Admin only)
 */
exports.adminSkipMeal = async (req, res) => {
        }
      },

      // Add delivery information for both shifts
      {
        $addFields: {
          // Morning delivery info
          morningDelivery: {
            $let: {
              vars: {
                morningTracking: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$deliveryTracking',
                        cond: { $eq: ['$$this.shift', 'morning'] }
                      }
                    },
                    0
                  ]
                }
              },
              in: {
                trackingId: '$$morningTracking._id',
                status: { $ifNull: ['$$morningTracking.status', 'pending'] },
                driverId: '$$morningTracking.driverId',
                zone: '$$morningTracking.zone',
                estimatedTime: '$$morningTracking.estimatedDeliveryTime',
                actualTime: '$$morningTracking.actualDeliveryTime',
                notes: '$$morningTracking.notes'
              }
            }
          },
          
          // Evening delivery info
          eveningDelivery: {
            $let: {
              vars: {
                eveningTracking: {
                  $arrayElemAt: [
                    {
                      $filter: {
                        input: '$deliveryTracking',
                        cond: { $eq: ['$$this.shift', 'evening'] }
                      }
                    },
                    0
                  ]
                }
              },
              in: {
                trackingId: '$$eveningTracking._id',
                status: { $ifNull: ['$$eveningTracking.status', 'pending'] },
                driverId: '$$eveningTracking.driverId',
                zone: '$$eveningTracking.zone',
                estimatedTime: '$$eveningTracking.estimatedDeliveryTime',
                actualTime: '$$eveningTracking.actualDeliveryTime',
                notes: '$$eveningTracking.notes'
              }
            }
          },

          // Meal customization info
          mealCustomization: {
            $arrayElemAt: ['$customizations', 0]
          },

          // Skip status
          isSkipped: {
            $or: [
              {
                $in: [
                  {
                    $dateToString: { format: '%Y-%m-%d', date: selectedDate }
                  },
                  {
                    $map: {
                      input: '$skipMeals',
                      as: 'skip',
                      in: { $dateToString: { format: '%Y-%m-%d', date: '$$skip.date' } }
                    }
                  }
                ]
              }
            ]
          }
        }
      },

      // Apply filters
      {
        $match: {
          $and: [
            // Zone filter
            zone !== 'all' ? {
              $or: [
                { 'morningDelivery.zone': zone },
                { 'eveningDelivery.zone': zone }
              ]
            } : {},

            // Driver filter  
            driverId !== 'all' ? {
              $or: [
                { 'morningDelivery.driverId': new mongoose.Types.ObjectId(driverId) },
                { 'eveningDelivery.driverId': new mongoose.Types.ObjectId(driverId) }
              ]
            } : {},

            // Seller filter
            sellerId !== 'all' ? {
              'sellerId': new mongoose.Types.ObjectId(sellerId)
            } : {},

            // Meal plan filter
            mealPlanId !== 'all' ? {
              'mealPlan': new mongoose.Types.ObjectId(mealPlanId)
            } : {},

            // Status filter
            status !== 'all' ? {
              $or: [
                shift === 'morning' || shift === 'both' ? { 'morningDelivery.status': status } : {},
                shift === 'evening' || shift === 'both' ? { 'eveningDelivery.status': status } : {}
              ].filter(condition => Object.keys(condition).length > 0)
            } : {},

            // Search filter
            search ? {
              $or: [
                { 'userDetails.name': { $regex: search, $options: 'i' } },
                { 'userDetails.email': { $regex: search, $options: 'i' } },
                { 'userDetails.phone': { $regex: search, $options: 'i' } },
                { 'sellerDetails.sellerProfile.businessName': { $regex: search, $options: 'i' } },
                { 'mealPlanDetails.title': { $regex: search, $options: 'i' } }
              ]
            } : {},

            // Price range filter
            priceRange !== 'all' ? (() => {
              const [min, max] = priceRange.split('-').map(Number);
              return max ? 
                { 'pricing.finalAmount': { $gte: min, $lte: max } } :
                { 'pricing.finalAmount': { $gte: min } };
            })() : {}
          ].filter(condition => Object.keys(condition).length > 0)
        }
      },

      // Lookup driver details for morning delivery
      {
        $lookup: {
          from: 'users',
          localField: 'morningDelivery.driverId',
          foreignField: '_id',
          as: 'morningDriverDetails'
        }
      },

      // Lookup driver details for evening delivery
      {
        $lookup: {
          from: 'users',
          localField: 'eveningDelivery.driverId',
          foreignField: '_id',
          as: 'eveningDriverDetails'
        }
      },

      // Project final structure
      {
        $project: {
          _id: 1,
          subscriptionId: '$_id',
          user: {
            _id: '$userDetails._id',
            name: '$userDetails.name',
            email: '$userDetails.email',
            phone: '$userDetails.phone',
            addresses: '$userDetails.addresses'
          },
          seller: {
            _id: '$sellerDetails._id',
            businessName: '$sellerDetails.sellerProfile.businessName',
            name: '$sellerDetails.name',
            phone: '$sellerDetails.phone'
          },
          mealPlan: {
            _id: '$mealPlanDetails._id',
            title: '$mealPlanDetails.title',
            tier: '$mealPlanDetails.tier',
            price: '$mealPlanDetails.pricing'
          },
          pricing: '$pricing',
          deliveryAddress: '$deliveryAddress',
          
          // Morning shift delivery
          morningDelivery: {
            $cond: {
              if: { $or: [{ $eq: [shift, 'morning'] }, { $eq: [shift, 'both'] }] },
              then: {
                trackingId: '$morningDelivery.trackingId',
                status: '$morningDelivery.status',
                zone: '$morningDelivery.zone',
                estimatedTime: '$morningDelivery.estimatedTime',
                actualTime: '$morningDelivery.actualTime',
                notes: '$morningDelivery.notes',
                driver: { $arrayElemAt: ['$morningDriverDetails', 0] },
                shift: 'morning'
              },
              else: null
            }
          },
          
          // Evening shift delivery
          eveningDelivery: {
            $cond: {
              if: { $or: [{ $eq: [shift, 'evening'] }, { $eq: [shift, 'both'] }] },
              then: {
                trackingId: '$eveningDelivery.trackingId',
                status: '$eveningDelivery.status',
                zone: '$eveningDelivery.zone',
                estimatedTime: '$eveningDelivery.estimatedTime',
                actualTime: '$eveningDelivery.actualTime',
                notes: '$eveningDelivery.notes',
                driver: { $arrayElemAt: ['$eveningDriverDetails', 0] },
                shift: 'evening'
              },
              else: null
            }
          },

          // Meal status
          mealCustomization: '$mealCustomization',
          isSkipped: '$isSkipped',
          hasCustomization: { $gt: [{ $size: '$customizations' }, 0] },
          
          // Metadata
          createdAt: 1,
          updatedAt: 1,
          date: selectedDate
        }
      },

      // Sort
      { $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 } },

      // Pagination
      { $skip: skip },
      { $limit: parseInt(limit) }
    ];

    // Get total count for pagination
    const countPipeline = [...pipeline.slice(0, -2), { $count: 'total' }];
    const countResult = await Subscription.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Execute main query
    const deliveries = await Subscription.aggregate(pipeline);

    // Get filter options for dropdowns
    const filterOptions = await getFilterOptions();

    // Calculate summary statistics
    const stats = calculateDeliveryStats(deliveries, shift);

    res.status(200).json({
      success: true,
      data: deliveries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      stats,
      filterOptions,
      meta: {
        date,
        shift,
        status,
        zone,
        appliedFilters: {
          zone: zone !== 'all',
          driver: driverId !== 'all',
          seller: sellerId !== 'all',
          mealPlan: mealPlanId !== 'all',
          status: status !== 'all',
          priceRange: priceRange !== 'all',
          search: search.length > 0
        }
      }
    });

  } catch (error) {
    console.error('Error getting admin daily deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily deliveries',
      error: error.message
    });
  }
};

/**
 * Get filter options for dropdowns
 */
const getFilterOptions = async () => {
  try {
    // Get all zones from delivery tracking
    const zones = await DailyMealDelivery.distinct('zone');
    
    // Get all active drivers
    const drivers = await User.find(
      { role: 'delivery', isActive: true },
      { name: 1, email: 1 }
    );

    // Get all active sellers
    const sellers = await User.find(
      { role: 'seller', 'sellerProfile.isVerified': true },
      { name: 1, 'sellerProfile.businessName': 1 }
    );

    // Get all meal plans
    const mealPlans = await MealPlan.find(
      { isActive: true },
      { title: 1, tier: 1, pricing: 1 }
    );

    return {
      zones: zones.sort(),
      drivers: drivers.map(driver => ({
        _id: driver._id,
        name: driver.name,
        email: driver.email
      })),
      sellers: sellers.map(seller => ({
        _id: seller._id,
        name: seller.name,
        businessName: seller.sellerProfile?.businessName
      })),
      mealPlans: mealPlans.map(plan => ({
        _id: plan._id,
        title: plan.title,
        tier: plan.tier,
        price: plan.pricing
      })),
      priceRanges: [
        { label: 'Under ₹50', value: '0-50' },
        { label: '₹50-100', value: '50-100' },
        { label: '₹100-200', value: '100-200' },
        { label: '₹200-500', value: '200-500' },
        { label: 'Above ₹500', value: '500' }
      ],
      statuses: ['pending', 'assigned', 'picked', 'delivered', 'failed', 'skipped']
    };
  } catch (error) {
    console.error('Error getting filter options:', error);
    return {};
  }
};

/**
 * Calculate delivery statistics
 */
const calculateDeliveryStats = (deliveries, shift) => {
  const stats = {
    total: deliveries.length,
    pending: 0,
    assigned: 0,
    picked: 0,
    delivered: 0,
    failed: 0,
    skipped: 0,
    customized: 0,
    morning: 0,
    evening: 0,
    totalValue: 0
  };

  deliveries.forEach(delivery => {
    // Count by status
    if (delivery.morningDelivery && (shift === 'morning' || shift === 'both')) {
      stats[delivery.morningDelivery.status] = (stats[delivery.morningDelivery.status] || 0) + 1;
      stats.morning++;
    }
    
    if (delivery.eveningDelivery && (shift === 'evening' || shift === 'both')) {
      stats[delivery.eveningDelivery.status] = (stats[delivery.eveningDelivery.status] || 0) + 1;
      stats.evening++;
    }

    // Count customizations
    if (delivery.hasCustomization) {
      stats.customized++;
    }

    // Count skipped
    if (delivery.isSkipped) {
      stats.skipped++;
    }

    // Calculate total value
    stats.totalValue += delivery.pricing?.finalAmount || 0;
  });

  return stats;
};

/**
 * @desc    Admin skip meal for user
 * @route   POST /api/admin/daily-deliveries/:subscriptionId/skip
 * @access  Private (Admin only)
 */
exports.adminSkipMeal = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { dates, reason, shift = 'both' } = req.body;

    console.log('🔍 Admin Skip Meal Request:', {
      subscriptionId,
      dates,
      reason,
      shift
    });

    // Validate subscription
    const subscription = await Subscription.findById(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Process skip dates
    const processedSkipDates = [];
    
    if (Array.isArray(dates)) {
      dates.forEach(dateEntry => {
        if (typeof dateEntry === 'string') {
          // Single date
          if (shift === 'both') {
            processedSkipDates.push({ date: dateEntry, shift: 'morning' });
            processedSkipDates.push({ date: dateEntry, shift: 'evening' });
          } else {
            processedSkipDates.push({ date: dateEntry, shift });
          }
        } else if (dateEntry.date) {
          // Date object with shift
          const skipShift = dateEntry.shift || shift;
          if (skipShift === 'both') {
            processedSkipDates.push({ date: dateEntry.date, shift: 'morning' });
            processedSkipDates.push({ date: dateEntry.date, shift: 'evening' });
          } else {
            processedSkipDates.push({ date: dateEntry.date, shift: skipShift });
          }
        }
      });
    }

    console.log('Processed skip dates:', processedSkipDates);

    // Add skip entries to subscription
    const skipEntries = processedSkipDates.map(entry => ({
      date: new Date(entry.date),
      shift: entry.shift,
      reason: reason || `Admin skipped meal for ${entry.date} ${entry.shift}`,
      skippedBy: 'admin',
      adminId: req.user._id,
      skippedAt: new Date()
    }));

    subscription.skipMeals.push(...skipEntries);
    await subscription.save();

    // Update delivery tracking status to 'skipped'
    for (const entry of processedSkipDates) {
      await DailyMealDelivery.updateMany(
        {
          subscription: subscriptionId,
          date: new Date(entry.date),
          shift: entry.shift
        },
        {
          $set: {
            status: 'skipped',
            notes: reason || 'Skipped by admin',
            updatedAt: new Date()
          }
        }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Meals skipped successfully',
      data: {
        subscriptionId,
        skippedDates: processedSkipDates,
        reason
      }
    });

  } catch (error) {
    console.error('Error skipping meal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to skip meal',
      error: error.message
    });
  }
};

/**
 * @desc    Admin customize meal for user
 * @route   POST /api/admin/daily-deliveries/:subscriptionId/customize
 * @access  Private (Admin only)
 */
exports.adminCustomizeMeal = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const customizationData = req.body;

    console.log('🔍 Admin Meal Customization Request:', {
      subscriptionId,
      customizationData
    });

    // Validate subscription
    const subscription = await Subscription.findById(subscriptionId)
      .populate('mealPlan')
      .populate('user');
      
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Create customization object
    const customization = new MealCustomization({
      subscriptionId: subscriptionId,
      userId: subscription.user._id,
      sellerId: subscription.sellerId,
      type: customizationData.type || 'one-time',
      date: new Date(customizationData.date),
      shift: customizationData.shift || 'morning',
      
      // Meal details
      replacementMeal: customizationData.replacementMeal,
      dietaryPreference: customizationData.dietaryPreference || 'regular',
      spiceLevel: customizationData.spiceLevel || 'medium',
      
      // Preferences
      preferences: {
        noOnion: customizationData.preferences?.noOnion || false,
        noGarlic: customizationData.preferences?.noGarlic || false,
        specialInstructions: customizationData.preferences?.specialInstructions || ''
      },
      
      // Additional items
      addons: customizationData.addons || [],
      extraItems: customizationData.extraItems || [],
      
      // Pricing
      originalPrice: subscription.pricing?.finalAmount || 0,
      totalBillAmount: customizationData.totalBillAmount || subscription.pricing?.finalAmount || 0,
      extraCostToPay: customizationData.extraCostToPay || 0,
      paymentAmount: customizationData.paymentAmount || 0,
      
      // Admin info
      notes: customizationData.notes || '',
      customizedBy: 'admin',
      adminId: req.user._id,
      
      status: 'active'
    });

    await customization.save();

    // Update subscription with customization
    const customizationDate = new Date(customizationData.date);
    
    // Add to customized days
    const existingDayIndex = subscription.customizedDays.findIndex(day => 
      day.date.toDateString() === customizationDate.toDateString()
    );

    if (existingDayIndex > -1) {
      // Update existing day
      const existingShiftIndex = subscription.customizedDays[existingDayIndex].shifts.findIndex(
        shift => shift.shift === customizationData.shift
      );
      
      if (existingShiftIndex > -1) {
        subscription.customizedDays[existingDayIndex].shifts[existingShiftIndex].customizationId = customization._id;
      } else {
        subscription.customizedDays[existingDayIndex].shifts.push({
          shift: customizationData.shift,
          customizationId: customization._id
        });
      }
    } else {
      // Add new day
      subscription.customizedDays.push({
        date: customizationDate,
        shifts: [{
          shift: customizationData.shift,
          customizationId: customization._id
        }]
      });
    }

    subscription.customizedDaysCount = subscription.customizedDays.length;
    await subscription.save();

    // Update delivery tracking with customization info
    await DailyMealDelivery.updateMany(
      {
        subscription: subscriptionId,
        date: customizationDate,
        shift: customizationData.shift
      },
      {
        $set: {
          hasCustomization: true,
          customizationId: customization._id,
          updatedAt: new Date()
        }
      }
    );

    res.status(201).json({
      success: true,
      message: 'Meal customized successfully',
      data: customization
    });

  } catch (error) {
    console.error('Error customizing meal:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to customize meal',
      error: error.message
    });
  }
};

/**
 * @desc    Update delivery status
 * @route   PUT /api/admin/daily-deliveries/:trackingId/status
 * @access  Private (Admin only)
 */
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { trackingId } = req.params;
    const { status, notes, driverId } = req.body;

    console.log('🔍 Admin Update Delivery Status:', {
      trackingId,
      status,
      notes,
      driverId
    });

    const delivery = await DailyMealDelivery.findByIdAndUpdate(
      trackingId,
      {
        $set: {
          status,
          notes: notes || '',
          driverId: driverId || undefined,
          actualDeliveryTime: status === 'delivered' ? new Date() : undefined,
          updatedAt: new Date(),
          updatedBy: req.user._id
        }
      },
      { new: true }
    ).populate('subscription')
     .populate('driverId', 'name email phone');

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Delivery tracking not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Delivery status updated successfully',
      data: delivery
    });

  } catch (error) {
    console.error('Error updating delivery status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update delivery status',
      error: error.message
    });
  }
};

/**
 * @desc    Get delivery details by ID
 * @route   GET /api/admin/daily-deliveries/:subscriptionId
 * @access  Private (Admin only)
 */
exports.getDeliveryDetails = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { date = getIndianDate() } = req.query;

    console.log('🔍 Admin Get Delivery Details:', {
      subscriptionId,
      date
    });

    const selectedDate = parseIndianDate(date);

    const delivery = await Subscription.findById(subscriptionId)
      .populate('user', 'name email phone addresses')
      .populate('sellerId', 'name sellerProfile.businessName phone')
      .populate('mealPlan')
      .lean();

    if (!delivery) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Get delivery tracking for the date
    const deliveryTracking = await DailyMealDelivery.find({
      subscription: subscriptionId,
      date: selectedDate
    }).populate('driverId', 'name email phone');

    // Get customizations for the date
    const customizations = await MealCustomization.find({
      subscriptionId,
      date: selectedDate
    }).populate('replacementMeal', 'name price image description');

    // Check if meal is skipped
    const isSkipped = delivery.skipMeals?.some(skip => 
      skip.date.toDateString() === selectedDate.toDateString()
    );

    const result = {
      ...delivery,
      deliveryTracking,
      customizations,
      isSkipped,
      date: selectedDate
    };

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error getting delivery details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get delivery details',
      error: error.message
    });
  }
};

// Get delivery statistics
exports.getDeliveryStats = async (req, res) => {
  try {
    const { date, zone, driverId, sellerId } = req.query;
    
    // Build filter based on query params
    const filter = {};
    if (date && date !== 'all') {
      const selectedDate = parseIndianDate(date);
      filter.createdAt = {
        $gte: new Date(selectedDate.setHours(0, 0, 0, 0)),
        $lt: new Date(selectedDate.setHours(23, 59, 59, 999))
      };
    }
    if (zone && zone !== 'all') filter['address.area'] = zone;
    if (driverId && driverId !== 'all') filter.driverId = new mongoose.Types.ObjectId(driverId);

    const [totalCount, pendingCount, deliveredCount, skippedCount, cancelledCount] = await Promise.all([
      Subscription.countDocuments(filter),
      Subscription.countDocuments({ ...filter, status: 'pending' }),
      Subscription.countDocuments({ ...filter, status: 'delivered' }),
      Subscription.countDocuments({ ...filter, status: 'skipped' }),
      Subscription.countDocuments({ ...filter, status: 'cancelled' })
    ]);

    res.status(200).json({
      success: true,
      data: {
        total: totalCount,
        pending: pendingCount,
        delivered: deliveredCount,
        skipped: skippedCount,
        cancelled: cancelledCount
      }
    });

  } catch (error) {
    console.error('Error getting delivery stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get delivery stats',
      error: error.message
    });
  }
};

// Get delivery filter options
exports.getDeliveryFilters = async (req, res) => {
  try {
    const [zones, drivers, sellers, mealPlans] = await Promise.all([
      // Get unique zones
      Subscription.distinct('address.area'),
      // Get active drivers
      User.find({ role: 'driver', isActive: true }).select('_id name'),
      // Get active sellers  
      User.find({ role: 'seller', isActive: true }).select('_id name'),
      // Get active meal plans
      MealPlan.find({ isActive: true }).select('_id name')
    ]);

    res.status(200).json({
      success: true,
      data: {
        zones: zones.filter(Boolean),
        drivers,
        sellers,
        mealPlans
      }
    });

  } catch (error) {
    console.error('Error getting delivery filters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get delivery filters',
      error: error.message
    });
  }
};

