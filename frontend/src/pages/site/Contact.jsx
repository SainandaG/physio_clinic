import React, { useState } from 'react';
import { LuMapPin, LuCalendarCheck, LuNavigation, LuClock, LuPlus, LuMinus } from 'react-icons/lu';
import { TbBrandWhatsapp } from 'react-icons/tb';
import useDoctors from '../../utils/useDoctors';
import {
  usePageTitle, useBooking, PageHero, SectionHeading, NextSlotCard,
  waHref, WA_DISPLAY, MAP_LINK, ADDRESS,
} from '../../site/shared';

const FAQS = [
  ['Do I need to be a professional athlete?', 'No. We see athletes and active people at every level — recreational players, gym-goers, runners and people returning to exercise.'],
  ['Which treatment is right for my pain?', 'It depends on your symptoms, history and assessment. We recommend the right combination after evaluating you — not every treatment suits everyone.'],
  ['Can I come in with a sports injury?', 'Yes. Book an assessment or message us on WhatsApp. Severe pain, a suspected fracture or a serious injury may need urgent medical attention first.'],
  ['What should I bring?', 'Wear comfortable clothing. Bring any scan reports, prescriptions or previous treatment notes, and a note of when your symptoms started.'],
  ['How do I book or reschedule?', 'Use the booking form to pick a free slot, or message us on WhatsApp. We confirm every appointment on WhatsApp, and you can reply there to reschedule.'],
  ['Is there parking nearby?', 'Message us on WhatsApp for the latest parking information near Masid Banda, Kondapur.'],
];

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div>
      {FAQS.map(([q, a], i) => (
        <div key={q} style={{ borderBottom: '1px solid var(--line)' }}>
          <button onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, padding: '20px 0', background: 'none', textAlign: 'left', fontWeight: 800, fontSize: '1rem', color: 'var(--navy)' }}>
            {q}
            <span className="icon-tile soft sm" style={{ width: 32, height: 32 }}>{open === i ? <LuMinus /> : <LuPlus />}</span>
          </button>
          {open === i && <p style={{ color: 'var(--muted)', paddingBottom: 20, lineHeight: 1.7, animation: 'fadeIn .25s ease' }}>{a}</p>}
        </div>
      ))}
    </div>
  );
}

export default function Contact() {
  usePageTitle('Contact & Booking');
  const book = useBooking();
  const { doctors, lead } = useDoctors();
  const timings = (doctors.length ? doctors : [lead]).find(d => d.available_days || d.timings);

  const tile = (Icon, label, value, href, cta) => (
    <div style={{ background: 'var(--white)', border: '1px solid var(--line)', borderRadius: 20, padding: 22, display: 'flex', gap: 16, alignItems: 'center' }}>
      <span className="icon-tile"><Icon /></span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '.75rem', fontWeight: 800, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>{label}</div>
        <div style={{ fontWeight: 800, color: 'var(--navy)', fontSize: '1.02rem' }}>{value}</div>
      </div>
      {href && <a href={href} target="_blank" rel="noopener" className="btn btn-outline btn-sm">{cta}</a>}
    </div>
  );

  return (
    <>
      <PageHero crumbs={[{ label: 'Contact' }]} title="Book a visit"
        intro="Choose a free slot online, or message us on WhatsApp — we'll confirm your appointment there." />

      <section className="section" style={{ background: 'var(--paper)' }}>
        <div className="wrap grid-2" style={{ alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 14 }}>
            {tile(LuMapPin, 'Clinic', ADDRESS, MAP_LINK, <><LuNavigation /> Directions</>)}
            {tile(TbBrandWhatsapp, 'WhatsApp', WA_DISPLAY, waHref('Hello! I would like to book an appointment at Srini Physio Clinics.'), 'Chat')}
            {tile(LuClock, 'Timings', timings ? [timings.available_days, timings.timings].filter(Boolean).join(' · ') : 'See live slots in the booking form')}
          </div>

          <div style={{ background: 'var(--white)', borderRadius: 28, padding: 32, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--line)' }}>
            <img src="/brand/logo-mark.png" alt="" aria-hidden="true" style={{ width: 84, marginBottom: 14 }} />
            <h2 style={{ fontFamily: 'Manrope', fontWeight: 900, color: 'var(--navy)', fontSize: '1.6rem', letterSpacing: '-.03em' }}>Book an assessment</h2>
            <p style={{ color: 'var(--muted)', margin: '8px 0 20px', lineHeight: 1.6 }}>
              Takes about a minute: pick a time, tell us how you're feeling, and send it on WhatsApp.
            </p>
            <NextSlotCard compact />
            <button onClick={() => book()} className="btn btn-navy btn-lg btn-full" style={{ marginTop: 16 }}><LuCalendarCheck /> Open booking form</button>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--white)' }}>
        <div className="wrap grid-2" style={{ alignItems: 'start' }}>
          <SectionHeading eyebrow="Good to know" title="Questions before you visit?"
            intro="Not sure which treatment you need? That's fine — start with an assessment rather than choosing a technique yourself." />
          <Faq />
        </div>
      </section>
    </>
  );
}
