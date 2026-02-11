const Subscription = require('../models/Subscription');
const User = require('../models/User');
const MealPlan = require('../models/MealPlan');
const MealCustomization = require('../models/MealCustomization');
const ReplaceableItem = require('../models/replaceableItems');
const DriverRoute = require('../models/DriverRoute');
const DeliveryZone = require('../models/DeliveryZone');
const { validationResult } = require('express-validator');
const deliveryNotificationService = require('../services/deliveryNotificationService');
const { updateExpiredSubscriptions } = require('../utils/subscriptionExpiry');

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
 * Get current date in Indian timezone (IST) in YYYY-MM-DD format
 */
function getIndianDate() {
  const now = new Date();
  const indianTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // IST is UTC+5:30
  return indianTime.toISOString().split('T')[0];
}

/**
 * Parse a date string and create a proper Indian timezone date at midnight
 */
function parseIndianDate(dateStr) {
  // Parse the date string (YYYY-MM-DD format)
  const [year, month, day] = dateStr.split('-').map(Number);
  
  // Create date in Indian timezone at midnight
  // We create it as UTC first then adjust for IST
  const date = new Date(year, month - 1, day, 0, 0, 0, 0);
  
  // Convert to UTC by subtracting IST offset (5.5 hours)
  const utcDate = new Date(date.getTime() - (5.5 * 60 * 60 * 1000));
  
  return utcDate;
}

/**
 * Get all daily deliveries for driver dashboard with zone-based filtering and automatic delivery tracking creation
 * GET /api/drivers/daily-deliveries
 */
exports.getDriverDailyDeliveries = async (req, res) => {
  try {
    const {
      date = getIndianDate(), // Use Indian timezone date
      shift = 'both',
      status = 'all',
      search = '',
      page = 1,
      limit = 100
    } = req.query;

    console.log('Getting zone-based daily deliveries for driver:', req.user._id, 'date:', date, 'shift:', shift);
    console.log('Indian timezone date:', getIndianDate());
    // Check and update expired subscriptions (based on meals remaining = 0)
    const { updateExpiredSubscriptions } = require('../utils/subscriptionExpiry');
    try {
      const expiryResult = await updateExpiredSubscriptions();
    } catch (error) {
      console.error('⚠️ Subscription expiry check failed:', error);
    }

    // Validate driver access
    if (!['admin', 'driver', 'delivery'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - insufficient privileges'
      });
    }

    // Get driver information with zones
    const driver = await User.findById(req.user._id).populate('driverProfile.zones');
    if (!driver) {
      return res.status(404).json({
        success: false,
        message: 'Driver not found'
      });
    }

    // Check if driver has zones assigned (for zone-based filtering)
    const driverZones = driver.driverProfile?.zones || [];
    const driverShifts = driver.driverProfile?.shifts || ['morning', 'evening'];
    
    console.log(`Driver ${driver.name} has ${driverZones.length} zones and shifts: ${driverShifts.join(', ')}`);

    // Build zone-based match conditions for subscriptions
    const matchConditions = {
      status: 'active',
      'mealCounts.mealsRemaining': { $gt: 0 }
    };

    // Add zone filtering if driver has zones assigned
    if (driverZones.length > 0) {
      const zoneIds = driverZones.map(zone => zone._id);
      
      // Filter by zone based on shift
      if (shift === 'morning') {
        matchConditions.morningZone = { $in: zoneIds };
      } else if (shift === 'evening') {
        matchConditions.eveningZone = { $in: zoneIds };
      } else {
        // For 'both' shift, include subscriptions where either morning or evening zone matches
        matchConditions.$or = [
          { morningZone: { $in: zoneIds } },
          { eveningZone: { $in: zoneIds } }
        ];
      }
      
      console.log(`Zone filtering applied for ${zoneIds.length} zones`);
    } else {
      console.log('⚠️ Driver has no zones assigned - showing all deliveries');
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

    // Get active subscriptions with zone filtering
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

    console.log(`Found ${subscriptions.length} zone-filtered active subscriptions for processing`);

    // Process deliveries and create/update delivery tracking
    const deliveries = [];
    const selectedDate = parseIndianDate(date); // Use Indian timezone parsing
    console.log('Selected date (Indian timezone):', selectedDate);
    console.log('Selected date ISO:', selectedDate.toISOString());
    
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

        // Filter by driver shifts
        if (!driverShifts.includes(mealShift)) {
          console.log(`Skipping ${mealShift} shift - driver not available for this shift`);
          continue;
        }

        // Zone validation for this specific shift
        const shiftZone = mealShift === 'morning' ? subscription.morningZoneDetails : subscription.eveningZoneDetails;
        if (driverZones.length > 0) {
          const hasZoneAccess = driverZones.some(zone => zone._id.toString() === shiftZone?._id?.toString());
          if (!hasZoneAccess) {
            console.log(`Skipping ${mealShift} shift - driver not assigned to ${shiftZone?.name || 'unknown'} zone`);
            continue;
          }
        }

        // Check for existing delivery tracking for this date and shift (robust duplicate prevention)
        let existingDelivery = subscription.deliveryTracking?.find(track => {
          // Convert stored date to Indian timezone for comparison
          const trackDate = new Date(track.date);
          const indianTrackDate = new Date(trackDate.getTime() + (5.5 * 60 * 60 * 1000));
          const trackDateStr = indianTrackDate.toISOString().split('T')[0];
          
          // Compare with the input date (already in YYYY-MM-DD format)
          const dateMatches = trackDateStr === date;
          const shiftMatches = track.shift === mealShift;
          
          if (dateMatches && shiftMatches) {
            // console.log(`📋 Found existing delivery tracking for ${date} ${mealShift} shift: ${track._id}`);
            // console.log('Existing Delivery: ', track);
            // console.log('Existing Delivery status : ', subscription._id, track.status);
          }
          
          return dateMatches && shiftMatches;
        });

        // Only create delivery tracking if it doesn't exist
        if (!existingDelivery) {
          // console.log(`➕ Creating new delivery tracking for ${date} ${mealShift} shift (Indian timezone)`);
          
          // Generate unique delivery number
          const deliveryNo = `DEL${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
          
          // Use the selectedDate which is already properly parsed for Indian timezone
          const deliveryDate = new Date(selectedDate);
          
          // Create new delivery tracking entry
          const newTracking = {
            date: deliveryDate,
            shift: mealShift,
            status: 'pending',
            driver: req.user._id, // Assign to current driver
            assignedDriver: req.user._id, // Also set assignedDriver for consistency
            deliveryNo: deliveryNo,
            zone: shiftZone?._id,
            isActive: true,
            checkpoints: [{
              type: 'picked_up',
              timestamp: new Date(),
              notes: `Assigned to driver ${driver.name}`
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
              { new: true } // Return the updated document
            );
            
            // Find the newly created delivery tracking entry with its MongoDB-generated _id
            existingDelivery = updatedSubscription.deliveryTracking.find(track => {
              const trackDate = new Date(track.date);
              trackDate.setHours(0, 0, 0, 0);
              return trackDate.getTime() === selectedDate.getTime() && 
                     track.shift === mealShift && 
                     track.deliveryNo === deliveryNo;
            });
            
            trackingCreated++;
            // console.log(`✅ Created delivery tracking ${deliveryNo} for subscription ${subscription.subscriptionId} - ${mealShift} shift with ID ${existingDelivery._id}`);
          } catch (error) {
            console.error(`❌ Failed to create delivery tracking for ${subscription.subscriptionId}:`, error.message);
            continue;
          }
        } else {
          // Update driver assignment if not already assigned to this driver
          if (!existingDelivery.driver || existingDelivery.driver.toString() !== req.user._id.toString()) {
            try {
              await Subscription.findOneAndUpdate( 
                { 
                  _id: subscription._id,
                  'deliveryTracking._id': existingDelivery._id
                },
                {
                  $set: {
                    'deliveryTracking.$.driver': req.user._id,
                    'deliveryTracking.$.assignedDriver': req.user._id,
                    'deliveryTracking.$.updatedAt': new Date()
                  }
                }
              );
              existingDelivery.driver = req.user._id;
              existingDelivery.assignedDriver = req.user._id;
              // console.log(`🔄 Updated driver assignment for delivery ${existingDelivery.deliveryNo || 'No tracking number'}`);
            } catch (error) {
              console.error(`❌ Failed to update driver assignment:`, error.message);
            }
          }
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
// console.log("Existing Delivery: ", existingDelivery)
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

        // Ensure we have a valid delivery tracking ID
        if (!existingDelivery || !existingDelivery._id) {
          console.error(`❌ No valid delivery tracking ID found for subscription ${subscription._id} - ${mealShift} shift`);
          continue; // Skip this delivery if we don't have a valid ObjectId
        }
console.log("Existing Delivery status : ",subscription._id,actualStatus,  );
        // Create delivery record with zone information and sequence data
        const delivery = {
          _id: existingDelivery._id, // Always use the delivery tracking ObjectId
          subscriptionId: subscription._id,
          deliveryNo: existingDelivery.deliveryNo,
          sequencePosition: existingDelivery?.sequencePosition,
          deliveryNumber: existingDelivery?.deliveryNumber,
          routeId: existingDelivery?.routeId,
          user: {
            _id: subscription.user._id,
            name: subscription.user.name,
            phone: subscription.user.phone,
            email: subscription.user.email
          },
          mealPlan: actualMealPlan,
          displayMealName: displayMealName,
          seller: {
            _id: subscription.seller._id,
            name: subscription.seller.name,
            businessName: subscription.seller.businessName,
            phone: subscription.seller.phone
          },
          deliveryAddress: subscription.deliveryAddress,
          date: new Date(date),
          shift: mealShift,
          zone: shiftZone, // Add zone information
          deliveryStatus: actualStatus,
          isSkipped: isSkipped,
          isReplaced: !!replacement,
          isCustomized: isCustomized,
          skipReason: skipReason,
          replacementDetails: replacementDetails,
          customizationDetails: customizationDetails,
          deliveredAt: existingDelivery?.deliveredAt,
          deliveredBy: existingDelivery?.deliveredBy,
          driver: existingDelivery?.driver || req.user._id,
          assignedDriver: existingDelivery?.assignedDriver || req.user._id,
          deliveryNotes: existingDelivery?.notes,
          checkpoints: existingDelivery?.checkpoints || [],
          ETA: existingDelivery?.ETA,
          assignedDriver: req.user._id,
          canComplete: !isSkipped && actualStatus !== 'delivered'
        };

        // Apply status filter
        if (status !== 'all') {
          switch(status) {
            case 'pending':
              if (!['pending', 'customized'].includes(delivery.deliveryStatus)) continue;
              break;
            case 'delivered':
              if (delivery.deliveryStatus !== 'delivered') continue;
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
            default:
              continue;
          }
        }

        deliveries.push(delivery);
      }
    }

    console.log(`📊 Delivery tracking summary: ${trackingCreated} created, ${trackingFound} found existing`);
    console.log(`📦 Generated ${deliveries.length} zone-filtered deliveries for ${date}`);

    // Auto-assign deliveries to DriverRoute system for route scheduling
    try {
      // Group deliveries by shift for route creation
      const shiftGroups = { morning: [], evening: [] };
      deliveries.forEach(delivery => {
        if (['morning', 'evening'].includes(delivery.shift)) {
          shiftGroups[delivery.shift].push(delivery);
        }
      });

      // Create routes for each shift that has deliveries
      for (const [shiftType, shiftDeliveries] of Object.entries(shiftGroups)) {
        if (shiftDeliveries.length > 0) {
          // Check if route already exists with reasonable number of stops
          const routeDate = new Date(date);
          routeDate.setHours(0, 0, 0, 0);
          
          const existingRoute = await DriverRoute.findOne({
            driverId: req.user._id,
            date: {
              $gte: routeDate,
              $lte: new Date(routeDate.getTime() + 24 * 60 * 60 * 1000)
            },
            shift: shiftType
          });

          // Only auto-assign if route doesn't exist or has very few stops compared to deliveries
          if (!existingRoute || existingRoute.stops.length < shiftDeliveries.length * 0.8) {
            await autoAssignDeliveriesToDriverRoute(req.user._id, shiftDeliveries, date, shiftType);
            console.log(`📍 Auto-assigned ${shiftDeliveries.length} deliveries to ${shiftType} route`);
          } else {
            console.log(`📍 Route already exists for ${shiftType} with ${existingRoute.stops.length} stops`);
          }
        }
      }
    } catch (autoAssignError) {
      console.error('Error auto-assigning deliveries to route:', autoAssignError);
      // Don't fail the request if route creation fails
    }

    // Apply pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const paginatedDeliveries = deliveries.slice(skip, skip + parseInt(limit));

    // Calculate statistics
    const stats = {
      total: deliveries.length,
      pending: deliveries.filter(d => ['pending', 'customized', 'replaced'].includes(d.deliveryStatus)).length,
      delivered: deliveries.filter(d => d.deliveryStatus === 'delivered').length,
      skipped: deliveries.filter(d => d.isSkipped).length,
      replaced: deliveries.filter(d => d.isReplaced).length,
      customized: deliveries.filter(d => d.isCustomized).length,
      morning: deliveries.filter(d => d.shift === 'morning').length,
      evening: deliveries.filter(d => d.shift === 'evening').length,
      successRate: deliveries.length > 0 ? 
        Math.round((deliveries.filter(d => d.deliveryStatus === 'delivered').length / deliveries.length) * 100) : 0,
      trackingCreated,
      trackingFound
    };

    res.status(200).json({
      success: true,
      data: paginatedDeliveries,
      stats,
      driverInfo: {
        zones: driverZones.map(zone => ({ id: zone._id, name: zone.name, code: zone.code })),
        shifts: driverShifts,
        name: driver.name
      },
      meta: {
        date,
        shift,
        status,
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
    console.error('Error fetching zone-based driver daily deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily deliveries',
      error: error.message
    });
  }
};

/**
 * Update delivery status using delivery tracking ObjectId
 * PUT /api/drivers/delivery/:deliveryId/status
 */
exports.updateDynamicDeliveryStatus = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { status, notes, deliveredAt } = req.body;

    console.log('Updating delivery status - ID:', deliveryId, 'Status:', status);

    // Validate that deliveryId is a MongoDB ObjectId
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(deliveryId);
    if (!isObjectId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery ID format. Expected MongoDB ObjectId.'
      });
    }
    
    // Find subscription with this delivery tracking ID
    const subscription = await Subscription.findOne({
      'deliveryTracking._id': deliveryId
    });
    
    console.log("subscription found:", !!subscription);
    
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    // Find the specific delivery entry
    const deliveryEntry = subscription.deliveryTracking.find(entry => 
      entry._id.toString() === deliveryId
    );

    if (!deliveryEntry) {
      return res.status(404).json({
        success: false,
        message: 'Delivery tracking entry not found'
      });
    }

    const deliveryDate = new Date(deliveryEntry.date);
    const shift = deliveryEntry.shift;
    
    console.log(`Found delivery: ${deliveryId} for subscription ${subscription._id} on ${deliveryDate.toDateString()} ${shift} shift`);

    // Validate status
    if (!['pending', 'delivered', 'failed', 'skipped', 'replaced'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery status'
      });
    }

    // Validate shift
    if (!['morning', 'evening'].includes(shift)) {
      return res.status(400).json({
        success: false,
        message: `Invalid shift: ${shift}. Must be 'morning' or 'evening'`
      });
    }

    // Check if meal was already marked as skipped (don't allow completion)
    const isAlreadySkipped = subscription.skippedMeals?.some(skip => {
      const skipDate = new Date(skip.date);
      return skipDate.toDateString() === deliveryDate.toDateString() && skip.shift === shift;
    });

    if (isAlreadySkipped && status === 'delivered') {
      return res.status(400).json({
        success: false,
        message: `Cannot mark a skipped ${shift} meal as delivered`
      });
    }

    // Store previous status for meal count logic
    const previousStatus = deliveryEntry.status || 'pending';
    const wasDelivered = previousStatus === 'delivered';
    const willBeDelivered = status === 'delivered';

    // Store existing sequence data before update
    const existingSequencePosition = deliveryEntry.sequencePosition;
    const existingDeliveryNumber = deliveryEntry.deliveryNumber;
    const existingRouteId = deliveryEntry.routeId;
    
    // Update the delivery entry
    deliveryEntry.status = status;
    if (status === 'delivered') {
      deliveryEntry.deliveredAt = deliveredAt || new Date();
      deliveryEntry.deliveredBy = req.user._id;
    }
    if (notes) deliveryEntry.notes = notes;
    deliveryEntry.updatedAt = new Date();
    
    // Add checkpoint for status change
    if (!deliveryEntry.checkpoints) {
      deliveryEntry.checkpoints = [];
    }
    deliveryEntry.checkpoints.push({
      type: status === 'delivered' ? 'delivered' : status === 'failed' ? 'delivery_failed' : 'status_updated',
      timestamp: new Date(),
      notes: `Status updated to ${status} by driver ${req.user.name || 'Driver'}`
    });
    
    // Preserve sequence data
    if (existingSequencePosition !== undefined) {
      deliveryEntry.sequencePosition = existingSequencePosition;
    }
    if (existingDeliveryNumber) {
      deliveryEntry.deliveryNumber = existingDeliveryNumber;
    }
    if (existingRouteId) {
      deliveryEntry.routeId = existingRouteId;
    }
    
    console.log(`🔄 Updated delivery ${deliveryId} - preserved sequencePosition: ${existingSequencePosition}`);

    // Handle meal count deduction/restoration logic
    let totalDeliveredChanges = 0;
    if (!wasDelivered && willBeDelivered) {
      totalDeliveredChanges = 1; // Meal delivered for first time
    } else if (wasDelivered && !willBeDelivered) {
      console.log("Restoring meal count - delivery status changed from delivered to another status");
      totalDeliveredChanges = -1; // Meal was delivered but changed to another status
    }

    console.log("totalDeliveredChanges is:", totalDeliveredChanges);
    
    if (totalDeliveredChanges !== 0) {
      // Update meal counts
      subscription.mealCounts.mealsDelivered = (subscription.mealCounts.mealsDelivered || 0) + totalDeliveredChanges;
      subscription.mealCounts.mealsRemaining = Math.max(0, 
        (subscription.mealCounts.totalMeals || 0) - (subscription.mealCounts.mealsDelivered || 0)
      ); // Deducting meal count from total meals
      
      // Track Sunday vs regular meals
      if (deliveryDate.getDay() === 0) {
        subscription.mealCounts.sundayMealsDelivered = Math.max(0, 
          (subscription.mealCounts.sundayMealsDelivered || 0) + totalDeliveredChanges);
      } else {
        subscription.mealCounts.regularMealsDelivered = Math.max(0, 
          (subscription.mealCounts.regularMealsDelivered || 0) + totalDeliveredChanges);
      }
      
      const action = totalDeliveredChanges > 0 ? 'Deducted' : 'Restored';
      console.log(`${action} meal for subscription ${subscription._id}. Remaining: ${subscription.mealCounts.mealsRemaining}`);
    }

    await subscription.save();

    console.log(`Updated delivery status to ${status} for subscription ${subscription._id} (${shift} shift)`);

    // ===== SYNCHRONIZE WITH DRIVER ROUTE SCHEMA =====
    if (status === 'delivered') {
      try {
        // Find the driver route for this date and shift
        const routeDate = new Date(deliveryDate);
        const driverRoute = await DriverRoute.findOne({
          driverId: req.user._id,
          date: {
            $gte: new Date(routeDate.setHours(0, 0, 0, 0)),
            $lt: new Date(routeDate.setHours(23, 59, 59, 999))
          },
          shift: shift
        });

        if (driverRoute) {
          console.log(`🔄 Synchronizing with DriverRoute for ${shift} shift`);
          console.log(`Looking for delivery: subscriptionId=${subscription._id}, deliveryId=${deliveryId}, shift=${shift}`);
          console.log(`DriverRoute has ${driverRoute.stops.length} stops`);
          
          // Find the corresponding stop in the driver route using multiple strategies
          const stopIndex = driverRoute.stops.findIndex((stop, index) => {
            console.log(`Checking stop ${index}:`, {
              stopSubscriptionId: stop.subscriptionId?.toString(),
              stopOrderId: stop.orderId,
              stopSequenceNumber: stop.sequenceNumber,
              customerName: stop.address?.name
            });
            
            // Strategy 1: Match by subscription ID (most reliable)
            if (stop.subscriptionId && stop.subscriptionId.toString() === subscription._id.toString()) {
              console.log(`✅ Found matching subscription ID for ${stop.address?.name}`);
              return true; // Match found - this is the correct stop
            }

            // Strategy 2: Match by delivery tracking ObjectId
            if (stop.deliveryTrackingId && stop.deliveryTrackingId.toString() === deliveryId) {
              console.log(`✅ Found matching delivery tracking ID for ${stop.address?.name}`);
              return true;
            }

            // Strategy 3: Match by sequence number if available
            if (deliveryEntry?.sequencePosition && stop.sequenceNumber === deliveryEntry.sequencePosition) {
              console.log(`✅ Found matching sequence number for ${stop.address?.name}`);
              return true;
            }

            return false;
          });

          console.log(`Stop search result: stopIndex=${stopIndex}`);

          if (stopIndex !== -1) {
            // Update the stop status
            console.log(`✅ Updating existing stop at index ${stopIndex}`);
            driverRoute.stops[stopIndex].status = 'delivered';
            driverRoute.stops[stopIndex].actualArrival = new Date(deliveredAt || Date.now());
            driverRoute.stops[stopIndex].deliveryNotes = notes || '';
            driverRoute.stops[stopIndex].completedAt = new Date();

            // Update route progress
            driverRoute.completedStops = driverRoute.stops.filter(stop => 
              stop.status === 'delivered'
            ).length;

            // Update current stop index
            driverRoute.currentStopIndex = Math.max(driverRoute.currentStopIndex || 0, stopIndex + 1);

            // Update route status
            if (driverRoute.completedStops === driverRoute.totalStops) {
              driverRoute.routeStatus = 'completed';
              driverRoute.endTime = new Date();
              if (driverRoute.startTime) {
                driverRoute.actualDuration = Math.round(
                  (driverRoute.endTime - driverRoute.startTime) / (1000 * 60)
                ); // Duration in minutes
              }
            } else if (driverRoute.routeStatus === 'pending' && driverRoute.completedStops === 1) {
              // First delivery - mark route as started
              driverRoute.routeStatus = 'active';
              driverRoute.startTime = new Date();
            } else if (driverRoute.routeStatus === 'pending') {
              // Route has started
              driverRoute.routeStatus = 'active';
              if (!driverRoute.startTime) {
                driverRoute.startTime = new Date();
              }
            }

            driverRoute.updatedAt = new Date();
            await driverRoute.save();

            console.log(`✅ Successfully synchronized DriverRoute stop ${stopIndex + 1} for ${shift} shift`);
          } else {
            console.warn(`❌ Could not find matching stop in DriverRoute for delivery ${deliveryId} (${shift} shift)`);
            console.warn(`This could lead to data inconsistency. Route has ${driverRoute.stops.length} stops.`);
            // Don't create a new stop here to avoid duplicates
            // The stop should already exist from route creation or sequence assignment
          }
        } else {
          console.warn(`❌ No DriverRoute found for driver ${req.user._id} on ${deliveryDate.toDateString()} ${shift} shift`);
        }
      } catch (routeError) {
        console.error('Error synchronizing with DriverRoute:', routeError);
        // Don't fail the delivery update if route sync fails
      }
    }

    // Send notifications if delivery was completed
    if (status === 'delivered') {
      try {
        // Get driver information
        const driver = await User.findById(req.user._id);

        // Prepare delivery data for notification
        const deliveryData = {
          _id: deliveryId,
          user: {
            _id: subscription.user,
            name: subscription.user?.name || 'User',
            email: subscription.user?.email
          },
          mealPlan: subscription.mealPlan,
          displayMealName: subscription.mealPlan?.name,
          seller: {
            _id: subscription.mealPlan?.seller,
            name: subscription.seller?.name || subscription.seller?.businessName
          },
          shift: shift,
          deliveredAt: deliveredAt || new Date(),
          subscriptionId: subscription._id
        };

        // Get user details if not populated
        if (!subscription.user?.name) {
          const user = await User.findById(subscription.user);
          if (user) {
            deliveryData.user = {
              _id: user._id,
              name: user.name,
              email: user.email
            };
          }
        }

        // Send delivery completion notifications
        await deliveryNotificationService.sendDeliveryCompletedNotification(
          deliveryData,
          {
            name: driver?.name || 'Delivery Driver',
            phone: driver?.phone,
            _id: driver?._id
          }
        );
      } catch (notificationError) {
        console.error('Error sending delivery notifications:', notificationError);
        // Don't fail the delivery update if notifications fail
      }
    }

    res.status(200).json({
      success: true,
      message: `Delivery status updated successfully for ${shift} shift`,
      data: {
        deliveryId,
        status,
        updatedShift: shift,
        notes,
        mealCounts: {
          delivered: subscription.mealCounts.mealsDelivered,
          remaining: subscription.mealCounts.mealsRemaining,
          total: subscription.mealCounts.totalMeals
        },
        isSkipped: status === 'skipped',
        canComplete: status !== 'skipped'
      }
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
 * Auto-assign deliveries to driver route system
 * @param {String} driverId - Driver's user ID
 * @param {Array} deliveries - Array of delivery objects
 * @param {String} date - Delivery date
 * @param {String} shift - Delivery shift
 */
async function autoAssignDeliveriesToDriverRoute(driverId, deliveries, date, shift) {
  try {
    // Filter only pending deliveries that haven't been assigned
    const pendingDeliveries = deliveries.filter(delivery => 
      delivery.deliveryStatus === 'pending' && !delivery.isSkipped
    );

    if (pendingDeliveries.length === 0) {
      return;
    }

    // Find or create driver route for this date and shift
    const routeDate = new Date(date);
    routeDate.setHours(0, 0, 0, 0);

    let driverRoute = await DriverRoute.findOne({
      driverId,
      date: {
        $gte: routeDate,
        $lte: new Date(routeDate.getTime() + 24 * 60 * 60 * 1000)
      },
      shift
    });

    // Get driver info for service area and capacity
    const driver = await User.findById(driverId);
    const serviceArea = driver.driverProfile?.serviceArea || 'default';
    const maxCapacity = driver.driverProfile?.maxCapacity || 50;

    if (!driverRoute) {
      // Create new route for driver
      driverRoute = await DriverRoute.create({
        driverId,
        date: routeDate,
        shift,
        serviceArea,
        maxCapacity,
        stops: [],
        routeStatus: 'pending'
      });
    }

    // Add pending deliveries as stops to the route
    for (const delivery of pendingDeliveries) {
      // Check if this delivery is already in the route using subscription + date + shift
      const existingStop = driverRoute.stops.find(stop => 
        stop.subscriptionId.toString() === delivery.subscriptionId.toString()
      );

      if (!existingStop) {
        const stopData = {
          subscriptionId: delivery.subscriptionId,
          orderId: delivery._id,
          userId: delivery.user._id,
          address: {
            name: delivery.user.name,
            phone: delivery.user.phone,
            street: delivery.deliveryAddress.street || delivery.deliveryAddress.address,
            city: delivery.deliveryAddress.city,
            area: delivery.deliveryAddress.area || delivery.deliveryAddress.city,
            coordinates: {
              lat: delivery.deliveryAddress.coordinates?.lat || 22.763813,
              lng: delivery.deliveryAddress.coordinates?.lng || 75.885822
            }
          },
          mealDetails: {
            items: delivery.mealItems || [delivery.mealPlan?.name || 'Thali'],
            specialInstructions: delivery.customizationDetails?.customizationSummary || delivery.replacementDetails?.summary,
            thaliCount: 1
          }
        };

        await driverRoute.addStop(stopData);
      }
    }

    console.log(`Auto-assigned ${pendingDeliveries.length} deliveries to driver route for ${driver.name} (${date} ${shift})`);
  } catch (error) {
    console.error('Error in autoAssignDeliveriesToDriverRoute:', error);
    throw error;
  }
}

module.exports = {
  getDriverDailyDeliveries: exports.getDriverDailyDeliveries,
  updateDynamicDeliveryStatus: exports.updateDynamicDeliveryStatus
};