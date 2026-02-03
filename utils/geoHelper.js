const User = require('../models/User');

// Centralize the Distance Calculation Logic
const getDistanceInMeters = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
};

/**
 * Fetch sellers who service the given location.
 * @param {number} lat - User Latitude
 * @param {number} lng - User Longitude
 * @param {string|RegExp} [sellerType] - Optional filter for seller type (e.g. /food/i)
 * @returns {Promise<Array>} - List of Seller Documents with 'distance' property added
 */
const getNearbySellers = async (lat, lng, sellerType = null) => {
    if (!lat || !lng) return [];

    // 1. Candidate Fetch (Broad Search - 500km to ensure we catch everyone relevant)
    // We use a large limit because strict filtering happens in Step 2 based on dynamic radius.
    const BROAD_SEARCH_LIMIT_METERS = 500000;

    const query = {
        role: 'seller',
        isActive: true,
        isBlocked: false,
        'sellerProfile.storeStatus': { $ne: 'closed' }, // Basic Availability Check
        location: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [parseFloat(lng), parseFloat(lat)]
                },
                $maxDistance: BROAD_SEARCH_LIMIT_METERS
            }
        }
    };

    if (sellerType) {
        query['sellerProfile.sellerType'] = { $in: [sellerType] };
    }

    // Select only necessary fields for efficiency
    // Select only necessary fields for efficiency (Select entire sellerProfile to avoid path collision)
    const candidates = await User.find(query)
        .select('name sellerProfile location')
        .lean();

    // 2. Strict Dynamic Filter
    const validSellers = candidates.filter(seller => {
        const sLat = seller.location?.coordinates?.[1];
        const sLng = seller.location?.coordinates?.[0];

        if (!sLat || !sLng) return false;

        const distance = getDistanceInMeters(lat, lng, sLat, sLng);

        // SOURCE OF TRUTH: Database Field (Fallback to 5km only if undefined)
        const serviceableRadius = seller.sellerProfile?.deliverySettings?.deliveryRadius || 5000;

        // Inject distance for sorting/display
        seller.distance = Math.round(distance);

        return distance <= serviceableRadius;
    });

    // 3. Sort by Distance
    return validSellers.sort((a, b) => a.distance - b.distance);
};

module.exports = {
    getNearbySellers,
    getDistanceInMeters
};
