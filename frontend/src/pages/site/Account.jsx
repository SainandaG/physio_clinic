import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  LuCalendarCheck, LuClock, LuHourglass, LuDumbbell, LuHistory, LuUser, LuLogOut, LuX, LuTicket, LuStethoscope, LuFileText,
} from 'react-icons/lu';
import API from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { STATUS_LABELS } from '../../utils/clinic';
import { errorMessage } from '../../utils/slots';
import { usePageTitle, useBooking, WhatsAppButton } from '../../site/shared';

const UPCOMING = ['pending', 'confirmed', 'checked_in', 'in_therapy'];
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
const fmtTime = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });

function Panel({ icon: Icon, title, children, action }) {
  return (
    <section className="acct-panel">
      <header>
        <h2><span className="icon-tile soft sm"><Icon /></span>{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}

const Empty = ({ children }) => <p className="acct-empty">{children}</p>;

function AppointmentRow({ a, onCancel }) {
  const canCancel = ['pending', 'confirmed'].includes(a.status) && a.scheduled_at && new Date(a.scheduled_at) > new Date();
  return (
    <div className="acct-row">
      <div className="acct-date">
        {a.scheduled_at ? <><b>{new Date(a.scheduled_at).toLocaleDateString('en-IN', { day: 'numeric', timeZone: 'Asia/Kolkata' })}</b>
          <span>{new Date(a.scheduled_at).toLocaleDateString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' })}</span></> : <b>—</b>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="acct-row-title">{a.service?.name || 'Physiotherapy consultation'}</div>
        <div className="acct-row-meta">
          {a.scheduled_at && <span><LuClock /> {fmtDate(a.scheduled_at)} · {fmtTime(a.scheduled_at)}</span>}
          {a.doctor && <span><LuStethoscope /> {a.doctor.name}</span>}
          {a.token_number && <span><LuTicket /> Token {a.token_number}</span>}
        </div>
      </div>
      <span className={`badge badge-${a.status}`}>{STATUS_LABELS[a.status] || a.status}</span>
      {canCancel && <button className="acct-x" onClick={() => onCancel(a)} title="Cancel appointment" aria-label="Cancel appointment"><LuX /></button>}
    </div>
  );
}

export default function Account() {
  usePageTitle('My account');
  const { user, logout, updateProfile } = useAuth();
  const book = useBooking();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [profile, setProfile] = useState({ name: user.name, phone: user.phone || '', current_password: '', new_password: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    API.get('/api/me/overview').then(r => setData(r.data)).catch(() => setData({ appointments: [], requests: [] }));
  }, []);
  useEffect(() => {
    load();
    window.addEventListener('booking:submitted', load);
    return () => window.removeEventListener('booking:submitted', load);
  }, [load]);

  const appts = data?.appointments || [];
  const upcoming = appts.filter(a => UPCOMING.includes(a.status)).sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
  const past = appts.filter(a => !UPCOMING.includes(a.status));
  const plan = appts.find(a => a.exercises?.length);
  const next = upcoming[0];

  const cancelAppt = async (a) => {
    if (!window.confirm(`Cancel your appointment on ${fmtDate(a.scheduled_at)} at ${fmtTime(a.scheduled_at)}?`)) return;
    try { await API.post(`/api/me/appointments/${a.id}/cancel`); toast.success('Appointment cancelled'); load(); }
    catch (err) { toast.error(errorMessage(err)); }
  };
  const withdraw = async (r) => {
    if (!window.confirm('Withdraw this booking request?')) return;
    try { await API.post(`/api/me/requests/${r.id}/cancel`); toast.success('Request withdrawn'); load(); }
    catch (err) { toast.error(errorMessage(err)); }
  };
  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const changes = { name: profile.name, phone: profile.phone };
      if (profile.new_password) Object.assign(changes, { current_password: profile.current_password, new_password: profile.new_password });
      await updateProfile(changes);
      setProfile(p => ({ ...p, current_password: '', new_password: '' }));
      toast.success('Profile saved');
    } catch (err) { toast.error(errorMessage(err, 'Could not save')); }
    finally { setSaving(false); }
  };

  return (
    <>
      <section className="acct-hero">
        <img src="/brand/logo-mark-light.png" alt="" aria-hidden="true" className="acct-hero-mark" />
        <div className="wrap acct-hero-inner">
          <div>
            <div className="eyebrow" style={{ color: 'var(--gold)' }}>My account</div>
            <h1 className="h-display">Hi, {user.name.split(' ')[0]}</h1>
            <p>Your appointments, requests and exercise plan from Srini Physio Clinics.</p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 22 }}>
              <button className="btn btn-gold btn-lg btn-shine" onClick={() => book()}><LuCalendarCheck /> Book a visit</button>
              <button className="btn btn-ghost btn-lg" onClick={() => { logout(); navigate('/'); }}><LuLogOut /> Sign out</button>
            </div>
          </div>
          <div className="acct-next glass-card">
            <div className="acct-next-label">Next appointment</div>
            {next ? (
              <>
                <div className="acct-next-date">{fmtDate(next.scheduled_at)}</div>
                <div className="acct-next-time">{fmtTime(next.scheduled_at)}</div>
                <div className="acct-next-meta">{next.service?.name || 'Consultation'}{next.doctor ? ` · ${next.doctor.name}` : ''}</div>
                <span className={`badge badge-${next.status}`}>{STATUS_LABELS[next.status]}</span>
              </>
            ) : data?.requests.length ? (
              <><div className="acct-next-date">Awaiting confirmation</div><div className="acct-next-meta">We'll confirm your request on WhatsApp shortly.</div></>
            ) : (
              <><div className="acct-next-date">Nothing booked yet</div><div className="acct-next-meta">Pick a free slot — it takes about a minute.</div></>
            )}
          </div>
        </div>
      </section>

      <section className="section-sm" style={{ background: 'var(--paper)' }}>
        <div className="wrap acct-grid">
          <div style={{ display: 'grid', gap: 22, alignContent: 'start' }}>
            {data?.requests.length > 0 && (
              <Panel icon={LuHourglass} title="Awaiting confirmation">
                {data.requests.map(r => (
                  <div className="acct-row" key={r.id}>
                    <div style={{ flex: 1 }}>
                      <div className="acct-row-title">{r.service_interest || 'Consultation'}</div>
                      <div className="acct-row-meta"><span><LuClock /> {[r.preferred_date, r.preferred_slot].filter(Boolean).join(' · ') || 'Any time'}</span></div>
                    </div>
                    <span className="badge badge-pending">Requested</span>
                    <button className="acct-x" onClick={() => withdraw(r)} title="Withdraw request" aria-label="Withdraw request"><LuX /></button>
                  </div>
                ))}
              </Panel>
            )}
            <Panel icon={LuCalendarCheck} title="Upcoming appointments">
              {!data ? <Empty>Loading…</Empty> : upcoming.length ? upcoming.map(a => <AppointmentRow key={a.id} a={a} onCancel={cancelAppt} />)
                : <Empty>No upcoming appointments.</Empty>}
            </Panel>
            <Panel icon={LuHistory} title="Past visits">
              {!data ? <Empty>Loading…</Empty> : past.length ? past.map(a => <AppointmentRow key={a.id} a={a} />) : <Empty>Your completed visits will appear here.</Empty>}
            </Panel>
          </div>

          <div style={{ display: 'grid', gap: 22, alignContent: 'start' }}>
            <Panel icon={LuDumbbell} title="My exercise plan">
              {plan ? (
                <>
                  <ol className="acct-plan">{plan.exercises.map((x, i) => <li key={i}>{x}</li>)}</ol>
                  {plan.follow_up_date && <p className="acct-empty" style={{ textAlign: 'left' }}>Follow-up due {fmtDate(plan.follow_up_date)}</p>}
                </>
              ) : <Empty>After your visit, your physiotherapist's home exercises will show here.</Empty>}
            </Panel>
            {data?.documents?.length > 0 && (
              <Panel icon={LuFileText} title="My documents">
                {data.documents.map(d => (
                  <a key={d.id} href={d.url} target="_blank" rel="noopener" className="acct-row acct-doc">
                    <span className="icon-tile soft sm"><LuFileText /></span>
                    <div style={{ flex: 1 }}>
                      <div className="acct-row-title">{d.title}</div>
                      <div className="acct-row-meta"><span>{fmtDate(d.created_at)}</span></div>
                    </div>
                    <span className="link-arrow">Open PDF</span>
                  </a>
                ))}
              </Panel>
            )}
            <Panel icon={LuUser} title="Profile">
              <form onSubmit={saveProfile} className="acct-form">
                <div className="field"><label>Name</label><input value={profile.name} minLength={2} required onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} /></div>
                <div className="field"><label>Mobile (WhatsApp)</label><input type="tel" value={profile.phone} minLength={10} required onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} /></div>
                <div className="field"><label>Email</label><input value={user.email} disabled /></div>
                <details>
                  <summary>Change password</summary>
                  <div className="field"><label>Current password</label><input type="password" autoComplete="current-password" value={profile.current_password} onChange={e => setProfile(p => ({ ...p, current_password: e.target.value }))} /></div>
                  <div className="field"><label>New password</label><input type="password" autoComplete="new-password" minLength={8} value={profile.new_password} onChange={e => setProfile(p => ({ ...p, new_password: e.target.value }))} /></div>
                </details>
                <button className="btn btn-navy btn-full" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
              </form>
            </Panel>
            <WhatsAppButton msg={`Hello! This is ${user.name}. I have a question about my appointment.`} className="btn btn-outline btn-full">Questions? WhatsApp us</WhatsAppButton>
          </div>
        </div>
      </section>
    </>
  );
}
