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
    const sellerVehicles = await Vehicle.find({ sellerId }, '_id companyName name vehicleNo category type zoneCode zoneCenterName maintenance maintenanceHistory');
    const vehicleIds = sellerVehicles.map(v => v._id);
    const vehicleMap = {};
    sellerVehicles.forEach(v => {
      vehicleMap[v._id.toString()] = {
        companyName: v.companyName,
        name: v.name,
        vehicleNo: v.vehicleNo,
        category: v.category,
        type: v.type,
        zoneCode: v.zoneCode,
        zoneCenterName: v.zoneCenterName
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
    }).populate('vehicleId', 'companyName name vehicleNo category type zoneCode zoneCenterName').lean();

    // Process each booking to extract only transactions for this date
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
      const vehicleIdStr = vehicleInfo._id ? vehicleInfo._id.toString() : '';
      const vehicleMapData = vehicleMap[vehicleIdStr] || {};
      const vehicleName = `${vehicleInfo.companyName || vehicleMapData.companyName || ''} ${vehicleInfo.name || vehicleMapData.name || ''}`.trim();
      const vehicleNo = vehicleInfo.vehicleNo || vehicleMapData.vehicleNo || 'N/A';
      const vehicleCategory = vehicleInfo.category || vehicleMapData.category || null;
      const vehicleType = vehicleInfo.type || vehicleMapData.type || null;
      const zoneCode = vehicleInfo.zoneCode || vehicleMapData.zoneCode || booking.zone || null;
      const zoneCenterName = vehicleInfo.zoneCenterName || vehicleMapData.zoneCenterName || booking.centerName || null;

      // Calculate payments received on this date
      let dayPayments = 0;
      let dayCashIn = 0;
      let dayOnlineIn = 0;
      const paymentDetails = [];
      
      if (booking.payments && booking.payments.length > 0) {
        for (const payment of booking.payments) {
          const payDate = new Date(payment.paymentDate);
          if (payDate >= startOfDayUTC && payDate <= endOfDayUTC && payment.status === 'success' && (payment.amount || 0) > 0) {
            const amount = payment.amount || 0;
            dayPayments += amount;
            
            // Check for cash in both type and method fields to be robust
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

      // Calculate refunds given on this date
      let dayRefunds = 0;
      let dayCashOut = 0;
      let dayOnlineOut = 0;
      let refundDetail = null;
      
      if (booking.refundDetails && booking.refundDetails.processedDate) {
        const refundDate = new Date(booking.refundDetails.processedDate);
        if (refundDate >= startOfDayUTC && refundDate <= endOfDayUTC) {
          const approvedAmount = booking.refundDetails.approvedAmount || 0;
          
          // Derive cash/online split
          if (booking.refundDetails.cashAmount != null || booking.refundDetails.onlineAmount != null) {
            dayCashOut = booking.refundDetails.cashAmount || 0;
            dayOnlineOut = booking.refundDetails.onlineAmount || 0;
          } else {
            // Fallback: derive from refundMethod/refundMode
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
        const extraKm = booking.ratePlanUsed?.extraChargePerKm
          ? extraKmCharge / booking.ratePlanUsed.extraChargePerKm
          : null;
        const extraHours = booking.ratePlanUsed?.extraChargePerHour
          ? extraHourCharge / booking.ratePlanUsed.extraChargePerHour
          : null;

        // Total km actually traveled by customer
        const totalKm = booking.tripMetrics?.totalKmTraveled ?? null;

        // Deposit split: online vs cash (historical data helper)
        const depositAmount = booking.depositAmount || 0;
        const depositOnline = (booking.depositStatus === 'collected-online') ? depositAmount : 0;
        const depositCash = (booking.depositStatus === 'collected-at-pickup') ? depositAmount : 0;

        vehicleTransactions.push({
          bookingId: booking.bookingId,
          _id: booking._id,
          vehicleName,
          vehicleNo,
          vehicleCategory: vehicleCategory,
          vehicleType: vehicleType,
          zoneCode: zoneCode,
          zoneCenterName: zoneCenterName,
          customerName: booking.customerDetails?.name || booking.userId?.name || 'Customer',
          customerPhone: booking.customerDetails?.phone || 'N/A',
          bookingStatus: booking.bookingStatus,
          bookingDate: booking.bookingDate,
          startDateTime: booking.startDateTime,
          endDateTime: booking.endDateTime,
          planType: booking.rateType,
          durationHours: booking.billing?.duration || null,
          kmLimit: booking.billing?.kmLimit || null,
          totalKm,
          totalBill: booking.billing?.totalBill || 0,
          discountAmount: booking.billing?.discount?.amount || 0,
          depositAmount,
          depositOnline,
          depositCash,
          totalPaid: booking.paidAmount || 0,
          extraKmCharge,
          extraHourCharge,
          extraKm,
          extraHours,
          isNewBooking,
          isSubmitted,
          dayPayments,
          dayCashIn,
          dayOnlineIn,
          dayRefunds,
          dayCashOut,
          dayOnlineOut,
          dayNet: dayPayments - dayRefunds,
          paymentDetails,
          refundDetail,
        });
      }
    }

    // NEW: Include maintenance costs in Hisab
    // Since workers often pay for maintenance out of their daily cash collection
    let totalMaintenance = 0;
    for (const vehicle of sellerVehicles) {
      const records = vehicle.maintenance || [];
      const legacyRecords = (vehicle._doc && vehicle._doc.maintenanceHistory) || vehicle.maintenanceHistory || [];
      
      const allMaintenance = [...records];
      legacyRecords.forEach(l => {
        if (!allMaintenance.some(m => m._id.toString() === l._id.toString())) {
          allMaintenance.push(l);
        }
      });

      for (const record of allMaintenance) {
        const maintDate = new Date(record.lastServicingDate || record.date);
        if (maintDate >= startOfDayUTC && maintDate <= endOfDayUTC) {
          const cost = Number(record.serviceCost || record.cost) || 0;
          if (cost > 0) {
            totalMaintenance += cost;
            
            // Add as a special transaction
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
              dayCashOut: cost, // Maintenance is almost always paid in cash by workers
              dayOnlineOut: 0,
              dayNet: -cost,
              lastServicingDate: record.lastServicingDate || record.date
            });
          }
        }
      }
    }

    // Update totals with maintenance
    totalOut += totalMaintenance;
    totalCashOut += totalMaintenance;

    // Sort: new bookings first, then submitted, then maintenance, then by time
    vehicleTransactions.sort((a, b) => {
      if (a.isNewBooking && !b.isNewBooking) return -1;
      if (!a.isNewBooking && b.isNewBooking) return 1;
      if (a.isMaintenance && !b.isMaintenance) return 1;
      if (!a.isMaintenance && b.isMaintenance) return -1;
      
      const dateA = a.bookingDate || a.lastServicingDate || a.time || a.createdAt;
      const dateB = b.bookingDate || b.lastServicingDate || b.time || b.createdAt;
      return new Date(dateB) - new Date(dateA);
    });

    // Collection calculation: Only deduct cash refunds and maintenance from cash received
    const collectFromWorker = totalCashIn - totalCashOut;

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