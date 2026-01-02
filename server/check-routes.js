const mongoose = require('mongoose');
const DriverRoute = require('./models/DriverRoute');
require('dotenv').config();

async function checkRoutes() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/onlinestore');
  const routes = await DriverRoute.find({});
  console.log('Total routes:', routes.length);
  routes.forEach(route => {
    console.log(`Route ${route._id}: ${route.stops.length} stops, shift: ${route.shift}, date: ${route.date}`);
  });
  await mongoose.disconnect();
}
checkRoutes();