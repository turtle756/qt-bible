# DailyQT 세션 상태 (2026-04-05)

## 프로젝트 개요
개인화된 성경 QT 웹앱. 사용자별 63개 소프트 태그 기반 수학적 매칭.
"같은 본문이라도 사용자 감정/기질에 따라 다른 해설/질문/기도 조합 제공"
- GitHub: https://github.com/turtle756/qt-bible
- 배포: Railway (dailyqt.xyz)
- 스택: Node.js + Express + PostgreSQL + Vanilla JS + Google OAuth

## 완료된 백엔드
- 태그 시스템 63개 소프트 + 하드 필터 (TAG_SYSTEM_V2.md)
- 스코어링 엔진 lib/scoring.js (가중치 내적 + 시간 감쇠 + 가중치 랜덤)
- 교회력 엔진 lib/liturgical.js
- 독립 콘텐츠 풀 39,610개 (public/data/pools/)
- 질문 카드 583개 (question-cards.json)
- 온보딩 27문항 기질검사 (temperament-quiz.json)
- 1,753개 페리코페 (bible-passages-seed.json)
- DB 테이블 V2 6개 추가
- API V2 11개 엔드포인트
- 보안 (helmet + rate-limit)
- 콘텐츠 생성 명세서 (CONTENT_SPEC.md)

## 완료된 프론트엔드
- 온보딩 V2 UI (onboarding-v2.html) — 5단계
- QT 화면 V2 API 연결 (index.html) — 5슬롯 렌더링 + 질문카드 4개

## 미완료
- P0: completeTodayQt() V2 교체, 로컬 서버 테스트
- P1: 미생성 가이드 18개, Railway 배포 + DB 마이그레이션
- P2: 톤별 콘텐츠 대량 생성 (CONTENT_SPEC.md), 교회력→QT 연동
