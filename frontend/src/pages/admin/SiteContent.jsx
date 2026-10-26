import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import {
  LuBuilding2, LuHouse, LuInfo, LuHeartPulse, LuPhone, LuNewspaper, LuSearch, LuExternalLink, LuRotateCcw,
  LuPlus, LuTrash2, LuArrowUp, LuArrowDown, LuSave, LuFileText,
} from 'react-icons/lu';
import API from '../../api/client';
import SeoFields from '../../components/SeoFields';
import { errorMessage } from '../../utils/slots';

// What each section of the website lets the clinic edit. Field names match backend/app/content.py.
const SECTIONS = [
  { key: 'home', label: 'Home page', icon: LuHouse, path: '/', seo: { fallback: (c) => c.seo.site_title, full: true }, fields: [
    { name: 'eyebrow', label: 'Small heading above the title' },
    { name: 'title_line_1', label: 'Main title — first line' },
    { name: 'title_line_2', label: 'Main title — second line (gold)' },
    { name: 'intro', label: 'Introduction', type: 'textarea', hint: '{doctor} is replaced with the lead physiotherapist’s name and qualification.' },
    { name: 'badge', label: 'Badge beside the logo' },
    { name: 'treatments_title', label: 'Treatments section — title' },
    { name: 'treatments_intro', label: 'Treatments section — text', type: 'textarea' },
    { name: 'sports_eyebrow', label: '“Active lives” section — small heading' },
    { name: 'sports_title', label: '“Active lives” section — title' },
    { name: 'sports_intro', label: '“Active lives” section — text', type: 'textarea' },
    { name: 'steps', label: 'Care steps', type: 'items', item: [{ name: 'title', label: 'Step' }, { name: 'text', label: 'Description', type: 'textarea' }], max: 6 },
    { name: 'doctor_points', label: 'Physiotherapist section — points', type: 'list' },
    { name: 'cta_title', label: 'Booking banner — title (all pages)' },
    { name: 'cta_text', label: 'Booking banner — text (all pages)' },
  ] },
  { key: 'about', label: 'About page', icon: LuInfo, path: '/about', seo: { fallback: () => 'About' }, fields: [
    { name: 'hero_title', label: 'Page title' },
    { name: 'hero_intro', label: 'Introduction', type: 'textarea' },
    { name: 'steps_title', label: '“How we work” — title' },
    { name: 'steps_intro', label: '“How we work” — text', type: 'textarea' },
    { name: 'steps', label: '“How we work” — steps', type: 'items', item: [{ name: 'title', label: 'Step' }, { name: 'text', label: 'Description', type: 'textarea' }], max: 6 },
    { name: 'expect_title', label: '“What you can expect” — title' },
    { name: 'expect_points', label: '“What you can expect” — points', type: 'list' },
  ] },
  { key: 'treatments', label: 'Treatments page', icon: LuHeartPulse, path: '/treatments', seo: { fallback: () => 'Treatments' },
    note: 'Each treatment’s own page (summary, details, photo, SEO) is edited in Admin → Services.', fields: [
    { name: 'hero_title', label: 'Page title' },
    { name: 'hero_intro', label: 'Introduction', type: 'textarea' },
    { name: 'footer_note', label: 'Note below the treatments', type: 'textarea' },
  ] },
  { key: 'contact', label: 'Contact & FAQs', icon: LuPhone, path: '/contact', seo: { fallback: () => 'Contact' }, fields: [
    { name: 'hero_title', label: 'Page title' },
    { name: 'hero_intro', label: 'Introduction', type: 'textarea' },
    { name: 'booking_title', label: 'Booking box — title' },
    { name: 'booking_text', label: 'Booking box — text', type: 'textarea' },
    { name: 'faq_title', label: 'FAQ — title' },
    { name: 'faq_intro', label: 'FAQ — text', type: 'textarea' },
    { name: 'faqs', label: 'Questions & answers', type: 'items', item: [{ name: 'question', label: 'Question' }, { name: 'answer', label: 'Answer', type: 'textarea' }],
      hint: 'Also sent to Google as FAQ data, which can show the questions directly in search results.' },
  ] },
  { key: 'blog', label: 'Blog page', icon: LuNewspaper, path: '/blog', seo: { fallback: () => 'Blog' },
    note: 'Articles themselves are written in Admin → Blog.', fields: [
    { name: 'hero_title', label: 'Page title' },
    { name: 'hero_intro', label: 'Introduction', type: 'textarea' },
  ] },
  { key: 'letterhead', label: 'Treatment summaries', icon: LuFileText, path: null,
    note: 'Letterhead details printed on treatment summaries (Admin → Appointments → 📄 Summary), and how they are sent.', fields: [
    { name: 'doctor_name', label: 'Doctor name (top right)' },
    { name: 'doctor_credentials', label: 'Credentials line' },
    { name: 'doctor_specialties', label: 'Specialty lines (in red)', type: 'list' },
    { name: 'address_lines', label: 'Address lines (footer)', type: 'list' },
    { name: 'phone', label: 'Contact phone (footer)' },
    { name: 'email', label: 'Contact email (footer)' },
    { name: 'qr_link', label: 'QR code link', hint: 'Where the footer QR code leads, e.g. your Google review link. Empty uses the Google Maps link from Clinic details.' },
    { name: 'document_title', label: 'Document title' },
    { name: 'closing_note', label: 'Note at the end of every summary', type: 'textarea' },
    { name: 'auto_send', label: 'When treatment is completed', type: 'select', options: [
      ['yes', 'Send the summary on WhatsApp automatically (needs the WhatsApp Business API)'],
      ['no', 'Only send when staff press “Send on WhatsApp”'],
    ] },
    { name: 'whatsapp_message', label: 'WhatsApp message', type: 'textarea', hint: '{patient}, {doctor} and {link} are filled in. Used when sending through WhatsApp links.' },
  ] },
  { key: 'clinic', label: 'Clinic details', icon: LuBuilding2, path: '/contact', fields: [
    { name: 'name', label: 'Clinic name' },
    { name: 'phone_display', label: 'Phone number as shown', hint: 'e.g. +91 80191 41096' },
    { name: 'whatsapp_number', label: 'WhatsApp number', hint: 'Digits with country code, no spaces — e.g. 918019141096. Booking requests are sent here.' },
    { name: 'email', label: 'Email (optional)' },
    { name: 'address', label: 'Address' },
    { name: 'map_link', label: 'Google Maps link' },
    { name: 'opening_hours', label: 'Opening hours (optional)', hint: 'e.g. Mon–Sat 9 AM – 7 PM. When empty, the doctor’s timings are shown.' },
  ] },
  { key: 'seo', label: 'SEO & sharing', icon: LuSearch, path: '/', fields: [
    { name: 'site_title', label: 'Home page title in Google', hint: 'Used when the home page has no SEO title of its own.' },
    { name: 'title_suffix', label: 'Added after every page title', hint: 'e.g. “Dry Needling | Srini Physio Clinics, Kondapur”' },
    { name: 'default_description', label: 'Default description', type: 'textarea', hint: 'Used by any page without its own description. 120–160 characters works best.' },
    { name: 'share_image', label: 'Share image', hint: 'Shown when a link is shared on WhatsApp, Facebook or LinkedIn. 1200×630 works best.', image: true },
    { name: 'google_site_verification', label: 'Google Search Console verification code', hint: 'From Search Console → Add property → HTML tag: paste only the content="…" value.' },
  ] },
];

function ListField({ value, onChange }) {
  const move = (i, d) => { const v = [...value]; [v[i], v[i + d]] = [v[i + d], v[i]]; onChange(v); };
  return (
    <div className="cms-list">
      {value.map((v, i) => (
        <div key={i} className="cms-list-row">
          <input value={v} onChange={e => onChange(value.map((x, j) => (j === i ? e.target.value : x)))} />
          <RowTools i={i} n={value.length} move={move} remove={() => onChange(value.filter((_, j) => j !== i))} />
        </div>
      ))}
      <button type="button" className="btn btn-outline btn-sm" onClick={() => onChange([...value, ''])}><LuPlus /> Add</button>
    </div>
  );
}

function RowTools({ i, n, move, remove }) {
  return (
    <div className="cms-row-tools">
      <button type="button" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up"><LuArrowUp /></button>
      <button type="button" disabled={i === n - 1} onClick={() => move(i, 1)} aria-label="Move down"><LuArrowDown /></button>
      <button type="button" onClick={remove} aria-label="Remove"><LuTrash2 /></button>
    </div>
  );
}

function ItemsField({ value, onChange, item, max }) {
  const move = (i, d) => { const v = [...value]; [v[i], v[i + d]] = [v[i + d], v[i]]; onChange(v); };
  const blank = Object.fromEntries(item.map(f => [f.name, '']));
  return (
    <div className="cms-items">
      {value.map((row, i) => (
        <div key={i} className="cms-item">
          <div className="cms-item-head"><span>{i + 1}</span><RowTools i={i} n={value.length} move={move} remove={() => onChange(value.filter((_, j) => j !== i))} /></div>
          {item.map(f => (
            <div key={f.name} className="field" style={{ marginBottom: 10 }}>
              <label>{f.label}</label>
              {f.type === 'textarea'
                ? <textarea value={row[f.name] || ''} style={{ minHeight: 64 }} onChange={e => onChange(value.map((r, j) => (j === i ? { ...r, [f.name]: e.target.value } : r)))} />
                : <input value={row[f.name] || ''} onChange={e => onChange(value.map((r, j) => (j === i ? { ...r, [f.name]: e.target.value } : r)))} />}
            </div>
          ))}
        </div>
      ))}
      {(!max || value.length < max) && <button type="button" className="btn btn-outline btn-sm" onClick={() => onChange([...value, blank])}><LuPlus /> Add</button>}
    </div>
  );
}

export default function SiteContent() {
  const [content, setContent] = useState(null);
  const [active, setActive] = useState('home');
  const [form, setForm] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    API.get('/api/content').then(r => { setContent(r.data); setForm(r.data.home); }).catch(() => toast.error('Could not load website content'));
  }, []);

  const section = SECTIONS.find(s => s.key === active);
  const pick = (key) => {
    if (dirty && !confirm('Discard unsaved changes in this section?')) return;
    setActive(key); setForm(content[key]); setDirty(false);
  };
  const set = (patch) => { setForm(f => ({ ...f, ...patch })); setDirty(true); };

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await API.put(`/api/content/${active}`, form);
      setContent(c => ({ ...c, [active]: data })); setForm(data); setDirty(false);
      toast.success(`${section.label} saved — live on the website now`);
    } catch (err) { toast.error(errorMessage(err, 'Could not save')); } finally { setSaving(false); }
  };
  const reset = async () => {
    if (!confirm(`Put “${section.label}” back to the original wording? Your edits to this section will be lost.`)) return;
    const { data } = await API.delete(`/api/content/${active}`);
    setContent(c => ({ ...c, [active]: data })); setForm(data); setDirty(false);
    toast.success('Back to the original wording');
  };

  if (!content || !form) return <div className="dash-empty">Loading…</div>;

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Manrope', fontWeight: 900, fontSize: '1.8rem', color: 'var(--navy)', margin: 0 }}>Website content</h1>
          <p style={{ color: 'var(--muted)', marginTop: 4 }}>Edit the text on the website and how pages appear in Google. Changes go live when you save.</p>
        </div>
      </div>

      <div className="cms-layout">
        <nav className="cms-nav">
          {SECTIONS.map(({ key, label, icon: Icon }) => (
            <button key={key} className={active === key ? 'on' : ''} onClick={() => pick(key)}><Icon /> {label}</button>
          ))}
          <div className="cms-nav-foot">
            <a href="/sitemap.xml" target="_blank" rel="noopener">Sitemap for Google <LuExternalLink /></a>
          </div>
        </nav>

        <div className="dash-card cms-panel" style={{ animation: 'none' }}>
          <div className="cms-panel-head">
            <h2><section.icon /> {section.label}</h2>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {section.path && <a className="btn btn-outline btn-sm" href={section.path} target="_blank" rel="noopener"><LuExternalLink /> View page</a>}
              <button className="btn btn-outline btn-sm" onClick={reset}><LuRotateCcw /> Reset</button>
              <button className="btn btn-navy btn-sm" disabled={!dirty || saving} onClick={save}><LuSave /> {saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
          {section.note && <div className="notice notice-info" style={{ marginBottom: 18 }}>{section.note}</div>}

          {section.fields.map(f => (
            <div key={f.name} className="field">
              <label>{f.label}</label>
              {f.type === 'textarea' ? <textarea value={form[f.name]} onChange={e => set({ [f.name]: e.target.value })} />
                : f.type === 'list' ? <ListField value={form[f.name]} onChange={v => set({ [f.name]: v })} />
                : f.type === 'items' ? <ItemsField value={form[f.name]} item={f.item} max={f.max} onChange={v => set({ [f.name]: v })} />
                : f.type === 'select' ? <select value={form[f.name]} onChange={e => set({ [f.name]: e.target.value })}>{f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
                : <input value={form[f.name]} onChange={e => set({ [f.name]: e.target.value })} />}
              {f.hint && <span style={{ fontSize: '.76rem', color: 'var(--muted)' }}>{f.hint}</span>}
              {f.image && form[f.name] && <img src={form[f.name]} alt="" className="cover-preview" />}
            </div>
          ))}

          {section.seo && (
            <SeoFields title={form.seo_title} description={form.seo_description} onChange={set}
              fallbackTitle={section.seo.fallback(content)} fallbackDescription={content.seo.default_description}
              suffix={content.seo.title_suffix} fullTitle={!!section.seo.full} path={section.path} />
          )}
        </div>
      </div>
    </div>
  );
}
