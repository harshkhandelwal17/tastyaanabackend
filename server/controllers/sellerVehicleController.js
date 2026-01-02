const Vehicle = require('../models/Vehicle');
const VehicleBooking = require('../models/VehicleBooking');
const VehicleRefund = require('../models/VehicleRefund');
const User = require('../models/User');
const { cloudinary } = require('../config/cloudinary');

// ===== SELLER DASHBOARD ANALYTICS =====

// Get seller dashboard statistics
const getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Get seller's vehicles
    const vehicles = await Vehicle.find({ sellerId: sellerId }); // Changed from 'seller' to 'sellerId'
    const vehicleIds = vehicles.map(v => v._id);

    // Get bookings for seller's vehicles
    const bookings = await VehicleBooking.find({ vehicleId: { $in: vehicleIds } }); // Changed from 'vehicle' to 'vehicleId'

    // Calculate statistics
    const totalVehicles = vehicles.length;
    const activeVehicles = vehicles.filter(v => v.status === 'active').length;
    const totalBookings = bookings.length;
    const activeBookings = bookings.filter(b => ['confirmed', 'in-progress'].includes(b.status)).length;

    // Revenue calculations
    const totalRevenue = bookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, booking) => sum + (booking.billing?.totalBill || 0), 0);

    const monthlyRevenue = bookings
      .filter(b => {
        const bookingDate = new Date(b.bookingDate);
        const now = new Date();
        return bookingDate.getMonth() === now.getMonth() &&
          bookingDate.getFullYear() === now.getFullYear() &&
          b.paymentStatus === 'paid';
      })
      .reduce((sum, booking) => sum + (booking.billing?.totalBill || 0), 0);

    // Recent bookings
    const recentBookings = await VehicleBooking.find({ vehicleId: { $in: vehicleIds } })
      .populate('vehicleId', 'name companyName vehicleImages')
      .populate('userId', 'name phone email')
      .sort({ bookingDate: -1 })
      .limit(5);

    // Vehicle performance
    const vehicleStats = await Promise.all(vehicles.map(async (vehicle) => {
      const vehicleBookings = bookings.filter(b => b.vehicleId.toString() === vehicle._id.toString());
      const revenue = vehicleBookings
        .filter(b => b.paymentStatus === 'paid')
        .reduce((sum, booking) => sum + (booking.billing?.totalBill || 0), 0);

      return {
        vehicle: {
          _id: vehicle._id,
          brand: vehicle.brand,
          model: vehicle.model,
          images: vehicle.images,
          status: vehicle.status
        },
        totalBookings: vehicleBookings.length,
        revenue,
        utilization: vehicleBookings.length > 0 ? (vehicleBookings.length / 30) * 100 : 0 // Assuming 30 days
      };
    }));

    res.json({
      success: true,
      data: {
        overview: {
          totalVehicles,
          activeVehicles,
          totalBookings,
          activeBookings,
          totalRevenue,
          monthlyRevenue
        },
        recentBookings: recentBookings.map(booking => ({
          _id: booking._id,
          bookingId: booking.bookingId,
          vehicle: booking.vehicleId,
          customer: booking.userId,
          startDate: booking.startDateTime,
          endDate: booking.endDateTime,
          totalAmount: booking.billing?.totalBill,
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

    const filter = { sellerId: sellerId }; // Changed from 'seller' to 'sellerId'

    // Add search filter
    if (search) {
      filter.$or = [
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } },
        { vehicleNo: { $regex: search, $options: 'i' } } // Added vehicleNo search
      ];
    }

    // Add status filter
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Add availability filter
    if (availability && availability !== 'all') {
      filter.availability = availability;
    }

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

    res.json({
      success: true,
      data: {
        vehicles,
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
    console.error('Error fetching seller vehicles:', error);
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
      status: { $in: ['confirmed', 'in-progress'] }
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
      sortBy = 'bookingDate',
      sortOrder = 'desc'
    } = req.query;

    // Get seller's vehicles first
    const sellerVehicles = await Vehicle.find({ sellerId: sellerId }, '_id');
    const vehicleIds = sellerVehicles.map(v => v._id);

    const filter = { vehicleId: { $in: vehicleIds } }; // Changed from 'vehicle' to 'vehicleId'

    // Add filters
    if (status) filter.status = status;
    if (dateFrom) filter.bookingDate = { $gte: new Date(dateFrom) };
    if (dateTo) {
      filter.bookingDate = filter.bookingDate || {};
      filter.bookingDate.$lte = new Date(dateTo);
    }

    // Search filter
    if (search) {
      filter.$or = [
        { bookingId: { $regex: search, $options: 'i' } }
      ];
    }

    // Sorting
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (page - 1) * limit;

    const bookings = await VehicleBooking.find(filter)
      .populate('vehicleId', 'name companyName vehicleImages vehicleNo') // Fixed field names
      .populate('userId', 'name phone email') // Changed from 'customer' to 'userId'
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const totalBookings = await VehicleBooking.countDocuments(filter);

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
    if (status) booking.status = status;
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
      status: status || booking.status,
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
      .populate('vehicleId')
      .populate('userId', 'name phone email')
      .populate('statusHistory.updatedBy', 'name');

    if (!booking || booking.vehicleId.sellerId.toString() !== sellerId) {
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
      autoApproved = true
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
      booking.totalExtensionAmount = (booking.totalExtensionAmount || 0) + additionalAmount + additionalGst;
      booking.currentKmLimit = (booking.currentKmLimit || booking.ratePlanUsed?.kmLimit || 0) + additionalKmLimit;
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

    // Calculate final billing
    const finalCalculations = calculateDropBilling(booking, {
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

    // Update vehicle availability
    const vehicle = await Vehicle.findById(booking.vehicleId);
    if (vehicle) {
      vehicle.isAvailable = true;
      vehicle.currentBookingId = null;
      vehicle.meterReading = parseFloat(endMeterReading);
      await vehicle.save();
    }

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
const calculateDropBilling = (booking, dropData) => {
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

  // Calculate based on plan type using your exact specifications
  switch (planType.toLowerCase()) {
    case 'hourly':
    case 'hourly_plan':
    case 'with_fuel':
      // HOURLY PLAN: Hourly Rate: ₹50/hr, Free Distance: 10 km per hour, Extra Distance: ₹6/km
      const hourlyRate = ratePlan.ratePerHour || ratePlan.hourly_rate || 50;
      const kmPerHour = ratePlan.kmFreePerHour || 10;
      const extraKmRate = ratePlan.extraChargePerKm || ratePlan.extra_km || 6;

      // Time Charge = Total Hours × Hourly Rate
      timeCharge = totalRentalTimeHours * hourlyRate;

      // Free KM = Total Hours × 10 (can be fractional)
      freeKm = totalRentalTimeHours * kmPerHour;

      // Extra KM = max(0, Total KM − Free KM)
      extraKm = Math.max(0, totalKmTraveled - freeKm);

      // Extra KM Charge = Extra KM × 6
      extraKmCharge = extraKm * extraKmRate;

      // Total Bill = Time Charge + Extra KM Charge
      totalBill = timeCharge + extraKmCharge;
      break;

    case '12hr':
    case '12_hour':
      // 12-HOUR PLAN: Base Rate: ₹500, Base Duration: 12hr, Free Distance: 120km
      const baseRate12 = ratePlan.baseRate || ratePlan.rate || 500;
      const baseDuration12 = 12;
      const freeDistance12 = ratePlan.kmLimit || ratePlan.limit_km || 120;
      const extraHourRate12 = ratePlan.extraChargePerHour || ratePlan.extra_hr || 50;
      const extraKmRate12 = ratePlan.extraChargePerKm || ratePlan.extra_km || 3;

      // Extra Time = max(0, Total Hours − 12)
      const extraTime12 = Math.max(0, totalRentalTimeHours - baseDuration12);

      // Extra KM = max(0, Total KM − 120)
      extraKm = Math.max(0, totalKmTraveled - freeDistance12);

      // Total Bill = Base Rate + (Extra Time × 50) + (Extra KM × 3)
      totalBill = baseRate12 + (extraTime12 * extraHourRate12) + (extraKm * extraKmRate12);
      
      timeCharge = baseRate12 + (extraTime12 * extraHourRate12);
      extraKmCharge = extraKm * extraKmRate12;
      break;

    case '24hr':
    case '24_hour':
      // 24-HOUR PLAN: Base Rate: ₹750, Base Duration: 24hr, Free Distance: 150km
      const baseRate24 = ratePlan.baseRate || ratePlan.rate || 750;
      const baseDuration24 = 24;
      const freeDistance24 = ratePlan.kmLimit || ratePlan.limit_km || 150;
      const extra12HrBlock = ratePlan.extraBlockRate || 500;
      const extraHourRate24 = ratePlan.extraChargePerHour || ratePlan.extra_hr || 3;
      const extraKmRate24 = ratePlan.extraChargePerKm || ratePlan.extra_km || 3;

      // Extra Time = max(0, Total Hours − 24)
      const extraTime24 = Math.max(0, totalRentalTimeHours - baseDuration24);

      // Extra 12Hr Blocks = floor(Extra Time / 12)
      const extra12HrBlocks = Math.floor(extraTime24 / 12);

      // Remaining Hours = Extra Time % 12
      const remainingHours = extraTime24 % 12;

      // Extra KM = max(0, Total KM − 150)
      extraKm = Math.max(0, totalKmTraveled - freeDistance24);

      // Total Bill = Base Rate + (Extra 12Hr Blocks × 500) + (Remaining Hours × 3) + (Extra KM × 3)
      timeCharge = baseRate24 + (extra12HrBlocks * extra12HrBlock) + (remainingHours * extraHourRate24);
      extraKmCharge = extraKm * extraKmRate24;
      totalBill = timeCharge + extraKmCharge;
      break;

    case 'daily':
    case 'day_wise':
      // DAY WISE PLAN: Rate: ₹750/day, Limit: 150km, Extra KM: ₹3, Extra Hr: ₹50
      const dailyRate = ratePlan.rate_day || ratePlan.baseRate || 750;
      const dailyKmLimit = ratePlan.limit_day || ratePlan.kmLimit || 150;
      const dailyExtraKmRate = ratePlan.extra_km || 3;
      const dailyExtraHrRate = ratePlan.extra_hr || 50;
      const availableHours = ratePlan.available_hr || 36;

      // Calculate base days (assume 24 hours per day)
      const baseDays = Math.ceil(totalRentalTimeHours / 24);
      const extraHoursDaily = Math.max(0, totalRentalTimeHours - (availableHours || 24));

      // Extra KM calculation
      extraKm = Math.max(0, totalKmTraveled - (dailyKmLimit * baseDays));

      timeCharge = (dailyRate * baseDays) + (extraHoursDaily * dailyExtraHrRate);
      extraKmCharge = extraKm * dailyExtraKmRate;
      totalBill = timeCharge + extraKmCharge;
      break;

    default:
      // Fallback to simple calculation
      timeCharge = totalRentalTimeHours * (ratePlan.ratePerHour || 50);
      extraKmCharge = Math.max(0, totalKmTraveled - (ratePlan.kmLimit || 0)) * (ratePlan.extraChargePerKm || 3);
      totalBill = timeCharge + extraKmCharge;
      break;
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
};
 