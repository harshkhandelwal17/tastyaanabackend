const mongoose = require('mongoose');
require('dotenv').config();
require('./config/database');

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/onlinefood');

async function addSampleDocuments() {
  try {
    const VehicleBooking = require('./models/VehicleBooking');
    
    const booking = await VehicleBooking.findById('694458e375a255d2dc85a157');
    
    if (!booking) {
      console.log('❌ Booking not found');
      return;
    }

    console.log('📋 Adding sample documents to booking...');
    
    // Sample documents with Cloudinary URLs
    const sampleDocuments = [
      {
        type: 'driving-license',
        url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample-license.jpg',
        originalName: 'driving_license_front.jpg',
        publicId: 'booking-documents/license_sample',
        size: 512000,
        uploadedAt: new Date(),
        verified: false
      },
      {
        type: 'id-proof',
        url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample-id.jpg', 
        originalName: 'aadhaar_card.jpg',
        publicId: 'booking-documents/id_sample',
        size: 768000,
        uploadedAt: new Date(),
        verified: true
      },
      {
        type: 'address-proof',
        url: 'https://res.cloudinary.com/demo/image/upload/v1234567890/sample-address.jpg',
        originalName: 'address_proof.pdf',
        publicId: 'booking-documents/address_sample',
        size: 256000,
        uploadedAt: new Date(),
        verified: false
      }
    ];

    // Update the booking documents
    booking.documents = sampleDocuments;
    
    // Also update payment tracking
    if (!booking.payments) {
      booking.payments = [];
    }
    
    // Add sample payment history
    booking.payments.push({
      amount: 1000,
      paymentType: 'UPI',
      paymentMethod: 'Razorpay',
      transactionId: 'TXN123456789',
      collectedBy: booking.vehicleId?.sellerId,
      paymentDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      notes: 'Initial booking payment'
    });
    
    booking.payments.push({
      amount: 500,
      paymentType: 'Cash',
      paymentMethod: 'Manual',
      collectedBy: booking.vehicleId?.sellerId,
      paymentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      notes: 'Partial payment at pickup'
    });

    // Update paid amount
    booking.paidAmount = 1500;
    
    await booking.save();
    
    console.log('✅ Sample documents and payments added successfully!');
    console.log('\n📸 Added documents:');
    booking.documents.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.type}: ${doc.originalName} (${doc.verified ? 'Verified' : 'Pending'})`);
    });
    
    console.log('\n💰 Added payments:');
    booking.payments.forEach((payment, index) => {
      console.log(`   ${index + 1}. ₹${payment.amount} via ${payment.paymentType} on ${payment.paymentDate.toLocaleDateString()}`);
    });
    
    console.log(`\n💳 Total paid: ₹${booking.paidAmount}`);
    console.log(`💳 Total bill: ₹${booking.billing?.totalBill || booking.totalAmount}`);
    console.log(`💳 Remaining: ₹${(booking.billing?.totalBill || booking.totalAmount) - booking.paidAmount}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
}

addSampleDocuments();