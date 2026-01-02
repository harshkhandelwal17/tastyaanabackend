// import React, { useState, useEffect, useRef, useCallback } from 'react';
// import io from 'socket.io-client';
// import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
// import { 
//   Navigation, 
//   MapPin, 
//   Phone, 
//   User, 
//   Clock, 
//   Package,
//   CheckCircle,
//   AlertCircle,
//   Route,
//   Target
// } from 'lucide-react';

// const DriverMap = ({ order, onStatusUpdate, onLocationUpdate, className = "" }) => {
//   const [currentLocation, setCurrentLocation] = useState(null);
//   const [isTracking, setIsTracking] = useState(false);
//   const [distance, setDistance] = useState(null);
//   const [duration, setDuration] = useState(null);
//   const [watchId, setWatchId] = useState(null);
//   const [connectionStatus, setConnectionStatus] = useState('offline');
//   const [socket, setSocket] = useState(null);
  
//   const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;


//   // Setup socket connection for real-time location updates
//   useEffect(() => {
//     const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace('/api', '');
//     const driverId = localStorage.getItem('driverId');
//     if (!driverId) return;

//     console.log('Connecting to socket server:', backendUrl);

//     const socketInstance = io(backendUrl, {
//       transports: ['websocket', 'polling'],
//       forceNew: true,
//       reconnection: true,
//       reconnectionAttempts: 5,
//       reconnectionDelay: 1000
//     });

//     socketInstance.on('connect', () => {
//       console.log('Socket connected successfully');
//       setConnectionStatus('online');
//       socketInstance.emit('driver-connect', { 
//         driverId,
//         orderId: order?._id
//       });
//     });

//     socketInstance.on('driver-connected', (response) => {
//       console.log('Driver connection acknowledged:', response);
//     });

//     socketInstance.on('disconnect', () => {
//       console.log('Socket disconnected');
//       setConnectionStatus('offline');
//     });

//     socketInstance.on('error', (error) => {
//       console.error('Socket error:', error);
//     });

//     socketInstance.on('connect_error', (error) => {
//       console.error('Socket connection error:', error);
//     });

//     setSocket(socketInstance);

//     return () => {
//       if (socketInstance) {
//         socketInstance.disconnect();
//       }
//     };
//   }, [order?._id]);

//   // Get current location and start tracking
//   useEffect(() => {
//     if (navigator.geolocation) {
//       // Get initial position
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const location = {
//             lat: position.coords.latitude,
//             lng: position.coords.longitude
//           };
//           setCurrentLocation(location);
          
//           if (onLocationUpdate) {
//             onLocationUpdate(location);
//           }
//         },
//         (error) => {
//           console.error('Error getting current location:', error);
//         },
//         { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
//       );
//     }
//   }, [onLocationUpdate]);

//   // Start location tracking
//   const startTracking = useCallback(() => {
//     if (!navigator.geolocation || !order) return;

//     setIsTracking(true);
    
//     const id = navigator.geolocation.watchPosition(
//       (position) => {
//         const location = {
//           lat: position.coords.latitude,
//           lng: position.coords.longitude,
//           heading: position.coords.heading,
//           speed: position.coords.speed
//         };
        
//         setCurrentLocation(location);
//         if (onLocationUpdate) {
//           onLocationUpdate(location);
//         }
        
//         // Emit location to backend for real-time tracking
//         if (socket && socket.connected && order?._id) {
//           console.log('Emitting location update:', location);
//           socket.emit('driver-location-update', {
//             orderId: order._id,
//             lat: location.lat,
//             lng: location.lng,
//             heading: location.heading,
//             speed: location.speed,
//             timestamp: new Date().toISOString()
//           });
//         } else {
//           console.log('Socket status:', {
//             exists: !!socket,
//             connected: socket?.connected,
//             orderId: order?._id
//           });
//         }
//       },
//       (error) => {
//         console.error('Error tracking location:', error);
//         // Retry on error after a short delay
//         setTimeout(startTracking, 3000);
//       },
//       { 
//         enableHighAccuracy: true, 
//         timeout: 30000, // Increased timeout
//         maximumAge: 10000, // Reduced maximum age for more frequent updates
//         distanceFilter: 10 // Update when moved 10 meters
//       }
//     );
    
//     setWatchId(id);
//   }, [order, onLocationUpdate]);

//   // Auto-start tracking when order is ready
//   useEffect(() => {
//     if (order && !isTracking) {
//       startTracking();
//     }
//   }, [order, isTracking, startTracking]);

//   // Stop location tracking
//   const stopTracking = useCallback(() => {
//     setIsTracking(false);
    
//     if (watchId) {
//       navigator.geolocation.clearWatch(watchId);
//       setWatchId(null);
//     }
//   }, [watchId]);

//   const updateOrderStatus = (status, description) => {
//     // Always call the parent callback even without socket
//     if (onStatusUpdate) {
//       onStatusUpdate(status, description);
//     }
//   };

//   const markAsReached = () => {
//     updateOrderStatus('reached', 'Driver has reached your location');
//   };

//   const confirmDelivery = () => {
//     updateOrderStatus('delivered', 'Order has been delivered successfully');
//   };

//   const openInGoogleMaps = () => {
//     if (order?.deliveryAddress?.coordinates) {
//       const destination = `${order.deliveryAddress.coordinates.lat},${order.deliveryAddress.coordinates.lng}`;
//       const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
//       window.open(url, '_blank');
//     }
//   };

//   const callCustomer = () => {
//     if (order?.userContactNo) {
//       window.open(`tel:${order.userContactNo}`);
//     }
//   };

//   if (!apiKey) {
//     return (
//       <div className={`h-full flex items-center justify-center bg-gray-100 ${className}`}>
//         <div className="text-center">
//           <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//           <p className="text-gray-600">Google Maps API key not configured</p>
//         </div>
//       </div>
//     );
//   }

//   if (!order) {
//     return (
//       <div className={`h-full flex items-center justify-center bg-gray-100 ${className}`}>
//         <div className="text-center">
//           <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//           <p className="text-gray-600">No active order</p>
//           <p className="text-xs text-gray-500 mt-2">Map ready for navigation</p>
//         </div>
//       </div>
//     );
//   }

//   // Reference for Directions Services
//   const directionsServiceRef = useRef(null);
//   const directionsRendererRef = useRef(null);
//   const destinationRef = useRef(null);

//   // Initialize directions service when map loads
//   // useEffect(() => {
//   //   if (window.google) {
//   //     directionsServiceRef.current = new window.google.maps.DirectionsService();
//   //     directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
//   //       suppressMarkers: true,
//   //       polylineOptions: {
//   //         strokeColor: '#FFC107', // Yellow route line
//   //         strokeWeight: 6,
//   //         strokeOpacity: 0.8
//   //       }
//   //     });
//   //   }
//   // }, []);

//   // Calculate route when location changes
//   useEffect(() => {
//     const calculateRoute = async () => {
//       if (!currentLocation || !order?.deliveryAddress?.coordinates || !isGoogleMapsLoaded) {
//         console.log('Missing required data for route calculation:', {
//           hasLocation: !!currentLocation,
//           hasDeliveryCoords: !!order?.deliveryAddress?.coordinates,
//           isGoogleMapsLoaded
//         });
//         return;
//       }

//       if (!directionsServiceRef.current || !directionsRendererRef.current) {
//         console.log('Waiting for directions service initialization...');
//         return;
//       }

//       const destination = {
//         lat: Number(order.deliveryAddress.coordinates.lat),
//         lng: Number(order.deliveryAddress.coordinates.lng)
//       };
      
//       console.log('Calculating route from', currentLocation, 'to', destination);
//       destinationRef.current = destination;

//       try {
//         const request = {
//           origin: currentLocation,
//           destination: destination,
//           travelMode: window.google.maps.TravelMode.DRIVING,
//           optimizeWaypoints: true,
//           avoidHighways: false,
//           avoidTolls: false
//         };

//         const result = await new Promise((resolve, reject) => {
//           directionsServiceRef.current.route(request, (result, status) => {
//             if (status === 'OK') {
//               console.log('Route calculation successful');
//               resolve(result);
//             } else {
//               console.error('Route calculation failed with status:', status);
//               reject(new Error(status));
//             }
//           });
//         });

//         if (directionsRendererRef.current && mapRef.current) {
//           directionsRendererRef.current.setMap(mapRef.current);
//           directionsRendererRef.current.setDirections(result);
//           const route = result.routes[0];
//           const leg = route.legs[0];
//           setDistance(leg.distance.text);
//           setDuration(leg.duration.text);
//           console.log('Route displayed successfully');
//         } else {
//           console.error('DirectionsRenderer or map reference not available');
//         }
//       } catch (error) {
//         console.error('Error calculating route:', error);
//       }
//     };

//     calculateRoute();
//   }, [currentLocation, order]);

//   // State for Google Maps loading
//   const [mapsLoaded, setMapsLoaded] = useState(false);

//   // Load Google Maps script
//   useEffect(() => {
//     if (!window.google && apiKey) {
//       const script = document.createElement('script');
//       script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
//       script.async = true;
//       script.onload = () => {
//         console.log('Google Maps loaded successfully');
//         setMapsLoaded(true);
//       };
//       script.onerror = (err) => {
//         console.error('Error loading Google Maps:', err);
//       };
//       document.head.appendChild(script);
//     } else if (window.google) {
//       setMapsLoaded(true);
//     }
//   }, [apiKey]);

//   // Initialize directions service when maps are loaded
//   useEffect(() => {
//     if (mapsLoaded && window.google?.maps) {
//       console.log('Initializing directions service');
//       try {
//         directionsServiceRef.current = new window.google.maps.DirectionsService();
//         directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
//           suppressMarkers: true,
//           polylineOptions: {
//             strokeColor: '#FFC107',
//             strokeWeight: 6,
//             strokeOpacity: 0.8
//           }
//         });
//       } catch (error) {
//         console.error('Error initializing directions:', error);
//       }
//     }
//   }, [mapsLoaded]);

//   const mapCenter = currentLocation || 
//     (order?.deliveryAddress?.coordinates && 
//      !isNaN(Number(order.deliveryAddress.coordinates.lat)) && 
//      !isNaN(Number(order.deliveryAddress.coordinates.lng)) ? {
//       lat: Number(order.deliveryAddress.coordinates.lat),
//       lng: Number(order.deliveryAddress.coordinates.lng)
//     } : null) || 
//     { lat: 22.7196, lng: 75.8577 }; // Default to Indore center

//   // Attach directions renderer to map when component mounts
//   const onMapLoad = useCallback((map) => {
//     if (directionsRendererRef.current) {
//       directionsRendererRef.current.setMap(map);
//     }
//   }, []);

//   return (
//     <div className={`h-full relative ${className}`}>
//       <APIProvider apiKey={apiKey}>
//         <Map
//           defaultCenter={mapCenter}
//           defaultZoom={15}
//           mapId="driver-delivery-map"
//           onLoad={onMapLoad}
//           options={{
//             disableDefaultUI: false,
//             zoomControl: true,
//             mapTypeControl: false,
//             scaleControl: true,
//             streetViewControl: false,
//             rotateControl: false,
//             fullscreenControl: true
//           }}
//         >
//           {/* Current Location Marker - Bike Icon */}
//           {currentLocation && 
//            typeof currentLocation.lat === 'number' && 
//            typeof currentLocation.lng === 'number' &&
//            !isNaN(currentLocation.lat) && 
//            !isNaN(currentLocation.lng) && (
//             <Marker
//               position={{
//                 lat: Number(currentLocation.lat),
//                 lng: Number(currentLocation.lng)
//               }}
//               icon={{
//                 url: 'data:image/svg+xml;base64,' + btoa(`
//                   <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
//                     <circle cx="20" cy="20" r="18" fill="#3B82F6" stroke="white" stroke-width="4"/>
//                     <g transform="translate(10, 10)">
//                       <path d="M4 12L4 8L8 8L8 6L6 6L6 4L14 4L14 6L12 6L12 8L16 8L16 12L14 12L14 10L10 10L10 12L4 12Z" fill="white"/>
//                       <circle cx="6" cy="14" r="2" fill="white"/>
//                       <circle cx="14" cy="14" r="2" fill="white"/>
//                     </g>
//                   </svg>
//                 `),
//                 scaledSize: { width: 40, height: 40 },
//                 anchor: { x: 20, y: 20 }  
//               }}
//             />
//           )}

//           {/* Delivery Location Marker */}
//           {order?.deliveryAddress?.coordinates && 
//            order.deliveryAddress.coordinates.lat !== undefined && 
//            order.deliveryAddress.coordinates.lng !== undefined &&
//            !isNaN(Number(order.deliveryAddress.coordinates.lat)) && 
//            !isNaN(Number(order.deliveryAddress.coordinates.lng)) && (
//             <Marker
//               position={{
//                 lat: Number(order.deliveryAddress.coordinates.lat),
//                 lng: Number(order.deliveryAddress.coordinates.lng)
//               }}
//               icon={{
//                 url: 'data:image/svg+xml;base64,' + btoa(`
//                   <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
//                     <path d="M20 2C13.3726 2 8 7.3726 8 14C8 20.6274 20 36 20 36C20 36 32 20.6274 32 14C32 7.3726 26.6274 2 20 2Z" fill="#EF4444" stroke="white" stroke-width="2"/>
//                     <circle cx="20" cy="14" r="6" fill="white"/>
//                     <circle cx="20" cy="14" r="3" fill="#EF4444"/>
//                   </svg>
//                 `),
//                 scaledSize: { width: 40, height: 40 },
//                 anchor: { x: 20, y: 40 }  
//               }}
//             />
//           )}

//         </Map>
//       </APIProvider>

//       {/* Control Panel */}
//       <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
//         <div className="flex items-center justify-between mb-3">
//           <h3 className="font-medium text-gray-900">Navigation</h3>
//           <div className="flex items-center space-x-2">
//             <div className={`w-2 h-2 rounded-full ${
//               connectionStatus === 'offline' ? 'bg-blue-500' : 'bg-gray-300'
//             }`}></div>
//             <div className={`w-2 h-2 rounded-full ${isTracking ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`}></div>
//           </div>
//         </div>
        
//         <div className="text-xs text-gray-500 mb-2">
//           Mode: {connectionStatus === 'offline' ? 'Offline' : connectionStatus} | GPS: {isTracking ? 'Active' : 'Inactive'}
//         </div>

//         {distance && duration && (
//           <div className="space-y-1 text-sm text-gray-600 mb-3">
//             <div className="flex justify-between">
//               <span>Distance:</span>
//               <span className="font-medium text-gray-900">{distance}</span>
//             </div>
//             <div className="flex justify-between">
//               <span>ETA:</span>
//               <span className="font-medium text-gray-900">{duration}</span>
//             </div>
//           </div>
//         )}

//         <div className="space-y-2">
//           {!isTracking ? (
//             <button
//               onClick={startTracking}
//               className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
//             >
//               <Target className="h-4 w-4 mr-1" />
//               Start Tracking
//             </button>
//           ) : (
//             <button
//               onClick={stopTracking}
//               className="w-full flex items-center justify-center px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors"
//             >
//               <AlertCircle className="h-4 w-4 mr-1" />
//               Stop Tracking
//             </button>
//           )}

//           <button
//             onClick={openInGoogleMaps}
//             className="w-full flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
//           >
//             <Navigation className="h-4 w-4 mr-1" />
//             Open in Maps
//           </button>
//         </div>
//       </div>

//       {/* Order Info Panel */}
//       <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-xs">
//         <h3 className="font-medium text-gray-900 mb-3">Order #{order.orderNumber}</h3>
        
//         <div className="space-y-2 text-sm">
//           <div className="flex justify-between">
//             <span className="text-gray-600">Amount:</span>
//             <span className="font-medium text-gray-900">₹{order.totalAmount}</span>
//           </div>
//           <div className="flex justify-between">
//             <span className="text-gray-600">Items:</span>
//             <span className="font-medium text-gray-900">{order.items?.length}</span>
//           </div>
//           <div className="flex justify-between">
//             <span className="text-gray-600">Payment:</span>
//             <span className={`font-medium ${order.paymentStatus === 'paid' ? 'text-green-600' : 'text-orange-600'}`}>
//               {order.paymentStatus}
//             </span>
//           </div>
//         </div>

//         <div className="mt-3 pt-3 border-t">
//           <p className="text-xs text-gray-600 mb-2">Customer:</p>
//           <p className="text-sm font-medium text-gray-900">{order.userContactNo}</p>
//         </div>

//         <div className="mt-3 pt-3 border-t">
//           <p className="text-xs text-gray-600 mb-2">Delivery Address:</p>
//           <p className="text-sm font-medium text-gray-900">{order.deliveryAddress?.street}</p>
//           <p className="text-sm text-gray-600">
//             {order.deliveryAddress?.city}, {order.deliveryAddress?.state}
//           </p>
//         </div>

//         <div className="space-y-2 mt-4">
//           {order.userContactNo && (
//             <button
//               onClick={callCustomer}
//               className="w-full flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
//             >
//               <Phone className="h-4 w-4 mr-1" />
//               Call Customer
//             </button>
//           )}

//           {order.status !== 'reached' && order.status !== 'delivered' && (
//             <button
//               onClick={markAsReached}
//               className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
//             >
//               <MapPin className="h-4 w-4 mr-1" />
//               Mark as Reached
//             </button>
//           )}

//           {(order.status === 'reached' || order.status === 'out_for_delivery') && order.status !== 'delivered' && (
//             <button
//               onClick={confirmDelivery}
//               className="w-full flex items-center justify-center px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
//             >
//               <CheckCircle className="h-4 w-4 mr-1" />
//               Confirm Delivery
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Legend */}
//       <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3">
//         <div className="space-y-2 text-xs text-gray-700">
//           <div className="flex items-center">
//             <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
//             <span className="font-medium">Driver Location</span>
//           </div>
//           <div className="flex items-center">
//             <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
//             <span className="font-medium">Delivery Address</span>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DriverMap;


import React, { useState, useEffect, useRef, useCallback } from 'react';
import useDriverSocket from '../../hooks/useDriverSocket';
import { 
  Navigation, 
  MapPin, 
  Phone, 
  User, 
  Clock, 
  Package,
  CheckCircle,
  AlertCircle,
  Target,
  Wifi,
  WifiOff
} from 'lucide-react';
import { getCurrentDriverId } from '../../utils/driverUtils';

const DriverMap = ({ order, onStatusUpdate, onLocationUpdate, className = "" }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [distance, setDistance] = useState(null);
  const [duration, setDuration] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [locationUpdateCount, setLocationUpdateCount] = useState(0);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [isBackground, setIsBackground] = useState(false);
  const [serviceWorker, setServiceWorker] = useState(null);
  const [backgroundTrackingActive, setBackgroundTrackingActive] = useState(false);
  
  // No in-app map/directions
  const destinationRef = useRef(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  
  // Initialize driver ID dynamically
  const initializeDriverId = useCallback(() => {
    const driverId = getCurrentDriverId();
    if (driverId) {
      // console.log('DriverMap: Using dynamic driverId:', driverId);
    } else {
      console.warn('DriverMap: No driver ID found - user may not be logged in as driver');
    }
    return driverId;
  }, []);

  const driverId = initializeDriverId();
  
  // Debug logging
  console.log('DriverMap: orderId:', order?._id, 'driverId:', driverId);
  
  // Use the socket hook
  const { socket, connectionStatus, emitLocation, testConnection, isConnected, isTabVisible: socketTabVisible, isBackground: socketBackground } = useDriverSocket(order?._id, driverId);

  // No in-app Google Map; consider maps loaded
  useEffect(() => { setMapsLoaded(true); }, []);

  // Initialize service worker for background tracking
  useEffect(() => {
    const initializeServiceWorker = async () => {
      if ('serviceWorker' in navigator) {
        try {
          console.log('🚗 DriverMap: Initializing service worker...');
          
          const registration = await navigator.serviceWorker.register('/driver-sw.js');
          console.log('🚗 DriverMap: Service worker registered:', registration);
          
          setServiceWorker(registration);
          
          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
          
          // Check if service worker is active
          if (registration.active) {
            console.log('🚗 DriverMap: Service worker is active');
          }
          
        } catch (error) {
          console.error('🚗 DriverMap: Service worker registration failed:', error);
        }
      } else {
        console.log('🚗 DriverMap: Service worker not supported');
      }
    };

    initializeServiceWorker();

    return () => {
      navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
    };
  }, []);

  // Handle service worker messages
  const handleServiceWorkerMessage = useCallback((event) => {
    const { type, data } = event.data;
    
    switch (type) {
      case 'SERVICE_WORKER_HEARTBEAT':
        console.log('💓 DriverMap: Service worker heartbeat received');
        // Keep connection alive
        if (socket && isConnected) {
          emitLocation(currentLocation);
        }
        break;
        
      case 'SERVICE_WORKER_LOCATION_REQUEST':
        console.log('📍 DriverMap: Service worker requesting location update');
        // Force location update
        updateLocation();
        break;
        
      case 'SERVICE_WORKER_LOCATION_UPDATE':
        console.log('📍 DriverMap: Service worker location update:', data);
        // Handle cached location update
        if (data.location) {
          setCurrentLocation(data.location);
          emitLocation(data.location);
        }
        break;
        
      case 'SERVICE_WORKER_SYNC_LOCATION':
        console.log('🔄 DriverMap: Service worker syncing location data');
        // Sync cached location data
        if (data.location) {
          setCurrentLocation(data.location);
          emitLocation(data.location);
        }
        break;
        
      default:
        console.log('🚗 DriverMap: Unknown service worker message:', type);
    }
  }, [socket, isConnected, currentLocation, emitLocation]);

  // Page visibility handling
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsTabVisible(isVisible);
      setIsBackground(!isVisible);
      
      console.log('🔍 DriverMap: Tab visibility changed:', isVisible ? 'visible' : 'background');
      
      if (isVisible) {
        // Tab became visible - resume full tracking
        console.log('🔄 DriverMap: Tab became visible, resuming full tracking...');
        resumeFullTracking();
      } else {
        // Tab went to background - activate background tracking
        console.log('⏸️ DriverMap: Tab went to background, activating background tracking...');
        activateBackgroundTracking();
      }
    };

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also listen for page focus/blur events
    window.addEventListener('focus', () => {
      setIsTabVisible(true);
      setIsBackground(false);
      resumeFullTracking();
    });
    
    window.addEventListener('blur', () => {
      setIsTabVisible(false);
      setIsBackground(true);
      activateBackgroundTracking();
    });
    
    // Check initial state
    setIsTabVisible(!document.hidden);
    setIsBackground(document.hidden);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', () => {
        setIsTabVisible(true);
        setIsBackground(false);
        resumeFullTracking();
      });
      window.removeEventListener('blur', () => {
        setIsTabVisible(false);
        setIsBackground(true);
        activateBackgroundTracking();
      });
    };
  }, []);

  // Activate background tracking
  const activateBackgroundTracking = useCallback(() => {
    console.log('⏸️ DriverMap: Activating background tracking...');
    
    if (serviceWorker && serviceWorker.active) {
      // Notify service worker to start background tracking
      serviceWorker.active.postMessage({
        type: 'START_BACKGROUND_TRACKING',
        data: {
          orderId: order?._id,
          driverId: driverId,
          currentLocation: currentLocation
        }
      });
      
      setBackgroundTrackingActive(true);
      console.log('⏸️ DriverMap: Background tracking activated');
    }
  }, [serviceWorker, order?._id, driverId, currentLocation]);

  // Resume full tracking
  const resumeFullTracking = useCallback(() => {
    console.log('🔄 DriverMap: Resuming full tracking...');
    
    if (serviceWorker && serviceWorker.active) {
      // Notify service worker to stop background tracking
      serviceWorker.active.postMessage({
        type: 'STOP_BACKGROUND_TRACKING'
      });
      
      setBackgroundTrackingActive(false);
      console.log('🔄 DriverMap: Full tracking resumed');
    }
    
    // Force immediate location update
    updateLocation();
  }, [serviceWorker]);

  // Request location permission explicitly
  const requestLocationPermission = useCallback(async () => {
    if (!navigator.geolocation) {
      alert('❌ Location services not supported by your browser');
      return false;
    }

    try {
      // Check if we have permission
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      console.log('📍 Location permission status:', permission.state);
      
      if (permission.state === 'denied') {
        alert('❌ Location access denied. Please enable location in your browser settings and refresh the page.');
        return false;
      }
      
      if (permission.state === 'prompt') {
        alert('📍 Please allow location access when prompted to enable real-time tracking.');
      }
      
      return true;
    } catch (error) {
      console.log('📍 Permission API not supported, proceeding with geolocation...');
      return true;
    }
  }, []);

  // Update location function
  const updateLocation = useCallback(() => {
    if (navigator.geolocation && currentLocation) {
      console.log('📍 DriverMap: Updating location...');
      
      // Emit location update
      if (emitLocation && currentLocation) {
        emitLocation({
          lat: currentLocation.lat,
          lng: currentLocation.lng,
          accuracy: currentLocation.accuracy || 10,
          timestamp: new Date().toISOString()
        });
        
        // Notify service worker about location update
        if (serviceWorker && serviceWorker.active) {
          serviceWorker.active.postMessage({
            type: 'UPDATE_LOCATION',
            data: {
              orderId: order?._id,
              driverId: driverId,
              location: currentLocation
            }
          });
        }
      }
    }
  }, [currentLocation, emitLocation, serviceWorker, order?._id, driverId]);

  // Get current location and start tracking
  useEffect(() => {
    if (navigator.geolocation) {
      console.log('📍 Getting initial location...');
      
      // Request permission first
      requestLocationPermission().then(hasPermission => {
        if (!hasPermission) return;
        
        // Force high accuracy location with longer timeout
        const options = {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: 0 // Force fresh location
        };
        
        // Get initial position
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              accuracy: position.coords.accuracy,
              timestamp: new Date().toISOString()
            };
            
            console.log('📍 Initial location obtained:', location);
            setCurrentLocation(location);
            
            // Start watching for location changes
            startLocationTracking();
          },
          (error) => {
            console.error('📍 Error getting initial location:', error);
            alert(`❌ Location error: ${error.message}`);
          },
          options
        );
      });
    }
  }, [requestLocationPermission]);

  // Start location tracking
  const startLocationTracking = useCallback(() => {
    if (!navigator.geolocation || watchId) return;
    
    console.log('📍 Starting location tracking...');
    
    const options = {
      enableHighAccuracy: true,
      timeout: 30000,
      maximumAge: 10000 // Allow some caching for better performance
    };
    
    const newWatchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };
        
        console.log('📍 Location update received:', location);
        setCurrentLocation(location);
        setLocationUpdateCount(prev => prev + 1);
        
        // Emit location update if connected
        if (emitLocation && isConnected) {
          emitLocation(location);
        }
        
        // Notify service worker about location update
        if (serviceWorker && serviceWorker.active) {
          serviceWorker.active.postMessage({
            type: 'UPDATE_LOCATION',
            data: {
              orderId: order?._id,
              driverId: driverId,
              location: location
            }
          });
        }
        
        // Call parent callback if provided
        if (onLocationUpdate) {
          onLocationUpdate(location);
        }
      },
      (error) => {
        console.error('📍 Location tracking error:', error);
      },
      options
    );
    
    setWatchId(newWatchId);
    setIsTracking(true);
    console.log('📍 Location tracking started with ID:', newWatchId);
  }, [watchId, emitLocation, isConnected, serviceWorker, order?._id, driverId, onLocationUpdate]);

  // Cleanup location tracking
  useEffect(() => {
    return () => {
      if (watchId) {
        console.log('📍 Cleaning up location tracking...');
        navigator.geolocation.clearWatch(watchId);
        setWatchId(null);
        setIsTracking(false);
      }
    };
  }, [watchId]);

  // Sync with socket hook tab visibility
  useEffect(() => {
    setIsTabVisible(socketTabVisible);
    setIsBackground(socketBackground);
  }, [socketTabVisible, socketBackground]);

  // Background tracking status indicator
  const getTrackingStatus = () => {
    if (isBackground && backgroundTrackingActive) {
      return { status: 'background', icon: WifiOff, color: 'text-yellow-600', text: 'Background Tracking' };
    } else if (isTracking && isConnected) {
      return { status: 'active', icon: Wifi, color: 'text-green-600', text: 'Live Tracking' };
    } else if (isTracking) {
      return { status: 'tracking', icon: WifiOff, color: 'text-orange-600', text: 'Tracking (Offline)' };
    } else {
      return { status: 'inactive', icon: WifiOff, color: 'text-red-600', text: 'Tracking Inactive' };
    }
  };

  const trackingStatus = getTrackingStatus();
  const StatusIcon = trackingStatus.icon;

  // No in-app route calculation
  const calculateRoute = useCallback(async () => { return; }, []);

  useEffect(() => { /* buyer map handles directions */ }, [currentLocation, order?.deliveryAddress, mapsLoaded, calculateRoute]);

  // Start location tracking with better socket handling
  const startTracking = useCallback(() => {
    if (!navigator.geolocation || !order) {
      console.log('❌ Cannot start tracking: missing geolocation or order');
      return;
    }

    if (!isConnected) {
      console.log('❌ Cannot start tracking: socket not connected. Status:', connectionStatus);
      return;
    }

    console.log('🚀 Starting navigation and real-time tracking...');
    setIsTracking(true);

    // Open external Google Maps for navigation
    if (order?.deliveryAddress?.coordinates) {
      const destination = `${order.deliveryAddress.coordinates.lat},${order.deliveryAddress.coordinates.lng}`;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
      window.open(url, '_blank');
    }
    
    // More aggressive location tracking options
    const trackingOptions = { 
      enableHighAccuracy: true, 
      timeout: 30000,
      maximumAge: 0, // Always get fresh location
      distanceFilter: 5 // Update every 5 meters instead of 10
    };
    
    const id = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          heading: position.coords.heading,
          speed: position.coords.speed,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        
        console.log('📍 Location update received:', location);
        setCurrentLocation(location);
        setLocationUpdateCount(prev => prev + 1);
        
        if (onLocationUpdate) {
          onLocationUpdate(location);
        }
        
        // Emit location to backend for real-time tracking
        if (isConnected && socket) {
        const emitSuccess = emitLocation(location);
          if (emitSuccess) {
            console.log('✅ Location emitted to server successfully');
          } else {
            console.log('❌ Failed to emit location update');
          }
        } else {
          console.log('⚠️ Cannot emit location - socket not connected');
        }
      },
      (error) => {
        console.error('❌ Error tracking location:', error);
        // Retry on error after a short delay
        setTimeout(() => {
          if (isTracking) { // Only retry if still supposed to be tracking
            console.log('🔄 Retrying location tracking...');
            startTracking();
          }
        }, 3000);
      },
      trackingOptions
    );
    
    setWatchId(id);
    console.log('✅ Location tracking started with ID:', id);
  }, [order, onLocationUpdate, socket, isTracking, emitLocation, isConnected, connectionStatus]);

  // Auto-start tracking when order is ready and socket is connected
  useEffect(() => {
    if (order && !isTracking && isConnected) {
      console.log('Auto-starting tracking for order:', order._id, 'Socket connected:', isConnected);
      startTracking();
    }
  }, [order, isTracking, startTracking, isConnected]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    console.log('Stopping location tracking');
    setIsTracking(false);
    
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
  }, [watchId]);

  const updateOrderStatus = (status, description) => {
    console.log('Updating order status:', status, description);
    if (onStatusUpdate) {
      onStatusUpdate(status, description);
    }
  };

  const markAsReached = () => {
    updateOrderStatus('reached', 'Driver has reached your location');
  };

  const confirmDelivery = () => {
    updateOrderStatus('delivered', 'Order has been delivered successfully');
  };

  const openInGoogleMaps = () => {
    if (order?.deliveryAddress?.coordinates) {
      const destination = `${order.deliveryAddress.coordinates.lat},${order.deliveryAddress.coordinates.lng}`;
      const url = `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
      window.open(url, '_blank');
    }
  };

  const callCustomer = () => {
    if (order?.userContactNo) {
      window.open(`tel:${order.userContactNo}`);
    }
  };

  // No dependency on API key

  if (!order) {
    return (
      <div className={`h-full flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No active order</p>
          <p className="text-xs text-gray-500 mt-2">Map ready for navigation</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-6 ${className}`}>
      {/* Header with tracking status */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Navigation className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Driver Navigation</h3>
            <p className="text-sm text-gray-600">Real-time location tracking</p>
          </div>
        </div>
        
        {/* Tracking Status Indicator */}
        <div className="flex items-center space-x-2">
          <div className={`flex items-center space-x-2 px-3 py-2 rounded-full border ${
            trackingStatus.status === 'active' ? 'bg-green-50 border-green-200' :
            trackingStatus.status === 'background' ? 'bg-yellow-50 border-yellow-200' :
            trackingStatus.status === 'tracking' ? 'bg-orange-50 border-orange-200' :
            'bg-red-50 border-red-200'
          }`}>
            <StatusIcon className={`h-4 w-4 ${trackingStatus.color}`} />
            <span className={`text-sm font-medium ${trackingStatus.color}`}>
              {trackingStatus.text}
            </span>
          </div>
          
          {/* Connection Status */}
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
            isConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span>{isConnected ? 'Connected' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* Order Information */}
      {order && (
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <Package className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Order #{order.orderNumber}</h4>
                <p className="text-sm text-gray-600">
                  {order.items?.length || 0} items • ₹{order.totalAmount}
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-600">Location Updates</div>
              <div className="text-lg font-semibold text-blue-600">{locationUpdateCount}</div>
            </div>
          </div>
        </div>
      )}

      {/* Location Information */}
      {currentLocation && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <MapPin className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Current Location</h4>
                <p className="text-sm text-gray-600">
                  {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </p>
                {currentLocation.accuracy && (
                  <p className="text-xs text-gray-500">
                    Accuracy: ±{Math.round(currentLocation.accuracy)}m
                  </p>
                )}
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-sm text-gray-600">Last Update</div>
              <div className="text-xs text-gray-500">
                {new Date(currentLocation.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col space-y-3">
        {!isTracking ? (
          <button
            onClick={startLocationTracking}
            disabled={!navigator.geolocation || !order}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {!navigator.geolocation ? 'Location Not Supported' : 
             !order ? 'No Order Selected' : 'Start Location Tracking'}
          </button>
        ) : (
          <div className="space-y-3">
            <button
              onClick={() => {
                if (watchId) {
                  navigator.geolocation.clearWatch(watchId);
                  setWatchId(null);
                  setIsTracking(false);
                }
              }}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              Stop Tracking
            </button>
            
            <button
              onClick={updateLocation}
              disabled={!currentLocation}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              Update Location Now
            </button>
          </div>
        )}
        
        {/* Background Mode Info */}
        {isBackground && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex items-center space-x-2">
              <WifiOff className="h-4 w-4 text-yellow-600" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Background Mode Active</p>
                <p className="text-xs">Location tracking continues in background tab</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Connection Status */}
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Socket Status:</span>
            <span className={`font-medium ${
              connectionStatus === 'online' ? 'text-green-600' : 
              connectionStatus === 'offline' ? 'text-red-600' : 
              'text-yellow-600'
            }`}>
              {connectionStatus}
            </span>
          </div>
          
          {isBackground && (
            <div className="mt-2 text-xs text-gray-500">
              Background tracking: {backgroundTrackingActive ? 'Active' : 'Inactive'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverMap;