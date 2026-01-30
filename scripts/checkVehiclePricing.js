const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' }); // Adjust path if needed
const Vehicle = require('../models/Vehicle');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://harsh:harsh@unifiedcampus.i5fit.mongodb.net/onlinestore');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const checkPricing = async () => {
    await connectDB();

    try {
        const vehicles = await Vehicle.find({});
        console.log(`Checking pricing for ${vehicles.length} vehicles...`);
        console.log('------------------------------------------------');

        let highPriceCount = 0;

        vehicles.forEach(vehicle => {
            const r12 = vehicle.rate12hr || {};
            const r24 = vehicle.rate24hr || {};

            if (r12.baseRate > 5000 || r24.baseRate > 5000) {
                console.log(`\nVehicle: ${vehicle.name} (${vehicle.vehicleNo})`);
                console.log(`Category: ${vehicle.category}`);
                console.log(`Rate 12hr Base: ${r12.baseRate}`);
                console.log(`Rate 24hr Base: ${r24.baseRate}`);
                console.log(`Hourly Rate: ${vehicle.rateHourly?.ratePerHour}`);
                highPriceCount++;
            }
        });

        console.log('\n------------------------------------------------');
        console.log(`Total Vehicles: ${vehicles.length}`);
        console.log(`Vehicles with inflated pricing (>5000): ${highPriceCount}`);

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.disconnect();
    }
};

checkPricing();
