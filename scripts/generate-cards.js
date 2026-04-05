/**
 * question-cards.json 대량 확장 생성기
 * 기존 48개 + 추가 252개 = 300개 목표
 *
 * 전략:
 * - 각 태그(E/P/TH)를 최소 5~8회 커버
 * - 카테고리 균형: emotion/situation/relationship/family/spiritual/modern/positive/existential
 * - 상황 조건(condition) 다양화
 */

const fs = require('fs');
const path = require('path');

const existing = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', 'public', 'data', 'question-cards.json'), 'utf8')
);

// 추가 카드 정의
const additionalCards = [
  // ===== 감정 (E) 강화 =====
  // E01 불안/초조
  { id:"QC049", text:"아직 일어나지 않은 일이 자꾸 걱정되시나요?", cat:"emotion", payload:{E01:35,E07:15,E12:-15,TH02:15} },
  { id:"QC050", text:"작은 일에도 심장이 두근거리거나 손에 땀이 나시나요?", cat:"emotion", payload:{E01:40,E07:20,P05:15,TH04:15} },
  { id:"QC051", text:"뉴스를 보면 세상이 무섭게 느껴지시나요?", cat:"modern", payload:{E01:25,P11:20,E02:10,TH02:20,TH06:10} },
  { id:"QC052", text:"가족의 건강이 걱정되어 마음이 놓이지 않으시나요?", cat:"family", payload:{E01:30,P02:20,P05:25,TH04:15,TH01:10} },
  { id:"QC053", text:"시험이나 발표를 앞두고 잠이 안 오시나요?", cat:"situation", cond:{any_of:["S10","S11"]}, payload:{E01:35,P03:25,P10:20,E07:15} },

  // E02 슬픔/상실
  { id:"QC054", text:"문득 옛날 사진을 보다가 눈시울이 붉어지셨나요?", cat:"emotion", payload:{E02:30,E05:15,P06:15,TH01:15,TH04:10} },
  { id:"QC055", text:"좋았던 시절이 다시 오지 않을 것 같아 아프시나요?", cat:"emotion", payload:{E02:35,E10:15,E05:10,TH06:20} },
  { id:"QC056", text:"가까웠던 사람이 멀어져서 마음이 허전하시나요?", cat:"relationship", payload:{E02:25,E05:25,P01:15,TH04:15,TH08:10} },
  { id:"QC057", text:"반려동물이나 소중한 것을 잃은 슬픔이 남아있나요?", cat:"emotion", payload:{E02:35,P06:30,E05:15,TH01:20} },

  // E03 우울/무기력
  { id:"QC058", text:"아침에 이불 밖으로 나가기가 유독 힘드시나요?", cat:"emotion", payload:{E03:35,E07:15,E10:10,TH17:15,TH04:10} },
  { id:"QC059", text:"좋아하던 일에 흥미가 사라진 느낌이 드시나요?", cat:"emotion", payload:{E03:30,E10:25,E07:10,TH16:15,TH04:15} },
  { id:"QC060", text:"아무것도 하기 싫고 그냥 누워있고 싶으시나요?", cat:"emotion", payload:{E03:40,E07:20,E10:15,TH17:-10,TH04:15} },
  { id:"QC061", text:"웃을 일이 별로 없는 것 같으시나요?", cat:"emotion", payload:{E03:30,E05:15,E10:15,TH16:20,TH01:15} },

  // E04 분노/억울
  { id:"QC062", text:"억울한 일을 당했는데 아무도 내 편이 아닌 것 같나요?", cat:"emotion", payload:{E04:35,E09:20,E05:15,TH03:15,TH08:10} },
  { id:"QC063", text:"작은 일에도 짜증이 나고 화가 치미는 날이신가요?", cat:"emotion", payload:{E04:30,E07:20,TH15:20,TH17:-10} },
  { id:"QC064", text:"세상이 불공평하다는 생각에 화가 나시나요?", cat:"existential", payload:{E04:25,E10:15,TH03:25,TH20:20,P11:15} },
  { id:"QC065", text:"누군가의 무례한 말이 머릿속에서 떠나지 않나요?", cat:"relationship", payload:{E04:30,E09:20,P01:15,TH08:20,TH15:10} },

  // E05 외로움/단절
  { id:"QC066", text:"사람들 사이에 있어도 혼자인 것 같은 느낌이 드시나요?", cat:"emotion", payload:{E05:40,P11:25,E03:10,TH19:15,TH04:15} },
  { id:"QC067", text:"전화할 사람이 없다는 생각이 문득 드시나요?", cat:"emotion", payload:{E05:35,E03:15,P11:15,TH13:15,TH04:15} },
  { id:"QC068", text:"주말에 혼자 보내는 시간이 외롭게 느껴지시나요?", cat:"emotion", payload:{E05:30,E03:15,TH19:20,TH04:15,E12:-10} },
  { id:"QC069", text:"나를 진정으로 이해해주는 사람이 없다고 느끼시나요?", cat:"emotion", payload:{E05:35,E09:15,P11:20,TH01:20,TH04:15} },

  // E06 죄책감/수치심
  { id:"QC070", text:"자녀에게 미안한 마음이 자꾸 드시나요?", cat:"family", cond:{any_of:["S05"]}, payload:{E06:30,P02:20,TH07:20,TH14:15,TH01:10} },
  { id:"QC071", text:"남들 앞에서 실수한 기억이 자꾸 떠올라 괴로우신가요?", cat:"emotion", payload:{E06:30,E01:15,P10:15,TH05:15,TH07:15} },
  { id:"QC072", text:"하나님 앞에 부끄러운 마음이 드시나요?", cat:"spiritual", payload:{E06:35,TH07:30,TH05:20,TH01:15,E12:-10} },
  { id:"QC073", text:"같은 실수를 반복하는 자신이 한심하게 느껴지시나요?", cat:"emotion", payload:{E06:30,E03:15,E08:10,TH07:20,TH15:15} },

  // E07 스트레스/번아웃
  { id:"QC074", text:"할 일 목록이 끝없이 늘어나는 것 같으시나요?", cat:"situation", payload:{E07:35,E01:15,P03:20,TH17:15,TH15:10} },
  { id:"QC075", text:"쉬어도 쉰 것 같지 않고 늘 피곤하시나요?", cat:"emotion", payload:{E07:40,E03:15,P05:15,TH17:25,E12:-15} },
  { id:"QC076", text:"봉사나 사역 때문에 오히려 지쳐있으시나요?", cat:"spiritual", payload:{E07:30,P12:25,TH13:-10,TH17:20,TH09:10} },
  { id:"QC077", text:"회사(학교)를 그만두고 싶은 충동이 드시나요?", cat:"situation", cond:{any_of:["S09","S10"]}, payload:{E07:35,P03:30,E10:15,TH02:15} },

  // E08 혼란/방향상실
  { id:"QC078", text:"어떤 선택이 옳은 건지 도무지 모르겠으시나요?", cat:"emotion", payload:{E08:35,E01:15,TH10:20,TH02:20} },
  { id:"QC079", text:"내가 누구인지, 뭘 원하는지 모르겠다는 생각이 드시나요?", cat:"existential", payload:{E08:35,E10:20,E03:10,TH01:15,TH02:15} },
  { id:"QC080", text:"진로나 진학 앞에서 갈팡질팡하고 계신가요?", cat:"situation", cond:{any_of:["S10","S12"]}, payload:{E08:30,P03:25,E01:15,TH02:20,TH10:15} },

  // E09 거절감/배신감
  { id:"QC081", text:"믿었던 사람에게 뒤통수를 맞은 느낌이 드시나요?", cat:"relationship", payload:{E09:40,E04:20,P01:20,TH08:25,TH03:10} },
  { id:"QC082", text:"나만 빼고 다들 모여있는 것 같은 소외감이 드시나요?", cat:"emotion", payload:{E09:30,E05:25,P11:15,TH04:15,TH01:15} },
  { id:"QC083", text:"고백이나 제안을 거절당한 상처가 남아있나요?", cat:"relationship", payload:{E09:35,E06:15,E05:15,TH01:25,TH04:10} },

  // E10 허무/회의
  { id:"QC084", text:"열심히 살아도 결국 달라지는 건 없다는 생각이 드시나요?", cat:"existential", payload:{E10:35,E03:20,P10:15,TH02:20,TH06:15} },
  { id:"QC085", text:"인생의 의미가 무엇인지 회의가 드시나요?", cat:"existential", payload:{E10:40,E08:15,TH02:25,TH06:20,TH20:10} },
  { id:"QC086", text:"성공해도 공허한 느낌이 드시나요?", cat:"existential", payload:{E10:35,E08:15,TH16:-10,TH02:20,TH05:15} },

  // E11~E15 긍정 감정 강화
  { id:"QC087", text:"오늘 하루 중 가장 웃었던 순간이 있으신가요?", cat:"positive", payload:{E11:25,E14:15,TH16:20,E03:-15,E10:-10} },
  { id:"QC088", text:"하나님이 기도를 들으셨다고 느낀 적이 최근에 있나요?", cat:"positive", payload:{E15:30,E13:20,TH09:25,TH04:20,P12:-20} },
  { id:"QC089", text:"누군가의 따뜻한 말 한마디에 위로받으셨나요?", cat:"positive", payload:{E14:30,E12:15,TH13:15,E05:-20,E03:-10} },
  { id:"QC090", text:"자연의 아름다움에 감탄한 순간이 있으셨나요?", cat:"positive", payload:{E15:25,E12:20,TH04:15,E07:-15,E01:-10} },
  { id:"QC091", text:"힘든 일을 이겨냈다는 뿌듯함을 느끼셨나요?", cat:"positive", payload:{E11:25,E13:20,TH15:15,E03:-15,E07:-15} },
  { id:"QC092", text:"교회 예배나 찬양 중에 마음이 뜨거워지셨나요?", cat:"positive", payload:{E15:35,E12:15,TH09:25,TH04:15,P12:-20} },
  { id:"QC093", text:"오늘 읽은 말씀 중 마음에 와닿는 구절이 있었나요?", cat:"positive", payload:{E15:25,E13:15,TH10:25,TH04:15,E08:-10} },
  { id:"QC094", text:"내 삶에 소중한 사람이 있다는 게 감사하시나요?", cat:"positive", payload:{E11:30,E14:25,TH16:20,E05:-20,E10:-10} },
  { id:"QC095", text:"작은 일상 속에서 하나님의 손길을 발견하셨나요?", cat:"positive", payload:{E15:25,E11:20,TH04:25,TH02:15,E10:-15} },

  // ===== 상황 압박 (P) 강화 =====
  // P01 관계 갈등
  { id:"QC096", text:"가까운 사람과 말다툼 후 마음이 불편하시나요?", cat:"relationship", payload:{P01:35,E04:20,E06:10,TH08:25,TH15:10} },
  { id:"QC097", text:"관계에서 상처를 주고받는 일이 반복되고 있나요?", cat:"relationship", payload:{P01:35,E09:20,E07:10,TH08:20,TH01:15} },
  { id:"QC098", text:"누군가와 냉전 중인 관계가 있으신가요?", cat:"relationship", payload:{P01:30,E05:15,E04:15,TH08:25,TH17:-10} },

  // P02 가족/양육
  { id:"QC099", text:"좋은 부모인지 자신이 없으시나요?", cat:"family", cond:{any_of:["S05"]}, payload:{P02:35,E06:20,E01:15,TH14:20,TH01:15} },
  { id:"QC100", text:"부모님과의 관계에서 해결되지 않은 감정이 있으시나요?", cat:"family", payload:{P02:30,E04:15,E06:15,TH14:20,TH08:15} },
  { id:"QC101", text:"가족 모임이 즐겁기보다 부담스러우시나요?", cat:"family", payload:{P02:25,E07:20,P01:15,TH14:15,TH17:10} },
  { id:"QC102", text:"배우자와 양육 방식 때문에 충돌이 있으시나요?", cat:"family", cond:{any_of:["S01","S05"]}, payload:{P02:30,P01:25,E04:15,TH14:25,TH08:15} },

  // P03 직장/학업
  { id:"QC103", text:"직장 상사의 말 한마디에 하루가 무너지시나요?", cat:"situation", cond:{any_of:["S09"]}, payload:{P03:35,E04:20,E09:15,TH15:15,TH02:10} },
  { id:"QC104", text:"업무량이 감당이 안 되는 느낌이시나요?", cat:"situation", cond:{any_of:["S09"]}, payload:{P03:35,E07:30,E01:10,TH17:15} },
  { id:"QC105", text:"학교 성적이나 과제 때문에 압박감이 크시나요?", cat:"situation", cond:{any_of:["S10","S11"]}, payload:{P03:30,P10:25,E01:20,E07:15} },
  { id:"QC106", text:"일과 삶의 균형이 무너져 있다고 느끼시나요?", cat:"situation", cond:{any_of:["S09"]}, payload:{P03:30,E07:25,TH17:25,TH15:10,E12:-15} },

  // P04 재정
  { id:"QC107", text:"월말이 다가오면 통장 잔고가 걱정되시나요?", cat:"situation", payload:{P04:40,E01:20,E07:15,TH02:15} },
  { id:"QC108", text:"빚이나 대출 상환이 마음에 걸리시나요?", cat:"situation", payload:{P04:40,E01:25,E07:15,TH02:15,TH04:10} },
  { id:"QC109", text:"다른 사람들의 소비 수준과 비교하게 되시나요?", cat:"modern", payload:{P04:25,P09:25,E01:10,TH16:20,TH15:10} },
  { id:"QC110", text:"자녀 교육비나 학원비 걱정이 크시나요?", cat:"family", cond:{any_of:["S05"]}, payload:{P04:30,P02:20,E01:20,TH02:15,TH14:10} },

  // P05 건강
  { id:"QC111", text:"만성적인 통증이나 불편함으로 일상이 힘드시나요?", cat:"situation", payload:{P05:40,E03:15,E07:15,TH04:20,TH17:10} },
  { id:"QC112", text:"가족 중 건강이 안 좋은 분이 계셔서 걱정되시나요?", cat:"family", payload:{P05:25,P02:20,E01:20,E02:10,TH04:15,TH09:10} },
  { id:"QC113", text:"운동이나 건강관리를 해야 하는데 실천이 안 되시나요?", cat:"situation", payload:{P05:20,E06:15,TH15:20,TH17:10} },

  // P06 상실/애도
  { id:"QC114", text:"돌아가신 분의 빈자리가 유독 크게 느껴지는 날인가요?", cat:"emotion", payload:{P06:40,E02:35,E05:20,TH06:20,TH04:15} },
  { id:"QC115", text:"기일이나 기념일이 다가와 마음이 무거우시나요?", cat:"emotion", payload:{P06:35,E02:30,E05:15,TH04:20,TH01:15} },
  { id:"QC116", text:"떠나보낸 사람에게 하지 못한 말이 남아있나요?", cat:"emotion", payload:{P06:30,E02:25,E06:15,TH08:15,TH06:15} },

  // P07 환경변화
  { id:"QC117", text:"새 직장(학교)에서 아직 적응이 안 되시나요?", cat:"situation", payload:{P07:35,E01:20,E05:15,E07:15,TH04:15} },
  { id:"QC118", text:"이사한 동네에서 아는 사람이 없어 외로우시나요?", cat:"situation", payload:{P07:30,E05:30,P11:15,TH19:15,TH04:15} },
  { id:"QC119", text:"갑작스러운 변화로 일상이 흔들리고 있으시나요?", cat:"situation", payload:{P07:35,E01:25,E08:15,TH02:20,TH04:10} },

  // P08 중독/트라우마
  { id:"QC120", text:"과거의 힘든 기억이 플래시백처럼 떠오르시나요?", cat:"emotion", payload:{P08:35,E01:25,E02:15,TH04:20,TH01:15} },
  { id:"QC121", text:"특정 장소나 상황을 피하게 되시나요?", cat:"emotion", payload:{P08:30,E01:25,E07:10,TH04:20,TH02:10} },
  { id:"QC122", text:"자꾸 빠지게 되는 나쁜 습관에 자괴감이 드시나요?", cat:"emotion", payload:{P08:30,E06:30,TH07:25,TH15:15,TH12:10} },
  { id:"QC123", text:"게임이나 영상에 빠져 시간을 잃어버리시나요?", cat:"modern", payload:{P08:20,P09:30,E06:15,TH15:20,TH17:-10} },

  // P09 디지털 피로/비교
  { id:"QC124", text:"인스타 피드를 보면 내 삶이 초라해 보이시나요?", cat:"modern", payload:{P09:35,E03:15,P10:15,TH01:20,TH16:-10} },
  { id:"QC125", text:"유튜브나 넷플릭스를 끄기가 어려우시나요?", cat:"modern", payload:{P09:30,P08:15,E06:10,TH15:20,TH17:-10} },
  { id:"QC126", text:"알림 소리에 반사적으로 폰을 확인하게 되시나요?", cat:"modern", payload:{P09:30,E07:15,TH15:15,TH17:15,E12:-10} },
  { id:"QC127", text:"디지털 기기 없이 하루를 보내는 게 상상이 안 되시나요?", cat:"modern", payload:{P09:35,E07:10,TH15:20,TH04:-10} },

  // P10 성과주의/미래불안
  { id:"QC128", text:"남들은 다 성공하는데 나만 제자리인 것 같나요?", cat:"modern", payload:{P10:35,P09:20,E03:15,TH01:20,TH02:15} },
  { id:"QC129", text:"스펙을 더 쌓아야 한다는 압박이 크시나요?", cat:"modern", cond:{any_of:["S10","S12"]}, payload:{P10:35,P03:20,E07:20,TH05:15} },
  { id:"QC130", text:"노후가 걱정되어 현재를 즐기지 못하시나요?", cat:"situation", payload:{P10:25,P04:20,E01:20,TH16:15,TH02:15} },
  { id:"QC131", text:"완벽하지 않으면 안 된다는 생각에 스스로를 몰아붙이시나요?", cat:"emotion", payload:{P10:30,E07:25,E06:15,TH05:20,TH15:10} },

  // P11 연결 속 단절
  { id:"QC132", text:"온라인에서는 활발하지만 오프라인에서는 외로우시나요?", cat:"modern", payload:{P11:35,E05:25,P09:15,TH19:15,TH04:10} },
  { id:"QC133", text:"정치나 사회 이슈로 가까운 사람과 갈등이 있으시나요?", cat:"modern", payload:{P11:30,P01:20,E04:15,TH08:15,TH17:10} },
  { id:"QC134", text:"진심을 말할 수 있는 공동체가 없다고 느끼시나요?", cat:"relationship", payload:{P11:30,E05:25,TH19:20,TH13:10,P12:10} },

  // P12 제도적 환멸/영적 고갈
  { id:"QC135", text:"교회 지도자에 대한 실망이 신앙까지 흔들리게 하나요?", cat:"spiritual", payload:{P12:40,E10:20,E04:15,TH19:-15,TH04:15} },
  { id:"QC136", text:"주일마다 같은 패턴의 예배가 지루하게 느껴지시나요?", cat:"spiritual", payload:{P12:30,E10:15,TH09:-10,TH04:15,TH12:10} },
  { id:"QC137", text:"신앙생활이 형식적으로 흘러가고 있다고 느끼시나요?", cat:"spiritual", payload:{P12:35,E10:20,E08:10,TH11:15,TH04:20} },
  { id:"QC138", text:"교회를 떠나고 싶은 마음이 든 적 있으신가요?", cat:"spiritual", payload:{P12:40,E10:15,E05:10,TH19:-20,TH04:20,TH01:15} },

  // ===== 신학 주제 (TH) 미커버 강화 =====
  // TH03 공의/심판 (미커버 해결)
  { id:"QC139", text:"착한 사람이 고통받는 세상이 이해가 안 되시나요?", cat:"existential", payload:{TH03:30,E04:15,E08:15,TH02:20,TH20:10} },
  { id:"QC140", text:"악인이 잘 되는 걸 보면 하나님의 공의가 의심되시나요?", cat:"spiritual", payload:{TH03:35,E04:20,E08:15,TH02:25} },
  { id:"QC141", text:"심판의 날을 생각하면 두렵기보다 소망이 되시나요?", cat:"spiritual", payload_yes:{TH03:20,E13:20,TH06:25,E01:-15}, payload_no:{TH03:15,E01:25,E06:15,TH05:20} },

  // TH12 성령/영적전쟁 (미커버 해결)
  { id:"QC142", text:"보이지 않는 영적 공격을 받고 있다고 느끼시나요?", cat:"spiritual", payload:{TH12:35,E01:20,E08:15,TH09:15,TH04:10} },
  { id:"QC143", text:"성령님의 인도하심을 구체적으로 경험하신 적 있나요?", cat:"positive", payload_yes:{TH12:25,E15:25,TH04:20,E13:15,P12:-15}, payload_no:{TH12:15,E08:15,P12:15,TH04:15} },
  { id:"QC144", text:"기도할 때 방해받는 느낌이 자주 드시나요?", cat:"spiritual", payload:{TH12:30,E08:15,TH09:20,P12:10,E01:10} },

  // TH 추가 커버리지
  { id:"QC145", text:"하나님이 내 기도를 정말 듣고 계실까 의문이 드시나요?", cat:"spiritual", payload:{TH09:20,E08:25,P12:20,TH04:15,TH02:15} },
  { id:"QC146", text:"말씀을 읽어도 마음에 안 들어오는 시기이신가요?", cat:"spiritual", payload:{TH10:-15,P12:25,E03:15,E08:15,TH04:20} },
  { id:"QC147", text:"선교나 전도에 대한 부담감이 있으시나요?", cat:"spiritual", payload:{TH18:25,E06:15,E07:10,TH13:15,TH11:10} },
  { id:"QC148", text:"교회 공동체 안에서 소속감을 느끼고 계시나요?", cat:"spiritual", payload_yes:{TH19:25,E12:15,E14:15,E05:-20,P12:-15}, payload_no:{TH19:-10,E05:25,P12:20,P11:15} },

  // ===== 복합 상황 카드 (여러 차원 교차) =====
  { id:"QC149", text:"야근(과제) 후 귀가하면 가족과 대화할 힘이 없으시나요?", cat:"situation", cond:{any_of:["S09","S10"]}, payload:{P03:25,P02:15,E07:25,P01:10,TH14:15,TH17:10} },
  { id:"QC150", text:"육아와 신앙생활 사이에서 어느 쪽도 잘 못하는 것 같나요?", cat:"family", cond:{any_of:["S05"]}, payload:{P02:25,P12:20,E06:20,E07:15,TH14:15,TH09:10} },
  { id:"QC151", text:"건강 문제로 하고 싶은 일을 못 하는 게 답답하시나요?", cat:"situation", payload:{P05:30,E04:15,E03:15,TH04:15,TH15:10} },
  { id:"QC152", text:"실직 후 가족을 부양해야 한다는 압박이 크시나요?", cat:"situation", cond:{any_of:["S13"]}, payload:{P04:35,P03:20,E01:25,E06:15,TH02:20} },
  { id:"QC153", text:"군대에서 신앙을 지키기가 어려우시나요?", cat:"spiritual", cond:{any_of:["S15"]}, payload:{P12:25,P07:20,E05:15,TH11:20,TH19:15} },
  { id:"QC154", text:"임신 중 몸과 마음이 모두 힘드시나요?", cat:"situation", cond:{any_of:["S22"]}, payload:{P05:25,P02:15,E01:15,E07:20,TH01:15,TH04:15} },
  { id:"QC155", text:"은퇴 후 삶의 목적을 잃은 것 같으시나요?", cat:"situation", cond:{any_of:["S14"]}, payload:{P07:25,E10:30,E08:15,TH02:20,TH11:15} },
  { id:"QC156", text:"이혼 과정에서 자녀가 걱정되시나요?", cat:"family", cond:{any_of:["S04"]}, payload:{P01:25,P02:30,E01:25,E06:15,TH14:20,TH01:15} },
  { id:"QC157", text:"중독에서 벗어나려는 시도가 번번이 실패하시나요?", cat:"situation", payload:{P08:40,E06:30,E03:15,TH07:20,TH12:15} },

  // ===== 관계 심화 카드 =====
  { id:"QC158", text:"시부모(장인어른)와의 관계가 스트레스의 원인이신가요?", cat:"family", cond:{any_of:["S01"]}, payload:{P01:30,P02:20,E07:20,E04:15,TH15:15} },
  { id:"QC159", text:"친구에게 솔직한 마음을 털어놓기가 어려우시나요?", cat:"relationship", payload:{E05:20,P01:15,P11:15,TH13:15,TH08:10} },
  { id:"QC160", text:"결혼 생활에서 존중받지 못한다고 느끼시나요?", cat:"relationship", cond:{any_of:["S01"]}, payload:{P01:35,E09:20,E04:15,TH14:25,TH01:15} },
  { id:"QC161", text:"직장 동료와의 갈등으로 출근이 괴로우시나요?", cat:"situation", cond:{any_of:["S09"]}, payload:{P01:25,P03:30,E04:15,E07:15,TH08:15} },
  { id:"QC162", text:"교회 안에서 상처받은 기억이 치유되지 않았나요?", cat:"spiritual", payload:{P12:30,P01:20,E09:25,TH19:-10,TH08:20,TH01:15} },

  // ===== 절기/시즌 카드 =====
  { id:"QC163", text:"명절이 다가오면 마음이 복잡해지시나요?", cat:"family", payload:{P02:25,P01:20,E07:20,P04:10,TH14:15} },
  { id:"QC164", text:"연말이 되면 한 해를 돌아보며 아쉬움이 크시나요?", cat:"existential", payload:{E10:20,E06:15,E13:10,TH16:15,TH02:15} },
  { id:"QC165", text:"새해 결심이 작심삼일이 되어 자괴감이 드시나요?", cat:"emotion", payload:{E06:25,P10:15,TH15:20,TH07:10} },

  // ===== 성장 확인 카드 =====
  { id:"QC166", text:"1년 전의 나보다 영적으로 성장했다고 느끼시나요?", cat:"positive", payload_yes:{E13:25,E11:20,TH11:20,E10:-15,P12:-10}, payload_no:{E10:20,P12:15,E08:10,TH11:15,TH04:15} },
  { id:"QC167", text:"최근에 성경 말씀이 삶에 적용된 경험이 있으신가요?", cat:"positive", payload_yes:{TH10:25,TH11:20,E13:15,E15:15,P12:-10}, payload_no:{TH10:10,E08:15,P12:10,TH04:10} },
  { id:"QC168", text:"기도 응답을 받았다는 확신이 든 적이 최근에 있나요?", cat:"positive", payload_yes:{TH09:25,E15:25,E13:20,TH04:20,P12:-20}, payload_no:{E08:15,P12:15,TH09:10,TH02:15} },

  // ===== 일상 미시적 카드 =====
  { id:"QC169", text:"오늘 식사를 거른 적이 있으시나요?", cat:"situation", payload:{E07:20,P05:15,E03:10,TH17:10} },
  { id:"QC170", text:"최근에 운동이나 산책을 한 적이 있으시나요?", cat:"positive", payload_yes:{E12:20,E07:-15,P05:-10,TH17:15}, payload_no:{E07:15,P05:10,E03:10,TH17:10} },
  { id:"QC171", text:"충분히 수면을 취하고 계시나요?", cat:"situation", payload_yes:{E12:15,E07:-15,TH17:10}, payload_no:{E07:25,P05:15,E03:10,TH17:15} },
  { id:"QC172", text:"오늘 누군가에게 '고마워'라고 말씀하셨나요?", cat:"positive", payload_yes:{E11:20,E14:15,TH13:15,E05:-10}, payload_no:{E05:10,TH13:10,TH16:10} },

  // ===== 청년 특화 =====
  { id:"QC173", text:"졸업 후 진로가 막막하시나요?", cat:"situation", cond:{any_of:["S10","S12"]}, payload:{E08:30,P10:30,P03:20,E01:20,TH02:15} },
  { id:"QC174", text:"또래 친구들의 결혼 소식에 마음이 복잡하시나요?", cat:"emotion", cond:{any_of:["S02"]}, payload:{E05:20,P09:20,E01:15,TH01:15,TH14:10} },
  { id:"QC175", text:"부모님의 기대와 내가 원하는 삶이 다르시나요?", cat:"family", payload:{P02:25,E04:15,E08:20,P10:15,TH11:10,TH02:10} },

  // ===== 중년 특화 =====
  { id:"QC176", text:"인생의 반환점에서 지금까지의 삶이 후회되시나요?", cat:"existential", payload:{E10:30,E06:20,E08:15,TH06:15,TH02:20} },
  { id:"QC177", text:"부모를 돌보면서 내 삶은 없어지는 것 같으시나요?", cat:"family", cond:{any_of:["S06"]}, payload:{P02:30,E07:25,E06:15,TH13:15,TH17:10} },
  { id:"QC178", text:"건강이 예전 같지 않다는 걸 느끼시나요?", cat:"situation", payload:{P05:30,E01:15,E02:10,TH06:15,TH04:10} },

  // ===== 신앙 깊이 카드 =====
  { id:"QC179", text:"성경을 읽으면서 의문이나 반론이 떠오르시나요?", cat:"spiritual", payload:{E08:15,TH10:25,TH03:15,TH02:15} },
  { id:"QC180", text:"다른 종교나 세계관에 대해 생각해 본 적이 있나요?", cat:"spiritual", payload:{E08:20,TH10:20,TH02:15,TH20:15} },
  { id:"QC181", text:"성경의 어려운 본문(전쟁, 심판 등)이 불편하시나요?", cat:"spiritual", payload:{E08:20,TH03:25,TH10:15,TH02:15,TH01:10} },
  { id:"QC182", text:"신앙과 과학이 충돌한다고 느끼시나요?", cat:"existential", payload:{E08:25,TH10:20,TH02:20,TH20:10} },

  // ===== 사역자/봉사자 특화 =====
  { id:"QC183", text:"섬기면서 오히려 상처받은 경험이 있으시나요?", cat:"spiritual", payload:{P12:25,E09:20,E07:20,TH13:-10,TH08:15} },
  { id:"QC184", text:"교회 봉사가 의무감으로 하고 있진 않으시나요?", cat:"spiritual", payload:{P12:30,E07:20,TH13:-10,TH09:10,TH11:15} },
  { id:"QC185", text:"사역의 열매가 보이지 않아 실망하시나요?", cat:"spiritual", payload:{P12:25,E10:20,TH18:15,TH11:15,E13:-10} },

  // ===== 감사/은혜 발견 카드 (긍정 강화) =====
  { id:"QC186", text:"오늘 하늘을 올려다본 적이 있으시나요?", cat:"positive", payload:{E12:20,E15:15,TH04:15,E07:-10,E01:-10} },
  { id:"QC187", text:"누군가가 나를 위해 기도해주고 있다는 걸 아시나요?", cat:"positive", payload:{E14:25,E12:15,TH09:15,TH19:15,E05:-20} },
  { id:"QC188", text:"어려운 시기를 통과한 후 더 강해졌다고 느끼시나요?", cat:"positive", payload:{E13:25,E11:15,TH15:20,TH02:15,E03:-15} },
  { id:"QC189", text:"작은 친절을 베풀었을 때 마음이 따뜻해지셨나요?", cat:"positive", payload:{E14:25,E11:20,TH13:25,E05:-15,E10:-10} },
  { id:"QC190", text:"최근에 용서를 경험하셨나요? (주거나 받거나)", cat:"positive", payload_yes:{TH08:25,TH07:20,E12:20,E04:-20,P01:-15}, payload_no:{E04:10,P01:10,TH08:15,TH07:10} },

  // ===== 계절/일상 변주 =====
  { id:"QC191", text:"비 오는 날이면 마음이 우울해지시나요?", cat:"emotion", payload:{E03:25,E02:15,E05:10,TH04:15,TH17:10} },
  { id:"QC192", text:"월요일 아침이 유독 힘드시나요?", cat:"situation", payload:{E07:25,P03:20,E03:10,TH17:15} },
  { id:"QC193", text:"밤이 되면 생각이 많아져서 괴로우시나요?", cat:"emotion", payload:{E01:25,E08:15,E03:15,TH04:15,TH17:10} },
  { id:"QC194", text:"주말이 와도 쉬는 느낌이 안 드시나요?", cat:"situation", payload:{E07:30,TH17:20,E03:10,P03:10,E12:-15} },

  // ===== 자기 정체성 =====
  { id:"QC195", text:"내가 쓸모없는 존재라는 생각이 드시나요?", cat:"emotion", payload:{E06:25,E03:25,E10:15,TH01:25,TH05:15} },
  { id:"QC196", text:"나의 장점이 무엇인지 모르겠으시나요?", cat:"emotion", payload:{E08:20,E06:15,E03:15,TH01:20,TH02:10} },
  { id:"QC197", text:"크리스천으로서의 정체성이 확고하시나요?", cat:"spiritual", payload_yes:{TH11:20,E13:15,TH05:15,E12:10,P12:-15}, payload_no:{E08:20,P12:15,TH05:15,TH11:10} },

  // ===== 이웃/사회 =====
  { id:"QC198", text:"도움이 필요한 사람을 보고도 지나친 적이 있으시나요?", cat:"emotion", payload:{E06:20,TH13:20,TH20:15,TH11:10} },
  { id:"QC199", text:"사회의 불의를 보면 분노가 치밀어 오르시나요?", cat:"existential", payload:{E04:20,TH03:20,TH20:25,TH05:10,P11:10} },
  { id:"QC200", text:"나눔이나 기부를 실천하고 계시나요?", cat:"positive", payload_yes:{TH13:20,E11:15,TH20:15,E14:10,E06:-10}, payload_no:{TH13:10,TH20:10,E06:10} },

  // ===== 추가 감정 변주 (미묘한 차이) =====
  { id:"QC201", text:"남들 앞에서 웃고 있지만 속으로는 울고 있으시나요?", cat:"emotion", payload:{E03:30,E05:20,E06:15,P11:10,TH04:15} },
  { id:"QC202", text:"도망치고 싶은 마음이 드시나요?", cat:"emotion", payload:{E01:25,E07:25,E03:15,TH17:15,TH04:10} },
  { id:"QC203", text:"누군가를 미워하고 있는 내가 싫으시나요?", cat:"emotion", payload:{E04:20,E06:25,TH08:25,TH07:15,TH15:10} },
  { id:"QC204", text:"미래가 두렵기보다 기대되시나요?", cat:"positive", payload_yes:{E13:30,E11:15,TH06:20,E01:-20,E10:-10}, payload_no:{E01:20,E10:20,TH02:15,TH06:10} },
  { id:"QC205", text:"가슴이 벅차오르는 감동을 느낀 적이 최근에 있나요?", cat:"positive", payload_yes:{E15:30,E11:20,TH04:20,E03:-15,E10:-15}, payload_no:{E03:10,E10:10,TH04:10} },

  // ===== 추가 상황 변주 =====
  { id:"QC206", text:"경제 뉴스를 보면 불안해지시나요?", cat:"modern", payload:{P04:20,E01:25,P10:15,TH02:15} },
  { id:"QC207", text:"아이의 미래가 걱정되어 마음이 무거우시나요?", cat:"family", cond:{any_of:["S05"]}, payload:{P02:25,P10:20,E01:25,TH02:15,TH14:10} },
  { id:"QC208", text:"혼자 밥 먹는 시간이 외롭게 느껴지시나요?", cat:"emotion", payload:{E05:30,E03:10,P11:15,TH04:10,TH19:10} },
  { id:"QC209", text:"취업 준비가 너무 길어져 지치셨나요?", cat:"situation", cond:{any_of:["S12"]}, payload:{P03:30,P10:25,E07:20,E10:15,TH02:15} },
  { id:"QC210", text:"직장에서 부당한 대우를 받고 있다고 느끼시나요?", cat:"situation", cond:{any_of:["S09"]}, payload:{P03:25,E04:25,E09:15,TH03:15,TH20:10} },

  // ===== 추가 영적 카드 =====
  { id:"QC211", text:"하나님이 나를 벌하고 계신 건 아닌지 두려우시나요?", cat:"spiritual", payload:{E01:25,E06:20,TH03:20,TH01:20,TH05:15} },
  { id:"QC212", text:"내가 은사가 있는지, 어떻게 써야 할지 모르겠나요?", cat:"spiritual", payload:{E08:20,TH12:20,TH18:15,TH11:10} },
  { id:"QC213", text:"찬양을 부를 때 마음이 자유로워지시나요?", cat:"positive", payload_yes:{E12:20,E15:25,TH09:20,E07:-15,P12:-10}, payload_no:{E03:10,P12:10,TH09:10} },
  { id:"QC214", text:"새벽기도나 조용한 시간에 하나님을 만나시나요?", cat:"positive", payload_yes:{TH09:25,TH04:25,E12:20,E15:15,P12:-15}, payload_no:{P12:15,TH09:10,E08:10} },
  { id:"QC215", text:"전도하고 싶은 마음은 있지만 방법을 모르겠나요?", cat:"spiritual", payload:{TH18:25,E06:10,E08:15,TH13:10,TH11:10} },

  // ===== 추가 관계 카드 =====
  { id:"QC216", text:"'아니요'라고 말하기가 어려우시나요?", cat:"relationship", payload:{E07:20,P01:15,E06:10,TH15:20,TH20:10} },
  { id:"QC217", text:"누군가에게 진심으로 사과를 받고 싶으시나요?", cat:"relationship", payload:{E09:25,E04:15,P01:20,TH08:20,TH03:10} },
  { id:"QC218", text:"소그룹이나 셀 모임에서 솔직해지기가 어려우시나요?", cat:"spiritual", payload:{P11:20,E05:15,P12:10,TH19:20,TH13:10} },
  { id:"QC219", text:"연인과의 관계에서 확신이 없으시나요?", cat:"relationship", cond:{any_of:["S03"]}, payload:{E08:25,E01:20,P01:20,TH14:20,TH02:10} },
  { id:"QC220", text:"혼자 사는 것에 적응했지만 가끔 쓸쓸하시나요?", cat:"emotion", cond:{any_of:["S02"]}, payload:{E05:25,E03:10,TH04:20,TH19:10,E12:10} },

  // ===== 추가 일상/미시 =====
  { id:"QC221", text:"하루를 시작할 때 기도로 여시나요?", cat:"spiritual", payload_yes:{TH09:20,E12:15,TH04:15,P12:-10}, payload_no:{P12:10,TH09:10,E08:5} },
  { id:"QC222", text:"오늘 가장 먼저 한 것이 핸드폰 확인이었나요?", cat:"modern", payload:{P09:25,TH15:10,TH17:-10,E07:10} },
  { id:"QC223", text:"최근에 책을 읽거나 새로운 것을 배우셨나요?", cat:"positive", payload_yes:{TH10:15,E13:15,E11:10,E10:-10}, payload_no:{E10:10,E03:5} },
  { id:"QC224", text:"규칙적인 식사와 수면 패턴을 유지하고 계시나요?", cat:"situation", payload_yes:{P05:-10,E12:10,TH15:10}, payload_no:{P05:15,E07:15,E03:10} },
  { id:"QC225", text:"자연 속에서 시간을 보낸 적이 최근에 있나요?", cat:"positive", payload_yes:{E12:20,E15:15,TH04:10,E07:-15}, payload_no:{E07:10,P09:10,TH17:10} },

  // ===== 추가 복합/변주 (250~300) =====
  { id:"QC226", text:"내 인생에 의미 있는 변화가 필요하다고 느끼시나요?", cat:"existential", payload:{E08:20,E10:15,E13:10,TH02:20,TH11:15} },
  { id:"QC227", text:"정리해야 할 것(물건, 관계, 생각)이 많으시나요?", cat:"situation", payload:{E07:20,E08:15,TH15:15,TH17:10} },
  { id:"QC228", text:"지금 가장 필요한 것이 '쉼'이라고 느끼시나요?", cat:"emotion", payload:{E07:25,TH17:30,E03:10,P03:10,E12:-15} },
  { id:"QC229", text:"마음을 터놓을 수 있는 친구가 한 명이라도 있으시나요?", cat:"relationship", payload_yes:{E14:20,E12:10,TH13:10,E05:-20}, payload_no:{E05:30,P11:20,TH19:15} },
  { id:"QC230", text:"최근에 도전적인 일을 시도해 보셨나요?", cat:"positive", payload_yes:{E13:20,TH11:15,E11:10,E01:-10}, payload_no:{E10:10,E03:10,TH11:10} },
  { id:"QC231", text:"하나님 없이는 살 수 없다고 느끼시나요?", cat:"spiritual", payload_yes:{TH04:30,E15:15,TH11:20,P12:-15}, payload_no:{P12:20,E08:15,TH04:10} },
  { id:"QC232", text:"내 약점을 하나님께 맡기는 것이 어려우시나요?", cat:"spiritual", payload:{E06:15,E01:15,TH02:20,TH04:15,TH15:15} },
  { id:"QC233", text:"어린 시절의 상처가 지금도 삶에 영향을 주나요?", cat:"emotion", payload:{P08:25,E02:15,E06:15,P01:10,TH07:15,TH04:10} },
  { id:"QC234", text:"경쟁에서 뒤처지고 있다는 조급함이 있으시나요?", cat:"modern", payload:{P10:35,P09:20,E01:15,E07:10,TH05:15} },
  { id:"QC235", text:"요즘 나를 위한 시간이 전혀 없으시나요?", cat:"situation", payload:{E07:30,TH17:25,P03:15,E03:10,E12:-15} },
  { id:"QC236", text:"교회 밖 친구들에게 신앙 이야기를 꺼내기 어려우시나요?", cat:"spiritual", payload:{TH18:20,E06:15,P11:15,E01:10,TH11:10} },
  { id:"QC237", text:"죽음에 대해 생각하면 두렵거나 불안하시나요?", cat:"existential", payload:{E01:25,TH06:25,TH03:15,TH02:10,E02:10} },
  { id:"QC238", text:"최근에 가슴 뛰는 꿈이나 비전이 생기셨나요?", cat:"positive", payload_yes:{E13:30,TH11:20,E11:15,E10:-20,E03:-10}, payload_no:{E10:15,E03:10,TH02:10} },
  { id:"QC239", text:"다른 사람의 행복을 진심으로 기뻐해 줄 수 있으시나요?", cat:"positive", payload_yes:{E14:20,E11:15,TH13:15,P09:-10}, payload_no:{P09:15,E04:10,TH16:10} },
  { id:"QC240", text:"'이것만 해결되면 행복할 텐데'라는 생각이 드시나요?", cat:"emotion", payload:{E01:15,E10:15,TH16:20,TH02:20,TH05:10} },
  { id:"QC241", text:"돈 앞에서 하나님을 신뢰하기가 어려우시나요?", cat:"spiritual", payload:{P04:25,E01:15,TH02:25,TH16:15,TH04:10} },
  { id:"QC242", text:"세상의 기준과 하나님의 기준 사이에서 갈등하시나요?", cat:"spiritual", payload:{E08:20,TH03:15,TH10:20,TH20:15,TH11:15} },
  { id:"QC243", text:"내가 받은 은혜를 당연하게 여기고 있지는 않나요?", cat:"spiritual", payload:{TH05:20,TH16:20,E11:15,E06:10,TH07:10} },
  { id:"QC244", text:"주님의 재림을 기대하시나요?", cat:"spiritual", payload_yes:{TH06:25,E13:20,TH03:15,E15:10}, payload_no:{E08:10,TH06:10,TH03:10} },
  { id:"QC245", text:"헌금이나 십일조에 대해 부담을 느끼시나요?", cat:"spiritual", payload:{P04:20,E06:10,TH11:15,TH16:10,P12:10} },
  { id:"QC246", text:"나보다 어려운 사람을 보면 마음이 아프시나요?", cat:"positive", payload:{TH13:25,E14:15,TH20:20,TH01:10,E05:5} },
  { id:"QC247", text:"오늘 감사 일기를 쓴다면 3가지를 적을 수 있으시나요?", cat:"positive", payload_yes:{E11:25,TH16:20,E12:10,E03:-15,E10:-10}, payload_no:{E03:10,E10:10,TH16:10} },
  { id:"QC248", text:"좋은 변화가 곧 올 것이라는 기대가 있으시나요?", cat:"positive", payload_yes:{E13:30,TH06:15,E11:10,E01:-15,E10:-10}, payload_no:{E01:15,E10:15,E03:10,TH02:10} },
  { id:"QC249", text:"내 삶이 누군가에게 좋은 영향을 주고 있다고 느끼시나요?", cat:"positive", payload_yes:{E11:20,E14:15,TH18:15,TH13:15,E10:-15}, payload_no:{E10:15,E06:10,TH18:10} },
  { id:"QC250", text:"하나님이 나를 통해 일하고 계신다고 느끼시나요?", cat:"positive", payload_yes:{TH04:25,E15:20,TH11:15,E13:15,P12:-20}, payload_no:{P12:15,E08:10,TH04:15} }
];

// category 필드 정리 및 condition 추가
const finalCards = additionalCards.map(c => {
  const card = {
    id: c.id,
    text: c.text,
    category: c.cat,
    condition: c.cond || null,
    weight_target: {}
  };

  // payload에서 weight_target 자동 생성 (가장 높은 값 2개)
  const payloadObj = c.payload || c.payload_yes || {};
  const sorted = Object.entries(payloadObj)
    .filter(([k,v]) => v > 0)
    .sort((a,b) => b[1] - a[1])
    .slice(0, 2);
  sorted.forEach(([tag, val]) => {
    card.weight_target[tag] = val >= 30 ? 1.0 : 0.5;
  });

  // payload 복사
  if (c.payload) card.payload = c.payload;
  if (c.payload_yes) card.payload_yes = c.payload_yes;
  if (c.payload_no) card.payload_no = c.payload_no;

  return card;
});

// 기존 카드 + 신규 카드 합치기
existing.cards = [...existing.cards, ...finalCards];
existing.meta.total_cards = existing.cards.length;

const outPath = path.join(__dirname, '..', 'public', 'data', 'question-cards.json');
fs.writeFileSync(outPath, JSON.stringify(existing, null, 2), 'utf8');

console.log(`\n=== 카드 풀 확장 결과 ===`);
console.log(`총 카드: ${existing.cards.length}개`);

// 카테고리 분포
const cats = {};
existing.cards.forEach(c => { cats[c.category] = (cats[c.category] || 0) + 1; });
console.log('\n카테고리 분포:');
Object.entries(cats).sort((a,b) => b[1]-a[1]).forEach(([c,n]) => console.log(`  ${c}: ${n}`));

// 태그 커버리지
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
console.log('\n태그 커버리지:');
let uncovered = [];
allTags.forEach(tag => {
  const count = tagCov[tag] || 0;
  if (count === 0) uncovered.push(tag);
});
console.log(`  전체 태그: ${allTags.length}`);
console.log(`  커버된 태그: ${allTags.length - uncovered.length}`);
if (uncovered.length > 0) console.log(`  미커버: ${uncovered.join(', ')}`);
else console.log('  미커버: 없음 (100% 커버)');

// 최소 커버 태그
const minCover = allTags.map(t => [t, tagCov[t]||0]).sort((a,b) => a[1]-b[1]).slice(0,5);
console.log('\n가장 약한 태그 5개:');
minCover.forEach(([t,n]) => console.log(`  ${t}: ${n}회`));
