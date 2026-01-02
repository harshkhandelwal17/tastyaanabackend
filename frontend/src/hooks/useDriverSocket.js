import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

export const useDriverSocket = (orderId, driverId) => {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('offline');
  const [currentLocation, setCurrentLocation] = useState(null);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [isBackground, setIsBackground] = useState(false);
  const socketRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 5;
  const heartbeatIntervalRef = useRef(null);
  const backgroundCheckIntervalRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace('/api', '');

  // Page Visibility API to detect background tabs
  useEffect(() => {
    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      setIsTabVisible(isVisible);
      setIsBackground(!isVisible);
      
      console.log('🔍 Tab visibility changed:', isVisible ? 'visible' : 'background');
      
      if (isVisible) {
        // Tab became visible - resume tracking and reconnect if needed
        console.log('🔄 Tab became visible, resuming tracking...');
        resumeTracking();
      } else {
        // Tab went to background - keep minimal tracking active
        console.log('⏸️ Tab went to background, maintaining minimal tracking...');
        maintainBackgroundTracking();
      }
    };

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also listen for page focus/blur events
    window.addEventListener('focus', () => setIsTabVisible(true));
    window.addEventListener('blur', () => setIsTabVisible(false));
    
    // Check if tab is currently visible
    setIsTabVisible(!document.hidden);
    setIsBackground(document.hidden);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', () => setIsTabVisible(true));
      window.removeEventListener('blur', () => setIsTabVisible(false));
    };
  }, []);

  // Background tracking maintenance
  const maintainBackgroundTracking = useCallback(() => {
    if (backgroundCheckIntervalRef.current) {
      clearInterval(backgroundCheckIntervalRef.current);
    }

    // Set up background interval to keep tracking alive
    backgroundCheckIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivityRef.current;
      
      // If no activity for 30 seconds, send heartbeat
      if (timeSinceLastActivity > 30000) {
        console.log('💓 Background heartbeat - keeping tracking alive');
        sendHeartbeat();
        lastActivityRef.current = now;
      }
      
      // Check connection status
      if (socketRef.current && !socketRef.current.connected) {
        console.log('🔄 Background reconnection attempt...');
        reconnectSocket();
      }
    }, 10000); // Check every 10 seconds in background
  }, []);

  // Resume tracking when tab becomes visible
  const resumeTracking = useCallback(() => {
    console.log('🔄 Resuming full tracking...');
    
    // Clear background intervals
    if (backgroundCheckIntervalRef.current) {
      clearInterval(backgroundCheckIntervalRef.current);
      backgroundCheckIntervalRef.current = null;
    }
    
    // Reconnect socket if needed
    if (!socketRef.current || !socketRef.current.connected) {
      console.log('🔄 Reconnecting socket after tab became visible...');
      reconnectSocket();
    }
    
    // Resume normal heartbeat
    startHeartbeat();
    
    // Update last activity
    lastActivityRef.current = Date.now();
  }, []);

  // Heartbeat mechanism to keep connections alive
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatIntervalRef.current = setInterval(() => {
      if (socketRef.current && socketRef.current.connected) {
        try {
          // Send heartbeat to keep connection alive
          socketRef.current.emit('heartbeat', {
            driverId,
            orderId,
            timestamp: new Date().toISOString(),
            isBackground: isBackground
          });
          
          console.log('💓 Heartbeat sent - connection alive');
          lastActivityRef.current = Date.now();
        } catch (error) {
          console.error('💓 Heartbeat failed:', error);
        }
      }
    }, 25000); // Send heartbeat every 25 seconds
  }, [driverId, orderId, isBackground]);

  // Send immediate heartbeat
  const sendHeartbeat = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      try {
        socketRef.current.emit('heartbeat', {
          driverId,
          orderId,
          timestamp: new Date().toISOString(),
          isBackground: true
        });
        console.log('💓 Immediate heartbeat sent');
      } catch (error) {
        console.error('💓 Immediate heartbeat failed:', error);
      }
    }
  }, [driverId, orderId]);

  // Reconnect socket
  const reconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    // Small delay before reconnecting
    setTimeout(() => {
      createConnection();
    }, 1000);
  }, []);

  // Create socket connection
  const createConnection = useCallback(() => {
    if (!orderId) {
      console.warn('useDriverSocket: Missing orderId:', orderId);
      return;
    }
    if (!driverId) {
      console.warn('useDriverSocket: Missing driverId:', driverId);
      return;
    }
    
    console.log('useDriverSocket: Creating connection with orderId:', orderId, 'driverId:', driverId);

    // Clean up existing connection
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    try {
      console.log('useDriverSocket: Creating connection to', backendUrl);
      
      const socketInstance = io(backendUrl, {
        transports: ['polling', 'websocket'],
        upgrade: true,
        autoConnect: true,
        forceNew: true,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: 2000,
        timeout: 15000,
        // Keep connection alive in background
        pingTimeout: 60000,
        pingInterval: 25000
      });

      socketRef.current = socketInstance;

      socketInstance.on('connect', () => {
        console.log('useDriverSocket: Connected with ID:', socketInstance.id);
        setConnectionStatus('online');
        setSocket(socketInstance);
        reconnectAttemptsRef.current = 0;

        // Start heartbeat immediately
        startHeartbeat();

        // Small delay to ensure connection is stable
        setTimeout(() => {
          try {
            // Join both driver and tracking rooms
            socketInstance.emit('driver-connect', { 
              driverId, 
              orderId,
              timestamp: new Date().toISOString()
            });
            
            socketInstance.emit('join-tracking', orderId);
            
            console.log('useDriverSocket: Joined rooms for order:', orderId);
          } catch (error) {
            console.error('useDriverSocket: Error joining rooms:', error);
          }
        }, 100);
      });

      socketInstance.on('driver-connected', (response) => {
        console.log('useDriverSocket: Driver connection acknowledged:', response);
      });

      socketInstance.on('location-update', (data) => {
        console.log('useDriverSocket: Location update received:', data);
        if (data.location) {
          setCurrentLocation(data.location);
          lastActivityRef.current = Date.now();
        }
      });

      socketInstance.on('driver-location-update', (data) => {
        console.log('useDriverSocket: Driver location update received:', data);
        if (data.lat && data.lng) {
          setCurrentLocation({ lat: data.lat, lng: data.lng });
          lastActivityRef.current = Date.now();
        }
      });

      socketInstance.on('disconnect', (reason) => {
        console.log('useDriverSocket: Disconnected, reason:', reason);
        setConnectionStatus('offline');
        setSocket(null);

        // Auto-reconnect if not intentional disconnect
        if (reason !== 'io client disconnect' && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          const delay = Math.pow(2, reconnectAttemptsRef.current) * 1000;
          
          console.log(`useDriverSocket: Attempting reconnection ${reconnectAttemptsRef.current}/${maxReconnectAttempts} in ${delay}ms`);
          
          setTimeout(() => {
            if (isTabVisible) {
              // Only reconnect if tab is visible
              createConnection();
            } else {
              // In background, maintain minimal tracking
              maintainBackgroundTracking();
            }
          }, delay);
        }
      });

      socketInstance.on('connect_error', (error) => {
        console.error('useDriverSocket: Connection error:', error);
        setConnectionStatus('error');
        
        // Retry connection after delay
        setTimeout(() => {
          if (isTabVisible) {
            createConnection();
          }
        }, 5000);
      });

      socketInstance.on('heartbeat-ack', (data) => {
        console.log('💓 Heartbeat acknowledged:', data);
        lastActivityRef.current = Date.now();
      });

      // Handle background tab events
      socketInstance.on('background-mode', (data) => {
        console.log('⏸️ Server acknowledged background mode:', data);
      });

    } catch (error) {
      console.error('useDriverSocket: Error creating connection:', error);
      setConnectionStatus('error');
    }
  }, [orderId, driverId, backendUrl, startHeartbeat, maintainBackgroundTracking, isTabVisible]);

  // Initialize connection
  useEffect(() => {
    if (orderId && driverId) {
      createConnection();
    }

    return () => {
      // Cleanup
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
      }
      if (backgroundCheckIntervalRef.current) {
        clearInterval(backgroundCheckIntervalRef.current);
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [orderId, driverId, createConnection]);

  // Emit location update
  const emitLocation = useCallback((location) => {
    if (socketRef.current && socketRef.current.connected) {
      try {
        socketRef.current.emit('driver-location-update', {
          orderId,
          driverId,
          ...location,
          timestamp: new Date().toISOString(),
          isBackground: isBackground
        });
        
        console.log('📍 Location emitted:', location);
        lastActivityRef.current = Date.now();
      } catch (error) {
        console.error('📍 Error emitting location:', error);
      }
    } else {
      console.warn('📍 Socket not connected, cannot emit location');
    }
  }, [orderId, driverId, isBackground]);

  // Test connection
  const testConnection = useCallback(() => {
    if (socketRef.current && socketRef.current.connected) {
      console.log('🔌 Connection test: Connected');
      return true;
    } else {
      console.log('🔌 Connection test: Not connected');
      return false;
    }
  }, []);

  return {
    socket,
    connectionStatus,
    emitLocation,
    testConnection,
    isConnected: connectionStatus === 'online',
    isTabVisible,
    isBackground,
    currentLocation
  };
};

export default useDriverSocket;