// Clinic time slots — labels must match backend/app/slots.py
export const TIME_SLOTS = [
  '09:00 AM (Morning)',
  '10:00 AM (Morning)',
  '11:00 AM (Morning)',
  '12:00 PM (Noon)',
  '02:00 PM (Afternoon)',
  '03:00 PM (Afternoon)',
  '04:00 PM (Afternoon)',
  '05:00 PM (Evening)',
  '06:00 PM (Evening)',
];

// Today's date in clinic time (IST), as YYYY-MM-DD
export const clinicToday = () =>
  new Date(Date.now() + 330 * 60000).toISOString().split('T')[0];

export const slotHour = (slot) => {
  const [, h, ampm] = slot.match(/^(\d{2}):\d{2} (AM|PM)/);
  return (Number(h) % 12) + (ampm === 'PM' ? 12 : 0);
};

// ISO timestamp for a slot, pinned to IST so it's stored correctly regardless of the browser's timezone
export const toScheduledAt = (date, slot) =>
  `${date}T${String(slotHour(slot)).padStart(2, '0')}:00:00+05:30`;

// Inverse of toScheduledAt: { date, slot } in clinic time, slot is null for off-slot times
export const fromScheduledAt = (iso) => {
  const ist = new Date(new Date(iso).getTime() + 330 * 60000).toISOString();
  const hour = Number(ist.slice(11, 13));
  return { date: ist.slice(0, 10), slot: TIME_SLOTS.find(s => slotHour(s) === hour) || null };
};

export const prettyDate = (date) =>
  new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });

export const isSlotConflict = (err) =>
  err.response?.status === 409 && err.response?.data?.detail?.code === 'slot_unavailable';

// Run `send(force)`; on a slot clash let an admin confirm a deliberate double-booking.
// Resolves true if saved, false if the admin declined; other errors are rethrown.
export const sendWithOverbook = async (send, isAdmin) => {
  try {
    await send(false);
    return true;
  } catch (err) {
    if (!isSlotConflict(err) || !isAdmin) throw err;
    if (!window.confirm(`${err.response.data.detail.message}\n\nBook anyway and double-book this slot?`)) return false;
    await send(true);
    return true;
  }
};

// Readable message from an API error; slot conflicts return a structured detail
export const errorMessage = (err, fallback = 'Something went wrong') => {
  const detail = err.response?.data?.detail;
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  if (detail.message) return detail.message;
  if (Array.isArray(detail)) return detail.map(d => d.msg).join(', ');
  return fallback;
};
