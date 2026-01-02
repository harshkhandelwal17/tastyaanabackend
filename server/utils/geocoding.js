const axios = require('axios');

/**
 * Convert address string to coordinates using Google Geocoding API
 * @param {string} address - Full address string
 * @returns {Object|null} - {lat, lng} or null if failed
 */
const addressToCoordinates = async (address) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key not found');
      return null;
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: address,
        key: apiKey
      }
    });

    if (response.data.status === 'OK' && response.data.results[0]) {
      const location = response.data.results[0].geometry.location;
      return {
        lat: location.lat,
        lng: location.lng
      };
    }

    console.log('Geocoding failed:', response.data.status);
    return null;
  } catch (error) {
    console.error('Error in geocoding:', error.message);
    return null;
  }
};

/**
 * Convert coordinates to address using Google Reverse Geocoding API
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {string|null} - Formatted address or null if failed
 */
const coordinatesToAddress = async (lat, lng) => {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.warn('Google Maps API key not found');
      return null;
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        latlng: `${lat},${lng}`,
        key: apiKey
      }
    });

    if (response.data.status === 'OK' && response.data.results[0]) {
      return response.data.results[0].formatted_address;
    }

    return null;
  } catch (error) {
    console.error('Error in reverse geocoding:', error.message);
    return null;
  }
};

/**
 * Ensure delivery address has coordinates
 * @param {Object} deliveryAddress - Address object
 * @returns {Object} - Address with coordinates
 */
const ensureCoordinates = async (deliveryAddress) => {
  if (deliveryAddress.coordinates && deliveryAddress.coordinates.lat && deliveryAddress.coordinates.lng) {
    return deliveryAddress;
  }

  // Try to geocode the address
  const fullAddress = `${deliveryAddress.street}, ${deliveryAddress.city}, ${deliveryAddress.state}, ${deliveryAddress.country || 'India'}`;
  const coordinates = await addressToCoordinates(fullAddress);

  return {
    ...deliveryAddress,
    coordinates: coordinates || null
  };
};

module.exports = {
  addressToCoordinates,
  coordinatesToAddress,
  ensureCoordinates
};