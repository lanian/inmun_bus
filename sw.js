/* P1-3: 무등생각 지도 타일 캐시 서비스워커.
   - OSM 타일(*.tile.openstreetmap.org)만 cache-first 로 가로채 IndexedDB(Cache API)에 보관
   - 그 외 요청(index.html · 폰트 · firebase · OSRM)은 항상 네트워크 — 캐시 미작용
   - 활성화 시 옛 캐시(VER 불일치)는 모두 정리
   - 사용자 첫 지도 접근 후 행사장 영역(z14~16) 타일을 자동 prefetch (별도 로직, 이 SW 는 cache-first 만) */
const VER = "mds-tiles-v1";
const TILE_HOST_SUFFIX = "tile.openstreetmap.org";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== VER).map((k) => caches.delete(k)));
    } catch (_) {}
    try { await self.clients.claim(); } catch (_) {}
  })());
});

self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  let url;
  try { url = new URL(e.request.url); } catch (_) { return; }
  if (!url.hostname.endsWith(TILE_HOST_SUFFIX)) return; // 타일만 가로챔
  e.respondWith((async () => {
    const cache = await caches.open(VER);
    const cached = await cache.match(e.request);
    if (cached) return cached;
    try {
      const resp = await fetch(e.request);
      if (resp && resp.status === 200) {
        try { cache.put(e.request, resp.clone()); } catch (_) {}
      }
      return resp;
    } catch (err) {
      // 네트워크 실패 — 캐시도 없으면 그대로 실패
      throw err;
    }
  })());
});

/* prefetch 메시지 처리 — index.html 에서 행사장 영역 z14~16 prefetch 요청을 보냄 */
self.addEventListener("message", (e) => {
  const msg = e.data || {};
  if (msg.type !== "PREFETCH_TILES" || !Array.isArray(msg.urls)) return;
  (async () => {
    const cache = await caches.open(VER);
    let ok = 0, fail = 0;
    for (const url of msg.urls) {
      try {
        const existing = await cache.match(url);
        if (existing) { ok++; continue; }
        const r = await fetch(url);
        if (r && r.status === 200) { await cache.put(url, r.clone()); ok++; }
        else fail++;
      } catch (_) { fail++; }
    }
    if (e.source && e.source.postMessage) {
      e.source.postMessage({ type: "PREFETCH_DONE", ok, fail });
    }
  })();
});
