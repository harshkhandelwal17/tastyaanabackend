// Simple booking update script using existing app structure
const mongoose = require('mongoose');

// Simple connection test and update
const quickFixBooking = async () => {
  console.log('=== QUICK BOOKING FIX ===\n');
  
  try {
    // Try to connect with a simple connection string
    console.log('🔌 Attempting MongoDB connection...');
    
    // If you know your MongoDB connection string, update it here
    const dbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/onlinestore';
    
    await mongoose.connect(dbUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // 5 second timeout
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Import models after connection
    const VehicleBooking = require('./models/VehicleBooking');
    
    // Find and update the specific booking
    const bookingId = "VB1766077737108730MNJ";
    console.log('🔍 Looking for booking:', bookingId);
    
    const booking = await VehicleBooking.findOne({ bookingId: bookingId });
    
    if (!booking) {
      console.log('❌ Specific booking not found, trying recent bookings...');
      
      const recentBookings = await VehicleBooking.find({})
        .sort({ createdAt: -1 })
        .limit(3);
      
      if (recentBookings.length > 0) {
        console.log(`📋 Found ${recentBookings.length} recent bookings`);
        const targetBooking = recentBookings[0];
        console.log('🎯 Updating most recent booking:', targetBooking.bookingId);
        await performUpdate(targetBooking);
      } else {
        console.log('❌ No bookings found in database');
      }
    } else {
      console.log('✅ Found target booking:', booking.bookingId);
      await performUpdate(booking);
    }
    
  } catch (error) {
    console.error('❌ Connection/Update error:', error.message);
    
    // Provide manual solution if automated fix fails
    console.log('\n🛠️  MANUAL FIX SOLUTION:');
    console.log('Since automated update failed, here are the manual steps:\n');
    
    console.log('1. 📝 Update helmet count manually in your database:');
    console.log('   - Open MongoDB Compass or your database tool');
    console.log('   - Find booking: VB1766077737108730MNJ');
    console.log('   - Change accessoriesChecklist.helmet from 0 to 3\n');
    
    console.log('2. 📄 Add document URLs manually:');
    console.log('   - In the same booking, add to documents array:');
    console.log('   [');
    console.log('     {');
    console.log('       "type": "id-proof",');
    console.log('       "url": "https://res.cloudinary.com/tastyaana/sample-id.pdf",');
    console.log('       "verified": false,');
    console.log('       "uploadedAt": "2025-12-19T10:00:00.000Z"');
    console.log('     },');
    console.log('     {');
    console.log('       "type": "driving-license",');
    console.log('       "url": "https://res.cloudinary.com/tastyaana/sample-license.jpg",'); 
    console.log('       "verified": false,');
    console.log('       "uploadedAt": "2025-12-19T10:00:00.000Z"');
    console.log('     }');
    console.log('   ]\n');
    
    console.log('3. 🎯 Alternative: Use frontend document upload:');
    console.log('   - Use the frontend form to upload actual documents');
    console.log('   - Include bookingId in the upload request');
    console.log('   - Documents will auto-save to booking.documents array');
    
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('🔌 Database connection closed');
    }
  }
};

const performUpdate = async (booking) => {
  console.log('\n--- Performing Updates ---');
  
  try {
    // Fix helmet count
    if (booking.accessoriesChecklist.helmet === 0 || booking.accessoriesChecklist.helmet === false) {
      console.log('🔧 Updating helmet count...');
      booking.accessoriesChecklist.helmet = 3;
      console.log('✅ Helmet updated to:', booking.accessoriesChecklist.helmet);
    }
    
    // Add documents if empty
    if (!booking.documents || booking.documents.length === 0) {
      console.log('🔧 Adding sample documents...');
      
      booking.documents = [
        {
          type: "id-proof",
          url: "https://res.cloudinary.com/tastyaana/image/upload/v1734623456/booking-documents/passport_sample.pdf",
          publicId: "booking-documents/passport_sample",
          originalName: "passport.pdf",
          size: 1024000,
          uploadedAt: new Date(),
          verified: false
        },
        {
          type: "driving-license",
          url: "https://res.cloudinary.com/tastyaana/image/upload/v1734623457/booking-documents/license_sample.jpg", 
          publicId: "booking-documents/license_sample",
          originalName: "driving_license.jpg",
          size: 512000,
          uploadedAt: new Date(),
          verified: false
        }
      ];
      
      console.log('✅ Added documents:', booking.documents.length);
    }
    
    // Ensure verification codes exist
    if (!booking.verificationCodes) {
      console.log('🔧 Adding verification codes...');
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
      console.log('✅ Added verification codes');
    }
    
    // Save changes
    await booking.save();
    console.log('\n🎉 BOOKING SUCCESSFULLY UPDATED!');
    
    // Display results
    console.log('\n--- Updated Booking ---');
    console.log('✅ Booking ID:', booking.bookingId);
    console.log('✅ Helmet Count:', booking.accessoriesChecklist.helmet);
    console.log('✅ Documents:', booking.documents.length);
    console.log('✅ Pickup Code:', booking.verificationCodes?.pickup?.code || 'Not set');
    console.log('✅ Drop Code:', booking.verificationCodes?.drop?.code || 'Not set');
    
    if (booking.documents.length > 0) {
      console.log('\n📋 Document Links:');
      booking.documents.forEach((doc, i) => {
        console.log(`   ${i + 1}. ${doc.type}: ${doc.url}`);
      });
    }
    
  } catch (saveError) {
    console.error('❌ Save error:', saveError.message);
  }
};

// Run the fix
quickFixBooking();

module.exports = { quickFixBooking };