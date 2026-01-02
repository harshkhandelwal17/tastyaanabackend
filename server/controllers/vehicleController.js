const Vehicle = require('../models/Vehicle');
const VehicleBooking = require('../models/VehicleBooking');
const User = require('../models/User');
const mongoose = require('mongoose');

// ===== VEHICLE MANAGEMENT =====

// Get all vehicles with filtering
const getVehicles = async (req, res) => {
  try {
    const {
      category,
      type,
      zoneCode,
      status,
      availability,
      sellerId,
      fuelType,
      brand,
      minPrice,
      maxPrice,
      priceType = 'hourly', // 'hourly' or 'daily'
      page = 1,
      limit = 100,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    // Build filter object
    let filter = {};

    if (category) filter.category = category;
    if (type) filter.category = type;
    if (zoneCode) filter.zoneCode = zoneCode;
    if (status) filter.status = status;
    if (availability) filter.availability = availability;
    if (sellerId) filter.sellerId = sellerId;
    if (fuelType) filter.fuelType = fuelType;
    if (brand) filter.companyName = new RegExp(brand, 'i');

    // Price range filtering
    if (minPrice || maxPrice) {
      const priceField = priceType === 'daily' ? 'ratePerDay' : 'ratePerHour';
      filter[priceField] = {};
      if (minPrice) filter[priceField].$gte = Number(minPrice);
      if (maxPrice) filter[priceField].$lte = Number(maxPrice);
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { vehicleNo: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { zoneCenterName: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    let vehicles = await Vehicle.find(filter)
      .populate('sellerId', 'name email phone sellerProfile.storeName sellerProfile.profileImage sellerProfile.rating')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Check availability and get next available time for booked vehicles
    const vehiclesWithAvailability = await Promise.all(vehicles.map(async (vehicle) => {
      const vehicleObj = vehicle.toObject();

      if (vehicleObj.availability === 'booked') {
        // Get next available time
        const activeBookings = await VehicleBooking.find({
          vehicleId: vehicle._id,
          bookingStatus: { $in: ['confirmed', 'ongoing'] },
          endDateTime: { $gte: new Date() }
        }).sort({ endDateTime: 1 });

        if (activeBookings.length > 0) {
          vehicleObj.nextAvailableTime = activeBookings[0].endDateTime;
        } else {
          // No active bookings, should be available
          vehicleObj.availability = 'available';
        }
      }

      return vehicleObj;
    }));

    let total = await Vehicle.countDocuments(filter);

    // If no vehicles found for public requests, provide helpful debugging info
    if (vehicles.length === 0 && req.originalUrl.includes('/public')) {
      const totalVehiclesInDB = await Vehicle.countDocuments({});
      console.log(`No vehicles found for filter:`, filter);
      console.log(`Total vehicles in database: ${totalVehiclesInDB}`);

      if (totalVehiclesInDB === 0) {
        console.log('Vehicle database is empty. Please add vehicles via admin panel or API.');
      } else {
        console.log('Vehicles exist but none match the current filter criteria.');
      }
    }

    res.json({
      success: true,
      data: vehiclesWithAvailability,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      filter: filter, // Include filter in response for debugging
      debug: req.originalUrl.includes('/public') && vehicles.length === 0 ? {
        message: 'No vehicles found',
        totalInDatabase: await Vehicle.countDocuments({}),
        appliedFilters: filter
      } : undefined
    });
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicles',
      error: error.message
    });
  }
};

// Get single vehicle by ID
const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid vehicle ID format'
      });
    }

    const vehicle = await Vehicle.findById(id)
      .populate('sellerId', 'name email phone sellerProfile.storeName sellerProfile.ratings');

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Get recent bookings for this vehicle
    // Get recent bookings for this vehicle
    const recentBookings = await VehicleBooking.find({ vehicleId: id })
      .populate('userId', 'name phone')
      .sort({ bookingDate: -1 })
      .limit(5);

    // Get all future booked slots for calendar blocking
    const futureBookings = await VehicleBooking.find({
      vehicleId: id,
      bookingStatus: { $in: ['confirmed', 'ongoing', 'awaiting_approval'] },
      endDateTime: { $gte: new Date() }
    })
      .select('startDateTime endDateTime -_id')
      .sort({ startDateTime: 1 });

    const bookedSlots = futureBookings.map(booking => ({
      start: booking.startDateTime,
      end: booking.endDateTime
    }));

    // Calculate next available time only if currently booked
    let nextAvailableTime = null;
    const now = new Date();
    // Check if currently inside a booking
    const currentBooking = futureBookings.find(b =>
      new Date(b.startDateTime) <= now && new Date(b.endDateTime) > now
    );

    if (currentBooking) {
      nextAvailableTime = currentBooking.endDateTime;
    }

    res.json({
      success: true,
      data: {
        vehicle: {
          ...vehicle.toObject(),
          nextAvailableTime,
          bookedSlots // Include the list of busy slots
        },
        recentBookings
      }
    });
  } catch (error) {
    console.error('Error fetching vehicle:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle',
      error: error.message
    });
  }
};

// Create new vehicle
const createVehicle = async (req, res) => {
  try {
    const vehicleData = req.body;

    // Validate seller exists and has vehicle rental service enabled
    const seller = await User.findById(vehicleData.sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: 'Seller not found'
      });
    }

    if (!seller.sellerProfile?.vehicleRentalService?.isEnabled) {
      return res.status(403).json({
        success: false,
        message: 'Seller does not have vehicle rental service enabled'
      });
    }

    // Check if vehicle number already exists
    const existingVehicle = await Vehicle.findOne({ vehicleNo: vehicleData.vehicleNo });
    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle with this number already exists'
      });
    }

    const vehicle = new Vehicle(vehicleData);
    await vehicle.save();

    // Update seller's fleet stats
    await updateSellerFleetStats(vehicleData.sellerId);

    res.status(201).json({
      success: true,
      message: 'Vehicle created successfully',
      data: vehicle
    });
  } catch (error) {
    console.error('Error creating vehicle:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
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
    const { id } = req.params;
    const updateData = req.body;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check permission (only seller or admin can update)
    if (req.user.role !== 'admin' && vehicle.sellerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this vehicle'
      });
    }

    // If vehicle number is being changed, check for duplicates
    if (updateData.vehicleNo && updateData.vehicleNo !== vehicle.vehicleNo) {
      const existingVehicle = await Vehicle.findOne({ vehicleNo: updateData.vehicleNo });
      if (existingVehicle) {
        return res.status(400).json({
          success: false,
          message: 'Vehicle with this number already exists'
        });
      }
    }

    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('sellerId', 'name email phone sellerProfile.storeName');

    // Update seller's fleet stats if category changed
    if (updateData.category) {
      await updateSellerFleetStats(vehicle.sellerId);
    }

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
    const { id } = req.params;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check permission
    if (req.user.role !== 'admin' && vehicle.sellerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this vehicle'
      });
    }

    // Check for active bookings
    const activeBookings = await VehicleBooking.countDocuments({
      vehicleId: id,
      bookingStatus: { $in: ['confirmed', 'ongoing'] }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete vehicle with active bookings'
      });
    }

    await Vehicle.findByIdAndDelete(id);

    // Update seller's fleet stats
    await updateSellerFleetStats(vehicle.sellerId);

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

// ===== VEHICLE AVAILABILITY =====

// Check vehicle availability for booking
const checkAvailability = async (req, res) => {
  try {
    const { vehicleId, startDateTime, endDateTime } = req.body;

    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    if (!vehicle.isAvailableForBooking()) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is not available for booking',
        reason: `Status: ${vehicle.status}, Availability: ${vehicle.availability}`
      });
    }

    // Check for conflicting bookings
    const conflictingBookings = await VehicleBooking.find({
      vehicleId,
      bookingStatus: { $in: ['confirmed', 'ongoing'] },
      $or: [
        {
          startDateTime: { $lte: new Date(startDateTime) },
          endDateTime: { $gt: new Date(startDateTime) }
        },
        {
          startDateTime: { $lt: new Date(endDateTime) },
          endDateTime: { $gte: new Date(endDateTime) }
        },
        {
          startDateTime: { $gte: new Date(startDateTime) },
          endDateTime: { $lte: new Date(endDateTime) }
        }
      ]
    });

    if (conflictingBookings.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Vehicle is not available for the requested time slot',
        conflictingBookings: conflictingBookings.map(booking => ({
          bookingId: booking.bookingId,
          startDateTime: booking.startDateTime,
          endDateTime: booking.endDateTime
        }))
      });
    }

    res.json({
      success: true,
      message: 'Vehicle is available for booking',
      data: {
        available: true,
        vehicle: {
          id: vehicle._id,
          name: vehicle.name,
          category: vehicle.category,
          type: vehicle.type,
          rates: {
            rate12hr: vehicle.rate12hr,
            rate24hr: vehicle.rate24hr,
            depositAmount: vehicle.depositAmount
          }
        }
      }
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check availability',
      error: error.message
    });
  }
};

// ===== VEHICLE ANALYTICS =====

// Get vehicle analytics
const getVehicleAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const vehicle = await Vehicle.findById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    // Check permission
    if (req.user.role !== 'admin' && vehicle.sellerId.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view analytics for this vehicle'
      });
    }

    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        bookingDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // Get booking statistics
    const bookingStats = await VehicleBooking.aggregate([
      {
        $match: {
          vehicleId: vehicle._id,
          ...dateFilter
        }
      },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalRevenue: { $sum: '$billing.totalBill' },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$bookingStatus', 'completed'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$bookingStatus', 'cancelled'] }, 1, 0] }
          },
          averageBookingValue: { $avg: '$billing.totalBill' },
          totalHoursRented: {
            $sum: {
              $divide: [
                { $subtract: ['$endDateTime', '$startDateTime'] },
                1000 * 60 * 60
              ]
            }
          }
        }
      }
    ]);

    // Get monthly booking trends
    const monthlyTrends = await VehicleBooking.aggregate([
      {
        $match: {
          vehicleId: vehicle._id,
          ...dateFilter
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$bookingDate' },
            month: { $month: '$bookingDate' }
          },
          bookings: { $sum: 1 },
          revenue: { $sum: '$billing.totalBill' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.json({
      success: true,
      data: {
        vehicle: {
          id: vehicle._id,
          name: vehicle.name,
          vehicleNo: vehicle.vehicleNo,
          category: vehicle.category
        },
        statistics: bookingStats[0] || {
          totalBookings: 0,
          totalRevenue: 0,
          completedBookings: 0,
          cancelledBookings: 0,
          averageBookingValue: 0,
          totalHoursRented: 0
        },
        monthlyTrends,
        currentAnalytics: vehicle.analytics
      }
    });
  } catch (error) {
    console.error('Error fetching vehicle analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle analytics',
      error: error.message
    });
  }
};

// ===== HELPER FUNCTIONS =====

// Update seller's fleet statistics
const updateSellerFleetStats = async (sellerId) => {
  try {
    const stats = await Vehicle.aggregate([
      { $match: { sellerId: sellerId } },
      {
        $group: {
          _id: null,
          totalVehicles: { $sum: 1 },
          activeVehicles: {
            $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
          },
          bikes: {
            $sum: { $cond: [{ $eq: ['$category', 'bike'] }, 1, 0] }
          },
          cars: {
            $sum: { $cond: [{ $eq: ['$category', 'car'] }, 1, 0] }
          },
          scooties: {
            $sum: { $cond: [{ $eq: ['$category', 'scooty'] }, 1, 0] }
          },
          buses: {
            $sum: { $cond: [{ $eq: ['$category', 'bus'] }, 1, 0] }
          },
          trucks: {
            $sum: { $cond: [{ $eq: ['$category', 'truck'] }, 1, 0] }
          }
        }
      }
    ]);

    if (stats.length > 0) {
      const fleetData = stats[0];
      await User.findByIdAndUpdate(sellerId, {
        'sellerProfile.vehicleRentalService.fleetStats': {
          totalVehicles: fleetData.totalVehicles,
          activeVehicles: fleetData.activeVehicles,
          vehicleCategories: {
            bikes: fleetData.bikes,
            cars: fleetData.cars,
            scooties: fleetData.scooties,
            buses: fleetData.buses,
            trucks: fleetData.trucks
          },
          lastUpdated: new Date()
        }
      });
    }
  } catch (error) {
    console.error('Error updating fleet stats:', error);
  }
};

// ===== NEW VEHICLE LISTING FEATURES =====

// Get vehicle shops with their details and vehicle counts
const getVehicleShops = async (req, res) => {
  try {
    const { zoneCode } = req.query;

    // Build filter for vehicles
    let vehicleFilter = { status: 'active' };
    if (zoneCode) vehicleFilter.zoneCode = zoneCode;

    // Get shops with their vehicle counts and details
    const shops = await Vehicle.aggregate([
      { $match: vehicleFilter },
      {
        $group: {
          _id: '$sellerId',
          vehicleCount: { $sum: 1 },
          availableCount: {
            $sum: { $cond: [{ $eq: ['$availability', 'available'] }, 1, 0] }
          },
          vehicleTypes: { $addToSet: '$type' },
          priceRange: {
            $push: {
              $cond: [
                { $and: [{ $ne: ['$ratePerHour', null] }, { $gt: ['$ratePerHour', 0] }] },
                '$ratePerHour',
                '$ratePerDay'
              ]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'seller'
        }
      },
      { $unwind: '$seller' },
      {
        $match: {
          'seller.sellerProfile.vehicleRentalService.isEnabled': true
        }
      },
      {
        $project: {
          _id: 1,
          shopName: '$seller.sellerProfile.storeName',
          ownerName: '$seller.name',
          phone: '$seller.phone',
          email: '$seller.email',
          address: '$seller.sellerProfile.address',
          profileImage: '$seller.sellerProfile.profileImage',
          shopLogo: '$seller.sellerProfile.shopLogo',
          vehicleCount: 1,
          availableCount: 1,
          vehicleTypes: 1,
          minPrice: { $min: '$priceRange' },
          maxPrice: { $max: '$priceRange' },
          rating: '$seller.sellerProfile.rating',
          totalReviews: '$seller.sellerProfile.totalReviews',
          zoneCode: '$seller.sellerProfile.vehicleRentalService.operationalAreas'
        }
      },
      { $sort: { vehicleCount: -1, rating: -1 } }
    ]);

    res.json({
      success: true,
      data: shops,
      total: shops.length
    });
  } catch (error) {
    console.error('Error fetching vehicle shops:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle shops',
      error: error.message
    });
  }
};

// Get vehicle types with counts and details
const getVehicleTypes = async (req, res) => {
  try {
    const { zoneCode, shopId } = req.query;

    // Build filter
    let filter = { status: 'active' };
    if (zoneCode) filter.zoneCode = zoneCode;
    if (shopId) filter.sellerId = shopId;

    const vehicleTypes = await Vehicle.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          availableCount: {
            $sum: { $cond: [{ $eq: ['$availability', 'available'] }, 1, 0] }
          },
          minPrice: {
            $min: {
              $cond: [
                { $and: [{ $ne: ['$ratePerHour', null] }, { $gt: ['$ratePerHour', 0] }] },
                '$ratePerHour',
                '$ratePerDay'
              ]
            }
          },
          maxPrice: {
            $max: {
              $cond: [
                { $and: [{ $ne: ['$ratePerHour', null] }, { $gt: ['$ratePerHour', 0] }] },
                '$ratePerHour',
                '$ratePerDay'
              ]
            }
          },
          fuelTypes: { $addToSet: '$fuelType' },
          brands: { $addToSet: '$companyName' }
        }
      },
      {
        $project: {
          _id: 0,
          type: '$_id',
          count: 1,
          availableCount: 1,
          minPrice: 1,
          maxPrice: 1,
          fuelTypes: 1,
          brands: 1,
          icon: {
            $switch: {
              branches: [
                { case: { $eq: ['$_id', 'bike'] }, then: '🏍️' },
                { case: { $eq: ['$_id', 'car'] }, then: '🚗' },
                { case: { $eq: ['$_id', 'scooty'] }, then: '🛵' },
                { case: { $eq: ['$_id', 'ev-bike'] }, then: '⚡🏍️' },
                { case: { $eq: ['$_id', 'ev-scooty'] }, then: '⚡🛵' },
                { case: { $eq: ['$_id', 'ev-car'] }, then: '⚡🚗' },
                { case: { $eq: ['$_id', 'bus'] }, then: '🚌' },
                { case: { $eq: ['$_id', 'truck'] }, then: '🚛' }
              ],
              default: '🚗'
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: vehicleTypes
    });
  } catch (error) {
    console.error('Error fetching vehicle types:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch vehicle types',
      error: error.message
    });
  }
};

// Get all filter options for the vehicles page
const getFilterOptions = async (req, res) => {
  try {
    const { zoneCode } = req.query;

    // Build base filter
    let filter = { status: 'active' };
    if (zoneCode) filter.zoneCode = zoneCode;

    // Get all unique filter values
    const [fuelTypes, brands, zones, priceStats] = await Promise.all([
      // Fuel types
      Vehicle.distinct('fuelType', filter),

      // Brands
      Vehicle.distinct('companyName', filter),

      // Zones
      Vehicle.distinct('zoneCode', filter),

      // Price statistics
      Vehicle.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            minHourlyRate: {
              $min: {
                $cond: [
                  { $and: [{ $ne: ['$ratePerHour', null] }, { $gt: ['$ratePerHour', 0] }] },
                  '$ratePerHour',
                  null
                ]
              }
            },
            maxHourlyRate: {
              $max: {
                $cond: [
                  { $and: [{ $ne: ['$ratePerHour', null] }, { $gt: ['$ratePerHour', 0] }] },
                  '$ratePerHour',
                  null
                ]
              }
            },
            minDailyRate: {
              $min: {
                $cond: [
                  { $and: [{ $ne: ['$ratePerDay', null] }, { $gt: ['$ratePerDay', 0] }] },
                  '$ratePerDay',
                  null
                ]
              }
            },
            maxDailyRate: {
              $max: {
                $cond: [
                  { $and: [{ $ne: ['$ratePerDay', null] }, { $gt: ['$ratePerDay', 0] }] },
                  '$ratePerDay',
                  null
                ]
              }
            }
          }
        }
      ])
    ]);

    // Get zone details
    const zoneDetails = await Vehicle.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$zoneCode',
          centerName: { $first: '$zoneCenterName' },
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          code: '$_id',
          name: '$centerName',
          count: 1
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        fuelTypes: fuelTypes.filter(Boolean).map(fuel => ({
          value: fuel,
          label: fuel.charAt(0).toUpperCase() + fuel.slice(1),
          icon: fuel.includes('electric') || fuel.includes('ev') ? '⚡' :
            fuel.includes('petrol') ? '⛽' :
              fuel.includes('diesel') ? '🛢️' : '⛽'
        })),
        brands: brands.filter(Boolean).sort(),
        zones: zoneDetails,
        priceRange: priceStats[0] || {
          minHourlyRate: 0,
          maxHourlyRate: 1000,
          minDailyRate: 0,
          maxDailyRate: 5000
        },
        vehicleTypes: [
          { value: 'bike', label: 'Bike', icon: '🏍️' },
          { value: 'car', label: 'Car', icon: '🚗' },
          { value: 'scooty', label: 'Scooty', icon: '🛵' },
          { value: 'ev-bike', label: 'Electric Bike', icon: '⚡🏍️' },
          { value: 'ev-scooty', label: 'Electric Scooty', icon: '⚡🛵' },
          { value: 'ev-car', label: 'Electric Car', icon: '⚡🚗' },
          { value: 'bus', label: 'Bus', icon: '🚌' },
          { value: 'truck', label: 'Truck', icon: '🚛' }
        ]
      }
    });
  } catch (error) {
    console.error('Error fetching filter options:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch filter options',
      error: error.message
    });
  }
};

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  checkAvailability,
  getVehicleAnalytics,
  getVehicleShops,
  getVehicleTypes,
  getFilterOptions
};