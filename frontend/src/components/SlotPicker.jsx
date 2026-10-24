import React, { useEffect, useState } from 'react';
import API from '../api/client';
import { TIME_SLOTS } from '../utils/slots';

// Admin date + slot chooser that shows who already holds each slot.
// `ownApptId` / `ownEnquiryId` mark the record being edited so its own slot isn't shown as a clash.
export function describeSlot(s, { ownApptId, ownEnquiryId } = {}) {
  if (!s) return '';
  const appts = s.appointments.filter(a => a.id !== ownApptId);
  // Matches the server: when booking an enquiry, only earlier requests take precedence
  const enqs = s.enquiries.filter(e => ownEnquiryId == null || e.id < ownEnquiryId);
  if (s.reason === 'closed') return 'Closed / on leave';
  if (s.block) return `Blocked${s.block.reason ? ` · ${s.block.reason}` : ''}`;
  const who = [...appts.map(a => a.patient), ...enqs.map(e => `${e.name} (request)`)];
  if (who.length >= s.capacity) return `Booked · ${who.join(', ')}`;
  return s.past ? 'Free (past)' : 'Free';
}

export default function SlotPicker({ date, slot, onChange, ownApptId, ownEnquiryId, doctorId }) {
  const [day, setDay] = useState(null);

  useEffect(() => {
    if (!date) return;
    setDay(null);
    API.get('/api/schedule/day', { params: { date, doctor_id: doctorId || undefined } }).then(r => setDay(r.data)).catch(() => {});
  }, [date, doctorId]);

  const info = day?.slots.find(s => s.slot === slot);
  const status = describeSlot(info, { ownApptId, ownEnquiryId });
  const clash = status && !status.startsWith('Free');

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 10 }}>
        <div className="field">
          <label>Date *</label>
          <input type="date" required value={date} onChange={e => onChange({ date: e.target.value, slot })} />
        </div>
        <div className="field">
          <label>Time slot *</label>
          <select required value={slot || ''} onChange={e => onChange({ date, slot: e.target.value })}>
            <option value="">Select slot</option>
            {TIME_SLOTS.map(s => (
              <option key={s} value={s}>
                {s}{day ? ` — ${describeSlot(day.slots.find(x => x.slot === s), { ownApptId, ownEnquiryId })}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>
      {clash && (
        <div style={{ marginTop: -6, marginBottom: 14, padding: '9px 12px', borderRadius: 8, background: 'var(--gold-tint)', color: 'var(--gold-deep)', fontSize: '.8rem', fontWeight: 600 }}>
          ⚠️ {status}
        </div>
      )}
    </>
  );
}
