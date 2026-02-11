const Vehicle = require('../../models/Vehicle');
const VehicleBooking = require('../../models/VehicleBooking');
const VehicleRefund = require('../../models/VehicleRefund');
const User = require('../../models/User');
const { cloudinary } = require('../../config/cloudinary');

// ===== SELLER DASHBOARD ANALYTICS =====

// Get seller dashboard statistics
const getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Get seller's vehicles and their maintenance
    const vehicles = await Vehicle.find({ sellerId: sellerId });
    const vehicleIds = vehicles.map(v => v._id);

    // Get all bookings for these vehicles (needed for all-time stats)
    const bookings = await VehicleBooking.find({ vehicleId: { $in: vehicleIds } })
      .populate('vehicleId', 'vehicleName registrationNumber brand model images status');

    // Date markers
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Stats initialization
    let totalRevenue = 0;
    let monthlyRevenue = 0;
    let dailyCashRevenue = 0;
    let dailyOnlineRevenue = 0;
    let dailyCashBookings = 0;
    let dailyOnlineBookings = 0;
    
    // Payment IN/OUT tracking
    let paymentInCash = 0;
    let paymentInOnline = 0;
    let paymentOutCash = 0;
    let paymentOutOnline = 0;
    
    // Today's tracking
    let todayCashIn = 0;
    let todayOnlineIn = 0;
    let todayCashOut = 0;
    let todayOnlineOut = 0;

    let totalRefunds = 0;
    let totalMaintenance = 0;

    // Process Bookings
    bookings.forEach(booking => {
      // Payments
      if (booking.payments && booking.payments.length > 0) {
        booking.payments.forEach(payment => {
          if (payment.status === 'success') {
            const amt = payment.amount || 0;
            const pDate = new Date(payment.paymentDate || payment.transactionDate || payment.receivedAt || booking.bookingDate);

            totalRevenue += amt;

            // Track payment IN by type
            if (payment.paymentType === 'Cash') {
              paymentInCash += amt;
            } else {
              paymentInOnline += amt;
            }

            if (pDate >= monthStart) {
              monthlyRevenue += amt;
            }

            if (pDate >= todayStart && pDate < tomorrowStart) {
              if (payment.paymentType === 'Cash') {
                dailyCashRevenue += amt;
                dailyCashBookings++;
                todayCashIn += amt;
              } else {
                dailyOnlineRevenue += amt;
                dailyOnlineBookings++;
                todayOnlineIn += amt;
              }
            }
          }
        });
      }

      // Refunds (these are payment OUT)
      if (booking.refundDetails && booking.refundDetails.processedDate) {
        const refundAmt = booking.refundDetails.approvedAmount || 0;
        totalRefunds += refundAmt;
        const rDate = new Date(booking.refundDetails.processedDate);
        
        // Track refund as payment OUT
        if (booking.refundDetails.refundMethod === 'cash') {
          paymentOutCash += refundAmt;
          if (rDate >= todayStart && rDate < tomorrowStart) {
            todayCashOut += refundAmt;
          }
        } else {
          paymentOutOnline += refundAmt;
          if (rDate >= todayStart && rDate < tomorrowStart) {
            todayOnlineOut += refundAmt;
          }
        }
        
        if (rDate >= monthStart) {
          monthlyRevenue -= refundAmt;
        }
      }
    });

    // Maintenance Costs (these are payment OUT)
    vehicles.forEach(vehicle => {
      if (vehicle.maintenance && vehicle.maintenance.length > 0) {
        vehicle.maintenance.forEach(m => {
          if (m.isCompleted) {
            const cost = m.serviceCost || 0;
            totalMaintenance += cost;
            const mDate = new Date(m.lastServicingDate);
            
            // Track maintenance as payment OUT (assume cash for now)
            paymentOutCash += cost;
            if (mDate >= todayStart && mDate < tomorrowStart) {
              todayCashOut += cost;
            }
            
            if (mDate >= monthStart) {
              monthlyRevenue -= cost;
            }
          }
        });
      }
    });

    const netTotalRevenue = totalRevenue - totalRefunds - totalMaintenance;

    // Recent bookings (keep existing limit and sort)
    const recentBookings = [...bookings]
      .sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate))
      .slice(0, 5);

    // Vehicle performance
    const vehicleStats = vehicles.map(vehicle => {
      const vBookings = bookings.filter(b => b.vehicleId._id.toString() === vehicle._id.toString());
      let vRevenue = 0;
      vBookings.forEach(b => {
        if (b.payments) {
          b.payments.forEach(p => {
            if (p.status === 'success') vRevenue += (p.amount || 0);
          });
        }
        if (b.refundDetails && b.refundDetails.approvedAmount) {
          vRevenue -= b.refundDetails.approvedAmount;
        }
      });

      return {
        vehicle: {
          _id: vehicle._id,
          brand: vehicle.brand,
          model: vehicle.model,
          images: vehicle.images,
          status: vehicle.status
        },
        totalBookings: vBookings.length,
        revenue: vRevenue,
        utilization: vBookings.length > 0 ? Math.min((vBookings.length / 30) * 100, 100) : 0
      };
    });

    res.json({
      success: true,
      data: {
        overview: {
          totalVehicles: vehicles.length,
          activeVehicles: vehicles.filter(v => v.status === 'active').length,
          totalBookings: bookings.length,
          activeBookings: bookings.filter(b => ['confirmed', 'ongoing'].includes(b.bookingStatus || b.status)).length,
          totalRevenue: netTotalRevenue,
          monthlyRevenue: monthlyRevenue,
          dailyCashRevenue,
          dailyCashBookings,
          dailyOnlineRevenue,
          dailyOnlineBookings,
          // Payment IN/OUT/Balance
          paymentIn: {
            cash: paymentInCash,
            online: paymentInOnline,
            total: paymentInCash + paymentInOnline
          },
          paymentOut: {
            cash: paymentOutCash,
            online: paymentOutOnline,
            total: paymentOutCash + paymentOutOnline
          },
          paymentRemaining: {
            cash: paymentInCash - paymentOutCash,
            online: paymentInOnline - paymentOutOnline,
            total: (paymentInCash + paymentInOnline) - (paymentOutCash + paymentOutOnline)
          },
          // Today's IN/OUT
          todayPaymentIn: {
            cash: todayCashIn,
            online: todayOnlineIn,
            total: todayCashIn + todayOnlineIn
          },
          todayPaymentOut: {
            cash: todayCashOut,
            online: todayOnlineOut,
            total: todayCashOut + todayOnlineOut
          }
        },
        recentBookings: recentBookings.map(booking => ({
          _id: booking._id,
          bookingId: booking.bookingId,
          vehicle: booking.vehicleId,
          customer: booking.customerDetails,
          startDate: booking.startDateTime,
          endDate: booking.endDateTime,
          totalAmount: (booking.payments || []).reduce((s, p) => p.status === 'success' ? s + p.amount : s, 0),
          status: booking.bookingStatus || booking.status,
          paymentStatus: booking.paymentStatus
        })),
        vehicleStats: vehicleStats.sort((a, b) => b.revenue - a.revenue)
      }
    });

  } catch (error) {
    console.error('Error fetching seller dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};

// ===== VEHICLE MANAGEMENT =====

// Get seller's vehicles
const getSellerVehicles = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const {
      page = 1,
      limit = 12,
      search,
      status,
      category,
      availability,
      zone,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    console.log(`🔍 Seller ${sellerId} fetching vehicles with filters:`, {
      page, limit, search, status, category, availability, zone, sortBy, sortOrder
    });

    const filter = { sellerId: sellerId }; // Changed from 'seller' to 'sellerId'

    // Add search filter - search by vehicle name, company, vehicle number, or color
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

    // Note: We'll filter by booking status (reserved/available/pre-booked) after enhancing vehicles
    // because it's calculated from bookings, not stored in vehicle model
    const bookingStatusFilter = availability && availability !== 'all' ? availability : null;

    // Add category filter
    if (category && category !== 'all') {
      filter.category = category;
    }

    // Add zone filter
    if (zone) {
      filter.$or = [
        ...(filter.$or || []),
        { zoneCenterName: { $regex: zone, $options: 'i' } },
        { zoneCode: { $regex: zone, $options: 'i' } }
      ];
    }

    console.log(`📋 Query filter:`, filter);

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
        // Find current active booking (ongoing)
        const activeBooking = await VehicleBooking.findOne({
          vehicleId: vehicle._id,
          bookingStatus: 'ongoing',
          startDateTime: { $lte: now },
          endDateTime: { $gte: now }
        }).select('bookingId startDateTime endDateTime userId');

        // Find overdue booking (not completed but end time has passed)
        const overdueBooking = await VehicleBooking.findOne({
          vehicleId: vehicle._id,
          bookingStatus: { $in: ['confirmed', 'ongoing'] },
          endDateTime: { $lt: now }
        }).select('bookingId startDateTime endDateTime userId');

        // Find if vehicle is returned early (completed before endDateTime)
        const completedBooking = await VehicleBooking.findOne({
          vehicleId: vehicle._id,
          bookingStatus: 'completed',
          'vehicleReturn.submitted': true,
          'vehicleReturn.vehicleAvailableAgain': true
        }).select('bookingId endDateTime vehicleReturn.returnTime');

        // Find future bookings (pre-booked)
        const futureBooking = await VehicleBooking.findOne({
          vehicleId: vehicle._id,
          bookingStatus: { $in: ['confirmed', 'pending'] },
          startDateTime: { $gt: now }
        }).sort({ startDateTime: 1 }).select('bookingId startDateTime endDateTime');

        let bookingStatus = 'available';
        let bookingInfo = null;
        let isOverdue = false;

        if (overdueBooking) {
          // Vehicle is overdue (end time passed but not completed)
          bookingStatus = 'reserved';
          isOverdue = true;
          const overdueHours = Math.floor((now - overdueBooking.endDateTime) / (1000 * 60 * 60));
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
      console.log(`🔍 Filtered to ${filteredVehicles.length} vehicles with booking status: ${bookingStatusFilter}`);
    }

    // Calculate category counts from ALL vehicles matching filter (not just paginated)
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

    console.log(`✅ Found ${filteredVehicles.length} vehicles out of ${totalVehicles} total for seller ${sellerId}`);
    console.log(`📊 Counts:`, counts);

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
    console.error('❌ Error fetching seller vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicles',
      error: error.message
    });
  }
};

// Create new vehicle
const createVehicle = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const vehicleData = {
      ...req.body,
      sellerId: sellerId
    };

    // Handle image uploads
    if (req.files && req.files.length > 0) {
      const imageUrls = req.files.map(file => file.path);
      vehicleData.images = imageUrls;
    }

    // Parse JSON fields if they're strings
    if (typeof vehicleData.features === 'string') {
      vehicleData.features = JSON.parse(vehicleData.features);
    }
    if (typeof vehicleData.pricing === 'string') {
      vehicleData.pricing = JSON.parse(vehicleData.pricing);
    }
    if (typeof vehicleData.location === 'string') {
      vehicleData.location = JSON.parse(vehicleData.location);
    }
    
    // Parse rate plan objects
    if (typeof vehicleData.rate12hr === 'string') {
      vehicleData.rate12hr = JSON.parse(vehicleData.rate12hr);
    }
    if (typeof vehicleData.rate24hr === 'string') {
      vehicleData.rate24hr = JSON.parse(vehicleData.rate24hr);
    }
    if (typeof vehicleData.rateHourly === 'string') {
      vehicleData.rateHourly = JSON.parse(vehicleData.rateHourly);
    }
    if (typeof vehicleData.rateDaily === 'string') {
      vehicleData.rateDaily = JSON.parse(vehicleData.rateDaily);
    }
    
    // Parse array fields
    if (typeof vehicleData.vehicleFeatures === 'string') {
      vehicleData.vehicleFeatures = JSON.parse(vehicleData.vehicleFeatures);
    }
    if (typeof vehicleData.maintenance === 'string') {
      vehicleData.maintenance = JSON.parse(vehicleData.maintenance);
    }
    if (typeof vehicleData.damageReports === 'string') {
      vehicleData.damageReports = JSON.parse(vehicleData.damageReports);
    }
    if (typeof vehicleData.locationGeo === 'string') {
      vehicleData.locationGeo = JSON.parse(vehicleData.locationGeo);
    }

    const vehicle = new Vehicle(vehicleData);
    await vehicle.save();

    // Populate seller details
    await vehicle.populate('sellerId', 'name phone email businessName');

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: vehicle
    });

  } catch (error) {
    console.error('Error creating vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create vehicle',
      error: error.message
    });
  }
};

// Update vehicle
const updateVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const sellerId = req.user.id;

    // Check if vehicle belongs to seller
    const vehicle = await Vehicle.findOne({ _id: vehicleId, sellerId: sellerId });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or access denied'
      });
    }

    const updateData = { ...req.body };

    // Handle new image uploads
    if (req.files && req.files.length > 0) {
      const newImageUrls = req.files.map(file => file.path);
      updateData.images = [...(vehicle.images || []), ...newImageUrls];
    }

    // Parse JSON fields if they're strings
    if (typeof updateData.features === 'string') {
      updateData.features = JSON.parse(updateData.features);
    }
    if (typeof updateData.pricing === 'string') {
      updateData.pricing = JSON.parse(updateData.pricing);
    }
    if (typeof updateData.location === 'string') {
      updateData.location = JSON.parse(updateData.location);
    }
    
    // Parse rate plan objects
    if (typeof updateData.rate12hr === 'string') {
      updateData.rate12hr = JSON.parse(updateData.rate12hr);
    }
    if (typeof updateData.rate24hr === 'string') {
      updateData.rate24hr = JSON.parse(updateData.rate24hr);
    }
    if (typeof updateData.rateHourly === 'string') {
      updateData.rateHourly = JSON.parse(updateData.rateHourly);
    }
    if (typeof updateData.rateDaily === 'string') {
      updateData.rateDaily = JSON.parse(updateData.rateDaily);
    }
    
    // Parse array fields
    if (typeof updateData.vehicleFeatures === 'string') {
      updateData.vehicleFeatures = JSON.parse(updateData.vehicleFeatures);
    }
    if (typeof updateData.maintenance === 'string') {
      updateData.maintenance = JSON.parse(updateData.maintenance);
    }
    if (typeof updateData.damageReports === 'string') {
      updateData.damageReports = JSON.parse(updateData.damageReports);
    }
    if (typeof updateData.locationGeo === 'string') {
      updateData.locationGeo = JSON.parse(updateData.locationGeo);
    }
    
    // Handle null values that got stringified to "null"
    if (updateData.currentBookingId === 'null' || updateData.currentBookingId === '') {
      updateData.currentBookingId = null;
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      vehicleId,
      updateData,
      { new: true, runValidators: true }
    ).populate('sellerId', 'name phone email businessName');

    res.json({
      success: true,
      message: 'Vehicle updated successfully',
      data: updatedVehicle
    });

  } catch (error) {
    console.error('Error updating vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle',
      error: error.message
    });
  }
};

// Delete vehicle
const deleteVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const sellerId = req.user.id;

    // Check if vehicle belongs to seller
    const vehicle = await Vehicle.findOne({ _id: vehicleId, sellerId: sellerId });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or access denied'
      });
    }

    // Check if vehicle has active bookings
    const activeBookings = await VehicleBooking.find({
      vehicleId: vehicleId, // Changed from 'vehicle' to 'vehicleId'
      bookingStatus: { $in: ['confirmed', 'ongoing'] } // Use bookingStatus field
    });

    if (activeBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete vehicle with active bookings'
      });
    }

    // Delete images from cloudinary
    if (vehicle.images && vehicle.images.length > 0) {
      for (const imageUrl of vehicle.images) {
        try {
          const publicId = imageUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`vehicles/${publicId}`);
        } catch (imgError) {
          console.warn('Failed to delete image:', imgError);
        }
      }
    }

    await Vehicle.findByIdAndDelete(vehicleId);

    res.json({
      success: true,
      message: 'Vehicle deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete vehicle',
      error: error.message
    });
  }
};

// Toggle vehicle availability
const toggleVehicleAvailability = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const sellerId = req.user.id;

    const vehicle = await Vehicle.findOne({ _id: vehicleId, sellerId: sellerId });
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found or access denied'
      });
    }

    vehicle.status = vehicle.status === 'active' ? 'inactive' : 'active';
    await vehicle.save();

    res.json({
      success: true,
      message: `Vehicle ${vehicle.status === 'active' ? 'activated' : 'deactivated'} successfully`,
      data: { status: vehicle.status }
    });

  } catch (error) {
    console.error('Error toggling vehicle availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update vehicle status',
      error: error.message
    });
  }
};

// ===== BOOKING MANAGEMENT =====

// Get seller's bookings
const getSellerBookings = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const {
      page = 1,
      limit = 20,
      status,
      search,
      dateFrom,
      dateTo,
      startDate,
      endDate,
      zone,
      sortBy = 'bookingDate',
      sortOrder = 'desc'
    } = req.query;

    console.log('🔍 getSellerBookings filters:', {
      sellerId,
      status,
      search,
      zone,
      dateFrom,
      dateTo,
      startDate,
      endDate,
      page,
      limit
    });

    // Get seller's vehicles first
    const sellerVehicles = await Vehicle.find({ sellerId: sellerId }, '_id');
    const vehicleIds = sellerVehicles.map(v => v._id);

    console.log(`📋 Found ${sellerVehicles.length} vehicles owned by seller`);

    // Filter for bookings that are EITHER:
    // 1. For vehicles owned by this seller, OR
    // 2. Booked by this seller (seller-portal bookings)
    const filter = {
      $or: [
        { vehicleId: { $in: vehicleIds } },  // Vehicles owned by seller
        { bookedBy: sellerId }                // Bookings created by seller
      ]
    };

    // Add filters
    if (status) {
      if (status.includes(',')) {
        filter.bookingStatus = { $in: status.split(',') };
      } else {
        filter.bookingStatus = status;
      }
    }
    
    // Old date filters (kept for backward compatibility)
    if (dateFrom) filter.bookingDate = { $gte: new Date(dateFrom) };
    if (dateTo) {
      filter.bookingDate = filter.bookingDate || {};
      filter.bookingDate.$lte = new Date(dateTo);
    }

    // NEW: Filter by start date - bookings that START on this date (in IST)
    if (startDate) {
      const dateParts = startDate.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1;
      const day = parseInt(dateParts[2]);
      
      // IST midnight in UTC: subtract 5:30
      const startOfDayUTC = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      startOfDayUTC.setUTCHours(startOfDayUTC.getUTCHours() - 5);
      startOfDayUTC.setUTCMinutes(startOfDayUTC.getUTCMinutes() - 30);
      
      const endOfDayUTC = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
      endOfDayUTC.setUTCHours(endOfDayUTC.getUTCHours() - 5);
      endOfDayUTC.setUTCMinutes(endOfDayUTC.getUTCMinutes() - 30);
      
      filter.startDateTime = {
        $gte: startOfDayUTC,
        $lte: endOfDayUTC
      };
      
      console.log('📅 Filtering by start date (IST):', {
        inputDate: startDate,
        startOfDayUTC: startOfDayUTC.toISOString(),
        endOfDayUTC: endOfDayUTC.toISOString()
      });
    }

    // NEW: Filter by end date - bookings that END on this date (in IST)
    if (endDate) {
      const dateParts = endDate.split('-');
      const year = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1;
      const day = parseInt(dateParts[2]);
      
      const startOfDayUTC = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
      startOfDayUTC.setUTCHours(startOfDayUTC.getUTCHours() - 5);
      startOfDayUTC.setUTCMinutes(startOfDayUTC.getUTCMinutes() - 30);
      
      const endOfDayUTC = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
      endOfDayUTC.setUTCHours(endOfDayUTC.getUTCHours() - 5);
      endOfDayUTC.setUTCMinutes(endOfDayUTC.getUTCMinutes() - 30);
      
      filter.endDateTime = {
        $gte: startOfDayUTC,
        $lte: endOfDayUTC
      };
      
      console.log('📅 Filtering by end date (IST):', {
        inputDate: endDate,
        startOfDayUTC: startOfDayUTC.toISOString(),
        endOfDayUTC: endOfDayUTC.toISOString()
      });
    }

    // Search filter - search by booking ID, vehicle name, vehicle number, customer name, or customer phone
    if (search) {
      const searchLower = search.toLowerCase();
      
      // First, find vehicles that match the search (by name or vehicle number)
      const Vehicle = require('../../models/Vehicle');
      const matchingVehicles = await Vehicle.find({
        sellerId: sellerId,
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { companyName: { $regex: search, $options: 'i' } },
          { vehicleNo: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      
      const matchingVehicleIds = matchingVehicles.map(v => v._id);
      
      filter.$or = [
        { bookingId: { $regex: search, $options: 'i' } },
        // Customer details search
        { 'customerDetails.name': { $regex: search, $options: 'i' } },
        { 'customerDetails.phone': { $regex: search, $options: 'i' } },
        // Vehicle ID search (from matching vehicles)
        ...(matchingVehicleIds.length > 0 ? [{ vehicleId: { $in: matchingVehicleIds } }] : [])
      ];
    }

    // Zone filter - filter by vehicle's zone
    if (zone) {
      const Vehicle = require('../../models/Vehicle');
      const matchingVehicles = await Vehicle.find({
        sellerId: sellerId,
        $or: [
          { zoneCode: { $regex: zone, $options: 'i' } },
          { zoneCenterName: { $regex: zone, $options: 'i' } }
        ]
      }).select('_id');
      
      const matchingVehicleIds = matchingVehicles.map(v => v._id);
      
      if (matchingVehicleIds.length > 0) {
        // If there's already a filter, we need to combine them
        if (filter.vehicleId) {
          // Combine with existing vehicleId filter
          filter.vehicleId = { 
            $in: matchingVehicleIds.filter(id => 
              vehicleIds.some(vId => vId.toString() === id.toString())
            )
          };
        } else {
          filter.vehicleId = { $in: matchingVehicleIds };
        }
      } else {
        // No vehicles match the zone filter, so no results should be returned
        filter.vehicleId = { $in: [] };
      }
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    console.log('📋 Final filter:', JSON.stringify(filter, null, 2));

    // Pagination
    const skip = (page - 1) * limit;

    const bookings = await VehicleBooking.find(filter)
      .populate('vehicleId', 'name companyName vehicleImages vehicleNo') // Fixed field names
      .populate('userId', 'name phone email') // Changed from 'customer' to 'userId'
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    console.log(`✅ Found ${bookings.length} bookings`);

    // Log booking details for debugging
    if (bookings.length > 0 && (startDate || endDate)) {
      console.log('🔍 Booking date details:');
      bookings.forEach((booking, index) => {
        console.log(`  Booking ${index + 1}:`, {
          id: booking._id,
          bookingId: booking.bookingId,
          startDateTime: booking.startDateTime?.toISOString(),
          endDateTime: booking.endDateTime?.toISOString(),
          status: booking.bookingStatus
        });
      });
    }

    const totalBookings = await VehicleBooking.countDocuments(filter);

    // Disable caching
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    res.json({
      success: true,
      data: {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalBookings / limit),
          totalItems: totalBookings
        }
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

// Update booking status
const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const {
      status,
      notes,
      meterReading,
      accessories,
      documentsStatus,
      payment
    } = req.body;
    const sellerId = req.user.id;

    // Check if booking belongs to seller's vehicle
    const booking = await VehicleBooking.findById(bookingId).populate('vehicleId');
    if (!booking || booking.vehicleId.sellerId.toString() !== sellerId) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    // Update Status
    if (status) booking.bookingStatus = status; // Use bookingStatus field
    if (notes) booking.notes = notes;

    // 1. Vehicle Tracking (Meter Reading)
    if (meterReading) {
      booking.rideTracking.push({
        timestamp: new Date(),
        kmReading: parseInt(meterReading),
        status: status === 'ongoing' ? 'picked-up' : status === 'completed' ? 'returned' : 'inspection',
        notes: notes || 'Handover update',
        recordedBy: sellerId
      });
    }

    // 2. Accessories Verification
    if (accessories) {
      booking.accessoriesChecklist = {
        ...booking.accessoriesChecklist,
        ...accessories,
        verifiedAt: new Date()
      };
    }

    // 3. Document Verification Status
    if (documentsStatus) {
      // Only updates verification flags, URLs handled separately
      if (booking.customerDetails && booking.customerDetails.drivingLicense) {
        booking.customerDetails.drivingLicense.verified = documentsStatus.license?.status === 'verified';
      }

      // Update documents array based on type validation
      // (Simplified logic: assumes documents exist)
    }

    // 4. Payment Collection
    if (payment && payment.collected > 0) {
      booking.payments.push({
        amount: parseFloat(payment.collected),
        paymentType: payment.mode === 'cash' ? 'Cash' : 'Online', // Map to enum
        paymentMethod: 'Manual',
        status: 'success',
        collectedBy: sellerId,
        paymentDate: new Date()
      });

      booking.paidAmount = (booking.paidAmount || 0) + parseFloat(payment.collected);
    }

    // Add to status history
    booking.statusHistory.push({
      status: status || booking.bookingStatus, // Use bookingStatus field
      updatedBy: sellerId,
      updatedAt: new Date(),
      notes
    });

    await booking.save();

    res.json({
      success: true,
      message: 'Booking updated successfully',
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

// Get booking details
const getBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const sellerId = req.user.id;

    const booking = await VehicleBooking.findById(bookingId)
      .populate({
        path: 'vehicleId',
        populate: {
          path: 'sellerId',
          select: 'name phone email sellerProfile.storeName'
        }
      })
      .populate('userId', 'name phone email')
      .populate('statusHistory.updatedBy', 'name');

    if (!booking || booking.vehicleId.sellerId._id.toString() !== sellerId) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
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

// Get seller profile
const getSellerProfile = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const seller = await User.findById(sellerId).select('-password');

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found'
      });
    }

    res.json({
      success: true,
      data: seller
    });
  } catch (error) {
    console.error('Error fetching seller profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller profile',
      error: error.message
    });
  }
};

// Update seller profile (zones, settings, etc.)
const updateSellerProfile = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const updateData = req.body;

    console.log('Updating seller profile for:', sellerId);
    console.log('Update data:', JSON.stringify(updateData, null, 2));

    // Find and update seller
    const seller = await User.findById(sellerId);

    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Clean and prepare update data
    if (updateData.sellerProfile) {
      // Convert to plain object to avoid Mongoose getters/setters
      const currentProfile = seller.sellerProfile.toObject();
      
      // Clean vehicleRentalService zones - remove empty workerId
      if (updateData.sellerProfile.vehicleRentalService?.serviceZones) {
        updateData.sellerProfile.vehicleRentalService.serviceZones = 
          updateData.sellerProfile.vehicleRentalService.serviceZones.map(zone => {
            const cleanedZone = { ...zone };
            
            // Remove workerId if it's empty string or undefined
            if (!cleanedZone.workerId || cleanedZone.workerId === '') {
              delete cleanedZone.workerId;
            }
            
            return cleanedZone;
          });
      }

      // Deep clean the update data - remove all undefined, null, empty values
      const cleanSellerProfile = JSON.parse(JSON.stringify(updateData.sellerProfile, (key, value) => {
        // Remove undefined, null, "undefined", "null" and empty objects
        if (value === undefined || 
            value === null || 
            value === 'undefined' || 
            value === 'null' ||
            (typeof value === 'object' && 
             value !== null &&
             !Array.isArray(value) &&
             Object.keys(value).length === 0)) {
          return undefined; // This will cause JSON.stringify to omit the property
        }
        return value;
      }));

      // Merge with existing profile
      const mergedProfile = {
        ...currentProfile,
        ...cleanSellerProfile
      };

      // Handle vehicleRentalService separately to ensure proper merging
      if (cleanSellerProfile.vehicleRentalService) {
        mergedProfile.vehicleRentalService = {
          ...currentProfile.vehicleRentalService,
          ...cleanSellerProfile.vehicleRentalService
        };
      }

      // Assign the cleaned and merged profile
      seller.sellerProfile = mergedProfile;
    }

    // Save the updated seller
    await seller.save();

    console.log('Seller profile updated successfully');

    // Return updated seller without password
    const updatedSeller = await User.findById(sellerId).select('-password');

    res.json({
      success: true,
      message: 'Seller profile updated successfully',
      data: updatedSeller
    });
  } catch (error) {
    console.error('Error updating seller profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update seller profile',
      error: error.message
    });
  }
};

// Verify Booking OTP
const verifyBookingOtp = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { otp } = req.body;
    const sellerId = req.user.id;

    // Validate input
    if (!otp) {
      return res.status(400).json({
        success: false,
        message: 'OTP is required'
      });
    }

    // Check if booking belongs to seller's vehicle
    const booking = await VehicleBooking.findById(bookingId).populate('vehicleId');
    if (!booking || booking.vehicleId.sellerId.toString() !== sellerId) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    // Validate OTP format (4-digit numeric)
    if (!/^\d{4}$/.test(otp)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP format. Please enter a 4-digit OTP'
      });
    }

    // Check against the actual pickup verification code stored in booking
    const pickupCode = booking.verificationCodes?.pickup?.code;

    if (!pickupCode) {
      return res.status(400).json({
        success: false,
        message: 'Pickup verification code not found for this booking'
      });
    }

    if (otp !== pickupCode) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP. Please check the pickup code from customer'
      });
    }

    // Check if OTP is already verified
    if (booking.verificationCodes.pickup.verified) {
      return res.json({
        success: true,
        message: 'Pickup code has already been verified',
        data: {
          booking: {
            id: booking._id,
            bookingId: booking.bookingId,
            bookingStatus: booking.bookingStatus,
            verificationCodes: booking.verificationCodes,
            alreadyVerified: true,
            verifiedAt: booking.verificationCodes.pickup.verifiedAt,
            verifiedBy: booking.verificationCodes.pickup.verifiedBy
          }
        }
      });
    }

    // Mark OTP as verified
    booking.verificationCodes.pickup.verified = true;
    booking.verificationCodes.pickup.verifiedAt = new Date();
    booking.verificationCodes.pickup.verifiedBy = sellerId;

    // Mark OTP as verified and update booking status if needed
    booking.statusHistory.push({
      status: 'confirmed',
      updatedBy: sellerId,
      updatedAt: new Date(),
      notes: 'Customer identity verified via pickup verification code'
    });

    // Update booking status to ongoing (pickup completed)
    if (booking.bookingStatus === 'confirmed' || booking.bookingStatus === 'pending' || booking.bookingStatus === 'awaiting_approval') {
      booking.bookingStatus = 'ongoing';
      booking.statusHistory.push({
        status: 'ongoing',
        updatedBy: sellerId,
        updatedAt: new Date(),
        notes: 'Vehicle handed over to customer'
      });
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Pickup verification successful! Vehicle handed over to customer.',
      data: {
        booking: {
          id: booking._id,
          bookingId: booking.bookingId,
          bookingStatus: booking.bookingStatus,
          verificationCodes: booking.verificationCodes,
          statusHistory: booking.statusHistory
        }
      }
    });

  } catch (error) {
    console.error('Error verifying pickup OTP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify pickup code',
      error: error.message
    });
  }
};

// Update Booking Details
const updateBookingDetails = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const updateData = req.body;
    const sellerId = req.user.id;

    // Check if booking belongs to seller's vehicle
    const booking = await VehicleBooking.findById(bookingId).populate('vehicleId');
    if (!booking || booking.vehicleId.sellerId.toString() !== sellerId) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    // Fields that can be updated by seller
    const allowedFields = [
      'notes',
      'specialInstructions',
      'pickupLocation',
      'dropoffLocation',
      'estimatedKm',
      'securityDeposit',
      'additionalCharges'
    ];

    // Filter and update only allowed fields
    const updates = {};
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key) && updateData[key] !== undefined) {
        updates[key] = updateData[key];
      }
    });

    // Handle specific field updates
    if (updateData.customerDetails) {
      // Update customer contact details if provided
      if (updateData.customerDetails.phone) {
        booking.customerDetails.phone = updateData.customerDetails.phone;
      }
      if (updateData.customerDetails.alternateContact) {
        booking.customerDetails.alternateContact = updateData.customerDetails.alternateContact;
      }
      if (updateData.customerDetails.emergencyContact) {
        booking.customerDetails.emergencyContact = updateData.customerDetails.emergencyContact;
      }
    }

    // Update booking dates if provided (with validation)
    if (updateData.startDateTime) {
      const newStartDate = new Date(updateData.startDateTime);
      if (newStartDate > new Date()) {
        booking.startDateTime = newStartDate;
      }
    }

    if (updateData.endDateTime) {
      const newEndDate = new Date(updateData.endDateTime);
      if (newEndDate > booking.startDateTime) {
        booking.endDateTime = newEndDate;
      }
    }

    // Apply other updates
    Object.assign(booking, updates);

    // Add to status history
    booking.statusHistory.push({
      status: booking.status,
      updatedBy: sellerId,
      updatedAt: new Date(),
      notes: `Booking details updated: ${Object.keys(updates).join(', ')}`
    });

    await booking.save();

    res.json({
      success: true,
      message: 'Booking details updated successfully',
      data: booking
    });

  } catch (error) {
    console.error('Error updating booking details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking details',
      error: error.message
    });
  }
};

// ===== ZONE MANAGEMENT =====

// Get seller's service zones
const getSellerZones = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Get seller profile with vehicle rental service zones
    const seller = await User.findById(sellerId).select('sellerProfile.vehicleRentalService.serviceZones');

    if (!seller || !seller.sellerProfile) {
      return res.status(404).json({
        success: false,
        message: 'Seller profile not found'
      });
    }

    // If vehicleRentalService doesn't exist, create it with default zones
    if (!seller.sellerProfile.vehicleRentalService) {
      // Create default zones
      const defaultZones = [
        {
          zoneName: 'Bholaram ustad marg',
          zoneCode: 'ind001',
          address: 'Bholaram ustad marg, Indore',
          isActive: true
        },
        {
          zoneName: 'Indrapuri main office',
          zoneCode: 'ind003',
          address: 'Indrapuri main office, Indore',
          isActive: true
        },
        {
          zoneName: 'Vijay nagar square',
          zoneCode: 'ind004',
          address: 'Vijay nagar square, Indore',
          isActive: true
        }
      ];

      // Initialize vehicleRentalService with default zones
      seller.sellerProfile.vehicleRentalService = {
        isEnabled: true,
        serviceStatus: 'active',
        businessType: 'individual',
        serviceZones: defaultZones
      };

      await seller.save();

      return res.json({
        success: true,
        message: 'Default zones created successfully',
        data: defaultZones
      });
    }

    // If serviceZones is empty, add default zones
    if (!seller.sellerProfile.vehicleRentalService.serviceZones ||
      seller.sellerProfile.vehicleRentalService.serviceZones.length === 0) {

      const defaultZones = [
        {
          zoneName: 'Bholaram ustad marg',
          zoneCode: 'ind001',
          address: 'Bholaram ustad marg, Indore',
          isActive: true
        },
        {
          zoneName: 'Indrapuri main office',
          zoneCode: 'ind003',
          address: 'Indrapuri main office, Indore',
          isActive: true
        },
        {
          zoneName: 'Vijay nagar square',
          zoneCode: 'ind004',
          address: 'Vijay nagar square, Indore',
          isActive: true
        }
      ];

      seller.sellerProfile.vehicleRentalService.serviceZones = defaultZones;
      await seller.save();

      return res.json({
        success: true,
        message: 'Default zones added successfully',
        data: defaultZones
      });
    }

    res.json({
      success: true,
      data: seller.sellerProfile.vehicleRentalService.serviceZones
    });

  } catch (error) {
    console.error('Error fetching seller zones:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seller zones',
      error: error.message
    });
  }
};

// Update seller's service zones
const updateSellerZones = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { serviceZones } = req.body;

    // Validate input
    if (!serviceZones || !Array.isArray(serviceZones)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service zones data. Expected an array.'
      });
    }

    // Validate each zone
    for (const zone of serviceZones) {
      if (!zone.zoneName || !zone.zoneCode || !zone.address) {
        return res.status(400).json({
          success: false,
          message: 'Each zone must have zoneName, zoneCode, and address'
        });
      }
    }

    // Find seller
    const seller = await User.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    // Initialize sellerProfile and vehicleRentalService if they don't exist
    if (!seller.sellerProfile) {
      seller.sellerProfile = {};
    }

    if (!seller.sellerProfile.vehicleRentalService) {
      seller.sellerProfile.vehicleRentalService = {
        isEnabled: true,
        serviceStatus: 'active',
        businessType: 'individual'
      };
    }

    // Update service zones
    seller.sellerProfile.vehicleRentalService.serviceZones = serviceZones;

    await seller.save();

    res.json({
      success: true,
      message: 'Service zones updated successfully',
      data: seller.sellerProfile.vehicleRentalService.serviceZones
    });

  } catch (error) {
    console.error('Error updating seller zones:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update seller zones',
      error: error.message
    });
  }
};

// Update specific zone
const updateZone = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { zoneId } = req.params;
    const updateData = req.body;

    // Find seller
    const seller = await User.findById(sellerId);
    if (!seller || !seller.sellerProfile?.vehicleRentalService?.serviceZones) {
      return res.status(404).json({
        success: false,
        message: 'Seller or zones not found'
      });
    }

    // Find and update the specific zone
    const zoneIndex = seller.sellerProfile.vehicleRentalService.serviceZones.findIndex(
      zone => zone._id.toString() === zoneId
    );

    if (zoneIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Zone not found'
      });
    }

    // Update zone data
    Object.keys(updateData).forEach(key => {
      if (['zoneName', 'zoneCode', 'address', 'isActive', 'coordinates'].includes(key)) {
        seller.sellerProfile.vehicleRentalService.serviceZones[zoneIndex][key] = updateData[key];
      }
    });

    await seller.save();

    res.json({
      success: true,
      message: 'Zone updated successfully',
      data: seller.sellerProfile.vehicleRentalService.serviceZones[zoneIndex]
    });

  } catch (error) {
    console.error('Error updating zone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update zone',
      error: error.message
    });
  }
};

// Delete specific zone
const deleteZone = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { zoneId } = req.params;

    // Find seller
    const seller = await User.findById(sellerId);
    if (!seller || !seller.sellerProfile?.vehicleRentalService?.serviceZones) {
      return res.status(404).json({
        success: false,
        message: 'Seller or zones not found'
      });
    }

    // Find zone index
    const zoneIndex = seller.sellerProfile.vehicleRentalService.serviceZones.findIndex(
      zone => zone._id.toString() === zoneId
    );

    if (zoneIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Zone not found'
      });
    }

    // Remove the zone
    seller.sellerProfile.vehicleRentalService.serviceZones.splice(zoneIndex, 1);
    await seller.save();

    res.json({
      success: true,
      message: 'Zone deleted successfully',
      data: seller.sellerProfile.vehicleRentalService.serviceZones
    });

  } catch (error) {
    console.error('Error deleting zone:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete zone',
      error: error.message
    });
  }
};

// ===== METER READING MANAGEMENT =====

// Update start meter reading during vehicle handover
const updateStartMeterReading = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { startMeterReading, fuelLevel, vehicleCondition, handoverNotes } = req.body;
    const sellerId = req.user.id;

    const booking = await VehicleBooking.findById(bookingId).populate('vehicleId');

    if (!booking || booking.vehicleId.sellerId.toString() !== sellerId) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    // Update start meter reading using the schema method
    const result = booking.updateMeterReading('start', startMeterReading, sellerId);

    // Update additional handover details
    if (fuelLevel) booking.vehicleHandover.fuelLevel = fuelLevel;
    if (vehicleCondition) booking.vehicleHandover.vehicleCondition = vehicleCondition;
    if (handoverNotes) booking.vehicleHandover.handoverNotes = handoverNotes;

    await booking.save();

    res.json({
      success: true,
      message: 'Start meter reading updated successfully',
      data: {
        booking: booking._id,
        startMeterReading: startMeterReading,
        handoverTime: booking.vehicleHandover.handoverTime,
        metrics: result
      }
    });

  } catch (error) {
    console.error('Error updating start meter reading:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update start meter reading',
      error: error.message
    });
  }
};

// Update end meter reading during vehicle return
const updateEndMeterReading = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { endMeterReading, returnFuelLevel, condition, damageNotes } = req.body;
    const sellerId = req.user.id;

    const booking = await VehicleBooking.findById(bookingId).populate('vehicleId');

    if (!booking || booking.vehicleId.sellerId.toString() !== sellerId) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    // Update end meter reading using the schema method
    const result = booking.updateMeterReading('end', endMeterReading, sellerId);

    // Update additional return details
    if (returnFuelLevel) booking.vehicleReturn.returnFuelLevel = returnFuelLevel;
    if (condition) booking.vehicleReturn.condition = condition;
    if (damageNotes) booking.vehicleReturn.damageNotes = damageNotes;

    await booking.save();

    res.json({
      success: true,
      message: 'End meter reading updated successfully',
      data: {
        booking: booking._id,
        endMeterReading: endMeterReading,
        returnTime: booking.vehicleReturn.submittedAt,
        metrics: result
      }
    });

  } catch (error) {
    console.error('Error updating end meter reading:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update end meter reading',
      error: error.message
    });
  }
};

// Get trip metrics and km calculation
const getTripMetrics = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const sellerId = req.user.id;

    const booking = await VehicleBooking.findById(bookingId).populate('vehicleId');

    if (!booking || booking.vehicleId.sellerId.toString() !== sellerId) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    const tripMetrics = booking.calculateTripMetrics();
    const extraKmCharges = booking.calculateExtraKmCharges();

    res.json({
      success: true,
      data: {
        booking: booking._id,
        tripMetrics: tripMetrics,
        extraCharges: extraKmCharges,
        currentBilling: booking.billing,
        vehicleHandover: booking.vehicleHandover,
        vehicleReturn: booking.vehicleReturn
      }
    });

  } catch (error) {
    console.error('Error calculating trip metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to calculate trip metrics',
      error: error.message
    });
  }
};

// Finalize booking billing after vehicle return
const finalizeBookingBilling = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const sellerId = req.user.id;

    const booking = await VehicleBooking.findById(bookingId).populate('vehicleId');

    if (!booking || booking.vehicleId.sellerId.toString() !== sellerId) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    // Finalize billing using schema method
    const result = booking.finalizeBookingBilling();

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message
      });
    }

    // Update booking status to completed if both readings are available
    if (result.tripMetrics.success) {
      booking.bookingStatus = 'completed';
      booking.vehicleReturn.vehicleAvailableAgain = true;
      booking.vehicleReturn.madeAvailableAt = new Date();
    }

    await booking.save();

    res.json({
      success: true,
      message: 'Booking billing finalized successfully',
      data: {
        booking: booking._id,
        finalBilling: result.finalBilling,
        tripMetrics: result.tripMetrics,
        extraCharges: result.extraCharges,
        bookingStatus: booking.bookingStatus
      }
    });

  } catch (error) {
    console.error('Error finalizing booking billing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to finalize booking billing',
      error: error.message
    });
  }
};

// ===== EXTENSION MANAGEMENT =====

// Create extension (seller-initiated)
const createExtension = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const sellerId = req.user.id;
    const {
      requestedEndDateTime,
      additionalHours,
      additionalAmount,
      additionalGst,
      additionalKmLimit,
      reason,
      autoApproved = true,
      planType = "hourly"
    } = req.body;

    const booking = await VehicleBooking.findById(bookingId).populate('vehicleId');

    if (!booking || booking.vehicleId.sellerId.toString() !== sellerId) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    // Check if booking can be extended
    if (!['confirmed', 'ongoing'].includes(booking.bookingStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Booking cannot be extended in current status'
      });
    }

    // Create extension request
    const extensionRequest = {
      requestId: `EXT_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      requestedEndDateTime: new Date(requestedEndDateTime),
      additionalHours: additionalHours,
      additionalAmount: additionalAmount,
      additionalGst: additionalGst,
      additionalKmLimit: additionalKmLimit,
      reason: reason,
      planType: planType,
      requestedBy: 'seller',
      sellerId: sellerId,
      status: autoApproved ? 'approved' : 'pending',
      requestedAt: new Date()
    };

    if (autoApproved) {
      extensionRequest.approvedAt = new Date();
      extensionRequest.approvedBy = sellerId;

      // Update booking end time and totals
      booking.endDateTime = new Date(requestedEndDateTime);
      booking.totalExtensionHours = (booking.totalExtensionHours || 0) + additionalHours;
      // Store extension amount WITHOUT GST (GST stored separately in each extension request)
      booking.totalExtensionAmount = (booking.totalExtensionAmount || 0) + additionalAmount;
      booking.currentKmLimit = (booking.currentKmLimit || booking.ratePlanUsed?.kmLimit || 0) + additionalKmLimit;

      // Update totalBill to include extension charges
      booking.billing.totalBill = (booking.billing.totalBill || 0) + additionalAmount;
    }

    // Add extension to booking
    if (!booking.extensionRequests) {
      booking.extensionRequests = [];
    }
    booking.extensionRequests.push(extensionRequest);

    await booking.save();

    res.json({
      success: true,
      message: autoApproved ? 'Extension created and approved successfully' : 'Extension request created',
      data: {
        extensionRequest: extensionRequest,
        updatedBooking: {
          endDateTime: booking.endDateTime,
          totalExtensionHours: booking.totalExtensionHours,
          totalExtensionAmount: booking.totalExtensionAmount
        }
      }
    });

  } catch (error) {
    console.error('Error creating extension:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create extension',
      error: error.message
    });
  }
};

// Respond to extension request (approve/reject user requests)
const respondToExtension = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const sellerId = req.user.id;
    const { requestId, action, rejectionReason } = req.body;

    const booking = await VehicleBooking.findById(bookingId).populate('vehicleId');

    if (!booking || booking.vehicleId.sellerId.toString() !== sellerId) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or access denied'
      });
    }

    // Find the extension request
    const extensionRequest = booking.extensionRequests?.find(ext => ext.requestId === requestId);

    if (!extensionRequest) {
      return res.status(404).json({
        success: false,
        message: 'Extension request not found'
      });
    }

    if (extensionRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Extension request has already been processed'
      });
    }

    // Update extension request status
    extensionRequest.status = action;
    extensionRequest.respondedAt = new Date();
    extensionRequest.respondedBy = sellerId;

    if (action === 'approve') {
      // Update booking with extension details
      booking.endDateTime = extensionRequest.requestedEndDateTime;
      booking.totalExtensionHours = (booking.totalExtensionHours || 0) + extensionRequest.additionalHours;
      booking.totalExtensionAmount = (booking.totalExtensionAmount || 0) + extensionRequest.additionalAmount + extensionRequest.additionalGst;
      booking.currentKmLimit = (booking.currentKmLimit || booking.ratePlanUsed?.kmLimit || 0) + extensionRequest.additionalKmLimit;

      extensionRequest.approvedAt = new Date();
      extensionRequest.approvedBy = sellerId;
    } else if (action === 'reject') {
      extensionRequest.rejectionReason = rejectionReason || '';
      extensionRequest.rejectedAt = new Date();
    }

    await booking.save();

    res.json({
      success: true,
      message: `Extension request ${action}d successfully`,
      data: {
        extensionRequest: extensionRequest,
        updatedBooking: {
          endDateTime: booking.endDateTime,
          totalExtensionHours: booking.totalExtensionHours,
          totalExtensionAmount: booking.totalExtensionAmount
        }
      }
    });

  } catch (error) {
    console.error('Error responding to extension:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to extension',
      error: error.message
    });
  }
};

// ===== VEHICLE DROP PROCESSING =====
// Process vehicle drop with comprehensive billing calculation
const processVehicleDrop = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const sellerId = req.user.id;

    const {
      endMeterReading,
      fuelLevel,
      vehicleCondition,
      damageNotes,
      returnImages,
      additionalCharges,
      additionalChargesDescription,
      helmetReturned,
      generalNotes,
      dropTime,
      calculations
    } = req.body;

    // Fetch the booking with all necessary details
    const booking = await VehicleBooking.findById(bookingId)
      .populate('vehicleId', 'sellerId')
      .populate('userId', 'name phone email');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Verify seller owns this vehicle
    if (booking.vehicleId.sellerId.toString() !== sellerId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to this booking'
      });
    }

    // Check if booking is eligible for drop (must be ongoing)
    if (booking.bookingStatus !== 'ongoing') {
      return res.status(400).json({
        success: false,
        message: 'Vehicle can only be dropped for ongoing bookings'
      });
    }

    // Validate meter reading
    const startReading = booking.vehicleHandover?.startMeterReading || 0;
    if (endMeterReading < startReading) {
      return res.status(400).json({
        success: false,
        message: 'End meter reading cannot be less than start meter reading'
      });
    }

    // Fetch vehicle to get actual rate plans
    const vehicle = await Vehicle.findById(booking.vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Calculate final billing with vehicle's actual rate plans
    const finalCalculations = calculateDropBilling(booking, vehicle, {
      endMeterReading,
      dropTime,
      additionalCharges
    });

    // Update booking with vehicle return details
    booking.vehicleReturn = {
      submitted: true,
      submittedAt: new Date(dropTime),
      submittedBy: sellerId,
      endMeterReading: parseFloat(endMeterReading),
      returnFuelLevel: fuelLevel,
      condition: vehicleCondition,
      damageNotes: damageNotes || '',
      returnImages: returnImages || [],
      vehicleAvailableAgain: true,
      madeAvailableAt: new Date(),
      helmetReturned: helmetReturned || false
    };

    // Update trip metrics
    booking.tripMetrics = {
      totalKmTraveled: finalCalculations.totalKmTraveled,
      calculatedAt: new Date(),
      manualOverride: null
    };

    // Update billing with final amounts
    booking.billing = {
      ...booking.billing,
      extraKmCharge: finalCalculations.extraKmCharge,
      extraHourCharge: finalCalculations.extraHourCharge,
      additionalCharges: parseFloat(additionalCharges || 0),
      additionalChargesDescription: additionalChargesDescription || '',
      lateFees: finalCalculations.lateFees,
      totalBill: finalCalculations.finalAmount
    };

    // Update booking status to completed
    booking.bookingStatus = 'completed';
    booking.actualEndTime = new Date(dropTime);

    // Add to status history
    booking.statusHistory.push({
      status: 'completed',
      updatedBy: sellerId,
      updatedAt: new Date(),
      notes: `Vehicle dropped. ${generalNotes || ''}`
    });

    // Save the booking
    await booking.save();

    // Update vehicle availability (vehicle already fetched above)
    vehicle.isAvailable = true;
    vehicle.currentBookingId = null;
    vehicle.meterReading = parseFloat(endMeterReading);
    await vehicle.save();

    // Create notification for customer about completion and final billing
    // (You can implement notification service here)

    // Prepare response
    const response = {
      success: true,
      message: 'Vehicle drop processed successfully',
      data: {
        bookingId: booking.bookingId,
        finalAmount: finalCalculations.finalAmount,
        dropTime: dropTime,
        calculations: finalCalculations,
        booking: {
          id: booking._id,
          bookingId: booking.bookingId,
          status: booking.bookingStatus,
          vehicleReturn: booking.vehicleReturn,
          tripMetrics: booking.tripMetrics,
          billing: booking.billing
        }
      }
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Error processing vehicle drop:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process vehicle drop',
      error: error.message
    });
  }
};

// Helper function to calculate billing for vehicle drop
const calculateDropBilling = (booking, vehicle, dropData) => {
  const { endMeterReading, dropTime, additionalCharges } = dropData;

  // Basic calculations
  const startReading = booking.vehicleHandover?.startMeterReading || 0;
  const totalKmTraveled = Math.max(0, parseFloat(endMeterReading) - startReading);

  // Calculate pickup time (actual handover time or start time)
  const pickupTime = new Date(booking.vehicleHandover?.handoverTime || booking.startDateTime);
  const actualDropTime = new Date(dropTime);

  // Calculate total rental time in hours (exact calculation - no rounding)
  const totalRentalTimeMs = actualDropTime - pickupTime;
  const totalRentalTimeHours = Math.max(0, totalRentalTimeMs / (1000 * 60 * 60));

  // Get rate plan details
  const planType = booking.rateType || 'hourly';
  const ratePlan = booking.ratePlanUsed || {};

  let timeCharge = 0;
  let extraKmCharge = 0;
  let totalBill = 0;
  let freeKm = 0;
  let extraKm = 0;

  // NEW BILLING LOGIC:
  // - For rentals ≥24 hours: Always apply 24hr plan blocks first, then 12hr blocks, then remaining hours
  // - Extra hour/km charges: Based on SELECTED plan rates, not hourly plan
  // - Use vehicle's ACTUAL rate plans (not hardcoded values)
  
  // Get selected plan rates for extra charges
  const selectedPlanExtraHourRate = ratePlan.extraChargePerHour || ratePlan.extra_hr || 50;
  const selectedPlanExtraKmRate = ratePlan.extraChargePerKm || ratePlan.extra_km || 6;

  // Get vehicle's actual plan rates (with fallbacks)
  const rate24Hr = (vehicle.rate24hr && vehicle.rate24hr.baseRate) || 750;
  const freeKm24Hr = (vehicle.rate24hr && vehicle.rate24hr.kmLimit) || 150;
  const rate12Hr = (vehicle.rate12hr && vehicle.rate12hr.baseRate) || 500;
  const freeKm12Hr = (vehicle.rate12hr && vehicle.rate12hr.kmLimit) || 120;

  // Determine billing strategy based on total rental time
  if (totalRentalTimeHours >= 24) {
    // ========================================
    // FOR ANY RENTAL ≥24 HOURS: Use 24hr block-based billing with vehicle's rates
    // ========================================

    // Calculate number of 24-hour blocks
    const blocks24Hr = Math.floor(totalRentalTimeHours / 24);
    let remainingTime = totalRentalTimeHours - (blocks24Hr * 24);

    // Calculate number of 12-hour blocks from remaining time
    const blocks12Hr = Math.floor(remainingTime / 12);
    remainingTime = remainingTime - (blocks12Hr * 12);

    // Remaining hours charged at SELECTED plan's extra hour rate
    const extraHoursCharge = remainingTime * selectedPlanExtraHourRate;

    // Calculate time charge using vehicle's actual rates
    timeCharge = (blocks24Hr * rate24Hr) + (blocks12Hr * rate12Hr) + extraHoursCharge;

    // Calculate free km based on blocks used (vehicle's actual km limits)
    freeKm = (blocks24Hr * freeKm24Hr) + (blocks12Hr * freeKm12Hr);
    
    // Extra km charged at SELECTED plan's extra km rate
    extraKm = Math.max(0, totalKmTraveled - freeKm);
    extraKmCharge = extraKm * selectedPlanExtraKmRate;

    // Total bill
    totalBill = timeCharge + extraKmCharge;

  } else {
    // ========================================
    // FOR RENTALS <24 HOURS: Use selected plan as-is
    // ========================================
    switch (planType.toLowerCase()) {
      case 'hourly':
      case 'hourly_plan':
      case 'with_fuel':
        // HOURLY PLAN (0-12 hours): Apply hourly rates
        const hourlyRate = ratePlan.ratePerHour || ratePlan.hourly_rate || 50;
        const kmPerHour = ratePlan.kmFreePerHour || 10;

        // Time Charge = Total Hours × Hourly Rate
        timeCharge = totalRentalTimeHours * hourlyRate;

        // Free KM = Total Hours × km per hour
        freeKm = totalRentalTimeHours * kmPerHour;

        // Extra KM using SELECTED (hourly) plan's rate
        extraKm = Math.max(0, totalKmTraveled - freeKm);
        extraKmCharge = extraKm * selectedPlanExtraKmRate;

        totalBill = timeCharge + extraKmCharge;
        break;

      case '12hr':
      case '12_hour':
        // 12-HOUR PLAN: Base Rate + Extra time/km using selected plan rates
        const baseRate12 = ratePlan.baseRate || ratePlan.rate || 500;
        const baseDuration12 = 12;
        const freeDistance12 = ratePlan.kmLimit || ratePlan.limit_km || 120;

        // Extra Time = max(0, Total Hours − 12)
        const extraTime12 = Math.max(0, totalRentalTimeHours - baseDuration12);

        // Extra charges using SELECTED (12hr) plan's rates
        timeCharge = baseRate12 + (extraTime12 * selectedPlanExtraHourRate);
        
        extraKm = Math.max(0, totalKmTraveled - freeDistance12);
        extraKmCharge = extraKm * selectedPlanExtraKmRate;

        totalBill = timeCharge + extraKmCharge;
        break;

      case '24hr':
      case '24_hour':
        // This case shouldn't happen since totalRentalTimeHours < 24
        // But handle it anyway with base rate only
        const baseRate24 = ratePlan.baseRate || ratePlan.rate || 750;
        const freeDistance24 = ratePlan.kmLimit || ratePlan.limit_km || 150;

        timeCharge = baseRate24;
        
        extraKm = Math.max(0, totalKmTraveled - freeDistance24);
        extraKmCharge = extraKm * selectedPlanExtraKmRate;

        totalBill = timeCharge + extraKmCharge;
        break;

      case 'daily':
      case 'day_wise':
        // DAY WISE PLAN: Rate per day + extra charges
        const dailyRate = ratePlan.rate_day || ratePlan.baseRate || 750;
        const dailyKmLimit = ratePlan.limit_day || ratePlan.kmLimit || 150;
        const availableHours = ratePlan.available_hr || 24;

        // Calculate base days
        const baseDays = Math.ceil(totalRentalTimeHours / 24);
        const extraHoursDaily = Math.max(0, totalRentalTimeHours - availableHours);

        // Use SELECTED plan's extra hour rate
        timeCharge = (dailyRate * baseDays) + (extraHoursDaily * selectedPlanExtraHourRate);
        
        extraKm = Math.max(0, totalKmTraveled - (dailyKmLimit * baseDays));
        extraKmCharge = extraKm * selectedPlanExtraKmRate;

        totalBill = timeCharge + extraKmCharge;
        break;

      default:
        // Fallback to hourly calculation
        timeCharge = totalRentalTimeHours * (ratePlan.ratePerHour || 50);
        freeKm = totalRentalTimeHours * (ratePlan.kmFreePerHour || 10);
        extraKm = Math.max(0, totalKmTraveled - freeKm);
        extraKmCharge = extraKm * selectedPlanExtraKmRate;
        totalBill = timeCharge + extraKmCharge;
        break;
    }
  }

  // Calculate extension charges (from approved extensions)
  let extensionCharges = 0;
  if (booking.extensionRequests && booking.extensionRequests.length > 0) {
    extensionCharges = booking.extensionRequests
      .filter(ext => ext.status === 'approved')
      .reduce((total, ext) => total + (ext.additionalAmount || 0), 0);
  }

  // Sum up additional charges
  const additionalChargesAmount = parseFloat(additionalCharges) || 0;

  // Calculate final amount
  const finalAmount = totalBill + extensionCharges + additionalChargesAmount;

  return {
    totalKmTraveled: Math.round(totalKmTraveled * 10) / 10, // Round to 1 decimal
    extraKmCharge: Math.round(extraKmCharge * 100) / 100,
    extraHourCharge: Math.round(timeCharge * 100) / 100, // This is now the time charge
    totalRentalTime: Math.round(totalRentalTimeHours * 100) / 100,
    extensionCharges: Math.round(extensionCharges * 100) / 100,
    additionalCharges: Math.round(additionalChargesAmount * 100) / 100,
    lateFees: 0, // Not using late fees in new calculation
    finalAmount: Math.round(finalAmount * 100) / 100,
    breakdown: {
      planType: planType,
      timeCharge: Math.round(timeCharge * 100) / 100,
      freeKm: Math.round(freeKm * 10) / 10,
      extraKm: Math.round(extraKm * 10) / 10,
      totalRentalTime: Math.round(totalRentalTimeHours * 100) / 100
    }
  };
};

// Complete booking - Vehicle Dropoff with final bill calculation
const completeBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const {
      endMeterReading,
      endFuelLevel,
      vehicleCondition,
      endDateTime, // Editable drop time from seller
      extraCharges,
      payment,
      billing,
      notes,
      refundMode, // NEW: 'cash' or 'online' - how refund was given to customer
    } = req.body;

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

    // Verify seller owns this vehicle
    if (booking.vehicleId.sellerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized to complete this booking',
      });
    }

    // Update booking with dropoff details
    booking.endMeterReading = endMeterReading;
    booking.endFuelLevel = endFuelLevel;
    booking.vehicleCondition = vehicleCondition;
    booking.endDateTime = endDateTime ? new Date(endDateTime) : new Date(); // Use provided time or current

    // Update vehicleReturn schema with drop time
    booking.vehicleReturn = booking.vehicleReturn || {};
    booking.vehicleReturn.submitted = true;
    booking.vehicleReturn.submittedAt = booking.endDateTime; // Use same drop time
    booking.vehicleReturn.submittedBy = req.user.id;
    booking.vehicleReturn.endMeterReading = endMeterReading;
    booking.vehicleReturn.returnFuelLevel = endFuelLevel;
    booking.vehicleReturn.condition = vehicleCondition;
    booking.vehicleReturn.vehicleAvailableAgain = true;
    booking.vehicleReturn.madeAvailableAt = booking.endDateTime;

    // Update billing with free km info
    booking.billing.extraKmCharge = billing.extraKmCharge;
    booking.billing.extraHourCharge = billing.extraHourCharge;
    booking.billing.freeKm = billing.freeKm; // Track free km provided
    booking.billing.totalKm = billing.totalKm; // Track total km traveled

    // Single extra charges field
    if (extraCharges && extraCharges.amount) {
      booking.billing.damageCharges = extraCharges.amount;
      if (extraCharges.notes) {
        booking.notes = (booking.notes || '') + '\nExtra Charges: ' + extraCharges.notes;
      }
    }

    booking.billing.totalBill = billing.totalBill;
    // No GST - removed

    // Add payment if received
    if (payment.cashReceived > 0 || payment.onlineReceived > 0) {
      booking.payments = booking.payments || [];

      if (payment.cashReceived > 0) {
        booking.payments.push({
          amount: payment.cashReceived,
          paymentType: 'Cash',  // Correct enum value
          paymentMethod: 'Cash',  // Correct enum value
          status: 'success',  // Correct enum value
          transactionDate: new Date(),
        });
      }

      if (payment.onlineReceived > 0) {
        booking.payments.push({
          amount: payment.onlineReceived,
          paymentType: 'UPI',  // Correct enum value
          paymentMethod: 'Razorpay',  // Correct enum value
          status: 'success',  // Correct enum value
          transactionDate: new Date(),
        });
      }
    }

    // Calculate total paid
    const totalPaidFromPayments = booking.payments.reduce(
      (sum, p) => sum + (p.amount || 0),
      0
    );

    // Update payment status (use correct enum values)
    booking.paidAmount = totalPaidFromPayments;

    if (totalPaidFromPayments >= billing.totalBill) {
      booking.paymentStatus = 'paid';
    } else if (totalPaidFromPayments > 0) {
      booking.paymentStatus = 'partially-paid';
    } else {
      booking.paymentStatus = 'unpaid'; // Correct enum value
    }

    // Update status to completed
    booking.bookingStatus = 'completed';
    booking.statusHistory.push({
      status: 'completed',
      timestamp: new Date(),
      updatedBy: req.user.id,
    });

    // Mark drop verification as verified
    if (!booking.verificationCodes) {
      booking.verificationCodes = {};
    }
    if (!booking.verificationCodes.drop) {
      booking.verificationCodes.drop = {};
    }
    booking.verificationCodes.drop.verified = true;
    booking.verificationCodes.drop.verifiedAt = new Date();

    // Calculate refund based on overpayment (not just deposit)
    const totalPaid = booking.paidAmount || 0;
    const actualBill = billing.totalBill || 0;
    
    // If customer paid more than the actual bill, refund the difference
    if (totalPaid > actualBill) {
      const refundAmount = totalPaid - actualBill;
      
      // Determine refund method based on refundMode or default to collection method
      let refundMethod = 'cash'; // Default
      if (refundMode) {
        refundMethod = refundMode === 'online' ? 'bank-transfer' : 'cash';
      } else {
        // Check how they paid originally
        const cashPayment = booking.payments?.find(p => p.paymentMethod === 'Cash' || p.paymentType === 'Cash');
        refundMethod = cashPayment ? 'cash' : 'bank-transfer';
      }
      
      // Create refund details
      booking.refundDetails = {
        reason: 'overbilling', // Overpayment at booking time
        requestedAmount: refundAmount,
        approvedAmount: refundAmount,
        refundMethod: refundMethod,
        refundMode: refundMode || (refundMethod === 'cash' ? 'cash' : 'online'),
        processedBy: req.user.id,
        processedDate: new Date(),
        refundReference: `REF-${booking.bookingId}-${Date.now().toString().slice(-6)}`,
        notes: `Overpayment refund: Customer paid ₹${totalPaid} at booking, actual bill was ₹${actualBill}. Refunded ₹${refundAmount} via ${refundMode || refundMethod}.`
      };
      
      // Update refund status
      booking.refundStatus = 'completed';
      booking.depositRefundStatus = 'not-applicable'; // This is not a deposit refund
    } else if (totalPaid < actualBill) {
      // Customer owes money
      booking.refundStatus = 'not-applicable';
      booking.depositRefundStatus = 'not-applicable';
    } else {
      // Exact payment, no refund needed
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
      message: 'Vehicle returned successfully',
      data: booking,
    });
  } catch (error) {
    console.error('Error completing booking:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete booking',
      error: error.message,
    });
  }
};

module.exports = {
  getSellerDashboard,
  getSellerVehicles,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  toggleVehicleAvailability,
  getSellerBookings,
  updateBookingStatus,
  getBookingDetails,
  getSellerProfile,
  updateSellerProfile,
  verifyBookingOtp,
  updateBookingDetails,
  getSellerZones,
  updateSellerZones,
  updateZone,
  deleteZone,
  updateStartMeterReading,
  updateEndMeterReading,
  getTripMetrics,
  finalizeBookingBilling,
  createExtension,
  respondToExtension,
  processVehicleDrop,
  completeBooking,
};
