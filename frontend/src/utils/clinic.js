// Shared admin helpers: labels, WhatsApp templates and CSV export
import { prettyDate } from './slots';

export const CLINIC_LOCATION = 'Masid Banda, Kondapur, Hyderabad';

export const STATUS_LABELS = {
  pending: 'Pending', confirmed: 'Confirmed', checked_in: 'Checked-in',
  in_therapy: 'In Therapy', completed: 'Completed', cancelled: 'Cancelled',
};
export const SOURCE_LABELS = { walk_in: '🚶 Walk-in', website: '🌐 Website', whatsapp: '💬 WhatsApp', referral: '🩺 Referral' };
export const PRIORITY_LABELS = { routine: 'Routine', moderate: 'Moderate', urgent: '⚠ Urgent' };

// Mirrors triage_priority() on the server
export const triagePriority = (pain) => (pain >= 8 ? 'urgent' : pain >= 5 ? 'moderate' : 'routine');

export const waNumber = (phone) => {
  const digits = (phone || '').replace(/\D/g, '');
  return digits.startsWith('91') ? digits : `91${digits}`;
};
export const waLink = (phone, text) => `https://wa.me/${waNumber(phone)}?text=${encodeURIComponent(text)}`;

const timeOf = (iso) => new Date(iso).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
const dateOf = (iso) => new Date(iso).toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });

// Join message lines, dropping skipped (null) lines; '' keeps a paragraph break
const lines = (arr) => arr.filter(l => l != null).join('\n');

export const reminderMessage = (a) => lines([
  `Dear ${a.patient?.name || 'patient'},`,
  ``,
  `Greetings from Srini Physio Clinics. Your appointment reminder:`,
  a.scheduled_at ? `• Date: ${prettyDate(dateOf(a.scheduled_at))}` : null,
  a.scheduled_at ? `• Time: ${timeOf(a.scheduled_at)}` : null,
  a.token_number ? `• Token: ${a.token_number}` : null,
  a.doctor ? `• Specialist: ${a.doctor.name}` : null,
  ``,
  `Location: ${CLINIC_LOCATION}.`,
  `Please arrive 10 minutes early. Reply 'OK' to confirm.`,
]);

export const exercisePlanMessage = (a) => lines([
  `Hello ${a.patient?.name || ''},`,
  ``,
  `Here is your home exercise plan from ${a.doctor?.name || 'your physiotherapist'}, Srini Physio Clinics:`,
  ``,
  ...(a.exercises || []).map((ex, i) => `${i + 1}. ${ex}`),
  ``,
  a.follow_up_date ? `📅 Next follow-up: ${prettyDate(a.follow_up_date)}` : null,
  `Stop any exercise that causes sharp or shooting pain, and message us if symptoms get worse.`,
]);

// Download appointments as a CSV file
export function exportAppointmentsCsv(appts) {
  const headers = ['Token', 'Patient', 'Phone', 'Age', 'Gender', 'Source', 'Doctor', 'Service', 'Pain', 'Priority',
    'Scheduled', 'Status', 'Checked in', 'Completed', 'Follow-up', 'Exercises', 'Notes'];
  const cell = (v) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const when = (iso) => (iso ? new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) : '');
  const rows = appts.map(a => [
    a.token_number, a.patient?.name, a.patient?.phone, a.patient?.age, a.patient?.gender,
    a.source, a.doctor?.name, a.service?.name, a.pain_level, a.priority, when(a.scheduled_at), a.status,
    when(a.checked_in_at), when(a.completed_at), a.follow_up_date, (a.exercises || []).join('; '), a.notes,
  ].map(cell).join(','));
  const blob = new Blob(['﻿' + [headers.join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `srini_physio_appointments_${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}
