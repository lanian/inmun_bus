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
| `/zones` | 누구나 | **admin 만** |
| `/notice` | 누구나 | **admin 만** |
| `/drivers`, `/admins` | admin | admin |

## 주의
- 익명 읽기는 의도적으로 허용(승객 페이지가 누구나 접근). API 키 노출은
  RTDB 쓰기에 영향 없음(쓰기는 ID 토큰 + 위 규칙으로 제어).
- 운영자 추가는 행사 전에 미리 끝내 두세요. 행사 당일 콘솔 작업은
  사고 위험이 큽니다.
