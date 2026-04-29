const mongoose = require('mongoose');
const DeliveryZone = require('../models/DeliveryZone');

const uri = "mongodb+srv://harsh:harsh@unifiedcampus.i5fit.mongodb.net/onlinestore";

async function checkData() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const zones = await DeliveryZone.find({}, 'name code _id');
    console.log('Zones:', zones);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
