const Subscription = require('../models/Subscription');
const DriverRoute = require('../models/DriverRoute');
const User = require('../models/User');
const MealPlan = require('../models/MealPlan');
const { validationResult } = require('express-validator');
const deliveryNotificationService = require('../services/deliveryNotificationService');

/**
 * Get delivery list for a specific driver
 * GET /api/driver/deliveries
 */
exports.getDriverDeliveryList = async (req, res) => {
  try {
    const { driverId } = req.query;
    const { date, shift, status } = req.query;
    
    console.log('Controller - User role:', req.user.role);
    console.log('Controller - User ID:', req.user._id);
    console.log('Controller - Driver ID from query:', driverId);
    
    // Validate driver access - allow admin, driver, delivery role, or for testing purposes
    if (req.user.role !== 'admin' && req.user.role !== 'driver' && req.user.role !== 'delivery') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - insufficient privileges'
      });
    }
    
    // For non-admin users, they can only access their own deliveries (except for testing with buyer role)
    if ((req.user.role === 'driver' || req.user.role === 'delivery') && driverId && req.user._id.toString() !== driverId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied - can only access own deliveries'
      });
    }
    
    // If driverId is not provided and user is a driver/delivery, use their own ID
    const targetDriverId = driverId || ((req.user.role === 'driver' || req.user.role === 'delivery') ? req.user._id.toString() : null);

    const deliveryDate = new Date(date || new Date());
    deliveryDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(deliveryDate);
    nextDay.setDate(nextDay.getDate() + 1);

    // Build aggregation pipeline
    const pipeline = [
      // Match active subscriptions
      {
        $match: {
          status: 'active',
          startDate: { $lte: deliveryDate },
          endDate: { $gte: deliveryDate }
        }
      },
      
      // Lookup user details
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      
      // Lookup meal plan details
      {
        $lookup: {
          from: 'mealplans',
          localField: 'mealPlan',
          foreignField: '_id',
          as: 'mealPlan'
        }
      },
      { $unwind: '$mealPlan' },
      
      // Lookup seller details
      {
        $lookup: {
          from: 'users',
          localField: 'mealPlan.seller',
          foreignField: '_id',
          as: 'seller'
        }
      },
      { $unwind: '$seller' },
      
      // Add delivery tracking data
      {
        $addFields: {
          // Get delivery tracking for this specific date
          todaysDelivery: {
            $arrayElemAt: [
              {
                $filter: {
                  input: '$deliveryTracking',
                  cond: {
                    $and: [
                      { $eq: [{ $dateToString: { format: '%Y-%m-%d', date: '$$this.date' } }, date] },
                      shift ? { $eq: ['$$this.shift', shift] } : { $ne: ['$$this.shift', null] }
                    ]
                  }
                }
              }, 0
            ]
          },
          
          // Get day-wise address for this date
          deliveryAddress: {
            $cond: {
              if: { $eq: ['$deliverySettings.addressSettings.useDefaultForAll', true] },
              then: '$deliveryAddress',
              else: {
                $let: {
                  vars: {
                    dayOfWeek: { $toLower: { $dayOfWeek: deliveryDate } },
                    dayAddress: {
                      $arrayElemAt: [
                        {
                          $filter: {
                            input: '$deliverySettings.dailyAddresses',
                            cond: {
                              $and: [
                                { $eq: ['$$this.date', deliveryDate] },
                                shift ? { $eq: ['$$this.shift', shift] } : true
                              ]
                            }
                          }
                        }, 0
                      ]
                    }
                  },
                  in: {
                    $cond: {
                      if: { $ne: ['$$dayAddress', null] },
                      then: '$$dayAddress.address',
                      else: '$deliveryAddress'
                    }
                  }
                }
              }
            }
          }
        }
      },
      
      // Only include subscriptions that have delivery scheduled for this date
      {
        $match: {
          'todaysDelivery': { $ne: null }
        }
      },
      
      // Filter by shift if specified
      ...(shift ? [{ $match: { 'todaysDelivery.shift': shift } }] : []),
      
      // Filter by status if specified
      ...(status && status !== 'all' ? [
        {
          $match: {
            $or: [
              ...(status === 'pending' ? [{ 'todaysDelivery.deliveryStatus': { $in: [null, 'pending'] } }] : []),
              ...(status === 'delivered' ? [{ 'todaysDelivery.deliveryStatus': 'delivered' }] : []),
              ...(status === 'skipped' ? [{ 'todaysDelivery.isSkipped': true }] : []),
              ...(status === 'replaced' ? [{ 'todaysDelivery.isReplaced': true }] : [])
            ]
          }
        }
      ] : []),
      
      // Project final structure
      {
        $project: {
          _id: 1,
          subscriptionId: 1,
          user: {
            _id: '$user._id',
            name: '$user.name',
            phone: '$user.phone',
            email: '$user.email'
          },
          mealPlan: {
            _id: '$mealPlan._id',
            name: '$mealPlan.name',
            description: '$mealPlan.description',
            items: '$mealPlan.items',
            planType: '$mealPlan.planType'
          },
          seller: {
            _id: '$seller._id',
            name: '$seller.name',
            businessName: '$seller.businessName',
            phone: '$seller.phone'
          },
          subscription: {
            subscriptionId: '$subscriptionId',
            planType: '$planType',
            shift: '$shift'
          },
          deliveryAddress: '$deliveryAddress',
          date: '$todaysDelivery.date',
          shift: '$todaysDelivery.shift',
          deliveryStatus: { $ifNull: ['$todaysDelivery.deliveryStatus', 'pending'] },
          sequencePosition: '$todaysDelivery.sequencePosition',
          deliveryNumber: '$todaysDelivery.deliveryNumber',
          routeId: '$todaysDelivery.routeId',
          deliveryTrackingId: '$todaysDelivery._id',
          isSkipped: { $ifNull: ['$todaysDelivery.isSkipped', false] },
          isReplaced: { $ifNull: ['$todaysDelivery.isReplaced', false] },
          isCustomized: { $ifNull: ['$todaysDelivery.isCustomized', false] },
          replacementThali: '$todaysDelivery.replacementThali',
          replacementReason: '$todaysDelivery.replacementReason',
          skipReason: '$todaysDelivery.skipReason',
          customizations: '$todaysDelivery.customizations',
          deliveredAt: '$todaysDelivery.deliveredAt',
          deliveredBy: '$todaysDelivery.deliveredBy',
          deliveryNotes: '$todaysDelivery.deliveryNotes'
        }
      },
      
      // Sort by shift, sequence position, and user name
      {
        $sort: {
          shift: 1,
          sequencePosition: 1,
          'user.name': 1
        }
      }
    ];

    const deliveries = await Subscription.aggregate(pipeline);

    // Calculate statistics
    const stats = {
      total: deliveries.length,
      pending: deliveries.filter(d => d.deliveryStatus === 'pending').length,
      delivered: deliveries.filter(d => d.deliveryStatus === 'delivered').length,
      skipped: deliveries.filter(d => d.isSkipped).length,
      replaced: deliveries.filter(d => d.isReplaced).length,
      morning: deliveries.filter(d => d.shift === 'morning').length,
      evening: deliveries.filter(d => d.shift === 'evening').length
    };

    res.status(200).json({
      success: true,
      data: deliveries,
      stats,
      meta: {
        date,
        shift: shift || 'all',
        status: status || 'all',
        driverId
      }
    });

  } catch (error) {
    console.error('Error fetching driver deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deliveries',
      error: error.message
    });
  }
};

/**
 * Update single delivery status
 * PUT /api/driver/delivery/:deliveryId/status
 */
exports.updateDeliveryStatus = async (req, res) => {
  try {
    const { deliveryId } = req.params;
    const { status, notes, deliveredAt } = req.body;
    const driverId = req.user._id;

    // Validate input
    if (!['pending', 'delivered', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery status'
      });
    }

    // Find the subscription by the delivery tracking entry
    const subscription = await Subscription.findOne({
      'deliveryTracking._id': deliveryId
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Delivery not found'
      });
    }

    // Find and update the specific delivery tracking entry
    const deliveryIndex = subscription.deliveryTracking.findIndex(
      delivery => delivery._id.toString() === deliveryId
    );

    if (deliveryIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Delivery tracking entry not found'
      });
    }

    // Update the delivery status (preserve existing sequencePosition and other fields)
    const deliveryTracking = subscription.deliveryTracking[deliveryIndex];
     
    // Store the existing sequencePosition and other important fields before update
    const existingSequencePosition = deliveryTracking.sequencePosition;
    const existingDeliveryNumber = deliveryTracking.deliveryNumber;
    const existingRouteId = deliveryTracking.routeId;
    
    subscription.deliveryTracking[deliveryIndex].status = status;
    subscription.deliveryTracking[deliveryIndex].deliveredBy = driverId;
    subscription.deliveryTracking[deliveryIndex].notes = notes;
    
    // Preserve the sequence position and route information
    if (existingSequencePosition) {
      subscription.deliveryTracking[deliveryIndex].sequencePosition = existingSequencePosition;
    }
    if (existingDeliveryNumber) {
      subscription.deliveryTracking[deliveryIndex].deliveryNumber = existingDeliveryNumber;
    }
    if (existingRouteId) {
      subscription.deliveryTracking[deliveryIndex].routeId = existingRouteId;
    }
    
    if (status === 'delivered') {
      subscription.deliveryTracking[deliveryIndex].deliveredAt = new Date(deliveredAt || Date.now());
      
      // Add a completion checkpoint while preserving sequence position
      if (!subscription.deliveryTracking[deliveryIndex].checkpoints) {
        subscription.deliveryTracking[deliveryIndex].checkpoints = [];
      }
      
      subscription.deliveryTracking[deliveryIndex].checkpoints.push({
        type: 'delivered',
        timestamp: new Date(),
        notes: notes || `Delivery completed at sequence position ${existingSequencePosition || 'unknown'}`,
        sequencePosition: existingSequencePosition
      });
    }

    console.log(`📝 Updating delivery ${deliveryId} - preserving sequencePosition: ${existingSequencePosition}`);

    // Save the subscription
    await subscription.save();

        // ===== ALSO UPDATE DRIVER ROUTE SCHEMA =====
        // const deliveryTracking = subscription.deliveryTracking[deliveryIndex];
        
        if (deliveryTracking && status === 'delivered') {
          const routeDate = new Date(deliveryTracking.date);
          const shift = deliveryTracking.shift;

          console.log(`🔍 Looking for DriverRoute for driver ${driverId}, date: ${routeDate.toDateString()}, shift: ${shift}`);

          // Find and update the driver route
          const driverRoute = await DriverRoute.findOne({
            driverId,
            date: {
              $gte: new Date(routeDate.setHours(0, 0, 0, 0)),
              $lt: new Date(routeDate.setHours(23, 59, 59, 999))
            },
            shift
          });

          if (driverRoute) {
            console.log(`📋 Found DriverRoute with ${driverRoute.stops.length} stops`);
            
            // Update the specific stop in the route using multiple matching strategies
            const stopIndex = driverRoute.stops.findIndex(stop => {
              console.log(`🔍 Checking stop: orderId=${stop.orderId}, subscriptionId=${stop.subscriptionId}, userId=${stop.userId}, sequenceNumber=${stop.sequenceNumber}`);
              
              // Strategy 1: orderId matches deliveryTracking._id
              if (stop.orderId === deliveryId) {
                console.log(`✅ Match found via orderId: ${stop.orderId} === ${deliveryId}`);
                return true;
              }
              
              // Strategy 2: subscriptionId matches
              if (stop.subscriptionId && subscription._id && 
                  stop.subscriptionId.toString() === subscription._id.toString()) {
                console.log(`✅ Match found via subscriptionId: ${stop.subscriptionId} === ${subscription._id}`);
                return true;
              }
              
              // Strategy 3: userId matches and same customer details
              if (stop.userId && subscription.user &&
                  stop.userId.toString() === subscription.user.toString()) {
                console.log(`✅ Match found via userId: ${stop.userId} === ${subscription.user}`);
                return true;
              }

              // Strategy 4: Sequence position matches (if available)
              if (stop.sequenceNumber && deliveryTracking.sequencePosition && 
                  stop.sequenceNumber === deliveryTracking.sequencePosition) {
                console.log(`✅ Match found via sequence position: ${stop.sequenceNumber} === ${deliveryTracking.sequencePosition}`);
                return true;
              }

              // Strategy 5: Customer name and address match (fuzzy matching)
              if (stop.address && subscription.deliveryAddress) {
                const nameMatch = stop.address.name && 
                  stop.address.name.toLowerCase().includes(subscription.user?.name?.toLowerCase() || '');
                const addressMatch = stop.address.street && subscription.deliveryAddress.street &&
                  stop.address.street.toLowerCase() === subscription.deliveryAddress.street.toLowerCase();
                
                if (nameMatch || addressMatch) {
                  console.log(`✅ Match found via customer details: name=${nameMatch}, address=${addressMatch}`);
                  return true;
                }
              }
              
              return false;
            });

            if (stopIndex !== -1) {
              const completionTime = new Date(deliveredAt || Date.now());
              
              console.log(`✅ Updating DriverRoute stop at index ${stopIndex}`);
              
              // Update the stop status
              driverRoute.stops[stopIndex].status = 'delivered';
              driverRoute.stops[stopIndex].actualArrival = completionTime;
              driverRoute.stops[stopIndex].deliveryNotes = notes || '';
              driverRoute.stops[stopIndex].completedAt = completionTime;
              
              // Update route progress
              driverRoute.completedStops = driverRoute.stops.filter(stop => 
                stop.status === 'delivered'
              ).length;

              // Update current stop index
              driverRoute.currentStopIndex = Math.max(driverRoute.currentStopIndex, stopIndex + 1);

              // Check if route is completed
              if (driverRoute.completedStops === driverRoute.totalStops) {
                driverRoute.routeStatus = 'completed';
                driverRoute.endTime = completionTime;
                driverRoute.actualDuration = Math.round(
                  (completionTime - driverRoute.startTime) / (1000 * 60)
                ); // Duration in minutes
              } else if (driverRoute.routeStatus === 'pending' && driverRoute.completedStops === 1) {
                // First delivery - mark route as started
                driverRoute.routeStatus = 'active';
                driverRoute.startTime = completionTime;
              } else if (driverRoute.routeStatus === 'pending') {
                // Route has started
                driverRoute.routeStatus = 'active';
                if (!driverRoute.startTime) {
                  driverRoute.startTime = completionTime;
                }
              }

              driverRoute.updatedAt = completionTime;
              await driverRoute.save();

              console.log(`✅ Successfully updated DriverRoute stop at index ${stopIndex} for delivery ${deliveryId}`);
            } else {
              console.error(`❌ Could not find matching stop in DriverRoute for delivery ${deliveryId}`);
              console.log(`📋 Available stops:`, driverRoute.stops.map((stop, index) => ({
                index,
                orderId: stop.orderId,
                subscriptionId: stop.subscriptionId,
                userId: stop.userId,
                customerName: stop.address?.name,
                status: stop.status
              })));
              console.log(`🔍 Looking for: deliveryId=${deliveryId}, subscriptionId=${subscription._id}, userId=${subscription.user}`);
            }
          } else {
            console.error(`❌ Could not find DriverRoute for driver ${driverId} on ${deliveryTracking.date} ${deliveryTracking.shift}`);
          }
        }    // Update statistics
    await subscription.updateDeliveryStats();

    res.status(200).json({
      success: true,
      message: `Delivery marked as ${status}`,
      data: {
        subscriptionId: subscription.subscriptionId,
        deliveryId,
        status,
        deliveredAt: subscription.deliveryTracking[deliveryIndex].deliveredAt,
        deliveredBy: driverId,
        subscriptionUpdated: true,
        driverRouteUpdated: status === 'delivered' ? true : false
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
 * Bulk update delivery status
 * PUT /api/driver/deliveries/bulk-status
 */
exports.bulkUpdateDeliveryStatus = async (req, res) => {
  try {
    const { deliveryIds, status, notes, deliveredAt } = req.body;
    const driverId = req.user._id;

    // Validate input
    if (!Array.isArray(deliveryIds) || deliveryIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Delivery IDs array is required'
      });
    }

    if (!['pending', 'delivered', 'failed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid delivery status'
      });
    }

    const updatedDeliveries = [];
    const errors = [];

    // Process each delivery
    for (const deliveryId of deliveryIds) {
      try {
        console.log(`🔄 Bulk processing delivery: ${deliveryId} -> ${status}`);

        // Validate that deliveryId is a MongoDB ObjectId
        const isObjectId = /^[0-9a-fA-F]{24}$/.test(deliveryId);
        if (!isObjectId) {
          errors.push({ deliveryId, error: 'Invalid delivery ID format. Expected MongoDB ObjectId.' });
          continue;
        }

        // Find subscription containing this delivery
        const subscription = await Subscription.findOne({
          'deliveryTracking._id': deliveryId
        });

        if (!subscription) {
          errors.push({ deliveryId, error: 'Delivery not found' });
          continue;
        }

        // Find and update the specific delivery
        const deliveryEntry = subscription.deliveryTracking.find(
          delivery => delivery._id.toString() === deliveryId
        );

        if (!deliveryEntry) {
          errors.push({ deliveryId, error: 'Delivery tracking entry not found' });
          continue;
        }

        const deliveryDate = new Date(deliveryEntry.date);
        const shift = deliveryEntry.shift;

        // Validate shift
        if (!['morning', 'evening'].includes(shift)) {
          errors.push({ deliveryId, error: `Invalid shift: ${shift}. Must be 'morning' or 'evening'` });
          continue;
        }

        // Check if meal was already marked as skipped (don't allow completion)
        const isAlreadySkipped = subscription.skippedMeals?.some(skip => {
          const skipDate = new Date(skip.date);
          return skipDate.toDateString() === deliveryDate.toDateString() && skip.shift === shift;
        });

        if (isAlreadySkipped && status === 'delivered') {
          errors.push({ deliveryId, error: `Cannot mark a skipped ${shift} meal as delivered` });
          continue;
        }

        // Store previous status for meal count logic
        const previousStatus = deliveryEntry.status || 'pending';
        const wasDelivered = previousStatus === 'delivered';
        const willBeDelivered = status === 'delivered';

        // Store existing sequence data before update
        const existingSequencePosition = deliveryEntry.sequencePosition;
        const existingDeliveryNumber = deliveryEntry.deliveryNumber;
        const existingRouteId = deliveryEntry.routeId;

        // Update delivery status with comprehensive logic
        deliveryEntry.status = status;
        if (status === 'delivered') {
          deliveryEntry.deliveredAt = deliveredAt || new Date();
          deliveryEntry.deliveredBy = driverId;
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
          notes: `Bulk status updated to ${status} by driver ${req.user.name || 'Driver'}`
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

        console.log(`🔄 Bulk updated delivery ${deliveryId} - preserved sequencePosition: ${existingSequencePosition}`);

        // Handle meal count deduction/restoration logic
        let totalDeliveredChanges = 0;
        if (!wasDelivered && willBeDelivered) {
          totalDeliveredChanges = 1; // Meal delivered for first time
        } else if (wasDelivered && !willBeDelivered) {
          console.log("Bulk update: Restoring meal count - delivery status changed from delivered to another status");
          totalDeliveredChanges = -1; // Meal was delivered but changed to another status
        }

        console.log(`Bulk update totalDeliveredChanges for ${deliveryId}:`, totalDeliveredChanges);

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
          console.log(`Bulk update: ${action} meal for subscription ${subscription._id}. Remaining: ${subscription.mealCounts.mealsRemaining}`);
        }

        await subscription.save();

        // ===== ENHANCED DRIVER ROUTE SYNCHRONIZATION =====
        if (status === 'delivered') {
          try {
            // Find the driver route for this date and shift
            const routeDate = new Date(deliveryDate);
            const driverRoute = await DriverRoute.findOne({
              driverId,
              date: {
                $gte: new Date(routeDate.setHours(0, 0, 0, 0)),
                $lt: new Date(routeDate.setHours(23, 59, 59, 999))
              },
              shift: shift
            });

            if (driverRoute) {
              console.log(`🔄 Bulk update: Synchronizing with DriverRoute for ${shift} shift`);
              console.log(`Looking for delivery: subscriptionId=${subscription._id}, deliveryId=${deliveryId}, shift=${shift}`);
              console.log(`DriverRoute has ${driverRoute.stops.length} stops`);

              // Find the corresponding stop using enhanced matching strategies
              const stopIndex = driverRoute.stops.findIndex((stop, index) => {
                console.log(`Checking stop ${index}:`, {
                  stopSubscriptionId: stop.subscriptionId?.toString(),
                  stopOrderId: stop.orderId,
                  stopSequenceNumber: stop.sequenceNumber,
                  customerName: stop.address?.name
                });

                // Strategy 1: Match by subscription ID (most reliable)
                if (stop.subscriptionId && stop.subscriptionId.toString() === subscription._id.toString()) {
                  console.log(`✅ Bulk update: Found matching subscription ID for ${stop.address?.name}`);
                  return true;
                }

                // Strategy 2: Match by delivery tracking ObjectId
                if (stop.deliveryTrackingId && stop.deliveryTrackingId.toString() === deliveryId) {
                  console.log(`✅ Bulk update: Found matching delivery tracking ID for ${stop.address?.name}`);
                  return true;
                }

                // Strategy 3: Match by sequence number if available
                if (deliveryEntry?.sequencePosition && stop.sequenceNumber === deliveryEntry.sequencePosition) {
                  console.log(`✅ Bulk update: Found matching sequence number for ${stop.address?.name}`);
                  return true;
                }

                // Strategy 4: Legacy matching (orderId)
                if (stop.orderId === deliveryId) {
                  console.log(`✅ Bulk update: Found matching orderId for ${stop.address?.name}`);
                  return true;
                }

                return false;
              });

              console.log(`Bulk update stop search result: stopIndex=${stopIndex}`);

              if (stopIndex !== -1) {
                // Update the stop status with comprehensive data
                console.log(`✅ Bulk update: Updating existing stop at index ${stopIndex}`);
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

                console.log(`✅ Bulk update: Successfully synchronized DriverRoute stop ${stopIndex + 1} for ${shift} shift`);
              } else {
                console.warn(`❌ Bulk update: Could not find matching stop in DriverRoute for delivery ${deliveryId} (${shift} shift)`);
                console.warn(`This could lead to data inconsistency. Route has ${driverRoute.stops.length} stops.`);
              }
            } else {
              console.warn(`❌ Bulk update: No DriverRoute found for driver ${driverId} on ${deliveryDate.toDateString()} ${shift} shift`);
            }
          } catch (routeError) {
            console.error('Bulk update: Error synchronizing with DriverRoute:', routeError);
            // Don't fail the delivery update if route sync fails
          }
        }

        // ===== SEND NOTIFICATIONS FOR COMPLETED DELIVERIES =====
        if (status === 'delivered') {
          try {
            // Get driver information
            const driver = await User.findById(driverId);

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

            console.log(`📧 Bulk update: Sent delivery notification for ${deliveryId}`);
          } catch (notificationError) {
            console.error('Bulk update: Error sending delivery notifications:', notificationError);
            // Don't fail the delivery update if notifications fail
          }
        }

        updatedDeliveries.push({
          subscriptionId: subscription.subscriptionId,
          deliveryId,
          status,
          shift,
          mealCounts: {
            delivered: subscription.mealCounts.mealsDelivered,
            remaining: subscription.mealCounts.mealsRemaining,
            total: subscription.mealCounts.totalMeals
          }
        });

      } catch (error) {
        console.error(`Bulk update error for delivery ${deliveryId}:`, error);
        errors.push({ deliveryId, error: error.message });
      }
    }

    res.status(200).json({
      success: true,
      message: `${updatedDeliveries.length} deliveries updated successfully`,
      data: {
        updatedCount: updatedDeliveries.length,
        errorCount: errors.length,
        updatedDeliveries,
        errors: errors.length > 0 ? errors : undefined
      }
    });

  } catch (error) {
    console.error('Error bulk updating delivery status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update deliveries',
      error: error.message
    });
  }
};

/**
 * Get driver delivery statistics
 * GET /api/driver/stats
 */
exports.getDriverStats = async (req, res) => {
  try {
    const { driverId } = req.query;
    const { startDate, endDate } = req.query;

    // Validate driver access
    if (req.user.role !== 'driver' && req.user._id.toString() !== driverId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const start = new Date(startDate || new Date());
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate || new Date());
    end.setHours(23, 59, 59, 999);

    // Aggregate delivery statistics
    const pipeline = [
      {
        $match: {
          'deliveryTracking.deliveredBy': driverId,
          'deliveryTracking.deliveredAt': {
            $gte: start,
            $lte: end
          }
        }
      },
      {
        $unwind: '$deliveryTracking'
      },
      {
        $match: {
          'deliveryTracking.deliveredBy': driverId,
          'deliveryTracking.deliveredAt': {
            $gte: start,
            $lte: end
          }
        }
      },
      {
        $group: {
          _id: {
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$deliveryTracking.deliveredAt'
              }
            }
          },
          totalDeliveries: { $sum: 1 },
          morningDeliveries: {
            $sum: {
              $cond: [{ $eq: ['$deliveryTracking.shift', 'morning'] }, 1, 0]
            }
          },
          eveningDeliveries: {
            $sum: {
              $cond: [{ $eq: ['$deliveryTracking.shift', 'evening'] }, 1, 0]
            }
          }
        }
      },
      {
        $sort: { '_id.date': -1 }
      }
    ];

    const dailyStats = await Subscription.aggregate(pipeline);

    // Calculate overall statistics
    const totalStats = dailyStats.reduce((acc, day) => ({
      totalDeliveries: acc.totalDeliveries + day.totalDeliveries,
      morningDeliveries: acc.morningDeliveries + day.morningDeliveries,
      eveningDeliveries: acc.eveningDeliveries + day.eveningDeliveries
    }), { totalDeliveries: 0, morningDeliveries: 0, eveningDeliveries: 0 });

    res.status(200).json({
      success: true,
      data: {
        dailyStats,
        totalStats,
        dateRange: {
          startDate: start,
          endDate: end
        }
      }
    });

  } catch (error) {
    console.error('Error fetching driver stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch driver statistics',
      error: error.message
    });
  }
};

/**
 * Get delivery route optimization
 * GET /api/driver/route
 */
exports.getOptimizedRoute = async (req, res) => {
  try {
    const { driverId, date, shift } = req.query;

    // Validate driver access
    if (req.user.role !== 'driver' && req.user._id.toString() !== driverId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Get all pending deliveries for the date and shift
    const deliveries = await Subscription.aggregate([
      {
        $match: {
          status: 'active',
          'deliveryTracking': {
            $elemMatch: {
              date: new Date(date),
              shift: shift,
              deliveryStatus: { $in: [null, 'pending'] }
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'user',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          subscriptionId: 1,
          'user.name': 1,
          'user.phone': 1,
          deliveryAddress: 1,
          'deliveryTracking.$': 1
        }
      }
    ]);

    // Simple route optimization (can be enhanced with actual routing API)
    const optimizedDeliveries = deliveries.map((delivery, index) => ({
      ...delivery,
      routeOrder: index + 1,
      estimatedTime: `${8 + Math.floor(index * 0.5)}:${String((index * 30) % 60).padStart(2, '0')} ${shift === 'morning' ? 'AM' : 'PM'}`
    }));

    res.status(200).json({
      success: true,
      data: {
        deliveries: optimizedDeliveries,
        totalDeliveries: deliveries.length,
        estimatedDuration: `${Math.ceil(deliveries.length * 0.5)} hours`,
        shift,
        date
      }
    });

  } catch (error) {
    console.error('Error generating optimized route:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate route',
      error: error.message
    });
  }
};

/**
 * Get all daily deliveries for driver dashboard (similar to admin getDailySubscriptionMeals)
 * GET /api/drivers/daily-deliveries
 */
exports.getDriverDailyDeliveries = async (req, res) => {
  try {
    const {
      date = new Date().toISOString().split('T')[0],
      shift = 'both',
      status = 'all',
      search = '',
      page = 1,
      limit = 50
    } = req.query;

    console.log('Getting daily deliveries for drivers - date:', date, 'shift:', shift, 'status:', status);

    // Debug: Check total subscriptions
    const totalSubscriptions = await Subscription.countDocuments();
    console.log(`Total subscriptions in database: ${totalSubscriptions}`);
    
    // Debug: Check active subscriptions
    const activeSubscriptions = await Subscription.countDocuments({ status: 'active' });
    console.log(`Active subscriptions: ${activeSubscriptions}`);

    // Validate driver access
    if (req.user.role !== 'admin' && req.user.role !== 'driver' && req.user.role !== 'delivery') {
      return res.status(403).json({
        success: false,
        message: 'Access denied - insufficient privileges'
      });
    }

    const deliveryDate = new Date(date);
    deliveryDate.setHours(0, 0, 0, 0);

    // Build match conditions for active subscriptions
    const matchConditions = {
      status: 'active',
      startDate: { $lte: deliveryDate },
      endDate: { $gte: deliveryDate }
    };

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

    const aggregationPipeline = [
      { $match: matchConditions },
      
      // Add debug stage to see what we have after match
      {
        $addFields: {
          debug_matched: true
        }
      },
      
      // Lookup user details
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
      
      // Lookup meal plan details
      {
        $lookup: {
          from: 'mealplans',
          localField: 'mealPlan',
          foreignField: '_id',
          as: 'mealPlan'
        }
      },
      { $unwind: '$mealPlan' },
      
      // Lookup seller details
      {
        $lookup: {
          from: 'users',
          localField: 'mealPlan.seller',
          foreignField: '_id',
          as: 'seller'
        }
      },
      { $unwind: '$seller' },
      
      // Add delivery tracking data for today
      {
        $addFields: {
          todaysDeliveries: {
            $filter: {
              input: '$deliveryTracking',
              cond: {
                $eq: [
                  { $dateToString: { format: '%Y-%m-%d', date: '$$this.date' } },
                  date
                ]
              }
            }
          }
        }
      },
      
      // Unwind today's deliveries to get individual delivery records
      { $unwind: '$todaysDeliveries' },
      
      // Filter by shift if specified
      ...(shift !== 'both' ? [{
        $match: { 'todaysDeliveries.shift': shift }
      }] : []),
      
      // Filter by status if specified
      ...(status !== 'all' ? [{
        $match: (() => {
          switch(status) {
            case 'pending':
              return { $or: [
                { 'todaysDeliveries.deliveryStatus': { $in: [null, 'pending'] } },
                { 'todaysDeliveries.deliveryStatus': { $exists: false } }
              ]};
            case 'delivered':
              return { 'todaysDeliveries.deliveryStatus': 'delivered' };
            case 'skipped':
              return { 'todaysDeliveries.isSkipped': true };
            case 'replaced':
              return { 'todaysDeliveries.isReplaced': true };
            default:
              return {};
          }
        })()
      }] : []),
      
      // Project the final structure
      {
        $project: {
          _id: '$todaysDeliveries._id',
          subscriptionId: 1,
          user: {
            _id: '$user._id',
            name: '$user.name',
            phone: '$user.phone',
            email: '$user.email'
          },
          mealPlan: {
            _id: '$mealPlan._id',
            name: '$mealPlan.name',
            description: '$mealPlan.description',
            items: '$mealPlan.items',
            planType: '$mealPlan.planType',
            price: '$mealPlan.price',
            images: '$mealPlan.images'
          },
          seller: {
            _id: '$seller._id',
            name: '$seller.name',
            businessName: '$seller.businessName',
            phone: '$seller.phone'
          },
          deliveryAddress: '$deliveryAddress',
          date: '$todaysDeliveries.date',
          shift: '$todaysDeliveries.shift',
          deliveryStatus: { $ifNull: ['$todaysDeliveries.deliveryStatus', 'pending'] },
          isSkipped: { $ifNull: ['$todaysDeliveries.isSkipped', false] },
          isReplaced: { $ifNull: ['$todaysDeliveries.isReplaced', false] },
          isCustomized: { $ifNull: ['$todaysDeliveries.isCustomized', false] },
          replacementThali: '$todaysDeliveries.replacementThali',
          replacementReason: '$todaysDeliveries.replacementReason',
          skipReason: '$todaysDeliveries.skipReason',
          customizations: '$todaysDeliveries.customizations',
          deliveredAt: '$todaysDeliveries.deliveredAt',
          deliveredBy: '$todaysDeliveries.deliveredBy',
          deliveryNotes: '$todaysDeliveries.deliveryNotes',
          assignedDriver: '$todaysDeliveries.assignedDriver'
        }
      },
      
      // Sort by shift and user name
      {
        $sort: {
          shift: 1,
          'user.name': 1
        }
      }
    ];

    // Execute aggregation with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Debug: Check matched subscriptions after date filter
    const matchedSubs = await Subscription.aggregate([
      { $match: matchConditions },
      { $count: 'count' }
    ]);
    console.log(`Subscriptions matching date criteria: ${matchedSubs[0]?.count || 0}`);
    
    // Debug: Check deliveryTracking structure for first subscription
    const sampleSub = await Subscription.findOne(matchConditions).lean();
    if (sampleSub) {
      console.log('Sample subscription deliveryTracking:', JSON.stringify(sampleSub.deliveryTracking, null, 2));
      console.log('Looking for date string:', date);
    }
    
    const deliveries = await Subscription.aggregate([
      ...aggregationPipeline,
      { $skip: skip },
      { $limit: parseInt(limit) }
    ]);

    // Get total count for pagination
    const totalCount = await Subscription.aggregate([
      ...aggregationPipeline,
      { $count: 'total' }
    ]);

    const total = totalCount[0]?.total || 0;

    // Calculate statistics
    const allDeliveries = await Subscription.aggregate(aggregationPipeline);
    const stats = {
      total: allDeliveries.length,
      pending: allDeliveries.filter(d => d.deliveryStatus === 'pending' || !d.deliveryStatus).length,
      delivered: allDeliveries.filter(d => d.deliveryStatus === 'delivered').length,
      skipped: allDeliveries.filter(d => d.isSkipped).length,
      replaced: allDeliveries.filter(d => d.isReplaced).length,
      morning: allDeliveries.filter(d => d.shift === 'morning').length,
      evening: allDeliveries.filter(d => d.shift === 'evening').length,
      successRate: allDeliveries.length > 0 ? 
        Math.round((allDeliveries.filter(d => d.deliveryStatus === 'delivered').length / allDeliveries.length) * 100) : 0
    };

    console.log(`Found ${deliveries.length} deliveries for ${date}, total: ${total}`);
console.log('Statistics:',deliveries);
    res.status(200).json({
      success: true,
      data: deliveries,
      stats,
      meta: {
        date,
        shift,
        status,
        search,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });

  } catch (error) {
    console.error('Error fetching driver daily deliveries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily deliveries',
      error: error.message
    });
  }
};

// Export all controller functions
module.exports = {
  getDriverDeliveryList: exports.getDriverDeliveryList,
  getDriverDailyDeliveries: exports.getDriverDailyDeliveries,
  updateDeliveryStatus: exports.updateDeliveryStatus,
  bulkUpdateDeliveryStatus: exports.bulkUpdateDeliveryStatus,
  getDriverStats: exports.getDriverStats,
  getOptimizedRoute: exports.getOptimizedRoute
};