// Service Worker: macht die App offline-fähig. Bei Änderungen VERSION erhöhen.
const VERSION = "thw-theorie-v2";
const ASSETS = ["./", "index.html", "css/styles.css", "js/app.js", "js/questions.js", "manifest.webmanifest",
  "icons/icon-192.png", "icons/icon-512.png", "icons/apple-touch-icon.png"];
self.addEventListener("install", e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Netz zuerst (damit Updates ankommen), sonst Cache – offline läuft alles aus dem Cache
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(res => { const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return res; })
      .catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match("index.html")))
  );
});
