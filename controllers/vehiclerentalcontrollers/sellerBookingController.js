// Seller Booking Controller
// Handles offline bookings created by sellers for walk-in customers

const VehicleBooking = require('../../models/VehicleBooking');
const Vehicle = require('../../models/Vehicle');
const User = require('../../models/User');
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
    let durationHours = Math.ceil(
      (new Date(endDateTime) - new Date(startDateTime)) / (1000 * 60 * 60)
    );

    // Apply minimum hours logic for scooties without fuel (hourly plan only)
    // if (rateType === 'hourly') {
    //   const isScooty = vehicle.category?.toLowerCase() === 'scooty' || 
    //                    vehicle.category?.toLowerCase() === 'ev-scooty';
    //   const minHours = (isScooty && !includesFuel) ? 5 : 1;
    //   durationHours = Math.max(minHours, durationHours);

    //   console.log('⏱️ Duration with minimum hours applied:', {
    //     category: vehicle.category,
    //     isScooty,
    //     includesFuel,
    //     minHours,
    //     actualDuration: Math.ceil((new Date(endDateTime) - new Date(startDateTime)) / (1000 * 60 * 60)),
    //     billingDuration: durationHours
    //   });
    // }

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
      originalTotalAmount: totalAmount,
      kmLimit: costCalculation.rateConfig?.kmLimit || 0, // ✅ Log KM limit being stored
      rateType: rateType,
      duration: durationHours
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
        fatherName: customerDetails.fatherName || '',
        phone: customerDetails.phone,
        alternativeNumber: customerDetails.alternativeNumber || '',
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
        duration: durationHours, // Store billing duration (with minimum hours applied)
        kmLimit: costCalculation.rateConfig?.kmLimit || 0, // ✅ Store free KM limit from rate calculation
        addonsAmount: accessoriesCost, // Store addons separately for clarity
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

      // Initialize current KM limit for extensions
      currentKmLimit: costCalculation.rateConfig?.kmLimit || 0, // ✅ Initialize current KM limit

      // Payment Information
      paymentMethod: paymentMethod,
      depositAmount: depositAmount,
      depositCollectionMethod: 'at-pickup', // For offline bookings, deposit is collected at pickup
      depositStatus: depositAmount > 0 ? 'collected-at-pickup' : 'not-required',

      // Status - Set to 'ongoing' for offline bookings since vehicle is already handed over
      bookingStatus: 'ongoing', // Offline bookings start as 'ongoing' (skip pickup process)
      paymentStatus: (cashAmount + onlineAmount) >= finalTotalBill ? 'paid' : 'partially-paid',

      // Verification codes - Mark pickup as already verified for offline bookings
      verificationCodes: {
        pickup: {
          code: '0000', // Dummy code for offline bookings
          verified: true, // Already verified since vehicle is handed over
          verifiedAt: new Date(),
          verifiedBy: sellerId
        },
        drop: {
          code: Math.floor(1000 + Math.random() * 9000).toString(), // Generate drop code
          verified: false
        }
      },

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

    // ✅ FIX: Update paidAmount field to match total successful payments
    const totalPaid = cashAmount + onlineAmount;
    booking.paidAmount = totalPaid;

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

    // Update vehicle's meterReading from the meter reading at handover
    const startMeterReading = accessoriesChecklist.startMeterReading || 0;
    if (startMeterReading > 0) {
      vehicle.meterReading = startMeterReading;
      await vehicle.save();
      console.log(`📊 Updated vehicle ${vehicle._id} meterReading to ${startMeterReading} km`);
    }

    await booking.save();

    // Update vehicle availability ONLY if booking is confirmed and paid/partially-paid
    // This prevents vehicles from being locked for unpaid or pending bookings
    if (vehicle.availability === 'available' &&
      booking.bookingStatus === 'confirmed' &&
      ['paid', 'partially-paid'].includes(booking.paymentStatus)) {
      // Use updateOne to avoid triggering validation on unchanged fields
      await Vehicle.updateOne(
        { _id: vehicle._id },
        {
          $set: {
            availability: 'reserved',
            currentBookingId: booking._id
          }
        }
      );
      console.log(`🔒 Vehicle ${vehicle._id} marked as reserved for booking ${booking._id}`);
    } else {
      console.log(`⚠️ Vehicle ${vehicle._id} NOT reserved. Status: ${booking.bookingStatus}, Payment: ${booking.paymentStatus}`);
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
    // Note: Frontend passes zoneCode as 'zoneId' parameter for compatibility
    let vehicleQuery = { sellerId, status: 'active' };
    if (zoneId) {
      // Query by zoneCode since vehicles use zoneCode field, not zoneId
      vehicleQuery.zoneCode = zoneId;
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
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super-admin';
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

    console.log('🔍 getSellerBookings filters:', {
      sellerId,
      isAdmin,
      zoneId,
      bookingStatus,
      startDate,
      endDate,
      bookingSource,
      page,
      limit
    });

    // Build query
    const query = {
      isDeletedBySeller: { $ne: true } // Exclude soft-deleted bookings
    };

    if (!isAdmin) {
      if (isSeller) {
        // Sellers can see bookings they created OR bookings for their vehicles
        const Vehicle = require("../../models/Vehicle");
        const sellerVehicles = await Vehicle.find({ sellerId: sellerId }, "_id");
        const vehicleIds = sellerVehicles.map(v => v._id);
        query.$or = [
          { bookedBy: sellerId },
          { vehicleId: { $in: vehicleIds } }
        ];
      } else {
        query.bookedBy = sellerId;
      }
    }

    if (zoneId) query.zoneId = zoneId;
    if (bookingStatus) query.bookingStatus = bookingStatus;
    if (bookingSource) query.bookingSource = bookingSource;

    // Filter by start date - bookings that START on this date (in IST)
    if (startDate) {
      // Parse the date components
      const dateParts = startDate.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1;
      // JS months are 0-based
      const day = parseInt(dateParts[2]);

      // IST is UTC+5:30
      // To get IST midnight in UTC: subtract 5 hours 30 minutes
      // Example: 2026-01-18 00:00:00 IST = 2026-01-17 18:30:00 UTC

      // Start of day: midnight IST
      const startOfDayUTC = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      startOfDayUTC.setUTCHours(startOfDayUTC.getUTCHours() - 5);
      startOfDayUTC.setUTCMinutes(startOfDayUTC.getUTCMinutes() - 30);

      // End of day: 23:59:59.999 IST
      const endOfDayUTC = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
      endOfDayUTC.setUTCHours(endOfDayUTC.getUTCHours() - 5);
      endOfDayUTC.setUTCMinutes(endOfDayUTC.getUTCMinutes() - 30);

      query.startDateTime = {
        $gte: startOfDayUTC,
        $lte: endOfDayUTC
      };

      console.log('📅 Filtering by start date (IST):', {
        inputDate: startDate,
        ISTRange: `${startDate} 00:00:00 to 23:59:59`,
        startOfDayUTC: startOfDayUTC.toISOString(),
        endOfDayUTC: endOfDayUTC.toISOString()
      });
    }

    // Filter by end date - bookings that END on this date (in IST)
    if (endDate) {
      // Parse the date components
      const dateParts = endDate.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1;
      const day = parseInt(dateParts[2]);

      // Start of day: midnight IST
      const startOfDayUTC = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      startOfDayUTC.setUTCHours(startOfDayUTC.getUTCHours() - 5);
      startOfDayUTC.setUTCMinutes(startOfDayUTC.getUTCMinutes() - 30);

      // End of day: 23:59:59.999 IST
      const endOfDayUTC = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
      endOfDayUTC.setUTCHours(endOfDayUTC.getUTCHours() - 5);
      endOfDayUTC.setUTCMinutes(endOfDayUTC.getUTCMinutes() - 30);

      query.endDateTime = {
        $gte: startOfDayUTC,
        $lte: endOfDayUTC
      };

      console.log('📅 Filtering by end date (IST):', {
        inputDate: endDate,
        ISTRange: `${endDate} 00:00:00 to 23:59:59`,
        startOfDayUTC: startOfDayUTC.toISOString(),
        endOfDayUTC: endOfDayUTC.toISOString()
      });
    }

    console.log('📋 Final query:', JSON.stringify(query, null, 2));

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const bookings = await VehicleBooking.find(query)
      .populate('vehicleId', 'name vehicleNo category')
      .populate('userId', 'name email phone')
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    console.log(`✅ Found ${bookings.length} bookings`);

    // Log booking details for debugging
    if (bookings.length > 0 && (startDate || endDate)) {
      console.log('🔍 Booking date details:');
      bookings.forEach((booking, index) => {
        console.log(`  Booking ${index + 1}:`, {
          id: booking._id,
          startDateTime: booking.startDateTime?.toISOString(),
          endDateTime: booking.endDateTime?.toISOString(),
          status: booking.bookingStatus
        });
      });
    }

    const totalBookings = await VehicleBooking.countDocuments(query);

    // Disable caching for this endpoint
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

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

    // ✅ Synchronize paidAmount with total payments
    booking.paidAmount = totalPaid;

    if (totalPaid >= (booking.billing?.finalAmount || booking.billing?.totalBill || 0)) {
      booking.paymentStatus = 'paid';
      booking.cashFlowDetails.cashPaymentDetails.pendingCashAmount = 0;
    } else {
      booking.paymentStatus = 'partially-paid';
      booking.cashFlowDetails.cashPaymentDetails.pendingCashAmount =
        (booking.billing?.finalAmount || booking.billing?.totalBill || 0) - totalPaid;
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

// ===== REPLACE VEHICLE ON EXISTING BOOKING =====
const replaceVehicleOnBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { newVehicleId, reason } = req.body;
    const sellerId = req.user._id;

    console.log('🔄 Replace vehicle request:', {
      bookingId,
      newVehicleId,
      reason,
      sellerId,
      userRole: req.user.role
    });

    // Validate inputs
    if (!newVehicleId) {
      console.log('❌ Validation failed: No vehicle ID provided');
      return res.status(400).json({
        success: false,
        message: 'New vehicle ID is required'
      });
    }

    // Get the booking
    const booking = await VehicleBooking.findById(bookingId)
      .populate('vehicleId')
      .populate('userId');

    if (!booking) {
      console.log('❌ Booking not found:', bookingId);
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    console.log('📋 Booking found:', {
      bookingId: booking.bookingId,
      status: booking.bookingStatus,
      currentVehicleId: booking.vehicleId?._id
    });

    // Verify seller owns the original vehicle
    const originalVehicle = await Vehicle.findById(booking.vehicleId._id);
    if (!originalVehicle) {
      console.log('❌ Original vehicle not found:', booking.vehicleId._id);
      return res.status(404).json({
        success: false,
        message: 'Original vehicle not found'
      });
    }

    console.log('🚗 Original vehicle:', {
      id: originalVehicle._id,
      sellerId: originalVehicle.sellerId,
      requestSellerId: sellerId,
      match: originalVehicle.sellerId.toString() === sellerId.toString()
    });

    if (originalVehicle.sellerId.toString() !== sellerId.toString()) {
      console.log('❌ Seller ownership verification failed');
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this booking'
      });
    }

    // Check if booking is in a state where vehicle can be replaced
    const allowedStatuses = ['confirmed', 'ongoing'];
    if (!allowedStatuses.includes(booking.bookingStatus)) {
      return res.status(400).json({
        success: false,
        message: `Cannot replace vehicle. Booking status is ${booking.bookingStatus}. Only confirmed or ongoing bookings can have vehicle replaced.`
      });
    }

    // Get the new vehicle
    const newVehicle = await Vehicle.findById(newVehicleId);
    if (!newVehicle) {
      return res.status(404).json({
        success: false,
        message: 'New vehicle not found'
      });
    }

    // Verify seller owns the new vehicle
    if (newVehicle.sellerId.toString() !== sellerId.toString()) {
      console.log('❌ New vehicle ownership verification failed');
      return res.status(403).json({
        success: false,
        message: 'You do not own the replacement vehicle'
      });
    }

    console.log('✅ Seller owns the new vehicle');

    // Verify new vehicle is in the same zone
    if (newVehicle.zoneCode !== originalVehicle.zoneCode) {
      console.log('❌ Zone mismatch:', {
        originalZone: originalVehicle.zoneCode,
        newVehicleZone: newVehicle.zoneCode
      });
      return res.status(400).json({
        success: false,
        message: 'Replacement vehicle must be in the same zone'
      });
    }

    console.log('✅ Both vehicles in same zone:', newVehicle.zoneCode);

    // Verify new vehicle is available or reserved (but not not-available)
    // We'll rely on the more comprehensive conflictingBooking check below for actual availability
    const allowedAvailability = ['available', 'reserved'];
    if (!allowedAvailability.includes(newVehicle.availability)) {
      console.log('❌ New vehicle has restricted availability in DB:', {
        id: newVehicle._id,
        availability: newVehicle.availability,
        status: newVehicle.status
      });
      return res.status(400).json({
        success: false,
        message: `Replacement vehicle is not available (current status: ${newVehicle.availability})`
      });
    }

    console.log('✅ New vehicle is available');

    // Check if new vehicle has any conflicting bookings during the current booking period
    const now = new Date();
    const conflictingBooking = await VehicleBooking.findOne({
      vehicleId: newVehicleId,
      bookingStatus: { $in: ['confirmed', 'ongoing', 'pending'] },
      $or: [
        {
          // New vehicle has booking that overlaps with current booking period
          startDateTime: { $lte: booking.endDateTime },
          endDateTime: { $gte: booking.startDateTime }
        }
      ]
    });

    if (conflictingBooking) {
      console.log('❌ Conflicting booking found:', {
        conflictBookingId: conflictingBooking.bookingId,
        conflictStatus: conflictingBooking.bookingStatus,
        conflictStart: conflictingBooking.startDateTime,
        conflictEnd: conflictingBooking.endDateTime,
        currentBookingStart: booking.startDateTime,
        currentBookingEnd: booking.endDateTime
      });
      return res.status(400).json({
        success: false,
        message: `Replacement vehicle has conflicting bookings during this time period (${conflictingBooking.bookingId})`,
        details: {
          conflictingBookingId: conflictingBooking.bookingId,
          conflictingPeriod: {
            start: conflictingBooking.startDateTime,
            end: conflictingBooking.endDateTime
          }
        }
      });
    }

    console.log('✅ No conflicting bookings found for replacement vehicle');

    // Store original vehicle details for history
    const originalVehicleDetails = {
      vehicleId: originalVehicle._id,
      brand: originalVehicle.companyName,
      model: originalVehicle.name,
      registrationNumber: originalVehicle.vehicleNo,
      replacedAt: new Date(),
      replacedBy: sellerId,
      reason: reason || 'Vehicle breakdown/maintenance issue'
    };

    // Update old vehicle availability back to available (bypass validation)
    await Vehicle.updateOne(
      { _id: originalVehicle._id },
      { $set: { availability: 'available' } }
    );
    console.log('✅ Old vehicle updated to available');

    // Update new vehicle availability to reserved (bypass validation)
    await Vehicle.updateOne(
      { _id: newVehicle._id },
      { $set: { availability: 'reserved' } }
    );
    console.log('✅ New vehicle updated to reserved');

    // Update booking with new vehicle
    booking.vehicleId = newVehicleId;

    // Add to status history
    booking.statusHistory.push({
      status: booking.bookingStatus,
      updatedBy: sellerId,
      updatedAt: new Date(),
      notes: `Vehicle replaced: ${originalVehicle.companyName} ${originalVehicle.name} (${originalVehicle.vehicleNo}) → ${newVehicle.companyName} ${newVehicle.name} (${newVehicle.vehicleNo}). Reason: ${reason || 'Vehicle breakdown/maintenance'}`
    });

    // Store vehicle replacement history in booking (add new field if needed)
    if (!booking.vehicleReplacements) {
      booking.vehicleReplacements = [];
    }
    booking.vehicleReplacements.push(originalVehicleDetails);

    await booking.save();

    console.log('✅ Vehicle replaced successfully:', {
      bookingId: booking.bookingId,
      oldVehicle: `${originalVehicle.companyName} ${originalVehicle.name}`,
      newVehicle: `${newVehicle.companyName} ${newVehicle.name}`
    });

    res.status(200).json({
      success: true,
      message: 'Vehicle replaced successfully',
      data: {
        booking: booking,
        oldVehicle: {
          id: originalVehicle._id,
          brand: originalVehicle.companyName,
          model: originalVehicle.name,
          registrationNumber: originalVehicle.vehicleNo
        },
        newVehicle: {
          id: newVehicle._id,
          brand: newVehicle.companyName,
          model: newVehicle.name,
          registrationNumber: newVehicle.vehicleNo
        }
      }
    });
  } catch (error) {
    console.error('❌ Error replacing vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to replace vehicle',
      error: error.message
    });
  }
};

// ===== Get Last Meter Reading for Vehicle =====
const getLastMeterReading = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const sellerId = req.user._id;

    console.log('🔍 Fetching last meter reading for vehicle:', vehicleId);

    // Verify seller owns the vehicle
    const vehicle = await Vehicle.findOne({ _id: vehicleId, sellerId });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or you do not have permission to access it'
      });
    }

    // Find the last completed booking for this vehicle
    const lastBooking = await VehicleBooking.findOne({
      vehicleId,
      bookingStatus: 'completed',
      'vehicleDropoff.endMeterReading': { $exists: true, $ne: null }
    })
      .sort({ 'vehicleDropoff.dropoffTime': -1 })
      .select('vehicleDropoff.endMeterReading vehicleDropoff.dropoffTime');

    if (!lastBooking || !lastBooking.vehicleDropoff?.endMeterReading) {
      // No previous booking found, return vehicle's current meter reading
      return res.status(200).json({
        success: true,
        meterReading: vehicle.meterReading,
        source: 'vehicle',
        message: 'No previous bookings found, using vehicle base meter reading'
      });
    }

    console.log('✅ Last meter reading found:', {
      bookingId: lastBooking._id,
      meterReading: lastBooking.vehicleDropoff.endMeterReading,
      dropoffTime: lastBooking.vehicleDropoff.dropoffTime
    });

    res.status(200).json({
      success: true,
      meterReading: lastBooking.vehicleDropoff.endMeterReading,
      source: 'last-booking',
      lastDropoffTime: lastBooking.vehicleDropoff.dropoffTime
    });

  } catch (error) {
    console.error('Error fetching last meter reading:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch last meter reading',
      error: error.message
    });
  }
};

// ===== Soft Delete Booking (Seller Panel Only) =====
const softDeleteBooking = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super-admin';
    const isSeller = req.user.role === 'seller';
    const sellerId = req.user._id;
    const { bookingId } = req.params;
    const { reason } = req.body;

    console.log('🗑️ Soft delete request:', {
      sellerId,
      isAdmin,
      isSeller,
      bookingId,
      reason
    });

    // Find booking
    let booking = await VehicleBooking.findOne({
      bookingId,
      isDeletedBySeller: { $ne: true }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or already deleted'
      });
    }

    // Permission check for non-admins
    if (!isAdmin) {
      const isCreator = booking.bookedBy?.toString() === sellerId.toString();
      let isVehicleOwner = false;

      if (isSeller) {
        const Vehicle = require("../../models/Vehicle");
        const vehicle = await Vehicle.findOne({ _id: booking.vehicleId, sellerId: sellerId });
        isVehicleOwner = !!vehicle;
      }

      if (!isCreator && !isVehicleOwner) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to delete this booking'
        });
      }
    }

    // Prevent deletion of active or ongoing bookings
    if (booking.bookingStatus === 'ongoing') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an ongoing booking. Please complete or cancel it first.'
      });
    }

    // Update booking with soft delete flags
    booking.isDeletedBySeller = true;
    booking.deletedBySellerAt = new Date();
    booking.deletedBySeller = sellerId;
    booking.deletionReason = reason || 'Deleted by seller - wrong booking';

    await booking.save();

    console.log('✅ Booking soft-deleted successfully:', {
      bookingId: booking.bookingId,
      deletedAt: booking.deletedBySellerAt
    });

    res.status(200).json({
      success: true,
      message: 'Booking deleted successfully',
      booking: {
        bookingId: booking.bookingId,
        deletedAt: booking.deletedBySellerAt,
        reason: booking.deletionReason
      }
    });

  } catch (error) {
    console.error('Error soft-deleting booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete booking',
      error: error.message
    });
  }
};

// ===== Get Deleted Bookings (Optional - for recovery) =====
const getDeletedBookings = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super-admin';
    const sellerId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    console.log('🗑️ Fetching deleted bookings. Admin:', isAdmin, 'Seller:', sellerId);

    let query = { isDeletedBySeller: true };

    if (!isAdmin) {
      const Vehicle = require("../../models/Vehicle");
      const sellerVehicles = await Vehicle.find({ sellerId: sellerId }, "_id");
      const vehicleIds = sellerVehicles.map(v => v._id);
      query = { 
        $and: [
          { $or: [{ vehicleId: { $in: vehicleIds } }, { bookedBy: sellerId }] }, 
          { isDeletedBySeller: true }
        ] 
      };
    }

    const skip = (page - 1) * limit;
    const bookings = await VehicleBooking.find(query)
      .populate('vehicleId', 'name vehicleNo category')
      .populate('userId', 'name email phone')
      .populate('deletedBySeller', 'name email')
      .sort({ deletedBySellerAt: -1 })
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
    console.error('Error fetching deleted bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deleted bookings',
      error: error.message
    });
  }
};

// ===== Restore Deleted Booking (Optional) =====
const restoreDeletedBooking = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super-admin';
    const isSeller = req.user.role === 'seller';
    const sellerId = req.user._id;
    const { bookingId } = req.params;

    console.log('♻️ Restore booking request:', {
      sellerId,
      isAdmin,
      isSeller,
      bookingId
    });

    const booking = await VehicleBooking.findOne({
      bookingId,
      isDeletedBySeller: true
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Deleted booking not found'
      });
    }

    // Permission check for non-admins
    if (!isAdmin) {
      const isCreator = booking.bookedBy?.toString() === sellerId.toString();
      let isVehicleOwner = false;

      if (isSeller) {
        const Vehicle = require("../../models/Vehicle");
        const vehicle = await Vehicle.findOne({ _id: booking.vehicleId, sellerId: sellerId });
        isVehicleOwner = !!vehicle;
      }

      if (!isCreator && !isVehicleOwner) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to restore this booking'
        });
      }
    }

    // Restore booking
    booking.isDeletedBySeller = false;
    booking.deletedBySellerAt = undefined;
    booking.deletedBySeller = undefined;
    booking.deletionReason = undefined;

    await booking.save();

    console.log('✅ Booking restored successfully:', booking.bookingId);

    res.status(200).json({
      success: true,
      message: 'Booking restored successfully',
      booking: {
        bookingId: booking.bookingId,
        bookingStatus: booking.bookingStatus
      }
    });

  } catch (error) {
    console.error('Error restoring booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore booking',
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
  markCashHandover,
  replaceVehicleOnBooking,
  getLastMeterReading,
  softDeleteBooking,
  getDeletedBookings,
  restoreDeletedBooking
};
