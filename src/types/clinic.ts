export type PatientSource = 'Website' | 'Walk-in / Direct' | 'WhatsApp' | 'Doctor Referral';

export type PatientStatus = 
  | 'Booked' 
  | 'Checked-In' 
  | 'In Consultation' 
  | 'In Therapy' 
  | 'Completed' 
  | 'Cancelled';

export type TriagePriority = 'Routine' | 'Moderate' | 'Acute / Urgent';

export interface PatientRecord {
  id: string;
  tokenNumber: string; // e.g. "TK-104"
  name: string;
  phone: string;
  email?: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  source: PatientSource;
  condition: string; // e.g. "Cervical Spondylosis & Radiating Pain"
  painScale: number; // 1 to 10
  priority: TriagePriority;
  assignedDoctor: string;
  status: PatientStatus;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:MM
  checkInTime?: string;
  completionTime?: string;
  notes?: string;
  prescribedExercises?: string[];
  followUpDate?: string;
  treatmentRoom?: string;
  createdAt: string;
}

export interface ClinicService {
  id: string;
  title: string;
  category: 'Spine & Posture' | 'Sports & Athletic' | 'Joint & Ortho' | 'Neurological' | 'Specialized Modalities';
  tagline: string;
  description: string;
  indications: string[];
  modalities: string[];
  treatmentPhases: string[];
  averageSessions: string;
  sessionDuration: string;
  isAvailable: boolean;
  whatsappMessage: string;
}

export interface DoctorProfile {
  id: string;
  name: string;
  qualification: string;
  designation: string;
  specialization: string;
  experienceYears: number;
  availableDays: string;
  timing: string;
}

export interface ClinicBranch {
  id: string;
  name: string;
  address: string;
  landmark: string;
  phone: string;
  whatsapp: string;
  email: string;
  hours: string;
  googleMapsUrl: string;
}
