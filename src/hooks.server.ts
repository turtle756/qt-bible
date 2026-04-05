import type { Handle } from '@sveltejs/kit';
import { validateSession } from '$lib/server/auth';
import pool, { initDB } from '$lib/server/db';

// DB 초기화 (서버 시작 시 1회)
let dbReady = false;
async function ensureDB() {
	if (dbReady) return;
	await initDB();
	dbReady = true;
}

export const handle: Handle = async ({ event, resolve }) => {
	await ensureDB();
	const userId = await validateSession(event.cookies);

	if (userId) {
		const result = await pool.query(
			'SELECT id, name, email, avatar FROM users WHERE id = $1',
			[userId]
		);
		if (result.rows.length > 0) {
			event.locals.user = result.rows[0];
		}
	}

	return resolve(event);
};
