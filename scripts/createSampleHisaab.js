const mongoose = require('mongoose');
require('dotenv').config();

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

const DailyHisaab = require('../models/DailyHisaab');

// Sample data for testing
const createSampleData = async () => {
  try {
    console.log('Creating sample hisaab data...');
    
    // Replace this with actual seller ID from your database
    const sellerId = '687242b702db822f91b13586';
    
    // Create sample products
    const sampleProducts = [
      {
        productName: 'Regular Thali',
        type: 'tiffin',
        orderType: 'offline',
        count: 5,
        price: 80,
        unit: 'piece',
        sellsTo: ['customer1@example.com'],
        sellsBy: 'Test Seller',
        sellerId: sellerId,
        collectedPayment: 400,
        createdAt: new Date('2025-08-27T08:30:00Z'), // 8:30 AM - Morning
        updatedAt: new Date('2025-08-27T08:30:00Z')
      },
      {
        productName: 'Premium Thali',
        type: 'tiffin',
        orderType: 'online',
        count: 3,
        price: 120,
        unit: 'piece',
        sellsTo: ['customer2@example.com'],
        sellsBy: 'Test Seller',
        sellerId: sellerId,
        collectedPayment: 360,
        createdAt: new Date('2025-08-27T13:45:00Z'), // 1:45 PM - Afternoon
        updatedAt: new Date('2025-08-27T13:45:00Z')
      },
      {
        productName: 'Economy Thali',
        type: 'tiffin',
        orderType: 'offline',
        count: 8,
        price: 60,
        unit: 'piece',
        sellsTo: [],
        sellsBy: 'Test Seller',
        sellerId: sellerId,
        collectedPayment: 480,
        createdAt: new Date('2025-08-27T19:15:00Z'), // 7:15 PM - Evening
        updatedAt: new Date('2025-08-27T19:15:00Z')
      },
      {
        productName: 'Samosa',
        type: 'other',
        orderType: 'offline',
        count: 12,
        price: 15,
        unit: 'piece',
        sellsTo: [],
        sellsBy: 'Test Seller',
        sellerId: sellerId,
        collectedPayment: 180,
        createdAt: new Date('2025-08-27T16:30:00Z'), // 4:30 PM - Afternoon
        updatedAt: new Date('2025-08-27T16:30:00Z')
      },
      {
        productName: 'Tea',
        type: 'other',
        orderType: 'offline',
        count: 20,
        price: 10,
        unit: 'piece',
        sellsTo: [],
        sellsBy: 'Test Seller',
        sellerId: sellerId,
        collectedPayment: 200,
        createdAt: new Date('2025-08-27T09:00:00Z'), // 9:00 AM - Morning
        updatedAt: new Date('2025-08-27T09:00:00Z')
      }
    ];

    // Delete existing hisaab for today if exists
    const today = new Date();
    const start = new Date(today.setHours(0, 0, 0, 0));
    const end = new Date(today.setHours(23, 59, 59, 999));
    
    await DailyHisaab.deleteMany({
      seller: sellerId,
      date: { $gte: start, $lte: end }
    });

    // Create new hisaab with sample data
    const hisaab = new DailyHisaab({
      date: new Date(),
      seller: sellerId,
      products: sampleProducts
    });

    await hisaab.save();
    
    console.log('✅ Sample data created successfully!');
    console.log('Hisaab ID:', hisaab._id);
    console.log('Total products:', hisaab.products.length);
    console.log('Total sales:', hisaab.totalSell);
    console.log('Total tiffins:', hisaab.totalTiffin);
    console.log('Total others:', hisaab.totalOther);
    
  } catch (error) {
    console.error('Error creating sample data:', error);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

// Run the script
const run = async () => {
  await connectDB();
  await createSampleData();
};

run();