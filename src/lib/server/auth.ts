import { env } from '$env/dynamic/private';

const SECRET = env.SESSION_SECRET || 'fallback-secret';
const COOKIE_NAME = 'session';

async function sign(payload: string): Promise<string> {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(SECRET),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
	const sigHex = Array.from(new Uint8Array(signature))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
	return `${payload}.${sigHex}`;
}

async function verify(token: string): Promise<string | null> {
	const lastDot = token.lastIndexOf('.');
	if (lastDot === -1) return null;
	const payload = token.substring(0, lastDot);
	const expected = await sign(payload);
	if (expected !== token) return null;
	return payload;
}

export async function createSession(userId: number, cookies: any) {
	const token = await sign(String(userId));
	cookies.set(COOKIE_NAME, token, {
		path: '/',
		httpOnly: true,
		secure: true,
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 30 // 30 days
	});
}

export async function validateSession(cookies: any): Promise<number | null> {
	const token = cookies.get(COOKIE_NAME);
	if (!token) return null;
	const payload = await verify(token);
	if (!payload) return null;
	const userId = parseInt(payload, 10);
	if (isNaN(userId)) return null;
	return userId;
}

export function deleteSession(cookies: any) {
	cookies.delete(COOKIE_NAME, { path: '/' });
}
