import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { LuMail, LuLock, LuUser, LuPhone, LuEye, LuEyeOff, LuArrowLeft, LuCalendarCheck, LuClipboardList, LuDumbbell, LuShieldCheck } from 'react-icons/lu';
import toast from 'react-hot-toast';
import { useAuth, homeFor, isStaff } from '../../context/AuthContext';
import { errorMessage } from '../../utils/slots';

const PERKS = [
  [LuCalendarCheck, 'Book in seconds', 'Your details are filled in for you.'],
  [LuClipboardList, 'All your visits', 'Upcoming appointments, tokens and history.'],
  [LuDumbbell, 'Your exercise plan', 'Home exercises from your physiotherapist, any time.'],
];

function Field({ icon: Icon, label, id, type = 'text', value, onChange, autoComplete, placeholder, minLength, toggle }) {
  const [show, setShow] = useState(false);
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-input">
        <Icon aria-hidden="true" />
        <input id={id} type={toggle && show ? 'text' : type} value={value} onChange={e => onChange(e.target.value)}
          required autoComplete={autoComplete} placeholder={placeholder} minLength={minLength} />
        {toggle && (
          <button type="button" onClick={() => setShow(s => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
            {show ? <LuEyeOff /> : <LuEye />}
          </button>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  const { user, loading, login, signup } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const [mode, setMode] = useState(pathname === '/signup' ? 'signup' : 'signin');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [busy, setBusy] = useState(false);
  const set = (k) => (v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => { document.title = `${mode === 'signup' ? 'Create account' : 'Sign in'} | Srini Physio Clinics`; }, [mode]);
  useEffect(() => { setMode(pathname === '/signup' ? 'signup' : 'signin'); }, [pathname]);

  // A "next" path is only honoured if it suits the account (patients can't be sent into /admin)
  const destination = (u) => {
    const next = params.get('next');
    if (next && next.startsWith('/') && !next.startsWith('//') && (isStaff(u) || !next.startsWith('/admin'))) return next;
    return homeFor(u);
  };

  if (!loading && user) return <Navigate to={destination(user)} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const u = mode === 'signup'
        ? await signup({ name: form.name, email: form.email, phone: form.phone, password: form.password })
        : await login(form.email, form.password);
      toast.success(mode === 'signup' ? `Welcome, ${u.name.split(' ')[0]}!` : `Welcome back, ${u.name.split(' ')[0]}!`);
      navigate(destination(u), { replace: true });
    } catch (err) {
      toast.error(errorMessage(err, mode === 'signup' ? 'Could not create your account' : 'Incorrect email or password'));
    } finally {
      setBusy(false);
    }
  };

  const switchTo = (m) => navigate({ pathname: m === 'signup' ? '/signup' : '/login', search: params.toString() }, { replace: true });

  return (
    <div className="auth-page site">
      <aside className="auth-brand">
        <span className="hero-blob hero-blob-1" aria-hidden="true" />
        <Link to="/" className="auth-back"><LuArrowLeft /> Back to website</Link>
        <div className="auth-brand-body">
          <div className="auth-orb">
            <span className="orb-ring" aria-hidden="true" />
            <span className="orb-orbit" aria-hidden="true"><i /></span>
            <img src="/brand/logo-mark-light.png" alt="" />
          </div>
          <h1>Your recovery,<br /><span className="text-shimmer">in one place.</span></h1>
          <ul>
            {PERKS.map(([Icon, title, text], i) => (
              <li key={title} style={{ animationDelay: `${.3 + i * .12}s` }}>
                <span className="icon-tile ghost sm"><Icon /></span>
                <div><strong>{title}</strong><span>{text}</span></div>
              </li>
            ))}
          </ul>
        </div>
        <div className="auth-foot"><LuShieldCheck /> Your details are only seen by the clinic team.</div>
      </aside>

      <main className="auth-main">
        <div className="auth-card">
          <Link to="/" className="auth-mobile-logo"><img src="/brand/logo-mark.png" alt="Srini Physio Clinics" /></Link>
          <div className="auth-tabs" role="tablist">
            <span className="auth-tab-glider" style={{ transform: `translateX(${mode === 'signup' ? '100%' : '0'})` }} />
            <button role="tab" aria-selected={mode === 'signin'} onClick={() => switchTo('signin')}>Sign in</button>
            <button role="tab" aria-selected={mode === 'signup'} onClick={() => switchTo('signup')}>Create account</button>
          </div>

          <h2>{mode === 'signup' ? 'Create your account' : 'Welcome back'}</h2>
          <p className="auth-sub">
            {mode === 'signup'
              ? 'Book faster and keep track of your visits and exercises.'
              : 'Patients and clinic staff sign in here.'}
          </p>

          <form onSubmit={submit} key={mode} className="auth-form">
            {mode === 'signup' && <Field icon={LuUser} id="name" label="Full name" value={form.name} onChange={set('name')} autoComplete="name" placeholder="Your name" minLength={2} />}
            <Field icon={LuMail} id="email" type="email" label="Email" value={form.email} onChange={set('email')} autoComplete="email" placeholder="you@example.com" />
            {mode === 'signup' && <Field icon={LuPhone} id="phone" type="tel" label="Mobile (WhatsApp)" value={form.phone} onChange={set('phone')} autoComplete="tel" placeholder="98765 43210" minLength={10} />}
            <Field icon={LuLock} id="password" type="password" label="Password" value={form.password} onChange={set('password')} toggle
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} placeholder={mode === 'signup' ? 'At least 8 characters' : '••••••••'} minLength={mode === 'signup' ? 8 : undefined} />
            <button type="submit" disabled={busy} className="btn btn-navy btn-lg btn-full btn-shine" style={{ marginTop: 8 }}>
              {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <p className="auth-switch">
            {mode === 'signup'
              ? <>Already have an account? <button onClick={() => switchTo('signin')}>Sign in</button></>
              : <>New to Srini Physio? <button onClick={() => switchTo('signup')}>Create an account</button></>}
          </p>
        </div>
      </main>
    </div>
  );
}
