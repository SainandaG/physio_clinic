import React, { useState, useEffect } from 'react';
import API from '../api/client';
import toast from 'react-hot-toast';
import { TIME_SLOTS, clinicToday, prettyDate, isSlotConflict } from '../utils/slots';
import useDoctors, { doctorLabel } from '../utils/useDoctors';
import { useAuth } from '../context/AuthContext';

const WA = '917702225124';

const UNAVAILABLE_LABEL = { booked: 'Booked', blocked: 'Unavailable', closed: 'Clinic closed', past: 'Passed' };

const PAIN_LABELS = {
  1: 'No pain / just checking',
  2: 'Very mild discomfort',
  3: 'Mild pain',
  4: 'Mild–Moderate pain',
  5: 'Moderate pain',
  6: 'Moderate pain / stiffness',
  7: 'Moderately severe pain',
  8: 'Severe pain',
  9: 'Very severe pain',
  10: 'Unbearable / worst pain',
};

const EMPTY = {
  name: '', phone: '', email: '', age: '', gender: '',
  service_interest: '', pain_level: 5, message: '',
  preferred_date: clinicToday(),
  preferred_slot: '11:00 AM (Morning)',
  doctor_id: '',   // '' = the clinic's lead doctor
};

export default function BookingModal({ isOpen, onClose, preSelectedService = '', preSelectedDoctor = '' }) {
  const [form, setForm] = useState({ ...EMPTY, service_interest: preSelectedService });
  const [services, setServices] = useState([]);
  const [step, setStep] = useState(1); // 1 = form, 2 = success
  const [saving, setSaving] = useState(false);
  const [availability, setAvailability] = useState(null); // null = unknown (server unreachable) → allow any slot
  const [slotError, setSlotError] = useState(null);       // { message, alternatives } after a rejected booking
  const { doctors, lead, multiple } = useDoctors();
  const { user } = useAuth();
  const doctor = doctors.find(d => String(d.id) === String(form.doctor_id)) || lead;

  const loadAvailability = (date, doctorId = form.doctor_id) => {
    API.get('/api/schedule/availability', { params: { date, doctor_id: doctorId || undefined } })
      .then(({ data }) => {
        // After hours: skip straight to the next day that has free slots
        const dayOver = date === clinicToday() && data.slots.every(s => s.reason === 'past');
        if (dayOver && data.alternatives?.length) {
          const next = data.alternatives[0];
          setForm(p => (p.preferred_date === date ? { ...p, preferred_date: next.date, preferred_slot: next.slot } : p));
          return;
        }
        setAvailability(data);
        // Move off a slot that is no longer free
        setForm(p => {
          if (p.preferred_date !== date) return p;
          const current = data.slots.find(s => s.slot === p.preferred_slot);
          if (current?.available) return p;
          const firstFree = data.slots.find(s => s.available);
          return firstFree ? { ...p, preferred_slot: firstFree.slot } : p;
        });
      })
      .catch(() => setAvailability(null));
  };

  useEffect(() => {
    if (isOpen && form.preferred_date) loadAvailability(form.preferred_date, form.doctor_id);
  }, [isOpen, form.preferred_date, form.doctor_id]);

  const slotInfo = (slot) => availability?.slots.find(s => s.slot === slot);
  const noSlotsLeft = availability && !availability.slots.some(s => s.available);
  const pickAlternative = (alt) => {
    setSlotError(null);
    setForm(p => ({ ...p, preferred_date: alt.date, preferred_slot: alt.slot }));
  };

  useEffect(() => {
    if (isOpen) {
      // Signed-in patients don't retype their details
      const me = user?.role === 'patient' ? { name: user.name, phone: user.phone || '', email: user.email } : {};
      setForm({ ...EMPTY, ...me, preferred_date: clinicToday(), service_interest: preSelectedService, doctor_id: preSelectedDoctor });
      setStep(1);
      setSlotError(null);
      API.get('/api/services').then(r => setServices(r.data)).catch(() => {});
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen, preSelectedService, preSelectedDoctor, user]);

  // Keyboard close
  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [onClose]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      age: form.age ? Number(form.age) : null,
      pain_level: Number(form.pain_level),
      doctor_id: form.doctor_id ? Number(form.doctor_id) : null,
    };
    try {
      await API.post('/api/enquiries', payload);
      window.dispatchEvent(new Event('booking:submitted'));
    } catch (err) {
      if (isSlotConflict(err)) {
        // Someone else got this slot first — don't send a WhatsApp for a slot we can't honour
        setSlotError(err.response.data.detail);
        toast.error(err.response.data.detail.message);
        loadAvailability(form.preferred_date);
        setSaving(false);
        return;
      }
      // Any other failure: still proceed to WhatsApp even if server save fails
    }
    // Build WhatsApp message
    const waMsg = [
      `Hello! I would like to book a physiotherapy consultation at Srini Physio Clinics.`,
      ``,
      `*Patient Details:*`,
      `Name: ${form.name}`,
      `Phone: ${form.phone}`,
      form.age ? `Age: ${form.age}` : '',
      form.gender ? `Gender: ${form.gender}` : '',
      ``,
      `*Consultation Details:*`,
      `Service: ${form.service_interest || 'General Consultation'}`,
      `Pain Level: ${form.pain_level}/10 — ${PAIN_LABELS[form.pain_level]}`,
      form.message ? `Symptoms: ${form.message}` : '',
      ``,
      `*Preferred Appointment:*`,
      `Date: ${form.preferred_date}`,
      `Slot: ${form.preferred_slot}`,
      `Specialist: ${doctorLabel(doctor)}`,
    ].filter(Boolean).join('\n');

    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(waMsg)}`, '_blank', 'noopener,noreferrer');
    setStep(2);
    setSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(10,20,35,.75)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px', overflowY: 'auto',
      }}
    >
      <div style={{
        background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560,
        boxShadow: '0 32px 80px rgba(0,0,0,.35)',
        maxHeight: '94vh', overflowY: 'auto',
        animation: 'fadeUp .3s ease',
      }}>
        {/* Header */}
        <div style={{
          background: 'var(--navy)', color: '#fff', padding: '18px 24px',
          borderRadius: '20px 20px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 10,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.3rem' }}>📅</span>
            <div>
              <div style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: '1.05rem' }}>
                Book Physical Therapy Consultation
              </div>
              <div style={{ fontSize: '.7rem', color: 'rgba(255,255,255,.6)', marginTop: 2 }}>
                Srini Physio Clinics · Kondapur, Hyderabad
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,.15)', border: 'none', color: '#fff',
            borderRadius: '50%', width: 32, height: 32, fontSize: '1.1rem',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background .2s',
          }}
          onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,.25)'}
          onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,.15)'}
          >✕</button>
        </div>

        {step === 2 ? (
          /* ── Success State ── */
          <div style={{ padding: '48px 32px', textAlign: 'center' }}>
            <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>✅</div>
            <h3 style={{ fontFamily: 'Manrope', fontWeight: 900, color: 'var(--navy)', fontSize: '1.4rem', margin: '0 0 10px' }}>
              Appointment Request Sent!
            </h3>
            <p style={{ color: 'var(--muted)', lineHeight: 1.7, maxWidth: 380, margin: '0 auto 24px' }}>
              WhatsApp has opened with your details filled in. Tap <strong>Send</strong> and we'll confirm your
              appointment with {doctor.name} shortly.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setStep(1)} className="btn btn-outline btn-sm">Book Another</button>
              <button onClick={onClose} className="btn btn-navy btn-sm">Close</button>
            </div>
          </div>
        ) : (
          /* ── Form ── */
          <form onSubmit={handleSubmit} style={{ padding: '0 0 24px' }}>
            <div style={{ padding: '20px 20px 0' }}>
              {/* Row 1: Name + Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field">
                  <label>FULL NAME *</label>
                  <input required placeholder="e.g. Ramesh Kumar" value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div className="field">
                  <label>PHONE (WHATSAPP ACTIVE) *</label>
                  <input required placeholder="+91 98450 12345" value={form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                </div>
              </div>

              {/* Row 2: Age + Gender + Email */}
              <div className="stack-mobile" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.4fr', gap: 12 }}>
                <div className="field">
                  <label>AGE</label>
                  <input type="number" min="1" max="120" placeholder="32" value={form.age}
                    onChange={e => setForm(p => ({ ...p, age: e.target.value }))} />
                </div>
                <div className="field">
                  <label>GENDER</label>
                  <select value={form.gender} onChange={e => setForm(p => ({ ...p, gender: e.target.value }))}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="field">
                  <label>EMAIL (OPTIONAL)</label>
                  <input type="email" placeholder="you@domain.com" value={form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                </div>
              </div>

              {/* Service */}
              <div className="field">
                <label>REQUESTED CLINICAL SERVICE</label>
                <select required value={form.service_interest}
                  onChange={e => setForm(p => ({ ...p, service_interest: e.target.value }))}>
                  <option value="">Choose a service</option>
                  {services.map(s => (
                    <option key={s.id} value={s.name}>{s.icon} {s.name}</option>
                  ))}
                  <option value="General Physiotherapy">General Physiotherapy</option>
                  <option value="Not sure — need guidance">Not sure — need guidance</option>
                </select>
              </div>

              {/* Pain Level Slider */}
              <div className="field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <label style={{ margin: 0 }}>CURRENT PAIN LEVEL</label>
                  <span style={{ fontFamily: 'Manrope', fontWeight: 800, fontSize: '.95rem' }}>
                    <span style={{ color: form.pain_level >= 7 ? 'var(--gold-deep)' : form.pain_level >= 4 ? '#c9a451' : 'var(--navy)' }}>
                      {form.pain_level}
                    </span>
                    <span style={{ color: 'var(--navy)' }}> / 10</span>
                    <span style={{ fontSize: '.78rem', fontWeight: 400, color: 'var(--muted)', marginLeft: 10 }}>
                      {PAIN_LABELS[form.pain_level]}
                    </span>
                  </span>
                </div>
                <input type="range" min="1" max="10" value={form.pain_level}
                  onChange={e => setForm(p => ({ ...p, pain_level: Number(e.target.value) }))}
                  style={{
                    width: '100%', height: 6, borderRadius: 999, outline: 'none',
                    cursor: 'pointer', accentColor: 'var(--gold)',
                  }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.72rem', color: 'var(--muted)', marginTop: 5 }}>
                  <span>1 – Minimal</span><span>5 – Moderate</span><span>10 – Severe</span>
                </div>
              </div>

              {/* Symptoms */}
              <div className="field">
                <label>SYMPTOMS OR PRIOR DIAGNOSIS</label>
                <textarea
                  placeholder="e.g. Sharp pain when bending forward, MRI diagnosed L5 disc bulge 2 weeks ago..."
                  value={form.message} style={{ minHeight: 88 }}
                  onChange={e => setForm(p => ({ ...p, message: e.target.value }))} />
              </div>

              {/* Specialist — a choice only once the clinic has more than one doctor */}
              <div className="field">
                <label>CONSULTING SPECIALIST</label>
                {multiple ? (
                  <select value={form.doctor_id || String(lead.id)}
                    onChange={e => { setSlotError(null); setForm(p => ({ ...p, doctor_id: e.target.value })); }}>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>{doctorLabel(d)}{d.specialization ? ` — ${d.specialization}` : ''}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', border: '1.5px solid var(--line)', borderRadius: 12, background: 'var(--paper)' }}>
                    <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--navy)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, flexShrink: 0 }}>
                      {lead.name.replace(/^Dr\.?\s*/i, '')[0]}
                    </span>
                    <div>
                      <div style={{ fontWeight: 800, color: 'var(--navy)', fontSize: '.92rem' }}>{lead.name}</div>
                      {lead.qualification && <div style={{ color: 'var(--muted)', fontSize: '.8rem' }}>{lead.qualification}</div>}
                    </div>
                  </div>
                )}
              </div>

              {/* Date + Slot */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="field">
                  <label>PREFERRED DATE</label>
                  <input type="date" required value={form.preferred_date} min={clinicToday()}
                    onChange={e => { setSlotError(null); setForm(p => ({ ...p, preferred_date: e.target.value })); }} />
                </div>
                <div className="field">
                  <label>PREFERRED SLOT</label>
                  <select value={form.preferred_slot} disabled={noSlotsLeft}
                    onChange={e => { setSlotError(null); setForm(p => ({ ...p, preferred_slot: e.target.value })); }}>
                    {TIME_SLOTS.map(s => {
                      const info = slotInfo(s);
                      const taken = info && !info.available;
                      return (
                        <option key={s} value={s} disabled={taken}>
                          {taken ? `${s} — ${UNAVAILABLE_LABEL[info.reason] || 'Unavailable'}` : s}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Slot taken / day full: offer the next free slots */}
              {(slotError || noSlotsLeft) && (() => {
                const message = slotError?.message
                  || (availability.slots.every(s => s.reason === 'past') ? 'No more slots left today.' : availability.message);
                const alternatives = slotError?.alternatives || availability.alternatives || [];
                return (
                  <div style={{
                    margin: '-4px 0 16px', padding: '12px 14px', borderRadius: 10,
                    background: 'var(--gold-tint)', border: '1px solid var(--gold-light)', fontSize: '.84rem', color: 'var(--gold-deep)',
                  }}>
                    <div style={{ fontWeight: 700, marginBottom: alternatives.length ? 8 : 0 }}>⚠️ {message}</div>
                    {alternatives.length > 0 && (
                      <>
                        <div style={{ color: 'var(--muted)', marginBottom: 6 }}>Next available:</div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {alternatives.map(alt => (
                            <button type="button" key={alt.date + alt.slot} onClick={() => pickAlternative(alt)}
                              className="btn btn-sm btn-outline" style={{ padding: '5px 10px', fontSize: '.76rem' }}>
                              {prettyDate(alt.date)} · {alt.slot.replace(/ \(.*\)/, '')}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}

              {/* Submit */}
              <button type="submit" disabled={saving || noSlotsLeft} style={{
                width: '100%', background: 'var(--gold)', color: 'var(--navy)',
                border: 'none', borderRadius: 12, padding: '16px',
                fontFamily: 'Manrope', fontWeight: 800, fontSize: '1rem',
                cursor: saving ? 'wait' : noSlotsLeft ? 'not-allowed' : 'pointer', marginTop: 4,
                opacity: noSlotsLeft ? .55 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'all .2s ease',
              }}
              onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--gold-dark)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--gold)'; }}
              >
                <span>📅</span>
                {saving ? 'Registering...' : 'Confirm Appointment Registration'}
              </button>

              <p style={{ fontSize: '.73rem', color: 'var(--muted)', textAlign: 'center', marginTop: 10, lineHeight: 1.6 }}>
                This opens WhatsApp with your details pre-filled. Your details are used only by the clinic to arrange your care.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
