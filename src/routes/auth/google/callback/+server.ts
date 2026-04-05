import { redirect, error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { createSession } from '$lib/server/auth';
import pool from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = cookies.get('oauth_state');

	if (!code || !state || state !== storedState) {
		throw error(400, 'Invalid OAuth state');
	}

	cookies.delete('oauth_state', { path: '/' });

	// Exchange code for tokens
	const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			code,
			client_id: env.GOOGLE_CLIENT_ID!,
			client_secret: env.GOOGLE_CLIENT_SECRET!,
			redirect_uri: env.CALLBACK_URL!,
			grant_type: 'authorization_code'
		})
	});

	if (!tokenRes.ok) {
		throw error(500, 'Token exchange failed');
	}

	const tokens = await tokenRes.json();

	// Get user info
	const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
		headers: { Authorization: `Bearer ${tokens.access_token}` }
	});

	if (!userRes.ok) {
		throw error(500, 'Failed to fetch user info');
	}

	const profile = await userRes.json();

	// Upsert user
	const result = await pool.query(
		`INSERT INTO users (google_id, email, name, avatar)
		 VALUES ($1, $2, $3, $4)
		 ON CONFLICT (google_id) DO UPDATE SET email = $2, name = $3, avatar = $4
		 RETURNING id`,
		[profile.id, profile.email, profile.name, profile.picture]
	);

	const userId = result.rows[0].id;
	await createSession(userId, cookies);

	throw redirect(302, '/');
};
