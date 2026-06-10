# Database Rules 보안 점검 기록

Firebase Realtime Database 룰(`database.rules.json`) 변경 이력 및 배포 시 검증 절차.

`database.rules.json` 자체는 순수 JSON 으로 유지 — Firebase Console 에 그대로
복사·붙여넣기 가능. (Console 은 JS 주석/추가 최상위 키를 거부함)

---

## v1 (2026-06-06): 익명 spam 차단

### /stickers/$id
- 익명 생성은 유지 (사용자 지도 클릭 핀이 핵심 기능)
- `.validate` 강화:
  - `ts` 윈도우 `[now-5분, now+1분]` — 위·미래 ts 리플레이 방지
  - `lat`/`lng` 행사장 bbox `[35.125~35.150, 126.915~126.970]` 내 강제
- 클라이언트 dedupe (`STICKER_MIN_INTERVAL`/`DIST`/`QUOTA`) 는 advisory.
  서버 측 bbox+ts validate 가 실 강제.

### /stats/{date}/sessions/{$sid}
- 익명 쓰기 제거 → driver/admin 인증 필수
- 클라이언트(`index.html ~L625`) 가 익명 PUT 하던 익명 세션 분석은 401/403
  silent 처리 (console.warn + 10분 backoff). 사용자 UX 영향 없음 (fire-and-forget)

---

## v2 (2026-06-06 update): 룰 cascade 점검

### 🔴 루트 `.read: true` → `.read: false`

Firebase RTDB 룰은 **shallower-overrides-deeper** —
부모가 read 를 허용하면 자식이 거부할 수 없음.
이전 구조: 루트 `.read: true` 가 모든 자식에게 적용 → `/drivers`·`/admins`
UID 리스트와 `/stats` 분석 데이터가 누구나 read 가능 (자식 `.read: "auth+admin"` 무시됨)

수정: 루트 deny + 각 공개 노드에 명시 `.read: true`
- `/buses`·`/coords`·`/viapoints`·`/zones` · `/notice`·`/counts`·`/handoff`
  ·`/settings`·`/journal`·`/stickers` — 모두 명시 read 보존
- `/drivers`·`/admins`·`/stats` — 인증 필수, 실효성 확보

### 구조 validate 추가

운영자 토큰 탈취 시 위변조 방어.

- `/notice` `.validate`: `message` ≤500자 / `level` ∈ `{info,warn,danger}` / `ts` number
- `/handoff` `.validate`: 필수 `busId`+`ts` 만 강제 (초기 설계의 dir/tripIdx/currentIdx 강제는
  클라이언트 호환을 위해 완화). `by` 는 선택 audit 필드 — 게시자 이메일 local part, ≤64자
- `/settings/theme` `.validate`: `"flat"` 또는 `"default"` 만 허용
- `/journal/$date`·`/counts/$date` 정규식 `^\d{4}-\d{2}-\d{2}$`
- `/buses/$busId` `.validate`: `lat`/`lng` 가 있으면 광주 광역 bbox(34.9~35.4 × 126.5~127.3) 내
  숫자 강제. 행사장보다 넓게 잡아 운영자 자택 사전 테스트 호환 — 타 도시 좌표 위변조만 차단.
  좌표 없는 「운행 정보만 송신」 모드는 그대로 허용. ※ 토큰 탈취 시 시내 임의 좌표 게시는
  여전히 가능 (잔존 위험 절 참고)

### 인증 전달 방식 (참고)

- 모든 인증 fetch 는 `?auth=<idToken>` URL 파라미터 사용 — Firebase RTDB REST 의 공식 1순위 방식.
- `Authorization: Bearer` 헤더 마이그레이션을 시도(b444)했으나 RTDB 의 ID 토큰 Bearer 처리가
  비일관적이어서 위치 송신 401 발생 → b451 에서 전면 회귀. 행사 후 OAuth2 access token 기반
  재시도 검토.

---

## 배포 절차

1. Firebase Console → Realtime Database → Rules 탭
2. `database.rules.json` 내용 그대로 복사·붙여넣기
3. 「게시」 클릭
4. 검증 (브라우저 탭에서):
   - **비로그인** : `https://innum-bus-default-rtdb.firebaseio.com/buses.json` → 정상 응답
   - **비로그인** : `.../drivers.json` → 401 `Permission denied`
   - **비로그인** : `.../admins.json` → 401
   - **비로그인** : `.../stats/2026-06-14.json` → 401
   - **운영자 로그인 후** : 정류장 위치 편집·공지 게시·테마 변경 모두 정상 저장

검증 실패 시 즉시 이전 룰로 롤백 (Firebase Console 의 「버전 기록」 활용).

---

## 알려진 잔존 위험

- **운영자 토큰 탈취** : 인증된 운전자가 임의의 `/buses/{busId}` 위치를 게시 가능
  (validate 가 lat/lng 좌표 범위 검증하지 않음)
- **Firebase 무료 티어 동시 연결 100 제한** : 1000+ 동시 사용자 시 일부 차단 가능
- **OSRM 무료 엔드포인트 600 req/min** : D-1 캐시 워밍 (OPERATIONS.md) 필수

행사 종료 후 재검토 권장.
