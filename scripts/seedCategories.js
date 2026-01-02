const mongoose = require('mongoose');
const Category = require('../models/Category');

// Connect to database
require('dotenv').config();
require('../config/database');

const defaultCategories = [
  {
    name: 'Electronics',
    description: 'Electronic gadgets and devices',
    slug: 'electronics',
    isActive: true,
    sortOrder: 1
  },
  {
    name: 'Gadgets',
    description: 'Smart gadgets and accessories',
    slug: 'gadgets',
    isActive: true,
    sortOrder: 2
  },
  {
    name: 'Mobile & Accessories',
    description: 'Mobile phones and accessories',
    slug: 'mobile-accessories',
    isActive: true,
    sortOrder: 3
  },
  {
    name: 'Computers & Laptops',
    description: 'Computers, laptops and accessories',
    slug: 'computers-laptops',
    isActive: true,
    sortOrder: 4
  },
  {
    name: 'Home Appliances',
    description: 'Home and kitchen appliances',
    slug: 'home-appliances',
    isActive: true,
    sortOrder: 5
  },
  {
    name: 'Fashion',
    description: 'Fashion and clothing items',
    slug: 'fashion',
    isActive: true,
    sortOrder: 6
  },
  {
    name: 'Books & Media',
    description: 'Books, magazines and media content',
    slug: 'books-media',
    isActive: true,
    sortOrder: 7
  },
  {
    name: 'Sports & Fitness',
    description: 'Sports and fitness equipment',
    slug: 'sports-fitness',
    isActive: true,
    sortOrder: 8
  },
  {
    name: 'Other',
    description: 'Other miscellaneous items',
    slug: 'other',
    isActive: true,
    sortOrder: 9
  }
];

async function seedCategories() {
  try {
    console.log('🌱 Seeding categories...');
    
    // Check if categories already exist
    const existingCount = await Category.countDocuments();
    if (existingCount > 0) {
      console.log(`✅ Categories already exist (${existingCount} found). Skipping seed.`);
      return;
    }

    // Insert default categories
    await Category.insertMany(defaultCategories);
    
    console.log('✅ Default categories seeded successfully!');
    console.log(`📊 Added ${defaultCategories.length} categories`);
    
  } catch (error) {
    console.error('❌ Error seeding categories:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
  }
}

// Run the seeder
seedCategories();