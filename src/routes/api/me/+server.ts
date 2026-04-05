import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
  const user = event.locals.user;
  if (user) {
    return Response.json({
      loggedIn: true,
      user: { id: user.id, name: user.name, email: user.email, avatar: user.avatar }
    });
  }
  return Response.json({ loggedIn: false });
};
