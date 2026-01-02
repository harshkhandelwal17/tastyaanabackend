// Notification Service Worker for PWA
const CACHE_NAME = 'tastyaana-notifications-v1';
const NOTIFICATION_ICON = '/assets/notification-icon.png';

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
    icon: NOTIFICATION_ICON,
    badge: '/assets/badge-icon.png',
    tag: 'tastyaana-notification',
    requireInteraction: false,
    actions: []
  };

  if (event.data) {
    try {
      const data = event.data.json();
      notificationData = {
        ...notificationData,
        ...data,
        data: data.data || {}
      };
    } catch (error) {
      console.error('Error parsing push data:', error);
      notificationData.body = event.data.text() || notificationData.body;
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    tag: notificationData.tag,
    requireInteraction: notificationData.requireInteraction || false,
    data: notificationData.data,
    actions: notificationData.actions || [],
    vibrate: [200, 100, 200],
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
      .then(() => {
        // Store notification in app for in-app display
        const notificationForApp = {
          id: notificationData.data?.id || Date.now().toString(),
          title: notificationData.title,
          body: notificationData.body,
          type: notificationData.data?.type || 'general',
          timestamp: new Date().toISOString(),
          read: false
        };

        // Send message to main thread to store notification
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'NOTIFICATION_RECEIVED',
              notification: notificationForApp
            });
          });
        });
      })
  );
});

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const action = event.action;
  const notificationData = event.notification.data || {};

  let urlToOpen = '/';

  // Handle different notification types
  switch (notificationData.type) {
    case 'order_confirmed':
      urlToOpen = '/orders';
      break;
    case 'order_shipped':
      urlToOpen = '/orders';
      break;
    case 'order_delivered':
      urlToOpen = '/orders';
      break;
    case 'promotion':
      urlToOpen = notificationData.url || '/';
      break;
    case 'cart_reminder':
      urlToOpen = '/cart';
      break;
    case 'new_product':
      urlToOpen = notificationData.productUrl || '/products';
      break;
    default:
      urlToOpen = notificationData.url || '/';
  }

  // Handle action buttons
  if (action === 'view_order') {
    urlToOpen = '/orders';
  } else if (action === 'view_cart') {
    urlToOpen = '/cart';
  } else if (action === 'view_product') {
    urlToOpen = notificationData.productUrl || '/products';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clientList) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
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

// Background sync for offline notifications
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);
  
  if (event.tag === 'notification-sync') {
    event.waitUntil(
      // Handle any pending notifications here
      console.log('Syncing notifications...')
    );
  }
});

// Message event for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service worker error:', event.error);
});

// Unhandled promise rejection
self.addEventListener('unhandledrejection', (event) => {
  console.error('Service worker unhandled rejection:', event.reason);
});
