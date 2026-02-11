const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const groceryData = require('../config/groceryData.json');

const seedGroceryProducts = async () => {
  try {
    console.log('🌱 Starting grocery products seeding...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/onlinestore');
    console.log('✅ Connected to MongoDB');

    // Get or create grocery categories
    const categories = {
      vegetables: await Category.findOneAndUpdate(
        { name: 'Vegetables' },
        { 
          name: 'Vegetables',
          slug: 'vegetables',
          description: 'Fresh vegetables and greens',
          icon: '🥬',
          color: '#22c55e'
        },
        { upsert: true, new: true }
      ),
      fruits: await Category.findOneAndUpdate(
        { name: 'Fruits' },
        { 
          name: 'Fruits',
          slug: 'fruits',
          description: 'Fresh fruits and berries',
          icon: '🍎',
          color: '#ef4444'
        },
        { upsert: true, new: true }
      ),
      dairy: await Category.findOneAndUpdate(
        { name: 'Dairy' },
        { 
          name: 'Dairy',
          slug: 'dairy',
          description: 'Fresh dairy products',
          icon: '🥛',
          color: '#3b82f6'
        },
        { upsert: true, new: true }
      ),
      pulses: await Category.findOneAndUpdate(
        { name: 'Pulses & Grains' },
        { 
          name: 'Pulses & Grains',
          slug: 'pulses-grains',
          description: 'Pulses, lentils, and grains',
          icon: '🫘',
          color: '#eab308'
        },
        { upsert: true, new: true }
      ),
      spices: await Category.findOneAndUpdate(
        { name: 'Spices & Masalas' },
        { 
          name: 'Spices & Masalas',
          slug: 'spices-masalas',
          description: 'Fresh spices and masalas',
          icon: '🌶️',
          color: '#f97316'
        },
        { upsert: true, new: true }
      )
    };

    console.log('✅ Categories ready');

    // Get a default seller/admin user
    const defaultSeller = await User.findOne({ role: { $in: ['admin', 'seller'] } });
    if (!defaultSeller) {
      console.log('❌ No admin/seller user found. Please create one first.');
      return;
    }

    console.log(`✅ Using seller: ${defaultSeller.name}`);

    // Map category IDs
    const categoryMap = {
      '507f1f77bcf86cd799439020': categories.vegetables._id, // Vegetables
      '507f1f77bcf86cd799439021': categories.vegetables._id, // Vegetables subcategory
      '507f1f77bcf86cd799439022': categories.fruits._id,     // Fruits
      '507f1f77bcf86cd799439023': categories.fruits._id,     // Fruits subcategory
      '507f1f77bcf86cd799439024': categories.dairy._id,      // Dairy
      '507f1f77bcf86cd799439025': categories.dairy._id,      // Dairy subcategory
    };

    // Process each grocery product
    for (const productData of groceryData) {
      try {
        // Check if product already exists
        const existingProduct = await Product.findOne({ 
          name: productData.name,
          category: categoryMap[productData.category]
        });

        if (existingProduct) {
          console.log(`⏭️  Product already exists: ${productData.name}`);
          continue;
        }

        // Prepare product data
        const product = new Product({
          ...productData,
          category: categoryMap[productData.category],
          subcategory: categoryMap[productData.subcategory] || categoryMap[productData.category],
          seller: defaultSeller._id,
          createdBy: defaultSeller._id,
          slug: productData.name.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-'),
          ratings: {
            average: 4.2 + Math.random() * 0.8, // Random rating between 4.2-5.0
            count: Math.floor(Math.random() * 50) + 10 // Random review count 10-60
          }
        });

        await product.save();
        console.log(`✅ Added: ${productData.name}`);

      } catch (error) {
        console.error(`❌ Error adding ${productData.name}:`, error.message);
      }
    }

    console.log('🎉 Grocery products seeding completed!');
    
    // Get final count
    const totalProducts = await Product.countDocuments();
    const groceryProducts = await Product.countDocuments({ 
      category: { $in: Object.values(categories).map(cat => cat._id) }
    });
    
    console.log(`📊 Total products in database: ${totalProducts}`);
    console.log(`🥬 Grocery products added: ${groceryProducts}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run the seeding if this file is executed directly
if (require.main === module) {
  seedGroceryProducts();
}

module.exports = seedGroceryProducts; 