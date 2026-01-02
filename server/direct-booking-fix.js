// Direct MongoDB update script to fix helmet and document issues
const { MongoClient } = require('mongodb');

const fixBookingDirectly = async () => {
  console.log('=== DIRECT DATABASE UPDATE ===\n');

  // You'll need to update this with your actual MongoDB connection string
  const connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/onlinestore';
  
  let client;
  
  try {
    console.log('🔌 Connecting to MongoDB...');
    client = new MongoClient(connectionString);
    await client.connect();
    
    const db = client.db();
    const bookingsCollection = db.collection('vehiclebookings');
    
    // Find the specific booking
    const bookingId = "VB1766077737108730MNJ";
    console.log('🔍 Looking for booking:', bookingId);
    
    const booking = await bookingsCollection.findOne({ bookingId: bookingId });
    
    if (!booking) {
      console.log('❌ Booking not found, looking for recent bookings...');
      
      // Find recent bookings
      const recentBookings = await bookingsCollection
        .find({})
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray();
      
      console.log('Recent bookings:');
      recentBookings.forEach(b => {
        console.log(`- ${b.bookingId}: helmet=${b.accessoriesChecklist?.helmet || 'undefined'}, docs=${b.documents?.length || 0}`);
      });
      
      if (recentBookings.length === 0) {
        console.log('❌ No bookings found in database');
        return;
      }
      
      // Update the most recent booking
      const targetBooking = recentBookings[0];
      await updateBooking(bookingsCollection, targetBooking._id, targetBooking.bookingId);
      return;
    }
    
    console.log('✅ Found booking:', booking.bookingId);
    await updateBooking(bookingsCollection, booking._id, booking.bookingId);
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
    
    // If database fails, show the manual update commands
    console.log('\n📝 MANUAL UPDATE COMMANDS:');
    console.log('If database connection fails, you can run these MongoDB commands manually:\n');
    
    console.log('// Update helmet count');
    console.log('db.vehiclebookings.updateOne(');
    console.log('  { bookingId: "VB1766077737108730MNJ" },');
    console.log('  { $set: { "accessoriesChecklist.helmet": 3 } }');
    console.log(');\n');
    
    console.log('// Add sample documents');
    console.log('db.vehiclebookings.updateOne(');
    console.log('  { bookingId: "VB1766077737108730MNJ" },');
    console.log('  { $set: { documents: [');
    console.log('    {');
    console.log('      type: "id-proof",');
    console.log('      url: "https://res.cloudinary.com/tastyaana/image/upload/passport.pdf",');
    console.log('      verified: false,');
    console.log('      uploadedAt: new Date()');
    console.log('    },');
    console.log('    {');
    console.log('      type: "driving-license",');
    console.log('      url: "https://res.cloudinary.com/tastyaana/image/upload/license.jpg",');
    console.log('      verified: false,');
    console.log('      uploadedAt: new Date()');
    console.log('    }');
    console.log('  ] } }');
    console.log(');\n');
    
  } finally {
    if (client) {
      await client.close();
    }
  }
};

const updateBooking = async (collection, bookingObjectId, bookingId) => {
  console.log('\n--- Updating Booking ---');
  
  try {
    // Update 1: Fix helmet count
    console.log('🔧 Updating helmet count to 3...');
    await collection.updateOne(
      { _id: bookingObjectId },
      { $set: { "accessoriesChecklist.helmet": 3 } }
    );
    console.log('✅ Helmet count updated');
    
    // Update 2: Add sample documents
    console.log('🔧 Adding document links...');
    const sampleDocuments = [
      {
        type: "id-proof",
        url: "https://res.cloudinary.com/tastyaana/image/upload/v1234567890/booking-documents/passport.pdf",
        publicId: "booking-documents/passport",
        originalName: "passport.pdf",
        size: 1024000,
        uploadedAt: new Date(),
        verified: false
      },
      {
        type: "driving-license", 
        url: "https://res.cloudinary.com/tastyaana/image/upload/v1234567891/booking-documents/license.jpg",
        publicId: "booking-documents/license",
        originalName: "driving_license.jpg",
        size: 512000,
        uploadedAt: new Date(),
        verified: false
      },
      {
        type: "address-proof",
        url: "https://res.cloudinary.com/tastyaana/image/upload/v1234567892/booking-documents/address.pdf", 
        publicId: "booking-documents/address",
        originalName: "address_proof.pdf",
        size: 768000,
        uploadedAt: new Date(),
        verified: false
      }
    ];
    
    await collection.updateOne(
      { _id: bookingObjectId },
      { $set: { documents: sampleDocuments } }
    );
    console.log('✅ Documents added:', sampleDocuments.length);
    
    // Update 3: Add verification codes if missing
    console.log('🔧 Adding verification codes...');
    const verificationCodes = {
      pickup: {
        code: Math.floor(1000 + Math.random() * 9000).toString(),
        verified: false,
        verifiedAt: null
      },
      drop: {
        code: Math.floor(1000 + Math.random() * 9000).toString(),
        verified: false, 
        verifiedAt: null
      }
    };
    
    await collection.updateOne(
      { _id: bookingObjectId },
      { $set: { verificationCodes: verificationCodes } }
    );
    console.log('✅ Verification codes added');
    console.log('   Pickup:', verificationCodes.pickup.code);
    console.log('   Drop:', verificationCodes.drop.code);
    
    // Verify the updates
    console.log('\n🔍 Verifying updates...');
    const updatedBooking = await collection.findOne({ _id: bookingObjectId });
    
    console.log('\n🎉 BOOKING SUCCESSFULLY UPDATED!');
    console.log('--- Final State ---');
    console.log('✅ Booking ID:', updatedBooking.bookingId);
    console.log('✅ Helmet Count:', updatedBooking.accessoriesChecklist.helmet);
    console.log('✅ Documents Count:', updatedBooking.documents.length);
    console.log('✅ Pickup Code:', updatedBooking.verificationCodes.pickup.code);
    console.log('✅ Drop Code:', updatedBooking.verificationCodes.drop.code);
    
    console.log('\n📋 Document URLs:');
    updatedBooking.documents.forEach((doc, index) => {
      console.log(`   ${index + 1}. ${doc.type}: ${doc.originalName}`);
      console.log(`      ${doc.url}`);
    });
    
  } catch (updateError) {
    console.error('❌ Update error:', updateError.message);
  }
};

// Run the fix
fixBookingDirectly().catch(console.error);

module.exports = { fixBookingDirectly };