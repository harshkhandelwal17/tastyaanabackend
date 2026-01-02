const express = require('express');
const User = require('../models/User');
const router = express.Router();

// GET /api/test/vehicle-sellers - Get all vehicle rental sellers
router.get('/vehicle-sellers', async (req, res) => {
  try {
    const sellers = await User.find({
      role: 'seller',
      'sellerProfile.vehicleRentalService.isEnabled': true
    }).select('-password').lean();

    const formattedSellers = sellers.map(seller => ({
      id: seller._id,
      name: seller.name,
      email: seller.email,
      phone: seller.phone,
      storeName: seller.sellerProfile.storeName,
      storeAddress: seller.sellerProfile.storeAddress,
      rating: seller.sellerProfile.ratings,
      serviceStatus: seller.sellerProfile.vehicleRentalService.serviceStatus,
      businessType: seller.sellerProfile.vehicleRentalService.businessType,
      zones: seller.sellerProfile.vehicleRentalService.serviceZones.map(zone => ({
        name: zone.zoneName,
        code: zone.zoneCode,
        address: zone.address,
        coordinates: zone.coordinates,
        isActive: zone.isActive
      })),
      fleetStats: seller.sellerProfile.vehicleRentalService.fleetStats,
      businessMetrics: seller.sellerProfile.vehicleRentalService.businessMetrics
    }));

    res.json({
      success: true,
      count: formattedSellers.length,
      data: formattedSellers
    });
  } catch (error) {
    console.error('Error fetching vehicle sellers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching vehicle rental sellers',
      error: error.message
    });
  }
});

// GET /api/test/vehicle-sellers/by-zone/:zoneName - Get sellers by zone
router.get('/vehicle-sellers/by-zone/:zoneName', async (req, res) => {
  try {
    const { zoneName } = req.params;
    
    const sellers = await User.find({
      role: 'seller',
      'sellerProfile.vehicleRentalService.isEnabled': true,
      'sellerProfile.vehicleRentalService.serviceZones.zoneName': new RegExp(zoneName, 'i')
    }).select('-password').lean();

    const formattedSellers = sellers.map(seller => ({
      id: seller._id,
      name: seller.name,
      storeName: seller.sellerProfile.storeName,
      rating: seller.sellerProfile.ratings,
      matchingZones: seller.sellerProfile.vehicleRentalService.serviceZones.filter(zone =>
        zone.zoneName.toLowerCase().includes(zoneName.toLowerCase())
      ),
      totalVehicles: seller.sellerProfile.vehicleRentalService.fleetStats.totalVehicles,
      activeVehicles: seller.sellerProfile.vehicleRentalService.fleetStats.activeVehicles
    }));

    res.json({
      success: true,
      zone: zoneName,
      count: formattedSellers.length,
      data: formattedSellers
    });
  } catch (error) {
    console.error('Error fetching sellers by zone:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching sellers by zone',
      error: error.message
    });
  }
});

// GET /api/test/zones/statistics - Get zone statistics
router.get('/zones/statistics', async (req, res) => {
  try {
    const sellers = await User.find({
      role: 'seller',
      'sellerProfile.vehicleRentalService.isEnabled': true
    }).select('sellerProfile.storeName sellerProfile.vehicleRentalService').lean();

    const zoneStats = {
      "Bholaram Ustad Marg": { sellers: 0, totalVehicles: 0, activeVehicles: 0, avgRating: 0 },
      "Vijaynagar": { sellers: 0, totalVehicles: 0, activeVehicles: 0, avgRating: 0 },
      "Indrapuri": { sellers: 0, totalVehicles: 0, activeVehicles: 0, avgRating: 0 }
    };

    const ratingTotals = { "Bholaram Ustad Marg": 0, "Vijaynagar": 0, "Indrapuri": 0 };

    sellers.forEach(seller => {
      seller.sellerProfile.vehicleRentalService.serviceZones.forEach(zone => {
        if (zoneStats[zone.zoneName]) {
          zoneStats[zone.zoneName].sellers++;
          zoneStats[zone.zoneName].totalVehicles += seller.sellerProfile.vehicleRentalService.fleetStats.totalVehicles;
          zoneStats[zone.zoneName].activeVehicles += seller.sellerProfile.vehicleRentalService.fleetStats.activeVehicles;
          ratingTotals[zone.zoneName] += seller.sellerProfile.vehicleRentalService.businessMetrics.averageRating;
        }
      });
    });

    // Calculate average ratings
    Object.keys(zoneStats).forEach(zoneName => {
      if (zoneStats[zoneName].sellers > 0) {
        zoneStats[zoneName].avgRating = (ratingTotals[zoneName] / zoneStats[zoneName].sellers).toFixed(1);
      }
    });

    res.json({
      success: true,
      data: zoneStats,
      summary: {
        totalZones: Object.keys(zoneStats).length,
        totalSellers: Object.values(zoneStats).reduce((sum, zone) => sum + zone.sellers, 0),
        totalVehicles: Object.values(zoneStats).reduce((sum, zone) => sum + zone.totalVehicles, 0)
      }
    });
  } catch (error) {
    console.error('Error fetching zone statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching zone statistics',
      error: error.message
    });
  }
});

// POST /api/test/seed-vehicle-sellers - Trigger seeding from API
router.post('/seed-vehicle-sellers', async (req, res) => {
  try {
    const { allVehicleRentalSellers, hashPasswords } = require('../mockData/vehicleRentalSellers');
    
    // Check if sellers already exist
    const existingEmails = allVehicleRentalSellers.map(seller => seller.email);
    const existingCount = await User.countDocuments({
      email: { $in: existingEmails },
      role: 'seller'
    });

    if (existingCount > 0 && !req.body.force) {
      return res.status(409).json({
        success: false,
        message: `${existingCount} vehicle rental sellers already exist. Use force=true to override.`,
        existingCount
      });
    }

    // Remove existing if force is true
    if (req.body.force) {
      await User.deleteMany({
        email: { $in: existingEmails },
        role: 'seller'
      });
    }

    // Hash passwords and insert
    const hashedSellers = await hashPasswords([...allVehicleRentalSellers]);
    const insertedSellers = await User.insertMany(hashedSellers);

    res.json({
      success: true,
      message: 'Vehicle rental sellers seeded successfully',
      count: insertedSellers.length,
      sellers: insertedSellers.map(seller => ({
        name: seller.name,
        email: seller.email,
        storeName: seller.sellerProfile.storeName,
        zones: seller.sellerProfile.vehicleRentalService.serviceZones.map(z => z.zoneName)
      }))
    });
  } catch (error) {
    console.error('Error seeding from API:', error);
    res.status(500).json({
      success: false,
      message: 'Error seeding vehicle rental sellers',
      error: error.message
    });
  }
});

module.exports = router;