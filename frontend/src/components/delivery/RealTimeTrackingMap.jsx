import React, { useState, useEffect, useRef, useCallback } from 'react';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { DirectionsRenderer } from '@react-google-maps/api';
import { 
  MapPin, 
  Truck, 
  Navigation, 
  Clock, 
  Phone, 
  User, 
  Wifi, 
  WifiOff,
  Star,
  Route,
  Activity
} from 'lucide-react';
import useRealTimeTracking from '../../hooks/useRealTimeTracking';

const RealTimeTrackingMap = ({ orderId, deliveryAddress, className = "" }) => {
  const [map, setMap] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [showDriverInfo, setShowDriverInfo] = useState(false);
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);
  
  const {
    driverLocation,
    status,
    driver,
    estimatedTime,
    connectionStatus,
    isConnected,
    isDelivered,
    isReached,
    loading,
    error
  } = useRealTimeTracking(orderId);

  // Use actual delivery address coordinates only
  const ensuredDeliveryAddress = {
    ...deliveryAddress,
    coordinates: deliveryAddress?.coordinates || null
  };
   
  const mapCenter = driverLocation || 
    ensuredDeliveryAddress.coordinates || 
    { lat: 22.7196, lng: 75.8577 }; // Indore city center as fallback

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Calculate route between driver and delivery location
  const calculateRoute = useCallback(async () => {
    if (!driverLocation || !ensuredDeliveryAddress?.coordinates || !window.google || !map) return;

    const directionsService = new window.google.maps.DirectionsService();
    
    try {
      const result = await directionsService.route({
        origin: driverLocation,
        destination: ensuredDeliveryAddress.coordinates,
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: true,
        avoidHighways: false,
        avoidTolls: false
      });

      setDirectionsResponse(result);
      
      const route = result.routes[0];
      if (route) {
        setDistance(route.legs[0].distance.text);
        setDuration(route.legs[0].duration.text);
      }
    } catch (error) {
      console.error('Error calculating route:', error);
    }
  }, [driverLocation, ensuredDeliveryAddress, map]);

  useEffect(() => {
    if (driverLocation && ensuredDeliveryAddress?.coordinates && map) {
      calculateRoute();
    }
  }, [calculateRoute]);

  // Auto-center map when locations change
  useEffect(() => {
    if (map && window.google) {
      const bounds = new window.google.maps.LatLngBounds();
      let hasPoints = false;
      
      if (driverLocation) {
        bounds.extend(driverLocation);
        hasPoints = true;
      }
      if (ensuredDeliveryAddress?.coordinates) {
        bounds.extend(ensuredDeliveryAddress.coordinates);
        hasPoints = true;
      }
      
      if (hasPoints) {
        map.fitBounds(bounds, { padding: 80 });
      }
    }
  }, [map, driverLocation, deliveryAddress]);

  const handleMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
    
    // Add enhanced map styles
    if (mapInstance && window.google) {
      const mapStyles = [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'transit',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        },
        {
          featureType: 'landscape',
          elementType: 'geometry',
          stylers: [{ color: '#f5f5f5' }]
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#e3f2fd' }]
        },
        {
          featureType: 'road',
          elementType: 'geometry',
          stylers: [{ color: '#ffffff' }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry',
          stylers: [{ color: '#fafafa' }]
        },
        {
          featureType: 'road.arterial',
          elementType: 'geometry',
          stylers: [{ color: '#fafafa' }]
        },
        {
          featureType: 'road.local',
          elementType: 'geometry',
          stylers: [{ color: '#ffffff' }]
        }
      ];
      
      mapInstance.setOptions({ styles: mapStyles });
    }
  }, []);

  const openGoogleMaps = () => {
    if (ensuredDeliveryAddress?.coordinates) {
      const destination = `${ensuredDeliveryAddress.coordinates.lat},${ensuredDeliveryAddress.coordinates.lng}`;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
      window.open(url, '_blank');
    }
  };

  const callDriver = () => {
    if (driver?.phone) {
      window.open(`tel:${driver.phone}`);
    }
  };

  if (loading) {
    return (
      <div className={`h-full flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`h-full flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">Unable to load tracking</p>
          <p className="text-sm text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className={`h-full flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Google Maps API key not configured</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full relative ${className}`}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={mapCenter}
          defaultZoom={13}
          mapId="delivery-tracking-map"
          onLoad={handleMapLoad}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: true,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: true,
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }]
              }
            ]
          }}
        >
          {/* Driver Location Marker */}
          {driverLocation && (
            <>
              <Marker
                position={driverLocation}
                onClick={() => setShowDriverInfo(true)}
                icon={{
                  url: 'data:image/svg+xml;base64,' + btoa(`
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="18" fill="#10B981" stroke="white" stroke-width="4"/>
                      <path d="M12 16H28V24H12V16Z" fill="white"/>
                      <circle cx="16" cy="26" r="2" fill="white"/>
                      <circle cx="24" cy="26" r="2" fill="white"/>
                      <path d="M12 16L14 12H26L28 16" fill="white"/>
                    </svg>
                  `),
                  scaledSize: new window.google.maps.Size(40, 40),
                  anchor: new window.google.maps.Point(20, 20)
                }}
              />
              
              {showDriverInfo && (
                <InfoWindow
                  position={driverLocation}
                  onCloseClick={() => setShowDriverInfo(false)}
                >
                  <div className="p-3 min-w-48">
                    <div className="flex items-center mb-3">
                      <Truck className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-semibold text-gray-900">
                        {driver?.name || 'Delivery Partner'}
                      </span>
                    </div>
                    
                    <div className="flex items-center mb-2">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span className="text-sm text-gray-600">{driver?.rating || '4.5'}/5</span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-2">
                      {driver?.vehicle?.type || 'bike'} • {driver?.vehicle?.number || 'Coming Soon'}
                    </p>
                    
                    {distance && duration && (
                      <div className="space-y-1 text-sm text-gray-600 mb-3">
                        <div className="flex justify-between">
                          <span>Distance:</span>
                          <span className="font-medium">{distance}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>ETA:</span>
                          <span className="font-medium">{estimatedTime || duration}</span>
                        </div>
                      </div>
                    )}
                    
                    {driver?.phone && (
                      <button
                        onClick={callDriver}
                        className="w-full flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
                      >
                        <Phone className="h-4 w-4 mr-1" />
                        Call Driver
                      </button>
                    )}
                  </div>
                </InfoWindow>
              )}
            </>
          )}

          {/* Delivery Location Marker */}
          {ensuredDeliveryAddress?.coordinates && (
            <>
              <Marker
                position={ensuredDeliveryAddress.coordinates}
                onClick={() => setShowDeliveryInfo(true)}
                icon={{
                  url: 'data:image/svg+xml;base64,' + btoa(`
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="18" fill="#EF4444" stroke="white" stroke-width="4"/>
                      <path d="M20 8L25 16H15L20 8Z" fill="white"/>
                      <circle cx="20" cy="25" r="4" fill="white"/>
                    </svg>
                  `),
                  scaledSize: new window.google.maps.Size(40, 40),
                  anchor: new window.google.maps.Point(20, 40)
                }}
              />
              
              {showDeliveryInfo && (
                <InfoWindow
                  position={ensuredDeliveryAddress.coordinates}
                  onCloseClick={() => setShowDeliveryInfo(false)}
                >
                  <div className="p-3">
                    <div className="flex items-center mb-2">
                      <MapPin className="h-4 w-4 text-red-600 mr-2" />
                      <span className="font-semibold text-gray-900">Delivery Address</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {ensuredDeliveryAddress.street || 'Your delivery location'}<br />
                      {ensuredDeliveryAddress.city}, {ensuredDeliveryAddress.state}
                    </p>
                  </div>
                </InfoWindow>
              )}
            </>
          )}

          {/* Route Directions */}
          {directionsResponse && (
            <DirectionsRenderer
              directions={directionsResponse}
              options={{
                polylineOptions: {
                  strokeColor: '#3B82F6',
                  strokeWeight: 4,
                  strokeOpacity: 0.8
                },
                suppressMarkers: true
              }}
            />
          )}
        </Map>
      </APIProvider>

      {/* Top Info Panel */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <Activity className="h-5 w-5 text-blue-600 mr-2" />
            <span className="font-semibold text-sm">Live Tracking</span>
          </div>
          
          {/* Connection Status */}
          <div className="flex items-center space-x-1">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className={`text-xs font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              {connectionStatus === 'connected' ? 'Live' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Delivery Status */}
        <div className="mb-3">
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            isDelivered ? 'bg-green-100 text-green-800' :
            isReached ? 'bg-blue-100 text-blue-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {isDelivered ? '✅ Delivered' : 
             isReached ? '📍 Driver Reached' : 
             status ? status.replace('_', ' ').toUpperCase() : 'Tracking...'}
          </div>
        </div>
        
        {/* ETA and Distance */}
        {(distance || estimatedTime) && !isDelivered && (
          <div className="space-y-1 text-xs text-gray-600">
            {distance && (
              <div className="flex justify-between">
                <span>Distance:</span>
                <span className="font-medium">{distance}</span>
              </div>
            )}
            {estimatedTime && (
              <div className="flex justify-between">
                <span>ETA:</span>
                <span className="font-medium">{estimatedTime}</span>
              </div>
            )}
          </div>
        )}
        
        {!driverLocation && !isDelivered && (
          <div className="text-xs text-gray-500 mt-2 flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            Waiting for driver location...
          </div>
        )}
      </div>

      {/* Driver Info Panel */}
      {driver && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{driver.name}</p>
              {driver.rating && (
                <div className="flex items-center text-sm text-gray-600">
                  <Star className="h-3 w-3 text-yellow-500 mr-1" />
                  {driver.rating}/5
                </div>
              )}
            </div>
          </div>
          
          {driver.vehicle && (
            <p className="text-sm text-gray-600 mb-3">
              {driver.vehicle.type} • {driver.vehicle.number}
            </p>
          )}
          
          <div className="space-y-2">
            {driver.phone && (
              <button
                onClick={callDriver}
                className="w-full flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                <Phone className="h-3 w-3 mr-1" />
                Call Driver
              </button>
            )}
            
            <button
              onClick={openGoogleMaps}
              className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
            >
              <Navigation className="h-3 w-3 mr-1" />
              Open in Maps
            </button>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
        <div className="space-y-2 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Driver Location</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>Delivery Address</span>
          </div>
          {directionsResponse && (
            <div className="flex items-center">
              <div className="w-3 h-0.5 bg-blue-500 mr-2"></div>
              <span>Route</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealTimeTrackingMap;