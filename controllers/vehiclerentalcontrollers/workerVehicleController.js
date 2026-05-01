const Vehicle = require('../../models/Vehicle');
const VehicleBooking = require('../../models/VehicleBooking');
const User = require('../../models/User');
// const mongoose = require('mongoose');

// Get worker dashboard data (scoped to worker's zone)
const getWorkerDashboard = async (req, res) => {
  try {
    const workerId = req.user._id || req.user.id;
    
    // 1. Get worker profile - only zone info
    const worker = await User.findById(workerId).select('workerProfile');
    if (!worker || !worker.workerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Worker profile not found'
      });
    }

    const { sellerId, zoneCode, zoneName } = worker.workerProfile;

    // 2. Fetch vehicles in zone - only _id
    const vehicles = await Vehicle.find({
      sellerId: sellerId,
      zoneCode: zoneCode,
      status: 'active'
    }).select('_id');

    const vehicleIds = vehicles.map(v => v._id);
    const now = new Date();

    // 3. Define Today's range (local IST aware)
    const today = new Date();
    const startOfDayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0, 0));
    startOfDayUTC.setUTCHours(startOfDayUTC.getUTCHours() - 5);
    startOfDayUTC.setUTCMinutes(startOfDayUTC.getUTCMinutes() - 30);
    
    const endOfDayUTC = new Date(startOfDayUTC.getTime() + 24 * 60 * 60 * 1000 - 1);

    // 4. Parallelize data fetching
    const [activeBookingsRaw, activityBookings] = await Promise.all([
      // Get most recent relevant bookings (limited for speed)
      VehicleBooking.find({
        vehicleId: { $in: vehicleIds },
        bookingStatus: { $in: ['ongoing', 'confirmed', 'pending'] }
      })
      .sort({ updatedAt: -1 })
      .limit(100) // Fetches enough for categorization
      .populate('vehicleId', 'companyName name vehicleNo category')
      .populate('userId', 'name phone')
      .select('bookingId bookingStatus startDateTime endDateTime userId customerDetails billing vehicleId payments refundDetails updatedAt'),

      // Get bookings with financial activity today
      VehicleBooking.find({
        vehicleId: { $in: vehicleIds },
        $or: [
          { 'payments.paymentDate': { $gte: startOfDayUTC, $lte: endOfDayUTC } },
          { 'refundDetails.processedDate': { $gte: startOfDayUTC, $lte: endOfDayUTC } }
        ]
      }).select('payments refundDetails billing')
    ]);

    // 5. Categorize in-memory
    const overdueBookings = activeBookingsRaw.filter(b => 
      ['ongoing', 'confirmed'].includes(b.bookingStatus) && new Date(b.endDateTime) < now
    );

    const activeBookings = activeBookingsRaw.filter(b => 
      ['ongoing', 'confirmed'].includes(b.bookingStatus) && new Date(b.endDateTime) >= now
    );

    const upcomingBookings = activeBookingsRaw.filter(b => 
      b.bookingStatus === 'pending' || 
      (b.bookingStatus === 'confirmed' && new Date(b.startDateTime) > now)
    );

    const recentBookings = activeBookingsRaw.slice(0, 50);

    // 6. Financial Calculations
    let todayPaymentIn = { cash: 0, online: 0, total: 0 };
    let todayPaymentOut = { cash: 0, online: 0, total: 0 };
    let dailyCashBookings = 0;
    let dailyOnlineBookings = 0;

    activityBookings.forEach(booking => {
      let hasCash = false;
      let hasOnline = false;

      if (booking.payments) {
        booking.payments.forEach(payment => {
          const payDate = new Date(payment.paymentDate);
          if (payDate >= startOfDayUTC && payDate <= endOfDayUTC && payment.status === 'success' && (payment.amount || 0) > 0) {
            const amount = payment.amount || 0;
            const isCash = (payment.paymentType || '').toLowerCase() === 'cash' || 
                          (payment.paymentMethod || '').toLowerCase() === 'cash';
            if (isCash) { todayPaymentIn.cash += amount; hasCash = true; }
            else { todayPaymentIn.online += amount; hasOnline = true; }
          }
        });
      }

      if (booking.refundDetails?.processedDate) {
        const refundDate = new Date(booking.refundDetails.processedDate);
        if (refundDate >= startOfDayUTC && refundDate <= endOfDayUTC) {
          todayPaymentOut.cash += booking.refundDetails.cashAmount || 0;
          todayPaymentOut.online += booking.refundDetails.onlineAmount || 0;
        }
      }

      if (hasCash) dailyCashBookings++;
      if (hasOnline) dailyOnlineBookings++;
    });

    todayPaymentIn.total = todayPaymentIn.cash + todayPaymentIn.online;
    todayPaymentOut.total = todayPaymentOut.cash + todayPaymentOut.online;

    // 7. Results
    const totalVehiclesCount = vehicles.length;
    
    // For more accurate counts, we should check each vehicle's manual availability/status
    // But since dashboard uses a simplified count, we'll fetch them with details
    const detailedVehicles = await Vehicle.find({
      _id: { $in: vehicleIds }
    }).select('status availability');

    const reservedVehiclesCount = activeBookings.length;
    const overdueVehiclesCount = overdueBookings.length;
    
    // Count how many are actually available (Active status + Available availability + No active booking)
    const trulyAvailableCount = detailedVehicles.filter(v => 
      v.status === 'active' && 
      v.availability === 'available' && 
      !activeBookings.some(b => b.vehicleId._id.toString() === v._id.toString()) &&
      !overdueBookings.some(b => b.vehicleId._id.toString() === v._id.toString())
    ).length;

    const availableVehiclesCount = trulyAvailableCount;

    res.json({
      success: true,
      data: {
        overview: {
          totalVehicles: totalVehiclesCount,
          availableVehicles: availableVehiclesCount,
          reservedVehicles: reservedVehiclesCount,
          overdueVehicles: overdueVehiclesCount,
          todayRevenue: todayPaymentIn.total,
          todayPaymentIn,
          todayPaymentOut,
          dailyCashRevenue: todayPaymentIn.cash,
          dailyOnlineRevenue: todayPaymentIn.online,
          dailyCashBookings,
          dailyOnlineBookings,
          zone: { code: zoneCode, name: zoneName }
        },
        recentBookings,
        overdueBookings: overdueBookings.slice(0, 20),
        vehicleStats: {
          total: totalVehiclesCount,
          available: availableVehiclesCount,
          reserved: reservedVehiclesCount
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

    const availabilityFilter = availability && availability !== 'all' ? availability : null;

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

    // Enhance vehicles with current booking status (OPTIMIZED)
    const now = new Date();
    
    // Fetch all relevant bookings for ALL vehicles in the result set in ONE query
    const allRelevantBookings = await VehicleBooking.find({
      vehicleId: { $in: vehicles.map(v => v._id) },
      bookingStatus: { $in: ['confirmed', 'ongoing', 'pending'] }
    })
    .populate('userId', 'name phone')
    .select('bookingId vehicleId startDateTime endDateTime customerDetails userId bookingStatus');

    const enhancedVehicles = vehicles.map(vehicle => {
      const vehicleBookings = allRelevantBookings.filter(b => b.vehicleId.toString() === vehicle._id.toString());
      
      // 1. Check for Overdue Bookings
      const overdueBooking = vehicleBookings.find(b => 
        ['confirmed', 'ongoing'].includes(b.bookingStatus) && new Date(b.endDateTime) < now
      );

      // 2. Check for Active/In-Use Bookings
      const activeBooking = vehicleBookings.find(b => 
        b.bookingStatus === 'ongoing' || 
        (b.bookingStatus === 'confirmed' && new Date(b.startDateTime) <= now && new Date(b.endDateTime) >= now)
      );

      // 3. Check for Future Bookings
      const futureBooking = vehicleBookings
        .filter(b => ['confirmed', 'pending'].includes(b.bookingStatus) && new Date(b.startDateTime) > now)
        .sort((a, b) => new Date(a.startDateTime) - new Date(b.startDateTime))[0];

      let bookingStatus = vehicle.availability || 'available';
      let bookingInfo = null;
      let isOverdue = false;

      // Handle explicit status overrides
      if (vehicle.status === 'inactive' || vehicle.status === 'out-of-service') {
        bookingStatus = 'inactive';
      } else if (vehicle.status === 'in-maintenance') {
        bookingStatus = 'maintenance';
      }

      const extractCustomerName = (booking) => {
        return booking?.customerDetails?.name || booking?.userId?.name || 'Customer';
      };
      const extractCustomerPhone = (booking) => {
        return booking?.customerDetails?.phone || booking?.userId?.phone || 'N/A';
      };

      if (overdueBooking) {
        const overdueHours = Math.floor((now - new Date(overdueBooking.endDateTime)) / (1000 * 60 * 60));
        bookingStatus = 'overdue';
        isOverdue = true;
        bookingInfo = {
          _id: overdueBooking._id,
          bookingId: overdueBooking.bookingId,
          bookingCode: overdueBooking.bookingId,
          startDateTime: overdueBooking.startDateTime,
          endDateTime: overdueBooking.endDateTime,
          customerName: extractCustomerName(overdueBooking),
          customerPhone: extractCustomerPhone(overdueBooking),
          bookingStatus: overdueBooking.bookingStatus,
          status: `Overdue by ${overdueHours}h`,
          overdueBy: overdueHours
        };
      } else if (activeBooking) {
        bookingStatus = 'reserved';
        bookingInfo = {
          _id: activeBooking._id,
          bookingId: activeBooking.bookingId,
          bookingCode: activeBooking.bookingId,
          startDateTime: activeBooking.startDateTime,
          endDateTime: activeBooking.endDateTime,
          customerName: extractCustomerName(activeBooking),
          customerPhone: extractCustomerPhone(activeBooking),
          bookingStatus: activeBooking.bookingStatus,
          status: activeBooking.bookingStatus === 'ongoing' ? 'Currently in use' : 'Ready for pickup'
        };
      } else if (bookingStatus === 'available' && futureBooking) {
        bookingStatus = 'pre-booked';
        bookingInfo = {
          _id: futureBooking._id,
          bookingId: futureBooking.bookingId,
          bookingCode: futureBooking.bookingId,
          startDateTime: futureBooking.startDateTime,
          endDateTime: futureBooking.endDateTime,
          customerName: extractCustomerName(futureBooking),
          customerPhone: extractCustomerPhone(futureBooking),
          bookingStatus: futureBooking.bookingStatus,
          status: 'Booked for future'
        };
      } else if (vehicle.availability && vehicle.availability !== 'available') {
        // Manual availability override
        bookingStatus = vehicle.availability;
      }

      const vehicleObj = vehicle.toObject();
      return {
        ...vehicleObj,
        images: vehicleObj.vehicleImages || [],
        currentBookingStatus: bookingStatus,
        bookingInfo,
        isOverdue
      };
    });

    // Apply booking status filter if specified
    let filteredVehicles = enhancedVehicles;
    if (availabilityFilter) {
      if (availabilityFilter === 'booked') {
        // 'booked' in frontend means any vehicle that is not available
        filteredVehicles = enhancedVehicles.filter(v => 
          ['reserved', 'overdue', 'pre-booked'].includes(v.currentBookingStatus)
        );
      } else {
        filteredVehicles = enhancedVehicles.filter(v => v.currentBookingStatus === availabilityFilter);
      }
    }
    
    console.log(`[getWorkerVehicles] availabilityFilter=${availabilityFilter}, total=${enhancedVehicles.length}, filtered=${filteredVehicles.length}`);

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

    // Try finding by MongoDB _id first, then fallback to bookingId string
    const mongoose = require('mongoose');
    let booking;
    if (mongoose.Types.ObjectId.isValid(bookingId)) {
      booking = await VehicleBooking.findById(bookingId)
        .populate('vehicleId')
        .populate('userId', 'name phone email');
    }
    if (!booking) {
      booking = await VehicleBooking.findOne({ bookingId })
        .populate('vehicleId')
        .populate('userId', 'name phone email');
    }

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
      refund, // { refundCash, refundOnline, refundNotes, totalRefund }
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

    // Find booking (try _id first, then string bookingId)
    const mongoose = require('mongoose');
    let booking;
    if (mongoose.Types.ObjectId.isValid(bookingId)) {
      booking = await VehicleBooking.findById(bookingId)
        .populate('vehicleId')
        .populate('userId');
    }
    if (!booking) {
      booking = await VehicleBooking.findOne({ bookingId })
        .populate('vehicleId')
        .populate('userId');
    }

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
    // Save discount applied at dropoff
    if (billing.discountAmount > 0) {
      booking.billing.discount = { amount: billing.discountAmount, discountType: 'fixed' };
    }

    // Extra charges
    if (extraCharges && extraCharges.amount) {
      booking.billing.damageCharges = extraCharges.amount;
      if (extraCharges.notes) {
        booking.notes = (booking.notes || '') + '\nExtra Charges: ' + extraCharges.notes;
      }
    }

    booking.billing.totalBill = billing.totalBill;

    // Calculate current total paid from all successful payments
    const calculatePaidAmount = (paymentsArr) => {
      return (paymentsArr || []).reduce((sum, p) => {
        if (p.status === 'success') {
          return sum + (parseFloat(p.amount) || 0);
        }
        return sum;
      }, 0);
    };

    // Calculate total paid before this drop-off
    const previousPaid = calculatePaidAmount(booking.payments);

    // Add new payments from drop-off
    if (payment.cashReceived > 0 || payment.onlineReceived > 0) {
      booking.payments = booking.payments || [];

      if (payment.cashReceived > 0) {
        booking.payments.push({
          amount: parseFloat(payment.cashReceived),
          paymentType: 'Cash',
          paymentMethod: 'Cash',
          status: 'success',
          paymentDate: new Date(),
        });
      }

      if (payment.onlineReceived > 0) {
        booking.payments.push({
          amount: parseFloat(payment.onlineReceived),
          paymentType: 'UPI',
          paymentMethod: 'Razorpay',
          status: 'success',
          paymentDate: new Date(),
        });
      }
    }

    // Special check for deposit: if deposit was collected but not in payments array
    // (Common for offline bookings or worker-edited bookings)
    const depositWasCollected = ['collected-online', 'collected-at-pickup'].includes(booking.depositStatus);
    const depositAmount = parseFloat(booking.depositAmount) || 0;
    
    // Check if a deposit payment already exists in payments array to avoid double counting
    const hasDepositInPayments = (booking.payments || []).some(p => 
      p.status === 'success' && 
      (p.notes?.toLowerCase().includes('deposit') || p.paymentMethod?.toLowerCase().includes('deposit'))
    );

    // If deposit is collected but not tracked in payments, we should ensure it's accounted for
    // However, the best practice is to have it in the payments array.
    // For now, we'll calculate totalPaid including it if it's missing from the array.
    let currentPaid = calculatePaidAmount(booking.payments);
    
    // If deposit was collected and we don't see a clear deposit record, 
    // and currentPaid is less than what it should be, it's likely the deposit isn't in payments.
    // Note: This is a safety fallback for inconsistent data.
    if (depositWasCollected && !hasDepositInPayments && currentPaid < depositAmount) {
      // In this case, we don't add to payments array here (to avoid mess), 
      // but we use it for our local status calculation.
      // Better yet, let's fix the paidAmount directly.
    }

    booking.paidAmount = currentPaid;

    // Determine final status
    if (booking.paidAmount >= booking.billing.totalBill) {
      booking.paymentStatus = 'paid';
    } else if (booking.paidAmount > 0) {
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

    // Handle Refunds if overpaid
    const actualBill = booking.billing.totalBill;
    if (booking.paidAmount > actualBill) {
      const refundAmount = booking.paidAmount - actualBill;

      // Use explicit cash/online split from frontend if provided
      const cashRefund = parseFloat(refund?.refundCash || 0);
      const onlineRefund = parseFloat(refund?.refundOnline || 0);
      const totalRefunded = (cashRefund + onlineRefund) > 0 ? cashRefund + onlineRefund : refundAmount;

      // Determine primary refund method label
      let refundMethod = 'cash';
      if (onlineRefund > 0 && cashRefund === 0) {
        refundMethod = 'bank-transfer';
      } else if (cashRefund > 0 && onlineRefund > 0) {
        refundMethod = 'mixed';
      } else if (refundMode) {
        refundMethod = refundMode === 'online' ? 'bank-transfer' : 'cash';
      } else {
        const cashPayment = booking.payments?.find(p => p.paymentMethod === 'Cash' || p.paymentType === 'Cash');
        refundMethod = cashPayment ? 'cash' : 'bank-transfer';
      }

      const finalCashRefund = cashRefund > 0 ? cashRefund : (refundMethod === 'cash' ? totalRefunded : 0);
      const finalOnlineRefund = onlineRefund > 0 ? onlineRefund : (refundMethod !== 'cash' ? totalRefunded : 0);

      booking.refundDetails = {
        reason: 'overbilling',
        requestedAmount: refundAmount,
        approvedAmount: totalRefunded,
        refundMethod: refundMethod,
        refundMode: refundMode || (finalCashRefund >= finalOnlineRefund ? 'cash' : 'online'),
        cashAmount: finalCashRefund,
        onlineAmount: finalOnlineRefund,
        processedBy: req.user.id,
        processedDate: new Date(),
        refundReference: `REF-${booking.bookingId}-${Date.now().toString().slice(-6)}`,
        notes: `Overpayment refund processed by worker. Customer paid ₹${booking.paidAmount}, actual bill ₹${actualBill}. Refunded ₹${finalCashRefund} cash and ₹${finalOnlineRefund} online.`
      };

      booking.refundStatus = 'completed';
      booking.depositRefundStatus = 'not-applicable';

      booking.payments = booking.payments || [];
      if (finalCashRefund > 0) {
        booking.payments.push({
          amount: -Math.abs(finalCashRefund),
          paymentType: 'Cash',
          paymentMethod: 'Refund-Cash',
          status: 'success',
          paymentDate: new Date(),
          processedBy: req.user.id
        });
      }
      if (finalOnlineRefund > 0) {
        booking.payments.push({
          amount: -Math.abs(finalOnlineRefund),
          paymentType: 'UPI',
          paymentMethod: 'Refund-Online',
          status: 'success',
          paymentDate: new Date(),
          processedBy: req.user.id
        });
      }

      const netPaid = (booking.payments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
      booking.paidAmount = Math.max(0, Math.round((netPaid + Number.EPSILON) * 100) / 100);
      
      if (booking.paidAmount >= booking.billing.totalBill) {
        booking.paymentStatus = 'paid';
      } else if (booking.paidAmount > 0) {
        booking.paymentStatus = 'partially-paid';
      } else {
        booking.paymentStatus = 'unpaid';
      }
    } else if (booking.paidAmount < actualBill) {
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

    // ── Pre-flight validation ─────────────────────────────────────────────────
    try {
      await booking.validate();
    } catch (validationErr) {
      console.error('Booking pre-save validation failed:', validationErr.message);
      return res.status(400).json({
        success: false,
        message: 'Booking data is invalid — dropoff not saved. Please check the values and retry.',
        error: validationErr.message,
      });
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Update vehicle BEFORE saving the booking.
    await Vehicle.findByIdAndUpdate(booking.vehicleId._id, {
      availability: 'available',
      currentBookingId: null,
    });

    // All side-effects done — now persist the booking as completed.
    await booking.save();

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
      // Map frontend status to backend status if necessary
      let statusToFilter = status;
      if (status === 'in-progress' || status === 'active') {
        statusToFilter = 'ongoing';
      }
      query.bookingStatus = statusToFilter;
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
        { bookingId: { $regex: search, $options: "i" } },
        { "customerDetails.name": { $regex: search, $options: "i" } },
        { "customerDetails.phone": { $regex: search, $options: "i" } },
        { "savedBookingDetails.customerName": { $regex: search, $options: "i" } },
        { "savedBookingDetails.customerPhone": { $regex: search, $options: "i" } },
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
        sort = { startDateTime: -1 };
        break;
      case "amount-high":
        sort = { "billing.totalBill": -1 };
        break;
      case "amount-low":
        sort = { "billing.totalBill": 1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const bookings = await VehicleBooking.find(query)
      .sort(sort)
      .populate("vehicleId", "companyName name vehicleNo vehicleImages category type")
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
      query.startDateTime = { $lte: now };
    } else if (type === "return") {
      // Bookings active and ready for return (any ongoing booking can be returned)
      query.bookingStatus = "ongoing";
    } else {
      // All handover bookings (both pickup and return)
      query.$or = [
        { bookingStatus: "confirmed", startDateTime: { $lte: now } },
        { bookingStatus: "ongoing" },
      ];
    }

    const bookings = await VehicleBooking.find(query)
      .sort({ startDateTime: 1 })
      .populate("vehicleId", "companyName name vehicleNo vehicleImages category type zoneCode")
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

    if (handoverType === "return" && booking.bookingStatus !== "ongoing") {
      return res.status(400).json({
        success: false,
        message: "Booking must be in 'ongoing' status for return.",
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
      booking.bookingStatus = "ongoing";
      // Map to correct schema fields in vehicleHandover
      booking.vehicleHandover = {
        startMeterReading: handoverData.odometerReading,
        fuelLevel: handoverData.fuelLevel,
        vehicleCondition: handoverData.vehicleCondition.exterior, // Using exterior as summary condition
        handoverTime: handoverData.timestamp,
        handoverBy: handoverData.workerId,
        handoverNotes: handoverData.workerNotes,
        handoverImages: handoverData.photos
      };
      booking.actualStartTime = new Date();

      // Handle deposit collection if not already recorded
      if (['collected-online', 'collected-at-pickup'].includes(booking.depositStatus)) {
        const hasDepositPayment = (booking.payments || []).some(p => 
          p.status === 'success' && (p.notes?.toLowerCase().includes('deposit') || p.paymentMethod?.toLowerCase().includes('deposit'))
        );

        if (!hasDepositPayment && (booking.depositAmount || 0) > 0) {
          booking.payments = booking.payments || [];
          booking.payments.push({
            amount: booking.depositAmount,
            paymentType: booking.depositStatus === 'collected-online' ? 'UPI' : 'Cash',
            paymentMethod: booking.depositStatus === 'collected-online' ? 'Manual' : 'Cash',
            status: 'success',
            receivedAt: new Date(),
            receivedBy: workerId,
            notes: 'Security deposit collected by worker during pickup'
          });

          // Update paidAmount
          booking.paidAmount = (booking.payments || []).reduce((sum, p) => {
            if (p.status === 'success') return sum + (parseFloat(p.amount) || 0);
            return sum;
          }, 0);
        }
      }

      // Update vehicle availability
      await Vehicle.findByIdAndUpdate(booking.vehicleId._id, {
        availability: "reserved",
        currentBookingId: booking._id,
      });

      console.log(`✅ Pickup completed for booking ${bookingId}`);
    } else if (handoverType === "return") {
      booking.bookingStatus = "completed";
      // Map to correct schema fields in vehicleReturn
      booking.vehicleReturn = {
        submitted: true,
        submittedAt: handoverData.timestamp,
        submittedBy: handoverData.workerId,
        endMeterReading: handoverData.odometerReading,
        returnFuelLevel: handoverData.fuelLevel,
        condition: handoverData.vehicleCondition.exterior,
        damageNotes: handoverData.workerNotes,
        returnImages: handoverData.photos,
        vehicleAvailableAgain: true,
        madeAvailableAt: new Date()
      };
      booking.actualEndTime = new Date();

      // Handle automatic deposit refund if no refund details exist
      if (!booking.refundDetails && (booking.depositAmount || 0) > 0 && booking.depositStatus !== 'not-required') {
        const refundAmount = booking.depositAmount;
        booking.refundDetails = {
          reason: 'Security deposit refund',
          requestedAmount: refundAmount,
          approvedAmount: refundAmount,
          refundMethod: 'cash',
          refundMode: 'cash',
          cashAmount: refundAmount,
          onlineAmount: 0,
          processedBy: workerId,
          processedDate: new Date(),
          refundReference: `REF-DEP-${booking.bookingId}-${Date.now().toString().slice(-6)}`,
          notes: 'Automatic security deposit refund processed during handover return.'
        };
        booking.refundStatus = 'completed';

        // Add negative payment record for hisab tracking
        booking.payments = booking.payments || [];
        booking.payments.push({
          amount: -Math.abs(refundAmount),
          paymentType: 'Cash',
          paymentMethod: 'Refund-Cash',
          status: 'success',
          paymentDate: new Date(),
          processedBy: workerId,
          notes: 'Security deposit refunded at return'
        });

        // Update paidAmount
        const netPaid = (booking.payments || []).reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        booking.paidAmount = Math.max(0, Math.round((netPaid + Number.EPSILON) * 100) / 100);
      }

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
      startMeterReading,
      fuelLevel,
      vehicleCondition,
      rateType,
      totalAmount: frontendTotalAmount,
      depositAmount,
      depositPaymentMethod,
      depositCashAmount,
      depositOnlineAmount,
      cashAmount,
      onlineAmount,
    } = req.body;

    console.log(`📝 Worker ${workerId} creating offline booking`);

    // Get worker profile
    const worker = await User.findById(workerId).select("workerProfile name role");
    
    if (!worker || !['worker', 'seller', 'admin'].includes(worker.role)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Authorized role required.",
      });
    }

    // Skip zone check for sellers/admins as they should have fleet-wide access
    const isSpecialRole = ['seller', 'admin'].includes(worker.role);

    if (!isSpecialRole && (!worker.workerProfile || !worker.workerProfile.zoneId)) {
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

    if (!isSpecialRole && (vehicle.zoneCode !== worker.workerProfile.zoneCode)) {
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
    const durationHours = Math.ceil(durationMs / (1000 * 60 * 60));
    
    // Use rateType from frontend or fallback to "hourly"
    const finalRateType = rateType || "hourly";
    const includesFuelCalc = false; // Based on frontend requirements or explicitly add it to req.body if needed

    // Calculate rental duration and amount using the selected rateType
    const costCalculation = vehicle.calculateRate(durationHours, finalRateType, includesFuelCalc);
    
    let baseAmount = costCalculation.total || costCalculation.breakdown?.total || 0;

    // Add extras
    if (requiresHelmet) {
      baseAmount += 50; // Helmet charge
    }
    if (requiresInsurance) {
      const durationDays = Math.ceil(durationHours / 24);
      baseAmount += durationDays * 20; // Daily insurance
    }

    // Safety: use frontend total amount if provided, otherwise backend calculation
    const totalAmount = frontendTotalAmount ? Number(frontendTotalAmount) : Math.max(0, baseAmount);
    const deposit = Number(depositAmount) || 0;
    const advancePaid = Number(advancePayment) || 0;
    const cashPaid = Number(cashAmount) || 0;
    const onlinePaid = Number(onlineAmount) || 0;

    // Generate booking code
    const bookingCode = `OFF-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    // Find existing user by email or phone
    let guestUser = null;
    
    if (customerEmail) {
      guestUser = await User.findOne({ email: customerEmail.toLowerCase().trim() });
    }
    
    if (!guestUser && customerPhone) {
      guestUser = await User.findOne({ phone: customerPhone });
    }
    
    if (!guestUser) {
      guestUser = new User({
        name: customerName,
        phone: customerPhone,
        email: customerEmail ? customerEmail.toLowerCase().trim() : `guest${Date.now()}@offline.com`,
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
      bookedBy: workerId,
      bookingSource: 'worker-portal',
      customerDetails: {
        name: customerName,
        phone: customerPhone,
        email: customerEmail || guestUser.email,
        address: { street: '', city: '', state: '', pincode: '' }
      },
      startDateTime: pickup,
      endDateTime: returnDt,
      zone: vehicle.zoneName || (worker.workerProfile ? worker.workerProfile.zoneName : vehicle.zoneCenterName) || "offline-zone",
      zoneId: vehicle.zoneCode || (worker.workerProfile ? worker.workerProfile.zoneCode : vehicle.zoneCode) || "offline-zone",
      centerId: vehicle.zoneCode || (worker.workerProfile ? worker.workerProfile.zoneCode : vehicle.zoneCode) || "offline-center",
      centerName: vehicle.zoneName || (worker.workerProfile ? worker.workerProfile.zoneName : vehicle.zoneCenterName) || "Offline Center",
      
      rateType: finalRateType,
      billing: {
        baseAmount: totalAmount,
        totalBill: totalAmount,
        duration: durationHours,
        kmLimit: costCalculation.rateConfig?.kmLimit || 0,
        addonsAmount: requiresHelmet ? 50 : 0,
        extraKmCharge: 0,
        extraHourCharge: 0,
        fuelCharges: 0,
        damageCharges: 0,
        cleaningCharges: 0,
        tollCharges: 0,
        lateFees: 0,
        discount: { amount: 0 }
      },
      depositAmount: deposit,
      paymentMethod: paymentMethod || "cash",
      depositCollectionMethod: deposit > 0 ? "at-pickup" : "not-required",
      depositStatus: deposit > 0 ? (depositPaymentMethod === 'mixed' ? 'collected-at-pickup' : (depositPaymentMethod === 'online' ? 'collected-online' : 'collected-at-pickup')) : "not-required",
      
      bookingStatus: (pickup <= new Date()) ? "ongoing" : "confirmed", // Mark as ongoing only if pickup is now or past
      paymentStatus: advancePaid >= totalAmount ? "paid" : "partially-paid",
      paidAmount: advancePaid,
      
      cashFlowDetails: {
        isOfflineBooking: true,
        cashPaymentDetails: {
          totalCashReceived: cashPaid,
          onlinePaymentAmount: onlinePaid,
          pendingCashAmount: Math.max(0, totalAmount - advancePaid),
          cashReceivedBy: workerId,
          cashReceivedAt: cashPaid > 0 ? new Date() : null,
          notes: workerNotes || ""
        },
        sellerCashFlow: {
          dailyCashCollected: cashPaid,
          isHandedOverToAdmin: false
        }
      },
      
      vehicleHandover: {
        startMeterReading: Number(startMeterReading) || 0,
        fuelLevel: fuelLevel || 'unknown',
        vehicleCondition: vehicleCondition || 'good',
        handoverTime: new Date(),
        handoverNotes: workerNotes || '',
        handoverBy: workerId
      },
      
      verificationCodes: {
        pickup: { code: '0000', verified: true, verifiedAt: new Date(), verifiedBy: workerId },
        drop: { code: Math.floor(1000 + Math.random() * 9000).toString(), verified: false }
      }
    });

    if (cashPaid > 0) {
      booking.payments.push({
        amount: cashPaid,
        paymentType: 'Cash',
        paymentMethod: 'Cash',
        status: 'success',
        receivedBy: workerId,
        receivedAt: new Date(),
        notes: 'Cash payment received by worker for offline booking'
      });
    }

    if (onlinePaid > 0) {
      booking.payments.push({
        amount: onlinePaid,
        paymentType: 'UPI',
        paymentMethod: 'Razorpay',
        status: 'success',
        receivedBy: workerId,
        receivedAt: new Date(),
        notes: 'Online payment received by worker for offline booking'
      });
    }

    // Add deposit to payments if collected at pickup and not already included in cashPaid/onlinePaid
    const isDepositCollected = ['collected-at-pickup', 'collected-online'].includes(booking.depositStatus);
    if (isDepositCollected && deposit > 0) {
      // Check if we should add it as a separate record
      // Logic: if total paid matches only rent, then deposit is missing from payments
      const totalPaymentsSoFar = (booking.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
      
      if (totalPaymentsSoFar < (totalAmount + deposit) && totalPaymentsSoFar <= totalAmount) {
        if (depositPaymentMethod === 'mixed') {
          const cashDep = parseFloat(depositCashAmount) || 0;
          const onlineDep = parseFloat(depositOnlineAmount) || 0;

          if (cashDep > 0) {
            booking.payments.push({
              amount: cashDep,
              paymentType: 'Cash',
              paymentMethod: 'Cash',
              status: 'success',
              receivedBy: workerId,
              receivedAt: new Date(),
              notes: 'Security deposit (Cash) collected at pickup'
            });
          }

          if (onlineDep > 0) {
            booking.payments.push({
              amount: onlineDep,
              paymentType: 'UPI',
              paymentMethod: 'Manual',
              status: 'success',
              receivedBy: workerId,
              receivedAt: new Date(),
              notes: 'Security deposit (Online) collected at pickup'
            });
          }
        } else {
          booking.payments.push({
            amount: deposit,
            paymentType: depositPaymentMethod === 'online' ? 'UPI' : 'Cash',
            paymentMethod: depositPaymentMethod === 'online' ? 'Manual' : 'Cash',
            status: 'success',
            receivedBy: workerId,
            receivedAt: new Date(),
            notes: 'Security deposit collected at pickup'
          });
        }
      }
    }

    // Update paidAmount to match total successful payments
    booking.paidAmount = (booking.payments || []).reduce((sum, p) => {
      if (p.status === 'success') return sum + (parseFloat(p.amount) || 0);
      return sum;
    }, 0);

    await booking.save();
    
    // Update vehicle availability to prevent double booking
    await Vehicle.findByIdAndUpdate(vehicle._id, {
      availability: 'reserved',
      currentBookingId: booking._id
    });

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



// Get worker reports/analytics - zone-restricted
const getWorkerReports = async (req, res) => {
  try {
    const workerId = req.user._id || req.user.id;
    const { period, startDate, endDate } = req.query;

    console.log(`📊 Worker ${workerId} requesting reports (${period || 'custom'})`);

    // Get worker profile
    const worker = await User.findById(workerId).select("workerProfile role");
    
    if (!worker || (worker.role !== "worker" && worker.role !== "admin")) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Worker role required.",
      });
    }

    if (!worker.workerProfile || !worker.workerProfile.zoneCode) {
      return res.status(403).json({
        success: false,
        message: "Worker profile incomplete. Zone assignment required.",
      });
    }

    const { sellerId, zoneCode } = worker.workerProfile;

    // Calculate date range (IST Aware)
    let start, end;
    const now = new Date();
    
    // Helper to get IST start of day in UTC
    const getISTStartOfDay = (date) => {
      const d = new Date(date);
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCHours(d.getUTCHours() - 5);
      d.setUTCMinutes(d.getUTCMinutes() - 30);
      return d;
    };

    if (startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      switch (period) {
        case "today":
          start = getISTStartOfDay(now);
          end = new Date(start);
          end.setUTCDate(end.getUTCDate() + 1);
          break;
        case "week":
          start = getISTStartOfDay(now);
          start.setUTCDate(start.getUTCDate() - 7);
          end = new Date();
          break;
        case "month":
          start = getISTStartOfDay(now);
          start.setUTCMonth(start.getUTCMonth() - 1);
          end = new Date();
          break;
        default:
          start = getISTStartOfDay(now);
          start.setUTCDate(start.getUTCDate() - 30);
          end = new Date();
      }
    }

    // Get all vehicles in worker's zone to ensure we only report on those
    const zoneVehicles = await Vehicle.find({
      sellerId: sellerId,
      zoneCode: zoneCode,
    }).select("_id companyName name category");

    const zoneVehicleIds = zoneVehicles.map((v) => v._id);

    // Get bookings in date range that belong to these vehicles
    // We filter by createdAt for the report period
    const bookings = await VehicleBooking.find({
      vehicleId: { $in: zoneVehicleIds },
      createdAt: { $gte: start, $lte: end },
    }).populate("vehicleId", "companyName name category vehicleNo");

    // Calculate statistics
    let totalRevenue = 0;
    let confirmedBookings = 0;
    let activeBookings = 0;
    let completedBookings = 0;
    let cancelledBookings = 0;

    const vehicleStats = {};
    const categoryStats = {};
    const dailyStats = {};

    bookings.forEach(booking => {
      // Robust revenue calculation checking multiple possible fields
      const rev = booking.billing?.totalBill || booking.totalAmount || booking.paidAmount || 0;
      totalRevenue += rev;

      // Status counts
      if (booking.bookingStatus === "confirmed") confirmedBookings++;
      else if (booking.bookingStatus === "ongoing") activeBookings++;
      else if (booking.bookingStatus === "completed") completedBookings++;
      else if (booking.bookingStatus === "cancelled") cancelledBookings++;

      // Vehicle Stats
      if (booking.vehicleId) {
        const vehicleName = `${booking.vehicleId.companyName || ''} ${booking.vehicleId.name || ''}`.trim() || 'Unknown Vehicle';
        if (!vehicleStats[vehicleName]) {
          vehicleStats[vehicleName] = { count: 0, revenue: 0 };
        }
        vehicleStats[vehicleName].count++;
        vehicleStats[vehicleName].revenue += rev;

        // Category Stats
        const category = (booking.vehicleId.category || "other").toLowerCase();
        if (!categoryStats[category]) {
          categoryStats[category] = { count: 0, revenue: 0 };
        }
        categoryStats[category].count++;
        categoryStats[category].revenue += rev;
      }

      // Daily breakdown
      const dateKey = booking.createdAt.toISOString().split('T')[0];
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = { bookings: 0, revenue: 0 };
      }
      dailyStats[dateKey].bookings++;
      dailyStats[dateKey].revenue += rev;
    });

    console.log(`✅ Generated report for zone ${zoneCode}: ${bookings.length} bookings, ₹${totalRevenue} revenue`);

    res.json({
      success: true,
      data: {
        period: period || "custom",
        dateRange: { start, end },
        zone: {
          id: worker.workerProfile.zoneId,
          code: zoneCode,
          name: worker.workerProfile.zoneName,
        },
        summary: {
          totalBookings: bookings.length,
          totalRevenue,
          averageBookingValue: bookings.length > 0 ? Math.round(totalRevenue / bookings.length) : 0,
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
// =====================================================================
// Update booking status (zone-restricted)
// PUT /worker/vehicles/bookings/:bookingId/status
// =====================================================================
const updateWorkerBookingStatus = async (req, res) => {
  try {
    const workerId = req.user._id || req.user.id;
    const { bookingId } = req.params;
    const { status, notes } = req.body;

    const ALLOWED_STATUSES = ['confirmed', 'ongoing', 'completed', 'cancelled'];
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}`
      });
    }

    const worker = await User.findById(workerId).select('workerProfile');
    if (!worker?.workerProfile) {
      return res.status(403).json({ success: false, message: 'Worker profile not found' });
    }

    const mongoose = require('mongoose');
    let booking;
    if (mongoose.Types.ObjectId.isValid(bookingId)) {
      booking = await VehicleBooking.findById(bookingId).populate('vehicleId');
    }
    if (!booking) {
      booking = await VehicleBooking.findOne({ bookingId }).populate('vehicleId');
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Zone verification
    if (booking.vehicleId?.zoneCode !== worker.workerProfile.zoneCode) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Booking not in your zone' });
    }

    booking.bookingStatus = status;
    booking.statusHistory = booking.statusHistory || [];
    booking.statusHistory.push({
      status,
      timestamp: new Date(),
      updatedBy: workerId,
      notes: notes || ''
    });
    if (notes) booking.notes = (booking.notes || '') + '\n[Worker Status Update] ' + notes;
    await booking.save();

    // If booking is cancelled or completed, free up the vehicle
    if (['cancelled', 'completed'].includes(status)) {
      await Vehicle.findByIdAndUpdate(booking.vehicleId._id, {
        availability: 'available',
        currentBookingId: null
      });
      console.log(`🔓 Vehicle ${booking.vehicleId._id} freed after booking ${status}`);
    } else if (status === 'ongoing') {
      await Vehicle.findByIdAndUpdate(booking.vehicleId._id, {
        availability: 'reserved',
        currentBookingId: booking._id
      });
    }

    res.json({ success: true, message: `Booking status updated to ${status}`, data: booking });
  } catch (error) {
    console.error('Error updating worker booking status:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking status', error: error.message });
  }
};

// =====================================================================
// Create extension (worker-initiated, auto-approved)
// POST /worker/vehicles/bookings/:bookingId/create-extension
// =====================================================================
const createWorkerExtension = async (req, res) => {
  try {
    const workerId = req.user._id || req.user.id;
    const { bookingId } = req.params;
    const {
      requestedEndDateTime,
      additionalHours,
      additionalAmount,
      additionalKmLimit,
      reason,
      planType,
    } = req.body;

    const worker = await User.findById(workerId).select('workerProfile');
    if (!worker?.workerProfile) {
      return res.status(403).json({ success: false, message: 'Worker profile not found' });
    }

    const mongoose = require('mongoose');
    let booking;
    if (mongoose.Types.ObjectId.isValid(bookingId)) {
      booking = await VehicleBooking.findById(bookingId).populate('vehicleId');
    }
    if (!booking) {
      booking = await VehicleBooking.findOne({ bookingId }).populate('vehicleId');
    }

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (!['confirmed', 'ongoing'].includes(booking.bookingStatus)) {
      return res.status(400).json({ success: false, message: 'Can only extend active or confirmed bookings' });
    }

    // Zone verification
    if (booking.vehicleId?.zoneCode !== worker.workerProfile.zoneCode) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Booking not in your zone' });
    }

    const extensionEntry = {
      requestId: `EXT-${Date.now()}`,
      requestedBy: workerId,
      requestedAt: new Date(),
      requestedEndDateTime: new Date(requestedEndDateTime),
      additionalHours: additionalHours || 0,
      additionalAmount: additionalAmount || 0,
      additionalKmLimit: additionalKmLimit || 0,
      reason: reason || 'Worker initiated extension',
      planType: planType || 'hourly',
      status: 'approved',
      autoApproved: true,
      createdBy: 'worker',
      approvedAt: new Date(),
      approvedBy: workerId,
    };

    booking.extensionRequests = booking.extensionRequests || [];
    booking.extensionRequests.push(extensionEntry);

    // Update booking totals
    booking.totalExtensionHours = (booking.totalExtensionHours || 0) + (additionalHours || 0);
    booking.totalExtensionAmount = (booking.totalExtensionAmount || 0) + (additionalAmount || 0);
    booking.endDateTime = new Date(requestedEndDateTime);

    // Update km limit
    if (additionalKmLimit && booking.billing) {
      booking.billing.kmLimit = (booking.billing.kmLimit || 0) + additionalKmLimit;
    }

    // Update total bill
    if (booking.billing) {
      booking.billing.totalBill = (booking.billing.totalBill || 0) + (additionalAmount || 0);
    }

    booking.statusHistory = booking.statusHistory || [];
    booking.statusHistory.push({
      status: booking.bookingStatus,
      timestamp: new Date(),
      updatedBy: workerId,
      notes: `Extension created by worker: +${additionalHours}hrs, ₹${additionalAmount}`
    });

    await booking.save();

    res.json({
      success: true,
      message: 'Extension created and approved successfully',
      data: { booking, extension: extensionEntry }
    });
  } catch (error) {
    console.error('Error creating worker extension:', error);
    res.status(500).json({ success: false, message: 'Failed to create extension', error: error.message });
  }
};

// =====================================================================
// Daily Hisab for worker's zone
// GET /worker/vehicles/daily-hisab?date=YYYY-MM-DD
// =====================================================================
const getWorkerDailyHisab = async (req, res) => {
  try {
    const workerId = req.user._id || req.user.id;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required (format: YYYY-MM-DD)' });
    }

    const worker = await User.findById(workerId).select('workerProfile');
    if (!worker?.workerProfile) {
      return res.status(403).json({ success: false, message: 'Worker profile not found' });
    }

    const { sellerId, zoneCode } = worker.workerProfile;

    // IST → UTC range
    const dateParts = date.split('-');
    const year = parseInt(dateParts[0]);
    const month = parseInt(dateParts[1]) - 1;
    const day = parseInt(dateParts[2]);
    const startOfDayUTC = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
    startOfDayUTC.setUTCHours(startOfDayUTC.getUTCHours() - 5);
    startOfDayUTC.setUTCMinutes(startOfDayUTC.getUTCMinutes() - 30);
    const endOfDayUTC = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
    endOfDayUTC.setUTCHours(endOfDayUTC.getUTCHours() - 5);
    endOfDayUTC.setUTCMinutes(endOfDayUTC.getUTCMinutes() - 30);

    // Only vehicles in the worker's zone
    const zoneVehicles = await Vehicle.find({ sellerId, zoneCode }).select('_id companyName name vehicleNo category type zoneCode zoneCenterName maintenance maintenanceHistory');
    const vehicleIds = zoneVehicles.map(v => v._id);
    const vehicleMap = {};
    zoneVehicles.forEach(v => { vehicleMap[v._id.toString()] = v; });

    const bookings = await VehicleBooking.find({
      vehicleId: { $in: vehicleIds },
      $or: [
        { 'payments.paymentDate': { $gte: startOfDayUTC, $lte: endOfDayUTC } },
        { 'refundDetails.processedDate': { $gte: startOfDayUTC, $lte: endOfDayUTC } },
        { 'bookingDate': { $gte: startOfDayUTC, $lte: endOfDayUTC } },
        { 'vehicleReturn.submittedAt': { $gte: startOfDayUTC, $lte: endOfDayUTC } }
      ]
    }).populate('vehicleId', 'companyName name vehicleNo category type zoneCode zoneCenterName').lean();

    let totalIn = 0;
    let totalOut = 0;
    let totalCashIn = 0;
    let totalOnlineIn = 0;
    let totalCashOut = 0;
    let totalOnlineOut = 0;
    let totalNewBookings = 0;
    let totalSubmittedBookings = 0;
    const vehicleTransactions = [];

    for (const booking of bookings) {
      const vehicleInfo = booking.vehicleId || {};
      const vehicleName = `${vehicleInfo.companyName || ''} ${vehicleInfo.name || ''}`.trim();
      const vehicleNo = vehicleInfo.vehicleNo || 'N/A';

      // Payments on this date
      let dayPayments = 0;
      let dayCashIn = 0;
      let dayOnlineIn = 0;
      const paymentDetails = [];
      
      if (booking.payments?.length > 0) {
        for (const payment of booking.payments) {
          const payDate = new Date(payment.paymentDate);
          if (payDate >= startOfDayUTC && payDate <= endOfDayUTC && payment.status === 'success' && (payment.amount || 0) > 0) {
            const amount = payment.amount || 0;
            dayPayments += amount;
            
            // Check for cash in both type and method fields
            const isCash = (payment.paymentType || '').toLowerCase() === 'cash' || 
                          (payment.paymentMethod || '').toLowerCase() === 'cash';
            
            if (isCash) {
              dayCashIn += amount;
            } else {
              dayOnlineIn += amount;
            }

            paymentDetails.push({
              amount: amount,
              type: payment.paymentType,
              method: payment.paymentMethod,
              time: payment.paymentDate
            });
          }
        }
      }

      // Refunds on this date
      let dayRefunds = 0;
      let dayCashOut = 0;
      let dayOnlineOut = 0;
      let refundDetail = null;
      
      if (booking.refundDetails?.processedDate) {
        const refundDate = new Date(booking.refundDetails.processedDate);
        if (refundDate >= startOfDayUTC && refundDate <= endOfDayUTC) {
          const approvedAmount = booking.refundDetails.approvedAmount || 0;
          
          if (booking.refundDetails.cashAmount != null || booking.refundDetails.onlineAmount != null) {
            dayCashOut = booking.refundDetails.cashAmount || 0;
            dayOnlineOut = booking.refundDetails.onlineAmount || 0;
          } else {
            const mode = (booking.refundDetails.refundMode || booking.refundDetails.refundMethod || 'cash').toLowerCase();
            if (mode === 'cash') {
              dayCashOut = approvedAmount;
              dayOnlineOut = 0;
            } else {
              dayCashOut = 0;
              dayOnlineOut = approvedAmount;
            }
          }
          
          dayRefunds = dayCashOut + dayOnlineOut;
          refundDetail = {
            totalRefund: dayRefunds,
            cashRefund: dayCashOut,
            onlineRefund: dayOnlineOut,
            reason: booking.refundDetails.reason,
            mode: booking.refundDetails.refundMode || booking.refundDetails.refundMethod || 'Other'
          };
        }
      }

      const isNewBooking = booking.bookingDate &&
        new Date(booking.bookingDate) >= startOfDayUTC &&
        new Date(booking.bookingDate) <= endOfDayUTC;
      
      const isSubmitted = booking.vehicleReturn?.submitted &&
        booking.vehicleReturn?.submittedAt &&
        new Date(booking.vehicleReturn.submittedAt) >= startOfDayUTC &&
        new Date(booking.vehicleReturn.submittedAt) <= endOfDayUTC;

      if (isNewBooking) totalNewBookings++;
      if (isSubmitted) totalSubmittedBookings++;

      // Include if there's money movement OR it's a new booking OR it was submitted today
      if (dayPayments > 0 || dayRefunds > 0 || isNewBooking || isSubmitted) {
        totalIn += dayPayments;
        totalCashIn += dayCashIn;
        totalOnlineIn += dayOnlineIn;
        
        totalOut += dayRefunds;
        totalCashOut += dayCashOut;
        totalOnlineOut += dayOnlineOut;

        const extraKmCharge = booking.billing?.extraKmCharge || 0;
        const extraHourCharge = booking.billing?.extraHourCharge || 0;
        const extraKm = booking.ratePlanUsed?.extraChargePerKm ? extraKmCharge / booking.ratePlanUsed.extraChargePerKm : null;
        const extraHours = booking.ratePlanUsed?.extraChargePerHour ? extraHourCharge / booking.ratePlanUsed.extraChargePerHour : null;

        vehicleTransactions.push({
          bookingId: booking.bookingId,
          _id: booking._id,
          vehicleName,
          vehicleNo,
          vehicleCategory: vehicleInfo.category,
          vehicleType: vehicleInfo.type,
          zoneCode: vehicleInfo.zoneCode,
          zoneCenterName: vehicleInfo.zoneCenterName,
          customerName: booking.customerDetails?.name || 'N/A',
          customerPhone: booking.customerDetails?.phone || 'N/A',
          bookingStatus: booking.bookingStatus,
          bookingDate: booking.bookingDate,
          startDateTime: booking.startDateTime,
          endDateTime: booking.endDateTime,
          planType: booking.rateType,
          durationHours: booking.billing?.duration || null,
          kmLimit: booking.billing?.kmLimit || null,
          totalBill: booking.billing?.totalBill || 0,
          discountAmount: booking.billing?.discount?.amount || 0,
          depositAmount: booking.depositAmount || 0,
          totalPaid: booking.paidAmount || 0,
          extraKmCharge, extraHourCharge, extraKm, extraHours,
          isNewBooking, isSubmitted,
          dayPayments, dayCashIn, dayOnlineIn,
          dayRefunds, dayCashOut, dayOnlineOut,
          dayNet: dayPayments - dayRefunds,
          paymentDetails, refundDetail,
        });
      }
    }

    // Include maintenance costs in Hisab
    let totalMaintenance = 0;
    for (const vehicle of zoneVehicles) {
      const records = vehicle.maintenance || [];
      const legacyRecords = (vehicle._doc && vehicle._doc.maintenanceHistory) || vehicle.maintenanceHistory || [];
      
      const allMaintenance = [...records];
      legacyRecords.forEach(l => {
        if (!allMaintenance.some(m => m._id?.toString() === l._id?.toString())) {
          allMaintenance.push(l);
        }
      });

      for (const record of allMaintenance) {
        const maintDate = new Date(record.lastServicingDate || record.date);
        if (maintDate >= startOfDayUTC && maintDate <= endOfDayUTC) {
          const cost = Number(record.serviceCost || record.cost) || 0;
          if (cost > 0) {
            totalMaintenance += cost;
            
            vehicleTransactions.push({
              isMaintenance: true,
              _id: record._id || `maint-${Date.now()}-${Math.random()}`,
              vehicleName: `${vehicle.companyName || ''} ${vehicle.name || ''}`.trim(),
              vehicleNo: vehicle.vehicleNo,
              vehicleCategory: vehicle.category,
              serviceType: record.serviceType || record.type || 'Maintenance',
              serviceCenter: record.serviceCenter || record.serviceProvider || 'Local Shop',
              notes: record.notes || record.description || 'Maintenance cost',
              dayPayments: 0,
              dayRefunds: cost,
              dayCashOut: cost, 
              dayOnlineOut: 0,
              dayNet: -cost,
              lastServicingDate: record.lastServicingDate || record.date
            });
          }
        }
      }
    }

    totalOut += totalMaintenance;
    totalCashOut += totalMaintenance;

    vehicleTransactions.sort((a, b) => {
      if (a.isNewBooking && !b.isNewBooking) return -1;
      if (!a.isNewBooking && b.isNewBooking) return 1;
      if (a.isMaintenance && !b.isMaintenance) return 1;
      if (!a.isMaintenance && b.isMaintenance) return -1;
      const dateA = a.bookingDate || a.lastServicingDate || a.time || a.createdAt;
      const dateB = b.bookingDate || b.lastServicingDate || b.time || b.createdAt;
      return new Date(dateB) - new Date(dateA);
    });

    res.status(200).json({
      success: true,
      date,
      summary: {
        totalIn,
        totalCashIn,
        totalOnlineIn,
        totalOut,
        totalCashOut,
        totalOnlineOut,
        collectFromWorker: totalCashIn - totalCashOut,
        totalNewBookings,
        totalSubmittedBookings,
        totalTransactions: vehicleTransactions.length
      },
      transactions: vehicleTransactions
    });
  } catch (error) {
    console.error('Error getting worker daily hisab:', error);
    res.status(500).json({ success: false, message: 'Failed to get daily hisab', error: error.message });
  }
};

// =====================================================================
// Revenue Analytics for worker's zone
// =====================================================================
const getWorkerRevenueAnalytics = async (req, res) => {
  try {
    const workerId = req.user._id || req.user.id;
    const { startDate, endDate, period = 'all' } = req.query;

    const worker = await User.findById(workerId).select('workerProfile');
    if (!worker?.workerProfile) {
      return res.status(403).json({ success: false, message: 'Worker profile not found' });
    }

    const { sellerId, zoneCode } = worker.workerProfile;

    const zoneVehicles = await Vehicle.find({ sellerId, zoneCode }).select('_id');
    const vehicleIds = zoneVehicles.map(v => v._id);

    if (vehicleIds.length === 0) {
      return res.json({
        success: true,
        data: {
          totalRevenue: 0, cashRevenue: 0, onlineRevenue: 0, totalRefunds: 0,
          maintenanceCosts: 0, netRevenue: 0, totalBookings: 0,
          paymentTypeBreakdown: {}, dailyBreakdown: [], vehicleWiseRevenue: [], bookingsList: []
        }
      });
    }

    const now = new Date();
    let start, end;

    if (period === 'today') {
      start = new Date(now); start.setHours(0, 0, 0, 0);
      end = new Date(now); end.setHours(23, 59, 59, 999);
    } else if (period === 'week') {
      start = new Date(now); start.setDate(now.getDate() - 7); start.setHours(0, 0, 0, 0);
      end = new Date(now); end.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      start = new Date(now); start.setDate(1); start.setHours(0, 0, 0, 0);
      end = new Date(now); end.setHours(23, 59, 59, 999);
    } else if (period === 'custom' && startDate && endDate) {
      start = new Date(startDate); start.setHours(0, 0, 0, 0);
      end = new Date(endDate); end.setHours(23, 59, 59, 999);
    } else {
      start = new Date(0); end = new Date(now.getFullYear() + 10, 11, 31);
    }

    const bookingsQuery = {
      vehicleId: { $in: vehicleIds },
      $or: [
        { 'payments.paymentDate': { $gte: start, $lte: end } },
        { 'refundDetails.processedDate': { $gte: start, $lte: end } }
      ]
    };

    const bookings = await VehicleBooking.find(bookingsQuery)
      .populate('vehicleId', 'companyName name vehicleNo');

    const ledger = {};
    if (period !== 'all') {
      let curr = new Date(start);
      while (curr <= end) {
        const dStr = curr.toISOString().split('T')[0];
        ledger[dStr] = { date: dStr, cashIn: 0, onlineIn: 0, totalIn: 0, refunds: 0, maintenance: 0, moneyOut: 0, net: 0, transactions: 0 };
        curr.setDate(curr.getDate() + 1);
      }
    }

    let analytics = {
      totalRevenue: 0, cashRevenue: 0, onlineRevenue: 0, totalRefunds: 0,
      maintenanceCosts: 0, netRevenue: 0, totalBookings: 0,
      paymentTypeBreakdown: {}, refundReasons: {}, vehicleWiseRevenue: {}, bookingsList: []
    };

    let countedBookings = new Set();

    bookings.forEach(booking => {
      let bookingInPeriodActivity = false;
      const vehicleName = booking.vehicleId ? `${booking.vehicleId.companyName || ''} ${booking.vehicleId.name || ''}`.trim() : 'Unknown Vehicle';
      
      let bookingDataForList = {
        bookingId: booking.bookingId,
        vehicleName: vehicleName,
        registrationNumber: booking.vehicleId?.vehicleNo || 'N/A',
        customerName: booking.customerDetails?.name || booking.userId?.name || 'Customer',
        cashAmount: 0, onlineAmount: 0, totalAmount: 0, refundAmount: 0,
        paymentStatus: booking.paymentStatus, bookingDate: booking.bookingDate
      };

      if (booking.payments && booking.payments.length > 0) {
        booking.payments.forEach(payment => {
          if (payment.status === 'success' && payment.paymentDate >= start && payment.paymentDate <= end) {
            bookingInPeriodActivity = true;
            const dateStr = new Date(payment.paymentDate).toISOString().split('T')[0];
            if (!ledger[dateStr]) ledger[dateStr] = { date: dateStr, cashIn: 0, onlineIn: 0, totalIn: 0, refunds: 0, maintenance: 0, moneyOut: 0, net: 0, transactions: 0 };
            
            const amount = payment.amount;
            const isCash = (payment.paymentType || '').toLowerCase() === 'cash' || (payment.paymentMethod || '').toLowerCase() === 'cash';
            
            if (isCash) {
              ledger[dateStr].cashIn += amount; analytics.cashRevenue += amount; bookingDataForList.cashAmount += amount;
            } else {
              ledger[dateStr].onlineIn += amount; analytics.onlineRevenue += amount; bookingDataForList.onlineAmount += amount;
            }
            bookingDataForList.totalAmount += amount;
            ledger[dateStr].totalIn += amount; ledger[dateStr].net += amount; ledger[dateStr].transactions++;
            analytics.totalRevenue += amount;

            const pType = payment.paymentType || 'Other';
            if (!analytics.paymentTypeBreakdown[pType]) analytics.paymentTypeBreakdown[pType] = { amount: 0, count: 0 };
            analytics.paymentTypeBreakdown[pType].amount += amount;
            analytics.paymentTypeBreakdown[pType].count++;
          }
        });
      }

      if (booking.refundDetails && booking.refundDetails.processedDate >= start && booking.refundDetails.processedDate <= end) {
        bookingInPeriodActivity = true;
        const dateStr = new Date(booking.refundDetails.processedDate).toISOString().split('T')[0];
        if (!ledger[dateStr]) ledger[dateStr] = { date: dateStr, cashIn: 0, onlineIn: 0, totalIn: 0, refunds: 0, maintenance: 0, moneyOut: 0, net: 0, transactions: 0 };

        const refundAmt = booking.refundDetails.approvedAmount || 0;
        ledger[dateStr].refunds += refundAmt; ledger[dateStr].moneyOut += refundAmt; ledger[dateStr].net -= refundAmt;
        analytics.totalRefunds += refundAmt; bookingDataForList.refundAmount += refundAmt;

        const reason = booking.refundDetails.reason || 'other';
        if (!analytics.refundReasons[reason]) analytics.refundReasons[reason] = { amount: 0, count: 0 };
        analytics.refundReasons[reason].amount += refundAmt; analytics.refundReasons[reason].count++;
      }

      if (bookingInPeriodActivity) {
        analytics.bookingsList.push(bookingDataForList);
        countedBookings.add(booking._id.toString());
        const vId = booking.vehicleId?._id?.toString();
        if (vId) {
          if (!analytics.vehicleWiseRevenue[vId]) {
            analytics.vehicleWiseRevenue[vId] = {
              vehicleName: vehicleName, registrationNumber: booking.vehicleId.vehicleNo,
              revenue: 0, bookings: 0
            };
          }
          analytics.vehicleWiseRevenue[vId].revenue += (bookingDataForList.cashAmount + bookingDataForList.onlineAmount);
          analytics.vehicleWiseRevenue[vId].bookings++;
        }
      }
    });

    analytics.totalBookings = countedBookings.size;

    analytics.netRevenue = analytics.totalRevenue - analytics.totalRefunds - analytics.maintenanceCosts;
    analytics.dailyBreakdown = Object.values(ledger).sort((a, b) => a.date.localeCompare(b.date));
    analytics.vehicleWiseRevenue = Object.values(analytics.vehicleWiseRevenue).sort((a, b) => b.revenue - a.revenue);
    analytics.bookingsList.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));

    return res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error fetching worker revenue analytics:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch revenue analytics', error: error.message });
  }
};

const getWorkerMonthlyRevenue = async (req, res) => {
  try {
    const workerId = req.user._id || req.user.id;
    const { months = 6 } = req.query;

    const worker = await User.findById(workerId).select('workerProfile');
    if (!worker?.workerProfile) {
      return res.status(403).json({ success: false, message: 'Worker profile not found' });
    }

    const { sellerId, zoneCode } = worker.workerProfile;

    const zoneVehicles = await Vehicle.find({ sellerId, zoneCode }).select('_id');
    const vehicleIds = zoneVehicles.map(v => v._id);

    const monthlyData = [];
    const now = new Date();

    for (let i = parseInt(months) - 1; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

      const bookings = await VehicleBooking.find({
        vehicleId: { $in: vehicleIds },
        bookingDate: { $gte: monthDate, $lt: nextMonth }
      });

      let monthRevenue = {
        month: monthDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
        totalRevenue: 0, cashRevenue: 0, onlineRevenue: 0, refunds: 0, netRevenue: 0, bookings: bookings.length
      };

      bookings.forEach(booking => {
        if (booking.payments) {
          booking.payments.forEach(payment => {
            if (payment.status === 'success') {
                const amount = payment.amount || 0;
                monthRevenue.totalRevenue += amount;
                const isCash = (payment.paymentType || '').toLowerCase() === 'cash' || (payment.paymentMethod || '').toLowerCase() === 'cash';
                if (isCash) monthRevenue.cashRevenue += amount;
                else monthRevenue.onlineRevenue += amount;
              }
          });
        }
        if (booking.paymentStatus === 'refunded' && booking.refundDetails?.approvedAmount) {
          monthRevenue.refunds += booking.refundDetails.approvedAmount;
        }
      });

      monthRevenue.netRevenue = monthRevenue.totalRevenue - monthRevenue.refunds;
      monthlyData.push(monthRevenue);
    }

    res.json({ success: true, data: monthlyData });
  } catch (error) {
    console.error('Error fetching worker monthly comparison:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch monthly comparison', error: error.message });
  }
};

// ===== MAINTENANCE HISTORY =====

const getVehicleMaintenanceHistory = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const workerId = req.user.id;

    // Verify worker has access to this vehicle's zone
    const worker = await User.findById(workerId).select('workerProfile');
    if (!worker?.workerProfile) {
      return res.status(403).json({ success: false, message: 'Worker profile not found' });
    }

    const { sellerId, zoneCode } = worker.workerProfile;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, sellerId, zoneCode });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found in your zone' });
    }

    res.json({ 
      success: true, 
      data: { maintenance: vehicle.maintenance || [] } 
    });
  } catch (error) {
    console.error('Error fetching maintenance history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch maintenance history', error: error.message });
  }
};

const addVehicleMaintenance = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const maintenanceData = req.body;
    const workerId = req.user.id;

    // Verify worker has access to this vehicle's zone
    const worker = await User.findById(workerId).select('workerProfile');
    if (!worker?.workerProfile) {
      return res.status(403).json({ success: false, message: 'Worker profile not found' });
    }

    const { sellerId, zoneCode } = worker.workerProfile;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, sellerId, zoneCode });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found in your zone' });
    }

    // Add new maintenance record
    const newRecord = {
      lastServicingDate: maintenanceData.lastServicingDate || new Date(),
      nextDueDate: maintenanceData.nextDueDate,
      serviceType: maintenanceData.serviceType || 'general-service',
      serviceCost: Number(maintenanceData.serviceCost) || 0,
      serviceCenter: maintenanceData.serviceCenter || 'Local Service Center',
      notes: maintenanceData.notes || '',
      isCompleted: maintenanceData.isCompleted !== undefined ? maintenanceData.isCompleted : true,
      createdAt: new Date()
    };

    if (!vehicle.maintenance) vehicle.maintenance = [];
    vehicle.maintenance.push(newRecord);

    // Auto-update vehicle status if it was in-maintenance and this is completed
    if (newRecord.isCompleted && vehicle.status === 'in-maintenance') {
      vehicle.status = 'active';
    }

    await vehicle.save();

    res.status(201).json({ 
      success: true, 
      message: 'Maintenance record added successfully', 
      data: vehicle.maintenance[vehicle.maintenance.length - 1] 
    });
  } catch (error) {
    console.error('Error adding maintenance record:', error);
    res.status(500).json({ success: false, message: 'Failed to add maintenance record', error: error.message });
  }
};

const deleteVehicleMaintenance = async (req, res) => {
  try {
    const { vehicleId, maintenanceId } = req.params;
    const workerId = req.user.id;

    // Verify worker has access to this vehicle's zone
    const worker = await User.findById(workerId).select('workerProfile');
    if (!worker?.workerProfile) {
      return res.status(403).json({ success: false, message: 'Worker profile not found' });
    }

    const { sellerId, zoneCode } = worker.workerProfile;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, sellerId, zoneCode });
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found in your zone' });
    }

    // Filter out the record
    const initialLength = vehicle.maintenance.length;
    vehicle.maintenance = vehicle.maintenance.filter(m => m._id.toString() !== maintenanceId);

    if (vehicle.maintenance.length === initialLength) {
      return res.status(404).json({ success: false, message: 'Maintenance record not found' });
    }

    await vehicle.save();

    res.json({ success: true, message: 'Maintenance record deleted successfully' });
  } catch (error) {
    console.error('Error deleting maintenance record:', error);
    res.status(500).json({ success: false, message: 'Failed to delete maintenance record', error: error.message });
  }
};

const updateWorkerBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const updateData = req.body;
    const workerId = req.user.id;

    // Find booking and verify worker's zone access
    const mongoose = require('mongoose');
    let booking;
    if (mongoose.Types.ObjectId.isValid(bookingId)) {
      booking = await VehicleBooking.findById(bookingId).populate('vehicleId');
    }
    if (!booking) {
      booking = await VehicleBooking.findOne({ bookingId }).populate('vehicleId');
    }
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Update customer details
    if (updateData.customerDetails) {
      booking.customerDetails = booking.customerDetails || {};
      if (updateData.customerDetails.name !== undefined) booking.customerDetails.name = updateData.customerDetails.name;
      if (updateData.customerDetails.phone !== undefined) booking.customerDetails.phone = updateData.customerDetails.phone;
      if (updateData.customerDetails.alternativeNumber !== undefined) booking.customerDetails.alternativeNumber = updateData.customerDetails.alternativeNumber;
      if (updateData.customerDetails.fatherName !== undefined) booking.customerDetails.fatherName = updateData.customerDetails.fatherName;
      if (updateData.customerDetails.email !== undefined) booking.customerDetails.email = updateData.customerDetails.email;
      if (updateData.customerDetails.drivingLicenseNumber !== undefined) {
        booking.customerDetails.drivingLicense = booking.customerDetails.drivingLicense || {};
        booking.customerDetails.drivingLicense.number = updateData.customerDetails.drivingLicenseNumber;
      }
    }

    // Start meter reading
    if (updateData.startMeterReading !== undefined && updateData.startMeterReading !== '') {
      booking.vehicleHandover = booking.vehicleHandover || {};
      booking.vehicleHandover.startMeterReading = Number(updateData.startMeterReading);
    }

    // Deposit
    if (updateData.depositAmount !== undefined && updateData.depositAmount !== '') {
      booking.depositAmount = Number(updateData.depositAmount);
    }
    if (updateData.depositStatus !== undefined) {
      const oldStatus = booking.depositStatus;
      booking.depositStatus = updateData.depositStatus;
      
      // If status changed to collected, record it in payments if not already there
      const isCollected = ['collected-online', 'collected-at-pickup'].includes(updateData.depositStatus);
      const wasCollected = ['collected-online', 'collected-at-pickup'].includes(oldStatus);
      
      if (isCollected && !wasCollected) {
        booking.payments = booking.payments || [];
        booking.payments.push({
          amount: booking.depositAmount,
          paymentType: updateData.depositStatus === 'collected-online' ? 'UPI' : 'Cash',
          paymentMethod: updateData.depositStatus === 'collected-online' ? 'Manual' : 'Cash',
          status: 'success',
          paymentDate: new Date(),
          notes: 'Security deposit collected by worker'
        });
        
        // Update paidAmount
        booking.paidAmount = (booking.payments || []).reduce((sum, p) => {
          if (p.status === 'success') return sum + (parseFloat(p.amount) || 0);
          return sum;
        }, 0);
      }
    }

    // Notes
    if (updateData.notes !== undefined) booking.notes = updateData.notes;
    if (updateData.specialRequests !== undefined) booking.specialRequests = updateData.specialRequests;

    booking.statusHistory.push({
      status: booking.bookingStatus,
      updatedBy: workerId,
      updatedAt: new Date(),
      notes: 'Booking details updated by worker'
    });

    await booking.save();

    res.json({ success: true, message: 'Booking details updated successfully', data: booking });
  } catch (error) {
    console.error('Error updating worker booking details:', error);
    res.status(500).json({ success: false, message: 'Failed to update booking details', error: error.message });
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
  updateWorkerBookingDetails,
  createWorkerExtension,
  getWorkerDailyHisab,
  getWorkerReports,
  addWorkerBookingNote,
  getWorkerBookingById,
  getWorkerRevenueAnalytics,
  getWorkerMonthlyRevenue,
  getVehicleMaintenanceHistory,
  addVehicleMaintenance,
  deleteVehicleMaintenance
};
