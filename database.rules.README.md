# Firebase Realtime Database 규칙 적용 안내

## 목적
P0-5: 행사 당일 누구나 `/zones`, `/counts`, `/buses` 같은 운영 데이터를
임의로 덮어쓰지 못하도록 **driver/admin 화이트리스트** 기반 쓰기 권한
강제.

## 적용 절차
1. Firebase 콘솔 → Realtime Database → **규칙(Rules)** 탭
2. 본 저장소의 `database.rules.json` 내용을 복사·붙여넣기
3. **게시(Publish)** 클릭
4. 운영자 계정의 UID를 추가:
   - `/drivers/{UID}` = `true`  (기사 — 위치·카운트·좌표·경유점·핸드오프 쓰기 가능)
   - `/admins/{UID}` = `true`   (관리자 — 위 + zones·notice·drivers·admins 관리)

운영자의 UID는 본 앱에서 운영자 모드 → 고급 설정 → 「쓰기 로그인 테스트」를
누르면 `로그인 성공! 규칙에 넣을 UID: <UID>` 형태로 표시됩니다.

## 데이터 경로별 권한 요약

| 경로 | 읽기 | 쓰기 |
|---|---|---|
| `/buses/{busId}` | 누구나 | driver 또는 admin |
| `/coords` | 누구나 | driver 또는 admin |
| `/viapoints` | 누구나 | driver 또는 admin |
| `/counts/{date}` | 누구나 | driver 또는 admin |
| `/handoff` | 누구나 | driver 또는 admin |
| `/journal/{date}` | 누구나 | driver 또는 admin |
| `/zones` | 누구나 | **admin 만** |
| `/notice` | 누구나 | driver 또는 admin |
| `/drivers`, `/admins` | admin | admin |
| `/stickers/{id}` | 누구나 | **신규(create) 는 누구나** · 등록 후 **10분 이내** 본인 DELETE 익명 허용 · 그 외 수정·삭제는 driver·admin |
| `/stats/{date}/sessions/{sid}/flushes/{flushTs}` | driver·admin | **익명 PUT** (sid 6~32자, flushTs 숫자, ev 화이트리스트, 알려진 필드 외 거부) + **driver·admin 모든 쓰기**(DELETE 포함) · 읽기는 운영자만. **샤드 패턴 v3** — 각 flush 가 새 sub-record. 클라이언트는 마지막 성공 flush 이후 발생한 신규 이벤트만 보내며, 운영자가 일자 삭제 시 재기록 안 됨. 권장 보관 30일. |

## 주의
- 익명 읽기는 의도적으로 허용(승객 페이지가 누구나 접근). API 키 노출은
  RTDB 쓰기에 영향 없음(쓰기는 ID 토큰 + 위 규칙으로 제어).
- 운영자 추가는 행사 전에 미리 끝내 두세요. 행사 당일 콘솔 작업은
  사고 위험이 큽니다.

## 알려진 트레이드오프 (Known trade-offs)
- **스티커 익명 DELETE (10분 윈도우)**: 정상 사용자의 오등록 정정을 위해
  유지. sticker ID 만 알면 누구나 10분 내 삭제 가능 → 잠재적 사보타지.
  완전 차단하려면 `(now - ts < 600000)` 절을 제거(단, 익명 사용자는
  본인이 등록한 스티커도 못 지움 — UX 비용 발생).
- **/stats 익명 PUT**: 사용 통계 익명 수집을 위해 의도적으로 허용. 클라
  생성 `$sid` 위조 가능 → 익명 사용자가 임의 통계 데이터 주입 가능.
  실 분석 시 비정상 패턴 필터(세션 길이·이벤트 분포) 필요. 완전 차단하려면
  `$sid.length` 절을 제거하고 `auth != null` 강제(익명 분석 불가).
- 행사 종료 후 운영자가 StickerEditor 「만료 정리」 1회 실행 권장.
