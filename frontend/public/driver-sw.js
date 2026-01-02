// Driver Service Worker for background location tracking
const CACHE_NAME = 'driver-tracking-v1';
const HEARTBEAT_INTERVAL = 25000; // 25 seconds
const LOCATION_UPDATE_INTERVAL = 10000; // 10 seconds

let heartbeatTimer = null;
let locationTimer = null;
let isBackground = false;

// Install event
self.addEventListener('install', (event) => {
  console.log('🚗 Driver Service Worker: Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('🚗 Driver Service Worker: Activating...');
  event.waitUntil(self.clients.claim());
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  const { type, data } = event.data;
  
  switch (type) {
    case 'START_BACKGROUND_TRACKING':
      console.log('🚗 Driver Service Worker: Starting background tracking');
      startBackgroundTracking(data);
      break;
      
    case 'STOP_BACKGROUND_TRACKING':
      console.log('🚗 Driver Service Worker: Stopping background tracking');
      stopBackgroundTracking();
      break;
      
    case 'UPDATE_LOCATION':
      console.log('🚗 Driver Service Worker: Location update received');
      handleLocationUpdate(data);
      break;
      
    case 'TAB_VISIBILITY_CHANGE':
      isBackground = !data.isVisible;
      console.log('🚗 Driver Service Worker: Tab visibility changed:', isBackground ? 'background' : 'visible');
      if (isBackground) {
        startBackgroundTracking(data);
      } else {
        stopBackgroundTracking();
      }
      break;
      
    default:
      console.log('🚗 Driver Service Worker: Unknown message type:', type);
  }
});

// Start background tracking
function startBackgroundTracking(data) {
  console.log('🚗 Driver Service Worker: Starting background tracking with data:', data);
  
  // Clear existing timers
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  if (locationTimer) clearInterval(heartInterval(locationTimer);
  
  // Start heartbeat to keep connections alive
  heartbeatTimer = setInterval(() => {
    sendHeartbeat(data);
  }, HEARTBEAT_INTERVAL);
  
  // Start location tracking
  locationTimer = setInterval(() => {
    requestLocationUpdate(data);
  }, LOCATION_UPDATE_INTERVAL);
  
  console.log('🚗 Driver Service Worker: Background tracking started');
}

// Stop background tracking
function stopBackgroundTracking() {
  console.log('🚗 Driver Service Worker: Stopping background tracking');
  
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  
  if (locationTimer) {
    clearInterval(locationTimer);
    locationTimer = null;
  }
  
  console.log('🚗 Driver Service Worker: Background tracking stopped');
}

// Send heartbeat to keep connections alive
function sendHeartbeat(data) {
  console.log('💓 Driver Service Worker: Sending heartbeat');
  
  // Notify all clients about heartbeat
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SERVICE_WORKER_HEARTBEAT',
        data: {
          timestamp: new Date().toISOString(),
          isBackground: true
        }
      });
    });
  });
}

// Request location update
function requestLocationUpdate(data) {
  console.log('📍 Driver Service Worker: Requesting location update');
  
  // Notify all clients to update location
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SERVICE_WORKER_LOCATION_REQUEST',
        data: {
          timestamp: new Date().toISOString(),
          isBackground: true
        }
      });
    });
  });
}

// Handle location update
function handleLocationUpdate(data) {
  console.log('📍 Driver Service Worker: Handling location update:', data);
  
  // Store location in cache for offline use
  const locationData = {
    timestamp: new Date().toISOString(),
    location: data.location,
    orderId: data.orderId,
    driverId: data.driverId
  };
  
  // Cache the location data
  caches.open(CACHE_NAME).then(cache => {
    cache.put('/driver-location', new Response(JSON.stringify(locationData)));
  });
  
  // Forward to all clients
  self.clients.matchAll().then(clients => {
    clients.forEach(client => {
      client.postMessage({
        type: 'SERVICE_WORKER_LOCATION_UPDATE',
        data: locationData
      });
    });
  });
}

// Background sync for offline support
self.addEventListener('sync', (event) => {
  console.log('🚗 Driver Service Worker: Background sync event:', event.tag);
  
  if (event.tag === 'driver-location-sync') {
    event.waitUntil(syncLocationData());
  }
});

// Sync location data when back online
async function syncLocationData() {
  console.log('🚗 Driver Service Worker: Syncing location data...');
  
  try {
    const cache = await caches.open(CACHE_NAME);
    const response = await cache.match('/driver-location');
    
    if (response) {
      const locationData = await response.json();
      console.log('🚗 Driver Service Worker: Syncing cached location:', locationData);
      
      // Notify clients to sync this data
      const clients = await self.clients.matchAll();
      clients.forEach(client => {
        client.postMessage({
          type: 'SERVICE_WORKER_SYNC_LOCATION',
          data: locationData
        });
      });
    }
  } catch (error) {
    console.error('🚗 Driver Service Worker: Error syncing location data:', error);
  }
}

// Push notification handling for important updates
self.addEventListener('push', (event) => {
  console.log('🚗 Driver Service Worker: Push notification received');
  
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body || 'New delivery update',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'driver-update',
      requireInteraction: true,
      data: data
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'Driver Update', options)
    );
  }
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('🚗 Driver Service Worker: Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    self.clients.matchAll().then(clients => {
      // Focus on existing client or open new one
      if (clients.length > 0) {
        clients[0].focus();
      } else {
        self.clients.openWindow('/driver/dashboard');
      }
    })
  );
});

console.log('🚗 Driver Service Worker: Loaded and ready');

