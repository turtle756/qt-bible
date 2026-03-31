# 개인화 QT 시스템 구현 계획

## 작업 순서
1. [x] 딥리서치 데이터 → JSON 정제 (topics-db.json, curricula.json, onboarding-quiz.json)
2. [x] DB 스키마 추가 (onboarding_profiles, custom_plans, topic_progress)
3. [x] 서버 API 추가 (온보딩 저장, 플랜 생성, 오늘의 QT)
4. [x] 온보딩 UI (onboarding.html)
5. [x] index.html 온보딩 리다이렉트 연동
6. [x] 오늘의 QT 메인 화면 통합
7. [x] 진행 추적 (캘린더/스트릭 연동)
8. [ ] 커스텀 아이콘 교체 (나노바나나 등)

## 파일 구조
```
public/
  data/
    topics-db.json       ← 120개 주제 × 8구절 매핑
    curricula.json       ← 10개 주제 × 7/14/30일 플랜
    onboarding-quiz.json ← 12문항 설문
  onboarding.html        ← 듀오링고 스타일 온보딩 UI
  index.html             ← 기존 + 오늘의 QT 패널 추가
server.js                ← API 추가
```
