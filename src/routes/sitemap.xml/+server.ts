import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  const pages = ['/', '/bible', '/share', '/login', '/privacy'];
  const today = new Date().toISOString().split('T')[0];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(p => `  <url>
    <loc>https://dailyqt.xyz${p}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p === '/' ? 'daily' : 'weekly'}</changefreq>
  </url>`).join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml' }
  });
};
