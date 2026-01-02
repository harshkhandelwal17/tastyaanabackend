import React, { useState, useEffect, useCallback } from 'react';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { MapPin, Truck, Navigation, Clock } from 'lucide-react';
import { DirectionsRenderer } from '@react-google-maps/api';

const DeliveryMap = ({ deliveryLocation, driverLocation, orderId }) => {
  const [map, setMap] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null); 
  const [showDriverInfo, setShowDriverInfo] = useState(false);
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);

  const mapCenter = driverLocation || deliveryLocation || { lat: 28.6139, lng: 77.2090 }; // Default to Delhi
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Calculate route between driver and delivery location
  const calculateRoute = useCallback(async () => {
    if (!driverLocation || !deliveryLocation || !window.google) return;

    const directionsService = new window.google.maps.DirectionsService();
    
    try {
      const result = await directionsService.route({
        origin: driverLocation,
        destination: deliveryLocation,
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
  }, [driverLocation, deliveryLocation]);

  useEffect(() => {
    if (driverLocation && deliveryLocation) {
      calculateRoute();
    }
  }, [calculateRoute]);

  // Auto-center map when locations change
  useEffect(() => {
    if (map && (driverLocation || deliveryLocation)) {
      const bounds = new window.google.maps.LatLngBounds();
      
      if (driverLocation) {
        bounds.extend(driverLocation);
      }
      if (deliveryLocation) {
        bounds.extend(deliveryLocation);
      }
      
      map.fitBounds(bounds, { padding: 50 });
    }
  }, [map, driverLocation, deliveryLocation]);

  const handleMapLoad = useCallback((mapInstance) => {
    setMap(mapInstance);
  }, []);

  if (!apiKey) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Google Maps API key not configured</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
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
                      <path d="M12 20L16 16L20 20L28 12" stroke="white" stroke-width="2" fill="none"/>
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
                  <div className="p-2">
                    <div className="flex items-center mb-2">
                      <Truck className="h-4 w-4 text-green-600 mr-2" />
                      <span className="font-semibold">Delivery Driver</span>
                    </div>
                    <p className="text-sm text-gray-600">Current Location</p>
                    {distance && duration && (
                      <div className="mt-2 text-xs text-gray-500">
                        <p>Distance: {distance}</p>
                        <p>ETA: {duration}</p>
                      </div>
                    )}
                  </div>
                </InfoWindow>
              )}
            </>
          )}

          {/* Delivery Location Marker */}
          {deliveryLocation && (
            <>
              <Marker
                position={deliveryLocation}
                onClick={() => setShowDeliveryInfo(true)}
                icon={{
                  url: 'data:image/svg+xml;base64,' + btoa(`
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="20" cy="20" r="18" fill="#EF4444" stroke="white" stroke-width="4"/>
                      <path d="M20 10L20 30M10 20L30 20" stroke="white" stroke-width="2"/>
                    </svg>
                  `),
                  scaledSize: new window.google.maps.Size(40, 40),
                  anchor: new window.google.maps.Point(20, 40)
                }}
              />
              
              {showDeliveryInfo && (
                <InfoWindow
                  position={deliveryLocation}
                  onCloseClick={() => setShowDeliveryInfo(false)}
                >
                  <div className="p-2">
                    <div className="flex items-center mb-2">
                      <MapPin className="h-4 w-4 text-red-600 mr-2" />
                      <span className="font-semibold">Delivery Address</span>
                    </div>
                    <p className="text-sm text-gray-600">Your order destination</p>
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

      {/* Map Controls Overlay */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md p-3 max-w-xs">
        <div className="flex items-center mb-2">
          <Navigation className="h-4 w-4 text-blue-600 mr-2" />
          <span className="font-semibold text-sm">Live Tracking</span>
        </div>
        
        {distance && duration && (
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Distance:</span>
              <span className="font-medium">{distance}</span>
            </div>
            <div className="flex justify-between">
              <span>ETA:</span>
              <span className="font-medium">{duration}</span>
            </div>
          </div>
        )}
        
        {!driverLocation && (
          <div className="text-xs text-gray-500 mt-2">
            <Clock className="h-3 w-3 inline mr-1" />
            Waiting for driver location...
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3">
        <div className="space-y-2 text-xs">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
            <span>Driver Location</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
            <span>Delivery Address</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-0.5 bg-blue-500 mr-2"></div>
            <span>Route</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryMap;
