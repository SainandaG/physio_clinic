// Editable website wording (Admin → Website content) and per-page SEO tags.
// The content is preloaded into the page when possible, so the site renders without waiting for the API:
// by the backend when it serves the site (window.__SITE_CONTENT__), or at build time when the frontend
// is deployed on its own (window.__SITE_DATA__, see scripts/bake-api-data.mjs). In development it is fetched.
import React, { createContext, useContext, useEffect, useState } from 'react';
import API from '../api/client';

const ContentContext = createContext(null);

/** Data built into the page at deploy time (content, services, doctors), if any. */
export const bakedData = (key) => (typeof window !== 'undefined' && window.__SITE_DATA__?.[key]) || null;

export function SiteContentProvider({ children }) {
  const [content, setContent] = useState(() => window.__SITE_CONTENT__ || bakedData('content'));
  const [failed, setFailed] = useState(false);

  const load = () => {
    setFailed(false);
    // With preloaded content a failed refresh is harmless: keep showing what we have
    API.get('/api/content').then(r => setContent(r.data)).catch(() => setFailed(true));
  };
  // Refresh even when preloaded, so admins see their edits straight away
  useEffect(load, []);

  if (!content) {
    return (
      <main style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center', justifyContent: 'center', color: 'var(--navy)', padding: 20, textAlign: 'center' }}>
        {failed ? (
          <>
            <p style={{ fontWeight: 600 }}>The website is taking longer than usual to load.</p>
            <button className="btn btn-navy btn-sm" onClick={load}>Try again</button>
          </>
        ) : <div className="spinner" role="status" aria-label="Loading" />}
      </main>
    );
  }
  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>;
}

export const useContent = () => useContext(ContentContext);

export function useClinic() {
  const { clinic } = useContent();
  return {
    ...clinic,
    waHref: (msg) => `https://wa.me/${clinic.whatsapp_number}?text=${encodeURIComponent(msg)}`,
  };
}

// ── SEO ──────────────────────────────────────────────────────────────────────
function setMeta(attr, key, value) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!value) { el?.remove(); return; }
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute('content', value);
}

function setCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) { el = document.createElement('link'); el.rel = 'canonical'; document.head.appendChild(el); }
  el.href = href;
}

const absolute = (url) => (!url ? '' : /^https?:\/\//.test(url) ? url : `${window.location.origin}/${url.replace(/^\//, '')}`);

/** Keep the head tags right while moving between pages. The server sends the same tags on first load. */
export function useSeo({ title, description, image, type = 'website', noindex = false, full = false }) {
  const content = useContext(ContentContext);
  const seo = content?.seo;
  useEffect(() => {
    if (!seo) return;
    const fullTitle = full ? title : title ? `${title} | ${seo.title_suffix}` : seo.site_title;
    const desc = description || seo.default_description;
    const url = window.location.origin + window.location.pathname;
    document.title = fullTitle;
    setMeta('name', 'description', desc);
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large');
    setMeta('property', 'og:title', fullTitle);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', url);
    setMeta('property', 'og:image', absolute(image || seo.share_image));
    setMeta('name', 'twitter:title', fullTitle);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'twitter:image', absolute(image || seo.share_image));
    setCanonical(url);
  }, [seo, title, description, image, type, noindex, full]);
}
