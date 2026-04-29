const mongoose = require('mongoose');
const VehicleBooking = require('../models/VehicleBooking');

const uri = "mongodb+srv://harsh:harsh@unifiedcampus.i5fit.mongodb.net/onlinestore";

async function checkData() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const total = await VehicleBooking.countDocuments({});
    console.log('Total bookings:', total);

    const requests = await VehicleBooking.find({ requiresApproval: true });
    console.log('Requests with requiresApproval:true:', requests.length);

    if (requests.length > 0) {
        console.log('Sample Request Zones:', requests.map(r => ({ id: r._id, zoneId: r.zoneId, status: r.requestStatus })));
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
