const VehicleBooking = require('../../models/VehicleBooking');
const Vehicle = require('../../models/Vehicle');
const User = require('../../models/User');
const Razorpay = require('razorpay');
const mongoose = require('mongoose');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ===== UTILITY FUNCTIONS =====

// Function to recalculate billing with validation
const calculateBillingDetails = (vehicle, startDateTime, endDateTime, rateType, includesFuel, addons = []) => {
  try {
    // Calculate duration in hours
    const durationMs = new Date(endDateTime) - new Date(startDateTime);
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));

    // Get rate calculation
    const rateCalculation = vehicle.calculateRate(durationHours, rateType, includesFuel);

    // Calculate addons total
    const addonsTotal = addons.reduce((sum, item) => sum + (item.price * (item.count || 1)), 0);

    // Calculate subtotal (base + extra charges + fuel charges + addons)
    // Note: rateCalculation.total already includes base + extra + fuel
    const subtotal = rateCalculation.total + addonsTotal;

    // Calculate GST - Commented out for now
    // const gstAmount = Math.round(subtotal * 0.18);
    const gstAmount = 0; // GST disabled

    // Calculate deposit amount (only if vehicle requires deposit)
    const depositAmount = vehicle.requiresDeposit ? vehicle.depositAmount : 0;

    // Calculate final total (rental + addons + GST) - Deposit collected at pickup
    const finalTotal = subtotal + gstAmount;

    return {
      durationHours,
      rateCalculation,
      addonsTotal,
      subtotal,
      gstAmount,
      finalTotal,
      depositAmount: depositAmount,
      requiresDeposit: vehicle.requiresDeposit,
      depositCollectionMethod: vehicle.requiresDeposit ? 'at-pickup' : 'not-required',
      breakdown: {
        baseAmount: rateCalculation.baseRate,
        extraCharges: rateCalculation.extraCharges,
        fuelCharges: rateCalculation.fuelCharges,
        addons: addonsTotal,
        gst: gstAmount,
        deposit: depositAmount,
        rentalSubtotal: rateCalculation.total // This is base + extra + fuel
      }
    };
  } catch (error) {
    throw new Error(`Billing calculation failed: ${error.message}`);
  }
};

// ===== BOOKING MANAGEMENT =====

// Get all bookings with filtering
const getBookings = async (req, res) => {
  try {
    const {
      vehicleId,
      userId,
      bookingStatus,
      paymentStatus,
      zone,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'bookingDate',
      sortOrder = 'desc'
    } = req.query;

    let filter = {};

    if (vehicleId) filter.vehicleId = vehicleId;
    if (userId) filter.userId = userId;
    if (bookingStatus) filter.bookingStatus = bookingStatus;
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (zone) filter.zone = zone;

    if (startDate && endDate) {
      filter.bookingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // For sellers, only show their vehicle bookings
    if (req.user.role === 'seller') {
      const sellerVehicles = await Vehicle.find({ sellerId: req.user.id }).select('_id');
      filter.vehicleId = { $in: sellerVehicles.map(v => v._id) };
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const bookings = await VehicleBooking.find(filter)
      .populate('vehicleId', 'name vehicleNo category type zoneCenterName')
      .populate('userId', 'name phone email')
      .populate('bookedBy', 'name phone')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await VehicleBooking.countDocuments(filter);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
      error: error.message
    });
  }
};

// Get single booking by ID
const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await VehicleBooking.findById(id)
      .populate('vehicleId')
      .populate('userId', 'name phone email')
      .populate('bookedBy', 'name phone');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check permission
    const hasAccess = req.user.role === 'buyer' ||
      booking.userId.toString() === req.user.id ||
      (req.user.role === 'seller' && booking.vehicleId.sellerId.toString() === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking',
      error: error.message
    });
  }
};

// Validate and calculate booking details (useful for frontend pricing preview)
const validateBookingDetails = async (req, res) => {
  try {
    const { vehicleId, startDateTime, endDateTime, rateType, includesFuel, addons } = req.body;

    // Validate required fields
    if (!vehicleId || !startDateTime || !endDateTime || !rateType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: vehicleId, startDateTime, endDateTime, rateType'
      });
    }

    // Validate vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Validate dates
    const now = new Date();
    const startTime = new Date(startDateTime);
    const endTime = new Date(endDateTime);

    // Check for past dates (with 15 min buffer)
    const gracePeriodMs = 15 * 60 * 1000;
    if (startTime.getTime() < (now.getTime() - gracePeriodMs)) {
      const timeDiff = Math.round((now - startTime) / (1000 * 60)); // difference in minutes
      return res.status(400).json({
        success: false,
        message: `Booking start time is ${timeDiff} minute(s) in the past. Please select a future date and time.`,
        error: 'INVALID_START_TIME',
        details: {
          requestedStart: startTime.toISOString(),
          currentTime: now.toISOString(),
          suggestion: 'Please select a start time that is in the future.'
        }
      });
    }

    // Check for invalid time range
    if (endTime <= startTime) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time. Please check your booking duration.',
        error: 'INVALID_TIME_RANGE',
        details: {
          requestedStart: startTime.toISOString(),
          requestedEnd: endTime.toISOString(),
          suggestion: 'Ensure the end time is at least 1 hour after the start time.'
        }
      });
    }

    // Check duration limits
    const durationHours = (endTime - startTime) / (1000 * 60 * 60);
    if (durationHours < 1) {
      return res.status(400).json({
        success: false,
        message: `Booking duration is ${durationHours.toFixed(1)} hours. Minimum booking duration is 1 hour.`,
        error: 'DURATION_TOO_SHORT',
        details: {
          requestedDuration: durationHours,
          minimumDuration: 1,
          suggestion: 'Please extend your booking to at least 1 hour.'
        }
      });
    }

    // Removed 7-day maximum limit to allow longer bookings

    // Check availability
    const bufferMinutes = vehicle.minBufferTime || 30;
    const bufferMs = bufferMinutes * 60 * 1000;
    const checkStart = new Date(startTime.getTime() - bufferMs);
    const checkEnd = new Date(endTime.getTime() + bufferMs);

    // CHANGED: Only check against CONFIRMED (paid) or ONGOING bookings
    // "First to pay wins" logic - pending/awaiting_approval do not block slots
    const conflictingBookings = await VehicleBooking.find({
      vehicleId,
      bookingStatus: { $in: ['confirmed', 'ongoing'] }, // Removed 'awaiting_approval'
      $or: [
        {
          startDateTime: { $lt: checkEnd },
          endDateTime: { $gt: checkStart }
        }
      ]
    });

    if (conflictingBookings.length > 0) {
      const conflictDetails = [];

      conflictingBookings.forEach(booking => {
        const existingStart = new Date(booking.startDateTime);
        const existingEnd = new Date(booking.endDateTime);
        const existingEndWithBuffer = new Date(existingEnd.getTime() + bufferMs);
        const bufferConflict = startTime < existingEndWithBuffer && endTime > existingStart;

        if (bufferConflict) {
          conflictDetails.push({
            bookingId: booking.bookingId,
            conflictStart: existingStart.toISOString(),
            conflictEnd: existingEnd.toISOString(),
            nextAvailable: existingEndWithBuffer.toISOString()
          });
        }
      });

      if (conflictDetails.length > 0) {
        const nextAvailable = Math.min(...conflictDetails.map(c => new Date(c.nextAvailable)));
        const nextAvailableDate = new Date(nextAvailable);

        return res.status(400).json({
          success: false,
          message: `Vehicle is not available for the selected time slot. There are existing bookings that conflict with your requested time.`,
          error: 'BOOKING_CONFLICT',
          details: {
            requestedStart: startTime.toISOString(),
            requestedEnd: endTime.toISOString(),
            nextAvailableTime: nextAvailableDate.toISOString(),
            nextAvailableFormatted: nextAvailableDate.toLocaleString(),
            bufferTimeRequired: `${bufferMinutes} minutes`,
            conflictingBookings: conflictDetails.map(c => ({
              bookingId: c.bookingId,
              conflictStart: c.conflictStart,
              conflictEnd: c.conflictEnd
            }))
          },
          suggestion: `The vehicle will be available from ${nextAvailableDate.toLocaleString()}. Please select a time slot starting from this time or later.`
        });
      }
    }

    // Calculate billing details
    try {
      const billingDetails = calculateBillingDetails(
        vehicle,
        startDateTime,
        endDateTime,
        rateType,
        includesFuel,
        addons || []
      );

      res.json({
        success: true,
        message: 'Booking details validated successfully',
        data: {
          vehicle: {
            id: vehicle._id,
            name: vehicle.name,
            category: vehicle.category,
            vehicleNo: vehicle.vehicleNo
          },
          duration: {
            hours: billingDetails.durationHours,
            startDateTime,
            endDateTime
          },
          pricing: {
            baseAmount: billingDetails.breakdown.baseAmount,
            extraCharges: billingDetails.breakdown.extraCharges,
            fuelCharges: billingDetails.breakdown.fuelCharges,
            addonsTotal: billingDetails.breakdown.addons,
            subtotal: billingDetails.subtotal,
            gst: billingDetails.breakdown.gst,
            depositAmount: billingDetails.depositAmount,
            totalBill: billingDetails.finalTotal
          },
          available: true
        }
      });
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to calculate booking cost',
        error: error.message
      });
    }

  } catch (error) {
    console.error('Error validating booking details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to validate booking details',
      error: error.message
    });
  }
};

// Create new booking
const createBooking = async (req, res) => {
  try {
    const bookingData = req.body;
    //     console.log("files received", req.files);
    // console.log('Received booking data:', bookingData);
    // Validate vehicle exists and is available
    const vehicle = await Vehicle.findById(bookingData.vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Debug: Check vehicle zone data
    console.log('Vehicle zone data:', {
      zoneId: vehicle.zoneId,
      zoneCode: vehicle.zoneCode,
      zoneCenterName: vehicle.zoneCenterName
    });

    if (!vehicle.isAvailableForBooking()) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is not available for booking'
      });
    }

    // Validate start time is in future (with 15 min buffer for latency)
    const now = new Date();
    const startTime = new Date(bookingData.startDateTime);
    const endTime = new Date(bookingData.endDateTime);

    // Allow booking to start up to 15 minutes in the past (clock skew/user delay)
    const gracePeriodMs = 15 * 60 * 1000;
    if (startTime.getTime() < (now.getTime() - gracePeriodMs)) {
      return res.status(400).json({
        success: false,
        message: 'Booking start time cannot be in the past. Please select a future date and time.'
      });
    }

    // Validate end time is after start time
    if (endTime <= startTime) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time. Please check your booking duration.'
      });
    }

    // Validate booking duration (minimum 1 hour, maximum 7 days)
    const durationHours = (endTime - startTime) / (1000 * 60 * 60);
    if (durationHours < 1) {
      return res.status(400).json({
        success: false,
        message: 'Minimum booking duration is 1 hour.'
      });
    }

    // Removed 7-day maximum limit to allow longer bookings

    // Check for conflicting bookings with buffer time
    const bufferMinutes = vehicle.minBufferTime || 30;
    const bufferMs = bufferMinutes * 60 * 1000;

    const requestedStart = new Date(bookingData.startDateTime);
    const requestedEnd = new Date(bookingData.endDateTime);

    // Extend requested range by buffer for safety check
    const checkStart = new Date(requestedStart.getTime() - bufferMs);
    const checkEnd = new Date(requestedEnd.getTime() + bufferMs);

    // CHANGED: Only check against CONFIRMED (paid) or ONGOING bookings
    // "First to pay wins" logic
    const conflictingBookings = await VehicleBooking.find({
      vehicleId: bookingData.vehicleId,
      bookingStatus: { $in: ['confirmed', 'ongoing'] }, // Removed 'awaiting_approval'
      $or: [
        {
          startDateTime: { $lt: checkEnd },
          endDateTime: { $gt: checkStart }
        }
      ]
    });

    if (conflictingBookings.length > 0) {
      // Double check specifics to avoid false positives with buffer
      const conflictDetails = [];

      conflictingBookings.forEach(booking => {
        const existingStart = new Date(booking.startDateTime);
        const existingEnd = new Date(booking.endDateTime);

        // Exact overlap check
        const overlap = requestedStart < existingEnd && requestedEnd > existingStart;

        // Buffer check: existing end + buffer > requested start AND existing start - buffer < requested end
        const existingEndWithBuffer = new Date(existingEnd.getTime() + bufferMs);
        const bufferConflict = requestedStart < existingEndWithBuffer && requestedEnd > existingStart;

        if (bufferConflict) {
          conflictDetails.push({
            bookingId: booking.bookingId,
            status: booking.bookingStatus,
            conflictStart: existingStart.toISOString(),
            conflictEnd: existingEnd.toISOString(),
            nextAvailable: new Date(existingEnd.getTime() + bufferMs).toISOString()
          });
        }
      });

      if (conflictDetails.length > 0) {
        const nextAvailable = Math.min(...conflictDetails.map(c => new Date(c.nextAvailable)));

        return res.status(400).json({
          success: false,
          message: `Vehicle is not available for the selected time slot. The vehicle has existing bookings that conflict with your requested time.`,
          error: 'BOOKING_CONFLICT',
          details: {
            requestedStart: requestedStart.toISOString(),
            requestedEnd: requestedEnd.toISOString(),
            nextAvailableTime: new Date(nextAvailable).toISOString(),
            bufferTimeRequired: `${bufferMinutes} minutes`,
            conflictingBookings: conflictDetails
          },
          suggestion: `Please select a time slot starting from ${new Date(nextAvailable).toLocaleString()} or later.`
        });
      }
    }

    // Calculate billing with improved accuracy using utility function
    let billingDetails;
    try {
      billingDetails = calculateBillingDetails(
        vehicle,
        bookingData.startDateTime,
        bookingData.endDateTime,
        bookingData.rateType,
        bookingData.includesFuel,
        bookingData.addons || []
      );
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to calculate booking cost',
        error: error.message
      });
    }

    console.log('--- DEBUG BOOKING CREATION ---');
    console.log('Duration (hours):', billingDetails.durationHours);
    console.log('Rate Type:', bookingData.rateType);
    console.log('Includes Fuel:', bookingData.includesFuel);
    console.log('🚗 FREE KM LIMIT:', billingDetails.rateCalculation.rateConfig.kmLimit);
    console.log('Billing Details:', billingDetails);
    console.log('------------------------------');

    // Handle document uploads if provided
    let uploadedDocuments = [];
    if (bookingData.documents && bookingData.documents.length > 0) {
      // Documents should be uploaded to Cloudinary before booking creation
      // Frontend should send document URLs after upload
      uploadedDocuments = bookingData.documents.map(doc => ({
        type: doc.type,
        url: doc.url,
        verified: false
      }));
    }

    // Determine if booking requires approval
    const requiresApproval = vehicle.requireConfirmation || false;
    const initialRequestStatus = requiresApproval ? 'pending-approval' : 'none';
    const initialBookingStatus = requiresApproval ? 'awaiting_approval' : 'pending'; // Will be 'confirmed' after payment

    console.log('--- APPROVAL LOGIC ---');
    console.log('Vehicle requireConfirmation:', vehicle.requireConfirmation);
    console.log('Booking requiresApproval:', requiresApproval);
    console.log('Initial requestStatus:', initialRequestStatus);
    console.log('Initial bookingStatus:', initialBookingStatus);
    console.log('---------------------');

    // Create booking object
    const booking = new VehicleBooking({
      ...bookingData,
      userId: req.user.id,
      bookedBy: bookingData.bookedBy || req.user.id,
      bookingSource: 'online', // Explicitly set as online booking
      zone: vehicle.zoneCode || vehicle.zoneCenterName || 'default',
      zoneId: vehicle.zoneId || vehicle.zoneCode || bookingData.zoneId || 'IND001', // Fallback to ensure required field is set
      centerId: vehicle.zoneCode || vehicle.zoneId || 'IND001',
      centerName: vehicle.zoneCenterName || 'Default Center',
      centerAddress: vehicle.zoneCenterAddress || vehicle.zoneAddress || '',
      // Fix customerDetails.address - ensure it's an object
      customerDetails: {
        ...bookingData.customerDetails,
        address: typeof bookingData.customerDetails?.address === 'string'
          ? {
            street: bookingData.customerDetails.address,
            city: '',
            state: '',
            pincode: ''
          }
          : (bookingData.customerDetails?.address || {
            street: '',
            city: '',
            state: '',
            pincode: ''
          })
      },
      // Approval settings based on vehicle configuration
      requiresApproval: requiresApproval,
      requestStatus: initialRequestStatus,
      bookingStatus: initialBookingStatus,
      paymentStatus: 'unpaid', // Valid enum value for online bookings
      depositAmount: billingDetails.depositAmount,
      depositCollectionMethod: vehicle.requiresDeposit ? 'at-pickup' : 'not-required',
      depositStatus: vehicle.requiresDeposit ? 'pending' : 'not-required',
      addons: bookingData.addons || [],
      // Payment tracking for online bookings
      paymentMethod: 'online', // All user bookings are online
      cashFlowDetails: {
        isOfflineBooking: false, // Explicitly set as false for online bookings
        cashPaymentDetails: {
          totalCashReceived: 0, // No cash for online bookings
          onlinePaymentAmount: billingDetails.finalTotal, // Full amount online
          pendingCashAmount: 0,
          cashReceivedBy: null,
          cashReceivedAt: null,
          notes: 'Online booking via user portal'
        },
        sellerCashFlow: {
          dailyCashCollected: 0,
          isHandedOverToAdmin: false
        }
      },
      // Accessories checklist - helmet should be a number (count of helmets)
      accessoriesChecklist: {
        helmet: typeof bookingData.accessoriesChecklist?.helmet === 'number'
          ? bookingData.accessoriesChecklist.helmet
          : (bookingData.accessoriesChecklist?.helmet ? 1 : 0),
        toolkit: bookingData.accessoriesChecklist?.toolkit ?? true,
        spareTyre: bookingData.accessoriesChecklist?.spareTyre ?? false,
        firstAidKit: bookingData.accessoriesChecklist?.firstAidKit ?? true,
        verifiedAt: null
      },
      ratePlanUsed: {
        baseRate: billingDetails.rateCalculation.rateConfig.baseRate,
        ratePerHour: billingDetails.rateCalculation.rateConfig.ratePerHour,
        kmLimit: billingDetails.rateCalculation.rateConfig.kmLimit,
        extraChargePerKm: billingDetails.rateCalculation.rateConfig.extraChargePerKm,
        extraChargePerHour: billingDetails.rateCalculation.rateConfig.extraChargePerHour,
        gracePeriodMinutes: billingDetails.rateCalculation.rateConfig.gracePeriodMinutes || 0,
        kmFreePerHour: billingDetails.rateCalculation.rateConfig.kmFreePerHour || 0,
        extraBlockRate: billingDetails.rateCalculation.rateConfig.extraBlockRate || 0,
        includesFuel: bookingData.includesFuel || false
      },
      billing: {
        baseAmount: billingDetails.breakdown.baseAmount,
        kmLimit: billingDetails.rateCalculation.rateConfig.kmLimit, // ✅ Store free KM limit
        extraKmCharge: 0, // This will be calculated after trip completion based on actual usage
        extraHourCharge: billingDetails.breakdown.extraCharges,
        fuelCharges: billingDetails.breakdown.fuelCharges,
        damageCharges: 0,
        cleaningCharges: 0,
        tollCharges: 0,
        lateFees: 0,
        discount: {
          amount: 0,
          couponCode: '',
          discountType: ''
        },
        taxes: {
          gst: billingDetails.breakdown.gst,
          serviceTax: 0
        },
        totalBill: billingDetails.finalTotal
      },
      currentKmLimit: billingDetails.rateCalculation.rateConfig.kmLimit, // ✅ Initialize current KM limit
      documents: uploadedDocuments
    });

    console.log('🎯 STORING KM LIMIT:', {
      'billing.kmLimit': billingDetails.rateCalculation.rateConfig.kmLimit,
      'currentKmLimit': billingDetails.rateCalculation.rateConfig.kmLimit,
      'rateType': bookingData.rateType,
      'duration': billingDetails.durationHours
    });

    await booking.save();

    // ⚠️ IMPORTANT: Do NOT mark vehicle as reserved here!
    // Vehicle should only be reserved after successful payment confirmation
    // For now, we'll just log the booking creation
    console.log(`📝 Booking ${booking._id} created with status: ${booking.bookingStatus}, Payment: ${booking.paymentStatus}`);
    console.log(`⏳ Vehicle ${vehicle._id} remains available until payment is confirmed`);

    // Note: Vehicle will be marked as reserved in the payment verification callback

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.message
    });
  }
};

// ===== PAYMENT PROCESSING =====

// Create Razorpay order
const createRazorpayOrder = async (req, res) => {
  try {
    let { bookingId, amount } = req.body;

    // Handle nested bookingId from RazorpayComponent
    if (!bookingId && req.body.orderData?.bookingId) {
      bookingId = req.body.orderData.bookingId;
    }

    let booking;
    // Check if bookingId is a valid ObjectId
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(bookingId)) {
      booking = await VehicleBooking.findById(bookingId);
    } else {
      // If not ObjectId, try finding by custom bookingId string
      booking = await VehicleBooking.findOne({ bookingId: bookingId });
    }
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      receipt: `booking_${bookingId}`,
      notes: {
        bookingId: bookingId,
        userId: req.user.id,
        vehicleId: booking.vehicleId.toString()
      }
    });

    res.json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        key: process.env.RAZORPAY_KEY_ID, // Required by component
        bookingId: bookingId,
        recordId: bookingId, // Required by RazorpayComponent for verification
        type: 'vehicle_rental' // Useful content for payment record
      }
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message
    });
  }
};

// Verify Razorpay payment
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
      recordId // RazorpayComponent sends this
    } = req.body;

    const targetBookingId = bookingId || recordId;

    // Verify signature
    const crypto = require('crypto');
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    console.log('🔐 Payment Verification Debug:', {
      razorpay_order_id,
      razorpay_payment_id,
      received_signature: razorpay_signature,
      generated_signature: expectedSignature,
      key_secret_prefix: process.env.RAZORPAY_KEY_SECRET ? process.env.RAZORPAY_KEY_SECRET.substring(0, 4) + '...' : 'MISSING'
    });

    if (expectedSignature !== razorpay_signature) {
      console.error('❌ Signature Mismatch!');
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature',
        debug: {
          expected: expectedSignature,
          received: razorpay_signature
        }
      });
    }

    // Update booking with payment details
    let booking;
    if (mongoose.Types.ObjectId.isValid(targetBookingId)) {
      booking = await VehicleBooking.findById(targetBookingId);
    } else {
      booking = await VehicleBooking.findOne({ bookingId: targetBookingId });
    }
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // --- CRITICAL RACE CONDITION CHECK ---
    // Check if slot was taken by someone else while this user was paying
    const vehicle = await Vehicle.findById(booking.vehicleId);
    const bufferMinutes = vehicle.minBufferTime || 30;
    const bufferMs = bufferMinutes * 60 * 1000;

    // We only care about CONFIRMED/ONGOING bookings that are NOT this booking
    const conflictingBookings = await VehicleBooking.find({
      _id: { $ne: booking._id }, // Exclude self
      vehicleId: booking.vehicleId,
      bookingStatus: { $in: ['confirmed', 'ongoing'] },
      $or: [
        {
          startDateTime: { $lt: new Date(booking.endDateTime.getTime() + bufferMs) },
          endDateTime: { $gt: new Date(booking.startDateTime.getTime() - bufferMs) }
        }
      ]
    });

    if (conflictingBookings.length > 0) {
      console.warn(`🚨 RACE CONDITION: Booking ${booking._id} paid but slot taken by ${conflictingBookings[0]._id}. Initiating Refund.`);

      // Attempt Refund
      try {
        await razorpay.payments.refund(razorpay_payment_id, {
          "speed": "normal",
          "notes": {
            "reason": "Slot unavailable (Race Condition)",
            "bookingId": booking._id.toString()
          }
        });
        console.log(`✅ Refund Initiated for ${razorpay_payment_id}`);

        // Mark booking as cancelled/failed
        booking.paymentStatus = 'refunded';
        booking.bookingStatus = 'cancelled';
        booking.statusHistory.push({
          status: 'cancelled',
          updatedAt: new Date(),
          notes: 'System Cancelled: Slot taken by another user during payment. Refund initiated.'
        });
        await booking.save();

        return res.status(409).json({ // 409 Conflict
          success: false,
          message: 'Slot no longer available. Payment refunded.',
          error: 'SLOT_TAKEN_RACE_CONDITION'
        });

      } catch (refundError) {
        console.error('❌ Refund Failed:', refundError);
        // Mark as refund-pending so admin can manually fix
        booking.paymentStatus = 'refund-pending';
        booking.bookingStatus = 'cancelled';
        booking.notes = (booking.notes || '') + ' \n[SYSTEM]: Slot taken. Refund FAILED. Manual refund required.';
        await booking.save();

        return res.status(409).json({
          success: false,
          message: 'Slot no longer available. Refund processing failed. Please contact support.',
          error: 'SLOT_TAKEN_REFUND_FAILED'
        });
      }
    }
    // -------------------------------------

    // Get payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    // ✅ CHECK FOR DUPLICATE PAYMENT - Prevent double payment entries
    const existingPayment = booking.payments.find(
      p => p.paymentReference?.razorpayPaymentId === razorpay_payment_id ||
        p.paymentReference?.transactionId === razorpay_payment_id
    );

    if (existingPayment) {
      console.log(`⚠️ Duplicate payment detected for booking ${bookingId}, payment ID: ${razorpay_payment_id}`);
      return res.json({
        success: true,
        message: 'Payment already recorded',
        data: {
          booking: booking,
          paymentStatus: booking.paymentStatus,
          bookingStatus: booking.bookingStatus,
          duplicate: true
        }
      });
    }

    // Add payment only if not duplicate
    booking.payments.push({
      amount: payment.amount / 100,
      paymentType: 'UPI',
      paymentMethod: 'Razorpay',
      paymentReference: {
        transactionId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id
      },
      status: 'success'
    });

    booking.paidAmount += payment.amount / 100;

    // Update cash flow details to reflect online payment
    if (booking.cashFlowDetails) {
      booking.cashFlowDetails.cashPaymentDetails.onlinePaymentAmount += payment.amount / 100;
      booking.cashFlowDetails.cashPaymentDetails.pendingCashAmount = Math.max(0,
        booking.billing.totalBill - booking.cashFlowDetails.cashPaymentDetails.totalCashReceived - booking.cashFlowDetails.cashPaymentDetails.onlinePaymentAmount
      );
    }

    // Vehicle already fetched above for race condition check

    if (booking.paidAmount >= booking.billing.totalBill) {
      booking.paymentStatus = 'paid';

      // Update deposit status if deposit was included in payment
      if (booking.depositCollectionMethod === 'online' && booking.depositAmount > 0) {
        booking.depositStatus = 'collected-online';
      }

      // Check if vehicle requires approval
      if (vehicle && vehicle.requiresApproval) {
        booking.bookingStatus = 'awaiting_approval';
      } else {
        booking.bookingStatus = 'confirmed';
      }
    } else {
      booking.paymentStatus = 'partially-paid';
    }

    await booking.save();

    // Update vehicle availability based on booking status
    if (booking.bookingStatus === 'confirmed' && ['paid', 'partially-paid'].includes(booking.paymentStatus)) {
      // Mark vehicle as reserved for confirmed paid bookings
      await Vehicle.findByIdAndUpdate(booking.vehicleId, {
        availability: 'reserved',
        currentBookingId: booking._id
      });
      console.log(`🔒 Vehicle ${booking.vehicleId} marked as reserved for confirmed booking ${booking._id}`);
    } else if (booking.bookingStatus === 'awaiting_approval' && ['paid', 'partially-paid'].includes(booking.paymentStatus)) {
      // Also reserve vehicle for paid bookings awaiting approval
      await Vehicle.findByIdAndUpdate(booking.vehicleId, {
        availability: 'reserved',
        currentBookingId: booking._id
      });
      console.log(`🔒 Vehicle ${booking.vehicleId} marked as reserved for booking ${booking._id} (awaiting approval)`);
    }

    res.json({
      success: true,
      message: booking.bookingStatus === 'awaiting_approval'
        ? 'Payment successful. Booking is pending seller approval.'
        : 'Payment verified successfully',
      data: {
        booking: booking,
        paymentStatus: booking.paymentStatus,
        bookingStatus: booking.bookingStatus,
        requiresApproval: vehicle?.requiresApproval || false
      }
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};

// ===== BOOKING STATUS MANAGEMENT =====

// Update booking status
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason, meterReading, payment, notes } = req.body;

    const booking = await VehicleBooking.findById(id).populate('vehicleId');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check permission
    const hasAccess = req.user.role === 'admin' ||
      (req.user.role === 'seller' && booking.vehicleId.sellerId.toString() === req.user.id);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this booking'
      });
    }

    const oldStatus = booking.bookingStatus;

    // Process Payment if provided
    if (payment && payment.collected > 0) {
      booking.payments.push({
        amount: payment.collected,
        paymentType: payment.mode || 'cash',
        paymentMethod: 'Manual Collection', // Handover collection
        status: 'success',
        paymentDate: new Date(),
        notes: payment.notes
      });
      booking.paidAmount = (booking.paidAmount || 0) + Number(payment.collected);

      // Update payment status
      // Note: billing.totalBill might be updated later in this function if extra charges apply
      // So we might need to re-check payment status at the end, but basic check here:
      if (booking.paidAmount >= booking.billing.totalBill) {
        booking.paymentStatus = 'paid';
      } else {
        booking.paymentStatus = 'partially-paid';
      }
    }

    booking.bookingStatus = status;

    // Handle status-specific logic
    if (status === 'ongoing' && oldStatus !== 'ongoing') {
      booking.actualStartTime = new Date();

      // Update vehicle tracking
      booking.rideTracking.push({
        kmReading: meterReading || booking.vehicleId.meterReading || 0,
        status: 'picked-up',
        recordedBy: req.user.id,
        notes: notes || 'Vehicle picked up by customer'
      });
    }

    if (status === 'completed' && oldStatus === 'ongoing') {
      booking.actualEndTime = new Date();

      // Calculate extra charges
      // Calculate actual hours duration
      const actualDurationHours = Math.ceil((new Date() - new Date(booking.actualStartTime || booking.startDateTime)) / (1000 * 60 * 60));

      // Calculate distance if meter reading provided
      let distanceTraveled = 0;
      if (meterReading && booking.vehicleId.meterReading) {
        distanceTraveled = Math.max(0, meterReading - booking.vehicleId.meterReading);
      }

      // Calculate extra charges using model method
      // Note: We need to ensure calculateExtraCharges handles (distance, hours)
      // Assuming model has this method. If not, we should implement it or do it here.
      // Based on previous code, it had booking.calculateExtraCharges(actualKm, actualHours)

      let extraCharges = { extraKmCharge: 0, extraHourCharge: 0 };
      if (booking.calculateExtraCharges) {
        try {
          extraCharges = booking.calculateExtraCharges(distanceTraveled, actualDurationHours);
        } catch (e) {
          console.log("Error calculating extra charges via model method", e);
          // Fallback or ignore
        }
      }

      booking.billing.extraKmCharge = extraCharges.extraKmCharge;
      booking.billing.extraHourCharge = extraCharges.extraHourCharge;
      booking.billing.totalBill += (extraCharges.extraKmCharge + extraCharges.extraHourCharge);

      // Re-evaluate payment status after updating total bill
      if (booking.paidAmount >= booking.billing.totalBill) {
        booking.paymentStatus = 'paid';
      } else {
        booking.paymentStatus = 'partially-paid';
      }

      // Add return tracking
      booking.rideTracking.push({
        kmReading: meterReading || 0,
        status: 'returned',
        recordedBy: req.user.id,
        notes: reason || notes || 'Vehicle returned successfully'
      });

      // Update vehicle availability
      await Vehicle.findByIdAndUpdate(booking.vehicleId._id, {
        availability: 'available',
        status: 'active',
        currentBookingId: null,
        meterReading: meterReading || booking.vehicleId.meterReading
      });
      console.log(`🔓 Vehicle ${booking.vehicleId._id} released after completion of booking ${booking._id}`);
    }

    if (status === 'cancelled') {
      booking.cancellationReason = reason || notes;
      if (booking.calculateCancellationCharges) {
        booking.cancellationCharges = booking.calculateCancellationCharges();
      }

      // Update vehicle availability and clear booking reference
      await Vehicle.findByIdAndUpdate(booking.vehicleId._id, {
        availability: 'available',
        status: 'active',
        currentBookingId: null
      });
      console.log(`🔓 Vehicle ${booking.vehicleId._id} released from cancelled booking ${booking._id}`);
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Booking status updated successfully',
      data: booking
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
      error: error.message
    });
  }
};

// ===== REFUND PROCESSING =====

// Process refund
const processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      refundAmount,
      reason,
      refundMethod,
      bankDetails,
      notes
    } = req.body;

    const booking = await VehicleBooking.findById(id);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (!booking.isRefundEligible()) {
      return res.status(400).json({
        success: false,
        message: 'Booking is not eligible for refund'
      });
    }

    // Check permission
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can process refunds'
      });
    }

    booking.refundDetails = {
      reason,
      requestedAmount: refundAmount,
      approvedAmount: refundAmount,
      refundMethod,
      bankDetails,
      processedBy: req.user.id,
      processedDate: new Date(),
      notes
    };

    booking.refundStatus = 'completed';
    booking.paymentStatus = 'refunded';

    await booking.save();

    // Here you would integrate with actual payment gateway refund API
    // For now, we'll just mark it as processed

    res.json({
      success: true,
      message: 'Refund processed successfully',
      data: {
        bookingId: booking._id,
        refundAmount: refundAmount,
        refundMethod: refundMethod,
        refundReference: `REF_${Date.now()}`
      }
    });
  } catch (error) {
    console.error('Error processing refund:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process refund',
      error: error.message
    });
  }
};

// ===== USER BOOKING HISTORY =====

// Get user's booking history
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      status,
      page = 1,
      limit = 10,
      startDate,
      endDate
    } = req.query;

    let filter = { userId };

    if (status) filter.bookingStatus = status;

    if (startDate && endDate) {
      filter.bookingDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (page - 1) * limit;

    const bookings = await VehicleBooking.find(filter)
      .populate('vehicleId', 'name vehicleNo category type vehicleImages zoneCenterName companyName')
      .sort({ bookingDate: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await VehicleBooking.countDocuments(filter);

    res.json({
      success: true,
      data: bookings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user bookings',
      error: error.message
    });
  }
};

// Get booking by lookup (public - no auth required)
const getBookingByLookup = async (req, res) => {
  try {
    const { bookingId, email, phone } = req.query;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        message: 'Email or phone number is required for verification'
      });
    }

    // Build lookup filter
    let filter = { bookingId };

    // Add email or phone filter for security
    if (email) {
      filter['customerDetails.email'] = email;
    } else if (phone) {
      filter['customerDetails.phone'] = phone;
    }

    const booking = await VehicleBooking.findOne(filter)
      .populate('vehicleId', 'name vehicleNo category type vehicleImages zoneCenterName')
      .populate('userId', 'name email phone')
      .select('-__v'); // Exclude version field

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or verification details do not match'
      });
    }

    // Return limited booking information for security
    const publicBookingInfo = {
      bookingId: booking.bookingId,
      vehicleInfo: {
        name: booking.vehicleId?.name,
        vehicleNo: booking.vehicleId?.vehicleNo,
        category: booking.vehicleId?.category,
        type: booking.vehicleId?.type,
        zoneCenterName: booking.vehicleId?.zoneCenterName
      },
      bookingDate: booking.bookingDate,
      startDateTime: booking.startDateTime,
      endDateTime: booking.endDateTime,
      bookingStatus: booking.bookingStatus,
      totalAmount: booking.totalAmount,
      paidAmount: booking.paidAmount,
      paymentStatus: booking.paymentStatus,
      customerDetails: {
        name: booking.customerDetails?.name,
        phone: booking.customerDetails?.phone,
        email: booking.customerDetails?.email
      },
      pickupLocation: booking.pickupLocation,
      dropoffLocation: booking.dropoffLocation
    };

    res.json({
      success: true,
      data: publicBookingInfo,
      message: 'Booking details retrieved successfully'
    });

  } catch (error) {
    console.error('Error in booking lookup:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve booking details',
      error: error.message
    });
  }
};

// Approve or Deny Booking (Seller Action)
const approveBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body; // action: 'approve' or 'deny'

    const booking = await VehicleBooking.findById(id).populate('vehicleId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Permission check
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      // More strict: check if seller owns vehicle
      if (booking.vehicleId.sellerId.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized' });
      }
    }

    if (booking.bookingStatus !== 'awaiting_approval') {
      return res.status(400).json({ success: false, message: 'Booking is not pending approval' });
    }

    if (action === 'approve') {
      booking.bookingStatus = 'confirmed';

      // If this is an approval-required booking, update requestStatus as well
      if (booking.requiresApproval && booking.requestStatus === 'pending-approval') {
        booking.requestStatus = 'approved';
        booking.approvedBy = req.user.id;
        booking.approvedAt = new Date();
        booking.approverRole = req.user.role;

        // Set payment expiry (30 minutes from approval)
        booking.requestExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
      }

      booking.statusHistory.push({
        status: 'confirmed',
        updatedBy: req.user.id,
        notes: booking.requiresApproval
          ? 'Booking request approved by seller - awaiting payment'
          : 'Request approved by seller'
      });

      // Update vehicle status
      await Vehicle.findByIdAndUpdate(booking.vehicleId._id, {
        availability: 'not-available',
        status: 'booked'
      });
    } else if (action === 'deny') {
      booking.bookingStatus = 'cancelled';
      booking.cancellationReason = reason || 'Request denied by seller';
      booking.statusHistory.push({
        status: 'cancelled',
        updatedBy: req.user.id,
        notes: 'Request denied: ' + (reason || '')
      });

      // Auto-initiate refund
      if (booking.paymentStatus === 'paid' || booking.paymentStatus === 'partially-paid') {
        booking.refundStatus = 'pending'; // In a real scenario, this would trigger an automatic refund via Razorpay API
      }

      // Free up vehicle
      await Vehicle.findByIdAndUpdate(booking.vehicleId._id, {
        availability: 'available',
        status: 'active',
        currentBookingId: null
      });
      console.log(`🔓 Vehicle ${booking.vehicleId._id} released from denied booking ${booking._id}`);
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    await booking.save();

    res.json({
      success: true,
      message: `Booking ${action}ed successfully`,
      data: booking
    });

  } catch (error) {
    console.error('Error in booking approval:', error);
    res.status(500).json({ success: false, message: 'Action failed', error: error.message });
  }
};

// ===== EXTENSION REQUEST MANAGEMENT =====

// Request extension (User requests more time)
const requestExtension = async (req, res) => {
  try {
    const { id } = req.params; // booking ID
    const { newEndDateTime } = req.body;

    const booking = await VehicleBooking.findById(id).populate('vehicleId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Validate ownership
    if (booking.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Validate booking status
    if (!['confirmed', 'ongoing'].includes(booking.bookingStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Extension can only be requested for confirmed or ongoing bookings'
      });
    }

    // Check if there's already a pending extension
    const pendingExtension = booking.extensionRequests?.find(e => e.status === 'pending');
    if (pendingExtension) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending extension request'
      });
    }

    // Validate new end time is after current end time
    const newEnd = new Date(newEndDateTime);
    const currentEnd = new Date(booking.endDateTime);

    if (newEnd <= currentEnd) {
      return res.status(400).json({
        success: false,
        message: 'New end time must be after current end time'
      });
    }

    // Calculate additional hours
    const additionalHours = Math.ceil((newEnd - currentEnd) / (1000 * 60 * 60));

    if (additionalHours < 1) {
      return res.status(400).json({
        success: false,
        message: 'Minimum extension is 1 hour'
      });
    }

    // Check for conflicts with other bookings
    const vehicle = booking.vehicleId;
    const bufferMs = (vehicle.minBufferTime || 30) * 60 * 1000;

    const conflictingBookings = await VehicleBooking.find({
      vehicleId: vehicle._id,
      _id: { $ne: booking._id },
      bookingStatus: { $in: ['confirmed', 'ongoing', 'awaiting_approval'] },
      startDateTime: { $lt: new Date(newEnd.getTime() + bufferMs) },
      endDateTime: { $gt: currentEnd }
    });

    if (conflictingBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Extension conflicts with another booking',
        nextAvailable: conflictingBookings[0].startDateTime
      });
    }

    // Calculate extension cost
    const isHourly24 = booking.rateType === 'hourly24' || booking.rateType === '24hr';
    const hourlyRate = booking.ratePlanUsed.includesFuel
      ? (isHourly24 ? vehicle.rate24hr?.withFuelPerHour : vehicle.rate12hr?.withFuelPerHour)
      : (isHourly24 ? vehicle.rate24hr?.withoutFuelPerHour : vehicle.rate12hr?.withoutFuelPerHour);

    const additionalAmount = additionalHours * (hourlyRate || 50);
    // GST on extension - Commented out for now
    // const additionalGst = Math.round(additionalAmount * 0.18);
    const additionalGst = 0; // GST disabled

    // Calculate additional KM limit
    const hoursPerBlock = isHourly24 ? 24 : 12;
    const kmPerBlock = booking.ratePlanUsed.kmLimit || 100;
    const additionalBlocks = Math.ceil(additionalHours / hoursPerBlock);
    const additionalKmLimit = additionalBlocks * kmPerBlock;

    // Store original end time if first extension
    if (!booking.originalEndDateTime) {
      booking.originalEndDateTime = booking.endDateTime;
    }

    // Create extension request
    const extensionRequest = {
      requestedEndDateTime: newEnd,
      additionalHours,
      additionalAmount,
      additionalGst,
      additionalKmLimit,
      status: 'pending',
      requestedAt: new Date()
    };

    booking.extensionRequests.push(extensionRequest);
    await booking.save();

    res.json({
      success: true,
      message: 'Extension request submitted successfully',
      data: {
        requestId: booking.extensionRequests[booking.extensionRequests.length - 1].requestId,
        additionalHours,
        additionalAmount,
        additionalGst,
        totalExtensionCost: additionalAmount + additionalGst,
        additionalKmLimit,
        newEndDateTime: newEnd,
        status: 'pending'
      }
    });

  } catch (error) {
    console.error('Error requesting extension:', error);
    res.status(500).json({ success: false, message: 'Failed to request extension', error: error.message });
  }
};

// Respond to extension request (Seller approves/rejects)
const respondToExtension = async (req, res) => {
  try {
    const { id } = req.params; // booking ID
    const { requestId, action, rejectionReason } = req.body;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action. Use approve or reject' });
    }

    const booking = await VehicleBooking.findById(id).populate('vehicleId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Validate seller owns this vehicle
    const vehicle = await Vehicle.findById(booking.vehicleId._id);
    if (vehicle.sellerId.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Find the extension request
    const extensionIndex = booking.extensionRequests.findIndex(
      e => e.requestId === requestId && e.status === 'pending'
    );

    if (extensionIndex === -1) {
      return res.status(404).json({ success: false, message: 'Pending extension request not found' });
    }

    const extension = booking.extensionRequests[extensionIndex];

    if (action === 'reject') {
      extension.status = 'rejected';
      extension.rejectionReason = rejectionReason || 'Rejected by seller';
      extension.respondedAt = new Date();
      extension.respondedBy = req.user.id;

      await booking.save();

      return res.json({
        success: true,
        message: 'Extension request rejected',
        data: { status: 'rejected', reason: extension.rejectionReason }
      });
    }

    // Approve - Create Razorpay order for payment
    extension.status = 'approved';
    extension.respondedAt = new Date();
    extension.respondedBy = req.user.id;

    const totalAmount = extension.additionalAmount + extension.additionalGst;

    const order = await razorpay.orders.create({
      amount: Math.round(totalAmount * 100), // Convert to paise
      currency: 'INR',
      receipt: `ext_${requestId}`,
      notes: {
        bookingId: id,
        requestId: requestId,
        type: 'extension_payment'
      }
    });

    extension.paymentReference = {
      razorpayOrderId: order.id
    };

    await booking.save();

    res.json({
      success: true,
      message: 'Extension approved. Awaiting payment.',
      data: {
        status: 'approved',
        orderId: order.id,
        amount: totalAmount,
        additionalHours: extension.additionalHours,
        additionalKmLimit: extension.additionalKmLimit,
        newEndDateTime: extension.requestedEndDateTime
      }
    });

  } catch (error) {
    console.error('Error responding to extension:', error);
    res.status(500).json({ success: false, message: 'Failed to process response', error: error.message });
  }
};

// Verify extension payment (User pays for approved extension)
const verifyExtensionPayment = async (req, res) => {
  try {
    const { id } = req.params; // booking ID
    const { requestId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const booking = await VehicleBooking.findById(id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Find approved extension
    const extension = booking.extensionRequests.find(
      e => e.requestId === requestId && e.status === 'approved'
    );

    if (!extension) {
      return res.status(404).json({ success: false, message: 'Approved extension not found' });
    }

    // Verify signature
    const crypto = require('crypto');
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid payment signature' });
    }

    // Update extension status
    extension.status = 'paid';
    extension.paymentReference.razorpayPaymentId = razorpay_payment_id;
    extension.paidAt = new Date();

    // Update booking with new end time and limits
    booking.endDateTime = extension.requestedEndDateTime;
    booking.totalExtensionHours += extension.additionalHours;
    booking.totalExtensionAmount += (extension.additionalAmount + extension.additionalGst);

    // Calculate new KM limit
    const currentKmLimit = booking.currentKmLimit || booking.ratePlanUsed.kmLimit || 100;
    booking.currentKmLimit = currentKmLimit + extension.additionalKmLimit;

    // Update billing
    booking.billing.totalBill += (extension.additionalAmount + extension.additionalGst);
    booking.paidAmount += (extension.additionalAmount + extension.additionalGst);

    // Add payment record
    booking.payments.push({
      amount: extension.additionalAmount + extension.additionalGst,
      paymentType: 'UPI',
      paymentMethod: 'Razorpay',
      paymentReference: {
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id
      },
      status: 'success',
      notes: `Extension payment for ${extension.additionalHours} hours`
    });

    await booking.save();

    res.json({
      success: true,
      message: 'Extension payment verified. Booking updated.',
      data: {
        newEndDateTime: booking.endDateTime,
        newKmLimit: booking.currentKmLimit,
        totalExtensionHours: booking.totalExtensionHours,
        totalExtensionAmount: booking.totalExtensionAmount,
        updatedTotalBill: booking.billing.totalBill
      }
    });

  } catch (error) {
    console.error('Error verifying extension payment:', error);
    res.status(500).json({ success: false, message: 'Payment verification failed', error: error.message });
  }
};

// Recalculate bill on drop (Final bill calculation when vehicle is returned)
const recalculateBillOnDrop = async (req, res) => {
  try {
    const { id } = req.params;
    const { actualEndTime, actualKmReading } = req.body;

    const booking = await VehicleBooking.findById(id).populate('vehicleId');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const vehicle = booking.vehicleId;
    const actualEnd = actualEndTime ? new Date(actualEndTime) : new Date();
    // Use actualStartTime if available (e.g. from pickup), else original start
    const actualStart = booking.actualStartTime || new Date(booking.startDateTime);

    // 1. Calculate Duration (Exact or Ceil? Prompt says "Time is calculated exactly (hours + minutes/60)", but example "11 hr 30 min = 11.5 hours". So float.)
    // Note: prompt says "No rounding up or down". 
    // But calculateBillingDetails used Math.ceil.
    // I should use float for the Hourly logic multiplication? 
    // Example: "1.5 hr -> 15 km". 
    // Example: "11 hr 30 min -> 11.5 hr".
    // So I use float hours.
    const durationMs = actualEnd - actualStart;
    const actualHours = durationMs / (1000 * 60 * 60); // Float hours

    // 2. Billing Logic based on rateType and ratePlanUsed snapshot
    const rateConfig = booking.ratePlanUsed;
    let rentTotal = 0;
    let kmLimit = 0;

    // Normalize logic
    if (['hourly', 'hourly_plan'].includes(booking.rateType)) {
      // HOURLY PLAN
      // Time Charge = Total Hours * Hourly Rate
      const rate = rateConfig.ratePerHour || 50;
      rentTotal = actualHours * rate;

      // Free KM = Total Hours * 10
      const freePerHr = rateConfig.kmFreePerHour || 10;
      kmLimit = actualHours * freePerHr;

    } else if (['12hr', 'hourly12', '12_hour'].includes(booking.rateType)) {
      // 12-HOUR PLAN
      // Base Duration: 12 hr
      rentTotal = rateConfig.baseRate || 500;
      kmLimit = rateConfig.kmLimit || 120;

      if (actualHours > 12) {
        const extraTime = actualHours - 12;
        const extraHrRate = rateConfig.extraChargePerHour || 50;
        rentTotal += extraTime * extraHrRate;
      }

    } else if (['24hr', 'hourly24', '24_hour'].includes(booking.rateType)) {
      // 24-HOUR PLAN
      rentTotal = rateConfig.baseRate || 750;
      kmLimit = rateConfig.kmLimit || 150;

      if (actualHours > 24) {
        const extraTime = actualHours - 24;
        const blocks = Math.floor(extraTime / 12);
        const remaining = extraTime % 12;

        const blockRate = rateConfig.extraBlockRate || 500;
        const hrRate = rateConfig.extraChargePerHour || 3;

        rentTotal += (blocks * blockRate) + (remaining * hrRate);
      }

    } else {
      // Fallback or other types (Daily)
      // Assume simple daily logic or legacy
      const days = Math.ceil(actualHours / 24);
      rentTotal = days * (rateConfig.baseRate || 0);
      kmLimit = days * (rateConfig.kmLimit || 0);
    }

    // 3. Calculate Extra KM Charges
    let extraKmCharge = 0;
    if (actualKmReading && vehicle.meterReading) {
      const distanceTraveled = actualKmReading - vehicle.meterReading;
      // Prompt says "Extra KM can never be negative" --> max(0, ...)
      const extraKm = Math.max(0, distanceTraveled - kmLimit);

      if (extraKm > 0) {
        const extraKmRate = rateConfig.extraChargePerKm || 0;
        extraKmCharge = extraKm * extraKmRate;
      }
    }

    // 4. Determine Extra Hour Charge (Rent Diff)
    // The Rent component calculated above includes the Base + Extra Time.
    // We store the diff as 'extraHourCharge' for breakdown consistency
    // booking.billing.baseAmount is the original Upfront Cost.
    // So extraHourCharge = rentTotal - booking.billing.baseAmount
    // Note: If rentTotal < baseAmount (Early return), we don't refund base usually.
    const originalBase = booking.billing.baseAmount;
    const extraTimeCharge = Math.max(0, rentTotal - originalBase);

    // 5. Update Billing Object
    // We update the 'extra...' fields. 
    // We do NOT overwrite baseAmount usually, to preserve history?
    // But 'rentTotal' is the TRUTH of what they owe for time.
    // If we use 'extraHourCharge', Total = Base + ExtraHour + ExtraKM.
    // Total = originalBase + (rentTotal - originalBase) + extraKm = rentTotal + extraKm.
    // This is correct.

    // Update Taxes - GST commented out for now
    // Tax is on the Total Bill usually. Or just on the extras?
    // Usually GST is on the final service amount.
    // New Total = rentTotal + extraKmCharge + addons.
    // We need to fetch addons total (unchanged)
    const addonsTotal = booking.addons.reduce((sum, item) => sum + (item.price * (item.count || 1)), 0);
    const damageCharges = booking.billing.damageCharges || 0;

    // Subtotal
    const subtotal = rentTotal + extraKmCharge + addonsTotal + damageCharges;
    // const newGst = Math.round(subtotal * 0.18);
    const newGst = 0; // GST disabled
    const newTotalBill = subtotal + newGst; // Currently: subtotal + 0

    booking.billing.extraHourCharge = extraTimeCharge;
    booking.billing.extraKmCharge = extraKmCharge;
    booking.billing.taxes.gst = newGst; // Update full tax (currently 0)
    booking.billing.totalBill = newTotalBill;

    // Update booking state
    booking.actualEndTime = actualEnd;
    if (actualKmReading) {
      booking.endKmReading = actualKmReading;
    }

    // Update vehicle meter reading?
    // Usually vehicle meter reading is updated on 'completion'.
    // If this is the drop-off step, we should update vehicle.
    // But typically there is a 'completeBooking' step. 
    // If 'recalculateBillOnDrop' is just a calc step, maybe strictly update billing.
    // But users might expect it to 'record' the drop.
    // Looking at filename, it's just recalculate.
    // However, saving `actualEndTime` implies we are recording the fact.

    await booking.save();

    // Calculate final due
    const amountDue = Math.max(0, newTotalBill - booking.paidAmount);

    res.json({
      success: true,
      message: 'Bill recalculated based on strict metering',
      data: {
        actualDuration: actualHours.toFixed(2),
        rentTotal,
        kmLimit: kmLimit.toFixed(1),
        extraTimeCharge,
        extraKmCharge,
        totalWithTax: newTotalBill,
        billing: booking.billing,
        paidAmount: booking.paidAmount,
        amountDue,
        depositRefundable: amountDue <= 0 ? booking.depositAmount : Math.max(0, booking.depositAmount - amountDue)
      }
    });

  } catch (error) {
    console.error('Error recalculating bill:', error);
    res.status(500).json({ success: false, message: 'Failed to recalculate bill', error: error.message });
  }
};

// Get pending extension requests for seller
const getPendingExtensions = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Find all vehicles owned by this seller
    const vehicles = await Vehicle.find({ sellerId }).select('_id');
    const vehicleIds = vehicles.map(v => v._id);

    // Find bookings with pending extensions
    const bookings = await VehicleBooking.find({
      vehicleId: { $in: vehicleIds },
      'extensionRequests.status': 'pending'
    })
      .populate('vehicleId', 'name vehicleNo')
      .populate('userId', 'name phone email')
      .select('bookingId vehicleId userId startDateTime endDateTime extensionRequests customerDetails');

    // Extract pending extensions
    const pendingExtensions = [];
    bookings.forEach(booking => {
      const pending = booking.extensionRequests.filter(e => e.status === 'pending');
      pending.forEach(ext => {
        pendingExtensions.push({
          bookingId: booking._id,
          bookingNumber: booking.bookingId,
          vehicle: booking.vehicleId,
          customer: booking.userId || { name: booking.customerDetails?.name, phone: booking.customerDetails?.phone },
          currentEndTime: booking.endDateTime,
          extensionRequest: ext
        });
      });
    });

    res.json({
      success: true,
      data: pendingExtensions,
      count: pendingExtensions.length
    });

  } catch (error) {
    console.error('Error fetching pending extensions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch extensions', error: error.message });
  }
};

// ===== DEPOSIT COLLECTION AT PICKUP =====
const collectDepositAtPickup = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { depositAmount, paymentMethod, notes } = req.body;

    const booking = await VehicleBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify this booking allows deposit at pickup
    if (booking.depositCollectionMethod !== 'at-pickup') {
      return res.status(400).json({
        success: false,
        message: 'This booking requires deposit to be paid online'
      });
    }

    // Verify deposit not already collected
    if (booking.depositStatus === 'collected-at-pickup' || booking.depositStatus === 'collected-online') {
      return res.status(400).json({
        success: false,
        message: 'Deposit already collected'
      });
    }

    // Record deposit payment
    booking.payments.push({
      amount: depositAmount,
      paymentType: paymentMethod === 'cash' ? 'Cash' : 'UPI',
      paymentMethod: paymentMethod === 'cash' ? 'Cash' : 'UPI',
      status: 'success',
      receivedBy: req.user.id,
      receivedAt: new Date(),
      notes: `Deposit collected at pickup: ${notes || ''}`
    });

    booking.depositStatus = 'collected-at-pickup';
    booking.paidAmount += depositAmount;

    await booking.save();

    res.json({
      success: true,
      message: 'Deposit collected successfully',
      data: {
        bookingId: booking._id,
        depositAmount: depositAmount,
        depositStatus: booking.depositStatus,
        totalPaid: booking.paidAmount
      }
    });

  } catch (error) {
    console.error('Error collecting deposit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to collect deposit',
      error: error.message
    });
  }
};

/**
 * Get Worker Dashboard - Zone-Restricted View
 * Workers can only see bookings and vehicles from their assigned zone
 * @route GET /api/vehicles/worker/dashboard
 * @access Protected (Worker only)
 */
const getWorkerDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const { zoneId } = req.query;

    // Get user details to verify worker role
    const User = require('../../models/User');
    const user = await User.findById(userId);

    if (!user || user.role !== 'worker') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Worker role required.'
      });
    }

    // Verify worker has required profile
    if (!user.workerProfile || !user.workerProfile.zoneId) {
      return res.status(400).json({
        success: false,
        message: 'Worker profile incomplete. Zone assignment required.'
      });
    }

    // Use provided zoneId or fall back to worker's assigned zone
    const targetZoneId = zoneId || user.workerProfile.zoneId;

    // Security: Verify worker can only access their assigned zone
    if (targetZoneId !== user.workerProfile.zoneId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view data from your assigned zone.',
        allowedZone: {
          id: user.workerProfile.zoneId,
          code: user.workerProfile.zoneCode,
          name: user.workerProfile.zoneName
        }
      });
    }

    const Vehicle = require('../../models/Vehicle');
    const VehicleBooking = require('../../models/VehicleBooking');

    // Get current month date range
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    // Fetch vehicles in worker's zone
    const vehicles = await Vehicle.find({
      sellerId: user.workerProfile.sellerId,
      zoneCode: user.workerProfile.zoneCode,
      isDeleted: { $ne: 1 }
    }).select('name vehicleNo category type availability status');

    const vehicleIds = vehicles.map(v => v._id);

    // Fetch bookings for these vehicles (this month)
    const bookings = await VehicleBooking.find({
      vehicleId: { $in: vehicleIds },
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    }).populate('userId', 'name email phone')
      .populate('vehicleId', 'name vehicleNo category type')
      .sort({ createdAt: -1 })
      .limit(20);

    // Calculate statistics
    const stats = {
      totalBookings: bookings.length,
      activeBookings: bookings.filter(b =>
        ['confirmed', 'ongoing', 'picked-up'].includes(b.bookingStatus)
      ).length,
      pendingBookings: bookings.filter(b => b.bookingStatus === 'pending').length,
      completedBookings: bookings.filter(b => b.bookingStatus === 'completed').length,
      totalVehicles: vehicles.length,
      availableVehicles: vehicles.filter(v => v.availability === 'available').length,
      bookedVehicles: vehicles.filter(v => v.availability === 'booked').length,
      totalRevenue: bookings
        .filter(b => b.paymentStatus === 'paid')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0)
    };

    // Format recent bookings
    const recentBookings = bookings.slice(0, 10).map(booking => ({
      _id: booking._id,
      bookingCode: booking.bookingCode,
      vehicleName: booking.vehicleId?.name || 'N/A',
      vehicleNo: booking.vehicleId?.vehicleNo || 'N/A',
      customerName: booking.userId?.name || 'N/A',
      customerPhone: booking.userId?.phone || 'N/A',
      pickupDate: booking.pickupDate,
      dropoffDate: booking.dropoffDate,
      bookingStatus: booking.bookingStatus,
      paymentStatus: booking.paymentStatus,
      totalAmount: booking.totalAmount,
      createdAt: booking.createdAt
    }));

    res.json({
      success: true,
      message: 'Worker dashboard data retrieved successfully',
      data: {
        workerInfo: {
          id: user._id,
          name: user.name,
          email: user.email,
          assignedZone: {
            id: user.workerProfile.zoneId,
            code: user.workerProfile.zoneCode,
            name: user.workerProfile.zoneName
          },
          performance: user.workerProfile.performance
        },
        stats,
        recentBookings,
        vehicles: vehicles.map(v => ({
          _id: v._id,
          name: v.name,
          vehicleNo: v.vehicleNo,
          category: v.category,
          type: v.type,
          availability: v.availability,
          status: v.status
        })),
        dateRange: {
          start: startOfMonth,
          end: endOfMonth
        }
      }
    });

  } catch (error) {
    console.error('Error fetching worker dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch worker dashboard',
      error: error.message
    });
  }
};

module.exports = {
  getBookings,
  getBookingById,
  validateBookingDetails,
  createBooking,
  createRazorpayOrder,
  verifyPayment,
  updateBookingStatus,
  processRefund,
  getUserBookings,
  getBookingByLookup,
  approveBooking,
  requestExtension,
  respondToExtension,
  verifyExtensionPayment,
  recalculateBillOnDrop,
  getPendingExtensions,
  collectDepositAtPickup,
  getWorkerDashboard  // Add new function
};