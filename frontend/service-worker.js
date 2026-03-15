// ─────────────────────────────────────────────────────────────────────────────
// service-worker.js  —  Alzheimer's Support Platform
// Strategy:
//   • App shell (HTML/CSS/JS) → Cache-first, fallback to network
//   • API calls (/api/*)      → Network-only (never cache auth/data)
//   • Images & icons          → Cache-first, long TTL
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_VERSION  = 'alz-support-v3';
const STATIC_CACHE   = CACHE_VERSION + '-static';
const IMAGE_CACHE    = CACHE_VERSION + '-images';

// App shell — these are the pages and assets to pre-cache on install.
// Uses icon-192x192.png / icon-512x512.png (consistent with manifest.json).
const APP_SHELL = [
    '/dashboard.html',
    '/journal.html',
    '/reminders.html',
    '/login.html',
    '/signup.html',
    '/caregiver.html',
    '/location-tracker.html',
    '/style.css',
    '/scan.css',
    '/api.js',
    '/user-store.js',
    '/nav-shared.js',
    '/journal.js',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// ── Install: pre-cache the app shell ─────────────────────────────────────────
self.addEventListener('install', function(event) {
    self.skipWaiting();
    event.waitUntil(
        caches.open(STATIC_CACHE).then(function(cache) {
            // addAll fails if ANY request fails; use individual adds so one
            // missing asset doesn't break the whole SW install.
            return Promise.allSettled(
                APP_SHELL.map(function(url) {
                    return cache.add(url).catch(function(err) {
                        console.warn('[SW] Could not cache:', url, err.message);
                    });
                })
            );
        })
    );
});

// ── Activate: delete stale caches ────────────────────────────────────────────
self.addEventListener('activate', function(event) {
    event.waitUntil(
        caches.keys().then(function(keys) {
            return Promise.all(
                keys.filter(function(key) {
                    // Delete any cache that isn't from the current version
                    return key.startsWith('alz-support-') && key !== STATIC_CACHE && key !== IMAGE_CACHE;
                }).map(function(key) {
                    return caches.delete(key);
                })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// ── Fetch: routing strategy ───────────────────────────────────────────────────
self.addEventListener('fetch', function(event) {
    var url = new URL(event.request.url);

    // 1. Never intercept API calls — always go to network
    if (url.pathname.startsWith('/api/') || url.hostname !== self.location.hostname) {
        return; // let browser handle it normally
    }

    // 2. Images → cache-first, then network, then cache update
    if (event.request.destination === 'image' || url.pathname.startsWith('/icons/')) {
        event.respondWith(
            caches.open(IMAGE_CACHE).then(function(cache) {
                return cache.match(event.request).then(function(cached) {
                    if (cached) return cached;
                    return fetch(event.request).then(function(response) {
                        if (response.ok) cache.put(event.request, response.clone());
                        return response;
                    });
                });
            })
        );
        return;
    }

    // 3. App shell (HTML/CSS/JS) → cache-first, network fallback
    event.respondWith(
        caches.match(event.request).then(function(cached) {
            if (cached) {
                // Serve from cache immediately; refresh cache in background (stale-while-revalidate)
                var networkFetch = fetch(event.request).then(function(response) {
                    if (response.ok) {
                        caches.open(STATIC_CACHE).then(function(cache) {
                            cache.put(event.request, response.clone());
                        });
                    }
                    return response;
                }).catch(function() { /* offline — that's OK, we already served from cache */ });
                return cached;
            }
            // Not in cache — fetch from network
            return fetch(event.request).then(function(response) {
                if (response.ok && event.request.method === 'GET') {
                    caches.open(STATIC_CACHE).then(function(cache) {
                        cache.put(event.request, response.clone());
                    });
                }
                return response;
            }).catch(function() {
                // Offline and not cached — return a simple offline page for navigations
                if (event.request.mode === 'navigate') {
                    return caches.match('/dashboard.html') || new Response(
                        '<html><body style="font-family:sans-serif;text-align:center;padding:4rem;">' +
                        '<h2>You are offline</h2>' +
                        '<p>Please check your connection and try again.</p>' +
                        '</body></html>',
                        { headers: { 'Content-Type': 'text/html' } }
                    );
                }
            });
        })
    );
});

// ── Push notification handler (for future web-push feature) ──────────────────
self.addEventListener('push', function(event) {
    if (!event.data) return;
    var payload = {};
    try { payload = event.data.json(); } catch(e) { payload = { title: event.data.text() }; }

    event.waitUntil(
        self.registration.showNotification(payload.title || "Alzheimer's Support", {
            body:    payload.body    || 'You have a new reminder.',
            icon:    payload.icon    || '/icons/icon-192x192.png',
            badge:   payload.badge   || '/icons/icon-192x192.png',
            tag:     payload.tag     || 'alz-notification',
            data:    payload.data    || {},
            actions: payload.actions || []
        })
    );
});

// ── Notification click → open the app ────────────────────────────────────────
self.addEventListener('notificationclick', function(event) {
    event.notification.close();
    var targetUrl = (event.notification.data && event.notification.data.url)
        ? event.notification.data.url
        : '/reminders.html';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
            for (var i = 0; i < clientList.length; i++) {
                var client = clientList[i];
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) return clients.openWindow(targetUrl);
        })
    );
});
