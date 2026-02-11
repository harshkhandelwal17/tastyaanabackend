const mongoose = require('mongoose');
require('dotenv').config({ path: '../.env' });
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

const fixPricing = async () => {
    await connectDB();

    try {
        // T Thunder - The 75 Lakhs one
        const tThunder = await Vehicle.findOne({ vehicleNo: 'NX02NX0001' });
        if (tThunder) {
            console.log(`Fixing T Thunder (${tThunder.vehicleNo})...`);

            // Fix Geo Location if corrupt
            if (!tThunder.locationGeo || !tThunder.locationGeo.type) {
                tThunder.locationGeo = {
                    type: 'Point',
                    coordinates: tThunder.locationGeo?.coordinates || [75.8577, 22.7196]
                };
            }

            tThunder.rate12hr = {
                baseRate: 2000,
                ratePerHour: 200,
                kmLimit: 120,
                extraChargePerKm: 10,
                extraChargePerHour: 200,
                fuelChargesperkm: 15,
                gracePeriodMinutes: 30,
                withFuelPerHour: 250,
                withoutFuelPerHour: 200
            };
            tThunder.rate24hr = {
                baseRate: 3500,
                ratePerHour: 150,
                kmLimit: 250,
                extraChargePerKm: 10,
                extraChargePerHour: 150,
                extraBlockRate: 2500,
                gracePeriodMinutes: 60,
                withFuelPerHour: 200,
                withoutFuelPerHour: 150
            };
            tThunder.rateHourly = {
                ratePerHour: 250,
                kmFreePerHour: 15,
                extraChargePerKm: 12,
                withFuelPerHour: 300,
                withoutFuelPerHour: 250
            };
            await tThunder.save();
            console.log('T Thunder Fixed.');
        }

        // NX Fighter 1 - The 75k one
        const nxFighter = await Vehicle.findOne({ vehicleNo: 'NX01NX0001' });
        if (nxFighter) {
            console.log(`Fixing NX Fighter 1 (${nxFighter.vehicleNo})...`);

            if (!nxFighter.locationGeo || !nxFighter.locationGeo.type) {
                nxFighter.locationGeo = {
                    type: 'Point',
                    coordinates: nxFighter.locationGeo?.coordinates || [75.8577, 22.7196]
                };
            }

            nxFighter.rate12hr = {
                baseRate: 2500,
                ratePerHour: 250,
                kmLimit: 120,
                extraChargePerKm: 15,
                extraChargePerHour: 250,
                fuelChargesperkm: 20,
                gracePeriodMinutes: 30,
                withFuelPerHour: 300,
                withoutFuelPerHour: 250
            };
            nxFighter.rate24hr = {
                baseRate: 4500,
                ratePerHour: 200,
                kmLimit: 250,
                extraChargePerKm: 15,
                extraChargePerHour: 200,
                extraBlockRate: 3500,
                gracePeriodMinutes: 60,
                withFuelPerHour: 250,
                withoutFuelPerHour: 200
            };
            nxFighter.rateHourly = {
                ratePerHour: 300,
                kmFreePerHour: 15,
                extraChargePerKm: 15,
                withFuelPerHour: 350,
                withoutFuelPerHour: 300
            };
            await nxFighter.save();
            console.log('NX Fighter 1 Fixed.');
        }

        // Concept car 1 - The 15k one (maybe reasonable but let's lower slightly to be safe)
        const conceptCar = await Vehicle.findOne({ vehicleNo: 'NX01TA0001' });
        if (conceptCar) {
            console.log(`Fixing Concept car 1 (${conceptCar.vehicleNo})...`);

            if (!conceptCar.locationGeo || !conceptCar.locationGeo.type) {
                conceptCar.locationGeo = {
                    type: 'Point',
                    coordinates: conceptCar.locationGeo?.coordinates || [75.8577, 22.7196]
                };
            }

            conceptCar.rate12hr = {
                baseRate: 1500,
                ratePerHour: 150,
                kmLimit: 120,
                extraChargePerKm: 10,
                extraChargePerHour: 150,
                fuelChargesperkm: 12,
                gracePeriodMinutes: 30,
                withFuelPerHour: 200,
                withoutFuelPerHour: 150
            };
            conceptCar.rate24hr = {
                baseRate: 2500,
                ratePerHour: 100,
                kmLimit: 250,
                extraChargePerKm: 10,
                extraChargePerHour: 100,
                extraBlockRate: 1500,
                gracePeriodMinutes: 60,
                withFuelPerHour: 150,
                withoutFuelPerHour: 100
            };
            conceptCar.rateHourly = {
                ratePerHour: 200,
                kmFreePerHour: 15,
                extraChargePerKm: 12,
                withFuelPerHour: 250,
                withoutFuelPerHour: 200
            };
            await conceptCar.save();
            console.log('Concept car 1 Fixed.');
        }

        console.log('All fixes applied.');

    } catch (error) {
        console.error(error);
    } finally {
        mongoose.disconnect();
    }
};

fixPricing();
