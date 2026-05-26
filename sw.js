/* 자폭 서비스워커 — 기존에 설치된 옛 서비스워커가 이 파일로 업데이트되면
   모든 캐시를 비우고 스스로 등록 해제한 뒤 열린 페이지를 새로고침한다.
   (그동안 캐시가 옛 버전을 붙들고 있던 문제를 해소하기 위함) */
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      clients.forEach((c) => { try { c.navigate(c.url); } catch (_) {} });
    } catch (_) {}
  })());
});
