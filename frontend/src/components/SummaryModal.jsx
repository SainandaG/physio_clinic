// Treatment summary for one appointment: the doctor writes notes, previews/prints the letterhead PDF,
// and sends it to the patient on WhatsApp (automatically via the Business API, or with a WhatsApp link).
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { LuFileText, LuPrinter, LuDownload, LuSend, LuCheck, LuTriangleAlert, LuClock, LuX } from 'react-icons/lu';
import API from '../api/client';
import { errorMessage } from '../utils/slots';

const when = (iso) => new Date(iso).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata' });

function SendStatus({ s }) {
  if (s.send_status === 'sent') return <span className="sum-status ok"><LuCheck /> Sent on WhatsApp automatically · {when(s.sent_at)}</span>;
  if (s.send_status === 'shared') return <span className="sum-status ok"><LuCheck /> Shared via WhatsApp · {when(s.sent_at)}</span>;
  if (s.send_status === 'failed') return <span className="sum-status bad"><LuTriangleAlert /> Not sent: {s.send_error}</span>;
  return <span className="sum-status"><LuClock /> Not sent yet</span>;
}

export default function SummaryModal({ appt, justCompleted, onClose }) {
  const [summary, setSummary] = useState(null);
  const [form, setForm] = useState(null);
  const [apiReady, setApiReady] = useState(false);
  const [busy, setBusy] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    Promise.all([API.post(`/api/summaries/for-appointment/${appt.id}`), API.get('/api/summaries/status')])
      .then(([s, st]) => {
        setSummary(s.data);
        setApiReady(st.data.api_configured);
        setForm({
          title: s.data.title || '', findings: s.data.findings || '', notes: s.data.notes || '',
          exercises: (s.data.exercises || []).join('\n'), follow_up_date: s.data.follow_up_date || '',
        });
      })
      .catch(err => { toast.error(errorMessage(err, 'Could not open the summary')); onClose(); });
  }, [appt.id]);

  const set = (patch) => { setForm(f => ({ ...f, ...patch })); setDirty(true); };

  const save = async (quiet) => {
    const { data } = await API.put(`/api/summaries/${summary.id}`, {
      title: form.title || null, findings: form.findings, notes: form.notes,
      exercises: form.exercises.split('\n'), follow_up_date: form.follow_up_date || null,
    });
    setSummary(data); setDirty(false);
    if (!quiet) toast.success('Summary saved');
    return data;
  };

  const run = (label, fn) => async () => {
    setBusy(label);
    try { await fn(); } catch (err) { toast.error(errorMessage(err, 'Something went wrong')); } finally { setBusy(''); }
  };

  // Open the tab straight away (pop-up blockers allow only direct clicks), then point it at the PDF
  const openPdf = (download) => run(download ? 'download' : 'print', async () => {
    const tab = window.open('', '_blank');
    try {
      const s = await save(true);
      if (tab) tab.location.href = download ? `${s.url}?download=true` : s.url;
    } catch (err) { tab?.close(); throw err; }
  });

  const send = run('send', async () => {
    const tab = apiReady ? null : window.open('', '_blank');
    try {
      await save(true);
      const { data } = await API.post(`/api/summaries/${summary.id}/send`);
      setSummary(data.summary);
      if (data.channel === 'api') toast.success(`Sent to ${appt.patient?.name} on WhatsApp`);
      else if (tab) { tab.location.href = data.wa_url; toast.success('WhatsApp opened — press send there'); }
    } catch (err) { tab?.close(); throw err; }
  });

  const close = () => { if (!dirty || confirm('Close without saving your notes?')) onClose(); };

  return (
    <div className="sum-overlay" onClick={e => { if (e.target === e.currentTarget) close(); }}>
      <div className="sum-modal" role="dialog" aria-label="Treatment summary">
        <div className="sum-head">
          <div>
            <h2><LuFileText /> Treatment summary</h2>
            <p>{appt.patient?.name}{appt.service ? ` · ${appt.service.name}` : ''}{appt.scheduled_at ? ` · ${new Date(appt.scheduled_at).toLocaleDateString('en-IN', { dateStyle: 'medium', timeZone: 'Asia/Kolkata' })}` : ''}</p>
          </div>
          <button className="sum-x" onClick={close} aria-label="Close"><LuX /></button>
        </div>

        {!form ? <div className="dash-empty">Preparing…</div> : (
          <>
            {justCompleted && (
              <div className="notice notice-info" style={{ marginBottom: 16 }}>
                {apiReady && summary.send_status !== 'sent'
                  ? 'Treatment completed. The summary is being sent on WhatsApp automatically — add notes below and send again if you want them included.'
                  : 'Treatment completed. Add your notes for the patient, then send the summary on WhatsApp.'}
              </div>
            )}
            <div className="sum-meta"><SendStatus s={summary} /></div>

            <div className="field">
              <label>Assessment <span className="sum-opt">optional</span></label>
              <textarea value={form.findings} onChange={e => set({ findings: e.target.value })} style={{ minHeight: 64 }}
                placeholder="e.g. Right shoulder impingement with reduced overhead movement" />
            </div>
            <div className="field">
              <label>Doctor's notes</label>
              <textarea value={form.notes} onChange={e => set({ notes: e.target.value })} style={{ minHeight: 130 }}
                placeholder="Treatment given today, advice, precautions, what to expect…" />
              <span style={{ fontSize: '.76rem', color: 'var(--muted)' }}>Printed on the clinic letterhead and shared with the patient. Internal chart notes are not included.</span>
            </div>
            <div className="sum-grid">
              <div className="field">
                <label>Home exercises <span className="sum-opt">one per line</span></label>
                <textarea value={form.exercises} onChange={e => set({ exercises: e.target.value })} style={{ minHeight: 110 }}
                  placeholder={'Wall slides — 3 × 10\nBand rotation — 3 × 12'} />
              </div>
              <div>
                <div className="field">
                  <label>Next follow-up</label>
                  <input type="date" value={form.follow_up_date} onChange={e => set({ follow_up_date: e.target.value })} />
                </div>
                <div className="field">
                  <label>Document title <span className="sum-opt">optional</span></label>
                  <input value={form.title} onChange={e => set({ title: e.target.value })} placeholder="Treatment Summary" maxLength={120} />
                </div>
              </div>
            </div>

            <div className="sum-actions">
              <button className="btn btn-outline btn-sm" disabled={!!busy || !dirty} onClick={run('save', () => save())}>{busy === 'save' ? 'Saving…' : 'Save'}</button>
              <button className="btn btn-outline btn-sm" disabled={!!busy} onClick={openPdf(false)}><LuPrinter /> Preview & print</button>
              <button className="btn btn-outline btn-sm" disabled={!!busy} onClick={openPdf(true)}><LuDownload /> PDF</button>
              <button className="btn btn-wa" disabled={!!busy || !appt.patient?.phone} onClick={send} style={{ marginLeft: 'auto' }}>
                <LuSend /> {busy === 'send' ? 'Sending…' : summary.send_status === 'not_sent' ? 'Send on WhatsApp' : 'Send again'}
              </button>
            </div>
            {!apiReady && (
              <p className="sum-foot">
                WhatsApp opens with the message and a link to the PDF ready — press send there. To send automatically when treatment is completed, connect the WhatsApp Business API (see README).
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
