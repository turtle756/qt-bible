# DailyQT 데이터 태깅 현황 (2026-04-05)

## 요약

| 항목 | 완료 | 미완료 | 비고 |
|------|------|--------|------|
| topics-db.json 토픽 태깅 | **102/102** | 0 | soft_tags (E,P,TH,C,D) |
| 가이드 파일 블록 태깅 | **78/78** | 0 | 11,650개 블록 |
| 가이드 파일 미생성 | - | **24개** | 아래 목록 참조 |
| curricula-all.json | 0 | 139 | 태깅 불필요 (메타데이터) |
| topic-tree.json | 0 | 1 | 태깅 불필요 (UI 트리) |
| onboarding-quiz.json | 0 | 1 | 태깅 불필요 (퀴즈) |

---

## 태깅 완료 — topics-db.json (102개 토픽)

모든 토픽에 `soft_tags` 필드 추가됨. 태그 종류:
- E01~E15 (감정), P01~P12 (상황 압박), TH01~TH20 (신학 주제)
- C01~C04 (콘텐츠 분위기), D01~D03 (난이도/감정강도/분량)

## 태깅 완료 — 가이드 파일 (78개, 2,340일, 11,650블록)

각 day의 `common`, `exploring`, `growing`, `close`, `centered` 블록에:
- `soft_tags`: 토픽 기본 태그 + 성숙도별 분위기/난이도 보정
- `allowed_maturity`: 해당 블록 노출 대상 성숙도
- `passage_meta`: 본문 참조 파싱 (testament, genre, chapter, verse)
- `is_crisis`: 위기 플래그

| # | 파일 | 토픽명 | 상태 |
|---|------|--------|------|
| 1 | qt-guides-topic1.json | 불안과 두려움 극복 | OK |
| 2 | qt-guides-topic2.json | 자존감 회복 | OK |
| 3 | qt-guides-topic3.json | 분노 다스리기 | OK |
| 4 | qt-guides-topic4.json | 상실과 슬픔 속 위로 | OK |
| 5 | qt-guides-topic5.json | 외로움에서 하나님의 동행 발견 | OK |
| 6 | qt-guides-topic6.json | 용서하는 삶 | OK |
| 7 | qt-guides-topic7.json | 기도의 능력 | OK |
| 8 | qt-guides-topic8.json | 감사의 삶 | OK |
| 9 | qt-guides-topic9.json | 리더십과 섬김 | OK |
| 10 | qt-guides-topic10.json | 재정과 청지기 의식 | OK |
| 11 | qt-guides-topic11.json | 두려움 | OK |
| 12 | qt-guides-topic12.json | 우울 | OK |
| 13 | qt-guides-topic13.json | 슬픔 | OK |
| 14 | qt-guides-topic14.json | 스트레스 | OK |
| 15 | qt-guides-topic15.json | 수치심 | OK |
| 16 | qt-guides-topic16.json | 죄책감 | OK |
| 17 | qt-guides-topic17.json | 고독/소외 | OK |
| 18 | qt-guides-topic18.json | 질병 | OK |
| 19 | qt-guides-topic19.json | 사별 | OK |
| 20 | qt-guides-topic20.json | 중독 | OK |
| 21 | qt-guides-topic21.json | 시험/입시 | OK |
| 22 | qt-guides-topic22.json | 예배 | OK |
| 23 | qt-guides-topic23.json | 영적 전쟁 | OK |
| 24 | qt-guides-topic24.json | 회개 | OK |
| 25 | qt-guides-topic25.json | 사랑 | OK |
| 26 | qt-guides-topic26.json | 겸손 | OK |
| 27 | qt-guides-topic27.json | 인내 | OK |
| 28 | qt-guides-topic28.json | 지혜 | OK |
| 29 | qt-guides-topic29.json | 부부 갈등 | OK |
| 30 | qt-guides-topic30.json | 직장 생활 | OK |
| 31 | qt-guides-topic31.json | 이혼 | OK |
| 32 | qt-guides-topic32.json | 고부 갈등 | OK |
| 33 | qt-guides-topic33.json | 화해 | OK |
| 34 | qt-guides-topic34.json | 혼란 | OK |
| 35 | qt-guides-topic35.json | 거절감 | OK |
| 36 | qt-guides-topic36.json | 질투 | OK |
| 37 | qt-guides-topic37.json | 원망과 후회 | OK |
| 38 | qt-guides-topic38.json | 배신과 상처 | OK |
| 39 | qt-guides-topic39.json | 연애와 결혼 | OK |
| 40 | qt-guides-topic40.json | 경계선 설정 | OK |
| 41 | qt-guides-topic41.json | 학대/폭력 피해 | OK |
| 42 | qt-guides-topic42.json | 장애 | OK |
| 43 | qt-guides-topic43.json | 성령 충만 | OK |
| 44 | qt-guides-topic44.json | 금식 | OK |
| 45 | qt-guides-topic45.json | 헌신 | OK |
| 46 | qt-guides-topic46.json | 제자도 | OK |
| 47 | qt-guides-topic47.json | 순종 | OK |
| 48 | qt-guides-topic48.json | 전도/선교 | OK |
| 49 | qt-guides-topic49.json | 부모자녀 (부모 시점) | OK |
| 50 | qt-guides-topic50.json | 부모자녀 (자녀 시점) | OK |
| 51 | qt-guides-topic51.json | 친구 관계 | OK |
| 52 | qt-guides-topic52.json | 직장 동료 | OK |
| 53 | qt-guides-topic53.json | 노화 | OK |
| 54 | qt-guides-topic54.json | 실직과 구직 | OK |
| 55 | qt-guides-topic55.json | 재정 위기 | OK |
| 56 | qt-guides-topic56.json | 교회 안에서 | OK |
| 57 | qt-guides-topic57.json | 말씀 묵상 | OK |
| 58 | qt-guides-topic58.json | 은사 활용 | OK |
| 61 | qt-guides-topic61.json | 이단 분별 | OK |
| 65 | qt-guides-topic65.json | 성실 | OK |
| 67 | qt-guides-topic67.json | 사고/트라우마 | OK |
| 69 | qt-guides-topic69.json | 군대/병역 | OK |
| 70 | qt-guides-topic70.json | 임신과 출산 | OK |
| 71 | qt-guides-topic71.json | 이사/새출발 | OK |
| 72 | qt-guides-topic72.json | 은퇴 | OK |
| 76 | qt-guides-topic76.json | 하나님 음성 듣기 | OK |
| 77 | qt-guides-topic77.json | 영적 침체 | OK |
| 79 | qt-guides-topic79.json | 자비와 긍휼 | OK |
| 80 | qt-guides-topic80.json | 관용 | OK |
| 81 | qt-guides-topic81.json | 온유 | OK |
| 82 | qt-guides-topic82.json | 용기 | OK |
| 83 | qt-guides-topic83.json | 절제 | OK |
| 84 | qt-guides-topic84.json | 정직 | OK |
| 85 | qt-guides-topic85.json | 충성 | OK |
| 86 | qt-guides-topic86.json | 순결 | OK |
| 91 | qt-guides-topic91.json | 만족/자족 | OK |
| 94 | qt-guides-topic94.json | 건강 관리 | OK |
| 98 | qt-guides-topic98.json | 사회 참여 | OK |

---

## 미생성 가이드 파일 (24개)

이 토픽들은 topics-db.json에 태깅은 완료됐지만 가이드 JSON 파일이 아직 없음.

| # | 토픽명 | 카테고리 |
|---|--------|----------|
| 59 | 섬김 | 신앙 성장 |
| 60 | 사랑 | 삶의 지혜 |
| 62 | 관용 → topic80 존재 | 삶의 지혜 |
| 63 | 온유 → topic81 존재 | 삶의 지혜 |
| 64 | 인내 → topic27 존재 | 삶의 지혜 |
| 66 | 절제 → topic83 존재 | 삶의 지혜 |
| 68 | 정직 → topic84 존재 | 삶의 지혜 |
| 73 | 기쁨 | 삶의 지혜 |
| 74 | 소망 | 삶의 지혜 |
| 75 | 평화 | 삶의 지혜 |
| 78 | 직장과 소명 → topic30 존재 | 삶의 지혜 |
| 87 | 은혜 | 신학/교리 |
| 88 | 믿음 | 신학/교리 |
| 89 | 칭의 | 신학/교리 |
| 90 | 예수의 신성과 인성 | 신학/교리 |
| 92 | 부활 | 신학/교리 |
| 93 | 기독론적 중보 | 신학/교리 |
| 95 | 교회의 본질 | 신학/교리 |
| 96 | 영적 양자됨 | 신학/교리 |
| 97 | 언약 신학 | 신학/교리 |
| 99 | 하나님의 주권 | 신학/교리 |
| 100 | 원죄론 | 신학/교리 |
| 101 | 삼위일체 | 신학/교리 |
| 102 | 종말과 심판 | 신학/교리 |

**참고**: 62,63,64,66,68,78은 다른 번호로 동일 토픽 가이드가 이미 존재 (번호 불일치).
실제 미생성은 **18개**: 59,60,73,74,75,87,88,89,90,92,93,95,96,97,99,100,101,102

---

## 기타 데이터 파일 (태깅 불필요)

| 파일 | 용도 | 태깅 필요 |
|------|------|-----------|
| curricula-all.json | 커리큘럼 메타데이터 (139개) | 불필요 |
| curricula.json / curricula-extended.json | 이전 버전 (curricula-all로 통합됨) | 불필요 |
| topic-tree.json | 온보딩 UI 트리 구조 | 불필요 |
| onboarding-quiz.json | 온보딩 퀴즈 (성숙도 측정) | 불필요 |
| _temp_*.json (4개) | 임시 파일 | 불필요 (삭제 가능) |
