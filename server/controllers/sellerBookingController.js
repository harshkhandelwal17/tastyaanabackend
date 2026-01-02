// Seller Booking Controller
// Handles offline bookings created by sellers for walk-in customers

const VehicleBooking = require('../models/VehicleBooking');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const mongoose = require('mongoose');

// ===== Create Offline Booking =====
const createOfflineBooking = async (req, res) => {
  try {
    console.log('🚗 Offline booking request received:', {
      body: req.body,
      user: req.user ? { id: req.user._id, email: req.user.email } : 'No user'
    });
    
    const sellerId = req.user._id;
    const {
      vehicleId,
      customerDetails,
      startDateTime,
      endDateTime,
      rateType = 'hourly12',
      includesFuel = false,
      addons = [],
      accessoriesChecklist = {},
      paymentDetails,
      cashAmount,
      onlineAmount,
      notes,
      zoneId,
      paymentMethod = 'cash',
      depositAmount = 0,
      _debug
    } = req.body;

    console.log('📋 Extracted booking data:', {
      vehicleId, zoneId, sellerId, _debug
    });

    // Validate seller has access to this zone
    const seller = await User.findById(sellerId);
    
    console.log('🔍 Zone access debugging:');
    console.log('   📍 Requested zoneId:', zoneId);
    console.log('   👤 Seller ID:', sellerId);
    console.log('   🏢 Seller service zones:', seller.sellerProfile?.vehicleRentalService?.serviceZones?.map(z => ({ zoneCode: z.zoneCode, zoneName: z.zoneName })));
    
    // Check if service zones exist and are properly configured
    if (!seller.sellerProfile?.vehicleRentalService?.serviceZones || seller.sellerProfile.vehicleRentalService.serviceZones.length === 0) {
      console.log('   ⚠️ No service zones found for seller! Creating default zones...');
      
      // Initialize default zones if they don't exist
      if (!seller.sellerProfile) seller.sellerProfile = {};
      if (!seller.sellerProfile.vehicleRentalService) seller.sellerProfile.vehicleRentalService = {};
      
      seller.sellerProfile.vehicleRentalService.serviceZones = [
        { zoneName: 'Bholaram ustad marg', zoneCode: 'ind001', address: 'Bholaram ustad marg, Indore', isActive: true },
        { zoneName: 'Indrapuri main office', zoneCode: 'ind003', address: 'Indrapuri main office, Indore', isActive: true },
        { zoneName: 'Vijay nagar square', zoneCode: 'ind004', address: 'Vijay nagar square, Indore', isActive: true }
      ];
      
      await seller.save();
      console.log('   ✅ Default zones created and saved');
    }
    
    const hasZoneAccess = seller.sellerProfile.vehicleRentalService.serviceZones
      .some(zone => {
        console.log(`   🔍 Comparing: ${zone.zoneCode} === ${zoneId} → ${zone.zoneCode === zoneId}`);
        return zone.zoneCode === zoneId;
      });
    
    console.log('   ✅ Has zone access:', hasZoneAccess);
    
    if (!hasZoneAccess) {
      return res.status(403).json({
        success: false,
        message: `You do not have access to this zone (${zoneId}). Available zones: ${seller.sellerProfile.vehicleRentalService.serviceZones.map(z => z.zoneCode).join(', ')}`
      });
    }

    // Validate vehicle belongs to seller and zone
    const vehicle = await Vehicle.findOne({
      _id: vehicleId,
      sellerId,
      zoneCode: zoneId, // Use zoneCode field to match with seller's service zones
      status: 'active'
    });

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or not available'
      });
    }

    // Check vehicle availability for the requested time slot
    const conflictingBooking = await VehicleBooking.findOne({
      vehicleId,
      bookingStatus: { $in: ['confirmed', 'ongoing'] },
      $or: [
        {
          startDateTime: { $lte: new Date(startDateTime) },
          endDateTime: { $gte: new Date(startDateTime) }
        },
        {
          startDateTime: { $lte: new Date(endDateTime) },
          endDateTime: { $gte: new Date(endDateTime) }
        }
      ]
    });

    if (conflictingBooking) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is not available for the selected time slot'
      });
    }

    // Calculate total booking amount using vehicle rate calculation method
    const durationHours = Math.ceil(
      (new Date(endDateTime) - new Date(startDateTime)) / (1000 * 60 * 60)
    );
    
    console.log('💰 Calculating cost:', {
      durationHours,
      rateType,
      includesFuel,
      vehicleId: vehicle._id
    });
    
    // Calculate cost using vehicle's rate calculation method
    const costCalculation = vehicle.calculateRate(
      durationHours,
      rateType,
      includesFuel
    );
    
    console.log('📊 Cost calculation result:', costCalculation);
    
    // Get the rate plan used for booking
    let ratePlanUsed = {};
    if (rateType === 'hourly12') {
      ratePlanUsed = {
        baseRate: vehicle.rate12hr.baseRate,
        ratePerHour: vehicle.rate12hr.ratePerHour,
        kmLimit: vehicle.rate12hr.kmLimit,
        extraChargePerKm: vehicle.rate12hr.extraChargePerKm,
        extraChargePerHour: vehicle.rate12hr.extraChargePerHour,
        gracePeriodMinutes: vehicle.rate12hr.gracePeriodMinutes,
        includesFuel: includesFuel
      };
    } else if (rateType === 'hourly') {
      ratePlanUsed = {
        ratePerHour: vehicle.rateHourly.ratePerHour,
        kmFreePerHour: vehicle.rateHourly.kmFreePerHour,
        extraChargePerKm: vehicle.rateHourly.extraChargePerKm,
        includesFuel: includesFuel
      };
    } else if (rateType === 'daily') {
      ratePlanUsed = {
        baseRate: vehicle.rate24hr.baseRate,
        extraBlockRate: vehicle.rate24hr.extraBlockRate,
        ratePerHour: vehicle.rate24hr.ratePerHour,
        kmLimit: vehicle.rate24hr.kmLimit,
        extraChargePerKm: vehicle.rate24hr.extraChargePerKm,
        extraChargePerHour: vehicle.rate24hr.extraChargePerHour,
        gracePeriodMinutes: vehicle.rate24hr.gracePeriodMinutes,
        includesFuel: includesFuel
      };
    }
    
    // Add accessories cost
    const accessoriesCost = addons.reduce((total, addon) => {
      return total + (addon.count * addon.price);
    }, 0);
    
    console.log('🎯 Accessories cost:', accessoriesCost);
    console.log('📊 Rate plan used:', ratePlanUsed);
    
    const baseAmount = (costCalculation.total || costCalculation.breakdown?.total || 0) + accessoriesCost;
    const totalAmount = baseAmount;

    console.log('💰 Final amounts:', {
      baseAmount,
      totalAmount,
      costCalculationTotal: costCalculation.total,
      costCalculationBreakdown: costCalculation.breakdown,
      isValidTotalAmount: totalAmount > 0 && !isNaN(totalAmount)
    });

    // Ensure totalAmount is a valid positive number
    if (!totalAmount || totalAmount <= 0 || isNaN(totalAmount)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid total amount calculated. Please check vehicle rates.',
        debug: {
          costCalculation,
          baseAmount,
          totalAmount,
          accessoriesCost
        }
      });
    }

    // Create or find customer
    let customer;
    if (customerDetails.email) {
      customer = await User.findOne({ email: customerDetails.email });
    }
    
    console.log('👤 Customer lookup result:', {
      customerEmail: customerDetails.email,
      foundExisting: !!customer,
      customerDetails
    });
    
    if (!customer) {
      console.log('➕ Creating new customer for offline booking...');
      customer = new User({
        name: customerDetails.name,
        email: customerDetails.email || `${Date.now()}@temp.com`,
        phone: customerDetails.phone,
        role: 'customer',
        password: 'offline123', // Default password for offline customers
        isEmailVerified: false,
        isPhoneVerified: false,
        // Additional profile information (removed aadharNumber and drivingLicense)
        profile: {
          address: customerDetails.address,
          isOfflineCustomer: true, // Mark as offline customer
          createdBy: sellerId // Track which seller created this customer
        }
      });
      await customer.save();
    } else {
      // Update customer profile if new information is provided (removed aadharNumber and drivingLicense)
      if (customerDetails.address) {
        customer.profile = customer.profile || {};
        if (customerDetails.address) customer.profile.address = customerDetails.address;
        await customer.save();
      }
    }

    console.log('📋 About to create booking with billing:', {
      baseAmount: Math.max(0, baseAmount || 0),
      totalBill: Math.max(0, totalAmount || 0),
      totalAmountVariable: totalAmount,
      baseAmountVariable: baseAmount
    });

    // Create explicit billing values to avoid scope issues
    const finalBaseAmount = Math.max(0, baseAmount || 0);
    const finalTotalBill = Math.max(0, totalAmount || 0);
    
    console.log('🔧 Final billing values:', {
      finalBaseAmount,
      finalTotalBill,
      originalBaseAmount: baseAmount,
      originalTotalAmount: totalAmount
    });

    // Create the booking
    const booking = new VehicleBooking({
      vehicleId,
      userId: customer._id,
      bookedBy: sellerId,
      bookingSource: 'seller-portal', // Explicitly marking as offline/seller booking
      
      // Customer Details (required by schema)
      customerDetails: {
        name: customerDetails.name,
        phone: customerDetails.phone,
        email: customerDetails.email || '',
        address: customerDetails.address || {}
      },
      
      // Timeline
      startDateTime: new Date(startDateTime),
      endDateTime: new Date(endDateTime),
      
      // Location
      zone: vehicle.zoneCenterName,
      zoneId: vehicle.zoneCode, // Use zoneCode as zoneId for consistent zone identification
      centerId: vehicle.zoneCode,
      centerName: vehicle.zoneCenterName,
      centerAddress: vehicle.zoneCenterAddress,
      
      // Rate and Services
      rateType: rateType,
      ratePlanUsed: ratePlanUsed, // Add the calculated rate plan data
      includesFuel: includesFuel,
      addons: addons,
      accessoriesChecklist: accessoriesChecklist,
      
      // Vehicle Handover Details (for offline bookings)
      ...(req.body.handoverDetails && {
        vehicleHandover: {
          startMeterReading: req.body.handoverDetails.startMeterReading || 0,
          fuelLevel: req.body.handoverDetails.fuelLevel || 'unknown',
          vehicleCondition: req.body.handoverDetails.vehicleCondition || 'good',
          handoverTime: new Date(),
          handoverNotes: req.body.handoverDetails.handoverNotes || '',
          handoverBy: sellerId // Track who handed over the vehicle
        }
      }),
      
      // Billing Information (required)
      billing: {
        baseAmount: finalBaseAmount,
        extraKmCharge: 0,
        extraHourCharge: 0,
        fuelCharges: 0,
        damageCharges: 0,
        cleaningCharges: 0,
        tollCharges: 0,
        lateFees: 0,
        totalBill: finalTotalBill,
        discount: {
          amount: 0,
          reason: '',
          appliedBy: null
        }
      },
      
      // Payment Information
      paymentMethod: paymentMethod,
      depositAmount: depositAmount,
      
      // Status
      bookingStatus: 'confirmed', // Auto-confirm seller bookings
      paymentStatus: (cashAmount + onlineAmount) >= finalTotalBill ? 'paid' : 'partially-paid',
      
      // Cash flow details
      cashFlowDetails: {
        isOfflineBooking: true,
        cashPaymentDetails: {
          totalCashReceived: cashAmount || 0,
          onlinePaymentAmount: onlineAmount || 0,
          pendingCashAmount: Math.max(0, finalTotalBill - (cashAmount || 0) - (onlineAmount || 0)),
          cashReceivedBy: sellerId,
          cashReceivedAt: cashAmount > 0 ? new Date() : null,
          notes: notes || ''
        },
        sellerCashFlow: {
          dailyCashCollected: cashAmount || 0,
          isHandedOverToAdmin: false
        }
      }
    });

    // Add payment records with detailed tracking
    if (cashAmount > 0) {
      booking.payments.push({
        amount: cashAmount,
        paymentType: 'Cash', // Valid enum: Cash
        paymentMethod: 'Cash', // Valid enum: Cash
        status: 'success',
        receivedBy: sellerId,
        receivedAt: new Date(),
        notes: `Cash payment received by seller for offline booking`
      });
    }

    if (onlineAmount > 0) {
      booking.payments.push({
        amount: onlineAmount,
        paymentType: 'UPI', // Valid enum: UPI
        paymentMethod: 'Manual', // Valid enum: Manual (instead of 'Manual Online')
        status: 'success',
        receivedBy: sellerId,
        receivedAt: new Date(),
        notes: `Online payment received by seller for ${paymentMethod} booking`
      });
    }

    // Add deposit payment record if deposit is collected
    // Note: Deposit is tracked separately in depositAmount field, not as a payment
    // if (depositAmount > 0) {
    //   booking.payments.push({
    //     amount: depositAmount,
    //     paymentType: 'Cash', // Use valid enum
    //     paymentMethod: 'Cash', // Use valid enum
    //     status: 'success',
    //     receivedBy: sellerId,
    //     receivedAt: new Date(),
    //     notes: 'Security deposit collected by seller (refundable)'
    //   });
    // }

    console.log('💾 Saving booking with data:', {
      bookingId: booking._id,
      customerName: booking.customerDetails.name,
      vehicleId: booking.vehicleId,
      totalBill: booking.billing.totalBill,
      paymentCount: booking.payments.length
    });

    await booking.save();

    // Update vehicle availability
    if (vehicle.availability === 'available') {
      vehicle.availability = 'reserved';
      await vehicle.save();
    }

    res.status(201).json({
      success: true,
      message: 'Offline booking created successfully',
      booking: booking,
      customer: {
        _id: customer._id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone
      }
    });

  } catch (error) {
    console.error('Error creating offline booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create offline booking',
      error: error.message
    });
  }
};

// ===== Get Available Vehicles for Booking =====
const getAvailableVehicles = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { zoneId, startDateTime, endDateTime } = req.query;

    // Get vehicles in the zone
    let vehicleQuery = { sellerId, status: 'active' };
    if (zoneId) {
      vehicleQuery.zoneId = zoneId;
    }

    console.log(`🔍 Searching for vehicles with query:`, vehicleQuery);
    console.log(`📅 Time range: ${startDateTime} to ${endDateTime}`);

    const vehicles = await Vehicle.find(vehicleQuery);
    console.log(`🚗 Found ${vehicles.length} vehicles in zone`);

    // Filter out vehicles that have conflicting bookings
    const availableVehicles = [];
    
    for (const vehicle of vehicles) {
      if (startDateTime && endDateTime) {
        // Check for overlapping bookings using proper date range logic
        const requestStart = new Date(startDateTime);
        const requestEnd = new Date(endDateTime);
        
        console.log(`🔍 Checking vehicle ${vehicle.vehicleNo} availability from ${requestStart} to ${requestEnd}`);
        
        const conflictingBooking = await VehicleBooking.findOne({
          vehicleId: vehicle._id,
          bookingStatus: { $in: ['confirmed', 'ongoing', 'pending'] },
          $or: [
            // Case 1: Existing booking starts before request ends AND ends after request starts
            {
              $and: [
                { startDateTime: { $lt: requestEnd } },
                { endDateTime: { $gt: requestStart } }
              ]
            }
          ]
        });

        console.log(`🚗 Vehicle ${vehicle.vehicleNo}: ${conflictingBooking ? '❌ Has conflict' : '✅ Available'}`);
        if (conflictingBooking) {
          console.log(`⚠️ Conflicting booking: ${conflictingBooking.startDateTime} to ${conflictingBooking.endDateTime}`);
        }

        if (!conflictingBooking) {
          availableVehicles.push(vehicle);
        }
      } else {
        availableVehicles.push(vehicle);
      }
    }

    console.log(`📊 Found ${availableVehicles.length} available vehicles out of ${vehicles.length} total vehicles`);
    
    res.status(200).json({
      success: true,
      vehicles: availableVehicles,
      count: availableVehicles.length
    });

  } catch (error) {
    console.error('Error fetching available vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available vehicles',
      error: error.message
    });
  }
};

// ===== Get Seller's Bookings =====
const getSellerBookings = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { 
      zoneId, 
      bookingStatus, 
      startDate, 
      endDate, 
      bookingSource,
      page = 1, 
      limit = 10 
    } = req.query;

    // Build query
    const query = { bookedBy: sellerId };
    
    if (zoneId) query.zoneId = zoneId;
    if (bookingStatus) query.bookingStatus = bookingStatus;
    if (bookingSource) query.bookingSource = bookingSource;
    
    if (startDate && endDate) {
      query.bookingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const bookings = await VehicleBooking.find(query)
      .populate('vehicleId', 'name vehicleNo category')
      .populate('userId', 'name email phone')
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalBookings = await VehicleBooking.countDocuments(query);

    res.status(200).json({
      success: true,
      bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalBookings / limit),
        totalBookings,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching seller bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

// ===== Update Cash Payment =====
const updateCashPayment = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { bookingId } = req.params;
    const { cashAmount, notes } = req.body;

    const booking = await VehicleBooking.findOne({
      bookingId,
      bookedBy: sellerId
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Update cash payment details
    const previousCash = booking.cashFlowDetails.cashPaymentDetails.totalCashReceived;
    booking.cashFlowDetails.cashPaymentDetails.totalCashReceived = cashAmount;
    booking.cashFlowDetails.cashPaymentDetails.notes = notes;
    
    if (cashAmount > previousCash) {
      booking.cashFlowDetails.cashPaymentDetails.cashReceivedAt = new Date();
      
      // Add new payment record for additional cash
      booking.payments.push({
        amount: cashAmount - previousCash,
        paymentType: 'Cash',
        paymentMethod: 'Cash',
        status: 'success',
        receivedBy: sellerId
      });
    }

    // Update payment status
    const totalPaid = cashAmount + booking.cashFlowDetails.cashPaymentDetails.onlinePaymentAmount;
    if (totalPaid >= booking.billing.finalAmount) {
      booking.paymentStatus = 'paid';
      booking.cashFlowDetails.cashPaymentDetails.pendingCashAmount = 0;
    } else {
      booking.paymentStatus = 'partially-paid';
      booking.cashFlowDetails.cashPaymentDetails.pendingCashAmount = 
        booking.billing.finalAmount - totalPaid;
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Cash payment updated successfully',
      booking
    });

  } catch (error) {
    console.error('Error updating cash payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update cash payment',
      error: error.message
    });
  }
};

// ===== Cash Flow Summary for Seller =====
const getCashFlowSummary = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { startDate, endDate, zoneId } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.bookingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else {
      // Default to current month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      dateFilter.bookingDate = { $gte: startOfMonth, $lte: endOfMonth };
    }

    // Build aggregation pipeline
    const matchStage = {
      bookedBy: new mongoose.Types.ObjectId(sellerId),
      ...dateFilter
    };

    if (zoneId) {
      matchStage.zoneId = zoneId;
    }

    const summary = await VehicleBooking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          onlineBookings: {
            $sum: { $cond: [{ $eq: ['$bookingSource', 'online'] }, 1, 0] }
          },
          offlineBookings: {
            $sum: { $cond: [{ $eq: ['$bookingSource', 'seller-portal'] }, 1, 0] }
          },
          totalRevenue: { $sum: '$billing.finalAmount' },
          totalCashCollected: {
            $sum: '$cashFlowDetails.cashPaymentDetails.totalCashReceived'
          },
          totalOnlinePayments: {
            $sum: '$cashFlowDetails.cashPaymentDetails.onlinePaymentAmount'
          },
          pendingCash: {
            $sum: '$cashFlowDetails.cashPaymentDetails.pendingCashAmount'
          },
          cashHandedOver: {
            $sum: {
              $cond: [
                '$cashFlowDetails.sellerCashFlow.isHandedOverToAdmin',
                '$cashFlowDetails.cashPaymentDetails.totalCashReceived',
                0
              ]
            }
          }
        }
      }
    ]);

    const result = summary[0] || {
      totalBookings: 0,
      onlineBookings: 0,
      offlineBookings: 0,
      totalRevenue: 0,
      totalCashCollected: 0,
      totalOnlinePayments: 0,
      pendingCash: 0,
      cashHandedOver: 0
    };

    // Calculate cash in hand
    result.cashInHand = result.totalCashCollected - result.cashHandedOver;

    res.status(200).json({
      success: true,
      summary: result,
      period: { startDate, endDate }
    });

  } catch (error) {
    console.error('Error getting cash flow summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get cash flow summary',
      error: error.message
    });
  }
};

// ===== Mark Cash as Handed Over =====
const markCashHandover = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { bookingIds, handoverReceiptNo } = req.body;

    const result = await VehicleBooking.updateMany(
      {
        bookingId: { $in: bookingIds },
        bookedBy: sellerId,
        'cashFlowDetails.sellerCashFlow.isHandedOverToAdmin': false
      },
      {
        $set: {
          'cashFlowDetails.sellerCashFlow.isHandedOverToAdmin': true,
          'cashFlowDetails.sellerCashFlow.handoverDate': new Date(),
          'cashFlowDetails.sellerCashFlow.handoverReceiptNo': handoverReceiptNo
        }
      }
    );

    res.status(200).json({
      success: true,
      message: `Cash handover marked for ${result.modifiedCount} bookings`,
      modifiedCount: result.modifiedCount
    });

  } catch (error) {
    console.error('Error marking cash handover:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark cash handover',
      error: error.message
    });
  }
};

module.exports = {
  createOfflineBooking,
  getAvailableVehicles,
  getSellerBookings,
  updateCashPayment,
  getCashFlowSummary,
  markCashHandover
};