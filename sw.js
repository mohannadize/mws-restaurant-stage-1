let cacheNames = {
    html: "htmlCache-2.2",
    images: "images",
    map: "mapCache"
};
let static = [
    "/",
    "css/styles.css",
    "data/restaurants.json",
    "js/dbhelper.js",
    "js/main.js",
    "js/restaurant_info.js",
    "restaurant.html",
    "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700"
];
self.addEventListener("install", (e) => {
    caches.open(cacheNames.html).then(cache => {
        cache.addAll(static)
    })
    self.skipWaiting();
});
self.addEventListener("fetch", (e) => {
    let url = e.request.url.replace("/restaurant.html+./g", "restaurant.html");
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
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.filter(function(cacheName) {
                    return cacheName.startsWith('htmlCache') && cacheNames.html != cacheName;
                }).map(function(cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    )
})