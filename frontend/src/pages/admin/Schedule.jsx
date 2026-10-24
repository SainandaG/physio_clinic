import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/client';
import toast from 'react-hot-toast';
import { clinicToday, prettyDate, errorMessage } from '../../utils/slots';
import useDoctors from '../../utils/useDoctors';

const shiftDate = (date, days) => {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().split('T')[0];
};

const STATE_STYLE = {
  free:    { label: 'Free',    bg: 'var(--white)', color: 'var(--navy)', border: '1px solid var(--navy-line)' },
  booked:  { label: 'Booked',  bg: 'var(--navy)', color: 'var(--white)' },
  held:    { label: 'Requested', bg: 'var(--gold-tint)', color: 'var(--gold-deep)' },
  blocked: { label: 'Blocked', bg: 'var(--paper)', color: 'var(--muted)' },
  closed:  { label: 'Closed',  bg: 'var(--paper)', color: 'var(--muted)' },
};

const slotState = (s) => {
  if (s.reason === 'closed') return 'closed';
  if (s.block) return 'blocked';
  if (s.appointments.length) return 'booked';
  if (s.enquiries.length) return 'held';
  return 'free';
};

export default function Schedule() {
  const [date, setDate] = useState(clinicToday());
  const [day, setDay] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [doctorId, setDoctorId] = useState('');   // '' = lead doctor
  const { doctors, lead, multiple } = useDoctors();
  const doctor = doctors.find(d => String(d.id) === String(doctorId)) || lead;
  const doctorName = (id) => doctors.find(d => d.id === id)?.name;

  const load = () => {
    API.get('/api/schedule/day', { params: { date, doctor_id: doctorId || undefined } }).then(r => setDay(r.data));
    API.get('/api/schedule/blocks').then(r => setBlocks(r.data));
  };

  useEffect(() => { load(); }, [date, doctorId]);

  // forDoctor: block only the selected doctor's time (leave); otherwise the whole clinic (holiday)
  const block = async (slot, forDoctor) => {
    const who = forDoctor ? `${doctor.name}'s ` : '';
    const label = slot ? `${who}${slot} on ${prettyDate(date)}` : forDoctor ? `${doctor.name} on leave for ${prettyDate(date)}` : `the clinic closed on ${prettyDate(date)}`;
    const reason = window.prompt(`${slot ? 'Block' : 'Mark'} ${label}?\nReason (optional — e.g. holiday, leave, training):`);
    if (reason === null) return;
    try {
      await API.post('/api/schedule/blocks', { date, slot, reason: reason || null, doctor_id: forDoctor ? day.doctor_id : null });
      toast.success(slot ? 'Slot blocked' : forDoctor ? `${doctor.name} marked on leave` : 'Clinic marked closed');
      load();
    } catch (err) { toast.error(errorMessage(err, 'Could not block')); }
  };

  const unblock = async (id) => {
    try {
      await API.delete(`/api/schedule/blocks/${id}`);
      toast.success('Reopened for booking');
      load();
    } catch (err) { toast.error(errorMessage(err, 'Could not unblock')); }
  };

  const clashes = day?.slots.filter(s => s.appointments.length + s.enquiries.length > s.capacity
    || ((s.block || s.reason === 'closed') && (s.appointments.length || s.enquiries.length))) || [];

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'Manrope', fontWeight:900, fontSize:'1.8rem', color:'var(--navy)', margin:0 }}>Schedule</h1>
          <p style={{ color:'var(--muted)', marginTop:4 }}>Slot availability, holidays and blocked times</p>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          {multiple && (
            <select value={doctorId || String(lead.id)} onChange={e => setDoctorId(e.target.value)}
              style={{ padding:'7px 10px', borderRadius:10, border:'1px solid var(--line)', fontWeight:700, color:'var(--navy)' }}>
              {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          )}
          <button onClick={() => setDate(d => shiftDate(d, -1))} className="btn btn-sm btn-outline">←</button>
          <input type="date" value={date} onChange={e => e.target.value && setDate(e.target.value)}
            style={{ padding:'7px 10px', borderRadius:10, border:'1px solid var(--line)', fontWeight:600 }} />
          <button onClick={() => setDate(d => shiftDate(d, 1))} className="btn btn-sm btn-outline">→</button>
          <button onClick={() => setDate(clinicToday())} className="btn btn-sm btn-outline">Today</button>
        </div>
      </div>

      {day?.day_block ? (
        <div style={{ background:'var(--paper)', border:'1px solid var(--line)', borderRadius:12, padding:'14px 18px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:700, color:'var(--navy)' }}>
            🚫 {day.day_block.doctor_id ? `${doctorName(day.day_block.doctor_id) || 'Doctor'} on leave` : 'Clinic closed'} on {prettyDate(date)}{day.day_block.reason && ` — ${day.day_block.reason}`}
          </span>
          <button onClick={() => unblock(day.day_block.id)} className="btn btn-sm btn-outline">Reopen Day</button>
        </div>
      ) : (
        <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginBottom:12 }}>
          {multiple && <button onClick={() => block(null, true)} className="btn btn-sm btn-outline">🌴 Mark {doctor.name} on Leave</button>}
          <button onClick={() => block(null, false)} className="btn btn-sm btn-danger">🚫 Close Clinic This Day</button>
        </div>
      )}

      {clashes.length > 0 && (
        <div style={{ background:'var(--gold-tint)', border:'1px solid var(--gold-light)', borderRadius:12, padding:'12px 16px', marginBottom:16, color:'var(--gold-deep)', fontSize:'.86rem' }}>
          ⚠️ <strong>{clashes.length} slot{clashes.length > 1 ? 's' : ''} double-booked or booked into blocked time.</strong>{' '}
          Reschedule from <Link to="../appointments" style={{ color:'var(--gold-deep)', textDecoration:'underline' }}>Appointments</Link> or
          resolve requests in <Link to="../enquiries" style={{ color:'var(--gold-deep)', textDecoration:'underline' }}>Enquiries</Link>.
        </div>
      )}

      <div style={{ background:'#fff', borderRadius:16, border:'1px solid var(--line)', overflow:'hidden', marginBottom:28 }}>
        {!day ? (
          <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>Loading…</div>
        ) : day.slots.map(s => {
          const state = slotState(s);
          const st = STATE_STYLE[state];
          const clash = clashes.includes(s);
          return (
            <div key={s.slot} style={{ display:'grid', gridTemplateColumns:'190px 110px 1fr auto', gap:14, alignItems:'center', padding:'12px 18px', borderBottom:'1px solid var(--line)', opacity: s.past ? .6 : 1, background: clash ? 'var(--gold-tint)' : 'transparent' }}>
              <span style={{ fontFamily:'Manrope', fontWeight:800, color:'var(--navy)', fontSize:'.9rem' }}>{s.slot}</span>
              <span className="badge" style={{ background:st.bg, color:st.color, border:st.border, justifySelf:'start' }}>{st.label}</span>
              <div style={{ fontSize:'.85rem', display:'flex', flexDirection:'column', gap:3 }}>
                {s.appointments.map(a => (
                  <span key={`a${a.id}`}>🧑‍⚕️ <strong>{a.patient}</strong> · {a.phone} · <span className={`badge badge-${a.status}`}>{a.status}</span></span>
                ))}
                {s.enquiries.map(e => (
                  <span key={`e${e.id}`} style={{ color:'var(--gold-deep)' }}>🌐 {e.name} · {e.phone} · website request #{e.id}</span>
                ))}
                {s.block && <span style={{ color:'var(--muted)' }}>{s.block.reason || 'Blocked'}</span>}
                {clash && <span style={{ color:'var(--gold-deep)', fontWeight:700 }}>⚠️ Conflict — more bookings than the slot allows</span>}
              </div>
              <div>
                {s.block ? (
                  <button onClick={() => unblock(s.block.id)} className="btn btn-sm btn-outline" style={{ padding:'4px 10px', fontSize:'.75rem' }}>Unblock</button>
                ) : state !== 'closed' && !s.past && (
                  <button onClick={() => block(s.slot, multiple)} className="btn btn-sm" style={{ background:'var(--paper)', color:'var(--muted)', padding:'4px 10px', fontSize:'.75rem' }}>Block</button>
                )}
              </div>
            </div>
          );
        })}
        {day?.off_slot_appointments.length > 0 && (
          <div style={{ padding:'12px 18px', fontSize:'.83rem', color:'var(--muted)' }}>
            Outside standard slots: {day.off_slot_appointments.map(a => `${a.patient} (${a.hour}:00)`).join(', ')}
          </div>
        )}
      </div>

      <h3 style={{ fontFamily:'Manrope', fontWeight:800, fontSize:'1rem', color:'var(--navy)', margin:'0 0 12px' }}>Upcoming Closures & Blocked Slots</h3>
      {blocks.length === 0 ? (
        <p style={{ color:'var(--muted)', fontSize:'.88rem' }}>Nothing blocked. All upcoming slots are open for booking.</p>
      ) : (
        <div style={{ display:'grid', gap:8 }}>
          {blocks.map(b => (
            <div key={b.id} style={{ background:'#fff', border:'1px solid var(--line)', borderRadius:12, padding:'10px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'.87rem' }}>
              <span>
                <button onClick={() => setDate(b.date)} style={{ background:'none', border:'none', padding:0, cursor:'pointer', fontWeight:700, color:'var(--navy)' }}>{prettyDate(b.date)}</button>
                {' · '}{b.slot || 'Whole day'}
                {multiple && <span style={{ color:'var(--navy)' }}> · {b.doctor_id ? doctorName(b.doctor_id) || 'Doctor' : 'Whole clinic'}</span>}
                {b.reason && <span style={{ color:'var(--muted)' }}> — {b.reason}</span>}
              </span>
              <button onClick={() => unblock(b.id)} className="btn btn-sm btn-outline" style={{ padding:'4px 10px', fontSize:'.75rem' }}>Remove</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
