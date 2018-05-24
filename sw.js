let cacheNames = {
    html: "htmlCache-2.3",
    images: "images",
    map: "mapCache"
};
let static = [
    "/",
    "css/styles.css",
    "data/restaurants.json",
    "https://cdnjs.cloudflare.com/ajax/libs/vanilla-lazyload/8.7.1/lazyload.min.js",
    "idb.js",
    "js/dbhelper.js",
    "js/main.js",
    "js/restaurant_info.js",
    "restaurant.html",
    "manifest.json",
    "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700"
];
self.addEventListener("install", (e) => {
    e.waitUntil(
        caches.open(cacheNames.html).then(cache => {
            return cache.addAll(static).then(suc => {
                self.skipWaiting();
                return 1;
            })
        })
    )
});
self.addEventListener("fetch", (e) => {
    let url = e.request.url;
    let targetcache;
    if (url.startsWith("https://maps.googleapis.com/") || url.startsWith("https://maps.gstatic.com/")) {
        targetcache = cacheNames.map;
    } else if (e.request.url.endsWith(".jpg")) {
        url = url.replace(/-\d+\.jpg/g, "");
        targetcache = cacheNames.images;
    } else {
        url = url.replace(/restaurant\.html+.*/g, "restaurant.html");
        targetcache = cacheNames.html;
    }
    e.respondWith(
        caches.match(url).then(x => {
            return x || fetch(e.request).then(response => {
                return caches.open(targetcache).then(cache => {
                    cache.put(url, response.clone());
                    return response;
                })
            });
        })
    );
})
self.addEventListener("activate", (e) => {
    e.waitUntil(
        caches.keys().then(function (ketchups) {
            return Promise.all(
                ketchups.filter(function (cacheName) {
                    return cacheName.startsWith('htmlCache') && cacheNames.html != cacheName;
                }).map(function (cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    )
})