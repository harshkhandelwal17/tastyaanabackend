const mongoose = require('mongoose');
const dotenv = require('dotenv');
const MealPlan = require('../models/MealPlan');
const User = require('../models/User');

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
    // Check existing meal plans
    const existingMealPlans = await MealPlan.find({});
    console.log(`Found ${existingMealPlans.length} existing meal plans`);
    
    if (existingMealPlans.length > 0) {
      console.log('Existing meal plans:');
      existingMealPlans.forEach(plan => {
        console.log(`- ${plan.title} (${plan.tier}) - Status: ${plan.status}`);
      });
      process.exit(0);
    }
    
    // Get a user to create meal plans
    const user = await User.findOne({ role: 'admin' }) || await User.findOne();
    
    if (!user) {
      console.error('No user found. Please create a user first.');
      process.exit(1);
    }
    
    console.log(`Using user: ${user.name} (${user.email})`);
    
    // Sample meal plans data
    const sampleMealPlans = [
      {
        title: 'Basic Home Style Meals',
        description: 'Delicious home-cooked meals with traditional Indian flavors. Perfect for daily nourishment with balanced nutrition.',
        tier: 'basic',
        pricing: [
          { days: 1, price: 65, name: 'One Day', totalthali: 1 },
          { days: 10, price: 600, name: 'Ten Days', totalthali: 10 },
          { days: 30, price: 3900, name: 'One Month', totalthali: 30 }
        ],
        includes: [
          { name: 'Rice', quantity: 1, unit: 'bowl' },
          { name: 'Dal', quantity: 1, unit: 'bowl' },
          { name: 'Vegetables', quantity: 2, unit: 'dishes' },
          { name: 'Roti', quantity: 2, unit: 'pieces' },
          { name: 'Salad', quantity: 1, unit: 'bowl' }
        ],
        nutritionalInfo: {
          calories: 800,
          protein: '25g',
          carbs: '120g',
          fat: '15g',
          fiber: '12g',
          sodium: '800mg'
        },
        imageUrls: [
          'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
          'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400'
        ],
        features: ['Homestyle', 'Fresh Ingredients', 'No Preservatives', 'Balanced Nutrition'],
        preparationTime: '30 minutes',
        servingSize: '1 person',
        isPopular: true,
        status: 'active',
        tags: ['comfort-food', 'healthy', 'traditional'],
        shifts: ['morning', 'evening'],
        createdBy: user._id
      },
      {
        title: 'Premium Gourmet Experience',
        description: 'Elevated dining experience with premium ingredients and chef-special recipes. Perfect for special occasions and food enthusiasts.',
        tier: 'premium',
        pricing: [
          { days: 1, price: 120, name: 'One Day', totalthali: 1 },
          { days: 10, price: 1100, name: 'Ten Days', totalthali: 10 },
          { days: 30, price: 7200, name: 'One Month', totalthali: 30 }
        ],
        includes: [
          { name: 'Premium Rice', quantity: 1, unit: 'bowl' },
          { name: 'Special Dal', quantity: 1, unit: 'bowl' },
          { name: 'Gourmet Vegetables', quantity: 3, unit: 'dishes' },
          { name: 'Fresh Roti', quantity: 3, unit: 'pieces' },
          { name: 'Fresh Salad', quantity: 1, unit: 'bowl' },
          { name: 'Sweet Dish', quantity: 1, unit: 'piece' }
        ],
        nutritionalInfo: {
          calories: 1000,
          protein: '35g',
          carbs: '140g',
          fat: '20g',
          fiber: '15g',
          sodium: '900mg'
        },
        imageUrls: [
          'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400',
          'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400'
        ],
        features: ['Gourmet', 'Premium Ingredients', 'Chef Special', 'Exotic Flavors'],
        preparationTime: '45 minutes',
        servingSize: '1 person',
        isPopular: true,
        status: 'active',
        tags: ['gourmet', 'premium', 'exotic'],
        shifts: ['morning', 'evening'],
        createdBy: user._id
      },
      {
        title: 'Budget Friendly Meals',
        description: 'Affordable yet nutritious meals perfect for students and budget-conscious individuals. Great value for money.',
        tier: 'low',
        pricing: [
          { days: 1, price: 45, name: 'One Day', totalthali: 1 },
          { days: 10, price: 400, name: 'Ten Days', totalthali: 10 },
          { days: 30, price: 2500, name: 'One Month', totalthali: 30 }
        ],
        includes: [
          { name: 'Rice', quantity: 1, unit: 'bowl' },
          { name: 'Dal', quantity: 1, unit: 'bowl' },
          { name: 'Vegetables', quantity: 1, unit: 'dish' },
          { name: 'Roti', quantity: 2, unit: 'pieces' }
        ],
        nutritionalInfo: {
          calories: 600,
          protein: '20g',
          carbs: '90g',
          fat: '10g',
          fiber: '8g',
          sodium: '600mg'
        },
        imageUrls: [
          'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400'
        ],
        features: ['Budget Friendly', 'Nutritious', 'Student Friendly', 'Quick Delivery'],
        preparationTime: '20 minutes',
        servingSize: '1 person',
        isPopular: false,
        status: 'active',
        tags: ['budget', 'student-friendly', 'quick'],
        shifts: ['morning', 'evening'],
        createdBy: user._id
      }
    ];
    
    // Insert sample meal plans
    const createdMealPlans = await MealPlan.insertMany(sampleMealPlans);
    
    console.log('Sample meal plans created successfully!');
    console.log('Created meal plans:');
    createdMealPlans.forEach(plan => {
      console.log(`- ${plan.title} (${plan.tier}) - Status: ${plan.status}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking/creating meal plans:', error);
    process.exit(1);
  }
});
