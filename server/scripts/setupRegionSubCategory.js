// Sample data creation script for Region and SubCategory models
require('dotenv').config();
const mongoose = require('mongoose');
const Region = require('../models/Region');
const SubCategory = require('../models/SubCategory');
const Category = require('../models/Category');

// Database connection setup
async function connectDB() {
  try {
    // Use the same connection string as the main app
    const connectionString = process.env.MONGODB_URI || "mongodb+srv://harsh:harsh@unifiedcampus.i5fit.mongodb.net/onlinestore";
    await mongoose.connect(connectionString);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

async function createSampleRegions() {
  console.log('Creating cuisine-based regions...');
  
  const cuisineRegions = [
    // Indian Regional Cuisines
    {
      name: 'South Indian',
      code: 'SI',
      state: 'Multi-State',
      country: 'India',
      description: 'Authentic South Indian cuisine including Tamil, Telugu, Kannada and Malayalam dishes',
      deliverySettings: {
        isDeliveryAvailable: true,
        deliveryCharge: 40,
        freeDeliveryThreshold: 300,
        estimatedDeliveryDays: { min: 1, max: 2 }
      },
      priority: 15,
      isActive: true
    },
    {
      name: 'North Indian',
      code: 'NI',
      state: 'Multi-State',
      country: 'India',
      description: 'Traditional North Indian cuisine with rich gravies, naans and tandoor items',
      deliverySettings: {
        isDeliveryAvailable: true,
        deliveryCharge: 40,
        freeDeliveryThreshold: 300,
        estimatedDeliveryDays: { min: 1, max: 2 }
      },
      priority: 14,
      isActive: true
    },
    {
      name: 'Gujarati',
      code: 'GUJ',
      state: 'Gujarat',
      country: 'India',
      description: 'Sweet and savory Gujarati cuisine with dhokla, thepla and traditional thali',
      deliverySettings: {
        isDeliveryAvailable: true,
        deliveryCharge: 35,
        freeDeliveryThreshold: 250,
        estimatedDeliveryDays: { min: 1, max: 2 }
      },
      priority: 13,
      isActive: true
    },
    {
      name: 'Rajasthani',
      code: 'RAJ',
      state: 'Rajasthan',
      country: 'India',
      description: 'Royal Rajasthani cuisine with dal baati churma, gatte ki sabzi and traditional sweets',
      deliverySettings: {
        isDeliveryAvailable: true,
        deliveryCharge: 45,
        freeDeliveryThreshold: 350,
        estimatedDeliveryDays: { min: 1, max: 2 }
      },
      priority: 12,
      isActive: true
    },
    {
      name: 'Punjabi',
      code: 'PUN',
      state: 'Punjab',
      country: 'India',
      description: 'Hearty Punjabi cuisine with butter chicken, sarson ka saag and makki di roti',
      deliverySettings: {
        isDeliveryAvailable: true,
        deliveryCharge: 45,
        freeDeliveryThreshold: 350,
        estimatedDeliveryDays: { min: 1, max: 2 }
      },
      priority: 11,
      isActive: true
    },
    {
      name: 'Bengali',
      code: 'BEN',
      state: 'West Bengal',
      country: 'India',
      description: 'Traditional Bengali cuisine with fish curry, mishti doi and rosogolla',
      deliverySettings: {
        isDeliveryAvailable: true,
        deliveryCharge: 40,
        freeDeliveryThreshold: 300,
        estimatedDeliveryDays: { min: 1, max: 2 }
      },
      priority: 10,
      isActive: true
    },
    {
      name: 'Maharashtrian',
      code: 'MAH',
      state: 'Maharashtra',
      country: 'India',
      description: 'Authentic Maharashtrian cuisine with vada pav, misal pav and puran poli',
      deliverySettings: {
        isDeliveryAvailable: true,
        deliveryCharge: 35,
        freeDeliveryThreshold: 250,
        estimatedDeliveryDays: { min: 1, max: 2 }
      },
      priority: 9,
      isActive: true
    },
    
    // Asian Cuisines
    {
      name: 'Chinese',
      code: 'CHN',
      state: 'International',
      country: 'Global',
      description: 'Authentic Chinese cuisine with traditional flavors and cooking techniques',
      deliverySettings: {
        isDeliveryAvailable: true,
        deliveryCharge: 60,
        freeDeliveryThreshold: 400,
        estimatedDeliveryDays: { min: 1, max: 3 }
      },
      priority: 8,
      isActive: true
    },
    {
      name: 'Indo-Chinese',
      code: 'ICH',
      state: 'Fusion',
      country: 'India',
      description: 'Popular Indo-Chinese fusion cuisine with hakka noodles, manchurian and fried rice',
      deliverySettings: {
        isDeliveryAvailable: true,
        deliveryCharge: 50,
        freeDeliveryThreshold: 350,
        estimatedDeliveryDays: { min: 1, max: 2 }
      },
      priority: 7,
      isActive: true
    },
    {
      name: 'Japanese',
      code: 'JAP',
      state: 'International',
      country: 'Global',
      description: 'Traditional Japanese cuisine with sushi, ramen and authentic flavors',
      deliverySettings: {
        isDeliveryAvailable: true,
        deliveryCharge: 80,
        freeDeliveryThreshold: 600,
        estimatedDeliveryDays: { min: 1, max: 3 }
      },
      priority: 6,
      isActive: true
    },
    {
      name: 'Thai',
      code: 'THA',
      state: 'International',
      country: 'Global',
      description: 'Authentic Thai cuisine with pad thai, green curry and tom yum soup',
      deliverySettings: {
        isDeliveryAvailable: true,
        deliveryCharge: 70,
        freeDeliveryThreshold: 500,
        estimatedDeliveryDays: { min: 1, max: 3 }
      },
      priority: 5,
      isActive: true
    },
    {
      name: 'Korean',
      code: 'KOR',
      state: 'International',
      country: 'Global',
      description: 'Korean cuisine with kimchi, bulgogi and authentic K-food experiences',
      deliverySettings: {
        isDeliveryAvailable: true,
        deliveryCharge: 75,
        freeDeliveryThreshold: 550,
        estimatedDeliveryDays: { min: 1, max: 3 }
      },
      priority: 4,
      isActive: true
    },

    // Western Cuisines
    {
      name: 'Italian',
      code: 'ITA',
      state: 'International',
      country: 'Global',
      description: 'Authentic Italian cuisine with pasta, pizza and traditional recipes',
      deliverySettings: {
        isDeliveryAvailable: true,
        deliveryCharge: 65,
        freeDeliveryThreshold: 450,
        estimatedDeliveryDays: { min: 1, max: 3 }
      },
      priority: 3,
      isActive: true
    },
    {
      name: 'American',
      code: 'USA',
      state: 'International',
      country: 'Global',
      description: 'Classic American cuisine with burgers, steaks and comfort food',
      deliverySettings: {
        isDeliveryAvailable: true,
        deliveryCharge: 70,
        freeDeliveryThreshold: 500,
        estimatedDeliveryDays: { min: 1, max: 3 }
      },
      priority: 2,
      isActive: true
    },
    {
      name: 'French',
      code: 'FRA',
      state: 'International',
      country: 'Global',
      description: 'Elegant French cuisine with fine dining and gourmet preparations',
      deliverySettings: {
        isDeliveryAvailable: true,
        deliveryCharge: 90,
        freeDeliveryThreshold: 700,
        estimatedDeliveryDays: { min: 2, max: 4 }
      },
      priority: 1,
      isActive: true
    },
    {
      name: 'Mexican',
      code: 'MEX',
      state: 'International',
      country: 'Global',
      description: 'Spicy Mexican cuisine with tacos, burritos and authentic flavors',
      deliverySettings: {
        isDeliveryAvailable: true,
        deliveryCharge: 60,
        freeDeliveryThreshold: 400,
        estimatedDeliveryDays: { min: 1, max: 3 }
      },
      priority: 8,
      isActive: true
    },
    {
      name: 'Spanish',
      code: 'SPA',
      state: 'International',
      country: 'Global',
      description: 'Traditional Spanish cuisine with paella, tapas and Mediterranean flavors',
      deliverySettings: {
        isDeliveryAvailable: true,
        deliveryCharge: 75,
        freeDeliveryThreshold: 550,
        estimatedDeliveryDays: { min: 2, max: 4 }
      },
      priority: 6,
      isActive: true
    },

    // Middle Eastern and Others
    {
      name: 'Middle Eastern',
      code: 'ME',
      state: 'International',
      country: 'Global',
      description: 'Authentic Middle Eastern cuisine with hummus, kebabs and traditional dishes',
      deliverySettings: {
        isDeliveryAvailable: true,
        deliveryCharge: 65,
        freeDeliveryThreshold: 450,
        estimatedDeliveryDays: { min: 1, max: 3 }
      },
      priority: 7,
      isActive: true
    },
    {
      name: 'Turkish',
      code: 'TUR',
      state: 'International',
      country: 'Global',
      description: 'Turkish cuisine with doner kebabs, baklava and Ottoman flavors',
      deliverySettings: {
        isDeliveryAvailable: true,
        deliveryCharge: 70,
        freeDeliveryThreshold: 500,
        estimatedDeliveryDays: { min: 1, max: 3 }
      },
      priority: 5,
      isActive: true
    },
    {
      name: 'Continental',
      code: 'CON',
      state: 'International',
      country: 'Global',
      description: 'Continental cuisine with European influences and modern preparations',
      deliverySettings: {
        isDeliveryAvailable: true,
        deliveryCharge: 80,
        freeDeliveryThreshold: 600,
        estimatedDeliveryDays: { min: 2, max: 4 }
      },
      priority: 4,
      isActive: true
    },
    {
      name: 'Global / Fusion',
      code: 'GF',
      state: 'International',
      country: 'Global',
      description: 'Creative fusion cuisine combining flavors from around the world',
      deliverySettings: {
        isDeliveryAvailable: true,
        deliveryCharge: 85,
        freeDeliveryThreshold: 650,
        estimatedDeliveryDays: { min: 2, max: 4 }
      },
      priority: 3,
      isActive: true
    }
  ];

  try {
    await Region.deleteMany({}); // Clear existing data
    const createdRegions = await Region.insertMany(cuisineRegions);
    console.log(`✅ Created ${createdRegions.length} cuisine regions`);
    return createdRegions;
    return createdRegions;
  } catch (error) {
    console.error('❌ Error creating regions:', error);
  }
}

async function createSampleSubCategories() {
  console.log('Creating food subcategories...');
  
  // First, let's check if we have categories
  const categories = await Category.find({}).limit(10);
  if (categories.length === 0) {
    console.log('⚠️  No categories found. Please create categories first.');
    return;
  }

  const foodSubCategories = [
    // 🌅 Breakfast & Light Meals
    {
      name: 'Dosa',
      category: categories[0]?._id,
      description: 'South Indian crepes with various fillings and chutneys',
      icon: 'dosa',
      isFeatured: true,
      priority: 15,
      commission: 8,
      allowedSpecifications: [
        { name: 'Type', type: 'select', options: ['Plain', 'Masala', 'Rava', 'Set', 'Cheese', 'Paneer'], isRequired: true },
        { name: 'Spice Level', type: 'select', options: ['Mild', 'Medium', 'Spicy'], isRequired: false },
        { name: 'Accompaniments', type: 'select', options: ['Sambar & Chutney', 'Only Chutney', 'Only Sambar'], isRequired: false }
      ],
      deliverySettings: {
        isDigital: false,
        isPerishable: true,
        requiresSpecialHandling: true,
        estimatedPreparationTime: 0.5
      }
    },
    {
      name: 'Idli',
      category: categories[0]?._id,
      description: 'Steamed rice cakes served with sambar and chutney',
      icon: 'idli',
      isFeatured: true,
      priority: 14,
      commission: 8,
      allowedSpecifications: [
        { name: 'Quantity', type: 'select', options: ['2 Pieces', '3 Pieces', '4 Pieces', '6 Pieces'], isRequired: true },
        { name: 'Type', type: 'select', options: ['Regular', 'Rava', 'Mini', 'Ghee'], isRequired: false }
      ],
      deliverySettings: {
        isDigital: false,
        isPerishable: true,
        requiresSpecialHandling: true,
        estimatedPreparationTime: 0.5
      }
    },
    {
      name: 'Uttapam',
      category: categories[0]?._id,
      description: 'Thick pancake with vegetables and spices',
      icon: 'uttapam',
      isFeatured: false,
      priority: 13,
      commission: 8,
      allowedSpecifications: [
        { name: 'Topping', type: 'select', options: ['Plain', 'Onion', 'Tomato', 'Mixed Veg', 'Cheese'], isRequired: true },
        { name: 'Size', type: 'select', options: ['Regular', 'Large'], isRequired: false }
      ]
    },
    {
      name: 'Upma',
      category: categories[0]?._id,
      description: 'Savory semolina breakfast dish with vegetables',
      icon: 'upma',
      priority: 12,
      commission: 6,
      allowedSpecifications: [
        { name: 'Style', type: 'select', options: ['Plain', 'Vegetable', 'Rava', 'Vermicelli'], isRequired: true }
      ]
    },
    {
      name: 'Poha',
      category: categories[0]?._id,
      description: 'Flattened rice preparation with onions and spices',
      icon: 'poha',
      priority: 11,
      commission: 6,
      allowedSpecifications: [
        { name: 'Style', type: 'select', options: ['Maharashtrian', 'Indori', 'Gujarati', 'Mixed'], isRequired: true }
      ]
    },

    // 🍛 Main Course
    {
      name: 'Curries',
      category: categories[1]?._id,
      description: 'Traditional Indian curries with rich gravies',
      icon: 'curry',
      isFeatured: true,
      priority: 20,
      commission: 10,
      allowedSpecifications: [
        { name: 'Type', type: 'select', options: ['Veg', 'Paneer', 'Dal', 'Mixed'], isRequired: true },
        { name: 'Spice Level', type: 'select', options: ['Mild', 'Medium', 'Hot', 'Extra Hot'], isRequired: true },
        { name: 'Gravy Style', type: 'select', options: ['Thick', 'Medium', 'Thin'], isRequired: false }
      ],
      deliverySettings: {
        isDigital: false,
        isPerishable: true,
        requiresSpecialHandling: true,
        estimatedPreparationTime: 1
      }
    },
    {
      name: 'Paneer Dishes',
      category: categories[1]?._id,
      description: 'Cottage cheese preparations in various styles',
      icon: 'paneer',
      isFeatured: true,
      priority: 19,
      commission: 12,
      allowedSpecifications: [
        { name: 'Preparation', type: 'select', options: ['Butter Masala', 'Palak', 'Kadhai', 'Makhani', 'Tikka'], isRequired: true },
        { name: 'Spice Level', type: 'select', options: ['Mild', 'Medium', 'Spicy'], isRequired: false }
      ]
    },
    {
      name: 'Dal Varieties',
      category: categories[1]?._id,
      description: 'Lentil preparations in different regional styles',
      icon: 'dal',
      isFeatured: false,
      priority: 18,
      commission: 8,
      allowedSpecifications: [
        { name: 'Type', type: 'select', options: ['Tadka', 'Makhani', 'Palak', 'Fry', 'Sambar'], isRequired: true },
        { name: 'Lentil', type: 'select', options: ['Moong', 'Masoor', 'Toor', 'Chana', 'Mixed'], isRequired: false }
      ]
    },
    {
      name: 'Veg Gravies',
      category: categories[1]?._id,
      description: 'Mixed vegetable curries and gravies',
      icon: 'veg-curry',
      priority: 17,
      commission: 10
    },
    {
      name: 'Rice Meals',
      category: categories[1]?._id,
      description: 'Complete rice-based meal combinations',
      icon: 'rice-meal',
      priority: 16,
      commission: 12,
      allowedSpecifications: [
        { name: 'Style', type: 'select', options: ['South Indian', 'North Indian', 'Regional Special'], isRequired: true }
      ]
    },
    {
      name: 'Thali',
      category: categories[1]?._id,
      description: 'Complete traditional meal with multiple dishes',
      icon: 'thali',
      isFeatured: true,
      priority: 15,
      commission: 15,
      allowedSpecifications: [
        { name: 'Type', type: 'select', options: ['Gujarati', 'Rajasthani', 'Punjabi', 'South Indian', 'Bengali'], isRequired: true },
        { name: 'Size', type: 'select', options: ['Regular', 'Large', 'Family'], isRequired: true }
      ]
    },

    // 🍞 Breads
    {
      name: 'Roti',
      category: categories[2]?._id,
      description: 'Traditional Indian flatbreads',
      icon: 'roti',
      priority: 14,
      commission: 5,
      allowedSpecifications: [
        { name: 'Type', type: 'select', options: ['Plain', 'Butter', 'Missi', 'Bajra'], isRequired: true },
        { name: 'Quantity', type: 'select', options: ['1 Piece', '2 Pieces', '4 Pieces', '6 Pieces'], isRequired: true }
      ]
    },
    {
      name: 'Naan',
      category: categories[2]?._id,
      description: 'Leavened oven-baked flatbread',
      icon: 'naan',
      isFeatured: true,
      priority: 13,
      commission: 8,
      allowedSpecifications: [
        { name: 'Variety', type: 'select', options: ['Plain', 'Butter', 'Garlic', 'Cheese', 'Keema'], isRequired: true }
      ]
    },
    {
      name: 'Paratha',
      category: categories[2]?._id,
      description: 'Stuffed and layered flatbreads',
      icon: 'paratha',
      isFeatured: true,
      priority: 12,
      commission: 10,
      allowedSpecifications: [
        { name: 'Stuffing', type: 'select', options: ['Aloo', 'Gobi', 'Paneer', 'Methi', 'Mixed', 'Plain'], isRequired: true }
      ]
    },
    {
      name: 'Garlic Bread',
      category: categories[2]?._id,
      description: 'Herb and garlic flavored bread',
      icon: 'garlic-bread',
      priority: 11,
      commission: 8
    },
    {
      name: 'Buns',
      category: categories[2]?._id,
      description: 'Soft bread rolls and buns',
      icon: 'buns',
      priority: 10,
      commission: 6,
      allowedSpecifications: [
        { name: 'Type', type: 'select', options: ['Pav', 'Burger Bun', 'Dinner Roll'], isRequired: true }
      ]
    },

    // 🍕 Fast Food & Bakery
    {
      name: 'Pizza',
      category: categories[3]?._id,
      description: 'Italian flatbread with toppings',
      icon: 'pizza',
      isFeatured: true,
      priority: 20,
      commission: 15,
      allowedSpecifications: [
        { name: 'Size', type: 'select', options: ['Personal', 'Medium', 'Large', 'Extra Large'], isRequired: true },
        { name: 'Crust', type: 'select', options: ['Thin', 'Thick', 'Stuffed'], isRequired: true },
        { name: 'Toppings', type: 'select', options: ['Margherita', 'Veggie', 'Cheese Burst', 'Paneer'], isRequired: true }
      ]
    },
    {
      name: 'Pasta',
      category: categories[3]?._id,
      description: 'Italian pasta in various sauces',
      icon: 'pasta',
      isFeatured: true,
      priority: 19,
      commission: 12,
      allowedSpecifications: [
        { name: 'Type', type: 'select', options: ['Penne', 'Spaghetti', 'Macaroni', 'Fusilli'], isRequired: true },
        { name: 'Sauce', type: 'select', options: ['Red', 'White', 'Pink', 'Pesto'], isRequired: true }
      ]
    },
    {
      name: 'Burgers',
      category: categories[3]?._id,
      description: 'Grilled patties in burger buns with toppings',
      icon: 'burger',
      isFeatured: true,
      priority: 18,
      commission: 10,
      allowedSpecifications: [
        { name: 'Patty', type: 'select', options: ['Veg', 'Paneer', 'Aloo', 'Cheese'], isRequired: true },
        { name: 'Size', type: 'select', options: ['Regular', 'Large', 'Jumbo'], isRequired: true }
      ]
    },
    {
      name: 'Sandwiches',
      category: categories[3]?._id,
      description: 'Grilled and cold sandwiches with fillings',
      icon: 'sandwich',
      priority: 17,
      commission: 8,
      allowedSpecifications: [
        { name: 'Type', type: 'select', options: ['Grilled', 'Club', 'Cold', 'Open'], isRequired: true }
      ]
    },
    {
      name: 'Wraps',
      category: categories[3]?._id,
      description: 'Rolled flatbreads with various fillings',
      icon: 'wrap',
      priority: 16,
      commission: 10
    },
    {
      name: 'Rolls',
      category: categories[3]?._id,
      description: 'Indian street-style rolls and kathi rolls',
      icon: 'roll',
      priority: 15,
      commission: 8,
      allowedSpecifications: [
        { name: 'Filling', type: 'select', options: ['Paneer', 'Veg', 'Egg', 'Mixed'], isRequired: true }
      ]
    },

    // 🍜 Rice & Noodles
    {
      name: 'Fried Rice',
      category: categories[4]?._id,
      description: 'Wok-fried rice with vegetables and sauces',
      icon: 'fried-rice',
      isFeatured: true,
      priority: 18,
      commission: 10,
      allowedSpecifications: [
        { name: 'Style', type: 'select', options: ['Veg', 'Schezwan', 'Manchurian', 'Paneer'], isRequired: true }
      ]
    },
    {
      name: 'Biryani',
      category: categories[4]?._id,
      description: 'Aromatic basmati rice with spices and vegetables',
      icon: 'biryani',
      isFeatured: true,
      priority: 17,
      commission: 15,
      allowedSpecifications: [
        { name: 'Type', type: 'select', options: ['Veg', 'Paneer', 'Mushroom', 'Hyderabadi'], isRequired: true },
        { name: 'Spice Level', type: 'select', options: ['Mild', 'Medium', 'Spicy'], isRequired: true }
      ]
    },
    {
      name: 'Pulao',
      category: categories[4]?._id,
      description: 'Mildly spiced rice preparation',
      icon: 'pulao',
      priority: 16,
      commission: 8,
      allowedSpecifications: [
        { name: 'Type', type: 'select', options: ['Jeera', 'Veg', 'Kashmiri', 'Matar'], isRequired: true }
      ]
    },
    {
      name: 'Noodles',
      category: categories[4]?._id,
      description: 'Stir-fried noodles in various styles',
      icon: 'noodles',
      isFeatured: true,
      priority: 15,
      commission: 10,
      allowedSpecifications: [
        { name: 'Style', type: 'select', options: ['Hakka', 'Schezwan', 'Singapore', 'Thai'], isRequired: true }
      ]
    },
    {
      name: 'Rice Bowls',
      category: categories[4]?._id,
      description: 'Rice-based bowl meals with toppings',
      icon: 'rice-bowl',
      priority: 14,
      commission: 12
    },

    // 🌮 Snacks & Street Food
    {
      name: 'Chaat',
      category: categories[5]?._id,
      description: 'Tangy and spicy Indian street food',
      icon: 'chaat',
      isFeatured: true,
      priority: 20,
      commission: 8,
      allowedSpecifications: [
        { name: 'Type', type: 'select', options: ['Bhel Puri', 'Pani Puri', 'Aloo Chaat', 'Dahi Puri'], isRequired: true }
      ]
    },
    {
      name: 'Samosa',
      category: categories[5]?._id,
      description: 'Deep-fried pastry with savory filling',
      icon: 'samosa',
      isFeatured: true,
      priority: 19,
      commission: 6,
      allowedSpecifications: [
        { name: 'Filling', type: 'select', options: ['Aloo', 'Mixed Veg', 'Paneer', 'Green Peas'], isRequired: true },
        { name: 'Quantity', type: 'select', options: ['1 Piece', '2 Pieces', '4 Pieces'], isRequired: true }
      ]
    },
    {
      name: 'Kachori',
      category: categories[5]?._id,
      description: 'Spiced lentil-filled fried bread',
      icon: 'kachori',
      priority: 18,
      commission: 6
    },
    {
      name: 'Vada Pav',
      category: categories[5]?._id,
      description: 'Mumbai-style potato fritter in bread bun',
      icon: 'vada-pav',
      isFeatured: true,
      priority: 17,
      commission: 5
    },
    {
      name: 'Pav Bhaji',
      category: categories[5]?._id,
      description: 'Spiced vegetable mash with bread rolls',
      icon: 'pav-bhaji',
      isFeatured: true,
      priority: 16,
      commission: 8
    },
    {
      name: 'Momos',
      category: categories[5]?._id,
      description: 'Steamed dumplings with various fillings',
      icon: 'momos',
      isFeatured: true,
      priority: 15,
      commission: 8,
      allowedSpecifications: [
        { name: 'Style', type: 'select', options: ['Steamed', 'Fried', 'Tandoori'], isRequired: true },
        { name: 'Filling', type: 'select', options: ['Veg', 'Paneer', 'Cheese'], isRequired: true }
      ]
    },
    {
      name: 'Spring Rolls',
      category: categories[5]?._id,
      description: 'Crispy rolls with vegetable filling',
      icon: 'spring-roll',
      priority: 14,
      commission: 8
    },

    // 🥗 Healthy & Fresh
    {
      name: 'Salads',
      category: categories[6]?._id,
      description: 'Fresh and healthy salad combinations',
      icon: 'salad',
      isFeatured: true,
      priority: 15,
      commission: 10,
      allowedSpecifications: [
        { name: 'Type', type: 'select', options: ['Green', 'Caesar', 'Greek', 'Fruit', 'Sprouts'], isRequired: true }
      ]
    },
    {
      name: 'Soups',
      category: categories[6]?._id,
      description: 'Hot and cold soups for all seasons',
      icon: 'soup',
      priority: 14,
      commission: 8,
      allowedSpecifications: [
        { name: 'Type', type: 'select', options: ['Tomato', 'Sweet Corn', 'Hot & Sour', 'Manchow'], isRequired: true }
      ]
    },
    {
      name: 'Detox Drinks',
      category: categories[6]?._id,
      description: 'Healthy detoxifying beverages',
      icon: 'detox',
      priority: 13,
      commission: 12
    },
    {
      name: 'Low-Calorie Meals',
      category: categories[6]?._id,
      description: 'Nutritious low-calorie meal options',
      icon: 'low-cal',
      priority: 12,
      commission: 15
    },

    // 🍰 Desserts & Sweets
    {
      name: 'Indian Sweets',
      category: categories[7]?._id,
      description: 'Traditional Indian mithai and sweets',
      icon: 'indian-sweets',
      isFeatured: true,
      priority: 18,
      commission: 12,
      allowedSpecifications: [
        { name: 'Type', type: 'select', options: ['Gulab Jamun', 'Rasgulla', 'Jalebi', 'Barfi', 'Laddu'], isRequired: true }
      ]
    },
    {
      name: 'Cakes',
      category: categories[7]?._id,
      description: 'Fresh baked cakes for all occasions',
      icon: 'cake',
      isFeatured: true,
      priority: 17,
      commission: 15,
      allowedSpecifications: [
        { name: 'Flavor', type: 'select', options: ['Chocolate', 'Vanilla', 'Strawberry', 'Black Forest'], isRequired: true },
        { name: 'Size', type: 'select', options: ['500g', '1kg', '2kg'], isRequired: true }
      ]
    },
    {
      name: 'Pastries',
      category: categories[7]?._id,
      description: 'Individual pastries and desserts',
      icon: 'pastry',
      priority: 16,
      commission: 12
    },
    {
      name: 'Ice Cream',
      category: categories[7]?._id,
      description: 'Creamy frozen desserts in various flavors',
      icon: 'ice-cream',
      isFeatured: true,
      priority: 15,
      commission: 10
    },
    {
      name: 'Gelato',
      category: categories[7]?._id,
      description: 'Italian-style dense frozen dessert',
      icon: 'gelato',
      priority: 14,
      commission: 12
    },
    {
      name: 'Tiramisu',
      category: categories[7]?._id,
      description: 'Classic Italian coffee-flavored dessert',
      icon: 'tiramisu',
      priority: 13,
      commission: 15
    },
    {
      name: 'Pancakes',
      category: categories[7]?._id,
      description: 'Fluffy pancakes with various toppings',
      icon: 'pancakes',
      priority: 12,
      commission: 10
    },

    // 🧃 Beverages
    {
      name: 'Lassi',
      category: categories[8]?._id,
      description: 'Traditional yogurt-based drink',
      icon: 'lassi',
      isFeatured: true,
      priority: 15,
      commission: 8,
      allowedSpecifications: [
        { name: 'Flavor', type: 'select', options: ['Sweet', 'Mango', 'Rose', 'Salted'], isRequired: true }
      ]
    },
    {
      name: 'Shakes',
      category: categories[8]?._id,
      description: 'Thick milkshakes with fruits and flavors',
      icon: 'shake',
      isFeatured: true,
      priority: 14,
      commission: 10,
      allowedSpecifications: [
        { name: 'Flavor', type: 'select', options: ['Chocolate', 'Vanilla', 'Strawberry', 'Mango'], isRequired: true }
      ]
    },
    {
      name: 'Juices',
      category: categories[8]?._id,
      description: 'Fresh fruit and vegetable juices',
      icon: 'juice',
      priority: 13,
      commission: 12,
      allowedSpecifications: [
        { name: 'Type', type: 'select', options: ['Orange', 'Apple', 'Mixed Fruit', 'Vegetable'], isRequired: true }
      ]
    },
    {
      name: 'Tea',
      category: categories[8]?._id,
      description: 'Various tea preparations and blends',
      icon: 'tea',
      priority: 12,
      commission: 6,
      allowedSpecifications: [
        { name: 'Type', type: 'select', options: ['Masala Chai', 'Green Tea', 'Black Tea', 'Herbal'], isRequired: true }
      ]
    },
    {
      name: 'Coffee',
      category: categories[8]?._id,
      description: 'Hot and cold coffee beverages',
      icon: 'coffee',
      priority: 11,
      commission: 8,
      allowedSpecifications: [
        { name: 'Type', type: 'select', options: ['Espresso', 'Cappuccino', 'Latte', 'Americano'], isRequired: true }
      ]
    },

    // 🌱 Dietary Types
    {
      name: 'Vegan',
      category: categories[9]?._id,
      description: 'Plant-based dishes without any animal products',
      icon: 'vegan',
      isFeatured: true,
      priority: 15,
      commission: 12,
      deliverySettings: {
        isDigital: false,
        isPerishable: true,
        requiresSpecialHandling: true,
        estimatedPreparationTime: 1
      }
    },
    {
      name: 'Jain',
      category: categories[9]?._id,
      description: 'Jain dietary compliant food without root vegetables',
      icon: 'jain',
      priority: 14,
      commission: 10
    },
    {
      name: 'Gluten-Free',
      category: categories[9]?._id,
      description: 'Wheat-free and gluten-free meal options',
      icon: 'gluten-free',
      priority: 13,
      commission: 15
    },
    {
      name: 'High-Protein',
      category: categories[9]?._id,
      description: 'Protein-rich meals for fitness enthusiasts',
      icon: 'protein',
      priority: 12,
      commission: 12
    }
  ];

  try {
    await SubCategory.deleteMany({}); // Clear existing data
    const createdSubCategories = await SubCategory.insertMany(foodSubCategories);
    console.log(`✅ Created ${createdSubCategories.length} food subcategories`);
    return createdSubCategories;
  } catch (error) {
    console.error('❌ Error creating subcategories:', error);
  }
}

async function setupSampleData() {
  try {
    console.log('🚀 Setting up cuisine-based regions and food subcategories');
    console.log('==================================================');
    
    // const regions = await createSampleRegions();
    const subcategories = await createSampleSubCategories();
    
    console.log('\n📊 Summary:');
    // console.log(`✅ Cuisine Regions created: ${regions?.length || 0}`);
    console.log(`✅ Food SubCategories created: ${subcategories?.length || 0}`);
    
    console.log('\n💡 Usage Examples:');
    console.log('// Find products by cuisine region:');
    console.log('Product.find({ region: southIndianRegionId }).populate("region")');
    console.log('\n// Find products by food subcategory:');
    console.log('Product.find({ subcategory: dosaSubcategoryId }).populate("subcategory category")');
    console.log('\n// Get all Indian cuisine regions:');
    console.log('Region.find({ country: "India", isActive: true })');
    console.log('\n// Get all international cuisines:');
    console.log('Region.find({ state: "International", isActive: true })');
    console.log('\n// Get breakfast subcategories:');
    console.log('SubCategory.find({ name: { $in: ["Dosa", "Idli", "Uttapam"] } }).populate("category")');
    
  } catch (error) {
    console.error('❌ Error setting up sample data:', error);
  }
}

// Export for use in other scripts
module.exports = {
  createSampleRegions,
  createSampleSubCategories,
  setupSampleData
};

// Run if this file is executed directly
if (require.main === module) {
  async function main() {
    try {
      await connectDB();
      await setupSampleData();
    } catch (error) {
      console.error('❌ Script execution failed:', error);
    } finally {
      console.log('🔌 Closing database connection...');
      await mongoose.connection.close();
      process.exit(0);
    }
  }
  
  main();
}