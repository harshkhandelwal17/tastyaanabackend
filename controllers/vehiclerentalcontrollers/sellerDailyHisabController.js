const VehicleBooking = require('../../models/VehicleBooking');
const Vehicle = require('../../models/Vehicle');

/**
 * Daily Hisab Controller
 * 
 * Logic: For a given date, find all transactions (payments & refunds) that ACTUALLY HAPPENED on that date.
 * - A booking made on 22nd March with payment on 22nd March → counted on 22nd March
 * - Same booking, remaining payment collected on 25th March → counted on 25th March
 * - A vehicle returned on 24th March with refund processed on 25th March → refund counted on 25th March
 * 
 * This gives the owner an accurate picture of what cash the worker handled each day.
 */

// Helper: Get IST start and end of day in UTC
const getISTDayRange = (dateStr) => {
  const dateParts = dateStr.split('-');
  const year = parseInt(dateParts[0]);
  const month = parseInt(dateParts[1]) - 1;
  const day = parseInt(dateParts[2]);

  // IST is UTC+5:30, so IST midnight = UTC previous day 18:30
  const startOfDayUTC = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
  startOfDayUTC.setUTCHours(startOfDayUTC.getUTCHours() - 5);
  startOfDayUTC.setUTCMinutes(startOfDayUTC.getUTCMinutes() - 30);

  const endOfDayUTC = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
  endOfDayUTC.setUTCHours(endOfDayUTC.getUTCHours() - 5);
  endOfDayUTC.setUTCMinutes(endOfDayUTC.getUTCMinutes() - 30);

  return { startOfDayUTC, endOfDayUTC };
};


/**
 * GET /api/seller/vehicles/daily-hisab
 * Query: ?date=2026-03-22
 * 
 * Returns all bookings that had a payment or refund transaction on the given date.
 */
const getDailyHisab = async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required (format: YYYY-MM-DD)'
      });
    }

    const { startOfDayUTC, endOfDayUTC } = getISTDayRange(date);

    // Get all vehicles belonging to this seller
    const sellerVehicles = await Vehicle.find({ sellerId }, '_id companyName name vehicleNo');
    const vehicleIds = sellerVehicles.map(v => v._id);
    const vehicleMap = {};
    sellerVehicles.forEach(v => {
      vehicleMap[v._id.toString()] = {
        companyName: v.companyName,
        name: v.name,
        vehicleNo: v.vehicleNo
      };
    });

    // Find all bookings for seller's vehicles that have:
    // 1. Any payment on this date, OR
    // 2. A refund processed on this date
    const bookings = await VehicleBooking.find({
      $and: [
        {
          $or: [
            { vehicleId: { $in: vehicleIds } },
            { bookedBy: sellerId }
          ]
        },
        {
          $or: [
            // Has a payment on this date
            { 'payments.paymentDate': { $gte: startOfDayUTC, $lte: endOfDayUTC } },
            // Has a refund processed on this date
            { 'refundDetails.processedDate': { $gte: startOfDayUTC, $lte: endOfDayUTC } },
            // Booking was created on this date (bookingDate)
            { 'bookingDate': { $gte: startOfDayUTC, $lte: endOfDayUTC } }
          ]
        }
      ]
    }).populate('vehicleId', 'companyName name vehicleNo').lean();

    // Process each booking to extract only transactions for this date
    let totalIn = 0;
    let totalOut = 0;
    let totalNewBookings = 0;
    let totalSubmittedBookings = 0;

    const vehicleTransactions = [];

    for (const booking of bookings) {
      const vehicleInfo = booking.vehicleId || {};
      const vehicleName = `${vehicleInfo.companyName || ''} ${vehicleInfo.name || ''}`.trim();
      const vehicleNo = vehicleInfo.vehicleNo || 'N/A';

      // Calculate payments received on this date
      let dayPayments = 0;
      const paymentDetails = [];
      if (booking.payments && booking.payments.length > 0) {
        for (const payment of booking.payments) {
          const payDate = new Date(payment.paymentDate);
          if (payDate >= startOfDayUTC && payDate <= endOfDayUTC && payment.status === 'success') {
            dayPayments += payment.amount || 0;
            paymentDetails.push({
              amount: payment.amount,
              type: payment.paymentType,
              method: payment.paymentMethod,
              time: payment.paymentDate
            });
          }
        }
      }

      // Calculate refunds given on this date
      let dayRefunds = 0;
      let refundDetail = null;
      if (booking.refundDetails && booking.refundDetails.processedDate) {
        const refundDate = new Date(booking.refundDetails.processedDate);
        if (refundDate >= startOfDayUTC && refundDate <= endOfDayUTC) {
          // Cash refund affects the worker's hisab
          dayRefunds = (booking.refundDetails.cashAmount || 0);
          refundDetail = {
            totalRefund: booking.refundDetails.approvedAmount || 0,
            cashRefund: booking.refundDetails.cashAmount || 0,
            onlineRefund: booking.refundDetails.onlineAmount || 0,
            reason: booking.refundDetails.reason,
            mode: booking.refundDetails.refundMode
          };
        }
      }

      // Check if booking was created today
      const isNewBooking = booking.bookingDate &&
        new Date(booking.bookingDate) >= startOfDayUTC &&
        new Date(booking.bookingDate) <= endOfDayUTC;

      // Check if vehicle was submitted/returned today
      const isSubmitted = booking.vehicleReturn?.submitted &&
        booking.vehicleReturn?.submittedAt &&
        new Date(booking.vehicleReturn.submittedAt) >= startOfDayUTC &&
        new Date(booking.vehicleReturn.submittedAt) <= endOfDayUTC;

      if (isNewBooking) totalNewBookings++;
      if (isSubmitted) totalSubmittedBookings++;

      // Only include if there's actual money movement on this date
      if (dayPayments > 0 || dayRefunds > 0) {
        totalIn += dayPayments;
        totalOut += dayRefunds;

        vehicleTransactions.push({
          bookingId: booking.bookingId,
          _id: booking._id,
          vehicleName,
          vehicleNo,
          customerName: booking.customerDetails?.name || 'N/A',
          customerPhone: booking.customerDetails?.phone || 'N/A',
          bookingStatus: booking.bookingStatus,
          bookingDate: booking.bookingDate,
          startDateTime: booking.startDateTime,
          endDateTime: booking.endDateTime,
          totalBill: booking.billing?.totalBill || 0,
          depositAmount: booking.depositAmount || 0,
          totalPaid: booking.paidAmount || 0,
          isNewBooking,
          isSubmitted,
          dayPayments,
          dayRefunds,
          dayNet: dayPayments - dayRefunds,
          paymentDetails,
          refundDetail,
        });
      }
    }

    // Sort: new bookings first, then submitted, by time
    vehicleTransactions.sort((a, b) => {
      if (a.isNewBooking && !b.isNewBooking) return -1;
      if (!a.isNewBooking && b.isNewBooking) return 1;
      return new Date(b.bookingDate) - new Date(a.bookingDate);
    });

    const collectFromWorker = totalIn - totalOut;

    res.status(200).json({
      success: true,
      date,
      summary: {
        totalIn,
        totalOut,
        collectFromWorker,
        totalNewBookings,
        totalSubmittedBookings,
        totalTransactions: vehicleTransactions.length
      },
      transactions: vehicleTransactions
    });

  } catch (error) {
    console.error('Error getting daily hisab:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get daily hisab',
      error: error.message
    });
  }
};

module.exports = {
  getDailyHisab
};
