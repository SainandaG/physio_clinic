import { useEffect, useState } from 'react';
import API from '../api/client';

// Fallback so the website still names the clinic's physiotherapist if the API is unreachable
export const LEAD_DOCTOR_FALLBACK = { id: null, name: 'Dr Tharun', qualification: 'MPT (Sports & Manual Therapy)' };

export const doctorLabel = (d) => (d ? [d.name, d.qualification].filter(Boolean).join(', ') : '');

// Active doctors, lead doctor first. Pickers only need to appear when there is more than one.
export default function useDoctors() {
  const [doctors, setDoctors] = useState([]);
  useEffect(() => {
    API.get('/api/doctors').then(r => setDoctors(r.data)).catch(() => {});
  }, []);
  return {
    doctors,
    lead: doctors[0] || LEAD_DOCTOR_FALLBACK,
    multiple: doctors.length > 1,
  };
}
