// Zone-based Vehicle Rental System Implementation Summary
// This file demonstrates the new hierarchical system structure

const mongoose = require('mongoose');

// Example usage scenarios for the new system:

// 1. Creating a seller with zones
const sellerExample = {
  name: "John's Vehicle Rental",
  email: "john@vehiclerental.com",
  phone: 9876543210,
  role: "seller",
  sellerProfile: {
    vehicleRentalService: {
      isEnabled: true,
      serviceStatus: "active",
      businessType: "fleet_owner",
      serviceZones: [
        {
          zoneName: "Downtown Zone",
          zoneCode: "DT001",
          workerId: "676e8b1234567890abcdef01", // ObjectId of the worker
          address: "123 Downtown Street, City Center",
          coordinates: { lat: 28.6139, lng: 77.2090 },
          isActive: true,
          operatingHours: {
            monday: { open: "08:00", close: "20:00", isOpen: true },
            tuesday: { open: "08:00", close: "20:00", isOpen: true },
            // ... other days
          },
          contactInfo: {
            phone: "9876543211",
            email: "downtown@vehiclerental.com",
            managerName: "Worker Name"
          }
        },
        {
          zoneName: "Airport Zone",
          zoneCode: "AP002",
          workerId: "676e8b1234567890abcdef02", // ObjectId of another worker
          address: "Airport Road, Terminal 1",
          coordinates: { lat: 28.5562, lng: 77.1000 },
          isActive: true,
          // ... similar structure
        }
      ]
    }
  }
};

// 2. Creating a worker linked to a seller and zone
const workerExample = {
  name: "Worker Name",
  email: "worker@vehiclerental.com",
  phone: 9876543220,
  role: "worker",
  workerProfile: {
    sellerId: "676e8b1234567890abcdef03", // ObjectId of the seller
    zoneId: "DT001",
    zoneCode: "DT001", 
    zoneName: "Downtown Zone",
    isActive: true,
    joinedDate: new Date(),
    lastActiveDate: new Date(),
    performance: {
      bookingsHandled: 0,
      averageRating: 0,
      totalRatings: 0
    },
    workingHours: {
      monday: { start: "08:00", end: "18:00", isWorking: true },
      tuesday: { start: "08:00", end: "18:00", isWorking: true },
      // ... other days
    }
  }
};

// 3. Creating a vehicle associated with a zone
const vehicleExample = {
  name: "Honda Activa 6G",
  category: "scooty",
  type: "Petrol",
  vehicleNo: "MH12AB1234",
  companyName: "Honda",
  zoneId: "DT001", // Links to Downtown Zone
  zoneCenterName: "Downtown Center",
  zoneCenterAddress: "123 Downtown Street, City Center",
  zoneCode: "DT001",
  locationGeo: {
    type: "Point",
    coordinates: [77.2090, 28.6139] // [lng, lat]
  },
  sellerId: "676e8b1234567890abcdef03", // ObjectId of the seller
  status: "active",
  availability: "available"
};

// 4. Creating a booking for a specific zone
const bookingExample = {
  vehicleId: "676e8b1234567890abcdef04", // ObjectId of the vehicle
  userId: "676e8b1234567890abcdef05", // ObjectId of the customer
  startDateTime: new Date(),
  endDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours later
  zone: "Downtown Zone",
  zoneId: "DT001", // Links to Downtown Zone
  centerId: "DTC001",
  centerName: "Downtown Center",
  centerAddress: "123 Downtown Street, City Center",
  bookingStatus: "pending",
  paymentStatus: "pending"
};

// Query Examples:

// 1. Get all zones for a seller
async function getSellerZones(sellerId) {
  const User = require('./models/User');
  const seller = await User.findById(sellerId);
  return seller.sellerProfile.vehicleRentalService.serviceZones;
}

// 2. Get all vehicles in a specific zone
async function getZoneVehicles(zoneId) {
  const Vehicle = require('./models/Vehicle');
  return Vehicle.find({ zoneId, status: 'active' });
}

// 3. Get all bookings for a specific zone
async function getZoneBookings(zoneId) {
  const VehicleBooking = require('./models/VehicleBooking');
  return VehicleBooking.find({ zoneId }).sort({ bookingDate: -1 });
}

// 4. Get worker information for a zone
async function getZoneWorker(sellerId, zoneId) {
  const User = require('./models/User');
  return User.findOne({ 
    role: 'worker',
    'workerProfile.sellerId': sellerId,
    'workerProfile.zoneId': zoneId 
  });
}

// 5. Get all data for a seller (seller can see everything)
async function getSellerDashboard(sellerId) {
  const User = require('./models/User');
  const Vehicle = require('./models/Vehicle');
  const VehicleBooking = require('./models/VehicleBooking');

  // Get seller with zones
  const seller = await User.findById(sellerId);
  const zones = seller.sellerProfile.vehicleRentalService.serviceZones;

  // Get all vehicles across all zones
  const vehicles = await Vehicle.find({ sellerId });

  // Get all bookings across all zones
  const zoneIds = zones.map(zone => zone.zoneCode);
  const bookings = await VehicleBooking.find({ 
    zoneId: { $in: zoneIds } 
  }).sort({ bookingDate: -1 });

  // Get all workers
  const workers = await User.find({
    role: 'worker',
    'workerProfile.sellerId': sellerId
  });

  return {
    seller,
    zones,
    vehicles,
    bookings,
    workers
  };
}

// 6. Get data for a specific worker (worker can only see their zone)
async function getWorkerDashboard(workerId) {
  const User = require('./models/User');
  const Vehicle = require('./models/Vehicle');
  const VehicleBooking = require('./models/VehicleBooking');

  // Get worker information
  const worker = await User.findById(workerId);
  const { zoneId } = worker.workerProfile;

  // Get only vehicles in worker's zone
  const vehicles = await Vehicle.find({ zoneId });

  // Get only bookings in worker's zone
  const bookings = await VehicleBooking.find({ zoneId }).sort({ bookingDate: -1 });

  return {
    worker,
    zoneId,
    vehicles,
    bookings
  };
}

module.exports = {
  getSellerZones,
  getZoneVehicles,
  getZoneBookings,
  getZoneWorker,
  getSellerDashboard,
  getWorkerDashboard,
  sellerExample,
  workerExample,
  vehicleExample,
  bookingExample
};