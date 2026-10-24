import React, { useEffect, useState } from 'react';
import API from '../../api/client';
import toast from 'react-hot-toast';
import { SOURCE_LABELS } from '../../utils/clinic';

const WA = '917702225124';
const EMPTY = { name:'', phone:'', email:'', age:'', gender:'', condition:'', notes:'', source:'walk_in' };

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true);
    API.get('/api/patients', { params: { search: search || undefined, source: sourceFilter || undefined } })
      .then(r => setPatients(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, sourceFilter]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (selected) {
        await API.put(`/api/patients/${selected.id}`, form);
        toast.success('Patient updated');
      } else {
        await API.post('/api/patients', { ...form, age: form.age ? Number(form.age) : null });
        toast.success('Patient added');
      }
      setShowModal(false);
      setForm(EMPTY);
      setSelected(null);
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error saving patient');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (p) => { setSelected(p); setForm({ ...p, age: p.age || '' }); setShowModal(true); };
  const openNew  = ()  => { setSelected(null); setForm(EMPTY); setShowModal(true); };

  const waLink = (p) => `https://wa.me/${p.phone.replace(/\D/g,'')}?text=${encodeURIComponent(`Hello ${p.name}, this is Dr Tharun from Srini Physio Clinics. Your appointment is confirmed.`)}`;

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontFamily:'Manrope', fontWeight:900, fontSize:'1.8rem', color:'var(--navy)', margin:0 }}>Patients</h1>
          <p style={{ color:'var(--muted)', marginTop:4 }}>{patients.length} patient{patients.length !== 1 ? 's' : ''} found</p>
        </div>
        <button onClick={openNew} className="btn btn-navy">➕ Add Walk-in Patient</button>
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
        <input placeholder="Search name or phone…" value={search} onChange={e => setSearch(e.target.value)}
          style={{ padding:'10px 14px', border:'1.5px solid var(--line)', borderRadius:10, fontFamily:'inherit', fontSize:'.9rem', width:260 }} />
        <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)}
          style={{ padding:'10px 14px', border:'1.5px solid var(--line)', borderRadius:10, fontFamily:'inherit', fontSize:'.9rem' }}>
          <option value="">All Sources</option>
          <option value="walk_in">Walk-in</option>
          <option value="website">Website</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background:'#fff', borderRadius:16, border:'1px solid var(--line)', overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'.87rem' }}>
          <thead>
            <tr style={{ background:'var(--paper)', borderBottom:'1px solid var(--line)' }}>
              {['#','Name','Phone','Age','Condition','Source','Registered','Actions'].map(h => (
                <th key={h} style={{ padding:'12px 16px', textAlign:'left', fontFamily:'Manrope', fontWeight:800, color:'var(--navy)', fontSize:'.78rem', textTransform:'uppercase', letterSpacing:'.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>Loading…</td></tr>
            ) : patients.length === 0 ? (
              <tr><td colSpan={8} style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>No patients found</td></tr>
            ) : patients.map((p, i) => (
              <tr key={p.id} style={{ borderBottom:'1px solid var(--line)', transition:'background .15s' }}
                onMouseEnter={e => e.currentTarget.style.background='var(--paper)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <td style={{ padding:'13px 16px', color:'var(--muted)', fontWeight:600 }}>{p.id}</td>
                <td style={{ padding:'13px 16px', fontWeight:700, color:'var(--navy)' }}>{p.name}</td>
                <td style={{ padding:'13px 16px' }}>{p.phone}</td>
                <td style={{ padding:'13px 16px' }}>{p.age || '—'}</td>
                <td style={{ padding:'13px 16px', color:'var(--muted)', maxWidth:180 }}>
                  <span style={{ display:'block', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.condition || '—'}</span>
                </td>
                <td style={{ padding:'13px 16px' }}>
                  <span className={`badge badge-${p.source}`}>{SOURCE_LABELS[p.source] || p.source}</span>
                </td>
                <td style={{ padding:'13px 16px', color:'var(--muted)' }}>{new Date(p.created_at).toLocaleDateString('en-IN')}</td>
                <td style={{ padding:'13px 16px' }}>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={() => openEdit(p)} className="btn btn-sm btn-outline" style={{ padding:'5px 10px', fontSize:'.75rem' }}>✏️ Edit</button>
                    <a href={waLink(p)} target="_blank" rel="noopener"
                      style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'5px 10px', background: 'var(--gold)', color: 'var(--navy)', borderRadius:999, fontWeight:700, fontSize:'.75rem', textDecoration:'none' }}>
                      💬 WA
                    </a>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(16,47,82,.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background:'#fff', borderRadius:24, padding:32, width:'100%', maxWidth:520, boxShadow:'0 24px 64px rgba(0,0,0,.25)', maxHeight:'90vh', overflowY:'auto' }}>
            <h2 style={{ fontFamily:'Manrope', fontWeight:900, fontSize:'1.3rem', color:'var(--navy)', marginBottom:22 }}>
              {selected ? 'Edit Patient' : 'Add Walk-in Patient'}
            </h2>
            <form onSubmit={handleSave}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
                <div className="field" style={{ gridColumn:'1/-1' }}>
                  <label>Full Name *</label>
                  <input required placeholder="Patient name" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} />
                </div>
                <div className="field">
                  <label>Phone *</label>
                  <input required placeholder="Phone number" value={form.phone} onChange={e => setForm(p=>({...p,phone:e.target.value}))} />
                </div>
                <div className="field">
                  <label>Email</label>
                  <input placeholder="Email (optional)" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} />
                </div>
                <div className="field">
                  <label>Age</label>
                  <input type="number" placeholder="Age" value={form.age} onChange={e => setForm(p=>({...p,age:e.target.value}))} />
                </div>
                <div className="field">
                  <label>Gender</label>
                  <select value={form.gender} onChange={e => setForm(p=>({...p,gender:e.target.value}))}>
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="field" style={{ gridColumn:'1/-1' }}>
                  <label>Source</label>
                  <select value={form.source} onChange={e => setForm(p=>({...p,source:e.target.value}))}>
                    <option value="walk_in">Walk-in</option>
                    <option value="website">Website</option>
                  </select>
                </div>
                <div className="field" style={{ gridColumn:'1/-1' }}>
                  <label>Chief Complaint / Condition</label>
                  <textarea placeholder="Describe the patient's condition or reason for visit" value={form.condition} onChange={e => setForm(p=>({...p,condition:e.target.value}))} />
                </div>
                <div className="field" style={{ gridColumn:'1/-1' }}>
                  <label>Internal Notes</label>
                  <textarea placeholder="Internal notes (not visible to patient)" value={form.notes} onChange={e => setForm(p=>({...p,notes:e.target.value}))} />
                </div>
              </div>
              <div style={{ display:'flex', gap:10, marginTop:6 }}>
                <button type="submit" disabled={saving} className="btn btn-navy" style={{ flex:1 }}>
                  {saving ? 'Saving…' : selected ? 'Update Patient' : 'Add Patient'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-outline">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
