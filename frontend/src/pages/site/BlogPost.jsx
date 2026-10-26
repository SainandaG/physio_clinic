import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LuArrowLeft, LuClock, LuCalendarCheck, LuLink, LuUser } from 'react-icons/lu';
import { TbBrandWhatsapp } from 'react-icons/tb';
import toast from 'react-hot-toast';
import API from '../../api/client';
import Markdown from '../../components/Markdown';
import { useSeo, useBooking, PageHero, NextSlotCard, CTABand } from '../../site/shared';
import { PostCard, postDate } from './Blog';

const minutes = (text) => Math.max(1, Math.ceil((text.match(/\w+/g) || []).length / 200));

export default function BlogPost() {
  const { slug } = useParams();
  const book = useBooking();
  const [post, setPost] = useState(undefined);   // undefined = loading, null = not found
  const [more, setMore] = useState([]);

  useEffect(() => {
    setPost(undefined);
    API.get(`/api/blog/${slug}`).then(r => setPost(r.data)).catch(() => setPost(null));
    API.get('/api/blog').then(r => setMore(r.data.filter(p => p.slug !== slug).slice(0, 3))).catch(() => {});
  }, [slug]);

  useSeo(post
    ? { title: post.seo_title || post.title, description: post.seo_description || post.excerpt, image: post.cover_image_url, type: 'article' }
    : { title: post === null ? 'Article not found' : 'Blog', noindex: post === null });

  if (post === undefined) return <div className="section" style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>;
  if (post === null) {
    return (
      <div className="section wrap" style={{ textAlign: 'center' }}>
        <h1 className="h-section">Article not found</h1>
        <Link to="/blog" className="btn btn-navy" style={{ marginTop: 24 }}>All articles</Link>
      </div>
    );
  }

  const url = window.location.href;
  const copy = () => navigator.clipboard?.writeText(url).then(() => toast.success('Link copied')).catch(() => {});

  return (
    <>
      <PageHero crumbs={[{ label: 'Blog', to: '/blog' }, { label: post.title }]} title={post.title} intro={post.excerpt}>
        <div className="post-hero-meta">
          {post.author_name && <span><LuUser /> {post.author_name}</span>}
          <span>{postDate(post.published_at)}</span>
          <span><LuClock /> {minutes(post.content)} min read</span>
        </div>
      </PageHero>

      <section className="section" style={{ background: 'var(--white)' }}>
        <div className="wrap post-layout">
          <article>
            {post.cover_image_url && (
              <figure className="photo-frame" style={{ aspectRatio: '16 / 9', marginBottom: 36 }}>
                <img src={post.cover_image_url} alt="" />
              </figure>
            )}
            <Markdown>{post.content}</Markdown>
            {post.tags?.length > 0 && (
              <div className="post-tags" style={{ marginTop: 32 }}>
                {post.tags.map(t => <Link key={t} to={`/blog?tag=${encodeURIComponent(t)}`}>{t}</Link>)}
              </div>
            )}
            <div className="post-share">
              <span>Share</span>
              <a href={`https://wa.me/?text=${encodeURIComponent(`${post.title} ${url}`)}`} target="_blank" rel="noopener" aria-label="Share on WhatsApp"><TbBrandWhatsapp /></a>
              <button onClick={copy} aria-label="Copy link"><LuLink /></button>
            </div>
            <p className="post-disclaimer">
              This article is general information, not a diagnosis. For advice about your own symptoms, book an assessment.
            </p>
            <Link to="/blog" className="link-arrow" style={{ marginTop: 24 }}><LuArrowLeft /> All articles</Link>
          </article>
          <aside className="post-aside">
            <NextSlotCard compact />
            <div style={{ background: 'var(--paper)', borderRadius: 20, padding: 24, border: '1px solid var(--line)' }}>
              <div style={{ fontFamily: 'Manrope', fontWeight: 900, color: 'var(--navy)', fontSize: '1.1rem', marginBottom: 8 }}>Dealing with this yourself?</div>
              <p style={{ color: 'var(--muted)', fontSize: '.9rem', lineHeight: 1.6, marginBottom: 18 }}>An assessment tells you what's going on and what will actually help.</p>
              <button onClick={() => book()} className="btn btn-navy btn-full"><LuCalendarCheck /> Book an assessment</button>
            </div>
          </aside>
        </div>
      </section>

      {more.length > 0 && (
        <section className="section-sm" style={{ background: 'var(--paper)' }}>
          <div className="wrap">
            <h2 className="h-section" style={{ fontSize: '1.7rem', marginBottom: 28 }}>More articles</h2>
            <div className="grid-3">{more.map(p => <PostCard key={p.id} post={p} />)}</div>
          </div>
        </section>
      )}
      <CTABand />
    </>
  );
}
