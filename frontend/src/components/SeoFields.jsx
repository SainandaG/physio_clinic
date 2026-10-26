// Search-result title and description, with length guidance and a Google-style preview.
import React from 'react';
import { LuSearch } from 'react-icons/lu';

const TITLE_MAX = 60;
const DESC_MAX = 160;

function Counter({ value, max }) {
  const n = value.length;
  const state = n === 0 ? 'empty' : n > max ? 'over' : n < max * 0.5 ? 'short' : 'good';
  const hint = { empty: 'using default', over: 'may be cut off', short: 'could be longer', good: 'good length' }[state];
  return <span className={`seo-count seo-${state}`}>{n}/{max} · {hint}</span>;
}

export function GooglePreview({ title, description, path }) {
  const host = window.location.host;
  return (
    <div className="google-preview" aria-label="Search result preview">
      <div className="gp-site">
        <img src="/brand/logo-mark.png" alt="" />
        <div><strong>Srini Physio Clinics</strong><span>{host}{path && path !== '/' ? ` › ${path.replace(/^\//, '').split('/').join(' › ')}` : ''}</span></div>
      </div>
      <div className="gp-title">{title.length > 65 ? title.slice(0, 64) + '…' : title}</div>
      <div className="gp-desc">{description.length > 165 ? description.slice(0, 164) + '…' : description}</div>
    </div>
  );
}

/**
 * title/description: what's stored (may be blank). fallbackTitle/fallbackDescription: what's used when blank.
 * suffix: appended to page titles (e.g. "Srini Physio Clinics, Kondapur"); omitted when fullTitle.
 */
export default function SeoFields({ title = '', description = '', onChange, fallbackTitle = '', fallbackDescription = '', suffix = '', path, fullTitle = false }) {
  const shownTitle = fullTitle ? (title || fallbackTitle) : `${title || fallbackTitle}${suffix ? ` | ${suffix}` : ''}`;
  return (
    <div className="seo-box">
      <div className="seo-head"><LuSearch /> Search engine listing</div>
      <div className="field">
        <label>SEO title <Counter value={shownTitle} max={TITLE_MAX} /></label>
        <input value={title} placeholder={fallbackTitle} onChange={e => onChange({ seo_title: e.target.value })} maxLength={200} />
      </div>
      <div className="field">
        <label>Meta description <Counter value={description || fallbackDescription} max={DESC_MAX} /></label>
        <textarea value={description} placeholder={fallbackDescription} onChange={e => onChange({ seo_description: e.target.value })}
          maxLength={300} style={{ minHeight: 70 }} />
      </div>
      <GooglePreview title={shownTitle} description={description || fallbackDescription} path={path} />
      <p className="seo-tip">Blank fields use the text shown in grey. Aim for a title under 60 characters and a description of 120–160 that says what the page offers and where.</p>
    </div>
  );
}
