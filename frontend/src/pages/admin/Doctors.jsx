import React, { useEffect, useState } from 'react';
import API from '../../api/client';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import { errorMessage } from '../../utils/slots';

const EMPTY = { name:'', qualification:'', specialization:'', bio:'', available_days:'', timings:'', is_active:true };

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState(null);   // null = closed; { id?, ...fields }
  const [saving, setSaving]   = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const load = () => {
    setLoading(true);
    API.get('/api/doctors/all').then(r => setDoctors(r.data)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    const { id, ...fields } = form;
    try {
      if (id) await API.put(`/api/doctors/${id}`, fields);
      else await API.post('/api/doctors', fields);
      toast.success(id ? 'Doctor updated' : 'Doctor added — now bookable on the website');
      setForm(null); load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save doctor'));
    } finally { setSaving(false); }
  };

  const toggleActive = async (d) => {
    try {
      await API.put(`/api/doctors/${d.id}`, { is_active: !d.is_active });
      toast.success(d.is_active ? 'Hidden from website & booking' : 'Accepting bookings again');
      load();
    } catch (err) { toast.error(errorMessage(err, 'Update failed')); }
  };

  const remove = async (d) => {
    if (!window.confirm(`Remove ${d.name}?`)) return;
    try {
      const { data } = await API.delete(`/api/doctors/${d.id}`);
      toast.success(data.message);
      load();
    } catch (err) { toast.error(errorMessage(err, 'Could not remove doctor')); }
  };

  const field = (key, label, props = {}) => (
    <div className="field">
      <label>{label}</label>
      <input value={form[key] || ''} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} {...props} />
    </div>
  );

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'Manrope', fontWeight:900, fontSize:'1.8rem', color:'var(--navy)', margin:0 }}>Doctors</h1>
          <p style={{ color:'var(--muted)', marginTop:4 }}>
            Shown on the website and used for booking. Each doctor has their own time slots.
          </p>
        </div>
        {isAdmin && <button onClick={() => setForm(EMPTY)} className="btn btn-navy">➕ Add Doctor</button>}
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>Loading…</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 }}>
          {doctors.map((d, i) => (
            <div key={d.id} style={{ background:'var(--white)', border:`1px solid ${d.is_active ? 'var(--line)' : 'var(--gold-light)'}`, borderRadius:16, padding:22, opacity: d.is_active ? 1 : .7 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
                <div style={{ width:48, height:48, borderRadius:'50%', background:'var(--navy)', color:'var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Manrope', fontWeight:900, fontSize:'1.1rem', flexShrink:0 }}>
                  {d.name.replace(/^Dr\.?\s*/i, '')[0]?.toUpperCase()}
                </div>
                <div style={{ minWidth:0 }}>
                  <div style={{ fontFamily:'Manrope', fontWeight:800, color:'var(--navy)', fontSize:'1.02rem' }}>{d.name}</div>
                  {d.qualification && <div style={{ color:'var(--muted)', fontSize:'.83rem' }}>{d.qualification}</div>}
                </div>
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:12 }}>
                {i === 0 && d.is_active && <span className="badge badge-converted">Lead doctor</span>}
                <span className={`badge ${d.is_active ? 'badge-confirmed' : 'badge-closed'}`}>{d.is_active ? 'Accepting bookings' : 'Inactive'}</span>
              </div>
              {d.specialization && <div style={{ fontSize:'.86rem', color:'var(--navy)', marginBottom:6 }}>🩺 {d.specialization}</div>}
              {(d.available_days || d.timings) && (
                <div style={{ fontSize:'.84rem', color:'var(--muted)', marginBottom:6 }}>🕐 {[d.available_days, d.timings].filter(Boolean).join(' · ')}</div>
              )}
              {d.bio && <p style={{ fontSize:'.84rem', color:'var(--muted)', lineHeight:1.6 }}>{d.bio}</p>}
              {isAdmin && (
                <div style={{ display:'flex', gap:6, marginTop:14, flexWrap:'wrap' }}>
                  <button onClick={() => setForm({ ...EMPTY, ...d })} className="btn btn-act act-soft">✏️ Edit</button>
                  <button onClick={() => toggleActive(d)} className="btn btn-act act-soft-gold">{d.is_active ? 'Deactivate' : 'Activate'}</button>
                  <button onClick={() => remove(d)} className="btn btn-act act-cancel">Remove</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!isAdmin && <p style={{ color:'var(--muted)', fontSize:'.85rem', marginTop:18 }}>Only admins can add or edit doctors.</p>}

      {form && (
        <div style={{ position:'fixed', inset:0, background:'rgba(16,47,82,.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 }}
          onClick={e => { if (e.target === e.currentTarget) setForm(null); }}>
          <div style={{ background:'var(--white)', borderRadius:24, padding:32, width:'100%', maxWidth:520, maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(9,30,54,.3)' }}>
            <h2 style={{ fontFamily:'Manrope', fontWeight:900, fontSize:'1.3rem', color:'var(--navy)', marginBottom:20 }}>{form.id ? 'Edit Doctor' : 'Add Doctor'}</h2>
            <form onSubmit={handleSave}>
              {field('name', 'Full name *', { required: true, placeholder: 'e.g. Dr Tharun' })}
              {field('qualification', 'Qualification', { placeholder: 'e.g. MPT (Sports & Manual Therapy)' })}
              {field('specialization', 'Specialisation', { placeholder: 'e.g. Sports injuries & rehabilitation' })}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                {field('available_days', 'Available days', { placeholder: 'e.g. Monday – Saturday' })}
                {field('timings', 'Timings', { placeholder: 'e.g. 9:00 AM – 7:00 PM' })}
              </div>
              <div className="field">
                <label>Short bio (shown on website)</label>
                <textarea value={form.bio || ''} style={{ minHeight:70 }} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
              </div>
              <p style={{ fontSize:'.78rem', color:'var(--muted)', marginBottom:16 }}>
                Only publish qualifications and details the doctor has confirmed.
              </p>
              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" disabled={saving} className="btn btn-navy" style={{ flex:1 }}>{saving ? 'Saving…' : 'Save'}</button>
                <button type="button" onClick={() => setForm(null)} className="btn btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
