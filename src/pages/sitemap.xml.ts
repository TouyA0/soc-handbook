import type { APIRoute } from 'astro';
import { docUrl, getDocs } from '../lib/content';

export const GET: APIRoute = async ({ site }) => {
  const docs = await getDocs();
  const absolute = (path: string) => new URL(path, site).href;
  const latest = docs.reduce((max, d) => (d.data.updated > max ? d.data.updated : max), new Date(0));
  const day = (date: Date) => date.toISOString().slice(0, 10);
  const urls = [
    { loc: absolute(docUrl('')), lastmod: day(latest) },
    ...docs.map((d) => ({ loc: absolute(docUrl(d.id)), lastmod: day(d.data.updated) })),
  ];
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join('\n') +
    '\n</urlset>\n';
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
