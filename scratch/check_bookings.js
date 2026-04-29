const mongoose = require('mongoose');
const VehicleBooking = require('../models/VehicleBooking');
const User = require('../models/User');

const uri = "mongodb+srv://harsh:harsh@unifiedcampus.i5fit.mongodb.net/onlinestore";

async function checkData() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const worker = await User.findOne({ role: 'worker' });
    if (!worker) {
      console.log('No worker found');
      return;
    }

    const zoneId = worker.workerProfile.zoneId;
    console.log('Worker Zone ID:', zoneId);

    const allInZone = await VehicleBooking.find({ zoneId });
    console.log('Total bookings in zone:', allInZone.length);

    const requestsWithApproval = await VehicleBooking.find({ zoneId, requiresApproval: true });
    console.log('Requests with requiresApproval:true:', requestsWithApproval.length);

    const statuses = await VehicleBooking.aggregate([
      { $match: { zoneId } },
      { $group: { _id: '$requestStatus', count: { $sum: 1 } } }
    ]);
    console.log('Request Statuses in zone:', statuses);

    const reqStatusesWithApproval = await VehicleBooking.aggregate([
      { $match: { zoneId, requiresApproval: true } },
      { $group: { _id: '$requestStatus', count: { $sum: 1 } } }
    ]);
    console.log('Request Statuses (Approval only) in zone:', reqStatusesWithApproval);

    if (allInZone.length > 0) {
        console.log('Sample Booking:', {
            id: allInZone[0]._id,
            requiresApproval: allInZone[0].requiresApproval,
            requestStatus: allInZone[0].requestStatus,
            zoneId: allInZone[0].zoneId
        });
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
