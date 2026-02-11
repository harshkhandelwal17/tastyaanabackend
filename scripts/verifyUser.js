const mongoose = require('mongoose');
const path = require('path');
const User = require('../models/User');

const verifyUser = async () => {
    try {
        const connectionString = "mongodb+srv://harsh:harsh@unifiedcampus.i5fit.mongodb.net/onlinestore";
        console.log("Using Connection String:", connectionString);

        await mongoose.connect(connectionString);
        console.log("Connected to DB");

        const email = "aarti@gmail.com";
        const user = await User.findOne({ email });

        if (!user) {
            console.log("User not found!");
        } else {
            console.log("User Found:", user.name);
            console.log("Role:", user.role);

            const userObj = user.toObject();
            const hasSellerProfile = !!userObj.sellerProfile;
            console.log("Seller Profile Present?", hasSellerProfile);

            if (hasSellerProfile) {
                console.log("Full Seller Profile:", JSON.stringify(userObj.sellerProfile, null, 2));
            } else {
                console.log("WARNING: Seller Profile is NULL/UNDEFINED in DB!");
            }

            console.log("Addresses:", JSON.stringify(userObj.addresses, null, 2));
        }

        mongoose.disconnect();
    } catch (error) {
        console.error("Error:", error);
    }
};

verifyUser();
