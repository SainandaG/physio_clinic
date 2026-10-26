import React, { useEffect, useState } from 'react';
import API from '../../api/client';
import toast from 'react-hot-toast';
import SeoFields from '../../components/SeoFields';
import { errorMessage } from '../../utils/slots';

const EMPTY = {
  name:'', description:'', icon:'', image_url:'', whatsapp_message:'', is_active:true, display_order:0,
  slug:'', about:'', helps_with:[], expect:[], note:'', seo_title:'', seo_description:'',
};
const lines = (text) => text.split('\n');
const slugify = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export default function Services() {
  const [services, setServices] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving]     = useState(false);
  const [suffix, setSuffix]     = useState('');

  const load = () => {
    setLoading(true);
    API.get('/api/services/all').then(r => setServices(r.data)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    API.get('/api/content').then(r => setSuffix(r.data.seo.title_suffix)).catch(() => {});
  }, []);

  // Nulls from the API become empty strings so every input stays controlled
  const openEdit = (s) => {
    setSelected(s);
    setForm({ ...EMPTY, ...Object.fromEntries(Object.entries(s).filter(([, v]) => v !== null)) });
    setShowModal(true);
  };
  const openNew  = ()  => { setSelected(null); setForm(EMPTY); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true);
    const body = {
      ...form,
      helps_with: form.helps_with.map(x => x.trim()).filter(Boolean),
      expect: form.expect.map(x => x.trim()).filter(Boolean),
    };
    try {
      if (selected) {
        await API.put(`/api/services/${selected.id}`, body);
        toast.success('Service updated');
      } else {
        await API.post('/api/services', body);
        toast.success('Service created');
      }
      setShowModal(false); load();
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save'));
    } finally { setSaving(false); }
  };

  const toggleActive = async (s) => {
    await API.put(`/api/services/${s.id}`, { is_active: !s.is_active });
    toast.success(s.is_active ? 'Service hidden from website' : 'Service shown on website');
    load();
  };

  const deleteService = async (id) => {
    if (!confirm('Delete this service?')) return;
    await API.delete(`/api/services/${id}`);
    toast.success('Service deleted');
    load();
  };

  const ICONS = ['⚡','🏋️','👐','🎯','⭕','〰️','🩹','💊','🧘','🏃','🦵','💪'];

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
        <div>
          <h1 style={{ fontFamily:'Manrope', fontWeight:900, fontSize:'1.8rem', color:'var(--navy)', margin:0 }}>Services</h1>
          <p style={{ color:'var(--muted)', marginTop:4 }}>Manage services shown on the website</p>
        </div>
        <button onClick={openNew} className="btn btn-navy">➕ Add Service</button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'var(--muted)' }}>Loading…</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 }}>
          {services.map(s => (
            <div key={s.id} style={{
              background:'#fff', border:`1px solid ${s.is_active ? 'var(--line)' : 'var(--gold-light)'}`,
              borderRadius:16, padding:22, opacity: s.is_active ? 1 : .7,
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <span style={{ fontSize:'2rem' }}>{s.icon}</span>
                <span className={`badge ${s.is_active ? 'badge-completed' : 'badge-cancelled'}`}>{s.is_active ? 'Active' : 'Hidden'}</span>
              </div>
              <h3 style={{ fontFamily:'Manrope', fontWeight:800, fontSize:'1.05rem', color:'var(--navy)', margin:'0 0 8px' }}>{s.name}</h3>
              <p style={{ color:'var(--muted)', fontSize:'.84rem', lineHeight:1.6, margin:'0 0 18px' }}>{s.description}</p>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <button onClick={() => openEdit(s)} className="btn btn-sm btn-outline">✏️ Edit</button>
                {s.is_active && s.slug && <a href={`/treatments/${s.slug}`} target="_blank" rel="noopener" className="btn btn-sm btn-outline">↗ View</a>}
                <button onClick={() => toggleActive(s)} className="btn btn-sm" style={{ background: s.is_active ? 'var(--gold-tint)' : 'var(--navy-tint)', color: s.is_active ? 'var(--gold-deep)' : 'var(--navy)' }}>
                  {s.is_active ? '🙈 Hide' : '👁 Show'}
                </button>
                <button onClick={() => deleteService(s.id)} className="btn btn-sm btn-danger">🗑</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(16,47,82,.6)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:200, padding:20 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background:'#fff', borderRadius:24, padding:32, width:'100%', maxWidth:680, boxShadow:'0 24px 64px rgba(0,0,0,.25)', maxHeight:'90vh', overflowY:'auto' }}>
            <h2 style={{ fontFamily:'Manrope', fontWeight:900, fontSize:'1.3rem', color:'var(--navy)', marginBottom:22 }}>
              {selected ? 'Edit Service' : 'Add Service'}
            </h2>
            <form onSubmit={handleSave}>
              <div className="field">
                <label>Service Name *</label>
                <input required placeholder="e.g. Dry Needling" value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} />
              </div>
              <div className="field">
                <label>Icon (emoji)</label>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
                  {ICONS.map(ic => (
                    <button key={ic} type="button" onClick={() => setForm(p=>({...p,icon:ic}))}
                      style={{ fontSize:'1.4rem', padding:'6px 10px', borderRadius:8, border:`2px solid ${form.icon===ic?'var(--gold)':'var(--line)'}`, background: form.icon===ic?'var(--gold-tint)':'#fff', cursor:'pointer' }}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Summary</label>
                <textarea value={form.description} onChange={e => setForm(p=>({...p,description:e.target.value}))} placeholder="One sentence shown on the treatment card and under the page title" />
              </div>
              <div className="field">
                <label>Page address</label>
                <div className="post-slug" style={{ margin: 0 }}>
                  <span>/treatments/</span>
                  <input value={form.slug} placeholder={slugify(form.name || 'treatment-name')} onChange={e => setForm(p=>({...p,slug:slugify(e.target.value)}))} />
                </div>
                {selected && form.slug !== selected.slug && <span style={{ fontSize:'.76rem', color:'var(--gold-deep)' }}>Changing the address breaks links people have already shared.</span>}
              </div>

              <div className="cms-group">Treatment page</div>
              <div className="field">
                <label>What it is</label>
                <textarea value={form.about} onChange={e => setForm(p=>({...p,about:e.target.value}))} placeholder="A short explanation in plain language" style={{ minHeight:110 }} />
              </div>
              <div className="field">
                <label>Commonly used for <span style={{ fontWeight:500, textTransform:'none', letterSpacing:0, color:'var(--muted)' }}>— one per line</span></label>
                <textarea value={form.helps_with.join('\n')} onChange={e => setForm(p=>({...p,helps_with:lines(e.target.value)}))} />
              </div>
              <div className="field">
                <label>What to expect <span style={{ fontWeight:500, textTransform:'none', letterSpacing:0, color:'var(--muted)' }}>— one step per line</span></label>
                <textarea value={form.expect.join('\n')} onChange={e => setForm(p=>({...p,expect:lines(e.target.value)}))} />
              </div>
              <div className="field">
                <label>“Is it right for me?” note</label>
                <textarea value={form.note} onChange={e => setForm(p=>({...p,note:e.target.value}))} placeholder="Who it isn't suitable for, or what to tell us first" style={{ minHeight:70 }} />
              </div>
              <div className="field">
                <label>Photo (optional)</label>
                <input placeholder="e.g. /photos/dry-needling.jpg or https://…" value={form.image_url || ''}
                  onChange={e => setForm(p=>({...p,image_url:e.target.value}))} />
                <span style={{ fontSize:'.76rem', color:'var(--muted)' }}>
                  Leave empty to use the built-in illustration. Use only real photos taken at the clinic, with patient consent.
                </span>
              </div>
              <div className="field">
                <label>WhatsApp Enquiry Message</label>
                <textarea value={form.whatsapp_message} onChange={e => setForm(p=>({...p,whatsapp_message:e.target.value}))}
                  placeholder="Pre-filled WhatsApp message when patient clicks enquire" style={{ minHeight:70 }} />
              </div>
              <SeoFields title={form.seo_title} description={form.seo_description}
                onChange={patch => setForm(p => ({ ...p, ...patch }))}
                fallbackTitle={form.name || 'Treatment'} fallbackDescription={form.description || 'The summary above is used.'}
                suffix={suffix} path={`/treatments/${form.slug || slugify(form.name || 'treatment-name')}`} />
              <div style={{ display:'flex', gap:12, alignItems:'center', margin:'16px 0' }}>
                <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontWeight:700, fontSize:'.85rem' }}>
                  <input type="checkbox" checked={form.is_active} onChange={e => setForm(p=>({...p,is_active:e.target.checked}))} style={{ width:16, height:16 }} />
                  Visible on website
                </label>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" disabled={saving} className="btn btn-navy" style={{ flex:1 }}>
                  {saving ? 'Saving…' : selected ? 'Update Service' : 'Add Service'}
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
