import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const useRealTimeTracking = (orderId) => {
  const [trackingData, setTrackingData] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [status, setStatus] = useState('unknown');
  const [timeline, setTimeline] = useState([]);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [driver, setDriver] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const socketRef = useRef(null);
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace('/api', '');

  useEffect(() => {
    if (!orderId) return;

    console.log('Connecting to socket server at:', backendUrl);

    // Initialize socket connection with better error handling
    socketRef.current = io(backendUrl, {
      transports: ['polling', 'websocket'],
      upgrade: true,
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 3,
      timeout: 20000,
      forceNew: true
    });

    const socket = socketRef.current;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('Connected to tracking server with socket ID:', socket.id);
      setConnectionStatus('connected');
      setError(null);
      
      // Wait a moment before joining room to ensure connection is stable
      setTimeout(() => {
        if (socket.connected) {
          socket.emit('join-tracking', orderId);
          console.log('Joined tracking room for order:', orderId);
          // Fetch initial data after joining room
          fetchInitialTrackingData();
        }
      }, 100);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from tracking server');
      setConnectionStatus('disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      setConnectionStatus('error');
      setError(`Failed to connect to tracking server: ${error.message}`);
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to tracking server after', attemptNumber, 'attempts');
      setConnectionStatus('connected');
      setError(null);
      // Rejoin tracking room after reconnection
      if (socket.connected) {
        socket.emit('join-tracking', orderId);
      }
    });

    socket.on('reconnect_error', (error) => {
      console.error('Reconnection error:', error);
      setConnectionStatus('error');
      setError('Failed to reconnect to tracking server');
    });

    socket.on('reconnect_failed', () => {
      console.error('Failed to reconnect after maximum attempts');
      setConnectionStatus('error');
      setError('Connection lost and could not be restored');
    });

    // Welcome message from server
    socket.on('welcome', (data) => {
      console.log('Server welcome message:', data);
    });

    // Tracking room join confirmation
    socket.on('tracking-joined', (data) => {
      console.log('Successfully joined tracking room:', data);
    });

    // Real-time location updates
    socket.on('location-update', (data) => {
      console.log('Location update received:', data);
      setDriverLocation(data.location);
      setEstimatedTime(data.estimatedTime);
      setDriver(data.driver);
      setConnectionStatus('connected');
    });

    // Status updates
    socket.on('status-update', (data) => {
      console.log('Status update received:', data);
      setStatus(data.status);
      setTimeline(data.timeline || []);
      setDriver(data.driver);
    });

    // Delivery status updates
    socket.on('delivery-status-update', (data) => {
      console.log('Delivery status update:', data);
      setStatus(data.status);
      setTrackingData(prev => ({
        ...prev,
        status: data.status,
        isDelivered: data.isDelivered,
        isReached: data.isReached
      }));
    });

    // Real-time driver assignment updates
    socket.on('driver-assigned', (data) => {
      console.log('Driver assigned:', data);
      setStatus(data.status);
      setDriver(data.driver);
      setTimeline(data.timeline || []);
      setDriverLocation(data.driverLocation);
      setConnectionStatus('connected');
      // Refresh tracking data to ensure consistency
      setTimeout(() => {
        fetchInitialTrackingData();
      }, 1000);
    });

    // Real-time order updates
    socket.on('order-update', (data) => {
      console.log('Order update received:', data);
      // Refresh tracking data when order is updated
      fetchInitialTrackingData();
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('Socket error:', error);
      setError(error.message);
    });

    // Notifications
    socket.on('notification', (notification) => {
      console.log('Notification received:', notification);
      // Handle notifications (could show toast, etc.)
    });

    // Don't fetch initial data here - wait for socket connection

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        console.log('Cleaning up socket connection');
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [orderId, backendUrl]);

  const fetchInitialTrackingData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${backendUrl}/api/delivery-tracking/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Initial tracking data received:', data);
        console.log('Driver location from API:', data.driverLocation);
        console.log('Delivery address from API:', data.deliveryAddress);
        
        setTrackingData(data);
        setStatus(data.status);
        setTimeline(data.timeline || []);
        // Use actual driver location if available, otherwise use mock for testing
        const mockDriverLocation = { lat: 22.7150, lng: 75.8580 }; // Palasia area, Indore
        setDriverLocation(data.driverLocation || mockDriverLocation);
        setDriver(data.driver);
        setEstimatedTime(data.estimatedDeliveryTime);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to fetch tracking data');
      }
    } catch (error) {
      console.error('Error fetching initial tracking data:', error);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Manual refresh function
  const refreshTracking = () => {
    fetchInitialTrackingData();
  };

  // Get current tracking status info
  const getStatusInfo = () => {
    const statusMap = {
      'order_placed': { color: 'blue', text: 'Order Placed', icon: '📋' },
      'payment_confirmed': { color: 'green', text: 'Payment Confirmed', icon: '💳' },
      'preparing': { color: 'yellow', text: 'Preparing', icon: '👨‍🍳' },
      'ready_for_pickup': { color: 'orange', text: 'Ready for Pickup', icon: '📦' },
      'assigned': { color: 'purple', text: 'Driver Assigned', icon: '🚗' },
      'picked_up': { color: 'blue', text: 'Picked Up', icon: '📦' },
      'out_for_delivery': { color: 'orange', text: 'Out for Delivery', icon: '🚚' },
      'reached': { color: 'green', text: 'Driver Reached', icon: '📍' },
      'delivered': { color: 'green', text: 'Delivered', icon: '✅' },
      'cancelled': { color: 'red', text: 'Cancelled', icon: '❌' }
    };

    return statusMap[status] || { color: 'gray', text: 'Unknown', icon: '❓' };
  };

  // Calculate progress percentage
  const getProgressPercentage = () => {
    const statusFlow = [
      'order_placed',
      'payment_confirmed', 
      'preparing',
      'ready_for_pickup',
      'assigned',
      'picked_up',
      'out_for_delivery',
      'reached',
      'delivered'
    ];
    
    const currentIndex = statusFlow.indexOf(status);
    return currentIndex >= 0 ? ((currentIndex + 1) / statusFlow.length) * 100 : 0;
  };

  return {
    // Data
    trackingData,
    driverLocation,
    status,
    timeline,
    estimatedTime,
    driver,
    
    // Status
    loading,
    error,
    connectionStatus,
    
    // Computed values
    statusInfo: getStatusInfo(),
    progressPercentage: getProgressPercentage(),
    isConnected: connectionStatus === 'connected',
    isDelivered: status === 'delivered',
    isReached: status === 'reached' || status === 'delivered',
    
    // Functions
    refreshTracking,
    
    // Socket reference for advanced usage
    socket: socketRef.current
  };
};

export default useRealTimeTracking;