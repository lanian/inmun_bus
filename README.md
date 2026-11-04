# 무등생각 셔틀 🚌

**제4회 무등산 인문축제 「무등생각」(2026.6.13~14, 증심사 일원)** 셔틀버스용 웹앱입니다.
버스 안에서 정류장 음성 안내를 하고, 승객이 버스 위치를 실시간 지도로 확인할 수 있습니다.

> 생각을 끄고, 생각을 켜다.

빌드 과정 없이 `index.html` 한 파일로 동작하는 정적 PWA라서 GitHub Pages 같은 정적 호스팅에 그대로 올리면 됩니다.

---

## 주요 기능

### 승객 페이지 (기본 진입)
- **D-day 배너와 축제 소개**: 일자별 프로그램(6.13 토 / 6.14 일), 행사장 구역 안내
- **시간표**: 양방향 운행 회차 (토 1~6회차, 일 1~5회차)
- **라이브 지도** (`?view=map`): Leaflet + OSM 타일 위에 셔틀 🚌 실시간 위치, 양방향 노선(OSRM 도로 경로), 정류장, 행사장 구역 폴리곤 표시
- **「내 정류장」**: 정류장을 고르면 다음 도착 정보 확인
- **스티커**: 지도를 눌러 핀(제보·메모) 등록, 운영자에게 알림
- **라이브 신호 지연 표시**: 위치가 60초 넘게 갱신되지 않으면 승객에게 시간표를 보라고 안내

### 운영자(기사) 모드 (`?admin=1` 또는 제목 7번 탭)
- **GPS 자동 안내**: 정류장 진입·도착·통과에 맞춰 음성 멘트 자동 재생, 회차 자동 전환
- **음성**: 기기 TTS, 또는 `audio/` 폴더의 고품질 mp3 (파일이 없으면 TTS로 재생), chime 효과음
- **위치 공유(LIVE 송신)**: Firebase RTDB로 위치를 송신하고, 실패하면 경고 배너와 재로그인 버튼 표시
- **시간표 모드**: GPS가 안 될 때 쓰는 오프라인 백업
- **자료 탭**: 안내 멘트 편집·백업·복원, 정류장별 안내 타이밍 조정, 사용자 페이지 테마, 사용 통계, 스티커 관리
- **🩺 연결 자가진단**: 연결·룰·로그인·UID·단말 시계 등 8단계 점검
- **운영자 핸드오프**: 운행 중 다른 단말로 끊김 없이 인계 (`/handoff`)
- **시연 모드**: `?fake=2026-06-13T13:30&fakeSpeed=10` 처럼 가짜 시각과 위치로 리허설 (행사 당일에는 자동 해제)

### 운영 본부 대시보드 (`?view=ops`)
- 여러 대의 셔틀을 한 화면에서 모니터링

---

## 노선

| 방향 | 정류장 |
|---|---|
| 축제장행 | 5·18민주광장(마한지 맞은편) → 하늘마당(ACC브릿지 입구) → 학동증심사역 → 홍림교 → 운림중학교 → 학운초등학교 → **축제장** |
| 민주광장행 | 축제장 → 학운초등학교 → 운림중학교 → 홍림교 → 학동증심사역 → **5·18민주광장** |

축제장에서 약 15분 쉰 뒤 다음 회차로 넘어갑니다. 정류장 좌표와 시간표는 `index.html` 안에 정의되어 있습니다.

---

## URL 파라미터

| 파라미터 | 설명 |
|---|---|
| `?view=map` | 승객 라이브 지도로 바로 진입 |
| `?view=ops` | 운영 본부 대시보드 |
| `?admin=1` | 운영자 모드 |
| `?db=<URL>` | Firebase RTDB 주소 지정 (생략하면 기본값 `SHARE_DB` 사용) |
| `?theme=flat` | 승객 페이지 플랫 테마 |
| `?fake=<ISO 시각>` / `?fakeSpeed=<배율>` | 시연 모드 (가짜 시각, 가속 배율) |

---

## 기술 스택

- **React 18 (UMD) + Babel Standalone**: `index.html` 안의 JSX를 브라우저에서 바로 변환하며, 빌드 단계가 없습니다
- **Tailwind CSS (CDN)**, Google Fonts (Black Han Sans, Gowun Dodum, Jua, IBM Plex Mono)
- **Leaflet 1.9 + OpenStreetMap** 타일, **OSRM** 도로 경로 (결과는 localStorage에 캐시)
- **Firebase Realtime Database** (REST): 위치·공지·스티커·통계 저장, ID 토큰과 보안 룰로 쓰기 권한 제어
- **Service Worker** (`sw.js`): OSM 타일만 cache-first로 캐시
- **Web Speech API** (TTS), Geolocation API, PWA manifest

---

## 파일 구성

```
index.html                 앱 전체 (React 컴포넌트, 노선·시간표·멘트 데이터)
sw.js                      지도 타일 캐시 서비스워커
manifest.webmanifest       PWA 매니페스트
database.rules.json        Firebase RTDB 보안 룰 (콘솔에 그대로 붙여넣는 JSON)
database.rules.README.md   룰 적용 절차와 경로별 권한 요약
SECURITY.md                룰 변경 이력과 보안 점검 기록
OPERATIONS.md              행사 당일 운영 절차서 (D-1 체크리스트, 사고 대응, 핸드오프)
audio/README.txt           고품질 음성 mp3 파일명과 문구 안내
logo.png, venue.png, program-day1.png, program-day2.png   이미지 리소스
```

---

## 로컬 실행

서비스워커와 위치 API 때문에 `file://`로 열지 말고 로컬 서버로 띄워야 합니다.

```bash
python3 -m http.server 8000
```

그다음 브라우저에서 `http://localhost:8000/`을 엽니다. 운영자 모드는 `http://localhost:8000/?admin=1`입니다.

> GPS 위치 공유는 HTTPS(또는 localhost)에서만 동작합니다.

## 배포

정적 파일이라 저장소를 GitHub Pages 등에 그대로 배포하면 됩니다(`.nojekyll` 포함).
배포한 뒤에는 화면 우하단의 `BUILD` 표시(`index.html`의 `const BUILD`)로 최신 빌드가 올라갔는지 확인합니다.

---

## Firebase 설정

1. Firebase 콘솔 → Realtime Database → **규칙** 탭에 `database.rules.json` 내용을 붙여넣고 게시합니다.
2. 운영자 UID를 등록합니다.
   - `/drivers/{UID} = true`: 기사 (위치·카운트·핸드오프 등 쓰기)
   - `/admins/{UID} = true`: 관리자 (위 권한 + 구역·공지·화이트리스트 관리)
3. UID는 운영자 모드 → 고급 설정 → 「쓰기 로그인 테스트」에서 확인할 수 있습니다.

자세한 내용은 [`database.rules.README.md`](database.rules.README.md)와 [`SECURITY.md`](SECURITY.md)를 참고하세요.

## 음성 mp3

고급 설정에서 「고품질 음성 파일(mp3) 사용」을 켜면 `audio/` 폴더의 mp3를 먼저 재생합니다.
필요한 파일명과 문구는 [`audio/README.txt`](audio/README.txt)에 있습니다.

## 행사 운영

D-1 점검, OSRM 캐시 워밍, 당일 운영 순서, 사고 대응, 단말 핸드오프 절차는
[`OPERATIONS.md`](OPERATIONS.md)에 정리되어 있습니다.
