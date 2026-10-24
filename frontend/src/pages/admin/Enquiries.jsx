import React, { useEffect, useState } from 'react';
import API from '../../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import SlotPicker from '../../components/SlotPicker';
import { clinicToday, prettyDate, sendWithOverbook, errorMessage } from '../../utils/slots';
import { waLink as waTo } from '../../utils/clinic';
import useDoctors, { doctorLabel } from '../../utils/useDoctors';

export default function Enquiries() {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading]    = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [booking, setBooking] = useState(null);   // { enquiry, doctor_id, date, slot, notes, done }
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { doctors, lead, multiple } = useDoctors();
  const doctorOf = (id) => doctors.find(d => d.id === Number(id)) || lead;

  const load = () => {
    setLoading(true);
    API.get('/api/enquiries', { params: { status: statusFilter || undefined } })
      .then(r => setEnquiries(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [statusFilter]);

  const updateStatus = async (id, status) => {
    await API.put(`/api/enquiries/${id}`, { status });
    toast.success(status === 'closed' ? 'Enquiry closed — its slot is free again' : `Status updated to ${status}`);
    load();
  };

  const openBooking = (e) => setBooking({
    enquiry: e,
    doctor_id: e.doctor_id ? String(e.doctor_id) : '',
    // Requested slot if it's still bookable, otherwise let the admin pick an alternative
    date: e.preferred_date && e.preferred_date >= clinicToday() ? e.preferred_date : clinicToday(),
    slot: e.slot_conflict ? '' : (e.preferred_slot || ''),
    notes: '',
  });

  const handleBook = async (ev) => {
    ev.preventDefault(); setSaving(true);
    const { enquiry, date, slot, notes, doctor_id } = booking;
    try {
      const saved = await sendWithOverbook(
        force => API.post(`/api/enquiries/${enquiry.id}/book`,
          { date, slot, notes: notes || null, doctor_id: doctor_id ? Number(doctor_id) : null }, { params: { force } }),
        user?.role === 'admin',
      );
      if (!saved) return;
      toast.success('Appointment confirmed');
      setBooking(p => ({ ...p, done: true }));
      load();
    } catch (err) {
      toast.error(errorMessage(err, 'Booking failed'));
    } finally { setSaving(false); }
  };

  // WhatsApp confirmation, worded for whether the patient got their requested slot
  const confirmationLink = ({ enquiry: e, date, slot, doctor_id }) => {
    const moved = date !== e.preferred_date || slot !== e.preferred_slot;
    const doctor = doctorOf(doctor_id || e.doctor_id).name;
    const msg = moved
      ? `Hello ${e.name}, thank you for booking with Srini Physio Clinics. Unfortunately ${e.preferred_slot || 'your requested slot'} on ${e.preferred_date ? prettyDate(e.preferred_date) : 'your chosen date'} is no longer available, so we have reserved ${slot} on ${prettyDate(date)} for you with ${doctor}. Please reply to confirm, or let us know a time that suits you better.`
      : `Hello ${e.name}, your appointment at Srini Physio Clinics is confirmed for ${prettyDate(date)} at ${slot} with ${doctor}. Location: Masid Banda, Kondapur. Reply here if you need to reschedule.`;
    return waTo(e.phone, msg);
  };

  const replyLink = (e) => waTo(e.phone,
    `Hello ${e.name}, thank you for contacting Srini Physio Clinics! ${doctorOf(e.doctor_id).name}'s team will get back to you shortly about ${e.service_interest || 'your enquiry'}.`);

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'Manrope', fontWeight:900, fontSize:'1.8rem', color:'var(--navy)', margin:0 }}>Website Enquiries</h1>
          <p style={{ color:'var(--muted)', marginTop:4 }}>Leads from the website contact form</p>
        </div>
      </div>

      {/* Status tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {['', 'new', 'contacted', 'converted', 'closed'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} className={`btn btn-sm ${statusFilter === s ? 'btn-navy' : 'btn-outline'}`}
            style={{ textTransform:'capitalize' }}>{s || 'All'}</button>
        ))}
      </div>

      {/* Cards */}
      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>Loading…</div>
      ) : enquiries.length === 0 ? (
        <div style={{ textAlign:'center', padding:60, color:'var(--muted)', background:'var(--white)', borderRadius:16 }}>
          <div style={{ fontSize:'2.5rem', marginBottom:12 }}>📭</div>
          <div style={{ fontWeight:700 }}>No enquiries found</div>
        </div>
      ) : (
        <div style={{ display:'grid', gap:14 }}>
          {enquiries.map(e => (
            <div key={e.id} style={{ background:'var(--white)', borderRadius:16, border:'1px solid var(--line)', padding:'20px 22px', display:'grid', gridTemplateColumns:'1fr auto', gap:16, alignItems:'center' }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                  <span style={{ fontFamily:'Manrope', fontWeight:800, fontSize:'1rem', color:'var(--navy)' }}>{e.name}</span>
                  <span className={`badge badge-${e.status}`}>{e.status}</span>
                  {e.converted_patient_id && <span className="badge" style={{ background:'var(--navy-tint)', color:'var(--navy)' }}>Patient #{e.converted_patient_id}</span>}
                </div>
                <div style={{ fontSize:'.85rem', color:'var(--muted)', display:'flex', gap:18, flexWrap:'wrap' }}>
                  <span>📞 {e.phone}</span>
                  {e.service_interest && <span>🩺 {e.service_interest}</span>}
                  {e.pain_level && <span>🔥 Pain {e.pain_level}/10</span>}
                  <span>🕐 {new Date(e.created_at).toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' })}</span>
                </div>
                {e.preferred_date && e.preferred_slot && (
                  <div style={{ marginTop:8, display:'flex', alignItems:'center', gap:8, flexWrap:'wrap', fontSize:'.84rem' }}>
                    <span style={{ fontWeight:700, color:'var(--navy)' }}>📅 Requested: {prettyDate(e.preferred_date)} · {e.preferred_slot}{multiple && ` · ${doctorOf(e.doctor_id).name}`}</span>
                    {(e.status === 'new' || e.status === 'contacted') && (e.slot_conflict
                      ? <span className="badge" style={{ background:'var(--gold-tint)', color:'var(--gold-deep)' }}>⚠️ {e.slot_conflict}</span>
                      : <span className="badge" style={{ background:'var(--navy-tint)', color:'var(--navy)' }}>✓ Slot free</span>)}
                  </div>
                )}
                {e.message && <div style={{ marginTop:8, fontSize:'.85rem', color:'var(--navy)', background:'var(--paper)', borderRadius:8, padding:'8px 12px' }}>💬 {e.message}</div>}
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'flex-end' }}>
                <a href={replyLink(e)} target="_blank" rel="noopener" className="btn btn-sm btn-outline">💬 Reply on WA</a>
                {(e.status === 'new' || e.status === 'contacted') && (
                  <button onClick={() => openBooking(e)} className="btn btn-sm btn-gold" style={{ color:'var(--navy)' }}>
                    {e.slot_conflict ? '🔁 Offer Another Slot' : '📅 Book Appointment'}
                  </button>
                )}
                {e.status === 'new' && (
                  <button onClick={() => updateStatus(e.id, 'contacted')} className="btn btn-sm btn-outline">Mark Contacted</button>
                )}
                {e.status !== 'closed' && e.status !== 'converted' && (
                  <button onClick={() => updateStatus(e.id, 'closed')} className="btn btn-sm btn-danger">Close</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Book enquiry → appointment */}
      {booking && (
        <div style={{ position:'fixed', inset:0, background:'rgba(16,47,82,.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 }}
          onClick={ev => { if (ev.target === ev.currentTarget) setBooking(null); }}>
          <div style={{ background:'var(--white)', borderRadius:24, padding:32, width:'100%', maxWidth:500, boxShadow:'0 24px 64px rgba(0,0,0,.25)' }}>
            {booking.done ? (
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'2.8rem', marginBottom:10 }}>✅</div>
                <h2 style={{ fontFamily:'Manrope', fontWeight:900, fontSize:'1.25rem', color:'var(--navy)', margin:'0 0 8px' }}>Appointment Confirmed</h2>
                <p style={{ color:'var(--muted)', marginBottom:20 }}>
                  {booking.enquiry.name} · {prettyDate(booking.date)} · {booking.slot} · {doctorOf(booking.doctor_id || booking.enquiry.doctor_id).name}
                </p>
                <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
                  <a href={confirmationLink(booking)} target="_blank" rel="noopener" onClick={() => setBooking(null)} className="btn btn-wa btn-sm">
                    💬 Send WhatsApp Confirmation
                  </a>
                  <button onClick={() => setBooking(null)} className="btn btn-outline btn-sm">Close</button>
                </div>
              </div>
            ) : (
              <>
                <h2 style={{ fontFamily:'Manrope', fontWeight:900, fontSize:'1.3rem', color:'var(--navy)', marginBottom:6 }}>
                  Book Appointment
                </h2>
                <p style={{ color:'var(--muted)', fontSize:'.85rem', marginBottom:16 }}>
                  {booking.enquiry.name} · {booking.enquiry.phone}
                  {booking.enquiry.preferred_slot && <> · requested {prettyDate(booking.enquiry.preferred_date)}, {booking.enquiry.preferred_slot}</>}
                </p>
                {booking.enquiry.slot_conflict && (
                  <div style={{ marginBottom:16, padding:'10px 12px', borderRadius:8, background:'var(--gold-tint)', border:'1px solid var(--gold-light)', color:'var(--gold-deep)', fontSize:'.82rem' }}>
                    The requested slot can't be used ({booking.enquiry.slot_conflict}). Pick an alternative — the WhatsApp message will explain the change.
                  </div>
                )}
                <form onSubmit={handleBook}>
                  {multiple && (
                    <div className="field">
                      <label>Doctor</label>
                      <select value={booking.doctor_id || String(lead.id)} onChange={ev => setBooking(p => ({ ...p, doctor_id: ev.target.value }))}>
                        {doctors.map(d => <option key={d.id} value={d.id}>{doctorLabel(d)}</option>)}
                      </select>
                    </div>
                  )}
                  <SlotPicker date={booking.date} slot={booking.slot} ownEnquiryId={booking.enquiry.id} doctorId={booking.doctor_id}
                    onChange={v => setBooking(p => ({ ...p, ...v }))} />
                  <div className="field">
                    <label>Notes</label>
                    <textarea placeholder="Optional notes for the appointment" value={booking.notes} style={{ minHeight:60 }}
                      onChange={ev => setBooking(p => ({ ...p, notes: ev.target.value }))} />
                  </div>
                  <div style={{ display:'flex', gap:10 }}>
                    <button type="submit" disabled={saving} className="btn btn-navy" style={{ flex:1 }}>
                      {saving ? 'Booking…' : 'Confirm Appointment'}
                    </button>
                    <button type="button" onClick={() => setBooking(null)} className="btn btn-outline">Cancel</button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
