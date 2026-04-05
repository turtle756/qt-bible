/**
 * 카드 풀 2차 확장: 250 → 700개 (450개 추가)
 *
 * 목표 카테고리 분포 (700개):
 *   emotion: 120, positive: 110, situation: 110, spiritual: 100
 *   relationship: 75, modern: 70, family: 60, existential: 55
 *
 * 추가 필요:
 *   emotion: +70, positive: +66, situation: +67, spiritual: +58
 *   relationship: +56, modern: +51, family: +42, existential: +40
 */

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'data', 'question-cards.json');
const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
let nextId = 251;

function id() { return `QC${String(nextId++).padStart(3,'0')}`; }

const batch2 = [
  // ================================================================
  // EMOTION 추가 (+70)
  // ================================================================
  // E01 불안/초조 변주
  {id:id(), text:"가슴이 답답하고 숨이 잘 안 쉬어지는 느낌이 드시나요?", cat:"emotion", p:{E01:35,P05:15,E07:15,TH04:20}},
  {id:id(), text:"안 좋은 일이 곧 닥칠 것 같은 불길한 예감이 드시나요?", cat:"emotion", p:{E01:35,E08:15,TH02:20,TH04:10}},
  {id:id(), text:"통제할 수 없는 일에 대해 자꾸 걱정하게 되시나요?", cat:"emotion", p:{E01:30,E07:15,TH02:25,TH15:10}},
  {id:id(), text:"사소한 결정도 불안해서 미루게 되시나요?", cat:"emotion", p:{E01:30,E08:20,TH10:15,TH15:10}},
  {id:id(), text:"잠자리에 누우면 내일 걱정이 밀려오시나요?", cat:"emotion", p:{E01:35,E07:15,TH17:15,E12:-15}},
  // E02 슬픔
  {id:id(), text:"울고 싶은데 눈물이 안 나는 답답함이 있으시나요?", cat:"emotion", p:{E02:30,E03:20,E05:10,TH04:15}},
  {id:id(), text:"예전에 행복했던 기억이 오히려 아프게 느껴지시나요?", cat:"emotion", p:{E02:30,E05:15,E10:10,TH06:15}},
  {id:id(), text:"계절이 바뀔 때마다 마음이 쓸쓸해지시나요?", cat:"emotion", p:{E02:25,E05:15,E03:10,TH04:15,TH17:10}},
  // E03 우울/무기력
  {id:id(), text:"해야 할 일은 많은데 몸이 안 움직여지시나요?", cat:"emotion", p:{E03:35,E07:20,TH17:15,TH04:10}},
  {id:id(), text:"세상이 회색빛으로만 보이는 날이신가요?", cat:"emotion", p:{E03:35,E02:15,E10:15,TH01:15,TH04:15}},
  {id:id(), text:"예전에는 좋아했던 음식도 맛이 없게 느껴지시나요?", cat:"emotion", p:{E03:30,E10:15,P05:10,TH04:15}},
  {id:id(), text:"하루하루가 그냥 흘러가는 것 같으시나요?", cat:"emotion", p:{E03:30,E10:20,TH02:15,TH11:10}},
  // E04 분노/억울
  {id:id(), text:"참고 참다가 갑자기 폭발할 것 같은 날이신가요?", cat:"emotion", p:{E04:35,E07:20,TH15:20,TH08:10}},
  {id:id(), text:"정당한 대우를 받지 못하고 있다고 느끼시나요?", cat:"emotion", p:{E04:30,E09:15,TH03:20,TH20:15}},
  {id:id(), text:"분노를 어떻게 표현해야 할지 모르겠으시나요?", cat:"emotion", p:{E04:25,E08:15,TH15:25,TH08:10}},
  // E05 외로움
  {id:id(), text:"생일이나 기념일에 축하해줄 사람이 없으시나요?", cat:"emotion", p:{E05:35,E02:15,P11:10,TH04:15,TH01:15}},
  {id:id(), text:"카톡 목록을 봐도 연락할 사람이 없다고 느끼시나요?", cat:"emotion", p:{E05:35,E03:10,P11:20,TH19:15}},
  {id:id(), text:"군중 속에서 오히려 더 외로움을 느끼시나요?", cat:"emotion", p:{E05:30,P11:25,E03:10,TH04:15}},
  // E06 죄책감/수치심
  {id:id(), text:"다른 사람 앞에서 나의 진짜 모습을 들킬까 두려우시나요?", cat:"emotion", p:{E06:30,E01:15,P10:10,TH01:20,TH05:10}},
  {id:id(), text:"약속을 지키지 못해 자책하고 계시나요?", cat:"emotion", p:{E06:30,E07:10,TH15:15,TH07:15}},
  {id:id(), text:"가족에게 더 잘해야 하는데 못하고 있다는 미안함이 있나요?", cat:"emotion", p:{E06:30,P02:15,TH14:15,TH01:10}},
  // E07 스트레스
  {id:id(), text:"머리가 지끈거리고 어깨가 뻣뻣하시나요?", cat:"emotion", p:{E07:35,P05:20,TH17:15,E12:-10}},
  {id:id(), text:"한숨이 자꾸 나오시나요?", cat:"emotion", p:{E07:30,E03:15,TH17:20,TH04:10}},
  {id:id(), text:"여유 시간이 생겨도 긴장이 풀리지 않으시나요?", cat:"emotion", p:{E07:35,E01:15,TH17:20,E12:-15}},
  // E08 혼란
  {id:id(), text:"정보가 너무 많아서 오히려 판단이 안 되시나요?", cat:"emotion", p:{E08:30,E07:15,P09:15,TH10:20}},
  {id:id(), text:"맞는 길을 가고 있는지 확신이 없으시나요?", cat:"emotion", p:{E08:35,E01:15,TH02:25,TH04:10}},
  // E09 거절감/배신감
  {id:id(), text:"도움을 요청했는데 거절당한 상처가 남아있나요?", cat:"emotion", p:{E09:30,E05:15,E06:10,TH01:20,TH04:10}},
  {id:id(), text:"내가 먼저 다가가면 항상 손해 보는 것 같나요?", cat:"emotion", p:{E09:25,E04:15,P01:10,TH08:15,TH13:10}},
  // E10 허무/회의
  {id:id(), text:"열심히 노력해도 결과가 안 따라와 허탈하시나요?", cat:"emotion", p:{E10:30,E07:15,P10:15,TH02:20}},
  {id:id(), text:"'이게 다인가' 하는 생각이 불현듯 드시나요?", cat:"emotion", p:{E10:35,E08:15,TH02:20,TH06:15}},
  // 긍정 감정 변주
  {id:id(), text:"오늘 진심으로 웃은 순간이 있으셨나요?", cat:"emotion", py:{E11:25,E14:15,TH16:15,E03:-15}, pn:{E03:15,E05:10,TH16:10}},
  {id:id(), text:"마음이 고요하고 평화로운 순간이 있었나요?", cat:"emotion", py:{E12:30,TH17:20,E01:-15,E07:-15}, pn:{E01:10,E07:15,TH17:10}},
  {id:id(), text:"무언가를 기다리는 설렘이 있으시나요?", cat:"emotion", py:{E13:25,E11:15,TH06:15,E10:-15}, pn:{E10:15,E03:10}},
  {id:id(), text:"사랑하는 사람과 함께여서 행복하시나요?", cat:"emotion", py:{E14:30,E12:15,TH14:15,E05:-20}, pn:{E05:15,TH14:10}},
  {id:id(), text:"최근에 눈물이 날 정도로 감동한 적이 있나요?", cat:"emotion", py:{E15:30,E11:15,TH04:15,E10:-15}, pn:{E10:10,E03:10}},
  // 추가 감정 변주
  {id:id(), text:"마음속에 말 못할 비밀이 있어 무거우시나요?", cat:"emotion", p:{E06:25,E05:20,E07:15,TH07:15}},
  {id:id(), text:"'왜 나한테만 이런 일이' 하는 생각이 드시나요?", cat:"emotion", p:{E04:20,E09:15,E02:15,TH02:20,TH03:10}},
  {id:id(), text:"누군가의 성공 소식에 복잡한 감정이 드시나요?", cat:"emotion", p:{E04:10,P09:20,E06:10,TH16:15,TH15:15}},
  {id:id(), text:"말을 잘못해서 관계가 틀어진 것 같아 후회되시나요?", cat:"emotion", p:{E06:25,P01:15,TH08:15,TH15:10}},
  {id:id(), text:"아무에게도 이해받지 못한다는 느낌이 드시나요?", cat:"emotion", p:{E05:30,E09:15,E03:10,TH04:20,TH01:15}},
  {id:id(), text:"화를 내고 나서 후회하는 패턴이 반복되시나요?", cat:"emotion", p:{E04:20,E06:25,TH15:20,TH07:10}},
  {id:id(), text:"감정 기복이 심해서 나도 나를 모르겠으시나요?", cat:"emotion", p:{E08:25,E04:15,E03:15,TH04:15,TH15:10}},
  {id:id(), text:"누군가에게 의지하고 싶은데 그럴 수 없는 상황인가요?", cat:"emotion", p:{E05:25,E01:15,P01:10,TH04:20}},
  {id:id(), text:"좋은 일이 생겨도 곧 나쁜 일이 올 것 같아 불안한가요?", cat:"emotion", p:{E01:30,E11:-10,TH02:20,TH16:10}},
  {id:id(), text:"나 자신에게 너무 가혹한 것은 아닌지 돌아보신 적 있나요?", cat:"emotion", p:{E06:20,E07:15,TH01:25,TH05:15}},
  {id:id(), text:"억울함을 호소할 곳이 없다고 느끼시나요?", cat:"emotion", p:{E04:25,E09:15,E05:15,TH03:20}},
  {id:id(), text:"마음의 상처가 몸의 증상으로 나타나고 있나요?", cat:"emotion", p:{E07:20,P05:25,E03:10,TH04:15}},
  {id:id(), text:"행복한 척 연기하는 것에 지치셨나요?", cat:"emotion", p:{E03:20,E05:15,E07:20,E06:10,TH04:15}},
  {id:id(), text:"다 때려치우고 어디론가 떠나고 싶으시나요?", cat:"emotion", p:{E07:25,E10:15,E03:10,TH17:20}},

  // ================================================================
  // POSITIVE 추가 (+66)
  // ================================================================
  {id:id(), text:"오늘 하늘이 예쁘다고 느끼신 적 있나요?", cat:"positive", p:{E15:20,E12:15,TH04:10,E07:-10}},
  {id:id(), text:"좋아하는 음악을 들으며 마음이 풀리셨나요?", cat:"positive", p:{E12:25,E15:10,TH09:10,E07:-15}},
  {id:id(), text:"맛있는 음식을 먹으며 행복하셨나요?", cat:"positive", p:{E11:20,E12:10,TH16:15,E03:-10}},
  {id:id(), text:"가족과 함께하는 시간이 소중하게 느껴지셨나요?", cat:"positive", p:{E14:25,E11:15,TH14:15,E05:-15}},
  {id:id(), text:"오늘 누군가에게 칭찬을 받으셨나요?", cat:"positive", py:{E11:20,E13:10,TH01:10,E06:-15}, pn:{E06:5,E09:5}},
  {id:id(), text:"작은 목표를 달성한 성취감이 있으시나요?", cat:"positive", p:{E11:20,E13:15,TH15:10,E10:-10,E03:-10}},
  {id:id(), text:"오늘 웃음을 준 사람이 있으시나요?", cat:"positive", p:{E14:20,E11:15,TH13:10,E05:-15}},
  {id:id(), text:"감사할 것이 3가지 이상 떠오르시나요?", cat:"positive", p:{E11:30,TH16:25,E12:10,E03:-15,E10:-10}},
  {id:id(), text:"기도하면서 평안을 느끼신 적이 오늘 있나요?", cat:"positive", p:{E12:25,TH09:20,TH04:15,E01:-15,P12:-10}},
  {id:id(), text:"산책이나 운동 후 기분이 좋아지셨나요?", cat:"positive", p:{E12:20,E07:-15,P05:-10,TH17:10}},
  {id:id(), text:"오늘 새로운 것을 배우거나 발견하셨나요?", cat:"positive", p:{E13:20,TH10:15,E11:10,E10:-10}},
  {id:id(), text:"어려운 상황에서도 감사를 찾을 수 있으시나요?", cat:"positive", p:{E11:25,TH16:20,TH02:15,E03:-10}},
  {id:id(), text:"하나님이 나를 지켜주셨다고 느낀 적이 있나요?", cat:"positive", p:{E15:25,TH04:25,TH02:15,E01:-15}},
  {id:id(), text:"칭찬이나 격려의 말을 누군가에게 해주셨나요?", cat:"positive", p:{E14:20,TH13:15,E11:10,E05:-10}},
  {id:id(), text:"아이의 웃음이나 순수함에 치유받으셨나요?", cat:"positive", cond:{any_of:["S05"]}, p:{E14:25,E12:15,TH14:10,E07:-15}},
  {id:id(), text:"찬양 가사가 마음에 박혀 하루종일 울려퍼지나요?", cat:"positive", p:{E15:25,TH09:20,E12:15,P12:-15}},
  {id:id(), text:"말씀 한 구절이 오늘 하루를 버티게 해주었나요?", cat:"positive", p:{E13:20,TH10:25,TH04:15,E03:-10}},
  {id:id(), text:"힘든 시간 후에 더 단단해졌다고 느끼시나요?", cat:"positive", p:{E13:20,TH15:20,TH02:15,E03:-10}},
  {id:id(), text:"봉사하면서 받는 것보다 주는 기쁨을 느끼셨나요?", cat:"positive", p:{E14:20,TH13:25,E11:15,E10:-15}},
  {id:id(), text:"공동체 안에서 소속감을 느끼셨나요?", cat:"positive", p:{TH19:20,E14:15,E12:10,E05:-20,P12:-10}},
  {id:id(), text:"어제보다 오늘이 조금 나아졌다고 느끼시나요?", cat:"positive", p:{E13:20,E11:15,TH06:10,E03:-15}},
  {id:id(), text:"하나님의 타이밍이 완벽했다고 느낀 경험이 있나요?", cat:"positive", p:{E15:25,TH02:25,E13:15,E08:-10}},
  {id:id(), text:"용기를 내서 한 행동이 좋은 결과로 돌아왔나요?", cat:"positive", p:{E11:20,E13:15,TH11:15,E01:-10}},
  {id:id(), text:"크고 작은 기적을 경험하셨나요?", cat:"positive", p:{E15:30,TH02:20,TH04:15,E10:-15}},
  {id:id(), text:"오랜만에 연락한 사람과의 대화가 따뜻했나요?", cat:"positive", p:{E14:20,E12:10,TH13:10,E05:-15}},
  {id:id(), text:"내 삶의 방향이 맞다는 확신이 드시나요?", cat:"positive", py:{E13:25,TH02:20,E12:15,E08:-20}, pn:{E08:15,TH02:15}},
  {id:id(), text:"하나님의 사랑이 구체적으로 느껴지시나요?", cat:"positive", py:{TH01:25,E14:20,TH04:20,P12:-15}, pn:{P12:10,TH01:15}},
  {id:id(), text:"최근 용서할 수 있게 된 관계가 있나요?", cat:"positive", py:{TH08:25,E12:20,P01:-15,E04:-15}, pn:{E04:10,P01:10,TH08:10}},
  {id:id(), text:"고난 속에서도 하나님의 선하심을 발견하셨나요?", cat:"positive", py:{TH02:25,E15:20,E13:15,E10:-15}, pn:{E10:15,TH02:15}},
  {id:id(), text:"오늘 누군가를 위해 진심으로 기도하셨나요?", cat:"positive", p:{TH09:20,TH13:15,E14:15,E05:-10}},
  {id:id(), text:"내가 변하고 있다는 걸 느끼시나요?", cat:"positive", py:{TH11:20,E13:20,E11:10,E10:-15}, pn:{E10:15,E08:10,TH11:10}},
  {id:id(), text:"어둠 속에서도 한 줄기 빛이 보이시나요?", cat:"positive", p:{E13:25,TH06:20,TH04:15,E03:-15,E10:-10}},
  {id:id(), text:"몸이 건강하다는 것이 감사하시나요?", cat:"positive", p:{E11:25,TH16:15,P05:-10,E03:-5}},
  {id:id(), text:"오늘 배운 말씀을 실천하고 싶은 마음이 있나요?", cat:"positive", p:{TH11:20,TH10:15,E13:10,P12:-10}},
  {id:id(), text:"내 약함 속에서 하나님의 강함을 경험하셨나요?", cat:"positive", p:{TH04:25,E15:20,TH02:15,E03:-10}},
  {id:id(), text:"오늘 평범한 일상 속에서 하나님의 손길을 보셨나요?", cat:"positive", p:{TH04:20,E15:15,E11:15,TH16:10,E10:-10}},
  {id:id(), text:"누군가에게 용기를 주는 말을 해주셨나요?", cat:"positive", p:{TH13:15,E14:20,E11:10,E05:-10}},
  {id:id(), text:"내일이 기대되시나요?", cat:"positive", py:{E13:30,E11:15,TH06:10,E01:-15,E10:-10}, pn:{E01:10,E10:15,TH02:10}},
  // 긍정 나머지
  {id:id(), text:"최근에 깊은 대화를 나눈 후 마음이 가벼워지셨나요?", cat:"positive", p:{E12:20,E14:15,TH19:10,E05:-15}},
  {id:id(), text:"성경 속 인물에게서 위로를 받으신 적이 있나요?", cat:"positive", p:{E15:20,TH10:15,E13:10,E03:-10}},
  {id:id(), text:"하나님 앞에서 울어본 적이 최근에 있나요?", cat:"positive", py:{E15:25,TH04:25,TH09:15,E03:-10}, pn:{E03:10,P12:10}},
  {id:id(), text:"어려운 결정을 내린 후 평안이 찾아왔나요?", cat:"positive", p:{E12:25,TH02:15,TH10:10,E08:-15}},
  {id:id(), text:"최근에 자연 속에서 창조주를 느끼셨나요?", cat:"positive", p:{E15:20,TH04:15,E12:15,E07:-10}},
  {id:id(), text:"오늘 가장 감사한 한 가지는 무엇인가요?", cat:"positive", p:{E11:30,TH16:20,E12:10,E10:-10}},

  // ================================================================
  // SITUATION 추가 (+67)
  // ================================================================
  // 직장
  {id:id(), text:"승진이나 인사에 대한 불안이 있으시나요?", cat:"situation", cond:{any_of:["S09"]}, p:{P03:30,P10:20,E01:20,E07:10}},
  {id:id(), text:"상사의 부당한 지시에 갈등하고 계시나요?", cat:"situation", cond:{any_of:["S09"]}, p:{P03:25,E04:20,E06:10,TH03:15,TH11:10}},
  {id:id(), text:"직장 내 따돌림이나 소외를 경험하고 계시나요?", cat:"situation", cond:{any_of:["S09"]}, p:{P03:25,E09:25,E05:15,P01:10,TH04:15}},
  {id:id(), text:"재택근무로 일과 생활의 경계가 무너졌나요?", cat:"situation", cond:{any_of:["S09"]}, p:{P03:25,E07:25,TH17:15,P09:10}},
  {id:id(), text:"이직을 고민하고 있지만 용기가 나지 않나요?", cat:"situation", cond:{any_of:["S09"]}, p:{P03:20,E08:25,E01:15,TH02:15}},
  // 학업
  {id:id(), text:"공부해도 성적이 오르지 않아 좌절하시나요?", cat:"situation", cond:{any_of:["S10","S11"]}, p:{P03:30,P10:25,E10:15,TH02:15}},
  {id:id(), text:"학교에서 친구 관계가 힘드시나요?", cat:"situation", cond:{any_of:["S10"]}, p:{P03:15,P01:25,E05:20,E09:10,TH13:10}},
  {id:id(), text:"과제나 리포트 마감에 쫓기고 계시나요?", cat:"situation", cond:{any_of:["S10"]}, p:{P03:30,E07:25,E01:15,TH15:10}},
  // 재정
  {id:id(), text:"카드값 명세서를 보기가 두려우시나요?", cat:"situation", p:{P04:35,E01:20,E06:10,TH15:15}},
  {id:id(), text:"물가가 올라 장보기가 부담되시나요?", cat:"situation", p:{P04:25,E07:15,E01:10,TH16:15,TH02:10}},
  {id:id(), text:"투자 손실로 마음이 무거우시나요?", cat:"situation", p:{P04:35,E01:20,E06:15,TH02:20}},
  {id:id(), text:"급전이 필요한 상황에 놓여 계시나요?", cat:"situation", p:{P04:40,E01:30,E07:15,TH04:15}},
  // 건강
  {id:id(), text:"원인 모를 증상으로 병원에 가야 할지 고민되시나요?", cat:"situation", p:{P05:30,E01:25,TH04:15}},
  {id:id(), text:"약을 먹으면서 부작용이 걱정되시나요?", cat:"situation", p:{P05:25,E01:20,E07:10,TH02:10}},
  {id:id(), text:"수술이나 시술을 앞두고 두려우시나요?", cat:"situation", p:{P05:35,E01:30,E02:10,TH04:20,TH02:10}},
  {id:id(), text:"가족의 간병으로 체력적으로 한계이신가요?", cat:"situation", cond:{any_of:["S06"]}, p:{P05:20,P02:25,E07:30,TH13:10,TH17:10}},
  // 상실/애도
  {id:id(), text:"고인의 유품을 정리하기가 어려우시나요?", cat:"situation", p:{P06:35,E02:30,E05:10,TH06:15}},
  {id:id(), text:"장례 후에도 일상이 돌아오지 않는 느낌이시나요?", cat:"situation", p:{P06:30,E02:25,E03:15,TH04:15,TH17:10}},
  // 환경변화
  {id:id(), text:"전학이나 전근으로 모든 것이 낯설기만 한가요?", cat:"situation", p:{P07:35,E05:20,E01:15,TH04:15}},
  {id:id(), text:"결혼 후 달라진 생활에 적응하기 힘드시나요?", cat:"situation", cond:{any_of:["S01"]}, p:{P07:30,P01:15,E07:15,TH14:15}},
  {id:id(), text:"코로나 이후 삶의 패턴이 완전히 달라져서 힘드시나요?", cat:"situation", p:{P07:25,P11:15,E07:15,TH02:15}},
  // 중독/트라우마
  {id:id(), text:"음주량이 조절이 안 되시나요?", cat:"situation", p:{P08:35,E06:20,TH15:20,TH07:15}},
  {id:id(), text:"특정 상황이 되면 과거의 공포가 되살아나시나요?", cat:"situation", p:{P08:35,E01:25,TH04:20,TH01:10}},
  {id:id(), text:"누군가를 믿기가 어려우시나요?", cat:"situation", p:{P08:20,E09:25,P01:15,TH01:15,TH08:10}},
  // 복합 상황
  {id:id(), text:"돈을 벌어야 하는데 건강이 안 따라주시나요?", cat:"situation", p:{P04:20,P05:25,E07:15,E01:15,TH04:15}},
  {id:id(), text:"비자나 체류 문제로 불안하시나요?", cat:"situation", p:{P07:25,E01:30,P03:15,TH02:15}},
  {id:id(), text:"집안일이 산더미인데 도와주는 사람이 없나요?", cat:"situation", p:{E07:25,P02:20,E04:10,E05:10,TH17:10}},
  {id:id(), text:"이웃과의 층간소음 갈등으로 스트레스이시나요?", cat:"situation", p:{P01:20,E04:20,E07:15,TH08:10,TH17:10}},
  {id:id(), text:"교통사고나 사건 후유증으로 힘드시나요?", cat:"situation", p:{P08:25,E01:25,P05:15,TH04:15}},
  {id:id(), text:"정년이 다가와 불안하시나요?", cat:"situation", cond:{any_of:["S09"]}, p:{P07:25,E01:20,E10:15,TH02:15,TH06:10}},
  {id:id(), text:"전세/월세 만기가 다가와 걱정이시나요?", cat:"situation", p:{P04:30,P07:20,E01:20,TH02:10}},
  {id:id(), text:"자격증이나 시험 결과를 기다리는 중이신가요?", cat:"situation", p:{E01:25,P03:20,P10:15,TH02:15}},
  {id:id(), text:"혼자 아이를 키우는 것이 버거우시나요?", cat:"situation", cond:{any_of:["S04","S05"]}, p:{P02:35,E07:25,E05:15,TH01:15,TH04:10}},
  {id:id(), text:"사업이 어려워 밤잠을 설치시나요?", cat:"situation", cond:{any_of:["S16"]}, p:{P04:30,P03:25,E01:25,E07:15,TH02:15}},
  {id:id(), text:"통증 때문에 집중하기가 어려우시나요?", cat:"situation", p:{P05:30,E07:20,E03:10,TH17:15}},
  // 일상 상황 변주
  {id:id(), text:"출퇴근 시간이 너무 길어서 지치시나요?", cat:"situation", cond:{any_of:["S09"]}, p:{E07:25,P03:15,TH17:15,E03:10}},
  {id:id(), text:"소음이나 환경 문제로 집에서도 쉬지 못하시나요?", cat:"situation", p:{E07:25,P05:10,TH17:15,E01:10}},

  // ================================================================
  // SPIRITUAL 추가 (+58)
  // ================================================================
  {id:id(), text:"하나님이 침묵하시는 것 같아 답답하시나요?", cat:"spiritual", p:{P12:30,E08:20,TH04:20,TH09:10,E13:-10}},
  {id:id(), text:"성경의 약속이 내게는 적용되지 않는 것 같나요?", cat:"spiritual", p:{E08:20,P12:20,TH02:20,TH05:15,TH01:15}},
  {id:id(), text:"기도할 말이 떠오르지 않으시나요?", cat:"spiritual", p:{P12:25,E03:15,TH09:15,TH12:10,TH04:15}},
  {id:id(), text:"설교를 들어도 마음에 와닿지 않으시나요?", cat:"spiritual", p:{P12:30,E10:15,TH10:-10,TH09:10}},
  {id:id(), text:"영적으로 정체되어 있다는 느낌이 드시나요?", cat:"spiritual", p:{P12:25,E10:20,TH11:15,TH12:10}},
  {id:id(), text:"은혜가 감사보다 당연하게 느껴지시나요?", cat:"spiritual", p:{TH05:15,TH16:-10,P12:15,E10:10,TH07:10}},
  {id:id(), text:"죄를 반복하면서 회개의 진정성을 의심하시나요?", cat:"spiritual", p:{E06:25,TH07:25,TH05:15,P08:10}},
  {id:id(), text:"다른 크리스천과 나를 비교하며 주눅 드시나요?", cat:"spiritual", p:{P09:15,E06:20,P12:15,TH01:15,TH11:10}},
  {id:id(), text:"교회 갈등 때문에 하나님까지 멀어진 것 같나요?", cat:"spiritual", p:{P12:35,P01:15,E04:10,TH19:-15,TH04:15}},
  {id:id(), text:"헌금 액수로 신앙을 판단하는 분위기가 불편한가요?", cat:"spiritual", p:{P12:25,E04:15,P04:10,TH03:15,TH20:10}},
  {id:id(), text:"목사님의 설교가 정치적이라고 느끼시나요?", cat:"spiritual", p:{P12:20,E04:15,P11:15,TH10:10,TH20:10}},
  {id:id(), text:"교회 내 세대 차이로 갈등을 느끼시나요?", cat:"spiritual", p:{P12:20,P11:20,P01:10,TH19:15,TH08:10}},
  {id:id(), text:"찬양팀/봉사팀 안에서 인간관계가 힘드시나요?", cat:"spiritual", p:{P12:20,P01:20,E07:15,TH19:10,TH08:10}},
  {id:id(), text:"신앙의 확신이 흔들리는 순간이 있으시나요?", cat:"spiritual", p:{E08:25,P12:20,TH02:20,TH05:15}},
  {id:id(), text:"기독교인으로서 사회적 편견을 느끼시나요?", cat:"spiritual", p:{E09:15,P11:20,TH18:10,TH20:15,TH11:10}},
  {id:id(), text:"선교/전도의 부르심을 느끼지만 두려우시나요?", cat:"spiritual", p:{TH18:25,E01:20,E06:10,TH11:15}},
  {id:id(), text:"영적 전쟁을 체감하고 계시나요?", cat:"spiritual", p:{TH12:30,E01:20,TH09:15,TH04:10}},
  {id:id(), text:"성령의 은사가 무엇인지 혼란스러우시나요?", cat:"spiritual", p:{TH12:20,E08:20,TH18:10,TH10:10}},
  {id:id(), text:"금식기도를 하고 싶지만 엄두가 안 나시나요?", cat:"spiritual", p:{TH09:15,TH15:15,E06:10,TH11:15}},
  {id:id(), text:"교회를 옮기고 싶은 마음이 있으시나요?", cat:"spiritual", p:{P12:30,P01:10,E08:15,TH19:15}},
  {id:id(), text:"결혼이나 이성 문제로 하나님 뜻을 구하고 계시나요?", cat:"spiritual", cond:{any_of:["S02","S03"]}, p:{E08:20,TH02:20,TH14:20,E01:15}},
  {id:id(), text:"이단이나 사이비에 대한 두려움이 있으시나요?", cat:"spiritual", p:{E01:15,TH10:20,TH12:15,TH03:10}},
  {id:id(), text:"기도 응답이 '아니오'일 수 있다는 것이 두려우시나요?", cat:"spiritual", p:{E01:20,TH09:15,TH02:25,E08:10}},
  {id:id(), text:"신앙 선배(멘토)가 필요하다고 느끼시나요?", cat:"spiritual", p:{TH11:15,TH19:15,E05:10,E08:10,TH10:10}},
  {id:id(), text:"말씀 묵상이 습관이 아닌 의무처럼 느껴지시나요?", cat:"spiritual", p:{P12:25,TH10:-10,E07:10,TH11:15}},
  {id:id(), text:"고난이 하나님의 훈련이라는 말이 위로가 안 되시나요?", cat:"spiritual", p:{E04:15,P12:15,TH02:15,TH03:15,TH01:15}},
  {id:id(), text:"하나님을 향한 첫사랑의 열정이 식었다고 느끼시나요?", cat:"spiritual", p:{P12:30,E10:15,TH09:15,TH11:15,TH04:10}},
  {id:id(), text:"주일 외에는 하나님을 잘 생각하지 않게 되시나요?", cat:"spiritual", p:{P12:20,TH04:-10,TH11:15,TH09:10}},
  {id:id(), text:"천국에 대한 소망이 실감나시나요?", cat:"spiritual", py:{TH06:25,E13:20,E15:10,E10:-10}, pn:{E10:10,TH06:15,E08:10}},
  {id:id(), text:"십자가의 의미가 머리로만 이해되시나요?", cat:"spiritual", p:{TH05:20,E08:15,P12:10,TH04:15}},
  {id:id(), text:"세례/침례를 받은 후 삶이 변했다고 느끼시나요?", cat:"spiritual", py:{TH11:20,E13:15,TH05:15,P12:-10}, pn:{P12:15,E08:10,TH11:10}},

  // ================================================================
  // RELATIONSHIP 추가 (+56)
  // ================================================================
  {id:id(), text:"친구의 뒷담화를 들어서 마음이 아프시나요?", cat:"relationship", p:{E09:25,E04:15,P01:20,TH08:15}},
  {id:id(), text:"모임에서 나만 겉도는 느낌이 드시나요?", cat:"relationship", p:{E05:25,E09:15,P11:15,TH19:10,TH04:10}},
  {id:id(), text:"오래된 친구와 연락이 끊긴 것이 아쉬우시나요?", cat:"relationship", p:{E02:20,E05:20,TH13:10,TH08:10}},
  {id:id(), text:"직장에서 팀워크가 안 맞아 힘드시나요?", cat:"relationship", cond:{any_of:["S09"]}, p:{P01:25,P03:20,E07:15,TH08:10,TH15:10}},
  {id:id(), text:"시댁/처가와의 관계가 명절마다 스트레스이시나요?", cat:"relationship", cond:{any_of:["S01"]}, p:{P01:30,P02:15,E07:20,TH15:15}},
  {id:id(), text:"자녀의 반항에 마음이 아프시나요?", cat:"relationship", cond:{any_of:["S05"]}, p:{P02:25,E02:15,E04:15,TH14:20,TH15:10}},
  {id:id(), text:"배우자의 습관이 점점 참기 어려워지시나요?", cat:"relationship", cond:{any_of:["S01"]}, p:{P01:30,E04:20,TH14:15,TH15:15}},
  {id:id(), text:"사과를 했는데 상대가 받아주지 않아 힘드시나요?", cat:"relationship", p:{P01:25,E02:15,E09:15,TH08:20}},
  {id:id(), text:"주변 사람들의 기대에 부응하지 못해 미안하시나요?", cat:"relationship", p:{E06:25,P01:15,P10:10,TH01:15,TH15:10}},
  {id:id(), text:"소개팅이나 만남에 대한 압박을 느끼시나요?", cat:"relationship", cond:{any_of:["S02"]}, p:{P01:15,P10:15,E01:15,TH14:10,TH02:10}},
  {id:id(), text:"형제자매와의 갈등이 해결되지 않고 있나요?", cat:"relationship", p:{P01:25,P02:15,E04:15,TH08:20,TH14:10}},
  {id:id(), text:"상대방의 변화를 기다리는 것이 지치시나요?", cat:"relationship", p:{P01:20,E07:15,E10:10,TH15:20,TH08:10}},
  {id:id(), text:"신뢰가 깨진 관계를 회복할 수 있을지 모르겠나요?", cat:"relationship", p:{P01:25,E08:15,E09:15,TH08:25,TH01:10}},
  {id:id(), text:"다른 사람의 감정에 너무 공감해서 지치시나요?", cat:"relationship", p:{E07:25,P01:10,TH13:10,TH17:15,TH15:10}},
  {id:id(), text:"거절을 잘 못해서 관계에서 소진되시나요?", cat:"relationship", p:{E07:20,P01:15,E06:10,TH15:20,TH20:10}},
  {id:id(), text:"SNS에서 차단/언팔당한 후 마음이 신경쓰이시나요?", cat:"relationship", p:{E09:20,P09:15,E05:10,TH01:10}},
  {id:id(), text:"연인과 신앙관의 차이로 고민 중이시나요?", cat:"relationship", cond:{any_of:["S03"]}, p:{P01:20,E08:20,TH14:20,TH11:10}},
  {id:id(), text:"가족 중 비신자 때문에 마음이 아프시나요?", cat:"relationship", p:{P02:20,E02:15,TH18:15,TH09:15,TH01:10}},
  {id:id(), text:"진짜 나를 아는 사람이 한 명도 없다고 느끼시나요?", cat:"relationship", p:{E05:35,P11:20,TH04:20,TH19:10}},
  {id:id(), text:"관계 속에서 상처를 주고도 모르고 지나간 적 있나요?", cat:"relationship", p:{E06:20,P01:15,TH08:15,TH13:10}},
  {id:id(), text:"소그룹 나눔에서 솔직하지 못한 내가 답답하시나요?", cat:"relationship", p:{E06:15,P11:15,P12:10,TH19:15,TH13:10}},
  {id:id(), text:"주변의 충고가 잔소리처럼 느껴지시나요?", cat:"relationship", p:{E04:20,P01:10,TH15:15,TH10:10}},
  {id:id(), text:"부모님이 나를 이해해주지 않는다고 느끼시나요?", cat:"relationship", p:{P02:20,E09:15,E04:10,TH14:15,TH08:10}},
  {id:id(), text:"약속을 자꾸 깨는 사람 때문에 실망하셨나요?", cat:"relationship", p:{E09:20,E04:15,P01:15,TH15:10,TH08:10}},

  // ================================================================
  // MODERN 추가 (+51)
  // ================================================================
  {id:id(), text:"하루에 스마트폰 사용 시간이 5시간 이상이시나요?", cat:"modern", p:{P09:35,E06:10,TH15:15,TH17:-10}},
  {id:id(), text:"온라인 댓글이나 반응에 일희일비하시나요?", cat:"modern", p:{P09:25,E01:15,E09:10,TH01:10,TH15:10}},
  {id:id(), text:"AI나 기술 발전이 내 직업을 위협한다고 느끼시나요?", cat:"modern", p:{P10:25,E01:20,P03:15,TH02:15}},
  {id:id(), text:"실시간 알림이 없으면 불안하시나요?", cat:"modern", p:{P09:30,E01:15,TH15:10,TH17:-10}},
  {id:id(), text:"SNS 속 완벽한 가정을 보면 내 가족이 부끄러우시나요?", cat:"modern", p:{P09:25,P02:15,E06:15,TH14:10,TH16:10}},
  {id:id(), text:"'좋아요' 수에 내 가치가 좌우되는 느낌이시나요?", cat:"modern", p:{P09:30,P10:15,E06:10,TH01:20}},
  {id:id(), text:"세상의 속도를 따라가기 힘드시나요?", cat:"modern", p:{P10:25,E07:20,E08:10,TH17:15}},
  {id:id(), text:"경쟁 사회에서 나만 뒤처지고 있다는 초조함이 있나요?", cat:"modern", p:{P10:30,P09:15,E01:15,TH05:10,TH02:10}},
  {id:id(), text:"집값이나 부동산 문제로 미래가 막막하시나요?", cat:"modern", p:{P04:25,P10:20,E01:20,TH02:15}},
  {id:id(), text:"'N포 세대'라는 말에 공감이 되시나요?", cat:"modern", p:{P10:30,E10:20,E03:10,TH06:15,TH02:10}},
  {id:id(), text:"정치 뉴스를 보면 분노나 무력감이 드시나요?", cat:"modern", p:{P11:25,E04:15,E10:10,TH03:15,TH20:15}},
  {id:id(), text:"온라인과 오프라인에서 나의 모습이 다르시나요?", cat:"modern", p:{P09:20,P11:15,E06:15,TH01:15,TH15:10}},
  {id:id(), text:"가짜뉴스와 진짜 뉴스를 구별하기 어려우시나요?", cat:"modern", p:{P11:20,E08:20,TH10:15,TH03:10}},
  {id:id(), text:"결혼이나 출산에 대한 사회적 압력이 부담되시나요?", cat:"modern", cond:{any_of:["S02"]}, p:{P10:20,P01:10,E04:10,TH14:10,TH02:10}},
  {id:id(), text:"환경오염이나 기후변화가 걱정되시나요?", cat:"modern", p:{E01:15,TH20:20,E10:10,TH02:10}},
  {id:id(), text:"비대면 예배가 편하지만 뭔가 빠진 느낌이시나요?", cat:"modern", p:{P12:15,P11:15,TH19:15,TH09:10}},
  {id:id(), text:"유튜브 목사/강사의 말에 혼란을 느끼시나요?", cat:"modern", p:{E08:20,P11:10,TH10:15,P12:10}},
  {id:id(), text:"디지털 디톡스가 필요하다고 느끼시나요?", cat:"modern", p:{P09:30,TH15:15,TH17:15,E07:10}},
  {id:id(), text:"메타버스나 가상세계에 빠져들고 있으시나요?", cat:"modern", p:{P09:25,P08:15,E05:10,TH15:10}},
  {id:id(), text:"온라인 쇼핑이 습관적으로 되시나요?", cat:"modern", p:{P09:20,P04:15,P08:10,TH15:15,E06:10}},
  {id:id(), text:"사회가 양극화되고 있다는 불안감이 있으시나요?", cat:"modern", p:{P11:25,E01:15,TH20:15,TH03:10}},
  {id:id(), text:"성별이나 세대 갈등이 신앙공동체에도 영향을 미치나요?", cat:"modern", p:{P11:20,P12:15,TH19:10,TH08:10,TH20:10}},
  {id:id(), text:"취업 시장이 너무 경쟁적이라 숨이 막히시나요?", cat:"modern", cond:{any_of:["S12"]}, p:{P10:30,P03:20,E07:15,E01:15}},
  {id:id(), text:"번아웃 사회에서 쉼의 의미를 잃어버리셨나요?", cat:"modern", p:{E07:20,P10:15,TH17:25,TH15:10,E12:-10}},
  {id:id(), text:"한국 사회의 서열 문화가 교회에서도 느껴지시나요?", cat:"modern", p:{P12:20,P11:15,E04:10,TH19:10,TH03:10}},

  // ================================================================
  // FAMILY 추가 (+42)
  // ================================================================
  {id:id(), text:"자녀의 학교 성적 때문에 마음이 조급하시나요?", cat:"family", cond:{any_of:["S05"]}, p:{P02:25,P10:20,E01:15,TH14:10,TH02:10}},
  {id:id(), text:"부부 사이에 대화보다 침묵이 더 많아졌나요?", cat:"family", cond:{any_of:["S01"]}, p:{P01:30,E05:20,TH14:20,TH08:10}},
  {id:id(), text:"가족 중 아무도 내 고민을 모르는 것 같으시나요?", cat:"family", p:{E05:25,P02:15,P11:10,TH04:15,TH14:10}},
  {id:id(), text:"부모님의 노화를 지켜보는 것이 아프시나요?", cat:"family", p:{P02:20,E02:20,P05:10,TH06:15,TH01:10}},
  {id:id(), text:"가족의 기대가 부담스러우시나요?", cat:"family", p:{P02:25,P10:15,E07:15,TH14:10,TH15:10}},
  {id:id(), text:"형제자매 간 비교로 마음이 힘드시나요?", cat:"family", p:{P02:20,P09:15,E09:15,TH01:15,TH14:10}},
  {id:id(), text:"결혼 후 양가 문화 차이로 갈등이 있나요?", cat:"family", cond:{any_of:["S01"]}, p:{P01:25,P02:15,E07:15,TH14:15,TH08:10}},
  {id:id(), text:"자녀의 진로 문제로 부부 의견이 다르시나요?", cat:"family", cond:{any_of:["S01","S05"]}, p:{P02:20,P01:20,E08:10,TH14:15,TH10:10}},
  {id:id(), text:"독거 부모님이 걱정되시나요?", cat:"family", p:{P02:25,E01:15,P05:10,TH14:15,TH13:10}},
  {id:id(), text:"자녀와 대화가 안 통한다고 느끼시나요?", cat:"family", cond:{any_of:["S05"]}, p:{P02:25,E05:15,P01:15,TH14:15,TH08:10}},
  {id:id(), text:"가족 행사나 명절 준비가 체력적으로 힘드시나요?", cat:"family", p:{P02:15,E07:25,TH17:10,TH14:10}},
  {id:id(), text:"가정예배를 하고 싶은데 시작이 어려우시나요?", cat:"family", p:{P02:10,TH09:15,TH14:15,E06:10,TH11:10}},
  {id:id(), text:"반려동물의 건강이 걱정되시나요?", cat:"family", p:{E01:15,E02:10,P05:10,TH01:10,TH04:10}},
  {id:id(), text:"유산이나 상속 문제로 가족 갈등이 있나요?", cat:"family", p:{P04:20,P01:25,P02:15,E04:15,TH08:10}},
  {id:id(), text:"자녀가 신앙에 관심이 없어 마음이 아프시나요?", cat:"family", cond:{any_of:["S05"]}, p:{P02:25,E02:15,TH18:15,TH14:15,TH09:10}},
  {id:id(), text:"시험기간 자녀를 지켜보는 것이 더 힘드시나요?", cat:"family", cond:{any_of:["S05"]}, p:{P02:20,E01:20,P10:10,TH14:10,TH02:10}},
  {id:id(), text:"싱글로 살면서 외로움과 자유 사이에서 갈등하시나요?", cat:"family", cond:{any_of:["S02"]}, p:{E05:20,E08:15,TH14:10,TH02:10,E12:10}},

  // ================================================================
  // EXISTENTIAL 추가 (+40)
  // ================================================================
  {id:id(), text:"나이가 들면서 죽음에 대한 생각이 잦아지시나요?", cat:"existential", p:{E01:15,E02:10,TH06:25,TH02:15,TH03:10}},
  {id:id(), text:"세상이 점점 살기 힘들어진다고 느끼시나요?", cat:"existential", p:{E10:20,P11:15,TH20:15,TH02:15,TH06:10}},
  {id:id(), text:"내가 세상에 어떤 흔적을 남기고 있는지 모르겠나요?", cat:"existential", p:{E10:25,E08:15,TH11:15,TH18:10}},
  {id:id(), text:"인생의 2막을 어떻게 시작해야 할지 모르겠나요?", cat:"existential", p:{E08:25,E10:15,P07:10,TH02:20,TH11:10}},
  {id:id(), text:"신앙과 현실 사이의 괴리감을 느끼시나요?", cat:"existential", p:{E08:20,P12:15,TH10:15,TH20:15,TH11:10}},
  {id:id(), text:"고통에도 의미가 있다는 말을 믿기 어려우시나요?", cat:"existential", p:{E04:10,E10:15,TH02:25,TH03:15,TH06:10}},
  {id:id(), text:"자유의지와 하나님의 주권 사이에서 혼란스러우신가요?", cat:"existential", p:{E08:25,TH02:25,TH10:15,TH03:10}},
  {id:id(), text:"기도가 운명을 바꿀 수 있다고 믿으시나요?", cat:"existential", py:{TH09:20,TH02:20,E13:15,E01:-10}, pn:{E08:15,TH02:15,TH09:10}},
  {id:id(), text:"왜 선한 사람이 고통받아야 하는지 이해가 안 되시나요?", cat:"existential", p:{TH03:25,E04:15,E08:15,TH02:20}},
  {id:id(), text:"내 삶의 시즌이 바뀌고 있다고 느끼시나요?", cat:"existential", p:{E08:15,P07:15,E13:10,TH02:15,TH06:10}},
  {id:id(), text:"과거의 나와 현재의 나 사이에 단절감이 있나요?", cat:"existential", p:{E08:20,E10:15,E02:10,TH02:10}},
  {id:id(), text:"'정상적인 삶'이 무엇인지 모르겠으시나요?", cat:"existential", p:{E08:25,P10:15,E10:10,TH10:10,TH02:10}},
  {id:id(), text:"하나님의 계획과 내 바람이 다를 때 어떻게 하시나요?", cat:"existential", p:{E08:20,TH02:25,TH11:15,E01:10}},
  {id:id(), text:"삶의 불확실성이 견디기 어려우시나요?", cat:"existential", p:{E01:25,E08:15,TH02:25,TH04:10}},
  {id:id(), text:"나만의 소명이나 사명이 뭔지 아직 모르겠나요?", cat:"existential", p:{E08:25,E10:10,TH11:20,TH18:10,TH02:10}},
  {id:id(), text:"지금 겪는 시련이 언제 끝날지 보이지 않으시나요?", cat:"existential", p:{E01:20,E10:15,E07:10,TH06:20,TH15:15}},
  {id:id(), text:"평범한 삶도 의미가 있을까 고민되시나요?", cat:"existential", p:{E10:20,TH16:15,TH02:15,TH11:10}},
  {id:id(), text:"가치관이 흔들리는 시기를 보내고 계시나요?", cat:"existential", p:{E08:30,TH10:15,TH02:15,P12:10}},
  {id:id(), text:"세상 끝에서 하나님을 만난다면 무슨 말을 하고 싶으시나요?", cat:"existential", p:{TH06:15,TH04:15,E15:10,TH07:10,TH01:10}},
  {id:id(), text:"역사 속 하나님의 개입을 믿기 어려우시나요?", cat:"existential", p:{E08:15,TH02:20,TH03:10,TH10:15}},
  {id:id(), text:"종교 다원주의 속에서 기독교의 유일성이 흔들리시나요?", cat:"existential", p:{E08:20,TH10:20,TH05:15,P12:10}},
  {id:id(), text:"'하나님이 존재한다면 왜 이런 세상인가' 생각하시나요?", cat:"existential", p:{E08:20,TH02:20,TH03:20,E04:10}},
  {id:id(), text:"나의 고통이 다른 사람에게 위로가 될 수 있을까요?", cat:"existential", py:{TH13:20,E13:15,TH02:10,E10:-10}, pn:{E10:15,E03:10,TH02:10}},
];

// 카드 정규화
const finalCards = batch2.map(c => {
  const card = {
    id: c.id,
    text: c.text,
    category: c.cat,
    condition: c.cond || null,
    weight_target: {}
  };

  const payloadObj = c.p || c.py || {};
  const sorted = Object.entries(payloadObj)
    .filter(([k,v]) => v > 0)
    .sort((a,b) => b[1]-a[1])
    .slice(0, 2);
  sorted.forEach(([tag, val]) => {
    card.weight_target[tag] = val >= 30 ? 1.0 : 0.5;
  });

  if (c.p) card.payload = c.p;
  if (c.py) card.payload_yes = c.py;
  if (c.pn) card.payload_no = c.pn;

  return card;
});

existing.cards = [...existing.cards, ...finalCards];
existing.meta.total_cards = existing.cards.length;

fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), 'utf8');

// 통계
console.log(`\n=== 카드 풀 2차 확장 결과 ===`);
console.log(`총 카드: ${existing.cards.length}개`);

const cats = {};
existing.cards.forEach(c => { cats[c.category] = (cats[c.category] || 0) + 1; });
console.log('\n카테고리 분포:');
Object.entries(cats).sort((a,b) => b[1]-a[1]).forEach(([c,n]) => console.log(`  ${c}: ${n}`));

const tagCov = {};
existing.cards.forEach(c => {
  const p = c.payload || c.payload_yes || {};
  for (const tag of Object.keys(p)) {
    tagCov[tag] = (tagCov[tag] || 0) + 1;
  }
});
const allTags = [
  ...Array.from({length:15}, (_,i) => 'E'+String(i+1).padStart(2,'0')),
  ...Array.from({length:12}, (_,i) => 'P'+String(i+1).padStart(2,'0')),
  ...Array.from({length:20}, (_,i) => 'TH'+String(i+1).padStart(2,'0'))
];
const uncovered = allTags.filter(t => !tagCov[t]);
console.log(`\n태그 커버리지: ${allTags.length - uncovered.length}/${allTags.length}`);
if (uncovered.length) console.log(`미커버: ${uncovered.join(', ')}`);
else console.log('미커버: 없음 (100%)');

const minCov = allTags.map(t => [t, tagCov[t]||0]).sort((a,b) => a[1]-b[1]).slice(0,5);
console.log('\n가장 약한 5개:');
minCov.forEach(([t,n]) => console.log(`  ${t}: ${n}회`));
const maxCov = allTags.map(t => [t, tagCov[t]||0]).sort((a,b) => b[1]-a[1]).slice(0,5);
console.log('\n가장 강한 5개:');
maxCov.forEach(([t,n]) => console.log(`  ${t}: ${n}회`));
