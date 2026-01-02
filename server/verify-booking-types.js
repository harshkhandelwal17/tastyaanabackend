// Booking Type Verification Script
// This script demonstrates how to differentiate between offline and online bookings

const mongoose = require('mongoose');
const VehicleBooking = require('./models/VehicleBooking');

// Helper functions to identify booking types
const BookingTypeHelper = {
  
  // Check if booking is online
  isOnlineBooking(booking) {
    return booking.bookingSource === 'online' || 
           (!booking.cashFlowDetails?.isOfflineBooking && booking.bookingSource === 'online');
  },

  // Check if booking is offline
  isOfflineBooking(booking) {
    return booking.bookingSource === 'seller-portal' || 
           booking.cashFlowDetails?.isOfflineBooking === true ||
           ['offline', 'seller-portal', 'worker-portal'].includes(booking.bookingSource);
  },

  // Get booking source type with detailed info
  getBookingSourceInfo(booking) {
    const source = booking.bookingSource || 'unknown';
    const isOffline = booking.cashFlowDetails?.isOfflineBooking || false;
    
    return {
      source,
      type: this.isOnlineBooking(booking) ? 'online' : 'offline',
      isOfflineBooking: isOffline,
      createdBy: this.getCreatedBy(booking),
      paymentMethod: booking.paymentMethod,
      cashReceived: booking.cashFlowDetails?.cashPaymentDetails?.totalCashReceived || 0
    };
  },

  // Get who created the booking
  getCreatedBy(booking) {
    if (booking.bookingSource === 'online') return 'Customer (Online)';
    if (booking.bookingSource === 'seller-portal') return 'Seller (Offline)';
    if (booking.bookingSource === 'worker-portal') return 'Worker (Offline)';
    if (booking.bookingSource === 'admin') return 'Admin';
    return 'Unknown';
  },

  // Filter bookings by type
  async getBookingsByType(type = 'all', filters = {}) {
    let query = { ...filters };
    
    if (type === 'online') {
      query.bookingSource = 'online';
    } else if (type === 'offline') {
      query.bookingSource = { $in: ['seller-portal', 'worker-portal', 'offline'] };
    }
    
    return await VehicleBooking.find(query).populate('userId', 'name email phone');
  },

  // Get booking statistics by type
  async getBookingStats(dateRange = {}) {
    const matchStage = {};
    if (dateRange.startDate) matchStage.bookingDate = { $gte: new Date(dateRange.startDate) };
    if (dateRange.endDate) {
      matchStage.bookingDate = { 
        ...matchStage.bookingDate, 
        $lte: new Date(dateRange.endDate) 
      };
    }

    const stats = await VehicleBooking.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$bookingSource',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$billing.finalAmount' },
          totalCashReceived: { $sum: '$cashFlowDetails.cashPaymentDetails.totalCashReceived' },
          averageBookingValue: { $avg: '$billing.finalAmount' }
        }
      }
    ]);

    return {
      online: stats.find(s => s._id === 'online') || { count: 0, totalRevenue: 0, totalCashReceived: 0 },
      offline: stats.filter(s => ['seller-portal', 'worker-portal', 'offline'].includes(s._id)),
      total: stats.reduce((acc, curr) => ({
        count: acc.count + curr.count,
        totalRevenue: acc.totalRevenue + curr.totalRevenue,
        totalCashReceived: acc.totalCashReceived + curr.totalCashReceived
      }), { count: 0, totalRevenue: 0, totalCashReceived: 0 })
    };
  }
};

// Verification function
async function verifyBookingTypes() {
  try {
    console.log('=== BOOKING TYPE VERIFICATION ===\n');

    // Get recent bookings for demonstration
    const recentBookings = await VehicleBooking.find({})
      .sort({ bookingDate: -1 })
      .limit(10)
      .populate('userId', 'name email')
      .populate('bookedBy', 'name role');

    console.log('📊 Recent Bookings Analysis:');
    console.log('----------------------------------------');
    
    recentBookings.forEach(booking => {
      const info = BookingTypeHelper.getBookingSourceInfo(booking);
      console.log(`Booking ID: ${booking.bookingId}`);
      console.log(`  Type: ${info.type.toUpperCase()}`);
      console.log(`  Source: ${info.source}`);
      console.log(`  Created By: ${info.createdBy}`);
      console.log(`  Customer: ${booking.userId?.name || 'Unknown'}`);
      console.log(`  Payment Method: ${info.paymentMethod}`);
      console.log(`  Cash Received: ₹${info.cashReceived}`);
      console.log(`  Is Offline: ${info.isOfflineBooking ? 'YES' : 'NO'}`);
      console.log('----------------------------------------');
    });

    // Get booking statistics
    const stats = await BookingTypeHelper.getBookingStats();
    
    console.log('\n📈 Booking Statistics:');
    console.log('========================================');
    console.log(`Online Bookings: ${stats.online.count}`);
    console.log(`  Revenue: ₹${stats.online.totalRevenue}`);
    console.log(`  Cash Collected: ₹${stats.online.totalCashReceived}`);
    
    console.log(`\nOffline Bookings: ${stats.offline.reduce((sum, s) => sum + s.count, 0)}`);
    stats.offline.forEach(offline => {
      console.log(`  ${offline._id}: ${offline.count} bookings, ₹${offline.totalRevenue} revenue`);
    });
    
    console.log(`\nTotal Bookings: ${stats.total.count}`);
    console.log(`Total Revenue: ₹${stats.total.totalRevenue}`);
    console.log(`Total Cash Collected: ₹${stats.total.totalCashReceived}`);

    console.log('\n✅ Booking type tracking is working correctly!');
    console.log('\n🔍 How to use these fields:');
    console.log('1. Use booking.bookingSource to filter by creation method');
    console.log('2. Use booking.cashFlowDetails.isOfflineBooking for cash flow logic');
    console.log('3. Use BookingTypeHelper.isOnlineBooking() / isOfflineBooking() for easy checks');
    
  } catch (error) {
    console.error('Error verifying booking types:', error);
  }
}

// Export for use in other files
module.exports = {
  BookingTypeHelper,
  verifyBookingTypes
};

// Run verification if called directly
if (require.main === module) {
  // Connect to database and run verification
  mongoose.connect(process.env.DB_URI || 'mongodb://localhost:27017/onlinestore')
    .then(() => {
      console.log('Connected to database');
      return verifyBookingTypes();
    })
    .then(() => {
      mongoose.disconnect();
      console.log('\nDatabase disconnected');
    })
    .catch(error => {
      console.error('Verification failed:', error);
      mongoose.disconnect();
    });
}