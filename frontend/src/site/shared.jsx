// Building blocks shared by the public site pages
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LuArrowRight, LuCalendarCheck, LuClock } from 'react-icons/lu';
import { TbBrandWhatsapp } from 'react-icons/tb';
import API from '../api/client';
import BookingModal from '../components/BookingModal';
import { FALLBACK_SERVICES, treatmentFor } from '../content/treatments';
import { clinicToday, prettyDate } from '../utils/slots';

export const WA_NUMBER = '917702225124';
export const WA_DISPLAY = '+91 77022 25124';
export const MAP_LINK = 'https://maps.app.goo.gl/XBcBKuuvjRYdtgMD7';
export const ADDRESS = 'Masid Banda, Kondapur, Hyderabad';
export const waHref = (msg) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;

// ── Booking modal, openable from any page ────────────────────────────────────
const BookingContext = createContext(() => {});
export const useBooking = () => useContext(BookingContext);

export function BookingProvider({ children }) {
  const [state, setState] = useState({ open: false, service: '', doctor: '' });
  const open = (service = '', doctorId = '') => setState({ open: true, service, doctor: doctorId ? String(doctorId) : '' });
  return (
    <BookingContext.Provider value={open}>
      {children}
      <BookingModal isOpen={state.open} onClose={() => setState(s => ({ ...s, open: false }))}
        preSelectedService={state.service} preSelectedDoctor={state.doctor} />
    </BookingContext.Provider>
  );
}

// ── Data hooks ───────────────────────────────────────────────────────────────
export function useServices() {
  const [services, setServices] = useState(null);
  useEffect(() => {
    API.get('/api/services').then(r => setServices(r.data)).catch(() => setServices(FALLBACK_SERVICES));
  }, []);
  return services;
}

// Earliest bookable slot for the lead doctor (today, or the next day with space)
export function useNextSlot() {
  const [next, setNext] = useState(null);
  useEffect(() => {
    API.get('/api/schedule/availability', { params: { date: clinicToday() } })
      .then(({ data }) => {
        const today = data.slots.find(s => s.available);
        setNext(today ? { date: data.date, slot: today.slot } : data.alternatives?.[0] || null);
      })
      .catch(() => {});
  }, []);
  return next;
}

export const slotLabel = ({ date, slot }) =>
  `${date === clinicToday() ? 'Today' : prettyDate(date)} · ${slot.replace(/ \(.*\)/, '')}`;

// Fade/slide page blocks in as they scroll into view. Picks up content that renders later
// (e.g. services from the API) via a MutationObserver; grid items are staggered.
const REVEAL_SELECTOR = '.section .wrap > :not(.grid-3), .section-sm .wrap > :not(.grid-3), .grid-3 > *';

export function useScrollReveal(root, key) {
  useEffect(() => {
    const main = root.current;
    if (!main || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    // Track what *this* observer watches (not a DOM class): React StrictMode runs effects twice,
    // and elements tagged by the first run must still be observed by the second.
    const seen = new WeakSet();
    const scan = () => main.querySelectorAll(REVEAL_SELECTOR).forEach(el => {
      if (seen.has(el) || el.classList.contains('in')) return;
      seen.add(el);
      el.classList.add('reveal');
      if (el.parentElement.classList.contains('grid-3')) el.style.transitionDelay = `${[...el.parentElement.children].indexOf(el) % 3 * 90}ms`;
      io.observe(el);
    });
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(main, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [root, key]);
}

export function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Srini Physio Clinics, Kondapur` : 'Srini Physio Clinics — Sports Physiotherapy in Kondapur, Hyderabad';
  }, [title]);
}

// ── UI pieces ────────────────────────────────────────────────────────────────
export function SectionHeading({ eyebrow, title, intro, center, light }) {
  return (
    <div style={{ textAlign: center ? 'center' : 'left', marginBottom: 44, maxWidth: center ? 640 : 720, marginInline: center ? 'auto' : 0 }}>
      {eyebrow && <div className="eyebrow" style={{ marginBottom: 14, justifyContent: center ? 'center' : 'flex-start' }}>{eyebrow}</div>}
      <h2 className="h-section" style={{ color: light ? 'var(--white)' : 'var(--navy)' }}>{title}</h2>
      {intro && <p className="lead" style={{ marginTop: 14, color: light ? 'rgba(255,255,255,.72)' : 'var(--muted)' }}>{intro}</p>}
    </div>
  );
}

export function PageHero({ crumbs = [], title, intro, children, icon: Icon }) {
  return (
    <section className="page-hero">
      <img src="/brand/logo-mark-light.png" alt="" aria-hidden="true"
        style={{ position: 'absolute', right: '-40px', bottom: '-60px', width: 420, opacity: .07, pointerEvents: 'none' }} />
      <div className="wrap" style={{ position: 'relative' }}>
        <nav className="crumbs" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          {crumbs.map(c => (
            <React.Fragment key={c.label}><span>/</span>{c.to ? <Link to={c.to}>{c.label}</Link> : <span style={{ color: 'var(--gold)' }}>{c.label}</span>}</React.Fragment>
          ))}
        </nav>
        <div style={{ display: 'flex', gap: 22, alignItems: 'flex-start' }}>
          {Icon && <span className="icon-tile ghost" style={{ width: 72, height: 72, borderRadius: 20, fontSize: '2.1rem' }}><Icon /></span>}
          <div style={{ maxWidth: 720 }}>
            <h1 className="h-display" style={{ color: 'var(--white)', fontSize: 'clamp(2.2rem, 4.6vw, 3.6rem)' }}>{title}</h1>
            {intro && <p style={{ color: 'rgba(255,255,255,.75)', fontSize: '1.1rem', lineHeight: 1.7, marginTop: 16 }}>{intro}</p>}
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}

export function TreatmentCard({ service }) {
  const t = treatmentFor(service);
  return (
    <Link to={`/treatments/${t.slug}`} className="card-lift treatment-card" style={{
      display: 'flex', flexDirection: 'column', gap: 16, padding: 28, background: 'var(--white)',
      border: '1px solid var(--line)', borderRadius: 'var(--radius)', height: '100%', overflow: 'hidden',
    }}>
      {t.image ? (
        <div className="treatment-photo" style={{ margin: '-28px -28px 14px', position: 'relative', aspectRatio: '16 / 10' }}>
          <img src={t.image} alt={`${service.name} at Srini Physio Clinics`} loading="lazy" />
          <span className="icon-tile" style={{ position: 'absolute', left: 24, bottom: -22, boxShadow: 'var(--shadow)', border: '3px solid var(--white)' }}><t.Icon /></span>
        </div>
      ) : <span className="icon-tile"><t.Icon /></span>}
      <div style={{ flex: 1 }}>
        <h3 style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: '1.2rem', color: 'var(--navy)', marginBottom: 8 }}>{service.name}</h3>
        <p style={{ color: 'var(--muted)', fontSize: '.93rem', lineHeight: 1.6 }}>{t.tagline || service.description}</p>
      </div>
      <span className="link-arrow">Learn more <LuArrowRight /></span>
    </Link>
  );
}

export const WhatsAppButton = ({ msg, children = 'WhatsApp us', className = 'btn btn-outline' }) => (
  <a href={waHref(msg)} target="_blank" rel="noopener" className={className}><TbBrandWhatsapp size={20} /> {children}</a>
);

export function NextSlotCard({ compact }) {
  const next = useNextSlot();
  const book = useBooking();
  return (
    <div className="glass-card" style={{ borderRadius: 20, padding: compact ? 18 : 22, display: 'flex', gap: 14, alignItems: 'center' }}>
      <span className="icon-tile soft sm"><LuClock /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 800, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--muted)' }}>Next available</div>
        <div style={{ fontFamily: 'Manrope', fontWeight: 900, color: 'var(--navy)', fontSize: '1.05rem', whiteSpace: compact ? 'normal' : 'nowrap' }}>{next ? slotLabel(next) : 'Check live slots'}</div>
      </div>
      <button onClick={() => book()} className="btn btn-gold btn-sm" aria-label="Book now"><LuCalendarCheck /> Book</button>
    </div>
  );
}

export function CTABand({ title = 'Ready to get back to what moves you?', text = 'Book an assessment — it takes about a minute.' }) {
  const book = useBooking();
  return (
    <section className="section-sm" style={{ background: 'var(--paper)' }}>
      <div className="wrap">
        <div style={{
          background: 'linear-gradient(135deg, var(--navy-dark), var(--navy) 70%)', borderRadius: 28, padding: 'clamp(28px, 5vw, 52px)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 28, flexWrap: 'wrap', position: 'relative', overflow: 'hidden',
        }}>
          <img src="/brand/logo-mark-light.png" alt="" aria-hidden="true" style={{ position: 'absolute', right: -30, top: -40, width: 280, opacity: .08 }} />
          <div style={{ position: 'relative', maxWidth: 560 }}>
            <h2 className="h-section" style={{ color: 'var(--white)', fontSize: 'clamp(1.6rem, 3vw, 2.4rem)' }}>{title}</h2>
            <p style={{ color: 'rgba(255,255,255,.72)', marginTop: 10 }}>{text}</p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', position: 'relative' }}>
            <button onClick={() => book()} className="btn btn-gold btn-lg"><LuCalendarCheck /> Book an Assessment</button>
            <WhatsAppButton msg="Hello! I'd like to know more about Srini Physio Clinics." className="btn btn-ghost btn-lg" />
          </div>
        </div>
      </div>
    </section>
  );
}
