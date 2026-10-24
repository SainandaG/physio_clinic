import React, { useEffect, useState } from 'react';
import API from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const EMPTY = { name:'', email:'', password:'', role:'receptionist' };

export default function Staff() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    API.get('/api/auth/users').then(r => setUsers(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await API.post('/api/auth/users', form);
      toast.success('Staff member created');
      setShowModal(false); setForm(EMPTY); load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error creating user');
    } finally { setSaving(false); }
  };

  const deleteUser = async (id) => {
    if (!confirm('Remove this staff member?')) return;
    try {
      await API.delete(`/api/auth/users/${id}`);
      toast.success('Staff member removed');
      load();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Error');
    }
  };

  if (me?.role !== 'admin') return (
    <div style={{ textAlign:'center', padding:60 }}>
      <div style={{ fontSize:'3rem', marginBottom:12 }}>🔒</div>
      <h2 style={{ fontFamily:'Manrope', color:'var(--navy)' }}>Admin Only</h2>
      <p style={{ color:'var(--muted)' }}>Only admins can manage staff.</p>
    </div>
  );

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'Manrope', fontWeight:900, fontSize:'1.8rem', color:'var(--navy)', margin:0 }}>Staff Management</h1>
          <p style={{ color:'var(--muted)', marginTop:4 }}>Admin and receptionist accounts</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-navy">➕ Add Staff Member</button>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:16 }}>
        {users.map(u => (
          <div key={u.id} style={{ background:'#fff', border:'1px solid var(--line)', borderRadius:16, padding:22 }}>
            <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
              <div style={{ width:48, height:48, borderRadius:'50%', background:'var(--navy)', color:'var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'Manrope', fontWeight:800, fontSize:'1.1rem', flexShrink:0 }}>
                {u.name[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontFamily:'Manrope', fontWeight:800, color:'var(--navy)', display:'flex', gap:8, alignItems:'center' }}>
                  {u.name} {u.id === me?.id && <span style={{ fontSize:'.7rem', background:'var(--navy-tint)', color:'var(--navy)', padding:'2px 8px', borderRadius:999, fontWeight:700 }}>You</span>}
                </div>
                <div style={{ color:'var(--muted)', fontSize:'.82rem' }}>{u.email}</div>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span className={`badge ${u.role === 'admin' ? 'badge-website' : 'badge-walkin'}`} style={{ textTransform:'capitalize' }}>
                {u.role === 'admin' ? '🔑 Admin' : '👤 Receptionist'}
              </span>
              {u.id !== me?.id && (
                <button onClick={() => deleteUser(u.id)} className="btn btn-sm btn-danger" style={{ padding:'5px 10px' }}>🗑 Remove</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(16,47,82,.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background:'#fff', borderRadius:24, padding:32, width:'100%', maxWidth:440, boxShadow:'0 24px 64px rgba(0,0,0,.25)' }}>
            <h2 style={{ fontFamily:'Manrope', fontWeight:900, fontSize:'1.3rem', color:'var(--navy)', marginBottom:22 }}>Add Staff Member</h2>
            <form onSubmit={handleSave}>
              <div className="field"><label>Full Name *</label><input required value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} placeholder="Dr Tharun" /></div>
              <div className="field"><label>Email *</label><input required type="email" value={form.email} onChange={e => setForm(p=>({...p,email:e.target.value}))} placeholder="staff@sriniphysio.com" /></div>
              <div className="field"><label>Password *</label><input required type="password" value={form.password} onChange={e => setForm(p=>({...p,password:e.target.value}))} placeholder="Min 8 characters" /></div>
              <div className="field">
                <label>Role</label>
                <select value={form.role} onChange={e => setForm(p=>({...p,role:e.target.value}))}>
                  <option value="receptionist">Receptionist</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button type="submit" disabled={saving} className="btn btn-navy" style={{ flex:1 }}>
                  {saving ? 'Creating…' : 'Create Account'}
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
