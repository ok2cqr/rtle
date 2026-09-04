const CACHE_NAME = "rtle-202609041830";
self.addEventListener("install", (event) => {
    console.log("install", event);
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll([
                "/",
                "/index.html",
                "/css/bootstrap.min.css",
                "/js/bootstrap.bundle.min.js",
                "/js/theme-toggle.js",
                "/android-chrome-192x192.png",
                "/android-chrome-512x512.png",
                "/apple-touch-icon.png",
                "/favicon-32x32.png",
                "/favicon-16x16.png",
                "/site.webmanifest",
                "/safari-pinned-tab.svg",
                "/css/style.css?v=202609041830",
                "/js/app.js?v=202609041830",
                "/offline.js?v=202609041830",
            ]);
        })
    );
});

self.addEventListener("activate", (event) => {
    console.log("activate", event);
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log(`Deleting old cache: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener("fetch", (event) => {
    console.log("fetch", event);
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request).then((networkResponse) => {
                return caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, networkResponse.clone());
                    return networkResponse;
                });
            });
        })
    );
});