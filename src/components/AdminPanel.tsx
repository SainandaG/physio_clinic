import React, { useState } from 'react';
import { 
  Users, UserPlus, Filter, Search, Calendar, Phone, 
  MessageSquare, FileText, CheckCircle, Clock, 
  Activity, ArrowUpDown, Download, Server, Database, 
  Monitor, X, Plus, AlertCircle, ChevronRight, Stethoscope
} from 'lucide-react';
import { PatientRecord, PatientSource, PatientStatus, TriagePriority, ClinicService } from '../types/clinic';
import { INITIAL_DOCTORS, CLINIC_WHATSAPP_NUMBER } from '../data/initialData';
import { openWhatsApp, getAdminReminderWhatsAppMessage, getExercisePrescriptionWhatsAppMessage } from '../utils/whatsapp';

interface AdminPanelProps {
  patients: PatientRecord[];
  onUpdatePatient: (patient: PatientRecord) => void;
  onAddPatient: (patient: PatientRecord) => void;
  services: ClinicService[];
  onBackToWebsite: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  patients,
  onUpdatePatient,
  onAddPatient,
  services,
  onBackToWebsite
}) => {
  // Filters & Search
  const [sourceFilter, setSourceFilter] = useState<'All' | PatientSource>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | PatientStatus>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isWalkInModalOpen, setIsWalkInModalOpen] = useState(false);
  const [selectedPatientForNotes, setSelectedPatientForNotes] = useState<PatientRecord | null>(null);
  const [showArchGuide, setShowArchGuide] = useState(false);
  const [isTvDisplayMode, setIsTvDisplayMode] = useState(false);

  // Walk-in form state
  const [walkInName, setWalkInName] = useState('');
  const [walkInPhone, setWalkInPhone] = useState('');
  const [walkInAge, setWalkInAge] = useState<number | ''>(45);
  const [walkInGender, setWalkInGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [walkInCondition, setWalkInCondition] = useState('');
  const [walkInPainScale, setWalkInPainScale] = useState(7);
  const [walkInPriority, setWalkInPriority] = useState<TriagePriority>('Moderate');
  const [walkInDoctor, setWalkInDoctor] = useState(INITIAL_DOCTORS[0].name);
  const [walkInRoom, setWalkInRoom] = useState('Consultation Room A');

  // Exercise input for patient clinical chart
  const [newExercise, setNewExercise] = useState('');

  // Source Counts
  const websiteCount = patients.filter(p => p.source === 'Website').length;
  const walkInCount = patients.filter(p => p.source === 'Walk-in / Direct').length;
  const whatsAppCount = patients.filter(p => p.source === 'WhatsApp').length;
  const inConsultCount = patients.filter(p => p.status === 'In Consultation' || p.status === 'In Therapy').length;
  const waitingCount = patients.filter(p => p.status === 'Checked-In').length;

  // Filtered Patients
  const filteredPatients = patients.filter(p => {
    const matchesSource = sourceFilter === 'All' || p.source === sourceFilter;
    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesQuery = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tokenNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery) ||
      p.condition.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSource && matchesStatus && matchesQuery;
  });

  // Handle Walk-in Registration
  const handleRegisterWalkIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName.trim() || !walkInPhone.trim()) return;

    const nextTokenNum = 100 + patients.length + 1;
    const newRecord: PatientRecord = {
      id: `pt-walkin-${Date.now()}`,
      tokenNumber: `TK-${nextTokenNum}`,
      name: walkInName.trim(),
      phone: walkInPhone.trim(),
      age: Number(walkInAge) || 40,
      gender: walkInGender,
      source: 'Walk-in / Direct', // MARKED AS DIRECT / WALK-IN PER SPEC
      condition: walkInCondition.trim() || 'Acute Musculoskeletal Consultation',
      painScale: walkInPainScale,
      priority: walkInPriority,
      assignedDoctor: walkInDoctor,
      status: 'Checked-In', // Walk-ins immediately check in
      appointmentDate: new Date().toISOString().split('T')[0],
      appointmentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      treatmentRoom: walkInRoom,
      notes: 'Direct walk-in patient registered at clinic front desk.',
      createdAt: new Date().toISOString()
    };

    onAddPatient(newRecord);
    setIsWalkInModalOpen(false);
    setWalkInName('');
    setWalkInPhone('');
    setWalkInCondition('');
  };

  // Status changer helper
  const handleStatusChange = (patient: PatientRecord, newStatus: PatientStatus) => {
    const updated = {
      ...patient,
      status: newStatus,
      checkInTime: newStatus === 'Checked-In' && !patient.checkInTime 
        ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        : patient.checkInTime,
      completionTime: newStatus === 'Completed'
        ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : patient.completionTime
    };
    onUpdatePatient(updated);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Token', 'Source', 'Name', 'Phone', 'Condition', 'PainScale', 'Priority', 'Doctor', 'Status', 'Date', 'Time'];
    const rows = patients.map(p => [
      p.tokenNumber,
      p.source,
      `"${p.name}"`,
      p.phone,
      `"${p.condition}"`,
      p.painScale,
      p.priority,
      `"${p.assignedDoctor}"`,
      p.status,
      p.appointmentDate,
      p.appointmentTime
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `srini_physio_patients_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // TV Waiting Room Screen Mode
  if (isTvDisplayMode) {
    return (
      <div className="min-h-screen bg-[#071326] text-white p-6 sm:p-10 font-sans flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-white/10 pb-6">
          <div className="flex items-center gap-4">
            <span className="font-display font-extrabold text-3xl text-white">
              SRINI <span className="text-[#C89B3C]">PHYSIO CLINICS</span>
            </span>
            <span className="text-sm font-mono text-slate-400">
              Live Token & Waiting Room Display
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsTvDisplayMode(false)}
            className="px-4 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 rounded-lg text-white"
          >
            Exit TV Display Mode
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 my-8">
          {/* Currently In Therapy / Consultation */}
          <div className="rounded-2xl bg-slate-900/80 border border-[#C89B3C]/50 p-6 space-y-4">
            <div className="text-sm font-bold uppercase tracking-wider text-[#DFB253] flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
              <span>Now Serving in Treatment & Consultation</span>
            </div>
            <div className="space-y-3">
              {patients.filter(p => p.status === 'In Consultation' || p.status === 'In Therapy').map(p => (
                <div key={p.id} className="p-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <div className="font-mono text-3xl font-extrabold text-[#DFB253]">
                      {p.tokenNumber}
                    </div>
                    <div className="text-xl font-bold text-white mt-1">
                      {p.name}
                    </div>
                    <div className="text-xs text-slate-400">
                      {p.assignedDoctor} · {p.treatmentRoom || 'Main Bay'}
                    </div>
                  </div>
                  <span className="px-3 py-1 text-xs font-bold bg-[#C89B3C] text-slate-950 rounded-lg uppercase">
                    {p.status}
                  </span>
                </div>
              ))}
              {patients.filter(p => p.status === 'In Consultation' || p.status === 'In Therapy').length === 0 && (
                <div className="text-slate-500 text-center py-10 font-medium">
                  Next tokens will be called shortly.
                </div>
              )}
            </div>
          </div>

          {/* Up Next in Waiting Room */}
          <div className="rounded-2xl bg-slate-900/80 border border-white/15 p-6 space-y-4">
            <div className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Up Next (Waiting)
            </div>
            <div className="space-y-3">
              {patients.filter(p => p.status === 'Checked-In').map(p => (
                <div key={p.id} className="p-3.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-2xl font-bold text-white">
                      {p.tokenNumber}
                    </span>
                    <span className="text-base font-semibold text-slate-200 ml-3">
                      {p.name}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400">
                    Checked in {p.checkInTime}
                  </div>
                </div>
              ))}
              {patients.filter(p => p.status === 'Checked-In').length === 0 && (
                <div className="text-slate-500 text-center py-10 font-medium">
                  No patients waiting in queue currently.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-slate-400 border-t border-white/10 pt-4">
          Please keep your phone active on WhatsApp for direct exercise routines and prescription updates.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 pb-20">
      
      {/* Admin Sub-Header */}
      <div className="bg-[#0A1C38] text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono text-[#DFB253] uppercase tracking-wider mb-1">
                <span>Srini Physio Clinics · Operational Control</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white">
                Clinic Reception & Patient Intake Desk
              </h1>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Register Walk-in Button */}
              <button
                type="button"
                onClick={() => setIsWalkInModalOpen(true)}
                className="px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-950 bg-[#C89B3C] hover:bg-[#DFB253] rounded-lg transition-colors shadow-sm flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4 text-slate-950" />
                <span>+ Customer Entry (Walk-In)</span>
              </button>

              {/* Architecture Blueprint Button */}
              <button
                type="button"
                onClick={() => setShowArchGuide(true)}
                className="px-3 py-2 text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                title="View FastAPI + PostgreSQL architecture suggestions"
              >
                <Database className="w-3.5 h-3.5 text-[#DFB253]" />
                <span className="hidden sm:inline">FastAPI / pgAdmin Stack</span>
              </button>

              {/* Waiting Room TV screen */}
              <button
                type="button"
                onClick={() => setIsTvDisplayMode(true)}
                className="px-3 py-2 text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1.5"
                title="Open fullscreen TV waiting screen"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">TV Token Screen</span>
              </button>

              {/* Export CSV */}
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-2 text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/20 rounded-lg transition-colors flex items-center gap-1.5"
                title="Export patient records to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export CSV</span>
              </button>
            </div>
          </div>

          {/* Source Attribution & Live Patient Metrics Bar */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 border-t border-white/10 text-xs">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-slate-400 block">Total Inflow Today</span>
              <span className="font-display font-bold text-xl text-white tabular-nums">
                {patients.length}
              </span>
            </div>

            {/* WEBSITE SOURCE STAT */}
            <div className="p-3 rounded-lg bg-blue-950/40 border border-blue-400/30">
              <span className="text-blue-300 font-semibold block flex items-center gap-1">
                <span>Source: Website</span>
              </span>
              <span className="font-display font-bold text-xl text-blue-200 tabular-nums">
                {websiteCount}
              </span>
              <span className="text-[10px] text-blue-300/80">Online Booking Form</span>
            </div>

            {/* DIRECT WALK-IN SOURCE STAT */}
            <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-400/30">
              <span className="text-amber-300 font-semibold block flex items-center gap-1">
                <span>Source: Walk-in / Direct</span>
              </span>
              <span className="font-display font-bold text-xl text-amber-200 tabular-nums">
                {walkInCount}
              </span>
              <span className="text-[10px] text-amber-300/80">Clinic Front Desk</span>
            </div>

            <div className="p-3 rounded-lg bg-white/5 border border-white/10">
              <span className="text-slate-400 block">Waiting in Lobby</span>
              <span className="font-display font-bold text-xl text-amber-400 tabular-nums">
                {waitingCount}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-white/5 border border-white/10 col-span-2 sm:col-span-1">
              <span className="text-slate-400 block">In Therapy / Consult</span>
              <span className="font-display font-bold text-xl text-emerald-400 tabular-nums">
                {inConsultCount}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        
        {/* Search, Source Filters & Status Filters */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Source Selector Segmented Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg w-full md:w-auto overflow-x-auto">
            <span className="text-xs font-bold text-slate-500 px-2 shrink-0">Source:</span>
            {(['All', 'Website', 'Walk-in / Direct', 'WhatsApp'] as const).map(source => (
              <button
                key={source}
                type="button"
                onClick={() => setSourceFilter(source)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                  sourceFilter === source
                    ? 'bg-[#0A1C38] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {source}
                {source === 'Website' && ` (${websiteCount})`}
                {source === 'Walk-in / Direct' && ` (${walkInCount})`}
              </button>
            ))}
          </div>

          {/* Search Input & Status Dropdown */}
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search patient, phone, token..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A1C38]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 text-xs font-medium border border-slate-300 rounded-lg bg-white text-slate-700"
            >
              <option value="All">All Statuses</option>
              <option value="Booked">Booked</option>
              <option value="Checked-In">Checked-In (Waiting)</option>
              <option value="In Consultation">In Consultation</option>
              <option value="In Therapy">In Therapy</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

        </div>

        {/* Patient Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0A1C38]" />
              <h2 className="font-display font-bold text-base text-[#0A1C38]">
                Patient Admissions & Triage Queue ({filteredPatients.length})
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Showing active clinic records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3.5 px-4">Token</th>
                  <th className="py-3.5 px-4">Patient & Demographics</th>
                  <th className="py-3.5 px-4">Source Channel</th>
                  <th className="py-3.5 px-4">Complaint / Condition</th>
                  <th className="py-3.5 px-4">Pain / Triage</th>
                  <th className="py-3.5 px-4">Consultant</th>
                  <th className="py-3.5 px-4">Current Status</th>
                  <th className="py-3.5 px-4 text-right">Quick Dispatch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredPatients.map((patient) => {
                  const isWebsite = patient.source === 'Website';
                  const isWalkIn = patient.source === 'Walk-in / Direct';

                  return (
                    <tr key={patient.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Token */}
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                        <span className="px-2 py-1 rounded bg-slate-100 border border-slate-200 text-xs">
                          {patient.tokenNumber}
                        </span>
                      </td>

                      {/* Patient Name & Phone */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-sm">{patient.name}</div>
                        <div className="text-slate-500 text-[11px] flex items-center gap-2 mt-0.5">
                          <span>{patient.gender}, {patient.age}y</span>
                          <span>·</span>
                          <span className="font-mono">{patient.phone}</span>
                        </div>
                      </td>

                      {/* Source Channel (PROMINENT ATTR) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isWebsite ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                            Website
                          </span>
                        ) : isWalkIn ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                            Walk-in / Direct
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            {patient.source}
                          </span>
                        )}
                      </td>

                      {/* Complaint */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-medium text-slate-800 truncate" title={patient.condition}>
                          {patient.condition}
                        </div>
                        {patient.treatmentRoom && (
                          <div className="text-[11px] text-slate-500">
                            Room: {patient.treatmentRoom}
                          </div>
                        )}
                      </td>

                      {/* Pain Scale & Priority */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-slate-800">
                            {patient.painScale}/10
                          </span>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            patient.priority === 'Acute / Urgent'
                              ? 'bg-red-100 text-red-800'
                              : patient.priority === 'Moderate'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {patient.priority}
                          </span>
                        </div>
                      </td>

                      {/* Consultant */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-700">
                        <div className="font-medium">{patient.assignedDoctor.split(',')[0]}</div>
                        <div className="text-[10px] text-slate-400">{patient.appointmentTime}</div>
                      </td>

                      {/* Current Status (with quick changer) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={patient.status}
                          onChange={(e) => handleStatusChange(patient, e.target.value as PatientStatus)}
                          className={`px-2 py-1 rounded-md text-xs font-semibold border cursor-pointer ${
                            patient.status === 'Completed'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : patient.status === 'In Therapy' || patient.status === 'In Consultation'
                              ? 'bg-[#C89B3C]/15 text-amber-950 border-[#C89B3C]'
                              : patient.status === 'Checked-In'
                              ? 'bg-sky-50 text-sky-800 border-sky-300'
                              : 'bg-slate-50 text-slate-700 border-slate-300'
                          }`}
                        >
                          <option value="Booked">Booked</option>
                          <option value="Checked-In">Checked-In (Waiting)</option>
                          <option value="In Consultation">In Consultation</option>
                          <option value="In Therapy">In Therapy</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>

                      {/* Actions: Clinical Notes & WhatsApp */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Open Clinical Chart / Notes */}
                          <button
                            type="button"
                            onClick={() => setSelectedPatientForNotes(patient)}
                            className="p-1.5 text-slate-600 hover:text-[#0A1C38] hover:bg-slate-100 rounded-lg transition-colors"
                            title="Open Clinical Chart & Prescriptions"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Quick WhatsApp Reminder */}
                          <button
                            type="button"
                            onClick={() => {
                              const msg = getAdminReminderWhatsAppMessage(
                                patient.name,
                                patient.tokenNumber,
                                patient.appointmentTime,
                                patient.assignedDoctor
                              );
                              openWhatsApp(msg, patient.phone);
                            }}
                            className="p-1.5 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Send WhatsApp Token Reminder to Patient"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredPatients.length === 0 && (
              <div className="p-12 text-center text-slate-500">
                No patient records match the selected filter.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* WALK-IN CUSTOMER ENTRY MODAL (DIRECT PATIENTS) */}
      {isWalkInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-[#0A1C38] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#C89B3C]" />
                <h3 className="font-display font-bold text-lg">
                  Direct Customer Entry (Walk-In Patient Intake)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWalkInModalOpen(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterWalkIn} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="text-xs text-amber-900 bg-amber-50 p-3 rounded-lg border border-amber-200">
                Patients registered here will automatically be tagged with <strong>Source: "Walk-in / Direct"</strong> and issued an immediate clinic queue token.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Meera Krishnan"
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A1C38]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98450 12345"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A1C38]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Age
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="110"
                    value={walkInAge}
                    onChange={(e) => setWalkInAge(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0A1C38]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Gender
                  </label>
                  <select
                    value={walkInGender}
                    onChange={(e) => setWalkInGender(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Triage Priority
                  </label>
                  <select
                    value={walkInPriority}
                    onChange={(e) => setWalkInPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    <option value="Routine">Routine</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Acute / Urgent">Acute / Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Presenting Complaint & Pain Area *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acute Lumbar Spasm, Unable to sit, Sudden pain after lifting"
                  value={walkInCondition}
                  onChange={(e) => setWalkInCondition(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Pain Scale: <strong className="text-amber-700">{walkInPainScale} / 10</strong>
                  </label>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={walkInPainScale}
                  onChange={(e) => setWalkInPainScale(Number(e.target.value))}
                  className="w-full accent-[#C89B3C] cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Assigned Doctor
                  </label>
                  <select
                    value={walkInDoctor}
                    onChange={(e) => setWalkInDoctor(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    {INITIAL_DOCTORS.map(doc => (
                      <option key={doc.id} value={doc.name}>{doc.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Treatment Bay / Room
                  </label>
                  <select
                    value={walkInRoom}
                    onChange={(e) => setWalkInRoom(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg"
                  >
                    <option value="Consultation Room A">Consultation Room A</option>
                    <option value="Spine Suite 1">Spine Suite 1</option>
                    <option value="Sports Rehab Bay">Sports Rehab Bay</option>
                    <option value="Manual Therapy Suite">Manual Therapy Suite</option>
                    <option value="Neuro Gym">Neuro Gym</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <button
                  type="submit"
                  className="w-full py-3 text-sm font-bold text-slate-950 bg-[#C89B3C] hover:bg-[#DFB253] rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Issue Walk-in Token & Admit to Queue</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PATIENT CLINICAL CHART & EXERCISE PRESCRIPTION MODAL */}
      {selectedPatientForNotes && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-[#0A1C38] text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-[#DFB253]">Token {selectedPatientForNotes.tokenNumber}</span>
                <h3 className="font-display font-bold text-lg">
                  Clinical Case Chart · {selectedPatientForNotes.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPatientForNotes(null)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs sm:text-sm">
              {/* Summary strip */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <span className="text-slate-500 text-xs block">Channel Source</span>
                  <span className="font-bold text-slate-900">{selectedPatientForNotes.source}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Pain Score</span>
                  <span className="font-bold text-amber-700">{selectedPatientForNotes.painScale} / 10</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Phone</span>
                  <span className="font-mono text-slate-800">{selectedPatientForNotes.phone}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-xs block">Specialist</span>
                  <span className="font-semibold text-slate-800">{selectedPatientForNotes.assignedDoctor.split(',')[0]}</span>
                </div>
              </div>

              {/* Clinical Assessment Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Therapy Progress & Clinical Notes
                </label>
                <textarea
                  rows={3}
                  value={selectedPatientForNotes.notes || ''}
                  onChange={(e) => {
                    const updated = { ...selectedPatientForNotes, notes: e.target.value };
                    setSelectedPatientForNotes(updated);
                    onUpdatePatient(updated);
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#0A1C38]"
                  placeholder="Record treatment modalities, degrees of motion, mobilization grades..."
                />
              </div>

              {/* Prescribed Exercises */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Prescribed Home Rehabilitation Exercises
                </label>
                <div className="space-y-2 mb-3">
                  {(selectedPatientForNotes.prescribedExercises || []).map((ex, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-amber-50/60 border border-amber-200 text-xs text-slate-800">
                      <span>• {ex}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updatedList = (selectedPatientForNotes.prescribedExercises || []).filter((_, i) => i !== idx);
                          const updated = { ...selectedPatientForNotes, prescribedExercises: updatedList };
                          setSelectedPatientForNotes(updated);
                          onUpdatePatient(updated);
                        }}
                        className="text-red-600 hover:text-red-800 font-bold px-1"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {(!selectedPatientForNotes.prescribedExercises || selectedPatientForNotes.prescribedExercises.length === 0) && (
                    <div className="text-xs text-slate-400 italic">No home exercises entered yet.</div>
                  )}
                </div>

                {/* Add Exercise */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Scapular retractions (10 reps x 3 sets)"
                    value={newExercise}
                    onChange={(e) => setNewExercise(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newExercise.trim()) return;
                      const list = [...(selectedPatientForNotes.prescribedExercises || []), newExercise.trim()];
                      const updated = { ...selectedPatientForNotes, prescribedExercises: list };
                      setSelectedPatientForNotes(updated);
                      onUpdatePatient(updated);
                      setNewExercise('');
                    }}
                    className="px-3 py-2 text-xs font-bold text-white bg-[#0A1C38] rounded-lg"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Follow-up Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Follow-Up Review Date
                  </label>
                  <input
                    type="date"
                    value={selectedPatientForNotes.followUpDate || ''}
                    onChange={(e) => {
                      const updated = { ...selectedPatientForNotes, followUpDate: e.target.value };
                      setSelectedPatientForNotes(updated);
                      onUpdatePatient(updated);
                    }}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Send Routine to Patient
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const msg = getExercisePrescriptionWhatsAppMessage(
                        selectedPatientForNotes.name,
                        selectedPatientForNotes.prescribedExercises || ['Custom clinical advice provided during session.'],
                        selectedPatientForNotes.followUpDate
                      );
                      openWhatsApp(msg, selectedPatientForNotes.phone);
                    }}
                    className="w-full py-2 px-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer mt-0.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp Prescription</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedPatientForNotes(null)}
                className="px-4 py-2 text-xs font-bold text-white bg-[#0A1C38] rounded-lg"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FASTAPI & POSTGRESQL / PGADMIN ARCHITECTURE RECOMMENDATIONS DRAWER */}
      {showArchGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-[#0A1C38] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-[#C89B3C]" />
                <h3 className="font-display font-bold text-lg">
                  Backend Architecture: Python FastAPI + PostgreSQL + pgAdmin
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowArchGuide(false)}
                className="text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-xs sm:text-sm">
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-slate-800 space-y-1">
                <div className="font-bold text-amber-950">Recommended Production Blueprint:</div>
                <p>
                  As requested in your brief, here is the full recommended architecture for running 
                  <strong> Srini Physio Clinics</strong> with a <strong>Python FastAPI backend</strong>, 
                  <strong> PostgreSQL database</strong>, managed via <strong>pgAdmin 4</strong>, and 
                  integrated with <strong>React Frontend</strong>.
                </p>
              </div>

              {/* 1. PostgreSQL Schema for pgAdmin */}
              <div className="space-y-2">
                <h4 className="font-bold text-[#0A1C38] uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-[#C89B3C]" />
                  1. PostgreSQL DDL Schema (Run in pgAdmin Query Tool)
                </h4>
                <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`-- Create Enum Types
CREATE TYPE patient_source_type AS ENUM ('Website', 'Walk-in / Direct', 'WhatsApp', 'Doctor Referral');
CREATE TYPE appointment_status_type AS ENUM ('Booked', 'Checked-In', 'In Consultation', 'In Therapy', 'Completed', 'Cancelled');
CREATE TYPE triage_priority_type AS ENUM ('Routine', 'Moderate', 'Acute / Urgent');

-- Patients Table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token_number VARCHAR(20) NOT NULL,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(25) NOT NULL,
    email VARCHAR(150),
    age INT,
    gender VARCHAR(10),
    source patient_source_type NOT NULL DEFAULT 'Website',
    presenting_condition TEXT NOT NULL,
    pain_scale INT CHECK (pain_scale >= 1 AND pain_scale <= 10),
    priority triage_priority_type DEFAULT 'Routine',
    assigned_doctor VARCHAR(150),
    status appointment_status_type DEFAULT 'Booked',
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    check_in_time TIME,
    treatment_room VARCHAR(50),
    clinical_notes TEXT,
    prescribed_exercises JSONB DEFAULT '[]'::jsonb,
    follow_up_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexing for fast reception queue queries
CREATE INDEX idx_patients_source ON patients(source);
CREATE INDEX idx_patients_status ON patients(status);
CREATE INDEX idx_patients_date ON patients(appointment_date);`}
                </pre>
              </div>

              {/* 2. Python FastAPI Backend Structure */}
              <div className="space-y-2">
                <h4 className="font-bold text-[#0A1C38] uppercase tracking-wider text-xs flex items-center gap-1.5">
                  <Server className="w-4 h-4 text-[#C89B3C]" />
                  2. Python FastAPI Controller (`main.py` & API Endpoints)
                </h4>
                <pre className="p-4 rounded-xl bg-slate-900 text-sky-300 font-mono text-[11px] overflow-x-auto leading-relaxed">
{`from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import models, schemas, database

app = FastAPI(title="Srini Physio Clinics API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/api/v1/patients/intake", response_model=schemas.PatientResponse)
def create_patient_intake(patient_data: schemas.PatientCreate, db: Session = Depends(database.get_db)):
    """
    Handles both Website online booking (source='Website') 
    and Reception walk-in desk (source='Walk-in / Direct').
    """
    token = database.generate_daily_token(db)
    db_patient = models.Patient(**patient_data.dict(), token_number=token)
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    return db_patient

@app.get("/api/v1/patients/queue", response_model=List[schemas.PatientResponse])
def get_daily_queue(source: Optional[str] = Query(None), db: Session = Depends(database.get_db)):
    query = db.query(models.Patient).filter(models.Patient.appointment_date == models.today())
    if source:
        query = query.filter(models.Patient.source == source)
    return query.order_by(models.Patient.created_at.asc()).all()`}
                </pre>
              </div>

              {/* 3. High-Value Recommended Features for Physio Clinics */}
              <div className="space-y-2">
                <h4 className="font-bold text-[#0A1C38] uppercase tracking-wider text-xs">
                  3. Key Architectural Recommendations for Peak Clinic Performance
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <strong className="text-slate-900 block mb-1">Automated WhatsApp Webhook (Meta Cloud API)</strong>
                    <span>
                      Trigger automatic 24-hour and 2-hour WhatsApp appointment reminders and send post-therapy exercise video links directly to patients.
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <strong className="text-slate-900 block mb-1">Pain Scale & ROM Progress Tracking</strong>
                    <span>
                      Track patient visual pain scores (1-10) and joint degrees of mobility across consecutive therapy sessions to measure recovery velocity.
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <strong className="text-slate-900 block mb-1">Multi-Branch Token Routing</strong>
                    <span>
                      Separate queues for Indiranagar Main Center and HSR Sports Hub while consolidating clinical charts under a unified patient telephone record.
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                    <strong className="text-slate-900 block mb-1">Kiosk / Waiting Room Smart Screen</strong>
                    <span>
                      Run the TV Display Mode on clinic reception monitors for real-time acoustic and visual token announcements.
                    </span>
                  </div>
                </div>
              </div>

            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setShowArchGuide(false)}
                className="px-4 py-2 text-xs font-bold text-white bg-[#0A1C38] rounded-lg"
              >
                Close Blueprint
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
