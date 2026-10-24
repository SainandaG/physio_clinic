import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LuCalendarDays, LuTrendingUp, LuTrendingDown, LuUserPlus, LuCircleCheck, LuArmchair, LuActivity, LuHourglass,
  LuMessageSquare, LuMonitor, LuFootprints, LuArrowRight, LuTable2, LuChartArea, LuClock, LuUserRound,
} from 'react-icons/lu';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import API from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { STATUS_LABELS } from '../../utils/clinic';

// Chart series colours: mid navy + deep gold, validated for colour-blind separation on white
const SERIES = { appointments: { color: '#24589a', label: 'Appointments' }, enquiries: { color: '#b8902f', label: 'Enquiries' } };

const shortDay = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
const greeting = () => {
  const h = Number(new Date().toLocaleString('en-IN', { hour: 'numeric', hour12: false, timeZone: 'Asia/Kolkata' }));
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

function useCountUp(target, ms = 900) {
  const [v, setV] = useState(0);
  const from = useRef(0);
  useEffect(() => {
    if (target == null) return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) { setV(target); return; }
    const start = performance.now(); const a = from.current;
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - start) / ms); const eased = 1 - Math.pow(1 - p, 3);
      setV(Math.round(a + (target - a) * eased));
      if (p < 1) raf = requestAnimationFrame(tick); else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function Delta({ current, previous, suffix = 'vs last week' }) {
  if (previous == null) return null;
  const diff = current - previous;
  const up = diff >= 0;
  return (
    <span className={`kpi-delta ${diff === 0 ? 'flat' : up ? 'up' : 'down'}`}>
      {diff === 0 ? '±0' : up ? <><LuTrendingUp /> +{diff}</> : <><LuTrendingDown /> {diff}</>} <em>{suffix}</em>
    </span>
  );
}

function Spark({ values, color }) {
  if (!values?.length) return null;
  const max = Math.max(1, ...values); const w = 100; const h = 28;
  const pts = values.map((v, i) => [(i / (values.length - 1)) * w, h - (v / max) * (h - 4) - 2]);
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="kpi-spark" preserveAspectRatio="none" aria-hidden="true">
      <path d={`${d} L${w},${h} L0,${h} Z`} fill={color} opacity=".12" />
      <path d={d} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Kpi({ icon: Icon, label, value, suffix = '', children, tone = 'navy', i = 0 }) {
  const n = useCountUp(value);
  return (
    <div className={`kpi kpi-${tone}`} style={{ animationDelay: `${i * 70}ms` }}>
      <div className="kpi-top">
        <span className="kpi-icon"><Icon /></span>
        <span className="kpi-label">{label}</span>
      </div>
      <div className="kpi-value">{value == null ? '—' : n}{suffix}</div>
      {children}
    </div>
  );
}

function Gauge({ booked, capacity }) {
  const pct = capacity ? Math.round((booked / capacity) * 100) : 0;
  const shown = useCountUp(pct);
  const r = 54; const c = 2 * Math.PI * r;
  return (
    <div className="gauge">
      <svg viewBox="0 0 140 140" role="img" aria-label={`${pct}% of today's slots booked`}>
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e3c77f" /><stop offset="100%" stopColor="#b8902f" />
          </linearGradient>
        </defs>
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--navy-tint)" strokeWidth="12" />
        <circle cx="70" cy="70" r={r} fill="none" stroke="url(#gaugeGrad)" strokeWidth="12" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (c * Math.min(pct, 100)) / 100} transform="rotate(-90 70 70)" className="gauge-arc" />
      </svg>
      <div className="gauge-center"><strong>{shown}%</strong><span>{booked} of {capacity} slots</span></div>
    </div>
  );
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <div className="chart-tip-title">{shortDay(label)}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="chart-tip-row">
          <i style={{ background: SERIES[p.dataKey].color }} />{SERIES[p.dataKey].label}<b>{p.value}</b>
        </div>
      ))}
    </div>
  );
}

const Card = ({ title, icon: Icon, action, children, className = '', style }) => (
  <section className={`dash-card ${className}`} style={style}>
    <header>
      <h3>{Icon && <Icon />}{title}</h3>
      {action}
    </header>
    {children}
  </section>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [ov, setOv] = useState(null);
  const [asTable, setAsTable] = useState(false);

  useEffect(() => {
    const load = () => Promise.all([API.get('/api/dashboard/stats'), API.get('/api/dashboard/overview')])
      .then(([s, o]) => { setStats(s.data); setOv(o.data); }).catch(() => {});
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  const trend = ov?.trend || [];
  const completionRate = ov?.completion.total ? Math.round((ov.completion.completed / ov.completion.total) * 100) : null;
  const maxService = Math.max(1, ...(ov?.services || []).map(s => s.count));

  return (
    <div className="dash">
      {/* Welcome banner */}
      <section className="dash-hero">
        <img src="/brand/logo-mark-light.png" alt="" aria-hidden="true" className="dash-hero-mark" />
        <div className="dash-hero-text">
          <div className="dash-hero-eyebrow">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Asia/Kolkata' })}</div>
          <h1>{greeting()}, <span className="text-shimmer">{user?.name?.split(' ')[0]}</span></h1>
          <p>
            {stats ? <>{stats.today_appointments} appointment{stats.today_appointments === 1 ? '' : 's'} today · {stats.new_enquiries} new enquir{stats.new_enquiries === 1 ? 'y' : 'ies'} · {stats.pending_appointments} awaiting confirmation</> : 'Loading today…'}
          </p>
        </div>
        <div className="dash-hero-actions">
          <Link to="../appointments" className="btn btn-gold btn-shine"><LuFootprints /> Walk-in check-in</Link>
          <Link to="../enquiries" className="btn btn-ghost"><LuMessageSquare /> Enquiries</Link>
          <a href="/admin/queue" target="_blank" rel="noopener" className="btn btn-ghost"><LuMonitor /> Token screen</a>
        </div>
      </section>

      {/* KPIs */}
      <div className="kpi-grid">
        <Kpi i={0} icon={LuCalendarDays} label="Today's appointments" value={stats?.today_appointments}>
          <div className="kpi-bar"><span style={{ width: `${ov?.utilisation.capacity ? Math.min(100, ov.utilisation.booked / ov.utilisation.capacity * 100) : 0}%` }} /></div>
          <span className="kpi-foot">{ov ? `${ov.utilisation.booked} of ${ov.utilisation.capacity} slots booked` : ' '}</span>
        </Kpi>
        <Kpi i={1} icon={LuActivity} label="Appointments this week" value={ov?.week.current}>
          <Spark values={trend.map(t => t.appointments)} color={SERIES.appointments.color} />
          {ov && <Delta current={ov.week.current} previous={ov.week.previous} />}
        </Kpi>
        <Kpi i={2} icon={LuUserPlus} label="New patients this month" value={ov?.new_patients.current} tone="gold">
          <span className="kpi-foot">{ov ? `${ov.patient_accounts} online account${ov.patient_accounts === 1 ? '' : 's'}` : ' '}</span>
          {ov && <Delta current={ov.new_patients.current} previous={ov.new_patients.previous} suffix="vs last month" />}
        </Kpi>
        <Kpi i={3} icon={LuCircleCheck} label="Completed (30 days)" value={completionRate} suffix={completionRate == null ? '' : '%'}>
          <span className="kpi-foot">{ov ? (ov.completion.total ? `${ov.completion.completed} done · ${ov.completion.cancelled} cancelled` : 'No past appointments yet') : ' '}</span>
        </Kpi>
      </div>

      {/* Live floor status */}
      <div className="live-grid">
        {[
          [LuArmchair, 'Waiting now', stats?.waiting_now, 'gold', stats?.waiting_now > 0],
          [LuActivity, 'In therapy', stats?.in_therapy_now, 'navy', stats?.in_therapy_now > 0],
          [LuHourglass, 'Pending confirmation', stats?.pending_appointments, 'gold'],
          [LuMessageSquare, 'New enquiries', stats?.new_enquiries, 'gold'],
          [LuUserRound, 'Total patients', stats?.total_patients, 'navy'],
        ].map(([Icon, label, value, tone, live]) => (
          <div key={label} className={`live-tile live-${tone}`}>
            <span className="live-icon"><Icon />{live && <i className="live-dot" />}</span>
            <div><strong>{value ?? '—'}</strong><span>{label}</span></div>
          </div>
        ))}
      </div>

      <div className="dash-grid">
        <Card title="Last 14 days" icon={LuChartArea} className="span-2"
          action={<button className="dash-toggle" onClick={() => setAsTable(t => !t)}>{asTable ? <><LuChartArea /> Chart</> : <><LuTable2 /> Table</>}</button>}>
          <div className="chart-legend">
            {Object.entries(SERIES).map(([k, s]) => <span key={k}><i style={{ background: s.color }} />{s.label}</span>)}
          </div>
          {asTable ? (
            <div className="dash-table-wrap">
              <table className="dash-table">
                <thead><tr><th>Day</th><th>Appointments</th><th>Completed</th><th>Enquiries</th></tr></thead>
                <tbody>{[...trend].reverse().map(t => <tr key={t.date}><td>{shortDay(t.date)}</td><td>{t.appointments}</td><td>{t.completed}</td><td>{t.enquiries}</td></tr>)}</tbody>
              </table>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={trend} margin={{ top: 10, right: 8, left: -24, bottom: 0 }}>
                <defs>
                  {Object.entries(SERIES).map(([k, s]) => (
                    <linearGradient key={k} id={`fill-${k}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={s.color} stopOpacity={0.28} /><stop offset="100%" stopColor={s.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid vertical={false} stroke="#ece7dc" />
                <XAxis dataKey="date" tickFormatter={shortDay} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} interval={1} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <Tooltip content={<TrendTooltip />} cursor={{ stroke: '#c9a451', strokeDasharray: '4 4' }} />
                {Object.entries(SERIES).map(([k, s]) => (
                  <Area key={k} type="monotone" dataKey={k} stroke={s.color} strokeWidth={2} fill={`url(#fill-${k})`}
                    dot={false} activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} animationDuration={1100} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card title="Today's capacity" icon={LuClock}>
          {ov ? <Gauge booked={ov.utilisation.booked} capacity={ov.utilisation.capacity} /> : <div className="dash-empty">Loading…</div>}
          <Link to="../schedule" className="dash-link">Open schedule <LuArrowRight /></Link>
        </Card>

        <Card title="Today's schedule" icon={LuCalendarDays} className="span-2" action={<Link to="../appointments" className="dash-link">All appointments <LuArrowRight /></Link>}>
          {!ov ? <div className="dash-empty">Loading…</div> : ov.today.length === 0 ? (
            <div className="dash-empty">No appointments booked for today.</div>
          ) : (
            <ol className="timeline">
              {ov.today.map(a => (
                <li key={a.id} className={`tl-${a.status}`}>
                  <span className="tl-time">{a.time}</span>
                  <span className="tl-dot" />
                  <div className="tl-body">
                    <strong>{a.patient}</strong>
                    <span>{[a.service, a.doctor].filter(Boolean).join(' · ') || 'Consultation'}</span>
                  </div>
                  {a.token && <span className="tl-token">{a.token}</span>}
                  <span className={`badge badge-${a.status}`}>{STATUS_LABELS[a.status] || a.status}</span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title="Treatments (90 days)" icon={LuActivity}>
          {!ov ? <div className="dash-empty">Loading…</div> : ov.services.length === 0 ? <div className="dash-empty">No appointments yet.</div> : (
            <ul className="hbars">
              {ov.services.slice(0, 6).map((s, i) => (
                <li key={s.name} title={`${s.name}: ${s.count}`}>
                  <div className="hbar-label"><span>{s.name}</span><b>{s.count}</b></div>
                  <div className="hbar-track"><span style={{ width: `${(s.count / maxService) * 100}%`, animationDelay: `${i * 80}ms` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="New enquiries" icon={LuMessageSquare} className="span-3" action={<Link to="../enquiries" className="dash-link">Open enquiries <LuArrowRight /></Link>}>
          {!ov ? <div className="dash-empty">Loading…</div> : ov.recent_enquiries.length === 0 ? <div className="dash-empty">All caught up — no new enquiries.</div> : (
            <div className="enq-grid">
              {ov.recent_enquiries.map(e => (
                <Link to="../enquiries" key={e.id} className="enq-card">
                  <span className="admin-avatar sm">{e.name[0]?.toUpperCase()}</span>
                  <div style={{ minWidth: 0 }}>
                    <strong>{e.name}</strong>
                    <span>{e.service || 'General consultation'}</span>
                    {e.preferred && <span className="enq-when"><LuClock /> {e.preferred}</span>}
                  </div>
                  {e.pain_level != null && <span className={`badge badge-${e.pain_level >= 8 ? 'urgent' : e.pain_level >= 5 ? 'moderate' : 'routine'}`}>Pain {e.pain_level}</span>}
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
