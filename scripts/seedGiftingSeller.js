const mongoose = require('mongoose');
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const MONGO_URI = "mongodb+srv://harsh:harsh@unifiedcampus.i5fit.mongodb.net/onlinestore";

const seedGiftingSeller = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('📦 Connected to MongoDB');

        // 1. Create Gifting Category if not exists
        let category = await Category.findOne({ slug: 'gifting-flowers' });
        if (!category) {
            category = await Category.create({
                name: 'Gifting & Flowers',
                slug: 'gifting-flowers',
                description: 'Send premium gifts and flowers instantly.',
                image: 'https://cdn-icons-png.flaticon.com/512/4213/4213640.png',
                icon: 'https://cdn-icons-png.flaticon.com/512/4213/4213640.png',
                isActive: true,
                sortOrder: 10
            });
            console.log('✅ Created Category: Gifting & Flowers');
        }

        // 2. Create or Find Seller
        const sellerEmail = 'giftstore@tastyaana.com';
        let seller = await User.findOne({ email: sellerEmail });

        if (!seller) {
            seller = await User.create({
                name: 'The Gift Studio',
                email: sellerEmail,
                password: 'password123', // Dummy password
                role: 'seller',
                isActive: true,
                isEmailVerified: true,
                phone: '9876543210',
                rating: 4.8,

                // Use Indore Coordinates (Palasia Square)
                location: {
                    type: 'Point',
                    coordinates: [75.885822, 22.724424]
                },
                addresses: [{
                    type: 'work',
                    city: 'Indore',
                    street: '123 Gift Lane, Palasia',
                    state: 'Madhya Pradesh',
                    pincode: '452001',
                    country: 'India',
                    coordinates: { lat: 22.724424, lng: 75.885822 }
                }],

                sellerProfile: {
                    storeName: 'The Gift Studio',
                    sellerType: ['gifting'], // Crucial for vertical detection
                    storeType: ['shop'],
                    storeAddress: '123 Gift Lane, Palasia, Indore',
                    storeStatus: 'open',
                    deliverySettings: {
                        minOrderValue: 200,
                        deliveryCharges: 30,
                        deliveryRadius: 15000 // 15km
                    },
                    priceRange: { min: 200, max: 5000, costForTwo: 500 },
                    storeMedia: {
                        cover: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=800&q=80",
                        logo: "https://cdn-icons-png.flaticon.com/512/4213/4213640.png"
                    }
                }
            });
            console.log('✅ Created Seller: The Gift Studio');
        } else {
            console.log('ℹ️ Seller already exists.');
            // Update sellerType if needed
            if (!seller.sellerProfile.sellerType.includes('gifting')) {
                seller.sellerProfile.sellerType.push('gifting');
                await seller.save();
                console.log('✅ Updated Seller Type to include gifting');
            }
        }

        // 3. Create a Dummy Product (Required for homepage visibility)
        const productSlug = 'premium-red-roses-bouquet';
        let product = await Product.findOne({ slug: productSlug });

        if (!product) {
            await Product.create({
                title: 'Premium Red Roses Bouquet',
                seller: seller._id,
                category: category._id,
                description: 'Fresh red roses beautifully arranged in a premium bouquet. Perfect for expressing love.',
                price: 599,
                discountPrice: 499, // Discounted
                discount: 17,
                images: [{
                    url: 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=800&q=80',
                    alt: 'Red Roses'
                }],
                isActive: true,
                featured: true, // Show on homepage
                status: 'in_stock',
                stock: 50,
                tags: ['flowers', 'gift', 'roses', 'love'],
                preparationTime: 15,
                slug: productSlug
            });
            console.log('✅ Created Product: Premium Red Roses Bouquet');
        } else {
            console.log('ℹ️ Product already exists.');
        }

        // 4. Create another product (Cake)
        const cakeSlug = 'black-forest-cake-500g';
        let cake = await Product.findOne({ slug: cakeSlug });

        if (!cake) {
            await Product.create({
                title: 'Black Forest Cake (500g)',
                seller: seller._id,
                category: category._id,
                description: 'Rich chocolate cake with fresh cream and cherries.',
                price: 450,
                discountPrice: 399,
                discount: 11,
                images: [{
                    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800&q=80',
                    alt: 'Black Forest Cake'
                }],
                isActive: true,
                featured: true,
                status: 'in_stock',
                stock: 20,
                tags: ['cake', 'birthday', 'chocolate'],
                preparationTime: 30,
                slug: cakeSlug
            });
            console.log('✅ Created Product: Black Forest Cake');
        }

        console.log('🎉 Seeding Complete! The Gift Studio is now live in Indore.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        process.exit(1);
    }
};

seedGiftingSeller();
