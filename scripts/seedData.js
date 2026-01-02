require('dotenv').config();
const mongoose = require('mongoose');
const LaundryVendor = require('../models/LaundryVendor');

// Connect to database
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('✅ Connected to MongoDB');
}).catch(err => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// ==================== SAMPLE VENDORS ====================

const sampleVendors = [
  {
    name: 'Fresh Laundry Services',
    description: 'Professional laundry service with 10+ years of experience. We handle all types of fabrics with care and use eco-friendly detergents.',
    logo: 'https://example.com/fresh-laundry-logo.png',
    phone: '9876543210',
    email: 'contact@freshlaundry.com',
    address: {
      street: 'Plot 15, Industrial Area',
      area: 'Palasia',
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode: '452001',
      coordinates: {
        type: 'Point',
        coordinates: [75.8577, 22.7196]
      }
    },
    serviceAreas: ['452001', '452002', '452003', '452010', '452012'],
    services: ['wash_fold', 'wash_iron', 'dry_clean', 'iron_only'],
    specializations: ['delicate_fabrics', 'wedding_attire', 'curtains'],
    operationalHours: {
      monday: { open: '09:00', close: '21:00', isOpen: true },
      tuesday: { open: '09:00', close: '21:00', isOpen: true },
      wednesday: { open: '09:00', close: '21:00', isOpen: true },
      thursday: { open: '09:00', close: '21:00', isOpen: true },
      friday: { open: '09:00', close: '21:00', isOpen: true },
      saturday: { open: '09:00', close: '21:00', isOpen: true },
      sunday: { open: '10:00', close: '18:00', isOpen: true }
    },
    subscriptionPlans: [
      {
        id: 'basic',
        name: 'Basic Plan',
        price: 999,
        maxWeight: 15,
        features: {
          unlimitedPickups: true,
          services: ['wash_fold'],
          freeDryClean: 0,
          freeExpressService: 0,
          shoeCleaningFree: 0,
          turnaroundTime: '48 hours',
          priority: false,
          vipSupport: false
        },
        isActive: true
      },
      {
        id: 'standard',
        name: 'Standard Plan',
        price: 1499,
        maxWeight: 25,
        features: {
          unlimitedPickups: true,
          services: ['wash_fold', 'wash_iron'],
          freeDryClean: 3,
          freeExpressService: 0,
          shoeCleaningFree: 1,
          turnaroundTime: '36 hours',
          priority: true,
          vipSupport: false
        },
        isActive: true
      },
      {
        id: 'premium',
        name: 'Premium Plan',
        price: 1999,
        maxWeight: null,
        features: {
          unlimitedPickups: true,
          services: ['wash_fold', 'wash_iron', 'dry_clean', 'iron_only'],
          freeDryClean: 5,
          freeExpressService: 2,
          shoeCleaningFree: 2,
          turnaroundTime: '24 hours',
          priority: true,
          vipSupport: true
        },
        isActive: true
      }
    ],
    rating: 4.7,
    totalOrders: 5234,
    totalReviews: 1892,
    isActive: true,
    isVerified: true
  },
  
  {
    name: 'SpinCycle Express',
    description: 'Quick and reliable laundry service. Same-day delivery available. Specializing in bulk orders and subscription plans.',
    logo: 'https://example.com/spincycle-logo.png',
    phone: '9876543211',
    email: 'info@spincycle.com',
    address: {
      street: '23, MG Road',
      area: 'Vijay Nagar',
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode: '452010',
      coordinates: {
        type: 'Point',
        coordinates: [75.8936, 22.7532]
      }
    },
    serviceAreas: ['452010', '452011', '452012', '452016'],
    services: ['wash_fold', 'wash_iron', 'express'],
    specializations: ['express_service', 'bulk_orders'],
    pricing: {
      shirt: { wash_fold: 18, wash_iron: 22, dry_clean: 75, iron_only: 10 },
      tshirt: { wash_fold: 14, wash_iron: 18, dry_clean: 55, iron_only: 8 },
      jeans: { wash_fold: 35, wash_iron: 45, dry_clean: 90, iron_only: 18 },
      trousers: { wash_fold: 28, wash_iron: 38, dry_clean: 75, iron_only: 14 }
    },
    operationalHours: {
      monday: { open: '08:00', close: '22:00', isOpen: true },
      tuesday: { open: '08:00', close: '22:00', isOpen: true },
      wednesday: { open: '08:00', close: '22:00', isOpen: true },
      thursday: { open: '08:00', close: '22:00', isOpen: true },
      friday: { open: '08:00', close: '22:00', isOpen: true },
      saturday: { open: '08:00', close: '22:00', isOpen: true },
      sunday: { open: '09:00', close: '20:00', isOpen: true }
    },
    subscriptionPlans: [
      {
        id: 'express_basic',
        name: 'Express Basic',
        price: 1299,
        maxWeight: 20,
        features: {
          unlimitedPickups: true,
          services: ['wash_fold', 'wash_iron'],
          freeDryClean: 2,
          freeExpressService: 1,
          shoeCleaningFree: 0,
          turnaroundTime: '24 hours',
          priority: true,
          vipSupport: false
        },
        isActive: true
      }
    ],
    rating: 4.5,
    totalOrders: 3456,
    totalReviews: 1234,
    isActive: true,
    isVerified: true
  },

  {
    name: 'Premium Clean Co.',
    description: 'Luxury laundry service for premium fabrics. Expert handling of designer wear, silk, and delicate materials.',
    logo: 'https://example.com/premium-clean-logo.png',
    phone: '9876543212',
    email: 'contact@premiumclean.com',
    address: {
      street: '456, AB Road',
      area: 'South Tukoganj',
      city: 'Indore',
      state: 'Madhya Pradesh',
      pincode: '452001',
      coordinates: {
        type: 'Point',
        coordinates: [75.8692, 22.7110]
      }
    },
    serviceAreas: ['452001', '452002', '452003'],
    services: ['dry_clean', 'premium', 'wash_iron'],
    specializations: ['designer_wear', 'silk_fabrics', 'leather', 'premium_care'],
    pricing: {
      shirt: { wash_fold: 25, wash_iron: 30, dry_clean: 100, iron_only: 15 },
      sweater: { wash_fold: 50, wash_iron: 60, dry_clean: 180 },
      suit: { dry_clean: 300 }
    },
    charges: {
      pickup: 50,
      delivery: 50,
      expressSurcharge: 60,
      freeDeliveryAbove: 800
    },
    turnaroundTime: {
      standard: 72,
      express: 24,
      premium: 96
    },
    operationalHours: {
      monday: { open: '10:00', close: '20:00', isOpen: true },
      tuesday: { open: '10:00', close: '20:00', isOpen: true },
      wednesday: { open: '10:00', close: '20:00', isOpen: true },
      thursday: { open: '10:00', close: '20:00', isOpen: true },
      friday: { open: '10:00', close: '20:00', isOpen: true },
      saturday: { open: '10:00', close: '18:00', isOpen: true },
      sunday: { open: '00:00', close: '00:00', isOpen: false }
    },
    subscriptionPlans: [
      {
        id: 'premium_elite',
        name: 'Elite Premium',
        price: 2999,
        maxWeight: null,
        features: {
          unlimitedPickups: true,
          services: ['wash_fold', 'wash_iron', 'dry_clean', 'premium'],
          freeDryClean: 8,
          freeExpressService: 3,
          shoeCleaningFree: 3,
          turnaroundTime: '24 hours',
          priority: true,
          vipSupport: true
        },
        isActive: true
      }
    ],
    rating: 4.9,
    totalOrders: 2134,
    totalReviews: 987,
    isActive: true,
    isVerified: true
  }
];

// ==================== SEED FUNCTION ====================

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing vendors
    await LaundryVendor.deleteMany({});
    console.log('🗑️ Cleared existing vendors');

    // Insert sample vendors
    const vendors = await LaundryVendor.insertMany(sampleVendors);
    console.log(`✅ Inserted ${vendors.length} vendors`);

    // Log created vendors
    
    vendors.forEach((vendor, index) => {
      console.log(`
   ${index + 1}. ${vendor.name}
      - ID: ${vendor._id}
      - Slug: ${vendor.slug}
      - Service Areas: ${vendor.serviceAreas.join(', ')}
      - Plans: ${vendor.subscriptionPlans.length}
      - Rating: ${vendor.rating}⭐
      `);
    });

    process.exit(0);

  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    process.exit(1);
  }
};

// Run seeding
seedDatabase();