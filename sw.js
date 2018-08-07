importScripts("idb-bundled.js");
let cacheNames = {
    html: "htmlCache-3",
    images: "images"
};
let static = [
    "/",
    "index.html",
    "css/styles.css",
    "https://cdnjs.cloudflare.com/ajax/libs/vanilla-lazyload/8.7.1/lazyload.min.js",
    "app.js",
    "idb-bundled.js",
    "manifest.json",
    "restaurant.html",
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
    url = url.replace(/restaurant\.html+.*/g, "restaurant.html");
    if (url.endsWith(".jpg") || url.startsWith("https://www.mapquestapi.com/")) {
        e.respondWith(storeImages(e));
        return;
    }
    e.respondWith(
        caches.match(url).then(x => {
            return x || fetch(e.request).then(response => {
                return response;
            });
        })
    );
});
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
});
self.addEventListener("sync", function (e) {
    console.log(e);
    if (e.tag == "post-comment") {
        e.waitUntil(postComments())
    }
});
async function postComments() {
    let posts = await db.getAll(db.toBe);
    posts.map(post => {
        let body = {
            restaurant_id: post.restaurant_id,
            name: post.name,
            comments: post.comments,
            rating: post.rating
        };
        let response = fetch(`http://${location.hostname}:1337/reviews/`, { method: "POST", body: JSON.stringify(body) }).then(event => {
            if (event.status.toString().startsWith("20")) {
                db.delete(post.id, db.toBe);
                return 1;
            } else {
                return 0;
            }
        }).catch(err => { console.error(err); return 0 });
        return response;
    })
};
async function storeImages(e) {
    let url = e.request.url.replace(/-\d+\.jpg/g, "");
    return caches.match(url).then(x=>{
        return x || fetch(e.request).then(response=>{
            return caches.open(cacheNames.images).then(cache=>{
                cache.put(url, response.clone());
                return response;
            })
        })
    });
}