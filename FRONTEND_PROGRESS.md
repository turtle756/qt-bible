# 프론트엔드 V2 구현 진행 상황

## 작업 목록

### 1. 온보딩 V2 ✅ (onboarding-v2.html)
- [x] Step 1: 닉네임 입력 (필수)
- [x] Step 2: 성숙도 선택 (필수)
- [x] Step 3: 개인정보 (선택, 전체 패스 가능)
- [x] Step 4: 기질검사 안내 → 시작/스킵
- [x] Step 4a: 27문항 기질검사 (0~4점 척도)
- [x] Step 5: 결과 화면 → QT 시작
- [x] server.js /onboarding 라우트 → onboarding-v2.html로 변경

### 2. QT 메인 화면 (index.html V2 API 연결) — 진행 중
**핵심 교체 포인트**: index.html의 `loadTodayQt()` 함수 (line ~2475)
- 기존: `GET /api/today-qt` → V1 플랜 기반
- 교체: `GET /api/v2/daily-qt` → 모듈형 조립 결과
- 관련 함수: `loadQtGuide()`, `loadQtScripture()`, `showEmptyState()`

**완료:**
- [x] loadTodayQt() → V2 API 교체 (GET /api/v2/daily-qt)
- [x] renderV2Slots() — 5슬롯 렌더링 (해설/원어/질문/기도)
- [x] bolls.life API로 본문 텍스트 로드 (기존 loadQtScripture 재활용)
- [x] 질문 카드 4개 UI (loadDailyCards → GET /api/v2/daily-cards)
- [x] 카드 선택 → respondCard() → POST /api/v2/card-response
- [x] QT 완료 → qt-complete API (completeTodayQt → POST /api/v2/qt-complete)

### 3. 기존 기능 유지
- [ ] 성경 탭 (bolls.life) — 이미 작동 중
- [ ] 노트/하이라이트 — 이미 작동 중
- [ ] 캘린더 — 이미 작동 중

## API 엔드포인트 매핑
- GET /api/v2/onboarding → 온보딩 상태 확인
- POST /api/v2/onboarding → 개인정보 저장
- POST /api/v2/onboarding/temperament → 기질검사 결과
- GET /api/v2/daily-qt → QT 조립
- GET /api/v2/daily-cards → 질문 카드 4개
- POST /api/v2/card-response → 카드 선택
- POST /api/v2/qt-complete → QT 완료
- GET /api/v2/liturgical/today → 교회력
- GET /api/v2/profile → 프로필

## 디자인 토큰 (기존 유지)
- --primary: #6C63FF
- --primary-light: #8B83FF
- --primary-bg: #F0EEFF
- 폰트: Noto Sans KR
- 카드 border-radius: 20px
- 애니메이션: slideUp 0.4s
