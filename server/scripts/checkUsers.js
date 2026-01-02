// Script to check existing users and their roles
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function checkUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tastyaana');
    console.log('Connected to MongoDB');

    // Check all users by role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          users: { $push: { name: '$name', email: '$email', isActive: '$isActive' } }
        }
      }
    ]);

    console.log('\n📊 Users by Role:');
    usersByRole.forEach(roleGroup => {
      console.log(`\n${roleGroup._id.toUpperCase()}: ${roleGroup.count} users`);
      roleGroup.users.forEach(user => {
        console.log(`  - ${user.name} (${user.email}) - ${user.isActive ? 'Active' : 'Inactive'}`);
      });
    });

    // Specifically check delivery boys
    const deliveryBoys = await User.find({ role: 'delivery' }).select('name email phone isOnline isActive');
    console.log(`\n🚚 Delivery Boys (${deliveryBoys.length} total):`);
    if (deliveryBoys.length === 0) {
      console.log('❌ NO DELIVERY BOYS FOUND - This is why admin sees "no delivery boys available"');
    } else {
      deliveryBoys.forEach(boy => {
        console.log(`  ✅ ${boy.name} - ${boy.email} - ${boy.isOnline ? 'Online' : 'Offline'} - ${boy.isActive ? 'Active' : 'Inactive'}`);
      });
    }

    // Check admin users
    const admins = await User.find({ role: { $in: ['admin', 'super-admin'] } }).select('name email role');
    console.log(`\n👨‍💼 Admin Users (${admins.length} total):`);
    admins.forEach(admin => {
      console.log(`  - ${admin.name} (${admin.email}) - Role: ${admin.role}`);
    });

    // Check specific test driver
    await checkTestDriver();

  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Check specific test driver
async function checkTestDriver() {
  try {
    const testDriverId = '689f994a6c1f27d9f79c68d2';
    console.log(`\n🔍 Checking test driver: ${testDriverId}`);
    
    const testDriver = await User.findById(testDriverId);
    if (testDriver) {
      console.log('✅ Test driver found:');
      console.log(`   Name: ${testDriver.name}`);
      console.log(`   Email: ${testDriver.email}`);
      console.log(`   Role: ${testDriver.role}`);
      console.log(`   Has driverProfile: ${!!testDriver.driverProfile}`);
      if (testDriver.driverProfile) {
        console.log(`   DriverProfile keys: ${Object.keys(testDriver.driverProfile).join(', ')}`);
        console.log(`   Is Online: ${testDriver.driverProfile.isOnline}`);
      }
    } else {
      console.log('❌ Test driver not found');
    }
  } catch (error) {
    console.error('Error checking test driver:', error);
  }
}

// Run the script
checkUsers();