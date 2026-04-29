const VehicleBooking = require('../models/VehicleBooking');
const Vehicle = require('../models/Vehicle');

// Get comprehensive revenue analytics for seller
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super-admin';
    const sellerId = req.user.id || req.user._id;
    const { startDate, endDate, period = 'all', zoneCode } = req.query;

    console.log('Revenue Analytics Request:', { sellerId, isAdmin, startDate, endDate, period, zoneCode });

    // Get vehicles
    const vehicleFilter = {};
    if (!isAdmin) {
      vehicleFilter.sellerId = sellerId;
    }
    if (zoneCode && zoneCode !== 'all') {
      vehicleFilter.zoneCode = zoneCode;
    }

    const sellerVehicles = await Vehicle.find(vehicleFilter);

    const vehicleIds = sellerVehicles.map(v => v._id);

    if (vehicleIds.length === 0) {
      return res.json({
        success: true,
        data: {
          totalRevenue: 0,
          cashRevenue: 0,
          onlineRevenue: 0,
          totalRefunds: 0,
          maintenanceCosts: 0,
          netRevenue: 0,
          totalBookings: 0,
          paymentTypeBreakdown: {},
          dailyBreakdown: [],
          vehicleWiseRevenue: [],
          bookingsList: []
        }
      });
    }

    // Build date range
    const now = new Date();
    let start, end;

    if (period === 'today') {
      start = new Date(now);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'week') {
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'month') {
      start = new Date(now);
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'custom' && startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      // 'all' - use a very early date
      start = new Date(0);
      end = new Date(now.getFullYear() + 10, 11, 31);
    }

    // Define query to match bookings with activity in the date range
    // We fetch any booking that has a payment OR refund in the range
    // --- OPTIMIZED AGGREGATION PIPELINE ---
    const revenueAgg = await VehicleBooking.aggregate([
      { $match: { vehicleId: { $in: vehicleIds } } },
      {
        $facet: {
          // Calculate payments within range
          payments: [
            { $unwind: "$payments" },
            { 
              $match: { 
                "payments.status": "success",
                "payments.paymentDate": { $gte: start, $lte: end }
              } 
            },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$payments.paymentDate" } },
                cashIn: { $sum: { $cond: [{ $eq: ["$payments.paymentType", "Cash"] }, "$payments.amount", 0] } },
                onlineIn: { $sum: { $cond: [{ $ne: ["$payments.paymentType", "Cash"] }, "$payments.amount", 0] } },
                totalIn: { $sum: "$payments.amount" },
                count: { $sum: 1 }
              }
            }
          ],
          // Calculate refunds within range
          refunds: [
            { 
              $match: { 
                "refundDetails.processedDate": { $gte: start, $lte: end }
              } 
            },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$refundDetails.processedDate" } },
                amount: { $sum: { $ifNull: ["$refundDetails.approvedAmount", 0] } },
                count: { $sum: 1 }
              }
            }
          ],
          // Vehicle-wise revenue (payments in range)
          vehicleRevenue: [
            { $unwind: "$payments" },
            { 
              $match: { 
                "payments.status": "success",
                "payments.paymentDate": { $gte: start, $lte: end }
              } 
            },
            {
              $group: {
                _id: "$vehicleId",
                revenue: { $sum: "$payments.amount" },
                bookings: { $addToSet: "$_id" }
              }
            },
            {
              $set: {
                vehicleId: {
                  $convert: {
                    input: "$vehicleId",
                    to: "objectId",
                    onError: "$vehicleId",
                    onNull: "$vehicleId"
                  }
                }
              }
            },
            {
              $lookup: {
                from: "vehicles",
                localField: "vehicleId",
                foreignField: "_id",
                as: "vehicleInfo"
              }
            },
            { $unwind: { path: "$vehicleInfo", preserveNullAndEmptyArrays: true } },
            {
              $project: {
                vehicleId: "$_id",
                vehicleName: { 
                  $trim: { 
                    input: { 
                      $concat: [
                        { $ifNull: ["$vehicleInfo.companyName", ""] }, 
                        " ", 
                        { $ifNull: ["$vehicleInfo.name", "Unknown"] }
                      ] 
                    } 
                  } 
                },
                registrationNumber: { $ifNull: ["$vehicleInfo.vehicleNo", "N/A"] },
                revenue: 1,
                bookingsCount: { $size: "$bookings" }
              }
            }
          ]
        }
      }
    ]);

    // Process aggregated results into the ledger
    const results = revenueAgg[0];
    const ledger = {};
    
    // Initialize period if not 'all'
    if (period !== 'all') {
      let curr = new Date(start);
      while (curr <= end) {
        const dStr = curr.toISOString().split('T')[0];
        ledger[dStr] = { date: dStr, cashIn: 0, onlineIn: 0, totalIn: 0, refunds: 0, maintenance: 0, moneyOut: 0, net: 0, transactions: 0 };
        curr.setDate(curr.getDate() + 1);
      }
    }

    let analytics = {
      totalRevenue: 0,
      cashRevenue: 0,
      onlineRevenue: 0,
      totalRefunds: 0,
      maintenanceCosts: 0,
      netRevenue: 0,
      totalBookings: 0,
      paymentTypeBreakdown: {},
      vehicleWiseRevenue: {},
      bookingsList: [] // We'll still fetch this with a limit for the UI
    };

    // Fill ledger with payment data
    results.payments.forEach(p => {
      if (!ledger[p._id]) {
        ledger[p._id] = { date: p._id, cashIn: 0, onlineIn: 0, totalIn: 0, refunds: 0, maintenance: 0, moneyOut: 0, net: 0, transactions: 0 };
      }
      ledger[p._id].cashIn = p.cashIn;
      ledger[p._id].onlineIn = p.onlineIn;
      ledger[p._id].totalIn = p.totalIn;
      ledger[p._id].net += p.totalIn;
      ledger[p._id].transactions = p.count;

      analytics.cashRevenue += p.cashIn;
      analytics.onlineRevenue += p.onlineIn;
      analytics.totalRevenue += p.totalIn;
    });

    // Fill ledger with refund data
    results.refunds.forEach(r => {
      if (!ledger[r._id]) {
        ledger[r._id] = { date: r._id, cashIn: 0, onlineIn: 0, totalIn: 0, refunds: 0, maintenance: 0, moneyOut: 0, net: 0, transactions: 0 };
      }
      ledger[r._id].refunds = r.amount;
      ledger[r._id].moneyOut += r.amount;
      ledger[r._id].net -= r.amount;
      analytics.totalRefunds += r.amount;
    });

    // Handle vehicle stats
    const vehicleStats = results.vehicleRevenue;
    for (const stat of vehicleStats) {
      analytics.vehicleWiseRevenue[stat.vehicleId] = {
        vehicleName: stat.vehicleName,
        registrationNumber: stat.registrationNumber,
        revenue: stat.revenue,
        bookings: stat.bookingsCount
      };
    }

    const bookingsQuery = {
      vehicleId: { $in: vehicleIds },
      $or: [
        { 'payments.paymentDate': { $gte: start, $lte: end } },
        { 'refundDetails.processedDate': { $gte: start, $lte: end } }
      ]
    };

    // Fetch recent bookings for the list (limited for performance)
    const recentBookings = await VehicleBooking.find(bookingsQuery)
      .populate('vehicleId', 'companyName name vehicleNo')
      .sort({ bookingDate: -1 })
      .limit(100);

    analytics.bookingsList = recentBookings.map(booking => {
      let cash = 0, online = 0;
      booking.payments?.forEach(p => {
        if (p.status === 'success' && p.paymentDate >= start && p.paymentDate <= end) {
          if (p.paymentType === 'Cash') cash += p.amount;
          else online += p.amount;
        }
      });

      return {
        bookingId: booking.bookingId,
        vehicleName: booking.vehicleId 
          ? `${booking.vehicleId.companyName || ''} ${booking.vehicleId.name || ''}`.trim() 
          : `Unknown (ID: ${booking.vehicleId?.toString() || 'Missing'})`,
        registrationNumber: booking.vehicleId?.vehicleNo || 'N/A',
        customerName: booking.customerDetails?.name,
        cashAmount: cash,
        onlineAmount: online,
        totalAmount: cash + online,
        refundAmount: (booking.refundDetails?.processedDate >= start && booking.refundDetails?.processedDate <= end) 
          ? (booking.refundDetails?.approvedAmount || 0) : 0,
        paymentStatus: booking.paymentStatus,
        bookingDate: booking.bookingDate
      };
    });

    analytics.totalBookings = analytics.bookingsList.length;

    // 3. Process Maintenance Costs from Vehicles
    sellerVehicles.forEach(vehicle => {
      if (vehicle.maintenance && vehicle.maintenance.length > 0) {
        vehicle.maintenance.forEach(m => {
          if (m.isCompleted && m.lastServicingDate >= start && m.lastServicingDate <= end) {
            const dateStr = new Date(m.lastServicingDate).toISOString().split('T')[0];

            if (!ledger[dateStr]) {
              ledger[dateStr] = { date: dateStr, cashIn: 0, onlineIn: 0, totalIn: 0, refunds: 0, maintenance: 0, moneyOut: 0, net: 0, transactions: 0 };
            }

            const cost = m.serviceCost || 0;
            ledger[dateStr].maintenance += cost;
            ledger[dateStr].moneyOut += cost;
            ledger[dateStr].net -= cost;
            analytics.maintenanceCosts += cost;
          }
        });
      }
    });

    // Final calculations
    analytics.netRevenue = analytics.totalRevenue - analytics.totalRefunds - analytics.maintenanceCosts;
    analytics.dailyBreakdown = Object.values(ledger).sort((a, b) => a.date.localeCompare(b.date));
    analytics.vehicleWiseRevenue = Object.values(analytics.vehicleWiseRevenue).sort((a, b) => b.revenue - a.revenue);
    analytics.bookingsList.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));

    return res.json({
      success: true,
      data: analytics
    });

  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch revenue analytics',
      error: error.message
    });
  }
};

exports.getMonthlyComparison = async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'super-admin';
    const sellerId = req.user.id || req.user._id;
    const { months = 6, zoneCode } = req.query;

    // Get seller's vehicles with optional zone filtering
    const vehicleFilter = {};
    if (!isAdmin) {
      vehicleFilter.sellerId = sellerId;
    }
    if (zoneCode && zoneCode !== 'all') {
      vehicleFilter.zoneCode = zoneCode;
    }

    const sellerVehicles = await Vehicle.find(vehicleFilter).select('_id');
    const vehicleIds = sellerVehicles.map(v => v._id);

    const now = new Date();
    const monthsCount = parseInt(months);
    const startDate = new Date(now.getFullYear(), now.getMonth() - monthsCount + 1, 1);

    const monthlyAgg = await VehicleBooking.aggregate([
      { 
        $match: { 
          vehicleId: { $in: vehicleIds },
          bookingDate: { $gte: startDate }
        } 
      },
      { $unwind: { path: "$payments", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { 
            year: { $year: "$bookingDate" },
            month: { $month: "$bookingDate" }
          },
          totalRevenue: { 
            $sum: { 
              $cond: [
                { $eq: ["$payments.status", "success"] }, 
                "$payments.amount", 
                0
              ] 
            } 
          },
          cashRevenue: { 
            $sum: { 
              $cond: [
                { $and: [
                  { $eq: ["$payments.status", "success"] },
                  { $eq: ["$payments.paymentType", "Cash"] }
                ]}, 
                "$payments.amount", 
                0
              ] 
            } 
          },
          onlineRevenue: { 
            $sum: { 
              $cond: [
                { $and: [
                  { $eq: ["$payments.status", "success"] },
                  { $ne: ["$payments.paymentType", "Cash"] }
                ]}, 
                "$payments.amount", 
                0
              ] 
            } 
          },
          refunds: { $sum: { $ifNull: ["$refundDetails.approvedAmount", 0] } },
          bookingsCount: { $addToSet: "$_id" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const monthlyData = monthlyAgg.map(item => {
      const monthName = new Date(item._id.year, item._id.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' });
      return {
        month: monthName,
        totalRevenue: item.totalRevenue,
        cashRevenue: item.cashRevenue,
        onlineRevenue: item.onlineRevenue,
        refunds: item.refunds,
        netRevenue: item.totalRevenue - item.refunds,
        bookings: item.bookingsCount.length
      };
    });

    res.json({
      success: true,
      data: monthlyData
    });

  } catch (error) {
    console.error('Error fetching monthly comparison:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly comparison',
      error: error.message
    });
  }
};
