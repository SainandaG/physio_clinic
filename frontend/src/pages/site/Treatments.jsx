import React from 'react';
import { useSeo, useContent, useServices, PageHero, TreatmentCard, CTABand } from '../../site/shared';

export default function Treatments() {
  const { treatments } = useContent();
  useSeo({ title: treatments.seo_title || 'Treatments', description: treatments.seo_description });
  const services = useServices();
  return (
    <>
      <PageHero crumbs={[{ label: 'Treatments' }]} title={treatments.hero_title} intro={treatments.hero_intro} />
      <section className="section" style={{ background: 'var(--paper)' }}>
        <div className="wrap">
          {!services ? (
            <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Loading treatments…</p>
          ) : (
            <div className="grid-3">
              {services.map(s => <TreatmentCard key={s.id} service={s} />)}
            </div>
          )}
          <p style={{ textAlign: 'center', color: 'var(--muted)', marginTop: 36, fontSize: '.95rem' }}>
            {treatments.footer_note}
          </p>
        </div>
      </section>
      <CTABand />
    </>
  );
}
