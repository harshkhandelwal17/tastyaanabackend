import { useEffect, useState, useCallback } from 'react';
import io from 'socket.io-client';
import { useToast } from './useToast';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export const useDriverAssignmentSocket = (userId, orderId = null) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [assignedDriver, setAssignedDriver] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [assignmentStatus, setAssignmentStatus] = useState('pending');
  const { showToast } = useToast();

  const connectSocket = useCallback(() => {
    if (!userId) return;

    console.log('🔌 Connecting to driver assignment socket...');
    
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Driver assignment socket connected');
      setIsConnected(true);
      
      // Join user-specific room for real-time updates
      newSocket.emit('user-connect', { userId });
      
      // Join tracking room if orderId is provided
      if (orderId) {
        newSocket.emit('join-tracking', orderId);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Driver assignment socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Driver assignment socket connection error:', error);
      setIsConnected(false);
    });

    // Real-time driver assignment event
    newSocket.on('driver-assigned-realtime', (data) => {
      console.log('🚗 Driver assigned in real-time:', data);
      
      setAssignedDriver(data.driver);
      setAssignmentStatus('assigned');
      setDriverLocation(data.driver.currentLocation);
      
      // Show toast notification
      showToast({
        type: 'success',
        title: 'Driver Assigned!',
        message: data.message || `${data.driver.name} has been assigned to your order`,
        duration: 5000
      });

      // Play notification sound (optional)
      if (typeof window !== 'undefined' && window.Audio) {
        try {
          const audio = new Audio('/notification.mp3');
          audio.volume = 0.3;
          audio.play().catch(e => console.log('Could not play notification sound'));
        } catch (e) {
          console.log('Notification sound not available');
        }
      }

      // Show browser notification if permission granted
      if (typeof window !== 'undefined' && window.Notification && Notification.permission === 'granted') {
        new Notification('Driver Assigned', {
          body: data.message || `${data.driver.name} has been assigned to your order`,
          icon: '/favicon.ico',
          tag: `driver-assignment-${data.orderId}`,
          requireInteraction: true
        });
      }
    });

    // Legacy driver assignment event (for backward compatibility)
    newSocket.on('driver-assigned', (data) => {
      console.log('🚗 Driver assigned (legacy):', data);
      
      if (data.driver) {
        setAssignedDriver(data.driver);
        setAssignmentStatus('assigned');
        setDriverLocation(data.driverLocation);
      }
    });

    // Driver location updates
    newSocket.on('location-update', (data) => {
      console.log('📍 Driver location update:', data);
      
      if (data.location) {
        setDriverLocation(data.location);
      }
    });

    // Status updates
    newSocket.on('status-update', (data) => {
      console.log('📦 Order status update:', data);
      
      if (data.status) {
        setAssignmentStatus(data.status);
      }
    });

    // Error handling
    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
      showToast({
        type: 'error',
        title: 'Connection Error',
        message: error.message || 'Failed to connect to real-time updates',
        duration: 3000
      });
    });

    return newSocket;
  }, [userId, orderId, showToast]);

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = connectSocket();

    // Request notification permission on mount
    if (typeof window !== 'undefined' && window.Notification && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        console.log('Notification permission:', permission);
      });
    }

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [connectSocket]);

  // Update orderId and join tracking room
  useEffect(() => {
    if (socket && isConnected && orderId) {
      socket.emit('join-tracking', orderId);
      console.log(`📡 Joined tracking room for order: ${orderId}`);
    }
  }, [socket, isConnected, orderId]);

  // Manual reconnection function
  const reconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
    }
    const newSocket = connectSocket();
    setSocket(newSocket);
  }, [connectSocket, socket]);

  // Clear driver assignment (useful when order is completed or cancelled)
  const clearAssignment = useCallback(() => {
    setAssignedDriver(null);
    setDriverLocation(null);
    setAssignmentStatus('pending');
  }, []);

  return {
    socket,
    isConnected,
    assignedDriver,
    deliveryPartner,
    driverLocation,
    assignmentStatus,
    reconnect,
    clearAssignment,
    
    // Helper functions
    hasDriverAssigned: !!deliveryPartner||!!assignedDriver,
    driverName: deliveryPartner?.name|| assignedDriver?.name,
    driverPhone: deliveryPartner?.phone || assignedDriver?.phone,
    driverRating: deliveryPartner?.rating  || assignedDriver?.rating  ,
    driverVehicle: deliveryPartner?.vehicle ||assignedDriver?.vehicle,
  };
};

export default useDriverAssignmentSocket;