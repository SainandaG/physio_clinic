import React from 'react';
import { MapPin, Clock, Phone, MessageSquare, ExternalLink } from 'lucide-react';
import { CLINIC_BRANCHES } from '../data/initialData';
import { openWhatsApp } from '../utils/whatsapp';

export const BranchesSection: React.FC = () => {
  return (
    <section id="branches" className="py-20 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="max-w-3xl mb-12">
          <div className="text-xs font-bold uppercase tracking-wider text-[#C89B3C] mb-2">
            Clinic Centers & Contact
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-extrabold text-[#0A1C38] tracking-tight leading-tight">
            Visit Our Specialized Rehabilitation Centers
          </h2>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Direct walk-in admissions are welcome at both centers. Appointments receive priority triage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {CLINIC_BRANCHES.map((branch) => (
            <div 
              key={branch.id}
              className="rounded-2xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#C89B3C]">
                      Full Rehabilitation Facility
                    </span>
                    <h3 className="font-display text-xl font-bold text-[#0A1C38] mt-1">
                      {branch.name}
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-[#0A1C38] shrink-0">
                    <MapPin className="w-5 h-5 text-[#C89B3C]" />
                  </div>
                </div>

                <div className="space-y-3 text-xs sm:text-sm text-slate-600">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                    <div>
                      <p className="text-slate-800 font-medium">{branch.address}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Landmark: {branch.landmark}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <span>{branch.hours}</span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="font-mono text-slate-800 font-semibold">{branch.phone}</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => openWhatsApp(`Hello, I want to visit ${branch.name}. Please confirm the timing and directions.`, branch.whatsapp)}
                  className="flex-1 py-2.5 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp Center</span>
                </button>

                <a
                  href="https://maps.google.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <span>Directions</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
