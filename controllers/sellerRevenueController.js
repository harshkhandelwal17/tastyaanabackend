const VehicleBooking = require('../models/VehicleBooking');
const Vehicle = require('../models/Vehicle');

// Get comprehensive revenue analytics for seller
exports.getRevenueAnalytics = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { startDate, endDate, period = 'all' } = req.query;

    console.log('Revenue Analytics Request:', { sellerId, startDate, endDate, period });

    // Get seller's vehicles
    const sellerVehicles = await Vehicle.find({
      sellerId: sellerId
    });

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
    const bookingsQuery = {
      vehicleId: { $in: vehicleIds },
      $or: [
        { 'payments.paymentDate': { $gte: start, $lte: end } },
        { 'refundDetails.processedDate': { $gte: start, $lte: end } }
      ]
    };

    const bookings = await VehicleBooking.find(bookingsQuery)
      .populate('vehicleId', 'vehicleName registrationNumber');

    // Initialize ledger and analytics
    const ledger = {};

    // Initialize ledger with dates if period is week or month (optional but good for charts)
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
      totalBookings: bookings.length, // Total bookings touched by this period's cash flow
      paymentTypeBreakdown: {},
      refundReasons: {},
      vehicleWiseRevenue: {},
      bookingsList: []
    };

    // Process Bookings for Payments and Refunds
    bookings.forEach(booking => {
      let bookingInPeriodActivity = false;
      let bookingDataForList = {
        bookingId: booking.bookingId,
        vehicleName: booking.vehicleId?.vehicleName || 'Unknown',
        registrationNumber: booking.vehicleId?.registrationNumber || 'N/A',
        customerName: booking.customerDetails?.name,
        cashAmount: 0,
        onlineAmount: 0,
        totalAmount: 0,
        refundAmount: 0,
        paymentStatus: booking.paymentStatus,
        bookingDate: booking.bookingDate
      };

      // 1. Process Payments
      if (booking.payments && booking.payments.length > 0) {
        booking.payments.forEach(payment => {
          if (payment.status === 'success' && payment.paymentDate >= start && payment.paymentDate <= end) {
            bookingInPeriodActivity = true;
            const dateStr = new Date(payment.paymentDate).toISOString().split('T')[0];

            if (!ledger[dateStr]) {
              ledger[dateStr] = { date: dateStr, cashIn: 0, onlineIn: 0, totalIn: 0, refunds: 0, maintenance: 0, moneyOut: 0, net: 0, transactions: 0 };
            }

            const amount = payment.amount;
            if (payment.paymentType === 'Cash') {
              ledger[dateStr].cashIn += amount;
              analytics.cashRevenue += amount;
              bookingDataForList.cashAmount += amount;
            } else {
              ledger[dateStr].onlineIn += amount;
              analytics.onlineRevenue += amount;
              bookingDataForList.onlineAmount += amount;
            }
            bookingDataForList.totalAmount += amount;

            ledger[dateStr].totalIn += amount;
            ledger[dateStr].net += amount;
            ledger[dateStr].transactions++;
            analytics.totalRevenue += amount;

            // Type breakdown
            if (!analytics.paymentTypeBreakdown[payment.paymentType]) {
              analytics.paymentTypeBreakdown[payment.paymentType] = { amount: 0, count: 0 };
            }
            analytics.paymentTypeBreakdown[payment.paymentType].amount += amount;
            analytics.paymentTypeBreakdown[payment.paymentType].count++;
          }
        });
      }

      // 2. Process Refunds
      if (booking.refundDetails && booking.refundDetails.processedDate >= start && booking.refundDetails.processedDate <= end) {
        bookingInPeriodActivity = true;
        const dateStr = new Date(booking.refundDetails.processedDate).toISOString().split('T')[0];

        if (!ledger[dateStr]) {
          ledger[dateStr] = { date: dateStr, cashIn: 0, onlineIn: 0, totalIn: 0, refunds: 0, maintenance: 0, moneyOut: 0, net: 0, transactions: 0 };
        }

        const refundAmt = booking.refundDetails.approvedAmount || 0;
        ledger[dateStr].refunds += refundAmt;
        ledger[dateStr].moneyOut += refundAmt;
        ledger[dateStr].net -= refundAmt;
        analytics.totalRefunds += refundAmt;
        bookingDataForList.refundAmount += refundAmt;

        // Reason breakdown
        const reason = booking.refundDetails.reason || 'other';
        if (!analytics.refundReasons[reason]) {
          analytics.refundReasons[reason] = { amount: 0, count: 0 };
        }
        analytics.refundReasons[reason].amount += refundAmt;
        analytics.refundReasons[reason].count++;
      }

      if (bookingInPeriodActivity) {
        analytics.bookingsList.push(bookingDataForList);

        // Vehicle stats
        const vId = booking.vehicleId?._id?.toString();
        if (vId) {
          if (!analytics.vehicleWiseRevenue[vId]) {
            analytics.vehicleWiseRevenue[vId] = {
              vehicleName: booking.vehicleId.vehicleName,
              registrationNumber: booking.vehicleId.registrationNumber,
              revenue: 0,
              bookings: 0
            };
          }
          analytics.vehicleWiseRevenue[vId].revenue += (bookingDataForList.cashAmount + bookingDataForList.onlineAmount);
          analytics.vehicleWiseRevenue[vId].bookings++;
        }
      }
    });

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

// Get monthly revenue comparison
exports.getMonthlyComparison = async (req, res) => {
  try {
    const sellerId = req.user._id;
    const { months = 6 } = req.query;

    // Get seller's vehicles
    const sellerVehicles = await Vehicle.find({
      sellerId: sellerId
    }).select('_id');

    const vehicleIds = sellerVehicles.map(v => v._id);

    // Generate date range for last N months
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
        totalRevenue: 0,
        cashRevenue: 0,
        onlineRevenue: 0,
        refunds: 0,
        netRevenue: 0,
        bookings: bookings.length
      };

      bookings.forEach(booking => {
        if (booking.payments) {
          booking.payments.forEach(payment => {
            if (payment.status === 'success') {
              monthRevenue.totalRevenue += payment.amount;
              if (payment.paymentType === 'Cash') {
                monthRevenue.cashRevenue += payment.amount;
              } else {
                monthRevenue.onlineRevenue += payment.amount;
              }
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
