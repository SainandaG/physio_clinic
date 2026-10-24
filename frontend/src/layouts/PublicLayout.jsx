import React, { useState, useEffect, useRef } from 'react';
import { Outlet, Link, NavLink, useLocation } from 'react-router-dom';
import { LuCalendarCheck, LuMenu, LuX, LuMapPin, LuNavigation, LuLogIn, LuLayoutDashboard } from 'react-icons/lu';
import { TbBrandWhatsapp } from 'react-icons/tb';
import useDoctors, { doctorLabel } from '../utils/useDoctors';
import { useAuth, isStaff } from '../context/AuthContext';
import { TREATMENTS } from '../content/treatments';
import { BookingProvider, useBooking, useScrollReveal, waHref, WA_DISPLAY, MAP_LINK, ADDRESS } from '../site/shared';

const NAV = [
  { label: 'Home', to: '/', end: true },
  { label: 'Treatments', to: '/treatments' },
  { label: 'About', to: '/about' },
  { label: 'Contact', to: '/contact' },
];

// Sign-in link, or a shortcut to the signed-in account (patients) / admin panel (staff)
function AccountLink({ mobile }) {
  const { user } = useAuth();
  if (!user) {
    return <Link to="/login" className={mobile ? 'btn btn-outline' : 'account-chip'}><LuLogIn /> Sign in</Link>;
  }
  const staff = isStaff(user);
  return (
    <Link to={staff ? '/admin/dashboard' : '/account'} className={mobile ? 'btn btn-outline' : 'account-chip'} title={staff ? 'Admin panel' : 'My account'}>
      {staff ? <LuLayoutDashboard /> : <span className="account-avatar">{user.name[0]?.toUpperCase()}</span>}
      {staff ? 'Admin' : user.name.split(' ')[0]}
    </Link>
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);
  const book = useBooking();
  const location = useLocation();

  useEffect(() => {
    const fn = () => {
      setScrolled(window.scrollY > 10);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);
  useEffect(() => { setMenuOpen(false); }, [location]);

  return (
    <header className={`site-header${scrolled ? ' scrolled' : ''}`}>
      <span className="scroll-progress" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
      <div className="wrap" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: scrolled ? 76 : 88, transition: 'height .3s ease' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12 }} aria-label="Srini Physio Clinics home">
          <img src="/brand/logo-mark.png" alt="" className="header-logo" style={{ height: scrolled ? 54 : 64 }} />
          <div>
            <div style={{ fontFamily: 'Manrope', fontWeight: 900, fontSize: '1.3rem', color: 'var(--navy)', letterSpacing: '.14em', lineHeight: 1 }}>SRINI</div>
            <div style={{ fontSize: '.68rem', fontWeight: 800, letterSpacing: '.18em', color: 'var(--gold-dark)', marginTop: 4 }}>PHYSIO CLINICS</div>
          </div>
        </Link>

        <nav className="desktop-nav" style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
          <div className="nav-pill">
            {NAV.map(n => (
              <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>{n.label}</NavLink>
            ))}
          </div>
          <AccountLink />
          <button onClick={() => book()} className="btn btn-navy btn-sm btn-shine"><LuCalendarCheck /> Book a Visit</button>
        </nav>

        <button onClick={() => setMenuOpen(p => !p)} className="hamburger" aria-label="Menu"
          style={{ display: 'none', background: 'var(--white)', border: '1.5px solid var(--line)', borderRadius: 12, padding: 9, color: 'var(--navy)', fontSize: '1.3rem' }}>
          {menuOpen ? <LuX /> : <LuMenu />}
        </button>
      </div>

      {menuOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'var(--white)', borderTop: '1px solid var(--line)', padding: 20, display: 'grid', gap: 6, boxShadow: '0 12px 32px rgba(16,47,82,.12)' }}>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.end} style={({ isActive }) => ({ fontWeight: 800, padding: '12px 4px', color: isActive ? 'var(--gold-dark)' : 'var(--navy)', borderBottom: '1px solid var(--line)' })}>{n.label}</NavLink>
          ))}
          <div style={{ display: 'grid', gap: 10, marginTop: 10 }}>
            <AccountLink mobile />
            <button onClick={() => book()} className="btn btn-navy"><LuCalendarCheck /> Book a Visit</button>
          </div>
        </div>
      )}
    </header>
  );
}

function Footer() {
  const { doctors, lead } = useDoctors();
  const col = { fontWeight: 800, color: 'var(--white)', marginBottom: 14, fontSize: '.9rem', letterSpacing: '.04em' };
  const link = { display: 'block', marginBottom: 9, color: 'rgba(255,255,255,.72)' };
  return (
    <footer style={{ background: 'var(--navy-dark)', color: 'rgba(255,255,255,.72)', padding: '64px 0 28px', fontSize: '.9rem' }}>
      <div className="wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40 }}>
        <div>
          <img src="/brand/logo-full-light.png" alt="Srini Physio Clinics — Movement is Medicine" style={{ width: 150, marginBottom: 16 }} />
          <p style={{ lineHeight: 1.7, maxWidth: 260 }}>Sports physiotherapy and recovery in Kondapur, Hyderabad.</p>
        </div>
        <div>
          <div style={col}>Treatments</div>
          {TREATMENTS.map(t => <Link key={t.slug} to={`/treatments/${t.slug}`} style={link}>{t.name}</Link>)}
        </div>
        <div>
          <div style={col}>Clinic</div>
          <Link to="/about" style={link}>About</Link>
          <Link to="/contact" style={link}>Contact & FAQs</Link>
          <div style={{ marginTop: 14, color: 'rgba(255,255,255,.6)' }}>{(doctors.length ? doctors : [lead]).map(doctorLabel).join(' · ')}</div>
        </div>
        <div>
          <div style={col}>Visit</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}><LuMapPin color="var(--gold)" style={{ flexShrink: 0, marginTop: 3 }} /> {ADDRESS}</div>
          <a href={waHref('Hello! I would like to book an appointment at Srini Physio Clinics.')} target="_blank" rel="noopener" style={{ ...link, display: 'flex', gap: 8 }}>
            <TbBrandWhatsapp color="var(--gold)" size={18} /> {WA_DISPLAY}
          </a>
          <a href={MAP_LINK} target="_blank" rel="noopener" style={{ ...link, display: 'flex', gap: 8, color: 'var(--gold)', fontWeight: 700 }}><LuNavigation /> Get directions</a>
        </div>
      </div>
      <div className="wrap" style={{ marginTop: 44, paddingTop: 22, borderTop: '1px solid rgba(255,255,255,.1)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, fontSize: '.8rem' }}>
        <span>© {new Date().getFullYear()} Srini Physio Clinics. Movement is Medicine.</span>
        <Link to="/login" style={{ color: 'rgba(255,255,255,.45)' }}>Patient & staff sign in</Link>
      </div>
    </footer>
  );
}

export default function PublicLayout() {
  const { pathname } = useLocation();
  const main = useRef(null);
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  useScrollReveal(main, pathname);

  return (
    <BookingProvider>
      <div className="site">
      <Header />
      <main ref={main}><Outlet /></main>
      <Footer />

      <a href={waHref('Hello! I would like to book an appointment at Srini Physio Clinics.')}
        target="_blank" rel="noopener" className="wa-float" title="Chat on WhatsApp" aria-label="Chat on WhatsApp">
        <TbBrandWhatsapp />
      </a>
      </div>

      <style>{`
        @media (max-width: 860px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: flex !important; }
        }
      `}</style>
    </BookingProvider>
  );
}
