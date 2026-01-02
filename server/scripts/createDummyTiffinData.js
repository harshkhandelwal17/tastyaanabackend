require('dotenv').config();
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const connect = require('../config/database');

// Import models
const User = require('../models/User');
const MealPlan = require('../models/MealPlan');
const Subscription = require('../models/Subscription');
const DailyOrder = require('../models/DailyOrder');
const Driver = require('../models/Driver');

const createDummyData = async () => {
  try {
    console.log('Connecting to database...');
    await connect();
    console.log('✅ Database connected');

    // 1. Create dummy seller user
    let seller = await User.findOne({ email: 'seller@tastyaana.com' });
    if (!seller) {
      seller = new User({
        name: 'Test Seller',
        email: 'seller@tastyaana.com',
        password: 'password123',
        phone: '9876543210',
        role: 'seller',
        isActive: true,
        emailVerified: true
      });
      await seller.save();
      console.log('✅ Created dummy seller:', seller.email);
    } else {
      console.log('✅ Seller already exists:', seller.email);
    }

    // 2. Create dummy customer users
    const customerEmails = ['customer1@test.com', 'customer2@test.com', 'customer3@test.com'];
    const customers = [];
    
    for (const email of customerEmails) {
      let customer = await User.findOne({ email });
      if (!customer) {
        customer = new User({
          name: `Customer ${email.split('@')[0]}`,
          email,
          password: 'password123',
          phone: `987654321${customers.length}`,
          role: 'customer',
          isActive: true,
          emailVerified: true,
          deliveryAddress: {
            street: `Test Street ${customers.length + 1}`,
            area: 'Test Area',
            city: 'Indore',
            state: 'MP',
            pincode: '452001',
            coordinates: { lat: 22.7196, lng: 75.8577 }
          }
        });
        await customer.save();
        console.log('✅ Created dummy customer:', customer.email);
      }
      customers.push(customer);
    }

    // 3. Create dummy meal plans
    const mealPlanData = [
      {
        title: 'Home Style Tiffin',
        description: 'Traditional home-cooked meals with authentic taste',
        tier: 'basic',
        pricing: [
          { days: 7, price: 700, name: 'Weekly Plan', totalthali: 7 },
          { days: 15, price: 1500, name: 'Bi-weekly Plan', totalthali: 15 },
          { days: 30, price: 2800, name: 'Monthly Plan', totalthali: 30 }
        ],
        includes: [
          { name: 'Rice', quantity: 1, unit: 'bowl' },
          { name: 'Dal', quantity: 1, unit: 'bowl' },
          { name: 'Sabzi', quantity: 1, unit: 'bowl' },
          { name: 'Roti', quantity: 3, unit: 'pieces' }
        ],
        features: ['Homestyle', 'Fresh Ingredients', 'No Preservatives'],
        preparationTime: '30 minutes',
        servingSize: '1 person',
        isPopular: true
      },
      {
        title: 'Premium Thali',
        description: 'Premium meals with variety of dishes and sweets',
        tier: 'premium',
        pricing: [
          { days: 7, price: 1000, name: 'Weekly Premium', totalthali: 7 },
          { days: 15, price: 2100, name: 'Bi-weekly Premium', totalthali: 15 },
          { days: 30, price: 3800, name: 'Monthly Premium', totalthali: 30 }
        ],
        includes: [
          { name: 'Rice', quantity: 1, unit: 'bowl' },
          { name: 'Dal', quantity: 1, unit: 'bowl' },
          { name: 'Sabzi', quantity: 2, unit: 'bowls' },
          { name: 'Roti', quantity: 4, unit: 'pieces' },
          { name: 'Sweet', quantity: 1, unit: 'piece' }
        ],
        features: ['Premium Quality', 'Multiple Dishes', 'Sweet Included'],
        preparationTime: '45 minutes',
        servingSize: '1 person'
      }
    ];

    const mealPlans = [];
    for (const planData of mealPlanData) {
      let mealPlan = await MealPlan.findOne({ title: planData.title, seller: seller._id });
      if (!mealPlan) {
        mealPlan = new MealPlan({
          ...planData,
          seller: seller._id,
          vendor: seller._id, // For compatibility
          createdBy: seller._id
        });
        await mealPlan.save();
        console.log('✅ Created meal plan:', mealPlan.title);
      }
      mealPlans.push(mealPlan);
    }

    // 4. Create dummy subscriptions
    const subscriptions = [];
    for (let i = 0; i < customers.length; i++) {
      const customer = customers[i];
      const mealPlan = mealPlans[i % mealPlans.length];
      const shifts = ['morning', 'evening'];
      const shift = shifts[i % shifts.length];
      
      // Check if subscription already exists
      let subscription = await Subscription.findOne({ 
        user: customer._id, 
        mealPlan: mealPlan._id 
      });
      
      if (!subscription) {
        subscription = new Subscription({
          user: customer._id,
          mealPlan: mealPlan._id,
          defaultMeal: mealPlan._id, // Required field
          duration: 15, // Required field
          startShift: shift,
          deliverySettings: {
            startDate: moment().tz('Asia/Kolkata').subtract(5, 'days').toDate(),
            startShift: shift,
            deliveryDays: [
              { day: 'monday' }, { day: 'tuesday' }, { day: 'wednesday' },
              { day: 'thursday' }, { day: 'friday' }, { day: 'saturday' }
            ]
          },
          planType: 'tenDays',
          pricing: {
            mealsPerDay: 1,
            pricePerMeal: mealPlan.pricing[1].price / mealPlan.pricing[1].totalthali,
            totalAmount: mealPlan.pricing[1].price,
            finalAmount: mealPlan.pricing[1].price,
            mealsPerDay: 1
          },
          mealCounts: {
            totalMeals: 15,
            mealsRemaining: 8,
            mealsDelivered: 7,
            mealsSkipped: 0
          },
          shift: shift,
          startDate: moment().tz('Asia/Kolkata').subtract(5, 'days').toDate(),
          endDate: moment().tz('Asia/Kolkata').add(10, 'days').toDate(),
          status: 'active',
          deliveryAddress: customer.deliveryAddress
        });
        await subscription.save();
        console.log(`✅ Created subscription for ${customer.name} - ${shift} shift`);
      }
      subscriptions.push(subscription);
    }

    // 5. Create dummy daily orders for today
    const today = moment().tz('Asia/Kolkata').startOf('day').toDate();
    console.log('Creating daily orders for:', moment(today).format('YYYY-MM-DD'));

    for (const subscription of subscriptions) {
      const shifts = subscription.shift === 'both' ? ['morning', 'evening'] : [subscription.shift];
      
      for (const shift of shifts) {
        // Check if daily order already exists
        let existingOrder = await DailyOrder.findOne({
          subscriptionId: subscription._id,
          date: today,
          shift: shift
        });

        if (!existingOrder) {
          const preparationTime = shift === 'morning' ? 
            moment().tz('Asia/Kolkata').hour(8).minute(0).second(0).toDate() :
            moment().tz('Asia/Kolkata').hour(19).minute(0).second(0).toDate();

          const dailyOrder = new DailyOrder({
            subscriptionId: subscription._id,
            userId: subscription.user,
            vendorId: seller._id,
            date: today,
            shift: shift,
            preparationTime: preparationTime,
            status: ['pending', 'confirmed', 'preparing'][Math.floor(Math.random() * 3)],
            mealPlan: subscription.defaultMeal, // Reference to MealPlan ObjectId
            isCustomized: false,
            deliveryAddress: subscription.deliveryAddress,
            planType: subscription.planType,
            orderType: 'subscription'
          });
          
          await dailyOrder.save();
          console.log(`✅ Created daily order: ${subscription.subscriptionId} - ${shift} - ${dailyOrder.status}`);
        }
      }
    }

    // 6. Create dummy drivers
    const driverEmails = ['driver1@tastyaana.com', 'driver2@tastyaana.com'];
    
    for (const email of driverEmails) {
      let driver = await User.findOne({ email });
      if (!driver) {
        driver = new User({
          name: `Driver ${email.split('@')[0]}`,
          email,
          password: 'password123',
          phone: `876543210${driverEmails.indexOf(email)}`,
          role: 'delivery',
          isActive: true,
          emailVerified: true,
          driverProfile: {
            isOnline: true,
            isAvailable: true,
            vehicleType: 'bike',
            vehicleNumber: `MP09AB123${driverEmails.indexOf(email)}`,
            shifts: ['morning', 'evening'],
            currentLocation: {
              lat: 22.7196,
              lng: 75.8577
            }
          }
        });
        await driver.save();
        console.log('✅ Created dummy driver:', driver.email);
      }
    }

    console.log('\n🎉 Dummy data creation completed successfully!');
    console.log('\nTest credentials:');
    console.log('Seller: seller@tastyaana.com / password123');
    console.log('Customer: customer1@test.com / password123');
    console.log('Driver: driver1@tastyaana.com / password123');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error creating dummy data:', error);
    process.exit(1);
  }
};

// Run the script
createDummyData();