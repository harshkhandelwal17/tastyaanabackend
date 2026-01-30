const VehicleRefund = require('../../models/VehicleRefund');
const VehicleBooking = require('../../models/VehicleBooking');
const Vehicle = require('../../models/Vehicle');
const User = require('../../models/User');
const Razorpay = require('razorpay');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// ===== REFUND MANAGEMENT =====

// Get all refunds with filtering and pagination
const getAllRefunds = async (req, res) => {
  try {
    const {
      status,
      userId,
      bookingId,
      startDate,
      endDate,
      page = 1,
      limit = 20,
      sortBy = 'requestedAt',
      sortOrder = 'desc'
    } = req.query;

    let filter = {};

    // Apply filters
    if (status) filter.status = status;
    if (userId) filter.userId = userId;
    if (bookingId) filter.bookingId = bookingId;

    if (startDate && endDate) {
      filter.requestedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // For sellers, only show refunds for their vehicles
    if (req.user.role === 'seller') {
      const sellerVehicles = await Vehicle.find({ sellerId: req.user.id }).select('_id');
      filter.vehicleId = { $in: sellerVehicles.map(v => v._id) };
    }

    // Pagination
    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    const [refunds, total] = await Promise.all([
      VehicleRefund.find(filter)
        .populate('bookingId', 'bookingId bookingDate customerDetails')
        .populate('userId', 'name phone email')
        .populate('vehicleId', 'name vehicleNumber')
        .populate('processedBy', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      VehicleRefund.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        refunds,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching refunds:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch refunds',
      error: error.message
    });
  }
};

// Process new refund
const processRefund = async (req, res) => {
  try {
    const { id: bookingId } = req.params;
    const { 
      amount, 
      reason, 
      refundMethod = 'bank_transfer',
      bankDetails,
      adminNotes,
      estimatedDays = 5
    } = req.body;

    // Validate inputs
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid refund amount'
      });
    }

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Refund reason is required'
      });
    }

    // Find booking
    const booking = await VehicleBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if refund amount is valid
    const totalPaid = booking.paidAmount || 0;
    const previousRefunds = await VehicleRefund.find({
      bookingId,
      status: { $ne: 'failed' }
    });
    
    const totalRefunded = previousRefunds.reduce((sum, refund) => sum + refund.approvedAmount, 0);
    const maxRefundable = totalPaid - totalRefunded;

    if (amount > maxRefundable) {
      return res.status(400).json({
        success: false,
        message: `Cannot refund ₹${amount}. Maximum refundable amount is ₹${maxRefundable}`
      });
    }

    // Create refund record
    const refund = new VehicleRefund({
      bookingId: booking._id,
      userId: booking.userId,
      vehicleId: booking.vehicleId,
      originalAmount: totalPaid,
      requestedAmount: amount,
      approvedAmount: amount,
      finalRefundAmount: amount,
      reason: reason.trim(),
      adminNotes: adminNotes?.trim(),
      refundMethod,
      bankDetails,
      estimatedDays,
      requestedBy: req.user.id,
      processedBy: req.user.id,
      metadata: {
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        refundInitiatedFrom: 'admin_panel'
      }
    });

    // Mark as processing and set estimated completion
    await refund.markAsProcessing();

    // Update booking payment status
    const newTotalRefunded = totalRefunded + amount;
    if (newTotalRefunded >= totalPaid) {
      booking.paymentStatus = 'refunded';
    } else {
      booking.paymentStatus = 'partially-refunded';
    }
    await booking.save();

    // TODO: Integrate with actual payment gateway for real refund processing
    // For now, we'll simulate successful processing
    
    // Simulate processing delay for demo
    setTimeout(async () => {
      try {
        await refund.markAsCompleted();
        // TODO: Send notification to customer
      } catch (err) {
        console.error('Error completing refund:', err);
      }
    }, 2000);

    res.json({
      success: true,
      message: 'Refund initiated successfully',
      data: {
        refund: {
          refundId: refund.refundId,
          amount: refund.finalRefundAmount,
          status: refund.status,
          estimatedCompletionDate: refund.estimatedCompletionDate,
          estimatedDays: refund.estimatedDays
        }
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

// Get refund details by ID
const getRefundById = async (req, res) => {
  try {
    const { id } = req.params;

    const refund = await VehicleRefund.findById(id)
      .populate('bookingId', 'bookingId bookingDate customerDetails billing')
      .populate('userId', 'name phone email')
      .populate('vehicleId', 'name vehicleNumber')
      .populate('processedBy', 'name email')
      .populate('approvedBy', 'name email');

    if (!refund) {
      return res.status(404).json({
        success: false,
        message: 'Refund not found'
      });
    }

    // Check permissions
    if (req.user.role === 'seller') {
      const vehicle = await Vehicle.findById(refund.vehicleId);
      if (vehicle.sellerId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    res.json({
      success: true,
      data: refund
    });

  } catch (error) {
    console.error('Error fetching refund:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch refund details',
      error: error.message
    });
  }
};

// Update refund status
const updateRefundStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, gatewayRefundId } = req.body;

    const refund = await VehicleRefund.findById(id);
    if (!refund) {
      return res.status(404).json({
        success: false,
        message: 'Refund not found'
      });
    }

    // Only admins can update refund status
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can update refund status'
      });
    }

    refund.status = status;
    if (adminNotes) refund.adminNotes = adminNotes;
    if (gatewayRefundId) {
      refund.paymentGatewayDetails.gatewayRefundId = gatewayRefundId;
    }

    if (status === 'completed') {
      refund.completedAt = new Date();
    }

    await refund.save();

    res.json({
      success: true,
      message: 'Refund status updated successfully',
      data: refund
    });

  } catch (error) {
    console.error('Error updating refund status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update refund status',
      error: error.message
    });
  }
};

// Get refund statistics
const getRefundStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let filter = {};
    if (startDate && endDate) {
      filter.requestedAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // For sellers, only their vehicles
    if (req.user.role === 'seller') {
      const sellerVehicles = await Vehicle.find({ sellerId: req.user.id }).select('_id');
      filter.vehicleId = { $in: sellerVehicles.map(v => v._id) };
    }

    const [stats, overdueRefunds, recentRefunds] = await Promise.all([
      VehicleRefund.getRefundStats(filter),
      VehicleRefund.getOverdueRefunds(),
      VehicleRefund.find(filter)
        .populate('bookingId', 'bookingId customerDetails')
        .sort({ requestedAt: -1 })
        .limit(5)
    ]);

    res.json({
      success: true,
      data: {
        summary: stats,
        overdueRefunds: overdueRefunds.length,
        recentRefunds
      }
    });

  } catch (error) {
    console.error('Error fetching refund stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch refund statistics',
      error: error.message
    });
  }
};

// Add extra charges to booking
const addExtraCharges = async (req, res) => {
  try {
    const { id: bookingId } = req.params;
    const { charges } = req.body;

    if (!charges || !Array.isArray(charges) || charges.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid charges data'
      });
    }

    const booking = await VehicleBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Add charges to booking billing
    charges.forEach(charge => {
      if (charge.type === 'damage') {
        booking.billing.damageCharges += charge.amount;
      } else if (charge.type === 'cleaning') {
        booking.billing.cleaningCharges += charge.amount;
      } else if (charge.type === 'late_fee') {
        booking.billing.lateFees += charge.amount;
      } else if (charge.type === 'fuel') {
        booking.billing.fuelCharges += charge.amount;
      } else {
        // Generic extra charge
        booking.billing.extraKmCharge += charge.amount;
      }
    });

    // Recalculate total bill
    const { billing } = booking;
    booking.billing.totalBill = 
      billing.baseAmount + 
      billing.extraKmCharge + 
      billing.extraHourCharge + 
      billing.fuelCharges + 
      billing.damageCharges + 
      billing.cleaningCharges + 
      billing.tollCharges + 
      billing.lateFees - 
      billing.discount.amount;

    await booking.save();

    res.json({
      success: true,
      message: 'Extra charges added successfully',
      data: {
        bookingId: booking._id,
        newTotal: booking.billing.totalBill,
        addedCharges: charges
      }
    });

  } catch (error) {
    console.error('Error adding extra charges:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add extra charges',
      error: error.message
    });
  }
};

// Record offline collection
const recordOfflineCollection = async (req, res) => {
  try {
    const { id: bookingId } = req.params;
    const { amount, paymentType = 'Cash', notes, collectedBy } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid collection amount'
      });
    }

    const booking = await VehicleBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Add payment record
    booking.payments.push({
      amount,
      paymentType,
      paymentMethod: 'Manual',
      paymentDate: new Date(),
      status: 'success',
      collectedBy: collectedBy || req.user.id,
      notes
    });

    // Update paid amount
    booking.paidAmount += amount;

    // Update payment status
    if (booking.paidAmount >= booking.billing.totalBill) {
      booking.paymentStatus = 'paid';
    } else {
      booking.paymentStatus = 'partially-paid';
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Offline collection recorded successfully',
      data: {
        bookingId: booking._id,
        collectedAmount: amount,
        totalPaid: booking.paidAmount,
        remaining: Math.max(0, booking.billing.totalBill - booking.paidAmount)
      }
    });

  } catch (error) {
    console.error('Error recording offline collection:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to record offline collection',
      error: error.message
    });
  }
};

module.exports = {
  getAllRefunds,
  processRefund,
  getRefundById,
  updateRefundStatus,
  getRefundStats,
  addExtraCharges,
  recordOfflineCollection
};