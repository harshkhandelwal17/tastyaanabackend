const VehicleBooking = require('../models/VehicleBooking');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const mongoose = require('mongoose');

// =========================
// USER ENDPOINTS
// =========================

/**
 * Create a booking request for vehicles that require approval
 * POST /api/vehicles/bookings/request
 */
exports.createBookingRequest = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      vehicleId,
      pickupDate,
      returnDate,
      pickupTime,
      returnTime,
      requiresHelmet,
      requiresInsurance,
      helmetQuantity,
      additionalServices,
      calculatedAmount,
      depositAmount,
      notes,
      customerName,
      customerPhone,
      customerEmail,
      idProofType,
      idProofNumber,
      address,
      zone,
      zoneId,
      centerId,
      centerName
    } = req.body;

    // Validate vehicle exists and requires confirmation
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (!vehicle.requireConfirmation) {
      return res.status(400).json({ 
        message: 'This vehicle does not require approval. Please proceed with direct booking.' 
      });
    }

    // Check if vehicle is available for the requested dates
    if (vehicle.availability !== 'available' || vehicle.status === 'booked') {
      return res.status(400).json({ 
        message: 'Vehicle is not available for booking' 
      });
    }

    // Calculate total days
    const start = new Date(pickupDate);
    const end = new Date(returnDate);
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));

    if (totalDays < 1) {
      return res.status(400).json({ 
        message: 'Return date must be after pickup date' 
      });
    }

    // Set request expiry time (30 minutes from now)
    const requestedAt = new Date();
    const requestExpiresAt = new Date(requestedAt.getTime() + 30 * 60 * 1000); // 30 minutes

    // Create booking request
    const bookingRequest = new VehicleBooking({
      vehicleId,
      userId,
      bookingSource: 'online',
      requiresApproval: true,
      requestStatus: 'pending-approval',
      requestedAt,
      requestExpiresAt,
      
      // Save all booking details
      savedBookingDetails: {
        pickupDate,
        returnDate,
        pickupTime,
        returnTime,
        totalDays,
        requiresHelmet: requiresHelmet || false,
        requiresInsurance: requiresInsurance || false,
        helmetQuantity: helmetQuantity || 0,
        additionalServices: additionalServices || [],
        calculatedAmount,
        depositAmount,
        notes,
        customerName,
        customerPhone,
        customerEmail,
        idProofType,
        idProofNumber,
        address
      },
      
      // Timeline (will be updated after approval and payment)
      startDateTime: new Date(`${pickupDate}T${pickupTime}`),
      endDateTime: new Date(`${returnDate}T${returnTime}`),
      
      // Location
      zone,
      zoneId,
      centerId,
      centerName,
      
      // Customer details
      customerDetails: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail,
        idProof: {
          type: idProofType,
          number: idProofNumber
        },
        address
      },
      
      // Billing details (using correct field name)
      billing: {
        baseAmount: calculatedAmount - (additionalServices?.reduce((sum, s) => sum + s.price, 0) || 0),
        extraKmCharge: 0,
        extraHourCharge: 0,
        fuelCharges: 0,
        damageCharges: 0,
        cleaningCharges: 0,
        tollCharges: 0,
        lateFees: 0,
        discount: {
          amount: 0
        },
        taxes: {
          gst: 0,
          serviceTax: 0
        },
        totalBill: calculatedAmount
      },
      
      depositAmount: depositAmount || 0,
      
      // Initial status (use correct enum values)
      bookingStatus: 'pending', // Correct enum value
      paymentStatus: 'unpaid'   // Correct enum value
    });

    await bookingRequest.save();

    // Populate vehicle and user details
    await bookingRequest.populate('vehicleId userId');

    res.status(201).json({
      success: true,
      message: 'Booking request submitted successfully. Waiting for approval.',
      bookingRequest: {
        _id: bookingRequest._id,
        bookingId: bookingRequest.bookingId,
        requestStatus: bookingRequest.requestStatus,
        requestedAt: bookingRequest.requestedAt,
        requestExpiresAt: bookingRequest.requestExpiresAt,
        vehicle: bookingRequest.vehicleId,
        calculatedAmount,
        depositAmount,
        savedBookingDetails: bookingRequest.savedBookingDetails
      }
    });

  } catch (error) {
    console.error('Error creating booking request:', error);
    res.status(500).json({ 
      message: 'Failed to create booking request', 
      error: error.message 
    });
  }
};

/**
 * Get all booking requests for current user
 * GET /api/vehicles/bookings/my-requests
 */
exports.getMyBookingRequests = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query; // Filter by status: pending-approval, approved, rejected, expired

    let query = { 
      userId,
      requiresApproval: true
    };

    if (status) {
      query.requestStatus = status;
    }

    console.log('--- GET MY BOOKING REQUESTS ---');
    console.log('User ID:', userId);
    console.log('Query:', JSON.stringify(query, null, 2));
    console.log('-------------------------------');

    const requests = await VehicleBooking.find(query)
      .populate('vehicleId', 'brand model images rentalRates vehicleNumber')
      .populate('approvedBy rejectedBy', 'name email phone')
      .sort({ requestedAt: -1 });

    console.log('--- FOUND REQUESTS ---');
    console.log('Count:', requests.length);
    if (requests.length > 0) {
      console.log('Sample request:', {
        _id: requests[0]._id,
        bookingId: requests[0].bookingId,
        requiresApproval: requests[0].requiresApproval,
        requestStatus: requests[0].requestStatus,
        bookingStatus: requests[0].bookingStatus
      });
    }
    console.log('----------------------');

    // Check for expired requests and update status
    const now = new Date();
    const expiredRequests = requests.filter(req => 
      req.requestStatus === 'pending-approval' && 
      req.requestExpiresAt && 
      req.requestExpiresAt < now
    );

    if (expiredRequests.length > 0) {
      await Promise.all(
        expiredRequests.map(req => {
          req.requestStatus = 'expired';
          return req.save();
        })
      );
    }

    res.json({
      success: true,
      count: requests.length,
      requests
    });

  } catch (error) {
    console.error('Error fetching booking requests:', error);
    res.status(500).json({ 
      message: 'Failed to fetch booking requests', 
      error: error.message 
    });
  }
};

/**
 * Proceed to payment after request approval
 * POST /api/vehicles/bookings/request/:requestId/pay
 */
exports.proceedToPayment = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;
    const { paymentType, paymentMethod, transactionId } = req.body;

    // Find the booking request
    const bookingRequest = await VehicleBooking.findById(requestId)
      .populate('vehicleId');

    if (!bookingRequest) {
      return res.status(404).json({ message: 'Booking request not found' });
    }

    // Verify ownership
    if (bookingRequest.userId.toString() !== userId) {
      return res.status(403).json({ 
        message: 'Unauthorized to access this booking request' 
      });
    }

    // Check if request is approved
    if (bookingRequest.requestStatus !== 'approved') {
      return res.status(400).json({ 
        message: `Cannot proceed to payment. Request status: ${bookingRequest.requestStatus}` 
      });
    }

    // Check if request has expired (payment window expired)
    const now = new Date();
    if (bookingRequest.requestExpiresAt && bookingRequest.requestExpiresAt < now) {
      bookingRequest.requestStatus = 'payment-expired';
      bookingRequest.bookingStatus = 'cancelled'; // Cancel the booking so it doesn't block time slot
      
      // Free the vehicle since payment window expired - use direct update to avoid validation issues
      await Vehicle.findByIdAndUpdate(
        bookingRequest.vehicleId._id,
        { 
          status: 'active',
          availability: 'available',
          currentBookingId: null
        },
        { validateModifiedOnly: true }
      );
      
      await bookingRequest.save();
      
      return res.status(400).json({ 
        message: 'Payment window has expired (30 minutes after approval). Vehicle is now available again. Please create a new booking request.' 
      });
    }

    // THIS ENDPOINT SHOULD NOT AUTO-CONFIRM PAYMENT!
    // User needs to:
    // 1. Upload payment proof/screenshot
    // 2. Upload required documents (Aadhaar, License)
    // 3. Then seller/admin verifies and confirms booking
    
    // For now, we'll redirect to document upload flow
    // The booking request stays in 'approved' status until documents + payment proof are uploaded
    
    return res.status(400).json({
      success: false,
      message: 'Please upload payment proof and required documents to complete your booking.',
      action: 'redirect_to_document_upload',
      bookingRequestId: requestId,
      nextSteps: [
        'Upload Aadhaar card (front & back)',
        'Upload Driving License',
        'Upload payment screenshot/proof',
        'Wait for seller verification'
      ]
    });

  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ 
      message: 'Failed to process payment', 
      error: error.message 
    });
  }
};

// =========================
// WORKER ENDPOINTS
// =========================

/**
 * Get all pending booking requests for worker's zone
 * GET /api/vehicles/worker/booking-requests
 */
exports.getWorkerBookingRequests = async (req, res) => {
  try {
    const workerProfile = req.user.workerProfile;
    
    if (!workerProfile || !workerProfile.zoneId) {
      return res.status(403).json({ 
        message: 'Worker profile not found or zone not assigned' 
      });
    }

    const { status } = req.query;

    let query = {
      zoneId: workerProfile.zoneId,
      requiresApproval: true
    };

    if (status) {
      query.requestStatus = status;
    } else {
      // Default to pending requests
      query.requestStatus = 'pending-approval';
    }

    const requests = await VehicleBooking.find(query)
      .populate('vehicleId', 'brand model images rentalRates vehicleNumber category')
      .populate('userId', 'name email phone')
      .populate('approvedBy rejectedBy', 'name')
      .sort({ requestedAt: -1 });

    // Check and update expired requests
    const now = new Date();
    const expiredRequests = requests.filter(req => 
      req.requestStatus === 'pending-approval' && 
      req.requestExpiresAt && 
      req.requestExpiresAt < now
    );

    if (expiredRequests.length > 0) {
      await Promise.all(
        expiredRequests.map(req => {
          req.requestStatus = 'expired';
          return req.save();
        })
      );
    }

    res.json({
      success: true,
      count: requests.length,
      zone: {
        zoneId: workerProfile.zoneId,
        zoneCode: workerProfile.zoneCode,
        zoneName: workerProfile.zoneName
      },
      requests
    });

  } catch (error) {
    console.error('Error fetching worker booking requests:', error);
    res.status(500).json({ 
      message: 'Failed to fetch booking requests', 
      error: error.message 
    });
  }
};

/**
 * Approve a booking request
 * PUT /api/vehicles/worker/booking-requests/:requestId/approve
 */
exports.approveBookingRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const workerId = req.user.id;
    const workerProfile = req.user.workerProfile;

    if (!workerProfile || !workerProfile.zoneId) {
      return res.status(403).json({ 
        message: 'Worker profile not found or zone not assigned' 
      });
    }

    const bookingRequest = await VehicleBooking.findById(requestId)
      .populate('vehicleId')
      .populate('userId', 'name email phone');

    if (!bookingRequest) {
      return res.status(404).json({ message: 'Booking request not found' });
    }

    // Verify zone access
    if (bookingRequest.zoneId !== workerProfile.zoneId) {
      return res.status(403).json({ 
        message: 'You can only approve requests in your assigned zone' 
      });
    }

    // Check if request is pending
    if (bookingRequest.requestStatus !== 'pending-approval') {
      return res.status(400).json({ 
        message: `Cannot approve. Current status: ${bookingRequest.requestStatus}` 
      });
    }

    // Check if request has expired
    const now = new Date();
    if (bookingRequest.requestExpiresAt && bookingRequest.requestExpiresAt < now) {
      bookingRequest.requestStatus = 'expired';
      await bookingRequest.save();
      return res.status(400).json({ 
        message: 'Booking request has expired' 
      });
    }

    // Approve the request and set new 30-minute payment window
    const approvalTime = new Date();
    const paymentExpiresAt = new Date(approvalTime.getTime() + 30 * 60 * 1000); // 30 minutes from now
    
    bookingRequest.requestStatus = 'approved';
    bookingRequest.approvedBy = workerId;
    bookingRequest.approvedAt = approvalTime;
    bookingRequest.approverRole = 'worker';
    bookingRequest.requestExpiresAt = paymentExpiresAt; // Update expiry to 30 min from approval
    
    // Reserve the vehicle temporarily (mark as pending payment) - use direct update
    await Vehicle.findByIdAndUpdate(
      bookingRequest.vehicleId._id || bookingRequest.vehicleId,
      { 
        status: 'booked',
        availability: 'reserved',
        currentBookingId: bookingRequest._id
      },
      { validateModifiedOnly: true }
    );

    await bookingRequest.save();

    res.json({
      success: true,
      message: 'Booking request approved successfully. Vehicle reserved for 30 minutes for payment.',
      request: {
        _id: bookingRequest._id,
        bookingId: bookingRequest.bookingId,
        requestStatus: bookingRequest.requestStatus,
        approvedBy: bookingRequest.approvedBy,
        approvedAt: bookingRequest.approvedAt,
        customer: bookingRequest.userId,
        vehicle: bookingRequest.vehicleId
      }
    });

  } catch (error) {
    console.error('Error approving booking request:', error);
    res.status(500).json({ 
      message: 'Failed to approve booking request', 
      error: error.message 
    });
  }
};

/**
 * Reject a booking request
 * PUT /api/vehicles/worker/booking-requests/:requestId/reject
 */
exports.rejectBookingRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const workerId = req.user.id;
    const workerProfile = req.user.workerProfile;
    const { reason } = req.body;

    if (!workerProfile || !workerProfile.zoneId) {
      return res.status(403).json({ 
        message: 'Worker profile not found or zone not assigned' 
      });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Rejection reason is required' 
      });
    }

    const bookingRequest = await VehicleBooking.findById(requestId)
      .populate('vehicleId')
      .populate('userId', 'name email phone');

    if (!bookingRequest) {
      return res.status(404).json({ message: 'Booking request not found' });
    }

    // Verify zone access
    if (bookingRequest.zoneId !== workerProfile.zoneId) {
      return res.status(403).json({ 
        message: 'You can only reject requests in your assigned zone' 
      });
    }

    // Check if request is pending
    if (bookingRequest.requestStatus !== 'pending-approval') {
      return res.status(400).json({ 
        message: `Cannot reject. Current status: ${bookingRequest.requestStatus}` 
      });
    }

    // Reject the request
    bookingRequest.requestStatus = 'rejected';
    bookingRequest.rejectedBy = workerId;
    bookingRequest.rejectedAt = new Date();
    bookingRequest.rejectionReason = reason;

    await bookingRequest.save();

    res.json({
      success: true,
      message: 'Booking request rejected',
      request: {
        _id: bookingRequest._id,
        bookingId: bookingRequest.bookingId,
        requestStatus: bookingRequest.requestStatus,
        rejectedBy: bookingRequest.rejectedBy,
        rejectedAt: bookingRequest.rejectedAt,
        rejectionReason: bookingRequest.rejectionReason,
        customer: bookingRequest.userId,
        vehicle: bookingRequest.vehicleId
      }
    });

  } catch (error) {
    console.error('Error rejecting booking request:', error);
    res.status(500).json({ 
      message: 'Failed to reject booking request', 
      error: error.message 
    });
  }
};

// =========================
// SELLER ENDPOINTS
// =========================

/**
 * Get all pending booking requests for seller's vehicles
 * GET /api/vehicles/seller/booking-requests
 */
exports.getSellerBookingRequests = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { status } = req.query;

    // Get all vehicles owned by this seller
    const sellerVehicles = await Vehicle.find({ sellerId }).select('_id');
    const vehicleIds = sellerVehicles.map(v => v._id);

    if (vehicleIds.length === 0) {
      return res.json({
        success: true,
        count: 0,
        requests: []
      });
    }

    let query = {
      vehicleId: { $in: vehicleIds },
      requiresApproval: true
    };

    if (status) {
      query.requestStatus = status;
    } else {
      // Default to pending requests
      query.requestStatus = 'pending-approval';
    }

    const requests = await VehicleBooking.find(query)
      .populate('vehicleId', 'brand model images rentalRates vehicleNumber category')
      .populate('userId', 'name email phone')
      .populate('approvedBy rejectedBy', 'name')
      .sort({ requestedAt: -1 });

    // Check and update expired requests
    const now = new Date();
    const expiredRequests = requests.filter(req => 
      req.requestStatus === 'pending-approval' && 
      req.requestExpiresAt && 
      req.requestExpiresAt < now
    );

    if (expiredRequests.length > 0) {
      await Promise.all(
        expiredRequests.map(req => {
          req.requestStatus = 'expired';
          return req.save();
        })
      );
    }

    res.json({
      success: true,
      count: requests.length,
      requests
    });

  } catch (error) {
    console.error('Error fetching seller booking requests:', error);
    res.status(500).json({ 
      message: 'Failed to fetch booking requests', 
      error: error.message 
    });
  }
};

/**
 * Approve a booking request (Seller)
 * PUT /api/vehicles/seller/booking-requests/:requestId/approve
 */
exports.approveSellerBookingRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const sellerId = req.user.id;

    const bookingRequest = await VehicleBooking.findById(requestId)
      .populate('vehicleId')
      .populate('userId', 'name email phone');

    if (!bookingRequest) {
      return res.status(404).json({ message: 'Booking request not found' });
    }

    // Verify vehicle ownership
    if (bookingRequest.vehicleId.sellerId.toString() !== sellerId) {
      return res.status(403).json({ 
        message: 'You can only approve requests for your own vehicles' 
      });
    }

    // Check if request is pending
    if (bookingRequest.requestStatus !== 'pending-approval') {
      return res.status(400).json({ 
        message: `Cannot approve. Current status: ${bookingRequest.requestStatus}` 
      });
    }

    // Check if request has expired
    const now = new Date();
    if (bookingRequest.requestExpiresAt && bookingRequest.requestExpiresAt < now) {
      bookingRequest.requestStatus = 'expired';
      await bookingRequest.save();
      return res.status(400).json({ 
        message: 'Booking request has expired' 
      });
    }

    // Approve the request and set new 30-minute payment window
    const approvalTime = new Date();
    const paymentExpiresAt = new Date(approvalTime.getTime() + 30 * 60 * 1000); // 30 minutes from now
    
    bookingRequest.requestStatus = 'approved';
    bookingRequest.approvedBy = sellerId;
    bookingRequest.approvedAt = approvalTime;
    bookingRequest.approverRole = 'seller';
    bookingRequest.requestExpiresAt = paymentExpiresAt; // Update expiry to 30 min from approval
    
    // Reserve the vehicle temporarily (mark as pending payment) - use direct update
    await Vehicle.findByIdAndUpdate(
      bookingRequest.vehicleId._id || bookingRequest.vehicleId,
      { 
        status: 'booked',
        availability: 'reserved',
        currentBookingId: bookingRequest._id
      },
      { validateModifiedOnly: true }
    );

    await bookingRequest.save();

    res.json({
      success: true,
      message: 'Booking request approved successfully. Vehicle reserved for 30 minutes for payment.',
      request: {
        _id: bookingRequest._id,
        bookingId: bookingRequest.bookingId,
        requestStatus: bookingRequest.requestStatus,
        approvedBy: bookingRequest.approvedBy,
        approvedAt: bookingRequest.approvedAt,
        customer: bookingRequest.userId,
        vehicle: bookingRequest.vehicleId
      }
    });

  } catch (error) {
    console.error('Error approving booking request:', error);
    res.status(500).json({ 
      message: 'Failed to approve booking request', 
      error: error.message 
    });
  }
};

/**
 * Reject a booking request (Seller)
 * PUT /api/vehicles/seller/booking-requests/:requestId/reject
 */
exports.rejectSellerBookingRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const sellerId = req.user.id;
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Rejection reason is required' 
      });
    }

    const bookingRequest = await VehicleBooking.findById(requestId)
      .populate('vehicleId')
      .populate('userId', 'name email phone');

    if (!bookingRequest) {
      return res.status(404).json({ message: 'Booking request not found' });
    }

    // Verify vehicle ownership
    if (bookingRequest.vehicleId.sellerId.toString() !== sellerId) {
      return res.status(403).json({ 
        message: 'You can only reject requests for your own vehicles' 
      });
    }

    // Check if request is pending
    if (bookingRequest.requestStatus !== 'pending-approval') {
      return res.status(400).json({ 
        message: `Cannot reject. Current status: ${bookingRequest.requestStatus}` 
      });
    }

    // Reject the request
    bookingRequest.requestStatus = 'rejected';
    bookingRequest.rejectedBy = sellerId;
    bookingRequest.rejectedAt = new Date();
    bookingRequest.rejectionReason = reason;

    await bookingRequest.save();

    res.json({
      success: true,
      message: 'Booking request rejected',
      request: {
        _id: bookingRequest._id,
        bookingId: bookingRequest.bookingId,
        requestStatus: bookingRequest.requestStatus,
        rejectedBy: bookingRequest.rejectedBy,
        rejectedAt: bookingRequest.rejectedAt,
        rejectionReason: bookingRequest.rejectionReason,
        customer: bookingRequest.userId,
        vehicle: bookingRequest.vehicleId
      }
    });

  } catch (error) {
    console.error('Error rejecting booking request:', error);
    res.status(500).json({ 
      message: 'Failed to reject booking request', 
      error: error.message 
    });
  }
};

/**
 * Verify documents and confirm booking (Seller)
 * POST /api/vehicles/seller/booking-requests/:requestId/verify
 */
exports.verifyAndConfirmBooking = async (req, res) => {
  try {
    const { requestId } = req.params;
    const sellerId = req.user.id;

    // Find the booking request
    const bookingRequest = await VehicleBooking.findById(requestId)
      .populate('vehicleId')
      .populate('userId', 'name email phone');

    if (!bookingRequest) {
      return res.status(404).json({ message: 'Booking request not found' });
    }

    // Verify seller owns this vehicle
    if (bookingRequest.vehicleId.sellerId.toString() !== sellerId) {
      return res.status(403).json({ 
        message: 'Unauthorized: This vehicle does not belong to you' 
      });
    }

    // Check status
    if (bookingRequest.bookingStatus !== 'awaiting_approval') {
      return res.status(400).json({ 
        message: `Cannot verify. Booking status: ${bookingRequest.bookingStatus}` 
      });
    }

    // Check if documents are uploaded
    if (!bookingRequest.documents || bookingRequest.documents.length === 0) {
      return res.status(400).json({
        message: 'Customer has not uploaded documents yet'
      });
    }

    // Check if payment proof is uploaded
    if (!bookingRequest.payments || bookingRequest.payments.length === 0) {
      return res.status(400).json({
        message: 'Customer has not uploaded payment proof yet'
      });
    }

    // Verify payment proof exists
    const paymentProof = bookingRequest.payments[bookingRequest.payments.length - 1];
    if (!paymentProof || !paymentProof.paymentReference?.proofUrl) {
      return res.status(400).json({
        message: 'Payment proof not found'
      });
    }

    // Update payment status to verified
    paymentProof.status = 'success';
    paymentProof.verifiedBy = sellerId;
    paymentProof.verifiedAt = new Date();

    // Confirm booking
    bookingRequest.paymentStatus = 'paid';
    bookingRequest.paidAmount = bookingRequest.billing.totalBill;
    bookingRequest.bookingStatus = 'confirmed';
    bookingRequest.verifiedBy = sellerId;
    bookingRequest.verifiedAt = new Date();

    // Update vehicle status (keep it booked)
    await Vehicle.findByIdAndUpdate(
      bookingRequest.vehicleId._id,
      { 
        status: 'booked',
        availability: 'not-available',
        currentBookingId: bookingRequest._id
      },
      { validateModifiedOnly: true }
    );

    await bookingRequest.save();

    res.json({
      success: true,
      message: 'Documents and payment verified! Booking confirmed.',
      booking: bookingRequest
    });

  } catch (error) {
    console.error('Error verifying booking:', error);
    res.status(500).json({ 
      message: 'Failed to verify booking', 
      error: error.message 
    });
  }
};

// =========================
// UTILITY FUNCTIONS
// =========================

/**
 * Cron job to automatically expire requests after 30 minutes
 * Handles two cases:
 * 1. Pending approval requests (30 min after submission)
 * 2. Approved requests without payment (30 min after approval) - also frees vehicle
 */
exports.expirePendingRequests = async () => {
  try {
    const now = new Date();
    const Vehicle = require('../models/Vehicle');
    
    // Case 1: Expire pending-approval requests (30 min after submission)
    const expiredPendingResult = await VehicleBooking.updateMany(
      {
        requestStatus: 'pending-approval',
        requestExpiresAt: { $lt: now }
      },
      {
        $set: { requestStatus: 'expired' }
      }
    );

    // Case 2: Expire approved requests without payment (30 min after approval)
    // AND free the reserved vehicle
    const approvedExpiredRequests = await VehicleBooking.find({
      requestStatus: 'approved',
      requestExpiresAt: { $lt: now }
    });

    let vehiclesFreed = 0;
    for (const request of approvedExpiredRequests) {
      // Mark request as expired and cancel booking so it doesn't block time slot
      request.requestStatus = 'payment-expired';
      request.bookingStatus = 'cancelled';
      await request.save();

      // Free the vehicle (make it available again) - use direct update to avoid validation issues
      if (request.vehicleId) {
        await Vehicle.findByIdAndUpdate(
          request.vehicleId,
          { 
            status: 'active',
            availability: 'available',
            currentBookingId: null
          },
          { validateModifiedOnly: true }
        );
        vehiclesFreed++;
      }
    }

    const totalExpired = expiredPendingResult.modifiedCount + approvedExpiredRequests.length;
    
    console.log(`✅ Expired ${totalExpired} booking requests:`);
    console.log(`   - Pending approval: ${expiredPendingResult.modifiedCount}`);
    console.log(`   - Payment timeout: ${approvedExpiredRequests.length} (freed ${vehiclesFreed} vehicles)`);
    
    return {
      modifiedCount: totalExpired,
      pendingExpired: expiredPendingResult.modifiedCount,
      paymentExpired: approvedExpiredRequests.length,
      vehiclesFreed
    };

  } catch (error) {
    console.error('Error expiring pending requests:', error);
    throw error;
  }
};

/**
 * Upload documents and payment proof for booking request
 * POST /api/vehicles/bookings/request/:requestId/upload-documents
 */
exports.uploadDocuments = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;
    const { documents, paymentProof, transactionId, paymentType, paymentMethod } = req.body;

    // Find the booking request
    const bookingRequest = await VehicleBooking.findById(requestId)
      .populate('vehicleId');

    if (!bookingRequest) {
      return res.status(404).json({ message: 'Booking request not found' });
    }

    // Verify ownership
    if (bookingRequest.userId.toString() !== userId) {
      return res.status(403).json({ 
        message: 'Unauthorized to access this booking request' 
      });
    }

    // Check if request is approved
    if (bookingRequest.requestStatus !== 'approved') {
      return res.status(400).json({ 
        message: `Cannot upload documents. Request must be approved first. Current status: ${bookingRequest.requestStatus}` 
      });
    }

    // Check if request has expired
    const now = new Date();
    if (bookingRequest.requestExpiresAt && bookingRequest.requestExpiresAt < now) {
      return res.status(400).json({ 
        message: 'Upload window has expired (30 minutes after approval). Please create a new booking request.' 
      });
    }

    // Validate required documents
    if (!documents || documents.length === 0) {
      return res.status(400).json({
        message: 'Please upload required documents (Aadhaar, Driving License)'
      });
    }

    // Validate payment proof
    if (!paymentProof || !paymentProof.url) {
      return res.status(400).json({
        message: 'Please upload payment proof/screenshot'
      });
    }

    // Add documents to booking request
    bookingRequest.documents = documents.map(doc => ({
      type: doc.type,
      fileUrl: doc.url,
      uploadedAt: new Date()
    }));

    // Add payment proof
    bookingRequest.payments.push({
      amount: bookingRequest.billing.totalBill,
      paymentType: paymentType || 'UPI',
      paymentMethod: paymentMethod || 'Online',
      paymentReference: {
        transactionId: transactionId || `TXN-${Date.now()}`,
        proofUrl: paymentProof.url
      },
      paymentDate: new Date(),
      status: 'pending-verification' // Seller needs to verify
    });

    // Update status to awaiting_approval (waiting for seller to verify documents + payment)
    bookingRequest.bookingStatus = 'awaiting_approval';
    bookingRequest.paymentStatus = 'partially-paid'; // Marked as partially paid until verified

    await bookingRequest.save();

    res.json({
      success: true,
      message: 'Documents and payment proof uploaded successfully! Waiting for seller verification.',
      booking: bookingRequest,
      nextStep: 'Seller will verify your documents and payment. You will be notified once confirmed.'
    });

  } catch (error) {
    console.error('Error uploading documents:', error);
    res.status(500).json({ 
      message: 'Failed to upload documents', 
      error: error.message 
    });
  }
};

