/* App instalável do Zerados da Galera: guarda a "casca" do site para abrir rápido e funcionar mesmo com internet ruim.
   Dados (Firebase) sempre vêm da internet; arquivos .json dos robôs: rede primeiro, cópia guardada se falhar. */
const CACHE = "zerados-v1";
const CASCA = ["./", "index.html", "styles.css", "app.js", "config.js", "img/logo-160.png", "img/icon-192.png", "manifest.webmanifest"];
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(CASCA)).catch(() => {})); self.skipWaiting(); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;   // Firebase, fontes e lojas: direto da internet
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok && (u.pathname.endsWith(".js") || u.pathname.endsWith(".css") || u.pathname.endsWith(".json") || u.pathname.endsWith(".html") || u.pathname === "/" || u.pathname.startsWith("/img/") || u.pathname.startsWith("/covers/"))) {
      const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)).catch(() => {});
    }
    return r;
  }).catch(() => caches.match(e.request).then(r => r || caches.match("index.html"))));
});
