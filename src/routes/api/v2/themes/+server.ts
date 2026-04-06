import type { RequestHandler } from './$types';
import { readFileSync } from 'fs';
import { join } from 'path';

let _schedule: any = null;

function getSchedule() {
  if (_schedule) return _schedule;
  _schedule = JSON.parse(readFileSync(join(process.cwd(), 'static', 'data', 'topic-schedule.json'), 'utf8'));
  return _schedule;
}

export const GET: RequestHandler = async () => {
  const schedule = getSchedule();
  const themes = schedule.months.map((m: any) => ({ id: m.id, theme: m.theme }));
  return Response.json(themes);
};
