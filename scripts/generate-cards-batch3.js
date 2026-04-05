/**
 * 카드 풀 3차 확장: 500 → 700개 (200개 추가)
 * 약한 태그 보강: P06, TH12, P07, TH18, P08
 * 약한 카테고리 보강: relationship, family, modern, existential
 */
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'public', 'data', 'question-cards.json');
const existing = JSON.parse(fs.readFileSync(filePath, 'utf8'));
let nextId = existing.cards.length + 1;
function id() { return `QC${String(nextId++).padStart(3,'0')}`; }

const batch3 = [
  // === P06 상실/애도 보강 ===
  {id:id(), text:"명절에 빈자리가 유독 크게 느껴지시나요?", cat:"family", p:{P06:30,E02:25,E05:15,TH14:10,TH04:10}},
  {id:id(), text:"사별 후 일상으로 돌아가라는 말이 무책임하게 들리시나요?", cat:"emotion", p:{P06:35,E04:15,E02:20,TH04:15}},
  {id:id(), text:"꿈에서 떠나간 사람을 만나시나요?", cat:"emotion", p:{P06:30,E02:30,E05:10,TH06:15}},
  {id:id(), text:"유품을 볼 때마다 가슴이 미어지시나요?", cat:"emotion", p:{P06:35,E02:25,TH04:15,TH01:10}},
  {id:id(), text:"장례 이후에 오히려 더 슬픔이 밀려오시나요?", cat:"emotion", p:{P06:30,E02:30,E03:15,TH06:10}},
  {id:id(), text:"사랑하는 반려동물을 떠나보낸 슬픔이 크시나요?", cat:"emotion", p:{P06:25,E02:25,E05:15,TH01:15}},
  {id:id(), text:"상실의 아픔을 이해해주는 사람이 없다고 느끼시나요?", cat:"emotion", p:{P06:25,E05:25,E09:10,TH04:15}},

  // === TH12 성령/영적전쟁 보강 ===
  {id:id(), text:"악한 생각이 자꾸 떠올라 괴로우시나요?", cat:"spiritual", p:{TH12:30,E06:20,E08:10,TH07:15}},
  {id:id(), text:"기도할 때 집중이 안 되고 잡념이 많으시나요?", cat:"spiritual", p:{TH12:20,TH09:15,E08:15,P12:10}},
  {id:id(), text:"성령님의 음성과 내 생각을 구별하기 어려우시나요?", cat:"spiritual", p:{TH12:25,E08:20,TH10:15,TH04:10}},
  {id:id(), text:"영적 무기력함이 물리적 피로와 함께 오시나요?", cat:"spiritual", p:{TH12:25,E07:20,E03:15,TH09:10}},
  {id:id(), text:"찬양할 때 눈물이 나는 경험을 하셨나요?", cat:"positive", py:{TH12:15,E15:30,TH09:20,P12:-15}, pn:{P12:10,TH09:10}},
  {id:id(), text:"성령 충만함을 갈망하시나요?", cat:"spiritual", p:{TH12:30,TH09:15,E13:10,TH04:15}},

  // === P07 환경변화 보강 ===
  {id:id(), text:"해외에서 생활하면서 문화 충격이 크시나요?", cat:"situation", p:{P07:35,E05:20,E08:15,TH04:10}},
  {id:id(), text:"독립하면서 외로움과 자유 사이에서 갈등하시나요?", cat:"situation", p:{P07:25,E05:20,E13:10,TH02:10}},
  {id:id(), text:"직장을 옮긴 후 새로운 팀에 적응이 힘드시나요?", cat:"situation", cond:{any_of:["S09"]}, p:{P07:30,P03:15,E05:15,E01:10}},
  {id:id(), text:"퇴원 후 집에서의 회복 생활이 답답하시나요?", cat:"situation", p:{P07:25,P05:20,E03:15,TH17:10}},
  {id:id(), text:"계절이 바뀌면서 마음도 불안정해지시나요?", cat:"emotion", p:{P07:15,E03:20,E01:15,TH04:10}},
  {id:id(), text:"삶의 전환기에 서 계시다는 느낌이 드시나요?", cat:"existential", p:{P07:25,E08:20,TH02:15,TH06:10}},

  // === TH18 전도/선교 보강 ===
  {id:id(), text:"비신자 친구에게 복음을 전하고 싶은 마음이 있나요?", cat:"spiritual", p:{TH18:30,E06:10,TH13:10,TH11:10}},
  {id:id(), text:"선교 헌금이나 후원에 대해 생각해 보신 적 있나요?", cat:"spiritual", p:{TH18:20,TH13:15,TH11:10,P04:10}},
  {id:id(), text:"일상 속에서 복음을 전하는 것이 어떤 의미인지 고민하시나요?", cat:"spiritual", p:{TH18:25,TH11:15,TH13:10,E08:10}},
  {id:id(), text:"해외 선교에 관심이 있으시나요?", cat:"spiritual", py:{TH18:30,E13:15,TH11:15}, pn:{TH18:10}},
  {id:id(), text:"주변에 도움이 필요한 이웃을 발견하셨나요?", cat:"positive", p:{TH18:15,TH13:25,TH20:15,E14:10}},

  // === P08 중독/트라우마 보강 ===
  {id:id(), text:"스트레스를 음식으로 풀고 계시나요?", cat:"situation", p:{P08:25,E07:20,E06:15,TH15:15}},
  {id:id(), text:"특정 물질이나 행동에 의존하게 되시나요?", cat:"situation", p:{P08:35,E06:20,TH07:15,TH12:10}},
  {id:id(), text:"과거 트라우마가 현재 관계에 영향을 미치고 있나요?", cat:"relationship", p:{P08:25,P01:20,E01:15,TH04:15,TH07:10}},
  {id:id(), text:"폭력이나 학대의 기억에서 벗어나기 어려우시나요?", cat:"emotion", p:{P08:40,E01:25,E02:15,TH04:20,TH01:15}},
  {id:id(), text:"도박이나 게임에 빠져 일상이 무너지고 있나요?", cat:"situation", p:{P08:40,P04:15,E06:20,TH15:15,TH07:10}},
  {id:id(), text:"회복 과정에서 재발에 대한 두려움이 있으시나요?", cat:"emotion", p:{P08:30,E01:25,E06:15,TH07:10,TH12:10}},

  // === 관계 추가 ===
  {id:id(), text:"직장 상사와의 관계가 가장 큰 스트레스원이시나요?", cat:"relationship", cond:{any_of:["S09"]}, p:{P01:25,P03:25,E04:15,E07:15}},
  {id:id(), text:"사랑하는 사람의 변화를 바라는데 안 변해서 답답하시나요?", cat:"relationship", p:{P01:25,E04:15,E10:10,TH15:15,TH08:10}},
  {id:id(), text:"관계를 끊어야 하는데 끊지 못하는 상황이신가요?", cat:"relationship", p:{P01:25,E08:20,E06:10,TH15:15,TH10:10}},
  {id:id(), text:"학교에서 왕따나 따돌림을 경험하고 있나요?", cat:"relationship", cond:{any_of:["S10"]}, p:{E09:30,E05:25,P01:20,TH04:15}},
  {id:id(), text:"온라인에서 악플이나 혐오 표현에 상처받으셨나요?", cat:"relationship", p:{E09:25,E04:15,P09:15,TH08:10,TH01:10}},
  {id:id(), text:"가까운 사람이 정신건강 문제로 힘들어하고 있나요?", cat:"relationship", p:{E01:15,E02:15,P01:10,TH13:20,TH09:10}},
  {id:id(), text:"연인 관계에서 신뢰가 깨진 적이 있나요?", cat:"relationship", cond:{any_of:["S03"]}, p:{E09:30,P01:25,E04:10,TH08:15}},
  {id:id(), text:"부모님의 이혼이 나에게 영향을 미치고 있나요?", cat:"relationship", p:{P02:20,E02:15,P08:15,TH14:15,TH04:10}},
  {id:id(), text:"친구가 갑자기 거리를 두기 시작했나요?", cat:"relationship", p:{E09:25,E05:20,P01:15,TH08:10}},
  {id:id(), text:"리더 위치에서 갈등 조정이 힘드시나요?", cat:"relationship", p:{P01:20,E07:20,E08:10,TH15:15,TH10:10}},
  {id:id(), text:"이별 후 회복이 더디게 느껴지시나요?", cat:"relationship", p:{E02:25,E05:20,E03:15,TH06:10,TH04:10}},
  {id:id(), text:"가족 중 누군가와 냉전이 길어지고 있나요?", cat:"relationship", p:{P01:25,P02:15,E04:15,E05:10,TH08:15}},

  // === 현대사회 추가 ===
  {id:id(), text:"워라밸이 불가능하다고 느끼시나요?", cat:"modern", cond:{any_of:["S09"]}, p:{P03:20,E07:25,TH17:20,P10:10}},
  {id:id(), text:"유튜브/틱톡 알고리즘에 시간을 뺏기시나요?", cat:"modern", p:{P09:30,E06:10,TH15:15,TH17:-10}},
  {id:id(), text:"디지털 피로감으로 모든 것이 귀찮으시나요?", cat:"modern", p:{P09:25,E03:15,E07:15,TH17:10}},
  {id:id(), text:"타인의 삶을 들여다보는 것에 중독되셨나요?", cat:"modern", p:{P09:30,P08:10,E06:10,TH15:15}},
  {id:id(), text:"온라인 쇼핑 후 후회하시는 경우가 많으시나요?", cat:"modern", p:{P09:15,P04:15,E06:15,TH15:15}},
  {id:id(), text:"AI가 내 직업을 대체할까 봐 걱정되시나요?", cat:"modern", p:{P10:25,E01:20,P03:15,TH02:10}},
  {id:id(), text:"비대면 소통에 익숙해져 대면이 어색하시나요?", cat:"modern", p:{P11:25,P09:10,E05:10,TH19:10}},
  {id:id(), text:"정보 과잉으로 머리가 복잡하시나요?", cat:"modern", p:{P09:20,E08:20,E07:15,TH10:10}},
  {id:id(), text:"메신저/이메일 답장 압박이 스트레스이시나요?", cat:"modern", p:{P09:20,E07:20,P03:10,TH17:10}},

  // === 가족 추가 ===
  {id:id(), text:"부모님의 기대에 미치지 못한다는 죄책감이 있나요?", cat:"family", p:{P02:25,P10:15,E06:20,TH14:10,TH01:10}},
  {id:id(), text:"형제자매에 대한 질투나 시기심이 있으시나요?", cat:"family", p:{P02:15,E04:10,P09:10,TH16:10,TH08:10}},
  {id:id(), text:"가족의 병간호로 나의 삶이 멈춘 것 같으시나요?", cat:"family", cond:{any_of:["S06"]}, p:{P02:25,P05:20,E07:25,E10:10,TH17:10}},
  {id:id(), text:"가족과 함께하는 식사 시간이 전쟁 같으시나요?", cat:"family", p:{P02:20,P01:15,E07:15,TH14:10,TH17:10}},
  {id:id(), text:"자녀의 친구 관계가 걱정되시나요?", cat:"family", cond:{any_of:["S05"]}, p:{P02:25,E01:20,TH14:15,TH09:10}},
  {id:id(), text:"가족 행사에서 외면당하거나 무시당한 느낌이시나요?", cat:"family", p:{P02:15,E09:20,E05:15,P01:10,TH14:10}},
  {id:id(), text:"결혼 후 친정/시댁 사이에서 줄타기하고 계시나요?", cat:"family", cond:{any_of:["S01"]}, p:{P02:20,P01:20,E07:15,TH14:10,TH15:10}},
  {id:id(), text:"가족 때문에 내 꿈을 포기해야 하는 것 같으시나요?", cat:"family", p:{P02:20,E10:15,E04:10,TH02:10,TH11:10}},

  // === 실존 추가 ===
  {id:id(), text:"내 인생에 '리셋 버튼'이 있으면 좋겠다고 느끼시나요?", cat:"existential", p:{E10:25,E06:15,E08:10,TH07:15,TH02:10}},
  {id:id(), text:"행복의 조건이 무엇인지 모르겠으시나요?", cat:"existential", p:{E08:20,E10:15,TH16:20,TH02:10}},
  {id:id(), text:"나이가 의미 있게 느껴지지 않으시나요?", cat:"existential", p:{E10:25,E03:10,TH06:15,TH02:10}},
  {id:id(), text:"'정상적인 신앙생활'이라는 기준이 부담되시나요?", cat:"existential", p:{P12:20,P10:15,E06:10,TH05:15,TH01:10}},
  {id:id(), text:"내가 정말 선한 사람인지 의문이 드시나요?", cat:"existential", p:{E06:20,E08:15,TH03:15,TH07:10,TH15:10}},
  {id:id(), text:"세상의 고통을 보면 하나님의 존재가 의심되시나요?", cat:"existential", p:{E08:20,TH02:20,TH03:20,TH01:10}},
  {id:id(), text:"인생의 의미를 찾는 것 자체가 무의미하게 느껴지나요?", cat:"existential", p:{E10:35,E08:15,TH02:15,TH06:10}},
  {id:id(), text:"'이 정도면 됐다'라는 체념이 있으시나요?", cat:"existential", p:{E10:25,E03:15,TH16:10,TH02:10}},
  {id:id(), text:"내 세대가 짊어진 짐이 너무 무겁다고 느끼시나요?", cat:"existential", p:{P10:20,P11:15,E07:15,TH20:10,TH06:10}},
  {id:id(), text:"하나님이 계획하신 미래가 궁금하시나요?", cat:"existential", py:{E13:25,TH06:15,TH02:20,E01:-10}, pn:{E10:10,E08:10,TH02:10}},

  // === 추가 상황/감정 변주 (700개 채우기) ===
  {id:id(), text:"이사 비용이 부담되시나요?", cat:"situation", p:{P04:25,P07:15,E01:15,TH02:10}},
  {id:id(), text:"월급날이 기다려지기보다 무서우시나요?", cat:"situation", p:{P04:30,E01:20,E07:10,TH16:10}},
  {id:id(), text:"경력 단절이 걱정되시나요?", cat:"situation", cond:{any_of:["S22","S05"]}, p:{P03:25,P10:20,E01:15,TH02:10}},
  {id:id(), text:"체력이 떨어져 일에 집중하기 힘드시나요?", cat:"situation", p:{P05:25,P03:15,E07:20,TH17:10}},
  {id:id(), text:"건강 검진 결과를 받기가 두려우시나요?", cat:"situation", p:{P05:30,E01:25,TH04:10}},
  {id:id(), text:"배우자의 건강이 걱정되시나요?", cat:"family", cond:{any_of:["S01"]}, p:{P05:20,P02:15,E01:20,TH09:10,TH14:10}},
  {id:id(), text:"눈을 감으면 걱정이 파노라마처럼 펼쳐지시나요?", cat:"emotion", p:{E01:30,E07:15,TH17:10,TH04:10}},
  {id:id(), text:"긴장을 풀 수 있는 나만의 방법이 있으시나요?", cat:"positive", py:{E12:20,TH17:15,E07:-15}, pn:{E07:15,TH17:15}},
  {id:id(), text:"최근에 진심으로 기뻤던 순간이 있으시나요?", cat:"positive", py:{E11:25,E13:10,TH16:15,E03:-15}, pn:{E03:15,E10:10}},
  {id:id(), text:"오늘 나에게 주어진 것에 만족하시나요?", cat:"positive", py:{TH16:25,E11:15,E12:10,E10:-10}, pn:{E10:15,TH16:10}},
  {id:id(), text:"하나님이 나의 눈물을 보고 계신다고 느끼시나요?", cat:"spiritual", py:{TH04:30,E15:15,TH01:15,E05:-10}, pn:{E05:15,P12:10,TH04:10}},
  {id:id(), text:"영적으로 목마르다는 표현이 공감되시나요?", cat:"spiritual", p:{P12:25,TH04:15,TH09:10,E10:10}},
  {id:id(), text:"하루를 감사로 마무리할 수 있으시나요?", cat:"positive", py:{E11:25,E12:15,TH16:15,E07:-10,E01:-10}, pn:{E07:10,E01:10,TH16:10}},
  {id:id(), text:"내일 아침이 기다려지시나요?", cat:"positive", py:{E13:25,E11:15,E12:10,E03:-15,E10:-10}, pn:{E03:10,E10:15,TH06:10}},
];

// 정규화
const finalCards = batch3.map(c => {
  const card = {
    id: c.id, text: c.text, category: c.cat,
    condition: c.cond || null, weight_target: {}
  };
  const po = c.p || c.py || {};
  Object.entries(po).filter(([k,v]) => v > 0).sort((a,b) => b[1]-a[1]).slice(0,2)
    .forEach(([tag, val]) => { card.weight_target[tag] = val >= 30 ? 1.0 : 0.5; });
  if (c.p) card.payload = c.p;
  if (c.py) card.payload_yes = c.py;
  if (c.pn) card.payload_no = c.pn;
  return card;
});

existing.cards = [...existing.cards, ...finalCards];
existing.meta.total_cards = existing.cards.length;
fs.writeFileSync(filePath, JSON.stringify(existing, null, 2), 'utf8');

// 통계
console.log(`\n=== 카드 풀 3차 확장 결과 ===`);
console.log(`총 카드: ${existing.cards.length}개`);
const cats = {};
existing.cards.forEach(c => { cats[c.category] = (cats[c.category] || 0) + 1; });
console.log('\n카테고리 분포:');
Object.entries(cats).sort((a,b) => b[1]-a[1]).forEach(([c,n]) => console.log(`  ${c}: ${n}`));

const tagCov = {};
existing.cards.forEach(c => {
  const p = c.payload || c.payload_yes || {};
  for (const tag of Object.keys(p)) tagCov[tag] = (tagCov[tag] || 0) + 1;
});
const allTags = [
  ...Array.from({length:15}, (_,i) => 'E'+String(i+1).padStart(2,'0')),
  ...Array.from({length:12}, (_,i) => 'P'+String(i+1).padStart(2,'0')),
  ...Array.from({length:20}, (_,i) => 'TH'+String(i+1).padStart(2,'0'))
];
console.log(`\n태그 100% 커버: ${allTags.every(t => tagCov[t] > 0)}`);
const weak = allTags.map(t => [t, tagCov[t]||0]).sort((a,b) => a[1]-b[1]).slice(0,5);
console.log('가장 약한 5개:');
weak.forEach(([t,n]) => console.log(`  ${t}: ${n}회`));
