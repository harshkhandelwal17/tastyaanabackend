const Vehicle = require('../../models/Vehicle');
const VehicleBooking = require('../../models/VehicleBooking');
const User = require('../../models/User');
// const mongoose = require('mongoose');

// Get worker dashboard data (scoped to worker's zone)
const getWorkerDashboard = async (req, res) => {
  try {
    const workerId = req.user.id;
    
    // Get worker profile to find their zone
    const worker = await User.findById(workerId).select('workerProfile');
    if (!worker || !worker.workerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Worker profile not found'
      });
    }

    const { sellerId, zoneCode, zoneName } = worker.workerProfile;

    // Find vehicles in worker's zone
    const vehicles = await Vehicle.find({
      sellerId: sellerId,
      zoneCode: zoneCode,
      status: 'active'
    });

    const vehicleIds = vehicles.map(v => v._id);
    const now = new Date();

    // Get ongoing bookings
    const ongoingBookings = await VehicleBooking.find({
      vehicleId: { $in: vehicleIds },
      bookingStatus: 'ongoing',
      startDateTime: { $lte: now },
      endDateTime: { $gte: now }
    }).populate('vehicleId userId');

    // Get upcoming bookings
    const upcomingBookings = await VehicleBooking.find({
      vehicleId: { $in: vehicleIds },
      bookingStatus: { $in: ['confirmed', 'pending'] },
      startDateTime: { $gt: now }
    }).sort({ startDateTime: 1 }).limit(5).populate('vehicleId userId');

    // Get overdue bookings
    const overdueBookings = await VehicleBooking.find({
      vehicleId: { $in: vehicleIds },
      bookingStatus: { $in: ['confirmed', 'ongoing'] },
      endDateTime: { $lt: now }
    }).populate('vehicleId userId');

    // Calculate stats
    const totalVehicles = vehicles.length;
    const availableVehicles = totalVehicles - ongoingBookings.length;
    const reservedVehicles = ongoingBookings.length;

    // Get today's revenue
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const todayCompletedBookings = await VehicleBooking.find({
      vehicleId: { $in: vehicleIds },
      bookingStatus: 'completed',
      'vehicleReturn.returnTime': { $gte: startOfDay, $lte: endOfDay }
    });

    const todayRevenue = todayCompletedBookings.reduce((sum, booking) => {
      return sum + (booking.billing?.finalAmount || 0);
    }, 0);

    res.json({
      success: true,
      data: {
        overview: {
          totalVehicles,
          availableVehicles,
          reservedVehicles,
          overdueVehicles: overdueBookings.length,
          todayRevenue,
          zone: {
            code: zoneCode,
            name: zoneName
          }
        },
        recentBookings: upcomingBookings,
        overdueBookings,
        vehicleStats: {
          total: totalVehicles,
          available: availableVehicles,
          reserved: reservedVehicles
        }
      }
    });

  } catch (error) {
    console.error('Error fetching worker dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};

// Get worker vehicles (scoped to worker's zone)
const getWorkerVehicles = async (req, res) => {
  try {
    const workerId = req.user.id;
    const {
      page = 1,
      limit = 12,
      search,
      status,
      category,
      availability,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Get worker profile
    const worker = await User.findById(workerId).select('workerProfile');
    if (!worker || !worker.workerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Worker profile not found'
      });
    }

    const { sellerId, zoneCode } = worker.workerProfile;

    const filter = { 
      sellerId: sellerId,
      zoneCode: zoneCode  // Automatically filter by worker's zone
    };

    // Add search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { vehicleNo: { $regex: search, $options: 'i' } },
        { color: { $regex: search, $options: 'i' } }
      ];
    }

    // Add status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Add category filter
    if (category && category !== 'all') {
      filter.category = category;
    }

    const bookingStatusFilter = availability && availability !== 'all' ? availability : null;

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (page - 1) * limit;

    const vehicles = await Vehicle.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('sellerId', 'name phone email businessName');

    const totalVehicles = await Vehicle.countDocuments(filter);

    // Enhance vehicles with current booking status
    const now = new Date();
    const enhancedVehicles = await Promise.all(
      vehicles.map(async (vehicle) => {
        const activeBooking = await VehicleBooking.findOne({
          vehicleId: vehicle._id,
          bookingStatus: 'ongoing',
          startDateTime: { $lte: now },
          endDateTime: { $gte: now }
        }).select('bookingId startDateTime endDateTime userId');

        const overdueBooking = await VehicleBooking.findOne({
          vehicleId: vehicle._id,
          bookingStatus: { $in: ['confirmed', 'ongoing'] },
          endDateTime: { $lt: now }
        }).select('bookingId startDateTime endDateTime userId');

        const futureBooking = await VehicleBooking.findOne({
          vehicleId: vehicle._id,
          bookingStatus: { $in: ['confirmed', 'pending'] },
          startDateTime: { $gt: now }
        }).sort({ startDateTime: 1 }).select('bookingId startDateTime endDateTime');

        let bookingStatus = 'available';
        let bookingInfo = null;
        let isOverdue = false;

        if (overdueBooking) {
          const overdueHours = Math.floor((now - new Date(overdueBooking.endDateTime)) / (1000 * 60 * 60));
          bookingStatus = 'overdue';
          isOverdue = true;
          bookingInfo = {
            bookingId: overdueBooking.bookingId,
            startDateTime: overdueBooking.startDateTime,
            endDateTime: overdueBooking.endDateTime,
            status: `Overdue by ${overdueHours}h`,
            overdueBy: overdueHours
          };
        } else if (activeBooking) {
          bookingStatus = 'reserved';
          bookingInfo = {
            bookingId: activeBooking.bookingId,
            startDateTime: activeBooking.startDateTime,
            endDateTime: activeBooking.endDateTime,
            status: 'Currently in use'
          };
        } else if (futureBooking) {
          bookingStatus = 'pre-booked';
          bookingInfo = {
            bookingId: futureBooking.bookingId,
            startDateTime: futureBooking.startDateTime,
            endDateTime: futureBooking.endDateTime,
            status: 'Booked for future'
          };
        }

        return {
          ...vehicle.toObject(),
          currentBookingStatus: bookingStatus,
          bookingInfo,
          isOverdue
        };
      })
    );

    // Apply booking status filter if specified
    let filteredVehicles = enhancedVehicles;
    if (bookingStatusFilter) {
      filteredVehicles = enhancedVehicles.filter(v => v.currentBookingStatus === bookingStatusFilter);
    }

    // Calculate category breakdown from ALL vehicles matching filter
    const allVehiclesForCounts = await Vehicle.find(filter).select('category');
    const categoryBreakdown = allVehiclesForCounts.reduce((acc, vehicle) => {
      const category = (vehicle.category || 'other').toLowerCase();
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    // Calculate counts for all statuses
    const counts = {
      total: totalVehicles,
      available: enhancedVehicles.filter(v => v.currentBookingStatus === 'available').length,
      reserved: enhancedVehicles.filter(v => v.currentBookingStatus === 'reserved').length,
      preBooked: enhancedVehicles.filter(v => v.currentBookingStatus === 'pre-booked').length,
      categoryBreakdown
    };

    res.json({
      success: true,
      data: {
        vehicles: filteredVehicles,
        counts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalVehicles / limit),
          totalItems: totalVehicles,
          hasNextPage: page < Math.ceil(totalVehicles / limit),
          hasPrevPage: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching worker vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicles',
      error: error.message
    });
  }
};

// Get worker bookings (scoped to worker's zone)
// const getWorkerBookings = async (req, res) => {
//   try {
//     const workerId = req.user.id;
//     const {
//       page = 1,
//       limit = 20,
//       status,
//       search,
//       startDate,
//       endDate
//     } = req.query;

//     // Get worker profile
//     const worker = await User.findById(workerId).select('workerProfile');
//     if (!worker || !worker.workerProfile) {
//       return res.status(404).json({
//         success: false,
//         message: 'Worker profile not found'
//       });
//     }

//     const { sellerId, zoneCode } = worker.workerProfile;

//     // First, find vehicles in worker's zone
//     const zoneVehicles = await Vehicle.find({
//       sellerId: sellerId,
//       zoneCode: zoneCode
//     }).select('_id');

//     const vehicleIds = zoneVehicles.map(v => v._id);

//     const filter = {
//       vehicleId: { $in: vehicleIds }
//     };

//     // Add status filter
//     if (status && status !== 'all') {
//       filter.bookingStatus = status;
//     }

//     // Add date range filter
//     if (startDate || endDate) {
//       filter.startDateTime = {};
//       if (startDate) filter.startDateTime.$gte = new Date(startDate);
//       if (endDate) filter.startDateTime.$lte = new Date(endDate);
//     }

//     // Pagination
//     const skip = (page - 1) * limit;

//     let bookings = await VehicleBooking.find(filter)
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(parseInt(limit))
//       .populate('vehicleId', 'name companyName vehicleNo category')
//       .populate('userId', 'name phone email');

//     // Apply search filter if provided (after population)
//     if (search) {
//       const searchLower = search.toLowerCase();
//       bookings = bookings.filter(booking => {
//         const vehicleName = booking.vehicleId?.name?.toLowerCase() || '';
//         const vehicleNo = booking.vehicleId?.vehicleNo?.toLowerCase() || '';
//         const customerName = booking.userId?.name?.toLowerCase() || booking.customerName?.toLowerCase() || '';
//         const customerPhone = booking.userId?.phone?.toLowerCase() || booking.customerPhone?.toLowerCase() || '';
//         const bookingId = booking.bookingId?.toLowerCase() || '';
        
//         return vehicleName.includes(searchLower) ||
//                vehicleNo.includes(searchLower) ||
//                customerName.includes(searchLower) ||
//                customerPhone.includes(searchLower) ||
//                bookingId.includes(searchLower);
//       });
//     }

//     const totalBookings = await VehicleBooking.countDocuments(filter);

//     res.json({
//       success: true,
//       data: {
//         bookings,
//         pagination: {
//           currentPage: parseInt(page),
//           totalPages: Math.ceil(totalBookings / limit),
//           totalItems: totalBookings,
//           hasNextPage: page < Math.ceil(totalBookings / limit),
//           hasPrevPage: page > 1
//         }
//       }
//     });

//   } catch (error) {
//     console.error('Error fetching worker bookings:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch bookings',
//       error: error.message
//     });
//   }
// };

// Get booking details (with zone validation)
const getWorkerBookingDetails = async (req, res) => {
  try {
    const workerId = req.user.id;
    const { bookingId } = req.params;

    // Get worker profile
    const worker = await User.findById(workerId).select('workerProfile');
    if (!worker || !worker.workerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Worker profile not found'
      });
    }

    const { sellerId, zoneCode } = worker.workerProfile;

    const booking = await VehicleBooking.findOne({ bookingId })
      .populate('vehicleId')
      .populate('userId', 'name phone email')
      .populate('sellerId', 'name phone email businessName');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify booking is in worker's zone
    if (booking.vehicleId.zoneCode !== zoneCode) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Booking not in your assigned zone'
      });
    }

    res.json({
      success: true,
      data: booking
    });

  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch booking details',
      error: error.message
    });
  }
};

// Get worker profile
const getWorkerProfile = async (req, res) => {
  try {
    const workerId = req.user.id;
    
    const worker = await User.findById(workerId)
      .select('name email phone workerProfile')
      .populate('workerProfile.sellerId', 'name businessName');

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: 'Worker not found'
      });
    }

    res.json({
      success: true,
      data: worker
    });

  } catch (error) {
    console.error('Error fetching worker profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

// Complete booking - Worker dropoff
const completeWorkerBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const {
      endMeterReading,
      endFuelLevel,
      vehicleCondition,
      endDateTime,
      extraCharges,
      payment,
      billing,
      notes,
      refundMode,
    } = req.body;

    // Get worker profile with zone info
    const worker = await User.findById(req.user.id).populate('workerProfile');
    
    if (!worker?.workerProfile) {
      return res.status(403).json({
        success: false,
        message: 'Worker profile not found'
      });
    }

    const workerZoneCode = worker.workerProfile.zoneCode;

    // Find booking
    const booking = await VehicleBooking.findById(bookingId)
      .populate('vehicleId')
      .populate('userId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Verify booking is in worker's zone
    if (booking.vehicleId.zoneCode !== workerZoneCode) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Booking is not in your zone',
      });
    }

    // Update booking with dropoff details
    booking.endMeterReading = endMeterReading;
    booking.endFuelLevel = endFuelLevel;
    booking.vehicleCondition = vehicleCondition;
    booking.endDateTime = endDateTime ? new Date(endDateTime) : new Date();

    // Update vehicleReturn schema
    booking.vehicleReturn = booking.vehicleReturn || {};
    booking.vehicleReturn.submitted = true;
    booking.vehicleReturn.submittedAt = booking.endDateTime;
    booking.vehicleReturn.submittedBy = req.user.id;
    booking.vehicleReturn.endMeterReading = endMeterReading;
    booking.vehicleReturn.returnFuelLevel = endFuelLevel;
    booking.vehicleReturn.condition = vehicleCondition;
    booking.vehicleReturn.vehicleAvailableAgain = true;
    booking.vehicleReturn.madeAvailableAt = booking.endDateTime;

    // Update billing
    booking.billing.extraKmCharge = billing.extraKmCharge;
    booking.billing.extraHourCharge = billing.extraHourCharge;
    booking.billing.freeKm = billing.freeKm;
    booking.billing.totalKm = billing.totalKm;

    // Extra charges
    if (extraCharges && extraCharges.amount) {
      booking.billing.damageCharges = extraCharges.amount;
      if (extraCharges.notes) {
        booking.notes = (booking.notes || '') + '\nExtra Charges: ' + extraCharges.notes;
      }
    }

    booking.billing.totalBill = billing.totalBill;

    // Add payments
    if (payment.cashReceived > 0 || payment.onlineReceived > 0) {
      booking.payments = booking.payments || [];

      if (payment.cashReceived > 0) {
        booking.payments.push({
          amount: payment.cashReceived,
          paymentType: 'Cash',
          paymentMethod: 'Cash',
          status: 'success',
          transactionDate: new Date(),
        });
      }

      if (payment.onlineReceived > 0) {
        booking.payments.push({
          amount: payment.onlineReceived,
          paymentType: 'UPI',
          paymentMethod: 'Razorpay',
          status: 'success',
          transactionDate: new Date(),
        });
      }
    }

    // Calculate total paid
    const totalPaidFromPayments = booking.payments.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

    booking.paidAmount = totalPaidFromPayments;

    if (totalPaidFromPayments >= billing.totalBill) {
      booking.paymentStatus = 'paid';
    } else if (totalPaidFromPayments > 0) {
      booking.paymentStatus = 'partially-paid';
    } else {
      booking.paymentStatus = 'unpaid';
    }

    // Update status to completed
    booking.bookingStatus = 'completed';
    booking.statusHistory.push({
      status: 'completed',
      timestamp: new Date(),
      updatedBy: req.user.id,
    });

    // Mark drop verification
    if (!booking.verificationCodes) {
      booking.verificationCodes = {};
    }
    if (!booking.verificationCodes.drop) {
      booking.verificationCodes.drop = {};
    }
    booking.verificationCodes.drop.verified = true;
    booking.verificationCodes.drop.verifiedAt = new Date();

    // Calculate refund
    const totalPaid = booking.paidAmount || 0;
    const actualBill = billing.totalBill || 0;
    
    if (totalPaid > actualBill) {
      const refundAmount = totalPaid - actualBill;
      let refundMethod = 'cash';
      
      if (refundMode) {
        refundMethod = refundMode === 'online' ? 'bank-transfer' : 'cash';
      } else {
        const cashPayment = booking.payments?.find(p => p.paymentMethod === 'Cash' || p.paymentType === 'Cash');
        refundMethod = cashPayment ? 'cash' : 'bank-transfer';
      }
      
      booking.refundDetails = {
        reason: 'overbilling',
        requestedAmount: refundAmount,
        approvedAmount: refundAmount,
        refundMethod: refundMethod,
        refundMode: refundMode || (refundMethod === 'cash' ? 'cash' : 'online'),
        processedBy: req.user.id,
        processedDate: new Date(),
        refundReference: `REF-${booking.bookingId}-${Date.now().toString().slice(-6)}`,
        notes: `Overpayment refund processed by worker. Customer paid ₹${totalPaid}, actual bill ₹${actualBill}. Refunded ₹${refundAmount} via ${refundMode || refundMethod}.`
      };
      
      booking.refundStatus = 'completed';
      booking.depositRefundStatus = 'not-applicable';
    } else if (totalPaid < actualBill) {
      booking.refundStatus = 'not-applicable';
      booking.depositRefundStatus = 'not-applicable';
    } else {
      booking.refundStatus = 'not-applicable';
      booking.depositRefundStatus = 'not-applicable';
    }

    // Add notes
    if (notes && notes.returnNotes) {
      booking.notes = (booking.notes || '') + '\nReturn: ' + notes.returnNotes;
    }

    await booking.save();

    // Update vehicle availability
    await Vehicle.findByIdAndUpdate(booking.vehicleId._id, {
      availability: 'available',
      currentBookingId: null,
    });

    res.json({
      success: true,
      message: 'Vehicle returned successfully by worker',
      data: booking,
    });
  } catch (error) {
    console.error('Error completing worker booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete booking',
      error: error.message
    });
  }
};



// const Vehicle = require("../../models/Vehicle");
// const VehicleBooking = require("../../models/VehicleBooking");
// const User = require("../../models/User");

/**
 * Worker Vehicle Controller
 * All endpoints are zone-restricted - workers can only access their assigned zone
 */

// Get worker vehicles (zone-restricted)
exports.getWorkerVehicles = async (req, res) => {
  try {
    const workerId = req.user._id;
    const { availability, category, sortBy, search, zoneId } = req.query;

    console.log(`🔍 Worker ${workerId} requesting vehicles`);

    // Get worker profile
    const worker = await User.findById(workerId).select("workerProfile role");
    
    if (!worker || worker.role !== "worker") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Worker role required.",
      });
    }

    if (!worker.workerProfile || !worker.workerProfile.zoneId) {
      return res.status(403).json({
        success: false,
        message: "Worker profile not found or incomplete. Please contact your administrator.",
      });
    }

    // Validate zone access
    if (zoneId && zoneId !== worker.workerProfile.zoneId) {
      console.log(
        `❌ Worker ${workerId} attempted to access zone ${zoneId} but is assigned to ${worker.workerProfile.zoneId}`
      );
      return res.status(403).json({
        success: false,
        message: "You can only access vehicles from your assigned zone.",
      });
    }

    // Build query for zone-restricted vehicles
    const query = {
      zoneCode: worker.workerProfile.zoneCode,
    };

    if (availability && availability !== "all") {
      query.availability = availability;
    }

    if (category && category !== "all") {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { brand: { $regex: search, $options: "i" } },
        { model: { $regex: search, $options: "i" } },
        { vehicleNo: { $regex: search, $options: "i" } },
      ];
    }

    // Sort options
    let sort = {};
    switch (sortBy) {
      case "newest":
        sort = { createdAt: -1 };
        break;
      case "oldest":
        sort = { createdAt: 1 };
        break;
      case "price-low":
        sort = { "rentalRates.perDay": 1 };
        break;
      case "price-high":
        sort = { "rentalRates.perDay": -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const vehicles = await Vehicle.find(query).sort(sort);

    console.log(
      `✅ Found ${vehicles.length} vehicles in zone ${worker.workerProfile.zoneCode}`
    );

    res.json({
      success: true,
      data: {
        vehicles,
        count: vehicles.length,
        zone: {
          id: worker.workerProfile.zoneId,
          code: worker.workerProfile.zoneCode,
          name: worker.workerProfile.zoneName,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error in getWorkerVehicles:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch vehicles",
      error: error.message,
    });
  }
};

// Get worker bookings (zone-restricted)
const getWorkerBookings = async (req, res) => {
  try {
    const workerId = req.user._id;
    const { status, dateRange, sortBy, search, zoneId } = req.query;

    console.log(`🔍 Worker ${workerId} requesting bookings`);

    // Get worker profile
    const worker = await User.findById(workerId).select("workerProfile role");
    
    if (!worker || worker.role !== "worker") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Worker role required.",
      });
    }

    if (!worker.workerProfile || !worker.workerProfile.zoneId) {
      return res.status(403).json({
        success: false,
        message: "Worker profile not found or incomplete. Please contact your administrator.",
      });
    }

    // Validate zone access
    if (zoneId && zoneId !== worker.workerProfile.zoneId) {
      console.log(
        `❌ Worker ${workerId} attempted to access zone ${zoneId} but is assigned to ${worker.workerProfile.zoneId}`
      );
      return res.status(403).json({
        success: false,
        message: "You can only access bookings from your assigned zone.",
      });
    }

    // Get all vehicles in worker's zone
    const zoneVehicles = await Vehicle.find({
      zoneCode: worker.workerProfile.zoneCode,
    }).select("_id");

    const zoneVehicleIds = zoneVehicles.map((v) => v._id);

    console.log(
      `📍 Found ${zoneVehicleIds.length} vehicles in zone ${worker.workerProfile.zoneCode}`
    );

    // Build query for zone-restricted bookings
    const query = {
      vehicleId: { $in: zoneVehicleIds },
    };

    if (status && status !== "all") {
      query.bookingStatus = status;
    }

    if (dateRange && dateRange !== "all") {
      const now = new Date();
      const startDate = new Date();

      switch (dateRange) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      query.createdAt = { $gte: startDate };
    }

    if (search) {
      query.$or = [
        { bookingCode: { $regex: search, $options: "i" } },
      ];
    }

    // Sort options
    let sort = {};
    switch (sortBy) {
      case "newest":
        sort = { createdAt: -1 };
        break;
      case "oldest":
        sort = { createdAt: 1 };
        break;
      case "pickup-date":
        sort = { pickupDate: -1 };
        break;
      case "amount-high":
        sort = { totalAmount: -1 };
        break;
      case "amount-low":
        sort = { totalAmount: 1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const bookings = await VehicleBooking.find(query)
      .sort(sort)
      .populate("vehicleId", "brand model vehicleNo images category type")
      .populate("userId", "name email phone");

    console.log(`✅ Found ${bookings.length} bookings in worker's zone`);

    res.json({
      success: true,
      data: {
        bookings,
        count: bookings.length,
        zone: {
          id: worker.workerProfile.zoneId,
          code: worker.workerProfile.zoneCode,
          name: worker.workerProfile.zoneName,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error in getWorkerBookings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
      error: error.message,
    });
  }
};

// Get single booking details (zone-restricted)
const getWorkerBookingById = async (req, res) => {
  try {
    const workerId = req.user._id;
    const { bookingId } = req.params;

    // Get worker profile
    const worker = await User.findById(workerId).select("workerProfile role");
    
    if (!worker || worker.role !== "worker") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Worker role required.",
      });
    }

    if (!worker.workerProfile || !worker.workerProfile.zoneId) {
      return res.status(403).json({
        success: false,
        message: "Worker profile incomplete.",
      });
    }

    // Get booking
    const booking = await VehicleBooking.findById(bookingId)
      .populate("vehicleId")
      .populate("userId", "name email phone");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Verify vehicle belongs to worker's zone
    if (booking.vehicleId.zoneCode !== worker.workerProfile.zoneCode) {
      return res.status(403).json({
        success: false,
        message: "This booking belongs to a different zone.",
      });
    }

    res.json({
      success: true,
      data: { booking },
    });
  } catch (error) {
    console.error("Error in getWorkerBookingById:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch booking details",
      error: error.message,
    });
  }
};

// Get bookings ready for handover (pickup/return) - zone-restricted
const getWorkerHandoverBookings = async (req, res) => {
  try {
    const workerId = req.user._id;
    const { type } = req.query; // 'pickup' or 'return'

    console.log(`🔍 Worker ${workerId} requesting handover bookings (${type || 'all'})`);

    // Get worker profile
    const worker = await User.findById(workerId).select("workerProfile role");
    
    if (!worker || worker.role !== "worker") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Worker role required.",
      });
    }

    if (!worker.workerProfile || !worker.workerProfile.zoneId) {
      return res.status(403).json({
        success: false,
        message: "Worker profile incomplete.",
      });
    }

    // Get all vehicles in worker's zone
    const zoneVehicles = await Vehicle.find({
      zoneCode: worker.workerProfile.zoneCode,
    }).select("_id");

    const zoneVehicleIds = zoneVehicles.map((v) => v._id);

    // Build query for handover-ready bookings
    const query = {
      vehicleId: { $in: zoneVehicleIds },
    };

    const now = new Date();

    if (type === "pickup") {
      // Bookings confirmed and ready for pickup (pickup date is today or past)
      query.bookingStatus = "confirmed";
      query.pickupDate = { $lte: now };
    } else if (type === "return") {
      // Bookings active and ready for return (return date is today or past)
      query.bookingStatus = "active";
      query.returnDate = { $lte: now };
    } else {
      // All handover bookings (both pickup and return)
      query.$or = [
        { bookingStatus: "confirmed", pickupDate: { $lte: now } },
        { bookingStatus: "active", returnDate: { $lte: now } },
      ];
    }

    const bookings = await VehicleBooking.find(query)
      .sort({ pickupDate: 1 })
      .populate("vehicleId", "brand model vehicleNo images category type zoneCode")
      .populate("userId", "name email phone");

    console.log(`✅ Found ${bookings.length} handover-ready bookings`);

    res.json({
      success: true,
      data: {
        bookings,
        count: bookings.length,
        type: type || "all",
        zone: {
          id: worker.workerProfile.zoneId,
          code: worker.workerProfile.zoneCode,
          name: worker.workerProfile.zoneName,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error in getWorkerHandoverBookings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch handover bookings",
      error: error.message,
    });
  }
};

// Process vehicle handover (pickup/return) - zone-restricted
const processWorkerHandover = async (req, res) => {
  try {
    const workerId = req.user._id;
    const { bookingId } = req.params;
    const {
      handoverType, // 'pickup' or 'return'
      odometerReading,
      fuelLevel,
      vehicleCondition, // { exterior, interior, mechanical, damages }
      photos, // Array of photo URLs
      customerSignature,
      workerNotes,
    } = req.body;

    console.log(`🚗 Worker ${workerId} processing ${handoverType} for booking ${bookingId}`);

    // Get worker profile
    const worker = await User.findById(workerId).select("workerProfile name role");
    
    if (!worker || worker.role !== "worker") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Worker role required.",
      });
    }

    if (!worker.workerProfile || !worker.workerProfile.zoneId) {
      return res.status(403).json({
        success: false,
        message: "Worker profile incomplete.",
      });
    }

    // Get booking
    const booking = await VehicleBooking.findById(bookingId)
      .populate("vehicleId")
      .populate("userId", "name email phone");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Verify vehicle belongs to worker's zone
    if (booking.vehicleId.zoneCode !== worker.workerProfile.zoneCode) {
      return res.status(403).json({
        success: false,
        message: "This booking belongs to a different zone.",
      });
    }

    // Validate handover type and booking status
    if (handoverType === "pickup" && booking.bookingStatus !== "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Booking must be in 'confirmed' status for pickup.",
      });
    }

    if (handoverType === "return" && booking.bookingStatus !== "active") {
      return res.status(400).json({
        success: false,
        message: "Booking must be in 'active' status for return.",
      });
    }

    // Create handover record
    const handoverData = {
      type: handoverType,
      timestamp: new Date(),
      workerId: workerId,
      workerName: worker.name,
      odometerReading: odometerReading || 0,
      fuelLevel: fuelLevel || "full",
      vehicleCondition: vehicleCondition || {},
      photos: photos || [],
      customerSignature: customerSignature || "",
      workerNotes: workerNotes || "",
    };

    // Update booking based on handover type
    if (handoverType === "pickup") {
      booking.bookingStatus = "active";
      booking.pickupHandover = handoverData;
      booking.actualPickupDate = new Date();

      // Update vehicle availability
      await Vehicle.findByIdAndUpdate(booking.vehicleId._id, {
        availability: "rented",
        currentBookingId: booking._id,
      });

      console.log(`✅ Pickup completed for booking ${bookingId}`);
    } else if (handoverType === "return") {
      booking.bookingStatus = "completed";
      booking.returnHandover = handoverData;
      booking.actualReturnDate = new Date();

      // Update vehicle availability
      await Vehicle.findByIdAndUpdate(booking.vehicleId._id, {
        availability: "available",
        currentBookingId: null,
      });

      console.log(`✅ Return completed for booking ${bookingId}`);
    }

    await booking.save();

    res.json({
      success: true,
      message: `${handoverType === "pickup" ? "Pickup" : "Return"} handover completed successfully`,
      data: { booking },
    });
  } catch (error) {
    console.error("❌ Error in processWorkerHandover:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process handover",
      error: error.message,
    });
  }
};

// Create offline booking - zone-restricted
const createWorkerOfflineBooking = async (req, res) => {
  try {
    const workerId = req.user._id;
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerIdProof,
      vehicleId,
      pickupDate,
      returnDate,
      pickupTime,
      returnTime,
      requiresHelmet,
      requiresInsurance,
      paymentMethod,
      advancePayment,
      workerNotes,
    } = req.body;

    console.log(`📝 Worker ${workerId} creating offline booking`);

    // Get worker profile
    const worker = await User.findById(workerId).select("workerProfile name role");
    
    if (!worker || worker.role !== "worker") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Worker role required.",
      });
    }

    if (!worker.workerProfile || !worker.workerProfile.zoneId) {
      return res.status(403).json({
        success: false,
        message: "Worker profile incomplete.",
      });
    }

    // Validate required fields
    if (!customerName || !customerPhone || !vehicleId || !pickupDate || !returnDate) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: customerName, customerPhone, vehicleId, pickupDate, returnDate",
      });
    }

    // Get vehicle and verify zone access
    const vehicle = await Vehicle.findById(vehicleId);

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: "Vehicle not found",
      });
    }

    if (vehicle.zoneCode !== worker.workerProfile.zoneCode) {
      return res.status(403).json({
        success: false,
        message: "You can only create bookings for vehicles in your zone.",
      });
    }

    // Check vehicle availability
    if (vehicle.availability !== "available") {
      return res.status(400).json({
        success: false,
        message: `Vehicle is not available (current status: ${vehicle.availability})`,
      });
    }

    // Parse dates
    const pickup = new Date(pickupDate);
    const returnDt = new Date(returnDate);

    if (pickup >= returnDt) {
      return res.status(400).json({
        success: false,
        message: "Return date must be after pickup date",
      });
    }

    // Calculate rental duration and amount
    const durationMs = returnDt - pickup;
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
    
    let totalAmount = 0;
    if (durationDays === 1) {
      totalAmount = vehicle.rentalRates.perDay;
    } else if (durationDays <= 7) {
      totalAmount = durationDays * vehicle.rentalRates.perDay;
    } else if (durationDays <= 30) {
      const weeks = Math.floor(durationDays / 7);
      const remainingDays = durationDays % 7;
      totalAmount = (weeks * vehicle.rentalRates.perWeek) + (remainingDays * vehicle.rentalRates.perDay);
    } else {
      const months = Math.floor(durationDays / 30);
      const remainingDays = durationDays % 30;
      totalAmount = (months * vehicle.rentalRates.perMonth) + (remainingDays * vehicle.rentalRates.perDay);
    }

    // Add extras
    if (requiresHelmet) {
      totalAmount += 50; // Helmet charge
    }
    if (requiresInsurance) {
      totalAmount += durationDays * 20; // Daily insurance
    }

    // Generate booking code
    const bookingCode = `OFF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Create guest user record or find existing
    let guestUser = await User.findOne({ phone: customerPhone, role: "guest" });
    
    if (!guestUser) {
      guestUser = new User({
        name: customerName,
        phone: customerPhone,
        email: customerEmail || `guest${Date.now()}@offline.com`,
        role: "guest",
        isGuestUser: true,
        idProof: customerIdProof,
      });
      await guestUser.save();
    }

    // Create booking
    const booking = new VehicleBooking({
      userId: guestUser._id,
      vehicleId: vehicle._id,
      bookingCode,
      pickupDate: pickup,
      returnDate: returnDt,
      pickupTime: pickupTime || "10:00",
      returnTime: returnTime || "10:00",
      bookingStatus: "confirmed",
      paymentStatus: advancePayment >= totalAmount ? "paid" : "partially_paid",
      totalAmount,
      advanceAmount: advancePayment || 0,
      pendingAmount: totalAmount - (advancePayment || 0),
      paymentMethod: paymentMethod || "cash",
      requiresHelmet: requiresHelmet || false,
      requiresInsurance: requiresInsurance || false,
      isOfflineBooking: true,
      createdByWorker: workerId,
      createdByWorkerName: worker.name,
      workerNotes: workerNotes || "",
      zoneCode: vehicle.zoneCode,
      zoneName: vehicle.zoneName,
    });

    await booking.save();

    console.log(`✅ Offline booking created: ${bookingCode}`);

    res.status(201).json({
      success: true,
      message: "Offline booking created successfully",
      data: {
        booking,
        vehicle: {
          brand: vehicle.brand,
          model: vehicle.model,
          vehicleNo: vehicle.vehicleNo,
        },
        customer: {
          name: guestUser.name,
          phone: guestUser.phone,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error in createWorkerOfflineBooking:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create offline booking",
      error: error.message,
    });
  }
};

// Update booking status - zone-restricted
const updateWorkerBookingStatus = async (req, res) => {
  try {
    const workerId = req.user._id;
    const { bookingId } = req.params;
    const { status, reason } = req.body;

    console.log(`📝 Worker ${workerId} updating booking ${bookingId} to ${status}`);

    // Get worker profile
    const worker = await User.findById(workerId).select("workerProfile name role");
    
    if (!worker || worker.role !== "worker") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Worker role required.",
      });
    }

    if (!worker.workerProfile || !worker.workerProfile.zoneId) {
      return res.status(403).json({
        success: false,
        message: "Worker profile incomplete.",
      });
    }

    // Validate status
    const validStatuses = ["confirmed", "active", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Get booking
    const booking = await VehicleBooking.findById(bookingId).populate("vehicleId");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Verify vehicle belongs to worker's zone
    if (booking.vehicleId.zoneCode !== worker.workerProfile.zoneCode) {
      return res.status(403).json({
        success: false,
        message: "This booking belongs to a different zone.",
      });
    }

    // Update status
    const oldStatus = booking.bookingStatus;
    booking.bookingStatus = status;

    // Add status change log
    if (!booking.statusHistory) {
      booking.statusHistory = [];
    }

    booking.statusHistory.push({
      status,
      changedBy: workerId,
      changedByName: worker.name,
      changedAt: new Date(),
      reason: reason || "",
    });

    // Update vehicle availability if needed
    if (status === "cancelled" && oldStatus === "active") {
      await Vehicle.findByIdAndUpdate(booking.vehicleId._id, {
        availability: "available",
        currentBookingId: null,
      });
    }

    await booking.save();

    console.log(`✅ Booking ${bookingId} status updated: ${oldStatus} → ${status}`);

    res.json({
      success: true,
      message: "Booking status updated successfully",
      data: { booking },
    });
  } catch (error) {
    console.error("❌ Error in updateWorkerBookingStatus:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update booking status",
      error: error.message,
    });
  }
};

// Get worker reports/analytics - zone-restricted
const getWorkerReports = async (req, res) => {
  try {
    const workerId = req.user._id;
    const { period, startDate, endDate } = req.query;

    console.log(`📊 Worker ${workerId} requesting reports (${period || 'custom'})`);

    // Get worker profile
    const worker = await User.findById(workerId).select("workerProfile role");
    
    if (!worker || worker.role !== "worker") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Worker role required.",
      });
    }

    if (!worker.workerProfile || !worker.workerProfile.zoneId) {
      return res.status(403).json({
        success: false,
        message: "Worker profile incomplete.",
      });
    }

    // Calculate date range
    let start, end;
    const now = new Date();

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      switch (period) {
        case "today":
          start = new Date(now.setHours(0, 0, 0, 0));
          end = new Date(now.setHours(23, 59, 59, 999));
          break;
        case "week":
          start = new Date(now.setDate(now.getDate() - 7));
          end = new Date();
          break;
        case "month":
          start = new Date(now.setMonth(now.getMonth() - 1));
          end = new Date();
          break;
        default:
          start = new Date(now.setDate(now.getDate() - 30));
          end = new Date();
      }
    }

    // Get all vehicles in worker's zone
    const zoneVehicles = await Vehicle.find({
      zoneCode: worker.workerProfile.zoneCode,
    }).select("_id brand model category");

    const zoneVehicleIds = zoneVehicles.map((v) => v._id);

    // Get bookings in date range
    const bookings = await VehicleBooking.find({
      vehicleId: { $in: zoneVehicleIds },
      createdAt: { $gte: start, $lte: end },
    }).populate("vehicleId", "brand model category");

    // Calculate statistics
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    const confirmedBookings = bookings.filter(b => b.bookingStatus === "confirmed").length;
    const activeBookings = bookings.filter(b => b.bookingStatus === "active").length;
    const completedBookings = bookings.filter(b => b.bookingStatus === "completed").length;
    const cancelledBookings = bookings.filter(b => b.bookingStatus === "cancelled").length;

    // Vehicle utilization
    const vehicleStats = {};
    bookings.forEach(booking => {
      const vehicleKey = `${booking.vehicleId.brand} ${booking.vehicleId.model}`;
      if (!vehicleStats[vehicleKey]) {
        vehicleStats[vehicleKey] = { count: 0, revenue: 0 };
      }
      vehicleStats[vehicleKey].count++;
      vehicleStats[vehicleKey].revenue += booking.totalAmount || 0;
    });

    // Category-wise breakdown
    const categoryStats = {};
    bookings.forEach(booking => {
      const category = booking.vehicleId.category || "other";
      if (!categoryStats[category]) {
        categoryStats[category] = { count: 0, revenue: 0 };
      }
      categoryStats[category].count++;
      categoryStats[category].revenue += booking.totalAmount || 0;
    });

    // Daily breakdown
    const dailyStats = {};
    bookings.forEach(booking => {
      const date = booking.createdAt.toISOString().split('T')[0];
      if (!dailyStats[date]) {
        dailyStats[date] = { bookings: 0, revenue: 0 };
      }
      dailyStats[date].bookings++;
      dailyStats[date].revenue += booking.totalAmount || 0;
    });

    console.log(`✅ Generated report: ${totalBookings} bookings, ₹${totalRevenue} revenue`);

    res.json({
      success: true,
      data: {
        period: period || "custom",
        dateRange: { start, end },
        zone: {
          id: worker.workerProfile.zoneId,
          code: worker.workerProfile.zoneCode,
          name: worker.workerProfile.zoneName,
        },
        summary: {
          totalBookings,
          totalRevenue,
          averageBookingValue: totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0,
          confirmedBookings,
          activeBookings,
          completedBookings,
          cancelledBookings,
        },
        vehicleStats,
        categoryStats,
        dailyStats,
        totalVehicles: zoneVehicles.length,
      },
    });
  } catch (error) {
    console.error("❌ Error in getWorkerReports:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate reports",
      error: error.message,
    });
  }
};

// Add note to booking - zone-restricted
const addWorkerBookingNote = async (req, res) => {
  try {
    const workerId = req.user._id;
    const { bookingId } = req.params;
    const { note } = req.body;

    console.log(`📝 Worker ${workerId} adding note to booking ${bookingId}`);

    // Get worker profile
    const worker = await User.findById(workerId).select("workerProfile name role");
    
    if (!worker || worker.role !== "worker") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Worker role required.",
      });
    }

    if (!worker.workerProfile || !worker.workerProfile.zoneId) {
      return res.status(403).json({
        success: false,
        message: "Worker profile incomplete.",
      });
    }

    if (!note || note.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Note content is required",
      });
    }

    // Get booking
    const booking = await VehicleBooking.findById(bookingId).populate("vehicleId");

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found",
      });
    }

    // Verify vehicle belongs to worker's zone
    if (booking.vehicleId.zoneCode !== worker.workerProfile.zoneCode) {
      return res.status(403).json({
        success: false,
        message: "This booking belongs to a different zone.",
      });
    }

    // Add note
    if (!booking.workerNotes) {
      booking.workerNotes = [];
    }

    booking.workerNotes.push({
      note: note.trim(),
      addedBy: workerId,
      addedByName: worker.name,
      addedAt: new Date(),
    });

    await booking.save();

    console.log(`✅ Note added to booking ${bookingId}`);

    res.json({
      success: true,
      message: "Note added successfully",
      data: { booking },
    });
  } catch (error) {
    console.error("❌ Error in addWorkerBookingNote:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add note",
      error: error.message,
    });
  }
};
module.exports = {
  getWorkerDashboard,
  getWorkerVehicles,
  getWorkerBookings,
  getWorkerBookingDetails,
  getWorkerProfile,
  completeWorkerBooking,
  getWorkerHandoverBookings,
  processWorkerHandover,
  createWorkerOfflineBooking,
  updateWorkerBookingStatus,
  getWorkerReports,
  addWorkerBookingNote,
  getWorkerBookingById
};
