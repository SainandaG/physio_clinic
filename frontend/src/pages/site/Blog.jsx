import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LuArrowRight, LuClock, LuNewspaper } from 'react-icons/lu';
import API from '../../api/client';
import { useSeo, useContent, PageHero, CTABand } from '../../site/shared';

export const postDate = (iso) => iso
  ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
  : '';

export function PostCard({ post, featured }) {
  return (
    <Link to={`/blog/${post.slug}`} className={`card-lift post-card${featured ? ' post-card-featured' : ''}`}>
      <div className="post-cover">
        {post.cover_image_url
          ? <img src={post.cover_image_url} alt="" loading="lazy" />
          : <div className="post-cover-blank"><img src="/brand/logo-mark-light.png" alt="" aria-hidden="true" /></div>}
      </div>
      <div className="post-body">
        {post.tags?.length > 0 && <div className="post-tags">{post.tags.slice(0, 3).map(t => <span key={t}>{t}</span>)}</div>}
        <h3>{post.title}</h3>
        {post.excerpt && <p>{post.excerpt}</p>}
        <div className="post-meta">
          <span>{postDate(post.published_at)}</span>
          <span><LuClock /> {post.reading_minutes} min read</span>
        </div>
        <span className="link-arrow">Read article <LuArrowRight /></span>
      </div>
    </Link>
  );
}

export default function Blog() {
  const { blog } = useContent();
  const [params, setParams] = useSearchParams();
  const tag = params.get('tag');
  const [posts, setPosts] = useState(null);

  useSeo({ title: tag ? `${tag} — ${blog.seo_title || 'Blog'}` : blog.seo_title || 'Blog', description: blog.seo_description });
  useEffect(() => {
    API.get('/api/blog').then(r => setPosts(r.data)).catch(() => setPosts([]));
  }, []);

  const tags = [...new Set((posts || []).flatMap(p => p.tags || []))].sort((a, b) => a.localeCompare(b));
  const shown = (posts || []).filter(p => !tag || (p.tags || []).some(t => t.toLowerCase() === tag.toLowerCase()));
  const [first, ...rest] = shown;

  return (
    <>
      <PageHero crumbs={[{ label: 'Blog' }]} title={blog.hero_title} intro={blog.hero_intro} icon={LuNewspaper} />
      <section className="section" style={{ background: 'var(--paper)' }}>
        <div className="wrap">
          {tags.length > 0 && (
            <div className="tag-filter" role="group" aria-label="Filter by topic">
              <button className={!tag ? 'on' : ''} onClick={() => setParams({})}>All</button>
              {tags.map(t => <button key={t} className={tag === t ? 'on' : ''} onClick={() => setParams({ tag: t })}>{t}</button>)}
            </div>
          )}
          {!posts ? (
            <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading articles…</p>
          ) : shown.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>
              <LuNewspaper size={40} color="var(--gold-dark)" />
              <p style={{ marginTop: 12 }}>{tag ? `No articles about “${tag}” yet.` : 'New articles are on the way — check back soon.'}</p>
            </div>
          ) : (
            <>
              <PostCard post={first} featured />
              {rest.length > 0 && <div className="grid-3" style={{ marginTop: 22 }}>{rest.map(p => <PostCard key={p.id} post={p} />)}</div>}
            </>
          )}
        </div>
      </section>
      <CTABand />
    </>
  );
}
