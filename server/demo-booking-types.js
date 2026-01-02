// Booking Type Tracking Demonstration
// Shows how the offline vs online booking differentiation works

console.log('=== BOOKING TYPE TRACKING DEMONSTRATION ===\n');

// Mock booking data to demonstrate the functionality
const mockBookings = [
  {
    bookingId: 'VB1735282800ABC123',
    bookingSource: 'online',
    userId: { name: 'John Doe', email: 'john@example.com' },
    bookedBy: { name: 'John Doe', role: 'user' },
    paymentMethod: 'online',
    cashFlowDetails: {
      isOfflineBooking: false,
      cashPaymentDetails: {
        totalCashReceived: 0,
        onlinePaymentAmount: 5000,
        notes: 'Online booking via user portal'
      }
    },
    billing: { finalAmount: 5000 },
    bookingDate: new Date('2024-12-27')
  },
  {
    bookingId: 'VB1735282801DEF456',
    bookingSource: 'seller-portal',
    userId: { name: 'Jane Smith', email: 'jane@example.com' },
    bookedBy: { name: 'Seller Ram', role: 'seller' },
    paymentMethod: 'cash',
    cashFlowDetails: {
      isOfflineBooking: true,
      cashPaymentDetails: {
        totalCashReceived: 4500,
        onlinePaymentAmount: 0,
        notes: 'Offline booking created by seller'
      }
    },
    billing: { finalAmount: 4500 },
    bookingDate: new Date('2024-12-27')
  },
  {
    bookingId: 'VB1735282802GHI789',
    bookingSource: 'worker-portal',
    userId: { name: 'Mike Wilson', email: 'mike@example.com' },
    bookedBy: { name: 'Worker Shyam', role: 'worker' },
    paymentMethod: 'mixed',
    cashFlowDetails: {
      isOfflineBooking: true,
      cashPaymentDetails: {
        totalCashReceived: 3000,
        onlinePaymentAmount: 2000,
        notes: 'Mixed payment - partial cash, partial online'
      }
    },
    billing: { finalAmount: 5000 },
    bookingDate: new Date('2024-12-27')
  }
];

// Helper functions (matching the model implementation)
const BookingTypeHelper = {
  isOnlineBooking(booking) {
    return booking.bookingSource === 'online';
  },

  isOfflineBooking(booking) {
    return ['seller-portal', 'worker-portal', 'offline'].includes(booking.bookingSource) || 
           booking.cashFlowDetails?.isOfflineBooking === true;
  },

  getBookingTypeInfo(booking) {
    return {
      source: booking.bookingSource,
      type: this.isOnlineBooking(booking) ? 'online' : 'offline',
      isOfflineBooking: booking.cashFlowDetails?.isOfflineBooking || false,
      createdBy: this.getCreatedBy(booking),
      paymentMethod: booking.paymentMethod,
      cashReceived: booking.cashFlowDetails?.cashPaymentDetails?.totalCashReceived || 0
    };
  },

  getCreatedBy(booking) {
    switch(booking.bookingSource) {
      case 'online': return 'Customer (Online)';
      case 'seller-portal': return 'Seller (Offline)';
      case 'worker-portal': return 'Worker (Offline)';
      case 'admin': return 'Admin';
      default: return 'Unknown';
    }
  }
};

console.log('📊 Sample Booking Analysis:');
console.log('==========================================\n');

mockBookings.forEach((booking, index) => {
  const info = BookingTypeHelper.getBookingTypeInfo(booking);
  const isOnline = BookingTypeHelper.isOnlineBooking(booking);
  const isOffline = BookingTypeHelper.isOfflineBooking(booking);
  
  console.log(`${index + 1}. Booking ID: ${booking.bookingId}`);
  console.log(`   Type: ${info.type.toUpperCase()} ${isOnline ? '🌐' : '🏪'}`);
  console.log(`   Source: ${info.source}`);
  console.log(`   Created By: ${info.createdBy}`);
  console.log(`   Customer: ${booking.userId.name}`);
  console.log(`   Payment Method: ${info.paymentMethod}`);
  console.log(`   Total Amount: ₹${booking.billing.finalAmount}`);
  console.log(`   Cash Received: ₹${info.cashReceived}`);
  console.log(`   Online Payment: ₹${booking.cashFlowDetails.cashPaymentDetails.onlinePaymentAmount}`);
  console.log(`   Is Offline Booking: ${info.isOfflineBooking ? 'YES ✅' : 'NO ❌'}`);
  console.log(`   Notes: ${booking.cashFlowDetails.cashPaymentDetails.notes}`);
  console.log('   ----------------------------------------');
});

// Calculate statistics
const stats = {
  total: mockBookings.length,
  online: mockBookings.filter(b => BookingTypeHelper.isOnlineBooking(b)).length,
  offline: mockBookings.filter(b => BookingTypeHelper.isOfflineBooking(b)).length,
  totalRevenue: mockBookings.reduce((sum, b) => sum + b.billing.finalAmount, 0),
  totalCashCollected: mockBookings.reduce((sum, b) => sum + b.cashFlowDetails.cashPaymentDetails.totalCashReceived, 0),
  onlineRevenue: mockBookings.filter(b => BookingTypeHelper.isOnlineBooking(b))
    .reduce((sum, b) => sum + b.billing.finalAmount, 0),
  offlineRevenue: mockBookings.filter(b => BookingTypeHelper.isOfflineBooking(b))
    .reduce((sum, b) => sum + b.billing.finalAmount, 0)
};

console.log('\n📈 Booking Statistics Summary:');
console.log('==========================================');
console.log(`Total Bookings: ${stats.total}`);
console.log(`  📱 Online Bookings: ${stats.online} (${((stats.online/stats.total)*100).toFixed(1)}%)`);
console.log(`  🏪 Offline Bookings: ${stats.offline} (${((stats.offline/stats.total)*100).toFixed(1)}%)`);
console.log(`\nRevenue Breakdown:`);
console.log(`  Total Revenue: ₹${stats.totalRevenue}`);
console.log(`  Online Revenue: ₹${stats.onlineRevenue}`);
console.log(`  Offline Revenue: ₹${stats.offlineRevenue}`);
console.log(`  Cash Collected: ₹${stats.totalCashCollected}`);

console.log('\n🎯 Business Logic Examples:');
console.log('==========================================');

// Example 1: Different commission rates
console.log('\n1. Commission Calculation (Different rates for online vs offline):');
mockBookings.forEach(booking => {
  const amount = booking.billing.finalAmount;
  let commission;
  let rate;
  
  if (booking.bookingSource === 'online') {
    rate = 10; // 10% for online
    commission = amount * 0.10;
  } else if (booking.bookingSource === 'seller-portal') {
    rate = 15; // 15% for offline (higher for service)
    commission = amount * 0.15;
  } else {
    rate = 12; // 12% default
    commission = amount * 0.12;
  }
  
  console.log(`   ${booking.bookingId}: ₹${amount} × ${rate}% = ₹${commission.toFixed(2)} commission`);
});

// Example 2: Dynamic pricing
console.log('\n2. Dynamic Pricing (Online discount vs Offline convenience fee):');
const basePrice = 5000;
mockBookings.forEach(booking => {
  let finalPrice = basePrice;
  let adjustment = '';
  
  if (BookingTypeHelper.isOnlineBooking(booking)) {
    finalPrice *= 0.95; // 5% online discount
    adjustment = '5% online discount';
  } else if (BookingTypeHelper.isOfflineBooking(booking)) {
    finalPrice += 100; // ₹100 offline convenience fee
    adjustment = '₹100 offline convenience fee';
  }
  
  console.log(`   ${booking.bookingId}: ₹${basePrice} → ₹${finalPrice.toFixed(2)} (${adjustment})`);
});

console.log('\n✅ IMPLEMENTATION BENEFITS:');
console.log('==========================================');
console.log('✅ Clear separation between online and offline bookings');
console.log('✅ Dual tracking with bookingSource + isOfflineBooking fields');
console.log('✅ Built-in helper methods for easy type checking');
console.log('✅ Cash flow tracking specifically for offline bookings');
console.log('✅ Ready for different business logic (pricing, commission, etc.)');
console.log('✅ Analytics and reporting capabilities');

console.log('\n🔍 DATABASE FIELDS USED:');
console.log('==========================================');
console.log('📋 bookingSource: Enum field (primary identifier)');
console.log('   - "online" for customer bookings');
console.log('   - "seller-portal" for seller-created bookings');
console.log('   - "worker-portal" for worker-created bookings');
console.log('   - "admin" for admin-created bookings');
console.log('💰 cashFlowDetails.isOfflineBooking: Boolean (cash flow tracking)');
console.log('   - true for offline bookings with cash handling');
console.log('   - false for online bookings with digital payments');

console.log('\n🚀 READY FOR YOUR CUSTOM BUSINESS LOGIC!');
console.log('The foundation is complete. You can now implement:');
console.log('• Different pricing strategies');
console.log('• Commission rules');
console.log('• Cash reconciliation');
console.log('• Performance analytics');
console.log('• Customer behavior analysis');