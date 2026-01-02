const mongoose = require('mongoose');
const ChargesAndTaxes = require('../models/ChargesAndTaxes');
const Category = require('../models/Category');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://harsh:harsh@unifiedcampus.i5fit.mongodb.net/onlinestore');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

const seedCharges = async () => {
  try {
    // Clear existing charges
    await ChargesAndTaxes.deleteMany({});
    console.log('Cleared existing charges');

    // Get categories
    const categories = await Category.find({ isActive: true });
    console.log(`Found ${categories.length} categories`);

    // Category configurations with all charges in one document
    const categoryConfigs = [
      {
        id: '6882f91f5b1ba9254864dfeb', // Sweets
        name: 'Sweets',
        charges: [
          {
            chargeType: 'rain',
            calculationType: 'fixed',
            value: 30,
            weatherCondition: 'rain',
            priority: 5,
            description: 'Light rain charge for sweets'
          },
          {
            chargeType: 'rain',
            calculationType: 'fixed',
            value: 60,
            weatherCondition: 'heavy_rain',
            priority: 10,
            description: 'Heavy rain charge for sweets'
          },
          {
            chargeType: 'packing',
            calculationType: 'fixed',
            value: 20,
            priority: 5,
            description: 'Standard packing for sweets'
          },
          {
            chargeType: 'packing',
            calculationType: 'fixed',
            value: 40,
            minOrderAmount: 500,
            priority: 8,
            description: 'Premium packing for sweets orders above ₹500'
          },
          {
            chargeType: 'delivery',
            calculationType: 'fixed',
            value: 50,
            maxOrderAmount: 299,
            priority: 5,
            description: 'Standard delivery for sweets'
          },
          {
            chargeType: 'delivery',
            calculationType: 'fixed',
            value: 0,
            minOrderAmount: 300,
            priority: 10,
            description: 'Free delivery for sweets orders above ₹300'
          },
          {
            chargeType: 'service',
            calculationType: 'fixed',
            value: 15,
            priority: 5,
            description: '₹15 service charge for sweets'
          },
          {
            chargeType: 'handling',
            calculationType: 'fixed',
            value: 20,
            priority: 5,
            description: '₹20 handling charge for sweets'
          },
          {
            chargeType: 'tax',
            calculationType: 'fixed',
            value: 25,
            priority: 20,
            description: '₹25 tax for sweets'
          }
        ]
      },
      {
        id: '688fb41ebea1c163a6eda193', // Foodzone
        name: 'Foodzone',
        charges: [
          {
            chargeType: 'rain',
            calculationType: 'fixed',
            value: 25,
            weatherCondition: 'rain',
            priority: 5,
            description: 'Light rain charge for foodzone'
          },
          {
            chargeType: 'rain',
            calculationType: 'fixed',
            value: 50,
            weatherCondition: 'heavy_rain',
            priority: 10,
            description: 'Heavy rain charge for foodzone'
          },
          {
            chargeType: 'packing',
            calculationType: 'fixed',
            value: 15,
            priority: 5,
            description: 'Standard packing for foodzone'
          },
          {
            chargeType: 'packing',
            calculationType: 'fixed',
            value: 30,
            minOrderAmount: 500,
            priority: 8,
            description: 'Premium packing for foodzone orders above ₹500'
          },
          {
            chargeType: 'delivery',
            calculationType: 'fixed',
            value: 40,
            maxOrderAmount: 249,
            priority: 5,
            description: 'Standard delivery for foodzone'
          },
          {
            chargeType: 'delivery',
            calculationType: 'fixed',
            value: 0,
            minOrderAmount: 250,
            priority: 10,
            description: 'Free delivery for foodzone orders above ₹250'
          },
          {
            chargeType: 'service',
            calculationType: 'fixed',
            value: 12,
            priority: 5,
            description: '₹12 service charge for foodzone'
          },
          {
            chargeType: 'handling',
            calculationType: 'fixed',
            value: 15,
            priority: 5,
            description: '₹15 handling charge for foodzone'
          },
          {
            chargeType: 'tax',
            calculationType: 'fixed',
            value: 18,
            priority: 20,
            description: '₹18 tax for foodzone'
          }
        ]
      },
      {
        id: '6882f90c5b1ba9254864dfe9', // Grocery
        name: 'Grocery',
        charges: [
          {
            chargeType: 'rain',
            calculationType: 'fixed',
            value: 20,
            weatherCondition: 'rain',
            priority: 5,
            description: 'Light rain charge for grocery'
          },
          {
            chargeType: 'rain',
            calculationType: 'fixed',
            value: 40,
            weatherCondition: 'heavy_rain',
            priority: 10,
            description: 'Heavy rain charge for grocery'
          },
          {
            chargeType: 'packing',
            calculationType: 'fixed',
            value: 10,
            priority: 5,
            description: 'Standard packing for grocery'
          },
          {
            chargeType: 'packing',
            calculationType: 'fixed',
            value: 25,
            minOrderAmount: 500,
            priority: 8,
            description: 'Premium packing for grocery orders above ₹500'
          },
          {
            chargeType: 'delivery',
            calculationType: 'fixed',
            value: 30,
            maxOrderAmount: 199,
            priority: 5,
            description: 'Standard delivery for grocery'
          },
          {
            chargeType: 'delivery',
            calculationType: 'fixed',
            value: 0,
            minOrderAmount: 200,
            priority: 10,
            description: 'Free delivery for grocery orders above ₹200'
          },
          {
            chargeType: 'service',
            calculationType: 'fixed',
            value: 8,
            priority: 5,
            description: '₹8 service charge for grocery'
          },
          {
            chargeType: 'handling',
            calculationType: 'fixed',
            value: 10,
            priority: 5,
            description: '₹10 handling charge for grocery'
          },
          {
            chargeType: 'tax',
            calculationType: 'fixed',
            value: 12,
            priority: 20,
            description: '₹12 tax for grocery'
          }
        ]
      },
      {
        id: '6882f8f15b1ba9254864dfe7', // Vegetables
        name: 'Vegetables',
        charges: [
          {
            chargeType: 'rain',
            calculationType: 'fixed',
            value: 15,
            weatherCondition: 'rain',
            priority: 5,
            description: 'Light rain charge for vegetables'
          },
          {
            chargeType: 'rain',
            calculationType: 'fixed',
            value: 30,
            weatherCondition: 'heavy_rain',
            priority: 10,
            description: 'Heavy rain charge for vegetables'
          },
          {
            chargeType: 'packing',
            calculationType: 'fixed',
            value: 8,
            priority: 5,
            description: 'Standard packing for vegetables'
          },
          {
            chargeType: 'packing',
            calculationType: 'fixed',
            value: 20,
            minOrderAmount: 500,
            priority: 8,
            description: 'Premium packing for vegetables orders above ₹500'
          },
          {
            chargeType: 'delivery',
            calculationType: 'fixed',
            value: 25,
            maxOrderAmount: 149,
            priority: 5,
            description: 'Standard delivery for vegetables'
          },
          {
            chargeType: 'delivery',
            calculationType: 'fixed',
            value: 0,
            minOrderAmount: 150,
            priority: 10,
            description: 'Free delivery for vegetables orders above ₹150'
          },
          {
            chargeType: 'service',
            calculationType: 'fixed',
            value: 5,
            priority: 5,
            description: '₹5 service charge for vegetables'
          },
          {
            chargeType: 'handling',
            calculationType: 'fixed',
            value: 8,
            priority: 5,
            description: '₹8 handling charge for vegetables'
          },
          {
            chargeType: 'tax',
            calculationType: 'fixed',
            value: 10,
            priority: 20,
            description: '₹10 tax for vegetables'
          }
        ]
      },
      {
        id: '68a9f92f7f446a4c68f0455a', // Dairy
        name: 'Dairy',
        charges: [
          {
            chargeType: 'rain',
            calculationType: 'fixed',
            value: 25,
            weatherCondition: 'rain',
            priority: 5,
            description: 'Light rain charge for dairy'
          },
          {
            chargeType: 'rain',
            calculationType: 'fixed',
            value: 50,
            weatherCondition: 'heavy_rain',
            priority: 10,
            description: 'Heavy rain charge for dairy'
          },
          {
            chargeType: 'packing',
            calculationType: 'fixed',
            value: 12,
            priority: 5,
            description: 'Standard packing for dairy'
          },
          {
            chargeType: 'packing',
            calculationType: 'fixed',
            value: 25,
            minOrderAmount: 500,
            priority: 8,
            description: 'Premium packing for dairy orders above ₹500'
          },
          {
            chargeType: 'delivery',
            calculationType: 'fixed',
            value: 35,
            maxOrderAmount: 199,
            priority: 5,
            description: 'Standard delivery for dairy'
          },
          {
            chargeType: 'delivery',
            calculationType: 'fixed',
            value: 0,
            minOrderAmount: 200,
            priority: 10,
            description: 'Free delivery for dairy orders above ₹200'
          },
          {
            chargeType: 'service',
            calculationType: 'fixed',
            value: 10,
            priority: 5,
            description: '₹10 service charge for dairy'
          },
          {
            chargeType: 'handling',
            calculationType: 'fixed',
            value: 12,
            priority: 5,
            description: '₹12 handling charge for dairy'
          },
          {
            chargeType: 'tax',
            calculationType: 'fixed',
            value: 15,
            priority: 20,
            description: '₹15 tax for dairy'
          }
        ]
      },
      {
        id: '68b14f3debcbba39abe74442', // Bakery & Biscuits
        name: 'Bakery & Biscuits',
        charges: [
          {
            chargeType: 'rain',
            calculationType: 'fixed',
            value: 20,
            weatherCondition: 'rain',
            priority: 5,
            description: 'Light rain charge for bakery'
          },
          {
            chargeType: 'rain',
            calculationType: 'fixed',
            value: 40,
            weatherCondition: 'heavy_rain',
            priority: 10,
            description: 'Heavy rain charge for bakery'
          },
          {
            chargeType: 'packing',
            calculationType: 'fixed',
            value: 15,
            priority: 5,
            description: 'Standard packing for bakery'
          },
          {
            chargeType: 'packing',
            calculationType: 'fixed',
            value: 30,
            minOrderAmount: 500,
            priority: 8,
            description: 'Premium packing for bakery orders above ₹500'
          },
          {
            chargeType: 'delivery',
            calculationType: 'fixed',
            value: 35,
            maxOrderAmount: 199,
            priority: 5,
            description: 'Standard delivery for bakery'
          },
          {
            chargeType: 'delivery',
            calculationType: 'fixed',
            value: 0,
            minOrderAmount: 200,
            priority: 10,
            description: 'Free delivery for bakery orders above ₹200'
          },
          {
            chargeType: 'service',
            calculationType: 'fixed',
            value: 12,
            priority: 5,
            description: '₹12 service charge for bakery'
          },
          {
            chargeType: 'handling',
            calculationType: 'fixed',
            value: 15,
            priority: 5,
            description: '₹15 handling charge for bakery'
          },
          {
            chargeType: 'tax',
            calculationType: 'fixed',
            value: 18,
            priority: 20,
            description: '₹18 tax for bakery'
          }
        ]
      }
    ];

    // Default charges for multiple categories or unmatched categories
    const defaultCharges = [
      {
        chargeType: 'rain',
        calculationType: 'fixed',
        value: 25,
        weatherCondition: 'rain',
      priority: 5,
      description: 'Default light rain charge for multiple categories'
    },
    {
      chargeType: 'rain',
      calculationType: 'fixed',
      value: 50,
      weatherCondition: 'heavy_rain',
      priority: 10,
        description: 'Default heavy rain charge for multiple categories'
      },
      {
        chargeType: 'packing',
        calculationType: 'fixed',
        value: 15,
        priority: 5,
        description: 'Default standard packing for multiple categories'
      },
      {
        chargeType: 'packing',
        calculationType: 'fixed',
        value: 30,
        minOrderAmount: 500,
        priority: 8,
        description: 'Default premium packing for multiple categories'
      },
      {
        chargeType: 'delivery',
        calculationType: 'fixed',
        value: 40,
        maxOrderAmount: 199,
        priority: 5,
        description: 'Default standard delivery for multiple categories'
      },
      {
        chargeType: 'delivery',
        calculationType: 'fixed',
        value: 0,
        minOrderAmount: 200,
        priority: 10,
        description: 'Default free delivery for multiple categories'
      },
      {
        chargeType: 'service',
        calculationType: 'fixed',
        value: 10,
        priority: 5,
        description: '₹10 default service charge for multiple categories'
      },
      {
        chargeType: 'handling',
        calculationType: 'fixed',
        value: 12,
        priority: 5,
        description: '₹12 default handling charge for multiple categories'
      },
      {
        chargeType: 'tax',
        calculationType: 'fixed',
        value: 15,
        priority: 1,
        description: '₹15 default tax for multiple categories or unmatched categories'
      }
    ];

    // Create category-specific charge documents
    const categoryChargeDocs = categoryConfigs.map(category => ({
      categoryId: new mongoose.Types.ObjectId(category.id),
      categoryName: category.name,
      isDefault: false,
      charges: category.charges,
      isActive: true,
      createdBy: new mongoose.Types.ObjectId()
    }));

    // Create default charge document
    const defaultChargeDoc = {
      categoryId: null,
      categoryName: 'Default',
      isDefault: true,
      charges: defaultCharges,
      isActive: true,
      createdBy: new mongoose.Types.ObjectId()
    };

    // Insert all charge documents
    const allChargeDocs = [...categoryChargeDocs, defaultChargeDoc];
    console.log('Attempting to insert', allChargeDocs.length, 'documents...');
    try {
      const createdCharges = await ChargesAndTaxes.insertMany(allChargeDocs);
      console.log(`Created ${createdCharges.length} charge documents`);
    } catch (error) {
      console.error('Error inserting charges:', error);
      throw error;
    }

    // Display summary
    console.log('\n=== Charges Summary ===');
    const createdCharges = await ChargesAndTaxes.find({});
    createdCharges.forEach(doc => {
      console.log(`\n${doc.isDefault ? 'DEFAULT' : doc.categoryName.toUpperCase()}:`);
      doc.charges.forEach(charge => {
        const amount = charge.calculationType === 'fixed' ? `₹${charge.value}` : `${charge.value}%`;
        console.log(`  ${charge.chargeType.toUpperCase()}: ${amount} - ${charge.description}`);
      });
    });

    console.log('\nCharges seeded successfully!');
  } catch (error) {
    console.error('Error seeding charges:', error);
  } finally {
    mongoose.connection.close();
  }
};

// Run the seeder
connectDB().then(() => {
  seedCharges();
});