let cacheName = "rtle"; // Whatever name
let filesToCache = [
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
    "/css/style.css?v=202408191823",
    "/js/app.js?v=202408191823",
    "/offline.js?v=202408191823",
]

self.addEventListener("install", function(e) {
    e.waitUntil(
        caches.open(cacheName).then(function(cache) {
            console.log(filesToCache);
            return cache.addAll(filesToCache);
        })
    )
});

self.addEventListener("fetch", function(e) {
    e.respondWith(
        caches.match(e.request).then(function(response) {
            console.log(response);
            console.log(e.request);
            return response || fetch(e.request)
        })
    )
});
