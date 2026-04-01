# DailyQT (dailyqt.xyz) 프로젝트 현황

## 프로젝트 정보
- **GitHub**: https://github.com/turtle756/qt-bible
- **배포**: Railway (dailyqt.xyz)
- **스택**: Node.js + Express + PostgreSQL + Passport.js (Google OAuth)
- **프로젝트 경로**: C:\Users\rlarl\qt-bible

## 완료된 기능
1. **3개국어 성경 비교** — 한국어(개역한글) / English(KJV,WEB) / 원어(히브리어,그리스어)
2. **Google 로그인 필수** — 비로그인 시 login.html로 리다이렉트
3. **Strong's 팝업** — 단어 클릭 시 한국어 뜻 + 영어 뜻 + 원어 + 음역 + 신학적 노트
4. **Strong's 한국어 사전** — 14,298개 100% 완료 (2026-03-31)
5. **인터리니어 뷰** — 원어 컬럼 토글, 단어별 카드
6. **구절 하이라이팅** — 우클릭 4색, DB 저장
7. **다크모드, 키보드 단축키**

## 개인화 QT 시스템 (2026-04-01 구축)
8. **온보딩** — 듀오링고 스타일 12문항 설문 → 4단계 분류 → 주제 선택 → 플랜 생성
9. **3탭 구조** — QT(메인) / 성경 / 나눔
10. **QT 탭** — 오늘의 배너 + 본문 미니뷰어 + 4단계 가이드 + 성숙도별 묵상 노트 + QT 캘린더
11. **성숙도별 묵상** — 입문(질문식) / 초급(SOAP) / 중급(귀납적) / 심화(렉시오 디비나)
12. **건너뛴 날 처리** — 이어하기형(B) + 건너뛰기 옵션
13. **나눔 탭** — 익명 피드 (묵상 나눔 + 기도제목 + "기도합니다" 반응)
14. **설정** — 묵상 단계 변경 (프로필)
15. **모바일 대응** — 하단 탭바, 성경 탭 언어 전환(한국어/English/원어)

## 데이터
- **주제 DB**: 140개 주제 × 8구절 매핑 (`public/data/topics-db.json`)
- **커리큘럼**: 10개 주제 × 7/14/30일 플랜 (`public/data/curricula.json`)
- **온보딩 설문**: 12문항 + 점수 로직 (`public/data/onboarding-quiz.json`)
- **QT 가이드**: 주제1 불안 30일 완성 (`public/data/qt-guides-topic1.json`)
- **딥리서치 결과**: 30개 배치 전부 완료 (`prompts/completed/batch01-30`)

## 다음 작업
- [ ] batch04-30 docx → JSON 추출 및 합병 (주제 2-10 가이드 데이터)
- [ ] 커스텀 아이콘 교체 (나노바나나 → SVG)
- [ ] 로그인 페이지 개선
- [ ] 성경 탭 모바일 UX 고도화

## Railway 환경변수
- GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, CALLBACK_URL, SESSION_SECRET, NODE_ENV, DATABASE_URL
