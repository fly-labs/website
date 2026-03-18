import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

const SITE = 'https://flylabs.fun';

const staticRoutes = [
  { path: '/', priority: '1.0', changefreq: 'weekly' },
  { path: '/ideas', priority: '0.9', changefreq: 'daily' },
  { path: '/flybot', priority: '0.8', changefreq: 'monthly' },
  { path: '/explore', priority: '0.8', changefreq: 'weekly' },
  { path: '/prompts', priority: '0.8', changefreq: 'weekly' },
  { path: '/scoring', priority: '0.7', changefreq: 'monthly' },
  { path: '/newsletter', priority: '0.7', changefreq: 'weekly' },
  { path: '/about', priority: '0.7', changefreq: 'monthly' },
  { path: '/library', priority: '0.6', changefreq: 'monthly' },
  { path: '/templates/website-blueprint', priority: '0.6', changefreq: 'monthly' },
  { path: '/templates/launch-checklist', priority: '0.4', changefreq: 'monthly' },
  { path: '/templates/one-page-business-plan', priority: '0.4', changefreq: 'monthly' },
  { path: '/flyboard', priority: '0.5', changefreq: 'monthly' },
  { path: '/microsaas', priority: '0.4', changefreq: 'monthly' },
];

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function toISODate(date) {
  return new Date(date).toISOString().split('T')[0];
}

export default async function handler(req, res) {
  try {
    const { data: ideas, error } = await supabase
      .from('ideas')
      .select('id, updated_at')
      .eq('approved', true)
      .not('verdict', 'is', null)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const today = toISODate(new Date());

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    // Static routes
    for (const route of staticRoutes) {
      xml += `  <url>\n`;
      xml += `    <loc>${SITE}${route.path}</loc>\n`;
      xml += `    <lastmod>${today}</lastmod>\n`;
      xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
      xml += `    <priority>${route.priority}</priority>\n`;
      xml += `  </url>\n`;
    }

    // Dynamic idea pages
    if (ideas) {
      for (const idea of ideas) {
        xml += `  <url>\n`;
        xml += `    <loc>${SITE}/ideas/${escapeXml(idea.id)}</loc>\n`;
        xml += `    <lastmod>${toISODate(idea.updated_at)}</lastmod>\n`;
        xml += `    <changefreq>weekly</changefreq>\n`;
        xml += `    <priority>0.5</priority>\n`;
        xml += `  </url>\n`;
      }
    }

    xml += '</urlset>';

    res.setHeader('Content-Type', 'application/xml');
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
    res.status(200).send(xml);
  } catch (err) {
    console.error('Sitemap error:', err);
    res.status(500).send('Internal server error');
  }
}
