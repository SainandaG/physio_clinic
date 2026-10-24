import React, { useState } from 'react';
import { MessageSquare, Calendar, CheckCircle2, Sparkles, Clock, Activity } from 'lucide-react';
import { ClinicService } from '../types/clinic';
import { openWhatsApp } from '../utils/whatsapp';
import { CLINIC_WHATSAPP_NUMBER } from '../data/initialData';

interface ServicesSectionProps {
  services: ClinicService[];
  onSelectServiceForBooking: (serviceTitle: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  onSelectServiceForBooking
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = [
    'All',
    'Spine & Posture',
    'Sports & Athletic',
    'Joint & Ortho',
    'Neurological',
    'Specialized Modalities'
  ];

  const filteredServices = selectedCategory === 'All'
    ? services
    : services.filter(s => s.category === selectedCategory);

  return (
    <section id="services" className="py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="text-xs font-bold uppercase tracking-wider text-[#C89B3C] mb-2 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#C89B3C]" />
            <span>Specialized Clinical Therapies · No Generic Routines</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#0A1C38] tracking-tight leading-tight">
            Evidence-Based Physical Rehabilitation
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Every clinical intervention is tailored to your unique anatomical diagnosis and functional movement goals. 
            Connect directly with our physical therapists via WhatsApp or request an in-clinic diagnostic assessment.
          </p>
        </div>

        {/* Category Filters (interactive segmented controls) */}
        <div className="flex flex-wrap items-center gap-2 mb-10 pb-2 border-b border-slate-200">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0A1C38] text-white shadow-sm'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Services Grid (NO PRICING - Prominent WhatsApp Consultation & Booking) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className="rounded-2xl bg-white border border-slate-200 hover:border-[#C89B3C]/60 transition-all duration-300 shadow-sm hover:shadow-md flex flex-col justify-between overflow-hidden group"
            >
              {/* Card Header & Content */}
              <div className="p-6">
                
                {/* Category & Duration indicator */}
                <div className="flex items-center justify-between text-xs text-slate-500 mb-3">
                  <span className="font-semibold text-[#0A1C38]">{service.category}</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{service.sessionDuration}</span>
                  </span>
                </div>

                {/* Service Title */}
                <h3 className="font-display text-xl font-bold text-[#0A1C38] group-hover:text-[#C89B3C] transition-colors leading-snug mb-2">
                  {service.title}
                </h3>

                {/* Tagline */}
                <p className="text-xs font-medium text-slate-500 mb-3 italic">
                  "{service.tagline}"
                </p>

                {/* Description */}
                <p className="text-sm text-slate-600 leading-relaxed mb-5">
                  {service.description}
                </p>

                {/* What We Treat (Indications) */}
                <div className="mb-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-2">
                    Conditions Treated:
                  </div>
                  <ul className="space-y-1.5">
                    {service.indications.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#C89B3C] shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Clinical Modalities Used */}
                <div className="pt-3 border-t border-slate-100 mb-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Key Modalities & Techniques:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {service.modalities.map((mod, idx) => (
                      <span 
                        key={idx}
                        className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200"
                      >
                        {mod}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Care duration hint (NO PRICING) */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Typical Protocol:</span>
                  <span className="font-semibold text-slate-800">{service.averageSessions}</span>
                </div>

              </div>

              {/* Card Footer: WhatsApp Direct Action & Booking Action (NO PRICING) */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
                {/* Primary WhatsApp Action */}
                <button
                  type="button"
                  onClick={() => openWhatsApp(service.whatsappMessage, CLINIC_WHATSAPP_NUMBER)}
                  className="w-full py-2.5 px-4 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-white" />
                  <span>Consult via WhatsApp</span>
                </button>

                {/* Secondary Appointment Action */}
                <button
                  type="button"
                  onClick={() => onSelectServiceForBooking(service.title)}
                  className="w-full py-2 px-3 text-xs font-semibold text-[#0A1C38] hover:text-white bg-white hover:bg-[#0A1C38] border border-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Schedule Clinic Visit</span>
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
