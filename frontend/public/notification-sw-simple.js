// Simple Notification Service Worker for PWA
console.log('Notification Service Worker loading...');

// Install event
self.addEventListener('install', (event) => {
  console.log('Notification Service Worker installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Notification Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Push event - Handle incoming push notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  let notificationData = {
    title: 'Tastyaana',
    body: 'You have a new notification',
    icon: '/vite.svg',
    badge: '/vite.svg',
    tag: 'tastyaana-notification',
    requireInteraction: false,
    actions: []
  };

  if (event.data) {
    try {
      // Try to parse as JSON first
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
        icon: data.icon || '/vite.svg',
        badge: data.badge || '/vite.svg'
      };
    } catch (jsonError) {
      console.log('Push data is not JSON, treating as text:', jsonError.message);
      try {
        // Try to get as text
        const textData = event.data.text();
        notificationData.body = textData || notificationData.body;
        notificationData.title = 'Tastyaana';
      } catch (textError) {
        console.error('Error parsing push data as text:', textError);
        // Use default notification data
      }
    }
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  const urlToOpen = event.notification.data?.url || event.notification.data?.redirectUrl || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        
        // If no existing window, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Message handling for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

console.log('Notification Service Worker loaded successfully');
