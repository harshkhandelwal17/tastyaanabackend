const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = "mongodb://harsh:harsh@unifiedcampus-shard-00-00.i5fit.mongodb.net:27017,unifiedcampus-shard-00-01.i5fit.mongodb.net:27017,unifiedcampus-shard-00-02.i5fit.mongodb.net:27017/onlinestore?ssl=true&replicaSet=atlas-ivxkaa-shard-0&authSource=admin&retryWrites=true";

async function main() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  const User = require('./models/User');
  const Vehicle = require('./models/Vehicle');

  const sellerEmail = 'vikashrathor.499@gmail.com';

  // Find the seller
  const seller = await User.findOne({ email: sellerEmail }).lean();
  if (!seller) {
    console.log(`No user found with email: ${sellerEmail}`);
    await mongoose.disconnect();
    return;
  }
  console.log(`Found seller: ${seller.name || seller.email} (ID: ${seller._id})`);

  // Find all vehicles for this seller
  const vehicles = await Vehicle.find({ sellerId: seller._id }).lean();
  console.log(`Found ${vehicles.length} vehicle(s) associated with this seller`);

  if (vehicles.length === 0) {
    console.log('No vehicles to update.');
    await mongoose.disconnect();
    return;
  }

  // Print current state
  vehicles.forEach(v => {
    console.log(`  - ${v.name || v.vehicleNo} | status: ${v.status} | availability: ${v.availability}`);
  });

  // Update all vehicles: set availability to 'available' and status to 'active'
  const result = await Vehicle.updateMany(
    { sellerId: seller._id },
    { $set: { availability: 'available', status: 'active' } }
  );

  console.log(`\nUpdated ${result.modifiedCount} vehicle(s) to availability='available', status='active'`);

  // Verify
  const updated = await Vehicle.find({ sellerId: seller._id }, { name: 1, vehicleNo: 1, status: 1, availability: 1 }).lean();
  console.log('\nVerification - Updated vehicles:');
  updated.forEach(v => {
    console.log(`  - ${v.name || v.vehicleNo} | status: ${v.status} | availability: ${v.availability}`);
  });

  await mongoose.disconnect();
  console.log('\nDone. Disconnected from MongoDB.');
}

main().catch(err => {
  console.error('Error:', err);
  mongoose.disconnect();
  process.exit(1);
});
