import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, AlertCircle, CheckCircle, Loader } from 'lucide-react';

const LocationService = ({ onLocationUpdate, showCurrentLocation = false }) => {
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [address, setAddress] = useState('');
  const [permissionStatus, setPermissionStatus] = useState('prompt');

  useEffect(() => {
    checkGeolocationPermission();
  }, []);

  const checkGeolocationPermission = async () => {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionStatus(permission.state);
        
        permission.addEventListener('change', () => {
          setPermissionStatus(permission.state);
        });
      } catch (error) {
        console.log('Permission API not supported');
      }
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setLoading(true);
    setError(null);

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 300000 // 5 minutes
    };

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        
        setLocation(coords);
        
        // Get address from coordinates using Google Geocoding API
        try {
          const addressData = await reverseGeocode(coords);
          setAddress(addressData);
          
          if (onLocationUpdate) {
            onLocationUpdate({
              coordinates: coords,
              address: addressData,
              accuracy: position.coords.accuracy
            });
          }
        } catch (geocodeError) {
          console.error('Geocoding error:', geocodeError);
          if (onLocationUpdate) {
            onLocationUpdate({
              coordinates: coords,
              address: 'Address not available',
              accuracy: position.coords.accuracy
            });
          }
        }
        
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('Location access denied. Please enable location permissions.');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('Location information is unavailable.');
            break;
          case error.TIMEOUT:
            setError('Location request timed out. Please try again.');
            break;
          default:
            setError('An unknown error occurred while retrieving location.');
            break;
        }
      },
      options
    );
  };

  const reverseGeocode = async (coords) => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      throw new Error('Google Maps API key not configured');
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coords.lat},${coords.lng}&key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data = await response.json();
    
    if (data.status !== 'OK' || !data.results.length) {
      throw new Error('No address found for this location');
    }

    const result = data.results[0];
    const addressComponents = result.address_components;
    
    // Parse address components
    const getComponent = (type) => {
      const component = addressComponents.find(comp => comp.types.includes(type));
      return component ? component.long_name : '';
    };

    return {
      formatted: result.formatted_address,
      street: getComponent('route') || getComponent('sublocality'),
      city: getComponent('locality') || getComponent('administrative_area_level_2'),
      state: getComponent('administrative_area_level_1'),
      country: getComponent('country'),
      zipCode: getComponent('postal_code'),
      coordinates: coords
    };
  };

  const getLocationStatusIcon = () => {
    if (loading) return <Loader className="h-5 w-5 animate-spin" />;
    if (error) return <AlertCircle className="h-5 w-5 text-red-500" />;
    if (location) return <CheckCircle className="h-5 w-5 text-green-500" />;
    return <MapPin className="h-5 w-5" />;
  };

  const getLocationStatusText = () => {
    if (loading) return 'Getting your location...';
    if (error) return error;
    if (location) return 'Location detected successfully';
    return 'Click to detect your current location';
  };

  return (
    <div className="space-y-4">
      {/* Location Detection Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={getCurrentLocation}
        disabled={loading}
        className={`
          w-full p-4 rounded-lg border-2 border-dashed transition-all duration-200
          ${location 
            ? 'border-green-300 bg-green-50 text-green-700' 
            : error 
            ? 'border-red-300 bg-red-50 text-red-700'
            : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-blue-400 hover:bg-blue-50'
          }
          ${loading ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
        `}
      >
        <div className="flex items-center justify-center space-x-3">
          {getLocationStatusIcon()}
          <div className="text-left">
            <p className="font-medium">{getLocationStatusText()}</p>
            {location && address && (
              <p className="text-sm opacity-75 mt-1">
                {typeof address === 'string' ? address : address.formatted}
              </p>
            )}
          </div>
        </div>
      </motion.button>

      {/* Current Location Display */}
      {showCurrentLocation && location && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border rounded-lg p-4"
        >
          <div className="flex items-start space-x-3">
            <Navigation className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-2">Current Location</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Address:</strong> {typeof address === 'string' ? address : address.formatted}</p>
                <p><strong>Coordinates:</strong> {location.lat.toFixed(6)}, {location.lng.toFixed(6)}</p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Permission Status */}
      {permissionStatus === 'denied' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              <p className="font-medium">Location Permission Denied</p>
              <p>To use location services, please enable location permissions in your browser settings.</p>
            </div>
          </div>
        </div>
      )}

      {/* Location Accuracy Info */}
      {location && (
        <div className="text-xs text-gray-500 text-center">
          Location accuracy may vary based on your device and network connection
        </div>
      )}
    </div>
  );
};

export default LocationService;
