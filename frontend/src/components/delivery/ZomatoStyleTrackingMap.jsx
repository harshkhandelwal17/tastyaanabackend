import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps';
import { 
  MapPin, 
  Truck, 
  Phone, 
  User, 
  Wifi, 
  WifiOff,
  Star,
  CheckCircle,
  Package
} from 'lucide-react';
import useDriverSocket from '../../hooks/useDriverSocket';
import io from 'socket.io-client';
import { useSelector } from 'react-redux';

const  ZomatoStyleTrackingMap = ({ 
  orderId, 
  deliveryAddress, 
  driverLocation, 
  driver, 
  estimatedTime, 
  status, 
  isConnected = true,
  orderItems = [],
  deliveredAt = null,
  orderTotal = null
}) => {
  const [map, setMap] = useState(null);
  const [showDriverInfo, setShowDriverInfo] = useState(false);
  const [showDeliveryInfo, setShowDeliveryInfo] = useState(false);
  const [mapCenter, setMapCenter] = useState({ lat: 22.7196, lng: 75.8577 }); // Indore city center

  // Socket connection for real-time updates
  const [realTimeDriverLocation, setRealTimeDriverLocation] = useState(driverLocation);
  const [initialBoundsSet, setInitialBoundsSet] = useState(false);
  
  // Geocoding state for delivery address
  const [geocodedDeliveryAddress, setGeocodedDeliveryAddress] = useState(null);
  
  // Real-time driver assignment state
  const [realTimeDriver, setRealTimeDriver] = useState(driver);
  const [realTimeStatus, setRealTimeStatus] = useState(status);
  const [socket, setSocket] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [assignmentNotification, setAssignmentNotification] = useState(null);
  // Get user from Redux store
  const { user } = useSelector(state => state.auth);
  
  // Refs
  const driverRef = useRef(null);
  const deliveryRef = useRef(null);
  const driverIdRef = useRef(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

  // Google Maps is loaded via APIProvider
  const isGoogleMapsLoaded = true;
  console.log("Google Maps loaded via APIProvider")
  // Check if order is completed (delivered or cancelled) - only show summary
  const isOrderCompleted = status === 'delivered' || status === 'cancelled';

  // Order Summary Component for completed orders
  const OrderSummaryView = () => (
    <div className="w-full bg-white rounded-lg shadow-lg border border-gray-200 p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              status === 'delivered' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {status === 'delivered' ? (
                <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                <Package className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {status === 'delivered' ? 'Order Delivered' : 'Order Cancelled'}
              </h2>
              <p className="text-sm text-gray-600">Order #{orderId?.slice(-8) || 'N/A'}</p>
            </div>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${
            status === 'delivered' 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {status === 'delivered' ? 'Delivered' : 'Cancelled'}
          </div>
        </div>
      </div>

      {/* Delivery Information */}
      {status === 'delivered' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Delivery Details</h3>
          
          {/* Delivery Time */}
          {deliveredAt && (
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Delivered on</p>
                <p className="text-sm text-gray-600">
                  {new Date(deliveredAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          )}

          {/* Delivery Boy */}
          {driver && (
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <User className="h-5 w-5 text-gray-600" />
              <div>
                <p className="text-sm font-medium text-gray-700">Delivered by</p>
                <div className="flex items-center space-x-2">
                  <p className="text-sm text-gray-600">{realTimeDriver?.name || driver?.name}</p>
                  {(realTimeDriver?.rating || driver?.rating) && (
                    <div className="flex items-center space-x-1">
                      <Star className="h-3 w-3 text-yellow-400 fill-current" />
                      <span className="text-xs text-gray-500">{realTimeDriver?.rating || driver?.rating}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Delivery Address */}
          {deliveryAddress && (
            <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
              <MapPin className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-700">Delivery Address</p>
                <p className="text-sm text-gray-600">
                  {deliveryAddress.street}
                  {deliveryAddress.city && `, ${deliveryAddress.city}`}
                  {deliveryAddress.state && `, ${deliveryAddress.state}`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order Items */}
      {orderItems && orderItems.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Order Summary</h3>
          <div className="space-y-3">
            {orderItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">{item.name || item.menuItem?.name}</p>
                    <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                    {item.customizations && item.customizations.length > 0 && (
                      <p className="text-xs text-gray-500">
                        {item.customizations.join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-800">₹{item.price || item.totalPrice}</p>
                </div>
              </div>
            ))}
          </div>
          
          {/* Order Total */}
          {orderTotal && (
            <div className="border-t border-gray-200 pt-3">
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold text-gray-800">Total Amount</p>
                <p className="text-lg font-bold text-gray-800">₹{orderTotal}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
  
  // Initialize driver ID if not set (for testing/demo purposes)
  useEffect(() => {
    if (!driverIdRef.current) {
      let driverId = localStorage.getItem('driverId');
      if (!driverId) {
        driverId = '689f994a6c1f27d9f79c68d2'; // Test Driver from database
        localStorage.setItem('driverId', driverId);
        console.log('ZomatoStyleTrackingMap: Set test driverId:', driverId);
      }
      driverIdRef.current = driverId;
    }
  }, []);
  
  // Use shared socket hook for consistency

  // Normalize coordinates helper function
  const normalizeCoords = (coords) => {
    if (!coords || coords.lat == null || coords.lng == null) return null;
    const lat = typeof coords.lat === 'string' ? parseFloat(coords.lat) : coords.lat;
    const lng = typeof coords.lng === 'string' ? parseFloat(coords.lng) : coords.lng;
    if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
    return { lat, lng };
  };

  // Priority: realTimeDriverLocation > driverLocation
  const safeDriverLocation = normalizeCoords(realTimeDriverLocation) || normalizeCoords(driverLocation) || null;
  const safeDeliveryAddress = normalizeCoords(deliveryAddress?.coordinates) || normalizeCoords(geocodedDeliveryAddress) || null;

  // Debug logging
  useEffect(() => {
    if (driverIdRef.current) {
      console.log('ZomatoStyleTrackingMap: orderId:', orderId, 'driverId:', driverIdRef.current);
    }
  }, [orderId]);

  // Geocode delivery address if coordinates missing
  const geocodeDeliveryAddress = async (address) => {
    if (!address || !address.street || geocodedDeliveryAddress) return;
    
    try {
      const fullAddress = `${address.street}, ${address.city || 'Indore'}, ${address.state || 'Madhya Pradesh'}, India`;
      console.log('Geocoding delivery address:', fullAddress);
      
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`
      );
      
      const data = await response.json();
      
      if (data.status === 'OK' && data.results[0]) {
        const location = data.results[0].geometry.location;
        const coordinates = { lat: location.lat, lng: location.lng };
        console.log('Geocoded delivery coordinates:', coordinates);
        setGeocodedDeliveryAddress(coordinates);
      } else {
        console.error('Geocoding failed:', data.status);
      }
    } catch (error) {
      console.error('Error geocoding delivery address:', error);
    }
  };

  // Geocode delivery address on mount
  useEffect(() => {
    if (deliveryAddress && !deliveryAddress.coordinates) {
      geocodeDeliveryAddress(deliveryAddress);
    }
  }, [deliveryAddress, apiKey]);

  // Set initial map bounds when both locations are available
  useEffect(() => {
    if (map && safeDriverLocation && safeDeliveryAddress && !initialBoundsSet) {
      try {
        // Use map.fitBounds with LatLngBounds equivalent
        const bounds = {
          north: Math.max(safeDriverLocation.lat, safeDeliveryAddress.lat) + 0.01,
          south: Math.min(safeDriverLocation.lat, safeDeliveryAddress.lat) - 0.01,
          east: Math.max(safeDriverLocation.lng, safeDeliveryAddress.lng) + 0.01,
          west: Math.min(safeDriverLocation.lng, safeDeliveryAddress.lng) - 0.01
        };
        
        map.fitBounds(bounds, { padding: 100 });
        setInitialBoundsSet(true);
        console.log('✅ ZomatoStyleTracking: Initial bounds set');
      } catch (error) {
        console.error('Error setting initial bounds:', error);
      }
    }
  }, [map, safeDriverLocation, safeDeliveryAddress, initialBoundsSet]);

  // Handle real-time location updates from socket
  const handleLocationUpdate = (data) => {
    console.log('📍 ZomatoStyleTracking: Location update received:', data);
    if (data.driverId === driverIdRef.current && data.coordinates) {
      const newLocation = normalizeCoords(data.coordinates);
      if (newLocation) {
        console.log('🚛 ZomatoStyleTracking: Updating driver location:', newLocation);
        setRealTimeDriverLocation(newLocation);
      }
    }
  };

  const handleDriverLocationUpdate = (data) => {
    console.log('📍 ZomatoStyleTracking: Driver location update received:', data);
    if (data.coordinates) {
      const newLocation = normalizeCoords(data.coordinates);
      if (newLocation) {
        console.log('🚛 ZomatoStyleTracking: Updating driver location:', newLocation);
        setRealTimeDriverLocation(newLocation);
      }
    }
  };

  // Real-time driver assignment socket connection
  useEffect(() => {
    if (!orderId || !user?.id) return;

    console.log('🔌 ZomatoStyleTrackingMap: Setting up real-time driver assignment for order:', orderId);
    
    const SOCKET_URL = (import.meta.env.VITE_BACKEND_URL).replace("api",'') || 'http://localhost:5000';
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 10000,
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('✅ ZomatoStyleTrackingMap: Socket connected for real-time updates');
      setSocketConnected(true);
      
      // Join user-specific room for notifications
      newSocket.emit('user-connect', { userId: user.id });
      console.log('📡 ZomatoStyleTrackingMap: Joined user room:', `user-${user.id}`);
      
      // Join tracking room for this order
      newSocket.emit('join-tracking', orderId);
      console.log('📡 ZomatoStyleTrackingMap: Joined tracking room:', `tracking-${orderId}`);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ ZomatoStyleTrackingMap: Socket disconnected');
      setSocketConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ ZomatoStyleTrackingMap: Socket connection error:', error);
      setSocketConnected(false);
    });

    // Real-time driver assignment event listener
    newSocket.on('driver-assigned-realtime', (data) => {
      console.log('🚗 ZomatoStyleTrackingMap: REAL-TIME DRIVER ASSIGNMENT RECEIVED!', data);
      
      if (data.orderId === orderId) {
        // Update driver state immediately
        setRealTimeDriver(data.driver);
        setRealTimeStatus('assigned');
        
        // Update driver location if available
        if (data.driver.currentLocation) {
          setRealTimeDriverLocation(data.driver.currentLocation);
        }
        
        // Show temporary assignment notification
        setAssignmentNotification({
          message: data.message || `${data.driver.name} has been assigned to your order`,
          driver: data.driver,
          timestamp: new Date()
        });
        
        // Hide notification after 5 seconds
        setTimeout(() => {
          setAssignmentNotification(null);
        }, 5000);
        
        console.log('✅ ZomatoStyleTrackingMap: Driver details updated in real-time');
      }
    });

    // Legacy driver assignment event (backward compatibility)
    newSocket.on('driver-assigned', (data) => {
      console.log('🚗 ZomatoStyleTrackingMap: Legacy driver assignment received:', data);
      
      if (data.orderId === orderId && data.driver) {
        setRealTimeDriver(data.driver);
        setRealTimeStatus('assigned');
        
        if (data.driverLocation) {
          setRealTimeDriverLocation(data.driverLocation);
        }
      }
    });

    // Status updates
    newSocket.on('status-update', (data) => {
      console.log('📦 ZomatoStyleTrackingMap: Status update received:', data);
      
      if (data.status) {
        setRealTimeStatus(data.status);
      }
      
      if (data.driver) {
        setRealTimeDriver(data.driver);
      }
    });

    // Location updates
    newSocket.on('location-update', handleLocationUpdate);
    newSocket.on('driver-location-update', handleDriverLocationUpdate);

    return () => {
      console.log('🔌 ZomatoStyleTrackingMap: Cleaning up socket connection');
      newSocket.disconnect();
    };
  }, [orderId, user?.id]);

  // Update real-time states when props change
  useEffect(() => {
    setRealTimeDriver(driver);
    setRealTimeStatus(status);
    setRealTimeDriverLocation(driverLocation);
  }, [driver, status, driverLocation]);

  const handleStatusUpdate = (data) => {
    console.log('📊 ZomatoStyleTracking: Status update received:', data);
  };

  // Socket event listeners
  useEffect(() => {
    if (!socket) {
      console.log('❌ ZomatoStyleTracking: Socket not available');
      return;
    }

    console.log('🔌 ZomatoStyleTracking: Setting up socket listeners for location updates');
    socket.on('location-update', handleLocationUpdate);
    socket.on('driver-location-update', handleDriverLocationUpdate);
    socket.on('status-update', handleStatusUpdate);

    return () => {
      console.log('🔌 ZomatoStyleTracking: Cleaning up socket listeners');
      socket.off('location-update', handleLocationUpdate);
      socket.off('driver-location-update', handleDriverLocationUpdate);
      socket.off('status-update', handleStatusUpdate);
    };
  }, [socket, orderId]);

  // Early return for completed orders - show only summary
  if (isOrderCompleted) {
    return <OrderSummaryView />;
  }

  // Early return if API key is missing
  if (!apiKey) {
    return (
      <div className="w-full h-[400px] bg-red-50 border border-red-200 rounded-lg flex items-center justify-center">
        <p className="text-red-600">Google Maps API key is missing</p>
      </div>
    );
  }

  const mapId = "tracking-map";

  // Show loading state if Google Maps isn't loaded yet
  if (!apiKey) {
    return (
      <div className="relative w-full h-[400px] bg-gray-100 rounded-lg shadow-lg overflow-hidden border border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Google Maps API key not found</p>
        </div>
      </div>
    );
  }

  if (!isGoogleMapsLoaded) {
    return (
      <div className="relative w-full h-[400px] bg-gray-100 rounded-lg shadow-lg overflow-hidden border border-gray-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Google Maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[400px] bg-white rounded-lg shadow-lg overflow-hidden border border-gray-200">
      {/* Minimal Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-white/80 backdrop-blur-sm p-2">
        <div className="flex justify-end items-center">
          {socketConnected && (
            <div className="flex items-center space-x-1 bg-green-50 px-1.5 py-0.5 rounded-full">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600 font-light">Live</span>
            </div>
          )}
        </div>
      </div>

      {/* Simplified Status Bar */}
      <div className="absolute top-8 left-0 right-0 z-20 bg-white/70 backdrop-blur-sm px-3 py-1.5">
        <div className="flex items-center space-x-1.5 text-xs">
          <div className={`w-1.5 h-1.5 rounded-full ${
            status === 'delivered' ? 'bg-green-500' : 
            status === 'on_the_way' ? 'bg-blue-500 animate-pulse' : 
            'bg-orange-400'
          }`} />
          <span className="font-light text-gray-700 capitalize">
            {status?.replace('_', ' ') || 'Preparing'}
          </span>
        </div>
      </div>

      {/* Real-time Driver Assignment Notification */}
      {assignmentNotification && (
        <div className="absolute top-20 left-4 right-4 z-30 bg-green-500 text-white p-3 rounded-lg shadow-lg border-2 border-green-400">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl animate-bounce">🚗</span>
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">Driver Assigned!</p>
              <p className="text-xs opacity-90">{assignmentNotification.driver?.name}</p>
              <p className="text-xs opacity-75">{assignmentNotification.message}</p>
            </div>
            <button 
              onClick={() => setAssignmentNotification(null)}
              className="text-white hover:text-gray-200 text-lg font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Map Container */}
      <div className="w-full h-full pt-12">
        <APIProvider apiKey={apiKey}>
          <Map
            mapId={mapId}
            style={{ width: '100%', height: '100%' }}
            defaultCenter={mapCenter}
            defaultZoom={13}
            gestureHandling="greedy"
            disableDefaultUI={false}
            onLoad={(mapInstance) => {
              console.log('🗺️ ZomatoStyleTracking: Map loaded');
              setMap(mapInstance);
            }}
            mapTypeControl={false}
            streetViewControl={false}
            fullscreenControl={false}
            zoomControl={true}
            options={{
              styles: [
                {
                  featureType: "poi",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }]
                },
                {
                  featureType: "transit",
                  elementType: "labels",
                  stylers: [{ visibility: "off" }]
                },
                {
                  featureType: "administrative",
                  elementType: "labels.text",
                  stylers: [{ visibility: "simplified" }]
                },
                {
                  featureType: "road",
                  elementType: "labels.text",
                  stylers: [{ visibility: "simplified" }]
                },
                {
                  featureType: "road",
                  elementType: "geometry",
                  stylers: [{ color: "#f5f5f5" }]
                },
                {
                  featureType: "water",
                  elementType: "geometry",
                  stylers: [{ color: "#e0f2f1" }]
                },
                {
                  featureType: "landscape",
                  elementType: "geometry",
                  stylers: [{ color: "#fafafa" }]
                }
              ]
            }}
          >
            {/* Driver Marker */}
            {safeDriverLocation && (
              <Marker
                ref={driverRef}
                position={safeDriverLocation}
                onClick={() => setShowDriverInfo(!showDriverInfo)}
                icon={{
                  url: "data:image/svg+xml;base64," + btoa(`
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="10" cy="10" r="10" fill="#3B82F6"/>
                      <circle cx="10" cy="10" r="6" fill="white"/>
                      <circle cx="10" cy="10" r="3" fill="#3B82F6"/>
                    </svg>
                  `),
                  scaledSize: { width: 20, height: 20 },
                  anchor: { x: 10, y: 10 }
                }}
              />
            )}

            {/* Delivery Address Marker */}
            {safeDeliveryAddress && (
              <Marker
                ref={deliveryRef}
                position={safeDeliveryAddress}
                onClick={() => setShowDeliveryInfo(!showDeliveryInfo)}
                icon={{
                  url: "data:image/svg+xml;base64," + btoa(`
                    <svg width="20" height="24" viewBox="0 0 20 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 0C4.5 0 0 4.5 0 10c0 10 10 14 10 14s10-4 10-14C20 4.5 15.5 0 10 0z" fill="#EF4444"/>
                      <circle cx="10" cy="10" r="5" fill="white"/>
                      <circle cx="10" cy="10" r="2.5" fill="#EF4444"/>
                    </svg>
                  `),
                  scaledSize: { width: 20, height: 24 },
                  anchor: { x: 10, y: 24 }
                }}
              />
            )}

            {/* Driver Info Window */}
            {showDriverInfo && safeDriverLocation && (
              <InfoWindow
                position={safeDriverLocation}
                onCloseClick={() => setShowDriverInfo(false)}
              >
                <div className="p-2 max-w-xs">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{realTimeDriver?.name || 'Your Driver'}</h3>
                      <div className="flex items-center space-x-1 text-sm text-gray-600">
                        <Star className="h-3 w-3 text-yellow-400 fill-current" />
                        <span>{realTimeDriver?.rating || '4.5'}</span>
                        {realTimeDriver?.phone && (
                          <span className="ml-2 text-xs">📞 {realTimeDriver.phone}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  {realTimeDriver?.phone && (
                    <button className="w-full bg-green-500 text-white py-2 px-3 rounded-lg flex items-center justify-center space-x-2 text-sm font-medium hover:bg-green-600 transition-colors">
                      <Phone className="h-4 w-4" />
                      <span>Call Driver</span>
                    </button>
                  )}
                </div>
              </InfoWindow>
            )}

            {/* Delivery Info Window */}
            {showDeliveryInfo && safeDeliveryAddress && (
              <InfoWindow
                position={safeDeliveryAddress}
                onCloseClick={() => setShowDeliveryInfo(false)}
              >
                <div className="p-2 max-w-xs">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-red-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">Delivery Address</h3>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    {deliveryAddress?.street || 'Your delivery location'}
                    {deliveryAddress?.city && `, ${deliveryAddress.city}`}
                  </p>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>

      {/* Minimal Bottom Info */}
      <div className="absolute bottom-0 left-0 right-0 z-20 bg-white/80 backdrop-blur-sm p-2">
        <div className="flex items-center justify-center">
          <div className="flex items-center space-x-1.5">
            <div className="w-4 h-4 bg-blue-50 rounded-full flex items-center justify-center">
              <Truck className="h-2.5 w-2.5 text-blue-500" />
            </div>
            <p className="text-xs font-light text-gray-600">
              {realTimeStatus === 'assigned' && realTimeDriver?.name 
                ? `${realTimeDriver.name} is on the way` 
                : realTimeStatus === 'finding' || realTimeDriver?.name=="Finding delivery partner..."
                ? 'Finding delivery partner...'
                : 'Your driver is on the way'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZomatoStyleTrackingMap;