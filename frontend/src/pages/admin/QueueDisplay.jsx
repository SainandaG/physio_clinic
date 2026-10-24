import React, { useEffect, useState } from 'react';
import API from '../../api/client';

// Fullscreen waiting-room screen for a TV in the lobby. Shows tokens and first names only.
export default function QueueDisplay() {
  const [queue, setQueue] = useState({ in_therapy: [], waiting: [] });
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const load = () => API.get('/api/appointments/queue').then(r => setQueue(r.data)).catch(() => {});
    load();
    const poll = setInterval(load, 15000);
    const clock = setInterval(() => setNow(new Date()), 1000);
    return () => { clearInterval(poll); clearInterval(clock); };
  }, []);

  // Name the doctor only when patients are queued for more than one
  const showDoctor = new Set([...queue.in_therapy, ...queue.waiting].map(p => p.doctor)).size > 1;

  const panel = { background:'rgba(255,255,255,.05)', border:'1px solid rgba(201,164,81,.25)', borderRadius:24, padding:'28px 32px' };
  const heading = { fontFamily:'Manrope', fontWeight:800, fontSize:'1rem', letterSpacing:'.18em', textTransform:'uppercase', color:'var(--gold)', marginBottom:22 };

  return (
    <div style={{ minHeight:'100vh', background:'var(--navy-dark)', color:'var(--white)', padding:'36px 48px', display:'flex', flexDirection:'column', gap:32 }}>
      <header style={{ display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid rgba(255,255,255,.1)', paddingBottom:22 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <img src="/brand/logo-mark-light.png" alt="" style={{ width:84, objectFit:'contain' }} />
          <div>
            <div style={{ fontFamily:'Manrope', fontWeight:900, fontSize:'1.8rem' }}>SRINI <span style={{ color:'var(--gold)' }}>PHYSIO CLINICS</span></div>
            <div style={{ color:'rgba(255,255,255,.6)', fontSize:'.9rem' }}>Patient token display</div>
          </div>
        </div>
        <div style={{ textAlign:'right' }}>
          <div style={{ fontFamily:'Manrope', fontWeight:800, fontSize:'2.2rem', color:'var(--gold)' }}>
            {now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', timeZone:'Asia/Kolkata' })}
          </div>
          <div style={{ color:'rgba(255,255,255,.6)' }}>{now.toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', timeZone:'Asia/Kolkata' })}</div>
        </div>
      </header>

      <div style={{ display:'grid', gridTemplateColumns:'1.2fr 1fr', gap:28, flex:1 }}>
        <section style={panel}>
          <div style={heading}>Now in therapy</div>
          {queue.in_therapy.length === 0 ? (
            <div style={{ color:'rgba(255,255,255,.45)', fontSize:'1.2rem' }}>—</div>
          ) : queue.in_therapy.map(p => (
            <div key={p.token} style={{ display:'flex', alignItems:'center', gap:24, background:'var(--gold)', color:'var(--navy)', borderRadius:18, padding:'20px 26px', marginBottom:14 }}>
              <span style={{ fontFamily:'monospace', fontWeight:900, fontSize:'3rem' }}>{p.token}</span>
              <span style={{ fontFamily:'Manrope', fontWeight:800, fontSize:'1.8rem' }}>{p.name}</span>
              {showDoctor && p.doctor && <span style={{ marginLeft:'auto', fontWeight:700, fontSize:'1.1rem' }}>{p.doctor}</span>}
            </div>
          ))}
        </section>

        <section style={panel}>
          <div style={heading}>Waiting · next up</div>
          {queue.waiting.length === 0 ? (
            <div style={{ color:'rgba(255,255,255,.45)', fontSize:'1.2rem' }}>No one waiting</div>
          ) : queue.waiting.map((p, i) => (
            <div key={p.token} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 18px', borderRadius:14, marginBottom:10,
              background: i === 0 ? 'rgba(201,164,81,.18)' : 'rgba(255,255,255,.04)', border: i === 0 ? '1px solid var(--gold)' : '1px solid transparent' }}>
              <span style={{ display:'flex', alignItems:'center', gap:18 }}>
                <span style={{ fontFamily:'monospace', fontWeight:900, fontSize:'1.7rem', color: i === 0 ? 'var(--gold)' : 'var(--white)' }}>{p.token}</span>
                <span style={{ fontSize:'1.25rem', fontWeight:600 }}>{p.name}</span>
                {showDoctor && p.doctor && <span style={{ color:'rgba(255,255,255,.6)', fontSize:'.95rem' }}>· {p.doctor}</span>}
              </span>
              {i === 0 && <span style={{ color:'var(--gold)', fontWeight:800, letterSpacing:'.1em', fontSize:'.85rem' }}>NEXT</span>}
            </div>
          ))}
        </section>
      </div>

      <footer style={{ textAlign:'center', color:'rgba(255,255,255,.5)', fontSize:'.9rem' }}>
        Please keep your token number ready · Urgent cases may be seen first
      </footer>
    </div>
  );
}
