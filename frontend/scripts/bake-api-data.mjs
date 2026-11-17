// After `vite build`, when the frontend is deployed on its own (VITE_API_URL set):
// - save the backend's sitemap as dist/sitemap.xml, so search engines get it from the website's own
//   domain (a sitemap redirected to another host, e.g. api.…, is often rejected);
// - bake the site content, treatments and doctors into dist/index.html (window.__SITE_DATA__), so the
//   site renders immediately, even while a sleeping free backend wakes up. The app still fetches fresh
//   data in the background, so admin edits show as soon as the backend answers.
// New blog posts / edits reach the baked copy on the next frontend deploy.
import { readFile, writeFile } from 'node:fs/promises';

const api = (process.env.VITE_API_URL || '').replace(/\/$/, '');
if (!api) {
  console.log('bake: VITE_API_URL not set — the backend serves the site and its data itself');
  process.exit(0);
}

const dist = (name) => new URL(`../dist/${name}`, import.meta.url);

// A sleeping free backend can take about a minute to wake up
async function get(path, check) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(`${api}${path}`, { signal: AbortSignal.timeout(90_000) });
      const body = await res.text();
      if (res.ok && check(body)) return body;
      console.warn(`bake: ${path} attempt ${attempt} got HTTP ${res.status}`);
    } catch (err) {
      console.warn(`bake: ${path} attempt ${attempt} failed (${err.name})`);
    }
  }
  return null;
}

const sitemap = await get('/sitemap.xml', (b) => b.includes('<urlset'));
if (sitemap) {
  await writeFile(dist('sitemap.xml'), sitemap);
  console.log(`bake: saved dist/sitemap.xml (${(sitemap.match(/<loc>/g) || []).length} pages)`);
} else {
  console.warn('bake: sitemap skipped (backend unreachable) — the /sitemap.xml redirect rule still applies');
}

const json = async (path) => {
  const body = await get(path, (b) => b.trim().startsWith('{') || b.trim().startsWith('['));
  return body ? JSON.parse(body) : null;
};
const data = { content: await json('/api/content'), services: await json('/api/services'), doctors: await json('/api/doctors') };

if (data.content) {
  // JSON that can't close the <script> tag it sits in
  const safe = JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026');
  const html = await readFile(dist('index.html'), 'utf8');
  await writeFile(dist('index.html'), html.replace('</head>', `  <script>window.__SITE_DATA__ = ${safe};</script>\n  </head>`));
  console.log(`bake: site content, ${data.services?.length ?? 0} treatments and ${data.doctors?.length ?? 0} doctors built into index.html`);
} else {
  console.warn('bake: site data skipped (backend unreachable) — pages will load it at run time');
}
