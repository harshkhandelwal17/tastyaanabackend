const Vehicle = require("../../models/Vehicle");
const VehicleBooking = require("../../models/VehicleBooking");
const User = require("../../models/User");

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
exports.getWorkerBookings = async (req, res) => {
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
exports.getWorkerBookingById = async (req, res) => {
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
exports.getWorkerHandoverBookings = async (req, res) => {
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
exports.processWorkerHandover = async (req, res) => {
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
exports.createWorkerOfflineBooking = async (req, res) => {
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
exports.updateWorkerBookingStatus = async (req, res) => {
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
exports.getWorkerReports = async (req, res) => {
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
exports.addWorkerBookingNote = async (req, res) => {
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
