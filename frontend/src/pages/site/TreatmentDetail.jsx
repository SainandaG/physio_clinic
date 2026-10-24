import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { LuCalendarCheck, LuCheck, LuInfo, LuMapPin, LuArrowLeft } from 'react-icons/lu';
import { TREATMENTS, treatmentFor } from '../../content/treatments';
import {
  usePageTitle, useServices, useBooking, PageHero, TreatmentCard, NextSlotCard, WhatsAppButton, CTABand,
  MAP_LINK, ADDRESS,
} from '../../site/shared';

export default function TreatmentDetail() {
  const { slug } = useParams();
  const services = useServices();
  const book = useBooking();

  const service = services?.find(s => treatmentFor(s).slug === slug)
    || (services && TREATMENTS.some(t => t.slug === slug) ? { name: TREATMENTS.find(t => t.slug === slug).name } : null);
  const t = service ? treatmentFor(service) : null;
  usePageTitle(t ? `${t.name} in Kondapur` : 'Treatment');

  if (!services) return <div className="section" style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading…</div>;
  if (!t) {
    return (
      <div className="section wrap" style={{ textAlign: 'center' }}>
        <h1 className="h-section">Treatment not found</h1>
        <Link to="/treatments" className="btn btn-navy" style={{ marginTop: 24 }}>See all treatments</Link>
      </div>
    );
  }

  const others = services.filter(s => treatmentFor(s).slug !== slug).slice(0, 3);
  const block = (title, children) => (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontFamily: 'Manrope', fontWeight: 900, fontSize: '1.45rem', color: 'var(--navy)', marginBottom: 16, letterSpacing: '-.03em' }}>{title}</h2>
      {children}
    </div>
  );

  return (
    <>
      <PageHero crumbs={[{ label: 'Treatments', to: '/treatments' }, { label: t.name }]} title={t.name} intro={t.tagline} icon={t.Icon}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 26 }}>
          <button onClick={() => book(t.name)} className="btn btn-gold btn-lg"><LuCalendarCheck /> Book {t.name}</button>
          <WhatsAppButton msg={service.whatsapp_message || `Hello, I'm interested in ${t.name} at Srini Physio Clinics.`} className="btn btn-ghost btn-lg">Ask on WhatsApp</WhatsAppButton>
        </div>
      </PageHero>

      <section className="section" style={{ background: 'var(--white)' }}>
        <div className="wrap" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 56, alignItems: 'start' }} data-detail-grid>
          <article>
            {t.image && (
              <figure className="photo-frame" style={{ aspectRatio: '16 / 9', marginBottom: 40 }}>
                <img src={t.image} alt={`${t.name} session`} />
              </figure>
            )}
            {block('What it is', <p className="lead">{t.about}</p>)}
            {t.helpsWith.length > 0 && block('Commonly used for', (
              <ul className="check-list">{t.helpsWith.map(h => <li key={h}><LuCheck size={20} />{h}</li>)}</ul>
            ))}
            {t.expect.length > 0 && block('What to expect', (
              <ol style={{ listStyle: 'none', display: 'grid', gap: 14 }}>
                {t.expect.map((e, i) => (
                  <li key={e} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                    <span style={{ width: 32, height: 32, borderRadius: 10, background: 'var(--navy)', color: 'var(--gold)', fontFamily: 'Manrope', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ color: 'var(--navy)', paddingTop: 5, lineHeight: 1.55 }}>{e}</span>
                  </li>
                ))}
              </ol>
            ))}
            {t.note && (
              <div className="notice notice-warn" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '16px 18px', fontSize: '.92rem', lineHeight: 1.6 }}>
                <LuInfo size={20} style={{ flexShrink: 0, marginTop: 2 }} />
                <span><strong>Is it right for me?</strong> {t.note}</span>
              </div>
            )}
            <Link to="/treatments" className="link-arrow" style={{ marginTop: 32 }}><LuArrowLeft /> All treatments</Link>
          </article>

          <aside style={{ position: 'sticky', top: 100, display: 'grid', gap: 16 }}>
            <NextSlotCard compact />
            <div style={{ background: 'var(--paper)', borderRadius: 20, padding: 24, border: '1px solid var(--line)' }}>
              <div style={{ fontFamily: 'Manrope', fontWeight: 900, color: 'var(--navy)', fontSize: '1.1rem', marginBottom: 8 }}>Start with an assessment</div>
              <p style={{ color: 'var(--muted)', fontSize: '.9rem', lineHeight: 1.6, marginBottom: 18 }}>
                We'll check whether {t.name.toLowerCase()} suits you and build it into a plan with exercise and hands-on care.
              </p>
              <button onClick={() => book(t.name)} className="btn btn-navy btn-full"><LuCalendarCheck /> Book now</button>
              <a href={MAP_LINK} target="_blank" rel="noopener" style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 16, color: 'var(--navy)', fontSize: '.88rem', fontWeight: 600 }}>
                <LuMapPin color="var(--gold-dark)" /> {ADDRESS}
              </a>
            </div>
          </aside>
        </div>
      </section>

      {others.length > 0 && (
        <section className="section-sm" style={{ background: 'var(--paper)' }}>
          <div className="wrap">
            <h2 className="h-section" style={{ fontSize: '1.7rem', marginBottom: 28 }}>Other treatments</h2>
            <div className="grid-3">{others.map(s => <TreatmentCard key={s.id} service={s} />)}</div>
          </div>
        </section>
      )}
      <CTABand />
      <style>{`@media (max-width: 900px) { [data-detail-grid] { grid-template-columns: 1fr !important; } [data-detail-grid] aside { position: static !important; } }`}</style>
    </>
  );
}
