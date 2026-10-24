import React from 'react';
import { LuCalendarCheck, LuClipboardList, LuHandshake, LuTrendingUp, LuClock, LuStethoscope, LuShieldCheck, LuDumbbell, LuMessageCircle } from 'react-icons/lu';
import useDoctors from '../../utils/useDoctors';
import { usePageTitle, useBooking, PageHero, SectionHeading, CTABand } from '../../site/shared';

function DoctorCard({ d }) {
  const book = useBooking();
  const initial = d.name.replace(/^Dr\.?\s*/i, '')[0]?.toUpperCase();
  return (
    <div className="card-lift" style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 24, overflow: 'hidden' }}>
      <div style={{ background: 'linear-gradient(135deg, var(--navy-dark), var(--navy))', padding: '30px 28px', display: 'flex', gap: 18, alignItems: 'center', position: 'relative', overflow: 'hidden' }}>
        <img src="/brand/logo-mark-light.png" alt="" aria-hidden="true" style={{ position: 'absolute', right: -30, top: -20, width: 180, opacity: .08 }} />
        <span style={{ width: 76, height: 76, borderRadius: '50%', border: '2px solid var(--gold)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Manrope', fontWeight: 900, fontSize: '2rem', flexShrink: 0 }}>{initial}</span>
        <div style={{ position: 'relative' }}>
          <div style={{ fontFamily: 'Manrope', fontWeight: 900, color: 'var(--white)', fontSize: '1.4rem' }}>{d.name}</div>
          {d.qualification && <div style={{ color: 'var(--gold)', fontWeight: 700, marginTop: 4 }}>{d.qualification}</div>}
        </div>
      </div>
      <div style={{ padding: 28, display: 'grid', gap: 12 }}>
        {d.specialization && <div style={{ display: 'flex', gap: 10, color: 'var(--navy)', fontWeight: 600 }}><LuStethoscope color="var(--gold-dark)" size={20} style={{ flexShrink: 0 }} />{d.specialization}</div>}
        {(d.available_days || d.timings) && (
          <div style={{ display: 'flex', gap: 10, color: 'var(--muted)' }}><LuClock color="var(--gold-dark)" size={20} style={{ flexShrink: 0 }} />{[d.available_days, d.timings].filter(Boolean).join(' · ')}</div>
        )}
        {d.bio && <p style={{ color: 'var(--muted)', lineHeight: 1.7 }}>{d.bio}</p>}
        <button onClick={() => book('', d.id)} className="btn btn-navy" style={{ justifySelf: 'start', marginTop: 8 }}><LuCalendarCheck /> Book with {d.name}</button>
      </div>
    </div>
  );
}

export default function About() {
  usePageTitle('About');
  const { doctors, lead } = useDoctors();
  const list = doctors.length ? doctors : [lead];
  return (
    <>
      <PageHero crumbs={[{ label: 'About' }]} title="Sports physiotherapy, built around your comeback"
        intro="Srini Physio Clinics in Masid Banda, Kondapur helps athletes and active people recover from injury, manage pain and get back to moving with confidence." />

      <section className="section" style={{ background: 'var(--white)' }}>
        <div className="wrap">
          <SectionHeading eyebrow="Who you'll see" title={list.length > 1 ? 'Our physiotherapists' : 'Your physiotherapist'} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 460px))', gap: 22 }}>
            {list.map(d => <DoctorCard key={d.id ?? d.name} d={d} />)}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--paper)' }}>
        <div className="wrap">
          <SectionHeading eyebrow="How we work" title="Simple steps. Personal care."
            intro="No one-size-fits-all promises — we focus on understanding your needs and agreeing practical next steps with you." />
          <div className="grid-3">
            {[
              [LuClipboardList, 'Talk & assess', 'Share your symptoms, activity, history and what you want to get back to doing.'],
              [LuHandshake, 'Agree a plan', 'Discuss suitable treatment, exercise, milestones and when to review progress.'],
              [LuTrendingUp, 'Track progress', 'Adjust the plan as you respond, with a gradual and safe return to activity.'],
            ].map(([Icon, title, text], i) => (
              <div key={title} style={{ background: 'var(--white)', borderRadius: 'var(--radius)', padding: 28, border: '1px solid var(--line)', position: 'relative' }}>
                <span style={{ position: 'absolute', right: 24, top: 18, fontFamily: 'Manrope', fontWeight: 900, fontSize: '2.6rem', color: 'var(--gold-light)' }}>0{i + 1}</span>
                <span className="icon-tile"><Icon /></span>
                <h3 style={{ fontFamily: 'Manrope', fontWeight: 800, color: 'var(--navy)', fontSize: '1.15rem', margin: '18px 0 8px' }}>{title}</h3>
                <p style={{ color: 'var(--muted)', lineHeight: 1.65 }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--white)' }}>
        <div className="wrap grid-2" style={{ alignItems: 'center' }}>
          <SectionHeading eyebrow="What you can expect" title="Care that respects your time and your goals" />
          <ul className="check-list" style={{ gap: 18 }}>
            {[
              [LuShieldCheck, 'Assessment before treatment — we only recommend what suits you'],
              [LuDumbbell, 'Exercise-led recovery, with hands-on care where it helps'],
              [LuMessageCircle, 'Booking, reminders and your home exercise plan on WhatsApp'],
              [LuClock, 'Live slot availability, so you can pick a time that works'],
            ].map(([Icon, text]) => (
              <li key={text} style={{ fontSize: '1.02rem' }}><span className="icon-tile soft sm" style={{ marginTop: -6 }}><Icon /></span>{text}</li>
            ))}
          </ul>
        </div>
      </section>
      <CTABand />
    </>
  );
}
