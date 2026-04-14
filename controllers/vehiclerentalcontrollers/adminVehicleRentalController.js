const User = require('../../models/User');
const Vehicle = require('../../models/Vehicle');
const VehicleBooking = require('../../models/VehicleBooking');
const mongoose = require('mongoose');

// ===== Get all vehicle rental sellers =====
const getVehicleRentalSellers = async (req, res) => {
  try {
    const { search, status, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {
      role: 'seller',
      'sellerProfile.sellerType': { $in: ['vehiclerental', 'vehicle'] }
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { 'sellerProfile.storeName': { $regex: search, $options: 'i' } }
      ];
    }

    if (status === 'active') {
      query['sellerProfile.vehicleRentalService.serviceStatus'] = 'active';
    } else if (status === 'inactive') {
      query['sellerProfile.vehicleRentalService.serviceStatus'] = { $ne: 'active' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [sellers, totalCount] = await Promise.all([
      User.find(query)
        .select('name email phone avatar sellerProfile.storeName sellerProfile.storeDescription sellerProfile.vehicleRentalService sellerProfile.sellerType createdAt')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query)
    ]);

    // Enrich each seller with quick stats
    const enrichedSellers = await Promise.all(sellers.map(async (seller) => {
      const [vehicleCount, totalBookings, activeBookings, workerCount] = await Promise.all([
        Vehicle.countDocuments({ sellerId: seller._id }),
        VehicleBooking.countDocuments({
          $or: [{ bookedBy: seller._id }, { vehicleId: { $in: await Vehicle.find({ sellerId: seller._id }).distinct('_id') } }]
        }),
        VehicleBooking.countDocuments({
          bookingStatus: 'ongoing',
          $or: [{ bookedBy: seller._id }, { vehicleId: { $in: await Vehicle.find({ sellerId: seller._id }).distinct('_id') } }]
        }),
        User.countDocuments({ role: 'worker', 'workerProfile.sellerId': seller._id })
      ]);

      return {
        ...seller,
        stats: {
          vehicleCount,
          totalBookings,
          activeBookings,
          workerCount,
          zones: seller.sellerProfile?.vehicleRentalService?.serviceZones?.length || 0
        }
      };
    }));

    res.status(200).json({
      success: true,
      data: {
        sellers: enrichedSellers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalSellers: totalCount,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching vehicle rental sellers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch vehicle rental sellers', error: error.message });
  }
};

// ===== Get single seller overview =====
const getSellerOverview = async (req, res) => {
  try {
    const { sellerId } = req.params;

    const seller = await User.findById(sellerId)
      .select('-password -pushSubscriptions')
      .lean();

    if (!seller || seller.role !== 'seller') {
      return res.status(404).json({ success: false, message: 'Seller not found' });
    }

    const sellerObjId = mongoose.Types.ObjectId.createFromHexString(sellerId);
    const vehicleIds = await Vehicle.find({ sellerId }).distinct('_id');

    // ── All stats in parallel ──
    const [
      // Vehicle status counts
      vehicleTotal,
      vehicleActive,
      vehicleInactive,
      vehicleInMaintenance,
      vehicleBooked,
      vehicleOutOfService,
      // Vehicle availability counts
      vehicleAvailable,
      vehicleNotAvailable,
      vehicleReserved,
      // Vehicle categories
      vehicleCategories,
      // Booking status counts
      totalBookings,
      pendingBookings,
      confirmedBookings,
      ongoingBookings,
      completedBookings,
      cancelledBookings,
      deletedBookings,
      // Payment status counts
      paidBookings,
      unpaidBookings,
      partiallyPaidBookings,
      // Workers
      workerCount,
      activeWorkers,
      // Revenue aggregation (completed + ongoing bookings)
      revenueAgg,
      // Deposit aggregation
      depositAgg,
      // Refund aggregation
      refundAgg,
      // Cash vs online payment breakdown
      paymentBreakdownAgg,
      // Extra charges breakdown
      chargesBreakdownAgg,
      // Booking source breakdown
      bookingSourceAgg,
      // Today's stats
      todayBookingsCount,
      todayRevenueAgg
    ] = await Promise.all([
      // Vehicle status
      Vehicle.countDocuments({ sellerId }),
      Vehicle.countDocuments({ sellerId, status: 'active' }),
      Vehicle.countDocuments({ sellerId, status: 'inactive' }),
      Vehicle.countDocuments({ sellerId, status: 'in-maintenance' }),
      Vehicle.countDocuments({ sellerId, status: 'booked' }),
      Vehicle.countDocuments({ sellerId, status: 'out-of-service' }),
      // Vehicle availability
      Vehicle.countDocuments({ sellerId, availability: 'available' }),
      Vehicle.countDocuments({ sellerId, availability: 'not-available' }),
      Vehicle.countDocuments({ sellerId, availability: 'reserved' }),
      // Categories
      Vehicle.aggregate([
        { $match: { sellerId: sellerObjId } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Booking statuses
      VehicleBooking.countDocuments({ vehicleId: { $in: vehicleIds } }),
      VehicleBooking.countDocuments({ vehicleId: { $in: vehicleIds }, bookingStatus: 'pending' }),
      VehicleBooking.countDocuments({ vehicleId: { $in: vehicleIds }, bookingStatus: 'confirmed' }),
      VehicleBooking.countDocuments({ vehicleId: { $in: vehicleIds }, bookingStatus: 'ongoing' }),
      VehicleBooking.countDocuments({ vehicleId: { $in: vehicleIds }, bookingStatus: 'completed' }),
      VehicleBooking.countDocuments({ vehicleId: { $in: vehicleIds }, bookingStatus: 'cancelled' }),
      VehicleBooking.countDocuments({ vehicleId: { $in: vehicleIds }, isDeletedBySeller: true }),
      // Payment statuses
      VehicleBooking.countDocuments({ vehicleId: { $in: vehicleIds }, paymentStatus: 'paid' }),
      VehicleBooking.countDocuments({ vehicleId: { $in: vehicleIds }, paymentStatus: { $in: ['unpaid', 'pending'] } }),
      VehicleBooking.countDocuments({ vehicleId: { $in: vehicleIds }, paymentStatus: 'partially-paid' }),
      // Workers
      User.countDocuments({ role: 'worker', 'workerProfile.sellerId': sellerObjId }),
      User.countDocuments({ role: 'worker', 'workerProfile.sellerId': sellerObjId, 'workerProfile.isActive': true }),
      // Revenue: totalBill from completed/ongoing bookings
      VehicleBooking.aggregate([
        { $match: { vehicleId: { $in: vehicleIds }, bookingStatus: { $in: ['completed', 'ongoing'] } } },
        { $group: {
          _id: null,
          totalBill: { $sum: '$billing.totalBill' },
          totalBaseAmount: { $sum: '$billing.baseAmount' },
          totalExtraKm: { $sum: '$billing.extraKmCharge' },
          totalExtraHour: { $sum: '$billing.extraHourCharge' },
          totalFuelCharges: { $sum: '$billing.fuelCharges' },
          totalDamageCharges: { $sum: '$billing.damageCharges' },
          totalCleaningCharges: { $sum: '$billing.cleaningCharges' },
          totalTollCharges: { $sum: '$billing.tollCharges' },
          totalLateFees: { $sum: '$billing.lateFees' },
          totalDiscount: { $sum: '$billing.discount.amount' },
          totalPaidAmount: { $sum: '$paidAmount' },
          avgBill: { $avg: '$billing.totalBill' }
        }}
      ]),
      // Deposits
      VehicleBooking.aggregate([
        { $match: { vehicleId: { $in: vehicleIds }, bookingStatus: { $in: ['completed', 'ongoing'] } } },
        { $group: {
          _id: null,
          totalDeposits: { $sum: '$depositAmount' },
          depositsCollected: { $sum: { $cond: [{ $eq: ['$depositStatus', 'collected-at-pickup'] }, '$depositAmount', 0] } },
          depositsRefunded: { $sum: { $cond: [{ $in: ['$depositStatus', ['refunded', 'adjusted']] }, '$depositAmount', 0] } }
        }}
      ]),
      // Refunds
      VehicleBooking.aggregate([
        { $match: { vehicleId: { $in: vehicleIds }, 'refundDetails.approvedAmount': { $gt: 0 } } },
        { $group: {
          _id: null,
          totalRefunded: { $sum: '$refundDetails.approvedAmount' },
          totalCashRefund: { $sum: '$refundDetails.cashAmount' },
          totalOnlineRefund: { $sum: '$refundDetails.onlineAmount' },
          refundCount: { $sum: 1 }
        }}
      ]),
      // Payment method breakdown from payments array
      VehicleBooking.aggregate([
        { $match: { vehicleId: { $in: vehicleIds } } },
        { $unwind: '$payments' },
        { $match: { 'payments.status': 'success', 'payments.amount': { $gt: 0 } } },
        { $group: {
          _id: '$payments.paymentType',
          total: { $sum: '$payments.amount' },
          count: { $sum: 1 }
        }},
        { $sort: { total: -1 } }
      ]),
      // Extra charges breakdown
      VehicleBooking.aggregate([
        { $match: { vehicleId: { $in: vehicleIds }, bookingStatus: { $in: ['completed', 'ongoing'] } } },
        { $group: {
          _id: null,
          extraKm: { $sum: '$billing.extraKmCharge' },
          extraHour: { $sum: '$billing.extraHourCharge' },
          fuel: { $sum: '$billing.fuelCharges' },
          damage: { $sum: '$billing.damageCharges' },
          cleaning: { $sum: '$billing.cleaningCharges' },
          toll: { $sum: '$billing.tollCharges' },
          lateFees: { $sum: '$billing.lateFees' }
        }}
      ]),
      // Booking source breakdown
      VehicleBooking.aggregate([
        { $match: { vehicleId: { $in: vehicleIds } } },
        { $group: { _id: '$bookingSource', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      // Today's bookings
      VehicleBooking.countDocuments({
        vehicleId: { $in: vehicleIds },
        createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
      }),
      // Today's revenue
      VehicleBooking.aggregate([
        { $match: {
          vehicleId: { $in: vehicleIds },
          bookingStatus: { $in: ['completed', 'ongoing'] },
          createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
        }},
        { $group: { _id: null, total: { $sum: '$billing.totalBill' } } }
      ])
    ]);

    const rev = revenueAgg[0] || {};
    const dep = depositAgg[0] || {};
    const ref = refundAgg[0] || {};
    const charges = chargesBreakdownAgg[0] || {};

    // Build cash vs online collected
    const cashCollected = paymentBreakdownAgg.find(p => p._id === 'Cash')?.total || 0;
    const onlineCollected = paymentBreakdownAgg
      .filter(p => p._id !== 'Cash')
      .reduce((sum, p) => sum + p.total, 0);

    const sellerData = {
      ...seller,
      name: seller.name,
      email: seller.email,
      phone: seller.phone,
      businessName: seller.sellerProfile?.storeName || '',
      serviceStatus: seller.sellerProfile?.vehicleRentalService?.serviceStatus || 'inactive',
      zones: seller.sellerProfile?.vehicleRentalService?.serviceZones || [],
      createdAt: seller.createdAt
    };

    res.status(200).json({
      success: true,
      data: {
        seller: sellerData,
        stats: {
          vehicles: {
            total: vehicleTotal,
            active: vehicleActive,
            inactive: vehicleInactive,
            inMaintenance: vehicleInMaintenance,
            booked: vehicleBooked,
            outOfService: vehicleOutOfService,
            available: vehicleAvailable,
            notAvailable: vehicleNotAvailable,
            reserved: vehicleReserved,
            categories: vehicleCategories
          },
          bookings: {
            total: totalBookings,
            pending: pendingBookings,
            confirmed: confirmedBookings,
            inProgress: ongoingBookings,
            completed: completedBookings,
            cancelled: cancelledBookings,
            deleted: deletedBookings,
            today: todayBookingsCount,
            paymentStatus: {
              paid: paidBookings,
              unpaid: unpaidBookings,
              partiallyPaid: partiallyPaidBookings
            },
            sources: bookingSourceAgg.map(s => ({ source: s._id || 'unknown', count: s.count }))
          },
          revenue: {
            totalBill: rev.totalBill || 0,
            totalPaidAmount: rev.totalPaidAmount || 0,
            baseAmount: rev.totalBaseAmount || 0,
            avgBill: Math.round(rev.avgBill || 0),
            todayRevenue: todayRevenueAgg[0]?.total || 0,
            collected: cashCollected + onlineCollected,
            pending: (rev.totalBill || 0) - (rev.totalPaidAmount || 0),
            total: rev.totalBill || 0,
            cashCollected,
            onlineCollected,
            paymentMethods: paymentBreakdownAgg.map(p => ({ method: p._id, amount: p.total, count: p.count })),
            discount: rev.totalDiscount || 0
          },
          deposits: {
            total: dep.totalDeposits || 0,
            collected: dep.depositsCollected || 0,
            refunded: dep.depositsRefunded || 0
          },
          refunds: {
            total: ref.totalRefunded || 0,
            cash: ref.totalCashRefund || 0,
            online: ref.totalOnlineRefund || 0,
            count: ref.refundCount || 0
          },
          extraCharges: {
            extraKm: charges.extraKm || 0,
            extraHour: charges.extraHour || 0,
            fuel: charges.fuel || 0,
            damage: charges.damage || 0,
            cleaning: charges.cleaning || 0,
            toll: charges.toll || 0,
            lateFees: charges.lateFees || 0,
            total: (charges.extraKm || 0) + (charges.extraHour || 0) + (charges.fuel || 0) +
                   (charges.damage || 0) + (charges.cleaning || 0) + (charges.toll || 0) + (charges.lateFees || 0)
          },
          workers: {
            total: workerCount,
            active: activeWorkers,
            inactive: workerCount - activeWorkers
          },
          zones: seller.sellerProfile?.vehicleRentalService?.serviceZones?.length || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching seller overview:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch seller overview', error: error.message });
  }
};

// ===== Get seller's bookings =====
const getSellerBookingsAdmin = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { status, search, startDate, endDate, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc', includeDeleted } = req.query;

    const vehicleIds = await Vehicle.find({ sellerId }).distinct('_id');

    const query = {
      $or: [
        { vehicleId: { $in: vehicleIds } },
        { bookedBy: sellerId }
      ]
    };

    // Admin can toggle seeing deleted bookings
    if (includeDeleted !== 'true') {
      query.isDeletedBySeller = { $ne: true };
    }

    if (status) {
      if (status === 'deleted') {
        query.isDeletedBySeller = true;
      } else {
        query.bookingStatus = status;
      }
    }

    if (search) {
      query.$or = [
        { bookingId: { $regex: search, $options: 'i' } },
        { 'customerDetails.name': { $regex: search, $options: 'i' } },
        { 'customerDetails.phone': { $regex: search, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortObj = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [bookings, totalCount] = await Promise.all([
      VehicleBooking.find(query)
        .populate('vehicleId', 'name brand model vehicleNo category type images')
        .populate('userId', 'name phone email avatar')
        .populate('bookedBy', 'name phone email')
        .sort(sortObj)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      VehicleBooking.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalBookings: totalCount,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching seller bookings for admin:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch seller bookings', error: error.message });
  }
};

// ===== Get seller's vehicles =====
const getSellerVehiclesAdmin = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { status, category, search, page = 1, limit = 20 } = req.query;

    const query = { sellerId };

    if (status) query.status = status;
    if (category) query.category = category;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { model: { $regex: search, $options: 'i' } },
        { vehicleNo: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [vehicles, totalCount] = await Promise.all([
      Vehicle.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Vehicle.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        vehicles,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalVehicles: totalCount,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching seller vehicles for admin:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch seller vehicles', error: error.message });
  }
};

// ===== Get seller's workers =====
const getSellerWorkersAdmin = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { status, search, page = 1, limit = 20 } = req.query;

    const query = {
      role: 'worker',
      'workerProfile.sellerId': sellerId
    };

    if (status === 'active') query['workerProfile.isActive'] = true;
    if (status === 'inactive') query['workerProfile.isActive'] = false;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [workers, totalCount] = await Promise.all([
      User.find(query)
        .select('name email phone avatar workerProfile createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        workers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalCount / parseInt(limit)),
          totalWorkers: totalCount,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching seller workers for admin:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch seller workers', error: error.message });
  }
};

// ===== Get seller's income analysis =====
const getSellerIncomeAnalysis = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { startDate, endDate, groupBy = 'day' } = req.query;

    const vehicleIds = await Vehicle.find({ sellerId }).distinct('_id');

    // Default to last 30 days
    const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const matchStage = {
      vehicleId: { $in: vehicleIds },
      bookingStatus: { $in: ['completed', 'ongoing'] },
      createdAt: { $gte: start, $lte: end }
    };

    // Group format based on groupBy
    let dateFormat;
    switch (groupBy) {
      case 'month':
        dateFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt', timezone: '+05:30' } };
        break;
      case 'week':
        dateFormat = { $dateToString: { format: '%Y-W%V', date: '$createdAt', timezone: '+05:30' } };
        break;
      default:
        dateFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+05:30' } };
    }

    const [incomeByPeriod, incomeByVehicle, incomeByPaymentMode, summary] = await Promise.all([
      // Revenue over time
      VehicleBooking.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: dateFormat,
            revenue: { $sum: '$billing.finalAmount' },
            bookings: { $sum: 1 },
            cashCollected: { $sum: { $ifNull: ['$cashFlowDetails.cashPaymentDetails.totalCashReceived', 0] } }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Revenue by vehicle
      VehicleBooking.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$vehicleId',
            revenue: { $sum: '$billing.finalAmount' },
            bookings: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'vehicles',
            localField: '_id',
            foreignField: '_id',
            as: 'vehicle'
          }
        },
        { $unwind: '$vehicle' },
        {
          $project: {
            vehicleName: '$vehicle.name',
            vehicleNo: '$vehicle.vehicleNo',
            brand: '$vehicle.brand',
            model: '$vehicle.model',
            revenue: 1,
            bookings: 1
          }
        },
        { $sort: { revenue: -1 } }
      ]),

      // Revenue by payment mode
      VehicleBooking.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$paymentMode',
            revenue: { $sum: '$billing.finalAmount' },
            bookings: { $sum: 1 }
          }
        },
        { $sort: { revenue: -1 } }
      ]),

      // Overall summary
      VehicleBooking.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$billing.finalAmount' },
            totalBookings: { $sum: 1 },
            avgBookingValue: { $avg: '$billing.finalAmount' },
            totalCashCollected: { $sum: { $ifNull: ['$cashFlowDetails.cashPaymentDetails.totalCashReceived', 0] } },
            totalOnlinePayments: {
              $sum: {
                $cond: [{ $eq: ['$paymentMode', 'online'] }, '$billing.finalAmount', 0]
              }
            }
          }
        }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        summary: summary[0] || { totalRevenue: 0, totalBookings: 0, avgBookingValue: 0, totalCashCollected: 0, totalOnlinePayments: 0 },
        incomeByPeriod,
        incomeByVehicle,
        incomeByPaymentMode,
        filters: { startDate: start, endDate: end, groupBy }
      }
    });
  } catch (error) {
    console.error('Error fetching seller income analysis:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch income analysis', error: error.message });
  }
};

module.exports = {
  getVehicleRentalSellers,
  getSellerOverview,
  getSellerBookingsAdmin,
  getSellerVehiclesAdmin,
  getSellerWorkersAdmin,
  getSellerIncomeAnalysis
};