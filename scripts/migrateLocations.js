const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://harsh:harsh@unifiedcampus.i5fit.mongodb.net/onlinestore";

// Default Center (Indore - Vijay Nagar)
const DEFAULT_LAT = 22.7533;
const DEFAULT_LNG = 75.8937;

const migrateLocations = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Find all sellers who don't have location coordinates set properly
        // Note: checking for empty coordinates or default [0,0]
        const sellers = await User.find({
            role: 'seller',
            $or: [
                { location: { $exists: false } },
                { 'location.coordinates': { $size: 0 } },
                { 'location.coordinates': [0, 0] }
            ]
        });

        console.log(`Found ${sellers.length} sellers to update.`);

        for (const seller of sellers) {
            let lat = DEFAULT_LAT;
            let lng = DEFAULT_LNG;

            // Simple randomization to spread them out slightly around Indore for demo purposes
            // In a real app, you would Geocode their 'addresses[0].street' + 'addresses[0].city' using Google Maps API
            // But to avoid API costs/complexity in migration, we can just initialize them.

            // Random offset ~0.02 degrees (roughly 2km)
            const latOffset = (Math.random() - 0.5) * 0.04;
            const lngOffset = (Math.random() - 0.5) * 0.04;

            // Check if they have existing address coordinates
            if (seller.addresses && seller.addresses.length > 0 && seller.addresses[0].coordinates && seller.addresses[0].coordinates.lat) {
                lat = seller.addresses[0].coordinates.lat;
                lng = seller.addresses[0].coordinates.lng;
                console.log(`Using existing address coordinates for ${seller.name}`);
            } else {
                lat = DEFAULT_LAT + latOffset;
                lng = DEFAULT_LNG + lngOffset;
                console.log(`Assigning default random coordinates for ${seller.name}`);
            }

            // FIX: Validate and Clean sellerProfile Enums
            if (seller.sellerProfile) {
                // 1. Fix sellerType
                if (seller.sellerProfile.sellerType && seller.sellerProfile.sellerType.length > 0) {
                    const validSellerTypes = ['food', 'tiffin', 'grocery', 'laundry', 'all', 'other'];
                    seller.sellerProfile.sellerType = seller.sellerProfile.sellerType.map(type => {
                        if (validSellerTypes.includes(type)) return type;
                        if (type === 'meal-plan') return 'tiffin'; // Map invalid 'meal-plan' to 'tiffin'
                        return 'other'; // Fallback
                    });
                }

                // 2. Fix storeType
                if (seller.sellerProfile.storeType && seller.sellerProfile.storeType.length > 0) {
                    const validStoreTypes = ['restaurant', 'mess', 'kitchen', 'shop', 'store'];
                    seller.sellerProfile.storeType = seller.sellerProfile.storeType.map(type => {
                        if (validStoreTypes.includes(type)) return type;
                        if (type === 'cloud-kitchen') return 'kitchen'; // Map 'cloud-kitchen' to 'kitchen'
                        return 'store'; // Fallback
                    });
                }
            }

            seller.location = {
                type: 'Point',
                coordinates: [lng, lat], // Mongo uses [lng, lat]
                address: seller.addresses?.[0]?.street || "Indore, Madhya Pradesh"
            };

            // Mark modified to ensure mongoose saves changes to nested objects
            seller.markModified('sellerProfile');
            await seller.save();
        }

        console.log('Migration completed successfully.');
        process.exit(0);

    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateLocations();
