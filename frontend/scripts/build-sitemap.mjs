// After `vite build`: save the backend's sitemap as dist/sitemap.xml, so search engines get it from the
// website's own domain (a sitemap redirected to another host, e.g. api.…, is often rejected).
// Only runs when the frontend is deployed separately (VITE_API_URL set). New blog posts appear in the
// file on the next frontend deploy; Google also finds them through the /blog page.
import { writeFile } from 'node:fs/promises';

const api = (process.env.VITE_API_URL || '').replace(/\/$/, '');
if (!api) {
  console.log('sitemap: VITE_API_URL not set — the backend serves /sitemap.xml itself');
  process.exit(0);
}

async function fetchSitemap() {
  // A sleeping free backend can take about a minute to wake up
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${api}/sitemap.xml`, { signal: AbortSignal.timeout(90_000) });
      const xml = await res.text();
      if (res.ok && xml.includes('<urlset')) return xml;
      console.warn(`sitemap: attempt ${attempt} got HTTP ${res.status}`);
    } catch (err) {
      console.warn(`sitemap: attempt ${attempt} failed (${err.name})`);
    }
  }
  return null;
}

const xml = await fetchSitemap();
if (xml) {
  await writeFile(new URL('../dist/sitemap.xml', import.meta.url), xml);
  console.log(`sitemap: saved dist/sitemap.xml (${(xml.match(/<loc>/g) || []).length} pages)`);
} else {
  // Don't fail the deploy over it; the /sitemap.xml redirect rule still points at the backend
  console.warn('sitemap: backend unreachable — skipped');
}
