# DailyQT (dailyqt.xyz) 프로젝트 현황

## 프로젝트 정보
- **GitHub**: https://github.com/turtle756/qt-bible
- **배포**: Railway (dailyqt.xyz)
- **스택**: Node.js + Express + PostgreSQL + Passport.js (Google OAuth) + OpenAI API
- **프로젝트 경로**: C:\Users\rlarl\qt-bible

## 완료된 기능
1. **3개국어 성경 비교** — 한국어(개역한글) / English(KJV,WEB) / 원어(히브리어 WLCa, 그리스어 TISCH)
2. **Google 로그인 필수** — 비로그인 시 login.html로 리다이렉트
3. **유저별 데이터 분리** — DB user_id FK 기반
4. **계정 삭제** — CASCADE로 모든 데이터 삭제
5. **Strong's 팝업** — 영어/원어 단어 클릭 시 한국어 뜻 + 영어 뜻 + 원어 + 음역 + 신학적 노트
6. **Strong's 번호 기반 한국어 사전** — strongs-ko.json (현재 ~3,171개 등록)
7. **인터리니어 뷰** — 원어 컬럼 토글, 단어별 카드 (원어+음역+뜻)
8. **SOAP 묵상 노트** — S/O/A/P 4탭, 클라우드 저장
9. **QT 캘린더** — 월별 QT 실천 추적
10. **읽기 계획** — 1년 통독, 신약 90일, 시편 30일
11. **소그룹 나눔** — 그룹 생성/참여(초대코드), 묵상 공유, 🙏 반응
12. **AI 묵상 도우미** — GPT-4o-mini (배경설명/묵상질문/원어뉘앙스)
13. **원어 단어 전체 용례 검색** — Strong's 번호로 성경 전체 검색
14. **구절 하이라이팅** — 우클릭 4색, DB 저장
15. **다크모드, 키보드 단축키, 스크롤 동기화**

## 진행 중: 사전 작업 (가장 중요)
- **목표**: Strong's 14,298개 전체에 한국어 뜻 + 신학적 노트 등록
- **현재**: ~4,598개 완료 (히브리어 2,215, 그리스어 2,372) → **32.2%**
- **파일**: `public/strongs-ko.json`
- **구조**: `"H430": { "ko": "하나님, 신", "note": "엘로힘. 복수형이나 참 하나님에게 단수로 사용" }`
- **원칙**: 정확성 최우선. GPT 자동번역 X. 수작업 검증.
- **폴백**: 미등록 번호는 KO_DICT(영어→한국어 매핑 700개)로 폴백, 그것도 없으면 "영어 뜻 (한국어 미등록)" 표시
- **완료 범위**: 히브리어 H1~H3419 / 그리스어 G25~G2859 (빈출+중빈출 위주, 희귀 고유명사 일부 생략)
- **다음 시작점**: 히브리어 H3420~ / 그리스어 G2860~

## 사전 작업 진행 방법
1. bolls.life BDBT API로 Strong's 항목 확인: `https://bolls.life/dictionary-definition/BDBT/H번호/`
2. short_definition + definition 참고하여 정확한 한국어 뜻 작성
3. 성경에서의 용법, 신학적 뉘앙스가 있으면 note 필드에 기록
4. 동음이의/다의어는 반드시 구분 (예: H2490 할랄 = ①속되게하다 ②시작하다)
5. 유사 단어 간 차이 명시 (예: H157 아하브 vs G25 아가파오 vs G5368 필레오)
6. 한국어 성경(개역한글/개역개정)의 번역과 비교 검증

## Railway 환경변수
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CALLBACK_URL, SESSION_SECRET, NODE_ENV, DATABASE_URL, OPENAI_API_KEY

## API 사용
- **성경 텍스트**: bolls.life (KRV, KJV, WEB, WLCa, TISCH)
- **Strong's 사전**: bolls.life BDBT dictionary
- **AI**: OpenAI GPT-4o-mini
