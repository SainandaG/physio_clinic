import React from 'react';
import { Award, Clock, Calendar, CheckCircle2, MessageSquare } from 'lucide-react';
import { INITIAL_DOCTORS, CLINIC_WHATSAPP_NUMBER } from '../data/initialData';
import { openWhatsApp } from '../utils/whatsapp';

interface DoctorsSectionProps {
  onOpenBooking: () => void;
}

export const DoctorsSection: React.FC<DoctorsSectionProps> = ({ onOpenBooking }) => {
  return (
    <section id="specialists" className="py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="text-xs font-bold uppercase tracking-wider text-[#C89B3C] mb-2 flex items-center gap-1.5">
            <Award className="w-4 h-4 text-[#C89B3C]" />
            <span>Consultant Physiotherapists & Clinical Directors</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#0A1C38] tracking-tight leading-tight">
            Meet Our Senior Physical Therapy Team
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            All assessments and treatment interventions are directed by credentialed Master of Physiotherapy (MPT) specialists with advanced international certifications in manual therapy, sports taping, and neurological rehabilitation.
          </p>
        </div>

        {/* Doctors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {INITIAL_DOCTORS.map((doctor) => (
            <div
              key={doctor.id}
              className="rounded-2xl bg-white border border-slate-200 hover:border-[#C89B3C]/50 transition-all p-6 shadow-sm flex flex-col justify-between"
            >
              <div>
                {/* Doctor Avatar / Badge */}
                <div className="w-16 h-16 rounded-2xl bg-[#0A1C38] text-[#C89B3C] flex items-center justify-center font-display font-extrabold text-2xl mb-4 shadow-sm border border-amber-500/30">
                  {doctor.name.split(' ')[1]?.[0] || 'D'}
                  {doctor.name.split(' ')[2]?.[0] || 'R'}
                </div>

                <div className="text-xs font-bold text-[#C89B3C] uppercase tracking-wider">
                  {doctor.experienceYears}+ Years Clinical Practice
                </div>

                <h3 className="font-display text-xl font-bold text-[#0A1C38] mt-1 mb-1">
                  {doctor.name}
                </h3>

                <p className="text-xs font-semibold text-slate-700 mb-1">
                  {doctor.qualification}
                </p>

                <p className="text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded inline-block mb-3">
                  {doctor.designation}
                </p>

                <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
                  <div>
                    <strong className="text-slate-900 block mb-0.5">Clinical Specialization:</strong>
                    <span>{doctor.specialization}</span>
                  </div>

                  <div className="flex items-start gap-1.5 pt-1 text-slate-500">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{doctor.availableDays} · {doctor.timing}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openWhatsApp(`Hello, I would like to consult with ${doctor.name} at Srini Physio Clinics.`, CLINIC_WHATSAPP_NUMBER)}
                  className="flex-1 py-2 px-3 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp</span>
                </button>

                <button
                  type="button"
                  onClick={onOpenBooking}
                  className="flex-1 py-2 px-3 text-xs font-bold text-white bg-[#0A1C38] hover:bg-[#132E5A] rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5 text-[#C89B3C]" />
                  <span>Book Visit</span>
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
