// Script to create sample delivery boys
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const deliveryBoys = [
  {
    name: "Rajesh Kumar",
    email: "rajesh.delivery@tastyaana.com",
    phone: "+91-9876543210",
    password: "password123",
    role: "delivery"
  },
  {
    name: "Priya Sharma", 
    email: "priya.delivery@tastyaana.com",
    phone: "+91-8765432109",
    password: "password123",
    role: "delivery"
  },
  {
    name: "Amit Singh",
    email: "amit.delivery@tastyaana.com", 
    phone: "+91-7654321098",
    password: "password123",
    role: "delivery"
  },
  {
    name: "Sunita Devi",
    email: "sunita.delivery@tastyaana.com",
    phone: "+91-6543210987", 
    password: "password123",
    role: "delivery"
  },
  {
    name: "Mohammed Ali",
    email: "ali.delivery@tastyaana.com",
    phone: "+91-5432109876",
    password: "password123", 
    role: "delivery"
  }
];

async function createDeliveryBoys() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tastyaana');
    console.log('Connected to MongoDB');

    // Check if delivery boys already exist
    const existingDeliveryBoys = await User.find({ role: 'delivery' });
    console.log(`Found ${existingDeliveryBoys.length} existing delivery boys`);

    // Create delivery boys
    for (const deliveryBoy of deliveryBoys) {
      // Check if this delivery boy already exists
      const existing = await User.findOne({ 
        $or: [
          { email: deliveryBoy.email },
          { phone: deliveryBoy.phone }
        ]
      });

      if (existing) {
        console.log(`Delivery boy ${deliveryBoy.name} already exists`);
        continue;
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(deliveryBoy.password, salt);

      // Create new delivery boy
      const newDeliveryBoy = new User({
        name: deliveryBoy.name,
        email: deliveryBoy.email,
        phone: deliveryBoy.phone,
        password: hashedPassword,
        role: deliveryBoy.role,
        isActive: true,
        isBlocked: false,
        emailVerified: true,
        driverProfile: {
          isOnline: true,
          currentLocation: {
            lat: 22.763813,
            lng: 75.885822,
            lastUpdated: new Date()
          },
          vehicle: {
            type: 'bike',
            number: 'Coming Soon'
          },
          deliveries: 0,
          workingHours: {
            start: '09:00',
            end: '22:00'
          }
        }
      });

      await newDeliveryBoy.save();
      console.log(`✅ Created delivery boy: ${deliveryBoy.name}`);
    }

    // Verify creation
    const allDeliveryBoys = await User.find({ role: 'delivery' }).select('name email phone isOnline');
    console.log('\n📋 All Delivery Boys:');
    allDeliveryBoys.forEach(boy => {
      console.log(`- ${boy.name} (${boy.email}) - ${boy.isOnline ? 'Online' : 'Offline'}`);
    });

    console.log(`\n🎉 Successfully created/verified ${allDeliveryBoys.length} delivery boys!`);
    
  } catch (error) {
    console.error('Error creating delivery boys:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Run the script
createDeliveryBoys();