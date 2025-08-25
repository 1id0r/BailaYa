const CACHE_NAME = 'bailacheck-v1'
const STATIC_CACHE_URLS = [
  '/',
  '/events',
  '/profile',
  '/auth/login',
  '/auth/signup',
  '/manifest.json',
  // Add other static assets as needed
]

const API_CACHE_NAME = 'bailacheck-api-v1'
const CACHE_EXPIRATION_TIME = 5 * 60 * 1000 // 5 minutes

// Install event - cache static resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Caching static resources')
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .then(() => {
        console.log('Static resources cached successfully')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Failed to cache static resources:', error)
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              // Remove old versions of our cache
              return cacheName.startsWith('bailacheck-') && 
                     cacheName !== CACHE_NAME && 
                     cacheName !== API_CACHE_NAME
            })
            .map((cacheName) => {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            })
        )
      })
      .then(() => {
        console.log('Service Worker activated')
        return self.clients.claim()
      })
  )
})

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Handle API requests differently
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(handleApiRequest(request))
  } else {
    // Handle static resources
    event.respondWith(handleStaticRequest(request))
  }
})

// Handle static resources with cache-first strategy
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      console.log('Serving from cache:', request.url)
      return cachedResponse
    }

    // If not in cache, fetch from network
    console.log('Fetching from network:', request.url)
    const networkResponse = await fetch(request)
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.error('Failed to handle static request:', error)
    
    // Return offline page for navigation requests
    if (request.destination === 'document') {
      const offlineResponse = await caches.match('/offline')
      if (offlineResponse) return offlineResponse
    }
    
    throw error
  }
}

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  const url = new URL(request.url)
  
  // Don't cache POST, PUT, DELETE requests
  if (request.method !== 'GET') {
    try {
      return await fetch(request)
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  try {
    // Try network first for API requests
    console.log('Fetching API from network:', request.url)
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      // Cache successful API responses with timestamp
      const cache = await caches.open(API_CACHE_NAME)
      const responseToCache = networkResponse.clone()
      
      // Add timestamp header
      const headers = new Headers(responseToCache.headers)
      headers.set('sw-cached-at', Date.now().toString())
      
      const responseWithTimestamp = new Response(responseToCache.body, {
        status: responseToCache.status,
        statusText: responseToCache.statusText,
        headers: headers
      })
      
      cache.put(request, responseWithTimestamp)
    }
    
    return networkResponse
  } catch (error) {
    console.log('Network failed, trying cache:', request.url)
    
    // If network fails, try cache
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      const cachedAt = cachedResponse.headers.get('sw-cached-at')
      const age = Date.now() - parseInt(cachedAt || '0')
      
      // Return cached response if it's not too old
      if (age < CACHE_EXPIRATION_TIME) {
        console.log('Serving stale API data from cache:', request.url)
        return cachedResponse
      }
    }
    
    console.error('API request failed and no valid cache available:', error)
    throw error
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered')
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  try {
    // Get pending actions from IndexedDB
    const pendingActions = await getPendingActions()
    
    for (const action of pendingActions) {
      try {
        // Attempt to sync the action
        await syncAction(action)
        await removePendingAction(action.id)
        console.log('Synced action:', action)
      } catch (error) {
        console.error('Failed to sync action:', action, error)
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event)
  
  const options = {
    body: 'New dance event nearby!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Explore Events',
        icon: '/icons/action-explore.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/action-close.png'
      }
    ]
  }

  if (event.data) {
    const payload = event.data.json()
    options.body = payload.body || options.body
    options.data = { ...options.data, ...payload.data }
  }

  event.waitUntil(
    self.registration.showNotification('BailaCheck', options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event)
  
  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/events')
    )
  } else if (event.action === 'close') {
    // Do nothing, notification is already closed
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Placeholder functions for IndexedDB operations
async function getPendingActions() {
  // Implementation would use IndexedDB to store/retrieve pending actions
  return []
}

async function syncAction(action) {
  // Implementation would retry the failed action
  return true
}

async function removePendingAction(actionId) {
  // Implementation would remove the action from IndexedDB
  return true
}