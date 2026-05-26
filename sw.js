/* 무등생각 셔틀 — 첫 로딩 후 오프라인 동작을 위한 캐시 서비스워커.
   앱 셸(HTML)은 네트워크 우선, 그 외 정적 자원·지도 타일은 캐시 우선(stale).
   축제장 와이파이/신호가 약해도 한 번 로딩해 두면 계속 동작하도록 함. */
const CACHE = "muteung-shuttle-v1";
const SHELL = ["./", "./index.html", "./manifest.webmanifest"];

self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {})));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

const isShell = (url) =>
  url.origin === self.location.origin &&
  (url.pathname.endsWith("/") || url.pathname.endsWith("/index.html"));

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // 앱 셸: 네트워크 우선, 실패 시 캐시 (최신 코드 우선 + 오프라인 폴백)
  if (isShell(url) || req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copy)).catch(() => {});
          return res;
        })
        .catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
    );
    return;
  }

  // 그 외(스크립트·스타일·폰트·지도 타일 등): 캐시 우선, 없으면 받아서 캐시
  e.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // 정상 응답 또는 opaque(교차출처)만 캐시
          if (res && (res.ok || res.type === "opaque")) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
    })
  );
});
