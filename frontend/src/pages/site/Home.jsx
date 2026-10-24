import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  LuArrowRight, LuCalendarCheck, LuMapPin, LuStethoscope, LuClipboardList, LuTrendingUp,
  LuMessageCircle, LuShieldCheck, LuTarget, LuBike,
} from 'react-icons/lu';
import { TbRun, TbBallFootball, TbCricket, TbBallTennis, TbBarbell, TbStretching, TbYoga } from 'react-icons/tb';
import useDoctors from '../../utils/useDoctors';
import {
  useBooking, useServices, usePageTitle, SectionHeading, TreatmentCard, NextSlotCard, CTABand, WhatsAppButton,
  MAP_LINK, ADDRESS,
} from '../../site/shared';

function Hero() {
  const book = useBooking();
  const { lead } = useDoctors();
  const visual = useRef(null);

  // Gentle 3D tilt of the logo orb following the pointer
  const tilt = (e) => {
    const el = visual.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--ry', `${((e.clientX - r.left) / r.width - .5) * 14}deg`);
    el.style.setProperty('--rx', `${((e.clientY - r.top) / r.height - .5) * -14}deg`);
  };
  const untilt = () => { visual.current?.style.setProperty('--rx', '0deg'); visual.current?.style.setProperty('--ry', '0deg'); };

  return (
    <section className="hero">
      <span className="hero-blob hero-blob-1" aria-hidden="true" />
      <span className="hero-blob hero-blob-2" aria-hidden="true" />
      <div className="wrap grid-2" style={{ alignItems: 'center', padding: 'clamp(48px, 8vw, 96px) 0', gap: 40, position: 'relative' }}>
        <div className="hero-copy">
          <div className="eyebrow" style={{ marginBottom: 18 }}>Sports physiotherapy · Kondapur</div>
          <h1 className="h-display" style={{ fontSize: 'clamp(2.8rem, 6vw, 4.9rem)' }}>
            <span className="hero-line">Move better.</span><br />
            <span className="hero-line text-shimmer">Recover stronger.</span>
          </h1>
          <p className="lead" style={{ marginTop: 22, maxWidth: 520, fontSize: '1.12rem' }}>
            Assessment-led physiotherapy for athletes and active people, with {lead.name}
            {lead.qualification ? `, ${lead.qualification}` : ''}. A clear plan, hands-on care and exercise that gets you back to what you love.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 30 }}>
            <button onClick={() => book()} className="btn btn-navy btn-lg btn-shine"><LuCalendarCheck /> Book an Assessment</button>
            <WhatsAppButton msg="Hello! I'd like to book an appointment at Srini Physio Clinics." className="btn btn-outline btn-lg">WhatsApp us</WhatsAppButton>
          </div>
          <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap', marginTop: 34, color: 'var(--navy)', fontSize: '.9rem', fontWeight: 600 }}>
            <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}><LuShieldCheck color="var(--gold-dark)" /> MPT Sports & Manual Therapy</span>
            <a href={MAP_LINK} target="_blank" rel="noopener" style={{ display: 'flex', gap: 8, alignItems: 'center' }}><LuMapPin color="var(--gold-dark)" /> {ADDRESS}</a>
          </div>
        </div>

        {/* Brand visual: the logo mark in animated rings, with a live slot card */}
        <div ref={visual} className="hero-visual" onMouseMove={tilt} onMouseLeave={untilt}>
          <div className="hero-orb">
            <span className="orb-ring" aria-hidden="true" />
            <span className="orb-orbit" aria-hidden="true"><i /></span>
            <span className="orb-orbit orb-orbit-2" aria-hidden="true"><i /></span>
            <span className="orb-shine" aria-hidden="true" />
            <img src="/brand/logo-mark.png" alt="Srini Physio Clinics running figure" className="orb-logo" />
          </div>
          <div className="float-card" style={{ position: 'absolute', left: 0, bottom: '6%', maxWidth: '90vw' }}>
            <NextSlotCard />
          </div>
          <div className="float-card float-card-2 badge-gloss" style={{ position: 'absolute', right: '2%', top: '6%' }}>
            <span className="ping-icon"><LuTarget color="var(--gold)" size={20} /></span> Return-to-sport focus
          </div>
        </div>
      </div>
    </section>
  );
}

function TreatmentsPreview() {
  const services = useServices();
  return (
    <section className="section" style={{ background: 'var(--white)' }}>
      <div className="wrap">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
          <SectionHeading eyebrow="Treatments" title="Care chosen after a proper assessment"
            intro="We start by understanding your movement, symptoms and goals — then combine the treatments that suit you." />
          <Link to="/treatments" className="link-arrow" style={{ marginBottom: 44 }}>All treatments <LuArrowRight /></Link>
        </div>
        <div className="grid-3">
          {(services || []).map(s => <TreatmentCard key={s.id} service={s} />)}
        </div>
      </div>
    </section>
  );
}

const SPORTS = [
  [TbCricket, 'Cricket'], [TbRun, 'Running'], [TbBallFootball, 'Football'], [TbBallTennis, 'Racquet sports'],
  [TbBarbell, 'Gym & strength'], [LuBike, 'Cycling'], [TbYoga, 'Dance & yoga'], [TbStretching, 'Everyday activity'],
];

function WhoWeHelp() {
  return (
    <section className="section" style={{ background: 'linear-gradient(135deg, var(--navy-dark), var(--navy))', position: 'relative', overflow: 'hidden' }}>
      <img src="/brand/logo-mark-light.png" alt="" aria-hidden="true" style={{ position: 'absolute', left: -80, bottom: -80, width: 420, opacity: .06 }} />
      <div className="wrap grid-2" style={{ alignItems: 'center', position: 'relative' }}>
        <div>
          <SectionHeading light eyebrow="Made for active lives" title="Your sport is different. Your recovery should be too."
            intro="Whether you compete, train at the weekend or just want to move without pain, your plan is built around your body, schedule and goals." />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: -16 }}>
            {SPORTS.map(([Icon, label]) => (
              <span key={label} className="chip" style={{ background: 'rgba(255,255,255,.07)', color: 'var(--white)', border: '1px solid rgba(255,255,255,.12)' }}>
                <Icon color="var(--gold)" size={18} /> {label}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gap: 14 }}>
          {[
            [LuClipboardList, 'Assess', 'Symptoms, movement, training load and what you want to get back to.'],
            [LuStethoscope, 'Treat', 'Hands-on care and the right modalities to settle pain and stiffness.'],
            [LuTrendingUp, 'Rebuild', 'Progressive strength and conditioning for a safe return to activity.'],
            [LuMessageCircle, 'Stay on track', 'Your home exercise plan on WhatsApp, reviewed as you improve.'],
          ].map(([Icon, title, text], i) => (
            <div key={title} style={{ display: 'flex', gap: 16, alignItems: 'center', background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.1)', borderRadius: 18, padding: '18px 20px' }}>
              <span className="icon-tile ghost"><Icon /></span>
              <div>
                <div style={{ color: 'var(--white)', fontFamily: 'Manrope', fontWeight: 800 }}><span style={{ color: 'var(--gold)', marginRight: 8 }}>0{i + 1}</span>{title}</div>
                <div style={{ color: 'rgba(255,255,255,.68)', fontSize: '.9rem', marginTop: 3 }}>{text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function DoctorFeature() {
  const book = useBooking();
  const { doctors, lead } = useDoctors();
  const d = lead;
  return (
    <section className="section" style={{ background: 'var(--paper)' }}>
      <div className="wrap grid-2" style={{ alignItems: 'center' }}>
        <div style={{ background: 'var(--white)', borderRadius: 28, padding: 40, border: '1px solid var(--line)', boxShadow: 'var(--shadow)', textAlign: 'center' }}>
          <img src="/brand/logo-full.png" alt="Srini Physio Clinics" style={{ width: 'min(300px, 70%)', margin: '0 auto' }} />
        </div>
        <div>
          <SectionHeading eyebrow={doctors.length > 1 ? 'Our physiotherapists' : 'Your physiotherapist'} title={d.name}
            intro={[d.qualification, d.specialization].filter(Boolean).join(' — ')} />
          {d.bio && <p className="lead" style={{ marginTop: -24, marginBottom: 24 }}>{d.bio}</p>}
          <ul className="check-list" style={{ marginBottom: 28 }}>
            {['Every plan starts with a thorough assessment', 'Honest advice on what will and won\'t help', 'Exercise-led recovery you can continue at home'].map(t => (
              <li key={t}><LuShieldCheck size={20} />{t}</li>
            ))}
          </ul>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => book('', d.id)} className="btn btn-navy"><LuCalendarCheck /> Book with {d.name}</button>
            <Link to="/about" className="btn btn-outline">About the clinic</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  usePageTitle(null);
  return (
    <>
      <Hero />
      <TreatmentsPreview />
      <WhoWeHelp />
      <DoctorFeature />
      <CTABand />
    </>
  );
}
