import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import SlotPicker from '../../components/SlotPicker';
import { clinicToday, toScheduledAt, fromScheduledAt, sendWithOverbook, errorMessage } from '../../utils/slots';
import {
  STATUS_LABELS, SOURCE_LABELS, PRIORITY_LABELS, triagePriority,
  waLink, reminderMessage, exercisePlanMessage, exportAppointmentsCsv,
} from '../../utils/clinic';
import useDoctors, { doctorLabel } from '../../utils/useDoctors';

const EMPTY = { patient_id:'', service_id:'', doctor_id:'', date:clinicToday(), slot:'', notes:'', source:'walk_in', pain_level:'' };
const EMPTY_WALKIN = { name:'', phone:'', age:'', gender:'', condition:'', service_id:'', doctor_id:'', pain_level:5, priority:'', source:'walk_in' };
const STATUS_TABS = ['', 'pending', 'confirmed', 'checked_in', 'in_therapy', 'completed', 'cancelled'];

const th = { padding:'12px 14px', textAlign:'left', fontFamily:'Manrope', fontWeight:800, color:'var(--navy)', fontSize:'.74rem', textTransform:'uppercase', letterSpacing:'.06em', whiteSpace:'nowrap' };
const td = { padding:'12px 14px', verticalAlign:'top' };

function Modal({ title, subtitle, onClose, children, width = 480 }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(16,47,82,.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:'var(--white)', borderRadius:24, padding:32, width:'100%', maxWidth:width, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(9,30,54,.3)' }}>
        <h2 style={{ fontFamily:'Manrope', fontWeight:900, fontSize:'1.3rem', color:'var(--navy)', marginBottom: subtitle ? 6 : 22 }}>{title}</h2>
        {subtitle && <p style={{ color:'var(--muted)', fontSize:'.85rem', marginBottom:20 }}>{subtitle}</p>}
        {children}
      </div>
    </div>
  );
}

// Doctor chooser — only rendered when the clinic has more than one active doctor
function DoctorField({ doctors, value, onChange }) {
  if (doctors.length < 2) return null;
  return (
    <div className="field">
      <label>Doctor</label>
      <select value={value || String(doctors[0].id)} onChange={e => onChange(e.target.value)}>
        {doctors.map(d => <option key={d.id} value={d.id}>{doctorLabel(d)}</option>)}
      </select>
    </div>
  );
}

function PainField({ value, onChange, optional }) {
  return (
    <div className="field">
      <label>Pain level {value ? <span style={{ color:'var(--gold-deep)' }}>· {value}/10</span> : optional && <span style={{ color:'var(--muted)', fontWeight:500 }}>(optional)</span>}</label>
      <input type="range" min="1" max="10" value={value || 5} onChange={e => onChange(Number(e.target.value))}
        style={{ padding:0, border:'none', accentColor:'var(--gold)' }} />
    </div>
  );
}

export default function Appointments() {
  const [appts, setAppts]       = useState([]);
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [search, setSearch]     = useState('');
  const [rescheduling, setRescheduling] = useState(null); // { appt, date, slot }
  const [walkIn, setWalkIn]     = useState(null);         // walk-in form
  const [chart, setChart]       = useState(null);         // { appt, notes, exercises, follow_up_date, pain_level, priority, newExercise }
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { doctors, multiple } = useDoctors();

  const load = () => {
    setLoading(true);
    Promise.all([
      API.get('/api/appointments', { params: { status: statusFilter || undefined, source: sourceFilter || undefined, search: search || undefined, limit: 200 } }),
      API.get('/api/patients', { params: { limit: 200 } }),
      API.get('/api/services/all'),
    ]).then(([a, p, s]) => {
      setAppts(a.data); setPatients(p.data); setServices(s.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(load, search ? 300 : 0);  // debounce typing in the search box
    return () => clearTimeout(t);
  }, [statusFilter, sourceFilter, search]);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    const { date, slot, ...rest } = form;
    const payload = {
      ...rest,
      patient_id: Number(form.patient_id),
      service_id: form.service_id ? Number(form.service_id) : null,
      doctor_id: form.doctor_id ? Number(form.doctor_id) : null,
      pain_level: form.pain_level || null,
      scheduled_at: toScheduledAt(date, slot),
    };
    try {
      const saved = await sendWithOverbook(force => API.post('/api/appointments', payload, { params: { force } }), isAdmin);
      if (!saved) return;
      toast.success('Appointment scheduled');
      setShowModal(false); setForm({ ...EMPTY, date: clinicToday() }); load();
    } catch (err) {
      toast.error(errorMessage(err, 'Error scheduling appointment'));
    } finally { setSaving(false); }
  };

  const handleReschedule = async (e) => {
    e.preventDefault(); setSaving(true);
    const { appt, date, slot } = rescheduling;
    try {
      const saved = await sendWithOverbook(
        force => API.put(`/api/appointments/${appt.id}`, {
          scheduled_at: toScheduledAt(date, slot),
          doctor_id: rescheduling.doctor_id ? Number(rescheduling.doctor_id) : null,
        }, { params: { force } }),
        isAdmin,
      );
      if (!saved) return;
      toast.success('Appointment rescheduled');
      setRescheduling(null); load();
    } catch (err) {
      toast.error(errorMessage(err, 'Reschedule failed'));
    } finally { setSaving(false); }
  };

  const handleWalkIn = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const { data } = await API.post('/api/appointments/walk-in', {
        ...walkIn,
        age: walkIn.age ? Number(walkIn.age) : null,
        service_id: walkIn.service_id ? Number(walkIn.service_id) : null,
        doctor_id: walkIn.doctor_id ? Number(walkIn.doctor_id) : null,
        priority: walkIn.priority || null,
        gender: walkIn.gender || null,
      });
      toast.success(`Checked in · Token ${data.token_number}`);
      setWalkIn(null); load();
    } catch (err) {
      toast.error(errorMessage(err, 'Walk-in registration failed'));
    } finally { setSaving(false); }
  };

  const openChart = (a) => setChart({
    appt: a, notes: a.notes || '', exercises: a.exercises || [], follow_up_date: a.follow_up_date || '',
    pain_level: a.pain_level || '', priority: a.priority || 'routine', newExercise: '',
  });

  const handleChartSave = async (e) => {
    e?.preventDefault(); setSaving(true);
    try {
      const { data } = await API.put(`/api/appointments/${chart.appt.id}`, {
        notes: chart.notes,
        exercises: chart.exercises,
        follow_up_date: chart.follow_up_date || null,
        pain_level: chart.pain_level || null,
        priority: chart.priority,
      });
      toast.success('Clinical chart saved');
      setChart(c => ({ ...c, appt: data }));
      load();
      return data;
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save chart'));
    } finally { setSaving(false); }
  };

  const addExercise = () => {
    if (!chart.newExercise.trim()) return;
    setChart(c => ({ ...c, exercises: [...c.exercises, c.newExercise.trim()], newExercise: '' }));
  };

  const updateStatus = async (id, status) => {
    try {
      const { data } = await API.put(`/api/appointments/${id}`, { status });
      toast.success(status === 'checked_in' ? `Checked in · Token ${data.token_number}` : `Marked as ${STATUS_LABELS[status]}`);
      load();
    } catch (err) { toast.error(errorMessage(err, 'Update failed')); }
  };

  const active = (s) => s !== 'completed' && s !== 'cancelled';

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'Manrope', fontWeight:900, fontSize:'1.8rem', color:'var(--navy)', margin:0 }}>Appointments</h1>
          <p style={{ color:'var(--muted)', marginTop:4 }}>{appts.length} appointment{appts.length !== 1 ? 's' : ''}</p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <Link to="/admin/queue" target="_blank" className="btn btn-outline btn-sm">📺 Token Screen</Link>
          <button onClick={() => exportAppointmentsCsv(appts)} disabled={!appts.length} className="btn btn-outline btn-sm">⬇ Export CSV</button>
          <button onClick={() => setWalkIn(EMPTY_WALKIN)} className="btn btn-gold btn-sm">🚶 Walk-in Check-in</button>
          <button onClick={() => setShowModal(true)} className="btn btn-navy btn-sm">📅 Schedule Appointment</button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
        <input placeholder="🔍 Search name, phone or token…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ flex:'1 1 240px', padding:'9px 14px', borderRadius:999, border:'1.5px solid var(--line)', background:'var(--white)', color:'var(--navy)' }} />
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
          style={{ padding:'9px 14px', borderRadius:999, border:'1.5px solid var(--line)', background:'var(--white)', color:'var(--navy)', fontWeight:600 }}>
          <option value="">All sources</option>
          {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>
      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {STATUS_TABS.map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`btn btn-sm ${statusFilter === s ? 'btn-navy' : 'btn-outline'}`}>
            {s ? STATUS_LABELS[s] : 'All'}
          </button>
        ))}
      </div>

      <div style={{ background:'var(--white)', borderRadius:16, border:'1px solid var(--line)', overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.86rem' }}>
          <thead>
            <tr style={{ background:'var(--paper)', borderBottom:'1px solid var(--line)' }}>
              {['Token','Patient','Service','Pain / Triage','Scheduled','Source','Status','Actions'].map(h => <th key={h} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>Loading…</td></tr>
            ) : appts.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>No appointments found</td></tr>
            ) : appts.map(a => (
              <tr key={a.id} style={{ borderBottom:'1px solid var(--line)' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--paper)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <td style={td}>
                  {a.token_number
                    ? <span style={{ whiteSpace:'nowrap', fontFamily:'monospace', fontWeight:800, color:'var(--navy)', background:'var(--gold-tint)', border:'1px solid var(--gold-light)', borderRadius:6, padding:'3px 7px' }}>{a.token_number}</span>
                    : <span style={{ color:'var(--muted)' }}>—</span>}
                </td>
                <td style={td}>
                  <div style={{ fontWeight:700, color:'var(--navy)' }}>{a.patient?.name || '—'}</div>
                  <div style={{ color:'var(--muted)', fontSize:'.78rem', textTransform:'capitalize' }}>
                    {[a.patient?.gender, a.patient?.age && `${a.patient.age}y`, a.patient?.phone].filter(Boolean).join(' · ')}
                  </div>
                </td>
                <td style={td}>
                  {a.service?.name || '—'}
                  {multiple && a.doctor && <div style={{ color:'var(--muted)', fontSize:'.78rem' }}>👨‍⚕️ {a.doctor.name}</div>}
                </td>
                <td style={td}>
                  {a.pain_level ? <div style={{ fontWeight:700, color:'var(--navy)' }}>{a.pain_level}/10</div> : <div style={{ color:'var(--muted)' }}>—</div>}
                  {a.priority && <span className={`badge badge-${a.priority}`} style={{ marginTop:4 }}>{PRIORITY_LABELS[a.priority]}</span>}
                </td>
                <td style={{ ...td, color:'var(--muted)', whiteSpace:'nowrap' }}>
                  {a.scheduled_at ? new Date(a.scheduled_at).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' }) : '—'}
                  {a.follow_up_date && <div style={{ fontSize:'.75rem', color:'var(--gold-deep)', marginTop:3 }}>↻ Follow-up {a.follow_up_date}</div>}
                </td>
                <td style={td}><span className={`badge badge-${a.source}`}>{SOURCE_LABELS[a.source] || a.source}</span></td>
                <td style={td}><span className={`badge badge-${a.status}`}>{STATUS_LABELS[a.status] || a.status}</span></td>
                <td style={td}>
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap', minWidth:200 }}>
                    {a.status === 'pending' && (
                      <button onClick={() => updateStatus(a.id, 'confirmed')} className="btn btn-act act-soft">Confirm</button>
                    )}
                    {(a.status === 'pending' || a.status === 'confirmed') && (
                      <button onClick={() => updateStatus(a.id, 'checked_in')} className="btn btn-act act-gold">Check In</button>
                    )}
                    {a.status === 'checked_in' && (
                      <button onClick={() => updateStatus(a.id, 'in_therapy')} className="btn btn-act act-navy">Start Therapy</button>
                    )}
                    {(a.status === 'checked_in' || a.status === 'in_therapy') && (
                      <button onClick={() => updateStatus(a.id, 'completed')} className="btn btn-act act-soft">✓ Complete</button>
                    )}
                    {(a.status === 'pending' || a.status === 'confirmed') && (
                      <button onClick={() => setRescheduling({ appt: a, doctor_id: a.doctor_id ? String(a.doctor_id) : '', ...(a.scheduled_at ? fromScheduledAt(a.scheduled_at) : { date: clinicToday(), slot: '' }) })}
                        className="btn btn-act act-soft-gold">Reschedule</button>
                    )}
                    <button onClick={() => openChart(a)} className="btn btn-act act-soft" title="Clinical chart, exercises & follow-up">📋 Chart</button>
                    {active(a.status) && a.patient?.phone && (
                      <a href={waLink(a.patient.phone, reminderMessage(a))} target="_blank" rel="noopener" className="btn btn-act btn-wa" title="Send WhatsApp reminder">💬 Remind</a>
                    )}
                    {active(a.status) && (
                      <button onClick={() => updateStatus(a.id, 'cancelled')} className="btn btn-act act-cancel">Cancel</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <Modal title="Schedule Appointment" onClose={() => setShowModal(false)}>
          <form onSubmit={handleSave}>
            <div className="field">
              <label>Patient *</label>
              <select required value={form.patient_id} onChange={e => setForm(p=>({...p,patient_id:e.target.value}))}>
                <option value="">Select patient</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name} — {p.phone}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Service</label>
              <select value={form.service_id} onChange={e => setForm(p=>({...p,service_id:e.target.value}))}>
                <option value="">Select service (optional)</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>
            <DoctorField doctors={doctors} value={form.doctor_id} onChange={v => setForm(p => ({ ...p, doctor_id: v, slot: '' }))} />
            <SlotPicker date={form.date} slot={form.slot} doctorId={form.doctor_id} onChange={v => setForm(p => ({ ...p, ...v }))} />
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div className="field">
                <label>Source</label>
                <select value={form.source} onChange={e => setForm(p=>({...p,source:e.target.value}))}>
                  {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <PainField optional value={form.pain_level} onChange={v => setForm(p => ({ ...p, pain_level: v }))} />
            </div>
            <div className="field">
              <label>Notes</label>
              <textarea placeholder="Optional notes" value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} style={{ minHeight:70 }} />
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button type="submit" disabled={saving} className="btn btn-navy" style={{ flex:1 }}>{saving ? 'Saving…' : 'Schedule'}</button>
              <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Walk-in Modal */}
      {walkIn && (
        <Modal title="Walk-in Check-in" subtitle="Patient is at the front desk — registers them (or matches by phone), checks in now and issues a queue token."
          onClose={() => setWalkIn(null)} width={520}>
          <form onSubmit={handleWalkIn}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              <div className="field">
                <label>Full name *</label>
                <input required placeholder="e.g. Meera Krishnan" value={walkIn.name} onChange={e => setWalkIn(p => ({ ...p, name: e.target.value }))} />
              </div>
              <div className="field">
                <label>Phone *</label>
                <input required placeholder="+91 98450 12345" value={walkIn.phone} onChange={e => setWalkIn(p => ({ ...p, phone: e.target.value }))} />
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1.2fr', gap:10 }}>
              <div className="field">
                <label>Age</label>
                <input type="number" min="1" max="120" value={walkIn.age} onChange={e => setWalkIn(p => ({ ...p, age: e.target.value }))} />
              </div>
              <div className="field">
                <label>Gender</label>
                <select value={walkIn.gender} onChange={e => setWalkIn(p => ({ ...p, gender: e.target.value }))}>
                  <option value="">Select</option><option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
              <div className="field">
                <label>Source</label>
                <select value={walkIn.source} onChange={e => setWalkIn(p => ({ ...p, source: e.target.value }))}>
                  <option value="walk_in">🚶 Walk-in</option><option value="whatsapp">💬 WhatsApp</option><option value="referral">🩺 Doctor referral</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>Chief complaint</label>
              <input placeholder="e.g. Acute lumbar spasm after lifting" value={walkIn.condition} onChange={e => setWalkIn(p => ({ ...p, condition: e.target.value }))} />
            </div>
            <div className="field">
              <label>Service</label>
              <select value={walkIn.service_id} onChange={e => setWalkIn(p => ({ ...p, service_id: e.target.value }))}>
                <option value="">Select service (optional)</option>
                {services.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
              </select>
            </div>
            <DoctorField doctors={doctors} value={walkIn.doctor_id} onChange={v => setWalkIn(p => ({ ...p, doctor_id: v }))} />
            <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:10, alignItems:'end' }}>
              <PainField value={walkIn.pain_level} onChange={v => setWalkIn(p => ({ ...p, pain_level: v }))} />
              <div className="field">
                <label>Triage</label>
                <select value={walkIn.priority || triagePriority(walkIn.pain_level)} onChange={e => setWalkIn(p => ({ ...p, priority: e.target.value }))}>
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button type="submit" disabled={saving} className="btn btn-gold" style={{ flex:1 }}>{saving ? 'Checking in…' : 'Check In & Issue Token'}</button>
              <button type="button" onClick={() => setWalkIn(null)} className="btn btn-outline">Cancel</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Clinical Chart Modal */}
      {chart && (
        <Modal title="Clinical Chart" width={560} onClose={() => setChart(null)}
          subtitle={`${chart.appt.patient?.name || ''}${chart.appt.token_number ? ` · ${chart.appt.token_number}` : ''} · ${STATUS_LABELS[chart.appt.status]}`}>
          <form onSubmit={handleChartSave}>
            <div style={{ display:'grid', gridTemplateColumns:'1.3fr 1fr', gap:10, alignItems:'end' }}>
              <PainField optional value={chart.pain_level} onChange={v => setChart(c => ({ ...c, pain_level: v }))} />
              <div className="field">
                <label>Triage</label>
                <select value={chart.priority} onChange={e => setChart(c => ({ ...c, priority: e.target.value }))}>
                  {Object.entries(PRIORITY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
            </div>
            <div className="field">
              <label>Therapy progress & clinical notes</label>
              <textarea placeholder="Treatment modalities, range of motion, mobilisation grades…" value={chart.notes}
                onChange={e => setChart(c => ({ ...c, notes: e.target.value }))} />
            </div>
            <div className="field">
              <label>Home exercise prescription</label>
              {chart.exercises.length === 0
                ? <div style={{ color:'var(--muted)', fontSize:'.85rem' }}>No exercises prescribed yet.</div>
                : chart.exercises.map((ex, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', background:'var(--paper)', border:'1px solid var(--line)', borderRadius:10, padding:'7px 12px', fontSize:'.86rem' }}>
                    <span>{i + 1}. {ex}</span>
                    <button type="button" onClick={() => setChart(c => ({ ...c, exercises: c.exercises.filter((_, j) => j !== i) }))}
                      style={{ background:'none', color:'var(--gold-deep)', fontWeight:800, fontSize:'1rem' }} title="Remove">×</button>
                  </div>
                ))}
              <div style={{ display:'flex', gap:8 }}>
                <input placeholder="e.g. Scapular retractions (10 reps × 3 sets)" value={chart.newExercise}
                  onChange={e => setChart(c => ({ ...c, newExercise: e.target.value }))}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addExercise(); } }} />
                <button type="button" onClick={addExercise} className="btn btn-sm btn-outline">Add</button>
              </div>
            </div>
            <div className="field">
              <label>Follow-up review date</label>
              <input type="date" min={clinicToday()} value={chart.follow_up_date} onChange={e => setChart(c => ({ ...c, follow_up_date: e.target.value }))} />
            </div>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <button type="submit" disabled={saving} className="btn btn-navy" style={{ flex:1 }}>{saving ? 'Saving…' : 'Save Chart'}</button>
              {chart.appt.patient?.phone && chart.exercises.length > 0 && (
                <a className="btn btn-wa" target="_blank" rel="noopener"
                  href={waLink(chart.appt.patient.phone, exercisePlanMessage({ ...chart.appt, exercises: chart.exercises, follow_up_date: chart.follow_up_date }))}>
                  💬 Send Plan on WhatsApp
                </a>
              )}
              <button type="button" onClick={() => setChart(null)} className="btn btn-outline">Close</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reschedule Modal */}
      {rescheduling && (
        <Modal title="Reschedule Appointment" onClose={() => setRescheduling(null)}
          subtitle={`${rescheduling.appt.patient?.name} · currently ${rescheduling.appt.scheduled_at
            ? new Date(rescheduling.appt.scheduled_at).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' }) : 'unscheduled'}`}>
          <form onSubmit={handleReschedule}>
            <DoctorField doctors={doctors} value={rescheduling.doctor_id} onChange={v => setRescheduling(p => ({ ...p, doctor_id: v }))} />
            <SlotPicker date={rescheduling.date} slot={rescheduling.slot} ownApptId={rescheduling.appt.id} doctorId={rescheduling.doctor_id}
              onChange={v => setRescheduling(p => ({ ...p, ...v }))} />
            <div style={{ display:'flex', gap:10 }}>
              <button type="submit" disabled={saving} className="btn btn-navy" style={{ flex:1 }}>{saving ? 'Saving…' : 'Move Appointment'}</button>
              <button type="button" onClick={() => setRescheduling(null)} className="btn btn-outline">Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
