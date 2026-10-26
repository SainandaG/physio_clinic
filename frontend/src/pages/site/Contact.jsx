import React, { useState } from 'react';
import { LuMapPin, LuCalendarCheck, LuNavigation, LuClock, LuPlus, LuMinus, LuMail } from 'react-icons/lu';
import { TbBrandWhatsapp } from 'react-icons/tb';
import useDoctors from '../../utils/useDoctors';
import {
  useSeo, useContent, useClinic, useBooking, PageHero, SectionHeading, NextSlotCard,
} from '../../site/shared';

function Faq({ faqs }) {
  const [open, setOpen] = useState(0);
  return (
    <div>
      {faqs.map(({ question: q, answer: a }, i) => (
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
  const { contact } = useContent();
  const clinic = useClinic();
  useSeo({ title: contact.seo_title || 'Contact', description: contact.seo_description });
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
      {href && <a href={href} {...(href.startsWith('mailto:') ? {} : { target: '_blank', rel: 'noopener' })} className="btn btn-outline btn-sm">{cta}</a>}
    </div>
  );

  return (
    <>
      <PageHero crumbs={[{ label: 'Contact' }]} title={contact.hero_title} intro={contact.hero_intro} />

      <section className="section" style={{ background: 'var(--paper)' }}>
        <div className="wrap grid-2" style={{ alignItems: 'start' }}>
          <div style={{ display: 'grid', gap: 14 }}>
            {tile(LuMapPin, 'Clinic', clinic.address, clinic.map_link, <><LuNavigation /> Directions</>)}
            {tile(TbBrandWhatsapp, 'WhatsApp', clinic.phone_display, clinic.waHref(`Hello! I would like to book an appointment at ${clinic.name}.`), 'Chat')}
            {tile(LuClock, 'Timings', clinic.opening_hours || (timings ? [timings.available_days, timings.timings].filter(Boolean).join(' · ') : 'See live slots in the booking form'))}
            {clinic.email && tile(LuMail, 'Email', clinic.email, `mailto:${clinic.email}`, 'Email')}
          </div>

          <div style={{ background: 'var(--white)', borderRadius: 28, padding: 32, boxShadow: 'var(--shadow-lg)', border: '1px solid var(--line)' }}>
            <img src="/brand/logo-mark.png" alt="" aria-hidden="true" style={{ width: 84, marginBottom: 14 }} />
            <h2 style={{ fontFamily: 'Manrope', fontWeight: 900, color: 'var(--navy)', fontSize: '1.6rem', letterSpacing: '-.03em' }}>{contact.booking_title}</h2>
            <p style={{ color: 'var(--muted)', margin: '8px 0 20px', lineHeight: 1.6 }}>
              {contact.booking_text}
            </p>
            <NextSlotCard compact />
            <button onClick={() => book()} className="btn btn-navy btn-lg btn-full" style={{ marginTop: 16 }}><LuCalendarCheck /> Open booking form</button>
          </div>
        </div>
      </section>

      <section className="section" style={{ background: 'var(--white)' }}>
        <div className="wrap grid-2" style={{ alignItems: 'start' }}>
          <SectionHeading eyebrow="Good to know" title={contact.faq_title} intro={contact.faq_intro} />
          <Faq faqs={contact.faqs} />
        </div>
      </section>
    </>
  );
}
