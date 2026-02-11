// routes/testRoute.js
const express = require("express");
const router = express.Router();
const User = require('../models/User');

// Existing test route
router.get("/", (req, res) => {
    res.send("Test route is working!");
});

// NEW: Geospatial Debug Route
router.get("/debug-location", async (req, res) => {
    try {
        const { lat, lng } = req.query;
        if (!lat || !lng) return res.status(400).json({ error: "Missing lat/lng" });

        const userLoc = { type: "Point", coordinates: [parseFloat(lng), parseFloat(lat)] };

        // Check 1: Count total sellers
        const totalSellers = await User.countDocuments({ role: 'seller' });

        // Check 2: Geospatial Query (100km)
        const sellers100km = await User.find({
            role: 'seller',
            location: {
                $near: {
                    $geometry: userLoc,
                    $maxDistance: 100000
                }
            }
        }).select('name location');

        res.json({
            checking: { lat, lng },
            db_status: {
                total_sellers_in_db: totalSellers,
                connection_state: require('mongoose').connection.readyState
            },
            results: {
                count_100km: sellers100km.length,
                sellers: sellers100km.map(s => ({ id: s._id, name: s.name, loc: s.location }))
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message, stack: error.stack });
    }
});

module.exports = router;
