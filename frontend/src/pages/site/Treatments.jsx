import React from 'react';
import { usePageTitle, useServices, PageHero, TreatmentCard, CTABand } from '../../site/shared';

export default function Treatments() {
  usePageTitle('Treatments');
  const services = useServices();
  return (
    <>
      <PageHero crumbs={[{ label: 'Treatments' }]} title="Treatments"
        intro="Every plan starts with an assessment. Your physiotherapist then combines the treatments that suit your symptoms, goals and sport." />
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
            Not sure which treatment you need? That's normal — book an assessment and we'll recommend what fits.
          </p>
        </div>
      </section>
      <CTABand />
    </>
  );
}
