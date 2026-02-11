const mongoose = require('mongoose');
require('dotenv').config();

const Driver = require('../models/Driver');

const sampleDrivers = [
  {
    name: 'Rajesh Kumar',
    email: 'rajesh.food@tastyaana.com',
    phone: '+91-9876543210',
    password: 'password123',
    vehicle: {
      type: 'bike',
      number: 'DL-1234',
      model: 'Honda Activa',
      color: 'Red'
    },
    specialization: {
      categories: ['food', 'sweets'],
      description: 'Expert in food and sweets delivery with 3+ years experience'
    },
    isActive: true,
    isOnline: true,
    rating: 4.5,
    deliveries: 150,
    currentLocation: {
      lat: 28.6139,
      lng: 77.2090,
      lastUpdated: new Date()
    },
    emailVerified: true
  },
  {
    name: 'Priya Sharma',
    email: 'priya.grocery@tastyaana.com',
    phone: '+91-9876543211',
    password: 'password123',
    vehicle: {
      type: 'scooter',
      number: 'DL-5678',
      model: 'TVS Jupiter',
      color: 'Blue'
    },
    specialization: {
      categories: ['vegetable', 'grocery'],
      description: 'Specialist in fresh vegetables and grocery items delivery'
    },
    isActive: true,
    isOnline: true,
    rating: 4.7,
    deliveries: 200,
    currentLocation: {
      lat: 28.6149,
      lng: 77.2100,
      lastUpdated: new Date()
    },
    emailVerified: true
  },
  {
    name: 'Amit Singh',
    email: 'amit.stationary@tastyaana.com',
    phone: '+91-9876543212',
    password: 'password123',
    vehicle: {
      type: 'bike',
      number: 'DL-9012',
      model: 'Bajaj Pulsar',
      color: 'Black'
    },
    specialization: {
      categories: ['stationery', 'general'],
      description: 'Reliable delivery for stationery and general items'
    },
    isActive: true,
    isOnline: true,
    rating: 4.3,
    deliveries: 120,
    currentLocation: {
      lat: 28.6129,
      lng: 77.2080,
      lastUpdated: new Date()
    },
    emailVerified: true
  },
  {
    name: 'Sunita Devi',
    email: 'sunita.sweets@tastyaana.com',
    phone: '+91-9876543213',
    password: 'password123',
    vehicle: {
      type: 'scooter',
      number: 'DL-3456',
      model: 'Honda Dio',
      color: 'White'
    },
    specialization: {
      categories: ['sweets', 'food'],
      description: 'Expert in handling delicate sweets and food items'
    },
    isActive: true,
    isOnline: false,
    rating: 4.8,
    deliveries: 180,
    currentLocation: {
      lat: 28.6159,
      lng: 77.2110,
      lastUpdated: new Date()
    },
    emailVerified: true
  },
  {
    name: 'Mohammed Ali',
    email: 'ali.general@tastyaana.com',
    phone: '+91-9876543214',
    password: 'password123',
    vehicle: {
      type: 'car',
      number: 'DL-7890',
      model: 'Maruti Alto',
      color: 'Silver'
    },
    specialization: {
      categories: ['general'],
      description: 'All-round delivery partner for any type of items'
    },
    isActive: true,
    isOnline: true,
    rating: 4.4,
    deliveries: 95,
    currentLocation: {
      lat: 28.6119,
      lng: 77.2070,
      lastUpdated: new Date()
    },
    emailVerified: true
  }
];

async function seedDeliveryPartners() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Clear existing drivers (optional)
    await Driver.deleteMany({});
    console.log('Cleared existing drivers');

    // Insert sample drivers
    const createdDrivers = await Driver.insertMany(sampleDrivers);
    console.log(`Created ${createdDrivers.length} delivery partners:`);

    createdDrivers.forEach(driver => {
      console.log(`- ${driver.name} (${driver.specialization.categories.join(', ')}) - ${driver.phone}`);
    });

    console.log('\nDelivery partners seeded successfully!');
    console.log('\nLogin credentials for testing:');
    console.log('Email: rajesh.food@tastyaana.com, Password: password123');
    console.log('Email: priya.grocery@tastyaana.com, Password: password123');
    console.log('Email: amit.stationary@tastyaana.com, Password: password123');
    console.log('Email: sunita.sweets@tastyaana.com, Password: password123');
    console.log('Email: ali.general@tastyaana.com, Password: password123');

  } catch (error) {
    console.error('Error seeding delivery partners:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run the seeding function
seedDeliveryPartners();