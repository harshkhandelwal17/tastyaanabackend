import { useEffect, useRef, useCallback } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import { toast } from 'react-hot-toast';

const useSellerOrdersSocket = (onOrderUpdate, onNewOrder) => {
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const { user: authUser } = useSelector((state) => state.auth);
  
  const handleOrderUpdate = useCallback((data) => {
    if (onOrderUpdate) onOrderUpdate(data);
  }, [onOrderUpdate]);
  
  const handleNewOrder = useCallback((data) => {
    if (onNewOrder) onNewOrder(data);
  }, [onNewOrder]);

  useEffect(() => {
    if (!authUser?.id) return;

    // Cleanup any existing socket and timeout
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Initialize socket connection
    const apiUrl = import.meta.env.VITE_API_URL || import.meta.env.REACT_APP_API_URL || 'http://localhost:5000';
    
    // Get auth token from localStorage
    const token = localStorage.getItem('token');
    
    const socket = io(apiUrl, {
      auth: {
        token: token
      },
      query: { 
        sellerId: authUser.id,
        userType: 'seller'
      },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      forceNew: false,
      timeout: 15000,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 10000,
      maxReconnectionAttempts: 5,
      randomizationFactor: 0.5
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect', () => {
      console.log('🔌 Connected to seller orders socket');
      // Join the seller-specific room for real-time order updates
      socket.emit('join-seller-orders', authUser.id);
      // Removed toast notification for connection to avoid spam
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
      // Removed toast notification to avoid spam during connection issues
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from socket:', reason);
      if (reason === 'io server disconnect') {
        // Wait before reconnecting to avoid rapid reconnection loops
        reconnectTimeoutRef.current = setTimeout(() => {
          if (socketRef.current && !socketRef.current.connected) {
            socket.connect();
          }
        }, 2000);
      }
    });

    // Order-specific events
    socket.on('orderStatusUpdated', (data) => {
      console.log('📦 Order status updated:', data);
      
      // Show notification
      const statusEmojis = {
        pending: '⏳',
        confirmed: '✅',
        preparing: '👨‍🍳',
        ready: '🎯',
        'out-for-delivery': '🚚',
        delivered: '📦',
        cancelled: '❌'
      };
      
      const emoji = statusEmojis[data.status] || '📦';
      toast.info(`${emoji} Order #${data.orderNumber} → ${data.status}`, {
        position: 'top-center',
        autoClose: 2500,
        hideProgressBar: true,
        style: {
          fontSize: '14px',
          padding: '8px 12px'
        }
      });

      // Call the callback to refresh data
      if (onOrderUpdate) {
        onOrderUpdate(data);
      }
    });

    socket.on('newOrderReceived', (data) => {
      console.log('🆕 New order received:', data);
      
      // Show notification with sound (if supported)
      toast.success(`🎉 New order #${data.orderNumber}`, {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: true,
        className: 'new-order-toast',
        style: {
          fontSize: '14px',
          padding: '8px 12px'
        }
      });

      // Try to play notification sound
      try {
        const audio = new Audio('/notification-sound.mp3');
        audio.volume = 0.3;
        audio.play().catch(e => console.log('Could not play notification sound:', e));
      } catch (e) {
        console.log('Audio not available:', e);
      }

      // Call the callback to refresh data
      if (onNewOrder) {
        onNewOrder(data);
      }
    });

    // Listen for any order updates (more general event)
    socket.on('orderUpdate', (data) => {
      console.log('🔄 Order update received:', data);
      if (onOrderUpdate) {
        onOrderUpdate(data);
      }
    });

    // Listen for new orders (alternative event name)
    socket.on('newOrder', (data) => {
      console.log('🆕 New order (alternative):', data);
      toast.success(`🎉 New order #${data.orderNumber || data.id}`, {
        position: 'top-center',
        autoClose: 3000,
        hideProgressBar: true,
        className: 'new-order-toast',
        style: {
          fontSize: '14px',
          padding: '8px 12px'
        }
      });
      
      if (onNewOrder) {
        onNewOrder(data);
      }
    });

    socket.on('orderCancelled', (data) => {
      console.log('🚫 Order cancelled:', data);
      toast.warn(`⚠️ Order #${data.orderNumber} cancelled`, {
        position: 'top-center',
        autoClose: 2500,
        hideProgressBar: true,
        style: {
          fontSize: '14px',
          padding: '8px 12px'
        }
      });

      if (onOrderUpdate) {
        onOrderUpdate(data);
      }
    });

    // Cleanup function
    return () => {
      console.log('🔌 Cleaning up socket connection');
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      socket.disconnect();
      socketRef.current = null;
    };
  }, [authUser?.id, handleOrderUpdate, handleNewOrder]);

  // Return socket instance for manual operations if needed
  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected || false,
  };
};

export default useSellerOrdersSocket;