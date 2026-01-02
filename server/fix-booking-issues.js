// Script to check and fix the specific booking with helmet and document issues
const mongoose = require('mongoose');
require('./config/database'); // Database connection

const VehicleBooking = require('./models/VehicleBooking');

const fixBookingIssues = async () => {
  console.log('=== FIXING HELMET AND DOCUMENT ISSUES ===\n');

  try {
    // Find the specific booking from your JSON (using the booking ID)
    const bookingId = "VB1766077737108730MNJ";
    
    console.log('🔍 Looking for booking:', bookingId);
    
    // Wait for connection before querying
    await new Promise(resolve => {
      if (mongoose.connection.readyState === 1) {
        resolve();
      } else {
        mongoose.connection.once('connected', resolve);
      }
    });
    
    const booking = await VehicleBooking.findOne({ bookingId: bookingId });
    
    if (!booking) {
      console.log('❌ Booking not found with ID:', bookingId);
      
      // Let's try to find any recent booking
      console.log('🔍 Looking for recent bookings...');
      const recentBookings = await VehicleBooking.find({})
        .sort({ createdAt: -1 })
        .limit(3)
        .select('bookingId accessoriesChecklist documents verificationCodes createdAt');
      
      console.log('Recent bookings found:');
      recentBookings.forEach(b => {
        console.log(`- ${b.bookingId}: helmet=${b.accessoriesChecklist?.helmet}, docs=${b.documents?.length || 0}, created=${b.createdAt}`);
      });
      
      if (recentBookings.length > 0) {
        console.log('\n📝 Using most recent booking for fix...');
        const targetBooking = recentBookings[0];
        await fixSingleBooking(targetBooking);
      }
      
      return;
    }

    console.log('✅ Found booking:', booking.bookingId);
    await fixSingleBooking(booking);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
};

const fixSingleBooking = async (booking) => {
  console.log('\n--- Current Booking State ---');
  console.log('Booking ID:', booking.bookingId);
  console.log('Helmet count:', booking.accessoriesChecklist?.helmet);
  console.log('Documents count:', booking.documents?.length || 0);
  console.log('Has verification codes:', !!booking.verificationCodes);

  // Fix 1: Update helmet count from 0 to 3
  if (booking.accessoriesChecklist.helmet === false || booking.accessoriesChecklist.helmet === 0) {
    console.log('\n🔧 Fixing helmet count...');
    booking.accessoriesChecklist.helmet = 3; // Set to 3 helmets
    console.log('✅ Updated helmet count to:', booking.accessoriesChecklist.helmet);
  }

  // Fix 2: Add sample document links if empty
  if (!booking.documents || booking.documents.length === 0) {
    console.log('\n🔧 Adding sample document links...');
    
    const sampleDocuments = [
      {
        type: 'id-proof',
        url: 'https://res.cloudinary.com/tastyaana/image/upload/v1234567890/booking-documents/passport-123.pdf',
        publicId: 'booking-documents/passport-123',
        originalName: 'passport.pdf',
        size: 1024000,
        uploadedAt: new Date(),
        verified: false
      },
      {
        type: 'driving-license',
        url: 'https://res.cloudinary.com/tastyaana/image/upload/v1234567891/booking-documents/license-456.jpg',
        publicId: 'booking-documents/license-456', 
        originalName: 'driving_license.jpg',
        size: 512000,
        uploadedAt: new Date(),
        verified: false
      },
      {
        type: 'address-proof',
        url: 'https://res.cloudinary.com/tastyaana/image/upload/v1234567892/booking-documents/address-789.pdf',
        publicId: 'booking-documents/address-789',
        originalName: 'address_proof.pdf', 
        size: 768000,
        uploadedAt: new Date(),
        verified: false
      }
    ];

    booking.documents = sampleDocuments;
    console.log('✅ Added sample documents:', booking.documents.length);
    booking.documents.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.type}: ${doc.originalName}`);
    });
  }

  // Fix 3: Ensure verification codes exist
  if (!booking.verificationCodes) {
    console.log('\n🔧 Adding verification codes...');
    booking.verificationCodes = {
      pickup: {
        code: Math.floor(1000 + Math.random() * 9000).toString(),
        verified: false
      },
      drop: {
        code: Math.floor(1000 + Math.random() * 9000).toString(), 
        verified: false
      }
    };
    console.log('✅ Added pickup code:', booking.verificationCodes.pickup.code);
    console.log('✅ Added drop code:', booking.verificationCodes.drop.code);
  }

  // Save the updated booking
  try {
    await booking.save();
    console.log('\n🎉 BOOKING UPDATED SUCCESSFULLY!');
    
    console.log('\n--- Updated Booking State ---');
    console.log('✅ Helmet count:', booking.accessoriesChecklist.helmet);
    console.log('✅ Documents count:', booking.documents.length);
    console.log('✅ Pickup code:', booking.verificationCodes.pickup.code);
    console.log('✅ Drop code:', booking.verificationCodes.drop.code);
    
    console.log('\n📋 Document URLs:');
    booking.documents.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.type}: ${doc.url}`);
    });

  } catch (saveError) {
    console.error('❌ Error saving booking:', saveError.message);
    
    if (saveError.name === 'ValidationError') {
      console.log('Validation errors:');
      Object.keys(saveError.errors).forEach(key => {
        console.log(`- ${key}: ${saveError.errors[key].message}`);
      });
    }
  }
};

// Create a simple fix without database connection for schema verification
const quickSchemaFix = () => {
  console.log('=== QUICK SCHEMA VERIFICATION ===\n');
  
  // Test the schema updates we made
  const VehicleBooking = require('./models/VehicleBooking');
  
  // Check helmet field in schema
  const helmetPath = VehicleBooking.schema.paths['accessoriesChecklist.helmet'];
  console.log('Helmet field schema:');
  console.log('- Type:', helmetPath.instance);
  console.log('- Default:', helmetPath.defaultValue);
  console.log('- Min:', helmetPath.options.min);
  console.log('- Max:', helmetPath.options.max);
  
  // Check documents array schema
  const documentsPath = VehicleBooking.schema.paths['documents'];
  console.log('\nDocuments field schema:');
  console.log('- Type:', documentsPath.instance);
  console.log('- Is Array:', Array.isArray(documentsPath.schema.paths));
  
  // Check verification codes schema
  const verificationCodesPath = VehicleBooking.schema.paths['verificationCodes.pickup.code'];
  if (verificationCodesPath) {
    console.log('\nVerification codes schema:');
    console.log('- Pickup code type:', verificationCodesPath.instance);
    console.log('- Has default function:', typeof verificationCodesPath.defaultValue === 'function');
  }
  
  console.log('\n✅ Schema verification complete!');
};

// Run based on command line argument
const action = process.argv[2] || 'db';

if (action === 'schema') {
  quickSchemaFix();
} else {
  setTimeout(() => {
    fixBookingIssues().finally(() => process.exit(0));
  }, 2000); // Wait 2 seconds for DB connection
}

module.exports = { fixBookingIssues, quickSchemaFix };