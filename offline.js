const VERSION = "202609050633";
const CACHE_NAME = `rtle-${VERSION}`;

// How long a navigation may wait for the network before falling back to the
// cached shell. RTLE is used in the field, where a weak signal must not leave
// the operator staring at a blank page.
const NETWORK_TIMEOUT = 4000;

// The app shell. Files carrying ?v= change their URL on every release, the rest
// are refreshed by the new cache name and by stale-while-revalidate.
// The worker itself is deliberately absent - it must never cache itself.
const PRECACHE = [
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
    `/css/style.css?v=${VERSION}`,
    `/js/app.js?v=${VERSION}`,
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(CACHE_NAME)
            .then((cache) => {
                // cache: "reload" keeps the HTTP cache out of the install step.
                // Older browsers reject the option, so fall back to a plain addAll.
                try {
                    return cache.addAll(
                        PRECACHE.map((url) => new Request(url, { cache: "reload" }))
                    );
                } catch (error) {
                    return cache.addAll(PRECACHE);
                }
            })
            // Take over straight away instead of waiting for every tab to close.
            // Safe here: the page loads all of its code up front and never
            // fetches more at runtime, so swapping the cache underneath a running
            // page breaks nothing. The page itself decides when to reload.
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        (async () => {
            if (self.registration.navigationPreload) {
                await self.registration.navigationPreload.enable();
            }

            const cacheNames = await caches.keys();
            await Promise.all(
                cacheNames
                    .filter((cacheName) => cacheName !== CACHE_NAME)
                    .map((cacheName) => caches.delete(cacheName))
            );

            await self.clients.claim();
        })()
    );
});

// Lets a page ask which version is controlling it, so it can tell a real update
// apart from a worker that merely caught up with an already fresh page.
self.addEventListener("message", (event) => {
    if (event.data === "VERSION" && event.ports[0]) {
        event.ports[0].postMessage(VERSION);
    }
});

self.addEventListener("fetch", (event) => {
    const request = event.request;

    if (request.method !== "GET") {
        return;
    }

    const url = new URL(request.url);

    // Not ours to answer: other origins, the worker itself, and the station list,
    // which the user downloads on demand and must always get fresh.
    if (url.origin !== self.location.origin) {
        return;
    }

    if (url.pathname === "/offline.js" || url.pathname.startsWith("/data/")) {
        return;
    }

    if (request.mode === "navigate") {
        event.respondWith(networkFirst(event));
        return;
    }

    event.respondWith(staleWhileRevalidate(event));
});

// The shell always comes from the network when there is one, so a freshly
// deployed version shows up on the very next load.
async function networkFirst(event) {
    const cache = await caches.open(CACHE_NAME);

    try {
        const fromNetwork = Promise.resolve(event.preloadResponse).then(
            (preloaded) => preloaded || fetch(event.request)
        );
        const response = await withTimeout(fromNetwork);

        if (response && response.ok) {
            // Stored under a single key so "/" and "/index.html" can never drift
            // apart in the cache.
            event.waitUntil(cache.put("/index.html", response.clone()));
        }

        return response;
    } catch (error) {
        return (
            (await cache.match(event.request)) ||
            (await cache.match("/index.html")) ||
            Response.error()
        );
    }
}

// Assets are served from the cache immediately and refreshed in the background.
// Versioned files change URL on a release, so they are fetched anyway.
async function staleWhileRevalidate(event) {
    const request = event.request;
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);

    const fromNetwork = fetch(request).then(async (response) => {
        if (response && response.ok && response.type === "basic") {
            await cache.put(request, response.clone());
        }

        return response;
    });

    if (cached) {
        // A failed refresh must not break the page - the cached copy is served.
        event.waitUntil(fromNetwork.catch(() => {}));
        return cached;
    }

    return fromNetwork;
}

function withTimeout(promise) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(
            () => reject(new Error("network timeout")),
            NETWORK_TIMEOUT
        );

        promise.then(
            (value) => {
                clearTimeout(timer);
                resolve(value);
            },
            (error) => {
                clearTimeout(timer);
                reject(error);
            }
        );
    });
}
