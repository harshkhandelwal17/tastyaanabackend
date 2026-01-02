import { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';

const useOrderTracking = (orderId) => {
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [status, setStatus] = useState(null);
  const [timeline, setTimeline] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!orderId) return;

    const initializeTracking = async () => {
      try {
        setLoading(true);
        
        // Fetch initial tracking data
        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/delivery-tracking/${orderId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          setTrackingData(data);
          setStatus(data.status);
          setTimeline(data.timeline || []);
          setDriverLocation(data.driverLocation);
          setEstimatedTime(data.estimatedDeliveryTime);
        } else {
          setError('Failed to fetch tracking data');
        }

        // Initialize Socket.IO connection
        const socket = io(import.meta.env.VITE_BACKEND_URL, {
          transports: ['websocket', 'polling'],
          timeout: 20000,
          forceNew: true
        });

        socketRef.current = socket;

        // Authenticate user and join tracking room for this order
        const userId = localStorage.getItem('userId');
        if (userId) {
          socket.emit('user-connect', { userId });
        }
        socket.emit('join-tracking', orderId);

        // Listen for real-time location updates
        socket.on('location-update', (data) => {
          console.log('Location update received:', data);
          setDriverLocation(data.location);
          
          // Update tracking data with new location
          setTrackingData(prev => prev ? {
            ...prev,
            driverLocation: data.location
          } : null);
        });

        // Listen for status updates
        socket.on('status-update', (data) => {
          console.log('Status update received:', data);
          setStatus(data.status);
          setTimeline(data.timeline || []);
          
          // Update tracking data
          setTrackingData(prev => prev ? {
            ...prev,
            status: data.status,
            timeline: data.timeline
          } : null);
        });

        // Listen for ETA updates
        socket.on('eta-update', (data) => {
          console.log('ETA update received:', data);
          setEstimatedTime(data.estimatedTime);
          
          // Update tracking data
          setTrackingData(prev => prev ? {
            ...prev,
            estimatedDeliveryTime: data.estimatedTime
          } : null);
        });

        // Listen for notifications
        socket.on('notification', (data) => {
          console.log('Notification received:', data);
          
          // You can show toast notifications here
          if (data.type === 'status-change') {
            // Show notification toast if you have a toast library
            console.log(`Order Update: ${data.description}`);
          }
        });

        // Handle connection events
        socket.on('connect', () => {
          console.log('Connected to tracking server');
          setError(null);
        });

        socket.on('disconnect', () => {
          console.log('Disconnected from tracking server');
          setError('Connection lost. Attempting to reconnect...');
        });

        socket.on('connect_error', (err) => {
          console.error('Socket connection error:', err);
          setError('Failed to connect to tracking server');
        });

        socket.on('error', (err) => {
          console.error('Socket error:', err);
          setError(err.message || 'Tracking error occurred');
        });

      } catch (err) {
        console.error('Error initializing tracking:', err);
        setError('Failed to initialize tracking');
      } finally {
        setLoading(false);
      }
    };

    initializeTracking();

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [orderId]);

  // Function to manually refresh tracking data
  const refreshTracking = async () => {
    if (!orderId) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/delivery-tracking/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTrackingData(data);
        setStatus(data.status);
        setTimeline(data.timeline || []);
        setDriverLocation(data.driverLocation);
        setEstimatedTime(data.estimatedDeliveryTime);
      }
    } catch (err) {
      console.error('Error refreshing tracking:', err);
    }
  };

  // Function to get connection status
  const getConnectionStatus = () => {
    if (!socketRef.current) return 'disconnected';
    return socketRef.current.connected ? 'connected' : 'disconnected';
  };

  return {
    trackingData,
    loading,
    error,
    driverLocation,
    estimatedTime,
    status,
    timeline,
    refreshTracking,
    connectionStatus: getConnectionStatus(),
    socket: socketRef.current
  };
};

export default useOrderTracking;