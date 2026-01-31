const mongoose = require('mongoose');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
require('dotenv').config();

const connect = async () => {
    try {
        const connectionString = "mongodb+srv://harsh:harsh@unifiedcampus.i5fit.mongodb.net/onlinestore";
        await mongoose.connect(connectionString);
        console.log("Connected to DB");
        runDebug();
    } catch (err) {
        console.error("DB Connection Error", err);
    }
};

const fs = require('fs');
const log = (msg) => {
    console.log(msg);
    fs.appendFileSync('debug_output.txt', msg + '\n');
};

const runDebug = async () => {
    try {
        // Indore Coordinates (Approx)
        const indoreLat = 22.7196;
        const indoreLng = 75.8577;

        log(`Searching near ${indoreLat}, ${indoreLng} (Indore)`);

        // 1. Find Rental Sellers (100km)
        const nearbyRentalSellers = await User.find({
            role: 'seller',
            location: {
                $near: {
                    $geometry: { type: "Point", coordinates: [indoreLng, indoreLat] },
                    $maxDistance: 100000 // 100km
                }
            }
        }).select('_id name email location');

        log(`Found ${nearbyRentalSellers.length} sellers within 100km.`);
        nearbyRentalSellers.forEach(s => log(` - Seller: ${s.name} (${s._id})`));

        const rentalSellerIds = nearbyRentalSellers.map(u => u._id);

        if (rentalSellerIds.length > 0) {
            // 2. Check Vehicles
            const vehicles = await Vehicle.find({ sellerId: { $in: rentalSellerIds } });
            log(`Found ${vehicles.length} vehicles for these sellers.`);

            vehicles.forEach(v => {
                log(` - Vehicle: ${v.name} | Status: ${v.status} | SellerId in Vehicle: ${v.sellerId}`);
            });

            const countActive = await Vehicle.countDocuments({
                sellerId: { $in: rentalSellerIds },
                status: 'active'
            });
            log(`Active Vehicles Count: ${countActive}`);
        } else {
            log("No sellers found, so no vehicles checked.");
        }

    } catch (err) {
        log("Error: " + err);
    } finally {
        mongoose.disconnect();
    }
};

connect();
