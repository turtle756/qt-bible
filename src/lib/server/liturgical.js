/**
 * DailyQT 교회력 엔진
 * 날짜 → 절기 자동 계산 (하드 필터 A2용)
 *
 * 절기: advent | christmas | epiphany | lent | holy_week | easter | pentecost | ordinary
 */

/**
 * 부활절 날짜 계산 (Anonymous Gregorian algorithm)
 * @param {number} year
 * @returns {Date}
 */
function getEasterDate(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

/**
 * 날짜 유틸
 */
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth() === b.getMonth() &&
         a.getDate() === b.getDate();
}

function isBetween(date, start, end) {
  const d = date.getTime();
  return d >= start.getTime() && d <= end.getTime();
}

/**
 * 해당 연도의 교회력 주요 날짜 계산
 */
function getLiturgicalDates(year) {
  const easter = getEasterDate(year);

  // 부활절 기준 역산
  const ashWednesday = addDays(easter, -46);    // 재의 수요일 (사순절 시작)
  const palmSunday = addDays(easter, -7);       // 종려주일 (고난주간 시작)
  const goodFriday = addDays(easter, -2);       // 성금요일
  const pentecost = addDays(easter, 49);        // 성령강림절 (부활 후 49일)

  // 대림절: 성탄 전 4번째 주일부터
  const christmas = new Date(year, 11, 25);     // 12월 25일
  const christmasDay = christmas.getDay();      // 0=일 ~ 6=토
  // 성탄 전 4번째 주일 = 12/25에서 거슬러 가장 가까운 일요일 - 3주
  const daysToSunday = christmasDay === 0 ? 0 : christmasDay;
  const advent4thSunday = addDays(christmas, -daysToSunday);
  const adventStart = addDays(advent4thSunday, -21); // 4번째 주일 - 3주 = 1번째 주일

  return {
    adventStart,
    christmas,
    epiphanyStart: new Date(year, 0, 6),        // 1월 6일
    ashWednesday,
    palmSunday,
    goodFriday,
    easter,
    pentecost,
    // 절기 종료일
    christmasEnd: new Date(year, 0, 5),         // 1월 5일 (주현절 전날)
    easterEnd: addDays(pentecost, -1),          // 성령강림절 전날
  };
}

/**
 * 주어진 날짜의 교회력 절기 반환
 * @param {Date} date
 * @returns {{ season: string, special_day: string|null, description: string }}
 */
function getLiturgicalSeason(date) {
  const year = date.getFullYear();
  const d = getLiturgicalDates(year);
  const prevD = getLiturgicalDates(year - 1);

  // 1월 1~5일: 전년도 성탄절 기간
  if (date.getMonth() === 0 && date.getDate() <= 5) {
    return {
      season: 'christmas',
      special_day: date.getDate() === 1 ? '신년' : null,
      description: '성탄절기'
    };
  }

  // 주현절 (1/6 ~ 사순절 전)
  if (isBetween(date, d.epiphanyStart, addDays(d.ashWednesday, -1))) {
    return {
      season: 'epiphany',
      special_day: isSameDay(date, d.epiphanyStart) ? '주현절' : null,
      description: '주현절기'
    };
  }

  // 사순절 (재의 수요일 ~ 종려주일 전)
  if (isBetween(date, d.ashWednesday, addDays(d.palmSunday, -1))) {
    return {
      season: 'lent',
      special_day: isSameDay(date, d.ashWednesday) ? '재의 수요일' : null,
      description: '사순절'
    };
  }

  // 고난주간 (종려주일 ~ 부활절 전날)
  if (isBetween(date, d.palmSunday, addDays(d.easter, -1))) {
    let special = null;
    if (isSameDay(date, d.palmSunday)) special = '종려주일';
    if (isSameDay(date, addDays(d.easter, -3))) special = '성목요일';
    if (isSameDay(date, d.goodFriday)) special = '성금요일';
    if (isSameDay(date, addDays(d.easter, -1))) special = '성토요일';
    return {
      season: 'holy_week',
      special_day: special,
      description: '고난주간'
    };
  }

  // 부활절 (부활주일 ~ 성령강림절 전날)
  if (isBetween(date, d.easter, addDays(d.pentecost, -1))) {
    let special = null;
    if (isSameDay(date, d.easter)) special = '부활주일';
    if (isSameDay(date, addDays(d.easter, 39))) special = '승천일';
    return {
      season: 'easter',
      special_day: special,
      description: '부활절기'
    };
  }

  // 성령강림절 (당일만)
  if (isSameDay(date, d.pentecost)) {
    return {
      season: 'pentecost',
      special_day: '성령강림절',
      description: '성령강림절'
    };
  }

  // 대림절 (11월 말 ~ 12월 24일)
  if (isBetween(date, d.adventStart, new Date(year, 11, 24))) {
    return {
      season: 'advent',
      special_day: null,
      description: '대림절'
    };
  }

  // 성탄절 (12/25 ~ 12/31)
  if (date.getMonth() === 11 && date.getDate() >= 25) {
    return {
      season: 'christmas',
      special_day: date.getDate() === 25 ? '성탄일' : null,
      description: '성탄절기'
    };
  }

  // 나머지: 연중시기
  // 특별일 체크
  let special = null;
  // 추수감사절 (한국: 11월 셋째 주일)
  if (date.getMonth() === 10) {
    const firstDay = new Date(year, 10, 1).getDay();
    const thirdSunday = firstDay === 0 ? 15 : 22 - firstDay;
    if (date.getDate() === thirdSunday) special = '추수감사절';
  }
  // 종교개혁일 (10/31)
  if (date.getMonth() === 9 && date.getDate() === 31) special = '종교개혁일';

  return {
    season: 'ordinary',
    special_day: special,
    description: '연중시기'
  };
}

export {
  getEasterDate,
  getLiturgicalDates,
  getLiturgicalSeason
};
const _default = { getEasterDate, getLiturgicalDates, getLiturgicalSeason }; export default _default;
