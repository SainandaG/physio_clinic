import React, { useState } from 'react';
import { X, Calendar, Clock, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';
import { PatientRecord, ClinicService } from '../types/clinic';
import { INITIAL_DOCTORS, CLINIC_WHATSAPP_NUMBER } from '../data/initialData';
import { openWhatsApp, getAppointmentWhatsAppMessage } from '../utils/whatsapp';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddPatient: (patient: PatientRecord) => void;
  services: ClinicService[];
  prefilledService?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onAddPatient,
  services,
  prefilledService = ''
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState<number | ''>(32);
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [selectedService, setSelectedService] = useState(prefilledService || (services[0]?.title ?? 'Spine & Posture Rehabilitation'));
  const [conditionNotes, setConditionNotes] = useState('');
  const [painScale, setPainScale] = useState<number>(6);
  const [appointmentDate, setAppointmentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [appointmentTime, setAppointmentTime] = useState('11:00');
  const [assignedDoctor, setAssignedDoctor] = useState(INITIAL_DOCTORS[0].name);
  const [submittedRecord, setSubmittedRecord] = useState<PatientRecord | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const tokenNumber = `TK-${Math.floor(100 + Math.random() * 900)}`;
    const newPatient: PatientRecord = {
      id: `pt-web-${Date.now()}`,
      tokenNumber,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      age: Number(age) || 30,
      gender,
      source: 'Website', // MARKED AS WEBSITE PER SPEC
      condition: `${selectedService}${conditionNotes ? ` - ${conditionNotes}` : ''}`,
      painScale,
      priority: painScale >= 8 ? 'Acute / Urgent' : painScale >= 5 ? 'Moderate' : 'Routine',
      assignedDoctor,
      status: 'Booked',
      appointmentDate,
      appointmentTime,
      createdAt: new Date().toISOString()
    };

    onAddPatient(newPatient);
    setSubmittedRecord(newPatient);
  };

  const handleResetAndClose = () => {
    setSubmittedRecord(null);
    setName('');
    setPhone('');
    setEmail('');
    setConditionNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-[#0A1C38] text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#C89B3C]" />
            <h3 className="font-display font-bold text-lg">
              Book Physical Therapy Consultation
            </h3>
          </div>
          <button
            type="button"
            onClick={handleResetAndClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Successful Booking View */}
        {submittedRecord ? (
          <div className="p-6 sm:p-8 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="text-center space-y-2">
              <h4 className="font-display text-2xl font-bold text-[#0A1C38]">
                Appointment Confirmed!
              </h4>
              <p className="text-sm text-slate-600">
                Your entry has been automatically synchronized to the Clinic Reception queue with source tag <strong className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">Website</strong>.
              </p>
            </div>

            {/* Token & Detail Card */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs sm:text-sm">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="text-slate-500">Allocated Token:</span>
                <span className="font-mono text-lg font-extrabold text-[#0A1C38] bg-white px-2.5 py-0.5 rounded border border-slate-300">
                  {submittedRecord.tokenNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Patient Name:</span>
                <span className="font-semibold text-slate-900">{submittedRecord.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Clinical Focus:</span>
                <span className="font-medium text-slate-800">{submittedRecord.condition}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Date & Slot:</span>
                <span className="font-semibold text-slate-900">{submittedRecord.appointmentDate} at {submittedRecord.appointmentTime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Lead Specialist:</span>
                <span className="text-slate-800">{submittedRecord.assignedDoctor}</span>
              </div>
            </div>

            {/* Direct WhatsApp Share button */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  const msg = getAppointmentWhatsAppMessage(
                    submittedRecord.name,
                    submittedRecord.condition,
                    submittedRecord.appointmentDate,
                    submittedRecord.appointmentTime
                  );
                  openWhatsApp(msg, CLINIC_WHATSAPP_NUMBER);
                }}
                className="w-full py-3 px-4 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Confirm Instantly via WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={handleResetAndClose}
                className="w-full py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Done / Close Window
              </button>
            </div>
          </div>
        ) : (
          /* Intake Booking Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
            
            <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                Online bookings are automatically registered with source: <strong>Website</strong> in the clinic admin desk.
              </span>
            </div>

            {/* Patient Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A1C38]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Phone (WhatsApp Active) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98450 12345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A1C38]"
                />
              </div>
            </div>

            {/* Age, Gender & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Age
                </label>
                <input
                  type="number"
                  min="1"
                  max="110"
                  value={age}
                  onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A1C38]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Gender
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A1C38]"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="you@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A1C38]"
                />
              </div>
            </div>

            {/* Service / Specialization */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Requested Clinical Service
              </label>
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A1C38]"
              >
                {services.map((svc) => (
                  <option key={svc.id} value={svc.title}>
                    {svc.title} ({svc.category})
                  </option>
                ))}
              </select>
            </div>

            {/* Pain Scale (1 to 10) */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Current Pain Level: <strong className="text-amber-700">{painScale} / 10</strong>
                </label>
                <span className="text-[11px] text-slate-500">
                  {painScale <= 3 ? 'Mild discomfort' : painScale <= 6 ? 'Moderate pain / stiffness' : 'Severe acute pain'}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={painScale}
                onChange={(e) => setPainScale(Number(e.target.value))}
                className="w-full accent-[#C89B3C] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>1 - Minimal</span>
                <span>5 - Moderate</span>
                <span>10 - Severe</span>
              </div>
            </div>

            {/* Specific Condition Details */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Symptoms or Prior Diagnosis
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Sharp pain when bending forward, MRI diagnosed L5 disc bulge 2 weeks ago..."
                value={conditionNotes}
                onChange={(e) => setConditionNotes(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A1C38]"
              />
            </div>

            {/* Date, Time & Doctor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Preferred Date
                </label>
                <input
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A1C38]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Preferred Slot
                </label>
                <select
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A1C38]"
                >
                  <option value="09:00">09:00 AM (Morning)</option>
                  <option value="10:00">10:00 AM (Morning)</option>
                  <option value="11:00">11:00 AM (Morning)</option>
                  <option value="12:00">12:00 PM (Noon)</option>
                  <option value="16:00">04:00 PM (Evening)</option>
                  <option value="17:00">05:00 PM (Evening)</option>
                  <option value="18:00">06:00 PM (Evening)</option>
                  <option value="19:00">07:00 PM (Evening)</option>
                </select>
              </div>
            </div>

            {/* Doctor */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Consulting Specialist
              </label>
              <select
                value={assignedDoctor}
                onChange={(e) => setAssignedDoctor(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A1C38]"
              >
                {INITIAL_DOCTORS.map((doc) => (
                  <option key={doc.id} value={doc.name}>
                    {doc.name} - {doc.specialization}
                  </option>
                ))}
              </select>
            </div>

            {/* Submit */}
            <div className="pt-4 border-t border-slate-200">
              <button
                type="submit"
                className="w-full py-3 px-4 text-sm font-bold text-slate-950 bg-[#C89B3C] hover:bg-[#DFB253] rounded-lg transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4" />
                <span>Confirm Appointment Registration</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
