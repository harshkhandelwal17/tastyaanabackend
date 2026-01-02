import React, { useState, useEffect, useRef } from 'react';
import { 
  Navigation, 
  MapPin, 
  Phone, 
  User, 
  Clock, 
  Package,
  CheckCircle,
  Target,
  Truck
} from 'lucide-react';
import io from 'socket.io-client';

const CustomDriverMap = ({ order, onStatusUpdate, onLocationUpdate, className = "" }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [socket, setSocket] = useState(null);
  const [watchId, setWatchId] = useState(null);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  
  const mapRef = useRef(null);
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace('/api', '');

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io(backendUrl, {
      transports: ['polling', 'websocket'],
      forceNew: true
    });

    socketInstance.on('connect', () => {
      console.log('Driver connected to socket');
      const driverId = localStorage.getItem('driverId');
      if (driverId) {
        socketInstance.emit('driver-connect', { driverId });
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [backendUrl]);

  // Start location tracking
  const startTracking = () => {
    if (navigator.geolocation) {
      const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000
      };

      const id = navigator.geolocation.watchPosition(
        (position) => {
          const newLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            heading: position.coords.heading,
            speed: position.coords.speed
          };
          
          setCurrentLocation(newLocation);
          
          // Send location update to server via socket
          if (socket && order?._id) {
            socket.emit('driver-location-update', {
              orderId: order._id,
              ...newLocation
            });
          }
          
          // Calculate distance and ETA
          if (order?.deliveryAddress?.coordinates) {
            const dist = calculateDistance(
              newLocation.lat,
              newLocation.lng,
              order.deliveryAddress.coordinates.lat,
              order.deliveryAddress.coordinates.lng
            );
            setDistance(dist);
            setEta(Math.ceil(dist * 2)); // Rough ETA: 2 minutes per km
          }
          
          if (onLocationUpdate) {
            onLocationUpdate(newLocation);
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
        },
        options
      );
      
      setWatchId(id);
      setIsTracking(true);
    }
  };

  // Stop location tracking
  const stopTracking = () => {
    if (watchId) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setIsTracking(false);
  };

  // Calculate distance between two points (Haversine formula)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Update order status
  const updateStatus = (newStatus) => {
    if (socket && order?._id) {
      socket.emit('status-update', {
        orderId: order._id,
        status: newStatus,
        description: getStatusDescription(newStatus)
      });
    }
    
    if (onStatusUpdate) {
      onStatusUpdate(newStatus);
    }
  };

  const getStatusDescription = (status) => {
    const descriptions = {
      'picked_up': 'Order has been picked up and is on the way',
      'out_for_delivery': 'Order is out for delivery',
      'reached': 'Driver has reached the delivery location',
      'delivered': 'Order has been delivered successfully'
    };
    return descriptions[status] || status;
  };

  // Custom map component using CSS and positioning
  const CustomMapView = () => (
    <div className="relative bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-6 min-h-64">
      {/* Map background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" className="absolute inset-0">
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#6b7280" strokeWidth="1"/>
          </pattern>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Driver location */}
      {currentLocation && (
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="relative">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
              You
            </div>
          </div>
        </div>
      )}

      {/* Destination */}
      {order?.deliveryAddress && (
        <div className="absolute bottom-1/3 right-1/3 transform translate-x-1/2 translate-y-1/2">
          <div className="relative">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
              <MapPin className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
              Destination
            </div>
          </div>
        </div>
      )}

      {/* Route line */}
      {currentLocation && order?.deliveryAddress && (
        <svg className="absolute inset-0 pointer-events-none">
          <line 
            x1="50%" 
            y1="33%" 
            x2="66%" 
            y2="66%" 
            stroke="#00B14F" 
            strokeWidth="3" 
            strokeDasharray="5,5"
            className="animate-pulse"
          />
        </svg>
      )}

      {/* Distance and ETA overlay */}
      {distance && (
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-lg">
          <div className="flex items-center space-x-2 text-sm">
            <Navigation className="w-4 h-4 text-blue-600" />
            <span className="font-medium">{distance.toFixed(1)} km</span>
          </div>
          {eta && (
            <div className="flex items-center space-x-2 text-sm mt-1">
              <Clock className="w-4 h-4 text-green-600" />
              <span className="text-gray-600">~{eta} min</span>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className={`bg-white rounded-xl shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Delivery Navigation</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
            <span className="text-sm text-gray-600">
              {isTracking ? 'Tracking' : 'Not tracking'}
            </span>
          </div>
        </div>
      </div>

      {/* Custom Map */}
      <div className="p-4">
        <CustomMapView />
      </div>

      {/* Order Details */}
      {order && (
        <div className="p-4 border-t bg-gray-50">
          <div className="space-y-3">
            {/* Customer Info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Customer</p>
                  <p className="text-sm text-gray-600">{order.userContactNo || 'Contact info'}</p>
                </div>
              </div>
              {order.userContactNo && (
                <a 
                  href={`tel:${order.userContactNo}`}
                  className="flex items-center px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Call
                </a>
              )}
            </div>

            {/* Delivery Address */}
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mt-1">
                <MapPin className="w-5 h-5 text-red-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Delivery Address</p>
                <p className="text-sm text-gray-600">
                  {order.deliveryAddress?.street}, {order.deliveryAddress?.city}
                </p>
                {order.deliveryAddress?.pincode && (
                  <p className="text-sm text-gray-500">{order.deliveryAddress.pincode}</p>
                )}
              </div>
              <button
                onClick={() => {
                  const address = `${order.deliveryAddress?.street}, ${order.deliveryAddress?.city}`;
                  window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`, '_blank');
                }}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Navigation className="w-4 h-4 mr-2" />
                Navigate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="p-4 border-t">
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={isTracking ? stopTracking : startTracking}
            className={`flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
              isTracking 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            <Target className="w-4 h-4 mr-2" />
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </button>
          
          <div className="relative">
            <select
              onChange={(e) => updateStatus(e.target.value)}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-medium appearance-none cursor-pointer hover:bg-blue-700 transition-colors"
              defaultValue=""
            >
              <option value="" disabled>Update Status</option>
              <option value="picked_up">Picked Up</option>
              <option value="out_for_delivery">Out for Delivery</option>
              <option value="reached">Reached</option>
              <option value="delivered">Delivered</option>
            </select>
            <Package className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomDriverMap;