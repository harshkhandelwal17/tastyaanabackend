// Simple socket connection test utility
import io from 'socket.io-client';

export const testSocketConnection = (backendUrl, orderId, driverId) => {
  console.log('🧪 Testing socket connection...');
  console.log('Backend URL:', backendUrl);
  console.log('Order ID:', orderId);
  console.log('Driver ID:', driverId);

  const socket = io(backendUrl, {
    transports: ['polling', 'websocket'],
    upgrade: true,
    autoConnect: true,
    forceNew: true,
    timeout: 10000
  });

  socket.on('connect', () => {
    console.log('✅ Socket connected successfully!');
    console.log('Socket ID:', socket.id);
    
    // Test driver connection
    socket.emit('driver-connect', { 
      driverId,
      orderId,
      timestamp: new Date().toISOString()
    });
    console.log('📡 Sent driver-connect event');
    
    // Test tracking join
    socket.emit('join-tracking', orderId);
    console.log('📍 Sent join-tracking event');
    
    // Test location update
    setTimeout(() => {
      socket.emit('driver-location-update', {
        orderId,
        lat: 22.7638,
        lng: 75.8858,
        heading: null,
        speed: null,
        timestamp: new Date().toISOString()
      });
      console.log('📍 Sent test location update');
    }, 1000);
  });

  socket.on('driver-connected', (response) => {
    console.log('✅ Driver connection acknowledged:', response);
  });

  socket.on('location-update', (data) => {
    console.log('📍 Received location update:', data);
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ Socket disconnected:', reason);
  });

  socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error);
  });

  socket.on('error', (error) => {
    console.error('❌ Socket error:', error);
  });

  // Cleanup after 30 seconds
  setTimeout(() => {
    console.log('🧹 Cleaning up test socket connection');
    socket.disconnect();
  }, 30000);

  return socket;
};

// Test function to be called from browser console
window.testDriverSocket = () => {
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000').replace('/api', '');
  const orderId = '68a2cd5ead236c5d9b1607cb';
  const driverId = 'hello';
  
  return testSocketConnection(backendUrl, orderId, driverId);
};