const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Category = require('../models/Category');
const CategorySlot = require('../models/CategorySlot');
const moment = require('moment-timezone');

dotenv.config({ path: '../.env' });

// Default slot configurations
const WEEKDAY_SLOTS = [
  { startTime: '09:00', endTime: '11:00', isActive: true, maxOrders: 50 },
  { startTime: '11:00', endTime: '13:00', isActive: true, maxOrders: 50 },
  { startTime: '16:00', endTime: '18:00', isActive: true, maxOrders: 50 },
  { startTime: '18:00', endTime: '20:00', isActive: true, maxOrders: 50 }
];

const WEEKEND_SLOTS = [
  { startTime: '09:00', endTime: '12:00', isActive: true, maxOrders: 40 },
  { startTime: '12:00', endTime: '15:00', isActive: true, maxOrders: 40 },
  { startTime: '15:00', endTime: '18:00', isActive: true, maxOrders: 40 },
  { startTime: '18:00', endTime: '21:00', isActive: true, maxOrders: 40 }
];

const DAYS = [
  { dayOfWeek: 0, dayName: 'Sunday' },
  { dayOfWeek: 1, dayName: 'Monday' },
  { dayOfWeek: 2, dayName: 'Tuesday' },
  { dayOfWeek: 3, dayName: 'Wednesday' },
  { dayOfWeek: 4, dayName: 'Thursday' },
  { dayOfWeek: 5, dayName: 'Friday' },
  { dayOfWeek: 6, dayName: 'Saturday' }
];

async function seedCategorySlots() {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('Connection string:', process.env.MONGO_URI ? 'Found' : 'Missing');
    
    if (!process.env.MONGO_URI) {
      throw new Error('MongoDB connection string is not defined in environment variables');
    }

    // Connect to MongoDB with better error handling
    mongoose.connection.on('error', err => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });

    mongoose.connection.once('open', () => {
      console.log('MongoDB connected successfully');
    });

    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });
    
    console.log('MongoDB Connected successfully to database:', mongoose.connection.name);

    // Get all categories
    const categories = await Category.find({});
    
    if (categories.length === 0) {
      console.log('No categories found. Please create categories first.');
      process.exit(1);
    }

    let createdCount = 0;
    let skippedCount = 0;

    // For each category
    for (const category of categories) {
      // For each day of the week
      for (const day of DAYS) {
        // Check if slot configuration already exists
        const existingSlot = await CategorySlot.findOne({
          category: category._id,
          dayOfWeek: day.dayOfWeek
        });

        if (!existingSlot) {
          // Determine which slots to use based on weekday/weekend
          const isWeekend = [0, 6].includes(day.dayOfWeek); // 0 = Sunday, 6 = Saturday
          const slots = isWeekend ? [...WEEKEND_SLOTS] : [...WEEKDAY_SLOTS];

          // Create new category slot
          const categorySlot = new CategorySlot({
            category: category._id,
            dayOfWeek: day.dayOfWeek,
            dayName: day.dayName,
            slots: slots,
            isActive: true
          });

          await categorySlot.save();
          createdCount++;
          console.log(`Created slots for ${category.name} on ${day.dayName}`);
        } else {
          skippedCount++;
          console.log(`Skipping ${category.name} on ${day.dayName} - already exists`);
        }
      }
    }

    console.log('\nSlot seeding complete!');
    console.log(`Created: ${createdCount} slot configurations`);
    console.log(`Skipped: ${skippedCount} existing configurations`);

    process.exit(0);
  } catch (err) {
    console.error('Error seeding category slots:', err);
    process.exit(1);
  }
}

seedCategorySlots();
