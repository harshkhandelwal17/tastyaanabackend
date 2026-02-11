
// utils/seedData.js - Database Seeding
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    // Check if data already exists
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('Database already seeded');
      return;
    }

    // console.log('Seeding database...');

    // Create categories
    const categories = await Category.insertMany([
      { name: 'Electronics', slug: 'electronics', description: 'Electronic devices and accessories' },
      { name: 'Fashion', slug: 'fashion', description: 'Clothing and fashion accessories' },
      { name: 'Home & Garden', slug: 'home-garden', description: 'Home improvement and garden items' },
      { name: 'Sports', slug: 'sports', description: 'Sports equipment and accessories' },
      { name: 'Books', slug: 'books', description: 'Books and educational materials' }
    ]);

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'admin',
      isVerified: true
    });

    // Create demo sellers
    const sellerPassword = await bcrypt.hash('seller123', 12);
    const sellers = await User.insertMany([
      {
        name: 'John Electronics',
        email: 'seller1@example.com',
        password: sellerPassword,
        role: 'seller',
        isVerified: true,
        sellerInfo: {
          storeName: 'John\'s Electronics Store',
          storeDescription: 'Premium electronics and gadgets',
          businessType: 'Electronics',
          isApproved: true,
          commissionRate: 5,
          gstNumber: '29ABCDE1234F1Z5',
          panNumber: 'ABCDE1234F'
        }
      },
      {
        name: 'Sarah Fashion',
        email: 'seller2@example.com',
        password: sellerPassword,
        role: 'seller',
        isVerified: true,
        sellerInfo: {
          storeName: 'Sarah\'s Fashion Boutique',
          storeDescription: 'Trendy fashion and accessories',
          businessType: 'Fashion',
          isApproved: true,
          commissionRate: 8,
          gstNumber: '29FGHIJ5678K2L6',
          panNumber: 'FGHIJ5678K'
        }
      }
    ]);

    // Create demo customers
    const customerPassword = await bcrypt.hash('customer123', 12);
    const customers = await User.insertMany([
      {
        name: 'Alice Customer',
        email: 'customer1@example.com',
        password: customerPassword,
        role: 'customer',
        isVerified: true
      },
      {
        name: 'Bob Customer',
        email: 'customer2@example.com',
        password: customerPassword,
        role: 'customer',
        isVerified: true
      }
    ]);

    // Create demo products
    const products = await Product.insertMany([
      {
        title: 'Wireless Bluetooth Headphones',
        description: 'High-quality wireless headphones with noise cancellation',
        price: 2999,
        stock: 50,
        category: categories[0]._id,
        seller: sellers[0]._id,
        images: [{ url: '/uploads/headphones.jpg', alt: 'Wireless Headphones' }],
        isActive: true
      },
      {
        title: 'Smartphone Case',
        description: 'Protective case for smartphones',
        price: 599,
        stock: 100,
        category: categories[0]._id,
        seller: sellers[0]._id,
        images: [{ url: '/uploads/phone-case.jpg', alt: 'Phone Case' }],
        isActive: true
      },
      {
        title: 'Women\'s Summer Dress',
        description: 'Elegant summer dress for women',
        price: 1999,
        stock: 25,
        category: categories[1]._id,
        seller: sellers[1]._id,
        images: [{ url: '/uploads/summer-dress.jpg', alt: 'Summer Dress' }],
        isActive: true
      }
    ]);

    // Create demo orders
    const orders = await Order.insertMany([
      {
        orderNumber: 'ORD000001',
        customer: customers[0]._id,
        items: [{
          product: products[0]._id,
          seller: sellers[0]._id,
          quantity: 1,
          price: 2999,
          status: 'delivered'
        }],
        totalAmount: 2999,
        paymentMethod: 'online',
        paymentStatus: 'paid',
        shippingAddress: {
          name: 'Alice Customer',
          street: '123 Main St',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India'
        }
      }
    ]);

    console.log('✅ Database seeded successfully');
    console.log('Demo accounts created:');
    console.log('Admin: admin@example.com / admin123');
    console.log('Seller: seller1@example.com / seller123');
    console.log('Customer: customer1@example.com / customer123');

  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  }
};

// Seed categories for homepage
const seedCategories = async () => {
  try {
    const categories = [
      {
        name: "Fresh Vegetables",
        description: "Fresh and organic vegetables sourced from local farms",
        image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop",
        isActive: true,
        sortOrder: 1,
        slug: "fresh-vegetables"
      },
      {
        name: "Fresh Fruits",
        description: "Seasonal and exotic fruits delivered fresh",
        image: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?q=80&w=2070&auto=format&fit=crop",
        isActive: true,
        sortOrder: 2,
        slug: "fresh-fruits"
      },
      {
        name: "Dairy Products",
        description: "Fresh milk, curd, and dairy products",
        image: "https://images.unsplash.com/photo-1550583724-b2692b85b150?q=80&w=2070&auto=format&fit=crop",
        isActive: true,
        sortOrder: 3,
        slug: "dairy-products"
      },
      {
        name: "Grains & Pulses",
        description: "Quality rice, wheat, and pulses",
        image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?q=80&w=2070&auto=format&fit=crop",
        isActive: true,
        sortOrder: 4,
        slug: "grains-pulses"
      },
      {
        name: "Spices & Condiments",
        description: "Fresh spices and condiments for your kitchen",
        image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=2070&auto=format&fit=crop",
        isActive: true,
        sortOrder: 5,
        slug: "spices-condiments"
      },
      {
        name: "Beverages",
        description: "Tea, coffee, and refreshing beverages",
        image: "https://images.unsplash.com/photo-1546173159-315724a31696?q=80&w=2070&auto=format&fit=crop",
        isActive: true,
        sortOrder: 6,
        slug: "beverages"
      }
    ];

    const Category = require('../models/Category');
    
    for (const category of categories) {
      const existingCategory = await Category.findOne({ slug: category.slug });
      if (!existingCategory) {
        await Category.create(category);
        console.log(`Created category: ${category.name}`);
      }
    }
    
    console.log('Categories seeded successfully');
  } catch (error) {
    console.error('Error seeding categories:', error);
  }
};

module.exports = { seedDatabase, seedCategories };
