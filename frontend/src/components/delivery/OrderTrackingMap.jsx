import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Navigation, Phone, Clock, Package, User, Wifi, WifiOff, Truck, Route } from 'lucide-react';
import useOrderTracking from '../../hooks/useOrderTracking';

const OrderTrackingMap = ({ orderId, deliveryAddress, initialDriverLocation, initialDriver }) => {
  const [map, setMap] = useState(null);
  const [directionsService, setDirectionsService] = useState(null);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [driverMarker, setDriverMarker] = useState(null);
  const [customerMarker, setCustomerMarker] = useState(null);
  const [distance, setDistance] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const mapRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Use real-time tracking hook
  const {
    trackingData,
    loading: trackingLoading,
    error: trackingError,
    driverLocation,
    estimatedTime: hookEstimatedTime,
    status,
    timeline,
    connectionStatus
  } = useOrderTracking(orderId);

  // Use real-time data if available, fallback to initial props
  const currentDriverLocation = driverLocation || initialDriverLocation;
  const currentDriver = trackingData?.driver || initialDriver;

  // Initialize Google Maps
  useEffect(() => {
    const initGoogleMaps = () => {
      if (window.google && window.google.maps) {
        setIsLoaded(true);
        initializeMap();
      } else {
        loadGoogleMaps();
      }
    };

    // Small delay to ensure component is mounted
    const timer = setTimeout(initGoogleMaps, 100);
    return () => clearTimeout(timer);
  }, []);

  // Update driver location when it changes
  useEffect(() => {
    if (map && currentDriverLocation && driverMarker) {
      updateDriverPosition(currentDriverLocation);
    }
  }, [currentDriverLocation, map, driverMarker]);

  const loadGoogleMaps = () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    // Check if API key is available
    if (!apiKey) {
      console.error('Google Maps API key not found');
      setIsLoaded(false);
      setLoadError(true);
      return;
    }

    // Check if script is already loaded or loading
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      initializeMap();
      return;
    }

    // Check if script is already in DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        setIsLoaded(true);
        initializeMap();
      });
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsLoaded(true);
      setTimeout(initializeMap, 100); // Small delay to ensure API is fully loaded
    };
    script.onerror = () => {
      console.error('Failed to load Google Maps API');
      setIsLoaded(false);
      setLoadError(true);
    };
    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!mapRef.current) {
      console.warn('Map container not ready');
      return;
    }
    
    if (!window.google || !window.google.maps || !window.google.maps.Map) {
      console.warn('Google Maps API not ready');
      setTimeout(initializeMap, 500); // Retry after a short delay
      return;
    }

    try {
      // Default center (you can set this to user's city or a general location)
      const defaultCenter = { lat: 22.763813, lng: 75.885822 }; // Service area coordinates

      // Enhanced map styles for better visual appeal
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

      // Create map with enhanced styling
      const mapInstance = new window.google.maps.Map(mapRef.current, {
        zoom: 13,
        center: defaultCenter,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        styles: mapStyles,
        backgroundColor: '#f8fafc'
      });

      // Initialize directions service and renderer with enhanced path styling
      const directionsServiceInstance = new window.google.maps.DirectionsService();
      const directionsRendererInstance = new window.google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#00B14F',
          strokeWeight: 6,
          strokeOpacity: 0.9,
          zIndex: 1000,
          icons: [{
            icon: {
              path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 3,
              strokeColor: '#00B14F'
            },
            offset: '50%',
            repeat: '100px'
          }]
        }
      });

      directionsRendererInstance.setMap(mapInstance);

      setMap(mapInstance);
      setDirectionsService(directionsServiceInstance);
      setDirectionsRenderer(directionsRendererInstance);

      // Add delivery address marker
      if (deliveryAddress?.coordinates?.lat && deliveryAddress?.coordinates?.lng) {
        addCustomerMarker(mapInstance, deliveryAddress.coordinates);
      }

      // Add driver marker if location is available
      if (currentDriverLocation?.lat && currentDriverLocation?.lng) {
        addDriverMarker(mapInstance, currentDriverLocation);
        calculateRoute(directionsServiceInstance, directionsRendererInstance);
      }
      
      console.log('Google Maps initialized successfully');
    } catch (error) {
      console.error('Error initializing Google Maps:', error);
      setLoadError(true);
      setIsLoaded(false);
    }
  };

  const addCustomerMarker = (mapInstance, coordinates) => {
    const marker = new window.google.maps.Marker({
      position: { lat: coordinates.lat, lng: coordinates.lng },
      map: mapInstance,
      title: 'Delivery Location',
      icon: {
        url: 'data:image/svg+xml,' + encodeURIComponent(`
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.3"/>
              </filter>
            </defs>
            <circle cx="20" cy="20" r="18" fill="#10B981" stroke="#ffffff" stroke-width="3" filter="url(#shadow)"/>
            <path d="M20 10L26 18L20 26L14 18Z" fill="white"/>
            <circle cx="20" cy="32" r="3" fill="white"/>
            <circle cx="20" cy="20" r="2" fill="#10B981"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 20)
      }
    });

    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 12px; max-width: 250px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="display: flex; align-items: center; margin-bottom: 8px;">
            <div style="width: 24px; height: 24px; background: #10B981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 8px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <h3 style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">Delivery Address</h3>
          </div>
          <div style="color: #6B7280; font-size: 14px; line-height: 1.4;">
            <p style="margin: 0 0 4px 0; font-weight: 500;">${deliveryAddress.street || 'Your delivery location'}</p>
            <p style="margin: 0;">${deliveryAddress.city}, ${deliveryAddress.state}</p>
          </div>
        </div>
      `
    });

    marker.addListener('click', () => {
      infoWindow.open(mapInstance, marker);
    });

    setCustomerMarker(marker);
  };

  const addDriverMarker = (mapInstance, location) => {
    const marker = new window.google.maps.Marker({
      position: { lat: location.lat, lng: location.lng },
      map: mapInstance,
      title: currentDriver?.name || 'Delivery Partner',
      icon: {
        url: 'data:image/svg+xml,' + encodeURIComponent(`
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <filter id="driverShadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.3"/>
              </filter>
            </defs>
            <circle cx="20" cy="20" r="18" fill="#3B82F6" stroke="#ffffff" stroke-width="3" filter="url(#driverShadow)"/>
            <path d="M16 18H24V22H16V18Z" fill="white"/>
            <circle cx="18" cy="26" r="2" fill="white"/>
            <circle cx="22" cy="26" r="2" fill="white"/>
            <path d="M16 18L18 16H22L24 18" fill="white"/>
            <circle cx="20" cy="20" r="2" fill="#3B82F6"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(40, 40),
        anchor: new window.google.maps.Point(20, 20)
      }
    });

    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="padding: 12px; max-width: 280px; font-family: system-ui, -apple-system, sans-serif;">
          <div style="display: flex; align-items: center; margin-bottom: 12px;">
            <div style="width: 32px; height: 32px; background: #3B82F6; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 10px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <div>
              <h3 style="margin: 0; color: #111827; font-size: 16px; font-weight: 600;">${currentDriver?.name || 'Delivery Partner'}</h3>
              <p style="margin: 2px 0 0 0; color: #6B7280; font-size: 13px;">${currentDriver?.vehicle?.type || 'Vehicle'} • ${currentDriver?.vehicle?.number || 'N/A'}</p>
            </div>
          </div>
          <div style="color: #6B7280; font-size: 14px; line-height: 1.4;">
            <p style="margin: 0 0 8px 0;">
              <span style="font-weight: 500;">Rating:</span> ${currentDriver?.rating || 'N/A'} ⭐
            </p>
            ${currentDriver?.phone ? `
              <a href="tel:${currentDriver.phone}" style="display: inline-flex; align-items: center; color: #3B82F6; text-decoration: none; font-weight: 500;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 6px;">
                  <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                </svg>
                Call Driver
              </a>
            ` : '<p style="margin: 0; color: #9CA3AF;">Phone not available</p>'}
          </div>
        </div>
      `
    });

    marker.addListener('click', () => {
      infoWindow.open(mapInstance, marker);
    });

    setDriverMarker(marker);
  };

  const updateDriverPosition = (newLocation) => {
    if (driverMarker) {
      driverMarker.setPosition({ lat: newLocation.lat, lng: newLocation.lng });
      
      // Recalculate route with new driver position
      if (directionsService && directionsRenderer) {
        calculateRoute(directionsService, directionsRenderer);
      }
    }
  };

  const calculateRoute = (directionsServiceInstance, directionsRendererInstance) => {
    if (!currentDriverLocation?.lat || !deliveryAddress?.coordinates?.lat) return;

    directionsServiceInstance.route(
      {
        origin: { lat: currentDriverLocation.lat, lng: currentDriverLocation.lng },
        destination: { lat: deliveryAddress.coordinates.lat, lng: deliveryAddress.coordinates.lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
        avoidTolls: true,
        optimizeWaypoints: true
      },
      (result, status) => {
        if (status === 'OK') {
          directionsRendererInstance.setDirections(result);
          
          const route = result.routes[0];
          const leg = route.legs[0];
          
          setDistance(leg.distance.text);
          setEstimatedTime(leg.duration.text);
          
          // Fit map to show both markers with padding
          const bounds = new window.google.maps.LatLngBounds();
          bounds.extend({ lat: currentDriverLocation.lat, lng: currentDriverLocation.lng });
          bounds.extend({ lat: deliveryAddress.coordinates.lat, lng: deliveryAddress.coordinates.lng });
          map.fitBounds(bounds, { padding: 80 });
        }
      }
    );
  };

  const openInGoogleMaps = () => {
    if (deliveryAddress?.coordinates?.lat && deliveryAddress?.coordinates?.lng) {
      const destination = `${deliveryAddress.coordinates.lat},${deliveryAddress.coordinates.lng}`;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
      window.open(url, '_blank');
    }
  };

  // Create a safe copy of deliveryAddress with default coordinates if needed
  const safeDeliveryAddress = React.useMemo(() => {
    if (!deliveryAddress?.coordinates?.lat || !deliveryAddress?.coordinates?.lng) {
      return {
        ...deliveryAddress,
        coordinates: {
          lat: 22.763813,
          lng: 75.885822
        }
      };
    }
    return deliveryAddress;
  }, [deliveryAddress]);

  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-lg border border-gray-100">
      {/* Enhanced Map Header */}
      <div className="p-5 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <MapPin className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Live Tracking</h3>
              <p className="text-sm text-gray-600">Real-time delivery updates</p>
            </div>
            {/* Connection Status Indicator */}
            <div className="flex items-center space-x-2 ml-4">
              {connectionStatus === 'connected' ? (
                <div className="flex items-center space-x-1 bg-green-100 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-xs font-semibold text-green-700">Live</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 bg-red-100 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-xs font-semibold text-red-700">Offline</span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={openInGoogleMaps}
            className="flex items-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            <Navigation className="h-4 w-4 mr-2" />
            Open in Maps
          </button>
        </div>
        
        {/* Enhanced Delivery Info */}
        {(estimatedTime || distance) && (
          <div className="mt-4 flex items-center space-x-6">
            {estimatedTime && (
              <div className="flex items-center bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">ETA</p>
                  <p className="text-sm font-semibold text-gray-900">{estimatedTime}</p>
                </div>
              </div>
            )}
            {distance && (
              <div className="flex items-center bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <Route className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">Distance</p>
                  <p className="text-sm font-semibold text-gray-900">{distance}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Enhanced Map Container */}
      <div className="relative">
        <div
          ref={mapRef}
          className="w-full h-96"
          style={{ minHeight: '384px' }}
        />
        
        {/* Enhanced Driver Info Overlay */}
        {currentDriver && currentDriverLocation && (
          <div className="absolute top-4 left-4 bg-white rounded-xl shadow-xl p-4 max-w-xs border border-gray-100 backdrop-blur-sm bg-white/95">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 text-sm">{currentDriver.name}</p>
                <p className="text-xs text-gray-600">
                  {currentDriver.vehicle?.type} • {currentDriver.vehicle?.number}
                </p>
                {currentDriver.phone && (
                  <a
                    href={`tel:${currentDriver.phone}`}
                    className="inline-flex items-center text-xs text-blue-600 hover:text-blue-700 font-medium mt-1"
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Call Driver
                  </a>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Loading Overlay */}
        {!isLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
            <div className="text-center">
              {loadError ? (
                <>
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPin className="h-8 w-8 text-red-400" />
                  </div>
                  <p className="text-sm text-gray-700 font-medium">Failed to load map</p>
                  <p className="text-xs text-gray-500 mt-2 max-w-xs">
                    {!import.meta.env.VITE_GOOGLE_MAPS_API_KEY 
                      ? 'Google Maps API key not configured' 
                      : 'Unable to load Google Maps. Please check your internet connection.'}
                  </p>
                  <button 
                    onClick={() => {
                      setLoadError(false);
                      setIsLoaded(false);
                      loadGoogleMaps();
                    }}
                    className="mt-4 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md"
                  >
                    Retry
                  </button>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-sm text-gray-700 font-medium">Loading map...</p>
                  <p className="text-xs text-gray-500 mt-1">Please wait while we prepare your tracking view</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Address Info */}
      <div className="p-5 bg-gradient-to-r from-gray-50 to-gray-100 border-t">
        <div className="flex items-start space-x-4">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-md">
            <MapPin className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 text-sm">Delivery Address</p>
            <p className="text-sm text-gray-600 mt-1 leading-relaxed">
              {safeDeliveryAddress.street || 'Your delivery location'}<br />
              {safeDeliveryAddress.city}, {safeDeliveryAddress.state} {safeDeliveryAddress.pincode}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTrackingMap;