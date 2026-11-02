// Pork Bank: guarda o app no aparelho para abrir rápido e sem internet.
const VERSAO = "pork-bank-v1";
const ARQUIVOS = ["./", "./index.html", "./manifest.webmanifest", "./icon.svg", "./icon-192.png", "./icon-512.png", "./icon-maskable-512.png", "./apple-touch-icon.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSAO).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // A página: tenta a versão mais nova primeiro; sem internet, usa a guardada.
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((r) => { const c = r.clone(); caches.open(VERSAO).then((k) => k.put("./index.html", c)); return r; }).catch(() => caches.match("./index.html")));
    return;
  }
  // Ícones, fontes e o leitor de PDF: usa o guardado e atualiza por trás.
  if (url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com|cdnjs\.cloudflare\.com/.test(url.host)) {
    e.respondWith(caches.match(req).then((hit) => {
      const rede = fetch(req).then((r) => { if (r.ok || r.type === "opaque") { const c = r.clone(); caches.open(VERSAO).then((k) => k.put(req, c)); } return r; }).catch(() => hit);
      return hit || rede;
    }));
  }
});
