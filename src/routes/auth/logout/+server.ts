import { redirect } from '@sveltejs/kit';
import { deleteSession } from '$lib/server/auth';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	deleteSession(cookies);
	throw redirect(302, '/login');
};
