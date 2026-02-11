const mongoose = require('mongoose');
const Subscription = require('../models/Subscription');
const MealPlan = require('../models/MealPlan');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/onlinestore', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const testSubscriptionCreation = async () => {
  try {
    console.log('=== TESTING SUBSCRIPTION CREATION ===');
    
    // First, let's check if we have any meal plans
    const mealPlans = await MealPlan.find().limit(5);
    console.log('Available meal plans:', mealPlans.length);
    if (mealPlans.length > 0) {
      console.log('First meal plan:', {
        id: mealPlans[0]._id,
        title: mealPlans[0].title,
        pricing: mealPlans[0].pricing
      });
    }
    
    // Check if we have any users
    const users = await User.find().limit(5);
    console.log('Available users:', users.length);
    if (users.length > 0) {
      console.log('First user:', {
        id: users[0]._id,
        email: users[0].email,
        name: users[0].name
      });
    }
    
    // Check existing subscriptions
    const existingSubs = await Subscription.find().limit(5);
    console.log('Existing subscriptions:', existingSubs.length);
    if (existingSubs.length > 0) {
      console.log('First subscription:', {
        id: existingSubs[0]._id,
        subscriptionId: existingSubs[0].subscriptionId,
        status: existingSubs[0].status,
        user: existingSubs[0].user,
        mealPlan: existingSubs[0].mealPlan
      });
    }
    
    // Try to create a test subscription
    if (mealPlans.length > 0 && users.length > 0) {
      const testSubscriptionData = {
        user: users[0]._id,
        mealPlan: mealPlans[0]._id,
        planType: 'oneDay',
        duration: 1,
        shift: 'evening',
        startShift: 'evening',
        thaliCount: 1,
        deliverySettings: {
          startDate: new Date(),
          startShift: 'evening',
          deliveryDays: [{ day: 'monday' }],
          firstDeliveryDate: new Date(),
          lastDeliveryDate: new Date()
        },
        deliveryTiming: {
          morning: { enabled: false, time: '08:00' },
          evening: { enabled: true, time: '19:00' }
        },
        mealCounts: {
          totalMeals: 1,
          mealsDelivered: 0,
          mealsSkipped: 0,
          mealsRemaining: 1,
          regularMealsDelivered: 0,
          sundayMealsDelivered: 0
        },
        pricing: {
          basePricePerMeal: 75,
          totalDays: 1,
          mealsPerDay: 1,
          totalMeals: 1,
          totalThali: 1,
          totalAmount: 75,
          planPrice: 75,
          addOnsPrice: 0,
          customizationPrice: 0,
          finalAmount: 75
        },
        selectedAddOns: [],
        customizations: [],
        customizationPreferences: [],
        dietaryPreference: 'vegetarian',
        deliveryAddress: {
          street: 'Test Street',
          city: 'Test City',
          state: 'Test State',
          pincode: '123456'
        },
        startDate: new Date(),
        endDate: new Date(),
        nextDeliveryDate: new Date(),
        autoRenewal: { enabled: false, renewalType: 'same_duration' },
        status: 'pending_payment',
        paymentStatus: 'pending',
        isActive: false,
        customizationHistory: [],
        customizedDays: [],
        skippedMeals: [],
        dailyDeductions: [],
        thaliReplacements: [],
        mealCustomizations: [],
        defaultMealPreferences: {
          morning: {
            spiceLevel: 'medium',
            dietaryPreference: 'vegetarian',
            preferences: {
              noOnion: false,
              noGarlic: false,
              specialInstructions: ''
            },
            customizations: [],
            quantity: 1,
            timing: 'morning',
            isCustomized: false,
            lastUpdated: new Date()
          },
          evening: {
            spiceLevel: 'medium',
            dietaryPreference: 'vegetarian',
            preferences: {
              noOnion: false,
              noGarlic: false,
              specialInstructions: ''
            },
            customizations: [],
            quantity: 1,
            timing: 'evening',
            isCustomized: false,
            lastUpdated: new Date()
          }
        }
      };
      
             console.log('Attempting to create test subscription...');
       
       // Generate a unique subscription ID first
       const uniqueSubscriptionId = await Subscription.generateUniqueSubscriptionId();
       console.log('✅ Generated unique subscription ID:', uniqueSubscriptionId);
       
       // Update the test data with the unique ID
       testSubscriptionData.subscriptionId = uniqueSubscriptionId;
       
       const newSubscription = new Subscription(testSubscriptionData);
       await newSubscription.save();
      
      console.log('✅ Test subscription created successfully!');
      console.log('Subscription ID:', newSubscription._id);
      console.log('Subscription ID String:', newSubscription.subscriptionId);
      
      // Clean up - delete the test subscription
      await Subscription.findByIdAndDelete(newSubscription._id);
      console.log('✅ Test subscription cleaned up');
      
    } else {
      console.log('❌ Cannot create test subscription - missing meal plans or users');
    }
    
  } catch (error) {
    console.error('❌ Error in test:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    
    if (error.code === 11000) {
      console.log('This is a duplicate key error');
    }
    
    if (error.name === 'ValidationError') {
      console.log('This is a validation error');
      const validationErrors = Object.values(error.errors).map(err => err.message);
      console.log('Validation errors:', validationErrors);
    }
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the test
testSubscriptionCreation();
