const mongoose = require('mongoose');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
require('dotenv').config({ path: '../.env' }); // Adjust path if needed

const debugSeller = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://harsh:harsh@cluster0.1q7s5.mongodb.net/tastyaana?retryWrites=true&w=majority');
        console.log("Connected to DB");

        // Find ANY seller with 'rental' in their type OR just find all sellers and print their types
        const sellers = await User.find({ role: 'seller' }).select('name sellerProfile.sellerType location');

        console.log(`\nFound ${sellers.length} sellers:`);
        for (const s of sellers) {
            const type = s.sellerProfile?.sellerType || [];
            const isRental = type.some(t => t.toLowerCase().includes('rent') || t.toLowerCase().includes('vehicle'));

            if (isRental) {
                console.log(`\n--- RENTAL SELLER FOUND ---`);
                console.log(`ID: ${s._id}`);
                console.log(`Name: ${s.name}`);
                console.log(`Types: ${JSON.stringify(type)}`);
                console.log(`Location: ${JSON.stringify(s.location)}`);

                // Check Vehicles
                const vehicleCount = await Vehicle.countDocuments({ sellerId: s._id });
                console.log(`Vehicle Count (sellerId): ${vehicleCount}`);

                const vehicleCountRef = await Vehicle.countDocuments({ seller: s._id });
                console.log(`Vehicle Count (seller): ${vehicleCountRef}`);

                // Check One Vehicle Status
                const v = await Vehicle.findOne({ sellerId: s._id });
                if (v) console.log(`Sample Vehicle Status: ${v.status}`);
            }
        }

        // Also list ALL unique sellerTypes in DB
        const allTypes = new Set();
        sellers.forEach(s => (s.sellerProfile?.sellerType || []).forEach(t => allTypes.add(t)));
        console.log(`\nAll Known Seller Types:`, Array.from(allTypes));

        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

debugSeller();
