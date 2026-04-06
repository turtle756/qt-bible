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

	const response = await resolve(event);

	// 보안 헤더
	response.headers.set('X-Frame-Options', 'SAMEORIGIN');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
	response.headers.set('Content-Security-Policy',
		"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https: data:; connect-src 'self' https://bolls.life https://fonts.googleapis.com"
	);

	return response;
};
