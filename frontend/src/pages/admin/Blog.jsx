import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import {
  LuPlus, LuSearch, LuPencil, LuTrash2, LuExternalLink, LuArrowLeft, LuBold, LuItalic, LuHeading2, LuHeading3,
  LuList, LuListOrdered, LuQuote, LuLink, LuImage, LuEye, LuPenLine, LuNewspaper, LuClock,
} from 'react-icons/lu';
import API from '../../api/client';
import Markdown from '../../components/Markdown';
import SeoFields from '../../components/SeoFields';
import { errorMessage } from '../../utils/slots';

const EMPTY = {
  title: '', slug: '', excerpt: '', content: '', cover_image_url: '', author_name: '', tags: [],
  status: 'draft', published_at: null, seo_title: '', seo_description: '',
};

const fmt = (iso) => iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' }) : '—';
const slugify = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const isScheduled = (p) => p.status === 'published' && p.published_at && new Date(p.published_at) > new Date();
// <input type="datetime-local"> wants local "YYYY-MM-DDTHH:mm"
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

function StatusBadge({ post }) {
  if (isScheduled(post)) return <span className="badge badge-pending"><LuClock /> Scheduled</span>;
  return post.status === 'published'
    ? <span className="badge badge-confirmed">Published</span>
    : <span className="badge badge-closed">Draft</span>;
}

// ── Markdown editor with a small formatting toolbar ─────────────────────────
function MarkdownEditor({ value, onChange }) {
  const ref = useRef(null);
  const [tab, setTab] = useState('write');

  const wrap = (before, after = before, placeholder = 'text') => {
    const el = ref.current;
    const { selectionStart: a, selectionEnd: b } = el;
    const picked = value.slice(a, b) || placeholder;
    onChange(value.slice(0, a) + before + picked + after + value.slice(b));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + before.length, a + before.length + picked.length); });
  };
  const line = (prefix) => {
    const el = ref.current;
    const a = el.selectionStart;
    const start = value.lastIndexOf('\n', a - 1) + 1;
    onChange(value.slice(0, start) + prefix + value.slice(start));
    requestAnimationFrame(() => { el.focus(); el.setSelectionRange(a + prefix.length, a + prefix.length); });
  };
  const link = () => { const url = prompt('Link address (https://…)'); if (url) wrap('[', `](${url})`, 'link text'); };
  const image = () => { const url = prompt('Image address (https://… or /path.jpg)'); if (url) wrap('![', `](${url})`, 'description of the image'); };

  const tools = [
    [LuBold, 'Bold', () => wrap('**')], [LuItalic, 'Italic', () => wrap('_')],
    [LuHeading2, 'Heading', () => line('## ')], [LuHeading3, 'Subheading', () => line('### ')],
    [LuList, 'Bullet list', () => line('- ')], [LuListOrdered, 'Numbered list', () => line('1. ')],
    [LuQuote, 'Quote', () => line('> ')], [LuLink, 'Link', link], [LuImage, 'Image', image],
  ];

  return (
    <div className="md-editor">
      <div className="md-toolbar">
        <div className="md-tabs">
          <button type="button" className={tab === 'write' ? 'on' : ''} onClick={() => setTab('write')}><LuPenLine /> Write</button>
          <button type="button" className={tab === 'preview' ? 'on' : ''} onClick={() => setTab('preview')}><LuEye /> Preview</button>
        </div>
        {tab === 'write' && (
          <div className="md-tools">
            {tools.map(([Icon, label, fn]) => <button type="button" key={label} title={label} aria-label={label} onClick={fn}><Icon /></button>)}
          </div>
        )}
      </div>
      {tab === 'write' ? (
        <textarea ref={ref} value={value} onChange={e => onChange(e.target.value)} spellCheck
          placeholder={'Write your article here.\n\n## A heading\n\nA paragraph with **bold** text.\n\n- A list item'} />
      ) : (
        <div className="md-preview">{value.trim() ? <Markdown>{value}</Markdown> : <p style={{ color: 'var(--muted)' }}>Nothing to preview yet.</p>}</div>
      )}
      <div className="md-foot">Formatting uses Markdown · {(value.match(/\w+/g) || []).length} words · about {Math.max(1, Math.ceil((value.match(/\w+/g) || []).length / 200))} min read</div>
    </div>
  );
}

// ── Editor ──────────────────────────────────────────────────────────────────
function PostEditor({ postId, suffix, onClose }) {
  const [form, setForm] = useState(EMPTY);
  const [tagText, setTagText] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [loading, setLoading] = useState(!!postId);
  const [saving, setSaving] = useState(false);
  const [id, setId] = useState(postId);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!postId) return;
    API.get(`/api/blog/manage/${postId}`).then(r => {
      setForm({ ...EMPTY, ...r.data, excerpt: r.data.excerpt || '', cover_image_url: r.data.cover_image_url || '', author_name: r.data.author_name || '', seo_title: r.data.seo_title || '', seo_description: r.data.seo_description || '' });
      setTagText((r.data.tags || []).join(', '));
      setSlugTouched(true);
    }).catch(() => toast.error('Could not load the post')).finally(() => setLoading(false));
  }, [postId]);

  const set = (patch) => { setForm(f => ({ ...f, ...patch })); setDirty(true); };
  const setTitle = (title) => set(slugTouched ? { title } : { title, slug: slugify(title) });

  const save = async (status = form.status) => {
    if (form.title.trim().length < 3) { toast.error('Add a title first'); return; }
    setSaving(true);
    const body = {
      ...form, status,
      tags: tagText.split(',').map(t => t.trim()).filter(Boolean),
      published_at: form.published_at || null,
    };
    try {
      const { data } = id ? await API.put(`/api/blog/manage/${id}`, body) : await API.post('/api/blog/manage', body);
      setId(data.id);
      setForm(f => ({ ...f, slug: data.slug, status: data.status, published_at: data.published_at, author_name: data.author_name || '' }));
      setSlugTouched(true);
      setDirty(false);
      toast.success(status === 'published' ? (isScheduled(data) ? 'Scheduled' : 'Published') : 'Draft saved');
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save'));
    } finally { setSaving(false); }
  };

  const close = () => { if (!dirty || confirm('Leave without saving your changes?')) onClose(); };

  if (loading) return <div className="dash-empty">Loading…</div>;
  const live = form.status === 'published' && !isScheduled(form);

  return (
    <div className="post-editor">
      <div className="post-editor-bar">
        <button className="btn btn-outline btn-sm" onClick={close}><LuArrowLeft /> All posts</button>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <StatusBadge post={form} />
          {dirty && <span style={{ fontSize: '.8rem', color: 'var(--muted)' }}>Unsaved changes</span>}
          {live && id && <a className="btn btn-outline btn-sm" href={`/blog/${form.slug}`} target="_blank" rel="noopener"><LuExternalLink /> View</a>}
          {form.status === 'published'
            ? <button className="btn btn-outline btn-sm" disabled={saving} onClick={() => save('draft')}>Unpublish</button>
            : <button className="btn btn-outline btn-sm" disabled={saving} onClick={() => save('draft')}>Save draft</button>}
          <button className="btn btn-navy btn-sm" disabled={saving} onClick={() => save('published')}>
            {saving ? 'Saving…' : form.status === 'published' ? 'Update' : form.published_at && new Date(form.published_at) > new Date() ? 'Schedule' : 'Publish'}
          </button>
        </div>
      </div>

      <div className="post-editor-grid">
        <div className="dash-card" style={{ animation: 'none' }}>
          <input className="post-title-input" value={form.title} onChange={e => setTitle(e.target.value)} placeholder="Article title" maxLength={200} />
          <div className="post-slug">
            <span>/blog/</span>
            <input value={form.slug} onChange={e => { setSlugTouched(true); set({ slug: slugify(e.target.value) }); }} placeholder="url-of-the-article" />
          </div>
          <div className="field">
            <label>Summary</label>
            <textarea value={form.excerpt} onChange={e => set({ excerpt: e.target.value })} style={{ minHeight: 70 }}
              placeholder="One or two sentences shown on the blog page and in search results." />
          </div>
          <MarkdownEditor value={form.content} onChange={content => set({ content })} />
        </div>

        <div style={{ display: 'grid', gap: 18, alignContent: 'start' }}>
          <div className="dash-card" style={{ animation: 'none' }}>
            <div className="field">
              <label>Publish date</label>
              <input type="datetime-local" value={toLocalInput(form.published_at)}
                onChange={e => set({ published_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
              <span style={{ fontSize: '.76rem', color: 'var(--muted)' }}>Leave empty to publish now. A future date schedules the post.</span>
            </div>
            <div className="field">
              <label>Cover image</label>
              <input value={form.cover_image_url} onChange={e => set({ cover_image_url: e.target.value })} placeholder="https://… or /treatments/rehab-gym.jpg" />
              {form.cover_image_url && <img src={form.cover_image_url} alt="" className="cover-preview" onError={e => { e.currentTarget.style.display = 'none'; }} onLoad={e => { e.currentTarget.style.display = 'block'; }} />}
            </div>
            <div className="field">
              <label>Topics</label>
              <input value={tagText} onChange={e => { setTagText(e.target.value); setDirty(true); }} placeholder="e.g. Running, Knee pain" />
              <span style={{ fontSize: '.76rem', color: 'var(--muted)' }}>Separate with commas. Visitors can filter by topic.</span>
            </div>
            <div className="field" style={{ marginBottom: 0 }}>
              <label>Author</label>
              <input value={form.author_name} onChange={e => set({ author_name: e.target.value })} placeholder="Defaults to your name" />
            </div>
          </div>
          <div className="dash-card" style={{ animation: 'none' }}>
            <SeoFields title={form.seo_title} description={form.seo_description} onChange={set}
              fallbackTitle={form.title || 'Article title'} fallbackDescription={form.excerpt || 'The summary above is used.'}
              suffix={suffix} path={`/blog/${form.slug || 'url-of-the-article'}`} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── List ────────────────────────────────────────────────────────────────────
export default function Blog() {
  const [posts, setPosts] = useState(null);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState(null);   // null = list, 'new' or a post id
  const [suffix, setSuffix] = useState('');

  const load = () => API.get('/api/blog/manage').then(r => setPosts(r.data)).catch(() => setPosts([]));
  useEffect(() => {
    load();
    API.get('/api/content').then(r => setSuffix(r.data.seo.title_suffix)).catch(() => {});
  }, []);

  const remove = async (p) => {
    if (!confirm(`Delete “${p.title}”? This can't be undone.`)) return;
    await API.delete(`/api/blog/manage/${p.id}`);
    toast.success('Post deleted');
    load();
  };

  if (editing) {
    return <PostEditor key={editing} postId={editing === 'new' ? null : editing} suffix={suffix} onClose={() => { setEditing(null); load(); }} />;
  }

  const shown = (posts || []).filter(p => !search || `${p.title} ${p.excerpt || ''} ${(p.tags || []).join(' ')}`.toLowerCase().includes(search.toLowerCase()));
  const counts = { published: (posts || []).filter(p => p.status === 'published').length, draft: (posts || []).filter(p => p.status === 'draft').length };

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Manrope', fontWeight: 900, fontSize: '1.8rem', color: 'var(--navy)', margin: 0 }}>Blog</h1>
          <p style={{ color: 'var(--muted)', marginTop: 4 }}>{counts.published} published · {counts.draft} draft{counts.draft === 1 ? '' : 's'}</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a href="/blog" target="_blank" rel="noopener" className="btn btn-outline"><LuExternalLink /> View blog</a>
          <button className="btn btn-navy" onClick={() => setEditing('new')}><LuPlus /> New post</button>
        </div>
      </div>

      <div className="search-input">
        <LuSearch />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search posts" />
      </div>

      {!posts ? <div className="dash-empty">Loading…</div> : shown.length === 0 ? (
        <div className="dash-card" style={{ textAlign: 'center', padding: 48 }}>
          <LuNewspaper size={40} color="var(--gold-dark)" />
          <h3 style={{ fontFamily: 'Manrope', color: 'var(--navy)', margin: '12px 0 6px' }}>{posts.length ? 'No posts match' : 'Write your first article'}</h3>
          <p style={{ color: 'var(--muted)', marginBottom: 18 }}>Articles help patients find the clinic on Google and answer common questions.</p>
          {!posts.length && <button className="btn btn-navy" onClick={() => setEditing('new')}><LuPlus /> New post</button>}
        </div>
      ) : (
        <div className="post-list">
          {shown.map(p => (
            <div key={p.id} className="post-row">
              <div className="post-row-cover">{p.cover_image_url ? <img src={p.cover_image_url} alt="" /> : <LuNewspaper />}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="post-row-title">{p.title}</div>
                <div className="post-row-meta">
                  <StatusBadge post={p} />
                  <span>{p.status === 'published' ? fmt(p.published_at) : `Edited ${fmt(p.updated_at)}`}</span>
                  <span>{p.reading_minutes} min read</span>
                  {(p.tags || []).slice(0, 3).map(t => <span key={t} className="post-row-tag">{t}</span>)}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {p.status === 'published' && !isScheduled(p) && <a className="btn btn-outline btn-sm" href={`/blog/${p.slug}`} target="_blank" rel="noopener" aria-label="View"><LuExternalLink /></a>}
                <button className="btn btn-outline btn-sm" onClick={() => setEditing(p.id)}><LuPencil /> Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => remove(p)} aria-label="Delete"><LuTrash2 /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
