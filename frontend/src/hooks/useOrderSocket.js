import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

// Normalize backend URL to a socket base (strip quotes and trailing /api)
const RAW_BACKEND = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
const CLEAN_BACKEND = String(RAW_BACKEND).replace(/^['"]|['"]$/g, '');
const SOCKET_URL = CLEAN_BACKEND.replace(/\/api\/?$/, '');

export const useOrderSocket = (userId, userRole = 'user') => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [orderUpdates, setOrderUpdates] = useState([]);
  const [newOrders, setNewOrders] = useState([]);
  const [driverAssignments, setDriverAssignments] = useState([]);
  const [error, setError] = useState(null);
  
  const socketRef = useRef(null);

  useEffect(() => {
    if (!userId) return;

    // Create socket connection
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      timeout: 20000,
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('🔌 Order socket connected');
      setIsConnected(true);
      setError(null);
      
      // Join appropriate room based on user role
      if (userRole === 'admin') {
        newSocket.emit('join-admin-orders', userId);
      } else if (userRole === 'seller') {
        newSocket.emit('join-seller-orders', userId);
      } else if (userRole === 'delivery') {
        newSocket.emit('join-driver-orders', userId);
      } else {
        newSocket.emit('join-user-orders', userId);
      }

      // Also register generic user connection used by other server services
      newSocket.emit('user-connect', { userId });
    });

    newSocket.on('disconnect', () => {
      console.log('🔌 Order socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Order socket connection error:', error);
      setError('Failed to connect to order service');
      setIsConnected(false);
    });

    // Order status updates (support multiple event names)
    const pushUpdate = (orderData) => {
      if (!orderData) return;
      console.log('📦 Order status updated:', orderData);
      setOrderUpdates(prev => [...prev, orderData]);
      if (typeof window !== 'undefined' && window.Notification && Notification.permission === 'granted') {
        try {
          new Notification('Order Update', {
            body: `Order ${orderData.orderNumber || orderData.orderId} status: ${orderData.status}`,
            icon: '/favicon.ico'
          });
        } catch (_) {}
      }
    };

    newSocket.on('order-status-updated', pushUpdate);
    newSocket.on('order-update', pushUpdate);
    newSocket.on('orderUpdate', pushUpdate);
    newSocket.on('orderStatusUpdate', pushUpdate);
    newSocket.on('status-update', (data) => {
      pushUpdate({
        orderId: data?.orderId,
        status: data?.status,
        driver: data?.driver,
        timeline: data?.timeline,
        updatedAt: data?.timestamp || new Date(),
      });
    });
    // Some services emit this to `user-{userId}`; we join via user-connect
    newSocket.on('delivery-status-update', (data) => {
      pushUpdate({
        orderId: data?.orderId,
        status: data?.status,
        driver: data?.driver,
        timeline: data?.timeline,
        updatedAt: data?.timestamp || new Date(),
      });
    });

    // New order notifications
    newSocket.on('new-order-created', (orderData) => {
      console.log('🆕 New order created:', orderData);
      setNewOrders(prev => [...prev, orderData]);
      
      // Show notification for admin/seller
      if ((userRole === 'admin' || userRole === 'seller') && typeof window !== 'undefined' && window.Notification && Notification.permission === 'granted') {
        new Notification('New Order', {
          body: `New order ${orderData.orderNumber} received`,
          icon: '/favicon.ico'
        });
      }
    });

    // Driver assignment notifications (legacy)
    newSocket.on('driver-assigned', (assignmentData) => {
      console.log('🚗 Driver assigned:', assignmentData);
      setDriverAssignments(prev => [...prev, assignmentData]);
      // Also push update for UI status
      pushUpdate({
        orderId: assignmentData?.orderId,
        status: 'assigned',
        deliveryPartner: assignmentData?.driver,
        updatedAt: assignmentData?.assignedAt || new Date(),
      });
      
      // Show notification
      if (typeof window !== 'undefined' && window.Notification && Notification.permission === 'granted') {
        new Notification('Driver Assigned', {
          body: `Driver assigned to order ${assignmentData.orderNumber}`,
          icon: '/favicon.ico'
        });
      }
    });

    // Real-time driver assignment notifications (new)
    newSocket.on('driver-assigned-realtime', (assignmentData) => {
      console.log('🚗 Driver assigned in real-time:', assignmentData);
      setDriverAssignments(prev => [...prev, assignmentData]);
      // Also push update for UI status
      pushUpdate({
        orderId: assignmentData?.orderId,
        status: assignmentData?.status || 'assigned',
        deliveryPartner: assignmentData?.driver,
        updatedAt: assignmentData?.timestamp || new Date(),
      });
      
      // Show enhanced notification with driver details
      if (typeof window !== 'undefined' && window.Notification && Notification.permission === 'granted') {
        new Notification('Driver Assigned!', {
          body: assignmentData.message || `${assignmentData.driver.name} has been assigned to your order`,
          icon: '/favicon.ico',
          tag: `driver-assignment-${assignmentData.orderId}`,
          requireInteraction: true
        });
      }

      // Create a custom event for components to listen to
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('driverAssigned', {
          detail: assignmentData
        }));
      }
    });

    // Room join confirmations
    newSocket.on('user-orders-joined', (data) => {
      console.log('👤 User orders room joined:', data);
    });

    newSocket.on('admin-orders-joined', (data) => {
      console.log('👨‍💼 Admin orders room joined:', data);
    });

    newSocket.on('seller-orders-joined', (data) => {
      console.log('🏪 Seller orders room joined:', data);
    });

    newSocket.on('driver-orders-joined', (data) => {
      console.log('🚗 Driver orders room joined:', data);
    });

    // Error handling
    newSocket.on('error', (errorData) => {
      console.error('Order socket error:', errorData);
      setError(errorData.message);
    });

    // Request notification permission
    if (typeof window !== 'undefined' && window.Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      if (newSocket) {
        newSocket.disconnect();
      }
    };
  }, [userId, userRole]);

  // Function to update order status
  const updateOrderStatus = (orderId, status, driverId = null) => {
    if (socket && isConnected) {
      socket.emit('update-order-status', {
        orderId,
        status,
        userId,
        driverId
      });
    }
  };

  // Function to assign driver
  const assignDriver = (orderId, driverId) => {
    if (socket && isConnected) {
      socket.emit('assign-driver', {
        orderId,
        driverId
      });
    }
  };

  // Function to notify new order creation
  const notifyNewOrder = (orderData) => {
    if (socket && isConnected) {
      socket.emit('new-order-created', orderData);
    }
  };

  // Clear notifications
  const clearOrderUpdates = () => setOrderUpdates([]);
  const clearNewOrders = () => setNewOrders([]);
  const clearDriverAssignments = () => setDriverAssignments([]);

  return {
    socket,
    isConnected,
    orderUpdates,
    newOrders,
    driverAssignments,
    error,
    updateOrderStatus,
    assignDriver,
    notifyNewOrder,
    clearOrderUpdates,
    clearNewOrders,
    clearDriverAssignments
  };
};

export default useOrderSocket;

