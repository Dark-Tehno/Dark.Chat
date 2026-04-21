

import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'



self.skipWaiting()
clientsClaim()


precacheAndRoute(self.__WB_MANIFEST);

cleanupOutdatedCaches();

self.addEventListener('push', event => {
  console.log('[Service Worker] Push Received.');
  
  const data = event.data.json();
  const title = data.title || 'Новое уведомление';
  const options = {
    body: data.body || 'Что-то произошло!',
    icon: data.icon || '/logo192.png',
    badge: data.badge || '/logo192.png',
    data: data.data 
  };

  event.waitUntil(self.registration.showNotification(title, options));
});


self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');

  event.notification.close();

  
  const urlToOpen = event.notification.data?.url || '/';

  
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true,
    }).then((windowClients) => {
      
      for (const client of windowClients) {
        const clientUrl = new URL(client.url);
        const targetUrl = new URL(urlToOpen, self.location.origin);
        if (clientUrl.pathname === targetUrl.pathname && 'focus' in client) {
          return client.focus();
        }
      }
      
      return clients.openWindow(urlToOpen);
    })
  );
});