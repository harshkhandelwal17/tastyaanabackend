const mongoose = require('mongoose');
const User = require('../models/User');

const uri = "mongodb+srv://harsh:harsh@unifiedcampus.i5fit.mongodb.net/onlinestore";

async function checkData() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const workers = await User.find({ role: 'worker' }, 'name workerProfile');
    console.log('Workers:', workers.map(w => ({ 
        name: w.name, 
        zoneId: w.workerProfile?.zoneId,
        zoneName: w.workerProfile?.zoneName 
    })));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

checkData();
