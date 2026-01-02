const mongoose = require('mongoose');
const dotenv = require('dotenv');
const AddOn = require('../models/AddOn');
const ExtraItem = require('../models/ExtraItem');
const MealPlan = require('../models/MealPlan');

dotenv.config();

// Connect to MongoDB
mongoose.connect('mongodb+srv://harsh:harsh@unifiedcampus.i5fit.mongodb.net/onlinestore', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'MongoDB connection error:'));

db.once('open', async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Clear existing data
    await AddOn.deleteMany({});
    await ExtraItem.deleteMany({});
    
    // Get a meal plan to associate with the sample data
    const mealPlan = await MealPlan.findOne();
    
    if (!mealPlan) {
      console.error('No meal plan found. Please create a meal plan first.');
      process.exit(1);
    }
    
    // Sample AddOns data
    const sampleAddOns = [
      {
        name: 'Extra Rice',
        description: 'Additional serving of steamed rice',
        price: 20,
        appliesToAll: true,
        isActive: true,
        mealPlan: mealPlan._id,
      },
      {
        name: 'Extra Curry',
        description: 'Additional serving of curry',
        price: 30,
        appliesToAll: true,
        isActive: true,
        mealPlan: mealPlan._id,
      },
      {
        name: 'Sweet Dish',
        description: 'Daily sweet dish',
        price: 25,
        appliesToAll: false,
        isActive: true,
        mealPlan: mealPlan._id,
      },
      {
        name: 'Papad',
        description: 'Crispy papad',
        price: 10,
        appliesToAll: false,
        isActive: true,
        mealPlan: mealPlan._id,
      },
    ];
    
    // Sample ExtraItems data
    const sampleExtraItems = [
      {
        name: 'Cold Drink',
        description: '300ml Cold Drink',
        price: 30,
        category: 'beverage',
        isAvailable: true,
        mealPlan: mealPlan._id,
      },
      {
        name: 'Ice Cream',
        description: 'Vanilla Ice Cream Cup',
        price: 40,
        category: 'dessert',
        isAvailable: true,
        mealPlan: mealPlan._id,
      },
      {
        name: 'Salad',
        description: 'Fresh Garden Salad',
        price: 25,
        category: 'other',
        isAvailable: true,
        mealPlan: mealPlan._id,
      },
      {
        name: 'Bread Roll',
        description: 'Vegetable Stuffed Bread Roll',
        price: 20,
        category: 'snack',
        isAvailable: true,
        mealPlan: mealPlan._id,
      },
    ];
    
    // Insert sample data
    const createdAddOns = await AddOn.insertMany(sampleAddOns);
    const createdExtraItems = await ExtraItem.insertMany(sampleExtraItems);
    
    console.log('Sample data created successfully!');
    console.log('Created AddOns:', createdAddOns);
    console.log('Created ExtraItems:', createdExtraItems);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding sample data:', error);
    process.exit(1);
  }
});
